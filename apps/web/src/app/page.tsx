// app/page.tsx
"use client";

import { Box, RefreshCw, Search } from "lucide-react";
import React, { useMemo, useState } from "react";

import type { PokeDumpMon } from "@/types/pokemon";

import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { PokemonCardSkeleton } from "@/components/pokemon/PokemonCardSkeleton";
import { PokemonDetailsModal } from "@/components/pokemon/PokemonDetailsModal";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

import { useEnrichedPokemon } from "@/hooks/useEnrichedPokemon";
import { useLiveData } from "@/hooks/useLiveData";

export default function Page() {
  // POC (no firestore yet)
  const [userProfileId] = useState<string>("local-poc");
  const [viewingProfileId, setViewingProfileId] = useState<string>("local-poc");
  const [playerName] = useState<string>("Cyborg");

  const [activeTab, setActiveTab] = useState<"party" | "pc">("party");

  // Fetch live data with React Query (auto-refreshes every 3 seconds)
  const partyQuery = useLiveData("party");
  const daycareQuery = useLiveData("daycare");

  // Derive team data from queries (memoized to prevent unnecessary re-renders)
  const teamData = useMemo(
    () => partyQuery.data?.pokemon ?? [],
    [partyQuery.data?.pokemon]
  );
  const pcData = useMemo(
    () => daycareQuery.data?.pokemon ?? [],
    [daycareQuery.data?.pokemon]
  );

  // Determine status
  const isLoading = partyQuery.isLoading || daycareQuery.isLoading;
  const hasError = partyQuery.isError || daycareQuery.isError;
  const hasData = teamData.length > 0 || pcData.length > 0;

  const status = hasError
    ? "Connection error"
    : isLoading
      ? "Loading..."
      : hasData
        ? "Live"
        : "No data yet";

  const isLive = hasData && !hasError;

  // Last updated timestamp
  const partyTimestamp = partyQuery.data?.captured_at_ms ?? 0;
  const daycareTimestamp = daycareQuery.data?.captured_at_ms ?? 0;
  const latestTimestamp = Math.max(partyTimestamp, daycareTimestamp);
  const lastUpdated =
    latestTimestamp > 0 ? new Date(latestTimestamp).toLocaleString() : null;

  // details modal
  const [selected, setSelected] = useState<PokeDumpMon | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.warn("File upload not yet implemented with React Query");
    // TODO: Implement file upload by updating React Query cache
  };



  const showingList = activeTab === "party" ? teamData : pcData;
  const countPill =
    activeTab === "party" ? `${teamData.length} / 6` : `${pcData.length}`;

  // Enrich Pokemon with species data
  const enrichedTeam = useEnrichedPokemon(teamData);
  const enrichedPC = useEnrichedPokemon(pcData);
  const enrichedShowingList =
    activeTab === "party" ? enrichedTeam : enrichedPC;

  const openDetails = (p: PokeDumpMon) => {
    setSelected(p);
    setDetailsOpen(true);
  };

  // Find enriched version of selected Pokemon
  const selectedEnriched = selected
    ? enrichedShowingList.find(
        (p) => p.identity.uuid === selected.identity.uuid && p.slot === selected.slot
      )
    : null;

  return (
    <div className="min-h-screen font-sans p-4 md:p-8">
      <DashboardHeader
        isLive={isLive}
        status={status}
        onFileUpload={handleFileUpload}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <DashboardSidebar
          playerName={playerName}
          userProfileId={userProfileId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex items-center gap-3">
            <div className="relative grow">
              <input
                type="text"
                value={
                  viewingProfileId === userProfileId ? "" : viewingProfileId
                }
                onChange={(e) => setViewingProfileId(e.target.value)}
                placeholder="Spectate a Friend..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
            </div>

            {viewingProfileId !== userProfileId && (
              <button
                onClick={() => setViewingProfileId(userProfileId)}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                Back to Me
              </button>
            )}

            <button
              onClick={() => {
                partyQuery.refetch();
                daycareQuery.refetch();
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
              {activeTab === "party" ? "Active Party" : "Daycare"}
              {!!lastUpdated && (
                <span className="ml-3 text-[10px] font-normal text-slate-400">
                  Last update: {lastUpdated}
                </span>
              )}
            </h2>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {countPill}
            </span>
          </div>

          {isLoading && showingList.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PokemonCardSkeleton key={i} />
              ))}
            </div>
          ) : showingList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enrichedShowingList.map((p, idx) => (
                <PokemonCard
                  key={`${String(p.identity.uuid ?? "x")}-${idx}`}
                  pokemon={p}
                  openDetailsAction={() => openDetails(p)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                <Box size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {hasError
                  ? "Connection error. Please try again."
                  : "No data available."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <PokemonDetailsModal
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelected(null);
        }}
        pokemon={selectedEnriched}
      />
    </div>
  );
}
