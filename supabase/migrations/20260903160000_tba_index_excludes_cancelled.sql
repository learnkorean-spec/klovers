-- A cancelled booking should not block a new one.
--
-- WHY
-- ---
-- idx_trial_bookings_one_tba_per_email enforces "one TBA booking per email":
--
--   CREATE UNIQUE INDEX idx_trial_bookings_one_tba_per_email
--     ON trial_bookings (lower(email)) WHERE (is_tba = true)
--
-- The predicate says nothing about status. So a CANCELLED TBA booking keeps
-- occupying the slot permanently, and that email address can never create
-- another TBA booking -- the insert fails with 23505.
--
-- That is not hypothetical. Measured on production 2026-09-03: two email
-- addresses are in exactly this state. Both their bookings are cancelled, both
-- people are blocked, and the block is silent -- the student sees a failed
-- registration with no explanation, and nothing in the admin UI shows why.
--
-- Found while investigating why the nine legacy 'TBA' / 2099-12-31 rows could
-- not simply be nulled out (PR #210): nulling sets is_tba = true via trigger and
-- collides with this index. That is also the reason those sentinel values exist
-- at all -- they are a workaround for this index, not carelessness.
--
-- THE CHANGE
-- ----------
-- The predicate gains AND status <> 'cancelled'. The rule it was written to
-- enforce -- one *live* TBA booking per person -- is unchanged; a cancelled
-- booking simply stops counting as one.
--
-- SAFETY
-- ------
-- The narrower predicate can only fail if two non-cancelled TBA bookings already
-- share an email. Checked on production before writing this:
--   57 live TBA bookings, 57 distinct lower(email)  -- no collision
--
-- Wrapped in a transaction, so the drop and the recreate are atomic and the
-- uniqueness guarantee is never absent from a committed state. Not CONCURRENTLY,
-- deliberately: CREATE INDEX CONCURRENTLY cannot run inside a transaction block,
-- and on 81 rows the lock is measured in milliseconds.
--
-- DRY RUN
-- -------
-- Executed against production inside a transaction and rolled back:
--   live TBA bookings          57
--   distinct emails among them 57   (so the new index builds cleanly)
--   cancelled rows leaving it   2
--   email addresses unblocked   2
--
-- ROLLBACK
-- --------
--   drop index if exists public.idx_trial_bookings_one_tba_per_email;
--   create unique index idx_trial_bookings_one_tba_per_email
--     on public.trial_bookings (lower(email)) where (is_tba = true);
-- Note that reverting re-blocks those two addresses.

begin;

drop index if exists public.idx_trial_bookings_one_tba_per_email;

create unique index idx_trial_bookings_one_tba_per_email
  on public.trial_bookings (lower(email))
  where (is_tba = true and status <> 'cancelled');

comment on index public.idx_trial_bookings_one_tba_per_email is
  'One LIVE TBA booking per email address. Cancelled bookings are excluded so that cancelling and re-registering works.';

commit;
