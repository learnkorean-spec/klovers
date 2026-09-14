-- Twenty people were parked on two trial slots that could never run — 14 Sep 2026
--
-- `trial_slots` for 20 Sep (16:00) and 26 Sep (16:30) were both
-- `is_active = false`, and both were labelled `class_language = 'english'`.
-- Between them they held **20 live bookings**, every one still `pending`.
--
-- Two things were wrong with that at the same time, and each hid the other:
--
--   1. The slots were closed. Nothing would ever run on those dates, and
--      nothing told the twenty people sitting on them.
--   2. Eighteen of the twenty had asked for **Arabic**. They had been placed
--      on an English slot, so even if it had been open it was the wrong class.
--
-- All twenty had been booked in April and never confirmed. The last thing the
-- system said to most of them was `trial_rebook_request` — "book again" — while
-- simultaneously holding them on a date that had already been switched off.
--
-- WHAT WAS DONE BEFORE THIS MIGRATION
-- -----------------------------------
-- Nobody is cancelled without being told. On 14 Sep, before this ran:
--
--   * the 18 Arabic students were emailed an invitation offering the two live
--     Arabic slots (18 and 25 Sep, 16:30 Cairo);
--   * the 2 English students (monijesu006@, habibmitufarjana@) were emailed the
--     same thing for the two live English slots (19 Sep 16:30, 27 Sep 16:00).
--
-- Both letters carry a booking button and a WhatsApp link. Every one is
-- recorded in `email_logs` with template `admin_message`.
--
-- WHY CANCEL RATHER THAN MOVE
-- ---------------------------
-- Moving them would pick the day for them. The two dates in each letter are
-- alternatives — one class a week, the student chooses — and choosing on her
-- behalf is how the 20 Sep slot came to hold nine Arabic speakers in the first
-- place. Cancelling leaves the booking page free to take whichever day she
-- picks: `idx_trial_bookings_unique_active` is scoped to
-- (email, trial_date, start_time), so a stale row on a different date never
-- blocked a new booking — but a live row on a dead slot does make the slot
-- look occupied to every capacity check that counts it.
--
-- The slots themselves are LEFT INACTIVE, not deleted. They are the record of
-- what was offered and when; the weekly rollover already skips inactive rows.

-- ---------------------------------------------------------------------------
-- Refuse to run if the world has moved since this was written.
-- ---------------------------------------------------------------------------
do $$
declare
  v_slots integer;
  v_live  integer;
  v_open  integer;
begin
  select count(*) into v_slots
    from public.trial_slots
   where id in ('c47890e4-7c2a-4573-9083-07f8ef496804',
                'd110ecb5-0097-41df-922f-4e28a3d9335a');

  if v_slots <> 2 then
    raise exception 'Expected both slots to exist, found %.', v_slots;
  end if;

  -- If someone has re-opened either slot since this was written, the premise
  -- is gone: a live slot with people on it must not be emptied by a migration.
  select count(*) into v_open
    from public.trial_slots
   where id in ('c47890e4-7c2a-4573-9083-07f8ef496804',
                'd110ecb5-0097-41df-922f-4e28a3d9335a')
     and is_active is true;

  if v_open > 0 then
    raise exception
      '% of these slots has been re-activated since review. Refusing to cancel its bookings.', v_open;
  end if;

  select count(*) into v_live
    from public.trial_bookings
   where slot_id in ('c47890e4-7c2a-4573-9083-07f8ef496804',
                     'd110ecb5-0097-41df-922f-4e28a3d9335a')
     and status is distinct from 'cancelled';

  if v_live <> 20 then
    raise exception
      'Expected 20 live bookings across the two slots, found %. Re-check before running.', v_live;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Cancel, with the reason written down.
--
-- `cancel_reason` rather than a silent status flip: in three months the only
-- question anyone will ask of these rows is "why is this cancelled", and the
-- answer has to travel with the row rather than live in a migration file
-- nobody thinks to look for. `cancelled_at` is stamped for the same reason —
-- an unstamped cancellation is indistinguishable from one made in April.
-- ---------------------------------------------------------------------------
update public.trial_bookings
   set status        = 'cancelled',
       cancelled_at  = coalesce(cancelled_at, now()),
       cancel_reason = 'Slot inactive and (for 18 of 20) in the wrong language. '
                       'A fresh invitation offering the live slots was emailed first '
                       '- see email_logs, template admin_message, 2026-09-14.'
 where slot_id in ('c47890e4-7c2a-4573-9083-07f8ef496804',
                   'd110ecb5-0097-41df-922f-4e28a3d9335a')
   and status is distinct from 'cancelled';

-- ---------------------------------------------------------------------------
-- What should be true now.
-- ---------------------------------------------------------------------------
do $$
declare
  v_left integer;
begin
  select count(*) into v_left
    from public.trial_bookings
   where slot_id in ('c47890e4-7c2a-4573-9083-07f8ef496804',
                     'd110ecb5-0097-41df-922f-4e28a3d9335a')
     and status is distinct from 'cancelled';

  if v_left <> 0 then
    raise exception 'Expected 0 live bookings on the retired slots, found %.', v_left;
  end if;

  raise notice 'Both slots retired; 20 bookings cancelled after their invitations went out.';
end $$;
