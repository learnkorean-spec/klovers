import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  VOCA_INK,
  VOCA_PAPER,
  VOCA_SIGNAL,
  VocaSiteHeader,
  VocaStudentFooter,
  vocaPaths,
} from "@/components/voca/VocaBrand";

/**
 * /learn-english/articles — Voca's own article list (Re, 23 Oct 2026).
 *
 * Voca articles are ordinary blog_posts rows with brand = 'voca', so each one
 * keeps its /blog/:slug page, its prerendered HTML and its sitemap entry. The
 * Korean Journal (/blog) filters them out, and this page lists only them, so
 * the Voca header's "Articles" tab never leads into Klovers' Korean content.
 *
 * In the reader's language, like /blog: English readers see the English
 * articles, Arabic readers the Arabic ones. A failed read says so rather than
 * rendering as "no articles yet", which would look identical.
 */

interface VocaPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  hero_image: string | null;
  hero_alt: string | null;
  published_at: string | null;
}

const VocaArticlesPage = () => {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const paths = vocaPaths(isAr);

  useSEO({
    title: tr("English articles, explained in Arabic — Voca", "مقالات لتعلّم الإنجليزية بشرح بالعربية — Voca"),
    description: tr(
      "Short, practical English lessons in article form from Voca: grammar, vocabulary and real conversation, explained for Arabic speakers.",
      "مقالات قصيرة وعملية لتعلّم الإنجليزية من Voca: القواعد والمفردات والمحادثة الحقيقية، بشرح بالعربية.",
    ),
    canonical: "https://kloversegy.com/learn-english/articles",
  });

  const [posts, setPosts] = useState<VocaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error: err } = await supabase
        .from("blog_posts")
        .select("id, title, slug, description, hero_image, hero_alt, published_at")
        .eq("published", true)
        .eq("brand", "voca")
        .eq("lang", language)
        .order("published_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (err) {
        console.error("[voca-articles]", err);
        setError(err.message);
      } else {
        setError(null);
        setPosts((data as VocaPost[]) || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(isAr ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "";

  return (
    <div className="min-h-screen flex flex-col" dir={isAr ? "rtl" : "ltr"} style={{ backgroundColor: VOCA_PAPER }}>
      <VocaSiteHeader isAr={isAr} tr={tr} toggleLanguage={toggleLanguage} />

      <main id="main-content" className="flex-1">
        <section className="text-white" style={{ backgroundColor: VOCA_INK }}>
          <div className="container mx-auto max-w-5xl px-4 py-14">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: VOCA_SIGNAL }}>
              {tr("Voca articles", "مقالات Voca")}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              {tr("English, one clear idea at a time.", "الإنجليزية، فكرة واضحة في كل مرة.")}
            </h1>
            <p className="mt-3 max-w-2xl text-white/80">
              {tr(
                "Grammar, vocabulary and real-life English, explained for Arabic speakers.",
                "القواعد والمفردات والإنجليزية في الحياة الحقيقية، بشرح بالعربية.",
              )}
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: VOCA_INK }} />
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {tr("We could not load the articles. Please try again.", "تعذّر تحميل المقالات. يُرجى المحاولة مرة أخرى.")}
            </p>
          ) : posts.length === 0 ? (
            <div className="mx-auto max-w-xl py-12 text-center">
              <h2 className="text-xl font-bold" style={{ color: VOCA_INK }}>
                {tr("The first articles are on their way.", "المقالات الأولى في الطريق.")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {tr(
                  "In the meantime, a free trial lesson is the fastest way to start.",
                  "وحتى ذلك الحين، الحصة التجريبية المجانية أسرع طريقة للبدء.",
                )}
              </p>
              <Button asChild className="mt-6 rounded-full font-semibold" style={{ backgroundColor: VOCA_INK, color: "#ffffff" }}>
                <a href={`${paths.home}#trial`}>{tr("Book a free trial", "احجز حصة تجريبية مجانية")}</a>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md"
                    style={{ borderColor: "#ecddc4" }}
                  >
                    {p.hero_image && (
                      <img
                        src={p.hero_image}
                        alt={p.hero_alt || ""}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="text-lg font-bold leading-snug" style={{ color: VOCA_INK }}>
                        {p.title}
                      </h2>
                      {p.description && <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{p.description}</p>}
                      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                        <span>{fmtDate(p.published_at)}</span>
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: VOCA_INK }}>
                          {tr("Read", "اقرأ")}
                          <ArrowRight className={`h-3.5 w-3.5 ${isAr ? "rotate-180" : ""}`} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <VocaStudentFooter tr={tr} />
    </div>
  );
};

export default VocaArticlesPage;
