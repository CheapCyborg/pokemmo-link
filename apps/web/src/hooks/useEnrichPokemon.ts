"use client";

import { PokemonApi } from "@/lib/api/pokemon-api";
import { CONFIG } from "@/lib/constants/config";
import { enrichPokemon, getPokeApiSlug } from "@/lib/pokemon/enrichment";
import type { EnrichedPokemon, PokeDumpMon } from "@/types/pokemon";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Enrich a list of Pokemon with PokeAPI data (sprites, stats, abilities, moves).
 * Use this for subsets of Pokemon (e.g., active PC box only).
 *
 * Returns TanStack Query-style result:
 * - `data` - Array of enriched Pokemon
 * - `isPending` - True if any query is pending
 * - `isError` - True if any query failed
 * - `isFetching` - True if any query is fetching
 *
 * @param pokemonList - Array of raw Pokemon to enrich
 * @param enabled - Whether enrichment should run (default: true)
 *
 * @example
 * ```tsx
 * const activeBoxMons = pcData.filter(p => p.box_id === activeBox);
 * const { data: enriched, isPending } = useEnrichPokemon(activeBoxMons);
 *
 * if (isPending) return <PokemonCardSkeleton count={activeBoxMons.length} />;
 * return <PokemonGrid pokemon={enriched} />;
 * ```
 */
export function useEnrichPokemon(pokemonList: PokeDumpMon[], enabled = true) {
  // 1. Collect unique species slugs, move IDs, and ability IDs
  const { neededSlugs, neededMoveIds, neededAbilityIds } = useMemo(() => {
    if (!enabled) return { neededSlugs: [], neededMoveIds: [], neededAbilityIds: [] };

    const slugs = new Set<string>();
    const moveIds = new Set<number>();
    const abilityIds = new Set<number>();

    for (const p of pokemonList) {
      slugs.add(getPokeApiSlug(p));
      if (p.moves) {
        for (const m of p.moves) {
          if (m.move_id) moveIds.add(m.move_id);
        }
      }
      if (p.ability?.id) {
        abilityIds.add(p.ability.id);
      }
    }
    return {
      neededSlugs: Array.from(slugs),
      neededMoveIds: Array.from(moveIds),
      neededAbilityIds: Array.from(abilityIds),
    };
  }, [pokemonList, enabled]);

  // 2. Batch fetch all species data (ONE query)
  const speciesQuery = useQuery({
    queryKey: ["batch-species", ...neededSlugs.sort()],
    queryFn: () => PokemonApi.enrichment.getBatchSpecies(neededSlugs),
    staleTime: CONFIG.query.staleTime.static,
    gcTime: CONFIG.query.gcTime,
    enabled: enabled && neededSlugs.length > 0,
  });

  // 3. Batch fetch all move data (ONE query)
  const movesQuery = useQuery({
    queryKey: ["batch-moves", ...neededMoveIds.sort()],
    queryFn: () => PokemonApi.enrichment.getBatchMoves(neededMoveIds),
    staleTime: CONFIG.query.staleTime.static,
    gcTime: CONFIG.query.gcTime,
    enabled: enabled && neededMoveIds.length > 0,
  });

  // 4. Batch fetch all ability data (ONE query)
  const abilitiesQuery = useQuery({
    queryKey: ["batch-abilities", ...neededAbilityIds.sort()],
    queryFn: () => PokemonApi.enrichment.getBatchAbilities(neededAbilityIds),
    staleTime: CONFIG.query.staleTime.static,
    gcTime: CONFIG.query.gcTime,
    enabled: enabled && neededAbilityIds.length > 0,
  });

  // 5. Build enriched data
  const enriched = useMemo(() => {
    if (!enabled || pokemonList.length === 0) return [];

    const speciesMap = speciesQuery.data || {};
    const moveMap = movesQuery.data || {};
    const abilityMap = abilitiesQuery.data || {};

    // Enrich Pokemon (keep all, even if not fully enriched yet)
    // PokemonCard component will show skeleton for unenriched Pokemon
    return pokemonList.map((pokemon) => {
      const slug = getPokeApiSlug(pokemon);
      const apiData = speciesMap[slug];
      return enrichPokemon(pokemon, apiData, moveMap, abilityMap);
    });
  }, [pokemonList, speciesQuery.data, movesQuery.data, abilitiesQuery.data, enabled]);

  // 6. Compute combined states
  const isPending = enabled && (speciesQuery.isPending || movesQuery.isPending || abilitiesQuery.isPending);
  const isError = speciesQuery.isError || movesQuery.isError || abilitiesQuery.isError;
  const isFetching = speciesQuery.isFetching || movesQuery.isFetching || abilitiesQuery.isFetching;

  return {
    data: enriched as EnrichedPokemon[],
    isPending,
    isError,
    isFetching,
    error: speciesQuery.error ?? movesQuery.error ?? abilitiesQuery.error,
  };
}
