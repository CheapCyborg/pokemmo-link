"use client";

import type { EnrichedPokemon } from "@/types/pokemon";

interface PokemonQuickInfoProps {
  pokemon: EnrichedPokemon;
}

export function PokemonQuickInfo({ pokemon }: PokemonQuickInfoProps) {
  // TODO: Fetch from PokeAPI species endpoint
  const height = pokemon.species?.height
    ? (pokemon.species.height / 10).toFixed(1)
    : "—";
  const weight = pokemon.species?.weight
    ? (pokemon.species.weight / 10).toFixed(1)
    : "—";

  // TODO: Fetch from PokeAPI species endpoint
  const eggGroups = ["—"]; // e.g., ["Water 1", "Field"]
  const captureRate = 0; // 0-255
  const captureRateLabel = "Unknown";
  const captureRatePercent = 0;

  return (
    <div className="px-6">
      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-none">
        {/* Height */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">
            Height
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {height}m
          </div>
        </div>

        {/* Weight */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">
            Weight
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {weight}kg
          </div>
        </div>

        {/* Egg Groups */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">
            Egg Groups
          </div>
          <div className="flex flex-wrap gap-1">
            {eggGroups.map((group, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                {group}
              </span>
            ))}
          </div>
        </div>

        {/* Catch Rate */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">
            Catch Rate
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${captureRatePercent}%` }}
                />
              </div>
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {captureRate}/255 · {captureRateLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
