-- Students speak for themselves — and nothing they say counts until Re says so.
--
-- WHAT WAS THERE
-- `attendance_requests` + `student_submit_attendance` + the card on the student
-- dashboard have existed for months and have **never been used**: the table is
-- empty. The card unlocks only for an `enrollments` row that is APPROVED and
-- PAID, so every private student — the only students who actually have a bundle
-- and a weekly lesson — saw "Attendance is available after payment" and could do
-- nothing. The group RPC also auto-approves when the date falls inside the
-- student's scheduled window, which is the opposite of what Re wants. That path
-- is left untouched here (it is dormant, and changing it is its own decision);
-- what follows is the private-student path, and it confirms nothing by itself.
--
-- THE RULE THIS ENCODES
-- A student's click is a CLAIM. It never counts a class and never marks money
-- as received. Re confirms the lesson in the queue she already uses, and
-- approves the payment in MONEY IN — approval is the only thing that writes
-- `paid_on`. So a student can never move her own balance, in either direction.

-- ---------------------------------------------------------------------------
-- 1. "I attended" — a stamp on the lesson, not a count
-- ---------------------------------------------------------------------------

alter table public.student_class_sessions
  add column if not exists student_confirmed_at timestamptz;

comment on column public.student_class_sessions.student_confirmed_at is
  'When the STUDENT said this lesson happened. A claim, never a count: `counted` '
  'and `outcome` are still only ever written by Re confirming it.';

create or replace function public.student_confirm_private_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_student uuid;
  v_name    text;
  v_date    date;
  v_already timestamptz;
begin
  -- Ownership and existence in one lookup. A session that is not this caller's
  -- simply does not come back, so the error below cannot be used to discover
  -- whether some other student's session exists.
  select s.student_id, ts.full_name, s.session_date, s.student_confirmed_at
    into v_student, v_name, v_date, v_already
    from public.student_class_sessions s
    join public.teacher_students ts on ts.id = s.student_id
   where s.id = p_session_id
     and ts.user_id = (select auth.uid());

  if v_student is null then
    raise exception 'not_your_session' using errcode = '42501';
  end if;

  -- Cairo, not UTC: at 01:00 Cairo the UTC date is still yesterday, and a
  -- student confirming a lesson late at night should not be told it has not
  -- happened.
  if v_date > (now() at time zone 'Africa/Cairo')::date then
    raise exception 'class_has_not_happened_yet' using errcode = '22023';
  end if;

  -- Idempotent: a second tap is not a second claim, and never re-notifies.
  if v_already is not null then
    return;
  end if;

  update public.student_class_sessions
     set student_confirmed_at = now(),
         updated_at           = now()
   where id = p_session_id;

  insert into public.admin_notifications (message, category, type, read)
  values (
    format('%s says she attended her lesson on %s — confirm it for it to count',
           coalesce(v_name, 'A student'), to_char(v_date, 'DD Mon')),
    'update', 'attendance_claim', false
  );
end
$function$;

revoke all on function public.student_confirm_private_session(uuid) from public;
grant execute on function public.student_confirm_private_session(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. "I paid" — a claim in its own table, never a write to the money
-- ---------------------------------------------------------------------------

create table if not exists public.student_payment_claims (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  -- Null for a group student: they have no roster row. The claim is still
  -- recorded, it just has no bundle to settle against (see the review function).
  student_id   uuid references public.teacher_students(id) on delete set null,
  bundle_id    uuid references public.student_bundles(id)  on delete set null,
  amount       numeric not null check (amount > 0),
  currency     text    not null,
  paid_on      date    not null,
  method       text    not null,
  sender_name  text,
  note         text,
  status       text    not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid,
  review_note  text
);

comment on table public.student_payment_claims is
  'What a student says she paid. Approving one is what writes student_bundles.paid_on; '
  'the claim itself is evidence, not money.';

create index if not exists student_payment_claims_pending_idx
  on public.student_payment_claims (created_at)
  where status = 'pending';

-- One pending claim per person per amount per day. A double-tap or a refreshed
-- form should not put the same payment in front of Re twice.
create unique index if not exists student_payment_claims_no_duplicate_pending
  on public.student_payment_claims (user_id, paid_on, amount)
  where status = 'pending';

alter table public.student_payment_claims enable row level security;

-- Students read their own and nothing else. They do NOT get insert: filing goes
-- through the function below, so status, user_id and the bundle link cannot be
-- chosen by the client.
drop policy if exists "Students read their own payment claims" on public.student_payment_claims;
create policy "Students read their own payment claims"
  on public.student_payment_claims for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins manage payment claims" on public.student_payment_claims;
create policy "Admins manage payment claims"
  on public.student_payment_claims for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

create or replace function public.student_submit_payment_claim(
  p_amount      numeric,
  p_currency    text,
  p_paid_on     date,
  p_method      text,
  p_sender_name text default null,
  p_note        text default null,
  p_bundle_id   uuid default null
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
    (user_id, student_id, bundle_id, amount, currency, paid_on, method, sender_name, note)
  values
    (v_uid, v_student, p_bundle_id, p_amount, upper(trim(p_currency)), p_paid_on,
     trim(p_method), nullif(trim(p_sender_name), ''), nullif(trim(p_note), ''))
  returning id into v_claim;

  insert into public.admin_notifications (message, category, type, read, related_user_id)
  values (
    format('%s says she paid %s %s on %s (%s) — review it in MONEY IN',
           coalesce(v_name, 'A student'), p_amount::text, upper(trim(p_currency)),
           to_char(p_paid_on, 'DD Mon'), trim(p_method)),
    'update', 'payment_claim', false, v_uid
  );

  return v_claim;
end
$function$;

revoke all on function public.student_submit_payment_claim(numeric, text, date, text, text, text, uuid) from public;
grant execute on function public.student_submit_payment_claim(numeric, text, date, text, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Re's decision — the only thing that writes money
-- ---------------------------------------------------------------------------

create or replace function public.admin_review_payment_claim(
  p_claim_id uuid,
  p_approve  boolean,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_claim public.student_payment_claims;
begin
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  select * into v_claim from public.student_payment_claims where id = p_claim_id for update;
  if v_claim.id is null then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;
  if v_claim.status <> 'pending' then
    raise exception 'claim_already_reviewed' using errcode = '22023';
  end if;

  update public.student_payment_claims
     set status      = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now(),
         reviewed_by = (select auth.uid()),
         review_note = nullif(trim(p_note), '')
   where id = p_claim_id;

  -- Approving a claim that names a bundle is what marks that bundle paid. A
  -- claim with no bundle (a group student, or a payment Re has not yet matched
  -- to anything) is recorded and settles nothing — group money keeps its own
  -- receipt-and-approval path, and nothing here reaches into it.
  if p_approve and v_claim.bundle_id is not null then
    update public.student_bundles
       set paid_on   = coalesce(paid_on, v_claim.paid_on),
           paid_note = coalesce(
             paid_note,
             v_claim.method || coalesce(' · ' || v_claim.sender_name, '')
           ),
           updated_at = now()
     where id = v_claim.bundle_id;
  end if;
end
$function$;

revoke all on function public.admin_review_payment_claim(uuid, boolean, text) from public;
grant execute on function public.admin_review_payment_claim(uuid, boolean, text) to authenticated;
