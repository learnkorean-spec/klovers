
# Plan: Student Attendance Editing + Backend Fix

## Overview
Enable students to cancel their own PENDING attendance requests, and fix backend issues in the attendance system including RLS gaps and data consistency.

## Changes

### 1. Database: Allow Students to Delete PENDING Requests
- Add an RLS DELETE policy on `attendance_requests` so students can delete their own records, but only when status is still `PENDING`
- Policy: `auth.uid() = user_id AND status = 'PENDING'`

### 2. Student Dashboard: Add Cancel Button on Pending Requests
In `src/components/StudentAttendanceRequest.tsx`:
- Add a cancel/delete button (trash icon or "Cancel" button) next to each PENDING attendance request in the Attendance History list
- When clicked, show a confirmation dialog, then delete the row from `attendance_requests`
- Refresh the list after deletion
- Only show the button for PENDING status requests (not APPROVED or REJECTED)

### 3. Admin Attendance Tab Backend Fix
In `src/pages/AdminDashboard.tsx`:
- The attendance tab currently enriches requests with profile data from the overview map, but `credits` is hardcoded to `0` -- update to use `sessions_remaining` from the overview record
- After approve/reject, the `fetchAll()` call already refreshes data; verify this chain works properly

### 4. Fix Console Warning in StudentManager
- The console shows a warning about `AlertDialog` receiving refs on function components -- wrap the triggering element properly with `asChild`

## Technical Details

### SQL Migration
```sql
-- Allow students to delete their own PENDING attendance requests
CREATE POLICY "Users can delete own pending attendance"
  ON public.attendance_requests
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'PENDING');
```

### Frontend Changes (StudentAttendanceRequest.tsx)
- Import `Trash2` icon and `AlertDialog` components
- Add a delete handler that calls `supabase.from("attendance_requests").delete().eq("id", requestId)`
- Add cancel button with confirmation dialog next to each PENDING request row
- Refresh data after successful deletion

### Files Modified
1. **New migration** -- RLS policy for DELETE on `attendance_requests`
2. **`src/components/StudentAttendanceRequest.tsx`** -- Add cancel button for PENDING requests
3. **`src/pages/AdminDashboard.tsx`** -- Fix credits display in attendance tab to use overview data
4. **`src/components/admin/StudentManager.tsx`** -- Fix AlertDialog ref warning
