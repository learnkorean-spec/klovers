-- Move the September trial bookings nobody attended to Friday 2 October.
--
-- Re, 1 Oct 2026: the students booked on the Arabic trial (Fri 25 Sep) and the
-- English trial (Sun 27 Sep) did not attend. Move them to the same-language
-- trial on Fri 2 Oct, directly, WITHOUT any message to the students.
-- Excluded at her request: naira (already seated in a paid group) and the two
-- test accounts, Re Test and Reham Elshrkawy.
--
-- DATA ONLY. No schema change.
--
-- "No message" is enforced here, not assumed:
--   * trg_trial_bookings_reset_followups_on_move clears followup_prep_sent_at on
--     any trial_date change, which would send the prep letter (Meet link) the
--     day before the new date. The old stamp is put back after the move.
--   * attendance_response is cleared to NULL. The trial_confirmed letter
--     trigger fires only on a move TO 'yes', so clearing it sends nothing.
--   * status is left as it is (confirmed_attendance -> confirmed is not a legal
--     transition, and nothing here needs it to change).
--
-- Guards: exactly one active target slot per language on 2 Oct, or nothing
-- happens. The seat guard still runs on each row; a full slot aborts the whole
-- migration rather than moving half the students.

do $$
declare
  v_ar  public.trial_slots%rowtype;
  v_en  public.trial_slots%rowtype;
  v_n   int;
  v_moved int;
begin
  select count(*) into v_n from public.trial_slots
   where trial_date = date '2026-10-02' and class_language = 'arabic' and is_active;
  if v_n <> 1 then
    raise exception 'Expected exactly one active Arabic trial slot on 2026-10-02, found %', v_n;
  end if;
  select * into v_ar from public.trial_slots
   where trial_date = date '2026-10-02' and class_language = 'arabic' and is_active;

  select count(*) into v_n from public.trial_slots
   where trial_date = date '2026-10-02' and class_language = 'english' and is_active;
  if v_n <> 1 then
    raise exception 'Expected exactly one active English trial slot on 2026-10-02, found %', v_n;
  end if;
  select * into v_en from public.trial_slots
   where trial_date = date '2026-10-02' and class_language = 'english' and is_active;

  -- Who moves, and the prep stamp each one had before the move.
  create temp table _mv on commit drop as
  select b.id,
         b.followup_prep_sent_at as prep_before,
         case when b.class_language = 'arabic' then v_ar.id else v_en.id end as target
    from public.trial_bookings b
   where b.status not in ('cancelled', 'no_show', 'completed')
     and b.attended is distinct from true
     and lower(btrim(coalesce(b.name, ''))) not in ('naira', 're test', 'reham elshrkawy')
     and (
          (b.trial_date = date '2026-09-25' and b.class_language = 'arabic')
       or (b.trial_date = date '2026-09-27' and b.class_language = 'english')
     );

  update public.trial_bookings b
     set trial_date              = s.trial_date,
         start_time              = s.start_time,
         day_of_week             = s.day_of_week,
         is_tba                  = false,
         attendance_response     = null,
         attendance_confirmed_at = null,
         attended                = null,
         attendance_marked_at    = null,
         attendance_marked_by    = null,
         changed_at              = now()
    from _mv m
    join public.trial_slots s on s.id = m.target
   where b.id = m.id;
  get diagnostics v_moved = row_count;

  -- Put the prep stamp back so the move itself sends nothing.
  update public.trial_bookings b
     set followup_prep_sent_at = m.prep_before
    from _mv m
   where b.id = m.id
     and b.followup_prep_sent_at is distinct from m.prep_before;

  raise notice 'Moved % booking(s) to 2026-10-02 (Arabic % / English %)',
    v_moved, v_ar.start_time, v_en.start_time;
end;
$$;
