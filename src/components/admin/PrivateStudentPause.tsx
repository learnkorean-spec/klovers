/**
 * Pause / Resume for a private student.
 *
 * The group card has had this for a while and says what it means in its own
 * words: paused, it is not meeting, nobody new can be seated into it, and its
 * start date, its students and their payment dates are all kept, so Resume puts
 * it straight back. Re asked for the same on a private student, and the reason
 * she needs it now is new.
 *
 * Until this week a private student who stopped simply stopped: nothing ran on
 * its own, so nothing needed switching off. The system now renews her package
 * the moment a lesson is taught past it and emails her for the money. That is
 * right for a student who is carrying on and wrong for one who is not - so
 * "carrying on" has to be something Re can say no to, in one click, without
 * deleting anybody.
 *
 * WHAT PAUSING DOES NOT DO
 * It does not delete, hide, or settle anything. Her package, her counted
 * lessons, her balance and her money owed are exactly where they were. It also
 * does not stop Re: the manual "Ask for payment" button on Today still works
 * for a paused student, because Re asking on purpose is not the same act as the
 * system deciding to. Freezing stops the automatic, never her.
 *
 * It is a component of its own rather than a few lines inside the card because
 * MyStudentsManager.tsx (104 KB) should get the same button, and the only thing
 * that should have to be duplicated to do that is one JSX line.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  student: { id: string; full_name: string; status: string };
  /** Called after a successful change so the list around this button reloads. */
  onChanged?: () => void;
  className?: string;
}

export default function PrivateStudentPause({ student, onChanged, className }: Props) {
  const [busy, setBusy] = useState(false);
  const paused = student.status === "paused";

  async function toggle() {
    setBusy(true);
    const next = paused ? "active" : "paused";
    const { error } = await supabase
      .from("teacher_students")
      .update({ status: next })
      .eq("id", student.id);
    setBusy(false);

    if (error) {
      toast({
        title: paused ? "Could not resume her" : "Could not pause her",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: paused ? `${student.full_name} is running again` : `${student.full_name} is paused`,
      description: paused
        ? "Her lessons go back on the calendar, and her package renews again when she goes past it."
        : "Nothing automatic happens to her now - no renewal, no payment letter, no new lessons. Everything is kept.",
    });
    onChanged?.();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={paused ? "default" : "outline"}
      disabled={busy}
      onClick={() => void toggle()}
      className={
        "h-7 text-xs " +
        (paused ? "bg-mint-strong text-charcoal hover:bg-mint-strong/90 " : "") +
        (className ?? "")
      }
      title={
        paused
          ? "Put her back: lessons return to the calendar and her package renews again"
          : "Freeze her: no renewal, no payment letter, no new lessons. Everything is kept."
      }
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : paused ? (
        <>
          <Play className="h-3.5 w-3.5 me-1" aria-hidden="true" />
          Resume
        </>
      ) : (
        <>
          <Pause className="h-3.5 w-3.5 me-1 text-pink-500" aria-hidden="true" />
          Pause
        </>
      )}
    </Button>
  );
}
