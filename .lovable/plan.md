

## Plan: Fix Auth Page Text Readability + Clear Data

### 1. Clear Leads Data
Leads table is already empty (0 records). No action needed here.

### 2. Fix Text Color on Sign Up and Login Pages

**Problem:** Links like "Log in" and "Sign up" use `text-primary` which is bright yellow — nearly invisible on a white card background.

**Solution:** Replace `text-primary` with `text-foreground` (black) and keep the underline for link affordance. This applies to:

- **SignUpPage.tsx** (line 85): "Log in" link — change `text-primary underline` to `text-foreground font-semibold underline`
- **LoginPage.tsx** (line 66): "Forgot password?" link — same change
- **LoginPage.tsx** (line 69): "Sign up" link — same change

This ensures all clickable text on auth pages has strong contrast (black on white) while remaining visually distinct via underline and bold weight, consistent with the brand's accessibility guidelines.

### Technical Details

**Files to modify:**
- `src/pages/SignUpPage.tsx` — line 85: update link class
- `src/pages/LoginPage.tsx` — lines 66, 69: update link classes

**Class change:** `text-primary underline` becomes `text-foreground font-semibold underline`

