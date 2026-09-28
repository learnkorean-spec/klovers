import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Lock } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { toArabicDigits } from "@/lib/trustFigures";

/**
 * Card copy in the page language (28 Sep 2026, brand guard): the Arabic page
 * showed "Q1", "Interviewer", "Model Answer" and "Unlock for $5" in English.
 * The Q&A itself stays Korean + English (the tool is bilingual by design).
 */
const CARD_COPY = {
  en: { q: (n: number) => `Q${n}`, interviewer: "Interviewer", model: "Model Answer", unlock: "Unlock for $5", kr: "KR", en: "EN", slow: "Slow" },
  ar: { q: (n: number) => `س${toArabicDigits(n)}`, interviewer: "سؤال المُحاوِر", model: "إجابة نموذجية", unlock: "فتح السؤال مقابل ٥ دولارات", kr: "الكورية", en: "الإنجليزية", slow: "ببطء" },
} as const;

/** "Q3" on the English page, «س٣» on the Arabic page. */
export const questionBadge = (language: string, n: number): string =>
  (language === "ar" ? CARD_COPY.ar : CARD_COPY.en).q(n);

export interface InterviewQA {
  id: string;
  interviewer_question_kr: string;
  interviewer_question_en: string;
  interviewer_question_romanization: string;
  model_answer_kr: string;
  model_answer_en: string;
  model_answer_romanization: string;
  is_free: boolean;
}

function PlayBtn({ onClick, label, variant = "kr", disabled }: {
  onClick: () => void; label?: string; variant?: "kr" | "en" | "slow"; disabled?: boolean;
}) {
  // Palette only (brand guard): charcoal text, a yellow tint on hover.
  const colors = {
    kr: "text-foreground hover:bg-primary/20",
    en: "text-foreground hover:bg-primary/20",
    slow: "text-foreground hover:bg-primary/20",
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-8 gap-1 text-xs", colors[variant])}
      onClick={onClick}
      disabled={disabled}
    >
      <Volume2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

export default function InterviewQACard({ qa, index, locked }: {
  qa: InterviewQA;
  index: number;
  locked: boolean;
}) {
  const { speak, isSpeaking } = useSpeech();
  const { language } = useLanguage();
  const c = language === "ar" ? CARD_COPY.ar : CARD_COPY.en;

  if (locked) {
    return (
      <Card className="rounded-xl relative overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{c.q(index + 1)}</Badge>
          </div>
          <div className="space-y-3 blur-sm select-none pointer-events-none">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted/70 rounded w-1/2" />
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <div className="h-4 bg-primary/30 rounded w-full mb-2" />
              <div className="h-3 bg-primary/20 rounded w-2/3" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-ivory/60 dark:bg-background/60">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Lock className="h-8 w-8" />
              <span className="text-sm font-medium">{c.unlock}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-5 space-y-4">
        <Badge variant="outline" className="text-xs">{c.q(index + 1)}</Badge>

        {/* Interviewer Question â male voice */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{c.interviewer}</span>
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p lang="ko" className="text-sm font-medium">{qa.interviewer_question_kr}</p>
            <p className="text-[11px] text-muted-foreground italic">{qa.interviewer_question_romanization}</p>
            <p className="text-xs text-muted-foreground">{qa.interviewer_question_en}</p>
          </div>
          <div className="flex gap-1">
            <PlayBtn onClick={() => speak(qa.interviewer_question_kr, { language: "ko-KR", gender: "male" })} label={c.kr} variant="kr" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.interviewer_question_en, { language: "en-US", gender: "male" })} label={c.en} variant="en" disabled={isSpeaking} />
          </div>
        </div>

        <div className="w-full h-px bg-border" />

        {/* Model Answer (Reham) â female voice */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{c.model}</span>
          <div className="p-3 rounded-lg bg-primary/10 space-y-1">
            <p lang="ko" className="text-sm font-medium leading-relaxed">{qa.model_answer_kr}</p>
            <p className="text-[11px] text-muted-foreground italic">{qa.model_answer_romanization}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{qa.model_answer_en}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <PlayBtn onClick={() => speak(qa.model_answer_kr, { language: "ko-KR", gender: "female" })} label={c.kr} variant="kr" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.model_answer_en, { language: "en-US", gender: "female" })} label={c.en} variant="en" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.model_answer_kr, { language: "ko-KR", rate: 0.7, gender: "female" })} label={c.slow} variant="slow" disabled={isSpeaking} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
