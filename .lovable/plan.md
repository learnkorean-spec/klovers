

# Enhance Admin Attendance Panel: Unified View with All Sources

## Problem
The `AdminAttendancePanel` currently only queries `admin_attendance_log`, which is empty for students like Renad whose sessions are tracked via the group attendance system (`pkg_attendance` + `pkg_group_sessions`). The panel shows "No attendance records yet" despite 11 recorded sessions. Admins need a unified view of ALL attendance data plus editable details.

## Solution
Upgrade `AdminAttendancePanel` to pull records from all three attendance sources and display comprehensive student details with inline editing capabilities.

## Technical Details

### File: `src/components/admin/AdminAttendancePanel.tsx`

**1. Fetch from all attendance sources:**
- `admin_attendance_log` (individual admin-logged sessions) -- existing
- `pkg_attendance` joined with `pkg_group_sessions` (group attendance) -- NEW
- `attendance_requests` with status APPROVED (student self-reported) -- NEW

Merge all into a unified list with a `source` label ("Admin Log", "Group Session", "Self-Reported").

**2. Add a details/stats section** at the top showing:
- Plan type and duration (from enrollment)
- Total sessions included vs attended
- Sessions remaining
- Amount paid and amount due
- Payment status and currency
- Group name (from `pkg_groups`/`pkg_group_members`)

Fetch this from the `enrollments` table and `pkg_group_members` + `pkg_groups`.

**3. Unified calendar highlighting:**
- Show all attended dates from all sources on the calendar (currently only shows `admin_attendance_log` dates)
- Use different colors/modifiers for different sources (e.g., primary for group sessions, secondary for admin-logged)

**4. Editable fields:**
- Keep the existing add/remove attendance via `admin_add_attendance` / `admin_remove_attendance` RPCs
- Add inline edit for `sessions_remaining` (direct update to enrollments table) so admin can correct the balance
- Add inline edit for `unit_price` so admin can adjust pricing

**5. Record list improvements:**
- Show source badge on each record (Group Session / Admin Log / Self-Reported)
- Show group name for group sessions
- Only allow deletion of `admin_attendance_log` records (group sessions are managed via the Groups hub)

### Data Flow

```text
AdminAttendancePanel
  |
  |-- Fetch enrollment details (plan, amount, currency, etc.)
  |-- Fetch pkg_attendance + pkg_group_sessions (group sessions)
  |-- Fetch admin_attendance_log (admin manual logs)
  |-- Fetch attendance_requests WHERE status='APPROVED' (self-reported)
  |-- Fetch pkg_group_members + pkg_groups (group assignment)
  |
  |-- Merge all into unified records list
  |-- Render calendar with all dates highlighted
  |-- Render detail cards (plan info, financials)
  |-- Render editable fields (sessions_remaining, unit_price)
  |-- Render unified session history with source badges
```

### No database changes required
All the data already exists in the database -- this is purely a frontend change to the `AdminAttendancePanel` component.

