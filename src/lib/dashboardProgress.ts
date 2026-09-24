/**
 * Pure read-model for the student dashboard.
 *
 * Everything here derives from rows the app ALREADY stores — student_xp,
 * student_lesson_progress, textbook_lessons, student_badges,
 * achievement_milestones and profiles.course_level_key. Nothing is written,
 * no threshold is changed, and no value is invented: when the data for a
 * block does not exist the function returns null and the block says so.
 *
 * Kept free of React and Supabase so every rule is unit-tested
 * (src/lib/__tests__/dashboardProgress.test.ts).
 */
import { LEAGUES, BADGES, getLeague } from "@/constants/gamification";
import { LEVELS, normalizeLevel } from "@/constants/levels";

// ── Brand icon library ──────────────────────────────────────────────────────
/**
 * The Klovers icon library (Design System → Icons). Files live in
 * public/assets/icons/library/<name>.webp (96px) + <name>@2x.webp (192px).
 */
export type BrandIconName =
  | "hangul-card" | "conversation" | "headphones" | "notebook" | "open-book"
  | "flashcards" | "hanok" | "namsan" | "calendar" | "progress-path"
  | "reward-gift" | "cluby" | "teacher" | "small-group" | "speaking"
  | "listening" | "vocabulary" | "grammar" | "placement" | "bibimbap"
  | "hanbok" | "korea-map" | "subway" | "culture-fan" | "controller"
  | "puzzle" | "achievement-star" | "trophy" | "challenge" | "success"
  | "locked" | "progress" | "streak" | "favourite";

// ── XP / level ──────────────────────────────────────────────────────────────
export interface XpStatus {
  /** 1-based position on the existing league ladder ("Level 2"). */
  levelNumber: number;
  levelCount: number;
  leagueKey: string;
  leagueName: string;
  totalXp: number;
  /** XP where the current league starts / the next one starts. */
  floorXp: number;
  nextXp: number | null;
  nextLeagueKey: string | null;
  nextLeagueName: string | null;
  remaining: number;
  /** 0–100 inside the current league. 100 at the top league. */
  pct: number;
}

/**
 * Reads the EXISTING league thresholds (constants/gamification.ts). The
 * dashboard calls a league a "level" in copy, but the ladder, its names and
 * its numbers are untouched, so nobody's standing moves.
 */
export function xpStatus(totalXp: number): XpStatus {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  const league = getLeague(xp);
  const next = LEAGUES[league.index + 1] ?? null;
  const floorXp = league.minXp;
  const nextXp = next ? next.minXp : null;
  const pct = nextXp === null ? 100 : Math.max(0, Math.min(100, Math.round(((xp - floorXp) / (nextXp - floorXp)) * 100)));
  return {
    levelNumber: league.index + 1,
    levelCount: LEAGUES.length,
    leagueKey: league.key,
    leagueName: league.name,
    totalXp: xp,
    floorXp,
    nextXp,
    nextLeagueKey: next?.key ?? null,
    nextLeagueName: next?.name ?? null,
    remaining: nextXp === null ? 0 : Math.max(0, nextXp - xp),
    pct,
  };
}

// ── Streak ──────────────────────────────────────────────────────────────────
export type StreakState = "none" | "active_today" | "at_risk";

/** at_risk = a streak exists but nothing was logged today yet. */
export function streakState(current: number, lastActivityDate: string | null, today: string): StreakState {
  if (!current || current < 1) return "none";
  return lastActivityDate?.slice(0, 10) === today ? "active_today" : "at_risk";
}

/** YYYY-MM-DD in the viewer's local calendar (matches Monday-XP logic). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Today's missions ────────────────────────────────────────────────────────
export type MissionId = "game" | "word" | "lesson";

export interface Mission {
  id: MissionId;
  done: boolean;
  icon: BrandIconName;
}

/** activity_type values written by the textbook lesson flow. */
const LESSON_ACTIVITY = new Set(["vocab", "grammar", "dialogue", "exercise", "reading", "writing", "chapter", "challenge"]);
/** The word-of-the-day claim is recorded through the game XP path. */
export const WORD_OF_DAY_ACTIVITY = "game_vocab_daily";

/**
 * Three missions, each completed by an activity that already writes a
 * student_xp row — so "done" is read from the ledger, never stored twice.
 * Rows passed in must already be filtered to "today" (local midnight on).
 */
export function missionsFromActivity(activityTypes: string[], wordClaimedLocally = false): Mission[] {
  const types = new Set(activityTypes);
  const playedGame = activityTypes.some(a => a.startsWith("game_") && a !== WORD_OF_DAY_ACTIVITY);
  const learnedWord = types.has(WORD_OF_DAY_ACTIVITY) || wordClaimedLocally;
  const lessonStep = activityTypes.some(a => LESSON_ACTIVITY.has(a));
  return [
    { id: "lesson", done: lessonStep, icon: "open-book" },
    { id: "game", done: playedGame, icon: "controller" },
    { id: "word", done: learnedWord, icon: "flashcards" },
  ];
}

// ── Continue learning ───────────────────────────────────────────────────────
export interface LessonRow {
  id: number;
  book: string;
  sort_order: number;
  title_en: string | null;
  title_ar: string | null;
  title_ko: string | null;
  topik_level: number | null;
}

export interface LessonProgressRow {
  lesson_id: number;
  vocab_done: boolean | null;
  grammar_done: boolean | null;
  dialogue_done: boolean | null;
  exercises_done: boolean | null;
  reading_done: boolean | null;
  writing_done: boolean | null;
  chapter_completed: boolean | null;
  completed_at: string | null;
}

export const LESSON_STEP_COUNT = 6;

export function stepsDone(p: LessonProgressRow | undefined): number {
  if (!p) return 0;
  if (p.chapter_completed) return LESSON_STEP_COUNT;
  return [p.vocab_done, p.grammar_done, p.dialogue_done, p.exercises_done, p.reading_done, p.writing_done].filter(Boolean).length;
}

export type ContinueReason = "in_progress" | "next_after_completed" | "start_at_level";

export interface ContinueLesson {
  lesson: LessonRow;
  stepsDone: number;
  stepCount: number;
  pct: number;
  reason: ContinueReason;
  href: string;
}

const MAIN_BOOK = "korean-1";

/** Maps a course level key to the textbook's topik_level band. */
export function levelToTopikBand(levelKey: string | null | undefined): number {
  const key = normalizeLevel(levelKey || "");
  if (!key || key === "hangul") return 0;
  const m = /^l(\d)$/.exec(key);
  return m ? Number(m[1]) : 0;
}

/**
 * The one lesson a student should open next, decided from their own rows:
 *  1. a lesson they started and did not finish (latest book activity first);
 *  2. otherwise the lesson right after the most recently completed one;
 *  3. otherwise the first main-book lesson of their course level.
 */
export function pickContinueLesson(
  lessons: LessonRow[],
  progress: LessonProgressRow[],
  levelKey: string | null | undefined,
): ContinueLesson | null {
  if (!lessons.length) return null;
  const byId = new Map(lessons.map(l => [l.id, l]));
  const pById = new Map(progress.map(p => [p.lesson_id, p]));
  const ordered = (book: string) => lessons.filter(l => l.book === book).sort((a, b) => a.sort_order - b.sort_order);
  const make = (lesson: LessonRow, reason: ContinueReason): ContinueLesson => {
    const done = stepsDone(pById.get(lesson.id));
    return {
      lesson,
      stepsDone: done,
      stepCount: LESSON_STEP_COUNT,
      pct: Math.round((done / LESSON_STEP_COUNT) * 100),
      reason,
      href: `/textbook/${lesson.book}/${lesson.sort_order}`,
    };
  };

  // Book the student touched most recently (by completed_at), main book on ties.
  const completed = progress
    .filter(p => p.chapter_completed && byId.has(p.lesson_id))
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  const recentBook = completed[0] ? byId.get(completed[0].lesson_id)!.book : null;

  const started = progress
    .filter(p => !p.chapter_completed && stepsDone(p) > 0 && byId.has(p.lesson_id))
    .map(p => byId.get(p.lesson_id)!)
    .sort((a, b) => {
      const rank = (l: LessonRow) => (l.book === recentBook ? 0 : l.book === MAIN_BOOK ? 1 : 2);
      return rank(a) - rank(b) || a.sort_order - b.sort_order;
    });
  if (started[0]) return make(started[0], "in_progress");

  if (completed[0]) {
    const last = byId.get(completed[0].lesson_id)!;
    const next = ordered(last.book).find(l => l.sort_order > last.sort_order && !pById.get(l.id)?.chapter_completed);
    if (next) return make(next, "next_after_completed");
  }

  const band = levelToTopikBand(levelKey);
  const main = ordered(MAIN_BOOK).filter(l => !pById.get(l.id)?.chapter_completed);
  const atLevel = main.find(l => (l.topik_level ?? 0) === band) ?? main[0];
  return atLevel ? make(atLevel, "start_at_level") : null;
}

// ── Learning journey (course levels) ────────────────────────────────────────
export type JourneyState = "completed" | "current" | "locked";

export interface JourneyStop {
  key: string;
  order: number;
  labelEn: string;
  labelAr: string;
  icon: BrandIconName;
  state: JourneyState;
  /** Larger node for the milestone stops. */
  milestone: boolean;
}

const JOURNEY_ICON: Record<string, BrandIconName> = {
  hangul: "hangul-card",
  l1: "conversation",
  l2: "flashcards",
  l3: "achievement-star",
  l4: "streak",
  l5: "trophy",
  l6: "open-book",
};

/** Seven stops = the seven course levels in constants/levels.ts. */
export function journeyStops(levelKey: string | null | undefined): { stops: JourneyStop[]; currentIndex: number } {
  const key = normalizeLevel(levelKey || "");
  const ordered = [...LEVELS].sort((a, b) => a.order - b.order);
  const currentIndex = ordered.findIndex(l => l.key === key);
  const stops = ordered.map((l, i) => ({
    key: l.key,
    order: i,
    labelEn: l.shortLabel,
    labelAr: l.shortLabel_ar,
    icon: JOURNEY_ICON[l.key] ?? "progress-path",
    state: (currentIndex < 0 ? "locked" : i < currentIndex ? "completed" : i === currentIndex ? "current" : "locked") as JourneyState,
    milestone: l.key === "hangul" || l.key === "l3" || l.key === "l6",
  }));
  return { stops, currentIndex };
}

// ── Badges → collection ─────────────────────────────────────────────────────
const BADGE_ICON: Record<string, BrandIconName> = {
  hangul_master: "hangul-card",
  first_100_words: "flashcards",
  grammar_starter: "notebook",
  conversation_beginner: "conversation",
  topik_ready: "trophy",
  streak_3: "streak",
  streak_7: "streak",
  streak_14: "streak",
  streak_30: "streak",
  first_chapter: "open-book",
  five_chapters: "progress-path",
  perfect_exercise: "achievement-star",
  boss_slayer: "challenge",
  seoul_explorer: "namsan",
  game_starter: "controller",
  game_master: "trophy",
  perfect_game: "achievement-star",
  review_rookie: "flashcards",
  early_bird: "calendar",
  bilingual_explorer: "korea-map",
};

export function badgeIcon(key: string): BrandIconName {
  return BADGE_ICON[key] ?? "achievement-star";
}

export interface EarnedBadge { badge_key: string; earned_at: string | null }

export function recentAchievements(rows: EarnedBadge[], limit = 3) {
  return [...rows]
    .filter(r => BADGES.some(b => b.key === r.badge_key))
    .sort((a, b) => (b.earned_at ?? "").localeCompare(a.earned_at ?? ""))
    .slice(0, limit)
    .map(r => ({ ...r, badge: BADGES.find(b => b.key === r.badge_key)!, icon: badgeIcon(r.badge_key) }));
}

export interface MilestoneRow {
  milestone_type: string;
  milestone_tier: number;
  milestone_name: string;
  target_value: number;
  progress_value: number;
  is_achieved: boolean;
}

/**
 * The closest unfinished milestone — the server keeps progress_value current
 * (see hooks/useMilestones.ts), so this is a real "2 / 3" and never a guess.
 * A row at/over target but not yet flagged achieved is skipped: showing
 * "0 left" for something the server has not granted would be a false promise.
 */
export function nextUnlock(milestones: MilestoneRow[]): (MilestoneRow & { pct: number; left: number }) | null {
  const open = milestones
    .filter(m => !m.is_achieved && m.target_value > 0 && m.progress_value < m.target_value)
    .map(m => ({ ...m, pct: Math.min(99, Math.round((m.progress_value / m.target_value) * 100)), left: Math.max(0, m.target_value - m.progress_value) }))
    .sort((a, b) => b.pct - a.pct || a.left - b.left || a.milestone_tier - b.milestone_tier);
  return open[0] ?? null;
}

// ── Book display names (same wording as TextbookHubPage) ────────────────────
const BOOK_NAMES: Record<string, { en: string; ar: string }> = {
  "korean-1": { en: "Korean Textbook", ar: "كتاب الكورية" },
  "daily-routine": { en: "Daily Routine Korean", ar: "كورية الروتين اليومي" },
  kdrama: { en: "K-Drama Korean", ar: "كورية الدراما" },
  "grammar-mastery": { en: "Grammar Mastery", ar: "إتقان القواعد" },
  "picture-vocab": { en: "Picture Vocabulary", ar: "مفردات الصور" },
};

export function bookName(book: string, language: "en" | "ar"): string {
  const n = BOOK_NAMES[book];
  if (!n) return book;
  return language === "ar" ? n.ar : n.en;
}
