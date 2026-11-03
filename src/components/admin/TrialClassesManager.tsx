import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Mail, RefreshCw, Users, XCircle, Pencil, ChevronDown, ChevronUp, CalendarCog, Copy, AlertTriangle } from "lucide-react";
import { formatTime, convertDateTimeToTimezone, deriveSessionPeriod } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";
import { getLevelShortLabel } from "@/constants/levels";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";
import { useAllTrialSlots } from "@/hooks/useTrialAdmin";
import AddTrialClassDialog from "@/components/admin/trial/AddTrialClassDialog";
import TrialSlotProposals from "@/components/admin/trial/TrialSlotProposals";
import NewTraffic from "@/components/admin/trial/NewTraffic";
import TrialAttendanceRoster from "@/components/admin/trial/TrialAttendanceRoster";
import { pickRebookTargets } from "@/components/admin/trial/rebookTargets";
import { emailLanguageFor } from "@/components/admin/trial/emailLanguage";
import { TrialSlotRow } from "@/types/trial-admin";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  date_selected: "bg-blue-100 text-blue-700",
  awaiting_attendance: "bg-purple-100 text-purple-800",
  confirmed_attendance: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  date_selected: "Date Selected",
  awaiting_attendance: "Awaiting Confirmation",
  confirmed_attendance: "Attendance Confirmed",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
};

interface TrialBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  goal: string | null;
  day_of_week: number;
  start_time: string | null;
  trial_date: string | null;
  timezone: string;
  language?: string | null;
  class_language?: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  changed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  user_id?: string | null;
  rebook_email_sent_at?: string | null;
  is_tba?: boolean;
  attendance_confirmed_at?: string | null;
  confirmation_token?: string | null;
  /** "yes" or "no", written by respond_trial_attendance when the student clicks. */
  attendance_response?: string | null;
  /**
   * When the "are you coming?" letter was last sent. Distinct from
   * email_sent_at, which is the invitation telling them when and where.
   */
  attendance_email_sent_at?: string | null;
  student_timezone?: string | null;
}

/** The body send-attendance-confirmations returns, dry run or real. */
interface AttendanceSendResult {
  dry_run: boolean;
  candidates: number;
  sent: number;
  failed: number;
  failures: { booking_id: string; error: string }[];
  skipped: { booking_id: string; reason: string }[];
  preview?: {
    booking_id: string;
    email: string | null;
    trial_date: string | null;
    trial_time: string | null;
    already_answered?: string | null;
  }[];
  message?: string;
  error?: string;
}

// Source of truth for unscheduled placeholders. Post-migration, TBA rows
// have start_time/trial_date=NULL; the DB trigger keeps is_tba in sync.
// Legacy sentinel checks remain defensive.
const isTbaBooking = (b: Pick<TrialBooking, "is_tba" | "start_time" | "trial_date">) =>
  b.is_tba === true ||
  !b.start_time || !b.trial_date ||
  b.start_time === "TBA" || b.trial_date === "2099-12-31";

const isMissingAuditColumn = (error: any) =>
  error?.code === "42703" || /changed_at|cancelled_at|cancel_reason/i.test(error?.message || "");

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  is_active: boolean;
  trial_date?: string | null;
  meeting_url?: string | null;
  class_language?: string | null;
  timezone?: string | null;
  capacity?: number | null;
  /** When this slot's date/time last changed — the staleness clock for invitations. */
  updated_at?: string | null;
}

// "all" = ongoing only (upcoming sessions + unscheduled). "everything" also
// includes sessions whose date has already passed.
type TimeFilter = "all" | "upcoming" | "past" | "everything";
type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "awaiting_attendance"
  | "confirmed_attendance"
  | "no_show"
  | "cancelled";
type LanguageFilter = "all" | "arabic" | "english";
type BookedSort = "asc" | "desc";

interface UpcomingSlot {
  value: string; // "YYYY-MM-DD|dow|HH:mm"
  label: string;
  date: string;
  day_of_week: number;
  start_time: string;
  meeting_url?: string | null;
  class_language?: string | null;
}

function getActualUpcomingGroups(bookings: TrialBooking[]): UpcomingSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const seen = new Set<string>();
  const results: UpcomingSlot[] = [];
  for (const b of bookings) {
    if (!b.trial_date || !b.start_time || b.is_tba || b.start_time === "TBA") continue;
    if (b.trial_date < todayStr || b.status === "cancelled") continue;
    const key = `${b.trial_date}|${b.day_of_week}|${b.start_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const d = new Date(b.trial_date + "T00:00:00");
    const dow = b.day_of_week ?? d.getDay();
    const [h, m] = b.start_time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const label = `${DAY_NAMES[dow]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    results.push({ value: key, label, date: b.trial_date, day_of_week: dow, start_time: b.start_time });
  }
  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}

const TrialClassesManager = () => {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  // Which order the "Booked" column sorts each session's rows in. Defaults
  // to oldest-first: the pilot list is defined by signup date, and nothing
  // else in this view sorted by it before this.
  const [bookedSort, setBookedSort] = useState<BookedSort>("asc");
  const [trialSlotMap, setTrialSlotMap] = useState<Record<string, string>>({});
  // The "Ask them to confirm" dialog: a dry run the admin reads, then the
  // outcome of the real send in the same place. Null means closed.
  const [askDialog, setAskDialog] = useState<{
    trialDate: string;
    preview: AttendanceSendResult;
    outcome: AttendanceSendResult | null;
  } | null>(null);
  const [askBusy, setAskBusy] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TrialSlotRow | null>(null);
  const allSlotsQ = useAllTrialSlots();

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<TrialBooking[]>({
    queryKey: ["admin", "trial-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_bookings")
        .select("*")
        .order("trial_date", { ascending: false })
        .order("start_time", { ascending: true });
      if (error) {
        toast({ title: "Error loading bookings", description: error.message, variant: "destructive" });
        throw error;
      }
      return (data as TrialBooking[] | null) ?? [];
    },
    staleTime: 60 * 1000,
  });

  const { data: activeSlots = [], isLoading: loadingSlots } = useQuery<TrialSlot[]>({
    queryKey: ["admin", "trial-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_slots")
        .select("day_of_week, start_time, is_active, trial_date, meeting_url, class_language, timezone, capacity, updated_at")
        .eq("is_active", true);
      if (error) throw error;
      return (data as TrialSlot[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingBookings || loadingSlots;
  const upcomingSlots = useMemo(() => {
    // Admin timezone, like futureSlots below: a UTC slice of local midnight is
    // a day off for part of every evening and morning.
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: getAdminTimezone(),
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    return activeSlots
      .filter((s) => s.trial_date && s.trial_date >= todayStr)
      .sort((a, b) => (a.trial_date ?? "").localeCompare(b.trial_date ?? ""))
      .map((s) => {
        const d = new Date(s.trial_date + "T00:00:00");
        const dow = s.day_of_week;
        const [h, m] = s.start_time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const label = `${DAY_NAMES[dow]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
        return {
          value: `${s.trial_date}|${dow}|${s.start_time}`,
          label,
          date: s.trial_date!,
          day_of_week: dow,
          start_time: s.start_time,
          meeting_url: s.meeting_url ?? null,
          class_language: s.class_language ?? null,
        };
      });
  }, [activeSlots]);

  /**
   * The slots it is honest to offer a student.
   *
   * `activeSlots` is every row with is_active = true, which still includes
   * last week's - so a rebook email could offer a date that had already
   * passed, and the meeting link could come from a class that was over. Today
   * is read in the admin's own timezone, not UTC, so a slot does not vanish
   * an evening early.
   */
  const futureSlots = useMemo(() => {
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: getAdminTimezone(),
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    return activeSlots.filter((s) => s.trial_date && s.trial_date >= todayStr);
  }, [activeSlots]);

  /**
   * The moment the offered dates last changed.
   *
   * An invitation is only "already sent" if it was sent for THESE dates. Every
   * rebook email in the database went out on 2 July 2026, for a July block that
   * no longer exists; the current slots were last written on 1 September. A
   * plain "has rebook_email_sent_at" check calls those students done and never
   * writes to them again, which is how 41 people came to be sitting on an
   * invitation to dates that have passed.
   */
  const slotsUpdatedAt = useMemo(() => {
    const stamps = futureSlots
      .map((s) => (s.updated_at ? Date.parse(s.updated_at) : NaN))
      .filter((n) => !Number.isNaN(n));
    return stamps.length ? new Date(Math.max(...stamps)) : null;
  }, [futureSlots]);

  /**
   * Seats actually left, per class language.
   *
   * Emailing more students than there are seats is not a neutral act: the ones
   * who arrive late open the invitation, find nothing bookable, and that is the
   * last impression they get. The confirm dialog states this before the send.
   */
  const seatsByLanguage = useMemo(() => {
    const taken = new Map<string, number>();
    for (const b of bookings) {
      if (b.status === "cancelled" || isTbaBooking(b)) continue;
      const key = `${b.trial_date}__${b.start_time}`;
      taken.set(key, (taken.get(key) ?? 0) + 1);
    }
    const out: Record<string, number> = {};
    for (const s of futureSlots) {
      const lang = s.class_language ?? "any";
      const used = taken.get(`${s.trial_date}__${s.start_time}`) ?? 0;
      out[lang] = (out[lang] ?? 0) + Math.max(0, (s.capacity ?? 0) - used);
    }
    return out;
  }, [futureSlots, bookings]);

  const seatsFor = (targets: TrialBooking[]) => {
    const langs = new Set(targets.map((t) => t.class_language ?? "any"));
    let n = 0;
    for (const l of langs) n += seatsByLanguage[l] ?? 0;
    if (seatsByLanguage["any"] && !langs.has("any")) n += seatsByLanguage["any"];
    return n;
  };

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";

  const fetchData = () => {
    // Invalidate trials-related caches so both the local table and the
    // dashboard's pending-count badge refresh from the same source.
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-slots"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-stats"] });
    // The schedule tab and proposals read the trial-admin keys; refresh them
    // together so the two views cannot disagree until the next poll.
    queryClient.invalidateQueries({ queryKey: ["trial-admin"] });
    // Clear stale slot selections so re-confirms always use fresh upcoming slots.
    setTrialSlotMap({});
  };

  const handleConfirm = async (booking: TrialBooking, slotValue: string) => {
    const [date, dowStr, time] = slotValue.split("|");
    setActioningId(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          trial_date: date,
          day_of_week: Number(dowStr),
          start_time: time,
          is_tba: false,
        } as any)
        .eq("id", booking.id);
      if (error) throw error;

      // Fetch meeting URL for this slot.
      // Try exact trial_date match first (one-off slots); fall back to
      // day_of_week match (recurring slots whose trial_date differs from the
      // booking date).
      const { data: slotByDate } = await supabase
        .from("trial_slots")
        .select("meeting_url, class_language, timezone")
        .eq("trial_date", date)
        .eq("start_time", time)
        .maybeSingle();
      const { data: slotByDow } = slotByDate
        ? { data: null }
        : await supabase
            .from("trial_slots")
            .select("meeting_url, class_language, timezone")
            .eq("day_of_week", Number(dowStr))
            .eq("start_time", time)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
      const effectiveSlot = slotByDate ?? slotByDow;
      const meetingUrl = (effectiveSlot as any)?.meeting_url ?? null;

      // Language: booking.class_language ("arabic" / "english") is stored at
      // booking time and is the authoritative source. Fall back to the slot's
      // value in case the booking pre-dates the column, then hard-default "en".
      const rawLang = booking.class_language
        ?? (effectiveSlot as any)?.class_language
        ?? "en";
      // Normalise "arabic"→"ar", "english"→"en" for the email template
      const emailLang = rawLang === "arabic" ? "ar" : rawLang === "english" ? "en" : rawLang;

      // Send confirmation email with join link to the student
      const emailBody: Record<string, unknown> = {
        template: "trial_confirmed",
        email: booking.email,
        name: booking.name || booking.email,
        language: emailLang,
        trial_date: date,
        trial_time: time,
        // The slot's own stored zone — trial_time above is a naive local time
        // and is meaningless without it. This used to be hard-coded to
        // Africa/Cairo, which labelled a 22:00 Malaysia slot as 22:00 Cairo:
        // five hours wrong in the student's inbox.
        trial_timezone: (effectiveSlot as any)?.timezone ?? ADMIN_TIMEZONE,
        level: booking.level?.trim() || "",
      };
      if (meetingUrl) emailBody.class_link_url = meetingUrl;
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", { body: emailBody });

      if (emailErr) {
        toast({ title: "Confirmed (email failed)", description: `Booking saved. Email error: ${emailErr.message}`, variant: "destructive" });
      } else {
        toast({ title: "Confirmed & email sent", description: `${booking.name || booking.email} → ${date} at ${time}` });
      }
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "admin_reject",
        } as any)
        .eq("id", booking.id);
      if (error) {
        if (!isMissingAuditColumn(error)) throw error;
        const fallback = await supabase
          .from("trial_bookings")
          .update({ status: "cancelled" } as any)
          .eq("id", booking.id);
        if (fallback.error) throw fallback.error;
      }
      toast({ title: "Cancelled", description: booking.name || booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleUnschedule = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      // Cancel any existing TBA booking for this email so the one-tba-per-email
      // unique index doesn't block moving this booking to TBA.
      await supabase
        .from("trial_bookings")
        .update({ status: "cancelled" } as any)
        .eq("status", "pending")
        .eq("is_tba", true)
        .ilike("email", booking.email)
        .neq("id", booking.id);

      // Use NULL for date/time — the sync_is_tba trigger sets is_tba=true automatically.
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          start_time: null,
          trial_date: null,
          day_of_week: 0,
          status: "pending",
          confirmed_at: null,
          attendance_confirmed_at: null,
          rebook_email_sent_at: null,
          changed_at: new Date().toISOString(),
        } as any)
        .eq("id", booking.id);
      if (error) {
        if (!isMissingAuditColumn(error)) throw error;
        const fallback = await supabase
          .from("trial_bookings")
          .update({
            start_time: null,
            trial_date: null,
            day_of_week: 0,
            status: "pending",
            confirmed_at: null,
            attendance_confirmed_at: null,
            rebook_email_sent_at: null,
          } as any)
          .eq("id", booking.id);
        if (fallback.error) throw fallback.error;
      }
      toast({ title: "Moved to TBA", description: booking.name || booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const sendRebookEmail = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      // Use active trial slots as the canonical slot list (not derived from bookings).
      const meetingUrl = futureSlots.find((s) => s.meeting_url)?.meeting_url ?? null;
      if (!meetingUrl) {
        // This used to warn and then send anyway, so the student received an
        // invitation with no way to join.
        toast({
          title: "No Google Meet link found for this class.",
          description: "Add it in the trial slot settings before sending.",
          variant: "destructive",
        });
        return;
      }
      if (!booking.email) {
        toast({ title: "No email address on this booking", variant: "destructive" });
        return;
      }
      // class_language on the booking is "arabic" | "english" (stored at booking time).
      // Normalise to the ISO code expected by the email template ("ar" / "en").
      const rawLang = booking.class_language ?? "en";
      // The letter's language and the class's language are two different
      // questions. An Egyptian number means write in Arabic; it does not move
      // anyone out of the English group they chose - langSlots below still
      // filters on rawLang.
      const bookingLang = emailLanguageFor(booking);
      const langSlots = futureSlots.filter(
        (s) => !s.class_language || s.class_language === rawLang
      );
      if (langSlots.length === 0) {
        toast({
          title: "No upcoming slots to offer",
          description: "Add an upcoming trial slot before sending a rebook email.",
          variant: "destructive",
        });
        return;
      }
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_rebook_request",
          email: booking.email,
          name: booking.name || booking.email,
          // Was hardcoded "en" while bookingLang sat computed and unused, so
          // Arabic-track students got the English template - and the confirm
          // dialog told the admin otherwise.
          language: bookingLang,
          // The student's own zone, so the email states each slot in their
          // time. Null for bookings made before that capture shipped; the
          // template then falls back to the slot time plus GMT.
          student_timezone: (booking as any).student_timezone ?? null,
          rebook_url: `${window.location.origin}/trial-booking`,
          class_link_url: meetingUrl,
          available_slots: langSlots.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            timezone: s.timezone ?? ADMIN_TIMEZONE,
            date: s.trial_date,
          })),
        },
      });
      if (emailErr) throw emailErr;
      // Best-effort timestamp write — column is added by a pending migration
      // and may not exist on this env yet. Silently skip on missing-column.
      const { error: updErr } = await supabase
        .from("trial_bookings")
        .update({ rebook_email_sent_at: new Date().toISOString() } as any)
        .eq("id", booking.id);
      if (updErr && updErr.code !== "42703" && !/rebook_email_sent_at/i.test(updErr.message || "")) {
        console.warn("rebook timestamp update failed:", updErr);
      }
      toast({ title: "Rebook email sent", description: booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Email every unscheduled student the button is counting - and only those.
   *
   * This used to send to `bookings.filter(isTbaBooking)`: the whole table,
   * ignoring the status/language/time filters the admin had set, including
   * cancelled rows, including students who had already been emailed, and once
   * per duplicate row. The button beside it counted something else entirely,
   * so the number on the button was never the number of emails sent. The
   * caller now passes the exact list the count was taken from.
   */
  const handleSendRebookToAllTBA = async (targets: TrialBooking[]) => {
    if (targets.length === 0) {
      toast({ title: "Nothing to send", description: "No unscheduled students left to email." });
      return;
    }
    const bulkMeetingUrl = futureSlots.find((s) => s.meeting_url)?.meeting_url ?? null;
    if (!bulkMeetingUrl) {
      // Warned and then sent anyway before this, which put an invitation with
      // no joinable link in front of every unscheduled student at once.
      toast({
        title: "No Google Meet link found for this class.",
        description: "Add it in the trial slot settings before sending.",
        variant: "destructive",
      });
      return;
    }
    setBulkBusy(true);
    let ok = 0, fail = 0, skipped = 0;
    for (const b of targets) {
      try {
        const bRawLang = b.class_language ?? "en";
        // Letter language, not class language - see emailLanguage.ts.
        const bLang = emailLanguageFor(b);
        const bSlots = futureSlots
          .filter((s) => !s.class_language || s.class_language === bRawLang)
          .map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            timezone: s.timezone ?? ADMIN_TIMEZONE,
            date: s.trial_date,
          }));
        if (bSlots.length === 0) {
          // Nothing upcoming in this student's language. An email offering an
          // empty list of dates is worse than no email.
          skipped++;
          continue;
        }
        const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "trial_rebook_request",
            email: b.email,
            name: b.name || b.email,
            language: bLang,
            student_timezone: (b as any).student_timezone ?? null,
            rebook_url: `${window.location.origin}/trial-booking`,
            class_link_url: bulkMeetingUrl,
            available_slots: bSlots,
          },
        });
        if (emailErr) throw emailErr;
        const { error: updErr } = await supabase.from("trial_bookings").update({ rebook_email_sent_at: new Date().toISOString() } as any).eq("id", b.id);
        if (updErr && updErr.code !== "42703" && !/rebook_email_sent_at/i.test(updErr.message || "")) {
          console.warn("rebook timestamp update failed:", updErr);
        }
        ok++;
      } catch {
        fail++;
      }
    }
    toast({
      title: "Rebook emails",
      description: `${ok} sent${fail ? `, ${fail} failed` : ""}${skipped ? `, ${skipped} skipped (no upcoming slot in their language)` : ""}.`,
    });
    fetchData();
    setBulkBusy(false);
  };

  // ── Duplicate unscheduled bookings (same email, more than one active TBA row) ──
  const tbaDuplicateGroups = useMemo(() => {
    const activeTba = bookings.filter((b) => isTbaBooking(b) && b.status !== "cancelled" && b.email);
    const byEmail: Record<string, TrialBooking[]> = {};
    activeTba.forEach((b) => {
      const key = b.email.toLowerCase();
      (byEmail[key] ||= []).push(b);
    });
    return Object.values(byEmail).filter((group) => group.length > 1);
  }, [bookings]);
  const duplicateExtraCount = tbaDuplicateGroups.reduce((n, g) => n + g.length - 1, 0);

  const handleClearDuplicates = async () => {
    if (tbaDuplicateGroups.length === 0) return;
    setBulkBusy(true);
    let cancelled = 0, failed = 0;
    for (const group of tbaDuplicateGroups) {
      // Keep the oldest booking per email, cancel the rest as duplicates.
      const sorted = [...group].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const duplicates = sorted.slice(1);
      for (const dup of duplicates) {
        const { error } = await supabase
          .from("trial_bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancel_reason: "duplicate_entry",
          } as any)
          .eq("id", dup.id);
        if (error) {
          if (!isMissingAuditColumn(error)) { failed++; continue; }
          const fallback = await supabase
            .from("trial_bookings")
            .update({ status: "cancelled" } as any)
            .eq("id", dup.id);
          if (fallback.error) { failed++; continue; }
        }
        cancelled++;
      }
    }
    toast({
      title: "Duplicates cleared",
      description: `${cancelled} duplicate booking${cancelled === 1 ? "" : "s"} cancelled${failed ? `, ${failed} failed` : ""}.`,
    });
    fetchData();
    setBulkBusy(false);
  };

  // ── Repeat detection (same email with more than one ACTIVE booking).
  // Cancelled history doesn't count — otherwise the badge never clears even
  // after a genuine duplicate is resolved (e.g. via "Clear duplicates").
  const emailCounts = useMemo(() => {
    const m: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const k = (b.email || "").toLowerCase();
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [bookings]);
  const isRepeat = (b: TrialBooking) =>
    b.status !== "cancelled" && (emailCounts[(b.email || "").toLowerCase()] || 0) > 1;

  // ── Filter
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (languageFilter !== "all" && (b.class_language ?? null) !== languageFilter) return false;
      if (timeFilter === "all" && b.trial_date && !isTbaBooking(b) && new Date(`${b.trial_date}T00:00:00`) < startOfToday) return false;
      if (timeFilter === "upcoming" || timeFilter === "past") {
        // TBA rows have no date; exclude from upcoming/past filters.
        if (!b.trial_date || isTbaBooking(b)) return false;
        const d = new Date(`${b.trial_date}T00:00:00`);
        if (timeFilter === "upcoming" && d < startOfToday) return false;
        if (timeFilter === "past" && d >= startOfToday) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, languageFilter, timeFilter, startOfToday]);

  // ── Group by exact session (trial_date + start_time). TBA rows fold into a
  // single synthetic session so admins see one "Unscheduled" card.
  const TBA_KEY = "__tba__";
  const sessions = useMemo(() => {
    const groups: Record<string, TrialBooking[]> = {};
    filtered.forEach((b) => {
      // The Unscheduled card shows ongoing trials only. Cancelled bookings
      // are hidden unless the admin explicitly picks the "Cancelled only"
      // status filter, in which case they are listed there.
      if (b.status === "cancelled" && statusFilter !== "cancelled") return;
      const key = (isTbaBooking(b) || b.status === "cancelled") ? TBA_KEY : `${b.trial_date}__${b.start_time}`;
      (groups[key] ||= []).push(b);
    });
    return Object.entries(groups)
      .map(([key, items]) => {
        if (key === TBA_KEY) {
          return { key, date: null, time: null, items, dow: items[0]?.day_of_week ?? 0, isTba: true };
        }
        const [date, time] = key.split("__");
        return { key, date, time, items, dow: items[0]?.day_of_week ?? 0, isTba: false };
      })
      // TBA pinned on top; real sessions sorted most-recent first.
      .sort((a, b) => {
        if (a.isTba) return -1;
        if (b.isTba) return 1;
        return (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || "");
      });
  }, [filtered, statusFilter]);

  /**
   * Ask ONE student whether they are coming.
   *
   * Deliberately still a direct send rather than a call into
   * send-attendance-confirmations: that function skips anyone already stamped,
   * which is exactly right for a batch and exactly wrong for the button an
   * admin presses when one person says they never got the letter.
   *
   * It stamps attendance_email_sent_at anyway, for the same reason the batch
   * does — otherwise this send is invisible to /admin/today and the student
   * gets asked a second time by the next batch.
   */
  const sendAttendanceConfirmation = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { data: slotRow, error: slotErr } = await supabase
        .from("trial_slots")
        .select("meeting_url, class_language, timezone, duration_min")
        .eq("trial_date", booking.trial_date ?? "")
        .eq("start_time", booking.start_time ?? "")
        .maybeSingle();
      if (slotErr) throw slotErr;
      const slot = slotRow as {
        meeting_url?: string | null; class_language?: string | null;
        timezone?: string | null; duration_min?: number | null;
      } | null;
      const meetingUrl = slot?.meeting_url ?? null;
      if (!meetingUrl) {
        // Same rule the batch enforces: a letter that cannot be joined is
        // worse than no letter.
        toast({
          title: "No Google Meet link on this slot",
          description: "Add it in the trial slot settings before asking anyone to confirm.",
          variant: "destructive",
        });
        return;
      }
      const resendLang = slot?.class_language ?? booking.class_language ?? "en";
      const resendEmailLang = resendLang === "arabic" ? "ar" : resendLang === "english" ? "en" : resendLang;
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_attendance_confirmation",
          email: booking.email,
          name: booking.name || booking.email,
          language: resendEmailLang,
          trial_date: booking.trial_date,
          trial_time: booking.start_time,
          // From the slot. Letting the template fall back puts a Cairo class
          // five hours out in the one line the student acts on.
          trial_timezone: slot?.timezone ?? undefined,
          student_timezone: booking.student_timezone ?? null,
          trial_duration_min: slot?.duration_min ?? 30,
          level: booking.level ?? undefined,
          class_link_url: meetingUrl,
          booking_id: booking.id,
          confirmation_token: booking.confirmation_token,
        },
      });
      if (emailErr) throw emailErr;
      const { error: stampErr } = await supabase
        .from("trial_bookings")
        .update({ attendance_email_sent_at: new Date().toISOString() } as any)
        .eq("id", booking.id);
      if (stampErr) {
        // The student has the letter; only our record of it is missing. Say
        // so plainly rather than reporting a send that did happen as a failure.
        toast({
          title: "Sent, but not recorded",
          description: `${booking.email} was asked, but the timestamp could not be saved: ${stampErr.message}`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Asked to confirm", description: booking.email });
      }
      fetchData();
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Ask a whole session to confirm — one date per press, never all of them.
   *
   * Two steps on purpose. The first press is a dry run: send-attendance-
   * confirmations selects exactly who it would write to and why it would skip
   * anyone else, and that list is what the dialog shows. Only the button inside
   * that dialog sends. Nothing here can send without a person having read the
   * list of names first.
   *
   * Fanning out across every session at once is not offered. The sessions are
   * on different days with different rooms, and a mistake made once per date is
   * a mistake caught after the first date rather than after all six.
   */
  const previewAttendanceConfirmations = async (trialDate: string) => {
    setAskBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-attendance-confirmations", {
        body: { dry_run: true, trial_date: trialDate },
      });
      if (error) throw error;
      const result = data as AttendanceSendResult;
      if (result?.error) throw new Error(result.error);
      setAskDialog({ trialDate, preview: result, outcome: null });
    } catch (err: any) {
      toast({ title: "Could not build the preview", description: err.message, variant: "destructive" });
    } finally {
      setAskBusy(false);
    }
  };

  const sendAttendanceConfirmations = async () => {
    if (!askDialog) return;
    setAskBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-attendance-confirmations", {
        body: { dry_run: false, trial_date: askDialog.trialDate },
      });
      if (error) throw error;
      const result = data as AttendanceSendResult;
      if (result?.error) throw new Error(result.error);
      // Kept on screen instead of collapsed into a toast: "3 failed" without
      // the three reasons is a number nobody can act on.
      setAskDialog((prev) => (prev ? { ...prev, outcome: result } : prev));
      fetchData();
    } catch (err: any) {
      toast({ title: "Sending failed", description: err.message, variant: "destructive" });
    } finally {
      setAskBusy(false);
    }
  };

  // Ongoing = not cancelled, and not dated before today. These are the
  // bookings the list shows by default, so the header counts match the page.
  const isOngoing = (b: TrialBooking) =>
    b.status !== "cancelled" &&
    (isTbaBooking(b) || !b.trial_date || new Date(`${b.trial_date}T00:00:00`) >= startOfToday);
  const ongoingCount = bookings.filter(isOngoing).length;
  const pendingCount = bookings.filter((b) => b.status === "pending" && isOngoing(b)).length;

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading trial bookings...</p>;

  const formatSessionLabel = (date: string | null, time: string | null, dow: number, slotTz?: string | null) => {
    if (!date || !time || time === "TBA" || date === "2099-12-31") return "TBA — Unscheduled";
    const adminTz = getAdminTimezone();
    const srcTz = slotTz || "Asia/Kuala_Lumpur";
    const lcl = convertDateTimeToTimezone(date, time, srcTz, adminTz);
    const d = new Date(`${lcl.dateStr}T00:00:00`);
    const weekday = lcl.weekday || DAY_NAMES[dow] || d.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Also show the time in the browser's local timezone if it differs from adminTz
    const browserTz = typeof window !== "undefined"
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone || "")
      : "";
    const showBrowser = browserTz && browserTz !== adminTz && browserTz !== srcTz;
    let browserSuffix = "";
    if (showBrowser) {
      const br = convertDateTimeToTimezone(date, time, srcTz, browserTz);
      const tzCity = browserTz.includes("/") ? browserTz.split("/").pop()!.replace(/_/g, " ") : browserTz;
      browserSuffix = ` · ${br.timeFormatted} (${tzCity})`;
    }

    return `${weekday}, ${dateLabel} — ${lcl.timeFormatted} (${adminTz})${browserSuffix}`;
  };

  const isLegacySlot = (time: string | null) => !!time && !activeSlots.some((s) => s.start_time === time);

  const isPastSession = (date: string | null) => !!date && new Date(`${date}T00:00:00`) < startOfToday;

  const activeScheduleSlots = (allSlotsQ.data ?? [])
    .filter((s) => s.lifecycle === "active")
    .sort((a, b) => (a.trial_date ?? "").localeCompare(b.trial_date ?? "") || a.start_time.localeCompare(b.start_time));

  // advance_trial_slots() (the hourly rollover cron) marks a slot here when
  // it can't move forward because another row already occupies the date and
  // time it would land on — surfaced here, on the exact table Re already
  // opens, rather than only in a log she'd have to know to go looking for.
  const rolloverSkippedSlots = activeScheduleSlots.filter((s) => s.rollover_skipped_at);

  /**
   * Cairo is where every trial student is; the authoring timezone (still
   * sometimes the teacher's own, per ADMIN_TIMEZONE) is secondary context,
   * not the headline. `impliedPeriod` (derived from the real Cairo-local
   * hour) is now the only session-period value shown — there is no stored
   * label left for it to disagree with, which is exactly the point: a
   * derived value cannot lie the way the old free-typed `session_period`
   * field could (see issue #127).
   *
   * `asiaLabel`, English slots only: the same instant in Kuala Lumpur, so
   * Re doesn't have to convert Asia-audience slots in her head. Illustrative
   * only — there's no stored per-slot audience timezone, so this is one
   * representative Asia city, not a claim about where every student is.
   */
  const cairoViewFor = (s: TrialSlotRow) => {
    if (!s.trial_date) return null;
    const cairo = convertDateTimeToTimezone(s.trial_date, s.start_time, s.timezone, "Africa/Cairo");
    if (Number.isNaN(cairo.hour24)) return null;
    const d = new Date(`${cairo.dateStr}T00:00:00`);
    const label = `${cairo.weekday.slice(0, 3)} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${cairo.timeFormatted}`;
    const impliedPeriod = deriveSessionPeriod(cairo.hour24);
    const asiaLabel = s.class_language === "english"
      ? convertDateTimeToTimezone(s.trial_date, s.start_time, s.timezone, getAdminTimezone()).timeFormatted
      : null;
    return {
      label,
      dateStr: cairo.dateStr,
      impliedPeriod,
      asiaLabel,
      authoredDiffers: s.timezone !== "Africa/Cairo",
    };
  };

  return (
    <div className="space-y-4">
      {/* Sessions the hourly job suggested because a language filled up. It
          renders nothing unless one is waiting, and it is the only place a
          suggestion can be turned into a real class — the email that announced
          it carries no button. */}
      {/* Fresh arrivals first: is new traffic coming in, and where does it stall? */}
      <NewTraffic />

      <TrialSlotProposals />

      {/* Who said yes, who said no, who never answered and who was never
          asked — named, per session. The answer already existed elsewhere,
          but only as a caption hidden behind a meeting link, so a session
          without one showed nothing at all. */}
      <TrialAttendanceRoster />

      {/* Trial schedule — edit dates/times/language/capacity for your own availability */}
      <Card>
        <CardHeader
          className="py-3 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          aria-expanded={scheduleOpen}
          onClick={() => setScheduleOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScheduleOpen((o) => !o); } }}
        >
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarCog className="h-4 w-4" />
              Trial Schedule ({activeScheduleSlots.length} active {activeScheduleSlots.length === 1 ? "slot" : "slots"})
              {rolloverSkippedSlots.length > 0 && (
                <span className="inline-flex items-center gap-1 text-destructive font-medium text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {rolloverSkippedSlots.length} didn't auto-advance
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <AddTrialClassDialog />
              </div>
              {scheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Edit any session's date, time, language, or capacity based on your own availability. Changes apply to the public booking page immediately.
          </p>
        </CardHeader>
        {scheduleOpen && (
          <CardContent className="pt-0">
            {rolloverSkippedSlots.length > 0 && (
              <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive space-y-1">
                <p className="font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {rolloverSkippedSlots.length} slot{rolloverSkippedSlots.length === 1 ? "" : "s"} didn't auto-advance this week — move {rolloverSkippedSlots.length === 1 ? "it" : "them"} manually below.
                </p>
                {rolloverSkippedSlots.map((s) => (
                  <p key={s.id} className="pl-5 text-muted-foreground">
                    {DAY_NAMES[s.day_of_week]} {s.start_time} ({s.timezone.replace(/_/g, " ")}): {s.rollover_skip_reason}
                  </p>
                ))}
              </div>
            )}
            {allSlotsQ.isLoading ? (
              <p className="text-xs text-muted-foreground py-4">Loading schedule...</p>
            ) : activeScheduleSlots.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No active trial slots configured.</p>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cairo time</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeScheduleSlots.map((s) => {
                      const cairo = cairoViewFor(s);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs">
                            {cairo ? (
                              <>
                                <div className="font-mono font-medium">{cairo.label}</div>
                                {cairo.authoredDiffers && (
                                  <div className="text-muted-foreground/70 text-[10px] font-mono">
                                    authored {s.trial_date !== cairo.dateStr ? `${s.trial_date} ` : ""}{s.start_time} {s.timezone.replace(/_/g, " ")}
                                  </div>
                                )}
                                {cairo.asiaLabel && (
                                  <div className="text-muted-foreground/70 text-[10px] font-mono">
                                    ≈ {cairo.asiaLabel} {getAdminTimezone().split("/").pop()!.replace(/_/g, " ")}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="font-mono">{s.start_time} ({s.timezone}) · {DAY_NAMES[s.day_of_week]}</span>
                            )}
                            {s.rollover_skipped_at && (
                              <div className="text-destructive text-[10px] font-medium flex items-center gap-1 mt-0.5" title={s.rollover_skip_reason ?? undefined}>
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                didn't auto-advance
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs capitalize">{cairo?.impliedPeriod ?? "—"}</TableCell>
                          <TableCell className="text-xs capitalize">{s.class_language ?? "—"}</TableCell>
                          <TableCell className="text-xs text-right">{s.capacity}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingSlot(s)}
                              title="Edit this trial slot"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      {editingSlot && (
        <AddTrialClassDialog editingSlot={editingSlot} onDoneEditing={() => setEditingSlot(null)} />
      )}

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">
            All Trial Bookings
            <span className="ml-2 text-xs text-muted-foreground font-normal">({ongoingCount} ongoing · {pendingCount} pending · {bookings.length} all-time)</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ongoing only</SelectItem>
              <SelectItem value="everything">All time (incl. past)</SelectItem>
              <SelectItem value="upcoming">Upcoming only</SelectItem>
              <SelectItem value="past">Past only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending only</SelectItem>
              <SelectItem value="confirmed">Confirmed only</SelectItem>
              <SelectItem value="confirmed_attendance">Confirmed attendance</SelectItem>
              <SelectItem value="awaiting_attendance">Awaiting attendance</SelectItem>
              <SelectItem value="no_show">No-show only</SelectItem>
              <SelectItem value="cancelled">Cancelled only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v as LanguageFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              <SelectItem value="arabic">Arabic only</SelectItem>
              <SelectItem value="english">English only</SelectItem>
            </SelectContent>
          </Select>
          {/* "Accept all pending" used to live here. The admin guide lists it
              in red under the buttons never to press: it confirms every
              pending booking at once without a date and without a letter.
              A booking is confirmed one row at a time, against a chosen
              class date, by the Confirm button in that row. */}
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No trial bookings match the current filters.</p>
      ) : (
        sessions.map((session) => {
          const active = session.items.filter((i) => i.status !== "cancelled" && i.status !== "no_show").length;
          // A student who answered the attendance question is confirmed too.
          // Counting only "confirmed" hid every confirmed_attendance booking
          // from the header, so a full session could read as an empty one.
          const confirmed = session.items.filter(
            (i) => i.status === "confirmed" || i.status === "confirmed_attendance",
          ).length;
          const past = isPastSession(session.date);
          const isTbaSession = session.isTba;
          const slotMatch = !session.isTba && session.date && session.time
            ? activeSlots.find((s) => s.trial_date === session.date && s.start_time === session.time)
              ?? activeSlots.find((s) => s.start_time === session.time)
            : null;
          const sessionLanguage = slotMatch?.class_language ?? session.items[0]?.language ?? null;
          // The list the button counts IS the list the button sends to, and
          // "already emailed" means emailed about THESE dates - see
          // rebookTargets.ts. Before, the count was every row in the card
          // (cancelled and already-emailed included) while the send was every
          // TBA row in the table regardless of the admin's filters.
          const tbaTargets = isTbaSession
            ? pickRebookTargets(session.items, slotsUpdatedAt)
            : [];
          const tbaUnsentCount = tbaTargets.length;
          const tbaSeats = isTbaSession ? seatsFor(tbaTargets) : 0;
          const tbaOversubscribed = tbaUnsentCount > tbaSeats;
          // Split by the language the letter would be written in, so an
          // Arabic-only send is one click rather than a filter that gets the
          // set slightly wrong.
          const tbaArabic = tbaTargets.filter((b) => emailLanguageFor(b) === "ar");
          const tbaArabicSeats = isTbaSession ? seatsFor(tbaArabic) : 0;
          return (
            <Card key={session.key}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">
                      {formatSessionLabel(session.date, session.time, session.dow, session.items[0]?.timezone)}
                    </CardTitle>
                    {past && <Badge variant="outline" className="text-[10px]">past</Badge>}
                    {!isTbaSession && isLegacySlot(session.time) && (
                      <Badge variant="outline" className="text-[10px]">legacy slot</Badge>
                    )}
                    {sessionLanguage === "arabic" && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-100">Arabic</Badge>
                    )}
                    {sessionLanguage === "english" && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-100">English</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {session.items.length} booked
                    </span>
                    <span>{confirmed} confirmed · {active} active</span>
                    {isTbaSession && duplicateExtraCount > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            disabled={bulkBusy}
                            title={`${tbaDuplicateGroups.length} email${tbaDuplicateGroups.length === 1 ? "" : "s"} have more than one unscheduled booking`}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Clear duplicates ({duplicateExtraCount})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear duplicate unscheduled bookings?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {tbaDuplicateGroups.length} email{tbaDuplicateGroups.length === 1 ? "" : "s"} have more than one unscheduled booking. This keeps the oldest booking per email and cancels the other {duplicateExtraCount}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearDuplicates}>Clear {duplicateExtraCount}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {isTbaSession && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7"
                            disabled={bulkBusy || tbaUnsentCount === 0}
                            title={tbaUnsentCount === 0 ? "Every unscheduled student here has already been emailed" : `Email ${tbaUnsentCount} unscheduled student${tbaUnsentCount === 1 ? "" : "s"}`}
                          >
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Resend with new dates ({tbaUnsentCount})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Who gets a rebook email?</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-3">
                                <p>
                                  One email each, listing only upcoming slots in that student&apos;s own class language. Cancelled bookings, duplicate rows, and anyone already invited to <em>these</em> dates are excluded.
                                </p>

                                {/* The list itself. Names belong here - behind
                                    the admin login, at the moment of the
                                    decision - and nowhere else. */}
                                <div className="rounded-md border max-h-56 overflow-y-auto divide-y">
                                  {tbaTargets.map((b) => {
                                    const lang = emailLanguageFor(b);
                                    return (
                                      <div key={b.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                                        <span className="min-w-0">
                                          <span className="font-medium text-foreground block truncate">{b.name || "—"}</span>
                                          <span className="text-muted-foreground block truncate">{b.email}</span>
                                        </span>
                                        <span className="flex items-center gap-1 shrink-0">
                                          {lang === "ar" && b.class_language !== "arabic" && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0" title="English class, but an Egyptian number - the letter is written in Arabic">
                                              EG number
                                            </Badge>
                                          )}
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${lang === "ar" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                            {lang === "ar" ? "AR" : "EN"}
                                          </span>
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                <p className={tbaOversubscribed ? "text-destructive font-medium" : ""}>
                                  {tbaOversubscribed
                                    ? `Only ${tbaSeats} seat${tbaSeats === 1 ? "" : "s"} are left across the upcoming classes. Emailing all ${tbaUnsentCount} means ${tbaUnsentCount - tbaSeats} of them open the invitation and find nothing to book.`
                                    : `${tbaSeats} seat${tbaSeats === 1 ? "" : "s"} are open across the upcoming classes — enough for everyone on this list.`}
                                </p>
                                {tbaArabic.length > 0 && tbaArabic.length < tbaUnsentCount && (
                                  <p className="text-muted-foreground">
                                    {tbaArabic.length} of these would be written in Arabic, and {tbaArabicSeats} seat{tbaArabicSeats === 1 ? "" : "s"} cover them.
                                  </p>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                            {tbaArabic.length > 0 && tbaArabic.length < tbaUnsentCount && (
                              <AlertDialogAction
                                onClick={() => handleSendRebookToAllTBA(tbaArabic)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Send Arabic only ({tbaArabic.length})
                              </AlertDialogAction>
                            )}
                            <AlertDialogAction onClick={() => handleSendRebookToAllTBA(tbaTargets)}>
                              Send all {tbaUnsentCount}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {/* One session, one press. The dry run runs first and the
                        dialog it opens is where the sending happens. */}
                    {!isTbaSession && session.date && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7"
                        disabled={askBusy || bulkBusy || past}
                        onClick={() => previewAttendanceConfirmations(session.date!)}
                        title={
                          past
                            ? "This session has already happened"
                            : "Show who would be asked whether they are coming, before anything is sent"
                        }
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Ask them to confirm
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      {/* Six columns, not ten. Name and goal are one student
                          cell, email and phone are one contact cell, and the
                          three date columns (booked / changed / cancelled)
                          are one history cell, because only one of them ever
                          has anything to say about a given row. */}
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            onClick={() => setBookedSort((s) => (s === "asc" ? "desc" : "asc"))}
                            title={bookedSort === "asc" ? "Oldest signup first — click for newest first" : "Newest signup first — click for oldest first"}
                          >
                            Booked
                            {bookedSort === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...session.items]
                        .sort((a, b) =>
                          bookedSort === "asc"
                            ? a.created_at.localeCompare(b.created_at)
                            : b.created_at.localeCompare(a.created_at),
                        )
                        .map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium align-top">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span>{b.name || "—"}</span>
                              {isRepeat(b) && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">repeat</Badge>
                              )}
                            </div>
                            {b.goal && (
                              <div
                                className="text-[11px] font-normal text-muted-foreground max-w-[220px] truncate"
                                title={b.goal}
                              >
                                {b.goal}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs align-top">
                            <div className="truncate max-w-[220px]" title={b.email || ""}>{b.email || "—"}</div>
                            {b.phone && (
                              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{b.phone}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs align-top">
                            {b.level ? (getLevelShortLabel(b.level) || b.level) : "—"}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex w-fit px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                                {STATUS_LABELS[b.status] || (b.status || "unknown")}
                              </span>
                              {b.status === "confirmed_attendance" && b.attendance_confirmed_at && (
                                <span className="text-[10px] text-muted-foreground">
                                  Confirmed {new Date(b.attendance_confirmed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {/* Signed up on, and then only whatever else actually
                              happened to this booking. An empty dash in its own
                              column told nobody anything. */}
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">
                            <div>{new Date(b.created_at).toLocaleDateString()}</div>
                            {b.changed_at && (
                              <div className="text-[10px] text-muted-foreground/80">
                                moved {formatDateTime(b.changed_at)}
                              </div>
                            )}
                            {b.cancelled_at && (
                              <div className="text-[10px] text-destructive/90">
                                cancelled {formatDateTime(b.cancelled_at)}
                                {b.cancel_reason ? ` · ${b.cancel_reason.replace(/_/g, " ")}` : ""}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <div className="flex gap-1 justify-end items-center flex-wrap">
                              {isTbaSession && (
                                <>
                                  {b.rebook_email_sent_at && (
                                    <Badge variant="secondary" className="text-[10px]" title={`Sent ${new Date(b.rebook_email_sent_at).toLocaleString()}`}>
                                      email sent {Math.max(0, Math.floor((Date.now() - new Date(b.rebook_email_sent_at).getTime()) / 86400000))}d ago
                                    </Badge>
                                  )}
                                  <div className="flex flex-col items-end gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id}
                                      onClick={() => sendRebookEmail(b)}
                                      title={b.rebook_email_sent_at ? "Resend with new dates" : "Invite student to choose a new trial date"}
                                    >
                                      <Mail className="h-3.5 w-3.5 mr-1" />
                                      Resend with new dates
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground">Invite students to choose a new trial date</span>
                                  </div>
                                </>
                              )}
                              {/* Gated on the booking being live and joinable,
                                  not on status. It used to require
                                  status === "awaiting_attendance", which meant
                                  the 57 students sitting at "pending" — every
                                  student actually waiting on a September
                                  session — could not be asked at all. Whether
                                  we can ask someone depends on there being a
                                  room and a token, never on which status the
                                  booking happens to be parked in. */}
                              {!isTbaSession && b.status !== "cancelled" && slotMatch?.meeting_url && (
                                <div className="flex flex-col items-end gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7"
                                    disabled={actioningId === b.id || !b.confirmation_token || (!!b.attendance_email_sent_at && Date.now() - new Date(b.attendance_email_sent_at).getTime() < 48 * 3600000)}
                                    onClick={() => sendAttendanceConfirmation(b)}
                                    title={
                                      !b.confirmation_token
                                        ? "This booking has no confirmation token, so the letter would have no confirm or decline button"
                                        : b.attendance_email_sent_at
                                          ? `Last asked ${new Date(b.attendance_email_sent_at).toLocaleString()}`
                                          : "Ask this student whether they are coming"
                                    }
                                  >
                                    <Mail className="h-3.5 w-3.5 mr-1" />
                                    {b.attendance_email_sent_at ? "Ask again" : "Ask to confirm"}
                                  </Button>
                                  {/* What they said, if anything — an answer
                                      already given is the whole reason to
                                      press this button or leave it alone. */}
                                  {b.attendance_response === "yes" && (
                                    <span className="text-[10px] text-emerald-700">Said yes</span>
                                  )}
                                  {b.attendance_response === "no" && (
                                    <span className="text-[10px] text-destructive">Said no</span>
                                  )}
                                  {!b.attendance_response && b.attendance_email_sent_at && (
                                    <span className="text-[10px] text-muted-foreground">Asked, no reply</span>
                                  )}
                                </div>
                              )}
                              {b.status === "pending" && (
                                <>
                                  {(() => {
                                    const lang = b.language ?? null;
                                    const filtered = lang
                                      ? upcomingSlots.filter((s) => s.class_language === lang)
                                      : upcomingSlots;
                                    const slots = filtered.length ? filtered : upcomingSlots;
                                    const defaultVal = trialSlotMap[b.id] ?? slots[0]?.value ?? "";
                                    return (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Select
                                      value={defaultVal}
                                      onValueChange={(v) => setTrialSlotMap((prev) => ({ ...prev, [b.id]: v }))}
                                    >
                                      <SelectTrigger className="h-7 w-[185px] text-xs">
                                        <SelectValue placeholder="Pick class date" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {slots.map((s) => (
                                          <SelectItem key={s.value} value={s.value} className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                              <span className={`inline-block px-1 py-0.5 rounded text-[10px] font-medium leading-none ${s.class_language === "arabic" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                                {s.class_language === "arabic" ? "AR" : "EN"}
                                              </span>
                                              {s.label}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id || !slots.length}
                                      onClick={() => handleConfirm(b, defaultVal)}
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Confirm
                                    </Button>
                                  </div>
                                    );
                                  })()}
                                  <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleReject(b)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Reject
                                  </Button>
                                </>
                              )}
                              {!isTbaSession && b.status !== "cancelled" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id}
                                      title="Move student back to the TBA (unscheduled) list"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Unschedule
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Move {b.name || b.email} back to TBA?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        The booking returns to the unscheduled list and its confirmation is cleared. The student can rebook via the link in their rebook email.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleUnschedule(b)}>Unschedule</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {!isTbaSession && b.status === "cancelled" && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* One dialog for the whole page, holding one date at a time. It opens on
          the dry run, so the list below is the function's own answer to "who
          would this write to", not a second guess made here that could drift
          from it. */}
      <AlertDialog open={!!askDialog} onOpenChange={(open) => { if (!open) setAskDialog(null); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {askDialog?.outcome
                ? "Asked to confirm"
                : `Ask the ${askDialog?.trialDate ?? ""} session to confirm?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {askDialog && !askDialog.outcome && (
                  <>
                    <p>
                      One email each, asking whether they are coming, with a confirm and a decline
                      button. Nothing has been sent yet — this is the list the send would use.
                    </p>

                    {askDialog.preview.candidates === 0 ? (
                      <p className="font-medium text-foreground">
                        {askDialog.preview.message ?? "Nobody on this date is waiting to be asked."}
                      </p>
                    ) : (
                      /* Names belong here — behind the admin login, at the
                         moment of the decision — and nowhere else. */
                      <div className="rounded-md border max-h-56 overflow-y-auto divide-y">
                        {(askDialog.preview.preview ?? []).map((p) => {
                          const b = bookings.find((x) => x.id === p.booking_id);
                          return (
                            <div key={p.booking_id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                              <span className="min-w-0">
                                <span className="font-medium text-foreground block truncate">{b?.name || "—"}</span>
                                <span className="text-muted-foreground block truncate">{p.email}</span>
                              </span>
                              {p.already_answered && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                  already said {p.already_answered}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {askDialog.preview.skipped.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {askDialog.preview.skipped.length} skipped, and why:
                        </p>
                        <ul className="rounded-md border max-h-32 overflow-y-auto divide-y text-xs">
                          {askDialog.preview.skipped.map((s) => {
                            const b = bookings.find((x) => x.id === s.booking_id);
                            return (
                              <li key={s.booking_id} className="px-2.5 py-1.5">
                                <span className="font-medium text-foreground">{b?.name || b?.email || s.booking_id}</span>
                                {" — "}
                                {s.reason}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {askDialog?.outcome && (
                  <>
                    <p className="font-medium text-foreground">
                      {askDialog.outcome.sent} sent
                      {askDialog.outcome.failed ? `, ${askDialog.outcome.failed} failed` : ""}
                      {askDialog.outcome.skipped.length ? `, ${askDialog.outcome.skipped.length} skipped` : ""}.
                    </p>
                    {askDialog.outcome.failures.length > 0 && (
                      <ul className="rounded-md border border-destructive/40 max-h-40 overflow-y-auto divide-y text-xs">
                        {askDialog.outcome.failures.map((f) => {
                          const b = bookings.find((x) => x.id === f.booking_id);
                          return (
                            <li key={f.booking_id} className="px-2.5 py-1.5">
                              <span className="font-medium text-foreground">{b?.name || b?.email || f.booking_id}</span>
                              {" — "}
                              <span className="text-destructive">{f.error}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {askDialog.outcome.skipped.length > 0 && (
                      <ul className="rounded-md border max-h-32 overflow-y-auto divide-y text-xs">
                        {askDialog.outcome.skipped.map((s) => {
                          const b = bookings.find((x) => x.id === s.booking_id);
                          return (
                            <li key={s.booking_id} className="px-2.5 py-1.5">
                              <span className="font-medium text-foreground">{b?.name || b?.email || s.booking_id}</span>
                              {" — "}
                              {s.reason}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{askDialog?.outcome ? "Close" : "Cancel"}</AlertDialogCancel>
            {askDialog && !askDialog.outcome && askDialog.preview.candidates > 0 && (
              <AlertDialogAction
                disabled={askBusy}
                onClick={(e) => {
                  // The dialog stays open so the outcome — including every
                  // failure reason — is read in the same place the decision
                  // was made.
                  e.preventDefault();
                  sendAttendanceConfirmations();
                }}
              >
                {askBusy ? "Sending…" : `Send to ${askDialog.preview.candidates}`}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrialClassesManager;
