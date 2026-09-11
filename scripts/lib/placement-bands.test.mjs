import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * placement-bands.test.mjs — guards the score thresholds against drift.
 *
 * WHY THIS EXISTS
 *
 * `EXAM_BANDS` in src/constants/topikPapers.ts is the whole placement policy:
 * 8 is all of section A, 18 is A+B (through 1급), 28 adds C, 40 adds D, 48 is
 * most of E. That file says so itself — "the six numbers below are the whole
 * placement policy. Changing where a student lands is a one-line edit here."
 *
 * Since 11 Sep 2026 the placement-result EMAIL prints those same numbers back
 * to the student: "your score: 23. The Level 2 line is 18 — passed. The Level 3
 * line is 28 — 5 marks away." Edge functions run in Deno and cannot import from
 * src/, so the email template holds a copy.
 *
 * A copy that nobody checks is a copy that eventually lies. The failure is
 * quiet and it is aimed at students: move a band in topikPapers.ts, forget the
 * template, and every placement letter afterwards tells a reader that a line
 * sits somewhere it does not — while the level in the same letter comes from
 * the real number. This test makes that divergence a red build instead.
 *
 * It reads both files as TEXT rather than importing them. The template is Deno
 * TypeScript with .ts import specifiers; importing it from vitest would mean
 * building it, and the thing under test is four integers and their order.
 */

// vitest runs from the repository root, which is how the other tests in this
// directory resolve their fixtures.
const root = process.cwd();

const PAPERS = join(root, "src", "constants", "topikPapers.ts");
const TEMPLATE = join(
  root,
  "supabase", "functions", "send-confirmation-email", "templates", "placementResult.ts",
);

/** `{ minScore: 48, grade: "above" },` -> [48, "above"] */
function parseExamBands(source) {
  const block = source.match(/export const EXAM_BANDS[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error("EXAM_BANDS not found in topikPapers.ts");
  return [...block[1].matchAll(/minScore:\s*(\d+)\s*,\s*grade:\s*"([a-z0-9]+)"/g)]
    .map((m) => [Number(m[1]), m[2]]);
}

/** `{ min: 8, key: "l1" },` -> [8, "l1"] */
function parseTemplateBands(source) {
  const block = source.match(/const BANDS[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error("BANDS not found in placementResult.ts");
  return [...block[1].matchAll(/min:\s*(\d+)\s*,\s*key:\s*"([a-z0-9]+)"/g)]
    .map((m) => [Number(m[1]), m[2]]);
}

function parseAboveMin(source) {
  const m = source.match(/const ABOVE_MIN\s*=\s*(\d+)/);
  if (!m) throw new Error("ABOVE_MIN not found in placementResult.ts");
  return Number(m[1]);
}

/**
 * TOPIK grade -> Klovers level key, as topikPlacement.ts defines it. Written
 * out here so a rename there fails this test rather than silently relabelling
 * a threshold in a student's letter.
 */
const GRADE_TO_LEVEL = { g1: "l1", g2: "l2", g3: "l3", g4: "l4" };

describe("placement bands", () => {
  const papers = readFileSync(PAPERS, "utf8");
  const template = readFileSync(TEMPLATE, "utf8");

  const examBands = parseExamBands(papers);
  const templateBands = parseTemplateBands(template);

  it("reads five bands out of topikPapers.ts", () => {
    // If this fails, the policy gained or lost a band and the email has not
    // been told. Do not relax it — update the template and this expectation
    // together.
    expect(examBands.length).toBe(5);
  });

  it("names the same four level lines, in the same order, as the email", () => {
    // EXAM_BANDS is descending and the template ascends, so one is reversed.
    // The "above" band is deliberately absent from the template's list: past
    // 4급 is not a level with a line of its own.
    const expected = [...examBands]
      .filter(([, grade]) => grade !== "above")
      .reverse()
      .map(([min, grade]) => {
        const level = GRADE_TO_LEVEL[grade];
        if (!level) throw new Error(`unmapped grade "${grade}" — update GRADE_TO_LEVEL`);
        return [min, level];
      });

    expect(templateBands).toEqual(expected);
  });

  it("agrees with topikPapers.ts on where 'past 4급' starts", () => {
    const above = examBands.find(([, grade]) => grade === "above");
    expect(above).toBeTruthy();
    expect(parseAboveMin(template)).toBe(above[0]);
  });

  it("keeps the email's bands ascending", () => {
    // The template walks the list forward to find the highest line a score
    // clears. Out of order, it reports the wrong threshold.
    for (let i = 1; i < templateBands.length; i += 1) {
      expect(templateBands[i][0]).toBeGreaterThan(templateBands[i - 1][0]);
    }
  });

  it("keeps the lowest line above what pure guessing scores", () => {
    // 52 items, four options: chance alone scores 13. topikPapers.ts states
    // this limit; the email now prints the line, so it is checked here too.
    expect(templateBands[0][0]).toBeLessThan(13);
    expect(templateBands[1][0]).toBeGreaterThan(13);
  });
});
