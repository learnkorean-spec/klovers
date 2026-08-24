/**
 * "My Students" — Re's ongoing 1:1 students and their weekly classes.
 *
 * These are private students, not people registered on kloversegy.com; the
 * existing Students tab covers those. What makes this screen matter is that
 * every class here blocks that time for trials automatically — the availability
 * engine reads these rows directly, so moving a class moves the trial slots in
 * the same instant.
 *
 * A class that runs past midnight is ONE class, stored as one row
 * (start + duration) and shown as one line. It is never split into two entries.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Clock, Loader2, GraduationCap, AlertTriangle,
  Video, Copy, Check, CalendarCheck, X, Wallet, History,
} from "lucide-react";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";
import {
  useMyStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  useUpsertClass, useDeleteClass, checkClassConflicts, type ClassConflict,
  useBundleBalances, useRecentSessions, useAllStudentSessions, useStudentBundles,
  useAddBundle, useConfirmSessions, useUnconfirmSession,
  type ConfirmSessionInput,
} from "@/hooks/admin/useMyStudents";
import {
  DAY_NAMES, STATUS_LABEL, STUDENT_STATUSES, STUDENT_SUBJECTS, SUBJECT_LABEL,
  buildExpectedSessions, crossesMidnight, formatClassRange, formatMoney,
  formatSessionDate, formatWeeklySummary, localDateKey, pricePerClass, weeklyMinutes,
  type BundleBalance, type ExpectedSession, type MyStudentWithClasses,
  type StudentClassSchedule, type StudentStatus, type StudentSubject,
} from "@/types/students";
import {
  getBundleOptions, getCurrencyForCountry, currencyChoicesFor, type BundleOption,
} from "@/lib/stripePrices";
import { CountryCombobox } from "@/components/admin/CountryCombobox";

const SUBJECT_BADGE: Record<StudentSubject, string> = {
  korean: "bg-yellow-100 text-yellow-900 border-yellow-300",
  english: "bg-sky-100 text-sky-900 border-sky-300",
};

const STATUS_BADGE: Record<StudentStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  ended: "bg-gray-100 text-gray-600",
};

/** 30-minute options across the day, matching the trial grid. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 105, 120, 150, 180];

type StudentDraft = {
  id?: string; full_name: string; subject: StudentSubject; status: StudentStatus; note: string;
  meeting_url: string; country: string; currency: string;
};
type ClassDraft = {
  id?: string; student_id: string; weekday: number; start_time: string; duration_minutes: number;
  /** "YYYY-MM-DD". Defaults to today for a new class, matching the column default. */
  effective_from: string;
};

const emptyStudent = (): StudentDraft => ({
  full_name: "", subject: "korean", status: "active", note: "",
  meeting_url: "", country: "", currency: "",
});

/** Postgres returns "22:00:00"; the picker works in "22:00". */
const trimSeconds = (t: string) => t.slice(0, 5);


/**
 * How far back the confirm strip and catch-up look. Long enough to cover a busy
 * fortnight, short enough that the list stays readable; older sessions are added
 * from the student's history.
 */
const CATCH_UP_DAYS = 14;

type BundleDraft = {
  student_id: string;
  mode: "catalog" | "custom";
  catalog_key: string | null;
  label: string;
  /** Strings while typing; parsed on save. */
  total_classes: string;
  total_price: string;
  currency: string;
};

/** The stable meeting room for one student, with a one-click copy. */
const MeetingLinkRow = ({ url, onEdit }: { url: string | null; onEdit: () => void }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Could not copy", description: "Copy it from the edit dialog instead.", variant: "destructive" });
    }
  };

  if (!url) {
    return (
      <Button variant="outline" size="sm" onClick={onEdit} className="text-muted-foreground">
        <Video className="h-3.5 w-3.5 mr-1" /> Add meeting link
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Video className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <a
        href={url} target="_blank" rel="noopener noreferrer"
        className="truncate max-w-[22rem] text-primary hover:underline"
        title={url}
      >
        {url.replace(/^https:\/\//, "")}
      </a>
      <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={copy} title="Copy link">
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={onEdit} title="Change link">
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
};

/**
 * What the student bought and what is left.
 *
 * Reaching zero is loud and nothing else: no status changes, no schedule pauses.
 * A negative balance is shown rather than prevented — a class that happened
 * after the bundle ran out still happened, and hiding that would make the
 * screen disagree with the week.
 */
const BundleBox = ({
  balance, onAdd, onCatchUp, onHistory, unconfirmedCount,
}: {
  balance: BundleBalance | undefined;
  onAdd: () => void;
  onCatchUp: () => void;
  onHistory: () => void;
  unconfirmedCount: number;
}) => {
  if (!balance) {
    return (
      <div className="rounded-md border border-dashed px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          No bundle — classes are not being counted for this student.
        </span>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Wallet className="h-3.5 w-3.5 mr-1" /> Add bundle
        </Button>
      </div>
    );
  }

  const { total_classes, used_classes, remaining_classes } = balance;
  const pct = Math.min(100, Math.max(0, (used_classes / Math.max(1, total_classes)) * 100));
  const out = remaining_classes <= 0;
  const low = remaining_classes > 0 && remaining_classes <= 2;

  return (
    <div className={`rounded-md border px-3 py-2.5 space-y-2 ${out ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{balance.label}</span>
        <span className="text-xs text-muted-foreground">
          {formatMoney(balance.total_price, balance.currency)} ·{" "}
          {pricePerClass(balance.total_price, balance.total_classes, balance.currency)}
        </span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all ${out ? "bg-destructive" : low ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {used_classes} of {total_classes} used
        </span>
        {out ? (
          <Badge className="bg-destructive text-destructive-foreground">
            {remaining_classes === 0
              ? "0 classes left"
              : `${Math.abs(remaining_classes)} over`}
          </Badge>
        ) : (
          <Badge variant="outline" className={low ? "border-amber-400 text-amber-700" : ""}>
            {remaining_classes} left
          </Badge>
        )}
      </div>

      {out && (
        <p className="text-xs text-destructive">
          Bundle finished. Classes still run and still block trial times — add the next
          bundle when you have agreed it with them.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <Button variant="outline" size="sm" onClick={onCatchUp}>
          <CalendarCheck className="h-3.5 w-3.5 mr-1" />
          Catch up{unconfirmedCount > 0 ? ` (${unconfirmedCount})` : ""}
        </Button>
        <Button variant="ghost" size="sm" onClick={onHistory}>
          <History className="h-3.5 w-3.5 mr-1" /> History
        </Button>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Wallet className="h-3.5 w-3.5 mr-1" /> New bundle
        </Button>
      </div>
    </div>
  );
};


/**
 * Everything ever confirmed for one student, plus the bundles they ran against.
 *
 * Deliberately not windowed: this is where a mistake from three weeks ago gets
 * put right. Undo deletes the row and the balance is recounted — there is no
 * stored total to repair.
 */
const StudentHistory = ({
  studentId, onUndo, undoing,
}: {
  studentId: string;
  onUndo: (sessionId: string) => void;
  undoing: boolean;
}) => {
  const { data: sessions = [], isLoading } = useAllStudentSessions(studentId);
  const { data: bundles = [] } = useStudentBundles(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bundles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bundles</p>
          {bundles.map(b => (
            <div key={b.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm">
              <span>
                {b.label}
                <span className="text-muted-foreground"> · {formatMoney(b.total_price, b.currency)} · {b.total_classes} classes</span>
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {b.status === "active" ? "Active" : b.status === "completed" ? "Finished" : "Cancelled"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Confirmed classes ({sessions.filter(x => x.counted).length} counted)
        </p>
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nothing confirmed yet.</p>
        )}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {sessions.map(x => (
            <div key={x.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">{formatSessionDate(x.session_date)}</span>
                <span>{x.start_time.slice(0, 5)}</span>
                {x.counted
                  ? <Badge variant="outline" className="text-[10px]">1 credit</Badge>
                  : <Badge variant="outline" className="text-[10px] text-muted-foreground">not held</Badge>}
              </span>
              <Button variant="ghost" size="sm" disabled={undoing} onClick={() => onUndo(x.id)}>
                Undo
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MyStudentsManager = () => {
  const { data: students = [], isLoading } = useMyStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const upsertClass = useUpsertClass();
  const deleteClass = useDeleteClass();

  // Credits. The window is fixed at mount so the query key stays stable while
  // the tab is open rather than changing at midnight mid-session.
  const [since] = useState(() =>
    localDateKey(new Date(Date.now() - CATCH_UP_DAYS * 86400000), ADMIN_TIMEZONE));
  const { data: balances } = useBundleBalances();
  const { data: recentSessions = [] } = useRecentSessions(since);
  const addBundle = useAddBundle();
  const confirmSessions = useConfirmSessions();
  const unconfirmSession = useUnconfirmSession();

  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null);
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MyStudentWithClasses | null>(null);
  // Trial bookings the pending class time would run over. Non-empty blocks the
  // save: Re resolves the trial first, then moves the class.
  const [conflicts, setConflicts] = useState<ClassConflict[]>([]);
  const [checking, setChecking] = useState(false);
  const [bundleDraft, setBundleDraft] = useState<BundleDraft | null>(null);
  const [catchUpFor, setCatchUpFor] = useState<MyStudentWithClasses | null>(null);
  const [catchUpPicked, setCatchUpPicked] = useState<Set<string>>(new Set());
  const [historyFor, setHistoryFor] = useState<MyStudentWithClasses | null>(null);

  const totals = useMemo(() => {
    const active = students.filter(s => s.status === "active");
    const mins = active.reduce((sum, s) => sum + weeklyMinutes(s.classes), 0);
    return { active: active.length, hours: (mins / 60).toFixed(1) };
  }, [students]);

  /**
   * Every occurrence the weekly schedule implies over the window, per student,
   * paired with its confirmation. Rebuilt from the schedule each render rather
   * than stored, so editing a class immediately changes what is offered.
   */
  const expectedByStudent = useMemo(() => {
    const map = new Map<string, ExpectedSession[]>();
    for (const student of students) {
      map.set(student.id, buildExpectedSessions(
        student.classes,
        recentSessions.filter(r => r.student_id === student.id),
        { days: CATCH_UP_DAYS, timeZone: ADMIN_TIMEZONE },
      ));
    }
    return map;
  }, [students, recentSessions]);

  /**
   * The confirm strip: classes that have happened and not been dealt with.
   * A student with no active bundle is skipped — there is nothing to draw a
   * credit from, and nagging about it would not help.
   */
  const toConfirm = useMemo(() => {
    const rows: Array<{ student: MyStudentWithClasses; occ: ExpectedSession }> = [];
    for (const student of students) {
      if (!balances?.get(student.id)) continue;
      for (const occ of expectedByStudent.get(student.id) ?? []) {
        if (!occ.confirmed) rows.push({ student, occ });
      }
    }
    return rows.sort((a, b) =>
      b.occ.session_date.localeCompare(a.occ.session_date) ||
      b.occ.start_time.localeCompare(a.occ.start_time));
  }, [students, balances, expectedByStudent]);

  const unconfirmedCount = (studentId: string) =>
    (expectedByStudent.get(studentId) ?? []).filter(o => !o.confirmed).length;

  const saveStudent = async () => {
    if (!studentDraft) return;
    if (!studentDraft.full_name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const link = studentDraft.meeting_url.trim();
    if (link && !/^https:\/\/\S+$/.test(link)) {
      // Caught here so Re reads a sentence rather than the CHECK constraint.
      toast({
        title: "That meeting link will not save",
        description: "It has to start with https:// and contain no spaces.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      full_name: studentDraft.full_name,
      subject: studentDraft.subject,
      status: studentDraft.status,
      note: studentDraft.note.trim() || null,
      meeting_url: link || null,
      country: studentDraft.country || null,
      currency: studentDraft.currency || null,
    };
    try {
      if (studentDraft.id) await updateStudent.mutateAsync({ id: studentDraft.id, ...payload });
      else await createStudent.mutateAsync(payload);
      toast({ title: studentDraft.id ? "Student updated" : "Student added" });
      setStudentDraft(null);
    } catch (e) {
      toast({ title: "Could not save student", description: (e as Error).message, variant: "destructive" });
    }
  };

  const saveClass = async () => {
    if (!classDraft) return;
    setConflicts([]);
    try {
      setChecking(true);
      const found = await checkClassConflicts({
        weekday: classDraft.weekday,
        start_time: classDraft.start_time,
        duration_minutes: classDraft.duration_minutes,
      });
      setChecking(false);
      if (found.length > 0) {
        // Refused, not warned. The database enforces this too; stopping here
        // just means Re reads a sentence instead of a Postgres exception.
        setConflicts(found);
        return;
      }
      await upsertClass.mutateAsync(classDraft);
      toast({
        title: classDraft.id ? "Class updated" : "Class added",
        description: "Trial availability has been updated to match.",
      });
      setClassDraft(null);
    } catch (e) {
      setChecking(false);
      toast({ title: "Could not save class", description: (e as Error).message, variant: "destructive" });
    }
  };


  // --- credits ---------------------------------------------------------------

  /** One click on the strip. The bundle is resolved here so the row stays dumb. */
  const confirmOne = async (studentId: string, occ: ExpectedSession, outcome: "attended" | "cancelled_no_charge") => {
    const bundle = balances?.get(studentId);
    if (!bundle) {
      toast({ title: "No active bundle", description: "Add a bundle before counting classes.", variant: "destructive" });
      return;
    }
    try {
      await confirmSessions.mutateAsync([{
        student_id: studentId,
        bundle_id: bundle.bundle_id,
        class_id: occ.class_id,
        session_date: occ.session_date,
        start_time: occ.start_time,
        outcome,
      }]);
      toast({
        title: outcome === "attended" ? "Class counted" : "Marked as not held",
        description: outcome === "attended"
          ? `${bundle.remaining_classes - 1} classes left.`
          : "No credit was used.",
      });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    }
  };

  const undoConfirm = async (id: string) => {
    try {
      await unconfirmSession.mutateAsync(id);
      toast({ title: "Undone", description: "The credit is back." });
    } catch (e) {
      toast({ title: "Could not undo", description: (e as Error).message, variant: "destructive" });
    }
  };

  const openCatchUp = (student: MyStudentWithClasses) => {
    // Everything unconfirmed starts ticked: the common case is "these all
    // happened, I just did not click at the time".
    const unconfirmed = (expectedByStudent.get(student.id) ?? []).filter(o => !o.confirmed);
    setCatchUpPicked(new Set(unconfirmed.map(o => `${o.session_date}|${o.start_time}`)));
    setCatchUpFor(student);
  };

  /**
   * Batch confirm. Ticked rows count, unticked rows are recorded as not held so
   * they stop appearing. Both go in one insert, so the database refuses the whole
   * batch if any single day was already confirmed elsewhere.
   */
  const saveCatchUp = async () => {
    if (!catchUpFor) return;
    const bundle = balances?.get(catchUpFor.id);
    if (!bundle) return;

    const rows: ConfirmSessionInput[] = (expectedByStudent.get(catchUpFor.id) ?? [])
      .filter(o => !o.confirmed)
      .map(o => ({
        student_id: catchUpFor.id,
        bundle_id: bundle.bundle_id,
        class_id: o.class_id,
        session_date: o.session_date,
        start_time: o.start_time,
        outcome: catchUpPicked.has(`${o.session_date}|${o.start_time}`)
          ? ("attended" as const)
          : ("cancelled_no_charge" as const),
      }));

    try {
      await confirmSessions.mutateAsync(rows);
      const counted = rows.filter(r => r.outcome === "attended").length;
      toast({
        title: `${counted} ${counted === 1 ? "class" : "classes"} counted`,
        description: `${bundle.remaining_classes - counted} left on ${catchUpFor.full_name}'s bundle.`,
      });
      setCatchUpFor(null);
    } catch (e) {
      toast({
        title: "Nothing was saved",
        description: `${(e as Error).message} — no part of the batch was applied.`,
        variant: "destructive",
      });
    }
  };

  // --- bundles ---------------------------------------------------------------

  const openBundleDialog = (student: MyStudentWithClasses) => {
    setBundleDraft({
      student_id: student.id,
      mode: "custom",
      catalog_key: null,
      label: "",
      total_classes: "",
      total_price: "",
      currency: student.currency ?? getCurrencyForCountry(student.country) ?? "USD",
    });
  };

  /** Picking a catalogue option fills the fields and leaves them editable. */
  const applyCatalogOption = (opt: BundleOption) => {
    if (!bundleDraft) return;
    setBundleDraft({
      ...bundleDraft,
      mode: "catalog",
      catalog_key: opt.key,
      label: opt.label,
      total_classes: String(opt.classes),
      total_price: String(opt.price),
      currency: opt.currency,
    });
  };

  /**
   * Any hand-edit of a catalogue bundle makes it custom. The stored row can then
   * never claim to have come from a catalogue entry it no longer matches — which
   * the database also enforces.
   */
  const editBundleField = (patch: Partial<BundleDraft>) => {
    if (!bundleDraft) return;
    const touchesNumbers = "total_classes" in patch || "total_price" in patch || "currency" in patch;
    setBundleDraft({
      ...bundleDraft,
      ...patch,
      ...(touchesNumbers && bundleDraft.mode === "catalog"
        ? { mode: "custom" as const, catalog_key: null }
        : {}),
    });
  };

  const saveBundle = async () => {
    if (!bundleDraft) return;
    const classes = Number(bundleDraft.total_classes);
    const price = Number(bundleDraft.total_price);

    if (!Number.isInteger(classes) || classes <= 0) {
      toast({ title: "How many classes?", description: "Enter a whole number above zero.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "What did they pay?", description: "Enter the total price.", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{3}$/.test(bundleDraft.currency)) {
      toast({ title: "Pick a currency", variant: "destructive" });
      return;
    }

    try {
      await addBundle.mutateAsync({
        student_id: bundleDraft.student_id,
        source: bundleDraft.mode,
        catalog_key: bundleDraft.mode === "catalog" ? bundleDraft.catalog_key : null,
        label: bundleDraft.label.trim() || `${classes} classes`,
        total_classes: classes,
        total_price: price,
        currency: bundleDraft.currency,
      });
      toast({ title: "Bundle added", description: "Any previous bundle was closed off." });
      setBundleDraft(null);
    } catch (e) {
      toast({ title: "Could not add bundle", description: (e as Error).message, variant: "destructive" });
    }
  };

  const closeClassDialog = () => { setClassDraft(null); setConflicts([]); };

  const formatConflict = (c: ClassConflict) =>
    new Date(c.starts_at).toLocaleString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", timeZone: ADMIN_TIMEZONE,
    });

  const removeClass = async (c: StudentClassSchedule) => {
    try {
      await deleteClass.mutateAsync(c.id);
      toast({ title: "Class removed", description: "That time is now open for trials." });
    } catch (e) {
      toast({ title: "Could not remove class", description: (e as Error).message, variant: "destructive" });
    }
  };

  const removeStudent = async () => {
    if (!confirmDelete) return;
    try {
      await deleteStudent.mutateAsync(confirmDelete.id);
      toast({ title: "Student removed", description: "Their class times are now open for trials." });
      setConfirmDelete(null);
    } catch (e) {
      toast({ title: "Could not remove student", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> My Students
            </CardTitle>
            <CardDescription>
              Your ongoing private students. Their classes block that time for trials
              automatically — all times are your own ({ADMIN_TIMEZONE.replace(/_/g, " ")}).
            </CardDescription>
          </div>
          <Button onClick={() => setStudentDraft(emptyStudent())}>
            <Plus className="h-4 w-4 mr-1" /> Add student
          </Button>
        </div>
        {!isLoading && (
          <p className="text-xs text-muted-foreground pt-1">
            {totals.active} active · {totals.hours} teaching hours a week
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
          </div>
        )}

        {!isLoading && students.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">
            No students yet. Add one and their weekly classes will be kept clear of trials.
          </p>
        )}

        {toConfirm.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CalendarCheck className="h-4 w-4" />
              To confirm
              <Badge variant="secondary">{toConfirm.length}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              Classes your schedule says have happened. Nothing is counted until you say so.
            </p>
            <div className="space-y-1">
              {toConfirm.slice(0, 8).map(({ student, occ }) => (
                <div
                  key={`${student.id}|${occ.session_date}|${occ.start_time}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{formatSessionDate(occ.session_date)}</span>
                    <span className="font-medium">{student.full_name}</span>
                    <span className="text-muted-foreground">
                      {formatClassRange(occ.start_time, occ.duration_minutes)}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <Button
                      size="sm" variant="outline"
                      disabled={confirmSessions.isPending}
                      onClick={() => confirmOne(student.id, occ, "attended")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Class done
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      title="Did not happen — no credit used"
                      disabled={confirmSessions.isPending}
                      onClick={() => confirmOne(student.id, occ, "cancelled_no_charge")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </div>
              ))}
              {toConfirm.length > 8 && (
                <p className="text-xs text-muted-foreground pt-1">
                  …and {toConfirm.length - 8} more — use Catch up on the student to do them together.
                </p>
              )}
            </div>
          </div>
        )}

        {students.map(student => (
          <div key={student.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{student.full_name}</span>
                <Badge variant="outline" className={SUBJECT_BADGE[student.subject]}>
                  {SUBJECT_LABEL[student.subject]}
                </Badge>
                {student.country && (
                  <Badge variant="outline" className="text-[10px]">
                    {student.country}
                    {student.currency ? ` · ${student.currency}` : ""}
                  </Badge>
                )}
                {student.status !== "active" && (
                  <Badge className={STATUS_BADGE[student.status]}>{STATUS_LABEL[student.status]}</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setStudentDraft({
                    id: student.id,
                    full_name: student.full_name,
                    subject: student.subject,
                    status: student.status,
                    note: student.note ?? "",
                    meeting_url: student.meeting_url ?? "",
                    country: student.country ?? "",
                    currency: student.currency ?? "",
                  })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(student)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{formatWeeklySummary(student.classes)}</p>

            <MeetingLinkRow
              url={student.meeting_url}
              onEdit={() => setStudentDraft({
                id: student.id,
                full_name: student.full_name,
                subject: student.subject,
                status: student.status,
                note: student.note ?? "",
                meeting_url: student.meeting_url ?? "",
                country: student.country ?? "",
                currency: student.currency ?? "",
              })}
            />

            <BundleBox
              balance={balances?.get(student.id)}
              unconfirmedCount={unconfirmedCount(student.id)}
              onAdd={() => openBundleDialog(student)}
              onCatchUp={() => openCatchUp(student)}
              onHistory={() => setHistoryFor(student)}
            />

            <div className="space-y-1.5">
              {student.classes.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium w-24">{DAY_NAMES[c.weekday]}</span>
                    <span>{formatClassRange(trimSeconds(c.start_time), c.duration_minutes)}</span>
                    {crossesMidnight(trimSeconds(c.start_time), c.duration_minutes) && (
                      // One class, one row. The badge explains the "+1 day" above
                      // so it never reads as two separate classes.
                      <Badge variant="outline" className="text-[10px]">runs past midnight</Badge>
                    )}
                    {/* Surfaced here, not only inside the dialog — a wrong start
                        date silently empties the confirm strip, so it has to be
                        visible at a glance rather than found by opening Edit. */}
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      since {formatSessionDate(c.effective_from)}
                    </Badge>
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost" size="sm" aria-label="Edit class"
                      onClick={() => setClassDraft({
                        id: c.id,
                        student_id: student.id,
                        weekday: c.weekday,
                        start_time: trimSeconds(c.start_time),
                        duration_minutes: c.duration_minutes,
                        effective_from: c.effective_from,
                      })}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Remove class" onClick={() => removeClass(c)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </span>
                </div>
              ))}
              <Button
                variant="outline" size="sm"
                onClick={() => setClassDraft({
                  student_id: student.id, weekday: 1, start_time: "19:00", duration_minutes: 90,
                  effective_from: localDateKey(new Date(), ADMIN_TIMEZONE),
                })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add a class
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Student dialog */}
      <Dialog open={!!studentDraft} onOpenChange={o => !o && setStudentDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{studentDraft?.id ? "Edit student" : "Add student"}</DialogTitle>
            <DialogDescription>
              Country sets the default prices and currency when you add a bundle.
            </DialogDescription>
          </DialogHeader>
          {studentDraft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="student-name">Name</Label>
                <Input
                  id="student-name" value={studentDraft.full_name}
                  onChange={e => setStudentDraft({ ...studentDraft, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Learning</Label>
                <Select
                  value={studentDraft.subject}
                  onValueChange={v => setStudentDraft({ ...studentDraft, subject: v as StudentSubject })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{SUBJECT_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={studentDraft.status}
                  onValueChange={v => setStudentDraft({ ...studentDraft, status: v as StudentStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only active students block trial times. Pausing frees their slots without losing the schedule.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-link">Meeting link (optional)</Label>
                <Input
                  id="student-link" value={studentDraft.meeting_url}
                  onChange={e => setStudentDraft({ ...studentDraft, meeting_url: e.target.value })}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                />
                <p className="text-xs text-muted-foreground">
                  Their own room, reused every week. Teams, Meet or Zoom.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="student-country">Country</Label>
                  <CountryCombobox
                    id="student-country"
                    value={studentDraft.country}
                    onChange={country => {
                      // The country fills the currency only when Re has not
                      // chosen one; what they pay in is an agreement, not a lookup.
                      const suggested = getCurrencyForCountry(country) ?? "";
                      setStudentDraft({
                        ...studentDraft,
                        country,
                        currency: studentDraft.currency || suggested,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select
                    value={studentDraft.currency || "none"}
                    onValueChange={v => setStudentDraft({ ...studentDraft, currency: v === "none" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {currencyChoicesFor(studentDraft.country, studentDraft.currency).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">What they pay in.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student-note">Note (optional)</Label>
                <Input
                  id="student-note" value={studentDraft.note}
                  onChange={e => setStudentDraft({ ...studentDraft, note: e.target.value })}
                  placeholder="Only you can see this"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDraft(null)}>Cancel</Button>
            <Button onClick={saveStudent} disabled={createStudent.isPending || updateStudent.isPending}>
              {(createStudent.isPending || updateStudent.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class dialog */}
      <Dialog open={!!classDraft} onOpenChange={o => !o && closeClassDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{classDraft?.id ? "Edit class" : "Add a class"}</DialogTitle>
            <DialogDescription>
              Weekly, in your own time. Saving updates your trial availability straight away.
            </DialogDescription>
          </DialogHeader>
          {classDraft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select
                  value={String(classDraft.weekday)}
                  onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, weekday: Number(v) }); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts</Label>
                  <Select
                    value={classDraft.start_time}
                    onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, start_time: v }); }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Length</Label>
                  <Select
                    value={String(classDraft.duration_minutes)}
                    onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, duration_minutes: Number(v) }); }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d < 60 ? `${d} min` : `${d / 60} hr${d > 60 ? "s" : ""}`.replace(".5", "½")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                {DAY_NAMES[classDraft.weekday]}{" "}
                <strong>{formatClassRange(classDraft.start_time, classDraft.duration_minutes)}</strong>
                {crossesMidnight(classDraft.start_time, classDraft.duration_minutes) && (
                  <span className="block text-xs text-muted-foreground pt-1">
                    This class runs past midnight. It stays one class — you don't need to add a second one.
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="class-start-date">Start date</Label>
                <Input
                  id="class-start-date" type="date"
                  value={classDraft.effective_from}
                  onChange={e => setClassDraft({ ...classDraft, effective_from: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Catch up will not suggest any date before this. Set it to when this class
                  actually started — in the past for one that has been running a while, or in
                  the future for a schedule change that has not started yet.
                </p>
              </div>

              {conflicts.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    This time is already booked for a trial
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conflicts.length === 1
                      ? "A student has booked a trial that this class would run over."
                      : `${conflicts.length} students have booked trials that this class would run over.`}{" "}
                    Reschedule or cancel {conflicts.length === 1 ? "it" : "them"} in the Trials tab first —
                    so the student is told — then move the class.
                  </p>
                  <ul className="space-y-1">
                    {conflicts.slice(0, 6).map(c => (
                      <li key={c.booking_id} className="text-xs">
                        <strong>{formatConflict(c)}</strong> — {c.booked_name}{" "}
                        <span className="text-muted-foreground">({c.booked_email})</span>
                      </li>
                    ))}
                    {conflicts.length > 6 && (
                      <li className="text-xs text-muted-foreground">
                        …and {conflicts.length - 6} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeClassDialog}>Cancel</Button>
            <Button onClick={saveClass} disabled={upsertClass.isPending || checking || conflicts.length > 0}>
              {(upsertClass.isPending || checking) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {conflicts.length > 0 ? "Resolve the trial first" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Bundle dialog */}
      <Dialog open={!!bundleDraft} onOpenChange={o => !o && setBundleDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a bundle</DialogTitle>
            <DialogDescription>
              What they bought. Any bundle they are on now is closed off and kept as history.
            </DialogDescription>
          </DialogHeader>
          {bundleDraft && (() => {
            const student = students.find(st => st.id === bundleDraft.student_id);
            const options = getBundleOptions(student?.country);
            const classes = Number(bundleDraft.total_classes);
            const price = Number(bundleDraft.total_price);
            const perClass = classes > 0 && Number.isFinite(price)
              ? pricePerClass(price, classes, bundleDraft.currency || "USD")
              : null;

            return (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Bundle</Label>
                  <Select
                    value={bundleDraft.mode === "catalog" ? bundleDraft.catalog_key ?? "custom" : "custom"}
                    onValueChange={v => {
                      if (v === "custom") {
                        setBundleDraft({ ...bundleDraft, mode: "custom", catalog_key: null });
                        return;
                      }
                      const opt = options.find(o => o.key === v);
                      if (opt) applyCatalogOption(opt);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {options.map(o => (
                        <SelectItem key={o.key} value={o.key}>
                          {o.label} · {formatMoney(o.price, o.currency)}
                          {o.isLocal ? "" : " (USD list price)"}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                  {options.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {student?.country
                        ? "No catalogue prices for that country — enter the bundle by hand."
                        : "Set the student's country to see catalogue prices, or enter it by hand."}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bundle-classes">Classes</Label>
                    <Input
                      id="bundle-classes" inputMode="numeric" value={bundleDraft.total_classes}
                      onChange={e => editBundleField({ total_classes: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="16"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bundle-price">Total price</Label>
                    <Input
                      id="bundle-price" inputMode="decimal" value={bundleDraft.total_price}
                      onChange={e => editBundleField({ total_price: e.target.value.replace(/[^0-9.]/g, "") })}
                      placeholder="6400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select
                      value={bundleDraft.currency}
                      onValueChange={v => editBundleField({ currency: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencyChoicesFor(student?.country, bundleDraft.currency).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bundle-label">Name it (optional)</Label>
                  <Input
                    id="bundle-label" value={bundleDraft.label}
                    onChange={e => setBundleDraft({ ...bundleDraft, label: e.target.value })}
                    placeholder="16 English classes"
                  />
                </div>

                {perClass && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <strong>{perClass}</strong>
                    <span className="block text-xs text-muted-foreground pt-0.5">
                      Recorded exactly as paid — never converted to another currency.
                      {bundleDraft.mode === "custom" && bundleDraft.catalog_key === null && " Saved as a custom bundle."}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDraft(null)}>Cancel</Button>
            <Button onClick={saveBundle} disabled={addBundle.isPending}>
              {addBundle.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Catch-up dialog */}
      <Dialog open={!!catchUpFor} onOpenChange={o => !o && setCatchUpFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Catch up · {catchUpFor?.full_name}</DialogTitle>
            <DialogDescription>
              Tick the classes that happened. Unticked ones are recorded as not held and
              use no credit.
            </DialogDescription>
          </DialogHeader>
          {catchUpFor && (() => {
            const pending = (expectedByStudent.get(catchUpFor.id) ?? []).filter(o => !o.confirmed);
            const bundle = balances?.get(catchUpFor.id);
            const picked = pending.filter(o => catchUpPicked.has(`${o.session_date}|${o.start_time}`)).length;

            if (pending.length === 0) {
              return <p className="text-sm text-muted-foreground py-2">Nothing waiting — every class in the last {CATCH_UP_DAYS} days is dealt with.</p>;
            }

            return (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {pending.map(o => {
                    const key = `${o.session_date}|${o.start_time}`;
                    const on = catchUpPicked.has(key);
                    return (
                      <button
                        key={key} type="button"
                        onClick={() => setCatchUpPicked(prev => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key); else next.add(key);
                          return next;
                        })}
                        className={`w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          on ? "border-primary/40 bg-primary/5" : "bg-muted/30"
                        }`}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          on ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span className="text-muted-foreground w-24">{formatSessionDate(o.session_date)}</span>
                        <span>{formatClassRange(o.start_time, o.duration_minutes)}</span>
                        {!on && <span className="ml-auto text-xs text-muted-foreground">did not happen</span>}
                      </button>
                    );
                  })}
                </div>

                {bundle && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <strong>{picked}</strong> selected → {picked} {picked === 1 ? "credit" : "credits"}.{" "}
                    Balance {bundle.remaining_classes} → <strong>{bundle.remaining_classes - picked}</strong>.
                    {bundle.remaining_classes - picked < 0 && (
                      <span className="block text-xs text-destructive pt-0.5">
                        This takes them past the end of the bundle. That is allowed — the classes happened.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatchUpFor(null)}>Cancel</Button>
            <Button
              onClick={saveCatchUp}
              disabled={confirmSessions.isPending || (expectedByStudent.get(catchUpFor?.id ?? "") ?? []).filter(o => !o.confirmed).length === 0}
            >
              {confirmSessions.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyFor} onOpenChange={o => !o && setHistoryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>History · {historyFor?.full_name}</DialogTitle>
            <DialogDescription>
              Every class ever confirmed, and the bundles they ran against. Undo puts the credit back.
            </DialogDescription>
          </DialogHeader>
          {historyFor && (
            <StudentHistory
              studentId={historyFor.id}
              undoing={unconfirmSession.isPending}
              onUndo={undoConfirm}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryFor(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the student and all their classes. Those times immediately
              become bookable for trials. To keep the schedule but free the time,
              set the student to Paused instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeStudent}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MyStudentsManager;
