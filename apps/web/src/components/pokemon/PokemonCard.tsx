"use client";
import { DAYCARE_REGIONS, getRegionForSlot } from "@/lib/constants/regions";
import { imageCache } from "@/lib/imageCache";
import { toTitleCase } from "@/lib/pokemon/enrichment";
import { getLevelProgress } from "@/lib/pokemon/xp";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Flame, Mars, Sparkles, Venus } from "lucide-react";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { NatureBadge } from "./NatureBadge";
import { TypeBadge } from "./TypeBadge";

interface PokemonCardProps extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
  pokemon: EnrichedPokemon;
  onCardClick: (pokemon: EnrichedPokemon) => void;
  context?: "party" | "daycare" | "pc";
}

const PokemonCardComponent = ({ pokemon, onCardClick, className, context, ...rest }: PokemonCardProps) => {
  // Zero logic - ALL values pre-computed in enrichment
  const displayName = pokemon.computed.displayName;
  const speciesName = pokemon.computed.speciesName;
  const showSpeciesName = pokemon.computed.showSpeciesName;
  const dexNum = pokemon.computed.dexNum;
  const perfectIvCount = pokemon.computed.perfectIvCount;
  const hpPercent = pokemon.computed.hpPercent;
  const hpColorClass = pokemon.computed.hpColorClass;

  const isShiny = pokemon.identity.is_shiny;
  const isAlpha = pokemon.identity.is_alpha;

  // Sprite URLs - pre-computed with shiny state
  const animatedUrl = pokemon.computed.animatedUrl;
  const staticUrl = pokemon.computed.staticUrl;

  // 2. Default to Static (PNG)
  const [imgSrc, setImgSrc] = useState(staticUrl);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // 3. Reset to Static when the pokemon prop changes
  useEffect(() => {
    setImgSrc(staticUrl);
  }, [staticUrl]);

  // 4. Hover Handlers (Debounced)
  const handleMouseEnter = () => {
    if (animatedUrl && !imageCache.isBroken(animatedUrl)) {
      hoverTimer.current = setTimeout(() => {
        setImgSrc(animatedUrl);
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setImgSrc(staticUrl);
  };

  // 5. Error Handler
  const handleError = () => {
    if (imgSrc === animatedUrl && animatedUrl) {
      imageCache.reportError(animatedUrl);
      setImgSrc(staticUrl);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const types = pokemon.species?.types || [];
  const isStatic = imgSrc === staticUrl;

  return (
    <button
      onClick={() => onCardClick(pokemon)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`text-left w-full h-full group will-change-transform cursor-pointer ${className || ""}`}
      {...rest}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-slate-950/50 border border-gray-200 dark:border-slate-700 overflow-hidden group-hover:shadow-2xl group-hover:shadow-indigo-500/20 dark:group-hover:shadow-indigo-500/30 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 group-hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        <div className="p-2 flex flex-auto items-center gap-2 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700 relative group-hover:from-indigo-100 group-hover:to-indigo-50 dark:group-hover:from-indigo-950/40 dark:group-hover:to-slate-800 transition-colors duration-300">
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            <div className="text-[10px] font-mono bg-slate-900/85 dark:bg-slate-100/90 text-white dark:text-slate-900 rounded-md px-2 py-0.5 font-bold shadow-sm leading-none">
              {dexNum}
            </div>
            {(isAlpha || isShiny) && (
              <div className="">
                {isAlpha && (
                  <span className="inline-flex items-center justify-center bg-slate-900/85 dark:bg-slate-100/90 rounded-md px-2 py-0.5 shadow-sm leading-none">
                    <Flame className="w-4 h-4 text-red-500 fill-red-500" aria-label="Alpha" />
                  </span>
                )}
                {isShiny && (
                  <span className="inline-flex items-center justify-center bg-slate-900/85 dark:bg-slate-100/90 rounded-md px-2 py-0.5 shadow-sm leading-none">
                    <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-label="Shiny" />
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Left Column: Image */}
          <div className="shrink-0 flex items-center justify-center pl-1 pt-6">
            <Image
              src={imgSrc}
              alt={displayName}
              width={56}
              height={56}
              unoptimized
              className={`[image-rendering:pixelated] transition-transform duration-500 ease-out ${
                isStatic ? "scale-135 group-hover:scale-145" : "scale-125 group-hover:scale-135"
              } ${isAlpha ? "drop-shadow-[0_0_6px_rgba(220,38,38,0.7)]" : "drop-shadow-sm"}`}
              onError={handleError}
              priority={false}
            />
          </div>

          {/* Right Column: Info */}
          <div className="grow min-w-0 flex flex-col h-full">
            {/* Header: Level/IV - Fixed Height h-6 */}
            <div className="flex justify-end items-start h-6 mb-0.5 shrink-0">
              {context === "daycare" && (
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full mr-auto ml-0 self-start">
                  {DAYCARE_REGIONS.find((r) => r.id === getRegionForSlot(pokemon.slot))?.name || "Unknown"}
                </span>
              )}
              <div className="flex flex-col gap-0.5 items-end justify-start">
                <div className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm leading-none">
                  Lv {pokemon.state.level}
                </div>
                {perfectIvCount > 0 && (
                  <span className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800 leading-none shadow-sm inline-block shrink-0 whitespace-nowrap">
                    {perfectIvCount}x31
                  </span>
                )}
              </div>
            </div>

            {/* Name + Gender - Fixed Height h-5 */}
            <div className="flex items-center gap-1 h-5 shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                {displayName}
              </h3>
              {pokemon.computed.gender === "female" && <Venus className="w-4 h-4 text-pink-500 shrink-0" />}
              {pokemon.computed.gender === "male" && <Mars className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>

            {/* Species Name - Fixed Height h-3.5 (Always render container) */}
            <div className="">
              {showSpeciesName && (
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate leading-tight">
                  {speciesName}
                </p>
              )}
            </div>

            {/* Badges Row - Fixed Height h-10 (allows 2 rows) */}
            <div className="flex flex-wrap gap-1 content-start h-10 overflow-hidden shrink-0">
              <NatureBadge nature={pokemon.state.nature} size="xs" />
              {types.map((type) => (
                <TypeBadge key={type} type={type} size="xs" />
              ))}
            </div>

            {/* Spacer */}
            <div className="grow" />

            {/* Ability - Fixed Height h-4, tight to stats */}
            <div className="flex items-baseline gap-1 text-[11px] leading-tight h-4 overflow-hidden shrink-0 mb-0.5">
              <span className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider shrink-0">
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
                    <span className="ml-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-bold shrink-0">(H)</span>
                  )}
                </div>
              ) : (
                <span className="font-semibold truncate text-gray-400 dark:text-gray-500 italic">Unknown</span>
              )}
            </div>

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
                    <span className="text-[12px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-none">
                      {val}
                    </span>
                    <div className="h-3 flex items-center justify-center">
                      <span
                        className={`text-[9px] font-bold ${
                          ev > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-300 dark:text-slate-600"
                        }`}>
                        {ev}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Integrated HP Bar */}
            {pokemon.state.current_hp !== null && pokemon.computed.calculatedStats.hp && (
              <div className="mt-1 shrink-0">
                <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${hpColorClass} rounded-full transition-all duration-500`}
                    style={{
                      width: `${Math.min(100, hpPercent)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-0.5 font-mono font-bold text-slate-500 dark:text-slate-400 leading-none">
                  <span>HP</span>
                  <span>
                    {pokemon.state.current_hp}/{pokemon.computed.calculatedStats.hp}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 px-2 py-1.5 text-[9px] text-gray-400 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-1 shrink-0">
          {/* XP Bar */}
          {pokemon.state.xp !== null && (
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
          )}
          <div className="flex justify-between items-center w-full">
            <span className="truncate">OT: {pokemon.identity.ot_name}</span>
            {Number(pokemon.identity.uuid) !== 0 && (
              <span className="font-mono">ID: {String(pokemon.identity.uuid).slice(-4)}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export const PokemonCard = memo(PokemonCardComponent, (prev, next) => {
  return (
    prev.pokemon.identity.uuid === next.pokemon.identity.uuid &&
    prev.pokemon.state.current_hp === next.pokemon.state.current_hp &&
    prev.pokemon.state.level === next.pokemon.state.level &&
    prev.pokemon.state.happiness === next.pokemon.state.happiness &&
    prev.pokemon.identity.is_shiny === next.pokemon.identity.is_shiny &&
    prev.pokemon.identity.is_alpha === next.pokemon.identity.is_alpha &&
    prev.pokemon.species?.displayName === next.pokemon.species?.displayName &&
    prev.onCardClick === next.onCardClick
  );
});
