import { NextResponse } from "next/server";

const revalidate = 60 * 60 * 24;

type PokeApiPokemon = {
  id: number;
  name: string;
  sprites?: {
    front_default?: string | null;
    other?: unknown;
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: {
            front_default?: string | null;
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

type PokeApiSpecies = {
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

  // Handle "id-123-form-1" pattern
  if (slug.startsWith("id-")) {
    try {
      const parts = slug.split("-");
      // id-479-form-2 -> ["id", "479", "form", "2"]
      const speciesId = parts[1];
      const formIndexStr = parts[3];
      if (!formIndexStr) throw new Error("Invalid form pattern");
      const formIndex = parseInt(formIndexStr, 10);

      // Fetch species to find the correct variety
      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${speciesId}`,
        {
          next: { revalidate },
        }
      );

      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        // varieties is usually ordered: default, then forms in order
        // We trust PokeAPI's order matches the game's form index
        const variety = speciesData.varieties?.[formIndex];
        if (variety?.pokemon?.name) {
          slug = variety.pokemon.name;
        }
      }
    } catch (e) {
      console.error("Failed to resolve form slug", e);
      // Fallback to original slug (which will likely fail 404 but that's fine)
    }
  }

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = (await res.json()) as PokeApiPokemon;

  // Fetch species data for gender_rate
  let genderRate = -1; // Default to genderless
  try {
    const speciesRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${json.id}`,
      {
        next: { revalidate },
      }
    );
    if (speciesRes.ok) {
      const speciesData = (await speciesRes.json()) as PokeApiSpecies;
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
    .filter((x): x is string => Boolean(x));

  return NextResponse.json({
    id: json.id,
    name: json.name,
    sprites: {
      front_default: json.sprites?.front_default ?? null,
      animated:
        json.sprites?.versions?.["generation-v"]?.["black-white"]?.animated
          ?.front_default ?? null,
    },
    stats,
    types,
    abilities: json.abilities,
    gender_rate: genderRate,
  });
}
