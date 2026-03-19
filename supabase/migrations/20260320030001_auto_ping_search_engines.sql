-- Auto ping search engines on blog post publish + daily schedule
-- Uses pg_cron (already enabled) + pg_net for HTTP calls

-- ── 1. Daily cron: ping all search engines at 08:00 UTC ──────────────
SELECT cron.schedule(
  'daily-ping-search-engines',       -- job name (unique)
  '0 8 * * *',                       -- every day at 08:00 UTC
  $$
  SELECT net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/ping-search-engines',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── 2. Function: trigger ping when blog post is published ─────────────
CREATE OR REPLACE FUNCTION notify_search_engines_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when a post transitions to published=true
  IF (NEW.published = true AND (OLD.published IS DISTINCT FROM true)) THEN
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url', true) || '/functions/v1/ping-search-engines',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := jsonb_build_object('trigger', 'blog_publish', 'slug', NEW.slug)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger to blog_posts table ────────────────────────────
DROP TRIGGER IF EXISTS on_blog_post_published ON blog_posts;

CREATE TRIGGER on_blog_post_published
  AFTER INSERT OR UPDATE OF published
  ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_search_engines_on_publish();
