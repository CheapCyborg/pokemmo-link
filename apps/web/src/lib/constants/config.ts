export const CONFIG = {
  polling: {
    interval: 3000, // 3 seconds
    staleTime: 200000, // 3 min 20 sec
    retryDelay: 1000, // 1 second base
    maxRetries: 3,
  },
  query: {
    staleTime: {
      static: Infinity, // PokeAPI enrichment data (never changes)
      live: 1000, // Live game data (refetches frequently)
    },
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchInterval: 3000, // 3 seconds for live data
  },
  containers: {
    party: { capacity: 6 },
    daycare: { capacity: 3 },
    pc: { slotsPerBox: 60 },
  },
  api: {
    // Internal Next.js API (called from client)
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    // External PokeAPI (only used server-side in API routes)
    pokeapiUrl: "https://pokeapi.co/api/v2",
    endpoints: {
      state: "/api/state",
      pokemon: "/api/pokemon",
      move: "/api/move",
      ingest: "/api/ingest",
    },
  },
  sprites: {
    baseUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon",
    paths: {
      animated: "versions/generation-v/black-white/animated",
      static: "",
    },
  },
  queryKeys: {
    liveData: (source: string) => ["live-data", source] as const,
    pokemonSpecies: (id: string | number) => ["pokemon-species", id] as const,
    move: (id: number) => ["move", id] as const,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ContainerCapacity =
  (typeof CONFIG.containers)[keyof typeof CONFIG.containers];
export type PollingConfig = typeof CONFIG.polling;
