-- Remove the March 2026 test enrollments — 14 Sep 2026
--
-- Re confirmed these were made during a "try the site and tell me if it works"
-- round in late March, not by students. They have distorted every number since:
-- three of them carry payment_status = PAID for a combined 10,150 EGP against
-- rows that are also REJECTED and cancelled, and twelve of the nineteen are one
-- person filing the same private enrolment over and over.
--
-- They are deleted by EXPLICIT ID, not by matching on the email address. An
-- address-based sweep would also delete whatever those same addresses do next —
-- and one of them, admin@klovers.com, is the account Re tests from, so it will
-- certainly produce more rows. The nineteen ids below are the ones that existed
-- and were reviewed on 14 Sep 2026; nothing created after that is touched.
--
-- The full inventory is recorded here rather than only in the delete, so the
-- rows remain recoverable from version control:
--
--   id                                    email                      created     plan     amount  payment
--   651aa417-4420-447f-9ecf-c395b882fadc  abdotaweel1@gmail.com      2026-03-31  group     1,200  PAID
--   8c491290-d6e3-4167-8b51-2f1bef623b3f  admin@klovers.com          2026-03-29  private   2,350  UNPAID
--   842de20a-5ac5-4963-b6fb-6297f06d00eb  elshrkawyhossam@gmail.com  2026-03-27  private   6,600  PAID
--   38089c10-e074-4145-857d-e1688e14bfa3  elshrkawyhossam@gmail.com  2026-03-27  private   6,600  UNPAID
--   f85709ec-b455-4bca-a327-3c6316f23cfc  elshrkawyhossam@gmail.com  2026-03-28  private   6,600  UNPAID
--   88b9fce1-dab7-4aeb-bda2-c9ef7d9f78ab  elshrkawyhossam@gmail.com  2026-03-28  private   6,600  UNPAID
--   e5e80e19-b4d7-430f-bba6-41e6e8238c1e  elshrkawyhossam@gmail.com  2026-03-28  private   6,600  UNPAID
--   66f66585-f9c4-45fa-9d85-1b23d8759c12  elshrkawyhossam@gmail.com  2026-03-28  private   6,600  UNPAID
--   f8e59567-24a4-401d-85c9-9b3733469db7  elshrkawyhossam@gmail.com  2026-03-29  private   6,600  UNPAID
--   be705436-fd99-43f2-ac15-66e6ed214361  elshrkawyhossam@gmail.com  2026-03-29  private  11,750  UNPAID
--   3fd112cd-46b7-42be-9bf9-2d0e7e555ec9  elshrkawyhossam@gmail.com  2026-03-30  private   2,350  UNPAID
--   fbfcde06-cfca-44db-a0b9-da38e58d2d31  elshrkawyhossam@gmail.com  2026-03-30  private  11,750  UNPAID
--   b5ea3639-4701-4b89-a7b4-817cee4bcccc  elshrkawyhossam@gmail.com  2026-03-31  private   2,350  UNPAID
--   1c3ac77f-2c92-4cea-b338-8fffd738363f  elshrkawyhossam@gmail.com  2026-04-02  private   6,600  UNPAID
--   5d8d22d8-f908-49de-80f7-81ca2be7b0e6  humanlifedone@gmail.com    2026-03-27  private   2,350  UNPAID
--   d1ff0530-b8fb-40df-b913-286c0174562e  humanlifedone@gmail.com    2026-03-27  private   2,350  PAID
--   75545e88-40ca-4472-bd63-403783e743d5  samirasaad505@gmail.com    2026-03-27  group     3,300  UNPAID
--   02a07c22-1101-4883-a773-c2df1fc66730  samirasaad505@gmail.com    2026-03-29  private   6,600  UNPAID
--   0a9b276c-b781-4025-b0b3-d180b5da8016  samirasaad505@gmail.com    2026-03-29  private   6,600  UNPAID
--
-- Every one is approval_status = REJECTED and enrollment_status = cancelled.
-- None has a class, a bundle, a placement test or a single row in email_logs.
--
-- DELIBERATELY NOT INCLUDED: remorery2012@gmail.com. Its one enrolment looks
-- like the others, but that address booked two real trial classes and has
-- received nine letters — it behaves like a person who tried the product, not
-- like a test account. Deleting it would lose the only enrolment record of
-- someone who engaged. Add it in a later migration if Re confirms otherwise.
--
-- Profiles, leads and login accounts are KEPT. They cost nothing, they do not
-- appear in any revenue figure, and deleting a profile means deleting the auth
-- user behind it — a cascade with no undo, for no gain.

-- ---------------------------------------------------------------------------
-- Child rows first: two of these ids carry attendance records, and both tables
-- hold a foreign key to enrollments. (Measured on 14 Sep: one row in each,
-- both belonging to 842de20a — the paid Hossam test.)
-- ---------------------------------------------------------------------------
-- Not ON COMMIT DROP: whether a migration runner wraps the whole file in one
-- transaction or applies it statement by statement is not worth betting the
-- delete on. It is dropped explicitly at the end instead, which is correct
-- either way.
drop table if exists _test_enrolment_ids;
create temporary table _test_enrolment_ids (id uuid primary key);

insert into _test_enrolment_ids (id) values
  ('651aa417-4420-447f-9ecf-c395b882fadc'),
  ('8c491290-d6e3-4167-8b51-2f1bef623b3f'),
  ('842de20a-5ac5-4963-b6fb-6297f06d00eb'),
  ('38089c10-e074-4145-857d-e1688e14bfa3'),
  ('f85709ec-b455-4bca-a327-3c6316f23cfc'),
  ('88b9fce1-dab7-4aeb-bda2-c9ef7d9f78ab'),
  ('e5e80e19-b4d7-430f-bba6-41e6e8238c1e'),
  ('66f66585-f9c4-45fa-9d85-1b23d8759c12'),
  ('f8e59567-24a4-401d-85c9-9b3733469db7'),
  ('be705436-fd99-43f2-ac15-66e6ed214361'),
  ('3fd112cd-46b7-42be-9bf9-2d0e7e555ec9'),
  ('fbfcde06-cfca-44db-a0b9-da38e58d2d31'),
  ('b5ea3639-4701-4b89-a7b4-817cee4bcccc'),
  ('1c3ac77f-2c92-4cea-b338-8fffd738363f'),
  ('5d8d22d8-f908-49de-80f7-81ca2be7b0e6'),
  ('d1ff0530-b8fb-40df-b913-286c0174562e'),
  ('75545e88-40ca-4472-bd63-403783e743d5'),
  ('02a07c22-1101-4883-a773-c2df1fc66730'),
  ('0a9b276c-b781-4025-b0b3-d180b5da8016');

-- ---------------------------------------------------------------------------
-- Refuse to run if the rows are not what this migration was written against.
--
-- A delete list written from a review three hours ago is only safe while the
-- rows still match that review. If any of these nineteen has since been
-- approved, paid for real, or attached to a class, this raises instead of
-- quietly destroying it — and the error says which one.
-- ---------------------------------------------------------------------------
do $$
declare
  v_found      integer;
  v_unexpected integer;
  v_bad        text;
begin
  select count(*) into v_found
    from public.enrollments e join _test_enrolment_ids t on t.id = e.id;

  if v_found <> 19 then
    raise exception
      'Expected 19 test enrolments, found %. Someone deleted or added rows since review; re-check before running.',
      v_found;
  end if;

  select count(*), string_agg(e.id::text, ', ')
    into v_unexpected, v_bad
    from public.enrollments e
    join _test_enrolment_ids t on t.id = e.id
   where e.approval_status <> 'REJECTED'
      or e.enrollment_status <> 'cancelled';

  if v_unexpected > 0 then
    raise exception
      '% of the listed enrolments are no longer REJECTED/cancelled (%). Refusing to delete.',
      v_unexpected, v_bad;
  end if;

  -- A class, a bundle or a sent letter would mean the row is not a test.
  select count(*) into v_unexpected
    from public.email_logs l join _test_enrolment_ids t on t.id = l.enrollment_id;

  if v_unexpected > 0 then
    raise exception
      '% email_logs rows point at these enrolments. Refusing to delete.', v_unexpected;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- The delete, children before parents.
-- ---------------------------------------------------------------------------
delete from public.admin_attendance_log a
 using _test_enrolment_ids t where a.enrollment_id = t.id;

delete from public.attendance_requests r
 using _test_enrolment_ids t where r.enrollment_id = t.id;

delete from public.batch_members b
 using _test_enrolment_ids t where b.enrollment_id = t.id;

delete from public.book_assignments b
 using _test_enrolment_ids t where b.enrollment_id = t.id;

delete from public.schedule_resubmission_requests s
 using _test_enrolment_ids t where s.enrollment_id = t.id;

delete from public.student_slot_preferences s
 using _test_enrolment_ids t where s.enrollment_id = t.id;

delete from public.enrollments e
 using _test_enrolment_ids t where e.id = t.id;

-- ---------------------------------------------------------------------------
-- What should be left: 7 enrolments, none of them PAID-and-cancelled.
-- ---------------------------------------------------------------------------
do $$
declare
  v_left integer;
  v_paid_cancelled integer;
begin
  select count(*) into v_left from public.enrollments;
  select count(*) into v_paid_cancelled
    from public.enrollments
   where payment_status = 'PAID'
     and enrollment_status = 'cancelled';

  raise notice 'enrollments remaining: %, paid-but-cancelled remaining: %',
    v_left, v_paid_cancelled;

  if v_paid_cancelled > 0 then
    raise notice 'Still % paid-and-cancelled row(s) — check whether they are real.',
      v_paid_cancelled;
  end if;
end $$;

drop table if exists _test_enrolment_ids;
