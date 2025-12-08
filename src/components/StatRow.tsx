"use client";

export const StatRow = ({
  label,
  stat,
  iv,
  ev,
  maxStat,
  color,
  natureEffect,
}: {
  label: string;
  stat: number;
  iv: number;
  ev: number;
  maxStat: number;
  color: string;
  natureEffect?: number;
}) => {
  let labelColor = "text-gray-500";
  let sign = null;

  if (natureEffect === 1.1) {
    labelColor = "text-red-600";
    sign = <span className="text-red-600 ml-0.5">+</span>;
  } else if (natureEffect === 0.9) {
    labelColor = "text-blue-600";
    sign = <span className="text-blue-600 ml-0.5">-</span>;
  }

  return (
    <div className="flex items-center text-xs">
      <span
        className={`w-10 font-mono font-bold flex items-center ${labelColor}`}>
        {label}
        {sign}
      </span>
      <span className="w-10 text-right font-bold text-gray-800 mr-3">
        {stat}
      </span>

      <div className="grow h-2 bg-gray-100 rounded-full mr-3 relative overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${(stat / maxStat) * 100}%` }}
        />
      </div>

      <div className="flex space-x-1 text-[10px] font-mono w-20 justify-end">
        <span
          className={`${iv === 31 ? "text-green-600 font-bold" : "text-gray-400"}`}>
          {iv}
        </span>
        <span className="text-gray-300">/</span>
        <span
          className={`${ev > 0 ? "text-yellow-600 font-bold" : "text-gray-400"}`}>
          {ev}
        </span>
      </div>
    </div>
  );
};
