"use client";

import { useDataRepository } from "@/contexts/DataContext";
import { useViewer } from "@/contexts/ViewerContext";
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
 * Phase 1: Fetches from file-based storage (dump-*.json)
 * Phase 2+: Fetches from Supabase (user_id scoped)
 *
 * @param source - Container type to fetch (party, daycare, pc_boxes)
 * @param userId - Optional user ID to fetch data for. Defaults to viewingUserId from ViewerContext.
 * @returns TanStack Query result with dump envelope
 *
 * @example
 * ```tsx
 * // Phase 1: Fetch own data (userId = 'local-poc' by default)
 * const partyQuery = usePokemonData("party");
 * const enriched = useEnrichPokemon(partyQuery.data?.pokemon ?? []);
 *
 * // Phase 2+: Fetch friend's data
 * const friendParty = usePokemonData("party", friendUserId);
 *
 * // Large dataset - enrich only visible subset
 * const pcQuery = usePokemonData("pc_boxes");
 * const activeBoxMons = pcQuery.data?.pokemon.filter(p => p.box_id === "box_1") ?? [];
 * const enriched = useEnrichPokemon(activeBoxMons);
 * ```
 */
export function usePokemonData(source: ContainerType, userId?: string) {
  const { repository } = useDataRepository();
  const { viewingUserId } = useViewer();

  // Use provided userId, fallback to viewingUserId from context
  const targetUserId = userId ?? viewingUserId;

  return useQuery<DumpEnvelope, Error>({
    queryKey: CONFIG.queryKeys.liveData(source, targetUserId),
    queryFn: ({ signal }) => repository.fetchState(targetUserId, source, signal),
    staleTime: CONFIG.query.staleTime.live,
    refetchInterval: CONFIG.polling.enabled ? CONFIG.polling.interval : false,
    refetchIntervalInBackground: false,
  });
}
