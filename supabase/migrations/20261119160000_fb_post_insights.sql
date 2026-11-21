-- Facebook Page post reach and engagement, one row per Page post, plus the
-- per-post booking count.
--
-- Why: the social tool never stored reach or engagement (scheduled_social_posts
-- .meta_result is empty for every row), so "how many bookings did each post
-- bring" had no answer. The Page access token that facebook-telegram-sync
-- already uses can read post insights; the edge function facebook-post-insights
-- fills this table once a day and public.fb_post_performance() joins it to
-- lead_events by the utm_content found in each post's own text.
--
-- Additive only: one new table, one new function, one new cron job. Nothing
-- existing is altered. Every statement is idempotent so a re-run is harmless.

create table if not exists public.fb_post_insights (
  post_id        text primary key,
  posted_at      timestamptz,
  message        text,
  permalink_url  text,
  utm_campaign   text,
  utm_content    text,
  -- post_total_media_view_unique: unique viewers (replaces post_impressions_unique,
  -- removed by Meta in 2026). media_views counts every view, repeat views included.
  reach          integer,
  media_views    integer,
  reactions      integer,
  comments       integer,
  shares         integer,
  insights_error text,
  fetched_at     timestamptz not null default now()
);

alter table public.fb_post_insights enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'fb_post_insights'
      and policyname = 'fb_post_insights_admin_read'
  ) then
    create policy fb_post_insights_admin_read
      on public.fb_post_insights
      for select
      using (public.has_role((select auth.uid()), 'admin'::app_role));
  end if;
end $$;

create index if not exists fb_post_insights_posted_at_idx
  on public.fb_post_insights (posted_at desc);

-- Posts joined to the visits and bookings their link brought in. Matching is on
-- utm_content, so give every post its own value (post1, post2, ...).
create or replace function public.fb_post_performance()
returns table (
  post_id       text,
  posted_at     timestamptz,
  message       text,
  permalink_url text,
  utm_content   text,
  reach         integer,
  media_views   integer,
  reactions     integer,
  comments      integer,
  shares        integer,
  insights_error text,
  fetched_at    timestamptz,
  sessions      integer,
  bookings      integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role((select auth.uid()), 'admin'::app_role) then
    raise exception 'admin only';
  end if;

  return query
  with per_session as (
    select
      e.utm_content as c,
      e.session_id,
      bool_or(e.source_type = 'free_trial' and e.cta_label = 'trial_booked_confirmed') as booked
    from public.lead_events e
    where e.utm_source ilike 'facebook'
      and nullif(e.utm_content, '') is not null
    group by e.utm_content, e.session_id
  ),
  agg as (
    select c,
           count(*)::int as sessions,
           (count(*) filter (where booked))::int as bookings
    from per_session
    group by c
  )
  select
    p.post_id, p.posted_at, p.message, p.permalink_url, p.utm_content,
    p.reach, p.media_views, p.reactions, p.comments, p.shares,
    p.insights_error, p.fetched_at,
    coalesce(a.sessions, 0), coalesce(a.bookings, 0)
  from public.fb_post_insights p
  left join agg a on a.c = p.utm_content
  order by p.posted_at desc nulls last;
end;
$$;

revoke all on function public.fb_post_performance() from public, anon;
grant execute on function public.fb_post_performance() to authenticated;

-- Daily refresh. Reach keeps growing for a few days after a post, so the
-- function re-reads the last 25 posts every run instead of only new ones.
create or replace function public.trigger_facebook_post_insights()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform app_private.invoke_edge('facebook-post-insights', '{}'::jsonb, false, 90000);
end;
$$;

-- Only the cron job (postgres) should fire this; keep it off the public API.
revoke all on function public.trigger_facebook_post_insights() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'facebook-post-insights-daily') then
    perform cron.unschedule('facebook-post-insights-daily');
  end if;
  perform cron.schedule(
    'facebook-post-insights-daily',
    '0 18 * * *',
    $cron$set statement_timeout = '120s'; select public.trigger_facebook_post_insights();$cron$
  );
end $$;
