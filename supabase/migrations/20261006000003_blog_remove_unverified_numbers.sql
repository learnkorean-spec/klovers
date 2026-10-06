-- Removes unverified numbers and promises (80 exercises, 30 dialogues, 200 sentence
-- models, a full travel unit, "cultural lessons"). Text-only, keyed by slug.
-- Each removal must match exactly once or the whole migration fails.
DO $m$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
  ('korean-past-tense-conjugation-guide-ar', $q$، ويتضمن [كتابنا المدرسي](/textbook) أكثر من 80 تدريبًا على زمن الماضي.$q$, '.'),
  ('korean-restaurant-ordering-phrases-guide-ar', $q$تشتمل [دوراتنا](/courses) على وحدة كاملة للسفر باللغة الكورية، ويوضح$q$, 'يوضح'),
  ('korean-restaurant-ordering-phrases-guide-ar', $q$ ويقدّم [الكتاب المدرسي](/textbook) 30 حوارًا إضافيًا حول مشهد الطعام.$q$, ''),
  ('korean-sentence-structure-word-order-guide-ar', $q$، ويحتوي [كتابنا المدرسي](/textbook) على أكثر من 200 نموذج لجملة منظمة.$q$, '.'),
  ('korean-drinking-culture-soju-etiquette', $q$ Klovers' cultural lessons cover exactly this kind of practical, real-world etiquette.$q$, ''),
  ('korean-phone-texting-etiquette', $q$ Klovers' cultural lessons cover exactly these practical, real-world nuances.$q$, '')
  ) AS t(slug, old_s, new_s)
  LOOP
    UPDATE public.blog_posts
       SET content = replace(content, r.old_s, r.new_s)
     WHERE slug = r.slug AND position(r.old_s in content) > 0;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'text not found for %', r.slug;
    END IF;
  END LOOP;
END
$m$;
