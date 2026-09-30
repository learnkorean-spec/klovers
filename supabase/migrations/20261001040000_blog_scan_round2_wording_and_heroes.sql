-- 1 Oct 2026 - Article scan round 2 (dashboard items scan86 to scan90).
--
-- Arabic imperatives / masculine address -> neutral MSA; unsupported numbers and
-- teacher promises in English posts softened; hero pictures that did not match
-- the topic swapped for the closest existing picture in public/assets/blog.
--
-- Data-only and idempotent. Every step is guarded by slug and by the exact old
-- wording (read verbatim from the published pages on 1 Oct 2026); a step that
-- finds nothing logs a WARNING and never raises, so it cannot block other
-- pending migrations. No schema change.

create or replace function pg_temp.rep(p_slug text, p_old text, p_new text)
returns void language plpgsql as $f$
declare n1 int; n2 int;
begin
  update public.blog_posts set content = replace(content, p_old, p_new)
   where slug = p_slug and content like '%' || p_old || '%';
  get diagnostics n1 = row_count;
  update public.blog_posts set description = replace(description, p_old, p_new)
   where slug = p_slug and description like '%' || p_old || '%';
  get diagnostics n2 = row_count;
  if n1 + n2 = 0 then raise warning 'nothing changed: % / %', p_slug, left(p_old, 40); end if;
end $f$;

create or replace function pg_temp.hero(p_slug text, p_old text, p_new text)
returns void language plpgsql as $f$
declare n1 int; n2 int;
begin
  update public.blog_posts set hero_image = replace(hero_image, p_old, p_new)
   where slug = p_slug and hero_image like '%' || p_old;
  get diagnostics n1 = row_count;
  update public.blog_posts set content = replace(content, p_old, p_new)
   where slug = p_slug and content like '%' || p_old || '%';
  get diagnostics n2 = row_count;
  if n1 + n2 = 0 then raise warning 'hero nothing changed: % / %', p_slug, p_old; end if;
end $f$;

-- Wording fixes
select pg_temp.rep($q$korean-drinking-culture-soju-etiquette-ar$q$, $q$تعرّف على القواعد غير المكتوبة لثقافة الشرب الكورية وآداب السوجو — الصب والاستدارة عند الشرب والمفردات التي تحتاجها لسهرة في كوريا.$q$, $q$التعرّف على القواعد غير المكتوبة لثقافة الشرب الكورية وآداب السوجو — الصب والاستدارة عند الشرب والمفردات اللازمة لسهرة في كوريا.$q$);
select pg_temp.rep($q$korean-drinking-culture-soju-etiquette-ar$q$, $q$لا تصب كأسك بنفسك أبداً.$q$, $q$لا يُصَبّ الكأس بيد صاحبه أبداً.$q$);
select pg_temp.rep($q$korean-drinking-culture-soju-etiquette-ar$q$, $q$أمسك الزجاجة بيد وادعم معصمك أو ساعدك باليد الأخرى كعلامة احترام.$q$, $q$تُمسَك الزجاجة بيد، ويُسنَد المعصم أو الساعد باليد الأخرى كعلامة احترام.$q$);
select pg_temp.rep($q$korean-drinking-culture-soju-etiquette-ar$q$, $q$أمسك كأسك بيدين عند الاستلام من شخص أكبر.$q$, $q$يُمسَك الكأس باليدين عند الاستلام من شخص أكبر.$q$);
select pg_temp.rep($q$korean-street-food-guide-ar$q$, $q$تعلّم مفردات الطعام من أكثر أجزاء دراسة الكورية متعة — لأنها تُستخدم فوراً. تضمن دروس كلوفرز القدرة على الطلب بثقة بمجرد الوصول.$q$, $q$تُعَدّ مفردات الطعام من أمتع أجزاء دراسة الكورية، لأنها تُستخدم فوراً. وتشمل دروس كلوفرز تدريباً على الطلب بثقة.$q$);
select pg_temp.rep($q$korean-directions-location-vocabulary-ar$q$, $q$تعلم مفردات الاتجاهات والمواقع بالكورية — يسار ويمين ومستقيم وفوق وتحت — بالإضافة إلى العبارات الدقيقة التي تحتاجها للسؤال عن الاتجاهات وإعطائها.$q$, $q$مفردات الاتجاهات والمواقع بالكورية — يسار ويمين ومستقيم وفوق وتحت — بالإضافة إلى العبارات الدقيقة اللازمة للسؤال عن الاتجاهات وإعطائها.$q$);
select pg_temp.rep($q$korean-directions-location-vocabulary-ar$q$, $q$تعلم مفردات الاتجاهات والمواقع بالكورية — يسار ويمين ومستقيم وفوق وتحت$q$, $q$مفردات الاتجاهات والمواقع بالكورية — يسار ويمين ومستقيم وفوق وتحت$q$);
select pg_temp.rep($q$korean-directions-location-vocabulary-ar$q$, $q$직진하세요. — سر مستقيماً.$q$, $q$직진하세요. — السير مستقيماً.$q$);
select pg_temp.rep($q$korean-directions-location-vocabulary-ar$q$, $q$왼쪽으로 도세요. — استدر يساراً.$q$, $q$왼쪽으로 도세요. — الاستدارة يساراً.$q$);
select pg_temp.rep($q$korean-directions-location-vocabulary-ar$q$, $q$오른쪽으로 도세요. — استدر يميناً.$q$, $q$오른쪽으로 도세요. — الاستدارة يميناً.$q$);
select pg_temp.rep($q$korean-reported-speech-grammar-ar$q$, $q$تعلم كيف تنقل ما قاله شخص آخر بالكورية باستخدام$q$, $q$نقل ما قاله شخص آخر بالكورية باستخدام$q$);
select pg_temp.rep($q$korean-adjectives-100-examples-beginners-ar$q$, $q$**تعلّم 5 صفات يوميًا** مع كتابة جملة واحدة لكل كلمة.$q$, $q$**تعلُّم 5 صفات يوميًا** مع كتابة جملة واحدة لكل كلمة.$q$);
select pg_temp.rep($q$best-kdrama-learn-korean-difficulty-ranked-ar$q$, $q$وتشير الأبحاث إلى أن المتعلمين الذين يشاهدون التلفزيون بلغتهم المستهدفة يتحسنون في الاستماع أسرع بـ 40% من الاعتماد على الكتب فقط.$q$, $q$ويُلاحَظ أن مشاهدة التلفزيون بلغة الدراسة تساعد غالبًا على تحسّن الاستماع أسرع من الاعتماد على الكتب فقط.$q$);
select pg_temp.rep($q$how-to-introduce-yourself-in-korean$q$, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$);
select pg_temp.rep($q$korean-weather-seasons-vocabulary$q$, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$);
select pg_temp.rep($q$korean-myths-legends-stories-kdrama-fans$q$, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$);
select pg_temp.rep($q$gumiho-nine-tailed-fox-korean-folklore$q$, $q$Most beginners notice clear wins within two to three weeks of daily practice.$q$, $q$Many beginners notice progress with regular daily practice.$q$);
select pg_temp.rep($q$how-to-introduce-yourself-in-korean$q$, $q$take you from Hangul to full conversations in 3 months, with Arabic-speaking tutors$q$, $q$take you from Hangul to real conversations, with Arabic-speaking tutors$q$);
select pg_temp.rep($q$korean-weather-seasons-vocabulary$q$, $q$Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.$q$, $q$Many intermediate learners hit a plateau, which is where structured courses can make the biggest difference.$q$);
select pg_temp.rep($q$best-kdrama-learn-korean-difficulty-ranked$q$, $q$After watching just 3 full dramas (about 50 hours), you'll notice a dramatic jump in your listening comprehension.$q$, $q$Many learners notice steady gains in listening comprehension as they watch more dramas.$q$);
select pg_temp.rep($q$korean-learning-apps-comparison-2026-duolingo-rosetta-stone$q$, $q$based on 10,000+ user reviews and 200+ hours of real-world testing$q$, $q$based on user reviews and hands-on testing$q$);
select pg_temp.rep($q$korean-learning-apps-comparison-2026-duolingo-rosetta-stone$q$, $q$**Expected result**: A1–A2 in 6–8 months$q$, $q$**Typical result for many learners**: A1–A2 in 6–8 months$q$);
select pg_temp.rep($q$korean-for-arabic-speakers-difficulty-guide$q$, $q$Our teachers understand the specific challenges Arabic speakers face and address them directly.$q$, $q$Klovers lessons are designed around the specific challenges Arabic speakers face.$q$);
select pg_temp.rep($q$korean-for-arabic-speakers-difficulty-guide$q$, $q$Korean requires speaking practice and error correction from a teacher$q$, $q$Korean benefits from speaking practice and feedback$q$);
select pg_temp.rep($q$korean-for-arabic-speakers-difficulty-guide$q$, $q$But it only takes 2 weeks to master.$q$, $q$But many learners can read it within a few weeks.$q$);
select pg_temp.rep($q$korean-passive-voice-grammar$q$, $q$Klovers' teachers build it into reading practice so it clicks naturally instead of through pure memorization.$q$, $q$Reading practice builds it in so it clicks naturally instead of through pure memorization.$q$);
select pg_temp.rep($q$korean-speech-levels-honorifics-guide$q$, $q$At Klovers, we teach 해요체 from week one and introduce speech levels with real conversation practice.$q$, $q$Klovers lessons introduce 해요체 early and bring in speech levels with real conversation practice.$q$);
select pg_temp.rep($q$korean-past-experience-grammar$q$, $q$Klovers' speaking practice gets you using it naturally within your first few lessons.$q$, $q$Klovers' speaking practice gives you regular chances to use it.$q$);
select pg_temp.rep($q$korean-ability-expressions-grammar$q$, $q$Klovers' lessons put this pattern into immediate practice so it becomes second nature fast.$q$, $q$Klovers' lessons give you practice using this pattern.$q$);
select pg_temp.rep($q$korean-past-tense-conjugation-guide$q$, $q$Klovers' courses walk you through every tense with live Arabic-speaking tutors, and our textbook includes 80+ past-tense drills.$q$, $q$Klovers' courses explain the main tenses with live Arabic-speaking tutors, and our textbook includes past-tense drills.$q$);

-- Hero pictures
select pg_temp.hero($q$korean-housing-terms-explained$q$, $q$korean-harvest.jpg$q$, $q$korean-hanok.jpg$q$);
select pg_temp.hero($q$korean-housing-terms-explained-ar$q$, $q$korean-harvest.jpg$q$, $q$korean-hanok.jpg$q$);
select pg_temp.hero($q$korean-future-tense-plans-guide$q$, $q$korean-university.jpg$q$, $q$korean-study-desk.jpg$q$);
select pg_temp.hero($q$best-kdrama-learn-korean-difficulty-ranked$q$, $q$korean-listening.jpg$q$, $q$korean-drama.jpg$q$);
select pg_temp.hero($q$best-kdrama-learn-korean-difficulty-ranked-ar$q$, $q$korean-listening.jpg$q$, $q$korean-drama.jpg$q$);
select pg_temp.hero($q$korean-learning-apps-comparison-2026-duolingo-rosetta-stone$q$, $q$korean-webtoon.jpg$q$, $q$korean-study-desk.jpg$q$);
select pg_temp.hero($q$korean-reported-speech-grammar$q$, $q$language-mixing.jpg$q$, $q$korean-phrases.jpg$q$);
select pg_temp.hero($q$korean-reported-speech-grammar-ar$q$, $q$language-mixing.jpg$q$, $q$korean-phrases.jpg$q$);
select pg_temp.hero($q$korean-purpose-intention-grammar$q$, $q$kpop-concert.jpg$q$, $q$korean-study-desk.jpg$q$);
select pg_temp.hero($q$korean-ability-expressions-grammar$q$, $q$kpop-trainee-room.jpg$q$, $q$korean-classroom.jpg$q$);
select pg_temp.hero($q$korean-past-experience-grammar$q$, $q$korean-ramyeon.jpg$q$, $q$korean-phrases.jpg$q$);
