// src/lib/imageCache.ts

const STORAGE_KEY = "pokemmo-broken-images-v1";

// A global set to track URLs that have returned 404/Error
// Persists across sessions via localStorage
const BROKEN_URLS = new Set<string>();

export const imageCache = {
  /**
   * Initialize cache from localStorage
   * Call this once on app mount
   */
  init: () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const urls = JSON.parse(stored) as string[];
        urls.forEach((url) => BROKEN_URLS.add(url));
      }
    } catch (e) {
      console.warn("[imageCache] Failed to load from localStorage", e);
    }
  },

  /**
   * Mark a URL as broken and persist to localStorage
   */
  reportError: (url: string) => {
    if (!url) return;
    BROKEN_URLS.add(url);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...BROKEN_URLS]));
      } catch (e) {
        console.warn("[imageCache] Failed to persist to localStorage", e);
      }
    }
  },

  /**
   * Check if a URL is known to be broken
   */
  isBroken: (url: string | null | undefined) => {
    if (!url) return true;
    return BROKEN_URLS.has(url);
  },

  /**
   * Clear all broken URL records (for debugging)
   */
  clear: () => {
    BROKEN_URLS.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
