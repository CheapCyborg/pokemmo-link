"use client";

import { RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { EnrichedPokemon } from "@/types/pokemon";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PcBoxViewer } from "@/components/dashboard/PcBoxViewer";
import { PokemonCardSkeleton } from "@/components/pokemon/PokemonCardSkeleton";
import { PokemonDetailsModal } from "@/components/pokemon/PokemonDetailsModal";
import { PokemonGrid } from "@/components/pokemon/PokemonGrid";
import { Spinner } from "@/components/ui/spinner";

import { useEnrichedPokemon } from "@/hooks/useEnrichedPokemon";
import { useLiveData } from "@/hooks/useLiveData";
import { getRegionForSlot } from "@/lib/constants/regions";

export default function Page() {
  const [userProfileId] = useState<string>("local-poc");
  const [playerName] = useState<string>("Cyborg");
  const [activeTab, setActiveTab] = useState<"party" | "daycare" | "pc">(
    "party"
  );
  const [daycareRegion, setDaycareRegion] = useState<string>("all");

  // Fetch live data
  const partyQuery = useLiveData("party");
  const daycareQuery = useLiveData("daycare");
  const pcQuery = useLiveData("pc_boxes");

  // --- Data Preparation ---
  const teamData = useMemo(
    () => [...(partyQuery.data?.pokemon ?? [])].sort((a, b) => a.slot - b.slot),
    [partyQuery.data?.pokemon]
  );

  const daycareData = useMemo(
    () =>
      [...(daycareQuery.data?.pokemon ?? [])].sort((a, b) => a.slot - b.slot),
    [daycareQuery.data?.pokemon]
  );

  // Filter daycare by selected region
  const filteredDaycareData = useMemo(() => {
    if (daycareRegion === "all") return daycareData;
    return daycareData.filter(
      (p) => getRegionForSlot(p.slot) === daycareRegion
    );
  }, [daycareData, daycareRegion]);

  // --- Enrichment with Loading States ---
  const enrichedTeamState = useEnrichedPokemon(teamData);
  const enrichedDaycareState = useEnrichedPokemon(filteredDaycareData);

  // --- Status ---
  const isLoading =
    partyQuery.isLoading || daycareQuery.isLoading || pcQuery.isLoading;
  const hasData =
    teamData.length > 0 || daycareData.length > 0 || pcQuery.hasData;

  // --- Modal Logic ---
  const [selected, setSelected] = useState<EnrichedPokemon | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleOpenDetails = useCallback((p: EnrichedPokemon) => {
    setSelected(p);
    setDetailsOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    partyQuery.refetch();
    daycareQuery.refetch();
    pcQuery.refetch();
  }, [partyQuery, daycareQuery, pcQuery]);

  const countPill =
    activeTab === "party"
      ? `${teamData.length} / 6`
      : activeTab === "daycare"
        ? daycareRegion === "all"
          ? `${daycareData.length}`
          : `${filteredDaycareData.length} / ${daycareData.length}`
        : pcQuery.hasData
          ? "Stored"
          : "0";

  return (
    <div className="min-h-screen font-sans p-4 md:p-8">
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

        <div className="lg:col-span-3">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-700 mb-6 flex items-center gap-3">
            <div className="relative grow">
              <input
                type="text"
                placeholder="Search Pokemon..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg outline-none text-sm"
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
            </div>
            <button
              onClick={() => {
                partyQuery.refetch();
                daycareQuery.refetch();
                pcQuery.refetch();
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 transition">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {activeTab === "party"
                ? "Active Party"
                : activeTab === "daycare"
                  ? "Daycare"
                  : "PC Boxes"}
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
          {isLoading && !hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PokemonCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "party" &&
                (enrichedTeamState.isLoading ? (
                  <Spinner />
                ) : (
                  <PokemonGrid
                    pokemonList={enrichedTeamState.data ?? []}
                    onPokemonClick={handleOpenDetails}
                    emptyMessage="Party is empty."
                    context="party"
                  />
                ))}

              {activeTab === "daycare" &&
                (enrichedDaycareState.isLoading ? (
                  <Spinner />
                ) : (
                  <PokemonGrid
                    pokemonList={enrichedDaycareState.data ?? []}
                    onPokemonClick={handleOpenDetails}
                    emptyMessage="Daycare is empty."
                    context="daycare"
                  />
                ))}

              {activeTab === "pc" && (
                <PcBoxViewer
                  pcQueryData={pcQuery.data}
                  onOpenDetails={handleOpenDetails}
                />
              )}
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
