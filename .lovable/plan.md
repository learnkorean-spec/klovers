

## Registration Hard Fix: Prevent Missing Level/Schedule

### Summary

The current code already has draft save/restore logic and single-day selection, but has critical gaps:
1. **SchedulePicker doesn't write to enrollments** -- it only saves to `student_package_preferences`
2. **Login page doesn't create enrollment from draft** after successful login
3. **Draft cleanup happens too early** -- `localStorage` is cleared on mount before state is fully restored
4. **EnrollNowPage clears `enroll_draft` immediately** even if rehydration hasn't completed

---

### Changes Required

#### A) SignUpPage.tsx -- Already Clean (No Changes Needed)

The current SignUpPage already has no level field. It only collects name, email, password, country. No action needed.

---

#### B) EnrollNowPage.tsx -- Fix Draft Lifecycle

**Problem 1: Draft cleared too early (line 113-117)**
The `useEffect` that clears `enroll_draft` runs immediately on mount, before async data (levelSlots) loads and before `selectedPackageId` can be restored from the rehydrated `preferredDays`.

**Fix:** Move draft cleanup to AFTER the user successfully reaches step 3 (payment step), not on page load. Only clear draft when it's no longer needed.

**Problem 2: `handlePay` validates but doesn't gate on `selectedPackageId`**
Currently it checks `selectedLevel` and `preferredDays.length` but not `selectedPackageId`. The package_id is what ties the enrollment to a specific schedule slot.

**Fix:** Add `selectedPackageId` to the validation in `handlePay`. Show error if missing.

---

#### C) SchedulePicker.tsx -- Write Schedule to Enrollments

**Current behavior:** When a student confirms a package selection, `selectPackage()` only writes to `student_package_preferences`. It does NOT touch the `enrollments` table.

**Fix:** After saving preferences, also update the most recent PENDING enrollment for this user (if one exists) with `level`, `package_id`, `preferred_day`, `preferred_time`, and `timezone`. If no enrollment exists yet (pre-payment), save to `localStorage` draft instead so the data is available when the enrollment is created.

---

#### D) LoginPage.tsx -- Post-Login Draft Sync

**Current behavior:** After login, the page redirects to `redirectTo` or `/dashboard`. It does NOT check for `enroll_draft` or create/update an enrollment.

**Fix:** After successful login, check if `localStorage.enroll_draft` exists. If it does AND the user has a PENDING enrollment without schedule data, update that enrollment with the draft fields. Then clear the draft and redirect.

---

#### E) Database Migration -- Backfill Old Data

Run a one-time migration to:
1. Normalize `enrollments.level` and `leads.level` to snake_case
2. Backfill `enrollments.level` from `leads` by email where missing
3. Backfill `preferred_day` from `preferred_days[1]` where missing
4. Map `package_id` from `schedule_packages` where a unique match exists

The columns `preferred_day` and `package_id` already exist on `enrollments` from a previous migration.

---

### Technical Details

#### File: `src/pages/EnrollNowPage.tsx`

| Line Range | Change |
|---|---|
| 112-117 | Remove the early `useEffect` that clears `enroll_draft` on mount |
| 273 | Add draft cleanup call inside `handlePay` after successful payment initiation |
| 373-378 | Add `selectedPackageId` to the missing-schedule validation check |

#### File: `src/components/SchedulePicker.tsx`

| Line Range | Change |
|---|---|
| 158-185 | In `selectPackage()`, after saving `student_package_preferences`, also update the user's latest PENDING enrollment with `level`, `package_id`, `preferred_day`, `preferred_time`, `timezone`. If not logged in, update `enroll_draft` in localStorage. |

#### File: `src/pages/LoginPage.tsx`

| Line Range | Change |
|---|---|
| 46-52 | After successful login (non-admin), before redirecting: check `localStorage.enroll_draft`, if present upsert enrollment schedule fields for the user, then clear the draft. |

#### SQL Migration

```sql
-- Normalize levels
UPDATE public.enrollments 
SET level = lower(regexp_replace(trim(level), '\s+', '_', 'g'))
WHERE level IS NOT NULL AND level <> '' 
  AND level <> lower(regexp_replace(trim(level), '\s+', '_', 'g'));

UPDATE public.leads
SET level = lower(regexp_replace(trim(level), '\s+', '_', 'g'))
WHERE level IS NOT NULL AND level <> '' 
  AND level <> lower(regexp_replace(trim(level), '\s+', '_', 'g'));

-- Backfill enrollment.level from leads
UPDATE public.enrollments e
SET level = l.level
FROM public.profiles p
JOIN public.leads l ON lower(l.email) = lower(p.email)
WHERE e.user_id = p.user_id
  AND (e.level IS NULL OR e.level = '')
  AND l.level IS NOT NULL AND l.level <> '';

-- Backfill preferred_day from preferred_days array
UPDATE public.enrollments
SET preferred_day = preferred_days[1]
WHERE preferred_day IS NULL 
  AND preferred_days IS NOT NULL 
  AND array_length(preferred_days, 1) > 0;

-- Map package_id where unique match exists
UPDATE public.enrollments e
SET package_id = sp.id
FROM public.schedule_packages sp
WHERE e.package_id IS NULL
  AND e.level IS NOT NULL AND e.level <> ''
  AND sp.level = e.level AND sp.is_active = true
  AND e.preferred_day IS NOT NULL
  AND sp.day_of_week = CASE e.preferred_day
    WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6 END;
```

---

### Files Changed

| File | Action |
|---|---|
| `src/pages/EnrollNowPage.tsx` | Fix draft lifecycle, add packageId validation |
| `src/components/SchedulePicker.tsx` | Write schedule to enrollments on selection |
| `src/pages/LoginPage.tsx` | Post-login draft sync to enrollments |
| SQL Migration | Normalize + backfill old data |

### Edge Cases

| Scenario | Behavior |
|---|---|
| User selects schedule but doesn't pay | Draft saved in localStorage; enrollment updated if exists |
| Social login loses URL params | localStorage draft used as fallback |
| User has no PENDING enrollment yet | Schedule saved only to localStorage + preferences; enrollment created later by payment flow |
| Old enrollments with missing level | Backfilled from leads table by email match |

