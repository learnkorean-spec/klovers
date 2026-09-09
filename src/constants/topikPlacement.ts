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
 * a gate: the student was placed at the FIRST section they failed, and the test
 * ended there. Two problems with that, one product and one pedagogical.
 *
 * The product one: ending an exam three questions in and showing a result reads
 * as being thrown out. Owner feedback, verbatim — "this is so confusing in the
 * middle of an exam".
 *
 * The pedagogical one: it is not how TOPIK works, and TOPIK is the scale these
 * students already know. A real candidate sits the whole paper and their total
 * falls into a band.
 *
 * Grading therefore moved to `topikPapers.ts`, which defines two papers — TOPIK
 * I covering 1급/2급 and TOPIK II covering 3급/4급 — each answered in full and
 * graded on its total against a cut score. This file keeps what it was always
 * best at: the words a student reads when the number comes back.
 *
 * `above` now means "past 4급", not "past 2급", and points at `l5`. Below the
 * intermediate paper's floor there is a new grade, `belowII`, which awards no
 * number at all: scoring under the 3급 cut on TOPIK II tells us the student is
 * on the wrong paper, and nothing about whether they are 1급 or 2급. Guessing
 * there would be inventing a placement, so the result screen offers Paper I
 * instead. Its `levelKey` is `l2` only because the columns it is written to
 * require a real level key; the copy never claims it.
 *
 * Every note says "prepares you toward" and never "you are". A 24-hour Klovers
 * level is not a TOPIK certificate and must not read like one — `validateLevels`
 * in levels.ts throws on any description that equates the two.
 */

export type TopikGrade = "pre1" | "g1" | "g2" | "belowII" | "g3" | "g4" | "above";

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
    noteAr: "بتقرا الهانغول وبتتعامل مع الجُمل الأساسية. المستوى الأول هو مكانك.",
    noteEn: "You read Hangul and handle basic sentences. Level 1 is where you belong.",
    levelKey: "l1",
  },
  g2: {
    grade: "g2",
    labelKo: "2급",
    labelAr: "المستوى الثاني (2급)",
    labelEn: "TOPIK level 2 (2급)",
    noteAr: "خلّصت المستوى الأول وبتقرا نصوص قصيرة. شغلك دلوقتي في المستوى الثاني.",
    noteEn: "Level 1 is behind you and you read short texts. Level 2 is your work now.",
    levelKey: "l2",
  },
  belowII: {
    grade: "belowII",
    labelKo: "TOPIK I 수준",
    labelAr: "مستواك في نطاق TOPIK I",
    labelEn: "Still in the TOPIK I range",
    noteAr:
      "ورقة TOPIK II أصعب من مستواك دلوقتي، وعشان كده مش هنديك رقم منها — الورقة دي مش بتقيس الفرق بين المستوى الأول والتاني. اقعد الورقة الأولى وهتطلع بمستوى مظبوط.",
    noteEn:
      "The TOPIK II paper is above where you are right now, so we will not put a number on it — this paper cannot tell level 1 from level 2. Sit the TOPIK I paper and you will get a placement you can trust.",
    levelKey: "l2",
  },
  g3: {
    grade: "g3",
    labelKo: "3급",
    labelAr: "المستوى الثالث (3급)",
    labelEn: "TOPIK level 3 (3급)",
    noteAr: "بتقرا نصوص يومية كاملة وبتمسك المعنى من غير ترجمة. المستوى الثالث هو مكانك.",
    noteEn: "You read whole everyday texts and hold the meaning without translating. Level 3 is where you belong.",
    levelKey: "l3",
  },
  g4: {
    grade: "g4",
    labelKo: "4급",
    labelAr: "المستوى الرابع (4급)",
    labelEn: "TOPIK level 4 (4급)",
    noteAr: "بتتعامل مع مقالات وعناوين أخبار وموضوعات مجرّدة. شغلك دلوقتي في المستوى الرابع.",
    noteEn: "You handle articles, headlines and abstract topics. Level 4 is your work now.",
    levelKey: "l4",
  },
  above: {
    grade: "above",
    labelKo: "4급 이상",
    labelAr: "فوق المستوى الرابع",
    labelEn: "Past 4급",
    noteAr:
      "عدّيت ورقة TOPIK II كلها. الاختبار ده بيقيس لحد المستوى الرابع، فمش هيدّيك رقم فوق كده — كلّمنا وهنعملك تقييم قصير للمستوى الخامس والسادس.",
    noteEn:
      "You cleared the whole TOPIK II paper. This test measures up to level 4, so it will not put a number above that — talk to us and we will run a short assessment for levels 5 and 6.",
    levelKey: "l5",
  },
};

/** The grades that name an actual Klovers level, in ladder order. */
export const GRADE_ORDER: TopikGrade[] = ["pre1", "g1", "g2", "g3", "g4", "above"];

export { TOPIK1_SECTIONS, TOPIK1_QUESTIONS, TOPIK1_MAX };
export type { Topik1SectionId };
