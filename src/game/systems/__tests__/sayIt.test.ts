import { describe, expect, it } from "vitest";
import { similarity } from "../sayIt";

describe("say-it similarity", () => {
  it("matches the same words, ignoring spaces and marks", () => {
    expect(similarity("어서 오세요!", "어서오세요")).toBe(1);
    expect(similarity("감사합니다!", "네 감사합니다")).toBe(1);
  });
  it("is close for one syllable off, low for something else", () => {
    expect(similarity("감사합니다", "감사함니다")).toBeGreaterThanOrEqual(0.8);
    expect(similarity("감사합니다", "안녕하세요")).toBeLessThan(0.5);
  });
  it("is zero for nothing heard", () => {
    expect(similarity("물", "")).toBe(0);
  });
});
