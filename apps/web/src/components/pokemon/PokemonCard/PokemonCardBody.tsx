import { cn } from "@/lib/utils";
import { usePokemonCardContext } from "./PokemonCardContext";

export interface PokemonCardBodyProps {
  showIVs?: boolean; // Phase 2: Controlled by permissions
  showEVs?: boolean; // Phase 2: Controlled by permissions
  className?: string;
}

/**
 * PokemonCard.Body displays compact stats grid.
 */
export function PokemonCardBody({ showIVs, showEVs, className }: PokemonCardBodyProps) {
  const { pokemon, permissions } = usePokemonCardContext();

  // Phase 2: Check permissions, Phase 1: showIVs/showEVs undefined = use defaults
  const canViewIVs = showIVs ?? permissions?.canViewIVs ?? true;
  const canViewEVs = showEVs ?? permissions?.canViewEVs ?? true;

  return (
    <div className={cn("px-2 pb-1", className)}>
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-6 gap-px pt-0.5 border-t border-gray-100 dark:border-slate-700 shrink-0">
        {[
          { key: "hp", label: "HP" },
          { key: "atk", label: "Atk" },
          { key: "def", label: "Def" },
          { key: "spa", label: "SpA" },
          { key: "spd", label: "SpD" },
          { key: "spe", label: "Spe" },
        ].map(({ key, label }) => {
          const val = pokemon.computed.calculatedStats[key as keyof typeof pokemon.computed.calculatedStats];
          const ev = pokemon.stats.evs[key as keyof typeof pokemon.stats.evs];
          const iv = pokemon.stats.ivs[key as keyof typeof pokemon.stats.ivs];
          return (
            <div key={key} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{label}</span>
              {canViewIVs && (
                <div className="h-3 flex items-center justify-center">
                  <span
                    className={`text-[9px] font-bold leading-none ${
                      iv === 31
                        ? "text-green-600 dark:text-green-400"
                        : iv === 0
                          ? "text-red-500 dark:text-red-400"
                          : "text-blue-500 dark:text-blue-400"
                    }`}>
                    {iv}
                  </span>
                </div>
              )}
              <span className="text-[12px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-none">
                {val}
              </span>
              {canViewEVs && (
                <div className="h-3 flex items-center justify-center">
                  <span
                    className={`text-[9px] font-bold ${
                      ev > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-300 dark:text-slate-600"
                    }`}>
                    {ev}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
