-- Five permanent trial rooms, repeated every week.
--
-- Re, 16 Sep 2026: "make 5 main links and repeat them, no need for many
-- rooms". Until now every trial DATE got its own Meet link, typed in by hand
-- when a proposal was approved, so the calendar's permanent trial rooms were
-- never used and every week produced a fresh link.
--
-- 1. public.trial_rooms - the five rooms, one per (weekday, language), each
--    living on a recurring event in Re's calendar. One row is the spare,
--    used for any weekday/language without a room of its own.
-- 2. A new or re-dated slot takes its room from that table automatically.
--    A date that already has bookings keeps its link (a link already sent
--    is frozen - RULE_ONE_PERMANENT_ROOM_PER_SLOT).
-- 3. When a slot's link does change, every booking on that slot's current
--    date follows it (previously only EMPTY booking links were filled, so a
--    changed room left students holding the old one), and Re is told how
--    many of them had already been sent the old link.
--
-- Links already sent for 18, 19, 25 and 27 Sep are left alone (Re's choice).
--
-- Tested against production inside a rolled-back transaction on 16 Sep:
-- booked dates kept their links, unbooked dates took their room, a new slot
-- with a hand-typed link was given the pool room instead.

BEGIN;

CREATE TABLE IF NOT EXISTS public.trial_rooms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week       int  CHECK (day_of_week BETWEEN 0 AND 6),
  class_language    text CHECK (class_language IN ('arabic', 'english')),
  is_spare          boolean NOT NULL DEFAULT false,
  meeting_url       text NOT NULL UNIQUE,
  calendar_event_id text,
  label             text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week, class_language)
);

CREATE UNIQUE INDEX IF NOT EXISTS trial_rooms_one_spare
  ON public.trial_rooms (is_spare) WHERE is_spare;

ALTER TABLE public.trial_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trial_rooms_admin_all ON public.trial_rooms;
CREATE POLICY trial_rooms_admin_all ON public.trial_rooms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.trial_rooms (day_of_week, class_language, is_spare, meeting_url, calendar_event_id, label) VALUES
  (5, 'arabic',  false, 'https://meet.google.com/fbw-gqrm-phb', 'vmuaktvko7o22c7acc4h7oins8', 'Friday Arabic'),
  (6, 'english', false, 'https://meet.google.com/oas-ikip-wph', 'kjgv395vh7hejtc8ad4fbrosk4', 'Saturday English'),
  (0, 'english', false, 'https://meet.google.com/abi-hcsu-gbu', '28skrn81bmbla5k2lnb9kiba0g', 'Sunday English'),
  (1, 'english', false, 'https://meet.google.com/nqt-dyai-iki', 'ri6uf87c38bg2vs08gfgl9tahc', 'Monday English'),
  (2, 'english', true,  'https://meet.google.com/uke-scew-rxd', 'idq7l3jc6mufkmd0gpses903i8', 'Tuesday English / spare')
ON CONFLICT (meeting_url) DO NOTHING;

-- The room for a weekday and language: its own, else the spare.
CREATE OR REPLACE FUNCTION public.fn_trial_room_for(p_day_of_week int, p_class_language text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT meeting_url
    FROM public.trial_rooms
   WHERE (day_of_week = p_day_of_week AND class_language = p_class_language)
      OR is_spare
   ORDER BY is_spare
   LIMIT 1;
$$;

-- A new slot, or a slot moved to a new date/day/language, takes its room -
-- unless people are already booked on that exact date, whose link is frozen.
CREATE OR REPLACE FUNCTION public.tg_trial_slots_room_from_pool()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dow  int;
  v_room text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.trial_date     IS NOT DISTINCT FROM OLD.trial_date
     AND NEW.day_of_week    IS NOT DISTINCT FROM OLD.day_of_week
     AND NEW.class_language IS NOT DISTINCT FROM OLD.class_language THEN
    RETURN NEW;
  END IF;

  v_dow := COALESCE(EXTRACT(DOW FROM NEW.trial_date)::int, NEW.day_of_week);
  IF v_dow IS NULL OR NEW.class_language IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM public.trial_bookings b
     WHERE b.slot_id = NEW.id
       AND b.trial_date = NEW.trial_date
       AND b.status <> 'cancelled'
       AND COALESCE(b.meeting_url, '') <> ''
  ) THEN
    RETURN NEW;
  END IF;

  v_room := public.fn_trial_room_for(v_dow, NEW.class_language);
  IF v_room IS NOT NULL THEN
    NEW.meeting_url := v_room;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_slots_room_from_pool ON public.trial_slots;
CREATE TRIGGER trg_trial_slots_room_from_pool
  BEFORE INSERT OR UPDATE OF trial_date, day_of_week, class_language ON public.trial_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_trial_slots_room_from_pool();

-- A changed link reaches every booking on the slot's current date, not only
-- the empty ones, and Re hears about anyone who was already sent the old one.
CREATE OR REPLACE FUNCTION public.tg_trial_slots_fan_out_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_told int;
BEGIN
  IF COALESCE(NEW.meeting_url, '') = '' OR NEW.meeting_url IS NOT DISTINCT FROM OLD.meeting_url THEN
    RETURN NEW;
  END IF;

  WITH moved AS (
    UPDATE public.trial_bookings b
       SET meeting_url = NEW.meeting_url
     WHERE b.slot_id = NEW.id
       AND b.trial_date = NEW.trial_date
       AND b.status <> 'cancelled'
       AND b.meeting_url IS DISTINCT FROM NEW.meeting_url
    RETURNING (COALESCE(b.attendance_email_sent_at, b.choice_confirmation_sent_at) IS NOT NULL) AS was_told
  )
  SELECT count(*) FILTER (WHERE was_told) INTO v_told FROM moved;

  IF v_told > 0 THEN
    BEGIN
      INSERT INTO public.admin_notifications (message, type)
      VALUES (
        format(
          'Trial room changed: the %s session on %s at %s now uses %s. %s booked student(s) had already been sent the old link - tell them the new one.',
          COALESCE(NEW.class_language, 'unspecified'), NEW.trial_date, NEW.start_time,
          NEW.meeting_url, v_told
        ),
        'trial_rollover'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;  -- alerting must never block the change
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Approving a proposal no longer needs a link typed in: the room comes from
-- the pool. A typed link is still accepted but the pool wins.
CREATE OR REPLACE FUNCTION public.fn_approve_trial_slot_proposal(p_id uuid, p_meeting_url text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare
  p public.trial_slot_proposals%rowtype;
  v_conflict text;
  v_slot_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select * into p
  from public.trial_slot_proposals tp
  where tp.id = p_id
  for update;

  if not found then
    raise exception 'proposal_not_found' using errcode = 'P0001';
  end if;
  if p.status <> 'pending' then
    raise exception 'proposal_already_decided' using errcode = 'P0001';
  end if;

  if public.fn_trial_room_for(p.day_of_week, p.class_language) is null
     and (p_meeting_url is null or btrim(p_meeting_url) = '') then
    raise exception 'meeting_url_required' using errcode = 'P0001';
  end if;

  select detail into v_conflict
  from public.fn_trial_slot_conflicts(p.day_of_week, p.start_time, p.duration_min)
  limit 1;

  if v_conflict is not null then
    raise exception 'trial_slot_conflict: %', v_conflict using errcode = 'P0001';
  end if;

  insert into public.trial_slots (
    day_of_week, start_time, duration_min, timezone, capacity, min_to_run,
    class_language, is_active, lifecycle, trial_date, meeting_url
  )
  values (
    p.day_of_week, p.start_time, p.duration_min, p.timezone, p.capacity, p.min_to_run,
    p.class_language, true, 'active', p.trial_date, nullif(btrim(coalesce(p_meeting_url, '')), '')
  )
  returning id into v_slot_id;

  update public.trial_slot_proposals tp
     set status = 'approved',
         decided_at = now(),
         decided_by = auth.uid(),
         created_slot_id = v_slot_id
   where tp.id = p_id;

  return v_slot_id;
end;
$function$;

-- Backfill: every upcoming slot nobody has been given a link for takes its room.
UPDATE public.trial_slots s
   SET meeting_url = public.fn_trial_room_for(COALESCE(EXTRACT(DOW FROM s.trial_date)::int, s.day_of_week), s.class_language)
 WHERE s.trial_date >= (now() AT TIME ZONE 'Africa/Cairo')::date
   AND s.class_language IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.trial_bookings b
      WHERE b.slot_id = s.id
        AND b.trial_date = s.trial_date
        AND b.status <> 'cancelled'
        AND COALESCE(b.meeting_url, '') <> ''
   );

-- Verify before commit.
DO $$
DECLARE
  v_rooms int;
  v_off   int;
BEGIN
  SELECT count(*) INTO v_rooms FROM public.trial_rooms;
  IF v_rooms <> 5 THEN
    RAISE EXCEPTION 'Verify failed: expected 5 trial rooms, found %', v_rooms;
  END IF;

  SELECT count(*) INTO v_off
    FROM public.trial_slots s
   WHERE s.trial_date >= (now() AT TIME ZONE 'Africa/Cairo')::date
     AND s.class_language IS NOT NULL
     AND s.meeting_url IS DISTINCT FROM public.fn_trial_room_for(EXTRACT(DOW FROM s.trial_date)::int, s.class_language)
     AND NOT EXISTS (
       SELECT 1 FROM public.trial_bookings b
        WHERE b.slot_id = s.id AND b.trial_date = s.trial_date
          AND b.status <> 'cancelled' AND COALESCE(b.meeting_url, '') <> ''
     );
  IF v_off > 0 THEN
    RAISE EXCEPTION 'Verify failed: % unbooked upcoming slot(s) not on their room', v_off;
  END IF;
END $$;

COMMIT;
