import type { LucideIcon } from "lucide-react";
import {
  Layers, Brain, PenLine, Hash, Palette, BookOpen, MessageCircle,
  ArrowLeftRight, Shuffle, Calculator, Tv, Clock, Keyboard, Volume2,
  CreditCard, Zap, MousePointerClick, BookOpenCheck, Headphones,
  ListOrdered, BookText,
} from "lucide-react";

export type GameDifficulty = "beginner" | "intermediate";

export interface GameCatalogEntry {
  id: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  emoji: string;
  difficulty: GameDifficulty;
  /**
   * Playable without an account. This is the ONE place that decides that —
   * GamesPage's play gate, its padlock/FREE badge, and HomeGamesSection's
   * "sign up to unlock" copy all read this field, so a game can never show
   * as free in one place and locked in another (that used to be two
   * separate lists that could disagree — see the git history of GamesPage
   * before this file existed).
   */
  free: boolean;
}

/**
 * The single source of truth for every game on /games — id, copy keys,
 * icon, difficulty, and free/gated status. Anything that needs "how many
 * games do we have" or "which ones are free" (the homepage teaser, the
 * games page itself, any future promo copy) should derive it from
 * GAMES_CATALOG.length / FREE_GAME_IDS rather than typing a number into
 * copy — a typed-in count is exactly how the homepage ended up advertising
 * "13 Games" long after the page had grown to 20.
 *
 * Free games raised from 2 to 10 deliberately: 102 profiles existed and 66
 * of them (65%) had never earned a single XP point, against 70 game plays
 * in five months. With 2 of 20 games open, the signup wall stood in front
 * of the thing people came for, so "nobody plays" and "nobody can play
 * without signing up" were indistinguishable. Ten open games separates them.
 *
 * `match` must stay free. It is the initial `activeGame` on /games, so it
 * renders on mount without ever going through the play gate — making it
 * gated would show every signed-out visitor a locked wall as the page loads.
 */
export const GAMES_CATALOG: GameCatalogEntry[] = [
  { id: "match", titleKey: "games.matchTitle", descKey: "games.matchDesc", icon: Layers, emoji: "🃏", difficulty: "beginner", free: true },
  { id: "hangul", titleKey: "games.hangulTitle", descKey: "games.hangulDesc", icon: Brain, emoji: "⚡", difficulty: "beginner", free: true },
  { id: "sentence", titleKey: "games.sentenceTitle", descKey: "games.sentenceDesc", icon: PenLine, emoji: "🧩", difficulty: "beginner", free: false },
  { id: "numbers", titleKey: "games.numbersTitle", descKey: "games.numbersDesc", icon: Hash, emoji: "🔢", difficulty: "beginner", free: true },
  { id: "colors", titleKey: "games.colorsTitle", descKey: "games.colorsDesc", icon: Palette, emoji: "🎨", difficulty: "beginner", free: true },
  { id: "verbs", titleKey: "games.verbsTitle", descKey: "games.verbsDesc", icon: BookOpen, emoji: "📝", difficulty: "intermediate", free: false },
  { id: "greetings", titleKey: "games.greetingsTitle", descKey: "games.greetingsDesc", icon: MessageCircle, emoji: "👋", difficulty: "beginner", free: true },
  { id: "opposites", titleKey: "games.oppositesTitle", descKey: "games.oppositesDesc", icon: ArrowLeftRight, emoji: "↔️", difficulty: "intermediate", free: false },
  { id: "fillblank", titleKey: "games.fillblankTitle", descKey: "games.fillblankDesc", icon: PenLine, emoji: "✏️", difficulty: "intermediate", free: false },
  { id: "scramble", titleKey: "games.scrambleTitle", descKey: "games.scrambleDesc", icon: Shuffle, emoji: "🔀", difficulty: "beginner", free: true },
  { id: "counters", titleKey: "games.countersTitle", descKey: "games.countersDesc", icon: Calculator, emoji: "🔢", difficulty: "intermediate", free: false },
  { id: "kdrama", titleKey: "games.kdramaTitle", descKey: "games.kdramaDesc", icon: Tv, emoji: "🎬", difficulty: "beginner", free: true },
  { id: "time", titleKey: "games.timeTitle", descKey: "games.timeDesc", icon: Clock, emoji: "⏰", difficulty: "beginner", free: true },
  { id: "typekorean", titleKey: "games.typekoreanTitle", descKey: "games.typekoreanDesc", icon: Keyboard, emoji: "⌨️", difficulty: "intermediate", free: false },
  { id: "romanization", titleKey: "games.romanizationTitle", descKey: "games.romanizationDesc", icon: Volume2, emoji: "🔤", difficulty: "beginner", free: true },
  { id: "flashcard", titleKey: "games.flashcardTitle", descKey: "games.flashcardDesc", icon: CreditCard, emoji: "🃏", difficulty: "beginner", free: true },
  { id: "speedread", titleKey: "games.speedreadTitle", descKey: "games.speedreadDesc", icon: Zap, emoji: "⚡", difficulty: "intermediate", free: false },
  { id: "readingchoice", titleKey: "games.readingchoiceTitle", descKey: "games.readingchoiceDesc", icon: MousePointerClick, emoji: "👆", difficulty: "beginner", free: false },
  { id: "sentenceread", titleKey: "games.sentencereadTitle", descKey: "games.sentencereadDesc", icon: BookOpenCheck, emoji: "📖", difficulty: "intermediate", free: false },
  { id: "phonics", titleKey: "games.phonicsTitle", descKey: "games.phonicsDesc", icon: Headphones, emoji: "🎧", difficulty: "beginner", free: false },
  // Added 2026-09-20: two mechanics that already existed as complete,
  // unused components in this same folder (see the games-system-review
  // handover) — a drag/reorder game and a multi-blank story game, neither
  // of which is "another 4-option quiz with different words" like most of
  // the catalog above. Gated (free: false), consistent with the other
  // longer-form/intermediate entries.
  { id: "conversation", titleKey: "games.conversationTitle", descKey: "games.conversationDesc", icon: ListOrdered, emoji: "💬", difficulty: "intermediate", free: false },
  { id: "storygap", titleKey: "games.storygapTitle", descKey: "games.storygapDesc", icon: BookText, emoji: "📔", difficulty: "intermediate", free: false },
  // Added 2026-09-26: HonorificGame, the next of the unused components in this
  // folder (the full list is in src/config/__tests__/kloversWorld.test.ts under
  // ALLOWED_UNMOUNTED). It teaches the (으)시- speech level — the plain/humble vs
  // polite/honorific verb distinction — which nothing else on the site covers and
  // which a learner cannot pick up from a textbook chapter on numbers or colours.
  // Gated, like the other intermediate entries: it explains a concept rather than
  // drilling recall, so it wants an account. Its questions are self-contained
  // inline data, NOT useGameData() like VerbConjugationGame, so it needs no
  // backend content to be correct.
  { id: "honorific", titleKey: "games.honorificTitle", descKey: "games.honorificDesc", icon: MessageCircle, emoji: "🙇", difficulty: "intermediate", free: false },
];

/** Derived, not hand-maintained — see the `free` field doc above. */
export const FREE_GAME_IDS: string[] = GAMES_CATALOG.filter((g) => g.free).map((g) => g.id);
