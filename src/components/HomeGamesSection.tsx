import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, ArrowRight, Zap, Trophy, Unlock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import HangulMiniGame from "./HangulMiniGame";
import KloverIcon from "@/components/KloverIcon";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";
import { gameIconName } from "@/constants/gameIcons";

/**
 * The games teased on the homepage, in the order they sit around the arcade
 * cabinet. Picked by id, not "first N of the catalog" - GAMES_CATALOG is
 * ordered by curriculum progression, and this is a highlight reel, so it keeps
 * its own curated order. Titles, descriptions and free-status still come from
 * the shared catalog, so they can never drift from what /games shows.
 *
 * "hangul" is not in the list on purpose: it is the game the cabinet PLAYS
 * (see HangulMiniGame), so a second card for it would be the same game twice.
 *
 * Seven cards + the "see all" card fill the grid exactly: the cabinet is 2x2,
 * the next four cards sit beside it, and the last row is 3 cards + "see all"
 * = twelve cells, three rows of four. Change the count and the packing has to
 * be redone.
 */
const HOMEPAGE_GAME_IDS = ["match", "kdrama", "sentence", "numbers", "colors", "time", "greetings"];
const HOMEPAGE_GAMES = HOMEPAGE_GAME_IDS
  .map((id) => GAMES_CATALOG.find((g) => g.id === id))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

/**
 * Per-card look, by position - the game-card sheet's rhythm: mostly white, one
 * full-Yellow highlight, a couple of Ivory (the sheet used Mint for those;
 * the brand is three colours since 20 Sep, so Ivory stands in). Whole literal
 * class strings on
 * purpose: Tailwind's scanner only keeps what it can see.
 *
 * On the Yellow card the drawing gets an Ivory ring (`ring`) and the text is
 * pinned to Charcoal: the drawings' own pastel discs are close to Yellow, and
 * `text-foreground` flips to light in dark mode, which would vanish on Yellow.
 */
const CARD_LOOK = [
  { surface: "bg-klovers-yellow", ink: "text-charcoal", sub: "text-charcoal/75", badge: "bg-ivory text-charcoal", ring: true, play: "border-2 border-charcoal bg-transparent" },
  { surface: "bg-card", ink: "text-foreground", sub: "text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
  { surface: "bg-card", ink: "text-foreground", sub: "text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
  { surface: "bg-ivory dark:bg-card", ink: "text-charcoal dark:text-foreground", sub: "text-charcoal/75 dark:text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
  { surface: "bg-card", ink: "text-foreground", sub: "text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
  { surface: "bg-card", ink: "text-foreground", sub: "text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
  { surface: "bg-ivory dark:bg-card", ink: "text-charcoal dark:text-foreground", sub: "text-charcoal/75 dark:text-foreground/70", badge: "bg-klovers-yellow text-charcoal", ring: false, play: "border border-charcoal/15 bg-klovers-yellow" },
];

/** Small marketing accent — not part of the shared catalog on purpose,
 *  since "hot" is a homepage presentation choice, not a fact about the game.
 *  This badge is ONE of the two places pink is still allowed: it has to read
 *  as unlike anything else on the card, and two of seven is rare. */
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
            the stats row says "22"; this is what 22 looks like. Each chip wears
            the same drawing its card wears (GAME_ICON). Paused on hover, and
            still (scrollable) when the visitor asks for less motion. dir=ltr so
            the loop direction is the same in both scripts. */}
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
                className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-charcoal bg-card py-1 ps-1.5 pe-4 text-sm font-bold text-foreground dark:border-border"
              >
                <KloverIcon name={gameIconName(g.id)} className="h-8 w-8" />
                {t(g.titleKey)}
              </span>
            ))}
          </div>
        </div>

        {/* THE FLOOR: a playable cabinet, seven game cards, and "see all".
            Two columns on a phone, four from lg. */}
        <div
          className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-10 transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="col-span-2 lg:row-span-2">
            <HangulMiniGame totalGames={totalGames} />
          </div>

          {HOMEPAGE_GAMES.map((game, i) => {
            const isFree = FREE_GAME_IDS.includes(game.id);
            const look = CARD_LOOK[i % CARD_LOOK.length];
            return (
              <button
                key={game.id}
                onClick={() => navigate("/games")}
                className={`group card-edge relative flex flex-col rounded-2xl p-3.5 text-start transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4 ${look.surface}`}
              >
                {/* Badge: Hot (charcoal) or Free. Top corner, opposite the drawing. */}
                {HOT_GAME_IDS.has(game.id) ? (
                  <span className="absolute end-3 top-3 rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ivory">
                    {tr("Hot", "رائج")} 🔥
                  </span>
                ) : isFree ? (
                  <span className={`absolute end-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${look.badge}`}>
                    {tr("Free", "مجاني")}
                  </span>
                ) : null}

                {/* The drawing stands on its own pastel disc. On the Yellow card
                    it gets an Ivory ring so it keeps its edge. */}
                <span className={`inline-flex shrink-0 self-start ${look.ring ? "rounded-full bg-ivory p-0.5" : ""}`}>
                  <KloverIcon
                    name={gameIconName(game.id)}
                    className="h-20 w-20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:h-24 sm:w-24"
                  />
                </span>

                <h3 className={`mt-3 text-base font-extrabold leading-tight ${look.ink}`}>{t(game.titleKey)}</h3>
                <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${look.sub}`}>{t(game.descKey)}</p>

                <span className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-extrabold text-charcoal ${look.play}`}>
                  {tr("Play", "العب")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
              </button>
            );
          })}

          {/* "See all" - Charcoal, so the section's one yellow action stays the
              button underneath. */}
          <button
            onClick={() => navigate("/games")}
            className="group card-edge flex flex-col justify-between gap-3 rounded-2xl bg-charcoal p-3.5 text-start transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4 dark:bg-card"
          >
            <span className="inline-flex w-fit rounded-full bg-ivory/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ivory">
              {tr("All free to try", "كلها مجانية للتجربة")}
            </span>
            <span className="block">
              <span className="block text-4xl font-extrabold leading-none text-ivory md:text-5xl">{totalGames}</span>
              <span className="mt-1 block text-sm font-bold leading-tight text-ivory/85">
                {tr("games waiting", "لعبة في انتظارك")}
              </span>
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center self-end rounded-full bg-klovers-yellow text-charcoal transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </span>
          </button>
        </div>

        {/* XP banner */}
        <div
          className={`card-edge bg-card rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <KloverIcon name="game-crown" className="hidden h-14 w-14 sm:block" />
            <div>
              <p className="font-bold text-foreground text-sm">{tr("Earn XP with every game you play", "اكسب نقاط خبرة مع كل لعبة تلعبها")}</p>
              <p className="text-xs text-muted-foreground">{tr("Climb the leaderboard · Unlock badges · Show off your streak", "تصدّر الترتيب · افتح الأوسمة · أظهر سلسلتك")}</p>
            </div>
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
