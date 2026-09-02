/**
 * supabase/functions/_shared/levelLabel.ts
 *
 * Human-readable course level names, for anything that emails a student.
 *
 * WHY THIS EXISTS
 * ---------------
 * Edge functions run in Deno and cannot import from `src/`, so the labels in
 * `src/constants/levels.ts` are out of reach. Every function that needed one
 * therefore invented the same wrong thing:
 *
 *     const levelLabel = level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
 *
 * Against the canonical keys (`hangul`, `l1` … `l6`) that produces **"L1"**.
 * Students have been receiving "Level: L1" in enrolment and confirmation
 * emails. In Arabic it is worse: `\b\w` does not match Arabic letters, so the
 * English key was dropped verbatim into Arabic copy.
 *
 * KEEPING THIS HONEST
 * -------------------
 * This file is a MIRROR of `src/constants/levels.ts`. If a level is added or
 * renamed there, change it here in the same commit. The mapping is written out
 * literally rather than computed, so a missing entry is visible rather than
 * silently producing a mangled key.
 *
 * Legacy values are included because `enrollments.level` and
 * `schedule_packages.level` still hold pre-2026-04 rows.
 */

export type EmailLanguage = "en" | "ar";

const LABELS: Record<string, { en: string; ar: string }> = {
  hangul: { en: "Hangul Foundation", ar: "تأسيس الهانغل" },
  l1: { en: "Level 1", ar: "المستوى الأول" },
  l2: { en: "Level 2", ar: "المستوى الثاني" },
  l3: { en: "Level 3", ar: "المستوى الثالث" },
  l4: { en: "Level 4", ar: "المستوى الرابع" },
  l5: { en: "Level 5", ar: "المستوى الخامس" },
  l6: { en: "Level 6", ar: "المستوى السادس" },
  reading_speaking: { en: "Reading & Speaking", ar: "القراءة والمحادثة" },
  topik_prep: { en: "TOPIK Preparation", ar: "تحضير TOPIK" },
};

/** Pre-2026-04 values still present in the database. */
const LEGACY: Record<string, string> = {
  foundation: "hangul",
  hangul_foundation: "hangul",
  level_0: "hangul",
  level_1: "l1",
  level_2: "l2",
  level_3: "l3",
  level_4: "l4",
  level_5: "l5",
  level_6: "l6",
  beginner_1: "l1",
  beginner_2: "l2",
  intermediate_1: "l3",
  intermediate_2: "l4",
  advanced_1: "l5",
  advanced_2: "l6",
  topik_1: "l1",
  topik_2: "l2",
};

/**
 * A level key as a student should read it.
 *
 * Returns "" for an empty input, so callers can drop the whole line rather
 * than print an empty label. An unrecognised value comes back as it arrived —
 * odd, but honest, and better than a mangled guess.
 */
export function levelLabel(
  key: string | null | undefined,
  language: EmailLanguage = "en",
): string {
  const value = (key ?? "").trim();
  if (!value) return "";

  const canonical = LABELS[value] ? value : LEGACY[value.toLowerCase()];
  const entry = canonical ? LABELS[canonical] : undefined;
  if (!entry) return value;

  return language === "ar" ? entry.ar : entry.en;
}
