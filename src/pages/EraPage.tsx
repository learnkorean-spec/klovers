import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { ERAS, getEra } from "@/constants/eras";

// Social scrapers (WhatsApp, Facebook, Twitter) don't reliably render SVG, so
// the one era whose on-page image is an SVG (before-korea) gets a PNG here
// instead. Kept in step with the "image" field of the /journey/before-korea
// entry in scripts/prerender-meta.mjs's MARKETING_ROUTES.
const OG_IMAGE_OVERRIDES: Partial<Record<string, string>> = {
  "before-korea": "https://kloversegy.com/assets/eras/gojoseon-og.png",
};

/**
 * One station of the "journey through Korea's time" — /journey/:eraId.
 *
 * All copy lives in src/constants/eras.ts; this page only lays it out. It is
 * the destination of the era links in components/journal/StageBlocks.tsx.
 *
 * Related articles come from the era's `posts` list, which only ever holds
 * blog posts already verified live in `blog_posts`. An era with no such post
 * simply shows no articles block rather than a promise it cannot keep.
 *
 * No click tracking on purpose: the only existing helper that could log it,
 * logLeadEvent, mirrors every call to Meta Pixel / GA4 as a Lead conversion,
 * and a station click is not a lead. Add a pixel-free logger (see
 * logEngagementEvent in src/lib/leadTracking.ts) before instrumenting this.
 *
 * Arabic copy addresses the reader in neutral MSA: verbal nouns (تعلُّم،
 * بدء، قراءة), never a masculine or feminine imperative.
 */

const EraPage = () => {
  const { eraId } = useParams<{ eraId: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const era = getEra(eraId);

  useSEO({
    // useSEO appends " | Klovers" itself.
    title: era ? (isAr ? era.titleAr : era.titleEn) : "Journey through Korea's time",
    description: era ? (isAr ? era.metaDescAr : era.metaDescEn) : "A journey through Korea's history and culture, one era at a time.",
    canonical: era ? `https://kloversegy.com/journey/${era.id}` : undefined,
    ogImage: era
      ? OG_IMAGE_OVERRIDES[era.id] ?? (era.image ? `https://kloversegy.com${era.image}` : undefined)
      : undefined,
  });

  if (!era) return <Navigate to="/" replace />;

  const index = ERAS.findIndex((e) => e.id === era.id);
  const prev = index > 0 ? ERAS[index - 1] : undefined;
  const next = index < ERAS.length - 1 ? ERAS[index + 1] : undefined;
  const story = isAr ? era.storyAr : era.storyEn;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        {/* ── Where you are on the journey ─────────────────── */}
        <nav
          aria-label={isAr ? "محطات الرحلة" : "Journey stations"}
          className="container mx-auto px-4 max-w-4xl pt-8"
        >
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-x-4 top-[7px] border-t-2 border-dashed border-foreground/20" />
            <ol className="relative grid grid-cols-5 gap-1">
              {ERAS.map((e, i) => {
                const dot =
                  i < index
                    ? "bg-klovers-yellow border-2 border-foreground"
                    : i === index
                      ? "bg-foreground"
                      : "bg-background border-2 border-foreground/25";
                return (
                  <li key={e.id} className="flex justify-center">
                    <Link
                      to={`/journey/${e.id}`}
                      aria-current={i === index ? "page" : undefined}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <span className={`h-4 w-4 rounded-full ring-4 ring-background ${dot}`} />
                      <span
                        className={`text-[10px] sm:text-xs leading-tight ${
                          i === index ? "font-extrabold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {isAr ? e.titleAr : e.titleEn}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────── */}
        <section className="container mx-auto px-4 max-w-5xl py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                {isAr ? `المحطة ${index + 1} من ${ERAS.length}` : `Station ${index + 1} of ${ERAS.length}`}
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                {isAr ? era.titleAr : era.titleEn}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3">
                {isAr ? era.datesAr : era.datesEn} · {isAr ? era.lineAr : era.lineEn}
              </p>
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed mt-5">
                {isAr ? era.introAr : era.introEn}
              </p>
            </div>

            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted border border-border">
              {era.image ? (
                <img
                  src={era.image}
                  alt={isAr ? era.altAr : era.altEn}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label={isAr ? era.altAr : era.altEn}
                  className="h-full w-full bg-foreground text-background flex items-center justify-center"
                >
                  <span lang="ko" className="font-display text-5xl md:text-6xl font-extrabold">
                    {era.glyph}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── At a glance ─────────────────────────────────── */}
        <section className="container mx-auto px-4 max-w-5xl pb-10">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-5">
            {isAr ? "العصر في لمحة" : "This era at a glance"}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {era.milestones.map((m) => (
              <div key={m.topEn} className="rounded-2xl bg-card border border-border p-5">
                <p className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
                  {isAr ? m.topAr : m.topEn}
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">{isAr ? m.textAr : m.textEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The story ───────────────────────────────────── */}
        <section className="container mx-auto px-4 max-w-2xl pb-12">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-5">
            {isAr ? "القصة" : "The story"}
          </h2>
          <div className="space-y-4">
            {story.map((paragraph, i) => (
              <p key={i} className="text-base md:text-lg text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ── Related articles (only real, published posts) ─ */}
        {era.posts.length > 0 && (
          <section className="container mx-auto px-4 max-w-5xl pb-12">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-5">
              {isAr ? "مقالات عن هذا العصر" : "Read about this era"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {era.posts.map((post) => (
                <Link
                  key={post.slugEn}
                  to={`/blog/${isAr ? post.slugAr : post.slugEn}`}
                  className="group rounded-2xl overflow-hidden bg-card border border-border flex flex-col transition-colors hover:border-foreground/40"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={post.image}
                      alt={isAr ? post.altAr : post.altEn}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-grow">
                    <h3 className="font-display font-bold text-foreground text-base leading-snug">
                      {isAr ? post.titleAr : post.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? post.blurbAr : post.blurbEn}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-foreground pt-1">
                      {isAr ? "قراءة المقال" : "Read more"}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Words from this era ─────────────────────────── */}
        <section className="container mx-auto px-4 max-w-5xl pb-12">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-5">
            {isAr ? "كلمات من هذا العصر" : "Words from this era"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {era.words.map((w) => (
              <div key={w.ko} className="rounded-2xl bg-card border border-border p-5">
                <p lang="ko" className="text-3xl font-extrabold text-foreground">
                  {w.ko}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? w.romAr : w.rom} · {isAr ? w.ar : w.en}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Call to action ──────────────────────────────── */}
        <section className="container mx-auto px-4 max-w-5xl pb-12">
          <div className="rounded-3xl bg-foreground text-background p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold">
                {isAr ? "تعلُّم هذه الكلمات في حصة مباشرة" : "Learn these words in a live class"}
              </h2>
              <p className="text-sm md:text-base text-background/75 mt-2">
                {isAr
                  ? "كل كلمة في الحصة تأتي من مكان حقيقي وزمن حقيقي."
                  : "Every word you learn comes from a real place and a real time."}
              </p>
            </div>
            <Link
              to="/free-trial"
              className="inline-flex items-center justify-center rounded-xl bg-klovers-yellow text-charcoal font-bold px-6 py-3 text-base transition-opacity hover:opacity-90"
            >
              {isAr ? "بدء التجربة المجانية" : "Start Free Trial"}
            </Link>
          </div>
        </section>

        {/* ── Previous / next station ─────────────────────── */}
        <section className="container mx-auto px-4 max-w-5xl pb-20">
          <div className="flex items-center justify-between gap-4">
            {prev ? (
              <Link to={`/journey/${prev.id}`} className="group flex items-center gap-3">
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                <span>
                  <span className="block text-xs text-muted-foreground">
                    {isAr ? "المحطة السابقة" : "Previous station"}
                  </span>
                  <span className="block font-display text-lg font-extrabold text-foreground">
                    {isAr ? prev.titleAr : prev.titleEn}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/journey/${next.id}`} className="group flex items-center gap-3 text-end">
                <span>
                  <span className="block text-xs text-muted-foreground">
                    {isAr ? "المحطة التالية" : "Next station"}
                  </span>
                  <span className="block font-display text-lg font-extrabold text-foreground">
                    {isAr ? next.titleAr : next.titleEn}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EraPage;
