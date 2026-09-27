/**
 * arabicRoutes.ts - Arabic URL twins in the browser (GEO-03, 27 Sep 2026).
 *
 * "/" <-> "/ar" was the only pair (24 Sep). Six marketing pages now have one
 * too: "/pricing" <-> "/ar/pricing" and so on. The list is shared with the
 * build (scripts/lib/arabic-page-meta.mjs) so the static HTML, the sitemap and
 * the running app always agree on which URLs are Arabic.
 *
 * Rules the app follows:
 *   - an Arabic URL always shows Arabic (it is what the search result promised);
 *   - switching language on a paired page moves to the twin URL;
 *   - someone reading in Arabic who follows a link to a paired English URL is
 *     taken to its Arabic twin instead.
 */
import { ARABIC_PAGE_META, arabicTwinOf as twinOfPage } from "../../scripts/lib/arabic-page-meta.mjs";

export const BASE_URL = "https://kloversegy.com";

/** "/" -> "/ar", "/pricing" -> "/ar/pricing"; null when there is no twin. */
export const arabicTwinOf = (path: string): string | null =>
  path === "/" ? "/ar" : twinOfPage(path);

/** "/ar" -> "/", "/ar/pricing" -> "/pricing"; null when not an Arabic twin. */
export const englishTwinOf = (path: string): string | null => {
  if (path === "/ar") return "/";
  if (!path.startsWith("/ar/")) return null;
  const en = path.slice(3);
  return twinOfPage(en) ? en : null;
};

export const isArabicUrl = (path: string): boolean => englishTwinOf(path) !== null;

/** Arabic <title> and description for an Arabic twin URL (not the homepage). */
export const arabicMetaFor = (path: string) => {
  const en = englishTwinOf(path);
  return en ? ARABIC_PAGE_META.find((p) => p.path === en) ?? null : null;
};
