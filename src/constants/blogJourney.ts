/**
 * blogJourney.ts — the editorial map behind /blog ("Klovers Journal").
 *
 * The CMS (blog_posts) has no category column — only article_type, which is a
 * FORMAT (how-to, listicle, longform), not a topic. The journey needs topics,
 * so this file assigns every post to one of six stages by its slug. Slugs are
 * the most stable thing a post has: they are its URL, and changing one breaks
 * links and SEO, so a slug rule does not silently drift the way a keyword or
 * title rule would.
 *
 * A post no rule claims lands in stage 02 ("Understand the language"), which
 * is where most unclaimed posts — grammar and vocabulary guides — belong
 * anyway. Nothing is ever hidden: the "all articles" view lists every post.
 *
 * The franchise content further down (untranslatable words, drama lines,
 * everyday phrases, quiz) is short, hand-written learning content that lives
 * on the page itself. Where a published article goes deeper, the card links
 * to it by BASE slug; the page resolves the language twin at runtime and
 * drops the link if the article is not published in that language.
 */
import type { KloverIconName } from "@/components/KloverIcon";
import { baseSlug } from "@/lib/articleVocab";

export type StageId = "discover" | "understand" | "experience" | "drama" | "speak" | "test";

type L = { ar: string; en: string };

export interface JourneyStage {
  id: StageId;
  num: string;
  short: L;
  title: L;
  blurb: L;
  icon: KloverIconName;
  /** Which Klobi pose guides this chapter, if any. Not every chapter gets one. */
  guide?: { pose: KlobiPose; line: L };
}

export type KlobiPose = "reading" | "wave" | "cards" | "headphones" | "thumbsup";

export const STAGES: JourneyStage[] = [
  {
    id: "discover",
    num: "01",
    short: { ar: "اكتشف", en: "Discover" },
    title: { ar: "اكتشف كوريا", en: "Discover Korea" },
    blurb: {
      ar: "ممالك قديمة، بيوت تصغي إلى الأرض، أعياد وأساطير — كوريا كما يعرفها أهلها.",
      en: "Ancient kingdoms, houses that listen to the land, festivals and legends — Korea as Koreans know it.",
    },
    icon: "palace-blossoms",
    guide: {
      pose: "wave",
      line: { ar: "أول محطة: كوريا قبل الكلمات. اختر قصة وابدأ.", en: "First stop: Korea before the words. Pick a story." },
    },
  },
  {
    id: "understand",
    num: "02",
    short: { ar: "افهم", en: "Understand" },
    title: { ar: "افهم اللغة", en: "Understand the language" },
    blurb: {
      ar: "كلمات تحمل ثقافة كاملة، وقواعد تشرح كيف يفكر الكوريون.",
      en: "Words that carry a whole culture, and grammar that explains how Koreans think.",
    },
    icon: "flashcard-ga",
    guide: {
      pose: "cards",
      line: { ar: "اضغط على أي كلمة لتكشف معناها، واحفظها في مجموعتك.", en: "Tap a word to reveal it, then keep it in your collection." },
    },
  },
  {
    id: "experience",
    num: "03",
    short: { ar: "عش التجربة", en: "Experience" },
    title: { ar: "عش كوريا", en: "Experience Korea" },
    blurb: {
      ar: "المتجر المفتوح طوال الليل، المقهى، المترو، المطعم — تفاصيل يوم عادي في كوريا.",
      en: "The all-night store, the café, the subway, the restaurant — an ordinary day in Korea.",
    },
    icon: "game-subway",
  },
  {
    id: "drama",
    num: "04",
    short: { ar: "شاهد وتعلم", en: "Watch & learn" },
    title: { ar: "تعلم من الدراما", en: "Learn from K-drama" },
    blurb: {
      ar: "الجمل التي تسمعها في كل حلقة — وما تعنيه فعلاً.",
      en: "The lines you hear every episode — and what they really mean.",
    },
    icon: "game-headphones-music",
    guide: {
      pose: "headphones",
      line: { ar: "المرة الجاية وأنت بتتفرج، هتسمعها من غير ترجمة.", en: "Next episode, you'll catch these without subtitles." },
    },
  },
  {
    id: "speak",
    num: "05",
    short: { ar: "تحدث", en: "Speak" },
    title: { ar: "تكلم مثل الكوريين", en: "Speak like Koreans" },
    blurb: {
      ar: "عبارات يومية معناها الحقيقي أكبر من ترجمتها — ومتى تقولها.",
      en: "Everyday phrases that mean more than their translation — and when to use them.",
    },
    icon: "chat-annyeong",
  },
  {
    id: "test",
    num: "06",
    short: { ar: "اختبر نفسك", en: "Test yourself" },
    title: { ar: "اختبر نفسك", en: "Test yourself" },
    blurb: {
      ar: "خمسة أسئلة سريعة من محطات الرحلة. كل إجابة صحيحة تضيف لرحلتك.",
      en: "Five quick questions from the journey. Every right answer moves you forward.",
    },
    icon: "game-checklist-pencil",
    guide: {
      pose: "thumbsup",
      line: { ar: "ولا يهمك لو غلطت — حاول تاني.", en: "Wrong answer? No problem — try again." },
    },
  },
];

/** The short topic label printed on article cards. */
export const STAGE_CATEGORY: Record<StageId, L> = {
  discover: { ar: "ثقافة وتاريخ", en: "Culture & history" },
  understand: { ar: "اللغة", en: "Language" },
  experience: { ar: "الحياة في كوريا", en: "Life in Korea" },
  drama: { ar: "دراما وكيبوب", en: "K-drama & K-pop" },
  speak: { ar: "تعابير يومية", en: "Everyday Korean" },
  test: { ar: "الدراسة والاختبارات", en: "Study & TOPIK" },
};

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, JourneyStage>;

/** First match wins. Order matters: legends before drama (dokkaebi-…-kdrama is folklore). */
const STAGE_RULES: [StageId, RegExp][] = [
  ["discover", /(myth|legend|dokkaebi|gumiho|ghost|jeoseung|shamanism|superstition|zodiac)/],
  ["test", /(topik|how-long|learn-korean-faster|3-months|apps-comparison|learning-apps|free-resources|arabic-speakers|easier-than|best-classes)/],
  ["drama", /(kdrama|drama|kpop|songs|idol|webtoon|dating-phrases)/],
  ["speak", /(greetings|slang|introduce-yourself|compliment|job-interview|small-talk|pronunciation-guide-speaking)/],
  ["experience", /(convenience|cafe|coffee|street-food|drinking|soju|education|hagwon|workplace|business-culture|housing|transportation|restaurant|shopping|phone|body-language|gaming|pcbang|skincare|money-banking|directions|family-terms|military|age-system|weather)/],
  ["discover", /(hanok|joseon|silla|gojoseon|hallyu|hanbok|holidays|seollal|chuseok|wedding|birthday|dol-|funeral|tattoo|seoul-travel)/],
];

export function stageForSlug(slug: string): StageId {
  const b = baseSlug(slug);
  for (const [id, re] of STAGE_RULES) if (re.test(b)) return id;
  return "understand";
}

/**
 * "My Korea journey" destinations. A destination is discovered once the
 * reader has finished one article in it. Destinations with no published
 * article in the reader's language are not shown — no Busan or Jeju chip until
 * Klovers actually has a Busan or Jeju story to send someone to.
 */
export interface Destination {
  id: string;
  label: L;
  ko: string;
  match: RegExp;
}

export const DESTINATIONS: Destination[] = [
  { id: "seoul", label: { ar: "سيول", en: "Seoul" }, ko: "서울", match: /(seoul|transportation|hallyu)/ },
  { id: "history", label: { ar: "التاريخ", en: "History" }, ko: "역사", match: /(joseon|silla|gojoseon|hanok|hanbok)/ },
  { id: "legends", label: { ar: "الأساطير", en: "Legends" }, ko: "전설", match: /(myth|legend|dokkaebi|gumiho|ghost|jeoseung|shamanism)/ },
  { id: "culture", label: { ar: "التقاليد", en: "Traditions" }, ko: "전통", match: /(holidays|seollal|wedding|birthday|funeral|tattoo|zodiac|superstition|military|age-system)/ },
  { id: "food", label: { ar: "الطعام", en: "Food" }, ko: "음식", match: /(food|cafe|coffee|soju|drinking|restaurant|convenience)/ },
  { id: "daily", label: { ar: "الحياة اليومية", en: "Daily life" }, ko: "일상", match: /(education|workplace|housing|shopping|phone|body-language|gaming|skincare|money|directions|family|weather)/ },
  { id: "words", label: { ar: "الكلمات", en: "Words" }, ko: "단어", match: /(jeong|nunchi|proverbs|essential-korean-words|adjectives|vocabulary)/ },
  { id: "grammar", label: { ar: "القواعد", en: "Grammar" }, ko: "문법", match: /(grammar|particles|verb|tense|negation|conditional|connectors|honorific|speech-levels|sentence-structure|question-words|counting|numbers|telling-time|hangul|alphabet|pronunciation)/ },
  { id: "drama", label: { ar: "الدراما", en: "K-drama" }, ko: "드라마", match: /(kdrama|drama|webtoon|dating)/ },
  { id: "kpop", label: { ar: "الكيبوب", en: "K-pop" }, ko: "케이팝", match: /(kpop|songs|idol)/ },
  { id: "expressions", label: { ar: "التعابير", en: "Expressions" }, ko: "표현", match: /(greetings|slang|texting|introduce|compliment|interview|small-talk)/ },
];

/**
 * Featured story, in order of preference. Pinned here because the CMS has no
 * editor-facing "feature this" control (blog_posts.featured exists but
 * BlogManager never sets it). First one published in the reader's language
 * wins; if none is, the page falls back to the newest `featured` row, then to
 * the newest post.
 */
export const FEATURED_PREFERENCE = [
  "what-is-jeong-korean-untranslatable-concept",
  "hanok-traditional-korean-house",
  "nunchi-korean-social-superpower-guide",
];

/* ───────────────────────── Franchise: كلمة لا تُترجم ───────────────────────── */

export interface WordStory {
  ko: string;
  rom: string;
  hook: L;
  meaning: L;
  /** Base slug of a published article that goes deeper, if one exists. */
  article?: string;
}

export const UNTRANSLATABLE: WordStory[] = [
  {
    ko: "정",
    rom: "jeong",
    hook: { ar: "أكثر من الحب والصداقة", en: "More than love or friendship" },
    meaning: {
      ar: "رابط يتكوّن ببطء من الوقت والتجارب المشتركة، ويبقى حتى بعد الخلاف.",
      en: "A bond that grows slowly from shared time and experience — and stays even after an argument.",
    },
    article: "what-is-jeong-korean-untranslatable-concept",
  },
  {
    ko: "눈치",
    rom: "nunchi",
    hook: { ar: "قراءة الجو من غير كلام", en: "Reading the room, wordlessly" },
    meaning: {
      ar: "أن تفهم ما يشعر به الآخرون وما لا يقولونه، وتتصرف على هذا الأساس.",
      en: "Sensing what others feel and don't say — and acting on it.",
    },
    article: "nunchi-korean-social-superpower-guide",
  },
  {
    ko: "우리",
    rom: "uri",
    hook: { ar: "«نحن»… حتى حين تقصد «أنا»", en: "“We”… even when you mean “my”" },
    meaning: {
      ar: "يقول الكوري 우리 엄마 «أمّنا» عن أمه هو، لأن الانتماء للجماعة يسبق الفرد.",
      en: "Koreans say 우리 엄마, “our mom”, about their own mother — the group comes before the self.",
    },
  },
  {
    ko: "인연",
    rom: "inyeon",
    hook: { ar: "لقاء كتبه القدر", en: "A meeting fate arranged" },
    meaning: {
      ar: "الصلة بين شخصين التي يؤمن الكوريون أنها مقدّرة — حتى لقاء عابر في الطريق.",
      en: "The destined tie between two people — even a passing encounter on the street.",
    },
  },
  {
    ko: "한",
    rom: "han",
    hook: { ar: "حزن عميق لا يزول", en: "A sorrow that never quite leaves" },
    meaning: {
      ar: "شعور متراكم بالأسى والظلم يعيش في القصص والأغاني الكورية، ومعه أمل صامت.",
      en: "An accumulated grief and sense of injustice that runs through Korean stories and songs — with quiet hope.",
    },
  },
  {
    ko: "아깝다",
    rom: "akkapda",
    hook: { ar: "«يا خسارة!»", en: "“What a waste!”" },
    meaning: {
      ar: "تُقال حين يضيع شيء له قيمة: طعام لم يُؤكل، وقت، أو فرصة كانت قريبة.",
      en: "Said when something valuable goes to waste: uneaten food, time, a chance that was close.",
    },
  },
];

/* ─────────────────────────── Franchise: تعلم من الدراما ─────────────────────────── */

export interface Expression {
  ko: string;
  rom: string;
  literal: L;
  meaning: L;
  context: L;
  register?: "casual" | "polite";
  article?: string;
}

// Arabic strings that embed a Korean suffix (-지 마, -겠-) wrap it in U+2066 /
// U+2069 (LTR isolate) so the hyphen stays attached to the Korean side.
export const DRAMA_LINES: Expression[] = [
  {
    ko: "왜 그래?",
    rom: "wae geurae?",
    literal: { ar: "لماذا هكذا؟", en: "Why like that?" },
    meaning: { ar: "مالك؟ / إيه اللي حصل؟", en: "What's wrong with you?" },
    context: {
      ar: "لماذا تسمعها طوال الوقت؟ لأنها رد الفعل الأول حين يتصرف أحد بغرابة أو يبدو منزعجاً.",
      en: "Why you hear it constantly: it's the first reaction when someone acts strangely or looks upset.",
    },
    register: "casual",
    article: "kdrama-korean-phrases-beginners",
  },
  {
    ko: "어떡해",
    rom: "eotteokhae",
    literal: { ar: "ماذا أفعل؟", en: "What do I do?" },
    meaning: { ar: "يا ويلي! / أعمل إيه دلوقتي؟", en: "Oh no! What now?" },
    context: {
      ar: "لحظة الذعر أو التعاطف: خبر سيئ، موقف محرج، أو حين تشعر بالأسف لأجل أحد.",
      en: "Panic or sympathy: bad news, an awkward moment, or feeling sorry for someone.",
    },
    register: "casual",
    article: "kdrama-korean-phrases-beginners",
  },
  {
    ko: "보고 싶어",
    rom: "bogo sipeo",
    literal: { ar: "أريد أن أراك", en: "I want to see you" },
    meaning: { ar: "وحشتني / اشتقت لك", en: "I miss you" },
    context: {
      ar: "الكورية لا تقول «افتقدتك» مباشرة — بل «أريد أن أراك». أصدق جملة في مشاهد الوداع.",
      en: "Korean doesn't say “I miss you” — it says “I want to see you”. The line of every farewell scene.",
    },
    register: "casual",
    article: "korean-dating-phrases-kdrama-lines",
  },
  {
    ko: "가지 마",
    rom: "gaji ma",
    literal: { ar: "لا تذهب", en: "Don't go" },
    meaning: { ar: "ما تمشيش!", en: "Don't go!" },
    context: {
      ar: "النهاية \u2066-지 마\u2069 تحوّل أي فعل إلى نهي ودّي: 울지 마 «لا تبكِ»، 걱정하지 마 «لا تقلق».",
      en: "-지 마 turns any verb into a casual “don't”: 울지 마 “don't cry”, 걱정하지 마 “don't worry”.",
    },
    register: "casual",
    article: "korean-dating-phrases-kdrama-lines",
  },
];

/* ────────────────────────── Franchise: تكلم مثل الكوريين ────────────────────────── */

export const SPEAK_PHRASES: Expression[] = [
  {
    ko: "괜찮아요",
    rom: "gwaenchanayo",
    literal: { ar: "لا بأس", en: "It's okay" },
    meaning: { ar: "ليست فقط «لا بأس»", en: "Not just “it's okay”" },
    context: {
      ar: "حسب النبرة: «أنا بخير»، «لا شكراً» لرفض مهذب، أو «هل أنت بخير؟» كسؤال.",
      en: "By tone: “I'm fine”, a polite “no thanks”, or — as a question — “are you okay?”",
    },
    register: "polite",
    article: "korean-daily-greetings",
  },
  {
    ko: "밥 먹었어요?",
    rom: "bap meogeosseoyo?",
    literal: { ar: "هل أكلت؟", en: "Did you eat?" },
    meaning: { ar: "طمّني عليك", en: "How are you doing?" },
    context: {
      ar: "تحية اهتمام، لا سؤال عن الطعام. الرد الطبيعي: 네, 먹었어요 «أيوه، أكلت».",
      en: "A caring greeting, not a food question. The natural reply: 네, 먹었어요 “yes, I ate”.",
    },
    register: "polite",
    article: "korean-daily-greetings",
  },
  {
    ko: "잘 먹겠습니다",
    rom: "jal meokgetseumnida",
    literal: { ar: "سآكل جيداً", en: "I will eat well" },
    meaning: { ar: "شكراً على الأكل (قبل البدء)", en: "Thank you for the meal (before eating)" },
    context: {
      ar: "تُقال قبل الأكل لمن طبخ أو دفع. وبعده: 잘 먹었습니다 «أكلت جيداً».",
      en: "Said before eating, to whoever cooked or paid. After: 잘 먹었습니다 “I ate well”.",
    },
    register: "polite",
    article: "korean-restaurant-ordering-phrases-guide",
  },
  {
    ko: "수고하셨습니다",
    rom: "sugohasyeotseumnida",
    literal: { ar: "لقد تعبت", en: "You worked hard" },
    meaning: { ar: "شكراً على مجهودك", en: "Thanks for your hard work" },
    context: {
      ar: "في نهاية يوم العمل أو الحصة، أو للبائع وأنت تغادر. لا مقابل حرفي لها بالعربية.",
      en: "At the end of a workday or class, or to a shopkeeper as you leave. No literal equivalent.",
    },
    register: "polite",
    article: "korean-workplace-business-culture",
  },
];

/* ─────────────────────────────── Mini quiz ─────────────────────────────── */

export interface QuizQuestion {
  id: string;
  ko: string;
  prompt: L;
  scene?: L;
  options: { id: string; label: L }[];
  answer: string;
  explain: L;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "nunchi-context",
    ko: "눈치",
    prompt: { ar: "ماذا تعني 눈치 في هذا السياق؟", en: "What does 눈치 mean here?" },
    scene: {
      ar: "صديقك سكت فجأة، وفهمت أنه منزعج من غير ما يقول كلمة.",
      en: "Your friend suddenly goes quiet, and you realise he's upset without a word said.",
    },
    options: [
      { id: "a", label: { ar: "الحظ", en: "Luck" } },
      { id: "b", label: { ar: "فهم الجو الاجتماعي", en: "Reading the social mood" } },
      { id: "c", label: { ar: "الخجل", en: "Shyness" } },
    ],
    answer: "b",
    explain: {
      ar: "눈치 حرفياً «قياس العين» — أن تلتقط المشاعر غير المعلنة من حولك.",
      en: "눈치 is literally “eye-measure” — picking up the unspoken feelings around you.",
    },
  },
  {
    id: "bap-greeting",
    ko: "밥 먹었어요?",
    prompt: { ar: "صديقتك الكورية سألتك: 밥 먹었어요؟ ماذا تقصد غالباً؟", en: "A Korean friend asks 밥 먹었어요? What does she usually mean?" },
    options: [
      { id: "a", label: { ar: "تدعوك إلى العشاء", en: "She's inviting you to dinner" } },
      { id: "b", label: { ar: "تطمئن عليك كتحية", en: "She's checking on you — a greeting" } },
      { id: "c", label: { ar: "تسأل عن أكلتك المفضلة", en: "She's asking your favourite food" } },
    ],
    answer: "b",
    explain: {
      ar: "هي تحية اهتمام مثل «عامل إيه؟». الرد: 네, 먹었어요.",
      en: "It's a caring “how are you?”. Reply: 네, 먹었어요.",
    },
  },
  {
    id: "jal-meokgetseumnida",
    ko: "잘 먹겠습니다",
    prompt: { ar: "متى يقول الكوريون 잘 먹겠습니다؟", en: "When do Koreans say 잘 먹겠습니다?" },
    options: [
      { id: "a", label: { ar: "بعد الانتهاء من الأكل", en: "After finishing the meal" } },
      { id: "b", label: { ar: "قبل أن يبدؤوا الأكل", en: "Before they start eating" } },
      { id: "c", label: { ar: "عند طلب الحساب", en: "When asking for the bill" } },
    ],
    answer: "b",
    explain: {
      ar: "اللاحقة \u2066-겠-\u2069 تشير إلى المستقبل: «سآكل جيداً». بعد الأكل تصبح 잘 먹었습니다.",
      en: "-겠- points ahead: “I will eat well”. Afterwards it becomes 잘 먹었습니다.",
    },
  },
  {
    id: "uri-eomma",
    ko: "우리 엄마",
    prompt: { ar: "كوري يقول 우리 엄마 عن أمه هو. الترجمة الحرفية:", en: "A Korean says 우리 엄마 about his own mother. Literally:" },
    options: [
      { id: "a", label: { ar: "أمي", en: "My mom" } },
      { id: "b", label: { ar: "أمّنا", en: "Our mom" } },
      { id: "c", label: { ar: "أم صديقي", en: "My friend's mom" } },
    ],
    answer: "b",
    explain: {
      ar: "우리 = «نحن/لنا». الكورية تقدّم العائلة والجماعة على «أنا».",
      en: "우리 = “we/our”. Korean puts family and group before “I”.",
    },
  },
  {
    id: "gwaenchanayo-refusal",
    ko: "괜찮아요",
    prompt: { ar: "عرضت قهوة على زميل، فابتسم وقال 괜찮아요. ماذا يقصد؟", en: "You offer a colleague coffee; he smiles: 괜찮아요. He means…" },
    options: [
      { id: "a", label: { ar: "أنا بخير", en: "I'm fine" } },
      { id: "b", label: { ar: "لا شكراً", en: "No, thank you" } },
      { id: "c", label: { ar: "القهوة لذيذة", en: "The coffee is great" } },
    ],
    answer: "b",
    explain: {
      ar: "مع عرض أو هدية، 괜찮아요 رفض مهذب — «مش محتاج، شكراً».",
      en: "Answering an offer, 괜찮아요 is a polite no — “I'm good, thanks”.",
    },
  },
];

export const XP = { articleRead: 10, quizCorrect: 5 } as const;
