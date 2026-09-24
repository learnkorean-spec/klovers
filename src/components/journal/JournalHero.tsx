import { ArrowDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { journey } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { ArticleCard, KlobiFigure, Ko, num, type JournalPost } from "./shared";

/**
 * The editorial hero: one headline, one Korean mark, one story scene, Cluby
 * reading — and directly under it, the featured story, so the first screen has
 * a clear lead instead of three equal cards.
 *
 * The scene is the Culture Street world of the Klovers story
 * (/assets/story/world-culture-street.webp). It replaced the stock hanok
 * photo, which was decoration, not a post cover; post covers are untouched.
 */
export default function JournalHero({
  isAr,
  featured,
  totalPosts,
  loading,
  onStart,
  onBrowse,
}: {
  isAr: boolean;
  featured: JournalPost | null;
  totalPosts: number;
  loading: boolean;
  onStart: () => void;
  onBrowse: () => void;
}) {
  return (
    <section aria-labelledby="journal-title" className="relative overflow-hidden pt-24 pb-10 sm:pt-28 md:pb-16">
      {/* Ghost Hangul: 여정, "journey". Texture only, like FinalCTA's ghost words. */}
      <span
        aria-hidden="true"
        lang="ko"
        className="pointer-events-none absolute bottom-[38%] start-[-1rem] hidden select-none font-ko-hand text-[13rem] leading-none text-foreground/[0.05] lg:block"
      >
        여정
      </span>

      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {isAr ? "مجلة Klovers" : "The Klovers Journal"}
              <span aria-hidden="true" className="text-foreground/40">·</span>
              <Ko className="font-medium">한국 여행</Ko>
            </p>
            <h1 id="journal-title" className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {isAr ? (
                <>
                  اكتشف كوريا{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 dark:text-primary">خطوة بخطوة</span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1 h-3 rounded-sm bg-primary dark:hidden sm:h-4" />
                  </span>
                </>
              ) : (
                <>
                  Discover Korea,{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 dark:text-primary">step by step</span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1 h-3 rounded-sm bg-primary dark:hidden sm:h-4" />
                  </span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {isAr
                ? "مقالات، كلمات، قصص وتجارب تأخذك إلى قلب اللغة والثقافة الكورية."
                : "Articles, words, stories and experiences that take you into the heart of Korean language and culture."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-full px-7 text-base font-bold"
                onClick={() => {
                  journey.start();
                  trackJourney("blog_journey_started", { from: "hero" });
                  onStart();
                }}
              >
                {isAr ? "ابدأ رحلتك" : "Start your journey"}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full border-foreground/30 bg-card px-7 text-base font-bold" onClick={onBrowse}>
                {isAr ? "استكشف المقالات" : "Browse articles"}
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[
                { v: loading ? "—" : num(totalPosts, isAr), l: isAr ? "مقالة" : "articles" },
                { v: num(6, isAr), l: isAr ? "محطات" : "stops" },
                { v: isAr ? "عربي" : "AR · EN", l: isAr ? "بلغتك" : "in your language" },
              ].map((s) => (
                <div key={s.l} className="flex items-baseline gap-1.5">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-2xl font-extrabold text-foreground">{s.v}</dd>
                  <dd aria-hidden="true" className="text-muted-foreground">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative rotate-[1.5deg] overflow-hidden rounded-[2rem] border-4 border-card shadow-xl">
              <img
                src="/assets/story/world-culture-street.webp"
                alt={isAr ? "شارع الثقافة الكورية من عالم قصة Klovers" : "Culture Street, a Korean street from the Klovers story world"}
                width={1600}
                height={900}
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            {/* The seal: a stamp-like Hangul mark, the one Korean graphic element. */}
            <div
              aria-hidden="true"
              className="absolute -top-4 start-4 grid h-16 w-16 -rotate-6 place-items-center rounded-xl border-2 border-charcoal bg-primary font-ko text-2xl font-black text-charcoal shadow-md"
              lang="ko"
            >
              한국
            </div>
            <div className="absolute -bottom-6 end-2 flex items-end gap-2 sm:end-6">
              <p className="mb-8 hidden max-w-[11rem] rounded-2xl rounded-ee-sm bg-card px-3.5 py-2 text-sm font-medium leading-snug text-foreground shadow-md sm:block">
                {isAr ? "أنا كلوبي، رفيقك في الرحلة!" : "I'm Cluby — your companion on this trip!"}
              </p>
              <div className="rounded-full border border-border bg-card p-2 shadow-lg journal-klobi-enter">
                <KlobiFigure pose="reading" className="h-20 w-20 sm:h-24 sm:w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-20">
          {loading ? (
            <div className="grid overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-[1.25fr_1fr]" aria-hidden="true">
              <div className="aspect-[16/10] animate-pulse bg-muted" />
              <div className="space-y-4 p-8">
                <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ) : (
            featured && <ArticleCard post={featured} variant="featured" isAr={isAr} priority headingLevel={2} />
          )}
        </div>
      </div>
    </section>
  );
}
