import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Lock, ArrowRight, Flame, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import { gameIconName } from "@/constants/gameIcons";
import { gameWorlds, CLUBY_OUTFITS, type GameWorld } from "@/constants/gameWorlds";
import { BannerScene, WORLD_SCENES, WORLD_STOPS } from "@/components/games/WorldScenes";
import { BOY_WAVE } from "@/assets/band/boyWave";

/**
 * Top of /games: the Game Worlds hub, in the style of Re's 23 Sep 2026 mockup,
 * with Klovers' own characters (the boy, Cluby, the girl in hanbok).
 *
 *  1. BANNER - a painted Seoul scene (inline SVG, WorldScenes.tsx). The boy
 *     waves on the left, the headline and Cluby sit in the middle, the girl
 *     cheers on the right; each has a speech bubble. A white card on the
 *     banner holds the league, XP bar and streak - all real.
 *  2. THREE CARDS - Next Cluby, Today's Missions, My Clubys.
 *  3. JOURNEY - the three worlds as small buildings on a dashed road, with
 *     Cluby over "You are here" and the 더 배우기 / 더 꿈꾸기 / 더 나은 나 sign.
 *  4. WORLD CARDS - painted header, number badge, games completed, the first
 *     four games with Play or Locked, and See all. Plus Cluby's quote card.
 *
 * NOTHING HERE IS INVENTED. The mockup shows a Cluby collection, clues and a
 * "collect 10 Clubys" reward; none of those exist yet, so:
 *  - Next Cluby is the current world's REAL progress, and says collecting
 *    opens soon;
 *  - My Clubys shows every outfit locked, marked "Coming soon";
 *  - Today's Missions are counted from today's real student_xp rows
 *    (activity_type `game_<id>`, created_at since local midnight);
 *  - there is no Special Reward card.
 * The free/locked state comes only from FREE_GAME_IDS.
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

type WorldKey = GameWorld["key"];

/** Which Cluby stands in which world. */
const WORLD_CLUBY: Record<WorldKey, string> = {
  hangul_village: "cluby-scholar",
  vocabulary_market: "cluby-market",
  conversation_cafe: "cluby-cafe",
};

/** Progress colour per world, as in the mockup: yellow, green, purple. */
const WORLD_BAR: Record<WorldKey, string> = {
  hangul_village: "bg-klovers-yellow",
  vocabulary_market: "bg-[#4CC38A]",
  conversation_cafe: "bg-[#9B8CF2]",
};
const WORLD_BADGE: Record<WorldKey, string> = {
  hangul_village: "bg-klovers-yellow text-charcoal",
  vocabulary_market: "bg-[#4CC38A] text-white",
  conversation_cafe: "bg-[#9B8CF2] text-white",
};

const PREVIEW_COUNT = 4;

/** A white speech bubble with a small tail. Handwriting: it is a character talking. */
const Bubble = ({ children, tail = "bottom", className, lang }: { children: ReactNode; tail?: "bottom" | "left" | "right"; className?: string; lang: string }) => (
  <div
    lang={lang}
    className={cn(
      "cluby-note relative rounded-[1.4rem] border-2 border-charcoal bg-white px-3 py-2 text-center text-[13px] leading-tight text-charcoal shadow-sm",
      className,
    )}
  >
    {children}
    <span
      aria-hidden="true"
      className={cn(
        "absolute h-3 w-3 rotate-45 border-charcoal bg-white",
        tail === "bottom" && "-bottom-[7px] left-1/2 -translate-x-1/2 border-b-2 border-r-2",
        tail === "left" && "top-1/2 -left-[7px] -translate-y-1/2 border-b-2 border-l-2",
        tail === "right" && "top-1/2 -right-[7px] -translate-y-1/2 border-t-2 border-r-2",
      )}
    />
  </div>
);

const GameWorldsHub = ({ title, isLoggedIn, isAr, totalXp, streak, onPlay }: Props) => {
  const { t } = useLanguage();
  const lang = isAr ? "ar" : "en";
  const worlds = useMemo(() => gameWorlds(), []);
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [playedToday, setPlayedToday] = useState<string[]>([]);
  const [firstName, setFirstName] = useState<string>("");

  // Re-read whenever XP moves: a finished game is exactly what changes it.
  useEffect(() => {
    if (!isLoggedIn) {
      setPlayed(new Set());
      setPlayedToday([]);
      setFirstName("");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("GameWorldsHub: could not read the session", sessionError);
        return;
      }
      const user = session?.user;
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const full = String(meta.full_name ?? meta.name ?? "").trim();
      if (!cancelled) setFirstName(full.split(/\s+/)[0] ?? "");

      const { data, error } = await supabase
        .from("student_xp")
        .select("activity_type, created_at")
        .eq("user_id", user.id)
        .like("activity_type", "game_%");
      if (error) console.error("GameWorldsHub: could not read played games", error);
      if (cancelled || error || !data) return;
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const rows = data as { activity_type: string | null; created_at: string | null }[];
      const idOf = (r: { activity_type: string | null }) => (r.activity_type ?? "").replace(/^game_/, "");
      setPlayed(new Set(rows.map(idOf)));
      setPlayedToday(rows.filter((r) => r.created_at && new Date(r.created_at) >= midnight).map(idOf));
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, totalXp]);

  const canPlay = (id: string) => isLoggedIn || FREE_GAME_IDS.includes(id);
  const catalogEntry = (id: string) => GAMES_CATALOG.find((x) => x.id === id);

  const stats = worlds.map((w) => {
    const done = w.gameIds.filter((id) => played.has(id)).length;
    return { world: w, done, total: w.gameIds.length, complete: w.gameIds.length > 0 && done === w.gameIds.length };
  });
  const currentIdx = Math.max(0, stats.findIndex((s) => !s.complete));
  const current = stats[currentIdx];
  const allComplete = stats.every((s) => s.complete);
  const totalGames = worlds.reduce((n, w) => n + w.gameIds.length, 0);

  const nextGameIn = (idx: number) => {
    const ids = worlds[idx]?.gameIds ?? [];
    return ids.find((id) => !played.has(id) && canPlay(id)) ?? ids.find(canPlay) ?? ids[0];
  };
  const continueGame = nextGameIn(allComplete ? 0 : currentIdx);

  const league = getLeague(totalXp);
  const nextLeague = LEAGUES[league.index + 1];
  const pct = nextLeague
    ? Math.min(100, Math.round(((totalXp - league.minXp) / (nextLeague.minXp - league.minXp)) * 100))
    : 100;

  // Today's missions - counted, never assumed.
  const todayIds = new Set(playedToday);
  const currentWorldName = current ? (isAr ? current.world.nameAr : current.world.name) : "";
  const missions = [
    { label: isAr ? "العب لعبة واحدة النهارده" : "Complete one game today", done: playedToday.length >= 1 },
    {
      label: isAr ? `العب لعبة من ${currentWorldName}` : `Play a game in ${currentWorldName}`,
      done: !!current && current.world.gameIds.some((id) => todayIds.has(id)),
    },
    { label: isAr ? "العب 3 ألعاب النهارده" : "Play 3 games today", done: playedToday.length >= 3 },
  ];
  const missionsDone = missions.filter((m) => m.done).length;

  const nextOutfit = current ? WORLD_CLUBY[current.world.key] : "cluby-market";

  const seeAll = () => {
    document.getElementById("all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const welcome = isLoggedIn
    ? (isAr ? `أهلًا بيك تاني${firstName ? ` يا ${firstName}` : ""}!` : `Welcome back${firstName ? `, ${firstName}` : ""}!`)
    : (isAr ? "العب واتعلم كوري!" : "Play your way into Korean!");

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* ── 1. Banner ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-charcoal/10 bg-[#FFF6DE] shadow-[0_18px_40px_-28px_rgba(46,46,46,0.6)]">
        <BannerScene className="absolute inset-0 h-full w-full" />

        <div className="relative grid min-h-[340px] grid-cols-[auto_minmax(0,1fr)_auto] items-end md:min-h-[360px]">
          {/* The boy, waving */}
          <div className="relative hidden self-end ps-4 sm:block md:ps-8">
            <Bubble lang={lang} tail="left" className="absolute top-8 start-[92%] w-28 md:w-32">
              {isAr ? "جاهز لتحدّي النهارده؟" : "Ready for today's challenge?"}
            </Bubble>
            <img src={BOY_WAVE} alt="" aria-hidden="true" width={71} height={200} decoding="async" className="h-56 w-auto md:h-72" />
          </div>

          {/* Headline + Cluby */}
          <div className="flex flex-col items-center gap-3 self-stretch px-4 pt-6 text-center md:items-start md:ps-16 md:text-start">
            <h1 className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal/70">{title}</h1>
            <p className="max-w-md font-display text-3xl font-extrabold leading-tight text-charcoal [text-shadow:0_2px_12px_#FFF6DE] md:text-4xl">{welcome}</p>
            <p className="max-w-md rounded-full bg-[#FFF6DE]/80 px-2 text-sm text-charcoal/80 md:text-base">
              {isAr ? "العب، اتعلم، وقرّب أكتر من كوريا!" : "Let's play, learn, and get closer to Korea!"}
            </p>
            <div className="mt-auto flex items-end gap-3">
              <img src={`${ASSET}/cluby-hanbok.webp`} alt="" aria-hidden="true" width={230} height={286} decoding="async" className="h-32 w-auto md:h-40" />
              <Bubble lang={lang} tail="left" className="mb-24 w-36 md:mb-28 md:w-40">
                {isAr ? "أنا مستخبّي في حتة النهارده! تقدر تلاقيني؟ 👀" : "I'm hiding somewhere today! Can you find me? 👀"}
              </Bubble>
            </div>
          </div>

          {/* The girl, cheering */}
          <div className="relative hidden self-end pe-4 md:block md:pe-8">
            <Bubble lang={lang} tail="bottom" className="absolute -top-2 end-4 w-28">
              {isAr ? "تقدر تعملها! 화이팅! ♥" : "You can do it! 화이팅! ♥"}
            </Bubble>
            <img
              src={`${ASSET}/girl-hanbok.webp`}
              alt=""
              aria-hidden="true"
              width={204}
              height={460}
              decoding="async"
              className="mt-16 h-64 w-auto md:h-72"
            />
          </div>
        </div>

        {/* Stats card - on the banner from md up, under it on phones */}
        <div className="relative mx-4 mb-4 rounded-2xl border border-charcoal/10 bg-white/95 p-4 text-charcoal shadow-lg md:absolute md:bottom-6 md:end-[13rem] md:mx-0 md:mb-0 md:w-[22rem]">
          {isLoggedIn ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className="min-w-0">
                <p className="text-sm font-extrabold">{league.emoji} {league.name}</p>
                <div
                  className="mt-2 h-2.5 rounded-full bg-charcoal/10 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isAr ? "التقدّم للّيج الجاي" : "Progress to next league"}
                >
                  <div className="h-full rounded-full bg-klovers-yellow" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-charcoal/70">
                  {totalXp.toLocaleString()} XP
                  {nextLeague && (isAr
                    ? ` · ${(nextLeague.minXp - totalXp).toLocaleString()} XP لـ ${nextLeague.name}`
                    : ` · ${(nextLeague.minXp - totalXp).toLocaleString()} XP to ${nextLeague.name}`)}
                </p>
              </div>
              <div className="border-s border-charcoal/10 ps-4">
                <p className="flex items-center gap-1 text-xl font-extrabold">
                  <Flame className="h-5 w-5 text-[#F26B3A]" aria-hidden="true" /> {streak}
                </p>
                <p className="text-[11px] text-charcoal/70">{isAr ? "يوم متتالي" : "day streak"}</p>
              </div>
              {continueGame && (
                <button
                  type="button"
                  onClick={() => onPlay(continueGame)}
                  className="col-span-2 min-h-10 rounded-full bg-charcoal px-4 text-sm font-bold text-klovers-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  {isAr ? "كمّل الرحلة" : "Continue Journey"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-extrabold">
                {isAr
                  ? `${FREE_GAME_IDS.length} ألعاب مجانية من غير حساب`
                  : `${FREE_GAME_IDS.length} games free, no account needed`}
              </p>
              <div className="flex flex-wrap gap-2">
                {continueGame && (
                  <button
                    type="button"
                    onClick={() => onPlay(continueGame)}
                    className="min-h-10 rounded-full bg-charcoal px-4 text-sm font-bold text-klovers-yellow"
                  >
                    {isAr ? "ابدأ العب" : "Start playing"}
                  </button>
                )}
                <a href="/signup" className="inline-flex min-h-10 items-center rounded-full border-2 border-charcoal bg-klovers-yellow px-4 text-sm font-bold text-charcoal">
                  {isAr ? "سجّل مجانًا" : "Sign up free"}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Next Cluby · Today's Missions · My Clubys ─────────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Next Cluby */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#FFF1C2]">
            <img
              src={`${ASSET}/${nextOutfit}.webp`}
              alt=""
              aria-hidden="true"
              width={230}
              height={286}
              loading="lazy"
              className="h-16 w-auto brightness-0 opacity-80"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground">{isAr ? "كلوبي الجاي" : "Next Cluby"}</h2>
            <p className="text-xs text-muted-foreground">
              {current
                ? (isAr ? `${current.done} / ${current.total} ألعاب في ${currentWorldName}` : `${current.done} / ${current.total} games in ${currentWorldName}`)
                : ""}
            </p>
            <div className="mt-2 flex gap-1">
              {(current?.world.gameIds ?? []).map((id) => (
                <span key={id} className={cn("h-2 flex-1 rounded-full", played.has(id) ? "bg-klovers-yellow" : "bg-muted")} />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {isAr ? "خلّص العالم ده عشان تقابل كلوبي الجاي — التجميع قريب." : "Finish this world to meet the next Cluby — collecting opens soon."}
            </p>
          </div>
        </div>

        {/* Today's Missions */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold text-foreground">{isAr ? "مهام النهارده" : "Today's Missions"}</h2>
            {isLoggedIn && <span className="text-sm font-extrabold text-foreground">{missionsDone} / {missions.length}</span>}
          </div>
          <ul className="mt-2 space-y-1.5">
            {missions.map((m) => (
              <li key={m.label} className="flex items-center gap-2 text-sm text-foreground">
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                    m.done ? "border-[#4CC38A] bg-[#4CC38A]" : "border-border",
                  )}
                >
                  {m.done && <Check className="h-3 w-3 text-white" strokeWidth={3} aria-label={isAr ? "خلصت" : "Done"} />}
                </span>
                {m.label}
              </li>
            ))}
          </ul>
          {!isLoggedIn && (
            <a href="/signup" className="mt-2 inline-block text-xs font-semibold text-foreground underline">
              {isAr ? "سجّل عشان مهامك تتحسب" : "Sign up to track your missions"}
            </a>
          )}
        </div>

        {/* My Clubys */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <img src={`${ASSET}/cluby-hanbok.webp`} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-12 w-auto" />
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-foreground">{isAr ? "مجموعة كلوبي" : "My Clubys"}</h2>
              <p className="text-xs text-muted-foreground">
                {isAr ? `${CLUBY_OUTFITS.length} أزياء` : `${CLUBY_OUTFITS.length} outfits`}
              </p>
            </div>
            <span className="rounded bg-klovers-yellow px-2 py-0.5 text-[11px] font-bold text-charcoal">{isAr ? "قريبًا" : "Coming soon"}</span>
          </div>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {CLUBY_OUTFITS.map((o) => (
              <div key={o.key} className="relative aspect-square rounded-lg bg-muted p-0.5" title={isAr ? o.nameAr : o.name}>
                <img
                  src={`${ASSET}/cluby-${o.key}.webp`}
                  alt=""
                  aria-hidden="true"
                  width={230}
                  height={286}
                  loading="lazy"
                  className="h-full w-full object-contain brightness-0 opacity-25"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Journey ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[#FFF8EA] p-5 dark:bg-card md:p-6">
        <div className="grid items-end gap-4 md:grid-cols-[11rem_minmax(0,1fr)_9rem]">
          <div>
            <h2 className="font-display text-2xl font-extrabold leading-tight text-charcoal dark:text-foreground">
              {isAr ? "رحلتك الكورية" : "Your Korean Journey"}
            </h2>
            <p className="mt-1 text-xs text-charcoal/70 dark:text-muted-foreground">
              {isAr ? "استكشف، العب، واتقن الكوري خطوة بخطوة!" : "Explore, play, and master Korean step by step!"}
            </p>
          </div>

          <ol className="relative grid grid-cols-3">
            {/* the dashed road behind the stops */}
            <svg className="pointer-events-none absolute inset-x-0 bottom-12 h-10 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M10 30 Q60 0 110 22 T210 18 T295 26" fill="none" stroke="#F2C94C" strokeWidth="2.5" strokeDasharray="6 6" />
            </svg>
            {stats.map((s, i) => {
              const Stop = WORLD_STOPS[s.world.key];
              const state = s.complete ? "done" : i === currentIdx ? "current" : "next";
              return (
                <li key={s.world.key} className="relative text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const g = nextGameIn(i);
                      if (g) onPlay(g);
                    }}
                    className="relative mx-auto flex flex-col items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                  >
                    <span className="relative">
                      <Stop className={cn("h-20 w-28 md:h-24 md:w-32", state === "next" && "opacity-80")} />
                      {state === "current" && (
                        <img
                          src={`${ASSET}/cluby-hanbok.webp`}
                          alt=""
                          aria-hidden="true"
                          width={230}
                          height={286}
                          className="absolute -top-4 -end-6 h-14 w-auto md:h-16"
                        />
                      )}
                      {state === "done" && (
                        <span className="absolute top-0 end-0 grid h-6 w-6 place-items-center rounded-full border-2 border-charcoal bg-live-bright">
                          <Check className="h-3.5 w-3.5 text-charcoal" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="-mt-2 grid h-6 w-6 place-items-center rounded-full bg-charcoal text-[11px] font-extrabold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-xs font-extrabold text-charcoal dark:text-foreground sm:text-sm">
                      {isAr ? s.world.nameAr : s.world.name}
                    </span>
                    {state === "current" && (
                      <span className="mt-0.5 rounded-full bg-klovers-yellow px-2 text-[11px] font-extrabold text-charcoal">
                        {isAr ? "إنت هنا!" : "You are here!"}
                      </span>
                    )}
                    {state === "done" && (
                      <span className="mt-0.5 text-[11px] text-muted-foreground">{isAr ? "خلصت" : "Completed"}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* The signpost */}
          <div className="hidden items-end gap-2 md:flex" aria-hidden="true">
            <div className="flex flex-col items-center">
              {["더 배우기", "더 꿈꾸기", "더 나은 나"].map((w, i) => (
                <span
                  key={w}
                  className={cn(
                    "rounded-md border-2 border-[#8B5E45] bg-[#C99A6E] px-2 py-0.5 text-xs font-extrabold text-white shadow-sm",
                    i % 2 ? "-rotate-3" : "rotate-2",
                  )}
                >
                  {w}
                </span>
              ))}
              <span className="h-8 w-2 rounded-b bg-[#8B5E45]" />
            </div>
          </div>
        </div>
        <p className="cluby-note mt-3 text-end text-sm text-charcoal/70 dark:text-muted-foreground" lang={lang}>
          {isAr ? "نفس الخطوات الصغيرة، نسخة أكبر منك ♡" : "Same small steps, a bigger you ♡"}
        </p>
      </section>

      {/* ── 4. World cards + Cluby's quote ────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_12rem]">
        {stats.map((s, i) => {
          const Scene = WORLD_SCENES[s.world.key];
          const preview = s.world.gameIds.slice(0, PREVIEW_COUNT);
          return (
            <article key={s.world.key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative h-36">
                <Scene className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent rtl:bg-gradient-to-l" />
                <img
                  src={`${ASSET}/${WORLD_CLUBY[s.world.key]}.webp`}
                  alt=""
                  aria-hidden="true"
                  width={230}
                  height={286}
                  loading="lazy"
                  decoding="async"
                  className="absolute bottom-1 end-3 h-24 w-auto drop-shadow-[0_4px_6px_rgba(46,46,46,0.3)]"
                />
                <div className="relative p-4 pe-28 text-charcoal">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold", WORLD_BADGE[s.world.key])}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-extrabold leading-tight">{isAr ? s.world.nameAr : s.world.name}</h3>
                  <p className="text-xs text-charcoal/75">{isAr ? s.world.descriptionAr : s.world.description}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3">
                <div className="flex items-center gap-3">
                  <p className="shrink-0 text-xs font-semibold text-foreground">
                    {isAr ? `${s.done} / ${s.total} ألعاب خلصت` : `${s.done} / ${s.total} games completed`}
                  </p>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", WORLD_BAR[s.world.key])} style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {preview.map((id) => {
                    const entry = catalogEntry(id);
                    const open = canPlay(id);
                    const done = played.has(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onPlay(id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-2 text-start transition-colors hover:border-charcoal/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
                            <KloverIcon name={gameIconName(id)} className="h-7 w-7" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1 text-sm font-bold leading-tight text-foreground">
                              {entry ? t(entry.titleKey) : id}
                              {done && <Check className="h-3.5 w-3.5 shrink-0 text-[#4CC38A]" strokeWidth={3} aria-label={isAr ? "لعبتها" : "Played"} />}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">{entry ? t(entry.descKey) : ""}</span>
                          </span>
                          {open ? (
                            <span className="shrink-0 rounded-full bg-klovers-yellow px-2.5 py-1 text-xs font-bold text-charcoal">
                              {isAr ? "العب" : "Play"}
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {isAr ? "مقفولة" : "Locked"} <Lock className="h-3 w-3" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={seeAll}
                  className="mt-3 inline-flex items-center gap-1 self-start rounded text-sm font-bold text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {isAr ? `شوف الكل (${s.total})` : `See all (${s.total})`}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            </article>
          );
        })}

        {/* Cluby's quote */}
        <aside className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-[#FFF8EA] p-4 dark:bg-card sm:flex-row md:col-span-3 xl:col-span-1 xl:flex-col xl:items-stretch">
          <p className="cluby-note text-base leading-snug text-charcoal dark:text-foreground" lang={lang}>
            {isAr ? "“كل لعبة بتقرّبك من حلمك الكوري.”" : "“Every game brings you closer to your Korean dream.”"}
            <span className="mt-1 block text-sm">— {isAr ? "كلوبي" : "Cluby"}</span>
          </p>
          <img src={`${ASSET}/cluby-traveller.webp`} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-28 w-auto self-end" />
          <button
            type="button"
            onClick={seeAll}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-charcoal bg-klovers-yellow px-4 py-2 text-sm font-bold text-charcoal"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            {isAr ? `كل الألعاب (${totalGames})` : `All ${totalGames} games`}
          </button>
        </aside>
      </section>

      {/* "See all" lands here: GamesPage renders the full grid right after the hub. */}
      <div id="all-games" className="scroll-mt-24" aria-hidden="true" />
    </div>
  );
};

export default GameWorldsHub;
