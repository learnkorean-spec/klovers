

# Fix Yellow Color Visibility on Student Dashboard

## Problem
The yellow primary color (#FFFF00) lacks contrast against white backgrounds, making several UI elements nearly invisible: legend dots, stepper connectors, calendar highlights, and badge backgrounds. The screenshot shows washed-out yellow elements that are hard to distinguish.

## Solution
Add borders, shadows, and slightly darker yellow tones to all yellow-on-white elements for better definition while keeping the yellow brand identity.

## Technical Details

### File: `src/components/StudentAttendanceRequest.tsx`

**Legend dots** — Add a dark border ring so the yellow dot is visible on white:
```tsx
<span className="w-3 h-3 rounded-full bg-primary border border-foreground/30" />
```
Apply the same treatment to the "Pending" and "Rejected" legend dots for consistency.

### File: `src/components/JourneyStepper.tsx`

**Completed step circles** — Add a dark border for definition:
```tsx
// Completed: add border
"bg-primary text-primary-foreground shadow-md border-2 border-foreground/20"

// Current: already has border-primary, darken slightly
"border-2 border-primary text-foreground bg-primary/20 shadow-sm"
```

**Connector bars** — Make the filled portion slightly more visible:
```tsx
// Background track
"bg-muted border border-border"

// Filled portion — use a darker yellow
"bg-primary border border-foreground/10"
```

**Step labels** — Use `text-foreground` for completed/current labels instead of `text-primary` (yellow text on white is unreadable):
```tsx
isCurrent ? "font-semibold text-foreground" : isCompleted ? "font-medium text-foreground" : "text-muted-foreground"
```

### File: `src/components/ui/calendar.tsx`

**Today cell** — The accent background is too light. Add a ring for definition:
```tsx
day_today: "bg-accent text-accent-foreground ring-1 ring-primary/50 font-bold",
```

### File: `src/pages/StudentDashboard.tsx`

**Stats grid cards** — The `bg-accent/50` and `bg-primary/10` backgrounds are nearly invisible. Add borders:
```tsx
// Package/Used cells
"rounded-lg bg-accent/50 border border-primary/20 p-3 text-center"

// Remaining cell (positive)
"rounded-lg bg-primary/10 border border-primary/30 p-3 text-center"
```

**Status messages** — Ensure the green/positive message has enough contrast:
```tsx
// Positive remaining banner
"flex items-center gap-2 text-sm text-foreground bg-primary/10 border border-primary/30 rounded-lg p-2"
```

### Summary of changes
- `src/components/JourneyStepper.tsx` — borders on circles, dark labels, thicker connectors
- `src/components/StudentAttendanceRequest.tsx` — bordered legend dots
- `src/components/ui/calendar.tsx` — ring on today cell
- `src/pages/StudentDashboard.tsx` — borders on stats cards and status banners

All changes are CSS class additions only. No logic changes. Yellow stays as the primary color throughout.

