-- Pause the blog_posts "publish" -> ping-search-engines trigger.
--
-- WHY
-- A post published today has no prerendered HTML file: the route list in
-- scripts/prerender-meta.mjs is hand-maintained and cannot know about a post
-- created after it was last edited (docs/SEO_DIAGNOSIS.md, finding #2).
-- Pinging IndexNow at the moment of publish therefore invites Bing, Yandex,
-- Naver and Seznam to crawl a blank shell carrying the site-wide default
-- title. Repeated across posts, that teaches those engines the blog produces
-- near-identical low-value pages.
--
-- Pause the ping until rendering option A1 is live
-- (docs/DECISIONS.md, 2026-08-19 "Mitigation").
--
-- WHAT THIS DOES NOT TOUCH
--   * cron job 'daily-ping-search-engines' (0 8 * * *, jobid 1) - keeps running
--   * the ping-search-engines edge function - still callable manually by admin
--   * the function notify_search_engines_on_publish() - left exactly as it is
--     on the live database, including its SET search_path clause
--
-- DISABLE TRIGGER only flips pg_trigger.tgenabled from 'O' (origin) to 'D'
-- (disabled). The trigger and its function both stay in place.
--
-- TO RE-ENABLE (after A1 is deployed) run the matching ENABLE:
--
--     ALTER TABLE public.blog_posts ENABLE TRIGGER on_blog_post_published;
--
-- Guarded so that replaying this migration against a database where the
-- trigger has already been renamed or removed is a no-op rather than an error.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'blog_posts'
      AND t.tgname  = 'on_blog_post_published'
      AND NOT t.tgisinternal
  ) THEN
    ALTER TABLE public.blog_posts DISABLE TRIGGER on_blog_post_published;
    RAISE NOTICE 'Paused trigger on_blog_post_published on public.blog_posts.';
  ELSE
    RAISE NOTICE 'Trigger on_blog_post_published not found - nothing to pause.';
  END IF;
END $$;
