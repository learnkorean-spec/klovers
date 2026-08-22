# Trial System Redesign — Design & Phased Implementation Plan

**Date:** 2026-08-22
**Companion to:** `docs/TRIAL_SYSTEM_AUDIT.md` (PR #62)
**Status:** Plan only. No code, schema, data or function changes have been made.

Each phase below is its own PR and needs Re's explicit go-ahead before it starts.
Migrations never travel in a feature PR (per `CLAUDE.md`) and are applied through the
Apply Migrations workflow (per `docs/APPLYING_MIGRATIONS.md`) — never `db push`.

---

## 1. Decisions taken

| # | Decision | Source |
|---|---|---|
| 1 | Trials become **1:1, 30 minutes**. The system becomes a personal teacher calendar. | Re, 2026-08-22 |
| 2 | **Mon–Fri 10:00–19:00 MYT is blocked** (regular classes). Trials available outside that until 24:00 MYT, every day including weekends. Last start **23:30 MYT**. | Re |
| 3 | Re can **manually add extra availability or block specific times** on top of the rules. | Re |
| 4 | Timezone fix: intended real time is **22:00 MYT**. Keep the `22:00` label, correct the stored zone to `Asia/Kuala_Lumpur`, make `ADMIN_TIMEZONE` the single source. **No free-text timezone field.** Ships as its own small PR this week. | Re |
| 5 | The **59 waiting students** get a "book your trial now" campaign once real dates exist. | Re |
| 6 | Orphaned trial email functions must be **recovered into the repo** before any campaign runs on them. | Re |
| 7 | **Availability floor is 08:00 MYT.** Trials bookable outside the Mon–Fri 10:00–19:00 block, within **08:00–24:00 MYT daily**, last start 23:30. | Re |
| 8 | **Pilot approved:** 10–12 students next week on the existing September slots, repo code only. Full campaign for the rest after Phases 5–7. | Re |
| 9 | Build order: **Phase 1 and Phase 5a first**, each its own PR, with confirmation at every gate. | Re |

---

## 2. What changed since the audit

Three findings from follow-up checks that materially affect the plan.

### 2.1 The timezone fix is invisible to students — do it without hesitation

I checked whether any student is attached to the four live September slots:

| Slot | Live bookings | Any bookings ever |
|---|---|---|
| Sep 4, 19:00 | 0 | 0 |
| Sep 5, 10:30 | 0 | 0 |
| Sep 6, 22:00 | 0 | 0 |
| Sep 7, 22:00 | 0 | 0 |

**Nobody is booked into any of them.** Correcting the timezone moves the real class an
hour earlier, and there is no student to notify, no email to re-send, no calendar
invite to correct. This was the one risk flagged in the audit and it does not exist.

### 2.2 Orphaned function source IS recoverable — the risk is much smaller than feared

The Supabase management API returns the full file contents of a deployed function.
I recovered `send-trial-emails` end to end, including its bundled copy of
`_shared/authorize.ts`. So all nine orphans can be pulled into the repo **verbatim**
rather than reverse-engineered.

Note: `supabase/functions/_shared/trialCapacityAlert.ts` is already in the repo — the
shared helper for `trial-capacity-alert` survived even though the function itself did
not. That confirms these functions were once repo-resident and were lost, not written
outside it.

### 2.3 ⚠️ `send-trial-emails` would have told all 59 students the wrong time

Recovering it revealed bugs far worse than the one-hour issue:

```ts
MEET_LINK = "https://meet.google.com/wyb-xcwi-mac";      // one room for every student
…
⏰ <strong>Time:</strong> ${timeLabel} Cairo Time         // raw slot time, labelled Cairo
…
`${ordinal(d.getUTCDate())} 2026`                         // year hard-coded
```

1. **It prints the stored time and calls it "Cairo Time".** The stored time is the
   *teacher's* local time. A 22:00 MYT slot would be emailed as "22:00 Cairo Time"
   when the student's real Cairo time is 17:00 — a **five-hour error**, not one hour.
2. **Every student gets the same Google Meet room.** For group classes that was the
   point. For 1:1 trials it means students walk into each other's lessons.
3. The year is hard-coded to 2026.

It only sends to `status = 'confirmed'`, of which there are zero, so it has **never
actually fired**. But it is precisely the function a "send the trial emails" campaign
would reach for. This validates decision 6 completely: **no campaign may run until
these are in the repo and fixed.**

---

## 3. The target model

### 3.1 Re's week, expressed as rules

Trials are bookable everywhere **except** the blue block:

```
        Mon    Tue    Wed    Thu    Fri    Sat    Sun
00:00   ░░░░   ░░░░   ░░░░   ░░░░   ░░░░   ░░░░   ░░░░    ░░ before 08:00 — closed
08:00  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
       │    │ │    │ │    │ │    │ │    │ │    │ │    │
10:00  ├████┤ ├████┤ ├████┤ ├████┤ ├████┤ │    │ │    │
       │████│ │████│ │████│ │████│ │████│ │    │ │    │   ████ regular classes
19:00  ├────┤ ├────┤ ├────┤ ├────┤ ├────┤ │    │ │    │        blocked for trials
       │    │ │    │ │    │ │    │ │    │ │    │ │    │
23:30  │ ←── last trial start, every day ──────────→  │
24:00  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
```

As data that is **12 rows**, not hundreds:

| kind | weekdays | window |
|---|---|---|
| `available` | all 7 | 08:00 → 24:00 |
| `blocked` | Mon–Fri | 10:00 → 19:00 |

Everything else — "I'm free Tuesday afternoon this week", "block Thursday evening,
dentist" — is an exception row against a specific date.

### 3.2 Capacity reality check

1:1 means one student per 30 minutes. Bookable slots per week under the 08:00–24:00
window:

| | Windows | Slots/day | Days | Total |
|---|---|---|---|---|
| Weekday | 08:00–10:00 (4) + 19:00–23:30 (10) | 14 | 5 | 70 |
| Weekend | 08:00–23:30 | 32 | 2 | 64 |
| | | | | **134/week** |

Comfortably more than the 59 waiting students need, even if every one of them booked
in the same week. Capacity is not a constraint on this project.

### 3.3 The early-hours floor — resolved

The original brief set a ceiling (24:00) but no floor, which read literally would have
made 02:00 and 04:00 bookable — attractive to a student in Morocco, for whom 03:00 MYT
is 20:00 local, and unreasonable for Re.

**Resolved: the day opens at 08:00 MYT.** Stored as the `start_time` of the seven
`available` rule rows, so it is a setting Re can change from the admin page later
without any code change.

---

## 4. Schema design

### 4.1 `teacher_availability_rules` — the recurring week

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `weekday` | `int` 0–6 | 0 = Sunday, matching existing convention |
| `start_time` | `time` | a real `time`, not text like the old `trial_slots.start_time` |
| `end_time` | `time` | |
| `kind` | `text` | `'available'` \| `'blocked'`, CHECK-constrained |
| `effective_from` | `date` | change the week without losing history |
| `effective_to` | `date` null | |
| `timezone` | `text` NOT NULL | default `'Asia/Kuala_Lumpur'`, **validated against `pg_timezone_names`** |
| `class_language` | `text` null | null = both |
| `note` | `text` null | admin-only |

The timezone validation is deliberate: a CHECK against `pg_timezone_names` makes
`Asia/Ho_Chi_Minh`-by-accident impossible to store again at the database level, not
just discouraged in the UI.

### 4.2 `teacher_availability_exceptions` — one-off changes

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `exception_date` | `date` | |
| `start_time`, `end_time` | `time` | |
| `kind` | `text` | `'available'` \| `'blocked'` |
| `reason` | `text` | shown to admin only |
| `created_by` | `uuid` | |

**Precedence:** exceptions always beat rules; within exceptions, `blocked` beats
`available`. Stated explicitly so "I added availability but it's still blocked" never
becomes a mystery.

### 4.3 Changes to `trial_bookings` (additive only)

- `starts_at timestamptz` — the unambiguous instant. Becomes the source of truth,
  replacing the `trial_date` + `start_time` text + `timezone` triple.
- `slot_range tstzrange` generated from `starts_at` and `duration_min`.
- `meeting_url text` — **per booking**, not one shared room (see §2.3).

Old columns stay populated during transition and are dropped only in Phase 8.

### 4.4 Real double-booking protection

```sql
ALTER TABLE trial_bookings
  ADD CONSTRAINT trial_bookings_no_overlap
  EXCLUDE USING gist (slot_range WITH &&)
  WHERE (status IN ('pending','confirmed'));
```

For 1:1 this is the whole ballgame. Today's protection is
`HAVING count(bookings) < capacity` inside a read query, which two simultaneous
clicks can race past. An exclusion constraint makes overlap **impossible at the
database level** regardless of timing. Requires the `btree_gist` extension.

### 4.5 New read function

```
get_trial_availability_v2(p_from date, p_to date, p_language text)
  → TABLE(starts_at timestamptz, duration_min int, class_language text)
```

Generates 30-minute candidates, then subtracts: blocked rules → exceptions →
existing bookings → minimum booking notice → the 23:30 last-start rule.

Returning `timestamptz` means the frontend never handles a source timezone again.
That single change removes the entire class of bug that produced the current mess.

---

## 5. Phased plan

Each phase = one PR = one concern. Migration phases carry **no** application code;
code phases carry **no** migration.

---

### Phase 1 — Timezone correction *(this week)*

Because a migration and app code cannot share a PR, this is **two PRs that land
together**.

**PR 1a — migration**
- Correct the 4 live slots: `Asia/Ho_Chi_Minh` → `Asia/Kuala_Lumpur`, keeping the
  `22:00` / `19:00` / `10:30` labels exactly as typed.
- Change the `trial_slots.timezone` column default to `Asia/Kuala_Lumpur`.
- Update the `COALESCE(timezone, 'Asia/Ho_Chi_Minh')` fallbacks inside
  `get_trial_availability()` and `advance_trial_slots()`.
  ⚠️ Both must be replaced **preserving every existing clause** — `advance_trial_slots`
  is `SECURITY DEFINER` with `SET search_path TO 'pg_catalog', 'public'`;
  `get_trial_availability` is `STABLE` with `SET search_path TO 'public', 'extensions'`.
  Dropping a `SET search_path` here is exactly the incident `CLAUDE.md` warns about.
- Read the live definitions with `pg_get_functiondef` immediately before writing, since
  local migration files have diverged from the recorded history.

**PR 1b — application code**
- `AddTrialClassDialog.tsx`: delete the free-text timezone input; use `ADMIN_TIMEZONE`.
- `book-trial/index.ts:225`: fallback → `Asia/Kuala_Lumpur`.
- `TrialSlotPicker.tsx`, `TrialClassesManager.tsx`: already correct, confirm and leave.
- Display the teacher's timezone as a fixed label: *"All times are your time (Malaysia)"*.

**Plain language:** Right now when you type 22:00, the class is really at 23:00 your
time, because the system thinks you're in Vietnam. This fixes the four September slots
to mean what you intended, and removes the box that let it go wrong — you will never
type a timezone again. **Nobody is booked into those four slots, so no student sees
anything change.**

**Effort:** 0.5 day · **Risk:** low · **Student impact:** none

---

### Phase 2 — New availability tables *(migration PR)*

Creates `teacher_availability_rules` and `teacher_availability_exceptions`, adds
`starts_at`, `slot_range`, `meeting_url` to `trial_bookings`, enables `btree_gist`,
adds the exclusion constraint, and backfills `starts_at` on existing rows.

Nothing reads these yet. The site behaves identically.

**Plain language:** Builds the empty filing cabinet for your weekly schedule. Nothing
uses it yet and nothing on the website changes.

**Effort:** 1 day · **Risk:** low (purely additive)

---

### Phase 3 — Availability engine *(migration PR)*

`get_trial_availability_v2` plus a `book_trial_1to1` booking function that writes
`starts_at` and relies on the exclusion constraint.

Seeds Re's 12 rules: seven `available` rows of **08:00–24:00** (one per day) and five
`blocked` rows of 10:00–19:00 (Mon–Fri).

Tested against: DST (Egypt shifts, Malaysia does not), midnight boundaries, the 23:30
last-start rule, and two students racing for the same slot.

**Plain language:** Teaches the system your actual week, and gives it the ability to
work out free slots by itself instead of you entering them one at a time.

**Effort:** 1.5 days · **Risk:** medium — this is the core logic

---

### Phase 4 — Admin availability page *(code PR)*

One page, three panels: **My Week** (edit the rules), **Exceptions** (block a time /
add extra availability), and **Next 14 Days** — a live preview of exactly what
students will see, computed by `get_trial_availability_v2`.

Panel three is the important one. A preview of the student view would have caught the
Vietnam timezone error on day one.

**Plain language:** Your new scheduling screen. Set your normal week once, then block
or open individual times as life happens — and see exactly what students see before
anything goes live.

**Effort:** 2 days · **Risk:** low

---

### Phase 5 — Recover the orphaned functions *(two PRs)*

**PR 5a — recover verbatim.** Pull all nine into `supabase/functions/` exactly as
deployed: `send-trial-emails`, `rebook-trial`, `send-rebook-emails`,
`send-trial-invites`, `resend-trial-link-update`, `email-tracker`,
`send-class-broadcast`, `trial-capacity-alert`, and `zz-tmp-deploy-probe`
(recovered then deleted).

⚠️ **`deploy-functions.yml` deploys everything in the repo on push to `main`.** Adding
these files means they get redeployed. If the recovery is byte-identical that is a
no-op — so PR 5a changes **nothing** except making the code visible. Each file is
diffed against the deployed version before merge.

**PR 5b — fix the bugs found.** The `Cairo Time` mislabel, the shared Meet link, the
hard-coded year — and decide per function whether it survives at all. Several
(`send-trial-emails`, `rebook-trial`) duplicate what `book-trial` +
`send-confirmation-email` already do properly and should be retired rather than fixed.

**Plain language:** Nine pieces of the system are running in production with no copy
in the repository — we cannot read or safely change them. This copies them back where
we can see them, then fixes what's broken. One of them would have told all 59 students
a time five hours wrong.

**Effort:** 1 day · **Risk:** medium — needs careful verbatim diffing

---

### Phase 6 — Student booking on the new engine *(code PR)*

`TrialSlotPicker` switches to `get_trial_availability_v2` behind a feature flag,
showing a real date/time picker instead of a list of ≤4 curated classes. Times display
in the student's own timezone from a `timestamptz`.

Also fixes `book-trial` returning **HTTP 200 on failure** — the thing most likely to
have hidden the funnel breaking in the first place.

**Plain language:** Students start seeing your real free slots and can pick any of
them. Also fixes a fault where booking failures looked like successes, which is
probably why 59 people ended up stuck with no date.

**Effort:** 1.5 days · **Risk:** medium — student-facing

---

### Phase 7 — Emails and calendar on `starts_at` *(code PR)*

Confirmation, prep, and the day1/day3/day7 followups all move to `starts_at`, with a
per-booking meeting link. Every email is verified against a real test booking before
merge.

**Plain language:** Makes every email say the right time in the student's own
timezone, with their own meeting link.

**Effort:** 1 day · **Risk:** medium

---

### Phase 8 — Retire the old machinery *(migration PR)*

Disable the `advance-trial-slots` cron (nothing to roll forward under rules); retire
`min_group_size`, capacity, `check-trial-min-group-size` and `trial-capacity-alert`
now that trials are 1:1; retire the old `trial_slots` rows; drop the superseded
booking columns.

Only after Phases 6–7 have run successfully for real students.

**Plain language:** Switches off the old monthly-block machinery once the new system
has proven itself. Deliberately last.

**Effort:** 0.5 day · **Risk:** low if sequenced last

---

### Phase 9 — The campaign to the 59 *(see §6)*

---

## 6. The 59 waiting students — approved approach

> **Approved by Re, 2026-08-22:** pilot 10–12 students next week on the existing
> September slots using repo code only; full campaign for the remainder after
> Phases 5–7.

### The problem with going straight to a full campaign

There are **zero confirmed bookings in the entire history of this system**. Not a low
number — zero. We have no evidence any student has ever completed a booking end to
end.

Sending all 59 at an unproven funnel risks burning the entire waiting list in one
afternoon. These people already waited once; a second bad experience is likely the
last one.

### Recommended: pilot small, then campaign properly

**Step 1 — Pilot (~0.5 day, right after Phase 1, early next week).**
Take the 4 existing September slots, add a couple more via the admin screen you
already have, and invite **10–12 students** — oldest requests first. Group format, on
the current system. This is not the future architecture; it is a **test that the
funnel works at all**, plus real teaching happening in early September instead of late.

The confirmation path here uses `book-trial` → `send-confirmation-email`, both of
which **are** in the repo — so the pilot does not touch any orphaned function. That is
what makes it safe to run before Phase 5.

Success criterion: bookings reaching `confirmed`, with correct times in the emails.

**Step 2 — Full campaign (after Phases 5–7).**
The remaining ~47 get 1:1 booking links on the new system, with the email functions
recovered, fixed and readable.

### Why not just wait for the new system?

Phases 1–7 realistically run **3–4 weeks** with phase-by-phase confirmation. Asking 59
people who are already waiting to wait another month, when we could both test the
funnel and teach a dozen of them next week, is the worse trade.

### Why not campaign to all 59 on the current system?

It is group format — the opposite of the decision just made — and capacity is 10 per
slot, so 59 students needs 6+ sessions. It would mean investing real effort in the
architecture we are retiring, and it stakes the whole list on an untested path.

**The pilot is the middle path: low effort, real students taught, funnel proven, list
protected.**

---

## 7. Timeline and effort

| Phase | PR type | Effort | Depends on |
|---|---|---|---|
| 1a Timezone data + functions | migration | 0.25 d | — |
| 1b Timezone app code | code | 0.25 d | 1a |
| **Pilot to 10–12 students** | ops | 0.5 d | 1 |
| 2 Availability tables | migration | 1 d | — |
| 3 Availability engine | migration | 1.5 d | 2 |
| 4 Admin page | code | 2 d | 3 |
| 5a Recover orphans | code | 0.5 d | — |
| 5b Fix orphans | code | 0.5 d | 5a |
| 6 Student booking | code | 1.5 d | 3 |
| 7 Emails on `starts_at` | code | 1 d | 6 |
| 8 Retire old machinery | migration | 0.5 d | 6, 7 |
| 9 Full campaign | ops | 0.5 d | 5, 7 |
| | **Total** | **~10 days** | |

Roughly **3–4 calendar weeks** at a sustainable pace with confirmation between phases.

Phases **1 and 5a are independent of everything else** and can go first — Phase 1
because it fixes a live error, 5a because it makes invisible production code visible
at zero behavioural risk.

---

## 8. What I need from Re, and when

Settled: trial format (1:1), the timezone fix, the **08:00 floor**, the **pilot**, and
the build order (**Phase 1 and 5a first**).

Still open, each at its own gate:

| When | Question |
|---|---|
| Before Phase 1 | Go-ahead to push PRs 1a + 1b. |
| Before Phase 5a | Go-ahead to push the nine recovered functions. |
| Before the pilot | Which 10–12 students, and the invitation wording. |
| Before Phase 5b | For each duplicated function — retire or fix? |
| Before Phase 9 | Final approval of the campaign email, in both languages. |

Any Korean or Arabic content in the emails will be flagged for review before it
changes — no wording is altered without Re seeing it first.

---

## Appendix — verification

Read-only. No writes, deploys or migrations were performed in producing this plan.

- Booking-to-slot linkage (§2.1) via read-only SQL joining `trial_slots` to
  `trial_bookings` on the live database.
- `send-trial-emails` source (§2.3) recovered via the Supabase management API
  (`get_edge_function`), which returned both `index.ts` and its bundled
  `_shared/authorize.ts`.
- Live function clauses (`SECURITY DEFINER`, `SET search_path`) read from
  `pg_get_functiondef` and recorded in Phase 1 so they are preserved.
- Slot capacity arithmetic in §3.2 derived from the stated rules, not measured.
