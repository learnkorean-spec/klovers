-- 29 Sep 2026. Content fix for the two hanok posts (dashboard items
-- scan45-hanok-ar-regions, scan45-hanok-ar-you, scan46-hanok-en-regions).
--
-- 1) Fact: both posts say southern hanok are L-shaped and the centre mixes
--    both. The article's own source says: north = closed square (ㅁ),
--    centre = L-shaped (ㄱ), south = one straight open row (ㅡ).
-- 2) Arabic post addresses the reader in the masculine ("بإمكانك") -
--    brand guard: neutral MSA, no direct gendered address.
--
-- Data-only. Each replace is guarded by slug + LIKE, so re-running is a no-op.
-- The DO block at the end fails the migration (and the whole transaction
-- rolls back) if any corrected sentence is missing afterwards - i.e. if the
-- live text differed from what these replaces expect. Nothing half-applies.

update public.blog_posts
   set content = replace(content,
         'هانوك الشمال مربّع ليحتفظ بالدفء، وهانوك الجنوب مفتوح على شكل حرف L للتهوية، وفي الوسط يجمعون بين النمطين.',
         'هانوك الشمال مربّع مغلق ليحتفظ بالدفء، وهانوك الوسط على شكل حرف L، أمّا هانوك الجنوب فغرفه في صفٍّ واحد مستقيم ومفتوح للتهوية.')
 where slug = 'hanok-traditional-korean-house-ar'
   and content like '%وهانوك الجنوب مفتوح على شكل حرف L للتهوية، وفي الوسط يجمعون بين النمطين.%';

update public.blog_posts
   set content = replace(content,
         'ما زال بإمكانك المشي في واحد منها اليوم في قرية بوكتشون للهانوك في وسط سيول.',
         'وما زال بعضها مفتوحًا للزوار اليوم في قرية بوكتشون للهانوك في وسط سيول.')
 where slug = 'hanok-traditional-korean-house-ar'
   and content like '%ما زال بإمكانك المشي في واحد منها اليوم%';

update public.blog_posts
   set content = replace(content,
         'Northern hanok are square to keep heat in. Southern ones are open and L-shaped for ventilation. Central regions combine both.',
         'Northern hanok are closed squares to keep heat in. Central ones are L-shaped. Southern ones sit in a single straight, open row for ventilation.')
 where slug = 'hanok-traditional-korean-house'
   and content like '%Southern ones are open and L-shaped for ventilation. Central regions combine both.%';

do $$
begin
  if not exists (select 1 from public.blog_posts
                  where slug = 'hanok-traditional-korean-house-ar'
                    and content like '%وهانوك الوسط على شكل حرف L%'
                    and content like '%بعضها مفتوحًا للزوار اليوم%'
                    and content not like '%بإمكانك المشي%') then
    raise exception 'hanok-traditional-korean-house-ar: expected sentences not found - live text differs, nothing changed';
  end if;
  if not exists (select 1 from public.blog_posts
                  where slug = 'hanok-traditional-korean-house'
                    and content like '%Central ones are L-shaped.%'
                    and content not like '%Southern ones are open and L-shaped%') then
    raise exception 'hanok-traditional-korean-house: expected sentence not found - live text differs, nothing changed';
  end if;
end $$;
