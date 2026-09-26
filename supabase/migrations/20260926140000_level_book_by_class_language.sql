-- One book per class language (Re, 26 Sep 2026): the A0 Hangul book now has
-- an English edition (books/hangul-a0-en.pdf). When a Hangul group starts, or
-- a student is seated into a running one, Arabic groups get 'hangul-a0' and
-- English groups get 'hangul-a0-en'. The language comes from
-- schedule_packages.class_language ('arabic' | 'english').
--
-- Written against the live definitions read on 26 Sep 2026
-- (pg_get_functiondef); every SET search_path is kept as it is live.
-- The storage policy "Students read their assigned books" already matches
-- 'books/' || book_id || '.pdf', so it covers the new book with no change.

create or replace function app_private.level_book_id(_level text, _class_language text)
returns text
language sql
immutable
set search_path to 'pg_catalog', 'public'
as $$
  select case lower(coalesce(_level, ''))
    when 'hangul' then
      case lower(coalesce(_class_language, ''))
        when 'english' then 'hangul-a0-en'
        else 'hangul-a0'
      end
    else null
  end
$$;

create or replace function app_private.gift_level_book(_user_id uuid, _enrollment_id uuid, _level text, _class_language text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare _book text := app_private.level_book_id(_level, _class_language);
begin
  if _book is null or _user_id is null then return; end if;
  insert into public.book_assignments (user_id, book_id, enrollment_id, available_from, assigned_by, notes)
  values (_user_id, _book, _enrollment_id, now(), 'auto:group-start', 'Gift for joining — assigned when the group started')
  on conflict (user_id, book_id) do nothing;
exception when others then
  null; -- a gift must never block starting a group or seating a student
end $$;

create or replace function public.tg_gift_book_on_group_start()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare _level text; _lang text; r record;
begin
  if old.start_date is not null or new.start_date is null then return new; end if;
  select sp.level, sp.class_language into _level, _lang
    from public.schedule_packages sp where sp.id = new.package_id;
  if app_private.level_book_id(_level, _lang) is null then return new; end if;
  for r in
    select m.user_id, m.enrollment_id from public.pkg_group_members m
     where m.group_id = new.id and coalesce(m.member_status, 'active') = 'active'
  loop
    perform app_private.gift_level_book(r.user_id, r.enrollment_id, _level, _lang);
  end loop;
  return new;
end $$;

create or replace function public.tg_gift_book_on_join_running_group()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare _level text; _lang text; _start date;
begin
  if coalesce(new.member_status, 'active') <> 'active' then return new; end if;
  select g.start_date, sp.level, sp.class_language into _start, _level, _lang
    from public.pkg_groups g join public.schedule_packages sp on sp.id = g.package_id
   where g.id = new.group_id;
  if _start is null then return new; end if; -- not started yet: the start trigger will gift it
  perform app_private.gift_level_book(new.user_id, new.enrollment_id, _level, _lang);
  return new;
end $$;

-- The 3-argument gift function had no caller other than the two triggers above.
drop function if exists app_private.gift_level_book(uuid, uuid, text);

revoke all on function app_private.gift_level_book(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.tg_gift_book_on_group_start() from public, anon, authenticated;
revoke all on function public.tg_gift_book_on_join_running_group() from public, anon, authenticated;
