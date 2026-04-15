import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { CheckCircle2, Star, Users, Clock, ArrowRight, Gift, CalendarPlus, MessageCircle, ArrowLeft } from "lucide-react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { track } from "@/lib/tracking";
import TrialSlotPicker from "@/components/TrialSlotPicker";
import { DAY_NAMES, formatTime12h } from "@/lib/calendarUrl";

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

  // New flow: pick_slot → contact → success
  //   - No upfront form. Students choose their trial day FIRST.
  //   - Then enter the minimum contact info needed to confirm the booking
  //     (name + WhatsApp; email optional). Level & learning goal are gathered
  //     as an optional follow-up after booking, not as a gate to booking.
  const [step, setStep] = useState<"pick_slot" | "contact" | "success">("pick_slot");
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [pickedSlot, setPickedSlot] = useState<{ dayOfWeek: number; startTime: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  /** Step 1 → Step 2: student picked a trial slot, now collect contact */
  const handleSlotPicked = (dayOfWeek: number, startTime: string) => {
    setPickedSlot({ dayOfWeek, startTime });
    setStep("contact");
  };

  /** Step 2 → Step 3: submit booking with minimal contact details */
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedSlot) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast({
        title: "Please enter your name and WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Email is optional — generate a placeholder so the backend's
      // email field stays populated without asking the student for it.
      const emailValue = form.email.trim().toLowerCase()
        || `${form.phone.replace(/\D/g, "")}@trial.kloversegy.com`;

      const { data, error } = await supabase.functions.invoke("book-trial", {
        body: {
          name: form.name.trim(),
          email: emailValue,
          phone: form.phone.trim(),
          day_of_week: pickedSlot.dayOfWeek,
          start_time: pickedSlot.startTime,
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

  // ── Step 2: Minimal Contact Form ────────────────────────────────────────────
  if (step === "contact" && pickedSlot) {
    const dayName = DAY_NAMES[pickedSlot.dayOfWeek] ?? `Day ${pickedSlot.dayOfWeek}`;
    const timeLabel = formatTime12h(pickedSlot.startTime);

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <section className="py-16 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background">
            <div className="container mx-auto px-4 text-center max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
                Almost done!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Confirming your trial for{" "}
                <span className="font-semibold text-foreground">{dayName} at {timeLabel}</span>{" "}
                (Cairo time). We just need a way to reach you.
              </p>
            </div>
          </section>

          <section className="py-12 pb-24">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
                <form onSubmit={handleBooking} className="space-y-5">
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

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">WhatsApp number <span className="text-destructive">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+20 100 000 0000"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      required
                    />
                  </div>

                  {/* Email — optional */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">
                      Email <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sara@example.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full gap-2 text-base font-bold h-13 mt-2"
                  >
                    {loading ? "Booking..." : (
                      <>
                        Confirm my trial
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("pick_slot")}
                    className="w-full gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Pick a different time
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    No payment. No spam. We'll message you on WhatsApp to confirm.
                  </p>
                </form>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Step 1: Slot Picker (default landing) ───────────────────────────────────
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
              One live class. Real teacher. No credit card. Just pick a time.
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

        {/* Slot picker */}
        <section className="py-12 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-1">Pick your trial time</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Choose the day that works for you. All times are in Cairo (Africa/Cairo).
              </p>

              <TrialSlotPicker
                onSelect={handleSlotPicked}
                onBack={() => navigate("/")}
              />

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-border mt-6">
                <div className="flex -space-x-1.5">
                  {["N","M","H","Y","J"].map((l) => (
                    <div key={l} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">{l}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">14 students</span> booked this week
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
