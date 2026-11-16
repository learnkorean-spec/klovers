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
export type FriendId = "jihoon" | "park" | "kim" | "yuna" | "seoyeon" | "taeyang" | "hana";
/**
 * People of the later worlds who are not named in the canon (a student in the
 * café, the stall cook, the station attendant, two elders): the same kind of
 * conversation, opened by the line they already had, so each world on the
 * road has someone to talk with at its own level.
 */
export type RoleChatId = "gardener" | "neighbour" | "painter" | "cafe" | "cook" | "attendant" | "grandpa" | "grandma";
export type ChatId = FriendId | RoleChatId;

/** In the order Book 1's classes introduce them. */
export const CHAT_ORDER: readonly FriendId[] = ["jihoon", "park", "kim", "yuna", "seoyeon", "taeyang", "hana"];

/** Who speaks: the person in config/npcs.ts and their id in the canon. */
export const CHAT_PEOPLE: Record<FriendId, { npc: string; canon: string; nameKo: string }> = {
  jihoon: { npc: "m-jihoon", canon: "classmate-jihoon", nameKo: "지훈" },
  park: { npc: "m-park", canon: "market-vendor-park", nameKo: "박 아주머니" },
  kim: { npc: "m-kim", canon: "info-desk-clerk-kim", nameKo: "김 선생님" },
  yuna: { npc: "m-yuna", canon: "cafe-barista-yuna", nameKo: "유나" },
  seoyeon: { npc: "m-seoyeon", canon: "classmate-seoyeon", nameKo: "서연" },
  taeyang: { npc: "m-taeyang", canon: "new-friend-taeyang", nameKo: "태양" },
  hana: { npc: "m-hana", canon: "neighbor-hana", nameKo: "하나" },
};

/**
 * The later worlds' people (canon supportingKoreanCast.laterWorlds, named by
 * Re on 16 Nov 2026): who speaks, and the recording of their opening line
 * (systems/voice.ts).
 */
export const ROLE_CHATS: Record<RoleChatId, { npc: string; canon: string; nameKo: string; voice?: "auntie" | "cafeA" | "cook" | "attendant" | "grandpa" | "nalssi"; male: boolean }> = {
  // The first steps (canon supportingKoreanCast.firstSteps): the two places every visitor can enter.
  gardener: { npc: "c-gardener", canon: "courtyard-gardener-baek", nameKo: "백 할아버지", male: true },
  neighbour: { npc: "v-well-1", canon: "village-neighbour-yoon", nameKo: "윤 아주머니", voice: "auntie", male: false },
  painter: { npc: "hv-x1", canon: "village-sign-painter-seo", nameKo: "서 아저씨", male: true },
  cafe: { npc: "k-table-1", canon: "cafe-regular-junho", nameKo: "준호", voice: "cafeA", male: true },
  cook: { npc: "c-cook", canon: "stall-cook-choi", nameKo: "최 아주머니", voice: "cook", male: false },
  attendant: { npc: "s-attendant", canon: "station-attendant-donghyun", nameKo: "동현", voice: "attendant", male: true },
  grandpa: { npc: "a-grandpa", canon: "alley-grandfather-oh", nameKo: "오 할아버지", voice: "grandpa", male: true },
  grandma: { npc: "n-grandma", canon: "namsan-grandmother-han", nameKo: "한 할머니", voice: "nalssi", male: false },
};
export const ROLE_CHAT_ORDER = Object.keys(ROLE_CHATS) as RoleChatId[];
export const isFriend = (id: ChatId): id is FriendId => id in CHAT_PEOPLE;
/** The person who speaks in a conversation. */
/** Their Korean name, shown once they are a friend. */
export const chatNameKo = (id: ChatId): string => (isFriend(id) ? CHAT_PEOPLE[id].nameKo : ROLE_CHATS[id].nameKo);
export const chatNpc = (id: ChatId): string => (isFriend(id) ? CHAT_PEOPLE[id].npc : ROLE_CHATS[id].npc);
const MEN: readonly ChatId[] = ["jihoon", "kim", "taeyang"];
export const chatIsMan = (id: ChatId): boolean => (isFriend(id) ? MEN.includes(id) : ROLE_CHATS[id].male);

/** What is saved in worldState.met once a conversation is finished. */
export const chatMetKey = (id: ChatId): string => `chat-${id}`;
/** Everyone there is to befriend, along the road. */
export const ALL_CHATS: readonly ChatId[] = [...(["gardener", "neighbour", "painter"] as const), ...CHAT_ORDER, ...(["cafe", "cook", "attendant", "grandpa", "grandma"] as const)];
export const chatsMet = (met: readonly string[]): number => ALL_CHATS.filter((id) => met.includes(chatMetKey(id))).length;

export interface ChatOption {
  /** The Korean reply on the button. */
  ko: string;
  /** How it sounds, in Latin letters: only in the first places, where the learner cannot read Hangul yet. */
  roman?: string;
  right: boolean;
  /** Why it fits, or what it really says and what to say instead. */
  feedback: string;
  /**
   * What the person says back to this reply. A turn may have more than one
   * reply that fits (a yes and a no, say); each then gets its own answer, so
   * the conversation goes the way the learner took it.
   */
  reply?: { ko: string; roman?: string; gloss: string };
}

export interface ChatTurn {
  /** The person's line. */
  ko: string;
  roman?: string;
  gloss: string;
  /** Something they hold up to be read (a freshly painted sign). */
  show?: string;
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
  closing: { ko: string; roman?: string; gloss: string };
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
        ask: "He was kind. Thank him: there are two ways.",
        options: [
          { ko: "미안합니다.", right: false, feedback: "미안합니다 means \"I'm sorry\". To thank someone: 감사합니다." },
          { ko: "고맙습니다!", right: true, feedback: "Yes: 고맙습니다 is a thank-you too, a little warmer than 감사합니다. Both are polite.", reply: { ko: "별말씀을요!", gloss: "Don't mention it!" } },
          { ko: "감사합니다!", right: true, feedback: "Yes: 감사합니다! 오른쪽 = right, 왼쪽 = left, 쭉 = straight on.", reply: { ko: "천만에요!", gloss: "You're welcome!" } },
        ],
      },
    ],
    closing: { ko: "또 만나요!", gloss: "See you again!" },
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
        ask: "Answer truly, in his formal style: a student (학생) or an office worker (회사원).",
        options: [
          { ko: "네, 학생입니다.", right: true, feedback: "Yes: 학생입니다. 입니다 is the formal 이에요; the question form is 입니까?", reply: { ko: "아, 학생이십니까. 환영합니다.", gloss: "Ah, a student. Welcome." } },
          { ko: "네, 학생이에요.", right: false, feedback: "Good Korean, and polite, but it is the everyday style. To match his formal one: 네, 학생입니다." },
          { ko: "아니요, 회사원입니다.", right: true, feedback: "Yes: 아니요 = no, 회사원입니다 = I am an office worker. Formal, like him.", reply: { ko: "아, 회사원이십니까. 환영합니다.", gloss: "Ah, an office worker. Welcome." } },
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
        ask: "Agree to her plan, or say you are busy (바빠요).",
        options: [
          { ko: "네, 내일 만나요!", right: true, feedback: "Yes: 내일 = tomorrow. 두 시에: the time something happens takes 에.", reply: { ko: "좋아요! 두 시예요, 잊지 마세요.", gloss: "Great! Two o'clock, don't forget." } },
          { ko: "네, 어제 만나요!", right: false, feedback: "어제 is yesterday! Tomorrow is 내일: 네, 내일 만나요!" },
          { ko: "미안해요, 내일은 바빠요.", right: true, feedback: "Yes: 미안해요 = sorry, 바빠요 = I am busy. A polite way to say no.", reply: { ko: "괜찮아요. 그럼 다음에 만나요!", gloss: "That's fine. Let's meet next time, then!" } },
        ],
      },
    ],
    closing: { ko: "그럼 또 봐요!", gloss: "See you again, then!" },
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
        ask: "Answer truly: a little (조금), or not well (잘 못해요).",
        options: [
          { ko: "아니요, 잘 못해요.", right: true, feedback: "Yes: 잘 못해요 = I can't do it well. A modest, honest answer.", reply: { ko: "아니에요, 지금 잘하고 있어요!", gloss: "Not at all, you are doing well right now!" } },
          { ko: "네, 조금 할 수 없어요.", right: false, feedback: "할 수 없어요 means \"I can't\". You can: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 있어요.", right: true, feedback: "Yes: 할 수 있어요, \"I can\". 할 수 없어요 = I can't.", reply: { ko: "와, 대단해요!", gloss: "Wow, that's great!" } },
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
  gardener: {
    name: "Grandpa Baek",
    role: "Gardener",
    focus: "The first three: 안녕하세요 (hello), 네 / 아니요 (yes / no), and the two goodbyes: 안녕히 계세요 to someone staying, 안녕히 가세요 to someone leaving.",
    turns: [
      {
        ko: "안녕하세요!",
        roman: "annyeonghaseyo!",
        gloss: "Hello!",
        ask: "An elder greets you. Greet him back.",
        options: [
          { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: true, feedback: "Yes: 안녕하세요! The polite hello, right for anyone." },
          { ko: "안녕!", roman: "annyeong!", right: false, feedback: "안녕 is only for close friends and children. To an elder: 안녕하세요!" },
          { ko: "감사합니다!", roman: "gamsahamnida!", right: false, feedback: "감사합니다 means thank you. Hello is 안녕하세요!" },
        ],
      },
      {
        ko: "꽃 좋아해요?",
        roman: "kkot joahaeyo?",
        gloss: "Do you like flowers?",
        ask: "Answer truly: yes or no are both fine.",
        options: [
          { ko: "네, 좋아해요.", roman: "ne, joahaeyo.", right: true, feedback: "네 = yes. 좋아해요 = (I) like it.", reply: { ko: "저도요! 꽃은 예뻐요.", roman: "jeodoyo! kkocheun yeppeoyo.", gloss: "Me too! Flowers are pretty." } },
          { ko: "아니요.", roman: "aniyo.", right: true, feedback: "아니요 = no. Said gently, it is perfectly polite.", reply: { ko: "괜찮아요. 나무도 있어요!", roman: "gwaenchanayo. namudo isseoyo!", gloss: "That's all right. There are trees too!" } },
          { ko: "안녕히 가세요.", roman: "annyeonghi gaseyo.", right: false, feedback: "That is a goodbye. Answer with 네 (yes) or 아니요 (no): 네, 좋아해요." },
        ],
      },
      {
        ko: "또 오세요!",
        roman: "tto oseyo!",
        gloss: "Come again!",
        ask: "You are leaving; he stays with his flowers. Say goodbye.",
        options: [
          { ko: "안녕히 가세요!", roman: "annyeonghi gaseyo!", right: false, feedback: "가세요 is \"go well\": said to the one who leaves. He is staying: 안녕히 계세요!" },
          { ko: "안녕히 계세요!", roman: "annyeonghi gyeseyo!", right: true, feedback: "Yes: 안녕히 계세요! \"Stay well\": said to the one who stays behind." },
          { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: false, feedback: "안녕하세요 is hello. Leaving someone who stays: 안녕히 계세요!" },
        ],
      },
    ],
    closing: { ko: "네, 안녕히 가세요!", roman: "ne, annyeonghi gaseyo!", gloss: "Yes, goodbye! (He says 가세요, because you are the one leaving.)" },
  },
  neighbour: {
    name: "Mrs. Yoon",
    role: "Neighbour",
    focus: "Saying who you are: 저는 …이에요, and 공부해요 (study). Then a first word read from a sign.",
    turns: [
      {
        ko: "안녕하세요!",
        roman: "annyeonghaseyo!",
        gloss: "Hello!",
        ask: "Greet her and say you are a student (학생, haksaeng).",
        options: [
          { ko: "안녕하세요! 저는 학생이에요.", roman: "annyeonghaseyo! jeoneun haksaeng-ieyo.", right: true, feedback: "Yes: 저는 학생이에요. 저는 = I, 이에요 = am." },
          { ko: "감사합니다! 저는 학생이에요.", roman: "gamsahamnida! jeoneun haksaeng-ieyo.", right: false, feedback: "감사합니다 is thank you. Start with hello: 안녕하세요! 저는 학생이에요." },
          { ko: "안녕히 가세요! 저는 학생이에요.", roman: "annyeonghi gaseyo! jeoneun haksaeng-ieyo.", right: false, feedback: "안녕히 가세요 is goodbye. Start with hello: 안녕하세요! 저는 학생이에요." },
        ],
      },
      {
        ko: "한국어 공부해요?",
        roman: "hangugeo gongbuhaeyo?",
        gloss: "Are you studying Korean?",
        ask: "You are.",
        options: [
          { ko: "네, 한국어예요.", roman: "ne, hangugeo-yeyo.", right: false, feedback: "That says \"yes, it is Korean\". To say you study it: 네, 한국어 공부해요." },
          { ko: "네, 한국어 공부해요.", roman: "ne, hangugeo gongbuhaeyo.", right: true, feedback: "Yes: 공부해요 = (I) study. 한국어 = the Korean language.", reply: { ko: "와, 대단해요!", roman: "wa, daedanhaeyo!", gloss: "Wow, that's great!" } },
          { ko: "아니요, 한국어 공부해요.", roman: "aniyo, hangugeo gongbuhaeyo.", right: false, feedback: "아니요 is no, and then it says you study it. Yes is 네: 네, 한국어 공부해요." },
        ],
      },
      {
        ko: "이거 읽을 수 있어요?",
        roman: "igeo ilgeul su isseoyo?",
        gloss: "Can you read this?",
        show: "나무",
        ask: "She points at a sign. Read it.",
        options: [
          { ko: "ma-nu", right: false, feedback: "The first letter is ㄴ (n), the second ㅁ (m): na-mu. 나무 = a tree." },
          { ko: "na-mu", right: true, feedback: "Yes: ㄴ + ㅏ = na, ㅁ + ㅜ = mu. 나무 = a tree." },
          { ko: "na-mo", right: false, feedback: "ㅜ is u (the short stroke points down); ㅗ is o. So: na-mu. 나무 = a tree." },
        ],
      },
    ],
    closing: { ko: "맞아요! 잘했어요!", roman: "majayo! jalhaesseoyo!", gloss: "That's right! Well done!" },
  },
  painter: {
    name: "Mr. Seo",
    role: "Sign painter",
    focus: "Reading: one consonant and one vowel make a syllable. ㄱ ㄴ ㄷ ㅁ with ㅏ ㅗ ㅜ.",
    turns: [
      {
        ko: "안녕하세요! 저는 간판을 그려요.",
        roman: "annyeonghaseyo! jeoneun ganpaneul geuryeoyo.",
        gloss: "Hello! I paint the signs.",
        show: "가",
        ask: "He holds up a fresh sign. Read it.",
        options: [
          { ko: "na", right: false, feedback: "ㄴ is n. This first letter is ㄱ (g): ga." },
          { ko: "da", right: false, feedback: "ㄷ is d. This first letter is ㄱ (g): ga." },
          { ko: "ga", right: true, feedback: "Yes: ㄱ (g) + ㅏ (a) = 가, ga. The consonant on the left, the vowel on the right." },
        ],
      },
      {
        ko: "이것은요?",
        roman: "igeoseunyo?",
        gloss: "And this one?",
        show: "노",
        ask: "This vowel sits underneath. Read it.",
        options: [
          { ko: "no", right: true, feedback: "Yes: ㄴ (n) + ㅗ (o) = 노, no. ㅗ and ㅜ sit under the consonant." },
          { ko: "nu", right: false, feedback: "ㅜ (stroke pointing down) is u. Here the stroke points up: ㅗ, o. So: no." },
          { ko: "mo", right: false, feedback: "ㅁ (a box) is m. This letter is ㄴ (n): no." },
        ],
      },
      {
        ko: "마지막이에요!",
        roman: "majimagieyo!",
        gloss: "The last one!",
        show: "모두",
        ask: "Two syllables make a word. Read it.",
        options: [
          { ko: "mu-do", right: false, feedback: "The vowels are the other way round: ㅗ (o) first, then ㅜ (u). mo-du." },
          { ko: "mo-du", right: true, feedback: "Yes: ㅁ + ㅗ = mo, ㄷ + ㅜ = du. 모두 = everyone, all." },
          { ko: "no-du", right: false, feedback: "The first letter is ㅁ (m), the box: mo-du." },
        ],
      },
    ],
    closing: { ko: "와, 다 읽었어요! 모두 잘했어요.", roman: "wa, da ilgeosseoyo! modu jalhaesseoyo.", gloss: "Wow, you read them all! All well done." },
  },
  cafe: {
    name: "Junho",
    role: "Student",
    focus: "Likes and drinks: 좋아해요, 마셔요 (not 먹어요), and 에서 왔어요 for where you are from.",
    turns: [
      {
        ko: "커피 좋아해요?",
        gloss: "Do you like coffee?",
        ask: "Answer truly: you like it, or you prefer tea (차).",
        options: [
          { ko: "네, 좋아해요.", right: true, feedback: "Yes: 네, 좋아해요. 좋아해요 = (I) like it.", reply: { ko: "저도요! 여기 커피가 맛있어요.", gloss: "Me too! The coffee here is good." } },
          { ko: "아니요, 좋아해요.", right: false, feedback: "아니요 means no, and then it says you like it. Yes is 네: 네, 좋아해요." },
          { ko: "아니요, 차를 좋아해요.", right: true, feedback: "Yes: 차 = tea. 차를 좋아해요 = I like tea.", reply: { ko: "아, 그래요? 여기 녹차도 맛있어요.", gloss: "Oh, really? The green tea here is good too." } },
        ],
      },
      {
        ko: "지금 뭐 마셔요?",
        gloss: "What are you drinking now?",
        ask: "You have a green tea (녹차).",
        options: [
          { ko: "녹차를 먹어요.", right: false, feedback: "먹어요 is for food. Drinks take 마셔요: 녹차를 마셔요." },
          { ko: "녹차가 마셔요.", right: false, feedback: "가 would make the tea the one drinking! What you drink takes 를: 녹차를 마셔요." },
          { ko: "녹차를 마셔요.", right: true, feedback: "Yes: 녹차를 마셔요. 를 marks what you drink; 마셔요 = drink." },
        ],
      },
      {
        ko: "어느 나라에서 왔어요?",
        gloss: "Which country are you from?",
        ask: "You are from Egypt (이집트).",
        options: [
          { ko: "이집트에 왔어요.", right: false, feedback: "에 왔어요 says \"I came to Egypt\". Where you come from takes 에서: 이집트에서 왔어요." },
          { ko: "이집트에서 왔어요.", right: true, feedback: "Yes: 이집트에서 왔어요. Country + 에서 왔어요 = I am from…" },
          { ko: "이집트에서 가요.", right: false, feedback: "That says \"I am going from Egypt\". For where you are from: 이집트에서 왔어요." },
        ],
      },
    ],
    closing: { ko: "와, 반가워요! 한국어 잘하네요.", gloss: "Wow, nice to meet you! Your Korean is good." },
  },
  cook: {
    name: "Mrs. Choi",
    role: "Stall cook",
    focus: "At the table: 잘 먹겠습니다 before, 맛있어요 / 매워요 while eating, 배불러요 when you have had enough.",
    turns: [
      {
        ko: "맛있게 드세요!",
        gloss: "Enjoy your food!",
        ask: "The dish is in front of you. What do you say before eating?",
        options: [
          { ko: "잘 먹었습니다.", right: false, feedback: "잘 먹었습니다 is said after the meal. Before it: 잘 먹겠습니다!" },
          { ko: "잘 먹겠습니다!", right: true, feedback: "Yes: 잘 먹겠습니다! \"I will eat well\": thanks to whoever made the food." },
          { ko: "맛있게 드세요!", right: false, feedback: "That is what the cook says to you. Your answer: 잘 먹겠습니다!" },
        ],
      },
      {
        ko: "맛이 어때요?",
        gloss: "How does it taste?",
        ask: "Say what you think: delicious, or a little spicy (매워요) but good.",
        options: [
          { ko: "조금 매워요. 하지만 맛있어요!", right: true, feedback: "Yes: 매워요 = spicy, 하지만 = but, 맛있어요 = delicious.", reply: { ko: "다행이에요! 물도 드세요.", gloss: "I'm glad! Have some water too." } },
          { ko: "조금 매워요. 그래서 맛없어요.", right: false, feedback: "그래서 맛없어요 says \"so it's not tasty\": hard on a cook! You like it: 조금 매워요. 하지만 맛있어요!" },
          { ko: "정말 맛있어요!", right: true, feedback: "Yes: 정말 = really, 맛있어요 = delicious. The words every cook hopes for.", reply: { ko: "고마워요! 많이 드세요.", gloss: "Thank you! Eat plenty." } },
        ],
      },
      {
        ko: "더 드릴까요?",
        gloss: "Shall I give you some more?",
        ask: "You are full. Refuse politely.",
        options: [
          { ko: "네, 배불러요.", right: false, feedback: "네 accepts more, then says you are full. To refuse kindly: 아니요, 괜찮아요. 배불러요." },
          { ko: "아니요, 배고파요.", right: false, feedback: "배고파요 means \"I'm hungry\": then you would want more! Full is 배불러요: 아니요, 괜찮아요. 배불러요." },
          { ko: "아니요, 괜찮아요. 배불러요.", right: true, feedback: "Yes: 괜찮아요 = no thank you, I'm fine; 배불러요 = I'm full." },
        ],
      },
    ],
    closing: { ko: "네, 또 오세요!", gloss: "All right, come again!" },
  },
  attendant: {
    name: "Donghyun",
    role: "Station attendant",
    focus: "The subway: 까지 for how far, 이호선 for Line 2, 세 정거장 for three stops, 있어요 / 없어요.",
    turns: [
      {
        ko: "어디까지 가세요?",
        gloss: "How far are you going?",
        ask: "You are going to Seoul Station (서울역).",
        options: [
          { ko: "서울역이에요.", right: false, feedback: "That says \"it is Seoul Station\". How far you go takes 까지: 서울역까지요." },
          { ko: "서울역에서요.", right: false, feedback: "에서 is from: \"from Seoul Station\". As far as: 서울역까지요." },
          { ko: "서울역까지요.", right: true, feedback: "Yes: 서울역까지요. 까지 = as far as; the short 요 keeps it polite." },
        ],
      },
      {
        ko: "이호선을 타세요. 세 정거장이에요.",
        gloss: "…",
        ask: "How many stops is it?",
        options: [
          { ko: "2", right: false, feedback: "이 (2) is the line: 이호선 = Line 2. The stops are 세 정거장: three." },
          { ko: "3", right: true, feedback: "Yes: 세 정거장 = three stops, counted 한, 두, 세. Line names use 일, 이, 삼: 이호선 = Line 2." },
          { ko: "4", right: false, feedback: "Four would be 네 정거장. He said 세 정거장: three." },
        ],
      },
      {
        ko: "교통카드 있어요?",
        gloss: "Do you have a transit card?",
        ask: "Answer truly: you have one (있어요) or you don't (없어요).",
        options: [
          { ko: "아니요, 없어요.", right: true, feedback: "Yes: 없어요 = I don't have one. 있어요 = I have one.", reply: { ko: "그럼 저기에서 표를 사세요.", gloss: "Then buy a ticket over there." } },
          { ko: "네, 있어요.", right: true, feedback: "Yes: 있어요 = I have one. 없어요 = I don't.", reply: { ko: "좋아요. 그럼 바로 타세요!", gloss: "Good. Then go straight on board!" } },
          { ko: "네, 없어요.", right: false, feedback: "네 says yes, 없어요 says you have none. To a plain question, answer: 아니요, 없어요." },
        ],
      },
    ],
    closing: { ko: "안녕히 가세요!", gloss: "Goodbye!" },
  },
  grandpa: {
    name: "Grandpa Oh",
    role: "Grandfather on the bench",
    focus: "Small talk with an elder: 에서 왔어요, 제일 좋아해요, and the modest answer to praise.",
    turns: [
      {
        ko: "어디서 왔어요?",
        gloss: "Where are you from?",
        ask: "You are from Egypt (이집트).",
        options: [
          { ko: "이집트에서 왔어요.", right: true, feedback: "Yes: 이집트에서 왔어요. Country + 에서 왔어요." },
          { ko: "이집트에 왔어요.", right: false, feedback: "에 왔어요 says \"I came to Egypt\". From takes 에서: 이집트에서 왔어요." },
          { ko: "이집트에 가요.", right: false, feedback: "That says \"I am going to Egypt\". Where you are from: 이집트에서 왔어요." },
        ],
      },
      {
        ko: "한국 음식 좋아해요?",
        gloss: "Do you like Korean food?",
        ask: "Say which you like best: kimchi stew (김치찌개) or bibimbap (비빔밥).",
        options: [
          { ko: "네, 김치찌개를 제일 싫어해요.", right: false, feedback: "싫어해요 means dislike! Like is 좋아해요: 네, 김치찌개를 제일 좋아해요." },
          { ko: "네, 김치찌개를 제일 좋아해요.", right: true, feedback: "Yes: 제일 = the most. 제일 좋아해요 = I like it best.", reply: { ko: "오, 김치찌개! 나도 좋아해요.", gloss: "Oh, kimchi stew! I like it too." } },
          { ko: "네, 비빔밥을 제일 좋아해요.", right: true, feedback: "Yes: 비빔밥 = rice mixed with vegetables. 제일 좋아해요 = I like it best.", reply: { ko: "비빔밥! 건강에 좋아요.", gloss: "Bibimbap! It is good for your health." } },
        ],
      },
      {
        ko: "한국말 잘하네요!",
        gloss: "Your Korean is good!",
        ask: "He praises you. Answer the modest way Koreans do.",
        options: [
          { ko: "네, 잘해요.", right: false, feedback: "\"Yes, I'm good at it\" sounds boastful in Korean. The modest answer: 아니에요, 아직 멀었어요." },
          { ko: "네, 잘했어요.", right: false, feedback: "잘했어요 is \"well done\": you would be praising him. The modest answer: 아니에요, 아직 멀었어요." },
          { ko: "아니에요, 아직 멀었어요.", right: true, feedback: "Yes: 아니에요, 아직 멀었어요. \"Not at all, I still have far to go\": the usual modest answer to praise." },
        ],
      },
    ],
    closing: { ko: "하하, 열심히 하세요!", gloss: "Ha ha, keep working at it!" },
  },
  grandma: {
    name: "Grandma Han",
    role: "Grandmother on the bench",
    focus: "Sharing what you notice: -네요, 보여요 (can be seen) and 하고 같이 (together with).",
    turns: [
      {
        ko: "날씨가 정말 좋네요!",
        gloss: "What lovely weather!",
        ask: "Agree with her.",
        options: [
          { ko: "네, 정말 좋아해요.", right: false, feedback: "좋아해요 is liking something. For the weather being fine, echo her: 네, 정말 좋네요!" },
          { ko: "네, 정말 좋네요!", right: true, feedback: "Yes: 네, 정말 좋네요! -네요 shares what you notice; echoing it is the friendly answer." },
          { ko: "아니요, 좋네요.", right: false, feedback: "아니요 disagrees, then says it is fine. To agree: 네, 정말 좋네요!" },
        ],
      },
      {
        ko: "여기서 서울이 다 보이지요?",
        gloss: "You can see all of Seoul from here, can't you?",
        ask: "You can, and it is beautiful (아름다워요).",
        options: [
          { ko: "네, 다 봐요.", right: false, feedback: "봐요 is looking on purpose. What can be seen is 보여요: 네, 다 보여요. 정말 아름다워요." },
          { ko: "네, 안 보여요.", right: false, feedback: "안 보여요 means it can't be seen. It can: 네, 다 보여요. 정말 아름다워요." },
          { ko: "네, 다 보여요. 정말 아름다워요.", right: true, feedback: "Yes: 보여요 = it can be seen; 아름다워요 = it is beautiful." },
        ],
      },
      {
        ko: "혼자 왔어요?",
        gloss: "Did you come alone?",
        ask: "Answer truly: alone (혼자), or with a friend (친구하고 같이).",
        options: [
          { ko: "아니요, 친구하고 같이 왔어요.", right: true, feedback: "Yes: 친구하고 같이 = together with a friend. 하고 = with.", reply: { ko: "좋겠네요!", gloss: "How nice!" } },
          { ko: "네, 혼자 왔어요.", right: true, feedback: "Yes: 혼자 = alone. 혼자 왔어요 = I came alone.", reply: { ko: "와, 용감하네요!", gloss: "Wow, how brave!" } },
          { ko: "네, 친구하고 같이 왔어요.", right: false, feedback: "네 says you came alone, then says you came with a friend. Say: 아니요, 친구하고 같이 왔어요." },
        ],
      },
    ],
    closing: { ko: "좋은 구경 하세요!", gloss: "Enjoy the view!" },
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
        ask: "كان لطيفًا. حان وقت الشكر: هناك طريقتان.",
        options: [
          { ko: "미안합니다.", right: false, feedback: "미안합니다 تعني «آسف». للشكر: 감사합니다." },
          { ko: "고맙습니다!", right: true, feedback: "نعم: 고맙습니다 شكر أيضًا، وأدفأ قليلًا من 감사합니다. كلتاهما مهذّبتان.", reply: { ko: "별말씀을요!", gloss: "لا داعي للشكر!" } },
          { ko: "감사합니다!", right: true, feedback: "نعم: 감사합니다! 오른쪽 = اليمين، 왼쪽 = اليسار، 쭉 = مباشرةً.", reply: { ko: "천만에요!", gloss: "على الرحب والسعة!" } },
        ],
      },
    ],
    closing: { ko: "또 만나요!", gloss: "إلى اللقاء!" },
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
        ask: "الإجابة بصدق وبأسلوبه الرسمي: طالب (학생) أو موظف في شركة (회사원).",
        options: [
          { ko: "네, 학생입니다.", right: true, feedback: "نعم: 학생입니다. 입니다 هي الصيغة الرسمية من 이에요، وصيغة السؤال 입니까?", reply: { ko: "아, 학생이십니까. 환영합니다.", gloss: "آه، طالب. أهلًا وسهلًا." } },
          { ko: "네, 학생이에요.", right: false, feedback: "جملة صحيحة ومهذّبة، لكنها بالأسلوب اليومي. لمجاراة أسلوبه الرسمي: 네, 학생입니다." },
          { ko: "아니요, 회사원입니다.", right: true, feedback: "نعم: 아니요 = لا، و회사원입니다 = أنا موظف في شركة. بأسلوب رسمي مثله.", reply: { ko: "아, 회사원이십니까. 환영합니다.", gloss: "آه، موظف في شركة. أهلًا وسهلًا." } },
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
        ask: "الموافقة على موعدها، أو الاعتذار بالانشغال (바빠요).",
        options: [
          { ko: "네, 내일 만나요!", right: true, feedback: "نعم: 내일 = غدًا. 두 시에: وقت حدوث الشيء يأخذ 에.", reply: { ko: "좋아요! 두 시예요, 잊지 마세요.", gloss: "رائع! الساعة الثانية، لا تنسَ." } },
          { ko: "네, 어제 만나요!", right: false, feedback: "어제 تعني أمس! غدًا هي 내일: 네, 내일 만나요!" },
          { ko: "미안해요, 내일은 바빠요.", right: true, feedback: "نعم: 미안해요 = آسف، و바빠요 = مشغول. طريقة مهذّبة للاعتذار.", reply: { ko: "괜찮아요. 그럼 다음에 만나요!", gloss: "لا بأس. نلتقي في المرة القادمة إذن!" } },
        ],
      },
    ],
    closing: { ko: "그럼 또 봐요!", gloss: "إلى اللقاء إذن!" },
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
        ask: "الإجابة بصدق: قليلًا (조금) أو ليس جيدًا (잘 못해요).",
        options: [
          { ko: "아니요, 잘 못해요.", right: true, feedback: "نعم: 잘 못해요 = لا أجيدها. إجابة متواضعة وصادقة.", reply: { ko: "아니에요, 지금 잘하고 있어요!", gloss: "لا أبدًا، أنت تجيدها الآن!" } },
          { ko: "네, 조금 할 수 없어요.", right: false, feedback: "할 수 없어요 تعني «لا أستطيع». وأنت تستطيع: 네, 조금 할 수 있어요." },
          { ko: "네, 조금 할 수 있어요.", right: true, feedback: "نعم: 할 수 있어요 «أستطيع». و할 수 없어요 = لا أستطيع.", reply: { ko: "와, 대단해요!", gloss: "واو، رائع!" } },
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
  gardener: {
    name: "الجدّ بيك",
    role: "البستاني",
    focus: "الثلاث الأولى: 안녕하세요 (مرحبًا)، و네 / 아니요 (نعم / لا)، وعبارتا الوداع: 안녕히 계세요 لمن يبقى، و안녕히 가세요 لمن يغادر.",
    turns: [
      {
        ko: "안녕하세요!",
        roman: "annyeonghaseyo!",
        gloss: "مرحبًا!",
        ask: "رجل كبير في السن يحيّيك. ردّ التحية.",
        options: [
          { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: true, feedback: "نعم: 안녕하세요! التحية المهذّبة، تصلح مع أي شخص." },
          { ko: "안녕!", roman: "annyeong!", right: false, feedback: "안녕 للأصدقاء المقرّبين والأطفال فقط. لكبير السن: 안녕하세요!" },
          { ko: "감사합니다!", roman: "gamsahamnida!", right: false, feedback: "감사합니다 تعني «شكرًا». التحية هي 안녕하세요!" },
        ],
      },
      {
        ko: "꽃 좋아해요?",
        roman: "kkot joahaeyo?",
        gloss: "هل تحب الأزهار؟",
        ask: "الإجابة بصدق: «نعم» و«لا» كلتاهما مقبولتان.",
        options: [
          { ko: "네, 좋아해요.", roman: "ne, joahaeyo.", right: true, feedback: "네 = نعم. 좋아해요 = أحبّها.", reply: { ko: "저도요! 꽃은 예뻐요.", roman: "jeodoyo! kkocheun yeppeoyo.", gloss: "وأنا أيضًا! الأزهار جميلة." } },
          { ko: "아니요.", roman: "aniyo.", right: true, feedback: "아니요 = لا. وإذا قيلت بلطف فهي مهذّبة تمامًا.", reply: { ko: "괜찮아요. 나무도 있어요!", roman: "gwaenchanayo. namudo isseoyo!", gloss: "لا بأس. هناك أشجار أيضًا!" } },
          { ko: "안녕히 가세요.", roman: "annyeonghi gaseyo.", right: false, feedback: "هذه عبارة وداع. الإجابة تكون بـ 네 (نعم) أو 아니요 (لا): 네, 좋아해요." },
        ],
      },
      {
        ko: "또 오세요!",
        roman: "tto oseyo!",
        gloss: "ننتظر زيارتك مرة أخرى!",
        ask: "أنت تغادر، وهو يبقى مع أزهاره. حان وقت الوداع.",
        options: [
          { ko: "안녕히 가세요!", roman: "annyeonghi gaseyo!", right: false, feedback: "가세요 تعني «اذهب بسلام»: تُقال لمن يغادر. وهو باقٍ: 안녕히 계세요!" },
          { ko: "안녕히 계세요!", roman: "annyeonghi gyeseyo!", right: true, feedback: "نعم: 안녕히 계세요! «ابقَ بسلام»: تُقال لمن يبقى في مكانه." },
          { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: false, feedback: "안녕하세요 تحية اللقاء. عند وداع من يبقى: 안녕히 계세요!" },
        ],
      },
    ],
    closing: { ko: "네, 안녕히 가세요!", roman: "ne, annyeonghi gaseyo!", gloss: "نعم، مع السلامة! (قال 가세요 لأنك أنت من يغادر.)" },
  },
  neighbour: {
    name: "السيدة يون",
    role: "الجارة",
    focus: "التعريف بالنفس: 저는 …이에요، و공부해요 (أدرس). ثم قراءة أول كلمة من لافتة.",
    turns: [
      {
        ko: "안녕하세요!",
        roman: "annyeonghaseyo!",
        gloss: "مرحبًا!",
        ask: "ردّ التحية مع ذكر أنك طالب (학생, haksaeng).",
        options: [
          { ko: "안녕하세요! 저는 학생이에요.", roman: "annyeonghaseyo! jeoneun haksaeng-ieyo.", right: true, feedback: "نعم: 저는 학생이에요. 저는 = أنا، و이에요 = فعل الكينونة." },
          { ko: "감사합니다! 저는 학생이에요.", roman: "gamsahamnida! jeoneun haksaeng-ieyo.", right: false, feedback: "감사합니다 تعني «شكرًا». البداية بالتحية: 안녕하세요! 저는 학생이에요." },
          { ko: "안녕히 가세요! 저는 학생이에요.", roman: "annyeonghi gaseyo! jeoneun haksaeng-ieyo.", right: false, feedback: "안녕히 가세요 عبارة وداع. البداية بالتحية: 안녕하세요! 저는 학생이에요." },
        ],
      },
      {
        ko: "한국어 공부해요?",
        roman: "hangugeo gongbuhaeyo?",
        gloss: "هل تدرس الكورية؟",
        ask: "نعم.",
        options: [
          { ko: "네, 한국어예요.", roman: "ne, hangugeo-yeyo.", right: false, feedback: "هذه تقول «نعم، إنها الكورية». للقول إنك تدرسها: 네, 한국어 공부해요." },
          { ko: "네, 한국어 공부해요.", roman: "ne, hangugeo gongbuhaeyo.", right: true, feedback: "نعم: 공부해요 = أدرس. 한국어 = اللغة الكورية.", reply: { ko: "와, 대단해요!", roman: "wa, daedanhaeyo!", gloss: "واو، رائع!" } },
          { ko: "아니요, 한국어 공부해요.", roman: "aniyo, hangugeo gongbuhaeyo.", right: false, feedback: "아니요 تعني «لا»، ثم تقول الجملة إنك تدرسها. «نعم» هي 네: 네, 한국어 공부해요." },
        ],
      },
      {
        ko: "이거 읽을 수 있어요?",
        roman: "igeo ilgeul su isseoyo?",
        gloss: "هل تستطيع قراءة هذه؟",
        show: "나무",
        ask: "تشير إلى لافتة. اقرأها.",
        options: [
          { ko: "ma-nu", right: false, feedback: "الحرف الأول ㄴ (n) والثاني ㅁ (m): na-mu. 나무 = شجرة." },
          { ko: "na-mu", right: true, feedback: "نعم: ㄴ + ㅏ = na، و ㅁ + ㅜ = mu. 나무 = شجرة." },
          { ko: "na-mo", right: false, feedback: "ㅜ تُنطق u (الخط القصير يتجه إلى الأسفل)، أما ㅗ فهي o. إذن: na-mu. 나무 = شجرة." },
        ],
      },
    ],
    closing: { ko: "맞아요! 잘했어요!", roman: "majayo! jalhaesseoyo!", gloss: "صحيح! أحسنت!" },
  },
  painter: {
    name: "السيد سو",
    role: "رسّام اللافتات",
    focus: "القراءة: حرف ساكن وحرف علة يكوّنان مقطعًا. ㄱ ㄴ ㄷ ㅁ مع ㅏ ㅗ ㅜ.",
    turns: [
      {
        ko: "안녕하세요! 저는 간판을 그려요.",
        roman: "annyeonghaseyo! jeoneun ganpaneul geuryeoyo.",
        gloss: "مرحبًا! أنا أرسم اللافتات.",
        show: "가",
        ask: "يرفع لافتة جديدة. اقرأها.",
        options: [
          { ko: "na", right: false, feedback: "ㄴ تُنطق n. الحرف الأول هنا ㄱ (g): ga." },
          { ko: "da", right: false, feedback: "ㄷ تُنطق d. الحرف الأول هنا ㄱ (g): ga." },
          { ko: "ga", right: true, feedback: "نعم: ㄱ (g) + ㅏ (a) = 가، ga. الساكن على اليسار وحرف العلة على اليمين." },
        ],
      },
      {
        ko: "이것은요?",
        roman: "igeoseunyo?",
        gloss: "وهذه؟",
        show: "노",
        ask: "حرف العلة هنا في الأسفل. اقرأها.",
        options: [
          { ko: "no", right: true, feedback: "نعم: ㄴ (n) + ㅗ (o) = 노، no. ㅗ و ㅜ يُكتبان تحت الحرف الساكن." },
          { ko: "nu", right: false, feedback: "ㅜ (الخط يتجه إلى الأسفل) تُنطق u. هنا الخط يتجه إلى الأعلى: ㅗ، o. إذن: no." },
          { ko: "mo", right: false, feedback: "ㅁ (المربع) تُنطق m. هذا الحرف ㄴ (n): no." },
        ],
      },
      {
        ko: "마지막이에요!",
        roman: "majimagieyo!",
        gloss: "الأخيرة!",
        show: "모두",
        ask: "مقطعان يكوّنان كلمة. اقرأها.",
        options: [
          { ko: "mu-do", right: false, feedback: "حرفا العلة بالعكس: ㅗ (o) أولًا ثم ㅜ (u). mo-du." },
          { ko: "mo-du", right: true, feedback: "نعم: ㅁ + ㅗ = mo، و ㄷ + ㅜ = du. 모두 = الجميع، كل." },
          { ko: "no-du", right: false, feedback: "الحرف الأول ㅁ (m)، المربع: mo-du." },
        ],
      },
    ],
    closing: { ko: "와, 다 읽었어요! 모두 잘했어요.", roman: "wa, da ilgeosseoyo! modu jalhaesseoyo.", gloss: "واو، قرأت كل شيء! أحسنت في الجميع." },
  },
  cafe: {
    name: "جون هو",
    role: "طالب",
    focus: "الإعجاب والمشروبات: 좋아해요، و마셔요 (وليس 먹어요)، و에서 왔어요 لبلد القدوم.",
    turns: [
      {
        ko: "커피 좋아해요?",
        gloss: "هل تحب القهوة؟",
        ask: "الإجابة بصدق: تحبها، أو تفضّل الشاي (차).",
        options: [
          { ko: "네, 좋아해요.", right: true, feedback: "نعم: 네, 좋아해요. 좋아해요 = أحبّها.", reply: { ko: "저도요! 여기 커피가 맛있어요.", gloss: "وأنا أيضًا! القهوة هنا لذيذة." } },
          { ko: "아니요, 좋아해요.", right: false, feedback: "아니요 تعني «لا»، ثم تقول الجملة إنك تحبها. «نعم» هي 네: 네, 좋아해요." },
          { ko: "아니요, 차를 좋아해요.", right: true, feedback: "نعم: 차 = الشاي. 차를 좋아해요 = أحب الشاي.", reply: { ko: "아, 그래요? 여기 녹차도 맛있어요.", gloss: "آه، حقًا؟ الشاي الأخضر هنا لذيذ أيضًا." } },
        ],
      },
      {
        ko: "지금 뭐 마셔요?",
        gloss: "ماذا تشرب الآن؟",
        ask: "المشروب شاي أخضر (녹차).",
        options: [
          { ko: "녹차를 먹어요.", right: false, feedback: "먹어요 للطعام. المشروبات تأخذ 마셔요: 녹차를 마셔요." },
          { ko: "녹차가 마셔요.", right: false, feedback: "가 تجعل الشاي هو الذي يشرب! ما يُشرب يأخذ 를: 녹차를 마셔요." },
          { ko: "녹차를 마셔요.", right: true, feedback: "نعم: 녹차를 마셔요. 를 لما يُشرب، و마셔요 = أشرب." },
        ],
      },
      {
        ko: "어느 나라에서 왔어요?",
        gloss: "من أي بلد أنت؟",
        ask: "من مصر (이집트).",
        options: [
          { ko: "이집트에 왔어요.", right: false, feedback: "에 왔어요 تقول «جئت إلى مصر». بلد القدوم يأخذ 에서: 이집트에서 왔어요." },
          { ko: "이집트에서 왔어요.", right: true, feedback: "نعم: 이집트에서 왔어요. اسم البلد + 에서 왔어요 = أنا من…" },
          { ko: "이집트에서 가요.", right: false, feedback: "هذه تقول «أذهب من مصر». لبلد القدوم: 이집트에서 왔어요." },
        ],
      },
    ],
    closing: { ko: "와, 반가워요! 한국어 잘하네요.", gloss: "واو، تشرّفنا! كوريّتك جيدة." },
  },
  cook: {
    name: "السيدة تشوي",
    role: "طبّاخة الكشك",
    focus: "على المائدة: 잘 먹겠습니다 قبل الأكل، و맛있어요 / 매워요 أثناءه، و배불러요 عند الشبع.",
    turns: [
      {
        ko: "맛있게 드세요!",
        gloss: "بالهناء والشفاء!",
        ask: "الطبق أمامك. ماذا يُقال قبل الأكل؟",
        options: [
          { ko: "잘 먹었습니다.", right: false, feedback: "잘 먹었습니다 تُقال بعد الوجبة. قبلها: 잘 먹겠습니다!" },
          { ko: "잘 먹겠습니다!", right: true, feedback: "نعم: 잘 먹겠습니다! «سآكل بامتنان»: شكر لمن أعدّ الطعام." },
          { ko: "맛있게 드세요!", right: false, feedback: "هذا ما تقوله الطبّاخة لك. والردّ: 잘 먹겠습니다!" },
        ],
      },
      {
        ko: "맛이 어때요?",
        gloss: "كيف الطعم؟",
        ask: "قل رأيك: لذيذ، أو حارّ قليلًا (매워요) لكنه طيب.",
        options: [
          { ko: "조금 매워요. 하지만 맛있어요!", right: true, feedback: "نعم: 매워요 = حارّ، 하지만 = لكن، 맛있어요 = لذيذ.", reply: { ko: "다행이에요! 물도 드세요.", gloss: "الحمد لله! تفضّل ماء أيضًا." } },
          { ko: "조금 매워요. 그래서 맛없어요.", right: false, feedback: "그래서 맛없어요 تقول «لذلك ليس لذيذًا»: قاسية على طبّاخة! الطعم يعجبك: 조금 매워요. 하지만 맛있어요!" },
          { ko: "정말 맛있어요!", right: true, feedback: "نعم: 정말 = حقًا، و맛있어요 = لذيذ. الكلمات التي تتمناها كل طبّاخة.", reply: { ko: "고마워요! 많이 드세요.", gloss: "شكرًا! تفضّل وكُل كثيرًا." } },
        ],
      },
      {
        ko: "더 드릴까요?",
        gloss: "هل أضيف المزيد؟",
        ask: "شبعت. الرفض بلطف.",
        options: [
          { ko: "네, 배불러요.", right: false, feedback: "네 تقبل المزيد، ثم تقول إنك شبعت. للرفض بلطف: 아니요, 괜찮아요. 배불러요." },
          { ko: "아니요, 배고파요.", right: false, feedback: "배고파요 تعني «أنا جائع»: إذن تريد المزيد! الشبع هو 배불러요: 아니요, 괜찮아요. 배불러요." },
          { ko: "아니요, 괜찮아요. 배불러요.", right: true, feedback: "نعم: 괜찮아요 = لا شكرًا، و배불러요 = شبعت." },
        ],
      },
    ],
    closing: { ko: "네, 또 오세요!", gloss: "حسنًا، ننتظر زيارتكم!" },
  },
  attendant: {
    name: "دونغ هيون",
    role: "موظف المحطة",
    focus: "المترو: 까지 لنهاية الرحلة، و이호선 للخط الثاني، و세 정거장 لثلاث محطات، و있어요 / 없어요.",
    turns: [
      {
        ko: "어디까지 가세요?",
        gloss: "إلى أين الوجهة؟",
        ask: "الوجهة محطة سيول (서울역).",
        options: [
          { ko: "서울역이에요.", right: false, feedback: "هذه تقول «إنها محطة سيول». نهاية الرحلة تأخذ 까지: 서울역까지요." },
          { ko: "서울역에서요.", right: false, feedback: "에서 تعني «من»: «من محطة سيول». حتى المحطة: 서울역까지요." },
          { ko: "서울역까지요.", right: true, feedback: "نعم: 서울역까지요. 까지 = حتى، و요 القصيرة تحفظ التهذيب." },
        ],
      },
      {
        ko: "이호선을 타세요. 세 정거장이에요.",
        gloss: "…",
        ask: "كم محطة؟",
        options: [
          { ko: "2", right: false, feedback: "이 (2) رقم الخط: 이호선 = الخط الثاني. المحطات 세 정거장: ثلاث." },
          { ko: "3", right: true, feedback: "نعم: 세 정거장 = ثلاث محطات، تُعدّ 한، 두، 세. وأسماء الخطوط تستعمل 일، 이، 삼: 이호선 = الخط الثاني." },
          { ko: "4", right: false, feedback: "أربع محطات هي 네 정거장. قال 세 정거장: ثلاث." },
        ],
      },
      {
        ko: "교통카드 있어요?",
        gloss: "هل معك بطاقة مواصلات؟",
        ask: "الإجابة بصدق: معك (있어요) أو ليست معك (없어요).",
        options: [
          { ko: "아니요, 없어요.", right: true, feedback: "نعم: 없어요 = ليست معي. و있어요 = معي.", reply: { ko: "그럼 저기에서 표를 사세요.", gloss: "إذن التذاكر تُشترى من هناك." } },
          { ko: "네, 있어요.", right: true, feedback: "نعم: 있어요 = معي. و없어요 = ليست معي.", reply: { ko: "좋아요. 그럼 바로 타세요!", gloss: "جيد. اركب مباشرةً إذن!" } },
          { ko: "네, 없어요.", right: false, feedback: "네 تقول «نعم»، و없어요 تقول إنها ليست معك. الردّ على سؤال مباشر: 아니요, 없어요." },
        ],
      },
    ],
    closing: { ko: "안녕히 가세요!", gloss: "مع السلامة!" },
  },
  grandpa: {
    name: "الجدّ أو",
    role: "الجدّ على المقعد",
    focus: "حديث قصير مع كبير السن: 에서 왔어요، و제일 좋아해요، والردّ المتواضع على المديح.",
    turns: [
      {
        ko: "어디서 왔어요?",
        gloss: "من أين أنت؟",
        ask: "من مصر (이집트).",
        options: [
          { ko: "이집트에서 왔어요.", right: true, feedback: "نعم: 이집트에서 왔어요. اسم البلد + 에서 왔어요." },
          { ko: "이집트에 왔어요.", right: false, feedback: "에 왔어요 تقول «جئت إلى مصر». «من» تأخذ 에서: 이집트에서 왔어요." },
          { ko: "이집트에 가요.", right: false, feedback: "هذه تقول «أذهب إلى مصر». لبلد القدوم: 이집트에서 왔어요." },
        ],
      },
      {
        ko: "한국 음식 좋아해요?",
        gloss: "هل تحب الطعام الكوري؟",
        ask: "قل أيهما تحب أكثر: يخنة الكيمتشي (김치찌개) أو البيبيمباب (비빔밥).",
        options: [
          { ko: "네, 김치찌개를 제일 싫어해요.", right: false, feedback: "싫어해요 تعني «أكره»! «أحب» هي 좋아해요: 네, 김치찌개를 제일 좋아해요." },
          { ko: "네, 김치찌개를 제일 좋아해요.", right: true, feedback: "نعم: 제일 = الأكثر. 제일 좋아해요 = أحبه أكثر من غيره.", reply: { ko: "오, 김치찌개! 나도 좋아해요.", gloss: "أوه، يخنة الكيمتشي! أنا أيضًا أحبها." } },
          { ko: "네, 비빔밥을 제일 좋아해요.", right: true, feedback: "نعم: 비빔밥 = أرز مخلوط بالخضار. 제일 좋아해요 = أحبه أكثر من غيره.", reply: { ko: "비빔밥! 건강에 좋아요.", gloss: "بيبيمباب! مفيد للصحة." } },
        ],
      },
      {
        ko: "한국말 잘하네요!",
        gloss: "كوريّتك جيدة!",
        ask: "يمدحك. الردّ بالتواضع المعتاد عند الكوريين.",
        options: [
          { ko: "네, 잘해요.", right: false, feedback: "«نعم، أنا جيد فيها» تبدو تفاخرًا بالكورية. الردّ المتواضع: 아니에요, 아직 멀었어요." },
          { ko: "네, 잘했어요.", right: false, feedback: "잘했어요 تعني «أحسنت»: كأنك تمدحه هو. الردّ المتواضع: 아니에요, 아직 멀었어요." },
          { ko: "아니에요, 아직 멀었어요.", right: true, feedback: "نعم: 아니에요, 아직 멀었어요. «لا أبدًا، ما زال الطريق طويلًا»: الردّ المتواضع المعتاد على المديح." },
        ],
      },
    ],
    closing: { ko: "하하, 열심히 하세요!", gloss: "ها ها، بالتوفيق والاجتهاد!" },
  },
  grandma: {
    name: "الجدّة هان",
    role: "الجدّة على المقعد",
    focus: "مشاركة الملاحظة: -네요، و보여요 (يُرى)، و하고 같이 (مع).",
    turns: [
      {
        ko: "날씨가 정말 좋네요!",
        gloss: "ما أجمل الطقس!",
        ask: "الموافقة على كلامها.",
        options: [
          { ko: "네, 정말 좋아해요.", right: false, feedback: "좋아해요 للإعجاب بشيء. لجمال الطقس يُردَّد كلامها: 네, 정말 좋네요!" },
          { ko: "네, 정말 좋네요!", right: true, feedback: "نعم: 네, 정말 좋네요! -네요 تشارك ما يُلاحَظ، وترديدها هو الردّ الودود." },
          { ko: "아니요, 좋네요.", right: false, feedback: "아니요 تعترض، ثم تقول إن الطقس جميل. للموافقة: 네, 정말 좋네요!" },
        ],
      },
      {
        ko: "여기서 서울이 다 보이지요?",
        gloss: "من هنا تُرى سيول كلها، أليس كذلك؟",
        ask: "نعم، والمنظر جميل (아름다워요).",
        options: [
          { ko: "네, 다 봐요.", right: false, feedback: "봐요 للنظر المقصود. ما يُرى هو 보여요: 네, 다 보여요. 정말 아름다워요." },
          { ko: "네, 안 보여요.", right: false, feedback: "안 보여요 تعني «لا يُرى». وهي تُرى: 네, 다 보여요. 정말 아름다워요." },
          { ko: "네, 다 보여요. 정말 아름다워요.", right: true, feedback: "نعم: 보여요 = يُرى، و아름다워요 = جميل." },
        ],
      },
      {
        ko: "혼자 왔어요?",
        gloss: "هل جئت وحدك؟",
        ask: "الإجابة بصدق: وحدك (혼자) أو مع صديق (친구하고 같이).",
        options: [
          { ko: "아니요, 친구하고 같이 왔어요.", right: true, feedback: "نعم: 친구하고 같이 = مع صديق. 하고 = مع.", reply: { ko: "좋겠네요!", gloss: "ما أجمل ذلك!" } },
          { ko: "네, 혼자 왔어요.", right: true, feedback: "نعم: 혼자 = وحدي. 혼자 왔어요 = جئت وحدي.", reply: { ko: "와, 용감하네요!", gloss: "واو، يا للشجاعة!" } },
          { ko: "네, 친구하고 같이 왔어요.", right: false, feedback: "네 تقول إنك جئت وحدك، ثم تقول إنك مع صديق. الصحيح: 아니요, 친구하고 같이 왔어요." },
        ],
      },
    ],
    closing: { ko: "좋은 구경 하세요!", gloss: "مشاهدة ممتعة!" },
  },
};

export const CHATS: Record<WorldLang, Record<ChatId, Chat>> = { en: EN, ar: AR };

/**
 * A second, longer talk with each of the market's seven friends: offered
 * once the first is finished (they are a friend by then), and a step harder
 * — the same class's pattern, now beside the ones it is easily confused
 * with. Same six canon answers as the first; what changes: the friendship
 * has a second conversation behind it, shown in the story card.
 */
type Again = Pick<Chat, "focus" | "turns" | "closing">;
const EN2: Record<FriendId, Again> = {
  jihoon: { focus: "에 and 에서 side by side: 에 가요 (go to), 에서 공부해요 (do something at), and the past 샀어요.", turns: [
      { ko: "또 만났네요! 책 가게에서 뭐 샀어요?", gloss: "We meet again! What did you buy at the book shop?", ask: "You bought a Korean book (한국어 책).", options: [
        { ko: "한국어 책을 샀어요.", right: true, feedback: "Yes: 책을 샀어요. The thing you bought takes 을/를; 샀어요 is the past of 사요." },
        { ko: "한국어 책을 사요.", right: false, feedback: "사요 is now, or a habit: \"I buy\". It is already done: 샀어요." },
        { ko: "한국어 책에 샀어요.", right: false, feedback: "에 marks a place or a time, not the thing bought. The thing takes 을: 책을 샀어요." },
      ] },
      { ko: "와, 한국어 공부해요? 어디에서 공부해요?", gloss: "Wow, you study Korean? Where do you study?", ask: "You study at home (집).", options: [
        { ko: "집에 공부해요.", right: false, feedback: "에 is for where you go, or where something is. Where you do something takes 에서: 집에서 공부해요." },
        { ko: "집에서 공부해요.", right: true, feedback: "Yes: 집에서 공부해요. 에서 marks where you do something." },
        { ko: "집이 공부해요.", right: false, feedback: "That makes the house the one who studies. 집에서 공부해요." },
      ] },
      { ko: "저는 도서관에서 공부해요. 도서관은 시장 옆에 있어요.", gloss: "I study at the library. The library is next to the market.", ask: "Tell him you are going to the library tomorrow (내일).", options: [
        { ko: "내일 도서관에 가요.", right: true, feedback: "Yes: 내일 도서관에 가요. Korean uses the present for a near plan; the place you go to takes 에." },
        { ko: "내일 도서관에서 가요.", right: false, feedback: "에서 가요 means leaving from the library. Going to it: 도서관에 가요." },
        { ko: "내일 도서관이 가요.", right: false, feedback: "That makes the library the one that goes. 도서관에 가요." },
      ] },
    ], closing: { ko: "좋아요! 내일 도서관에서 만나요.", gloss: "Good! See you at the library tomorrow." } },
  park: { focus: "At the stall: 얼마예요?, counting boxes with 두, prices with 만 · 구천, and 깎아 주세요.", turns: [
      { ko: "어서 오세요! 오늘은 딸기가 싸요.", gloss: "Welcome! Strawberries are cheap today.", ask: "Ask how much the strawberries (딸기) are.", options: [
        { ko: "딸기가 얼마예요?", right: true, feedback: "Yes: 얼마예요? = how much is it?" },
        { ko: "딸기가 몇 개예요?", right: false, feedback: "몇 개예요 asks how many there are. The price: 얼마예요?" },
        { ko: "딸기가 뭐예요?", right: false, feedback: "뭐예요 asks what it is. The price: 얼마예요?" },
      ] },
      { ko: "한 상자에 오천 원이에요.", gloss: "Five thousand won a box.", ask: "You want two boxes (상자).", options: [
        { ko: "이 상자 주세요.", right: false, feedback: "이 is the price-number two (이천 원), and here it sounds like \"this box\". Things are counted with 두: 두 상자 주세요." },
        { ko: "두 상자 주세요.", right: true, feedback: "Yes: 두 상자. Things are counted with 한, 두, 세." },
        { ko: "둘 상자 주세요.", right: false, feedback: "둘 becomes 두 before a counting word: 두 상자." },
      ] },
      { ko: "두 상자요? 그럼 만 원이에요.", gloss: "Two boxes? Then it is ten thousand won.", ask: "A little much for you. Ask politely for something off the price.", options: [
        { ko: "좀 깎아 주세요.", right: true, feedback: "Yes: 깎아 주세요 = please take a little off. 좀 makes it softer.", reply: { ko: "하하, 그럼 구천 원만 주세요.", gloss: "Haha, then give me just nine thousand." } },
        { ko: "좀 깎으세요.", right: false, feedback: "깎으세요 tells her to do it, like an order. Asking a favour: 깎아 주세요." },
        { ko: "만 원 주세요.", right: false, feedback: "That asks her to give you ten thousand won. For a lower price: 좀 깎아 주세요." },
      ] },
    ], closing: { ko: "고마워요! 맛있게 드세요.", gloss: "Thank you! Enjoy them." } },
  kim: { focus: "Formal past and questions: -았/었습니다, 입니까?, and the formal thanks.", turns: [
      { ko: "안녕하십니까? 무엇을 도와드릴까요?", gloss: "Hello. How may I help you?", ask: "You lost your bag (가방). Say so formally.", options: [
        { ko: "가방을 잃어버렸습니다.", right: true, feedback: "Yes: 잃어버렸습니다, the formal past of 잃어버려요 (lose)." },
        { ko: "가방을 잃어버립니다.", right: false, feedback: "잃어버립니다 is the present: \"I lose\". It has happened: 잃어버렸습니다." },
        { ko: "가방을 잃어버렸어.", right: false, feedback: "잃어버렸어 is casual, for close friends. At a desk: 잃어버렸습니다." },
      ] },
      { ko: "아, 그렇습니까? 가방이 무슨 색입니까?", gloss: "Oh, is that so? What colour is the bag?", ask: "It is black (검은색).", options: [
        { ko: "검은색입니다.", right: true, feedback: "Yes: 검은색입니다. 입니다 is the formal 이에요." },
        { ko: "검은색입니까?", right: false, feedback: "입니까? is the question. You are answering: 검은색입니다." },
        { ko: "검은색 있습니다.", right: false, feedback: "있습니다 says there is one. To say what it is: 검은색입니다." },
      ] },
      { ko: "잠시만 기다리십시오. 아, 여기 있습니다!", gloss: "One moment, please. Ah, here it is!", ask: "He found it. Thank him formally.", options: [
        { ko: "고마워.", right: false, feedback: "고마워 is for close friends. Formal: 감사합니다." },
        { ko: "실례합니다.", right: false, feedback: "실례합니다 is \"excuse me\". Thanks: 감사합니다." },
        { ko: "감사합니다.", right: true, feedback: "Yes: 감사합니다, the formal thanks." },
      ] },
    ], closing: { ko: "천만에요. 안녕히 가십시오.", gloss: "You are welcome. Goodbye." } },
  yuna: { focus: "Ordering: 한 잔 주세요, here or 포장, and 조금만 주세요.", turns: [
      { ko: "어서 오세요! 오늘은 뭐 드릴까요?", gloss: "Welcome! What can I get you today?", ask: "One iced americano (아이스 아메리카노), please.", options: [
        { ko: "아이스 아메리카노 한 잔 주세요.", right: true, feedback: "Yes: 한 잔 주세요. Drinks are counted in 잔 (cups)." },
        { ko: "아이스 아메리카노 한 개 주세요.", right: false, feedback: "She would understand, but a drink is counted in 잔, not 개: 한 잔 주세요." },
        { ko: "아이스 아메리카노 일 잔 주세요.", right: false, feedback: "일 is the price-number. Counting uses 한: 한 잔." },
      ] },
      { ko: "여기서 드세요?", gloss: "For here?", ask: "Answer her: here, or to take away. Both are fine.", options: [
        { ko: "네, 여기서요.", right: true, feedback: "Yes: 여기서요 = here, please.", reply: { ko: "네, 편한 자리에 앉으세요.", gloss: "Sure, take any seat you like." } },
        { ko: "아니요, 포장해 주세요.", right: true, feedback: "Yes: 포장해 주세요 = to take away, please.", reply: { ko: "네, 포장해 드릴게요.", gloss: "Sure, I will pack it for you." } },
        { ko: "네, 포장해 주세요.", right: false, feedback: "네 says \"yes, for here\", then asks for takeaway. One or the other: 네, 여기서요 — or 아니요, 포장해 주세요." },
      ] },
      { ko: "사천오백 원입니다. 얼음은 어떻게 해 드릴까요?", gloss: "That is 4,500 won. How would you like the ice?", ask: "You want only a little ice (얼음).", options: [
        { ko: "얼음 많이 주세요.", right: false, feedback: "많이 = a lot. Only a little: 조금만 주세요." },
        { ko: "얼음 조금만 주세요.", right: true, feedback: "Yes: 조금만 = just a little. 만 means \"only\"." },
        { ko: "얼음 조금만 드세요.", right: false, feedback: "드세요 tells her to eat it. Asking her for it: 주세요." },
      ] },
    ], closing: { ko: "네, 알겠습니다! 잠시만 기다려 주세요.", gloss: "Got it! One moment, please." } },
  seoyeon: { focus: "Clock and calendar together: 세 시 반, 무슨 요일, 모레, and 같이 …해요 for \"let's\".", turns: [
      { ko: "안녕하세요! 혹시 지금 몇 시예요?", gloss: "Hello! Do you know what time it is?", ask: "It is half past three.", options: [
        { ko: "세 시 반이에요.", right: true, feedback: "Yes: 세 시 반. Hours use 한, 두, 세; 반 = half." },
        { ko: "삼 시 반이에요.", right: false, feedback: "삼 is for minutes and prices. Hours: 세 시." },
        { ko: "세 분 반이에요.", right: false, feedback: "분 is minutes. The hour is 시: 세 시 반." },
      ] },
      { ko: "벌써요? 수업이 네 시에 시작해요.", gloss: "Already? Class starts at four.", ask: "Ask her what day the test (시험) is.", options: [
        { ko: "시험이 몇 시예요?", right: false, feedback: "몇 시예요 asks the hour. The day: 무슨 요일이에요?" },
        { ko: "시험이 무슨 요일이에요?", right: true, feedback: "Yes: 무슨 요일이에요? = what day of the week?" },
        { ko: "시험이 어디예요?", right: false, feedback: "어디예요 asks where. The day: 무슨 요일이에요?" },
      ] },
      { ko: "금요일이에요. 오늘이 수요일이니까, 모레예요!", gloss: "Friday. Today is Wednesday, so it is the day after tomorrow!", ask: "Suggest studying together tomorrow (내일).", options: [
        { ko: "그럼 내일 같이 공부해요.", right: true, feedback: "Yes: 내일 같이 공부해요. 같이 = together; said to a friend, 공부해요 also means \"let's study\"." },
        { ko: "그럼 어제 같이 공부해요.", right: false, feedback: "어제 is yesterday. Tomorrow: 내일." },
        { ko: "그럼 내일 같이 공부했어요.", right: false, feedback: "공부했어요 is the past. For tomorrow: 공부해요." },
      ] },
    ], closing: { ko: "좋아요! 내일 세 시에 도서관에서 만나요.", gloss: "Great! Let's meet at the library at three tomorrow." } },
  taeyang: { focus: "Making plans: -(으)ㄹ 거예요, answering -(으)ㄹ까요? with a yes or with 못 …어서, and suggesting something else.", turns: [
      { ko: "주말에 뭐 할 거예요?", gloss: "What will you do at the weekend?", ask: "You will meet a friend (친구).", options: [
        { ko: "친구를 만날 거예요.", right: true, feedback: "Yes: 만날 거예요 = I will meet." },
        { ko: "친구를 만났어요.", right: false, feedback: "만났어요 is the past. For the weekend ahead: 만날 거예요." },
        { ko: "친구를 만날까요?", right: false, feedback: "만날까요? suggests \"shall we meet?\". Your own plan: 만날 거예요." },
      ] },
      { ko: "좋겠네요! 저는 등산할 거예요. 같이 갈까요?", gloss: "Nice! I am going hiking. Shall we go together?", ask: "Answer him: you may accept, or say you cannot.", options: [
        { ko: "네, 같이 가요!", right: true, feedback: "Yes: 같이 가요 accepts a -(으)ㄹ까요? suggestion.", reply: { ko: "좋아요! 그럼 일요일 아침에 만나요.", gloss: "Good! Then let's meet on Sunday morning." } },
        { ko: "미안해요. 약속이 있어서 못 가요.", right: true, feedback: "Yes: 약속이 있어서 = because I have plans; 못 가요 = I cannot go.", reply: { ko: "괜찮아요. 다음에 같이 가요!", gloss: "That is fine. Let's go together next time!" } },
        { ko: "네, 같이 갈 거예요?", right: false, feedback: "갈 거예요? asks him whether he will go. To accept: 네, 같이 가요!" },
      ] },
      { ko: "아, 그런데 일요일에 비가 올 거예요.", gloss: "Oh, but it will rain on Sunday.", ask: "Suggest going to a café (카페) instead.", options: [
        { ko: "그럼 카페에 갔어요.", right: false, feedback: "갔어요 is the past. To suggest: 갈까요?" },
        { ko: "그럼 카페에 가서요.", right: false, feedback: "가서 leaves the sentence unfinished: \"go, and so…\". To suggest: 갈까요?" },
        { ko: "그럼 카페에 갈까요?", right: true, feedback: "Yes: 갈까요? = shall we go?" },
      ] },
    ], closing: { ko: "좋은 생각이에요! 카페에서 만나요.", gloss: "Good idea! See you at the café." } },
  hana: { focus: "Can and favours: -(으)ㄹ 수 있어요, -아/어 주세요 to ask, -아/어 드릴게요 to offer.", turns: [
      { ko: "어, 또 만났네요! 혹시 저 간판 읽을 수 있어요?", gloss: "Oh, we meet again! Can you read that sign, by any chance?", ask: "You can read Hangul now. Say so.", options: [
        { ko: "네, 읽을 수 있어요.", right: true, feedback: "Yes: 읽을 수 있어요 = I can read it." },
        { ko: "네, 읽을 수 없어요.", right: false, feedback: "없어요 makes it \"cannot\", after saying 네. You can: 네, 읽을 수 있어요." },
        { ko: "네, 읽어 주세요.", right: false, feedback: "읽어 주세요 asks her to read it for you. You can: 읽을 수 있어요." },
      ] },
      { ko: "그럼 좀 읽어 주세요. 안경이 없어서 안 보여요.", gloss: "Then please read it for me. I do not have my glasses, so I cannot see it.", ask: "The sign says the shop opens at ten. Tell her.", options: [
        { ko: "십 시에 문을 열어요.", right: false, feedback: "십 is for minutes and prices. Hours: 열 시." },
        { ko: "열 시에 문을 열어요.", right: true, feedback: "Yes: 열 시에 문을 열어요 = it opens at ten. 열 is ten and 열어요 is \"opens\": two different words." },
        { ko: "열 시에 문을 닫아요.", right: false, feedback: "닫아요 = closes. Opens: 열어요." },
      ] },
      { ko: "아, 고마워요! 사진 좀 찍어 줄 수 있어요?", gloss: "Ah, thank you! Could you take a photo for me?", ask: "Of course. Offer to take it.", options: [
        { ko: "네, 찍어 주세요.", right: false, feedback: "찍어 주세요 asks her to take it. You are offering: 찍어 드릴게요." },
        { ko: "네, 찍어 드릴게요.", right: true, feedback: "Yes: 찍어 드릴게요 = I will take it for you. 드릴게요 is the humble 줄게요." },
        { ko: "네, 찍을 수 없어요.", right: false, feedback: "수 없어요 = cannot, after saying 네. You can: 찍어 드릴게요." },
      ] },
    ], closing: { ko: "하나, 둘, 셋! 고마워요, 정말 친절하네요.", gloss: "One, two, three! Thank you, you are really kind." } },
};
const AR2: Record<FriendId, Again> = {
  jihoon: { focus: "에 و 에서 جنبًا إلى جنب: 에 가요 (أذهب إلى)، 에서 공부해요 (أفعل شيئًا في)، والماضي 샀어요.", turns: [
      { ko: "또 만났네요! 책 가게에서 뭐 샀어요?", gloss: "التقينا مرة أخرى! ماذا اشتريت من المكتبة؟", ask: "اشتريت كتابًا كوريًا (한국어 책).", options: [
        { ko: "한국어 책을 샀어요.", right: true, feedback: "نعم: 책을 샀어요. الشيء الذي اشتريته يأخذ 을/를، و샀어요 هو ماضي 사요." },
        { ko: "한국어 책을 사요.", right: false, feedback: "사요 للحاضر أو العادة: «أشتري». الأمر انتهى: 샀어요." },
        { ko: "한국어 책에 샀어요.", right: false, feedback: "에 تدل على مكان أو وقت، لا على الشيء المشترى. الشيء يأخذ 을: 책을 샀어요." },
      ] },
      { ko: "와, 한국어 공부해요? 어디에서 공부해요?", gloss: "واو، تدرس الكورية؟ أين تدرس؟", ask: "تدرس في البيت (집).", options: [
        { ko: "집에 공부해요.", right: false, feedback: "에 للمكان الذي تذهب إليه أو يوجد فيه شيء. مكان الفعل يأخذ 에서: 집에서 공부해요." },
        { ko: "집에서 공부해요.", right: true, feedback: "نعم: 집에서 공부해요. 에서 تدل على مكان الفعل." },
        { ko: "집이 공부해요.", right: false, feedback: "هكذا يصبح البيت هو الذي يدرس. الصحيح: 집에서 공부해요." },
      ] },
      { ko: "저는 도서관에서 공부해요. 도서관은 시장 옆에 있어요.", gloss: "أنا أدرس في المكتبة العامة. المكتبة بجانب السوق.", ask: "قل له إنك ستذهب إلى المكتبة غدًا (내일).", options: [
        { ko: "내일 도서관에 가요.", right: true, feedback: "نعم: 내일 도서관에 가요. الكورية تستعمل المضارع للخطة القريبة، والمكان المقصود يأخذ 에." },
        { ko: "내일 도서관에서 가요.", right: false, feedback: "에서 가요 تعني الخروج من المكتبة. الذهاب إليها: 도서관에 가요." },
        { ko: "내일 도서관이 가요.", right: false, feedback: "هكذا تصبح المكتبة هي التي تذهب. الصحيح: 도서관에 가요." },
      ] },
    ], closing: { ko: "좋아요! 내일 도서관에서 만나요.", gloss: "جيد! نلتقي غدًا في المكتبة." } },
  park: { focus: "عند البسطة: 얼마예요؟، عدّ الصناديق بـ 두، الأسعار بـ 만 · 구천، و 깎아 주세요.", turns: [
      { ko: "어서 오세요! 오늘은 딸기가 싸요.", gloss: "أهلًا! الفراولة رخيصة اليوم.", ask: "اسأل عن سعر الفراولة (딸기).", options: [
        { ko: "딸기가 얼마예요?", right: true, feedback: "نعم: 얼마예요؟ = كم السعر؟" },
        { ko: "딸기가 몇 개예요?", right: false, feedback: "몇 개예요 تسأل عن العدد. السعر: 얼마예요؟" },
        { ko: "딸기가 뭐예요?", right: false, feedback: "뭐예요 تسأل «ما هذا؟». السعر: 얼마예요؟" },
      ] },
      { ko: "한 상자에 오천 원이에요.", gloss: "الصندوق بخمسة آلاف وون.", ask: "تريد صندوقين (상자).", options: [
        { ko: "이 상자 주세요.", right: false, feedback: "이 هو رقم اثنين للأسعار (이천 원)، وهنا تُفهم «هذا الصندوق». الأشياء تُعدّ بـ 두: 두 상자 주세요." },
        { ko: "두 상자 주세요.", right: true, feedback: "نعم: 두 상자. الأشياء تُعدّ بـ 한، 두، 세." },
        { ko: "둘 상자 주세요.", right: false, feedback: "둘 تصير 두 قبل كلمة العدّ: 두 상자." },
      ] },
      { ko: "두 상자요? 그럼 만 원이에요.", gloss: "صندوقان؟ إذن عشرة آلاف وون.", ask: "السعر كثير قليلًا. اطلب تخفيضًا بأدب.", options: [
        { ko: "좀 깎아 주세요.", right: true, feedback: "نعم: 깎아 주세요 = خفّضي السعر من فضلك. و 좀 تجعل الطلب ألطف.", reply: { ko: "하하, 그럼 구천 원만 주세요.", gloss: "هاها، إذن أعطني تسعة آلاف فقط." } },
        { ko: "좀 깎으세요.", right: false, feedback: "깎으세요 أمر مباشر لها. لطلب معروف: 깎아 주세요." },
        { ko: "만 원 주세요.", right: false, feedback: "هكذا تطلب منها أن تعطيك عشرة آلاف وون. لتخفيض السعر: 좀 깎아 주세요." },
      ] },
    ], closing: { ko: "고마워요! 맛있게 드세요.", gloss: "شكرًا! بالهناء." } },
  kim: { focus: "الماضي الرسمي والأسئلة: -았/었습니다، 입니까؟، والشكر الرسمي.", turns: [
      { ko: "안녕하십니까? 무엇을 도와드릴까요?", gloss: "مرحبًا. كيف أساعدك؟", ask: "أضعت حقيبتك (가방). قل ذلك بالصيغة الرسمية.", options: [
        { ko: "가방을 잃어버렸습니다.", right: true, feedback: "نعم: 잃어버렸습니다، الماضي الرسمي من 잃어버려요 (يضيّع)." },
        { ko: "가방을 잃어버립니다.", right: false, feedback: "잃어버립니다 مضارع: «أضيّع». الأمر حدث: 잃어버렸습니다." },
        { ko: "가방을 잃어버렸어.", right: false, feedback: "잃어버렸어 كلام غير رسمي للأصدقاء المقرّبين. عند المكتب: 잃어버렸습니다." },
      ] },
      { ko: "아, 그렇습니까? 가방이 무슨 색입니까?", gloss: "آه، حقًا؟ ما لون الحقيبة؟", ask: "لونها أسود (검은색).", options: [
        { ko: "검은색입니다.", right: true, feedback: "نعم: 검은색입니다. و 입니다 هي الصيغة الرسمية من 이에요." },
        { ko: "검은색입니까?", right: false, feedback: "입니까؟ صيغة السؤال. أنت تجيب: 검은색입니다." },
        { ko: "검은색 있습니다.", right: false, feedback: "있습니다 تعني «يوجد». لتقول ما هو: 검은색입니다." },
      ] },
      { ko: "잠시만 기다리십시오. 아, 여기 있습니다!", gloss: "لحظة من فضلك. آه، ها هي!", ask: "وجدها. اشكره بالصيغة الرسمية.", options: [
        { ko: "고마워.", right: false, feedback: "고마워 للأصدقاء المقرّبين. الرسمية: 감사합니다." },
        { ko: "실례합니다.", right: false, feedback: "실례합니다 تعني «عفوًا / لو سمحت». الشكر: 감사합니다." },
        { ko: "감사합니다.", right: true, feedback: "نعم: 감사합니다، الشكر الرسمي." },
      ] },
    ], closing: { ko: "천만에요. 안녕히 가십시오.", gloss: "على الرحب والسعة. مع السلامة." } },
  yuna: { focus: "الطلب في المقهى: 한 잔 주세요، هنا أو 포장، و 조금만 주세요.", turns: [
      { ko: "어서 오세요! 오늘은 뭐 드릴까요?", gloss: "أهلًا! ماذا أقدّم لك اليوم؟", ask: "كوب أمريكانو مثلج (아이스 아메리카노) من فضلك.", options: [
        { ko: "아이스 아메리카노 한 잔 주세요.", right: true, feedback: "نعم: 한 잔 주세요. المشروبات تُعدّ بـ 잔 (كوب)." },
        { ko: "아이스 아메리카노 한 개 주세요.", right: false, feedback: "ستفهمك، لكن المشروب يُعدّ بـ 잔 لا بـ 개: 한 잔 주세요." },
        { ko: "아이스 아메리카노 일 잔 주세요.", right: false, feedback: "일 رقم الأسعار. العدّ يستعمل 한: 한 잔." },
      ] },
      { ko: "여기서 드세요?", gloss: "هنا؟", ask: "أجبها: هنا أم للأخذ. الاثنان جائزان.", options: [
        { ko: "네, 여기서요.", right: true, feedback: "نعم: 여기서요 = هنا من فضلك.", reply: { ko: "네, 편한 자리에 앉으세요.", gloss: "بالتأكيد، اجلس حيث تحب." } },
        { ko: "아니요, 포장해 주세요.", right: true, feedback: "نعم: 포장해 주세요 = للأخذ من فضلك.", reply: { ko: "네, 포장해 드릴게요.", gloss: "بالتأكيد، سأجهّزه لك للأخذ." } },
        { ko: "네, 포장해 주세요.", right: false, feedback: "네 تقول «نعم، هنا» ثم تطلب للأخذ. اختر واحدًا: 네, 여기서요 أو 아니요, 포장해 주세요." },
      ] },
      { ko: "사천오백 원입니다. 얼음은 어떻게 해 드릴까요?", gloss: "المجموع 4,500 وون. كيف تريد الثلج؟", ask: "تريد قليلًا من الثلج (얼음) فقط.", options: [
        { ko: "얼음 많이 주세요.", right: false, feedback: "많이 = كثيرًا. القليل فقط: 조금만 주세요." },
        { ko: "얼음 조금만 주세요.", right: true, feedback: "نعم: 조금만 = قليلًا فقط. و 만 تعني «فقط»." },
        { ko: "얼음 조금만 드세요.", right: false, feedback: "드세요 تطلب منها أن تأكله هي. لتطلبه منها: 주세요." },
      ] },
    ], closing: { ko: "네, 알겠습니다! 잠시만 기다려 주세요.", gloss: "حاضر! لحظة من فضلك." } },
  seoyeon: { focus: "الساعة والتقويم معًا: 세 시 반، 무슨 요일، 모레، و 같이 …해요 بمعنى «هيا».", turns: [
      { ko: "안녕하세요! 혹시 지금 몇 시예요?", gloss: "مرحبًا! هل تعرف كم الساعة الآن؟", ask: "الساعة الثالثة والنصف.", options: [
        { ko: "세 시 반이에요.", right: true, feedback: "نعم: 세 시 반. الساعات تستعمل 한، 두، 세، و 반 = نصف." },
        { ko: "삼 시 반이에요.", right: false, feedback: "삼 للدقائق والأسعار. الساعات: 세 시." },
        { ko: "세 분 반이에요.", right: false, feedback: "분 تعني دقيقة. الساعة هي 시: 세 시 반." },
      ] },
      { ko: "벌써요? 수업이 네 시에 시작해요.", gloss: "بهذه السرعة؟ الدرس يبدأ في الرابعة.", ask: "اسألها في أي يوم الامتحان (시험).", options: [
        { ko: "시험이 몇 시예요?", right: false, feedback: "몇 시예요 تسأل عن الساعة. اليوم: 무슨 요일이에요؟" },
        { ko: "시험이 무슨 요일이에요?", right: true, feedback: "نعم: 무슨 요일이에요؟ = أي يوم من الأسبوع؟" },
        { ko: "시험이 어디예요?", right: false, feedback: "어디예요 تسأل عن المكان. اليوم: 무슨 요일이에요؟" },
      ] },
      { ko: "금요일이에요. 오늘이 수요일이니까, 모레예요!", gloss: "الجمعة. اليوم الأربعاء، إذن بعد غد!", ask: "اقترح أن تدرسا معًا غدًا (내일).", options: [
        { ko: "그럼 내일 같이 공부해요.", right: true, feedback: "نعم: 내일 같이 공부해요. 같이 = معًا، وحين تُقال لصديق فإن 공부해요 تعني أيضًا «هيا ندرس»." },
        { ko: "그럼 어제 같이 공부해요.", right: false, feedback: "어제 تعني أمس. غدًا: 내일." },
        { ko: "그럼 내일 같이 공부했어요.", right: false, feedback: "공부했어요 فعل ماضٍ. للغد: 공부해요." },
      ] },
    ], closing: { ko: "좋아요! 내일 세 시에 도서관에서 만나요.", gloss: "رائع! نلتقي غدًا في الثالثة في المكتبة." } },
  taeyang: { focus: "وضع الخطط: -(으)ㄹ 거예요، والردّ على -(으)ㄹ까요؟ بالموافقة أو بـ 못 مع السبب، واقتراح شيء آخر.", turns: [
      { ko: "주말에 뭐 할 거예요?", gloss: "ماذا ستفعل في عطلة الأسبوع؟", ask: "ستلتقي بصديق (친구).", options: [
        { ko: "친구를 만날 거예요.", right: true, feedback: "نعم: 만날 거예요 = سألتقي." },
        { ko: "친구를 만났어요.", right: false, feedback: "만났어요 فعل ماضٍ. للعطلة القادمة: 만날 거예요." },
        { ko: "친구를 만날까요?", right: false, feedback: "만날까요؟ اقتراح: «هل نلتقي؟». لخطتك أنت: 만날 거예요." },
      ] },
      { ko: "좋겠네요! 저는 등산할 거예요. 같이 갈까요?", gloss: "جميل! أنا سأذهب لتسلّق الجبل. هل نذهب معًا؟", ask: "أجبه: يمكنك أن توافق أو أن تعتذر.", options: [
        { ko: "네, 같이 가요!", right: true, feedback: "نعم: 같이 가요 موافقة على اقتراح -(으)ㄹ까요؟", reply: { ko: "좋아요! 그럼 일요일 아침에 만나요.", gloss: "جيد! إذن نلتقي صباح الأحد." } },
        { ko: "미안해요. 약속이 있어서 못 가요.", right: true, feedback: "نعم: 약속이 있어서 = لأن لديّ موعدًا، و 못 가요 = لا أستطيع الذهاب.", reply: { ko: "괜찮아요. 다음에 같이 가요!", gloss: "لا بأس. نذهب معًا في المرة القادمة!" } },
        { ko: "네, 같이 갈 거예요?", right: false, feedback: "갈 거예요؟ تسأله هل سيذهب. للموافقة: 네, 같이 가요!" },
      ] },
      { ko: "아, 그런데 일요일에 비가 올 거예요.", gloss: "آه، لكن ستمطر يوم الأحد.", ask: "اقترح الذهاب إلى مقهى (카페) بدلًا من ذلك.", options: [
        { ko: "그럼 카페에 갔어요.", right: false, feedback: "갔어요 فعل ماضٍ. للاقتراح: 갈까요؟" },
        { ko: "그럼 카페에 가서요.", right: false, feedback: "가서 تترك الجملة ناقصة: «نذهب، ولذلك…». للاقتراح: 갈까요؟" },
        { ko: "그럼 카페에 갈까요?", right: true, feedback: "نعم: 갈까요؟ = هل نذهب؟" },
      ] },
    ], closing: { ko: "좋은 생각이에요! 카페에서 만나요.", gloss: "فكرة جيدة! نلتقي في المقهى." } },
  hana: { focus: "الاستطاعة والمعروف: -(으)ㄹ 수 있어요، و -아/어 주세요 للطلب، و -아/어 드릴게요 للعرض.", turns: [
      { ko: "어, 또 만났네요! 혹시 저 간판 읽을 수 있어요?", gloss: "أوه، التقينا مرة أخرى! هل تستطيع قراءة تلك اللافتة؟", ask: "أنت تستطيع قراءة الهانغل الآن. قل ذلك.", options: [
        { ko: "네, 읽을 수 있어요.", right: true, feedback: "نعم: 읽을 수 있어요 = أستطيع قراءتها." },
        { ko: "네, 읽을 수 없어요.", right: false, feedback: "없어요 تجعلها «لا أستطيع» بعد أن قلت 네. أنت تستطيع: 네, 읽을 수 있어요." },
        { ko: "네, 읽어 주세요.", right: false, feedback: "읽어 주세요 تطلب منها أن تقرأها لك. أنت تستطيع: 읽을 수 있어요." },
      ] },
      { ko: "그럼 좀 읽어 주세요. 안경이 없어서 안 보여요.", gloss: "إذن اقرأها لي من فضلك. ليست معي نظارتي فلا أراها.", ask: "اللافتة تقول إن المحل يفتح في العاشرة. أخبرها.", options: [
        { ko: "십 시에 문을 열어요.", right: false, feedback: "십 للدقائق والأسعار. الساعات: 열 시." },
        { ko: "열 시에 문을 열어요.", right: true, feedback: "نعم: 열 시에 문을 열어요 = يفتح في العاشرة. 열 تعني عشرة و 열어요 تعني «يفتح»: كلمتان مختلفتان." },
        { ko: "열 시에 문을 닫아요.", right: false, feedback: "닫아요 = يغلق. يفتح: 열어요." },
      ] },
      { ko: "아, 고마워요! 사진 좀 찍어 줄 수 있어요?", gloss: "آه، شكرًا! هل يمكنك أن تلتقط لي صورة؟", ask: "بالطبع. اعرض عليها أن تلتقطها.", options: [
        { ko: "네, 찍어 주세요.", right: false, feedback: "찍어 주세요 تطلب منها أن تلتقطها. أنت تعرض: 찍어 드릴게요." },
        { ko: "네, 찍어 드릴게요.", right: true, feedback: "نعم: 찍어 드릴게요 = سألتقطها لك. و 드릴게요 صيغة التواضع من 줄게요." },
        { ko: "네, 찍을 수 없어요.", right: false, feedback: "수 없어요 = لا أستطيع، بعد أن قلت 네. أنت تستطيع: 찍어 드릴게요." },
      ] },
    ], closing: { ko: "하나, 둘, 셋! 고마워요, 정말 친절하네요.", gloss: "واحد، اثنان، ثلاثة! شكرًا، أنت لطيف جدًا." } },
};
/**
 * And with the five people of the later worlds (16 Nov 2026): each at their
 * own world's level, one step on from their first talk.
 */
type LaterId = "cafe" | "cook" | "attendant" | "grandpa" | "grandma";
const EN2B: Record<LaterId, Again> = {
  cafe: { focus: "Habits and free time: 자주 / 매주 와요, 주말에 …을/를 봐요, and a day with 에.", turns: [
      { ko: "어, 또 왔네요! 여기 자주 와요?", gloss: "Oh, you came again! Do you come here often?", ask: "You come every week (매주).", options: [
        { ko: "네, 매주 와요.", right: true, feedback: "Yes: 매주 와요 = I come every week." },
        { ko: "네, 매주 가요.", right: false, feedback: "가요 is going somewhere else. You are here now, so: 와요." },
        { ko: "네, 매주 왔어요.", right: false, feedback: "왔어요 is one visit in the past. A habit takes the present: 매주 와요." },
      ] },
      { ko: "저도요. 여기서 숙제해요. 주말에는 보통 뭐 해요?", gloss: "Me too. I do my homework here. What do you usually do at weekends?", ask: "You watch Korean dramas (한국 드라마).", options: [
        { ko: "한국 드라마를 마셔요.", right: false, feedback: "마셔요 is for drinks. Watching: 봐요." },
        { ko: "한국 드라마를 봐요.", right: true, feedback: "Yes: 봐요 = watch. 드라마를 봐요." },
        { ko: "한국 드라마가 봐요.", right: false, feedback: "That makes the drama the one watching. What you watch takes 를: 드라마를 봐요." },
      ] },
      { ko: "오, 저도 좋아해요! 같이 볼까요?", gloss: "Oh, I like them too! Shall we watch one together?", ask: "Accept, and say Saturday (토요일).", options: [
        { ko: "좋아요! 토요일에 봐요.", right: true, feedback: "Yes: 토요일에 봐요. A day takes 에; said to a friend, 봐요 is also \"let's watch\"." },
        { ko: "좋아요! 토요일에서 봐요.", right: false, feedback: "에서 is for places. A day takes 에: 토요일에." },
        { ko: "좋아요! 토요일에 봤어요.", right: false, feedback: "봤어요 is the past. For the Saturday ahead: 봐요." },
      ] },
    ], closing: { ko: "좋아요! 토요일에 여기서 만나요.", gloss: "Great! Let's meet here on Saturday." } },
  cook: { focus: "Ordering at a stall: 안 맵게 해 주세요, 도 (too), 괜찮아요 to decline, 모두 얼마예요?, and 서비스 (on the house).", turns: [
      { ko: "또 왔네요! 오늘은 떡볶이 어때요?", gloss: "You came again! How about tteokbokki today?", ask: "Yes, but ask her to make it not spicy.", options: [
        { ko: "좋아요! 안 맵게 해 주세요.", right: true, feedback: "Yes: 안 맵게 해 주세요 = please make it not spicy. 맵게 = spicily, 안 = not." },
        { ko: "좋아요! 안 매워요.", right: false, feedback: "안 매워요 says \"it is not spicy\". To ask her: 안 맵게 해 주세요." },
        { ko: "좋아요! 맵게 해 주세요.", right: false, feedback: "That asks for it spicy. Not spicy: 안 맵게 해 주세요." },
      ] },
      { ko: "알겠어요. 김밥도 하나 드릴까요?", gloss: "Got it. Shall I give you a gimbap too?", ask: "Take it or not: both are fine.", options: [
        { ko: "네, 김밥도 하나 주세요.", right: true, feedback: "Yes: 도 = too. 김밥도 하나 주세요.", reply: { ko: "네! 떡볶이하고 김밥 나왔어요.", gloss: "Here you are! Tteokbokki and gimbap." } },
        { ko: "아니요, 괜찮아요.", right: true, feedback: "Yes: 괜찮아요 is the polite \"no, thank you\".", reply: { ko: "네! 떡볶이 나왔어요.", gloss: "Here you are! Your tteokbokki." } },
        { ko: "네, 김밥은 괜찮아요.", right: false, feedback: "네 accepts, and 괜찮아요 declines. One or the other: 네, 김밥도 하나 주세요 — or 아니요, 괜찮아요." },
      ] },
      { ko: "어때요? 안 매워요?", gloss: "How is it? Not spicy?", ask: "It is good. Ask how much it is altogether (모두).", options: [
        { ko: "맛있어요! 모두 몇 개예요?", right: false, feedback: "몇 개예요 asks how many. The price: 얼마예요?" },
        { ko: "맛있어요! 모두 뭐예요?", right: false, feedback: "뭐예요 asks what it is. The price: 얼마예요?" },
        { ko: "맛있어요! 모두 얼마예요?", right: true, feedback: "Yes: 모두 얼마예요? = how much altogether?" },
      ] },
    ], closing: { ko: "오늘은 서비스예요. 다음에 또 와요!", gloss: "Today it is on the house. Come again!" } },
  attendant: { focus: "Changing lines: 까지 가요, 에서 갈아타요, 분쯤 걸려요, and 알겠어요 (not 알아요).", turns: [
      { ko: "안녕하세요! 오늘은 어디까지 가세요?", gloss: "Hello! Where are you going today?", ask: "To Namsan (남산).", options: [
        { ko: "남산까지 가요.", right: true, feedback: "Yes: 남산까지 가요. 까지 = as far as." },
        { ko: "남산부터 가요.", right: false, feedback: "부터 = starting from. Where you are going: 까지." },
        { ko: "남산까지 와요.", right: false, feedback: "와요 is coming here. You are leaving: 가요." },
      ] },
      { ko: "남산은 사호선이에요. 여기는 이호선이니까 갈아타야 해요.", gloss: "Namsan is on Line 4. This is Line 2, so you have to change.", ask: "Ask where you change lines (갈아타요).", options: [
        { ko: "어디까지 갈아타요?", right: false, feedback: "어디까지 asks how far. Where it happens: 어디에서." },
        { ko: "어디에서 갈아타요?", right: true, feedback: "Yes: 어디에서 갈아타요? Where you do something takes 에서." },
        { ko: "어디에서 내려요?", right: false, feedback: "내려요 = get off. Changing lines: 갈아타요." },
      ] },
      { ko: "사당역에서 갈아타세요. 이십 분쯤 걸려요.", gloss: "Change at Sadang station. It takes about twenty minutes.", ask: "Say you have understood, and thank him.", options: [
        { ko: "네, 몰라요. 감사합니다!", right: false, feedback: "몰라요 = I do not know. Understood: 알겠어요." },
        { ko: "네, 알아요. 감사합니다!", right: false, feedback: "알아요 = I know it already, which can sound like \"I knew that\". After being told something new: 알겠어요." },
        { ko: "네, 알겠어요. 감사합니다!", right: true, feedback: "Yes: 알겠어요 = I see, understood." },
      ] },
    ], closing: { ko: "네, 조심히 가세요!", gloss: "Take care on your way!" } },
  grandpa: { focus: "Talking with an elder: 밥 먹었어요? as a greeting, 식사하셨어요? for them, 그런데 (but), and the promise 하겠습니다.", turns: [
      { ko: "오, 또 왔군요! 밥은 먹었어요?", gloss: "Oh, you came again! Have you eaten?", ask: "A Korean greeting. You have eaten: say so, and ask him back politely.", options: [
        { ko: "네, 먹었어요. 할아버지는 식사하셨어요?", right: true, feedback: "Yes: for an elder, 먹다 becomes 식사하시다: 식사하셨어요?" },
        { ko: "네, 먹었어요. 할아버지는 먹었어?", right: false, feedback: "먹었어 is casual, for friends your age or younger. To an elder: 식사하셨어요?" },
        { ko: "네, 먹어요. 할아버지는 식사하셨어요?", right: false, feedback: "먹어요 is \"I eat\" (now, or usually). He asked about before: 먹었어요." },
      ] },
      { ko: "그럼요, 먹었지요. 한국 생활은 어때요?", gloss: "Of course I have. How is life in Korea?", ask: "It is fun, but Korean is difficult (어려워요).", options: [
        { ko: "재미있어요. 그래서 한국어가 어려워요.", right: false, feedback: "그래서 = so: \"it is fun, so Korean is hard\". For \"but\": 그런데." },
        { ko: "재미있어요. 그런데 한국어가 어려워요.", right: true, feedback: "Yes: 그런데 = but. 한국어가 어려워요." },
        { ko: "재미있어요. 그런데 한국어가 쉬워요.", right: false, feedback: "쉬워요 = easy. Difficult: 어려워요." },
      ] },
      { ko: "하하, 천천히 하면 돼요. 매일 조금씩 하세요.", gloss: "Haha, slowly is fine. A little every day.", ask: "Promise him you will work hard.", options: [
        { ko: "네, 열심히 하세요!", right: false, feedback: "하세요 tells him to work hard. Your own promise: 하겠습니다." },
        { ko: "네, 열심히 했습니다!", right: false, feedback: "했습니다 is the past: \"I worked hard\". A promise: 하겠습니다." },
        { ko: "네, 열심히 하겠습니다!", right: true, feedback: "Yes: 하겠습니다 = I will, a polite promise." },
      ] },
    ], closing: { ko: "그래요, 또 놀러 와요!", gloss: "Good. Come and visit again!" } },
  grandma: { focus: "Weather and seasons: 추워요 / 더워요, 맑아요 / 흐려요, 봄 · 여름 · 가을 · 겨울, and accepting an offer with -아/어 주세요.", turns: [
      { ko: "어머, 또 만났네요! 오늘은 좀 춥지요?", gloss: "Oh my, we meet again! It is a little cold today, isn't it?", ask: "Agree: it is cold, but the sky is clear.", options: [
        { ko: "네, 추워요. 그런데 하늘이 맑아요.", right: true, feedback: "Yes: 추워요 = it is cold; 하늘이 맑아요 = the sky is clear." },
        { ko: "네, 더워요. 그런데 하늘이 맑아요.", right: false, feedback: "더워요 = hot. She said cold: 추워요." },
        { ko: "네, 추워요. 그런데 하늘이 흐려요.", right: false, feedback: "흐려요 = cloudy. Clear: 맑아요." },
      ] },
      { ko: "그렇지요? 가을에는 단풍이 정말 예뻐요. 어느 계절을 좋아해요?", gloss: "Isn't it? In autumn the leaves are really pretty. Which season do you like?", ask: "Name the season you like: spring or winter.", options: [
        { ko: "봄을 좋아해요.", right: true, feedback: "Yes: 봄 = spring. 봄을 좋아해요.", reply: { ko: "봄에는 여기 벚꽃이 피어요.", gloss: "In spring the cherry blossoms bloom here." } },
        { ko: "계절을 좋아해요.", right: false, feedback: "That says \"I like seasons\". Name one: 봄 (spring), 여름 (summer), 가을 (autumn), 겨울 (winter)." },
        { ko: "겨울을 좋아해요.", right: true, feedback: "Yes: 겨울 = winter. 겨울을 좋아해요.", reply: { ko: "겨울에는 여기 눈이 많이 와요.", gloss: "In winter it snows a lot here." } },
      ] },
      { ko: "그때 또 오세요. 아, 사진 한 장 찍어 줄까요?", gloss: "Come again then. Oh, shall I take a photo of you?", ask: "Accept her offer, and thank her.", options: [
        { ko: "네, 찍어 드릴게요. 감사합니다!", right: false, feedback: "찍어 드릴게요 offers to take one of her. She offered; to accept: 찍어 주세요." },
        { ko: "네, 찍어 주세요. 감사합니다!", right: true, feedback: "Yes: 찍어 주세요 = please take one for me." },
        { ko: "네, 찍으세요. 감사합니다!", right: false, feedback: "찍으세요 is an instruction. Accepting a favour: 찍어 주세요." },
      ] },
    ], closing: { ko: "자, 하나, 둘, 셋! 잘 나왔어요.", gloss: "Now: one, two, three! It came out well." } },
};
const AR2B: Record<LaterId, Again> = {
  cafe: { focus: "العادات ووقت الفراغ: 자주 / 매주 와요، و 주말에 …을/를 봐요، واليوم مع 에.", turns: [
      { ko: "어, 또 왔네요! 여기 자주 와요?", gloss: "أوه، جئت مرة أخرى! هل تأتي إلى هنا كثيرًا؟", ask: "تأتي كل أسبوع (매주).", options: [
        { ko: "네, 매주 와요.", right: true, feedback: "نعم: 매주 와요 = آتي كل أسبوع." },
        { ko: "네, 매주 가요.", right: false, feedback: "가요 للذهاب إلى مكان آخر. أنت هنا الآن، إذن: 와요." },
        { ko: "네, 매주 왔어요.", right: false, feedback: "왔어요 زيارة واحدة في الماضي. العادة تأخذ المضارع: 매주 와요." },
      ] },
      { ko: "저도요. 여기서 숙제해요. 주말에는 보통 뭐 해요?", gloss: "وأنا كذلك. أحلّ واجباتي هنا. ماذا تفعل عادةً في عطلة الأسبوع؟", ask: "تشاهد المسلسلات الكورية (한국 드라마).", options: [
        { ko: "한국 드라마를 마셔요.", right: false, feedback: "마셔요 للمشروبات. المشاهدة: 봐요." },
        { ko: "한국 드라마를 봐요.", right: true, feedback: "نعم: 봐요 = أشاهد. 드라마를 봐요." },
        { ko: "한국 드라마가 봐요.", right: false, feedback: "هكذا يصبح المسلسل هو الذي يشاهد. ما تشاهده يأخذ 를: 드라마를 봐요." },
      ] },
      { ko: "오, 저도 좋아해요! 같이 볼까요?", gloss: "أوه، وأنا أحبها أيضًا! هل نشاهد معًا؟", ask: "وافق، واقترح يوم السبت (토요일).", options: [
        { ko: "좋아요! 토요일에 봐요.", right: true, feedback: "نعم: 토요일에 봐요. اليوم يأخذ 에، وحين تُقال لصديق فإن 봐요 تعني أيضًا «هيا نشاهد»." },
        { ko: "좋아요! 토요일에서 봐요.", right: false, feedback: "에서 للأماكن. اليوم يأخذ 에: 토요일에." },
        { ko: "좋아요! 토요일에 봤어요.", right: false, feedback: "봤어요 فعل ماضٍ. للسبت القادم: 봐요." },
      ] },
    ], closing: { ko: "좋아요! 토요일에 여기서 만나요.", gloss: "رائع! نلتقي هنا يوم السبت." } },
  cook: { focus: "الطلب عند البسطة: 안 맵게 해 주세요، و 도 (أيضًا)، و 괜찮아요 للاعتذار، و 모두 얼마예요؟، و 서비스 (على حساب المحل).", turns: [
      { ko: "또 왔네요! 오늘은 떡볶이 어때요?", gloss: "جئت مرة أخرى! ما رأيك في التوكبوكي اليوم؟", ask: "نعم، لكن اطلب منها ألا تجعله حارًّا.", options: [
        { ko: "좋아요! 안 맵게 해 주세요.", right: true, feedback: "نعم: 안 맵게 해 주세요 = اجعليه غير حارّ من فضلك. 맵게 = بشكل حارّ، و 안 = ليس." },
        { ko: "좋아요! 안 매워요.", right: false, feedback: "안 매워요 تقول «ليس حارًّا». لتطلب منها: 안 맵게 해 주세요." },
        { ko: "좋아요! 맵게 해 주세요.", right: false, feedback: "هكذا تطلبه حارًّا. غير حارّ: 안 맵게 해 주세요." },
      ] },
      { ko: "알겠어요. 김밥도 하나 드릴까요?", gloss: "حاضر. هل أعطيك كيمباب أيضًا؟", ask: "خذه أو لا: الاثنان جائزان.", options: [
        { ko: "네, 김밥도 하나 주세요.", right: true, feedback: "نعم: 도 = أيضًا. 김밥도 하나 주세요.", reply: { ko: "네! 떡볶이하고 김밥 나왔어요.", gloss: "تفضّل! التوكبوكي والكيمباب." } },
        { ko: "아니요, 괜찮아요.", right: true, feedback: "نعم: 괜찮아요 هي «لا، شكرًا» المهذّبة.", reply: { ko: "네! 떡볶이 나왔어요.", gloss: "تفضّل! التوكبوكي." } },
        { ko: "네, 김밥은 괜찮아요.", right: false, feedback: "네 موافقة و 괜찮아요 اعتذار. اختر واحدًا: 네, 김밥도 하나 주세요 أو 아니요, 괜찮아요." },
      ] },
      { ko: "어때요? 안 매워요?", gloss: "كيف هو؟ ليس حارًّا؟", ask: "إنه لذيذ. اسأل عن السعر كله (모두).", options: [
        { ko: "맛있어요! 모두 몇 개예요?", right: false, feedback: "몇 개예요 تسأل عن العدد. السعر: 얼마예요؟" },
        { ko: "맛있어요! 모두 뭐예요?", right: false, feedback: "뭐예요 تسأل «ما هذا؟». السعر: 얼마예요؟" },
        { ko: "맛있어요! 모두 얼마예요?", right: true, feedback: "نعم: 모두 얼마예요؟ = كم المجموع؟" },
      ] },
    ], closing: { ko: "오늘은 서비스예요. 다음에 또 와요!", gloss: "اليوم على حساب المحل. تعال مرة أخرى!" } },
  attendant: { focus: "تبديل الخطوط: 까지 가요، و 에서 갈아타요، و 분쯤 걸려요، و 알겠어요 (لا 알아요).", turns: [
      { ko: "안녕하세요! 오늘은 어디까지 가세요?", gloss: "مرحبًا! إلى أين تذهب اليوم؟", ask: "إلى نامسان (남산).", options: [
        { ko: "남산까지 가요.", right: true, feedback: "نعم: 남산까지 가요. و 까지 = حتى / إلى." },
        { ko: "남산부터 가요.", right: false, feedback: "부터 = ابتداءً من. وجهتك: 까지." },
        { ko: "남산까지 와요.", right: false, feedback: "와요 للمجيء إلى هنا. أنت مغادر: 가요." },
      ] },
      { ko: "남산은 사호선이에요. 여기는 이호선이니까 갈아타야 해요.", gloss: "نامسان على الخط الرابع. هذا الخط الثاني، فعليك أن تبدّل.", ask: "اسأل أين تبدّل الخط (갈아타요).", options: [
        { ko: "어디까지 갈아타요?", right: false, feedback: "어디까지 تسأل «إلى أين». مكان الفعل: 어디에서." },
        { ko: "어디에서 갈아타요?", right: true, feedback: "نعم: 어디에서 갈아타요؟ مكان الفعل يأخذ 에서." },
        { ko: "어디에서 내려요?", right: false, feedback: "내려요 = أنزل. تبديل الخط: 갈아타요." },
      ] },
      { ko: "사당역에서 갈아타세요. 이십 분쯤 걸려요.", gloss: "بدّل في محطة سادانغ. يستغرق نحو عشرين دقيقة.", ask: "قل إنك فهمت، واشكره.", options: [
        { ko: "네, 몰라요. 감사합니다!", right: false, feedback: "몰라요 = لا أعرف. فهمت: 알겠어요." },
        { ko: "네, 알아요. 감사합니다!", right: false, feedback: "알아요 = أعرف ذلك مسبقًا، وقد تُفهم «كنت أعرف». بعد أن تُخبَر بشيء جديد: 알겠어요." },
        { ko: "네, 알겠어요. 감사합니다!", right: true, feedback: "نعم: 알겠어요 = فهمت." },
      ] },
    ], closing: { ko: "네, 조심히 가세요!", gloss: "انتبه لنفسك في الطريق!" } },
  grandpa: { focus: "الحديث مع كبير السن: 밥 먹었어요؟ كتحية، و 식사하셨어요؟ له، و 그런데 (لكن)، والوعد 하겠습니다.", turns: [
      { ko: "오, 또 왔군요! 밥은 먹었어요?", gloss: "أوه، جئت مرة أخرى! هل أكلت؟", ask: "تحية كورية. لقد أكلت: قل ذلك، واسأله بأدب.", options: [
        { ko: "네, 먹었어요. 할아버지는 식사하셨어요?", right: true, feedback: "نعم: مع كبير السن تصير 먹다 식사하시다: 식사하셨어요؟" },
        { ko: "네, 먹었어요. 할아버지는 먹었어?", right: false, feedback: "먹었어 كلام غير رسمي لمن في سنّك أو أصغر. لكبير السن: 식사하셨어요؟" },
        { ko: "네, 먹어요. 할아버지는 식사하셨어요?", right: false, feedback: "먹어요 تعني «آكل» (الآن أو عادةً). هو سأل عمّا مضى: 먹었어요." },
      ] },
      { ko: "그럼요, 먹었지요. 한국 생활은 어때요?", gloss: "بالطبع أكلت. كيف الحياة في كوريا؟", ask: "ممتعة، لكن الكورية صعبة (어려워요).", options: [
        { ko: "재미있어요. 그래서 한국어가 어려워요.", right: false, feedback: "그래서 = لذلك: «ممتعة، لذلك الكورية صعبة». لمعنى «لكن»: 그런데." },
        { ko: "재미있어요. 그런데 한국어가 어려워요.", right: true, feedback: "نعم: 그런데 = لكن. 한국어가 어려워요." },
        { ko: "재미있어요. 그런데 한국어가 쉬워요.", right: false, feedback: "쉬워요 = سهلة. صعبة: 어려워요." },
      ] },
      { ko: "하하, 천천히 하면 돼요. 매일 조금씩 하세요.", gloss: "هاها، على مهلك. قليلًا كل يوم.", ask: "عِده بأنك ستجتهد.", options: [
        { ko: "네, 열심히 하세요!", right: false, feedback: "하세요 تطلب منه هو أن يجتهد. وعدك أنت: 하겠습니다." },
        { ko: "네, 열심히 했습니다!", right: false, feedback: "했습니다 فعل ماضٍ: «اجتهدت». الوعد: 하겠습니다." },
        { ko: "네, 열심히 하겠습니다!", right: true, feedback: "نعم: 하겠습니다 = سأفعل، وعد مهذّب." },
      ] },
    ], closing: { ko: "그래요, 또 놀러 와요!", gloss: "حسنًا. تعال لزيارتي مرة أخرى!" } },
  grandma: { focus: "الطقس والفصول: 추워요 / 더워요، و 맑아요 / 흐려요، و 봄 · 여름 · 가을 · 겨울، وقبول العرض بـ -아/어 주세요.", turns: [
      { ko: "어머, 또 만났네요! 오늘은 좀 춥지요?", gloss: "يا إلهي، التقينا مرة أخرى! الجو بارد قليلًا اليوم، أليس كذلك؟", ask: "وافقها: الجو بارد، لكن السماء صافية.", options: [
        { ko: "네, 추워요. 그런데 하늘이 맑아요.", right: true, feedback: "نعم: 추워요 = الجو بارد، و 하늘이 맑아요 = السماء صافية." },
        { ko: "네, 더워요. 그런데 하늘이 맑아요.", right: false, feedback: "더워요 = حارّ. هي قالت بارد: 추워요." },
        { ko: "네, 추워요. 그런데 하늘이 흐려요.", right: false, feedback: "흐려요 = غائمة. صافية: 맑아요." },
      ] },
      { ko: "그렇지요? 가을에는 단풍이 정말 예뻐요. 어느 계절을 좋아해요?", gloss: "أليس كذلك؟ في الخريف أوراق الشجر جميلة جدًا. أي فصل تحب؟", ask: "سمِّ الفصل الذي تحبه: الربيع أو الشتاء.", options: [
        { ko: "봄을 좋아해요.", right: true, feedback: "نعم: 봄 = الربيع. 봄을 좋아해요.", reply: { ko: "봄에는 여기 벚꽃이 피어요.", gloss: "في الربيع تتفتح أزهار الكرز هنا." } },
        { ko: "계절을 좋아해요.", right: false, feedback: "هكذا تقول «أحب الفصول». سمِّ واحدًا: 봄 (الربيع)، 여름 (الصيف)، 가을 (الخريف)، 겨울 (الشتاء)." },
        { ko: "겨울을 좋아해요.", right: true, feedback: "نعم: 겨울 = الشتاء. 겨울을 좋아해요.", reply: { ko: "겨울에는 여기 눈이 많이 와요.", gloss: "في الشتاء يتساقط الثلج كثيرًا هنا." } },
      ] },
      { ko: "그때 또 오세요. 아, 사진 한 장 찍어 줄까요?", gloss: "تعال حينها مرة أخرى. آه، هل ألتقط لك صورة؟", ask: "اقبل عرضها واشكرها.", options: [
        { ko: "네, 찍어 드릴게요. 감사합니다!", right: false, feedback: "찍어 드릴게요 عرض منك أن تصوّرها أنت. هي التي عرضت؛ للقبول: 찍어 주세요." },
        { ko: "네, 찍어 주세요. 감사합니다!", right: true, feedback: "نعم: 찍어 주세요 = التقطي لي صورة من فضلك." },
        { ko: "네, 찍으세요. 감사합니다!", right: false, feedback: "찍으세요 أمر مباشر. لقبول معروف: 찍어 주세요." },
      ] },
    ], closing: { ko: "자, 하나, 둘, 셋! 잘 나왔어요.", gloss: "هيا: واحد، اثنان، ثلاثة! خرجت الصورة جميلة." } },
};
/** And with the three people a beginner meets first (16 Nov 2026), still with the sounds written out. */
type FirstId = "gardener" | "neighbour" | "painter";
const EN2C: Record<FirstId, Again> = {
  gardener: { focus: "Thank you and a first question: 감사합니다 (thanks), 죄송합니다 (sorry), and 이거 뭐예요? (what is this?).", turns: [
      { ko: "안녕하세요! 또 왔어요?", roman: "annyeonghaseyo! tto wasseoyo?", gloss: "Hello! You came again?", ask: "Say yes, and greet him.", options: [
        { ko: "네, 안녕하세요!", roman: "ne, annyeonghaseyo!", right: true, feedback: "Yes: 네 = yes, and a greeting is answered with a greeting." },
        { ko: "아니요, 안녕하세요!", roman: "aniyo, annyeonghaseyo!", right: false, feedback: "아니요 = no, but you did come. 네, 안녕하세요!" },
        { ko: "네, 안녕히 계세요!", roman: "ne, annyeonghi gyeseyo!", right: false, feedback: "안녕히 계세요 is a goodbye. Hello: 안녕하세요!" },
      ] },
      { ko: "이거 받으세요. 꽃이에요.", roman: "igeo badeuseyo. kkochieyo.", gloss: "Take this. It is a flower.", ask: "He gives you a flower. Thank him.", options: [
        { ko: "죄송합니다!", roman: "joesonghamnida!", right: false, feedback: "죄송합니다 = I am sorry. Thank you: 감사합니다!" },
        { ko: "감사합니다!", roman: "gamsahamnida!", right: true, feedback: "Yes: 감사합니다 = thank you." },
        { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: false, feedback: "That is hello again. Thank you: 감사합니다!" },
      ] },
      { ko: "꽃 이름은 무궁화예요.", roman: "kkot ireumeun mugunghwayeyo.", gloss: "The flower's name is mugunghwa.", ask: "There is a tree beside him. Ask what it is.", options: [
        { ko: "이거 꽃이에요.", roman: "igeo kkochieyo.", right: false, feedback: "That says \"this is a flower\". To ask: 이거 뭐예요?" },
        { ko: "저는 뭐예요?", roman: "jeoneun mwoyeyo?", right: false, feedback: "That asks \"what am I?\". 이거 = this: 이거 뭐예요?" },
        { ko: "이거 뭐예요?", roman: "igeo mwoyeyo?", right: true, feedback: "Yes: 이거 = this, 뭐예요? = what is it?" },
      ] },
    ], closing: { ko: "그건 소나무예요. 또 오세요!", roman: "geugeon sonamuyeyo. tto oseyo!", gloss: "That is a pine tree. Come again!" } },
  neighbour: { focus: "A little more about you: 한국어 (Korean) and 한국 (Korea), 재미있어요 / 조금 어려워요, and 물 주세요 (water, please).", turns: [
      { ko: "안녕하세요! 오늘도 공부해요?", roman: "annyeonghaseyo! oneuldo gongbuhaeyo?", gloss: "Hello! Studying today too?", ask: "Yes: you study Korean (한국어, hangugeo).", options: [
        { ko: "네, 한국어 공부해요.", roman: "ne, hangugeo gongbuhaeyo.", right: true, feedback: "Yes: 한국어 = Korean, the language. 공부해요 = study." },
        { ko: "네, 한국 공부해요.", roman: "ne, hanguk gongbuhaeyo.", right: false, feedback: "한국 is Korea, the country. The language: 한국어." },
        { ko: "아니요, 한국어 공부해요.", roman: "aniyo, hangugeo gongbuhaeyo.", right: false, feedback: "아니요 = no, and then you say you do. 네, 한국어 공부해요." },
      ] },
      { ko: "한국어 재미있어요?", roman: "hangugeo jaemiisseoyo?", gloss: "Is Korean fun?", ask: "Answer truly: fun, or a little difficult.", options: [
        { ko: "네, 재미있어요!", roman: "ne, jaemiisseoyo!", right: true, feedback: "Yes: 재미있어요 = it is fun.", reply: { ko: "좋아요! 매일 조금씩 해요.", roman: "joayo! maeil jogeumssik haeyo.", gloss: "Good! A little every day." } },
        { ko: "네, 학생이에요.", roman: "ne, haksaeng-ieyo.", right: false, feedback: "That says \"yes, I am a student\". She asked whether it is fun: 재미있어요, or 조금 어려워요." },
        { ko: "조금 어려워요.", roman: "jogeum eoryeowoyo.", right: true, feedback: "Yes: 조금 = a little, 어려워요 = difficult. An honest answer.", reply: { ko: "괜찮아요. 천천히 해요.", roman: "gwaenchanayo. cheoncheonhi haeyo.", gloss: "That is all right. Take it slowly." } },
      ] },
      { ko: "물 드릴까요?", roman: "mul deurilkkayo?", gloss: "Shall I give you some water?", ask: "Yes, please: ask for water (물, mul).", options: [
        { ko: "네, 물이에요.", roman: "ne, murieyo.", right: false, feedback: "That says \"yes, it is water\". To ask for it: 물 주세요." },
        { ko: "네, 물 주세요.", roman: "ne, mul juseyo.", right: true, feedback: "Yes: 물 = water, 주세요 = please give me." },
        { ko: "아니요, 물 주세요.", roman: "aniyo, mul juseyo.", right: false, feedback: "아니요 = no, and then you ask for it. 네, 물 주세요." },
      ] },
    ], closing: { ko: "여기 있어요. 또 봐요!", roman: "yeogi isseoyo. tto bwayo!", gloss: "Here you are. See you again!" } },
  painter: { focus: "More reading: ㅂ ㅅ with ㅣ ㅓ, and a letter underneath (받침): 문.", turns: [
      { ko: "또 왔어요? 새 간판이에요!", roman: "tto wasseoyo? sae ganpanieyo!", gloss: "You came again? A new sign!", show: "비", ask: "Read it.", options: [
        { ko: "ba", right: false, feedback: "ㅏ is a. This vowel is ㅣ (i): 비 is bi." },
        { ko: "bi", right: true, feedback: "Yes: ㅂ (b) + ㅣ (i) = 비, bi. It means rain." },
        { ko: "si", right: false, feedback: "ㅅ is s. This first letter is ㅂ (b): 비 is bi." },
      ] },
      { ko: "잘했어요! 이건요?", roman: "jalhaesseoyo! igeonyo?", gloss: "Well done! And this one?", show: "서", ask: "This one is his own family name. Read it.", options: [
        { ko: "seo", right: true, feedback: "Yes: ㅅ (s) + ㅓ (eo) = 서, seo. Mr. Seo's own name." },
        { ko: "so", right: false, feedback: "ㅗ is o. This vowel is ㅓ (eo), with its small line pointing left: 서 is seo." },
        { ko: "neo", right: false, feedback: "ㄴ is n. This first letter is ㅅ (s): 서 is seo." },
      ] },
      { ko: "하하, 맞아요! 마지막은 어려워요.", roman: "haha, majayo! majimageun eoryeowoyo.", gloss: "Haha, right! The last one is hard.", show: "문", ask: "Three letters: one sits underneath. Read it.", options: [
        { ko: "mu", right: false, feedback: "That leaves out the letter underneath, ㄴ (n): 문 is mun." },
        { ko: "num", right: false, feedback: "Read from the top: ㅁ (m) first, ㄴ (n) last: 문 is mun." },
        { ko: "mun", right: true, feedback: "Yes: ㅁ (m) + ㅜ (u), with ㄴ (n) underneath = 문, mun. It means door." },
      ] },
    ], closing: { ko: "와, 받침도 읽어요! 대단해요.", roman: "wa, batchimdo ilgeoyo! daedanhaeyo.", gloss: "Wow, you read the letter underneath too! Amazing." } },
};
const AR2C: Record<FirstId, Again> = {
  gardener: { focus: "الشكر وأول سؤال: 감사합니다 (شكرًا)، 죄송합니다 (آسف)، و 이거 뭐예요؟ (ما هذا؟).", turns: [
      { ko: "안녕하세요! 또 왔어요?", roman: "annyeonghaseyo! tto wasseoyo?", gloss: "مرحبًا! جئت مرة أخرى؟", ask: "قل نعم، وحيِّه.", options: [
        { ko: "네, 안녕하세요!", roman: "ne, annyeonghaseyo!", right: true, feedback: "نعم: 네 = نعم، والتحية تُردّ بتحية." },
        { ko: "아니요, 안녕하세요!", roman: "aniyo, annyeonghaseyo!", right: false, feedback: "아니요 = لا، لكنك جئت فعلًا. الصحيح: 네, 안녕하세요!" },
        { ko: "네, 안녕히 계세요!", roman: "ne, annyeonghi gyeseyo!", right: false, feedback: "안녕히 계세요 وداع. التحية: 안녕하세요!" },
      ] },
      { ko: "이거 받으세요. 꽃이에요.", roman: "igeo badeuseyo. kkochieyo.", gloss: "خذ هذه. إنها زهرة.", ask: "يعطيك زهرة. اشكره.", options: [
        { ko: "죄송합니다!", roman: "joesonghamnida!", right: false, feedback: "죄송합니다 = آسف. الشكر: 감사합니다!" },
        { ko: "감사합니다!", roman: "gamsahamnida!", right: true, feedback: "نعم: 감사합니다 = شكرًا." },
        { ko: "안녕하세요!", roman: "annyeonghaseyo!", right: false, feedback: "هذه تحية مرة أخرى. الشكر: 감사합니다!" },
      ] },
      { ko: "꽃 이름은 무궁화예요.", roman: "kkot ireumeun mugunghwayeyo.", gloss: "اسم الزهرة موغونغهوا.", ask: "بجانبه شجرة. اسأل ما هي.", options: [
        { ko: "이거 꽃이에요.", roman: "igeo kkochieyo.", right: false, feedback: "هكذا تقول «هذه زهرة». للسؤال: 이거 뭐예요؟" },
        { ko: "저는 뭐예요?", roman: "jeoneun mwoyeyo?", right: false, feedback: "هكذا تسأل «ما أنا؟». 이거 = هذا: 이거 뭐예요؟" },
        { ko: "이거 뭐예요?", roman: "igeo mwoyeyo?", right: true, feedback: "نعم: 이거 = هذا، و 뭐예요؟ = ما هو؟" },
      ] },
    ], closing: { ko: "그건 소나무예요. 또 오세요!", roman: "geugeon sonamuyeyo. tto oseyo!", gloss: "تلك شجرة صنوبر. تعال مرة أخرى!" } },
  neighbour: { focus: "المزيد عن نفسك: 한국어 (اللغة الكورية) و 한국 (كوريا)، و 재미있어요 / 조금 어려워요، و 물 주세요 (ماء من فضلك).", turns: [
      { ko: "안녕하세요! 오늘도 공부해요?", roman: "annyeonghaseyo! oneuldo gongbuhaeyo?", gloss: "مرحبًا! تدرس اليوم أيضًا؟", ask: "نعم: تدرس الكورية (한국어، hangugeo).", options: [
        { ko: "네, 한국어 공부해요.", roman: "ne, hangugeo gongbuhaeyo.", right: true, feedback: "نعم: 한국어 = اللغة الكورية. و 공부해요 = أدرس." },
        { ko: "네, 한국 공부해요.", roman: "ne, hanguk gongbuhaeyo.", right: false, feedback: "한국 هي كوريا، البلد. اللغة: 한국어." },
        { ko: "아니요, 한국어 공부해요.", roman: "aniyo, hangugeo gongbuhaeyo.", right: false, feedback: "아니요 = لا، ثم تقول إنك تدرس. الصحيح: 네, 한국어 공부해요." },
      ] },
      { ko: "한국어 재미있어요?", roman: "hangugeo jaemiisseoyo?", gloss: "هل الكورية ممتعة؟", ask: "أجب بصدق: ممتعة، أو صعبة قليلًا.", options: [
        { ko: "네, 재미있어요!", roman: "ne, jaemiisseoyo!", right: true, feedback: "نعم: 재미있어요 = ممتعة.", reply: { ko: "좋아요! 매일 조금씩 해요.", roman: "joayo! maeil jogeumssik haeyo.", gloss: "جيد! قليلًا كل يوم." } },
        { ko: "네, 학생이에요.", roman: "ne, haksaeng-ieyo.", right: false, feedback: "هكذا تقول «نعم، أنا طالب». هي سألت هل هي ممتعة: 재미있어요 أو 조금 어려워요." },
        { ko: "조금 어려워요.", roman: "jogeum eoryeowoyo.", right: true, feedback: "نعم: 조금 = قليلًا، و 어려워요 = صعبة. جواب صادق.", reply: { ko: "괜찮아요. 천천히 해요.", roman: "gwaenchanayo. cheoncheonhi haeyo.", gloss: "لا بأس. على مهلك." } },
      ] },
      { ko: "물 드릴까요?", roman: "mul deurilkkayo?", gloss: "هل أعطيك ماءً؟", ask: "نعم من فضلك: اطلب الماء (물، mul).", options: [
        { ko: "네, 물이에요.", roman: "ne, murieyo.", right: false, feedback: "هكذا تقول «نعم، إنه ماء». لتطلبه: 물 주세요." },
        { ko: "네, 물 주세요.", roman: "ne, mul juseyo.", right: true, feedback: "نعم: 물 = ماء، و 주세요 = أعطني من فضلك." },
        { ko: "아니요, 물 주세요.", roman: "aniyo, mul juseyo.", right: false, feedback: "아니요 = لا، ثم تطلبه. الصحيح: 네, 물 주세요." },
      ] },
    ], closing: { ko: "여기 있어요. 또 봐요!", roman: "yeogi isseoyo. tto bwayo!", gloss: "تفضّل. أراك مرة أخرى!" } },
  painter: { focus: "قراءة أكثر: ㅂ ㅅ مع ㅣ ㅓ، وحرف في الأسفل (받침): 문.", turns: [
      { ko: "또 왔어요? 새 간판이에요!", roman: "tto wasseoyo? sae ganpanieyo!", gloss: "جئت مرة أخرى؟ لافتة جديدة!", show: "비", ask: "اقرأها.", options: [
        { ko: "ba", right: false, feedback: "ㅏ هو a. هذا الحرف الصوتي ㅣ (i): 비 تُقرأ bi." },
        { ko: "bi", right: true, feedback: "نعم: ㅂ (b) + ㅣ (i) = 비، bi. ومعناها مطر." },
        { ko: "si", right: false, feedback: "ㅅ هو s. الحرف الأول هنا ㅂ (b): 비 تُقرأ bi." },
      ] },
      { ko: "잘했어요! 이건요?", roman: "jalhaesseoyo! igeonyo?", gloss: "أحسنت! وهذه؟", show: "서", ask: "هذه اسم عائلته هو. اقرأها.", options: [
        { ko: "seo", right: true, feedback: "نعم: ㅅ (s) + ㅓ (eo) = 서، seo. اسم السيد سو نفسه." },
        { ko: "so", right: false, feedback: "ㅗ هو o. هذا الحرف ㅓ (eo)، وخطّه الصغير يتجه يسارًا: 서 تُقرأ seo." },
        { ko: "neo", right: false, feedback: "ㄴ هو n. الحرف الأول هنا ㅅ (s): 서 تُقرأ seo." },
      ] },
      { ko: "하하, 맞아요! 마지막은 어려워요.", roman: "haha, majayo! majimageun eoryeowoyo.", gloss: "هاها، صحيح! الأخيرة صعبة.", show: "문", ask: "ثلاثة حروف: واحد منها في الأسفل. اقرأها.", options: [
        { ko: "mu", right: false, feedback: "هكذا تترك الحرف الذي في الأسفل ㄴ (n): 문 تُقرأ mun." },
        { ko: "num", right: false, feedback: "اقرأ من الأعلى: ㅁ (m) أولًا و ㄴ (n) آخرًا: 문 تُقرأ mun." },
        { ko: "mun", right: true, feedback: "نعم: ㅁ (m) + ㅜ (u) وتحتهما ㄴ (n) = 문، mun. ومعناها باب." },
      ] },
    ], closing: { ko: "와, 받침도 읽어요! 대단해요.", roman: "wa, batchimdo ilgeoyo! daedanhaeyo.", gloss: "واو، تقرأ الحرف السفلي أيضًا! مذهل." } },
};
/** Everyone who has a second talk, along the road. */
export type SecondId = FirstId | FriendId | LaterId;
export const SECOND_ORDER: readonly SecondId[] = ["gardener", "neighbour", "painter", ...CHAT_ORDER, "cafe", "cook", "attendant", "grandpa", "grandma"];
export const hasSecond = (id: ChatId): id is SecondId => (SECOND_ORDER as readonly string[]).includes(id);
const again = (first: Record<ChatId, Chat>, more: Record<SecondId, Again>) => Object.fromEntries(SECOND_ORDER.map((id) => [id, { ...first[id], ...more[id] }])) as Record<SecondId, Chat>;
export const CHATS2: Record<WorldLang, Record<SecondId, Chat>> = { en: again(EN, { ...EN2C, ...EN2, ...EN2B }), ar: again(AR, { ...AR2C, ...AR2, ...AR2B }) };

/** Saved in worldState.met once the second talk is finished. */
export const chatAgainKey = (id: ChatId): string => `chat2-${id}`;
/** Is it the second talk now? (They are a friend already, and there is more to say.) */
export const chatAgain = (id: ChatId, met: readonly string[]): boolean => hasSecond(id) && met.includes(chatMetKey(id));
/** The conversation to hold with this person now. */
export const chatOf = (lang: WorldLang, id: ChatId, second: boolean): Chat => (second && hasSecond(id) ? CHATS2[lang][id] : CHATS[lang][id]);

/**
 * The recorded file of one of a person's lines (public/assets/world/voice/chat):
 * "<chat>-<turn>" for what they say, "<chat>-<turn>-r<option>" for their answer
 * to a reply, "<chat>-end" for the goodbye; the second talk's files are
 * "<chat>2-…". Each person has one voice of their own. Undefined when the
 * line is not theirs.
 */
export function chatClip(id: ChatId, ko: string): string | undefined {
  const talks: [string, Chat][] = [[id, CHATS.en[id]]];
  if (hasSecond(id)) talks.push([`${id}2`, CHATS2.en[id]]);
  for (const [name, c] of talks) {
    if (c.closing.ko === ko) return `chat/${name}-end.mp3`;
    for (let t = 0; t < c.turns.length; t++) {
      if (c.turns[t].ko === ko) return `chat/${name}-${t}.mp3`;
      const o = c.turns[t].options.findIndex((x) => x.right && x.reply?.ko === ko);
      if (o >= 0) return `chat/${name}-${t}-r${o}.mp3`;
    }
  }
  return undefined;
}

/** Every recorded line of a person's conversations (for the test that each file exists). */
export function chatClips(id: ChatId): string[] {
  const talks = hasSecond(id) ? [CHATS.en[id], CHATS2.en[id]] : [CHATS.en[id]];
  const all = talks.flatMap((c) => [...c.turns.flatMap((t) => [t.ko, ...t.options.flatMap((o) => (o.right && o.reply ? [o.reply.ko] : []))]), c.closing.ko]);
  return [...new Set(all.map((ko) => chatClip(id, ko)!))];
}
