import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * admin-tabs.test.mjs — the admin tab-grouping invariant that AdminDashboard.tsx
 * claims to have, and did not.
 *
 * The comment above TAB_GROUPS says: "EVERY value that has a <TabsContent> below
 * must appear in exactly one group", and then promises "The assertion under this
 * list fails loudly if it happens again". There was no assertion. What was there
 * is a DEV-only console.warn, which is invisible in a production build and in CI —
 * the two places a regression would actually reach a person.
 *
 * WHAT THAT COST
 *
 * book-plan was ungrouped for its whole life, and ungrouped is not "merely
 * uncategorised". `activeGroup` falls back to "ops", so `inActiveGroup("book-plan")`
 * was false, so its TabsTrigger was never rendered: no pill, no way in. The
 * sidebar never listed it either. The screen Re asked for on 1 October — the whole
 * Klovers shelf, which books are done and which are half-built — was reachable only
 * by typing ?tab=book-plan into the address bar, and on arrival the group row showed
 * Operations with nothing selected in it.
 *
 * WHY THESE FOUR CHECKS
 *
 * Each one is a different way the same silence happens:
 *   1. a <TabsContent> in no group       -> no pill, unreachable (book-plan)
 *   2. a tab in two groups               -> two pills claiming one screen
 *   3. a group entry with no content     -> a pill that draws nothing when clicked
 *   4. a group entry with no guarded trigger -> grouped, and still never drawn
 *
 * Read as text rather than imported: AdminDashboard.tsx is TSX behind the "@/"
 * alias with an i18n context at module load, and this checks one array of strings.
 * The same tradeoff, for the same reason, as scripts/lib/brand-identity.test.mjs.
 */

const repoRoot = process.cwd();
const dash = readFileSync(join(repoRoot, "src/pages/AdminDashboard.tsx"), "utf-8");
const shell = readFileSync(join(repoRoot, "src/components/admin/AdminShell.tsx"), "utf-8");

/** The TAB_GROUPS literal, parsed into { id, tabs }. */
function parseGroups() {
  const block = dash.match(/const TAB_GROUPS[\s\S]*?\n  \];/);
  if (!block) throw new Error("could not find the TAB_GROUPS literal in AdminDashboard.tsx");
  return [...block[0].matchAll(/\{ id: "([a-z-]+)"[\s\S]*?tabs: \[([^\]]*)\]/g)].map((m) => ({
    id: m[1],
    tabs: m[2]
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean),
  }));
}

const groups = parseGroups();
const grouped = groups.flatMap((g) => g.tabs);
const contentValues = [...dash.matchAll(/<TabsContent value="([a-z0-9-]+)"/g)].map((m) => m[1]);

describe("the parse found something to check (guards this file itself)", () => {
  it("read at least four groups and twenty tabs", () => {
    // If the regexes silently matched nothing, every assertion below would pass
    // vacuously — which is how a guard becomes decorative.
    expect(groups.length).toBeGreaterThanOrEqual(4);
    expect(grouped.length).toBeGreaterThan(20);
    expect(contentValues.length).toBeGreaterThan(20);
  });
});

describe("every admin screen is reachable", () => {
  it("has a group for every <TabsContent>", () => {
    const ungrouped = contentValues.filter((v) => !grouped.includes(v));
    expect(
      ungrouped,
      "these screens have a TabsContent but no TAB_GROUPS entry, so their pill is never\n" +
        "drawn and no link reaches them. Add each to a group in AdminDashboard.tsx:\n" +
        ungrouped.map((t) => `  ${t}`).join("\n"),
    ).toEqual([]);
  });

  it("puts every tab in exactly one group", () => {
    const twice = groups
      .flatMap((g) => g.tabs.filter((t) => groups.filter((o) => o.tabs.includes(t)).length > 1).map((t) => `${t} (in ${g.id})`));
    expect([...new Set(twice)], "a tab in two groups draws two pills for one screen").toEqual([]);
  });

  it("names no tab that has no content panel", () => {
    const stale = grouped.filter((t) => !contentValues.includes(t));
    expect(
      stale,
      "these are in TAB_GROUPS but have no <TabsContent>, so the pill draws and the click\n" +
        "shows an empty panel:\n" +
        stale.map((t) => `  ${t}`).join("\n"),
    ).toEqual([]);
  });

  it("guards every grouped tab with inActiveGroup, or it is still never drawn", () => {
    const unguarded = grouped.filter((t) => !dash.includes(`inActiveGroup("${t}")`));
    expect(
      unguarded,
      "these are grouped but their trigger is not behind inActiveGroup(...), so the pill\n" +
        "is hidden exactly as if they were ungrouped:\n" +
        unguarded.map((t) => `  ${t}`).join("\n"),
    ).toEqual([]);
  });
});

describe("the book-plan regression stays fixed", () => {
  // Pinned by name because this is the screen that was lost, and because the
  // failure is silent: nothing else in the build notices an unreachable tab.
  it("keeps book-plan in the Content group", () => {
    const content = groups.find((g) => g.id === "content");
    expect(content, "the Content group disappeared").toBeDefined();
    expect(content.tabs).toContain("book-plan");
  });

  it("keeps book-plan in the sidebar, so it can be found without the URL", () => {
    expect(shell).toContain('to: "/admin?tab=book-plan"');
  });
});
