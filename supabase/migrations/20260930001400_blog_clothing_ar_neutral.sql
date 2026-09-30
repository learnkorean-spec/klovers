-- 30 Sep 2026 - Arabic clothing post: neutral MSA opening, Arabic instead of
-- Latin "K-fashion" (dashboard item scan66-clothing-ar-imperative).
--
-- The first sentence (also the Google description) opened with the
-- imperative «تعلم أهم مفردات…», the article addressed the reader with
-- «إطلالتك», and «K-fashion» appeared in Latin letters.
--
-- Data-only and idempotent. Each step is guarded by slug and only fires when
-- the old wording is present; a step that finds nothing logs a WARNING and
-- never raises, so it cannot block other pending migrations.
-- The live text was read from the published page on 30 Sep 2026.

do $$
declare n int;
begin
  -- 1) Description and body: no imperative at the start.
  update public.blog_posts
     set description = replace(description, 'تعلم أهم مفردات الملابس', 'أهم مفردات الملابس'),
         content     = replace(content,     'تعلم أهم مفردات الملابس', 'أهم مفردات الملابس')
   where slug = 'korean-clothing-fashion-vocabulary-ar'
     and (description like '%تعلم أهم مفردات الملابس%' or content like '%تعلم أهم مفردات الملابس%');
  get diagnostics n = row_count; if n = 0 then raise warning 'clothing-ar imperative: nothing changed'; end if;

  -- 2) «إطلالتك» -> «الإطلالة» (neutral, no direct address).
  update public.blog_posts
     set description = replace(description, 'وصف إطلالتك', 'وصف الإطلالة'),
         content     = replace(content,     'وصف إطلالتك', 'وصف الإطلالة')
   where slug = 'korean-clothing-fashion-vocabulary-ar'
     and (description like '%وصف إطلالتك%' or content like '%وصف إطلالتك%');
  get diagnostics n = row_count; if n = 0 then raise warning 'clothing-ar itlalatak: nothing changed'; end if;

  -- 3) «K-fashion» in Latin letters -> Arabic.
  update public.blog_posts
     set description = replace(replace(description, 'الموضة الكورية K-fashion', 'الموضة الكورية'), 'K-fashion', 'الموضة الكورية'),
         content     = replace(replace(content,     'الموضة الكورية K-fashion', 'الموضة الكورية'), 'K-fashion', 'الموضة الكورية')
   where slug = 'korean-clothing-fashion-vocabulary-ar'
     and (description like '%K-fashion%' or content like '%K-fashion%');
  get diagnostics n = row_count; if n = 0 then raise warning 'clothing-ar k-fashion: nothing changed'; end if;

  -- Check: report anything the replacements could not reach.
  if exists (select 1 from public.blog_posts
              where slug = 'korean-clothing-fashion-vocabulary-ar'
                and (description like '%K-fashion%' or content like '%K-fashion%'
                     or description like 'تعلم %')) then
    raise warning 'korean-clothing-fashion-vocabulary-ar still has an imperative start or Latin K-fashion - fix by hand';
  end if;
end $$;
