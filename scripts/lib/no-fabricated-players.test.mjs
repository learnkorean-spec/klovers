import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

/**
 * no-fabricated-players.test.mjs — keeps invented people out of the product.
 *
 * WHAT HAPPENED
 *
 * /games showed every signed-out visitor a "Top Players" board of five people
 * who do not exist, with XP totals that do not exist, behind a gradient fade
 * styled to look like a real board being previewed. Actual activity is 70 game
 * plays across five months and 4 students active in the last 30 days. The rows
 * were hardcoded, so they never changed between visits — which is also how a
 * visitor would work it out.
 *
 * That is fabricated social proof, and the reason it needs a test rather than
 * just a deletion is that it is cheap to add back. A placeholder array is the
 * obvious way to make an empty component look finished, and the next person to
 * face an empty leaderboard will reach for exactly the same thing.
 *
 * WHY THE TWO CHECKS TREAT COMMENTS DIFFERENTLY — this is deliberate
 *
 * The NAME check reads raw source, comments included. A fabricated name has no
 * business anywhere in the file, and scanning raw text means it cannot be
 * parked in a comment "for reference".
 *
 * The NUMBERS check reads comment-stripped source. Comments legitimately
 * discuss the numbers ("70 game plays across five months"), and a test that
 * failed on an accurate comment would push the next maintainer to delete the
 * comment to get green — the wrong incentive. Stripping comments first also
 * means the assertion cannot be SATISFIED by deleting a comment: comments are
 * simply not part of what it looks at.
 *
 * WHERE THE BOARD LIVES (23 Sep 2026)
 *
 * The leaderboard moved out of GamesPage.tsx into
 * src/components/games/GamesLeaderboard.tsx (the podium redesign). The checks
 * below read both files, and one asserts that GamesPage still renders the
 * component, so the guard cannot pass on a file the page no longer uses.
 */

const repoRoot = process.cwd();
const SRC = join(repoRoot, "src");

/** The five people who were invented for the /games leaderboard. */
const FABRICATED_NAMES = ["Sara M.", "Ahmed K.", "Yuki T.", "Lin W.", "Omar F."];

/**
 * Occurrences that exist today, are NOT approved, and are waiting on a decision
 * that is not this change's to make.
 *
 * Removing the leaderboard surfaced that three of the same invented personas
 * are also used as customer testimonials — quoted, attributed and given cities,
 * which is a stronger claim than a leaderboard row. Those are marketing copy on
 * two other pages, and the brief for this change was explicit that they be
 * reported before being touched. So they are listed here rather than deleted.
 *
 * This list is EXACT in both directions. An occurrence not listed here fails
 * the test, and a listed occurrence that has gone away also fails it — so the
 * list cannot quietly rot into a permanent exemption. When Re decides, delete
 * the entry and the copy together; when the list is empty, replace the whole
 * mechanism with a flat "no fabricated name appears in src/".
 */
// Re decided on 24 Sep 2026: remove them. Both quotes are gone, so nothing
// is pending.
const PENDING_DECISION = {};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

const files = walk(SRC).map((p) => ({
  path: relative(repoRoot, p).split("\\").join("/"),
  text: readFileSync(p, "utf-8"),
}));

const byPath = (p) => files.find((f) => f.path === p);
const gamesPage = byPath("src/pages/GamesPage.tsx");
const leaderboard = byPath("src/components/games/GamesLeaderboard.tsx");
const hook = byPath("src/hooks/useLeaderboard.ts");

/**
 * Whole-line and block comments only, so a "//" inside a string literal (a URL)
 * survives. Same helper and same reasoning as games-free-set.test.mjs.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l))
    .join("\n");
}

/** Every [file, name] pair present in src/, comments included. */
const found = [];
for (const f of files) {
  for (const name of FABRICATED_NAMES) {
    if (f.text.includes(name)) found.push([f.path, name]);
  }
}

describe("the source files this test depends on exist", () => {
  it("found GamesPage.tsx, GamesLeaderboard.tsx and useLeaderboard.ts", () => {
    // Guards against the walk silently matching nothing, which would make
    // every assertion below vacuously true.
    expect(gamesPage).toBeDefined();
    expect(leaderboard).toBeDefined();
    expect(hook).toBeDefined();
    expect(files.length).toBeGreaterThan(0);
  });

  it("GamesPage still renders the leaderboard component these checks read", () => {
    expect(stripComments(gamesPage.text)).toContain("<GamesLeaderboard");
  });
});

describe("no invented people in src/", () => {
  it("the five names appear only where a decision is still pending", () => {
    const unexpected = found.filter(
      ([path, name]) => !(PENDING_DECISION[path] ?? []).includes(name)
    );
    // The message matters: whoever hits this needs to know it is a judgement
    // call about honesty, not a lint rule to silence.
    expect(
      unexpected,
      `Fabricated player names found outside the pending-decision list:\n` +
        unexpected.map(([p, n]) => `  ${p}: "${n}"`).join("\n") +
        `\n\nThese are invented people. Remove the copy — do not add the file ` +
        `to PENDING_DECISION unless a human has explicitly deferred it.`
    ).toEqual([]);
  });

  it("the games page and its leaderboard carry none of them at all", () => {
    for (const name of FABRICATED_NAMES) {
      expect(gamesPage.text).not.toContain(name);
      expect(leaderboard.text).not.toContain(name);
    }
  });

  it("every pending-decision entry is still real", () => {
    // The other direction. When the testimonials go, this fails and forces the
    // list to shrink, so it cannot become a stale permanent exemption.
    for (const [path, names] of Object.entries(PENDING_DECISION)) {
      const f = byPath(path);
      expect(f, `PENDING_DECISION lists ${path}, which no longer exists`).toBeDefined();
      for (const name of names) {
        expect(
          f.text.includes(name),
          `PENDING_DECISION says ${path} still contains "${name}", but it does not — remove the entry`
        ).toBe(true);
      }
    }
  });
});

describe("the guest leaderboard invents no numbers", () => {
  // The page and the component together: the board is rendered by
  // GamesLeaderboard, the data is fetched by GamesPage.
  const copy = stripComments(gamesPage.text) + "\n" + stripComments(leaderboard.text);

  it("has no hardcoded leaderboard rows", () => {
    // The exact shape that was there: { rank: 1, name: "…", xp: 1840, … }
    expect(copy).not.toMatch(/\{\s*rank:\s*\d/);
    expect(copy).not.toMatch(/\bxp:\s*\d/);
  });

  it("renders no literal XP figure", () => {
    // Every XP number on the page must come from data via toLocaleString().
    // A bare "1840 XP" in the markup is the bug returning in a new costume.
    expect(copy).not.toMatch(/\b\d+\s*XP\b/);
  });

  it("shows guests an empty state that claims nothing about other players", () => {
    // Arabic is neutral MSA since the 25 Sep 2026 brand-guard sweep.
    expect(copy).toContain("take your place on the leaderboard");
    expect(copy).toContain("إنشاء حساب يفتح جمع النقاط ودخول الترتيب.");
  });

  it("keeps a signup call to action for guests", () => {
    // The point is to remove the fake board, not the invitation.
    expect(copy).toMatch(/href="\/signup"/);
  });

  it("drops the styling that existed only to tease the fake board", () => {
    // The fade and the clamp made an invented list read as a real one being
    // previewed. With nothing to obscure they have no job.
    expect(copy).not.toContain("max-h-44");
    expect(copy).not.toContain("bg-gradient-to-t from-card to-transparent");
  });

  it("still renders the real board for signed-in students", () => {
    // The signed-in path is explicitly out of scope for this change; assert it
    // survived rather than trusting that it did. Top ten, from data.
    expect(stripComments(leaderboard.text)).toMatch(/\.slice\(0, 10\)/);
    expect(stripComments(leaderboard.text)).toContain("p.value.toLocaleString()");
  });
});

describe("useLeaderboard does not fetch for signed-out visitors", () => {
  const src = stripComments(hook.text);

  it("waits for auth to resolve before deciding anything", () => {
    // Without this the first render — userId still null only because
    // getSession has not resolved — looks exactly like a guest, and a
    // signed-in student would be treated as one.
    expect(src).toMatch(/if \(!authResolved\) return;/);
  });

  it("fetches nothing when there is no user", () => {
    expect(src).toMatch(/if \(!userId\) \{/);
  });

  it("opens no realtime channel when there is no user", () => {
    expect(src).toMatch(/if \(!userId\) return;[\s\S]*?\.channel\("leaderboard-student-xp"\)/);
  });

  it("re-runs when the user changes, so signing in mid-session still fetches", () => {
    // The guard has to be a gate, not a wall. Both effects key on userId, and
    // onAuthStateChange is what updates it without a reload.
    expect(src).toMatch(/\}, \[authResolved, userId, fetchLeaderboard\]\);/);
    expect(src).toMatch(/\}, \[userId, debouncedFetch\]\);/);
    expect(src).toContain("onAuthStateChange");
  });

  it("no longer fetches unconditionally on mount", () => {
    // The exact effect this change replaced.
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*fetchLeaderboard\(\);\s*\}, \[fetchLeaderboard\]\);/);
  });

  it("stops the spinner for guests instead of loading forever", () => {
    // `loading` starts true, so a consumer that renders a spinner while
    // loading would spin for the whole visit if the guest branch just bailed.
    expect(src).toMatch(/setLoading\(false\);\s*return;/);
  });
});
