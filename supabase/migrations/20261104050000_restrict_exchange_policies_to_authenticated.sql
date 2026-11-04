-- Consistency/defense-in-depth fix for the policies added in
-- 20261104030000_exchange_gender_and_notifications.sql and
-- 20261104040000_exchange_chat.sql: every other policy in this schema is
-- written `for select to authenticated using (...)`, explicitly restricting
-- the policy to the authenticated role. The six new policies on
-- exchange_profiles (select_matched), exchange_notifications and
-- exchange_messages were written without `to authenticated`, so Postgres
-- defaulted them to PUBLIC (both anon and authenticated).
--
-- Not a live hole -- every one of those policies' USING/WITH CHECK clauses
-- compares against auth.uid(), which is NULL for an anon request, so anon
-- was already denied in practice (NULL never equals a uuid or appears in an
-- IN list). This closes the gap anyway for consistency with the rest of the
-- schema, and because a PUBLIC-role policy is flagged by security scanners
-- as broader than necessary even when functionally harmless.

drop policy if exists "exchange_profiles_select_matched" on public.exchange_profiles;
create policy "exchange_profiles_select_matched"
  on public.exchange_profiles for select to authenticated
  using (
    exists (
      select 1 from public.exchange_matches m
      where (select auth.uid()) in (m.user_a, m.user_b)
        and exchange_profiles.user_id in (m.user_a, m.user_b)
        and exchange_profiles.user_id <> (select auth.uid())
    )
  );

drop policy if exists "exchange_notifications_select_own" on public.exchange_notifications;
create policy "exchange_notifications_select_own"
  on public.exchange_notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "exchange_notifications_update_own" on public.exchange_notifications;
create policy "exchange_notifications_update_own"
  on public.exchange_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "exchange_notifications_admin_all" on public.exchange_notifications;
create policy "exchange_notifications_admin_all"
  on public.exchange_notifications for all to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

drop policy if exists "exchange_messages_select_participant" on public.exchange_messages;
create policy "exchange_messages_select_participant"
  on public.exchange_messages for select to authenticated
  using (
    exists (
      select 1 from public.exchange_matches m
      where m.id = exchange_messages.match_id
        and (select auth.uid()) in (m.user_a, m.user_b)
    )
  );

drop policy if exists "exchange_messages_insert_participant" on public.exchange_messages;
create policy "exchange_messages_insert_participant"
  on public.exchange_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.exchange_matches m
      where m.id = exchange_messages.match_id
        and (select auth.uid()) in (m.user_a, m.user_b)
        and not exists (
          select 1 from public.exchange_blocks b
          where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
             or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
        )
    )
  );

drop policy if exists "exchange_messages_admin_all" on public.exchange_messages;
create policy "exchange_messages_admin_all"
  on public.exchange_messages for all to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));
