
# Fix: Hide Full Slots in Enrollment Day Picker

## Problem
The "Preferred Day" buttons in the enrollment flow (Step 2) show ALL active schedule packages for a level, including ones that are already full (e.g., Sunday 11:00 PM private slot with capacity 1, already occupied by Renad). Students can select a full slot and proceed, which leads to failed group assignment or waitlisting.

## Solution
Add a capacity check to the `fetchLevelSlots` query in `EnrollNowPage.tsx`. After fetching active packages for the selected level, count active members per package (via `pkg_groups` and `pkg_group_members`) and compute `seats_left`. Only show slots with available seats in the day picker buttons. Full slots are either hidden entirely or shown as disabled with a "Full" label.

## Technical Details

### File: `src/pages/EnrollNowPage.tsx`

**Change the `fetchLevelSlots` effect (lines 151-193):**

1. After fetching `schedule_packages` rows, also fetch:
   - Active `pkg_groups` for those package IDs
   - Active `pkg_group_members` for those groups

2. Compute `seats_left` per package:
   - Sum active members across all groups for each package
   - `seats_left = package.capacity - totalActiveMembers`

3. Filter out (or disable) slots where `seats_left <= 0`

4. Update the `levelSlots` state to include `seatsLeft` so the UI can show a "Full" badge on disabled buttons instead of hiding them entirely (better UX -- student sees the slot exists but is unavailable).

**Update the day button rendering (lines 667-683):**
- Add `disabled` and visual styling for full slots
- Show "(Full)" text next to the time for slots with no seats

This reuses the exact same capacity calculation pattern already used in `SchedulePicker.tsx` (lines 68-113) and `SchedulingManager.tsx`.
