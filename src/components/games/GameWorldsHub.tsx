import { useEffect, useMemo, useState } from "react";
import { Check, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import { gameIconName } from "@/constants/gameIcons";
import { gameWorlds, CLUBY_OUTFITS, type GameWorld } from "@/constants/gameWorlds";
import { PalaceScene, WORLD_SCENES } from "@/components/games/WorldScenes";

/**
 * Top of /games: the Game Worlds hub.
 *
 * 23 Sep 2026 redesign - the painted version:
 *  - HERO: a yellow text column beside a painted palace courtyard (inline SVG,
 *    see WorldScenes.tsx) with the girl in hanbok standing in it. Cluby stands
 *    in the yellow column with his handwritten bubble ABOVE his head, so the
 *    bubble never sits on the headline. The chip on the scene states the real
 *    counts (worlds and games), interpolated, never typed.
 *  - JOURNEY: the three stops joined by a dashed road; Cluby stands over
 *    "You are here".
 *  - WORLD CARDS: each opens on its own painted scene with Cluby in that
 *    world's outfit, then the first four games with Play or a padlock, then
 *    "See all", which scrolls to the full grid below.
 *  - A short Cluby note closes the worlds: "Every game brings you closer to
 *    Korea".
 *
 * Data is unchanged from phase 1: XP and league from useGamification (via
 * GamesPage), "played" from student_xp rows whose activity_type is
 * `game_<id>`, and the free/locked state from FREE_GAME_IDS only.
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

/** Which Cluby stands in which world's scene. */
const WORLD_CLUBY: Record<GameWorld["key"], string> = {
  hangul_village: "cluby-scholar",
  vocabulary_market: "cluby-market",
  conversation_cafe: "cluby-cafe",
};

const PREVIEW_COUNT = 4;

const GameWorldsHub = ({ title, isLoggedIn, isAr, totalXp, streak, onPlay }: Props) => {
  const { t } = useLanguage();
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
  const gameTitle = (id: string) => {
    const g = GAMES_CATALOG.find((x) => x.id === id);
    return g ? t(g.titleKey) : id;
  };

  const stats = worlds.map((w) => {
    const done = w.gameIds.filter((id) => played.has(id)).length;
    return { world: w, done, total: w.gameIds.length, complete: w.gameIds.length > 0 && done === w.gameIds.length };
  });
  const currentIdx = Math.max(0, stats.findIndex((s) => !s.complete));
  const allComplete = stats.every((s) => s.complete);
  const totalGames = worlds.reduce((n, w) => n + w.gameIds.length, 0);

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

  const seeAll = () => {
    document.getElementById("all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-10">
      {/* ── Hero: yellow column + painted palace ─────────────────────── */}
      <section className="card-edge rounded-3xl overflow-hidden border-2 border-charcoal grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative bg-klovers-yellow text-charcoal p-6 md:p-8 flex flex-col gap-4">
          <h1 className="text-xs font-extrabold uppercase tracking-wider">{title}</h1>
          <p className="text-3xl md:text-4xl font-extrabold font-display leading-tight">
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

          {/* Cluby, bubble above his head. Handwriting (.cluby-note): his voice, never a button. */}
          <div className="mt-auto flex flex-col items-end self-end pt-2">
            <p className="cluby-bubble cluby-note mb-2" lang={isAr ? "ar" : "en"}>
              {isAr ? "دوّر عليّا النهارده!" : "Find me today!"}
            </p>
            <img
              src={`${ASSET}/cluby-hanbok.webp`}
              alt=""
              aria-hidden="true"
              width={230}
              height={286}
              decoding="async"
              className="h-24 md:h-28 w-auto"
            />
          </div>
        </div>

        <div className="relative min-h-[240px] md:min-h-[340px] bg-[#FFD0B8]">
          <PalaceScene className="absolute inset-0 h-full w-full" />
          <span className="absolute top-4 start-4 rounded-full bg-ivory/95 border-2 border-charcoal text-charcoal text-xs font-extrabold px-3 py-1 shadow-sm">
            {isAr ? `${worlds.length} عوالم · ${totalGames} لعبة` : `${worlds.length} worlds · ${totalGames} games`}
          </span>
          <img
            src={`${ASSET}/girl-hanbok.webp`}
            alt=""
            aria-hidden="true"
            width={204}
            height={460}
            decoding="async"
            className="absolute bottom-0 end-6 md:end-10 h-48 md:h-64 w-auto drop-shadow-[0_6px_10px_rgba(46,46,46,0.25)]"
          />
        </div>
      </section>

      {/* ── Journey ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "رحلتك الكورية" : "Your Korean Journey"}</h2>
          <span className="text-xs text-muted-foreground">{isAr ? "كلوبي بيوريك إنت فين" : "Cluby marks where you are"}</span>
        </div>
        <ol className="grid grid-cols-3 pt-8">
          {stats.map((s, i) => {
            const state = s.complete ? "done" : i === currentIdx ? "current" : "next";
            return (
              <li key={s.world.key} className="relative text-center px-1">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[31px] -start-1/2 w-full border-t-[3px] border-dashed",
                      stats[i - 1].complete ? "border-charcoal dark:border-live-bright" : "border-charcoal/35 dark:border-border",
                    )}
                  />
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
                        src={`${ASSET}/cluby-hanbok.webp`}
                        alt=""
                        aria-hidden="true"
                        width={230}
                        height={286}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-auto"
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

      {/* ── World cards ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "عوالم الألعاب" : "Game Worlds"}</h2>
          <span className="text-xs text-muted-foreground">
            {isAr ? `${worlds.length} عوالم · ${totalGames} لعبة` : `${worlds.length} worlds · ${totalGames} games`}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => {
            const Scene = WORLD_SCENES[s.world.key];
            const preview = s.world.gameIds.slice(0, PREVIEW_COUNT);
            return (
              <article
                key={s.world.key}
                className="flex flex-col rounded-2xl bg-card border-2 border-charcoal dark:border-border overflow-hidden"
              >
                <div className="relative h-32 border-b-2 border-charcoal dark:border-border">
                  <Scene className="absolute inset-0 h-full w-full" />
                  <img
                    src={`${ASSET}/${WORLD_CLUBY[s.world.key]}.webp`}
                    alt=""
                    aria-hidden="true"
                    width={230}
                    height={286}
                    loading="lazy"
                    decoding="async"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 h-24 w-auto drop-shadow-[0_4px_6px_rgba(46,46,46,0.3)]"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <KloverIcon name={s.world.icon} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground leading-tight">{isAr ? s.world.nameAr : s.world.name}</h3>
                      <p className="text-xs text-muted-foreground">{isAr ? s.world.descriptionAr : s.world.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-charcoal border-2 border-charcoal overflow-hidden">
                    <div className="h-full bg-live-bright" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? `${s.done} / ${s.total} ألعاب` : `${s.done} / ${s.total} games`}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {preview.map((id) => {
                      const open = canPlay(id);
                      const done = played.has(id);
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => onPlay(id)}
                            className="w-full flex items-center gap-2 rounded-xl border border-border bg-background/60 px-2 py-1.5 text-start hover:border-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                          >
                            <KloverIcon name={gameIconName(id)} className="h-7 w-7 shrink-0" />
                            <span className="flex-1 min-w-0 truncate text-sm font-semibold text-foreground">{gameTitle(id)}</span>
                            {done && <Check className="h-3.5 w-3.5 text-foreground shrink-0" strokeWidth={3} aria-label={isAr ? "لعبتها" : "Played"} />}
                            {open ? (
                              <span className="shrink-0 rounded-full bg-klovers-yellow text-charcoal border-2 border-charcoal px-2.5 py-0.5 text-[11px] font-bold">
                                {isAr ? "العب" : "Play"}
                              </span>
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label={isAr ? "للأعضاء" : "Members only"} />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    onClick={seeAll}
                    className="mt-3 self-start inline-flex items-center gap-1 text-sm font-bold text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground rounded"
                  >
                    {isAr ? `شوف الكل (${s.total})` : `See all (${s.total})`}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Cluby's note - his handwriting, closing the worlds. */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <img
            src={`${ASSET}/cluby-traveller.webp`}
            alt=""
            aria-hidden="true"
            width={230}
            height={286}
            loading="lazy"
            decoding="async"
            className="h-14 w-auto"
          />
          <p className="cluby-bubble cluby-note" lang={isAr ? "ar" : "en"}>
            {isAr ? "كل لعبة بتقرّبك من كوريا" : "Every game brings you closer to Korea"}
          </p>
        </div>
      </section>

      {/* ── Cluby collection — announced, not live ────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{isAr ? "مجموعة كلوبي" : "My Clubys"}</h2>
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
            ? "قريب هتقدر تجمع كلوبي بلبس جديد مع كل عالم تخلّصه."
            : "Soon you'll collect a new Cluby outfit for every world you finish."}
        </p>
      </section>

      {/* "See all" lands here: GamesPage renders the full grid right after the hub. */}
      <div id="all-games" className="scroll-mt-24" aria-hidden="true" />
    </div>
  );
};

export default GameWorldsHub;
