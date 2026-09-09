-- The trial confirmation link recorded the student's answer but left the
-- booking's status untouched.
--
-- Two students confirmed on 9 Sep 2026 (Mariam Harb 10:39Z, Aya Arafa 12:19Z).
-- Both rows got attendance_response = 'yes', and both still read "Pending" in
-- the admin table with the Confirm / Reject / date-picker row still offered,
-- because that row and that badge are driven by trial_bookings.status, which
-- respond_trial_attendance never wrote. The green "confirmed_attendance" badge
-- has existed in TrialClassesManager since it was written and had never once
-- been reachable.
--
-- Three changes, all of them narrow:
--
--   1. pending -> confirmed_attendance is added to the transition whitelist.
--      Without it the validate-status-transition trigger raises 23514 and the
--      student's click fails outright. Every booking currently live is at
--      'pending' -- the per-row "Ask to confirm" button stamps
--      attendance_email_sent_at only, it does not move the booking to
--      'awaiting_attendance' -- so pending is the status these updates will
--      actually be starting from.
--
--   2. Both respond_trial_attendance overloads set status to
--      'confirmed_attendance' on a yes, but only from a status that has not
--      already moved past it. A booking sitting at 'completed', 'no_show' or
--      'cancelled' is left exactly where it is: a late click on an old link
--      must not resurrect a closed booking.
--
--   3. The two rows above are backfilled.
--
-- A "no" deliberately does NOT set status = 'cancelled'. It would look tidier,
-- but tg_trial_bookings_rejoin_cooldown starts a 30-day lockout on any
-- cancellation whose cancel_reason is not one of the two reschedule reasons,
-- so a student who mis-clicked "I can't make it" would be barred from booking
-- again for a month with no way to undo it from her side. The "Said no" label
-- in the admin table and the capacity count in the three-argument overload
-- both already read attendance_response directly, so nothing needs the status
-- to change for a decline to be visible or for the seat to be freed.

insert into public.trial_booking_status_transitions (from_status, to_status, note)
values ('pending', 'confirmed_attendance',
        'Student pressed the confirm link while the booking was still pending; '
        || 'the ask-to-confirm button does not move the booking to awaiting_attendance.')
on conflict do nothing;

create or replace function public.respond_trial_attendance(p_token uuid, p_response text)
 returns table(booking_id uuid, first_name text, trial_date date, start_time text, timezone text, duration_min integer, class_language text, status text, is_tba boolean, attendance_response text, calendar_url text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_norm text;
begin
  v_norm := lower(btrim(coalesce(p_response, '')));
  if v_norm not in ('yes', 'no') then
    raise exception 'invalid attendance response: %', p_response
      using errcode = '22023';
  end if;

  select b.id into v_id
  from public.trial_bookings b
  where b.confirmation_token = p_token
    and b.status <> 'cancelled'
  for update;
  if v_id is null then return; end if;

  update public.trial_bookings b
     set attendance_response     = v_norm,
         attendance_responded_at = now(),
         attendance_confirmed_at = case when v_norm = 'yes'
                                        then coalesce(b.attendance_confirmed_at, now())
                                        else b.attendance_confirmed_at end,
         status                  = case
                                     when v_norm = 'yes'
                                      and b.status in ('pending', 'date_selected',
                                                       'awaiting_attendance', 'confirmed')
                                     then 'confirmed_attendance'
                                     else b.status
                                   end
   where b.id = v_id;

  return query select * from public.fn_trial_booking_public_view(v_id);
end;
$function$;

create or replace function public.respond_trial_attendance(p_token uuid, p_response text, p_slot_id uuid)
 returns table(booking_id uuid, first_name text, trial_date date, start_time text, timezone text, duration_min integer, class_language text, status text, is_tba boolean, attendance_response text, calendar_url text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_booking public.trial_bookings%rowtype;
  v_slot    public.trial_slots%rowtype;
  v_norm    text;
  v_taken   integer;
begin
  v_norm := lower(btrim(coalesce(p_response, '')));
  if v_norm not in ('yes', 'no') then
    raise exception 'invalid attendance response: %', p_response
      using errcode = '22023';
  end if;

  -- Every column reference below is table-qualified on purpose. RETURNS TABLE
  -- declares trial_date, start_time, timezone, duration_min, status,
  -- attendance_response and the rest as OUT parameters, and an unqualified
  -- mention of any of them inside a query is ambiguous -- plpgsql raises at run
  -- time, not at migration time, so it would have failed on a real student's
  -- click rather than here.
  select * into v_booking
  from public.trial_bookings b
  where b.confirmation_token = p_token
    and b.status <> 'cancelled'
  for update;

  if not found then
    return;
  end if;

  -- A day choice only means anything alongside a yes. Someone declining is
  -- leaving, and moving her first would be pointless bookkeeping.
  if v_norm = 'yes'
     and p_slot_id is not null
     and p_slot_id is distinct from v_booking.slot_id then

    -- Locked, so two students choosing the last seat of the same session are
    -- serialised and the second one is told it is full instead of both being
    -- seated.
    select * into v_slot
    from public.trial_slots s
    where s.id = p_slot_id
    for update;

    if not found
       or not v_slot.is_active
       or v_slot.lifecycle <> 'active'
       or v_slot.trial_date < current_date then
      raise exception 'trial_slot_unavailable' using errcode = 'P0001';
    end if;

    if v_slot.class_language is distinct from v_booking.class_language then
      raise exception 'trial_slot_wrong_language' using errcode = 'P0001';
    end if;

    -- Counted here rather than through fn_trial_slot_seats_left because this
    -- booking must be excluded: it is being moved OUT of wherever it is, and
    -- if it already sits on the target session it must not be counted twice.
    select count(*) into v_taken
    from public.trial_bookings b
    where b.slot_id = v_slot.id
      and b.id <> v_booking.id
      and b.status <> 'cancelled'
      and coalesce(b.attendance_response, '') <> 'no';

    if v_taken >= coalesce(v_slot.capacity, 0) then
      raise exception 'trial_slot_full' using errcode = 'P0001';
    end if;

    update public.trial_bookings b
       set slot_id        = v_slot.id,
           trial_date     = v_slot.trial_date,
           start_time     = v_slot.start_time,
           timezone       = v_slot.timezone,
           duration_min   = coalesce(v_slot.duration_min, b.duration_min),
           meeting_url    = coalesce(v_slot.meeting_url, b.meeting_url),
           day_of_week    = v_slot.day_of_week,
           is_tba         = false,
           slot_chosen_at = now(),
           changed_at     = now()
     where b.id = v_booking.id;
  end if;

  update public.trial_bookings b
     set attendance_response     = v_norm,
         attendance_responded_at = now(),
         attendance_confirmed_at = case when v_norm = 'yes'
                                        then coalesce(b.attendance_confirmed_at, now())
                                        else b.attendance_confirmed_at end,
         status                  = case
                                     when v_norm = 'yes'
                                      and b.status in ('pending', 'date_selected',
                                                       'awaiting_attendance', 'confirmed')
                                     then 'confirmed_attendance'
                                     else b.status
                                   end
   where b.id = v_booking.id;

  return query select * from public.fn_trial_booking_public_view(v_booking.id);
end;
$function$;

-- The two students who confirmed before this migration existed. Written the
-- same way the function now writes it, so they are indistinguishable from a
-- confirmation received after it.
update public.trial_bookings b
   set status = 'confirmed_attendance'
 where b.attendance_response = 'yes'
   and b.status in ('pending', 'date_selected', 'awaiting_attendance', 'confirmed');
