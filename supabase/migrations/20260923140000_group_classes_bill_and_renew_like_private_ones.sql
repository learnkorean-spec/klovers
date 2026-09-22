-- Re: "2 groups must be auto as well" - the private students' renewal
-- (20260923110000 / 20260923120000), for the students who sit in a class.
--
-- The rule is the same one, and it is hers: a class taught PAST what she paid
-- for is the only proof she is carrying on, so that is the moment the next
-- period opens. A period merely running out says nothing - she may have
-- finished.
--
-- THREE THINGS HAD TO BE TRUE FIRST
--
-- A renewal rule cannot stand on a balance that is not being kept honestly,
-- and this one was not:
--
-- 1. trg_pkg_attendance_approval was AFTER UPDATE ONLY.
--    save_session_attendance (the Session Attendance screen) inserts straight
--    in with admin_approved = true - a plain INSERT, so the trigger never
--    fired and nobody was billed. GroupAttendanceManager pre-creates every row
--    with admin_approved = false at session creation and then UPDATEs, so it
--    billed correctly. The same act on two screens moved one student's balance
--    and not the other's, and which one you got depended on the screen you
--    happened to open.
--
-- 2. It debited "the most recent APPROVED+PAID enrolment for this user".
--    Harmless while nobody had two. Renewal makes two the normal case, and
--    then it debits the wrong one. The seat already knows which period it
--    belongs to: pkg_group_members.enrollment_id.
--
-- 3. sessions_remaining was floored: GREATEST(sessions_remaining - 1, 0).
--    So a class taught past the package left no trace at all - and that trace
--    is the entire signal this rule is built on. The floor is gone. A group
--    balance can now read -1, which is a true statement about what happened.
--
-- WHAT THE RULE DOES
--
--   * expires the old period, leaving it holding exactly the classes it paid
--     for;
--   * opens a new one on the same terms - size, price, currency, slot, day,
--     timezone - unpaid, carrying the overflow class;
--   * moves her seat onto it, so the next class is billed to the right period;
--   * sends the payment letter at once.
--
-- It does nothing for a seat that is not active: a student who has been taken
-- out of the class is not carrying on.
--
-- WHY THE LETTER IS SENT DIRECTLY
--
-- send_payment_ask_emails only writes to a student whose first_class_date is
-- today or tomorrow. That window is right for a first enrolment and useless
-- for a renewal, where the class that triggered it has already happened.
-- send_enrolment_payment_ask sends the same letter with no window.
--
-- The whole billing path swallows its own errors: recording attendance must
-- never fail because of what the bill did afterwards.

-- ---------------------------------------------------------------------------
-- 1. The letter, with no cron window in front of it
-- ---------------------------------------------------------------------------

create or replace function public.send_enrolment_payment_ask(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare _e record;
begin
  select e.id, e.amount, e.currency, e.first_class_date, e.due_at,
         coalesce(p.language,'ar') as lang, p.name, p.email, p.unsubscribe_token,
         p.email_unsubscribed
    into _e
    from public.enrollments e
    join public.profiles p on p.user_id = e.user_id
   where e.id = p_enrollment_id;

  if _e.id is null then return; end if;
  if _e.email is null or trim(_e.email) = '' then return; end if;
  if coalesce(_e.email_unsubscribed, false) then return; end if;

  perform app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',          'payment_method_reminder',
      'email',             _e.email,
      'name',              _e.name,
      'language',          _e.lang,
      'enrollment_id',     _e.id,
      'amount',            _e.amount,
      'currency',          _e.currency,
      'first_class_date',  _e.first_class_date,
      'unsubscribe_token', _e.unsubscribe_token
    )
  );

  update public.enrollments
     set payment_email_sent_at = now()
   where id = p_enrollment_id;
end
$function$;

-- ---------------------------------------------------------------------------
-- 2. A class past the period opens the next one
-- ---------------------------------------------------------------------------

create or replace function public.roll_enrolment_if_overdrawn(p_enrollment_id uuid, p_from date default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _old record;
  _new uuid;
  _over int;
begin
  select * into _old from public.enrollments where id = p_enrollment_id;
  if _old.id is null then return null; end if;
  if _old.deleted_at is not null then return null; end if;
  if coalesce(_old.enrollment_status,'active') <> 'active' then return null; end if;
  if _old.sessions_remaining >= 0 then return null; end if;
  if coalesce(_old.classes_included,0) <= 0 then return null; end if;

  -- A seat that is not active is a student who is not carrying on.
  if not exists (
    select 1 from public.pkg_group_members m
     where m.user_id = _old.user_id and m.member_status = 'active'
  ) then
    return null;
  end if;

  _over := abs(_old.sessions_remaining);

  update public.enrollments
     set enrollment_status = 'expired',
         sessions_remaining = 0
   where id = _old.id;

  insert into public.enrollments
    (user_id, plan_type, duration, classes_included, amount, unit_price,
     currency, level, package_id, slot_id, timezone,
     assigned_day, assigned_time, assigned_timezone,
     payment_provider, payment_method,
     status, approval_status, payment_status, enrollment_status,
     sessions_total, sessions_remaining,
     matched_at, first_class_date, admin_notes)
  values
    (_old.user_id, _old.plan_type, _old.duration, _old.classes_included,
     _old.amount, _old.unit_price, _old.currency, _old.level,
     _old.package_id, _old.slot_id, _old.timezone,
     _old.assigned_day, _old.assigned_time, _old.assigned_timezone,
     _old.payment_provider, _old.payment_method,
     _old.status, 'APPROVED', 'PENDING_PAYMENT', 'active',
     _old.classes_included, _old.classes_included - _over,
     now(), coalesce(p_from::timestamptz, now()),
     'Opened automatically: the previous period ran out and a class was taught past it.')
  returning id into _new;

  -- Her seat follows her to the new period, so the next class is billed to it.
  update public.pkg_group_members
     set enrollment_id = _new
   where user_id = _old.user_id
     and member_status = 'active'
     and enrollment_id = _old.id;

  perform public.send_enrolment_payment_ask(_new);
  return _new;
end
$function$;

-- ---------------------------------------------------------------------------
-- 3. Billing a group class: both screens, the right period, no floor
-- ---------------------------------------------------------------------------

create or replace function public.handle_pkg_attendance_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  _enrollment_id uuid;
  _charge_type   text;
  _inserted_rows integer := 0;
  _group_id      uuid;
  _session_date  date;
BEGIN
  -- Fires on INSERT as well as UPDATE now. See the note at the top: one screen
  -- inserts an already-approved row and the other updates one, and only the
  -- second was billing.
  IF NEW.admin_approved IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.admin_approved IS TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'excused' THEN
    _charge_type := 'waived_emergency';
  ELSE
    _charge_type := 'paid_session';
  END IF;

  -- Idempotent: the charge row is the record of having billed this class once.
  INSERT INTO public.pkg_class_charges(session_id, user_id, charge_type)
  VALUES (NEW.session_id, NEW.user_id, _charge_type)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  GET DIAGNOSTICS _inserted_rows = ROW_COUNT;

  IF _inserted_rows = 1 AND _charge_type = 'paid_session' THEN
    SELECT s.group_id, s.session_date INTO _group_id, _session_date
      FROM public.pkg_group_sessions s WHERE s.id = NEW.session_id;

    -- The seat says which period this class belongs to.
    SELECT m.enrollment_id INTO _enrollment_id
      FROM public.pkg_group_members m
     WHERE m.group_id = _group_id AND m.user_id = NEW.user_id
       AND m.member_status = 'active';

    IF _enrollment_id IS NULL THEN
      SELECT id INTO _enrollment_id
        FROM public.enrollments
       WHERE user_id = NEW.user_id
         AND deleted_at IS NULL
         AND coalesce(enrollment_status,'active') = 'active'
         AND approval_status = 'APPROVED'
       ORDER BY created_at DESC
       LIMIT 1;
    END IF;

    IF _enrollment_id IS NOT NULL THEN
      -- No floor. GREATEST(..., 0) made a class taught past the package
      -- invisible, and that is the only signal the renewal rule has.
      UPDATE public.enrollments
         SET sessions_remaining = sessions_remaining - 1
       WHERE id = _enrollment_id;

      PERFORM public.roll_enrolment_if_overdrawn(_enrollment_id, _session_date);
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Billing must never stop attendance being recorded.
  RETURN NEW;
END;
$function$;

drop trigger if exists trg_pkg_attendance_approval on public.pkg_attendance;
create trigger trg_pkg_attendance_approval
  after insert or update on public.pkg_attendance
  for each row execute function public.handle_pkg_attendance_approval();
