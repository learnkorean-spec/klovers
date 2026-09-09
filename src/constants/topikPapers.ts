/**
 * Two papers, graded the way TOPIK grades.
 *
 * WHAT THIS REPLACES
 *
 * The test used to stop the moment a student missed a section's pass mark, and
 * the level was "the first section you did not pass". That is a sensible way to
 * find a floor quickly, and it is not how the exam it is named after works. A
 * real TOPIK candidate sits the whole paper and their TOTAL score falls into a
 * band. Stopping someone three questions in and showing them a result also
 * reads as being thrown out of an exam — which is exactly what it looked like.
 *
 * Owner decision, 9 Sep 2026: two papers, each answered in full, graded on the
 * total. It mirrors the real thing — TOPIK I is one sitting covering 1급 and
 * 2급, TOPIK II is another covering 3급 upward — and it removes the mid-exam
 * stop.
 *
 * THE CUT SCORES
 *
 * TOPIK's own cut scores are proportions of the paper:
 *
 *   TOPIK I    1급  80/200 = 40%      2급 140/200 = 70%
 *   TOPIK II   3급 120/300 = 40%      4급 150/300 = 50%
 *
 * Paper I uses those two ratios unchanged.
 *
 * Paper II does NOT, and the reason is worth stating because it is the one
 * place these papers deliberately diverge from the exam. The real TOPIK II
 * total includes 듣기 and 쓰기; ours is reading only, and reading is the part
 * most students score highest on. Applying the full-paper ratio to a
 * reading-only score therefore places people ABOVE where they sit, and being
 * placed too high is the expensive error: a student lands in a class she cannot
 * follow and leaves. Being placed one level low costs a promotion conversation
 * in week two. So Paper II is set slightly stricter than the real ratios — 45%
 * for 3급, 60% for 4급 — and every result says "prepares you toward", never
 * "you are".
 *
 * These four numbers are the whole policy. They are here, named, in one place,
 * so changing where a student lands is a one-line edit and not an archaeology
 * expedition through the page component.
 */
import {
  TOPIK1_QUESTIONS,
  TOPIK1_SECTIONS,
  type Topik1Question,
  type Topik1Section,
} from "./topik1Reading";
import {
  TOPIK2_QUESTIONS,
  TOPIK2_SECTIONS,
  type Topik2Question,
  type Topik2Section,
} from "./topik2Reading";
import type { TopikGrade } from "./topikPlacement";

export type PaperId = "I" | "II";

/**
 * The two banks were written independently and their section types differ only
 * in the id union. Widening `section` to string is what lets one renderer draw
 * either paper, and nothing downstream needs the narrow type: sections are
 * looked up by id from the paper's own list.
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
}

/** A cut score, as a share of the paper, and the grade it awards. */
interface Band {
  /** Award this grade at or above this fraction of the paper. */
  minRatio: number;
  grade: TopikGrade;
}

export interface Paper {
  id: PaperId;
  /** Stored on unit_placement_tests.book. Existing rows carry "topik1". */
  bookKey: "topik1" | "topik2";
  labelKo: string;
  labelEn: string;
  labelAr: string;
  /** One line telling a student whether this is their paper, before they start. */
  forWhoEn: string;
  forWhoAr: string;
  sections: ExamSection[];
  questions: ExamQuestion[];
  max: number;
  /** Highest band first. The first one the score reaches is the grade awarded. */
  bands: Band[];
  /** Grade awarded below every band. */
  floorGrade: TopikGrade;
}

export const PAPER_I: Paper = {
  id: "I",
  bookKey: "topik1",
  labelKo: "TOPIK I 읽기",
  labelEn: "TOPIK I — reading",
  labelAr: "TOPIK I — قراءة",
  forWhoEn: "You can read Hangul, and you are somewhere in your first year or two.",
  forWhoAr: "بتعرف تقرا الهانغول، ولسه في أول سنة أو سنتين.",
  sections: TOPIK1_SECTIONS as unknown as ExamSection[],
  questions: TOPIK1_QUESTIONS as unknown as ExamQuestion[],
  max: TOPIK1_QUESTIONS.length,
  // The real TOPIK I cut scores, unchanged: 70% for 2급, 40% for 1급.
  bands: [
    { minRatio: 0.7, grade: "g2" },
    { minRatio: 0.4, grade: "g1" },
  ],
  floorGrade: "pre1",
};

export const PAPER_II: Paper = {
  id: "II",
  bookKey: "topik2",
  labelKo: "TOPIK II 읽기",
  labelEn: "TOPIK II — reading",
  labelAr: "TOPIK II — قراءة",
  forWhoEn: "You read paragraphs and news headlines without translating word by word.",
  forWhoAr: "بتقرا فقرات وعناوين أخبار من غير ما تترجم كلمة كلمة.",
  sections: TOPIK2_SECTIONS as unknown as ExamSection[],
  questions: TOPIK2_QUESTIONS as unknown as ExamQuestion[],
  max: TOPIK2_QUESTIONS.length,
  // Stricter than the real 40/50, because this paper is reading only. See the
  // file header — this is the deliberate divergence, not an oversight.
  bands: [
    { minRatio: 0.6, grade: "g4" },
    { minRatio: 0.45, grade: "g3" },
  ],
  // Below 45% on the intermediate paper says nothing about 1급 versus 2급 —
  // only that this is the wrong paper. The result screen offers Paper I rather
  // than guessing a number.
  floorGrade: "belowII",
};

export const PAPERS: Record<PaperId, Paper> = { I: PAPER_I, II: PAPER_II };

export interface ExamResult {
  paper: PaperId;
  grade: TopikGrade;
  score: number;
  max: number;
  /** 0–1, the share of the paper answered correctly. */
  ratio: number;
  sectionScores: Record<string, number>;
  /**
   * True when the score sits at the top of this paper and the student may
   * belong on the harder one — or at the bottom, and belongs on the easier one.
   * The result screen turns this into an offer, never an automatic redirect.
   */
  suggestOtherPaper: boolean;
}

/**
 * Grade a completed paper.
 *
 * Unanswered questions count as wrong, which is what an exam does. The page
 * does not let a student leave a question blank, so this only bites on the
 * "I cannot read Hangul yet" escape hatch, where an empty answer set is
 * precisely the claim being made.
 */
export function gradePaper(paper: Paper, answers: Record<string, number>): ExamResult {
  const sectionScores: Record<string, number> = {};
  for (const s of paper.sections) sectionScores[s.id] = 0;

  let score = 0;
  for (const q of paper.questions) {
    if (answers[q.id] === q.answerIndex) {
      score += 1;
      sectionScores[q.section] = (sectionScores[q.section] ?? 0) + 1;
    }
  }

  const ratio = paper.max > 0 ? score / paper.max : 0;
  const band = paper.bands.find((b) => ratio >= b.minRatio);
  const grade = band?.grade ?? paper.floorGrade;

  // Paper I: a clean sweep of the top band means the ceiling may be hiding a
  // higher level. Paper II: falling under the floor means the easier paper is
  // the one that can actually place them.
  const suggestOtherPaper =
    paper.id === "I" ? grade === "g2" && ratio >= 0.9 : grade === "belowII";

  return { paper: paper.id, grade, score, max: paper.max, ratio, sectionScores, suggestOtherPaper };
}

if (import.meta.env.DEV) {
  for (const paper of Object.values(PAPERS)) {
    if (paper.max !== paper.questions.length) {
      throw new Error(`topikPapers: paper ${paper.id} max drifted from its question count`);
    }
    const declared = paper.sections.reduce((n, s) => n + s.max, 0);
    if (declared !== paper.max) {
      throw new Error(
        `topikPapers: paper ${paper.id} sections declare ${declared} questions but the bank holds ${paper.max}`,
      );
    }
    // Bands must be strictly descending, or `find` awards the wrong grade.
    for (let i = 1; i < paper.bands.length; i += 1) {
      if (paper.bands[i].minRatio >= paper.bands[i - 1].minRatio) {
        throw new Error(`topikPapers: paper ${paper.id} bands are not in descending order`);
      }
    }
  }
}
