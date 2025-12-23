import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";
import type { EnrichedPokemon } from "@/types/pokemon";

export interface PokemonStatusProps {
  pokemon: EnrichedPokemon;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * PokemonStatus displays status condition indicator (burn, poison, etc.)
 *
 * Features:
 * - Uses Badge component with status variant
 * - Only shows when Pokemon has non-healthy status
 * - Color-coded by condition type
 *
 * @example
 * <PokemonStatus pokemon={p} size="xs" />
 */
export function PokemonStatus({ pokemon, size = "xs", className }: PokemonStatusProps) {
  const status = pokemon.state.status;

  // Don't show anything for healthy Pokemon
  if (!status || status === "healthy") return null;

  return (
    <Badge
      variant={status as "burned" | "poisoned" | "paralyzed" | "frozen" | "asleep"}
      size={size}
      className={cn("uppercase", className)}>
      {status}
    </Badge>
  );
}
