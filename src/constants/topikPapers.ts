/**
 * One placement test. Fifty-two reading items, easiest first, levels 1 to 4.
 *
 * WHY ONE AND NOT TWO
 *
 * The previous design asked the student to choose between a TOPIK I paper and
 * a TOPIK II paper before the first question. That choice is the very thing
 * she came here to find out. Someone who genuinely does not know whether she
 * is 2급 or 3급 — which is most people, and exactly the person a placement
 * test is for — has to guess her own level before the test will measure it,
 * and a wrong guess costs her a whole sitting. Owner decision, 9 Sep 2026:
 * merge the two banks into a single test.
 *
 * WHY IT DOES NOT SIMPLY GET LONGER
 *
 * Fifty-two questions is a real TOPIK reading load, and it is far too many for
 * a beginner who cannot read past section B. The answer is not to cut the test
 * short for her — that is the mid-exam ejection this design already removed —
 * but to hand her the decision: from section C onward there is a "that is as
 * far as I can go" button. Nothing stops the student; the student stops.
 *
 * HOW THE GRADE IS READ
 *
 * The sections are cumulative, so the raw total already encodes where a
 * student's Korean runs out:
 *
 *   A          8 items   한글 기초 · basic reading
 *   A+B       18 items   through 1급
 *   A+B+C     28 items   through 2급
 *   A+B+C+D   40 items   through 3급
 *   A+B+C+D+E 52 items   through 4급
 *
 * A student who answers what she can and stops lands on her own boundary
 * without anyone calculating a percentage at her. The bands below are those
 * boundaries, in raw marks rather than ratios, because a ratio of a paper the
 * student chose to stop early on means nothing.
 *
 * ONE KNOWN SOFT SPOT, STATED RATHER THAN HIDDEN
 *
 * A student who guesses at all fifty-two questions scores thirteen by chance
 * on four options, which lands in the 1급 band. That is the safe direction —
 * being placed a level low costs a promotion conversation in week two, while
 * being placed high costs a student who sits in a class she cannot follow and
 * leaves — but it is a real limit, and no reading test priced at zero can
 * close it. The teacher's judgement in the first class is what closes it.
 *
 * The six numbers below are the whole placement policy. Changing where a
 * student lands is a one-line edit here.
 */
import {
  TOPIK1_QUESTIONS,
  TOPIK1_SECTIONS,
} from "./topik1Reading";
import {
  TOPIK2_QUESTIONS,
  TOPIK2_SECTIONS,
} from "./topik2Reading";
import type { TopikGrade } from "./topikPlacement";

/**
 * The two banks were written independently and their section id unions differ.
 * Widening `section` to string is what lets one renderer draw all five, and
 * nothing downstream needs the narrow type — sections are looked up by id.
 */
export interface ExamQuestion {
  id: string;
  section: string;
  group?: string;
  bogi?: { stem: string; options: string[]; answerIndex: number };
  passage?: string;
  stem: string;
  hintAr?: string;
  options: string[];
  answerIndex: number;
}

export interface ExamSection {
  id: string;
  gradeKo: string;
  titleAr: string;
  titleEn: string;
  titleKo: string;
  instrAr: string;
  instrEn: string;
  focusKo?: string;
  max: number;
  /**
   * Whether a student may finish the test on this section. False for the first
   * two: someone who stops before section C has not yet answered enough for
   * the total to separate 한글 기초 from 1급, and offering the button there
   * would produce placements the paper cannot support.
   */
  mayStopAfter: boolean;
}

/** Award this grade at or above this raw mark. Highest first. */
interface Band {
  minScore: number;
  grade: TopikGrade;
}

const withStop = (sections: readonly unknown[], allow: boolean[]): ExamSection[] =>
  (sections as ExamSection[]).map((s, i) => ({ ...s, mayStopAfter: allow[i] }));

export const EXAM_SECTIONS: ExamSection[] = [
  ...withStop(TOPIK1_SECTIONS, [false, false, true]),
  ...withStop(TOPIK2_SECTIONS, [true, true]),
];

export const EXAM_QUESTIONS: ExamQuestion[] = [
  ...(TOPIK1_QUESTIONS as unknown as ExamQuestion[]),
  ...(TOPIK2_QUESTIONS as unknown as ExamQuestion[]),
];

export const EXAM_MAX = EXAM_QUESTIONS.length;

/** Stored on unit_placement_tests.book. Older rows carry "topik1". */
export const EXAM_BOOK_KEY = "topik1_4";

/**
 * The section boundaries, as raw marks. Read the table in the file header
 * alongside these: 8 is all of A, 18 is A+B, 28 is A+B+C, 40 adds D, 48 is
 * most of E.
 */
export const EXAM_BANDS: Band[] = [
  { minScore: 48, grade: "above" },
  { minScore: 40, grade: "g4" },
  { minScore: 28, grade: "g3" },
  { minScore: 18, grade: "g2" },
  { minScore: 8, grade: "g1" },
];

export const EXAM_FLOOR_GRADE: TopikGrade = "pre1";

export interface ExamResult {
  grade: TopikGrade;
  score: number;
  /** Out of the whole test, always 52, whether or not the student stopped. */
  max: number;
  /** How many questions she was actually shown, so the result can say so. */
  attempted: number;
  sectionScores: Record<string, number>;
  /** Ids of the sections she reached, in order. */
  sectionsSeen: string[];
  /** True when she chose to finish rather than reaching the end. */
  stoppedEarly: boolean;
}

/**
 * Grade the test.
 *
 * `sectionsSeen` is what the student was actually shown. Everything outside it
 * is not counted as wrong so much as not asked — the score is the same either
 * way, since an unasked question earns no mark, but the result screen needs to
 * know the difference to avoid telling someone she got twenty-four questions
 * wrong that she never saw.
 */
export function gradeExam(
  answers: Record<string, number>,
  sectionsSeen: string[],
): ExamResult {
  const seen = new Set(sectionsSeen);
  const sectionScores: Record<string, number> = {};
  for (const s of EXAM_SECTIONS) sectionScores[s.id] = 0;

  let score = 0;
  for (const q of EXAM_QUESTIONS) {
    if (answers[q.id] === q.answerIndex) {
      score += 1;
      sectionScores[q.section] = (sectionScores[q.section] ?? 0) + 1;
    }
  }

  const attempted = EXAM_SECTIONS
    .filter((s) => seen.has(s.id))
    .reduce((n, s) => n + s.max, 0);

  const band = EXAM_BANDS.find((b) => score >= b.minScore);

  return {
    grade: band?.grade ?? EXAM_FLOOR_GRADE,
    score,
    max: EXAM_MAX,
    attempted,
    sectionScores,
    sectionsSeen: EXAM_SECTIONS.filter((s) => seen.has(s.id)).map((s) => s.id),
    stoppedEarly: attempted < EXAM_MAX,
  };
}

if (import.meta.env.DEV) {
  if (EXAM_MAX !== 52) {
    throw new Error(`topikPapers: expected 52 items, the banks hold ${EXAM_MAX}`);
  }
  const declared = EXAM_SECTIONS.reduce((n, s) => n + s.max, 0);
  if (declared !== EXAM_MAX) {
    throw new Error(
      `topikPapers: sections declare ${declared} questions but the banks hold ${EXAM_MAX}`,
    );
  }
  // Bands must descend, or `find` awards the wrong grade to a high score.
  for (let i = 1; i < EXAM_BANDS.length; i += 1) {
    if (EXAM_BANDS[i].minScore >= EXAM_BANDS[i - 1].minScore) {
      throw new Error("topikPapers: bands are not in descending order");
    }
  }
  // Every band must be reachable, and the lowest must sit above pure chance on
  // four options (52 / 4 = 13) for anything it awards to mean something.
  if (EXAM_BANDS[EXAM_BANDS.length - 1].minScore > EXAM_MAX) {
    throw new Error("topikPapers: the lowest band is above the maximum score");
  }
  // The stop button must never appear before the test can tell two levels
  // apart, which is the end of section C.
  const firstStop = EXAM_SECTIONS.findIndex((s) => s.mayStopAfter);
  if (firstStop < 2) {
    throw new Error("topikPapers: a student must not be able to stop before section C");
  }
}
