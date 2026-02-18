
## Fix: Preferred Days Must Always Come From schedule_packages

### Root Cause

The "Preferred Day" selectors across the enrollment flow and admin tools currently have two data sources:
- **New (correct)**: `schedule_packages` table — actual packages the admin creates with specific levels and days
- **Old (broken/stale)**: `schedule_options` weekdays (global list) and `level_slot_config → matching_slots` (now cleared)

The goal is to make **all** day selectors pull exclusively from `schedule_packages`, filtered by the student's level.

### What the Database Looks Like

From `schedule_packages`, levels are stored in snake_case (e.g., `beginner_1`, `intermediate_2`) while the UI shows Title Case (e.g., `Beginner 1`). The mapping is: `"Beginner 1".toLowerCase().replace(/\s+/g, "_")` → `"beginner_1"`.

---

### Three Files to Fix

#### 1. `src/pages/EnrollNowPage.tsx` — Student Enrollment Flow (Step 2)

**Current behavior:**
- Fetches days from `schedule_packages` filtered by `normalizedLevel` — this is correct.
- BUT: if no level is selected or no packages exist for the level, it falls back to showing ALL days from `schedule_options` (generic global list).

**Fix:**
- Remove the fallback to `weekdays` from `schedule_options`.
- If level is not yet selected → show a note: "Please select your Korean level first."
- If level is selected but no packages exist → show: "No schedule slots available for this level yet. Contact us."
- Only show day buttons when `levelSlotDays.length > 0`.
- Keep the `weekdays` state removal (or keep it as unused — it won't be displayed).
- The "group = up to 2 days, private = 1 day" max logic remains unchanged.

#### 2. `src/components/admin/EnrollmentChecklist.tsx` — `PreferredDaysEditor`

**Current behavior:**
- Queries `level_slot_config → matching_slots` (old system, now empty/cleared).
- Falls back to `schedule_options` weekdays.

**Fix:**
- Replace the `level_slot_config` query with a `schedule_packages` query:
  ```typescript
  const normalizedLevel = studentLevel.toLowerCase().replace(/\s+/g, "_");
  const { data } = await supabase
    .from("schedule_packages")
    .select("day_of_week, start_time")
    .eq("level", normalizedLevel)
    .eq("is_active", true);
  ```
- Convert `day_of_week` integers to day name strings using `DAY_NAMES` array.
- Keep the display showing `day · time` per slot, sorted by `day_of_week`.
- Keep the fallback to `schedule_options` only when `studentLevel` is empty/null.

#### 3. `src/pages/AdminDashboard.tsx` — Enrollments Tab Inline Editor

**Current behavior:**
- `scheduleWeekdays` is fetched once at startup from `schedule_options` and used for all enrollments.
- The "Preferred days" selector in the enrollment card shows all global weekdays regardless of which level is selected for that enrollment.

**Fix:**
- Introduce a state: `levelPackageDays: Record<string, string[]>` mapping `levelKey → day name[]`.
- When an admin selects a level in `editingEnrollLevel[e.id]`, fetch days from `schedule_packages` for that level and cache the result.
- In the enrollment card day picker, use `levelPackageDays[normalizedLevel] ?? scheduleWeekdays` (fallback to global list only when no packages exist for that level).
- Add a `useEffect` or an `onChange` handler on the level selector to trigger the fetch.

---

### Technical Details

**Day name mapping (used in all three files):**
```typescript
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// day_of_week = 0 → "Sunday", 1 → "Monday", ..., 5 → "Friday", 6 → "Saturday"
```

**Level normalization (used consistently):**
```typescript
const normalizedLevel = level.toLowerCase().replace(/\s+/g, "_");
// "Beginner 1" → "beginner_1"
// "Intermediate 2" → "intermediate_2"
```

**Query pattern (same across all three):**
```typescript
const { data } = await supabase
  .from("schedule_packages")
  .select("day_of_week")
  .eq("level", normalizedLevel)
  .eq("is_active", true);
const uniqueDays = [...new Set((data ?? []).map(r => DAY_NAMES[r.day_of_week]))];
// Sort by day index
```

---

### Files Changed
- `src/pages/EnrollNowPage.tsx` — Remove fallback to `weekdays`, add conditional UI
- `src/components/admin/EnrollmentChecklist.tsx` — Replace `level_slot_config` query with `schedule_packages`
- `src/pages/AdminDashboard.tsx` — Add per-level day fetching for enrollment inline editor
