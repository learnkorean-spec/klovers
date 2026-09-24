import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  STUDENTS_TAUGHT,
  TEACHING_YEARS,
  TEACHING_SINCE,
  COMMUNITY,
  RATING,
  trustCopy,
  withoutUnsupportedClaims,
  toArabicDigits,
} from "../trustFigures";

describe("trust figures", () => {
  it("holds the figures Re confirmed", () => {
    expect(STUDENTS_TAUGHT).toBe("200+");
    expect(TEACHING_YEARS).toBe("13+");
    expect(TEACHING_SINCE).toBe(2013);
    expect(COMMUNITY).toBe("2,000+");
    expect(RATING.value).toBe("5.0");
    expect(RATING.count).toBe(7);
    expect(RATING.source).toBe("Google");
  });

  it("scopes the student count to students taught, in both languages", () => {
    expect(trustCopy("en").studentsTaught).toBe("200+ students taught over 13 years");
    expect(trustCopy("ar").studentsTaught).toBe("أكثر من 200 طالب على مدى 13 عامًا");
  });

  it("always names the rating's source", () => {
    expect(trustCopy("en").rating).toBe("5.0 ★ from 7 Google reviews");
    expect(trustCopy("ar").rating).toContain("جوجل");
  });

  it("converts to Arabic-Indic digits", () => {
    expect(toArabicDigits(7)).toBe("٧");
    expect(toArabicDigits("2000")).toBe("٢٠٠٠");
  });

  it("strips the unsupported pass-rate claim and keeps the TOPIK-prep wording", () => {
    expect(withoutUnsupportedClaims("TOPIK preparation expert with high student pass rates")).toBe(
      "TOPIK exam preparation",
    );
    expect(
      withoutUnsupportedClaims("experience preparing students for TOPIK exams with high pass rates. We cover"),
    ).toBe("experience preparing students for TOPIK exams. We cover");
    expect(withoutUnsupportedClaims("خبيرة تحضير TOPIK بنسب نجاح عالية")).toBe("تحضير لاختبار TOPIK");
    expect(withoutUnsupportedClaims("لاختبارات TOPIK بنسب نجاح عالية.")).toBe("لاختبارات TOPIK.");
  });
});

/**
 * Guard: the contradicting figures from the 23 Sep 2026 audit must not come
 * back. Comments are stripped first, so a note explaining why a number was
 * removed does not trip it.
 *
 * `allow` lists files that STILL contain the pattern and need a follow-up:
 * files too large to rewrite safely with the tooling this PR was made with
 * (translations.ts, EnrollNowPage, PlacementTestPage, TrialBookPage) and
 * admin-only content generators. Take a file OFF its list when you fix it;
 * never add one to make this pass.
 */
const RULES: { name: string; re: RegExp; allow: string[] }[] = [
  {
    name: "500+ as a student count (the figure is 200+)",
    re: /500\+(?!\s*(?:vocabulary|words|كلمة|ساعة|hours))/,
    allow: [
      "src/pages/EnrollNowPage.tsx",
      "src/pages/TrialBookPage.tsx",
      "src/components/admin/CreatorHub.tsx",
      "src/components/admin/RehamTrainingPanel.tsx",
      "src/lib/marketingEngine.ts",
    ],
  },
  {
    name: '"Rated by 200+ students" (200 students did not review anything)',
    re: /Rated by 200\+|تقييم أكثر من 200 طالب/i,
    allow: ["src/i18n/translations.ts"],
  },
  {
    name: "12+ years (Re has taught for 13+)",
    re: /12\+\s*(?:years|yrs|سنة|عام)|value:\s*"12\+"/i,
    allow: [],
  },
  {
    name: "a count of 'Egyptian students'",
    re: /\d\+?\s*Egyptian students|\d+\s*طالب مصري|طالب مصري مسجل/,
    allow: ["src/i18n/translations.ts", "src/pages/PlacementTestPage.tsx"],
  },
  {
    name: '"thousands of students"',
    re: /thousands of students|آلاف الطلاب/i,
    allow: [],
  },
  {
    name: "unverifiable scarcity copy",
    re: /limited spots|spots are limited|seats are limited|limited seats|أماكن محدودة|الأماكن محدودة/i,
    allow: [
      "src/i18n/translations.ts",
      "src/components/admin/CreatorHub.tsx",
      "src/components/admin/BulkEmailManager.tsx",
      "src/lib/marketingEngine.ts",
    ],
  },
  {
    name: "a TOPIK pass-rate claim with no data behind it",
    re: /pass rates?\b|نسب نجاح/i,
    allow: ["src/i18n/translations.ts"],
  },
  {
    name: "a 4.9 rating (the sourced rating is Google's 5.0 from 7)",
    re: /4\.9\s*(?:★|rated)|4\.9<\/strong>\s*rated|تقييم 4\.9/,
    allow: ["src/pages/EnrollNowPage.tsx", "src/components/admin/CreatorHub.tsx"],
  },
];

/** These two files spell out the banned strings on purpose. */
const SKIP = new Set(["src/lib/trustFigures.ts", "src/lib/__tests__/trustFigures.test.ts"]);

const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
};

describe("no contradicting trust figures in src/", () => {
  const root = process.cwd();
  const files = walk(path.join(root, "src"))
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((f) => !SKIP.has(f));

  for (const rule of RULES) {
    it(`no ${rule.name}`, () => {
      const offenders = files.filter(
        (f) => !rule.allow.includes(f) && rule.re.test(stripComments(readFileSync(path.join(root, f), "utf8"))),
      );
      expect(offenders).toEqual([]);
    });
  }
});
