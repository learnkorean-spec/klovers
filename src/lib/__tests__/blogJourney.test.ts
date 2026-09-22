import { describe, it, expect, beforeEach } from "vitest";
import { extractArticleVocab, baseSlug, articleLevel, readingMinutes } from "@/lib/articleVocab";
import { stageForSlug, STAGES, UNTRANSLATABLE, QUIZ } from "@/constants/blogJourney";
import { journey, read, journeyXp, __resetJourneyCacheForTests } from "@/lib/journeyProgress";

describe("extractArticleVocab", () => {
  it("reads Korean-first tables: word, romanisation, meaning", () => {
    const md = [
      "| الكلمة | النطق | المعنى |",
      "| --- | --- | --- |",
      "| 한옥 | هانوك | البيت الكوري التقليدي |",
      "| 온돌 | أوندول | تدفئة تحت الأرضية |",
    ].join("\n");
    expect(extractArticleVocab(md)).toEqual([
      { ko: "한옥", rom: "هانوك", meaning: "البيت الكوري التقليدي" },
      { ko: "온돌", rom: "أوندول", meaning: "تدفئة تحت الأرضية" },
    ]);
  });

  it("reads label-first tables (the jeong article): meaning is the cell after", () => {
    const md = "| نوع | الكورية | معنى |\n|---|---|---|\n| جيونج دافئ | 고운 정 | المودة تُبنى باللطف |";
    expect(extractArticleVocab(md)).toEqual([{ ko: "고운 정", rom: undefined, meaning: "المودة تُبنى باللطف" }]);
  });

  it("ignores prose Hangul, separator rows, duplicates and markdown emphasis", () => {
    const md = "هذا هو **정** في النص\n| **편의점** | x | store |\n| 편의점 | y | again |\n|:--|--:|";
    expect(extractArticleVocab(md)).toEqual([{ ko: "편의점", rom: "x", meaning: "store" }]);
  });

  it("is safe on empty input", () => {
    expect(extractArticleVocab("")).toEqual([]);
    expect(extractArticleVocab(null)).toEqual([]);
  });
});

describe("slug helpers", () => {
  it("strips both Arabic slug forms", () => {
    expect(baseSlug("korean-daily-greetings-ar")).toBe("korean-daily-greetings");
    expect(baseSlug("ar-korean-daily-greetings")).toBe("korean-daily-greetings");
    expect(baseSlug("korean-daily-greetings")).toBe("korean-daily-greetings");
  });

  it("levels and minutes", () => {
    expect(articleLevel("korean-conditional-sentences-guide-ar")).toBe("intermediate");
    expect(articleLevel("korean-drama-vocabulary-advanced")).toBe("advanced");
    expect(articleLevel("hanok-traditional-korean-house")).toBe("beginner");
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(401)).toBe(3);
  });
});

describe("stageForSlug", () => {
  it.each<[string, string]>([
    ["dokkaebi-korean-goblin-myth-kdrama-ar", "discover"], // folklore, despite "kdrama"
    ["hanok-traditional-korean-house", "discover"],
    ["what-is-jeong-korean-untranslatable-concept-ar", "understand"],
    ["korean-convenience-store-culture", "experience"],
    ["kdrama-korean-phrases-beginners-ar", "drama"],
    ["korean-daily-greetings-ar", "speak"],
    ["topik-exam-guide-ar", "test"],
    ["korean-irregular-verbs-guide", "understand"], // default
  ])("%s → %s", (slug, stage) => {
    expect(stageForSlug(slug)).toBe(stage);
  });

  it("has six numbered stages in order", () => {
    expect(STAGES.map((s) => s.num)).toEqual(["01", "02", "03", "04", "05", "06"]);
  });
});

describe("franchise content", () => {
  it("every quiz answer is one of its options", () => {
    for (const q of QUIZ) expect(q.options.map((o) => o.id)).toContain(q.answer);
  });
  it("untranslatable words are unique Hangul", () => {
    const ko = UNTRANSLATABLE.map((w) => w.ko);
    expect(new Set(ko).size).toBe(ko.length);
    ko.forEach((k) => expect(k).toMatch(/^[가-힣]+$/));
  });
});

describe("journeyProgress", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetJourneyCacheForTests();
  });

  it("counts an article once across its two language twins", () => {
    expect(journey.markArticleRead("korean-daily-greetings")).toBe(true);
    expect(journey.markArticleRead("korean-daily-greetings-ar")).toBe(false);
    expect(read().articlesRead).toEqual(["korean-daily-greetings"]);
  });

  it("derives XP from completed things, so replays never double-count", () => {
    journey.markArticleRead("a");
    journey.completeQuiz("q1");
    journey.completeQuiz("q1");
    expect(journeyXp(read())).toBe(15);
  });

  it("saves only new words and persists across a reload", () => {
    expect(journey.saveWords([{ ko: "정" }, { ko: "눈치" }], "journal")).toBe(2);
    expect(journey.saveWords([{ ko: "정" }, { ko: "우리" }], "x-ar")).toBe(1);
    __resetJourneyCacheForTests();
    expect(read().words.map((w) => w.ko)).toEqual(["정", "눈치", "우리"]);
    expect(read().words[2].from).toBe("x");
  });

  it("toggles bookmarks and survives corrupt storage", () => {
    expect(journey.toggleBookmark("a-ar")).toBe(true);
    expect(journey.toggleBookmark("a")).toBe(false);
    localStorage.setItem("klovers.journey.v1", "{not json");
    __resetJourneyCacheForTests();
    expect(read().bookmarks).toEqual([]);
  });
});
