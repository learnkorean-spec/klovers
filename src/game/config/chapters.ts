import { MISSIONS, type Mission, type MissionId } from "./missions";
import type { RoomId } from "./rooms";

/**
 * The story, as chapters. Nothing here is new lore: the chapters are the
 * canon's own road (KLOVERS_WORLD.levelJourney — the courtyard where the egg
 * was found, then one world per course level), and each chapter's line says
 * what the canon says that world does to the learner (its narrativeEffect).
 * A chapter gathers the missions that happen in its place, so the missions
 * read as the things to do in this part of the story instead of a flat list.
 *
 * A chapter opens when its place does — that is, from the learner's real
 * course level (systems/access.ts), never from playing. Finishing a chapter's
 * missions is exploration only, like the missions themselves.
 */
export type ChapterId = "egg" | "hangul" | "market" | "cafe" | "culture" | "seoul" | "alley" | "namsan";

export interface Chapter {
  id: ChapterId;
  room: RoomId;
  missions: MissionId[];
}

export const CHAPTERS: Chapter[] = [
  { id: "egg", room: "courtyard", missions: ["hello"] },
  { id: "hangul", room: "hangul-village", missions: ["consonants", "vowels", "letterRace"] },
  { id: "market", room: "vocabulary-market", missions: ["shopping", "newFriends"] },
  { id: "cafe", room: "conversation-cafe", missions: ["cafe"] },
  { id: "culture", room: "culture-street", missions: ["culture"] },
  { id: "seoul", room: "seoul-journey", missions: ["seoul"] },
  { id: "alley", room: "seoul-market", missions: ["alley"] },
  { id: "namsan", room: "seoul-namsan", missions: ["namsan"] },
];

const BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

export const chapterMissions = (c: Chapter): Mission[] => c.missions.map((id) => BY_ID.get(id)).filter((m): m is Mission => !!m);

/** Missions beside the road (the Hub and Klovers House are not worlds of the story). */
export const SIDE_MISSIONS: Mission[] = MISSIONS.filter((m) => !CHAPTERS.some((c) => c.missions.includes(m.id)));

export const chapterOf = (mission: string): Chapter | undefined => CHAPTERS.find((c) => (c.missions as string[]).includes(mission));

export const chapterDone = (c: Chapter, done: readonly string[]): boolean => c.missions.every((id) => done.includes(id));

/** Where the story stands: the first open chapter with something left to do. */
export function currentChapter(done: readonly string[], isOpen: (r: RoomId) => boolean): Chapter | null {
  return CHAPTERS.find((c) => isOpen(c.room) && !chapterDone(c, done)) ?? null;
}
