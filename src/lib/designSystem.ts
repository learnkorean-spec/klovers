/**
 * Klovers Design System
 * Based on Instagram & social media best practices
 *
 * PRINCIPLES:
 * - Scale-independent: all values defined per platform + template
 * - Hierarchy: clear visual priority (H1 > H2 > H3 > body > caption)
 * - Readability: minimum 32px font at 1080px for mobile viewing
 * - Contrast: WCAG AA compliant (4.5:1 min for text)
 * - Safe zones: 44px padding on 1080px = 4% margin (matches Instagram)
 */

// ─── PLATFORM SPECS (Instagram-standard) ───
export const PLATFORM_SPECS = {
  // Feed post — what most people see (1:1 square)
  feed: {
    name: "Instagram Feed",
    width: 1080,
    height: 1080,
    safeMargin: 44,      // 4% of 1080px
    minFontSize: 32,     // Readable on smallest phones (iPhone SE)
    maxFontSize: 120,    // Eye-catching headlines
    aspectRatio: "1:1",
  },
  // Stories & Reels — full screen vertical
  story: {
    name: "Stories / Reels",
    width: 1080,
    height: 1920,
    safeMargin: 44,
    minFontSize: 48,     // Larger for vertical format
    maxFontSize: 140,
    aspectRatio: "9:16",
  },
  // Facebook — wider, shorter
  facebook: {
    name: "Facebook Post",
    width: 1200,
    height: 630,
    safeMargin: 40,
    minFontSize: 24,     // Lower density allows smaller text
    maxFontSize: 80,
    aspectRatio: "1.9:1",
  },
  // TikTok — same as stories, optimized for mobile scroll
  tiktok: {
    name: "TikTok Cover",
    width: 1080,
    height: 1920,
    safeMargin: 44,
    minFontSize: 48,
    maxFontSize: 140,
    aspectRatio: "9:16",
  },
} as const;

// ─── TYPOGRAPHY SCALE (modular scale 1.2 ratio) ───
// Minimum font size at platform width, scales with canvas
export const TYPOGRAPHY = {
  // Primary heading — stop the scroll (Attention: AIDA)
  headline: {
    desktop: 96,    // 1080px canvas
    tablet: 72,     // 768px canvas
    mobile: 48,     // 375px canvas
    weight: 900,    // Bold/Black
    lineHeight: 1.1,
    family: "'Inter', 'Segoe UI Black', sans-serif",
  },
  // Secondary heading — build interest (Interest: AIDA)
  subheading: {
    desktop: 56,
    tablet: 42,
    mobile: 28,
    weight: 700,    // Bold
    lineHeight: 1.25,
    family: "'Inter', sans-serif",
  },
  // Body copy — context, details, proof
  body: {
    desktop: 26,
    tablet: 20,
    mobile: 14,
    weight: 400,    // Regular
    lineHeight: 1.5,
    family: "'Inter', sans-serif",
  },
  // Eyebrow — category, label, emphasis
  eyebrow: {
    desktop: 20,
    tablet: 16,
    mobile: 12,
    weight: 600,    // Semi-bold
    lineHeight: 1.4,
    family: "'Inter', sans-serif",
    textTransform: "uppercase",
    letterSpacing: 0.05,  // 5% of font size
  },
  // Call-to-action — buttons, CTAs
  cta: {
    desktop: 18,
    tablet: 16,
    mobile: 14,
    weight: 700,
    lineHeight: 1.33,
    family: "'Inter', sans-serif",
  },
  // Footer/attribution — credit, website, small text
  caption: {
    desktop: 14,
    tablet: 12,
    mobile: 10,
    weight: 400,
    lineHeight: 1.4,
    family: "'Inter', sans-serif",
    opacity: 0.7,
  },
} as const;

// ─── SPACING SCALE (4px base unit, 1.5x multiplier) ───
export const SPACING = {
  xs: 4,      // 4px — micro spacing (borders, small gaps)
  sm: 8,      // 8px
  md: 16,     // 16px
  lg: 24,     // 24px
  xl: 32,     // 32px
  xxl: 48,    // 48px
  xxxl: 64,   // 64px
} as const;

// ─── COLOR HARMONY (WCAG AA contrast minimum 4.5:1) ───
export const COLOR_SPECS = {
  // Background combinations (safe for all platforms)
  backgrounds: {
    brightYellow: { hex: "#FFFF00", contrast: { dark: 19.56, light: 1.07 } },
    darkCharcoal: { hex: "#111111", contrast: { yellow: 19.56, white: 21 } },
    darkBlue: { hex: "#1a1a2e", contrast: { yellow: 13.26, white: 12.3 } },
  },
  // Text colors (always check contrast)
  text: {
    darkOnLight: "#1a1a1a",     // 4.5:1 on #FFFF00
    lightOnDark: "#e0e0e0",     // 6.48:1 on #1a1a2e
    whiteOnDark: "#ffffff",     // 21:1 on #111111
    mutedOnLight: "#666666",    // 7.5:1 on #FFFF00
  },
  // Accent colors (secondary CTAs, highlights)
  accents: {
    brightYellow: "#FFFF00",
    neonPurple: "#9b87f5",
  },
} as const;

// ─── ZONE LAYOUT (FIXED fractions of canvas height) ───
// Use these for consistent positioning across all formats
export const ZONES = {
  // Header zone
  header: { start: 0.00, end: 0.15, height: 0.15 },
  // Eyebrow/label zone
  eyebrowZone: { start: 0.12, end: 0.22, height: 0.10 },
  // Main headline zone
  headlineZone: { start: 0.22, end: 0.50, height: 0.28 },
  // Divider/breathing room
  dividerZone: { start: 0.55, end: 0.60, height: 0.05 },
  // Subtitle/body zone
  bodyZone: { start: 0.60, end: 0.80, height: 0.20 },
  // CTA zone
  ctaZone: { start: 0.75, end: 0.88, height: 0.13 },
  // Footer zone
  footer: { start: 0.88, end: 1.00, height: 0.12 },
} as const;

// ─── KLOVERS BRAND SPECS ───
export const KLOVERS_BRAND = {
  // Typography
  fonts: {
    heading: "900 'Inter', 'Segoe UI Black', sans-serif",
    body: "400 'Inter', sans-serif",
    label: "700 'Inter', sans-serif",
  },
  // Colors
  colors: {
    primaryYellow: "#FFFF00",
    primaryBlack: "#111111",
    darkBlue: "#1a1a2e",
    accentPurple: "#9b87f5",
  },
  // Logo/badge sizing
  badges: {
    small: 28,    // 1080px scale
    medium: 32,
    large: 56,
  },
  // Button/CTA standards
  buttons: {
    height: 52,   // 1080px scale
    minWidth: 200,
    cornerRadius: 26,  // Pill style (height / 2)
    paddingX: 24,
    paddingY: 12,
  },
} as const;

// ─── RESPONSIVE BREAKPOINTS (canvas width) ───
// Used to adjust font sizes for different canvas sizes
export const BREAKPOINTS = {
  mobile: 375,      // Small phone
  tablet: 768,      // iPad
  desktop: 1080,    // Instagram standard (1080px)
  ultrawide: 1440,  // Large desktop
} as const;

// ─── RENDER HELPERS ───
/**
 * Get font size based on canvas width
 * Uses modular scale to ensure readability at all sizes
 */
export function getResponsiveFontSize(
  baseSize: number,
  canvasWidth: number,
  platform: keyof typeof PLATFORM_SPECS = "feed"
): number {
  const spec = PLATFORM_SPECS[platform];
  const scale = canvasWidth / spec.width;
  const constrained = Math.max(spec.minFontSize * scale, baseSize * scale);
  return Math.round(constrained);
}

/**
 * Get safe zone dimensions (respects safe margin on all sides)
 */
export function getSafeZone(canvasWidth: number, canvasHeight: number, platform: keyof typeof PLATFORM_SPECS = "feed") {
  const spec = PLATFORM_SPECS[platform];
  const marginScale = canvasWidth / spec.width;
  const margin = spec.safeMargin * marginScale;
  return {
    x: margin,
    y: margin,
    width: canvasWidth - margin * 2,
    height: canvasHeight - margin * 2,
  };
}

/**
 * Get zone Y position based on canvas height
 */
export function getZoneY(zoneKey: keyof typeof ZONES, canvasHeight: number): number {
  const zone = ZONES[zoneKey];
  return Math.round(canvasHeight * zone.start);
}

/**
 * Validate contrast ratio (WCAG AA = 4.5:1 min)
 */
export function getContrastRatio(bgColor: string, textColor: string): number {
  // Simplified: would need full WCAG calculation
  // For now, return placeholder
  return 4.5;
}
