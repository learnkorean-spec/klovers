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

export const REPORT_REASONS: { key: string; en: string; ar: string }[] = [
  { key: "harassment", en: "Harassment or abuse", ar: "مضايقة أو إساءة" },
  { key: "inappropriate", en: "Inappropriate content", ar: "محتوى غير لائق" },
  { key: "fake", en: "Fake profile", ar: "حساب وهمي" },
  { key: "spam", en: "Spam or scam", ar: "رسائل مزعجة أو احتيال" },
  { key: "underage", en: "Appears underage", ar: "يبدو قاصرًا" },
  { key: "other", en: "Other", ar: "سبب آخر" },
];
