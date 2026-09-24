/**
 * World mode: which Klovers world each textbook opens onto.
 *
 * Same mapping as the library cards in src/pages/TextbookHubPage.tsx, so a
 * book looks like the same place from the library, its mission map, its
 * progress page and each lesson. The paintings are the story-canon scenes in
 * /assets/story/ (1600x900). A book with no world of its own opens onto
 * Cluby's Memory Garden.
 *
 * The scene lines are short and calm (story bible: show, don't announce).
 * Arabic is Modern Standard Arabic and gender-neutral.
 */
export interface BookWorld {
  image: string;
  worldEn: string;
  worldAr: string;
  altEn: string;
  altAr: string;
  sceneEn: string;
  sceneAr: string;
}

const HANGUL_VILLAGE: BookWorld = {
  image: "/assets/story/world-hangul-village.webp",
  worldEn: "Hangul Village",
  worldAr: "قرية الهانغول",
  altEn: "Painted Hangul Village, the first world of the Klovers story",
  altAr: "قرية الهانغول المرسومة، أول عالم في قصة كلوفرز",
  sceneEn: "Under the hanok roofs, every letter is waiting for its sound.",
  sceneAr: "تحت أسطح الهانوك، ينتظر كل حرفٍ صوتَه.",
};

const CONVERSATION_CAFE: BookWorld = {
  image: "/assets/story/world-conversation-cafe.webp",
  worldEn: "Conversation Café",
  worldAr: "مقهى المحادثة",
  altEn: "A cosy painted Korean café where everyday conversations happen",
  altAr: "مقهى كوري دافئ مرسوم تدور فيه محادثات الحياة اليومية",
  sceneEn: "The kettle is on, and the day's first sentences are ordered in Korean.",
  sceneAr: "الإبريق على النار، وأولى جمل اليوم تُطلب بالكورية.",
};

const CULTURE_STREET: BookWorld = {
  image: "/assets/story/world-culture-street.webp",
  worldEn: "Culture Street",
  worldAr: "شارع الثقافة",
  altEn: "A lively painted Korean culture street at dusk",
  altAr: "شارع ثقافي كوري نابض بالحياة عند الغروب",
  sceneEn: "The lanterns come on at dusk, and every scene has a line worth keeping.",
  sceneAr: "تُضاء الفوانيس عند الغروب، ولكل مشهد جملة تستحق الحفظ.",
};

const SEOUL_JOURNEY: BookWorld = {
  image: "/assets/story/world-seoul-journey.webp",
  worldEn: "Seoul Journey",
  worldAr: "رحلة سيول",
  altEn: "A painted journey across Seoul, from old gates to city lights",
  altAr: "رحلة مرسومة عبر سيول من البوابات القديمة إلى أضواء المدينة",
  sceneEn: "From the old gates to the city lights, grammar is the road between them.",
  sceneAr: "من البوابات القديمة إلى أضواء المدينة، والقواعد هي الطريق بينهما.",
};

const VOCABULARY_MARKET: BookWorld = {
  image: "/assets/story/world-vocabulary-market.webp",
  worldEn: "Vocabulary Market",
  worldAr: "سوق المفردات",
  altEn: "A colourful painted Korean market full of things to name",
  altAr: "سوق كوري ملوّن مرسوم مليء بالأشياء التي نتعلم أسماءها",
  sceneEn: "Every stall has something to name, and every name is a new word.",
  sceneAr: "في كل كشك شيء له اسم، وكل اسم كلمة جديدة.",
};

const MEMORY_GARDEN: BookWorld = {
  image: "/assets/story/world-memory-garden.webp",
  worldEn: "Cluby's Memory Garden",
  worldAr: "حديقة ذاكرة كلوبي",
  altEn: "Cluby's Memory Garden, where learned words grow",
  altAr: "حديقة ذاكرة كلوبي، حيث تنمو الكلمات المتعلَّمة",
  sceneEn: "Every word learned is planted here, and Cluby keeps it growing.",
  sceneAr: "كل كلمة متعلَّمة تُزرع هنا، ويعتني كلوبي بنموّها.",
};

const BOOK_WORLDS: Record<string, BookWorld> = {
  "korean-1": HANGUL_VILLAGE,
  "daily-routine": CONVERSATION_CAFE,
  kdrama: CULTURE_STREET,
  "grammar-mastery": SEOUL_JOURNEY,
  "picture-vocab": VOCABULARY_MARKET,
};

export const bookWorld = (book: string | null | undefined): BookWorld =>
  (book && BOOK_WORLDS[book]) || MEMORY_GARDEN;
