"use client";

import { PokemonApi } from "@/lib/api/pokemon-api";
import type { ContainerType, DumpEnvelope, PokeApiAbility, PokeApiMove, PokeApiSpecies } from "@/types/pokemon";
import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * PokemonRepository defines the interface for fetching Pokemon data.
 * This abstraction allows swapping between file-based (Phase 1) and
 * database-backed (Phase 2+) implementations with zero component changes.
 */
export interface PokemonRepository {
  /**
   * Fetch Pokemon state for a specific container and user.
   *
   * @param userId - The user whose data to fetch
   * @param source - The container type (party, daycare, pc_boxes)
   * @param signal - Optional AbortSignal for cancellation
   * @returns DumpEnvelope containing Pokemon data
   */
  fetchState: (userId: string, source: ContainerType, signal?: AbortSignal) => Promise<DumpEnvelope>;

  /**
   * Fetch all containers for a user in parallel.
   *
   * @param userId - The user whose data to fetch
   * @returns Object with party, daycare, and pc_boxes envelopes
   */
  fetchAllContainers: (userId: string) => Promise<{
    party: DumpEnvelope;
    daycare: DumpEnvelope;
    pc_boxes: DumpEnvelope;
  }>;

  /**
   * Get species data from PokeAPI proxy.
   * This is the same across all implementations (uses public PokeAPI).
   */
  getSpecies: (speciesId: number | string) => Promise<PokeApiSpecies>;

  /**
   * Batch fetch multiple species at once.
   */
  getBatchSpecies: (speciesIds: (number | string)[]) => Promise<Record<string, PokeApiSpecies>>;

  /**
   * Get move data from PokeAPI proxy.
   */
  getMove: (moveId: number | string) => Promise<PokeApiMove>;

  /**
   * Batch fetch multiple moves at once.
   */
  getBatchMoves: (moveIds: (number | string)[]) => Promise<Record<string, PokeApiMove>>;

  /**
   * Get ability data from PokeAPI proxy.
   */
  getAbility: (abilityId: number | string) => Promise<PokeApiAbility>;

  /**
   * Batch fetch multiple abilities at once.
   */
  getBatchAbilities: (abilityIds: (number | string)[]) => Promise<Record<string, PokeApiAbility>>;
}

/**
 * FileBasedPokemonRepository implements the repository using the current
 * file-based approach (Phase 1). All data is read from dump-*.json files
 * in apps/web/data/. The userId parameter is ignored since there's only
 * one user in Phase 1.
 */
export class FileBasedPokemonRepository implements PokemonRepository {
  async fetchState(
    _userId: string, // Ignored in Phase 1 (single-user)
    source: ContainerType,
    signal?: AbortSignal
  ): Promise<DumpEnvelope> {
    return PokemonApi.state.fetch({ source, signal });
  }

  async fetchAllContainers(
    _userId: string // Ignored in Phase 1 (single-user)
  ): Promise<{
    party: DumpEnvelope;
    daycare: DumpEnvelope;
    pc_boxes: DumpEnvelope;
  }> {
    return PokemonApi.state.fetchAll();
  }

  async getSpecies(speciesId: number | string): Promise<PokeApiSpecies> {
    return PokemonApi.enrichment.getSpecies(speciesId);
  }

  async getBatchSpecies(speciesIds: (number | string)[]): Promise<Record<string, PokeApiSpecies>> {
    return PokemonApi.enrichment.getBatchSpecies(speciesIds);
  }

  async getMove(moveId: number | string): Promise<PokeApiMove> {
    return PokemonApi.enrichment.getMove(moveId as number);
  }

  async getBatchMoves(moveIds: (number | string)[]): Promise<Record<string, PokeApiMove>> {
    return PokemonApi.enrichment.getBatchMoves(moveIds as number[]);
  }

  async getAbility(abilityId: number | string): Promise<PokeApiAbility> {
    return PokemonApi.enrichment.getAbility(abilityId as number);
  }

  async getBatchAbilities(abilityIds: (number | string)[]): Promise<Record<string, PokeApiAbility>> {
    return PokemonApi.enrichment.getBatchAbilities(abilityIds as number[]);
  }
}

/**
 * SupabasePokemonRepository is a placeholder for Phase 2+ implementation.
 *
 * Phase 2+ Implementation Guide:
 * ```typescript
 * export class SupabasePokemonRepository implements PokemonRepository {
 *   constructor(private supabase: SupabaseClient) {}
 *
 *   async fetchState(userId: string, source: ContainerType, signal?: AbortSignal) {
 *     const { data, error } = await this.supabase
 *       .from('pokemon')
 *       .select('*')
 *       .eq('user_id', userId)
 *       .eq('container_type', source)
 *       .abortSignal(signal)
 *
 *     if (error) throw new ApiError(error.message, 500)
 *
 *     // Transform Supabase data to DumpEnvelope format
 *     return transformToDumpEnvelope(data, source)
 *   }
 *
 *   // ... implement other methods using Supabase queries
 * }
 * ```
 */

export interface DataContextValue {
  /**
   * The active repository implementation.
   * Phase 1: FileBasedPokemonRepository
   * Phase 2+: SupabasePokemonRepository
   */
  repository: PokemonRepository;

  /**
   * Helper flag to indicate if using file-based or database-backed storage.
   * Phase 1: true
   * Phase 2+: false
   */
  isFileBased: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * DataProvider wraps the app and provides the Pokemon data repository.
 *
 * Phase 1 Usage (default):
 * ```tsx
 * <DataProvider>{children}</DataProvider>
 * ```
 * Uses FileBasedPokemonRepository (reads from dump-*.json files).
 *
 * Phase 2+ Usage (with Supabase):
 * ```tsx
 * const supabaseRepo = new SupabasePokemonRepository(supabaseClient)
 * <DataProvider repository={supabaseRepo}>
 *   {children}
 * </DataProvider>
 * ```
 * Swaps to database-backed implementation with zero component changes.
 */
export interface DataProviderProps {
  children: ReactNode;
  /**
   * Override the repository implementation.
   * Default: FileBasedPokemonRepository (Phase 1)
   * Phase 2+: SupabasePokemonRepository instance
   */
  repository?: PokemonRepository;
}

export function DataProvider({ children, repository = new FileBasedPokemonRepository() }: DataProviderProps) {
  const value = useMemo<DataContextValue>(
    () => ({
      repository,
      isFileBased: repository instanceof FileBasedPokemonRepository,
    }),
    [repository]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/**
 * Hook to access the Pokemon data repository.
 *
 * Phase 1 Example:
 * ```tsx
 * const { repository } = useDataRepository()
 * const envelope = await repository.fetchState('local-poc', 'party')
 * ```
 *
 * Phase 2+ Example (same usage, different implementation):
 * ```tsx
 * const { repository } = useDataRepository()
 * const envelope = await repository.fetchState(userId, 'party')
 * // Now fetches from Supabase instead of files
 * ```
 *
 * @throws {Error} If used outside DataProvider
 */
export function useDataRepository(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataRepository must be used within a DataProvider");
  }
  return context;
}
