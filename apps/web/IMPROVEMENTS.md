# Recent Improvements

## Changes Made

### 1. **Environment Variables** ✅
- Added `.env.local` and `.env.example` for configuration
- Supports `NEXT_PUBLIC_API_URL` for API endpoint
- Ready for future configuration expansion

### 2. **TanStack Query Integration** 🚀
- Installed `@tanstack/react-query` for advanced data fetching
- Created `QueryProvider` wrapper in `src/lib/query-provider.tsx`
- Added to root layout for app-wide query management
- **Auto-refresh**: Data refreshes every 3 seconds automatically
- Better loading states and error handling

### 3. **Improved Caching Strategy** 💾
- Updated `usePokemon.ts` with cache TTL (24 hours)
- Cache entries now include timestamps
- Expired entries are automatically filtered on load
- Added `clearPokemonCache()` utility function for manual cache clearing
- Upgraded cache version to v4

### 4. **New Hook: `usePokemonState`** 🎣
- Fetches party/daycare/pc data with auto-refresh
- Replaces manual `fetchState()` callback
- Automatic background polling every 3 seconds
- Better type safety with `DumpEnvelope`

### 5. **Loading Skeletons** ⏳
- Created `PokemonCardSkeleton` component
- Shows 6 skeleton cards while loading
- Smooth loading experience instead of blank screen

### 6. **Error Boundary** 🛡️
- Added `ErrorBoundary` component to catch React errors
- Prevents app crashes from component errors
- User-friendly error UI with retry button
- Wraps entire app in `layout.tsx`

### 7. **Refactored `page.tsx`** 🔧
- Removed manual state management (`useState` for data)
- Removed `useEffect` and `useCallback` for fetching
- Now uses React Query hooks exclusively
- Cleaner, more declarative code
- Better error states and loading indicators

## Breaking Changes

⚠️ **File Upload Feature**: The "Load Dump" button is temporarily disabled with React Query. To re-enable, we'd need to update the query cache manually. Consider this a deprecated feature in favor of live updates.

## Usage

### Starting the Development Server

```powershell
npm run dev
```

The app will now:
- Auto-fetch party/daycare data every 3 seconds
- Show loading skeletons on initial load
- Cache Pokemon species data for 24 hours
- Display error states gracefully

### Manual Refresh

Click the refresh icon (🔄) in the header to manually trigger a data refresh.

### Clearing Pokemon Cache

Open browser console and run:
```javascript
import { clearPokemonCache } from '@/hooks/usePokemon';
clearPokemonCache();
```

## Performance Improvements

- **Reduced API calls**: TanStack Query deduplicates requests
- **Better UX**: Loading skeletons instead of blank states
- **Automatic updates**: No need to manually refresh
- **Cache management**: Stale data automatically discarded after 24h

## Next Steps (Future)

- [ ] Add WebSocket support for instant updates (replace polling)
- [ ] Implement optimistic UI updates
- [ ] Add React Query DevTools for debugging
- [ ] Restore file upload with query cache integration
- [ ] Add toast notifications for errors/updates
