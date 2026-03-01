

## Issue: Google Search Shows Lovable Favicon Instead of Klovers Logo

The screenshot shows Google search results displaying a generic/Lovable icon instead of the Klovers logo. This happens because:

1. The current favicon is set as a JPEG (`/klovers-logo.jpg`), but Google strongly prefers **PNG or SVG** favicons with proper sizing (at least 48x48px, ideally multiples of 48).
2. There's no `favicon.ico` with the actual logo -- the existing `public/favicon.ico` is likely the default Lovable one.
3. Missing a proper 32x32 and 16x16 favicon declaration.

## Plan

### 1. Generate proper favicon files from the Klovers logo
- Convert `public/klovers-logo.jpg` to a proper `favicon.png` (32x32) and keep the larger version for apple-touch-icon (180x180).
- Since we can't do image conversion in-browser, we'll reference the existing JPG but also add a proper `type` attribute and ensure the `favicon.ico` in `public/` is replaced.

### 2. Update `index.html` favicon declarations
- Replace the current favicon link with a properly structured set:
  - `<link rel="icon" type="image/jpeg" sizes="any" href="/klovers-logo.jpg">`
  - Add `<link rel="icon" type="image/png" sizes="32x32" href="/klovers-logo.jpg">` 
  - Keep the apple-touch-icon reference
- Remove any reference to the old `favicon.ico` that may be the Lovable default

### 3. Replace `public/favicon.ico` with the Klovers logo
- Copy `public/klovers-logo.jpg` over `public/favicon.ico` so browsers requesting `/favicon.ico` directly get the Klovers logo.

### Important Note
Google caches favicons aggressively. After deploying these changes, it may take **days to weeks** for Google to update the icon in search results. You can request re-indexing via Google Search Console to speed this up.

