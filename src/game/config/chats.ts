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
        ask: "You do.",
        options: [
          { ko: "네, 좋아해요.", right: true, feedback: "Yes: 네, 좋아해요. 좋아해요 = (I) like it." },
          { ko: "아니요, 좋아해요.", right: false, feedback: "아니요 means no, and then it says you like it. Yes is 네: 네, 좋아해요." },
          { ko: "네, 커피예요.", right: false, feedback: "That says \"yes, it is coffee\". To say you like it: 네, 좋아해요." },
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
        ask: "It is a little spicy, but you like it.",
        options: [
          { ko: "조금 매워요. 하지만 맛있어요!", right: true, feedback: "Yes: 매워요 = spicy, 하지만 = but, 맛있어요 = delicious." },
          { ko: "조금 매워요. 그래서 맛없어요.", right: false, feedback: "그래서 맛없어요 says \"so it's not tasty\": hard on a cook! You like it: 조금 매워요. 하지만 맛있어요!" },
          { ko: "조금 추워요.", right: false, feedback: "추워요 is cold weather. Spicy is 매워요: 조금 매워요. 하지만 맛있어요!" },
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
        ask: "You do not.",
        options: [
          { ko: "아니요, 없어요.", right: true, feedback: "Yes: 없어요 = I don't have one. 있어요 = I have one." },
          { ko: "아니요, 있어요.", right: false, feedback: "아니요 says no, 있어요 says you have one. You don't: 아니요, 없어요." },
          { ko: "네, 없어요.", right: false, feedback: "네 says yes, 없어요 says you have none. To a plain question, answer: 아니요, 없어요." },
        ],
      },
    ],
    closing: { ko: "저기에서 표를 사세요. 안녕히 가세요!", gloss: "Buy a ticket over there. Goodbye!" },
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
        ask: "You like kimchi stew (김치찌개) best.",
        options: [
          { ko: "네, 김치찌개를 제일 싫어해요.", right: false, feedback: "싫어해요 means dislike! Like is 좋아해요: 네, 김치찌개를 제일 좋아해요." },
          { ko: "네, 김치찌개를 제일 좋아해요.", right: true, feedback: "Yes: 제일 = the most. 제일 좋아해요 = I like it best." },
          { ko: "네, 김치찌개가 제일 비싸요.", right: false, feedback: "비싸요 means expensive: \"kimchi stew is the most expensive\". You like it best: 네, 김치찌개를 제일 좋아해요." },
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
        ask: "No: you came with a friend (친구).",
        options: [
          { ko: "아니요, 친구하고 같이 왔어요.", right: true, feedback: "Yes: 친구하고 같이 = together with a friend. 하고 = with." },
          { ko: "아니요, 친구를 같이 왔어요.", right: false, feedback: "를 marks what an action is done to. With someone is 하고: 아니요, 친구하고 같이 왔어요." },
          { ko: "네, 친구하고 같이 왔어요.", right: false, feedback: "네 says you came alone, then says you came with a friend. Say: 아니요, 친구하고 같이 왔어요." },
        ],
      },
    ],
    closing: { ko: "좋겠네요. 좋은 구경 하세요!", gloss: "How nice. Enjoy the view!" },
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
        ask: "نعم.",
        options: [
          { ko: "네, 좋아해요.", right: true, feedback: "نعم: 네, 좋아해요. 좋아해요 = أحبّها." },
          { ko: "아니요, 좋아해요.", right: false, feedback: "아니요 تعني «لا»، ثم تقول الجملة إنك تحبها. «نعم» هي 네: 네, 좋아해요." },
          { ko: "네, 커피예요.", right: false, feedback: "هذه تقول «نعم، إنها قهوة». للتعبير عن الإعجاب: 네, 좋아해요." },
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
        ask: "حارّ قليلًا، لكنه يعجبك.",
        options: [
          { ko: "조금 매워요. 하지만 맛있어요!", right: true, feedback: "نعم: 매워요 = حارّ، 하지만 = لكن، 맛있어요 = لذيذ." },
          { ko: "조금 매워요. 그래서 맛없어요.", right: false, feedback: "그래서 맛없어요 تقول «لذلك ليس لذيذًا»: قاسية على طبّاخة! الطعم يعجبك: 조금 매워요. 하지만 맛있어요!" },
          { ko: "조금 추워요.", right: false, feedback: "추워요 لبرودة الطقس. الحارّ هو 매워요: 조금 매워요. 하지만 맛있어요!" },
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
        ask: "لا.",
        options: [
          { ko: "아니요, 없어요.", right: true, feedback: "نعم: 없어요 = ليست معي. و있어요 = معي." },
          { ko: "아니요, 있어요.", right: false, feedback: "아니요 تقول «لا»، و있어요 تقول إنها معك. ليست معك: 아니요, 없어요." },
          { ko: "네, 없어요.", right: false, feedback: "네 تقول «نعم»، و없어요 تقول إنها ليست معك. الردّ على سؤال مباشر: 아니요, 없어요." },
        ],
      },
    ],
    closing: { ko: "저기에서 표를 사세요. 안녕히 가세요!", gloss: "التذاكر تُشترى من هناك. مع السلامة!" },
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
        ask: "أكثر ما تحبه يخنة الكيمتشي (김치찌개).",
        options: [
          { ko: "네, 김치찌개를 제일 싫어해요.", right: false, feedback: "싫어해요 تعني «أكره»! «أحب» هي 좋아해요: 네, 김치찌개를 제일 좋아해요." },
          { ko: "네, 김치찌개를 제일 좋아해요.", right: true, feedback: "نعم: 제일 = الأكثر. 제일 좋아해요 = أحبه أكثر من غيره." },
          { ko: "네, 김치찌개가 제일 비싸요.", right: false, feedback: "비싸요 تعني «غالٍ»: «يخنة الكيمتشي هي الأغلى». المقصود أنها الأحب: 네, 김치찌개를 제일 좋아해요." },
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
        ask: "لا: مع صديق (친구).",
        options: [
          { ko: "아니요, 친구하고 같이 왔어요.", right: true, feedback: "نعم: 친구하고 같이 = مع صديق. 하고 = مع." },
          { ko: "아니요, 친구를 같이 왔어요.", right: false, feedback: "를 لما يقع عليه الفعل. «مع» هي 하고: 아니요, 친구하고 같이 왔어요." },
          { ko: "네, 친구하고 같이 왔어요.", right: false, feedback: "네 تقول إنك جئت وحدك، ثم تقول إنك مع صديق. الصحيح: 아니요, 친구하고 같이 왔어요." },
        ],
      },
    ],
    closing: { ko: "좋겠네요. 좋은 구경 하세요!", gloss: "ما أجمل ذلك. مشاهدة ممتعة!" },
  },
};

export const CHATS: Record<WorldLang, Record<ChatId, Chat>> = { en: EN, ar: AR };
