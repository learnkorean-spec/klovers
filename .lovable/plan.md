
## Fix: Progress Stepper Hidden Behind Fixed Header

The progress stepper on the `/enroll-now` page is being clipped by the fixed-position header because the main content area doesn't account for the header's height.

### Change

**File: `src/pages/EnrollNowPage.tsx` (line 106)**

Add `pt-24` (top padding) to push content below the fixed header, replacing the current `py-12`:

```
// Before
<main className="container mx-auto px-4 py-12 max-w-2xl">

// After
<main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
```

This adds 96px of top padding (enough to clear the 64px header plus spacing) while keeping 48px bottom padding.
