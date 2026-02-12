

# Unified 2-Step Enrollment Flow (Part A)

This plan removes the requirement for users to create an account before paying. Instead, visitors provide their name and email during checkout, and an account is automatically created after successful payment.

## How It Works

### Frontend: New 2-Step Enrollment Page (`/enroll-now`)

**Step 1 -- Choose Your Plan**
- Select Group or Private classes
- Select country (determines pricing tier automatically)
- Shows price summary based on selections
- "Next" button to proceed

**Step 2 -- Choose Duration and Pay**
- Select duration: 1, 3, or 6 months
- Auto-calculated price displayed (read-only)
- Collect Name and Email only (no password)
- "Pay Now" button calls the updated `create-checkout` function
- Opens Stripe Checkout in new tab

### Backend: Updated `create-checkout` Edge Function
- Accepts `{ priceId, tier, classType, duration, classesIncluded, amount, name, email }` (no auth required)
- Skips user authentication -- works for anonymous visitors
- Passes `name` and `email` in Stripe session metadata
- Sets `success_url` and `cancel_url`

### Backend: Updated `stripe-webhook` Edge Function
- On `checkout.session.completed`:
  1. Extract `email` and `name` from metadata
  2. Check if a user with that email already exists (via admin API)
  3. If no user exists: create one with `supabase.auth.admin.createUser()` using a generated temp password
  4. Set `profile.status = ACTIVE`, assign credits
  5. Create enrollment record with `APPROVED` status
  6. (Future) Send welcome email with temp password -- for now, users can use "Forgot Password" to set theirs

### Frontend: Updated PricingSection
- All "Get Started" / duration-select buttons redirect to `/enroll-now` with query params (tier, classType) instead of requiring login first

### Routing
- Add `/enroll-now` route for the new 2-step page
- Keep `/enroll` (manual receipt upload) as a fallback for alternative payment

## Technical Details

### Files to Create
- `src/pages/EnrollNowPage.tsx` -- 2-step enrollment form

### Files to Modify
- `supabase/functions/create-checkout/index.ts` -- remove auth requirement, accept name/email in body
- `supabase/functions/stripe-webhook/index.ts` -- add find-or-create user logic using admin API
- `src/components/PricingSection.tsx` -- redirect to `/enroll-now` instead of inline checkout
- `src/App.tsx` -- add `/enroll-now` route
- `supabase/config.toml` -- already has `verify_jwt = false` for both functions (no change needed)

### Database Changes
- None required. Existing `profiles` and `enrollments` tables support this flow.

### Security Notes
- `create-checkout` will validate email format server-side
- Stripe handles all payment security
- User creation uses `SUPABASE_SERVICE_ROLE_KEY` in the webhook (already available)
- Rate limiting on `create-checkout` to prevent abuse

### Part B (Blog Gating) -- Deferred
The blog/article gating system with free accounts and view tracking will be planned separately once Part A is live and tested.

