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
import { usePokeApi } from "@/hooks/usePokeApi";
import { getSpriteUrl, toTitleCase } from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";
import { Heart, Mars, Venus, Volume2 } from "lucide-react";

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
  const { data: apiMoveById } = usePokeApi(
    "move",
    open && pokemon?.moves ? pokemon.moves.map((m) => m.move_id) : []
  );
  
  const types = pokemon?.species?.types || [];

  const playCry = () => {
    if (!pokemon) return;
    const audio = new Audio(
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.identity.species_id}.ogg`
    );
    audio.volume = 0.5;
    audio.play().catch((e) => console.error("Failed to play cry", e));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {pokemon ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    pokemon.species?.sprite ||
                    getSpriteUrl(pokemon.identity.species_id)
                  }
                  alt={
                    pokemon.species?.displayName ||
                    `Species ${pokemon.identity.species_id}`
                  }
                  className="w-16 h-16 object-contain [image-rendering:pixelated] rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png`;
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
                      title="Play Cry">
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
                      pokemon.computed?.calculatedStats.hp ? <span className="font-['Press_Start_2P'] text-[8px] leading-none text-slate-700 dark:text-slate-300">
                          HP {pokemon.state.current_hp}/
                          {pokemon.computed.calculatedStats.hp}
                        </span> : null}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3 space-y-3 text-sm">
              {/* Info Bar: Types, Nature, Gender, Happiness */}
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

              <div className="rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Moves
                </div>

                {pokemon.moves?.length ? (
                  <div className="space-y-2">
                    {pokemon.moves.map((m) => {
                      const id = m.move_id;
                      const move = apiMoveById[id];
                      return (
                        <div
                          key={id}
                          className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {move?.name
                                ? toTitleCase(move.name)
                                : `Move ${id}`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              #{id}
                            </span>
                          </div>

                          {move ? (
                            <>
                              <div className="flex gap-2 mb-1.5 items-center">
                                {!!move.type && (
                                  <TypeBadge type={move.type} size="sm" className="rounded" />
                                )}
                                {!!move.damage_class && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                                    {move.damage_class}
                                  </span>
                                )}
                                <span className="ml-auto text-[10px] font-mono text-slate-500">
                                  PWR: {move.power ?? "-"} • ACC:{" "}
                                  {move.accuracy ?? "-"} • PP:{" "}
                                  {m.pp ?? move.pp ?? "-"}
                                </span>
                              </div>
                              {!!move.description && (
                                <p className="text-slate-500 italic leading-tight">
                                  {move.description}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-1">
                    No moves in dump yet.
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
