/**
 * 30 multiple-choice placement test questions.
 * Gradual difficulty: Foundation → TOPIK 6.
 * Sections: Vocabulary, Grammar, Reading, Speaking.
 * 6 questions per level band × 5 bands = 30 questions.
 *
 * TOPIK alignment:
 *  Q1–Q4, Q21, Q26   Foundation (Hangul / A0)
 *  Q5–Q8, Q22, Q27   TOPIK 1    (A1)
 *  Q9–Q12, Q23, Q28  TOPIK 2    (A2)
 *  Q13–Q16, Q24, Q29 TOPIK 3–4  (B1–B2)
 *  Q17–Q20, Q25, Q30 TOPIK 5–6  (C1–C2)
 */

export interface PlacementQuestion {
  id: number;
  section: "Vocabulary" | "Grammar" | "Reading" | "Speaking";
  level: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Korean text passage displayed as a block quote above the question (Reading questions) */
  passage?: string;
  /** Arabic transfer tip shown RTL below the explanation — hyper-personalised for Arabic speakers */
  arabicTip?: string;
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
    difficulty: 1,
    question: "What does 안녕하세요 mean?",
    options: ["Thank you", "Goodbye", "Hello", "Sorry"],
    correctIndex: 2,
    explanation: "안녕하세요 is the standard formal greeting used any time of day. The casual form is 안녕, and goodbye is 안녕히 가세요.",
  },
  {
    id: 2,
    section: "Vocabulary",
    level: "Foundation",
    difficulty: 1,
    question: "What does 감사합니다 mean?",
    options: ["I'm sorry", "Thank you", "Goodbye", "Please"],
    correctIndex: 1,
    explanation: "감사합니다 is the formal 'thank you'. The more casual form is 고마워요. 미안합니다 = I'm sorry.",
  },
  {
    id: 3,
    section: "Grammar",
    level: "Foundation",
    difficulty: 1,
    question: "How many basic vowels does Hangul have?",
    options: ["10", "14", "21", "8"],
    correctIndex: 0,
    explanation: "Hangul has 10 basic vowels (ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ) and 14 basic consonants, which combine to form syllable blocks.",
  },
  {
    id: 4,
    section: "Reading",
    level: "Foundation",
    difficulty: 1,
    question: "Which syllable block reads 'ka'?",
    options: ["가", "나", "다", "라"],
    correctIndex: 0,
    explanation: "가 = ㄱ (g/k) + ㅏ (a). 나 = na, 다 = da, 라 = ra/la. ㄱ sounds like 'k' at the start of a syllable.",
  },
  {
    id: 21,
    section: "Reading",
    level: "Foundation",
    difficulty: 1,
    passage: "저는 학생이에요. 학교에 가요. 친구가 있어요.",
    question: "Who is the person in the passage?",
    options: ["A teacher", "A student", "A doctor", "An office worker"],
    correctIndex: 1,
    explanation: "저는 학생이에요 = 'I am a student.' 학교에 가요 = goes to school. 학생 is one of the first nouns learners of Korean encounter.",
  },
  {
    id: 26,
    section: "Speaking",
    level: "Foundation",
    difficulty: 1,
    question: "When meeting someone for the first time in Korean, you say:",
    options: ["잘 가요", "반갑습니다", "감사합니다", "괜찮아요"],
    correctIndex: 1,
    explanation: "반갑습니다 = 'Nice/glad to meet you' — the standard first-meeting greeting. 잘 가요 = goodbye (to someone leaving), 감사합니다 = thank you, 괜찮아요 = it's okay.",
  },

  // ─── TOPIK 1 / A1 (Q5–Q8) ───────────────────────────────
  {
    id: 5,
    section: "Vocabulary",
    level: "TOPIK 1",
    difficulty: 2,
    question: "What does 학생 mean?",
    options: ["Teacher", "Student", "Doctor", "Friend"],
    correctIndex: 1,
    explanation: "학생 (學生) = study (학) + person (생). Teacher is 선생님, doctor is 의사, friend is 친구.",
  },
  {
    id: 6,
    section: "Grammar",
    level: "TOPIK 1",
    difficulty: 2,
    question: "Which particle marks the subject of a sentence?",
    options: ["을/를", "이/가", "에", "도"],
    correctIndex: 1,
    explanation: "이/가 is the subject particle. 을/를 marks the direct object, 에 marks location or time, 도 means 'also/too'.",
    arabicTip: "في العربية لا توجد جسيمات — تُعرف وظيفة الكلمة من موضعها في الجملة. في الكورية تُضاف لواحق: 이/가 للفاعل، 을/를 للمفعول — بصرف النظر عن ترتيب الكلمات.",
  },
  {
    id: 7,
    section: "Grammar",
    level: "TOPIK 1",
    difficulty: 2,
    question: "Complete: 저는 학생___.",
    options: ["입니다", "합니다", "있다", "없다"],
    correctIndex: 0,
    explanation: "입니다 is the formal copula ('to be'). 저는 학생입니다 = I am a student. 합니다 = do, 있다 = exist/have, 없다 = not exist/don't have.",
    arabicTip: "في العربية الجملة الاسمية لا تحتاج 'هو/يكون' في الحاضر: 'أنا طالب' — جملة تامة. في الكورية يجب دائماً إنهاء الجملة بالفعل الرابط: 입니다 أو 이에요.",
  },
  {
    id: 8,
    section: "Reading",
    level: "TOPIK 1",
    difficulty: 2,
    question: "'나는 사과를 먹습니다' — What is being eaten?",
    options: ["Bread", "Rice", "Apple", "Banana"],
    correctIndex: 2,
    explanation: "사과 = apple. 먹습니다 = eat (formal). 를 is the object particle. 빵 = bread, 밥 = rice, 바나나 = banana.",
    arabicTip: "لاحظ كلمة 사과를: اللاحقة 를 تُشير إلى المفعول به. في العربية نعرف المفعول من الفتحة أو الترتيب، لكن في الكورية الجسيمات تتيح لك تغيير ترتيب الكلمات دون تغيير المعنى.",
  },
  {
    id: 22,
    section: "Reading",
    level: "TOPIK 1",
    difficulty: 2,
    passage: "오늘 날씨가 많이 추웠어요. 그래서 집에서 따뜻한 국을 먹었어요. 오후에는 친구와 커피숍에 갔어요.",
    question: "What was the weather like today?",
    options: ["Hot and humid", "Cloudy and rainy", "Very cold", "Warm and sunny"],
    correctIndex: 2,
    explanation: "날씨가 많이 추웠어요 = the weather was very cold. 많이 = very/a lot, 춥다 → 추웠어요 = was cold (past tense). 그래서 = so/therefore.",
  },
  {
    id: 27,
    section: "Speaking",
    level: "TOPIK 1",
    difficulty: 2,
    question: "A Korean friend greets you: '밥 먹었어요?' What are they most likely doing?",
    options: ["Inviting you to eat", "Asking if you are hungry", "Using a common casual greeting like 'How are you?'", "Complaining about skipping a meal"],
    correctIndex: 2,
    explanation: "'밥 먹었어요?' (Have you eaten?) acts as a friendly greeting similar to 'How are you?' — it shows care for the other person's wellbeing and is not always a literal question about food.",
    arabicTip: "في العربية المصرية 'عامل إيه؟/كيف حالك؟' هي التحية المعتادة. في الكورية '밥 먹었어요؟' (أكلت؟) تؤدي نفس الوظيفة الاجتماعية — سؤال لطيف يُعبّر عن الاهتمام.",
  },

  // ─── TOPIK 2 / A2 (Q9–Q12) ──────────────────────────────
  {
    id: 9,
    section: "Grammar",
    level: "TOPIK 2",
    difficulty: 3,
    question: "What does the ending -고 싶다 express?",
    options: ["Obligation", "Want / desire", "Ability", "Permission"],
    correctIndex: 1,
    explanation: "Verb stem + -고 싶다 = want to do X. 가고 싶다 = I want to go. Obligation = -아야/어야 하다, ability = -(으)ㄹ 수 있다.",
  },
  {
    id: 10,
    section: "Grammar",
    level: "TOPIK 2",
    difficulty: 3,
    question: "Choose the correct connector: 비가 오___ 우산을 가져가세요.",
    options: ["고", "면", "지만", "니까"],
    correctIndex: 3,
    explanation: "-니까 gives a reason that motivates a command or suggestion. 비가 오니까 = Because it's raining (so take an umbrella). -면 = if, -지만 = but, -고 = and/then.",
    arabicTip: "مثل 'لأن/بما أن' في العربية، -니까 تشرح سبباً قبل أمر أو اقتراح. انتبه: -어서 تُشبهها لكن لا تأتي مع الأوامر — هذا فرق مهم جداً لمتعلمي العربية.",
  },
  {
    id: 11,
    section: "Reading",
    level: "TOPIK 2",
    difficulty: 3,
    question: "'어제 친구를 만났습니다' — When did the meeting happen?",
    options: ["Today", "Tomorrow", "Yesterday", "Last week"],
    correctIndex: 2,
    explanation: "어제 = yesterday. 오늘 = today, 내일 = tomorrow, 지난주 = last week. 만났습니다 is the past tense of 만나다 (to meet).",
  },
  {
    id: 12,
    section: "Grammar",
    level: "TOPIK 2",
    difficulty: 3,
    question: "Which ending makes a polite request?",
    options: ["-ㅂ시다", "-아/어 주세요", "-겠습니다", "-습니다"],
    correctIndex: 1,
    explanation: "-아/어 주세요 politely asks someone to do something for you. -ㅂ시다 proposes a joint action ('let's'). -겠습니다 expresses intention.",
  },
  {
    id: 23,
    section: "Reading",
    level: "TOPIK 2",
    difficulty: 3,
    passage: "시험이 다음 주에 있어서 매일 도서관에서 공부해요. 피곤하지만 좋은 점수를 받고 싶어요.",
    question: "Why does this person go to the library every day?",
    options: ["To borrow books", "To meet friends", "Because the exam is next week", "Because the library is near their home"],
    correctIndex: 2,
    explanation: "-어서 in '시험이 다음 주에 있어서' = 'because the exam is next week.' -어서 links cause to result. -지만 = however/but (피곤하지만 = although tired).",
    arabicTip: "حرف -어서 يشبه 'فـ/لذلك' الدالة على السبب. لكن انتبه: -어서 لا يأتي مع الأوامر أو الاقتراحات — في تلك الحالات استخدم -니까 بدلاً منه.",
  },
  {
    id: 28,
    section: "Speaking",
    level: "TOPIK 2",
    difficulty: 3,
    question: "Talking casually to a close friend your own age — 'I'm going to the library.' Which form is most appropriate?",
    options: ["도서관에 가십니다", "도서관에 가겠습니다", "도서관에 가요", "도서관에 가"],
    correctIndex: 3,
    explanation: "반말 (informal speech) like '도서관에 가' is used with close friends of the same age. '가요' is polite (해요체); '가십니다/가겠습니다' are formal and sound stiff in casual peer conversation.",
    arabicTip: "في العربية المصرية نستخدم نفس الكلمات مع الجميع ونغيّر النبرة فقط. في الكورية يتغير شكل الفعل كله: 반말 مع الأصدقاء، 해요체 مع الغرباء، 합쇼체 في المواقف الرسمية.",
  },

  // ─── TOPIK 3–4 / B1–B2 (Q13–Q16) ───────────────────────
  {
    id: 13,
    section: "Grammar",
    level: "TOPIK 3–4",
    difficulty: 4,
    question: "What does -(으)ㄹ 수 있다 express?",
    options: ["Must", "Should", "Can / is able to", "Want to"],
    correctIndex: 2,
    explanation: "-(으)ㄹ 수 있다 = can / to be able to. Negate with 없다: -(으)ㄹ 수 없다 = cannot. Must = -아야/어야 하다.",
  },
  {
    id: 14,
    section: "Vocabulary",
    level: "TOPIK 3–4",
    difficulty: 4,
    question: "What does 경험 mean?",
    options: ["Experiment", "Experience", "Competition", "Education"],
    correctIndex: 1,
    explanation: "경험 (經驗) = experience. 실험 = experiment, 경쟁 = competition, 교육 = education. A common TOPIK vocabulary target.",
  },
  {
    id: 15,
    section: "Reading",
    level: "TOPIK 3–4",
    difficulty: 4,
    question: "'환경을 보호하기 위해 노력해야 합니다' — The sentence is about:",
    options: ["Health care", "Environmental protection", "Economic growth", "Education reform"],
    correctIndex: 1,
    explanation: "환경 = environment, 보호하다 = to protect, -기 위해 = in order to. The sentence means: 'We must make efforts to protect the environment.'",
  },
  {
    id: 16,
    section: "Grammar",
    level: "TOPIK 3–4",
    difficulty: 4,
    question: "What nuance does -더라고요 convey?",
    options: ["Hearsay", "Personal past observation", "Future intention", "Suggestion"],
    correctIndex: 1,
    explanation: "-더라고요 reports something the speaker directly observed or experienced in the past. It cannot be used for hearsay (use -다고 하더라고요 for that) or about yourself.",
    arabicTip: "في العربية نقول 'لاحظتُ أن / رأيتُ أن' للتعبير عن ملاحظة شخصية. في الكورية، -더라고요 مخصص فقط لما تشهده بنفسك مباشرة — لا يُستخدم لنقل كلام الآخرين.",
  },
  {
    id: 24,
    section: "Reading",
    level: "TOPIK 3–4",
    difficulty: 4,
    passage: "현대인들은 스마트폰을 지나치게 사용하는 경향이 있다. 이로 인해 수면 부족과 집중력 저하 문제가 심각해지고 있다는 우려가 높아지고 있다.",
    question: "What is the main concern expressed in this passage?",
    options: ["Smartphones are becoming too expensive", "Excessive smartphone use is causing health and focus problems", "Sleep disorders have many different causes", "A new app was developed to improve concentration"],
    correctIndex: 1,
    explanation: "지나치게 사용 = excessive use. 이로 인해 = as a result of this. 수면 부족 = sleep deprivation, 집중력 저하 = decreased concentration. 우려 = concern/worry — a key TOPIK 3–4 vocabulary target.",
  },
  {
    id: 29,
    section: "Speaking",
    level: "TOPIK 3–4",
    difficulty: 4,
    question: "You want to share your opinion in a group discussion without sounding too forceful. Which sentence ending is best?",
    options: ["~입니다", "~것 같아요", "~어야 합니다", "~면 안 됩니다"],
    correctIndex: 1,
    explanation: "'~것 같아요' ('It seems / I think…') softens an opinion in spoken Korean. '~어야 합니다' = must do, '~면 안 됩니다' = must not — both express obligation and sound too assertive in open discussion.",
    arabicTip: "في العربية نقول 'في رأيي' أو 'أعتقد أن' للتلطيف في بداية الجملة. في الكورية، إضافة '것 같아요' في نهاية الجملة يؤدي نفس الغرض ويجعل رأيك أقل مباشرة.",
  },

  // ─── TOPIK 5–6 / C1–C2 (Q17–Q20) ───────────────────────
  {
    id: 17,
    section: "Grammar",
    level: "TOPIK 5–6",
    difficulty: 5,
    question: "What does -는 바람에 express?",
    options: ["Despite", "Unintended negative cause", "Purpose", "Condition"],
    correctIndex: 1,
    explanation: "-는 바람에 describes an unintended negative cause that led to a bad result. It always pairs with an unfavourable outcome and cannot be used for positive situations.",
  },
  {
    id: 18,
    section: "Vocabulary",
    level: "TOPIK 5–6",
    difficulty: 5,
    question: "What does 모순 mean?",
    options: ["Harmony", "Contradiction", "Tradition", "Evolution"],
    correctIndex: 1,
    explanation: "모순 (矛盾) originates from a Chinese fable about a perfectly sharp spear (矛) and a perfectly impenetrable shield (盾) — an impossible contradiction.",
  },
  {
    id: 19,
    section: "Reading",
    level: "TOPIK 5–6",
    difficulty: 5,
    question: "'인공지능의 발전이 인간의 노동 시장에 미치는 영향은 다각적으로 분석되어야 한다' — The sentence discusses:",
    options: ["AI ethics only", "Multi-faceted analysis of AI's impact on labor", "Robot manufacturing", "Internet security"],
    correctIndex: 1,
    explanation: "다각적으로 = from multiple angles / multi-faceted. 노동 시장 = labour market. 미치는 영향 = the influence exerted. The sentence calls for comprehensive analysis.",
  },
  {
    id: 20,
    section: "Grammar",
    level: "TOPIK 5–6",
    difficulty: 5,
    question: "What does -기는커녕 express?",
    options: ["Not only… but also", "Far from (doing something), let alone", "In order to", "As long as"],
    correctIndex: 1,
    explanation: "-기는커녕 = far from X, not even Y. Stronger and more dismissive than -뿐만 아니라. Example: 돕기는커녕 방해했다 = Far from helping, he got in the way.",
  },
  {
    id: 25,
    section: "Reading",
    level: "TOPIK 5–6",
    difficulty: 5,
    passage: "글로벌 공급망 불안정으로 인해 원자재 가격이 급등하면서 국내 소비자 물가에도 상당한 압력이 가해지고 있다. 정부는 물가 안정을 위한 긴급 재정 정책을 검토 중인 것으로 알려졌다.",
    question: "What is the government currently reviewing, according to this passage?",
    options: ["Trade agreements to diversify supply chains", "Expanding raw material exports", "Emergency fiscal policy to stabilise prices", "Abolishing price caps to protect consumers"],
    correctIndex: 2,
    explanation: "'물가 안정을 위한 긴급 재정 정책을 검토 중' = reviewing emergency fiscal policy for price stabilisation. 것으로 알려졌다 = it is understood that (formal reported-speech marker in academic/news writing).",
  },
  {
    id: 30,
    section: "Speaking",
    level: "TOPIK 5–6",
    difficulty: 5,
    question: "You are giving a formal presentation at a business conference. Which speech level should you use throughout?",
    options: ["반말 — sounds natural and confident", "해요체 — polite and widely used daily", "합쇼체 — formal register for announcements and presentations", "혼잣말 — used when addressing a large audience"],
    correctIndex: 2,
    explanation: "합쇼체 (-습니다/-ㅂ니다 endings) is expected for formal public speaking: conferences, official broadcasts, and presentations. 해요체 is polite but conversational; 반말 would be inappropriate with an unfamiliar professional audience.",
    arabicTip: "كما في العربية فجوة بين الفصحى والعامية، في الكورية: 합쇼체 للخطابات والتقارير الرسمية، و해요체 للمحادثة اليومية المهذبة — اختيار المستوى الخاطئ يؤثر على انطباعك المهني.",
  },
];

export interface PlacementResult {
  score: number;
  levelKey: string;
  levelLabel: string;
  /** How close the score is to the band boundary */
  confidence: "solid" | "borderline-up" | "borderline-down";
  sectionScores: { Vocabulary: number; Grammar: number; Reading: number; Speaking: number };
}

/**
 * Score brackets (out of 30 — 6 questions × 5 TOPIK bands):
 *  0–6   → Foundation (A0)
 *  7–12  → Level 1    (A1 / TOPIK 1)
 *  13–18 → Level 2    (A2 / TOPIK 2)
 *  19–24 → Level 3–4  (B1–B2 / TOPIK 3–4)
 *  25–30 → Level 5–6  (C1–C2 / TOPIK 5–6)
 */
export function computePlacementResult(answers: Record<number, number>): PlacementResult {
  let score = 0;
  const sectionScores = { Vocabulary: 0, Grammar: 0, Reading: 0, Speaking: 0 };

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

  if (score <= 6) {
    levelKey = "foundation"; levelLabel = "Hangul Foundation"; bandMin = 0; bandMax = 6;
  } else if (score <= 12) {
    levelKey = "level_1"; levelLabel = "Level 1 (A1 / TOPIK 1)"; bandMin = 7; bandMax = 12;
  } else if (score <= 18) {
    levelKey = "level_2"; levelLabel = "Level 2 (A2 / TOPIK 2)"; bandMin = 13; bandMax = 18;
  } else if (score <= 24) {
    levelKey = "level_3"; levelLabel = "Level 3–4 (B1–B2 / TOPIK 3–4)"; bandMin = 19; bandMax = 24;
  } else {
    levelKey = "level_5"; levelLabel = "Level 5–6 (C1–C2 / TOPIK 5–6)"; bandMin = 25; bandMax = 30;
  }

  // Within 1 of the upper boundary → close to the next level
  // Within 1 of the lower boundary → on the edge of the previous level
  const confidence: PlacementResult["confidence"] =
    score >= bandMax - 1 && bandMax < 30 ? "borderline-up"
    : score <= bandMin + 1 && bandMin > 0  ? "borderline-down"
    : "solid";

  return { score, levelKey, levelLabel, confidence, sectionScores };
}

// ─── Study Roadmaps ────────────────────────────────────────────────────────

export interface RoadmapWeek {
  week: number;
  title: string;
  tasks: string[];
}

export const STUDY_ROADMAPS: Record<string, RoadmapWeek[]> = {
  foundation: [
    { week: 1, title: "Master the Korean alphabet", tasks: ["Learn 14 basic consonants (ㄱ ㄴ ㄷ ㄹ …)", "Learn 10 basic vowels (ㅏ ㅑ ㅓ ㅕ …)", "Practice reading syllable blocks aloud"] },
    { week: 2, title: "Pronunciation & syllable rules", tasks: ["Understand batchim (final consonants)", "Practice liaison & nasalisation rules", "Read simple syllables at speed (가나다라…)"] },
    { week: 3, title: "Core greetings & self-introduction", tasks: ["안녕하세요 · 감사합니다 · 미안합니다", "Introduce yourself: 저는 [name]입니다", "Numbers 1–10 in both counting systems"] },
    { week: 4, title: "Everyday basics", tasks: ["Days of the week & months", "Common classroom phrases", "Start Klovers Foundation class"] },
  ],
  level_1: [
    { week: 1, title: "Sentence structure & particles", tasks: ["Subject particle 이/가, object particle 을/를", "Topic particle 은/는 vs subject particle", "Build 5 simple Subject–Verb sentences daily"] },
    { week: 2, title: "Core verbs & adjectives", tasks: ["가다·오다·먹다·마시다·보다", "좋다·싫다·크다·작다 (descriptive verbs)", "Conjugate into formal polite -ㅂ니다/습니다"] },
    { week: 3, title: "Present, past & future tense", tasks: ["Present: -아요/어요", "Past: -았어요/었어요", "Future: -(으)ㄹ 거예요"] },
    { week: 4, title: "Daily conversation practice", tasks: ["Ordering food at a café", "Asking for prices & locations", "Start Klovers Level 1 class"] },
  ],
  level_2: [
    { week: 1, title: "Connectors & reasons", tasks: ["Reason: -아서/어서 and -니까", "Sequence: -고 (and then)", "Practice writing 5 linked sentences per day"] },
    { week: 2, title: "Expressing desire & ability", tasks: ["-고 싶다 (want to)", "-(으)ㄹ 수 있다/없다 (can/cannot)", "Polite requests: -아/어 주세요"] },
    { week: 3, title: "Conditionals & time", tasks: ["If/when: -(으)면", "While: -는 동안", "Duration: -동안 vs -후에"] },
    { week: 4, title: "Reading short Korean texts", tasks: ["Read one Korean children's book passage weekly", "Expand vocabulary to 500+ words", "Start Klovers Level 2 class"] },
  ],
  level_3: [
    { week: 1, title: "Advanced grammar patterns", tasks: ["-더라고요 (past personal observation)", "-는 바람에 (unintended negative cause)", "-(으)ㄹ 뻔했다 (almost did)"] },
    { week: 2, title: "Indirect speech & nuance", tasks: ["Indirect speech: -다고 하다 / -라고 하다", "Quoted commands: -(으)라고 하다", "Distinguish formal & informal registers"] },
    { week: 3, title: "Intermediate reading comprehension", tasks: ["Read Korean news headlines daily", "Summarise articles in Korean (3–5 sentences)", "Learn 20 new TOPIK 3 vocabulary words per week"] },
    { week: 4, title: "Natural speech & idioms", tasks: ["Watch 1 Korean drama episode with Korean subtitles", "Shadow native speakers for pronunciation", "Start Klovers Level 3–4 class"] },
  ],
  level_5: [
    { week: 1, title: "Advanced grammar nuance", tasks: ["-(으)ㄴ/는 셈이다 (amounts to / practically)", "-기는커녕 (far from, let alone)", "모순·영향·논쟁 — C1 vocabulary lists"] },
    { week: 2, title: "Academic & professional Korean", tasks: ["Write a 200-word opinion paragraph in Korean", "Learn formal writing endings (-ㄴ바, -인즉)", "Study Korean business email patterns"] },
    { week: 3, title: "TOPIK II writing practice", tasks: ["Practice 200-word descriptive essays (설명문)", "Practice 700-word argumentative essays (논설문)", "Review past TOPIK II writing prompts"] },
    { week: 4, title: "Mastery & refinement", tasks: ["Read Korean newspaper editorials & opinion columns", "Maintain a Korean journal (한국어 일기)", "Start Klovers Level 5–6 advanced class"] },
  ],
};
