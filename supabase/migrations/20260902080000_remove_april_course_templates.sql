-- ─────────────────────────────────────────────────────────────────────────────
-- Remove the eight April 2026 course templates, their groups, and the
-- waitlist rows attached to those groups.
--
-- WHY. `schedule_packages` holds eight rows, all created in April, all
-- is_active = false. Checked against the teacher's real commitments in Cairo
-- time, not one of them is usable:
--
--     Sun 17:00 l2 private   -> inside a private lesson
--     Mon 18:30 hangul group -> clear, but runs to 20:00 Cairo = midnight for her
--     Tue 18:00 l1 group     -> inside a private lesson
--     Wed 18:00 l2 group     -> inside a private lesson
--     Thu 18:00 l1 group     -> inside a private lesson
--     Fri 10:00 hangul group -> inside the Doo working day
--     Fri 18:00 l1 private   -> clear
--     Sat 10:00 l2 group     -> inside a private lesson
--
-- The enrol-now flow builds its day list from this table, so leaving eight
-- unusable rows here is worse than an empty table: it is the shape of a
-- schedule without being one.
--
-- WHY NOT JUST DELETE THE PACKAGES. pkg_groups.package_id is ON DELETE
-- CASCADE, and pkg_group_members.group_id cascades from there. Deleting the
-- packages on their own would have quietly taken eight groups and four
-- membership rows with it. Those four are all member_status = 'waitlist' on
-- groups that never ran, and everything downstream is empty, so nothing of
-- value is lost - but it is removed in three explicit, counted steps so that
-- what disappears is what was meant to disappear.
--
-- NOT TOUCHED. The eight rows in `enrollments` that carry a package_id already
-- reference no row in either table. That dangling reference predates this
-- migration (enrollments.package_id has no foreign key), and is left exactly
-- as it is rather than papered over here.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Preconditions, re-checked now rather than trusted ───────────────────────
-- This file was written against a snapshot. By the time it runs, someone may
-- have formed a real group, taken attendance or raised a charge. Any of those
-- and this must not proceed.
DO $$
DECLARE
  v_active   integer;
  v_sessions integer;
  v_attend   integer;
  v_charges  integer;
BEGIN
  SELECT count(*) INTO v_active
    FROM public.pkg_group_members m
    JOIN public.pkg_groups g ON g.id = m.group_id
   WHERE g.package_id IN (SELECT id FROM public.schedule_packages)
     AND m.member_status = 'active';
  IF v_active > 0 THEN
    RAISE EXCEPTION 'refusing to run: % active group member(s) exist - these are real students, not waitlist rows', v_active;
  END IF;

  SELECT count(*) INTO v_sessions
    FROM public.pkg_group_sessions s
    JOIN public.pkg_groups g ON g.id = s.group_id
   WHERE g.package_id IN (SELECT id FROM public.schedule_packages);
  IF v_sessions > 0 THEN
    RAISE EXCEPTION 'refusing to run: % class session(s) exist on these groups', v_sessions;
  END IF;

  SELECT count(*) INTO v_attend  FROM public.pkg_attendance;
  SELECT count(*) INTO v_charges FROM public.pkg_class_charges;
  IF v_attend > 0 OR v_charges > 0 THEN
    RAISE EXCEPTION 'refusing to run: attendance (%) or class charges (%) exist; deleting could reach financial records', v_attend, v_charges;
  END IF;
END $$;

-- ── Step 1: the waitlist rows ───────────────────────────────────────────────
DELETE FROM public.pkg_group_members m
 USING public.pkg_groups g
 WHERE g.id = m.group_id
   AND g.package_id IN (SELECT id FROM public.schedule_packages);

-- ── Step 2: the groups ──────────────────────────────────────────────────────
DELETE FROM public.pkg_groups
 WHERE package_id IN (SELECT id FROM public.schedule_packages);

-- ── Step 3: the templates themselves ────────────────────────────────────────
DELETE FROM public.schedule_packages;

-- ── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_pkgs integer; v_groups integer; v_members integer;
BEGIN
  SELECT count(*) INTO v_pkgs   FROM public.schedule_packages;
  SELECT count(*) INTO v_groups FROM public.pkg_groups;
  SELECT count(*) INTO v_members FROM public.pkg_group_members;

  IF v_pkgs <> 0 THEN
    RAISE EXCEPTION 'schedule_packages should be empty, found %', v_pkgs;
  END IF;
  IF v_groups <> 0 THEN
    RAISE EXCEPTION 'pkg_groups should be empty, found %', v_groups;
  END IF;
  IF v_members <> 0 THEN
    RAISE EXCEPTION 'pkg_group_members should be empty, found %', v_members;
  END IF;

  RAISE NOTICE 'removed the April course templates: schedule_packages, pkg_groups and pkg_group_members are now empty';
END $$;

COMMIT;
