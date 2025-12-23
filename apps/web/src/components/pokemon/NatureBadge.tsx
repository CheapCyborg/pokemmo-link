import { NATURE_MULTIPLIERS } from "@/lib/poke";
import { cn } from "@/lib/utils";
import type { Nature } from "@/types/pokemon";

interface NatureBadgeProps {
  nature: Nature | null | undefined;
  className?: string;
  size?: "sm" | "xs";
}

const STAT_COLORS: Record<string, string> = {
  atk: "bg-red-100 text-red-700 border-red-200",
  def: "bg-orange-100 text-orange-700 border-orange-200",
  spa: "bg-blue-100 text-blue-700 border-blue-200",
  spd: "bg-purple-100 text-purple-700 border-purple-200",
  spe: "bg-pink-100 text-pink-700 border-pink-200",
};

export function NatureBadge({
  nature,
  className,
  size = "sm",
}: NatureBadgeProps) {
  if (!nature) return null;

  const mods = NATURE_MULTIPLIERS[nature];
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

  if (mods) {
    const boostedStat = Object.entries(mods).find(
      ([, value]) => value === 1.1
    )?.[0];

    if (boostedStat && STAT_COLORS[boostedStat]) {
      colorClass = STAT_COLORS[boostedStat];
    }
  }

  const plus = Object.entries(mods || {}).find(([, v]) => v === 1.1)?.[0];
  const minus = Object.entries(mods || {}).find(([, v]) => v === 0.9)?.[0];

  const sizeClasses =
    size === "xs" ? "px-1 py-0 text-[8px] h-4" : "px-1.5 py-0.5 text-[9px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-bold border",
        sizeClasses,
        colorClass,
        className
      )}
      title={
        plus && minus
          ? `+${plus.toUpperCase()} / -${minus.toUpperCase()}`
          : "Neutral Nature"
      }>
      {nature}
      {plus && minus && (
        <span className="opacity-75 text-[8px] leading-none">
          {`+${plus.slice(0, 3).toUpperCase()}`}
        </span>
      )}
    </span>
  );
}
