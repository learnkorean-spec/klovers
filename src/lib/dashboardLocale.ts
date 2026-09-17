/**
 * Arabic display helpers for the student dashboard. Data (league/badge keys,
 * clock strings) stays English internally; only what the student sees changes.
 */
type Lang = "en" | "ar";

/** "7:00 PM" → "7:00 م" in Arabic; unchanged in English. */
export function localizeClock(value: string, language: Lang): string {
  if (language !== "ar" || !value) return value;
  return value.replace(/\bAM\b/i, "ص").replace(/\bPM\b/i, "م");
}

const LEAGUE_AR: Record<string, string> = {
  beginner: "دوري المبتدئين",
  hangul: "دوري الهانغل",
  conversation: "دوري المحادثة",
  grammar: "دوري القواعد",
  topik_rookie: "دوري TOPIK للمبتدئين",
  topik_challenger: "دوري TOPIK للمتحدّين",
  topik_master: "دوري أبطال TOPIK",
};

const BADGE_AR: Record<string, { name: string; description: string }> = {
  hangul_master: { name: "أستاذ الهانغل", description: "أكمل الدرس 1: مقدمة في الهانغل" },
  first_100_words: { name: "أول 100 كلمة", description: "تعلّم 100 كلمة" },
  grammar_starter: { name: "بداية القواعد", description: "أكمل 5 تمارين قواعد" },
  conversation_beginner: { name: "بداية المحادثة", description: "أكمل 5 تدريبات حوار" },
  topik_ready: { name: "جاهز لـ TOPIK", description: "أكمل كل الدروس الـ 45" },
  streak_3: { name: "3 أيام متتالية", description: "ذاكر 3 أيام متتالية" },
  streak_7: { name: "بطل الأسبوع", description: "ذاكر 7 أيام متتالية" },
  streak_14: { name: "بطل الأسبوعين", description: "ذاكر 14 يومًا متتاليًا" },
  streak_30: { name: "بطل الشهر", description: "ذاكر 30 يومًا متتاليًا" },
  first_chapter: { name: "أول مهمة مكتملة", description: "أكمل أول فصل لك" },
  five_chapters: { name: "خبير المهام", description: "أكمل 5 فصول" },
  perfect_exercise: { name: "درجة كاملة", description: "احصل على 100% في تمرين" },
  boss_slayer: { name: "قاهر التحدي الكبير", description: "أكمل تحديًا كبيرًا" },
  seoul_explorer: { name: "مستكشف سيول", description: "أكمل مهمة سفر" },
  game_starter: { name: "أول لعبة", description: "أكمل أول لعبة لك" },
  game_master: { name: "بطل الألعاب", description: "أكمل 10 ألعاب" },
  perfect_game: { name: "لعبة مثالية", description: "احصل على الدرجة الكاملة في أي لعبة" },
  review_rookie: { name: "بداية المراجعة", description: "أكمل 10 جلسات مراجعة مفردات" },
  early_bird: { name: "المبكّر", description: "ذاكر قبل الساعة 8 صباحًا" },
  bilingual_explorer: { name: "مستكشف الكتب", description: "أكمل دروسًا في كتابين مختلفين" },
};

export function leagueName(league: { key: string; name: string } | null | undefined, language: Lang): string {
  if (!league) return "";
  return language === "ar" ? LEAGUE_AR[league.key] ?? league.name : league.name;
}

export function badgeText(
  badge: { key: string; name: string; description: string },
  language: Lang,
): { name: string; description: string } {
  if (language === "ar" && BADGE_AR[badge.key]) return BADGE_AR[badge.key];
  return { name: badge.name, description: badge.description };
}
