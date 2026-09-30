-- 30 Sep 2026 - Arabic transport post: neutral MSA, no masculine address or
-- imperatives (dashboard item scan68-transport-ar-gendered).
--
-- The Google description and first line opened with «تعلم مفردات…», the
-- intro used «إذا كنت تستطيع» and «سواء كنت زائراً أو مقيماً», the metro
-- steps were imperatives (احصل، تحقق، مرّر، استخدم، انتبه) and the closing
-- call to action asked «هل تخطط…» / «حتى تتنقل».
--
-- Data-only and idempotent. Every replacement is guarded by slug and only
-- changes text that is still present; a step that finds nothing logs a
-- NOTICE and never raises, so it cannot block other pending migrations.
-- The live text was read from the published page on 30 Sep 2026.
-- Shadda variants (مرّر / مرر) are both handled.

do $$
declare
  s constant text := 'korean-transportation-guide-seoul-ar';
  pairs text[][] := array[
    -- description + first line
    ['تعلم مفردات وعبارات المواصلات الكورية التي تحتاجها للتنقل',
     'مفردات وعبارات المواصلات الكورية اللازمة للتنقل'],
    -- intro
    ['لكن فقط إذا كنت تستطيع قراءة اللافتات وطرح الأسئلة الصحيحة',
     'بشرط القدرة على قراءة اللافتات وطرح الأسئلة الصحيحة'],
    ['سواء كنت زائراً أو مقيماً في كوريا، هذه المفردات ستوصلك إلى أي مكان تحتاجه',
     'هذه المفردات تفيد الزائر والمقيم في كوريا على السواء، وتوصل إلى أي مكان'],
    -- metro steps: imperatives -> verbal nouns
    ['احصل على بطاقة', 'الحصول على بطاقة'],
    ['تحقق من لون ورقم الخط', 'التحقق من لون ورقم الخط'],
    ['مرّر البطاقة عند الدخول والخروج', 'تمرير البطاقة عند الدخول والخروج'],
    ['مرر البطاقة عند الدخول والخروج', 'تمرير البطاقة عند الدخول والخروج'],
    ['مرّر بطاقتك عند البوابة', 'تُمرَّر البطاقة عند البوابة'],
    ['مرر بطاقتك عند البوابة', 'تُمرَّر البطاقة عند البوابة'],
    ['استخدم محطات التبديل', 'استخدام محطات التبديل'],
    ['انتبه لإعلانات المحطات', 'الانتباه لإعلانات المحطات'],
    -- closing call to action
    ['هل تخطط لرحلة إلى كوريا أو تريد فقط كورية عملية للسفر؟',
     'لرحلة قريبة إلى كوريا أو لكورية عملية في السفر:'],
    ['حتى تتنقل بثقة منذ اليوم الأول', 'ليصبح التنقل سهلًا وواثقًا منذ اليوم الأول']
  ];
  i int;
  n int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    update public.blog_posts
       set description = replace(description, pairs[i][1], pairs[i][2]),
           content     = replace(content,     pairs[i][1], pairs[i][2])
     where slug = s
       and (description like '%' || pairs[i][1] || '%'
            or content  like '%' || pairs[i][1] || '%');
    get diagnostics n = row_count;
    if n = 0 then
      raise notice 'transport-ar: "%" not found (already fixed or different wording)', left(pairs[i][1], 40);
    end if;
  end loop;

  -- Check: report anything still addressing the reader directly.
  if exists (select 1 from public.blog_posts
              where slug = s
                and (description like 'تعلم %'
                     or content like '%إذا كنت تستطيع%'
                     or content like '%سواء كنت%'
                     or content like '%هل تخطط%'
                     or content like '%حتى تتنقل%')) then
    raise warning '% still has masculine / imperative wording - fix by hand', s;
  end if;
end $$;
