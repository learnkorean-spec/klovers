

## Plan: Editable Leads + Confirmed-Only "Our Students"

### What Changes

**1. Make lead records editable inline**
- Add an **Edit** button (pencil icon) to each row in the "Our Students" tab
- Clicking Edit opens an inline editing mode or a dialog where the admin can modify: name, email, country, plan_type, duration, schedule, timezone, and status
- Save updates to the `leads` table via Supabase
- Cancel button to discard changes

**2. Fix "Our Students" tab to show only confirmed students**
- Rename the current "Our Students" tab logic so it filters leads to show **only** those with status "enrolled" or who have a matching PAID+APPROVED enrollment (from Stripe or manual Egypt payment)
- Cross-reference leads with the `admin_student_overview` view to check if a lead's email matches a confirmed enrollment
- Add a separate sub-filter or keep the existing status filter so admins can still browse

**3. Lifecycle funnel sync**
- The "Enrolled" count in the funnel will reflect only paid/confirmed students
- "Leads" count reflects prospects who haven't paid yet

### Technical Details

**File: `src/pages/AdminDashboard.tsx`**

- Add `editingLeadId` state and `editForm` state to track which lead is being edited
- Add `handleEditLead` function to save updates to the `leads` table
- Add pencil icon button in each table row that toggles edit mode
- In edit mode, table cells become input fields / select dropdowns
- Filter the "Our Students" tab: enrich leads with enrollment status from `admin_student_overview`, and by default show only leads whose email matches a PAID+APPROVED enrollment OR whose status is "enrolled"
- Keep the status filter dropdown so admins can switch to see "all", "new", "contacted", etc.

**No database changes needed** - the `leads` table already supports admin UPDATE via RLS policy.
