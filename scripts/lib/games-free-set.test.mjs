import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * games-free-set.test.mjs — guards the guest game gate and every published
 * count that has to agree with it.
 *
 * WHY THIS TEST READS SOURCE TEXT INSTEAD OF IMPORTING
 *
 * The gate lives in `src/pages/GamesPage.tsx`, which is TSX, imports through
 * the "@/" alias, and pulls in React, lucide-react and the i18n context at
 * module load. None of that is importable from a plain node/vitest run without
 * a jsdom environment and an alias resolver, and the brief was explicit: say so
 * rather than restructure GamesPage.tsx to make it testable.
 *
 * So this parses the source as text. That is a real limitation and worth
 * naming: it checks the literals as written, not the values React evaluates. It
 * cannot catch a bug that only appears at runtime. What it does catch is the
 * whole class of drift that actually bit this page — a count in one file
 * disagreeing with a list in another, which is exactly how "30 games" survived
 * in four places while the array held 20.
 *
 * THE DRIFT THIS EXISTS TO PREVENT
 *
 * Before this change there were two independent lists: FREE_GAME_IDS gated
 * play, and a per-row `free:` boolean drove the padlock and the FREE badge.
 * They agreed only by convention, so editing one without the other would ship a
 * card marked FREE that then refused to open. The `free:` field is gone and
 * `isFree` is derived, which is why one of the assertions below is that the
 * field has not come back.
 */

const repoRoot = process.cwd();
const gamesPageSrc = readFileSync(join(repoRoot, "src/pages/GamesPage.tsx"), "utf-8");
const prerenderSrc = readFileSync(join(repoRoot, "scripts/prerender-meta.mjs"), "utf-8");

/** The ids in the FREE_GAME_IDS array literal. */
function parseFreeGameIds(src) {
  const m = src.match(/const FREE_GAME_IDS = \[([\s\S]*?)\];/);
  if (!m) throw new Error("FREE_GAME_IDS array literal not found in GamesPage.tsx");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

/** The ids in the `games` array literal, in order. */
function parseGameIds(src) {
  const m = src.match(/const games = \[([\s\S]*?)\n  \];/);
  if (!m) throw new Error("games array literal not found in GamesPage.tsx");
  return [...m[1].matchAll(/\{ id: "([^"]+)"/g)].map((x) => x[1]);
}

/** The `case "id":` labels in renderGame's switch — what can actually render. */
function parseRenderableIds(src) {
  return [...src.matchAll(/case "([a-z]+)": return </g)].map((x) => x[1]);
}

/**
 * Source with comments removed, for the assertions about rendered copy.
 *
 * The count checks below are about what a visitor SEES. Comments legitimately
 * discuss the numbers — "with 2 of 20 games open", "a listener for all 20
 * games" — and failing on those would push a maintainer to delete an accurate
 * comment to get a test green, which is the wrong incentive entirely.
 *
 * Only whole comment lines and block comments are stripped, so a "//" inside a
 * string literal (a URL) is left alone.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l))
    .join("\n");
}

const FREE_GAME_IDS = parseFreeGameIds(gamesPageSrc);
const GAME_IDS = parseGameIds(gamesPageSrc);
const RENDERABLE_IDS = parseRenderableIds(gamesPageSrc);
const gamesPageCopy = stripComments(gamesPageSrc);

/** Number words the copy uses, so a written-out count is checked too. */
const NUMBER_WORDS = {
  two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20,
};

describe("the games array", () => {
  it("holds 20 games", () => {
    expect(GAME_IDS.length).toBe(20);
  });

  it("has no duplicate ids", () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length);
  });

  it("can render every game it lists", () => {
    for (const id of GAME_IDS) expect(RENDERABLE_IDS).toContain(id);
  });
});

describe("FREE_GAME_IDS — the guest gate", () => {
  it("contains exactly ten ids", () => {
    expect(FREE_GAME_IDS.length).toBe(10);
  });

  it("has no duplicates", () => {
    expect(new Set(FREE_GAME_IDS).size).toBe(FREE_GAME_IDS.length);
  });

  it("contains only ids that exist in the games array", () => {
    for (const id of FREE_GAME_IDS) expect(GAME_IDS).toContain(id);
  });

  it("contains `match`", () => {
    // `match` is the initial activeGame, so it renders on mount before
    // selectGame ever runs. Dropping it from this list would show every
    // signed-out visitor a locked wall as the page loads.
    expect(FREE_GAME_IDS).toContain("match");
  });

  it("keeps `match` as the game the page opens on", () => {
    // The other half of the same invariant: if the default changes to a game
    // that is not free, the wall comes back on load even with match still free.
    const m = gamesPageSrc.match(/useState<string>\("([a-z]+)"\)/);
    expect(m).not.toBeNull();
    expect(FREE_GAME_IDS).toContain(m[1]);
  });

  it("opens fewer games than exist, so the signup incentive still exists", () => {
    expect(FREE_GAME_IDS.length).toBeLessThan(GAME_IDS.length);
  });
});

describe("one source of truth for what is free", () => {
  it("no game row carries a `free:` field any more", () => {
    // The second list. It never gated play — it only drove the padlock and the
    // FREE badge — so the two could disagree and ship a card that says FREE and
    // then refuses to open.
    expect(gamesPageSrc).not.toMatch(/free:\s*(true|false)/);
  });

  it("derives isFree from FREE_GAME_IDS", () => {
    expect(gamesPageSrc).toMatch(/const isFree = FREE_GAME_IDS\.includes\(game\.id\)/);
  });

  it("gates the padlock and the badge on the derived value, not a stored one", () => {
    expect(gamesPageSrc).toMatch(/const isLocked = !isLoggedIn && !isFree/);
    expect(gamesPageSrc).toMatch(/\{isFree && !isLoggedIn &&/);
    expect(gamesPageSrc).not.toMatch(/game\.free/);
  });

  it("still gates actual play on FREE_GAME_IDS in both places", () => {
    // renderGame's wall, and the game_started telemetry guard.
    const uses = [...gamesPageSrc.matchAll(/FREE_GAME_IDS\.includes\(activeGame\)/g)];
    expect(uses.length).toBe(2);
  });
});

describe("published counts agree with the arrays", () => {
  it("GamesPage hardcodes no game count in rendered copy — every one is interpolated", () => {
    // "30 games" survived in four places while the array held 20, in both
    // languages, on a page whose own hero rendered the real count three lines
    // above. Any bare number next to "games" is that bug coming back.
    expect(gamesPageCopy).not.toMatch(/\b\d+ (?:free )?games\b/);
    expect(gamesPageCopy).not.toMatch(/الألعاب الـ \d+/);
    expect(gamesPageCopy).not.toMatch(/\b\d+ Korean games\b/);
  });

  it("interpolates games.length for the total and FREE_GAME_IDS.length for the free count", () => {
    expect(gamesPageSrc).toMatch(/\$\{games\.length\}/);
    expect(gamesPageSrc).toMatch(/\$\{FREE_GAME_IDS\.length\}/);
  });

  it("no longer uses the Arabic dual for the free-game count", () => {
    // "لعبتان" is a grammatical dual — the "two" is inside the word form, so
    // swapping a numeral would have left it saying "two" in Arabic. For 3-10
    // Arabic takes the plural, "ألعاب".
    expect(gamesPageSrc).not.toContain("لعبتان");
    expect(gamesPageSrc).toMatch(/\$\{FREE_GAME_IDS\.length\} ألعاب مجانية/);
  });

  it("the prerendered /games copy states the real free and total counts", () => {
    // Static HTML published at /games and read by non-JS crawlers. Nothing in
    // the app corrects it, so it goes false the moment the gate changes.
    const m = prerenderSrc.match(
      /no sign-up is needed to start: (\w+) of the (\w+) games are open to everyone/
    );
    expect(m).not.toBeNull();
    const [, freeWord, totalWord] = m;
    expect(NUMBER_WORDS[freeWord]).toBe(FREE_GAME_IDS.length);
    expect(NUMBER_WORDS[totalWord]).toBe(GAME_IDS.length);
  });

  it("the prerendered copy lists one bullet per game", () => {
    const block = prerenderSrc.match(/const GAMES_BODY_HTML = `([\s\S]*?)`;/)[1];
    expect((block.match(/<li>/g) || []).length).toBe(GAME_IDS.length);
  });
});

describe("the ten chosen games", () => {
  it("are the beginner-friendly hook set Re picked", () => {
    // Recorded so a future edit to the list is a deliberate decision with a
    // visible diff, not a quiet drift.
    expect([...FREE_GAME_IDS].sort()).toEqual(
      [
        "colors", "flashcard", "greetings", "hangul", "kdrama",
        "match", "numbers", "romanization", "scramble", "time",
      ].sort()
    );
  });
});
