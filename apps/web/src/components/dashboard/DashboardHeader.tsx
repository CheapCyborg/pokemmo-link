"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Box, Database, RefreshCw } from "lucide-react";
import React from "react";

interface DashboardHeaderProps {
  isLive: boolean;
  status: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
}

export const DashboardHeader = ({
  isLive,
  status,
  onFileUpload,
  onRefresh,
}: DashboardHeaderProps) => {
  return (
    <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center space-x-3 mb-4 md:mb-0">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
          <Box className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            PokeMMO Link
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Real-time Companion App
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />

        <button
          onClick={onRefresh}
          className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          title="Refresh Data">
          <RefreshCw size={16} />
        </button>

        <label className="cursor-pointer px-3 py-1 rounded-full text-xs font-bold border bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-slate-700 transition flex items-center">
          <Database size={14} className="mr-2" />
          Load Dump
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={onFileUpload}
          />
        </label>

        <div
          className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            isLive
              ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : "bg-gray-200 text-gray-600 border-gray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
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
  );
};
