/**
 * PokemonCard Compound Component
 *
 * A flexible, composable card for displaying Pokemon with Phase 2 multi-user support.
 *
 * @example
 * // Phase 1: Basic usage
 * <PokemonCard.Root pokemon={p} onClick={() => openModal(p)}>
 *   <PokemonCard.Header />
 *   <PokemonCard.Body />
 *   <PokemonCard.Footer />
 * </PokemonCard.Root>
 *
 * @example
 * // Phase 2: With owner metadata
 * <PokemonCard.Root
 *   pokemon={p}
 *   owner={{ userId: "123", displayName: "Ash" }}
 *   onClick={() => openModal(p)}>
 *   <PokemonCard.Header showOwner />
 *   <PokemonCard.Body />
 *   <PokemonCard.Footer />
 * </PokemonCard.Root>
 *
 * @example
 * // Loading state
 * <PokemonCard.Skeleton />
 */

import { PokemonCardBody } from "./PokemonCardBody";
import { PokemonCardFooter } from "./PokemonCardFooter";
import { PokemonCardHeader } from "./PokemonCardHeader";
import { PokemonCardRoot } from "./PokemonCardRoot";
import { PokemonCardSkeleton } from "./PokemonCardSkeleton";

export const PokemonCard = {
  Root: PokemonCardRoot,
  Header: PokemonCardHeader,
  Body: PokemonCardBody,
  Footer: PokemonCardFooter,
  Skeleton: PokemonCardSkeleton,
};

// Force recompile

// Named exports for tree-shaking
export type { PokemonCardBodyProps } from "./PokemonCardBody";
export type { PokemonCardFooterProps } from "./PokemonCardFooter";
export type { PokemonCardHeaderProps } from "./PokemonCardHeader";
export type { PokemonCardRootProps } from "./PokemonCardRoot";
export type { PokemonCardSkeletonProps } from "./PokemonCardSkeleton";
export { PokemonCardBody, PokemonCardFooter, PokemonCardHeader, PokemonCardRoot, PokemonCardSkeleton };
