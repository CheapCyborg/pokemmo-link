"use client";

import { PokemonApi } from "@/lib/api/pokemon-api";
import { CONFIG } from "@/lib/constants/config";
import type { ContainerType, DumpEnvelope } from "@/types/pokemon";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch Pokemon data from a container.
 * Returns RAW data without enrichment - use useEnrichPokemon to enrich.
 *
 * Pattern matches useCourseData from certification flow:
 * - Fetches data
 * - Returns TanStack Query result
 * - Components decide whether/when to enrich
 *
 * @param source - Container type to fetch (party, daycare, pc_boxes)
 * @returns TanStack Query result with dump envelope
 *
 * @example
 * ```tsx
 * // Small dataset - enrich immediately
 * const partyQuery = usePokemonData("party");
 * const enriched = useEnrichPokemon(partyQuery.data?.pokemon ?? []);
 *
 * // Large dataset - enrich only visible subset
 * const pcQuery = usePokemonData("pc_boxes");
 * const activeBoxMons = pcQuery.data?.pokemon.filter(p => p.box_id === "box_1") ?? [];
 * const enriched = useEnrichPokemon(activeBoxMons);
 * ```
 */
export function usePokemonData(source: ContainerType) {
  return useQuery<DumpEnvelope, Error>({
    queryKey: CONFIG.queryKeys.liveData(source),
    queryFn: () => PokemonApi.state.fetch({ source }),
    staleTime: CONFIG.query.staleTime.live,
    refetchInterval: CONFIG.polling.enabled ? CONFIG.polling.interval : false,
    refetchIntervalInBackground: false,
  });
}
