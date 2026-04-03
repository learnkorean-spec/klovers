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
  explanation: string;
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
    explanation: "안녕하세요 is the standard formal greeting used any time of day. The casual form is 안녕, and goodbye is 안녕히 가세요.",
  },
  {
    id: 2,
    section: "Vocabulary",
    level: "Foundation",
    question: "What does 감사합니다 mean?",
    options: ["I'm sorry", "Thank you", "Goodbye", "Please"],
    correctIndex: 1,
    explanation: "감사합니다 is the formal 'thank you'. The more casual form is 고마워요. 미안합니다 = I'm sorry.",
  },
  {
    id: 3,
    section: "Grammar",
    level: "Foundation",
    question: "How many basic vowels does Hangul have?",
    options: ["10", "14", "21", "8"],
    correctIndex: 0,
    explanation: "Hangul has 10 basic vowels (ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ) and 14 basic consonants, which combine to form syllable blocks.",
  },
  {
    id: 4,
    section: "Reading",
    level: "Foundation",
    question: "Which syllable block reads 'ka'?",
    options: ["가", "나", "다", "라"],
    correctIndex: 0,
    explanation: "가 = ㄱ (g/k) + ㅏ (a). 나 = na, 다 = da, 라 = ra/la. ㄱ sounds like 'k' at the start of a syllable.",
  },

  // ─── TOPIK 1 / A1 (Q5–Q8) ───────────────────────────────
  {
    id: 5,
    section: "Vocabulary",
    level: "TOPIK 1",
    question: "What does 학생 mean?",
    options: ["Teacher", "Student", "Doctor", "Friend"],
    correctIndex: 1,
    explanation: "학생 (學生) = study (학) + person (생). Teacher is 선생님, doctor is 의사, friend is 친구.",
  },
  {
    id: 6,
    section: "Grammar",
    level: "TOPIK 1",
    question: "Which particle marks the subject of a sentence?",
    options: ["을/를", "이/가", "에", "도"],
    correctIndex: 1,
    explanation: "이/가 is the subject particle. 을/를 marks the direct object, 에 marks location or time, 도 means 'also/too'.",
  },
  {
    id: 7,
    section: "Grammar",
    level: "TOPIK 1",
    question: "Complete: 저는 학생___.",
    options: ["입니다", "합니다", "있다", "없다"],
    correctIndex: 0,
    explanation: "입니다 is the formal copula ('to be'). 저는 학생입니다 = I am a student. 합니다 = do, 있다 = exist/have, 없다 = not exist/don't have.",
  },
  {
    id: 8,
    section: "Reading",
    level: "TOPIK 1",
    question: "'나는 사과를 먹습니다' — What is being eaten?",
    options: ["Bread", "Rice", "Apple", "Banana"],
    correctIndex: 2,
    explanation: "사과 = apple. 먹습니다 = eat (formal). 를 is the object particle. 빵 = bread, 밥 = rice, 바나나 = banana.",
  },

  // ─── TOPIK 2 / A2 (Q9–Q12) ──────────────────────────────
  {
    id: 9,
    section: "Grammar",
    level: "TOPIK 2",
    question: "What does the ending -고 싶다 express?",
    options: ["Obligation", "Want / desire", "Ability", "Permission"],
    correctIndex: 1,
    explanation: "Verb stem + -고 싶다 = want to do X. 가고 싶다 = I want to go. Obligation = -아야/어야 하다, ability = -(으)ㄹ 수 있다.",
  },
  {
    id: 10,
    section: "Grammar",
    level: "TOPIK 2",
    question: "Choose the correct connector: 비가 오___ 우산을 가져가세요.",
    options: ["고", "면", "지만", "니까"],
    correctIndex: 3,
    explanation: "-니까 gives a reason that motivates a command or suggestion. 비가 오니까 = Because it's raining (so take an umbrella). -면 = if, -지만 = but, -고 = and/then.",
  },
  {
    id: 11,
    section: "Reading",
    level: "TOPIK 2",
    question: "'어제 친구를 만났습니다' — When did the meeting happen?",
    options: ["Today", "Tomorrow", "Yesterday", "Last week"],
    correctIndex: 2,
    explanation: "어제 = yesterday. 오늘 = today, 내일 = tomorrow, 지난주 = last week. 만났습니다 is the past tense of 만나다 (to meet).",
  },
  {
    id: 12,
    section: "Grammar",
    level: "TOPIK 2",
    question: "Which ending makes a polite request?",
    options: ["-ㅂ시다", "-아/어 주세요", "-겠습니다", "-습니다"],
    correctIndex: 1,
    explanation: "-아/어 주세요 politely asks someone to do something for you. -ㅂ시다 proposes a joint action ('let's'). -겠습니다 expresses intention.",
  },

  // ─── TOPIK 3–4 / B1–B2 (Q13–Q16) ───────────────────────
  {
    id: 13,
    section: "Grammar",
    level: "TOPIK 3–4",
    question: "What does -(으)ㄹ 수 있다 express?",
    options: ["Must", "Should", "Can / is able to", "Want to"],
    correctIndex: 2,
    explanation: "-(으)ㄹ 수 있다 = can / to be able to. Negate with 없다: -(으)ㄹ 수 없다 = cannot. Must = -아야/어야 하다.",
  },
  {
    id: 14,
    section: "Vocabulary",
    level: "TOPIK 3–4",
    question: "What does 경험 mean?",
    options: ["Experiment", "Experience", "Competition", "Education"],
    correctIndex: 1,
    explanation: "경험 (經驗) = experience. 실험 = experiment, 경쟁 = competition, 교육 = education. A common TOPIK vocabulary target.",
  },
  {
    id: 15,
    section: "Reading",
    level: "TOPIK 3–4",
    question: "'환경을 보호하기 위해 노력해야 합니다' — The sentence is about:",
    options: ["Health care", "Environmental protection", "Economic growth", "Education reform"],
    correctIndex: 1,
    explanation: "환경 = environment, 보호하다 = to protect, -기 위해 = in order to. The sentence means: 'We must make efforts to protect the environment.'",
  },
  {
    id: 16,
    section: "Grammar",
    level: "TOPIK 3–4",
    question: "What nuance does -더라고요 convey?",
    options: ["Hearsay", "Personal past observation", "Future intention", "Suggestion"],
    correctIndex: 1,
    explanation: "-더라고요 reports something the speaker directly observed or experienced in the past. It cannot be used for hearsay (use -다고 하더라고요 for that) or about yourself.",
  },

  // ─── TOPIK 5–6 / C1–C2 (Q17–Q20) ───────────────────────
  {
    id: 17,
    section: "Grammar",
    level: "TOPIK 5–6",
    question: "What does -는 바람에 express?",
    options: ["Despite", "Unintended negative cause", "Purpose", "Condition"],
    correctIndex: 1,
    explanation: "-는 바람에 describes an unintended negative cause that led to a bad result. It always pairs with an unfavourable outcome and cannot be used for positive situations.",
  },
  {
    id: 18,
    section: "Vocabulary",
    level: "TOPIK 5–6",
    question: "What does 모순 mean?",
    options: ["Harmony", "Contradiction", "Tradition", "Evolution"],
    correctIndex: 1,
    explanation: "모순 (矛盾) originates from a Chinese fable about a perfectly sharp spear (矛) and a perfectly impenetrable shield (盾) — an impossible contradiction.",
  },
  {
    id: 19,
    section: "Reading",
    level: "TOPIK 5–6",
    question: "'인공지능의 발전이 인간의 노동 시장에 미치는 영향은 다각적으로 분석되어야 한다' — The sentence discusses:",
    options: ["AI ethics only", "Multi-faceted analysis of AI's impact on labor", "Robot manufacturing", "Internet security"],
    correctIndex: 1,
    explanation: "다각적으로 = from multiple angles / multi-faceted. 노동 시장 = labour market. 미치는 영향 = the influence exerted. The sentence calls for comprehensive analysis.",
  },
  {
    id: 20,
    section: "Grammar",
    level: "TOPIK 5–6",
    question: "What does -기는커녕 express?",
    options: ["Not only… but also", "Far from (doing something), let alone", "In order to", "As long as"],
    correctIndex: 1,
    explanation: "-기는커녕 = far from X, not even Y. Stronger and more dismissive than -뿐만 아니라. Example: 돕기는커녕 방해했다 = Far from helping, he got in the way.",
  },
];

export interface PlacementResult {
  score: number;
  levelKey: string;
  levelLabel: string;
  /** How close the score is to the band boundary */
  confidence: "solid" | "borderline-up" | "borderline-down";
  sectionScores: { Vocabulary: number; Grammar: number; Reading: number };
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
  const sectionScores = { Vocabulary: 0, Grammar: 0, Reading: 0 };

  for (const q of PLACEMENT_QUESTIONS) {
    if (answers[q.id] === q.correctIndex) {
      score++;
      sectionScores[q.section]++;
    }
  }

  let levelKey: string;
  let levelLabel: string;
  let bandMin: number;
  let bandMax: number;

  if (score <= 4) {
    levelKey = "foundation"; levelLabel = "Hangul Foundation"; bandMin = 0; bandMax = 4;
  } else if (score <= 8) {
    levelKey = "level_1"; levelLabel = "Level 1 (A1 / TOPIK 1)"; bandMin = 5; bandMax = 8;
  } else if (score <= 12) {
    levelKey = "level_2"; levelLabel = "Level 2 (A2 / TOPIK 2)"; bandMin = 9; bandMax = 12;
  } else if (score <= 16) {
    levelKey = "level_3"; levelLabel = "Level 3–4 (B1–B2 / TOPIK 3–4)"; bandMin = 13; bandMax = 16;
  } else {
    levelKey = "level_5"; levelLabel = "Level 5–6 (C1–C2 / TOPIK 5–6)"; bandMin = 17; bandMax = 20;
  }

  // Within 1 of the upper boundary → close to the next level
  // Within 1 of the lower boundary → on the edge of the previous level
  const confidence: PlacementResult["confidence"] =
    score >= bandMax - 1 && bandMax < 20 ? "borderline-up"
    : score <= bandMin + 1 && bandMin > 0  ? "borderline-down"
    : "solid";

  return { score, levelKey, levelLabel, confidence, sectionScores };
}
