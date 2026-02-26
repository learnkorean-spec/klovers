
CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.pkg_groups(id) ON DELETE SET NULL,
  caption_text text NOT NULL DEFAULT '',
  ad_primary_text text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url_1x1 text,
  image_url_4x5 text,
  image_url_story text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing_posts"
  ON public.marketing_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-images', 'marketing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload marketing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update marketing images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete marketing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view marketing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-images');
