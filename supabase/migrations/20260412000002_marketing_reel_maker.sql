-- Marketing Reel Maker: stock video cache + video storage + marketing_posts.video_url

-- 1. Stock video cache table (Pexels results, 24h TTL enforced by edge function)
CREATE TABLE IF NOT EXISTS public.stock_video_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type text NOT NULL,
  query text NOT NULL,
  results jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_video_cache_post_type_fetched
  ON public.stock_video_cache (post_type, fetched_at DESC);

ALTER TABLE public.stock_video_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock_video_cache"
  ON public.stock_video_cache
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Add video_url column to marketing_posts
ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS video_url text;

-- 3. Marketing videos storage bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-videos', 'marketing-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload marketing videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update marketing videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'marketing-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete marketing videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view marketing videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-videos');
