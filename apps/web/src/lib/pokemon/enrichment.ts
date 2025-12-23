import { CONFIG } from "@/lib/constants/config";
import type {
  EnrichedMove,
  EnrichedPokemon,
  Gender,
  Nature,
  PokeApiMove,
  PokeApiSpecies,
  PokeDumpMon,
} from "@/types/pokemon";

export const toTitleCase = (s: string) =>
  (s || "").replace(/(^|\s|[-_])\w/g, (m) => m.toUpperCase()).replace(/[-_]/g, " ");

export const getPokeApiSlug = (p: PokeDumpMon) => {
  if (p.pokeapi_override) return String(p.pokeapi_override).trim();
  if (p.identity.form_id && p.identity.form_id > 0) return `id-${p.identity.species_id}-form-${p.identity.form_id}`;
  return String(p.identity.species_id);
};

export const NATURE_MULTIPLIERS: Record<Nature, Record<string, number>> = {
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
  natureName: Nature,
  statName: string
) => {
  if (statName === "hp") {
    if (base === 1) return 1;
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  const nature = NATURE_MULTIPLIERS[natureName] || {};
  const multiplier = nature[statName] || 1.0;
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(raw * multiplier);
};

export const calculateGender = (personalityValue: number, genderRatio: number): Gender => {
  if (genderRatio === -1) return "genderless";
  if (genderRatio === 0) return "male";
  if (genderRatio === 8) return "female";
  const unsignedValue = personalityValue >>> 0;
  const genderByte = unsignedValue & 0xff;
  const thresholds: Record<number, number> = {
    1: 31,
    2: 63,
    4: 127,
    6: 191,
    7: 225,
  };
  const threshold = thresholds[genderRatio] ?? 127;
  return genderByte >= threshold ? "male" : "female";
};

export const getSpriteUrl = (speciesId: number, isShiny = false) => {
  const shinyPath = isShiny ? "shiny/" : "";
  if (speciesId <= 649) {
    return `${CONFIG.sprites.baseUrl}/${CONFIG.sprites.paths.animated}/${shinyPath}${speciesId}.gif`;
  }
  return `${CONFIG.sprites.baseUrl}/${shinyPath}${speciesId}.png`;
};

// --- UPDATED ENRICH FUNCTION ---
export const enrichPokemon = (
  pokemon: PokeDumpMon,
  apiData?: PokeApiSpecies,
  moveCache?: Record<string | number, PokeApiMove>,
  abilityCache?: Record<number, { description: string | null }>
): EnrichedPokemon => {
  if (!apiData) {
    return pokemon as EnrichedPokemon;
  }

  // ... [Keep stats calc logic] ...
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

  const gender = calculateGender(pokemon.identity.personality_value, apiData.gender_rate);

  // SPRITE SELECTION LOGIC
  const isShiny = pokemon.identity.is_shiny;

  // Calculate specific URLs for the current state (Shiny or Normal)
  const currentStaticUrl = isShiny
    ? apiData.sprites.front_shiny || getSpriteUrl(pokemon.identity.species_id, true)
    : apiData.sprites.front_default || getSpriteUrl(pokemon.identity.species_id, false);

  const currentAnimatedUrl = isShiny ? apiData.sprites.animated_shiny : apiData.sprites.animated;

  // Calculate fallback URLs for the object (so we have everything)
  const baseStaticUrl = apiData.sprites.front_default || getSpriteUrl(pokemon.identity.species_id, false);
  const shinyStaticUrl = apiData.sprites.front_shiny || getSpriteUrl(pokemon.identity.species_id, true);

  // RESOLVE MOVES
  const movesData: EnrichedMove[] = [];
  if (moveCache && pokemon.moves) {
    for (const m of pokemon.moves) {
      const cached = moveCache[m.move_id];
      if (cached) {
        movesData.push({ ...cached, pp_left: m.pp });
      }
    }
  }

  // RESOLVE ACTIVE ABILITY
  let activeAbility: { name: string; isHidden: boolean; slot: number; id?: number; description?: string } | undefined;
  const abilityId = pokemon.ability?.id;
  const abilitySlot = pokemon.ability?.slot;

  if (abilityId) {
    const found = apiData.abilities.find((a) => {
      const parts = a.ability.url.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (!lastPart) return false;
      const id = parseInt(lastPart);
      return id === abilityId;
    });
    if (found) {
      activeAbility = {
        name: found.ability.name,
        isHidden: found.is_hidden,
        slot: found.slot,
        id: abilityId,
        description: abilityCache?.[abilityId]?.description ?? undefined,
      };
    }
  }

  // Fallback: Use slot if ID lookup failed (common for Hidden Abilities where ID is missing in dump)
  if (!activeAbility && abilitySlot) {
    const found = apiData.abilities.find((a) => a.slot === abilitySlot);
    if (found) {
      const parts = found.ability.url.split("/").filter(Boolean);
      const id = parseInt(parts[parts.length - 1] || "0");
      activeAbility = {
        name: found.ability.name,
        isHidden: found.is_hidden,
        slot: found.slot,
        id: id || undefined,
        description: (id && abilityCache?.[id]?.description) || undefined,
      };
    }
  }

  // Compute display helpers
  const nickname = pokemon.identity.nickname?.trim();
  const hasNickname = Boolean(nickname && !nickname.startsWith("Species "));
  const speciesName = toTitleCase(apiData.name);
  const displayName = hasNickname ? nickname! : speciesName || `Species ${pokemon.identity.species_id}`;
  const showSpeciesName = hasNickname && speciesName !== displayName;
  const dexNum = `#${String(pokemon.identity.species_id).padStart(3, "0")}`;
  const animatedUrl = currentAnimatedUrl;
  const staticUrl = currentStaticUrl;
  const preferredSprite = currentAnimatedUrl || currentStaticUrl;
  const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.identity.species_id}.ogg`;

  // Compute IV/EV stats
  const perfectIvCount = Object.values(pokemon.stats.ivs).filter((iv) => iv === 31).length;
  const totalIvSum = Object.values(pokemon.stats.ivs).reduce((sum, iv) => sum + iv, 0);
  const totalEvSum = Object.values(pokemon.stats.evs).reduce((sum, ev) => sum + ev, 0);

  // Compute HP display values
  const currentHp = pokemon.state.current_hp ?? calculatedStats.hp;
  const maxHp = calculatedStats.hp;
  const hpPercent = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;
  const hpColor = hpPercent > 50 ? "green" : hpPercent > 20 ? "yellow" : "red";
  const hpColorClass = hpColor === "red" ? "bg-red-500" : hpColor === "yellow" ? "bg-yellow-500" : "bg-green-500";

  return {
    ...pokemon,
    movesData,
    activeAbility,
    species: {
      height: 0, // TODO: Add height to PokeAPI response
      weight: 0, // TODO: Add weight to PokeAPI response
      name: apiData.name,
      displayName: toTitleCase(apiData.name),
      // SMART SPRITE: The main 'sprite' field used by UI
      sprite: currentAnimatedUrl || currentStaticUrl,

      // FULL SPRITE OBJECT (Matches Type Definition)
      sprites: {
        front_default: baseStaticUrl,
        front_shiny: shinyStaticUrl,
        animated: apiData.sprites.animated || null,
        animated_shiny: apiData.sprites.animated_shiny || null,
      },
      types: apiData.types || [],
      baseStats,
      genderRate: apiData.gender_rate,
      growth_rate: apiData.growth_rate || null,
      abilities: apiData.abilities.map((a) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        slot: a.slot,
      })),
    },
    computed: {
      gender,
      calculatedStats,
      displayName,
      hasNickname,
      speciesName,
      showSpeciesName,
      dexNum,
      animatedUrl,
      staticUrl,
      preferredSprite,
      cryUrl,
      perfectIvCount,
      totalIvSum,
      totalEvSum,
      hpPercent,
      hpColor,
      hpColorClass,
    },
  };
};
