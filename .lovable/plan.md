

## Egypt Manual Payment Flow (EGP Only)

This is a significant feature that creates a separate payment path for Egyptian students, replacing Stripe with a manual receipt-based flow using Egyptian Pounds (EGP).

### Overview

When a student selects Egypt as their country, the entire payment experience changes:
- Prices display in EGP (not USD)
- Stripe checkout is disabled
- Instead, an order is created with a 48-hour payment window
- Student is redirected to a dedicated payment page to upload their receipt
- Admin reviews and approves/rejects
- Automated reminders are sent if payment is not submitted within 48 hours

### EGP Pricing (Local Tier)

| Plan | 1 Month | 3 Months | 6 Months |
|------|---------|----------|----------|
| Group | 1,200 EGP | 3,300 EGP | 6,100 EGP |
| Private | 2,350 EGP | 6,600 EGP | 11,750 EGP |

### User Flow

```text
Enroll Now Page (Egypt selected)
  |
  v
Prices shown in EGP, no Stripe button
  |
  v
"Confirm Order" -> creates enrollment (PENDING_PAYMENT, due_at = now+48h)
  |
  v
Redirect to /pay/:enrollmentId
  |
  +-- Select method: Vodafone Cash / InstaPay / Bank
  +-- See account number: 00201010003084 (with copy button)
  +-- Enter payment_date (required)
  +-- Upload receipt jpg/png/pdf (required)
  +-- Transaction reference (optional)
  +-- Submit -> status = UNDER_REVIEW
  |
  v
Admin reviews in dashboard
  +-- Approve -> APPROVED + grant credits + send email
  +-- Reject -> REJECTED + send email
```

### Technical Details

**1. Database Migration**

Add columns to the `enrollments` table:
- `currency TEXT DEFAULT 'USD'` -- to distinguish EGP orders
- `due_at TIMESTAMPTZ` -- 48-hour payment deadline
- `payment_date DATE` -- date the student made payment

Update the `approval_status` enum values to include `PENDING_PAYMENT` and `UNDER_REVIEW` (these are stored as text, so no enum change needed).

**2. New RPC: `create_egypt_order`**

Server-side function (SECURITY DEFINER) that:
- Validates user is authenticated
- Validates plan_type, duration
- Looks up fixed EGP price from a server-side table
- Creates enrollment with `status='PENDING_PAYMENT'`, `currency='EGP'`, `due_at=now()+interval '48 hours'`
- Returns the enrollment ID

**3. New RPC: `submit_egypt_payment`**

Server-side function that:
- Validates user owns the enrollment
- Validates enrollment is in PENDING_PAYMENT status
- Updates status to UNDER_REVIEW
- Stores payment_method, payment_date, receipt_url, tx_ref

**4. Modified: `EnrollNowPage.tsx`**

- When `selectedCountry === "Egypt"`:
  - Show all prices in EGP instead of USD
  - Replace "Pay $X Now" button with "Confirm Order (X EGP)"
  - On click: call `create_egypt_order` RPC, then redirect to `/pay/:enrollmentId`
- All other countries: unchanged (Stripe flow)

**5. New Page: `/pay/:enrollmentId` (EgyptPaymentPage.tsx)**

Clean, focused payment page:
- Header showing order summary (plan, duration, amount in EGP)
- Payment method selector: Vodafone Cash / InstaPay / Bank Transfer
- Account number display: `00201010003084` with a copy-to-clipboard button
- Required field: Payment date (date picker)
- Required field: Receipt upload (jpg/png/pdf, max 5MB)
- Optional field: Transaction reference
- Submit button -> calls `submit_egypt_payment` RPC
- Success state: "Payment submitted for review" message
- Already-submitted state: shows current status

**6. Modified: `PricingSection.tsx`**

- When Egypt is selected, show EGP prices for the local tier instead of USD
- Update the price display to use "EGP" currency label

**7. Modified: `AdminDashboard.tsx`**

Add new enrollment subtabs:
- "Pending Payment" -- orders in PENDING_PAYMENT state (waiting for student to pay)
- "Under Review" -- orders in UNDER_REVIEW state (receipt uploaded, needs admin action)
- Keep existing Pending/Approved/Rejected tabs

Show payment details: method, payment date, receipt, currency/amount in EGP.

On Approve: mark as APPROVED + PAID, grant credits (same existing flow).
On Reject: mark as REJECTED, send rejection email via existing email function.

**8. Modified: `StudentDashboard.tsx`**

- If enrollment is PENDING_PAYMENT: show "Complete your payment" card with link to `/pay/:enrollmentId`
- If enrollment is UNDER_REVIEW: show "Payment under review" message
- Access to class features only when status is APPROVED (already enforced)

**9. New Edge Function: `payment-reminder`**

Checks for enrollments where:
- `approval_status = 'PENDING_PAYMENT'`
- `due_at` is within 6 hours or has passed
- No reminder sent yet

Sends a reminder email via the existing `send-confirmation-email` function (with a new template).

This would be triggered via a scheduled cron job (every hour).

**10. Route Registration**

Add `/pay/:enrollmentId` route in `App.tsx` pointing to the new `EgyptPaymentPage`.

### Files Changed

| File | Action |
|------|--------|
| Database migration | Add `currency`, `due_at`, `payment_date` columns; create `create_egypt_order` and `submit_egypt_payment` RPCs |
| `src/pages/EnrollNowPage.tsx` | Egypt detection, EGP prices, order creation instead of Stripe |
| `src/pages/EgyptPaymentPage.tsx` | **New** -- payment upload page |
| `src/pages/AdminDashboard.tsx` | New status subtabs, EGP display |
| `src/pages/StudentDashboard.tsx` | Pending payment / under review states |
| `src/components/PricingSection.tsx` | EGP prices when Egypt selected |
| `src/App.tsx` | Add `/pay/:enrollmentId` route |
| `supabase/functions/payment-reminder/index.ts` | **New** -- 48h reminder edge function |
| `supabase/config.toml` | Add payment-reminder function config |

### Security

- EGP prices are validated server-side in the RPC (not from client)
- Receipt uploads go to the existing private `receipts` bucket
- Only the order owner can submit payment for their own enrollment
- Only admins can approve/reject
- Course access is gated on `approval_status === 'APPROVED'` (already enforced)

