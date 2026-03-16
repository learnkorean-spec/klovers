import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Lightbulb, Star, Wrench, Download } from "lucide-react";
import { downloadCVReportPDF } from "./CVReportPDFExport";
import type { AnalysisResult } from "@/types/analysis";

const statusConfig = {
  good: { icon: CheckCircle, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", glow: "glow-accent" },
  warning: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", glow: "glow-primary" },
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", glow: "" },
};

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "stroke-accent" : score >= 40 ? "stroke-primary" : "stroke-destructive";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          className={color}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-extrabold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

export function CVAnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8">
      {/* Score + Summary */}
      <div className="glass-card rounded-2xl p-8 glow-primary">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={result.overallScore} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display text-2xl font-extrabold text-foreground mb-2">Your CV Score</h2>
            <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-border/50">
          <button
            onClick={() => downloadCVReportPDF(result)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-all hover:shadow-md"
          >
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Top Fixes */}
      {result.topFixes?.length > 0 && (
        <div className="glass-card rounded-2xl p-7">
          <h3 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            Top Things to Fix
          </h3>
          <ol className="space-y-3">
            {result.topFixes.map((fix, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-foreground leading-relaxed">{fix}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground">Detailed Breakdown</h3>
        {result.categories?.map((cat, i) => {
          const config = statusConfig[cat.status] || statusConfig.warning;
          const Icon = config.icon;
          return (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border ${config.border} ${config.bg} p-5 transition-all hover:shadow-md`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-bold text-foreground">{cat.name}</h4>
                    <span className="text-sm font-mono font-bold text-foreground">{cat.score}/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{cat.feedback}</p>
                  {cat.fixes?.length > 0 && (
                    <ul className="space-y-1.5">
                      {cat.fixes.map((fix, j) => (
                        <li key={j} className="text-sm text-foreground flex gap-2">
                          <span className="text-primary font-bold">→</span> {fix}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strengths + Modern Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.strengths?.length > 0 && (
          <div className="glass-card rounded-2xl p-7 glow-accent">
            <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-accent" />
              </div>
              Strengths
            </h3>
            <ul className="space-y-2.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.modernTips?.length > 0 && (
          <div className="glass-card rounded-2xl p-7">
            <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              Modern Hiring Tips
            </h3>
            <ul className="space-y-2.5">
              {result.modernTips.map((t, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2.5">
                  <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
