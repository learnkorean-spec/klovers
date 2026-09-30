-- 30 Sep 2026 - Content fixes for five blog posts (dashboard items
-- scan45-hanok-ar-source-latin, scan47-joseon-ar-source-latin,
-- scan49-silla-ar-source-latin, scan47-joseon-ar-language,
-- scan51-gojoseon-ar-language, scan49-silla-ar-station-words,
-- scan50-silla-en-station-words).
--
-- Data-only and idempotent. Each step is guarded by slug and only fires when
-- the old wording is present; a step that finds nothing logs a WARNING and
-- never raises, so it cannot block other pending migrations (743, 748-754).
-- The live text was read from the published pages on 30 Sep 2026.

do $$
declare n int;
begin
  -- 1) Arabic sources line: link text in Arabic (link target unchanged).
  update public.blog_posts set content = replace(content, '[Hanok](https://en.wikipedia.org/wiki/Hanok)', '[ويكيبيديا: الهانوك](https://en.wikipedia.org/wiki/Hanok)')
   where slug = 'hanok-traditional-korean-house-ar' and content like '%[Hanok](https://en.wikipedia.org/wiki/Hanok)%';
  get diagnostics n = row_count; if n = 0 then raise warning 'hanok-ar sources: nothing changed'; end if;

  update public.blog_posts set content = replace(content, '[Joseon](https://en.wikipedia.org/wiki/Joseon)', '[ويكيبيديا: جوسون](https://en.wikipedia.org/wiki/Joseon)')
   where slug = 'joseon-dynasty-kings-and-scholars-ar' and content like '%[Joseon](https://en.wikipedia.org/wiki/Joseon)%';
  get diagnostics n = row_count; if n = 0 then raise warning 'joseon-ar sources: nothing changed'; end if;

  update public.blog_posts set content = replace(content, '[Silla](https://en.wikipedia.org/wiki/Silla)', '[ويكيبيديا: سيلا](https://en.wikipedia.org/wiki/Silla)')
   where slug = 'silla-golden-kingdom-ar' and content like '%[Silla](https://en.wikipedia.org/wiki/Silla)%';
  get diagnostics n = row_count; if n = 0 then raise warning 'silla-ar sources: nothing changed'; end if;

  -- 2) Joseon (AR): two wording slips.
  update public.blog_posts set content = replace(content, 'الذي يُختبر المعرفة الكونفوشيوسية', 'الذي يختبر المعرفة الكونفوشيوسية')
   where slug = 'joseon-dynasty-kings-and-scholars-ar' and content like '%الذي يُختبر المعرفة الكونفوشيوسية%';
  get diagnostics n = row_count; if n = 0 then raise warning 'joseon-ar yukhtabar: nothing changed'; end if;

  update public.blog_posts set content = replace(content, 'وبحلول عام 1800 قد يصل عددهم إلى 30 في المئة', 'وبحلول عام 1800 ربما بلغ عددهم 30 في المئة')
   where slug = 'joseon-dynasty-kings-and-scholars-ar' and content like '%وبحلول عام 1800 قد يصل عددهم إلى 30 في المئة%';
  get diagnostics n = row_count; if n = 0 then raise warning 'joseon-ar qad yasil: nothing changed'; end if;

  -- 3) Gojoseon (AR): four wording slips.
  update public.blog_posts set content = replace(content, 'كان تمامة أولمبياد سيول', 'كان تميمة أولمبياد سيول')
   where slug = 'before-korea-gojoseon-and-china-ar' and content like '%كان تمامة أولمبياد سيول%';
  get diagnostics n = row_count; if n = 0 then raise warning 'gojoseon-ar tamima: nothing changed'; end if;

  update public.blog_posts set content = replace(content, 'ترجيانه أن يجعلهما بشراً', 'ترجوانه أن يجعلهما بشراً')
   where slug = 'before-korea-gojoseon-and-china-ar' and content like '%ترجيانه أن يجعلهما بشراً%';
  get diagnostics n = row_count; if n = 0 then raise warning 'gojoseon-ar tarjianah: nothing changed'; end if;

  update public.blog_posts set content = replace(content, 'أن تبقيا بعيدين عن ضوء الشمس', 'أن يبقيا بعيدَين عن ضوء الشمس')
   where slug = 'before-korea-gojoseon-and-china-ar' and content like '%أن تبقيا بعيدين عن ضوء الشمس%';
  get diagnostics n = row_count; if n = 0 then raise warning 'gojoseon-ar tabqiya: nothing changed'; end if;

  update public.blog_posts set content = replace(content, 'جزء من ما هو اليوم', 'جزء ممّا هو اليوم')
   where slug = 'before-korea-gojoseon-and-china-ar' and content like '%جزء من ما هو اليوم%';
  get diagnostics n = row_count; if n = 0 then raise warning 'gojoseon-ar mimma: nothing changed'; end if;

  -- 4) Silla: journey-page wording removed from blog readers' view.
  update public.blog_posts set content = regexp_replace(content, '\s*ولهذا تحمل هذه المحطة عنوان [^.]*في الصفحة الرئيسية\.', '')
   where slug = 'silla-golden-kingdom-ar' and content ~ 'ولهذا تحمل هذه المحطة عنوان [^.]*في الصفحة الرئيسية\.';
  get diagnostics n = row_count; if n = 0 then raise warning 'silla-ar station sentence: nothing changed'; end if;

  update public.blog_posts set content = replace(content, 'كلمات من هذه المحطة', 'كلمات من هذا المقال')
   where slug = 'silla-golden-kingdom-ar' and content like '%كلمات من هذه المحطة%';
  get diagnostics n = row_count; if n = 0 then raise warning 'silla-ar words heading: nothing changed'; end if;

  update public.blog_posts set content = regexp_replace(content, '\s*That is why this station is called [^.]*on the home page\.', '')
   where slug = 'silla-golden-kingdom' and content ~ 'That is why this station is called [^.]*on the home page\.';
  get diagnostics n = row_count; if n = 0 then raise warning 'silla-en station sentence: nothing changed'; end if;
end $$;
