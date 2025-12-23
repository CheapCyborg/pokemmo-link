import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Base Skeleton component for loading states.
 * Provides a pulsing animation effect for placeholder content.
 */
export interface SkeletonProps extends ComponentProps<"div"> {
  /**
   * Optional className for additional styling.
   */
  className?: string;
}

/**
 * Skeleton component renders a loading placeholder with pulse animation.
 *
 * Usage:
 * ```tsx
 * <Skeleton className="h-4 w-32 rounded" />
 * <Skeleton className="h-16 w-16 rounded-full" />
 * ```
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded", className)} {...props} />;
}

/**
 * Card-shaped skeleton for Pokemon cards.
 * Matches the structure of PokemonCard component.
 *
 * Usage:
 * ```tsx
 * <CardSkeleton />
 * ```
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center space-x-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700">
        {/* Avatar */}
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />

        {/* Info */}
        <div className="grow min-w-0 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Footer */}
      <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-t border-slate-100 dark:border-slate-700">
        <Skeleton className="h-2 w-32" />
      </div>
    </div>
  );
}

/**
 * List of card skeletons for grid loading.
 *
 * Usage:
 * ```tsx
 * <CardSkeletonList count={6} />
 * ```
 */
export interface CardSkeletonListProps {
  /**
   * Number of skeleton cards to render.
   * @default 6
   */
  count?: number;

  /**
   * Optional className for the grid container.
   */
  className?: string;
}

export function CardSkeletonList({ count = 6, className }: CardSkeletonListProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={`skeleton-${idx}`} />
      ))}
    </div>
  );
}

/**
 * Text skeleton with common text sizes.
 *
 * Usage:
 * ```tsx
 * <TextSkeleton size="lg" />
 * <TextSkeleton size="sm" width="w-32" />
 * ```
 */
export interface TextSkeletonProps {
  /**
   * Text size variant.
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Width class (Tailwind w-* utility).
   * @default "w-full"
   */
  width?: string;

  /**
   * Optional className for additional styling.
   */
  className?: string;
}

export function TextSkeleton({ size = "md", width = "w-full", className }: TextSkeletonProps) {
  const sizeClasses = {
    xs: "h-2",
    sm: "h-3",
    md: "h-4",
    lg: "h-5",
    xl: "h-6",
  };

  return <Skeleton className={cn(sizeClasses[size], width, className)} />;
}

/**
 * Avatar skeleton with circular shape.
 *
 * Usage:
 * ```tsx
 * <AvatarSkeleton size="md" />
 * <AvatarSkeleton size="lg" />
 * ```
 */
export interface AvatarSkeletonProps {
  /**
   * Avatar size variant.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Optional className for additional styling.
   */
  className?: string;
}

export function AvatarSkeleton({ size = "md", className }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />;
}

/**
 * Badge skeleton for type/nature badges.
 *
 * Usage:
 * ```tsx
 * <BadgeSkeleton size="sm" />
 * <BadgeSkeleton size="md" width="w-20" />
 * ```
 */
export interface BadgeSkeletonProps {
  /**
   * Badge size variant.
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg";

  /**
   * Width class (Tailwind w-* utility).
   * @default "w-16"
   */
  width?: string;

  /**
   * Optional className for additional styling.
   */
  className?: string;
}

export function BadgeSkeleton({ size = "md", width = "w-16", className }: BadgeSkeletonProps) {
  const sizeClasses = {
    xs: "h-4",
    sm: "h-5",
    md: "h-6",
    lg: "h-7",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size], width, className)} />;
}

/**
 * Modal skeleton for PokemonDetailsModal.
 * Matches the modal structure with header, tabs, and content sections.
 *
 * Usage:
 * ```tsx
 * <ModalSkeleton />
 * ```
 */
export function ModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <AvatarSkeleton size="xl" />
        <div className="grow space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <BadgeSkeleton size="md" />
            <BadgeSkeleton size="md" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <TextSkeleton size="sm" width="w-20" />
            <TextSkeleton size="md" width="w-32" />
          </div>
          <div className="space-y-2">
            <TextSkeleton size="sm" width="w-20" />
            <TextSkeleton size="md" width="w-32" />
          </div>
        </div>

        <div className="space-y-2">
          <TextSkeleton size="md" width="w-full" />
          <TextSkeleton size="md" width="w-full" />
          <TextSkeleton size="md" width="w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Re-export CardSkeleton as PokemonCardSkeleton for backwards compatibility.
 * This maintains compatibility with existing imports.
 *
 * @deprecated Use CardSkeleton instead
 */
export const PokemonCardSkeleton = CardSkeleton;
