export type GrowthRate = "erratic" | "fast" | "medium" | "medium-slow" | "slow" | "fluctuating";

/**
 * Calculates the total XP required to reach a specific level based on growth rate.
 * Formulas based on Gen 3-5 mechanics (which PokeMMO generally follows).
 */
export function getXpForLevel(level: number, rate: string | undefined): number {
  if (level <= 1) return 0;
  const n = level;
  const n2 = n * n;
  const n3 = n * n * n;

  switch (rate) {
    case "erratic":
      if (n < 50) return (n3 * (100 - n)) / 50;
      if (n < 68) return (n3 * (150 - n)) / 100;
      if (n < 98) return (n3 * Math.floor((1911 - 10 * n) / 3)) / 500;
      return (n3 * (160 - n)) / 100;

    case "fast":
      return (4 * n3) / 5;

    case "medium":
    case "medium-fast":
      return n3;

    case "medium-slow":
      return (6 / 5) * n3 - 15 * n2 + 100 * n - 140;

    case "slow":
      return (5 * n3) / 4;

    case "fluctuating":
      if (n < 15) return (n3 * (Math.floor((n + 1) / 3) + 24)) / 50;
      if (n < 36) return (n3 * (n + 14)) / 50;
      return (n3 * (Math.floor(n / 2) + 32)) / 50;

    default:
      // Fallback to medium-fast if unknown
      return n3;
  }
}

const GROWTH_RATES: GrowthRate[] = ["erratic", "fast", "medium", "medium-slow", "slow", "fluctuating"];

/**
 * Attempts to detect the growth rate based on current level and XP.
 * Returns the rate that makes the most sense (where current XP is within the level's bounds).
 */
export function detectGrowthRate(level: number, xp: number): string | undefined {
  if (level >= 100) return "medium"; // Doesn't matter at max level

  // Find a rate where getXpForLevel(level) <= xp < getXpForLevel(level + 1)
  // Or at least getXpForLevel(level) <= xp
  for (const rate of GROWTH_RATES) {
    const start = getXpForLevel(level, rate);
    const next = getXpForLevel(level + 1, rate);
    if (xp >= start && xp < next) {
      return rate;
    }
  }

  // Fallback: Find the rate that minimizes the distance to the start of the level
  // (Useful if we are slightly out of bounds due to rounding or formula mismatches)
  let bestRate: string | undefined;
  let minDiff = Number.MAX_VALUE;

  for (const rate of GROWTH_RATES) {
    const start = getXpForLevel(level, rate);
    if (xp >= start) {
      const diff = xp - start;
      if (diff < minDiff) {
        minDiff = diff;
        bestRate = rate;
      }
    }
  }

  return bestRate;
}

/**
 * Calculates the progress percentage towards the next level.
 * Returns a value between 0 and 100.
 */
export function getLevelProgress(currentXp: number, currentLevel: number, rate: string | undefined): number {
  if (currentLevel >= 100) return 100;

  // Auto-detect rate if missing or if the provided rate seems wrong (currentXp < startXp)
  let effectiveRate = rate;
  if (!effectiveRate || currentXp < getXpForLevel(currentLevel, effectiveRate)) {
    effectiveRate = detectGrowthRate(currentLevel, currentXp);
  }

  const startXp = getXpForLevel(currentLevel, effectiveRate);
  const nextXp = getXpForLevel(currentLevel + 1, effectiveRate);

  // Safety check to avoid division by zero or negative progress
  if (nextXp <= startXp) return 0;

  // If we still can't find a valid rate, return 0
  if (currentXp < startXp) return 0;

  if (currentXp >= nextXp) return 100; // Should have leveled up

  const needed = nextXp - startXp;
  const gained = currentXp - startXp;

  return Math.min(100, Math.max(0, (gained / needed) * 100));
}
