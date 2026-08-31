// Retired stub.
//
// The version that ran here before this commit was hand-deployed straight
// to Supabase, never committed to any repo, and never touched again after
// the day it shipped (created_at == updated_at). It took a bare, unauthenticated
// GET (verify_jwt: false, no auth check anywhere in its body, no token) and,
// with the service-role key, wrote directly to trial_bookings:
//   status: 'confirmed', is_tba: false, attendance_response: 'yes',
//   slot_chosen_at: now(), and a hardcoded trial_date/start_time for
//   whichever of three fixed May 2026 slots the `slot` query param named.
// Anyone who opened, or whose mail client prefetched, a link of the shape
// `.../rebook-trial?id=<booking id>&slot=sat|sun|wed` triggered that write —
// no proof the opener was the student the booking belonged to. Fifty such
// links went out in the rebook-request email and were still live in real
// inboxes when this was found. See issue tracking the reschedule-link
// investigation for the full writeup and the exposure count.
//
// This stub is deploy-only: it makes the endpoint stop mutating student data
// and, for the first time, puts its logic somewhere reviewable and
// diffable. It reads nothing, writes nothing, and holds no secrets. Same
// treatment already applied to zz-tmp-deploy-probe.

Deno.serve(() =>
  new Response(
    "This trial-rescheduling link has been retired and no longer changes any booking. If you need to reschedule your trial class, please contact us on WhatsApp.",
    { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } },
  )
);
