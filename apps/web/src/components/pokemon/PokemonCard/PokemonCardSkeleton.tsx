import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";

export interface PokemonCardSkeletonProps {
  className?: string;
}

/**
 * PokemonCard.Skeleton displays loading state matching compound structure.
 *
 * Features:
 * - Matches Header/Body/Footer layout
 * - Uses base Skeleton components
 * - Same styling as actual card
 *
 * @example
 * <PokemonCard.Skeleton />
 */
export function PokemonCardSkeleton({ className }: PokemonCardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl shadow-md",
        "border border-gray-200 dark:border-slate-800",
        "overflow-hidden w-full",
        className
      )}>
      {/* Header */}
      <div className="p-3 flex items-center space-x-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="grow space-y-2">
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
      <div className="bg-gray-50 dark:bg-slate-800 px-3 py-2 border-t border-gray-100 dark:border-slate-700">
        <Skeleton className="h-2 w-32" />
      </div>
    </div>
  );
}
