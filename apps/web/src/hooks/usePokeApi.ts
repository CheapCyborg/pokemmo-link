// src/hooks/usePokeApi.ts
"use client";

import type { CachedMove, CachedPokemon } from "@/types/pokemon";
import { useEffect, useMemo, useState } from "react";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = { data: T; timestamp: number };
type ResourceCache<T> = { entries: Record<string, CacheEntry<T>>; inFlight: Set<string>; isInitialized: boolean };

const caches = {
  pokemon: { entries: {}, inFlight: new Set(), isInitialized: false } as ResourceCache<CachedPokemon>,
  move: { entries: {}, inFlight: new Set(), isInitialized: false } as ResourceCache<CachedMove>,
};

const STORAGE_KEYS = { pokemon: "pokemmo-link-pokemon-cache-v5", move: "pokemmo-link-move-cache-v2" };

class RequestQueue {
  private queue: (() => Promise<void>)[] = [];
  private active = 0;
  private maxConcurrent = 20; // Keep this high

  add(fn: () => Promise<void>) {
    this.queue.push(fn);
    this.process();
  }
  next() { this.active--; this.process(); }
  process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;
    const fn = this.queue.shift();
    if (fn) { this.active++; fn().finally(() => this.next()); }
  }
}
const fetchQueue = new RequestQueue();

function initCache<T>(resource: "pokemon" | "move", cache: ResourceCache<T>) {
  if (cache.isInitialized || typeof window === "undefined") return;
  try {
    const key = STORAGE_KEYS[resource];
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      Object.entries(parsed).forEach(([id, entry]: [string, any]) => {
        if (entry.timestamp && now - entry.timestamp < CACHE_TTL_MS) cache.entries[id] = entry;
      });
    }
  } catch (e) { console.error(e); }
  cache.isInitialized = true;
}

function persistCache<T>(resource: "pokemon" | "move", cache: ResourceCache<T>) {
  if (typeof window === "undefined") return;
  try {
    const key = STORAGE_KEYS[resource];
    localStorage.setItem(key, JSON.stringify(cache.entries));
  } catch (e) { console.error(e); }
}

export function usePokeApi(resource: "pokemon" | "move", ids: (string | number | undefined | null)[]) {
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const cache = caches[resource] as ResourceCache<unknown>;
    if (!cache.isInitialized) {
      initCache(resource, cache);
      setTick((t) => t + 1);
    }
  }, [resource]);

  const neededIds = useMemo(() => {
    if (!ids?.length) return [];
    return Array.from(new Set(ids.filter((id) => id !== null && id !== undefined && id !== "")));
  }, [ids]);

  // Create a stable key string for the effect dependency
  const neededKey = neededIds.sort().join("|");

  useEffect(() => {
    if (!isMounted) return;
    const cache = caches[resource] as ResourceCache<unknown>;
    
    // Calculate missing INSIDE the effect to ensure we have latest cache state
    const missing = neededIds.filter((id) => {
      const key = String(id);
      return !cache.entries[key] && !cache.inFlight.has(key);
    });

    if (missing.length === 0) return;

    missing.forEach((id) => {
      const key = String(id);
      cache.inFlight.add(key);
      fetchQueue.add(async () => {
        try {
          const url = resource === "pokemon" ? `/api/pokemon/${id}` : `/api/move/${id}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Fetch failed");
          const data = await res.json();
          cache.entries[key] = { data, timestamp: Date.now() };
          persistCache(resource, cache);
          setTick((t) => t + 1);
        } catch (err) {
          console.warn(`[usePokeApi] Failed ${resource} ${id}`, err);
        } finally {
          cache.inFlight.delete(key);
        }
      });
    });
  }, [resource, neededKey, isMounted]); // <--- Dependency on 'neededKey' stops infinite loops

  return useMemo(() => {
    if (!isMounted) return { data: {}, isLoading: true };

    const cache = caches[resource] as ResourceCache<unknown>;
    const resultData: Record<string | number, unknown> = {};
    let hasMissing = false;

    neededIds.forEach((id) => {
      const key = String(id);
      const entry = cache.entries[key];
      if (entry) {
        resultData[id as string | number] = entry.data;
      } else {
        hasMissing = true;
      }
    });

    return { data: resultData as any, isLoading: hasMissing };
  }, [resource, neededKey, isMounted, caches[resource].entries]);
}