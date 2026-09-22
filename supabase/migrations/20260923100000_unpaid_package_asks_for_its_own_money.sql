-- Re: "they have to get email to pay its auto and show on thier dashboard".
--
-- The dashboard half already works. StudentSelfService renders the amount due,
-- how to pay, and the "I have paid - upload the receipt" form for any private
-- student whose roster row is linked to her account; it is mounted for every
-- student through StudentAttendanceRequest. Nothing there needed changing.
--
-- The email half did not. public.admin_send_bundle_payment_ask exists and
-- writes a good letter -- the classes taught by date, how many are left, the
-- amount, how to pay, and where to upload the receipt -- but it only ran when
-- somebody pressed "Ask for payment" on the Today screen. A package that is
-- live and unpaid is asking for money from the moment it exists; whether the
-- student hears about it should not depend on Re remembering a button.
--
-- So: the body moves into send_bundle_payment_ask, with no admin check --
-- "who pressed it" is now answered by "nobody, the package was created". The
-- admin RPC keeps its guard and calls the shared body, so the letter can never
-- drift between the automatic path and the manual one.
--
-- The trigger fires ONCE, and the guards are what make that true:
--   * payment_ask_sent_at already set  -> already asked, say nothing
--   * total_price is zero              -> nothing to ask for
--   * an UPDATE that leaves an already-active, already-unpaid package alone
--     -> nothing changed, so there is no new fact to report
-- and it swallows its own errors: a letter that fails must never stop a
-- package being saved. It stays visible as unpaid on Today, with the manual
-- button as the fallback.
--
-- Note that payment_ask_sent_at is not in the trigger's UPDATE OF list, so the
-- stamp the letter writes cannot fire the trigger again.

-- ---------------------------------------------------------------------------
-- 1. The letter, with no admin in front of it
-- ---------------------------------------------------------------------------

create or replace function public.send_bundle_payment_ask(p_bundle_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_b         record;
  v_email     text;
  v_name      text;
  v_lang      text;
  v_token     text;
  v_done      date[];
  v_used      int;
  v_remaining int;
begin
  select b.id, b.total_classes, b.total_price, b.currency, b.paid_on,
         ts.full_name, ts.email as roster_email, ts.user_id
    into v_b
    from public.student_bundles b
    join public.teacher_students ts on ts.id = b.student_id
   where b.id = p_bundle_id;

  if v_b.id is null then
    raise exception 'bundle_not_found' using errcode = 'P0002';
  end if;

  -- Asking for money already received is the one mistake this letter could
  -- make that costs trust rather than time.
  if v_b.paid_on is not null then
    raise exception 'bundle_already_paid' using errcode = '22023';
  end if;

  -- The site profile is preferred over the roster row: it carries the
  -- language she reads in and the unsubscribe token the footer needs. A
  -- student with no account (Namy) has neither, and is written to at her
  -- roster address in Arabic.
  if v_b.user_id is not null then
    select p.email, coalesce(p.name, v_b.full_name), coalesce(p.language, 'ar'), p.unsubscribe_token
      into v_email, v_name, v_lang, v_token
      from public.profiles p
     where p.user_id = v_b.user_id;
  end if;

  if v_email is null then
    v_email := v_b.roster_email;
    v_name  := v_b.full_name;
    v_lang  := coalesce(v_lang, 'ar');
  end if;

  if v_email is null or trim(v_email) = '' then
    raise exception 'student_has_no_email' using errcode = '22023';
  end if;

  -- Only counted sessions. A cancelled class is not something she was taught,
  -- and listing it would invite an argument about a date instead of a payment.
  select array_agg(s.session_date order by s.session_date)
    into v_done
    from public.student_class_sessions s
   where s.bundle_id = p_bundle_id
     and s.counted;

  v_used      := coalesce(array_length(v_done, 1), 0);
  v_remaining := greatest(0, coalesce(v_b.total_classes, 0) - v_used);

  perform app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',          'private_bundle_payment',
      'email',             v_email,
      'name',              coalesce(v_name, 'there'),
      'language',          coalesce(v_lang, 'ar'),
      'amount',            v_b.total_price,
      'currency',          coalesce(v_b.currency, 'EGP'),
      'total_classes',     v_b.total_classes,
      'remaining_classes', v_remaining,
      'done_dates',        coalesce(to_jsonb(v_done), '[]'::jsonb),
      'unsubscribe_token', v_token
    )
  );

  update public.student_bundles
     set payment_ask_sent_at = now(),
         updated_at          = now()
   where id = p_bundle_id;
end
$function$;

-- ---------------------------------------------------------------------------
-- 2. The button keeps its guard and calls the shared body
-- ---------------------------------------------------------------------------

create or replace function public.admin_send_bundle_payment_ask(p_bundle_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  perform public.send_bundle_payment_ask(p_bundle_id);
end
$function$;

-- ---------------------------------------------------------------------------
-- 3. The package asks for itself
-- ---------------------------------------------------------------------------

create or replace function public.tg_auto_send_bundle_payment_ask()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status <> 'active' then return new; end if;
  if new.paid_on is not null then return new; end if;
  if new.payment_ask_sent_at is not null then return new; end if;
  if coalesce(new.total_price, 0) <= 0 then return new; end if;

  -- Only when the package BECOMES live and unpaid, not on every save.
  if tg_op = 'UPDATE'
     and old.status = 'active'
     and old.paid_on is null
  then
    return new;
  end if;

  perform public.send_bundle_payment_ask(new.id);
  return new;
exception when others then
  -- The letter failing must never stop the package being saved. It is still
  -- visible as unpaid on Today, with the manual button as the fallback.
  return new;
end
$function$;

drop trigger if exists trg_auto_send_bundle_payment_ask on public.student_bundles;
create trigger trg_auto_send_bundle_payment_ask
  after insert or update of paid_on, status on public.student_bundles
  for each row execute function public.tg_auto_send_bundle_payment_ask();
