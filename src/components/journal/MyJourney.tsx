import { useMemo } from "react";
import { MapPin, Sparkles, Languages, CheckCircle2 } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { cn } from "@/lib/utils";
import { DESTINATIONS, STAGES, type StageId } from "@/constants/blogJourney";
import { baseSlug } from "@/lib/articleVocab";
import { journey, journeyXp, useJourneyProgress } from "@/lib/journeyProgress";
import { trackJourney } from "@/lib/journeyAnalytics";
import { Ko, num, type JournalPost } from "./shared";

/** "How do you want to discover Korea?" — each choice jumps to a stage. */
const CHOICES: { stage: StageId; ar: string; en: string; icon: Parameters<typeof KloverIcon>[0]["name"] }[] = [
  { stage: "discover", ar: "الثقافة", en: "Culture", icon: "palace-blossoms" },
  { stage: "drama", ar: "الدراما", en: "K-drama", icon: "game-headphones-music" },
  { stage: "understand", ar: "الكلمات", en: "Words", icon: "flashcard-ga" },
  { stage: "experience", ar: "الحياة اليومية", en: "Daily life", icon: "game-subway" },
  { stage: "test", ar: "التحديات", en: "Challenges", icon: "game-checklist-pencil" },
];

export default function MyJourney({
  isAr,
  posts,
  onGoToStage,
}: {
  isAr: boolean;
  posts: JournalPost[];
  onGoToStage: (id: StageId) => void;
}) {
  const progress = useJourneyProgress();
  const read = useMemo(() => new Set(progress.articlesRead), [progress.articlesRead]);

  // Only posts in this language count, so the denominator is honest.
  const bases = useMemo(() => posts.map((p) => baseSlug(p.slug)), [posts]);
  const readHere = bases.filter((b) => read.has(b)).length;
  const total = bases.length;

  const destinations = useMemo(
    () =>
      DESTINATIONS.map((d) => ({
        ...d,
        has: bases.some((b) => d.match.test(b)),
        found: bases.some((b) => d.match.test(b) && read.has(b)),
      })).filter((d) => d.has),
    [bases, read],
  );
  const found = destinations.filter((d) => d.found).length;
  const pct = total ? Math.round((readHere / total) * 100) : 0;
  const xp = journeyXp(progress);

  return (
    <section id="my-journey" aria-labelledby="my-journey-title" className="scroll-mt-20 py-10 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-[2rem] bg-charcoal text-ivory">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:p-10">
            {/* ── Progress ── */}
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <Ko className="font-medium text-ivory/70">나의 한국 여행</Ko>
              </p>
              <h2 id="my-journey-title" className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
                {isAr ? "رحلتي في كوريا" : "My Korea journey"}
              </h2>

              <div className="mt-6 flex items-end gap-3">
                <p className="font-display text-5xl font-extrabold leading-none text-primary">
                  {num(readHere, isAr)}
                  <span className="text-2xl text-ivory/60"> / {num(total, isAr)}</span>
                </p>
                <p className="pb-1 text-sm text-ivory/80">{isAr ? "محطة مكتشفة" : "stops discovered"}</p>
              </div>
              <div
                className="mt-4 h-2.5 overflow-hidden rounded-full bg-ivory/15"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={readHere}
                aria-label={isAr ? "التقدّم في الرحلة" : "Your journey progress"}
              >
                <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${Math.max(pct, readHere ? 2 : 0)}%` }} />
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: Languages, v: progress.words.length, l: isAr ? "كلمة محفوظة" : "words saved" },
                  { icon: CheckCircle2, v: progress.quizzes.length, l: isAr ? "إجابة صحيحة" : "right answers" },
                  { icon: Sparkles, v: xp, l: isAr ? "نقاط الرحلة" : "journey XP" },
                ].map(({ icon: Icon, v, l }) => (
                  <div key={l} className="rounded-2xl bg-ivory/[0.07] p-3">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold text-ivory/70">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {l}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-extrabold">{num(v, isAr)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-ivory/60">
                {readHere === 0
                  ? isAr ? "كل مقال مكتمل محطة جديدة. التقدّم محفوظ على هذا الجهاز." : "Every article you finish is a new stop. Progress is saved on this device."
                  : isAr ? "التقدّم محفوظ على هذا الجهاز." : "Your progress is saved on this device."}
              </p>
            </div>

            {/* ── Destinations + choose your path ── */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-ivory/80">
                  {isAr ? `الوجهات · ${num(found, isAr)} من ${num(destinations.length, isAr)}` : `Destinations · ${found} of ${destinations.length}`}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {destinations.map((d) => (
                    <li
                      key={d.id}
                      className={cn(
                        "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                        d.found ? "border-primary bg-primary font-bold text-charcoal" : "border-ivory/20 text-ivory/75",
                      )}
                    >
                      <Ko className={cn("text-xs", d.found ? "text-charcoal/70" : "text-ivory/45")}>{d.ko}</Ko>
                      {d.label[isAr ? "ar" : "en"]}
                      {d.found && <span className="sr-only">{isAr ? " (مكتشفة)" : " (discovered)"}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-card p-5 text-foreground">
                <h3 className="font-display text-lg font-extrabold">{isAr ? "من أين يبدأ اكتشاف كوريا؟" : "How do you want to discover Korea?"}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={isAr ? "اختيار الطريق" : "Choose your path"}>
                  {CHOICES.map((c) => {
                    const active = progress.path === c.stage;
                    return (
                      <button
                        key={c.stage}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          journey.setPath(c.stage);
                          journey.start();
                          trackJourney("journey_path_selected", { path: c.stage });
                          onGoToStage(c.stage);
                        }}
                        className={cn(
                          "flex min-h-[52px] items-center gap-2 rounded-2xl border px-3 py-2 text-start text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "border-charcoal bg-primary text-charcoal" : "border-border bg-background hover:border-foreground/40",
                        )}
                      >
                        <KloverIcon name={c.icon} className="h-8 w-8" />
                        {isAr ? c.ar : c.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── The six stops, as a route ── */}
          <nav aria-label={isAr ? "محطات الرحلة" : "Journey stops"} className="border-t border-ivory/10 px-4 py-5 sm:px-8">
            <ol className="relative grid grid-cols-6 gap-1">
              <span aria-hidden="true" className="absolute inset-x-[8%] top-5 border-t-2 border-dashed border-ivory/25" />
              {STAGES.map((s) => {
                const seen = progress.stopsSeen.includes(s.id);
                return (
                  <li key={s.id} className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={() => onGoToStage(s.id)}
                      className="group flex min-h-[44px] flex-col items-center gap-1.5 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-full border-2 font-display text-sm font-extrabold transition-colors",
                          seen ? "border-primary bg-primary text-charcoal" : "border-ivory/40 bg-charcoal text-ivory group-hover:border-primary",
                        )}
                      >
                        {s.num}
                      </span>
                      <span className="hidden text-center text-xs font-semibold text-ivory/80 sm:block">{s.short[isAr ? "ar" : "en"]}</span>
                      <span className="sr-only sm:hidden">{s.title[isAr ? "ar" : "en"]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}
