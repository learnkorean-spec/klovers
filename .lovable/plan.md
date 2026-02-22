

# Improve Groups Tab: Flat View with Students and Editable Names

## Problem
The current Groups tab requires selecting a package first before seeing any groups. The user wants a flat, comprehensive view of ALL groups with their students visible, auto-linked from the matcher, with admin-editable names.

## Changes to `src/components/admin/SchedulingManager.tsx` (GroupsManager section)

### 1. Remove package-selection gate -- show all active groups at once
- Fetch all active `pkg_groups` joined with their parent `schedule_packages` info (level, day, time, type)
- Display in a single flat list/table, no need to pick a package first

### 2. Enhanced group cards showing:
- **Group Name** (editable inline with a pencil icon -- clicking opens an input to rename and save)
- **Level** badge (from parent `schedule_packages.level`)
- **Type** badge (group/private from parent `schedule_packages.course_type`)
- **Day and Time** (from parent package)
- **Student count** (e.g., "3/5 active, 1 waitlisted")
- **Student roster** shown expanded by default or with a single click:
  - Each student: name, email, status badge (active/waitlist)
  - Remove button per student

### 3. Auto-linking
- Groups are already auto-created by the `assign_student_to_group_from_slot` RPC and `ensure_pkg_groups_for_packages` RPC -- no change needed there
- The view simply reads from `pkg_groups` + `pkg_group_members` + `profiles`

### 4. Sync + Clean button remains
- Keeps the existing RPCs for maintenance

### 5. Add Group button
- Still available, creates a group under a selected package (admin picks package from dropdown in the dialog)

## Technical Details

**Data fetching strategy (single load):**
1. Fetch all `pkg_groups` where `is_active = true`, with parent package info
2. Fetch all `pkg_group_members` for those group IDs
3. Fetch `profiles` for all member user_ids
4. Combine into a rich view

**Inline name editing:**
- Pencil icon next to group name toggles an input field
- On blur or Enter, calls `supabase.from("pkg_groups").update({ name }).eq("id", groupId)`

**Files to modify:**
- `src/components/admin/SchedulingManager.tsx` -- rewrite `GroupsManager` component

**No database changes needed.**

