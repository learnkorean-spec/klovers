import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Check, Lock, ArrowRight, Flame, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import { gameIconName } from "@/constants/gameIcons";
import { gameWorlds, CLUBY_OUTFITS, type GameWorld } from "@/constants/gameWorlds";
import { WORLD_SCENES, WORLD_STOPS } from "@/components/games/WorldScenes";
import { isClubyAwake } from "@/lib/clubyAwake";
import { toArabicDigits } from "@/lib/trustFigures";
import { leagueName } from "@/lib/dashboardLocale";

/**
 * Top of /games: the Game Worlds hub, in the style of Re's 23 Sep 2026 mockup,
 * with Klovers' own characters (the boy, Cluby, the girl in hanbok).
 *
 *  1. BANNER - one of the story scenes with Klovers' real characters (the
 *     two learners and, once he has hatched, Cluby): before the hatch the
 *     learners find the glowing clover egg (/assets/story/egg-teaser.webp),
 *     after it the three of them picnic by the Han river
 *     (/assets/cluby/picnic.webp). The headline sits over it and an ivory
 *     strip underneath (card-coloured in dark mode) holds the
 *     league, XP bar and streak - all real.
 *  2. THREE CARDS - Next outfit, Today's Missions, Cluby's outfits.
 *  3. JOURNEY - the three worlds as their story paintings on a dashed road,
 *     with Cluby over "You are here" and the 더 배우기 / 더 꿈꾸기 / 더 나은 나 sign.
 *  4. WORLD CARDS - painted header, number badge, games completed, the first
 *     four games with Play or Locked, and See all. Plus Cluby's quote card.
 *
 * The world paintings are the story-canon scenes in /assets/story/
 * (the same ones the homepage roadmap uses). If one fails to load, the old
 * inline-SVG building/scene is drawn instead, so nothing ever shows broken.
 *
 * NOTHING HERE IS INVENTED. The mockup shows a Cluby collection, clues and a
 * "collect 10 Clubys" reward; none of those exist yet, so:
 *  - Next outfit is the current world's REAL progress, and says the
 *    outfit unlock is coming soon;
 *  - Cluby's outfits shows every outfit locked, marked "Coming soon";
 *  - Today's Missions are counted from today's real student_xp rows
 *    (activity_type `game_<id>`, created_at since local midnight);
 *  - there is no Special Reward card.
 * The free/locked state comes only from FREE_GAME_IDS.
 *
 * CLUBY FOLLOWS THE EGG (story canon, src/config/klovers-world.ts): nobody
 * sees Cluby before his egg hatches. Until the student dashboard has marked
 * him awake (lib/clubyAwake.ts) - and always for visitors who are not signed
 * in - this page shows the clover egg instead: no Cluby picture, no Cluby
 * outfits, no line in his voice. Once he is awake he appears in the 3D plush
 * style from /assets/cluby/.
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

/** Arabic counted noun for "game": 3–10 take the plural «ألعاب», every other
 *  count (11+, and the total in "x / y") takes the singular «لعبة». */
const arGames = (n: number) => {
  const m = n % 100;
  return m >= 3 && m <= 10 ? "ألعاب" : "لعبة";
};

const ASSET = "/assets/characters";
/** Cluby in the canon 3D plush style (only shown once he has hatched). */
const CLUBY_3D = "/assets/cluby/cluby-hanbok.webp";
const CLUBY_3D_WAVE = "/assets/cluby/cluby-wave.webp";

/** The clover egg in the story's own 3D style, shown where Cluby would be before he hatches. */
const EGG = "/assets/story/egg-0.webp";
/** Banner scenes with the real characters (story canon). */
const BANNER_BEFORE_HATCH = "/assets/story/egg-teaser.webp";
const BANNER_AFTER_HATCH = "/assets/cluby/picnic.webp";

type WorldKey = GameWorld["key"];

/** Which Cluby stands in which world. */
const WORLD_CLUBY: Record<WorldKey, string> = {
  hangul_village: "cluby-scholar",
  vocabulary_market: "cluby-market",
  conversation_cafe: "cluby-cafe",
};

/** The story-canon painting for each world (same files as the homepage roadmap). */
const WORLD_PAINTING: Record<WorldKey, string> = {
  hangul_village: "/assets/story/world-hangul-village.webp",
  vocabulary_market: "/assets/story/world-vocabulary-market.webp",
  conversation_cafe: "/assets/story/world-conversation-cafe.webp",
};

/** A world's painting; falls back to the drawn SVG if the file can't load. */
const WorldPainting = ({
  worldKey,
  Fallback,
  className,
  lazy = false,
}: {
  worldKey: WorldKey;
  Fallback: ComponentType<{ className?: string }>;
  className?: string;
  lazy?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback className={className} />;
  return (
    <img
      src={WORLD_PAINTING[worldKey]}
      alt=""
      aria-hidden="true"
      width={1600}
      height={900}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
};

/** Progress is always Klovers green (#39FF14): green means progress. */
const WORLD_BAR: Record<WorldKey, string> = {
  hangul_village: "bg-klovers-green",
  vocabulary_market: "bg-klovers-green",
  conversation_cafe: "bg-klovers-green",
};
const WORLD_BADGE: Record<WorldKey, string> = {
  hangul_village: "bg-klovers-yellow text-charcoal",
  vocabulary_market: "bg-klovers-green text-charcoal",
  conversation_cafe: "bg-charcoal text-klovers-yellow",
};

const PREVIEW_COUNT = 4;

const GameWorldsHub = ({ title, isLoggedIn, isAr, totalXp, streak, onPlay }: Props) => {
  const { t } = useLanguage();
  const lang = isAr ? "ar" : "en";
  const worlds = useMemo(() => gameWorlds(), []);
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [playedToday, setPlayedToday] = useState<string[]>([]);
  const [firstName, setFirstName] = useState<string>("");
  // Visitors who are not signed in never meet Cluby here: the egg is the teaser.
  const clubyAwake = useMemo(() => isLoggedIn && isClubyAwake(), [isLoggedIn]);

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

  // Arabic page: Arabic-Indic digits throughout, matching the points toast.
  const num = (n: number | string) => (isAr ? toArabicDigits(n) : String(n));

  const league = getLeague(totalXp);
  const nextLeague = LEAGUES[league.index + 1];
  const pct = nextLeague
    ? Math.min(100, Math.round(((totalXp - league.minXp) / (nextLeague.minXp - league.minXp)) * 100))
    : 100;

  // Today's missions - counted, never assumed.
  const todayIds = new Set(playedToday);
  const currentWorldName = current ? (isAr ? current.world.nameAr : current.world.name) : "";
  const missions = [
    { label: isAr ? "إكمال لعبة واحدة اليوم" : "Complete one game today", done: playedToday.length >= 1 },
    {
      label: isAr ? `لعب لعبة في ${currentWorldName}` : `Play a game in ${currentWorldName}`,
      done: !!current && current.world.gameIds.some((id) => todayIds.has(id)),
    },
    { label: isAr ? `لعب ${num(3)} ألعاب اليوم` : "Play 3 games today", done: playedToday.length >= 3 },
  ];
  const missionsDone = missions.filter((m) => m.done).length;

  const nextOutfit = current ? WORLD_CLUBY[current.world.key] : "cluby-market";

  const seeAll = () => {
    document.getElementById("all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const welcome = isLoggedIn
    ? (isAr ? `مرحبًا بالعودة${firstName ? ` يا ${firstName}` : ""}` : `Welcome back${firstName ? `, ${firstName}` : ""}!`)
    : (isAr ? "تعلُّم الكورية باللعب" : "Play your way into Korean!");

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* ── 1. Banner: a story scene with the real characters ─────────── */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_40px_-28px_rgba(46,46,46,0.6)]">
        <div className="relative min-h-[300px] md:min-h-[380px]">
          <img
            src={clubyAwake ? BANNER_AFTER_HATCH : BANNER_BEFORE_HATCH}
            alt={clubyAwake
              ? (isAr ? "الصديقان وكلوبي في نزهة على ضفاف نهر الهان" : "The two friends and Cluby having a picnic by the Han river")
              : (isAr ? "الصديقان يكتشفان بيضة البرسيم المضيئة في ساحة هانوك" : "The two friends discovering the glowing clover egg in a hanok courtyard")}
            width={1600}
            height={900}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_65%]"
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b to-transparent",
              clubyAwake ? "from-ivory/90 via-ivory/50" : "from-charcoal/80 via-charcoal/40",
            )}
          />
          <div className={cn("relative px-5 pt-6 text-center md:px-8 md:pt-8", clubyAwake ? "text-charcoal" : "text-ivory")}>
            <h1 className={cn("text-[11px] font-extrabold uppercase tracking-wider", clubyAwake ? "text-charcoal/70" : "text-ivory/80")}>{title}</h1>
            <p className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">{welcome}</p>
            <p className={cn("mt-1 text-sm md:text-base", clubyAwake ? "text-charcoal/80" : "text-ivory/90")}>
              {clubyAwake
                ? (isAr ? "لعبٌ وتعلُّمٌ، وخطوةٌ أقرب إلى كوريا." : "Let's play, learn, and get closer to Korea!")
                : (isAr ? "تستيقظ بيضة البرسيم قليلًا مع كل كلمة كورية جديدة…" : "The clover egg stirs a little more with every Korean word you learn…")}
            </p>
          </div>
        </div>

        {/* Stats strip - under the scene so it never covers the characters */}
        <div className="border-t border-charcoal/10 bg-ivory p-4 text-charcoal dark:border-border dark:bg-card dark:text-foreground md:px-6">
          {isLoggedIn ? (
            <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="min-w-0">
                <p className="text-sm font-extrabold"><KloverIcon name="game-crown" className="me-1 inline-block h-5 w-5 align-middle" />{leagueName(league, lang)}</p>
                <div
                  className="mt-2 h-2.5 rounded-full bg-charcoal/10 dark:bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isAr ? "التقدّم نحو الدوري التالي" : "Progress to next league"}
                >
                  <div className="h-full rounded-full bg-klovers-green" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-charcoal/70 dark:text-muted-foreground">
                  {isAr ? `${num(totalXp)} من نقاط الخبرة` : `${totalXp.toLocaleString()} XP`}
                  {nextLeague && (isAr
                    ? ` · ${num(nextLeague.minXp - totalXp)} نقطة خبرة حتى ${leagueName(nextLeague, lang)}`
                    : ` · ${(nextLeague.minXp - totalXp).toLocaleString()} XP to ${nextLeague.name}`)}
                </p>
              </div>
              <div className="sm:border-s sm:border-charcoal/10 dark:sm:border-border sm:ps-4">
                <p className="flex items-center gap-1 text-xl font-extrabold">
                  <Flame className="h-5 w-5 fill-klovers-yellow text-foreground" aria-hidden="true" /> {num(streak)}
                </p>
                <p className="text-[11px] text-charcoal/70 dark:text-muted-foreground">{isAr ? "يوم متتالي" : "day streak"}</p>
              </div>
              {continueGame && (
                <button
                  type="button"
                  onClick={() => onPlay(continueGame)}
                  className="min-h-11 rounded-full bg-charcoal px-6 text-sm font-bold text-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {isAr ? "مواصلة الرحلة" : "Continue Journey"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-extrabold">
                {isAr
                  ? `${num(FREE_GAME_IDS.length)} ألعاب مجانية بلا حساب`
                  : `${FREE_GAME_IDS.length} games free, no account needed`}
              </p>
              <div className="flex flex-wrap gap-2">
                {continueGame && (
                  <button
                    type="button"
                    onClick={() => onPlay(continueGame)}
                    className="min-h-10 rounded-full bg-charcoal px-4 text-sm font-bold text-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
                  >
                    {isAr ? "بدء اللعب" : "Start playing"}
                  </button>
                )}
                <a href="/signup" className="inline-flex min-h-10 items-center rounded-full border-2 border-charcoal bg-klovers-yellow px-4 text-sm font-bold text-charcoal">
                  {isAr ? "إنشاء حساب مجاني" : "Sign up free"}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Next outfit · Today's Missions · Cluby's outfits ──────── */}
      <section className={cn("grid gap-4", clubyAwake ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {/* Before the hatch: the egg card stands where Cluby's outfit cards will be. */}
        {!clubyAwake && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-ivory dark:bg-muted">
              <img src={EGG} alt="" aria-hidden="true" width={512} height={512} loading="lazy" className="h-16 w-auto object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-foreground">{isAr ? "بيضة البرسيم" : "The clover egg"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isLoggedIn
                  ? (isAr ? "تتابع لوحة الطالب البيضة: أول كلمة، ثم أول جملة، ثم أول محادثة… وبعدها يظهر مَن في داخلها." : "Follow the egg on your dashboard: first word, first sentence, first conversation… then we'll see who's inside.")
                  : (isAr ? "إنشاء حساب وبدء التعلّم يوقظان البيضة." : "Sign up and start learning to wake the egg.")}
              </p>
              <a href={isLoggedIn ? "/dashboard" : "/signup"} className="mt-2 inline-block text-xs font-semibold text-foreground underline">
                {isLoggedIn ? (isAr ? "الانتقال إلى اللوحة" : "Go to my dashboard") : (isAr ? "إنشاء حساب مجاني" : "Sign up free")}
              </a>
            </div>
          </div>
        )}

        {/* Next outfit */}
        {clubyAwake && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-ivory dark:bg-muted">
            <img
              src={`${ASSET}/${nextOutfit}.webp`}
              alt=""
              aria-hidden="true"
              width={230}
              height={286}
              loading="lazy"
              className="h-16 w-auto brightness-0 opacity-80 dark:invert"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground">{isAr ? "الزي التالي" : "Next outfit"}</h2>
            <p className="text-xs text-muted-foreground">
              {current
                ? (isAr ? `${num(current.done)} / ${num(current.total)} ${arGames(current.total)} في ${currentWorldName}` : `${current.done} / ${current.total} games in ${currentWorldName}`)
                : ""}
            </p>
            <div className="mt-2 flex gap-1">
              {(current?.world.gameIds ?? []).map((id) => (
                <span key={id} className={cn("h-2 flex-1 rounded-full", played.has(id) ? "bg-klovers-green" : "bg-muted")} />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {isAr ? "إنهاء هذا العالم يفتح زي كلوبي التالي — قريبًا." : "Finish this world to unlock Cluby's next outfit — coming soon."}
            </p>
          </div>
        </div>
        )}

        {/* Today's Missions */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold text-foreground">{isAr ? "مهام اليوم" : "Today's Missions"}</h2>
            {isLoggedIn && <span className="text-sm font-extrabold text-foreground">{num(missionsDone)} / {num(missions.length)}</span>}
          </div>
          <ul className="mt-2 space-y-1.5">
            {missions.map((m) => (
              <li key={m.label} className="flex items-center gap-2 text-sm text-foreground">
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                    m.done ? "border-charcoal bg-klovers-green" : "border-border",
                  )}
                >
                  {m.done && <Check className="h-3 w-3 text-charcoal" strokeWidth={3} aria-label={isAr ? "مكتملة" : "Done"} />}
                </span>
                {m.label}
              </li>
            ))}
          </ul>
          {!isLoggedIn && (
            <a href="/signup" className="mt-2 inline-block text-xs font-semibold text-foreground underline">
              {isAr ? "إنشاء حساب لاحتساب المهام" : "Sign up to track your missions"}
            </a>
          )}
        </div>

        {/* Cluby's outfits */}
        {clubyAwake && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <img src={CLUBY_3D} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-12 w-auto object-contain" />
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-foreground">{isAr ? "أزياء كلوبي" : "Cluby's outfits"}</h2>
              <p className="text-xs text-muted-foreground">
                {isAr ? `${num(CLUBY_OUTFITS.length)} أزياء` : `${CLUBY_OUTFITS.length} outfits`}
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
        )}
      </section>

      {/* ── 3. Journey ────────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-ivory p-5 dark:bg-card md:p-6">
        <div className="grid items-end gap-4 md:grid-cols-[11rem_minmax(0,1fr)_9rem]">
          <div>
            <h2 className="font-display text-2xl font-extrabold leading-tight text-charcoal dark:text-foreground">
              {isAr ? "الرحلة الكورية" : "Your Korean Journey"}
            </h2>
            <p className="mt-1 text-xs text-charcoal/70 dark:text-muted-foreground">
              {isAr ? "استكشاف ولعب وإتقان للكورية، خطوة بعد خطوة." : "Explore, play, and master Korean step by step!"}
            </p>
          </div>

          <ol className="relative grid grid-cols-3 gap-2 sm:gap-4">
            {/* the dashed road behind the stops */}
            <svg className="pointer-events-none absolute inset-x-0 bottom-12 h-10 w-full text-charcoal/30 dark:text-klovers-yellow/60" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M10 30 Q60 0 110 22 T210 18 T295 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" />
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
                    className="relative mx-auto flex w-full flex-col items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                  >
                    <span className="relative block w-full max-w-[13rem]">
                      <WorldPainting
                        worldKey={s.world.key}
                        Fallback={Stop}
                        className={cn(
                          "aspect-[16/10] w-full rounded-2xl border-[3px] shadow-md",
                          state === "current" ? "border-klovers-yellow" : "border-ivory",
                          state === "next" && "opacity-80",
                        )}
                      />
                      {state === "current" && (
                        clubyAwake ? (
                          <img
                            src={CLUBY_3D_WAVE}
                            alt=""
                            aria-hidden="true"
                            width={230}
                            height={286}
                            className="absolute -top-5 -end-4 h-14 w-auto object-contain drop-shadow md:h-16"
                          />
                        ) : (
                          <img src={EGG} alt="" aria-hidden="true" width={512} height={512} className="absolute -top-5 -end-3 h-12 w-auto object-contain drop-shadow md:h-14" />
                        )
                      )}
                      {state === "done" && (
                        <span className="absolute top-2 end-2 grid h-7 w-7 place-items-center rounded-full border-2 border-charcoal bg-klovers-green">
                          <Check className="h-3.5 w-3.5 text-charcoal" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="-mt-3 relative grid h-6 w-6 place-items-center rounded-full bg-charcoal text-[11px] font-extrabold text-ivory dark:bg-klovers-yellow dark:text-charcoal">
                      {num(String(i + 1).padStart(2, "0"))}
                    </span>
                    <span className="mt-1 text-xs font-extrabold text-charcoal dark:text-foreground sm:text-sm">
                      {isAr ? s.world.nameAr : s.world.name}
                    </span>
                    {state === "current" && (
                      <span className="mt-0.5 rounded-full bg-klovers-yellow px-2 text-[11px] font-extrabold text-charcoal">
                        {isAr ? "المحطة الحالية" : "You are here!"}
                      </span>
                    )}
                    {state === "done" && (
                      <span className="mt-0.5 text-[11px] text-muted-foreground">{isAr ? "مكتمل" : "Completed"}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* The signpost */}
          <div className="hidden items-end gap-2 md:flex" aria-hidden="true">
            <div className="flex flex-col items-center" lang="ko" dir="ltr">
              {["더 배우기", "더 꿈꾸기", "더 나은 나"].map((w, i) => (
                <span
                  key={w}
                  className={cn(
                    "rounded-md border-2 border-charcoal bg-charcoal px-2 py-0.5 font-ko text-xs font-extrabold text-klovers-yellow shadow-sm dark:border-klovers-yellow",
                    i % 2 ? "-rotate-3" : "rotate-2",
                  )}
                >
                  {w}
                </span>
              ))}
              <span className="h-8 w-2 rounded-b bg-charcoal dark:bg-klovers-yellow" />
            </div>
          </div>
        </div>
        <p className="cluby-note mt-3 text-end text-sm text-charcoal/70 dark:text-muted-foreground" lang={lang}>
          {isAr ? "الخطوات الصغيرة نفسها، ونسخة أكبر من الأمس" : "Same small steps, a bigger you."}
        </p>
      </section>

      {/* ── 4. World cards + Cluby's quote ──────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_12rem]">
        {stats.map((s, i) => {
          const Scene = WORLD_SCENES[s.world.key];
          const preview = s.world.gameIds.slice(0, PREVIEW_COUNT);
          return (
            <article key={s.world.key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative h-36">
                <WorldPainting worldKey={s.world.key} Fallback={Scene} lazy className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-ivory/90 via-ivory/55 to-transparent dark:from-card/90 dark:via-card/55 rtl:bg-gradient-to-l" />
                {clubyAwake && (
                  <img
                    src={CLUBY_3D}
                    alt=""
                    aria-hidden="true"
                    width={230}
                    height={286}
                    loading="lazy"
                    decoding="async"
                    className="absolute bottom-1 end-3 h-24 w-auto object-contain drop-shadow-[0_4px_6px_rgba(46,46,46,0.3)]"
                  />
                )}
                <div className={cn("relative p-4 text-charcoal dark:text-foreground", clubyAwake && "pe-28")}>
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold", WORLD_BADGE[s.world.key])}>
                    {num(String(i + 1).padStart(2, "0"))}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-extrabold leading-tight">{isAr ? s.world.nameAr : s.world.name}</h3>
                  <p className="text-xs text-charcoal/80 dark:text-foreground/80">{isAr ? s.world.descriptionAr : s.world.description}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3">
                <div className="flex items-center gap-3">
                  <p className="shrink-0 text-xs font-semibold text-foreground">
                    {isAr ? `${num(s.done)} / ${num(s.total)} ${arGames(s.total)} مكتملة` : `${s.done} / ${s.total} games completed`}
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
                          className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-2 text-start transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
                            <KloverIcon name={gameIconName(id)} className="h-7 w-7" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1 text-sm font-bold leading-tight text-foreground">
                              {entry ? t(entry.titleKey) : id}
                              {done && <Check className="h-4 w-4 shrink-0 rounded-full bg-klovers-green p-0.5 text-charcoal" strokeWidth={3} aria-label={isAr ? "تم لعبها" : "Played"} />}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">{entry ? t(entry.descKey) : ""}</span>
                          </span>
                          {open ? (
                            <span className="shrink-0 rounded-full bg-klovers-yellow px-2.5 py-1 text-xs font-bold text-charcoal">
                              {isAr ? "لعب" : "Play"}
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {isAr ? "مقفلة" : "Locked"} <Lock className="h-3 w-3" aria-hidden="true" />
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
                  {isAr ? `عرض الكل (${num(s.total)})` : `See all (${s.total})`}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            </article>
          );
        })}

        {/* Cluby's quote (before he hatches: the same line, no signature, the egg) */}
        <aside className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-ivory p-4 dark:bg-card sm:flex-row md:col-span-3 xl:col-span-1 xl:flex-col xl:items-stretch">
          <p className={cn("text-base leading-snug text-charcoal dark:text-foreground", clubyAwake ? "cluby-note" : "font-semibold")} lang={lang}>
            {isAr ? "“كل لعبة خطوةٌ أقرب إلى الحلم الكوري.”" : "“Every game brings you closer to your Korean dream.”"}
            {clubyAwake && <span className="mt-1 block text-sm">— {isAr ? "كلوبي" : "Cluby"}</span>}
          </p>
          {clubyAwake ? (
            <img src={CLUBY_3D_WAVE} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-28 w-auto self-end object-contain" />
          ) : (
            <img src={EGG} alt="" aria-hidden="true" width={512} height={512} loading="lazy" className="h-20 w-auto self-end object-contain" />
          )}
          <button
            type="button"
            onClick={seeAll}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-charcoal bg-klovers-yellow px-4 py-2 text-sm font-bold text-charcoal"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            {isAr ? `كل الألعاب (${num(totalGames)})` : `All ${totalGames} games`}
          </button>
        </aside>
      </section>

      {/* "See all" scrolls to id="all-games", which sits on the games-list
          section in GamesPage itself (not here: the KLOVERS World card is
          rendered between the hub and the list, so a marker at the end of the
          hub landed on that card instead). */}
    </div>
  );
};

export default GameWorldsHub;
