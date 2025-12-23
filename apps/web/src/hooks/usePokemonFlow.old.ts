import { getSortedBoxIds, groupPokemonByBox } from "@/lib/pokemon/boxes";
import type { ContainerType, EnrichedPokemon } from "@/types/pokemon";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useEnrichPokemon } from "./useEnrichPokemon";
import { usePokemonData } from "./usePokemonData";

export type FlowState = "loading" | "ready" | "empty" | "error";

export interface PokemonFlowState {
  // UI Display State
  flowState: FlowState;

  // Data
  pokemon: EnrichedPokemon[];

  // Contextual Data
  activeBox: string | null;
  availableBoxes: string[];

  // Operation States
  isFetching: boolean;
  isEnriching: boolean;
}

export interface PokemonFlowActions {
  refresh: () => void;
  setActiveBox: (boxId: string) => void;
}

/**
 * Unified Pokemon Data Flow Hook
 *
 * Orchestrates the entire data lifecycle:
 * 1. Fetches raw data (usePokemonData)
 * 2. Applies filtering (Box selection)
 * 3. Enriches visible data (useEnrichPokemon)
 * 4. Determines UI state (FlowState)
 *
 * Pattern matches useCertificationFlow from examples.
 */
export function usePokemonFlow(source: ContainerType) {
  // Internal State
  const [activeBox, setActiveBox] = useState<string | null>(null);
  const deferredActiveBox = useDeferredValue(activeBox);

  // 1. Fetch Raw Data
  const rawQuery = usePokemonData(source);
  const rawPokemon = rawQuery.data?.pokemon ?? [];

  // 2. Compute Derived State (Boxes)
  const { boxMap, boxIds } = useMemo(() => {
    if (source !== "pc_boxes") return { boxMap: null, boxIds: [] };
    const map = groupPokemonByBox(rawPokemon);
    return { boxMap: map, boxIds: getSortedBoxIds(map) };
  }, [rawPokemon, source]);

  // Auto-select first box if none selected
  useEffect(() => {
    if (source === "pc_boxes" && !activeBox && boxIds.length > 0) {
      setActiveBox(boxIds[0] ?? null);
    }
  }, [source, activeBox, boxIds]);

  // 3. Filter Visible Data
  const visibleRaw = useMemo(() => {
    if (source === "pc_boxes") {
      if (!deferredActiveBox || !boxMap) return [];
      return boxMap.get(deferredActiveBox) || [];
    }
    return rawPokemon;
  }, [source, rawPokemon, deferredActiveBox, boxMap]);

  // 4. Enrich Visible Data
  // Only enrich if we have data and aren't switching boxes (unless deferred matches)
  const shouldEnrich = rawQuery.isSuccess && visibleRaw.length > 0;
  const enrichQuery = useEnrichPokemon(visibleRaw, shouldEnrich);

  // 5. Determine Flow State
  const flowState: FlowState = useMemo(() => {
    if (rawQuery.isError) return "error";

    // Loading if fetching raw OR enriching visible
    if (rawQuery.isPending) return "loading";
    if (shouldEnrich && enrichQuery.isPending) return "loading";

    // Empty if no RAW data (after loading) - Global empty state
    if (rawPokemon.length === 0) return "empty";

    return "ready";
  }, [rawQuery, shouldEnrich, enrichQuery, rawPokemon]);

  // 6. Construct Return Object
  const state: PokemonFlowState = {
    flowState,
    pokemon: enrichQuery.data,
    activeBox: activeBox,
    availableBoxes: boxIds,
    isFetching: rawQuery.isFetching,
    isEnriching: enrichQuery.isPending,
  };

  const actions: PokemonFlowActions = {
    refresh: () => rawQuery.refetch(),
    setActiveBox: (boxId: string) => setActiveBox(boxId),
  };

  return { state, actions };
}
