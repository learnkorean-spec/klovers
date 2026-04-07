import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMilestones } from "@/hooks/useMilestones";
import { Crown, Trophy, Target, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  lessons_completed: <Trophy className="h-5 w-5 text-amber-500" />,
  vocabulary_mastered: <Target className="h-5 w-5 text-blue-500" />,
  xp_earned: <Crown className="h-5 w-5 text-yellow-500" />,
  streak_days: <Flame className="h-5 w-5 text-red-500" />,
};

const TIER_COLORS: Record<number, string> = {
  1: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
  2: "border-muted bg-muted/40",
  3: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/40",
  4: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40",
};

const TIER_BADGES: Record<number, string> = {
  1: "BRONZE",
  2: "SILVER",
  3: "GOLD",
  4: "PLATINUM",
};

export function AchievementMilestoneCard() {
  const { groupedMilestones, completionPercentage, newlyAchieved } = useMilestones();

  if (groupedMilestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 pb-6 text-center space-y-2">
          <Trophy className="h-9 w-9 mx-auto text-muted-foreground/30" />
          <p className="font-semibold text-sm text-foreground">No milestones yet</p>
          <p className="text-xs text-muted-foreground">Complete lessons and earn XP to unlock milestone rewards.</p>
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
              {newlyAchieved.milestone_name}
            </p>
            <p className="text-sm text-muted-foreground">Milestone Achieved!</p>
          </div>
        </div>
      )}

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-transparent dark:border-amber-800 dark:from-amber-950/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              Milestone Progress
            </span>
            <Badge variant="outline">{completionPercentage}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Overall Achievement
              </span>
              <span className="text-xs text-muted-foreground">
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
                  {group.type
                    .replace(/_/g, " ")
                    .charAt(0)
                    .toUpperCase() +
                    group.type
                      .replace(/_/g, " ")
                      .slice(1)}
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
                          {TIER_BADGES[milestone.milestone_tier]}
                        </span>
                        {milestone.is_achieved && (
                          <span className="text-lg">✓</span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-foreground mb-1">
                        {milestone.milestone_name}
                      </p>

                      {!milestone.is_achieved && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
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
                          {new Date(milestone.achieved_at).toLocaleDateString()}
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
                ? "🌟 Amazing! You've achieved all milestones!"
                : `${100 - completionPercentage}% to go! Keep learning and unlock more achievements.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
