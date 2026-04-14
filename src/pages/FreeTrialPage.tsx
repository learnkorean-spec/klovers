import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { CheckCircle2, Star, Users, Clock, ArrowRight, Gift, CalendarPlus, MessageCircle } from "lucide-react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { track } from "@/lib/tracking";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TrialSlotPicker from "@/components/TrialSlotPicker";
import { DAY_NAMES, formatTime12h } from "@/lib/calendarUrl";

const LEVELS = [
  { value: "A0 – Complete Beginner", label: "A0 – Complete Beginner (I know nothing)" },
  { value: "A1 – TOPIK 1", label: "A1 – TOPIK 1 (Basic words)" },
  { value: "A2 – TOPIK 2", label: "A2 – TOPIK 2 (Simple sentences)" },
  { value: "B1 – TOPIK 3", label: "B1 – TOPIK 3 (Everyday conversation)" },
  { value: "B2 – TOPIK 4", label: "B2 – TOPIK 4 (Intermediate)" },
  { value: "C1+", label: "C1+ (Advanced)" },
];

const GOALS = [
  "Watch K-Dramas without subtitles",
  "Travel to Korea",
  "Connect with Korean culture & K-Pop",
  "Business / Work",
  "Study in Korea / TOPIK exam",
  "Talk with Korean friends or family",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PERKS = [
  { icon: Gift, text: "100% free — no credit card" },
  { icon: Users, text: "Live class with real teacher" },
  { icon: Clock, text: "45-minute session" },
  { icon: Star, text: "Personalised level assessment" },
];

interface BookingResult {
  trial_date: string;
  day_name: string;
  start_time: string;
  start_time_12h: string;
  duration_min: number;
  timezone: string;
  calendar_url: string;
}

const FreeTrialPage = () => {
  useSEO({
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Try a live Korean class for free. No credit card. Real teacher. 45 minutes. Join 1,000+ students learning Korean the right way.",
    canonical: "https://kloversegy.com/free-trial",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Free Trial Korean Class",
      "description": "45-minute live Korean class with a real teacher. Free, no credit card required.",
      "provider": {
        "@type": "Organization",
        "name": "Klovers Korean Academy",
        "url": "https://kloversegy.com"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "category": "Free Trial"
      },
      "inLanguage": "ko",
      "url": "https://kloversegy.com/free-trial"
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref") || "";

  useEffect(() => {
    if (referredBy) {
      localStorage.setItem("referrer_id", referredBy);
      supabase.functions.invoke("track-referral-click", {
        body: { referrerId: referredBy },
      }).catch(() => {});
    }
  }, [referredBy]);

  const [step, setStep] = useState<"form" | "pick_slot" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    level: "",
    goal: "",
    country: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  /** Step 1 → Step 2: validate form, move to slot picker */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.level || selectedDays.length === 0) {
      toast({
        title: "Please fill in all required fields",
        description: selectedDays.length === 0 ? "Please select at least one preferred day" : undefined,
        variant: "destructive",
      });
      return;
    }
    setStep("pick_slot");
  };

  /** Step 2 → Step 3: book the selected slot */
  const handleSlotSelect = async (dayOfWeek: number, startTime: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("book-trial", {
        body: {
          name: form.name,
          email: form.email.trim().toLowerCase(),
          phone: form.phone || undefined,
          country: form.country || "Unknown",
          level: form.level,
          goal: form.goal || undefined,
          day_of_week: dayOfWeek,
          start_time: startTime,
          referrer_id: referredBy || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Booking failed", description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      setBookingResult(data.booking);
      track.lead({ content_name: "free-trial" });
      setStep("success");
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (step === "success" && bookingResult) {
    const formattedDate = new Date(bookingResult.trial_date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-3">Your trial is booked! 🎉</h1>

            {/* Booking details card */}
            <div className="bg-card border border-border rounded-2xl p-6 text-left mb-6 space-y-2">
              <div className="flex items-center gap-3">
                <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingResult.start_time_12h} · {bookingResult.duration_min} min · Cairo time
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              A teacher will confirm your class within a few hours. You'll receive a confirmation email with a calendar invite.
            </p>

            {/* Add to Calendar */}
            <a
              href={bookingResult.calendar_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] text-base mb-4"
            >
              <CalendarPlus className="h-5 w-5" />
              Add to Google Calendar
            </a>

            {/* Secondary: WhatsApp */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Have questions?</p>
              <a
                href={`${WHATSAPP_BASE}?text=${encodeURIComponent(`Hi! I just booked a free trial class for ${formattedDate} at ${bookingResult.start_time_12h}. I have a question.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#25D366] hover:underline font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                Message us on WhatsApp
              </a>
            </div>

            <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Slot Picker Screen (Step 2) ─────────────────────────────────────────────
  if (step === "pick_slot") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <section className="py-16 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background">
            <div className="container mx-auto px-4 text-center max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
                Pick your trial time
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose an available time slot for your free 45-minute class.
              </p>
            </div>
          </section>

          <section className="py-12 pb-24">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Booking your class...</p>
                  </div>
                ) : (
                  <TrialSlotPicker
                    selectedDays={selectedDays}
                    onSelect={handleSlotSelect}
                    onBack={() => setStep("form")}
                  />
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Form Screen (Step 1) ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">

        {/* Hero */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <span className="inline-block bg-primary text-black text-xs font-black tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-5">
              Free Trial
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-5 leading-[1.05]">
              Try Korean for <span className="text-primary text-outlined-lg">Free</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              One live class. Real teacher. No credit card. See why 1,000+ students chose Klovers.
            </p>

            {/* Perks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary border border-black/25 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-12 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-1">Book your free class</h2>
              <p className="text-sm text-muted-foreground mb-8">Takes 30 seconds. Pick your info, then choose a time.</p>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    placeholder="e.g. Sara Ahmed"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sara@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">WhatsApp number <span className="text-muted-foreground text-xs">(recommended)</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+20 100 000 0000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="e.g. Egypt"
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                  />
                </div>

                {/* Level */}
                <div className="space-y-1.5">
                  <Label>Current Korean level <span className="text-destructive">*</span></Label>
                  <Select value={form.level} onValueChange={(v) => set("level", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
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
                  <Label>Learning goal</Label>
                  <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
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

                {/* Preferred day(s) */}
                <div className="space-y-1.5">
                  <Label>Preferred day(s) for trial <span className="text-destructive">*</span></Label>
                  <ToggleGroup
                    type="multiple"
                    value={selectedDays}
                    onValueChange={setSelectedDays}
                    className="flex flex-wrap gap-2 justify-start"
                  >
                    {DAYS.map((day) => (
                      <ToggleGroupItem
                        key={day}
                        value={day}
                        className="rounded-full px-4 py-2 text-sm font-medium border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {day}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">
                    Select one or more days that work for you
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 text-base font-bold h-13 mt-2"
                >
                  Choose a Time Slot
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  No payment. No spam. Pick your time on the next step.
                </p>

                {/* Social proof nudge */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="flex -space-x-1.5">
                    {["N","M","H","Y","J"].map((l) => (
                      <div key={l} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">{l}</div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">14 students</span> booked this week
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
