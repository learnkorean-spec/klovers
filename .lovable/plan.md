

## Problem

Nikki Both has a **private** plan enrollment (`plan_type = 'private'`), but the Group Matcher only fetches enrollments where `plan_type = 'group'` (line 104 of `GroupMatcher.tsx`). Additionally, her enrollment has **no level** and **no preferred day** set, so even if she appeared, she'd land in "Needs Review."

Her enrollment data:
- plan_type: `private`
- level: `null`
- preferred_day: `null`
- package_id: `null`
- payment_status: `PAID`, approval_status: `APPROVED`, matched_at: `null`

## Plan

### 1. Add "Unassigned Private Students" section to the Matcher

Extend `GroupMatcher.tsx` to also fetch unmatched **private** enrollments (approved + paid + no `matched_at`). Display them in a dedicated "Unassigned Private Students" card below the group clusters, since private students don't cluster into groups — they need individual slot assignment.

### 2. Show actionable info for each private student

Each row will display the student's name, email, level (or "Not set"), sessions, and amount. Include a link/button to jump to the Scheduling tab's private config or the Enrollment Checklist for manual assignment.

### 3. Surface missing data warnings

For private enrollments missing `level` or schedule preferences, show inline warnings (e.g., "Missing level — ask student to complete placement test") so the admin knows what action to take.

### Technical Details

- **File**: `src/components/admin/GroupMatcher.tsx`
  - Add a second query in `fetchUnmatched()` for `plan_type = 'private'`, same filters (approved, paid via status check, `matched_at` is null)
  - Store in separate state `privateUnmatched`
  - Render a new card section after group clusters showing these students with their enrollment details
  - Include a manual "Mark Assigned" button that sets `matched_at` and optionally `slot_id` on the enrollment

