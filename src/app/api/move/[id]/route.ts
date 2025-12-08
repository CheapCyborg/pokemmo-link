// app/api/move/[id]/route.ts
import { NextResponse } from "next/server";

const revalidate = 60 * 60 * 24; // 24h

type PokeApiMove = {
  id: number;
  name: string;
  accuracy?: number | null;
  power?: number | null;
  pp?: number | null;
  type?: { name: string };
  damage_class?: { name: string };
  flavor_text_entries?: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const res = await fetch(`https://pokeapi.co/api/v2/move/${id}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = (await res.json()) as PokeApiMove;

  const description =
    json.flavor_text_entries
      ?.find((entry) => entry.language.name === "en")
      ?.flavor_text?.replace(/\n/g, " ") ?? null;

  const damage_class = json.damage_class?.name ?? null;

  return NextResponse.json({
    id: json.id,
    name: json.name,
    accuracy: json.accuracy ?? null,
    power: json.power ?? null,
    pp: json.pp ?? null,
    type: json.type?.name ?? null,

    // ✅ what your UI expects
    damage_class,

    // (optional) keep old field so nothing else breaks
    damageClass: damage_class,

    description,
  });
}
