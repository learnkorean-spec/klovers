import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * brand-sheet-panel.test.mjs — keeps Admin → Brand and public/brand-sheet.html
 * saying the same thing.
 *
 * WHY THIS EXISTS
 *
 * Admin → Brand repeats two prompt lines verbatim out of the brand sheet: the
 * Cluby line and the new Adam & Lina line. Those lines are the whole point of
 * the screen — they are what gets pasted into an image prompt — and the failure
 * mode is silent: someone improves the wording in one file, the other keeps
 * handing out the old sentence, and the generated pictures drift off-model
 * without anything turning red. The repository has this exact scar already (see
 * the CONTACT_EMAIL block in brand-identity.test.mjs, where one address lived in
 * five literals).
 *
 * WHY IT ALSO PINS THE IFRAME
 *
 * The obvious way to put a static page inside the dashboard is
 * `<iframe src="/brand-sheet.html">`. vercel.json sets `frame-src 'none'` in the
 * Content-Security-Policy, so that frame renders on the dev server and is
 * blocked in production — a reference screen broken exactly where it is needed.
 * These assertions state the constraint rather than trusting the next person to
 * read the panel's header comment.
 *
 * Read as plain text, not through a bundler: BrandSheetPanel.tsx is a module
 * with two exported string constants, and brand-sheet.html is HTML. Neither
 * needs the "@/" alias, JSX parsing or a TS transform to be checked.
 */

const repoRoot = process.cwd();
const panel = readFileSync(join(repoRoot, "src/components/admin/BrandSheetPanel.tsx"), "utf-8");
const sheet = readFileSync(join(repoRoot, "public/brand-sheet.html"), "utf-8");
const dashboard = readFileSync(join(repoRoot, "src/pages/AdminDashboard.tsx"), "utf-8");
const vercel = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf-8"));

/** Whitespace-insensitive, so a re-wrapped line in either file is not a failure. */
const norm = (s) => s.replace(/\s+/g, " ").trim();

/** One exported prompt constant out of the panel, as written. */
function panelLine(name) {
  const m = panel.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`));
  if (!m) throw new Error(`could not read ${name} out of BrandSheetPanel.tsx`);
  return norm(m[1]);
}

const csp = (vercel.headers ?? [])
  .flatMap((h) => h.headers ?? [])
  .find((h) => h.key === "Content-Security-Policy")?.value;

describe("the panel and the sheet hand out the same prompt lines", () => {
  it("Cluby's line is identical in both", () => {
    const line = panelLine("CLUBY_PROMPT");
    expect(line).toContain("small mint-green realistic-cute 3D plush creature");
    expect(norm(sheet)).toContain(line);
  });

  it("Adam & Lina's line is identical in both", () => {
    const line = panelLine("LEARNERS_PROMPT");
    // The canon constrains two things about these two, and no prompt may invent
    // more: they are photorealistic, and they are not Korean and not Asian.
    expect(line).toContain("not Korean and not East Asian");
    expect(line).toContain("never a couple");
    expect(norm(sheet)).toContain(line);
  });

  it("the sheet keeps a prompt block the copy button can find", () => {
    // The sheet's script binds one handler per .prompt block by querying it, so
    // the line must stay inside a block that also carries the button.
    const blocks = [...sheet.matchAll(/<div class="prompt">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const b of blocks) {
      expect(b).toContain("<code");
      expect(b).toContain('class="copy"');
    }
  });
});

describe("the panel is not a frame, because the CSP would block it", () => {
  /**
   * Comments are stripped first, and that is not a dodge: the panel's own header
   * explains WHY it is not a frame, and that explanation has to be able to name
   * the element it rejects. What must not appear is a real one in the markup.
   */
  const panelCode = panel.replace(/\/\*[\s\S]*?\*\//g, "");

  it("contains no iframe", () => {
    expect(panelCode).not.toMatch(/<iframe/i);
  });

  it("states why, and the reason is still true", () => {
    // If frames are ever allowed, the header comment and this assertion are the
    // two places that should be revisited together — not one of them.
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-src 'none'");
    expect(panel).toContain("frame-src");
  });
});

describe("the brand tab is reachable", () => {
  /**
   * A <TabsContent> whose value is in no TAB_GROUPS entry does not merely lose
   * its group: `activeGroup` falls back to "ops", `inActiveGroup("brand")` is
   * false, so the trigger is never drawn and ?tab=brand opens Operations
   * instead. The comment above TAB_GROUPS in AdminDashboard.tsx describes
   * exactly this trap; these assertions are the check it promises.
   */
  const groupLine = dashboard.match(
    /\{ id: "content".*?tabs: \[([^\]]*)\] \}/,
  )?.[1];

  it("is listed in the Content group, exactly once", () => {
    expect(groupLine, "could not find the content TAB_GROUPS entry").toBeDefined();
    const tabs = groupLine.split(",").map((t) => t.trim().replace(/^"|"$/g, ""));
    expect(tabs).toContain("brand");
    expect(tabs.filter((t) => t === "brand")).toHaveLength(1);
  });

  it("has both a trigger and a content panel", () => {
    expect(dashboard).toContain('<TabsTrigger value="brand"');
    expect(dashboard).toContain('<TabsContent value="brand">');
    expect(dashboard).toContain('import("@/components/admin/BrandSheetPanel")');
  });

  it("is in the sidebar, so it can be found without knowing the URL", () => {
    // The Content group in AdminShell is the discovery path — see the #266 note
    // there about screens that rendered fine and that nothing linked to.
    const shell = readFileSync(join(repoRoot, "src/components/admin/AdminShell.tsx"), "utf-8");
    expect(shell).toContain('to: "/admin?tab=brand"');
  });
});

describe("the sheet is not stale on the wrong-answer colour", () => {
  // The pink #FF4FD8 was replaced by the neon red #FF3131 on 1 Oct 2026 and this
  // sheet kept the pink for another four days. It is retired now, so it may only
  // appear as a retired swatch or in prose explaining the change.
  it("uses the red as the wrong-answer fill", () => {
    expect(sheet).toContain("--wrong:#FF3131");
    expect(sheet).not.toContain("--wrong:#FF4FD8");
  });

  it("keeps no live pink sample in the contrast table", () => {
    expect(sheet).not.toMatch(/class="sample" style="background:#FF4FD8/);
  });
});

describe("the standing rule reads the same in all four places", () => {
  /**
   * Re, 5 Oct 2026: "the theme is always the real scenes."
   *
   * That one sentence decides the two illustrated trust icons, the flat 2D Cluby
   * set and the drawn blog covers, so it has to exist for four different
   * readers: the canon an agent loads before touching anything visual, the bible
   * a human reads, the sheet a designer opens, and the admin screen the work
   * happens on. They may differ in wording and not in meaning, and each points
   * at the canon as the tie-breaker.
   *
   * The failure this catches is the expensive one: the rule surviving in the
   * admin panel that Re reads while quietly disappearing from the canon that
   * decides, so the next generation drifts back to illustration for six months.
   */
  const canon = readFileSync(join(repoRoot, "src/config/klovers-world.ts"), "utf-8");
  const bible = readFileSync(join(repoRoot, "docs/KLOVERS-STORY-BIBLE.md"), "utf-8");

  it("is declared in the canon, dated, with the size exception closed", () => {
    expect(canon).toMatch(/standingRule:\s*"always_the_real_scenes"/);
    expect(canon).toMatch(/illustrationExceptionAtSmallSizes:\s*false/);
    expect(norm(canon)).toContain("Re, 5 Oct 2026");
  });

  it("retires illustrated characters in forbiddenStyles, not only in prose", () => {
    expect(canon).toContain("illustrated_or_anime_characters_at_any_size");
    expect(canon).toContain("flat_2d_mascot_set");
  });

  it("is stated in the canon, the bible, the sheet and the admin screen", () => {
    const sentence = "the theme is always the real scenes";
    expect(norm(canon).toLowerCase()).toContain(sentence);
    expect(norm(bible).toLowerCase()).toContain(sentence);
    expect(norm(sheet).toLowerCase()).toContain(sentence);
    expect(norm(panel).toLowerCase()).toContain(sentence);
  });

  it("names the two icons that break it, everywhere someone would look to fix them", () => {
    // The files are the fix and the names are the instruction, so a place that
    // states the rule without naming them sends the reader hunting.
    for (const [label, text] of [["canon", canon], ["bible", bible], ["sheet", sheet], ["panel", panel]]) {
      expect(text, `${label} should name student-boy-thumbsup`).toContain("student-boy-thumbsup");
      expect(text, `${label} should name student-girl-heart`).toContain("student-girl-heart");
    }
  });

  it("keeps the swap that makes the fix cheap", () => {
    /**
     * The fix is two files replaced, not a refactor, and only because every
     * consumer names the icon and KloverIcon builds the path from that name.
     * If a plan or a prompt ever starts renaming these assets, the cheap fix
     * becomes a 17-file edit — which is the thing worth failing on here.
     */
    const icon = readFileSync(join(repoRoot, "src/components/KloverIcon.tsx"), "utf-8");
    expect(icon).toContain('"student-boy-thumbsup"');
    expect(icon).toContain('"student-girl-heart"');
    expect(icon).toContain("`/assets/icons/${name}.webp`");

    // And a live consumer, so the names are not merely declared somewhere.
    const consumer = readFileSync(join(repoRoot, "src/components/FinalCTA.tsx"), "utf-8");
    expect(consumer).toContain("student-boy-thumbsup");
  });
});
