-- Blog attraction ranking: view_count, featured flag, seo_priority
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS view_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seo_priority  INTEGER NOT NULL DEFAULT 0;

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_blog_posts_ranking
  ON blog_posts (featured DESC, seo_priority DESC, view_count DESC, published_at DESC);

-- RPC: increment view count (called from frontend on article open)
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND published = TRUE;
END;
$$;

-- Grant execute to anon (public visitors can increment)
GRANT EXECUTE ON FUNCTION increment_blog_view(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_view(TEXT) TO authenticated;
