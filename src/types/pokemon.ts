// src/types/pokemon.ts
// Core Pokemon data types from PokeSnooper schema v2

export type DumpEnvelope = {
  schema_version: number;
  captured_at_ms: number;
  source: {
    packet_class: string;
    container_id: number;
    container_type: string;
  };
  pokemon: PokeDumpMon[];
};

export type PokeDumpMon = {
  slot: number;
  identity: {
    uuid: number | string;
    species_id: number;
    form_id: number | null;
    nickname: string;
    ot_name: string;
    personality_value: number;
  };
  state: {
    level: number;
    nature: string;
    current_hp: number | null;
    xp: number | null;
    happiness: number | null;
    status: number | null;
  };
  stats: {
    evs: StatBlock;
    ivs: StatBlock;
  };
  moves: Array<{ move_id: number; pp: number | null }>;
  ability: {
    id: number | null;
    slot: number | null;
  };
  pokeapi_override?: string | null;
};

export type StatBlock = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

/**
 * Container type constants from PokeSnooper
 * Used to identify which container type is being dumped
 */
export const CONTAINER_IDS = {
  PARTY_IDS: [1, 2], // Party can be container ID 1 or 2
  DAYCARE_ID: 3,
  PC_BOX_START: 100, // PC boxes start at 100+
} as const;

export type ContainerType = "party" | "daycare" | "pc_box" | "unknown";

// --- API / Cache Types ---

/**
 * Cached Pokemon data structure (used in usePokemon hook)
 */
export type CachedPokemon = {
  id: number;
  name: string;
  sprites: {
    front_default?: string | null;
    other?: unknown;
  };
  stats: Record<string, number>;
  types: string[];
  abilities: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
    slot: number;
  }>;
  gender_rate: number; // -1 = genderless, 0 = always male, 8 = always female, 4 = 50/50, etc.
};

export type CachedMove = {
  id: number;
  name: string;
  type: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damage_class: string | null;
  description: string | null;
};

// --- Enriched Types ---

export type PokemonAbility = {
  name: string;
  isHidden: boolean;
  slot: number;
};

/**
 * Complete Pokemon data ready for UI display
 * Combines live data from snooper with static species data from PokeAPI
 */
export type EnrichedPokemon = PokeDumpMon & {
  // Species metadata from PokeAPI (undefined if not loaded yet)
  species?: {
    name: string;           // "pikachu"
    displayName: string;    // "Pikachu" 
    sprite: string;         // URL to sprite image
    types: string[];        // ["electric"]
    baseStats: StatBlock;
    genderRate: number;     // -1 = genderless, 0-8 = ratio
    abilities: PokemonAbility[];
  };
  
  // Computed values (only available when species data is loaded)
  computed?: {
    gender: "male" | "female" | "genderless";
    calculatedStats: StatBlock;
  };
};
