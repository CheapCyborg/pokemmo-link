import { getLevelProgress } from "@/lib/pokemon/xp";
import { cn } from "@/lib/utils";
import { usePokemonCardContext } from "./PokemonCardContext";

export interface PokemonCardFooterProps {
  className?: string;
}

/**
 * PokemonCard.Footer displays XP bar and OT info.
 */
export function PokemonCardFooter({ className }: PokemonCardFooterProps) {
  const { pokemon } = usePokemonCardContext();

  return (
    <div
      className={cn(
        "bg-gray-50 dark:bg-slate-800/50 px-2 py-1.5 text-[9px] text-gray-400 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-1 shrink-0",
        className
      )}>
      {/* HP Bar */}
      {pokemon.state.current_hp !== null && (
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold w-3 shrink-0">HP</span>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", pokemon.computed.hpColorClass)}
              style={{ width: `${pokemon.computed.hpPercent}%` }}
            />
          </div>
        </div>
      )}
      {/* XP Bar */}
      {pokemon.state.xp !== null && (
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold w-3 shrink-0">XP</span>
          <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${getLevelProgress(
                  pokemon.state.xp,
                  pokemon.state.level,
                  pokemon.species?.growth_rate || undefined
                )}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center w-full">
        <span className="truncate">OT: {pokemon.identity.ot_name}</span>
        {Number(pokemon.identity.uuid) !== 0 && (
          <span className="font-mono">ID: {String(pokemon.identity.uuid).slice(-4)}</span>
        )}
      </div>
    </div>
  );
}
