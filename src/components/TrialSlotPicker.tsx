import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon from "@/components/KloverIcon";

/**
 * Fallback: next UTC occurrence of dayOfWeek — mirrors the edge function
 * logic exactly so client and server always agree on the date.
 */
function nextDateForDayUTC(dayOfWeek: number): string {
  const today = new Date();
  const todayDay = today.getUTCDay();
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7; // always at least 1 day ahead
  const next = new Date(today);
  next.setUTCDate(today.getUTCDate() + diff);
  return next.toISOString().split("T")[0];
}

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  booked_count: number;
  capacity: number | null;
  duration_min: number | null;
  timezone: string | null;
  /** Actual upcoming session date returned by the RPC (anchored to existing bookings). */
  next_trial_date: string | null;
}

interface TrialSlotPickerProps {
  onSelect: (dayOfWeek: number, startTime: string, trialDate: string) => void;
  onBack: () => void;
  classLanguage?: "arabic" | "english";
}

// Only used when the backend row somehow omits capacity (shouldn't happen in prod).
const DEFAULT_CAPACITY = 6;

/**
 * 27 Sep 2026 (brand guard): this step of the booking flow was English only,
 * on a site whose main script is Arabic. Every string now follows the page
 * language: Arabic in Modern Standard Arabic, neutral in gender (verbal nouns
 * on buttons). Generic icons are gone (text arrows, KloverIcon), and the
 * waitlist confirmation uses palette colours instead of Tailwind green.
 */
const TrialSlotPicker = ({ onSelect, onBack, classLanguage }: TrialSlotPickerProps) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const backLabel = isAr ? "→ رجوع" : "← Back";
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  useEffect(() => {
    setSelectedKey(""); // reset selection when language changes
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc("get_trial_availability" as any, {
          p_language: classLanguage ?? null,
        });
        if (rpcError) throw rpcError;
        const rows = (data || []) as any[];
        const normalised: TrialSlot[] = rows.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          booked_count: Number(s.booked_count ?? 0),
          capacity: s.capacity ?? null,
          duration_min: s.duration_min ?? null,
          timezone: s.timezone ?? null,
          // RPC now returns the actual session date anchored to existing bookings.
          next_trial_date: s.next_trial_date ?? null,
        }));
        setSlots(normalised);
      } catch (err: any) {
        console.error("Failed to fetch trial slots:", err);
        setError("load");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [classLanguage]);

  // RPC already filters full slots server-side; keep defensive client filter too.
  const availableSlots = slots.filter((s) => {
    const cap = s.capacity ?? DEFAULT_CAPACITY;
    return s.booked_count < cap;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-destructive">
          {tr("Could not load the available times. Please try again.", "تعذّر تحميل المواعيد المتاحة. المحاولة مرة أخرى بعد قليل.")}
        </p>
        <Button variant="outline" size="sm" onClick={onBack}>
          {tr("Go back", "الرجوع")}
        </Button>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    const handleWaitlist = async () => {
      const trimmed = waitlistEmail.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
      setWaitlistSubmitting(true);
      // Best effort: a failed waitlist write is logged, and the visitor can
      // still message on WhatsApp from the booking page.
      const { error: waitlistError } = await supabase.from("leads").upsert(
        {
          email: trimmed,
          name: trimmed.split("@")[0],
          source: "trial_waitlist",
          status: "waitlist",
          goal: "Trial - notify when slot opens",
        },
        { onConflict: "email" }
      );
      if (waitlistError) console.error("trial waitlist:", waitlistError.message);
      setWaitlistSubmitting(false);
      setWaitlistDone(true);
    };

    return (
      <div className="text-center py-8 space-y-4">
        <KloverIcon name="calendar-blossom" className="h-14 w-14 mx-auto" />
        <p className="text-sm font-semibold text-foreground">
          {tr("All sessions are currently full", "جميع الحصص مكتملة حاليًا")}
        </p>
        {waitlistDone ? (
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-charcoal bg-klovers-green border-2 border-charcoal rounded-xl px-4 py-3">
            {tr("You're on the list. An email will arrive when a seat opens.", "تم التسجيل في قائمة الانتظار، وستصل رسالة عند فتح مقعد.")}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {tr("Leave an email and a message will arrive when a seat opens.", "يكفي البريد الإلكتروني، وستصل رسالة عند فتح مقعد.")}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="name@email.com"
                dir="ltr"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="sm"
                className="h-9"
                disabled={waitlistSubmitting || !waitlistEmail.trim()}
                onClick={handleWaitlist}
              >
                {tr("Notify me", "إشعار عند فتح مقعد")}
              </Button>
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onBack}>
          {tr("Go back", "الرجوع")}
        </Button>
      </div>
    );
  }

  // Always read from browser — bypasses stale localStorage values.
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuala_Lumpur";

  const sessionDateFor = (s: TrialSlot): string =>
    s.next_trial_date ?? nextDateForDayUTC(s.day_of_week);

  const labelFor = (s: TrialSlot) => {
    const srcTz = s.timezone || "Asia/Kuala_Lumpur";
    const sessionDate = sessionDateFor(s);
    // Use convertDateTimeToTimezone for specific-dated slots (accurate DST handling)
    const { dateStr: localDateStr, timeFormatted, weekday } = convertDateTimeToTimezone(sessionDate, s.start_time, srcTz, userTz);
    const [ly, lm, ld] = localDateStr.split("-").map(Number);
    const localDate = new Date(ly, lm - 1, ld);
    const cap = s.capacity ?? DEFAULT_CAPACITY;
    const spotsLeft = cap - s.booked_count;
    if (isAr) {
      const dayAr = localDate.toLocaleDateString("ar-EG", { weekday: "long" });
      const dateAr = localDate.toLocaleDateString("ar-EG", { month: "long", day: "numeric" });
      // timeFormatted may be "8:00 PM" or "20:00"; read both.
      const tm = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(timeFormatted);
      let hour = tm ? Number(tm[1]) : 0;
      const isPm = tm?.[3] ? /PM/i.test(tm[3]) : hour >= 12;
      if (!tm?.[3]) hour = hour % 12 || 12;
      const timeAr = tm
        ? `${hour}:${tm[2]} ${isPm ? "م" : "ص"}`.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])
        : timeFormatted;
      const spotsAr = String(spotsLeft).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
      return `${dayAr}، ${dateAr}، الساعة ${timeAr} · الأماكن المتبقية: ${spotsAr}`;
    }
    const dateLabel = localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${weekday}, ${dateLabel} at ${timeFormatted} — ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`;
  };

  /**
   * The date is part of the identity of a session.
   *
   * This used to be `day_of_week|start_time`, but get_trial_availability
   * returns one row per dated trial_slots row - so two upcoming occurrences
   * of the same weekday and time collapsed into one key. React saw duplicate
   * keys, the Select saw duplicate option values, and `find` always matched
   * the first. A student who chose the later of two identical-looking
   * sessions was booked into the earlier one, and only found out from the
   * date in her confirmation email.
   */
  const keyFor = (s: TrialSlot) => `${sessionDateFor(s)}|${s.day_of_week}|${s.start_time}`;

  const selectedSlot = availableSlots.find((s) => keyFor(s) === selectedKey);

  const commit = () => {
    if (!selectedKey || !selectedSlot) return;
    // Read the day and time off the slot itself rather than re-parsing them
    // out of the key - one source, so they cannot drift from the date.
    onSelect(selectedSlot.day_of_week, selectedSlot.start_time, sessionDateFor(selectedSlot));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
        <p className="text-sm text-muted-foreground">{tr("Pick your trial day", "اختيار يوم الحصة التجريبية")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trial-day">{tr("Trial day", "يوم الحصة")}</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger id="trial-day" className="w-full">
            <SelectValue placeholder={tr("Choose a trial session", "اختيار موعد الحصة")} />
          </SelectTrigger>
          <SelectContent>
            {availableSlots.map((s) => (
              <SelectItem key={keyFor(s)} value={keyFor(s)}>
                {labelFor(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {tr("All times shown in your local time zone", "جميع الأوقات معروضة بالتوقيت المحلي")} (<span dir="ltr">{userTz.replace(/_/g, " ")}</span>)
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full text-base font-bold h-13 mt-2"
        disabled={!selectedKey}
        onClick={commit}
      >
        {selectedKey ? tr("Book this trial", "حجز هذه الحصة") : tr("Select a trial day", "اختيار يوم الحصة أولًا")}
      </Button>
    </div>
  );
};

export default TrialSlotPicker;
