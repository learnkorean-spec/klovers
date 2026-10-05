-- Street-food guide (EN): remove claims about food lessons that do not exist
-- and the guaranteed-outcome promise. Text-only; keyed by slug.
update public.blog_posts
set cta_text = 'Start Learning Korean with Klovers',
    content = replace(
      content,
      'Klovers'' lessons make sure you can order confidently the moment you land.',
      'Klovers teaches Korean step by step, from Hangul to everyday conversation.')
where slug = 'korean-street-food-guide';
