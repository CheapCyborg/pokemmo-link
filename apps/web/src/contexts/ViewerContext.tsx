"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * ViewMode determines how data is displayed to the viewer.
 *
 * - 'own': Viewing own data (full access, can edit/manage)
 * - 'friend': Viewing friend's data (respects their privacy settings)
 * - 'public': Viewing public profile (limited data visibility)
 */
export type ViewMode = "own" | "friend" | "public";

/**
 * ViewerContextValue defines who is viewing and what they are viewing.
 * This context is server-safe (no localStorage) and provides the foundation
 * for multi-user features while maintaining backwards compatibility with Phase 1.
 */
export interface ViewerContextValue {
  /**
   * The authenticated user's ID (who is currently logged in).
   * Phase 1: Always 'local-poc' (single-user, no auth)
   * Phase 2+: Real user ID from Supabase Auth
   */
  currentUserId: string;

  /**
   * The user ID whose data is being viewed.
   * Phase 1: Always 'local-poc' (viewing own data)
   * Phase 2+: Could be friend's ID when viewing their profile
   */
  viewingUserId: string;

  /**
   * Computed flag: Is the viewer looking at their own data?
   * Phase 1: Always true
   * Phase 2+: False when viewing friend's data
   */
  isViewingSelf: boolean;

  /**
   * How the data should be displayed based on relationship.
   * Phase 1: Always 'own'
   * Phase 2+: 'friend' | 'public' when viewing others
   */
  viewMode: ViewMode;

  /**
   * Display name of the current user.
   * Phase 1: 'Local Trainer'
   * Phase 2+: User's actual display name
   */
  currentUserDisplayName: string;

  /**
   * Display name of the user being viewed.
   * Phase 1: 'Local Trainer'
   * Phase 2+: Friend's display name
   */
  viewingUserDisplayName: string;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

/**
 * ViewerProvider wraps the app and provides viewer identity context.
 *
 * Phase 1 Usage (default):
 * ```tsx
 * <ViewerProvider>{children}</ViewerProvider>
 * ```
 *
 * Phase 2+ Usage (with auth):
 * ```tsx
 * <ViewerProvider
 *   currentUserId={session.user.id}
 *   viewingUserId={profileUserId}
 *   currentUserDisplayName={session.user.name}
 *   viewingUserDisplayName={profileUser.name}
 * >
 *   {children}
 * </ViewerProvider>
 * ```
 */
export interface ViewerProviderProps {
  children: ReactNode;
  /**
   * Override the current user ID.
   * Default: 'local-poc' (Phase 1 single-user mode)
   */
  currentUserId?: string;
  /**
   * Override the viewing user ID.
   * Default: Same as currentUserId (viewing own data)
   */
  viewingUserId?: string;
  /**
   * Override the current user's display name.
   * Default: 'Local Trainer'
   */
  currentUserDisplayName?: string;
  /**
   * Override the viewing user's display name.
   * Default: Same as currentUserDisplayName
   */
  viewingUserDisplayName?: string;
}

export function ViewerProvider({
  children,
  currentUserId = "local-poc",
  viewingUserId,
  currentUserDisplayName = "Local Trainer",
  viewingUserDisplayName,
}: ViewerProviderProps) {
  const actualViewingUserId = viewingUserId ?? currentUserId;
  const actualViewingUserDisplayName = viewingUserDisplayName ?? currentUserDisplayName;
  const isViewingSelf = currentUserId === actualViewingUserId;

  const value = useMemo<ViewerContextValue>(
    () => ({
      currentUserId,
      viewingUserId: actualViewingUserId,
      isViewingSelf,
      viewMode: isViewingSelf ? "own" : "friend",
      currentUserDisplayName,
      viewingUserDisplayName: actualViewingUserDisplayName,
    }),
    [currentUserId, actualViewingUserId, isViewingSelf, currentUserDisplayName, actualViewingUserDisplayName]
  );

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

/**
 * Hook to access the ViewerContext.
 *
 * Phase 1 Example:
 * ```tsx
 * const { currentUserId, isViewingSelf } = useViewer()
 * // currentUserId: 'local-poc', isViewingSelf: true
 * ```
 *
 * Phase 2+ Example (viewing friend):
 * ```tsx
 * const { viewingUserId, isViewingSelf, viewMode, viewingUserDisplayName } = useViewer()
 * // viewingUserId: 'friend-123', isViewingSelf: false, viewMode: 'friend'
 * ```
 *
 * @throws {Error} If used outside ViewerProvider
 */
export function useViewer(): ViewerContextValue {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return context;
}
