import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, ArrowRight, CreditCard, MapPin, Users, User, Clock, CalendarDays, PartyPopper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { type TierKey, type ClassType, type Duration } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Step = 1 | 2 | 3;

const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

const allCountries = (Object.keys(tierCountries) as TierKey[]).flatMap((tier) =>
  tierCountries[tier].map((c) => ({ country: c, tier }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

const tierPrices: Record<TierKey, Record<ClassType, Record<Duration, number>>> = {
  local: { group: { 1: 25, 3: 70, 6: 130 }, private: { 1: 50, 3: 140, 6: 250 } },
  regional: { group: { 1: 40, 3: 110, 6: 200 }, private: { 1: 80, 3: 220, 6: 380 } },
  global: { group: { 1: 60, 3: 170, 6: 300 }, private: { 1: 120, 3: 330, 6: 580 } },
};

const durationClasses: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_WINDOWS = ["Morning (9am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)"];
const START_OPTIONS = ["ASAP", "Next week", "Specific date"];

const EnrollNowPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>(1);
  const [classType, setClassType] = useState<ClassType>(
    (searchParams.get("classType") as ClassType) || "group"
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Schedule preferences
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState("");
  const [startOption, setStartOption] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  // First-time discount
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      setName(session.user.user_metadata?.name || "");
      setEmail(session.user.email || "");

      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("payment_status", "PAID");

      if (count === 0) setIsFirstTime(true);
    };
    checkFirstTime();
  }, []);

  const tier = useMemo(() => {
    const match = allCountries.find((c) => c.country === selectedCountry);
    return match?.tier ?? null;
  }, [selectedCountry]);

  const originalPrice = useMemo(() => {
    if (!tier || !duration) return null;
    return tierPrices[tier][classType][duration];
  }, [tier, classType, duration]);

  const discountAmount = isFirstTime && originalPrice ? Math.round(originalPrice * 0.1 * 100) / 100 : 0;
  const finalPrice = originalPrice ? originalPrice - discountAmount : null;

  const canProceedStep1 = !!selectedCountry && !!tier && !!duration;

  const toggleDay = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : prev.length < 2 ? [...prev, day] : prev
    );
  };

  const canProceedStep2 = preferredDays.length > 0 && !!preferredTime && !!startOption && (startOption !== "Specific date" || !!specificDate);

  const handlePay = async () => {
    if (!tier || !duration || !name.trim() || !email.trim() || !finalPrice) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          classType,
          duration,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          schedule: {
            timezone,
            preferred_days: preferredDays,
            preferred_time: preferredTime,
            preferred_start: startOption === "Specific date" ? specificDate : startOption,
          },
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Checkout error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Choose Plan", "Schedule", "Pay & Enroll"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step >= (i + 1) ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= (i + 1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className={`w-8 sm:w-12 h-0.5 ${step > (i + 1) ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
              <p className="text-muted-foreground">Select your class type, country, and duration.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Class Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setClassType("group")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "group" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-semibold text-foreground">Group Classes</span>
                    <span className="text-xs text-muted-foreground">Learn with others</span>
                  </button>
                  <button
                    onClick={() => setClassType("private")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "private" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className="h-6 w-6" />
                    <span className="font-semibold text-foreground">Private Classes</span>
                    <span className="text-xs text-muted-foreground">1-on-1 sessions</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select your country" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map(({ country }) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tier && (
                <>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Your pricing tier</p>
                    <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {([1, 3, 6] as Duration[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            duration === d ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-bold text-foreground">{d} {d === 1 ? "Month" : "Months"}</p>
                          <p className="text-xs text-muted-foreground">{durationClasses[d]} classes</p>
                          <p className="text-sm font-bold text-foreground mt-1">${tierPrices[tier][classType][d]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isFirstTime && (
                <div className="bg-accent rounded-lg p-3 flex items-center gap-2 text-sm">
                  <PartyPopper className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-accent-foreground font-medium">🎉 Welcome! 10% first-time student discount will be applied.</span>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Schedule Preferences */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CalendarDays className="h-6 w-6" /> Schedule Preferences
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">Help us find the best time for your classes.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Days */}
              <div className="space-y-2">
                <Label>Preferred Weekdays (select up to 2)</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        preferredDays.includes(day)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Window */}
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TIME_WINDOWS.map((tw) => (
                    <button
                      key={tw}
                      onClick={() => setPreferredTime(tw)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all text-center ${
                        preferredTime === tw ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-foreground font-medium">{tw}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Preferred Start Date</Label>
                <div className="grid grid-cols-3 gap-2">
                  {START_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStartOption(opt)}
                      className={`p-2 rounded-lg border-2 text-sm transition-all text-center ${
                        startOption === opt ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-foreground font-medium">{opt}</span>
                    </button>
                  ))}
                </div>
                {startOption === "Specific date" && (
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your schedule will be confirmed within 24 hours after payment.
              </p>

              <Button className="w-full" size="lg" disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Pay & Enroll */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Review & Pay</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {classType === "group" ? "Group" : "Private"} classes · {selectedCountry}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name & Email */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>

              {/* Price Summary */}
              {duration && originalPrice !== null && finalPrice !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {classType === "group" ? "Group" : "Private"} · {duration} {duration === 1 ? "month" : "months"} ({durationClasses[duration]} classes)
                    </span>
                    <span className={`font-bold text-foreground ${isFirstTime ? "line-through text-muted-foreground" : ""}`}>
                      ${originalPrice}
                    </span>
                  </div>

                  {isFirstTime && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>🎉 First-time 10% discount</span>
                      <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-foreground">${finalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{durationClasses[duration]} classes included</span>
                    <span>${(finalPrice / durationClasses[duration]).toFixed(2)}/class</span>
                  </div>
                </div>
              )}

              {/* Schedule Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">Schedule Preferences</p>
                <p className="text-xs text-muted-foreground">Days: {preferredDays.join(", ")}</p>
                <p className="text-xs text-muted-foreground">Time: {preferredTime}</p>
                <p className="text-xs text-muted-foreground">Start: {startOption === "Specific date" ? specificDate : startOption}</p>
                <p className="text-xs text-muted-foreground">Timezone: {timezone}</p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!duration || !name.trim() || !email.trim() || loading}
                onClick={handlePay}
              >
                {loading ? "Redirecting to payment..." : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${finalPrice?.toFixed(2) ?? "—"} Now
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment via Stripe. Your account will be created automatically after payment.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EnrollNowPage;
