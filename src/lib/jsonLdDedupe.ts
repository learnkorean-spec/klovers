/**
 * jsonLdDedupe.ts - one copy of each JSON-LD block per page, not two.
 *
 * scripts/prerender-meta.mjs writes JSON-LD into the static HTML so that
 * crawlers which never run JavaScript (GPTBot, ClaudeBot, PerplexityBot) can
 * read it. Many pages ALSO append their own block in a useEffect, always with
 * an id (faq-jsonld, blog-jsonld, about-schema, ...). Without this module a
 * browser - and Googlebot, which renders - ends up with both: two FAQPage
 * blocks on a blog post, two EducationalOrganization blocks on the homepage
 * (GEO audit, 25 Sep 2026). Google reports duplicate FAQPage as an error.
 *
 * Rule: a block WITH an id belongs to the running app and wins. A block
 * WITHOUT an id came from the static HTML; it is removed as soon as the app
 * adds a block that declares any of the same @types. Static blocks the app
 * does not replace (BreadcrumbList on most routes, for example) are kept.
 */

const SELECTOR = 'script[type="application/ld+json"]';

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const t = obj["@type"];
  if (typeof t === "string") out.add(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
  if (obj["@graph"]) collectTypes(obj["@graph"], out);
}

/** The top-level @types a JSON-LD script declares (empty if unparseable). */
export function jsonLdTypes(el: Element): Set<string> {
  const out = new Set<string>();
  try {
    collectTypes(JSON.parse(el.textContent || ""), out);
  } catch {
    /* empty or invalid JSON: declares nothing */
  }
  return out;
}

/** Remove static (id-less) JSON-LD blocks whose @type the app now provides. */
export function dedupeJsonLd(root: ParentNode = document): number {
  const scripts = Array.from(root.querySelectorAll(SELECTOR));
  const appTypes = new Set<string>();
  for (const s of scripts) {
    if (s.id) jsonLdTypes(s).forEach((t) => appTypes.add(t));
  }
  if (!appTypes.size) return 0;
  let removed = 0;
  for (const s of scripts) {
    if (s.id) continue;
    const types = jsonLdTypes(s);
    if ([...types].some((t) => appTypes.has(t))) {
      s.remove();
      removed++;
    }
  }
  return removed;
}

/** Run once now and again whenever the app adds or fills a JSON-LD block. */
export function installJsonLdDedupe(): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  dedupeJsonLd();
  // subtree + characterData: several pages append an empty <script> first and
  // set its textContent afterwards, so the types only exist after that write.
  new MutationObserver(() => dedupeJsonLd()).observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
