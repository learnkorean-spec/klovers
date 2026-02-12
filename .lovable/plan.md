

## Fix: Bright Yellow Text Readability

The problem is that price text and step indicators use `text-primary`, which maps to pure bright yellow (`hsl(60, 100%, 50%)`) -- nearly invisible on white backgrounds.

### Changes

**File: `src/pages/EnrollNowPage.tsx`**

Replace all instances of `text-primary` used for readable text with `text-foreground` or a darker alternative:

1. **Duration price labels** (line 232): Change `text-primary` to `text-foreground` so prices like "$25", "$70", "$130" display in black instead of bright yellow.

2. **Step indicator text** (lines 109, 114): Change `text-primary` to `text-foreground` so "Choose Plan" and "Pay & Enroll" labels are readable.

3. **Keep `bg-primary`** on buttons and step circles untouched -- yellow works fine as a background with black foreground text.

### Technical Details

- Line 109: `text-primary` -> `text-foreground`
- Line 114: `text-primary` -> `text-foreground`  
- Line 232: `text-primary` -> `text-foreground font-bold`

No other files need changes. The core design system colors remain intact -- this only fixes text contrast in the enrollment page.

