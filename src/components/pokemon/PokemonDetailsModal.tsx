"use client";

import { PokemonStats } from "@/components/pokemon/PokemonStats";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePokeApi } from "@/hooks/usePokeApi";
import { getNatureBadgeClass, getTypeBadgeClass, toTitleCase } from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";

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
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png`
                  }
                  alt={
                    pokemon.species?.displayName ||
                    `Species ${pokemon.identity.species_id}`
                  }
                  width={96}
                  height={96}
                  className="rounded-md"
                />
                <div className="min-w-0">
                  <div className="text-base font-extrabold truncate">
                    {pokemon.species?.displayName ||
                      pokemon.identity.nickname ||
                      `Species ${pokemon.identity.species_id}`}
                  </div>
                  <div className="text-xs text-slate-500 font-medium truncate">
                    {pokemon.species?.displayName ||
                      `Species ${pokemon.identity.species_id}`}
                    {" • "}Lvl {pokemon.state.level}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-0.5 text-[11px] rounded-md font-bold border ${getNatureBadgeClass(
                    pokemon.state.nature
                  )}`}>
                  {pokemon.state.nature}
                </span>
                {types.map((type) => (
                <span
                  key={type}
                  className={`inline-block px-1.5 py-0.5 text-[9px] rounded-md font-bold border uppercase ${getTypeBadgeClass(type)}`}>
                  {type}
                </span>
              ))}
                {!!pokemon.pokeapi_override && (
                  <span className="px-2 py-0.5 text-[11px] rounded-md font-bold border bg-slate-100 text-slate-700 border-slate-200">
                    pokeapi: {pokemon.pokeapi_override}
                  </span>
                )}
              </div>

              <PokemonStats pokemon={pokemon} />

              <div className="rounded-lg border bg-white p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Original Trainer
                </div>
                <div className="text-sm mt-1">
                  {pokemon.identity.ot_name}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
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
                          className="rounded-md border bg-slate-50 p-2 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700">
                              {move?.name
                                ? toTitleCase(move.name)
                                : `Move ${id}`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{id}
                            </span>
                          </div>

                          {move ? (
                            <>
                              <div className="flex gap-2 mb-1.5 items-center">
                                {!!move.type && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getTypeBadgeClass(move.type)}`}>
                                    {move.type}
                                  </span>
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
