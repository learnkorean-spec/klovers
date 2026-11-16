import { describe, expect, it } from "vitest";
import { CHATS, CHATS2, CHAT_ORDER, chatAgain, chatAgainKey, chatClip, chatMetKey, chatOf } from "../../config/chats";

/** The second, longer talk with each of the market's seven friends. */
describe("a second talk with each friend", () => {
  it("is offered only once they are a friend, and only by the seven", () => {
    expect(chatAgain("jihoon", [])).toBe(false);
    expect(chatAgain("jihoon", [chatMetKey("jihoon")])).toBe(true);
    expect(chatAgain("gardener", [chatMetKey("gardener")])).toBe(false);
    expect(chatOf("en", "jihoon", true)).toBe(CHATS2.en.jihoon);
    expect(chatOf("en", "gardener", true)).toBe(CHATS.en.gardener);
    expect(chatAgainKey("hana")).not.toBe(chatMetKey("hana"));
  });

  it("says the same Korean in both languages, with the same replies fitting", () => {
    for (const id of CHAT_ORDER) {
      const en = CHATS2.en[id];
      const ar = CHATS2.ar[id];
      expect(ar.turns.length).toBe(en.turns.length);
      expect(ar.closing.ko).toBe(en.closing.ko);
      expect(en.name).toBe(CHATS.en[id].name);
      en.turns.forEach((t, i) => {
        expect(ar.turns[i].ko).toBe(t.ko);
        expect(ar.turns[i].options.map((o) => [o.ko, o.right, o.reply?.ko])).toEqual(t.options.map((o) => [o.ko, o.right, o.reply?.ko]));
      });
    }
  });

  it("has three different replies a turn, at least one fitting, each explained; two fitting replies each get an answer", () => {
    for (const lang of ["en", "ar"] as const)
      for (const id of CHAT_ORDER)
        for (const t of CHATS2[lang][id].turns) {
          expect(new Set(t.options.map((o) => o.ko)).size).toBe(3);
          const right = t.options.filter((o) => o.right);
          expect(right.length).toBeGreaterThan(0);
          if (right.length > 1) for (const o of right) expect(o.reply, o.ko).toBeDefined();
          for (const o of t.options) {
            expect(o.feedback.length).toBeGreaterThan(10);
            if (!o.right) expect(o.feedback, o.ko).toMatch(/[가-힣]/); // it says what to say instead
          }
        }
  });

  it("is a different conversation from the first, with recordings of its own", () => {
    for (const id of CHAT_ORDER) {
      expect(CHATS2.en[id].turns[0].ko).not.toBe(CHATS.en[id].turns[0].ko);
      expect(chatClip(id, CHATS2.en[id].turns[0].ko)).toBe(`chat/${id}2-0.mp3`);
      expect(CHATS2.en[id].focus).not.toBe(CHATS.en[id].focus);
    }
  });
});
