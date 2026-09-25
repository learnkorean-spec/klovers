import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, sep } from "path";
import { KLOVERS_WORLD, validateKloversStoryFeature } from "@/config/klovers-world";
import { LEVEL_KEYS } from "@/constants/levels";

/**
 * kloversWorld.test.ts — makes the story canon enforceable instead of merely
 * written down.
 *
 * WHY THIS EXISTS
 *
 * `src/config/klovers-world.ts` calls itself the single source of truth for the
 * story, the characters, the worlds and the homepage narrative, and
 * `docs/KLOVERS-STORY-BIBLE.md` opens by saying the .ts file wins if the two
 * ever disagree. But for its whole life the canon was read by nobody: nothing
 * imported KLOVERS_WORLD, `validateKloversStoryFeature` was exported and
 * called from nowhere, and the homepage drifted away from the eight narrative
 * slots without a single check noticing.
 *
 * The specific drift this catches now: homepage narrative slot 5
 * ("practice-games", Cluby) had no section at all, and
 * `src/components/HomeGamesSection.tsx` — 263 finished lines — was imported by
 * nothing on main. A canon that cannot fail is a comment with a .ts extension.
 *
 * WHAT IS AND IS NOT ASSERTED HERE
 *
 * The canon object is imported for real, so the structural assertions read the
 * actual values. `src/pages/Index.tsx` cannot be imported (TSX, React, the "@/"
 * alias and the i18n context at module load), so the homepage slot coverage
 * parses its source as text — the same tradeoff, and the same caveat, as
 * `scripts/lib/games-free-set.test.mjs` makes about GamesPage.tsx. Asserting
 * what the code DOES reads comment-stripped source; asserting what a visitor
 * SEES may too. Only the import shape is read raw.
 *
 * It follows that these checks catch a missing, added or renamed section, and
 * canon that contradicts itself. They cannot catch a section that renders the
 * wrong picture — that is a review question, not a unit test.
 *
 * THE ORPHAN RULE AT THE BOTTOM IS THE OTHER HALF
 *
 * The slot checks above ask "is every beat rendered?". The orphan rule asks the
 * inverse — "is every story component rendered?" Both directions were open when
 * this file was written: homepage slot 5 had no section while its 263-line
 * component sat imported by nothing, and four more story components
 * (HomeBlogSection, StudentJourney, FAQSection, KoreaTimeSection) had no importer
 * at all. Neither was visible, because nothing in the build fails on dead code.
 * A canon that only checks forwards still lets the story rot backwards.
 */

const repoRoot = process.cwd();
const indexSrc = readFileSync(join(repoRoot, "src/pages/Index.tsx"), "utf-8");

/** Index.tsx with block and line comments removed, so a comment can never satisfy an assertion. */
const indexCode = indexSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/**
 * The ladder's level→world entries, typed and free of the `notALevelStop`
 * array that shares the same object.
 *
 * `KLOVERS_WORLD` is `as const`, so its literal types are narrow and a
 * `Record<string, { world: string }>` cast is rejected outright — the compiler
 * says the shapes do not sufficiently overlap. Going through `unknown` would
 * silence that, but it would also throw away the type safety that makes a
 * wrong world id a compile error instead of a runtime surprise. Narrowing once,
 * here, keeps every call site below clean and honest.
 */
const levelJourney = (): { level: string; world: string; part: number | null }[] =>
  Object.entries(KLOVERS_WORLD.levelJourney)
    .filter(([, v]) => !Array.isArray(v))
    .map(([level, v]) => ({ level, world: (v as { world: string }).world, part: (v as { part: number | null }).part }));

/** Every .ts/.tsx under src/, comments stripped, so prose can never count as a use. */
function readSrcSources(dir: string, out: { path: string; code: string }[] = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) readSrcSources(p, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      const text = readFileSync(p, "utf-8");
      out.push({
        path: p,
        code: text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
      });
    }
  }
  return out;
}

describe("KLOVERS_WORLD — internal consistency", () => {
  it("gives every world a unique id and an order", () => {
    const ids = KLOVERS_WORLD.worlds.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(KLOVERS_WORLD.worlds.map((w) => w.order))).toEqual(
      new Set(KLOVERS_WORLD.worlds.map((_, i) => i + 1))
    );
  });

  it("names every world in both languages", () => {
    for (const w of KLOVERS_WORLD.worlds) {
      expect(w.name.en, `${w.id} needs an English name`).toBeTruthy();
      expect(w.name.ar, `${w.id} needs an Arabic name`).toBeTruthy();
    }
  });

  it("orders the awakening sequence first-word → first-sentence → first-conversation", () => {
    expect(KLOVERS_WORLD.originStory.awakeningSequence.map((s) => s.id)).toEqual([
      "first-word",
      "first-sentence",
      "first-conversation",
    ]);
  });

  it("keeps slot 7 excluding Cluby, which is what the egg teaser depends on", () => {
    const teaser = KLOVERS_WORLD.homepageNarrative.find((s) => s.section === "egg-teaser");
    expect(teaser).toBeDefined();
    expect(teaser!.explicitlyExclude).toContain("cluby");
  });

  it("keeps the trust section free of story characters", () => {
    // Canon: the live teacher is the trust anchor, and a story character must
    // never stand in for them. Slot 2 is where that is won or lost.
    const trust = KLOVERS_WORLD.homepageNarrative.find((s) => s.section === "live-class-trust");
    expect(trust!.characters).toEqual([]);
  });

  it("keeps the two Cluby-visibility lists disjoint", () => {
    // A surface cannot be both "gated until hatch" and "allowed before hatch".
    const v = KLOVERS_WORLD.originStory.clubyVisibility;
    const overlap = v.gatedUntilHatch.filter((s) => (v.allowedBeforeHatch as readonly string[]).includes(s));
    expect(overlap).toEqual([]);
  });
});
describe("levelJourney — the canon ladder is what the app reads", () => {
  it("maps every course level to a world", () => {
    const journey = KLOVERS_WORLD.levelJourney as Record<string, unknown>;
    const missing = LEVEL_KEYS.filter((k) => !journey[k]);
    expect(missing, "a course level has no story world in canon").toEqual([]);
  });

  it("never puts a notALevelStop world on the ladder", () => {
    const onLadder = new Set(levelJourney().map((j) => j.world));
    for (const id of KLOVERS_WORLD.levelJourney.notALevelStop) {
      expect(onLadder.has(id), `${id} is a notALevelStop but is on the ladder`).toBe(false);
    }
  });

  it("keeps every ladder world a world the canon actually defines", () => {
    const known = new Set<string>(KLOVERS_WORLD.worlds.map((w) => w.id));
    for (const { world } of levelJourney()) {
      expect(known.has(world), `${world} is on the ladder but not a canon world`).toBe(true);
    }
  });
});

describe("homepage narrative — the front page still tells the story", () => {
  /**
   * Slot → the component that carries it. This mapping is the assertion: a
   * canon slot with no rendered section is exactly the defect this test was
   * written for, so it is stated once, here, where a reviewer can see it.
   */
  const SLOT_SECTIONS: Record<string, string> = {
    hero: "HeroSection",
    "live-class-trust": "MeetTeacher",
    "how-klovers-works": "HowItWorks",
    "learning-journey": "LearningRoadmap",
    "practice-games": "HomeGamesSection",
    culture: "MoreThanAClass",
    "egg-teaser": "EggTeaser",
    "final-cta": "FinalCTA",
  };

  /**
   * A slot counts as delivered when its own component renders, OR when canon
   * names the section that carries it via `deliveredBy`. Slot 5
   * ("practice-games") is the live case: Re's 23 Sep CRO pass retired its own
   * section and folded the beat into MoreThanAClass, so requiring a standalone
   * <HomeGamesSection /> would be asserting the thing that was deliberately
   * removed. What must NOT pass is a beat that is neither rendered nor
   * accounted for — that is the silent drop this file exists to catch.
   */
  const slotsNeedingOwnSection = KLOVERS_WORLD.homepageNarrative.filter(
    (slot) => !(slot as { deliveredBy?: string }).deliveredBy
  );

  const sectionsToRender = slotsNeedingOwnSection
    .map((slot) => SLOT_SECTIONS[slot.section])
    .filter((name): name is string => Boolean(name));

  it("has a component for every canon slot", () => {
    for (const slot of KLOVERS_WORLD.homepageNarrative) {
      expect(SLOT_SECTIONS[slot.section], `canon slot "${slot.section}" has no known section`).toBeTruthy();
    }
  });

  it("accounts for every canon slot, rendered or folded into another", () => {
    const folded = KLOVERS_WORLD.homepageNarrative
      .map((slot) => (slot as { deliveredBy?: string }).deliveredBy)
      .filter((s): s is string => Boolean(s));

    // A deliveredBy must name a slot that itself exists, or the canon points
    // at a section that is not there.
    for (const host of folded) {
      expect(SLOT_SECTIONS[host], `deliveredBy "${host}" is not a known section`).toBeTruthy();
    }

    expect(slotsNeedingOwnSection.length + folded.length).toBe(
      KLOVERS_WORLD.homepageNarrative.length
    );
  });

  it("renders every canon slot on the homepage", () => {
    // Match the JSX ELEMENT, not the name. Checking `includes("FinalCTA")` is a
    // false pass: deleting <FinalCTA /> from the page while leaving the lazy()
    // import above it still matches, so the section can vanish and the test
    // stays green. What must appear is the element being mounted.
    const missing = [...new Set(sectionsToRender)].filter(
      (name) => !new RegExp(`<${name}[\\s/>]`).test(indexCode)
    );
    expect(missing, "these canon sections are not rendered by src/pages/Index.tsx").toEqual([]);
  });

  it("imports the components it claims to render", () => {
    // Read raw source here: an import line is code, not prose, so comments
    // are not a concern here the way they are for behaviour assertions.
    for (const name of new Set(sectionsToRender)) {
      expect(indexSrc, `${name} is rendered but never imported`).toMatch(
        new RegExp(`import\\("@/components/${name}"\\)|import\\s+\\w*\\s*from\\s*"@/components/${name}"`)
      );
    }
  });
});
describe("story art", () => {
  it("has a painted scene on disk for every canon world", () => {
    // A world in canon with no painting renders as a broken image on the
    // homepage roadmap, the game hub and the textbook library at once.
    const missing = KLOVERS_WORLD.worlds
      .map((w) => `/assets/story/world-${w.id}.webp`)
      .filter((p) => !existsSync(join(repoRoot, "public", p)));
    expect(missing, "canon worlds with no painting in public/assets/story/").toEqual([]);
  });

  it("has a painted scene on disk for every world on the level ladder", () => {
    const worlds = [...new Set(levelJourney().map((j) => j.world))];
    const missing = worlds
      .map((w) => `/assets/story/world-${w}.webp`)
      .filter((p) => !existsSync(join(repoRoot, "public", p)));
    expect(missing).toEqual([]);
  });
});

describe("orphans — a story component nothing renders", () => {
  /**
   * Components that are intentionally not mounted, each with the reason it is
   * still here. An entry here is a decision someone made; a component missing
   * from BOTH this list and every importer is drift, and that is what this test
   * fails on.
   *
   * `HomeGamesSection` is the live case: canon slot 5 ("practice-games") was
   * folded into MoreThanAClass by Re's 23 Sep CRO pass, but the component is
   * kept built so the beat can be restored without rewriting it. Deleting it
   * is allowed but not required — keeping it costs nothing, since an unmounted
   * component is never bundled and Vite's chunking never sees it.
   *
   * The `games/` entries are a PRODUCT BACKLOG, not dead code, and this is the
   * one place that distinction is written down. Each is a finished game —
   * 10 to 15 KB of real Korean content, a working component — that was built
   * but never given a `GAMES_CATALOG` entry, so GamesPage has no `case` for it
   * and nothing can reach it. Every wired game follows that pattern: a catalog
   * id, a `case` in GamesPage's switch, and a lazy() import.
   *
   * They are deliberately NOT deleted. Deleting them would throw away working
   * product to make a test pass, and this test's job is to surface the backlog,
   * not to resolve it. Wiring one up is a real feature (a catalog entry, a
   * switch case, title and description in both languages, and a free-vs-gated
   * decision), so it belongs to whoever owns the games list. When one ships,
   * delete its line here and this test keeps it honest.
   */
  const ALLOWED_UNMOUNTED = new Set([
    "HomeGamesSection",
    // games/ — built and finished, never added to GAMES_CATALOG
    "DialogueFillGame",
    "ErrorCatchGame",
    "GrammarPatternGame",
    "HonorificGame",
    "NegationGame",
    "SituationPickGame",
    "SpeechLevelGame",
    "TenseShiftGame",
  ]);

  /**
   * KNOWN BACKLOG — thirty components nothing imports, audited 2026-09-26 and
   * pre-existing, not introduced by this work.
   *
   * These are real and substantial (1.6 KB to 17 KB each — a leaderboard panel,
   * an NPS modal, a dashboard card, an exit-intent sheet), not stubs, so none
   * of them were deleted. Removing ~150 KB of working product to satisfy a test
   * written the same day is not a decision this file gets to make by itself.
   *
   * Listing them turns the check into a RATCHET: the assertion fails on any
   * orphan NOT named here, so the backlog cannot grow, and each name is a
   * visible "triage me". Triage by group — wire it up or delete it — and
   * remove its line when done.
   *
   * `CultureHeritageSection` is deliberately still listed: it is the only
   * emitter of the `culture_section` engagement event, so dropping it is an
   * analytics decision rather than a cleanup.
   */
  const KNOWN_ORPHAN_BACKLOG = new Set([
    "AttendanceCalendar",
    "CommunityFeed",
    "CultureHeritageSection",
    "DashboardLearningCard",
    "DashboardProfileCard",
    "DiscoverKoreaGallery",
    "EmptyState",
    "EnrollmentProtectedRoute",
    "ExitIntentModal",
    "GameIcon",
    "InterviewBannerChip",
    "KoreanLevelCard",
    "LeagueXpCard",
    "MarketingPostsArchive",
    "NavLink",
    "NpsModal",
    "PageErrorBoundary",
    "ReferFriendStrip",
    "ReturningStudentOffer",
    "SlotManager",
    "SlotRanker",
    "StudentGroupAttendance",
    "StudentPreferenceStep",
    "TrackedWaLink",
    "TrialRequestsPanel",
    "VocabOfTheDayCard",
    "WeeklyGoalCard",
    "WhyKLovers",
    "whyLearnKoreanScenes",
  ]);

  const sources = readSrcSources(join(repoRoot, "src"));
  const componentDir = join(repoRoot, "src", "components");

  it("finds a component to check (guards the walk itself)", () => {
    // If the walk silently returned nothing, every assertion below would pass
    // vacuously — which is exactly how a guard becomes decorative.
    expect(sources.length).toBeGreaterThan(50);
  });

  /** Escape a component name for use inside a RegExp. */
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /** Every component under src/components, minus pages/ and the shadcn ui/ library. */
  const candidates = sources.filter(
    (f) =>
      f.path.startsWith(componentDir) &&
      !f.path.includes(`${sep}pages${sep}`) &&
      !f.path.includes(`${sep}ui${sep}`)
  );

  it("has no story component that nothing imports", () => {
    const orphans: string[] = [];

    for (const file of candidates) {
      const name = file.path.split(sep).pop()!.replace(/\.tsx?$/, "");
      if (ALLOWED_UNMOUNTED.has(name) || KNOWN_ORPHAN_BACKLOG.has(name)) continue;

      // WORD BOUNDARY, not a substring. `includes("GameIcon")` is satisfied by
      // `gameIconName` in an unrelated import, which is a false negative in the
      // dangerous direction — it would report a genuinely orphaned component as
      // wired. Matching the whole identifier is what makes this check honest.
      const nameRe = new RegExp(`\\b${escape(name)}\\b`);
      const imported = sources.some(
        (other) => other.path !== file.path && nameRe.test(other.code)
      );
      if (!imported) orphans.push(name);
    }

    expect(
      orphans,
      "these components are imported by nothing. Delete them, or add them to " +
        "ALLOWED_UNMOUNTED in this file with a reason if keeping them is deliberate"
    ).toEqual([]);
  });

  it("still counts every named backlog entry, so none are deleted by accident", () => {
    // The ratchet only works if the two lists agree. An allowlist entry for a
    // component that no longer exists would let the check rot quietly: the name
    // keeps "passing" forever while the file it referred to is gone.
    const missingFromDisk = [...ALLOWED_UNMOUNTED, ...KNOWN_ORPHAN_BACKLOG].filter(
      (name) => !candidates.some((f) => f.path.split(sep).pop()!.replace(/\.tsx?$/, "") === name)
    );
    expect(
      missingFromDisk,
      "these names are on an allowlist but no such component exists — remove the stale line"
    ).toEqual([]);
  });
});

describe("validateKloversStoryFeature", () => {
  const goodProposal = {
    usesLearningProgress: true,
    changesCharacterRelationship: false,
    introducesNewMagic: false,
    introducesNewMajorLore: false,
    replacesRealTeacherTrust: false,
    usesApprovedVisualStyle: true,
    usesApprovedColors: true,
  };

  it("approves a feature that follows the canon", () => {
    expect(validateKloversStoryFeature(goodProposal).approved).toBe(true);
  });

  it("rejects each of the seven ways a feature can break the story", () => {
    const { approved, violations } = validateKloversStoryFeature({
      ...goodProposal,
      usesLearningProgress: false,
      changesCharacterRelationship: true,
      introducesNewMagic: true,
      introducesNewMajorLore: true,
      replacesRealTeacherTrust: true,
      usesApprovedVisualStyle: false,
      usesApprovedColors: false,
    });
    expect(approved).toBe(false);
    expect(violations).toHaveLength(7);
  });
});


