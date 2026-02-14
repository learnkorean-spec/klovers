
# Update Scheduling UX: Show Alternative Slots Immediately

## Overview

Transform the current free-text schedule preferences into a structured slot-selection system. Students will pick from real available class slots (powered by existing `student_groups`), see live seat availability, and get alternative suggestions when their preferred slot is full. Admin gets notifications when students pick alternatives.

## What Changes

### 1. Database Changes

**Extend `student_groups` table** with scheduling fields:
- `schedule_day` (text) -- e.g., "Monday", "Wednesday"  
- `schedule_time` (text) -- e.g., "18:00"  
- `schedule_timezone` (text) -- e.g., "Africa/Cairo"  
- `level` (text) -- e.g., "beginner", "intermediate"  
- `course_type` (text) -- "group" or "private"  
- `capacity` (integer, default 10)  

**Create `student_schedule_preferences` table**:
- `id` uuid PK  
- `user_id` uuid (unique, for upsert)  
- `level` text  
- `group_id` uuid (references student_groups -- the final chosen slot)  
- `created_at` timestamp  
- `updated_at` timestamp  

RLS: users can manage their own row, admins can view/manage all.

**Create `admin_notifications` table**:
- `id` uuid PK  
- `message` text  
- `type` text (e.g., "alternative_slot", "waitlist")  
- `read` boolean default false  
- `related_user_id` uuid (nullable)  
- `related_group_id` uuid (nullable)  
- `created_at` timestamp  

RLS: admins only.

### 2. Availability Logic

A helper query computes seats left per group:

```text
seats_left = group.capacity - COUNT(batch_members where batch.course_id matches group)
```

Since `batch_members` links to batches (not groups directly), we'll count members by matching the group via group attendance or by adding a `group_id` reference. The simpler approach: count rows in `batch_members` whose batch references the same group, OR count distinct users in `group_attendance` for that group. We'll use a straightforward count of active batch members per group.

### 3. Updated Enrollment Step 2 (Schedule Picker)

Replace the current free-text day/time/timezone pickers with:

1. Fetch all `student_groups` matching the student's selected `course_type` (group/private)
2. For each group, compute `seats_left`
3. Display available slots as selectable cards showing:
   - Day, Time, Timezone
   - Level
   - Seats remaining badge
4. If the student clicks a full slot (seats_left = 0):
   - Show a modal/banner: "This slot is full. Choose an alternative."
   - Filter alternatives: same level, ordered by same timezone first, then closest time to 18:00, then earliest day
   - Show 3-6 options max with seats_left
5. On selection, save to `student_schedule_preferences` (upsert by user_id)
6. Show confirmation: "Selected slot: Monday 6pm Cairo -- Pending payment approval"

### 4. Admin Notification on Alternative Choice

When a student selects an alternative slot (different from their original click):
- Insert a row into `admin_notifications`:  
  `"User [name] chose alternative slot [group name]"`
- Admin Dashboard shows a notification indicator (bell icon or badge on a new Notifications section)

### 5. Admin Approval Enhancement

When admin approves an enrollment payment:
- Look up the student's `student_schedule_preferences.group_id`
- Attempt to assign to an available batch under that group
- If no capacity left at approval time:
  - Set `batch_members` status to `waitlist` (add `member_status` text column to `batch_members`, default 'active')
  - Insert admin notification: "Package full at approval time; needs reassignment"

### 6. Admin Notifications UI

Add a simple notifications panel to the Admin Dashboard:
- New tab or bell icon with unread count
- List of notifications with timestamp, message, and "Mark read" button
- Filter: unread / all

## Technical Details

### Files to Create
- `src/components/SchedulePicker.tsx` -- new slot selection component with availability + alternatives
- `src/components/admin/AdminNotifications.tsx` -- notification list component

### Files to Modify
- `src/pages/EnrollNowPage.tsx` -- replace Step 2 free-text fields with SchedulePicker component
- `src/pages/AdminDashboard.tsx` -- add notifications tab/indicator, update approval logic to assign group
- Database migration for all schema changes

### Availability Query (used in SchedulePicker)
```sql
SELECT sg.*, 
  sg.capacity - COALESCE(member_counts.cnt, 0) AS seats_left
FROM student_groups sg
LEFT JOIN (
  SELECT bm.batch_id, COUNT(*) as cnt 
  FROM batch_members bm 
  GROUP BY bm.batch_id
) member_counts ON member_counts.batch_id = sg.id
WHERE sg.course_type = $1
```

In practice this will be done via Supabase client queries joining the tables.

### Alternative Sorting Logic (frontend)
```text
1. Filter: same level, seats_left > 0
2. Sort priority:
   a. Same timezone first
   b. Closest schedule_time to "18:00"
   c. Earliest day (Monday=1 ... Sunday=7)
3. Take first 6 results
```
