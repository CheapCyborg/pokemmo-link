import { TypeBadge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";
import type { EnrichedPokemon } from "@/types/pokemon";

export interface PokemonTypesProps {
  pokemon: EnrichedPokemon;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * PokemonTypes displays type badges for Pokemon.
 *
 * Features:
 * - Uses new Badge component system
 * - Shows 1-2 types (Pokemon can have dual types)
 * - Configurable size
 *
 * @example
 * <PokemonTypes pokemon={p} size="sm" />
 */
export function PokemonTypes({ pokemon, size = "sm", className }: PokemonTypesProps) {
  const types = pokemon.species?.types || [];

  if (types.length === 0) return null;

  return (
    <div className={cn("flex gap-1 flex-wrap", className)}>
      {types.map((type) => (
        <TypeBadge key={type} type={type} size={size} />
      ))}
    </div>
  );
}
