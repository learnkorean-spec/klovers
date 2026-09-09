-- Two small changes, both about a placement attempt being readable after the fact.
--
-- 1. placement_tests.max_score
--
--    The admin table printed every score "/30" because thirty was the size of
--    the bank when that cell was written. The live exam is fifty-two items,
--    and a student who finishes early is scored out of what she was actually
--    asked -- so the denominator is a property of the attempt and has to be
--    stored with it, not hardcoded in a component.
--
--    Existing rows stay NULL on purpose. Every one of them was sat on the
--    thirty-item bank, and the admin table falls back to 30 for a NULL rather
--    than inventing a number for history it cannot check.
--
-- 2. A self-UPDATE policy on unit_placement_tests
--
--    The page now writes the attempt -- the answers and the section scores --
--    the moment the student finishes, instead of only if she goes on to add
--    writing and voice. Those extras then have to update the row she already
--    has. Until now only an admin could update this table, so the student is
--    given exactly the window she needs and no more: her own row, and only
--    until a teacher has marked it.

alter table public.placement_tests
  add column if not exists max_score integer;

comment on column public.placement_tests.max_score is
  'How many questions the student was actually asked. NULL = an attempt sat before 2026-09-09, on the 30-item bank.';

drop policy if exists "Users can complete own unit placement" on public.unit_placement_tests;

create policy "Users can complete own unit placement"
  on public.unit_placement_tests
  for update
  to authenticated
  using ((select auth.uid()) = user_id and reviewed_at is null)
  with check ((select auth.uid()) = user_id);
