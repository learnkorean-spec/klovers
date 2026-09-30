/**
 * Tests for api/blog-not-found.js.
 *
 * This file sits in scripts/ rather than next to the code it tests because
 * Vercel deploys every file under api/ as a serverless function — a test file
 * there would become a public endpoint.
 */
import { describe, it, expect, vi } from "vitest";
import handler from "../api/blog-not-found.js";

function mockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("blog-not-found handler", () => {
  it("responds with a real HTTP 404, not 200", () => {
    const res = mockRes();
    handler({}, res);
    expect(res.statusCode).toBe(404);
  });

  it("serves HTML, not JSON or plain text", () => {
    const res = mockRes();
    handler({}, res);
    expect(res.headers["Content-Type"]).toMatch(/text\/html/);
  });

  it("tells search engines not to index the response", () => {
    const res = mockRes();
    handler({}, res);
    expect(res.body).toMatch(/<meta name="robots" content="noindex, nofollow" \/>/);
  });

  it("links back to /blog and / so a real visitor isn't stranded", () => {
    const res = mockRes();
    handler({}, res);
    expect(res.body).toContain('href="/blog"');
    expect(res.body).toContain('href="/"');
  });
});

describe("trailing punctuation from pasted links (1 Oct 2026)", async () => {
  const { default: notFound } = await import("../api/not-found.js");
  const cases = [
    ["/shop%D8%8C", "/shop"],
    ["/shop،", "/shop"],
    ["/terms.", "/terms"],
    ["/free-trial).", "/free-trial"],
    ["/shop%D8%8C?x=1", "/shop?x=1"],
  ];
  for (const [from, to] of cases) {
    it(`${from} -> ${to}`, () => {
      const res = mockRes();
      notFound({ url: from }, res);
      expect(res.statusCode).toBe(301);
      expect(res.headers.Location).toBe(to);
    });
  }
  it("a normal unknown path is still a 404", () => {
    const res = mockRes();
    notFound({ url: "/no-such-page" }, res);
    expect(res.statusCode).toBe(404);
  });
  it("blog slugs get the same treatment", () => {
    const res = mockRes();
    handler({ url: "/blog/some-post%D8%8C" }, res);
    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe("/blog/some-post");
  });
});
