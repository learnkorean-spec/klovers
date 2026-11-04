/**
 * Language Exchange — shared constants.
 *
 * Kept as plain data (not a DB-backed taxonomy) so the picker lists can grow
 * without a migration. Labels are bilingual inline, matching how most
 * feature-local pages in this repo keep their own copy rather than growing
 * src/i18n/translations.ts for a single page.
 */

export interface LanguageOption {
  code: string;
  en: string;
  ar: string;
}

// Korean and the sibling-brand languages (maktub/Voca/Buda) first, then the
// most commonly requested exchange languages.
export const EXCHANGE_LANGUAGES: LanguageOption[] = [
  { code: "ko", en: "Korean", ar: "الكورية" },
  { code: "ar", en: "Arabic", ar: "العربية" },
  { code: "en", en: "English", ar: "الإنجليزية" },
  { code: "hu", en: "Hungarian", ar: "المجرية" },
  { code: "fr", en: "French", ar: "الفرنسية" },
  { code: "es", en: "Spanish", ar: "الإسبانية" },
  { code: "de", en: "German", ar: "الألمانية" },
  { code: "ja", en: "Japanese", ar: "اليابانية" },
  { code: "zh", en: "Chinese", ar: "الصينية" },
  { code: "tr", en: "Turkish", ar: "التركية" },
  { code: "it", en: "Italian", ar: "الإيطالية" },
  { code: "ru", en: "Russian", ar: "الروسية" },
];

export const languageLabel = (code: string, lang: "en" | "ar"): string =>
  EXCHANGE_LANGUAGES.find((l) => l.code === code)?.[lang] ?? code;

export interface InterestOption {
  key: string;
  en: string;
  ar: string;
}

export const EXCHANGE_INTERESTS: InterestOption[] = [
  { key: "kpop", en: "K-pop", ar: "كيبوب" },
  { key: "kdrama", en: "K-drama", ar: "دراما كورية" },
  { key: "cooking", en: "Cooking", ar: "الطبخ" },
  { key: "travel", en: "Travel", ar: "السفر" },
  { key: "gaming", en: "Gaming", ar: "الألعاب" },
  { key: "movies", en: "Movies", ar: "الأفلام" },
  { key: "music", en: "Music", ar: "الموسيقى" },
  { key: "anime", en: "Anime", ar: "الأنمي" },
  { key: "sports", en: "Sports", ar: "الرياضة" },
  { key: "reading", en: "Reading", ar: "القراءة" },
  { key: "photography", en: "Photography", ar: "التصوير" },
  { key: "fitness", en: "Fitness", ar: "اللياقة" },
  { key: "tech", en: "Technology", ar: "التقنية" },
  { key: "art", en: "Art", ar: "الفن" },
  { key: "culture", en: "Culture", ar: "الثقافة" },
  { key: "history", en: "History", ar: "التاريخ" },
  { key: "fashion", en: "Fashion", ar: "الموضة" },
  { key: "pets", en: "Pets", ar: "الحيوانات الأليفة" },
];

export const interestLabel = (key: string, lang: "en" | "ar"): string =>
  EXCHANGE_INTERESTS.find((i) => i.key === key)?.[lang] ?? key;

export const EXCHANGE_MIN_AGE = 16;
export const EXCHANGE_MAX_AGE = 100;

/**
 * What a profile is looking for in a partner — required so a match knows
 * what the other person actually wants before reaching out (Re's request,
 * 4 Nov 2026: too many people were matching with no shared expectation).
 * Fixed catalogue, enforced server-side too (see
 * supabase/migrations/20261104020000_exchange_goals_and_availability.sql).
 */
export interface GoalOption {
  key: string;
  en: string;
  ar: string;
}

export const EXCHANGE_GOALS: GoalOption[] = [
  { key: "study_partner", en: "Study partner", ar: "شريك دراسة" },
  { key: "culture_friend", en: "Culture friend", ar: "صديق ثقافي" },
  { key: "topik_prep", en: "TOPIK prep", ar: "تحضير اختبار TOPIK" },
  { key: "native_practice", en: "Practice with a native speaker", ar: "ممارسة مع متحدث أصلي" },
  { key: "casual_chat", en: "Casual chat", ar: "دردشة ودّية" },
  { key: "travel_prep", en: "Travel prep", ar: "تحضير للسفر" },
];

export const goalLabel = (key: string, lang: "en" | "ar"): string =>
  EXCHANGE_GOALS.find((g) => g.key === key)?.[lang] ?? key;

export const EXCHANGE_MAX_GOALS = 3;
export const EXCHANGE_AVAILABILITY_COUNT = 2;

/** Days and time-of-day buckets used to build an availability slot token
 *  ("Monday:evening"). Day names in English/Arabic mirror MySchedulePage's
 *  DAY_NAMES_EN/DAY_NAMES_AR so a day reads the same everywhere in the app. */
export const EXCHANGE_DAYS = [
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الإثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
  { en: "Saturday", ar: "السبت" },
];

export const EXCHANGE_TIME_BUCKETS: { key: string; en: string; ar: string }[] = [
  { key: "morning", en: "Morning", ar: "صباحًا" },
  { key: "afternoon", en: "Afternoon", ar: "ظهرًا" },
  { key: "evening", en: "Evening", ar: "مساءً" },
  { key: "night", en: "Night", ar: "ليلًا" },
];

/** "Monday:evening" -> "Monday evenings" / "الإثنين مساءً". Unknown or
 *  malformed tokens fall back to the raw string rather than throwing. */
export function formatAvailabilitySlot(token: string, lang: "en" | "ar"): string {
  const [dayEn, bucketKey] = token.split(":");
  const day = EXCHANGE_DAYS.find((d) => d.en === dayEn);
  const bucket = EXCHANGE_TIME_BUCKETS.find((b) => b.key === bucketKey);
  if (!day || !bucket) return token;
  return lang === "ar" ? `${day.ar} ${bucket.ar}` : `${day.en} ${bucket.en}`;
}

/** Short, friendly timezone label ("Bangkok", "Cairo") for display next to an
 *  availability slot, so a match in another timezone isn't left guessing. */
export function shortTimezoneLabel(tz: string | null | undefined): string {
  if (!tz) return "";
  return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/**
 * Avatars only, never real photos (Re's request, 4 Nov 2026 — this is a
 * study-partner feature, not a dating app, and a real photo is the single
 * biggest catfishing/harassment surface a swipe-based feature can have).
 *
 * No upload exists for this feature at all: a profile picks one of these
 * built-in icon-on-color avatars, stored as "avatar://<key>" in the existing
 * `avatar_url` column (no schema change needed — it was already free text).
 * The icon set is deliberately study/culture themed (book, globe, languages,
 * music...) and deliberately excludes anything romantic (no hearts, no
 * couple icons) — the same "friends and study companions, not a romantic
 * couple" line this repo's own CLAUDE.md draws for the in-game characters.
 *
 * Any `avatar_url` that is NOT in this "avatar://" form (e.g. a leftover
 * real upload from before this change) is deliberately never rendered as an
 * image — see isBuiltInAvatarValue — so this holds even retroactively.
 */
export const AVATAR_ICON_PREFIX = "avatar://";

export interface AvatarStyleOption {
  key: string;
  /** lucide-react icon name, resolved where it's rendered (keeps this file icon-library-agnostic) */
  icon: string;
  bg: string;
}

export const EXCHANGE_AVATAR_STYLES: AvatarStyleOption[] = [
  { key: "book", icon: "BookOpen", bg: "#FDE68A" },
  { key: "globe", icon: "Globe2", bg: "#A7F3D0" },
  { key: "graduation", icon: "GraduationCap", bg: "#BFDBFE" },
  { key: "chat", icon: "MessageCircle", bg: "#FBCFE8" },
  { key: "pen", icon: "PenTool", bg: "#DDD6FE" },
  { key: "music", icon: "Music2", bg: "#FECACA" },
  { key: "film", icon: "Film", bg: "#FDBA74" },
  { key: "coffee", icon: "Coffee", bg: "#99F6E4" },
  { key: "plane", icon: "Plane", bg: "#C7D2FE" },
  { key: "mic", icon: "Mic2", bg: "#FCA5A5" },
  { key: "palette", icon: "Palette", bg: "#D9F99D" },
  { key: "headphones", icon: "Headphones", bg: "#E9D5FF" },
];

export const isBuiltInAvatarValue = (v: string | null | undefined): boolean =>
  !!v && v.startsWith(AVATAR_ICON_PREFIX);

export const avatarStyleFromValue = (v: string | null | undefined): AvatarStyleOption | null => {
  if (!isBuiltInAvatarValue(v)) return null;
  const key = v!.slice(AVATAR_ICON_PREFIX.length);
  return EXCHANGE_AVATAR_STYLES.find((a) => a.key === key) ?? null;
};

export const REPORT_REASONS: { key: string; en: string; ar: string }[] = [
  { key: "harassment", en: "Harassment or abuse", ar: "مضايقة أو إساءة" },
  { key: "inappropriate", en: "Inappropriate content", ar: "محتوى غير لائق" },
  { key: "fake", en: "Fake profile", ar: "حساب وهمي" },
  { key: "spam", en: "Spam or scam", ar: "رسائل مزعجة أو احتيال" },
  { key: "underage", en: "Appears underage", ar: "يبدو قاصرًا" },
  { key: "other", en: "Other", ar: "سبب آخر" },
];
