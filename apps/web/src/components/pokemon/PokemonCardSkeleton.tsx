// src/components/pokemon/PokemonCardSkeleton.tsx
export function PokemonCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-slate-950/50 border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="p-3 flex items-center space-x-3 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-700">
        <div className="relative shrink-0">
          <div className="w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="grow min-w-0">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32 mb-2" />
          <div className="flex gap-1">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 px-3 py-2 border-t border-gray-100 dark:border-slate-700">
        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-32" />
      </div>
    </div>
  );
}
