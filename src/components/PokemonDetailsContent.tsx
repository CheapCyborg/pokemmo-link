"use client";
import { StatRow } from "@/components/StatRow";
import { NATURE_MULTIPLIERS } from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";

export const PokemonDetailsContent = ({
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

  const maxStat = Math.max(...Object.values(stats), 1);
  const natureMods = NATURE_MULTIPLIERS[nature] || {};

  const currentHp = pokemon.state.current_hp;
  const happiness = pokemon.state.happiness;
  const gender = computed.gender;

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm border-b border-gray-800 pb-3">
        <div>
          <span className="text-gray-500">HP:</span>{" "}
          <span className="font-mono">
            {currentHp !== undefined && currentHp !== null
              ? `${currentHp} / ${stats.hp}`
              : stats.hp}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Happiness:</span>{" "}
          <span className="font-mono">{happiness ?? "-"}</span>
        </div>
        <div>
          <span className="text-gray-500">Gender:</span>{" "}
          <span className="font-mono font-bold">
            {gender === "female" ? (
              <span className="text-pink-500">♀</span>
            ) : gender === "male" ? (
              <span className="text-blue-500">♂</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
        <span>Stats</span>
        <span className="text-right">IVs / EVs</span>
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
