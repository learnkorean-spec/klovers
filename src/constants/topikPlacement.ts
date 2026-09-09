import {
  TOPIK1_SECTIONS,
  TOPIK1_QUESTIONS,
  TOPIK1_MAX,
  computeTopik1Placement,
  type Topik1SectionId,
} from "@/constants/topik1Reading";

/**
 * Grading for the Klovers placement test.
 *
 * One stage, three sections, TOPIK I only. The student is placed at the FIRST
 * section they fail — the section whose material they still need:
 *
 *   fail A  → 한글 기초   (not yet at 1급)
 *   fail B  → 1급         (inside level 1)
 *   fail C  → 2급         (level 1 done, working through level 2)
 *   pass C  → past TOPIK I
 *
 * The ceiling is deliberate. TOPIK I covers 1급 and 2급 and nothing above, so
 * this bank holds no evidence about 3급. Clearing every section is reported as
 * "past TOPIK I" and routed to a teacher rather than turned into a number the
 * test cannot justify — a placement that overstates a level costs a real
 * student a term in a class they cannot follow.
 */

export type TopikGrade = "pre1" | "g1" | "g2" | "above";

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
  above: {
    grade: "above",
    labelKo: "TOPIK I 이상",
    labelAr: "فوق TOPIK I",
    labelEn: "Past TOPIK I",
    noteAr:
      "عدّيت كل أقسام TOPIK I. الاختبار ده بيقيس المستوى الأول والتاني بس، فمش هيدّيك رقم فوق كده — كلّمنا وهنعملك تقييم TOPIK II قصير.",
    noteEn:
      "You cleared every TOPIK I section. This test only measures levels 1 and 2, so it will not put a number above that — talk to us and we will run a short TOPIK II assessment.",
    levelKey: "l3",
  },
};

export interface TopikPlacementResult {
  info: TopikGradeInfo;
  /** Per-section correct answers (A–C) */
  sectionScores: Record<Topik1SectionId, number>;
  /** The section that decided the placement, null when all were passed */
  failedSection: Topik1SectionId | null;
  totalScore: number;
  totalMax: number;
}

export const PLACEMENT_MAX = TOPIK1_MAX;

const GRADE_FOR_FAILED_SECTION: Record<Topik1SectionId, TopikGrade> = {
  A: "pre1",
  B: "g1",
  C: "g2",
};

export function computeTopikPlacement(
  answers: Record<string, number>,
): TopikPlacementResult {
  const r = computeTopik1Placement(answers);
  const grade: TopikGrade =
    r.failedSection === null ? "above" : GRADE_FOR_FAILED_SECTION[r.failedSection];

  return {
    info: TOPIK_GRADES[grade],
    sectionScores: r.sectionScores,
    failedSection: r.failedSection,
    totalScore: r.score,
    totalMax: TOPIK1_MAX,
  };
}

/** Re-exported so the page imports one module, not two. */
export { TOPIK1_SECTIONS, TOPIK1_QUESTIONS, TOPIK1_MAX };
export type { Topik1SectionId };
