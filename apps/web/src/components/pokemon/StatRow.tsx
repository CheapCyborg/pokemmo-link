"use client";

export const StatRow = ({
  label,
  stat,
  base,
  iv,
  ev,
  maxStat,
  color,
  natureEffect,
}: {
  label: string;
  stat: number;
  base?: number;
  iv: number;
  ev: number;
  maxStat: number;
  color: string;
  natureEffect?: number;
}) => {
  let labelColor = "text-slate-500 dark:text-slate-400";
  let sign = null;

  if (natureEffect === 1.1) {
    labelColor = "text-red-600 dark:text-red-400";
    sign = <span className="text-red-600 dark:text-red-400 ml-0.5">+</span>;
  } else if (natureEffect === 0.9) {
    labelColor = "text-blue-600 dark:text-blue-400";
    sign = <span className="text-blue-600 dark:text-blue-400 ml-0.5">-</span>;
  }

  // Calculate width for Base Stat (relative to maxStat)
  const baseWidth = base ? Math.min(100, (base / maxStat) * 100) : 0;
  // Calculate width for Total Stat
  const totalWidth = Math.min(100, (stat / maxStat) * 100);

  return (
    <div className="flex items-center text-xs h-6">
      {/* Label */}
      <div
        className={`w-8 font-mono font-bold flex items-center ${labelColor}`}>
        {label}
        {sign}
      </div>

      {/* Base Value */}
      <div className="w-8 text-center font-mono text-slate-400 dark:text-slate-500 text-[10px]">
        {base || "-"}
      </div>

      {/* Bar (Visualizing Base Stat vs Total) */}
      <div className="grow mx-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        {/* Total Stat (Colored) - Background Layer */}
        <div
          className={`absolute top-0 left-0 h-full ${color}`}
          style={{ width: `${totalWidth}%` }}
        />

        {/* Base Stat (Dark Grey) - Overlay Layer */}
        {base !== undefined && (
          <div
            className="absolute top-0 left-0 h-full bg-slate-400/80 dark:bg-slate-600/80 border-r border-white/20"
            style={{ width: `${baseWidth}%` }}
          />
        )}
      </div>

      {/* Current Value */}
      <div className="w-10 text-right font-bold text-slate-700 dark:text-slate-200">
        {stat}
      </div>

      {/* IV */}
      <div className="w-6 text-right font-mono text-[10px]">
        <span
          className={`${
            iv === 31
              ? "text-green-600 dark:text-green-400 font-bold"
              : "text-slate-400 dark:text-slate-500"
          }`}>
          {iv}
        </span>
      </div>

      {/* EV */}
      <div className="w-8 text-right font-mono text-[10px]">
        <span
          className={`${
            ev > 0
              ? "text-amber-600 dark:text-amber-400 font-bold"
              : "text-slate-300 dark:text-slate-700"
          }`}>
          {ev}
        </span>
      </div>
    </div>
  );
};
