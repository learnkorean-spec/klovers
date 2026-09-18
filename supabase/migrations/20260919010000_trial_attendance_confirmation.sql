-- "I have finished marking this session."
--
-- Marking a student writes immediately (trial_bookings.attended), and that does
-- not change: nothing is lost to a closed tab, and there is no unsaved state to
-- lose. What was missing is the moment that says the session is DONE with --
-- without it, a session nobody has opened and a session whose answers are final
-- look exactly alike, and every mark stays provisional forever.
--
-- That is what this records. One row per session.
--
-- ── Why its own table, and not a column on trial_slots ──────────────────────
--
-- `advance_trial_slots()` rewrites `trial_date` on a slot once its class has
-- run, rolling it a week forward so the calendar never shows a past date. A
-- confirmation stored on the slot would silently travel with it to a date it
-- was never about -- Friday's answers would reappear as next Friday's. A
-- session's history has to outlive the slot that hosted it, so it is keyed on
-- the session itself: (trial_date, start_time), the same pair that identifies a
-- session everywhere else here.
--
-- ── What confirming does NOT do ─────────────────────────────────────────────
--
-- It settles nothing about students still marked "not decided yet". They stay
-- undecided. "I am done looking at this session" and "everyone I did not mark
-- was absent" are different claims, and nothing here turns the first into the
-- second -- which is the whole reason the mark has three states.

create table if not exists public.trial_attendance_confirmations (
  trial_date   date        not null,
  start_time   text        not null,
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid        references auth.users(id) on delete set null,
  primary key (trial_date, start_time)
);

comment on table public.trial_attendance_confirmations is
  'One row per trial session whose attendance the admin has finished marking. Keyed on (trial_date, start_time) rather than a slot id, because advance_trial_slots() moves a slot''s date forward after its class runs and this record must not travel with it.';

alter table public.trial_attendance_confirmations enable row level security;

-- Admin-only, all four verbs. A student has no business reading whether a
-- session has been reviewed, and the row carries another admin's user id.
drop policy if exists "Admins read trial attendance confirmations"   on public.trial_attendance_confirmations;
drop policy if exists "Admins write trial attendance confirmations"  on public.trial_attendance_confirmations;
drop policy if exists "Admins reopen trial attendance confirmations" on public.trial_attendance_confirmations;

create policy "Admins read trial attendance confirmations"
  on public.trial_attendance_confirmations
  for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

create policy "Admins write trial attendance confirmations"
  on public.trial_attendance_confirmations
  for insert to authenticated
  with check (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    -- The confirmer is whoever is pressing the button, never a name typed in.
    and (confirmed_by is null or confirmed_by = (select auth.uid()))
  );

-- Reopening a session is deleting its confirmation. Allowed, and on purpose:
-- a wrong answer that cannot be reopened is a wrong answer kept forever.
create policy "Admins reopen trial attendance confirmations"
  on public.trial_attendance_confirmations
  for delete to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));
