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
