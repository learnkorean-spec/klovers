import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, ArrowRight, Zap, Trophy, Unlock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import HangulMiniGame from "./HangulMiniGame";
import { GameScene, type GameSceneKind } from "./roadmapScenery";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import GameIcon from "@/components/GameIcon";

/**
 * The games teased on the homepage, in the order they sit around the arcade
 * cabinet. Picked by id, not "first N of the catalog" - GAMES_CATALOG is
 * ordered by curriculum progression, and this is a highlight reel, so it keeps
 * its own curated order. Titles, descriptions and free-status still come from
 * the shared catalog, so they can never drift from what /games shows.
 *
 * "hangul" is not in the list on purpose: it is the game the cabinet PLAYS
 * (see HangulMiniGame), so a second card for it would be the same game twice.
 */
const HOMEPAGE_GAME_IDS = ["match", "kdrama", "sentence", "numbers", "colors"];
const HOMEPAGE_GAMES = HOMEPAGE_GAME_IDS
  .map((id) => GAMES_CATALOG.find((g) => g.id === id))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

/** Which drawn scene each game wears - see GameScene in roadmapScenery.tsx. */
const SCENE_FOR: Record<string, GameSceneKind> = {
  match: "match",
  kdrama: "kdrama",
  sentence: "sentence",
  numbers: "numbers",
  colors: "colors",
};

/** Per-tile surface and tilt, by position. Whole literal class strings on
 *  purpose: Tailwind's scanner only keeps what it can see. The tilt is a
 *  sticker-on-a-desk lean; hover straightens and lifts it. */
const TILE_LOOK = [
  "bg-card md:-rotate-1",
  "bg-ivory dark:bg-card md:rotate-1",
  "bg-card md:rotate-1",
  "bg-ivory dark:bg-card md:-rotate-1",
  "bg-card md:rotate-1",
];

/** Small marketing accent — not part of the shared catalog on purpose,
 *  since "hot" is a homepage presentation choice, not a fact about the game.
 *  This badge is ONE of the two places pink is still allowed: it has to read
 *  as unlike anything else on the card, and two of six is rare. */
const HOT_GAME_IDS = new Set(["match", "kdrama"]);

const HomeGamesSection = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const totalGames = GAMES_CATALOG.length;

  // Derived from the same catalog GamesPage reads, so this row can never say
  // something GamesPage itself would contradict (it used to say "13 Games"
  // hardcoded, well after the page had grown to 20).
  const STATS = [
    { icon: Gamepad2, value: String(totalGames), label: tr("Games", "لعبة") },
    { icon: Zap, value: "+XP", label: tr("Every Win", "كل فوز") },
    { icon: Unlock, value: String(FREE_GAME_IDS.length), label: tr("No Signup Needed", "بدون تسجيل") },
    { icon: Trophy, value: tr("Free", "مجاني"), label: tr("Forever", "للأبد") },
  ];

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-4 relative overflow-hidden bg-muted/20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-klovers-yellow/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-klovers-yellow/15 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-klovers-yellow text-charcoal px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-charcoal/10 shadow-sm">
            <Gamepad2 className="h-4 w-4" />
            {t("games.learnPlay")}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
            {t("games.homeTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            {t("games.homeSubtitle")}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
                <div className="h-7 w-7 rounded-lg bg-klovers-yellow border border-charcoal/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-sm leading-none">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THE TICKER: every game in the catalog, scrolling past. The count in
            the stats row says "20"; this is what 20 looks like. Paused on
            hover, and still (scrollable) when the visitor asks for less
            motion. dir=ltr so the loop direction is the same in both scripts. */}
        <style>{`
          @keyframes k-marquee { to { transform: translateX(-50%); } }
          .k-marquee { animation: k-marquee 55s linear infinite; }
          .k-marquee:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) { .k-marquee { animation: none; } }
        `}</style>
        <div
          dir="ltr"
          aria-hidden="true"
          className="-mx-4 mb-10 overflow-hidden py-1 motion-reduce:overflow-x-auto sm:mx-0"
          style={{ maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)" }}
        >
          <div className="k-marquee flex w-max gap-3">
            {[...GAMES_CATALOG, ...GAMES_CATALOG].map((g, n) => (
              <span
                key={`${g.id}-${n}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-charcoal bg-card px-4 py-2 text-sm font-bold text-foreground dark:border-border"
              >
                <GameIcon id={g.id} className="h-7 w-7" />
                {t(g.titleKey)}
              </span>
            ))}
          </div>
        </div>

        {/* THE FLOOR: a playable cabinet, four sticker tiles, then the last tile
            and "see all". 2x2 + 4 + 1 + 3 = twelve cells, three rows of four:
            change HOMEPAGE_GAME_IDS and the packing has to be redone. */}
        <div
          className={`grid grid-cols-2 gap-4 lg:grid-cols-4 mb-10 transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="col-span-2 lg:row-span-2">
            <HangulMiniGame totalGames={totalGames} />
          </div>

          {HOMEPAGE_GAMES.map((game, i) => {
            const isFree = FREE_GAME_IDS.includes(game.id);
            return (
              <button
                key={game.id}
                onClick={() => navigate("/games")}
                className={`group card-edge relative flex flex-col overflow-hidden rounded-2xl text-start transition-transform duration-200 hover:!rotate-0 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  TILE_LOOK[i % TILE_LOOK.length]
                } ${i === HOMEPAGE_GAMES.length - 1 ? "col-span-2 lg:col-span-1" : "col-span-1"}`}
              >
                {/* The picture: a drawn scene in the journey map's hand */}
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-t-[0.9rem] border-b-2 border-charcoal bg-ivory dark:border-border dark:bg-muted sm:h-28">
                  <GameScene kind={SCENE_FOR[game.id] ?? "match"} />
                  {HOT_GAME_IDS.has(game.id) ? (
                    <span className="absolute end-2 top-2 rounded-md bg-charcoal px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory">
                      {tr("Hot", "رائج")} 🔥
                    </span>
                  ) : isFree ? (
                    <span className="absolute end-2 top-2 rounded-md bg-charcoal px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory">
                      {tr("Free", "مجاني")}
                    </span>
                  ) : null}
                </div>

                <div className="relative flex flex-1 flex-col px-4 pb-4 pt-9">
                  {/* The game's icon as a sticker on the picture's lower edge
                      (GameIcon draws its own Yellow disc and Charcoal ring) */}
                  <GameIcon id={game.id} className="absolute -top-7 start-4 h-14 w-14 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <h3 className="text-base font-extrabold leading-tight text-foreground">{t(game.titleKey)}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">{t(game.descKey)}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-extrabold text-foreground">
                    {tr("Play", "العب")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}

          {/* "See all" - Charcoal, so the section's one yellow action stays the
              button underneath. */}
          <button
            onClick={() => navigate("/games")}
            className="group card-edge col-span-2 flex items-center justify-between gap-4 rounded-2xl bg-charcoal p-5 text-start transition-transform duration-200 hover:-translate-y-1 lg:col-span-3 dark:bg-klovers-yellow"
          >
            <div>
              <span className="inline-block rounded-md bg-ivory/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory dark:bg-charcoal/15 dark:text-charcoal">
                {tr("All free to try", "كلها مجانية للتجربة")}
              </span>
              <p className="mt-2 text-2xl font-extrabold leading-tight text-ivory md:text-3xl dark:text-charcoal">
                {tr(`See all ${totalGames} games`, `شاهد كل الألعاب الـ ${totalGames}`)}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-klovers-yellow text-charcoal transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 dark:bg-charcoal dark:text-klovers-yellow">
              <ArrowRight className="h-6 w-6 rtl:rotate-180" />
            </span>
          </button>
        </div>

        {/* XP banner */}
        <div
          className={`card-edge bg-card rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center sm:text-left">
            <p className="font-bold text-foreground text-sm">{tr("🏆 Earn XP with every game you play", "🏆 اكسب نقاط خبرة مع كل لعبة تلعبها")}</p>
            <p className="text-xs text-muted-foreground">{tr("Climb the leaderboard · Unlock badges · Show off your streak", "تصدّر الترتيب · افتح الأوسمة · أظهر سلسلتك")}</p>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            {[tr("🥇 Top Learner", "🥇 الأفضل"), tr("🔥 On Fire", "🔥 مندفع"), tr("📚 Scholar", "📚 باحث")].map((b) => (
              <span key={b} className="rounded-md bg-klovers-yellow px-2.5 py-1 font-bold text-charcoal">{b}</span>
            ))}
          </div>
        </div>

        {/* CTA — the one yellow action in this section */}
        <div className={`text-center transition-all duration-700 delay-400 ${visible ? "opacity-100" : "opacity-0"}`}>
          <Button size="lg" onClick={() => navigate("/games")} className="text-base px-10 gap-2 h-12 rounded-full shadow-lg shadow-primary/25">
            <Gamepad2 className="h-4 w-4" />
            {tr(`Play All ${totalGames} Games Free`, `العب كل الألعاب الـ ${totalGames} مجاناً`)}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">{tr("Login to track XP & appear on the leaderboard", "سجّل الدخول لتتبع نقاطك والظهور في الترتيب")}</p>
        </div>
      </div>
    </section>
  );
};

export default HomeGamesSection;
