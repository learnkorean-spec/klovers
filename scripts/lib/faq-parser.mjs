/**
 * faq-parser.mjs — extracts FAQ question/answer pairs from an article's
 * markdown `content`, and builds the FAQPage JSON-LD object from them.
 *
 * Shared, byte-for-byte, between scripts/prerender-meta.mjs (build time) and
 * src/pages/BlogPostPage.tsx (browser). Before this module existed, the two
 * had separate copies of this logic that were free to drift; extracting it
 * once here is what keeps the prerendered FAQPage and the client-side one
 * agreeing with each other.
 *
 * The content generator has used two templates over time, and both are still
 * live in the catalogue (verified against all 200 published articles,
 * 2026-08-28):
 *
 *   - `### question` on its own line, followed by one or more paragraphs of
 *     answer text (64 articles: 46 Arabic, 18 English).
 *   - `**question?** answer text` — question and answer share one paragraph,
 *     bolded question first (80 articles: 40 Arabic, 40 English).
 *
 * ...crossed with two heading spellings per language — the second spelling
 * in each language is what the previous version of this parser (a private
 * copy inside BlogPostPage.tsx) did not know about, and it accounted for
 * exactly the gap between that parser's measured coverage and the site's
 * real FAQ coverage:
 *
 *   EN: "Frequently Asked Questions" (pairs with the `###` template)
 *       "Quick FAQ" (pairs with the `**bold**` template)
 *   AR: "الأسئلة الشائعة" (pairs with the `###` template)
 *       "أسئلة شائعة" — same heading, without the definite article "ال"
 *       (pairs with the `**bold**` template)
 *
 * Total live coverage with both variants: 86/100 Arabic, 58/100 English.
 */

const FAQ_SECTION_RE =
  /##\s+(?:Frequently Asked Questions|Quick FAQ|الأسئلة الشائعة|أسئلة شائعة)\s*\n([\s\S]*?)(?=\n##\s|$)/i;

const H3_QA_RE = /###\s+(.+?)\n+([\s\S]*?)(?=\n###\s|\n##\s|$)/g;

const BOLD_QA_RE = /\*\*(.+?)\*\*[ \t]*([^\n]*(?:\n(?!\n|\*\*)[^\n]*)*)/g;

const MAX_ANSWER_LENGTH = 800;

/**
 * Extract `{ question, answer }` pairs from one article's markdown content.
 * Returns `[]` when the article has no FAQ section at all, or when it has
 * one but the parser recognizes neither Q&A template inside it — never a
 * guess, and never partial/empty entries.
 */
export function extractFaqEntries(content) {
  if (!content) return [];

  const sectionMatch = content.match(FAQ_SECTION_RE);
  if (!sectionMatch) return [];
  const body = sectionMatch[1];

  const fromPattern = (re) => {
    re.lastIndex = 0;
    const pairs = [];
    let m;
    while ((m = re.exec(body)) !== null) {
      const question = m[1].trim();
      const answer = m[2].trim().replace(/\n+/g, " ").slice(0, MAX_ANSWER_LENGTH);
      if (question && answer) pairs.push({ question, answer });
    }
    return pairs;
  };

  const h3Pairs = fromPattern(H3_QA_RE);
  if (h3Pairs.length > 0) return h3Pairs;

  return fromPattern(BOLD_QA_RE);
}

/**
 * Build the FAQPage JSON-LD object for an article, or `null` when it has no
 * genuine FAQ section — callers must never emit an empty/invented FAQPage.
 */
export function buildFaqJsonLd(content) {
  const entries = extractFaqEntries(content);
  if (entries.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}
