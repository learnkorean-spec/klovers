/**
 * The level ladder lives twice: in src/constants/levels.ts and, for automatic
 * progression, in the SQL helpers of the migration. This keeps them from
 * drifting: same order, same class counts, nothing after the top level.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { LEVELS } from "@/constants/levels";

const sql = readFileSync("supabase/migrations/20261127120000_auto_level_progression.sql", "utf8");

describe("level progression SQL mirrors levels.ts", () => {
  const ordered = [...LEVELS].sort((a, b) => a.order - b.order);

  it("moves each level to the next one in order", () => {
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(sql).toContain(`when '${ordered[i].key}' then '${ordered[i + 1].key}'`);
    }
  });

  it("has nothing after the top level", () => {
    const top = ordered[ordered.length - 1].key;
    expect(sql).not.toContain(`when '${top}' then`);
  });

  it("uses the same class count per level", () => {
    const four = ordered.filter((l) => l.sessions === 4).map((l) => l.key);
    const rest = ordered.filter((l) => l.sessions === 24).map((l) => l.key);
    expect(four.length + rest.length).toBe(ordered.length);
    for (const k of four) expect(sql).toContain(`_level = '${k}' then 4`);
    for (const k of rest) expect(sql).toContain(`'${k}'`);
    expect(sql).toMatch(/in \(([^)]*)\) then 24/);
  });
});
