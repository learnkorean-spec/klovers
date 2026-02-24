

# Fix Hero Video Loading Performance

## Problem
The hero video takes too long to load, showing a blank dark area (as seen in the screenshot). The video is bundled as an ES module import through Vite, which prevents streaming and adds to the main bundle. Combined with `preload="none"` and an immediate `video.load()` + `video.play()`, the user sees nothing until the full video downloads.

## Solution
Optimize video loading with instant poster visibility, deferred video streaming, and a smooth fade-in transition.

## Technical Details

### File: `src/components/HeroSection.tsx`

**1. Show poster as CSS background immediately**
- Render the poster image as a background-image on the container div so it's visible on first paint, before the video element even begins loading.

**2. Defer video loading with Intersection Observer**
- Don't call `video.load()` immediately. Instead, use an IntersectionObserver (or a small timeout after first paint) to start loading the video only after the hero section is visible and the page has settled.

**3. Fade in the video**
- Keep the video element hidden (`opacity-0`) until the `canplaythrough` or `playing` event fires, then transition to `opacity-100`. This eliminates the visual "pop" when the video starts.

**4. Change preload to `metadata`**
- Switch from `preload="none"` to `preload="metadata"` so the browser can start fetching video dimensions and a few frames earlier, improving perceived load time.

**5. Move video to `/public` for streaming**
- Move the video file from `src/assets/` to `public/videos/` so it's served as a static file with proper HTTP range request support (enables streaming instead of full download). Reference it via a string path `/videos/hero-korea-video-new.mp4` instead of an ES import.

### Changes Summary
- **Move**: `src/assets/hero-korea-video-new.mp4` → `public/videos/hero-korea-video-new.mp4`
- **Edit**: `src/components/HeroSection.tsx` — remove video import, add background poster, add fade-in logic, defer loading

Note: "Upscaling" the video quality requires a higher-resolution source file. The current optimizations will make the existing video appear sharper by ensuring it loads and renders at full resolution without compression artifacts from bundling.

