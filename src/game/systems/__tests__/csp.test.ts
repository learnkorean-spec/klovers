import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The live site's Content-Security-Policy (vercel.json) once lacked blob: in
 * connect-src, and every 3D character lost its textures on kloversegy.com
 * (white faces) while looking fine locally, where no CSP is sent. The GLB
 * models' embedded textures are unpacked by three.js to blob: URLs and
 * fetched — this keeps that allowed.
 */
function csp(): Record<string, string[]> {
  const cfg = JSON.parse(readFileSync(resolve(__dirname, "../../../../vercel.json"), "utf8"));
  const headers: { key: string; value: string }[] = cfg.headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers);
  const value = headers.find((h) => h.key.toLowerCase() === "content-security-policy")?.value ?? "";
  return Object.fromEntries(
    value
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([name, ...srcs]) => [name, srcs]),
  );
}

describe("site CSP keeps the 3D world working", () => {
  it("lets the world's models unpack their textures (blob: in connect-src)", () => {
    expect(csp()["connect-src"]).toContain("blob:");
  });
  it("lets textures and canvases draw (blob: and data: in img-src)", () => {
    expect(csp()["img-src"]).toEqual(expect.arrayContaining(["blob:", "data:"]));
  });
});
