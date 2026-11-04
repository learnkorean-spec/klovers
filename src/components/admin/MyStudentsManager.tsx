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
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TelegramClaimBadge, TelegramQuickConfirmButton } from "@/components/admin/TelegramClaimBadge";
import {
  Plus, Pencil, Trash2, Clock, Loader2, GraduationCap, AlertTriangle,
  Video, Copy, Check, CalendarCheck, X, Wallet, History, Ban, ShieldAlert, Users,
} from "lucide-react";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";
import {
  useMyStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  useUpsertClass, useDeleteClass, checkClassConflicts, type ClassConflict,
  useBundleBalances, useRecentSessions, useAllStudentSessions, useStudentBundles,
  useAllBundles, useBundleEdits, useAddBundle, useUpdateBundle, useDeleteBundle,
  useDeletedBundles, useConfirmSessions, useUnconfirmSession, useBundleSessionSummaries,
  useGroupStudents, type GroupStudent,
  type ConfirmSessionInput,
} from "@/hooks/admin/useMyStudents";
import {
  DAY_NAMES, STATUS_LABEL, STUDENT_STATUSES, STUDENT_SUBJECTS, SUBJECT_LABEL,
  buildExpectedSessions, crossesMidnight, formatClassRange, formatMoney,
  formatSessionDate, formatWeeklySummary, localDateKey, pricePerClass, weeklyMinutes,
  resolveBundleForDate, bundleIdentityLine, type BundleTone,
  type BundleBalance, type ExpectedSession, type MyStudentWithClasses,
  type StudentBundle, type StudentClassSchedule, type StudentStatus, type StudentSubject,
} from "@/types/students";
import {
  getBundleOptions, getCurrencyForCountry, currencyChoicesFor, type BundleOption,
} from "@/lib/stripePrices";
import { getLevelShortLabel } from "@/constants/levels";
import { CountryCombobox } from "@/components/admin/CountryCombobox";
import { TelegramLinkButton } from "@/components/admin/TelegramLinkButton";
import { useTelegramLinks } from "@/hooks/admin/useTelegramLinks";

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
 * The Catch up dialog's default RENDER window, not an expiry. An unconfirmed
 * class never ages out of the queue -- everything back to effective_from stays
 * reachable and counted -- this only controls how much of it is shown before
 * she has to ask for the rest, so the common case (a recent day missed) stays
 * a short list instead of a scroll through months of history.
 */
const CATCH_UP_RECENT_DAYS = 60;

type BundleDraft = {
  /** Present only when editing an existing bundle. */
  id?: string;
  student_id: string;
  mode: "catalog" | "custom";
  catalog_key: string | null;
  label: string;
  /** Strings while typing; parsed on save. */
  total_classes: string;
  total_price: string;
  currency: string;
  purchased_on: string;
  coverage_start: string;
};

type VoidDraft = { bundle: StudentBundle; reason: string };

/**
 * "Bundle 1", "Bundle 2"... per student, oldest first. Display-only, derived
 * from coverage_start every render -- so Re can see at a glance how many
 * times a student has re-purchased, without a column that could drift out of
 * step with the ordering it is meant to describe.
 */
function numberBundles(bundles: StudentBundle[]): Map<string, number> {
  const ordered = [...bundles].sort((a, b) =>
    a.coverage_start.localeCompare(b.coverage_start) || a.purchased_on.localeCompare(b.purchased_on));
  return new Map(ordered.map((b, i) => [b.id, i + 1]));
}

/**
 * Which other bundles change number if `deletingId` is removed, oldest
 * shifted first -- so the delete-bundle confirmation can name each one, the
 * same way it names everything else that click destroys. Numbers are derived
 * from coverage order (numberBundles), so deleting anything but the newest
 * bundle shifts every one after it down by one; this is empty whenever the
 * bundle being deleted is already the last in coverage order.
 */
function bundlesRenumberedByDeleting(
  bundles: StudentBundle[], deletingId: string,
): Array<{ before: number; after: number }> {
  const before = numberBundles(bundles);
  const after = numberBundles(bundles.filter(b => b.id !== deletingId));
  const changed: Array<{ before: number; after: number }> = [];
  for (const b of bundles) {
    if (b.id === deletingId) continue;
    const b4 = before.get(b.id)!;
    const af = after.get(b.id)!;
    if (b4 !== af) changed.push({ before: b4, after: af });
  }
  return changed.sort((a, b) => a.before - b.before);
}

/**
 * The bundle to open when a session has no bundle covering its date at all --
 * the earliest one, since pulling ITS coverage_start further back is the fix
 * that would actually reach the date. A voided bundle is skipped for the same
 * reason resolveBundleForDate skips it: it was voided because it was wrong,
 * so it is never the thing to widen. Falls back to the plain earliest if
 * every bundle happens to be voided, so the fix is never a dead end.
 */
function earliestBundleToFix(bundles: StudentBundle[]): StudentBundle | null {
  if (bundles.length === 0) return null;
  const candidates = bundles.filter(b => b.status !== "cancelled");
  const pool = candidates.length > 0 ? candidates : bundles;
  return [...pool].sort((a, b) => a.coverage_start.localeCompare(b.coverage_start))[0];
}

/** "Start date filled in automatically — check it": the marker an auto-filled
 * coverage_start must always carry until Re has actually reviewed it. */
const UnreviewedBadge = ({ className = "" }: { className?: string }) => (
  <Badge variant="outline" className={`text-[10px] border-amber-400 text-amber-700 ${className}`}>
    <ShieldAlert className="h-3 w-3 mr-1" /> start date not reviewed
  </Badge>
);

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
        className="truncate max-w-[22rem] text-foreground hover:underline"
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
 * Same shared fact (bundleTone), rendered once instead of per surface. `fill`
 * drives each bundle's slim consumption bar, `text` its identity line — the
 * two are allowed to read differently for the same tone (active's bar is
 * green, its line is not) because they answer different questions: the bar
 * says how much of the bundle is used up, the line says how the bundle's
 * story ended. Neither call site hardcodes a colour of its own; both always
 * come from here, off the same tone, so a bar can never show green while its
 * line disagrees about why.
 */
const BUNDLE_TONE_CLASSES: Record<BundleTone, { fill: string; text: string }> = {
  clean: { fill: "bg-green-500/70", text: "text-green-700" },
  unused: { fill: "bg-muted-foreground/30", text: "text-muted-foreground" },
  // Exactly D's existing negative-balance tokens (see the `out` branch below)
  // — never a second red on the same card.
  negative: { fill: "bg-destructive", text: "text-destructive" },
  // The active identity line stays quiet (never green, even at 100% used —
  // the bundle has not finished). Its consumption bar still fills in the same
  // green as a clean finish: it is answering "how full", not "how it ended".
  active: { fill: "bg-green-500/70", text: "text-muted-foreground" },
};

const COMPLETED_BUNDLES_SHOWN = 2;

/** The active bundle for a student, if any — the one row every other bundle
 * status lookup on this card ultimately wants. */
function activeBundleFor(bundles: StudentBundle[]): StudentBundle | undefined {
  return bundles.find(b => b.status === "active");
}

type CompletedBundleSummary = {
  bundle: StudentBundle;
  bundleNumber: number;
  used: number;
  lastSessionDate: string | null;
};

/**
 * A student's completed bundles, most recent first — the history the card
 * shows so "has this student finished a bundle before, and did it end
 * cleanly" no longer costs a click into Manage bundles to answer. Cancelled
 * bundles are a different question (a mistake, not a finished purchase) and
 * already have their own marker there, so they are excluded here.
 */
function completedBundleSummaries(
  bundles: StudentBundle[],
  sessionSummaries: Map<string, { used: number; lastDate: string | null }>,
): CompletedBundleSummary[] {
  const numbers = numberBundles(bundles);
  return bundles
    .filter(b => b.status === "completed")
    .map(b => {
      const s = sessionSummaries.get(b.id) ?? { used: 0, lastDate: null };
      return { bundle: b, bundleNumber: numbers.get(b.id)!, used: s.used, lastSessionDate: s.lastDate };
    })
    .sort((a, b) => b.bundle.coverage_start.localeCompare(a.bundle.coverage_start));
}

/**
 * Slim and static on purpose — a third the active bar's height, no percentage,
 * no animation — so the active bundle's own full-height bar stays the only
 * thing on the card that reads as live. Each unit is built by
 * bundleIdentityLine, the same function the active bundle's own identity line
 * in BundleBox uses — one place decides the wording, colour, and fill for
 * every bundle on this card, active or completed. The line sits above its
 * bar, matching the active bundle's own line-then-bar order, so the card
 * reads as one repeating unit rather than two different layouts.
 */
const CompletedBundleLines = ({
  completed, onManageBundles,
}: {
  completed: CompletedBundleSummary[];
  onManageBundles: () => void;
}) => {
  if (completed.length === 0) return null;

  const shown = completed.slice(0, COMPLETED_BUNDLES_SHOWN);
  const extra = completed.length - shown.length;

  return (
    <div className="space-y-1.5 pt-0.5">
      {shown.map(({ bundle, bundleNumber, used, lastSessionDate }) => {
        const { tone, text, fillPct } = bundleIdentityLine(bundle, bundleNumber, used, lastSessionDate);
        const classes = BUNDLE_TONE_CLASSES[tone];
        return (
          <div key={bundle.id} className="space-y-0.5">
            <p dir="ltr" className={`text-[11px] ${classes.text}`}>{text}</p>
            <div className="h-[3px] rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${classes.fill}`} style={{ width: `${fillPct}%` }} />
            </div>
          </div>
        );
      })}
      {extra > 0 && (
        <button
          type="button"
          onClick={onManageBundles}
          className="rounded-sm text-left text-[11px] text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          +{extra} more completed — see all in Manage bundles
        </button>
      )}
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
  balance, activeBundle, bundleNumber, bundleCount, unreviewed, completedBundles,
  onAdd, onCatchUp, onManageBundles, onHistory, unconfirmedCount,
}: {
  balance: BundleBalance | undefined;
  /** The active bundle's own row, for bundleIdentityLine -- BundleBalance
   * carries the numbers but not coverage_start/status/label. Undefined only
   * when there is no active bundle, matching `balance`. */
  activeBundle: StudentBundle | undefined;
  /** Undefined only when there is no active bundle, matching `balance`. */
  bundleNumber: number | undefined;
  /** Every bundle this student has ever had, any status -- shown on its own
   * button so "how many times has this student re-purchased" is answered
   * without opening anything. */
  bundleCount: number;
  unreviewed: boolean;
  /** Completed bundles only, most recent first — see completedBundleSummaries. */
  completedBundles: CompletedBundleSummary[];
  onAdd: () => void;
  onCatchUp: () => void;
  onManageBundles: () => void;
  onHistory: () => void;
  unconfirmedCount: number;
}) => {
  if (!balance) {
    return (
      <div className="rounded-md border border-dashed px-3 py-2.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            No bundle — classes are not being counted for this student.
          </span>
          <span className="flex flex-wrap gap-1.5">
            {bundleCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onManageBundles}>
                Manage bundles ({bundleCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Wallet className="h-3.5 w-3.5 mr-1" /> Add bundle
            </Button>
          </span>
        </div>
        <CompletedBundleLines completed={completedBundles} onManageBundles={onManageBundles} />
      </div>
    );
  }

  const { total_classes, used_classes, remaining_classes } = balance;
  const pct = Math.min(100, Math.max(0, (used_classes / Math.max(1, total_classes)) * 100));
  const out = remaining_classes <= 0;
  const low = remaining_classes > 0 && remaining_classes <= 2;
  // activeBundle is only absent if balance and activeBundle fell out of sync
  // for a render or two -- falls back to the old plain wording rather than
  // crash. bundleIdentityLine is the same function CompletedBundleLines
  // uses; this is the one place on the card that draws it for a still-
  // running bundle instead of a finished one.
  const activeLine = activeBundle && bundleNumber != null
    ? bundleIdentityLine(activeBundle, bundleNumber, used_classes, null)
    : null;

  return (
    <div className={`rounded-md border px-3 py-2.5 space-y-2 ${out ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {bundleNumber != null ? `Bundle ${bundleNumber} — ` : ""}{balance.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatMoney(balance.total_price, balance.currency)} ·{" "}
          {pricePerClass(balance.total_price, balance.total_classes, balance.currency)}
        </span>
      </div>

      {(unreviewed || (activeBundle && !activeBundle.paid_on)) && (
        <div className="flex flex-wrap gap-1.5">
          {unreviewed && <UnreviewedBadge />}
          {activeBundle && !activeBundle.paid_on && (
            <Badge variant="outline" className="text-[10px] border-destructive/60 text-destructive">
              <Wallet className="h-3 w-3 mr-1" /> unpaid
            </Badge>
          )}
        </div>
      )}

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all ${out ? "bg-destructive" : low ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          dir="ltr"
          className={`text-xs ${activeLine ? BUNDLE_TONE_CLASSES[activeLine.tone].text : "text-muted-foreground"}`}
        >
          {activeLine ? activeLine.text : `${used_classes} of ${total_classes} used`}
        </span>
        {out ? (
          <Badge dir="ltr" className="bg-destructive text-destructive-foreground">
            {remaining_classes === 0
              ? "0 classes left"
              : `${Math.abs(remaining_classes)} over`}
          </Badge>
        ) : (
          <Badge dir="ltr" variant="outline" className={low ? "border-amber-400 text-amber-700" : ""}>
            {remaining_classes} left
          </Badge>
        )}
      </div>

      {/* The active bundle's own slim consumption bar — same shape and same
          bundleIdentityLine-driven fill/colour as every completed bundle's,
          directly beneath its line, so the card reads as one repeating unit
          instead of two different layouts. The full-height bar above stays
          the primary at-a-glance element; this one only ever answers "how
          much of this bundle is used up". */}
      {activeLine && (
        <div className="h-[3px] rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${BUNDLE_TONE_CLASSES[activeLine.tone].fill}`}
            style={{ width: `${activeLine.fillPct}%` }}
          />
        </div>
      )}

      {out && (
        <p className="text-xs text-destructive">
          Bundle finished. Classes still run and still block trial times — add the next
          bundle when you have agreed it with them.
        </p>
      )}

      {completedBundles.length > 0 && (
        // Hairline divider: without it the completed line below reads as
        // though it belongs to the active bundle above it, which is exactly
        // what Re flagged after PR #116.
        <div className="pt-2 mt-0.5 border-t border-border">
          <CompletedBundleLines completed={completedBundles} onManageBundles={onManageBundles} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <Button variant="outline" size="sm" onClick={onCatchUp}>
          <CalendarCheck className="h-3.5 w-3.5 mr-1" />
          Catch up{unconfirmedCount > 0 ? ` (${unconfirmedCount})` : ""}
        </Button>
        <Button variant="ghost" size="sm" onClick={onManageBundles}>
          Manage bundles ({bundleCount})
        </Button>
        <Button variant="ghost" size="sm" onClick={onHistory}>
          <History className="h-3.5 w-3.5 mr-1" /> History
        </Button>
        {/* Kept on the card alongside Manage bundles, not folded in, while
            historical entry is still happening -- moving this a click deeper
            costs a repeated cost for a one-time tidiness win. Revisit once
            the backfill is done; it also lives inside Manage bundles now. */}
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Wallet className="h-3.5 w-3.5 mr-1" /> New bundle
        </Button>
      </div>
    </div>
  );
};


/** The old→new diffs for one bundle, fetched only once expanded. */
const BundleEditHistory = ({ bundleId }: { bundleId: string }) => {
  const [open, setOpen] = useState(false);
  const { data: edits = [] } = useBundleEdits(open ? bundleId : null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-sm text-[11px] text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        View edit history
      </button>
    );
  }

  if (edits.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Never edited since it was added.</p>;
  }

  return (
    <div className="space-y-1">
      {edits.map(e => (
        <div key={e.id} className="text-[11px] text-muted-foreground">
          {new Date(e.edited_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {" — "}
          {Object.entries(e.changes).map(([field, { old, new: next }], i) => (
            <span key={field}>
              {i > 0 && ", "}
              <strong>{field}</strong>: {String(old ?? "—")} → {String(next ?? "—")}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Bundles deleted for this student -- lazily fetched, same convention as
 * BundleEditHistory above. Deliberately student-level rather than per-bundle:
 * a deleted bundle has no row left to attach a per-bundle history control to,
 * so this reads from admin_audit_log instead of student_bundle_edits (see
 * useDeleteBundle for why that table can't hold it durably).
 */
const DeletedBundleHistory = ({ studentId }: { studentId: string }) => {
  const [open, setOpen] = useState(false);
  const { data: deletions = [] } = useDeletedBundles(open ? studentId : null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-sm text-[11px] text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        View deleted bundles
      </button>
    );
  }

  if (deletions.length === 0) {
    return <p className="text-[11px] text-muted-foreground">No bundles deleted.</p>;
  }

  return (
    <div className="space-y-1">
      {deletions.map(d => (
        <p key={d.id} dir="ltr" className="text-[11px] text-muted-foreground">
          Bundle {d.snapshot.bundle_number} · {d.snapshot.label} · {d.snapshot.total_classes} classes{" "}
          · {formatMoney(d.snapshot.total_price, d.snapshot.currency)} · from {formatSessionDate(d.snapshot.coverage_start)}
          {" — deleted "}
          {new Date(d.deletedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {d.snapshot.voided_reason && ` · voided: ${d.snapshot.voided_reason}`}
        </p>
      ))}
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
/**
 * Which bundles a student has, how many, and their state -- the single place
 * that answers "how many times has this student re-purchased" and manages
 * that history. Split out from what used to be one combined History dialog:
 * Re went looking for Edit/Delete/Void on the card, where every other bundle
 * action already lives, not one dialog deeper. This is that surface.
 */
const BundleManager = ({
  studentId, onAddBundle, onEditBundle, onDuplicateBundle, onVoidBundle, onDeleteBundle, deletingBundleId,
}: {
  studentId: string;
  onAddBundle: () => void;
  onEditBundle: (b: StudentBundle) => void;
  onDuplicateBundle: (b: StudentBundle) => void;
  onVoidBundle: (b: StudentBundle) => void;
  onDeleteBundle: (b: StudentBundle) => void;
  deletingBundleId: string | null;
}) => {
  const { data: sessions = [], isLoading } = useAllStudentSessions(studentId);
  const { data: bundles = [] } = useStudentBundles(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading bundles…
      </div>
    );
  }

  // Used/remaining computed here for EVERY bundle, not only the active one --
  // this is the whole point: a negative balance on a superseded bundle used
  // to be invisible outside a direct query. Counted sessions only; a
  // not-held row never drew a credit from the bundle it is attached to.
  const usedByBundle = new Map<string, number>();
  for (const s of sessions) {
    if (!s.counted) continue;
    usedByBundle.set(s.bundle_id, (usedByBundle.get(s.bundle_id) ?? 0) + 1);
  }
  const bundleNumbers = numberBundles(bundles);

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={onAddBundle}>
        <Wallet className="h-3.5 w-3.5 mr-1" /> New bundle
      </Button>

      {bundles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2" role="status">No bundles yet.</p>
      ) : (
        <div className="space-y-1">
          {bundles.map(b => {
            const used = usedByBundle.get(b.id) ?? 0;
            const remaining = b.total_classes - used;
            const sessionCount = sessions.filter(s => s.bundle_id === b.id).length;
            return (
              <div key={b.id} className="rounded-md bg-muted/30 px-3 py-2 text-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  {/* dir="ltr" on the OUTER span, not just the price/count
                      fragment -- an isolated inner run only protects itself;
                      the un-isolated "Bundle N — label" text around it still
                      reorders as a whole against that island under an RTL
                      ancestor, which is exactly what an earlier version of
                      this fix missed. */}
                  <span dir="ltr">
                    Bundle {bundleNumbers.get(b.id)} — {b.label}
                    <span className="text-muted-foreground"> · {formatMoney(b.total_price, b.currency)} · {b.total_classes} classes</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {b.status === "active" ? "Active" : b.status === "completed" ? "Finished" : "Cancelled"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {remaining < 0 ? (
                    <Badge dir="ltr" className="bg-destructive text-destructive-foreground text-[10px]">
                      {Math.abs(remaining)} over
                    </Badge>
                  ) : (
                    <span dir="ltr" className="text-[11px] text-muted-foreground">{remaining} left ({used} used)</span>
                  )}
                  {b.coverage_start_confirmed_at === null && <UnreviewedBadge />}
                  {b.status === "cancelled" && b.voided_reason && (
                    <span className="text-[11px] text-muted-foreground">Voided: {b.voided_reason}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => onEditBundle(b)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  {/* Same package again, new dates: the add flow closes the previous bundle. */}
                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => onDuplicateBundle(b)}>
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  {b.status === "cancelled" ? (
                    // Delete only ever appears once a bundle is voided AND
                    // carries zero sessions of any kind -- counted or not,
                    // any outcome. The FK (ON DELETE RESTRICT on
                    // student_class_sessions.bundle_id) is the real guard;
                    // this is only the courtesy of never showing a control
                    // that would just bounce off it. A greyed-out button
                    // would be worse than no button, so a cancelled bundle
                    // that still has sessions gets a plain sentence instead.
                    sessionCount === 0 ? (
                      <Button
                        variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-destructive"
                        disabled={deletingBundleId === b.id}
                        onClick={() => onDeleteBundle(b)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Has <span dir="ltr">{sessionCount} class{sessionCount === 1 ? "" : "es"}</span> recorded — cannot be deleted.
                      </span>
                    )
                  ) : (
                    // Never a direct delete for an active or completed bundle,
                    // regardless of session count -- voiding is the only path
                    // out, and only a voided, empty bundle can go further.
                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-destructive" onClick={() => onVoidBundle(b)}>
                      <Ban className="h-3 w-3 mr-1" /> Void
                    </Button>
                  )}
                  <BundleEditHistory bundleId={b.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="pt-1">
        <DeletedBundleHistory studentId={studentId} />
      </div>
    </div>
  );
};

/** The class-by-class confirmed-session ledger only -- bundles live in BundleManager now. */
const SessionLedger = ({
  studentId, onUndo, undoing,
}: {
  studentId: string;
  onUndo: (sessionId: string) => void;
  undoing: boolean;
}) => {
  const { data: sessions = [], isLoading } = useAllStudentSessions(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    );
  }

  return (
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
  );
};

/** Weekday (0 = Sunday) and "HH:MM" right now in the admin's timezone. */
function nowInAdminTz(): { weekday: number; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ADMIN_TIMEZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { weekday: Math.max(0, days.indexOf(get("weekday"))), hhmm: `${get("hour").replace("24", "00")}:${get("minute")}` };
}

/** The student's next weekly class from now, with how many days away it is. */
function nextClassOf(classes: StudentClassSchedule[], now = nowInAdminTz()) {
  let best: { cls: StudentClassSchedule; daysAway: number } | null = null;
  for (const cls of classes) {
    let daysAway = (cls.weekday - now.weekday + 7) % 7;
    if (daysAway === 0 && trimSeconds(cls.start_time) <= now.hhmm) daysAway = 7;
    if (!best || daysAway < best.daysAway ||
        (daysAway === best.daysAway && cls.start_time < best.cls.start_time)) {
      best = { cls, daysAway };
    }
  }
  return best;
}

const whenLabel = (daysAway: number, weekday: number) =>
  daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : DAY_NAMES[weekday];

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";

type StudentFilter = "all" | "unpaid" | "low" | "confirm";
// Private students (teacher_students) and group students (pkg_group_members)
// are two different data models — see useGroupStudents' comment. This filter
// is what "both must be together and just a filter group and private" means:
// one page, one search box, one switch between the two kinds. "all" shows both.
type StudentKind = "all" | "private" | "group";

const MyStudentsManager = () => {
  const { data: students = [], isLoading } = useMyStudents();
  const { data: groupStudents = [], isLoading: isGroupLoading } = useGroupStudents();
  const { data: telegramLinks } = useTelegramLinks();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const upsertClass = useUpsertClass();
  const deleteClass = useDeleteClass();

  // The confirmed-sessions fetch has to reach back at least as far as the
  // earliest effective_from among every student's classes, or a confirmation
  // older than that boundary would not be fetched and its occurrence would
  // wrongly look unconfirmed. Derived from students, not a fixed cutoff, so
  // correcting a class's start date widens this the moment it is saved.
  const since = useMemo(() => {
    const dates = students.flatMap(s => s.classes.map(c => c.effective_from)).filter(Boolean);
    return dates.length ? dates.reduce((min, d) => (d < min ? d : min)) : localDateKey(new Date(), ADMIN_TIMEZONE);
  }, [students]);
  const { data: balances } = useBundleBalances();
  const { data: recentSessions = [] } = useRecentSessions(since);
  // Every bundle, any status -- resolveBundleForDate needs the whole history
  // per student, not just whichever one is currently active.
  const { data: allBundles } = useAllBundles();
  const { data: sessionSummaries } = useBundleSessionSummaries();
  const addBundle = useAddBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();
  const confirmSessions = useConfirmSessions();
  const unconfirmSession = useUnconfirmSession();

  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null);
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null);
  // Off by default: a class added later has a genuinely later start, so this
  // has to be an explicit choice each time, not a remembered preference.
  const [applyDateToAll, setApplyDateToAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MyStudentWithClasses | null>(null);
  // Trial bookings the pending class time would run over. Non-empty blocks the
  // save: Re resolves the trial first, then moves the class.
  const [conflicts, setConflicts] = useState<ClassConflict[]>([]);
  const [checking, setChecking] = useState(false);
  const [bundleDraft, setBundleDraft] = useState<BundleDraft | null>(null);
  const [voidDraft, setVoidDraft] = useState<VoidDraft | null>(null);
  const [confirmDeleteBundle, setConfirmDeleteBundle] = useState<StudentBundle | null>(null);
  const [catchUpFor, setCatchUpFor] = useState<MyStudentWithClasses | null>(null);
  const [catchUpPicked, setCatchUpPicked] = useState<Set<string>>(new Set());
  // Off by default each time the dialog opens: the recent window is enough for
  // the common case, and a large backlog is something she chooses to open, not
  // something dumped on her.
  const [catchUpShowOlder, setCatchUpShowOlder] = useState(false);
  const [historyFor, setHistoryFor] = useState<MyStudentWithClasses | null>(null);
  const [manageBundlesFor, setManageBundlesFor] = useState<MyStudentWithClasses | null>(null);
  const [query, setQuery] = useState("");
  const [showAllToConfirm, setShowAllToConfirm] = useState(false);
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [kind, setKind] = useState<StudentKind>("all");

  const totals = useMemo(() => {
    const active = students.filter(s => s.status === "active");
    const mins = active.reduce((sum, s) => sum + weeklyMinutes(s.classes), 0);
    return { active: active.length, hours: (mins / 60).toFixed(1) };
  }, [students]);

  /**
   * Private students who are actually taught TOGETHER, in the same session —
   * same meeting link, same weekday/time/length — even though each has their
   * own teacher_students row (and their own bundle/billing). Naira and Renad
   * Elsenduony are the example that prompted this: two separate private-student
   * rows that share one Sunday 22:30 Meet link. Nothing in the data model marks
   * this explicitly, so it's derived here from the match rather than stored —
   * purely a display grouping, it changes no billing or scheduling logic.
   */
  const classmatesByStudent = useMemo(() => {
    const map = new Map<string, string[]>();
    const active = students.filter(s => s.status === "active" && s.meeting_url);
    for (const a of active) {
      const mates: string[] = [];
      for (const b of active) {
        if (a.id === b.id || a.meeting_url !== b.meeting_url) continue;
        const shareClass = a.classes.some(ca =>
          b.classes.some(cb =>
            ca.weekday === cb.weekday &&
            trimSeconds(ca.start_time) === trimSeconds(cb.start_time) &&
            ca.duration_minutes === cb.duration_minutes,
          ));
        if (shareClass) mates.push(b.full_name);
      }
      if (mates.length) map.set(a.id, mates);
    }
    return map;
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
        { timeZone: ADMIN_TIMEZONE },
      ));
    }
    return map;
  }, [students, recentSessions]);

  /**
   * The confirm strip: classes that have happened and not been dealt with.
   * A student with no bundle at all is skipped — there is nothing to draw a
   * credit from, and nagging about it would not help. Each row resolves its
   * OWN bundle by date (resolveBundleForDate), not "whichever bundle is
   * active right now" -- a batch spanning a bundle renewal must charge each
   * date to the bundle actually in force on it.
   */
  const toConfirm = useMemo(() => {
    const rows: Array<{ student: MyStudentWithClasses; occ: ExpectedSession; bundle: StudentBundle | null }> = [];
    for (const student of students) {
      const studentBundles = allBundles?.get(student.id) ?? [];
      if (studentBundles.length === 0) continue;
      for (const occ of expectedByStudent.get(student.id) ?? []) {
        if (!occ.confirmed) rows.push({ student, occ, bundle: resolveBundleForDate(studentBundles, occ.session_date) });
      }
    }
    return rows.sort((a, b) =>
      b.occ.session_date.localeCompare(a.occ.session_date) ||
      b.occ.start_time.localeCompare(a.occ.start_time));
  }, [students, allBundles, expectedByStudent]);

  const unconfirmedCount = (studentId: string) =>
    (expectedByStudent.get(studentId) ?? []).filter(o => !o.confirmed).length;

  /**
   * What each student needs from Re right now, computed once for the card,
   * the summary tiles and the filters, so all three always agree.
   */
  const studentState = useMemo(() => {
    const map = new Map<string, {
      unpaid: boolean; remaining: number | null; low: boolean; out: boolean; pending: number;
      owed: { amount: number; currency: string } | null; needsAction: boolean;
    }>();
    for (const st of students) {
      const active = activeBundleFor(allBundles?.get(st.id) ?? []);
      const bal = balances?.get(st.id);
      const remaining = bal ? bal.remaining_classes : null;
      const unpaid = !!active && !active.paid_on;
      const out = remaining !== null && remaining <= 0;
      const low = remaining !== null && remaining > 0 && remaining <= 2;
      const pending = (expectedByStudent.get(st.id) ?? []).filter(o => !o.confirmed).length;
      map.set(st.id, {
        unpaid, remaining, low, out, pending,
        owed: unpaid && active ? { amount: Number(active.total_price) || 0, currency: active.currency || "EGP" } : null,
        needsAction: unpaid || out || low || (pending > 0 && (allBundles?.get(st.id)?.length ?? 0) > 0),
      });
    }
    return map;
  }, [students, allBundles, balances, expectedByStudent]);

  const summary = useMemo(() => {
    const owedByCurrency = new Map<string, number>();
    let unpaid = 0, low = 0;
    for (const st of students) {
      const x = studentState.get(st.id);
      if (!x) continue;
      if (x.owed) { unpaid++; owedByCurrency.set(x.owed.currency, (owedByCurrency.get(x.owed.currency) ?? 0) + x.owed.amount); }
      if (x.low || x.out) low++;
    }
    const owed = [...owedByCurrency.entries()].map(([cur, amt]) => formatMoney(amt, cur)).join(" + ");
    return { unpaid, low, owed };
  }, [students, studentState]);

  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter(st => !q || st.full_name.toLowerCase().includes(q) || (st.country ?? "").toLowerCase().includes(q))
      .filter(st => {
        // "Group" here means taught WITH someone else (shares a session with
        // another private student, per classmatesByStudent) — a private
        // billing relationship, but not a solo 1:1. "Private" is everyone
        // else: a true 1-on-1. "All" ignores this split entirely.
        const grouped = (classmatesByStudent.get(st.id)?.length ?? 0) > 0;
        if (kind === "group") return grouped;
        if (kind === "private") return !grouped;
        return true;
      })
      .filter(st => {
        const x = studentState.get(st.id);
        if (!x || filter === "all") return true;
        if (filter === "unpaid") return x.unpaid;
        if (filter === "low") return x.low || x.out;
        return x.pending > 0;
      })
      // Students who need something from Re come first; then by name.
      .sort((a, b) => {
        const na = studentState.get(a.id)?.needsAction ? 0 : 1;
        const nb = studentState.get(b.id)?.needsAction ? 0 : 1;
        return na - nb || a.full_name.localeCompare(b.full_name);
      });
  }, [students, studentState, query, filter, kind, classmatesByStudent]);

  // Group students aren't touched by the private filter chips (unpaid/low/
  // confirm are bundle concepts group students don't have) — only the kind
  // switch and the shared search box apply to them.
  const visibleGroupStudents = useMemo(() => {
    if (kind === "private") return [];
    const q = query.trim().toLowerCase();
    return groupStudents.filter(
      gs => !q || gs.full_name.toLowerCase().includes(q) || gs.email.toLowerCase().includes(q),
    );
  }, [groupStudents, query, kind]);

  const openStudentEdit = (student: MyStudentWithClasses) => setStudentDraft({
    id: student.id,
    full_name: student.full_name,
    subject: student.subject,
    status: student.status,
    note: student.note ?? "",
    meeting_url: student.meeting_url ?? "",
    country: student.country ?? "",
    currency: student.currency ?? "",
  });

  /**
   * Counted sessions per bundle, from the same recentSessions fetch that
   * covers every student's full confirm window -- used only to word the
   * "N left" toasts after a confirm; not the source of truth for balance
   * (get_student_bundle_balances is, for the active bundle's own card).
   */
  const usedByBundle = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of recentSessions) {
      if (!s.counted) continue;
      map.set(s.bundle_id, (map.get(s.bundle_id) ?? 0) + 1);
    }
    return map;
  }, [recentSessions]);

  /**
   * The Catch up dialog's full queue for whoever it is open for, split into
   * what is rendered by default (the last CATCH_UP_RECENT_DAYS) and what is
   * held back behind "show older". `shown` is the single source of truth for
   * both what the dialog renders AND what saveCatchUp writes -- an item that
   * was never shown must never be written as not-held, so the write path has
   * to use exactly the same set the render path used, not the full queue.
   */
  const catchUpQueue = useMemo(() => {
    const pending = (expectedByStudent.get(catchUpFor?.id ?? "") ?? []).filter(o => !o.confirmed);
    const cutoff = localDateKey(new Date(Date.now() - CATCH_UP_RECENT_DAYS * 86400000), ADMIN_TIMEZONE);
    const visible = pending.filter(o => o.session_date >= cutoff);
    const older = pending.filter(o => o.session_date < cutoff);
    const shown = catchUpShowOlder ? pending : visible;
    return { pending, visible, older, shown };
  }, [catchUpFor, expectedByStudent, catchUpShowOlder]);

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

      // Applying to the rest of the student's classes only ever touches
      // effective_from -- their own weekday/time/duration are untouched, so
      // this skips checkClassConflicts, which exists for time-slot changes.
      let otherCount = 0;
      if (applyDateToAll) {
        const student = students.find(s => s.id === classDraft.student_id);
        const others = (student?.classes ?? []).filter(c => c.id !== classDraft.id);
        otherCount = others.length;
        for (const c of others) {
          await upsertClass.mutateAsync({
            id: c.id,
            student_id: classDraft.student_id,
            weekday: c.weekday,
            start_time: trimSeconds(c.start_time),
            duration_minutes: c.duration_minutes,
            effective_from: classDraft.effective_from,
          });
        }
      }

      toast({
        title: classDraft.id ? "Class updated" : "Class added",
        description: otherCount > 0
          ? `Trial availability has been updated to match. Start date applied to ${otherCount} other class${otherCount === 1 ? "" : "es"} too.`
          : "Trial availability has been updated to match.",
      });
      setClassDraft(null);
      setApplyDateToAll(false);
    } catch (e) {
      setChecking(false);
      toast({ title: "Could not save class", description: (e as Error).message, variant: "destructive" });
    }
  };


  // --- credits ---------------------------------------------------------------

  /**
   * One click on the strip. The bundle is resolved BY DATE here so the row
   * stays dumb -- resolveBundleForDate picks whichever of the student's
   * bundles actually covers occ.session_date, not just whichever is active
   * right now.
   */
  const confirmOne = async (studentId: string, occ: ExpectedSession, outcome: "attended" | "cancelled_no_charge") => {
    const bundle = resolveBundleForDate(allBundles?.get(studentId) ?? [], occ.session_date);
    if (!bundle) {
      toast({ title: "No bundle covers this date", description: "Add or fix a bundle's start date before counting this class.", variant: "destructive" });
      return;
    }
    try {
      await confirmSessions.mutateAsync([{
        student_id: studentId,
        bundle_id: bundle.id,
        class_id: occ.class_id,
        session_date: occ.session_date,
        start_time: occ.start_time,
        outcome,
      }]);
      const remaining = bundle.total_classes - (usedByBundle.get(bundle.id) ?? 0) - (outcome === "attended" ? 1 : 0);
      toast({
        title: outcome === "attended" ? "Class counted" : "Marked as not held",
        description: outcome === "attended"
          ? `${remaining} left on ${bundle.label}.`
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
    // Everything shown starts ticked: the common case is "these all happened,
    // I just did not click at the time". Only what is initially visible (the
    // recent window) is pre-ticked -- an older item she has not been shown yet
    // must not already be armed to write off the moment she opens "show older".
    const unconfirmed = (expectedByStudent.get(student.id) ?? []).filter(o => !o.confirmed);
    const cutoff = localDateKey(new Date(Date.now() - CATCH_UP_RECENT_DAYS * 86400000), ADMIN_TIMEZONE);
    const visible = unconfirmed.filter(o => o.session_date >= cutoff);
    setCatchUpPicked(new Set(visible.map(o => `${o.session_date}|${o.start_time}`)));
    setCatchUpShowOlder(false);
    setCatchUpFor(student);
  };

  /** Reveals the rest of the queue, pre-ticked the same way the visible window was. */
  const showOlderInCatchUp = () => {
    setCatchUpPicked(prev => {
      const next = new Set(prev);
      for (const o of catchUpQueue.older) next.add(`${o.session_date}|${o.start_time}`);
      return next;
    });
    setCatchUpShowOlder(true);
  };

  /**
   * Batch confirm. Ticked rows count, unticked rows are recorded as not held so
   * they stop appearing. Both go in one insert, so the database refuses the whole
   * batch if any single day was already confirmed elsewhere.
   *
   * Each row resolves its OWN bundle by date -- a batch can legitimately span
   * a bundle renewal, so this is never "the" bundle for the whole batch. If
   * any shown row cannot resolve to a bundle at all, the WHOLE batch is
   * refused client-side before the insert is attempted, same atomicity the
   * database already gives the rest of this write.
   *
   * Only ever writes catchUpQueue.shown -- the set actually rendered -- never
   * the full queue. An older item behind "show older" that she has not seen
   * must never be silently recorded as not-held; it stays in the queue instead.
   */
  const saveCatchUp = async () => {
    if (!catchUpFor) return;
    const studentBundles = allBundles?.get(catchUpFor.id) ?? [];

    const resolved = catchUpQueue.shown.map(o => ({
      occ: o,
      bundle: resolveBundleForDate(studentBundles, o.session_date),
    }));
    const unresolved = resolved.filter(r => !r.bundle);
    if (unresolved.length > 0) {
      const earliest = unresolved.reduce(
        (min, r) => (r.occ.session_date < min ? r.occ.session_date : min), unresolved[0].occ.session_date,
      );
      toast({
        title: `${unresolved.length} ${unresolved.length === 1 ? "class has" : "classes have"} no bundle covering ${unresolved.length === 1 ? "it" : "them"}`,
        description: `Earliest ${formatSessionDate(earliest)}. Fix a bundle's start date — marked in the list above — before confirming.`,
        variant: "destructive",
      });
      return;
    }

    const rows: ConfirmSessionInput[] = resolved.map(({ occ: o, bundle }) => ({
      student_id: catchUpFor.id,
      bundle_id: bundle!.id,
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
        description: `Recorded for ${catchUpFor.full_name} against ${new Set(rows.map(r => r.bundle_id)).size === 1 ? "their bundle" : "the bundles that covered each date"}.`,
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
    const today = localDateKey(new Date(), ADMIN_TIMEZONE);
    setBundleDraft({
      student_id: student.id,
      mode: "custom",
      catalog_key: null,
      label: "",
      total_classes: "",
      total_price: "",
      currency: student.currency ?? getCurrencyForCountry(student.country) ?? "USD",
      purchased_on: today,
      coverage_start: today,
    });
  };

  /** Edit an existing bundle. Prefilled from the live row, including dates. */
  const openEditBundleDialog = (b: StudentBundle) => {
    setBundleDraft({
      id: b.id,
      student_id: b.student_id,
      mode: b.source,
      catalog_key: b.catalog_key,
      label: b.label,
      total_classes: String(b.total_classes),
      total_price: String(b.total_price),
      currency: b.currency,
      purchased_on: b.purchased_on,
      coverage_start: b.coverage_start,
    });
  };

  /**
   * Same package as an existing bundle, for the next period: label, classes,
   * price, currency and source are copied; dates start today. Saving goes
   * through the add flow, which closes off the previous bundle.
   */
  const openDuplicateBundleDialog = (b: StudentBundle) => {
    const today = localDateKey(new Date(), ADMIN_TIMEZONE);
    setBundleDraft({
      student_id: b.student_id,
      mode: b.source,
      catalog_key: b.catalog_key,
      label: b.label,
      total_classes: String(b.total_classes),
      total_price: String(b.total_price),
      currency: b.currency,
      purchased_on: today,
      coverage_start: today,
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
    if (!bundleDraft.purchased_on || !bundleDraft.coverage_start) {
      toast({ title: "Both dates are required", variant: "destructive" });
      return;
    }

    const payload = {
      student_id: bundleDraft.student_id,
      source: bundleDraft.mode,
      catalog_key: bundleDraft.mode === "catalog" ? bundleDraft.catalog_key : null,
      label: bundleDraft.label.trim() || `${classes} classes`,
      total_classes: classes,
      total_price: price,
      currency: bundleDraft.currency,
      purchased_on: bundleDraft.purchased_on,
      coverage_start: bundleDraft.coverage_start,
    };

    try {
      if (bundleDraft.id) {
        // Saving THIS dialog is what "reviewed" means -- unconditionally,
        // regardless of whether the date's value actually changed, because
        // the field was shown and she chose to save past it either way.
        await updateBundle.mutateAsync({
          id: bundleDraft.id, ...payload,
          coverage_start_confirmed_at: new Date().toISOString(),
        });
        toast({ title: "Bundle updated" });
      } else {
        await addBundle.mutateAsync(payload);
        toast({ title: "Bundle added", description: "Any previous bundle was closed off." });
      }
      setBundleDraft(null);
    } catch (e) {
      toast({ title: "Could not save bundle", description: (e as Error).message, variant: "destructive" });
    }
  };

  const saveVoid = async () => {
    if (!voidDraft) return;
    if (!voidDraft.reason.trim()) {
      toast({ title: "A reason is required to void a bundle", variant: "destructive" });
      return;
    }
    try {
      await updateBundle.mutateAsync({
        id: voidDraft.bundle.id,
        status: "cancelled",
        voided_reason: voidDraft.reason.trim(),
        voided_at: new Date().toISOString(),
      });
      toast({ title: "Bundle voided", description: "It stays in the history, marked with the reason." });
      setVoidDraft(null);
    } catch (e) {
      toast({ title: "Could not void bundle", description: (e as Error).message, variant: "destructive" });
    }
  };

  /**
   * Deletes a cancelled bundle that has zero sessions on it, any status. A
   * bundle with sessions -- or one that is not cancelled at all -- never
   * reaches this: the UI never offers Delete for it. The database's own ON
   * DELETE RESTRICT foreign key is still the real guard if that courtesy is
   * ever wrong; this is the confirm step, not a substitute for it.
   */
  const removeBundle = async () => {
    if (!confirmDeleteBundle) return;
    const bundleNumber =
      numberBundles(allBundles?.get(confirmDeleteBundle.student_id) ?? []).get(confirmDeleteBundle.id)!;
    try {
      const { auditLogged } = await deleteBundle.mutateAsync({ bundle: confirmDeleteBundle, bundleNumber });
      toast({
        title: "Bundle deleted",
        description: auditLogged
          ? undefined
          : "The deletion itself went through, but its audit record could not be saved.",
        variant: auditLogged ? undefined : "destructive",
      });
      setConfirmDeleteBundle(null);
    } catch (e) {
      toast({ title: "Could not delete bundle", description: (e as Error).message, variant: "destructive" });
    }
  };

  const closeClassDialog = () => { setClassDraft(null); setConflicts([]); setApplyDateToAll(false); };

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

  const filterChips: { id: StudentFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: students.length },
    { id: "unpaid", label: "Unpaid", count: summary.unpaid },
    { id: "low", label: "Running low", count: summary.low },
    { id: "confirm", label: "Unconfirmed", count: toConfirm.length },
  ];

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle as="h2" className="flex items-center gap-2 text-xl">
              <GraduationCap className="h-5 w-5" /> My students
            </CardTitle>
            <CardDescription>
              Your private students. Their classes keep that time free of trials. Times are yours
              ({ADMIN_TIMEZONE.replace(/_/g, " ")}).
            </CardDescription>
          </div>
          <Button onClick={() => setStudentDraft(emptyStudent())} className="bg-klovers-yellow text-charcoal hover:bg-klovers-yellow/90">
            <Plus className="h-4 w-4 mr-1" /> Add student
          </Button>
        </div>

        {!isLoading && students.length > 0 && (
          // Each tile is also the filter for what it counts, so the number is
          // never a dead end: one click shows exactly who it means.
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: "all" as StudentFilter, value: String(totals.active), label: "active students", sub: `${totals.hours} teaching hours a week`, tone: "" },
              { id: "unpaid" as StudentFilter, value: String(summary.unpaid), label: summary.unpaid === 1 ? "bundle unpaid" : "bundles unpaid", sub: summary.owed ? `${summary.owed} to collect` : "All paid", tone: summary.unpaid > 0 ? "border-wrong/50 bg-wrong-surface" : "" },
              { id: "confirm" as StudentFilter, value: String(toConfirm.length), label: toConfirm.length === 1 ? "class to confirm" : "classes to confirm", sub: toConfirm.length ? "Mark done or not held" : "Nothing waiting", tone: toConfirm.length > 0 ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "" },
              { id: "low" as StudentFilter, value: String(summary.low), label: "running low", sub: "2 classes or fewer left", tone: summary.low > 0 ? "border-amber-400" : "" },
            ].map(tile => (
              <button
                key={tile.id}
                type="button"
                onClick={() => setFilter(f => (f === tile.id ? "all" : tile.id))}
                aria-pressed={filter === tile.id}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors hover:border-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tile.tone} ${filter === tile.id && tile.id !== "all" ? "ring-2 ring-charcoal dark:ring-foreground" : ""}`}
              >
                <span className="block text-2xl font-bold leading-tight text-foreground tabular-nums">{tile.value}</span>
                <span className="block text-sm font-medium text-foreground">{tile.label}</span>
                <span className="block text-xs text-muted-foreground">{tile.sub}</span>
              </button>
            ))}
          </div>
        )}

        {(!isLoading && students.length > 0) || groupStudents.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find a student"
                aria-label="Find a student by name, country or email"
                className="pl-8 h-9"
              />
            </div>
            {/* Private vs group students are two different data models (see
                useGroupStudents) shown together on one page; this is the
                switch between them, independent of the private-only chips
                below. */}
            <div className="flex gap-1.5" role="group" aria-label="Private or group students">
              {([
                { id: "all" as StudentKind, label: "All" },
                { id: "private" as StudentKind, label: "Private" },
                { id: "group" as StudentKind, label: "Group" },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setKind(opt.id)}
                  aria-pressed={kind === opt.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 h-8 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    kind === opt.id
                      ? "bg-klovers-yellow text-charcoal border-klovers-yellow"
                      : "bg-background text-foreground hover:border-charcoal/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {kind !== "group" && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show students">
                {filterChips.map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFilter(chip.id)}
                    aria-pressed={filter === chip.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      filter === chip.id
                        ? "bg-charcoal text-ivory border-charcoal dark:bg-foreground dark:text-background"
                        : "bg-background text-foreground hover:border-charcoal/40"
                    }`}
                  >
                    {chip.label}
                    {chip.count !== undefined && (
                      <span className={`tabular-nums ${filter === chip.id ? "opacity-80" : "text-muted-foreground"}`}>{chip.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
          </div>
        )}

        {!isLoading && students.length === 0 && groupStudents.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">
            No students yet. Add one and their weekly classes will be kept clear of trials.
          </p>
        )}

        {toConfirm.length > 0 && (filter === "all" || filter === "confirm") && (
          <div className="rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
            {/* A <div>, not a <p>: <Badge> renders a <div>, and a <div> inside
                a <p> is invalid HTML. */}
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarCheck className="h-4 w-4" />
              To confirm
              <Badge className="bg-charcoal text-ivory hover:bg-charcoal">{toConfirm.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your schedule says these happened. Nothing is counted until you mark it.
            </p>
            <div className="space-y-1">
              {toConfirm.slice(0, showAllToConfirm ? toConfirm.length : 5).map(({ student, occ, bundle }) => (
                <div
                  key={`${student.id}|${occ.session_date}|${occ.start_time}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground w-24">{formatSessionDate(occ.session_date)}</span>
                    <span className="font-medium">{student.full_name}</span>
                    <span className="text-muted-foreground">
                      {formatClassRange(occ.start_time, occ.duration_minutes)}
                    </span>
                    {/* A session is never silently charged against an unreviewed
                        start date -- the warning shows up here, before the click,
                        not only after opening the bundle. */}
                    {bundle && bundle.coverage_start_confirmed_at === null && <UnreviewedBadge />}
                    <TelegramClaimBadge scheduledRow={occ.scheduledRow} />
                  </span>
                  {bundle ? (
                    <span className="flex gap-1">
                      <TelegramQuickConfirmButton
                        scheduledRow={occ.scheduledRow}
                        disabled={confirmSessions.isPending}
                        onConfirm={(outcome) => confirmOne(student.id, occ, outcome)}
                      />
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
                  ) : (
                    // The block names the fix, not just the problem, and gets
                    // there in one click: opens the bundle whose start date
                    // needs to move back to cover this session.
                    <span className="flex items-center gap-1.5 text-xs text-destructive">
                      No bundle covers this date
                      <Button
                        size="sm" variant="outline" className="h-6 text-xs"
                        onClick={() => {
                          const target = earliestBundleToFix(allBundles?.get(student.id) ?? []);
                          if (target) openEditBundleDialog(target);
                        }}
                      >
                        Fix start date
                      </Button>
                    </span>
                  )}
                </div>
              ))}
              {toConfirm.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllToConfirm(v => !v)}
                  className="rounded-sm pt-1 text-xs font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {showAllToConfirm ? "Show fewer" : `Show all ${toConfirm.length}`}
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && (students.length > 0 || groupStudents.length > 0) &&
          visibleStudents.length === 0 && visibleGroupStudents.length === 0 && (
          <div className="rounded-lg border border-dashed py-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No student matches this view.</p>
            <Button variant="outline" size="sm" onClick={() => { setQuery(""); setFilter("all"); setKind("all"); }}>Show all students</Button>
          </div>
        )}

        {visibleStudents.length > 0 && (
        <div className="space-y-2">
        {kind === "group" && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4" /> Taught together (private billing)
          </p>
        )}
        <div className="grid gap-3 xl:grid-cols-2 items-start">
        {visibleStudents.map(student => {
          const studentBundles = allBundles?.get(student.id) ?? [];
          const activeBundle = activeBundleFor(studentBundles);
          const activeBundleNumber = activeBundle ? numberBundles(studentBundles).get(activeBundle.id) : undefined;
          const st = studentState.get(student.id);
          const next = nextClassOf(student.classes);
          // The left edge carries the one thing to act on, so a scan down the
          // page finds it without reading: red = bundle used up, yellow =
          // unpaid or running low, none = nothing needed.
          const rail = st?.out ? "border-l-wrong" : st?.unpaid || st?.low ? "border-l-amber-400" : "border-l-border";
          return (
          <article
            key={student.id}
            aria-label={student.full_name}
            className={`rounded-lg border border-l-4 ${rail} bg-card p-4 space-y-3 min-w-0`}
          >
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <div
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-full bg-charcoal text-klovers-yellow flex items-center justify-center text-sm font-bold dark:bg-foreground dark:text-background"
              >
                {initialsOf(student.full_name)}
              </div>
              <div className="min-w-[10rem] flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-semibold text-base leading-tight truncate">{student.full_name}</h3>
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
                  {(classmatesByStudent.get(student.id)?.length ?? 0) > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/30 dark:text-sky-200"
                      title="Same class, same meeting link"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      With {classmatesByStudent.get(student.id)!.join(", ")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {next ? (
                    <span>
                      Next class{" "}
                      <span className={`font-medium ${next.daysAway === 0 ? "text-foreground" : "text-foreground/90"}`}>
                        {whenLabel(next.daysAway, next.cls.weekday)} {formatClassRange(trimSeconds(next.cls.start_time), next.cls.duration_minutes)}
                      </span>
                    </span>
                  ) : (
                    <span>No weekly class set</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                <span className="mr-1">
                  <TelegramLinkButton
                    target={{ kind: "private", teacherStudentId: student.id }}
                    link={telegramLinks?.byStudent.get(student.id)}
                    studentName={student.full_name}
                  />
                </span>
                {student.meeting_url && (
                  <Button asChild size="sm" variant="outline" className="h-8">
                    <a href={student.meeting_url} target="_blank" rel="noopener noreferrer" title={student.meeting_url}>
                      <Video className="h-3.5 w-3.5 mr-1" /> Join
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Edit ${student.full_name}`} onClick={() => openStudentEdit(student)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Delete ${student.full_name}`} onClick={() => setConfirmDelete(student)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            {st && (st.unpaid || st.pending > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {st.owed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-wrong-surface border border-wrong/40 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    <Wallet className="h-3 w-3" aria-hidden="true" /> Owes {formatMoney(st.owed.amount, st.owed.currency)}
                  </span>
                )}
                {st.pending > 0 && (
                  <button
                    type="button"
                    onClick={() => openCatchUp(student)}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-400 px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CalendarCheck className="h-3 w-3" aria-hidden="true" /> {st.pending} to confirm
                  </button>
                )}
              </div>
            )}

            <BundleBox
              balance={balances?.get(student.id)}
              activeBundle={activeBundle}
              bundleNumber={activeBundleNumber}
              bundleCount={studentBundles.length}
              unreviewed={studentBundles.some(
                b => b.status === "active" && b.coverage_start_confirmed_at === null,
              )}
              completedBundles={completedBundleSummaries(studentBundles, sessionSummaries ?? new Map())}
              unconfirmedCount={unconfirmedCount(student.id)}
              onAdd={() => openBundleDialog(student)}
              onCatchUp={() => openCatchUp(student)}
              onManageBundles={() => setManageBundlesFor(student)}
              onHistory={() => setHistoryFor(student)}
            />

            <div className="rounded-md border">
              <p className="px-3 pt-2 text-sm font-medium">Weekly schedule & link</p>
              {(
                <div className="px-3 pb-3 pt-1.5 space-y-2.5">
                  <MeetingLinkRow url={student.meeting_url} onEdit={() => openStudentEdit(student)} />
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
                          onClick={() => {
                            setApplyDateToAll(false);
                            setClassDraft({
                              id: c.id,
                              student_id: student.id,
                              weekday: c.weekday,
                              start_time: trimSeconds(c.start_time),
                              duration_minutes: c.duration_minutes,
                              effective_from: c.effective_from,
                            });
                          }}
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
                    onClick={() => {
                      setApplyDateToAll(false);
                      setClassDraft({
                        student_id: student.id, weekday: 1, start_time: "19:00", duration_minutes: 90,
                        effective_from: localDateKey(new Date(), ADMIN_TIMEZONE),
                      });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add a class
                  </Button>
                </div>
                </div>
              )}
            </div>
          </article>
          );
        })}
        </div>
        </div>
        )}

        {isGroupLoading && kind !== "private" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading group students…
          </div>
        )}

        {visibleGroupStudents.length > 0 && (
          <div className="space-y-2">
            {((kind === "all" && students.length > 0) || (kind === "group" && visibleStudents.length > 0)) && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground pt-1">
                <Users className="h-4 w-4" /> Group students (pkg enrollment)
              </p>
            )}
            <div className="grid gap-3 xl:grid-cols-2 items-start">
              {visibleGroupStudents.map(gs => (
                <article
                  key={gs.id}
                  aria-label={gs.full_name}
                  className="rounded-lg border border-l-4 border-l-sky-400 bg-card p-4 space-y-3 min-w-0"
                >
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <div
                      aria-hidden="true"
                      className="h-10 w-10 shrink-0 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center text-sm font-bold dark:bg-sky-950 dark:text-sky-200"
                    >
                      {initialsOf(gs.full_name)}
                    </div>
                    <div className="min-w-[10rem] flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold text-base leading-tight truncate">{gs.full_name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="h-3 w-3 mr-1" /> Group
                        </Badge>
                        {gs.level && (
                          <Badge variant="outline" className="text-[10px]">{getLevelShortLabel(gs.level)}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {gs.day_of_week !== null && gs.start_time ? (
                          <span>{DAY_NAMES[gs.day_of_week]} {formatClassRange(trimSeconds(gs.start_time), 60)}</span>
                        ) : (
                          <span>Schedule not set</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <TelegramLinkButton
                        target={{ kind: "group", userId: gs.user_id }}
                        link={telegramLinks?.byUser.get(gs.user_id)}
                        studentName={gs.full_name}
                      />
                      {gs.meeting_url && (
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <a href={gs.meeting_url} target="_blank" rel="noopener noreferrer" title={gs.meeting_url}>
                            <Video className="h-3.5 w-3.5 mr-1" /> Join
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  {gs.sessions_remaining !== null && (
                    <p className="text-sm text-muted-foreground">
                      {gs.sessions_remaining} of {gs.sessions_total ?? "?"} classes left
                      {gs.sessions_remaining <= 2 && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-400">running low</Badge>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Group student — edit their class time or group from Scheduling or Group Attendance.
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
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
                <Label htmlFor="student-subject">Learning</Label>
                <Select
                  value={studentDraft.subject}
                  onValueChange={v => setStudentDraft({ ...studentDraft, subject: v as StudentSubject })}
                >
                  <SelectTrigger id="student-subject"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{SUBJECT_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-status">Status</Label>
                <Select
                  value={studentDraft.status}
                  onValueChange={v => setStudentDraft({ ...studentDraft, status: v as StudentStatus })}
                >
                  <SelectTrigger id="student-status"><SelectValue /></SelectTrigger>
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
                  <Label htmlFor="student-currency">Currency</Label>
                  <Select
                    value={studentDraft.currency || "none"}
                    onValueChange={v => setStudentDraft({ ...studentDraft, currency: v === "none" ? "" : v })}
                  >
                    <SelectTrigger id="student-currency"><SelectValue placeholder="Not set" /></SelectTrigger>
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
                <Label htmlFor="class-day">Day</Label>
                <Select
                  value={String(classDraft.weekday)}
                  onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, weekday: Number(v) }); }}
                >
                  <SelectTrigger id="class-day"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="class-start">Starts</Label>
                  <Select
                    value={classDraft.start_time}
                    onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, start_time: v }); }}
                  >
                    <SelectTrigger id="class-start"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class-length">Length</Label>
                  <Select
                    value={String(classDraft.duration_minutes)}
                    onValueChange={v => { setConflicts([]); setClassDraft({ ...classDraft, duration_minutes: Number(v) }); }}
                  >
                    <SelectTrigger id="class-length"><SelectValue /></SelectTrigger>
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

              {(() => {
                const otherClasses = (students.find(s => s.id === classDraft.student_id)?.classes ?? [])
                  .filter(c => c.id !== classDraft.id);
                if (otherClasses.length === 0) return null;
                return (
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      className="mt-0.5"
                      checked={applyDateToAll}
                      onCheckedChange={v => setApplyDateToAll(v === true)}
                    />
                    <span>
                      Apply this start date to this student's other {otherClasses.length === 1 ? "class" : `${otherClasses.length} classes`} too
                    </span>
                  </label>
                );
              })()}

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
            <DialogTitle>{bundleDraft?.id ? "Edit bundle" : "Add a bundle"}</DialogTitle>
            <DialogDescription>
              {bundleDraft?.id
                ? "Every change here is recorded — old value, new value, and when."
                : "What they bought. Any bundle they are on now is closed off and kept as history."}
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
                  <Label htmlFor="bundle-catalog">Bundle</Label>
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
                    <SelectTrigger id="bundle-catalog"><SelectValue /></SelectTrigger>
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
                    <Label htmlFor="bundle-currency">Currency</Label>
                    <Select
                      value={bundleDraft.currency}
                      onValueChange={v => editBundleField({ currency: v })}
                    >
                      <SelectTrigger id="bundle-currency"><SelectValue /></SelectTrigger>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bundle-purchased-on">Purchased on</Label>
                    <Input
                      id="bundle-purchased-on" type="date" value={bundleDraft.purchased_on}
                      onChange={e => setBundleDraft({ ...bundleDraft, purchased_on: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bundle-coverage-start">Covers from</Label>
                    <Input
                      id="bundle-coverage-start" type="date" value={bundleDraft.coverage_start}
                      onChange={e => setBundleDraft({ ...bundleDraft, coverage_start: e.target.value })}
                    />
                  </div>
                </div>
                {bundleDraft.id && (
                  <p className="text-xs text-muted-foreground -mt-1.5">
                    Which date a session on-or-after this bundle's start actually draws against. Saving
                    this dialog marks the date reviewed, whether or not you change it.
                  </p>
                )}

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
            <Button onClick={saveBundle} disabled={addBundle.isPending || updateBundle.isPending}>
              {(addBundle.isPending || updateBundle.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {bundleDraft?.id ? "Save changes" : "Add bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void bundle dialog */}
      <Dialog open={!!voidDraft} onOpenChange={o => !o && setVoidDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void {voidDraft?.bundle.label}</DialogTitle>
            <DialogDescription>
              This bundle has classes recorded against it, so it cannot be deleted — voiding keeps the
              row and its history visible, marked with why.
            </DialogDescription>
          </DialogHeader>
          {voidDraft && (
            <div className="space-y-1.5">
              <Label htmlFor="void-reason">Reason</Label>
              <Input
                id="void-reason" value={voidDraft.reason} autoFocus
                onChange={e => setVoidDraft({ ...voidDraft, reason: e.target.value })}
                placeholder="e.g. created by mistake, duplicate of Bundle 2"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDraft(null)}>Cancel</Button>
            <Button
              variant="destructive" onClick={saveVoid}
              disabled={updateBundle.isPending || !voidDraft?.reason.trim()}
            >
              {updateBundle.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Void bundle
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
            const { pending, shown, older } = catchUpQueue;
            const studentBundles = allBundles?.get(catchUpFor.id) ?? [];
            const bundleFor = (o: ExpectedSession) => resolveBundleForDate(studentBundles, o.session_date);

            // A row with no covering bundle cannot be written at all, held or
            // not -- bundle_id is required either way -- so it is excluded from
            // the held/not-held counts below and reported on its own.
            const resolvedShown = shown.filter(o => !!bundleFor(o));
            const unresolvedShown = shown.filter(o => !bundleFor(o));
            const earliestUnresolved = unresolvedShown.length > 0
              ? unresolvedShown.reduce((min, o) => (o.session_date < min ? o.session_date : min), unresolvedShown[0].session_date)
              : null;

            const shownKeys = resolvedShown.map(o => `${o.session_date}|${o.start_time}`);
            const heldRows = resolvedShown.filter((o, i) => catchUpPicked.has(shownKeys[i]));
            const notHeldRows = resolvedShown.filter((o, i) => !catchUpPicked.has(shownKeys[i]));
            const picked = heldRows.length;
            const unreviewedCount = heldRows.filter(o => bundleFor(o)?.coverage_start_confirmed_at === null).length;

            // Empty means the WHOLE queue is empty, not just what is rendered —
            // this exact wording is what makes "nothing waiting" unrepresentable
            // while real unconfirmed classes are still sitting further back.
            if (pending.length === 0) {
              return <p className="text-sm text-muted-foreground py-2">Nothing waiting — every class is confirmed.</p>;
            }

            return (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {shown.map(o => {
                    const key = `${o.session_date}|${o.start_time}`;
                    const on = catchUpPicked.has(key);
                    const rowBundle = bundleFor(o);

                    // No bundle covers this date at all -- it cannot be written
                    // as held OR not-held (bundle_id is required either way), so
                    // it is not a toggle row. Named, with the one-click fix,
                    // rather than a row that just refuses to respond.
                    if (!rowBundle) {
                      return (
                        <div
                          key={key}
                          className="w-full flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground w-24">{formatSessionDate(o.session_date)}</span>
                          <span className="text-destructive">no bundle covers this date</span>
                          <Button
                            size="sm" variant="outline" className="h-6 text-xs ml-auto"
                            onClick={() => {
                              const target = earliestBundleToFix(studentBundles);
                              if (target) openEditBundleDialog(target);
                            }}
                          >
                            Fix start date
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={key} type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => setCatchUpPicked(prev => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key); else next.add(key);
                          return next;
                        })}
                        className={`w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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
                        {rowBundle.coverage_start_confirmed_at === null && <UnreviewedBadge className="ml-1" />}
                        {!on && <span className="ml-auto text-xs text-muted-foreground">did not happen</span>}
                      </button>
                    );
                  })}
                </div>

                {!catchUpShowOlder && older.length > 0 && (
                  <button
                    type="button"
                    onClick={showOlderInCatchUp}
                    className="rounded-sm text-xs text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {older.length} older unconfirmed {older.length === 1 ? "class" : "classes"} — show {older.length === 1 ? "it" : "them"}
                  </button>
                )}

                {unresolvedShown.length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm space-y-1.5">
                    <p className="text-destructive">
                      <strong>{unresolvedShown.length}</strong> {unresolvedShown.length === 1 ? "class" : "classes"} cannot
                      be confirmed yet — no bundle covers {unresolvedShown.length === 1 ? "it" : "them"}, earliest{" "}
                      {formatSessionDate(earliestUnresolved!)}.
                    </p>
                    <Button
                      size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => {
                        const target = earliestBundleToFix(studentBundles);
                        if (target) openEditBundleDialog(target);
                      }}
                    >
                      Fix start date
                    </Button>
                  </div>
                )}

                {/* Exactly what Confirm is about to write, named — not just
                    counted — so unticking a day is never a silent write-off. */}
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
                  <p>
                    <strong>{heldRows.length}</strong> {heldRows.length === 1 ? "class" : "classes"} will be
                    recorded as held
                    {notHeldRows.length > 0 && (
                      <>
                        {" · "}
                        <strong>{notHeldRows.length}</strong> will be recorded as{" "}
                        <strong>NOT</strong> held (no credit used):{" "}
                        {notHeldRows.map(o => formatSessionDate(o.session_date)).join(", ")}
                      </>
                    )}
                    .
                  </p>
                  {picked > 0 && (() => {
                    const byBundle = new Map<string, { bundle: StudentBundle; count: number }>();
                    for (const o of heldRows) {
                      const b = bundleFor(o);
                      if (!b) continue;
                      const entry = byBundle.get(b.id) ?? { bundle: b, count: 0 };
                      entry.count += 1;
                      byBundle.set(b.id, entry);
                    }
                    const entries = [...byBundle.values()];

                    // The common case: everything shown draws from one bundle,
                    // so this reads exactly as it always has -- a single
                    // before-and-after balance. Spanning a renewal (rare) falls
                    // back to naming each bundle's own change instead.
                    if (entries.length === 1) {
                      const { bundle: b, count } = entries[0];
                      const before = b.total_classes - (usedByBundle.get(b.id) ?? 0);
                      const after = before - count;
                      return (
                        <p>
                          Balance {before} → <strong>{after}</strong>.
                          {after < 0 && (
                            <span className="block text-xs text-destructive pt-0.5">
                              This takes them past the end of the bundle. That is allowed — the classes happened.
                            </span>
                          )}
                        </p>
                      );
                    }

                    return (
                      <>
                        <p>These dates span more than one bundle — each is charged to the one that covered it.</p>
                        {entries.map(({ bundle: b, count }) => {
                          const remaining = b.total_classes - (usedByBundle.get(b.id) ?? 0) - count;
                          return (
                            <p key={b.id} className={remaining < 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                              {b.label}: {remaining < 0 ? `${Math.abs(remaining)} over — that is allowed, the classes happened.` : `${remaining} left.`}
                            </p>
                          );
                        })}
                      </>
                    );
                  })()}
                  {unreviewedCount > 0 && (
                    <p className="text-xs text-amber-700">
                      {unreviewedCount} of these {unreviewedCount === 1 ? "draws" : "draw"} against a bundle whose
                      start date has not been reviewed yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatchUpFor(null)}>Cancel</Button>
            <Button
              onClick={saveCatchUp}
              disabled={confirmSessions.isPending || catchUpQueue.shown.length === 0}
            >
              {confirmSessions.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog — the class-by-class ledger only; bundles live in Manage bundles. */}
      <Dialog open={!!historyFor} onOpenChange={o => !o && setHistoryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>History · {historyFor?.full_name}</DialogTitle>
            <DialogDescription>
              Every class ever confirmed. Undo puts the credit back.
            </DialogDescription>
          </DialogHeader>
          {historyFor && (
            <SessionLedger
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

      {/* Manage bundles dialog — which bundles this student has, how many, and
          their state, in one place; the surface Re went looking for on the
          card. New bundle lives here too, alongside Edit/Void/Delete. */}
      <Dialog open={!!manageBundlesFor} onOpenChange={o => !o && setManageBundlesFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage bundles · {manageBundlesFor?.full_name}</DialogTitle>
            <DialogDescription>
              Every bundle this student has ever had, and what is left on each.
            </DialogDescription>
          </DialogHeader>
          {manageBundlesFor && (
            <BundleManager
              studentId={manageBundlesFor.id}
              onAddBundle={() => openBundleDialog(manageBundlesFor)}
              onEditBundle={openEditBundleDialog}
              onDuplicateBundle={openDuplicateBundleDialog}
              onVoidBundle={b => setVoidDraft({ bundle: b, reason: "" })}
              onDeleteBundle={setConfirmDeleteBundle}
              deletingBundleId={deleteBundle.isPending ? confirmDeleteBundle?.id ?? null : null}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageBundlesFor(null)}>Close</Button>
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

      <AlertDialog open={!!confirmDeleteBundle} onOpenChange={o => !o && setConfirmDeleteBundle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDeleteBundle?.label}?</AlertDialogTitle>
            {/* The FK protects sessions from being orphaned; nothing protects the
                bundle record itself from a plain click. This names exactly
                what is about to disappear -- the same "show what the click
                will write" principle as the catch-up dialog's D3 summary --
                since a cancelled, zero-session bundle passes the delete
                guard with nothing else in the way. This is the same class of
                action that caused the August data loss, so every number here
                is spelled out rather than implied. */}
            {confirmDeleteBundle && (() => {
              const bundleNumber =
                numberBundles(allBundles?.get(confirmDeleteBundle.student_id) ?? []).get(confirmDeleteBundle.id);
              const renumbered = bundlesRenumberedByDeleting(
                allBundles?.get(confirmDeleteBundle.student_id) ?? [], confirmDeleteBundle.id,
              );
              return (
                <AlertDialogDescription asChild>
                  <div className="space-y-1">
                    <p dir="ltr">
                      Bundle {bundleNumber}
                      {" — "}
                      <strong>{confirmDeleteBundle.label}</strong>
                      {" · "}{confirmDeleteBundle.total_classes} classes
                      {" · "}{formatMoney(confirmDeleteBundle.total_price, confirmDeleteBundle.currency)}
                      {" · from "}{formatSessionDate(confirmDeleteBundle.coverage_start)}
                    </p>
                    <p dir="ltr">0 classes recorded against it — nothing is being thrown away with it.</p>
                    {renumbered.length > 0 && (
                      <p dir="ltr">
                        {renumbered.map(({ before, after }, i) => (
                          <span key={before}>
                            {i > 0 && " "}
                            Bundle {before} will become Bundle {after}.
                          </span>
                        ))}
                      </p>
                    )}
                    <p>This cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              );
            })()}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeBundle}>Delete bundle</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MyStudentsManager;
