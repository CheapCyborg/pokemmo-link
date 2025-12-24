"use client";

import { RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { EnrichedPokemon } from "@/types/pokemon";

import { DataGrid } from "@/components/common/DataGrid";
import { CardSkeletonList } from "@/components/common/Skeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PcBoxViewer } from "@/components/dashboard/PcBoxViewer";
import { PokemonCard } from "@/components/pokemon/PokemonCard/index";
import { PokemonDetailsModal } from "@/components/pokemon/PokemonDetailsModal";
import { Button } from "@/components/ui/button";

import { usePokemonFlow } from "@/hooks/usePokemonFlow";
import { getRegionForSlot } from "@/lib/constants/regions";

export default function Page() {
  const [userProfileId] = useState<string>("local-poc");
  const [playerName] = useState<string>("Cyborg");
  const [activeTab, setActiveTab] = useState<"party" | "daycare" | "pc">("party");
  const [daycareRegion, setDaycareRegion] = useState<string>("all");

  // Use orchestrators for each container - they handle ALL data logic
  const { state: partyState, actions: partyActions } = usePokemonFlow("party");
  const { state: daycareState, actions: daycareActions } = usePokemonFlow("daycare");

  // Filter daycare by selected region
  const filteredDaycareData = useMemo(() => {
    if (daycareRegion === "all") return daycareState.visiblePokemon;
    return daycareState.visiblePokemon.filter((p) => getRegionForSlot(p.slot) === daycareRegion);
  }, [daycareState.visiblePokemon, daycareRegion]);

  // --- Status ---
  const isPending = partyState.flowState === "loading" || daycareState.flowState === "loading";
  const hasData = partyState.totalCount > 0 || daycareState.totalCount > 0;

  // --- Modal Logic ---
  const [selected, setSelected] = useState<EnrichedPokemon | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleOpenDetails = useCallback((p: EnrichedPokemon) => {
    setSelected(p);
    setDetailsOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    partyActions.refresh();
    daycareActions.refresh();
  }, [partyActions, daycareActions]);

  const countPill =
    activeTab === "party"
      ? `${partyState.visiblePokemon.length} / 6`
      : activeTab === "daycare"
        ? daycareRegion === "all"
          ? `${daycareState.visiblePokemon.length}`
          : `${filteredDaycareData.length} / ${daycareState.visiblePokemon.length}`
        : "PC Boxes";

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 px-4 py-6 dark:bg-slate-900">
      <DashboardHeader
        isLive={hasData ? true : false}
        status={hasData ? "Live" : "Connecting..."}
        onFileUpload={() => {}}
        onRefresh={handleRefresh}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-4">
        <DashboardSidebar
          playerName={playerName}
          userProfileId={userProfileId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="flex min-h-[70vh] flex-col lg:col-span-3">
          {/* Top Bar */}
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
            <div className="relative grow">
              <input
                type="text"
                placeholder="Search Pokemon..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
              />
              <Search size={16} className="absolute top-2.5 left-3 text-slate-400" />
            </div>
            <Button onClick={handleRefresh} className="p-2 text-slate-400 transition hover:text-indigo-600">
              <RefreshCw size={18} />
            </Button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {activeTab === "party" ? "Active Party" : activeTab === "daycare" ? "Daycare" : "PC Boxes"}
            </h2>
            <div className="flex items-center gap-3">
              {activeTab === "daycare" && (
                <select
                  value={daycareRegion}
                  onChange={(e) => setDaycareRegion(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:shadow-slate-950/30 dark:focus:ring-indigo-400">
                  <option value="all">All Regions</option>
                  <option value="kanto">Kanto</option>
                  <option value="hoenn">Hoenn</option>
                  <option value="sinnoh">Sinnoh</option>
                  <option value="unova">Unova</option>
                </select>
              )}
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {countPill}
              </span>
            </div>
          </div>

          {/* Content Area */}
          {isPending && !hasData ? (
            <CardSkeletonList count={6} />
          ) : (
            <>
              {activeTab === "party" && (
                <DataGrid
                  items={partyState.visiblePokemon.filter((p) => p.computed !== undefined)}
                  renderItem={(pokemon) => (
                    <PokemonCard.Root pokemon={pokemon} onClick={() => handleOpenDetails(pokemon)}>
                      <PokemonCard.Header context="party" />
                      <PokemonCard.Body />
                      <PokemonCard.Footer />
                    </PokemonCard.Root>
                  )}
                  getItemKey={(pokemon) => pokemon.identity.uuid}
                  emptyMessage="Party is empty."
                />
              )}

              {activeTab === "daycare" && (
                <DataGrid
                  items={filteredDaycareData.filter((p) => p.computed !== undefined)}
                  renderItem={(pokemon) => (
                    <PokemonCard.Root pokemon={pokemon} onClick={() => handleOpenDetails(pokemon)}>
                      <PokemonCard.Header context="daycare" />
                      <PokemonCard.Body />
                      <PokemonCard.Footer />
                    </PokemonCard.Root>
                  )}
                  getItemKey={(pokemon) => pokemon.identity.uuid}
                  emptyMessage="Daycare is empty."
                />
              )}

              {activeTab === "pc" && <PcBoxViewer onOpenDetails={handleOpenDetails} />}
            </>
          )}
        </div>
      </div>

      <PokemonDetailsModal
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelected(null);
        }}
        pokemon={selected}
      />
    </div>
  );
}
