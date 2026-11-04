-- Language Exchange in-app chat (Re's request, 4 Nov 2026): once two profiles
-- match, they talk through the Klovers account itself -- never by exchanging
-- WhatsApp/email outside the site. There is no existing peer-to-peer
-- messaging table anywhere in this app (admin_message/AdminMessage.tsx is a
-- one-way admin email, not this), so this is a new, narrowly-scoped table:
-- messages belong to one match, and only that match's two participants can
-- read or write them.

create table if not exists public.exchange_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.exchange_matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists exchange_messages_match_created_idx
  on public.exchange_messages (match_id, created_at);

alter table public.exchange_messages enable row level security;

-- A participant of the match, per exchange_matches.user_a/user_b.
drop policy if exists "exchange_messages_select_participant" on public.exchange_messages;
create policy "exchange_messages_select_participant"
  on public.exchange_messages for select
  using (
    exists (
      select 1 from public.exchange_matches m
      where m.id = exchange_messages.match_id
        and (select auth.uid()) in (m.user_a, m.user_b)
    )
  );

-- Insert only as yourself, only into a match you're part of, and only while
-- neither side has blocked the other (a block can happen after a match).
drop policy if exists "exchange_messages_insert_participant" on public.exchange_messages;
create policy "exchange_messages_insert_participant"
  on public.exchange_messages for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.exchange_matches m
      where m.id = exchange_messages.match_id
        and (select auth.uid()) in (m.user_a, m.user_b)
        and not exists (
          select 1 from public.exchange_blocks b
          where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
             or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
        )
    )
  );

drop policy if exists "exchange_messages_admin_all" on public.exchange_messages;
create policy "exchange_messages_admin_all"
  on public.exchange_messages for all
  using (has_role((select auth.uid()), 'admin'::app_role));

-- No update/delete policy for participants on purpose: messages are
-- immutable once sent (matches how every other exchange_* table that logs an
-- action, e.g. exchange_swipes, has no participant update/delete either).

-- Live updates in the chat UI.
alter publication supabase_realtime add table public.exchange_messages;
