import type { CachedMove, CachedPokemon } from "@/types/pokemon";

/**
 * Typed wrapper around our internal API routes that proxy PokeAPI.
 * Handles fetching and type validation.
 */
export const pokeapi = {
  pokemon: {
    /**
     * Fetch static Pokemon data (sprites, stats, names)
     */
    get: async (slug: string): Promise<CachedPokemon | null> => {
      try {
        const res = await fetch(`/api/pokemon/${slug}`);
        if (!res.ok) return null;
        return (await res.json()) as CachedPokemon;
      } catch (e) {
        console.error(`[pokeapi] Failed to fetch pokemon/${slug}`, e);
        return null;
      }
    },
  },
  move: {
    /**
     * Fetch move details (power, accuracy, type)
     */
    get: async (id: number): Promise<CachedMove | null> => {
      try {
        const res = await fetch(`/api/move/${id}`);
        if (!res.ok) return null;
        
        const raw = await res.json();
        return normalizeMove(raw);
      } catch (e) {
        console.error(`[pokeapi] Failed to fetch move/${id}`, e);
        return null;
      }
    },
  },
};

// Helper to normalize move data from the API
function normalizeMove(raw: unknown): CachedMove | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = Number(data.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    name: String(data.name ?? ""),
    type: (data.type as string) ?? null,
    power: (data.power as number) ?? null,
    accuracy: (data.accuracy as number) ?? null,
    pp: (data.pp as number) ?? null,
    damage_class: ((data.damage_class ?? data.damageClass) as string) ?? null,
    description: (data.description as string) ?? null,
  };
}
