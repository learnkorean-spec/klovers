-- Language Exchange: opt-in profiles + swipe-based matching for language
-- exchange partners (separate from the paid Korean course / students table).
-- Any signed-up user may opt in; nothing here touches enrollment or billing.

create table if not exists public.exchange_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  age int check (age is null or (age between 16 and 100)),
  native_languages text[] not null default '{}',
  learning_languages text[] not null default '{}',
  interests text[] not null default '{}',
  contact_type text,
  contact_value text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exchange_profiles is
  'Opt-in language-exchange profile for any signed-up user. Separate from students/profiles (course enrollment).';

create index if not exists idx_exchange_profiles_visible on public.exchange_profiles (is_visible);

create table if not exists public.exchange_swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (swiper_id, target_id),
  check (swiper_id <> target_id)
);

create index if not exists idx_exchange_swipes_swiper on public.exchange_swipes (swiper_id);
create index if not exists idx_exchange_swipes_target on public.exchange_swipes (target_id, action);

create table if not exists public.exchange_matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint exchange_matches_ordered check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.exchange_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.exchange_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  reviewed boolean not null default false
);

-- updated_at maintenance
create or replace function public.exchange_profiles_set_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_exchange_profiles_updated_at on public.exchange_profiles;
create trigger trg_exchange_profiles_updated_at
before update on public.exchange_profiles
for each row execute function public.exchange_profiles_set_updated_at();

-- Mutual-like -> match. SECURITY DEFINER so the inserting user (who only has
-- insert rights on exchange_swipes) can still get a matches row written for
-- both sides without needing insert rights on exchange_matches directly.
create or replace function public.exchange_handle_swipe()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _reverse_liked boolean;
  _a uuid;
  _b uuid;
begin
  if new.action = 'like' then
    select exists(
      select 1 from public.exchange_swipes
      where swiper_id = new.target_id and target_id = new.swiper_id and action = 'like'
    ) into _reverse_liked;

    if _reverse_liked then
      if new.swiper_id < new.target_id then
        _a := new.swiper_id; _b := new.target_id;
      else
        _a := new.target_id; _b := new.swiper_id;
      end if;
      insert into public.exchange_matches (user_a, user_b)
      values (_a, _b)
      on conflict (user_a, user_b) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_exchange_swipes_match on public.exchange_swipes;
create trigger trg_exchange_swipes_match
after insert on public.exchange_swipes
for each row execute function public.exchange_handle_swipe();

-- RLS
alter table public.exchange_profiles enable row level security;
alter table public.exchange_swipes enable row level security;
alter table public.exchange_matches enable row level security;
alter table public.exchange_blocks enable row level security;
alter table public.exchange_reports enable row level security;

-- exchange_profiles: discovery requires a signed-in account; no anon reads.
create policy "exchange_profiles_select_visible" on public.exchange_profiles
  for select to authenticated
  using (
    is_visible = true
    and not exists (
      select 1 from public.exchange_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = exchange_profiles.user_id)
         or (b.blocked_id = (select auth.uid()) and b.blocker_id = exchange_profiles.user_id)
    )
  );

create policy "exchange_profiles_select_own" on public.exchange_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "exchange_profiles_insert_own" on public.exchange_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "exchange_profiles_update_own" on public.exchange_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id);

create policy "exchange_profiles_delete_own" on public.exchange_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "exchange_profiles_admin_all" on public.exchange_profiles
  for all to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

-- exchange_swipes: write your own, read your own (needed to filter out
-- already-seen profiles client-side).
create policy "exchange_swipes_select_own" on public.exchange_swipes
  for select to authenticated
  using ((select auth.uid()) = swiper_id);

create policy "exchange_swipes_insert_own" on public.exchange_swipes
  for insert to authenticated
  with check ((select auth.uid()) = swiper_id);

-- exchange_matches: read-only to the two participants; writes only via the
-- SECURITY DEFINER trigger above.
create policy "exchange_matches_select_own" on public.exchange_matches
  for select to authenticated
  using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

create policy "exchange_matches_admin_select" on public.exchange_matches
  for select to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

-- exchange_blocks: a user manages only their own blocklist.
create policy "exchange_blocks_select_own" on public.exchange_blocks
  for select to authenticated
  using ((select auth.uid()) = blocker_id);

create policy "exchange_blocks_insert_own" on public.exchange_blocks
  for insert to authenticated
  with check ((select auth.uid()) = blocker_id);

create policy "exchange_blocks_delete_own" on public.exchange_blocks
  for delete to authenticated
  using ((select auth.uid()) = blocker_id);

-- exchange_reports: anyone can file one about someone else; only admins read them.
create policy "exchange_reports_insert_own" on public.exchange_reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id and reporter_id <> reported_id);

create policy "exchange_reports_admin_select" on public.exchange_reports
  for select to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));

create policy "exchange_reports_admin_update" on public.exchange_reports
  for update to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role));
