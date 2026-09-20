import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, ArrowRight, Zap, Trophy, Unlock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GAMES_CATALOG, FREE_GAME_IDS } from "@/constants/gamesList";

/**
 * The six games teased on the homepage. Picked by id, not "first N of the
 * catalog" — GAMES_CATALOG is ordered by curriculum progression, and this
 * row is a marketing highlight reel, so it keeps its own curated order.
 * Titles/descriptions/free-status still come from the shared catalog, so
 * they can never drift from what /games actually shows.
 */
const HOMEPAGE_GAME_IDS = ["match", "hangul", "kdrama", "sentence", "numbers", "colors"];
const HOMEPAGE_GAMES = HOMEPAGE_GAME_IDS
  .map((id) => GAMES_CATALOG.find((g) => g.id === id))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

/** The layout of the six tiles, by position in HOMEPAGE_GAME_IDS.
 *
 *  20 Sep: the row of five equal cards left two orphans on a second line and
 *  a hole to the right of them. It is a bento now: the first game is a big
 *  yellow tile (2x2 on desktop), the next four are small, the sixth runs the
 *  full width of its row, and the "See all" tile beside it makes the last row
 *  exactly four columns wide. Seven pieces, no gap - if a game is added to or
 *  removed from HOMEPAGE_GAME_IDS the packing has to be redone.
 *
 *  Edges are `card-edge`: 2px Charcoal and a hard offset shadow on the light
 *  theme, a plain border on dark. Whole literal class strings on purpose:
 *  Tailwind's scanner only keeps what it can see. */
const TILES = [
  { span: "col-span-2 lg:row-span-2", bg: "bg-klovers-yellow", big: true },
  { span: "col-span-1", bg: "bg-card", big: false },
  { span: "col-span-1", bg: "bg-ivory dark:bg-card", big: false },
  { span: "col-span-1", bg: "bg-ivory dark:bg-card", big: false },
  { span: "col-span-1", bg: "bg-card", big: false },
  { span: "col-span-2", bg: "bg-klovers-yellow/40 dark:bg-card", big: false },
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

        {/* Games — a bento, see TILES */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {HOMEPAGE_GAMES.map((game, i) => {
            const tile = TILES[i % TILES.length];
            return (
              <button
                key={game.id}
                onClick={() => navigate("/games")}
                className={`group card-edge relative flex flex-col rounded-2xl ${tile.bg} ${tile.span} text-start cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:-rotate-[0.6deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  tile.big ? "p-6 sm:p-8 justify-between min-h-[15rem]" : "p-4"
                }`}
              >
                {HOT_GAME_IDS.has(game.id) && (
                  <span className="absolute top-3 end-3 rounded-md bg-charcoal px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory">
                    {tr("Hot", "رائج")} 🔥
                  </span>
                )}
                <div className={tile.big ? "text-7xl sm:text-8xl" : "text-3xl mb-2"}>{game.emoji}</div>
                <div>
                  <h3 className={`font-extrabold text-foreground leading-tight ${tile.big ? "text-2xl sm:text-3xl mb-2" : "text-sm mb-1"}`}>
                    {t(game.titleKey)}
                  </h3>
                  <p className={`text-foreground/70 leading-relaxed ${tile.big ? "text-base max-w-xs" : "text-xs line-clamp-2"}`}>
                    {t(game.descKey)}
                  </p>
                  {tile.big && (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2 text-sm font-bold text-ivory">
                      {tr("Play now", "العب الآن")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* "See all" — Charcoal, so the section's one yellow action stays the
              button underneath. It is the seventh piece of the bento: two
              columns wide, next to the sixth tile. */}
          <button
            onClick={() => navigate("/games")}
            className="group card-edge col-span-2 flex items-center justify-between gap-4 rounded-2xl bg-charcoal p-5 text-start cursor-pointer transition-transform duration-200 hover:-translate-y-1 dark:bg-klovers-yellow"
          >
            <div>
              <span className="inline-block rounded-md bg-ivory/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory dark:bg-charcoal/15 dark:text-charcoal">
                {tr("All Free", "الكل مجاني")}
              </span>
              <p className="mt-2 text-lg font-extrabold leading-tight text-ivory dark:text-charcoal">
                {tr(`See all ${totalGames} games`, `شاهد كل الألعاب الـ ${totalGames}`)}
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-klovers-yellow text-charcoal transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 dark:bg-charcoal dark:text-klovers-yellow">
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
