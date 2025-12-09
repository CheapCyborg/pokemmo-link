"use client";

import { pokeapi } from "@/lib/pokeapi";
import type { CachedMove, CachedPokemon } from "@/types/pokemon";
import { useEffect, useMemo, useState } from "react";

// --- Cache Configuration ---

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

type ResourceCache<T> = {
  entries: Record<string, CacheEntry<T>>;
  inFlight: Set<string>;
  isInitialized: boolean;
};

// Global caches (in-memory)
const caches = {
  pokemon: {
    entries: {},
    inFlight: new Set(),
    isInitialized: false,
  } as ResourceCache<CachedPokemon>,
  move: {
    entries: {},
    inFlight: new Set(),
    isInitialized: false,
  } as ResourceCache<CachedMove>,
};

// LocalStorage keys
const STORAGE_KEYS = {
  pokemon: "pokemmo-link-pokemon-cache-v5",
  move: "pokemmo-link-move-cache-v2",
};

// --- Cache Management ---

function initCache<T>(
  resource: "pokemon" | "move",
  cache: ResourceCache<T>
) {
  if (cache.isInitialized || typeof window === "undefined") return;
  
  try {
    const key = STORAGE_KEYS[resource];
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, CacheEntry<T>>;
      const now = Date.now();
      
      Object.entries(parsed).forEach(([id, entry]) => {
        // Check TTL (moves don't strictly need TTL but good for consistency)
        if (entry.timestamp && now - entry.timestamp < CACHE_TTL_MS) {
          cache.entries[id] = entry;
        }
      });
    }
  } catch (e) {
    console.error(`[usePokeApi] Failed to load ${resource} cache`, e);
  }
  cache.isInitialized = true;
}

function persistCache<T>(resource: "pokemon" | "move", cache: ResourceCache<T>) {
  if (typeof window === "undefined") return;
  try {
    const key = STORAGE_KEYS[resource];
    localStorage.setItem(key, JSON.stringify(cache.entries));
  } catch (e) {
    console.error(`[usePokeApi] Failed to save ${resource} cache`, e);
  }
}

// --- The Hook ---

export function usePokeApi(
  resource: "pokemon",
  ids: (string | undefined | null)[]
): { data: Record<string, CachedPokemon>; isLoading: boolean };

export function usePokeApi(
  resource: "move",
  ids: (number | undefined | null)[]
): { data: Record<number, CachedMove>; isLoading: boolean };

export function usePokeApi(
  resource: "pokemon" | "move",
  ids: (string | number | undefined | null)[]
) {
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0); // Force re-render when cache updates

  // Initialize cache on mount
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const cache = caches[resource] as ResourceCache<unknown>;
    if (!cache.isInitialized) {
      initCache(resource, cache);
      // eslint-disable-next-line
      setTick((t) => t + 1);
    }
  }, [resource]);

  // Filter valid IDs
  const neededIds = useMemo(() => {
    if (!ids?.length) return [];
    return Array.from(new Set(ids.filter((id) => id !== null && id !== undefined && id !== ""))) as string[] | number[];
  }, [ids]);

  const neededKey = neededIds.sort().join("|");

  // Fetch missing data
  useEffect(() => {
    if (!isMounted) return;
    const cache = caches[resource] as ResourceCache<unknown>;
    
    const missing = neededIds.filter((id) => {
      const key = String(id);
      return !cache.entries[key] && !cache.inFlight.has(key);
    });

    if (missing.length === 0) return;

    // Mark as in-flight
    missing.forEach((id) => cache.inFlight.add(String(id)));

    (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          let data = null;
          if (resource === "pokemon") {
            data = await pokeapi.pokemon.get(String(id));
          } else {
            data = await pokeapi.move.get(Number(id));
          }
          return { id, data };
        })
      );

      let hasNew = false;
      results.forEach(({ id, data }) => {
        const key = String(id);
        cache.inFlight.delete(key);
        if (data) {
          cache.entries[key] = {
            data,
            timestamp: Date.now(),
          };
          hasNew = true;
        }
      });

      if (hasNew) {
        persistCache(resource, cache);
        setTick((t) => t + 1);
      }
    })();
  }, [resource, neededKey, isMounted, neededIds]);

  // Return data
  if (!isMounted) {
    return { data: {}, isLoading: true };
  }

  const cache = caches[resource] as ResourceCache<unknown>;
  const resultData: Record<string | number, unknown> = {};
  let hasMissing = false;

  neededIds.forEach((id) => {
    const key = String(id);
    const entry = cache.entries[key];
    if (entry) {
      resultData[id] = entry.data;
    } else {
      hasMissing = true;
    }
  });

  return {
    data: resultData,
    isLoading: hasMissing,
  };
}

/**
 * Debug utility to clear all caches
 */
export function clearPokeApiCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.pokemon);
    localStorage.removeItem(STORAGE_KEYS.move);
  }
  caches.pokemon.entries = {};
  caches.pokemon.isInitialized = false;
  caches.move.entries = {};
  caches.move.isInitialized = false;
  window.location.reload();
}
