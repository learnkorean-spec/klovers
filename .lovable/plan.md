

# Plan: Enable Manual Student Data Entry with Attendance Dates

## What This Does
Enhances the existing "Legacy Manual" tab in the admin Manage Students section so you can:
- Add/edit students with their full info (already works)
- Input individual attendance dates for each student (new feature)
- See all attendance dates listed per student
- Automatically calculate remaining sessions and amount due from the actual attendance records

## Current Limitation
Right now, the "Mark Attendance" button on each student just adds +1 to a counter without recording which date was attended. There's no way to enter historical dates or see which specific days a student attended.

## Changes

### 1. Add an Attendance Dates Panel for Legacy Students
When the admin clicks a student row (or a new "Dates" button), a side panel opens showing:
- A calendar to pick and add attendance dates
- A list of all recorded attendance dates with delete option
- Auto-calculated stats: total attended, remaining, extra sessions, amount due

### 2. Use the Existing `attendance_log` Table for Date Records
The `attendance_log` table already stores `student_id`, `marked_at`, and `notes`. We will use this to store individual session dates for legacy students, adding a `session_date` column so admins can backdate entries.

### 3. Update Legacy Student Display
- Replace the simple "Used/Total" counter with a count derived from actual attendance log records
- Show remaining and extra sessions with amount due calculation
- Keep the existing Add/Edit form for student info

## Technical Details

### Database Migration
Add a `session_date` column to `attendance_log` so admins can record specific dates (not just "marked now"):

```sql
ALTER TABLE public.attendance_log
  ADD COLUMN IF NOT EXISTS session_date date DEFAULT CURRENT_DATE;

-- Add unique constraint to prevent duplicate dates per student
ALTER TABLE public.attendance_log
  ADD CONSTRAINT unique_student_session_date UNIQUE (student_id, session_date);
```

### New Component: `LegacyAttendancePanel`
A panel similar to `AdminAttendancePanel` but for legacy `students` table entries:
- Calendar with date picker
- Insert into `attendance_log` with `student_id` and chosen `session_date`
- Delete attendance records
- Show computed stats:
  - `total_attended = count of attendance_log records`
  - `remaining = total_classes - total_attended`
  - `extra = remaining < 0 ? abs(remaining) : 0`
  - `amount_due = extra * price_per_class`

### Update `StudentManager.tsx`
- Add a "Dates" button to each legacy student row
- When clicked, show the `LegacyAttendancePanel` inline or as a dialog
- Sync `used_classes` on the `students` table whenever attendance dates are added/removed (keeps the counter accurate)

### Files to Create/Modify
1. **New migration** -- Add `session_date` column and unique constraint to `attendance_log`
2. **New component**: `src/components/admin/LegacyAttendancePanel.tsx` -- Calendar-based attendance date entry for legacy students
3. **Modified**: `src/components/admin/StudentManager.tsx` -- Add "Dates" button and integrate the attendance panel
