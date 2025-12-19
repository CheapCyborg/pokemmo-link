# PokeMMO Link - Project Roadmap & Goals

## Project Vision

Transform PokeMMO Link from a local real-time dashboard into a **social companion platform** where players can:

- Share their Pokemon teams publicly via trainer cards
- Add friends and view their party/daycare/PC (with privacy controls)
- Show off specific Pokemon, shinies, competitive teams
- Act as a public "trainer card" website similar to gym badges but for your living team

## Current State (Phase 1)

**Tech Stack:**

- Frontend: Next.js 15+ (App Router) + React 19 + TypeScript
- Agent: Kotlin/Java ByteBuddy memory snooper
- State: File-based JSON (`dump-party.json`, `dump-daycare.json`, `dump-pc_boxes.json`)
- Communication: HTTP POST from agent → Next.js `/api/ingest`
- UI: Shadcn/ui + Tailwind CSS 4
- Data Fetching: TanStack Query with 3s polling

**What Works:**

- ✅ Real-time extraction of party/daycare/PC data from PokeMMO memory
- ✅ Live dashboard showing your Pokemon with stats, IVs, EVs, moves
- ✅ Clean UI with type badges, nature displays, stat visualization
- ✅ PokeAPI integration for sprites and enrichment

**Limitations:**

- ❌ No persistence (data resets when agent stops)
- ❌ Single-user only (no authentication)
- ❌ No history tracking
- ❌ No social features (friends, sharing)
- ❌ No privacy controls

## Future Goals (Phase 2+)

### Core Features to Build

1. **User Authentication & Profiles**

   - Sign up with email or social login (Discord/Steam)
   - In-game name association
   - User settings and preferences

2. **Database Persistence**

   - Store all captured Pokemon data historically
   - Track when Pokemon were caught, leveled up, moved between containers
   - Metadata: shiny status, OT (original trainer), held items

3. **Friend System**

   - Send/accept friend requests
   - View friends' teams (with permission)
   - Friend activity feed

4. **Privacy Controls**

   - Toggle visibility: party, daycare, PC, profile
   - Per-container privacy (e.g., show party but hide PC)
   - Public/friends-only/private modes

5. **Public Trainer Cards**

   - Shareable URLs: `/trainer/[username]`
   - Display featured Pokemon, team composition
   - Stats like total Pokemon caught, shinies owned
   - Customizable layout and themes

6. **Player Data Extraction** (requires more packet decoding)
   - Player name, money, playtime
   - Badges, achievements, region progress
   - Inventory items (future consideration)

### Nice-to-Have Features

- **Search & Filter**: "Show me all my friends' shiny Dragonites"
- **Team Analytics**: Most popular team compositions, usage stats
- **Breeding Tracker**: Track breeding chains similar to pokemmohub
- **Live Updates**: WebSocket/SSE for real-time friend team updates
- **Notifications**: "Your friend just caught a shiny!"
- **Leaderboards**: Top teams, most shinies, etc.
- **Export**: Generate shareable images of your team

## Technology Recommendations

### Database: Supabase (PostgreSQL)

**Why Supabase over Firebase:**

- ✅ **Relational queries**: Complex friend/privacy relationships need JOINs
- ✅ **Row Level Security**: Database-level privacy enforcement
- ✅ **SQL power**: Easy analytics, full-text search, complex filters
- ✅ **Better pricing**: Fixed cost vs per-read (friend feeds = many reads)
- ✅ **Open source**: Self-hostable, no vendor lock-in
- ✅ **TypeScript types**: Auto-generated from schema
- ✅ **Real-time**: Built-in subscriptions via Postgres LISTEN/NOTIFY

**Firebase would work if:**

- You prefer NoSQL/document model
- You avoid complex relationships
- You prioritize Google ecosystem integration

### Proposed Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  in_game_name TEXT UNIQUE NOT NULL,
  discord_id TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now()
);

-- Pokemon table (stores all captured pokemon with history)
CREATE TABLE pokemon (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Identity
  species_id INT NOT NULL,
  form_id INT DEFAULT 0,
  nickname TEXT,
  is_shiny BOOLEAN DEFAULT false,
  gender TEXT, -- 'male', 'female', 'genderless'

  -- State
  level INT NOT NULL,
  experience INT,
  current_hp INT,
  max_hp INT,
  status TEXT, -- 'healthy', 'poisoned', 'burned', etc.

  -- Stats
  ivs JSONB, -- {hp: 31, atk: 20, def: 15, spa: 25, spd: 30, spe: 28}
  evs JSONB, -- {hp: 252, atk: 4, def: 0, spa: 0, spd: 0, spe: 252}
  nature TEXT,
  ability TEXT,

  -- Moves
  moves JSONB, -- [{slot: 0, move_id: 123, pp: 20, max_pp: 20}, ...]

  -- Location/Container
  container TEXT, -- 'party', 'daycare', 'pc_box_1', 'pc_box_2', etc.
  slot_index INT, -- Position within container
  box_number INT, -- For PC storage

  -- Metadata
  held_item TEXT,
  original_trainer TEXT,
  caught_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Index for fast lookups
  INDEX idx_pokemon_user_container (user_id, container),
  INDEX idx_pokemon_shiny (is_shiny) WHERE is_shiny = true,
  INDEX idx_pokemon_species (species_id)
);

-- Friendships (many-to-many with status)
CREATE TABLE friendships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id != friend_id), -- Can't friend yourself

  INDEX idx_friendships_status (status)
);

-- Privacy settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  party_visible BOOLEAN DEFAULT false,
  daycare_visible BOOLEAN DEFAULT false,
  pc_visible BOOLEAN DEFAULT false,
  profile_visible BOOLEAN DEFAULT true,
  show_shiny_only BOOLEAN DEFAULT false, -- Only show shinies to friends
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Example Row Level Security Policy
CREATE POLICY "Users can view friends' pokemon with permission"
ON pokemon FOR SELECT
USING (
  user_id = auth.uid() OR  -- Your own pokemon
  (
    container = 'party' AND EXISTS (
      SELECT 1 FROM privacy_settings ps
      JOIN friendships f ON ps.user_id = f.friend_id
      WHERE ps.user_id = pokemon.user_id
        AND f.user_id = auth.uid()
        AND f.status = 'accepted'
        AND ps.party_visible = true
    )
  )
);
```

### Architecture Evolution

**Current (Phase 1):**

```
PokeMMO → PokeSnooper → POST /api/ingest → dump-party.json
                                          ↓
                                  Next.js reads JSON → React UI
```

**Future (Phase 2):**

```
PokeMMO → PokeSnooper (with user_id token)
              ↓
          POST /api/ingest (authenticated)
              ↓
    ┌─────────────────────┐
    │  Next.js API Routes │
    │  - Validate user    │
    │  - Upsert pokemon   │
    │  - Update timestamp │
    └──────────┬──────────┘
               ↓
    ┌─────────────────────┐
    │  Supabase/Postgres  │
    │  - users            │
    │  - pokemon          │
    │  - friendships      │
    │  - privacy_settings │
    └──────────┬──────────┘
               ↓
    ┌─────────────────────┐
    │  Frontend Queries   │
    │  - My teams         │
    │  - Friends' teams   │
    │  - Public profiles  │
    └─────────────────────┘
```

### Recommended Tech Stack Additions

**Database & Backend:**

- **Supabase**: Auth + Database + Storage + Real-time
- **Drizzle ORM**: Type-safe SQL queries, lightweight
  - Alternative: Prisma (more batteries-included)

**State Management:**

- **Zustand**: Client-side state (UI preferences, filters)
  - Lighter than Context API, no provider hell

**Real-time (if needed):**

- **Supabase Realtime**: Postgres-based subscriptions
- **Server-Sent Events (SSE)**: For live friend updates
- **WebSockets**: If you need bidirectional communication

**Auth:**

- **Supabase Auth**: Built-in, integrates with database
- **Clerk**: If you prefer managed auth with social logins

**API Layer:**

- Keep Next.js API Routes for now
- Consider tRPC later for type-safe APIs

## Development Phases

### Phase 1: Current State ✅

- [x] Memory snooping with ByteBuddy
- [x] Real-time party/daycare/PC extraction
- [x] File-based state management
- [x] Live dashboard UI
- [x] TanStack Query polling

### Phase 2: Foundation (Next Steps)

- [ ] Set up Supabase project
- [ ] Create database schema (users, pokemon, privacy_settings)
- [ ] Implement user authentication
- [ ] Modify snooper to include user_id token
- [ ] Parallel writes: JSON files AND database
- [ ] User profile page

### Phase 3: Social Features

- [ ] Friend request system (send/accept/decline)
- [ ] Privacy controls UI (toggles for party/daycare/PC)
- [ ] Friends dashboard (view friends' teams with permission)
- [ ] Friend activity feed

### Phase 4: Public Sharing

- [ ] Public trainer card pages (`/trainer/[username]`)
- [ ] Customizable featured Pokemon
- [ ] Shareable team compositions
- [ ] Export team as image

### Phase 5: Advanced Features

- [ ] Search/filter across friends' Pokemon
- [ ] Team analytics and stats
- [ ] Shiny showcase
- [ ] Breeding tracker
- [ ] Live notifications

### Phase 6: Polish & Scale

- [ ] WebSocket/SSE for real-time updates
- [ ] Performance optimization (caching, CDN)
- [ ] Mobile-responsive improvements
- [ ] Dark/light theme customization
- [ ] Accessibility improvements

## Learning Resources

**Supabase:**

- Official Docs: https://supabase.com/docs
- Next.js Quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

**Drizzle ORM:**

- Docs: https://orm.drizzle.team
- Next.js Examples: https://orm.drizzle.team/docs/quick-start

**Zustand:**

- GitHub: https://github.com/pmndrs/zustand
- Docs: https://docs.pmnd.rs/zustand

**TanStack Query + Supabase:**

- https://tanstack.com/query/latest/docs/framework/react/examples/supabase

**Next.js 15:**

- App Router: https://nextjs.org/docs/app
- Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

**React 19 Features:**

- use() hook: https://react.dev/reference/react/use
- useOptimistic(): https://react.dev/reference/react/useOptimistic
- Actions: https://react.dev/reference/rsc/use-server

## Reference Projects

**pokemmohub** (https://github.com/PokeMMO-Tools/pokemmo-hub)

- Gatsby + React + Firebase
- Features: Breeding calculator, Pokedex, market tracking, cosmetics helper
- User accounts with Firebase Auth
- Settings sync across devices
- Trade ad system
- Good example of Firebase usage for isolated user data

**3s-PokeMMO-Tool** (https://github.com/muphy09/3s-PokeMMO-Tool)

- Another PokeMMO companion tool (check for architectural ideas)

## Success Metrics

**Phase 2 Success:**

- User can create account and log in
- Pokemon data persists to database
- User can view their own historical data

**Phase 3 Success:**

- Users can add friends
- Friends can view each other's teams with permission
- Privacy toggles work correctly

**Phase 4 Success:**

- Public trainer cards are shareable
- Non-users can view public profiles
- SEO-friendly URLs

## Notes & Decisions

**Why not real-time from the start?**

- Current 3s polling works fine for single user
- Add real-time only when friend feeds need it
- SSE is simpler than WebSockets for this use case

**Why Supabase instead of self-hosted Postgres?**

- Free tier is generous (500MB DB, 2GB bandwidth)
- Auth + RLS + Real-time included
- Can self-host later if needed
- Faster initial development

**Data Migration Strategy:**

- Keep JSON file output during transition
- Dual-write to JSON + DB during testing
- Phase out JSON once DB is stable
- Provides fallback if DB has issues

**Privacy-First Design:**

- Default to private (opt-in sharing)
- Clear UI for privacy controls
- Database-level enforcement (RLS)
- Audit logs for privacy changes (future)

## Questions to Answer

- [ ] How to handle user_id from snooper? (Config file, environment variable, CLI arg?)
- [ ] Should we store Pokemon history (all changes) or just current state?
- [ ] Rate limiting for API ingestion? (prevent abuse)
- [ ] How to handle offline mode? (cache writes, sync later?)
- [ ] Public API for third-party apps? (future consideration)

---

**Last Updated:** December 19, 2025
**Status:** Phase 1 Complete, Planning Phase 2
