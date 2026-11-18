/**
 * lang-articles.mjs — the article slugs of the English (Voca) and Hungarian
 * (Buda) doors, for api/sitemap.xml.js.
 *
 * The articles themselves live in src/content/vocaArticles.ts and
 * src/content/budaArticles.ts. Those are TypeScript and the sitemap is a plain
 * Node function, so it reads this list instead. scripts/lang-articles.test.mjs
 * fails if this list and the two content files ever disagree: add, rename or
 * remove an article there, then update this file in the same commit.
 *
 * Added 18 Nov 2026 (18 + 18 articles).
 */

export const ENGLISH_ARTICLE_SLUGS = [
  "english-from-zero-first-month",
  "british-or-american-english",
  "how-long-to-learn-english",
  "pronunciation-mistakes-arabic-speakers",
  "grammar-you-need-first",
  "english-for-work-emails-meetings",
  "job-interview-in-english",
  "ielts-or-toefl",
  "tutor-or-app",
  "one-to-one-or-group-lessons",
  "understand-but-cannot-reply",
  "learning-from-films-and-series",
  "confusing-english-words",
  "writing-sentence-to-paragraph",
  "english-for-travel",
  "how-to-study-essential-grammar-in-use",
  "twenty-minutes-a-day-routine",
  "what-you-pay-for-online-english",
];

export const HUNGARIAN_ARTICLE_SLUGS = [
  "hungarian-from-zero-first-month",
  "why-hungarian-is-called-hard",
  "hungarian-alphabet-pronunciation",
  "hungarian-for-stipendium-hungaricum",
  "daily-life-hungary-how-much-hungarian",
  "first-phrases-greetings-te-on",
  "hungarian-cases-made-simple",
  "hungarian-word-order-focus",
  "hungarian-numbers-time-appointments",
  "tutor-or-app-for-hungarian",
  "how-long-to-learn-hungarian",
  "hungarian-for-work-in-hungary",
  "budapest-transport-shopping-words",
  "common-mistakes-arabic-speakers-hungarian",
  "first-week-in-hungary-arab-student",
  "learn-hungarian-songs-series",
  "official-hungarian-language-exams",
  "what-you-pay-for-online-hungarian",
];

/** Index page first, then one path per article, for each door. */
export const LANG_ARTICLE_PATHS = [
  "/learn-english/articles",
  ...ENGLISH_ARTICLE_SLUGS.map((s) => `/learn-english/articles/${s}`),
  "/learn-hungarian/articles",
  ...HUNGARIAN_ARTICLE_SLUGS.map((s) => `/learn-hungarian/articles/${s}`),
];
