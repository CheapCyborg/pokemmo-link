import { z } from "zod";

// ============================================================================
// CONSTANTS - Re-exported for use in validation and types
// ============================================================================

export const CONTAINER_TYPES = ["party", "daycare", "pc_boxes", "pc_box", "account_box", "pc_box_extra"] as const;

// PC Box identifiers (used in agent to tag Pokemon with their box location)
export const PC_BOX_IDS = {
  STANDARD: (num: number) => `box_${num}` as const, // box_1 through box_11
  ACCOUNT: "account_box" as const,
  EXTRA: (num: number) => `extra_box_${num}` as const,
} as const;

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

// ============================================================================
// ZOD SCHEMAS - Only for validating external data at API boundaries
// ============================================================================

/**
 * Validates data from the Kotlin agent (POST /api/ingest)
 * Handles both regular dumps (party/daycare) and PC box dumps
 */
export const AgentDataSchema = z.union([
  // Regular dump (party, daycare, single PC box)
  z.object({
    schema_version: z.number().int(),
    captured_at_ms: z.number().int(),
    source: z.object({
      packet_class: z.string(),
      container_id: z.number().int(),
      container_type: z.enum(CONTAINER_TYPES),
      capacity: z.number().int().optional(),
    }),
    pokemon: z.array(
      z.object({
        slot: z.number().int(),
        box_id: z.string().optional(), // For PC boxes: "box_1", "account_box", etc.
        box_slot: z.number().int().optional(), // For PC boxes: slot within box (0-59)
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
          evs: z.object({
            hp: z.number().int().min(0),
            atk: z.number().int().min(0),
            def: z.number().int().min(0),
            spa: z.number().int().min(0),
            spd: z.number().int().min(0),
            spe: z.number().int().min(0),
          }),
          ivs: z.object({
            hp: z.number().int().min(0),
            atk: z.number().int().min(0),
            def: z.number().int().min(0),
            spa: z.number().int().min(0),
            spd: z.number().int().min(0),
            spe: z.number().int().min(0),
          }),
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
      })
    ),
  }),
  // PC boxes dump (aggregated boxes)
  z.object({
    source: z.object({
      container_type: z.literal("pc_boxes"),
    }),
    boxes: z.record(z.string(), z.any()), // Recursively contains regular dumps
  }),
]);

/**
 * Validates PokeAPI species response (GET /api/pokemon/[slug])
 */
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

/**
 * Validates PokeAPI move response (GET /api/move/[id])
 */
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

/**
 * Validates PokeAPI ability response (GET /api/ability/[id])
 */
export const PokeApiAbilitySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});
