// src/hooks/useLiveData.ts
"use client";

import type { DumpEnvelope } from "@/types/pokemon";
import { useQuery } from "@tanstack/react-query";

async function fetchLiveData(source: string) {
  const res = await fetch(`/api/state?source=${source}`);
  if (!res.ok) throw new Error(`Failed to fetch ${source}`);
  return res.json();
}

export function useLiveData<T = DumpEnvelope>(source: "party" | "daycare" | "pc_boxes") {
  return useQuery<T>({
    queryKey: ["live-data", source],
    queryFn: () => fetchLiveData(source) as Promise<T>,
    // Keep data fresh for 1s, refetch every 3s
    staleTime: 1000, 
    refetchIntervalInBackground: false, 
  });
}