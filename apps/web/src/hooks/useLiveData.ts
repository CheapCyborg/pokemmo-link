// src/hooks/useLiveData.ts
"use client";

import { PokemonApi } from "@/lib/api/pokemon-api";
import { CONFIG } from "@/lib/constants/config";
import type {
  ContainerType,
  DataState,
  DumpEnvelope,
  PcDumpEnvelope,
} from "@/types/pokemon";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Function overloads for proper type inference
export function useLiveData(
  source: Exclude<ContainerType, "pc_boxes">
): DataState<DumpEnvelope>;

export function useLiveData(source: "pc_boxes"): DataState<PcDumpEnvelope>;

export function useLiveData(
  source: ContainerType
): DataState<DumpEnvelope | PcDumpEnvelope> {
  const query = useQuery<DumpEnvelope | PcDumpEnvelope>({
    queryKey: CONFIG.queryKeys.liveData(source),
    queryFn: () => PokemonApi.state.fetch({ source }),
    staleTime: CONFIG.query.staleTime.live,
    refetchInterval: CONFIG.query.refetchInterval,
    refetchIntervalInBackground: false,
  });

  // Return consistent DataState shape
  return useMemo<DataState<DumpEnvelope | PcDumpEnvelope>>(() => {
    const isPcData = source === "pc_boxes";
    const isEmpty = isPcData
      ? !query.data ||
        !("boxes" in query.data) ||
        Object.keys(query.data.boxes).length === 0
      : !query.data ||
        !("pokemon" in query.data) ||
        query.data.pokemon.length === 0;
    const hasData = !isEmpty;

    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      isEmpty,
      hasData,
      refetch: () => query.refetch(),
    };
  }, [
    query.data,
    query.isLoading,
    query.isError,
    query.error,
    query.refetch,
    source,
  ]);
}
