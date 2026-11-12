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
import { ArrowLeft, ArrowRight, CreditCard, LogIn, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import SchedulePicker from "@/components/SchedulePicker";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrivateAvailability, formatTime12 } from "@/lib/privateAvailability";
import { LEVEL_SELECT_OPTIONS, normalizeLevel, getLevelByKey } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { getAttribution } from "@/lib/leadSession";
import { type TierKey, type ClassType, type Duration, tierCountries, DURATION_CLASSES, normalizeCountry, resolveCurrency, getPriceFor, formatMoney, tierPrices } from "@/lib/stripePrices";
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

// Private and dynamically-suggested group times are preferences, not rows in
// schedule_packages, so their ids must never be sent as package_id.
const isPreferenceSlot = (id: string | null) => !!id && (id.startsWith("private-") || id.startsWith("dynamic-"));

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
      "name": "Korean Language Classes by Klovers",
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
    title: isAr ? "التسجيل في حصص الكورية" : "Enroll in Korean Classes | Klovers",
    description: isAr
      ? "التسجيل في كلوفرز: اختيار نوع الحصة والجدول، ثم بدء التحدث بالكورية بثقة في حصص مباشرة عبر الإنترنت مع معلمة حقيقية."
      : "Join Klovers: choose your class type and schedule, then start speaking Korean with confidence in live online classes with a real teacher.",
    canonical: isAr ? "https://kloversegy.com/ar/enroll-now" : "https://kloversegy.com/enroll-now",
    alternates: { en: "https://kloversegy.com/enroll-now", ar: "https://kloversegy.com/ar/enroll-now" },
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
  // WhatsApp number — always asked, always required. Without it, a seat
  // booking has no way to be followed up if the student never returns
  // (see "no phone anywhere in the enroll flow" — Nov 2026).
  const [phone, setPhone] = useState("");
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
  // True from the moment a level is picked until its times arrive, so the
  // "no live schedule" note never flashes before the real slots load.
  const [slotsLoading, setSlotsLoading] = useState(false);
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
    const ph = searchParams.get("phone") || getDraft().phone;
    if (ph && !phone) {
      setPhone(ph);
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
    setSlotsLoading(Boolean(selectedLevel));
    if (!selectedLevel) return;

    // Private classes: real teacher availability, ranked group-demand-free
    // first (29 Sep 2026 Phase 2 — spec "PRIVATE LESSON EXPERIENCE": private
    // students should see ALL genuinely open teacher slots, locked ones
    // excluded, slots with no group demand ranked first). Backed by
    // fn_private_slot_options(), Phase 1's scoring function, which already
    // excludes LOCKED conflicts (blocked windows, running private classes,
    // running/full groups) — replaces the old static app_settings-only
    // fetchPrivateAvailability(), kept below only as a fallback if the RPC
    // is unreachable. Two spread times per day (earliest + latest open),
    // same button count/shape as before ("times must be different in the
    // days" fix stays intact).
    if (classType === "private") {
      const loadPrivate = async () => {
        let slots: { day: string; time: string; packageId: string; seatsLeft: number }[] = [];
        try {
          const { data, error } = await supabase.rpc("fn_private_slot_options" as any, { p_limit: 300 });
          if (error) throw error;
          const rows = (data as any[]) || [];
          if (rows.length > 0) {
            const byDay: Record<string, any[]> = {};
            for (const r of rows) (byDay[r.day_name] ||= []).push(r);
            for (const day of DAY_NAMES) {
              const dayRows = (byDay[day] || []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (dayRows.length === 0) continue;
              const picks = dayRows.length > 1 && dayRows[0].start_time !== dayRows[dayRows.length - 1].start_time
                ? [dayRows[0], dayRows[dayRows.length - 1]]
                : [dayRows[0]];
              for (const r of picks) {
                slots.push({
                  day: r.day_name,
                  time: formatTime12(r.start_time),
                  packageId: `private-${r.day_of_week}-${r.start_time}`,
                  seatsLeft: 99,
                });
              }
            }
          }
        } catch (e) {
          console.error("fn_private_slot_options failed, falling back to static config:", e);
        }
        if (slots.length === 0) {
          const { options } = await fetchPrivateAvailability();
          slots = options.map((opt) => ({
            day: opt.weekday,
            time: opt.timeFormatted,
            packageId: `private-${opt.dayIndex}-${opt.time}`,
            seatsLeft: 99,
          }));
        }
        setLevelSlots(slots);
        if (initialLevelLoad && preferredDays.length > 0) {
          const matchSlot = slots.find(s => s.day === preferredDays[0]);
          if (matchSlot) setSelectedPackageId(matchSlot.packageId);
          setInitialLevelLoad(false);
        } else {
          setInitialLevelLoad(false);
        }
      };
      loadPrivate().finally(() => setSlotsLoading(false));
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

      // Compute seats_left per package (same pattern as SchedulePicker).
      // A level with no configured package (Level 2/3 today) skips the queries
      // and goes straight to the engine-suggested options below.
      const pkgIds = rows.map((r: any) => r.id);
      const { data: groups } = pkgIds.length === 0 ? { data: [] as any[] } : await supabase
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

      // 29 Sep 2026: an EMPTY group slot is not a hard reservation. If a private
      // lesson / blocked window / running group has taken its time, drop it —
      // fn_locked_group_packages() says which (function may not exist yet or may
      // fail: then nothing is dropped, i.e. the previous behaviour).
      let lockedIds = new Set<string>();
      if (rows.length > 0) try {
        const { data: lockedRows, error: lockedErr } = await supabase.rpc("fn_locked_group_packages" as any, { p_level: normalizedLevel });
        if (!lockedErr) lockedIds = new Set(((lockedRows as any[]) || []).map((x: any) => x.package_id));
      } catch { /* keep previous behaviour */ }
      const usableRows = rows.filter((r: any) => !lockedIds.has(r.id));

      // Deduplicate by admin-side day_of_week; convert each slot to the learner's timezone for display
      const seen = new Set<number>();
      const slots: { day: string; time: string; packageId: string; seatsLeft: number; demand: number }[] = [];
      for (const r of usableRows) {
        if (!seen.has(r.day_of_week)) {
          seen.add(r.day_of_week);
          const srcTz = r.timezone || "Africa/Cairo";
          const local = convertSlotToTimezone(r.day_of_week, r.start_time, srcTz, timezone);
          const demand = pkgMemberCount[r.id] || 0;
          const seatsLeft = Math.max(0, (r.capacity || 5) - demand);
          // A full group is not an option: leave it out so the student still
          // gets two usable days (the engine backfills below).
          if (seatsLeft <= 0) continue;
          slots.push({ day: local.weekday, time: local.timeFormatted, packageId: r.id, seatsLeft, demand });
        }
      }
      // 29 Sep 2026 Phase 2 (spec "GROUP COURSE BOOKING EXPERIENCE" +
      // "GROUP CONCENTRATION"): show only the top two recommended times
      // instead of every configured day, so new students concentrate into
      // groups that are already forming rather than fragmenting further.
      // Ranked by real existing demand (pkg_group_members count) first, then
      // by remaining seats, then day order — all real, bookable
      // schedule_packages rows; nothing here touches any existing enrollment.
      const ranked = slots
        .slice()
        .sort((a, b) => b.demand - a.demand || b.seatsLeft - a.seatsLeft || rows.findIndex(r => r.id === a.packageId) - rows.findIndex(r => r.id === b.packageId));
      const topSlots: { day: string; time: string; packageId: string; seatsLeft: number }[] =
        (ranked.length > 2 ? ranked.slice(0, 2) : ranked).map(({ demand, ...s }) => s);

      // A student must always get TWO days to choose from. If fewer than two
      // bookable groups are left (a slot was taken by a private lesson, or the
      // level has no group configured yet), fill from the scoring engine: same
      // Cairo hour as the class still offered where possible (15:00 otherwise),
      // on days not already shown. Preference only (no package yet), same as
      // private times.
      if (topSlots.length < 2) {
        try {
          const { data: sug } = await supabase.rpc("fn_suggest_group_slots" as any, { p_level: normalizedLevel, p_count: 400 });
          const cands = ((sug as any[]) || []);
          const usedDow = new Set<number>(rows.map((r: any) => r.day_of_week as number));
          const wantTime = rows.length > 0 ? String((usableRows[0] ?? rows[0]).start_time).slice(0, 5) : "15:00";
          while (topSlots.length < 2) {
            const pick = cands.find((c: any) => !usedDow.has(c.day_of_week) && c.start_time === wantTime)
              ?? cands.find((c: any) => !usedDow.has(c.day_of_week));
            if (!pick) break;
            usedDow.add(pick.day_of_week);
            const local = convertSlotToTimezone(pick.day_of_week, pick.start_time, pick.timezone || "Africa/Cairo", timezone);
            topSlots.push({ day: local.weekday, time: local.timeFormatted, packageId: `dynamic-${pick.day_of_week}-${pick.start_time}`, seatsLeft: 99 });
          }
        } catch (e) {
          console.error("fn_suggest_group_slots backfill failed:", e);
        }
      }
      setLevelSlots(topSlots);

      // On initial load, restore selectedPackageId from rehydrated preferredDays.
      // Check the shown top-2 first, then the full ranked list — a returning
      // user's earlier pick may have since dropped out of the top-2.
      if (initialLevelLoad && preferredDays.length > 0) {
        const matchSlot = topSlots.find(s => s.day === preferredDays[0]) || slots.find(s => s.day === preferredDays[0]);
        if (matchSlot) setSelectedPackageId(matchSlot.packageId);
        setInitialLevelLoad(false);
      } else {
        setInitialLevelLoad(false);
      }
    };
    fetchLevelSlots().finally(() => setSlotsLoading(false));
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
        .select("name, country, course_level_key, level, phone")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfileCountry((profile as any)?.country || "");
      const profilePhone = (profile as any)?.phone?.trim();
      if (profilePhone) setPhone((cur) => cur || profilePhone);
      // Prefill the level the placement test (or the student) already set,
      // unless one came in through the URL or was already picked.
      const knownLevel = normalizeLevel((profile as any)?.course_level_key || (profile as any)?.level || "");
      if (knownLevel && LEVEL_SELECT_OPTIONS.some((l) => l.value === knownLevel)) {
        setSelectedLevel((cur) => cur || knownLevel);
      }
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

  // Egyptian students may pay by card (Re, 6 Oct 2026). Stripe charges the
  // dollar tier price, so that path shows USD and the same first-time discount
  // create-checkout applies; Vodafone Cash / InstaPay stay in EGP.
  const egyptCard = isEgypt && egyptPaymentMethod === "card";
  const payByCard = !isEgypt || egyptCard;
  // A code is only valid in one currency: drop it when the method (EGP <-> USD) changes.
  useEffect(() => { setPromoApplied(null); }, [payByCard, selectedCountry]);
  const priced = useMemo(() => {
    if (!duration) return null;
    if (egyptCard) {
      const usd = tier ? tierPrices[tier]?.[classType]?.[duration] : undefined;
      return typeof usd === "number" ? { amount: usd, currency: "USD" } : null;
    }
    return getPriceFor(selectedCountry, timezone, classType, duration);
  }, [selectedCountry, timezone, classType, duration, egyptCard, tier]);
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

  const discountAmount = isFirstTime && originalPrice && payByCard ? Math.round(originalPrice * 0.1 * 100) / 100 : 0;
  const promoDiscountAmount = useMemo(() => {
    if (!promoApplied || !originalPrice) return 0;
    const base = originalPrice - discountAmount;
    if (promoApplied.discount_pct) return Math.round(base * promoApplied.discount_pct / 100 * 100) / 100;
    if (promoApplied.discount_flat) return Math.min(promoApplied.discount_flat, base);
    return 0;
  }, [promoApplied, originalPrice, discountAmount]);
  const finalPrice = originalPrice ? Math.max(0, originalPrice - discountAmount - promoDiscountAmount) : null;

  const phoneDigits = phone.replace(/[^0-9]/g, "");
  const phoneIsValid = phoneDigits.length >= 8 && phoneDigits.length <= 15;

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

  // Private classes offer several times per day (see levelSlots load above),
  // so selection has to be keyed by the exact slot (packageId), not just the
  // day — toggleDay's "first slot matching this day" would always land back
  // on the same time.
  const selectPrivateSlot = (slot: { day: string; packageId: string }) => {
    if (selectedPackageId === slot.packageId) {
      setPreferredDays([]);
      setSelectedPackageId(null);
      return;
    }
    setPreferredDays([slot.day]);
    setSelectedPackageId(slot.packageId);
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
    if (phone.trim()) params.set("phone", phone.trim());
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
    if (phone.trim()) draftData.phone = phone.trim();
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
    // Keep the student's WhatsApp number on her profile so it's there the
    // moment her enrollment lands in the admin dashboard (notify_new_enrollment
    // reads profiles.phone) — not just in the lead record.
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      supabase.from("profiles").update({ phone: trimmedPhone }).eq("user_id", session.user.id).then(() => {});
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

  const canProceedStep2 = !!selectedLevel && preferredDays.length > 0 && phoneIsValid;

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
      // Sync country + WhatsApp number to profile
      if (resolvedCountry && session.user.id) {
        supabase.from("profiles").update({ country: resolvedCountry }).eq("user_id", session.user.id).then(() => {});
      }
      if (phone.trim() && session.user.id) {
        supabase.from("profiles").update({ phone: phone.trim() }).eq("user_id", session.user.id).then(() => {});
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
        if (selectedPackageId && !isPreferenceSlot(selectedPackageId)) schedPrefs.package_id = selectedPackageId;
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
          phone: phone.trim(),
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
    if (data.currency && data.currency !== currency) {
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
    if (!selectedLevel || preferredDays.length === 0 || !phoneIsValid) {
      toast({ title: t("enrollToasts.missingSchedule"), description: t("enrollToasts.missingScheduleDesc"), variant: "destructive" });
      setStep(2);
      return;
    }
    if (!tier || !duration || !finalPrice || !userId) return;

    if (isEgypt && !egyptCard) {
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

      // Sync country + WhatsApp number to profile
      if (resolvedCountry && session.user.id) {
        supabase.from("profiles").update({ country: resolvedCountry }).eq("user_id", session.user.id).then(() => {});
      }
      if (phone.trim() && session.user.id) {
        supabase.from("profiles").update({ phone: phone.trim() }).eq("user_id", session.user.id).then(() => {});
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
      if (selectedPackageId && !isPreferenceSlot(selectedPackageId)) schedFields.package_id = selectedPackageId;
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
          package_id: (selectedPackageId && !isPreferenceSlot(selectedPackageId)) ? selectedPackageId : "",
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

  // Order summary in the page language: the level as its label (not the raw
  // key "l1"), the days as local day names with the time the student chose, and
  // the timezone without underscores.
  const summaryLevel = LEVEL_SELECT_OPTIONS.find((l) => l.value === selectedLevel)?.label ?? selectedLevel;
  // "7:00 PM" -> "7:00 م" on the Arabic page.
  const timeInPageLanguage = (tm: string) =>
    isAr ? tm.replace(/\s*PM/i, " م").replace(/\s*AM/i, " ص") : tm;
  const summaryDays = preferredDays
    .map((d) => {
      const idx = DAY_NAMES.indexOf(d);
      const name = idx >= 0 ? (localDayNames[idx] ?? d) : d;
      const slot = classType === "private"
        ? levelSlots.find((s) => s.packageId === selectedPackageId) ?? levelSlots.find((s) => s.day === d)
        : levelSlots.find((s) => s.day === d);
      const time = slot?.time ? timeInPageLanguage(slot.time) : "";
      return time ? `${name} ${time}` : name;
    })
    .join(isAr ? "، " : ", ");

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
                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "group" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <KloverIcon name="books-stack" className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.groupClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.learnWithOthers")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassType("private")}
                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "private" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <KloverIcon name="lightbulb-sprout" className="h-6 w-6" />
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
                          className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 rounded-lg border-2 transition-all text-center ${
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

              {isFirstTime && payByCard && (
                <div className="bg-accent rounded-lg p-3 flex items-center gap-2 text-sm">
                  <KloverIcon name="badge-blossom" className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-accent-foreground font-medium">{t("enrollNow.welcomeDiscount")}</span>
                </div>
              )}

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                {t("enrollNow.next")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
              {!canProceedStep1 && (
                <p className="text-xs text-muted-foreground text-center">
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

              {/* WhatsApp number — always asked, always required. The only way
                  the admin can follow up if a booking is missed or email
                  bounces (Nov 2026: enrollments had no phone field at all). */}
              <div className="space-y-1.5">
                <Label htmlFor="enroll-phone" className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  {isAr ? "رقم الواتساب" : "WhatsApp number"}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="enroll-phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10 0000 0000"
                  className="text-start"
                />
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "عشان نقدر نتواصل معاكِ لو احتجنا، حتى لو البريد الإلكتروني ما وصلش."
                    : "So we can reach you if needed, even if an email doesn't arrive."}
                </p>
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
                ) : slotsLoading ? (
                  <p className="text-sm text-muted-foreground italic" role="status">{t("enrollNow.loadingSlots")}</p>
                ) : levelSlots.length === 0 && classType === "private" ? (
                  <div className="space-y-3">
                    <div className="bg-accent dark:bg-muted border border-charcoal/20 dark:border-border rounded-lg p-3 text-sm text-charcoal dark:text-foreground">
                      {t("enrollNow.noPrivateDays")}
                    </div>
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                        isAr
                          ? `مرحبًا كلوفرز، أرغب في حصة خاصة${levelLabelAr ? ` في ${levelLabelAr}` : " في الكورية"}. لا تتوفر أيام للحصص الخاصة في الجدول الحالي، فهل يمكن ترتيب موعد مناسب؟`
                          : `Hi Klovers, I'd like a private ${selectedLevel || "Korean"} class. The current schedule has no private days available yet, can we arrange a time?`
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
                          className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
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
                          : `Hi Klovers, I'd like to request a ${selectedLevel || "Korean"} class${preferredDays.length ? ` on ${preferredDays.join(", ")}` : ""}. The current schedule doesn't have this yet.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-klovers-green hover:bg-klovers-green/90 text-charcoal px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {isAr ? "أو التواصل عبر واتساب لإيجاد موعد مناسب" : "Or contact us on WhatsApp to find a suitable time"}
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {levelSlots.map((slot) => {
                      const { day, time, seatsLeft, packageId } = slot;
                      const isFull = classType !== "private" && seatsLeft <= 0;
                      const dayIdx = DAY_NAMES.indexOf(day);
                      const translatedDay = dayIdx >= 0 ? (localDayNames[dayIdx] ?? day) : day;
                      // Private: several time buttons can share a day, so the
                      // exact slot (packageId) decides which one is selected.
                      // Group: still deduped to one button per day.
                      const isSelected = classType === "private" ? selectedPackageId === packageId : preferredDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={packageId}
                          disabled={isFull}
                          onClick={() => !isFull && (classType === "private" ? selectPrivateSlot(slot) : toggleDay(day))}
                          className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                            isFull
                              ? "border-border opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="font-semibold">{translatedDay}</span>
                          <span className={`text-xs ${isFull ? "text-destructive font-semibold" : isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {isFull ? t("enrollNow.full") : timeInPageLanguage(time)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* None of the offered days suits: don't dead-end, let her ask for another time. */}
                  <a
                    href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                      isAr
                        ? `مرحبًا كلوفرز، المواعيد المعروضة لا تناسبني${levelLabelAr ? ` في ${levelLabelAr}` : ""}${classType === "private" ? " (حصة خاصة)" : ""}. هل يمكن ترتيب موعد آخر؟ توقيتي: ${timezone}`
                        : `Hi Klovers, the times shown don't suit me${selectedLevel ? ` for ${selectedLevel}` : ""}${classType === "private" ? " (private)" : ""}. Can we arrange another time? My timezone: ${timezone}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                  >
                    {isAr ? "لا تناسبك هذه المواعيد؟ يمكنك طلب موعد آخر عبر واتساب" : "These times don't suit you? Ask for another time on WhatsApp"}
                  </a>
                  {classType === "group" && (
                    <div className="rounded-lg bg-muted p-3 text-sm flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {isAr
                          ? "تفضّل اختيار وقتك بنفسك؟ الحصص الخاصة تعرض كل الأوقات المتاحة."
                          : "Prefer to pick your own time? Private classes show every open time."}
                      </span>
                      <Button type="button" size="sm" variant="outline" onClick={() => setClassType("private")}>
                        {isAr ? "عرض الحصص الخاصة" : "See private classes"}
                      </Button>
                    </div>
                  )}
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
                <p className="text-xs text-muted-foreground text-center">
                  {!selectedLevel
                    ? t("enrollNow.selectLevelError")
                    : !phoneIsValid
                    ? (isAr ? "من فضلك أدخلي رقم واتساب صحيح." : "Please enter a valid WhatsApp number.")
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
                      {/* A member chip on a yellow disc: a photograph would lose its edge
                          here, and this renders at 20px whatever the source. */}
                      <KloverIcon name="badge-blossom" className="h-5 w-5" />
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
                    <span className={`font-bold text-foreground ${isFirstTime && payByCard ? "line-through text-muted-foreground" : ""}`}>
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
                      className="text-xs text-muted-foreground hover:text-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                <p className="text-xs text-muted-foreground">{t("enrollNow.level")}: {summaryLevel}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.days")}: {summaryDays}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.timezone")}: <span dir="ltr">{timezone.replace(/_/g, " ")}</span></p>
              </div>

              {/* Egypt payment method selector */}
              {isEgypt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{isAr ? "طريقة الدفع" : "Payment method"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "vodafone_cash", label: isAr ? "فودافون كاش" : "Vodafone Cash" },
                      { value: "instapay",      label: isAr ? "إنستا باي" : "InstaPay" },
                      { value: "card",          label: isAr ? "بطاقة (Visa / Mastercard)" : "Card (Visa / Mastercard)" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setEgyptPaymentMethod(m.value)}
                        className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
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
                {loading ? (!payByCard ? t("enrollNow.creatingOrder") : t("enrollNow.redirectingPayment")) : !payByCard ? (
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
                {!payByCard
                  ? t("enrollNow.redirectReceipt")
                  : userId
                    ? t("enrollNow.securePaymentSignedIn")
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
                  { step: "3", icon: "chat-annyeonghaseyo" as const, title: isAr ? "الحصة الأولى!" : "First class!", desc: isAr ? "يصل رابط الحصة، والتعلّم يبدأ." : "We send your meeting link. Time to learn!" },
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

              {/* WhatsApp help: the sticky pill below is the single entry point (audit, 6 Oct 2026) */}
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
