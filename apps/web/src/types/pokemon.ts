// src/types/pokemon.ts

// ... [Keep DumpEnvelope, PcDumpEnvelope] ...
export type DumpEnvelope = {
  schema_version: number;
  captured_at_ms: number;
  source: {
    packet_class: string;
    container_id: number;
    container_type: string;
    capacity?: number;
  };
  pokemon: PokeDumpMon[];
};

export type PcDumpEnvelope = {
  source: {
    container_type: "pc_boxes";
  };
  boxes: Record<string, DumpEnvelope>;
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
    // EXTRACTED FLAGS
    shiny: boolean;
    is_gift: boolean;
    is_alpha: boolean;
  };
  state: {
    level: number;
    nature: string;
    current_hp: number | null;
    xp: number | null;
    happiness: number | null;
    // Removed 'status' (it was confusingly mapped to flags)
    // Removed 'shiny' (moved to identity)
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

export const CONTAINER_IDS = {
  PARTY_IDS: [1, 2],
  DAYCARE_ID: 3,
  PC_BOX_START: 100,
} as const;

export type ContainerType = "party" | "daycare" | "pc_box" | "unknown";

// --- API / Cache Types ---

export type CachedPokemon = {
  id: number;
  name: string;
  sprites: {
    front_default?: string | null;
    front_shiny?: string | null; // <--- ADDED
    animated?: string | null;
    animated_shiny?: string | null; // <--- ADDED
    other?: unknown;
  };
  stats: Record<string, number>;
  types: string[];
  abilities: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
    slot: number;
  }>;
  gender_rate: number;
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

// Helper for the UI to display moves easily
export type EnrichedMove = CachedMove & {
  pp_left: number | null;
};

export type EnrichedPokemon = PokeDumpMon & {
  species?: {
    name: string;
    displayName: string;
    sprite: string; // Context-aware main sprite (Shiny/Normal)
    sprites: {
      front_default: string | null;
      front_shiny: string | null; // <--- ADDED
      animated: string | null;
      animated_shiny: string | null; // <--- ADDED
    };
    types: string[];
    baseStats: StatBlock;
    genderRate: number;
    abilities: PokemonAbility[];
  };
  
  // Pre-fetched move data
  movesData?: EnrichedMove[];
  
  computed?: {
    gender: "male" | "female" | "genderless";
    calculatedStats: StatBlock;
  };
};