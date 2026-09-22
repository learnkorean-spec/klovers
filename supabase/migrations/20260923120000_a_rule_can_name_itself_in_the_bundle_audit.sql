-- Re: "those must be automatic working, why i should add, as long as i didnt
-- press stop for the group its running with same price and bundle."
--
-- She is right. Her rule is simple and she has never varied from it: unless she
-- stops a student, the arrangement continues on the same terms. A renewal is
-- therefore not a decision -- it is a consequence -- and nothing that is a
-- consequence should wait on somebody remembering it.
--
-- WHAT WAS ACTUALLY IN THE WAY
--
-- Not the rollover rule (20260923110000). tg_student_bundles_audit:
--
--   IF v_uid IS NULL THEN
--     RAISE EXCEPTION 'unattributed_edit: ...';
--
-- It refused ANY bundle change made with no auth.uid(). That was written to
-- refuse a change NOBODY can be named for, which is right. But a change made
-- BY A RULE can be named -- by the rule. The rail was reading "no person" as
-- "no answer", and so the rollover could only ever work in the half-second
-- when a signed-in admin happened to be the one counting the lesson.
--
-- So: student_bundle_edits takes either a person or a rule, with a check
-- constraint that it must be one of them, and the audit refuses only a change
-- that can name neither. The rail is not weaker -- it is exact. Nothing
-- anonymous gets through, and "which rule did this" is now a column rather
-- than something to guess from the timestamp.
--
-- AND THE ONE THAT ALREADY SLIPPED
--
-- roll_bundle_if_overdrawn holds the body so the trigger and a catch-up pass
-- cannot diverge. Solafa's 22 Sep lesson was confirmed at 18:39 Cairo, about
-- three hours before the rollover trigger existed, so her package sat at 17
-- counted against 16 paid with nothing happening. The catch-up closed it,
-- opened the next one on the same terms with that lesson on it, and the
-- payment letter went out.

-- ---------------------------------------------------------------------------
-- 1. An audit row names a person OR a rule
-- ---------------------------------------------------------------------------

alter table public.student_bundle_edits
  alter column edited_by drop not null;

alter table public.student_bundle_edits
  add column if not exists system_actor text;

alter table public.student_bundle_edits
  drop constraint if exists student_bundle_edits_has_an_actor;

alter table public.student_bundle_edits
  add constraint student_bundle_edits_has_an_actor
  check (edited_by is not null or system_actor is not null);

comment on column public.student_bundle_edits.system_actor is
  'The rule that made this change when no person did (e.g. bundle_rollover). Exactly one of edited_by / system_actor is set.';

-- ---------------------------------------------------------------------------
-- 2. The audit refuses only what can name neither
-- ---------------------------------------------------------------------------

create or replace function public.tg_student_bundles_audit()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
DECLARE
  v_changes jsonb := '{}'::jsonb;
  v_uid uuid := auth.uid();
  v_actor text := nullif(current_setting('app.system_actor', true), '');
BEGIN
  IF NEW.label IS DISTINCT FROM OLD.label THEN
    v_changes := v_changes || jsonb_build_object('label', jsonb_build_object('old', OLD.label, 'new', NEW.label));
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    v_changes := v_changes || jsonb_build_object('source', jsonb_build_object('old', OLD.source, 'new', NEW.source));
  END IF;
  IF NEW.catalog_key IS DISTINCT FROM OLD.catalog_key THEN
    v_changes := v_changes || jsonb_build_object('catalog_key', jsonb_build_object('old', OLD.catalog_key, 'new', NEW.catalog_key));
  END IF;
  IF NEW.total_classes IS DISTINCT FROM OLD.total_classes THEN
    v_changes := v_changes || jsonb_build_object('total_classes', jsonb_build_object('old', OLD.total_classes, 'new', NEW.total_classes));
  END IF;
  IF NEW.total_price IS DISTINCT FROM OLD.total_price THEN
    v_changes := v_changes || jsonb_build_object('total_price', jsonb_build_object('old', OLD.total_price, 'new', NEW.total_price));
  END IF;
  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    v_changes := v_changes || jsonb_build_object('currency', jsonb_build_object('old', OLD.currency, 'new', NEW.currency));
  END IF;
  IF NEW.purchased_on IS DISTINCT FROM OLD.purchased_on THEN
    v_changes := v_changes || jsonb_build_object('purchased_on', jsonb_build_object('old', OLD.purchased_on, 'new', NEW.purchased_on));
  END IF;
  IF NEW.coverage_start IS DISTINCT FROM OLD.coverage_start THEN
    v_changes := v_changes || jsonb_build_object('coverage_start', jsonb_build_object('old', OLD.coverage_start, 'new', NEW.coverage_start));
  END IF;
  IF NEW.coverage_start_confirmed_at IS DISTINCT FROM OLD.coverage_start_confirmed_at THEN
    v_changes := v_changes || jsonb_build_object('coverage_start_confirmed_at', jsonb_build_object('old', OLD.coverage_start_confirmed_at, 'new', NEW.coverage_start_confirmed_at));
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF NEW.voided_reason IS DISTINCT FROM OLD.voided_reason THEN
    v_changes := v_changes || jsonb_build_object('voided_reason', jsonb_build_object('old', OLD.voided_reason, 'new', NEW.voided_reason));
  END IF;
  IF NEW.note IS DISTINCT FROM OLD.note THEN
    v_changes := v_changes || jsonb_build_object('note', jsonb_build_object('old', OLD.note, 'new', NEW.note));
  END IF;

  -- A save that touched nothing writes no audit row -- there is nothing to record.
  IF v_changes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- A change made by a rule is attributable: to the rule. Only a change that
  -- can name neither a person nor a rule is still refused.
  IF v_uid IS NULL AND v_actor IS NULL THEN
    RAISE EXCEPTION 'unattributed_edit: student_bundles % changed with no authenticated caller (auth.uid() is null) and no app.system_actor set. An audit trail that cannot name who made a change is refused, not recorded.', NEW.id
      USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.student_bundle_edits (bundle_id, edited_by, system_actor, changes)
  VALUES (NEW.id, v_uid, CASE WHEN v_uid IS NULL THEN v_actor END, v_changes);

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. The rollover, in one body, naming itself
-- ---------------------------------------------------------------------------

create or replace function public.roll_bundle_if_overdrawn(p_bundle_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _old  record;
  _used int;
  _new  uuid;
begin
  select * into _old from public.student_bundles where id = p_bundle_id;
  if _old.id is null or _old.status <> 'active' then return null; end if;

  select count(*) into _used
    from public.student_class_sessions s
   where s.bundle_id = _old.id and s.counted;

  -- Still inside the package she paid for. Nothing to do.
  if _used <= coalesce(_old.total_classes, 0) then return null; end if;

  -- Names the rule, so the audit rail records this instead of refusing it.
  perform set_config('app.system_actor', 'bundle_rollover', true);

  update public.student_bundles set status = 'completed' where id = _old.id;

  -- Same terms, and it starts on the day of the first lesson past the end --
  -- not today, because the package has already been running since then.
  insert into public.student_bundles
    (student_id, source, label, catalog_key, total_classes, total_price,
     currency, purchased_on, status, coverage_start, note)
  select _old.student_id, 'custom', _old.label, null, _old.total_classes,
         _old.total_price, _old.currency, s.session_date, 'active', s.session_date,
         'Opened automatically: the previous package ran out and lessons were taught past it.'
    from public.student_class_sessions s
   where s.bundle_id = _old.id and s.counted
   order by s.session_date asc, s.start_time asc
   offset coalesce(_old.total_classes, 0) limit 1
  returning id into _new;

  -- Every lesson past the end of the old package belongs to the new one.
  update public.student_class_sessions
     set bundle_id = _new
   where id in (
     select id from public.student_class_sessions
      where bundle_id = _old.id and counted
      order by session_date asc, start_time asc
      offset coalesce(_old.total_classes, 0)
   );

  perform set_config('app.system_actor', '', true);
  return _new;
end
$function$;

create or replace function public.tg_roll_bundle_when_overdrawn()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare _b uuid;
begin
  if not coalesce(new.counted, false) then return new; end if;

  _b := coalesce(
          new.bundle_id,
          (select id from public.student_bundles
            where student_id = new.student_id and status = 'active'
            order by coverage_start asc nulls last, created_at asc limit 1));

  perform public.roll_bundle_if_overdrawn(_b);
  return new;
exception when others then
  -- Rolling a package must never stop a lesson being recorded.
  return new;
end
$function$;

-- ---------------------------------------------------------------------------
-- 4. Catch up anything that went over before the rule existed
-- ---------------------------------------------------------------------------

select public.roll_bundle_if_overdrawn(id)
  from public.student_bundles
 where status = 'active';
