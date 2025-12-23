// src/hooks/usePokeApi.ts
"use client";

import { PokemonApi } from "@/lib/api/pokemon-api";
import { CONFIG } from "@/lib/constants/config";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Fetch multiple Pokemon species from PokeAPI proxy.
 * Returns array of TanStack Query results.
 */
export function usePokeApiSpecies(ids: (string | number | undefined | null)[]) {
  const validIds = useMemo(() => {
    return Array.from(
      new Set(ids.filter((id) => id !== null && id !== undefined && id !== ""))
    ) as (string | number)[];
  }, [ids]);

  return useQueries({
    queries: validIds.map((id) => ({
      queryKey: CONFIG.queryKeys.pokemonSpecies(id),
      queryFn: () => PokemonApi.enrichment.getSpecies(id),
      staleTime: CONFIG.query.staleTime.static,
      gcTime: CONFIG.query.gcTime,
    })),
  });
}

/**
 * Fetch multiple moves from PokeAPI proxy.
 * Returns array of TanStack Query results.
 */
export function usePokeApiMoves(ids: (number | undefined | null)[]) {
  const validIds = useMemo(() => {
    return Array.from(
      new Set(ids.filter((id) => id !== null && id !== undefined))
    ) as number[];
  }, [ids]);

  return useQueries({
    queries: validIds.map((id) => ({
      queryKey: CONFIG.queryKeys.move(id),
      queryFn: () => PokemonApi.enrichment.getMove(id),
      staleTime: CONFIG.query.staleTime.static,
      gcTime: CONFIG.query.gcTime,
    })),
  });
}

/**
 * Fetch ability from PokeAPI proxy.
 */
export function usePokeApiAbility(id: number | undefined | null) {
  return useQueries({
    queries: id
      ? [
          {
            queryKey: CONFIG.queryKeys.ability(id),
            queryFn: () => PokemonApi.enrichment.getAbility(id),
            staleTime: CONFIG.query.staleTime.static,
            gcTime: CONFIG.query.gcTime,
          },
        ]
      : [],
  })[0];
}
