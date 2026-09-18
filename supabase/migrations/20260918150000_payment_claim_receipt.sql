-- A payment claim can carry the receipt the student uploaded.
--
-- Until now the claim was entirely the student's word: an amount, a date, a
-- method, a name. Re pressed "Money received" against a typed number with
-- nothing to check it by. The file itself is the one fact in this flow that
-- does not depend on anybody's memory.
--
-- The image is NOT stored here. It lives in the existing private `receipts`
-- bucket, whose storage policies already say exactly the right thing:
--   * "Users can upload receipts"  — INSERT where (storage.foldername(name))[1]
--     equals the uploader's uid, so a student can only write under her own
--     folder;
--   * "Users can view own receipts" — SELECT under the same condition;
--   * "Admins can view all receipts" — SELECT for has_role(uid, 'admin').
-- So this column holds only the object path, and the bucket keeps the access
-- rules. Nothing here loosens them.

alter table public.student_payment_claims
  add column if not exists receipt_path text;

comment on column public.student_payment_claims.receipt_path is
  'Object path inside the private "receipts" bucket, always <uid>/<filename>. '
  'Null when the student sent no image. The admin reads it through a signed URL.';

-- The old 7-argument function is dropped, not merely replaced. Adding a
-- defaulted 8th parameter with CREATE OR REPLACE would leave BOTH functions
-- callable, and every existing 7-argument call would then fail as ambiguous
-- rather than pick one — a break that would show up at the student's click,
-- not at deploy.
drop function if exists public.student_submit_payment_claim(
  numeric, text, date, text, text, text, uuid
);

create or replace function public.student_submit_payment_claim(
  p_amount        numeric,
  p_currency      text,
  p_paid_on       date,
  p_method        text,
  p_sender_name   text default null,
  p_note          text default null,
  p_bundle_id     uuid default null,
  p_receipt_path  text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_uid     uuid := (select auth.uid());
  v_student uuid;
  v_name    text;
  v_claim   uuid;
  v_path    text := nullif(trim(p_receipt_path), '');
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount_must_be_positive' using errcode = '22023';
  end if;
  if coalesce(trim(p_currency), '') = '' or coalesce(trim(p_method), '') = '' then
    raise exception 'currency_and_method_required' using errcode = '22023';
  end if;
  if p_paid_on is null or p_paid_on > (now() at time zone 'Africa/Cairo')::date then
    raise exception 'paid_on_cannot_be_in_the_future' using errcode = '22023';
  end if;

  -- The path is checked here as well as by the bucket policy. This function is
  -- SECURITY DEFINER, so without this a student could record somebody else's
  -- object path against her own claim and have the admin shown a stranger's
  -- receipt. She could not have uploaded it — but she could name it.
  if v_path is not null and split_part(v_path, '/', 1) <> v_uid::text then
    raise exception 'receipt_must_be_your_own_upload' using errcode = '42501';
  end if;

  -- Their roster row, if they have one. A group student legitimately has none.
  select ts.id, ts.full_name into v_student, v_name
    from public.teacher_students ts
   where ts.user_id = v_uid
   limit 1;

  -- A bundle can only be named if it is theirs. Otherwise one student could
  -- settle another student's debt by guessing an id.
  if p_bundle_id is not null then
    if v_student is null
       or not exists (select 1 from public.student_bundles b
                       where b.id = p_bundle_id and b.student_id = v_student) then
      raise exception 'not_your_bundle' using errcode = '42501';
    end if;
  end if;

  insert into public.student_payment_claims
    (user_id, student_id, bundle_id, amount, currency, paid_on, method,
     sender_name, note, receipt_path)
  values
    (v_uid, v_student, p_bundle_id, p_amount, upper(trim(p_currency)), p_paid_on,
     trim(p_method), nullif(trim(p_sender_name), ''), nullif(trim(p_note), ''), v_path)
  returning id into v_claim;

  insert into public.admin_notifications (message, category, type, read, related_user_id)
  values (
    format('%s says she paid %s %s on %s (%s)%s — review it in MONEY IN',
           coalesce(v_name, 'A student'), p_amount::text, upper(trim(p_currency)),
           to_char(p_paid_on, 'DD Mon'), trim(p_method),
           case when v_path is null then '' else ', receipt attached' end),
    'update', 'payment_claim', false, v_uid
  );

  return v_claim;
end
$function$;

grant execute on function public.student_submit_payment_claim(
  numeric, text, date, text, text, text, uuid, text
) to authenticated;
