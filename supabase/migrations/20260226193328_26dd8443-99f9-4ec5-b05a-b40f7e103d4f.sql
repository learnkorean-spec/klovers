
CREATE TABLE public.scheduled_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.pkg_groups(id) ON DELETE SET NULL,
  course_title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  registration_url text,
  platforms text[] NOT NULL DEFAULT '{instagram,facebook}',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  posted_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  meta_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.scheduled_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled_social_posts"
  ON public.scheduled_social_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
