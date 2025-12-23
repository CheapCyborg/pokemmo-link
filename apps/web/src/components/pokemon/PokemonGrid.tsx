import type { EnrichedPokemon } from "@/types/pokemon";
import { memo } from "react";
import { PokemonCard } from "./PokemonCard";

interface PokemonGridProps {
  pokemonList: EnrichedPokemon[];
  onPokemonClick: (pokemon: EnrichedPokemon) => void;
  emptyMessage?: string;
  context?: "party" | "daycare" | "pc";
}

function PokemonGridComponent({
  pokemonList,
  onPokemonClick,
  emptyMessage = "No Pokémon found.",
  context,
}: PokemonGridProps) {
  if (pokemonList.length === 0) {
    return <p className="text-slate-500 text-sm italic">{emptyMessage}</p>;
  }

  // Only render fully enriched Pokemon
  const enrichedPokemon = pokemonList.filter((p) => p.computed !== undefined);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {enrichedPokemon.map((p, idx) => (
        <PokemonCard key={`${p.identity.uuid}-${idx}`} pokemon={p} onCardClick={onPokemonClick} context={context} />
      ))}
    </div>
  );
}

// FIX: Memoize the grid container
export const PokemonGrid = memo(PokemonGridComponent);
