import { useEffect, useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import KloverIcon from "@/components/KloverIcon";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { FREE_GAME_IDS } from "@/constants/gamesList";
import { gameWorlds, CLUBY_OUTFITS } from "@/constants/gameWorlds";

/**
 * Top of /games: the Game Worlds concept, phase 1.
 *
 * Everything shown is real data or plainly marked as not-yet:
 *  - XP and league come from useGamification (passed in by GamesPage).
 *  - "Played" per world is read from student_xp rows whose activity_type is
 *    `game_<id>` — the same rows the award RPC writes. No new table.
 *  - The Cluby collection is a "coming soon" strip. Collecting needs its own
 *    migration PR (CLAUDE.md: never in a feature PR), so nothing here pretends
 *    a student owns one.
 *
 * Palette: brand yellow is the hero surface with charcoal text; neon green
 * (live-bright) only ever sits on a charcoal track, never on a light card.
 */

interface Props {
  /** The page's SEO heading ("Korean Learning Games"), kept as the h1. */
  title: string;
  isLoggedIn: boolean;
  isAr: boolean;
  totalXp: number;
  streak: number;
  onPlay: (gameId: string) => void;
}

const ASSET = "/assets/characters";

const GameWorldsHub = ({ title, isLoggedIn, isAr, totalXp, streak, onPlay }: Props) => {
  const worlds = useMemo(() => gameWorlds(), []);
  const [played, setPlayed] = useState<Set<string>>(new Set());

  // Re-read whenever XP moves: a finished game is exactly what changes it.
  useEffect(() => {
    if (!isLoggedIn) {
      setPlayed(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("GameWorldsHub: could not read the session", sessionError);
        return;
      }
      const uid = session?.user?.id;
      if (!uid) return;
      const { data, error } = await supabase
        .from("student_xp")
        .select("activity_type")
        .eq("user_id", uid)
        .like("activity_type", "game_%");
      if (error) console.error("GameWorldsHub: could not read played games", error);
      if (cancelled || error || !data) return;
      setPlayed(new Set(data.map((r: { activity_type: string | null }) => (r.activity_type ?? "").replace(/^game_/, ""))));
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, totalXp]);

  const canPlay = (id: string) => isLoggedIn || FREE_GAME_IDS.includes(id);

  const stats = worlds.map((w) => {
    const done = w.gameIds.filter((id) => played.has(id)).length;
    return { world: w, done, total: w.gameIds.length, complete: w.gameIds.length > 0 && done === w.gameIds.length };
  });
  const currentIdx = Math.max(0, stats.findIndex((s) => !s.complete));
  const allComplete = stats.every((s) => s.complete);

  const nextGameIn = (idx: number) => {
    const ids = worlds[idx]?.gameIds ?? [];
    return ids.find((id) => !played.has(id) && canPlay(id)) ?? ids.find(canPlay) ?? ids[0];
  };

  const league = getLeague(totalXp);
  const nextLeague = LEAGUES[league.index + 1];
  const pct = nextLeague
    ? Math.min(100, Math.round(((totalXp - league.minXp) / (nextLeague.minXp - league.minXp)) * 100))
    : 100;

  const continueGame = nextGameIn(allComplete ? 0 : currentIdx);

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-10">
      {/* Hero — yellow surface, charcoal type, hard edge */}
      <section className="card-edge rounded-3xl bg-klovers-yellow text-charcoal overflow-hidden grid md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-6 md:p-8 space-y-4">
          <h1 className="text-xs font-extrabold uppercase tracking-wider">{title}</h1>
          <p className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
            {isLoggedIn ? (isAr ? "أهلًا بيك تاني!" : "Welcome back!") : (isAr ? "العب واتعلم كوري" : "Play your way into Korean")}
          </p>
          <p className="text-sm md:text-base">
            {isAr ? "العب، اتعلم، وقرّب أكتر من كوريا!" : "Let's play, learn, and get closer to Korea!"}
          </p>

          {isLoggedIn ? (
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-charcoal text-klovers-yellow text-xs font-extrabold px-3 py-1">
                  {league.emoji} {league.name}
                </span>
                {streak > 0 && (
                  <span className="rounded-full bg-ivory border-2 border-charcoal text-xs font-bold px-3 py-0.5">
                    🔥 {isAr ? `${streak} يوم متتالي` : `${streak}-day streak`}
                  </span>
                )}
              </div>
              <div
                className="h-3.5 rounded-full bg-ivory border-2 border-charcoal overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={isAr ? "التقدّم للّيج الجاي" : "Progress to next league"}
              >
                <div className="h-full bg-charcoal" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between gap-2 text-xs font-semibold">
                <span>{totalXp.toLocaleString()} XP</span>
                {nextLeague && (
                  <span>
                    {isAr
                      ? `${(nextLeague.minXp - totalXp).toLocaleString()} XP لـ ${nextLeague.name}`
                      : `${(nextLeague.minXp - totalXp).toLocaleString()} XP to ${nextLeague.name}`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold">
              {isAr
                ? `${FREE_GAME_IDS.length} ألعاب مجانية من غير حساب`
                : `${FREE_GAME_IDS.length} games free, no account needed`}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            {continueGame && (
              <button
                type="button"
                onClick={() => onPlay(continueGame)}
                className="min-h-11 rounded-full bg-charcoal text-klovers-yellow border-2 border-charcoal px-5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                {isLoggedIn ? (isAr ? "كمّل الرحلة" : "Continue Journey") : (isAr ? "ابدأ العب" : "Start playing")}
              </button>
            )}
            {!isLoggedIn && (
              <a
                href="/signup"
                className="min-h-11 inline-flex items-center rounded-full bg-ivory text-charcoal border-2 border-charcoal px-5 text-sm font-bold"
              >
                {isAr ? "سجّل مجانًا" : "Sign up free"}
              </a>
            )}
          </div>
        </div>

        <div className="relative h-44 md:h-auto md:min-h-[240px] justify-self-end w-64 md:w-full" aria-hidden="true">
          <img
            src={`${ASSET}/cluby-hanbok.webp`}
            alt=""
            width={230}
            height={286}
            decoding="async"
            className="absolute bottom-0 start-6 h-32 md:h-40 w-auto"
          />
          <img
            src={`${ASSET}/girl-hanbok.webp`}
            alt=""
            width={204}
            height={460}
            decoding="async"
            className="absolute bottom-0 end-4 h-44 md:h-60 w-auto"
          />
        </div>
      </section>

      {/* Journey */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "رحلتك الكورية" : "Your Korean Journey"}</h2>
          <span className="text-xs text-muted-foreground">{isAr ? "Cluby بيوريك إنت فين" : "Cluby marks where you are"}</span>
        </div>
        <ol className="grid grid-cols-3 pt-6">
          {stats.map((s, i) => {
            const state = s.complete ? "done" : i === currentIdx ? "current" : "next";
            return (
              <li key={s.world.key} className="relative text-center px-1">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[30px] -start-1/2 w-full h-1.5 rounded-full",
                      stats[i - 1].complete ? "bg-charcoal" : "bg-border",
                    )}
                  >
                    {stats[i - 1].complete && <span className="block mx-auto mt-[2px] h-0.5 w-full bg-live-bright" />}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const g = nextGameIn(i);
                    if (g) onPlay(g);
                  }}
                  className="relative z-10 mx-auto flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground rounded-lg"
                >
                  <span
                    className={cn(
                      "relative w-16 h-16 rounded-full bg-card border-2 flex items-center justify-center p-2",
                      state === "done" && "border-charcoal dark:border-live-bright",
                      state === "current" && "border-charcoal ring-4 ring-klovers-yellow",
                      state === "next" && "border-border opacity-80",
                    )}
                  >
                    <KloverIcon name={s.world.icon} className="h-full w-full" />
                    {state === "done" && (
                      <span className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-live-bright border-2 border-charcoal flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-charcoal" strokeWidth={3} />
                      </span>
                    )}
                    {state === "current" && (
                      <img
                        src={`${ASSET}/cluby-market.webp`}
                        alt=""
                        aria-hidden="true"
                        width={230}
                        height={286}
                        className="absolute -top-8 -end-5 h-11 w-auto"
                      />
                    )}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {isAr ? s.world.nameAr : s.world.name}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] text-muted-foreground",
                      state === "current" && "bg-klovers-yellow text-charcoal font-extrabold rounded px-2",
                    )}
                  >
                    {state === "done"
                      ? (isAr ? "خلصت" : "Completed")
                      : state === "current"
                        ? (isAr ? "إنت هنا" : "You are here")
                        : (isAr ? "الجاية" : "Up next")}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* World cards */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "عوالم الألعاب" : "Game Worlds"}</h2>
          <span className="text-xs text-muted-foreground">{isAr ? "المرحلة الأولى — ٣ عوالم" : "Phase 1 — 3 worlds"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((s, i) => (
            <button
              key={s.world.key}
              type="button"
              onClick={() => {
                const g = nextGameIn(i);
                if (g) onPlay(g);
              }}
              className={cn(
                "text-start rounded-2xl bg-card border-2 border-charcoal dark:border-border p-4 hover:shadow-[4px_4px_0_hsl(var(--charcoal))] transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                i === stats.length - 1 && stats.length % 2 === 1 && "sm:col-span-2",
              )}
            >
              <KloverIcon name={s.world.icon} className="h-12 w-12 mb-2" />
              <h3 className="font-bold text-foreground">{isAr ? s.world.nameAr : s.world.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">{isAr ? s.world.descriptionAr : s.world.description}</p>
              <div className="h-2.5 rounded-full bg-charcoal border-2 border-charcoal overflow-hidden">
                <div className="h-full bg-live-bright" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isAr ? `${s.done} / ${s.total} ألعاب` : `${s.done} / ${s.total} games`}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Cluby collection — announced, not live */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "Clubys بتوعي" : "My Clubys"}</h2>
          <span className="text-xs font-bold rounded bg-klovers-yellow text-charcoal px-2 py-0.5">
            {isAr ? "قريبًا" : "Coming soon"}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {CLUBY_OUTFITS.map((o) => (
            <div key={o.key} className="text-center min-w-0">
              <div className="relative aspect-square rounded-2xl bg-muted border-2 border-border p-1.5">
                <img
                  src={`${ASSET}/cluby-${o.key}.webp`}
                  alt=""
                  aria-hidden="true"
                  width={230}
                  height={286}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain opacity-60 saturate-50"
                />
                <span className="absolute top-1 end-1 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground mt-1 truncate">{isAr ? o.nameAr : o.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {isAr
            ? "قريب هتقدر تجمع Cluby بلبس جديد مع كل عالم تخلّصه."
            : "Soon you'll collect a new Cluby outfit for every world you finish."}
        </p>
      </section>
    </div>
  );
};

export default GameWorldsHub;
