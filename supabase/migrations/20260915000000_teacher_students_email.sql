-- teacher_students had no email column at all.
--
-- The roster stored a FIRST NAME and nothing else that identifies a person:
-- "Mariam", "Menna", "Namy". The site's world — profiles, leads,
-- trial_bookings, enrollments — is keyed on the email address. So the two
-- could never be matched on anything, and the only bridge was `user_id`,
-- pasted in by hand for three of five.
--
-- That is why the enrollment list and My Students show the same people as if
-- they were strangers, and why a private student cannot be written to from the
-- "Write a letter" screen: she has no address anywhere that screen can see.
--
-- MATCHING BY NAME IS NOT A FIX AND MUST NOT BE ATTEMPTED HERE.
-- There are three different people called "Menna" in `leads` today. A name
-- match would link a private student to somebody else's account, and nothing
-- downstream would question it. The only safe link is an address someone
-- actually typed.
alter table public.teacher_students add column if not exists email text;

comment on column public.teacher_students.email is
  'Lowercased. The identifier that links a private student to her account, her lead row, and every letter Klovers sends. Null means nobody has recorded one.';

-- Backfill from the accounts already linked by hand. Nothing is guessed: this
-- only fills in an address for a row that already names a specific user.
update public.teacher_students ts
set email = lower(btrim(p.email))
from public.profiles p
where ts.user_id = p.user_id
  and ts.email is null
  and p.email is not null
  and btrim(p.email) <> '';

-- Keep the two facts in step from now on, in both directions.
--
-- An address typed in with no account attached finds the account, if there is
-- one. An account attached with no address takes the account's. Neither ever
-- overwrites a value that is already there — a deliberate hand-made link stays
-- exactly as it was made.
--
-- Not finding an account is normal and is not an error: a private student who
-- never signed up on the site still has an address worth holding, and that
-- address is what makes her reachable.
create or replace function public.teacher_students_sync_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _email text;
begin
  if new.email is not null then
    new.email := lower(btrim(new.email));
    if new.email = '' then
      new.email := null;
    end if;
  end if;

  if new.user_id is null and new.email is not null then
    select p.user_id
      into _uid
      from public.profiles p
     where lower(btrim(p.email)) = new.email
       and p.user_id is not null
     order by p.created_at
     limit 1;
    new.user_id := _uid;
  end if;

  if new.email is null and new.user_id is not null then
    select lower(btrim(p.email))
      into _email
      from public.profiles p
     where p.user_id = new.user_id
       and p.email is not null
       and btrim(p.email) <> ''
     limit 1;
    new.email := _email;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teacher_students_sync_account on public.teacher_students;
create trigger trg_teacher_students_sync_account
before insert or update of email, user_id on public.teacher_students
for each row execute function public.teacher_students_sync_account();

-- One roster row per address. Duplicated private students are a known problem
-- on this table, and an address is the first thing that can actually prove two
-- rows are the same person. Partial, so any number of rows may still carry no
-- address at all.
create unique index if not exists teacher_students_email_unique
  on public.teacher_students (email)
  where email is not null;

-- Prove the backfill did what it claims, inside the same transaction that made
-- it, so a wrong result rolls the whole migration back instead of shipping.
do $$
declare
  _missed int;
  _filled int;
begin
  select count(*) into _missed
    from public.teacher_students ts
    join public.profiles p on p.user_id = ts.user_id
   where ts.email is null
     and p.email is not null
     and btrim(p.email) <> '';

  if _missed > 0 then
    raise exception
      'backfill missed % linked student(s) whose profile carries an address', _missed;
  end if;

  select count(*) into _filled from public.teacher_students where email is not null;
  raise notice 'teacher_students: % row(s) now carry an address', _filled;
end;
$$;
