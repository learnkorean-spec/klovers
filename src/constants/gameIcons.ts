import type { KloverIconName } from "@/components/KloverIcon";

/**
 * Which drawing each game wears, keyed by GAMES_CATALOG id.
 *
 * The `game-*` drawings are the disc-and-drawing set cut from the games concept
 * sheets (public/assets/icons/game-*.webp): every one already stands on its own
 * pastel disc, so a card only has to place it - no extra tile.
 *
 * Some drawings are shared on purpose (the catalog has more games than the
 * concept sheets have pictures). To give a game its own picture, change one
 * line here; nothing else reads this map.
 */
export const GAME_ICON: Record<string, KloverIconName> = {
  match: "game-flashcard-han",
  hangul: "game-klobi-han",
  sentence: "game-particle-puzzle",
  numbers: "game-lucky-bag",
  colors: "game-hanbok",
  verbs: "game-checklist-pencil",
  greetings: "game-hello-bubble",
  opposites: "game-chat-smile",
  fillblank: "game-topik-sheet",
  scramble: "game-hangeul-spelling",
  counters: "game-subway",
  kdrama: "game-hanok-cloud",
  time: "game-time-dates",
  typekorean: "game-hangeul-spelling",
  romanization: "game-headphones-music",
  flashcard: "game-flashcards-love",
  speedread: "game-klobi-thumbsup",
  readingchoice: "game-korea-map",
  sentenceread: "game-map-tower",
  phonics: "game-headphones-music",
  conversation: "game-hello-bubble",
  storygap: "game-virtual-korea",
};

/** A new catalog entry with no mapping yet still gets a picture, never a hole. */
export const gameIconName = (id: string): KloverIconName => GAME_ICON[id] ?? "game-klobi-thumbsup";
