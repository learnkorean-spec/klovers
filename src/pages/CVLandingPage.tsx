import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Upload, Sparkles, Target, Brain, Heart, Shield, BookOpen, Users, Zap, Star, CheckCircle } from "lucide-react";

const features = [
  { icon: Target, title: "ATS-Optimized", desc: "Built to pass Applicant Tracking Systems with clean, structured formatting" },
  { icon: Brain, title: "AI-Powered Review", desc: "Get instant scoring, actionable feedback, and improvement questions from AI" },
  { icon: Zap, title: "Interview Prep", desc: "Practice tailored interview questions with real-time AI scoring" },
  { icon: Shield, title: "Privacy First", desc: "Your data stays in your browser — nothing stored on servers" },
];

const stats = [
  { value: "8+", label: "CV Categories Analyzed" },
  { value: "AI", label: "Powered Scoring" },
  { value: "5+", label: "Country Recommendations" },
  { value: "15+", label: "Interview Questions" },
];

const topics = [
  { icon: Sparkles, label: "Confidence" },
  { icon: Users, label: "Communication" },
  { icon: Heart, label: "Self-Discipline" },
  { icon: BookOpen, label: "Life Skills" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
        <h2 className="font-display text-xl font-bold text-foreground tracking-tight">
          Growth<span className="text-gradient">CV</span>
        </h2>
        <div className="flex items-center gap-3">
          <Link
            to="/cv-review"
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Review CV
          </Link>
          <Link
            to="/cv-builder"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
          >
            Build Your CV
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative container mx-auto px-4 pt-20 pb-32 text-center">
        {/* Background glow orbs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-primary/8 blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1s" }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10">
          <div className="flex justify-center gap-2 mb-8">
            {topics.map((t, i) => (
              <motion.span
                key={t.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium glass-card text-muted-foreground"
              >
                <t.icon className="w-3.5 h-3.5 text-primary" />
                {t.label}
              </motion.span>
            ))}
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold text-foreground leading-[1.05] max-w-4xl mx-auto tracking-tight">
            Craft a CV That
            <br />
            <span className="text-gradient">Grows</span> With You
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            AI-powered CV builder and reviewer for coaches, therapists, and personal development professionals.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cv-builder" className="btn-premium">
              Start Building <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/cv-review"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg glass-card text-foreground font-bold text-lg hover:shadow-lg transition-all hover:-translate-y-0.5 shine-border"
            >
              <Upload className="w-5 h-5" /> Review My CV
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-xl px-4 py-5 text-center">
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-28">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Everything You Need
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            From building to reviewing to interview prep — all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group card-elevated glass-card p-7 rounded-xl shine-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-300">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 pb-28">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            How It Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { step: "01", title: "Upload or Build", desc: "Upload your existing CV for review, or build one from scratch with our guided builder." },
            { step: "02", title: "Get AI Feedback", desc: "Receive detailed scoring across 8 categories with specific, actionable fixes." },
            { step: "03", title: "Improve & Practice", desc: "Answer improvement questions, get career advice, and practice interview scenarios." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl hero-gradient text-primary-foreground text-xl font-display font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                {item.step}
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative hero-gradient rounded-3xl p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-foreground/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary-foreground/10 blur-xl pointer-events-none" />

          <div className="relative z-10">
            <Star className="w-10 h-10 text-primary-foreground/80 mx-auto mb-4 animate-float" />
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-primary-foreground mb-5 tracking-tight">
              Built for Personal Development
              <br className="hidden md:block" /> Professionals
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-10 text-lg">
              Whether you're a life coach, mindfulness instructor, or personal growth expert — create a CV that truly reflects your expertise.
            </p>
            <Link
              to="/cv-builder"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-card text-foreground font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              Create Your CV Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">Growth<span className="text-gradient">CV</span></span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 GrowthCV — The CV builder for personal development professionals</p>
          <div className="flex gap-4">
            <Link to="/cv-builder" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Builder</Link>
            <Link to="/cv-review" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Review</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
