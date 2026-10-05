-- Merge the leads that are ALREADY duplicated (same email, different case or
-- spacing). Re's decision, 5 Oct 2026 ("yes merge"). PR #772 only stops NEW
-- duplicates; this cleans the old ones.
--
-- For each email that has more than one row:
--   * keeper = the row that is linked to an account, else an enrolled one,
--     else the oldest;
--   * blanks on the keeper are filled from the other rows (oldest first);
--   * status: `enrolled` always wins; otherwise the keeper's own status stays,
--     unless it is still `new` and another row has moved on;
--   * an unsubscribe on ANY row is kept (never re-mail someone who opted out);
--   * checkout_recovery_emails (the only table that points at leads) moves to
--     the keeper; where the keeper already has that stage, the duplicate's row
--     is dropped (UNIQUE lead_id+stage);
--   * the extra rows are then deleted.
-- lead_events is not touched: it has no lead_id (it keys on session/user).
-- Idempotent: a second run finds no duplicates and does nothing.

do $merge$
declare
  g record;
  _keep uuid;
  _gone uuid[];
begin
  for g in
    select lower(btrim(email)) as e
      from public.leads
     where coalesce(btrim(email), '') <> ''
     group by 1
    having count(*) > 1
  loop
    select id into _keep
      from public.leads
     where lower(btrim(email)) = g.e
     order by (user_id is not null) desc,
              (status = 'enrolled') desc,
              created_at asc, id asc
     limit 1;

    select array_agg(id) into _gone
      from public.leads
     where lower(btrim(email)) = g.e and id <> _keep;

    -- fill blanks on the keeper from the others (oldest first)
    update public.leads k set
      name      = case when coalesce(nullif(btrim(k.name), ''), 'Unknown') = 'Unknown'
                       then coalesce((select nullif(btrim(o.name), '') from public.leads o
                                       where o.id = any(_gone) and coalesce(nullif(btrim(o.name), ''), 'Unknown') <> 'Unknown'
                                       order by o.created_at limit 1), k.name)
                       else k.name end,
      country   = case when coalesce(nullif(k.country, ''), 'Unknown') = 'Unknown'
                       then coalesce((select o.country from public.leads o
                                       where o.id = any(_gone) and coalesce(o.country, '') not in ('', 'Unknown')
                                       order by o.created_at limit 1), k.country)
                       else k.country end,
      level     = coalesce(nullif(k.level, ''),     (select o.level     from public.leads o where o.id = any(_gone) and coalesce(o.level, '') <> ''     order by o.created_at limit 1), k.level),
      goal      = coalesce(nullif(k.goal, ''),      (select o.goal      from public.leads o where o.id = any(_gone) and coalesce(o.goal, '') <> ''      order by o.created_at limit 1), k.goal),
      plan_type = coalesce(nullif(k.plan_type, ''), (select o.plan_type from public.leads o where o.id = any(_gone) and coalesce(o.plan_type, '') <> '' order by o.created_at limit 1), k.plan_type),
      duration  = coalesce(nullif(k.duration, ''),  (select o.duration  from public.leads o where o.id = any(_gone) and coalesce(o.duration, '') <> ''  order by o.created_at limit 1), k.duration),
      schedule  = coalesce(nullif(k.schedule, ''),  (select o.schedule  from public.leads o where o.id = any(_gone) and coalesce(o.schedule, '') <> ''  order by o.created_at limit 1), k.schedule),
      timezone  = coalesce(nullif(k.timezone, ''),  (select o.timezone  from public.leads o where o.id = any(_gone) and coalesce(o.timezone, '') <> ''  order by o.created_at limit 1), k.timezone),
      user_id   = coalesce(k.user_id, (select o.user_id from public.leads o where o.id = any(_gone) and o.user_id is not null order by o.created_at limit 1)),
      status    = case
                    when k.status = 'enrolled' then k.status
                    when exists (select 1 from public.leads o where o.id = any(_gone) and o.status = 'enrolled') then 'enrolled'
                    when coalesce(k.status, 'new') = 'new'
                      then coalesce((select o.status from public.leads o where o.id = any(_gone) and coalesce(o.status, 'new') <> 'new' order by o.created_at limit 1), k.status)
                    else k.status end,
      email_unsubscribed = k.email_unsubscribed or exists (select 1 from public.leads o where o.id = any(_gone) and o.email_unsubscribed),
      unsubscribed_at    = case when k.email_unsubscribed then k.unsubscribed_at
                                else (select min(o.unsubscribed_at) from public.leads o where o.id = any(_gone) and o.email_unsubscribed) end
    where k.id = _keep;

    -- recovery-email history follows the keeper
    delete from public.checkout_recovery_emails d
     where d.lead_id = any(_gone)
       and exists (select 1 from public.checkout_recovery_emails x
                    where x.lead_id = _keep and x.stage = d.stage);
    update public.checkout_recovery_emails set lead_id = _keep where lead_id = any(_gone);

    delete from public.leads where id = any(_gone);
  end loop;
end
$merge$;
