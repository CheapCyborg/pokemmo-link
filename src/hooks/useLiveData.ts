// src/hooks/useLiveData.ts
// Hook for fetching live Pokemon data from PokeSnooper dumps
"use client";

import { useQuery } from "@tanstack/react-query";
import type { DumpEnvelope } from "@/types/pokemon";

async function fetchLiveData(source: "party" | "daycare" | "pc") {
  const res = await fetch(`/api/state?source=${source}`);
  if (!res.ok) throw new Error(`Failed to fetch ${source} data`);
  return res.json() as Promise<DumpEnvelope>;
}

export function useLiveData(source: "party" | "daycare" | "pc") {
  return useQuery({
    queryKey: ["live-data", source],
    queryFn: () => fetchLiveData(source),
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    staleTime: 200000, // Consider data stale after 200 seconds
  });
}
