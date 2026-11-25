/**
 * lang-article-pages.mjs — prerendered routes for the Voca (English) and Buda
 * (Hungarian) article libraries.
 *
 * WHY THIS EXISTS
 *
 * The 18 + 18 articles under /learn-english/articles and
 * /learn-hungarian/articles (18 Nov 2026) are rendered only in the browser:
 * src/pages/LangArticlesPages.tsx sets the title and description with useSEO()
 * after the bundle loads. Until then the raw HTML is the generic SPA shell, so
 * a crawler that has not run the JavaScript sees the title "Klovers", the
 * description "Klovers." and no body at all. Search Console on 25 Nov 2026
 * listed the Voca/Buda pages among "Discovered / Crawled, currently not
 * indexed", which is what thin-looking raw HTML tends to produce.
 *
 * This file turns each article into the same kind of route entry
 * MARKETING_ROUTES holds, so prerender-meta.mjs gives it its own <title>,
 * description, canonical, JSON-LD and a visible body, exactly like the other
 * hand-written pages. The copy is the article's own text, so the raw HTML and
 * what the app renders say the same thing.
 *
 * Pure functions, no I/O: prerender-meta.mjs runs top to bottom on import and
 * cannot be imported from a test, so the logic lives here (same reason as
 * related-posts.mjs).
 */

export const LANG_BRANDS = [
  { key: "voca", name: "Voca", path: "/learn-english", langAr: "الإنجليزية" },
  { key: "buda", name: "Buda", path: "/learn-hungarian", langAr: "المجرية" },
];

/** Published and modified date of the 18 + 18 articles (the day they shipped). */
export const LANG_ARTICLES_DATE = "2026-11-18";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

/** Same title and description the app sets with useSEO() for the index page. */
export function indexMeta(brand, count) {
  return {
    title: `مقالات لتعلّم ${brand.langAr} بشرح بالعربية | ${brand.name}`,
    description: `${count} مقالًا عمليًا لتعلّم ${brand.langAr}: البداية من الصفر، النطق، القواعد، والتعلّم مع مدرّسة.`,
  };
}

export function buildIndexBody(brand, articles) {
  const items = articles
    .map(
      (a) =>
        `<li><a href="${escAttr(`${brand.path}/articles/${a.slug}`)}"><h2>${esc(a.title)}</h2></a>` +
        `<p>${esc(a.description)}</p></li>`
    )
    .join("");
  return (
    `<div id="lang-articles-prerendered" lang="ar" dir="rtl"><main>` +
    `<h1>مقالات لتعلّم ${esc(brand.langAr)}</h1>` +
    `<p>${articles.length} مقالًا عمليًا ومكتوبًا للمتعلّم العربي: من أين تبدأ، ما الذي يصعب فعلًا، وكيف تتقدّم بخطوات واقعية.</p>` +
    `<ul>${items}</ul>` +
    `<p><a href="${escAttr(`${brand.path}#trial`)}">احجز حصة تجريبية</a></p>` +
    `</main></div>`
  );
}

export function buildArticleBody(brand, article, next) {
  const sections = article.sections
    .map(
      (s) =>
        `<section><h2>${esc(s.heading)}</h2>` +
        s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("") +
        `</section>`
    )
    .join("");
  return (
    `<div id="lang-article-prerendered" lang="ar" dir="rtl"><main><article>` +
    `<p><a href="${escAttr(`${brand.path}/articles`)}">كل المقالات</a></p>` +
    `<h1>${esc(article.title)}</h1>` +
    `<p>${esc(article.description)}</p>` +
    `<p>${article.minutes} دقائق قراءة · ريهام الشرقاوي</p>` +
    sections +
    `<p><strong>جرّب حصة مع ريهام</strong> حصة تجريبية قصيرة لنعرف مستواك وما تحتاجه فعلًا. ` +
    `<a href="${escAttr(`${brand.path}#trial`)}">احجز حصة تجريبية</a></p>` +
    `<p>المقال التالي: <a href="${escAttr(`${brand.path}/articles/${next.slug}`)}">${esc(next.title)}</a></p>` +
    `</article></main></div>`
  );
}

/**
 * Route entries in the shape MARKETING_ROUTES uses. `brands` is
 * [{ ...LANG_BRANDS entry, articles }].
 */
export function buildLangArticleRoutes(baseUrl, brands) {
  const routes = [];
  for (const brand of brands) {
    const { articles } = brand;
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error(`lang-article-pages: ${brand.key} has no articles to prerender`);
    }
    const meta = indexMeta(brand, articles.length);
    routes.push({
      path: `${brand.path}/articles`,
      lang: "ar",
      title: meta.title,
      description: meta.description,
      body: buildIndexBody(brand, articles),
      pageLd: {
        "@type": "CollectionPage",
        inLanguage: "ar",
        publisher: { "@id": `${baseUrl}/#organization` },
      },
      breadcrumb: [
        { name: "Home", item: baseUrl },
        { name: brand.name, item: `${baseUrl}${brand.path}` },
      ],
    });
    articles.forEach((a, i) => {
      for (const field of ["slug", "title", "description"]) {
        if (!a[field]) throw new Error(`lang-article-pages: ${brand.key} article #${i} has no ${field}`);
      }
      const next = articles[(i + 1) % articles.length];
      routes.push({
        path: `${brand.path}/articles/${a.slug}`,
        lang: "ar",
        title: `${a.title} | ${brand.name}`,
        description: a.description,
        body: buildArticleBody(brand, a, next),
        articleLd: true,
        published: LANG_ARTICLES_DATE,
        modified: LANG_ARTICLES_DATE,
        breadcrumb: [
          { name: "Home", item: baseUrl },
          { name: brand.name, item: `${baseUrl}${brand.path}` },
          { name: `مقالات ${brand.name}`, item: `${baseUrl}${brand.path}/articles` },
        ],
      });
    });
  }
  return routes;
}
