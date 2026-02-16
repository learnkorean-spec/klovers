

## Fix: Hero Video Loading Speed

The hero video isn't loading fast on mobile because the full MP4 file must download before playback begins. The fix involves two strategies:

### 1. Show a fallback image instantly while the video loads
Use the existing `hero-korean.jpg` as a poster/background so users see content immediately instead of a blank dark overlay.

### 2. Lazy-load the video for faster initial paint
Defer video loading so it doesn't block the page render. Switch `preload` to `"none"` and only start loading after the component mounts.

### Technical Changes (single file)

**`src/components/HeroSection.tsx`**:
- Add `poster` attribute pointing to the hero image so the background is visible instantly
- Set `preload="none"` to prevent blocking page load
- Use a `ref` and `useEffect` to trigger `video.load()` and `video.play()` after mount
- Add CSS `object-cover` on the poster image as well for consistent appearance
- Keep `muted`, `playsInline`, `loop` for autoplay compliance

This ensures the hero section looks complete on first paint (with the image), and the video replaces it seamlessly once loaded.

