-- Give trial_bookings a real foreign key to trial_slots.
--
-- WHY
-- ---
-- trial_bookings has never had a slot_id. Every link between a booking and its
-- slot is reconstructed by matching (day_of_week, start_time). That has three
-- consequences, all of them live today. Measured against production on
-- 2026-09-02:
--
--   1. Changing a slot's time silently orphans its bookings. Nothing errors;
--      v_trial_bookings_admin just starts reporting slot_exists = false. This
--      was hit moving the Friday Arabic slot 14:00 -> 15:00, and only avoided
--      by updating both tables in one hand-written transaction.
--
--   2. The join is not unique. (day_of_week, start_time) repeats across dates,
--      so v_trial_bookings_admin DUPLICATES rows: it returns 83 rows for 81
--      bookings. Two cancelled bookings each match two retired slots and are
--      returned twice; a third matches a slot on a different date entirely.
--
--   3. Both validation triggers resolve the slot with LIMIT 1 over the same
--      ambiguous predicate, so capacity is enforced against an arbitrary slot
--      whenever more than one is active for a (day_of_week, start_time).
--
-- WHAT THIS DOES
-- --------------
--   1. Adds trial_bookings.slot_id -> trial_slots(id), ON DELETE SET NULL.
--   2. Backfills it on the unambiguous key (trial_date, start_time), which is
--      UNIQUE on trial_slots. Measured on prod: 10 rows matched, 71 left NULL.
--      The NULLs are historical bookings whose slots have since rolled forward
--      -- NULL is the honest answer for them, and is what the view already
--      effectively reported.
--   3. Keeps it in sync with a BEFORE trigger, so no caller has to remember.
--   4. Rewrites v_trial_bookings_admin to join on slot_id. Same columns, same
--      types, same order -- CREATE OR REPLACE, so the view's grants survive
--      (a DROP would discard them; see the pg_default_acl note in
--      claude/TRIAL_PIPELINE_STATE_2026-08-31.md).
--   5. Adds reschedule_trial_slot(), so moving a slot's time updates the slot
--      and its bookings together, atomically, instead of by hand.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
-- ----------------------------------
-- trial_bookings_validate_slot() and check_trial_slot_capacity() still resolve
-- by (day_of_week, start_time). Rewriting them to use slot_id changes booking
-- admission rules, which is a behaviour change and belongs in its own PR with
-- its own test. This migration is additive: nothing that worked before stops
-- working.
--
-- DRY RUN
-- -------
-- Executed in full against production inside an explicit transaction and
-- rolled back, 2026-09-02. Result: backfilled 10 / 81, view returned 81 rows
-- (was 83). Rollback verified clean: no slot_id column, no RPC left behind.
--
-- ROLLBACK
-- --------
--   drop function if exists public.reschedule_trial_slot(uuid, text);
--   drop trigger  if exists trg_trial_bookings_set_slot_id on public.trial_bookings;
--   drop function if exists public.tg_trial_bookings_set_slot_id();
--   alter table public.trial_bookings drop column if exists slot_id;
--   -- then restore the previous v_trial_bookings_admin definition, which joined
--   -- ON ts.day_of_week = tb.day_of_week AND ts.start_time = tb.start_time

begin;

-- 1. Column ------------------------------------------------------------------

alter table public.trial_bookings
  add column if not exists slot_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.trial_bookings'::regclass
       and conname  = 'trial_bookings_slot_id_fkey'
  ) then
    alter table public.trial_bookings
      add constraint trial_bookings_slot_id_fkey
      foreign key (slot_id) references public.trial_slots(id) on delete set null;
  end if;
end $$;

create index if not exists idx_trial_bookings_slot_id
  on public.trial_bookings (slot_id) where slot_id is not null;

comment on column public.trial_bookings.slot_id is
  'FK to trial_slots. Maintained by trg_trial_bookings_set_slot_id. NULL means no slot currently exists for this booking''s (trial_date, start_time) -- normal for historical bookings whose slot has rolled forward.';

-- 2. Backfill on the unique key ---------------------------------------------

update public.trial_bookings tb
   set slot_id = ts.id
  from public.trial_slots ts
 where ts.trial_date = tb.trial_date
   and ts.start_time = tb.start_time
   and tb.slot_id is distinct from ts.id;

-- 3. Keep it in sync ---------------------------------------------------------

create or replace function public.tg_trial_bookings_set_slot_id()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_slot_id uuid;
begin
  if new.trial_date is null or new.start_time is null
     or new.start_time = 'TBA' or new.trial_date = '2099-12-31' then
    new.slot_id := null;
    return new;
  end if;

  -- Exact match first: trial_slots has UNIQUE (trial_date, start_time),
  -- so this resolves to at most one row.
  select ts.id into v_slot_id
    from public.trial_slots ts
   where ts.trial_date = new.trial_date
     and ts.start_time = new.start_time;

  -- Fall back to the recurring active slot for that weekday and time.
  if v_slot_id is null then
    select ts.id into v_slot_id
      from public.trial_slots ts
     where ts.day_of_week = new.day_of_week
       and ts.start_time  = new.start_time
       and ts.is_active   = true
       and (ts.lifecycle is null or ts.lifecycle = 'active')
     order by ts.trial_date desc nulls last
     limit 1;
  end if;

  new.slot_id := v_slot_id;
  return new;
end;
$function$;

revoke all on function public.tg_trial_bookings_set_slot_id() from public, anon, authenticated;

drop trigger if exists trg_trial_bookings_set_slot_id on public.trial_bookings;
create trigger trg_trial_bookings_set_slot_id
  before insert or update of trial_date, start_time, day_of_week
  on public.trial_bookings
  for each row execute function public.tg_trial_bookings_set_slot_id();

-- 4. The view now joins on identity, not on a time string --------------------

create or replace view public.v_trial_bookings_admin as
 with cfg as (
         select trial_settings.program_start_date
           from trial_settings
          where trial_settings.id = 1
        )
 select tb.id,
    tb.name,
    tb.email,
    tb.phone,
    tb.level,
    tb.goal,
    tb.day_of_week,
        case tb.day_of_week
            when 0 then 'Sunday'::text
            when 1 then 'Monday'::text
            when 2 then 'Tuesday'::text
            when 3 then 'Wednesday'::text
            when 4 then 'Thursday'::text
            when 5 then 'Friday'::text
            when 6 then 'Saturday'::text
            else null::text
        end as day_name,
    tb.trial_date,
    tb.start_time,
    tb.status,
    tb.confirmed_at,
    tb.created_at,
    tb.user_id,
    tb.timezone,
    ts.id as slot_id,
    ts.lifecycle as slot_lifecycle,
    ts.is_active as slot_is_active,
    ts.capacity as slot_capacity,
    ts.duration_min as slot_duration_min,
    ts.id is not null as slot_exists,
        case
            when tb.is_tba then 'tba'::text
            when tb.trial_date >= current_date then 'upcoming'::text
            else 'past'::text
        end as time_bucket,
        case
            when (( select cfg.program_start_date from cfg)) is null then 'pre_launch'::text
            when tb.trial_date is null then 'pre_launch'::text
            when tb.trial_date < (( select cfg.program_start_date from cfg)) then 'pre_launch'::text
            else 'active_program'::text
        end as program_phase,
    tb.is_tba,
    tb.email_sent_at,
    tb.email_opened_at,
    tb.attendance_response,
    tb.attendance_responded_at,
    tb.class_language,
    tb.rollover_status,
    tb.rollover_notified_at,
    tb.next_trial_month
   from trial_bookings tb
     left join trial_slots ts on ts.id = tb.slot_id;

-- 5. Rescheduling a slot is now one call, not two updates you must remember ---

create or replace function public.reschedule_trial_slot(
  p_slot_id        uuid,
  p_new_start_time text
)
returns table (slot_id uuid, old_start_time text, new_start_time text, bookings_moved int)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_old_start text;
  v_date      date;
  v_tz        text;
  v_moved     int;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorised: reschedule_trial_slot requires the admin role'
      using errcode = '42501';
  end if;

  if p_new_start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'bad_start_time: expected HH:MM, got %', p_new_start_time
      using errcode = '22023';
  end if;

  select ts.start_time, ts.trial_date, ts.timezone
    into v_old_start, v_date, v_tz
    from public.trial_slots ts
   where ts.id = p_slot_id
   for update;

  if not found then
    raise exception 'slot_not_found: %', p_slot_id using errcode = 'P0002';
  end if;

  if v_old_start = p_new_start_time then
    return query select p_slot_id, v_old_start, p_new_start_time, 0;
    return;
  end if;

  -- Slot first: trial_bookings_validate_slot() rejects any booking whose
  -- (day_of_week, start_time) matches no active slot, so the bookings cannot
  -- move until the slot has.
  update public.trial_slots
     set start_time = p_new_start_time
   where id = p_slot_id;

  update public.trial_bookings tb
     set start_time = p_new_start_time,
         starts_at  = case
                        when v_date is null or v_tz is null then tb.starts_at
                        else ((v_date::text || ' ' || p_new_start_time)::timestamp
                              at time zone v_tz)
                      end
   where tb.slot_id = p_slot_id
     and tb.start_time = v_old_start;

  get diagnostics v_moved = row_count;

  return query select p_slot_id, v_old_start, p_new_start_time, v_moved;
end;
$function$;

-- pg_default_acl on this database grants EXECUTE on new public functions to
-- anon and authenticated. REVOKE FROM PUBLIC alone is not enough -- the roles
-- must be named. See claude/TRIAL_PIPELINE_STATE_2026-08-31.md.
revoke all on function public.reschedule_trial_slot(uuid, text) from public, anon, authenticated;
grant execute on function public.reschedule_trial_slot(uuid, text) to authenticated;

comment on function public.reschedule_trial_slot(uuid, text) is
  'Moves a trial slot to a new HH:MM start and carries its bookings with it (start_time and starts_at, recomputed in the slot timezone). Admin only. Returns the number of bookings moved.';

commit;
