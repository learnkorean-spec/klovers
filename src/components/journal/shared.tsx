/**
 * Shared pieces of the Klovers Journal (/blog): the post shape, the reveal
 * hook, Klobi as a guide, compact learning metadata and the article card.
 *
 * Everything here uses the existing palette (Ivory / Charcoal / Yellow tokens),
 * the existing illustrated icon set (KloverIcon), OptimizedImage and lucide —
 * nothing new is introduced into the design system.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, Check, Clock, Languages } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import KloverIcon from "@/components/KloverIcon";
import Korean from "@/components/Korean";
import { cn } from "@/lib/utils";
import { BLOG_LEARNING_META } from "@/constants/blogLearningMeta";
import { STAGE_BY_ID, STAGE_CATEGORY, stageForSlug, type KlobiPose, type StageId } from "@/constants/blogJourney";
import { articleLevel, baseSlug, LEVEL_LABEL, readingMinutes, type ArticleLevel } from "@/lib/articleVocab";
import { journey, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";

export interface JournalPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[] | null;
  article_type: string;
  hero_image: string;
  hero_alt: string | null;
  lang: string;
  published_at: string | null;
  created_at: string;
  featured: boolean | null;
}

export interface PostLearning {
  stage: StageId;
  level: ArticleLevel;
  minutes?: number;
  words?: number;
}

export function learningFor(post: Pick<JournalPost, "slug">): PostLearning {
  const meta = BLOG_LEARNING_META[post.slug];
  return {
    stage: stageForSlug(post.slug),
    level: articleLevel(post.slug),
    minutes: meta ? readingMinutes(meta.w) : undefined,
    words: meta && meta.v > 0 ? meta.v : undefined,
  };
}

/* ─────────────────────────────── useInView ─────────────────────────────── */

/** True once the element has been on screen. One observer, disconnected after. */
export function useInView<T extends Element>(threshold = 0.2): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

/** Soft fade/translate on first view. The CSS no-ops under reduced motion. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  return (
    <div ref={ref} data-shown={seen} className={cn("journal-reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ───────────────────────────── Klobi, the guide ───────────────────────────── */

// The approved 3D Cluby poses (public/assets/cluby). The old flat Klobi
// drawings are retired; every pose now maps to a 3D plush Cluby.
const CLUBY_WAVE = { src: "/assets/cluby/cluby-wave.webp", width: 314, height: 440 };
const CLUBY_STAR = { src: "/assets/cluby/cluby-star.webp", width: 333, height: 440 };
// Cluby reading on a hanok street (Re's image, 25 Sep 2026), cropped square
// for the round guide avatar.
const CLUBY_READING = { src: "/assets/cluby/cluby-reading.webp", width: 480, height: 480 };

const POSE_ART: Record<KlobiPose, { src: string; width: number; height: number }> = {
  wave: CLUBY_WAVE,
  reading: CLUBY_READING,
  cards: CLUBY_STAR,
  headphones: CLUBY_STAR,
  thumbsup: CLUBY_STAR,
};

export function KlobiFigure({ pose, className }: { pose: KlobiPose; className?: string }) {
  const art = POSE_ART[pose];
  return (
    <img
      src={art.src}
      alt=""
      aria-hidden="true"
      width={art.width}
      height={art.height}
      loading="lazy"
      decoding="async"
      className={cn("shrink-0 select-none object-contain", className)}
      draggable={false}
    />
  );
}

/**
 * Klobi with one line of guidance. The line is real text (not aria-hidden) —
 * it tells the reader what to do in this chapter; the drawing is decorative.
 * Sits beside content, never over it.
 */
export function KlobiGuide({
  pose,
  line,
  tone = "light",
  className,
}: {
  pose: KlobiPose;
  line: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} data-shown={seen} className={cn("journal-klobi flex items-end gap-3", className)}>
      <div className={cn("rounded-full p-1.5", tone === "dark" ? "bg-ivory" : "bg-card border border-border")}>
        <KlobiFigure pose={pose} className="h-14 w-14 sm:h-16 sm:w-16" />
      </div>
      <p
        className={cn(
          "relative mb-3 max-w-[16rem] rounded-2xl rounded-es-sm px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm",
          tone === "dark" ? "bg-ivory text-charcoal" : "bg-card text-foreground border border-border",
        )}
      >
        {line}
      </p>
    </div>
  );
}

/* ─────────────────────────────── Metadata ─────────────────────────────── */

const toArDigits = (n: number) => n.toLocaleString("ar-EG");
export const num = (n: number, isAr: boolean) => (isAr ? toArDigits(n) : String(n));

/** Arabic count phrase with correct plural agreement for the common nouns here. */
export function arCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  const d = toArDigits(n);
  return n >= 3 && n <= 10 ? `${d} ${few}` : `${d} ${many}`;
}

export const minutesLabel = (m: number, isAr: boolean) =>
  isAr ? arCount(m, "دقيقة", "دقيقتان", "دقائق", "دقيقة") : `${m} min`;

export const wordsLabel = (w: number, isAr: boolean) =>
  isAr ? arCount(w, "كلمة كورية", "كلمتان كوريتان", "كلمات كورية", "كلمة كورية") : `${w} Korean word${w === 1 ? "" : "s"}`;

/** Compact indicators: time · level · words. Only what exists is shown. */
export function LearningMeta({
  learning,
  isAr,
  tone = "light",
  className,
}: {
  learning: PostLearning;
  isAr: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const muted = tone === "dark" ? "text-ivory/80" : "text-muted-foreground";
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] font-medium", muted, className)}>
      {learning.minutes && (
        <li className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {minutesLabel(learning.minutes, isAr)}
        </li>
      )}
      <li className="inline-flex items-center gap-1">
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", tone === "dark" ? "bg-primary" : "bg-foreground/60")} />
        {LEVEL_LABEL[learning.level][isAr ? "ar" : "en"]}
      </li>
      {learning.words && (
        <li className="inline-flex items-center gap-1">
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          {wordsLabel(learning.words, isAr)}
        </li>
      )}
    </ul>
  );
}

export function CategoryChip({ stage, isAr, tone = "light" }: { stage: StageId; isAr: boolean; tone?: "light" | "dark" | "yellow" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        tone === "dark" && "bg-ivory/10 text-ivory border border-ivory/20",
        tone === "light" && "bg-muted text-foreground border border-border",
        tone === "yellow" && "bg-primary text-charcoal",
      )}
    >
      {STAGE_CATEGORY[stage][isAr ? "ar" : "en"]}
    </span>
  );
}

/* ─────────────────────────────── Bookmark ─────────────────────────────── */

export function BookmarkButton({ slug, title, isAr, className }: { slug: string; title: string; isAr: boolean; className?: string }) {
  const { bookmarks } = useJourneyProgress();
  const on = bookmarks.includes(baseSlug(slug));
  const label = on
    ? isAr ? `إزالة «${title}» من المحفوظات` : `Remove “${title}” from saved`
    : isAr ? `حفظ «${title}» لوقت لاحق` : `Save “${title}” for later`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        journey.toggleBookmark(slug);
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "bg-primary border-charcoal/30 text-charcoal" : "bg-card/95 border-border text-foreground hover:bg-muted",
        className,
      )}
    >
      {on ? <BookmarkCheck className="h-5 w-5" aria-hidden="true" /> : <Bookmark className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

/* ───────────────────────────── Cover fallback ───────────────────────────── */

const STAGE_KO: Record<StageId, string> = {
  discover: "문화",
  understand: "언어",
  experience: "생활",
  drama: "드라마",
  speak: "대화",
  test: "시험",
};

/**
 * What a card shows when its photo is missing or fails to load (34 of 76
 * published hero images are hot-linked Unsplash URLs; see the 2026-09-23
 * handover). The stop's own illustration on a yellow disc, with the stop's
 * Korean word as texture — branded, never the 📖 emoji.
 */
export function CoverFallback({ stage }: { stage: StageId }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-muted">
      <span aria-hidden="true" lang="ko" className="pointer-events-none absolute -bottom-3 end-3 select-none font-ko-hand text-[4.5rem] leading-none text-foreground/[0.08] sm:text-[5.5rem]">
        {STAGE_KO[stage]}
      </span>
      <span aria-hidden="true" className="absolute h-24 w-24 rounded-full bg-primary/30 sm:h-28 sm:w-28" />
      <KloverIcon name={STAGE_BY_ID[stage].icon} className="relative h-14 w-14 sm:h-16 sm:w-16" />
    </div>
  );
}

/* ───────────────────────────── Article card ───────────────────────────── */

type CardVariant = "featured" | "standard" | "compact" | "postcard";

/**
 * One card, four shapes.
 *   featured  — the editorial lead: big image, headline, outcome, CTA.
 *   standard  — image on top, the grid default.
 *   compact   — thumbnail beside title; for lists inside a stage.
 *   postcard  — photo-led, title on a caption band; "Experience Korea".
 * The bookmark is a sibling of the link, not inside it, so it is its own tab
 * stop and never navigates.
 */
export function ArticleCard({
  post,
  variant = "standard",
  isAr,
  priority = false,
  headingLevel = 3,
  stacked = false,
  className,
}: {
  post: JournalPost;
  variant?: CardVariant;
  isAr: boolean;
  priority?: boolean;
  headingLevel?: 2 | 3;
  /** featured only: image above text at every width (for narrow columns). */
  stacked?: boolean;
  className?: string;
}) {
  const learning = learningFor(post);
  const { articlesRead } = useJourneyProgress();
  const done = articlesRead.includes(baseSlug(post.slug));
  const H = headingLevel === 2 ? "h2" : "h3";
  const onOpen = () => trackJourney("article_opened", { slug: post.slug, from: `card_${variant}` });
  const doneBadge = done && (
    <span className="inline-flex items-center gap-1 rounded-full bg-charcoal px-2 py-0.5 text-[11px] font-bold text-ivory">
      <Check className="h-3 w-3 text-klovers-green" strokeWidth={3} aria-hidden="true" /> {isAr ? "تمت الزيارة" : "Visited"}
    </span>
  );

  if (variant === "compact") {
    return (
      <article className={cn("group relative flex gap-3 rounded-2xl p-2 transition-colors hover:bg-card", className)}>
        <div className="w-24 shrink-0 sm:w-28 overflow-hidden rounded-xl">
          <OptimizedImage src={post.hero_image} alt={post.hero_alt || post.title} variant="card" sizes="112px" className="!aspect-[4/3]" fallback={<CoverFallback stage={learning.stage} />} />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <CategoryChip stage={learning.stage} isAr={isAr} />
            {doneBadge}
          </div>
          <H className="text-[0.95rem] font-bold leading-snug text-foreground line-clamp-2">
            <Link to={`/blog/${post.slug}`} onClick={onOpen} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              {post.title}
            </Link>
          </H>
          <LearningMeta learning={learning} isAr={isAr} className="mt-1.5" />
        </div>
      </article>
    );
  }

  if (variant === "postcard") {
    return (
      <article className={cn("group relative overflow-hidden rounded-3xl bg-charcoal text-ivory journal-lift", className)}>
        <OptimizedImage
          src={post.hero_image}
          alt={post.hero_alt || post.title}
          fallback={<CoverFallback stage={learning.stage} />}
          variant="card"
          className="!aspect-[4/5] !rounded-none transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-charcoal/90 p-4 backdrop-blur-[2px]">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <CategoryChip stage={learning.stage} isAr={isAr} tone="dark" />
            {doneBadge}
          </div>
          <H className="font-display text-base font-bold leading-snug line-clamp-2">
            <Link to={`/blog/${post.slug}`} onClick={onOpen} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:underline">
              {post.title}
            </Link>
          </H>
          <LearningMeta learning={learning} isAr={isAr} tone="dark" className="mt-2" />
        </div>
        <BookmarkButton slug={post.slug} title={post.title} isAr={isAr} className="absolute top-3 end-3 z-10" />
      </article>
    );
  }

  if (variant === "featured") {
    const outcome: string[] = [];
    if (learning.words) outcome.push(wordsLabel(learning.words, isAr));
    if (learning.stage === "discover" || learning.stage === "experience" || learning.stage === "understand")
      outcome.push(isAr ? "مفهوم ثقافي واحد" : "1 cultural insight");
    return (
      <article className={cn("group relative grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm", !stacked && "lg:grid-cols-[1.25fr_1fr]", className)}>
        <div className="relative">
          <OptimizedImage
            src={post.hero_image}
            alt={post.hero_alt || post.title}
          fallback={<CoverFallback stage={learning.stage} />}
            variant="card"
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 640px"
            className={cn("!aspect-[16/10] !rounded-none", !stacked && "lg:!aspect-auto lg:h-full")}
          />
          <span className="absolute top-4 start-4 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-charcoal shadow-sm">
            {isAr ? "القصة المختارة" : "Featured story"}
          </span>
        </div>
        <div className={cn("flex flex-col gap-4 p-6 sm:p-8", !stacked && "lg:p-10")}>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip stage={learning.stage} isAr={isAr} />
            {doneBadge}
          </div>
          <H className="font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            <Link to={`/blog/${post.slug}`} onClick={onOpen} className="after:absolute after:inset-0 after:rounded-[2rem] focus-visible:outline-none focus-visible:underline decoration-2 underline-offset-4">
              {post.title}
            </Link>
          </H>
          <p className="text-base leading-relaxed text-muted-foreground line-clamp-3">{post.description}</p>
          <LearningMeta learning={learning} isAr={isAr} className="text-sm" />
          {outcome.length > 0 && (
            <div className="rounded-2xl bg-muted/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/70">{isAr ? "ما يقدّمه المقال" : "You'll learn"}</p>
              <ul className="flex flex-wrap gap-2">
                {outcome.map((o) => (
                  <li key={o} className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground border border-border">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-charcoal px-5 text-sm font-bold text-ivory transition-colors group-hover:bg-charcoal/90">
              {isAr ? "قراءة القصة" : "Read the story"}
              <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
            </span>
            <BookmarkButton slug={post.slug} title={post.title} isAr={isAr} className="relative z-10" />
          </div>
        </div>
      </article>
    );
  }

  // standard
  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card journal-lift", className)}>
      <OptimizedImage
        src={post.hero_image}
        alt={post.hero_alt || post.title}
          fallback={<CoverFallback stage={learning.stage} />}
        variant="card"
        priority={priority}
        className="!rounded-none transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <CategoryChip stage={learning.stage} isAr={isAr} />
          {doneBadge}
        </div>
        <H className="text-lg font-bold leading-snug text-foreground line-clamp-2">
          <Link to={`/blog/${post.slug}`} onClick={onOpen} className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:underline decoration-2 underline-offset-4">
            {post.title}
          </Link>
        </H>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{post.description}</p>
        <LearningMeta learning={learning} isAr={isAr} className="mt-4 border-t border-border pt-3" />
      </div>
      <BookmarkButton slug={post.slug} title={post.title} isAr={isAr} className="absolute top-3 end-3 z-10" />
    </article>
  );
}

/** Korean text: lang="ko", never reversed inside an RTL line. */
export function Ko({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Korean dir="ltr" className={cn("font-ko [unicode-bidi:isolate] [word-break:keep-all]", className)}>
      {children}
    </Korean>
  );
}
