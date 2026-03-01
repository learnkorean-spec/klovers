import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Brain, Target, Sparkles, Clock, CheckCircle2 } from "lucide-react";

const PlacementTestCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-primary/20 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary/30 rounded-full animate-pulse delay-300" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Content */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4 text-foreground" />
              Free Assessment
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Not sure about your <span className="underline decoration-primary decoration-4 underline-offset-4">Korean level</span>?
            </h2>

            <p className="text-muted-foreground text-lg">
              Take our free TOPIK-based placement test and get a personalized level recommendation instantly.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 [filter:drop-shadow(0_0_2px_hsl(var(--primary)))]" />
                40 Questions
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-foreground shrink-0 [filter:drop-shadow(0_0_2px_hsl(var(--primary)))]" />
                ~10 Minutes
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-foreground shrink-0 [filter:drop-shadow(0_0_2px_hsl(var(--primary)))]" />
                TOPIK-Based
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 text-foreground shrink-0 [filter:drop-shadow(0_0_2px_hsl(var(--primary)))]" />
                Instant Results
              </div>
            </div>

            <Button size="lg" onClick={() => navigate("/placement-test")} className="text-base px-8">
              Take the Free Placement Test
            </Button>
          </div>

          {/* Right: Visual graphic */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              {/* Central circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-primary/10 border-2 border-foreground/20 flex items-center justify-center shadow-lg">
                  <ClipboardCheck className="h-16 w-16 text-foreground [filter:drop-shadow(0_0_4px_hsl(var(--primary)))]" />
                </div>
              </div>

              {/* Orbiting icons */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-card border border-border shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }}>
                <span className="text-2xl">🇰🇷</span>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-card border border-border shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: "1s", animationDuration: "3s" }}>
                <span className="text-2xl">📊</span>
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-card border border-border shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3s" }}>
                <span className="text-2xl">✍️</span>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-card border border-border shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "3s" }}>
                <span className="text-2xl">🎯</span>
              </div>

              {/* Decorative ring */}
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-foreground/15" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacementTestCTA;
