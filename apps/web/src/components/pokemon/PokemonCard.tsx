"use client";
import { DAYCARE_REGIONS, getRegionForSlot } from "@/lib/constants/regions";
import { imageCache } from "@/lib/imageCache";
import { getSpriteUrl, toTitleCase } from "@/lib/poke";
import { getLevelProgress } from "@/lib/xp";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Flame, Mars, Sparkles, Venus } from "lucide-react";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { NatureBadge } from "./NatureBadge";
import { TypeBadge } from "./TypeBadge";

interface PokemonCardProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "onClick"
> {
  pokemon: EnrichedPokemon;
  onCardClick: (pokemon: EnrichedPokemon) => void;
  context?: "party" | "daycare" | "pc";
}

const PokemonCardComponent = ({
  pokemon,
  onCardClick,
  className,
  context,
  ...rest
}: PokemonCardProps) => {
  const nickname = pokemon.identity.nickname?.trim();
  const hasNickname = nickname && !nickname.startsWith("Species ");
  const displayName = hasNickname
    ? nickname
    : pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`;
  const speciesName =
    pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`;
  const showSpeciesName =
    displayName.toLowerCase() !== speciesName.toLowerCase();
  const dexNum = `#${String(pokemon.identity.species_id).padStart(3, "0")}`;

  const isShiny = pokemon.identity.is_shiny;
  const isAlpha = pokemon.identity.is_alpha;

  // 1. URLs
  const animatedUrl = isShiny
    ? pokemon.species?.sprites.animated_shiny
    : pokemon.species?.sprites.animated;

  const staticUrl = isShiny
    ? pokemon.species?.sprites.front_shiny ||
      getSpriteUrl(pokemon.identity.species_id, true)
    : pokemon.species?.sprites.front_default ||
      getSpriteUrl(pokemon.identity.species_id, false);

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

  // Calculate IV Summary (e.g. "3x31")
  const perfectIvCount = Object.values(pokemon.stats.ivs).filter(
    (iv) => iv === 31
  ).length;

  // Calculate HP Color
  const hpPercent =
    pokemon.state.current_hp !== null && pokemon.computed?.calculatedStats.hp
      ? (pokemon.state.current_hp / pokemon.computed.calculatedStats.hp) * 100
      : 100;

  const hpColor =
    hpPercent <= 20
      ? "bg-red-500"
      : hpPercent <= 50
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <button
      onClick={() => onCardClick(pokemon)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`text-left w-full h-full group will-change-transform ${className || ""}`}
      {...rest}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-slate-950/50 border border-gray-200 dark:border-slate-700 overflow-hidden group-hover:shadow-xl dark:group-hover:shadow-slate-900/80 group-hover:border-indigo-500/50 dark:group-hover:border-indigo-400/50 transition-all duration-300 flex flex-col h-full">
        <div className="p-2 flex gap-2 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700 relative group-hover:from-indigo-50/50 group-hover:to-indigo-100/50 dark:group-hover:from-slate-800 dark:group-hover:to-slate-800 transition-colors duration-300 grow">
          {/* Left Column: Image */}
          <div className="shrink-0 flex flex-col items-center justify-center pl-1">
            <Image
              src={imgSrc}
              alt={displayName}
              width={56}
              height={56}
              unoptimized
              className={`w-14 h-14 object-contain [image-rendering:pixelated] transition-transform duration-500 ease-out ${
                isStatic
                  ? "scale-135 group-hover:scale-145"
                  : "scale-125 group-hover:scale-135"
              } ${
                isAlpha
                  ? "drop-shadow-[0_0_6px_rgba(220,38,38,0.7)]"
                  : "drop-shadow-sm"
              }`}
              onError={handleError}
              priority={false}
            />
          </div>

          {/* Right Column: Info */}
          <div className="grow min-w-0 flex flex-col justify-between">
            <div>
              {/* Header: ID + Badges */}
              <div className="flex justify-between items-center mb-0.5">
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold leading-none">
                  {dexNum}
                </div>
                {context === "daycare" && (
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full mr-auto ml-2">
                    {DAYCARE_REGIONS.find(
                      (r) => r.id === getRegionForSlot(pokemon.slot)
                    )?.name || "Unknown"}
                  </span>
                )}
                <div className="flex gap-1 items-center">
                  <div className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm leading-none">
                    Lv {pokemon.state.level}
                  </div>
                  {isAlpha && (
                    <Flame
                      className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-sm"
                      aria-label="Alpha"
                    />
                  )}
                  {isShiny && (
                    <Sparkles
                      className="w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow-sm"
                      aria-label="Shiny"
                    />
                  )}
                </div>
              </div>

              {/* Name + Gender */}
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                  {displayName}
                </h3>
                {pokemon.computed?.gender === "female" && (
                  <Venus className="w-4 h-4 text-pink-500 shrink-0" />
                )}
                {pokemon.computed?.gender === "male" && (
                  <Mars className="w-4 h-4 text-blue-500 shrink-0" />
                )}
                {perfectIvCount > 0 && (
                  <span className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800 leading-none shadow-sm inline-block shrink-0 whitespace-nowrap">
                    {perfectIvCount}x31
                  </span>
                )}
              </div>

              {/* Species Name */}
              {showSpeciesName && (
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate leading-tight">
                  {speciesName}
                </p>
              )}

              {/* Badges Row */}
              <div className="flex flex-wrap gap-1 mt-1 items-center">
                <NatureBadge nature={pokemon.state.nature} size="xs" />
                {types.map((type) => (
                  <TypeBadge key={type} type={type} size="xs" />
                ))}
              </div>
            </div>

            {/* Ability - Pushed to bottom if space allows, or just flow */}
            <div className="mt-1 flex items-baseline gap-1 text-[11px] leading-tight">
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
                    <span className="ml-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-bold shrink-0">
                      (H)
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-semibold truncate text-gray-400 dark:text-gray-500 italic">
                  Unknown
                </span>
              )}
            </div>

            <div>
              {/* Compact Stats Grid */}
              <div className="grid grid-cols-6 gap-px mt-1 pt-1 border-t border-gray-100 dark:border-slate-700">
                {[
                  { key: "hp", label: "HP" },
                  { key: "atk", label: "Atk" },
                  { key: "def", label: "Def" },
                  { key: "spa", label: "SpA" },
                  { key: "spd", label: "SpD" },
                  { key: "spe", label: "Spe" },
                ].map(({ key, label }) => {
                  const val =
                    pokemon.computed?.calculatedStats[
                      key as keyof typeof pokemon.computed.calculatedStats
                    ] || 0;
                  const ev =
                    pokemon.stats.evs[key as keyof typeof pokemon.stats.evs] ||
                    0;
                  const iv =
                    pokemon.stats.ivs[key as keyof typeof pokemon.stats.ivs] ||
                    0;
                  return (
                    <div key={key} className="flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">
                        {label}
                      </span>
                      <div className="h-3 flex items-center justify-center">
                        <span
                          className={`text-[8px] font-bold leading-none ${
                            iv === 31
                              ? "text-green-600 dark:text-green-400"
                              : iv === 0
                                ? "text-red-500 dark:text-red-400"
                                : "text-blue-500 dark:text-blue-400"
                          }`}>
                          {iv}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-none">
                        {val}
                      </span>
                      <div className="h-3 flex items-center justify-center">
                        <span
                          className={`text-[8px] font-bold ${
                            ev > 0
                              ? "text-amber-600 dark:text-amber-500"
                              : "text-slate-300 dark:text-slate-600"
                          }`}>
                          {ev}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Integrated HP Bar */}
              {pokemon.state.current_hp !== null &&
                pokemon.computed?.calculatedStats.hp && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${hpColor} rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.min(100, hpPercent)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] mt-0.5 font-mono font-bold text-slate-500 dark:text-slate-400 leading-none">
                      <span>HP</span>
                      <span>
                        {pokemon.state.current_hp}/
                        {pokemon.computed.calculatedStats.hp}
                      </span>
                    </div>
                  </div>
                )}
            </div>
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
              <span className="font-mono">
                ID: {String(pokemon.identity.uuid).slice(-4)}
              </span>
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
