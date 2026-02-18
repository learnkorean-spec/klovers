
## Admin Groups: Sync from schedule_packages + Clean Duplicates + Fill Blanks

### Current State Analysis

**`SchedulingManager.tsx` — GroupsManager**
- Queries `pkg_groups` filtered by a single `package_id` selected by the admin via dropdown
- Displays name and capacity — no level/schedule info shown (sourced from the package, not re-joined)
- No "Sync" or "Clean" operation exists
- The `handleAddGroup` in `PackagesManager` (just added) inserts a group but doesn't check for duplicates

**`pkg_groups` table columns**: `id`, `package_id`, `name`, `capacity`, `created_at`
- No `is_active` column exists — cleanup must soft-delete differently or we must use hard deletes for orphans

**Key constraint**: `pkg_groups` has no `is_active` column. The cleanup RPC must either hard-delete or we add a migration to add it.

---

### Migration Required

**Add `is_active` to `pkg_groups`** (needed for soft-disable of legacy/duplicate groups):
```sql
ALTER TABLE public.pkg_groups ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
```

---

### Two Database RPCs

#### RPC 1: `ensure_pkg_groups_for_packages()`

For every active `schedule_package` that has zero associated `pkg_groups`, insert one default group with auto-generated name.

```sql
CREATE OR REPLACE FUNCTION public.ensure_pkg_groups_for_packages()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  p RECORD;
  created_count integer := 0;
  day_name text;
  time_label text;
  group_name text;
BEGIN
  FOR p IN SELECT * FROM public.schedule_packages WHERE is_active = true LOOP
    IF NOT EXISTS (SELECT 1 FROM public.pkg_groups WHERE package_id = p.id AND is_active = true) THEN
      day_name := CASE p.day_of_week
        WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday' END;
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
```

#### RPC 2: `cleanup_pkg_groups()`

Returns a JSON object with counts. Does:
1. Soft-disable (set `is_active = false`) groups with no `package_id`
2. Hard-delete orphan groups with no `package_id` AND no members AND older than 7 days
3. For packages with multiple active groups: keep the one with the most active members (or newest), move members to it, disable the rest

```sql
CREATE OR REPLACE FUNCTION public.cleanup_pkg_groups()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  disabled_count integer := 0;
  deleted_count integer := 0;
  merged_count integer := 0;
  p RECORD;
  keep_id uuid;
  dup_id uuid;
BEGIN
  -- 1) Disable legacy groups with NULL package_id
  UPDATE public.pkg_groups SET is_active = false
  WHERE package_id IS NULL AND is_active = true;
  GET DIAGNOSTICS disabled_count = ROW_COUNT;

  -- 2) Hard-delete if no members AND older than 7 days AND no package_id
  DELETE FROM public.pkg_groups
  WHERE package_id IS NULL
    AND is_active = false
    AND created_at < now() - interval '7 days'
    AND id NOT IN (SELECT DISTINCT group_id FROM public.pkg_group_members);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- 3) Fix blank names for groups that have a package
  UPDATE public.pkg_groups g
  SET name = initcap(replace(p.level,'_',' ')) || ' — ' ||
    CASE p.day_of_week
      WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
      WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
      WHEN 6 THEN 'Saturday' END || ' ' || to_char(p.start_time, 'HH12:MI AM'),
    capacity = COALESCE(g.capacity, p.capacity)
  FROM public.schedule_packages p
  WHERE g.package_id = p.id AND (g.name IS NULL OR trim(g.name) = '');

  -- 4) Deduplicate: per package_id, keep group with most active members
  FOR p IN
    SELECT package_id FROM public.pkg_groups WHERE is_active = true AND package_id IS NOT NULL
    GROUP BY package_id HAVING COUNT(*) > 1
  LOOP
    -- Pick the group to keep (most active members, then newest)
    SELECT g.id INTO keep_id
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = p.package_id AND g.is_active = true
    GROUP BY g.id, g.created_at
    ORDER BY COUNT(m.user_id) DESC, g.created_at DESC
    LIMIT 1;

    -- Move members from duplicate groups to keep_id
    FOR dup_id IN
      SELECT id FROM public.pkg_groups
      WHERE package_id = p.package_id AND is_active = true AND id <> keep_id
    LOOP
      -- Move members (skip conflicts)
      UPDATE public.pkg_group_members
      SET group_id = keep_id
      WHERE group_id = dup_id
        AND user_id NOT IN (SELECT user_id FROM public.pkg_group_members WHERE group_id = keep_id);
      -- Delete any remaining duplicates
      DELETE FROM public.pkg_group_members WHERE group_id = dup_id;
      -- Disable the duplicate group
      UPDATE public.pkg_groups SET is_active = false WHERE id = dup_id;
      merged_count := merged_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('disabled', disabled_count, 'deleted', deleted_count, 'merged', merged_count);
END;
$$;
```

---

### UI Changes — `GroupsManager` in `SchedulingManager.tsx`

#### A) "Sync + Clean Groups" button

Add a `handleSyncAndClean` async function:

```typescript
const handleSyncAndClean = async () => {
  setSyncing(true);
  const { data: cleanResult } = await supabase.rpc("cleanup_pkg_groups");
  const { data: created } = await supabase.rpc("ensure_pkg_groups_for_packages");
  toast({
    title: "Sync complete",
    description: `Disabled ${cleanResult?.disabled ?? 0} legacy groups, merged ${cleanResult?.merged ?? 0} duplicates, created ${created ?? 0} missing groups.`,
  });
  setSyncing(false);
  if (selectedPkg) fetchGroups(selectedPkg);
};
```

Button placed in the top toolbar next to "New Group":
```tsx
<Button variant="outline" size="sm" onClick={handleSyncAndClean} disabled={syncing}>
  <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
  Sync + Clean Groups
</Button>
```

#### B) Groups list — enrich with package info (fill blanks)

Update `fetchGroups` to also fetch the linked package data by joining through the `package_id`:

```typescript
const fetchGroups = async (pkgId: string) => {
  // ...existing fetch...
  // Also get the package details to populate level/schedule display
  const pkg = packages.find((p) => p.id === pkgId);
  // Enrich each group with pkg data for display
};
```

Since groups are always filtered by the selected package in `GroupsManager`, the package info is already in the `packages` state (the dropdown list). We simply look it up and pass it down to the card display.

Update the group card to show:
- Level badge from `pkg.level` (pretty formatted)
- Schedule: `DAY_NAMES[pkg.day_of_week] + " " + formatTime(pkg.start_time)`
- Capacity: `g.capacity` (inherited from package at creation)

```tsx
{selectedPkg && (() => {
  const pkg = packages.find(p => p.id === selectedPkg);
  return pkg ? (
    <div className="flex gap-2 mb-3 text-sm text-muted-foreground">
      <Badge variant="outline">{pkg.level.replace("_", " ")}</Badge>
      <span>{DAY_NAMES[pkg.day_of_week]} · {formatTime(pkg.start_time)}</span>
      <span>{pkg.timezone}</span>
    </div>
  ) : null;
})()}
```

---

### Files to Change

1. **SQL Migration** — New file:
   - `ALTER TABLE pkg_groups ADD COLUMN is_active boolean NOT NULL DEFAULT true;`
   - Create RPC `ensure_pkg_groups_for_packages()`
   - Create RPC `cleanup_pkg_groups()`
   - Grant execute to `authenticated` role

2. **`src/components/admin/SchedulingManager.tsx`** — `GroupsManager` section only:
   - Add `syncing` state
   - Add `handleSyncAndClean` function that calls both RPCs
   - Add "Sync + Clean Groups" button in the toolbar
   - Show selected package's level/schedule as a display header above the groups list (eliminates blank "—" fields)
   - Update `fetchGroups` to only show `is_active = true` groups

### Edge Cases

| Scenario | Behavior |
|---|---|
| Package has no groups yet | `ensure_pkg_groups_for_packages` creates exactly one default group |
| Package has 2+ duplicate active groups with members | `cleanup_pkg_groups` keeps the group with most members, migrates others, disables duplicates |
| Group name is blank but has a package | `cleanup_pkg_groups` auto-fills the name from package data |
| Legacy group with no `package_id` and members < 7 days old | Disabled (soft) — not deleted; admin can review |
| Legacy group with no `package_id`, no members, > 7 days old | Hard deleted |
