

## Fix 2 Remaining Warn-Level Security Issues

### Issue 1: Remove "Anyone can submit leads" RLS Policy

The `leads` table currently has a permissive INSERT policy for anonymous users. Since the `submit-lead` backend function now handles all lead submissions using the service role key (which bypasses RLS), this public INSERT policy is unnecessary and a security risk.

**Fix:** Run a database migration to drop this policy.

```sql
DROP POLICY "Anyone can submit leads" ON public.leads;
```

### Issue 2: Enable Leaked Password Protection

The authentication system currently does not check submitted passwords against known leaked/breached password databases. Enabling this adds a layer of protection against credential stuffing.

**Fix:** Use the configure-auth tool to enable the `hibp` (Have I Been Pwned) leaked password protection setting.

### Technical Steps

1. **Database migration** -- single SQL statement to drop the RLS policy
2. **Auth configuration** -- enable leaked password protection via the auth config tool
3. **Delete resolved security findings** from the scan results

No code file changes are needed.

