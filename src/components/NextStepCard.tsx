import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Gamepad2, BookOpenText } from "lucide-react";

interface NextStep {
  icon: string;
  label: string;
  description: string;
  href: string;
}

interface NextStepCardProps {
  completedType: "lesson" | "quiz" | "game";
  lessonSection?: string; // "vocab" | "grammar" | "dialogue" etc.
}

const GAME_SUGGESTIONS: Record<string, { id: string; name: string }> = {
  vocab: { id: "flashcard", name: "Flashcard Review" },
  grammar: { id: "grammarpattern", name: "Grammar Patterns" },
  dialogue: { id: "dialoguefill", name: "Dialogue Fill" },
  exercises: { id: "fillblank", name: "Fill in the Blank" },
  reading: { id: "sentenceread", name: "Sentence Reading" },
  default: { id: "scramble", name: "Word Scramble" },
};

export function NextStepCard({ completedType, lessonSection }: NextStepCardProps) {
  const navigate = useNavigate();

  const steps: NextStep[] = [];

  if (completedType === "lesson") {
    const game = GAME_SUGGESTIONS[lessonSection || "default"] || GAME_SUGGESTIONS.default;
    steps.push(
      { icon: "📚", label: "Continue Lessons", description: "Move to your next lesson", href: "/textbook" },
      { icon: "🎮", label: game.name, description: "Practice what you just learned", href: `/games?play=${game.id}` },
      { icon: "🧠", label: "Vocabulary Review", description: "Reinforce with spaced repetition", href: "/review" },
    );
  } else if (completedType === "quiz") {
    steps.push(
      { icon: "📚", label: "Continue Learning", description: "Pick up where you left off", href: "/textbook" },
      { icon: "🧠", label: "Review Vocab", description: "Strengthen weak words with SRS", href: "/review" },
      { icon: "🎮", label: "Play a Game", description: "Make learning fun", href: "/games" },
    );
  } else {
    steps.push(
      { icon: "🎮", label: "Play Another Game", description: "Keep the momentum going", href: "/games" },
      { icon: "📚", label: "Return to Lessons", description: "Continue your learning path", href: "/textbook" },
      { icon: "🧠", label: "Vocabulary Review", description: "Practice with spaced repetition", href: "/review" },
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-5 pb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What's next?</p>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={step.href}
              onClick={() => navigate(step.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 ${i === 0 ? "border-primary/40 bg-primary/10 hover:bg-primary/15" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
            >
              <span className="text-xl flex-shrink-0">{step.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {i === 0 && <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
