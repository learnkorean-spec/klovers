-- Give each trial slot its own Meet room.
--
-- THIS UPDATES EXISTING ROWS - the four active trial_slots, meeting_url only.
--
-- All four currently share ONE link. Verified by fingerprint before writing
-- this: md5(meeting_url) is identical across all four rows.
--
-- Why that matters more than it looks. A trial link is handed to the widest
-- and least-vetted audience the academy has - 57 people on the waiting list
-- now, eight new every week, many of whom never attend - and whoever receives
-- it keeps it. There is no revoking a Meet link, only replacing it and
-- re-emailing everyone. One shared link means one leak reaches every trial.
--
-- The paid cohorts are the real reason to separate them. A cohort keeps its
-- room from Hangul through Level 6, roughly three years. If that room were
-- ever the same link as a trial, every person who ever attended a free trial
-- could walk into a class students are paying for, indefinitely.
--
-- Four links, not two. The intent was one room per language, shared across
-- that language's two days. Google does not allow one Meet link to be
-- attached to two calendar events, so each slot has its own. This costs
-- nothing operationally: the link is stored per slot here and the invitation
-- reads it from the row, so no one ever picks a link by hand.
--
-- Created 2026-09-04 as recurring events on reham.elshrkawy@gmail.com, so
-- each has a calendar entry with a Join button rather than being a bare URL
-- in a database column. Rescheduling those events does not change the links.
--
-- NOT included: storage for the two paid cohort rooms. schedule_packages and
-- pkg_groups have no meeting_url column at all, so a student who enrols in a
-- Hangul cohort today has nothing telling them where to go. Adding the column
-- is trivial; deciding which table owns it and teaching the enrolment and
-- reminder emails to read it is not, and it should not ride along with a
-- change the trial send depends on. The two links exist and are on the
-- calendar in the meantime.

BEGIN;

DO $$
DECLARE
  rows_updated int;
  distinct_links int;
  active_slots int;
BEGIN
  UPDATE public.trial_slots SET meeting_url = v.url
    FROM (VALUES
      (DATE '2026-09-11', '15:00', 'https://meet.google.com/fbw-gqrm-phb'),  -- Fri, Arabic
      (DATE '2026-09-12', '16:30', 'https://meet.google.com/oas-ikip-wph'),  -- Sat, Arabic
      (DATE '2026-09-13', '15:00', 'https://meet.google.com/abi-hcsu-gbu'),  -- Sun, English
      (DATE '2026-09-14', '16:00', 'https://meet.google.com/nqt-dyai-iki')   -- Mon, English
    ) AS v(d, t, url)
   WHERE public.trial_slots.trial_date = v.d
     AND public.trial_slots.start_time = v.t
     AND public.trial_slots.is_active;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  IF rows_updated <> 4 THEN
    RAISE EXCEPTION
      'expected to update 4 trial slots, updated % - the slots have moved since this was written, so nothing has been changed', rows_updated;
  END IF;

  -- The whole point is that they differ. A copy-paste slip would otherwise
  -- leave two slots sharing a room and nothing would say so.
  SELECT count(*), count(DISTINCT meeting_url)
    INTO active_slots, distinct_links
    FROM public.trial_slots
   WHERE is_active;

  IF distinct_links <> active_slots THEN
    RAISE EXCEPTION
      '% active slots but only % distinct links - at least two slots still share a room', active_slots, distinct_links;
  END IF;

  IF EXISTS (SELECT 1 FROM public.trial_slots
              WHERE is_active
                AND (meeting_url IS NULL OR meeting_url NOT LIKE 'https://meet.google.com/%')) THEN
    RAISE EXCEPTION 'an active slot has no usable Meet link';
  END IF;

  RAISE NOTICE 'Each of the % active trial slots now has its own Meet room.', active_slots;
END $$;

COMMIT;
