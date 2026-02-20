

# Fix Authentication for All Users

## Problem

There are two root causes blocking users from signing in:

1. **Missing profiles**: 12+ users exist in the authentication system but have NO profile record. When they log in, the app checks their profile for a `reset_version` field, finds nothing, and immediately signs them out with a "System was reset" message -- even though they already have valid accounts.

2. **Aggressive reset gate**: The `useResetGate` hook signs users OUT and redirects to the signup page instead of auto-healing their profile. This creates a dead loop: user logs in, gets kicked out, tries to sign up, gets "already registered" error.

## Solution

### Step 1: Fix existing data (Database)
Create missing profile rows for all 12+ users who have auth accounts but no profile:

```sql
INSERT INTO profiles (user_id, name, email, reset_version)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  '1'
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
```

### Step 2: Make reset gate self-healing (Code change)
Change `useResetGate.ts` so that instead of signing users out when their `reset_version` is wrong or missing, it **automatically updates** their profile to the current version. This means:
- If a profile exists but has wrong version --> update it
- If no profile exists --> create one
- User stays logged in, no more dead loops

### Step 3: Fix LoginPage post-login logic (Code change)
Update `LoginPage.tsx` to also ensure the profile exists before proceeding. After a successful login, if no profile row exists, create one with the correct reset version. This catches edge cases where the trigger didn't fire (e.g., OAuth users created before the trigger was added).

### Step 4: Fix SignUpPage for "already registered" users
Update the signup error handling so that when a user gets the "already registered" error, the message clearly tells them to use the **Log In** page instead, with a direct link.

---

### Technical Details

**Files to modify:**
- `src/hooks/useResetGate.ts` -- auto-heal instead of sign-out
- `src/pages/LoginPage.tsx` -- ensure profile exists after login
- `src/pages/SignUpPage.tsx` -- better error message for existing accounts
- New database migration -- backfill missing profiles

**What changes for users:**
- All existing users can log in immediately
- Google and Apple sign-in will work without getting kicked out
- No more "System was reset" dead loops
- New signups continue to work as before

