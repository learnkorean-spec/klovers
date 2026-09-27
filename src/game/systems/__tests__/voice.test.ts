import { describe, expect, it } from "vitest";
import { WORLD_COPY } from "../../config/copy";
import { LINES } from "../../../../supabase/functions/world-voice/lines";

describe("recorded voices", () => {
  it("voice exactly the Korean the world shows, in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      const c = WORLD_COPY[lang];
      for (const id of ["auntie", "vendor", "shopkeeper", "baker", "hubFriend", "hubReader"] as const) expect(LINES[id].ko).toBe(c.say[id].ko);
      expect(LINES.minsu.ko).toBe(c.talk.minsu.ko);
      expect(LINES.adam.ko).toBe(c.talk.adam.ko);
      expect(LINES.lina.ko).toBe(c.talk.lina.ko);
    }
  });

  it("gives the men a man's voice", () => {
    const men = ["ash", "echo", "onyx"];
    for (const id of ["minsu", "adam", "vendor", "shopkeeper", "hubFriend"]) expect(men).toContain(LINES[id].voice);
    for (const id of ["lina", "auntie", "baker", "hubReader"]) expect(men).not.toContain(LINES[id].voice);
  });
});
