

## Fix: Student Dashboard Enrollment-Aware Logic

Update `src/pages/StudentDashboard.tsx` to fetch the user's latest enrollment and conditionally render sections based on enrollment state.

### Changes

**1. Add enrollment state**

Fetch the latest enrollment for the logged-in user during the `load` effect:

```
SELECT approval_status, payment_status, sessions_remaining, sessions_total, plan_type, matched_batch_id
FROM enrollments
WHERE user_id = session.user.id
ORDER BY created_at DESC
LIMIT 1
```

Store in a new `Enrollment | null` state.

**2. Replace "Credits remaining" with "Sessions remaining"**

The top summary card currently shows `profile.credits` labeled "Credits remaining". Change it to show `enrollment.sessions_remaining` labeled "Sessions remaining". If no enrollment, show 0.

**3. Conditional rendering logic**

Derive a helper:
- `isActive` = enrollment exists AND `approval_status === 'APPROVED'` AND `payment_status === 'PAID'` AND `sessions_remaining > 0`
- `isPending` = enrollment exists AND (`approval_status === 'PENDING'` OR `payment_status !== 'PAID'`)

Then:

- **No enrollment at all**: Hide attendance section entirely. Show a "No Active Plan" card with title, message ("You don't have an active plan yet. Enroll to start your classes."), and an "Enroll Now" button linking to `/enroll-now`.

- **Enrollment exists but pending/unpaid**: Hide attendance section. Show an info card: "Your enrollment is pending approval."

- **Active enrollment (isActive)**: Show the Request Attendance section and Attendance History as they are now. If `plan_type === 'GROUP'` and `matched_batch_id` is null, also show a note: "Awaiting batch assignment."

**4. Update status display**

Use enrollment data for status instead of profile credits:
- If `isActive`: show "ACTIVE"
- If `isPending`: show "PENDING"
- If enrollment exists but `sessions_remaining <= 0`: show "OVERDUE"
- No enrollment: show "NEW"

**5. Safe null handling**

All enrollment reads use optional chaining (`enrollment?.sessions_remaining ?? 0`). No errors if enrollment is null.

### Technical Summary

Only one file changes: `src/pages/StudentDashboard.tsx`. No database or backend changes needed -- just reading from the existing `enrollments` table which already has RLS allowing users to view their own enrollments.
