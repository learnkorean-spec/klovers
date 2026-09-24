import { Link } from "react-router-dom";
import { badgeText } from "@/lib/dashboardLocale";
import { recentAchievements, type EarnedBadge } from "@/lib/dashboardProgress";
import { useDashCopy } from "./copy";
import { BrandIcon } from "./primitives";

/**
 * F. Recent achievements — at most three, tertiary weight, one link to the rest.
 * (The book gift card moved up under the hero — see DashboardHero.)
 */
export function RecentAchievements({ earned }: { earned: EarnedBadge[] }) {
  const { c, lang } = useDashCopy();
  const items = recentAchievements(earned, 3);
  const dateFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short" });

  return (
    <section aria-labelledby="dash-achievements-title" className="rounded-[20px] bg-muted/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dash-achievements-title" className="font-display text-base font-semibold text-foreground">{c("achievementsTitle")}</h2>
        <Link to="/textbook/progress" className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded">
          {c("viewAllAchievements")}
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <BrandIcon name="trophy" className="h-8 w-8 opacity-50 grayscale" />
          <p className="flex-1 text-sm text-muted-foreground">{c("achievementsEmpty")}</p>
          <Link to="/games" className="inline-flex min-h-11 items-center rounded-xl border border-foreground/20 bg-card px-4 text-sm font-semibold hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            {c("missionPlay")}
          </Link>
        </div>
      ) : (
        <ul className="mt-2 grid gap-2">
          {items.map(a => {
            const t = badgeText(a.badge, lang);
            return (
              <li key={a.badge_key} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5">
                <BrandIcon name={a.icon} className="h-9 w-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.earned_at ? dateFmt.format(new Date(a.earned_at)) : t.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
