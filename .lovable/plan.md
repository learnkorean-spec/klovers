

## Plan: Merge Student Data on Manual Add by Email

### Problem
When an admin adds a student manually in the "Legacy Manual" tab, the system does a basic upsert on the `students` table but does NOT pull in existing data from other tables (`profiles`, `enrollments`, `leads`, `admin_student_overview`). If a student already registered and paid, their enrollment data (plan type, classes, payment info) is lost when manually adding by name.

### What Changes

**1. Auto-populate form when email matches existing data**
- When the admin types an email in the "Add Student" dialog and tabs/blurs out, automatically look up:
  - `profiles` table (name, country, level)
  - `admin_student_overview` view (plan_type, sessions_total, amount, payment_status, currency)
  - `leads` table (goal, schedule, timezone)
- Pre-fill the form fields with found data so the admin sees what already exists before saving

**2. Merge enrollment data into students table on save**
- When saving a new student whose email matches an existing enrollment (from `admin_student_overview`), automatically populate:
  - `course_type` from `plan_type`
  - `package_name` from plan_type + duration
  - `total_classes` from `sessions_total`
  - `total_paid` from `amount`
  - `price_per_class` from `unit_price`
  - `payment_status` from enrollment payment status
- Also sync the lead status to "enrolled" if a lead record exists

**3. Smart merge logic**
- Only overwrite empty/default fields -- if the admin typed a value, keep it
- Show a toast confirming what data was merged

### Technical Details

**File: `src/components/admin/StudentManager.tsx`**

- Add an `onBlur` handler on the email input in the Add Student dialog
- On blur, query `profiles`, `admin_student_overview`, and `leads` by email
- Merge found data into `studentForm` state (only fill empty fields)
- In `handleSaveStudent`, when inserting/upserting, enrich the payload with enrollment data from `admin_student_overview`
- After save, update the matching `leads` record status to "enrolled" if one exists

**No database changes needed** -- all tables and views already exist with proper RLS policies for admin access.
