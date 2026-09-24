import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clapperboard, Plus, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/hooks/useSpeech";
import type { Expression, WordStory } from "@/constants/blogJourney";
import { ERAS } from "@/constants/eras";
import { journey, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { Ko } from "./shared";

/** Resolve a base slug to the published post in this language, or null. */
export type ResolveSlug = (base: string) => string | null;

function SaveWordButton({
  ko,
  rom,
  meaning,
  isAr,
  tone = "light",
}: {
  ko: string;
  rom?: string;
  meaning?: string;
  isAr: boolean;
  tone?: "light" | "dark";
}) {
  const { words } = useJourneyProgress();
  const saved = words.some((w) => w.ko === ko);
  return (
    <button
      type="button"
      disabled={saved}
      onClick={() => {
        if (journey.saveWords([{ ko, rom, meaning }], "journal")) trackJourney("word_saved", { ko, from: "journal" });
      }}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
        saved
          ? tone === "dark" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
          : tone === "dark" ? "bg-primary text-charcoal hover:bg-primary/90" : "bg-charcoal text-ivory hover:bg-charcoal/90",
      )}
    >
      {saved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
      {saved ? (isAr ? "في المجموعة" : "In your collection") : isAr ? "حفظ الكلمة" : "Save word"}
      <span className="sr-only"><Ko>{ko}</Ko></span>
    </button>
  );
}

function ListenButton({ text, isAr, tone = "light" }: { text: string; isAr: boolean; tone?: "light" | "dark" }) {
  const { speakKorean } = useSpeech();
  if (typeof window !== "undefined" && !("speechSynthesis" in window)) return null;
  return (
    <button
      type="button"
      onClick={() => speakKorean(text, { rate: 0.85 })}
      aria-label={isAr ? `الاستماع: ${text}` : `Listen: ${text}`}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "dark" ? "border-ivory/25 text-ivory hover:bg-ivory/10" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      <Volume2 className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

/* ─────────────── 02 · كلمة لا تُترجم — the word is the hero ─────────────── */

export function WordStories({ words, isAr, resolve }: { words: WordStory[]; isAr: boolean; resolve: ResolveSlug }) {
  const [open, setOpen] = useState<string | null>(null);
  const L = isAr ? "ar" : "en";
  return (
    <div>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1 text-xs font-extrabold text-charcoal">
        {isAr ? "سلسلة · كلمة لا تُترجم" : "Series · Untranslatable"}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {words.map((w, i) => {
          const isOpen = open === w.ko;
          const slug = w.article ? resolve(w.article) : null;
          return (
            <li
              key={w.ko}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border p-4 transition-colors sm:p-6",
                isOpen ? "border-charcoal bg-ivory text-charcoal" : "border-ivory/15 bg-ivory/[0.06] text-ivory",
              )}
            >
              <span aria-hidden="true" className={cn("absolute top-4 end-5 font-display text-xs font-bold", isOpen ? "text-charcoal/50" : "text-ivory/50")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <Ko className={cn("block pt-3 text-center font-black leading-none tracking-tight sm:pt-0 sm:text-7xl", w.ko.length > 2 ? "text-4xl" : "text-5xl", isOpen ? "text-charcoal" : "text-primary")}>
                {w.ko}
              </Ko>
              <p className={cn("mt-3 text-center text-sm font-medium", isOpen ? "text-charcoal/70" : "text-ivory/70")} dir="ltr">
                {w.rom}
              </p>
              <h3 className="mt-3 text-center font-display text-[0.95rem] font-bold leading-snug sm:mt-4 sm:text-lg">{w.hook[L]}</h3>
              <div id={`word-${i}`} hidden={!isOpen} className="mt-3 text-center text-sm leading-relaxed">
                {w.meaning[L]}
                {slug && (
                  <Link
                    to={`/blog/${slug}`}
                    onClick={() => trackJourney("article_opened", { slug, from: "word_story" })}
                    className="mt-3 block font-bold underline decoration-2 underline-offset-4"
                  >
                    {isAr ? "قراءة القصة كاملة" : "Read the full story"}
                  </Link>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {!isOpen ? (
                  <button
                    type="button"
                    aria-expanded={false}
                    aria-controls={`word-${i}`}
                    onClick={() => setOpen(w.ko)}
                    className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-primary px-3.5 text-[0.8125rem] font-bold text-charcoal sm:text-sm sm:px-5 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
                  >
                    {isAr ? "اكتشاف المعنى" : "Discover the meaning"}
                  </button>
                ) : (
                  <SaveWordButton ko={w.ko} rom={w.rom} meaning={w.meaning[L]} isAr={isAr} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── 04 · تعلم من الدراما — a scene, with subtitles ─────────────── */

export function DramaLines({ lines, isAr, resolve }: { lines: Expression[]; isAr: boolean; resolve: ResolveSlug }) {
  const L = isAr ? "ar" : "en";
  return (
    <div>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1 text-xs font-extrabold text-charcoal">
        <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
        {isAr ? "سلسلة · التعلّم من الدراما" : "Series · Learn from K-drama"}
      </p>
      {/* Phones: one swipeable strip of scenes (snap), so four tall cards don't
          stack into a wall. From md up, a plain two-column grid. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0" aria-label={isAr ? "مشاهد — اسحب لرؤية المزيد" : "Scenes — swipe for more"}>
        {lines.map((l, i) => {
          const slug = l.article ? resolve(l.article) : null;
          return (
            <li key={l.ko} className="w-[85%] shrink-0 snap-start overflow-hidden rounded-3xl border border-ivory/15 bg-black/20 md:w-auto">
              {/* The frame: letterbox bars, a scene number, and a subtitle line. */}
              <div className="relative flex aspect-[16/8] flex-col justify-end bg-charcoal px-5 pb-5 pt-10">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-3 bg-black/60" />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3 bg-black/60" />
                <span className="absolute top-5 start-5 rounded bg-ivory/10 px-2 py-0.5 tabular-nums text-[11px] font-semibold text-ivory/70" dir="ltr">
                  SCENE {String(i + 1).padStart(2, "0")}
                </span>
                <div className="text-center">
                  <Ko className="block text-3xl font-black text-ivory drop-shadow sm:text-4xl">{l.ko}</Ko>
                  <p className="mt-2 inline-block rounded bg-black/55 px-2.5 py-1 text-base font-bold text-primary">{l.meaning[L]}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-ivory/70">
                  <span dir="ltr" className="font-medium">{l.rom}</span>
                  <span aria-hidden="true"> · </span>
                  {isAr ? "حرفيًا: " : "Literally: "}
                  {l.literal[L]}
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ivory/90">{l.context[L]}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ListenButton text={l.ko} isAr={isAr} tone="dark" />
                  <SaveWordButton ko={l.ko} rom={l.rom} meaning={l.meaning[L]} isAr={isAr} tone="dark" />
                  {slug && (
                    <Link
                      to={`/blog/${slug}`}
                      onClick={() => trackJourney("article_opened", { slug, from: "drama_line" })}
                      className="inline-flex min-h-[44px] items-center px-2 text-sm font-bold text-ivory underline decoration-primary decoration-2 underline-offset-4"
                    >
                      {isAr ? "المزيد من الدراما" : "More drama lines"}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── 05 · تكلم مثل الكوريين — a conversation ─────────────── */

export function SpeakPhrases({ phrases, isAr, resolve }: { phrases: Expression[]; isAr: boolean; resolve: ResolveSlug }) {
  const L = isAr ? "ar" : "en";
  return (
    <div>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-charcoal px-3.5 py-1 text-xs font-extrabold text-ivory">
        {isAr ? "سلسلة · الكلام كما يتكلّم الكوريون" : "Series · Speak like Koreans"}
      </p>
      <ul className="grid gap-5 md:grid-cols-2">
        {phrases.map((p) => {
          const slug = p.article ? resolve(p.article) : null;
          return (
            <li key={p.ko} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                {/* The Korean line, as the other person's message bubble. */}
                <div className="rounded-3xl rounded-ss-md bg-muted px-5 py-3.5">
                  <Ko className="block text-xl font-black text-foreground sm:text-3xl">{p.ko}</Ko>
                  <span className="mt-1 block text-xs font-medium text-muted-foreground" dir="ltr">{p.rom}</span>
                </div>
                {p.register && (
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-foreground/80">
                    {p.register === "polite" ? (isAr ? "مهذب" : "Polite") : isAr ? "غير رسمي" : "Casual"}
                  </span>
                )}
              </div>
              {/* The meaning, as your reply bubble on the other side. */}
              <div className="mt-3 flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-se-md bg-primary px-5 py-3 font-display text-base font-extrabold text-charcoal">
                  {p.meaning[L]}
                </p>
              </div>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{p.context[L]}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ListenButton text={p.ko} isAr={isAr} />
                <SaveWordButton ko={p.ko} rom={p.rom} meaning={p.meaning[L]} isAr={isAr} />
                {slug && (
                  <Link
                    to={`/blog/${slug}`}
                    onClick={() => trackJourney("article_opened", { slug, from: "speak_phrase" })}
                    className="inline-flex min-h-[44px] items-center px-2 text-sm font-bold text-foreground underline decoration-2 underline-offset-4"
                  >
                    {isAr ? "كيف يستخدمها الكوريون" : "How Koreans use it"}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── 01 · the existing "Journey through Korea's time" ─────────────── */

/**
 * Links the Discover stop into the era pages that already exist at
 * /journey/:eraId (EraPage.tsx, KoreaTimeSection.tsx) instead of rebuilding a
 * history timeline here. Five internal links, no new content.
 */
export function EraStrip({ isAr }: { isAr: boolean }) {
  return (
    <nav aria-label={isAr ? "رحلة عبر زمن كوريا" : "Journey through Korea's time"} className="mt-8 rounded-3xl border border-border bg-card p-4 sm:p-5">
      <p className="mb-3 text-sm font-bold text-foreground/70">{isAr ? "رحلة عبر زمن كوريا" : "Journey through Korea's time"}</p>
      <ol className="grid gap-2 sm:grid-cols-5">
        {ERAS.map((e, i) => (
          <li key={e.id}>
            <Link
              to={`/journey/${e.id}`}
              className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-col sm:items-start sm:gap-1"
            >
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-extrabold text-charcoal">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug text-foreground">{isAr ? e.titleAr : e.titleEn}</span>
                <span className="block text-xs text-muted-foreground">{isAr ? e.datesAr : e.datesEn}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
