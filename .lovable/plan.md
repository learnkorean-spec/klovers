

## Problem

The private reminder email's CTA button ("Complete Your Info Now") links to `/dashboard/schedule`, but the student lands on the page and has to manually click "Pick a Day & Time" to open the schedule picker. The flow should be seamless: click email CTA → land on page → picker auto-opens → student picks and saves.

## Plan

### 1. Update email CTA link to include auto-open param

**File**: `supabase/functions/send-private-reminder/index.ts`
- Change the CTA link from `${DASHBOARD_URL}/schedule` to `${DASHBOARD_URL}/schedule?autoOpen=private`
- This signals the schedule page to auto-open the picker in "private" mode

### 2. Auto-open the schedule picker on MySchedulePage

**File**: `src/pages/MySchedulePage.tsx`
- Read `autoOpen` search param on mount
- If `autoOpen=private`, automatically set `showPicker = true` and `selectedCourseType = "private"` once loading completes
- This skips the "choose class type" step and goes straight to picking private slots
- Clear the param from the URL after consuming it to prevent re-triggering on refresh

This is a minimal two-file change that creates a seamless email → pick schedule → save flow for private students.

