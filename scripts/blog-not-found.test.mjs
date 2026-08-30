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
