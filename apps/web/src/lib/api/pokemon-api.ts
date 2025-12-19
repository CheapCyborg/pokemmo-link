// Structured like your CatsApi - organized by resource
import { CONFIG } from "@/lib/constants/config";
import type {
  ContainerType,
  DumpEnvelope,
  PokeApiMove,
  PokeApiSpecies,
} from "@/types/pokemon";
import { apiClient } from "./client";

export interface FetchStateOptions {
  source: ContainerType;
  signal?: AbortSignal;
}

export const PokemonApi = {
  state: {
    /**
     * Fetch current Pokemon state for a specific container\
     *
     * @param options Fetch options including source container type
     * @returns `DumpEnvelope` containing Pokemon data
     * @throws `ApiError` if the request fails
     *
     * @example
     * ```ts
     * const party = await PokemonApi.state.fetch({ source: "party" });
     * const pcBoxes = await PokemonApi.state.fetch({ source: "pc_boxes" });
     *
     */
    fetch: async (options: FetchStateOptions): Promise<DumpEnvelope> => {
      return apiClient.get<DumpEnvelope>(
        `${CONFIG.api.endpoints.state}?source=${options.source}`,
        { signal: options.signal }
      );
    },

    /**
     * Fetch all containers in parallel
     */
    fetchAll: async (): Promise<{
      party: DumpEnvelope;
      daycare: DumpEnvelope;
      pc_boxes: DumpEnvelope;
    }> => {
      const [party, daycare, pc_boxes] = await Promise.all([
        PokemonApi.state.fetch({ source: "party" }),
        PokemonApi.state.fetch({ source: "daycare" }),
        PokemonApi.state.fetch({ source: "pc_boxes" }),
      ]);
      return { party, daycare, pc_boxes };
    },
  },

  enrichment: {
    /**
     * Get species data from PokeAPI proxy
     */
    getSpecies: async (speciesId: number | string): Promise<PokeApiSpecies> => {
      return apiClient.get<PokeApiSpecies>(
        `${CONFIG.api.endpoints.pokemon}/${speciesId}`
      );
    },

    /**
     * Get move data from PokeAPI proxy
     */
    getMove: async (moveId: number): Promise<PokeApiMove> => {
      return apiClient.get<PokeApiMove>(
        `${CONFIG.api.endpoints.move}/${moveId}`
      );
    },
  },

  health: {
    /**
     * Check if backend is responding
     */
    ping: async (): Promise<boolean> => {
      try {
        const response = await fetch("/api/health", { method: "HEAD" });
        return response.ok;
      } catch {
        return false;
      }
    },
  },
};
