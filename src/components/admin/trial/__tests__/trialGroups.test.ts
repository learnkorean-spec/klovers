import { describe, expect, it } from "vitest";
import {
  arabicOnly,
  englishOnly,
  groupOf,
  groupTrialTargets,
  levelLabel,
  type GroupableBooking,
} from "../trialGroups";

const row = (over: Partial<GroupableBooking> & { id: string }): GroupableBooking => ({
  email: `${over.id}@example.test`,
  level: null,
  class_language: "english",
  rebook_email_sent_at: null,
  ...over,
});

describe("groupOf", () => {
  it("puts every spelling of the beginner level in hangul", () => {
    for (const level of ["hangul", "Hangul", " HANGEUL ", "level_0", "l0", "0"]) {
      expect(groupOf(row({ id: "a", level }))).toBe("hangul");
    }
  });

  it("accepts both the old and the canonical level keys", () => {
    // trial_bookings still holds level_1..level_6 from before the rename;
    // src/constants/levels.ts uses l1..l6. Neither may fall through.
    expect(groupOf(row({ id: "b", level: "level_1" }))).toBe("levels");
    expect(groupOf(row({ id: "c", level: "l6" }))).toBe("levels");
  });

  it("treats blank and whitespace as no level given", () => {
    expect(groupOf(row({ id: "d", level: null }))).toBe("noLevel");
    expect(groupOf(row({ id: "e", level: "" }))).toBe("noLevel");
    expect(groupOf(row({ id: "f", level: "   " }))).toBe("noLevel");
  });

  it("counts something unrecognised as a level, not as missing", () => {
    // They told us they are not a beginner. Sending them a placement test
    // would be answering a question they already answered.
    expect(groupOf(row({ id: "g", level: "intermediate-ish" }))).toBe("levels");
  });
});

describe("groupTrialTargets", () => {
  const rows = [
    row({ id: "1", level: "hangul", class_language: "arabic" }),
    row({ id: "2", level: "hangul", class_language: "english", rebook_email_sent_at: "2026-08-01T00:00:00Z" }),
    row({ id: "3", level: "level_1", class_language: "english" }),
    row({ id: "4", level: "level_1", class_language: "english", rebook_email_sent_at: "2026-08-01T00:00:00Z" }),
    row({ id: "5", level: "level_6", class_language: "ar" }),
    row({ id: "6", level: null, class_language: "english" }),
  ];

  it("splits into exactly three groups and loses nobody", () => {
    const g = groupTrialTargets(rows);
    expect(g.hangul.counts.total).toBe(2);
    expect(g.levels.counts.total).toBe(3);
    expect(g.noLevel.counts.total).toBe(1);
    expect(
      g.hangul.counts.total + g.levels.counts.total + g.noLevel.counts.total,
    ).toBe(rows.length);
  });

  it("counts Arabic the same way the letter picks its language", () => {
    const g = groupTrialTargets(rows);
    // "ar" and "arabic" both count; everything else is English.
    expect(g.hangul.counts.arabic).toBe(1);
    expect(g.hangul.counts.english).toBe(1);
    expect(g.levels.counts.arabic).toBe(1);
    expect(g.levels.counts.english).toBe(2);
  });

  it("separates never-invited from re-invite", () => {
    const g = groupTrialTargets(rows);
    expect(g.hangul.counts.neverInvited).toBe(1);
    expect(g.hangul.counts.reInvite).toBe(1);
    expect(g.levels.counts.neverInvited).toBe(2);
    expect(g.levels.counts.reInvite).toBe(1);
  });

  it("breaks the levels group down, commonest first", () => {
    const g = groupTrialTargets(rows);
    expect(g.levels.levelBreakdown).toEqual([
      { level: "level_1", count: 2 },
      { level: "level_6", count: 1 },
    ]);
  });

  it("gives the other groups no breakdown - it would say one thing", () => {
    const g = groupTrialTargets(rows);
    expect(g.hangul.levelBreakdown).toEqual([]);
    expect(g.noLevel.levelBreakdown).toEqual([]);
  });

  it("returns three empty groups for an empty list rather than throwing", () => {
    const g = groupTrialTargets([]);
    for (const key of ["hangul", "levels", "noLevel"] as const) {
      expect(g[key].counts.total).toBe(0);
      expect(g[key].rows).toEqual([]);
    }
  });

  it("keeps arrival order inside a group so the table does not jump", () => {
    const g = groupTrialTargets(rows);
    expect(g.levels.rows.map((r) => r.id)).toEqual(["3", "4", "5"]);
  });
});

describe("arabicOnly / englishOnly", () => {
  const rows = [
    row({ id: "a", class_language: "arabic" }),
    row({ id: "b", class_language: "ar" }),
    row({ id: "c", class_language: "english" }),
    row({ id: "d", class_language: null }),
  ];

  it("splits the list in two with nothing left over", () => {
    expect(arabicOnly(rows).map((r) => r.id)).toEqual(["a", "b"]);
    expect(englishOnly(rows).map((r) => r.id)).toEqual(["c", "d"]);
    expect(arabicOnly(rows).length + englishOnly(rows).length).toBe(rows.length);
  });
});

describe("levelLabel", () => {
  it("reads the old and the new keys the same way", () => {
    expect(levelLabel("level_1")).toBe("Level 1");
    expect(levelLabel("l1")).toBe("Level 1");
    expect(levelLabel("hangul")).toBe("Hangul");
  });

  it("shows a dash rather than an empty cell when nothing was given", () => {
    expect(levelLabel(null)).toBe("—");
    expect(levelLabel("  ")).toBe("—");
  });

  it("prints anything it cannot parse rather than hiding it", () => {
    expect(levelLabel("whatever")).toBe("whatever");
  });
});
