/**
 * TOPIK II 읽기 — the intermediate paper, covering 3급 and 4급.
 *
 * The other paper (topik1Reading.ts) stops at 2급 and says so. A student who
 * cleared every section of it was told "this test only measures levels 1 and 2
 * — talk to us". That sentence was the whole ceiling: anyone already reading
 * Korean paragraphs had no way to be placed, and placement is what decides
 * which class they sit in. This paper is that missing half.
 *
 * WRITTEN FOR KLOVERS. Every passage, sentence, option and headline here was
 * written for this file. Nothing is taken from a past TOPIK paper, and no
 * passage is a paraphrase of one. What follows the real exam is the FORMAT —
 * the ※ instruction lines, the question types and their order — because that
 * is the thing a student needs to recognise, and formats are not ownable.
 *
 * The formats, in the order the real 읽기 paper uses them:
 *
 *   ( ) 안에 들어갈 말          grammar and collocation in context
 *   의미가 비슷한 것             a phrase swapped for its equivalent
 *   무엇에 대한 글              adverts, notices, product copy
 *   내용이 같은 것              notice, chart, short article
 *   순서대로 나열한 것           four sentences to order
 *   중심 생각 / 주제            what the paragraph is for
 *   신문 기사 제목              a compressed headline explained
 *   긴 지문 + 2문항             attitude or feeling, plus a fact check
 *
 * READING ONLY. Real TOPIK II is 듣기 50 + 읽기 50 + 쓰기 4. There are no
 * recordings yet, and a "listening" section that prints its script on screen
 * measures reading twice — the pre-2026 bank did exactly that. 듣기 goes in
 * when there is audio to put in it. Owner decision, 9 Sep 2026: reading first,
 * listening later.
 *
 * DIFFICULTY. Section D sits at 3급: everyday topics, one or two clauses per
 * sentence, vocabulary a student meets in a textbook. Section E sits at 4급:
 * social and workplace topics, longer sentences, abstract nouns, and the
 * connectives (-는 반면에, -기 마련이다, -고서는) that separate 4급 from 3급.
 *
 * HINTS NAME THE TASK, NEVER THE MEANING. An Arabic hint that explains what
 * the target grammar means turns a Korean item into an Arabic one: a student
 * who reads "the sentence adds a second good thing" can eliminate 대신에,
 * 반면에 and 탓에 without reading a word of Korean. Five hints did exactly that
 * and were removed on 9 Sep. D10 keeps its hint because it teaches a reading
 * strategy — start from the sentence that needs no sentence before it — which
 * is true of every ordering item and gives this one away.
 *
 * BLANKS are three U+3000 IDEOGRAPHIC SPACEs — `(　　　)` — not ASCII spaces.
 * HTML collapses a run of ASCII spaces to one, which turns every blank into
 * `( )` and hides how much is missing. Same rule as the TOPIK I bank.
 */

export type Topik2SectionId = "D" | "E";

export interface Topik2Question {
  id: string;
  section: Topik2SectionId;
  /** TOPIK-style ※ instruction rendered above this question, when it opens a group */
  group?: string;
  /** Notice, chart, headline or passage rendered in a box above the question */
  passage?: string;
  stem: string;
  /** Arabic-only nudge, rendered RTL under the stem. Never gives the answer. */
  hintAr?: string;
  options: string[];
  answerIndex: number;
}

export interface Topik2Section {
  id: Topik2SectionId;
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
}

export const TOPIK2_SECTIONS: Topik2Section[] = [
  {
    id: "D",
    gradeKo: "3급",
    titleKo: "읽기 1: 3급",
    titleEn: "Section 4: TOPIK level 3 (3급)",
    titleAr: "القسم الرابع: المستوى الثالث (3급)",
    instrEn:
      "Everyday texts: a notice, an advert, a short paragraph. Read for what the text is for, not only for the words in it.",
    instrAr:
      "نصوص من الحياة اليومية: إعلان، ولافتة، وفقرة قصيرة. الغرض من القراءة فهم ما يريد النص قوله، لا ترجمة كلماته.",
    focusKo: "일상 표현 · 안내문 · 짧은 글의 중심 생각",
    max: 12,
  },
  {
    id: "E",
    gradeKo: "4급",
    titleKo: "읽기 2: 4급",
    titleEn: "Section 5: TOPIK level 4 (4급)",
    titleAr: "القسم الخامس: المستوى الرابع (4급)",
    instrEn:
      "Longer texts on social and working life: a headline, an article, a passage with two questions on it.",
    instrAr:
      "نصوص أطول عن المجتمع والعمل: عنوان خبر، ومقال، ونص طويل يليه سؤالان.",
    focusKo: "신문 기사 제목 · 논설문 · 인물의 태도와 심정",
    max: 12,
  },
];

const BLANK = "(　　　)";

export const TOPIK2_QUESTIONS: Topik2Question[] = [
  // ── D · 3급 ──────────────────────────────────────────────────────────────
  // ( ) 안에 들어갈 말 — grammar in context
  {
    id: "D1",
    section: "D",
    group: "※ [D1~D3] ( )에 들어갈 가장 알맞은 것을 고르십시오.",
    stem: `날씨가 갑자기 추워져서 두꺼운 옷을 ${BLANK} 밖에 나갔다.`,
    options: ["입고", "입어서", "입으려고", "입는데"],
    answerIndex: 0,
  },
  {
    id: "D2",
    section: "D",
    stem: `아무리 바쁘${BLANK} 아침은 꼭 먹는 것이 좋습니다.`,
    options: ["니까", "더라도", "면서", "기 때문에"],
    answerIndex: 1,
  },
  {
    id: "D3",
    section: "D",
    stem: `이 식당은 값이 싼 ${BLANK} 음식도 맛있어서 늘 사람이 많다.`,
    options: ["대신에", "데다가", "탓에", "척하고"],
    answerIndex: 1,
  },

  // 의미가 비슷한 것
  {
    id: "D4",
    section: "D",
    group: "※ [D4~D5] 「 」 안의 표현과 의미가 가장 비슷한 것을 고르십시오.",
    stem: "약속 시간에 「늦을까 봐」 택시를 탔습니다.",
    options: [
      "늦으면 좋겠어서",
      "늦을 것 같아서 걱정이 되어",
      "늦은 다음에",
      "늦어도 괜찮아서",
    ],
    answerIndex: 1,
  },
  {
    id: "D5",
    section: "D",
    stem: "그 문제는 혼자 해결하기 「어려울 뿐만 아니라」 시간도 많이 걸린다.",
    options: ["어려운 대신에", "어려운 반면에", "어려울뿐더러", "어려운 김에"],
    answerIndex: 2,
  },

  // 무엇에 대한 글
  {
    id: "D6",
    section: "D",
    group: "※ [D6~D7] 다음은 무엇에 대한 글인지 고르십시오.",
    passage: "끓는 물을 붓고 3분만 기다리세요.\n불 없이도 만들 수 있습니다.\n한 봉지에 두 그릇.",
    stem: "무엇에 대한 글입니까?",
    options: ["라면", "우산", "비누", "달력"],
    answerIndex: 0,
  },
  {
    id: "D7",
    section: "D",
    passage: "무거운 책은 이제 그만.\n오천 권을 손안에.\n밤에도 눈이 편한 화면.",
    stem: "무엇에 대한 글입니까?",
    options: ["도서관 안내", "전자책 단말기", "안경점 광고", "가방 판매"],
    answerIndex: 1,
  },

  // 내용이 같은 것 — 안내문
  {
    id: "D8",
    section: "D",
    group: "※ [D8~D9] 다음 글의 내용과 같은 것을 고르십시오.",
    passage:
      "〈한국어 말하기 대회 안내〉\n" +
      "· 일시: 11월 14일(토) 오후 2시\n" +
      "· 장소: 시민회관 3층 대강당\n" +
      "· 대상: 한국어를 배운 지 2년이 안 된 외국인\n" +
      "· 신청: 11월 1일까지 홈페이지에서만 접수\n" +
      "※ 대회 당일에는 신청을 받지 않습니다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "대회 당일에 와서 신청할 수 있다.",
      "한국어를 3년 배운 사람도 나갈 수 있다.",
      "신청은 인터넷으로만 할 수 있다.",
      "대회는 오전에 시작한다.",
    ],
    answerIndex: 2,
  },
  {
    id: "D9",
    section: "D",
    passage:
      "우리 반 학생 20명에게 주말에 무엇을 하는지 물었다.\n" +
      "집에서 쉰다고 답한 학생이 9명으로 가장 많았고,\n" +
      "친구를 만난다는 학생이 6명, 운동을 한다는 학생이 3명이었다.\n" +
      "나머지 2명은 아르바이트를 한다고 했다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "운동을 하는 학생이 친구를 만나는 학생보다 많다.",
      "절반이 넘는 학생이 집에서 쉰다.",
      "아르바이트를 하는 학생이 가장 적다.",
      "친구를 만나는 학생은 아무도 없다.",
    ],
    answerIndex: 2,
  },

  // 순서대로 나열
  {
    id: "D10",
    section: "D",
    group: "※ [D10] 다음을 순서대로 맞게 나열한 것을 고르십시오.",
    passage:
      "(가) 그래서 지난주에 자전거를 한 대 샀다.\n" +
      "(나) 요즘 버스를 기다리는 시간이 너무 아까웠다.\n" +
      "(다) 이제는 아침마다 자전거로 학교에 간다.\n" +
      "(라) 처음에는 넘어질까 봐 걱정이 많았다.",
    stem: "순서대로 맞게 나열한 것을 고르십시오.",
    hintAr: "البداية بالجملة التي لا تحتاج إلى جملة قبلها.",
    options: ["(나)-(가)-(라)-(다)", "(나)-(라)-(가)-(다)", "(가)-(나)-(다)-(라)", "(가)-(라)-(나)-(다)"],
    answerIndex: 0,
  },

  // 중심 생각
  {
    id: "D11",
    section: "D",
    group: "※ [D11~D12] 다음 글의 중심 생각을 고르십시오.",
    passage:
      "새로운 언어를 배울 때 많은 사람들이 단어를 외우는 데에만 시간을 쓴다. " +
      "그런데 단어를 아무리 많이 알아도 그 단어가 어떤 자리에 쓰이는지 모르면 문장을 만들 수 없다. " +
      "단어는 문장 안에서 익혀야 오래 남는다.",
    stem: "이 글의 중심 생각을 고르십시오.",
    options: [
      "단어는 하루에 많이 외울수록 좋다.",
      "단어는 쓰이는 자리와 함께 알아야 한다.",
      "문법을 먼저 공부해야 한다.",
      "외국어는 어릴 때 배워야 한다.",
    ],
    answerIndex: 1,
  },
  {
    id: "D12",
    section: "D",
    passage:
      "혼자 사는 사람이 늘면서 작은 그릇에 담긴 채소와 과일이 잘 팔리고 있다. " +
      "예전에는 한 상자씩 사는 것이 값이 싸다고 생각했지만, " +
      "다 먹지 못하고 버리는 일이 많아지자 사람들의 생각이 바뀌었다. " +
      "싸게 사는 것보다 남기지 않는 것이 결국 더 이익이기 때문이다.",
    stem: "이 글의 중심 생각을 고르십시오.",
    options: [
      "채소와 과일은 상자로 사는 것이 좋다.",
      "혼자 사는 사람은 요리를 하지 않는다.",
      "버리지 않고 다 먹는 것이 더 경제적이다.",
      "과일 값이 예전보다 많이 올랐다.",
    ],
    answerIndex: 2,
  },

  // ── E · 4급 ──────────────────────────────────────────────────────────────
  // ( ) 안에 들어갈 말 — longer context
  {
    id: "E1",
    section: "E",
    group: "※ [E1~E3] ( )에 들어갈 가장 알맞은 것을 고르십시오.",
    passage:
      "회사에서는 회의 시간을 줄이려고 여러 방법을 쓴다. " +
      `그러나 회의가 짧아졌다고 해서 일이 빨리 끝나는 것은 아니다. ` +
      `결정할 사람이 그 자리에 없으면 회의는 ${BLANK} 다시 열리기 마련이다.`,
    stem: "( )에 들어갈 가장 알맞은 것을 고르십시오.",
    // "짧아진 대신에" sat here until 9 Sep and was a second correct answer: the
    // trade-off it names — shorter meetings bought at the price of more of them
    // — is the passage's own argument, so a student reading for the argument
    // rather than for the collocation was marked wrong for understanding it.
    options: ["짧아지는 김에", "아무리 짧아도", "짧아지자마자", "짧아지는 동안"],
    answerIndex: 1,
  },
  {
    id: "E2",
    section: "E",
    passage:
      "도시의 밤이 밝아지면서 별을 보기가 어려워졌다. " +
      `가로등과 간판의 불빛이 하늘로 올라가 별빛을 가리기 때문이다. ` +
      `불빛의 방향만 아래로 바꾸어도 ${BLANK} 밤하늘을 되찾을 수 있다고 한다.`,
    stem: "( )에 들어갈 가장 알맞은 것을 고르십시오.",
    options: [
      "전기를 모두 끄지 않고서는",
      "전기를 더 많이 쓰는 대신",
      "전기를 더 쓰지 않고도",
      "전기를 아끼기는커녕",
    ],
    answerIndex: 2,
  },
  {
    id: "E3",
    section: "E",
    passage:
      "한 가지 일을 오래 한 사람은 자기 분야를 잘 안다. " +
      `그런데 그 익숙함이 오히려 새로운 방법을 보지 못하게 만들기도 한다. ` +
      `경험이 많다는 것은 강점인 ${BLANK} 약점이 되기도 한다.`,
    stem: "( )에 들어갈 가장 알맞은 것을 고르십시오.",
    options: ["덕분에", "반면에", "김에", "탓으로"],
    answerIndex: 1,
  },

  // 신문 기사 제목
  {
    id: "E4",
    section: "E",
    group: "※ [E4~E5] 다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.",
    passage: "장마 끝나자 채솟값 '껑충', 식탁 부담 커져",
    stem: "이 제목을 가장 잘 설명한 것을 고르십시오.",
    options: [
      "장마가 끝난 뒤 채소 가격이 크게 올라 가정의 부담이 커졌다.",
      "장마 때문에 채소를 심지 못해 농민들이 힘들어한다.",
      "채솟값이 내려서 사람들이 채소를 많이 사고 있다.",
      "장마가 길어져 채소가 잘 자라지 못하고 있다.",
    ],
    answerIndex: 0,
  },
  {
    id: "E5",
    section: "E",
    passage: "재택근무 3년, 사무실로 돌아오라는 회사와 버티는 직원",
    stem: "이 제목을 가장 잘 설명한 것을 고르십시오.",
    options: [
      "회사가 재택근무를 더 늘리기로 결정했다.",
      "직원들이 사무실로 돌아가고 싶어 한다.",
      "출근을 요구하는 회사와 재택을 원하는 직원의 생각이 서로 다르다.",
      "재택근무를 하면 일의 능률이 떨어진다는 것이 밝혀졌다.",
    ],
    answerIndex: 2,
  },

  // 내용이 같은 것 — 기사
  {
    id: "E6",
    section: "E",
    group: "※ [E6~E7] 다음 글의 내용과 같은 것을 고르십시오.",
    passage:
      "시는 다음 달부터 시내버스 막차 시간을 한 시간 늦추기로 했다. " +
      "밤늦게 일을 마치는 사람들이 택시를 타느라 부담이 컸다는 의견이 많았기 때문이다. " +
      "다만 모든 노선이 아니라 이용객이 많은 열두 개 노선에만 적용된다. " +
      "시는 석 달 동안 운행한 뒤 결과를 보고 확대 여부를 정할 계획이다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "시내버스 전 노선의 막차가 한 시간 늦어진다.",
      "막차 연장은 우선 일부 노선에서만 시행된다.",
      "이번 결정은 택시 요금을 내리기 위한 것이다.",
      "석 달 뒤에는 반드시 모든 노선으로 넓어진다.",
    ],
    answerIndex: 1,
  },
  {
    id: "E7",
    section: "E",
    passage:
      "도서관이 책을 빌려주는 곳에서 머무는 곳으로 바뀌고 있다. " +
      "한 구립 도서관은 지난해 열람실을 줄이는 대신 함께 이야기할 수 있는 공간을 늘렸다. " +
      "조용해야 한다는 규칙이 사라지자 오히려 이용자가 늘었다. " +
      "책을 빌려 간 권수는 크게 달라지지 않았지만, 도서관에 머무는 시간은 두 배가 되었다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "이 도서관은 대출 권수가 두 배로 늘었다.",
      "열람실을 늘린 뒤에 이용자가 많아졌다.",
      "이용자들이 도서관에 머무는 시간이 길어졌다.",
      "조용한 규칙을 지키게 하자 이용자가 줄었다.",
    ],
    answerIndex: 2,
  },

  // 긴 지문 + 주제
  {
    id: "E8",
    section: "E",
    group: "※ [E8~E9] 다음 글을 읽고 물음에 답하십시오.",
    passage:
      "외국어를 배우는 사람들은 흔히 발음이 좋아야 말이 통한다고 생각한다. " +
      "그래서 발음을 고치는 데 오랜 시간을 들이고, 조금이라도 어색하면 입을 열지 않는다. " +
      "그러나 실제 대화에서 상대가 알아듣지 못하는 이유는 발음보다 " +
      "문장이 끊기거나 하려는 말의 순서가 흐트러지는 경우가 더 많다. " +
      "발음이 완벽하지 않아도 말의 흐름이 분명하면 뜻은 전해진다. " +
      "먼저 끝까지 말해 보고, 발음은 그 뒤에 다듬어도 늦지 않다.",
    stem: "이 글의 주제로 가장 알맞은 것을 고르십시오.",
    options: [
      "발음이 좋아야 외국어를 잘하는 것이다.",
      "외국어는 어릴 때 시작해야 발음이 좋아진다.",
      "말이 통하려면 발음보다 말의 흐름이 더 중요하다.",
      "대화를 많이 하면 문법은 저절로 좋아진다.",
    ],
    answerIndex: 2,
  },
  {
    id: "E9",
    section: "E",
    passage:
      "외국어를 배우는 사람들은 흔히 발음이 좋아야 말이 통한다고 생각한다. " +
      "그래서 발음을 고치는 데 오랜 시간을 들이고, 조금이라도 어색하면 입을 열지 않는다. " +
      "그러나 실제 대화에서 상대가 알아듣지 못하는 이유는 발음보다 " +
      "문장이 끊기거나 하려는 말의 순서가 흐트러지는 경우가 더 많다. " +
      "발음이 완벽하지 않아도 말의 흐름이 분명하면 뜻은 전해진다. " +
      "먼저 끝까지 말해 보고, 발음은 그 뒤에 다듬어도 늦지 않다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "많은 사람들이 발음을 고치는 데 오랜 시간을 쓴다.",
      "발음이 완벽해야 뜻이 전해진다.",
      "글쓴이는 발음 연습을 하지 말라고 했다.",
      "말이 끊기는 것은 대화에서 문제가 되지 않는다.",
    ],
    answerIndex: 0,
  },

  // 긴 지문 + 심정/태도 + 내용 일치
  {
    id: "E10",
    section: "E",
    group: "※ [E10~E11] 다음 글을 읽고 물음에 답하십시오.",
    passage:
      "첫 수업 날, 나는 교실 문 앞에서 한참을 서 있었다. " +
      "스무 명이 넘는 학생들이 나보다 훨씬 어려 보였고, " +
      "그들이 주고받는 말은 절반도 알아듣기 어려웠다. " +
      "자리에 앉아 공책을 펴 놓고도 손이 잘 움직이지 않았다. " +
      "그날 나는 한 마디도 하지 못한 채 집으로 돌아왔다. " +
      "그런데 이상하게도, 다음 주 같은 요일이 되자 나는 또 그 문 앞에 서 있었다.",
    stem: "이 글에 나타난 '나'의 심정으로 가장 알맞은 것을 고르십시오.",
    options: [
      "교실에 처음 들어설 때 몹시 긴장하고 위축되었다.",
      "학생들이 어려서 실망하고 화가 났다.",
      "수업이 쉬워서 지루하고 답답했다.",
      "선생님에게 서운하고 억울했다.",
    ],
    answerIndex: 0,
  },
  {
    id: "E11",
    section: "E",
    passage:
      "첫 수업 날, 나는 교실 문 앞에서 한참을 서 있었다. " +
      "스무 명이 넘는 학생들이 나보다 훨씬 어려 보였고, " +
      "그들이 주고받는 말은 절반도 알아듣기 어려웠다. " +
      "자리에 앉아 공책을 펴 놓고도 손이 잘 움직이지 않았다. " +
      "그날 나는 한 마디도 하지 못한 채 집으로 돌아왔다. " +
      "그런데 이상하게도, 다음 주 같은 요일이 되자 나는 또 그 문 앞에 서 있었다.",
    stem: "이 글의 내용과 같은 것을 고르십시오.",
    options: [
      "'나'는 첫날 수업에서 여러 번 발표를 했다.",
      "'나'는 학생들의 말을 모두 알아들었다.",
      "'나'는 첫 수업 뒤에 다시 그곳을 찾았다.",
      "'나'는 다른 학생들보다 나이가 어렸다.",
    ],
    answerIndex: 2,
  },

  // 필자의 태도
  {
    id: "E12",
    section: "E",
    group: "※ [E12] 다음 글을 읽고 물음에 답하십시오.",
    passage:
      "인공지능이 번역을 대신해 주니 이제 외국어를 배울 필요가 없다는 말을 자주 듣는다. " +
      "기계가 뜻을 옮겨 주는 것은 사실이다. " +
      "그러나 언어를 배우는 일은 뜻을 옮기는 일에서 끝나지 않는다. " +
      "상대가 왜 그 표현을 골랐는지, 무엇을 말하지 않았는지를 읽어 내는 것은 " +
      "여전히 배운 사람만 할 수 있는 일이다. " +
      "도구가 좋아질수록 도구를 쓰는 사람의 판단이 더 중요해진다.",
    stem: "이 글에 나타난 필자의 태도로 가장 알맞은 것을 고르십시오.",
    options: [
      "기계 번역의 발전을 걱정하며 사용을 반대하고 있다.",
      "기계 번역의 쓸모를 인정하면서도 언어 학습의 가치를 강조하고 있다.",
      "외국어 학습이 곧 필요 없어질 것이라고 예상하고 있다.",
      "번역 기술의 원리를 자세히 설명하고 있다.",
    ],
    answerIndex: 1,
  },
];

export const TOPIK2_MAX = TOPIK2_QUESTIONS.length;

/**
 * Invariants, checked in dev only.
 *
 * These exist because the failure they catch is silent: a question with three
 * options, or an answerIndex pointing past the end of the list, renders as a
 * perfectly normal question that simply cannot be answered correctly. The
 * TOPIK I bank carries the same block; a student found the drift there before
 * this check did, which is why it is here from the first commit.
 */
if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const q of TOPIK2_QUESTIONS) {
    if (seen.has(q.id)) throw new Error(`topik2Reading: duplicate question id ${q.id}`);
    seen.add(q.id);
    if (q.options.length !== 4) {
      throw new Error(`topik2Reading: ${q.id} has ${q.options.length} options, expected 4`);
    }
    if (q.answerIndex < 0 || q.answerIndex > 3) {
      throw new Error(`topik2Reading: ${q.id} answerIndex ${q.answerIndex} is outside 0-3`);
    }
    if (new Set(q.options).size !== q.options.length) {
      throw new Error(`topik2Reading: ${q.id} repeats an option`);
    }
  }
  for (const s of TOPIK2_SECTIONS) {
    const n = TOPIK2_QUESTIONS.filter((q) => q.section === s.id).length;
    if (n !== s.max) {
      throw new Error(`topik2Reading: section ${s.id} declares max ${s.max} but holds ${n}`);
    }
  }
}
