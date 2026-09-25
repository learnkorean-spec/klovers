import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";

/**
 * games-free-set.test.mjs — guards the guest game gate and every published
 * count that has to agree with it.
 *
 * WHY THIS TEST PARTLY READS SOURCE TEXT INSTEAD OF IMPORTING
 *
 * The play gate itself (`src/pages/GamesPage.tsx`) is TSX, imports through
 * the "@/" alias, and pulls in React, lucide-react and the i18n context at
 * module load. None of that is importable from a plain node/vitest run without
 * a jsdom environment and an alias resolver, and the brief was explicit: say so
 * rather than restructure GamesPage.tsx to make it testable.
 *
 * `src/constants/gamesList.ts` is different: it only imports icon components
 * from lucide-react and exports plain data, so — verified directly — it
 * imports cleanly under this project's vitest config (jsdom + the "@/" alias
 * are already configured). GAMES_CATALOG and FREE_GAME_IDS are therefore
 * imported for real below rather than regexed out of the source, which checks
 * the actual values React sees instead of a text pattern standing in for them.
 *
 * GamesPage.tsx itself still can't be imported, so this parses its source as
 * text for everything that only lives there — the switch that decides what
 * can render, the derived isFree/isLocked gate, the nudge and character
 * checks. That is a real limitation and worth naming: it checks those
 * literals as written, not the values React evaluates, so it cannot catch a
 * bug that only appears at runtime. What it does catch is the whole class of
 * drift that actually bit this page — a count in one file disagreeing with a
 * list in another, which is exactly how "30 games" survived in four places
 * while the array held 20.
 *
 * RAW SOURCE OR STRIPPED SOURCE — GET THIS RIGHT
 *
 * `gamesPageSrc` is the file verbatim. `gamesPageCopy` is the same file with
 * comments removed. Which one an assertion reads is not a detail:
 *
 *   - Asserting what the CODE DOES ("does not use localStorage") must read
 *     gamesPageCopy. A comment explaining why localStorage was rejected
 *     contains the word, and an assertion that fails on a true explanation
 *     leaves only two ways out — delete the comment, or weaken the check.
 *   - Asserting what a VISITOR SEES ("no hardcoded game count") must read
 *     gamesPageCopy, for the same reason.
 *   - Only assertions about the source text itself — an import's exact shape,
 *     a constant's spelling — may read gamesPageSrc raw.
 *
 * This was learned the direct way: the localStorage check below was written
 * against raw source and failed CI on a comment.
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
// The /games hero (and its free-game count) moved into the Game Worlds hub in
// PR #609. The count assertions below read both files, so the copy can live in
// either without the guarantee going away.
const hubSrc = readFileSync(join(repoRoot, "src/components/games/GameWorldsHub.tsx"), "utf-8");
const gamesCopySrc = gamesPageSrc + "\n" + hubSrc;

/** The `case "id":` labels in renderGame's switch — what can actually render. */
function parseRenderableIds(src) {
  return [...src.matchAll(/case "([a-z]+)": return </g)].map((x) => x[1]);
}

/**
 * Source with comments removed. See the note at the top of this file for which
 * assertions must use this and which may read the raw source.
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

const GAME_IDS = GAMES_CATALOG.map((g) => g.id);
const RENDERABLE_IDS = parseRenderableIds(gamesPageSrc);
const gamesPageCopy = stripComments(gamesPageSrc);

/** Number words the copy uses, so a written-out count is checked too. */
const NUMBER_WORDS = {
  two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20,
  "twenty-two": 22, "twenty-three": 23,
};

describe("the games array", () => {
  it("holds 23 games", () => {
    // 23 = 22 + HonorificGame, wired 2026-09-26. Bumping this number is the
    // point of having it: a game cannot reach the page without someone saying
    // so here, which is what kept the catalog and the switch in step.
    expect(GAME_IDS.length).toBe(23);
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
    expect(gamesPageCopy).not.toMatch(/free:\s*(true|false)/);
  });

  it("derives isFree from FREE_GAME_IDS", () => {
    expect(gamesPageSrc).toMatch(/const isFree = FREE_GAME_IDS\.includes\(game\.id\)/);
  });

  it("gates the padlock and the badge on the derived value, not a stored one", () => {
    expect(gamesPageSrc).toMatch(/const isLocked = !isLoggedIn && !isFree/);
    expect(gamesPageSrc).toMatch(/\{isFree && !isLoggedIn &&/);
    expect(gamesPageCopy).not.toMatch(/game\.free/);
  });

  it("consults the gate at each of its three call sites", () => {
    // Named rather than merely counted, because a bare number tells whoever
    // trips this nothing about whether they have added a legitimate consumer
    // or deleted a gate. The three, in source order:
    //
    //   1. the game_started telemetry guard — a locked game the visitor cannot
    //      play must not emit a start event;
    //   2. the host strip — the character is shown only where a game will
    //      actually render, never above the locked-game wall;
    //   3. renderGame's wall itself — the gate that decides play.
    //
    // If this count changes, work out which of the three moved before
    // adjusting the number. Deleting site 3 is a security-shaped bug: every
    // locked game becomes playable.
    const uses = [...gamesPageCopy.matchAll(/FREE_GAME_IDS\.includes\(activeGame\)/g)];
    expect(uses.length).toBe(3);
  });

  it("still gates renderGame on the array, whatever else consults it", () => {
    // The one call site that must never go away, pinned by its own shape so
    // the count above cannot be satisfied by three copies of the wrong thing.
    expect(gamesPageSrc).toMatch(/const isGameFree = FREE_GAME_IDS\.includes\(activeGame\)/);
    expect(gamesPageSrc).toMatch(/if \(!isLoggedIn && !isGameFree\)/);
  });
});

describe("the signup nudge is shown once per session", () => {
  // It used to fire on every guest completion with the dismissal not
  // remembered, so a guest playing five games saw it five times. Survivable at
  // 2 open games; PR #261 made it 10.
  it("reads and writes a session-scoped flag", () => {
    expect(gamesPageSrc).toMatch(/sessionStorage\.getItem\(NUDGE_SEEN_KEY\)/);
    expect(gamesPageSrc).toMatch(/sessionStorage\.setItem\(NUDGE_SEEN_KEY, "1"\)/);
  });

  it("guards every storage access", () => {
    // Accessing web storage THROWS in some privacy modes rather than returning
    // null, so an unguarded read takes the whole page down. Counted against
    // stripped source: a comment that merely discusses storage is not access.
    const accesses = [...gamesPageCopy.matchAll(/sessionStorage\./g)];
    const tries = [...gamesPageCopy.matchAll(/try \{/g)];
    expect(accesses.length).toBeGreaterThan(0);
    expect(tries.length).toBeGreaterThanOrEqual(accesses.length);
  });

  it("scopes the flag to the session, not the device", () => {
    // Someone returning next week is a new visit and worth asking once more,
    // so this must not be persisted across sessions.
    //
    // Stripped source, deliberately: the docblock in GamesPage.tsx explains
    // why localStorage was rejected, and that explanation contains the word.
    // Reading raw source here failed CI on a true comment.
    expect(gamesPageCopy).not.toMatch(/localStorage/);
  });

  it("checks the flag before showing the nudge", () => {
    expect(gamesPageSrc).toMatch(/nudgeAlreadySeen\(\)/);
    expect(gamesPageSrc).toMatch(/markNudgeSeen\(\)/);
  });
});

describe("the game host follows the story canon", () => {
  // The host used to be the two human characters (CHARACTER_GIRL/BOY). Story
  // style batch 2 (c38079f, 24 Sep 2026) made it the clover egg, or Cluby
  // once he has hatched: Cluby follows the egg and guests never meet him.
  it("decides Cluby from isClubyAwake, and never for guests", () => {
    expect(gamesPageSrc).toMatch(/import \{ isClubyAwake \} from "@\/lib\/clubyAwake"/);
    expect(gamesPageCopy).toMatch(/const clubyAwake = isLoggedIn && isClubyAwake\(\)/);
  });

  it("shows Cluby only when awake, otherwise the egg", () => {
    expect(gamesPageCopy).toMatch(/src=\{clubyAwake \? CLUBY_WAVE : EGG\}/);
  });

  it("is decorative — the host image is hidden from screen readers", () => {
    // The speech bubble beside it carries the meaning, so a screen reader
    // announcing the image would only repeat it.
    const imgs = [...gamesPageCopy.matchAll(/<img[\s\S]*?\/>/g)].map((m) => m[0]);
    const hostImgs = imgs.filter((t) => t.includes("CLUBY_WAVE"));
    expect(hostImgs.length).toBeGreaterThan(0);
    for (const tag of hostImgs) {
      expect(tag).toMatch(/alt=""/);
      expect(tag).toMatch(/aria-hidden="true"/);
    }
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
    expect(gamesCopySrc).toMatch(/\$\{games\.length\}/);
    expect(gamesCopySrc).toMatch(/\$\{FREE_GAME_IDS\.length\}/);
  });

  it("no longer uses the Arabic dual for the free-game count", () => {
    // "لعبتان" is a grammatical dual — the "two" is inside the word form, so
    // swapping a numeral would have left it saying "two" in Arabic. For 3-10
    // Arabic takes the plural, "ألعاب".
    expect(gamesPageCopy).not.toContain("لعبتان");
    expect(gamesCopySrc).toMatch(/\$\{FREE_GAME_IDS\.length\} ألعاب مجانية/);
  });

  it("the prerendered /games copy states the real free and total counts", () => {
    // Static HTML published at /games and read by non-JS crawlers. Nothing in
    // the app corrects it, so it goes false the moment the gate changes.
    const m = prerenderSrc.match(
      /no sign-up is needed to start: ([\w-]+) of the ([\w-]+) games are open to everyone/
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
