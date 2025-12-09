# PokeMMO Link - Quick Start Guide

## What Changed?

Your app now has **automatic live updates** and better error handling! 🎉

### Key Features

1. **Auto-Refresh** - Data updates every 3 seconds automatically
2. **Better Caching** - Pokemon species data cached for 24 hours
3. **Loading States** - Smooth skeleton loaders while fetching
4. **Error Handling** - App won't crash on errors
5. **Better Performance** - Optimized data fetching with TanStack Query

## Running the App

```powershell
# Development server (with auto-refresh)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## How It Works Now

### Before (Manual)
```
1. User clicks refresh button
2. App fetches data
3. Updates state
4. Re-renders
```

### After (Automatic)
```
1. App loads
2. Auto-fetches every 3 seconds
3. Shows skeletons while loading
4. Updates seamlessly in background
```

## Configuration

Edit `.env.local` to customize:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
POKEMMO_INSTALL_PATH=C:\Program Files\PokeMMO
```

## Testing the Live Updates

1. Start Next.js: `npm run dev`
2. Open http://localhost:3000
3. Start PokeSnooper (from PokeSnooper directory): `.\gradlew runSnooper`
4. Open PokeMMO and navigate to your party/daycare
5. Watch the dashboard update automatically! ✨

## Troubleshooting

### Data Not Updating?
- Check that Snooper is running and posting to `http://localhost:3000/api/ingest`
- Look for "✓ Synced to Next.js" messages in Snooper console
- Verify `data/dump-party.json` or `data/dump-daycare.json` exists

### Stale Pokemon Data?
Clear the cache in browser console:
```javascript
localStorage.removeItem('pokemmo-link-pokemon-cache-v4');
```

### Errors or Crashes?
- Click "Try Again" on the error screen
- Check browser console for details
- Verify `.env.local` is configured correctly

## New Files Added

- `src/lib/query-provider.tsx` - TanStack Query setup
- `src/hooks/usePokemonState.ts` - Auto-refreshing data hook
- `src/components/PokemonCardSkeleton.tsx` - Loading skeleton
- `src/components/ErrorBoundary.tsx` - Error handling
- `IMPROVEMENTS.md` - Detailed changelog

## What's Next?

Consider adding:
- WebSocket support for instant updates (no polling)
- Toast notifications for new Pokemon caught
- React Query DevTools for debugging
- Multi-user support with Firebase
