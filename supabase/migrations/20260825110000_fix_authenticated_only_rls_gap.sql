-- Closes a live authorization gap found in a read-only admin-panel audit
-- (25 Aug 2026): three RLS policies checked `auth.role() = 'authenticated'`
-- instead of an actual role/ownership check. `auth.role() = 'authenticated'`
-- is true for EVERY logged-in user - a regular student account, not just
-- an admin - so any authenticated user could call these tables directly
-- via the Supabase client/REST API, bypassing the admin-only UI entirely:
--
--   promo_codes (ALL)               - create/edit/delete discount codes,
--                                      including a self-issued 100%-off code
--   achievement_milestones (UPDATE) - overwrite ANY user's progress row
--   achievement_milestones (INSERT) - insert a milestone row for ANY user_id
--
-- Same root cause in three places - one migration, not three unrelated fixes.
--
-- promo_codes: no legitimate caller of this policy is anyone but an admin -
-- the only UI that touches this table is the admin PromoCodesManager screen.
-- Switches to public.has_role(auth.uid(), 'admin'), the same check already
-- used everywhere else admin-only write access is enforced in this schema.
--
-- achievement_milestones: the two broken policies were labelled "Service
-- role can ..." but service-role calls bypass RLS entirely regardless of
-- what a policy says - that label never described what the policy actually
-- gated. It always gated ordinary authenticated calls, and the app's own
-- client hook (src/hooks/useMilestones.ts) always writes through the
-- authenticated role, filtered to the signed-in user's own rows. The
-- existing SELECT policy on this table already uses the correct pattern
-- (auth.uid() = user_id); INSERT/UPDATE now match it. This closes the
-- cross-user write without changing anything the app itself does.

BEGIN;

DROP POLICY IF EXISTS "Admin can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admin can manage promo codes"
  ON public.promo_codes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role can update milestones" ON public.achievement_milestones;
CREATE POLICY "Users can update their own milestones"
  ON public.achievement_milestones
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert milestones" ON public.achievement_milestones;
CREATE POLICY "Users can insert their own milestones"
  ON public.achievement_milestones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
