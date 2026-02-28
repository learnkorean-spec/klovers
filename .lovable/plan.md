

## Plan: Deep-link emails to exact missing field

### Problem
The reminder email links to `/dashboard` generically. Students must find the checklist themselves.

### Solution
Add a `?complete=<field_key>` query parameter to the email link per missing field, and auto-open that specific inline editor in the RegistrationChecklist when the page loads.

### Changes

**1. Edge function (`supabase/functions/send-profile-reminders/index.ts`)**
- Instead of one generic "Complete Your Profile" button, generate a per-field button list in the email.
- Each button links to `https://klovers.lovable.app/dashboard?complete=name`, `?complete=level`, `?complete=country`, `?complete=timezone`, `?complete=days`.
- Keep a single fallback CTA at the bottom linking to the generic dashboard.

**2. RegistrationChecklist component (`src/components/RegistrationChecklist.tsx`)**
- Accept a new optional prop `autoFocusField?: string`.
- On mount, if `autoFocusField` matches an incomplete item's key, auto-set `editingField` to that key (or navigate to schedule page if it's "days").
- Scroll the checklist card into view using a ref + `scrollIntoView`.

**3. StudentDashboard (`src/pages/StudentDashboard.tsx`)**
- Read `?complete=` from URL search params via `useSearchParams`.
- Map param values to checklist keys: `name`→`Full name`, `level`→`Korean level`, `country`→`Country`, `timezone`→`Timezone`, `days`→`Preferred class days`.
- Pass the mapped key as `autoFocusField` to `RegistrationChecklist`.
- Clear the query param after reading to keep URL clean.

### Field mapping (email param → checklist key)
```text
name     → Full name
level    → Korean level
country  → Country
timezone → Timezone
days     → Preferred class days
```

