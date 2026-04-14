import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";

const COUNTRIES = [
  "Egypt", "Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain", "Oman",
  "Jordan", "Lebanon", "Syria", "Iraq", "Palestine", "Libya", "Tunisia",
  "Algeria", "Morocco", "Sudan", "Yemen", "United States", "United Kingdom",
  "Canada", "Australia", "Other",
];

// Level options — uses the canonical short keys (hangul, l1…l6) from the
// single source of truth in @/constants/levels. Two extra "starting point"
// options are kept for users who can't self-assess to a TOPIK band yet.
const LEVELS = [
  { value: "absolute_beginner", label: "Absolute Beginner (never studied Korean)" },
  { value: "beginner", label: "Beginner (knows Hangul)" },
  ...LEVEL_SELECT_OPTIONS,
];

const GOALS = [
  "Travel to Korea",
  "Watch K-dramas / K-pop without subtitles",
  "Study or work in Korea",
  "Make Korean friends",
  "Pass TOPIK exam",
  "General interest",
  "Other",
];

const CompleteProfilePage = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [form, setForm] = useState({
    name: "",
    email: emailFromUrl,
    country: "",
    level: "",
    goal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name.trim()) {
      toast({ title: "Please fill in your name and email.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          country: form.country,
          level: form.level,
          goal: form.goal,
          source: "complete-profile",
          user_id: session?.user?.id,
        },
      });

      if (error) throw new Error(error.message || "Failed to save. Please try again.");

      setDone(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-20 px-4 flex flex-col items-center text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Profile Updated!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Thank you! Your information has been saved. Our team will be in touch
              soon to match you with the right Korean class.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild>
                <Link to="/enroll">
                  Browse Courses <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-primary text-outlined text-sm font-semibold">🇰🇷 Complete Your Profile</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">One step closer to Korean!</h1>
            <p className="text-muted-foreground">
              Fill in a few details so we can match you with the perfect class.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sara Ali"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  readOnly={!!emailFromUrl}
                  className={emailFromUrl ? "bg-muted text-muted-foreground" : ""}
                  required
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select value={form.country} onValueChange={set("country")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label>Korean Level</Label>
                <Select value={form.level} onValueChange={set("level")}>
                  <SelectTrigger>
                    <SelectValue placeholder="What's your current level?" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div className="space-y-1.5">
                <Label>Learning Goal</Label>
                <Select value={form.goal} onValueChange={set("goal")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Why are you learning Korean?" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Saving…" : "Save My Profile"}
                {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Takes 1 minute · We never share your information
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompleteProfilePage;
