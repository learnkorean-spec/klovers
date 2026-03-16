import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleQuestion, Send, Loader2, Sparkles } from "lucide-react";
import type { ImprovementQuestion } from "@/types/analysis";

interface CVImprovementQuestionsProps {
  questions: ImprovementQuestion[];
  onSubmitAnswers: (answers: Record<string, string>) => void;
  isSubmitting: boolean;
}

export function CVImprovementQuestions({ questions, onSubmitAnswers, isSubmitting }: CVImprovementQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const filledCount = Object.values(answers).filter((v) => v.trim()).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card rounded-2xl p-7">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
            <MessageCircleQuestion className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">Let's Get You to 100%</h2>
            <p className="text-sm text-muted-foreground">Answer these questions so we can strengthen your weak areas</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full hero-gradient" initial={{ width: 0 }} animate={{ width: `${(filledCount / questions.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">{filledCount}/{questions.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-6 shine-border">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg hero-gradient text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <div className="flex-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-2">{q.category}</span>
                <p className="font-medium text-foreground text-sm">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">{q.hint}</p>
              </div>
            </div>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Type your answer..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y transition-shadow hover:shadow-sm"
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onSubmitAnswers(answers)}
          disabled={isSubmitting || filledCount === 0}
          className="btn-premium disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Re-analyzing...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Improve My CV Score</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
