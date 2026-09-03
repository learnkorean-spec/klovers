-- Record the student's OWN timezone on a trial booking.
--
-- Why a new column rather than the one that already exists
-- --------------------------------------------------------
-- `trial_bookings.timezone` looks like it should hold this, and does not.
-- `book-trial` sets it with:
--
--     const timezone: string = _slot?.timezone || "Asia/Kuala_Lumpur";
--
-- i.e. it copies the SLOT's timezone onto the booking. That is why the column
-- holds exactly two values across all 76 rows - Africa/Cairo (51) and
-- Asia/Kuala_Lumpur (25) - which are the two zones the slots themselves have
-- had, before and after the 2026-08-28 Cairo migration. They are not where 76
-- people live.
--
-- So `timezone` is load-bearing for slot rendering and for the .ics files
-- generated in send-confirmation-email. Repurposing it would silently move
-- class times. It is left exactly as it is.
--
-- What this unblocks
-- ------------------
-- Invitation and reminder emails currently show the class in Cairo time (plus
-- GMT since PR #173), because no student's real zone has ever been recorded
-- and there is nothing else to show. Phone numbers are not a fallback: 70 of
-- the 76 bookings carry none, and a phone's country is where a number was
-- issued, not where its owner is standing - an Egyptian number booking from
-- Oman should see Muscat time.
--
-- With this column populated from the browser at booking time, those emails
-- can show the student's own time with Cairo in brackets.
--
-- Safety
-- ------
-- Purely additive. Nullable, no default, no backfill, no existing row read or
-- rewritten. Every current row stays NULL on purpose: we do not know these
-- students' zones and will not guess one. Rows fill in as students book.
-- `IF NOT EXISTS` makes a second run a no-op rather than an error.

ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS student_timezone text;

COMMENT ON COLUMN public.trial_bookings.student_timezone IS
  'The student''s own IANA timezone (e.g. Asia/Muscat), read from their browser at booking time. NULL when unknown - never inferred from phone number or nationality. Distinct from trial_bookings.timezone, which is the SLOT''s zone copied in by book-trial.';
