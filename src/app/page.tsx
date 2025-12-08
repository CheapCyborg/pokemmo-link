// app/page.tsx
"use client";

import {
  Box,
  Clipboard,
  Database,
  LayoutGrid,
  RefreshCw,
  Search,
  User,
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getNatureBadgeClass,
  toTitleCase,
} from "@/lib/poke";
import type { PokeDumpMon } from "@/types/pokemon";

import { FriendCard } from "@/components/FriendCard";
import { PokemonCard } from "@/components/PokemonCard";
import { PokemonCardSkeleton } from "@/components/PokemonCardSkeleton";
import { PokemonDetailsContent } from "@/components/PokemonDetailsContent";
import { useEnrichedPokemon } from "@/hooks/useEnrichedPokemon";
import { useLiveData } from "@/hooks/useLiveData";
import { usePokeApi } from "@/hooks/usePokeApi";

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

  const friends = [
    { name: "GymLeaderMisty", teamCount: 6, lastSeen: "5m ago" },
    { name: "Red", teamCount: 6, lastSeen: "1h ago" },
    { name: "YoungsterJoey", teamCount: 1, lastSeen: "2d ago" },
  ];

  const showingList = activeTab === "party" ? teamData : pcData;
  const countPill =
    activeTab === "party" ? `${teamData.length} / 6` : `${pcData.length}`;

  // Enrich Pokemon with species data
  const enrichedTeam = useEnrichedPokemon(teamData);
  const enrichedPC = useEnrichedPokemon(pcData);
  const enrichedShowingList =
    activeTab === "party" ? enrichedTeam : enrichedPC;

  const { data: apiMoveById } = usePokeApi(
    "move",
    detailsOpen ? selected?.moves?.map((m) => m.move_id) ?? [] : []
  );

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
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800 p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
            <Box className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              PokeMMO Link
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time Companion App
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="cursor-pointer px-3 py-1 rounded-full text-xs font-bold border bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 transition flex items-center">
            <Database size={14} className="mr-2" />
            Load Dump
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleFileUpload}
            />
          </label>

          <div
            className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              isLive
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-gray-200 text-gray-600 border-gray-300"
            }`}>
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {status}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                <User size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{playerName}</h2>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                ID: {userProfileId.slice(0, 6)}...
              </p>
            </div>

            <div
              className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
              onClick={() => navigator.clipboard.writeText(userProfileId)}>
              <span className="text-xs font-medium text-slate-500">
                Copy Share Link
              </span>
              <Clipboard size={14} className="text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setActiveTab("party")}
              className={[
                "relative w-full px-4 py-3 text-left font-bold text-xs flex items-center transition-colors",
                "rounded-t-xl", // keeps top corners rounded
                activeTab === "party"
                  ? "bg-indigo-50 text-indigo-700 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600 before:rounded-tl-xl"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}>
              <LayoutGrid size={16} className="mr-3" /> Active Party
            </button>

            <button
              onClick={() => setActiveTab("pc")}
              className={[
                "relative w-full px-4 py-3 text-left font-bold text-xs flex items-center transition-colors",
                "rounded-b-xl", // keeps bottom corners rounded
                activeTab === "pc"
                  ? "bg-indigo-50 text-indigo-700 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600 before:rounded-bl-xl"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}>
              <Database size={16} className="mr-3" /> Daycare
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-700 flex items-center text-sm">
                <Users size={16} className="mr-2 text-indigo-500" /> Friends
              </h3>
              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                3 Online
              </span>
            </div>
            <div className="space-y-2">
              {friends.map((friend, i) => (
                <FriendCard key={i} {...friend} />
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
            <div className="relative grow">
              <input
                type="text"
                value={
                  viewingProfileId === userProfileId ? "" : viewingProfileId
                }
                onChange={(e) => setViewingProfileId(e.target.value)}
                placeholder="Spectate a Friend..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
            </div>

            {viewingProfileId !== userProfileId && (
              <button
                onClick={() => setViewingProfileId(userProfileId)}
                className="px-3 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-100 transition">
                Back to Me
              </button>
            )}

            <button
              onClick={() => {
                partyQuery.refetch();
                daycareQuery.refetch();
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 transition"
              title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              {activeTab === "party" ? "Active Party" : "Daycare"}
              {!!lastUpdated && (
                <span className="ml-3 text-[10px] font-normal text-slate-400">
                  Last update: {lastUpdated}
                </span>
              )}
            </h2>
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                  onClick={() => openDetails(p)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Box size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">
                {hasError ? "Connection error. Please try again." : "No data available."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelected(null);
        }}>
        <DialogContent className="max-w-lg">
          {selectedEnriched ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      selectedEnriched.species?.sprite ||
                      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedEnriched.identity.species_id}.png`
                    }
                    alt={
                      selectedEnriched.species?.displayName ||
                      `Species ${selectedEnriched.identity.species_id}`
                    }
                    width={96}
                    height={96}
                    className="rounded-md"
                  />
                  <div className="min-w-0">
                    <div className="text-base font-extrabold truncate">
                      {selectedEnriched.species?.displayName ||
                        selectedEnriched.identity.nickname ||
                        `Species ${selectedEnriched.identity.species_id}`}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {selectedEnriched.species?.displayName ||
                        `Species ${selectedEnriched.identity.species_id}`}
                      {" • "}Lvl {selectedEnriched.state.level}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-md font-bold border ${getNatureBadgeClass(selectedEnriched.state.nature)}`}>
                    {selectedEnriched.state.nature}
                  </span>

                  {!!selectedEnriched.pokeapi_override && (
                    <span className="px-2 py-0.5 text-[11px] rounded-md font-bold border bg-slate-100 text-slate-700 border-slate-200">
                      pokeapi: {selectedEnriched.pokeapi_override}
                    </span>
                  )}
                </div>

                <PokemonDetailsContent pokemon={selectedEnriched} />

                <div className="rounded-lg border bg-white p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Original Trainer
                  </div>
                  <div className="text-sm mt-1">
                    {selectedEnriched.identity.ot_name}
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Moves
                  </div>

                  {selectedEnriched.moves?.length ? (
                    <div className="space-y-2">
                      {selectedEnriched.moves.map((m) => {
                        const id = m.move_id;
                        const move = apiMoveById[id];
                        return (
                          <div
                            key={id}
                            className="rounded-md border bg-slate-50 p-2 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700">
                                {move?.name
                                  ? toTitleCase(move.name)
                                  : `Move ${id}`}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{id}
                              </span>
                            </div>

                            {move ? (
                              <>
                                <div className="flex gap-2 mb-1.5 items-center">
                                  {!!move.type && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                                      {move.type}
                                    </span>
                                  )}
                                  {!!move.damage_class && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                                      {move.damage_class}
                                    </span>
                                  )}
                                  <span className="ml-auto text-[10px] font-mono text-slate-500">
                                    PWR: {move.power ?? "-"} • ACC: {move.accuracy ?? "-"} • PP: {m.pp ?? move.pp ?? "-"}
                                  </span>
                                </div>
                                {!!move.description && (
                                  <p className="text-slate-500 italic leading-tight">
                                    {move.description}
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">
                      No moves in dump yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
