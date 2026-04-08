// Unsplash image fetcher for reel cover backgrounds
// Uses Unsplash Source (free, no API key needed)

const KOREA_QUERIES: Record<string, string[]> = {
  tip:            ["korean hangul calligraphy", "seoul street night", "korean classroom study"],
  culture:        ["korean temple palace", "seoul cityscape", "korean food bibimbap", "kpop stage"],
  testimonial:    ["happy students celebration", "korean graduation", "group study smiling"],
  countdown:      ["alarm clock urgency", "calendar deadline", "running clock"],
  faq:            ["question thinking", "korean study books", "student laptop"],
  empty_slots:    ["empty classroom seats", "registration desk", "open door welcome"],
  discount:       ["sale discount tag", "gift box celebration", "shopping deal"],
  referral:       ["friends together happy", "handshake partnership", "group selfie"],
  invite_student: ["welcome greeting", "waving hello", "invitation letter"],
};

/**
 * Get an Unsplash image URL for a given post type.
 * Uses Unsplash Source which returns a random matching image — no API key needed.
 */
export function getUnsplashUrl(postType: string, w = 1080, h = 1920): string {
  const queries = KOREA_QUERIES[postType] || ["korea seoul"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`;
}

/**
 * Load an Unsplash image as an HTMLImageElement.
 * Returns null if loading fails (network error, CORS, etc.)
 */
export function loadUnsplashImage(postType: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Timeout after 8 seconds
    setTimeout(() => resolve(null), 8000);
    img.src = getUnsplashUrl(postType);
  });
}

/**
 * Load multiple Unsplash images in parallel (for batch reel generation).
 */
export async function loadUnsplashBatch(postTypes: string[]): Promise<(HTMLImageElement | null)[]> {
  return Promise.all(postTypes.map(loadUnsplashImage));
}
