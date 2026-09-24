import { describe, expect, it } from "vitest";
import {
  xpStatus, streakState, missionsFromActivity, pickContinueLesson, journeyStops,
  recentAchievements, nextUnlock, levelToTopikBand, eggStatus, worldLabel, type LessonRow, type LessonProgressRow,
} from "../dashboardProgress";
import { LEAGUES } from "@/constants/gamification";

const L = (id: number, book: string, sort: number, topik = 1): LessonRow =>
  ({ id, book, sort_order: sort, title_en: `L${sort}`, title_ar: null, title_ko: null, topik_level: topik });
const P = (lesson_id: number, extra: Partial<LessonProgressRow> = {}): LessonProgressRow => ({
  lesson_id, vocab_done: false, grammar_done: false, dialogue_done: false, exercises_done: false,
  reading_done: false, writing_done: false, chapter_completed: false, completed_at: null, ...extra,
});

describe("xpStatus reads the existing league ladder", () => {
  it("never moves a threshold", () => {
    expect(LEAGUES.map(l => l.minXp)).toEqual([0, 200, 500, 1000, 2000, 3500, 5500]);
  });
  it("shows current / next and what is left", () => {
    const s = xpStatus(185);
    expect(s).toMatchObject({ levelNumber: 1, leagueKey: "beginner", nextXp: 200, remaining: 15, nextLeagueKey: "hangul" });
    expect(s.pct).toBe(93);
  });
  it("is exact on a boundary", () => {
    expect(xpStatus(200)).toMatchObject({ levelNumber: 2, remaining: 300, pct: 0 });
  });
  it("tops out cleanly", () => {
    expect(xpStatus(9000)).toMatchObject({ levelNumber: 7, nextXp: null, remaining: 0, pct: 100 });
  });
  it("treats bad input as zero", () => {
    expect(xpStatus(-5 as number).totalXp).toBe(0);
  });
});

describe("streakState", () => {
  it("none / active / at risk", () => {
    expect(streakState(0, null, "2026-09-24")).toBe("none");
    expect(streakState(2, "2026-09-24", "2026-09-24")).toBe("active_today");
    expect(streakState(2, "2026-09-23", "2026-09-24")).toBe("at_risk");
  });
});

describe("missions come from today's XP ledger", () => {
  it("maps activity types to the three missions", () => {
    const m = missionsFromActivity(["game_match", "grammar"]);
    expect(m.map(x => [x.id, x.done])).toEqual([["lesson", true], ["game", true], ["word", false]]);
  });
  it("the word-of-day claim is not a game", () => {
    const m = missionsFromActivity(["game_vocab_daily"]);
    expect(m.find(x => x.id === "game")!.done).toBe(false);
    expect(m.find(x => x.id === "word")!.done).toBe(true);
  });
  it("daily bonus alone completes nothing", () => {
    expect(missionsFromActivity(["daily_bonus"]).every(x => !x.done)).toBe(true);
  });
});

describe("pickContinueLesson", () => {
  const lessons = [L(1, "korean-1", 1, 0), L(2, "korean-1", 2, 0), L(11, "korean-1", 11, 1), L(12, "korean-1", 12, 1), L(50, "kdrama", 1)];
  it("resumes a started lesson first", () => {
    const c = pickContinueLesson(lessons, [P(12, { vocab_done: true, grammar_done: true, reading_done: true })], "l1")!;
    expect(c).toMatchObject({ reason: "in_progress", stepsDone: 3, pct: 50, href: "/textbook/korean-1/12" });
  });
  it("otherwise goes to the lesson after the latest completed one", () => {
    const c = pickContinueLesson(lessons, [P(1, { chapter_completed: true, completed_at: "2026-09-01" })], "hangul")!;
    expect(c).toMatchObject({ reason: "next_after_completed", href: "/textbook/korean-1/2" });
  });
  it("otherwise starts at the student's course level", () => {
    expect(pickContinueLesson(lessons, [], "level_1")!.lesson.id).toBe(11);
    expect(pickContinueLesson(lessons, [], null)!.lesson.id).toBe(1);
  });
  it("returns null without lessons", () => {
    expect(pickContinueLesson([], [], "l1")).toBeNull();
  });
  it("maps legacy level keys", () => {
    expect(levelToTopikBand("level_2")).toBe(2);
    expect(levelToTopikBand("hangul")).toBe(0);
  });
});

describe("journeyStops", () => {
  it("marks completed / current / locked from the course level", () => {
    const { stops, currentIndex } = journeyStops("level_2");
    expect(currentIndex).toBe(2);
    expect(stops.map(s => s.state)).toEqual(["completed", "completed", "current", "locked", "locked", "locked", "locked"]);
    expect(stops.map(s => s.icon)).toEqual(["hangul-card", "flashcards", "conversation", "hanok", "passport", "passport", "passport"]);
  });
  it("tells the levels as the story worlds; the Memory Garden is not a level stop", () => {
    const { stops } = journeyStops("level_2");
    expect(stops.map(s => s.world)).toEqual([
      "hangul-village", "vocabulary-market", "conversation-cafe", "culture-street",
      "seoul-journey", "seoul-journey", "seoul-journey",
    ]);
    expect(worldLabel(stops[2], "en")).toBe("Conversation Café");
    expect(worldLabel(stops[5], "en")).toBe("Seoul Journey · Part 2");
    expect(worldLabel(stops[1], "ar")).toBe("سوق المفردات");
    expect(stops.filter(s => s.milestone).map(s => s.key)).toEqual(["hangul", "l1", "l2", "l3", "l4"]);
  });
  it("is all locked when no level is known", () => {
    expect(journeyStops("").stops.every(s => s.state === "locked")).toBe(true);
  });
});

describe("achievements + next unlock", () => {
  it("keeps the 3 most recent real badges", () => {
    const r = recentAchievements([
      { badge_key: "streak_3", earned_at: "2026-09-01" },
      { badge_key: "game_starter", earned_at: "2026-09-10" },
      { badge_key: "not_a_badge", earned_at: "2026-09-20" },
      { badge_key: "first_chapter", earned_at: "2026-09-05" },
      { badge_key: "hangul_master", earned_at: "2026-08-01" },
    ]);
    expect(r.map(x => x.badge_key)).toEqual(["game_starter", "first_chapter", "streak_3"]);
    expect(r[0].icon).toBe("controller");
  });
  it("picks the closest unfinished milestone", () => {
    const n = nextUnlock([
      { milestone_type: "xp_earned", milestone_tier: 1, milestone_name: "A", target_value: 100, progress_value: 20, is_achieved: false },
      { milestone_type: "games", milestone_tier: 1, milestone_name: "B", target_value: 3, progress_value: 2, is_achieved: false },
      { milestone_type: "games", milestone_tier: 0, milestone_name: "C", target_value: 1, progress_value: 1, is_achieved: true },
    ])!;
    expect(n).toMatchObject({ milestone_name: "B", left: 1, pct: 67 });
  });
  it("returns null when nothing is open", () => {
    expect(nextUnlock([])).toBeNull();
  });
});

describe("nextUnlock skips rows the server has not granted yet", () => {
  it("ignores progress >= target that is not achieved", () => {
    expect(nextUnlock([{ milestone_type: "streak_days", milestone_tier: 1, milestone_name: "7 Day Streak", target_value: 7, progress_value: 7, is_achieved: false }])).toBeNull();
  });
});

describe("eggStatus follows the canon awakening from real rows only", () => {
  it("is dormant with no learning", () => {
    expect(eggStatus([], [], [])).toEqual({ stage: 0, hatchedAt: null });
  });
  it("cracks on the first word (vocab step or word of the day)", () => {
    expect(eggStatus([P(1, { vocab_done: true })], [], []).stage).toBe(1);
    expect(eggStatus([], [], ["game_vocab_daily"]).stage).toBe(1);
  });
  it("glows on the first sentence (grammar or writing step)", () => {
    expect(eggStatus([P(1, { vocab_done: true, grammar_done: true })], [], []).stage).toBe(2);
  });
  it("hatches on the first whole lesson and never goes backwards", () => {
    const e = eggStatus([P(1, { chapter_completed: true, completed_at: "2026-09-20T10:00:00Z" }), P(2, { chapter_completed: true, completed_at: "2026-09-01T10:00:00Z" })], [], []);
    expect(e).toEqual({ stage: 3, hatchedAt: "2026-09-01T10:00:00Z" });
  });
  it("counts the conversation badge as hatched", () => {
    expect(eggStatus([], [{ badge_key: "conversation_beginner", earned_at: "2026-08-01T00:00:00Z" }], []).stage).toBe(3);
  });
});
