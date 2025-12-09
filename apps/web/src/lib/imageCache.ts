// src/lib/imageCache.ts

// A global set to track URLs that have returned 404/Error
// This persists for the session, so we never retry a broken GIF twice.
const BROKEN_URLS = new Set<string>();

export const imageCache = {
  /**
   * Mark a URL as broken
   */
  reportError: (url: string) => {
    if (url) BROKEN_URLS.add(url);
  },

  /**
   * Check if a URL is known to be broken
   */
  isBroken: (url: string | null | undefined) => {
    if (!url) return true;
    return BROKEN_URLS.has(url);
  },
};