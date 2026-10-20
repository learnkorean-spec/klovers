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
 * ── What a level is, in hours ──────────────────────────────────────────────
 *
 * A Klovers class is 60 minutes, once a week. A level is 24 classes over six
 * months, which matches the 6-month bundle in `lib/stripePrices` (4 / 12 / 24
 * classes for 1 / 3 / 6 months). So a level is **24 contact hours**.
 *
 * Hold that against the outside world before writing any promise:
 *
 *   • Yonsei's Korean Language Institute runs 20 hours a week for a 10-week
 *     term — 200 hours per level, six levels.
 *   • Published estimates put zero → TOPIK 1-2 at roughly 300-400 hours.
 *
 * 24 hours is not 200 hours, and no amount of good teaching closes that by a
 * factor of eight. That is why every description here says a level PREPARES a
 * student toward a TOPIK band, why nothing on the site says a level equals or
 * certifies one, and why the course cards carry a line saying that reaching
 * exam standard needs study between classes. If someone later shortens that
 * wording, this note is the reason not to.
 *
 * ── On the standards these map to ──────────────────────────────────────────
 *
 * TOPIK 1-6 maps to CEFR A1-C2 in the commonly published tables, and that is
 * what `cefr` carries. The TOPIK 6 = C2 equivalence is contested — several
 * studies place the top TOPIK band nearer C1. Lead with TOPIK; treat CEFR as
 * approximate, and print it with "≈".
 *
 * Hangul sits before the ladder (`topik: null`) and is deliberately optional:
 * a student who can already read goes straight to Level 1. It is four classes,
 * complete in itself, and sold on its own.
 */

export interface Level {
  id: number;
  key: string;
  name: string;
  shortLabel: string;
  /** Arabic short label. Same role as `shortLabel`, for the Arabic UI. */
  shortLabel_ar: string;
  topik: number | null;
  /** Published CEFR equivalent. Approximate — see the note at the top of this file. */
  cefr: string;
  order: number;
  /** How many 60-minute classes the level is. 24 for the ladder, 4 for Hangul. */
  sessions: number;
  description_en: string;
  description_ar: string;
}

export const LEVELS: Level[] = [
  {
    id: 0,
    key: "hangul",
    name: "Hangul Foundation",
    shortLabel: "Hangul",
    shortLabel_ar: "تأسيس الهانغول",
    topik: null,
    // CEFR has no "A0". "Pre-A1" is the official term for the stage below A1,
    // introduced in the 2018 CEFR Companion Volume.
    cefr: "Pre-A1",
    order: 0,
    sessions: 4,
    description_en:
      "Four classes. Learn the alphabet from zero: vowels and consonants, how syllables are built, final consonants, and the pronunciation rules. By the end you can read and write any Korean word. Take it on its own, or as the step before Level 1.",
    description_ar:
      "أربع حصص. تتعلم الأبجدية من الصفر: الحروف المتحركة والساكنة، وتركيب المقاطع، والحرف الأخير، وقواعد النطق. في النهاية تقرأ وتكتب أي كلمة كورية. يمكنك دراستها وحدها، أو كخطوة قبل المستوى الأول.",
  },
  {
    id: 1,
    key: "l1",
    name: "Level 1",
    shortLabel: "Level 1",
    shortLabel_ar: "المستوى الأول",
    topik: 1,
    cefr: "A1",
    order: 1,
    sessions: 24,
    description_en: "Core greetings, basic grammar, and daily expressions. Prepares you toward TOPIK 1 (≈ CEFR A1).",
    description_ar: "تحيات وقواعد أساسية وتعبيرات يومية. يجهّزك لـ TOPIK 1 (يقابل تقريبًا A1).",
  },
  {
    id: 2,
    key: "l2",
    name: "Level 2",
    shortLabel: "Level 2",
    shortLabel_ar: "المستوى الثاني",
    topik: 2,
    cefr: "A2",
    order: 2,
    sessions: 24,
    description_en: "Expand sentence building, everyday conversations, and comprehension. Prepares you toward TOPIK 2 (≈ CEFR A2).",
    description_ar: "توسيع بناء الجمل ومحادثات الحياة اليومية. يجهّزك لـ TOPIK 2 (يقابل تقريبًا A2).",
  },
  {
    id: 3,
    key: "l3",
    name: "Level 3",
    shortLabel: "Level 3",
    shortLabel_ar: "المستوى الثالث",
    topik: 3,
    cefr: "B1",
    order: 3,
    sessions: 24,
    description_en: "Handle real-life topics with more complex grammar. Prepares you toward TOPIK 3 (≈ CEFR B1).",
    description_ar: "مواضيع واقعية مع قواعد أكثر تعقيدًا. يجهّزك لـ TOPIK 3 (يقابل تقريبًا B1).",
  },
  {
    id: 4,
    key: "l4",
    name: "Level 4",
    shortLabel: "Level 4",
    shortLabel_ar: "المستوى الرابع",
    topik: 4,
    cefr: "B2",
    order: 4,
    sessions: 24,
    description_en: "Fluent conversation structures, longer listening and reading. Prepares you toward TOPIK 4 (≈ CEFR B2).",
    description_ar: "محادثة منظمة واستماع وقراءة أطول. يجهّزك لـ TOPIK 4 (يقابل تقريبًا B2).",
  },
  {
    id: 5,
    key: "l5",
    name: "Level 5",
    shortLabel: "Level 5",
    shortLabel_ar: "المستوى الخامس",
    topik: 5,
    cefr: "C1",
    order: 5,
    sessions: 24,
    description_en: "Advanced nuance, formal language, topic discussion. Prepares you toward TOPIK 5 (≈ CEFR C1).",
    description_ar: "فروقات دقيقة ولغة رسمية ونقاشات. يجهّزك لـ TOPIK 5 (يقابل تقريبًا C1).",
  },
  {
    id: 6,
    key: "l6",
    name: "Level 6",
    shortLabel: "Level 6",
    shortLabel_ar: "المستوى السادس",
    topik: 6,
    // Published as C2. Contested — several studies place TOPIK's top band
    // nearer C1. See the note at the top of this file.
    cefr: "C2",
    order: 6,
    sessions: 24,
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
 * "Level 1 — 24 classes, prepares you toward TOPIK 1".
 *
 * Never says a level EQUALS a TOPIK band: the hours do not support that claim.
 * See the note at the top of this file.
 */
export const formatLevelLabel = (level: Level): string => {
  if (level.topik) return `${level.name}: ${level.sessions} classes, prepares you toward TOPIK ${level.topik}`;
  return `${level.name}: ${level.sessions} classes`;
};

export const isFoundationLevel = (id: number): boolean => id === 0;

// ---------------------------------------------------------------------------
// UI language
// ---------------------------------------------------------------------------

export type UiLanguage = "en" | "ar";

/**
 * The language the visitor is reading the site in.
 *
 * `LanguageProvider` seeds its state from this same localStorage key and
 * writes it on every toggle, so reading it here gives the right answer on the
 * first render — earlier than `document.documentElement.lang`, which the
 * provider only sets in an effect, after the first paint.
 *
 * Wrapped in try/catch: Safari private mode throws on localStorage access, and
 * a level dropdown is not worth a white screen.
 */
const uiLanguage = (): UiLanguage => {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem("k-lovers-lang") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
};

/**
 * The label for one level in a picker.
 *
 * The TOPIK band rides along — "المستوى الأول (TOPIK 1)" — because a student
 * choosing their own level is exactly the person who may know their TOPIK
 * result and not know what "Level 1" means here. Hangul has no band, so it
 * shows its name alone.
 */
export const levelOptionLabel = (level: Level, language: UiLanguage): string => {
  const name = language === "ar" ? level.shortLabel_ar : level.shortLabel;
  return level.topik ? `${name} (TOPIK ${level.topik})` : name;
};

/**
 * {value, label}[] for a Select, in the language you pass.
 *
 * Prefer this at any call site that already has the language to hand — it is
 * explicit, and it does not read browser storage.
 */
export const getLevelSelectOptions = (language: UiLanguage) =>
  LEVELS.map((l) => ({ value: l.key, label: levelOptionLabel(l, language) }));

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
 * Map a canonical key → friendly short label (e.g. "l1" → "Level 1"). Falls
 * back to the raw value for anything unrecognised, so legacy strings still
 * render readably during the transition.
 *
 * ENGLISH BY DEFAULT, on purpose. Not every caller is UI: `scheduleSlotEngine`
 * builds class names from this and `marketingEngine` builds captions, and both
 * produce strings that get stored or sent onward. Those must not change
 * language because whoever is logged in happens to have the site in Arabic.
 * Pass the language explicitly where the output is read on screen.
 */
export const getLevelShortLabel = (
  key: string | null | undefined,
  language: UiLanguage = "en",
): string => {
  if (!key) return "";
  const lvl = getLevelByKey(key) ?? mapLegacyLevel(key);
  if (!lvl) return key;
  return language === "ar" ? lvl.shortLabel_ar : lvl.shortLabel;
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

/**
 * {value, label}[] for Select components — COMPATIBILITY SHIM.
 *
 * `label` is a getter that follows the UI language rather than a fixed string.
 * That is unusual, so here is why it is worth it.
 *
 * Twelve call sites import this constant and none of them pass a language.
 * Six are student-facing: EnrollNowPage, TrialBookingPage, SignUpPage,
 * CompleteProfilePage, ResubmitSchedulePage, RegistrationChecklist. An Arabic
 * student on any of them saw "Hangul, Level 1 … Level 6" — the only English
 * left on the page, at the step where they must choose. Two of those files are
 * 58 KB and 47 KB, and the GitHub contents API takes whole files, so a
 * one-line change there means resending 105 KB and hoping it round-trips.
 *
 * A getter fixes all six today from one file. It stays correct because React
 * re-renders on a language toggle and re-reads `label`, and because array
 * spread (`[...LEVEL_SELECT_OPTIONS]`, used below and in CompleteProfilePage)
 * copies element REFERENCES, so the getter survives. Object spread on one
 * option would freeze it at the then-current value — still correct, just no
 * longer live.
 *
 * Migrate call sites to `getLevelSelectOptions(language)` as they are touched;
 * when the last one is gone, this can go back to being a plain array.
 */
export const LEVEL_SELECT_OPTIONS: { value: string; label: string }[] = LEVELS.map((l) => ({
  value: l.key,
  get label() {
    return levelOptionLabel(l, uiLanguage());
  },
}));

/** Same but with special tracks appended */
export const LEVEL_SELECT_OPTIONS_WITH_SPECIAL: { value: string; label: string }[] = [
  ...LEVEL_SELECT_OPTIONS,
  ...SPECIAL_TRACKS.map((t) => ({
    value: t.key,
    get label() {
      return uiLanguage() === "ar" ? t.label_ar : t.label;
    },
  })),
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

  // Every level must state how many classes it is, and the ladder is 24 —
  // matching the 6-month bundle in stripePrices. A level with no class count
  // is a level a student cannot price, which is the state this replaced.
  LEVELS.forEach((l) => {
    if (!l.sessions || l.sessions < 1) throw new Error(`Level ${l.key} has no class count`);
  });
  LEVELS.filter((l) => l.topik).forEach((l) => {
    if (l.sessions !== 24) {
      throw new Error(`Level ${l.key} is ${l.sessions} classes; the ladder is 24, and the 6-month bundle sells 24`);
    }
  });

  // No level may claim to BE a TOPIK band. The hours do not support it.
  LEVELS.forEach((l) => {
    if (/\bis TOPIK\b|=\s*TOPIK/i.test(l.description_en)) {
      throw new Error(`Level ${l.key} claims to equal a TOPIK band; it should say "prepares you toward"`);
    }
  });

  // Every level needs both labels: a missing Arabic one shows up as an empty
  // row in the dropdown, which is worse than the English it replaced.
  LEVELS.forEach((l) => {
    if (!l.shortLabel_ar || !l.shortLabel_ar.trim()) {
      throw new Error(`Level ${l.key} has no Arabic short label`);
    }
    if (l.shortLabel_ar === l.shortLabel) {
      throw new Error(`Level ${l.key} Arabic label was never translated`);
    }
  });
};

if (import.meta.env.DEV) {
  validateLevels();
}
