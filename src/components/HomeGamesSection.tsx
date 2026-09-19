import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/** Purely decorative wash per card, cycled by position so adding a game to
 *  HOMEPAGE_GAME_IDS never requires hand-picking a new colour.
 *
 *  These were six hexes from no palette at all — peach, baby blue, pink,
 *  lilac, green, cyan. They now cycle the concept board's three supporting
 *  tones: Mint #CDEBD7, Peach #FFB7A1 and the pale yellow tint. Written as
 *  whole literal class strings on purpose: Tailwind's scanner only keeps
 *  what it can see, so these must never be assembled from fragments. */
const CARD_STYLES = [
  { color: "from-[#CDEBD7]/70 to-[#CDEBD7]/20", border: "hover:border-[#CDEBD7]" },
  { color: "from-[#FFB7A1]/60 to-[#FFB7A1]/15", border: "hover:border-[#FFB7A1]" },
  { color: "from-[#FFFAC4]/80 to-[#FFFAC4]/25", border: "hover:border-[#FFFAC4]" },
  { color: "from-[#CDEBD7]/70 to-[#CDEBD7]/20", border: "hover:border-[#CDEBD7]" },
  { color: "from-[#FFB7A1]/60 to-[#FFB7A1]/15", border: "hover:border-[#FFB7A1]" },
  { color: "from-[#FFFAC4]/80 to-[#FFFAC4]/25", border: "hover:border-[#FFFAC4]" },
];

/** Small marketing accent — not part of the shared catalog on purpose,
 *  since "hot" is a homepage presentation choice, not a fact about the game. */
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
      <div className="absolute top-0 left-0 w-96 h-96 bg-mint/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-peach/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-mint text-charcoal px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-charcoal/10 shadow-sm">
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
                <div className="h-7 w-7 rounded-lg bg-mint border border-charcoal/10 flex items-center justify-center">
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

        {/* Games grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8 transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {HOMEPAGE_GAMES.map((game, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <button
                key={game.id}
                onClick={() => navigate("/games")}
                className={`group relative rounded-2xl bg-gradient-to-br ${style.color} border border-border ${style.border} hover:shadow-lg transition-all duration-200 p-4 text-left cursor-pointer`}
              >
                {HOT_GAME_IDS.has(game.id) && (
                  <span className="absolute top-2 right-2 text-[10px] bg-peach text-charcoal font-bold px-1.5 py-0.5 rounded-full">
                    🔥
                  </span>
                )}
                <div className="text-3xl mb-2">{game.emoji}</div>
                <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{t(game.titleKey)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t(game.descKey)}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-charcoal/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {tr("Play now", "العب الآن")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </div>
              </button>
            );
          })}

          {/* "Play All" card. It used to be a full-yellow gradient, a few
              hundred pixels above this section's yellow CTA — two primary
              actions on one screen, which the board rules out. Charcoal keeps
              it prominent without spending the yellow twice. */}
          <button
            onClick={() => navigate("/games")}
            className="group rounded-2xl bg-charcoal hover:bg-charcoal/90 transition-all duration-200 p-4 text-left cursor-pointer flex flex-col justify-between shadow-lg"
          >
            <Badge className="bg-white/15 text-white hover:bg-white/25 border-0 text-[10px] w-fit mb-2">
              {tr("All Free", "الكل مجاني")}
            </Badge>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{tr(`See All ${totalGames} Games`, `شاهد كل الألعاب الـ ${totalGames}`)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs text-white/80">{tr("Start now", "ابدأ الآن")}</span>
                <ArrowRight className="h-3 w-3 text-white/80 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
              </div>
            </div>
          </button>
        </div>

        {/* XP banner */}
        <div
          className={`bg-gradient-to-r from-mint/60 via-klovers-yellow/15 to-peach/40 border border-border rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center sm:text-left">
            <p className="font-bold text-foreground text-sm">{tr("🏆 Earn XP with every game you play", "🏆 اكسب نقاط خبرة مع كل لعبة تلعبها")}</p>
            <p className="text-xs text-muted-foreground">{tr("Climb the leaderboard · Unlock badges · Show off your streak", "تصدّر الترتيب · افتح الأوسمة · أظهر سلسلتك")}</p>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            {[tr("🥇 Top Learner", "🥇 الأفضل"), tr("🔥 On Fire", "🔥 مندفع"), tr("📚 Scholar", "📚 باحث")].map((b) => (
              <span key={b} className="bg-card border border-border rounded-full px-2.5 py-1 font-medium text-foreground">{b}</span>
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
