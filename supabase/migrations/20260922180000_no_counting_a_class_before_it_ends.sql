-- A class cannot be counted before it has finished.
--
-- WHAT HAPPENED
--
-- Solafa's Tuesday 22 Sept class, 21:00-22:30 Bangkok, was marked attended
-- and counted at 23:26 on Monday 21 Sept - about twenty-one hours before it
-- started. It took a credit off her bundle for a lesson that had not
-- happened, took her to 16 of 16, and put the red "bundle finished" warning
-- on her card. The class itself was still in the future the whole time.
--
-- WHY NOTHING STOPPED IT
--
-- The only guard was in the browser (buildExpectedSessions). It applied to
-- TODAY's occurrences alone, and it compared against the class's START time,
-- so a lesson that had begun but not ended was already offered as
-- answerable. Every other way a row reaches this table - the weekly
-- generator, the Today screen, a direct write - met no guard at all.
--
-- A rule that only one screen enforces is not a rule. This one is in the
-- database, where every path has to pass it.
--
-- WHAT IT REFUSES, AND WHAT IT DELIBERATELY DOES NOT
--
--   * REFUSED: attended, or counted = true, before the class's end time.
--     That is the only state that spends a credit, and the only one that is
--     a factual claim about something that has not happened.
--   * ALLOWED: "not held" (cancelled_no_charge) at any time, including well
--     in advance. A student who says on Monday that she cannot make
--     Thursday is an ordinary thing to record, and it costs no credit.
--   * ALLOWED: "scheduled" rows, so the weekly generator keeps materialising
--     upcoming lessons exactly as before.
--   * ALLOWED: anything in the past, however far back. Catching up on three
--     weeks of unanswered classes is the normal use of this table.
--
-- The end time is computed in the CLASS's own timezone and from its own
-- duration, not the server's: these classes are stored in Asia/Bangkok and
-- read by someone who may be anywhere. A session with no class_id (a manual
-- one-off) falls back to a zero duration, so it only has to have started -
-- the lenient end of the rule, because there is nothing to say how long it
-- runs.
--
-- An UPDATE that leaves outcome, counted, date and time alone passes
-- untouched, so editing a note on an old row never trips this.

create or replace function public.enforce_session_not_counted_early()
returns trigger
language plpgsql
as $function$
declare
  _tz   text;
  _dur  int;
  _ends timestamptz;
begin
  if new.outcome is distinct from 'attended' and coalesce(new.counted, false) = false then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.outcome is not distinct from new.outcome
     and old.counted is not distinct from new.counted
     and old.session_date is not distinct from new.session_date
     and old.start_time is not distinct from new.start_time
  then
    return new;
  end if;

  select c.timezone, c.duration_minutes
    into _tz, _dur
    from public.teacher_student_classes c
   where c.id = new.class_id;

  _tz  := coalesce(_tz, 'Asia/Bangkok');
  _dur := coalesce(_dur, 0);

  _ends := ((new.session_date + new.start_time) at time zone _tz) + make_interval(mins => _dur);

  if now() < _ends then
    raise exception 'That class has not finished yet — % at % (%) ends %. You can count it once it is over; to cancel it in advance use "not held", which costs no credit.',
      to_char(new.session_date, 'Dy DD Mon'),
      to_char(new.start_time, 'HH24:MI'),
      _tz,
      to_char(_ends at time zone _tz, 'HH24:MI')
      using errcode = 'check_violation';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_session_not_counted_early on public.student_class_sessions;
create trigger trg_session_not_counted_early
  before insert or update on public.student_class_sessions
  for each row execute function public.enforce_session_not_counted_early();
