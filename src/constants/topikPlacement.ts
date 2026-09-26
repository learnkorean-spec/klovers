import {
  TOPIK1_SECTIONS,
  TOPIK1_QUESTIONS,
  TOPIK1_MAX,
  type Topik1SectionId,
} from "@/constants/topik1Reading";

/**
 * The grades the placement test can award, and what each one says to a student.
 *
 * WHAT CHANGED, 9 SEP 2026
 *
 * This module used to own the grading as well as the copy, and the grading was
 * a gate: the student was placed at the FIRST section she failed, and the test
 * ended there. Two problems with that, one product and one pedagogical.
 *
 * The product one: ending an exam three questions in and showing a result
 * reads as being thrown out. Owner feedback, verbatim — "this is so confusing
 * in the middle of an exam".
 *
 * The pedagogical one: it is not how TOPIK works, and TOPIK is the scale these
 * students already know.
 *
 * Grading therefore moved to `topikPapers.ts`. That module briefly held two
 * separate papers, which turned out to have the same flaw in a politer form —
 * it asked the student to choose between a TOPIK I and a TOPIK II paper, which
 * is asking her to place herself before the placement test will place her. It
 * is now one test of fifty-two items, easiest first, that she may finish
 * herself once the questions are past her.
 *
 * `above` means past 4급 and points at `l5`. There is no grade for "wrong
 * paper" any more, because there is only one paper.
 *
 * Every note says "prepares you toward" and never "you are". A 24-hour Klovers
 * level is not a TOPIK certificate and must not read like one — `validateLevels`
 * in levels.ts throws on any description that equates the two.
 */

export type TopikGrade = "pre1" | "g1" | "g2" | "g3" | "g4" | "above";

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
    noteAr: "البداية من قراءة الحروف الكورية، فهي الأساس الذي يُبنى عليه كل ما بعدها.",
    noteEn: "You start from reading the Korean alphabet — everything else builds on it.",
    levelKey: "hangul",
  },
  g1: {
    grade: "g1",
    labelKo: "1급",
    labelAr: "المستوى الأول (1급)",
    labelEn: "TOPIK level 1 (1급)",
    noteAr: "قراءة الهانغول والتعامل مع الجمل الأساسية متحققان، والمستوى الأول هو المستوى المناسب.",
    noteEn: "You read Hangul and handle basic sentences. Level 1 is where you belong.",
    levelKey: "l1",
  },
  g2: {
    grade: "g2",
    labelKo: "2급",
    labelAr: "المستوى الثاني (2급)",
    labelEn: "TOPIK level 2 (2급)",
    noteAr: "المستوى الأول مُنجَز، وقراءة النصوص القصيرة ممكنة، والعمل الآن في المستوى الثاني.",
    noteEn: "Level 1 is behind you and you read short texts. Level 2 is your work now.",
    levelKey: "l2",
  },
  g3: {
    grade: "g3",
    labelKo: "3급",
    labelAr: "المستوى الثالث (3급)",
    labelEn: "TOPIK level 3 (3급)",
    noteAr: "قراءة النصوص اليومية الكاملة وفهم معناها دون ترجمة متحققان، والمستوى الثالث هو المستوى المناسب.",
    noteEn: "You read whole everyday texts and hold the meaning without translating. Level 3 is where you belong.",
    levelKey: "l3",
  },
  g4: {
    grade: "g4",
    labelKo: "4급",
    labelAr: "المستوى الرابع (4급)",
    labelEn: "TOPIK level 4 (4급)",
    noteAr: "التعامل مع المقالات وعناوين الأخبار والموضوعات المجرّدة متحقق، والعمل الآن في المستوى الرابع.",
    noteEn: "You handle articles, headlines and abstract topics. Level 4 is your work now.",
    levelKey: "l4",
  },
  above: {
    grade: "above",
    labelKo: "4급 이상",
    labelAr: "فوق المستوى الرابع",
    labelEn: "Past 4급",
    noteAr:
      "اكتمل الاختبار حتى نهايته. يقيس هذا الاختبار حتى المستوى الرابع فقط، فلا يمنح مستوى أعلى منه، ويمكن التواصل مع المعلّمة لإجراء تقييم قصير للمستويين الخامس والسادس.",
    noteEn:
      "You reached the end of the test. It measures up to level 4, so it will not put a number above that — talk to us and we will run a short assessment for levels 5 and 6.",
    levelKey: "l5",
  },
};

/** The grades that name an actual Klovers level, in ladder order. */
export const GRADE_ORDER: TopikGrade[] = ["pre1", "g1", "g2", "g3", "g4", "above"];

export { TOPIK1_SECTIONS, TOPIK1_QUESTIONS, TOPIK1_MAX };
export type { Topik1SectionId };
