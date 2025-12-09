"use client";

import { FriendCard } from "@/components/dashboard/FriendCard";
import { Box, Clipboard, Database, LayoutGrid, User, Users } from "lucide-react";

interface DashboardSidebarProps {
  playerName: string;
  userProfileId: string;
  activeTab: "party" | "daycare" | "pc";
  setActiveTab: (tab: "party" | "daycare" | "pc") => void;
}

export const DashboardSidebar = ({
  playerName,
  userProfileId,
  activeTab,
  setActiveTab,
}: DashboardSidebarProps) => {
  const friends = [
    { name: "GymLeaderMisty", teamCount: 6, lastSeen: "5m ago" },
    { name: "Red", teamCount: 6, lastSeen: "1h ago" },
    { name: "YoungsterJoey", teamCount: 1, lastSeen: "2d ago" },
  ];

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
            <User size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{playerName}</h2>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
            ID: {userProfileId.slice(0, 6)}...
          </p>
        </div>

        <div
          className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          onClick={() => navigator.clipboard.writeText(userProfileId)}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Copy Share Link
          </span>
          <Clipboard size={14} className="text-indigo-500 dark:text-indigo-400" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setActiveTab("party")}
          className={[
            "relative w-full px-4 py-3 text-left font-bold text-xs flex items-center transition-colors",
            "rounded-t-xl", // keeps top corners rounded
            activeTab === "party"
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600 dark:before:bg-indigo-400 before:rounded-tl-xl"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800",
          ].join(" ")}>
          <LayoutGrid size={16} className="mr-3" /> Active Party
        </button>

        <button
          onClick={() => setActiveTab("daycare")}
          className={[
            "relative w-full px-4 py-3 text-left font-bold text-xs flex items-center transition-colors",
            "border-t border-slate-100 dark:border-slate-800",
            activeTab === "daycare"
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600 dark:before:bg-indigo-400"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800",
          ].join(" ")}>
          <Database size={16} className="mr-3" /> Daycare
        </button>

        <button
          onClick={() => setActiveTab("pc")}
          className={[
            "relative w-full px-4 py-3 text-left font-bold text-xs flex items-center transition-colors",
            "rounded-b-xl border-t border-slate-100 dark:border-slate-800", // keeps bottom corners rounded
            activeTab === "pc"
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600 dark:before:bg-indigo-400 before:rounded-bl-xl"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800",
          ].join(" ")}>
          <Box size={16} className="mr-3" /> PC Boxes
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center text-sm">
            <Users size={16} className="mr-2 text-indigo-500 dark:text-indigo-400" /> Friends
          </h3>
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
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
  );
};
