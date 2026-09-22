/**
 * The article template's learning layer: what you'll learn (top), tappable
 * Korean words (inline), what you learned (end), and "your next stop" in place
 * of a plain related-articles heading.
 *
 * All of it reads from the article's own markdown (extractArticleVocab), so it
 * appears only where the article genuinely teaches vocabulary, and the article
 * body itself — the SEO-relevant content — is untouched.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, Volume2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/OptimizedImage";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/hooks/useSpeech";
import { STAGE_BY_ID, type StageId } from "@/constants/blogJourney";
import { LEVEL_LABEL, PURE_HANGUL, type ArticleLevel, type VocabItem } from "@/lib/articleVocab";
import { journey, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { KlobiFigure, Ko, LearningMeta, learningFor, minutesLabel, num, useInView, wordsLabel } from "./shared";

const CULTURAL: StageId[] = ["discover", "experience", "understand"];

/* ───────────────────────── top: في هذا المقال ستتعلم ───────────────────────── */

export function ArticleLearningIntro({
  vocabCount,
  minutes,
  level,
  stage,
  isAr,
}: {
  vocabCount: number;
  minutes: number | null;
  level: ArticleLevel;
  stage: StageId;
  isAr: boolean;
}) {
  const s = STAGE_BY_ID[stage];
  const items: string[] = [];
  if (vocabCount) items.push(wordsLabel(vocabCount, isAr));
  if (CULTURAL.includes(stage)) items.push(isAr ? "مفهوم ثقافي" : "a cultural insight");
  return (
    <aside aria-label={isAr ? "ماذا ستتعلم" : "What you'll learn"} className="mb-8 rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/blog#stage-${stage}`}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-charcoal"
        >
          {isAr ? `المحطة ${num(Number(s.num), true)} · ${s.title.ar}` : `Stop ${s.num} · ${s.title.en}`}
        </Link>
        <p className="text-xs font-semibold text-muted-foreground">
          {minutes ? `${minutesLabel(minutes, isAr)} · ` : ""}
          {LEVEL_LABEL[level][isAr ? "ar" : "en"]}
        </p>
      </div>
      {items.length > 0 && (
        <>
          <p className="mt-4 text-sm font-bold text-foreground">{isAr ? "في هذا المقال ستتعلم:" : "In this article you'll learn:"}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {items.map((i) => (
              <li key={i} className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold">
                {i}
              </li>
            ))}
          </ul>
        </>
      )}
      {vocabCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {isAr ? "اضغط على أي كلمة كورية في المقال لترى معناها وتحفظها." : "Tap any Korean word in the article to see its meaning and save it."}
        </p>
      )}
    </aside>
  );
}

/* ───────────────────────────── inline: <KoreanWord /> ───────────────────────────── */

function SpeakButton({ text, isAr }: { text: string; isAr: boolean }) {
  const { speakKorean } = useSpeech();
  if (typeof window !== "undefined" && !("speechSynthesis" in window)) return null;
  return (
    <button
      type="button"
      onClick={() => speakKorean(text, { rate: 0.85 })}
      aria-label={isAr ? `استمع: ${text}` : `Listen: ${text}`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Volume2 className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

/**
 * A Korean term in the article body. Tap/click (or Enter) opens a small card:
 * Hangul, romanisation, meaning, listen (browser speech — the same useSpeech
 * the lessons use; hidden where unsupported), save. Keyboard and screen
 * readers get it through Radix Popover.
 */
export function KoreanWord({ item, from, isAr, children }: { item: VocabItem; from: string; isAr: boolean; children?: ReactNode }) {
  const { words } = useJourneyProgress();
  const saved = words.some((w) => w.ko === item.ko);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          lang="ko"
          dir="ltr"
          className="font-ko inline rounded-md bg-primary/40 px-1 font-bold text-foreground underline decoration-charcoal/40 decoration-dotted underline-offset-4 [unicode-bidi:isolate] hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {children ?? item.ko}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl p-4" dir={isAr ? "rtl" : "ltr"}>
        <Ko className="block text-3xl font-black">{item.ko}</Ko>
        {item.rom && <p className="mt-1 text-sm text-muted-foreground">{item.rom}</p>}
        {item.meaning && <p className="mt-2 text-base font-semibold leading-snug">{item.meaning}</p>}
        <div className="mt-4 flex items-center gap-2">
          <SpeakButton text={item.ko} isAr={isAr} />
          <button
            type="button"
            disabled={saved}
            onClick={() => {
              if (journey.saveWords([item], from)) trackJourney("word_saved", { ko: item.ko, from });
            }}
            className={cn(
              "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              saved ? "bg-muted text-foreground" : "bg-charcoal text-ivory hover:bg-charcoal/90",
            )}
          >
            {saved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saved ? (isAr ? "في مجموعتك" : "Saved") : isAr ? "احفظ الكلمة" : "Save word"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Plain text of a react-markdown node's children, if it is only text. */
const textOf = (children: ReactNode): string | null => {
  if (typeof children === "string") return children;
  if (Array.isArray(children) && children.every((c) => typeof c === "string")) return children.join("");
  return null;
};

/**
 * react-markdown component overrides: a bold or table cell that is pure Hangul
 * becomes a <KoreanWord /> when the article's own vocabulary table glosses it.
 * Everything else renders exactly as before.
 */
export function koreanWordComponents(vocab: VocabItem[], from: string, isAr: boolean) {
  const byKo = new Map(vocab.map((v) => [v.ko, v]));
  // Only words the article itself glosses: a tap that reveals no meaning
  // teaches nothing, so unglossed bold Hangul stays plain bold.
  const wrap = (children: ReactNode) => {
    const t = textOf(children)?.trim();
    const item = t && PURE_HANGUL.test(t) ? byKo.get(t) : undefined;
    return item?.meaning ? <KoreanWord item={item} from={from} isAr={isAr} /> : null;
  };
  return {
    strong: ({ children, node: _node, ...props }: { children?: ReactNode; node?: unknown }) =>
      wrap(children) ?? <strong {...props}>{children}</strong>,
    td: ({ children, node: _node, ...props }: { children?: ReactNode; node?: unknown }) => (
      <td {...props}>{wrap(children) ?? children}</td>
    ),
  };
}

/* ───────────────────────────── end: تعلمت اليوم ───────────────────────────── */

export function ArticleLearnedToday({
  vocab,
  slug,
  isAr,
  hasNextStop,
}: {
  vocab: VocabItem[];
  slug: string;
  isAr: boolean;
  hasNextStop: boolean;
}) {
  const { words } = useJourneyProgress();
  const shown = vocab.slice(0, 8);
  const have = new Set(words.map((w) => w.ko));
  const allSaved = shown.every((v) => have.has(v.ko));
  const [justSaved, setJustSaved] = useState(0);
  if (!shown.length) return null;
  return (
    <section aria-labelledby="learned-today" className="mt-12 rounded-[2rem] bg-charcoal p-6 text-ivory sm:p-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-ivory p-1">
          <KlobiFigure pose="cards" className="h-12 w-12" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary">
            {isAr ? "اقرأ ← تعلّم ← اجمع" : "Read → Learn → Collect"}
          </p>
          <h2 id="learned-today" className="font-display text-2xl font-extrabold">{isAr ? "تعلمت اليوم" : "Today you learned"}</h2>
        </div>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shown.map((v) => (
          <li key={v.ko} className={cn("rounded-2xl border p-3", have.has(v.ko) ? "border-primary/60 bg-primary/10" : "border-ivory/15 bg-ivory/[0.06]")}>
            <Ko className="block text-2xl font-black text-primary">{v.ko}</Ko>
            {v.meaning && <p className="mt-1 text-sm leading-snug text-ivory/85 line-clamp-2">{v.meaning}</p>}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {justSaved ? (isAr ? `تم حفظ ${justSaved} كلمة` : `${justSaved} words saved`) : ""}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          size="lg"
          disabled={allSaved}
          className="h-12 rounded-full px-6 font-bold"
          onClick={() => {
            const n = journey.saveWords(shown, slug);
            setJustSaved(n);
            if (n) trackJourney("word_saved", { count: n, from: slug });
          }}
        >
          {allSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {allSaved ? (isAr ? "الكلمات في مجموعتك" : "Words saved") : isAr ? "احفظ الكلمات" : "Save the words"}
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-ivory/30 bg-transparent px-6 font-bold text-ivory hover:bg-ivory/10 hover:text-ivory">
          <Link to="/blog#stage-test">{isAr ? "اختبر نفسك" : "Test yourself"}</Link>
        </Button>
        {hasNextStop && (
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-ivory/30 bg-transparent px-6 font-bold text-ivory hover:bg-ivory/10 hover:text-ivory"
            onClick={() => document.getElementById("next-stop")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {isAr ? "المحطة التالية" : "Next stop"}
          </Button>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────── محطتك القادمة ───────────────────────────── */

export interface NextStopPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image: string;
  hero_alt: string;
}

export function NextStop({ post, isAr, fromSlug }: { post: NextStopPost; isAr: boolean; fromSlug: string }) {
  const learning = learningFor(post);
  const { articlesRead } = useJourneyProgress();
  const stage = STAGE_BY_ID[learning.stage];
  return (
    <div id="next-stop" className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-extrabold text-foreground">
        <KlobiFigure pose="wave" className="h-12 w-auto" />
        {isAr ? "محطتك القادمة" : "Your next stop"}
      </h2>
      <Link
        to={`/blog/${post.slug}`}
        onClick={() => trackJourney("next_stop_clicked", { from: fromSlug, to: post.slug })}
        className="group grid overflow-hidden rounded-[2rem] border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[1fr_1.2fr]"
      >
        <OptimizedImage src={post.hero_image} alt={post.hero_alt || post.title} variant="card" sizes="(max-width: 640px) 100vw, 320px" className="!rounded-none sm:!aspect-auto sm:h-full" />
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-charcoal">
            {isAr ? `المحطة ${num(Number(stage.num), true)} · ${stage.title.ar}` : `Stop ${stage.num} · ${stage.title.en}`}
          </span>
          <h3 className="text-xl font-bold leading-snug text-foreground">{post.title}</h3>
          <LearningMeta learning={learning} isAr={isAr} className="text-sm" />
          <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
          <span className="mt-auto inline-flex h-11 w-fit items-center gap-2 rounded-full bg-charcoal px-5 text-sm font-bold text-ivory">
            {isAr ? "تابع الرحلة" : "Continue the journey"}
            <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
          </span>
        </div>
      </Link>
      <p className="mt-3 text-sm text-muted-foreground">
        {isAr
          ? `أكملت ${num(articlesRead.length, true)} ${articlesRead.length >= 3 && articlesRead.length <= 10 ? "محطات" : "محطة"} في رحلتك حتى الآن.`
          : `You've completed ${articlesRead.length} stop${articlesRead.length === 1 ? "" : "s"} on your journey so far.`}
      </p>
    </div>
  );
}

/* ───────────────────────── read tracking (article_opened / _completed) ───────────────────────── */

/**
 * Rendered right after the article body. Marks the article read when the
 * reader reaches the end — a stop is "discovered" by reading it, not by
 * opening it. Its own component so its observer mounts with the article
 * (the page shows a skeleton first).
 */
export function ArticleEndSentinel({ slug }: { slug: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0);
  useEffect(() => {
    trackJourney("article_opened", { slug, from: "article_page" }, slug);
  }, [slug]);
  useEffect(() => {
    if (seen && journey.markArticleRead(slug)) trackJourney("article_completed", { slug }, slug);
  }, [seen, slug]);
  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

export const useMemoVocabComponents = (vocab: VocabItem[], from: string, isAr: boolean) =>
  useMemo(() => koreanWordComponents(vocab, from, isAr), [vocab, from, isAr]);
