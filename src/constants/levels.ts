/**
 * src/constants/levels.ts — Single source of truth for Korean course levels.
 *
 * Canonical DB values (post-2026-04 migration):
 *   hangul, l1, l2, l3, l4, l5, l6
 *
 * These short keys are what the database stores and what every API write must
 * send. UI rendering uses `shortLabel` (e.g. "Hangul") via `LEVEL_SELECT_OPTIONS`.
 *
 * Legacy values (`foundation`, `level_1`…`level_6`, `beginner_1`, `intermediate_2`
 * etc.) are supported READ-SIDE only via `mapLegacyLevel()` — never emit them on write.
 *
 * ── On the standards these map to ──────────────────────────────────────────
 *
 * TOPIK 1-6 maps to CEFR A1-C2 in the commonly published tables, and that is
 * what `cefr` carries. Two caveats worth keeping in mind before any of this is
 * put in front of a student:
 *
 *   • The TOPIK 6 = C2 equivalence is contested. Several studies place the
 *     top TOPIK band nearer C1. Lead with TOPIK; treat CEFR as approximate.
 *
 *   • A level is a body of material, not a certificate. Korean university
 *     institutes budget roughly 200 hours per level (Yonsei: 200 hours per
 *     10-week term). A 90-minute class twice a week for three months is about
 *     36 hours. So a Klovers level PREPARES a student toward a TOPIK band —
 *     it does not certify one, and the descriptions below say so.
 *
 * Hangul sits before the ladder (`topik: null`) and is deliberately optional:
 * a student who can already read goes straight to Level 1.
 */

export interface Level {
  id: number;
  key: string;
  name: string;
  shortLabel: string;
  topik: number | null;
  /** Published CEFR equivalent. Approximate — see the note at the top of this file. */
  cefr: string;
  order: number;
  /** Fixed number of classes, where the level has one. Null = not fixed yet. */
  sessions: number | null;
  description_en: string;
  description_ar: string;
}

export const LEVELS: Level[] = [
  {
    id: 0,
    key: "hangul",
    name: "Hangul Foundation",
    shortLabel: "Hangul",
    topik: null,
    // CEFR has no "A0". "Pre-A1" is the official term for the stage below A1,
    // introduced in the 2018 CEFR Companion Volume.
    cefr: "Pre-A1",
    order: 0,
    sessions: 4,
    description_en:
      "Four classes. Learn the alphabet from zero — vowels and consonants, how syllables are built, final consonants, and the pronunciation rules. By the end you can read and write any Korean word. Take it on its own, or as the step before Level 1.",
    description_ar:
      "أربع حصص. تتعلم الأبجدية من الصفر — الحروف المتحركة والساكنة، وتركيب المقاطع، والحرف الأخير، وقواعد النطق. في النهاية تقرأ وتكتب أي كلمة كورية. يمكنك دراستها وحدها، أو كخطوة قبل المستوى الأول.",
  },
  {
    id: 1,
    key: "l1",
    name: "Level 1",
    shortLabel: "Level 1",
    topik: 1,
    cefr: "A1",
    order: 1,
    sessions: null,
    description_en: "Core greetings, basic grammar, and daily expressions. Prepares you toward TOPIK 1 (≈ CEFR A1).",
    description_ar: "تحيات وقواعد أساسية وتعبيرات يومية. يجهّزك لـ TOPIK 1 (يقابل تقريبًا A1).",
  },
  {
    id: 2,
    key: "l2",
    name: "Level 2",
    shortLabel: "Level 2",
    topik: 2,
    cefr: "A2",
    order: 2,
    sessions: null,
    description_en: "Expand sentence building, everyday conversations, and comprehension. Prepares you toward TOPIK 2 (≈ CEFR A2).",
    description_ar: "توسيع بناء الجمل ومحادثات الحياة اليومية. يجهّزك لـ TOPIK 2 (يقابل تقريبًا A2).",
  },
  {
    id: 3,
    key: "l3",
    name: "Level 3",
    shortLabel: "Level 3",
    topik: 3,
    cefr: "B1",
    order: 3,
    sessions: null,
    description_en: "Handle real-life topics with more complex grammar. Prepares you toward TOPIK 3 (≈ CEFR B1).",
    description_ar: "مواضيع واقعية مع قواعد أكثر تعقيدًا. يجهّزك لـ TOPIK 3 (يقابل تقريبًا B1).",
  },
  {
    id: 4,
    key: "l4",
    name: "Level 4",
    shortLabel: "Level 4",
    topik: 4,
    cefr: "B2",
    order: 4,
    sessions: null,
    description_en: "Fluent conversation structures, longer listening and reading. Prepares you toward TOPIK 4 (≈ CEFR B2).",
    description_ar: "محادثة منظمة واستماع وقراءة أطول. يجهّزك لـ TOPIK 4 (يقابل تقريبًا B2).",
  },
  {
    id: 5,
    key: "l5",
    name: "Level 5",
    shortLabel: "Level 5",
    topik: 5,
    cefr: "C1",
    order: 5,
    sessions: null,
    description_en: "Advanced nuance, formal language, topic discussion. Prepares you toward TOPIK 5 (≈ CEFR C1).",
    description_ar: "فروقات دقيقة ولغة رسمية ونقاشات. يجهّزك لـ TOPIK 5 (يقابل تقريبًا C1).",
  },
  {
    id: 6,
    key: "l6",
    name: "Level 6",
    shortLabel: "Level 6",
    topik: 6,
    // Published as C2. Contested — several studies place TOPIK's top band
    // nearer C1. See the note at the top of this file.
    cefr: "C2",
    order: 6,
    sessions: null,
    description_en: "Near-native comprehension, idioms, and advanced expression. Prepares you toward TOPIK 6 (the highest TOPIK band).",
    description_ar: "فهم شبه أصلي وتعبيرات متقدمة واصطلاحات. يجهّزك لـ TOPIK 6 (أعلى مستويات TOPIK).",
  },
];

/** Special tracks — not part of the TOPIK 1-6 progression */
export const SPECIAL_TRACKS = [
  { key: "reading_speaking", label: "Reading & Speaking", label_ar: "القراءة والمحادثة" },
  { key: "topik_prep", label: "TOPIK Preparation", label_ar: "تحضير TOPIK" },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const getLevelById = (id: number): Level | undefined =>
  LEVELS.find((l) => l.id === id);

export const getLevelByKey = (key: string): Level | undefined =>
  LEVELS.find((l) => l.key === key);

/**
 * "Level 1 — prepares you toward TOPIK 1" / "Hangul Foundation — 4 classes".
 *
 * Never says a level EQUALS a TOPIK band: the hours do not support that claim.
 * See the note at the top of this file.
 */
export const formatLevelLabel = (level: Level): string => {
  if (level.topik) return `${level.name} — prepares you toward TOPIK ${level.topik}`;
  if (level.sessions) return `${level.name} — ${level.sessions} classes`;
  return level.name;
};

export const isFoundationLevel = (id: number): boolean => id === 0;

// ---------------------------------------------------------------------------
// Normalizer (centralised — was duplicated in 4 files)
// ---------------------------------------------------------------------------

/**
 * Convert any level label (legacy snake_case, shortLabel, display name, etc.)
 * into the canonical DB key (`hangul`, `l1`…`l6`). Falls back to a lowercase
 * snake_case form if no mapping exists — that keeps the old behaviour for
 * unrelated fields (e.g. self-reported CEFR strings) while routing every
 * recognised level through the canonical vocabulary.
 */
export const normalizeLevel = (label: string): string => {
  if (!label) return "";
  const snake = label.trim().toLowerCase().replace(/\s+/g, "_");
  // Try legacy map first — covers "foundation", "level_1", "Beginner 1", etc.
  const mapped = LEGACY_MAP[snake];
  if (mapped) return mapped;
  // Canonical key already? Return as-is.
  if ((LEVEL_KEYS as readonly string[]).includes(snake)) return snake;
  return snake;
};

// ---------------------------------------------------------------------------
// Display helper (use anywhere a level key is rendered to the user)
// ---------------------------------------------------------------------------

/**
 * Map a canonical key → friendly `shortLabel` (e.g. "l1" → "Level 1").
 * Falls back to the raw value for anything unrecognised, so legacy strings
 * still render readably during the transition.
 */
export const getLevelShortLabel = (key: string | null | undefined): string => {
  if (!key) return "";
  const lvl = getLevelByKey(key) ?? mapLegacyLevel(key);
  return lvl?.shortLabel ?? key;
};

// ---------------------------------------------------------------------------
// Legacy mapping — maps old DB keys to new Level objects
// ---------------------------------------------------------------------------

const LEGACY_MAP: Record<string, string> = {
  // Canonical keys (identity — already correct)
  hangul: "hangul",
  l1: "l1",
  l2: "l2",
  l3: "l3",
  l4: "l4",
  l5: "l5",
  l6: "l6",
  // Pre-2026-04 canonical keys
  foundation: "hangul",
  level_0: "hangul",
  level_1: "l1",
  level_2: "l2",
  level_3: "l3",
  level_4: "l4",
  level_5: "l5",
  level_6: "l6",
  // Old "Beginner 1" style
  beginner_1: "l1",
  "beginner-1": "l1",
  beginner1: "l1",
  beginner_2: "l2",
  "beginner-2": "l2",
  beginner2: "l2",
  // Old "Intermediate" style
  intermediate_1: "l3",
  "intermediate-1": "l3",
  intermediate1: "l3",
  "intermediate-3": "l3",
  intermediate_3: "l3",
  intermediate_2: "l4",
  "intermediate-2": "l4",
  intermediate2: "l4",
  "intermediate-4": "l4",
  intermediate_4: "l4",
  // Old "Advanced" style
  advanced_1: "l5",
  "advanced-1": "l5",
  advanced1: "l5",
  "advanced-5": "l5",
  advanced_5: "l5",
  advanced_2: "l6",
  "advanced-2": "l6",
  advanced2: "l6",
  "advanced-6": "l6",
  advanced_6: "l6",
  // Hangul aliases
  hangul_foundation: "hangul",
  // TOPIK special
  topik_1: "l1",
  topik_2: "l2",
};

/**
 * Resolve a legacy/old level string to its new Level object.
 * Returns undefined (with console.warn) if unrecognised.
 */
export const mapLegacyLevel = (legacyKey: string): Level | undefined => {
  const cleaned = legacyKey.trim().toLowerCase().replace(/\s+/g, "_");
  const newKey = LEGACY_MAP[cleaned];
  if (!newKey) {
    console.warn(`[levels] Unknown legacy level key: "${legacyKey}"`);
    return undefined;
  }
  return getLevelByKey(newKey);
};

// ---------------------------------------------------------------------------
// Dropdown helpers
// ---------------------------------------------------------------------------

/** Just the key strings */
export const LEVEL_KEYS = LEVELS.map((l) => l.key);

/** {value, label}[] for Select components — uses shortLabel for compact display */
export const LEVEL_SELECT_OPTIONS = LEVELS.map((l) => ({
  value: l.key,
  label: l.shortLabel,
}));

/** Same but with special tracks appended */
export const LEVEL_SELECT_OPTIONS_WITH_SPECIAL = [
  ...LEVEL_SELECT_OPTIONS,
  ...SPECIAL_TRACKS.map((t) => ({ value: t.key, label: t.label })),
];

/** Level names for simple string-based lists (admin scheduling) */
export const LEVEL_NAMES = LEVELS.map((l) => l.name);

// ---------------------------------------------------------------------------
// Dev-only validation
// ---------------------------------------------------------------------------

export const validateLevels = (): void => {
  const ids = LEVELS.map((l) => l.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) throw new Error("Duplicate level IDs");

  for (let i = 1; i < LEVELS.length; i++) {
    if (LEVELS[i].order <= LEVELS[i - 1].order) throw new Error("Levels not in ascending order");
  }

  LEVELS.filter((l) => l.id >= 1 && l.id <= 6).forEach((l) => {
    if (l.topik !== l.id) throw new Error(`Level ${l.id} topik mismatch`);
  });

  // Hangul sits BEFORE the TOPIK ladder. If it ever gains a topik number it
  // has stopped being the alphabet course and the ladder above it is wrong.
  const hangul = getLevelByKey("hangul");
  if (!hangul) throw new Error("Hangul level missing");
  if (hangul.topik !== null) throw new Error("Hangul must not claim a TOPIK band");
  if (hangul.cefr !== "Pre-A1") throw new Error('Hangul CEFR must be "Pre-A1" — CEFR has no "A0"');
  if (hangul.sessions !== 4) throw new Error("Hangul is a 4-class course");

  // No level may claim to BE a TOPIK band. The hours do not support it.
  LEVELS.forEach((l) => {
    if (/\bis TOPIK\b|=\s*TOPIK/i.test(l.description_en)) {
      throw new Error(`Level ${l.key} claims to equal a TOPIK band; it should say "prepares you toward"`);
    }
  });
};

if (import.meta.env.DEV) {
  validateLevels();
}
