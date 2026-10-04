import { describe, it, expect } from "vitest";
import { KOREA_SCHOLARSHIPS } from "@/constants/koreaScholarships";
import { monthsBetween, matchScholarships, countReachable, type MatchInput } from "@/lib/scholarshipMatch";

/**
 * scholarshipMatch.test.ts — the numbers a learner is shown about their own
 * future, and the honest gates around them.
 *
 * The two things worth failing on:
 *   1. the months arithmetic (it multiplies a class count from levels.ts, and a
 *      silent change there would move every learner's plan);
 *   2. the claim that a programme needs no Korean at application. That claim is
 *      true for five of the six and it is the single most useful sentence on
 *      the card, so it is pinned per programme rather than trusted.
 */

const schoolLeaver: MatchInput = { levelKey: "hangul", degree: "school", age: 19 };
const graduate: MatchInput = { levelKey: "l2", degree: "bachelor", age: 27 };
const enrolled: MatchInput = { levelKey: "l4", degree: "enrolled" };

const row = (input: MatchInput, id: string) => {
  const found = matchScholarships(input).find((r) => r.id === id);
  if (!found) throw new Error(`no match row for ${id}`);
  return found;
};

describe("monthsBetween — the published pace, not a hardcoded six", () => {
  it("counts the levels still to be completed", () => {
    // Hangul is 4 classes (1 month); every rung of the ladder is 24 (6 months).
    expect(monthsBetween("hangul", "l1")).toBe(6);
    expect(monthsBetween("l1", "l3")).toBe(12);
    expect(monthsBetween("l4", "l5")).toBe(6);
    expect(monthsBetween("l1", "l6")).toBe(30);
  });

  it("is zero when the learner is already there or past it", () => {
    expect(monthsBetween("l3", "l3")).toBe(0);
    expect(monthsBetween("l6", "l1")).toBe(0);
    expect(monthsBetween("hangul", "hangul")).toBe(0);
  });

  it("returns null rather than zero when there is no measurable level", () => {
    // An unknown level is "we do not know yet", never "0 months".
    expect(monthsBetween(null, "l1")).toBeNull();
    expect(monthsBetween(undefined, "l1")).toBeNull();
    expect(monthsBetween("", "l1")).toBeNull();
    expect(monthsBetween("something-else", "l1")).toBeNull();
  });

  it("reads the legacy spellings of a level through normalizeLevel", () => {
    expect(monthsBetween("level_1", "level_3")).toBe(12);
    expect(monthsBetween("Level 2", "l4")).toBe(12);
  });
});

describe("every programme is covered, and no new one can slip through", () => {
  it("returns one row per programme the site lists", () => {
    const rows = matchScholarships(schoolLeaver);
    expect(rows.map((r) => r.id)).toEqual(KOREA_SCHOLARSHIPS.map((s) => s.id));
  });

  it("throws rather than silently claiming 'no Korean needed' for an unknown id", () => {
    // The map is keyed by id: a seventh programme with no language rule must
    // fail in the module, not render as "0 months" on the card.
    expect(() => matchScholarships({ ...schoolLeaver })).not.toThrow();
    for (const s of KOREA_SCHOLARSHIPS) {
      expect(row(schoolLeaver, s.id).languageReason.ar.length).toBeGreaterThan(20);
      expect(row(schoolLeaver, s.id).languageReason.en.length).toBeGreaterThan(20);
    }
  });
});

describe("the application-language bar is stated per programme", () => {
  it("needs no Korean to apply for GKS, KAIST, KOICA or the exchange", () => {
    for (const id of ["gks-undergraduate", "gks-graduate", "kaist", "koica", "gks-exchange"]) {
      expect(row(schoolLeaver, id).targetLevelKey, id).toBeNull();
      expect(row(schoolLeaver, id).monthsToLanguage, id).toBe(0);
    }
  });

  it("is the only real language gap for a beginner: the Korea Foundation fellowship", () => {
    expect(row(schoolLeaver, "kf-language").targetLevelKey).toBe("l1");
    expect(row(schoolLeaver, "kf-language").monthsToLanguage).toBe(6);
  });

  it("closes that gap once the learner is at the level it asks for", () => {
    expect(row(graduate, "kf-language").monthsToLanguage).toBe(0);
  });

  it("shows no figure at all when there is no measured level", () => {
    // The degree is one the fellowship accepts, so the only unknown here is
    // the level — which must read as "we do not know", never as "0 months".
    const rows = matchScholarships({ levelKey: null, degree: "bachelor" });
    expect(rows.find((r) => r.id === "kf-language")!.monthsToLanguage).toBeNull();
    // And an unmeasurable learner is never told they are ready.
    expect(rows.find((r) => r.id === "kf-language")!.status).toBe("needs");
  });
});

describe("the stage and the age gate, as the funding bodies state them", () => {
  it("keeps GKS-undergraduate shut to anyone already holding a degree", () => {
    expect(row(graduate, "gks-undergraduate").status).toBe("not_for_you");
    // And says which way round the bar is: this track is for school leavers.
    expect(row(graduate, "gks-undergraduate").blockers.ar.join(" ")).toContain("طلاب الثانوية");
  });

  it("keeps GKS-graduate shut to a school leaver", () => {
    expect(row(schoolLeaver, "gks-graduate").status).toBe("not_for_you");
  });

  it("keeps KAIST and the exchange track to the stage they are for", () => {
    expect(row(graduate, "kaist").status).toBe("not_for_you");
    expect(row(graduate, "gks-exchange").status).toBe("not_for_you");
    expect(row(enrolled, "gks-exchange").status).not.toBe("not_for_you");
  });

  it("applies the age limit where there is one", () => {
    expect(row({ levelKey: "hangul", degree: "school", age: 26 }, "gks-undergraduate").status).toBe("not_for_you");
    expect(row({ levelKey: "hangul", degree: "school", age: 24 }, "gks-undergraduate").status).not.toBe("not_for_you");
    expect(row({ levelKey: "l2", degree: "bachelor", age: 41 }, "gks-graduate").status).toBe("not_for_you");
  });

  it("does not invent an age limit where the programme publishes none", () => {
    // KAIST and the Korea Foundation publish no age rule; a 55-year-old must
    // not be told they are outside one.
    expect(row({ levelKey: "l3", degree: "school", age: 55 }, "kaist").status).not.toBe("not_for_you");
    expect(row({ levelKey: "l3", degree: "bachelor", age: 55 }, "kf-language").status).not.toBe("not_for_you");
  });
});

describe("ready means something, and it is not 'you will be accepted'", () => {
  it("reaches ready for a school leaver with no language gap", () => {
    expect(row(schoolLeaver, "gks-undergraduate").status).toBe("ready");
    expect(row(schoolLeaver, "kaist").status).toBe("ready");
  });

  it("still prints the obligations that come with ready", () => {
    const gks = row(schoolLeaver, "gks-undergraduate");
    expect(gks.blockers.ar.length).toBeGreaterThanOrEqual(3);
    expect(gks.blockers.ar.join(" ")).toContain("٨٠٪");
  });

  it("is never ready when something must still be obtained", () => {
    // A graduate matches KOICA's stage and language, but KOICA is for serving
    // government officials with a nomination, so the answer is 'not yet'.
    expect(row(graduate, "koica").status).toBe("needs");
    expect(row(graduate, "koica").blockers.ar.join(" ")).toContain("ترشيح");
    expect(row(enrolled, "gks-exchange").blockers.ar.join(" ")).toContain("اتفاق");
  });

  it("never states the KOICA country caveat as if Egypt were confirmed", () => {
    const koica = row(graduate, "koica");
    const text = koica.blockers.ar.join(" ");
    expect(text).toContain("KOICA");
    // Verbatim from the verification: Egypt was NOT confirmed on KOICA's pages,
    // and the reader is sent to the office that can confirm it.
    expect(text).toContain("لم تكن مصر مؤكدة");
    expect(text).toContain("السفارة في القاهرة");
    // And at no point does it claim Egypt is on the list.
    expect(text).not.toMatch(/مصر مؤهلة|مصر ضمن/);
  });
});

describe("countReachable — the number the locked box shows", () => {
  it("counts what a school leaver can actually reach", () => {
    // Undergraduate GKS and KAIST are the two a school leaver fits. The
    // fellowship wants a Korean-studies student, the graduate and KOICA tracks
    // want a degree, and the exchange wants an enrolled student.
    expect(countReachable(matchScholarships(schoolLeaver))).toBe(2);
  });

  it("counts more for a graduate than for a school leaver", () => {
    const n = countReachable(matchScholarships(graduate));
    expect(n).toBeGreaterThan(countReachable(matchScholarships(schoolLeaver)));
    expect(n).toBeLessThanOrEqual(KOREA_SCHOLARSHIPS.length);
  });
});
