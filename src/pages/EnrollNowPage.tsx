import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
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
import { ArrowLeft, ArrowRight, CreditCard, MapPin, Users, User, Clock, CalendarDays, PartyPopper, ShieldCheck, LogIn } from "lucide-react";
import SchedulePicker from "@/components/SchedulePicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrivateAvailability } from "@/lib/privateAvailability";
import { LEVEL_SELECT_OPTIONS, normalizeLevel, getLevelByKey } from "@/constants/levels";
import { type TierKey, type ClassType, type Duration } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

type Step = 1 | 2 | 3;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  useSEO({ title: "Enroll Now | Klovers Korean Academy", description: "Join Klovers Korean Academy — choose your class type, schedule, and start speaking Korean with confidence." });
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

  // Rehydrate from URL params first, then localStorage draft as fallback
  const getDraft = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem("enroll_draft");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const draft = getDraft();
  const p = (key: string) => searchParams.get(key) || draft[key] || "";

  // Schedule preferences — restore from URL if returning from signup
  const [timezone, setTimezone] = useState(() => p("tz") || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [preferredDays, setPreferredDays] = useState<string[]>(() => {
    const d = p("days") || p("day");
    return d ? d.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  });
  const [preferredTime, setPreferredTime] = useState(p("time"));
  const [startOption, setStartOption] = useState(p("start"));
  const [specificDate, setSpecificDate] = useState(p("date"));

  // Schedule slot selection
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(p("groupId") || null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>(p("groupName"));

  // Korean level selection — selectedLevel stores the DB key (e.g. "foundation", "level_1")
  const [selectedLevel, setSelectedLevel] = useState(p("level"));

  // First-time discount
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Dynamic schedule options from DB — no hardcoded fallbacks
  const [timeWindows, setTimeWindows] = useState<string[]>([]);
  const [startOptions, setStartOptions] = useState<string[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  // Level-specific slot days+times from schedule_packages (includes packageId)
  const [levelSlots, setLevelSlots] = useState<{ day: string; time: string; packageId: string; seatsLeft: number }[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(p("packageId") || null);

  // Draft cleanup is deferred — only clear after successful payment initiation (see handlePay)

  // FIX #1: Explicit rehydration of days/level from URL params on mount
  useEffect(() => {
    const daysParam = searchParams.get("days") || searchParams.get("day");
    if (daysParam && preferredDays.length === 0) {
      setPreferredDays(daysParam.split(",").map(s => s.trim()).filter(Boolean));
    }
    const lvl = searchParams.get("level");
    if (lvl && !selectedLevel) {
      setSelectedLevel(lvl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: run once on mount to rehydrate from URL

  useEffect(() => {
    const fetchScheduleOptions = async () => {
      const { data, error } = await supabase
        .from("schedule_options")
        .select("category, label, sort_order")
        .eq("is_active", true)
        .not("category", "eq", "weekday") // weekdays come from schedule_packages
        .order("sort_order");
      if (error) {
        toast({ title: "Failed to load schedule options", description: error.message, variant: "destructive" });
      }
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
  // Track whether this is the initial load (to avoid clearing rehydrated preferredDays)
  const [initialLevelLoad, setInitialLevelLoad] = useState(true);

  // Reset slots when classType changes
  useEffect(() => {
    setLevelSlots([]);
    setPreferredDays([]);
    setSelectedPackageId(null);
  }, [classType]);

  // Fetch available days+times from schedule_packages when level changes
  useEffect(() => {
    setLevelSlots([]);
    // Only clear preferredDays on level change AFTER initial load (don't clear rehydrated state)
    if (!initialLevelLoad) {
      setPreferredDays([]);
      setSelectedPackageId(null);
    }
    if (!selectedLevel) return;

    // Private classes: fetch private availability (days without group classes)
    if (classType === "private") {
      const loadPrivate = async () => {
        const { options } = await fetchPrivateAvailability();
        const slots = options.map((opt) => ({
          day: opt.weekday,
          time: opt.timeFormatted,
          packageId: `private-${opt.dayIndex}-${opt.time}`,
          seatsLeft: 99, // private slots don't have seat limits in day picker
        }));
        // Deduplicate by day (show first time option per day)
        const seen = new Set<string>();
        const deduped = slots.filter((s) => {
          if (seen.has(s.day)) return false;
          seen.add(s.day);
          return true;
        });
        setLevelSlots(deduped);
        if (initialLevelLoad && preferredDays.length > 0) {
          const matchSlot = deduped.find(s => s.day === preferredDays[0]);
          if (matchSlot) setSelectedPackageId(matchSlot.packageId);
          setInitialLevelLoad(false);
        } else {
          setInitialLevelLoad(false);
        }
      };
      loadPrivate();
      return;
    }

    // Group classes: existing logic
    const fetchLevelSlots = async () => {
      const normalizedLevel = normalizeLevel(selectedLevel);
      const { data } = await supabase
        .from("schedule_packages")
        .select("id, day_of_week, start_time, capacity")
        .eq("level", normalizedLevel)
        .eq("is_active", true)
        .neq("course_type", "private")
        .order("day_of_week");
      const rows = (data as any[]) || [];
      if (rows.length === 0) { setLevelSlots([]); return; }

      // Compute seats_left per package (same pattern as SchedulePicker)
      const pkgIds = rows.map((r: any) => r.id);
      const { data: groups } = await supabase
        .from("pkg_groups")
        .select("id, package_id")
        .in("package_id", pkgIds)
        .eq("is_active", true);
      const groupList = (groups as any[]) || [];
      const groupIds = groupList.map((g: any) => g.id);

      const memberCounts: Record<string, number> = {};
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from("pkg_group_members")
          .select("group_id")
          .in("group_id", groupIds)
          .eq("member_status", "active");
        for (const m of (members as any[]) || []) {
          memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
        }
      }

      const pkgMemberCount: Record<string, number> = {};
      for (const g of groupList) {
        pkgMemberCount[g.package_id] = (pkgMemberCount[g.package_id] || 0) + (memberCounts[g.id] || 0);
      }

      // Deduplicate by day_of_week, keeping first occurrence, include seatsLeft
      const seen = new Set<number>();
      const slots: { day: string; time: string; packageId: string; seatsLeft: number }[] = [];
      for (const r of rows) {
        if (!seen.has(r.day_of_week)) {
          seen.add(r.day_of_week);
          const [h, m] = (r.start_time as string).split(":").map(Number);
          const ampm = h >= 12 ? "PM" : "AM";
          const hour12 = h % 12 || 12;
          const timeLabel = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
          const seatsLeft = Math.max(0, (r.capacity || 5) - (pkgMemberCount[r.id] || 0));
          slots.push({ day: DAY_NAMES[r.day_of_week as number], time: timeLabel, packageId: r.id, seatsLeft });
        }
      }
      setLevelSlots(slots);

      // On initial load, restore selectedPackageId from rehydrated preferredDays
      if (initialLevelLoad && preferredDays.length > 0) {
        const matchSlot = slots.find(s => s.day === preferredDays[0]);
        if (matchSlot) setSelectedPackageId(matchSlot.packageId);
        setInitialLevelLoad(false);
      } else {
        setInitialLevelLoad(false);
      }
    };
    fetchLevelSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, classType]); // intentional: initialLevelLoad/preferredDays are read+written inside; adding them causes infinite loop

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
    if (selectedPackageId) params.set("packageId", selectedPackageId);
    return `/enroll-now?${params.toString()}`;
  };

  // Save draft to localStorage as backup (in case URL params are lost e.g. social login)
  const saveDraft = () => {
    const draftData: Record<string, string> = {};
    if (classType) draftData.classType = classType;
    if (selectedCountry) draftData.country = selectedCountry;
    if (duration) draftData.duration = String(duration);
    if (preferredDays.length) draftData.days = preferredDays.join(",");
    if (preferredTime) draftData.time = preferredTime;
    if (startOption) draftData.start = startOption;
    if (specificDate) draftData.date = specificDate;
    if (timezone) draftData.tz = timezone;
    if (selectedGroupId) draftData.groupId = selectedGroupId;
    if (selectedGroupName) draftData.groupName = selectedGroupName;
    if (selectedLevel) draftData.level = selectedLevel;
    if (selectedPackageId) draftData.packageId = selectedPackageId;
    draftData.step = "3";
    localStorage.setItem("enroll_draft", JSON.stringify(draftData));
  };

  const handleGoToStep3 = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      saveDraft(); // backup to localStorage in case social login loses URL
      const returnUrl = buildReturnUrl(3);
      toast({ title: t("auth.accountRequired"), description: t("auth.accountRequiredDesc"), variant: "destructive" });
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
        saveDraft();
        const returnUrl = buildReturnUrl(3);
        toast({ title: "Please log in", description: "You need to be logged in to place an order.", variant: "destructive" });
        nav(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      // Sync country to profile
      if (selectedCountry && session.user.id) {
        supabase.from("profiles").update({ country: selectedCountry }).eq("user_id", session.user.id).then(() => {});
      }

      const { data, error } = await supabase.rpc("create_egypt_order", {
        _plan_type: classType,
        _duration: duration,
      } as any);
      if (error) {
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
        if (selectedPackageId && !selectedPackageId.startsWith("private-")) schedPrefs.package_id = selectedPackageId;
        if (preferredTime) schedPrefs.preferred_time = preferredTime;
        if (startOption) schedPrefs.preferred_start = startOption === "Specific date" ? specificDate : startOption;
        if (timezone) schedPrefs.timezone = timezone;
        // Always write level to enrollment (triggers sync to profile via DB trigger)
        if (selectedLevel) schedPrefs.level = normalizeLevel(selectedLevel);
        if (Object.keys(schedPrefs).length > 0) {
          await supabase.from("enrollments").update(schedPrefs).eq("id", enrollmentId);
        }
        // Level sync to profile is handled by DB trigger on enrollments.level
      }
      nav(`/pay/${enrollmentId}`);
    } catch (err: any) {
      toast({ title: "Order error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // normalizeLevel imported from constants

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
          user_id: userId || undefined,
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
    // Block payment if schedule fields are missing
    if (!selectedLevel || preferredDays.length === 0 || !selectedPackageId) {
      toast({ title: "Missing schedule", description: "Please select your level and schedule slot before continuing.", variant: "destructive" });
      setStep(2);
      return;
    }
    if (!tier || !duration || !finalPrice || !userId) return;

    if (isEgypt) {
      // Submit lead async before Egypt order
      submitLead();
      await handleEgyptOrder();
      return;
    }

    // Auth is enforced — user must be logged in at this point

    // A) Enforce auth before Stripe checkout
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      saveDraft();
      const returnUrl = buildReturnUrl(3);
      toast({ title: "Account required", description: "Please create an account or log in to continue.", variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setLoading(true);
    try {
      // Submit lead async (don't block checkout)
      submitLead();

      // Sync country to profile
      if (selectedCountry && session.user.id) {
        supabase.from("profiles").update({ country: selectedCountry }).eq("user_id", session.user.id).then(() => {});
      }

      const normalizedLevel = normalizeLevel(selectedLevel);
      const lowerEmail = email.trim().toLowerCase();

      // Level sync to profile is handled by DB trigger on enrollments.level

      // B) Upsert enrollment BEFORE calling create-checkout (safety net)
      const schedFields: Record<string, any> = {
        level: normalizedLevel,
        preferred_day: preferredDays[0],
        timezone,
        status: "PENDING_PAYMENT",
      };
      if (selectedPackageId && !selectedPackageId.startsWith("private-")) schedFields.package_id = selectedPackageId;
      if (preferredTime) schedFields.preferred_time = preferredTime;
      if (preferredDays.length > 0) schedFields.preferred_days = preferredDays;

      const { data: existingRows } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .in("status", ["PENDING", "PENDING_PAYMENT", "DRAFT"] as any)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        await supabase.from("enrollments").update(schedFields as any).eq("id", existingRows[0].id);
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          classType,
          duration,
          name: name.trim(),
          email: lowerEmail,
          level: normalizedLevel,
          package_id: (selectedPackageId && !selectedPackageId.startsWith("private-")) ? selectedPackageId : "",
          schedule: {
            timezone,
            preferred_days: preferredDays,
            preferred_time: preferredTime,
            preferred_start: startOption === "Specific date" ? specificDate : startOption,
          },
        },
      });

      if (error) {
        const desc = error.message?.includes("FunctionNotFound") || error.message?.includes("404")
          ? "Backend function 'create-checkout' is not deployed. Please contact support."
          : error.message;
        throw new Error(desc);
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (data?.url) {
        // C) Post-checkout: update enrollment again (belt + suspenders)
        const { data: postRows } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", session.user.id)
          .in("status", ["PENDING", "PENDING_PAYMENT", "DRAFT"] as any)
          .order("created_at", { ascending: false })
          .limit(1);

        if (postRows && postRows.length > 0) {
          await supabase.from("enrollments").update(schedFields as any).eq("id", postRows[0].id);
        }

        // Clear draft now that payment is initiated
        localStorage.removeItem("enroll_draft");
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Checkout error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [t("enrollNow.choosePlan"), t("enrollNow.schedule"), t("enrollNow.payEnroll")];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">

        {/* Social proof banner */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">⭐ <strong className="text-foreground">4.9</strong> rated</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">👥 <strong className="text-foreground">2,000+</strong> students enrolled</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">🇰🇷 <strong className="text-foreground">A1–C2</strong> all levels</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? "bg-green-500 text-white" :
                  step === i + 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
          {/* Progress track */}
          <div className="relative h-1.5 bg-muted rounded-full mx-4 sm:mx-12">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("enrollNow.chooseYourPlan")}</CardTitle>
              <p className="text-muted-foreground">{t("enrollNow.chooseYourPlanDesc")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("enrollNow.classType")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setClassType("group")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "group" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.groupClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.learnWithOthers")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassType("private")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "private" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.privateClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.oneOnOne")}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("enrollNow.yourCountry")}</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t("enrollNow.selectCountry")} />
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
                    <p className="text-sm text-muted-foreground mb-1">{t("enrollNow.pricingTier")}</p>
                    <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("enrollNow.duration")}</Label>
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
                          <p className="font-bold text-foreground">{d} {d === 1 ? t("enrollNow.month") : t("enrollNow.months")}</p>
                          <p className="text-xs text-muted-foreground">{durationClasses[d]} {t("enrollNow.classes")}</p>
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
                  <span className="text-accent-foreground font-medium">{t("enrollNow.welcomeDiscount")}</span>
                </div>
              )}

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                {t("enrollNow.next")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep1 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedCountry ? t("enrollNow.selectCountryError") : !duration ? t("enrollNow.chooseDurationError") : ""}
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
                    <CalendarDays className="h-6 w-6" /> {t("enrollNow.schedulePreferences")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{t("enrollNow.schedulePreferencesDesc")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Korean Level */}
              <div className="space-y-2">
                <Label>{t("enrollNow.koreanLevel")}</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger><SelectValue placeholder={t("enrollNow.selectLevel")} /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("enrollNow.timezone")}</Label>
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
                <Label>{t("enrollNow.preferredDay")}</Label>
                {classType === "private" && levelSlots.length > 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    {t("enrollNow.privateOnlyNote")}
                  </p>
                )}
                {!selectedLevel ? (
                  <p className="text-sm text-muted-foreground italic">{t("enrollNow.selectLevelFirst")}</p>
                ) : levelSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {classType === "private"
                      ? t("enrollNow.noPrivateDays")
                      : t("enrollNow.noGroupSlots")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {levelSlots.map(({ day, time, seatsLeft }) => {
                      const isFull = classType !== "private" && seatsLeft <= 0;
                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={isFull}
                          onClick={() => !isFull && toggleDay(day)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                            isFull
                              ? "border-border opacity-50 cursor-not-allowed"
                              : preferredDays.includes(day)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="font-semibold">{day}</span>
                          <span className={`text-xs ${isFull ? "text-destructive font-semibold" : preferredDays.includes(day) ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {isFull ? t("enrollNow.full") : time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Time Window — only shown if admin configured options */}
              {timeWindows.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("enrollNow.preferredTime")}</Label>
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
                  <Label>{t("enrollNow.preferredStartDate")}</Label>
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
                {t("enrollNow.next")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep2 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedLevel
                    ? t("enrollNow.selectLevelError")
                    : preferredDays.length === 0
                    ? t("enrollNow.selectDayError")
                    : timeWindows.length > 0 && !preferredTime
                    ? t("enrollNow.selectTimeError")
                    : startOptions.length > 0 && !startOption
                    ? t("enrollNow.selectStartError")
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
                  <CardTitle className="text-2xl">{t("enrollNow.reviewPay")}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {selectedCountry}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auth Gate: if not logged in, show sign-in CTA */}
              {!userId ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("auth.signInToContinue")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.bookingRequiresAccount")}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      saveDraft();
                      const returnUrl = buildReturnUrl(3);
                      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("auth.signInToContinue")}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Authenticated user info */}
                  <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name || email}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </div>

              {/* Price Summary */}
              {duration && originalPrice !== null && finalPrice !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {duration} {duration === 1 ? t("enrollNow.month") : t("enrollNow.months")} ({durationClasses[duration]} {t("enrollNow.classes")})
                    </span>
                    <span className={`font-bold text-foreground ${isFirstTime && !isEgypt ? "line-through text-muted-foreground" : ""}`}>
                      {isEgypt ? `${originalPrice.toLocaleString()} EGP` : `$${originalPrice}`}
                    </span>
                  </div>

                  {isFirstTime && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>{t("enrollNow.firstTimeDiscount")}</span>
                      <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">{t("enrollNow.total")}</span>
                    <span className="font-bold text-lg text-foreground">{isEgypt ? `${finalPrice.toLocaleString()} EGP` : `$${finalPrice.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{durationClasses[duration]} {t("enrollNow.classesIncluded")}</span>
                    <span>{isEgypt ? `${Math.round(finalPrice / durationClasses[duration]).toLocaleString()} EGP${t("enrollNow.perClass")}` : `$${(finalPrice / durationClasses[duration]).toFixed(2)}${t("enrollNow.perClass")}`}</span>
                  </div>
                </div>
              )}

              {/* Schedule Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">{t("enrollNow.schedulePreferencesSummary")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.level")}: {selectedLevel}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.days")}: {preferredDays.join(", ")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.time")}: {preferredTime}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.start")}: {startOption === "Specific date" ? specificDate : startOption}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.timezone")}: {timezone}</p>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!duration || loading}
                onClick={handlePay}
              >
                {loading ? (isEgypt ? t("enrollNow.creatingOrder") : t("enrollNow.redirectingPayment")) : isEgypt ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t("enrollNow.confirmOrder")} ({finalPrice?.toLocaleString() ?? "—"} EGP)
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("enrollNow.payNow")} ${finalPrice?.toFixed(2) ?? "—"} {t("enrollNow.now")}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {isEgypt
                  ? t("enrollNow.redirectReceipt")
                  : t("enrollNow.securePayment")}
              </p>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { icon: "🔒", label: "Secure" },
                  { icon: "✅", label: "Verified Academy" },
                  { icon: "💬", label: "24h Support" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-[10px] text-muted-foreground font-medium text-center">{label}</span>
                  </div>
                ))}
              </div>

              {/* What happens next */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">What happens next?</p>
                {[
                  { step: "1", icon: "✅", title: "Payment confirmed", desc: "You get an instant email receipt." },
                  { step: "2", icon: "📅", title: "Schedule matched", desc: "We confirm your class slot within 24 h." },
                  { step: "3", icon: "🎉", title: "First class!", desc: "We send your meeting link — ready to learn!" },
                ].map(({ step: s, icon, title, desc }) => (
                  <div key={s} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">{s}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{icon} {title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp fallback */}
              <p className="text-xs text-center text-muted-foreground pt-1">
                Need help enrolling?{" "}
                <a
                  href="https://wa.me/601121777560"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-semibold hover:underline"
                >
                  💬 WhatsApp us
                </a>
              </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EnrollNowPage;
