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

const COMMISSION_RATE = 20; // %

export default function AffiliatePage() {
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
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
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
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error submitting application", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-violet-600 to-purple-700 text-white py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-violet-200 text-sm font-semibold uppercase tracking-widest mb-3">Affiliate Program</p>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Earn {COMMISSION_RATE}% Commission<br />on Every Student You Refer
            </h1>
            <p className="text-violet-100 text-lg mb-8">
              Partner with Klovers Korean Academy. Share your unique link — earn recurring commissions on each enrollment.
            </p>
            <a href="#apply">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8">
                Apply Now — It's Free
              </Button>
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 bg-muted/40">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: DollarSign, label: "Commission Rate", value: `${COMMISSION_RATE}%` },
              { icon: TrendingUp, label: "Avg. Order Value", value: "~$120" },
              { icon: Users, label: "Active Students", value: "500+" },
              { icon: LinkIcon, label: "Cookie Duration", value: "30 days" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card border rounded-2xl p-6 flex flex-col items-center gap-2 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-violet-600" />
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
            <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Apply", desc: "Fill out the short form below. We'll review and send your unique affiliate link within 24 hours." },
                { step: "2", title: "Share", desc: "Post your link on YouTube, TikTok, Instagram, blogs — wherever your audience hangs out." },
                { step: "3", title: "Earn", desc: `Get ${COMMISSION_RATE}% of every paid enrollment that comes through your link. Paid monthly.` },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-card border rounded-2xl p-6 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center mb-4 text-sm">
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
            <h2 className="text-2xl font-bold text-center mb-2">Apply to Join</h2>
            <p className="text-muted-foreground text-sm text-center mb-8">
              No minimum followers required. We welcome all content creators.
            </p>

            {submitted ? (
              <div className="bg-card border border-green-200 rounded-2xl p-10 text-center shadow-sm">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Application Received!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  We'll review your application and email you your unique affiliate link within 24 hours.
                </p>
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="platform">Platform / Channel</Label>
                  <Input
                    id="platform"
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    placeholder="e.g. YouTube — @KoreanWithMe, TikTok, Instagram"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="audience">Audience Size (approx.)</Label>
                  <Input
                    id="audience"
                    value={form.audience_size}
                    onChange={e => setForm(f => ({ ...f, audience_size: e.target.value }))}
                    placeholder="e.g. 5,000 subscribers"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Why do you want to partner? (optional)</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Tell us a bit about your audience and content..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                  {loading ? "Submitting…" : "Submit Application"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By applying you agree to our affiliate terms. Commission paid monthly via bank transfer or PayPal.
                </p>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Who can apply?", a: "Anyone with an audience interested in learning Korean — YouTubers, TikTokers, bloggers, language teachers, or even students who love to share." },
                { q: "How do I get paid?", a: `We pay ${COMMISSION_RATE}% of the enrollment fee once the student completes their first payment. Payments are processed monthly.` },
                { q: "How do I track my referrals?", a: "After approval we'll send you a unique referral link. Every signup through that link is tracked for 30 days." },
                { q: "Is there a minimum payout threshold?", a: "We pay out any amount above $10. Balances below that roll over to the next month." },
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
