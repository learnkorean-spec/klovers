/**
 * Trust figures — the ONE place the site's social-proof numbers live.
 *
 * Audit, 23 Sep 2026: the same facts were stated differently page to page.
 * Rating 5.0 ("Rated by 200+ students") vs 4.9 vs "5.0 from 7 Google
 * reviews"; students 200+ vs 500+ vs "thousands"; teaching years 12+ vs 13
 * vs 13+. A visitor who reads two pages sees two different academies, and
 * the smaller number wins every time. Import from here instead of typing a
 * number into a component.
 *
 * Standing decisions (Re):
 *  - 200+ is the students Re has taught HERSELF, across 13+ years of teaching
 *    (since 2013). It is not platform accounts, and it must never be phrased
 *    so it reads as "200 people are on this site" ("already joined",
 *    "enrolled", "active"). Never 500+, never "thousands", never "Egyptian
 *    students".
 *  - 2,000+ is the Klovers social-media community (followers). Never call it
 *    students or learners.
 *  - The rating always carries its source. Never "Rated by 200+ students" -
 *    200 students did not review anything.
 *
 * WHY THE RATING IS GOOGLE'S 5.0 FROM 7, NOT 4.9: the Google Business Profile
 * is the only platform with a star scale that we can link to (it is the
 * share.google URL in index.html's JSON-LD sameAs). Facebook replaced star
 * ratings with Recommendations in 2018, so a "4.9" attributed to Facebook is
 * an average of nothing; the Facebook page shows "100% recommend (15
 * reviews)", which is FACEBOOK_RECOMMENDATIONS below and is quoted only in
 * the Facebook-reviews section (TestimonialsSection.tsx). If either number
 * moves on its platform, change it HERE, the same day.
 *
 * 26 Sep 2026: the Facebook count was 20 in this file and 15 on the page.
 * Checked on facebook.com/Kloversegy/reviews and corrected to 15.
 *
 * TEACHING_YEARS_COUNT is stated, not computed, on purpose: it changes when
 * Re says it does, not silently on 1 January.
 */

export const TEACHING_SINCE = 2013;
/** Whole years, for sentences ("over 13 years"). */
export const TEACHING_YEARS_COUNT = 13;
/** For stat tiles. */
export const TEACHING_YEARS = `${TEACHING_YEARS_COUNT}+`;
/** Students Re has taught herself, across all of her teaching years. */
export const STUDENTS_TAUGHT = "200+";
/** Followers across Klovers' social media. Never students. */
export const COMMUNITY = "2,000+";

export const RATING = {
  value: "5.0",
  count: 7,
  source: "Google",
  url: "https://share.google/4pWiAGlbXHCmd8hpi",
} as const;

export const FACEBOOK_RECOMMENDATIONS = {
  percent: 100,
  count: 15,
  url: "https://www.facebook.com/kloversegy/reviews",
} as const;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** "7" -> "٧". For Arabic copy that already uses Arabic-Indic numerals. */
export const toArabicDigits = (value: string | number): string =>
  String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

const EN = {
  /** The full claim, scoped so it cannot read as platform accounts. */
  studentsTaught: `${STUDENTS_TAUGHT} students taught over ${TEACHING_YEARS_COUNT} years`,
  /** Short form for tight strips. */
  studentsShort: `${STUDENTS_TAUGHT} students taught`,
  /** A label under a bare "200+" value. */
  studentsTaughtLabel: `Students taught over ${TEACHING_YEARS_COUNT} years`,
  yearsTeaching: `${TEACHING_YEARS} years teaching`,
  rating: `${RATING.value} ★ from ${RATING.count} ${RATING.source} reviews`,
  ratingShort: `${RATING.value} on ${RATING.source}`,
  community: `${COMMUNITY} followers across our social media`,
  topikPrep: "TOPIK exam preparation",
};

const AR: typeof EN = {
  studentsTaught: `أكثر من ${STUDENTS_TAUGHT.replace("+", "")} طالب على مدى ${TEACHING_YEARS_COUNT} عامًا`,
  studentsShort: `+${STUDENTS_TAUGHT.replace("+", "")} طالب درّستهم ريهام`,
  studentsTaughtLabel: `طالب على مدى ${TEACHING_YEARS_COUNT} عامًا`,
  yearsTeaching: `+${TEACHING_YEARS_COUNT} سنة تدريس`,
  rating: `${RATING.value} ★ من ${RATING.count} مراجعات على جوجل`,
  ratingShort: `${RATING.value} على جوجل`,
  community: `أكثر من ${COMMUNITY.replace(",", "").replace("+", "")} متابع على السوشيال ميديا`,
  topikPrep: "تحضير لاختبار TOPIK",
};

/** Bilingual trust copy, built from the constants above. */
export const trustCopy = (language: string): typeof EN => (language === "ar" ? AR : EN);

/**
 * Claims the site cannot back with data, and what each becomes. Used on copy
 * that still comes from translations.ts (too large to edit in place with the
 * tooling available), so the page never renders the unsupported version.
 * The TOPIK-prep wording stays; only the unmeasured "high pass rates" goes.
 */
const UNSUPPORTED_CLAIMS: [RegExp, string][] = [
  [/TOPIK preparation expert with high student pass rates/g, EN.topikPrep],
  [/\s*with high (?:student )?pass rates/g, ""],
  [/خبيرة تحضير TOPIK بنسب نجاح عالية/g, AR.topikPrep],
  [/\s*بنسب نجاح عالية/g, ""],
];

export const withoutUnsupportedClaims = (text: string): string =>
  UNSUPPORTED_CLAIMS.reduce((acc, [re, replacement]) => acc.replace(re, replacement), text);
