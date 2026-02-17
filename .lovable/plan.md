

# Refactor Admin Matcher: Secure Data, Audit Trail, and Full Reset

## Overview
This plan refactors the Bulk Matcher to use backend RPCs for all mutations, adds an admin audit log, expands match statuses, and introduces a secure password-protected platform reset.

---

## Phase 1: Database Changes

### 1.1 Create `admin_audit_log` table
- Columns: `id`, `admin_id`, `enrollment_id`, `action` (text), `field` (text), `old_value` (text), `new_value` (text), `created_at`
- RLS: admin-only access
- Used by all RPCs below to track every change

### 1.2 Create `system_reset_log` table
- Columns: `id`, `admin_id`, `reset_type`, `details`, `created_at`
- RLS: admin-only
- Records each platform reset event

### 1.3 Add UNIQUE constraint check
- Already exists: `student_slot_preferences_enrollment_id_key` -- no migration needed
- No duplicate rows found (12 total = 12 unique)

---

## Phase 2: Backend RPCs (all SECURITY DEFINER, admin-only)

### 2.1 `reassign_student_slot(_enrollment_id uuid, _new_slot_id uuid)`
- Validates admin role
- Checks new slot capacity (current_count < max_students)
- Decrements old slot count (if previously assigned)
- Increments new slot count
- Upserts `student_slot_preferences` row
- Logs old and new slot in `admin_audit_log`
- Single transaction (implicit in plpgsql)

### 2.2 `unmatch_student_slot(_enrollment_id uuid)`
- Validates admin role
- Sets `assigned_slot_id = null`, `match_status = 'pending'`
- Decrements old slot count
- Logs action in audit table

### 2.3 `update_student_preferences(_enrollment_id uuid, _preferred_days text[], _timezone text)`
- Validates admin role
- Updates `enrollments.preferred_days` and `enrollments.timezone`
- Logs old vs new values in audit table

### 2.4 `reset_platform_data(_reset_password text)`
- Validates admin role AND super_admin (checked via `user_roles`)
- Compares `_reset_password` against a hashed value stored in Supabase secrets (using `vault.decrypted_secrets` or a dedicated config table)
- If valid, in a single transaction:
  - Delete all `student_slot_preferences`
  - Delete all `admin_attendance_log`
  - Delete all `attendance_requests`
  - Delete all `enrollments`
  - Reset all `matching_slots.current_count` to 0, status to 'open'
  - Delete `profiles` except those with admin role
  - Delete `admin_audit_log`
  - Log reset in `system_reset_log`
- Returns success/failure message

---

## Phase 3: Refactor BulkMatcher Component

### 3.1 Expanded Match Statuses
Replace the 3-status system with 5 states:

```text
READY       -- assigned_slot_id exists AND slot.day in preferred_days
MISMATCH    -- assigned_slot_id exists AND slot.day NOT in preferred_days
INCOMPLETE  -- no preferred_days set (empty array or null)
UNMATCHED   -- no assigned_slot_id
CAPACITY    -- assigned to a slot that is now full (current_count >= max_students)
```

Each section shows a count badge and reason text per student.

### 3.2 Replace Direct DB Calls with RPCs
All admin actions call the new RPCs instead of direct table updates:
- "Reassign" calls `reassign_student_slot`
- "Unmatch" calls `unmatch_student_slot`
- "Toggle day" / "Edit timezone" calls `update_student_preferences`

Optimistic UI stays the same -- revert on RPC error.

### 3.3 Data Fetching (Scoped)
- Fetch enrollments filtered to `approval_status = 'APPROVED'` and `payment_status = 'PAID'`
- Fetch preferences scoped to those enrollment IDs only (`.in("enrollment_id", ids)`)
- Fetch slots used by those preferences only
- No change to the multi-query approach (a Postgres VIEW is optional but not required for correctness since we already scope by enrollment IDs)

### 3.4 UI Enhancements
- Timezone becomes editable (inline Select with common timezone list)
- Each student row shows a short "reason" label (e.g., "Day match", "Slot is full", "No preferences set")
- Mismatch section continues grouping by Level and Type with slot suggestions
- Search by name/email persists

---

## Phase 4: Full Reset UI

### 4.1 Add "Full Reset" Button
- Located in Admin Dashboard settings area or at the bottom of the Matcher tab
- Opens a confirmation dialog with:
  - Warning text: "This will delete ALL users, enrollments, and assignments. This action is irreversible."
  - Password input field
  - "Cancel" and "Reset Everything" (destructive) buttons

### 4.2 Reset Flow
1. Admin clicks "Full Reset"
2. Dialog opens with warning
3. Admin types reset password
4. Calls `reset_platform_data` RPC
5. On success: shows toast, refreshes all data
6. On failure: shows error toast (wrong password or not super_admin)

---

## Phase 5: Day Normalization (Lightweight)

Rather than creating a Postgres enum (which would require migration of existing data and `ALTER TYPE` for future changes), we normalize at the application level:
- Define canonical day values as `["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]` (already in use)
- The UI day chips already enforce these exact values
- Add a validation check in the `update_student_preferences` RPC to reject invalid day strings

This avoids breaking existing data while ensuring consistency going forward.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/...` | Create `admin_audit_log`, `system_reset_log` tables + 4 RPCs |
| `src/components/admin/BulkMatcher.tsx` | Refactor to use RPCs, add 5 statuses, editable timezone, reason labels |
| `src/pages/AdminDashboard.tsx` | Add "Full Reset" button + confirmation dialog |

---

## Security Summary

- All mutations go through SECURITY DEFINER RPCs with `has_role(auth.uid(), 'admin')` checks
- Reset requires both admin role verification AND a secret password
- Every change is logged in `admin_audit_log` with before/after values
- No direct client-side table updates for destructive operations
- RLS on all new tables restricts access to admins only

