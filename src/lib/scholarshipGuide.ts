/**
 * Which scholarships guide is published in the journal — the PURE half.
 *
 * WHY THIS IS A SEPARATE MODULE FROM THE HOOK
 *
 * `src/integrations/supabase/client.ts` throws "supabaseUrl is required" at
 * import time when the env vars are missing, and CI has none: `ci.yml` sets only
 * GH_TOKEN. A test that reaches the client through an import therefore passes on
 * a machine with a `.env` and fails on a clean checkout — which is exactly how
 * two of these tests went red in CI after passing here.
 *
 * So the rule lives here, free of React and Supabase, the same way
 * dashboardProgress.ts keeps the dashboard's read-model free of both. The hook
 * next door owns the query and the React state; this file owns the decision.
 */

/** The guide's two rows: the Arabic twin uses the `-ar` suffix convention. */
export const SCHOLARSHIP_GUIDE_SLUGS = {
  ar: "korean-scholarships-guide-ar",
  en: "korean-scholarships-guide",
} as const;

export interface PublishedGuides {
  ar: string | null;
  en: string | null;
}

export const NO_GUIDES: PublishedGuides = { ar: null, en: null };

/**
 * Which of the two slugs the query actually returned.
 *
 * Fails closed by construction: an empty result, a missing row or a row with no
 * slug all mean "no link". A link to an article that is not there is worse than
 * no link, so anything this function is unsure about becomes null.
 */
export function publishedGuideSlugs(rows: { slug?: string | null }[] | null | undefined): PublishedGuides {
  if (!rows || rows.length === 0) return NO_GUIDES;
  const found = new Set(rows.map((r) => r?.slug).filter((s): s is string => typeof s === "string"));

  return {
    ar: found.has(SCHOLARSHIP_GUIDE_SLUGS.ar) ? SCHOLARSHIP_GUIDE_SLUGS.ar : null,
    en: found.has(SCHOLARSHIP_GUIDE_SLUGS.en) ? SCHOLARSHIP_GUIDE_SLUGS.en : null,
  };
}
