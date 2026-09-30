-- 1 Oct 2026 - Article scan round 2, part 2: the same templated result promises
-- appear in many posts (read verbatim on the live Arabic posts dokkaebi, dating
-- phrases and past tense, and on the English posts). Replaced everywhere the exact
-- sentence occurs. Data-only, idempotent: a sentence that is not found changes
-- nothing; the notice reports how many rows each step touched.

do $$
declare n1 int; n2 int;
begin

  update public.blog_posts set content = replace(content, $q$أغلب المبتدئين يلاحظون نتائج حقيقية خلال أسبوعين إلى ثلاثة من الممارسة اليومية.$q$, $q$كثير من المبتدئين يلاحظون تقدّماً مع الممارسة اليومية المنتظمة.$q$) where content like $q$%أغلب المبتدئين يلاحظون نتائج حقيقية خلال أسبوعين إلى ثلاثة من الممارسة اليومية.%$q$;
  get diagnostics n1 = row_count;
  update public.blog_posts set description = replace(description, $q$أغلب المبتدئين يلاحظون نتائج حقيقية خلال أسبوعين إلى ثلاثة من الممارسة اليومية.$q$, $q$كثير من المبتدئين يلاحظون تقدّماً مع الممارسة اليومية المنتظمة.$q$) where description like $q$%أغلب المبتدئين يلاحظون نتائج حقيقية خلال أسبوعين إلى ثلاثة من الممارسة اليومية.%$q$;
  get diagnostics n2 = row_count;
  raise notice '% content / % description rows: %', n1, n2, left($q$أغلب المبتدئين يلاحظون نتائج حقيقية خلال أسبوعين إلى ثلاثة من الممارسة اليومية.$q$, 40);

  update public.blog_posts set content = replace(content, $q$المستوى المتوسط يظهر عادةً في الشهر الثالث مع دورة منظّمة.$q$, $q$ويصل كثير من المتعلمين إلى مستوى متوسط بمرور الوقت مع دورة منظّمة.$q$) where content like $q$%المستوى المتوسط يظهر عادةً في الشهر الثالث مع دورة منظّمة.%$q$;
  get diagnostics n1 = row_count;
  update public.blog_posts set description = replace(description, $q$المستوى المتوسط يظهر عادةً في الشهر الثالث مع دورة منظّمة.$q$, $q$ويصل كثير من المتعلمين إلى مستوى متوسط بمرور الوقت مع دورة منظّمة.$q$) where description like $q$%المستوى المتوسط يظهر عادةً في الشهر الثالث مع دورة منظّمة.%$q$;
  get diagnostics n2 = row_count;
  raise notice '% content / % description rows: %', n1, n2, left($q$المستوى المتوسط يظهر عادةً في الشهر الثالث مع دورة منظّمة.$q$, 40);

  update public.blog_posts set content = replace(content, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$) where content like $q$%Most beginners notice clear wins within two to three weeks of daily practice.%$q$;
  get diagnostics n1 = row_count;
  update public.blog_posts set description = replace(description, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$) where description like $q$%Most beginners notice clear wins within two to three weeks of daily practice.%$q$;
  get diagnostics n2 = row_count;
  raise notice '% content / % description rows: %', n1, n2, left($q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, 40);

  update public.blog_posts set content = replace(content, $q$Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.$q$, $q$Many intermediate learners hit a plateau, which is where structured courses can make the biggest difference.$q$) where content like $q$%Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.%$q$;
  get diagnostics n1 = row_count;
  update public.blog_posts set description = replace(description, $q$Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.$q$, $q$Many intermediate learners hit a plateau, which is where structured courses can make the biggest difference.$q$) where description like $q$%Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.%$q$;
  get diagnostics n2 = row_count;
  raise notice '% content / % description rows: %', n1, n2, left($q$Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.$q$, 40);

end $$;
