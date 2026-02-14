

## Approve a Test Enrollment for Calendar Testing

### What We'll Do
Run a data update to mark the most recent enrollment for user `b4e727d8-d008-41d1-8e8d-09fefe286b87` (elshrkawyhossam@gmail.com) as APPROVED and PAID, so the calendar becomes fully interactive for testing.

### Change
A single SQL update (no schema change):

```sql
UPDATE enrollments
SET approval_status = 'APPROVED',
    payment_status = 'PAID',
    status = 'APPROVED'
WHERE id = '1fe3ba62-6001-46e8-8906-1f4ce3a1756c';
```

This is the most recent enrollment (private, 6-month plan). After this, the student dashboard calendar will be fully clickable for that account.

### Note
The previous code change already relaxed the enrollment filter, so the calendar should work with any enrollment status. But approving one ensures the full end-to-end flow (including the `sync_student_on_approval` trigger) fires correctly, giving the student a complete record.
