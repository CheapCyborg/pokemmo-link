"use client";

import { imageCache } from "@/lib/imageCache";
import { cn } from "@/lib/utils";
import type { EnrichedPokemon } from "@/types/pokemon";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface PokemonAvatarProps {
  pokemon: EnrichedPokemon;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  isHovered?: boolean; // Controlled hover state from parent
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-24 h-24",
};

const sizePixelMap = {
  sm: "40px",
  md: "56px",
  lg: "80px",
  xl: "96px",
};

/**
 * PokemonAvatar displays Pokemon sprite with hover animation support.
 * Responds to parent card hover via group-hover.
 */
export function PokemonAvatar({
  pokemon,
  size = "md",
  animated = false,
  className,
  isHovered = false,
}: PokemonAvatarProps) {
  const animatedUrl = pokemon.computed.animatedUrl;
  const staticUrl = pokemon.computed.staticUrl;
  const [imgSrc, setImgSrc] = useState(staticUrl);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset to static when pokemon changes
  useEffect(() => {
    setImgSrc(staticUrl);
  }, [staticUrl]);

  // Handle hover state changes
  useEffect(() => {
    if (isHovered) {
      if (animatedUrl && !imageCache.isBroken(animatedUrl)) {
        hoverTimer.current = setTimeout(() => {
          setImgSrc(animatedUrl);
        }, 100);
      }
    } else {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      setImgSrc(staticUrl);
    }

    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [isHovered, animatedUrl, staticUrl]);

  const handleError = () => {
    if (imgSrc === animatedUrl && animatedUrl) {
      imageCache.reportError(animatedUrl);
      setImgSrc(staticUrl);
    }
  };

  const isStatic = imgSrc === staticUrl;

  return (
    <div className={cn("relative flex items-center justify-center shrink-0", sizeMap[size], className)}>
      <Image
        src={imgSrc}
        alt={pokemon.computed.displayName}
        fill
        unoptimized
        className={cn(
          "object-contain [image-rendering:pixelated] transition-transform duration-500 ease-out",
          isStatic ? "scale-135 group-hover:scale-145" : "scale-125 group-hover:scale-135"
        )}
        onError={handleError}
        priority={false}
        sizes={sizePixelMap[size]}
      />
    </div>
  );
}
