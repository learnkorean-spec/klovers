-- When the trial sessions of a language fill up, propose the next one — and
-- open nothing until the owner says so.
--
-- Owner request, 8 Sep 2026, verbatim: "if all 2 filled, suggest me as a
-- notification to open the new slot ... by sending to reham.elshrkawy@gmail.com
-- then the new 2 days are opened after i confirm."
--
-- WHY THIS IS NOT AN EMAILED LINK
--
-- The obvious build is an "open this session" button in the email. That button
-- is a public endpoint that creates a class, reachable by anyone the mail is
-- forwarded to, anyone on the mailbox, and every link scanner that fetches every
-- URL in every message. So the email carries the proposal and nothing else; the
-- approval lives in the admin panel behind `has_role(auth.uid(), 'admin')`, and
-- both approve and decline are SECURITY DEFINER functions that check that role
-- themselves rather than trusting the caller.
--
-- WHAT ALREADY EXISTED, AND WHY IT WAS NOT ENOUGH
--
-- `claim_trial_capacity_alert` already notices a full-ish session and mails the
-- owner. Two things stop it doing this job:
--
--   1. It fires from `book-trial` only — as a side effect of a NEW booking.
--      What fills a session now is a student confirming attendance, which that
--      path never sees.
--   2. Its threshold is a hardcoded 4 confirmed students, from when capacity was
--      8. Capacity is 12 today, so "full" for that alert and "full" for a seat
--      are different numbers. It is left alone: it drives a student-facing
--      "your group is full" letter and changing its meaning would change that.
--
-- So this is a separate, scheduled check that asks the question the owner
-- actually asked: is there any seat left in this language at all.
--
-- Sends no student email. The customer email freeze of 7 Sep is untouched. The
-- one message it produces is an admin_notifications row, which the existing
-- trigger forwards to notify-admin-email and on to the three admin addresses.

begin;

-- 1. the proposal ------------------------------------------------------------

create table if not exists public.trial_slot_proposals (
  id               uuid primary key default gen_random_uuid(),
  class_language   text not null,
  trial_date       date not null,
  start_time       text not null,
  day_of_week      integer not null,
  duration_min     integer not null,
  timezone         text not null,
  capacity         integer not null,
  min_to_run       integer,
  -- Why this date was proposed, in the owner's language of the moment: which
  -- sessions were full, and what the suggestion engine liked about this slot.
  reason           text not null,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'declined')),
  created_at       timestamptz not null default now(),
  decided_at       timestamptz,
  decided_by       uuid,
  created_slot_id  uuid references public.trial_slots(id) on delete set null
);

comment on table public.trial_slot_proposals is
  'A suggested new trial session, waiting for the owner to approve it in the admin panel. '
  'Nothing here creates a class; fn_approve_trial_slot_proposal does, and only for an admin.';

-- One open proposal per language at a time. Without this the hourly job would
-- stack a new proposal — and a new email — every hour that the sessions stay
-- full, which is the fastest way to teach someone to ignore an alert.
create unique index if not exists uq_trial_slot_proposals_one_pending_per_language
  on public.trial_slot_proposals (class_language)
  where status = 'pending';

create index if not exists idx_trial_slot_proposals_status_created
  on public.trial_slot_proposals (status, created_at desc);

alter table public.trial_slot_proposals enable row level security;

-- Same shape as admin_notifications: admins only, and the functions below are
-- SECURITY DEFINER so the scheduled job can write without a session.
drop policy if exists "Admins can manage trial slot proposals" on public.trial_slot_proposals;
create policy "Admins can manage trial slot proposals"
  on public.trial_slot_proposals for all
  using (public.has_role(auth.uid(), 'admin'));

-- 2. is this language actually full? -----------------------------------------

/**
 * True when the language has at least one active future session and NOT ONE of
 * them has a seat left.
 *
 * "At least one" matters: a language with no sessions at all is not full, it is
 * unscheduled, and proposing a date for it would fire the moment a series ends
 * rather than when it is oversubscribed.
 */
create or replace function public.fn_trial_language_is_full(p_language text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) > 0
     and count(*) filter (where public.fn_trial_slot_seats_left(s.id) > 0) = 0
  from public.trial_slots s
  where s.is_active
    and s.lifecycle = 'active'
    and s.trial_date >= current_date
    and s.class_language is not distinct from p_language;
$$;

-- 3. propose the next session ------------------------------------------------

/**
 * Propose one new session for a language whose sessions are all full.
 *
 * The date comes from fn_suggest_trial_slots(), which already scores weekday and
 * time against the teacher's real availability and filters out anything that
 * collides — that is the engine, and this does not second-guess it. What it adds
 * is the calendar: the suggestion is a weekday and a time, so the date chosen is
 * the next occurrence of that weekday AFTER the language's last existing
 * session, which extends the series rather than wedging a class into the middle
 * of one.
 *
 * Returns the proposal id, or null when nothing was proposed — because the
 * language is not full, because one is already pending, or because every
 * suggestion collided.
 */
create or replace function public.fn_propose_trial_slot(p_language text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_last_date   date;
  v_suggestion  record;
  v_date        date;
  v_capacity    integer;
  v_min_to_run  integer;
  v_full_list   text;
  v_id          uuid;
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

    -- The next occurrence of that weekday strictly after the last session.
    v_date := v_last_date
              + (((v_suggestion.day_of_week - extract(dow from v_last_date)::int) + 7) % 7);
    if v_date <= v_last_date then
      v_date := v_date + 7;
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
$$;

revoke all on function public.fn_propose_trial_slot(text) from public, anon, authenticated;

/** Every language that currently runs trials. Scheduled hourly. */
create or replace function public.fn_propose_trial_slots()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lang text;
  v_made integer := 0;
begin
  for v_lang in
    select distinct s.class_language
    from public.trial_slots s
    where s.is_active and s.lifecycle = 'active' and s.trial_date >= current_date
  loop
    if public.fn_propose_trial_slot(v_lang) is not null then
      v_made := v_made + 1;
    end if;
  end loop;
  return v_made;
end;
$$;

revoke all on function public.fn_propose_trial_slots() from public, anon, authenticated;

-- 4. the owner decides -------------------------------------------------------

/**
 * Approve a proposal and open the session.
 *
 * The meeting link is required, not optional. A trial session with no
 * meeting_url cannot be emailed to anybody — send-attendance-confirmations skips
 * exactly those rows — so a session created without one is a class nobody can be
 * invited to, and the failure would not show up until the send.
 *
 * The conflict guard runs again here. Hours may have passed since the proposal,
 * and the existing "Add trial class" dialog does a raw insert with no guard at
 * all, so this is the only create path in the system that checks.
 */
create or replace function public.fn_approve_trial_slot_proposal(
  p_id uuid,
  p_meeting_url text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  p public.trial_slot_proposals%rowtype;
  v_conflict text;
  v_slot_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  if p_meeting_url is null or btrim(p_meeting_url) = '' then
    raise exception 'meeting_url_required' using errcode = 'P0001';
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
    p.class_language, true, 'active', p.trial_date, btrim(p_meeting_url)
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
$$;

grant execute on function public.fn_approve_trial_slot_proposal(uuid, text) to authenticated;

/**
 * Decline a proposal.
 *
 * Declining is not the same as ignoring: it clears the one-pending-per-language
 * index, so the next hourly run may propose a different date. Leaving a proposal
 * pending is how the owner says "not yet, stop asking".
 */
create or replace function public.fn_decline_trial_slot_proposal(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  update public.trial_slot_proposals
     set status = 'declined', decided_at = now(), decided_by = auth.uid()
   where id = p_id and status = 'pending';

  if not found then
    raise exception 'proposal_not_found_or_decided' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.fn_decline_trial_slot_proposal(uuid) to authenticated;

-- 5. schedule ----------------------------------------------------------------
-- Hourly at :25, clear of advance-trial-slots (:10), purge-trial-rate-limits
-- (:15) and trial-rollover-notifications (:35).

do $$
begin
  if exists (select 1 from cron.job where jobname = 'propose-trial-slots') then
    perform cron.unschedule('propose-trial-slots');
  end if;
  perform cron.schedule(
    'propose-trial-slots',
    '25 * * * *',
    $job$select public.fn_propose_trial_slots();$job$
  );
end
$$;

commit;
