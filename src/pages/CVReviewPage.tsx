import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, ArrowLeft, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CVAnalysisResults } from "@/components/cv/CVAnalysisResults";
import { CVImprovementQuestions } from "@/components/cv/CVImprovementQuestions";
import { CVDecisionHelper } from "@/components/cv/CVDecisionHelper";
import { InterviewPractice } from "@/components/cv/InterviewPractice";
import { CVJobTailor } from "@/components/cv/CVJobTailor";
import { useCVReview } from "@/hooks/useCVReview";

export default function CVReview() {
  const {
    cvText, setCvText, fileName, analyzing, result, dragOver, setDragOver,
    questions, loadingQuestions, improvising, improvedResult,
    advisorLoading, advisorResult, interviewQuestions, interviewLoading,
    interviewStarted, fileInputRef, handleDrop, handleFileInput, analyze,
    handleSubmitAnswers, handleGoalSelect, handleStartInterview, displayResult,
  } = useCVReview();

  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});

  const handleSubmitAnswersWrapped = async (answers: Record<string, string>) => {
    setSavedAnswers(answers);
    await handleSubmitAnswers(answers);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/cv" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-bold text-foreground">Growth<span className="text-gradient">CV</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">CV Review & Analysis</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
              Upload & <span className="text-gradient">Fix</span> Your CV
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Get AI-powered feedback based on 2025–2026 hiring standards
            </p>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-2xl p-10 text-center transition-all cursor-pointer shine-border ${
              dragOver
                ? "border-2 border-primary bg-primary/5 glow-primary"
                : "glass-card hover:glow-primary"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} id="cv-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.md,.text" className="hidden" onChange={handleFileInput} />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display font-bold text-foreground text-lg">
              {fileName ? `Uploaded: ${fileName}` : "Drop your CV file here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports PDF, Word (.docx), .txt, and .md files — or paste text below
            </p>
          </div>

          {/* Text area */}
          <div className="mt-5">
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Or paste your CV text here..."
              rows={8}
              className="w-full rounded-xl border border-border bg-card p-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y transition-shadow hover:shadow-md"
            />
          </div>

          {/* Analyze button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={analyze}
              disabled={analyzing || !cvText.trim()}
              className="btn-premium disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><FileText className="w-5 h-5" /> Analyze My CV</>
              )}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {displayResult && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12">
                {improvedResult && result && improvedResult.overallScore > result.overallScore && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 rounded-xl border border-accent/30 bg-accent/10 p-5 flex items-center gap-4 glow-accent"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-foreground text-lg">
                        Score improved: {result.overallScore} → {improvedResult.overallScore}
                      </p>
                      {improvedResult.improvements?.map((imp, i) => (
                        <p key={i} className="text-sm text-muted-foreground">✓ {imp}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
                <CVAnalysisResults result={displayResult} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Tailoring - right after analysis */}
          <AnimatePresence>
            {displayResult && !loadingQuestions && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12">
                <CVJobTailor cvText={cvText} improvementAnswers={savedAnswers} analysisResult={displayResult} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Improvement questions */}
          <AnimatePresence>
            {loadingQuestions && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-10 flex items-center justify-center gap-3 py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground font-medium">Generating improvement questions...</span>
              </motion.div>
            )}
            {!loadingQuestions && questions.length > 0 && !improvedResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12">
                <CVImprovementQuestions questions={questions} onSubmitAnswers={handleSubmitAnswersWrapped} isSubmitting={improvising} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decision Helper */}
          <AnimatePresence>
            {displayResult && !loadingQuestions && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12">
                <CVDecisionHelper onSelectGoal={handleGoalSelect} isLoading={advisorLoading} result={advisorResult} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interview Practice */}
          <AnimatePresence>
            {displayResult && !loadingQuestions && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12 mb-20">
                <InterviewPractice questions={interviewQuestions} isLoading={interviewLoading} onStart={handleStartInterview} hasStarted={interviewStarted} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
