

## Refactor: Payment + Approval Separation

Separate payment tracking from admin approval across the enrollment system, with zero data loss.

### Step 1 -- Database Migration (safe, additive)

Add 4 new columns to `enrollments` table:
- `payment_status` (text, default `'UNPAID'`)
- `approval_status` (text, default `'PENDING'`)
- `payment_provider` (text, nullable)
- `admin_review_required` (boolean, default `false`)

Then backfill existing rows from the old `status` column:
- `status = 'APPROVED'` maps to `payment_status = 'PAID'`, `approval_status = 'APPROVED'`
- `status = 'REJECTED'` maps to `payment_status = 'UNPAID'`, `approval_status = 'REJECTED'`
- `status = 'PENDING'` maps to `payment_status = 'UNPAID'`, `approval_status = 'PENDING'`, `admin_review_required = true`

Infer `payment_provider` from `receipt_url`: if it starts with `stripe:` then `'stripe'`, otherwise `'manual'`.

The old `status` column is kept untouched.

### Step 2 -- Stripe Webhook Update

**File: `supabase/functions/stripe-webhook/index.ts`**

Update the enrollment insert (around line 201) to include the new columns:
- `payment_status: 'PAID'`
- `payment_provider: 'stripe'`
- `approval_status: 'APPROVED'`
- `admin_review_required: false`

Keep `status: 'APPROVED'` for backward compatibility.

### Step 3 -- Manual Enrollment Page Update

**File: `src/pages/EnrollPage.tsx`**

Update the insert (around line 56) to include:
- `payment_provider: 'manual'`
- `payment_status: 'UNPAID'`
- `approval_status: 'PENDING'`
- `admin_review_required: true`

Keep `status: 'PENDING'` for backward compatibility.

### Step 4 -- Admin Dashboard Refactor

**File: `src/pages/AdminDashboard.tsx`**

Update the `Enrollment` interface to add the new fields.

Replace the enrollments tab with 3 sub-tabs:
- **Pending Review** -- `admin_review_required === true && approval_status === 'PENDING'`
- **Approved** -- `approval_status === 'APPROVED'`
- **Rejected** -- `approval_status === 'REJECTED'`

Each sub-tab shows an empty state when its list is empty.

Update `handleEnrollmentAction`:
- Approve: set `approval_status = 'APPROVED'`; if manual, also set `payment_status = 'PAID'`; keep writing old `status` too
- Reject: set `approval_status = 'REJECTED'`; keep writing old `status` too

Display `payment_provider` badge on each enrollment card (Stripe vs Manual).

### Step 5 -- No Changes to Student Dashboard

The `StudentDashboard` reads from `profiles.status` and `profiles.credits`, not from `enrollments.status`. No changes needed there.

### Technical Details

```text
enrollments table (after migration)
-------------------------------------
existing columns   | new columns
-------------------------------------
status (kept)      | payment_status
                   | approval_status
                   | payment_provider
                   | admin_review_required
-------------------------------------
```

All writes will populate BOTH old and new columns during the transition period. The old `status` column can be dropped in a future cleanup once everything is validated.

