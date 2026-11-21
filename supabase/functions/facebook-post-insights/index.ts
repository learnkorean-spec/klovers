// Reads reach and engagement for the Klovers Facebook Page's recent posts and
// stores them in fb_post_insights, so "how many people saw this post, and how
// many trial bookings did its link bring" has an answer.
//
// Runs daily from pg_cron (trigger_facebook_post_insights, service role) and on
// demand from the admin dashboard (admin JWT). It re-reads the last posts every
// time because reach keeps growing for days after a post goes out.
//
// Uses the same Page token as facebook-telegram-sync (secret
// facebook_page_access_token). Reading insights needs the read_insights
// permission on that token; when it is missing the call still stores reactions,
// comments and shares and records the Graph error per post in insights_error,
// so the dashboard can say exactly what to fix.
//
// Body (all optional): { "dry_run": true } returns what it found without
// storing; { "limit": 25 } caps the posts read (1 to 50).

import { authorizeRequest } from "../_shared/authorize.ts";
import { parseInsights, parseUtm, scrub } from "../_shared/fbInsights.ts";

const GRAPH = "https://graph.facebook.com/v25.0";
const METRICS = "post_total_media_view_unique,post_media_view";
// The Klovers Facebook Page. It is owned by the KLovers business portfolio, so
// it never shows up in me/accounts; asking for it by id is what works.
const PAGE_ID = Deno.env.get("facebook_page_id") ?? "2190017347877607";

type FbPost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  shares?: { count?: number };
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function mapLimit<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

Deno.serve(async (req) => {
  const auth = await authorizeRequest(req, "admin-or-service");
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  // Read the secret per request so a rotated token is used straight away.
  const storedToken = Deno.env.get("facebook_page_access_token");
  if (!storedToken) {
    return json({ error: "facebook_page_access_token secret not set" }, 500);
  }

  // The secret may hold a Page token, a user token or a business system-user
  // token. Exchange it for the Page's own token; if that fails (it already is
  // the Page token, or lacks access) keep the stored one.
  let FB_PAGE_TOKEN = storedToken;
  let tokenSource = "stored";
  try {
    const r = await fetch(`${GRAPH}/${PAGE_ID}?fields=access_token&access_token=${storedToken}`);
    const p = await r.json();
    if (typeof p?.access_token === "string" && p.access_token) {
      FB_PAGE_TOKEN = p.access_token;
      tokenSource = "page_from_stored";
    }
  } catch {
    // keep the stored token
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body?.dry_run === true;
  const limit = Math.min(50, Math.max(1, Number(body?.limit) || 25));

  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "shares",
    "reactions.limit(0).summary(true)",
    "comments.limit(0).summary(true)",
  ].join(",");

  let posts: FbPost[];
  try {
    const res = await fetch(
      `${GRAPH}/${PAGE_ID}/posts?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${FB_PAGE_TOKEN}`,
    );
    const payload = await res.json();
    if (!res.ok || !Array.isArray(payload?.data)) {
      return json({ error: "facebook fetch failed", token_source: tokenSource, detail: scrub(scrub(JSON.stringify(payload?.error ?? payload), FB_PAGE_TOKEN), storedToken) }, 502);
    }
    posts = payload.data as FbPost[];
  } catch (e) {
    return json({ error: "facebook fetch failed", token_source: tokenSource, detail: scrub(scrub(String(e), FB_PAGE_TOKEN), storedToken) }, 502);
  }

  const rows = await mapLimit(posts, 5, async (post) => {
    let insights: ReturnType<typeof parseInsights>;
    try {
      const res = await fetch(
        `${GRAPH}/${post.id}/insights?metric=${METRICS}&access_token=${FB_PAGE_TOKEN}`,
      );
      insights = parseInsights(await res.json());
    } catch (e) {
      insights = { reach: null, media_views: null, error: scrub(String(e), FB_PAGE_TOKEN) };
    }
    const utm = parseUtm(post.message);
    return {
      post_id: post.id,
      posted_at: post.created_time ?? null,
      message: post.message?.slice(0, 600) ?? null,
      permalink_url: post.permalink_url ?? null,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      reach: insights.reach,
      media_views: insights.media_views,
      reactions: post.reactions?.summary?.total_count ?? null,
      comments: post.comments?.summary?.total_count ?? null,
      shares: post.shares?.count ?? 0,
      insights_error: insights.error ? scrub(insights.error, FB_PAGE_TOKEN) : null,
      fetched_at: new Date().toISOString(),
    };
  });

  const summary = rows.map((r) => ({
    post_id: r.post_id,
    posted_at: r.posted_at,
    utm_content: r.utm_content,
    reach: r.reach,
    media_views: r.media_views,
    reactions: r.reactions,
    comments: r.comments,
    shares: r.shares,
    insights_error: r.insights_error,
  }));
  const withInsights = rows.filter((r) => r.reach !== null).length;

  if (dryRun) {
    return json({ dry_run: true, token_source: tokenSource, checked: rows.length, with_insights: withInsights, posts: summary });
  }

  const { error } = await auth.serviceClient
    .from("fb_post_insights")
    .upsert(rows, { onConflict: "post_id" });

  if (error) {
    // 42P01 / PGRST205: the table is not there yet (migration not applied).
    console.error("fb_post_insights upsert failed", error.code, error.message);
    return json(
      {
        stored: false,
        reason: `${error.code ?? "error"}: ${error.message}`.slice(0, 200),
        checked: rows.length,
        with_insights: withInsights,
        posts: summary,
      },
      error.code === "42P01" || error.code === "PGRST205" ? 200 : 500,
    );
  }

  return json({ stored: true, checked: rows.length, with_insights: withInsights });
});
