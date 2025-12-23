// Structured like your CatsApi - organized by resource
import { CONFIG } from "@/lib/constants/config";
import type { ContainerType, DumpEnvelope, PokeApiAbility, PokeApiMove, PokeApiSpecies } from "@/types/pokemon";
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
      return apiClient.get<DumpEnvelope>(`${CONFIG.api.endpoints.state}?source=${options.source}`, {
        signal: options.signal,
      });
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
      return apiClient.get<PokeApiSpecies>(`${CONFIG.api.endpoints.pokemon}/${speciesId}`);
    },

    /**
     * Batch fetch multiple species at once
     */
    getBatchSpecies: async (speciesIds: (number | string)[]): Promise<Record<string, PokeApiSpecies>> => {
      const results = await Promise.allSettled(
        speciesIds.map((id) => apiClient.get<PokeApiSpecies>(`${CONFIG.api.endpoints.pokemon}/${id}`))
      );

      const map: Record<string, PokeApiSpecies> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          map[String(speciesIds[index])] = result.value;
        }
      });
      return map;
    },

    /**
     * Get move data from PokeAPI proxy
     */
    getMove: async (moveId: number): Promise<PokeApiMove> => {
      return apiClient.get<PokeApiMove>(`${CONFIG.api.endpoints.move}/${moveId}`);
    },

    /**
     * Batch fetch multiple moves at once
     */
    getBatchMoves: async (moveIds: number[]): Promise<Record<number, PokeApiMove>> => {
      const results = await Promise.allSettled(
        moveIds.map((id) => apiClient.get<PokeApiMove>(`${CONFIG.api.endpoints.move}/${id}`))
      );

      const map: Record<number, PokeApiMove> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          map[moveIds[index]] = result.value;
        }
      });
      return map;
    },

    /**
     * Get ability data from PokeAPI proxy
     */
    getAbility: async (abilityId: number): Promise<PokeApiAbility> => {
      return apiClient.get<PokeApiAbility>(`${CONFIG.api.endpoints.ability}/${abilityId}`);
    },

    /**
     * Batch fetch multiple abilities at once
     */
    getBatchAbilities: async (abilityIds: number[]): Promise<Record<number, PokeApiAbility>> => {
      const results = await Promise.allSettled(
        abilityIds.map((id) => apiClient.get<PokeApiAbility>(`${CONFIG.api.endpoints.ability}/${id}`))
      );

      const map: Record<number, PokeApiAbility> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          map[abilityIds[index]] = result.value;
        }
      });
      return map;
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
