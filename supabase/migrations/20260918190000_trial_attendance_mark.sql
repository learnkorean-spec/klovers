-- Who actually came to a trial.
--
-- Until now the database could not answer that question at all. What it had:
--
--   attendance_response   what she SAID, days before the class
--   status                where the booking is, not whether she showed up
--
-- Both are about the booking. Neither is about the room. So the letter that
-- follows a trial is aimed by the clock -- `starts_at + duration + 2h` -- and
-- is written in deliberately neutral words, because it cannot know whether the
-- reader was there. That is the right call while the fact is unknown; this
-- makes the fact knowable.

alter table public.trial_bookings
  add column if not exists attended boolean,
  add column if not exists attendance_marked_at timestamptz,
  add column if not exists attendance_marked_by uuid references auth.users(id) on delete set null;

comment on column public.trial_bookings.attended is
  'Did this student actually attend the trial. true = came, false = did not, NULL = nobody has answered yet. NULL never means "did not come" -- anything reading this column must treat the three states as three states.';
comment on column public.trial_bookings.attendance_marked_at is
  'When attended was last recorded. Distinct from attendance_responded_at, which is when the STUDENT predicted her attendance beforehand.';
comment on column public.trial_bookings.attendance_marked_by is
  'The admin who recorded attended.';

-- The card on /admin/today asks for recent sessions still holding unanswered
-- rows. A partial index keeps that cheap as the table grows, and costs nothing
-- once a day has been fully marked, because the rows leave the index.
create index if not exists trial_bookings_attendance_unmarked_idx
  on public.trial_bookings (trial_date)
  where attended is null;

-- ── Public INSERT policy, recreated ─────────────────────────────────────────
--
-- The booking form is reachable by anon. The existing policy already requires
-- every admin-written field to be NULL on insert -- the attendance response,
-- the four follow-up stamps, the confirmation timestamps -- so that a person
-- cannot pre-write a fact the system will later trust about her. `attended` is
-- exactly such a field, and the letters aimed at it are the reason it matters.
--
-- Everything below the three new lines is reproduced verbatim from the live
-- policy; this adds to it and changes nothing else.

drop policy if exists "Public can request a trial booking" on public.trial_bookings;

create policy "Public can request a trial booking"
  on public.trial_bookings
  for insert
  to anon, authenticated
  with check (
    ((user_id is null) or (user_id = (select auth.uid())))
    and ((status is null) or (status = 'pending'::text))
    and (email_verified_at is null)
    and (confirmed_at is null)
    and (attendance_confirmed_at is null)
    and (attendance_responded_at is null)
    and (attendance_response is null)
    -- new: an attendance mark is the admin's to write, never the booker's
    and (attended is null)
    and (attendance_marked_at is null)
    and (attendance_marked_by is null)
    and (email_sent_at is null)
    and (email_opened_at is null)
    and (followup_prep_sent_at is null)
    and (followup_day1_sent_at is null)
    and (followup_day3_sent_at is null)
    and (followup_day7_sent_at is null)
    and (name is not null)
    and ((length(btrim(name)) >= 2) and (length(btrim(name)) <= 120))
    and (email is not null)
    and (length(email) <= 254)
    and (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text)
    and ((phone is null) or (length(btrim(phone)) <= 32))
    and (
      (trial_date is null)
      or (is_tba = true)
      or (
        (trial_date >= (((current_timestamp at time zone 'Africa/Cairo'::text))::date - 1))
        and (trial_date <= (((current_timestamp at time zone 'Africa/Cairo'::text))::date + 120))
      )
    )
  );
