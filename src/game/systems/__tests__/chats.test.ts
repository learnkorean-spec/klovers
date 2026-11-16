import { describe, expect, it } from "vitest";
import { CHATS, CHAT_ORDER, CHAT_PEOPLE, ROLE_CHATS, ROLE_CHAT_ORDER, chatMetKey, chatNpc, chatsMet } from "../../config/chats";
import { WORLD_COPY } from "../../config/copy";
import { INTERACTABLES } from "../../config/interactions";
import { MISSIONS, missionSteps } from "../../config/missions";
import { NPCS } from "../../config/npcs";
import { ROOMS } from "../../config/rooms";
import { isBlocked } from "../collision";
import { KLOVERS_WORLD } from "@/config/klovers-world";

/**
 * The conversations with Book 1's new Korean people: every one of the canon's
 * seven is in the world, stands in the Vocabulary Market (canon: Book 1's one
 * world), and has a full conversation in both languages.
 */
describe("conversations with the named Korean friends", () => {
  it("covers exactly the canon's Book 1 supporting cast", () => {
    const canon = KLOVERS_WORLD.supportingKoreanCast.book1;
    expect(CHAT_ORDER.map((id) => CHAT_PEOPLE[id].canon)).toEqual(canon.map((c) => c.id));
    for (const id of CHAT_ORDER) {
      const c = canon.find((x) => x.id === CHAT_PEOPLE[id].canon)!;
      expect(CHAT_PEOPLE[id].nameKo).toBe(c.name.ko);
      expect(CHATS.en[id].name).toBe(c.name.en);
      expect(CHATS.ar[id].name).toBe(c.name.ar);
    }
  });

  it("puts each friend in the Vocabulary Market, once, with a place to talk to them", () => {
    for (const id of CHAT_ORDER) {
      const people = NPCS.filter((n) => n.id === CHAT_PEOPLE[id].npc);
      expect(people.length, id).toBe(1);
      expect(people[0].room).toBe("vocabulary-market");
      expect(people[0].cast).toBe(id);
      const spots = INTERACTABLES.filter((i) => i.kind === "chat" && i.chat === id);
      expect(spots.length, id).toBe(1);
      expect(spots[0].npc).toBe(people[0].id);
      expect(spots[0].room).toBe("vocabulary-market");
      // Close enough to be talking to them, and on floor the learner can stand on.
      expect(Math.hypot(spots[0].x - people[0].x, spots[0].z - people[0].z), id).toBeLessThan(1.6);
      expect(isBlocked(spots[0].x, spots[0].z, 0.3, ROOMS["vocabulary-market"].colliders, ROOMS["vocabulary-market"].bounds), id).toBe(false);
    }
  });

  it("keeps each place to talk clear of the others, so the right person answers", () => {
    const spots = INTERACTABLES.filter((i) => i.kind === "chat");
    for (const a of spots) for (const b of spots) if (a.id < b.id && a.room === b.room) expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id} ${b.id}`).toBeGreaterThan(1.5);
  });

  it("lets the people of the later worlds talk too, opening with their recorded line", () => {
    for (const id of ROLE_CHAT_ORDER) {
      const spots = INTERACTABLES.filter((i) => i.kind === "chat" && i.chat === id);
      expect(spots.length, id).toBe(1);
      expect(spots[0].npc).toBe(ROLE_CHATS[id].npc);
      expect(chatNpc(id)).toBe(ROLE_CHATS[id].npc);
      expect(NPCS.find((n) => n.id === ROLE_CHATS[id].npc)?.room).toBe(spots[0].room);
      for (const lang of ["en", "ar"] as const) {
        // A recording says the first line, so the two must be the same sentence.
        const voice = ROLE_CHATS[id].voice;
        if (voice) expect(CHATS[lang][id].turns[0].ko).toBe(WORLD_COPY[lang].say[voice].ko);
        // Named by Re on 16 Nov 2026 (canon supportingKoreanCast.laterWorlds).
        const cast = KLOVERS_WORLD.supportingKoreanCast;
        const c = [...cast.firstSteps, ...cast.laterWorlds].find((x) => x.id === ROLE_CHATS[id].canon)!;
        expect(CHATS[lang][id].name).toBe(c.name[lang]);
        expect(ROLE_CHATS[id].nameKo).toBe(c.name.ko);
      }
    }
    // Someone to talk with in every place of the road (the market has Book 1's seven).
    expect(new Set(ROLE_CHAT_ORDER.map((id) => INTERACTABLES.find((i) => i.chat === id)!.room))).toEqual(new Set(["courtyard", "hangul-village", "conversation-cafe", "culture-street", "seoul-journey", "seoul-market", "seoul-namsan"]));
    // Every place to talk is on floor the learner can stand on.
    for (const i of INTERACTABLES.filter((x) => x.kind === "chat")) expect(isBlocked(i.x, i.z, 0.3, ROOMS[i.room].colliders, ROOMS[i.room].bounds), i.id).toBe(false);
  });

  it("writes the first places for someone who cannot read Hangul yet", () => {
    for (const id of ["gardener", "neighbour", "painter"] as const)
      for (const lang of ["en", "ar"] as const) {
        const c = CHATS[lang][id];
        expect(c.closing.roman, id).toBeTruthy();
        for (const t of c.turns) {
          expect(t.roman, `${id} ${t.ko}`).toBeTruthy();
          // A Korean reply shows how it sounds; a reading answer is already in Latin letters.
          for (const o of t.options) expect(!!o.roman || !/[가-힣]/.test(o.ko), `${id} ${o.ko}`).toBe(true);
          for (const o of t.options) if (o.reply) expect(o.reply.roman, `${id} ${o.reply.ko}`).toBeTruthy();
        }
      }
  });

  it("lets a reply change what the person says next, and only a fitting reply", () => {
    let branching = 0;
    for (const id of [...CHAT_ORDER, ...ROLE_CHAT_ORDER])
      for (const t of CHATS.en[id].turns) {
        for (const o of t.options) if (o.reply) expect(o.right, `${id} ${o.ko}`).toBe(true);
        if (t.options.filter((o) => o.right).length > 1) {
          branching++;
          // Two ways to answer mean two different answers back.
          const replies = t.options.filter((o) => o.right).map((o) => o.reply?.ko);
          expect(new Set(replies).size, id).toBe(replies.length);
          expect(replies.every(Boolean), id).toBe(true);
        }
      }
    expect(branching).toBeGreaterThan(0);
  });

  it("gives every turn three replies, one that fits, the same in both languages", () => {
    for (const id of [...CHAT_ORDER, ...ROLE_CHAT_ORDER]) {
      const en = CHATS.en[id];
      const ar = CHATS.ar[id];
      expect(en.turns.length, id).toBeGreaterThanOrEqual(3);
      expect(ar.turns.length, id).toBe(en.turns.length);
      expect(ar.closing.ko).toBe(en.closing.ko);
      en.turns.forEach((t, n) => {
        const u = ar.turns[n];
        expect(u.ko).toBe(t.ko);
        expect(t.options.filter((o) => o.right).length, `${id} ${n}`).toBeGreaterThanOrEqual(1);
        expect(t.options.filter((o) => !o.right).length, `${id} ${n}`).toBeGreaterThanOrEqual(1);
        expect(new Set(t.options.map((o) => o.ko)).size).toBe(3);
        t.options.forEach((o, k) => {
          expect(u.options[k].ko).toBe(o.ko);
          expect(u.options[k].right).toBe(o.right);
          expect(o.feedback.length).toBeGreaterThan(10);
          expect(u.options[k].feedback.length).toBeGreaterThan(10);
          // A reply that does not fit always shows the one that does.
          const right = t.options.find((x) => x.right)!.ko.replace(/[.!?]+$/, "");
          expect(u.options[k].reply?.ko).toBe(o.reply?.ko);
          if (!o.right && !/^\d/.test(right)) {
            expect(o.feedback, `${id} ${n} ${k}`).toContain(right);
            expect(u.options[k].feedback, `${id} ${n} ${k} ar`).toContain(right);
          }
        });
      });
      // The fitting reply is not always in the same place.
      expect(new Set(en.turns.map((t) => t.options.findIndex((o) => o.right))).size, id).toBeGreaterThan(1);
    }
  });

  it("has a mission for meeting all seven, and counts friends from saved state", () => {
    const m = MISSIONS.find((x) => x.id === "newFriends")!;
    expect(missionSteps(m).map((i) => i.chat)).toEqual([...CHAT_ORDER]);
    expect(chatsMet(["friend", chatMetKey("jihoon"), chatMetKey("hana")])).toBe(2);
  });
});
