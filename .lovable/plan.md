

## Lock Conversion End-to-End

### Summary

Remove the Korean level field from SignUp (it belongs only in the Enroll flow), enforce single-day selection, store `package_id` on enrollments, and add a `preferred_day` column to replace the legacy `preferred_days[]` array.

---

### A) Remove Level from SignUp (`SignUpPage.tsx`)

Current state: SignUp has a "Korean level" Select dropdown (line 108-113) and passes `level` in auth metadata (line 41).

Changes:
- Delete the `level` state variable and the `LEVELS` constant
- Remove the level `<Select>` block
- Remove `level` from the `data: { name, country, level }` metadata object (keep `name` and `country`)
- Remove the `Select` import if no longer used (country still uses it, so keep it)

---

### B) Enroll Flow: Single Day + Package ID Persistence (`EnrollNowPage.tsx`)

Current state:
- Group students can select up to 2 days (`maxDays = classType === "group" ? 2 : 1`)
- Egypt orders update enrollment with `preferred_days` array but no `package_id`
- Stripe checkout sends schedule in metadata but doesn't persist `package_id` on enrollment

Changes:
1. **Force single day**: Change `maxDays` to always be `1` (remove the group=2 logic)
2. **Update label**: Change "select up to 2" to just "select 1"
3. **Egypt order handler**: After creating the order, also write `package_id` and `preferred_day` (single string) to the enrollment
4. **Stripe checkout handler**: Save `package_id` and `preferred_day` to profile preferences (enrollment is created by webhook, but we can pass `package_id` in Stripe metadata)
5. **Stripe metadata**: Add `package_id` to the checkout metadata so the webhook can persist it

To map preferred day to a package_id: when the student selects a day from `levelSlots`, we know the `day_of_week` and can query `schedule_packages` for the matching package. We'll store the selected slot's package info alongside the day selection.

---

### C) Database Migration

Add two new columns to `enrollments`:

```sql
ALTER TABLE public.enrollments 
  ADD COLUMN IF NOT EXISTS preferred_day text,
  ADD COLUMN IF NOT EXISTS package_id uuid;
```

Backfill existing data:

```sql
-- Backfill preferred_day from preferred_days[0]
UPDATE public.enrollments
SET preferred_day = preferred_days[1]
WHERE preferred_day IS NULL 
  AND preferred_days IS NOT NULL 
  AND array_length(preferred_days, 1) > 0;

-- Normalize levels
UPDATE public.enrollments 
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level <> '' AND level <> lower(replace(trim(level), ' ', '_'));

UPDATE public.leads
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level <> '' AND level <> lower(replace(trim(level), ' ', '_'));

-- Backfill enrollment.level from leads where missing
UPDATE public.enrollments e
SET level = l.level
FROM public.profiles p
JOIN public.leads l ON lower(l.email) = lower(p.email)
WHERE e.user_id = p.user_id
  AND (e.level IS NULL OR e.level = '')
  AND l.level IS NOT NULL AND l.level <> '';

-- Map package_id where possible (level + day match)
UPDATE public.enrollments e
SET package_id = sp.id
FROM public.schedule_packages sp
WHERE e.package_id IS NULL
  AND e.level IS NOT NULL AND e.level <> ''
  AND sp.level = e.level
  AND sp.is_active = true
  AND e.preferred_day IS NOT NULL
  AND sp.day_of_week = CASE e.preferred_day
    WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6 END;
```

---

### D) EnrollNowPage: Track Selected Package

When the student picks a day from `levelSlots`, we need to know which `schedule_package` it maps to. Update the slot-fetching logic to also store `package_id` per slot:

```typescript
// Change levelSlots type to include package info
const [levelSlots, setLevelSlots] = useState<{ day: string; time: string; packageId: string }[]>([]);
```

When fetching slots, include the `id` from `schedule_packages`:

```typescript
const { data } = await supabase
  .from("schedule_packages")
  .select("id, day_of_week, start_time")
  .eq("level", normalizedLevel)
  .eq("is_active", true);
```

When a day is selected via `toggleDay`, also set a `selectedPackageId` state from the matching slot.

On Egypt order and Stripe checkout, include `package_id` in the data written to enrollments/metadata.

---

### E) Admin Dashboard: Minor Cleanup

The admin enrollment UI is already read-only for level and days. Changes:
- Update references from `preferred_days` to also show `preferred_day` (single) as fallback
- Display `package_id` info if available (join with schedule_packages data is optional; the day/time/timezone already shown covers this)

---

### F) Stripe Webhook Update (`stripe-webhook/index.ts`)

When processing `checkout.session.completed`:
- Read `package_id` from session metadata
- Write it to the enrollment record along with `preferred_day` (derived from `preferred_days[0]` in metadata)
- Write `level` from metadata (already done)

---

### Files to Change

| File | Changes |
|---|---|
| `src/pages/SignUpPage.tsx` | Remove level state, dropdown, and auth metadata field |
| `src/pages/EnrollNowPage.tsx` | Force single day, track packageId per slot, persist package_id + preferred_day to enrollment |
| `src/pages/AdminDashboard.tsx` | Show preferred_day fallback alongside preferred_days; minor display cleanup |
| `supabase/functions/stripe-webhook/index.ts` | Read package_id from metadata, write preferred_day + package_id to enrollment |
| `supabase/functions/create-checkout/index.ts` | Pass package_id in Stripe session metadata |
| SQL Migration | Add preferred_day + package_id columns; backfill + normalize |

### Edge Cases

| Scenario | Behavior |
|---|---|
| Existing enrollments with preferred_days[] but no preferred_day | Migration backfills from preferred_days[0] |
| Enrollment with level but no matching package | package_id stays null; admin sees warning badge |
| Student picks a day that maps to multiple packages | Use first active match (deduplicated by day in the query) |
| Legacy 2-day enrollments | Keep preferred_days for display; preferred_day = first day only |

