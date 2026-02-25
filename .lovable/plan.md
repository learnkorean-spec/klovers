

## Plan: 3 Targeted Fixes for GroupMatcher and Payment Approver

### FIX 1 — PaymentApprover redirects to Matcher for group enrollments

**Problem**: PaymentApprover in `EnrollmentChecklist.tsx` only updates `payment_status` and `approval_status` but doesn't redirect admin to GroupMatcher tab for group enrollments. Also, `EnrollmentChecklistManager` is not even used in AdminDashboard currently.

**Note**: `EnrollmentChecklistManager` is exported but never imported/rendered in `AdminDashboard.tsx`. Since the PaymentApprover is only accessible through this component (via `ChecklistPanel`), FIX 1 only matters if/when the checklist component gets integrated. However, we'll still wire it up for future use.

**Changes**:

1. **`src/components/admin/EnrollmentChecklist.tsx`**:
   - Modify `PaymentApprover` props: add `planType: string` and replace `onSaved` with `onApproved: () => void`
   - In `approve()`: also set `status: "APPROVED"` alongside `payment_status: "PAID"` and `approval_status: "APPROVED"`
   - Add `setAdminTab` optional prop to `EnrollmentChecklistManager`
   - Pass `setAdminTab` down through `ChecklistPanel` to `PaymentApprover`'s callback — when plan_type is "group" and `setAdminTab` exists, call `setAdminTab("group-matcher")`
   - Thread the `plan_type` from `ChecklistData` through to the `PaymentApprover` render call

2. **`src/pages/AdminDashboard.tsx`**: No change needed right now since `EnrollmentChecklistManager` is not rendered. If it gets added later, `setAdminTab` should be passed as a prop.

### FIX 2 — GroupMatcher must not mark matched_at for failed assignments

**Problem**: `handleCreateGroup()` updates `matched_at` for ALL enrollment IDs even if the RPC `assign_student_to_group` fails for some.

**Changes in `src/components/admin/GroupMatcher.tsx`**:
- Track `successIds` and `failedNames` arrays during the assignment loop
- Only call `.update({ matched_at: nowISO }).in("id", successIds)` for successful ones
- Show a warning toast if any failed, listing the count
- Only send emails for successful members

### FIX 3 — Save custom group name to pkg_groups

**Problem**: `groupNameInput` is used only in emails/toasts; the actual `pkg_groups.name` stays as the RPC-generated default.

**Key insight**: The `assign_student_to_group` RPC returns `jsonb` with `group_id` field. We can capture this from the first successful assignment.

**Changes in `src/components/admin/GroupMatcher.tsx`**:
- After the assignment loop, capture `group_id` from the first successful RPC result data
- If `groupNameInput` is non-empty and `group_id` exists, update `pkg_groups` set `name = groupNameInput` where `id = group_id`
- This runs once per "Create Group" action

### Files Modified
- `src/components/admin/EnrollmentChecklist.tsx` (FIX 1)
- `src/components/admin/GroupMatcher.tsx` (FIX 2 + FIX 3)

### Technical Details

**FIX 1 — EnrollmentChecklist.tsx edits**:
- `PaymentApprover` signature changes from `{ enrollmentId, onSaved }` to `{ enrollmentId, planType, onSaved }`
- `approve()` update payload adds `status: "APPROVED"`
- After successful approve, calls `onSaved()` as before
- In `ChecklistPanel`, when `handleSaved` fires from PaymentApprover, check `data.plan_type === "group"` and call `setAdminTab?.("group-matcher")`
- `EnrollmentChecklistManager` gains optional `setAdminTab?: (tab: string) => void` prop, threaded to `ChecklistPanel`

**FIX 2 — GroupMatcher.tsx handleCreateGroup() changes**:
```text
Before:
  for each member -> call RPC (ignore errors)
  update matched_at for ALL enrollmentIds

After:
  successIds = [], failedNames = []
  for each member:
    call RPC
    if error -> push to failedNames
    else -> push member.id to successIds, capture group_id from first success
  if successIds.length > 0:
    update matched_at for successIds only
  if failedNames.length > 0:
    show warning toast
```

**FIX 3 — GroupMatcher.tsx group name save**:
```text
After assignment loop:
  if (capturedGroupId && groupNameInput.trim()):
    await supabase.from("pkg_groups")
      .update({ name: groupNameInput.trim() })
      .eq("id", capturedGroupId)
```

The RPC `assign_student_to_group` returns `{ status, group_id, group_name }` — we extract `group_id` from the first successful call's `data`.

