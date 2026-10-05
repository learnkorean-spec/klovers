-- 5 Oct 2026 - Two Arabic posts wrote Korean pronunciation in Latin letters
-- inside an Arabic page (dashboard item scan86-arts-ar-latin-translit, the
-- first two of its list).
--   what-is-jeong-korean-untranslatable-concept-ar : five phrases
--   korean-verb-conjugation-guide-ar               : «안 + فعل» (an)
-- Spelling follows the post itself (정 = جونغ) and the Hangul starter sheet
-- (tense consonants with shadda).
--
-- Data-only and idempotent. Guarded by slug; a pattern that is already gone
-- logs a NOTICE and never raises. Patterns read from the live rows on
-- 5 Oct 2026.

do $$
declare
  rows text[][] := array[
    ['what-is-jeong-korean-untranslatable-concept-ar', '(jeong-i deulda)',       '(جونغي دولدا)'],
    ['what-is-jeong-korean-untranslatable-concept-ar', '(jeong-i manhda)',       '(جونغي مانتا)'],
    ['what-is-jeong-korean-untranslatable-concept-ar', '(jeong ttaemune)',       '(جونغ تّايمونيه)'],
    ['what-is-jeong-korean-untranslatable-concept-ar', '(miun jeong goun jeong)', '(ميون جونغ كوون جونغ)'],
    ['what-is-jeong-korean-untranslatable-concept-ar', '(kkeunkkeunhan jeong)',  '(كّونكّونهان جونغ)'],
    ['korean-verb-conjugation-guide-ar',               '«안 + فعل» (an)',         '«안 + فعل» (آن)']
  ];
  i int;
  n int;
begin
  for i in 1 .. array_length(rows, 1) loop
    update public.blog_posts
       set content = replace(content, rows[i][2], rows[i][3])
     where slug = rows[i][1]
       and content like '%' || rows[i][2] || '%';
    get diagnostics n = row_count;
    if n = 0 then
      raise notice '%: "%" not found (already fixed or different wording)', rows[i][1], rows[i][2];
    end if;
  end loop;

  if exists (select 1 from public.blog_posts
              where slug in ('what-is-jeong-korean-untranslatable-concept-ar',
                             'korean-verb-conjugation-guide-ar')
                and content ~ '\([A-Za-z][A-Za-z\- ]{1,30}\)') then
    raise warning 'jeong / conjugation (ar): Latin pronunciation still present - fix by hand';
  end if;
end $$;
