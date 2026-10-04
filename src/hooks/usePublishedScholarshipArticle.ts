import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Is the scholarships guide in the journal published yet?
 *
 * WHY THIS EXISTS INSTEAD OF A PLAIN LINK
 *
 * The article ships as a DRAFT (see
 * supabase/migrations/20261004000001_insert_korean_scholarships_article.sql),
 * and Re publishes it when she has read it. A hardcoded link from the match
 * block would therefore be a 404 until that day, and a 404 on "read more about
 * your scholarship" is worse than no link at all.
 *
 * So the link asks. `blog_posts.published` is readable with the anon key, the
 * query names only the two slugs, and the answer decides whether the link
 * exists. The day she publishes the article, every match block on the site
 * grows the link with no code change and no deploy.
 *
 * FAILING CLOSED: a network error, a missing row or a refused read all mean
 * "no link". A link is not worth an error surface, and silence is the correct
 * answer when we cannot prove the page is there.
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

const NONE: PublishedGuides = { ar: null, en: null };

/**
 * Pure: which of the two slugs the query actually returned. Kept separate from
 * the hook so the rule is testable without mounting React or mocking Supabase,
 * the same way useChurnPrevention's derivations are tested.
 */
export function publishedGuideSlugs(rows: { slug?: string | null }[] | null | undefined): PublishedGuides {
  if (!rows || rows.length === 0) return NONE;
  const found = new Set(rows.map((r) => r?.slug).filter((s): s is string => typeof s === "string"));

  return {
    ar: found.has(SCHOLARSHIP_GUIDE_SLUGS.ar) ? SCHOLARSHIP_GUIDE_SLUGS.ar : null,
    en: found.has(SCHOLARSHIP_GUIDE_SLUGS.en) ? SCHOLARSHIP_GUIDE_SLUGS.en : null,
  };
}

/** The published guide slugs, or two nulls until (and unless) they exist. */
export function usePublishedScholarshipArticle(): PublishedGuides {
  const [guides, setGuides] = useState<PublishedGuides>(NONE);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("slug")
          .in("slug", [SCHOLARSHIP_GUIDE_SLUGS.ar, SCHOLARSHIP_GUIDE_SLUGS.en])
          .eq("published", true);

        if (cancelled || error) return;
        setGuides(publishedGuideSlugs(data as { slug?: string | null }[] | null));
      } catch {
        // A refused read or a dropped connection means no link. See the header.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return guides;
}
