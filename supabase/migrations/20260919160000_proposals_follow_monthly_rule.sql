-- ============================================================================
-- The proposer stops thinking in weeks.
--
-- `fn_propose_trial_slot` fires when every session in a language is full and
-- proposes one more. It dated that proposal by adding seven days to the last
-- session. Under the monthly rule (see 20260919150000) that is wrong twice:
--
--   1. It can land on a weekday trials no longer run on — the same mistake
--      `advance_trial_slots` was taught to avoid, in the one other place that
--      invents a date.
--   2. A session a week later does not help the people the CURRENT weekend is
--      turning away. If both Saturday sessions are full, what is needed is
--      another hour on that weekend, not a class four weeks out.
--
-- So in monthly mode the proposal stays on the same first weekend and only
-- rolls to the next month's weekend when this one is already too close to
-- fill (under two days). Weekly mode keeps the old +7 behaviour exactly.
--
-- Everything else about the function is reproduced verbatim: the full-check,
-- the one-pending-proposal guard, the conflict re-check, the capacity copied
-- from the running sessions, both notifications and their wording.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_propose_trial_slot(p_language text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_last_date   date;
  v_suggestion  record;
  v_date        date;
  v_capacity    integer;
  v_min_to_run  integer;
  v_full_list   text;
  v_id          uuid;
  v_mode        text;
  v_weekdays    int[];
begin
  if not public.fn_trial_language_is_full(p_language) then
    return null;
  end if;

  if exists (
    select 1 from public.trial_slot_proposals
    where class_language is not distinct from p_language and status = 'pending'
  ) then
    return null;
  end if;

  select coalesce(s.rollover_mode, 'weekly'), coalesce(s.trial_weekdays, array[5,6])
    into v_mode, v_weekdays
    from public.trial_settings s where s.id = 1;
  v_mode     := coalesce(v_mode, 'weekly');
  v_weekdays := coalesce(v_weekdays, array[5,6]);

  -- Copy the shape of the sessions already running rather than inventing one:
  -- whatever capacity and minimum the owner last chose for this language is what
  -- the new session should carry.
  select max(s.trial_date),
         max(s.capacity),
         max(s.min_to_run),
         string_agg(to_char(s.trial_date, 'DD Mon') || ' ' || s.start_time, ', '
                    order by s.trial_date)
    into v_last_date, v_capacity, v_min_to_run, v_full_list
  from public.trial_slots s
  where s.is_active
    and s.lifecycle = 'active'
    and s.trial_date >= current_date
    and s.class_language is not distinct from p_language;

  if v_last_date is null then
    return null;
  end if;

  -- Highest-scoring suggestion that still has no conflict when checked now.
  -- fn_suggest_trial_slots already filters on conflicts, but it is stable over a
  -- statement and the availability rules it reads can change between runs, so
  -- the guard is re-run rather than trusted.
  for v_suggestion in
    select * from public.fn_suggest_trial_slots() order by score desc, day_of_week
  loop
    if exists (
      select 1 from public.fn_trial_slot_conflicts(
        v_suggestion.day_of_week, v_suggestion.start_time, v_suggestion.duration_min)
    ) then
      continue;
    end if;

    if v_mode = 'monthly_first_weekend' then
      -- A suggestion on a weekday trials do not run on cannot be proposed at
      -- all, however well it scores. The pattern is the constraint.
      if not (v_suggestion.day_of_week = any (v_weekdays)) then
        continue;
      end if;

      -- The same weekend the full sessions are on. Only if that date is
      -- already upon us (under two days, which is the lead the rest of the
      -- system assumes) does it move to next month's weekend.
      v_date := public.first_dow_of_month(v_last_date, v_suggestion.day_of_week);
      while v_date < current_date + 2 loop
        v_date := public.next_monthly_trial_date(v_date, v_suggestion.day_of_week);
      end loop;
    else
      -- The next occurrence of that weekday strictly after the last session.
      v_date := v_last_date
                + (((v_suggestion.day_of_week - extract(dow from v_last_date)::int) + 7) % 7);
      if v_date <= v_last_date then
        v_date := v_date + 7;
      end if;
    end if;

    insert into public.trial_slot_proposals (
      class_language, trial_date, start_time, day_of_week, duration_min,
      timezone, capacity, min_to_run, reason
    )
    values (
      p_language, v_date, v_suggestion.start_time, v_suggestion.day_of_week,
      v_suggestion.duration_min, v_suggestion.timezone,
      coalesce(v_capacity, 12), v_min_to_run,
      'Every ' || coalesce(p_language, 'unspecified') || ' session is full (' || v_full_list || '). '
        || 'Suggested because: ' || coalesce(array_to_string(v_suggestion.reasons, '; '), 'no reason given') || '.'
    )
    returning id into v_id;

    -- The email. admin_notifications has no payload column, so everything the
    -- owner needs to decide has to fit in the message — a trigger forwards only
    -- id, message, type and created_at to notify-admin-email.
    insert into public.admin_notifications (type, message)
    values (
      'trial_slot_proposed',
      'Every ' || coalesce(p_language, 'unspecified') || ' trial session is full. '
        || 'Suggested new session: ' || to_char(v_date, 'FMDay DD Mon YYYY') || ' at '
        || v_suggestion.start_time || ' (' || v_suggestion.timezone || '). '
        || 'Nothing has been opened — approve or decline it in the admin panel under Trials.'
    );

    return v_id;
  end loop;

  -- Full, but nowhere free to put a class. Worth saying out loud once rather
  -- than failing silently, because it means the teacher's week is the
  -- constraint, not the seats.
  insert into public.admin_notifications (type, message)
  values (
    'trial_slot_proposal_blocked',
    'Every ' || coalesce(p_language, 'unspecified') || ' trial session is full (' || v_full_list || '), '
      || 'but every suggested time collides with something already booked. '
      || 'No new session can be proposed until the week opens up.'
  );

  return null;
end;
$function$;

-- Nothing reads this in monthly mode. Saying so in the column beats leaving a
-- 7 sitting there for the next reader to believe.
COMMENT ON COLUMN public.trial_settings.rollover_interval_days IS
  'Days added to a session that has run — WEEKLY MODE ONLY. Ignored when rollover_mode = monthly_first_weekend, which steps to the first matching weekday of the next month instead.';
