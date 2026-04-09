/**
 * Klovers Design Palette — Single source of truth for all colors.
 *
 * Brand: #FFFF00 (yellow) + #111111 (black)
 * Gamification uses PASTEL tones only.
 * Semantic colors for system messages.
 */

// ── Pastel Gamification Palette ──
export const PASTEL = {
  green:    "#CFF7D3",
  blue:     "#D6E8FF",
  purple:   "#E8D9FF",
  pink:     "#FFD9E6",
  orange:   "#FFE5CC",
  cyan:     "#D7F7F7",
  lavender: "#EFE6FF",
  mint:     "#DFFFE6",
} as const;

/** Ordered array for cycling through worlds / game cards */
export const PASTEL_CYCLE = [
  PASTEL.green,
  PASTEL.blue,
  PASTEL.purple,
  PASTEL.orange,
  PASTEL.pink,
  PASTEL.cyan,
  PASTEL.lavender,
  PASTEL.mint,
] as const;

// ── Semantic Colors ──
export const SEMANTIC = {
  success: "#10B981",
  warning: "#F59E0B",
  error:   "#EF4444",
  info:    "#3B82F6",
} as const;

// ── Brand Colors ──
export const BRAND = {
  primaryYellow: "#FFFF00",
  primaryBlack:  "#111111",
  hoverYellow:   "#E6E600",
} as const;

// ── Neutral Scale ──
export const NEUTRAL = {
  white:       "#FFFFFF",
  lightBg:     "#F5F5F5",
  border:      "#DDDDDD",
  secondaryTx: "#555555",
  primaryTx:   "#111111",
} as const;
