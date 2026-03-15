import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, ArrowRight, Zap, Trophy } from "lucide-react";

const GAMES = [
  { emoji: "🃏", title: "Memory Match",     desc: "Match Korean words to meanings",   color: "from-yellow-400/20 to-yellow-600/10" },
  { emoji: "⚡", title: "Hangul Quiz",      desc: "Master Korean alphabet fast",       color: "from-blue-400/20 to-blue-600/10" },
  { emoji: "🎬", title: "K-Drama Quiz",     desc: "Learn through K-Drama phrases",     color: "from-pink-400/20 to-pink-600/10" },
  { emoji: "🧩", title: "Sentence Builder", desc: "Arrange words into sentences",      color: "from-purple-400/20 to-purple-600/10" },
  { emoji: "🔢", title: "Numbers Game",     desc: "Korean numbers & counting",         color: "from-green-400/20 to-green-600/10" },
  { emoji: "🎨", title: "Color Match",      desc: "Colors in Korean",                  color: "from-red-400/20 to-red-600/10" },
  { emoji: "📝", title: "Verb Conjugation", desc: "Conjugate verbs correctly",         color: "from-orange-400/20 to-orange-600/10" },
  { emoji: "👋", title: "Greeting Master",  desc: "Greetings & polite expressions",    color: "from-teal-400/20 to-teal-600/10" },
  { emoji: "↔️", title: "Opposites",        desc: "Learn antonyms in Korean",          color: "from-indigo-400/20 to-indigo-600/10" },
  { emoji: "✏️", title: "Fill the Blank",   desc: "Complete the sentences",            color: "from-cyan-400/20 to-cyan-600/10" },
  { emoji: "🔀", title: "Word Scramble",    desc: "Unscramble Korean words",           color: "from-lime-400/20 to-lime-600/10" },
  { emoji: "🔢", title: "Counter Words",    desc: "Korean counting classifiers",       color: "from-amber-400/20 to-amber-600/10" },
  { emoji: "⏰", title: "Time Teller",      desc: "Tell time in Korean",               color: "from-violet-400/20 to-violet-600/10" },
];

const HomeGamesSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-muted/20">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Gamepad2 className="h-4 w-4" />
            {t("games.learnPlay")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            {t("games.homeTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            {t("games.homeSubtitle")}
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {([
              { icon: Gamepad2, value: "13", label: "Games" },
              { icon: Zap,      value: "+XP", label: "Every Win" },
              { icon: Trophy,   value: "Free", label: "Always" },
            ] as const).map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-sm leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
          {GAMES.map((game) => (
            <button
              key={game.title}
              onClick={() => navigate("/games")}
              className={`group relative rounded-2xl bg-gradient-to-br ${game.color} border border-border hover:border-primary/40 hover:shadow-md transition-all p-4 text-left cursor-pointer`}
            >
              <div className="text-3xl mb-2">{game.emoji}</div>
              <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{game.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{game.desc}</p>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </button>
          ))}
          <button
            onClick={() => navigate("/games")}
            className="group rounded-2xl bg-primary hover:bg-primary/90 transition-all p-4 text-left cursor-pointer flex flex-col justify-between"
          >
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs w-fit mb-2">
              Free
            </Badge>
            <div>
              <p className="font-bold text-primary-foreground text-sm leading-tight">Play All Games</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-primary-foreground/80">Start now</span>
                <ArrowRight className="h-3 w-3 text-primary-foreground/80 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => navigate("/games")} className="text-base px-10 gap-2 h-12">
            <Gamepad2 className="h-4 w-4" />
            Play All 13 Games Free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeGamesSection;
