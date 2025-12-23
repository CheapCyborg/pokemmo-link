"use client";

import type { ContainerType } from "@/types/pokemon";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useViewer } from "./ViewerContext";

/**
 * Privacy settings for a user's Pokemon containers.
 * Phase 1: All true (no restrictions)
 * Phase 2+: Fetched from Supabase privacy_settings table
 */
export interface PrivacySettings {
  /** Can view party Pokemon list */
  showParty: boolean;
  /** Can view daycare Pokemon list */
  showDaycare: boolean;
  /** Can view PC box Pokemon lists */
  showPCBoxes: boolean;
  /** Can view detailed stats (IVs, EVs, nature) */
  showDetailedStats: boolean;
  /** Can view Individual Values (IVs) */
  showIVs: boolean;
  /** Can view Effort Values (EVs) */
  showEVs: boolean;
  /** Can view Pokemon nicknames */
  showNicknames: boolean;
  /** Can view shiny status */
  showShinyStatus: boolean;
}

/**
 * Default privacy settings for Phase 1 (all visible).
 * In Phase 2, these will be fetched from the database.
 */
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showParty: true,
  showDaycare: true,
  showPCBoxes: true,
  showDetailedStats: true,
  showIVs: true,
  showEVs: true,
  showNicknames: true,
  showShinyStatus: true,
};

/**
 * PermissionsContextValue provides privacy-aware permission checks.
 * All checks respect the relationship between currentUser and viewingUser.
 */
export interface PermissionsContextValue {
  /**
   * Privacy settings for the user being viewed.
   * Phase 1: Always returns defaults (all true)
   * Phase 2+: Fetched from Supabase based on viewingUserId
   */
  privacySettings: PrivacySettings;

  /**
   * Check if viewer can see a specific container type.
   * Phase 1: Always true
   * Phase 2+: Checks privacy settings + friendship status
   *
   * @param container - The container type to check
   * @returns true if viewer has permission
   */
  canViewContainer: (container: ContainerType) => boolean;

  /**
   * Check if viewer can see detailed stats (IVs, EVs, nature).
   * Phase 1: Always true
   * Phase 2+: Checks showDetailedStats privacy setting
   *
   * @returns true if viewer can see detailed stats
   */
  canViewDetails: () => boolean;

  /**
   * Check if viewer can see Individual Values (IVs).
   * Phase 1: Always true
   * Phase 2+: Checks showIVs privacy setting
   *
   * @returns true if viewer can see IVs
   */
  canViewIVs: () => boolean;

  /**
   * Check if viewer can see Effort Values (EVs).
   * Phase 1: Always true
   * Phase 2+: Checks showEVs privacy setting
   *
   * @returns true if viewer can see EVs
   */
  canViewEVs: () => boolean;

  /**
   * Check if viewer can see Pokemon nicknames.
   * Phase 1: Always true
   * Phase 2+: Checks showNicknames privacy setting
   *
   * @returns true if viewer can see nicknames
   */
  canViewNicknames: () => boolean;

  /**
   * Check if viewer can see shiny status.
   * Phase 1: Always true
   * Phase 2+: Checks showShinyStatus privacy setting
   *
   * @returns true if viewer can see shiny status
   */
  canViewShinyStatus: () => boolean;

  /**
   * Loading state for privacy settings.
   * Phase 1: Always false
   * Phase 2+: True while fetching from database
   */
  isLoadingPermissions: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * PermissionsProvider wraps the app and provides privacy-aware permission checks.
 *
 * Phase 1 Usage (default):
 * ```tsx
 * <PermissionsProvider>{children}</PermissionsProvider>
 * ```
 * All checks return true (no restrictions).
 *
 * Phase 2+ Usage (with database-backed privacy):
 * ```tsx
 * <PermissionsProvider
 *   privacySettings={fetchedSettings}
 *   isLoading={isLoadingSettings}
 * >
 *   {children}
 * </PermissionsProvider>
 * ```
 * Checks respect user's privacy settings from Supabase.
 */
export interface PermissionsProviderProps {
  children: ReactNode;
  /**
   * Override privacy settings.
   * Default: All true (Phase 1 - no restrictions)
   * Phase 2+: Fetched from Supabase privacy_settings table
   */
  privacySettings?: PrivacySettings;
  /**
   * Loading state for privacy settings.
   * Default: false
   * Phase 2+: True while fetching from database
   */
  isLoading?: boolean;
}

export function PermissionsProvider({
  children,
  privacySettings = DEFAULT_PRIVACY_SETTINGS,
  isLoading = false,
}: PermissionsProviderProps) {
  const { isViewingSelf } = useViewer();

  const value = useMemo<PermissionsContextValue>(() => {
    // Phase 1: Viewing self, all permissions granted
    // Phase 2+: If viewing self, bypass privacy settings
    if (isViewingSelf) {
      return {
        privacySettings: DEFAULT_PRIVACY_SETTINGS,
        canViewContainer: () => true,
        canViewDetails: () => true,
        canViewIVs: () => true,
        canViewEVs: () => true,
        canViewNicknames: () => true,
        canViewShinyStatus: () => true,
        isLoadingPermissions: false,
      };
    }

    // Phase 2+: Viewing someone else, respect their privacy settings
    return {
      privacySettings,
      canViewContainer: (container: ContainerType) => {
        switch (container) {
          case "party":
            return privacySettings.showParty;
          case "daycare":
            return privacySettings.showDaycare;
          case "pc_boxes":
            return privacySettings.showPCBoxes;
          default:
            return false;
        }
      },
      canViewDetails: () => privacySettings.showDetailedStats,
      canViewIVs: () => privacySettings.showIVs,
      canViewEVs: () => privacySettings.showEVs,
      canViewNicknames: () => privacySettings.showNicknames,
      canViewShinyStatus: () => privacySettings.showShinyStatus,
      isLoadingPermissions: isLoading,
    };
  }, [isViewingSelf, privacySettings, isLoading]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

/**
 * Hook to access permission checks.
 *
 * Phase 1 Example:
 * ```tsx
 * const { canViewIVs, canViewContainer } = usePermissions()
 * if (canViewIVs()) {
 *   // Show IVs (always true in Phase 1)
 * }
 * ```
 *
 * Phase 2+ Example (viewing friend):
 * ```tsx
 * const { canViewContainer, canViewDetails, isLoadingPermissions } = usePermissions()
 * if (isLoadingPermissions) return <Skeleton />
 * if (!canViewContainer('party')) return <AccessDenied />
 * if (canViewDetails()) {
 *   // Show IVs/EVs only if friend allows
 * }
 * ```
 *
 * @throws {Error} If used outside PermissionsProvider
 */
export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
