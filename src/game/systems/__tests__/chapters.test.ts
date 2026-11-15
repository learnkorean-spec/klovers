import { describe, expect, it } from "vitest";
import { CHAPTERS, SIDE_MISSIONS, chapterDone, chapterMissions, chapterOf, currentChapter } from "../../config/chapters";
import { WORLD_COPY } from "../../config/copy";
import { MISSIONS, missionRooms } from "../../config/missions";
import { worldAccess } from "../access";
import { KLOVERS_WORLD } from "@/config/klovers-world";
import type { RoomId } from "../../config/rooms";

describe("the story's chapters", () => {
  it("follow the canon's road: the courtyard, then the worlds in level order", () => {
    const journey = Object.values(KLOVERS_WORLD.levelJourney as Record<string, unknown>)
      .filter((s): s is { world: string } => !!s && typeof s === "object" && "world" in (s as object))
      .map((s) => s.world);
    const worlds = [...new Set(journey)];
    const rooms = CHAPTERS.map((c) => c.room).filter((r) => r !== "courtyard" && r !== "seoul-market" && r !== "seoul-namsan");
    expect(rooms).toEqual(worlds);
    expect(CHAPTERS[0].room).toBe("courtyard");
  });

  it("put every mission in one chapter or beside the road, in its own place", () => {
    const inChapters = CHAPTERS.flatMap((c) => c.missions);
    expect(new Set(inChapters).size).toBe(inChapters.length);
    expect(inChapters.length + SIDE_MISSIONS.length).toBe(MISSIONS.length);
    for (const c of CHAPTERS) {
      expect(chapterMissions(c).length, c.id).toBe(c.missions.length);
      expect(c.missions.length, c.id).toBeGreaterThan(0);
      // Its missions start in its place, or (the first chapter) lead out of it.
      for (const m of chapterMissions(c)) expect(m.room === c.room || missionRooms(m).includes(c.room), m.id).toBe(true);
      expect(chapterOf(c.missions[0])?.id).toBe(c.id);
    }
  });

  it("have a title and a line in both languages", () => {
    for (const lang of ["en", "ar"] as const)
      for (const c of CHAPTERS) {
        expect(WORLD_COPY[lang].chapters[c.id].title.length).toBeGreaterThan(2);
        expect(WORLD_COPY[lang].chapters[c.id].line.length).toBeGreaterThan(20);
      }
  });

  it("open only with the learner's real level, and move on when a chapter is done", () => {
    const guest = (r: RoomId) => worldAccess(null, false).open.has(r);
    const level1 = (r: RoomId) => worldAccess("l1", false).open.has(r);
    expect(currentChapter([], guest)?.id).toBe("egg");
    expect(currentChapter(["hello"], guest)?.id).toBe("hangul");
    // A guest who has done everything open to guests has no next chapter: the market needs Level 1.
    expect(currentChapter(["hello", "consonants", "vowels", "letterRace"], guest)).toBeNull();
    expect(currentChapter(["hello", "consonants", "vowels", "letterRace"], level1)?.id).toBe("market");
    expect(chapterDone(CHAPTERS[2], ["shopping"])).toBe(false);
    expect(chapterDone(CHAPTERS[2], ["shopping", "newFriends"])).toBe(true);
  });
});
