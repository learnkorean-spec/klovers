/**
 * The confirm strip: private classes the schedule says have happened, and one
 * click to answer for each.
 *
 * Extracted from MyStudentsManager so /admin/today can show the same queue.
 * Today is the screen Re opens each morning; a class waiting for an answer is
 * exactly the kind of thing that screen exists to surface, and until this moved
 * out it was only visible to somebody who had already navigated to My Students.
 *
 * The markup is deliberately unchanged from the version that lived inline, and
 * the queue itself comes from usePrivateConfirmQueue — neither screen owns a
 * second copy of the rules.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, CalendarCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnreviewedBadge } from "@/components/admin/UnreviewedBadge";
import { TelegramClaimBadge, TelegramQuickConfirmButton } from "@/components/admin/TelegramClaimBadge";
import { usePrivateConfirmQueue } from "@/hooks/admin/usePrivateConfirmQueue";
import { formatClassRange, formatSessionDate, type MyStudentWithClasses } from "@/types/students";

interface PrivateClassesToConfirmProps {
  /** Rows drawn before the overflow line. The rest are done together in Catch up. */
  limit?: number;
  /**
   * What "Fix start date" does. My Students opens the bundle dialog in place;
   * a screen that has no such dialog omits this and gets a link to the screen
   * that does, so the button is never a dead end.
   */
  onFixStartDate?: (student: MyStudentWithClasses) => void;
  /** Replaces the line shown when more rows are outstanding than are drawn. */
  overflow?: (hidden: number) => ReactNode;
}

const PrivateClassesToConfirm = ({
  limit = 8,
  onFixStartDate,
  overflow,
}: PrivateClassesToConfirmProps) => {
  const { toConfirm, confirmSessions, confirmOne } = usePrivateConfirmQueue();

  if (toConfirm.length === 0) return null;
  const hidden = toConfirm.length - limit;

  return (
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
        {toConfirm.slice(0, limit).map(({ student, occ, bundle }) => (
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
                {onFixStartDate ? (
                  <Button
                    size="sm" variant="outline" className="h-6 text-xs"
                    onClick={() => onFixStartDate(student)}
                  >
                    Fix start date
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="h-6 text-xs">
                    <Link to="/admin?tab=my-students">Fix start date</Link>
                  </Button>
                )}
              </span>
            )}
          </div>
        ))}
        {hidden > 0 && (
          overflow ? overflow(hidden) : (
            <p className="text-xs text-muted-foreground pt-1">
              …and {hidden} more — use Catch up on the student to do them together.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default PrivateClassesToConfirm;
