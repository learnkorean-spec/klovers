-- Admin → Accounts map.
--
-- Re, 1 Oct 2026: "add those as a map in admin dashboard" — every account and
-- platform Klovers runs on, grouped by the login used to open it (which email
-- goes with GitHub, Vercel, Resend, GA4 ...).
--
-- Why a table and not a constant in the React code: anything in src/ ships in
-- the public JavaScript bundle, admin route or not. Login emails do not belong
-- there. Here they sit behind RLS, readable by admins only.
--
-- NO passwords, keys or tokens are stored here, and none may be added. The
-- column is `login` (which email / account name), never a secret.
--
-- Idempotent: safe to run twice (IF NOT EXISTS, DROP POLICY IF EXISTS,
-- ON CONFLICT DO NOTHING), so a direct apply followed by the Apply Migrations
-- workflow cannot fail or duplicate rows.

CREATE TABLE IF NOT EXISTS public.admin_accounts_map (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service     text        NOT NULL UNIQUE,
  login       text        NOT NULL DEFAULT '',
  detail      text        NOT NULL DEFAULT '',
  url         text,
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'watch', 'closed')),
  sort_order  integer     NOT NULL DEFAULT 100,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_accounts_map IS
  'Admin-only map of Klovers accounts: which login opens which platform. Never store passwords, API keys or tokens here.';

ALTER TABLE public.admin_accounts_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admin_accounts_map" ON public.admin_accounts_map;
CREATE POLICY "Admins manage admin_accounts_map" ON public.admin_accounts_map
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

REVOKE ALL ON public.admin_accounts_map FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_accounts_map TO authenticated;

-- Seed: the accounts registry as of 1 Oct 2026 (claude/ACCOUNTS_REGISTRY.md).
-- login = '' means the sign-in email is not recorded yet; the screen shows it
-- as "Login not recorded" so it can be filled in from the admin page.
INSERT INTO public.admin_accounts_map (service, login, detail, url, status, sort_order) VALUES
  ('GitHub · learnkorean-spec', 'elshrkawyreham94@gmail.com',
   'Repo learnkorean-spec/klovers. The merge and deploy account: Vercel deploys only commits by this account.',
   'https://github.com/learnkorean-spec/klovers', 'active', 10),
  ('Vercel', 'elshrkawyreham94@gmail.com',
   'Team learnkorean-specs-projects, project klovers. Signs in through GitHub. Hobby plan: 100 deploys per 24 h.',
   'https://vercel.com/learnkorean-specs-projects/klovers', 'active', 11),
  ('Google Business Profile', 'elshrkawyreham94@gmail.com',
   'Klovers, language school. Verification not successful (27 Sep); Bookings locked until verified.',
   'https://business.google.com/locations', 'watch', 12),

  ('Resend', 'reham.elshrkawy@gmail.com',
   'Account reham.elshrkawy. One key left: Supabase SMTP (used by the site, do not touch).',
   'https://resend.com', 'active', 20),
  ('Teacher brief emails', 'reham.elshrkawy@gmail.com',
   'The day-before class brief is sent to this address.',
   NULL, 'active', 21),

  ('Google Analytics (GA4)', 'learnkorean@kloversegy.com',
   'Property Korean Course Site (p505896753), opened in Chrome as authuser=2. The kloversegy.com Workspace is paused: add a Gmail admin before this sign-in stops working.',
   'https://analytics.google.com/analytics/web/?authuser=2#/a369125168p505896753/reports/intelligenthome', 'watch', 30),

  ('GitHub · rehamelshrkawy-coder', 'rehamelshrkawy-coder (GitHub)',
   'Developer account, linked to Vercel. Its old klovers repo was deleted on 26 Sep. Email not recorded.',
   'https://github.com/rehamelshrkawy-coder', 'active', 40),

  ('Supabase', '',
   'Project ewtdgpbybkceokfohhyg. Opened in Chrome profile Reham, signed in with the Klovers account.',
   'https://supabase.com/dashboard/project/ewtdgpbybkceokfohhyg', 'active', 50),
  ('Stripe', '',
   'Account Klovers (acct_1Szsbi0wef58ZOPW). Default currency MYR: pick USD or EGP by hand on every price.',
   'https://dashboard.stripe.com/acct_1Szsbi0wef58ZOPW/products', 'active', 51),
  ('Meta Business Suite', '',
   'Facebook page Kloversegy, Instagram kloversegy and the Klovers Facebook group. Posts are scheduled in the Planner.',
   'https://business.facebook.com/latest/content_calendar', 'active', 52),
  ('OpenAI', '',
   'Key OPENAI_API_KEY is stored in Supabase secrets (admin AI tools).',
   'https://platform.openai.com/api-keys', 'active', 53),
  ('Canva', '',
   'Colouring book design. AI image credits ran out on 30 Sep.',
   'https://www.canva.com', 'watch', 54),
  ('TikTok', '', '@kloversegy', 'https://www.tiktok.com/@kloversegy', 'active', 55),
  ('Telegram', '', 'Klovers Academy channel and groups.', 'https://t.me/kloversnet', 'active', 56),
  ('Microsoft Teams', '', 'Class meetings (links stored per student).', 'https://teams.microsoft.com', 'active', 57),

  ('Lovable', '',
   'Project K-Lovers Hub deleted on 26 Sep 2026; domain and GitHub disconnected.',
   NULL, 'closed', 90)
ON CONFLICT (service) DO NOTHING;
