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


// ── Head construction ───────────────────────────────────────────────────────

const routes = [...MARKETING_ROUTES, ...blogRoutes];

// Slug bases, used to decide whether an EN<->AR partner really exists.
// Arabic posts use either a `-ar` suffix (90 of them) or a legacy `ar-` prefix (10).
const publishedSlugs = new Set(blogRoutes.map((r) => r.post.slug));
const baseOf = (slug) =>
  slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

/**
 * Resolve the EN and AR URLs for a post, but only where the partner document
 * actually exists. Emitting an alternate for a URL that 404s invalidates the
 * whole annotation cluster, so a missing partner means no hreflang at all.
 */
function hreflangFor(slug) {
  const base = baseOf(slug);
  const enSlug = publishedSlugs.has(base) ? base : null;
  const arSlug = publishedSlugs.has(`${base}-ar`)
    ? `${base}-ar`
    : publishedSlugs.has(`ar-${base}`)
      ? `ar-${base}`
      : null;
  if (!enSlug || !arSlug) return null;          // no honest pair -> no tags
  return {
    en: `${BASE_URL}/blog/${enSlug}`,
    ar: `${BASE_URL}/blog/${arSlug}`,
  };
}

/**
 * Open Graph and Twitter require absolute URLs. 78 of the 200 hero_image values
 * are root-relative ("/assets/..."), which social scrapers and Google Images
 * cannot resolve, so promote them to absolute here.
 */
function absoluteUrl(u) {
  if (!u) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

const jsonLd = (obj) =>
  `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)
    .split("\n")
    .map((l) => "  " + l)
    .join("\n")}\n  </script>`;

function buildHeadTags(route) {
  const isHome = route.path === "/";
  const isPost = Boolean(route.post);
  const url = `${BASE_URL}${isHome ? "" : route.path}`;
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const description = route.description || "";
  const image = absoluteUrl(isPost ? route.post.heroImage : null);
  const imageAlt = isPost && route.post.heroAlt ? route.post.heroAlt : SITE_NAME;

  const tags = [
    `  <link rel="canonical" href="${attr(url)}" />`,
    `  <meta property="og:type" content="${isPost ? "article" : "website"}" />`,
    `  <meta property="og:url" content="${attr(url)}" />`,
    `  <meta property="og:image" content="${attr(image)}" />`,
    `  <meta property="og:image:alt" content="${attr(imageAlt)}" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:image" content="${attr(image)}" />`,
  ];

  if (isPost) {
    const p = route.post;
    if (p.publishedAt)
      tags.push(`  <meta property="article:published_time" content="${attr(p.publishedAt)}" />`);
    if (p.updatedAt)
      tags.push(`  <meta property="article:modified_time" content="${attr(p.updatedAt)}" />`);

    const alts = hreflangFor(p.slug);
    if (alts) {
      tags.push(`  <link rel="alternate" hreflang="en" href="${attr(alts.en)}" />`);
      tags.push(`  <link rel="alternate" hreflang="ar" href="${attr(alts.ar)}" />`);
      tags.push(`  <link rel="alternate" hreflang="x-default" href="${attr(alts.en)}" />`);
    }

    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: route.title,
        description,
        image: [image],
        inLanguage: p.lang === "ar" ? "ar" : "en",
        ...(p.articleType ? { articleSection: p.articleType } : {}),
        ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
        ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
        author: { "@type": "Organization", name: p.author || SITE_NAME, url: BASE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
          logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
        },
      })
    );

    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: route.title, item: url },
        ],
      })
    );
  }

  return tags.join("\n");
}

// ── Emit ────────────────────────────────────────────────────────────────────

const baseHTML = readFileSync(join(DIST, "index.html"), "utf-8");

// The organisation-level JSON-LD in index.html describes the business and the
// site as a whole. Repeating it on 218 subpages is duplicate entity markup, so
// it is kept on the homepage only and stripped everywhere else.
const baseWithoutOrgJsonLd = baseHTML.replace(
  /[ \t]*<!-- JSON-LD[^>]*-->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,
  ""
);

let created = 0;
let withHreflang = 0;

for (const route of routes) {
  const isHome = route.path === "/";
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const description = route.description || "";

  let html = isHome ? baseHTML : baseWithoutOrgJsonLd;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(fullTitle)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${attr(description)}" />`
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
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(fullTitle)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(description)}" />`
  );

  // Drop the placeholders that the base document ships with, so the values
  // written below are the only ones present.
  html = html.replace(/[ \t]*<meta property="og:type" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta property="og:image" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta name="twitter:card" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta name="twitter:image" content="[^"]*"\s*\/?>\n?/g, "");

  html = html.replace("</head>", `${buildHeadTags(route)}\n  </head>`);

  if (route.post && hreflangFor(route.post.slug)) withHreflang++;

  const filePath = isHome
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
    `${usedCache ? ", FROM CACHE" : ""}).`
);
console.log(`   ${withHreflang} blog routes have a real EN/AR partner and got hreflang.\n`);
