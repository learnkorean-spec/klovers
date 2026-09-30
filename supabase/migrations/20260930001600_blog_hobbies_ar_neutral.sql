-- 30 Sep 2026 - Arabic hobbies post: neutral MSA, no masculine address
-- (dashboard item scan72-hobbies-ar-gendered).
--
-- The Google description and first line opened with «تعلم كيف تتحدث عن
-- الهوايات…», the body used «يفتح لك» and «حياتك واهتماماتك», the closing
-- call to action «لتضمن قدرتك على الحديث عن هواياتك», and the FAQ
-- «تستمتع به في وقت فراغك».
--
-- Data-only and idempotent. Every replacement is guarded by slug and only
-- changes text that is still present; a step that finds nothing logs a
-- NOTICE and never raises, so it cannot block other pending migrations.
-- The live text was read from the published page on 1 Oct 2026.
-- Shadda variants (تعلم / تعلّم) are both handled.
--
-- Left as is on purpose: «ماذا تفعل في وقت فراغك؟» is the translation of a
-- Korean question addressed to one person (시간이 있을 때 뭐 해요?), so it
-- keeps the second person; it can be reviewed by hand.

do $$
declare
  s constant text := 'korean-hobbies-free-time-vocabulary-ar';
  pairs text[][] := array[
    -- description + first line
    ['تعلم كيف تتحدث عن الهوايات ووقت الفراغ بالكورية',
     'الحديث عن الهوايات ووقت الفراغ بالكورية'],
    ['تعلّم كيف تتحدث عن الهوايات ووقت الفراغ بالكورية',
     'الحديث عن الهوايات ووقت الفراغ بالكورية'],
    -- body
    ['إتقانها يفتح لك باب', 'إتقانها يفتح باب'],
    ['الحديث عن حياتك واهتماماتك الخاصة',
     'الحديث عن الحياة اليومية والاهتمامات الخاصة'],
    -- closing call to action
    ['لتضمن قدرتك على الحديث عن هواياتك الحقيقية',
     'ليصبح الحديث عن الهوايات الحقيقية ممكنًا'],
    -- FAQ
    ['تستمتع به في وقت فراغك', 'يُستمتَع به في وقت الفراغ']
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
      raise notice 'hobbies-ar: "%" not found (already fixed or different wording)', left(pairs[i][1], 40);
    end if;
  end loop;

  -- Check: report anything still addressing the reader directly.
  if exists (select 1 from public.blog_posts
              where slug = s
                and (description like 'تعلم %'
                     or description like 'تعلّم %'
                     or content like '%يفتح لك%'
                     or content like '%حياتك%'
                     or content like '%هواياتك%'
                     or content like '%تستمتع به%')) then
    raise warning '% still has masculine / second-person wording - fix by hand', s;
  end if;
end $$;
