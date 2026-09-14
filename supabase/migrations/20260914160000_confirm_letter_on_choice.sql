-- A student who confirms her trial slot gets nothing in writing.
--
-- TrialConfirmPage calls respond_trial_attendance, then setState("success").
-- That is the whole of it: no email is sent, and the page has never referenced
-- TRIAL_CONFIRMATION_EMAIL_ENABLED -- that flag gates sendTrialConfirmationEmail,
-- which only the admin "approve trial" flow calls. So the date and the Google
-- Meet link live on screen until she closes the tab, and then they are gone.
--
-- On 14 Sep, 52 people were mailed a letter offering two times and asked to
-- confirm one. Every one of them would have hit exactly that dead end.
--
-- WHY A TRIGGER AND NOT A LINE IN THE PAGE
-- ----------------------------------------
-- The page runs client-side with the anon key, and send-confirmation-email
-- requires admin-or-service. Wiring it there would mean either loosening that
-- function's auth or shipping a second endpoint. The database already knows the
-- moment the choice becomes real -- it is the row change itself -- and
-- app_private.invoke_edge already carries the service key from Vault. It also
-- means a confirmation arriving by any route (the page, an admin, a future
-- WhatsApp flow) is covered, rather than only the one path we remembered.
--
-- FIELD FORMATS THAT MATTER
-- -------------------------
-- buildTrialConfirmedEmail parses trial_date and trial_time itself:
--   trial_date   raw YYYY-MM-DD. A pre-formatted date breaks the .ics and the
--                headline falls back to printing the string verbatim.
--   trial_time   24-hour HH:MM, split on ':'.
--   trial_timezone defaults to Asia/Kuala_Lumpur when omitted -- the teacher's
--                zone. Omitting it for a Cairo class is a five-hour error in
--                the one line the student acts on, so it is always passed from
--                the SLOT.
--   class_link_url is the only link field this template reads; it does not
--                look at meeting_url.
--
-- The times come from trial_slots, never from the booking: the booking's own
-- columns carried a wrong host default for ten weeks earlier this year.

alter table public.trial_bookings
  add column if not exists choice_confirmation_sent_at timestamptz;

comment on column public.trial_bookings.choice_confirmation_sent_at is
  'When the "your trial is confirmed" letter was sent after the student chose '
  'her slot. Null means never sent. Guards against a second letter if she '
  'confirms again. Added 2026-09-14.';

create or replace function public.email_student_on_trial_choice()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_slot public.trial_slots%rowtype;
begin
  -- Only the moment a 'yes' appears. Not a re-save of a row that already said
  -- yes, and not a 'no' -- someone declining does not want a confirmation.
  if new.attendance_response is distinct from 'yes' then
    return new;
  end if;
  if old.attendance_response is not distinct from 'yes' then
    return new;
  end if;
  if new.choice_confirmation_sent_at is not null then
    return new;
  end if;
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;

  select * into v_slot
    from public.trial_slots s
   where s.id = new.slot_id;

  -- No slot means no date and no room to tell her about. Better to send nothing
  -- than a confirmation with blank lines; send-confirmation-email would return
  -- 200 for that payload rather than refuse it.
  if not found then
    return new;
  end if;
  if v_slot.trial_date is null or v_slot.start_time is null then
    return new;
  end if;

  perform app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',           'trial_confirmed',
      'email',              new.email,
      'name',               coalesce(nullif(btrim(new.name), ''),
                                     case when coalesce(new.class_language, '') = 'arabic'
                                          then 'طالبتنا العزيزة' else 'there' end),
      'language',           case when coalesce(new.class_language, '') = 'arabic' then 'ar' else 'en' end,
      'level',              new.level,
      -- Raw YYYY-MM-DD and 24-hour HH:MM. See the note at the top.
      'trial_date',         to_char(v_slot.trial_date, 'YYYY-MM-DD'),
      'trial_time',         substring(v_slot.start_time::text from 1 for 5),
      'trial_timezone',     coalesce(v_slot.timezone, 'Africa/Cairo'),
      'student_timezone',   new.student_timezone,
      'trial_duration_min', coalesce(v_slot.duration_min, 30),
      'class_link_url',     v_slot.meeting_url,
      'calendar_url',       new.calendar_url,
      'booking_id',         new.id
    )
  );

  -- Stamped here rather than on delivery: invoke_edge is fire-and-forget over
  -- pg_net and there is no callback to wait for. The cost of that choice is a
  -- letter that silently fails leaves a stamp behind; the cost of the opposite
  -- is mailing her again every time she reopens the page. The second is worse,
  -- and a missing letter is visible in the edge logs.
  new.choice_confirmation_sent_at := now();

  return new;
end;
$function$;

comment on function public.email_student_on_trial_choice() is
  'Sends the trial_confirmed letter -- date, time, Meet link, .ics -- the moment '
  'a booking first records attendance_response = yes. Added 2026-09-14, when '
  'confirming a slot produced no email at all.';

drop trigger if exists trg_email_student_on_trial_choice on public.trial_bookings;

create trigger trg_email_student_on_trial_choice
  before update of attendance_response on public.trial_bookings
  for each row
  execute function public.email_student_on_trial_choice();

-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE on every new function to
-- anon, authenticated and service_role, and `revoke from public` does not
-- remove those. This one sends mail; it must not be reachable over PostgREST.
-- See claude/REVOKE_FROM_PUBLIC_IS_NOT_ENOUGH_2026-09-14.md.
revoke all on function public.email_student_on_trial_choice() from public;
revoke all on function public.email_student_on_trial_choice() from anon;
revoke all on function public.email_student_on_trial_choice() from authenticated;
revoke all on function public.email_student_on_trial_choice() from service_role;

do $$
declare
  v_anon boolean;
  v_auth boolean;
begin
  select has_function_privilege('anon', 'public.email_student_on_trial_choice()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.email_student_on_trial_choice()', 'EXECUTE')
    into v_anon, v_auth;

  if v_anon or v_auth then
    raise exception
      'email_student_on_trial_choice is still callable over the API (anon=%, authenticated=%)',
      v_anon, v_auth;
  end if;
end $$;
