"use client";
import { StatRow } from "@/components/pokemon/StatRow";
import { NATURE_MULTIPLIERS } from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";

export const PokemonStats = ({
  pokemon,
}: {
  pokemon: EnrichedPokemon;
}) => {
  // If species data isn't loaded yet, show a loading state
  if (!pokemon.species || !pokemon.computed) {
    return (
      <div className="p-3 text-center text-gray-500">
        Loading species data...
      </div>
    );
  }

  const { computed } = pokemon;
  const ivs = pokemon.stats.ivs;
  const evs = pokemon.stats.evs;
  const nature = pokemon.state.nature;
  const stats = computed.calculatedStats;

  // Use a fixed maximum (e.g., 400) to allow comparison between Pokemon,
  // but expand if this Pokemon has a stat exceeding that (e.g. Blissey HP)
  const maxStat = Math.max(...Object.values(stats), 400);
  const natureMods = NATURE_MULTIPLIERS[nature] || {};

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3">
      <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
        <div className="w-20">Stat</div>
        <div className="grow"></div>
        <div className="w-8 text-right">IV</div>
        <div className="w-10 text-right">EV</div>
      </div>
      <div className="space-y-2">
        <StatRow
          label="HP"
          stat={stats.hp}
          iv={ivs.hp}
          ev={evs.hp}
          maxStat={maxStat}
          color="bg-green-500"
          natureEffect={natureMods.hp}
        />
        <StatRow
          label="Atk"
          stat={stats.atk}
          iv={ivs.atk}
          ev={evs.atk}
          maxStat={maxStat}
          color="bg-red-500"
          natureEffect={natureMods.atk}
        />
        <StatRow
          label="Def"
          stat={stats.def}
          iv={ivs.def}
          ev={evs.def}
          maxStat={maxStat}
          color="bg-orange-500"
          natureEffect={natureMods.def}
        />
        <StatRow
          label="SpA"
          stat={stats.spa}
          iv={ivs.spa}
          ev={evs.spa}
          maxStat={maxStat}
          color="bg-blue-500"
          natureEffect={natureMods.spa}
        />
        <StatRow
          label="SpD"
          stat={stats.spd}
          iv={ivs.spd}
          ev={evs.spd}
          maxStat={maxStat}
          color="bg-purple-500"
          natureEffect={natureMods.spd}
        />
        <StatRow
          label="Spe"
          stat={stats.spe}
          iv={ivs.spe}
          ev={evs.spe}
          maxStat={maxStat}
          color="bg-pink-500"
          natureEffect={natureMods.spe}
        />
      </div>
    </div>
  );
};
