import { describe, expect, it } from "vitest";
import { findPortal, ROOMS } from "../../config/rooms";
import { PLAYER } from "../../config/world";
import { resolveCollisions } from "../collision";

describe("KLOVERS World rooms", () => {
  it("every door leads to a real room and arrival point", () => {
    for (const room of Object.values(ROOMS)) {
      for (const portal of room.portals) {
        if (portal.kind !== "door") continue;
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

  it("the Vocabulary Market gate stays closed (canon: opens on a real milestone)", () => {
    const market = ROOMS["hangul-village"].portals.find((p) => p.id === "market-gate");
    expect(market?.kind).toBe("closed");
  });
});
