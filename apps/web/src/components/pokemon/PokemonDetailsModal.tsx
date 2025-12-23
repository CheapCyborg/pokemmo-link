"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { imageCache } from "@/lib/imageCache";
import { toTitleCase } from "@/lib/pokemon/enrichment";
import { getLevelProgress, getXpForLevel } from "@/lib/pokemon/xp";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Activity, Flame, Heart, Mars, Sparkles, Swords, Venus, Volume2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NatureBadge } from "./NatureBadge";
import { PokemonQuickInfo } from "./PokemonQuickInfo";
import { PokemonStats } from "./PokemonStats";
import { TypeBadge } from "./TypeBadge";

interface PokemonDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pokemon: EnrichedPokemon | null | undefined;
}

export function PokemonDetailsModal({ open, onOpenChange, pokemon }: PokemonDetailsModalProps) {
  // Zero logic - ALL values pre-computed
  const types = pokemon?.species?.types || [];
  const isShiny = pokemon?.identity.is_shiny;
  const isAlpha = pokemon?.identity.is_alpha;
  const displayName = pokemon?.computed.displayName || "";
  const hasNickname = pokemon?.computed.hasNickname || false;
  const abilityDescription = pokemon?.activeAbility?.description;

  // Sprite - pre-computed with fallbacks already handled
  const preferredSprite = pokemon?.computed.preferredSprite || "";
  const [modalImgSrc, setModalImgSrc] = useState<string>(preferredSprite);

  useEffect(() => {
    setModalImgSrc(preferredSprite);
  }, [preferredSprite]);

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCry = () => {
    if (!pokemon?.computed.cryUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(pokemon.computed.cryUrl);
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().catch((e) => console.error("Failed to play cry", e));
  };

  if (!pokemon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col min-h-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 space-y-0">
          <div className="flex items-start gap-4">
            {/* Pokemon Image */}
            <div className="relative shrink-0">
              <Image
                src={modalImgSrc}
                alt={displayName}
                width={96}
                height={96}
                unoptimized
                className={`w-24 h-24 object-contain [image-rendering:pixelated] ${
                  isAlpha ? "drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]" : ""
                }`}
                onError={() => {
                  const fallbackSprite = pokemon.computed.staticUrl;
                  if (modalImgSrc !== fallbackSprite) {
                    imageCache.reportError(modalImgSrc);
                    setModalImgSrc(fallbackSprite);
                  }
                }}
              />
              <div className="absolute -top-1 -right-1 flex flex-col gap-1 items-end">
                {isAlpha && <Flame className="w-5 h-5 text-red-500 fill-red-500" aria-label="Alpha" />}
                {isShiny && <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" aria-label="Shiny" />}
              </div>
            </div>

            {/* Title & Quick Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-slate-400 dark:text-slate-500 text-sm font-bold">
                  {pokemon.computed.dexNum}
                </span>
                <DialogTitle asChild>
                  <h2 className="text-2xl font-extrabold truncate">{displayName}</h2>
                </DialogTitle>
                <button
                  onClick={playCry}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title="Play Cry">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {types.map((type) => (
                  <TypeBadge key={type} type={type} size="sm" />
                ))}
                <NatureBadge nature={pokemon.state.nature} size="sm" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Lv {pokemon.state.level}
                </span>
                {pokemon.state.current_hp !== null && pokemon.computed?.calculatedStats.hp ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold">
                    HP {pokemon.state.current_hp}/{pokemon.computed.calculatedStats.hp}
                  </span>
                ) : null}
                {pokemon.computed?.gender && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {pokemon.computed.gender === "female" ? (
                      <>
                        <Venus className="w-3 h-3 text-pink-500" />
                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">Female</span>
                      </>
                    ) : (
                      <>
                        <Mars className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Male</span>
                      </>
                    )}
                  </span>
                )}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/50">
                  <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span className="text-[10px] font-bold text-pink-700 dark:text-pink-400">
                    {pokemon.state.happiness ?? "-"}
                  </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                {hasNickname && (
                  <div>
                    <span className="font-medium">
                      {pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`}
                    </span>
                  </div>
                )}
                <div>OT: {pokemon.identity.ot_name}</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Quick Info Section */}
        <PokemonQuickInfo pokemon={pokemon} />

        <Separator className="mx-6" />

        {/* Scrollable Content - Two Column Layout */}
        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Stats Section */}
              <Accordion type="multiple" defaultValue={["stats"]}>
                <AccordionItem
                  value="stats"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/60 shadow-none overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold">Stats & Training</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <PokemonStats pokemon={pokemon} />

                    {/* XP Progress */}
                    {pokemon.state.xp !== null && (
                      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Experience
                          </div>
                          <div className="flex-1 relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
                              style={{
                                width: `${getLevelProgress(
                                  pokemon.state.xp,
                                  pokemon.state.level,
                                  pokemon.species?.growth_rate || undefined
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>
                            Total:{" "}
                            <strong className="text-slate-700 dark:text-slate-200">
                              {pokemon.state.xp.toLocaleString()}
                            </strong>
                          </span>
                          {pokemon.state.level < 100 && (
                            <span>
                              To Next:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {(
                                  getXpForLevel(pokemon.state.level + 1, pokemon.species?.growth_rate || undefined) -
                                  pokemon.state.xp
                                ).toLocaleString()}
                              </strong>
                            </span>
                          )}
                          {pokemon.state.level >= 100 && (
                            <span className="text-amber-600 dark:text-amber-500 font-bold">MAX</span>
                          )}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Moves Section */}
              <Accordion type="multiple" defaultValue={["moves"]}>
                <AccordionItem
                  value="moves"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/60 shadow-none overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-red-500" />
                      <span className="font-bold">Moves</span>
                      <span className="text-xs text-slate-500">({pokemon.movesData?.length || 0}/4)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    {pokemon.movesData && pokemon.movesData.length > 0 ? (
                      <div className="space-y-2">
                        {pokemon.movesData.map((move, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{toTitleCase(move.name)}</span>
                                <TypeBadge type={move.type as any} size="xs" />
                              </div>
                              {move.pp && (
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                  PP: {move.pp}
                                </span>
                              )}
                            </div>
                            {move.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {move.description}
                              </p>
                            )}
                            {/* TODO: Add power, accuracy, effect chance, etc. */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No move data available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Ability Section */}
              <Accordion type="multiple" defaultValue={["ability"]}>
                <AccordionItem
                  value="ability"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/60 shadow-none overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="font-bold">Ability</span>
                      {pokemon.activeAbility && (
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                          {toTitleCase(pokemon.activeAbility.name)}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                    {pokemon.activeAbility && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {toTitleCase(pokemon.activeAbility.name)}
                          </span>
                          {pokemon.activeAbility.isHidden && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold uppercase border border-purple-200 dark:border-purple-800">
                              Hidden
                            </span>
                          )}
                        </div>
                        {abilityDescription && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {abilityDescription}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Possible Abilities */}
                    {pokemon.species?.abilities && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Possible Abilities
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pokemon.species.abilities.map((a) => {
                            const isActive = pokemon.activeAbility?.name === a.name;
                            return (
                              <div
                                key={a.name}
                                className={`px-2 py-1 rounded-md text-xs border ${
                                  isActive
                                    ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-bold"
                                    : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                }`}>
                                {toTitleCase(a.name)}
                                {a.isHidden && " (H)"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Placeholder: Evolution */}
              <Accordion type="multiple">
                <AccordionItem
                  value="evolution"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/60 shadow-none overflow-hidden opacity-50"
                  disabled>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Evolution & Breeding</span>
                      <span className="text-xs text-slate-400">(Coming Soon)</span>
                    </div>
                  </AccordionTrigger>
                </AccordionItem>
              </Accordion>

              {/* Placeholder: Locations */}
              <Accordion type="multiple">
                <AccordionItem
                  value="locations"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/60 shadow-none overflow-hidden opacity-50"
                  disabled>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Wild Locations</span>
                      <span className="text-xs text-slate-400">(Coming Soon)</span>
                    </div>
                  </AccordionTrigger>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
