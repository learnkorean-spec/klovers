import { describe, expect, it } from "vitest";
import { findPortal, ROOMS } from "../../config/rooms";
import { PLAYER } from "../../config/world";
import { resolveCollisions } from "../collision";
import { worldAccess } from "../access";
import { INTERACTABLES, nearestInteractable, pickInteractable, VILLAGE_LETTERS } from "../../config/interactions";
import { stickDirection } from "../movement";

describe("KLOVERS World rooms", () => {
  it("every door leads to a real room and arrival point", () => {
    for (const room of Object.values(ROOMS)) {
      for (const portal of room.portals) {
        expect(ROOMS[portal.to]).toBeDefined();
        expect(ROOMS[portal.to].spawns[portal.arrive]).toBeDefined();
      }
    }
  });

  it("arrival points are clear of every gate zone (no instant bounce back)", () => {
    for (const room of Object.values(ROOMS)) {
      for (const spawn of Object.values(room.spawns)) {
        expect(findPortal(spawn.x, spawn.z, room.portals)).toBeUndefined();
      }
    }
  });

  it("arrival points are walkable (collision leaves them in place)", () => {
    for (const room of Object.values(ROOMS)) {
      for (const spawn of Object.values(room.spawns)) {
        const p = { x: spawn.x, z: spawn.z };
        resolveCollisions(p, PLAYER.radius, room.colliders, room.bounds);
        expect(p).toEqual({ x: spawn.x, z: spawn.z });
      }
    }
  });

  it("every gate zone can be reached from inside the room", () => {
    for (const room of Object.values(ROOMS)) {
      for (const portal of room.portals) {
        const cx = (portal.zone.minX + portal.zone.maxX) / 2;
        const edge = portal.zone.minZ < 0 ? portal.zone.minZ : portal.zone.maxZ;
        // Walk as far toward the wall as collision allows, through the zone centre.
        const p = { x: cx, z: edge };
        resolveCollisions(p, PLAYER.radius, room.colliders, room.bounds);
        expect(findPortal(p.x, p.z, room.portals)?.id).toBe(portal.id);
      }
    }
  });

  it("every gate into a later canon world carries a locked notice", () => {
    const gated = new Set(["vocabulary-market", "conversation-cafe", "culture-street", "seoul-journey"]);
    const order: Record<string, number> = { courtyard: 0, "hangul-village": 1, hub: 1.5, "vocabulary-market": 2, "conversation-cafe": 3, "culture-street": 4, "seoul-journey": 5, "klovers-house": 1.6 };
    for (const room of Object.values(ROOMS)) {
      for (const portal of room.portals) {
        // Going back never needs a lock; going forward into a gated world does.
        const forward = gated.has(portal.to) && order[portal.to] > order[room.id];
        if (forward) expect(portal.lockedNotice, `${room.id} → ${portal.to}`).toBeDefined();
      }
    }
  });
});

describe("KLOVERS World access (real level only)", () => {
  it("guests and learners without a level get the courtyard and Hangul Village", () => {
    for (const lvl of [null, "", "not-a-level"]) {
      const a = worldAccess(lvl, false);
      expect([...a.open].sort()).toEqual(["courtyard", "hangul-village", "hub", "klovers-house"]);
      expect(a.preview).toBe(false);
    }
  });

  it("a level opens its own world and every world before it", () => {
    expect(worldAccess("hangul", false).open.has("vocabulary-market")).toBe(false);
    expect(worldAccess("l1", false).open.has("vocabulary-market")).toBe(true);
    expect(worldAccess("l1", false).open.has("conversation-cafe")).toBe(false);
    expect(worldAccess("l2", false).open.has("conversation-cafe")).toBe(true);
    expect(worldAccess("l2", false).open.has("culture-street")).toBe(false);
    expect(worldAccess("l3", false).open.has("culture-street")).toBe(true);
    expect(worldAccess("l3", false).open.has("seoul-journey")).toBe(false);
    for (const lvl of ["l4", "l5", "l6"]) expect(worldAccess(lvl, false).open.has("seoul-journey")).toBe(true);
    // Experienced learners are never sent back to replay beginner worlds.
    const l4 = worldAccess("l4", false).open;
    expect(l4.has("vocabulary-market") && l4.has("conversation-cafe")).toBe(true);
  });

  it("legacy level labels map like the dashboard does", () => {
    expect(worldAccess("level_1", false).open.has("vocabulary-market")).toBe(true);
  });

  it("admins get a labelled preview of every world", () => {
    const a = worldAccess(null, true);
    expect(a.preview).toBe(true);
    expect(a.open.has("conversation-cafe")).toBe(true);
  });
});

describe("KLOVERS World interactions", () => {
  it("every interactable can be reached on foot and focuses itself", () => {
    for (const it of INTERACTABLES) {
      const room = ROOMS[it.room];
      const p = { x: it.x, z: it.z };
      resolveCollisions(p, PLAYER.radius, room.colliders, room.bounds);
      expect(Math.hypot(p.x - it.x, p.z - it.z)).toBeLessThanOrEqual(it.radius);
      // Doors only exist while their world is open; locked notes while it is not.
      expect(nearestInteractable(it.room, p.x, p.z, undefined, () => !!it.whileOpen)?.id).toBe(it.id);
    }
  });

  it("no room's arrival point already stands at something to use", () => {
    for (const room of Object.values(ROOMS)) {
      for (const spawn of Object.values(room.spawns)) {
        expect(nearestInteractable(room.id, spawn.x, spawn.z)).toBeUndefined();
        expect(nearestInteractable(room.id, spawn.x, spawn.z, undefined, () => true)).toBeUndefined();
      }
    }
  });
});

describe("touch joystick", () => {
  it("ignores a resting thumb and pushes forward away from the camera", () => {
    expect(stickDirection(0.05, 0.05, 0).strength).toBe(0);
    const d = stickDirection(0, 1, 0);
    expect(d.z).toBeCloseTo(-1);
    expect(d.strength).toBeCloseTo(1);
  });
});

describe("guest path (the Hub is open to everyone)", () => {
  it("courtyard → village → hub is walkable without the market", () => {
    const guest = worldAccess(null, false);
    const reach = new Set<string>(["courtyard"]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const room of Object.values(ROOMS)) {
        if (!reach.has(room.id)) continue;
        for (const p of room.portals) {
          const open = !p.lockedNotice || guest.open.has(p.to);
          if (open && !reach.has(p.to)) {
            reach.add(p.to);
            grew = true;
          }
        }
      }
    }
    expect([...reach].sort()).toEqual(["courtyard", "hangul-village", "hub", "klovers-house"]);
  });

  it("four progression states open exactly the right worlds", () => {
    const worlds = (a: ReturnType<typeof worldAccess>) => ["vocabulary-market", "conversation-cafe"].filter((r) => a.open.has(r as never));
    expect(worlds(worldAccess(null, false))).toEqual([]);
    expect(worlds(worldAccess("l1", false))).toEqual(["vocabulary-market"]);
    expect(worlds(worldAccess("l2", false))).toEqual(["vocabulary-market", "conversation-cafe"]);
    const admin = worldAccess(null, true);
    expect(worlds(admin)).toEqual(["vocabulary-market", "conversation-cafe"]);
    expect(admin.preview).toBe(true);
  });

  it("a gate into a locked world is inspectable only while it is locked", () => {
    const gate = INTERACTABLES.find((i) => i.id === "gate-village-market-gate");
    expect(gate?.kind).toBe("locked");
    expect(nearestInteractable("hangul-village", gate!.x, gate!.z, undefined, () => false)?.id).toBe(gate!.id);
    // Once open, the same gate offers "Enter" instead.
    expect(nearestInteractable("hangul-village", gate!.x, gate!.z, undefined, () => true)?.kind).toBe("door");
  });
});

describe("choosing what to offer", () => {
  it("prefers what the learner faces, and holds the current choice (no flicker)", () => {
    const a = { id: "a", room: "courtyard" as const, kind: "learn" as const, action: "learn" as const, x: 1, z: 0, radius: 2 };
    const b = { id: "b", room: "courtyard" as const, kind: "learn" as const, action: "learn" as const, x: -1, z: 0, radius: 2 };
    const list = [a, b];
    // Facing +x (yaw π/2): a wins though both are 1 m away.
    expect(pickInteractable("courtyard", 0, 0, Math.PI / 2, null, () => false, [], list)?.id).toBe("a");
    // Facing −x: b wins.
    expect(pickInteractable("courtyard", 0, 0, -Math.PI / 2, null, () => false, [], list)?.id).toBe("b");
    // Slightly nearer b, but a is held: a stays.
    expect(pickInteractable("courtyard", -0.1, 0, 0, "a", () => false, [], list)?.id).toBe("a");
    // Held a little past its radius, then let go.
    expect(pickInteractable("courtyard", 3.2, 0, 0, "a", () => false, [], [a])?.id).toBe("a");
    expect(pickInteractable("courtyard", 3.5, 0, 0, "a", () => false, [], [a])).toBeUndefined();
  });

  it("offers Cluby only when the learner turns to him", () => {
    const cluby = { id: "cluby", room: "courtyard" as const, kind: "cluby" as const, action: "talk" as const, x: 1, z: 0, radius: 1.6, needsFacing: true };
    expect(pickInteractable("courtyard", 0, 0, 0, null, () => false, [cluby], [])).toBeUndefined();
    expect(pickInteractable("courtyard", 0, 0, Math.PI / 2, null, () => false, [cluby], [])?.id).toBe("cluby");
  });

  it("every room has its own things to do, within the brief's limits", () => {
    const people = (room: string) => INTERACTABLES.filter((i) => i.room === room && (i.kind === "say" || i.kind === "talk"));
    expect(people("courtyard").length).toBe(1);
    expect(people("hangul-village").length).toBeGreaterThanOrEqual(2);
    expect(people("hub").length).toBeGreaterThanOrEqual(2);
    const learn = INTERACTABLES.filter((i) => i.room === "vocabulary-market" && i.kind === "learn");
    expect(learn.length).toBeGreaterThanOrEqual(3);
    expect(INTERACTABLES.filter((i) => i.letter).map((i) => i.letter).sort()).toEqual([...VILLAGE_LETTERS].sort());
  });
});
