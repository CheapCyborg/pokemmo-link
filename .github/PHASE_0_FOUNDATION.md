# Phase 0: Foundation Architecture

> **Status**: ✅ Complete
> **Branch**: `feature/tanstack-cache` > **Date**: December 2025

This document describes the foundational architecture established in Phase 0. This is the baseline for all future development.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Architecture Map](#architecture-map)
4. [Type System](#type-system)
5. [Configuration](#configuration)
6. [Data Fetching](#data-fetching)
7. [API Layer](#api-layer)
8. [Validation](#validation)
9. [Patterns & Conventions](#patterns--conventions)
10. [File Structure](#file-structure)
11. [Migration Notes](#migration-notes)
12. [Next Steps](#next-steps)

---

## Overview

Phase 0 establishes a **type-safe, maintainable foundation** for the PokeMMO Link application. The architecture prioritizes:

- **Single source of truth** for types, config, and domain constants
- **Type safety** with TypeScript strict mode and Zod runtime validation
- **Consistent patterns** for data fetching, error handling, and state management
- **Clear separation** of concerns (types, config, API, utilities)
- **Developer experience** with centralized configuration and reusable patterns

### Key Technologies

- **TanStack Query v5** - Data fetching, caching, background refetching
- **Zod v4** - Runtime validation schemas with type inference
- **TypeScript 5+** - Strict type checking, const arrays, type guards
- **Next.js 15** - App Router, API routes, Server/Client Components

---

## Core Principles

### 1. Single Source of Truth

**Problem**: Types, config, and constants scattered across multiple files
**Solution**: Centralize in dedicated files with clear ownership

```typescript
// ✅ DO: Central type definitions
// types/pokemon.ts
export const NATURES = ["Adamant", "Bashful", ...] as const;
export type Nature = (typeof NATURES)[number];

// ❌ DON'T: Hardcoded literals
function calculateStat(nature: "Adamant" | "Bashful" | ...) { }
```

### 2. Type Safety at Boundaries

**Problem**: External data (PokeAPI, Snooper) may not match expected types
**Solution**: Validate at API boundaries using Zod schemas

```typescript
// ✅ DO: Validate external data
const typeName = json.type?.name ?? null;
const validType: PokemonType | null =
  typeName && POKEMON_TYPES.includes(typeName as PokemonType)
    ? (typeName as PokemonType)
    : null;

// ❌ DON'T: Trust external data
const type = json.type?.name; // Could be invalid
```

### 3. Const Arrays Over Enums

**Problem**: TypeScript enums don't work well with Zod and add runtime code
**Solution**: Use `as const` arrays with type derivation

```typescript
// ✅ DO: Const arrays (works with Zod, iteratable, no runtime cost)
export const GENDERS = ["male", "female", "genderless"] as const;
export type Gender = (typeof GENDERS)[number];
export const GenderSchema = z.enum(GENDERS);

// ❌ DON'T: TypeScript enums (incompatible with Zod)
enum Gender {
  Male,
  Female,
  Genderless,
}
```

### 4. Consistent Data State Pattern

**Problem**: Inconsistent shapes for loading/error/data states
**Solution**: Standardized `DataState<T>` pattern everywhere

```typescript
// ✅ DO: DataState pattern
type DataState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  hasData: boolean;
  refetch: () => void;
};

// ❌ DON'T: Inconsistent shapes
return { pokemon, loading, error }; // Different from { data, isLoading, isError }
```

### 5. Configuration Over Magic Strings

**Problem**: Hardcoded URLs, timing values, query keys scattered everywhere
**Solution**: Centralized CONFIG object

```typescript
// ✅ DO: Use CONFIG
const query = useQuery({
  queryKey: CONFIG.queryKeys.liveData(source),
  staleTime: CONFIG.query.staleTime.live,
});

// ❌ DON'T: Magic strings/numbers
const query = useQuery({
  queryKey: ["live-data", source],
  staleTime: 1000,
});
```

---

## Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  Components (React Client/Server)                           │
│  - PokemonCard, PokemonDetailsModal, PcBoxViewer            │
│  - Use hooks for data, no direct API calls                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Hooks)                      │
│  Custom Hooks (Client-side)                                 │
│  - useLiveData(source) → DataState<DumpEnvelope>           │
│  - usePokeApiSpecies(ids) → TanStack Query results          │
│  - useEnrichedPokemon(dump) → DataState<EnrichedPokemon[]>  │
│                                                              │
│  ✓ Returns DataState<T> pattern                             │
│  ✓ Uses CONFIG for query settings                           │
│  ✓ Type-safe with function overloads                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  PokemonApi (Organized by resource)                         │
│  - state.fetch(source) → DumpEnvelope                       │
│  - enrichment.getSpecies(id) → PokeApiSpecies               │
│  - enrichment.getMove(id) → PokeApiMove                     │
│                                                              │
│  ✓ Typed return values                                      │
│  ✓ Uses apiClient (timeout, error handling)                 │
│  ✓ Uses CONFIG.api.endpoints                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   NETWORK LAYER                              │
│  Next.js API Routes (/api/state, /api/pokemon, /api/move)  │
│  - Validate with Zod schemas                                │
│  - Transform external → internal types                       │
│  - Return schema-compliant responses                         │
│                                                              │
│  External Sources:                                           │
│  - File system (data/dump-*.json) ← Snooper                │
│  - PokeAPI (https://pokeapi.co/api/v2)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   FOUNDATION LAYER                           │
│  Types (types/pokemon.ts)                                   │
│  - Const arrays: NATURES, POKEMON_TYPES, GENDERS, etc.      │
│  - Zod schemas: PokeDumpMonSchema, DumpEnvelopeSchema       │
│  - TypeScript types: derived via z.infer                    │
│  - SCHEMAS export: grouped for convenience                  │
│                                                              │
│  Config (lib/constants/config.ts)                           │
│  - CONFIG.query: staleTime, gcTime, refetchInterval         │
│  - CONFIG.api: endpoints, baseUrl                           │
│  - CONFIG.sprites: baseUrl, paths                           │
│  - CONFIG.queryKeys: liveData, pokemonSpecies, move         │
│                                                              │
│  Theme (lib/constants/pokemon-theme.ts)                     │
│  - POKEMON_THEME.types: colors for all 18 types             │
│  - POKEMON_THEME.statuses: colors for status conditions     │
│  - POKEMON_THEME.natures: boost/reduce for all 25 natures   │
│                                                              │
│  Utilities (lib/poke.ts)                                    │
│  - calculateStat, calculateGender, enrichPokemon            │
│  - getSpriteUrl (uses CONFIG.sprites)                       │
│  - NATURE_MULTIPLIERS (type-safe Record<Nature, ...>)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Type System

### Location: `apps/web/src/types/pokemon.ts`

**Single source of truth for ALL types and domain constants.**

### Structure

```typescript
// 1. CONSTANTS (Const arrays for domain values)
export const CONTAINER_TYPES = ["party", "daycare", "pc_boxes"] as const;
export const GENDERS = ["male", "female", "genderless"] as const;
export const NATURES = ["Adamant", "Bashful", ...] as const; // All 25
export const POKEMON_TYPES = ["normal", "fire", ...] as const; // All 18
export const STATUS_CONDITIONS = ["healthy", "poisoned", ...] as const;
export const STAT_NAMES = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

// 2. TYPE DERIVATIONS (From const arrays)
export type ContainerType = (typeof CONTAINER_TYPES)[number];
export type Gender = (typeof GENDERS)[number];
export type Nature = (typeof NATURES)[number];
export type PokemonType = (typeof POKEMON_TYPES)[number];
export type StatusCondition = (typeof STATUS_CONDITIONS)[number];
export type StatName = (typeof STAT_NAMES)[number];

// 3. ZOD SCHEMAS (Runtime validation)
export const StatBlockSchema = z.object({ hp: z.number(), atk: z.number(), ... });
export const PokeDumpMonSchema = z.object({
  identity: z.object({ ... }),
  state: z.object({
    nature: z.enum(NATURES), // ← Uses const array
    ...
  }),
  ...
});
export const DumpEnvelopeSchema = z.object({
  source: z.object({
    container_type: z.enum(CONTAINER_TYPES), // ← Uses const array
  }),
  pokemon: z.array(PokeDumpMonSchema),
});

// 4. TYPESCRIPT TYPES (Inferred from schemas)
export type StatBlock = z.infer<typeof StatBlockSchema>;
export type PokeDumpMon = z.infer<typeof PokeDumpMonSchema>;
export type DumpEnvelope = z.infer<typeof DumpEnvelopeSchema>;

// 5. GROUPED SCHEMA EXPORTS
export const SCHEMAS = {
  statBlock: StatBlockSchema,
  pokemon: PokeDumpMonSchema,
  dump: DumpEnvelopeSchema,
  api: {
    species: PokeApiSpeciesSchema,
    move: PokeApiMoveSchema,
  },
} as const;

// 6. HELPER TYPES
export type DataState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  hasData: boolean;
  refetch: () => void;
};
```

### Usage Patterns

**Const Arrays**: Use for validation, iteration, type checking

```typescript
// Validation
if (!CONTAINER_TYPES.includes(source)) { ... }

// Iteration
NATURES.map(nature => <option key={nature}>{nature}</option>)

// Type narrowing
const validType: PokemonType | null =
  POKEMON_TYPES.includes(typeName as PokemonType)
    ? (typeName as PokemonType)
    : null;
```

**Zod Schemas**: Use for runtime validation at boundaries

```typescript
// API route validation
const data = await request.json();
const validated = DumpEnvelopeSchema.parse(data); // Throws if invalid
```

**TypeScript Types**: Use for function signatures, component props

```typescript
function calculateStat(nature: Nature, statName: StatName): number { ... }
const PokemonCard = ({ pokemon }: { pokemon: EnrichedPokemon }) => { ... }
```

---

## Configuration

### Location: `apps/web/src/lib/constants/config.ts`

**Centralized runtime configuration values.**

```typescript
export const CONFIG = {
  // TanStack Query configuration
  query: {
    staleTime: {
      static: Infinity, // PokeAPI enrichment (never changes)
      live: 1000, // Live game data (1 second)
    },
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchInterval: 3000, // 3 seconds for live data
  },

  // API endpoints
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    pokeapiUrl: "https://pokeapi.co/api/v2",
    endpoints: {
      state: "/api/state",
      pokemon: "/api/pokemon",
      move: "/api/move",
      ingest: "/api/ingest",
    },
  },

  // Sprite URLs
  sprites: {
    baseUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon",
    paths: {
      animated: "versions/generation-v/black-white/animated",
      static: "",
    },
  },

  // Query key factories
  queryKeys: {
    liveData: (source: string) => ["live-data", source] as const,
    pokemonSpecies: (id: string | number) => ["pokemon-species", id] as const,
    move: (id: number) => ["move", id] as const,
  },
} as const;
```

### Usage

```typescript
// In hooks
const query = useQuery({
  queryKey: CONFIG.queryKeys.liveData(source),
  staleTime: CONFIG.query.staleTime.live,
  gcTime: CONFIG.query.gcTime,
  refetchInterval: CONFIG.query.refetchInterval,
});

// In API layer
return apiClient.get<DumpEnvelope>(
  `${CONFIG.api.endpoints.state}?source=${source}`
);

// In utilities
const url = `${CONFIG.sprites.baseUrl}/${CONFIG.sprites.paths.animated}/${id}.gif`;
```

---

## Data Fetching

### Pattern: DataState<T>

**All data-fetching hooks return a consistent shape:**

```typescript
type DataState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean; // Computed: data exists but is empty
  hasData: boolean; // Computed: !isEmpty
  refetch: () => void;
};
```

### Hooks

#### `useLiveData(source)`

Fetches live Pokemon data with 3-second polling.

```typescript
// Function overloads for type safety
function useLiveData(source: "party" | "daycare"): DataState<DumpEnvelope>;
function useLiveData(source: "pc_boxes"): DataState<PcDumpEnvelope>;

// Usage
const party = useLiveData("party");
if (party.isLoading) return <Spinner />;
if (party.isEmpty) return <EmptyState />;
return <PokemonGrid pokemon={party.data.pokemon} />;
```

**Implementation:**

- Uses `CONFIG.queryKeys.liveData(source)`
- Uses `CONFIG.query.staleTime.live` and `CONFIG.query.refetchInterval`
- Computes `isEmpty` based on envelope type (pokemon array vs boxes object)

#### `usePokeApiSpecies(ids)` / `usePokeApiMoves(ids)`

Fetches enrichment data from PokeAPI proxy.

```typescript
const speciesQueries = usePokeApiSpecies([1, 4, 7]); // Bulbasaur, Charmander, Squirtle
const moveQueries = usePokeApiMoves([1, 2, 3]);

// Returns TanStack Query useQueries result
speciesQueries.forEach((query) => {
  if (query.data) console.log(query.data.name);
});
```

**Implementation:**

- Uses `CONFIG.queryKeys.pokemonSpecies(id)` / `CONFIG.queryKeys.move(id)`
- Uses `CONFIG.query.staleTime.static` (Infinity) - data never changes
- Uses `CONFIG.query.gcTime` (7 days)
- Deduplicates IDs automatically

#### `useEnrichedPokemon(dumpData)`

Combines dump data with PokeAPI enrichment.

```typescript
const party = useLiveData("party");
const enriched = useEnrichedPokemon(party.data);

if (enriched.isLoading) return <Spinner />;
return <PokemonGrid pokemon={enriched.data} />; // EnrichedPokemon[]
```

**Implementation:**

- Extracts species/move IDs from dump data
- Calls `usePokeApiSpecies` and `usePokeApiMoves`
- Builds Map lookups for efficient enrichment
- Returns `DataState<EnrichedPokemon[]>`
- Aggregates errors from both query sets

---

## API Layer

### Location: `apps/web/src/lib/api/pokemon-api.ts`

**Organized by resource namespace** (inspired by REST patterns).

```typescript
export const PokemonApi = {
  state: {
    fetch: async (options: {
      source: ContainerType;
    }): Promise<DumpEnvelope> => {
      return apiClient.get<DumpEnvelope>(
        `${CONFIG.api.endpoints.state}?source=${options.source}`
      );
    },
  },

  enrichment: {
    getSpecies: async (id: number): Promise<PokeApiSpecies> => {
      return apiClient.get<PokeApiSpecies>(
        `${CONFIG.api.endpoints.pokemon}/${id}`
      );
    },
    getMove: async (id: number): Promise<PokeApiMove> => {
      return apiClient.get<PokeApiMove>(`${CONFIG.api.endpoints.move}/${id}`);
    },
  },

  health: {
    ping: async (): Promise<boolean> => {
      try {
        await apiClient.get("/api/health");
        return true;
      } catch {
        return false;
      }
    },
  },
};
```

### Base Client

Location: `apps/web/src/lib/api/client.ts`

```typescript
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const apiClient = {
  get: async <T>(url: string, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(url, { timeout: 8000, ...options });
    return response.json();
  },

  post: async <T>(
    url: string,
    data: unknown,
    options?: FetchOptions
  ): Promise<T> => {
    // ...
  },
};
```

**Features:**

- 8-second timeout with AbortController
- Throws `ApiError` with status code
- Type-safe responses with generics
- Centralized error handling

---

## Validation

### API Routes (Boundaries)

**All external data must be validated at API boundaries.**

#### Example: `/api/pokemon/[slug]`

```typescript
import type { PokeApiSpecies, PokemonType } from "@/types/pokemon";
import { POKEMON_TYPES } from "@/types/pokemon";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
  const json = (await res.json()) as PokeApiPokemonResponse;

  // Validate types array
  const types = (json.types ?? [])
    .map((t) => t.type?.name)
    .filter((x): x is string => Boolean(x))
    .filter((typeName): typeName is PokemonType =>
      POKEMON_TYPES.includes(typeName as PokemonType)
    );

  const response: PokeApiSpecies = {
    id: json.id,
    name: json.name,
    types, // Now guaranteed to be PokemonType[]
    // ...
  };

  return NextResponse.json(response);
}
```

**Pattern:**

1. Fetch from external source
2. Type assertion for external shape (`as PokeApiPokemonResponse`)
3. Validate/transform to internal types
4. Return with explicit type annotation (`: PokeApiSpecies`)

#### Example: `/api/state`

```typescript
import type { ContainerType, DumpEnvelope } from "@/types/pokemon";
import { CONTAINER_TYPES } from "@/types/pokemon";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceParam = searchParams.get("source") || "party";

  // Validate source is a valid ContainerType
  const source: ContainerType = CONTAINER_TYPES.includes(
    sourceParam as ContainerType
  )
    ? (sourceParam as ContainerType)
    : "party";

  const filename = `dump-${source}.json`;
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(fileContent); // Could validate with DumpEnvelopeSchema.parse(data)

  return NextResponse.json(data);
}
```

---

## Patterns & Conventions

### Function Overloads (Type-Safe Polymorphism)

**Use when return type varies based on input.**

```typescript
// Declaration
function useLiveData(source: "party" | "daycare"): DataState<DumpEnvelope>;
function useLiveData(source: "pc_boxes"): DataState<PcDumpEnvelope>;

// Implementation
function useLiveData(
  source: ContainerType
): DataState<DumpEnvelope | PcDumpEnvelope> {
  // Single implementation, TypeScript infers correct return type
}

// Usage - TypeScript knows exact return type!
const party = useLiveData("party"); // DataState<DumpEnvelope>
const pc = useLiveData("pc_boxes"); // DataState<PcDumpEnvelope>
```

### Type Guards

**Use for runtime type narrowing.**

```typescript
function isPokemonType(value: string): value is PokemonType {
  return POKEMON_TYPES.includes(value as PokemonType);
}

// Usage
const typeName = json.type?.name;
if (typeName && isPokemonType(typeName)) {
  // typeName is now PokemonType, not string
  return typeName;
}
```

### Zod Enum Pattern

**Combine const arrays with Zod for validation.**

```typescript
// 1. Define const array
export const NATURES = ["Adamant", "Bashful", ...] as const;

// 2. Derive TypeScript type
export type Nature = (typeof NATURES)[number];

// 3. Create Zod enum
export const NatureSchema = z.enum(NATURES);

// 4. Use in schemas
export const PokemonStateSchema = z.object({
  nature: z.enum(NATURES), // Runtime validation
});

// 5. Type is automatically inferred
type PokemonState = z.infer<typeof PokemonStateSchema>;
// { nature: "Adamant" | "Bashful" | ... }
```

### Query Key Factories

**Centralize query key generation.**

```typescript
// Definition
export const CONFIG = {
  queryKeys: {
    liveData: (source: string) => ["live-data", source] as const,
    pokemonSpecies: (id: string | number) => ["pokemon-species", id] as const,
  },
};

// Usage
useQuery({
  queryKey: CONFIG.queryKeys.pokemonSpecies(25), // ["pokemon-species", 25]
  queryFn: () => PokemonApi.enrichment.getSpecies(25),
});

// Benefits:
// - Type-safe (readonly tuple)
// - Consistent across codebase
// - Easy to update globally
// - IDE autocomplete
```

### Computed Flags Pattern

**Derive boolean flags from data state.**

```typescript
const party = useLiveData("party");

// ✅ DO: Compute flags
const isEmpty = !party.data || party.data.pokemon.length === 0;
const hasData = !isEmpty;

return {
  ...party,
  isEmpty,
  hasData,
};

// ❌ DON'T: Store as separate state
const [isEmpty, setIsEmpty] = useState(false);
useEffect(() => {
  setIsEmpty(!party.data || party.data.pokemon.length === 0);
}, [party.data]);
```

---

## File Structure

```
apps/web/src/
├── types/
│   └── pokemon.ts                    # ALL types, const arrays, schemas
├── lib/
│   ├── api/
│   │   ├── client.ts                 # Base fetch client, ApiError
│   │   └── pokemon-api.ts            # PokemonApi namespace
│   ├── constants/
│   │   ├── config.ts                 # CONFIG object (query, api, sprites)
│   │   └── pokemon-theme.ts          # POKEMON_THEME (UI colors)
│   ├── poke.ts                       # Utilities (calculateStat, getSpriteUrl)
│   ├── imageCache.ts                 # Broken image tracking
│   ├── utils.ts                      # Generic utilities (cn, etc.)
│   └── QueryProvider.tsx             # TanStack Query setup
├── hooks/
│   ├── useLiveData.ts                # Live Pokemon data (3s polling)
│   ├── usePokeApi.ts                 # PokeAPI enrichment (species, moves)
│   └── useEnrichedPokemon.ts         # Combines dump + enrichment
├── components/
│   ├── pokemon/
│   │   ├── PokemonCard.tsx           # Individual Pokemon display
│   │   ├── PokemonDetailsModal.tsx   # Detailed view
│   │   ├── PokemonGrid.tsx           # Grid layout
│   │   ├── NatureBadge.tsx           # Nature display
│   │   ├── TypeBadge.tsx             # Type badge
│   │   └── PokemonStats.tsx          # Stats display
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── PcBoxViewer.tsx
│   └── ui/                           # Shadcn/ui components
├── app/
│   ├── api/
│   │   ├── state/route.ts            # GET /api/state?source={container}
│   │   ├── pokemon/[slug]/route.ts   # GET /api/pokemon/{id}
│   │   ├── move/[id]/route.ts        # GET /api/move/{id}
│   │   └── ingest/route.ts           # POST /api/ingest (from Snooper)
│   ├── layout.tsx                    # Root layout (QueryProvider)
│   └── page.tsx                      # Main dashboard
└── data/                             # Runtime data (git-ignored)
    ├── dump-party.json
    ├── dump-daycare.json
    └── dump-pc_boxes.json
```

### File Ownership

| File                             | Owns                                              | Never Contains                   |
| -------------------------------- | ------------------------------------------------- | -------------------------------- |
| `types/pokemon.ts`               | ALL type definitions, const arrays, Zod schemas   | Runtime config, utilities        |
| `lib/constants/config.ts`        | Runtime config (URLs, timing, query keys)         | Type definitions, business logic |
| `lib/constants/pokemon-theme.ts` | UI theme (colors, styles)                         | Business logic, data fetching    |
| `lib/poke.ts`                    | Utility functions (calculations, transformations) | Type definitions, config         |
| `lib/api/pokemon-api.ts`         | API client methods                                | Business logic, UI concerns      |
| `hooks/*.ts`                     | Data fetching logic, DataState composition        | UI rendering, direct API calls   |
| `components/*.tsx`               | UI rendering, user interactions                   | Data fetching, type definitions  |

---

## Migration Notes

### What Changed in Phase 0

#### Before (Old Architecture)

```typescript
// ❌ Scattered types
// lib/pokeapi.ts
type CachedPokemon = { ... };

// config.ts
type ContainerType = "party" | "daycare" | "pc_boxes";

// Hardcoded values
useQuery({
  queryKey: ["live-data", source],
  staleTime: 1000,
  refetchInterval: 3000,
});

// Polymorphic hook (confusing)
function usePokeApi(type: "species" | "move", id: number) { ... }

// Inconsistent return types
return { pokemon, loading, error };
return { data, isLoading, isError };
```

#### After (Phase 0)

```typescript
// ✅ Centralized types
// types/pokemon.ts
export const CONTAINER_TYPES = [...] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];
export type PokeApiSpecies = z.infer<typeof PokeApiSpeciesSchema>;

// CONFIG-driven
useQuery({
  queryKey: CONFIG.queryKeys.liveData(source),
  staleTime: CONFIG.query.staleTime.live,
  refetchInterval: CONFIG.query.refetchInterval,
});

// Focused hooks
function usePokeApiSpecies(ids: number[]) { ... }
function usePokeApiMoves(ids: number[]) { ... }

// Consistent DataState<T>
return {
  data,
  isLoading,
  isError,
  error,
  isEmpty,
  hasData,
  refetch,
};
```

### Breaking Changes

1. **Nature capitalization**: `"adamant"` → `"Adamant"` (matches game data)
2. **Hook names**: `usePokeApi()` → `usePokeApiSpecies()` / `usePokeApiMoves()`
3. **Type names**: `CachedPokemon` → `PokeApiSpecies`, `CachedMove` → `PokeApiMove`
4. **Import paths**: `lib/pokeapi.ts` deleted, use `lib/api/pokemon-api.ts`
5. **Return types**: All hooks now return `DataState<T>` with computed flags

### Compatibility

- **Snooper**: No changes needed (outputs same JSON format)
- **Data files**: No migration needed (schema_version tracks compatibility)
- **Components**: Minor updates to use new hook names and DataState pattern
- **API routes**: Enhanced with validation, backward compatible

---

## Next Steps

### Phase 1: API Refinement (Planned)

**Goal**: Robust error handling, validation, and API patterns

- [ ] Standardized error types (ApiError, ValidationError, NetworkError)
- [ ] Zod validation in API routes (use SCHEMAS exports)
- [ ] Request/response interceptors
- [ ] Retry logic with exponential backoff
- [ ] API health monitoring
- [ ] Rate limiting for PokeAPI calls

### Phase 2: Component Architecture (Planned)

**Goal**: Reusable, composable component patterns

- [ ] Compound component pattern (Card.Root, Card.Header, Card.Body)
- [ ] Render prop pattern for data visualization
- [ ] Skeleton loading states
- [ ] Error boundaries per feature
- [ ] Storybook documentation

### Phase 3: Hook Architecture (Planned)

**Goal**: Separation of data/domain/UI concerns

- [ ] Data hooks (usePartyData, usePcBoxData)
- [ ] Domain hooks (usePokemonStats, useTypeEffectiveness)
- [ ] UI hooks (useModal, useToast, usePagination)
- [ ] ComposableHook pattern (state + actions)

### Phase 4: Integration (Planned)

**Goal**: Feature-complete views with optimized UX

- [ ] Dashboard view (party + daycare + PC overview)
- [ ] Team builder view
- [ ] Stats calculator view
- [ ] IV/EV trainer view
- [ ] Breeding planner view

### Phase 5: Error Handling & Reliability (Planned)

**Goal**: Production-ready error handling

- [ ] Global error boundary
- [ ] Toast notifications
- [ ] Retry mechanisms
- [ ] Offline detection
- [ ] Graceful degradation

### Phase 6: Performance (Planned)

**Goal**: Optimize for large data sets

- [ ] Virtual scrolling for PC boxes
- [ ] Image lazy loading
- [ ] Query result caching strategy
- [ ] Bundle size optimization
- [ ] Lighthouse score >90

---

## Appendix

### Quick Reference

**Import paths:**

```typescript
// Types and const arrays
import { NATURES, Nature, PokeApiSpecies, SCHEMAS } from "@/types/pokemon";

// Configuration
import { CONFIG } from "@/lib/constants/config";

// Theme
import { POKEMON_THEME } from "@/lib/constants/pokemon-theme";

// API
import { PokemonApi } from "@/lib/api/pokemon-api";

// Hooks
import { useLiveData } from "@/hooks/useLiveData";
import { usePokeApiSpecies, usePokeApiMoves } from "@/hooks/usePokeApi";

// Utilities
import { calculateStat, getSpriteUrl } from "@/lib/poke";
```

### Common Tasks

**Add a new domain constant:**

```typescript
// 1. Add to types/pokemon.ts
export const ABILITIES = ["Overgrow", "Blaze", ...] as const;
export type Ability = (typeof ABILITIES)[number];

// 2. Use in Zod schema (if needed)
const PokemonSchema = z.object({
  ability: z.enum(ABILITIES),
});

// 3. Use in validation
if (ABILITIES.includes(abilityName as Ability)) { ... }
```

**Add a new API endpoint:**

```typescript
// 1. Add to CONFIG
export const CONFIG = {
  api: {
    endpoints: {
      // ... existing
      ability: "/api/ability",
    },
  },
};

// 2. Add to PokemonApi
export const PokemonApi = {
  // ... existing
  abilities: {
    get: async (id: number): Promise<Ability> => {
      return apiClient.get(`${CONFIG.api.endpoints.ability}/${id}`);
    },
  },
};

// 3. Create API route at app/api/ability/[id]/route.ts
```

**Add a new query:**

```typescript
// 1. Add query key to CONFIG
queryKeys: {
  // ... existing
  ability: (id: number) => ["ability", id] as const,
}

// 2. Create hook
export function useAbility(id: number) {
  return useQuery({
    queryKey: CONFIG.queryKeys.ability(id),
    queryFn: () => PokemonApi.abilities.get(id),
    staleTime: CONFIG.query.staleTime.static,
  });
}
```

### TypeScript Tips

**Type narrowing with const arrays:**

```typescript
function isNature(value: string): value is Nature {
  return NATURES.includes(value as Nature);
}

const input = "Adamant"; // string
if (isNature(input)) {
  // input is now Nature
}
```

**Const array iteration:**

```typescript
// Type-safe iteration
POKEMON_TYPES.forEach((type: PokemonType) => {
  console.log(POKEMON_THEME.types[type]); // No error
});

// Map with index
STAT_NAMES.map((stat, index) => ({ stat, value: values[index] }));
```

**Zod transform pattern:**

```typescript
const TransformedSchema = z
  .object({
    nature: z.string(),
  })
  .transform((data) => ({
    ...data,
    nature: data.nature as Nature, // Validate separately or use z.enum
  }));
```

---

## Conclusion

Phase 0 establishes a **solid, type-safe foundation** for PokeMMO Link. All future development builds on these patterns.

**Key Achievements:**

- ✅ Single source of truth for types (types/pokemon.ts)
- ✅ Centralized configuration (CONFIG object)
- ✅ Consistent data fetching (DataState pattern)
- ✅ Type-safe boundaries (Zod validation)
- ✅ Organized API layer (PokemonApi)
- ✅ Developer-friendly patterns (const arrays, query keys, helpers)

**Next Phase**: API refinement with robust error handling and validation.

---

_Last Updated: December 2025_
_Branch: feature/tanstack-cache_
_TypeScript: 5.7.2 | Next.js: 15.1.3 | TanStack Query: 5.62.11 | Zod: 3.24.1_
