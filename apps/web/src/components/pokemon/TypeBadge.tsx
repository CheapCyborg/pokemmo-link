import { cn } from "@/lib/utils";
import Image from "next/image";

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-[#A8A878] text-white border-[#6D6D4E]",
  fire: "bg-[#F08030] text-white border-[#9C531F]",
  water: "bg-[#6890F0] text-white border-[#445E9C]",
  electric: "bg-[#F8D030] text-gray-800 border-[#A1871F]",
  grass: "bg-[#78C850] text-white border-[#4E8234]",
  ice: "bg-[#98D8D8] text-gray-800 border-[#638D8D]",
  fighting: "bg-[#C03028] text-white border-[#7D1F1A]",
  poison: "bg-[#A040A0] text-white border-[#682A68]",
  ground: "bg-[#E0C068] text-gray-800 border-[#927D44]",
  flying: "bg-[#A890F0] text-white border-[#6D5E9C]",
  psychic: "bg-[#F85888] text-white border-[#A13959]",
  bug: "bg-[#A8B820] text-white border-[#6D7815]",
  rock: "bg-[#B8A038] text-white border-[#786824]",
  ghost: "bg-[#705898] text-white border-[#493963]",
  dragon: "bg-[#7038F8] text-white border-[#4924A1]",
  dark: "bg-[#705848] text-white border-[#49392F]",
  steel: "bg-[#B8B8D0] text-gray-800 border-[#787887]",
  fairy: "bg-[#EE99AC] text-gray-800 border-[#9B6470]",
};

interface TypeBadgeProps {
  type: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

export function TypeBadge({ type, className, size = "md" }: TypeBadgeProps) {
  if (!type) return null;

  const normalizedType = type.toLowerCase();
  const colorClass =
    TYPE_COLORS[normalizedType] || "bg-gray-400 text-white border-gray-600";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold border uppercase tracking-wide shadow-sm gap-1 pl-1.5 pr-2.5",
        size === "sm" ? "py-0.5 text-[9px]" : "py-0.5 text-[10px]",
        colorClass,
        className
      )}>
      <Image
        src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalizedType}.svg`}
        alt=""
        width={size === "sm" ? 10 : 14}
        height={size === "sm" ? 10 : 14}
        className={cn(
          "object-contain",
          size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
        )}
      />
      {type}
    </span>
  );
}
