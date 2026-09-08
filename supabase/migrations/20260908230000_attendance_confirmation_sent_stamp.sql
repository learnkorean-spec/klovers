-- Record that the attendance-confirmation letter was sent.
--
-- WHY A SECOND COLUMN AND NOT email_sent_at
-- -----------------------------------------
-- trial_bookings already has email_sent_at, and it means one specific thing:
-- send-trial-invitations wrote it after telling a student the date, the time
-- and the room. It is that function's skip condition on the next run.
--
-- The attendance-confirmation letter ("are you coming?") is a different letter
-- asking a different question, sent on a different day, and it may be sent more
-- than once to the same person. Reusing email_sent_at for it would make the
-- invitation sender skip everybody it stamped, and would make the question
-- "has this student been told when their class is?" unanswerable.
--
-- /admin/today counted email_sent_at as "asked to confirm" for exactly that
-- reason — there was no other column to count — and so a session where all
-- eleven students had been asked read "Nobody has been asked to confirm yet".
-- The screen that exists to tell "ignored us" apart from "never asked" could
-- not tell them apart. This column is what it counts now.
--
-- No index. trial_bookings holds a few hundred rows and the only queries that
-- touch this column are "is null AND trial_date >= today", already narrowed by
-- the date. An index here would cost writes and buy a sequential scan of a
-- table that fits in a page or two.

alter table public.trial_bookings
  add column if not exists attendance_email_sent_at timestamptz;

comment on column public.trial_bookings.attendance_email_sent_at is
  'When the attendance-confirmation letter (template trial_attendance_confirmation, "are you coming?") was last sent to this student, written by send-attendance-confirmations only after a 2xx. Deliberately distinct from email_sent_at, which records the invitation telling them when and where the class is.';
