# Integration Guide: Student Preference Step

## Overview
This guide explains how to integrate the `StudentPreferenceStep` component into the `EnrollNowPage` component to add a required day/time preference selection step before payment.

## Current Architecture
- **EnrollNowPage**: 1000+ line multi-step enrollment form with steps 1, 2, 3
  - Step 1: Level + Country + Duration selection
  - Step 2: Schedule/Package picker
  - Step 3: Payment confirmation
- **Type Definition** (line 29): `type Step = 1 | 2 | 3;`

## Changes Required

### 1. Update Step Type Definition
**File**: `src/pages/EnrollNowPage.tsx` (line 29)

Change:
```typescript
type Step = 1 | 2 | 3;
```

To:
```typescript
type Step = 1 | 2 | 3 | 4;
```

### 2. Add Import
**File**: `src/pages/EnrollNowPage.tsx` (after other imports, around line 26)

Add:
```typescript
import StudentPreferenceStep from "@/components/StudentPreferenceStep";
```

### 3. Add State Variables
**File**: `src/pages/EnrollNowPage.tsx` (around line 100, after `selectedGroupName`)

Add:
```typescript
// Student preference for scheduling
const [preferredDayOfWeek, setPreferredDayOfWeek] = useState<number | null>(null);
const [preferredStartTime, setPreferredStartTime] = useState<string>("");
```

### 4. Add Step Navigation Handler
**File**: `src/pages/EnrollNowPage.tsx` (after other handler functions)

Add:
```typescript
const handlePreferenceSubmit = (day: number, time: string) => {
  setPreferredDayOfWeek(day);
  setPreferredStartTime(time);
  setStep(4); // Move to payment step
};
```

### 5. Update Payment Handler (handlePay function)
**File**: `src/pages/EnrollNowPage.tsx` (locate the `handlePay` function)

Before the final RPC call or before sending enrollment data, include:
```typescript
// Pass preferred day/time when submitting enrollment
const enrollmentData = {
  // ... existing fields
  preferred_day_of_week: preferredDayOfWeek,
  preferred_start_time: preferredStartTime,
  // ... other fields
};
```

Or use the new RPC function:
```typescript
const result = await supabase.rpc('submit_enrollment_with_preference', {
  p_user_id: userId,
  p_plan_type: classType,
  p_duration: duration,
  p_classes_included: durationClasses[duration!],
  p_amount: finalPrice,
  p_unit_price: unitPrice,
  p_payment_provider: 'stripe',
  p_stripe_payment_intent_id: paymentIntent.id,
  p_level: selectedLevel,
  p_preferred_day_of_week: preferredDayOfWeek,
  p_preferred_start_time: preferredStartTime,
});
```

### 6. Add Step UI (Render Step 3 - Preference Selection)
**File**: `src/pages/EnrollNowPage.tsx` (after the `{step === 2 && ...}` block, around line 881)

Add before the existing `{step === 3 && ...}` block:
```typescript
{step === 3 && (
  <StudentPreferenceStep
    onBack={() => setStep(2)}
    onNext={handlePreferenceSubmit}
    loading={loading}
    userLevel={selectedLevel}
  />
)}
```

### 7. Update Step Counter Display
**File**: `src/pages/EnrollNowPage.tsx` (locate the step progress indicator)

Update any hardcoded "3 steps" references to "4 steps"

Change lines around step indicators:
```typescript
// Before:
{[1, 2, 3].map((i) => (

// After:
{[1, 2, 3, 4].map((i) => (
```

### 8. Shift Payment Step to Step 4
**File**: `src/pages/EnrollNowPage.tsx` (locate `{step === 3 && ...}` block)

Change:
```typescript
{step === 3 && (
```

To:
```typescript
{step === 4 && (
```

## Testing Checklist

After making these changes, verify:

- [ ] Step 1 loads and user can select level/country/duration
- [ ] Step 2 loads and user can select schedule package
- [ ] "Next" button on Step 2 takes user to Step 3 (new preference step)
- [ ] Step 3 shows day/time selectors
- [ ] Time dropdown dynamically loads from teacher_availability table
- [ ] Form requires both day and time selection
- [ ] "Continue to Payment" button on Step 3 moves to Step 4
- [ ] Step 4 (payment) loads with all enrollment data intact
- [ ] Payment submission includes preferred_day_of_week and preferred_start_time
- [ ] Student preferences are saved to database after successful payment
- [ ] Step progress indicator shows 4/4 steps correctly
- [ ] Mobile responsive: all inputs work on small screens

## Database Requirements

Ensure these migrations have been run:
1. `20260320020020_teacher_availability_and_student_preferences.sql` — Creates teacher_availability table and adds columns to student_package_preferences
2. `20260320020021_preference_trends_rpc.sql` — Creates RPC function for preference trends
3. `20260320020022_enrollment_preference_rpc.sql` — Creates enrollment RPC functions with preference support

## Rollback Plan

If issues occur:
1. Remove StudentPreferenceStep import and component render
2. Change Step type back to `1 | 2 | 3`
3. Rename `{step === 4 && ...}` back to `{step === 3 && ...}`
4. Remove state variables for preferredDayOfWeek and preferredStartTime
5. Remove the handlePreferenceSubmit function

## Notes

- The StudentPreferenceStep is fully functional and self-contained
- It handles loading teacher availability times dynamically
- Time dropdown updates when user changes selected day
- Form validation prevents submission without both day and time
- Component matches existing UI patterns (Button, Select, RadioGroup from shadcn/ui)
