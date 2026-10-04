import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import * as bodies from "./marketing-bodies.mjs";

/**
 * Guards for the crawler-visible marketing copy (GEO audit, 25 Sep 2026).
 * The FAQPage JSON-LD built from MARKETING_FAQ must describe questions the
 * prerendered page actually shows, or Google treats it as spam markup.
 */
const html = Object.entries(bodies).filter(([k]) => k.endsWith("_BODY_HTML"));
const src = readFileSync(join(process.cwd(), "scripts/lib/marketing-bodies.mjs"), "utf-8");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

describe("marketing-bodies", () => {
  it("has exactly one <h1> in every fragment", () => {
    for (const [name, frag] of html) {
      expect((frag.match(/<h1[\s>]/g) || []).length, name).toBe(1);
    }
  });

  it("contains no interpolation hazards", () => {
    expect(src.includes("${")).toBe(false);
    for (const [name, frag] of html) {
      expect(frag.includes("$"), name).toBe(false);
    }
  });

  it("only marks up FAQ questions the page shows", () => {
    const byRoute = {
      "/faq": bodies.FAQ_BODY_HTML,
      "/affiliate": bodies.AFFILIATE_BODY_HTML,
      "/welcome-back": bodies.WELCOME_BACK_BODY_HTML,
      "/learn-korean-arabic-speakers": bodies.ARABIC_SPEAKERS_BODY_HTML,
      "/topik-exam-preparation": bodies.TOPIK_BODY_HTML,
      "/learn-korean-kdramas": bodies.KDRAMAS_BODY_HTML,
    };
    for (const [route, items] of Object.entries(bodies.MARKETING_FAQ)) {
      const visible = decode(byRoute[route]);
      expect(items.length, route).toBeGreaterThan(0);
      for (const { q } of items) expect(visible.includes(q), `${route}: ${q}`).toBe(true);
    }
  });

  it("keeps the TOPIK cut-offs NIIED publishes", () => {
    const t = bodies.TOPIK_BODY_HTML;
    for (const cut of ["<td>80</td>", "<td>140</td>", "<td>120</td>", "<td>150</td>", "<td>190</td>", "<td>230</td>"]) {
      expect(t.includes(cut), cut).toBe(true);
    }
    expect(t).not.toMatch(/KIIEC|April 19, 2026/);
  });

  it("links the scholarship claims to the funding bodies in the crawlable copy", () => {
    // The whole point of /scholarships is that a reader can check every claim
    // at the source. The links used to exist only inside the React card, so a
    // crawler that runs no JavaScript — the audience this file exists for —
    // saw six claims and no sources at all.
    const s = bodies.SCHOLARSHIPS_BODY_HTML;
    for (const host of [
      "studyinkorea.go.kr",
      "koica.go.kr",
      "kf.or.kr",
      "admission.kaist.ac.kr",
      "overseas.mofa.go.kr",
    ]) {
      expect(s.includes(host), host).toBe(true);
    }
  });
});
