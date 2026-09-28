import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import FinalCTA from "@/components/FinalCTA";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DRAMA_LINES,
  FEATURED_PREFERENCE,
  QUIZ,
  SPEAK_PHRASES,
  UNTRANSLATABLE,
  stageForSlug,
  type StageId,
} from "@/constants/blogJourney";
import { baseSlug } from "@/lib/articleVocab";
import JournalHero from "@/components/journal/JournalHero";
import MyJourney from "@/components/journal/MyJourney";
import JourneyStage from "@/components/journal/JourneyStage";
import { WordStories, DramaLines, SpeakPhrases, EraStrip } from "@/components/journal/StageBlocks";
import MiniQuiz from "@/components/journal/MiniQuiz";
import AllArticles, { type ArticleFilter } from "@/components/journal/AllArticles";
import JourneyMilestone from "@/components/journal/JourneyMilestone";
import { ArticleCard, Reveal, type JournalPost } from "@/components/journal/shared";

/**
 * /blog — the Klovers Journal.
 *
 * Same data as before (published blog_posts in the reader's language, one
 * query), laid out as a journey: hero + featured story → My Korea journey →
 * six numbered stops → the full library → FinalCTA. The journey is a
 * discovery layer on top of the library, never a replacement for it: every
 * article is still one search or one filter away in "The journey library".
 *
 * SEO is unchanged in kind: the canonical, the BreadcrumbList, and the
 * prerendered crawlable article list (scripts/prerender-meta.mjs writes it
 * into #root; createRoot replaces it on mount) all still apply.
 */

const COLUMNS =
  "id, title, slug, description, keywords, article_type, hero_image, hero_alt, lang, published_at, created_at, featured";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const BlogPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useSEO({
    title: isAr ? "مجلة كلوفرز: كوريا واللغة الكورية" : "Klovers Journal: Discover Korea, Learn Korean",
    description: isAr
      ? "مقالات وكلمات وقصص وتجارب عن كوريا واللغة الكورية بالعربية، في رحلة من ست محطات مع كلوفرز."
      : "Articles, words, stories and experiences about Korea and the Korean language — a six-stop journey with Klovers.",
    canonical: "https://kloversegy.com/blog",
  });

  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ArticleFilter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(COLUMNS)
        .eq("published", true)
        .eq("lang", language)
        .order("published_at", { ascending: false })
        .limit(300);
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
      } else {
        setFetchError(null);
        setPosts((data as JournalPost[]) || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // BreadcrumbList JSON-LD for the listing page, in the page's own language:
  // /blog is English, /ar/blog Arabic (28 Sep 2026, one language per page).
  useEffect(() => {
    const el = document.createElement("script");
    el.id = "blog-list-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: isAr
        ? [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://kloversegy.com/ar" },
            { "@type": "ListItem", position: 2, name: "المجلة", item: "https://kloversegy.com/ar/blog" },
          ]
        : [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://kloversegy.com/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://kloversegy.com/blog" },
          ],
    });
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [isAr]);

  const bySlugBase = useMemo(() => new Map(posts.map((p) => [baseSlug(p.slug), p])), [posts]);
  const resolve = useCallback((base: string) => bySlugBase.get(base)?.slug ?? null, [bySlugBase]);

  const featured = useMemo(() => {
    for (const b of FEATURED_PREFERENCE) {
      const p = bySlugBase.get(b);
      if (p) return p;
    }
    return posts.find((p) => p.featured) ?? posts[0] ?? null;
  }, [posts, bySlugBase]);

  const byStage = useMemo(() => {
    const m: Record<StageId, JournalPost[]> = { discover: [], understand: [], experience: [], drama: [], speak: [], test: [] };
    posts.forEach((p) => m[stageForSlug(p.slug)].push(p));
    return m;
  }, [posts]);
  const pick = (id: StageId, n: number) => byStage[id].filter((p) => p.id !== featured?.id).slice(0, n);

  const scrollToId = useCallback((elId: string) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    // Move focus with the view, so keyboard and screen-reader users land there too.
    const heading = el.querySelector<HTMLElement>("h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }, []);
  const goToStage = useCallback((id: StageId) => scrollToId(`stage-${id}`), [scrollToId]);
  const seeAll = useCallback(
    (id: StageId) => {
      setFilter(id);
      scrollToId("all-articles");
    },
    [scrollToId],
  );

  // Deep links from articles ("/blog#stage-test") land on their stop once the
  // posts, and so the stage content, are on the page.
  const { hash } = useLocation();
  useEffect(() => {
    if (loading || !hash) return;
    const id = decodeURIComponent(hash.slice(1));
    if (!/^(stage-[a-z]+|all-articles|my-journey)$/.test(id)) return;
    const t = window.setTimeout(() => scrollToId(id), 50);
    return () => window.clearTimeout(t);
  }, [loading, hash, scrollToId]);

  const discover = pick("discover", 5);
  const understand = pick("understand", 3);
  const experience = pick("experience", 4);
  const drama = pick("drama", 3);
  const speak = pick("speak", 3);
  const study = pick("test", 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center space-y-4 px-4 pb-20 pt-32 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="font-semibold text-foreground">{isAr ? "تعذّر تحميل المقالات" : "Couldn't load articles"}</h1>
            <p className="max-w-xs text-sm text-muted-foreground">{isAr ? "حدث خطأ مؤقت في الاتصال. تُرجى إعادة المحاولة بعد قليل." : "A temporary connection problem. Please try again shortly."}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              {isAr ? "إعادة المحاولة" : "Try again"}
            </Button>
          </div>
        ) : (
          <>
            <JournalHero
              isAr={isAr}
              featured={featured}
              totalPosts={posts.length}
              loading={loading}
              onStart={() => goToStage("discover")}
              onBrowse={() => scrollToId("all-articles")}
            />

            <MyJourney isAr={isAr} posts={posts} onGoToStage={goToStage} />

            {/* 01 · Discover — photo mosaic: one lead, four compact. */}
            <JourneyStage id="discover" isAr={isAr} count={byStage.discover.length} onSeeAll={seeAll}>
              {discover.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                  <Reveal>
                    <ArticleCard post={discover[0]} isAr={isAr} />
                  </Reveal>
                  <ul className="grid content-start gap-2">
                    {discover.slice(1).map((p, i) => (
                      <li key={p.id}>
                        <Reveal delay={i * 60}>
                          <ArticleCard post={p} variant="compact" isAr={isAr} />
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <EraStrip isAr={isAr} />
            </JourneyStage>

            {/* 02 · Understand — the untranslatable words, on Charcoal. */}
            <JourneyStage id="understand" isAr={isAr} tone="dark" count={byStage.understand.length} onSeeAll={seeAll}>
              <WordStories words={UNTRANSLATABLE} isAr={isAr} resolve={resolve} />
              {understand.length > 0 && (
                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {understand.map((p) => (
                    <li key={p.id}>
                      <ArticleCard post={p} isAr={isAr} />
                    </li>
                  ))}
                </ul>
              )}
            </JourneyStage>

            {/* 03 · Experience — postcards from an ordinary day. */}
            <JourneyStage id="experience" isAr={isAr} count={byStage.experience.length} onSeeAll={seeAll}>
              {experience.length > 0 && (
                <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
                  {experience.map((p, i) => (
                    <li key={p.id} className={i % 2 ? "lg:mt-10" : ""}>
                      <Reveal delay={i * 60}>
                        <ArticleCard post={p} variant="postcard" isAr={isAr} />
                      </Reveal>
                    </li>
                  ))}
                </ul>
              )}
            </JourneyStage>

            {/* 04 · Drama — scenes with subtitles, on Charcoal. */}
            <JourneyStage id="drama" isAr={isAr} tone="dark" count={byStage.drama.length} onSeeAll={seeAll}>
              <DramaLines lines={DRAMA_LINES} isAr={isAr} resolve={resolve} />
              {drama.length > 0 && (
                <ul className="mt-8 grid gap-2 rounded-3xl bg-card p-2 md:grid-cols-3">
                  {drama.map((p) => (
                    <li key={p.id}>
                      <ArticleCard post={p} variant="compact" isAr={isAr} />
                    </li>
                  ))}
                </ul>
              )}
            </JourneyStage>

            {/* 05 · Speak — a conversation. */}
            <JourneyStage id="speak" isAr={isAr} tone="muted" count={byStage.speak.length} onSeeAll={seeAll}>
              <SpeakPhrases phrases={SPEAK_PHRASES} isAr={isAr} resolve={resolve} />
              {speak.length > 0 && (
                <ul className="mt-8 grid gap-2 rounded-3xl border border-border bg-background p-2 md:grid-cols-3">
                  {speak.map((p) => (
                    <li key={p.id}>
                      <ArticleCard post={p} variant="compact" isAr={isAr} />
                    </li>
                  ))}
                </ul>
              )}
            </JourneyStage>

            {/* 06 · Test yourself — the quiz, with study guides beside it. */}
            <JourneyStage id="test" isAr={isAr} count={byStage.test.length} onSeeAll={seeAll}>
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <MiniQuiz questions={QUIZ} isAr={isAr} />
                {study.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold text-charcoal/70 dark:text-foreground/70">{isAr ? "استعداد للخطوة التالية" : "Ready for the next step"}</h3>
                    <ul className="grid gap-2">
                      {study.map((p) => (
                        <li key={p.id}>
                          <ArticleCard post={p} variant="compact" isAr={isAr} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </JourneyStage>

            <AllArticles posts={posts} loading={loading} isAr={isAr} filter={filter} onFilter={setFilter} />

            <JourneyMilestone isAr={isAr} onGoToStage={goToStage} />

            <FinalCTA />
          </>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default BlogPage;
