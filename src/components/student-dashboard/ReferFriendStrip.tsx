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
    <div className="flex flex-wrap items-center gap-3 bg-ivory dark:bg-card border border-border rounded-xl px-4 py-2.5">
      <KloverIcon name="reward-gift" className="h-8 w-8 sm:h-9 sm:w-9" />
      <span className="flex-1 text-sm text-muted-foreground min-w-0 break-words">
        <strong className="text-foreground">{t("dashboardPage.referTitle")}</strong> · {t("dashboardPage.referEarn")}
        {referralCount > 0 && <> · <span className="text-charcoal dark:text-foreground font-medium">{tInterpolate(t("dashboardPage.referJoined"), { count: referralCount })}</span></>}
      </span>
      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast({ title: t("dashboardPage.linkCopied") }); }}
        className="shrink-0 gap-1 border-charcoal/30 text-charcoal dark:text-foreground hover:bg-klovers-yellow hover:text-charcoal h-7 text-xs px-2">
        <Copy className="h-3 w-3" /> {t("dashboardPage.copyLink")}
      </Button>
    </div>
  );
};

export default ReferFriendStrip;
