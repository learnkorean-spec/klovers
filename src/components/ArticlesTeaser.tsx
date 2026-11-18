/**
 * Article block for the Voca (English) and Buda (Hungarian) landing pages,
 * 18 Nov 2026. Reads only the light title list (src/content/articleTitles.ts,
 * generated from the article files) so the landing pages do not ship every
 * article body; the full library is lazy-loaded on /…/articles.
 */
import { Link } from "react-router-dom";
import { ARTICLE_TITLES } from "@/content/articleTitles";

interface Props {
  path: "/learn-english" | "/learn-hungarian";
  ink: string;
  paper: string;
  isAr: boolean;
  langAr: string;
  langEn: string;
}

const ArticlesTeaser = ({ path, ink, paper, isAr, langAr, langEn }: Props) => {
  const list = ARTICLE_TITLES[path] ?? [];
  if (!list.length) return null;
  return (
    <section id="articles" className="py-20 border-b scroll-mt-24" style={{ backgroundColor: paper }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: ink }}>
            {isAr ? `مقالات لتعلّم ${langAr}` : `Articles on learning ${langEn}`}
          </h2>
          <Link to={`${path}/articles`} className="font-semibold underline" style={{ color: ink }}>
            {isAr ? `كل المقالات (${list.length})` : `All ${list.length} articles, in Arabic`}
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3" dir="rtl" lang="ar">
          {list.slice(0, 3).map((a) => (
            <Link
              key={a.slug}
              to={`${path}/articles/${a.slug}`}
              className="rounded-2xl border-2 bg-white p-5 transition hover:-translate-y-0.5"
              style={{ borderColor: ink }}
            >
              <h3 className="text-lg font-bold leading-snug" style={{ color: ink }}>{a.title}</h3>
              <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{a.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticlesTeaser;
