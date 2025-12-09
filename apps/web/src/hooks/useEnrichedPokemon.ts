"use client";

import { enrichPokemon, getPokeApiSlug } from "@/lib/poke";
import type { EnrichedPokemon, PokeDumpMon } from "@/types/pokemon";
import { useMemo } from "react";
import { usePokeApi } from "./usePokeApi";

export function useEnrichedPokemon(
  pokemonList: PokeDumpMon[]
): { data: EnrichedPokemon[]; isLoading: boolean } {
  
  // 1. Collect IDs
  const { neededSlugs, neededMoveIds } = useMemo(() => {
    const slugs = new Set<string>();
    const moveIds = new Set<number>();

    for (const p of pokemonList) {
      slugs.add(getPokeApiSlug(p));
      if (p.moves) {
        for (const m of p.moves) {
          if (m.move_id) moveIds.add(m.move_id);
        }
      }
    }
    return {
      neededSlugs: [...slugs],
      neededMoveIds: [...moveIds],
    };
  }, [pokemonList]);

  // 2. Fetch Data (Both hooks return an 'isLoading' boolean)
  const { data: apiPokemonBySlug, isLoading: loadingMons } = usePokeApi("pokemon", neededSlugs);
  const { data: apiMovesById, isLoading: loadingMoves } = usePokeApi("move", neededMoveIds);

  // 3. Enrich
  const enriched = useMemo(() => {
    return pokemonList.map((pokemon) => {
      const slug = getPokeApiSlug(pokemon);
      const apiData = apiPokemonBySlug[slug];
      return enrichPokemon(pokemon, apiData, apiMovesById);
    });
  }, [pokemonList, apiPokemonBySlug, apiMovesById]);

  // 4. Return Data + Aggregate Loading State
  return {
    data: enriched,
    isLoading: loadingMons || loadingMoves
  };
}