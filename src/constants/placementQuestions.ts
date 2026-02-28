/**
 * 40 multiple-choice placement test questions.
 * Gradual difficulty: Foundation → TOPIK 6.
 * Sections: Vocabulary, Grammar, Reading.
 */

export interface PlacementQuestion {
  id: number;
  section: "Vocabulary" | "Grammar" | "Reading";
  question: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ─── Foundation (Q1–Q6) ─────────────────────────────────
  { id: 1, section: "Vocabulary", question: "What is the Korean writing system called?", options: ["Kanji", "Hangul", "Hiragana", "Pinyin"], correctIndex: 1 },
  { id: 2, section: "Vocabulary", question: "Which of these is the Korean vowel ㅏ romanized as?", options: ["o", "u", "a", "e"], correctIndex: 2 },
  { id: 3, section: "Grammar", question: "How many basic vowels does Hangul have?", options: ["10", "14", "21", "8"], correctIndex: 0 },
  { id: 4, section: "Vocabulary", question: "What does 안녕하세요 mean?", options: ["Thank you", "Goodbye", "Hello", "Sorry"], correctIndex: 2 },
  { id: 5, section: "Reading", question: "Which syllable block reads 'ka'?", options: ["가", "나", "다", "라"], correctIndex: 0 },
  { id: 6, section: "Vocabulary", question: "What does 감사합니다 mean?", options: ["I'm sorry", "Thank you", "Goodbye", "Please"], correctIndex: 1 },

  // ─── Level 1 / TOPIK 1 / A1 (Q7–Q13) ──────────────────
  { id: 7, section: "Vocabulary", question: "What is 물 in English?", options: ["Fire", "Water", "Earth", "Air"], correctIndex: 1 },
  { id: 8, section: "Grammar", question: "Which particle marks the subject of a sentence?", options: ["을/를", "이/가", "에", "도"], correctIndex: 1 },
  { id: 9, section: "Vocabulary", question: "What does 학생 mean?", options: ["Teacher", "Student", "Doctor", "Friend"], correctIndex: 1 },
  { id: 10, section: "Grammar", question: "Complete: 저는 학생___.", options: ["입니다", "합니다", "있다", "없다"], correctIndex: 0 },
  { id: 11, section: "Reading", question: "'나는 사과를 먹습니다' — What is being eaten?", options: ["Bread", "Rice", "Apple", "Banana"], correctIndex: 2 },
  { id: 12, section: "Vocabulary", question: "What does 집 mean?", options: ["School", "House", "Office", "Park"], correctIndex: 1 },
  { id: 13, section: "Grammar", question: "Which is the correct way to say 'I go'?", options: ["저는 갑니다", "저는 옵니다", "저는 먹습니다", "저는 합니다"], correctIndex: 0 },

  // ─── Level 2 / TOPIK 2 / A2 (Q14–Q20) ──────────────────
  { id: 14, section: "Grammar", question: "What does the ending -고 싶다 express?", options: ["Obligation", "Want/desire", "Ability", "Permission"], correctIndex: 1 },
  { id: 15, section: "Vocabulary", question: "What does 병원 mean?", options: ["Bank", "School", "Hospital", "Library"], correctIndex: 2 },
  { id: 16, section: "Grammar", question: "Choose the correct connector: 비가 오___ 우산을 가져가세요.", options: ["고", "면", "지만", "니까"], correctIndex: 3 },
  { id: 17, section: "Reading", question: "'어제 친구를 만났습니다' — When did the meeting happen?", options: ["Today", "Tomorrow", "Yesterday", "Last week"], correctIndex: 2 },
  { id: 18, section: "Vocabulary", question: "What is the meaning of 날씨?", options: ["Weather", "News", "Time", "Place"], correctIndex: 0 },
  { id: 19, section: "Grammar", question: "Which ending makes a polite request?", options: ["-ㅂ시다", "-아/어 주세요", "-겠습니다", "-습니다"], correctIndex: 1 },
  { id: 20, section: "Reading", question: "'주말에 뭐 할 거예요?' — What is this question asking about?", options: ["Past event", "Weekend plans", "Daily routine", "Current activity"], correctIndex: 1 },

  // ─── Level 3 / TOPIK 3 / B1 (Q21–Q26) ──────────────────
  { id: 21, section: "Grammar", question: "What does -(으)ㄹ 수 있다 express?", options: ["Must", "Should", "Can / is able to", "Want to"], correctIndex: 2 },
  { id: 22, section: "Vocabulary", question: "What does 경험 mean?", options: ["Experiment", "Experience", "Competition", "Education"], correctIndex: 1 },
  { id: 23, section: "Grammar", question: "Which grammar connects a reason to result? '배가 아프___ 약을 먹었어요.'", options: ["-아서/-어서", "-지만", "-고", "-면서"], correctIndex: 0 },
  { id: 24, section: "Reading", question: "'환경을 보호하기 위해 노력해야 합니다' — The sentence is about:", options: ["Health care", "Environmental protection", "Economic growth", "Education reform"], correctIndex: 1 },
  { id: 25, section: "Vocabulary", question: "What does 약속 mean?", options: ["Medicine", "Promise / appointment", "Weakness", "Key"], correctIndex: 1 },
  { id: 26, section: "Grammar", question: "What does -는 동안 mean?", options: ["After", "Before", "During / while", "Because"], correctIndex: 2 },

  // ─── Level 4 / TOPIK 4 / B2 (Q27–Q33) ──────────────────
  { id: 27, section: "Grammar", question: "What nuance does -더라고요 convey?", options: ["Hearsay", "Personal past observation", "Future intention", "Suggestion"], correctIndex: 1 },
  { id: 28, section: "Reading", question: "'그 문제에 대해 깊이 생각해 볼 필요가 있습니다' — What is suggested?", options: ["Ignoring the problem", "Thinking deeply about the issue", "Asking someone else", "Writing a report"], correctIndex: 1 },
  { id: 29, section: "Vocabulary", question: "What does 영향 mean?", options: ["Nutrition", "Influence", "Shadow", "Reflection"], correctIndex: 1 },
  { id: 30, section: "Grammar", question: "What does -(으)ㄹ 뻔했다 mean?", options: ["Definitely did", "Almost did", "Never did", "Will do"], correctIndex: 1 },
  { id: 31, section: "Vocabulary", question: "What does 논쟁 mean?", options: ["Agreement", "Debate / controversy", "Negotiation", "Decision"], correctIndex: 1 },
  { id: 32, section: "Grammar", question: "Which is correct? '시간이 없는 ___에 일을 다 끝냈어요.'", options: ["데", "것", "때", "중"], correctIndex: 0 },
  { id: 33, section: "Reading", question: "'사회적 불평등을 해소하기 위한 정책이 필요하다' — The topic is:", options: ["Technology innovation", "Social inequality", "Climate change", "Cultural exchange"], correctIndex: 1 },

  // ─── Level 5–6 / TOPIK 5–6 / C1–C2 (Q34–Q40) ──────────
  { id: 34, section: "Grammar", question: "What does -는 바람에 express?", options: ["Despite", "Unintended negative cause", "Purpose", "Condition"], correctIndex: 1 },
  { id: 35, section: "Vocabulary", question: "What does 모순 mean?", options: ["Harmony", "Contradiction", "Tradition", "Evolution"], correctIndex: 1 },
  { id: 36, section: "Reading", question: "'인공지능의 발전이 인간의 노동 시장에 미치는 영향은 다각적으로 분석되어야 한다' — The sentence discusses:", options: ["AI ethics only", "Multi-faceted analysis of AI's impact on labor", "Robot manufacturing", "Internet security"], correctIndex: 1 },
  { id: 37, section: "Grammar", question: "What is the function of -(으)ㄴ/는 셈이다?", options: ["Expressing regret", "It amounts to / practically speaking", "Making a promise", "Showing surprise"], correctIndex: 1 },
  { id: 38, section: "Vocabulary", question: "What does 통찰력 mean?", options: ["Patience", "Insight", "Creativity", "Courage"], correctIndex: 1 },
  { id: 39, section: "Grammar", question: "What does -기는커녕 express?", options: ["Not only… but also", "Far from (doing something), let alone", "In order to", "As long as"], correctIndex: 1 },
  { id: 40, section: "Reading", question: "'문화적 다양성을 존중하는 사회는 창의적 혁신을 이끌어낼 가능성이 높다' — The passage argues that:", options: ["Uniformity drives innovation", "Cultural diversity fosters creative innovation", "Innovation requires isolation", "Tradition opposes creativity"], correctIndex: 1 },
];

export interface PlacementResult {
  score: number;
  levelKey: string;
  levelLabel: string;
}

export function computePlacementResult(answers: Record<number, number>): PlacementResult {
  let score = 0;
  for (const q of PLACEMENT_QUESTIONS) {
    if (answers[q.id] === q.correctIndex) score++;
  }

  let levelKey: string;
  let levelLabel: string;

  if (score <= 10) {
    levelKey = "foundation";
    levelLabel = "Hangul Foundation";
  } else if (score <= 18) {
    levelKey = "level_1";
    levelLabel = "Level 1 (A1 / TOPIK 1)";
  } else if (score <= 25) {
    levelKey = "level_2";
    levelLabel = "Level 2 (A2 / TOPIK 2)";
  } else if (score <= 33) {
    levelKey = "level_3";
    levelLabel = "Level 3–4 (B1–B2 / TOPIK 3–4)";
  } else {
    levelKey = "level_5";
    levelLabel = "Level 5–6 (C1–C2 / TOPIK 5–6)";
  }

  return { score, levelKey, levelLabel };
}
