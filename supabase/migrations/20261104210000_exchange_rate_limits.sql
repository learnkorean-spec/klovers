-- Language Exchange rate limiting (safety audit, 4-5 Nov 2026).
--
-- Neither exchange_swipes nor exchange_messages had anything stopping a
-- scripted client from swiping through the entire discovery pool in
-- seconds or flooding a match with messages at full network speed --
-- exchange_swipes' unique(swiper_id, target_id) only stops *re*-swiping
-- the same person, and exchange_messages had no constraint on frequency
-- at all. Two BEFORE INSERT triggers add a simple rolling-window cap on
-- each table, enforced server-side so no client code can bypass it.
--
-- Thresholds are deliberately generous for a real person (an enthusiastic
-- swiper or an active chat still fits comfortably) and only bite a
-- scripted burst: 60 swipes/minute, 30 messages/minute, per user.
-- Not SECURITY DEFINER: the COUNT inside each function only needs to see
-- the inserting user's own rows, which exchange_swipes_select_own /
-- exchange_messages_select_participant already allow them to read, so
-- running as invoker (the normal, narrower default) is enough.

create or replace function public.exchange_enforce_swipe_rate_limit()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  _recent_count int;
begin
  select count(*) into _recent_count
  from public.exchange_swipes
  where swiper_id = new.swiper_id
    and created_at > now() - interval '1 minute';

  if _recent_count >= 60 then
    raise exception 'Too many swipes in a short time. Please wait a minute and try again.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.exchange_enforce_swipe_rate_limit() from public;
revoke all on function public.exchange_enforce_swipe_rate_limit() from anon;
revoke all on function public.exchange_enforce_swipe_rate_limit() from authenticated;

drop trigger if exists trg_exchange_swipes_rate_limit on public.exchange_swipes;
create trigger trg_exchange_swipes_rate_limit
before insert on public.exchange_swipes
for each row execute function public.exchange_enforce_swipe_rate_limit();

create or replace function public.exchange_enforce_message_rate_limit()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  _recent_count int;
begin
  select count(*) into _recent_count
  from public.exchange_messages
  where sender_id = new.sender_id
    and created_at > now() - interval '1 minute';

  if _recent_count >= 30 then
    raise exception 'You are sending messages too quickly. Please wait a minute and try again.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.exchange_enforce_message_rate_limit() from public;
revoke all on function public.exchange_enforce_message_rate_limit() from anon;
revoke all on function public.exchange_enforce_message_rate_limit() from authenticated;

drop trigger if exists trg_exchange_messages_rate_limit on public.exchange_messages;
create trigger trg_exchange_messages_rate_limit
before insert on public.exchange_messages
for each row execute function public.exchange_enforce_message_rate_limit();

-- exchange_messages had no index on sender_id -- both the new trigger's
-- COUNT and any future "my own messages" query need one.
create index if not exists idx_exchange_messages_sender_created
  on public.exchange_messages (sender_id, created_at);

do $$
declare
  v_anon boolean;
  v_auth boolean;
begin
  select has_function_privilege('anon', 'public.exchange_enforce_swipe_rate_limit()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.exchange_enforce_swipe_rate_limit()', 'EXECUTE')
    into v_anon, v_auth;
  if v_anon or v_auth then
    raise exception 'exchange_enforce_swipe_rate_limit is still callable over the API (anon=%, authenticated=%)', v_anon, v_auth;
  end if;

  select has_function_privilege('anon', 'public.exchange_enforce_message_rate_limit()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.exchange_enforce_message_rate_limit()', 'EXECUTE')
    into v_anon, v_auth;
  if v_anon or v_auth then
    raise exception 'exchange_enforce_message_rate_limit is still callable over the API (anon=%, authenticated=%)', v_anon, v_auth;
  end if;
end $$;
