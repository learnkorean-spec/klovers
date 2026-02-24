/**
 * src/constants/levels.ts — Single source of truth for Korean course levels.
 *
 * What changed (2026-02-24):
 * - Replaced scattered "Beginner 1/2", "Intermediate 1/2", "Advanced 1/2" arrays
 *   with a unified 7-level TOPIK/CEFR classification (Foundation + Levels 1–6).
 * - All hardcoded level arrays across ~10 files now import from here.
 * - Legacy DB values (snake_case strings like "beginner_1") are preserved via
 *   mapLegacyLevel() — no DB migration needed.
 * - normalizeLevel() centralised here (was duplicated in 4 files).
 */

export interface Level {
  id: number;
  key: string;
  name: string;
  shortLabel: string;
  topik: number | null;
  cefr: string;
  order: number;
  description_en: string;
  description_ar: string;
}

export const LEVELS: Level[] = [
  {
    id: 0,
    key: "foundation",
    name: "Hangul Foundation",
    shortLabel: "Hangul (A0)",
    topik: null,
    cefr: "A0",
    order: 0,
    description_en: "Master reading, writing, and pronunciation fundamentals before entering TOPIK Levels.",
    description_ar: "إتقان القراءة والكتابة والنطق قبل مستويات TOPIK.",
  },
  {
    id: 1,
    key: "level_1",
    name: "Level 1",
    shortLabel: "L1 (TOPIK 1 / A1)",
    topik: 1,
    cefr: "A1",
    order: 1,
    description_en: "Core greetings, basic grammar, and daily expressions (TOPIK 1 / A1).",
    description_ar: "تحيات وقواعد أساسية وتعبيرات يومية (TOPIK 1 / A1).",
  },
  {
    id: 2,
    key: "level_2",
    name: "Level 2",
    shortLabel: "L2 (TOPIK 2 / A2)",
    topik: 2,
    cefr: "A2",
    order: 2,
    description_en: "Expand sentence building, everyday conversations, and comprehension (TOPIK 2 / A2).",
    description_ar: "توسيع بناء الجمل ومحادثات الحياة اليومية (TOPIK 2 / A2).",
  },
  {
    id: 3,
    key: "level_3",
    name: "Level 3",
    shortLabel: "L3 (TOPIK 3 / B1)",
    topik: 3,
    cefr: "B1",
    order: 3,
    description_en: "Handle real-life topics with more complex grammar (TOPIK 3 / B1).",
    description_ar: "مواضيع واقعية مع قواعد أكثر تعقيدًا (TOPIK 3 / B1).",
  },
  {
    id: 4,
    key: "level_4",
    name: "Level 4",
    shortLabel: "L4 (TOPIK 4 / B2)",
    topik: 4,
    cefr: "B2",
    order: 4,
    description_en: "Fluent conversation structures, longer listening/reading (TOPIK 4 / B2).",
    description_ar: "محادثة منظمة واستماع/قراءة أطول (TOPIK 4 / B2).",
  },
  {
    id: 5,
    key: "level_5",
    name: "Level 5",
    shortLabel: "L5 (TOPIK 5 / C1)",
    topik: 5,
    cefr: "C1",
    order: 5,
    description_en: "Advanced nuance, formal language, topic discussion (TOPIK 5 / C1).",
    description_ar: "فروقات دقيقة ولغة رسمية ونقاشات (TOPIK 5 / C1).",
  },
  {
    id: 6,
    key: "level_6",
    name: "Level 6",
    shortLabel: "L6 (TOPIK 6 / C2)",
    topik: 6,
    cefr: "C2",
    order: 6,
    description_en: "Near-native comprehension, idioms, and advanced expression (TOPIK 6 / C2).",
    description_ar: "فهم شبه أصلي وتعبيرات متقدمة واصطلاحات (TOPIK 6 / C2).",
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

export const formatLevelLabel = (level: Level): string =>
  level.topik
    ? `${level.name} — TOPIK ${level.topik} / ${level.cefr}`
    : `${level.name}`;

export const isFoundationLevel = (id: number): boolean => id === 0;

// ---------------------------------------------------------------------------
// Normalizer (centralised — was duplicated in 4 files)
// ---------------------------------------------------------------------------

/** Convert any level label to snake_case for DB comparison */
export const normalizeLevel = (label: string): string =>
  label.trim().toLowerCase().replace(/\s+/g, "_");

// ---------------------------------------------------------------------------
// Legacy mapping — maps old DB keys to new Level objects
// ---------------------------------------------------------------------------

const LEGACY_MAP: Record<string, string> = {
  // Old "Beginner 1" style
  beginner_1: "level_1",
  "beginner-1": "level_1",
  beginner1: "level_1",
  beginner_2: "level_2",
  "beginner-2": "level_2",
  beginner2: "level_2",
  // Old "Intermediate" style
  intermediate_1: "level_3",
  "intermediate-1": "level_3",
  intermediate1: "level_3",
  "intermediate-3": "level_3",
  intermediate_3: "level_3",
  intermediate_2: "level_4",
  "intermediate-2": "level_4",
  intermediate2: "level_4",
  "intermediate-4": "level_4",
  intermediate_4: "level_4",
  // Old "Advanced" style
  advanced_1: "level_5",
  "advanced-1": "level_5",
  advanced1: "level_5",
  "advanced-5": "level_5",
  advanced_5: "level_5",
  advanced_2: "level_6",
  "advanced-2": "level_6",
  advanced2: "level_6",
  "advanced-6": "level_6",
  advanced_6: "level_6",
  // Hangul / foundation
  hangul: "foundation",
  hangul_foundation: "foundation",
  foundation: "foundation",
  level_0: "foundation",
  // TOPIK special
  topik_1: "level_1",
  topik_2: "level_2",
  // Direct keys (already correct)
  level_1: "level_1",
  level_2: "level_2",
  level_3: "level_3",
  level_4: "level_4",
  level_5: "level_5",
  level_6: "level_6",
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
};

if (import.meta.env.DEV) {
  validateLevels();
}
