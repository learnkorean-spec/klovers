import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import path from "path";

/**
 * The app bundle downloads at LOW priority (6 Oct 2026).
 *
 * The homepage paints its hero from plain HTML now (#kl-hero-shell in
 * index.html), so the first paint needs only the HTML, the stylesheet and the
 * hero picture. Vite emits the entry <script type="module"> and its
 * <link rel="modulepreload"> tags, which Chrome fetches at HIGH priority.
 * Lighthouse's mobile simulation counts every high-priority request that
 * starts before the first paint as something the paint waited for. With
 * ~200 KB of brotli JS in that set, it put FCP at 4.3s and LCP at 4.7s, even
 * though the real paint was ~1s (PageSpeed mobile 71).
 *
 * fetchpriority="low" lets the picture and the CSS go first on a slow
 * connection. The JS still starts at once and in parallel, so the app is
 * barely later to become interactive. Build only - the dev server's HTML is
 * left alone.
 */
const lowPriorityAppBundle = () => ({
  name: "klovers-low-priority-app-bundle",
  apply: "build" as const,
  transformIndexHtml: {
    order: "post" as const,
    handler(html: string) {
      return html
        .replace(/<script type="module" crossorigin src=/g, '<script type="module" crossorigin fetchpriority="low" src=')
        .replace(/<link rel="modulepreload" crossorigin href=/g, '<link rel="modulepreload" crossorigin fetchpriority="low" href=');
    },
  },
});

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      // Atomic writers (editors, agent tooling) drop a hidden temp directory
      // beside the file they are replacing. chokidar tries to watch it, the
      // directory is gone by the time it opens it, and on Windows that is an
      // EBUSY that takes the whole dev server down mid-edit. Ignoring them
      // costs nothing: nothing real is ever named .*.tmpdir.
      ignored: ["**/.*.tmpdir/**", "**/*.tmp"],
    },
  },
  plugins: [
    react(),
    lowPriorityAppBundle(),
    ViteImageOptimizer({
      jpg: { quality: 80 },
      jpeg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // One React and one three, forced. /world mounts a react-reconciler
    // renderer, and a second copy of React anywhere in the graph surfaces as
    // "Invalid hook call" inside <Canvas> — the whole route dies with it.
    // npm reports a single hoisted react; the bundler still has to be told,
    // because the dep optimizer will otherwise inline its own copy.
    dedupe: ["react", "react-dom", "react-reconciler", "three", "@react-three/fiber"],
  },
  build: {
    // Increase chunk size warning limit (avoids noise, not a problem for SPA)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          // React core — changes rarely, long cache lifetime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI components
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-dropdown-menu",
          ],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Markdown rendering (only used on blog post pages)
          "vendor-markdown": ["react-markdown", "remark-gfm"],
          // NO charting chunk here, on purpose (24 Sep 2026).
          //
          // A vendor charts entry used to sit here. The object form of
          // manualChunks moves the listed package AND every dependency of it
          // into the named chunk - and the charting library depends on clsx,
          // which cn() in src/lib/utils.ts uses on every page. So the entry
          // chunk imported the charts chunk to get clsx, and every marketing
          // page modulepreloaded ~411 KB of charts it never draws (Lighthouse
          // mobile 42-60, LCP 5.9-10.2 s in the 23 Sep audit).
          //
          // Left to Rollup, the charting code lands in a lazy chunk shared by
          // the dashboard/admin routes that actually render charts.
          // Guarded by scripts/lib/vite-chunks.test.mjs.
        },
      },
    },
  },
}));
