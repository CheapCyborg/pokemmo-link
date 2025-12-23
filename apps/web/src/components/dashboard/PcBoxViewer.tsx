"use client";

import { Box } from "lucide-react";
import { memo, useDeferredValue } from "react";
import { VirtuosoGrid } from "react-virtuoso";

import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { Spinner } from "@/components/ui/spinner";
import { usePokemonFlow } from "@/hooks/usePokemonFlow";
import { getBoxDisplayName } from "@/lib/pokemon/boxes";
import type { EnrichedPokemon } from "@/types/pokemon";

interface PcBoxViewerProps {
  onOpenDetails: (pokemon: EnrichedPokemon) => void;
}

function PcBoxViewerComponent({ onOpenDetails }: PcBoxViewerProps) {
  // Orchestrator handles ALL complexity: fetching, filtering, enriching
  const { state, actions } = usePokemonFlow("pc_boxes");

  // Optimization: Defer the active box ID to handle UI transitions smoothly
  const deferredActiveBoxId = useDeferredValue(state.activeBoxId);
  const isPending = state.activeBoxId !== deferredActiveBoxId;

  // Empty state
  if (state.totalCount === 0 && state.flowState === "ready") {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Box size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">PC Data Unavailable</p>
      </div>
    );
  }

  // Error state
  if (state.flowState === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <p>Error loading PC data</p>
        <button onClick={actions.refresh} className="mt-2 text-sm underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Box Selector */}
      {state.availableBoxes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 shrink-0">
          {state.availableBoxes.map((boxId) => {
            const displayName = getBoxDisplayName(boxId);
            const isActive = state.activeBoxId === boxId;

            return (
              <button
                key={boxId}
                onClick={() => actions.setActiveBox(boxId)}
                className={`
                  px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }
                `}>
                {displayName}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      {state.flowState === "loading" || state.flowState === "enriching" || isPending ? (
        <div className="min-h-[500px] flex items-center justify-center">
          <Spinner />
        </div>
      ) : state.visiblePokemon.length > 0 ? (
        <div className="grow h-full">
          <VirtuosoGrid
            key={deferredActiveBoxId} // Reset internal state when box changes to avoid
            useWindowScroll
            data={state.visiblePokemon.filter((p) => p.computed !== undefined)}
            totalCount={state.visiblePokemon.filter((p) => p.computed !== undefined).length}
            overscan={500} // Reduced from 2000 to improve performance
            listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            itemContent={(index, p) => (
              <PokemonCard key={`${p.identity.uuid}-${index}`} pokemon={p} onCardClick={onOpenDetails} />
            )}
          />
        </div>
      ) : (
        <div className="py-10 text-center text-slate-400 text-sm italic">Box is empty.</div>
      )}
    </div>
  );
}

export const PcBoxViewer = memo(PcBoxViewerComponent);
