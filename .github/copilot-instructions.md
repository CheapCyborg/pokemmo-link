# PokeMMO Link - Agent Instructions

<project_identity>
Real-time companion dashboard for PokeMMO displaying live Pokemon party, daycare, and PC box data.

**Architecture:** Monorepo with Next.js frontend + Kotlin packet snooper agent
**Phase:** Phase 1 (file-based, single-user, local-only)
**Future:** Phase 2+ social platform with auth, friends, public trainer cards (see ROADMAP.md)
</project_identity>

<tech_stack>
**Frontend (apps/web):**

- Next.js 16 App Router + React 19 + TypeScript (strict)
- Tailwind CSS 4 + Shadcn/ui
- TanStack Query v5 (3s polling)
- File-based JSON: `apps/web/data/`

**Agent (apps/agent):**

- Kotlin + Java + ByteBuddy
- Packet snooping via ByteBuddy hooks
- HTTP POST to `/api/ingest`
- CRITICAL: `PokeMMO.jar` required in `apps/agent/libs/`

**Data Flow:**

```
PokeMMO -> ByteBuddy Hooks -> JSON Serialization -> POST /api/ingest
  -> apps/web/data/ -> GET /api/state (3s poll) -> React Components
```

**Key Points:**

- Agent intercepts network packets, NOT memory
- Obfuscated field names change with PokeMMO updates
- PC boxes arrive in partial packets and are aggregated
- File-based persistence (no database in Phase 1)
  </tech_stack>

<core_types>
**File:** `apps/web/src/types/pokemon.ts`

**DumpEnvelope:**

```typescript
{
  schema_version: number
  captured_at_ms: number
  source: { packet_class, container_id, container_type, capacity? }
  pokemon: PokeDumpMon[]
}
```

**PokeDumpMon:**

```typescript
{
  slot: number
  identity: { uuid, species_id, form_id?, nickname, ot_name, personality_value, shiny?, is_gift?, is_alpha? }
  state: { level, nature, current_hp?, xp?, happiness? }
  stats: { ivs: StatBlock, evs: StatBlock }
  moves: MoveData[]
  ability: { id?, slot? }
  pokeapi_override?: string
}
```

**StatBlock:** `{ hp, atk, def, spa, spd, spe }`
</core_types>

<commands>
**Start:**
```powershell
npm run dev              # Both web + agent
npm run dev:web          # Next.js (localhost:3000)
npm run dev:agent        # Kotlin snooper
```

**Web (apps/web):**

```powershell
npm run build            # Production build
npm start                # Serve production
npm run lint             # ESLint validation
npm run lint:fix         # Auto-fix
npm run type-check       # TypeScript check
npm run format           # Prettier format
npm run format:check     # Check formatting
npm run clean            # Remove .next + data/dump-*.json
```

**Agent (apps/agent):**

```powershell
cd apps/agent
.\gradlew.bat build      # Compile to JAR
.\gradlew.bat runSnooper # Run snooper
.\gradlew.bat clean      # Clean build
```

</commands>

<code_patterns>
**Hooks (apps/web/src/hooks/):**

`useLiveData(source: ContainerType)` - Fetch /api/state with 3s polling
`useEnrichedPokemon(dumpData)` - Enrich with PokeAPI sprites/stats
`usePokeApi(speciesId)` - Fetch sprite/stats from PokeAPI proxy

**Pattern:** Use `useMemo` to prevent re-computation. Prefer client components for interactivity, server components for static content.

**API Routes (apps/web/src/app/api/):**

`/api/state/route.ts` - GET handler, reads JSON from `apps/web/data/`
`/api/ingest/route.ts` - POST handler, writes JSON to `apps/web/data/`
`/api/pokemon/[slug]/route.ts` - PokeAPI proxy for sprites/stats

**Snooper (apps/agent/src/main/java/Snooper.kt):**

**Obfuscated Field Mappings (Dec 2025):**

```kotlin
FIELD_SPECIES_ID = "QW0"
FIELD_LEVEL = "pt0"
FIELD_NICKNAME = "Uy0"
FIELD_EVS = "iM0"
FIELD_IVS_PACKED = "Tm1"
FIELD_MOVES = "y5"
FIELD_STATUS = "mp0"
FIELD_SLOT_INDEX_REAL = "Ch1"
FIELD_CONTAINER_INFO = "Dq1"
FIELD_CAPACITY = "qN1"
FIELD_FLAGS = "U30"  // Shiny/Gift flags
```

**CRITICAL:** These change with PokeMMO updates. Enable debug mode for `dump-debug-fields.txt` to rediscover mappings.

**PC Box Handling:**

- Arrives in partial packets, aggregated into `dump-pc_boxes.json`
- Global slot index: `boxNum = (globalSlot / 60) + 1`, `slotInBox = globalSlot % 60`
- Boxes: `box_1` to `box_11`, `account_box`, `extra_box_N`
  </code_patterns>

<workflows>
**Add New Pokemon Field:**
1. Define in `apps/web/src/types/pokemon.ts` (PokeDumpMon interface)
2. Extract in `apps/agent/src/main/java/Snooper.kt` via reflection
3. Update `schema_version` if breaking
4. Rebuild: `.\gradlew.bat build`
5. Update UI components
6. Test with live data

**Debug Extraction Issues:**

1. Verify `apps/web/data/dump-party.json` exists + recent `captured_at_ms`
2. Check Snooper console for "Synced to Next.js"
3. Inspect `dump-debug-fields.txt` for field changes
4. Clear React Query cache: `localStorage.removeItem('pokemmo-link-pokemon-cache-*')`
5. Check React Query DevTools
6. Verify PokeMMO running + party/daycare/PC open

**Update for PokeMMO Patches:**

1. Run PokeMMO with Snooper attached
2. Enable debug mode -> `dump-debug-fields.txt`
3. Compare field names with constants in Snooper.kt
4. Update obfuscated field mappings
5. Rebuild and test with known Pokemon data
6. Verify all containers (party, daycare, PC)

**Style New Components:**

- Use Tailwind utilities exclusively
- Mobile-first responsive: base, then `sm:`, `md:`, `lg:`
- Dark mode: prefix with `dark:`
- Color palette: slate (slate-50 to slate-950)
- Avoid inline styles, CSS modules, custom CSS
- Prefer server components unless interactivity required
  </workflows>

<critical_files>
**Frontend:**

- `apps/web/src/app/page.tsx` - Main dashboard
- `apps/web/src/app/api/state/route.ts` - State serving API
- `apps/web/src/app/api/ingest/route.ts` - Data ingestion
- `apps/web/src/types/pokemon.ts` - Type definitions
- `apps/web/src/hooks/useLiveData.ts` - TanStack Query hook
- `apps/web/src/components/pokemon/PokemonCard.tsx` - Card component
- `apps/web/src/lib/QueryProvider.tsx` - React Query config
- `apps/web/tailwind.config.ts` - Tailwind config
- `apps/web/data/dump-*.json` - Runtime data (git-ignored)

**Agent:**

- `apps/agent/src/main/java/Snooper.kt` - Main snooper logic
- `apps/agent/src/main/java/PokemonDumpSchema.kt` - JSON serialization
- `apps/agent/build.gradle.kts` - Gradle build
- `apps/agent/libs/PokeMMO.jar` - Required game JAR (not in repo)
- `apps/agent/dump-debug-fields.txt` - Debug field discovery

**Config:**

- `.github/copilot-instructions.md` - This file
- `.github/ROADMAP.md` - Project goals
- `package.json` - Root workspace scripts
- `apps/web/package.json` - Frontend dependencies

**Environment:**

- `.env.local` - Optional env vars (git-ignored)
- Default API URL: http://localhost:3000
  </critical_files>

<troubleshooting>
**App crashes on load:**
- Check browser console for ErrorBoundary
- Verify `apps/web/data/` exists
- Check for malformed JSON
- React Query DevTools for errors

**"No data yet" persists:**

- Verify Snooper running (check terminal)
- Confirm PokeMMO open and logged in
- Check Snooper console for HTTP errors
- Verify Next.js on port 3000
- Check `apps/web/data/` for recent dump-\*.json

**Pokemon sprites not loading:**

- Check network tab for PokeAPI errors
- Clear localStorage: `localStorage.clear()`
- Verify `/api/pokemon/[slug]` responding
- Check PokeAPI rate limiting

**Data extraction null/missing fields:**

- PokeMMO version changed (obfuscated fields updated)
- Check `dump-debug-fields.txt` for current mappings
- Compare with constants in Snooper.kt
- Update field names and rebuild
- Increment `schema_version` if breaking

**Port 3000 in use:**

- Kill Node: `taskkill /F /IM node.exe`
- Or change port in package.json
- Update NEXT_PUBLIC_API_URL

**Gradle build fails:**

- Verify `PokeMMO.jar` in `apps/agent/libs/`
- Check Java version: `java -version` (require 11+)
- Clean build: `.\gradlew.bat clean build`
- Check `apps/agent/build/reports/problems/`

**React Query not refetching:**

- Verify staleTime: 200000ms
- Verify refetchInterval: 3000ms
- Clear cache in DevTools
- Check network tab for /api/state every 3s
  </troubleshooting>

<behavior_rules>
**Follow User Instructions Exactly:**

- Answer the specific question or task requested
- Do NOT add features, improvements, or nice-to-haves unless asked
- Do NOT suggest additional work beyond scope
- Do NOT implement multiple things when one requested
- ASK if request unclear before proceeding

**When Editing Files:**

- Preserve existing formatting and indentation
- No unnecessary comments unless requested
- Follow existing patterns in file
- Test changes before considering complete
- Use #tool:edit/editFiles for precise edits
- Use #tool:read/file to read before editing

**When Creating Files:**

- Only create files explicitly requested
- Use consistent naming: PascalCase for components, camelCase for utilities
- Place in appropriate directory per existing structure
- Import existing dependencies from package.json
- Match existing code style
- Use #tool:edit/createFile

**When Troubleshooting:**

- Read error messages completely
- Verify file paths absolute and correct for Windows
- Check dependencies installed before suggesting code
- Reference existing working code as examples
- Use #tool:read/problems to check for errors
- Use #tool:execute/runInTerminal for commands

**When Suggesting Changes:**

- Only suggest changes asked for
- Prioritize existing patterns over new libraries
- Consider backward compatibility with Phase 1
- Reference ROADMAP.md for future architecture
- Avoid premature optimization
- Do not volunteer additional work

**Constraints:**

- No database in Phase 1 (file-based only)
- No authentication in Phase 1 (single-user)
- No external API calls except PokeAPI proxy
- Must maintain Snooper JSON format compatibility
- Must work offline (except PokeAPI enrichment)
  </behavior_rules>
