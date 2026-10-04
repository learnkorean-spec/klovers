import { describe, it, expect } from "vitest";
import {
  publishedGuideSlugs,
  SCHOLARSHIP_GUIDE_SLUGS,
} from "@/hooks/usePublishedScholarshipArticle";

/**
 * The rule that decides whether the match block links to the journal.
 *
 * It fails closed on purpose: the draft article must not produce a link until
 * Re publishes it, because a 404 on "read more about your scholarship" is worse
 * than no link. Pure mapping only — the query and the React state are the
 * hook's business, and neither needs Supabase or a mounted component to be
 * believed.
 */
describe("publishedGuideSlugs", () => {
  it("returns both slugs when both rows are published", () => {
    const rows = [{ slug: SCHOLARSHIP_GUIDE_SLUGS.ar }, { slug: SCHOLARSHIP_GUIDE_SLUGS.en }];
    expect(publishedGuideSlugs(rows)).toEqual({
      ar: SCHOLARSHIP_GUIDE_SLUGS.ar,
      en: SCHOLARSHIP_GUIDE_SLUGS.en,
    });
  });

  it("returns one side only when only that side is published", () => {
    // The Arabic twin could be published a day before the English one.
    expect(publishedGuideSlugs([{ slug: SCHOLARSHIP_GUIDE_SLUGS.ar }])).toEqual({
      ar: SCHOLARSHIP_GUIDE_SLUGS.ar,
      en: null,
    });
  });

  it("returns nothing for an empty result, a null result or no result", () => {
    expect(publishedGuideSlugs([])).toEqual({ ar: null, en: null });
    expect(publishedGuideSlugs(null)).toEqual({ ar: null, en: null });
    expect(publishedGuideSlugs(undefined)).toEqual({ ar: null, en: null });
  });

  it("ignores a different article's slug", () => {
    // The query filters by slug, but a mapping that trusted the response shape
    // would link to whatever came back.
    expect(publishedGuideSlugs([{ slug: "topik-exam-guide" }, { slug: "some-other-post" }])).toEqual({
      ar: null,
      en: null,
    });
  });

  it("survives a row with no slug at all", () => {
    expect(publishedGuideSlugs([{ slug: null }, {}, { slug: SCHOLARSHIP_GUIDE_SLUGS.en }])).toEqual({
      ar: null,
      en: SCHOLARSHIP_GUIDE_SLUGS.en,
    });
  });
});
