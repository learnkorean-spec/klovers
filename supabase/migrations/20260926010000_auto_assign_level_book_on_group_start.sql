-- Gift book on group start (Re, 25 Sep 2026): when a group is started
-- (start_date goes from NULL to a date via activate_pkg_group), every active
-- member gets the level's book in «هدية انضمامك لكورسنا». A student seated
-- into a group that is already running gets it on joining. No email.
-- Only levels that have a book are mapped; others are skipped silently.

create or replace function app_private.level_book_id(_level text)
returns text language sql immutable as $$
  select case lower(coalesce(_level, ''))
    when 'hangul' then 'hangul-a0'
    else null
  end
$$;

create or replace function app_private.gift_level_book(_user_id uuid, _enrollment_id uuid, _level text)
returns void language plpgsql security definer set search_path = public as $$
declare _book text := app_private.level_book_id(_level);
begin
  if _book is null or _user_id is null then return; end if;
  insert into public.book_assignments (user_id, book_id, enrollment_id, available_from, assigned_by, notes)
  values (_user_id, _book, _enrollment_id, now(), 'auto:group-start', 'Gift for joining — assigned when the group started')
  on conflict (user_id, book_id) do nothing;
exception when others then
  null; -- a gift must never block starting a group or seating a student
end $$;

create or replace function public.tg_gift_book_on_group_start()
returns trigger language plpgsql security definer set search_path = public as $$
declare _level text; r record;
begin
  if old.start_date is not null or new.start_date is null then return new; end if;
  select sp.level into _level from public.schedule_packages sp where sp.id = new.package_id;
  if app_private.level_book_id(_level) is null then return new; end if;
  for r in
    select m.user_id, m.enrollment_id from public.pkg_group_members m
     where m.group_id = new.id and coalesce(m.member_status, 'active') = 'active'
  loop
    perform app_private.gift_level_book(r.user_id, r.enrollment_id, _level);
  end loop;
  return new;
end $$;

create or replace function public.tg_gift_book_on_join_running_group()
returns trigger language plpgsql security definer set search_path = public as $$
declare _level text; _start date;
begin
  if coalesce(new.member_status, 'active') <> 'active' then return new; end if;
  select g.start_date, sp.level into _start, _level
    from public.pkg_groups g join public.schedule_packages sp on sp.id = g.package_id
   where g.id = new.group_id;
  if _start is null then return new; end if; -- not started yet: the start trigger will gift it
  perform app_private.gift_level_book(new.user_id, new.enrollment_id, _level);
  return new;
end $$;

drop trigger if exists trg_gift_book_on_group_start on public.pkg_groups;
create trigger trg_gift_book_on_group_start
  after update of start_date on public.pkg_groups
  for each row execute function public.tg_gift_book_on_group_start();

drop trigger if exists trg_gift_book_on_join_running_group on public.pkg_group_members;
create trigger trg_gift_book_on_join_running_group
  after insert or update of member_status on public.pkg_group_members
  for each row execute function public.tg_gift_book_on_join_running_group();

revoke all on function app_private.gift_level_book(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.tg_gift_book_on_group_start() from public, anon, authenticated;
revoke all on function public.tg_gift_book_on_join_running_group() from public, anon, authenticated;
