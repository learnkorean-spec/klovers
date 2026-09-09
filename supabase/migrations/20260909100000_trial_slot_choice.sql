-- Let a student pick WHICH session they attend, not just whether they attend.
--
-- Until now the attendance letter asked one question — are you coming to the
-- date we picked for you — and the only two answers were yes and no. A student
-- free on Friday the 25th but not the 18th had no way to say so, so she said
-- no, and a seat she would happily have taken was released. "No" was carrying
-- two different meanings: not interested, and not that day.
--
-- The 57 people in the backlog were allocated to sessions by us, not chosen by
-- them. Offering the choice is the difference between being told where to be
-- and being asked when suits.
--
-- Two additions, both read/written only through SECURITY DEFINER functions
-- keyed on the confirmation token — the anon role still cannot touch
-- trial_bookings or trial_slots directly:
--
--   1. get_trial_slot_options(token) — the sessions this student may choose
--      between: same language, still active, still ahead, still with room.
--   2. respond_trial_attendance(token, response, slot_id) — a three-argument
--      overload that moves the booking to the chosen session before recording
--      the yes. The existing two-argument version is untouched, so a browser
--      running the currently deployed bundle keeps working exactly as it does
--      today.
--
-- Sends no email. The customer email freeze of 7 Sep is untouched.

begin;

-- 0. FIRST: the confirmation link has never worked --------------------------
--
-- Found while testing this migration against a copy of the schema, then
-- confirmed against production with a token that matches nothing:
--
--   select get_trial_booking_by_token('9999...');
--   ERROR: 42702: column reference "status" is ambiguous
--
-- Both functions behind /trial-confirm declare RETURNS TABLE(..., status text,
-- ...), which makes `status` an OUT parameter, and both then write
--
--   ... WHERE confirmation_token = p_token AND status <> 'cancelled'
--
-- with `status` unqualified. plpgsql cannot tell the OUT parameter from the
-- column and refuses to run the query. This is a run-time error, not a
-- creation-time one, so the functions installed cleanly and have sat there
-- failing on every single call.
--
-- The consequence: every student who clicked "Confirm my attendance" got the
-- page's "Link Invalid" card — "اللينك ده مش شغّال" — because the page treats
-- any RPC error as a bad token. Nobody has ever hit it, because no attendance
-- letter has ever been sent. Had the first batch gone out first, nine students
-- would have been told their booking did not exist.
--
-- Fixed by qualifying the column. Nothing else about either function changes.

create or replace function public.get_trial_booking_by_token(p_token uuid)
returns table (
  booking_id uuid, first_name text, trial_date date, start_time text,
  timezone text, duration_min integer, class_language text, status text,
  is_tba boolean, attendance_response text, calendar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select b.id into v_id
  from public.trial_bookings b
  where b.confirmation_token = p_token
    and b.status <> 'cancelled';
  if v_id is null then return; end if;
  return query select * from public.fn_trial_booking_public_view(v_id);
end;
$$;

create or replace function public.respond_trial_attendance(p_token uuid, p_response text)
returns table (
  booking_id uuid, first_name text, trial_date date, start_time text,
  timezone text, duration_min integer, class_language text, status text,
  is_tba boolean, attendance_response text, calendar_url text
)
language plpgsql
security definer
set search_path = public
as $$
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
                                        else b.attendance_confirmed_at end
   where b.id = v_id;

  return query select * from public.fn_trial_booking_public_view(v_id);
end;
$$;

-- Occupancy is asked for on every option of every page load, so it gets an
-- index rather than a sequential scan of the table.
create index if not exists idx_trial_bookings_slot_live
  on public.trial_bookings (slot_id)
  where status <> 'cancelled';

-- How many seats a session really has left.
--
-- A declined booking does NOT hold a seat: the student told us she is not
-- coming, and the row is kept only so we can tell "said no" apart from "never
-- answered". Counting it would let a session look full while half of it has
-- already dropped out. This mirrors what /admin/today already shows.
create or replace function public.fn_trial_slot_seats_left(p_slot_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
           0,
           coalesce(s.capacity, 0) - (
             select count(*)
             from public.trial_bookings b
             where b.slot_id = s.id
               and b.status <> 'cancelled'
               and coalesce(b.attendance_response, '') <> 'no'
           )
         )::integer
  from public.trial_slots s
  where s.id = p_slot_id;
$$;

comment on function public.fn_trial_slot_seats_left(uuid) is
  'Seats remaining on a trial session. A declined booking does not hold a seat.';

-- The sessions this student may choose between.
--
-- Same language, because a slot is taught in one language only and moving an
-- Arabic-track student into an English session would hand her a class she
-- cannot follow. Future-dated, active, and not yet full — except for the one
-- she is already on, which is always returned even at zero seats left, since
-- her own booking is what filled it and the page must be able to show her
-- where she currently stands.
create or replace function public.get_trial_slot_options(p_token uuid)
returns table (
  slot_id     uuid,
  trial_date  date,
  start_time  text,
  timezone    text,
  duration_min integer,
  seats_left  integer,
  is_current  boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_booking public.trial_bookings%rowtype;
begin
  select * into v_booking
  from public.trial_bookings b
  where b.confirmation_token = p_token
    and b.status <> 'cancelled';

  if not found then
    return;
  end if;

  return query
  select s.id,
         s.trial_date,
         s.start_time,
         s.timezone,
         s.duration_min,
         public.fn_trial_slot_seats_left(s.id),
         (s.id = v_booking.slot_id)
  from public.trial_slots s
  where s.is_active
    and s.lifecycle = 'active'
    and s.trial_date >= current_date
    and s.class_language is not distinct from v_booking.class_language
    and (
      s.id = v_booking.slot_id
      or public.fn_trial_slot_seats_left(s.id) > 0
    )
  order by s.trial_date, s.start_time;
end;
$$;

comment on function public.get_trial_slot_options(uuid) is
  'Sessions a token-holding trial student may move to: same language, active, future, with room. '
  'Her current session is always included even when full.';

grant execute on function public.get_trial_slot_options(uuid) to anon, authenticated;

-- Answer, and optionally choose the day.
--
-- Three arguments rather than a changed signature: the deployed frontend calls
-- the two-argument version, and a migration that renames the function out from
-- under it would break every confirmation link in flight between the moment
-- this applies and the moment the new bundle reaches the CDN.
--
-- The move happens BEFORE the answer is recorded, and both live in one
-- statement's transaction: a student who picks a session that fills up in the
-- same second gets an error and no change at all, rather than a yes recorded
-- against the wrong date.
create or replace function public.respond_trial_attendance(
  p_token uuid,
  p_response text,
  p_slot_id uuid
)
returns table (
  booking_id uuid, first_name text, trial_date date, start_time text,
  timezone text, duration_min integer, class_language text, status text,
  is_tba boolean, attendance_response text, calendar_url text
)
language plpgsql
security definer
set search_path = public
as $$
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
  -- mention of any of them inside a query is ambiguous — plpgsql raises at run
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
                                        else b.attendance_confirmed_at end
   where b.id = v_booking.id;

  return query select * from public.fn_trial_booking_public_view(v_booking.id);
end;
$$;

comment on function public.respond_trial_attendance(uuid, text, uuid) is
  'Records yes/no and, on a yes with a slot id, moves the booking to that session first. '
  'Raises trial_slot_full / trial_slot_unavailable / trial_slot_wrong_language rather than '
  'seating anyone incorrectly. The two-argument overload is unchanged.';

grant execute on function public.respond_trial_attendance(uuid, text, uuid) to anon, authenticated;

commit;
