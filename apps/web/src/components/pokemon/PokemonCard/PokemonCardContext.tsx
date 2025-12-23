"use client";

import type { EnrichedPokemon } from "@/types/pokemon";
import { createContext, useContext } from "react";

/**
 * PokemonCardContext shares state between compound component parts.
 *
 * Phase 1: Only pokemon is used
 * Phase 2: owner and permissions enable multi-user features
 */
export interface PokemonCardContextValue {
  pokemon: EnrichedPokemon;
  owner?: {
    userId: string;
    displayName: string;
  };
  permissions?: {
    canViewIVs: boolean;
    canViewEVs: boolean;
    canViewDetails: boolean;
  };
  isHovered: boolean;
}

const PokemonCardContext = createContext<PokemonCardContextValue | null>(null);

export function usePokemonCardContext() {
  const context = useContext(PokemonCardContext);
  if (!context) {
    throw new Error("PokemonCard compound components must be used within PokemonCard.Root");
  }
  return context;
}

export const PokemonCardProvider = PokemonCardContext.Provider;
