

## Problem

A database validation trigger on the `enrollments` table restricts `approval_status` to a whitelist of values: `PENDING, APPROVED, REJECTED, PENDING_PAYMENT, pending, approved, rejected`. The value `UNDER_REVIEW` is **not in this list**.

When a student submits their Egypt payment, the RPC function `submit_egypt_payment` sets `approval_status = 'UNDER_REVIEW'`, which the trigger rejects with the error: `Invalid approval_status: UNDER_REVIEW`.

## Fix

Run a single database migration to update the validation trigger function, adding `'UNDER_REVIEW'` (and its lowercase variant) to the allowed `approval_status` values.

### Migration SQL
Update the trigger function `validate_enrollment_fields` to include `'UNDER_REVIEW'` and `'under_review'` in the allowed values check for `approval_status`.

No frontend code changes needed -- the Egypt payment flow and admin dashboard already handle `UNDER_REVIEW` correctly.

