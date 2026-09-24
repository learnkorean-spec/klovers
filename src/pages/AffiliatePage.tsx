import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DollarSign, Users, Link as LinkIcon, TrendingUp, CheckCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAttribution } from "@/lib/leadSession";
import { STUDENTS_TAUGHT, trustCopy } from "@/lib/trustFigures";

const COMMISSION_RATE = 20; // %

export default function AffiliatePage() {
  const { t, language } = useLanguage();
  useSEO({
    title: "Affiliate Program — Earn 20% Commission",
    description: "Join the Klovers affiliate program. Earn 20% commission for every student you refer to our Korean language courses. Simple, transparent, and rewarding.",
    canonical: "https://kloversegy.com/affiliate",
  });
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    platform: "",
    audience_size: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: t("affiliate.nameRequired"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const attribution = getAttribution();
      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: form.name,
          email: form.email.trim().toLowerCase(),
          source: "affiliate-application",
          goal: [
            "Affiliate Application",
            form.platform ? `Platform: ${form.platform}` : "",
            form.audience_size ? `Audience: ${form.audience_size}` : "",
            form.notes ? `Notes: ${form.notes}` : "",
          ].filter(Boolean).join(" | "),
          country: "",
          level: "affiliate",
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.campaign,
          utm_content: attribution.utm_content,
          gclid: attribution.gclid,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: t("affiliate.submitError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-charcoal text-ivory py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-klovers-yellow text-sm font-semibold uppercase tracking-widest mb-3">{t("affiliate.heroBadge")}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              {t("affiliate.heroTitleLine1")}<br />{t("affiliate.heroTitleLine2")}
            </h1>
            <p className="text-ivory/80 text-lg mb-8">
              {t("affiliate.heroSubtitle")}
            </p>
            <a href="#apply">
              <Button size="lg" className="bg-klovers-yellow text-charcoal hover:bg-klovers-yellow/90 font-bold px-8">
                {t("affiliate.applyFree")}
              </Button>
            </a>
          </div>
        </section>

        {/* Stats. The student tile was "500+ Active Students"; the figure is
            200+ students Reham has taught over 13 years (@/lib/trustFigures). */}
        <section className="py-14 bg-muted/40">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: DollarSign, label: t("affiliate.statCommission"), value: `${COMMISSION_RATE}%` },
              { icon: TrendingUp, label: t("affiliate.statAvgOrder"), value: "~$120" },
              { icon: Users, label: trustCopy(language).studentsTaughtLabel, value: STUDENTS_TAUGHT },
              { icon: LinkIcon, label: t("affiliate.statCookieDuration"), value: "30 days" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card border rounded-2xl p-6 flex flex-col items-center gap-2 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-klovers-yellow flex items-center justify-center">
                  <Icon className="h-5 w-5 text-charcoal" />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">{t("affiliate.howItWorksTitle")}</h2>
            {/* Friends sharing a picnic: the share-it-with-a-friend idea the
                programme is built on, in the Klovers story style. */}
            <img
              src="/assets/cluby/picnic.webp"
              alt={language === "ar" ? "صحاب بيتشاركوا نزهة على نهر الهان مع كلوبي" : "Friends sharing a picnic by the Han river with Cluby"}
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
              className="mb-10 w-full aspect-[16/7] rounded-3xl border border-border object-cover"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "1", title: t("affiliate.step1Action"), desc: t("affiliate.step1Desc") },
                { step: "2", title: t("affiliate.step2Action"), desc: t("affiliate.step2Desc") },
                { step: "3", title: t("affiliate.step3Action"), desc: t("affiliate.step3Desc") },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-card border rounded-2xl p-6 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-charcoal text-ivory dark:bg-klovers-yellow dark:text-charcoal font-bold flex items-center justify-center mb-4 text-sm">
                    {step}
                  </div>
                  <h3 className="font-semibold text-base mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply form */}
        <section id="apply" className="py-14 px-4 bg-muted/40">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">{t("affiliate.applyTitle")}</h2>
            <p className="text-muted-foreground text-sm text-center mb-8">
              {t("affiliate.applySubtitle")}
            </p>

            {submitted ? (
              <div className="bg-card border border-klovers-green rounded-2xl p-10 text-center shadow-sm">
                <CheckCircle className="h-12 w-12 fill-klovers-green text-charcoal mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("affiliate.applicationReceived")}</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t("affiliate.applicationReceivedDesc")}
                </p>
                <Link to="/">
                  <Button variant="outline">{t("affiliate.backToHome")}</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("affiliate.fullNameLabel")}</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t("affiliate.fullNamePlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t("affiliate.emailLabel")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="platform">{t("affiliate.platformLabel")}</Label>
                  <Input
                    id="platform"
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    placeholder={t("affiliate.platformPlaceholder")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="audience">{t("affiliate.audienceLabel")}</Label>
                  <Input
                    id="audience"
                    value={form.audience_size}
                    onChange={e => setForm(f => ({ ...f, audience_size: e.target.value }))}
                    placeholder={t("affiliate.audiencePlaceholder")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">{t("affiliate.whyJoinLabel")}</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={t("affiliate.whyJoinPlaceholder")}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                <Button type="submit" className="w-full font-bold" disabled={loading}>
                  {loading ? t("affiliate.submittingBtn") : t("affiliate.submitApplication")}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("affiliate.termsNote")}
                </p>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">{t("affiliate.pageFaqTitle")}</h2>
            <div className="space-y-4">
              {[
                { q: t("affiliate.faqQ1"), a: t("affiliate.faqA1") },
                { q: t("affiliate.faqQ2"), a: t("affiliate.faqA2") },
                { q: t("affiliate.faqQ3"), a: t("affiliate.faqA3") },
                { q: t("affiliate.faqQ4"), a: t("affiliate.faqA4") },
              ].map(({ q, a }) => (
                <div key={q} className="bg-card border rounded-xl p-5 shadow-sm">
                  <p className="font-semibold text-sm mb-1">{q}</p>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
