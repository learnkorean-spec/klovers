import { describe, it, expect } from "vitest";
import { GAME_WORLDS } from "@/constants/gameWorlds";
import { GAMES_CATALOG } from "@/constants/gamesList";

describe("GAME_WORLDS", () => {
  const placed = GAME_WORLDS.flatMap((w) => w.gameIds);

  it("places every catalog game in a world", () => {
    const missing = GAMES_CATALOG.map((g) => g.id).filter((id) => !placed.includes(id));
    expect(missing).toEqual([]);
  });

  it("only references games that exist", () => {
    const ids = new Set(GAMES_CATALOG.map((g) => g.id));
    expect(placed.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("puts no game in two worlds", () => {
    expect(new Set(placed).size).toBe(placed.length);
  });
});
