/**
 * articleVocab.ts — what an article teaches, read from the article itself.
 *
 * Klovers articles carry their vocabulary as markdown tables:
 *
 *   | 한옥 | هانوك | البيت الكوري التقليدي |
 *   | 편의점 | Pyeonuijeom | Convenience store |
 *   | جيونج دافئ | 고운 정 | المودة تُبنى باللطف |   (label first, Korean second)
 *
 * The rule, shared with the SQL that generated src/constants/blogLearningMeta.ts
 * (keep the two in step): a vocabulary item is the FIRST cell of a table row
 * that is pure Hangul (syllables plus spaces and light punctuation), at most 20
 * characters. The cell after it is the romanisation when two or more cells
 * follow, and the last cell is the meaning. With only one cell after it, that
 * cell is the meaning; with none, the cell before it is.
 *
 * Deliberately NOT extracted: Hangul inside running prose. Prose mentions
 * ("ولماذا 정، المشاعر...") carry no reliable meaning next to them, and a
 * "you learned today" list with blank meanings teaches nothing.
 */

export interface VocabItem {
  ko: string;
  rom?: string;
  meaning?: string;
}

const HANGUL_CELL = /^[가-힣][가-힣\s.?!~,]*$/;
const SEPARATOR_ROW = /^\s*\|[\s:|-]+$/;
export const HAS_HANGUL = /[가-힣]/;
export const PURE_HANGUL = HANGUL_CELL;

const clean = (s: string) =>
  s
    .replace(/\*\*|__|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();

export function extractArticleVocab(markdown: string | null | undefined): VocabItem[] {
  if (!markdown) return [];
  const seen = new Map<string, VocabItem>();
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("|") || SEPARATOR_ROW.test(line)) continue;
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(clean);
    const idx = cells.findIndex((c) => c.length <= 20 && HANGUL_CELL.test(c));
    if (idx === -1) continue;
    const ko = cells[idx];
    if (seen.has(ko)) continue;
    const after = cells.slice(idx + 1).filter(Boolean);
    let rom: string | undefined;
    let meaning: string | undefined;
    if (after.length >= 2) {
      rom = after[0];
      meaning = after[after.length - 1];
    } else if (after.length === 1) {
      meaning = after[0];
    } else if (idx > 0) {
      meaning = cells[idx - 1] || undefined;
    }
    // A "meaning" that is itself Hangul is a second Korean column, not a gloss.
    if (meaning && HANGUL_CELL.test(meaning)) meaning = undefined;
    seen.set(ko, { ko, rom, meaning });
  }
  return [...seen.values()];
}

/** Whitespace word count — the same measure BlogPostPage has always used. */
export const countWords = (text: string | null | undefined) =>
  text ? text.trim().split(/\s+/).length : 0;

/** Minutes at 200 wpm, never below 1. Same formula as the article page. */
export const readingMinutes = (words: number) => Math.max(1, Math.ceil(words / 200));

/**
 * Strip the language marker so EN and AR twins share one key.
 * Arabic slugs are `{base}-ar` or the legacy `ar-{base}`.
 */
export const baseSlug = (slug: string) =>
  slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

export type ArticleLevel = "beginner" | "intermediate" | "advanced";

const INTERMEDIATE =
  /(conditional|irregular|reported-speech|causative|passive|connectors|honorifics-formality|past-experience|purpose-intention|imperative|future-tense|comparative|ability-expressions|proverbs|topik-exam-preparation|job-interview|speech-levels|sentence-structure)/;
const ADVANCED = /(advanced|topik-2)/;

/**
 * Level from the slug. No level is stored in the CMS, so this is an editorial
 * heuristic: grammar beyond the basics and exam prep are intermediate,
 * anything labelled advanced is advanced, everything else — culture and
 * first-steps vocabulary included — needs no prior Korean.
 */
export function articleLevel(slug: string): ArticleLevel {
  const b = baseSlug(slug);
  if (ADVANCED.test(b)) return "advanced";
  if (INTERMEDIATE.test(b)) return "intermediate";
  return "beginner";
}

export const LEVEL_LABEL: Record<ArticleLevel, { ar: string; en: string }> = {
  beginner: { ar: "مبتدئ", en: "Beginner" },
  intermediate: { ar: "متوسط", en: "Intermediate" },
  advanced: { ar: "متقدم", en: "Advanced" },
};
