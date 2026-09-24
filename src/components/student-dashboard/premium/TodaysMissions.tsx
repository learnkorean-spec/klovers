import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Mission } from "@/lib/dashboardProgress";
import { useDashCopy } from "./copy";
import { BrandIcon, ClubyNote } from "./primitives";

/** Seven everyday words, one per weekday — moved here from the old "Today" zone. */
export const WORD_OF_DAY = [
  { ko: "안녕하세요", rom: "annyeonghaseyo", en: "Hello / Good day", ar: "مرحبًا / أهلًا" },
  { ko: "감사합니다", rom: "gamsahamnida", en: "Thank you", ar: "شكرًا لك" },
  { ko: "사랑해요", rom: "saranghaeyo", en: "I love you", ar: "أحبك" },
  { ko: "공부하다", rom: "gongbuhada", en: "To study", ar: "يذاكر / يدرس" },
  { ko: "맛있어요", rom: "massisseoyo", en: "It's delicious", ar: "إنه لذيذ" },
  { ko: "화이팅", rom: "hwaiting", en: "Fighting! / You can do it!", ar: "هيا! / تقدر تعملها!" },
  { ko: "천천히", rom: "cheoncheonhi", en: "Slowly", ar: "ببطء" },
] as const;

export function wordOfDay(date = new Date()) {
  return WORD_OF_DAY[date.getDay() % WORD_OF_DAY.length];
}

/**
 * B. Today's missions — three, never more. Completion is read from today's
 * XP ledger. The only reward named is XP, because XP is the only reward the
 * backend actually grants for these activities.
 */
export function TodaysMissions({
  missions, loading, continueHref, claimLabel, claiming, onClaimWord, clubyAwake = true,
}: {
  missions: Mission[] | null; loading: boolean; continueHref: string;
  claimLabel: string; claiming: boolean; onClaimWord: () => void;
  /** Canon: Cluby only appears once his egg has hatched. */
  clubyAwake?: boolean;
}) {
  const { c, lang } = useDashCopy();
  const word = wordOfDay();
  const done = missions?.filter(m => m.done).length ?? 0;
  const total = missions?.length ?? 3;

  return (
    <section aria-labelledby="dash-missions-title" className="flex min-w-0 flex-col rounded-[20px] border border-foreground/10 bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BrandIcon name="challenge" className="h-9 w-9" eager />
          <h2 id="dash-missions-title" className="font-display text-base font-semibold text-foreground sm:text-lg whitespace-nowrap">{c("missionsTitle")}</h2>
        </div>
        {missions && (
          <span className="whitespace-nowrap font-display text-sm font-semibold tabular-nums text-foreground" aria-live="polite">
            {c("missionsCount", { done, total })}
          </span>
        )}
      </div>

      {/* Segmented meter: one segment per mission. Neon fills carry a charcoal edge so they read on white. */}
      <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cn("h-2 rounded-full", i < done ? "bg-live-bright ring-1 ring-inset ring-foreground" : "bg-foreground/10")} />
        ))}
      </div>

      {loading || !missions ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {missions.map(m => {
            const title = m.id === "lesson" ? c("missionLesson") : m.id === "game" ? c("missionGame") : c("missionWord");
            return (
              <li
                key={m.id}
                className={cn(
                  "flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2",
                  m.done ? "border-foreground/10 bg-background" : "border-foreground/15 bg-card",
                )}
              >
                <BrandIcon name={m.icon} className={cn("h-9 w-9", m.done && "opacity-60")} />
                <div className="min-w-[9rem] flex-1">
                  <p className={cn("text-sm font-semibold text-foreground", m.done && "text-foreground/70")}>{title}</p>
                  {m.id === "word" ? (
                    <p className="text-xs text-muted-foreground">
                      <span lang="ko" dir="ltr" className="font-ko text-sm font-bold text-foreground">{word.ko}</span>
                      {" · "}<span dir="ltr">{word.rom}</span>{" · "}{lang === "ar" ? word.ar : word.en}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{m.id === "lesson" ? c("missionLessonSub") : c("missionGameSub")}</p>
                  )}
                </div>
                {m.done ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-live-bright text-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {c("missionDone")}
                  </span>
                ) : m.id === "word" ? (
                  <button
                    type="button"
                    onClick={onClaimWord}
                    disabled={claiming}
                    className="min-h-11 w-full shrink-0 rounded-xl border border-foreground/20 bg-background px-3 text-sm sm:w-auto lg:w-full xl:w-auto font-semibold text-foreground hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:opacity-60"
                  >
                    {claimLabel}
                  </button>
                ) : (
                  <Link
                    to={m.id === "lesson" ? continueHref : "/games"}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-foreground/20 bg-background px-4 text-sm font-semibold text-foreground hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                    aria-label={`${title} — ${m.id === "game" ? c("missionPlay") : c("missionGo")}`}
                  >
                    {m.id === "game" ? c("missionPlay") : c("missionGo")}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">{done === total && missions ? c("missionsAllDone") : c("missionsReward")}</p>
        {missions && done === total && clubyAwake && (
          <ClubyNote
            text={c("clubyMissionsDone")}
            lang={lang}
            size="sm"
            pose="star"
            alt={c("clubyAlt")}
            className="shrink-0"
          />
        )}
      </div>
    </section>
  );
}
