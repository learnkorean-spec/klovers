
# P0 Fix: Package-Driven GroupMatcher + Strict Slot Mapping

## Problem
GroupMatcher clusters students by `preferred_days + preferred_start` WITHOUT considering level, causing mixed-level groups. It also ignores enrollments that have `package_id` but no `preferred_days`.

## Solution

### 1. DB Migration: Strict matching_slots.package_id backfill + index

The `matching_slots` table already has `package_id` (uuid column exists). Since there are currently zero rows in `matching_slots`, the migration only needs:
- Add an index on `matching_slots(package_id)` for performance
- Add a composite index on `schedule_packages(level, day_of_week, start_time, timezone)` for fast lookups
- Strict backfill UPDATE that matches on `level + day_of_week + start_time + timezone` (for any future rows)

### 2. Rewrite GroupMatcher.tsx to be package-driven

**Data model changes:**
- `UnmatchedEnrollment` interface: add `package_id` field
- New `Cluster` interface: replace `days/start` with `package_id`, `package_level`, `package_day`, `package_time`

**Fetch logic:**
- Select `package_id` alongside existing fields
- Remove the filter `not("preferred_days", "is", null)` -- instead fetch ALL unmatched group enrollments
- For each enrollment, determine its cluster key:
  - If `package_id` exists: `clusterKey = "pkg:<package_id>"`
  - If no `package_id` but has valid `level + preferred_day`: try to resolve a schedule_package match and use that
  - If neither: mark as "Needs Review" (separate list, not grouped)

**Clustering:**
- Remove the old multi-day merge logic entirely
- Simple single-pass: group by cluster key
- Level comes from the package (fetched via schedule_packages), never from "first member"
- Fetch schedule_packages data upfront to enrich clusters with day/time/level info

**`normalizeLevel` helper:**
```typescript
const normalizeLevel = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "_");
```

**Group creation (`handleCreateGroup`):**
- Already uses `assign_student_to_group` RPC -- keep this
- Package lookup now uses `cluster.packageId` directly instead of searching by level+day
- Remove the fallback "create schedule_package" logic when packageId is known

**UI additions:**
- "Needs Review" section at the bottom showing enrollments that lack package_id and valid level/day
- Each shows the reason: "Missing package assignment"
- Cluster cards show level badge derived from package, not from member

### 3. Remove preferred_days[] dependency from GroupMatcher

- Stop using `preferred_days` array for clustering
- Use `package_id` (primary) or `preferred_day` singular (fallback for resolving package)
- The old multi-day overlap-merge logic is deleted entirely

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/new.sql` | Add indexes for matching_slots.package_id and schedule_packages lookup composite; strict backfill query |
| `src/components/admin/GroupMatcher.tsx` | Full rewrite of clustering logic to be package-driven; add Needs Review section; remove preferred_days[] usage |

### Technical Details

**New clustering algorithm:**
```text
1. Fetch all unmatched enrollments (APPROVED, group, matched_at IS NULL)
2. Fetch all active schedule_packages (for enrichment)
3. For each enrollment:
   a. If package_id exists -> key = "pkg:<id>"
   b. Else if level + preferred_day exist -> find matching schedule_package -> key = "pkg:<id>"
   c. Else -> add to needsReview list
4. Group by key -> each cluster guaranteed single-level, single-package
5. Display with package-derived metadata (level, day, time)
```

**Needs Review UI:**
- Shown below the main clusters
- Each row shows student name, email, and reason
- Admin can manually assign package_id via enrollment editing (existing flow)
