-- Delivery tracking for campaign sends — 14 Sep 2026
--
-- The Resend webhook (`resend-email-webhook`) stamps delivered / bounced /
-- complained onto `email_logs`, matching the event's `email_id` against
-- `email_logs.resend_id`.
--
-- Campaign mail never goes near that table. `process-email-campaign` writes to
-- `email_sends`, which has no `resend_id` column at all — it discards the id
-- Resend returns — so a campaign letter's record ends at "we handed it over"
-- and nothing that happens afterwards can ever be attached to it.
--
-- Which is exactly backwards. A transactional letter goes to one person who is
-- expecting it; a campaign goes to many at once and is the one that can earn a
-- spam complaint — and that complaint is charged against the domain that also
-- carries the receipts and the class links. The mail with the highest risk was
-- the mail with no telemetry.
--
-- Measured on the day this was written: three campaign letters had gone out
-- (one Level 2 invitation, two Level 1 corrections) and not one of them could
-- be checked for delivery.
--
-- `status` is deliberately NOT extended with delivered/bounced/complained. It
-- drives the queue: `status.eq.queued,and(status.eq.failed,attempts.lt.3)`.
-- Whether Resend accepted the handover and what the mailbox did afterwards are
-- two different facts, and collapsing them into one column is how a bounced
-- letter would quietly re-enter a retry loop.

alter table public.email_sends
  add column if not exists resend_id    text,
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at   timestamptz,
  add column if not exists complained_at timestamptz;

comment on column public.email_sends.resend_id is
  'Resend message id returned at send. The key the delivery webhook matches on.';
comment on column public.email_sends.delivered_at is
  'Stamped by resend-email-webhook on email.delivered. NULL means unknown, not undelivered.';
comment on column public.email_sends.bounced_at is
  'Stamped by resend-email-webhook on email.bounced.';
comment on column public.email_sends.complained_at is
  'Stamped by resend-email-webhook on email.complained — a spam report. Treat as a stop signal for that recipient.';

-- The webhook looks a row up by this and nothing else, so it is the one index
-- that matters. Partial, because every row written before today has no id and
-- there is no point carrying them.
create index if not exists email_sends_resend_id_idx
  on public.email_sends (resend_id)
  where resend_id is not null;

-- ---------------------------------------------------------------------------
-- A view that answers the only question worth asking of a campaign: of the
-- letters we handed over, how many are known to have arrived, and did anyone
-- report one as spam?
--
-- delivered_at IS NULL is "not known", NOT "did not arrive" — the webhook has
-- only been connected since 14 Sep 11:08 UTC, and anything sent before that
-- will never be stamped.
-- ---------------------------------------------------------------------------
create or replace view public.v_campaign_delivery as
select
  c.id                                                  as campaign_id,
  c.name,
  c.subject,
  c.created_at,
  count(*)                                              as recipients,
  count(*) filter (where s.status = 'sent')             as handed_over,
  count(*) filter (where s.status = 'skipped')          as skipped,
  count(*) filter (where s.status = 'failed')           as failed,
  count(s.delivered_at)                                 as delivered,
  count(s.bounced_at)                                   as bounced,
  count(s.complained_at)                                as complained,
  count(*) filter (where s.status = 'sent' and s.resend_id is null)
                                                        as untrackable
from public.email_campaigns c
join public.email_sends s on s.campaign_id = c.id
group by c.id, c.name, c.subject, c.created_at;

comment on view public.v_campaign_delivery is
  'Per-campaign delivery summary. `untrackable` counts letters handed over without a Resend id — sends that predate 2026-09-14, which can never be stamped.';

revoke all on public.v_campaign_delivery from anon;
