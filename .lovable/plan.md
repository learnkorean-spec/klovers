
# Merge Attendance and Groups into One Unified Tab

## Problem
Currently there are two separate tabs doing similar work:
- **Attendance tab**: Individual student attendance logging via `admin_attendance_log` + student-initiated requests
- **Groups tab**: Group-based session attendance via `group_sessions`/`group_attendance` + group management

These operate on different database tables, aren't connected, and create confusion.

## Solution
Merge everything into a single **"Groups"** tab that contains three sub-tabs:

1. **Attendance** -- The existing GroupAttendanceManager attendance view (select group, create session, mark attendance with avatar grid)
2. **Log Attendance** -- The individual student attendance panel (student picker + AdminAttendancePanel calendar) merged with student-initiated requests below it
3. **Manage Groups** -- The existing group management sub-tab (already inside GroupAttendanceManager)

## Changes

### 1. AdminDashboard.tsx
- Remove the standalone "Attendance" tab trigger and its `TabsContent`
- Move the "Log Attendance" card + AdminAttendancePanel + student requests content into the Groups tab
- The Groups `TabsContent` will render a unified component with three sub-tabs instead of just `GroupAttendanceManager`

### 2. GroupAttendanceManager.tsx
- Add a third sub-tab called "Log Attendance" alongside "Attendance" and "Manage Groups"
- Accept new props: `overviewRows`, `selectedStudentId`, `onStudentSelect`, `attendanceReqs`, student request action handlers, and `onUpdated` callback
- Embed the student picker + `AdminAttendancePanel` + student requests list inside this new sub-tab

### Technical Details
- The `GroupAttendanceManager` component will receive the necessary data and callbacks as props from `AdminDashboard`
- No database changes required -- this is purely a UI reorganization
- The attendance request approve/reject/revert handlers remain in `AdminDashboard` and are passed down as props
- The pending attendance badge count moves to the Groups tab trigger
