import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../../config/chapters";
import { MEMORY_OF, MEMORY_ORDER, memory, memoryDue } from "../../config/memories";
import { KLOVERS_WORLD } from "@/config/klovers-world";

describe("Cluby's returning memories", () => {
  it("are the canon's, one per chapter, in the road's order, with the canon's word", () => {
    const canon = KLOVERS_WORLD.longTermStory.memories;
    expect(MEMORY_ORDER).toEqual(canon.map((m) => m.id));
    expect(CHAPTERS.map((c) => MEMORY_OF[c.id])).toEqual(canon.map((m) => m.id));
    for (const m of canon) for (const lang of ["en", "ar"] as const) expect(memory(lang, m.id).ko).toBe(m.word);
  });

  it("have a title, a few lines and a meaning in both languages", () => {
    for (const id of MEMORY_ORDER)
      for (const lang of ["en", "ar"] as const) {
        const m = memory(lang, id);
        expect(m.title.length).toBeGreaterThan(2);
        expect(m.text.length).toBeGreaterThan(60);
        expect(m.gloss.length).toBeGreaterThan(2);
      }
  });

  it("return only after the hatch, only for a finished chapter, and only once", () => {
    const base = { clubyHere: true, chapterDone: true, remembered: [] as string[] };
    expect(memoryDue("hangul", base)).toBe("strokes");
    expect(memoryDue("hangul", { ...base, clubyHere: false })).toBeNull();
    expect(memoryDue("hangul", { ...base, chapterDone: false })).toBeNull();
    expect(memoryDue("hangul", { ...base, remembered: ["strokes"] })).toBeNull();
  });

  it("keep the mystery slow: only the last memory hints that he is not the only one", () => {
    const hint = /another|answers|آخر|يجيب ضوء/;
    for (const id of MEMORY_ORDER.slice(0, -1)) expect(memory("en", id).text).not.toMatch(/another roof|not the only/);
    expect(memory("en", "light").text).toMatch(hint);
  });
});
