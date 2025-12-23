import { CONFIG } from "@/lib/constants/config";
import type { PokeApiAbility } from "@/types/pokemon";
import { NextResponse } from "next/server";

const revalidate = 60 * 60 * 24; // 24h

type PokeApiAbilityResponse = {
  id: number;
  name: string;
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

  const res = await fetch(`${CONFIG.api.pokeapiUrl}/ability/${id}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = (await res.json()) as PokeApiAbilityResponse;

  const description =
    json.flavor_text_entries
      ?.find((entry) => entry.language.name === "en")
      ?.flavor_text?.replace(/\n/g, " ") ?? null;

  const response: PokeApiAbility = {
    id: json.id,
    name: json.name,
    description,
  };

  return NextResponse.json(response);
}
