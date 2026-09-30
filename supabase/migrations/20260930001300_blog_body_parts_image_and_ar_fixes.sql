-- 30 Sep 2026 - Body-parts posts (EN + AR): replace the wrong hero image
-- (korean-blood-type.jpg, a blood-type picture with garbled Korean) with a
-- correct labelled body picture, and fix the Arabic post's grammar and
-- transliteration (dashboard items scan63-bodyparts-en-hero,
-- scan64-bodyparts-ar-hero, scan64-bodyparts-ar-batn,
-- scan64-bodyparts-ar-songarak).
--
-- Data-only and idempotent. Each step is guarded by slug and only fires when
-- the old wording is present; a step that finds nothing logs a WARNING and
-- never raises, so it cannot block other pending migrations.

do $$
declare n int; s text;
begin
  -- 1) Hero image in both posts (column and any in-body reference).
  foreach s in array array['korean-body-parts-vocabulary', 'korean-body-parts-vocabulary-ar'] loop
    update public.blog_posts
       set hero_image = replace(hero_image, 'korean-blood-type.jpg', 'korean-body-parts.webp'),
           content    = replace(content,    'korean-blood-type.jpg', 'korean-body-parts.webp')
     where slug = s and (hero_image like '%korean-blood-type.jpg%' or content like '%korean-blood-type.jpg%');
    get diagnostics n = row_count; if n = 0 then raise warning '% hero image: nothing changed', s; end if;
  end loop;

  -- 2) Arabic post: grammar (belly is masculine).
  update public.blog_posts set content = replace(content, 'بطني تؤلمني', 'بطني يؤلمني')
   where slug = 'korean-body-parts-vocabulary-ar' and content like '%بطني تؤلمني%';
  get diagnostics n = row_count; if n = 0 then raise warning 'body-parts-ar batn: nothing changed'; end if;

  -- 3) Arabic post: transliteration, same scheme as the Hangul sheet
  --    (ㄲ = كّ, ㅐ = إيه).
  update public.blog_posts set content = replace(replace(replace(content,
      'سونغاراك', 'سون-كّاراك'), 'بالغاراك', 'بال-كّاراك'), 'أوكيه', 'أوكّيه')
   where slug = 'korean-body-parts-vocabulary-ar'
     and (content like '%سونغاراك%' or content like '%بالغاراك%' or content like '%أوكيه%');
  get diagnostics n = row_count; if n = 0 then raise warning 'body-parts-ar transliteration: nothing changed'; end if;

  update public.blog_posts set content = regexp_replace(content, '\|\s*باي\s*\|', '| بيه |')
   where slug = 'korean-body-parts-vocabulary-ar' and content ~ '\|\s*باي\s*\|';
  get diagnostics n = row_count; if n = 0 then raise warning 'body-parts-ar bae: nothing changed'; end if;
end $$;
