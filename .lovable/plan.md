
## Problem Analysis

The current system has a fundamental design mismatch:

1. **`schedule_options` stores day+time together** in the label (e.g. "Monday (6pm–7pm)") — but the database `matching_slots` table stores `day` and `time` as separate columns (e.g. day: "Monday", time: "18:00").
2. **The `update_student_preferences` RPC** validates that preferred days are one of the 7 pure weekday names (`Monday`…`Sunday`). So saving "Sunday (6pm–7pm)" causes the **"Invalid day"** error seen in the screenshot.
3. **The checklist engine** compares `preferred_days` (which would contain the full label) against `slot.day` (which is just "Sunday") — they never match, triggering a false "Day mismatch" warning.
4. **The user's need**: 4 available class slots (each a day+time pair), and each Korean level gets **2 configurable slots** assigned by the admin. Students pick up to 2 of those slots.

---

## Solution Design

The fix has two layers:

### Layer 1 — Fix the `schedule_options` weekday labels (Data Integrity)
The existing weekday labels in `schedule_options` must store only the **day name** (e.g. "Friday", "Monday") — the time is a separate concern that belongs to the `matching_slots` table. The admin configures which days are available through `schedule_options`, and which times through `matching_slots`.

**Database fix**: Update the 4 existing weekday entries to clean day names:
- `"Friday ( 2pm–3pm)"` → `"Friday"`
- `"Monday (6pm–7pm)"` → `"Monday"`
- `"Thursday (6pm–7pm)"` → `"Thursday"`
- `"Sunday (6pm–7pm)"` → `"Sunday"`

This is a one-time SQL migration.

### Layer 2 — Level-to-Slots Configuration (New Feature)

Add a new admin UI section in the **Slots** tab that lets the admin assign which 2 `matching_slots` are available per Korean level. This creates a `level_slot_config` table:

```text
level_slot_config
─────────────────
id          uuid PK
level       text  (e.g. "Beginner 1")
slot_id     uuid → matching_slots.id
sort_order  int
```

Then when a student at "Beginner 2" reaches the preferred days step:
- The system looks up which 2 `matching_slots` are configured for "Beginner 2"
- Shows only those 2 slots' days as selectable options
- Student picks 1 or 2 of them

### Layer 3 — Fix Student Day Selection UX

In `EnrollNowPage.tsx` and `EnrollmentChecklist.tsx`, the preferred days shown to a student should be **filtered by their level's configured slots**, not a flat list of all active weekdays from `schedule_options`.

---

## Implementation Plan

### Step 1: Database Migration
- Clean the 4 weekday labels in `schedule_options` (strip time suffix)
- Create `level_slot_config` table with RLS:
  - Admins can manage all rows
  - Anyone can read (for enrollment flow)

### Step 2: `SlotManager` or new `LevelSlotConfig` component in the Slots tab
A new section in the admin Slots tab where the admin can:
- Select a Korean level (Beginner 1, 2, Intermediate 1, 2, Advanced 1, 2)
- Assign up to 2 `matching_slots` to that level (picked from a dropdown of existing slots)
- See and edit the current 2 slots per level in a clear table

### Step 3: Fix `PreferredDaysEditor` in `EnrollmentChecklist.tsx`
- Fetch the level's configured slots from `level_slot_config` joined to `matching_slots`
- Show those slots' days as the selectable buttons (max 2, one per slot)
- Save only the pure day name (e.g. "Sunday") not "Sunday (6pm-7pm)"

### Step 4: Fix `EnrollNowPage.tsx` preferred days step
- After fetching the student's level, query `level_slot_config` for that level
- Show only those 2 slots' days as available choices
- Falls back to all active `schedule_options` weekdays if no level config exists

### Step 5: Fix `BulkMatcher.tsx`
- Update the `WEEKDAYS` constant (line 17) to fetch dynamically from `schedule_options` 
- The matcher's day comparison already uses pure day names from `matching_slots.day` — this will now work correctly

---

## Files to Change

| File | Change |
|---|---|
| DB migration | Create `level_slot_config`, clean weekday labels |
| `src/components/admin/SlotManager.tsx` (or new component) | Add level→slot assignment UI |
| `src/components/admin/EnrollmentChecklist.tsx` | Fetch days from level's configured slots |
| `src/pages/EnrollNowPage.tsx` | Filter preferred days by level's configured slots |
| `src/components/admin/BulkMatcher.tsx` | Remove hardcoded WEEKDAYS, use schedule_options |

---

## Technical Details

### New table SQL
```sql
CREATE TABLE public.level_slot_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  slot_id uuid NOT NULL REFERENCES public.matching_slots(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.level_slot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage level_slot_config"
  ON public.level_slot_config FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read level_slot_config"
  ON public.level_slot_config FOR SELECT
  USING (true);
```

### Data cleanup SQL
```sql
UPDATE schedule_options SET label = 'Friday'   WHERE label LIKE 'Friday%'   AND category = 'weekday';
UPDATE schedule_options SET label = 'Monday'   WHERE label LIKE 'Monday%'   AND category = 'weekday';
UPDATE schedule_options SET label = 'Thursday' WHERE label LIKE 'Thursday%' AND category = 'weekday';
UPDATE schedule_options SET label = 'Sunday'   WHERE label LIKE 'Sunday%'   AND category = 'weekday';
```

This makes the "Invalid day" error disappear immediately since the RPC validates against pure day names.
