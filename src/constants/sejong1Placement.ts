/**
 * Placement question bank for 세종한국어 1 (Sejong Korean 1, 예비편 + 12과).
 *
 * This is a UNIT placement test: it decides which unit of that one book a
 * student starts from. It is deliberately separate from the course-level
 * placement test in `placementQuestions.ts`, which decides hangul/l1…l6.
 *
 * Scoring is NOT a total. Sections run easiest-first and the student is placed
 * at the first section they fail — see `computeUnitPlacement`. A high score in
 * a later section never cancels a failed earlier one, because the earlier gap
 * is the thing that has to be taught.
 *
 * Option order is pre-shuffled with a fixed seed so this file, the printable
 * Word paper and the teacher answer key all present options identically.
 *
 * GENERATED FILE — regenerate rather than hand-edit when questions change.
 */

export type SejongSectionId = "A" | "B" | "C" | "D" | "E" | "F";

export interface SejongBogi {
  stem: string;
  options: string[];
  answerIndex: number;
}

export interface SejongQuestion {
  id: string;
  section: SejongSectionId;
  unit: string;
  /** TOPIK-style ※ instruction rendered above this question, when it opens a group */
  group?: string;
  /** Worked <보기> example rendered above this question */
  bogi?: SejongBogi;
  stem: string;
  /** Arabic-only meaning hint, rendered RTL under the stem */
  hintAr?: string;
  options: string[];
  answerIndex: number;
}

export interface SejongSection {
  id: SejongSectionId;
  code: string;
  titleAr: string;
  titleEn: string;
  titleKo: string;
  instrAr: string;
  instrEn: string;
  focusKo?: string;
  groupKo?: string;
  max: number;
  /** Score at or above which the section is passed */
  pass: number;
}

export const SEJONG1_SECTIONS: SejongSection[] = [
  {
    id: "A", code: "예비편",
    titleAr: "القسم (أ) — الهانغول والقراءة الأساسية",
    titleEn: "Section A — Hangul and basic reading",
    titleKo: "예비편: 한글 자모",
    instrAr: "اختر الإجابة الصحيحة. هذا القسم يقيس معرفة الحروف الكورية وقراءتها.",
    instrEn: "Choose the correct answer. This section checks that you can read Hangul.",
    focusKo: "한글 자모 · 받침",
    max: 8, pass: 6,
  },
  {
    id: "B", code: "1~3과",
    titleAr: "القسم (ب) — الوحدات 1 إلى 3",
    titleEn: "Section B — Units 1 to 3",
    titleKo: "1과 자기소개 · 2과 일상생활 · 3과 위치",
    instrAr: "اختر الإجابة الصحيحة. هذا القسم يقيس القواعد والمفردات التالية:",
    instrEn: "Choose the correct answer. This section covers the grammar and vocabulary below:",
    focusKo: "이에요/예요 · 은/는 · -아요/어요 · 에 가다 · 이/가 · 에 있다/없다 · 국적, 직업, 동작, 장소, 물건, 위치",
    groupKo: "※ [B1~B10] 다음을 읽고 알맞은 것을 고르십시오.",
    max: 10, pass: 7,
  },
  {
    id: "C", code: "4~6과",
    titleAr: "القسم (ج) — الوحدات 4 إلى 6",
    titleEn: "Section C — Units 4 to 6",
    titleKo: "4과 물건 사기 1 · 5과 물건 사기 2 · 6과 어제 일과",
    instrAr: "اختر الإجابة الصحيحة. هذا القسم يقيس القواعد والمفردات التالية:",
    instrEn: "Choose the correct answer. This section covers the grammar and vocabulary below:",
    focusKo: "을/를 · -(으)세요 · 한자어 수 · 고유어 수 · 단위 명사 · -ㅂ니다/습니다 · -ㅂ니까/습니까 · 하고 · -았/었- · 에서",
    groupKo: "※ [C1~C10] 다음을 읽고 알맞은 것을 고르십시오.",
    max: 10, pass: 7,
  },
  {
    id: "D", code: "7~9과",
    titleAr: "القسم (د) — الوحدات 7 إلى 9",
    titleEn: "Section D — Units 7 to 9",
    titleKo: "7과 날씨 · 8과 시간 · 9과 약속",
    instrAr: "اختر الإجابة الصحيحة. هذا القسم يقيس القواعد والمفردات التالية:",
    instrEn: "Choose the correct answer. This section covers the grammar and vocabulary below:",
    focusKo: "그리고 · 안 · 계절, 날씨 · 에 (시간) · O시 O분 · 날짜와 요일 · -(으)ㄹ까요 · -아요/어요 (제안)",
    groupKo: "※ [D1~D10] 다음을 읽고 알맞은 것을 고르십시오.",
    max: 10, pass: 7,
  },
  {
    id: "E", code: "10~12과",
    titleAr: "القسم (هـ) — الوحدات 10 إلى 12",
    titleEn: "Section E — Units 10 to 12",
    titleKo: "10과 주말 활동 · 11과 한국어 공부 · 12과 계획",
    instrAr: "اختر الإجابة الصحيحة. هذا القسم يقيس القواعد والمفردات التالية، بالإضافة لمراجعة شاملة:",
    instrEn: "Choose the correct answer. This section covers the grammar and vocabulary below, plus a mixed review:",
    focusKo: "그래서 · -(으)ㄹ 거예요 · 장소, 주말 활동 · 종합 1 · 종합 2",
    groupKo: "※ [E1~E8] 다음을 읽고 알맞은 것을 고르십시오.",
    max: 8, pass: 6,
  },
  {
    id: "F", code: "읽기",
    titleAr: "القسم (و) — القراءة",
    titleEn: "Section F — Reading",
    titleKo: "읽기",
    instrAr: "اقرأ النص التالي ثم أجب عن الأسئلة.",
    instrEn: "Read the passage below, then answer the questions.",
    groupKo: "※ [F1~F4] 다음을 읽고 물음에 답하십시오.",
    max: 4, pass: 3,
  },
];

export const SEJONG1_QUESTIONS: SejongQuestion[] = [
  { id: "A1", section: "A", unit: "예비편", group: "※ [A1~A3] 다음 (   )에 알맞은 것을 <보기>와 같이 고르십시오.", bogi: { stem: "ㅇ + ㅏ = (        )", options: ["아","어","오","우"], answerIndex: 0 }, stem: "ㅎ + ㅏ + ㄱ = (        )", options: ["항","한","학","합"], answerIndex: 2 },
  { id: "A2", section: "A", unit: "예비편", stem: "ㄲ + ㅗ = (        )", options: ["꼬","쿠","코","고"], answerIndex: 0 },
  { id: "A3", section: "A", unit: "예비편", stem: "ㅁ + ㅜ + ㄹ = (        )", options: ["미","불","물","문"], answerIndex: 2 },
  { id: "A4", section: "A", unit: "예비편", group: "※ [A4~A6] 다음을 읽고 알맞은 것을 고르십시오.", stem: "받침이 없는 글자를 고르십시오.", options: ["가","꽃","집","산"], answerIndex: 0 },
  { id: "A5", section: "A", unit: "예비편", stem: "받침 소리가 다른 것을 고르십시오.", options: ["밥","집","물","잎"], answerIndex: 2 },
  { id: "A6", section: "A", unit: "예비편", stem: "「부엌」을 바르게 읽은 것을 고르십시오.", options: ["[부언]","[부억]","[부얼]","[부업]"], answerIndex: 1 },
  { id: "A7", section: "A", unit: "예비편", group: "※ [A7~A8] 다음 상황에서 하는 말로 알맞은 것을 고르십시오.", stem: "친구에게 미안합니다. 뭐라고 말합니까?", options: ["죄송합니다.","고맙습니다.","안녕하세요?","안녕히 가세요."], answerIndex: 0 },
  { id: "A8", section: "A", unit: "예비편", stem: "선생님이 「            」라고 말했습니다. 그래서 학생들이 책을 봅니다.", options: ["쓰세요.","책을 보세요.","대답하세요.","질문하세요."], answerIndex: 1 },
  { id: "B1", section: "B", unit: "1과", stem: "저는 학생(       ).", options: ["에요","이요","이에요","예요"], answerIndex: 2 },
  { id: "B2", section: "B", unit: "1과", stem: "저는 유키(       ).", options: ["예요","요","이에요","이요"], answerIndex: 0 },
  { id: "B3", section: "B", unit: "1과", stem: "다음 중 나라 이름이 아닌 것을 고르십시오.", options: ["중국","한국","베트남","의사"], answerIndex: 3 },
  { id: "B4", section: "B", unit: "1과", stem: "이 사람은 병원에서 일해요. 직업이 뭐예요?", options: ["의사","공무원","학생","경찰"], answerIndex: 0 },
  { id: "B5", section: "B", unit: "1과", stem: "유키 씨(       ) 일본 사람이에요.", options: ["가","는","은","이"], answerIndex: 1 },
  { id: "B6", section: "B", unit: "2과", stem: "저는 지금 학교(       ) 가요.", options: ["에서","에","를","이"], answerIndex: 1 },
  { id: "B7", section: "B", unit: "2과", stem: "치엔 씨는 한국어를 (       ).", options: ["공부하요","공부하어요","공부하아요","공부해요"], answerIndex: 3 },
  { id: "B8", section: "B", unit: "2과", stem: "민수 씨는 지금 (       ).", hintAr: "المعنى: ينام الآن.", options: ["자아요","잠요","자어요","자요"], answerIndex: 3 },
  { id: "B9", section: "B", unit: "3과", stem: "책상 위에 가방(       ) 있어요.", options: ["을","가","는","이"], answerIndex: 3 },
  { id: "B10", section: "B", unit: "3과", stem: "가: 펜이 어디에 있어요?\n     나: 책상 (       )에 있어요.", hintAr: "المعنى: فوق المكتب.", options: ["앞","아래","밖","위"], answerIndex: 3 },
  { id: "C1", section: "C", unit: "4과", stem: "저는 우유(       ) 마셔요.", options: ["가","를","을","이"], answerIndex: 1 },
  { id: "C2", section: "C", unit: "4과", stem: "저는 빵(       ) 먹어요.", options: ["에","을","를","이"], answerIndex: 1 },
  { id: "C3", section: "C", unit: "4과", stem: "책을 (       ).", hintAr: "المعنى: اقرأ الكتاب من فضلك.", options: ["읽세요","읽어세요","읽아세요","읽으세요"], answerIndex: 3 },
  { id: "C4", section: "C", unit: "4과", stem: "3,500원을 바르게 읽은 것을 고르십시오.", options: ["삼천다섯백 원","세천오백 원","삼천오백 원","삼천오십 원"], answerIndex: 2 },
  { id: "C5", section: "C", unit: "5과", stem: "사과 (       ) 개 주세요.", hintAr: "المطلوب: أربع تفاحات.", options: ["네","너","넷","사"], answerIndex: 0 },
  { id: "C6", section: "C", unit: "5과", stem: "저는 유키(       ).", hintAr: "الصيغة الرسمية.", options: ["이ㅂ니다","입니다","예니다","이습니다"], answerIndex: 1 },
  { id: "C7", section: "C", unit: "5과", stem: "무엇을 (       )?", hintAr: "المعنى: ماذا تشتري؟ — بالصيغة الرسمية.", options: ["사습니까","사읍니까","삽니까","사니까"], answerIndex: 2 },
  { id: "C8", section: "C", unit: "5과", stem: "빵 한 개(       ) 우유 두 개를 사요.", options: ["안","에서","그리고","하고"], answerIndex: 3 },
  { id: "C9", section: "C", unit: "6과", stem: "어제 도서관(       ) 공부했어요.", options: ["을","에서","에","가"], answerIndex: 1 },
  { id: "C10", section: "C", unit: "6과", stem: "어제 친구를 (       ).", options: ["만나요","만날 거예요","만나세요","만났어요"], answerIndex: 3 },
  { id: "D1", section: "D", unit: "7과", stem: "저는 여름을 좋아해요. (       ) 봄도 좋아해요.", options: ["그리고","안","그래서","하고"], answerIndex: 0 },
  { id: "D2", section: "D", unit: "7과", stem: "오늘은 학교에 (       ) 가요.", hintAr: "المعنى: لا أذهب اليوم.", options: ["안이","아니요","아니","안"], answerIndex: 3 },
  { id: "D3", section: "D", unit: "7과", stem: "겨울에는 날씨가 (       ).", options: ["시원해요","더워요","추워요","따뜻해요"], answerIndex: 2 },
  { id: "D4", section: "D", unit: "7과", stem: "비(       ) 와요.", options: ["가","을","는","이"], answerIndex: 0 },
  { id: "D5", section: "D", unit: "8과", stem: "「6월」을 바르게 읽은 것을 고르십시오.", options: ["유월","여섯월","육월","육개월"], answerIndex: 0 },
  { id: "D6", section: "D", unit: "8과", stem: "「3:30」을 바르게 읽은 것을 고르십시오.", options: ["세 시 삼십 분","셋 시 삼십 분","세 시 서른 분","삼 시 삼십 분"], answerIndex: 0 },
  { id: "D7", section: "D", unit: "8과", stem: "금요일(       ) 만나요.", options: ["을","가","에","에서"], answerIndex: 2 },
  { id: "D8", section: "D", unit: "9과", stem: "가: 같이 영화를 (       )?\n     나: 네, 좋아요.", options: ["봐까요","보까요","볼까요","볼가요"], answerIndex: 2 },
  { id: "D9", section: "D", unit: "9과", stem: "가: 내일 시간이 있어요?\n     나: 미안해요. 내일은 (       ).", options: ["괜찮아요","바빠요","좋아요","만나요"], answerIndex: 1 },
  { id: "D10", section: "D", unit: "9과", stem: "가: 몇 시에 만날까요?\n     나: 두 시에 (       ).", options: ["만나세요","만났어요","만날까요","만나요"], answerIndex: 3 },
  { id: "E1", section: "E", unit: "10과", stem: "고향에서 친구가 왔어요. (       ) 같이 박물관에 갔어요.", options: ["하고","안","그리고","그래서"], answerIndex: 3 },
  { id: "E2", section: "E", unit: "10과", stem: "주말에 무엇을 (       )?", hintAr: "السؤال عن خطة مستقبلية.", options: ["합니까","할 거예요","하세요","했어요"], answerIndex: 1 },
  { id: "E3", section: "E", unit: "10과", stem: "저는 내일 집에서 (       ).", hintAr: "المعنى: سأرتاح في البيت غدًا.", options: ["쉬었 거예요","쉬을 거예요","쉴 거예요","쉬 거예요"], answerIndex: 2 },
  { id: "E4", section: "E", unit: "10과", stem: "수영을 해요. 어디에 가요?", options: ["미술관","박물관","수영장","고궁"], answerIndex: 2 },
  { id: "E5", section: "E", unit: "10과", stem: "저는 사진을 (       ).", options: ["읽어요","먹어요","봐요","찍어요"], answerIndex: 3 },
  { id: "E6", section: "E", unit: "11·12과", stem: "저는 작년에 한국에 (       ). 그리고 올해도 갈 거예요.", options: ["가세요","갔어요","갈 거예요","가요"], answerIndex: 1 },
  { id: "E7", section: "E", unit: "11·12과", stem: "다음 중 문장이 틀린 것을 고르십시오.", options: ["저는 집에서 공부했어요.","저는 친구를 만날 거예요.","저는 학교에서 갔어요.","저는 빵을 먹었어요."], answerIndex: 2 },
  { id: "E8", section: "E", unit: "11·12과", stem: "가: 한국어 공부가 (       )?\n     나: 네, 조금 어려워요.", options: ["얼마예요","어때요","누구예요","어디예요"], answerIndex: 1 },
  { id: "F1", section: "F", unit: "읽기", stem: "투이 씨는 어느 나라 사람이에요?", options: ["중국","일본","베트남","한국"], answerIndex: 2 },
  { id: "F2", section: "F", unit: "읽기", stem: "어제 오후에 무엇을 했어요?", options: ["집에서 잤어요","친구를 만났어요","회사에서 일했어요","산에 갔어요"], answerIndex: 1 },
  { id: "F3", section: "F", unit: "읽기", stem: "내일 어디에 갈 거예요?", options: ["산","박물관","바다","수영장"], answerIndex: 0 },
  { id: "F4", section: "F", unit: "읽기", stem: "다음의 내용과 같지 않은 것을 고르십시오.", options: ["투이 씨는 어제 산에 갔어요.","어제 날씨가 좋았어요.","투이 씨는 회사원이에요.","투이 씨는 어제 영화를 봤어요."], answerIndex: 0 },
];

export const SEJONG1_READING_TEXT: string[] = ["저는 투이입니다. 베트남 사람입니다. 지금 한국 회사에서 일해요.","어제 오전에는 집에서 쉬었어요. 날씨가 아주 좋았어요.","그래서 오후에 친구를 만났어요. 우리는 커피숍에서 커피를 마셨어요.","그리고 같이 영화를 봤어요. 영화가 재미있었어요.","내일은 일요일이에요. 저는 친구하고 산에 갈 거예요.","산에서 사진을 많이 찍을 거예요."];

export interface SejongProductionPrompt {
  id: string;
  unit: string;
  ko: string;
  ar: string;
  en: string;
  /** Korean forms the student is expected to use, shown as a nudge */
  useKo?: string;
}

export const SEJONG1_WRITING: SejongProductionPrompt[] = [
  { id: "G1", unit: "1과", ko: "자기소개를 쓰세요. (이름, 나라, 직업)", ar: "اكتب تعريفًا بنفسك: الاسم، البلد، المهنة. (٢–٣ جمل)", en: "" },
  { id: "G2", unit: "6과", ko: "어제 무엇을 했어요? 어디에서 했어요?", ar: "ماذا فعلت أمس؟ وأين؟ (٢–٣ جمل بصيغة الماضي)", en: "" },
  { id: "G3", unit: "10과", ko: "이번 주말에 무엇을 할 거예요? 왜요?", ar: "ماذا ستفعل نهاية هذا الأسبوع؟ ولماذا؟ (٣–٤ جمل)", en: "", useKo: "-(으)ㄹ 거예요 / 그래서" },
];

export const SEJONG1_SPEAKING: SejongProductionPrompt[] = [
  { id: "H1", unit: "1과", ko: "이름이 뭐예요? 어느 나라 사람이에요?", ar: "ما اسمك؟ من أي بلد أنت؟", en: "" },
  { id: "H2", unit: "2·6과", ko: "보통 어디에 가요? 거기에서 무엇을 해요?", ar: "إلى أين تذهب عادة؟ وماذا تفعل هناك؟", en: "" },
  { id: "H3", unit: "7과", ko: "오늘 날씨가 어때요? 무슨 계절을 좋아해요?", ar: "كيف الطقس اليوم؟ وأي فصل تحب؟", en: "" },
  { id: "H4", unit: "8과", ko: "지금 몇 시예요? 몇 시에 한국어를 공부해요?", ar: "كم الساعة الآن؟ وفي أي ساعة تذاكر الكورية؟", en: "" },
  { id: "H5", unit: "10·12과", ko: "이번 주말에 뭐 할 거예요? 그리고 앞으로 무슨 계획이 있어요?", ar: "ماذا ستفعل نهاية الأسبوع؟ وما خططك القادمة؟", en: "" },
];

export const SEJONG1_WRITING_MAX = 15;
export const SEJONG1_SPEAKING_MAX = 15;
/** Auto-graded total: sections A–F */
export const SEJONG1_MCQ_MAX = 50;

export type SejongStartUnitKey = "prep" | "u1" | "u4" | "u7" | "u10" | "done";

export interface SejongStartUnit {
  key: SejongStartUnitKey;
  labelKo: string;
  labelAr: string;
  labelEn: string;
  /** Canonical course level key (src/constants/levels.ts) this unit sits in */
  levelKey: string;
}

export const SEJONG1_START_UNITS: Record<SejongStartUnitKey, SejongStartUnit> = {
  prep: { key: "prep", labelKo: "예비편", labelAr: "الوحدة التمهيدية (الهانغول)", labelEn: "Preparatory unit (Hangul)", levelKey: "hangul" },
  u1: { key: "u1", labelKo: "1과 자기소개", labelAr: "الوحدة ١ — التعريف بالنفس", labelEn: "Unit 1 — Self introduction", levelKey: "l1" },
  u4: { key: "u4", labelKo: "4과 물건 사기 1", labelAr: "الوحدة ٤ — الشراء ١", labelEn: "Unit 4 — Shopping 1", levelKey: "l1" },
  u7: { key: "u7", labelKo: "7과 날씨", labelAr: "الوحدة ٧ — الطقس", labelEn: "Unit 7 — Weather", levelKey: "l1" },
  u10: { key: "u10", labelKo: "10과 주말 활동", labelAr: "الوحدة ١٠ — أنشطة العطلة", labelEn: "Unit 10 — Weekend activities", levelKey: "l1" },
  done: { key: "done", labelKo: "세종한국어 2", labelAr: "أنهى الكتاب — ينتقل إلى 세종한국어 2", labelEn: "Finished the book — moves on to Sejong Korean 2", levelKey: "l2" },
};

/** Section order matters: the student is placed at the FIRST section they fail. */
const GATE_ORDER: { section: SejongSectionId; start: SejongStartUnitKey }[] = [
  { section: "A", start: "prep" },
  { section: "B", start: "u1" },
  { section: "C", start: "u4" },
  { section: "D", start: "u7" },
  { section: "E", start: "u10" },
];

export interface UnitPlacementResult {
  sectionScores: Record<SejongSectionId, number>;
  mcqScore: number;
  start: SejongStartUnit;
  /** Section that decided the placement; null when every section was passed */
  failedSection: SejongSectionId | null;
}

export function computeUnitPlacement(
  answers: Record<string, number>,
): UnitPlacementResult {
  const sectionScores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 } as Record<SejongSectionId, number>;
  for (const q of SEJONG1_QUESTIONS) {
    if (answers[q.id] === q.answerIndex) sectionScores[q.section] += 1;
  }
  const mcqScore = Object.values(sectionScores).reduce((a, b) => a + b, 0);

  const passOf = (id: SejongSectionId) =>
    SEJONG1_SECTIONS.find((s) => s.id === id)?.pass ?? 0;

  for (const gate of GATE_ORDER) {
    if (sectionScores[gate.section] < passOf(gate.section)) {
      return {
        sectionScores,
        mcqScore,
        start: SEJONG1_START_UNITS[gate.start],
        failedSection: gate.section,
      };
    }
  }

  // Every unit section passed. The reading section is the last gate before
  // declaring the book finished.
  const readingPassed = sectionScores.F >= passOf("F");
  return {
    sectionScores,
    mcqScore,
    start: SEJONG1_START_UNITS[readingPassed ? "done" : "u10"],
    failedSection: readingPassed ? null : "F",
  };
}
