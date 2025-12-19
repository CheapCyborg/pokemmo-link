# PokeMMO Link - AI Agent Instructions

## Critical Context

PROJECT TYPE: Real-time companion dashboard for PokeMMO game
ARCHITECTURE: Monorepo with Next.js frontend + Kotlin memory snooper agent
CURRENT STATE: Phase 1 (file-based state, single-user, local-only)
FUTURE GOAL: Social platform with user auth, friends, public trainer cards (see .github/ROADMAP.md)

## System Components

### Frontend (apps/web)

- Framework: Next.js 16 (App Router) with React 19
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 4 + Shadcn/ui components
- State: TanStack Query v5 with 3-second polling
- Data source: File-based JSON dumps in apps/web/data/

### Agent (apps/agent)

- Language: Kotlin + Java
- Technique: ByteBuddy runtime instrumentation
- Target: PokeMMO.jar game process memory
- Output: JSON dumps POSTed to Next.js /api/ingest endpoint

### Communication Flow

```
PokeMMO Process
  -> ByteBuddy hooks packet handlers
  -> Snooper extracts data from obfuscated fields
  -> Writes dump-party.json, dump-daycare.json, dump-pc_boxes.json
  -> POSTs to http://localhost:3000/api/ingest
  -> Next.js writes to apps/web/data/
  -> /api/state serves JSON files
  -> React components fetch via TanStack Query
  -> UI updates every 3 seconds
```

## Type Definitions (apps/web/src/types/pokemon.ts)

### DumpEnvelope

Top-level wrapper for all Pokemon data dumps.

- schema_version: number (increment when breaking changes occur)
- captured_at_ms: number (Unix timestamp in milliseconds)
- source: "party" | "daycare" | "pc_boxes"
- pokemon: PokeDumpMon[]

### PokeDumpMon

Individual Pokemon data structure.

IDENTITY:

- species_id: number
- form_id: number
- nickname: string | null
- is_shiny: boolean
- gender: "male" | "female" | "genderless"

STATE:

- level: number
- current_hp: number
- max_hp: number
- status: string (healthy, poisoned, burned, asleep, frozen, paralyzed)

STATS:

- ivs: StatBlock (hp, atk, def, spa, spd, spe: all 0-31)
- evs: StatBlock (hp, atk, def, spa, spd, spe: all 0-255)
- nature: string (maps to stat modifiers)
- ability: striCommands

### Starting Development Environment

```powershell
npm run dev              # Root: runs both web and agent concurrently
npm run dev:web          # Next.js dev server (localhost:3000)
npm run dev:agent        # Kotlin snooper (requires PokeMMO.jar in apps/agent/libs/)
```

### Web App (apps/web)

```powershell
npm run build            # Production build (.next output)
npm start                # Serve production build
npm run lint             # ESLint validation
npm run lint:fix         # Auto-fix ESLint issues
npm run type-check       # TypeScript compilation check (no emit)
npm run format           # Prettier format all files
npm run format:check     # Check formatting without changes
npm run clean            # Remove .next and data/dump-*.json
```

### Agent (apps/agent)

```powershell
./gradlew.bat build      # Compile Kotlin to JAR
./gradlew.bat runSnooper # Run memory snooper (attaches to PokeMMO process)
```

REQUIREMENT: PokeMMO.jar must exist in apps/agent/libs/ for agent to compile and run.apps/web
npm run build # Production build
npm start # Run production server
npm run lint # ESLint check
npm run lint:fix # Auto-fix style issues
npm run type-check # TypeScript validation
npm run format # Prettier formatting
npm run clean # Remove .next and dump files

````

### Agent Build
```powershell
cd apps/agent
./gradlew.bat build    # Compile Kotlin
./gradlew.bat runSnooper  # Run memory snooper
````

## Code Patterns

### Custom Hooks (apps/web/src/hooks/)

useLiveData(source: "party" | "daycare" | "pc_boxes")

- Fetches /api/state?source={source}
- TanStack Query with 3-second refetch interval
- Returns DumpEnvelope or undefined
- staleTime: 200000ms (3min 20s)
- Handles graceful fallback if file missing

useEnrichedPokemon(dumpData: DumpEnvelope)

- Enriches Pokemon with PokeAPI sprites and base stats
- Uses parallel queries for each unique species
- Returns EnrichedPokemon[] with sprite URLs
- Caches PokeAPI responses in localStorage

usePokeApi(speciesId: number)

- Fetches sprite and base stats from PokeAPI proxy
- Endpoint: /api/pokemon/{species-id}
- Client-side caching via TanStack Query

PATTERN: Use useMemo to prevent re-computation on every render
PATTERN: Prefer client components for interactive features, server components for static content

### API Route Structure (apps/web/src/app/api/)

/api/state/route.ts

- GET handler with source query param
- Snooper Implementation (apps/agent/src/main/java/Snooper.kt)

### Obfuscated Field Mappings

PokeMMO uses obfuscated field names that change with game updates. Current mappings (as of Dec 2025):

```kotlin
FIELD_SPECIES_ID = "QW0"        // Pokemon species ID (1-649+)
FIELD_LEVEL = "pt0"             // Current level (1-100)
FIELD_NICKNAME = "Uy0"          // Custom nickname or null
FIELD_EVS = "iM0"               // Effort Values object
FIELD_IVS_PACKED = "Tm1"        // Individual Values (packed int, extract via bit shifts)
FIELD_MOVES = "y5"              // Move set array
FIELD_STATUS = "mp0"            // Status condition
FIELD_SLOT_INDEX_REAL = "Ch1"  // Global slot index for PC storage
FIELD_CONTAINER_INFO = "Dq1"   // Container metadata object
FIELD_CAPACITY = "qN1"          // Container capacity (6=party, 2-3=daycare, 60+=PC)
```

CRITICAL: These mappings fail silently when PokeMMO updates. Verify extraction by checking data/dump-party.json after game patches.

DEBUG PROCESS:

1. Enable debug mode in Snooper.kt to generate dump-debug-fields.txt
2. Correlate field names with expected values (e.g., level should be 1-100)
3. Common Workflows

### Adding New Pokemon Field

1. Define in apps/web/src/types/pokemon.ts (PokeDumpMon interface)
2. Extract in apps/agent/src/main/java/Snooper.kt via reflection
3. Update schema_version if breaking compatibility
4. Rebuild agent: ./gradlew.bat build
5. Update UI components (e.g., PokemonCard.tsx, PokemonStats.tsx)
6. Test with live game data

### Debugging Data Extraction Issues

1. Verify apps/web/data/dump-party.json exists and has recent captured_at_ms
2. Check Snooper console for "Synced to Next.js" success messages
3. Inspect dump-debug-fields.txt for field name changes
4. Clear React Query cache: localStorage.removeItem('pokemmo-link-pokemon-cache-\*')
5. Check React Query DevTools tab in browser (shows cache state and refetch timing)
6. Verify PokeMMO is running and party/daycare/PC is open

### Updating for PokeMMO Game Patches

1. Run PokeMMO with Snooper attached
2. Enable debug mode to generate dump-debug-fields.txt
3. Compare field names with constants in Snooper.kt
4. Update obfuscated field mappings as needed
5. Rebuild and test extraction with known Pokemon data
6. Verify all containers (party, daycare, PC) still extract correctly

### Styling New Components

RULES:

- Use Tailwind utility classes exclusively
- Follow mobile-first responsive design (base styles, then sm:, md:, lg: breakpoints)
- Dark mode: prefix utilities with dark: (e.g., dark:bg-slate-950)
- Color palette: slate (slate-50 to slate-950)
- SCritical File Paths

FRONTEND:

- apps/web/src/app/page.tsx - Main dashboard entry point
- apps/web/src/app/api/state/route.ts - File-based state serving API
- apps/web/src/app/api/ingest/route.ts - Data ingestion from Snooper
- apps/web/src/types/pokemon.ts - Core type definitions
- apps/web/src/hooks/useLiveData.ts - TanStack Query hook for polling
- apps/web/src/components/pokemon/PokemonCard.tsx - Card component
- apps/web/src/lib/QueryProvider.tsx - React Query configuration
- apps/web/tailwind.config.ts - Tailwind configuration
- apps/web/data/dump-\*.json - Runtime data files (git-ignored)

AGENT:

- apps/agent/src/main/java/Snooper.kt - Main snooper logic
- apps/agent/src/main/java/PokemonDumpSchema.kt - JSON serialization
- apps/agent/build.gradle.kts - Gradle build configuration
- apps/agent/libs/PokeMMO.jar - Required game JAR (not in repo)
- apps/agent/dump-debug-fields.txt - Debug output for field discovery

CONFIG:

- .github/copilot-instructions.md - This file
- .github/ROADMAP.md - Project goals and future architecture
- package.json - Root workspace scripts
- apps/web/package.json - Frontend dependencies

ENVIRONMENT:

- .env.local - Optional environment variables (git-ignored)
- Default API URL: http://localhost:3000

## Troubleshooting Decision Tree

SYMPTOM: App crashes on load

- Check browser console for ErrorBoundary output
- Verify apps/web/data/ directory exists
- Check for malformed JSON in dump files
- Ensure React Query DevTools shows no errors

SYMPTOM: "No data yet" message persists

- Verify Snooper is running (check terminal output)
- Confirm PokeMMO is open and logged in
- Check Snooper console for HTTP errors
- Verify Next.js dev server is running on port 3000
- Check apps/web/data/ for dump-\*.json files with recent timestamps

SYMPTOM: Pokemon sprites not loading

- Check browser network tab for PokeAPI proxy errors
- Clear localStorage: localStorage.clear()
- Verify /api/pokemon/[slug] route is responding
- Check for rate limiting from PokeAPI

SYMPTOM: Data extraction produces null/missing fields

- PokeMMO game version changed (obfuscated field names updated)
- Check dump-debug-fields.txt for current field mappings
- Compare with constants in Snooper.kt
- Update field names and rebuild agent
- Verify schema_version incremented if breaking change

SYMPTOM: Port 3000 already in use

- Kill existing Node process: taskkill /F /IM node.exe
- Or change port in package.json dev script
- Update NEXT_PUBLIC_API_URL if using different port

SYMPTOM: Gradle build fails

- Verify PokeMMO.jar exists in apps/agent/libs/
- Check Java version: java -version (require 11+)
- Clean build: ./gradlew.bat clean build
- Check apps/agent/build/reports/problems/ for details

SYMPTOM: React Query not refetching

- Check staleTime is set correctly (200000ms)
- Verify refetchInterval is 3000ms
- Clear React Query cache in DevTools
- Check network tab for /api/state calls every 3 seconds

## Agent Behavior Rules

WHEN EDITING FILES:

- Always preserve existing formatting and indentation
- Do not add unnecessary comments or documentation unless requested
- Follow existing patterns in the file
- Test changes before considering task complete

WHEN CREATING FILES:

- Use consistent naming conventions (PascalCase for components, camelCase for utilities)
- Place in appropriate directory based on existing structure
- Import dependencies that already exist in package.json
- Match existing code style and patterns

WHEN TROUBLESHOOTING:

- Read error messages completely before suggesting solutions
- Check file paths are absolute and correct for Windows (backslashes or forward slashes)
- Verify dependencies are installed before suggesting code changes
- Reference existing working code as examples

WHEN SUGGESTING CHANGES:

- Prioritize existing patterns over introducing new libraries
- Consider backward compatibility with Phase 1 architecture
- Reference .github/ROADMAP.md for future architecture decisions
- Avoid premature optimization

CONSTRAINTS:

- No database in Phase 1 (file-based only)
- No authentication in Phase 1 (single-user)
- No external API calls except PokeAPI proxy
- Must maintain compatibility with Snooper JSON format
- Must work offline (except PokeAPI enrichment)
  AVOID: Inline styles, CSS modules, custom CSS files
  PREFER: Server components unless interactivity required

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
