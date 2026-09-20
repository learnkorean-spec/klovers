import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { toast } from "@/hooks/use-toast";

// Was an inline IIFE directly in StudentDashboard's JSX. Pulled out as a
// named component during the dashboard-page split; behavior is unchanged.
export const ReferFriendStrip = ({
  userId, referralCount, t, tInterpolate,
}: {
  userId: string;
  referralCount: number;
  t: (key: string) => string;
  tInterpolate: (template: string, vars: Record<string, unknown>) => string;
}) => {
  const refLink = `https://kloversegy.com/free-trial?ref=${userId}`;
  return (
    <div className="flex flex-wrap items-center gap-3 bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-xl px-4 py-2.5">
      <KloverIcon name="student-girl-heart" className="h-8 w-8 sm:h-9 sm:w-9" />
      <span className="flex-1 text-sm text-muted-foreground min-w-0 break-words">
        <strong className="text-foreground">{t("dashboardPage.referTitle")}</strong> · {t("dashboardPage.referEarn")}
        {referralCount > 0 && <> · <span className="text-violet-600 font-medium">{tInterpolate(t("dashboardPage.referJoined"), { count: referralCount })}</span></>}
      </span>
      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast({ title: t("dashboardPage.linkCopied") }); }}
        className="shrink-0 gap-1 border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 h-7 text-xs px-2">
        <Copy className="h-3 w-3" /> {t("dashboardPage.copyLink")}
      </Button>
    </div>
  );
};

export default ReferFriendStrip;
