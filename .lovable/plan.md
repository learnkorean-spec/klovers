

## Fix: Make Attendance Calendar Clickable for All Students

### Problem
The calendar is locked because the code requires an enrollment with `approval_status = 'APPROVED'` AND `payment_status = 'PAID'`. If the student doesn't have a fully approved+paid enrollment, the calendar becomes completely disabled.

### Solution
Remove the strict enrollment filter so any student can tap dates to log their class attendance. If they have any enrollment at all (regardless of status), use it. If they have none, allow them to submit without an enrollment link.

### Changes

**1. `src/components/StudentAttendanceRequest.tsx`**
- Remove the `.eq("approval_status", "APPROVED")` and `.eq("payment_status", "PAID")` filters when fetching enrollments
- Use the most recent enrollment (any status) as the link
- If no enrollment exists at all, still allow date tapping by making `enrollmentId` optional
- Update the insert logic to handle cases with or without an enrollment
- Update the RLS insert policy note: the current RLS policy on `attendance_requests` requires an approved+paid enrollment with remaining sessions -- this must also be relaxed

**2. Database Migration (RLS Policy Update)**
- Update the `attendance_requests` INSERT policy to allow any authenticated user to insert their own attendance requests, not just those with approved/paid enrollments
- New policy: user can insert if `auth.uid() = user_id` and they have any enrollment linked

### Technical Details

```sql
-- Drop the restrictive INSERT policy
DROP POLICY "Active enrollment insert attendance" ON public.attendance_requests;

-- Create a relaxed policy: any authenticated user can insert their own requests
CREATE POLICY "Users can insert own attendance"
  ON public.attendance_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = attendance_requests.enrollment_id
      AND e.user_id = auth.uid()
    )
  );
```

```typescript
// Fetch any enrollment, not just approved+paid
const { data: enrollments } = await supabase
  .from("enrollments")
  .select("id")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(1);
```

This will make the calendar immediately interactive for any student who has started an enrollment, regardless of payment or approval status.

