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
import { ArrowLeft, ArrowRight, CreditCard, MapPin, Users, User, Clock, CalendarDays, PartyPopper, ShieldCheck } from "lucide-react";
import SchedulePicker from "@/components/SchedulePicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { type TierKey, type ClassType, type Duration } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

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

const egpPrices: Record<ClassType, Record<Duration, number>> = {
  group: { 1: 1200, 3: 3300, 6: 6100 },
  private: { 1: 2350, 3: 6600, 6: 11750 },
};

const durationClasses: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

  // Schedule options are fetched dynamically from DB; no hardcoded fallbacks

const EnrollNowPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const initialStep = Number(searchParams.get("step")) as Step;
  const [step, setStep] = useState<Step>(initialStep === 2 || initialStep === 3 ? initialStep : 1);
  const [classType, setClassType] = useState<ClassType>(
    (searchParams.get("classType") as ClassType) || "group"
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "");
  const [duration, setDuration] = useState<Duration | null>(
    searchParams.get("duration") ? (Number(searchParams.get("duration")) as Duration) : null
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const isEgypt = selectedCountry === "Egypt";

  // Schedule preferences — restore from URL if returning from signup
  const [timezone, setTimezone] = useState(() => searchParams.get("tz") || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState(searchParams.get("time") || "");
  const [startOption, setStartOption] = useState(searchParams.get("start") || "");
  const [specificDate, setSpecificDate] = useState(searchParams.get("date") || "");

  // Schedule slot selection
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(searchParams.get("groupId") || null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>(searchParams.get("groupName") || "");

  // Korean level selection
  const LEVELS = ["Beginner 1", "Beginner 2", "Intermediate 1", "Intermediate 2", "Advanced 1", "Advanced 2", "Topik 1", "Topik 2"];
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get("level") || "");

  // First-time discount
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Dynamic schedule options from DB — no hardcoded fallbacks
  const [timeWindows, setTimeWindows] = useState<string[]>([]);
  const [startOptions, setStartOptions] = useState<string[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  // Level-specific slot days+times from schedule_packages (includes packageId)
  const [levelSlots, setLevelSlots] = useState<{ day: string; time: string; packageId: string }[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduleOptions = async () => {
      const { data } = await supabase
        .from("schedule_options" as any)
        .select("category, label, sort_order")
        .eq("is_active", true)
        .not("category", "eq", "weekday") // weekdays come from schedule_packages
        .order("sort_order");
      const items = (data as any[]) || [];
      const tw = items.filter((i: any) => i.category === "time_window").map((i: any) => i.label);
      const so = items.filter((i: any) => i.category === "start_option").map((i: any) => i.label);
      setTimeWindows(tw);
      setStartOptions(so);
      setOptionsLoaded(true);
    };
    fetchScheduleOptions();
  }, []);

  // Day names indexed by day_of_week number
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch available days+times from schedule_packages when level changes
  useEffect(() => {
    setLevelSlots([]);
    setPreferredDays([]);
    if (!selectedLevel) return;
    const fetchLevelSlots = async () => {
      const normalizedLevel = selectedLevel.toLowerCase().replace(/\s+/g, "_");
      const { data } = await supabase
        .from("schedule_packages" as any)
        .select("id, day_of_week, start_time")
        .eq("level", normalizedLevel)
        .eq("is_active", true)
        .order("day_of_week");
      const rows = (data as any[]) || [];
      // Deduplicate by day_of_week, keeping first occurrence
      const seen = new Set<number>();
      const slots: { day: string; time: string; packageId: string }[] = [];
      for (const r of rows) {
        if (!seen.has(r.day_of_week)) {
          seen.add(r.day_of_week);
          const [h, m] = (r.start_time as string).split(":").map(Number);
          const ampm = h >= 12 ? "PM" : "AM";
          const hour12 = h % 12 || 12;
          const timeLabel = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
          slots.push({ day: DAY_NAMES[r.day_of_week as number], time: timeLabel, packageId: r.id });
        }
      }
      setLevelSlots(slots);
    };
    fetchLevelSlots();
  }, [selectedLevel]);

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
    if (isEgypt) return egpPrices[classType][duration];
    return tierPrices[tier][classType][duration];
  }, [tier, classType, duration, isEgypt]);

  const discountAmount = isFirstTime && originalPrice && !isEgypt ? Math.round(originalPrice * 0.1 * 100) / 100 : 0;
  const finalPrice = originalPrice ? originalPrice - discountAmount : null;

  const canProceedStep1 = !!selectedCountry && !!tier && !!duration;

  // Day selection: always 1 preferred day
  const maxDays = 1;
  const toggleDay = (day: string) => {
    setPreferredDays((prev) => {
      if (prev.includes(day)) {
        setSelectedPackageId(null);
        return prev.filter((d) => d !== day);
      }
      // Always single-select: replace any existing
      const slot = levelSlots.find((s) => s.day === day);
      setSelectedPackageId(slot?.packageId ?? null);
      return [day];
    });
  };

  // Build a URL that preserves all current selections so user can return after signup
  const buildReturnUrl = (targetStep: Step) => {
    const params = new URLSearchParams();
    params.set("classType", classType);
    if (selectedCountry) params.set("country", selectedCountry);
    if (duration) params.set("duration", String(duration));
    params.set("step", String(targetStep));
    if (preferredDays.length) params.set("days", preferredDays.join(","));
    if (preferredTime) params.set("time", preferredTime);
    if (startOption) params.set("start", startOption);
    if (specificDate) params.set("date", specificDate);
    if (timezone) params.set("tz", timezone);
    if (selectedGroupId) params.set("groupId", selectedGroupId);
    if (selectedGroupName) params.set("groupName", selectedGroupName);
    if (selectedLevel) params.set("level", selectedLevel);
    return `/enroll-now?${params.toString()}`;
  };

  const handleGoToStep3 = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const returnUrl = buildReturnUrl(3);
      toast({ title: "Account required", description: "Please create an account or log in to continue.", variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setStep(3);
  };

  // preferredTime is only required if the admin has configured time window options
  // Only require preferredTime if admin has configured time windows; only require startOption if admin has configured start options
  const canProceedStep2 = !!selectedLevel && preferredDays.length > 0 && (timeWindows.length === 0 || !!preferredTime) && (startOptions.length === 0 || (!!startOption && (startOption !== "Specific date" || !!specificDate)));

  const handleEgyptOrder = async () => {
    if (!duration) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const returnUrl = buildReturnUrl(3);
        toast({ title: "Please log in", description: "You need to be logged in to place an order.", variant: "destructive" });
        nav(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      const { data, error } = await supabase.rpc("create_egypt_order", {
        _plan_type: classType,
        _duration: duration,
      } as any);
      if (error) {
        console.log("Egypt order RPC error:", error);
        const desc = error.message?.includes("not found") || error.code === "PGRST202"
          ? "Backend function 'create_egypt_order' is missing or not accessible. Please contact support."
          : error.message;
        throw new Error(desc);
      }
      // Save schedule preferences + level to the enrollment and profile
      const enrollmentId = data as string;
        if (enrollmentId) {
        const schedPrefs: any = {};
        if (preferredDays.length > 0) {
          schedPrefs.preferred_days = preferredDays;
          schedPrefs.preferred_day = preferredDays[0];
        }
        if (selectedPackageId) schedPrefs.package_id = selectedPackageId;
        if (preferredTime) schedPrefs.preferred_time = preferredTime;
        if (startOption) schedPrefs.preferred_start = startOption === "Specific date" ? specificDate : startOption;
        if (timezone) schedPrefs.timezone = timezone;
        // Always write level to enrollment (triggers sync to profile via DB trigger)
        if (selectedLevel) schedPrefs.level = normalizeLevel(selectedLevel);
        if (Object.keys(schedPrefs).length > 0) {
          await supabase.from("enrollments").update(schedPrefs).eq("id", enrollmentId);
        }
        // Also save level to profile directly (belt + suspenders)
        if (selectedLevel) {
          await supabase.from("profiles").update({ level: normalizeLevel(selectedLevel) }).eq("user_id", session.user.id);
        }
      }
      nav(`/pay/${enrollmentId}`);
    } catch (err: any) {
      toast({ title: "Order error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const normalizeLevel = (label: string): string =>
    label.trim().toLowerCase().replace(/\s+/g, "_");

  const submitLead = async () => {
    try {
      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          country: selectedCountry,
          level: selectedLevel ? normalizeLevel(selectedLevel) : "",
          goal: `${classType} ${duration}mo – ${tier} tier, ${preferredDays.join("/")} ${preferredTime}, tz:${timezone}`,
          plan_type: classType,
          duration: `${duration}mo`,
          schedule: `${preferredDays.join("/")} ${preferredTime}`,
          timezone: timezone,
          source: isEgypt ? "egypt" : "stripe",
        },
      });
      if (error) {
        console.error("Lead submit failed:", error);
        toast({ title: "Lead capture failed", description: error.message, variant: "destructive" });
      }
    } catch (err) {
      console.error("Lead submit error:", err);
    }
  };

  const handlePay = async () => {
    if (!tier || !duration || !name.trim() || !email.trim() || !finalPrice) return;

    if (isEgypt) {
      // Submit lead async before Egypt order
      submitLead();
      await handleEgyptOrder();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Submit lead async (don't block checkout)
      submitLead();

      // Save level to profile if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session && selectedLevel) {
        await supabase.from("profiles").update({ level: normalizeLevel(selectedLevel) }).eq("user_id", session.user.id);
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          classType,
          duration,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          level: selectedLevel ? normalizeLevel(selectedLevel) : "",
          package_id: selectedPackageId || "",
          schedule: {
            timezone,
            preferred_days: preferredDays,
            preferred_time: preferredTime,
            preferred_start: startOption === "Specific date" ? specificDate : startOption,
          },
        },
      });

      if (error) {
        console.log("create-checkout invoke error:", error);
        const desc = error.message?.includes("FunctionNotFound") || error.message?.includes("404")
          ? "Backend function 'create-checkout' is not deployed. Please contact support."
          : error.message;
        throw new Error(desc);
      }
      if (data?.error) {
        console.log("create-checkout returned error:", data.error);
        throw new Error(data.error);
      }
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
                    type="button"
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
                    type="button"
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
                          type="button"
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            duration === d ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-bold text-foreground">{d} {d === 1 ? "Month" : "Months"}</p>
                          <p className="text-xs text-muted-foreground">{durationClasses[d]} classes</p>
                          <p className="text-sm font-bold text-foreground mt-1">{isEgypt ? `${egpPrices[classType][d].toLocaleString()} EGP` : `$${tierPrices[tier][classType][d]}`}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isFirstTime && !isEgypt && (
                <div className="bg-accent rounded-lg p-3 flex items-center gap-2 text-sm">
                  <PartyPopper className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-accent-foreground font-medium">🎉 Welcome! 10% first-time student discount will be applied.</span>
                </div>
              )}

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep1 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedCountry ? "Please select your country." : !duration ? "Please choose a duration." : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Schedule Preferences */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
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
              {/* Korean Level */}
              <div className="space-y-2">
                <Label>Korean Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Days */}
              <div className="space-y-2">
                <Label>Preferred Day (select 1)</Label>
                {!selectedLevel ? (
                  <p className="text-sm text-muted-foreground italic">Please select your Korean level first.</p>
                ) : levelSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No schedule slots available for this level yet. Contact us.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {levelSlots.map(({ day, time }) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                          preferredDays.includes(day)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        <span className="font-semibold">{day}</span>
                        <span className={`text-xs ${preferredDays.includes(day) ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Window — only shown if admin configured options */}
              {timeWindows.length > 0 && (
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {timeWindows.map((tw) => (
                      <button
                        type="button"
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
              )}

              {/* Start Date — only shown if admin configured options */}
              {startOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Preferred Start Date</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {startOptions.map((opt) => (
                      <button
                        type="button"
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
              )}

              <p className="text-xs text-muted-foreground text-center">
                Your schedule will be confirmed within 24 hours after payment.
              </p>

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep2} onClick={handleGoToStep3}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep2 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedLevel
                    ? "Please select your Korean level."
                    : preferredDays.length === 0
                    ? "Please select at least 1 preferred day."
                    : timeWindows.length > 0 && !preferredTime
                    ? "Please select a preferred time."
                    : startOptions.length > 0 && !startOption
                    ? "Please select a preferred start date."
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Pay & Enroll */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
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
                    <span className={`font-bold text-foreground ${isFirstTime && !isEgypt ? "line-through text-muted-foreground" : ""}`}>
                      {isEgypt ? `${originalPrice.toLocaleString()} EGP` : `$${originalPrice}`}
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
                    <span className="font-bold text-lg text-foreground">{isEgypt ? `${finalPrice.toLocaleString()} EGP` : `$${finalPrice.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{durationClasses[duration]} classes included</span>
                    <span>{isEgypt ? `${Math.round(finalPrice / durationClasses[duration]).toLocaleString()} EGP/class` : `$${(finalPrice / durationClasses[duration]).toFixed(2)}/class`}</span>
                  </div>
                </div>
              )}

              {/* Schedule Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">Schedule Preferences</p>
                <p className="text-xs text-muted-foreground">Level: {selectedLevel}</p>
                <p className="text-xs text-muted-foreground">Days: {preferredDays.join(", ")}</p>
                <p className="text-xs text-muted-foreground">Time: {preferredTime}</p>
                <p className="text-xs text-muted-foreground">Start: {startOption === "Specific date" ? specificDate : startOption}</p>
                <p className="text-xs text-muted-foreground">Timezone: {timezone}</p>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isEgypt ? (!duration || loading) : (!duration || !name.trim() || !email.trim() || loading)}
                onClick={handlePay}
              >
                {loading ? (isEgypt ? "Creating order..." : "Redirecting to payment...") : isEgypt ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Confirm Order ({finalPrice?.toLocaleString() ?? "—"} EGP)
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${finalPrice?.toFixed(2) ?? "—"} Now
                  </>
                )}
              </Button>
              {!isEgypt && (!name.trim() || !email.trim()) && (
                <p className="text-xs text-destructive text-center">
                  {!name.trim() ? "Please enter your full name." : "Please enter your email address."}
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {isEgypt
                  ? "You'll be redirected to upload your payment receipt."
                  : "Secure payment via Stripe. Your account will be created automatically after payment."}
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
