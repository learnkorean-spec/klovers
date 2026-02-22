

# Actionable "Complete Your Registration" Banner

## What changes

The Student Dashboard already detects missing information (preferred days, timezone, Korean level, country, name) and shows a red alert. However, the alert only lists items passively with "Please contact us." Students don't know where to go or what to do.

### Changes to Student Dashboard (`src/pages/StudentDashboard.tsx`)

1. **Replace passive alert with an actionable "Complete Registration" card** that has a progress indicator (e.g., "3 of 5 steps complete") and individual fix buttons for each missing item.

2. **Each missing item gets a direct action:**
   - **Full name** -- inline text input + save button (updates `profiles.name`)
   - **Korean level** -- inline dropdown (Beginner/Intermediate/Advanced) + save (updates `profiles.level`)
   - **Country** -- inline text input + save (updates `profiles.country`)
   - **Preferred class days** -- "Go to My Schedule" button linking to `/dashboard/schedule` where the SchedulePicker already handles this
   - **Timezone** -- inline dropdown of common timezones + save (updates `enrollments.timezone`)

3. **Visual urgency:** The card uses a warning/amber style (not destructive red) with a clear title: "Complete these steps to finalize your registration." Each completed item shows a green checkmark; incomplete items show an orange circle.

4. **After saving any field inline**, the item updates to "completed" with a checkmark immediately (optimistic UI + actual DB write).

5. **Block journey stepper progression:** The `JourneyStepper` stays at stage 1 ("Registration") instead of stage 2 when there are missing blockers (preferred days or level), making it clear the student hasn't completed registration yet.

### Changes to My Schedule Page (`src/pages/MySchedulePage.tsx`)

6. **No schedule selected state improvement:** When a student arrives at `/dashboard/schedule` with no schedule preference, show a more prominent call-to-action explaining they need to pick a day/time to complete registration, rather than just a small "No schedule selected yet" text.

### Technical Details

**Files to modify:**
- `src/pages/StudentDashboard.tsx` -- replace passive alert with interactive completion card; add inline editors for name, level, country, timezone; adjust JourneyStepper stage based on completion
- `src/pages/MySchedulePage.tsx` -- improve empty-state messaging for students arriving to fix their missing schedule

**Database writes (using existing RLS -- no migration needed):**
- `profiles` table: users can already update their own profile (name, level, country)
- `enrollments` table: users can already update their own enrollments (timezone, preferred_days)

**No new dependencies or database changes required.**

