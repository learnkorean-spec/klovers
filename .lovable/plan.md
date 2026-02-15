

# Plan: Improve Student Dashboard with Enrollment-Based Attendance and Payment Tracking

## Problem
The Student Dashboard currently pulls data from the legacy `students` table (which uses `total_classes`, `used_classes`, `price_per_class`), but the real source of truth is the `enrollments` table (`sessions_total`, `sessions_remaining`, `unit_price`). The dashboard also shows incorrect "Balance Due" calculations and doesn't dynamically reflect attendance-based billing.

## Changes

### 1. Refactor StudentDashboard to use `enrollments` as primary data source
Replace the legacy `students` table query with a direct read from `enrollments` (latest APPROVED+PAID enrollment for the logged-in user). This ensures all numbers come from the same source the admin sees.

**Data fetched:**
- `sessions_total` (package size)
- `sessions_remaining` (auto-decremented by RPCs)
- `unit_price` (price per session)
- `amount` (total package price)
- `currency` (USD or EGP)
- `plan_type`, `duration`

**Computed on the frontend:**
- `total_attended = sessions_total - sessions_remaining`
- `remaining = sessions_remaining` (if >= 0, show "X sessions remaining")
- `extra_sessions = Math.abs(sessions_remaining)` (if < 0, show "X extra sessions")
- `amount_due = extra_sessions * unit_price` (only when negative)

### 2. Redesign the Package + Payment cards into a unified Summary Card
Merge the separate "Package Details" and "Payment Details" cards into one clear summary card with:
- Package info (plan type, duration, total sessions, price paid)
- A prominent stats row: Total Attended / Remaining / Extra Sessions / Amount Due
- Conditional messaging:
  - Green state: "You have X sessions remaining"
  - Red state: "You have X extra sessions. Amount due: (currency)(amount)"
- Remove the misleading legacy "Balance Due" calculation that was `remaining * price_per_class`

### 3. Keep legacy `students` table as fallback
If no enrollment is found but a `students` record exists, show the old view (backwards compatibility). If neither exists, show the "No Active Plan" card.

### 4. No database changes needed
All required data already exists in the `enrollments` table and is maintained by the existing RPCs (`approve_attendance_request`, `admin_add_attendance`). No new tables, views, or functions required.

## Technical Details

### File: `src/pages/StudentDashboard.tsx`

**Data loading changes:**
```typescript
// Fetch latest APPROVED+PAID enrollment
const { data: enrollmentData } = await supabase
  .from("enrollments")
  .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency")
  .eq("user_id", session.user.id)
  .eq("approval_status", "APPROVED")
  .eq("payment_status", "PAID")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Computed values:**
```typescript
const totalAttended = enrollment.sessions_total - enrollment.sessions_remaining;
const remaining = enrollment.sessions_remaining;
const extraSessions = remaining < 0 ? Math.abs(remaining) : 0;
const amountDue = extraSessions * enrollment.unit_price;
const currLabel = enrollment.currency === "EGP" ? "LE" : "$";
```

**UI restructure:**
- Replace the two separate Package/Payment cards with a single "My Package" card
- Add a 3-column stats row: "Attended" / "Remaining" / "Amount Due"
- Show conditional message based on `remaining` sign
- Keep the `StudentAttendanceRequest` calendar component as-is (it already reads from enrollments)
- Keep `StudentGroupAttendance` and attendance history sections

### Files Modified
1. `src/pages/StudentDashboard.tsx` -- Refactor to use enrollments data, redesign summary UI

