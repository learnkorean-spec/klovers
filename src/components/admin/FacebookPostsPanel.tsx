import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ExternalLink } from "lucide-react";

/**
 * Facebook posts: how many people saw each one, and how many visits and trial
 * bookings its link brought in.
 *
 * Reach and engagement come from the Page's own insights, filled daily by the
 * facebook-post-insights edge function. Visits and bookings are matched on the
 * utm_content found in each post's link (post1, post2, ...), so every post
 * needs its own utm_content for its numbers to be its own.
 * Read-only apart from the Refresh button.
 */

export interface FbPostRow {
  post_id: string;
  posted_at: string | null;
  message: string | null;
  permalink_url: string | null;
  utm_content: string | null;
  reach: number | null;
  media_views: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  insights_error: string | null;
  fetched_at: string | null;
  sessions: number;
  bookings: number;
}

const num = (n: number | null | undefined) => (n === null || n === undefined ? "–" : n.toLocaleString("en-GB"));

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Cairo" }) : "–";

const preview = (text: string | null) => {
  const flat = (text ?? "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  return flat.length > 70 ? `${flat.slice(0, 70)}…` : flat || "(no text)";
};

export default function FacebookPostsPanel() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: ["fb-post-performance"],
    queryFn: async () => {
      // Not in the generated types yet: the function ships with its migration.
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: FbPostRow[] | null; error: { message: string } | null }>;
      }).rpc("fb_post_performance");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    retry: false,
  });

  const refresh = async () => {
    setRefreshing(true);
    setRefreshNote(null);
    const { data: result, error: invokeError } = await supabase.functions.invoke("facebook-post-insights", { body: {} });
    if (invokeError) setRefreshNote(`Refresh failed: ${invokeError.message}`);
    else if (result?.stored === false) setRefreshNote(`Posts read but not saved yet: ${result.reason ?? "table missing"}`);
    else setRefreshNote(`Read ${result?.checked ?? 0} posts, ${result?.with_insights ?? 0} with reach.`);
    await queryClient.invalidateQueries({ queryKey: ["fb-post-performance"] });
    setRefreshing(false);
  };

  const rows = data ?? [];
  const firstError = rows.find((r) => r.insights_error)?.insights_error ?? null;
  const missingSetup = !!error;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Facebook posts: reach and bookings</CardTitle>
        <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing || missingSetup} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {missingSetup && (
          <p className="text-sm text-muted-foreground">
            Reach tracking is not set up yet. It needs the fb_post_insights database migration to be applied.
          </p>
        )}

        {!isLoading && !missingSetup && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No posts saved yet. Press Refresh to read the Page's latest posts.
          </p>
        )}

        {firstError && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            Facebook did not return reach for some posts: {firstError}. Reactions, comments and shares are still saved.
            Reach needs the read_insights permission on the Page token.
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Date</th>
                  <th className="py-1.5 pr-3 font-medium">Post</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Reach</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Views</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Reactions</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Comments</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Shares</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Visits</th>
                  <th className="py-1.5 text-right font-medium">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.post_id} className="border-b last:border-0 align-top">
                    <td className="whitespace-nowrap py-1.5 pr-3">{day(r.posted_at)}</td>
                    <td className="py-1.5 pr-3">
                      <span>{preview(r.message)}</span>
                      {r.utm_content ? (
                        <span className="ml-1.5 rounded bg-muted px-1 text-[10px] text-muted-foreground">{r.utm_content}</span>
                      ) : null}
                      {r.permalink_url ? (
                        <a href={r.permalink_url} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex align-middle text-muted-foreground hover:text-foreground" aria-label="Open post">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.reach)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.media_views)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.reactions)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.comments)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.shares)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.utm_content ? num(r.sessions) : "–"}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{r.utm_content ? num(r.bookings) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Reach is unique viewers (Meta's post_total_media_view_unique); Views counts repeat views too. Visits and
            Bookings only count sessions that arrived through a link carrying the post's own utm_content.
          </p>
        )}
        {refreshNote && <p className="text-xs text-muted-foreground">{refreshNote}</p>}
      </CardContent>
    </Card>
  );
}
