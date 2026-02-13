

## Fix: Students Tab Missing Profile Data

### Problem
The Students tab currently fetches incomplete profile data — only `user_id, name, email, credits`. This means the Country, Level, Status, and Joined date columns are either empty or broken. The Students tab should display the same richness of data as the Leads tab.

### Changes

**File: `src/pages/AdminDashboard.tsx`**

1. **Fix the profiles query** to fetch all fields: change  
   `supabase.from("profiles").select("user_id, name, email, credits")`  
   to  
   `supabase.from("profiles").select("user_id, name, email, credits, country, level, status, created_at")`

2. **Update the profileMap type** to include the new fields (`country`, `level`, `status`, `created_at`) so they propagate correctly to enrollment and attendance records.

3. **Add a search bar** to the Students tab (matching the Leads tab pattern) so admins can filter students by name or email.

4. **Add an Export CSV button** for the Students tab so admins can download student data just like they can for leads.

This ensures registered users show their complete data (country, level, credits, status, join date, payment source) in the Students tab, fully matching the data richness of the Leads tab.

### Technical Details

- The `profiles` state type at line 47 already declares `country`, `level`, `status`, `created_at` but the query at line 60 does not fetch them -- this is the root bug.
- The table columns at lines 260-268 already render these fields, they just appear blank because the data is never fetched.
- Adding search + export follows the exact same pattern already used in the Leads tab (lines 90-106).
