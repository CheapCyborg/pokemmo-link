"use client";

import { NatureBadge } from "@/components/pokemon/NatureBadge";
import { PokemonStats } from "@/components/pokemon/PokemonStats";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { imageCache } from "@/lib/imageCache";
import { toTitleCase } from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Heart, Mars, Venus, Volume2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PokemonDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pokemon: EnrichedPokemon | null | undefined;
}

export function PokemonDetailsModal({
  open,
  onOpenChange,
  pokemon,
}: PokemonDetailsModalProps) {
  // Note: We do NOT fetch moves here anymore. They are pre-loaded in pokemon.movesData!
  
  const types = pokemon?.species?.types || [];

  // --- OPTIMIZED IMAGE LOGIC ---
  const animatedUrl = pokemon?.species?.sprites?.animated;
  const staticUrl = 
    pokemon?.species?.sprites?.front_default ||
    (pokemon ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png` : "");

  // Determine initial image based on global cache
  const getInitialImage = () => {
    if (animatedUrl && !imageCache.isBroken(animatedUrl)) {
      return animatedUrl;
    }
    return staticUrl;
  };

  const [modalImgSrc, setModalImgSrc] = useState<string>(getInitialImage());

  // Reset image when the pokemon changes (or opens)
  useEffect(() => {
    setModalImgSrc(getInitialImage());
  }, [pokemon, animatedUrl, staticUrl]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCry = () => {
    if (!pokemon) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.identity.species_id}.ogg`
    );
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().catch((e) => console.error("Failed to play cry", e));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {pokemon ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Image
                  src={modalImgSrc}
                  alt={
                    pokemon.species?.displayName ||
                    `Species ${pokemon.identity.species_id}`
                  }
                  width={72}
                  height={72}
                  sizes="96px"
                  unoptimized
                  className="w-16 h-16 object-contain [image-rendering:pixelated] rounded-md"
                  onError={() => {
                    if (modalImgSrc === animatedUrl && animatedUrl) {
                      imageCache.reportError(animatedUrl);
                      setModalImgSrc(staticUrl);
                    } else if (modalImgSrc !== staticUrl) {
                      setModalImgSrc(staticUrl);
                    }
                  }}
                />
                <div className="min-w-0 grow">
                  <div className="flex items-center gap-2">
                    <div className="text-base font-extrabold truncate">
                      {pokemon.species?.displayName ||
                        pokemon.identity.nickname ||
                        `Species ${pokemon.identity.species_id}`}
                    </div>
                    <button
                      onClick={playCry}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Play Cry"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span>
                      {pokemon.species?.displayName ||
                        `Species ${pokemon.identity.species_id}`}
                    </span>
                    <span className="font-['Press_Start_2P'] text-[8px] leading-none text-slate-700 dark:text-slate-300">
                      Lv.{pokemon.state.level}
                    </span>
                    {pokemon.state.current_hp !== null &&
                    pokemon.computed?.calculatedStats.hp ? (
                      <span className="font-['Press_Start_2P'] text-[8px] leading-none text-slate-700 dark:text-slate-300">
                        HP {pokemon.state.current_hp}/
                        {pokemon.computed.calculatedStats.hp}
                      </span>
                    ) : null}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {types.map((type) => (
                      <TypeBadge key={type} type={type} size="md" />
                    ))}
                  </div>
                  <NatureBadge
                    nature={pokemon.state.nature}
                    className="px-2 py-0.5 text-[10px]"
                  />
                  {!!pokemon.pokeapi_override && (
                    <span className="px-1.5 py-0.5 text-[9px] rounded font-bold border bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                      OVERRIDE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Hap
                    </span>
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    <span className="font-['Press_Start_2P'] text-[8px] text-slate-700 dark:text-slate-200 leading-none pt-0.5">
                      {pokemon.state.happiness ?? "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {pokemon.computed?.gender === "female" ? (
                      <>
                        <Venus className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase">
                          Fem
                        </span>
                      </>
                    ) : pokemon.computed?.gender === "male" ? (
                      <>
                        <Mars className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                          Male
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <PokemonStats pokemon={pokemon} />

              <div className="rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Original Trainer
                </div>
                <div className="text-sm mt-1 text-slate-900 dark:text-slate-100">
                  {pokemon.identity.ot_name}
                </div>
              </div>

              {/* --- RESTORED MOVES UI --- */}
              <div className="rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Moves
                </div>

                {pokemon.movesData && pokemon.movesData.length > 0 ? (
                  <div className="space-y-2">
                    {pokemon.movesData.map((move) => (
                      <div
                        key={move.id}
                        className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2 text-xs"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {toTitleCase(move.name)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            #{move.id}
                          </span>
                        </div>

                        <div className="flex gap-2 mb-1.5 items-center">
                          {/* Type Badge */}
                          {!!move.type && (
                            <TypeBadge
                              type={move.type}
                              size="sm"
                              className="rounded"
                            />
                          )}
                          
                          {/* Damage Class Badge (Physical/Special) */}
                          {!!move.damage_class && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                              {move.damage_class}
                            </span>
                          )}
                          
                          {/* Stats (Power, Accuracy, PP) */}
                          <span className="ml-auto text-[10px] font-mono text-slate-500">
                            PWR: {move.power ?? "-"} • ACC:{" "}
                            {move.accuracy ?? "-"} • PP:{" "}
                            {move.pp_left ?? move.pp ?? "-"}
                          </span>
                        </div>
                        
                        {/* Description */}
                        {!!move.description && (
                          <p className="text-slate-500 italic leading-tight">
                            {move.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-1">
                    {pokemon.moves && pokemon.moves.length > 0
                      ? "Loading moves..."
                      : "No moves learned."}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}