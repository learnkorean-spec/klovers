-- A follow-up that happened off the system had nowhere to be written down.
--
-- trial_bookings already records two moments: attendance_email_sent_at, when
-- the system asked, and attendance_responded_at, when the student answered.
-- Most chasing does not happen through either. It happens on WhatsApp, or on
-- the phone, and leaves no trace at all.
--
-- The cost of that gap is not tidiness. The attendance roster reads these
-- columns to decide who still needs chasing, so a student already messaged by
-- hand keeps appearing as untouched — and gets chased again, by whoever looks
-- next, through whichever channel they happen to prefer. Twice in one evening
-- reads as pestering.
--
-- Deliberately separate from attendance_email_sent_at rather than reusing it.
-- That column drives the 48-hour resend guard and the "asked / not asked"
-- split; writing a WhatsApp message into it would silently suppress the next
-- real letter and move the student into the wrong group on screen.

ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS attendance_followup_manual_at timestamptz;

COMMENT ON COLUMN public.trial_bookings.attendance_followup_manual_at IS
  'When somebody chased this student by hand — WhatsApp, a call — rather than '
  'through the system. Kept apart from attendance_email_sent_at on purpose: '
  'that column drives the 48-hour resend guard and the asked/not-asked split, '
  'and a message sent outside the system must not suppress the next letter.';
