

## Fix: Admin Dashboard - Show Student Names and Emails

### Problem

Two issues prevent the admin from seeing user information:

1. **Wrong default subtab**: The Enrollments tab defaults to "Pending Review", but all current enrollments are APPROVED. The admin sees an empty list and thinks no data exists.
2. **No Students view**: There is no dedicated tab to see all registered users (profiles). The admin can only see users who have enrollments or attendance requests.

### Solution

**1. Add a "Students" tab to the admin dashboard**

Add a new top-level tab called "Students" that displays all registered profiles from the database in a table format:
- Columns: Name, Email, Country, Level, Credits, Status, Joined date
- This gives the admin a complete view of all signed-up users regardless of enrollment status.

**2. Change default enrollment subtab to "approved"**

Since most enrollments will be approved, default to showing the "Approved" subtab instead of "Pending Review" so the admin immediately sees active data.

**3. Add student count badges to tabs**

Show counts on tab triggers (e.g., "Students (3)", "Enrollments (2)") so the admin can quickly see which tabs have data.

### Technical Details

**File changed**: `src/pages/AdminDashboard.tsx`

- Add `Students` to the top-level `TabsList` (before Enrollments)
- Create a `TabsContent` for students that renders a `Table` listing all profiles from `profilesRes.data`
- Store profiles in a new `profiles` state array (currently only stored as a map)
- Change `<Tabs defaultValue="pending">` to `<Tabs defaultValue="approved">` inside Enrollments
- Add count badges to each tab trigger using the existing data arrays

No database or RLS changes needed -- the admin already has SELECT access to the profiles table.
