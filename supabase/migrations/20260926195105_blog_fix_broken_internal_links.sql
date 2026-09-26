-- QA-01 follow-up (27 Sep 2026): internal links whose target was a translated
-- label or had a stray space, all 404. Point them at the real routes.
-- Applied in production on 27 Sep 2026 (version recorded in schema_migrations).
update public.blog_posts
set content = replace(replace(replace(replace(replace(content,
      '](/اختبار تحديد المستوى)', '](/placement-test)'),
      '](/الكتاب المدرسي)',       '](/textbook)'),
      '](/كتاب مدرسي)',           '](/textbook)'),
      '](/ Courses)',             '](/courses)'),
      '](/ الدورات)',             '](/courses)')
where content like '%](/اختبار تحديد المستوى)%'
   or content like '%](/الكتاب المدرسي)%'
   or content like '%](/كتاب مدرسي)%'
   or content like '%](/ Courses)%'
   or content like '%](/ الدورات)%';
