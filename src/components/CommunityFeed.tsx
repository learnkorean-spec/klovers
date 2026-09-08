import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGES } from "@/constants/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { toPublicDisplayName } from "@/lib/displayName";

interface FeedItem {
  id: string;
  displayName: string;
  badgeKey: string;
  earnedAt: string;
}

const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.key, b]));

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Your achievements feed — the badges YOU have earned, most recent first.
 *
 * This was built as a community feed and never was one. Two independent
 * defects, both silent, both corrected here rather than papered over:
 *
 *   1. It selected `profiles!inner(full_name)`. There is no `full_name` column
 *      on `profiles` — it is `name`. PostgREST rejected every request, `data`
 *      came back null, and the `if (!data) return` below made it look like an
 *      empty feed rather than a failing query. Same defect class as the
 *      `xp_amount` typo that kept the weekly leaderboard dead from launch.
 *   2. A comment here asserted "RLS: student_badges is readable by all
 *      authenticated users (public league data)". That is false. The live
 *      policy is `Users can view own badges` — own row OR admin. Even with the
 *      column fixed, this query can only ever return the caller's own badges.
 *
 * Making it genuinely communal needs a SECURITY DEFINER `get_community_feed()`
 * on the same pattern as the leaderboard RPCs (see
 * supabase/migrations/20260830120000_games_leaderboard_rpcs.sql). That is a
 * migration, so it belongs in its own PR. Until then this is honest about
 * being personal.
 */
export default function CommunityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      // `name`, not `full_name` — see the note above. RLS scopes this to the
      // caller's own rows regardless, which is why the copy says "You".
      const { data, error } = await supabase
        .from("student_badges" as never)
        .select("id, badge_key, created_at, user_id, profiles!inner(name)")
        .order("created_at", { ascending: false })
        .limit(20) as any;

      if (error) {
        console.error("Achievements feed:", error);
        return;
      }
      if (!data) return;

      const feed: FeedItem[] = data
        .filter((r: any) => BADGE_MAP[r.badge_key])
        .map((r: any) => ({
          id: r.id,
          badgeKey: r.badge_key,
          earnedAt: r.created_at,
          // `.split(" ")[0]` was the whole privacy rule here, and it is not
          // enough: a stored name that IS an email has no space in it, so the
          // first "word" is the entire address. That is exactly how a
          // student's gmail address reached rank 10 of the live XP
          // leaderboard on 2026-09-08, rendered to every signed-in visitor. RLS
          // scopes this feed to the caller's own row, so nobody else's address
          // could leak here — but the rule is now one function, applied
          // everywhere a stored name is rendered, rather than a habit repeated
          // by hand at each call site.
          displayName: r.profiles?.name
            ? toPublicDisplayName(r.profiles.name)
            : "You",
        }));

      setItems(feed);
    } catch {
      // Feed is non-critical — fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    // Realtime INSERT on student_badges. Under own-row RLS this delivers only
    // your own inserts — which matches what the query can read anyway.
    const channel = supabase
      .channel("community-badges")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "student_badges" },
        () => fetchFeed()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading community feed" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" aria-hidden="true" />
          Your Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul
          aria-label="Your recent achievements"
          className="divide-y divide-border"
        >
          {items.slice(0, 10).map(item => {
            const badge = BADGE_MAP[item.badgeKey];
            if (!badge) return null;
            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-2xl" aria-hidden="true">{badge.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    <span className="text-primary">{item.displayName}</span>
                    {" earned "}
                    <span className="font-semibold">{badge.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
                <time
                  dateTime={item.earnedAt}
                  className="text-xs text-muted-foreground whitespace-nowrap"
                >
                  {timeAgo(item.earnedAt)}
                </time>
              </li>
            );
          })}
        </ul>
        <div className="px-4 py-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🌏 {items.length}+ achievements earned by the Klovers community
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
