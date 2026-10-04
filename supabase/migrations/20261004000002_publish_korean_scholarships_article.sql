-- Publish the two scholarships-guide rows (Re, 4 Oct 2026)
-- =====================================================================
--
-- WHY THIS IS A SECOND FILE RATHER THAN AN EDIT TO THE FIRST ONE
--
-- 20261004000001 inserts both rows with `published = false`, so that the copy can
-- be read before it is public, and it deliberately leaves `published` out of its
-- ON CONFLICT update: re-running the insert can never flip an article either way.
-- Publishing is therefore a separate, deliberate act, and this file is that act.
--
-- WHAT HAPPENS WHEN THIS RUNS
--
-- `on_blog_post_published` fires on the transition to published = true and calls
-- the ping-search-engines function, which notifies Bing and IndexNow (and through
-- IndexNow, the engines that participate in it). **Google is not notified**: it
-- retired the sitemap ping endpoint in June 2023, so Google finds the article
-- through the sitemap and by crawling the internal links. Submitting the URL in
-- Search Console stays a manual, one-off step.
--
-- IDEMPOTENT BY DESIGN: the WHERE clause only matches rows that are still
-- unpublished, so re-running changes nothing and cannot re-ping for an article
-- that is already live. published_at is only set if it is empty, so the date the
-- article first went live is never rewritten by a later run.
--
-- REVERSING THIS: set published = false for the two slugs. The rows stay, the
-- article leaves the site, and the match block's journal link disappears on its
-- own because it asks whether the row is published before it renders.

UPDATE blog_posts
   SET published = true,
       published_at = COALESCE(published_at, NOW()),
       updated_at = NOW()
 WHERE slug IN ('korean-scholarships-guide', 'korean-scholarships-guide-ar')
   AND published = false;
