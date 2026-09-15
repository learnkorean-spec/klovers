-- A new trial booking got no room link, because the trigger that copies it ran
-- before the trigger that finds the slot.
--
-- HOW IT WAS FOUND
-- A test booking was written straight through `upsert_trial_booking` on
-- 15 Sep to walk the student journey. It came out with `meeting_url = NULL`.
-- So had naira's, three hours earlier. Those are the only two bookings created
-- since `tg_trial_bookings_inherit_room` shipped (PR #415, migration
-- 20260915190000) — every other booking on that session has a link because
-- they were backfilled by hand. In other words the trigger has never once
-- worked on a real insert.
--
-- WHY
-- Postgres fires BEFORE-row triggers in NAME order, and the names sorted the
-- wrong way round:
--
--   trg_trial_bookings_inherit_room   <- ran 1st, NEW.slot_id is still NULL
--   trg_trial_bookings_set_slot_id    <- ran 2nd, sets NEW.slot_id
--
-- The function's own first line is `IF NEW.slot_id IS NOT NULL`, so it looked
-- at a null, did nothing, and returned quietly. Nothing was broken, nothing
-- raised, and the student simply had no way into the class.
--
-- THE FIX
-- The function is right; only the order is wrong. Recreate the trigger under a
-- name that sorts AFTER both slot-resolving triggers (`set_slot_id`,
-- `set_slot_range`), which is the only thing that decides order here.
--
-- Both affected rows (naira and the test booking) were corrected by hand before
-- this migration was written; the backfill below is written to be safe to run
-- anyway and covers anything created in between.

drop trigger if exists trg_trial_bookings_inherit_room on public.trial_bookings;

-- 'zz_' is deliberate and not decoration: it is the whole mechanism. Renaming
-- this trigger to anything sorting before trg_trial_bookings_set_slot_id
-- silently restores the bug.
create trigger trg_trial_bookings_zz_inherit_room
  before insert or update on public.trial_bookings
  for each row execute function public.tg_trial_bookings_inherit_room();

comment on function public.tg_trial_bookings_inherit_room() is
  'Copies the slot''s meeting_url onto a booking that has none. MUST fire after '
  'trg_trial_bookings_set_slot_id — BEFORE-row triggers run in name order, and '
  'this one reads NEW.slot_id. Hence the trigger name trg_trial_bookings_zz_inherit_room.';

-- Anything still missing a room that its slot can supply.
update public.trial_bookings b
   set meeting_url = s.meeting_url
  from public.trial_slots s
 where s.id = b.slot_id
   and coalesce(b.meeting_url, '') = ''
   and coalesce(s.meeting_url, '') <> ''
   and b.status <> 'cancelled';
