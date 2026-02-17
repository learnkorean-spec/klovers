
# Automated Student Matching System

## Overview
Rebuild the scheduling and group matching system with priority-based slot selection, automated student assignment, and dynamic admin slot management. Students will pick 3 ranked preferred slots during enrollment, and the system will automatically assign them to the best-fit slot based on fill rates.

---

## What Changes

### 1. Database: New and Modified Tables

**New `matching_slots` table** (replaces reliance on `student_groups` for scheduling):
- `id`, `course_level` (e.g., "Beginner 1", "Beginner 2"), `day`, `time`, `timezone` (default Egypt GMT+2)
- `min_students` (default 3), `max_students` (default 7), `current_count` (default 0)
- `status` (open / confirmed / full), `created_at`

**New `student_slot_preferences` table:**
- `id`, `user_id`, `enrollment_id`
- `slot_1_id`, `slot_2_id`, `slot_3_id` (3 ranked slot references)
- `assigned_slot_id` (nullable -- filled after matching)
- `match_status` (pending / matched / confirmed)
- `created_at`

**Seed default slots:**
- Friday 11:00 AM, Friday 1:00 PM, Monday 6:00 PM, Thursday 6:00 PM (all Africa/Cairo, each course level)

### 2. Database: Matching Logic (Trigger + Function)

**`auto_match_student()` function** -- called after a student saves their 3 preferences:
1. Check slot_1, slot_2, slot_3 in order
2. For each, verify same `course_level` as student's `selected_level` and `status != 'full'`
3. Assign to the slot closest to reaching `min_students` (best-fit = highest `current_count` that's still below `max_students`)
4. Increment `current_count` on the assigned slot
5. Set `assigned_slot_id` and `match_status = 'matched'`

**`update_slot_status()` trigger** on `matching_slots` after `current_count` changes:
- If `current_count >= min_students` and status is `open` -> set `status = 'confirmed'`, update all students in that slot to `match_status = 'confirmed'`, insert `admin_notifications` entry
- If `current_count >= max_students` -> set `status = 'full'`

**Email trigger:** When a slot becomes `confirmed`, invoke `send-confirmation-email` edge function for all students in that slot with their final schedule.

### 3. Enrollment Flow Update (Step 2)

Replace the current single-slot `SchedulePicker` with a new **`SlotRanker`** component:
- Fetch all `matching_slots` where `status != 'full'` and `course_level` matches the student's selected level
- Display each slot as a card: Day, Time, Timezone, seats remaining, status badge
- Student drags or clicks to rank their top 3 choices (numbered 1, 2, 3)
- On "Confirm Preferences," save to `student_slot_preferences` and trigger `auto_match_student()`
- Show confirmation: "You've been assigned to [Day] [Time]" or "Pending -- we'll notify you when your group forms"

### 4. Admin Panel: Slot Management

New **"Slots"** tab in Admin Dashboard:
- Table of all `matching_slots` with inline editing (day, time, timezone, level, min/max capacity)
- Add/remove slots dynamically
- Status badges (open/confirmed/full) with counts
- Click a slot to see assigned students
- Override buttons: manually assign/reassign a student, change slot status
- "Almost full" indicator when `current_count = max_students - 1`
- Suggested optimal distribution view: show which slots need more students to reach minimum

### 5. Notifications

- **Student notifications:** Email when slot is confirmed (group formed), email when slot is almost full ("1 seat left!")
- **Admin notifications:** `admin_notifications` entry when a slot reaches `confirmed`, when a slot becomes `full`, and suggested distribution alerts

### 6. RLS Policies

- `matching_slots`: anyone authenticated can SELECT; admins can ALL
- `student_slot_preferences`: users can SELECT/INSERT/UPDATE own records; admins can ALL

---

## Migration Path

The existing `student_groups`, `batch_members`, `student_schedule_preferences`, and `GroupMatcher` component will remain intact for current students. The new system runs in parallel. Once all students are migrated, the old tables can be deprecated.

---

## Technical Details

### Database Migration SQL

```text
-- matching_slots table
CREATE TABLE public.matching_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_level TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
  min_students INTEGER NOT NULL DEFAULT 3,
  max_students INTEGER NOT NULL DEFAULT 7,
  current_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','confirmed','full')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- student_slot_preferences table
CREATE TABLE public.student_slot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID,
  selected_level TEXT NOT NULL DEFAULT '',
  slot_1_id UUID REFERENCES public.matching_slots(id),
  slot_2_id UUID REFERENCES public.matching_slots(id),
  slot_3_id UUID REFERENCES public.matching_slots(id),
  assigned_slot_id UUID REFERENCES public.matching_slots(id),
  match_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending','matched','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.matching_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_slot_preferences ENABLE ROW LEVEL SECURITY;

-- Policies ...
-- auto_match_student() function ...
-- update_slot_status() trigger ...
-- Seed 4 default slots per level ...
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/xxx.sql` | New tables, functions, triggers, seed data |
| `src/components/SlotRanker.tsx` | **New** -- 3-pick slot selection UI |
| `src/pages/EnrollNowPage.tsx` | Replace `SchedulePicker` with `SlotRanker` in Step 2 |
| `src/components/admin/SlotManager.tsx` | **New** -- admin CRUD for slots |
| `src/pages/AdminDashboard.tsx` | Add "Slots" tab with `SlotManager` |
| `src/components/SchedulePicker.tsx` | Keep for backward compatibility, no changes |
| `supabase/functions/send-confirmation-email/index.ts` | Add `slot_confirmed` template |

### Matching Algorithm (in DB function)

```text
1. Get student's 3 preferred slot IDs + selected_level
2. Filter to slots matching level AND status != 'full'
3. Among valid slots, pick the one with highest current_count
   (closest to forming a group)
4. If no valid slot found, leave as 'pending'
5. Otherwise: increment slot.current_count, set assigned_slot_id
6. Trigger checks: if count >= min -> confirm, if count >= max -> full
```
