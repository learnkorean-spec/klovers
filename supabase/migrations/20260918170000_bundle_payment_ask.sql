-- "Ask for payment" for a private student's bundle.
--
-- A private student has no `enrollments` row, so none of the payment letters
-- this system already sends could ever reach one. What she owed was whatever
-- Re remembered and typed. This is the one path that can state it from the
-- data: the price is the bundle's own `total_price`, and the classes taught
-- are its own counted sessions.
--
-- Everything the letter says is read here, not passed in. A caller that could
-- supply its own amount is a caller that can send a student a figure the card
-- does not show.

alter table public.student_bundles
  add column if not exists payment_ask_sent_at timestamptz;

comment on column public.student_bundles.payment_ask_sent_at is
  'When the private-bundle payment letter was last sent for this bundle. '
  'Not a guard — Re may legitimately ask twice — but a second ask should be '
  'visible on the screen rather than silent.';

create or replace function public.admin_send_bundle_payment_ask(p_bundle_id uuid)
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
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;

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
  -- student with no account (Menna, Namy) has neither, and is written to at
  -- her roster address in Arabic.
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

grant execute on function public.admin_send_bundle_payment_ask(uuid) to authenticated;
