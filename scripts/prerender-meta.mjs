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
import { baseOf, buildRelatedMap, RELATED_MIN } from "./lib/related-posts.mjs";

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

/** Escape a string for safe use as HTML text content. */
const text = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Trim to a whole word near `max` characters, for the listing excerpts. */
const excerpt = (s, max = 160) => {
  const clean = String(s ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")) || cut}…`;
};

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
      "slug, title, description, keywords, lang, hero_image, hero_alt, article_type, author, published_at, updated_at"
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
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
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
// `baseOf` is shared with the related-posts scoring so the two cannot drift
// apart about what counts as the same topic.
const publishedSlugs = new Set(blogRoutes.map((r) => r.post.slug));

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

// ── Related articles ────────────────────────────────────────────────────────
//
// Every article page gets a block of links to other articles, written into the
// raw HTML at build time. This is the only internal-linking mechanism that
// reaches a crawler which does not execute JavaScript, and without it every one
// of the 200 articles is an orphan: nothing on the site points at it.
//
// A client-side related-posts block already exists in src/pages/BlogPostPage.tsx
// and is left alone. It is invisible to a raw fetch, and it groups posts by
// `article_type`, which is a format rather than a topic. The scoring that
// replaces it for the prerendered block lives in scripts/lib/related-posts.mjs,
// where it can be unit tested.

/**
 * The block written into an article page's <body>.
 *
 * Title and description come from the same row that already fills the <head>,
 * so a raw fetch gets a page that says what it is rather than a bare list of
 * links floating on an otherwise blank document.
 */
function buildArticleBodyHtml(route, relatedSlugs, bySlug) {
  const isAr = route.post.lang === "ar";
  const items = relatedSlugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .map((r) => `          <li><a href="${attr(r.path)}">${text(r.title)}</a></li>`)
    .join("\n");

  return `<div id="article-prerendered" lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
      <h1>${text(route.title)}</h1>
      <p>${text(route.description)}</p>
      <nav aria-labelledby="related-articles">
        <h2 id="related-articles">${isAr ? "مقالات ذات صلة" : "Related articles"}</h2>
        <ul>
${items}
        </ul>
      </nav>
    </div>`;
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

/**
 * A real, server-visible list of every published article, written into the
 * prerendered /blog document.
 *
 * Before this, /blog served an empty <div id="root"> to anything that does not
 * run JavaScript, which meant there was no crawlable path from the blog index to
 * a single article. The sitemap listed the URLs, but nothing on the site linked
 * to them, so every article was an orphan.
 *
 * This markup goes INSIDE #root. src/main.tsx mounts with `createRoot`, not
 * `hydrateRoot`, so React empties the container and renders over it — there is
 * no hydration to mismatch. Until the bundle arrives the reader sees a plain
 * list of links instead of the blank screen they see today, which on a slow
 * Egyptian mobile connection is the better of the two.
 *
 * Not paginated, deliberately. 200 links on one page is well within what a
 * crawler will follow, and the alternative would mean inventing /blog/page/2
 * URLs that prerender fine but that the SPA has no route for — a reader who
 * clicked one would land on the app's not-found page.
 */
function buildBlogIndexHtml(routes) {
  const groups = [
    { lang: "en", dir: "ltr", heading: "All articles", rows: routes.filter((r) => r.post.lang !== "ar") },
    { lang: "ar", dir: "rtl", heading: "كل المقالات", rows: routes.filter((r) => r.post.lang === "ar") },
  ];

  const sections = groups
    .filter((g) => g.rows.length)
    .map((g) => {
      const items = g.rows
        .map(
          (r) => `        <li>
          <a href="${attr(r.path)}">${text(r.title)}</a>
          <p>${text(excerpt(r.description))}</p>
        </li>`
        )
        .join("\n");
      return `      <section lang="${g.lang}" dir="${g.dir}">
        <h2>${text(g.heading)} (${g.rows.length})</h2>
        <ul>
${items}
        </ul>
      </section>`;
    })
    .join("\n");

  return `<div id="blog-index-prerendered">
      <h1>Klovers Korean blog</h1>
      <p>Guides to Korean grammar, vocabulary, TOPIK and Korean culture, in English and Arabic.</p>
${sections}
    </div>`;
}

const jsonLd = (obj) =>
  `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)
    .split("\n")
    .map((l) => "  " + l)
    .join("\n")}\n  </script>`;

function buildHeadTags(route) {
  const isHome = route.path === "/";
  const isPost = Boolean(route.post);
  // Root keeps its slash - "/" IS the path. Sub-paths never get a trailing
  // slash. This must match api/sitemap.xml.js exactly or the canonical and
  // the sitemap entry disagree.
  const url = `${BASE_URL}${isHome ? "/" : route.path}`;
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

/** The SPA mount point, as vite emits it. */
const ROOT_DIV = '<div id="root"></div>';

const { related: relatedMap, inbound: inboundCount } = buildRelatedMap(
  blogRoutes.map((r) => r.post)
);
const routeBySlug = new Map(blogRoutes.map((r) => [r.post.slug, r]));

let created = 0;
let withHreflang = 0;
let blogIndexLinks = 0;
let relatedLinksWritten = 0;

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

  // The blog index is the one route whose <body> has to carry real content:
  // it is the only page that can make the articles reachable by a crawler.
  if (route.path === "/blog") {
    const before = html;
    html = html.replace(ROOT_DIV, `<div id="root">${buildBlogIndexHtml(blogRoutes)}</div>`);
    if (html === before) {
      // A vite upgrade that renames or reformats the mount point would leave
      // /blog silently empty again, which is the exact regression this change
      // exists to fix. Fail the build instead of shipping it.
      throw new Error(
        `could not find ${ROOT_DIV} in dist/index.html — the blog index links were not written`
      );
    }
    blogIndexLinks = blogRoutes.length;
  }

  // Article pages carry their related-articles block in the raw HTML, for the
  // crawlers that never run the client-side one.
  if (route.post) {
    const relatedSlugs = relatedMap.get(route.post.slug) || [];
    if (relatedSlugs.length < RELATED_MIN) {
      throw new Error(
        `${route.path} has only ${relatedSlugs.length} related articles ` +
          `(minimum ${RELATED_MIN}) — it would ship as an orphan`
      );
    }
    const before = html;
    html = html.replace(ROOT_DIV, `<div id="root">${buildArticleBodyHtml(route, relatedSlugs, routeBySlug)}</div>`);
    if (html === before) {
      throw new Error(
        `could not find ${ROOT_DIV} in dist/index.html — ${route.path} got no related links`
      );
    }
    relatedLinksWritten += relatedSlugs.length;
  }

  if (route.post && hreflangFor(route.post.slug)) withHreflang++;

  const filePath = isHome
    ? join(DIST, "index.html")
    : join(DIST, route.path.slice(1), "index.html");

  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(filePath, html, "utf-8");
  created++;
}

// ── Neutral SPA shell ───────────────────────────────────────────────────────
//
// dist/index.html is BOTH the homepage and, via the rewrite in vercel.json, the
// document served for any route without a prerendered file. Those two jobs
// conflict: an unknown URL used to be served the homepage's title and the
// homepage's canonical, so every stray URL declared itself a copy of the
// homepage.
//
// Split them. index.html keeps the real homepage head; app.html is a neutral
// shell with a generic title and NO canonical, and vercel.json points the
// rewrite at it. The app still boots identically - it is the same bundle.
//
// The shell is deliberately not noindex: real app routes are served through it
// and manage their own robots meta via useSEO({ noindex: true }), and a blanket
// noindex here would be invisible to those pages but fatal if a marketing route
// ever fell through.

const shellHTML = baseWithoutOrgJsonLd
  .replace(/<title>[^<]*<\/title>/, `<title>${SITE_NAME}</title>`)
  .replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="Klovers Korean Lovers Academy." />`
  )
  // No canonical, no og:url, no og:title: an unknown route must not claim to be
  // any particular page.
  .replace(/[ \t]*<meta property="og:title" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta property="og:description" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta name="twitter:title" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta name="twitter:description" content="[^"]*"\s*\/?>\n?/g, "");

writeFileSync(join(DIST, "app.html"), shellHTML, "utf-8");
console.log("   Wrote dist/app.html (neutral shell for unmatched routes).");

console.log(
  `\n✅ Prerendered ${created} routes ` +
    `(${MARKETING_ROUTES.length} marketing + ${blogRoutes.length} blog` +
    `${usedCache ? ", FROM CACHE" : ""}).`
);
console.log(`   ${withHreflang} blog routes have a real EN/AR partner and got hreflang.`);
console.log(`   /blog carries ${blogIndexLinks} article links in its raw HTML.`);

const orphans = blogRoutes.filter((r) => inboundCount.get(r.post.slug) === 0);
console.log(
  `   ${relatedLinksWritten} related-article links written across ${blogRoutes.length} articles ` +
    `(${orphans.length} still have nothing pointing at them).`
);
if (orphans.length) {
  console.log(`   orphans: ${orphans.map((r) => r.post.slug).join(", ")}`);
}
console.log("");
