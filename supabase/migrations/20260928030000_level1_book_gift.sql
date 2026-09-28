-- Level 1 book (Arabic edition) becomes the joining gift for level_1 Arabic groups.
-- Live definition read with pg_get_functiondef on 28 Sep 2026; every clause kept,
-- including SET search_path. Only the level_1 branch is new.
-- English level_1 returns null until books/book-1-en.pdf exists.

create or replace function app_private.level_book_id(_level text, _class_language text)
 returns text
 language sql
 immutable
 set search_path to 'pg_catalog', 'public'
as $function$
  select case lower(coalesce(_level, ''))
    when 'hangul' then
      case lower(coalesce(_class_language, ''))
        when 'english' then 'hangul-a0-en'
        else 'hangul-a0'
      end
    when 'level_1' then
      case lower(coalesce(_class_language, ''))
        when 'english' then null
        else 'book-1'
      end
    else null
  end
$function$;
