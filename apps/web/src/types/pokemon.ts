import { z } from "zod";
import {
  AgentDataSchema,
  CONTAINER_TYPES,
  NATURES,
  PokeApiAbilitySchema,
  PokeApiMoveSchema,
  PokeApiSpeciesSchema,
  POKEMON_TYPES,
} from "./schemas";

// ============================================================================
// CONSTANTS - Re-exported for convenience
// ============================================================================

export { CONTAINER_TYPES, NATURES, POKEMON_TYPES };

export const CONTAINER_IDS = {
  PARTY_IDS: [1, 2],
  DAYCARE_ID: 3,
  PC_BOX_START: 100,
} as const;

export const STAT_NAMES = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export const STATUS_CONDITIONS = ["healthy", "poisoned", "burned", "frozen", "paralyzed", "asleep"] as const;

export const GENDERS = ["male", "female", "genderless"] as const;

// ============================================================================
// TYPES - Simple TypeScript interfaces (no unnecessary validation)
// ============================================================================

// Const array-derived types
export type ContainerType = (typeof CONTAINER_TYPES)[number];
export type StatName = (typeof STAT_NAMES)[number];
export type PokemonType = (typeof POKEMON_TYPES)[number];
export type StatusCondition = (typeof STATUS_CONDITIONS)[number];
export type Nature = (typeof NATURES)[number];
export type Gender = (typeof GENDERS)[number];

// Core data types (from agent)
export interface StatBlock {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokeDumpMon {
  slot: number;
  box_id?: string; // For PC boxes: "box_1", "account_box", "extra_box_1", etc.
  box_slot?: number; // For PC boxes: slot within the box (0-59)
  identity: {
    uuid: number | string;
    species_id: number;
    form_id: number | null;
    nickname: string;
    ot_name: string;
    personality_value: number;
    is_shiny?: boolean;
    is_gift?: boolean;
    is_alpha?: boolean;
  };
  state: {
    status: any;
    level: number;
    nature: Nature;
    current_hp: number | null;
    xp: number | null;
    happiness: number | null;
  };
  stats: {
    evs: StatBlock;
    ivs: StatBlock;
  };
  moves: Array<{
    move_id: number;
    pp: number | null;
  }>;
  ability: {
    id?: number | null;
    slot?: number | null;
  };
  pokeapi_override?: string | null;
}

// Unified envelope - all containers return pokemon array
// For PC boxes, Pokemon include box_id and box_slot metadata
export interface DumpEnvelope {
  schema_version: number;
  captured_at_ms: number;
  source: {
    packet_class: string;
    container_id: number;
    container_type: ContainerType;
    capacity?: number;
  };
  pokemon: PokeDumpMon[];
}

// PokeAPI types (validated at API boundaries)
export type PokeApiSpecies = z.infer<typeof PokeApiSpeciesSchema>;
export type PokeApiMove = z.infer<typeof PokeApiMoveSchema>;
export type PokeApiAbility = z.infer<typeof PokeApiAbilitySchema>;

// ============================================================================
// RAW POKEAPI RESPONSES - Used by API routes before transformation
// ============================================================================

export interface PokeApiMoveResponse {
  id: number;
  name: string;
  accuracy?: number | null;
  power?: number | null;
  pp?: number | null;
  type?: { name: string };
  damage_class?: { name: string };
  flavor_text_entries?: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

export interface PokeApiAbilityResponse {
  id: number;
  name: string;
  flavor_text_entries?: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  sprites?: {
    front_default?: string | null;
    front_shiny?: string | null;
    other?: unknown;
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: {
            front_default?: string | null;
            front_shiny?: string | null;
          };
        };
      };
    };
  };
  stats?: Array<{ stat?: { name?: string }; base_stat: number }>;
  types?: Array<{ type?: { name?: string } }>;
  abilities?: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
    slot: number;
  }>;
}

export interface PokeApiSpeciesResponse {
  gender_rate: number;
  growth_rate?: { name: string; url: string };
  varieties?: Array<{
    pokemon?: { name?: string };
  }>;
}

// ============================================================================
// ENRICHMENT TYPES - Computed client-side
// ============================================================================

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
  slot: number;
  id?: number;
  description?: string;
}

export type EnrichedMove = PokeApiMove & {
  pp_left: number | null;
};

export interface EnrichedPokemon extends PokeDumpMon {
  species?: {
    height: number;
    weight: number;
    name: string;
    displayName: string;
    sprite: string;
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
  activeAbility?: PokemonAbility;
  movesData?: EnrichedMove[];
  computed: {
    // Game mechanics
    gender: Gender;
    calculatedStats: StatBlock;

    // Display properties - ALL pre-computed, NO fallbacks needed in UI
    displayName: string; // Nickname or species name
    hasNickname: boolean;
    speciesName: string; // Always the species name
    showSpeciesName: boolean; // Show species when nicknamed
    dexNum: string; // "#001" formatted

    // Sprites - ALL URLs pre-computed
    animatedUrl: string | null; // Respects shiny state
    staticUrl: string; // Respects shiny state, always has fallback
    preferredSprite: string; // Best available sprite
    cryUrl: string;

    // Stats
    perfectIvCount: number; // Count of 31 IVs
    totalIvSum: number; // Sum of all IVs
    totalEvSum: number; // Sum of all EVs

    // HP
    hpPercent: number; // 0-100
    hpColor: "red" | "yellow" | "green";
    hpColorClass: string; // Tailwind class
  };
}

// ============================================================================
// SCHEMA EXPORTS - Only for API validation
// ============================================================================

export { AgentDataSchema, PokeApiAbilitySchema, PokeApiMoveSchema, PokeApiSpeciesSchema };
