-- Re: "i activated aya in the group why wasnt link?"
--
-- Aya IS linked. Her seat carries her enrolment id and the group card says so:
-- "1 of 1 member linked to an enrolment". Nothing was wrong with the seating.
--
-- What was missing was the other half of the sentence: the group had no
-- CLASSES to be present at. Hangul · Friday started on 20 Sep with a seated,
-- linked, paid student, and `pkg_group_sessions` was empty - so there was no
-- register to open, nothing to mark, and her balance had sat at 4 of 4 since
-- March.
--
-- WHY IT WAS EMPTY
--
-- Private lessons have had a weekly generator since 20260908 (cron job
-- `generate-scheduled-sessions`). Group classes never had one.
-- `generate_sessions_for_group` exists, but it only runs when somebody opens
-- the Session Attendance screen and presses Generate. A group that starts
-- therefore has no calendar until a person remembers to make one - and
-- remembering is exactly what this system is supposed to stop needing.
--
-- AND WHY IT SEEDS THE REGISTER TOO
--
-- This is not tidiness, it is what keeps the Group Attendance screen working.
-- That screen writes `pkg_attendance` in exactly one place: inside its own
-- "create session" call, immediately after a successful insert. Its Present /
-- Absent buttons are UPDATEs keyed on (session_id, user_id) and insert
-- nothing, and `loadAttendance` reads `pkg_attendance` with no fallback to the
-- member list. So a session row that screen did not create itself renders
-- "No students in this session." and there is no way to take the register at
-- all.
--
-- Seeding as 'absent' / admin_approved = false is byte-for-byte what that
-- screen writes, and it bills nothing: handle_pkg_attendance_approval fires
-- only when admin_approved BECOMES true. The Session Attendance screen does
-- not need the seed - get_session_roster builds its roster from the members
-- with a LEFT JOIN - but it is unharmed by it, because save_session_attendance
-- upserts.
--
-- Members who join after a session is generated get their row on the next
-- nightly run, which is why the seed covers every future session each night
-- rather than only the ones created in that run.

create or replace function public.fn_generate_group_sessions(p_weeks integer default 8)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sessions integer := 0;
  v_rows     integer := 0;
begin
  if p_weeks is null or p_weeks < 1 or p_weeks > 52 then
    raise exception 'p_weeks must be between 1 and 52, got %', p_weeks;
  end if;

  -- Only groups that are active AND have actually started. A group with no
  -- start date is still being filled; putting classes on its calendar would
  -- say it is running when it is not.
  with live as (
    select g.id as group_id,
           sp.day_of_week,
           greatest(current_date, g.start_date) as from_date
      from public.pkg_groups g
      join public.schedule_packages sp on sp.id = g.package_id
     where g.is_active
       and g.start_date is not null
       and sp.day_of_week is not null
  ),
  dates as (
    select l.group_id, d::date as session_date
      from live l
      cross join lateral generate_series(l.from_date,
                                         l.from_date + (p_weeks * 7),
                                         interval '1 day') g(d)
     where extract(dow from d)::int = l.day_of_week
  )
  insert into public.pkg_group_sessions (group_id, session_date)
  select group_id, session_date from dates
  on conflict (group_id, session_date) do nothing;

  get diagnostics v_sessions = row_count;

  -- The register, not just the date. See the note at the top: without this the
  -- Group Attendance screen cannot mark anybody on a session it did not create
  -- itself.
  insert into public.pkg_attendance (session_id, user_id, status, admin_approved)
  select s.id, m.user_id, 'absent', false
    from public.pkg_group_sessions s
    join public.pkg_groups g on g.id = s.group_id and g.is_active
    join public.pkg_group_members m
      on m.group_id = s.group_id and m.member_status = 'active'
   where s.session_date >= current_date
  on conflict (session_id, user_id) do nothing;

  get diagnostics v_rows = row_count;
  return v_sessions + v_rows;
end
$function$;

-- Nightly rather than weekly: a group started today should have a register
-- tomorrow, not next Monday.
select cron.schedule('generate-group-sessions', '30 2 * * *',
                     'select public.fn_generate_group_sessions(8);');

select public.fn_generate_group_sessions(8);
