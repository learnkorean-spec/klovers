import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeaderboard, type LeaderboardEntry } from "@/hooks/useLeaderboard";
import { Trophy, Flame, Crown, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-100 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700 ring-1 ring-black/10",
  2: "bg-muted border-muted-foreground/30",
  3: "bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700 ring-1 ring-black/10",
};

const RANK_ICONS: Record<number, React.ReactNode> = {
  1: <Crown className="h-4 w-4 text-yellow-500" />,
  2: <Medal className="h-4 w-4 text-gray-400" />,
  3: <Medal className="h-4 w-4 text-amber-600" />,
};

interface EntryRowProps {
  rank: number;
  name: string;
  avatarUrl: string | null;
  value: number;
  unit: string;
  isCurrentUser: boolean;
}

function EntryRow({ rank, name, avatarUrl, value, unit, isCurrentUser }: EntryRowProps) {
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        RANK_STYLES[rank] || "border-border bg-card",
        isCurrentUser && "ring-2 ring-amber-400 ring-offset-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {RANK_ICONS[rank] || (
          <span className="text-sm font-bold text-muted-foreground" dir="ltr">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="text-xs bg-amber-100 text-foreground font-semibold border border-black/10">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-amber-700")}>
          {name}
          {isCurrentUser && (
            <span className="ms-1 text-xs text-amber-700">{tr("(You)", "(أنت)")}</span>
          )}
        </p>
      </div>

      {/* Value */}
      <Badge variant="outline" className="flex-shrink-0 font-bold">
        {value.toLocaleString()} {unit}
      </Badge>
    </div>
  );
}

/** How many leaders each tab shows. The hook still fetches 50 for ranking. */
const TOP_N = 5;

/**
 * Top N, plus the current student's own row when she ranks below them —
 * a short board instead of a long list of other students' names.
 */
function visibleRows(entries: LeaderboardEntry[]): { top: LeaderboardEntry[]; me: LeaderboardEntry | null } {
  const top = entries.slice(0, TOP_N);
  const mine = entries.find((e) => e.isCurrentUser) ?? null;
  return { top, me: mine && mine.rank > TOP_N ? mine : null };
}

export function LeaderboardCard() {
  const {
    xpLeaderboard,
    streakLeaderboard,
    weeklyLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  } = useLeaderboard();
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {tr("Global Leaderboard", "لوحة المتصدرين")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="xp">
          <TabsList className="grid grid-cols-3 w-full mb-4 h-auto">
            <TabsTrigger value="xp" className="gap-1.5 min-w-0 h-auto whitespace-normal px-1 py-1.5 text-[11px] sm:text-sm">
              <Trophy className="h-3.5 w-3.5 shrink-0" /> <span className="text-center leading-tight">{tr("XP Ranking", "ترتيب النقاط")}</span>
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-1.5 min-w-0 h-auto whitespace-normal px-1 py-1.5 text-[11px] sm:text-sm">
              <Flame className="h-3.5 w-3.5 shrink-0" /> <span className="text-center leading-tight">{tr("Streak Ranking", "ترتيب الاستمرار")}</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5 min-w-0 h-auto whitespace-normal px-1 py-1.5 text-[11px] sm:text-sm">
              <Zap className="h-3.5 w-3.5 shrink-0" /> <span className="text-center leading-tight">{tr("This Week", "هذا الأسبوع")}</span>
            </TabsTrigger>
          </TabsList>

          {/* XP Tab */}
          <TabsContent value="xp">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : xpLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {tr("No learners on the board yet. Be the first!", "لا يوجد متعلمون في اللوحة بعد. كن الأول!")}
              </p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const { top, me } = visibleRows(xpLeaderboard);
                  return [...top, ...(me ? [me] : [])].map((entry, i) => (
                    <div key={entry.user_id}>
                      {me && i === top.length && (
                        <p className="py-1 text-center text-xs text-muted-foreground" aria-hidden="true">⋯</p>
                      )}
                      <EntryRow
                        rank={entry.rank}
                        name={entry.name}
                        avatarUrl={entry.avatar_url}
                        value={entry.value}
                        unit={tr("XP", "نقطة")}
                        isCurrentUser={entry.isCurrentUser}
                      />
                    </div>
                  ));
                })()}
                {currentUserXpRank && currentUserXpRank > TOP_N && !xpLeaderboard.some((e) => e.isCurrentUser) && (
                  <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                    {tr("Your rank", "ترتيبك")}: <span className="font-bold text-amber-700" dir="ltr">#{currentUserXpRank}</span>
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Streak Tab */}
          <TabsContent value="streak">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : streakLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {tr("No active streaks yet. Start learning daily!", "لا توجد أيام متتالية نشطة بعد. ابدأ التعلّم يوميًا!")}
              </p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const { top, me } = visibleRows(streakLeaderboard);
                  return [...top, ...(me ? [me] : [])].map((entry, i) => (
                    <div key={entry.user_id}>
                      {me && i === top.length && (
                        <p className="py-1 text-center text-xs text-muted-foreground" aria-hidden="true">⋯</p>
                      )}
                      <EntryRow
                        rank={entry.rank}
                        name={entry.name}
                        avatarUrl={entry.avatar_url}
                        value={entry.value}
                        unit={tr("days", "يوم")}
                        isCurrentUser={entry.isCurrentUser}
                      />
                    </div>
                  ));
                })()}
                {currentUserStreakRank && currentUserStreakRank > TOP_N && !streakLeaderboard.some((e) => e.isCurrentUser) && (
                  <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                    {tr("Your streak rank", "ترتيبك في الاستمرار")}: <span className="font-bold text-amber-700" dir="ltr">#{currentUserStreakRank}</span>
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          {/* Weekly XP Tab */}
          <TabsContent value="weekly">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : weeklyLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {tr("No activity this week yet. Start learning!", "لا يوجد نشاط هذا الأسبوع بعد. ابدأ التعلّم!")}
              </p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const { top, me } = visibleRows(weeklyLeaderboard);
                  return [...top, ...(me ? [me] : [])].map((entry, i) => (
                    <div key={entry.user_id}>
                      {me && i === top.length && (
                        <p className="py-1 text-center text-xs text-muted-foreground" aria-hidden="true">⋯</p>
                      )}
                      <EntryRow
                        rank={entry.rank}
                        name={entry.name}
                        avatarUrl={entry.avatar_url}
                        value={entry.value}
                        unit={tr("XP", "نقطة")}
                        isCurrentUser={entry.isCurrentUser}
                      />
                    </div>
                  ));
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
