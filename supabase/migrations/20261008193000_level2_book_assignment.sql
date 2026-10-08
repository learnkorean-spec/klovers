-- Level 2 books reach a student who starts a level-2 group.
--
-- app_private.level_book_id(_level, _class_language) decides which book is
-- gifted when a group starts. Live, it answers for 'hangul' and 'level_1' and
-- returns null for everything else, so a level-2 group has so far started with
-- no book at all even though both editions exist.
--
-- READ FIRST, as this repo's rules require: the live definition was read with
-- pg_get_functiondef on 8 Oct 2026 and is reproduced below with ONE case arm
-- added. Every clause of the live version is preserved verbatim — LANGUAGE sql,
-- IMMUTABLE, and `SET search_path TO 'pg_catalog', 'public'`. Dropping that
-- search_path off a live security-relevant function is the mistake this repo
-- has nearly made before.
--
-- The one-argument overload app_private.level_book_id(_level) also exists and
-- is deliberately NOT touched here.
--
-- ORDERING — DO NOT APPLY THIS BEFORE THE FILES ARE IN THE BUCKET.
-- books/book-2.pdf and books/book-2-en.pdf were not in student-materials as of
-- 8 Oct 2026. Applying this first means the first level-2 group to start gets a
-- book card whose download 404s. Upload both files, confirm they list under
-- student-materials/books/, then apply.

CREATE OR REPLACE FUNCTION app_private.level_book_id(_level text, _class_language text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
    when 'level_2' then
      case lower(coalesce(_class_language, ''))
        when 'english' then 'book-2-en'
        else 'book-2'
      end
    else null
  end
$function$;
