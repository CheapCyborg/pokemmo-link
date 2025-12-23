"use client";

import { getSortedBoxIds, groupPokemonByBox } from "@/lib/pokemon/boxes";
import type { ContainerType, EnrichedPokemon } from "@/types/pokemon";
import { useMemo, useState } from "react";
import { useEnrichPokemon } from "./useEnrichPokemon";
import { usePokemonData } from "./usePokemonData";

export type FlowState =
  | "loading" // Initial fetch of raw data
  | "enriching" // Raw data ready, fetching PokeAPI for visible items
  | "ready" // All data ready for display
  | "error";

interface UsePokemonFlowOptions {
  initialBox?: string;
}

export interface PokemonFlowState {
  flowState: FlowState;
  visiblePokemon: EnrichedPokemon[];
  totalCount: number;
  lastUpdated?: number;
  activeBoxId: string;
  availableBoxes: string[];
  error?: Error | null;
}

export interface PokemonFlowActions {
  refresh: () => void;
  setActiveBox: (boxId: string) => void;
}

/**
 * Orchestrator hook for Pokemon data flow.
 * Manages the lifecycle of data fetching -> filtering -> enrichment.
 *
 * Implements the Facade pattern to hide complexity from components.
 *
 * @param source - The container to fetch (party, daycare, pc_boxes)
 * @param options - Configuration options
 */
export function usePokemonFlow(source: ContainerType, options: UsePokemonFlowOptions = {}) {
  // 1. View State (Managed by the Flow)
  const [activeBoxId, setActiveBoxId] = useState<string>(options.initialBox ?? "box_1");

  // 2. Data Provider (Raw Data)
  const rawQuery = usePokemonData(source);

  // 3. Data Orchestration (Decide what to enrich)
  const { visibleRawPokemon, availableBoxes } = useMemo(() => {
    if (!rawQuery.data?.pokemon) return { visibleRawPokemon: [], availableBoxes: [] };

    const allPokemon = rawQuery.data.pokemon;

    // Calculate available boxes if PC
    let boxes: string[] = [];
    if (source === "pc_boxes") {
      const boxMap = groupPokemonByBox(allPokemon);
      boxes = getSortedBoxIds(boxMap);
    }

    // For PC, only enrich the active box
    if (source === "pc_boxes") {
      return {
        visibleRawPokemon: allPokemon.filter((p) => p.box_id === activeBoxId),
        availableBoxes: boxes,
      };
    }

    // For Party/Daycare, enrich everything
    return {
      visibleRawPokemon: allPokemon,
      availableBoxes: [],
    };
  }, [rawQuery.data, source, activeBoxId]);

  // 4. Enrichment (Task Runner)
  // Only runs on the filtered 'visibleRawPokemon'
  // We pass rawQuery.isSuccess to ensure we don't try to enrich before we have data
  const enrichmentQuery = useEnrichPokemon(visibleRawPokemon, rawQuery.isSuccess);

  // 5. State Machine
  const flowState: FlowState = useMemo(() => {
    if (rawQuery.isError || enrichmentQuery.isError) return "error";
    if (rawQuery.isPending) return "loading";
    // If we have raw data but are waiting on enrichment
    if (enrichmentQuery.isPending) return "enriching";
    return "ready";
  }, [rawQuery.isError, rawQuery.isPending, enrichmentQuery.isError, enrichmentQuery.isPending]);

  // 6. Return Interface (Facade)
  const state: PokemonFlowState = {
    flowState,
    // The component only sees the final, enriched, filtered list
    visiblePokemon: enrichmentQuery.data ?? [],
    // Metadata for UI
    totalCount: rawQuery.data?.pokemon.length ?? 0,
    lastUpdated: rawQuery.data?.captured_at_ms,
    activeBoxId,
    availableBoxes,
    error: rawQuery.error || enrichmentQuery.error || null,
  };

  const actions: PokemonFlowActions = {
    refresh: () => {
      rawQuery.refetch();
      // Enrichment query will auto-refetch if its dependencies change,
      // but we can't explicitly refetch it easily here without exposing it.
      // Usually refetching raw data triggers the flow.
    },
    setActiveBox: setActiveBoxId,
  };

  return { state, actions };
}
