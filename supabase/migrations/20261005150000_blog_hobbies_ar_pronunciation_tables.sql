-- 5 Oct 2026 - Arabic hobbies post: the "frequency" and "sports" tables get a
-- pronunciation column in Arabic letters, like the main hobbies table
-- (dashboard item scan72-hobbies-ar-latin).
--
-- The main table was already moved to Arabic letters (دوكسو، يوري…). The two
-- small tables «الحديث عن التكرار» and «مفردات رياضية» still had only
-- Korean | meaning, so a learner had no way to read them aloud.
--
-- Data-only and idempotent. Guarded by slug; each row is replaced only while
-- its old two-column form is still present. A step that finds nothing logs a
-- NOTICE and never raises, so it cannot block other pending migrations.
-- Live text read from blog_posts on 5 Oct 2026.
-- Spelling follows the main table and the Hangul starter sheet
-- (tense consonants with shadda: 가끔 كاكّوم، 축구 تشوكّو).

do $$
declare
  s  constant text := 'korean-hobbies-free-time-vocabulary-ar';
  pairs text[][] := array[
    ['| الكورية | المعنى |' || chr(10) || '|---|---|',
     '| الكورية | النطق | المعنى |' || chr(10) || '|---|---|---|'],
    ['| 매일 | كل يوم |',          '| 매일 | مايل | كل يوم |'],
    ['| 가끔 | أحياناً |',          '| 가끔 | كاكّوم | أحياناً |'],
    ['| 주말마다 | كل نهاية أسبوع |', '| 주말마다 | جومالمادا | كل نهاية أسبوع |'],
    ['| 자주 | غالباً |',            '| 자주 | جاجو | غالباً |'],
    ['| 축구 | كرة القدم |',         '| 축구 | تشوكّو | كرة القدم |'],
    ['| 농구 | كرة السلة |',         '| 농구 | نونغو | كرة السلة |'],
    ['| 수영 | السباحة |',           '| 수영 | سويونغ | السباحة |'],
    ['| 배드민턴 | تنس الريشة |',     '| 배드민턴 | بيدومينتون | تنس الريشة |'],
    ['| 요가 | اليوغا |',            '| 요가 | يوغا | اليوغا |']
  ];
  i int;
  n int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    update public.blog_posts
       set content = replace(content, pairs[i][1], pairs[i][2])
     where slug = s
       and content like '%' || pairs[i][1] || '%';
    get diagnostics n = row_count;
    if n = 0 then
      raise notice 'hobbies-ar: "%" not found (already fixed or different wording)', left(pairs[i][1], 40);
    end if;
  end loop;

  -- Check: no two-column Korean table left in the post.
  if exists (select 1 from public.blog_posts
              where slug = s
                and content like '%| الكورية | المعنى |%') then
    raise warning '% still has a table without pronunciation - fix by hand', s;
  end if;
end $$;
