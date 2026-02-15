

## Admin Dashboard UI Redesign

Pure visual/layout changes -- no logic, data fetching, or action handlers are modified.

### 1. Header Bar
- Replace current loose flex wrapper with a compact sticky header bar
- Add `border-b` separator, reduce padding to `py-3 px-4`
- Title left, Logout button right, tighter spacing

### 2. LifecycleFunnel (separate component file)
- Remove the arrows between stages
- Switch from single flex row to a responsive CSS grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`
- Each metric becomes a small standalone card (icon + number + label) with reduced height
- Remove the wrapping Card -- use individual mini-cards or just styled divs

### 3. Main Tabs (scrollable + badge cleanup)
- TabsList gets: `w-full overflow-x-auto flex gap-1 whitespace-nowrap`
- Each TabsTrigger: `shrink-0 rounded-full px-3 py-1.5 text-sm`
- Remove the stacked "Action needed" / "Pending" text under the red badge dots
- Keep only the small red Badge circle with count, positioned inline (right side of trigger text)

### 4. Students Tab Filters (responsive)
- Desktop: keep as horizontal TabsList with same scrollable treatment as main tabs
- Mobile: replace nested Tabs with a `Select` dropdown (All / Confirmed / Leads / Stripe / Egypt Manual) using `useIsMobile()` hook
- Counts still shown in parentheses

### 5. Search + Export Row
- Desktop: single clean row (`flex gap-2`)
- Mobile: stacked (`flex-col`)
- Export button: icon-only (`size="icon"`) on mobile, full text on desktop -- controlled via `useIsMobile()`

### 6. Table Improvements
- Reduce cell padding: override TableCell/TableHead with `py-2 px-3`
- Email column: add `max-w-[220px] truncate` with a Tooltip wrapper showing full email on hover
- Add zebra striping: `even:bg-muted/30` on TableRow
- Add hover: `hover:bg-muted/50` (already partially present)
- Sticky header: wrap table in a `max-h-[600px] overflow-auto` div, TableHeader row gets `sticky top-0 bg-background z-10`

### Files Changed

| File | What changes |
|------|-------------|
| `src/pages/AdminDashboard.tsx` | Header, TabsList classes, badge layout, Students filter responsive logic, search/export row, table styling, import `useIsMobile` and `Tooltip` |
| `src/components/admin/LifecycleFunnel.tsx` | Grid layout, remove arrows, mini-card style per metric |

### Technical Notes
- Import `useIsMobile` from `@/hooks/use-mobile`
- Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` for email truncation
- All changes are className / layout only -- zero logic changes
- Enrollment cards, attendance cards, and other tab contents keep their current structure

