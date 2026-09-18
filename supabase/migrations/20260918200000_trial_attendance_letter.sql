-- One stamp, so an attendance letter can only ever go once.
--
-- A booking gets exactly ONE letter off its attendance mark: the one for
-- people who came, or the one for people who did not. So a single stamp covers
-- both, and pressing Confirm twice cannot reach anybody who has already been
-- written to.
--
-- It is also the undo boundary. Changing a mark from Came to Didn't come after
-- the letter has gone does not send the other letter: the two contradict each
-- other, and a student who receives both learns that nobody here knows whether
-- she was in the room. Correcting the mark still corrects the record, which is
-- what the record is for.

alter table public.trial_bookings
  add column if not exists attended_letter_sent_at timestamptz;

comment on column public.trial_bookings.attended_letter_sent_at is
  'When the letter chosen by `attended` was sent to this booking. Non-null means she has had one and must not get the other -- the two letters contradict each other.';

-- The sender asks for one session''s unsent, marked bookings. Partial index, so
-- it costs nothing once a session is done and those rows leave it.
create index if not exists trial_bookings_attendance_letter_pending_idx
  on public.trial_bookings (trial_date, start_time)
  where attended is not null and attended_letter_sent_at is null;

-- ── Public INSERT policy, recreated ─────────────────────────────────────────
--
-- Same reason as the three attendance columns added in 20260918190000: the
-- booking form is reachable by anon, and a stamp that SUPPRESSES a letter must
-- not be settable by the person the letter is about. Writing it on insert would
-- be a silent opt-out nobody could see.
--
-- Everything else is reproduced verbatim from the live policy.

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
    and (attended is null)
    and (attendance_marked_at is null)
    and (attendance_marked_by is null)
    and (attended_letter_sent_at is null)
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
