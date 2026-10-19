-- Personal trial lessons (Hungarian, Arabic-for-foreigners, English) — Reham
-- teaches these herself, solo, unlike the Korean group-class system
-- (schedule_packages / trial_slots / groups), so this is a separate, much
-- lighter booking system: one teacher, open time slots, direct bookings.
-- Public access goes through the book-personal-trial Edge Function (service
-- role), never direct table access — so RLS here is admin-only in both
-- directions and that is intentional, not an oversight.

create table if not exists public.personal_trial_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time text not null, -- 'HH:MM', 24h
  duration_min integer not null default 30,
  timezone text not null default 'Africa/Cairo',
  capacity integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_trial_slots_upcoming_idx
  on public.personal_trial_slots (slot_date, start_time)
  where is_active = true;

create table if not exists public.personal_trial_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.personal_trial_slots(id) on delete cascade,
  language text not null check (language in ('hungarian', 'arabic', 'english')),
  name text not null,
  email text,
  whatsapp text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint personal_trial_bookings_contact_required
    check (coalesce(trim(email), '') <> '' or coalesce(trim(whatsapp), '') <> '')
);

create index if not exists personal_trial_bookings_slot_idx
  on public.personal_trial_bookings (slot_id);

alter table public.personal_trial_slots enable row level security;
alter table public.personal_trial_bookings enable row level security;

create policy "Admins manage personal trial slots"
  on public.personal_trial_slots
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins manage personal trial bookings"
  on public.personal_trial_bookings
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create trigger set_personal_trial_slots_updated_at
  before update on public.personal_trial_slots
  for each row execute function public.update_updated_at_column();
