/**
 * journeyProgress — the reader's "My Korea journey", kept on this device.
 *
 * WHY LOCAL, AND WHY NOT student_xp
 *
 * Nothing server-side fits yet. `student_xp` is the student dashboard's XP and
 * feeds the leaderboard; letting an anonymous blog quiz write to it would let
 * anyone farm leaderboard points by re-answering five questions, and there is
 * no table for "articles read" or "words saved from the blog" at all. Adding
 * one means a migration, which this repo ships in its own PR (CLAUDE.md: never
 * a migration in a feature PR). So the MVP stores progress in localStorage and
 * the UI says so ("saved on this device").
 *
 * THE SEAM FOR SYNC LATER
 *
 * Every mutation goes through `update()`, and every mutation is idempotent
 * (sets, not counters — XP is derived from what was completed, so replaying
 * the same events can never double-count). A future Supabase adapter only has
 * to (1) upload `read()` once on sign-in and merge with a set union, and (2)
 * subscribe and mirror each new state. No component changes.
 *
 * Every storage access is wrapped: private windows, blocked site data and
 * SSR/prerender all see an empty journey rather than an exception.
 */
import { useSyncExternalStore } from "react";
import { baseSlug, type VocabItem } from "@/lib/articleVocab";
import { XP, type StageId } from "@/constants/blogJourney";

export interface SavedWord extends VocabItem {
  /** Base slug of the article it came from, or "journal" for the /blog cards. */
  from: string;
  at: number;
}

export interface JourneyState {
  v: 1;
  /** Base slugs, so reading the Arabic twin and the English twin is one stop. */
  articlesRead: string[];
  words: SavedWord[];
  /** Quiz question ids answered correctly (first correct answer only counts). */
  quizzes: string[];
  stopsSeen: StageId[];
  bookmarks: string[];
  path?: StageId;
  startedAt?: number;
}

const KEY = "klovers.journey.v1";
const EMPTY: JourneyState = { v: 1, articlesRead: [], words: [], quizzes: [], stopsSeen: [], bookmarks: [] };

let cache: JourneyState | null = null;
const listeners = new Set<() => void>();

function load(): JourneyState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<JourneyState>;
    if (parsed?.v !== 1) return EMPTY;
    return {
      ...EMPTY,
      ...parsed,
      articlesRead: Array.isArray(parsed.articlesRead) ? parsed.articlesRead : [],
      words: Array.isArray(parsed.words) ? parsed.words : [],
      quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
      stopsSeen: Array.isArray(parsed.stopsSeen) ? parsed.stopsSeen : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    };
  } catch {
    return EMPTY;
  }
}

export function read(): JourneyState {
  if (typeof window === "undefined") return EMPTY;
  if (!cache) cache = load();
  return cache;
}

function update(fn: (s: JourneyState) => JourneyState | null) {
  const prev = read();
  const next = fn(prev);
  if (!next || next === prev) return;
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — progress lives for this tab only */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  // Another tab (e.g. an article opened in a new tab) finished a stop.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = load();
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useJourneyProgress(): JourneyState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** XP is derived, never stored — see the note at the top. */
export const journeyXp = (s: JourneyState) =>
  s.articlesRead.length * XP.articleRead + s.quizzes.length * XP.quizCorrect;

export const journey = {
  start() {
    update((s) => (s.startedAt ? null : { ...s, startedAt: Date.now() }));
  },
  /** Returns true the first time this article (either language) is finished. */
  markArticleRead(slug: string): boolean {
    const b = baseSlug(slug);
    let added = false;
    update((s) => {
      if (s.articlesRead.includes(b)) return null;
      added = true;
      return { ...s, startedAt: s.startedAt ?? Date.now(), articlesRead: [...s.articlesRead, b] };
    });
    return added;
  },
  /** Adds the words not already saved. Returns how many were new. */
  saveWords(items: VocabItem[], from: string): number {
    let n = 0;
    update((s) => {
      const have = new Set(s.words.map((w) => w.ko));
      const fresh = items
        .filter((i) => i.ko && !have.has(i.ko) && (have.add(i.ko), true))
        .map((i) => ({ ...i, from: from === "journal" ? from : baseSlug(from), at: Date.now() }));
      n = fresh.length;
      return n ? { ...s, words: [...s.words, ...fresh] } : null;
    });
    return n;
  },
  hasWord: (ko: string) => read().words.some((w) => w.ko === ko),
  /** Returns true when this was the first correct answer to the question. */
  completeQuiz(id: string): boolean {
    let added = false;
    update((s) => {
      if (s.quizzes.includes(id)) return null;
      added = true;
      return { ...s, quizzes: [...s.quizzes, id] };
    });
    return added;
  },
  markStopSeen(id: StageId) {
    update((s) => (s.stopsSeen.includes(id) ? null : { ...s, stopsSeen: [...s.stopsSeen, id] }));
  },
  toggleBookmark(slug: string): boolean {
    const b = baseSlug(slug);
    let on = false;
    update((s) => {
      on = !s.bookmarks.includes(b);
      return { ...s, bookmarks: on ? [...s.bookmarks, b] : s.bookmarks.filter((x) => x !== b) };
    });
    return on;
  },
  setPath(id: StageId) {
    update((s) => (s.path === id ? null : { ...s, path: id }));
  },
};

/** Test hook: forget the in-memory copy so the next read() reloads storage. */
export function __resetJourneyCacheForTests() {
  cache = null;
}
