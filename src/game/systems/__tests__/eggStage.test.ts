import { beforeEach, describe, expect, it } from "vitest";
import { eggStageSeen, markEggStage } from "@/lib/clubyAwake";
import { createStoryState } from "../story";
import { WORLD_COPY } from "../../config/copy";

describe("the egg's real stage in the world", () => {
  beforeEach(() => localStorage.clear());

  it("is dormant until the dashboard has recorded real progress", () => {
    expect(eggStageSeen()).toBe(0);
    markEggStage(1);
    expect(eggStageSeen()).toBe(1);
    markEggStage(2);
    expect(eggStageSeen()).toBe(2);
    localStorage.setItem("kl_egg_stage", "banana");
    expect(eggStageSeen()).toBe(0);
  });

  it("is carried by the story state, and never starts above what was given", () => {
    expect(createStoryState(false).stage).toBe(0);
    expect(createStoryState(false, 2).stage).toBe(2);
    expect(createStoryState(false, 2).egg).toBe("dormant");
  });

  it("says what made the crack and the glow, and what comes next, in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      expect(WORLD_COPY[lang].egg.cracked.length).toBeGreaterThan(30);
      expect(WORLD_COPY[lang].egg.glowing.length).toBeGreaterThan(30);
    }
  });
});
