import type { KloverIconName } from "@/components/KloverIcon";
import { GAMES_CATALOG } from "@/constants/gamesList";

/**
 * Phase 1 of the Game Worlds concept (handovers/2026-09-23-game-worlds-concept-v4):
 * the 22 catalog games grouped into three worlds that read as a journey.
 *
 * This is a GROUPING of GAMES_CATALOG, not a second catalog. Every id here must
 * exist there, and every catalog id must sit in exactly one world — the test in
 * src/constants/__tests__/gameWorlds.test.ts holds both directions, so adding a
 * game without placing it fails CI instead of silently vanishing from the hub.
 *
 * Not to be confused with constants/worlds.ts, which groups TEXTBOOK LESSONS.
 */
export interface GameWorld {
  key: "hangul_village" | "vocabulary_market" | "conversation_cafe";
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: KloverIconName;
  gameIds: string[];
}

export const GAME_WORLDS: GameWorld[] = [
  {
    key: "hangul_village",
    name: "Hangul Village",
    nameAr: "قرية الهانغول",
    description: "Build your Korean from the very first letter.",
    descriptionAr: "بناء الكورية من أول حرف.",
    icon: "world-hangul-village",
    gameIds: ["hangul", "romanization", "phonics", "scramble", "typekorean", "speedread", "grammarpattern", "tenshift", "negation", "errorcatch"],
  },
  {
    key: "vocabulary_market",
    name: "Vocabulary Market",
    nameAr: "سوق المفردات",
    description: "Learn useful words for real life.",
    descriptionAr: "كلمات مفيدة للحياة اليومية.",
    icon: "world-vocab-market",
    gameIds: ["match", "flashcard", "numbers", "colors", "time", "counters", "opposites"],
  },
  {
    key: "conversation_cafe",
    name: "Conversation Café",
    nameAr: "مقهى المحادثة",
    description: "Practice real Korean conversations.",
    descriptionAr: "تدريب على محادثات كورية حقيقية.",
    icon: "world-conversation-cafe",
    gameIds: ["greetings", "conversation", "kdrama", "sentence", "verbs", "fillblank", "readingchoice", "sentenceread", "storygap", "honorific", "speechlevel", "situation", "dialoguefill"],
  },
];

const CATALOG_IDS = new Set(GAMES_CATALOG.map((g) => g.id));

/** Worlds with any id that is not (or no longer) in the catalog dropped. */
export const gameWorlds = (): GameWorld[] =>
  GAME_WORLDS.map((w) => ({ ...w, gameIds: w.gameIds.filter((id) => CATALOG_IDS.has(id)) }));

/** Cluby's outfits (one Cluby, many outfits) shown in the "coming soon" strip. Order is display order. */
export const CLUBY_OUTFITS = [
  { key: "hanbok", name: "Hanbok", nameAr: "هانبوك" },
  { key: "scholar", name: "Scholar", nameAr: "الدارس" },
  { key: "market", name: "Market", nameAr: "السوق" },
  { key: "cafe", name: "Café", nameAr: "المقهى" },
  { key: "taekwondo", name: "Taekwondo", nameAr: "تايكوندو" },
  { key: "traveller", name: "Traveller", nameAr: "المسافر" },
  { key: "winter", name: "Winter", nameAr: "الشتاء" },
  { key: "royal", name: "Royal", nameAr: "الملكي" },
] as const;
