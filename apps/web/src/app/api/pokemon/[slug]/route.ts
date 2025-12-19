import type { PokeApiSpecies, PokemonType } from "@/types/pokemon";
import { POKEMON_TYPES } from "@/types/pokemon";
import { NextResponse } from "next/server";

const revalidate = 60 * 60 * 24;

type PokeApiPokemon = {
  id: number;
  name: string;
  sprites?: {
    front_default?: string | null;
    front_shiny?: string | null;
    other?: unknown;
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: {
            front_default?: string | null;
            front_shiny?: string | null;
          };
        };
      };
    };
  };
  stats?: Array<{ stat?: { name?: string }; base_stat: number }>;
  types?: Array<{ type?: { name?: string } }>;
  abilities?: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
    slot: number;
  }>;
};

type PokeApiSpeciesResponse = {
  gender_rate: number;
  varieties?: Array<{
    pokemon?: { name?: string };
  }>;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  let { slug } = await ctx.params;
  slug = decodeURIComponent(slug);

  // 1. Handle "id-123-form-1" pattern
  if (slug.startsWith("id-")) {
    try {
      const parts = slug.split("-");
      // id-479-form-2 -> ["id", "479", "form", "2"]
      const speciesId = parts[1];
      const formIndexStr = parts[3];

      if (!formIndexStr) throw new Error("Invalid form pattern");
      const formIndex = parseInt(formIndexStr, 10);

      if (isNaN(formIndex)) {
        throw new Error(`Invalid form index: "${formIndexStr}"`);
      }

      // Fetch species to find the correct variety
      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${speciesId}`,
        { next: { revalidate } }
      );

      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        // PokeAPI varieties array: index 0 is base form, index 1+ are alternate forms
        // Our form_id from Snooper: 0 = base, 1+ = alternate forms
        // So we can use form_id directly as the index
        const variety = speciesData.varieties?.[formIndex];

        if (variety?.pokemon?.name) {
          slug = variety.pokemon.name;
        } else {
          // FORM FALLBACK: If variety index doesn't exist, fallback to base species ID
          console.warn(
            `Form ${formIndex} not found for species ${speciesId} (varieties: ${speciesData.varieties?.length}), falling back to base.`
          );
          slug = speciesId || slug;
        }
      } else {
        // Species lookup failed? Fallback to ID just in case
        slug = speciesId || slug;
      }
    } catch (e) {
      console.error("Failed to resolve form slug", e);
      // Fallback: If parsing fails, try to extract just the ID part if possible
      const parts = slug.split("-");
      if (parts[1]) slug = parts[1];
    }
  }

  // 2. Fetch Pokemon Data (using the resolved slug or fallback ID)
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = (await res.json()) as PokeApiPokemon;

  // 3. Fetch species data for gender_rate
  let genderRate = -1;
  try {
    const speciesRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${json.id}`,
      { next: { revalidate } }
    );
    if (speciesRes.ok) {
      const speciesData = (await speciesRes.json()) as PokeApiSpeciesResponse;
      genderRate = speciesData.gender_rate ?? -1;
    }
  } catch (e) {
    console.error("Failed to fetch species data", e);
  }

  const stats: Record<string, number> = {};
  for (const s of json.stats ?? []) {
    const key = s.stat?.name;
    if (key) stats[key] = s.base_stat;
  }

  const types = (json.types ?? [])
    .map((t) => t.type?.name)
    .filter((x): x is string => Boolean(x))
    .filter((typeName): typeName is PokemonType =>
      POKEMON_TYPES.includes(typeName as PokemonType)
    );

  const response: PokeApiSpecies = {
    id: json.id,
    name: json.name,
    sprites: {
      front_default: json.sprites?.front_default ?? null,
      front_shiny: json.sprites?.front_shiny ?? null,
      animated:
        json.sprites?.versions?.["generation-v"]?.["black-white"]?.animated
          ?.front_default ?? null,
      animated_shiny:
        json.sprites?.versions?.["generation-v"]?.["black-white"]?.animated
          ?.front_shiny ?? null,
    },
    stats,
    types,
    abilities: json.abilities ?? [],
    gender_rate: genderRate,
  };

  return NextResponse.json(response);
}
