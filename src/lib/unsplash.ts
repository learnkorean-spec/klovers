// Unsplash image fetcher for marketing post backgrounds
// Uses Unsplash Source (free, no API key needed)

import type { TemplateName } from "./canvasRenderer";

/** Korean-culture-themed queries mapped to template purpose */
const TEMPLATE_QUERIES: Record<string, string[]> = {
  // Klovers brand templates
  klovers_bold:        ["seoul neon cityscape night", "kpop stage concert lights", "korean street food market neon", "seoul skyline sunset"],
  klovers_varsity:     ["korean calligraphy ink brush", "seoul bookstore aesthetic", "korean classroom students", "hanbok traditional dress"],
  klovers_split:       ["korean drama scene aesthetic", "seoul cafe interior cozy", "korean cherry blossom spring", "bukchon hanok village"],
  klovers_alert:       ["korean language classroom whiteboard", "study desk aesthetic korean", "seoul university campus", "korean students studying"],
  klovers_countdown:   ["seoul tower night lights", "korean countdown celebration", "namsan tower seoul", "korean fireworks festival"],
  klovers_quote:       ["korean temple peaceful", "jeju island landscape", "seoul han river sunset", "korean garden autumn"],
  klovers_tip:         ["hangul korean alphabet writing", "korean textbook study notebook", "korean food bibimbap close up", "korean tea ceremony"],
  klovers_mascot_left: ["kpop fans concert crowd", "korean festival street", "seoul hongdae street art", "korean youth fashion"],
  klovers_mascot_right:["korean palace gyeongbokgung", "korean traditional art", "seoul traditional market", "korean pottery ceramic"],
  klovers_stats:       ["seoul aerial view modern city", "korean technology futuristic", "seoul gangnam district", "korean modern architecture"],
  klovers_list:        ["korean cooking ingredients flat lay", "korean stationery aesthetic", "korean study materials flat lay", "korean skincare products"],

  // Legacy templates
  classic:   ["seoul street vibrant colorful", "korean food market stall", "kpop aesthetic neon", "korean temple autumn leaves"],
  character: ["korean anime illustration aesthetic", "seoul graffiti wall art", "korean manhwa style", "korean illustration art"],
  minimal:   ["korean minimalist interior design", "white ceramic korean pottery", "korean zen garden", "korean architecture modern clean"],
  gradient:  ["seoul sunset gradient sky", "korean cherry blossom pink", "korean ocean jeju blue", "korean autumn forest gradient"],
  neon:      ["seoul neon signs gangnam", "korean cyberpunk city night", "neon karaoke korean", "seoul nightlife neon alley"],
  dark:      ["korean night market lanterns", "seoul city rain night reflection", "korean palace night", "korean cinema dark aesthetic"],
  editorial: ["korean fashion editorial magazine", "korean model portrait studio", "seoul fashion week street style", "korean beauty editorial"],
};

/** Post-type queries (for monthly generator) */
const POST_TYPE_QUERIES: Record<string, string[]> = {
  tip:            ["hangul korean alphabet writing", "korean textbook study notebook", "korean classroom study"],
  culture:        ["korean temple palace", "seoul cityscape", "korean food bibimbap", "kpop stage concert"],
  testimonial:    ["happy students celebration", "korean graduation ceremony", "group study smiling friends"],
  countdown:      ["namsan tower seoul night", "countdown celebration", "korean fireworks"],
  faq:            ["question thinking person", "korean study books stack", "student laptop study"],
  empty_slots:    ["empty classroom seats", "registration desk modern", "open door welcome light"],
  discount:       ["korean gift box celebration", "shopping sale Seoul", "colorful korean market"],
  referral:       ["friends together happy group", "handshake partnership", "group selfie fun"],
  invite_student: ["welcome greeting classroom", "waving hello friendly", "korean class group photo"],
};

/**
 * Get an Unsplash image URL for a given template or post type.
 */
export function getUnsplashUrl(key: string, w = 1080, h = 1080): string {
  const queries = TEMPLATE_QUERIES[key] || POST_TYPE_QUERIES[key] || ["korea seoul"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`;
}

/**
 * Get an Unsplash URL specifically for a template name and format dimensions.
 */
export function getUnsplashUrlForTemplate(template: TemplateName, w = 1080, h = 1080): string {
  return getUnsplashUrl(template, w, h);
}

/**
 * Load an Unsplash image as an HTMLImageElement.
 * Returns null if loading fails (network error, CORS, timeout).
 */
export function loadUnsplashImage(key: string, w = 1080, h = 1080): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 10000);
    img.src = getUnsplashUrl(key, w, h);
  });
}

/**
 * Load an Unsplash image for a specific template.
 */
export function loadUnsplashForTemplate(template: TemplateName, w = 1080, h = 1080): Promise<HTMLImageElement | null> {
  return loadUnsplashImage(template, w, h);
}

/**
 * Load multiple Unsplash images in parallel (for batch generation).
 */
export async function loadUnsplashBatch(keys: string[], w = 1080, h = 1080): Promise<(HTMLImageElement | null)[]> {
  return Promise.all(keys.map((k) => loadUnsplashImage(k, w, h)));
}
