import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useDashCopy } from "@/components/student-dashboard/premium/copy";

const KEY = "kl_dash_clarity_v1";

const alreadyAnswered = () => {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return true; // no storage: do not ask on every visit
  }
};

/**
 * "Is this page clear?" — one tap, asked once per browser.
 *
 * The redesign this sits on was triggered by a single student's remark. This
 * turns that into a number: the answer goes to analytics (dashboard_clear_yes
 * / dashboard_clear_no) with the tab and whether the student was in the
 * new-student view. Bump the key's version to ask everyone again after a
 * later redesign.
 */
export function ClarityPulse({ onVote }: { onVote: (clear: boolean) => void }) {
  const { c } = useDashCopy();
  const [state, setState] = useState<"ask" | "thanks" | "hidden">(() => (alreadyAnswered() ? "hidden" : "ask"));

  if (state === "hidden") return null;

  const vote = (clear: boolean) => {
    try {
      localStorage.setItem(KEY, clear ? "yes" : "no");
    } catch {
      /* still record the answer */
    }
    onVote(clear);
    setState("thanks");
  };

  const btn = "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/20 bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-foreground/20 px-4 py-3" role="group" aria-label={c("clarityQuestion")}>
      {state === "thanks" ? (
        <p className="text-sm text-muted-foreground" role="status">{c("clarityThanks")}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">{c("clarityQuestion")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} data-track="clarity_yes" onClick={() => vote(true)}>
              <ThumbsUp className="h-4 w-4" aria-hidden="true" /> {c("clarityYes")}
            </button>
            <button type="button" className={btn} data-track="clarity_no" onClick={() => vote(false)}>
              <ThumbsDown className="h-4 w-4" aria-hidden="true" /> {c("clarityNo")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
