CREATE TABLE public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_email text NOT NULL,
  converted_at timestamptz NOT NULL DEFAULT now(),
  xp_awarded boolean NOT NULL DEFAULT false,
  UNIQUE(referrer_user_id, referred_email)
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referral_conversions
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins manage referrals"
  ON public.referral_conversions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
