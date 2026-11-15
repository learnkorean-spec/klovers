import type { WorldLang } from "./copy";

/**
 * Conversations with Book 1's new Korean people (canon
 * supportingKoreanCast.book1 — Re, 4 Nov 2026: "the story must keep
 * introducing new Korean people", and 15 Nov 2026: "new people must come
 * into the conversations"). Each person stands in the Vocabulary Market,
 * Book 1's one world, and speaks about their own class's grammar.
 *
 * A conversation is a few turns. In each, the person says a line and the
 * learner chooses what to answer in Korean: one answer fits; the others are
 * real mistakes a beginner makes, and picking one explains it (never "wrong",
 * the canon's review rule). Finishing one is exploration only: the person is
 * then a friend who is called by name, and nothing is counted as learning
 * progress (worldState.ts).
 *
 * The six canon questions, for all seven:
 * 1 what is learned: the class's own sentence pattern, used in a reply;
 * 2 why now: the market opens at Level 1, which is Book 1;
 * 3 whose moment: the Korean friend's, by the Minsu precedent (a native
 *   speaker to practise with: never a teacher, never a love interest);
 * 4 which world: Vocabulary Market;
 * 5 what real data: the learner's course level opens the market (access.ts);
 * 6 what changes: the person becomes a friend, greeted by name afterwards.
 */
export type ChatId = "jihoon" | "park" | "kim" | "yuna" | "seoyeon" | "taeyang" | "hana";

/** In the order Book 1's classes introduce them. */
export const CHAT_ORDER: readonly ChatId[] = ["jihoon", "park", "kim", "yuna", "seoyeon", "taeyang", "hana"];

/** Who speaks: the person in config/npcs.ts and their id in the canon. */
export const CHAT_PEOPLE: Record<ChatId, { npc: string; canon: string; nameKo: string }> = {
  jihoon: { npc: "m-jihoon", canon: "classmate-jihoon", nameKo: "지훈" },
  park: { npc: "m-park", canon: "market-vendor-park", nameKo: "박 아주머니" },
  kim: { npc: "m-kim", canon: "info-desk-clerk-kim", nameKo: "김 선생님" },
  yuna: { npc: "m-yuna", canon: "cafe-barista-yuna", nameKo: "유나" },
  seoyeon: { npc: "m-seoyeon", canon: "classmate-seoyeon", nameKo: "서연" },
  taeyang: { npc: "m-taeyang", canon: "new-friend-taeyang", nameKo: "태양" },
  hana: { npc: "m-hana", canon: "neighbor-hana", nameKo: "하나" },
};

/** What is saved in worldState.met once a conversation is finished. */
export const chatMetKey = (id: ChatId): string => `chat-${id}`;
export const chatsMet = (met: readonly string[]): number => CHAT_ORDER.filter((id) => met.includes(chatMetKey(id))).length;

export interface ChatOption {
  /** The Korean reply on the button. */
  ko: string;
  right: boolean;
  /** Why it fits, or what it really says and what to say instead. */
  feedback: string;
}

export interface ChatTurn {
  /** The person's line. */
  ko: string;
  gloss: string;
  /** The situation: what the learner wants to say now. */
  ask: string;
  options: [ChatOption, ChatOption, ChatOption];
}

export interface Chat {
  /** The person's name, and who they are before they are a friend. */
  name: string;
  role: string;
  /** The pattern this conversation practises, in one line. */
  focus: string;
  turns: ChatTurn[];
  /** The person's last line, once every turn is answered. */
  closing: { ko: string; gloss: string };
}

const EN: Record<ChatId, Chat> = {
  jihoon: {
    name: "Jihoon",
    role: "Passer-by",
    focus: "Places: 에 for where you go, 에 있어요 for where something is.",
    turns: [
      {
        ko: "안녕하세요! 어디 가요?",
        gloss: "Hello! Where are you going?",
        ask: "You are on your way to the market (시장).",
        options: [
          { ko: "시장에 가요.", right: true, feedback: "Yes: 시장에 가요. The place you are going to takes 에." },
          { ko: "시장이에요.", right: false, feedback: "시장이에요 says \"it is a market\". For where you are going: 시장에 가요." },
          { ko: "시장에서 가요.", right: false, feedback: "에서 marks where something happens, or where you come from. A destination takes 에: 시장에 가요." },
        ],
      },
      {
        ko: "아, 시장! 여기가 시장이에요.",
        gloss: "Ah, the market! This is the market.",
        ask: "You are looking for the book shop (책 가게). Ask him where it is.",
        options: [
          { ko: "책 가게가 뭐예요?", right: false, feedback: "뭐예요 asks \"what is it?\". To ask where: 책 가게가 어디에 있어요?" },
          { ko: "책 가게가 어디에 있어요?", right: true, feedback: "Yes: 어디에 있어요? \"Where is it?\" 어디 = where, 있어요 = there is." },
          { ko: "책 가게에 가요?", right: false, feedback: "That asks him \"are you going to the book shop?\". To ask where it is: 책 가게가 어디에 있어요?" },
        ],
      },
      {
        ko: "저쪽으로 쭉 가세요. 오른쪽에 있어요.",
        gloss: "Go straight that way. It is on the right.",
        ask: "He was kind. Thank him.",
        options: [
          { ko: "미안합니다.", right: false, feedback: "미안합니다 means \"I'm sorry\". To thank someone: 감사합니다." },
          { ko: "안녕하세요.", right: false, feedback: "안녕하세요 is hello. To thank someone: 감사합니다." },
          { ko: "감사합니다!", right: true, feedback: "Yes: 감사합니다! 오른쪽 = right, 왼쪽 = left, 쭉 = straight on." },
        ],
      },
    ],
    closing: { ko: "아니에요. 또 만나요!", gloss: "Not at all. See you again!" },
  },
  park: {
    name: "Ms. Park",
    role: "Market vendor",
    focus: "Shopping: two kinds of numbers. 한, 두, 세 for counting things; 천, 이천 for prices.",
    turns: [
      {
        ko: "어서 오세요! 뭐 드릴까요?",
        gloss: "Welcome! What can I get you?",
        ask: "You want two apples (사과).",
        options: [
          { ko: "사과 이 개 주세요.", right: false, feedback: "Things are counted with the Korean numbers 한, 두, 세, not 일, 이, 삼: 사과 두 개 주세요." },
          { ko: "사과 두 개 주세요.", right: true, feedback: "Yes: 사과 두 개 주세요. 개 counts things, and 둘 becomes 두 before it." },
          { ko: "사과 두 명 주세요.", right: false, feedback: "명 counts people! For things it is 개: 사과 두 개 주세요." },
        ],
      },
      {
        ko: "네, 여기 있어요.",
        gloss: "Yes, here you are.",
        ask: "Ask her the price.",
        options: [
          { ko: "얼마예요?", right: true, feedback: "Yes: 얼마예요? \"How much is it?\"" },
          { ko: "몇 시예요?", right: false, feedback: "몇 시예요 asks the time. For a price: 얼마예요?" },
          { ko: "어디예요?", right: false, feedback: "어디예요 asks \"where is it?\". For a price: 얼마예요?" },
        ],
      },
      {
        ko: "이천 원이에요.",
        gloss: "…",
        ask: "How much do you hand her?",
        options: [
          { ko: "200원", right: false, feedback: "200 is 이백. She said 이천: 이 (2) + 천 (1,000) = 2,000 won." },
          { ko: "2,000원", right: true, feedback: "Yes: 이천 원 is 2,000 won. Prices use 일, 이, 삼 with 백 (100), 천 (1,000), 만 (10,000)." },
          { ko: "20,000원", right: false, feedback: "20,000 is 이만. She said 이천: 이 (2) + 천 (1,000) = 2,000 won." },
        ],
      },
    ],
    closing: { ko: "감사합니다! 또 오세요.", gloss: "Thank you! Come again." },
  },
  kim: {
    name: "Mr. Kim",
    role: "Information desk clerk",
    focus: "Formal speech: -ㅂ니다 / -습니다, and -ㅂ니까? for questions.",
    turns: [
      {
        ko: "안녕하십니까?",
        gloss: "Good day. (formal)",
        ask: "He is at work and speaks formally. Greet him the same way.",
        options: [
          { ko: "안녕!", right: false, feedback: "안녕 is for close friends and children. To a clerk at his desk: 안녕하십니까?" },
          { ko: "안녕히 가세요.", right: false, feedback: "안녕히 가세요 is goodbye, to someone leaving. The formal hello: 안녕하십니까?" },
          { ko: "안녕하십니까?", right: true, feedback: "Yes: 안녕하십니까? The formal hello, heard at desks, on the news and in announcements." },
        ],
      },
      {
        ko: "학생입니까?",
        gloss: "Are you a student?",
        ask: "You are. Answer in his formal style.",
        options: [
          { ko: "네, 학생입니다.", right: true, feedback: "Yes: 학생입니다. 입니다 is the formal 이에요; the question form is 입니까?" },
          { ko: "네, 학생이에요.", right: false, feedback: "Good Korean, and polite, but it is the everyday style. To match his formal one: 네, 학생입니다." },
          { ko: "아니요, 학생입니다.", right: false, feedback: "아니요 means no, and then it says you are a student. Yes is 네: 네, 학생입니다." },
        ],
      },
      {
        ko: "시장 지도는 여기 있습니다.",
        gloss: "The market map is here.",
        ask: "Thank him, formally.",
        options: [
          { ko: "고마워.", right: false, feedback: "고마워 is for close friends. The formal thank-you: 감사합니다." },
          { ko: "감사합니다.", right: true, feedback: "Yes: 감사합니다. It ends in -ㅂ니다 too: it is the formal style you already know." },
          { ko: "죄송합니다.", right: false, feedback: "죄송합니다 is a formal \"I'm sorry\". To thank him: 감사합니다." },
        ],
      },
    ],
    closing: { ko: "좋은 하루 되십시오.", gloss: "Have a good day." },
  },
  yuna: {
    name: "Yuna",
    role: "Café barista",
    focus: "Polite requests: 주세요 to ask, -(으)세요 when someone asks you.",
    turns: [
      {
        ko: "안녕하세요! 주문하세요.",
        gloss: "Hello! Please order.",
        ask: "You want one coffee (커피).",
        options: [
          { ko: "커피 한 개 주세요.", right: false, feedback: "Drinks in a cup or glass are counted with 잔, not 개: 커피 한 잔 주세요." },
          { ko: "커피 한 잔 주세요.", right: true, feedback: "Yes: 커피 한 잔 주세요. 잔 counts cups and glasses; 주세요 = please give me." },
          { ko: "커피 주세요 한 잔.", right: false, feedback: "Close! In Korean 주세요 comes last: 커피 한 잔 주세요." },
        ],
      },
      {
        ko: "잠깐만 기다리세요.",
        gloss: "Please wait a moment.",
        ask: "She asks you to wait. Say you will.",
        options: [
          { ko: "네, 알겠어요.", right: true, feedback: "Yes: 네, 알겠어요, \"all right\". 기다리세요 = please wait: -세요 is a polite request to you." },
          { ko: "아니요, 괜찮아요.", right: false, feedback: "That says \"no thanks\": you would lose your coffee! To agree: 네, 알겠어요." },
          { ko: "네, 기다리세요.", right: false, feedback: "That tells her to wait. You are the one waiting: 네, 알겠어요." },
        ],
      },
      {
        ko: "커피 나왔어요. 맛있게 드세요!",
        gloss: "Your coffee is ready. Enjoy!",
        ask: "What do you say before you drink?",
        options: [
          { ko: "맛있게 드세요!", right: false, feedback: "That is what the person serving says to you. Your answer: 잘 마시겠습니다!" },
          { ko: "잘 먹었습니다.", right: false, feedback: "잘 먹었습니다 is said after finishing. Before a drink: 잘 마시겠습니다!" },
          { ko: "잘 마시겠습니다!", right: true, feedback: "Yes: 잘 마시겠습니다! \"I will drink it well\": thanks said before a drink. For food: 잘 먹겠습니다!" },
        ],
      },
    ],
    closing: { ko: "또 오세요! 카페에서 만나요.", gloss: "Come again! See you at the café." },
  },
  seoyeon: {
    name: "Seoyeon",
    role: "Classmate",
    focus: "Time and days: 시 for the hour (한, 두, 세), 요일 for the day, 내일 · 오늘 · 어제.",
    turns: [
      {
        ko: "지금 몇 시예요?",
        gloss: "What time is it now?",
        ask: "Your phone says 3:00.",
        options: [
          { ko: "삼 시예요.", right: false, feedback: "Hours use the Korean numbers 한, 두, 세, not 일, 이, 삼: 세 시예요." },
          { ko: "세 시예요.", right: true, feedback: "Yes: 세 시예요. Hours take 한, 두, 세…; minutes (분) take 일, 이, 삼." },
          { ko: "세 분이에요.", right: false, feedback: "분 is minutes: that says \"three minutes\". The hour is 시: 세 시예요." },
        ],
      },
      {
        ko: "오늘 무슨 요일이에요?",
        gloss: "What day is it today?",
        ask: "Say that it is Saturday.",
        options: [
          { ko: "일요일이에요.", right: false, feedback: "일요일 is Sunday. Saturday is 토요일: 토요일이에요." },
          { ko: "오늘이에요.", right: false, feedback: "That says \"it is today\". The day she asks for: 토요일이에요." },
          { ko: "토요일이에요.", right: true, feedback: "Yes: 토요일이에요. 월 · 화 · 수 · 목 · 금 · 토 · 일, each followed by 요일." },
        ],
      },
      {
        ko: "내일 두 시에 만나요!",
        gloss: "Let's meet tomorrow at two!",
        ask: "Agree to her plan.",
        options: [
          { ko: "네, 내일 만나요!", right: true, feedback: "Yes: 내일 = tomorrow. 두 시에: the time something happens takes 에." },
          { ko: "네, 어제 만나요!", right: false, feedback: "어제 is yesterday! Tomorrow is 내일: 네, 내일 만나요!" },
          { ko: "네, 지금 만나요!", right: false, feedback: "지금 is now, but she said tomorrow: 네, 내일 만나요!" },
        ],
      },
    ],
    closing: { ko: "좋아요! 내일 봐요.", gloss: "Great! See you tomorrow." },
  },
  taeyang: {
    name: "Taeyang",
    role: "A new friend",
    focus: "Plans: -(으)ㄹ까요? to suggest, -(으)ㄹ 거예요 for what you will do, -아서/어서 for the reason.",
    turns: [
      {
        ko: "주말에 같이 부산에 갈까요?",
        gloss: "Shall we go to Busan together this weekend?",
        ask: "You would like that.",
        options: [
          { ko: "네, 갔어요.", right: false, feedback: "갔어요 is the past: \"I went\". To accept a plan: 네, 좋아요! 같이 가요." },
          { ko: "네, 좋아요! 같이 가요.", right: true, feedback: "Yes: 좋아요! 같이 가요. -(으)ㄹ까요? suggests doing something together: 갈까요? \"shall we go?\"" },
          { ko: "부산이에요.", right: false, feedback: "That says \"it is Busan\". To accept: 네, 좋아요! 같이 가요." },
        ],
      },
      {
        ko: "부산에서 뭐 할 거예요?",
        gloss: "What will you do in Busan?",
        ask: "You plan to see the sea (바다).",
        options: [
          { ko: "바다를 볼 거예요.", right: true, feedback: "Yes: 볼 거예요, \"I will see\". -(으)ㄹ 거예요 is a plan for later." },
          { ko: "바다를 봤어요.", right: false, feedback: "봤어요 is the past: \"I saw\". A plan for later: 바다를 볼 거예요." },
          { ko: "바다를 볼까요?", right: false, feedback: "That suggests it to him (\"shall we see the sea?\"). To say your own plan: 바다를 볼 거예요." },
        ],
      },
      {
        ko: "왜 부산에 가고 싶어요?",
        gloss: "Why do you want to go to Busan?",
        ask: "Because the sea is pretty.",
        options: [
          { ko: "바다가 예쁘지만 가고 싶어요.", right: false, feedback: "지만 means but: \"the sea is pretty, but I want to go\". A reason takes -아서/어서: 바다가 예뻐서 가고 싶어요." },
          { ko: "바다가 예쁘면 가고 싶어요.", right: false, feedback: "-(으)면 means if: \"if the sea is pretty\". A reason takes -아서/어서: 바다가 예뻐서 가고 싶어요." },
          { ko: "바다가 예뻐서 가고 싶어요.", right: true, feedback: "Yes: 예뻐서, \"because it is pretty\". -아서/어서 gives the reason; 가고 싶어요 = I want to go." },
        ],
      },
    ],
    closing: { ko: "좋아요! 토요일에 만나요.", gloss: "Great! See you on Saturday." },
  },
  hana: {
    name: "Hana",
    role: "Neighbour",
    focus: "Asking and helping: -(으)ㄹ 수 있어요 for what you can do, -아/어 주세요 to ask a favour.",
    turns: [
      {
        ko: "안녕하세요! 한국어 할 수 있어요?",
        gloss: "Hello! Can you speak Korean?",
        ask: "You can, a little (조금).",
        options: [
          { ko: "아니요, 할 수 있어요.", right: false, feedback: "아니요 means no, and then it says you can. Yes is 네: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 없어요.", right: false, feedback: "할 수 없어요 means \"I can't\". You can: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 있어요.", right: true, feedback: "Yes: 할 수 있어요, \"I can\". 할 수 없어요 = I can't." },
        ],
      },
      {
        ko: "와, 잘해요! 이 가방 좀 들어 주세요.",
        gloss: "Wow, you're good! Please hold this bag for me.",
        ask: "Her bag is heavy. Say you will help her.",
        options: [
          { ko: "네, 도와 드릴게요.", right: true, feedback: "Yes: 도와 드릴게요, \"I will help you\". 들어 주세요: -아/어 주세요 asks a favour." },
          { ko: "네, 도와주세요.", right: false, feedback: "도와주세요 asks her to help you. You are the one helping: 네, 도와 드릴게요." },
          { ko: "네, 들어 주세요.", right: false, feedback: "That asks her to hold it. She asked you: 네, 도와 드릴게요." },
        ],
      },
      {
        ko: "고마워요! 시장에 자주 와요? 저는 매일 와요. 여기 과일이 정말 싸고 맛있어요!",
        gloss: "…",
        ask: "That was too fast. Ask her to speak slowly.",
        options: [
          { ko: "빨리 말해 주세요.", right: false, feedback: "빨리 means fast: she would speed up! Slowly is 천천히: 천천히 말해 주세요." },
          { ko: "천천히 말해 주세요.", right: true, feedback: "Yes: 천천히 말해 주세요, \"please speak slowly\". A sentence every learner needs." },
          { ko: "천천히 말할 수 있어요.", right: false, feedback: "That says \"I can speak slowly\". To ask her: 천천히 말해 주세요." },
        ],
      },
    ],
    closing: { ko: "아, 미안해요! 천천히 말할게요. 반가워요!", gloss: "Oh, sorry! I'll speak slowly. Nice to meet you!" },
  },
};

const AR: Record<ChatId, Chat> = {
  jihoon: {
    name: "جي هون",
    role: "أحد المارّة",
    focus: "الأماكن: 에 للمكان المقصود، و에 있어요 لمكان وجود الشيء.",
    turns: [
      {
        ko: "안녕하세요! 어디 가요?",
        gloss: "مرحبًا! إلى أين الوجهة؟",
        ask: "الوجهة هي السوق (시장).",
        options: [
          { ko: "시장에 가요.", right: true, feedback: "نعم: 시장에 가요. المكان المقصود يأخذ 에." },
          { ko: "시장이에요.", right: false, feedback: "시장이에요 تعني «هذا سوق». للوجهة: 시장에 가요." },
          { ko: "시장에서 가요.", right: false, feedback: "에서 للمكان الذي يحدث فيه الفعل أو مكان الانطلاق. أما الوجهة فتأخذ 에: 시장에 가요." },
        ],
      },
      {
        ko: "아, 시장! 여기가 시장이에요.",
        gloss: "آه، السوق! هذا هو السوق.",
        ask: "المطلوب محل الكتب (책 가게). السؤال عن مكانه.",
        options: [
          { ko: "책 가게가 뭐예요?", right: false, feedback: "뭐예요 تسأل «ما هذا؟». للسؤال عن المكان: 책 가게가 어디에 있어요?" },
          { ko: "책 가게가 어디에 있어요?", right: true, feedback: "نعم: 어디에 있어요? «أين يوجد؟». 어디 = أين، و있어요 = يوجد." },
          { ko: "책 가게에 가요?", right: false, feedback: "هذا سؤال له: «هل تذهب إلى محل الكتب؟». للسؤال عن المكان: 책 가게가 어디에 있어요?" },
        ],
      },
      {
        ko: "저쪽으로 쭉 가세요. 오른쪽에 있어요.",
        gloss: "السير مباشرةً من هناك. المحل على اليمين.",
        ask: "كان لطيفًا. حان وقت الشكر.",
        options: [
          { ko: "미안합니다.", right: false, feedback: "미안합니다 تعني «آسف». للشكر: 감사합니다." },
          { ko: "안녕하세요.", right: false, feedback: "안녕하세요 تحية. للشكر: 감사합니다." },
          { ko: "감사합니다!", right: true, feedback: "نعم: 감사합니다! 오른쪽 = اليمين، 왼쪽 = اليسار، 쭉 = مباشرةً." },
        ],
      },
    ],
    closing: { ko: "아니에요. 또 만나요!", gloss: "لا شكر على واجب. إلى اللقاء!" },
  },
  park: {
    name: "الآنسة بارك",
    role: "بائعة في السوق",
    focus: "التسوّق: نوعان من الأرقام. 한، 두، 세 لعدّ الأشياء، و천، 이천 للأسعار.",
    turns: [
      {
        ko: "어서 오세요! 뭐 드릴까요?",
        gloss: "أهلًا وسهلًا! ماذا أقدّم لكم؟",
        ask: "المطلوب تفاحتان (사과).",
        options: [
          { ko: "사과 이 개 주세요.", right: false, feedback: "الأشياء تُعدّ بالأرقام الكورية 한، 두، 세 وليس 일، 이، 삼: 사과 두 개 주세요." },
          { ko: "사과 두 개 주세요.", right: true, feedback: "نعم: 사과 두 개 주세요. 개 لعدّ الأشياء، و둘 تصبح 두 قبلها." },
          { ko: "사과 두 명 주세요.", right: false, feedback: "명 لعدّ الأشخاص! للأشياء نستعمل 개: 사과 두 개 주세요." },
        ],
      },
      {
        ko: "네, 여기 있어요.",
        gloss: "نعم، تفضّلوا.",
        ask: "السؤال عن السعر.",
        options: [
          { ko: "얼마예요?", right: true, feedback: "نعم: 얼마예요? «بكم هذا؟»" },
          { ko: "몇 시예요?", right: false, feedback: "몇 시예요 سؤال عن الساعة. للسعر: 얼마예요?" },
          { ko: "어디예요?", right: false, feedback: "어디예요 تسأل «أين؟». للسعر: 얼마예요?" },
        ],
      },
      {
        ko: "이천 원이에요.",
        gloss: "…",
        ask: "كم المبلغ المطلوب دفعه؟",
        options: [
          { ko: "200원", right: false, feedback: "200 هي 이백. قالت 이천: 이 (2) + 천 (1,000) = 2,000 وون." },
          { ko: "2,000원", right: true, feedback: "نعم: 이천 원 = 2,000 وون. الأسعار تستعمل 일، 이، 삼 مع 백 (100) و천 (1,000) و만 (10,000)." },
          { ko: "20,000원", right: false, feedback: "20,000 هي 이만. قالت 이천: 이 (2) + 천 (1,000) = 2,000 وون." },
        ],
      },
    ],
    closing: { ko: "감사합니다! 또 오세요.", gloss: "شكرًا! ننتظر زيارتكم مرة أخرى." },
  },
  kim: {
    name: "السيد كيم",
    role: "موظف الاستعلامات",
    focus: "الأسلوب الرسمي: -ㅂ니다 / -습니다، و-ㅂ니까? للسؤال.",
    turns: [
      {
        ko: "안녕하십니까?",
        gloss: "طاب يومكم. (أسلوب رسمي)",
        ask: "هو في عمله ويتكلم بأسلوب رسمي. التحية بالأسلوب نفسه.",
        options: [
          { ko: "안녕!", right: false, feedback: "안녕 للأصدقاء المقرّبين والأطفال. لموظف في مكتبه: 안녕하십니까?" },
          { ko: "안녕히 가세요.", right: false, feedback: "안녕히 가세요 وداع لمن يغادر. التحية الرسمية: 안녕하십니까?" },
          { ko: "안녕하십니까?", right: true, feedback: "نعم: 안녕하십니까? التحية الرسمية، تُسمع في المكاتب ونشرات الأخبار والإعلانات." },
        ],
      },
      {
        ko: "학생입니까?",
        gloss: "هل أنتم طلاب؟",
        ask: "نعم. الإجابة بأسلوبه الرسمي.",
        options: [
          { ko: "네, 학생입니다.", right: true, feedback: "نعم: 학생입니다. 입니다 هي الصيغة الرسمية من 이에요، وصيغة السؤال 입니까?" },
          { ko: "네, 학생이에요.", right: false, feedback: "جملة صحيحة ومهذّبة، لكنها بالأسلوب اليومي. لمجاراة أسلوبه الرسمي: 네, 학생입니다." },
          { ko: "아니요, 학생입니다.", right: false, feedback: "아니요 تعني «لا»، ثم تقول الجملة إنك طالب. «نعم» هي 네: 네, 학생입니다." },
        ],
      },
      {
        ko: "시장 지도는 여기 있습니다.",
        gloss: "خريطة السوق هنا.",
        ask: "الشكر بأسلوب رسمي.",
        options: [
          { ko: "고마워.", right: false, feedback: "고마워 للأصدقاء المقرّبين. الشكر الرسمي: 감사합니다." },
          { ko: "감사합니다.", right: true, feedback: "نعم: 감사합니다. تنتهي بـ -ㅂ니다 أيضًا: إنه الأسلوب الرسمي المعروف من قبل." },
          { ko: "죄송합니다.", right: false, feedback: "죄송합니다 اعتذار رسمي. للشكر: 감사합니다." },
        ],
      },
    ],
    closing: { ko: "좋은 하루 되십시오.", gloss: "يومًا سعيدًا." },
  },
  yuna: {
    name: "يونا",
    role: "باريستا المقهى",
    focus: "الطلب المهذّب: 주세요 عند الطلب، و-(으)세요 حين يُطلب منك شيء.",
    turns: [
      {
        ko: "안녕하세요! 주문하세요.",
        gloss: "مرحبًا! تفضّلوا بالطلب.",
        ask: "المطلوب فنجان قهوة واحد (커피).",
        options: [
          { ko: "커피 한 개 주세요.", right: false, feedback: "المشروبات في فنجان أو كوب تُعدّ بـ 잔 وليس 개: 커피 한 잔 주세요." },
          { ko: "커피 한 잔 주세요.", right: true, feedback: "نعم: 커피 한 잔 주세요. 잔 لعدّ الفناجين والأكواب، و주세요 = من فضلك أعطني." },
          { ko: "커피 주세요 한 잔.", right: false, feedback: "قريب! في الكورية تأتي 주세요 في آخر الجملة: 커피 한 잔 주세요." },
        ],
      },
      {
        ko: "잠깐만 기다리세요.",
        gloss: "لحظة من فضلكم.",
        ask: "تطلب الانتظار. الردّ بالموافقة.",
        options: [
          { ko: "네, 알겠어요.", right: true, feedback: "نعم: 네, 알겠어요 «حاضر». 기다리세요 = انتظر من فضلك: -세요 طلب مهذّب موجَّه إليك." },
          { ko: "아니요, 괜찮아요.", right: false, feedback: "هذه تعني «لا، شكرًا»: هكذا تضيع القهوة! للموافقة: 네, 알겠어요." },
          { ko: "네, 기다리세요.", right: false, feedback: "هذه تطلب منها هي الانتظار. المنتظر هو أنت: 네, 알겠어요." },
        ],
      },
      {
        ko: "커피 나왔어요. 맛있게 드세요!",
        gloss: "القهوة جاهزة. بالهناء والشفاء!",
        ask: "ماذا يُقال قبل الشرب؟",
        options: [
          { ko: "맛있게 드세요!", right: false, feedback: "هذا ما يقوله من يقدّم الطلب. والردّ: 잘 마시겠습니다!" },
          { ko: "잘 먹었습니다.", right: false, feedback: "잘 먹었습니다 تُقال بعد الانتهاء. قبل الشرب: 잘 마시겠습니다!" },
          { ko: "잘 마시겠습니다!", right: true, feedback: "نعم: 잘 마시겠습니다! «سأشربه بامتنان»: شكر يُقال قبل الشرب. وللطعام: 잘 먹겠습니다!" },
        ],
      },
    ],
    closing: { ko: "또 오세요! 카페에서 만나요.", gloss: "ننتظر زيارتكم! نلتقي في المقهى." },
  },
  seoyeon: {
    name: "سيو يون",
    role: "زميلة في الصف",
    focus: "الوقت والأيام: 시 للساعة (한، 두، 세)، و요일 لليوم، و내일 · 오늘 · 어제.",
    turns: [
      {
        ko: "지금 몇 시예요?",
        gloss: "كم الساعة الآن؟",
        ask: "الهاتف يشير إلى 3:00.",
        options: [
          { ko: "삼 시예요.", right: false, feedback: "الساعات تستعمل الأرقام الكورية 한، 두، 세 وليس 일، 이، 삼: 세 시예요." },
          { ko: "세 시예요.", right: true, feedback: "نعم: 세 시예요. الساعات تأخذ 한، 두، 세…، والدقائق (분) تأخذ 일، 이، 삼." },
          { ko: "세 분이에요.", right: false, feedback: "분 تعني الدقائق: الجملة تقول «ثلاث دقائق». الساعة هي 시: 세 시예요." },
        ],
      },
      {
        ko: "오늘 무슨 요일이에요?",
        gloss: "ما اليوم؟",
        ask: "اليوم هو السبت.",
        options: [
          { ko: "일요일이에요.", right: false, feedback: "일요일 هو الأحد. السبت هو 토요일: 토요일이에요." },
          { ko: "오늘이에요.", right: false, feedback: "هذه تقول «إنه اليوم». اليوم المسؤول عنه: 토요일이에요." },
          { ko: "토요일이에요.", right: true, feedback: "نعم: 토요일이에요. 월 · 화 · 수 · 목 · 금 · 토 · 일، وبعد كلٍّ منها 요일." },
        ],
      },
      {
        ko: "내일 두 시에 만나요!",
        gloss: "نلتقي غدًا في الساعة الثانية!",
        ask: "الموافقة على موعدها.",
        options: [
          { ko: "네, 내일 만나요!", right: true, feedback: "نعم: 내일 = غدًا. 두 시에: وقت حدوث الشيء يأخذ 에." },
          { ko: "네, 어제 만나요!", right: false, feedback: "어제 تعني أمس! غدًا هي 내일: 네, 내일 만나요!" },
          { ko: "네, 지금 만나요!", right: false, feedback: "지금 تعني الآن، لكنها قالت غدًا: 네, 내일 만나요!" },
        ],
      },
    ],
    closing: { ko: "좋아요! 내일 봐요.", gloss: "رائع! إلى الغد." },
  },
  taeyang: {
    name: "تايانغ",
    role: "صديق جديد",
    focus: "الخطط: -(으)ㄹ까요? للاقتراح، و-(으)ㄹ 거예요 لما سيُفعل، و-아서/어서 للسبب.",
    turns: [
      {
        ko: "주말에 같이 부산에 갈까요?",
        gloss: "ما رأيك أن نذهب معًا إلى بوسان في عطلة نهاية الأسبوع؟",
        ask: "الفكرة تعجبك.",
        options: [
          { ko: "네, 갔어요.", right: false, feedback: "갔어요 صيغة الماضي: «ذهبتُ». لقبول الخطة: 네, 좋아요! 같이 가요." },
          { ko: "네, 좋아요! 같이 가요.", right: true, feedback: "نعم: 좋아요! 같이 가요. -(으)ㄹ까요? تقترح فعل شيء معًا: 갈까요? «ما رأيك أن نذهب؟»" },
          { ko: "부산이에요.", right: false, feedback: "هذه تقول «إنها بوسان». للقبول: 네, 좋아요! 같이 가요." },
        ],
      },
      {
        ko: "부산에서 뭐 할 거예요?",
        gloss: "ماذا ستفعل في بوسان؟",
        ask: "الخطة هي رؤية البحر (바다).",
        options: [
          { ko: "바다를 볼 거예요.", right: true, feedback: "نعم: 볼 거예요 «سأرى». -(으)ㄹ 거예요 خطة لوقت لاحق." },
          { ko: "바다를 봤어요.", right: false, feedback: "봤어요 صيغة الماضي: «رأيتُ». للخطة: 바다를 볼 거예요." },
          { ko: "바다를 볼까요?", right: false, feedback: "هذه اقتراح له («ما رأيك أن نرى البحر؟»). لذكر خطتك أنت: 바다를 볼 거예요." },
        ],
      },
      {
        ko: "왜 부산에 가고 싶어요?",
        gloss: "لماذا تريد الذهاب إلى بوسان؟",
        ask: "لأن البحر جميل.",
        options: [
          { ko: "바다가 예쁘지만 가고 싶어요.", right: false, feedback: "지만 تعني «لكن»: «البحر جميل، لكني أريد الذهاب». السبب يأخذ -아서/어서: 바다가 예뻐서 가고 싶어요." },
          { ko: "바다가 예쁘면 가고 싶어요.", right: false, feedback: "-(으)면 تعني «إذا»: «إذا كان البحر جميلًا». السبب يأخذ -아서/어서: 바다가 예뻐서 가고 싶어요." },
          { ko: "바다가 예뻐서 가고 싶어요.", right: true, feedback: "نعم: 예뻐서 «لأنه جميل». -아서/어서 تذكر السبب، و가고 싶어요 = أريد الذهاب." },
        ],
      },
    ],
    closing: { ko: "좋아요! 토요일에 만나요.", gloss: "رائع! نلتقي يوم السبت." },
  },
  hana: {
    name: "هَنا",
    role: "جارة",
    focus: "الطلب والمساعدة: -(으)ㄹ 수 있어요 للقدرة، و-아/어 주세요 لطلب خدمة.",
    turns: [
      {
        ko: "안녕하세요! 한국어 할 수 있어요?",
        gloss: "مرحبًا! هل تتكلم الكورية؟",
        ask: "نعم، قليلًا (조금).",
        options: [
          { ko: "아니요, 할 수 있어요.", right: false, feedback: "아니요 تعني «لا»، ثم تقول الجملة إنك تستطيع. «نعم» هي 네: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 없어요.", right: false, feedback: "할 수 없어요 تعني «لا أستطيع». وأنت تستطيع: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 있어요.", right: true, feedback: "نعم: 할 수 있어요 «أستطيع». و할 수 없어요 = لا أستطيع." },
        ],
      },
      {
        ko: "와, 잘해요! 이 가방 좀 들어 주세요.",
        gloss: "واو، ممتاز! هل يمكن حمل هذه الحقيبة عني؟",
        ask: "حقيبتها ثقيلة. الردّ بالاستعداد للمساعدة.",
        options: [
          { ko: "네, 도와 드릴게요.", right: true, feedback: "نعم: 도와 드릴게요 «سأساعدك». 들어 주세요: -아/어 주세요 لطلب خدمة." },
          { ko: "네, 도와주세요.", right: false, feedback: "도와주세요 تطلب منها هي المساعدة. المساعد هو أنت: 네, 도와 드릴게요." },
          { ko: "네, 들어 주세요.", right: false, feedback: "هذه تطلب منها هي حمل الحقيبة. هي التي طلبت منك: 네, 도와 드릴게요." },
        ],
      },
      {
        ko: "고마워요! 시장에 자주 와요? 저는 매일 와요. 여기 과일이 정말 싸고 맛있어요!",
        gloss: "…",
        ask: "كان الكلام سريعًا جدًا. الطلب منها أن تتكلم ببطء.",
        options: [
          { ko: "빨리 말해 주세요.", right: false, feedback: "빨리 تعني بسرعة: ستزيد سرعتها! ببطء هي 천천히: 천천히 말해 주세요." },
          { ko: "천천히 말해 주세요.", right: true, feedback: "نعم: 천천히 말해 주세요 «تكلّمي ببطء من فضلك». جملة يحتاجها كل متعلّم." },
          { ko: "천천히 말할 수 있어요.", right: false, feedback: "هذه تقول «أستطيع التكلم ببطء». للطلب منها: 천천히 말해 주세요." },
        ],
      },
    ],
    closing: { ko: "아, 미안해요! 천천히 말할게요. 반가워요!", gloss: "آه، آسفة! سأتكلم ببطء. سعدتُ بلقائك!" },
  },
};

export const CHATS: Record<WorldLang, Record<ChatId, Chat>> = { en: EN, ar: AR };
