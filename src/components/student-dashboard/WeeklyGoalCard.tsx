// Was an inline IIFE (`{(() => { ... })()}`) directly in StudentDashboard's
// JSX. Pulled out as a named component during the dashboard-page split;
// behavior is unchanged.
export const WeeklyGoalCard = ({ weeklyXp, t }: { weeklyXp: number; t: (key: string) => string }) => {
  const WEEKLY_GOAL = 300;
  const pct = Math.min(100, Math.round((weeklyXp / WEEKLY_GOAL) * 100));
  const msg = pct >= 100 ? t("dashboardPage.goalCrushed") : pct >= 60 ? t("dashboardPage.almostThere") : pct >= 30 ? t("dashboardPage.goodStart") : t("dashboardPage.startEarning");
  return (
    <div className="flex-1 bg-card border border-border/60 rounded-2xl px-4 py-4 flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{t("dashboardPage.weeklyXp")}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{weeklyXp}/{WEEKLY_GOAL}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{msg}</p>
    </div>
  );
};

export default WeeklyGoalCard;
