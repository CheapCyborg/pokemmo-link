"use client";
import { imageCache } from "@/lib/imageCache";
import type { EnrichedPokemon } from "@/types/pokemon";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { NatureBadge } from "./NatureBadge";
import { TypeBadge } from "./TypeBadge";

interface PokemonCardProps extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
  pokemon: EnrichedPokemon;
  onCardClick: (pokemon: EnrichedPokemon) => void;
}

const PokemonCardComponent = ({
  pokemon,
  onCardClick,
  className,
  ...rest
}: PokemonCardProps) => {
  const nickname = pokemon.identity.nickname?.trim();
  const hasNickname = nickname && !nickname.startsWith("Species ");
  
  const displayName = hasNickname ? nickname : (pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`);
  const speciesName = pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`;
  
  // 1. URLs
  const animatedUrl = pokemon.species?.sprites.animated;
  const staticUrl = pokemon.species?.sprites.front_default || 
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png`;

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
      className={`text-left w-full group will-change-transform ${className || ""}`}
      {...rest}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 overflow-hidden group-hover:shadow-xl group-hover:scale-[1.02] group-hover:border-indigo-500/50 dark:group-hover:border-indigo-400/50 transition-all duration-300 flex flex-col">
        <div className="p-3 flex items-center space-x-3 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700 relative group-hover:from-indigo-50/50 group-hover:to-indigo-100/50 dark:group-hover:from-slate-800 dark:group-hover:to-slate-800 transition-colors duration-300">
          <div className="absolute top-2 right-2 bg-gray-800 dark:bg-slate-950 text-white text-[8px] px-1.5 py-1 rounded-sm font-bold z-10 shadow-sm font-['Press_Start_2P'] leading-none">
            Lv.{pokemon.state.level}
          </div>

          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-gray-100 dark:border-slate-700 overflow-hidden">
              <Image
                src={imgSrc}
                alt={displayName}
                width={56}
                height={56}
                unoptimized
                // Smooth scale transition: 10% zoom on static image
                className={`w-14 h-14 object-contain [image-rendering:pixelated] transition-transform duration-500 ease-out ${
                  isStatic ? "scale-110" : "scale-100"
                }`}
                onError={handleError}
                priority={false}
              />
            </div>
          </div>

          <div className="grow min-w-0">
            <h3 className="text-md font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
              {displayName}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5 truncate">
              {speciesName}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              <NatureBadge nature={pokemon.state.nature} />
              {types.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Minimal HP Bar */}
        {pokemon.state.current_hp !== null && pokemon.computed?.calculatedStats.hp && (
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <div className="flex justify-between text-[9px] mb-1 font-['Press_Start_2P'] text-slate-600 dark:text-slate-400">
              <span>HP</span>
              <span>{pokemon.state.current_hp}/{pokemon.computed.calculatedStats.hp}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (pokemon.state.current_hp / pokemon.computed.calculatedStats.hp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-slate-800/50 px-3 py-2 text-[9px] text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <span className="truncate">OT: {pokemon.identity.ot_name}</span>
          {Number(pokemon.identity.uuid) !== 0 && (
            <span className="font-mono">
              ID: {String(pokemon.identity.uuid).slice(-4)}
            </span>
          )}
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
    prev.pokemon.species?.displayName === next.pokemon.species?.displayName &&
    prev.onCardClick === next.onCardClick
  );
});