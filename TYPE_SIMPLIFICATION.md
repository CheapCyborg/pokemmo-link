# Type System Simplification

## Problem We Solved

Previously, the codebase had **confusing dual types** everywhere:

```tsx
// OLD - Confusing! 😵
<PokemonCard 
  pokemon={rawPokemon}           // Your data from snooper
  apiPokemon={cachedPokemon}     // PokeAPI data
/>
```

You needed to pass TWO separate objects and manually merge them in every component.

## New Simplified Approach

Now there's just **ONE unified type**: `EnrichedPokemon`

```tsx
// NEW - Simple! ✨
<PokemonCard pokemon={enrichedPokemon} />
```

## How It Works

### 1. Core Types (Still Separate Internally)

- **`PokeDumpMon`** (`src/types/pokemon.ts`) - Raw data from Java snooper
  - IVs, EVs, current HP, level, nature, moves
  - What THIS specific Pokemon has

- **`CachedPokemon`** (`src/types/api.ts`) - Species data from PokeAPI  
  - Base stats, sprite URL, species name, types, gender rate
  - Generic info about ALL Pikachu

### 2. Unified Type for UI

**`EnrichedPokemon`** (`src/types/enriched.ts`) - Everything merged together:

```typescript
type EnrichedPokemon = PokeDumpMon & {
  species?: {
    name: string;           // "pikachu"
    displayName: string;    // "Pikachu"
    sprite: string;         // Full sprite URL
    types: string[];        // ["electric"]
    baseStats: {...};       // Base stats for calculations
    genderRate: number;     // For gender calculation
    abilities: [...];
  };
  
  computed?: {
    gender: "male" | "female" | "genderless";
    calculatedStats: {      // Fully calculated from base + IV + EV + nature
      hp: number;
      atk: number;
      // ... etc
    };
  };
};
```

### 3. Helper Function

`enrichPokemon()` in `src/lib/poke.ts` merges the data:

```typescript
const enriched = enrichPokemon(rawPokemon, apiData);
// Returns a complete EnrichedPokemon with everything
```

### 4. Convenient Hook

`useEnrichedPokemon()` in `src/hooks/useEnrichedPokemon.ts`:

```typescript
const enrichedTeam = useEnrichedPokemon(teamData);
// Automatically fetches PokeAPI data and merges it
```

## Usage in Components

### Before (Complicated)

```tsx
// page.tsx
const neededSlugs = [...]; // manually build slug list
const apiData = usePokemon(neededSlugs);

{teamData.map(p => (
  <PokemonCard 
    pokemon={p}
    apiPokemon={apiData.pokemonBySlug[getPokeApiSlug(p)]}
  />
))}

// PokemonCard.tsx
export const PokemonCard = ({ pokemon, apiPokemon }) => {
  const slug = getPokeApiSlug(pokemon);
  const name = apiPokemon?.name ? toTitleCase(apiPokemon.name) : undefined;
  const sprite = getSpriteUrl(pokemon, apiPokemon?.sprites?.front_default);
  const baseStats = apiPokemon?.stats || {};
  // ... lots of manual merging
}
```

### After (Simple)

```tsx
// page.tsx
const enrichedTeam = useEnrichedPokemon(teamData);

{enrichedTeam.map(p => (
  <PokemonCard pokemon={p} />
))}

// PokemonCard.tsx
export const PokemonCard = ({ pokemon }) => {
  const name = pokemon.species?.displayName || pokemon.identity.nickname;
  const sprite = pokemon.species?.sprite;
  const stats = pokemon.computed?.calculatedStats;
  // Everything is already there!
}
```

## When to Use What

- **In UI Components**: Always use `EnrichedPokemon`
- **In API Routes**: Use `PokeDumpMon` (incoming) and `CachedPokemon` (PokeAPI)
- **In the Snooper**: Use `PokemonDumpSchema.kt` (stays unchanged)

## Migration Checklist

✅ Created `EnrichedPokemon` type  
✅ Created `enrichPokemon()` helper function  
✅ Created `useEnrichedPokemon()` hook  
✅ Updated `PokemonCard` to single prop  
✅ Updated `PokemonDetailsContent` to single prop  
✅ Updated `page.tsx` to use enriched data  
✅ Removed confusing manual slug mapping everywhere  

## Benefits

1. **Less confusion**: One object has everything
2. **Type safety**: TypeScript knows what's available
3. **Less code**: No manual merging in components
4. **Cleaner props**: Components take 1 prop instead of 2
5. **Better loading states**: `pokemon.species` is `undefined` until loaded

## Schema Contract (STILL IMPORTANT!)

The contract between Kotlin and TypeScript **still exists** but is now hidden:

```
PokemonDumpSchema.kt ←→ PokeDumpMon (TypeScript)
```

These must stay synchronized when adding new fields from the snooper.
