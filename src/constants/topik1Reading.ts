/**
 * The Klovers placement test, written in the shape of TOPIK I 읽기.
 *
 * WHY THIS FILE REPLACED THE 세종한국어 1 BANK
 * -------------------------------------------
 * The old bank measured position inside one textbook. A student who has never
 * seen that book — most people who arrive from a search result — got a result
 * phrased in units they had no way to interpret, and the question formats
 * looked like a school worksheet rather than the exam they are actually aiming
 * at. TOPIK is the scale Egyptian learners already know by name, so the test
 * now asks in TOPIK's own formats and answers on TOPIK's own scale.
 *
 * SCOPE: TOPIK I only — 1급 and 2급. That is a deliberate ceiling, not an
 * omission. TOPIK I is a real, self-contained exam covering exactly those two
 * grades, and this bank contains no evidence about 3급 and above, so it does
 * not claim any. A student who clears every section is told they are past
 * TOPIK I and needs a teacher, not a number.
 *
 * READING ONLY. Real TOPIK I is half 듣기 (30 items) and half 읽기 (40). There
 * are no recordings yet, and a "listening" section that prints the script on
 * screen is not a listening section — the previous bank had one and it
 * measured reading twice. 듣기 goes in when there is audio to put in it.
 *
 * ORIGINAL ITEMS. Every question here was written for Klovers. The formats,
 * the ※ instruction lines and the ① ② ③ ④ presentation follow the public exam
 * format; none of the passages, sentences or options are taken from a past
 * paper.
 *
 * HINTS NAME THE TASK, NEVER THE MEANING. Same rule as the TOPIK II bank. An
 * Arabic hint that explains what the target grammar or the target word means
 * turns a Korean item into an Arabic one: a student told that 입다 is for
 * clothing worn on the body has answered B10 without reading Korean. This file
 * carried three such hints — A4 glossed 마시다, B10 glossed 입다, C2 translated
 * its key sentence outright — and all three were removed on 9 Sep. There is no
 * hintAr in this bank now, which is why the field's comment is true again.
 *
 * IDS ARE NEVER REUSED. Item ids are written into unit_placement_tests.answers,
 * so a dropped id must stay dropped: reusing it would quietly mean two
 * different questions in one column across time, and every row written before
 * the change would be read as an answer to a question nobody was asked. That is
 * why section A runs A9, A10, A11, A12, A1, A4, A6, A7 rather than A1 to A8 —
 * the numbering is a history, not an order.
 *
 * THE BLANK is three U+3000 IDEOGRAPHIC SPACEs, not ASCII spaces. HTML
 * collapses a run of ASCII spaces to one, which rendered every gap-fill
 * question as an empty "( )"; U+3000 is not collapsed, so the gap keeps its
 * width with no CSS involved.
 *
 * THE GATE. Sections run easiest-first and the student is placed at the FIRST
 * section they fail — the section whose material they still need. So a true
 * beginner answers eight questions and stops, and nobody is asked about level 2
 * grammar to prove they cannot read the alphabet.
 */

export type Topik1SectionId = "A" | "B" | "C";

export interface Topik1Bogi {
  stem: string;
  options: string[];
  answerIndex: number;
}

export interface Topik1Question {
  id: string;
  section: Topik1SectionId;
  /** TOPIK-style ※ instruction rendered above this question, when it opens a group */
  group?: string;
  /** Worked <보기> example rendered above this question */
  bogi?: Topik1Bogi;
  /** Notice, memo or passage rendered in a box above the question */
  passage?: string;
  stem: string;
  /** Arabic-only nudge, rendered RTL under the stem. Never gives the answer. */
  hintAr?: string;
  options: string[];
  answerIndex: number;
}

export interface Topik1Section {
  id: Topik1SectionId;
  /** The TOPIK grade this section is evidence for */
  gradeKo: string;
  titleAr: string;
  titleEn: string;
  titleKo: string;
  instrAr: string;
  instrEn: string;
  /** Korean summary of what is being measured, shown under the title */
  focusKo?: string;
  max: number;
  /** Score at or above which the section is passed */
  pass: number;
}

export const TOPIK1_SECTIONS: Topik1Section[] = [
  /**
   * Section A is the 한글 기초 / 1급 boundary. It is the section that decides
   * whether a student belongs in the four-class alphabet course or in level 1,
   * and that is the only judgement it is asked to make.
   *
   * Until 9 Sep it made that judgement without ever asking anyone to read 한글.
   * It held three vocabulary items in the TOPIK I 무엇에 대한 이야기 format and
   * five particle items, and every one of the eight was 1급 material. Nothing in
   * it asked a student to find a vowel inside a syllable, to see a batchim, or
   * to put two letters in 가나다 order. So a student who read the alphabet
   * fluently but had met no grammar scored at chance here and was
   * indistinguishable from a student who could not read a letter — and the two
   * belong in different courses.
   *
   * What was actually drawing the line was the "I can't read Hangul yet" button
   * on the intro screen: a self-declaration, offered before the first question,
   * from someone who has no way to know where the boundary sits. The button
   * stays, because a student who knows she cannot read should not have to prove
   * it four times, but it is a courtesy now rather than the measurement.
   *
   * THE COUNT IS HELD AT EIGHT ON PURPOSE. EXAM_BANDS in topikPapers.ts is
   * derived from the section sizes — 8 is all of A, 18 is A+B, 28 is A+B+C — so
   * a ninth item here moves where every student in the test lands. Four
   * decoding items went in and four of the old eight came out.
   */
  {
    id: "A",
    gradeKo: "한글 기초",
    titleAr: "القسم الأول — قراءة أساسية",
    titleEn: "Section 1 — Basic reading",
    titleKo: "읽기 기초 · 자모와 받침, 가나다 순서",
    instrAr: "اقرأ واختر الإجابة الصحيحة. القسم ده بيقيس قراءة الهانغول نفسه — الحروف وأصواتها، والباتشيم، وترتيب 가나다 — وبعد كده شوية قراءة جُمل بسيطة.",
    instrEn: "Read and choose the correct answer. This section is about reading Hangul itself — letters and their sounds, batchim, and 가나다 order — and then a little basic sentence reading.",
    focusKo: "모음과 자음 · 받침 · 글자의 짜임 · 가나다 순서 · 기본 문장 읽기",
    max: 8, pass: 5,
  },
  {
    id: "B",
    gradeKo: "1급",
    titleAr: "القسم الثاني — المستوى الأول (1급)",
    titleEn: "Section 2 — TOPIK level 1 (1급)",
    titleKo: "1급 · 시제, 연결어, 실용문 읽기",
    instrAr: "القسم ده بيقيس المستوى الأول: الأزمنة، أدوات الربط، وقراءة إعلان أو رسالة قصيرة.",
    instrEn: "Level 1: tense, connectives, and reading a short notice or note.",
    focusKo: "-았/었- · -(으)ㄹ 거예요 · 하지만 · 그래서 · 시간과 수 · 안내문·메모 읽기",
    max: 10, pass: 7,
  },
  {
    id: "C",
    gradeKo: "2급",
    titleAr: "القسم الثالث — المستوى الثاني (2급)",
    titleEn: "Section 3 — TOPIK level 2 (2급)",
    titleKo: "2급 · 문법 연결, 중심 생각, 순서 배열",
    instrAr: "القسم ده بيقيس المستوى الثاني: ربط الجُمل، الفكرة الرئيسية، وترتيب الأحداث.",
    instrEn: "Level 2: linking clauses, main idea, and ordering a short text.",
    focusKo: "-(으)면 · -(으)려고 · -지만 · -(으)ㄴ 후에 · 중심 생각 · 순서 나열",
    max: 10, pass: 7,
  },
];

export const TOPIK1_QUESTIONS: Topik1Question[] = [
  // ---- A — 한글 기초 (8) --------------------------------------------------
  // Decoding first, and nothing in these four needs a word of Korean: the
  // options are syllables and letters, not vocabulary. A student who has done
  // one week of the alphabet course can answer all four; a student who has not
  // can answer none of them, which is the whole point of the section.
  {
    id: "A9", section: "A",
    group: "※ [A9~A12] 다음 물음에 답하십시오.",
    stem: "다음 중 [ㅏ] 소리가 들어 있는 글자를 고르십시오.",
    options: ["그", "기", "가", "구"],
    answerIndex: 2,
  },
  {
    id: "A10", section: "A",
    stem: "다음 중 받침이 있는 글자를 고르십시오.",
    options: ["나", "무", "산", "도"],
    answerIndex: 2,
  },
  {
    id: "A11", section: "A",
    // 글자 is the syllable block in A9 and A10, so this question cannot also use
    // it for the letters inside one. 자음과 모음 is what a student meets in the
    // first week of the alphabet course and is what the options actually show.
    stem: "'학'은 어떤 자음과 모음으로 이루어져 있습니까?",
    options: ["ㅎ + ㅓ + ㄱ", "ㅎ + ㅏ + ㄱ", "ㅎ + ㅏ + ㅋ", "ㅊ + ㅏ + ㄱ"],
    answerIndex: 1,
  },
  {
    id: "A12", section: "A",
    // The letters here are 마 바 사 아, not 가 나 다 라. With 가나다 in the
    // instruction and 가 - 나 - 다 - 라 among the options, the key was a literal
    // substring of the question: a student who cannot read at all could match
    // the shapes 가나다 to the only option that opens with them. An item that
    // can be answered by copying its own stem cannot tell a reader from a
    // non-reader, which is the one thing this section is for. ㅁ ㅂ ㅅ ㅇ sit in
    // the same order and are named nowhere in the instruction.
    stem: "다음을 가나다 순서대로 바르게 나열한 것을 고르십시오.\n\n사   마   아   바",
    options: ["마 - 바 - 사 - 아", "마 - 사 - 바 - 아", "바 - 마 - 사 - 아", "마 - 바 - 아 - 사"],
    answerIndex: 0,
  },
  // The four survivors. A2 and A3 were two more instances of A1's format, and
  // A5 and A8 were two more instances of 에, so the duplicates went and the
  // distinct skills stayed: one sentence-level comprehension item, the object
  // marker, the place-of-action marker, and the copula.
  {
    id: "A1", section: "A",
    group: "※ [A1] 무엇에 대한 이야기입니까? <보기>와 같이 알맞은 것을 고르십시오.",
    bogi: { stem: "사과가 있습니다. 그리고 우유도 있습니다.", options: ["시간", "음식", "가족", "계절"], answerIndex: 1 },
    stem: "저는 스무 살입니다. 동생은 열일곱 살입니다.",
    options: ["이름", "나이", "나라", "직업"], answerIndex: 1,
  },
  {
    id: "A4", section: "A",
    group: "※ [A4, A6, A7] 다음 (　　　)에 들어갈 가장 알맞은 것을 고르십시오.",
    stem: "물(　　　) 마셔요.",
    options: ["을", "이", "에", "에서"], answerIndex: 0,
  },
  {
    id: "A6", section: "A",
    // A6 asked 어디에서 공부해요? and then 집(　)공부해요, printing the answer one
    // line above the blank; the dialogue is gone because a flat statement cannot
    // leak a particle it does not contain. A5 tested 에 and was dropped with A8,
    // which tested 에 as well — 에서 is the locative this section still needs.
    stem: "집(　　　) 공부합니다.",
    options: ["에서", "에", "을", "도"], answerIndex: 0,
  },
  {
    id: "A7", section: "A",
    stem: "가: 이름이 뭐예요?\n     나: 제 이름은 하나(　　　).",
    options: ["이에요", "에요", "예요", "이요"], answerIndex: 2,
  },

  // ---- B — 1급 (10) ------------------------------------------------------
  {
    id: "B1", section: "B",
    group: "※ [B1~B4] 다음 (　　　)에 들어갈 가장 알맞은 것을 고르십시오.",
    stem: "어제 친구를 (　　　). 같이 영화를 봤어요.",
    options: ["만나요", "만날 거예요", "만났어요", "만나고 싶어요"], answerIndex: 2,
  },
  {
    id: "B2", section: "B",
    stem: "저는 한국 음식을 좋아해요. (　　　) 김치는 안 먹어요.",
    options: ["그래서", "하지만", "그리고", "그러면"], answerIndex: 1,
  },
  {
    id: "B3", section: "B",
    stem: "가: 지금 몇 시예요?\n     나: (　　　)이에요.",
    options: ["삼 시 반", "세 시간", "세 시 반", "삼 시간"], answerIndex: 2,
  },
  {
    id: "B4", section: "B",
    stem: "가: 주말에 뭐 할 거예요?\n     나: 부모님 댁에 (　　　).",
    options: ["갈 거예요", "갔어요", "가고 있어요", "가지 마세요"], answerIndex: 0,
  },
  {
    id: "B5", section: "B",
    group: "※ [B5~B6] 다음을 읽고 맞지 않는 것을 고르십시오.",
    passage: "한국어 말하기 대회\n날짜: 10월 5일 (토요일)\n시간: 오후 2시 ~ 4시\n장소: 학생회관 3층\n※ 참가비는 없습니다.",
    stem: "맞지 않는 것을 고르십시오.",
    // The key used to read 대회에 나가려면 돈을 내야 합니다 — -(으)려면 and
    // -아야 하다 are both 2급 forms, so a 1급 student who read the notice
    // correctly could still miss it on grammar she has not met.
    options: [
      "대회는 토요일에 합니다.",
      "대회는 두 시간 동안 합니다.",
      "대회는 학생회관에서 합니다.",
      "참가비는 오천 원입니다.",
    ],
    answerIndex: 3,
  },
  {
    id: "B6", section: "B",
    passage: "민수 씨,\n오늘 저녁 7시에 우리 집에서 생일 파티를 해요.\n음식은 제가 준비해요. 선물은 안 가져와도 돼요.\n- 수진 -",
    stem: "맞지 않는 것을 고르십시오.",
    options: [
      "파티는 저녁에 합니다.",
      "민수 씨가 음식을 준비합니다.",
      "파티는 수진 씨 집에서 합니다.",
      "선물을 안 가져와도 됩니다.",
    ],
    answerIndex: 1,
  },
  {
    id: "B7", section: "B",
    group: "※ [B7~B8] 다음을 읽고 내용이 같은 것을 고르십시오.",
    passage: "저는 지난 주말에 부산에 갔습니다. 바다를 보고 회를 먹었습니다. 날씨가 아주 더웠지만 재미있었습니다.",
    stem: "내용이 같은 것을 고르십시오.",
    // Only the key used to be built from the passage's own words; the three
    // distractors introduced 다음 주말, 수영 and 불고기, none of which appear in
    // it. Scanning for the option whose words are all present answered the
    // question. Every option now draws on the passage, so scanning fails.
    options: [
      "저는 부산에서 바다를 못 봤습니다.",
      "부산은 날씨가 더웠습니다.",
      "저는 부산에서 회를 먹지 않았습니다.",
      "날씨가 시원해서 재미있었습니다.",
    ],
    answerIndex: 1,
  },
  {
    id: "B8", section: "B",
    passage: "우리 반에는 학생이 열 명 있습니다. 남자가 네 명이고 여자가 여섯 명입니다. 저는 우리 반에서 나이가 제일 많습니다.",
    stem: "내용이 같은 것을 고르십시오.",
    // The key was 우리 반 학생은 모두 열 명입니다 — a restatement of the first
    // clause, which left the counts and the superlative in the passage doing no
    // work at all. The key now turns on 남자가 네 명이고 여자가 여섯 명입니다.
    options: [
      "우리 반에 남자가 더 많습니다.",
      "우리 반에 여자가 남자보다 많습니다.",
      "저는 우리 반에서 제일 어립니다.",
      "우리 반에는 남자만 있습니다.",
    ],
    answerIndex: 1,
  },
  {
    id: "B9", section: "B",
    group: "※ [B9~B10] 다음 (　　　)에 들어갈 가장 알맞은 것을 고르십시오.",
    stem: "머리가 아파서 (　　　)에 갔어요.",
    options: ["은행", "병원", "시장", "극장"], answerIndex: 1,
  },
  {
    id: "B10", section: "B",
    stem: "날씨가 추워서 (　　　)를 입었어요.",
    // 를 attaches only to a vowel-final noun, so the old 신발 and 우산 were
    // ungrammatical and could be struck out before vocabulary entered — half the
    // item decided on phonology. All four options are vowel-final now, and each
    // takes a different verb: 쓰다, 입다, 신다, 차다.
    options: ["모자", "코트", "구두", "시계"], answerIndex: 1,
  },

  // ---- C — 2급 (10) ------------------------------------------------------
  {
    id: "C1", section: "C",
    group: "※ [C1~C4] 다음 (　　　)에 들어갈 가장 알맞은 것을 고르십시오.",
    stem: "시간이 (　　　) 같이 점심을 먹읍시다.",
    options: ["있어도", "있으면", "있고", "있어서"], answerIndex: 1,
  },
  {
    id: "C2", section: "C",
    // The stem was 저는 한국 회사에서 (　) 한국어를 배웁니다, which 일하는데 also
    // answers: 한국 회사에서 일하는데 한국어를 배웁니다 is a natural sentence,
    // so a student reading for sense rather than for the target form was marked
    // wrong. 내년에 puts the work in the future, where -는데 cannot follow.
    stem: "저는 내년에 한국 회사에서 (　　　) 지금 한국어를 공부합니다.",
    options: ["일하지만", "일하거나", "일하려고", "일하는데"], answerIndex: 2,
  },
  {
    id: "C3", section: "C",
    stem: "어제는 (　　　) 오늘은 시간이 많아요.",
    // 바빴지만 was the only past-marked option, so the item was answerable by
    // spotting -았- without knowing what -지만 does. Two options carry the tense
    // now, and the connective is what separates them.
    options: ["바빴기 때문에", "바쁘거나", "바빴지만", "바쁘면"], answerIndex: 2,
  },
  {
    id: "C4", section: "C",
    stem: "숙제를 다 (　　　) 후에 텔레비전을 봤어요.",
    options: ["하는", "한", "할", "해서"], answerIndex: 1,
  },
  {
    id: "C5", section: "C",
    group: "※ [C5~C6] 다음을 읽고 중심 생각을 고르십시오.",
    passage: "저는 아침마다 삼십 분씩 걷습니다. 처음에는 힘들었지만 지금은 몸이 아주 가볍습니다. 여러분도 매일 조금씩 운동해 보세요.",
    stem: "중심 생각을 고르십시오.",
    // The key was 매일 조금씩 운동하는 것이 좋습니다 — the closing sentence with
    // its ending swapped, so the last line answered the question on its own. The
    // key now joins the recommendation to the result the passage reports, which
    // cannot be lifted from any one line. 아침에는 걷기가 좋습니다 went too: the
    // passage is entirely about walking in the morning, so it was arguable.
    options: [
      "걷기는 힘든 운동입니다.",
      "매일 운동하면 몸이 좋아집니다.",
      "아침 운동이 저녁 운동보다 좋습니다.",
      "삼십 분은 짧은 시간입니다.",
    ],
    answerIndex: 1,
  },
  {
    id: "C6", section: "C",
    passage: "저는 한국 드라마를 보면서 한국어를 공부합니다. 드라마에는 사람들이 실제로 쓰는 말이 많이 나옵니다. 그래서 교과서로 공부할 때보다 더 쉽게 기억할 수 있습니다.",
    stem: "중심 생각을 고르십시오.",
    options: [
      "드라마는 교과서보다 재미있습니다.",
      "한국어 교과서는 어렵습니다.",
      "드라마를 매일 봐야 합니다.",
      "드라마로 공부하면 말을 더 잘 기억할 수 있습니다.",
    ],
    answerIndex: 3,
  },
  {
    id: "C7", section: "C",
    group: "※ [C7~C8] 다음을 순서대로 맞게 나열한 것을 고르십시오.",
    stem: "(가) 그래서 서점에 갔습니다.\n     (나) 어제 저는 책을 사고 싶었습니다.\n     (다) 하지만 그 책이 없어서 못 샀습니다.\n     (라) 서점에서 한 시간쯤 책을 찾았습니다.",
    options: [
      "(나)-(라)-(가)-(다)",
      "(가)-(나)-(다)-(라)",
      "(나)-(가)-(라)-(다)",
      "(가)-(라)-(나)-(다)",
    ],
    answerIndex: 2,
  },
  {
    id: "C8", section: "C",
    // These four sentences carried no connective at all — C7 has 그래서 and
    // 하지만 doing the ordering work, and this item had nothing. (나)-(가)-(라)-(다)
    // read as well as the key, because only real-world habit put photographing a
    // place after arriving at it. 그곳 has no referent until 경복궁 appears.
    stem: "(가) 그곳에서 우리는 사진을 많이 찍었습니다.\n     (나) 지난주에 친구가 한국에 왔습니다.\n     (다) 친구는 다음 달에 또 올 겁니다.\n     (라) 저는 친구와 함께 경복궁에 갔습니다.",
    options: [
      "(나)-(라)-(가)-(다)",
      "(나)-(가)-(라)-(다)",
      "(라)-(나)-(가)-(다)",
      "(라)-(가)-(나)-(다)",
    ],
    answerIndex: 0,
  },
  {
    id: "C9", section: "C",
    group: "※ [C9~C10] 다음을 읽고 물음에 답하십시오.",
    passage: "저는 작년부터 한국 회사에서 일하고 있습니다. 처음에는 한국어를 잘 못해서 회의 때 아주 힘들었습니다. (   ㉠   ) 저녁마다 두 시간씩 한국어를 공부했습니다. 요즘은 회의에서 제 생각을 말할 수 있습니다. 아직 어려운 말은 모르지만 매일 조금씩 좋아지고 있습니다.",
    stem: "㉠에 들어갈 알맞은 것을 고르십시오.",
    options: ["그런데", "그래서", "그러면", "그렇지만"], answerIndex: 1,
  },
  {
    id: "C10", section: "C",
    // The repeat is deliberate. This question asks about 위 글 and used to carry
    // no passage of its own, so it read correctly only because the page happens
    // to paint a whole section on one screen and C9's box sat above it. The
    // TOPIK II bank repeats its passages on E9 and E11 for the same reason.
    passage: "저는 작년부터 한국 회사에서 일하고 있습니다. 처음에는 한국어를 잘 못해서 회의 때 아주 힘들었습니다. (   ㉠   ) 저녁마다 두 시간씩 한국어를 공부했습니다. 요즘은 회의에서 제 생각을 말할 수 있습니다. 아직 어려운 말은 모르지만 매일 조금씩 좋아지고 있습니다.",
    stem: "위 글의 내용과 같은 것을 고르십시오.",
    options: [
      "저는 한국어를 배운 적이 없습니다.",
      "저는 어려운 말도 모두 압니다.",
      "저는 지금 회의에서 말을 할 수 있습니다.",
      "저는 올해 회사에 들어갔습니다.",
    ],
    answerIndex: 2,
  },
];

/** Auto-graded total across A–C. */
export const TOPIK1_MAX = TOPIK1_QUESTIONS.length;

export interface Topik1PlacementResult {
  sectionScores: Record<Topik1SectionId, number>;
  score: number;
  /** The section that decided the placement; null when every section was passed */
  failedSection: Topik1SectionId | null;
}

/** Section order is the gate order: easiest first, placed at the first failure. */
const GATE_ORDER: Topik1SectionId[] = ["A", "B", "C"];

export function computeTopik1Placement(
  answers: Record<string, number>,
): Topik1PlacementResult {
  const sectionScores = { A: 0, B: 0, C: 0 } as Record<Topik1SectionId, number>;
  for (const q of TOPIK1_QUESTIONS) {
    if (answers[q.id] === q.answerIndex) sectionScores[q.section] += 1;
  }
  const score = Object.values(sectionScores).reduce((a, b) => a + b, 0);

  const passOf = (id: Topik1SectionId) =>
    TOPIK1_SECTIONS.find((s) => s.id === id)?.pass ?? 0;

  for (const id of GATE_ORDER) {
    if (sectionScores[id] < passOf(id)) {
      return { sectionScores, score, failedSection: id };
    }
  }
  return { sectionScores, score, failedSection: null };
}

if (import.meta.env.DEV) {
  // A bad answerIndex or a section whose declared max drifts from the number of
  // questions in it would silently misplace students, so fail loudly at import.
  const seen = new Set<string>();
  for (const q of TOPIK1_QUESTIONS) {
    if (seen.has(q.id)) {
      throw new Error(`topik1Reading: duplicate question id ${q.id}`);
    }
    seen.add(q.id);
    if (q.options.length !== 4) {
      throw new Error(`topik1Reading: ${q.id} has ${q.options.length} options, expected 4`);
    }
    if (q.answerIndex < 0 || q.answerIndex > 3) {
      throw new Error(`topik1Reading: ${q.id} has answerIndex ${q.answerIndex}`);
    }
  }
  for (const s of TOPIK1_SECTIONS) {
    const n = TOPIK1_QUESTIONS.filter((q) => q.section === s.id).length;
    if (n !== s.max) {
      throw new Error(`topik1Reading: section ${s.id} declares max ${s.max} but holds ${n} questions`);
    }
  }
}
