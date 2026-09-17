import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMilestones } from "@/hooks/useMilestones";
import { Crown, Trophy, Target, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  lessons_completed: <Trophy className="h-5 w-5 text-amber-500" />,
  vocabulary_mastered: <Target className="h-5 w-5 text-blue-500" />,
  xp_earned: <Crown className="h-5 w-5 text-yellow-500" />,
  streak_days: <Flame className="h-5 w-5 text-red-500" />,
};

const TIER_COLORS: Record<number, string> = {
  1: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 ring-1 ring-black/10",
  2: "border-muted bg-muted/40",
  3: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/40 ring-1 ring-black/10",
  4: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40",
};

const TIER_BADGES: Record<number, { en: string; ar: string }> = {
  1: { en: "BRONZE", ar: "برونزي" },
  2: { en: "SILVER", ar: "فضي" },
  3: { en: "GOLD", ar: "ذهبي" },
  4: { en: "PLATINUM", ar: "بلاتيني" },
};

const GROUP_LABELS: Record<string, { en: string; ar: string }> = {
  lessons_completed: { en: "Lessons completed", ar: "الدروس المكتملة" },
  vocabulary_mastered: { en: "Vocabulary mastered", ar: "المفردات المتقنة" },
  xp_earned: { en: "XP earned", ar: "نقاط الخبرة المكتسبة" },
  streak_days: { en: "Streak days", ar: "أيام متتالية" },
};

/**
 * A milestone's display name. The stored `milestone_name` is English only
 * ("5 Lessons Completed", "7 Day Streak"), and every name is just its type plus
 * its target, so the label is rebuilt from those two in the reader's language.
 * An unknown type falls back to the stored name.
 */
function milestoneLabel(m: { milestone_type: string; milestone_name: string; target_value: number }, language: string): string {
  if (language !== "ar") return m.milestone_name;
  const group = GROUP_LABELS[m.milestone_type];
  return group ? `${group.ar}: ${m.target_value.toLocaleString("en-US")}` : m.milestone_name;
}

export function AchievementMilestoneCard() {
  const { groupedMilestones, completionPercentage, newlyAchieved } = useMilestones();
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);

  if (groupedMilestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 pb-6 text-center space-y-2">
          <Trophy className="h-9 w-9 mx-auto text-muted-foreground/30" />
          <p className="font-semibold text-sm text-foreground">{tr("No milestones yet", "لا توجد إنجازات بعد")}</p>
          <p className="text-xs text-muted-foreground">{tr("Complete lessons and earn XP to unlock milestone rewards.", "أكمل الدروس واكسب نقاط الخبرة لفتح مكافآت الإنجازات.")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Celebration Modal for Newly Achieved */}
      {newlyAchieved && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-amber-700">
              {milestoneLabel(newlyAchieved, language)}
            </p>
            <p className="text-sm text-muted-foreground">{tr("Milestone Achieved!", "إنجاز جديد!")}</p>
          </div>
        </div>
      )}

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-transparent dark:border-amber-800 dark:from-amber-950/30 ring-1 ring-black/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              {tr("Milestone Progress", "تقدّم الإنجازات")}
            </span>
            <Badge variant="outline">{completionPercentage}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {tr("Overall Achievement", "الإنجاز الكلي")}
              </span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {groupedMilestones.reduce(
                  (sum, group) => sum + group.tiers.filter((m) => m.is_achieved).length,
                  0
                )} / {groupedMilestones.reduce((sum, group) => sum + group.tiers.length, 0)}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Milestone Groups */}
          <div className="space-y-4">
            {groupedMilestones.map((group) => (
              <div key={group.type} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {MILESTONE_ICONS[group.type]}
                  {GROUP_LABELS[group.type]
                    ? GROUP_LABELS[group.type][language === "ar" ? "ar" : "en"]
                    : group.type.replace(/_/g, " ").charAt(0).toUpperCase() + group.type.replace(/_/g, " ").slice(1)}
                </h4>

                {/* Tier Progress */}
                <div className="grid grid-cols-2 gap-2">
                  {group.tiers.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all",
                        milestone.is_achieved
                          ? TIER_COLORS[milestone.milestone_tier]
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">
                          {TIER_BADGES[milestone.milestone_tier]?.[language === "ar" ? "ar" : "en"]}
                        </span>
                        {milestone.is_achieved && (
                          <span className="text-lg" aria-label={tr("Achieved", "تم الإنجاز")}>✓</span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-foreground mb-1">
                        {milestoneLabel(milestone, language)}
                      </p>

                      {!milestone.is_achieved && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span dir="ltr">
                              {milestone.progress_value}/{milestone.target_value}
                            </span>
                          </div>
                          <Progress
                            value={
                              (milestone.progress_value / milestone.target_value) * 100
                            }
                            className="h-1"
                          />
                        </div>
                      )}

                      {milestone.is_achieved && milestone.achieved_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(milestone.achieved_at).toLocaleDateString(language === "ar" ? "ar-EG-u-nu-latn" : "en-GB")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Encouragement Message */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
            <p className="text-xs text-muted-foreground">
              {completionPercentage === 100
                ? tr("🌟 Amazing! You've achieved all milestones!", "🌟 رائع! حققت كل الإنجازات!")
                : tr(`${100 - completionPercentage}% to go! Keep learning and unlock more achievements.`, `باقي ${100 - completionPercentage}%! واصل التعلّم لفتح إنجازات أكثر.`)}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
