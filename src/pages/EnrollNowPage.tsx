import { useState, useMemo, useEffect } from "react";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { ArrowLeft, ArrowRight, CreditCard, LogIn, CheckCircle2, Loader2 } from "lucide-react";
import SchedulePicker from "@/components/SchedulePicker";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrivateAvailability } from "@/lib/privateAvailability";
import { LEVEL_SELECT_OPTIONS, normalizeLevel, getLevelByKey } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { getAttribution } from "@/lib/leadSession";
import { type TierKey, type ClassType, type Duration, tierCountries, DURATION_CLASSES, normalizeCountry, resolveCurrency, getPriceFor, formatMoney } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { track } from "@/lib/tracking";
import { convertSlotToTimezone } from "@/lib/admin-utils";
import { setUserTimezone } from "@/lib/viewerTimezone";
import { RATING, STUDENTS_TAUGHT, TEACHING_YEARS_COUNT, toArabicDigits } from "@/lib/trustFigures";
import { countryLabel } from "@/lib/countryNames";

type Step = 1 | 2 | 3 | 4;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const allCountries = (Object.keys(tierCountries) as TierKey[]).flatMap((tier) =>
  tierCountries[tier].map((c) => ({ country: c, tier }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

// The Egyptian prices used to be copied into this file. They now come from
// stripePrices.ts, which the pricing page and /enroll read too — one table, so
// the three cannot disagree about what a month costs.

const durationClasses = DURATION_CLASSES;

// Arabic currency names (same map as PricingSection), so an Arabic price reads
// "١٬٢٠٠ جنيه" rather than "1,200 EGP".
const CURRENCY_AR: Record<string, string> = {
  EGP: "جنيه", USD: "دولار", MAD: "درهم مغربي", TND: "دينار تونسي", DZD: "دينار جزائري",
  LYD: "دينار ليبي", JOD: "دينار أردني", IQD: "دينار عراقي", MYR: "رينجت", IDR: "روبية إندونيسية",
  THB: "بات تايلاندي", VND: "دونغ فيتنامي", PHP: "بيزو فلبيني", INR: "روبية هندية", PKR: "روبية باكستانية",
  BRL: "ريال برازيلي", MXN: "بيزو مكسيكي", COP: "بيزو كولومبي", TRY: "ليرة تركية", AED: "درهم إماراتي",
  UAE: "درهم إماراتي", SAR: "ريال سعودي", QAR: "ريال قطري", BHD: "دينار بحريني", OMR: "ريال عُماني",
  KWD: "دينار كويتي", GBP: "جنيه إسترليني", EUR: "يورو", CAD: "دولار كندي", AUD: "دولار أسترالي",
  JPY: "ين ياباني", KRW: "وون كوري", CNY: "يوان صيني",
};
/** 1200 -> "١٬٢٠٠", 22.5 -> "٢٢٫٥": Arabic-Indic digits with Arabic separators. */
const arNumber = (n: number): string =>
  toArabicDigits(n.toLocaleString("en-US", { maximumFractionDigits: 2 })).replace(/,/g, "٬").replace(/\./g, "٫");
/** Arabic money: whole pounds for EGP (as formatMoney does), no trailing ".00". */
const formatMoneyAr = (amount: number, currency: string): string =>
  `${arNumber(currency === "EGP" ? Math.round(amount) : Math.round(amount * 100) / 100)} ${CURRENCY_AR[currency] ?? currency}`;
/** 1 -> "شهر واحد", 3 -> "٣ أشهر", 6 -> "٦ أشهر". */
const monthsAr = (n: number): string => (n === 1 ? "شهر واحد" : n === 2 ? "شهران" : `${toArabicDigits(n)} ${n <= 10 ? "أشهر" : "شهرًا"}`);
/** 4 -> "٤ حصص", 12 -> "١٢ حصة", 24 -> "٢٤ حصة" (3–10 plural, 11+ singular). */
const classesAr = (n: number): string => (n === 1 ? "حصة واحدة" : n === 2 ? "حصتان" : `${toArabicDigits(n)} ${n <= 10 ? "حصص" : "حصة"}`);


const EnrollNowPage = () => {

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "enroll-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Korean Language Classes — Klovers",
      "description": "Live Korean classes with a real teacher. Group and private options available for all levels.",
      "provider": {
        "@type": "Organization",
        "name": "Klovers",
        "url": "https://kloversegy.com"
      },
      "inLanguage": "en",
      "courseMode": "online",
      "url": "https://kloversegy.com/enroll-now",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kloversegy.com/" },
          { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://kloversegy.com/pricing" },
          { "@type": "ListItem", "position": 3, "name": "Enroll Now", "item": "https://kloversegy.com/enroll-now" }
        ]
      }
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => { track.pageView(); }, []);

  const [searchParams] = useSearchParams();
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "التسجيل في حصص الكورية" : "Enroll Now | Klovers",
    description: isAr
      ? "التسجيل في كلوفرز: اختيار نوع الحصة والجدول، ثم بدء التحدث بالكورية بثقة."
      : "Join Klovers — choose your class type, schedule, and start speaking Korean with confidence.",
    canonical: "https://kloversegy.com/enroll-now",
  });
  const localDayNames: string[] = tArray("enrollNow", "dayNames").length === 7
    ? tArray("enrollNow", "dayNames") as string[]
    : DAY_NAMES;

  const initialStep = Number(searchParams.get("step")) as Step;
  // Step 3 was removed (redundant with Step 2) — legacy URLs that point to 3
  // bump to 4 so returning users land on Pay & Enroll.
  const [step, setStep] = useState<Step>(
    initialStep === 2 ? 2 :
    initialStep === 3 ? 4 :
    initialStep === 4 ? 4 : 1
  );
  const [classType, setClassType] = useState<ClassType>(
    (searchParams.get("classType") as ClassType) || "group"
  );
  const [selectedCountry, setSelectedCountry] = useState(normalizeCountry(searchParams.get("country")));
  // null until the profile has been looked at, so the seeding effect below can
  // tell "not loaded yet" from "loaded, and the column was empty".
  const [profileCountry, setProfileCountry] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration | null>(
    searchParams.get("duration") ? (Number(searchParams.get("duration")) as Duration) : null
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [egyptPaymentMethod, setEgyptPaymentMethod] = useState<string>("");
  const nav = useNavigate();

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
  useEffect(() => { setUserTimezone(timezone); }, [timezone]);

  // Country first, timezone second — a single rule, shared with /enroll, instead
  // of a string compare that missed "egypt", "ismailia", "Other" and a blank.
  const resolvedCountry = useMemo(() => normalizeCountry(selectedCountry, timezone), [selectedCountry, timezone]);
  const isEgypt = resolvedCountry === "Egypt";

  // ?country= wins, then profiles.country, then the timezone. The column is
  // blank for most students, so in practice the timezone is what seeds this.
  useEffect(() => {
    if (selectedCountry || profileCountry === null) return;
    const seeded = normalizeCountry(profileCountry, timezone);
    if (seeded) setSelectedCountry(seeded);
  }, [selectedCountry, profileCountry, timezone]);
  const [preferredDays, setPreferredDays] = useState<string[]>(() => {
    const d = p("days") || p("day");
    return d ? d.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  });

  // Schedule slot selection
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(p("groupId") || null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>(p("groupName"));

  // Korean level selection — selectedLevel stores the canonical DB key (e.g. "hangul", "l1")
  const [selectedLevel, setSelectedLevel] = useState(p("level"));

  // Student preference for scheduling
  const [preferredDayOfWeek, setPreferredDayOfWeek] = useState<number | null>(null);
  const [preferredStartTime, setPreferredStartTime] = useState<string>("");

  // First-time discount
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string; discount_pct: number | null; discount_flat: number | null; currency: string | null;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

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
        .select("id, day_of_week, start_time, capacity, timezone")
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

      // Deduplicate by admin-side day_of_week; convert each slot to the learner's timezone for display
      const seen = new Set<number>();
      const slots: { day: string; time: string; packageId: string; seatsLeft: number }[] = [];
      for (const r of rows) {
        if (!seen.has(r.day_of_week)) {
          seen.add(r.day_of_week);
          const srcTz = r.timezone || "Africa/Cairo";
          const local = convertSlotToTimezone(r.day_of_week, r.start_time, srcTz, timezone);
          const seatsLeft = Math.max(0, (r.capacity || 5) - (pkgMemberCount[r.id] || 0));
          slots.push({ day: local.weekday, time: local.timeFormatted, packageId: r.id, seatsLeft });
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
      if (!session) { setProfileCountry(""); return; }
      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Prefer profile name → user_metadata name → email prefix as last resort
      const metaName = session.user.user_metadata?.name || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, country")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfileCountry((profile as any)?.country || "");
      const profileName = (profile as any)?.name || "";
      const fallbackName = (session.user.email || "").split("@")[0];
      setName(profileName || metaName || fallbackName);

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
    const match = allCountries.find((c) => c.country === resolvedCountry);
    return match?.tier ?? null;
  }, [resolvedCountry]);

  const priced = useMemo(
    () => (duration ? getPriceFor(selectedCountry, timezone, classType, duration) : null),
    [selectedCountry, timezone, classType, duration],
  );
  const originalPrice = priced?.amount ?? null;
  const currency = priced?.currency ?? resolveCurrency(selectedCountry, timezone);

  /** Price in the page language: "1,200 EGP" / "$25.00" in English, "١٬٢٠٠ جنيه" / "٢٥ دولار" in Arabic. */
  const money = (amount: number, cur: string) => (isAr ? formatMoneyAr(amount, cur) : formatMoney(amount, cur));
  const monthsLabel = (d: number) => (isAr ? monthsAr(d) : `${d} ${d === 1 ? t("enrollNow.month") : t("enrollNow.months")}`);
  const classesLabel = (n: number) => (isAr ? classesAr(n) : `${n} ${t("enrollNow.classes")}`);

  /** One duration button's price label, in the student's own currency. */
  const priceLabelFor = (d: Duration) => {
    const p = getPriceFor(selectedCountry, timezone, classType, d);
    return p ? money(p.amount, p.currency) : "—";
  };

  const discountAmount = isFirstTime && originalPrice && !isEgypt ? Math.round(originalPrice * 0.1 * 100) / 100 : 0;
  const promoDiscountAmount = useMemo(() => {
    if (!promoApplied || !originalPrice) return 0;
    const base = originalPrice - discountAmount;
    if (promoApplied.discount_pct) return Math.round(base * promoApplied.discount_pct / 100 * 100) / 100;
    if (promoApplied.discount_flat) return Math.min(promoApplied.discount_flat, base);
    return 0;
  }, [promoApplied, originalPrice, discountAmount]);
  const finalPrice = originalPrice ? Math.max(0, originalPrice - discountAmount - promoDiscountAmount) : null;

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
    if (timezone) draftData.tz = timezone;
    if (selectedGroupId) draftData.groupId = selectedGroupId;
    if (selectedGroupName) draftData.groupName = selectedGroupName;
    if (selectedLevel) draftData.level = selectedLevel;
    if (selectedPackageId) draftData.packageId = selectedPackageId;
    draftData.step = "4";
    localStorage.setItem("enroll_draft", JSON.stringify(draftData));
  };

  const handleGoToStep3 = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      saveDraft(); // backup to localStorage in case social login loses URL
      const returnUrl = buildReturnUrl(4);
      toast({ title: t("auth.accountRequired"), description: t("auth.accountRequiredDesc"), variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    // The old Step 3 (preferred day/time re-ask) was redundant with Step 2 and
    // has been removed. Derive the day-of-week/start-time from the Step 2
    // selections so the enrollment row still carries them into the DB.
    const primaryDay = preferredDays[0];
    if (primaryDay) {
      const dayIdx = DAY_NAMES.indexOf(primaryDay);
      if (dayIdx >= 0) setPreferredDayOfWeek(dayIdx);
      const slot = levelSlots.find((s) => s.day === primaryDay);
      if (slot) {
        // slot.time is a display label like "6:00 PM" — convert to "HH:MM".
        const match = slot.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2];
          const ampm = match[3].toUpperCase();
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          setPreferredStartTime(`${String(h).padStart(2, "0")}:${m}`);
        }
      }
    }
    submitLead(); // lead capture on checkout entry (moved from removed Step 3)
    setStep(4);
  };

  const canProceedStep2 = !!selectedLevel && preferredDays.length > 0;

  const handleEgyptOrder = async () => {
    if (!duration) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        saveDraft();
        const returnUrl = buildReturnUrl(4);
        toast({ title: t("enrollToasts.pleaseLogIn"), description: t("enrollToasts.pleaseLogInDesc"), variant: "destructive" });
        nav(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      // Sync country to profile
      if (resolvedCountry && session.user.id) {
        supabase.from("profiles").update({ country: resolvedCountry }).eq("user_id", session.user.id).then(() => {});
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
        if (timezone) schedPrefs.timezone = timezone;
        // Always write level to enrollment (triggers sync to profile via DB trigger)
        if (selectedLevel) schedPrefs.level = normalizeLevel(selectedLevel);
        if (egyptPaymentMethod) schedPrefs.payment_method = egyptPaymentMethod;
        if (Object.keys(schedPrefs).length > 0) {
          await supabase.from("enrollments").update(schedPrefs).eq("id", enrollmentId);
        }
        // Level sync to profile is handled by DB trigger on enrollments.level
      }
      track.initiateCheckout({ value: finalPrice ?? 0, currency });
      logLeadEvent({ source_type: "enroll", cta_label: "checkout", metadata: { value: finalPrice ?? 0, country: selectedCountry } });
      nav(`/pay/${enrollmentId}`);
    } catch (err: any) {
      console.error("Egypt order failed:", err);
      toast({ title: t("enrollToasts.orderError"), description: t("enrollToasts.genericError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // normalizeLevel imported from constants

  const submitLead = async () => {
    try {
      const attribution = getAttribution();
      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          country: selectedCountry,
          level: selectedLevel ? normalizeLevel(selectedLevel) : "",
          goal: `${classType} ${duration}mo – ${tier} tier, ${preferredDays.join("/")}, tz:${timezone}`,
          plan_type: classType,
          duration: `${duration}mo`,
          schedule: preferredDays.join("/"),
          timezone: timezone,
          source: isEgypt ? "egypt" : "stripe",
          user_id: userId || undefined,
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.campaign,
          utm_content: attribution.utm_content,
          gclid: attribution.gclid,
        },
      });
      if (error) {
        console.error("Lead submit failed:", error);
        toast({ title: t("enrollToasts.leadCaptureFailed"), description: t("enrollToasts.genericError"), variant: "destructive" });
      }
    } catch (err) {
      console.error("Lead submit error:", err);
      toast({ title: t("enrollToasts.couldNotSave"), description: t("enrollToasts.couldNotSaveDesc"), variant: "destructive" });
    }
  };

  // Apply promo code
  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoApplied(null);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_pct, discount_flat, currency, max_uses, uses_count, expires_at, active")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) {
      setPromoError(isAr ? "رمز الخصم غير صحيح. تُرجى المراجعة والمحاولة مرة أخرى." : "Invalid promo code. Please check and try again.");
      setPromoLoading(false);
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromoError(isAr ? "انتهت صلاحية رمز الخصم." : "This promo code has expired.");
      setPromoLoading(false);
      return;
    }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) {
      setPromoError(isAr ? "وصل رمز الخصم إلى الحد الأقصى للاستخدام." : "This promo code has reached its usage limit.");
      setPromoLoading(false);
      return;
    }
    if (data.currency && data.currency !== (isEgypt ? "EGP" : "USD")) {
      setPromoError(isAr ? `هذا الرمز صالح فقط للدفع بعملة ${CURRENCY_AR[data.currency] ?? data.currency}.` : `This code is only valid for ${data.currency} payments.`);
      setPromoLoading(false);
      return;
    }
    setPromoApplied({ code: data.code, discount_pct: data.discount_pct, discount_flat: data.discount_flat, currency: data.currency });
    toast({ title: isAr ? `طُبّق رمز الخصم «${code}»` : `Promo code "${code}" applied!` });
    setPromoLoading(false);
  };

  const handlePay = async () => {
    // Block payment if core schedule fields are missing (package is optional — may be preference-only)
    if (!selectedLevel || preferredDays.length === 0) {
      toast({ title: t("enrollToasts.missingSchedule"), description: t("enrollToasts.missingScheduleDesc"), variant: "destructive" });
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
      const returnUrl = buildReturnUrl(4);
      toast({ title: t("enrollToasts.accountRequired"), description: t("enrollToasts.accountRequiredDesc"), variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (loading) return; // Prevent double-click race condition
    setLoading(true);
    try {
      // Submit lead async (don't block checkout)
      submitLead();

      // Sync country to profile
      if (resolvedCountry && session.user.id) {
        supabase.from("profiles").update({ country: resolvedCountry }).eq("user_id", session.user.id).then(() => {});
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
      if (preferredDays.length > 0) schedFields.preferred_days = preferredDays;
      // Add student preference for scheduling (from step 3)
      if (preferredDayOfWeek !== null) schedFields.preferred_day_of_week = preferredDayOfWeek;
      if (preferredStartTime) schedFields.preferred_start_time = preferredStartTime;

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

        // Clear draft BEFORE opening Stripe (so user can't lose state on back-nav)
        localStorage.removeItem("enroll_draft");
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Checkout failed:", err);
      toast({ title: t("enrollToasts.checkoutError"), description: t("enrollToasts.genericError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const levelLabelAr = selectedLevel ? getLevelByKey(normalizeLevel(selectedLevel))?.shortLabel_ar ?? "" : "";
  const pillMessage = isAr ? "مرحبًا، لديّ سؤال قبل التسجيل في كلوفرز." : "Hi! I have a question before enrolling in Klovers.";

  const stepLabels = [t("enrollNow.choosePlan"), t("enrollNow.schedule"), t("enrollNow.payEnroll")];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">

        {/* Social proof banner */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">{isAr ? <><strong className="text-foreground">{toArabicDigits(RATING.value)}</strong> على جوجل ({toArabicDigits(RATING.count)} تقييمات)</> : <><strong className="text-foreground">{RATING.value}</strong> on Google ({RATING.count} reviews)</>}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">{isAr ? <>أكثر من <strong className="text-foreground">{toArabicDigits(STUDENTS_TAUGHT.replace("+", ""))}</strong> طالب خلال {toArabicDigits(TEACHING_YEARS_COUNT)} عامًا</> : <><strong className="text-foreground">{STUDENTS_TAUGHT}</strong> students taught over {TEACHING_YEARS_COUNT} years</>}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">{isAr ? "من الهانغول حتى المستوى السادس" : "From Hangul to Level 6"}</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? "bg-klovers-green text-charcoal" :
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
              className="absolute inset-y-0 start-0 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(step - 1, 2) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">{t("enrollNow.chooseYourPlan")}</h1>
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
                    <KloverIcon name="student-girl-heart" className="h-6 w-6" />
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
                    <KloverIcon name="student-boy-thumbsup" className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.privateClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.oneOnOne")}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("enrollNow.yourCountry")}</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger aria-label={t("enrollNow.yourCountry")}>
                    <div className="flex items-center gap-2">
                      <KloverIcon name="globe-plane" className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t("enrollNow.selectCountry")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map(({ country }) => (
                      <SelectItem key={country} value={country}>{countryLabel(country, isAr)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tier && (
                <>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t("enrollNow.pricingTier")}</p>
                    <Badge>{isAr ? `الفئة ${({ local: "المحلية", regional: "الإقليمية", global: "العالمية" } as Record<string, string>)[tier] ?? tier}` : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`}</Badge>
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
                          <p className="font-bold text-foreground">{monthsLabel(d)}</p>
                          <p className="text-xs text-muted-foreground">{classesLabel(durationClasses[d])}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{priceLabelFor(d)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isFirstTime && !isEgypt && (
                <div className="bg-accent rounded-lg p-3 flex items-center gap-2 text-sm">
                  <KloverIcon name="badge-blossom" className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-accent-foreground font-medium">{t("enrollNow.welcomeDiscount")}</span>
                </div>
              )}

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                {t("enrollNow.next")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
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
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} aria-label={isAr ? "العودة إلى الخطوة السابقة" : "Back to previous step"}>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                    <KloverIcon name="calendar-blossom" className="h-6 w-6" /> {t("enrollNow.schedulePreferences")}
                  </h1>
                  <p className="text-muted-foreground text-sm">{t("enrollNow.schedulePreferencesDesc")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Korean Level */}
              <div className="space-y-2">
                <Label>{t("enrollNow.koreanLevel")}</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger aria-label={t("enrollNow.koreanLevel")}><SelectValue placeholder={t("enrollNow.selectLevel")} /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><KloverIcon name="calendar-check" className="h-4 w-4" /> {t("enrollNow.timezone")}</Label>
                <Select value={timezone} onValueChange={(tz) => { setTimezone(tz); setUserTimezone(tz); }}>
                  <SelectTrigger aria-label={t("enrollNow.timezone")}><SelectValue /></SelectTrigger>
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
                ) : levelSlots.length === 0 && classType === "private" ? (
                  <div className="space-y-3">
                    <div className="bg-accent dark:bg-muted border border-charcoal/20 dark:border-border rounded-lg p-3 text-sm text-charcoal dark:text-foreground">
                      {t("enrollNow.noPrivateDays")}
                    </div>
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                        isAr
                          ? `مرحبًا كلوفرز، أرغب في حصة خاصة${levelLabelAr ? ` في ${levelLabelAr}` : " في الكورية"}. لا تتوفر أيام للحصص الخاصة في الجدول الحالي، فهل يمكن ترتيب موعد مناسب؟`
                          : `Hi Klovers — I'd like a private ${selectedLevel || "Korean"} class. The current schedule has no private days available yet — can we arrange a time?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-klovers-green hover:bg-klovers-green/90 text-charcoal px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {isAr ? "التواصل عبر واتساب لترتيب موعد خاص" : "Contact us on WhatsApp to arrange a private time"}
                    </a>
                  </div>
                ) : levelSlots.length === 0 ? (
                  <div className="space-y-3">
                    <div className="bg-accent dark:bg-muted border border-charcoal/20 dark:border-border rounded-lg p-3 text-sm text-charcoal dark:text-foreground">
                      {t("enrollNow.noLiveSchedule")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAY_NAMES.map((day, idx) => (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            preferredDays.includes(day)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {localDayNames[idx] ?? day}
                        </button>
                      ))}
                    </div>
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                        isAr
                          ? `مرحبًا كلوفرز، أرغب في طلب حصة${levelLabelAr ? ` في ${levelLabelAr}` : " في الكورية"}${preferredDays.length ? ` في أيام: ${preferredDays.map((d) => localDayNames[DAY_NAMES.indexOf(d)] ?? d).join("، ")}` : ""}. هذا الموعد غير متوفر في الجدول الحالي.`
                          : `Hi Klovers — I'd like to request a ${selectedLevel || "Korean"} class${preferredDays.length ? ` on ${preferredDays.join(", ")}` : ""}. The current schedule doesn't have this yet.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-klovers-green hover:bg-klovers-green/90 text-charcoal px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {isAr ? "أو التواصل عبر واتساب لإيجاد موعد مناسب" : "Or contact us on WhatsApp to find a suitable time"}
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {levelSlots.map(({ day, time, seatsLeft }) => {
                      const isFull = classType !== "private" && seatsLeft <= 0;
                      const dayIdx = DAY_NAMES.indexOf(day);
                      const translatedDay = dayIdx >= 0 ? (localDayNames[dayIdx] ?? day) : day;
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
                          <span className="font-semibold">{translatedDay}</span>
                          <span className={`text-xs ${isFull ? "text-destructive font-semibold" : preferredDays.includes(day) ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {isFull ? t("enrollNow.full") : time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {t("enrollNow.scheduleConfirmNote")}
              </p>

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep2} onClick={handleGoToStep3}>
                {t("enrollNow.next")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
              {!canProceedStep2 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedLevel
                    ? t("enrollNow.selectLevelError")
                    : preferredDays.length === 0
                    ? t("enrollNow.selectDayError")
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Pay & Enroll (Step 3 removed — redundant with Step 2) */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)} aria-label={isAr ? "العودة إلى الخطوة السابقة" : "Back to previous step"}>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold leading-none tracking-tight">{t("enrollNow.reviewPay")}</h1>
                  <p className="text-muted-foreground text-sm">
                    {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {countryLabel(selectedCountry, isAr)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auth Gate: if not logged in, show sign-in CTA */}
              {!userId ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary border border-charcoal/25 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-primary-foreground" />
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
                      const returnUrl = buildReturnUrl(4);
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
                    <div className="w-10 h-10 rounded-full bg-primary border border-charcoal/25 flex items-center justify-center">
                      <KloverIcon name="student-boy-thumbsup" className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name || email}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </div>

              {/* Teacher card */}
              <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-4 py-3">
                <div className="relative flex-shrink-0">
                  <img src={rehamPhoto} alt={isAr ? "المعلّمة ريهام" : "Teacher Reham"} className="w-11 h-11 rounded-full object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{isAr ? "المعلّمة ريهام" : "Teacher Reham"} <span lang="ko">선생님</span> <span className="text-xs font-semibold text-charcoal bg-klovers-yellow border border-charcoal px-1.5 py-0.5 rounded-full ms-1">{isAr ? "خريجة الألسن" : "Al-Alsun graduate"}</span></p>
                  <p className="text-xs text-muted-foreground">{isAr ? `${toArabicDigits(TEACHING_YEARS_COUNT)} عامًا من التدريس · أكثر من ${toArabicDigits(STUDENTS_TAUGHT.replace("+", ""))} طالب · من الهانغول حتى المستوى السادس` : `${TEACHING_YEARS_COUNT}+ years · ${STUDENTS_TAUGHT} students taught · Hangul to Level 6`}</p>
                </div>
              </div>

              {/* Price Summary */}
              {duration && originalPrice !== null && finalPrice !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {monthsLabel(duration)} ({classesLabel(durationClasses[duration])})
                    </span>
                    <span className={`font-bold text-foreground ${isFirstTime && !isEgypt ? "line-through text-muted-foreground" : ""}`}>
                      {money(originalPrice, currency)}
                    </span>
                  </div>

                  {isFirstTime && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>{t("enrollNow.firstTimeDiscount")}</span>
                      <span className="font-bold">-{money(discountAmount, currency)}</span>
                    </div>
                  )}

                  {promoApplied && promoDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-1"><KloverIcon name="badge-blossom" className="h-3.5 w-3.5" /> {promoApplied.code}</span>
                      <span className="font-bold">-{money(promoDiscountAmount, currency)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">{t("enrollNow.total")}</span>
                    <span className="font-bold text-lg text-foreground">{money(finalPrice, currency)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isAr ? `${classesAr(durationClasses[duration])} مشمولة` : `${durationClasses[duration]} ${t("enrollNow.classesIncluded")}`}</span>
                    <span>{isAr ? `${formatMoneyAr(finalPrice / durationClasses[duration], currency)} للحصة` : `${formatMoney(finalPrice / durationClasses[duration], currency)}${t("enrollNow.perClass")}`}</span>
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="space-y-1.5">
                {!promoApplied ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KloverIcon name="badge-blossom" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={isAr ? "كود الخصم" : "Promo code"}
                        aria-label={isAr ? "رمز الخصم" : "Promo code"}
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={e => e.key === "Enter" && applyPromo()}
                        className="pl-9 uppercase placeholder:normal-case text-sm h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 shrink-0"
                      onClick={applyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                    >
                      {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "تطبيق" : "Apply")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-klovers-green border border-charcoal rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-charcoal" />
                      <span className="text-sm font-medium text-charcoal">
                        {isAr
                          ? `طُبّق الكود${promoApplied.discount_pct ? `: خصم ${toArabicDigits(promoApplied.discount_pct)}٪` : promoApplied.discount_flat ? `: خصم ${formatMoneyAr(promoApplied.discount_flat, currency)}` : ""}`
                          : <>{promoApplied.code} applied!{promoApplied.discount_pct ? ` (${promoApplied.discount_pct}% off)` : promoApplied.discount_flat ? ` (${formatMoney(promoApplied.discount_flat, currency)} off)` : ""}</>}
                      </span>
                    </div>
                    <button
                      onClick={() => { setPromoApplied(null); setPromoInput(""); setPromoError(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      {isAr ? "إزالة" : "Remove"}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-destructive">{promoError}</p>}
              </div>

              {/* Schedule Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">{t("enrollNow.schedulePreferencesSummary")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.level")}: {selectedLevel}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.days")}: {preferredDays.join(", ")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.timezone")}: {timezone}</p>
              </div>

              {/* Egypt payment method selector */}
              {isEgypt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{isAr ? "طريقة الدفع" : "Payment method"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "vodafone_cash", label: isAr ? "فودافون كاش" : "Vodafone Cash" },
                      { value: "instapay",      label: isAr ? "إنستا باي" : "InstaPay" },
                      { value: "bank_transfer", label: isAr ? "تحويل بنكي" : "Bank Transfer" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setEgyptPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                          egyptPaymentMethod === m.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {!egyptPaymentMethod && (
                    <p className="text-xs font-medium text-foreground">{isAr ? "اختيار طريقة الدفع للمتابعة" : "Please select a payment method to continue"}</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!duration || loading || (isEgypt && !egyptPaymentMethod)}
                onClick={handlePay}
              >
                {loading ? (isEgypt ? t("enrollNow.creatingOrder") : t("enrollNow.redirectingPayment")) : isEgypt ? (
                  <>
                    <KloverIcon name="badge-blossom" className="mr-2 h-4 w-4" />
                    {t("enrollNow.confirmOrder")} ({finalPrice !== null ? money(finalPrice, currency) : "—"})
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("enrollNow.payNow")} {finalPrice !== null ? money(finalPrice, currency) : "—"} {t("enrollNow.now")}
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
                {(isAr
                  ? [{ label: "دفع آمن" }, { label: "دفع لمرة واحدة" }, { label: "دعم عبر واتساب" }]
                  : [{ label: "Secure" }, { label: "One-time payment" }, { label: "WhatsApp support" }]
                ).map(({ label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2">
                    <span className="text-[10px] text-muted-foreground font-medium text-center">{label}</span>
                  </div>
                ))}
              </div>

              {/* What happens next */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">{isAr ? "ماذا بعد الدفع؟" : "What happens next?"}</p>
                {[
                  { step: "1", icon: "game-checklist-pencil" as const, title: isAr ? "تأكيد الدفع" : "Payment confirmed", desc: isAr ? "يصل إيصال الدفع بالبريد الإلكتروني." : "You get an email receipt." },
                  { step: "2", icon: "calendar-check" as const, title: isAr ? "تحديد الموعد" : "Schedule matched", desc: isAr ? "نؤكد موعد الحصة المناسب." : "We confirm your class slot." },
                  { step: "3", icon: "chat-annyeonghaseyo" as const, title: isAr ? "الحصة الأولى!" : "First class!", desc: isAr ? "يصل رابط الحصة، والتعلّم يبدأ." : "We send your meeting link — ready to learn!" },
                ].map(({ step: s, icon, title, desc }) => (
                  <div key={s} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary border border-charcoal/25 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-foreground">{s}</div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><KloverIcon name={icon} className="h-7 w-7" />{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp fallback */}
              <p className="text-xs text-center text-muted-foreground pt-1">
                {isAr ? "مساعدة في التسجيل؟" : "Need help enrolling?"}{" "}
                <a
                  href={WHATSAPP_BASE}
                  onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "enroll_help" }); }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-semibold underline underline-offset-2 hover:no-underline"
                >
                  {isAr ? "التواصل عبر واتساب" : "WhatsApp us"}
                </a>
              </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />

      {/* Sticky WhatsApp help pill — shown during checkout */}
      <a
        href={`${WHATSAPP_BASE}?text=${encodeURIComponent(pillMessage)}`}
        onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`${WHATSAPP_BASE}?text=${encodeURIComponent(pillMessage)}`, { cta_label: "enroll_questions_pill" }); }}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-klovers-green text-charcoal text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-klovers-green/90 transition-colors"
        aria-label={isAr ? "المحادثة عبر واتساب" : "Chat on WhatsApp"}
      >
        {isAr ? "أسئلة؟" : "Questions?"}
      </a>
    </div>
  );
};

export default EnrollNowPage;
