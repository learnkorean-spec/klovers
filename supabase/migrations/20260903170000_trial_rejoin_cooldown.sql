-- Trial rejoin cooldown: a student who cancels can book again after a month.
--
-- REQUESTED BEHAVIOUR
-- -------------------
-- Cancelling a trial should not bar someone forever, and it should not let them
-- re-book instantly either. One month after a cancellation, they can rejoin.
--
-- THE TRAP THIS AVOIDS -- read before changing the predicate
-- ---------------------------------------------------------
-- book-trial implements RESCHEDULING as "cancel the old row, insert a new one":
--
--   const shouldCloseExisting = existingBooking && (authed || isTbaPlaceholder || isRollover);
--   ... .update({ status: "cancelled", cancelled_at: now,
--                 cancel_reason: authed ? "student_reschedule" : "tba_rebook" })
--
-- So a student moving their own booking produces a cancelled row with
-- cancelled_at = now, milliseconds before the replacement insert. A rule keyed
-- on status = 'cancelled' alone would lock that student out for a month every
-- single time they changed their slot -- the exact opposite of what was asked.
--
-- Measured on production 2026-09-03, which is what makes this concrete rather
-- than theoretical: of 19 cancelled rows, the ONLY three in the last 30 days
-- are all cancel_reason = 'student_reschedule'. A naive rule would have hit
-- real people immediately.
--
-- The cooldown therefore ignores 'student_reschedule' and 'tba_rebook'. It
-- applies to a genuine cancellation: cancel_reason NULL (the 16 older rows,
-- all May-July, none within the window) or any other reason.
--
-- WHAT THIS ADDS
-- --------------
--   1. trial_settings.rejoin_cooldown_days, default 30 -- configurable, not
--      hardcoded, matching how every other trial timing value is stored.
--      Set it to 0 to disable the cooldown entirely.
--   2. A BEFORE INSERT trigger on trial_bookings that refuses a new booking for
--      an email whose most recent genuine cancellation is inside the window,
--      and says in the message which date it can book again.
--
-- Admins bypass it (has_role(auth.uid(), 'admin')), so a person can always be
-- let back in by hand without editing data. Note that book-trial runs under the
-- service role with no auth.uid(), so the student-facing path is always subject
-- to the cooldown -- which is the intent.
--
-- INSERT only. An existing booking is never retroactively invalidated.
--
-- DRY RUN
-- -------
-- Executed against production inside a transaction and rolled back, with both
-- directions tested rather than just the happy one:
--   A. an email whose recent cancellation is 'student_reschedule'  -> insert
--      succeeded, cooldown not triggered  (this is the regression test)
--   B. an email with a genuine cancellation dated now()            -> blocked
--      with trial_rejoin_cooldown
--
-- FOLLOW-UP REQUIRED FOR A GOOD MESSAGE
-- -------------------------------------
-- book-trial does not yet map this error, so a blocked student currently gets
-- the generic 500 branch with the raw message in the body. The branch to add,
-- before the existing 23514 one:
--
--   if (bookingError?.message?.includes("trial_rejoin_cooldown")) {
--     return new Response(JSON.stringify({ ok: false, success: false,
--       error: "You cancelled a trial recently. You can book again a month after that date.",
--       error_code: "rejoin_cooldown" }),
--       { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
--   }
--
-- Deliberately not bundled here: it requires deploying an edge function on the
-- live booking path, and that is a decision to take on its own timing.
--
-- ROLLBACK
-- --------
--   drop trigger if exists trg_trial_bookings_rejoin_cooldown on public.trial_bookings;
--   drop function if exists public.tg_trial_bookings_rejoin_cooldown();
--   alter table public.trial_settings drop column if exists rejoin_cooldown_days;
-- Or, without dropping anything: update trial_settings set rejoin_cooldown_days = 0.

begin;

alter table public.trial_settings
  add column if not exists rejoin_cooldown_days integer not null default 30;

comment on column public.trial_settings.rejoin_cooldown_days is
  'Days after a genuine trial cancellation before that email may book again. 0 disables the cooldown. Reschedules (cancel_reason student_reschedule / tba_rebook) never count as cancellations.';

create or replace function public.tg_trial_bookings_rejoin_cooldown()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_days  integer;
  v_last  timestamptz;
  v_until date;
begin
  if new.email is null then
    return new;
  end if;

  -- An admin can always put someone back in.
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  select coalesce(rejoin_cooldown_days, 30) into v_days
    from public.trial_settings where id = 1;
  if v_days is null or v_days <= 0 then
    return new;
  end if;

  -- Rescheduling is implemented as cancel-then-insert, so those two reasons are
  -- not cancellations and must never start a cooldown. See the header.
  select max(b.cancelled_at) into v_last
    from public.trial_bookings b
   where lower(b.email)   = lower(new.email)
     and b.status         = 'cancelled'
     and b.cancelled_at is not null
     and coalesce(b.cancel_reason, '') not in ('student_reschedule', 'tba_rebook');

  if v_last is not null and v_last > now() - make_interval(days => v_days) then
    v_until := (v_last + make_interval(days => v_days))::date;
    raise exception
      'trial_rejoin_cooldown: this email cancelled a trial on %; it can book again from %',
      v_last::date, v_until
      using errcode = 'P0001',
            hint = format('cooldown is %s days (trial_settings.rejoin_cooldown_days)', v_days);
  end if;

  return new;
end;
$fn$;

revoke all on function public.tg_trial_bookings_rejoin_cooldown() from public, anon, authenticated;

drop trigger if exists trg_trial_bookings_rejoin_cooldown on public.trial_bookings;
create trigger trg_trial_bookings_rejoin_cooldown
  before insert on public.trial_bookings
  for each row execute function public.tg_trial_bookings_rejoin_cooldown();

commit;
