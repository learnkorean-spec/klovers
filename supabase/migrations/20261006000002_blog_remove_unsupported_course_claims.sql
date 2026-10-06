-- Removes claims that the site cannot back up: textbook chapters on folklore,
-- Seollal, nunchi, jeong etc. and course "modules/tracks" for them. The textbook
-- has no such chapters. Text-only change, keyed by slug. Each replacement must
-- match exactly once or the whole migration fails (nothing half-applied).
DO $m$
DECLARE
  r record;
  en_new text := $q$Klovers teaches Korean step by step, and our free [placement test](/placement-test) shows you where to begin.$q$;
  ar_new text := $q$تُدرّس كلوفرز اللغة الكورية خطوة بخطوة، ويوضح [اختبار تحديد المستوى](/placement-test) المجاني من أين تبدأ.$q$;
BEGIN
  FOR r IN SELECT * FROM (VALUES
  ('dokkaebi-korean-goblin-myth-kdrama', $q$Klovers' [courses](/courses) cover folklore, our [textbook](/textbook) has a myth vocabulary chapter, and our free [placement test](/placement-test) shows you where to begin.$q$, en_new),
  ('gumiho-nine-tailed-fox-korean-folklore', $q$Klovers' [courses](/courses) include a folklore module, our [textbook](/textbook) has a Gumiho vocabulary chapter, and our free [placement test](/placement-test) shows you where to begin.$q$, en_new),
  ('jeoseung-saja-korean-grim-reaper-symbolism', $q$Our [courses](/courses) cover folklore-era vocabulary, our [textbook](/textbook) includes a Korean mythology chapter, and our free [placement test](/placement-test) maps your starting point.$q$, en_new),
  ('korean-shamanism-mudang-kdrama-tradition', $q$Klovers' [courses](/courses) include a culture and folklore track, our [textbook](/textbook) has a mythology chapter, and our free [placement test](/placement-test) shows where to begin.$q$, en_new),
  ('nunchi-korean-social-superpower-guide', $q$Klovers' [courses](/courses) include cultural coaching, our [textbook](/textbook) has a nunchi chapter, and our free [placement test](/placement-test) finds your starting level.$q$, en_new),
  ('seollal-korean-lunar-new-year-guide-2026', $q$Klovers' [courses](/courses) cover holiday vocabulary, our [textbook](/textbook) has a Seollal chapter, and our free [placement test](/placement-test) checks your level.$q$, en_new),
  ('what-is-jeong-korean-untranslatable-concept', $q$Klovers' [courses](/courses) cover cultural vocabulary, our [textbook](/textbook) has a feelings chapter, and our free [placement test](/placement-test) finds your level.$q$, en_new),
  ('dokkaebi-korean-goblin-myth-kdrama-ar', $q$تغطي [دورات](/courses) الفولكلور في كلوفرز، ويحتوي [كتابنا المدرسي](/textbook) على فصل من المفردات الأسطورية، ويوضح لك [اختبار تحديد المستوى](/placement-test) المجاني من أين تبدأ.$q$, ar_new),
  ('gumiho-nine-tailed-fox-korean-folklore-ar', $q$تتضمن [دورات](/courses) الخاصة بكلوفرز وحدة فولكلورية، ويحتوي [كتابنا المدرسي](/textbook) على فصل عن مفردات Gumiho، كما يوضح [اختبار تحديد المستوى](/placement-test) المجاني نقطة البداية.$q$, ar_new),
  ('jeoseung-saja-korean-grim-reaper-symbolism-ar', $q$تغطي [دوراتنا](/courses) مفردات العصر الفولكلوري، ويتضمن [كتابنا المدرسي](/textbook) فصلاً عن الأساطير الكورية، ويحدّد [اختبار تحديد المستوى](/placement-test) المجاني نقطة البداية.$q$, ar_new),
  ('korean-shamanism-mudang-kdrama-tradition-ar', $q$تتضمن [دورات](/courses) كلوفرز مسارًا ثقافيًا وفولكلوريًا، ويحتوي [كتابنا المدرسي](/textbook) على فصل عن الأساطير، كما يوضح [اختبار تحديد المستوى](/placement-test) الخاص بنا من أين نبدأ.$q$, ar_new),
  ('nunchi-korean-social-superpower-guide-ar', $q$تتضمن [دورات](/courses) الخاصة بـ كلوفرز تدريبًا ثقافيًا، ويحتوي [كتابنا المدرسي](/textbook) على فصل للنونتشي، و[اختبار تحديد المستوى](/placement-test) المجاني الخاص بنا يحدد مستوى البداية.$q$, ar_new),
  ('seollal-korean-lunar-new-year-guide-2026-ar', $q$تغطي [دورات](/courses) كلوفرز مفردات العطلات، ويحتوي [كتابنا المدرسي](/textbook) على فصل عن «سولال»، و[اختبار تحديد المستوى](/placement-test) المجاني الخاص بنا يتحقق من المستوى.$q$, ar_new),
  ('what-is-jeong-korean-untranslatable-concept-ar', $q$تغطي [دورات](/courses) الخاصة بكلوفرز المفردات الثقافية، ويحتوي [كتابنا المدرسي](/textbook) على فصل للمشاعر، و[اختبار تحديد المستوى](/placement-test) المجاني الخاص بنا يحدد المستوى.$q$, ar_new)
  ) AS t(slug, old_s, new_s)
  LOOP
    UPDATE public.blog_posts
       SET content = replace(content, r.old_s, r.new_s)
     WHERE slug = r.slug AND position(r.old_s in content) > 0;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'sentence not found for %', r.slug;
    END IF;
  END LOOP;
END
$m$;
