-- A booking inherits its slot's room — 15 September 2026
-- ======================================================
--
-- THE FAILURE, three days before it would have mattered: of the 18 live
-- bookings on Friday 18 September, seventeen carried the Friday 16:30 Arabic
-- room and one carried nothing. That student had been invited, had been asked
-- to confirm her attendance, and had no way to join. Nothing anywhere said so
-- — a booking with no room looks exactly like a booking that is ready.
--
-- The cause is that `trial_bookings.meeting_url` and `trial_slots.meeting_url`
-- were two unconnected columns. No trigger, no default, no backfill: the
-- booking's copy was filled in by whichever code path happened to run, and the
-- row created on 12 September at 13:51 simply missed it.
--
-- That row has already been repaired by hand. This migration is so it cannot
-- happen again.
--
-- WHAT THIS DELIBERATELY DOES NOT DO — from the standing rule in
-- claude/RULE_ONE_PERMANENT_ROOM_PER_SLOT_2026-09-14.md:
--
--     "A link already sent is frozen. Once an invitation carrying a link has
--      gone out, that date keeps that link even if it is the wrong one by this
--      rule."
--
-- So nothing here ever OVERWRITES a room a booking already holds. Both paths
-- below fill an empty column and stop. Changing a link a student has already
-- been sent is a decision for a person, not for a trigger.

-- ── 1. Backfill ──
-- Every live, future booking whose slot has a room and which has none.
UPDATE public.trial_bookings b
   SET meeting_url = s.meeting_url
  FROM public.trial_slots s
 WHERE s.id = b.slot_id
   AND COALESCE(b.meeting_url, '') = ''
   AND COALESCE(s.meeting_url, '') <> ''
   AND b.status <> 'cancelled'
   AND b.trial_date >= (now() AT TIME ZONE 'Africa/Cairo')::date;

-- ── 2. On the way in ──
-- A booking that arrives with no room, or is moved to another slot without
-- one, takes the room of the slot it is in.
CREATE OR REPLACE FUNCTION public.tg_trial_bookings_inherit_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _room text;
BEGIN
  IF NEW.slot_id IS NOT NULL AND COALESCE(NEW.meeting_url, '') = '' THEN
    SELECT meeting_url INTO _room FROM public.trial_slots WHERE id = NEW.slot_id;
    IF COALESCE(_room, '') <> '' THEN
      NEW.meeting_url := _room;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_trial_bookings_inherit_room ON public.trial_bookings;
CREATE TRIGGER trg_trial_bookings_inherit_room
  BEFORE INSERT OR UPDATE OF slot_id, meeting_url ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_trial_bookings_inherit_room();

-- ── 3. When the room appears later ──
-- The common case behind the Friday failure: the booking is made before the
-- slot has a room. When the room is first set on the slot, every live future
-- booking in it that has none picks it up. Bookings that already hold a link
-- are left exactly as they are.
CREATE OR REPLACE FUNCTION public.tg_trial_slots_fan_out_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(NEW.meeting_url, '') <> '' AND NEW.meeting_url IS DISTINCT FROM OLD.meeting_url THEN
    UPDATE public.trial_bookings
       SET meeting_url = NEW.meeting_url
     WHERE slot_id = NEW.id
       AND COALESCE(meeting_url, '') = ''
       AND status <> 'cancelled'
       AND trial_date >= (now() AT TIME ZONE 'Africa/Cairo')::date;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_trial_slots_fan_out_room ON public.trial_slots;
CREATE TRIGGER trg_trial_slots_fan_out_room
  AFTER UPDATE OF meeting_url ON public.trial_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_trial_slots_fan_out_room();
