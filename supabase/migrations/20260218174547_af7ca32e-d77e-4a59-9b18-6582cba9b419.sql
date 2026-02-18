
-- Add is_active column to pkg_groups for soft-disable support
ALTER TABLE public.pkg_groups ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- RPC 1: ensure_pkg_groups_for_packages
-- Auto-creates one default group for each active schedule_package that has none
CREATE OR REPLACE FUNCTION public.ensure_pkg_groups_for_packages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p RECORD;
  created_count integer := 0;
  day_name text;
  time_label text;
  group_name text;
BEGIN
  FOR p IN SELECT * FROM public.schedule_packages WHERE is_active = true LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.pkg_groups
      WHERE package_id = p.id AND is_active = true
    ) THEN
      day_name := CASE p.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        ELSE 'Unknown'
      END;
      time_label := to_char(p.start_time, 'HH12:MI AM');
      group_name := initcap(replace(p.level, '_', ' ')) || ' — ' || day_name || ' ' || time_label;
      INSERT INTO public.pkg_groups(package_id, name, capacity, is_active)
      VALUES (p.id, group_name, COALESCE(p.capacity, 5), true);
      created_count := created_count + 1;
    END IF;
  END LOOP;
  RETURN created_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_pkg_groups_for_packages() TO authenticated;

-- RPC 2: cleanup_pkg_groups
-- Soft-disables legacy groups, hard-deletes old orphans, deduplicates duplicates per package
CREATE OR REPLACE FUNCTION public.cleanup_pkg_groups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  disabled_count integer := 0;
  deleted_count integer := 0;
  merged_count integer := 0;
  p RECORD;
  keep_id uuid;
  dup_id uuid;
BEGIN
  -- 1) Soft-disable legacy groups with NULL package_id
  UPDATE public.pkg_groups
  SET is_active = false
  WHERE package_id IS NULL AND is_active = true;
  GET DIAGNOSTICS disabled_count = ROW_COUNT;

  -- 2) Hard-delete orphans: no package_id, already disabled, no members, older than 7 days
  DELETE FROM public.pkg_groups
  WHERE package_id IS NULL
    AND is_active = false
    AND created_at < now() - interval '7 days'
    AND id NOT IN (SELECT DISTINCT group_id FROM public.pkg_group_members);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- 3) Fill blank names for groups that have a package
  UPDATE public.pkg_groups g
  SET
    name = initcap(replace(sp.level, '_', ' ')) || ' — ' ||
      CASE sp.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        ELSE 'Unknown'
      END || ' ' || to_char(sp.start_time, 'HH12:MI AM'),
    capacity = COALESCE(g.capacity, sp.capacity)
  FROM public.schedule_packages sp
  WHERE g.package_id = sp.id
    AND (g.name IS NULL OR trim(g.name) = '');

  -- 4) Deduplicate: per package_id, keep group with most active members (then newest)
  FOR p IN
    SELECT package_id
    FROM public.pkg_groups
    WHERE is_active = true AND package_id IS NOT NULL
    GROUP BY package_id
    HAVING COUNT(*) > 1
  LOOP
    -- Pick the group to keep
    SELECT g.id INTO keep_id
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = p.package_id AND g.is_active = true
    GROUP BY g.id, g.created_at
    ORDER BY COUNT(m.user_id) DESC, g.created_at DESC
    LIMIT 1;

    -- Disable all other duplicates, migrating their members
    FOR dup_id IN
      SELECT id FROM public.pkg_groups
      WHERE package_id = p.package_id AND is_active = true AND id <> keep_id
    LOOP
      -- Move members to keep_id (skip if already exists there)
      UPDATE public.pkg_group_members
      SET group_id = keep_id
      WHERE group_id = dup_id
        AND user_id NOT IN (
          SELECT user_id FROM public.pkg_group_members WHERE group_id = keep_id
        );
      -- Delete any remaining member rows in the duplicate
      DELETE FROM public.pkg_group_members WHERE group_id = dup_id;
      -- Soft-disable the duplicate group
      UPDATE public.pkg_groups SET is_active = false WHERE id = dup_id;
      merged_count := merged_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'disabled', disabled_count,
    'deleted', deleted_count,
    'merged', merged_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_pkg_groups() TO authenticated;
