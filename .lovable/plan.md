
## Problem Diagnosis

There are two distinct but related issues causing the admin dashboard to not show auto-populated Level and Preferred Days from registration:

### Root Cause 1 — Stripe Flow Does Not Save Preferences to the Enrollment

The Egypt flow (`handleEgyptOrder`) correctly saves `preferred_days`, `preferred_time`, `timezone`, and `level` to the enrollment and profile after creating the enrollment record.

The **Stripe flow** (`handlePay`) does NOT. It only saves the level to the profile (if already logged in), but the enrollment itself is created server-side by the **Stripe webhook** (`supabase/functions/stripe-webhook/index.ts`) after payment — meaning `preferred_days` and `timezone` are never persisted to the enrollment record.

### Root Cause 2 — Admin Dashboard Level Selector Shows Empty for Stripe Enrollments

Because `enrollments.preferred_days` is `null` and `profiles.level` is empty for Stripe-enrolled students, the admin dashboard enrollment card shows no pre-selected level or days, requiring the admin to manually fill these in.

### Fix Plan

**File 1: `supabase/functions/stripe-webhook/index.ts`**
After a successful payment, when the webhook creates/updates the enrollment, it must also write `preferred_days`, `preferred_time`, `preferred_start`, and `timezone` from the Stripe metadata (which is already passed in the checkout session body) into the `enrollments` record, and write `level` to the `profiles` table.

**File 2: `supabase/functions/create-checkout/index.ts`**
The checkout function needs to store the `level`, `preferred_days`, `preferred_time`, `preferred_start`, and `timezone` in the Stripe checkout session metadata so the webhook can read them on completion.

**File 3: `src/pages/EnrollNowPage.tsx`**
For the Stripe path, after the checkout session is created and the user pays, the enrollment record won't exist yet. However, a `student_schedule_preferences` or `leads` record already captures the info. The real fix is ensuring the webhook uses the metadata.

Additionally, for already-existing enrollments (past Stripe enrollments with no preferred_days), the admin dashboard should:

**File 4: `src/pages/AdminDashboard.tsx`**
When an enrollment has no `preferred_days` but the matching lead has a `schedule` field (e.g. `"Friday"`), parse that lead schedule string into day names and auto-populate the `editingEnrollDays` state. The `leads.schedule` field stores days as `"Friday"` or `"Sunday/Friday"` — these can be split by `/` and used directly as pre-selected chips.

### Technical Details

**Lead schedule format**: stored as `"Friday"` or `"Sunday/Friday"` (forward-slash separated)

**Stripe metadata propagation** (in `create-checkout`):
```typescript
metadata: {
  level: selectedLevel,
  preferred_days: preferredDays.join(","),
  preferred_time: preferredTime,
  preferred_start: startOption === "Specific date" ? specificDate : startOption,
  timezone: timezone,
}
```

**Stripe webhook** (in `stripe-webhook`): After enrollment insert, run:
```typescript
const meta = session.metadata ?? {};
await supabaseAdmin.from("enrollments").update({
  preferred_days: meta.preferred_days ? meta.preferred_days.split(",") : null,
  preferred_time: meta.preferred_time || null,
  preferred_start: meta.preferred_start || null,
  timezone: meta.timezone || null,
}).eq("stripe_payment_intent_id", session.payment_intent);
// Also save level to profile
if (meta.level) {
  await supabaseAdmin.from("profiles").update({ level: meta.level }).eq("user_id", userId);
}
```

**Admin Dashboard fallback** (for existing enrollments missing data):
```typescript
// In fetchAll, after building autoDays from enrollment preferred_days:
enrichedEnrollments.forEach((e) => {
  if (!autoDays[e.id]) {
    // Try to get schedule from matching lead
    const profileEmail = e.profiles?.email?.toLowerCase();
    const lead = profileEmail ? leadsByEmail[profileEmail] : null;
    if (lead?.schedule && lead.schedule.trim() !== "") {
      const leadDays = lead.schedule.split("/").map((d: string) => d.trim()).filter(Boolean);
      if (leadDays.length > 0) autoDays[e.id] = leadDays;
    }
  }
});
```

### Files to Change

1. **`supabase/functions/create-checkout/index.ts`** — Add schedule metadata (level, preferred_days, timezone, etc.) to the Stripe checkout session so the webhook can read it after payment
2. **`supabase/functions/stripe-webhook/index.ts`** — After creating the enrollment, write `preferred_days`, `timezone`, `preferred_time` from Stripe session metadata, and write `level` to `profiles`
3. **`src/pages/AdminDashboard.tsx`** — Add fallback to parse `leads.schedule` string (e.g. `"Friday"` or `"Sunday/Friday"`) into the `editingEnrollDays` state when `enrollments.preferred_days` is null, so existing records are also covered
