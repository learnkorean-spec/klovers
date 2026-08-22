# Trial Booking System — Audit & Redesign Proposal

**Date:** 2026-08-22
**Scope:** Read-only audit of the live trial-booking system (repo + Supabase `ewtdgpbybkceokfohhyg`).
**Status:** No code changed, no database writes, no functions deployed. Findings only.

---

## 0. Executive summary (plain language)

The trial system was built around a completely different idea of availability than
the one we now want.

Today it assumes: *"Once a month there is a 4-day block starting on a Friday. Inside
that block there are a handful of fixed group classes with up to 10 seats each. A
class only actually runs if at least 3 people sign up."*

What we want: *"Re is free every day outside her Mon–Fri 10:00–19:00 working hours,
right up to midnight, and students book a 30-minute slot whenever suits them."*

These are not the same system with different numbers. The monthly-block model is
baked into the database, the cron jobs, and the admin screens. Trying to bend it
into daily availability would mean fighting it at every step.

**Four things that matter most:**

1. **There is a live one-hour timezone error.** Every slot currently in the database
   is stored as Vietnam time (`Asia/Ho_Chi_Minh`, UTC+7) instead of Malaysia time
   (`Asia/Kuala_Lumpur`, UTC+8). When Re types "22:00" into the admin screen, the
   system schedules the class for **23:00 her time**. Students see a time one hour
   earlier than intended. Details in §5.

2. **Nobody has ever completed a dated booking.** There are 75 rows in
   `trial_bookings`: 59 pending and 16 cancelled. Every single one of the 59 pending
   rows is marked "TBA" — meaning the student registered interest but never got a
   real date and time. **Zero confirmed bookings exist.** The booking funnel is not
   working end to end today. Details in §1.

3. **There is already an admin screen for adding slots** — it is not manual SQL. But
   it asks Re to type a raw IANA timezone string into a free-text box, which is
   where the Vietnam timezone came from. Details in §3.

4. **Slots quietly move themselves.** An hourly cron job (`advance_trial_slots`)
   rewrites the date of any active slot once its time has passed, pushing it to the
   equivalent day in the *next month's* Friday block. Slots are not stable rows —
   they migrate. Details in §1.4.

The recommendation in §7 is to stop storing individual slots altogether and instead
store *rules* about when Re is free, calculating the bookable 30-minute slots on
demand. Estimated effort: **6–9 working days**, phased so nothing breaks mid-flight.

---

## 1. DATA

### 1.1 Tables involved

| Table | Rows (live) | Role |
|---|---|---|
| `trial_slots` | 41 | One row per *specific dated class*. Only 4 are active. |
| `trial_bookings` | 75 | One row per student request. 59 pending (all TBA), 16 cancelled. |
| `trial_settings` | 1 | Global config: the monthly-block shape. |
| `trial_rate_limits` | — | Abuse throttling for the booking endpoint. |
| `trial_slot_skips` | 0 | Legacy; unused. |
| `trial_broadcasts`, `trial_invite_sends` | — | Marketing email sends, not part of booking. |

Related but **separate** systems (do not confuse them with trials):
`teacher_schedule_slots` + `teacher_availability` are for *paid* lessons;
`schedule_packages` / `matching_slots` are for group-course enrolment.
The trial system does not read any of them.

Views: `v_trial_slots_admin`, `v_trial_bookings_admin`, `v_trial_slot_fill_rate`.

### 1.2 `trial_slots` — how a slot is defined

Slots are **fixed calendar dates, not recurring rules**, despite having a
`day_of_week` column that duplicates the date.

Key columns:

| Column | Type | Default | Note |
|---|---|---|---|
| `trial_date` | `date` | — | The actual calendar date. |
| `day_of_week` | `integer` | — | 0–6, redundant with `trial_date`; used by the roll-forward job. |
| `start_time` | **`text`** | — | `"22:00"` as a *string*, not a `time`. |
| `duration_min` | `integer` | 30 | |
| `timezone` | `text` | **`Asia/Ho_Chi_Minh`** | ⚠️ Wrong default — see §5. |
| `capacity` | `integer` | 6 (live rows: 10) | **Trials are group classes.** |
| `min_to_run` | `integer` | null | Falls back to `trial_settings.min_group_size` = 3. |
| `class_language` | `text` | `arabic` | `english` \| `arabic`. |
| `session_period` | `text` | null | `morning`/`daytime`/`evening` label. |
| `is_active` / `lifecycle` | `bool` / `text` | true / `active` | Two overlapping on/off switches. |
| `meeting_url` | `text` | null | Google Meet / Zoom link. |

Constraint worth knowing: `UNIQUE (trial_date, start_time)`. **Two classes cannot
share the same date and time even if they are for different languages.** This
already limits scheduling and would block any future "two students, same slot".

`start_time` being `text` rather than `time` means the database cannot sort or
compare times reliably without casting, and nothing prevents `"9:00"` vs `"09:00"`
being stored as two different values.

### 1.3 What is actually in `trial_slots` right now

41 rows total; **37 are retired**. Only these 4 are live and bookable:

| Date | Day | `start_time` | Timezone stored | Language | Capacity | Meet link |
|---|---|---|---|---|---|---|
| 2026-09-04 | Fri | 19:00 | `Asia/Ho_Chi_Minh` | arabic | 10 | ✅ |
| 2026-09-05 | Sat | 10:30 | `Asia/Ho_Chi_Minh` | arabic | 10 | ✅ |
| 2026-09-06 | Sun | 22:00 | `Asia/Ho_Chi_Minh` | english | 10 | ✅ |
| 2026-09-07 | Mon | 22:00 | `Asia/Ho_Chi_Minh` | english | 10 | ✅ |

The retired rows show the system has drifted through **three different timezones**
over its life: `Africa/Cairo` (May, Aug), `Asia/Kuala_Lumpur` (Jul, Aug), and now
`Asia/Ho_Chi_Minh` (Sept). Historical bookings are therefore not comparable to each
other without per-row timezone handling.

One retired Sept 5 row is labelled `session_period = 'evening'` but sits at 10:30 —
the label and the time disagree, so `session_period` cannot be trusted as data.

### 1.4 The monthly block, and slots that move by themselves

`trial_settings` (single row) defines the shape:

```
trial_block_start_dow = 5   → blocks start on Friday
trial_block_days      = 4   → blocks run Fri, Sat, Sun, Mon
min_group_size        = 3   → a class needs 3 students or it does not run
default_duration_min  = 30
suggestion_weeks      = 2
```

This is exactly why the live slots are **Sept 4 (Fri) → Sept 7 (Mon)**.

The cron job `advance-trial-slots` runs **every hour at :10** and calls
`advance_trial_slots()`. For every active slot whose start time has passed, it
computes next month's Friday block and **overwrites `trial_date` in place**.

Consequence: after 2026-09-07 22:00 passes, these four rows will silently become
October dates. A slot is not a fixed thing you can point at — it is a template that
keeps relocating. Any redesign must decide deliberately whether to keep that
behaviour (recommendation: **no**).

### 1.5 `trial_bookings` — 59 pending, all TBA, zero confirmed

| Status | Count | Has a date? | Timezones present |
|---|---|---|---|
| `pending` | 59 | **0** — all `is_tba = true` | Africa/Cairo, Asia/Kuala_Lumpur |
| `cancelled` | 16 | yes | Africa/Cairo, Asia/Kuala_Lumpur |

**No rows in `confirmed`, `date_selected`, `awaiting_attendance`,
`confirmed_attendance`, `completed`, or `no_show`.**

Reading that plainly: 59 people asked for a trial and are sitting in a "we'll tell
you the date later" queue. None was ever given a slot through the system. This is
the single biggest business finding in this audit, and it is independent of the
redesign — those 59 people exist right now.

One cancelled row carries `trial_date = 2099-12-31`, a sentinel value someone used
as a placeholder. It will sort last in every admin list forever.

The status enum allows 8 values; the flow only ever uses 2.

### 1.6 Double-booking protection

Two unique indexes do the work:

- `idx_trial_bookings_one_tba_per_email` — one TBA row per email address.
- `idx_trial_bookings_unique_active` — `UNIQUE (lower(email), trial_date, start_time)`
  for non-TBA pending/confirmed rows. Stops the *same student* booking the *same
  slot* twice.

Capacity is enforced separately, inside `get_trial_availability()`, via
`HAVING COUNT(bookings) < capacity` — the slot simply stops being offered once full.
There is also a `book_trial_with_capacity_check` RPC and a
`fix_slot_matching_lock` migration, indicating past race-condition trouble.

**Important for the redesign:** there is *no* protection against two different
students holding overlapping times, because the current model does not need it —
trials are group classes with 10 seats. A 1:1 model needs a genuinely different
guarantee (see §7.3).

---

## 2. BOOKING FLOW (student-facing)

### 2.1 Routes

| Route | Page | Auth | Role |
|---|---|---|---|
| `/free-trial` | `FreeTrialPage.tsx` | public | Marketing landing. Calls `get_trial_availability()` to tease times, then pushes to signup or `/trial-booking`. |
| `/trial-booking` | `TrialBookingPage.tsx` (875 lines) | **required** | The real booking form. |
| `/trial-confirm` | `TrialConfirmPage.tsx` | public | Email-link confirmation / attendance response. |
| `/trial-book` | `TrialBookPage.tsx` (1122 lines) | required | ⚠️ A separate hard-coded marketing page. It does **not** call `get_trial_availability` or book anything — it only reads `user_roles`. Appears to be an abandoned redesign still routed in production. |

### 2.2 The path

1. Student lands on `/free-trial`, must **sign up or log in** before booking.
2. `/trial-booking` renders `TrialSlotPicker.tsx` (256 lines), which calls the RPC
   `get_trial_availability(p_language)`.
3. `get_trial_availability` returns only slots that are `is_active`, `lifecycle =
   'active'`, dated, **in the future**, and **not yet full**, optionally filtered by
   language.
4. Student picks a slot; the page calls the edge function **`book-trial`**.
5. `book-trial`:
   - checks a rate limit (`upsert_trial_rate_limit`),
   - reads `trial_settings` and the slot's `timezone` / `duration_min` / `meeting_url`,
   - upserts a `leads` row with status `trial_booked`,
   - cancels any prior booking for that email (this is how "change my slot" works),
   - calls the RPC `upsert_trial_booking`,
   - builds a Google Calendar "add to calendar" URL,
   - invokes **`send-confirmation-email`**; on failure it stamps
     `confirmation_email_failed_at` so an admin can resend.
6. Notable: on most error paths `book-trial` returns **HTTP 200** with an error in the
   body rather than a real error status. That makes genuine failures hard to spot in
   monitoring and is likely part of why the funnel silently produced 59 TBA rows.

### 2.3 What the student sees

`TrialSlotPicker` converts each slot into the **browser's own timezone** via
`Intl.DateTimeFormat().resolvedOptions().timeZone`, and prints
*"All times shown in your local timezone (…)"*. The conversion helper
`convertDateTimeToTimezone` in `src/lib/admin-utils.ts` is correct and DST-aware.

The display maths is sound. The **input data** is not — see §5.

---

## 3. TEACHER SIDE (admin)

**There is an admin UI. It is not all manual SQL.** Three screens exist:

| Component | Lines | What it does |
|---|---|---|
| `admin/trial/AddTrialClassDialog.tsx` | 326 | Create / edit a single trial slot. Fields: date, start time (24h), duration, language, time-of-day, capacity, min-to-run, **timezone (free text)**, meeting URL. Calls `fn_create_trial_slot` / `fn_update_trial_slot`. |
| `admin/TrialClassesManager.tsx` | 1106 | Lists slots and bookings, groups bookings by session, sends confirmation/rebook emails, assigns dates to TBA students. |
| `admin/SchedulingManager.tsx` | 2052 | **Paid-course** packages — not trials. Defaults to `Africa/Cairo`. |

### The timezone field is the root cause

`AddTrialClassDialog.tsx:44` sets the form default to `'Asia/Ho_Chi_Minh'`, and line
294 renders it as a **free-text input** with placeholder `Asia/Ho_Chi_Minh`. There
is no dropdown, no validation, no link to the teacher's actual location. Whatever
string is in that box is written straight to `trial_slots.timezone`.

Meanwhile `src/constants/scheduling.ts:4` declares
`ADMIN_TIMEZONE = "Asia/Kuala_Lumpur"` — the app already *knows* the correct
teacher timezone, but the trial dialog does not use it.

Supporting DB functions that already exist and could be reused:
`fn_create_trial_slot`, `fn_update_trial_slot`, `fn_retire_trial_slot`,
`fn_trial_slot_conflicts`, `fn_suggest_trial_slots`, `fn_set_trial_program_start_date`.

There is **no** screen for recurring availability, no weekly grid, and no way to
block a specific evening. Every slot is entered one at a time by hand.

---

## 4. EMAILS & AUTOMATION

### 4.1 Functions in the repo (auto-deployed on push to `main`)

| Function | Trigger | What it does |
|---|---|---|
| `book-trial` | student clicks Book | Writes booking, then invokes `send-confirmation-email`. |
| `send-confirmation-email` | from `book-trial` + admin screens | The booking confirmation with the meeting link. |
| `send-trial-interest-confirmation` | interest form | "We got your request" for TBA leads. |
| `send-trial-followups` | cron `trial-followups-hourly` (`:15`) via `trigger_trial_followups()` | 4-stage chain: **prep** (day before), **day1** (2 days after → pricing), **day3** (3 days after → WhatsApp nudge), **day7** (7 days after → check-in + referral link). Skips TBA rows. |
| `send-trial-rollover-notifications` | cron (`:35`) via `trigger_trial_rollover_notifications()` | Tells students their trial moved to next month's block. |
| `recover-silent-trials` | — | Chases bookings that never got a confirmation email. |
| `send-trial-broadcast` | admin | Bulk mail to trial leads. |
| `send-class-reminders` | cron 24h / 1h | Pre-class reminders. |

### 4.2 Orphaned hand-deployed functions

Live in production, **no source file in the repo**, and — confirmed by grep — **not
referenced anywhere in `src/` or `supabase/`**. They can only be reached by direct
HTTP call or by something outside this repo.

| Function | Part of trial flow? | Note |
|---|---|---|
| `send-trial-emails` | **yes** | Overlaps `send-confirmation-email`. |
| `rebook-trial` | **yes** | Overlaps the cancel-and-rebook logic inside `book-trial`. |
| `send-rebook-emails` | **yes** | Pairs with `rebook-trial`. `trial_bookings.rebook_email_sent_at` exists for it. |
| `send-trial-invites` | **yes** | Pairs with the `trial_invite_sends` table. |
| `resend-trial-link-update` | **yes** | Pairs with `trial_bookings.link_update_sent_at`. |
| `email-tracker` | indirectly | Open tracking; `trial_bookings.email_opened_at` exists for it. |
| `send-class-broadcast` | no | Paid classes. |
| `zz-tmp-deploy-probe` | no | Leftover debug probe. Safe to delete. |
| **`trial-capacity-alert`** | **yes** | ⚠️ **A 9th orphan, not on the known list.** It was deployed *from* a repo path, but the source file no longer exists in `supabase/functions/`. It is live and frozen at version 5. |

**So 6 of the 8 known orphans are trial-flow functions, plus a 9th (`trial-capacity-alert`)
that was not previously catalogued.**

Because `deploy-functions.yml` deploys everything *in the repo*, these orphans are
never updated and never removed. Any redesign that changes booking behaviour will
leave them running against the old assumptions.

### 4.3 Trial-related cron jobs (all active)

| Job | Schedule | Notes |
|---|---|---|
| `advance-trial-slots` | `10 * * * *` | Rewrites slot dates monthly. See §1.4. |
| `trial-followups-hourly` | `15 * * * *` | The 4-stage email chain. |
| `purge-trial-rate-limits` | `15 * * * *` | Housekeeping. |
| `trial-rollover-notifications-hourly` | `35 * * * *` | |
| `age-stale-trial-bookings` | `0 2 * * *` | Marks past pending bookings `no_show` — **using `Africa/Cairo` dates**, inconsistent with slot timezones. |
| `check-trial-min-group-size` | `0 3 * * *` | Cancels classes under `min_group_size`. |

---

## 5. TIMEZONE HANDLING — the live one-hour error

### How times are stored

Not as UTC. Each slot stores a **naive local time string** (`start_time` text) plus a
**timezone name** (`timezone` text). The real instant is computed on read as
`(trial_date + start_time::time) AT TIME ZONE timezone`.

That design is defensible, but it only works if `timezone` is right. It is not.

### The three conflicting defaults

| Place | Default timezone |
|---|---|
| `trial_slots.timezone` column default | `Asia/Ho_Chi_Minh` (UTC+7) |
| `AddTrialClassDialog.tsx:44` form default | `Asia/Ho_Chi_Minh` (UTC+7) |
| `book-trial/index.ts:225` fallback | `Asia/Ho_Chi_Minh` (UTC+7) |
| `TrialSlotPicker.tsx:190` fallback | **`Asia/Kuala_Lumpur` (UTC+8)** |
| `TrialClassesManager.tsx:654` fallback | **`Asia/Kuala_Lumpur` (UTC+8)** |
| `constants/scheduling.ts` `ADMIN_TIMEZONE` | **`Asia/Kuala_Lumpur` (UTC+8)** |
| `trial_bookings.timezone` column default | `Africa/Cairo` |
| `age-stale-trial-bookings` cron | `Africa/Cairo` |

The frontend fallbacks and the backend fallbacks disagree by one hour. Since all live
rows *do* have a timezone set, the fallbacks are not what is biting — but the value
being set is `Asia/Ho_Chi_Minh`, which is wrong for a teacher in Malaysia.

### What this means concretely

Computed against the live rows:

| Slot as entered | Real instant | **Re's actual local time (MYT)** | Cairo student sees | Cairo *would* see if tz were correct |
|---|---|---|---|---|
| Sep 4, 19:00 | 12:00 UTC | **20:00** | 15:00 | 14:00 |
| Sep 5, 10:30 | 03:30 UTC | **11:30** | 06:30 | 05:30 |
| Sep 6, 22:00 | 15:00 UTC | **23:00** | 18:00 | 17:00 |
| Sep 7, 22:00 | 15:00 UTC | **23:00** | 18:00 | 17:00 |

**Re types 22:00 and the class is actually at 23:00 her time.** Every slot is one hour
later for her, and one hour earlier for the student, than intended.

### Where a Cairo student sees a wrong time

Nowhere in the *conversion* — `convertDateTimeToTimezone` is correct, including DST.
The student sees a time that is *internally consistent* but **built on a source
timezone that is one hour off**. So the student's calendar invite, the confirmation
email, and the picker all agree with each other and all disagree with reality by an
hour.

Secondary risks:
- `book-trial` writes the **slot's** timezone into `trial_bookings.timezone`, so the
  booking inherits the same error.
- The `age-stale-trial-bookings` cron compares against Cairo dates while slots are
  Vietnam/Malaysia — near midnight this can mark a booking `no_show` on the wrong day.
- Egypt observes DST; Malaysia does not. The Cairo↔MYT gap shifts between 5 and 6
  hours across the year, so any hard-coded offset (rather than a named zone) will
  drift twice a year.

---

## 6. GAPS vs the target concept

Target: *Mon–Fri 10:00–19:00 MYT is blocked for trials. Available for trials outside
that, until 24:00 MYT, every day including weekends. Trial = 30 minutes, last start
23:30 MYT. Teacher can manually add extra availability or block specific times.*

| # | Target requirement | Today | Gap |
|---|---|---|---|
| 1 | Availability every day | Once-monthly Fri–Mon block (`trial_block_start_dow=5`, `trial_block_days=4`) | **Fundamental.** Hard-coded in `trial_settings`, `fn_first_trial_block_date`, `advance_trial_slots`. |
| 2 | Rule-based working hours | No concept of working hours at all | **Missing entirely.** Nothing can express "Mon–Fri 10–19 is blocked". |
| 3 | Slots derived from rules | Every slot hand-entered as a dated row | **Missing.** 4 live rows vs ~1,000 30-min slots/month implied by the target. |
| 4 | Last start 23:30 | No bound on start time | Missing; no validation. |
| 5 | 30-minute trial | ✅ `duration_min = 30` | **Already correct.** |
| 6 | Teacher adds extra availability | Add one dated slot at a time via dialog | Partial — works, but one row at a time. |
| 7 | Teacher blocks specific times | ❌ No blocking concept | **Missing.** Only "retire this one slot". |
| 8 | Times in teacher's real timezone | Stored as `Asia/Ho_Chi_Minh` | **Broken.** See §5. |
| 9 | Student picks any free slot | Picks from ≤4 curated group classes | Fundamental. |
| 10 | (implicit) One student per slot | Group classes, capacity 10, `min_group_size` 3 | **Needs a decision — see below.** |

### ⚠️ The open question that changes everything

The target concept describes availability the way a **1:1 calendar** works — the
teacher is free, a student takes 30 minutes. The current system is a **group
classroom** — 10 seats, and the class is cancelled if fewer than 3 people join
(`min_group_size = 3`, cron `check-trial-min-group-size`).

**Which is it?**

- **If trials become 1:1**, we can delete `capacity`, `min_to_run`, `min_group_size`,
  the `check-trial-min-group-size` cron, `trial-capacity-alert` and
  `get_near_capacity_trial_slots` — and we need real overlap protection instead (§7.3).
- **If trials stay group classes**, "Re is free 19:00–24:00 daily" cannot mean every
  30-minute window is bookable, because each booking would open a new near-empty
  class. It would instead mean "Re can *host* in this window", and slots still need
  curating.

I have designed §7 for the **1:1 reading**, since that is what the brief describes,
but this needs Re's confirmation before any code is written. It is the difference
between a 6-day job and a 9-day job.

---

## 7. PROPOSED DESIGN

### 7.1 Core principle: stop storing slots

Do not pre-generate rows for every 30-minute window — that is ~1,000 rows a month to
create, roll forward, and clean up.

Instead store **rules**, and calculate the bookable slots on demand:

```
bookable slots  =  recurring available windows
                 − recurring blocked windows (Mon–Fri 10:00–19:00)
                 − date-specific blocks (Re is busy Thursday evening)
                 + date-specific extra availability (Re opens Tuesday afternoon)
                 − slots already booked
                 − slots inside the minimum booking notice
```

Everything is authored in **`Asia/Kuala_Lumpur`** and converted to the student's
timezone only at display time.

### 7.2 New tables

**`teacher_availability_rules`** — the recurring weekly pattern.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `weekday` | int 0–6 | 0 = Sunday |
| `start_time` | **`time`** | not text this time |
| `end_time` | `time` | `24:00` expressed as `'23:59:59'` or an `end_exclusive` flag |
| `kind` | text | `'available'` \| `'blocked'` |
| `effective_from` | date | lets us change the pattern without losing history |
| `effective_to` | date null | |
| `timezone` | text | `'Asia/Kuala_Lumpur'`, NOT NULL, **validated against `pg_timezone_names`** |
| `class_language` | text null | null = both |

Re's current reality is then **12 rows**:

```
7 × 'available'  00:00–24:00  (every day)
5 × 'blocked'    10:00–19:00  (Mon–Fri)
```

**`teacher_availability_exceptions`** — one-off changes, which always win over rules.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `exception_date` | date | |
| `start_time`, `end_time` | `time` | |
| `kind` | text | `'available'` \| `'blocked'` |
| `reason` | text | shown only to admin |
| `created_by` | uuid | |

**Changes to `trial_bookings`** (additive — do not drop the old columns yet):

- add `starts_at timestamptz` — the unambiguous instant, replacing the
  `trial_date` + `start_time` text + `timezone` triple as the source of truth;
- keep `duration_min`;
- add a generated `slot_range tstzrange` for the overlap guard below.

### 7.3 Real double-booking protection

For a 1:1 model, capacity counting is the wrong tool. Use a Postgres exclusion
constraint, which makes overlapping bookings **impossible at the database level**,
regardless of races between two students clicking at the same moment:

```sql
ALTER TABLE trial_bookings
  ADD CONSTRAINT trial_bookings_no_overlap
  EXCLUDE USING gist (slot_range WITH &&)
  WHERE (status IN ('pending','confirmed'));
```

This is strictly stronger than today's `HAVING count < capacity`, which can be raced.

### 7.4 New read function

```
get_trial_availability_v2(p_from date, p_to date, p_language text)
  → TABLE(starts_at timestamptz, duration_min int, class_language text)
```

Generates 30-minute candidates across the range, applies rules → exceptions →
existing bookings → minimum notice, and returns only genuinely free instants.
Returning `timestamptz` means the frontend no longer has to know about source
timezones at all — a whole category of bug disappears.

Keep the old `get_trial_availability` alive during the transition so nothing breaks.

### 7.5 Admin UI sketch

A single **Trial Availability** page with three parts:

```
┌─ Trial Availability ─────────────────────────────────────────┐
│  All times are YOUR time (Malaysia, UTC+8)                   │
│                                                              │
│  ① MY WEEK          Mon  Tue  Wed  Thu  Fri  Sat  Sun        │
│     00:00–10:00      ▓    ▓    ▓    ▓    ▓    ▓    ▓         │
│     10:00–19:00      ░    ░    ░    ░    ░    ▓    ▓         │
│     19:00–24:00      ▓    ▓    ▓    ▓    ▓    ▓    ▓         │
│                      ▓ open for trials   ░ working, blocked  │
│     [ Edit working hours ]                                   │
│                                                              │
│  ② EXCEPTIONS                                                │
│     Thu 4 Sep   19:00–21:00   Blocked   "dentist"      [×]   │
│     Tue 9 Sep   14:00–16:00   Open      "free morning" [×]   │
│     [ + Block a time ]  [ + Add extra availability ]         │
│                                                              │
│  ③ NEXT 14 DAYS — what students can actually book            │
│     Fri 5 Sep   19:00 19:30 20:00 … 23:30   (10 free)        │
│     Sat 6 Sep   00:00 00:30 … 23:30         (46 free, 2 booked)│
└──────────────────────────────────────────────────────────────┘
```

Panel ③ is the important one: it is a live preview computed by
`get_trial_availability_v2`, so Re can see exactly what a student sees **before**
publishing — which is what would have caught the Vietnam-timezone error immediately.

The timezone free-text box is replaced by a fixed, clearly-labelled "your time"
banner. Re never types a timezone again.

### 7.6 Migration & cleanup plan

1. Add new tables + `starts_at` **additively**. Nothing reads them yet.
2. Backfill `starts_at` on existing bookings from the existing triple.
3. Seed the 12 rules describing Re's real week.
4. Build the admin page; verify panel ③ against Re's own calendar.
5. Switch `TrialSlotPicker` to `get_trial_availability_v2` behind a feature flag.
6. **Disable `advance-trial-slots`** — under rules there is nothing to roll forward.
7. Retire `min_group_size` / capacity machinery *only if* trials go 1:1 (§6).
8. Delete `zz-tmp-deploy-probe`; decide per-function on the 6 trial orphans —
   most are superseded by `book-trial` + `send-confirmation-email`.
9. Fix the timezone on the 4 live rows (§8).

Every schema step is a separate migration PR, applied through the Apply Migrations
workflow — never `db push`, per `docs/APPLYING_MIGRATIONS.md`.

### 7.7 Effort estimate

| Phase | Work | Estimate |
|---|---|---|
| 0 | **Timezone hotfix** (see §8) — independent of everything else | **0.5 day** |
| 1 | Migration: 2 new tables, `starts_at`, exclusion constraint, backfill | 1 day |
| 2 | `get_trial_availability_v2` + tests (DST, midnight boundary, last-start-23:30) | 1.5 days |
| 3 | Admin Trial Availability page (3 panels, live preview) | 2 days |
| 4 | Student picker switched to v2, timezone display, booking write path | 1 day |
| 5 | Email/calendar payloads moved to `starts_at`; verify all 4 followup stages | 1 day |
| 6 | Retire cron + orphan cleanup + old-column removal | 0.5 day |
| 7 | End-to-end test with a real booking, buffer | 1 day |
| | **Total** | **~8.5 days** |

Range: **6 days** if trials stay group-based and we keep capacity as-is;
**9 days** if we move to 1:1 and must also unwind `min_group_size`, the
capacity crons, and `trial-capacity-alert`.

Phase 0 is worth doing on its own, this week, regardless of what is decided about
the redesign.

---

## 8. Recommended immediate actions (before any redesign)

These are **proposals, not changes** — nothing here has been executed.

1. **Fix the timezone on the 4 live slots.** `Asia/Ho_Chi_Minh` → `Asia/Kuala_Lumpur`.
   ⚠️ Decide first *which* is right: does Re want the Sept 6 class at **22:00 or
   23:00** her time? Changing the timezone keeps the 22:00 label and moves the real
   instant an hour earlier; changing the time keeps the instant and relabels it.
   **These have different consequences for the students already emailed.** This needs
   Re's answer, not a guess.
2. **Fix the source of the error**: `AddTrialClassDialog.tsx` should use
   `ADMIN_TIMEZONE` and drop the free-text box. Align the `book-trial` fallback and
   the column default to `Asia/Kuala_Lumpur` in the same change.
3. **Deal with the 59 TBA students.** They are real people waiting. Whatever happens
   to the architecture, they need dates or an honest email.
4. **Make `book-trial` return real HTTP error codes** instead of 200-with-an-error.
   Without this we will not notice the next silent funnel failure either.
5. **Remove the `/trial-book` route** or finish it — a 1,122-line dead page is
   reachable in production today.
6. **Delete `zz-tmp-deploy-probe`.**

None of items 1–6 requires the redesign. Items 1, 2 and 4 are what stop the funnel
producing more broken bookings.

---

## Appendix — how this was verified

Read-only throughout. No writes, no deploys, no migrations.

- **Live DB** (`ewtdgpbybkceokfohhyg`) via read-only SQL: `information_schema.columns`,
  full `trial_slots` and `trial_settings` dumps, `trial_bookings` aggregated by status,
  `pg_constraint` + `pg_indexes`, `pg_policies`, `pg_proc` / `pg_get_functiondef` for
  `get_trial_availability` and `advance_trial_slots`, and `cron.job`.
- **Timezone table in §5** computed directly in Postgres with
  `AT TIME ZONE` against the live rows — not calculated by hand.
- **Repo**: `supabase/functions/`, `supabase/migrations/` (36 trial-related files),
  `src/pages/{FreeTrial,TrialBooking,TrialBook,TrialConfirm}Page.tsx`,
  `src/components/TrialSlotPicker.tsx`, `src/components/admin/**`,
  `src/lib/admin-utils.ts`, `src/constants/scheduling.ts`, `src/App.tsx`.
- **Orphan check**: `mcp__Supabase__list_edge_functions` cross-referenced against
  `ls supabase/functions/` and a `grep -rl` over `src/` and `supabase/`.

Not verified: actual email rendering (no test send was made), and whether the 59 TBA
students were contacted by some channel outside this repo.
