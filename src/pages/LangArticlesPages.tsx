/**
 * Article libraries for the sibling language doors (18 Nov 2026, Re's request:
 * "maktub has 18 articles, add the same in the others and make the three on the
 * same level"). maktub keeps its own site (mkatub.kloversegy.com/articles); Voca
 * (English) and Buda (Hungarian) get their library here, under their own page
 * path, so every nav item stays the door's own content and never links out to
 * the Korean blog (see the header notes in LearnEnglishPage / LearnHungarianPage).
 *
 * Articles are written in Arabic for Arabic-speaking learners, so the reading
 * column is always right-to-left whatever the site language is.
 */
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { VOCA_ARTICLES, type LangArticle } from "@/content/vocaArticles";
import { BUDA_ARTICLES } from "@/content/budaArticles";

interface Brand {
  key: "voca" | "buda";
  name: string;
  langAr: string;
  langEn: string;
  path: string;
  ink: string;
  paper: string;
  signal: string;
  signalText: string;
  articles: LangArticle[];
}

export const VOCA_BRAND: Brand = {
  key: "voca",
  name: "Voca",
  langAr: "الإنجليزية",
  langEn: "English",
  path: "/learn-english",
  ink: "#650000",
  paper: "#FFF9EC",
  signal: "#FFFF00",
  signalText: "#111111",
  articles: VOCA_ARTICLES,
};

export const BUDA_BRAND: Brand = {
  key: "buda",
  name: "Buda",
  langAr: "المجرية",
  langEn: "Hungarian",
  path: "/learn-hungarian",
  ink: "#0C1D2E",
  paper: "#F5F0E6",
  signal: "#D9A648",
  signalText: "#111111",
  articles: BUDA_ARTICLES,
};

const BASE = "https://kloversegy.com";

const BrandBar = ({ brand }: { brand: Brand }) => (
  <header className="sticky top-0 z-40 border-b border-white/10 text-white" style={{ backgroundColor: brand.ink }}>
    <div className="container mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
      <Link to={brand.path} className="text-xl font-extrabold tracking-tight">
        {brand.name}
      </Link>
      <nav className="flex items-center gap-4 text-sm" aria-label="Articles">
        <Link to={`${brand.path}/articles`} className="text-white/80 hover:text-white">
          المقالات
        </Link>
        <Button size="sm" asChild className="rounded-full font-semibold" style={{ backgroundColor: brand.signal, color: brand.signalText }}>
          <Link to={`${brand.path}#trial`}>احجز حصة تجريبية</Link>
        </Button>
      </nav>
    </div>
  </header>
);

const ArticlesIndex = ({ brand }: { brand: Brand }) => {
  useSEO({
    title: `مقالات لتعلّم ${brand.langAr} بشرح بالعربية | ${brand.name}`,
    description: `${brand.articles.length} مقالًا عمليًا لتعلّم ${brand.langAr}: البداية من الصفر، النطق، القواعد، والتعلّم مع مدرّسة.`,
    canonical: `${BASE}${brand.path}/articles`,
  });
  return (
    <div className="min-h-screen bg-background">
      <BrandBar brand={brand} />
      <main id="main-content" dir="rtl" lang="ar">
        <section className="py-16 text-white" style={{ backgroundColor: brand.ink }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <p className="text-sm font-semibold" style={{ color: brand.signal }}>{brand.name}</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">مقالات لتعلّم {brand.langAr}</h1>
            <p className="mt-4 max-w-2xl text-white/80 leading-relaxed">
              {brand.articles.length} مقالًا عمليًا ومكتوبًا للمتعلّم العربي: من أين تبدأ، ما الذي يصعب فعلًا، وكيف تتقدّم بخطوات واقعية.
            </p>
          </div>
        </section>
        <section className="py-14" style={{ backgroundColor: brand.paper }}>
          <div className="container mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.articles.map((a) => (
              <Link
                key={a.slug}
                to={`${brand.path}/articles/${a.slug}`}
                className="flex flex-col rounded-2xl border-2 bg-white p-5 transition hover:-translate-y-0.5"
                style={{ borderColor: brand.ink }}
              >
                <h2 className="text-lg font-bold leading-snug" style={{ color: brand.ink }}>{a.title}</h2>
                <p className="mt-2 flex-1 text-sm text-foreground/70 leading-relaxed">{a.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-foreground/60">
                  <Clock className="h-3.5 w-3.5" /> {a.minutes} دقائق قراءة
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const ArticleView = ({ brand }: { brand: Brand }) => {
  const { slug } = useParams();
  const i = brand.articles.findIndex((a) => a.slug === slug);
  const a = i >= 0 ? brand.articles[i] : undefined;
  useSEO({
    title: a ? `${a.title} | ${brand.name}` : `مقالات ${brand.name}`,
    description: a?.description,
    canonical: `${BASE}${brand.path}/articles${a ? `/${a.slug}` : ""}`,
    type: "article",
    noindex: !a,
  });
  if (!a) {
    return (
      <div className="min-h-screen bg-background">
        <BrandBar brand={brand} />
        <main className="container mx-auto max-w-3xl px-4 py-20 text-center" dir="rtl" lang="ar">
          <h1 className="text-2xl font-bold">لم نجد هذا المقال</h1>
          <Link to={`${brand.path}/articles`} className="mt-6 inline-block underline">كل المقالات</Link>
        </main>
        <Footer />
      </div>
    );
  }
  const next = brand.articles[(i + 1) % brand.articles.length];
  return (
    <div className="min-h-screen bg-background">
      <BrandBar brand={brand} />
      <main id="main-content" dir="rtl" lang="ar">
        <article>
          <header className="py-14 text-white" style={{ backgroundColor: brand.ink }}>
            <div className="container mx-auto max-w-3xl px-4">
              <Link to={`${brand.path}/articles`} className="inline-flex items-center gap-1 text-sm text-white/75 hover:text-white">
                <ArrowRight className="h-4 w-4" /> كل المقالات
              </Link>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight">{a.title}</h1>
              <p className="mt-4 text-white/80 leading-relaxed">{a.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: brand.signal }}>
                <Clock className="h-4 w-4" /> {a.minutes} دقائق قراءة · ريهام الشرقاوي
              </p>
            </div>
          </header>
          <div className="container mx-auto max-w-3xl px-4 py-12">
            {a.sections.map((s, k) => (
              <section key={k} className="mb-10">
                <h2 className="text-2xl font-bold" style={{ color: brand.ink }}>{s.heading}</h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="mt-4 text-lg leading-loose text-foreground/85">{p}</p>
                ))}
              </section>
            ))}
            <div className="mt-12 rounded-2xl p-6 text-white" style={{ backgroundColor: brand.ink }}>
              <p className="text-lg font-bold">جرّب حصة مع ريهام</p>
              <p className="mt-2 text-white/80">حصة تجريبية قصيرة لنعرف مستواك وما تحتاجه فعلًا.</p>
              <Button asChild className="mt-4 rounded-full font-semibold" style={{ backgroundColor: brand.signal, color: brand.signalText }}>
                <Link to={`${brand.path}#trial`}>احجز حصة تجريبية</Link>
              </Button>
            </div>
            <Link
              to={`${brand.path}/articles/${next.slug}`}
              className="mt-8 flex items-center justify-between gap-3 rounded-2xl border-2 p-5"
              style={{ borderColor: brand.ink }}
            >
              <span>
                <span className="block text-xs font-semibold text-foreground/60">المقال التالي</span>
                <span className="font-bold" style={{ color: brand.ink }}>{next.title}</span>
              </span>
              <ArrowLeft className="h-5 w-5 shrink-0" />
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export const VocaArticlesIndexPage = () => <ArticlesIndex brand={VOCA_BRAND} />;
export const VocaArticlePage = () => <ArticleView brand={VOCA_BRAND} />;
export const BudaArticlesIndexPage = () => <ArticlesIndex brand={BUDA_BRAND} />;
export const BudaArticlePage = () => <ArticleView brand={BUDA_BRAND} />;
