import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STAGE_CATEGORY, STAGES, stageForSlug, type StageId } from "@/constants/blogJourney";
import { baseSlug } from "@/lib/articleVocab";
import { useJourneyProgress } from "@/lib/journeyProgress";
import { ArticleCard, num, type JournalPost } from "./shared";

export type ArticleFilter = StageId | "all" | "saved";
const PAGE = 12;

/**
 * The plain library under the journey. The journey is a discovery layer, not
 * a gate: every published article is reachable here by topic, by search, or
 * from the reader's own saved list. Newest first.
 */
export default function AllArticles({
  posts,
  loading = false,
  isAr,
  filter,
  onFilter,
}: {
  posts: JournalPost[];
  loading?: boolean;
  isAr: boolean;
  filter: ArticleFilter;
  onFilter: (f: ArticleFilter) => void;
}) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const { bookmarks } = useJourneyProgress();
  const L = isAr ? "ar" : "en";

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    posts.forEach((p) => {
      const s = stageForSlug(p.slug);
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [posts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === "saved" && !bookmarks.includes(baseSlug(p.slug))) return false;
      if (filter !== "all" && filter !== "saved" && stageForSlug(p.slug) !== filter) return false;
      if (!q) return true;
      return [p.title, p.description, ...(p.keywords ?? [])].some((t) => t?.toLowerCase().includes(q));
    });
  }, [posts, filter, query, bookmarks]);

  const chips: { id: ArticleFilter; label: string; n: number }[] = [
    { id: "all", label: isAr ? "الكل" : "All", n: posts.length },
    ...STAGES.filter((s) => counts[s.id]).map((s) => ({ id: s.id as ArticleFilter, label: STAGE_CATEGORY[s.id][L], n: counts[s.id] })),
    { id: "saved", label: isAr ? "المحفوظة" : "Saved", n: posts.filter((p) => bookmarks.includes(baseSlug(p.slug))).length },
  ];

  return (
    <section id="all-articles" aria-labelledby="all-articles-title" className="scroll-mt-20 border-t border-border py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="all-articles-title" className="font-display text-3xl font-extrabold sm:text-4xl">
              {isAr ? "مكتبة الرحلة" : "The journey library"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isAr ? `كل المقالات، من الأحدث إلى الأقدم — ${num(posts.length, true)} مقالة.` : `Every article, newest first — ${posts.length} in all.`}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <label htmlFor="journal-search" className="sr-only">{isAr ? "ابحث في المقالات" : "Search articles"}</label>
            <Search className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="journal-search"
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
              placeholder={isAr ? "ابحث: هانوك، TOPIK، الدراما…" : "Search: hanok, TOPIK, drama…"}
              className="h-12 w-full rounded-full border border-border bg-card ps-10 pe-10 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={isAr ? "مسح البحث" : "Clear search"} className="absolute top-1/2 end-1.5 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-muted">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 -mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          <div className="flex w-max gap-2" role="group" aria-label={isAr ? "تصفية حسب الموضوع" : "Filter by topic"}>
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => { onFilter(c.id); setShown(PAGE); }}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === c.id ? "border-foreground bg-charcoal text-ivory" : "border-border bg-card text-foreground hover:border-foreground/40",
                )}
              >
                {c.label}
                <span className={cn("text-xs", filter === c.id ? "text-ivory/70" : "text-muted-foreground")}>{num(c.n, isAr)}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {isAr ? `${num(results.length, true)} نتيجة` : `${results.length} results`}
        </p>

        {loading ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-video animate-pulse bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-full animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            {filter === "saved"
              ? isAr ? "لم تحفظ أي مقال بعد. اضغط على رمز الحفظ في أي بطاقة." : "Nothing saved yet — tap the bookmark on any card."
              : isAr ? "لا توجد نتائج. جرّب كلمة أخرى." : "No results. Try another word."}
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, shown).map((p) => (
              <li key={p.id}>
                <ArticleCard post={p} isAr={isAr} />
              </li>
            ))}
          </ul>
        )}

        {results.length > shown && (
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" className="h-12 rounded-full border-foreground/30 bg-card px-8 font-bold" onClick={() => setShown((n) => n + PAGE)}>
              {isAr ? `عرض المزيد (${num(results.length - shown, true)})` : `Show more (${results.length - shown})`}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
