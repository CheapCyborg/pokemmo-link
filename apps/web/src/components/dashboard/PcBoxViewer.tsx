"use client";

import { Box } from "lucide-react";
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { VirtuosoGrid } from "react-virtuoso";

import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { Spinner } from "@/components/ui/spinner";
import { useEnrichedPokemon } from "@/hooks/useEnrichedPokemon";
import type { EnrichedPokemon, PcDumpEnvelope } from "@/types/pokemon";

interface PcBoxViewerProps {
  pcQueryData: PcDumpEnvelope | undefined;
  onOpenDetails: (pokemon: EnrichedPokemon) => void;
}

function PcBoxViewerComponent({
  pcQueryData,
  onOpenDetails,
}: PcBoxViewerProps) {
  const [activeBox, setActiveBox] = useState<string | null>(null);
  const deferredActiveBox = useDeferredValue(activeBox);
  const isPending = activeBox !== deferredActiveBox;

  const pcBoxKeys = useMemo(() => {
    if (!pcQueryData?.boxes) return [];
    return Object.keys(pcQueryData.boxes).sort((a, b) => {
      const numA = parseInt(a.replace("box_", "")) || 0;
      const numB = parseInt(b.replace("box_", "")) || 0;
      return numA - numB;
    });
  }, [pcQueryData]);

  useEffect(() => {
    if (!activeBox && pcBoxKeys.length > 0) {
      setActiveBox(pcBoxKeys[0] || null);
    }
  }, [activeBox, pcBoxKeys]);

  const activeBoxData = useMemo(() => {
    if (!pcQueryData?.boxes || !deferredActiveBox) return [];
    const box = pcQueryData.boxes[deferredActiveBox];
    if (!box || !box.pokemon) return [];
    return [...box.pokemon].sort((a, b) => a.slot - b.slot);
  }, [pcQueryData, deferredActiveBox]);

  // Fetch data
  const enrichedPcState = useEnrichedPokemon(activeBoxData);

  if (!pcQueryData?.boxes && !activeBox) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Box size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          PC Data Unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Box Selector */}
      {pcBoxKeys.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 shrink-0">
          {pcBoxKeys.map((key) => {
            const boxNum = parseInt(key.replace("box_", ""));
            const label = `B${boxNum}`;
            const isActive = activeBox === key;

            return (
              <button
                key={key}
                onClick={() => setActiveBox(key)}
                className={`
                  px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }
                `}>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* 1. Show Spinner while loading data for the new box.
         2. key={activeBox} FORCES a complete reset of the grid when switching boxes.
            This fixes the glitch where the old scroll position/data would linger.
      */}
      {enrichedPcState.isLoading || isPending ? (
        <div className="min-h-[500px] flex items-center justify-center">
          <Spinner />
        </div>
      ) : enrichedPcState.hasData ? (
        <div className="min-h-[500px]">
          <VirtuosoGrid
            key={deferredActiveBox} // <--- CRITICAL FIX FOR BOX SWITCHING
            useWindowScroll
            data={enrichedPcState.data ?? []}
            totalCount={enrichedPcState.data?.length ?? 0}
            overscan={500} // Reduced from 2000 to improve performance
            listClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            itemContent={(index, p) => (
              <PokemonCard
                key={`${p.identity.uuid}-${index}`}
                pokemon={p}
                onCardClick={onOpenDetails}
              />
            )}
          />
        </div>
      ) : (
        <div className="py-10 text-center text-slate-400 text-sm italic">
          Box is empty.
        </div>
      )}
    </div>
  );
}

export const PcBoxViewer = memo(PcBoxViewerComponent);
