// src/lib/poke.ts
// Utility functions and constants for Pokemon data

import type { CachedPokemon, EnrichedPokemon, PokeDumpMon } from "@/types/pokemon";

export const toTitleCase = (s: string) =>
  (s || "")
    .replace(/(^|\s|[-_])\w/g, (m) => m.toUpperCase())
    .replace(/[-_]/g, " ");

export const getPokeApiSlug = (p: PokeDumpMon) => {
  if (p.pokeapi_override) return String(p.pokeapi_override).trim();
  if (p.identity.form_id && p.identity.form_id > 0)
    return `id-${p.identity.species_id}-form-${p.identity.form_id}`;
  return String(p.identity.species_id);
};



export const NATURE_MULTIPLIERS: Record<string, Record<string, number>> = {
  Adamant: { atk: 1.1, spa: 0.9 },
  Bashful: {},
  Bold: { def: 1.1, atk: 0.9 },
  Brave: { atk: 1.1, spe: 0.9 },
  Calm: { spd: 1.1, atk: 0.9 },
  Careful: { spd: 1.1, spa: 0.9 },
  Docile: {},
  Gentle: { spd: 1.1, def: 0.9 },
  Hardy: {},
  Hasty: { spe: 1.1, def: 0.9 },
  Impish: { def: 1.1, spa: 0.9 },
  Jolly: { spe: 1.1, spa: 0.9 },
  Lax: { def: 1.1, spd: 0.9 },
  Lonely: { atk: 1.1, def: 0.9 },
  Mild: { spa: 1.1, def: 0.9 },
  Modest: { spa: 1.1, atk: 0.9 },
  Naive: { spe: 1.1, spd: 0.9 },
  Naughty: { atk: 1.1, spd: 0.9 },
  Quiet: { spa: 1.1, spe: 0.9 },
  Quirky: {},
  Rash: { spa: 1.1, spd: 0.9 },
  Relaxed: { def: 1.1, spe: 0.9 },
  Sassy: { spd: 1.1, spe: 0.9 },
  Serious: {},
  Timid: { spe: 1.1, atk: 0.9 },
};

export const calculateStat = (
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureName: string,
  statName: string
) => {
  if (statName === "hp") {
    if (base === 1) return 1; // Shedinja
    return (
      Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) +
      level +
      10
    );
  }
  const nature = NATURE_MULTIPLIERS[natureName] || {};
  const multiplier = nature[statName] || 1.0;
  const raw =
    Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(raw * multiplier);
};

/**
 * Calculate Pokemon gender from personality value and species gender ratio
 *
 * @param personalityValue - The Pokemon's personality value (from identity.personality_value)
 * @param genderRatio - Species gender ratio from PokeAPI (0-8, or -1 for genderless)
 *   - -1: Genderless
 *   - 0: Always male (87.5% male species use threshold 31)
 *   - 1: 87.5% male (threshold 31)
 *   - 2: 75% male (threshold 63)
 *   - 4: 50% male (threshold 127)
 *   - 6: 25% male (threshold 191)
 *   - 7: 12.5% male (threshold 225)
 *   - 8: Always female (threshold 254)
 * @returns "male" | "female" | "genderless"
 */
export const calculateGender = (
  personalityValue: number,
  genderRatio: number
): "male" | "female" | "genderless" => {
  // Genderless species
  if (genderRatio === -1) return "genderless";
  // Always male
  if (genderRatio === 0) return "male";
  // Always female
  if (genderRatio === 8) return "female";

  // Get last byte of personality value (handle negative values)
  // Convert to unsigned 32-bit int first, then get last byte
  const unsignedValue = personalityValue >>> 0; // Convert to unsigned
  const genderByte = unsignedValue & 0xff;

  // Map gender ratio to threshold
  const thresholds: Record<number, number> = {
    1: 31, // 87.5% male
    2: 63, // 75% male
    4: 127, // 50% male
    6: 191, // 25% male
    7: 225, // 12.5% male
  };

  const threshold = thresholds[genderRatio] ?? 127; // Default to 50/50

  // Standard logic: < threshold = female, >= threshold = male
  return genderByte >= threshold ? "male" : "female";
};

/**
 * Enrich a PokeDumpMon with species data from PokeAPI
 * This creates a unified object that has everything the UI needs
 */
export const enrichPokemon = (
  pokemon: PokeDumpMon,
  apiData?: CachedPokemon
): EnrichedPokemon => {
  if (!apiData) {
    // Return just the base pokemon if we don't have API data yet
    return pokemon as EnrichedPokemon;
  }

  const baseStats = {
    hp: apiData.stats.hp || 0,
    atk: apiData.stats.attack || 0,
    def: apiData.stats.defense || 0,
    spa: apiData.stats["special-attack"] || 0,
    spd: apiData.stats["special-defense"] || 0,
    spe: apiData.stats.speed || 0,
  };

  const calculatedStats = {
    hp: calculateStat(
      baseStats.hp,
      pokemon.stats.ivs.hp,
      pokemon.stats.evs.hp,
      pokemon.state.level,
      pokemon.state.nature,
      "hp"
    ),
    atk: calculateStat(
      baseStats.atk,
      pokemon.stats.ivs.atk,
      pokemon.stats.evs.atk,
      pokemon.state.level,
      pokemon.state.nature,
      "atk"
    ),
    def: calculateStat(
      baseStats.def,
      pokemon.stats.ivs.def,
      pokemon.stats.evs.def,
      pokemon.state.level,
      pokemon.state.nature,
      "def"
    ),
    spa: calculateStat(
      baseStats.spa,
      pokemon.stats.ivs.spa,
      pokemon.stats.evs.spa,
      pokemon.state.level,
      pokemon.state.nature,
      "spa"
    ),
    spd: calculateStat(
      baseStats.spd,
      pokemon.stats.ivs.spd,
      pokemon.stats.evs.spd,
      pokemon.state.level,
      pokemon.state.nature,
      "spd"
    ),
    spe: calculateStat(
      baseStats.spe,
      pokemon.stats.ivs.spe,
      pokemon.stats.evs.spe,
      pokemon.state.level,
      pokemon.state.nature,
      "spe"
    ),
  };

  const gender = calculateGender(
    pokemon.identity.personality_value,
    apiData.gender_rate
  );

  return {
    ...pokemon,
    species: {
      name: apiData.name,
      displayName: toTitleCase(apiData.name),
      sprite:
        apiData.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png`,
      types: apiData.types || [],
      baseStats,
      genderRate: apiData.gender_rate,
      abilities: apiData.abilities.map((a) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        slot: a.slot,
      })),
    },
    computed: {
      gender,
      calculatedStats,
    },
  };
};
