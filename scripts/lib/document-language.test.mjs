import { describe, it, expect } from "vitest";
import {
  HTML_TAG_PATTERN,
  languageOf,
  directionOf,
  ogLocaleOf,
  otherLanguage,
  htmlTagFor,
} from "./document-language.mjs";

const arabicRoute = { path: "/blog/x-ar", post: { slug: "x-ar", lang: "ar" } };
const englishRoute = { path: "/blog/x", post: { slug: "x", lang: "en" } };
const marketingRoute = { path: "/games", title: "Korean Learning Games" };

describe("languageOf", () => {
  it("reads Arabic from the post row", () => {
    expect(languageOf(arabicRoute)).toBe("ar");
  });

  it("reads English from the post row", () => {
    expect(languageOf(englishRoute)).toBe("en");
  });

  it("treats a marketing route with no post as English", () => {
    // Not a default-by-omission: no marketing page has an Arabic URL at all.
    expect(languageOf(marketingRoute)).toBe("en");
  });

  it("treats an unknown or missing lang as English rather than throwing", () => {
    expect(languageOf({ post: {} })).toBe("en");
    expect(languageOf({ post: { lang: null } })).toBe("en");
    expect(languageOf({ post: { lang: "ko" } })).toBe("en");
    expect(languageOf({})).toBe("en");
    expect(languageOf(undefined)).toBe("en");
  });
});

describe("directionOf", () => {
  it("maps ar to rtl and en to ltr", () => {
    expect(directionOf("ar")).toBe("rtl");
    expect(directionOf("en")).toBe("ltr");
  });
});

describe("ogLocaleOf", () => {
  it("maps ar to ar_AR", () => {
    // ar_AR, not ar_EG: Facebook's locale list is a fixed enumeration and
    // ar_AR is its only Arabic entry. index.html has been shipping ar_EG.
    expect(ogLocaleOf("ar")).toBe("ar_AR");
    expect(ogLocaleOf("ar")).not.toBe("ar_EG");
  });

  it("maps en to en_US", () => {
    expect(ogLocaleOf("en")).toBe("en_US");
  });
});

describe("otherLanguage", () => {
  it("flips the pair", () => {
    expect(otherLanguage("ar")).toBe("en");
    expect(otherLanguage("en")).toBe("ar");
  });
});

describe("htmlTagFor", () => {
  it("emits Arabic as lang=ar dir=rtl", () => {
    expect(htmlTagFor("ar")).toBe('<html lang="ar" dir="rtl">');
  });

  it("emits English as lang=en dir=ltr", () => {
    expect(htmlTagFor("en")).toBe('<html lang="en" dir="ltr">');
  });

  it("emits exactly one lang and one dir attribute", () => {
    for (const lang of ["ar", "en"]) {
      const tag = htmlTagFor(lang);
      expect(tag.match(/\blang=/g).length).toBe(1);
      expect(tag.match(/\bdir=/g).length).toBe(1);
    }
  });
});

describe("HTML_TAG_PATTERN", () => {
  it("matches the document element index.html ships", () => {
    expect(HTML_TAG_PATTERN.test('<html lang="en">')).toBe(true);
  });

  it("matches a bare document element and one with extra attributes", () => {
    expect(HTML_TAG_PATTERN.test("<html>")).toBe(true);
    expect(HTML_TAG_PATTERN.test('<html lang="en" dir="ltr" data-x="1">')).toBe(true);
  });

  it("does not match <head>, <header> or a closing tag", () => {
    expect(HTML_TAG_PATTERN.test("<head>")).toBe(false);
    expect(HTML_TAG_PATTERN.test("<header>")).toBe(false);
    expect(HTML_TAG_PATTERN.test("</html>")).toBe(false);
  });

  it("is not global, so it cannot carry lastIndex state across routes", () => {
    expect(HTML_TAG_PATTERN.global).toBe(false);
  });
});

describe("rewriting a document, end to end", () => {
  // The shape of the real base document, trimmed.
  const DOC = [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    "    <title>PLACEHOLDER</title>",
    "  </head>",
    "  <body>",
    '    <div id="root"></div>',
    "  </body>",
    "</html>",
  ].join("\n");

  const rewrite = (route) =>
    DOC.replace(HTML_TAG_PATTERN, () => htmlTagFor(languageOf(route)));

  it("turns the document Arabic for an Arabic route", () => {
    const out = rewrite(arabicRoute);
    expect(out).toContain('<html lang="ar" dir="rtl">');
    expect(out).not.toContain('<html lang="en">');
  });

  it("leaves an English route English, and adds the missing dir", () => {
    const out = rewrite(englishRoute);
    expect(out).toContain('<html lang="en" dir="ltr">');
  });

  it("gives a marketing route the English defaults", () => {
    expect(rewrite(marketingRoute)).toContain('<html lang="en" dir="ltr">');
  });

  it("never produces two lang or two dir attributes on <html>", () => {
    for (const route of [arabicRoute, englishRoute, marketingRoute]) {
      const tag = rewrite(route).match(HTML_TAG_PATTERN)[0];
      expect(tag.match(/\blang=/g).length).toBe(1);
      expect(tag.match(/\bdir=/g).length).toBe(1);
    }
  });

  it("is idempotent — rewriting an already-rewritten document is stable", () => {
    const once = rewrite(arabicRoute);
    const twice = once.replace(HTML_TAG_PATTERN, () => htmlTagFor("ar"));
    expect(twice).toBe(once);
  });

  it("does not disturb the closing </html> tag or the rest of the document", () => {
    const out = rewrite(arabicRoute);
    expect(out.match(/<\/html>/g).length).toBe(1);
    expect(out).toContain("<title>PLACEHOLDER</title>");
    expect(out).toContain('<div id="root"></div>');
    expect(out.split("\n").length).toBe(DOC.split("\n").length);
  });

  it("agrees with the inner article wrapper rather than contradicting it", () => {
    // The bug was a document that said English wrapping a div that said
    // Arabic. buildArticleBodyHtml emits lang/dir from the same post.lang this
    // module reads, so the two cannot disagree.
    const lang = languageOf(arabicRoute);
    const innerWrapper = `<div id="article-prerendered" lang="${
      arabicRoute.post.lang === "ar" ? "ar" : "en"
    }" dir="${arabicRoute.post.lang === "ar" ? "rtl" : "ltr"}">`;
    expect(innerWrapper).toContain(`lang="${lang}"`);
    expect(innerWrapper).toContain(`dir="${directionOf(lang)}"`);
    expect(rewrite(arabicRoute)).toContain(`lang="${lang}" dir="${directionOf(lang)}"`);
  });
});
