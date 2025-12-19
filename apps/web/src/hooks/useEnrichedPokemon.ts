"use client";

import { enrichPokemon, getPokeApiSlug } from "@/lib/poke";
import type {
  DataState,
  EnrichedPokemon,
  PokeApiMove,
  PokeApiSpecies,
  PokeDumpMon,
} from "@/types/pokemon";
import { useMemo } from "react";
import { usePokeApiMoves, usePokeApiSpecies } from "./usePokeApi";

export function useEnrichedPokemon(
  pokemonList: PokeDumpMon[]
): DataState<EnrichedPokemon[]> {
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

  // 2. Fetch Data
  const speciesQueries = usePokeApiSpecies(neededSlugs);
  const moveQueries = usePokeApiMoves(neededMoveIds);

  // 3. Build lookup maps
  const { speciesBySlug, movesById } = useMemo(() => {
    const speciesMap = new Map<string, PokeApiSpecies>();
    const moveMap = new Map<number, PokeApiMove>();

    neededSlugs.forEach((slug, index) => {
      const query = speciesQueries[index];
      if (query?.data) {
        speciesMap.set(slug, query.data);
      }
    });

    neededMoveIds.forEach((id, index) => {
      const query = moveQueries[index];
      if (query?.data) {
        moveMap.set(id, query.data);
      }
    });

    return { speciesBySlug: speciesMap, movesById: moveMap };
  }, [speciesQueries, moveQueries, neededSlugs, neededMoveIds]);

  // 4. Enrich Pokemon
  const enriched = useMemo(() => {
    return pokemonList.map((pokemon) => {
      const slug = getPokeApiSlug(pokemon);
      const apiData = speciesBySlug.get(slug) ?? undefined;
      const moveCache = Object.fromEntries(movesById);
      return enrichPokemon(pokemon, apiData, moveCache);
    });
  }, [pokemonList, speciesBySlug, movesById]);

  // 5. Compute DataState
  return useMemo<DataState<EnrichedPokemon[]>>(() => {
    const isLoading =
      speciesQueries.some((q) => q.isLoading) ||
      moveQueries.some((q) => q.isLoading);
    const hasErrors =
      speciesQueries.some((q) => q.isError) ||
      moveQueries.some((q) => q.isError);
    const firstError =
      speciesQueries.find((q) => q.error)?.error ??
      moveQueries.find((q) => q.error)?.error ??
      null;

    return {
      data: enriched,
      isLoading,
      isError: hasErrors,
      error: firstError,
      isEmpty: enriched.length === 0,
      hasData: enriched.length > 0,
      refetch: () => {
        // Enrichment hook doesn't own the queries, so refetch is no-op
        // Parent hooks should refetch their data
      },
    };
  }, [enriched, speciesQueries, moveQueries]);
}
