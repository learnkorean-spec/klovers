

# Add Student to Group from Leads and Profiles

## What will change

A new "Add Student" button (person+ icon) will appear on each group card in the Groups tab. Clicking it opens a dialog where the admin can:

1. **Search** by name or email across both registered users (`profiles`) and leads
2. **See results** in a list with name, email, and source label (Registered / Lead)
3. **Click to add** a student to the group as an active `pkg_group_members` entry

## How it works

- **For registered users (profiles):** Inserts directly into `pkg_group_members` using the user's `user_id`
- **For leads (no user account yet):** Shows the lead info but disables the add button with a note "Not yet registered" -- since `pkg_group_members` requires a `user_id`, only registered users can be added
- Duplicate check: if the student is already in the group, show a "Already in group" label instead of the add button
- After adding, the group card refreshes automatically

## Technical changes

**File: `src/components/admin/SchedulingManager.tsx`**

1. Import `UserPlus, Search` from lucide-react
2. Add state for the "Add Student" dialog: `addStudentGroupId`, `studentSearch`, `searchResults`, `searchLoading`
3. Add `handleSearchStudents` function that queries both `profiles` and `leads` tables using ilike on name/email
4. Add `handleAddStudentToGroup` function that inserts into `pkg_group_members`
5. Add a `UserPlus` icon button next to the expand toggle on each group card
6. Add an "Add Student" dialog with search input and results list

**No database changes needed** -- uses existing `pkg_group_members`, `profiles`, and `leads` tables.

