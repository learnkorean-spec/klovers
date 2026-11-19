import { describe, it, expect } from "vitest";
import { parseInsights, parseUtm, scrub } from "../fbInsights.ts";

describe("parseUtm", () => {
  it("reads utm_content and utm_campaign from the link in a post", () => {
    const text =
      "احجز: kloversegy.com/free-trial?utm_source=facebook&utm_medium=page&utm_campaign=trial_nov26&utm_content=Post1";
    expect(parseUtm(text)).toEqual({ utm_content: "post1", utm_campaign: "trial_nov26" });
  });
  it("returns nulls when the post has no tracked link", () => {
    expect(parseUtm("just words")).toEqual({ utm_content: null, utm_campaign: null });
    expect(parseUtm(undefined)).toEqual({ utm_content: null, utm_campaign: null });
  });
});

describe("parseInsights", () => {
  it("maps the 2026 post metrics", () => {
    const out = parseInsights({
      data: [
        { name: "post_total_media_view_unique", values: [{ value: 812 }] },
        { name: "post_media_view", values: [{ value: 1204 }] },
      ],
    });
    expect(out).toEqual({ reach: 812, media_views: 1204, error: null });
  });
  it("keeps a missing metric null, never 0", () => {
    const out = parseInsights({ data: [{ name: "post_media_view", values: [{ value: 9 }] }] });
    expect(out.reach).toBeNull();
    expect(out.media_views).toBe(9);
  });
  it("turns a Graph API error into a short message", () => {
    const out = parseInsights({ error: { code: 200, message: "Requires read_insights permission" } });
    expect(out).toEqual({ reach: null, media_views: null, error: "200: Requires read_insights permission" });
  });
});

describe("scrub", () => {
  it("removes the token wherever it appears", () => {
    const token = "EAAB123secret";
    expect(scrub(`failed https://x?access_token=${token}&a=1 and ${token}`, token)).not.toContain(token);
  });
});
