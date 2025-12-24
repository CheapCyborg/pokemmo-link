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
    <div className="min-h-screen py-6 px-4 space-y-6 bg-slate-50 dark:bg-slate-900">
      <DashboardHeader
        isLive={hasData ? true : false}
        status={hasData ? "Live" : "Connecting..."}
        onFileUpload={() => {}}
        onRefresh={handleRefresh}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <DashboardSidebar
          playerName={playerName}
          userProfileId={userProfileId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="lg:col-span-3 flex flex-col min-h-[70vh]">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-700 mb-6 flex items-center gap-3">
            <div className="relative grow">
              <input
                type="text"
                placeholder="Search Pokemon..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg outline-none text-sm"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-indigo-600 transition">
              <RefreshCw size={18} />
            </button>
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
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition shadow-sm dark:shadow-slate-950/30">
                  <option value="all">All Regions</option>
                  <option value="kanto">Kanto</option>
                  <option value="hoenn">Hoenn</option>
                  <option value="sinnoh">Sinnoh</option>
                  <option value="unova">Unova</option>
                </select>
              )}
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
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
