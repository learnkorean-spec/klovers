

## Fix: Reset Password Page Not Working

### Problem
The reset password page fails with "Could not update password. The link may have expired" because:

1. **No session handling**: When the user clicks the email reset link, they arrive at `/reset-password` with auth tokens in the URL hash. The page doesn't wait for the authentication client to process these tokens and establish a session before showing the form.
2. **Misleading error messages**: When the actual error is "same password" (user enters their current password), the page shows a generic "link expired" message instead.

### Fix

**File: `src/pages/ResetPasswordPage.tsx`**

- Add a `sessionReady` state (starts `false`) and an `useEffect` that listens to `onAuthStateChange` for the `PASSWORD_RECOVERY` event
- Show a loading spinner until the recovery session is established
- If the session fails to establish (e.g., expired link), show an error state with a link back to forgot-password
- Improve error handling: detect "same_password" error and show a specific message ("New password must be different from your current password")
- After successful update, sign the user out to force a clean login with the new password

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/ResetPasswordPage.tsx` | Add `PASSWORD_RECOVERY` event listener, loading state, expired-link state, and better error messages |

No other files are affected. The `ForgotPasswordPage` redirect URL is already correct.

