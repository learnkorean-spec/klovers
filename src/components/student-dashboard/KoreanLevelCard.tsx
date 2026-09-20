import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, RotateCcw } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { getLevelShortLabel } from "@/constants/levels";
import type { PlacementTestResult } from "./types";

// Was duplicated in full (identical markup, two different "no level yet"
// copy strings) between StudentDashboard's no-enrollment and enrolled render
// branches — factored out during the dashboard-page split so the two call
// sites can't drift out of sync again.
export const KoreanLevelCard = ({
  profileLevel, placementTest, language, dateLocale, emptyPromptKey, navigate, t, tInterpolate,
}: {
  profileLevel: string;
  placementTest: PlacementTestResult | null;
  language: string;
  dateLocale: string;
  emptyPromptKey: string;
  navigate: (path: string) => void;
  t: (key: string) => string;
  tInterpolate: (template: string, vars: Record<string, unknown>) => string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <KloverIcon name="growth-chart" className="h-7 w-7" /> {t("dashboardPage.koreanLevel")}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {profileLevel ? (
        <div className="flex items-center justify-between">
          <div>
            <Badge className="text-sm px-3 py-1">{getLevelShortLabel(profileLevel, language) || profileLevel}</Badge>
            {/* No score out of anything: the old test scored out of 30 and the
                merged one out of up to 62, so a fixed "/40" was wrong either
                way. The date is what a student can act on — how stale it is. */}
            {placementTest && (
              <p className="text-xs text-muted-foreground mt-1">{tInterpolate(t("dashboardPage.tested"), { date: new Date(placementTest.created_at).toLocaleDateString(dateLocale) })}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
            <RotateCcw className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.retake")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t(emptyPromptKey)}</p>
          <Button size="sm" onClick={() => navigate("/placement-test")}>
            <GraduationCap className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.takeTest")}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export default KoreanLevelCard;
