import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { POKEMON_THEME } from "@/lib/constants/pokemon-theme";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Helper to get inline styles from POKEMON_THEME constants.
 * Used because Tailwind JIT requires static class names.
 */
function getTypeStyles(type: keyof typeof POKEMON_THEME.types) {
  const theme = POKEMON_THEME.types[type];
  return {
    backgroundColor: theme.bg,
    color: theme.text === "white" ? "white" : "rgb(31 41 55)", // gray-800
    borderColor: theme.border,
  };
}

function getStatusStyles(status: keyof typeof POKEMON_THEME.statuses) {
  const theme = POKEMON_THEME.statuses[status];
  return {
    backgroundColor: theme.bg,
    color: theme.text === "white" ? "white" : "rgb(31 41 55)", // gray-800
    borderColor: theme.border,
  };
}

/**
 * Badge variants using CVA for type-safe styling.
 * Consolidates TypeBadge, NatureBadge, and future badge types.
 * NOTE: Pokemon type/status colors use inline styles from POKEMON_THEME
 * because Tailwind JIT requires static class names.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-bold border uppercase tracking-wide shadow-sm gap-1",
  {
    variants: {
      variant: {
        // Pokemon Type Badges (will use inline styles from POKEMON_THEME)
        normal: "",
        fire: "",
        water: "",
        electric: "",
        grass: "",
        ice: "",
        fighting: "",
        poison: "",
        ground: "",
        flying: "",
        psychic: "",
        bug: "",
        rock: "",
        ghost: "",
        dragon: "",
        dark: "",
        steel: "",
        fairy: "",

        // Nature Stat Modifiers
        "atk-boost": "bg-red-100 text-red-700 border-red-200",
        "def-boost": "bg-orange-100 text-orange-700 border-orange-200",
        "spa-boost": "bg-blue-100 text-blue-700 border-blue-200",
        "spd-boost": "bg-purple-100 text-purple-700 border-purple-200",
        "spe-boost": "bg-pink-100 text-pink-700 border-pink-200",
        "neutral-nature": "bg-slate-100 text-slate-700 border-slate-200",

        // Status Effects (will use inline styles from POKEMON_THEME)
        burned: "",
        poisoned: "",
        paralyzed: "",
        asleep: "",
        frozen: "",
        healthy: "",

        // Generic Variants
        default: "bg-gray-400 text-white border-gray-600",
        info: "bg-blue-100 text-blue-700 border-blue-200",
        success: "bg-green-100 text-green-700 border-green-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        error: "bg-red-100 text-red-700 border-red-200",
      },
      size: {
        xs: "text-[8px] w-[60px] h-[18px]",
        sm: "text-[9px] w-[68px] h-[20px]",
        md: "text-[10px] w-[76px] h-[22px]",
        lg: "text-xs w-[84px] h-[24px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  /**
   * Badge content (text or custom ReactNode).
   */
  children: ReactNode;

  /**
   * Optional className for additional styling.
   */
  className?: string;

  /**
   * Optional icon to display before the text.
   * Phase 1: Used for type icons
   * Phase 2+: Could be used for trainer avatars, status icons, etc.
   */
  icon?: ReactNode;

  /**
   * Owner information for Phase 2+ tooltips.
   * Phase 1: Unused (undefined)
   * Phase 2+: Displays "Owned by {owner.displayName}" on hover
   */
  owner?: {
    userId: string;
    displayName: string;
  };

  /**
   * Optional tooltip content (overrides owner tooltip).
   * Useful for custom tooltips in Phase 1 (e.g., "This Pokemon is shiny!")
   */
  tooltip?: string;
}

/**
 * Unified Badge component using CVA for variants.
 * Replaces TypeBadge, NatureBadge with single flexible component.
 *
 * Phase 1 Usage:
 * ```tsx
 * // Type badge
 * <Badge variant="fire" size="sm">Fire</Badge>
 *
 * // Nature badge
 * <Badge variant="atk-boost" size="sm">Adamant</Badge>
 *
 * // Status badge
 * <Badge variant="burned" size="xs">BRN</Badge>
 *
 * // Generic badge
 * <Badge variant="success">Active</Badge>
 * ```
 *
 * Phase 2+ Usage (with owner tooltip):
 * ```tsx
 * <Badge
 *   variant="fire"
 *   owner={{ userId: 'user123', displayName: 'Red' }}
 * >
 *   Fire
 * </Badge>
 * // Hovering shows: "Owned by Red"
 * ```
 */
export function Badge({ children, className, variant, size, icon, owner, tooltip }: BadgeProps) {
  // Determine if we need inline styles from POKEMON_THEME
  const isPokemonType = variant && variant in POKEMON_THEME.types;
  const isStatus = variant && variant in POKEMON_THEME.statuses;

  const inlineStyles = isPokemonType
    ? getTypeStyles(variant as keyof typeof POKEMON_THEME.types)
    : isStatus
      ? getStatusStyles(variant as keyof typeof POKEMON_THEME.statuses)
      : undefined;

  const badge = (
    <span className={cn(badgeVariants({ variant, size }), className)} style={inlineStyles}>
      {icon}
      {children}
    </span>
  );

  // If owner or tooltip provided, wrap in Tooltip
  if (owner || tooltip) {
    const tooltipText = tooltip ?? (owner ? `Owned by ${owner.displayName}` : undefined);

    if (!tooltipText) return badge;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

/**
 * Helper component for Type badges with icon support.
 * Maintains compatibility with existing TypeBadge usage.
 *
 * @example
 * ```tsx
 * <TypeBadge type="fire" size="sm" />
 * // Renders: [fire-icon] FIRE
 * ```
 */
export interface TypeBadgeProps {
  type: string | null | undefined;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  owner?: BadgeProps["owner"];
}

export function TypeBadge({ type, className, size = "md", owner }: TypeBadgeProps) {
  if (!type) return null;

  const normalizedType = type.toLowerCase();
  const iconSize = size === "xs" ? 8 : size === "sm" ? 10 : size === "lg" ? 16 : 14;

  return (
    <Badge
      variant={normalizedType as BadgeProps["variant"]}
      size={size}
      className={className}
      owner={owner}
      icon={
        <Image
          src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalizedType}.svg`}
          alt={normalizedType}
          width={iconSize}
          height={iconSize}
          className="inline-block"
        />
      }>
      {normalizedType}
    </Badge>
  );
}

/**
 * Helper component for Nature badges with stat boost indicators.
 * Maintains compatibility with existing NatureBadge usage.
 *
 * @example
 * ```tsx
 * <NatureBadge nature="adamant" size="sm" />
 * // Renders: ADAMANT (+Atk -SpA)
 * ```
 */
import { NATURE_MULTIPLIERS } from "@/lib/pokemon/enrichment";
import type { Nature } from "@/types/pokemon";

export interface NatureBadgeProps {
  nature: Nature | null | undefined;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  owner?: BadgeProps["owner"];
}

export function NatureBadge({ nature, className, size = "sm", owner }: NatureBadgeProps) {
  if (!nature) return null;

  const mods = NATURE_MULTIPLIERS[nature];
  let variant: BadgeProps["variant"] = "neutral-nature";

  if (mods) {
    // Find the boosted stat
    const boosted = Object.entries(mods).find(([, v]) => v > 1)?.[0];
    if (boosted === "atk") variant = "atk-boost";
    else if (boosted === "def") variant = "def-boost";
    else if (boosted === "spa") variant = "spa-boost";
    else if (boosted === "spd") variant = "spd-boost";
    else if (boosted === "spe") variant = "spe-boost";
  }

  return (
    <Badge variant={variant} size={size} className={className} owner={owner}>
      {nature}
    </Badge>
  );
}
