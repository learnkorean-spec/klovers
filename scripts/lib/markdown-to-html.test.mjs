import { describe, it, expect } from "vitest";
import {
  markdownToHtml,
  renderInline,
  escapeText,
  escapeAttr,
  unescapeText,
  isSafeUrl,
} from "./markdown-to-html.mjs";
import { MARKER_START, MARKER_END } from "./related-links.mjs";

describe("escaping", () => {
  it("escapes the three text-node characters", () => {
    expect(escapeText(`a & b < c > d`)).toBe("a &amp; b &lt; c &gt; d");
  });

  it("escapes quotes for attributes but not for text", () => {
    expect(escapeAttr(`a"b`)).toBe("a&quot;b");
    expect(escapeText(`a"b`)).toBe(`a"b`);
  });

  it("escapes the ampersand first, so an entity in the source is shown literally", () => {
    // Article prose is markdown, not HTML: a literal "&amp;" in the source is
    // four characters the reader should see, not an escaped ampersand.
    expect(escapeText("&amp;")).toBe("&amp;amp;");
  });
});

describe("markdownToHtml — supported constructs", () => {
  it("renders headings, demoting h1 to the heading floor", () => {
    expect(markdownToHtml("## Section")).toBe("<h2>Section</h2>");
    expect(markdownToHtml("### Sub")).toBe("<h3>Sub</h3>");
    expect(markdownToHtml("# Title")).toBe("<h2>Title</h2>");
  });

  it("renders a heading written without a space after the hashes", () => {
    // Five headings across the Arabic articles are written this way.
    expect(markdownToHtml("##أخطاء شائعة")).toBe("<h2>أخطاء شائعة</h2>");
  });

  it("renders paragraphs, joining soft-wrapped lines", () => {
    expect(markdownToHtml("one\ntwo\n\nthree")).toBe("<p>one two</p>\n<p>three</p>");
  });

  it("renders unordered lists", () => {
    expect(markdownToHtml("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  it("renders ordered lists", () => {
    expect(markdownToHtml("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
  });

  it("flattens an indented list item rather than nesting it", () => {
    // Three lines in the whole corpus are indented; a flat list that reads
    // correctly beats a wrong nesting guess.
    const out = markdownToHtml("- a\n   - 저는 ~라고 생각합니다 (I think that~)");
    expect(out).toBe("<ul><li>a</li><li>저는 ~라고 생각합니다 (I think that~)</li></ul>");
  });

  it("renders bold and italic", () => {
    expect(markdownToHtml("**b** and *i*")).toBe(
      "<p><strong>b</strong> and <em>i</em></p>"
    );
  });

  it("does not read a bold marker as two italics", () => {
    expect(renderInline("**gumiho**")).toBe("<strong>gumiho</strong>");
  });

  it("renders inline links", () => {
    expect(markdownToHtml("see [courses](/courses) now")).toBe(
      '<p>see <a href="/courses">courses</a> now</p>'
    );
  });

  it("renders a GFM table with its delimiter row", () => {
    const md = [
      "| Trait | Gumiho |",
      "|---|---|",
      "| Gender | Female |",
    ].join("\n");
    expect(markdownToHtml(md)).toBe(
      "<table><thead><tr><th>Trait</th><th>Gumiho</th></tr></thead>" +
        "<tbody><tr><td>Gender</td><td>Female</td></tr></tbody></table>"
    );
  });

  it("renders a table with a padded delimiter row", () => {
    const md = ["| الكورية | النطق |", "|---------|-------|", "| 나 | na |"].join("\n");
    expect(markdownToHtml(md)).toContain("<th>الكورية</th>");
    expect(markdownToHtml(md)).toContain("<td>na</td>");
  });

  it("leaves a pipe line that has no delimiter row as a paragraph", () => {
    expect(markdownToHtml("| not | a table |")).toBe("<p>| not | a table |</p>");
  });

  it("renders blockquotes", () => {
    expect(markdownToHtml("> a note")).toBe("<blockquote><p>a note</p></blockquote>");
  });

  it("renders horizontal rules", () => {
    expect(markdownToHtml("---")).toBe("<hr />");
    expect(markdownToHtml("***")).toBe("<hr />");
  });

  it("does not mistake a list item for a horizontal rule", () => {
    expect(markdownToHtml("- item")).toBe("<ul><li>item</li></ul>");
  });
});

describe("markdownToHtml — deliberately unsupported constructs degrade to text", () => {
  it("does not emit an image tag", () => {
    const out = markdownToHtml("![alt](/x.png)");
    expect(out).not.toContain("<img");
  });

  it("does not emit a code element for backticks", () => {
    const out = markdownToHtml("use `code` here");
    expect(out).not.toContain("<code");
    expect(out).toContain("`code`");
  });
});

describe("safety", () => {
  it("escapes a script tag in content instead of emitting it", () => {
    const out = markdownToHtml('<script>alert("xss")</script>');
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapes an img onerror payload", () => {
    const out = markdownToHtml('<img src=x onerror="alert(1)">');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("refuses a javascript: link target but keeps its words", () => {
    const out = markdownToHtml("[click](javascript:alert(1))");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("click");
    expect(out).not.toContain("<a ");
  });

  it("refuses a protocol-relative target", () => {
    expect(isSafeUrl("//evil.example")).toBe(false);
    expect(isSafeUrl("/blog/x")).toBe(true);
    expect(isSafeUrl("https://kloversegy.com")).toBe(true);
    expect(isSafeUrl("#anchor")).toBe(true);
  });

  it("drops HTML comments entirely", () => {
    expect(markdownToHtml("<!-- hidden -->\n\ntext")).toBe("<p>text</p>");
  });
});

describe("unescapeText", () => {
  it("decodes the three entities escapeText produces", () => {
    expect(unescapeText("a &amp; b")).toBe("a & b");
    expect(unescapeText("a &lt; b")).toBe("a < b");
    expect(unescapeText("a &gt; b")).toBe("a > b");
  });

  it("decodes &lt; and &gt; before &amp;, so an escaped entity does not become a tag character", () => {
    // The trap: decoding &amp; first turns "&amp;lt;" into "&lt;", which the
    // next pass would then read as an escape it had just manufactured and
    // decode to "<" — a character the author never wrote, and a route back to
    // raw markup. Decoding the longer entities first cannot do that.
    expect(unescapeText("&amp;lt;")).toBe("&lt;");
    expect(unescapeText("&amp;gt;")).toBe("&gt;");
    expect(unescapeText("&amp;amp;")).toBe("&amp;");
  });

  it("is the exact inverse of escapeText", () => {
    for (const s of ["a & b", "a < b > c", "&amp;", "&lt;", "&amp;lt;", "x&amp;lt;y", "plain"]) {
      expect(unescapeText(escapeText(s))).toBe(s);
    }
  });

  it("leaves entities escapeText never produces alone", () => {
    // Decoding &quot; or numeric entities here would stop this being an
    // inverse and start it being an HTML parser.
    expect(unescapeText("&quot;")).toBe("&quot;");
    expect(unescapeText("&#106;")).toBe("&#106;");
  });

  it("returns an empty string for null and undefined", () => {
    expect(unescapeText(null)).toBe("");
    expect(unescapeText(undefined)).toBe("");
  });
});

describe("link targets are escaped exactly once", () => {
  // renderInline escapes the whole line before it looks for inline markup, so
  // a captured href arrives already escaped. Re-escaping it as an attribute
  // without decoding first emitted "?a=1&amp;amp;b=2" — a URL containing a
  // literal "&amp;", which 404s. No link in the corpus contains "&" today;
  // the content column is arbitrary prose that changes without this file
  // changing.
  it("emits one level of escaping for a query string with an ampersand", () => {
    const out = markdownToHtml("see [search](/blog?q=korean&lang=ar) now");
    expect(out).toContain('href="/blog?q=korean&amp;lang=ar"');
    expect(out).not.toContain("&amp;amp;");
  });

  it("handles several ampersands in one target", () => {
    const out = markdownToHtml("[x](/s?q=a&b=c&d=e)");
    expect(out).toContain('href="/s?q=a&amp;b=c&amp;d=e"');
    expect(out).not.toContain("&amp;amp;");
  });

  it("handles an ampersand in an absolute target", () => {
    const out = markdownToHtml("[k](https://kloversegy.com/blog?x=1&y=2)");
    expect(out).toContain('href="https://kloversegy.com/blog?x=1&amp;y=2"');
    expect(out).not.toContain("&amp;amp;");
  });

  it("round-trips a target where the author typed the entity", () => {
    // The author wrote the five characters "&amp;". Representing those five
    // characters inside an attribute is "&amp;amp;" — one decoding fewer
    // would silently change what the author wrote.
    const out = markdownToHtml("[x](/a?b=1&amp;c=2)");
    expect(out).toContain('href="/a?b=1&amp;amp;c=2"');
    expect(out).not.toContain("&amp;amp;amp;");
  });

  it("leaves a target with no ampersand untouched", () => {
    expect(markdownToHtml("[courses](/courses)")).toBe(
      '<p><a href="/courses">courses</a></p>'
    );
  });

  it("still refuses an unsafe scheme that arrives with an ampersand in it", () => {
    // The safety check runs on the DECODED target, so it tests the URL a
    // browser would resolve rather than its escaped spelling.
    const out = markdownToHtml("[click](javascript:x&y=1)");
    expect(out).toBe("<p>click</p>");
    expect(out).not.toContain("javascript");
    expect(out).not.toContain("<a ");
  });

  it("still refuses a protocol-relative target containing an ampersand", () => {
    const out = markdownToHtml("[go](//evil.example/x?a=1&b=2)");
    expect(out).toContain("go");
    expect(out).not.toContain("<a ");
  });

  it("escapes a double quote in a target rather than breaking out of the attribute", () => {
    const out = renderInline('[x](/a?q="z")');
    expect(out).not.toMatch(/href="[^"]*"[^>]*"/);
    expect(out).toContain("&quot;");
  });
});

describe("String.replace substitution patterns survive verbatim", () => {
  // Article content is arbitrary prose. If any layer interpolates it as a
  // REPLACEMENT string rather than through a replacer function, "$&" becomes
  // the matched text and "$`" becomes everything before the match — silently
  // corrupting the page. Three published articles already contain "$" next to
  // a digit (prices), so this is not hypothetical.
  const hazards = ["$&", "$`", "$'", "$1", "$$", "15-20$", "$0–12"];

  for (const h of hazards) {
    it(`keeps ${JSON.stringify(h)} intact in a paragraph`, () => {
      // escapeText is applied because "&" is a text-node character; what must
      // NOT happen is the pattern expanding into surrounding page text.
      expect(markdownToHtml(`price is ${h} today`)).toBe(
        `<p>price is ${escapeText(h)} today</p>`
      );
    });

    it(`does not expand ${JSON.stringify(h)} into the surrounding text`, () => {
      const out = markdownToHtml(`alpha ${h} omega`);
      expect(out).toBe(`<p>alpha ${escapeText(h)} omega</p>`);
      // A "$&" read as a replacement pattern would duplicate the match; "$`"
      // would splice in everything before it. Both show up as a repeat.
      expect(out.match(/alpha/g).length).toBe(1);
      expect(out.match(/omega/g).length).toBe(1);
    });
  }

  it("keeps a substitution pattern intact inside bold, a list and a table cell", () => {
    expect(markdownToHtml("**$&**")).toBe("<p><strong>$&amp;</strong></p>");
    expect(markdownToHtml("- $`")).toBe("<ul><li>$`</li></ul>");
    expect(markdownToHtml("| a |\n|---|\n| $' |")).toContain("<td>$'</td>");
  });

  it("keeps a price string from a real article intact", () => {
    // korean-learning-apps-comparison-2026-ar, verbatim.
    expect(markdownToHtml("**التكلفة**: مجاني؛ Premium 8–12$/شهر")).toBe(
      "<p><strong>التكلفة</strong>: مجاني؛ Premium 8–12$/شهر</p>"
    );
  });
});

describe("related-links block", () => {
  const body = [
    "## Real content",
    "",
    "A paragraph.",
    "",
    MARKER_START,
    "",
    "## Related Articles",
    "",
    "- [Korean Myths](/blog/korean-myths-legends-stories-kdrama-fans)",
    "",
    MARKER_END,
    "",
  ].join("\n");

  it("is the caller's job to strip — the renderer only drops the comment markers", () => {
    // Documents the contract: markdownToHtml removes the HTML comments but not
    // the links between them. prerender-meta.mjs cuts marker-to-marker before
    // calling in, so the links appear once, in the <nav>.
    const rendered = markdownToHtml(body);
    expect(rendered).not.toContain("klovers:related");
    expect(rendered).toContain("korean-myths-legends-stories-kdrama-fans");
  });

  it("renders nothing of the block once the caller has cut it out", () => {
    const start = body.indexOf(MARKER_START);
    const end = body.indexOf(MARKER_END);
    const stripped = body.slice(0, start) + body.slice(end + MARKER_END.length);
    const rendered = markdownToHtml(stripped);
    expect(rendered).not.toContain("korean-myths-legends-stories-kdrama-fans");
    expect(rendered).not.toContain("Related Articles");
    expect(rendered).toContain("<h2>Real content</h2>");
  });
});

describe("Arabic and RTL content", () => {
  it("renders Arabic paragraphs, bold and links unchanged", () => {
    const md =
      "معظم كورسات الكورية بتعلمك كلمات بترتيب عشوائي. لكن **اتعلم الكلمات الأكثر استخداماً الأول**.";
    const out = markdownToHtml(md);
    expect(out).toContain("<strong>اتعلم الكلمات الأكثر استخداماً الأول</strong>");
    expect(out.startsWith("<p>معظم")).toBe(true);
  });

  it("preserves Arabic punctuation and the Arabic comma", () => {
    const out = markdownToHtml("أيوه، صح؟ ولا لأ!");
    expect(out).toBe("<p>أيوه، صح؟ ولا لأ!</p>");
  });

  it("renders an Arabic blockquote with mixed Korean and Latin text", () => {
    const out = markdownToHtml('> **ملحوظة**: 저 (jeo) هي "أنا" المتواضعة — 나 (na) للأصدقاء بس.');
    expect(out).toContain("<blockquote><p><strong>ملحوظة</strong>");
    expect(out).toContain("저 (jeo)");
  });

  it("demotes an Arabic h1 written without a space", () => {
    expect(markdownToHtml("#شرح جوميهو: الثعلب ذو الذيول التسعة في الفولكلور الكوري")).toBe(
      "<h2>شرح جوميهو: الثعلب ذو الذيول التسعة في الفولكلور الكوري</h2>"
    );
  });
});

describe("an article whose markdown opens with an # heading", () => {
  // 67 of 200 published articles do. Only 24 of those repeat the title
  // verbatim, so the leading heading is demoted rather than dropped — dropping
  // would delete a real heading from the other 43.
  const article = [
    "# Gumiho Explained: The Nine-Tailed Fox in Korean Folklore",
    "",
    "The **gumiho** — 구미호 — is the most famous creature in Korean folklore.",
    "",
    "## The Origin of the Gumiho",
    "",
    "Korean records mention nine-tailed foxes as early as the Goryeo dynasty.",
  ].join("\n");

  it("emits no h1 at all", () => {
    const out = markdownToHtml(article);
    expect(out).not.toContain("<h1");
  });

  it("keeps the heading text, demoted to h2", () => {
    const out = markdownToHtml(article);
    expect(out).toContain(
      "<h2>Gumiho Explained: The Nine-Tailed Fox in Korean Folklore</h2>"
    );
  });

  it("leaves deeper headings at their own level", () => {
    expect(markdownToHtml(article)).toContain("<h2>The Origin of the Gumiho</h2>");
  });

  it("honours a different heading floor", () => {
    expect(markdownToHtml("# T", { headingFloor: 3 })).toBe("<h3>T</h3>");
  });
});

describe("content is never lost", () => {
  // Regression: prose containing pipes was treated as a table boundary and,
  // finding no delimiter row, was dropped from the page entirely.
  it("keeps a pipe line that is not a table", () => {
    expect(markdownToHtml("| not | a table |")).toBe("<p>| not | a table |</p>");
  });

  it("keeps prose with pipes that sits between real blocks", () => {
    const out = markdownToHtml("## H\n\nuse the 은/는 | 이/가 pair\n\n- item");
    expect(out).toContain("use the 은/는 | 이/가 pair");
    expect(out).toContain("<h2>H</h2>");
    expect(out).toContain("<li>item</li>");
  });

  it("preserves every word of a mixed-construct article", () => {
    const md = [
      "# Title Here",
      "",
      "Intro paragraph with **bold** and a [link](/courses).",
      "",
      "## Section",
      "",
      "| Col | Val |",
      "|---|---|",
      "| Row | Cell |",
      "",
      "- bullet one",
      "1. numbered one",
      "",
      "> quoted note",
      "",
      "---",
      "",
      "Closing line.",
    ].join("\n");
    const words = ["Title", "Here", "Intro", "bold", "link", "Section", "Col",
      "Val", "Row", "Cell", "bullet", "one", "numbered", "quoted", "note", "Closing"];
    const rendered = markdownToHtml(md);
    for (const w of words) expect(rendered).toContain(w);
  });
});

describe("robustness", () => {
  it("returns an empty string for empty, null and undefined input", () => {
    expect(markdownToHtml("")).toBe("");
    expect(markdownToHtml(null)).toBe("");
    expect(markdownToHtml(undefined)).toBe("");
  });

  it("normalises CRLF", () => {
    expect(markdownToHtml("a\r\n\r\nb")).toBe("<p>a</p>\n<p>b</p>");
  });

  it("terminates on a table delimiter with no rows after it", () => {
    expect(() => markdownToHtml("| a |\n|---|")).not.toThrow();
  });

  it("is deterministic", () => {
    const md = "## H\n\n- a\n- b\n\n| x |\n|---|\n| y |";
    expect(markdownToHtml(md)).toBe(markdownToHtml(md));
  });
});
