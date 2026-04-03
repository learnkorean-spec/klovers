/**
 * 20 multiple-choice placement test questions.
 * Gradual difficulty: Foundation → TOPIK 6.
 * Sections: Vocabulary, Grammar, Reading.
 * 4 questions per level band × 5 bands = 20 questions.
 *
 * TOPIK alignment:
 *  Q1–Q4   Foundation (Hangul / A0)
 *  Q5–Q8   TOPIK 1    (A1)
 *  Q9–Q12  TOPIK 2    (A2)
 *  Q13–Q16 TOPIK 3–4  (B1–B2)
 *  Q17–Q20 TOPIK 5–6  (C1–C2)
 */

export interface PlacementQuestion {
  id: number;
  section: "Vocabulary" | "Grammar" | "Reading";
  level: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ─── Foundation / A0 (Q1–Q4) ────────────────────────────
  {
    id: 1,
    section: "Vocabulary",
    level: "Foundation",
    question: "What does 안녕하세요 mean?",
    options: ["Thank you", "Goodbye", "Hello", "Sorry"],
    correctIndex: 2,
  },
  {
    id: 2,
    section: "Vocabulary",
    level: "Foundation",
    question: "What does 감사합니다 mean?",
    options: ["I'm sorry", "Thank you", "Goodbye", "Please"],
    correctIndex: 1,
  },
  {
    id: 3,
    section: "Grammar",
    level: "Foundation",
    question: "How many basic vowels does Hangul have?",
    options: ["10", "14", "21", "8"],
    correctIndex: 0,
  },
  {
    id: 4,
    section: "Reading",
    level: "Foundation",
    question: "Which syllable block reads 'ka'?",
    options: ["가", "나", "다", "라"],
    correctIndex: 0,
  },

  // ─── TOPIK 1 / A1 (Q5–Q8) ───────────────────────────────
  {
    id: 5,
    section: "Vocabulary",
    level: "TOPIK 1",
    question: "What does 학생 mean?",
    options: ["Teacher", "Student", "Doctor", "Friend"],
    correctIndex: 1,
  },
  {
    id: 6,
    section: "Grammar",
    level: "TOPIK 1",
    question: "Which particle marks the subject of a sentence?",
    options: ["을/를", "이/가", "에", "도"],
    correctIndex: 1,
  },
  {
    id: 7,
    section: "Grammar",
    level: "TOPIK 1",
    question: "Complete: 저는 학생___.",
    options: ["입니다", "합니다", "있다", "없다"],
    correctIndex: 0,
  },
  {
    id: 8,
    section: "Reading",
    level: "TOPIK 1",
    question: "'나는 사과를 먹습니다' — What is being eaten?",
    options: ["Bread", "Rice", "Apple", "Banana"],
    correctIndex: 2,
  },

  // ─── TOPIK 2 / A2 (Q9–Q12) ──────────────────────────────
  {
    id: 9,
    section: "Grammar",
    level: "TOPIK 2",
    question: "What does the ending -고 싶다 express?",
    options: ["Obligation", "Want / desire", "Ability", "Permission"],
    correctIndex: 1,
  },
  {
    id: 10,
    section: "Grammar",
    level: "TOPIK 2",
    question: "Choose the correct connector: 비가 오___ 우산을 가져가세요.",
    options: ["고", "면", "지만", "니까"],
    correctIndex: 3,
  },
  {
    id: 11,
    section: "Reading",
    level: "TOPIK 2",
    question: "'어제 친구를 만났습니다' — When did the meeting happen?",
    options: ["Today", "Tomorrow", "Yesterday", "Last week"],
    correctIndex: 2,
  },
  {
    id: 12,
    section: "Grammar",
    level: "TOPIK 2",
    question: "Which ending makes a polite request?",
    options: ["-ㅂ시다", "-아/어 주세요", "-겠습니다", "-습니다"],
    correctIndex: 1,
  },

  // ─── TOPIK 3–4 / B1–B2 (Q13–Q16) ───────────────────────
  {
    id: 13,
    section: "Grammar",
    level: "TOPIK 3–4",
    question: "What does -(으)ㄹ 수 있다 express?",
    options: ["Must", "Should", "Can / is able to", "Want to"],
    correctIndex: 2,
  },
  {
    id: 14,
    section: "Vocabulary",
    level: "TOPIK 3–4",
    question: "What does 경험 mean?",
    options: ["Experiment", "Experience", "Competition", "Education"],
    correctIndex: 1,
  },
  {
    id: 15,
    section: "Reading",
    level: "TOPIK 3–4",
    question: "'환경을 보호하기 위해 노력해야 합니다' — The sentence is about:",
    options: ["Health care", "Environmental protection", "Economic growth", "Education reform"],
    correctIndex: 1,
  },
  {
    id: 16,
    section: "Grammar",
    level: "TOPIK 3–4",
    question: "What nuance does -더라고요 convey?",
    options: ["Hearsay", "Personal past observation", "Future intention", "Suggestion"],
    correctIndex: 1,
  },

  // ─── TOPIK 5–6 / C1–C2 (Q17–Q20) ───────────────────────
  {
    id: 17,
    section: "Grammar",
    level: "TOPIK 5–6",
    question: "What does -는 바람에 express?",
    options: ["Despite", "Unintended negative cause", "Purpose", "Condition"],
    correctIndex: 1,
  },
  {
    id: 18,
    section: "Vocabulary",
    level: "TOPIK 5–6",
    question: "What does 모순 mean?",
    options: ["Harmony", "Contradiction", "Tradition", "Evolution"],
    correctIndex: 1,
  },
  {
    id: 19,
    section: "Reading",
    level: "TOPIK 5–6",
    question: "'인공지능의 발전이 인간의 노동 시장에 미치는 영향은 다각적으로 분석되어야 한다' — The sentence discusses:",
    options: ["AI ethics only", "Multi-faceted analysis of AI's impact on labor", "Robot manufacturing", "Internet security"],
    correctIndex: 1,
  },
  {
    id: 20,
    section: "Grammar",
    level: "TOPIK 5–6",
    question: "What does -기는커녕 express?",
    options: ["Not only… but also", "Far from (doing something), let alone", "In order to", "As long as"],
    correctIndex: 1,
  },
];

export interface PlacementResult {
  score: number;
  levelKey: string;
  levelLabel: string;
}

/**
 * Score brackets (out of 20 — 4 questions × 5 TOPIK bands):
 *  0–4   → Foundation (A0)
 *  5–8   → Level 1    (A1 / TOPIK 1)
 *  9–12  → Level 2    (A2 / TOPIK 2)
 *  13–16 → Level 3–4  (B1–B2 / TOPIK 3–4)
 *  17–20 → Level 5–6  (C1–C2 / TOPIK 5–6)
 */
export function computePlacementResult(answers: Record<number, number>): PlacementResult {
  let score = 0;
  for (const q of PLACEMENT_QUESTIONS) {
    if (answers[q.id] === q.correctIndex) score++;
  }

  let levelKey: string;
  let levelLabel: string;

  if (score <= 4) {
    levelKey = "foundation";
    levelLabel = "Hangul Foundation";
  } else if (score <= 8) {
    levelKey = "level_1";
    levelLabel = "Level 1 (A1 / TOPIK 1)";
  } else if (score <= 12) {
    levelKey = "level_2";
    levelLabel = "Level 2 (A2 / TOPIK 2)";
  } else if (score <= 16) {
    levelKey = "level_3";
    levelLabel = "Level 3–4 (B1–B2 / TOPIK 3–4)";
  } else {
    levelKey = "level_5";
    levelLabel = "Level 5–6 (C1–C2 / TOPIK 5–6)";
  }

  return { score, levelKey, levelLabel };
}
