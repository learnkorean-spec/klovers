import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { FEATURED_PREFERENCE, STAGES, UNTRANSLATABLE } from "@/constants/blogJourney";
import { baseSlug } from "@/lib/articleVocab";
import { trackJourney } from "@/lib/journeyAnalytics";
import { ArticleCard, KlobiFigure, Ko, type JournalPost } from "@/components/journal/shared";

/**
 * The homepage window onto the Klovers Journal (/blog).
 *
 * Was: three equal cards ranked by seo_score, each showing "1 min" (reading
 * time computed from the 150-character description, not the article) and an
 * English date on the Arabic page. Now it uses the Journal's own pieces, so
 * the homepage and /blog read as one product:
 *   - one lead story (same FEATURED_PREFERENCE as /blog) + three newest;
 *   - the six stops as doors straight into /blog#stage-…;
 *   - one untranslatable word a day, as a taste of the learning layer.
 * Reading time and word counts come from blogLearningMeta, same as /blog.
 */

const COLUMNS =
  "id, title, slug, description, keywords, article_type, hero_image, hero_alt, lang, published_at, created_at, featured";

const HomeBlogSection = () => {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const isAr = language === "ar";
  const L = isAr ? "ar" : "en";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("blog_posts")
      .select(COLUMNS)
      .eq("published", true)
      .eq("lang", language)
      .order("published_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (cancelled) return;
        setPosts((data as JournalPost[]) || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const { lead, rest } = useMemo(() => {
    const bySlug = new Map(posts.map((p) => [baseSlug(p.slug), p]));
    const lead = FEATURED_PREFERENCE.map((b) => bySlug.get(b)).find(Boolean) ?? posts.find((p) => p.featured) ?? posts[0] ?? null;
    return { lead, rest: posts.filter((p) => p.id !== lead?.id).slice(0, 3) };
  }, [posts]);

  // Same word for everyone on a given day; rotates through the series.
  const word = UNTRANSLATABLE[Math.floor(Date.now() / 86_400_000) % UNTRANSLATABLE.length];

  if (!loading && posts.length === 0) return null;

  return (
    <section aria-labelledby="home-journal-title" className="bg-background py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {isAr ? "مجلة Klovers" : "The Klovers Journal"}
              <span aria-hidden="true" className="text-foreground/40">·</span>
              <Ko className="font-medium">한국 여행</Ko>
            </p>
            <h2 id="home-journal-title" className="font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
              {isAr ? "رحلة في كوريا، مقالة بعد مقالة" : "A journey through Korea, one story at a time"}
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              {isAr
                ? "ثقافة، كلمات لا تُترجم، جمل الدراما وعبارات يومية — وكل قراءة تقرّبك من الكورية."
                : "Culture, untranslatable words, drama lines and everyday phrases — every read moves your Korean forward."}
            </p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 rounded-full px-7 font-bold">
            <Link to="/blog" onClick={() => trackJourney("blog_journey_started", { from: "home_section" })}>
              {isAr ? "ابدأ رحلتك" : "Start your journey"}
              <Arrow className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]" aria-hidden="true">
            <div className="h-80 animate-pulse rounded-[2rem] bg-muted" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {lead && <ArticleCard post={lead} variant="featured" isAr={isAr} stacked />}
            <div className="flex flex-col gap-4">
              <ul className="grid gap-1 rounded-3xl border border-border bg-card p-2">
                {rest.map((p) => (
                  <li key={p.id}>
                    <ArticleCard post={p} variant="compact" isAr={isAr} />
                  </li>
                ))}
              </ul>

              {/* Word of the day — the learning layer in one card. */}
              <Link
                to="/blog#stage-understand"
                className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-charcoal p-5 text-ivory transition-colors hover:bg-charcoal/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Ko className="shrink-0 text-5xl font-black text-primary">{word.ko}</Ko>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-primary">{isAr ? "كلمة اليوم · لا تُترجم" : "Word of the day · untranslatable"}</span>
                  <span className="mt-1 block font-display text-base font-extrabold leading-snug">{word.hook[L]}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-ivory/80 underline decoration-primary underline-offset-4">
                    {isAr ? "اكتشف المعنى" : "Discover the meaning"}
                  </span>
                </span>
                <span className="hidden rounded-full bg-ivory p-1 sm:block" aria-hidden="true">
                  <KlobiFigure pose="cards" className="h-12 w-12" />
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* The six stops, as doors into the journey. */}
        <nav aria-label={isAr ? "محطات الرحلة" : "Journey stops"} className="mt-8">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/blog#stage-${s.id}`}
                  className="flex min-h-[56px] items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <KloverIcon name={s.icon} className="h-9 w-9" />
                  <span className="min-w-0">
                    <span className="block font-display text-xs font-extrabold text-muted-foreground">{s.num}</span>
                    <span className="block text-sm font-bold leading-tight text-foreground">{s.title[L]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
};

export default HomeBlogSection;
