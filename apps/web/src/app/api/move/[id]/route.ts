// app/api/move/[id]/route.ts
import { CONFIG } from "@/lib/constants/config";
import type { PokeApiMove, PokeApiMoveResponse, PokemonType } from "@/types/pokemon";
import { PokeApiMoveSchema, POKEMON_TYPES } from "@/types/schemas";
import { NextResponse } from "next/server";

const revalidate = 60 * 60 * 24; // 24h

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const res = await fetch(`${CONFIG.api.pokeapiUrl}/move/${id}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = (await res.json()) as PokeApiMoveResponse;

  const description =
    json.flavor_text_entries?.find((entry) => entry.language.name === "en")?.flavor_text?.replace(/\n/g, " ") ?? null;

  const typeName = json.type?.name ?? null;
  const validType: PokemonType | null =
    typeName && POKEMON_TYPES.includes(typeName as PokemonType) ? (typeName as PokemonType) : null;

  const response: PokeApiMove = {
    id: json.id,
    name: json.name,
    accuracy: json.accuracy ?? null,
    power: json.power ?? null,
    pp: json.pp ?? null,
    type: validType,
    damage_class: json.damage_class?.name ?? null,
    description,
  };

  // Validate before returning
  const validated = PokeApiMoveSchema.parse(response);
  return NextResponse.json(validated);
}
