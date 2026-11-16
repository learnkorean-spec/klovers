import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALL_CHATS, CHATS, chatClip, chatClips } from "../../config/chats";
import { MEMORY_ORDER } from "../../config/memories";

const DIR = "public/assets/world/voice/";

/** Every line a person says has its recording, and no recording is left over. */
describe("recorded voices of the conversations", () => {
  it("has a file for every line, answer and goodbye", () => {
    for (const id of ALL_CHATS) for (const clip of chatClips(id)) expect(existsSync(DIR + clip), clip).toBe(true);
  });

  it("finds the same file in English and in Arabic", () => {
    for (const id of ALL_CHATS) {
      const ar = CHATS.ar[id];
      for (const t of ar.turns) expect(chatClip(id, t.ko), `${id}: ${t.ko}`).toBeDefined();
      expect(chatClip(id, ar.closing.ko)).toBeDefined();
    }
  });

  it("has a file for each of Cluby's words", () => {
    for (const m of MEMORY_ORDER) expect(existsSync(`${DIR}chat/memory-${m}.mp3`), m).toBe(true);
  });

  it("ships no file that nobody says", () => {
    const used = new Set([...ALL_CHATS.flatMap((id) => chatClips(id)), ...MEMORY_ORDER.map((m) => `chat/memory-${m}.mp3`)]);
    for (const f of readdirSync(DIR + "chat")) expect(used.has(`chat/${f}`), f).toBe(true);
  });
});
