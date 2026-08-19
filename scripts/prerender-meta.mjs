/**
 * prerender-meta.mjs — Option A1
 *
 * Post-build script that creates route-specific HTML files in dist/ with a
 * fully-populated <head>: title, description, canonical, Open Graph, Twitter
 * card and JSON-LD.
 *
 * Vercel serves static files BEFORE applying rewrites, so dist/courses/index.html
 * is served for /courses instead of the SPA shell.
 *
 * The blog route list is READ FROM SUPABASE AT BUILD TIME. It used to be a
 * hand-maintained array of 30 slugs, which meant any post published after that
 * array was last edited was served the site-wide default title and description
 * (docs/SEO_DIAGNOSIS.md, finding #2).
 *
 * If the Supabase query fails, the last successful route list is reused from
 * scripts/prerender-routes.cache.json and a loud warning is printed. If there is
 * no cache either, the build FAILS rather than silently emitting only the
 * marketing routes — a near-empty prerender is worse than no deploy, because it
 * would quietly de-list every blog post.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const DIST = join(process.cwd(), "dist");
const CACHE_FILE = join(process.cwd(), "scripts", "prerender-routes.cache.json");
const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers";
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;

// Build-time credentials. Vercel already defines the VITE_* pair for the app
// itself, so the non-prefixed names are only an override for local runs.
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Escape a string for safe use inside a double-quoted HTML attribute. */
const attr = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── Marketing routes ────────────────────────────────────────────────────────
// Hand-maintained on purpose: these are static pages, not database rows.
const MARKETING_ROUTES = [
  {
    path: "/",
    title: "Learn Korean Online",
    description:
      "Join Klovers Korean Lovers Academy. Interactive online Korean lessons, placement tests, and gamified learning for all levels.",
  },
  {
    path: "/courses",
    title: "Korean Courses",
    description:
      "Explore Klovers Korean language courses — Beginner to Advanced. Live classes, flexible schedules, and certified teachers.",
  },
  {
    path: "/pricing",
    title: "Pricing & Plans",
    description:
      "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.",
  },
  {
    path: "/about",
    title: "About Us",
    description:
      "Meet the Klovers team. Our certified teachers bring years of experience teaching Korean to students worldwide.",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with Klovers Korean Lovers Academy. We would love to hear from you about courses, enrollment, or any questions.",
  },
  {
    path: "/faq",
    title: "FAQ",
    description:
      "Got questions about learning Korean with Klovers? Find answers about courses, teachers, scheduling, and payments.",
  },
  {
    path: "/enroll-now",
    title: "Enroll Now | Klovers Korean Academy",
    description:
      "Join Klovers Korean Academy — choose your class type, schedule, and start speaking Korean with confidence.",
  },
  {
    path: "/enroll",
    title: "Enroll Now",
    description:
      "Start learning Korean today. Enroll in a Klovers course — choose your level, schedule, and teacher.",
  },
  {
    path: "/placement-test",
    title: "Korean Placement Test",
    description:
      "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.",
  },
  {
    path: "/games",
    title: "Korean Learning Games",
    description:
      "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.",
  },
  {
    path: "/free-trial",
    title: "Free Trial",
    description:
      "Try a free Korean lesson at Klovers. Experience interactive learning, certified teachers, and our gamified curriculum with no commitment.",
  },
  {
    path: "/affiliate",
    title: "Affiliate Program",
    description:
      "Join the Klovers affiliate program. Earn commissions by referring students to our Korean language courses.",
  },
  {
    path: "/blog",
    title: "Blog",
    description:
      "Read the latest articles about learning Korean, K-culture, TOPIK preparation, and language tips on the Klovers blog.",
  },
  {
    path: "/learn-korean-arabic-speakers",
    title: "Learn Korean for Arabic Speakers",
    description:
      "A Korean course built for Arabic speakers. Contrastive grammar, Arabic-to-Korean explanations, and a realistic 8-month timeline.",
  },
  {
    path: "/topik-exam-preparation",
    title: "TOPIK Exam Preparation 2026",
    description:
      "Prepare for the TOPIK exam with Klovers. 2026 exam dates, level breakdown, scoring, and an 8-12 week study plan.",
  },
  {
    path: "/learn-korean-kdramas",
    title: "Learn Korean Through K-Dramas",
    description:
      "Learn Korean with K-dramas using the 4-watch method. Drama recommendations by level and a 30-day habit-building guide.",
  },
  // Added in A1 — live routes that were missing from the prerender list.
  {
    path: "/interview-training",
    title: "Korean Interview Training — AI-Powered | Klovers",
    description:
      "Practice Korean job interview questions with AI-generated personalized Q&A. Get 2 free questions, upgrade for more.",
  },
  {
    path: "/welcome-back",
    title: "Welcome Back — Returning Students Offer",
    description:
      "Returning Klovers students get 20% off. Enroll now, share with friends, and save up to 35%. No placement test required.",
  },
  {
    path: "/hangul-starter",
    title: "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description:
      "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
  },
];

// ── Blog routes, from the database ──────────────────────────────────────────

/** Fetch every published post. Same filter as api/sitemap.xml.js. */
async function fetchPublishedPosts() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY not set (VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY are also accepted)"
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, description, lang, hero_image, hero_alt, article_type, author, published_at, updated_at"
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("query returned zero published posts");
  return data;
}

/** Turn a post row into a route entry. */
const postToRoute = (p) => ({
  path: `/blog/${p.slug}`,
  title: p.title,
  description: p.description,
  post: {
    slug: p.slug,
    lang: p.lang || "en",
    heroImage: p.hero_image || null,
    heroAlt: p.hero_alt || null,
    articleType: p.article_type || null,
    author: p.author || SITE_NAME,
    publishedAt: p.published_at || null,
    updatedAt: p.updated_at || p.published_at || null,
  },
});

let blogRoutes;
let usedCache = false;

try {
  const posts = await fetchPublishedPosts();
  blogRoutes = posts.map(postToRoute);
  writeFileSync(
    CACHE_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), routes: blogRoutes }, null, 2),
    "utf-8"
  );
  console.log(`\nFetched ${blogRoutes.length} published blog posts from Supabase.`);
} catch (err) {
  console.error("\n" + "!".repeat(72));
  console.error("!! PRERENDER WARNING: could not read blog posts from Supabase.");
  console.error(`!! Reason: ${err.message}`);

  if (existsSync(CACHE_FILE)) {
    const cache = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    blogRoutes = cache.routes || [];
    usedCache = true;
    console.error(`!! Falling back to scripts/prerender-routes.cache.json`);
    console.error(`!! Cache written at: ${cache.generatedAt}`);
    console.error(`!! Using ${blogRoutes.length} cached blog routes.`);
    console.error("!! Posts published since then will NOT have prerendered meta.");
    console.error("!".repeat(72) + "\n");
  } else {
    console.error("!! No cache file exists to fall back to.");
    console.error("!! Refusing to emit marketing routes only — that would silently");
    console.error("!! de-list every blog post. Failing the build instead.");
    console.error("!".repeat(72) + "\n");
    process.exit(1);
  }
}

const routes = [...MARKETING_ROUTES, ...blogRoutes];

// ── Emit ────────────────────────────────────────────────────────────────────

const baseHTML = readFileSync(join(DIST, "index.html"), "utf-8");

let created = 0;

for (const route of routes) {
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${route.path === "/" ? "" : route.path}`;
  const description = route.description || "";

  let html = baseHTML;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(fullTitle)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${attr(description)}" />`
  );
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${canonicalUrl}" />\n  </head>`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${attr(fullTitle)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${attr(description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(fullTitle)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(description)}" />`
  );

  const filePath =
    route.path === "/"
      ? join(DIST, "index.html")
      : join(DIST, route.path.slice(1), "index.html");

  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(filePath, html, "utf-8");
  created++;
}

console.log(
  `\n✅ Prerendered ${created} routes ` +
    `(${MARKETING_ROUTES.length} marketing + ${blogRoutes.length} blog` +
    `${usedCache ? ", FROM CACHE" : ""}).\n`
);
