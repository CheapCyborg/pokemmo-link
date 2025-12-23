import { cn } from "@/lib/utils";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Heart, Mars, Sparkles, Venus } from "lucide-react";

export interface PokemonMetaProps {
  pokemon: EnrichedPokemon;
  detailed?: boolean;
  className?: string;
}

/**
 * PokemonMeta displays Pokemon name, species, level, and gender.
 *
 * Features:
 * - Shows nickname or species name based on hasNickname
 * - Gender icons (Mars for male, Venus for female)
 * - Shiny sparkle indicator
 * - Alpha indicator (future)
 * - Detailed mode shows species name even when nicknamed
 *
 * @example
 * <PokemonMeta pokemon={p} />
 * <PokemonMeta pokemon={p} detailed /> // Shows species + level when nicknamed
 */
export function PokemonMeta({ pokemon, detailed = false, className }: PokemonMetaProps) {
  const displayName = pokemon.computed.displayName;
  const speciesName = pokemon.computed.speciesName;
  const showSpeciesName = pokemon.computed.showSpeciesName;
  const hasNickname = pokemon.computed.hasNickname;

  const gender = pokemon.computed.gender;
  const isShiny = pokemon.identity.is_shiny;
  const isAlpha = pokemon.identity.is_alpha;

  const GenderIcon = gender === "male" ? Mars : gender === "female" ? Venus : null;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-gray-900 dark:text-white truncate">{displayName}</h3>
        {GenderIcon && (
          <GenderIcon
            size={14}
            className={cn("shrink-0", gender === "male" && "text-blue-500", gender === "female" && "text-pink-500")}
            aria-label={gender}
          />
        )}
        {isShiny && <Sparkles size={14} className="shrink-0 text-yellow-400" aria-label="Shiny" />}
        {isAlpha && <Heart size={14} className="shrink-0 text-red-500 fill-red-500" aria-label="Alpha" />}
      </div>

      {(showSpeciesName || detailed) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {speciesName} • Lv.{pokemon.state.level}
        </p>
      )}
    </div>
  );
}
