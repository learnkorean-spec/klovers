

# Plan: Private Class Availability — Block Group Days, Auto-Populate Remaining Days

## Summary

Private class registration currently shares the same day-selection logic as group classes. This plan creates a dedicated private availability system that automatically computes which weekdays are free from group classes, and restricts private bookings to those days only — both in the student UI and admin validation.

## Technical Details

### 1. New file: `src/constants/scheduling.ts`

```typescript
export const TIMEZONE = "Africa/Cairo";
export const PRIVATE_TIME_OPTIONS = ["10:00", "18:00"];
export const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
```

### 2. New file: `src/lib/privateAvailability.ts`

A utility module that:
- Accepts active group slots (or fetches them from `schedule_packages` where `course_type != 'private'` and `is_active = true`)
- Computes `courseDays` = unique `day_of_week` values that have any active group slot (any level, any time)
- Computes `privateAllowedDays` = `WEEKDAYS` minus `courseDays`
- Generates private slot options: `[{ weekday, dayIndex, time, timezone }]` for each allowed weekday x `PRIVATE_TIME_OPTIONS`
- If no group slots exist, all weekdays are allowed
- Exports a `fetchPrivateAvailability()` async function that queries the DB and returns computed options
- Exports a `computePrivateAvailability(groupSlots)` pure function for reuse
- DEV-only: logs `courseDays` and `privateAllowedDays` to console

### 3. Update: `src/pages/EnrollNowPage.tsx`

In the `useEffect` that fetches level slots (lines ~152-224):
- When `classType === "private"`:
  - Instead of querying `schedule_packages` filtered by level, call `fetchPrivateAvailability()`
  - Populate `levelSlots` with the private-allowed options (day + time combinations)
  - Each option gets a synthetic `packageId` (or null) since private slots may not have pre-existing packages
  - Add a note below the day selector: *"Private classes are only available on days without group classes."*
- When `classType === "group"`: existing logic unchanged

Also: when `classType` changes (group ↔ private), reset `levelSlots`, `preferredDays`, and `selectedPackageId`.

### 4. Update: `src/components/SchedulePicker.tsx`

When `courseType === "private"`:
- Use `fetchPrivateAvailability()` instead of querying `schedule_packages` by level
- Display available private day+time combos
- Show info text: *"Private classes are only available on days without group classes."*

### 5. Update: `src/components/admin/SchedulingManager.tsx` — `handleSave`

Replace the current private exemption (`if (fCourseType !== "private")`) with the opposite logic:

```
if (fCourseType === "private") {
  // Fetch ALL active group slots (any level, any time)
  // Compute courseDays from their day_of_week
  // If fDay is in courseDays → BLOCK with message:
  //   "Private classes are not available on [DayName] — group classes run on that day.
  //    Available days for private: [list]."
  // Also check exact time conflict with other private slots
} else {
  // Existing group validation (unchanged)
}
```

### 6. Files changed summary

| File | Change |
|------|--------|
| `src/constants/scheduling.ts` | **NEW** — timezone, private time options, weekdays |
| `src/lib/privateAvailability.ts` | **NEW** — compute/fetch private availability |
| `src/pages/EnrollNowPage.tsx` | Branch schedule fetch by `classType`; show private-specific day options |
| `src/components/SchedulePicker.tsx` | Branch by `courseType` for private availability |
| `src/components/admin/SchedulingManager.tsx` | Reverse private validation: block on group days |

### 7. Validation flow

**Admin creating private slot:**
1. Fetch all active group `schedule_packages` (any level)
2. Extract unique `day_of_week` values → `courseDays`
3. If selected day ∈ `courseDays` → destructive toast with available days list
4. If selected day ∉ `courseDays` → proceed (also check exact same-day+time dupe among private slots)

**Student selecting private schedule:**
1. On entering Step 2 with `classType === "private"`, fetch private availability
2. UI only shows days not used by any group class
3. Each allowed day shows the configurable time options (10:00 AM, 6:00 PM)
4. Student picks one → sets `preferredDays` and `selectedPackageId`

### 8. No DB changes needed

All validation is computed from existing `schedule_packages` data. The `course_type` column already distinguishes group vs private.

