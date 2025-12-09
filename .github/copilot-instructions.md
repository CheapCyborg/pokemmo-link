# PokeMMO Link - AI Coding Agent Instructions

## Project Overview

PokeMMO Link is a **real-time companion dashboard** for the PokeMMO game. It consists of:

- **Frontend** (`apps/web`): Next.js 16 TypeScript app displaying live Pokémon data
- **Agent** (`apps/agent`): Kotlin/Java ByteBuddy-based memory snooper that extracts Pokémon data from PokeMMO's game memory

The two apps communicate via HTTP: the agent posts JSON dumps to the frontend, which serves them through file-based state APIs.

## Architecture & Data Flow

```
PokeMMO (Game Process)
    ↓ [ByteBuddy hooking packet handlers]
    ↓
PokeSnooper (Java agent) → writes dump-party.json, dump-daycare.json
    ↓ [HTTP POST to /api/ingest]
    ↓
Next.js `/api/state` → reads from data/*.json files
    ↓ [TanStack Query, 3s refresh]
    ↓
React Dashboard → displays Pokémon cards with live stats
```

### Key Data Schema

**DumpEnvelope** (`src/types/pokemon.ts`):
- Contains `schema_version`, `captured_at_ms`, `source` metadata, `pokemon[]` array
- Each `PokeDumpMon` includes identity (species, form, nickname), state (level, HP, status), stats (IVs/EVs), moves, ability

**Container Types** (from Snooper):
- Party: Capacity 6
- Daycare: Capacity 2 or 3
- PC Boxes: Capacity > 6 (aggregated into `dump-pc_boxes.json`)
  - Identified via obfuscated field `Dq1` (Container Info) -> `qN1` (Capacity)
  - PC Box Size: 60 slots per box
  - Uses `Ch1` (global slot index) to determine box number and slot within box

## Development Workflows### Run Development Servers
```powershell
# Root directory: starts both web and agent in parallel
npm run dev

# Or individually:
npm run dev:web        # Next.js on http://localhost:3000
npm run dev:agent      # Kotlin snooper (must have PokeMMO.jar in libs/)
```

### Web App Commands
```powershell
cd apps/web
npm run build          # Production build
npm start              # Run production server
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix style issues
npm run type-check     # TypeScript validation
npm run format         # Prettier formatting
npm run clean          # Remove .next and dump files
```

### Agent Build
```powershell
cd apps/agent
./gradlew.bat build    # Compile Kotlin
./gradlew.bat runSnooper  # Run memory snooper
```

## Code Patterns & Conventions

### React Hooks (Next.js App Router)
- **useLiveData**: Fetches state files via `/api/state?source=party|daycare` with 3s auto-refresh
  - Uses TanStack Query with `staleTime: 200000`
  - Returns `DumpEnvelope` type
- **useEnrichedPokemon**: Enriches dump data with PokeAPI sprites/stats
- **useMemo** used extensively to prevent re-renders (team data, filtering)

### API Routes
- **`/api/state?source=party|daycare|pc_boxes`**: File-based state serving (reads `data/dump-*.json`)
  - Returns empty state if file missing (graceful fallback)
- **`/api/pokemon/[slug]`**: PokeAPI sprite/stat proxy with caching
- **`/api/move/[id]`**: PokeAPI move data proxy
- No database; state is ephemeral JSON files updated by snooper

### TypeScript Patterns
- `DumpEnvelope` wraps all Pokemon data with metadata
- `PokeDumpMon` uses nested objects for identity, state, stats
- `StatBlock` type for IVs/EVs (hp, atk, def, spa, spd, spe)
- Container IDs and nature maps are constants in `Snooper.kt`

### UI Components
- **Shadcn/ui** primitives: Dialog, Separator, Slot, Tabs, Tooltip
- **Lucide React** icons for controls
- **Tailwind CSS 4** with dark mode via `next-themes`
- **ErrorBoundary** catches component crashes
- Skeleton loaders for async data states

### Field Mappings (Snooper)
Obfuscated PokeMMO fields are hardcoded:
```kotlin
// Pokemon data (f.LN)
FIELD_SPECIES_ID = "QW0"
FIELD_LEVEL = "pt0"
FIELD_NICKNAME = "Uy0"
FIELD_EVS = "iM0"
FIELD_IVS_PACKED = "Tm1"  // Packed into single int, extract via shifts
FIELD_MOVES = "y5"
FIELD_STATUS = "mp0"
FIELD_SLOT_INDEX_REAL = "Ch1" // Global slot index for PC storage
```
These must match the PokeMMO version or dumps fail silently. Check `dump-debug-fields.txt` if extraction breaks.

### PC Box Handling (Snooper)
- PC data arrives in partial packets.
- Snooper aggregates these into `dump-pc_boxes.json`.
- **Global Slot Index (`Ch1`)**: Used to determine the box and slot.
  - `boxNum = (globalSlot / 60) + 1`
  - `slotInBox = globalSlot % 60`
- Boxes are named `box_1` to `box_11`, `account_box`, and `extra_box_N`.

## Project-Specific Tips

### Debugging Live Data
1. Check `data/dump-party.json` exists and has recent `captured_at_ms`
2. Verify snooper console shows "✓ Synced to Next.js" messages
3. Clear React Query cache: `localStorage.removeItem('pokemmo-link-pokemon-cache-*')`
4. Browser dev tools: React Query DevTools tab shows cache state and refetch timing

### Updating Snooper Field Mappings
When PokeMMO updates and field names change:
1. Run PokeMMO with Snooper to generate `dump-debug-fields.txt`
2. Correlate dump output with game class structure
3. Update field names in `Snooper.kt` top section
4. Test with a fresh `./gradlew.bat runSnooper` and observe dumps

### Adding New Pokemon Data Fields
1. Add field to `PokeDumpMon` type in `src/types/pokemon.ts`
2. Extract in Snooper via reflection on `f.LN` object
3. Update component rendering (e.g., `PokemonCard.tsx`)
4. Increase `schema_version` in dump envelope if schema breaks compatibility

### Styling Guidelines
- Use Tailwind utility classes; avoid custom CSS unless necessary
- Dark mode uses `dark:` prefix (e.g., `dark:bg-slate-950`)
- Responsive: mobile-first design with `sm:`, `md:` breakpoints
- Colors follow slate palette (slate-50 through slate-950)

### Testing
- No automated tests currently configured
- Manual testing: run both servers, open PokeMMO, navigate party/daycare
- Check console logs for API errors or missing data

## Important Files to Know

- **Frontend entry**: `src/app/page.tsx` (main dashboard)
- **State API**: `src/app/api/state/route.ts` (file-based serving)
- **Type definitions**: `src/types/pokemon.ts` (DumpEnvelope, PokeDumpMon)
- **Snooper logic**: `apps/agent/src/main/java/Snooper.kt` (memory extraction, packet hooking)
- **React Query setup**: `src/lib/QueryProvider.tsx`
- **Tailwind config**: `tailwind.config.ts`
- **Environment vars**: `.env.local` (optional, uses defaults if missing)

## Troubleshooting Checklist

- **App crashes on load**: Check `ErrorBoundary` in browser console
- **"No data yet" status**: Snooper may not be running or PokeMMO not open
- **Stale Pokemon sprites**: PokeAPI cache expired; clear localStorage or wait for next refresh
- **Field extraction fails**: PokeMMO version mismatch; check `dump-debug-fields.txt` for correct field names
- **Port 3000 in use**: Kill existing Node process or change `NEXT_PUBLIC_API_URL`
