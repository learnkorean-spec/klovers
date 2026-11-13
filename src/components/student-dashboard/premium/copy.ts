import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Copy for the redesigned dashboard blocks. Kept beside the components (not
 * in translations.ts) so this PR does not touch the shared i18n files other
 * work is editing. Every string has both languages; Arabic is Modern
 * Standard Arabic, matching the rest of the dashboard.
 */
const COPY = {
  welcomeBack: { en: "Welcome back, {name}", ar: "أهلًا بعودتك يا {name}" },
  levelOf: { en: "{n}/{total}", ar: "{n}/{total}" },
  leagueRankAria: { en: "XP league {n} of {total}", ar: "دوري النقاط {n} من {total}" },
  xpUnit: { en: "XP", ar: "نقطة خبرة" },
  xpToNext: { en: "{n} XP to {league}", ar: "{n} نقطة خبرة حتى {league}" },
  xpTop: { en: "top level reached", ar: "تم بلوغ أعلى مستوى" },
  xpBarLabel: { en: "Progress to the next level", ar: "التقدّم نحو المستوى التالي" },
  streakDays: { en: "{n}-day streak", ar: "سلسلة {days}" },
  streakNone: { en: "Start a streak today", ar: "بداية سلسلة جديدة اليوم" },
  streakAtRisk: { en: "Learn today to keep it", ar: "درس اليوم يحفظ السلسلة" },
  continueLearning: { en: "Continue learning", ar: "متابعة التعلّم" },
  startLearning: { en: "Start learning", ar: "بدء التعلّم" },

  // Cluby (Latin notes use the handwriting face; Arabic stays in Cairo)
  clubyMissionsDone: { en: "Missions complete!", ar: "اكتملت مهام اليوم!" },
  clubyAlmost: { en: "Almost there!", ar: "اقتربنا جدًا!" },
  clubyStreak: { en: "{n} days strong!", ar: "{days} من التعلّم!" },
  clubyAtRisk: { en: "Keep the streak alive!", ar: "لنحافظ على السلسلة!" },
  clubyHello: { en: "Let's learn!", ar: "هيا نتعلّم!" },
  // Canon: Cluby is the memory keeper — he remembers, he doesn't hide.
  clubyFound: { en: "I'll remember this one!", ar: "سأتذكّر هذه!" },
  clubyAlt: { en: "Cluby, your study companion", ar: "كلوبي، رفيقك في التعلّم" },

  // Cluby's clover egg (canon awakening sequence, from real progress only)
  eggAria: { en: "Cluby's clover egg", ar: "بيضة البرسيم" },
  eggTitle0: { en: "A clover egg is waiting for you", ar: "بيضة البرسيم في انتظارك" },
  eggBody0: { en: "It reacts to real learning. Learn your first Korean word and see what happens.", ar: "إنها تتفاعل مع التعلّم الحقيقي وحده. أول كلمة كورية ستكشف ما سيحدث." },
  eggTitle1: { en: "The egg cracked!", ar: "تشقّقت البيضة!" },
  eggBody1: { en: "Your first word woke it a little. Finish a grammar step to make it glow.", ar: "الكلمة الأولى أيقظتها قليلًا. خطوة قواعد واحدة تجعلها تتوهّج." },
  eggTitle2: { en: "The egg is glowing", ar: "البيضة تتوهّج" },
  eggBody2: { en: "Your first sentence made it glow. Complete a whole lesson, dialogue included, to hatch it.", ar: "الجملة الأولى جعلتها تتوهّج. درس كامل، بما فيه الحوار، يجعلها تفقس." },
  eggHatchedTitle: { en: "Cluby hatched!", ar: "فقس كلوبي!" },
  eggHatchedBody: { en: "His first word was 안녕! From now on he learns alongside you.", ar: "أول كلمة قالها: 안녕! ومن الآن سيتعلّم معك." },
  eggCatchUpTitle: { en: "You've already learned enough to wake him", ar: "ما جرى تعلّمه حتى الآن يكفي لإيقاظه" },
  eggCatchUpBody: { en: "Meet Cluby. His first word was 안녕! He'll remember what you learn.", ar: "هذا كلوبي. أول كلمة قالها: 안녕! وسيتذكّر كل ما يُتعلَّم." },
  eggStep1: { en: "First word", ar: "أول كلمة" },
  eggStep2: { en: "First sentence", ar: "أول جملة" },
  eggStep3: { en: "First conversation", ar: "أول محادثة" },
  eggDismiss: { en: "Close", ar: "إغلاق" },

  // Continue learning
  continueEyebrow: { en: "Continue learning", ar: "متابعة التعلّم" },
  lessonN: { en: "Lesson {n}", ar: "الدرس {n}" },
  stepsProgress: { en: "{done} of {total} steps · {pct}%", ar: "{done} من {total} خطوات · {pct}%" },
  notStarted: { en: "Not started yet", ar: "لم يبدأ بعد" },
  continueBtn: { en: "Continue", ar: "متابعة" },
  startBtn: { en: "Start lesson", ar: "بدء الدرس" },
  reasonInProgress: { en: "Pick up where you left off", ar: "الاستئناف من نقطة التوقف" },
  reasonNext: { en: "Your next lesson", ar: "الدرس التالي" },
  reasonStart: { en: "Recommended for your level", ar: "مقترح لهذا المستوى" },
  noLesson: { en: "Choose a book to begin.", ar: "البداية باختيار كتاب." },
  openLibrary: { en: "Open the library", ar: "فتح المكتبة" },
  loadError: { en: "We couldn't load your progress.", ar: "تعذّر تحميل التقدّم." },
  retry: { en: "Try again", ar: "إعادة المحاولة" },

  // Missions
  missionsTitle: { en: "Today's missions", ar: "مهام اليوم" },
  missionsCount: { en: "{done}/{total} done", ar: "{done}/{total} مكتملة" },
  missionLesson: { en: "Do one textbook step", ar: "إنجاز خطوة واحدة في الكتاب" },
  missionLessonSub: { en: "Vocabulary, grammar, reading…", ar: "مفردات، قواعد، قراءة…" },
  missionGame: { en: "Play one game", ar: "لعب لعبة واحدة" },
  missionGameSub: { en: "Any game in Games", ar: "أي لعبة من الألعاب" },
  missionWord: { en: "Learn today's word", ar: "تعلّم كلمة اليوم" },
  missionDone: { en: "Done", ar: "تمّت" },
  missionGo: { en: "Go", ar: "بدء" },
  missionPlay: { en: "Play", ar: "لعب" },
  missionsReward: { en: "Every mission adds XP to your level.", ar: "كل مهمة تضيف نقاط الخبرة إلى مستواك." },
  missionsAllDone: { en: "All done for today. See you tomorrow!", ar: "اكتملت كل مهام اليوم. إلى اللقاء غدًا!" },

  // Journey
  journeyTitle: { en: "Your learning journey", ar: "رحلة التعلّم" },
  journeyDone: { en: "{done} of {total} levels complete", ar: "اكتمل {done} من {total} مستويات" },
  journeyYouAreIn: { en: "You're in {world}", ar: "الموقع الحالي: {world}" },
  journeyUnknown: { en: "Take the placement test to place yourself on the map.", ar: "اختبار تحديد المستوى يحدّد الموقع على الخريطة." },
  journeyFindLevel: { en: "Find my level", ar: "تحديد المستوى" },
  stateCompleted: { en: "completed", ar: "مكتمل" },
  stateCurrent: { en: "you are here", ar: "الموقع الحالي" },
  stateLocked: { en: "locked", ar: "مغلق" },

  // Collection
  collectionTitle: { en: "My collection", ar: "مجموعتي" },
  collectionCount: { en: "{n} / {total} badges", ar: "{n} / {total} شارة" },
  nextUnlock: { en: "Next unlock", ar: "الإنجاز التالي" },
  nextLeft: { en: "{n} more to unlock", ar: "باقٍ {n} للفتح" },
  nextNone: { en: "Keep learning, new goals appear as you grow.", ar: "مع مواصلة التعلّم تظهر أهداف جديدة عند كل تقدّم." },
  viewAll: { en: "View all", ar: "عرض الكل" },
  lockedBadge: { en: "Locked: {name}", ar: "مغلقة: {name}" },

  // Milestones (names come from the database in English only)
  ms_lessons_completed: { en: "Complete {n} lessons", ar: "إكمال {lessons}" },
  ms_streak_days: { en: "Reach a {n}-day streak", ar: "تحقيق سلسلة {days}" },
  ms_vocabulary_mastered: { en: "Master {n} words", ar: "إتقان {n} كلمة" },
  ms_xp_earned: { en: "Earn {n} XP", ar: "جمع {n} نقطة خبرة" },

  // Achievements
  achievementsTitle: { en: "Recent achievements", ar: "أحدث الإنجازات" },
  achievementsEmpty: { en: "Your first badge is one game away.", ar: "شارتك الأولى على بُعد لعبة واحدة." },
  viewAllAchievements: { en: "View all achievements", ar: "عرض كل الإنجازات" },

  // Sections
  nextClassTitle: { en: "Next class", ar: "الحصة القادمة" },
  accountTitle: { en: "My classes & account", ar: "حصصي وحسابي" },
  morePractice: { en: "More practice", ar: "تدريب إضافي" },
  insightsTitle: { en: "Learning insights", ar: "إحصاءات التعلّم" },
  exportProgress: { en: "Export progress (.txt)", ar: "تصدير التقدّم (.txt)" },

  // Tabs (13 Nov 2026): one page became four short ones after a new student
  // said the dashboard was complicated and crowded.
  tabsAria: { en: "Dashboard sections", ar: "أقسام لوحتي" },
  tabToday: { en: "Today", ar: "اليوم" },
  tabClasses: { en: "Classes", ar: "حصصي" },
  tabProgress: { en: "Progress", ar: "تقدّمي" },
  tabExplore: { en: "Explore", ar: "استكشاف" },

  // New-student start: three steps and nothing else.
  startTitle: { en: "Three steps to begin", ar: "ثلاث خطوات للبداية" },
  startBody: { en: "One step at a time. Everything else opens up as you learn.", ar: "خطوة واحدة في كل مرة، وكل شيء آخر يأتي مع التعلّم." },
  startLevelTitle: { en: "Find your level", ar: "تحديد المستوى" },
  startLevelBody: { en: "A short test that places you in the right class.", ar: "اختبار قصير يحدّد الصف المناسب." },
  startLevelCta: { en: "Take the test", ar: "بدء الاختبار" },
  startLevelDone: { en: "Your level: {level}", ar: "المستوى الحالي: {level}" },
  startLessonTitle: { en: "Open your first lesson", ar: "الدرس الأول" },
  startLessonBody: { en: "A few minutes is enough to learn your first Korean words.", ar: "دقائق قليلة تكفي لتعلّم أولى الكلمات الكورية." },
  startLessonCta: { en: "Start the lesson", ar: "بدء الدرس" },
  startClassTitle: { en: "Book a free trial class", ar: "حجز حصة تجريبية مجانية" },
  startClassBody: { en: "Meet the teacher in a live class before you enroll.", ar: "لقاء مباشر مع المعلّمة قبل التسجيل." },
  startClassCta: { en: "Book the trial", ar: "حجز الحصة" },
  startEnrollLink: { en: "Ready already? Enroll now", ar: "جاهز للبدء؟ التسجيل الآن" },
  startStepOf: { en: "Step {n}", ar: "الخطوة {n}" },
  startDone: { en: "Done", ar: "تمّت" },

  // Explore doors (one slim row on Today; the full cards live in Explore)
  doorsTitle: { en: "Explore", ar: "استكشاف" },
  doorWorld: { en: "KLOVERS World", ar: "عالم كلوفرز" },
  doorExchange: { en: "Language exchange", ar: "تبادل اللغة" },
  doorAudio: { en: "Hangul book audio", ar: "صوت كتاب الهانغل" },
  doorsMore: { en: "See all", ar: "عرض الكل" },
  collectionSection: { en: "Collection and achievements", ar: "المجموعة والإنجازات" },

  // One-tap clarity question
  clarityQuestion: { en: "Is this page clear?", ar: "هل هذه الصفحة واضحة؟" },
  clarityYes: { en: "Yes, clear", ar: "نعم، واضحة" },
  clarityNo: { en: "A bit confusing", ar: "مربكة قليلًا" },
  clarityThanks: { en: "Thank you. That helps us improve.", ar: "شكرًا، رأيك يساعدنا على التحسين." },
} as const;

export type CopyKey = keyof typeof COPY;

export function useDashCopy() {
  const { language } = useLanguage();
  const lang: "en" | "ar" = language === "ar" ? "ar" : "en";
  const c = useCallback(
    (key: CopyKey, vars?: Record<string, string | number>) => {
      let s: string = COPY[key][lang];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    [lang],
  );
  return { c, lang };
}

/** Western digits in both languages (same choice as the rest of the dashboard). */
export function fmt(n: number, lang: "en" | "ar") {
  return n.toLocaleString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US");
}

/**
 * Arabic counted nouns: 1 → singular, 2 → dual, 3–10 → plural, 11+ → accusative
 * singular. Used where a number sits next to "day" or "lesson".
 */
const AR_NOUNS = {
  days: { one: "يوم واحد", two: "يومان", few: "أيام", many: "يومًا" },
  lessons: { one: "درس واحد", two: "درسان", few: "دروس", many: "درسًا" },
} as const;

export function arCount(n: number, noun: keyof typeof AR_NOUNS): string {
  const w = AR_NOUNS[noun];
  if (n === 1) return w.one;
  if (n === 2) return w.two;
  const mod = n % 100;
  if (mod >= 3 && mod <= 10) return `${n} ${w.few}`;
  return `${n} ${w.many}`;
}
