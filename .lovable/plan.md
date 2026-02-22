

## Remove Bulk Slot Matcher, Keep Group Matcher

### What's Changing
Remove only the **Bulk Slot Matcher** card from the Matcher tab. The **Group Matcher** (which clusters unmatched students and lets you create groups) stays.

### Why Remove It
The Bulk Slot Matcher was tied to the old `matching_slots` table. Student assignment now happens through the Scheduling > Groups tab using `pkg_groups`, making it redundant.

### Technical Steps

1. **Edit `src/pages/AdminDashboard.tsx`**
   - Remove the `BulkMatcher` import
   - Remove the `<BulkMatcher>` component from the Matcher tab content
   - Keep the `<GroupMatcher>` component in that tab

2. **Delete `src/components/admin/BulkMatcher.tsx`**
   - This file is no longer used anywhere

### What Stays
- The **Matcher tab** remains in the dashboard
- The **Group Matcher** card stays, allowing admins to cluster unmatched enrollments and create groups
- No database changes needed

