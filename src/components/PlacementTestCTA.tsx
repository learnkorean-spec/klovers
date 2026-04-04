import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Brain, Target, Sparkles, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LEVELS = [
  { label: "A1 Beginner",     color: "bg-blue-500",   width: "w-[15%]" },
  { label: "A2 Elementary",   color: "bg-cyan-500",    width: "w-[30%]" },
  { label: "B1 Intermediate", color: "bg-green-500",   width: "w-[50%]" },
  { label: "B2 Upper-Int.",   color: "bg-amber-500",   width: "w-[65%]" },
  { label: "C1 Advanced",     color: "bg-orange-500",  width: "w-[80%]" },
  { label: "C2 Mastery",      color: "bg-rose-500",    width: "w-[100%]" },
];

const FEATURES = [
  { icon: ClipboardCheck, label: "20 Questions" },
  { icon: Clock,          label: "~5 Minutes" },
  { icon: Target,         label: "TOPIK-Based" },
  { icon: Brain,          label: "Instant Results" },
];

const PlacementTestCTA = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);

  // Scroll-triggered entrance
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Animate through levels once visible
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= LEVELS.length) { clearInterval(id); return; }
      setActiveLevel(i);
    }, 400);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/40"
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/6 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/6 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      {/* Floating Korean characters */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {["한", "국", "어", "급", "수"].map((char, i) => (
          <span
            key={char}
            className="absolute text-5xl font-bold text-primary/5 dark:text-primary/8"
            style={{ top: `${15 + i * 18}%`, left: `${3 + i * 19}%`, transform: `rotate(${-15 + i * 8}deg)` }}
          >
            {char}
          </span>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* ── Left: Copy ── */}
          <div
            className={`space-y-6 text-center md:text-left transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold text-primary text-outlined">
              <Sparkles className="h-4 w-4" />
              Free Assessment · No Sign-up Needed
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Where does your<br />
              <span className="relative inline-block">
                <span className="relative z-10">Korean level</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-primary/20 rounded-full -z-0" />
              </span>{" "}
              stand?
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Our free TOPIK-aligned test pinpoints your exact level — A1 to C2 — in just 20 questions and gives you a personalised study roadmap in under 5 minutes.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {label}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/placement-test")}
              className="text-base px-8 gap-2 h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              Take the Free Test
              <ChevronRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground">
              ✓ No account needed &nbsp;·&nbsp; ✓ Instant results &nbsp;·&nbsp; ✓ 100% free
            </p>
          </div>

          {/* ── Right: Animated Level Card ── */}
          <div
            className={`flex justify-center transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative w-full max-w-sm">
              {/* Card */}
              <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-primary-foreground font-bold text-sm">TOPIK Placement Test</p>
                    <p className="text-primary-foreground/70 text-xs">Klovers Korean Academy</p>
                  </div>
                </div>

                {/* Levels list */}
                <div className="px-5 py-4 space-y-3">
                  {LEVELS.map((lvl, idx) => (
                    <div key={lvl.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${idx === activeLevel ? "text-foreground" : "text-muted-foreground"}`}>
                          {lvl.label}
                        </span>
                        {idx === activeLevel && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium animate-pulse">
                            Detecting…
                          </span>
                        )}
                        {idx < activeLevel && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${lvl.color} ${
                            idx <= activeLevel ? lvl.width : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">20 questions · TOPIK-aligned</span>
                  <span className="text-xs font-bold text-primary">FREE</span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                ✓ Instant
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacementTestCTA;
