-- A "book a seat" lead had no phone column at all, so a student who filled
-- the enroll-now form but never finished signup left no way to reach her
-- beyond email. Add it, and surface it (as a clickable wa.me link) in the
-- enrollment/registration/trial admin notifications, which previously showed
-- only name + email even though profiles.phone has existed since the
-- trial-booking flow started collecting it.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.notify_new_enrollment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  _name text;
  _email text;
  _phone text;
  _display_status text;
  _wa_link text;
BEGIN
  SELECT name, email, phone INTO _name, _email, _phone
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

  -- approval_status alone is overloaded: it's set to APPROVED the instant a
  -- student holds a class seat (hold_my_seat / admin_confirm_student_into_group),
  -- which is a seat-eligibility flag, not a record that anyone reviewed or
  -- approved a payment. Showing it raw in this notification read as "an
  -- enrollment got approved" even when nothing had been paid or reviewed.
  -- Combine it with payment_status so the label says what actually happened.
  _display_status := CASE
    WHEN NEW.approval_status = 'APPROVED' AND NEW.payment_status = 'PAID'
      THEN 'Approved & paid'
    WHEN NEW.approval_status = 'APPROVED'
      THEN 'Seat held - awaiting payment'
    WHEN NEW.approval_status = 'UNDER_REVIEW'
      THEN 'Payment submitted - awaiting review'
    WHEN NEW.approval_status = 'REJECTED'
      THEN 'Rejected'
    WHEN NEW.approval_status = 'CANCELLED'
      THEN 'Cancelled'
    ELSE
      'Pending'
  END;

  _wa_link := CASE
    WHEN _phone IS NOT NULL AND length(regexp_replace(_phone, '[^0-9]', '', 'g')) >= 8
      THEN ' · WhatsApp: https://wa.me/' || regexp_replace(_phone, '[^0-9]', '', 'g')
    ELSE ' · No phone on file'
  END;

  INSERT INTO public.admin_notifications (message, type, related_user_id)
  VALUES (
    'New enrollment: ' || COALESCE(_name, 'Unknown') || ' (' || COALESCE(_email, '') || ')' || _wa_link || ' — ' ||
    NEW.plan_type || ' · ' || NEW.duration || 'mo · ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'USD') ||
    ' · Status: ' || _display_status,
    'new_enrollment',
    NEW.user_id
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _total bigint;
  _wa_link text;
begin
  select count(*) into _total from public.profiles;

  _wa_link := case
    when new.phone is not null and length(regexp_replace(new.phone, '[^0-9]', '', 'g')) >= 8
      then ' · WhatsApp: https://wa.me/' || regexp_replace(new.phone, '[^0-9]', '', 'g')
    else ''
  end;

  insert into public.admin_notifications (message, type, related_user_id)
  values (
    'New signup: ' || coalesce(nullif(trim(new.name), ''), 'no name yet')
      || ' (' || coalesce(new.email, 'no email') || ')' || _wa_link
      || case when new.country is not null then ' · ' || new.country else '' end
      || ' — ' || _total || ' registered in total',
    'new_registration',
    new.user_id
  );

  return new;
exception when others then
  -- a notification must never block a signup
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_trial_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _seats bigint;
  _when  text;
  _wa_link text;
begin
  if upper(coalesce(new.status, '')) = 'CANCELLED' then
    return new;
  end if;

  select count(*)
    into _seats
    from public.trial_bookings
   where status <> 'cancelled'
     and trial_date is not distinct from new.trial_date
     and start_time is not distinct from new.start_time;

  _when := case
    when new.trial_date is null then 'no date yet'
    else to_char(new.trial_date, 'Dy DD Mon') || ' · ' || coalesce(new.start_time, '')
  end;

  _wa_link := case
    when new.phone is not null and length(regexp_replace(new.phone, '[^0-9]', '', 'g')) >= 8
      then ' · WhatsApp: https://wa.me/' || regexp_replace(new.phone, '[^0-9]', '', 'g')
    else ''
  end;

  insert into public.admin_notifications (message, type, related_user_id)
  values (
    'New trial booking: ' || coalesce(nullif(trim(new.name), ''), 'no name')
      || ' (' || coalesce(new.email, 'no email') || ')' || _wa_link
      || ' — ' || _when
      || ' · ' || coalesce(new.class_language, 'language not set')
      || ' · ' || coalesce(new.level, 'level not set')
      || ' — ' || _seats || ' booked on that session',
    'trial',
    new.user_id
  );

  return new;
exception when others then
  return new;
end;
$function$;
