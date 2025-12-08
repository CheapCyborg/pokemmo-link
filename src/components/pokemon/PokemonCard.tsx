/* eslint-disable @next/next/no-img-element */
"use client";
import { PokemonStats } from "@/components/pokemon/PokemonStats";
import {
  getNatureBadgeClass,
  getTypeBadgeClass,
} from "@/lib/poke";
import type { EnrichedPokemon } from "@/types/pokemon";

export const PokemonCard = ({
  pokemon,
  openDetailsAction,
}: {
  pokemon: EnrichedPokemon;
  openDetailsAction: () => void;
}) => {
  const nickname = pokemon.identity.nickname?.trim();
  const hasNickname = nickname && !nickname.startsWith("Species ");
  
  const displayName = hasNickname ? nickname : (pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`);
  const speciesName = pokemon.species?.displayName || `Species ${pokemon.identity.species_id}`;
  const spriteUrl = pokemon.species?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.identity.species_id}.png`;
  const types = pokemon.species?.types || [];

  return (
    <button onClick={openDetailsAction} className="text-left w-full">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
        <div className="p-3 flex items-center space-x-3 bg-linear-to-br from-gray-50 to-gray-100 border-b border-gray-100 relative">
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10 shadow-sm">
            Lvl {pokemon.state.level}
          </div>

          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner border border-gray-100 overflow-hidden">
              <img
                src={spriteUrl}
                alt={displayName}
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/96x96/6366f1/ffffff?text=?";
                }}
              />
            </div>
          </div>

          <div className="grow min-w-0">
            <h3 className="text-md font-extrabold text-gray-800 leading-tight truncate">
              {displayName}
            </h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5 truncate">
              {speciesName}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span
                className={`inline-block px-1.5 py-0.5 text-[9px] rounded-md font-bold border ${getNatureBadgeClass(pokemon.state.nature)}`}>
                {pokemon.state.nature}
              </span>
              {types.map((type) => (
                <span
                  key={type}
                  className={`inline-block px-1.5 py-0.5 text-[9px] rounded-md font-bold border uppercase ${getTypeBadgeClass(type)}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <PokemonStats pokemon={pokemon} />

        <div className="bg-gray-50 px-3 py-2 text-[9px] text-gray-400 border-t border-gray-100 flex justify-between items-center">
          <span className="truncate">OT: {pokemon.identity.ot_name}</span>
          {Number(pokemon.identity.uuid) !== 0 && (
            <span className="font-mono">
              ID: {String(pokemon.identity.uuid).slice(-4)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
