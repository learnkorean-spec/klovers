

## Add Remaining Balance and Classes to Student Dashboard

### What's Being Added
Two new highlighted fields in the Payment Details card:

1. **Remaining Classes** -- calculated as `total_classes - used_classes`
2. **Amount Still Owed** -- calculated as `remaining_classes * price_per_class` (the cost of unused classes)

### Where
In the **Payment Details** card in `src/pages/StudentDashboard.tsx`, add two new grid items after the existing fields:

- **"Remaining Classes"**: Shows `total_classes - used_classes` with a visual highlight (e.g., bold color or badge) so it stands out
- **"Balance Due"**: Shows `(total_classes - used_classes) * price_per_class` formatted as currency -- this tells the student how much value remains in their package

### Technical Detail
No database changes needed. Both values are computed from existing `students` table fields (`total_classes`, `used_classes`, `price_per_class`). The change is purely in the Payment Details card UI within `StudentDashboard.tsx`.

