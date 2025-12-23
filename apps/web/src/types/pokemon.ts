import { z } from "zod";

// ============================================================================
// CONSTANTS (Must be defined before schemas to use in validation)
// ============================================================================

export const CONTAINER_IDS = {
  PARTY_IDS: [1, 2],
  DAYCARE_ID: 3,
  PC_BOX_START: 100,
} as const;

// Container types as const array for iteration and Zod enum usage
export const CONTAINER_TYPES = [
  "party",
  "daycare",
  "pc_boxes",
  "pc_box",
  "account_box",
  "pc_box_extra",
] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];

// Stat names
export const STAT_NAMES = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatName = (typeof STAT_NAMES)[number];

// Pokemon types (all 18 types)
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;
export type PokemonType = (typeof POKEMON_TYPES)[number];

// Status conditions
export const STATUS_CONDITIONS = [
  "healthy",
  "poisoned",
  "burned",
  "frozen",
  "paralyzed",
  "asleep",
] as const;
export type StatusCondition = (typeof STATUS_CONDITIONS)[number];

// All 25 Pokemon natures
export const NATURES = [
  "Adamant",
  "Bashful",
  "Bold",
  "Brave",
  "Calm",
  "Careful",
  "Docile",
  "Gentle",
  "Hardy",
  "Hasty",
  "Impish",
  "Jolly",
  "Lax",
  "Lonely",
  "Mild",
  "Modest",
  "Naive",
  "Naughty",
  "Quiet",
  "Quirky",
  "Rash",
  "Relaxed",
  "Sassy",
  "Serious",
  "Timid",
] as const;
export type Nature = (typeof NATURES)[number];

// Gender values
export const GENDERS = ["male", "female", "genderless"] as const;
export type Gender = (typeof GENDERS)[number];

// ============================================================================
// ZOD SCHEMAS (Runtime Validation)
// ============================================================================

export const StatBlockSchema = z.object({
  hp: z.number().int().min(0),
  atk: z.number().int().min(0),
  def: z.number().int().min(0),
  spa: z.number().int().min(0),
  spd: z.number().int().min(0),
  spe: z.number().int().min(0),
});

export const PokeDumpMonSchema = z.object({
  slot: z.number().int(),
  identity: z.object({
    uuid: z.union([z.number(), z.string()]),
    species_id: z.number().int().min(1),
    form_id: z.number().int().nullable(),
    nickname: z.string(),
    ot_name: z.string(),
    personality_value: z.number().int(),
    is_shiny: z.boolean().optional().default(false),
    is_gift: z.boolean().optional().default(false),
    is_alpha: z.boolean().optional().default(false),
  }),
  state: z.object({
    level: z.number().int().min(1).max(100),
    nature: z.enum(NATURES),
    current_hp: z.number().int().min(0).nullable(),
    xp: z.number().int().nullable(),
    happiness: z.number().int().min(0).max(255).nullable(),
  }),
  stats: z.object({
    evs: StatBlockSchema,
    ivs: StatBlockSchema,
  }),
  moves: z.array(
    z.object({
      move_id: z.number().int(),
      pp: z.number().int().min(0).nullable(),
    })
  ),
  ability: z.object({
    id: z.number().int().nullable().optional().default(null),
    slot: z.number().int().nullable().optional().default(null),
  }),
  pokeapi_override: z.string().nullable().optional(),
});

export const DumpEnvelopeSchema = z.object({
  schema_version: z.number().int(),
  captured_at_ms: z.number().int(),
  source: z.object({
    packet_class: z.string(),
    container_id: z.number().int(),
    container_type: z.enum(CONTAINER_TYPES),
    capacity: z.number().int().optional(),
  }),
  pokemon: z.array(PokeDumpMonSchema),
});

export const PcDumpEnvelopeSchema = z.object({
  source: z.object({
    container_type: z.literal("pc_boxes"),
  }),
  boxes: z.record(z.string(), DumpEnvelopeSchema),
});

// ============================================================================
// TYPESCRIPT TYPES (Derived from Schemas)
// ============================================================================

export type StatBlock = z.infer<typeof StatBlockSchema>;
export type PokeDumpMon = z.infer<typeof PokeDumpMonSchema>;
export type DumpEnvelope = z.infer<typeof DumpEnvelopeSchema>;
export type PcDumpEnvelope = z.infer<typeof PcDumpEnvelopeSchema>;

// ============================================================================
// HELPER TYPES FOR REFACTORING
// ============================================================================

/**
 * Standard shape for React Query-based hooks that manage async data.
 * Provides consistent loading/error/empty states across all data-fetching hooks.
 *
 * @example
 * ```ts
 * export function usePokemonData(source: ContainerType): DataState<DumpEnvelope> {
 *   const query = useQuery({ ... });
 *   return {
 *     data: query.data,
 *     isLoading: query.isLoading,
 *     isError: query.isError,
 *     error: query.error,
 *     isEmpty: !query.data || query.data.pokemon.length === 0,
 *     hasData: Boolean(query.data),
 *     refetch: () => query.refetch(),
 *   };
 * }
 * ```
 */
export type DataState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  hasData: boolean;
  refetch: () => void;
};

/**
 * Standard shape for composable hooks following the state/actions pattern.
 * Use this when creating domain or UI hooks that encapsulate both state and actions.
 *
 * @example
 * ```ts
 * // Define hook return type
 * export function usePokemonModal(): ComposableHook<
 *   { isOpen: boolean; selectedPokemon: EnrichedPokemon | null },
 *   { open: (p: EnrichedPokemon) => void; close: () => void }
 * > {
 *   // ... implementation
 *   return { state: { isOpen, selectedPokemon }, actions: { open, close } };
 * }
 * ```
 */
export type ComposableHook<TState, TActions = {}> = {
  state: TState;
  actions: TActions;
};

// ============================================================================
// API / CACHE TYPES
// ============================================================================

// PokeAPI enrichment data from /api/pokemon/[slug]
export const PokeApiSpeciesSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({
    front_default: z.string().nullable(),
    front_shiny: z.string().nullable(),
    animated: z.string().nullable(),
    animated_shiny: z.string().nullable(),
  }),
  stats: z.record(z.string(), z.number()),
  types: z.array(z.enum(POKEMON_TYPES)),
  abilities: z.array(
    z.object({
      ability: z.object({ name: z.string(), url: z.string() }),
      is_hidden: z.boolean(),
      slot: z.number(),
    })
  ),
  gender_rate: z.number(),
  growth_rate: z.string().nullable().optional(),
});

export type PokeApiSpecies = z.infer<typeof PokeApiSpeciesSchema>;

// PokeAPI move data from /api/move/[id]
export const PokeApiMoveSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(POKEMON_TYPES).nullable(),
  power: z.number().nullable(),
  accuracy: z.number().nullable(),
  pp: z.number().nullable(),
  damage_class: z.string().nullable(),
  description: z.string().nullable(),
});

export type PokeApiMove = z.infer<typeof PokeApiMoveSchema>;

// PokeAPI ability data from /api/ability/[id]
export const PokeApiAbilitySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});

export type PokeApiAbility = z.infer<typeof PokeApiAbilitySchema>;

// Grouped schema exports for convenience
export const SCHEMAS = {
  statBlock: StatBlockSchema,
  pokemon: PokeDumpMonSchema,
  dump: DumpEnvelopeSchema,
  pcDump: PcDumpEnvelopeSchema,
  api: {
    species: PokeApiSpeciesSchema,
    move: PokeApiMoveSchema,
    ability: PokeApiAbilitySchema,
  },
} as const;

// --- Enriched Types ---

export type PokemonAbility = {
  name: string;
  isHidden: boolean;
  slot: number;
  id?: number;
};

// Helper for the UI to display moves easily
export type EnrichedMove = PokeApiMove & {
  pp_left: number | null;
};

export type EnrichedPokemon = PokeDumpMon & {
  species?: {
    height: number;
    weight: number;
    name: string;
    displayName: string;
    sprite: string; // Context-aware main sprite (Shiny/Normal)
    sprites: {
      front_default: string | null;
      front_shiny: string | null;
      animated: string | null;
      animated_shiny: string | null;
    };
    types: string[];
    baseStats: StatBlock;
    genderRate: number;
    abilities: PokemonAbility[];
    growth_rate: string | null;
  };

  // The specific ability this Pokemon has
  activeAbility?: PokemonAbility;

  // Pre-fetched move data
  movesData?: EnrichedMove[];

  computed?: {
    gender: Gender;
    calculatedStats: StatBlock;
  };
};
