/**
 * Classes already answered for — and the one thing the admin could not do
 * with them: change them.
 *
 * The confirm strip asks one question about one day and then the answer is
 * final. Real private teaching does not hold still: a student misses Monday
 * and is given the hour on Wednesday instead. Answering "did not happen" on
 * Monday is correct at the moment it is clicked and wrong two days later, and
 * until this card existed there was no screen that could say so. The only
 * repairs on record were made by hand, in the database, twice.
 *
 * So: the recent recorded classes, newest first, each openable. The dialog
 * changes the date, the time, the outcome and the reason — and re-resolves the
 * bundle from the new date, because a class moved across a renewal belongs to
 * the bundle that covered the day it was really taught.
 *
 * Reads nothing of its own. Students, bundles and sessions all come from
 * usePrivateConfirmQueue's queries through the react-query cache, so mounting
 * this beside the confirm strip costs no extra request.
 */
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { usePrivateConfirmQueue } from "@/hooks/admin/usePrivateConfirmQueue";
import { useEditRecordedSession } from "@/hooks/admin/useEditRecordedSession";
import {
  formatSessionDate, isResolved,
  type SessionOutcome, type StudentClassSession,
} from "@/types/students";

interface RecordedClassesProps {
  /** Rows drawn before "show more". Today shows a handful; a fuller screen can raise it. */
  limit?: number;
}

const OUTCOME_LABEL: Record<SessionOutcome, string> = {
  attended: "Class done",
  cancelled_no_charge: "Did not happen",
};

/** "18:00:00" and "18:00" both arrive here; the time input wants the second. */
const hhmm = (t: string) => t.slice(0, 5);

const RecordedClasses = ({ limit = 6 }: RecordedClassesProps) => {
  const { students, recentSessions, allBundles } = usePrivateConfirmQueue();
  const editSession = useEditRecordedSession();

  const [editing, setEditing] = useState<StudentClassSession | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [outcome, setOutcome] = useState<SessionOutcome>("attended");
  const [note, setNote] = useState("");

  const nameById = useMemo(
    () => new Map(students.map(s => [s.id, s.full_name])),
    [students],
  );

  /** Answered rows only. A scheduled placeholder belongs to the confirm strip. */
  const rows = useMemo(
    () => recentSessions
      .filter(isResolved)
      .sort((a, b) =>
        b.session_date.localeCompare(a.session_date) ||
        b.start_time.localeCompare(a.start_time)),
    [recentSessions],
  );

  if (rows.length === 0) return null;

  const shown = showAll ? rows : rows.slice(0, limit);

  const open = (s: StudentClassSession) => {
    setEditing(s);
    setDate(s.session_date);
    setTime(hhmm(s.start_time));
    // A scheduled row never reaches this list, so the branch below is total
    // over what is actually here — but it defaults defensively rather than
    // trusting that.
    setOutcome(s.outcome === "cancelled_no_charge" ? "cancelled_no_charge" : "attended");
    setNote(s.note ?? "");
  };

  const save = async () => {
    if (!editing) return;
    if (!date || !time) {
      toast({ title: "A date and a time are needed", variant: "destructive" });
      return;
    }
    try {
      const bundle = await editSession.mutateAsync({
        id: editing.id,
        student_id: editing.student_id,
        session_date: date,
        start_time: time,
        outcome,
        note: note || null,
        bundles: allBundles?.get(editing.student_id) ?? [],
      });
      toast({
        title: "Class updated",
        description: `${formatSessionDate(date)} · ${OUTCOME_LABEL[outcome]} · ${bundle.label}.`,
      });
      setEditing(null);
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <p className="text-sm font-semibold">Recorded classes</p>
      <p className="text-xs text-muted-foreground">
        Already answered for. Open one to move it to the day it really happened, or to change the answer.
      </p>

      <div className="space-y-1">
        {shown.map(s => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-muted-foreground">{formatSessionDate(s.session_date)}</span>
              <span className="font-medium">{nameById.get(s.student_id) ?? "—"}</span>
              <span className="text-muted-foreground">{hhmm(s.start_time)}</span>
              <Badge variant={s.counted ? "secondary" : "outline"} className="text-[10px]">
                {s.counted ? "counted" : "no credit"}
              </Badge>
              {s.note && (
                <span className="max-w-[18rem] truncate text-xs text-muted-foreground" title={s.note}>
                  {s.note}
                </span>
              )}
            </span>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => open(s)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        ))}

        {rows.length > limit && (
          <button
            type="button"
            className="rounded-sm pt-1 text-xs text-muted-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? "Show fewer" : `Show all ${rows.length}`}
          </button>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? nameById.get(editing.student_id) ?? "Class" : "Class"}
            </DialogTitle>
            <DialogDescription>
              Moving a class changes which bundle it is charged to — the bundle covering the new
              date, not the old one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rc-date">Date it happened</Label>
                <Input id="rc-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rc-time">Time</Label>
                <Input id="rc-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span id="rc-answer-label" className="text-sm font-medium leading-none">Answer</span>
              <div className="flex gap-2" role="group" aria-labelledby="rc-answer-label">
                {(["attended", "cancelled_no_charge"] as SessionOutcome[]).map(o => (
                  <Button
                    key={o}
                    type="button"
                    size="sm"
                    variant={outcome === o ? "default" : "outline"}
                    aria-pressed={outcome === o}
                    onClick={() => setOutcome(o)}
                  >
                    {OUTCOME_LABEL[o]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {outcome === "attended"
                  ? "Uses one class from the bundle."
                  : "Uses no credit."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rc-note">Why (optional)</Label>
              <Textarea
                id="rc-note"
                rows={2}
                placeholder="Missed Monday, taught Wednesday instead."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={editSession.isPending}>
              {editSession.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordedClasses;
