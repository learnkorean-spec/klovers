-- Atomic booking for personal_trial_slots: locks the slot row so two
-- students racing for the last seat can't both succeed (capacity is usually
-- 1, so this isn't a theoretical case). SECURITY DEFINER so the
-- book-personal-trial Edge Function can call it with the anon/service key
-- without needing table-level INSERT grants under admin-only RLS.
create or replace function public.book_personal_trial_slot(
  p_slot_id uuid,
  p_language text,
  p_name text,
  p_email text,
  p_whatsapp text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_booked integer;
  v_booking_id uuid;
begin
  -- Lock the slot row for the duration of this transaction.
  select capacity into v_capacity
  from public.personal_trial_slots
  where id = p_slot_id
    and is_active = true
    and slot_date >= (now() at time zone 'Africa/Cairo')::date
  for update;

  if v_capacity is null then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  select count(*) into v_booked
  from public.personal_trial_bookings
  where slot_id = p_slot_id
    and status = 'confirmed';

  if v_booked >= v_capacity then
    raise exception 'slot_full' using errcode = 'P0001';
  end if;

  insert into public.personal_trial_bookings (slot_id, language, name, email, whatsapp, notes)
  values (p_slot_id, p_language, p_name, nullif(trim(p_email), ''), nullif(trim(p_whatsapp), ''), nullif(trim(p_notes), ''))
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- No grants to anon/authenticated: only the service-role key (used by the
-- book-personal-trial Edge Function) may call this, consistent with RLS on
-- the underlying tables being admin-only in every direction.
revoke all on function public.book_personal_trial_slot(uuid, text, text, text, text, text) from public, anon, authenticated;
