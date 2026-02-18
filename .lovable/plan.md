
## Update Group Attendance: Restrict Dates to Package day_of_week

### Current State Analysis

**File**: `src/components/admin/GroupAttendanceManager.tsx`

The component currently:
- Fetches groups from `student_groups` (legacy table with `schedule_day` as free-text string, e.g. `"Friday"`)
- Uses a plain `<Input type="date">` with no restrictions — admin can pick any date
- Has no link to `schedule_packages` or `pkg_groups`

The `pkg_groups` table has a `package_id` column that links to `schedule_packages`, which has `day_of_week` (integer, 0=Sun to 6=Sat), `start_time`, and `timezone`.

The `group_sessions` table is where new sessions are created (this is what the component writes to — distinct from `pkg_group_sessions`).

---

### Implementation Plan

#### 1. New State & Interface

Add a new `GroupPackageInfo` interface:
```typescript
interface GroupPackageInfo {
  package_id: string | null;
  day_of_week: number | null;  // 0 = Sunday … 6 = Saturday
  start_time: string | null;   // "18:00:00"
  timezone: string | null;
}
```

Add state:
```typescript
const [groupPackageInfo, setGroupPackageInfo] = useState<GroupPackageInfo | null>(null);
```

#### 2. Fetch Package Info on Group Select

When `selectedGroup` changes, run a joined query:

```typescript
// Try pkg_groups first (new system)
const { data } = await supabase
  .from("pkg_groups")
  .select("package_id, schedule_packages(day_of_week, start_time, timezone)")
  .eq("id", selectedGroup)
  .maybeSingle();
```

If `pkg_groups` has no row for this group (legacy `student_groups` group), fall back to parsing the group's `schedule_day` string (e.g. `"Friday"`) into a `day_of_week` integer using `DAY_NAMES.indexOf()`.

Store the result in `groupPackageInfo`.

#### 3. Next-Valid-Date Helper

Add a pure function:

```typescript
function nextOccurrenceOf(dayOfWeek: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff === 0 ? 7 : diff)); // next future occurrence (not today)
  return next;
}
```

When `groupPackageInfo` is set and has a valid `day_of_week`, call this to auto-set `sessionDate`.

#### 4. Replace Input with Calendar (react-day-picker)

Remove the `<Input type="date">` and replace with the existing `<Calendar>` component:

```typescript
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Disable all days that don't match the package day_of_week
const disabledDays = groupPackageInfo?.day_of_week != null
  ? [{ dayOfWeek: [0,1,2,3,4,5,6].filter(d => d !== groupPackageInfo.day_of_week) }]
  : undefined;

<Calendar
  mode="single"
  selected={sessionDate ? new Date(sessionDate + "T00:00:00") : undefined}
  onSelect={(d) => d && setSessionDate(format(d, "yyyy-MM-dd"))}
  disabled={disabledDays}
  className="rounded-md border"
/>
```

Also add an info badge above the calendar when a group is selected:

```
📅 Friday · 18:00 · Africa/Cairo
(Only Fridays can be selected)
```

#### 5. Validate in `createSession`

Before inserting, add a guard:

```typescript
if (groupPackageInfo?.day_of_week != null) {
  const chosen = new Date(sessionDate + "T00:00:00");
  if (chosen.getDay() !== groupPackageInfo.day_of_week) {
    const dayName = DAY_NAMES[groupPackageInfo.day_of_week];
    toast({
      title: "Invalid date",
      description: `This group can only meet on ${dayName} (${formatTime(groupPackageInfo.start_time)} ${groupPackageInfo.timezone ?? ""}).`,
      variant: "destructive",
    });
    return;
  }
}
```

#### 6. Time Formatting Helper

Add a small helper to format `start_time` from `"18:00:00"` to `"6:00 PM"`:

```typescript
function formatStartTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
```

---

### File to Change

**`src/components/admin/GroupAttendanceManager.tsx`** — Single file change:

- Add `GroupPackageInfo` interface
- Add `groupPackageInfo` state
- Add `nextOccurrenceOf` and `formatStartTime` helpers
- Add `useEffect` on `selectedGroup` to fetch package info from `pkg_groups` → `schedule_packages`, with fallback to `student_groups.schedule_day` string
- Auto-set `sessionDate` to next valid date when package info loads
- Replace `<Input type="date">` with `<Calendar>` using `disabled` prop
- Add availability info badge (day + time + timezone)
- Add validation in `createSession` before DB insert
- Add `Calendar` and `format` imports

No database migrations needed — reads existing `pkg_groups` and `schedule_packages` data via a join.

---

### Edge Cases

| Scenario | Behavior |
|---|---|
| Group has no `pkg_groups` row (legacy group) | Falls back to `student_groups.schedule_day` string to derive `day_of_week`; if still empty, calendar is unrestricted |
| Group's `package_id` is null | Calendar unrestricted, no info badge shown |
| Admin tries to pick a non-matching day via keyboard | Calendar `disabled` prop prevents selection; validation in `createSession` is a safety net |
| Today is the same day as the group's day | Auto-selects the NEXT week's occurrence (not today, to avoid accidental same-day session creation) |
