"use client";

import { enrichPokemon, getPokeApiSlug } from "@/lib/poke";
import type { EnrichedPokemon, PokeDumpMon } from "@/types/pokemon";
import { useMemo } from "react";
import { usePokeApi } from "./usePokeApi";

/**
 * Enriches an array of PokeDumpMon with species data from PokeAPI
 * Returns an array of EnrichedPokemon that contains everything needed for the UI
 * 
 * This is the ONLY hook you should use in your UI components.
 */
export function useEnrichedPokemon(
  pokemonList: PokeDumpMon[]
): EnrichedPokemon[] {
  // Get unique API slugs we need to fetch
  const neededSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const p of pokemonList) {
      slugs.add(getPokeApiSlug(p));
    }
    return [...slugs];
  }, [pokemonList]);

  // Fetch all species data
  const { data: apiPokemonBySlug } = usePokeApi("pokemon", neededSlugs);

  // Merge the data
  return useMemo(() => {
    return pokemonList.map((pokemon) => {
      const slug = getPokeApiSlug(pokemon);
      const apiData = apiPokemonBySlug[slug];
      return enrichPokemon(pokemon, apiData);
    });
  }, [pokemonList, apiPokemonBySlug]);
}
