
## Problem

The "Preferred Days" selection in the enrollment flow shows all 7 days hardcoded in two admin locations, instead of only showing the days that the admin has configured as available in the `schedule_options` table.

Currently:
- `EnrollNowPage.tsx` (student-facing) — **already correct**: fetches active weekdays from `schedule_options` dynamically, with a 7-day fallback.
- `AdminDashboard.tsx` (enrollment card editor) — **hardcoded**: `SLOT_WEEKDAYS = ["Monday"..."Sunday"]` (line 108), used when admin edits preferred days for PENDING/UNDER_REVIEW enrollments.
- `EnrollmentChecklist.tsx` (checklist inline editor) — **hardcoded**: `WEEKDAYS = ["Monday"..."Sunday"]` (line 18), used in the `PreferredDaysEditor` inline component.

## Fix Plan

### 1. `src/pages/AdminDashboard.tsx`
- Add a `scheduleWeekdays` state (initialized to the fallback 7 days).
- Inside `fetchAll()` (which already runs on load), fetch active weekdays from `schedule_options` where `category = 'weekday'` and `is_active = true`, ordered by `sort_order`.
- Replace the hardcoded `SLOT_WEEKDAYS` constant with the dynamic `scheduleWeekdays` state.
- The day-toggle buttons in the enrollment card (lines ~858–876) will now show only admin-configured days.

### 2. `src/components/admin/EnrollmentChecklist.tsx`
- Remove the hardcoded `WEEKDAYS` constant at the top.
- Add a `useEffect` inside the `PreferredDaysEditor` component that fetches active weekdays from `schedule_options` on mount.
- Fall back to the 7-day list if the fetch returns empty (safety net).
- The day-toggle pill buttons will now reflect only active admin-configured days.

### Technical Details
Both fixes use the same Supabase query pattern already established in `EnrollNowPage.tsx`:
```typescript
supabase
  .from("schedule_options")
  .select("label, sort_order")
  .eq("category", "weekday")
  .eq("is_active", true)
  .order("sort_order")
```

No database changes are needed — the `schedule_options` table and its RLS policies already support this (`Anyone can read schedule_options` policy is in place).

### Files to Modify
1. `src/pages/AdminDashboard.tsx` — fetch weekdays dynamically in `fetchAll`, replace `SLOT_WEEKDAYS` references
2. `src/components/admin/EnrollmentChecklist.tsx` — fetch weekdays inside `PreferredDaysEditor`, replace `WEEKDAYS` references
