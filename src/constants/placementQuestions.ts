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
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening" | "Speaking";
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
    section: "Listening",
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
    section: "Listening",
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
    section: "Listening",
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
    section: "Listening",
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
    section: "Listening",
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

// ─── Speaking Assessment Prompts ──────────────────────────────────────────────
// 5 prompts per level — shown in the post-MCQ speaking self-assessment phase.
export const SPEAKING_PROMPTS: Record<string, { korean: string; romanisation: string }[]> = {
  hangul: [
    { korean: "안녕하세요.", romanisation: "an-nyeong-ha-se-yo" },
    { korean: "감사합니다.", romanisation: "gam-sa-ham-ni-da" },
    { korean: "저는 학생이에요.", romanisation: "jeo-neun hak-saeng-i-e-yo" },
    { korean: "이름이 뭐예요?", romanisation: "i-reum-i mwo-ye-yo" },
    { korean: "만나서 반갑습니다.", romanisation: "man-na-seo ban-gap-seum-ni-da" },
  ],
  l1: [
    { korean: "오늘 날씨가 좋아요.", romanisation: "o-neul nal-ssi-ga jo-a-yo" },
    { korean: "저는 한국어를 배우고 있어요.", romanisation: "jeo-neun han-gu-geo-reul bae-u-go i-sseo-yo" },
    { korean: "커피 한 잔 주세요.", romanisation: "keo-pi han jan ju-se-yo" },
    { korean: "지금 어디에 가요?", romanisation: "ji-geum eo-di-e ga-yo" },
    { korean: "오늘 많이 피곤해요.", romanisation: "o-neul ma-ni pi-gon-hae-yo" },
  ],
  l2: [
    { korean: "비가 오니까 우산을 가져가세요.", romanisation: "bi-ga o-ni-kka u-sa-neul ga-jyeo-ga-se-yo" },
    { korean: "한국 음식을 좋아해서 자주 먹어요.", romanisation: "han-guk eum-si-geul jo-a-hae-seo ja-ju meo-geo-yo" },
    { korean: "도서관에서 공부해야 해요.", romanisation: "do-seo-gwa-ne-seo gong-bu-hae-ya hae-yo" },
    { korean: "이번 주말에 영화 보러 갈 거예요.", romanisation: "i-beon ju-ma-re yeong-hwa bo-reo gal geo-ye-yo" },
    { korean: "어제 친구를 만났는데 정말 즐거웠어요.", romanisation: "eo-je chin-gu-reul man-nan-neun-de jeong-mal jeul-geo-wo-sseo-yo" },
  ],
  l3: [
    { korean: "환경 문제에 더 관심을 가져야 할 것 같아요.", romanisation: "hwan-gyeong mun-je-e deo gwan-si-meul ga-jyeo-ya hal geot ga-ta-yo" },
    { korean: "경험이 많을수록 더 현명한 결정을 내릴 수 있어요.", romanisation: "gyeong-heo-mi ma-neul-su-rok deo hyeon-myeong-han gyeol-jeong-eul nae-ril su i-sseo-yo" },
    { korean: "스마트폰을 지나치게 사용하는 게 건강에 좋지 않아요.", romanisation: "seu-ma-teu-po-neul ji-na-chi-ge sa-yong-ha-neun ge geon-gang-e jo-chi a-na-yo" },
    { korean: "요즘 바쁜 바람에 운동을 못 하고 있어요.", romanisation: "yo-jeum ba-ppeun ba-ra-me un-dong-eul mot ha-go i-sseo-yo" },
    { korean: "그 결정이 어떤 영향을 미칠지 생각해 봐야 해요.", romanisation: "geu gyeol-jeong-i eo-tteon yeong-hyang-eul mi-chil-ji saeng-ga-kae bwa-ya hae-yo" },
  ],
  l5: [
    { korean: "인공지능 발전이 노동 시장에 미치는 영향은 다각적으로 분석되어야 합니다.", romanisation: "in-gong-ji-neung bal-jeo-ni no-dong si-jang-e mi-chi-neun yeong-hyang-eun da-gak-jeo-geu-ro bun-seok-doe-eo-ya ham-ni-da" },
    { korean: "글로벌 공급망 불안정으로 인해 물가 상승 압력이 높아지고 있습니다.", romanisation: "geul-lo-beol gong-geup-mang bu-ran-jeong-eu-ro in-hae mul-ga sang-seung am-nyeo-gi no-pa-ji-go it-seum-ni-da" },
    { korean: "이 정책의 실효성을 높이려면 국민적 합의가 선행되어야 합니다.", romanisation: "i jeong-chae-gui sil-hyo-seong-eul no-pi-ryeo-myeon guk-min-jeok ha-bui-ga seon-haeng-doe-eo-ya ham-ni-da" },
    { korean: "모순된 주장을 체계적으로 반박하기 위한 논리적 근거가 필요합니다.", romanisation: "mo-sun-doen ju-jang-eul che-gye-jeo-geu-ro ban-ba-ka-gi wi-han nol-li-jeok geun-geo-ga pil-lyo-ham-ni-da" },
    { korean: "그 사안은 해결되기는커녕 더욱 복잡해지고 있습니다.", romanisation: "geu sa-a-neun hae-gyeol-doe-gi-neun-keo-nyeong deo-uk bok-ja-pae-ji-go it-seum-ni-da" },
  ],
};

// ─── Dedicated Listening Exam ─────────────────────────────────────────────────
// 5 level-matched questions per band. Audio (TTS) → MCQ comprehension.

export interface SubTestQuestion {
  audio?: string;   // text played via TTS (Listening questions)
  passage?: string; // text displayed (Reading questions)
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const LISTENING_EXAM: Record<string, SubTestQuestion[]> = {
  hangul: [
    {
      audio: "저는 선생님이에요.",
      question: "What is the speaker's job?",
      options: ["Student", "Teacher", "Doctor", "Chef"],
      correctIndex: 1,
      explanation: "선생님 = teacher. 저는 선생님이에요 = I am a teacher.",
    },
    {
      audio: "오늘 날씨가 맑아요.",
      question: "What is the weather like today?",
      options: ["Rainy", "Cloudy", "Clear and sunny", "Windy"],
      correctIndex: 2,
      explanation: "맑다 = clear/sunny. 날씨가 맑아요 = the weather is clear.",
    },
    {
      audio: "사과가 있어요. 바나나도 있어요.",
      question: "What items are mentioned?",
      options: ["Only apples", "Apples and bananas", "Only bananas", "Apples and oranges"],
      correctIndex: 1,
      explanation: "사과 = apple, 바나나 = banana. 도 = also/too. Both are present.",
    },
    {
      audio: "저는 학교에 가요.",
      question: "Where is the speaker going?",
      options: ["Home", "School", "Hospital", "Market"],
      correctIndex: 1,
      explanation: "학교 = school. 가요 = go (present). 학교에 가요 = going to school.",
    },
    {
      audio: "이름이 뭐예요? 저는 민준이에요.",
      question: "What is the speaker's name?",
      options: ["Minjun", "Jihoon", "Seungi", "Jiyoung"],
      correctIndex: 0,
      explanation: "이름이 뭐예요? = What is your name? 저는 민준이에요 = I am Minjun.",
    },
  ],
  l1: [
    {
      audio: "저는 어제 도서관에서 공부했어요. 그리고 친구를 만났어요.",
      question: "Where did the speaker study yesterday?",
      options: ["Home", "Café", "Library", "School"],
      correctIndex: 2,
      explanation: "도서관 = library. 도서관에서 공부했어요 = studied at the library.",
    },
    {
      audio: "저는 한국 음식을 좋아해요. 특히 비빔밥을 좋아해요.",
      question: "Which food does the speaker especially like?",
      options: ["Kimchi", "Bibimbap", "Bulgogi", "Tteokbokki"],
      correctIndex: 1,
      explanation: "특히 = especially. 비빔밥 = bibimbap (mixed rice bowl).",
    },
    {
      audio: "내일 날씨가 추울 거예요. 그래서 두꺼운 옷을 입으세요.",
      question: "What is the listener advised to do?",
      options: ["Bring an umbrella", "Apply sunscreen", "Wear thick clothes", "Stay indoors"],
      correctIndex: 2,
      explanation: "추울 거예요 = will be cold. 두꺼운 옷을 입으세요 = please wear thick clothes.",
    },
    {
      audio: "저는 매일 아침에 운동해요. 건강이 중요하니까요.",
      question: "Why does the speaker exercise every morning?",
      options: ["They enjoy it", "Health is important", "Doctor's recommendation", "Friends recommended it"],
      correctIndex: 1,
      explanation: "-니까요 = because. 건강이 중요하니까요 = because health is important.",
    },
    {
      audio: "오늘 수업은 3시에 끝나요. 그래서 4시에 집에 가요.",
      question: "What time does class end?",
      options: ["2 o'clock", "3 o'clock", "4 o'clock", "5 o'clock"],
      correctIndex: 1,
      explanation: "수업 = class. 3시에 끝나요 = ends at 3 o'clock. 4시 is when they get home.",
    },
  ],
  l2: [
    {
      audio: "버스가 30분 뒤에 와요. 지하철을 타는 게 더 빠를 것 같아요.",
      question: "Why is the subway recommended?",
      options: ["Cheaper fare", "More comfortable", "Faster", "Safer"],
      correctIndex: 2,
      explanation: "빠르다 = fast. 더 빠를 것 같아요 = it seems faster. The subway is recommended for speed.",
    },
    {
      audio: "이번 시험은 어려웠지만 열심히 공부해서 잘 봤어요.",
      question: "How did the speaker do on the exam?",
      options: ["It was easy and passed", "It was hard but did well from studying hard", "It was hard and failed", "Didn't prepare well"],
      correctIndex: 1,
      explanation: "-지만 = but/however. 열심히 공부해서 = because of studying hard. Difficult but passed.",
    },
    {
      audio: "회의가 취소됐어요. 대신 내일 오후 2시로 바꿨어요.",
      question: "What happened to the meeting?",
      options: ["Moved to tomorrow afternoon at 2", "Cancelled entirely", "Moved to this afternoon", "Started early"],
      correctIndex: 0,
      explanation: "취소됐어요 = was cancelled. 대신 = instead. 내일 오후 2시로 바꿨어요 = rescheduled to tomorrow at 2pm.",
    },
    {
      audio: "피곤해서 오늘 저녁은 집에서 쉴 거예요. 영화나 볼 것 같아요.",
      question: "What will the speaker likely do tonight?",
      options: ["Go out to eat", "Exercise at the gym", "Rest at home and watch a movie", "Study"],
      correctIndex: 2,
      explanation: "피곤해서 = because tired. 집에서 쉴 거예요 = will rest at home. 영화나 볼 것 같아요 = seems will watch a movie.",
    },
    {
      audio: "제 친구는 노래를 잘 해요. 그래서 매주 노래방에 가요.",
      question: "Why does the friend go to karaoke every week?",
      options: ["They like dancing", "They sing well", "They work there", "It is cheap"],
      correctIndex: 1,
      explanation: "노래를 잘 해요 = sings well. 그래서 = therefore. 노래방 = karaoke room.",
    },
  ],
  l3: [
    {
      audio: "최근 연구에 따르면, 하루에 7-8시간 수면이 집중력과 기억력에 직접적인 영향을 미친다고 합니다.",
      question: "What does the research suggest?",
      options: ["Exercise improves memory", "7–8 hours of sleep directly affects concentration and memory", "Less sleep boosts productivity", "Diet affects focus"],
      correctIndex: 1,
      explanation: "에 따르면 = according to. 집중력 = concentration, 기억력 = memory. 직접적인 영향을 미치다 = directly affects.",
    },
    {
      audio: "이번 프로젝트는 예상보다 시간이 많이 걸렸어요. 하지만 팀원들의 협력 덕분에 완성할 수 있었어요.",
      question: "How was the project completed?",
      options: ["One person worked overtime", "AI tools were used", "Team cooperation made it possible", "Deadline was extended"],
      correctIndex: 2,
      explanation: "팀원들의 협력 = team cooperation. 덕분에 = thanks to. 완성할 수 있었어요 = were able to complete.",
    },
    {
      audio: "환경 오염을 줄이기 위해서는 개인의 노력뿐만 아니라 기업과 정부의 역할도 중요합니다.",
      question: "According to this, who needs to act on pollution?",
      options: ["Only individuals", "Only companies and governments", "Individuals, companies, AND governments all", "Only environmental groups"],
      correctIndex: 2,
      explanation: "뿐만 아니라 = not only... but also. 개인 = individuals, 기업 = companies, 정부 = government — all three mentioned.",
    },
    {
      audio: "그 행사는 예상보다 많은 사람이 참가해서 준비한 음식이 모자랐어요.",
      question: "What was the problem at the event?",
      options: ["The weather was bad", "Too few people attended", "There was not enough food prepared", "The program was boring"],
      correctIndex: 2,
      explanation: "예상보다 많은 사람 = more people than expected. 음식이 모자랐어요 = food was not enough.",
    },
    {
      audio: "요즘 젊은 세대가 결혼보다 개인 생활을 더 중요하게 생각하는 경향이 있습니다.",
      question: "What trend is described?",
      options: ["Young people prefer group activities", "Young generation prioritises personal life over marriage", "Marriage rates are increasing", "Career is valued above everything"],
      correctIndex: 1,
      explanation: "경향이 있다 = tend to. 결혼보다 개인 생활을 더 중요하게 = value personal life more than marriage.",
    },
  ],
  l5: [
    {
      audio: "이번 발표에서는 디지털 전환이 노동 시장 구조에 미치는 영향을 다각도에서 검토해 보겠습니다.",
      question: "What will the presentation examine?",
      options: ["Digital marketing strategies", "Digital transformation's multi-angle effect on labour market structure", "History of technology companies", "Future of AI"],
      correctIndex: 1,
      explanation: "디지털 전환 = digital transformation. 노동 시장 구조 = labour market structure. 다각도에서 = from multiple angles.",
    },
    {
      audio: "해당 정책은 단기적으로는 효과를 거두겠지만 장기적 관점에서는 오히려 역효과가 날 수 있다는 우려가 제기되고 있습니다.",
      question: "What concern is raised about the policy?",
      options: ["It won't work short-term either", "It may be counterproductive long-term despite short-term gains", "It requires more funding", "It lacks public support"],
      correctIndex: 1,
      explanation: "단기적 = short-term, 장기적 = long-term. 역효과 = adverse/reverse effect. 우려 = concern.",
    },
    {
      audio: "이 소설은 작가의 개인적 경험을 바탕으로 했지만, 그 이면에는 시대적 아픔을 담아내려는 의도가 담겨 있습니다.",
      question: "What is the deeper intention behind the novel?",
      options: ["To entertain readers", "To showcase personal success", "To capture the pain of an era", "To criticise political figures"],
      correctIndex: 2,
      explanation: "이면 = behind the surface. 시대적 아픔 = pain of an era. 담아내다 = to capture/contain.",
    },
    {
      audio: "이 약은 복용 시 졸음이 올 수 있으므로, 운전이나 기계 조작은 삼가하시기 바랍니다.",
      question: "What precaution is given with this medication?",
      options: ["Take with food", "Avoid alcohol", "Avoid driving or operating machinery", "Consult a doctor first"],
      correctIndex: 2,
      explanation: "졸음이 올 수 있으므로 = because drowsiness may occur. 삼가하다 = to refrain from. 운전 = driving, 기계 조작 = operating machinery.",
    },
    {
      audio: "글로벌 경제 불확실성이 지속되는 가운데, 각국은 자국 산업 보호를 위한 정책을 강화하고 있습니다.",
      question: "Why are countries strengthening their domestic policies?",
      options: ["To increase exports", "To protect domestic industries amid global economic uncertainty", "To attract foreign investment", "To reduce trade deficits"],
      correctIndex: 1,
      explanation: "불확실성 = uncertainty. 자국 산업 보호 = protecting domestic industry. 강화하다 = to strengthen.",
    },
  ],
};

// ─── Dedicated Reading Exam ───────────────────────────────────────────────────
// 5 level-matched questions per band. Passage displayed → MCQ comprehension.

export const READING_EXAM: Record<string, SubTestQuestion[]> = {
  hangul: [
    {
      passage: "저는 이민준이에요. 저는 학생이에요. 학교는 서울에 있어요.",
      question: "Where is the school?",
      options: ["Busan", "Seoul", "Incheon", "Daegu"],
      correctIndex: 1,
      explanation: "학교는 서울에 있어요 = the school is in Seoul. 서울 is the capital city of Korea.",
    },
    {
      passage: "오늘은 토요일이에요. 날씨가 맑아요. 공원에 가요.",
      question: "What day is it?",
      options: ["Sunday", "Monday", "Saturday", "Friday"],
      correctIndex: 2,
      explanation: "토요일 = Saturday. 일요일 = Sunday, 월요일 = Monday, 금요일 = Friday.",
    },
    {
      passage: "저는 커피를 좋아해요. 그런데 오늘은 차를 마셔요.",
      question: "What is the speaker drinking today?",
      options: ["Coffee", "Juice", "Tea", "Milk"],
      correctIndex: 2,
      explanation: "그런데 = but/however. 차 = tea. Despite liking coffee, they are drinking tea today.",
    },
    {
      passage: "고양이가 세 마리 있어요. 강아지는 한 마리 있어요.",
      question: "How many cats are there?",
      options: ["One", "Two", "Three", "Four"],
      correctIndex: 2,
      explanation: "세 마리 = three animals (마리 is the counter for animals). 고양이 = cat, 강아지 = puppy.",
    },
    {
      passage: "내일 친구 생일이에요. 케이크를 사요.",
      question: "Why is the speaker buying a cake?",
      options: ["They are hungry", "It's a holiday", "A friend's birthday is tomorrow", "For a party tonight"],
      correctIndex: 2,
      explanation: "내일 = tomorrow. 친구 생일 = friend's birthday. The cake is for tomorrow's birthday.",
    },
  ],
  l1: [
    {
      passage: "저는 매일 아침 7시에 일어나요. 아침을 먹고 지하철을 타요. 회사는 9시에 시작해요.",
      question: "How does the speaker commute to work?",
      options: ["Bus", "Taxi", "Subway", "Walking"],
      correctIndex: 2,
      explanation: "지하철을 타요 = take the subway. 지하철 = subway/metro.",
    },
    {
      passage: "오늘 날씨가 추워서 따뜻한 국을 먹었어요. 오후에는 친구와 카페에서 커피를 마셨어요.",
      question: "Why did the speaker eat hot soup?",
      options: ["They were hungry", "The weather was cold", "It was lunchtime", "Doctor's recommendation"],
      correctIndex: 1,
      explanation: "-어서 = because. 추워서 = because it was cold. Hot soup was chosen due to the cold weather.",
    },
    {
      passage: "저는 운동을 좋아해요. 특히 수영을 좋아해요. 일주일에 세 번 수영장에 가요.",
      question: "How often does the speaker go swimming?",
      options: ["Every day", "Twice a week", "Three times a week", "Once a week"],
      correctIndex: 2,
      explanation: "일주일에 세 번 = three times a week. 일주일 = one week, 세 번 = three times.",
    },
    {
      passage: "우리 가족은 5명이에요. 아버지, 어머니, 언니, 저, 그리고 남동생이 있어요.",
      question: "How many siblings does the writer have?",
      options: ["None", "One (older sister only)", "Two (older sister + younger brother)", "Three"],
      correctIndex: 2,
      explanation: "언니 = older sister (female speaker's), 남동생 = younger brother. Two siblings total.",
    },
    {
      passage: "이번 주말에 부산에 갈 거예요. 부모님을 만나러 가요. 기차를 타고 갈 거예요.",
      question: "Why is the speaker going to Busan this weekend?",
      options: ["For a business trip", "To visit parents", "On a school trip", "For a concert"],
      correctIndex: 1,
      explanation: "부모님을 만나러 = to meet parents. -러 가다 = go in order to.",
    },
  ],
  l2: [
    {
      passage: "저는 요즘 바빠서 운동을 못 하고 있어요. 그래서 건강이 걱정돼요. 다음 달부터 헬스장에 등록하려고 해요.",
      question: "What is the speaker planning to do next month?",
      options: ["Start a diet", "Join a gym", "Take a break from work", "See a doctor"],
      correctIndex: 1,
      explanation: "헬스장에 등록하려고 해요 = planning to register at the gym. 다음 달 = next month.",
    },
    {
      passage: "이 식당은 점심에는 사람이 많아요. 그래서 보통 오후 2시 이후에 가요. 2시 이후에는 자리가 많아요.",
      question: "Why does the writer go to the restaurant after 2pm?",
      options: ["Food is cheaper", "There are more seats and fewer people", "Better service", "Special menu available"],
      correctIndex: 1,
      explanation: "자리가 많아요 = there are many seats (fewer people). The restaurant is crowded at lunchtime.",
    },
    {
      passage: "저는 집에서 회사까지 걸어서 10분이에요. 그래서 지하철을 안 타요. 버스도 타지 않아요.",
      question: "How does the speaker get to work?",
      options: ["Subway", "Bus", "Walking", "Bicycle"],
      correctIndex: 2,
      explanation: "걸어서 10분 = 10 minutes on foot. 지하철을 안 타요 and 버스도 타지 않아요 = doesn't take subway or bus.",
    },
    {
      passage: "이번 여름방학에 제주도에 갔어요. 바다에서 수영하고 맛있는 음식도 먹었어요. 정말 즐거웠어요.",
      question: "What did the speaker do in Jeju?",
      options: ["Went hiking", "Visited museums", "Swam in the sea and ate delicious food", "Attended a festival"],
      correctIndex: 2,
      explanation: "바다에서 수영하고 = swam in the sea. 맛있는 음식도 먹었어요 = also ate delicious food.",
    },
    {
      passage: "한국에서는 나이가 많은 사람에게 존댓말을 써야 해요. 처음 만나는 사람에게도 존댓말을 쓰는 것이 예의예요.",
      question: "When should you use formal speech in Korea?",
      options: ["Only at work", "With older people and strangers", "Only with family elders", "Only in formal settings"],
      correctIndex: 1,
      explanation: "나이가 많은 사람 = older people. 처음 만나는 사람 = people you meet for the first time. Both require 존댓말.",
    },
  ],
  l3: [
    {
      passage: "현대 사회에서 사람들은 점점 더 바쁜 생활을 하고 있습니다. 이로 인해 가족과 보내는 시간이 줄고 있으며, 이는 가족 관계에도 영향을 미치고 있습니다.",
      question: "What negative effect of modern busyness is mentioned?",
      options: ["Lower sleep quality", "Less time spent with family", "Increased work stress", "Higher income inequality"],
      correctIndex: 1,
      explanation: "이로 인해 = as a result of this. 가족과 보내는 시간이 줄다 = time with family decreases.",
    },
    {
      passage: "운동이 건강에 좋다는 것은 모두가 알지만, 무리한 운동은 오히려 신체에 부담을 줄 수 있습니다. 따라서 자신의 체력에 맞는 운동량을 유지하는 것이 중요합니다.",
      question: "What is the main advice?",
      options: ["Exercise every day without rest", "Exercise is overrated", "Exercise according to your own physical capacity", "Only do light exercise always"],
      correctIndex: 2,
      explanation: "무리한 운동 = excessive exercise. 자신의 체력에 맞는 = suited to one's own physical fitness. Balance is key.",
    },
    {
      passage: "이 책은 단순한 언어 학습서가 아니라, 한국 문화와 사고방식을 이해하는 데 도움을 주는 문화 입문서입니다.",
      question: "What makes this book special?",
      options: ["Focuses only on advanced grammar", "Designed only for beginners", "Helps understand Korean culture and way of thinking", "Includes practice exams"],
      correctIndex: 2,
      explanation: "단순한 언어 학습서가 아니라 = not merely a language textbook. 문화 입문서 = cultural introduction guide.",
    },
    {
      passage: "그 영화는 개봉 첫 날 100만 명의 관객을 동원하며 역대 최고 기록을 세웠습니다. 하지만 일부 평론가들은 내용의 깊이가 부족하다고 비판했습니다.",
      question: "What criticism did some reviewers give?",
      options: ["Poor acting performances", "The content lacked depth", "The film was too long", "The soundtrack was bad"],
      correctIndex: 1,
      explanation: "평론가 = critic. 내용의 깊이가 부족하다 = the content lacks depth. 비판하다 = to criticise.",
    },
    {
      passage: "이 프로그램은 취업을 준비하는 청년들에게 실질적인 직업 훈련과 취업 연계 서비스를 제공합니다.",
      question: "Who is this program designed for?",
      options: ["Senior workers seeking retraining", "Students studying abroad", "Young people preparing for employment", "Self-employed individuals"],
      correctIndex: 2,
      explanation: "취업을 준비하는 청년들 = young people preparing for employment. 직업 훈련 = vocational training.",
    },
  ],
  l5: [
    {
      passage: "인공지능 기술의 급속한 발전으로 의료, 금융, 교육 등 다양한 분야에서 패러다임의 전환이 이루어지고 있다. 이에 따라 기존 직업의 상당수가 대체될 것이라는 전망과 함께, 새로운 형태의 직업이 창출될 것이라는 기대도 공존하고 있다.",
      question: "What dual outlook exists about AI's effect on the workforce?",
      options: ["AI will only create jobs", "AI will only destroy jobs", "Both job replacement and new job creation are expected to coexist", "AI effects are limited to the tech sector"],
      correctIndex: 2,
      explanation: "공존하다 = to coexist. 기존 직업 대체 (job replacement) and 새로운 직업 창출 (new job creation) both appear.",
    },
    {
      passage: "이 연구는 사회경제적 불평등이 교육 기회의 격차로 이어지며, 이것이 다시 세대 간 빈곤의 세습으로 연결된다는 점을 실증적으로 보여주고 있다.",
      question: "What cycle does this research demonstrate?",
      options: ["Economic growth leads to better education", "Inequality → educational gap → intergenerational poverty cycle", "Technology reduces inequality", "Rural areas lack educational investment"],
      correctIndex: 1,
      explanation: "세습 = inheritance/transmission. 세대 간 빈곤의 세습 = intergenerational transmission of poverty. 실증적 = empirical.",
    },
    {
      passage: "해당 규제는 소비자 보호를 명목으로 도입됐지만, 오히려 신규 기업의 시장 진입을 가로막아 독과점을 심화시켰다는 비판이 나오고 있다.",
      question: "What ironic outcome of the regulation is criticised?",
      options: ["It increased consumer prices", "It blocked new entrants and worsened monopolies", "It reduced government revenue", "It slowed technological innovation"],
      correctIndex: 1,
      explanation: "오히려 = on the contrary / ironically. 시장 진입을 가로막다 = block market entry. 독과점 = monopoly/oligopoly.",
    },
    {
      passage: "이 논문은 언어 습득 과정에서 모국어의 간섭 효과가 어떻게 나타나는지를 분석하고, 이를 최소화하기 위한 교육적 접근법을 제시한다.",
      question: "What educational goal does this paper address?",
      options: ["Teaching children to read faster", "Minimising mother-tongue interference in language acquisition", "Comparing grammar structures across languages", "Evaluating standardised language tests"],
      correctIndex: 1,
      explanation: "모국어의 간섭 효과 = mother-tongue interference effect. 최소화 = minimisation. 교육적 접근법 = educational approach.",
    },
    {
      passage: "현 정부는 탄소 중립 목표 달성을 위해 신재생에너지 투자를 확대하고 있으나, 에너지 전환 과정에서 발생하는 고용 불안정 문제를 어떻게 해결할지가 과제로 남아 있다.",
      question: "What challenge remains for the government's energy policy?",
      options: ["Reducing carbon emissions further", "Addressing employment instability during the energy transition", "Increasing nuclear energy output", "Regulating domestic energy pricing"],
      correctIndex: 1,
      explanation: "에너지 전환 = energy transition. 고용 불안정 = employment instability. 과제로 남아 있다 = remains as a challenge.",
    },
  ],
};

export interface PlacementResult {
  score: number;
  levelKey: string;
  levelLabel: string;
  /** How close the score is to the band boundary */
  confidence: "solid" | "borderline-up" | "borderline-down";
  sectionScores: { Vocabulary: number; Grammar: number; Reading: number; Listening: number; Speaking: number };
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
  const sectionScores = { Vocabulary: 0, Grammar: 0, Reading: 0, Listening: 0, Speaking: 0 };

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
    levelKey = "hangul"; levelLabel = "Hangul Foundation"; bandMin = 0; bandMax = 6;
  } else if (score <= 12) {
    levelKey = "l1"; levelLabel = "Level 1 (A1 / TOPIK 1)"; bandMin = 7; bandMax = 12;
  } else if (score <= 18) {
    levelKey = "l2"; levelLabel = "Level 2 (A2 / TOPIK 2)"; bandMin = 13; bandMax = 18;
  } else if (score <= 24) {
    levelKey = "l3"; levelLabel = "Level 3–4 (B1–B2 / TOPIK 3–4)"; bandMin = 19; bandMax = 24;
  } else {
    levelKey = "l5"; levelLabel = "Level 5–6 (C1–C2 / TOPIK 5–6)"; bandMin = 25; bandMax = 30;
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
  hangul: [
    { week: 1, title: "Master the Korean alphabet", tasks: ["Learn 14 basic consonants (ㄱ ㄴ ㄷ ㄹ …)", "Learn 10 basic vowels (ㅏ ㅑ ㅓ ㅕ …)", "Practice reading syllable blocks aloud"] },
    { week: 2, title: "Pronunciation & syllable rules", tasks: ["Understand batchim (final consonants)", "Practice liaison & nasalisation rules", "Read simple syllables at speed (가나다라…)"] },
    { week: 3, title: "Core greetings & self-introduction", tasks: ["안녕하세요 · 감사합니다 · 미안합니다", "Introduce yourself: 저는 [name]입니다", "Numbers 1–10 in both counting systems"] },
    { week: 4, title: "Everyday basics", tasks: ["Days of the week & months", "Common classroom phrases", "Start Klovers Foundation class"] },
  ],
  l1: [
    { week: 1, title: "Sentence structure & particles", tasks: ["Subject particle 이/가, object particle 을/를", "Topic particle 은/는 vs subject particle", "Build 5 simple Subject–Verb sentences daily"] },
    { week: 2, title: "Core verbs & adjectives", tasks: ["가다·오다·먹다·마시다·보다", "좋다·싫다·크다·작다 (descriptive verbs)", "Conjugate into formal polite -ㅂ니다/습니다"] },
    { week: 3, title: "Present, past & future tense", tasks: ["Present: -아요/어요", "Past: -았어요/었어요", "Future: -(으)ㄹ 거예요"] },
    { week: 4, title: "Daily conversation practice", tasks: ["Ordering food at a café", "Asking for prices & locations", "Start Klovers Level 1 class"] },
  ],
  l2: [
    { week: 1, title: "Connectors & reasons", tasks: ["Reason: -아서/어서 and -니까", "Sequence: -고 (and then)", "Practice writing 5 linked sentences per day"] },
    { week: 2, title: "Expressing desire & ability", tasks: ["-고 싶다 (want to)", "-(으)ㄹ 수 있다/없다 (can/cannot)", "Polite requests: -아/어 주세요"] },
    { week: 3, title: "Conditionals & time", tasks: ["If/when: -(으)면", "While: -는 동안", "Duration: -동안 vs -후에"] },
    { week: 4, title: "Reading short Korean texts", tasks: ["Read one Korean children's book passage weekly", "Expand vocabulary to 500+ words", "Start Klovers Level 2 class"] },
  ],
  l3: [
    { week: 1, title: "Advanced grammar patterns", tasks: ["-더라고요 (past personal observation)", "-는 바람에 (unintended negative cause)", "-(으)ㄹ 뻔했다 (almost did)"] },
    { week: 2, title: "Indirect speech & nuance", tasks: ["Indirect speech: -다고 하다 / -라고 하다", "Quoted commands: -(으)라고 하다", "Distinguish formal & informal registers"] },
    { week: 3, title: "Intermediate reading comprehension", tasks: ["Read Korean news headlines daily", "Summarise articles in Korean (3–5 sentences)", "Learn 20 new TOPIK 3 vocabulary words per week"] },
    { week: 4, title: "Natural speech & idioms", tasks: ["Watch 1 Korean drama episode with Korean subtitles", "Shadow native speakers for pronunciation", "Start Klovers Level 3–4 class"] },
  ],
  l5: [
    { week: 1, title: "Advanced grammar nuance", tasks: ["-(으)ㄴ/는 셈이다 (amounts to / practically)", "-기는커녕 (far from, let alone)", "모순·영향·논쟁 — C1 vocabulary lists"] },
    { week: 2, title: "Academic & professional Korean", tasks: ["Write a 200-word opinion paragraph in Korean", "Learn formal writing endings (-ㄴ바, -인즉)", "Study Korean business email patterns"] },
    { week: 3, title: "TOPIK II writing practice", tasks: ["Practice 200-word descriptive essays (설명문)", "Practice 700-word argumentative essays (논설문)", "Review past TOPIK II writing prompts"] },
    { week: 4, title: "Mastery & refinement", tasks: ["Read Korean newspaper editorials & opinion columns", "Maintain a Korean journal (한국어 일기)", "Start Klovers Level 5–6 advanced class"] },
  ],
};
