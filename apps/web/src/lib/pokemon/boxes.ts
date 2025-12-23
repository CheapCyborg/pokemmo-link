// Pokemon PC Box utilities
import type { PokeDumpMon } from "@/types/pokemon";

/**
 * Group Pokemon by box_id
 * Returns a map of box_id => Pokemon[]
 */
export function groupPokemonByBox(pokemon: PokeDumpMon[]): Map<string, PokeDumpMon[]> {
  const boxMap = new Map<string, PokeDumpMon[]>();

  for (const mon of pokemon) {
    const boxId = mon.box_id || "unknown";
    if (!boxMap.has(boxId)) {
      boxMap.set(boxId, []);
    }
    boxMap.get(boxId)!.push(mon);
  }

  // Sort each box's Pokemon by slot
  for (const [, mons] of boxMap) {
    mons.sort((a, b) => (a.box_slot ?? a.slot) - (b.box_slot ?? b.slot));
  }

  return boxMap;
}

/**
 * Get sorted list of box IDs
 * Sorts: box_1, box_2, ..., box_11, account_box, extra_box_N
 */
export function getSortedBoxIds(boxMap: Map<string, PokeDumpMon[]>): string[] {
  return Array.from(boxMap.keys()).sort((a, b) => {
    // Standard boxes (box_1 through box_11)
    const isStandardA = a.startsWith("box_") && !a.startsWith("extra_box_");
    const isStandardB = b.startsWith("box_") && !b.startsWith("extra_box_");

    if (isStandardA && isStandardB) {
      const numA = parseInt(a.replace("box_", "")) || 0;
      const numB = parseInt(b.replace("box_", "")) || 0;
      return numA - numB;
    }

    // Account box comes after standard boxes
    if (a === "account_box") return isStandardB ? 1 : -1;
    if (b === "account_box") return isStandardA ? -1 : 1;

    // Extra boxes come last
    if (a.startsWith("extra_box_") && b.startsWith("extra_box_")) {
      const numA = parseInt(a.replace("extra_box_", "")) || 0;
      const numB = parseInt(b.replace("extra_box_", "")) || 0;
      return numA - numB;
    }

    return a.localeCompare(b);
  });
}

/**
 * Get display name for box ID
 */
export function getBoxDisplayName(boxId: string): string {
  if (boxId === "account_box") return "Account Box";
  if (boxId.startsWith("box_")) {
    const num = boxId.replace("box_", "");
    return `Box ${num}`;
  }
  if (boxId.startsWith("extra_box_")) {
    const num = boxId.replace("extra_box_", "");
    return `Extra Box ${num}`;
  }
  return boxId;
}
