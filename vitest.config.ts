import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Blank out a leading `#!/usr/bin/env node` line in scripts/*.mjs before Vite
 * parses them. On a Windows checkout with CRLF line endings the shebang is
 * followed by `\r`, and the test runner then fails every test file that imports
 * such a script with "SyntaxError: Invalid or unexpected token". The line is
 * replaced with an empty comment, so line numbers in stack traces are unchanged.
 */
const stripShebang = {
  name: "strip-shebang",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!/\.m?js$/.test(id.split("?")[0]) || !code.startsWith("#!")) return null;
    return { code: code.replace(/^#![^\r\n]*/, "//"), map: null };
  },
};

export default defineConfig({
  plugins: [stripShebang, react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Headroom for a parallel run, not slack for slow tests. The suite is 74
    // files of jsdom + React; on an 8-core box the slowest individual tests
    // (batch catch-up) measure 4.4-4.9s under full-suite load while taking
    // ~1.1s alone, so the 5s Vitest default is already marginal here and CI's
    // runner has fewer cores than that. A genuine hang is still caught: these
    // values are two to three times the worst measured time, and a real stall
    // does not resolve at 15s.
    testTimeout: 15000,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.mjs",
      // Edge-function shared helpers that are plain Intl/Date (no Deno APIs)
      // are unit-tested directly with Vitest — there is no Deno test runner
      // wired into CI, and duplicating the logic just to test it would let
      // the two copies drift.
      "supabase/functions/_shared/**/*.{test,spec}.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
