"use client";

import { Box, Database } from "lucide-react";
import React from "react";

interface DashboardHeaderProps {
  isLive: boolean;
  status: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DashboardHeader = ({
  isLive,
  status,
  onFileUpload,
}: DashboardHeaderProps) => {
  return (
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
            onChange={onFileUpload}
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
  );
};
