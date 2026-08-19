-- Re-enable the blog_posts "publish" -> ping-search-engines trigger.
--
-- Mirror of 20260819113000_pause_blog_publish_ping_trigger.sql, which paused it
-- on 2026-08-19 while Option A1 was built.
--
-- WHY IT IS SAFE TO TURN BACK ON
-- A1 is live (PR #46, deployed 2026-08-19 11:57 UTC). A blog post URL now
-- serves its own title, its own self-referencing canonical, article Open Graph
-- tags and BlogPosting JSON-LD, instead of the site-wide homepage title and the
-- homepage's canonical. Verified on production:
--   /blog/korean-conditional-sentences-guide
--     title     "Korean Conditional Sentences: How to Use -으면 and -다면 | Klovers"
--     canonical https://kloversegy.com/blog/korean-conditional-sentences-guide
--
-- The reason for the pause - pinging search engines at a URL that served a
-- duplicate of the homepage - no longer applies.
--
-- WHAT THIS DOES NOT CHANGE
--   * cron job 'daily-ping-search-engines' (0 8 * * *) - unchanged, still active
--   * the ping-search-engines edge function - unchanged
--   * the function notify_search_engines_on_publish() - untouched, including
--     its SET search_path clause. ENABLE TRIGGER only flips
--     pg_trigger.tgenabled from 'D' back to 'O'.
--
-- KNOWN RESIDUAL GAP (not introduced by this migration)
-- A1 reads published slugs at BUILD time, so a post published between deploys
-- has no prerendered file until the site is next built; until then it is served
-- the neutral shell (generic title, no canonical). The daily cron already pings
-- every published post regardless, so this trigger does not create that
-- exposure - it only makes the first ping immediate rather than up to 24 hours
-- later. The real fix is a deploy hook that rebuilds on publish; tracked
-- separately.
--
-- TO PAUSE AGAIN:
--
--     ALTER TABLE public.blog_posts DISABLE TRIGGER on_blog_post_published;
--
-- Guarded so replaying this against a database where the trigger was renamed or
-- removed is a no-op rather than an error.

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
    ALTER TABLE public.blog_posts ENABLE TRIGGER on_blog_post_published;
    RAISE NOTICE 'Re-enabled trigger on_blog_post_published on public.blog_posts.';
  ELSE
    RAISE NOTICE 'Trigger on_blog_post_published not found - nothing to enable.';
  END IF;
END $$;
