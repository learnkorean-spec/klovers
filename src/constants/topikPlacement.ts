import {
  PLACEMENT_QUESTIONS,
  type PlacementQuestion,
} from "@/constants/placementQuestions";
import {
  SEJONG1_SECTIONS,
  SEJONG1_QUESTIONS,
  computeUnitPlacement,
  type SejongSectionId,
} from "@/constants/sejong1Placement";

/**
 * The merged Korean placement test: one test, one answer, expressed as a TOPIK
 * grade (급).
 *
 * It runs in two stages.
 *
 *   Stage 1 — the 세종한국어 1 bank (sections A–F, 50 questions). Sections are
 *   ordered easiest-first and the student is placed at the FIRST section they
 *   fail, so a true beginner answers eight questions and stops. Failing the
 *   Hangul section means they are not yet at 1급; failing any later section
 *   means they are inside 1급.
 *
 *   Stage 2 — twelve questions reused from the older course-level bank, only
 *   for students who cleared the whole of stage 1. Six decide whether they hold
 *   2급; six more decide whether they are past it.
 *
 * WHY THE CEILING IS "3급 이상" AND NOT A NUMBER
 * ---------------------------------------------
 * The old bank's TOPIK 5–6 items are English questions ABOUT Korean grammar
 * terms ("What does -기는커녕 express?"). Someone who memorised a grammar list
 * can answer them without reading a word of Korean, so a high score there is
 * not evidence of 5급. Those six questions are deliberately NOT used here, and
 * anything above 2급 is reported as a range. Reporting "5급" from this evidence
 * would be a made-up number, and a placement test that overstates a level costs
 * a real student a term in a class they cannot follow.
 *
 * Stage 2 questions are IMPORTED, never copied, so there is one source of truth
 * for their wording, options and answers. They are selected by their `level`
 * string rather than by array position, because the older file's array order is
 * load-bearing elsewhere and would silently reshuffle these if it ever changed.
 */

/** The old bank's level strings. The dash in the range labels is an en dash. */
const LEVEL_TOPIK_2 = "TOPIK 2";
const LEVEL_TOPIK_34 = "TOPIK 3–4";

const byLevel = (level: string): PlacementQuestion[] =>
  PLACEMENT_QUESTIONS.filter((q) => q.level === level);

/** Six questions that decide whether the student holds 2급. */
export const STAGE2_GRADE2: PlacementQuestion[] = byLevel(LEVEL_TOPIK_2);
/** Six more that decide whether they are past 2급. */
export const STAGE2_ABOVE: PlacementQuestion[] = byLevel(LEVEL_TOPIK_34);
export const STAGE2_QUESTIONS: PlacementQuestion[] = [...STAGE2_GRADE2, ...STAGE2_ABOVE];

/** Correct answers needed in each six-question stage-2 block. */
export const STAGE2_BLOCK_PASS = 4;

if (import.meta.env.DEV) {
  // Selection is by string match against another file. If that file's labels
  // are ever edited, fail loudly here rather than silently shipping a
  // stage 2 with no questions in it.
  if (STAGE2_GRADE2.length !== 6 || STAGE2_ABOVE.length !== 6) {
    throw new Error(
      `topikPlacement: expected 6 questions per stage-2 block, got ` +
        `${STAGE2_GRADE2.length} and ${STAGE2_ABOVE.length}. ` +
        `Check the level strings in placementQuestions.ts.`,
    );
  }
}

export type TopikGrade = "pre1" | "g1" | "g2" | "g3plus";

export interface TopikGradeInfo {
  grade: TopikGrade;
  /** What the student sees, e.g. "2급" */
  labelKo: string;
  labelAr: string;
  labelEn: string;
  /** One line of plain explanation under the grade */
  noteAr: string;
  noteEn: string;
  /**
   * Canonical Klovers level key (src/constants/levels.ts) this grade maps to.
   * Written to placement_tests.level and profiles.course_level_key, both of
   * which only accept keys that exist in course_levels.
   */
  levelKey: string;
}

export const TOPIK_GRADES: Record<TopikGrade, TopikGradeInfo> = {
  pre1: {
    grade: "pre1",
    labelKo: "한글 기초",
    labelAr: "قبل المستوى الأول — تأسيس الهانغول",
    labelEn: "Before 1급 — Hangul foundation",
    noteAr: "تبدأ من قراءة الحروف الكورية. ده أساس كل حاجة بعده.",
    noteEn: "You start from reading the Korean alphabet — everything else builds on it.",
    levelKey: "hangul",
  },
  g1: {
    grade: "g1",
    labelKo: "1급",
    labelAr: "المستوى الأول (1급)",
    labelEn: "TOPIK level 1 (1급)",
    noteAr: "تقرأ الهانغول وتتعامل مع تراكيب المستوى الأول.",
    noteEn: "You read Hangul and handle level 1 sentence patterns.",
    levelKey: "l1",
  },
  g2: {
    grade: "g2",
    labelKo: "2급",
    labelAr: "المستوى الثاني (2급)",
    labelEn: "TOPIK level 2 (2급)",
    noteAr: "أنهيت المستوى الأول بالكامل وتتعامل مع جُمل أطول وزمن ماضٍ ومستقبل.",
    noteEn: "Level 1 is behind you: you handle longer sentences, past and future.",
    levelKey: "l2",
  },
  g3plus: {
    grade: "g3plus",
    labelKo: "3급 이상",
    labelAr: "المستوى الثالث فأعلى (3급 이상)",
    labelEn: "TOPIK level 3 or above (3급 이상)",
    noteAr:
      "فوق المستوى الثاني بوضوح. الاختبار ده مابيحددش رقمًا دقيقًا فوق كده — المدرّس هو اللي يحدده في مقابلة قصيرة.",
    noteEn:
      "Clearly past level 2. This test does not put a precise number above that — a short interview with a teacher does.",
    levelKey: "l3",
  },
};

/**
 * Two students can both be 1급 and need opposite things: one still has gaps
 * inside the book, the other finished it and simply did not clear the 2급
 * block. Same grade, different next step, so the page says which.
 */
export const G1_NUANCE = {
  inside: {
    ar: "لسه في أجزاء من المستوى الأول محتاجة شغل.",
    en: "Parts of level 1 still need work.",
  },
  completed: {
    ar: "أنهيت المستوى الأول بالكامل، وعلى بُعد خطوة من الثاني.",
    en: "You have finished level 1 and are one step from level 2.",
  },
} as const;

export interface TopikPlacementResult {
  info: TopikGradeInfo;
  /** Per-section correct answers for stage 1 (A–F) */
  sejongSectionScores: Record<SejongSectionId, number>;
  /** Stage 1 total, out of 50 */
  sejongScore: number;
  /** The stage-1 section that decided the placement, null if all were passed */
  failedSection: SejongSectionId | null;
  /** Correct answers in each stage-2 block, out of 6 — null when stage 2 was not reached */
  grade2Score: number | null;
  aboveScore: number | null;
  /** Everything answered correctly across both stages */
  totalScore: number;
  totalMax: number;
}

export const STAGE1_MAX = SEJONG1_QUESTIONS.length;
export const STAGE2_MAX = STAGE2_QUESTIONS.length;

/**
 * True when the student cleared every stage-1 gate and should be shown stage 2.
 * Called while the test is running, not only at the end, so the page knows
 * whether to continue or stop.
 */
export function needsStage2(sejongAnswers: Record<string, number>): boolean {
  return computeUnitPlacement(sejongAnswers).failedSection === null;
}

/**
 * `sejongAnswers` is keyed by question id ("A1"), `stage2Answers` by the older
 * bank's numeric ids — the two banks never share a key space.
 */
export function computeTopikPlacement(
  sejongAnswers: Record<string, number>,
  stage2Answers: Record<number, number>,
): TopikPlacementResult {
  const stage1 = computeUnitPlacement(sejongAnswers);

  const countCorrect = (qs: PlacementQuestion[]) =>
    qs.reduce((n, q) => n + (stage2Answers[q.id] === q.correctIndex ? 1 : 0), 0);

  // A student who did not clear stage 1 is not shown stage 2 at all. Grading
  // stops at 1급, and which section they failed decides whether they are even
  // there yet: the Hangul section is the one gate that sits below 1급.
  if (stage1.failedSection !== null) {
    return {
      info: TOPIK_GRADES[stage1.failedSection === "A" ? "pre1" : "g1"],
      sejongSectionScores: stage1.sectionScores,
      sejongScore: stage1.mcqScore,
      failedSection: stage1.failedSection,
      grade2Score: null,
      aboveScore: null,
      totalScore: stage1.mcqScore,
      totalMax: STAGE1_MAX,
    };
  }

  const grade2Score = countCorrect(STAGE2_GRADE2);
  const aboveScore = countCorrect(STAGE2_ABOVE);

  // Clearing all of 세종한국어 1 is what 1급 means, so the floor here is 2급
  // only once the 2급 block is also cleared — otherwise they sit at the top of
  // 1급 rather than inside 2급.
  let grade: TopikGrade = "g1";
  if (grade2Score >= STAGE2_BLOCK_PASS) {
    grade = aboveScore >= STAGE2_BLOCK_PASS ? "g3plus" : "g2";
  }

  return {
    info: TOPIK_GRADES[grade],
    sejongSectionScores: stage1.sectionScores,
    sejongScore: stage1.mcqScore,
    failedSection: null,
    grade2Score,
    aboveScore,
    totalScore: stage1.mcqScore + grade2Score + aboveScore,
    totalMax: STAGE1_MAX + STAGE2_MAX,
  };
}

/** Section metadata re-exported so the page imports one module, not three. */
export { SEJONG1_SECTIONS };
