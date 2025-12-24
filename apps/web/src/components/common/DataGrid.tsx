import { cn } from "@/lib/utils";
import { AlertCircle, Lock } from "lucide-react";
import type { JSX } from "react";
import { memo, type ReactNode } from "react";

/**
 * DataGrid renders a responsive grid of items with optional privacy controls.
 * Uses TypeScript generics for type-safe item rendering.
 *
 * Phase 1: Renders all data (accessDenied always false)
 * Phase 2+: Respects privacy settings (shows AccessDenied component when restricted)
 */

export interface DataGridProps<T> {
  /**
   * Array of items to render.
   */
  items: T[];

  /**
   * Render function for each item.
   * Receives item and index, returns ReactNode.
   */
  renderItem: (item: T, index: number) => ReactNode;

  /**
   * Unique key extractor for each item.
   * Used for React key prop optimization.
   */
  getItemKey: (item: T, index: number) => string | number;

  /**
   * Privacy flag: Is access to this data denied?
   * Phase 1: Always false (no restrictions)
   * Phase 2+: Checks permissions context
   *
   * @default false
   */
  accessDenied?: boolean;

  /**
   * Message to display when access is denied.
   * Phase 2+ only (Phase 1 never shows this).
   *
   * @default "This content is private"
   */
  accessDeniedMessage?: string;

  /**
   * Message to display when items array is empty.
   *
   * @default "No items to display"
   */
  emptyMessage?: string;

  /**
   * Optional className for the grid container.
   */
  className?: string;

  /**
   * Grid layout configuration.
   *
   * @default { cols: { base: 1, md: 2, xl: 3 }, gap: 4 }
   */
  layout?: {
    cols?: {
      base?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
      "2xl"?: number;
    };
    gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  };

  /**
   * Loading state for skeleton rendering.
   * When true, renders skeletonCount skeleton items.
   *
   * @default false
   */
  isLoading?: boolean;

  /**
   * Number of skeleton items to render when loading.
   *
   * @default 6
   */
  skeletonCount?: number;

  /**
   * Custom skeleton component to render when loading.
   * If not provided, uses default skeleton.
   */
  renderSkeleton?: () => ReactNode;

  /**
   * Owner metadata for Phase 2+ multi-user support.
   * Phase 1: Unused (undefined)
   * Phase 2+: Passed to renderItem for ownership indicators
   */
  owner?: {
    userId: string;
    displayName: string;
  };
}

/**
 * Default AccessDenied component shown when privacy restrictions apply.
 * Phase 2+ only (Phase 1 never renders this).
 */
function AccessDenied({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <Lock className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
      <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">Private Content</h3>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

/**
 * EmptyState component shown when items array is empty.
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
      <p className="text-sm text-slate-500 italic dark:text-slate-400">{message}</p>
    </div>
  );
}

/**
 * Default Skeleton component shown when loading.
 */
function DefaultSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

/**
 * Generate Tailwind grid column classes based on layout config.
 */
function getGridColsClasses(cols?: NonNullable<DataGridProps<unknown>["layout"]>["cols"]): string {
  if (!cols) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  const classes: string[] = [];

  if (cols.base) classes.push(`grid-cols-${cols.base}`);
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`);

  return classes.length > 0 ? classes.join(" ") : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
}

/**
 * DataGrid Component Implementation
 */
function DataGridComponent<T>({
  items,
  renderItem,
  getItemKey,
  accessDenied = false,
  accessDeniedMessage = "This content is private",
  emptyMessage = "No items to display",
  className,
  layout = { cols: { base: 1, md: 2, xl: 3 }, gap: 4 },
  isLoading = false,
  skeletonCount = 6,
  renderSkeleton,
  owner,
}: DataGridProps<T>) {
  // Phase 2+: Show access denied screen if permissions deny access
  if (accessDenied) {
    return <AccessDenied message={accessDeniedMessage} />;
  }

  // Show loading skeletons
  if (isLoading) {
    const Skeleton = renderSkeleton || DefaultSkeleton;
    const gridClasses = getGridColsClasses(layout.cols);
    const gapClass = `gap-${layout.gap ?? 4}`;

    return (
      <div className={cn("grid", gridClasses, gapClass, className)}>
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <Skeleton key={`skeleton-${idx}`} />
        ))}
      </div>
    );
  }

  // Show empty state if no items
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  // Render grid with items
  const gridClasses = getGridColsClasses(layout.cols);
  const gapClass = `gap-${layout.gap ?? 4}`;

  return (
    <div className={cn("grid", gridClasses, gapClass, className)}>
      {items.map((item, index) => (
        <div key={getItemKey(item, index)} className="h-full w-full min-w-0">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

/**
 * Memoized DataGrid component for performance optimization.
 * Prevents unnecessary re-renders when parent re-renders.
 *
 * Phase 1 Usage:
 * ```tsx
 * <DataGrid
 *   items={pokemonList}
 *   renderItem={(pokemon) => <PokemonCard pokemon={pokemon} />}
 *   getItemKey={(pokemon) => pokemon.identity.uuid}
 *   emptyMessage="No Pokemon found"
 * />
 * ```
 *
 * Phase 2+ Usage (with privacy):
 * ```tsx
 * const { canViewContainer } = usePermissions()
 *
 * <DataGrid
 *   items={pokemonList}
 *   renderItem={(pokemon) => <PokemonCard pokemon={pokemon} owner={owner} />}
 *   getItemKey={(pokemon) => pokemon.identity.uuid}
 *   accessDenied={!canViewContainer('party')}
 *   accessDeniedMessage="This trainer's party is private"
 *   owner={{ userId: friend.id, displayName: friend.name }}
 * />
 * ```
 *
 * Custom Layout:
 * ```tsx
 * <DataGrid
 *   items={items}
 *   renderItem={(item) => <ItemCard item={item} />}
 *   getItemKey={(item) => item.id}
 *   layout={{
 *     cols: { base: 1, sm: 2, md: 3, lg: 4, xl: 5 },
 *     gap: 6
 *   }}
 * />
 * ```
 */
export const DataGrid = memo(DataGridComponent) as <T>(props: DataGridProps<T>) => JSX.Element;
