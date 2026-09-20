import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KloverIcon from "@/components/KloverIcon";
import { LeagueProgressBar, BadgeGrid } from "@/components/GamificationUI";
import type { useGamification } from "@/hooks/useGamification";

// Same story as KoreanLevelCard — this was byte-for-byte duplicated between
// StudentDashboard's two render branches. Factored out during the
// dashboard-page split.
export const LeagueXpCard = ({
  gamification, gamLoading, t, tInterpolate,
}: {
  gamification: ReturnType<typeof useGamification>["progress"];
  gamLoading: boolean;
  t: (key: string) => string;
  tInterpolate: (template: string, vars: Record<string, unknown>) => string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <KloverIcon name="badge-blossom" className="h-7 w-7" /> {t("dashboardPage.myLeague")}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <LeagueProgressBar totalXp={gamification.totalXp} />
      {gamLoading ? (
        <BadgeGrid earnedBadges={[]} loading />
      ) : gamification.badges.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{tInterpolate(t("dashboardPage.earnedBadges"), { count: gamification.badges.length })}</p>
          <BadgeGrid earnedBadges={gamification.badges} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("dashboardPage.badgesEmpty")}</p>
      )}
    </CardContent>
  </Card>
);

export default LeagueXpCard;
