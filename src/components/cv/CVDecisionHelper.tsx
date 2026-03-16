import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Plane, Loader2, MapPin, ExternalLink, CheckCircle2,
  ArrowRight, Lightbulb, Scale, GraduationCap, Compass, Download
} from "lucide-react";
import { downloadAdvisorPDF } from "./AdvisorPDFExport";
import type { AdvisorResult } from "@/types/analysis";

interface CVDecisionHelperProps {
  onSelectGoal: (goal: "job" | "travel") => void;
  isLoading: boolean;
  result: AdvisorResult | null;
}

export function CVDecisionHelper({ onSelectGoal, isLoading, result }: CVDecisionHelperProps) {
  const [selectedGoal, setSelectedGoal] = useState<"job" | "travel" | null>(null);

  const handleSelect = (goal: "job" | "travel") => {
    setSelectedGoal(goal);
    onSelectGoal(goal);
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">
          {selectedGoal === "job" ? "Finding the best countries & jobs for you..." : "Discovering your ideal travel destinations..."}
        </p>
      </motion.div>
    );
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => downloadAdvisorPDF(result, selectedGoal || "job")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-all hover:shadow-md"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>

        {/* Path Advice */}
        <div className="glass-card rounded-2xl p-6 glow-primary">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
              <Compass className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-lg mb-2">Your Career Path Check</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.pathAdvice}</p>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <div>
          <h3 className="font-display font-bold text-foreground text-xl mb-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            Top Countries for You
          </h3>
          <div className="space-y-4">
            {result.topCountries?.map((c, i) => (
              <motion.div key={c.country} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-6 shine-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.flag}</span>
                    <h4 className="font-display font-bold text-foreground text-lg">{c.country}</h4>
                  </div>
                  <div className="flex gap-2">
                    {c.avgSalary && (
                      <span className="text-xs font-semibold bg-accent/10 text-accent px-3 py-1.5 rounded-full">{c.avgSalary}</span>
                    )}
                    {c.costOfLiving && (
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full">{c.costOfLiving}/mo</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{c.reason}</p>
                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-semibold text-foreground">Visa:</span> {c.visaInfo}
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.searchPlatforms?.map((platform, j) => (
                    <a
                      key={j}
                      href={c.searchUrls?.[j] || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      {platform} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Steps */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-accent" />
            </div>
            Action Steps
          </h3>
          <div className="space-y-3">
            {result.actionSteps?.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg hero-gradient text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className="text-sm text-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills to Learn */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            Skills to Learn Next
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.skillsToLearn?.map((skill, i) => (
              <span key={i} className="text-sm font-medium bg-secondary text-secondary-foreground px-4 py-2 rounded-full">{skill}</span>
            ))}
          </div>
        </div>

        {/* Decisions */}
        {result.decisions?.map((d, i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="w-4 h-4 text-primary" />
              </div>
              {d.question}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">Pros</p>
                {d.pros?.map((pro, j) => (
                  <p key={j} className="text-sm text-foreground flex items-start gap-2 mb-1.5">
                    <span className="text-accent mt-0.5">✓</span> {pro}
                  </p>
                ))}
              </div>
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">Cons</p>
                {d.cons?.map((con, j) => (
                  <p key={j} className="text-sm text-foreground flex items-start gap-2 mb-1.5">
                    <span className="text-destructive mt-0.5">✗</span> {con}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{d.verdict}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  // Goal selection UI
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center mb-4">
        <div className="section-divider mb-6" />
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">What's Your Next Move?</h2>
        <p className="text-muted-foreground mt-2">Let us guide you based on your CV and skills</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button onClick={() => handleSelect("job")} className="group glass-card rounded-2xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 shine-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all group-hover:scale-110 transform duration-300">
            <Briefcase className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-xl mb-2">Looking for a Job</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Find the best countries, platforms, and steps to land your dream job internationally</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:gap-3 transition-all">Get Job Advice <ArrowRight className="w-4 h-4" /></span>
        </button>
        <button onClick={() => handleSelect("travel")} className="group glass-card rounded-2xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 shine-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all group-hover:scale-110 transform duration-300">
            <Plane className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-xl mb-2">Traveling / Remote Work</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Discover the best countries for digital nomads and remote workers matching your skills</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:gap-3 transition-all">Get Travel Advice <ArrowRight className="w-4 h-4" /></span>
        </button>
      </div>
    </motion.div>
  );
}
