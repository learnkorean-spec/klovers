

## Gate Attendance Calendar Behind Paid Enrollment

### Problem
Currently, the attendance calendar renders for any logged-in student -- even those who haven't paid or don't have an active enrollment. This is confusing and should be locked.

### Changes

**File: `src/components/StudentAttendanceRequest.tsx`**

1. **Add enrollment eligibility check on mount**
   - Fetch the user's latest enrollment and check: `approval_status = 'APPROVED'` AND `payment_status = 'PAID'` AND `sessions_remaining > 0`
   - Store an `unlocked` boolean in state (default `false`)

2. **Show a skeleton/loader while checking**
   - Replace the current `if (loading) return null` with a small Skeleton placeholder inside a Card

3. **Render a "Locked" card when not eligible**
   - Title: "Attendance is available after payment"
   - Description: "Complete enrollment and payment to unlock attendance tracking."
   - Primary button: "Enroll Now" linking to `/enroll-now`
   - No calendar, no date picker, no history list

4. **Re-check before submitting a date (safety guard)**
   - In `handleDateSelect`, re-fetch the enrollment status before inserting
   - If no longer eligible, show a toast: "You need an active paid enrollment" and block the insert

### Technical Details

- Uses existing `supabase` client and UI components (Card, Button, Skeleton, toast)
- One additional query on mount (already querying enrollments, just expanding the SELECT)
- No database or schema changes needed
- Matches existing styling patterns in the dashboard

