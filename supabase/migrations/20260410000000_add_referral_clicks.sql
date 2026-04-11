-- Track unique visitors who click referral links (for +2% sharing bonus)
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  visitor_fingerprint text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_user_id, visitor_fingerprint)
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own clicks" ON public.referral_clicks;
CREATE POLICY "Users can view own clicks"
  ON public.referral_clicks
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Admins manage clicks" ON public.referral_clicks;
CREATE POLICY "Admins manage clicks"
  ON public.referral_clicks
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow the service role to insert (used by the edge function)
DROP POLICY IF EXISTS "Service role inserts clicks" ON public.referral_clicks;
CREATE POLICY "Service role inserts clicks"
  ON public.referral_clicks
  FOR INSERT
  WITH CHECK (true);
