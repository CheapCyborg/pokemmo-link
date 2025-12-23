// PokeMMO Daycare Region Mappings
// Based on slot ranges within the 26-slot daycare container

export const DAYCARE_REGIONS = [
  { id: "kanto", name: "Kanto", slots: [0, 3] },
  { id: "hoenn", name: "Hoenn", slots: [4, 9] },
  { id: "sinnoh", name: "Sinnoh", slots: [10, 19] },
  { id: "unova", name: "Unova", slots: [20, 25] },
] as const;

export type DaycareRegionId = (typeof DAYCARE_REGIONS)[number]["id"];

/**
 * Determines which region a daycare slot belongs to
 * @param slot - The slot number (0-25)
 * @returns The region ID or "unknown"
 */
export function getRegionForSlot(slot: number): DaycareRegionId | "unknown" {
  for (const region of DAYCARE_REGIONS) {
    const [min, max] = region.slots;
    if (slot >= min && slot <= max) {
      return region.id;
    }
  }
  return "unknown";
}
