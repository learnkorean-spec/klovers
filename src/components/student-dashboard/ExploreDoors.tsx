import { Link, useLocation } from "react-router-dom";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { useDashCopy, type CopyKey } from "@/components/student-dashboard/premium/copy";
import type { BrandIconName } from "@/lib/dashboardProgress";

const DOORS: { to: string; icon: BrandIconName; label: CopyKey; track: string }[] = [
  { to: "/world", icon: "hanok", label: "doorWorld", track: "door_world" },
  { to: "/exchange/app", icon: "conversation", label: "doorExchange", track: "door_exchange" },
  { to: "/a0", icon: "headphones", label: "doorAudio", track: "door_a0_audio" },
];

/**
 * One slim row of doors on the Today tab.
 *
 * KLOVERS World, Language Exchange and the Hangul book audio each used to be
 * a full-width card stacked directly under the hero, ahead of the student's
 * own class and next lesson. They keep a place on the first screen here, at
 * a fraction of the height; their full cards live on the Explore tab.
 */
export function ExploreDoors({ onSeeAll }: { onSeeAll: () => void }) {
  const { c } = useDashCopy();
  const { pathname } = useLocation();
  return (
    <section aria-labelledby="dash-doors-title" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dash-doors-title" className="font-display text-base font-semibold text-foreground">{c("doorsTitle")}</h2>
        <button
          type="button"
          onClick={onSeeAll}
          data-track="doors_see_all"
          className="min-h-11 rounded-lg px-2 text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          {c("doorsMore")}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 [&>*]:min-w-0">
        {DOORS.map(({ to, icon, label, track }) => (
          <Link
            key={to}
            to={to}
            state={to === "/world" ? { from: pathname } : undefined}
            data-track={track}
            className="flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border border-foreground/10 bg-card px-2 py-3 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <BrandIcon name={icon} className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="text-xs font-semibold leading-tight text-foreground sm:text-sm">{c(label)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
