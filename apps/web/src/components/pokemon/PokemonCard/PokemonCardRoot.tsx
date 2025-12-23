"use client";

import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { PokemonCardProvider, type PokemonCardContextValue } from "./PokemonCardContext";

export interface PokemonCardRootProps extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
  children: ReactNode;
  pokemon: PokemonCardContextValue["pokemon"];
  owner?: PokemonCardContextValue["owner"];
  permissions?: PokemonCardContextValue["permissions"];
  onClick?: () => void;
}

/**
 * PokemonCard.Root is the outer container for compound card components.
 *
 * Features:
 * - Provides context to child components (Header, Body, Footer)
 * - Handles click events
 * - Phase 2: Accepts owner and permissions props
 * - Accessible button with proper focus styles
 *
 * @example
 * <PokemonCard.Root pokemon={p} onClick={() => openModal(p)}>
 *   <PokemonCard.Header pokemon={p} />
 *   <PokemonCard.Body pokemon={p} />
 *   <PokemonCard.Footer pokemon={p} />
 * </PokemonCard.Root>
 */
export function PokemonCardRoot({
  children,
  pokemon,
  owner,
  permissions,
  onClick,
  className,
  ...rest
}: PokemonCardRootProps) {
  const [isHovered, setIsHovered] = useState(false);

  const contextValue: PokemonCardContextValue = {
    pokemon,
    owner,
    permissions,
    isHovered,
  };

  return (
    <PokemonCardProvider value={contextValue}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("text-left w-full h-full group will-change-transform cursor-pointer", className)}
        {...rest}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-slate-950/50 border border-gray-200 dark:border-slate-700 overflow-hidden group-hover:shadow-2xl group-hover:shadow-indigo-500/20 dark:group-hover:shadow-indigo-500/30 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 group-hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
          {children}
        </div>
      </button>
    </PokemonCardProvider>
  );
}
