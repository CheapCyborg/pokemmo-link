import { NatureBadge, TypeBadge } from "@/components/common/Badge";
import { DAYCARE_REGIONS, getRegionForSlot } from "@/lib/constants/regions";
import { toTitleCase } from "@/lib/pokemon/enrichment";
import { cn } from "@/lib/utils";
import { Flame, Mars, Sparkles, Venus } from "lucide-react";
import { PokemonAvatar } from "../display/PokemonAvatar";
import { usePokemonCardContext } from "./PokemonCardContext";

export interface PokemonCardHeaderProps {
  showOwner?: boolean; // Phase 2: Shows owner badge
  context?: "party" | "daycare" | "pc";
  className?: string;
}

/**
 * PokemonCard.Header displays avatar, name, types, and metadata.
 */
export function PokemonCardHeader({ showOwner = false, context, className }: PokemonCardHeaderProps) {
  const { pokemon, owner, isHovered } = usePokemonCardContext();

  const displayName = pokemon.computed.displayName;
  const speciesName = pokemon.computed.speciesName;
  const showSpeciesName = pokemon.computed.showSpeciesName;
  const dexNum = pokemon.computed.dexNum;
  const perfectIvCount = pokemon.computed.perfectIvCount;
  const isShiny = pokemon.identity.is_shiny;
  const isAlpha = pokemon.identity.is_alpha;
  const types = pokemon.species?.types || [];

  return (
    <div
      className={cn(
        "p-2 pb-1 flex flex-col flex-auto gap-3 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700 relative group-hover:from-indigo-100 group-hover:to-indigo-50 dark:group-hover:from-indigo-950/40 dark:group-hover:to-slate-800 transition-colors duration-300",
        className
      )}>
      {/* Top Row: Dex/Status + Level/IV - Consistent spacing */}
      <div className="flex justify-between items-start w-full shrink-0">
        {/* Left: Dex number, Alpha, Shiny */}
        <div className="flex items-center gap-1">
          <div className="text-[12px] font-mono bg-slate-900/85 dark:bg-slate-100/90 text-white dark:text-slate-900 rounded-md px-2 py-0.5 font-bold shadow-sm leading-none">
            {dexNum}
          </div>
          {(isAlpha || isShiny) && (
            <div className="flex gap-1">
              {isAlpha && (
                <span className="inline-flex items-center justify-center bg-slate-900/85 dark:bg-slate-100/90 rounded-md px-2 py-0.5 shadow-sm leading-none">
                  <Flame className="w-3 h-3 text-red-500 fill-red-500" aria-label="Alpha" />
                </span>
              )}
              {isShiny && (
                <span className="inline-flex items-center justify-center bg-slate-900/85 dark:bg-slate-100/90 rounded-md px-2 py-0.5 shadow-sm leading-none">
                  <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" aria-label="Shiny" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Level/IV - Grid layout for consistent alignment */}
        <div className="grid grid-rows-[auto_auto] gap-0.5 items-start justify-items-end">
          {context === "daycare" && (
            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full mr-auto ml-0 justify-self-start">
              {DAYCARE_REGIONS.find((r) => r.id === getRegionForSlot(pokemon.slot))?.name || "Unknown"}
            </span>
          )}
          <div className="bg-indigo-600 dark:bg-indigo-500 text-white text-[12px] px-2 py-0.5 rounded-md font-bold shadow-sm leading-none">
            Lv {pokemon.state.level}
          </div>
          <div className="min-h-[14px] flex items-start justify-end">
            {perfectIvCount > 0 && (
              <span className="text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800 leading-none shadow-sm inline-block shrink-0 whitespace-nowrap">
                {perfectIvCount}x31
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Avatar + Info */}
      <div className="flex items-center gap-2 grow min-h-0">
        {/* Left Column: Avatar - Fixed width container for consistent alignment */}
        <div className="shrink-0 w-[72px] flex justify-center">
          <PokemonAvatar
            pokemon={pokemon}
            size="md"
            isHovered={isHovered}
            className={isAlpha ? "drop-shadow-[0_0_6px_rgba(220,38,38,0.7)]" : "drop-shadow-sm"}
          />
        </div>

        {/* Right Column: Info */}
        <div className="min-w-0 flex flex-col gap-0.5 justify-between h-full">
          <div className="flex flex-col gap-0.5">
            {/* Name + Gender */}
            <div className="flex items-center gap-1 h-5 shrink-0">
              <h3 className="text-[18px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                {displayName}
              </h3>
              {pokemon.computed.gender === "female" && <Venus className="w-4 h-4 text-pink-500 shrink-0" />}
              {pokemon.computed.gender === "male" && <Mars className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>

            {/* Species Name */}
            <div className="min-h-[14px]">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate leading-tight">
                {speciesName}
              </p>
            </div>

            {/* Badges Row */}
            <div className="min-h-[20px] flex flex-wrap gap-1.5 content-start shrink-0 mt-0.5 justify-start">
              <NatureBadge nature={pokemon.state.nature} size="xs" />
              {types.map((type) => (
                <TypeBadge key={type} type={type} size="xs" />
              ))}
            </div>
          </div>

          {/* Ability */}
          <div className="flex items-baseline gap-1 text-[13px] leading-tight overflow-hidden shrink-0 mt-0.5">
            <span className="text-gray-400 dark:text-gray-500 font-bold text-[12px] uppercase tracking-wider shrink-0">
              Ability
            </span>
            {pokemon.activeAbility ? (
              <div className="flex items-baseline min-w-0">
                <span
                  className={`font-semibold truncate ${
                    pokemon.activeAbility.isHidden
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}>
                  {toTitleCase(pokemon.activeAbility.name)}
                </span>
                {pokemon.activeAbility.isHidden && (
                  <span className="ml-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold shrink-0">(H)</span>
                )}
              </div>
            ) : (
              <span className="font-semibold truncate text-gray-400 dark:text-gray-500 italic">Unknown</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
