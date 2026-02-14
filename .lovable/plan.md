

## Add Group Assignment Dropdown for Active Students

### What This Does
When a student is active (paid and approved), a "Group Name" dropdown will appear in the table and in the edit form, allowing you to assign students to named groups (e.g., "Group A - Beginners", "Group B - Intermediate"). This makes it easy to manage students by group or individually.

### How It Works

1. **New database column**: Add a `group_name` column to the `students` table to store the assigned group.

2. **New database table**: Create a `student_groups` table to hold the list of available group names that appear in the dropdown. You can manage these groups (add/remove) directly from the admin panel.

3. **Table view update**: For students with status "student" (active), a dropdown will appear in the table row allowing quick group assignment without opening the edit dialog.

4. **Edit form update**: The Add/Edit Student dialog will also include a Group Name dropdown (visible when status is "student").

5. **Filter by group**: A new filter option will be added to the toolbar so you can view all students in a specific group at once.

---

### Technical Details

**Database migration:**
- Add `group_name TEXT DEFAULT ''` column to `students` table
- Create `student_groups` table with columns: `id UUID`, `name TEXT UNIQUE`, `created_at TIMESTAMP`
- RLS: admin-only management, public read for authenticated users

**StudentManager.tsx changes:**
- Fetch available groups from `student_groups` on load
- Add inline `Select` dropdown in the table for active students in the "Package" or a new "Group" column
- On dropdown change, update `students.group_name` directly via Supabase
- Add group name dropdown to the Add/Edit dialog form
- Add group filter to the toolbar alongside the status filter
- Add a small "Manage Groups" button to create/delete group names

