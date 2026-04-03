# Klovers Design System

A comprehensive design system for social media posts, based on Instagram and modern web best practices.

## Table of Contents
- [Platform Specifications](#platform-specifications)
- [Typography Hierarchy](#typography-hierarchy)
- [Spacing & Layout](#spacing--layout)
- [Colors & Contrast](#colors--contrast)
- [Components](#components)
- [Implementation Guide](#implementation-guide)

---

## Platform Specifications

All designs are optimized for mobile-first viewing. These specs match Instagram's native formats.

### Instagram Feed (1:1 Square)
- **Dimensions**: 1080×1080px
- **Safe Margin**: 44px (4% padding all sides)
- **Headline Size**: 96px–120px
- **Body Size**: 26px–32px
- **Min Text Size**: 32px (readable on iPhone SE)
- **Use Case**: Main feed posts, carousel posts

### Stories / Reels (9:16 Vertical)
- **Dimensions**: 1080×1920px
- **Safe Margin**: 44px
- **Headline Size**: 120px–140px (larger for vertical)
- **Body Size**: 32px–48px
- **Min Text Size**: 48px (full-screen mobile viewing)
- **Use Case**: Stories, Reels, TikTok covers

### Facebook Post (1.9:1 Wide)
- **Dimensions**: 1200×630px
- **Safe Margin**: 40px
- **Headline Size**: 64px–80px
- **Body Size**: 20px–24px
- **Min Text Size**: 24px
- **Use Case**: Facebook feed, LinkedIn posts

---

## Typography Hierarchy

### H1 — Headline (Attention: AIDA)
- **Purpose**: Stop the scroll. Maximum visual impact.
- **Sizes**: 96px (desktop) → 72px (tablet) → 48px (mobile)
- **Weight**: 900 (Black)
- **Line Height**: 1.1 (tight, for impact)
- **Family**: `'Inter', 'Segoe UI Black', sans-serif`
- **Max Lines**: 2 (on Instagram feed)
- **Example**: "Last Seats — Don't Miss Out"

### H2 — Subheading (Interest: AIDA)
- **Purpose**: Build credibility, answer "what's in it for me?"
- **Sizes**: 56px → 42px → 28px
- **Weight**: 700 (Bold)
- **Line Height**: 1.25
- **Family**: `'Inter', sans-serif`
- **Max Lines**: 2
- **Example**: "Can I learn Korean online?"

### Body — Supporting Copy (Desire: AIDA)
- **Purpose**: Context, details, proof, testimonials
- **Sizes**: 26px → 20px → 14px
- **Weight**: 400 (Regular)
- **Line Height**: 1.5 (readability)
- **Family**: `'Inter', sans-serif`
- **Max Lines**: 3
- **Example**: "✅ Small group · Certified teacher · Real results from week 1"

### Eyebrow — Label & Category (Emphasis)
- **Purpose**: Set context, grab attention with micro copy
- **Sizes**: 20px → 16px → 12px
- **Weight**: 600 (Semi-bold)
- **Line Height**: 1.4
- **Family**: `'Inter', sans-serif`
- **Transform**: UPPERCASE
- **Letter Spacing**: 5% (0.05em)
- **Example**: "KOREAN COURSE"

### CTA — Call-to-Action (Action: AIDA)
- **Purpose**: Drive registration, clear next step
- **Sizes**: 18px → 16px → 14px
- **Weight**: 700 (Bold)
- **Line Height**: 1.33
- **Family**: `'Inter', sans-serif`
- **Example**: "Register Now →"

### Caption — Footer & Attribution
- **Purpose**: Credit, website, legal, small text
- **Sizes**: 14px → 12px → 10px
- **Weight**: 400 (Regular)
- **Line Height**: 1.4
- **Opacity**: 70% (reduced emphasis)
- **Family**: `'Inter', sans-serif`
- **Example**: "kloversegy.com"

---

## Spacing & Layout

### Spacing Scale (4px base unit)
```
xs:   4px   (micro spacing)
sm:   8px
md:  16px   (standard)
lg:  24px
xl:  32px
xxl: 48px
xxxl: 64px  (large sections)
```

### Safe Zones (Fixed Height Fractions)
All elements positioned using canvas **height percentages** for scale independence:

```
0%   ┌─────────────────────────┐
     │ Header (0–15%)          │  Black bar, academy name
15%  ├─────────────────────────┤
     │ Eyebrow (12–22%)        │  "KOREAN COURSE"
22%  ├─────────────────────────┤
     │ Headline (22–50%)       │  Main text, 2 lines max
50%  ├─────────────────────────┤
     │ Divider (55–60%)        │  Visual break
60%  ├─────────────────────────┤
     │ Body (60–80%)           │  Subtitle, 3 lines max
80%  ├─────────────────────────┤
     │ CTA (75–88%)            │  Button, call-to-action
88%  ├─────────────────────────┤
     │ Footer (88–100%)        │  Website, hashtags
100% └─────────────────────────┘
```

### Padding
- **Default**: 44px (4% of 1080px)
- **Mobile**: 32px (3%)
- **Between elements**: 16px–24px

---

## Colors & Contrast

### Background Combinations
| Background | Text Color | Contrast | WCAG |
|---|---|---|---|
| #FFFF00 (Yellow) | #1a1a1a (Dark) | 19.56:1 | AAA ✓ |
| #111111 (Black) | #ffffff (White) | 21:1 | AAA ✓ |
| #1a1a2e (Dark Blue) | #e0e0e0 (Light Gray) | 6.48:1 | AA ✓ |

### Primary Colors
- **Klovers Yellow**: `#FFFF00` — Primary CTA, highlights, energy
- **Klovers Black**: `#111111` — Text, backgrounds, contrast
- **Midnight Blue**: `#1a1a2e` — Dark backgrounds, depth
- **Accent Purple**: `#9b87f5` — Secondary highlights, borders

### Text Colors
- **Dark on Light**: `#1a1a1a` (4.5:1 on yellow)
- **Light on Dark**: `#e0e0e0` (6.48:1 on dark blue)
- **White on Dark**: `#ffffff` (21:1 on black)
- **Muted**: `#666666` (7.5:1 on yellow)

**Rule**: Always maintain **minimum 4.5:1 contrast ratio** (WCAG AA standard).

---

## Components

### Buttons / CTAs
- **Height**: 52px (1080px scale)
- **Min Width**: 200px
- **Corner Radius**: 26px (pill style)
- **Padding**: 24px horizontal, 12px vertical
- **Font**: Bold, 18px
- **Background**: Klovers Yellow (`#FFFF00`)
- **Text**: Black (`#111111`)

### Badges / Avatars
- **Small**: 28px (circles, micro)
- **Medium**: 32px (standard)
- **Large**: 56px (hero elements)
- **Background**: Klovers Black (`#111111`)
- **Content**: Klovers Yellow (`#FFFF00`)

### Dividers / Rules
- **Height**: 2–3px
- **Width**: 40–44px (accent lines) or full width
- **Color**: Klovers Yellow or Black
- **Position**: Below headline, above body

---

## Implementation Guide

### Step 1: Choose Format
```typescript
const format: FormatKey = "instagram";  // or "story", "facebook", "tiktok"
```

### Step 2: Define Content
```typescript
const post: PostData = {
  id: "post-1",
  mainText: "Last Seats — Don't Miss Out",      // H1
  subtitle: "April classes filling fast — limited spots per group",  // Body
  extraText: "#LimitedSeats #Enroll #Klovers",  // Footer
};
```

### Step 3: Get Responsive Sizes
```typescript
import { getResponsiveFontSize, getSafeZone, getZoneY } from "@/lib/designSystem";

const canvasWidth = 1080;
const canvasHeight = 1080;

const headlineSize = getResponsiveFontSize(96, canvasWidth, "feed");
const safeZone = getSafeZone(canvasWidth, canvasHeight, "feed");
const headlineY = getZoneY("headlineZone", canvasHeight);
```

### Step 4: Render Using Zones
```typescript
// Headline at fixed zone
ctx.font = `900 ${headlineSize}px 'Inter', sans-serif`;
ctx.fillText(post.mainText, safeZone.x, headlineY);

// Subtitle at body zone
const bodyY = getZoneY("bodyZone", canvasHeight);
ctx.font = `400 26px 'Inter', sans-serif`;
ctx.fillText(post.subtitle, safeZone.x, bodyY);
```

### Step 5: Validate Contrast
Always check text contrast against background:
```typescript
// Minimum 4.5:1 for WCAG AA compliance
getContrastRatio("#FFFF00", "#1a1a1a");  // 19.56:1 ✓
```

---

## Template-Specific Overrides

### Bold Template (Attention)
- Yellow background maximum
- Black header + footer bars
- Headline: 96px, no overflow into zones
- K badge: 56px diameter
- CTA pill: 52px tall, 220px wide

### Varsity Template (Interest)
- Dark blue background with subtle glow
- Yellow left accent bar: 5px wide
- Headline: 76px (slightly smaller than Bold)
- No ring/badge
- Yellow strip footer with CTA

### Split Template (Action)
- Diagonal split (43% yellow, 57% black)
- Right side: clear CTA focus
- Headline: 52px (tight, directional)
- K badge: 30px diameter
- CTA pill: 50px tall

---

## Best Practices

### Text
✅ **Do:**
- Keep headlines to 2 lines maximum
- Use strong contrast (4.5:1 minimum)
- Center-align for impact, left-align for readability
- Use uppercase for labels only

❌ **Don't:**
- Use text smaller than 32px on feed
- Exceed 3 lines for body copy
- Mix fonts (stick to Inter + one accent)
- Use decorative fonts in body text

### Layout
✅ **Do:**
- Use safe zones (44px margin all sides)
- Position key elements in upper 50%
- Use dividers to separate sections
- Keep CTA button above fold on mobile

❌ **Don't:**
- Push text to edges
- Crowd multiple elements
- Use text over busy imagery
- Hide important info in footer

### Color
✅ **Do:**
- Use high contrast (19+:1 for maximum impact)
- Stick to 2–3 primary colors per design
- Use accents sparingly (max 15% of layout)

❌ **Don't:**
- Use text smaller than 32px without high contrast
- Mix too many shades of same color
- Use low-contrast color combos

---

## Files

- `src/lib/designSystem.ts` — Design tokens, helper functions
- `src/lib/canvasRenderer.ts` — Template implementations
- `DESIGN_SYSTEM.md` — This file

---

## Version History

- **v1.0** (Apr 2026) — Initial design system, Instagram + AIDA framework
