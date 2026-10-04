import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ScholarshipMatches from "../ScholarshipMatches";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { KOREA_SCHOLARSHIPS } from "@/constants/koreaScholarships";

/**
 * The journal link is driven by a query against `blog_posts.published` (the
 * draft article must not produce a 404), so the hook is stubbed here and the
 * query's own mapping is tested next to the hook. Everything else in this file
 * is the real component.
 */
const guide = vi.hoisted(() => ({ value: { ar: null as string | null, en: null as string | null } }));
vi.mock("@/hooks/usePublishedScholarshipArticle", () => ({
  usePublishedScholarshipArticle: () => guide.value,
}));

/**
 * LanguageProvider imports the Supabase client, and that module throws
 * "supabaseUrl is required" at import time when the env vars are missing — CI
 * sets none. Every test in this repo that wraps a component in LanguageProvider
 * mocks the client for exactly this reason (see AchievementMilestoneArabic); the
 * first version of this file did not, so it passed here and failed on a clean
 * checkout.
 */
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

/**
 * ScholarshipMatches.test.tsx — the gate, which is the promise Re made to the
 * visitor: the names and the facts are public, the verdict is what an account
 * buys. That claim is only true while the component renders one way signed out
 * and another way signed in, and nothing else in the suite covers it — the
 * matching engine has its own tests, this file is about what reaches the eye.
 *
 * English by default (the provider defaults to it); the Arabic case at the end
 * proves the block is not English-only, because the difference between the two
 * states is exactly the kind of copy that gets written once and translated
 * never.
 */

afterEach(() => localStorage.clear());

const draw = (props: { levelKey: string; signedIn: boolean }) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ScholarshipMatches {...props} />
      </LanguageProvider>
    </MemoryRouter>,
  );

/** One stage chip. They are real buttons with aria-pressed, so this is the tap. */
const pick = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("signed out: the names are public, the verdict is not", () => {
  it("lists all six programmes and puts a lock where the verdict goes", () => {
    draw({ levelKey: "hangul", signedIn: false });
    pick("At school");

    for (const s of KOREA_SCHOLARSHIPS) {
      expect(screen.getByText(s.name.en), s.id).toBeInTheDocument();
    }
    expect(screen.getAllByText("After sign-in")).toHaveLength(KOREA_SCHOLARSHIPS.length);
    // And none of the three verdicts leaks through.
    expect(screen.queryByText("Open to you")).toBeNull();
    expect(screen.queryByText("Needs a step")).toBeNull();
    expect(screen.queryByText("Not for you yet")).toBeNull();
  });

  it("still says how many fit, because that is the reason to sign in", () => {
    draw({ levelKey: "hangul", signedIn: false });
    pick("At school");
    // A school leaver fits the undergraduate GKS and KAIST, of six.
    expect(screen.getByText(/2 of 6 programmes fit your level/)).toBeInTheDocument();
  });

  it("never asks for the stage before the level is on screen", () => {
    // The chips are the question; the answer needs a level to match against.
    draw({ levelKey: "hangul", signedIn: false });
    expect(screen.getByText("You are")).toBeInTheDocument();
    expect(screen.queryByText(/programmes fit your level/)).toBeNull();
  });
});

describe("signed in: the verdict appears, with its reasons", () => {
  it("prints a verdict per programme instead of a lock", () => {
    draw({ levelKey: "hangul", signedIn: true });
    pick("At school");

    expect(screen.getAllByText("Open to you").length).toBeGreaterThan(0);
    expect(screen.queryByText("After sign-in")).toBeNull();
    expect(screen.getByText(/2 of 6 programmes are open to your level and stage/)).toBeInTheDocument();
  });

  it("says the language is not the obstacle where the programme asks for none", () => {
    draw({ levelKey: "hangul", signedIn: true });
    pick("At school");
    // Five of the six require no Korean at application; only the Korea
    // Foundation fellowship does, and it is the one carrying a month figure.
    expect(screen.getAllByText(/The language is not the obstacle/).length).toBeGreaterThanOrEqual(4);
  });

  it("gives the fellowship's real gap, in months of study", () => {
    draw({ levelKey: "hangul", signedIn: true });
    pick("At school");
    expect(screen.getByText(/About 6 months of study to reach the level asked for/)).toBeInTheDocument();
  });

  it("never promises a place", () => {
    draw({ levelKey: "hangul", signedIn: true });
    pick("At school");
    expect(screen.getByText(/not that you are accepted/)).toBeInTheDocument();
  });
});

describe("the Klovers timeline is on screen whatever the programmes say", () => {
  it("gives every learner a number of their own", () => {
    draw({ levelKey: "l3", signedIn: false });
    expect(screen.getByText(/Your Klovers timeline/)).toBeInTheDocument();
    expect(screen.getByText(/in about 6 months/)).toBeInTheDocument();
  });

  it("says the ladder is finished at the top rather than inventing a rung", () => {
    draw({ levelKey: "l6", signedIn: true });
    expect(screen.getByText(/top of the ladder/)).toBeInTheDocument();
  });
});

describe("with no measurable level it asks for the test", () => {
  it("points at the placement test and prints no programme at all", () => {
    draw({ levelKey: "", signedIn: true });
    expect(screen.getByRole("link", { name: /placement test/i })).toBeInTheDocument();
    expect(screen.queryByText(KOREA_SCHOLARSHIPS[0].name.en)).toBeNull();
    expect(screen.queryByText("You are")).toBeNull();
  });
});

describe("the stage is asked once", () => {
  it("remembers the choice", () => {
    draw({ levelKey: "hangul", signedIn: true });
    pick("Graduate");
    expect(localStorage.getItem("klovers_scholarship_degree")).toBe("bachelor");
  });

  it("re-reads a remembered choice instead of asking again", () => {
    localStorage.setItem("klovers_scholarship_degree", "bachelor");
    draw({ levelKey: "hangul", signedIn: true });
    expect(screen.getByText(/programmes are open to your level and stage/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Graduate" })[0]).toHaveAttribute("aria-pressed", "true");
  });
});

describe("the block is not English-only", () => {
  it("speaks Arabic when the site does", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    draw({ levelKey: "hangul", signedIn: false });
    pick("طالب في الثانوية");

    expect(screen.getByText(/أي منح كوريا يستطيع مستواك الوصول إليها/)).toBeInTheDocument();
    expect(screen.getByText(/خطتك في كلوفرز/)).toBeInTheDocument();
    expect(screen.getAllByText("بعد التسجيل")).toHaveLength(KOREA_SCHOLARSHIPS.length);
    expect(screen.queryByText("After sign-in")).toBeNull();
  });
});

describe("the journal link exists only while the article really does", () => {
  it("is absent while the guide is still a draft", () => {
    guide.value = { ar: null, en: null };
    draw({ levelKey: "hangul", signedIn: true });
    expect(screen.queryByText(/scholarships guide in the journal/)).toBeNull();
  });

  it("points at the post once it is published", () => {
    guide.value = { ar: null, en: "korean-scholarships-guide" };
    draw({ levelKey: "hangul", signedIn: true });
    expect(screen.getByRole("link", { name: /scholarships guide in the journal/ })).toHaveAttribute(
      "href",
      "/blog/korean-scholarships-guide",
    );
  });

  it("uses the Arabic twin's own URL on the Arabic site", () => {
    guide.value = { ar: "korean-scholarships-guide-ar", en: null };
    localStorage.setItem("k-lovers-lang", "ar");
    draw({ levelKey: "hangul", signedIn: true });
    expect(screen.getByRole("link", { name: /دليل المنح الكامل في المجلة/ })).toHaveAttribute(
      "href",
      "/blog/korean-scholarships-guide-ar",
    );
  });

  it("shows the link to a visitor who has not signed in, because reading is not gated", () => {
    guide.value = { ar: null, en: "korean-scholarships-guide" };
    draw({ levelKey: "hangul", signedIn: false });
    expect(screen.getByRole("link", { name: /scholarships guide in the journal/ })).toBeInTheDocument();
  });
});
