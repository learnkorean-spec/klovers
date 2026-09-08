# When the email ships and the page does not — 8 September 2026

`Deploy Supabase` and Vercel build from the same merge, on two pipelines, with
no ordering between them. On 8 Sep they came apart for about an hour, and the
gap had a sharp edge.

## What happened

| | |
|---|---|
| `send-confirmation-email` (Supabase Edge) | deployed **14:13** — includes the new "I can't make it" button |
| kloversegy.com (Vercel, production) | last built **13:05**, commit `2496fe0` |

PR #321 changed two things that only make sense together: the attendance email
gained a decline button linking to `/trial-confirm?...&response=no`, and the
page gained the code to read `response`. The function deployed. The page did
not — four merges to `main` (#297, #320, #310, #321) produced no production
build at all.

So for that hour the live system offered a student a button labelled "I can't
make it" which, when clicked, landed on a page whose only control said
**"Confirm My Attendance"**. The opposite of what they pressed.

Nobody hit it, for one reason only: `trial_bookings.email_sent_at` was still
zero across every row. The invitation had not gone out yet.

## The rule

**A change that spans an email and a page is not shipped until both are live.**
The email is the half you cannot recall. Verify the page first — open the URL
the email will send people to and confirm the new behaviour is actually there —
and only then let anything send.

## The check that would have caught it

Before any send that involves a new email template:

1. `list_edge_functions` — note `updated_at` on the function that renders it.
2. Vercel → Deployments → newest row marked **Production** — note its commit.
3. Confirm that commit contains the page half. If it does not, do not send.

Step 3 is the one that was skipped, and it is the only one that matters.

## Also worth knowing

Redeploying an old production deployment rebuilds **that commit**, not the
current `main`. It is not a way to ship pending merges — it reships what was
already live. Moving `main` is what triggers a new production build.
