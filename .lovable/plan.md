

## Group Matching System After Enrollment Approval

### Overview
Build an automatic group-matching system that detects when 3+ approved students share similar schedule preferences (same preferred days and start urgency like "ASAP" or "Next week"), then alerts you so you can create a group for them.

### Current Gap
The enrollment form collects schedule preferences (preferred days, time window, start option, timezone), but:
- The Egypt payment flow does NOT save these preferences to the enrollment record
- The manual enrollment flow also skips them
- No matching logic exists after approval

### What Will Change

**1. Save Schedule Preferences on All Enrollment Paths**
- Update the Egypt order flow (`create_egypt_order` RPC or the frontend after order creation) to save `preferred_days`, `preferred_time`, `preferred_start`, and `timezone` to the enrollment record
- Update the manual enrollment RPC similarly
- Ensure the Stripe webhook path (already saving these) continues working

**2. Group Matching Logic (Admin Dashboard)**
After you approve an enrollment, the system will:
- Query all approved enrollments (`approval_status = 'APPROVED'`, `plan_type = 'group'`) that are NOT yet assigned to a group (`matched_batch_id IS NULL`)
- Group them by overlapping `preferred_days` and matching `preferred_start`
- When a cluster of 3+ students is found, create an admin notification: "3 students match for [Monday/Wednesday] [ASAP] -- ready to create a group"

**3. New Admin Panel: "Group Matcher"**
A new section or card on the Admin Dashboard showing:
- Clusters of unmatched students grouped by schedule similarity
- Each cluster shows: student names, preferred days, time window, start preference, timezone
- A "Create Group" button per cluster that creates a `student_groups` entry and assigns members via `batch_members`

### Technical Details

**Database Migration:**
- No new tables needed -- uses existing `enrollments` columns (`preferred_days`, `preferred_time`, `preferred_start`, `timezone`, `matched_batch_id`, `matched_at`)

**Frontend Changes:**
- `src/pages/EnrollNowPage.tsx` -- After Egypt order creation, update the enrollment with schedule preferences
- `src/pages/AdminDashboard.tsx` -- Add matching logic in `handleEnrollmentAction` (on APPROVED) that checks for clusters and creates notifications
- New component `src/components/admin/GroupMatcher.tsx` -- Displays unmatched student clusters with "Create Group" action

**Matching Algorithm:**
```text
For each unmatched approved group enrollment:
  1. Extract preferred_days (e.g. ["Monday", "Wednesday"])
  2. Extract preferred_start (e.g. "ASAP")
  3. Find other unmatched enrollments sharing at least 1 day AND same start preference
  4. If cluster size >= 3, flag as "ready"
```

**Notification on Approval:**
When admin approves and a match of 3+ is found, an `admin_notifications` entry is created:
- Type: `group_match_ready`
- Message: "3 students ready for a group: [Days] / [Start Preference]"

**Admin Group Matcher Panel:**
- Shows clusters as cards with student details
- "Create Group" button: creates a `student_groups` record with the matched day/time, then inserts `batch_members` for each student, and updates `matched_batch_id` + `matched_at` on their enrollments

### Files to Create/Modify
- **Create**: `src/components/admin/GroupMatcher.tsx`
- **Modify**: `src/pages/EnrollNowPage.tsx` (save preferences on Egypt flow)
- **Modify**: `src/pages/AdminDashboard.tsx` (add matching check on approval, add GroupMatcher tab)
- **Modify**: `supabase/functions/create_egypt_order` or frontend post-order update (save schedule prefs)

