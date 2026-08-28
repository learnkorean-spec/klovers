import { describe, it, expect } from "vitest";
import { extractFaqEntries, buildFaqJsonLd } from "./lib/faq-parser.mjs";

const H3_EN = `Intro text.

## Frequently Asked Questions

### How long does it take?
Most learners see progress within a few weeks.

### What resources pair with this guide?
Combine it with a daily habit.

## Next Steps

More content here.`;

const BOLD_EN = `Intro text.

## Quick FAQ

**What is the difference between A and B?** They mean the same thing.

**Is C more formal than D?** Slightly, yes.

Closing paragraph.`;

const H3_AR = `مقدمة.

## الأسئلة الشائعة

### هل يوجد فرق؟
لا يوجد فرق حقيقي.

## قسم آخر

نص إضافي.`;

const BOLD_AR = `مقدمة.

## أسئلة شائعة

**هل يوجد فرق؟** لا يوجد فرق حقيقي في المعنى.

**كيف أقول ذلك؟** استخدم هذه الصيغة.`;

describe("extractFaqEntries", () => {
  it("extracts ### Q/A pairs under the full English heading", () => {
    const qa = extractFaqEntries(H3_EN);
    expect(qa).toHaveLength(2);
    expect(qa[0].question).toBe("How long does it take?");
    expect(qa[0].answer).toContain("progress within a few weeks");
  });

  it("extracts **bold** Q/A pairs under the short English heading", () => {
    const qa = extractFaqEntries(BOLD_EN);
    expect(qa).toHaveLength(2);
    expect(qa[0].question).toBe("What is the difference between A and B?");
    expect(qa[0].answer).toBe("They mean the same thing.");
  });

  it("extracts ### Q/A pairs under the full Arabic heading (with ال)", () => {
    const qa = extractFaqEntries(H3_AR);
    expect(qa).toHaveLength(1);
    expect(qa[0].question).toBe("هل يوجد فرق؟");
  });

  it("extracts **bold** Q/A pairs under the short Arabic heading (without ال)", () => {
    const qa = extractFaqEntries(BOLD_AR);
    expect(qa).toHaveLength(2);
    expect(qa[0].question).toBe("هل يوجد فرق؟");
    expect(qa[1].answer).toBe("استخدم هذه الصيغة.");
  });

  it("returns [] when there is no FAQ heading at all", () => {
    expect(extractFaqEntries("## Some Section\n\nJust text, no FAQ here.")).toEqual([]);
  });

  it("returns [] when a heading matches but the body has neither template", () => {
    const noQa = `## أسئلة شائعة

| الكورية | المعنى |
|---|---|
| 안녕 | مرحباً |`;
    expect(extractFaqEntries(noQa)).toEqual([]);
  });

  it("stops at the next ## heading and does not bleed into later sections", () => {
    const qa = extractFaqEntries(H3_EN);
    expect(qa.some((x) => x.answer.includes("More content here"))).toBe(false);
  });

  it("only takes the first FAQ block when content repeats it verbatim (known content-generation defect)", () => {
    const repeated = H3_EN + "\n\n" + H3_EN;
    const qa = extractFaqEntries(repeated);
    expect(qa).toHaveLength(2);
  });

  it("returns [] for empty/missing content", () => {
    expect(extractFaqEntries("")).toEqual([]);
    expect(extractFaqEntries(null)).toEqual([]);
    expect(extractFaqEntries(undefined)).toEqual([]);
  });
});

describe("buildFaqJsonLd", () => {
  it("returns a well-formed FAQPage object when entries exist", () => {
    const ld = buildFaqJsonLd(H3_EN);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    for (const q of ld.mainEntity) {
      expect(q["@type"]).toBe("Question");
      expect(typeof q.name).toBe("string");
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
      expect(typeof q.acceptedAnswer.text).toBe("string");
    }
    expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow();
  });

  it("returns null rather than an empty FAQPage when there is nothing to extract", () => {
    expect(buildFaqJsonLd("## Some Section\n\nNo FAQ.")).toBeNull();
    expect(buildFaqJsonLd("## أسئلة شائعة\n\n| a | b |\n|---|---|\n| 1 | 2 |")).toBeNull();
  });
});
