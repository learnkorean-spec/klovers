# kloversegy.com — AI-sounding language cleanup (ongoing)

Goal (from Re, 20 Oct 2026): every piece of visible site copy, EN and AR,
should read like a real person wrote it. In particular: no "AI em-dash" (—)
used the clichéd way, and no stock AI marketing phrases ("dive into",
"unlock", "seamless", "whether you're X or Y", etc). This is an **ongoing**
job, not a one-off — each session should pick up where the last left off and
leave this file updated for the next one.

This file tracks progress page-by-page / area-by-area, same style as
`claude/klovers-audit-report.md`.

## Update 20 Oct 2026 16:00–16:15 Bangkok (desk session) — first pass

No prior progress file existed; this is pass #1. Scope was the hand-written
React/TSX marketing copy in `src/` (homepage, trial/enroll flow, pricing FAQ,
the four `Learn*Page.tsx` landing pages, curriculum descriptions, and one
admin-facing email-template file). Blog posts live in Supabase
(`blog_posts` table), not in the repo, and were **not** touched this pass —
see "Not done yet" below.

**Method:** grepped `src/` for the em-dash character and for a list of stock
AI phrases (dive into, unlock, unleash, seamless, elevate your, testament
to, navigate the, tapestry, whether you're, moreover, furthermore, etc.),
then manually reviewed every hit. Code comments, dev-only strings, and
UI placeholder dashes (e.g. `"—"` shown for a missing price) were left alone
— those aren't visible prose and changing them wouldn't serve the goal.
Only user-facing strings (JSX text, FAQ answers, SEO titles/descriptions,
JSON-LD `name` fields, toast/WhatsApp message templates, email HTML) were
rewritten, and only for tone — no facts, numbers, names, or claims were
added, removed, or changed.

**Fixed, committed, deployed this pass:**
- `src/pages/Index.tsx` — homepage `<title>` (EN + AR), em-dash → colon.
  Also updated the matching hard-coded copy in `scripts/prerender-meta.mjs`
  (the static-HTML prerender has its own copy of this string, which
  `scripts/lib/home-meta-sync.test.mjs` checks stays in sync — caught by
  the test suite, fixed there too).
- `src/pages/LearnArabicPage.tsx` — full pass, EN + AR: SEO title/description,
  all 3 FAQ Q&As, Reham's bio pull-quote and body paragraph, the "audience"
  list (3 items), all 3 "how it works" step bodies, the Fusha/Masri
  comparison cards, the "most students want a mix" line, the trial-booking
  intro line + WhatsApp fallback message, and the closing CTA line. This
  page is now clean of both em-dashes-as-prose and the flagged cliché
  phrases (remaining `—` in the file are all in code comments, which don't
  render).
- `src/pages/LearnKoreanArabicSpeakersPage.tsx` — full pass, same treatment,
  now clean (4 em-dashes fixed, no cliché phrases found).
- `src/pages/PlacementTestPage.tsx` — "dive into" in the Level 3 result
  description, rewritten.
- `src/pages/PricingPage.tsx` — 2 FAQ answers with mid-sentence em-dashes,
  rewritten with comma/colon.
- `src/pages/FreeTrialPage.tsx` — JSON-LD event name (EN+AR), and the
  "trial classes open once a month" line (EN+AR).
- `src/pages/EnrollNowPage.tsx` — JSON-LD course name, all 3 WhatsApp
  pre-filled message templates, and the "First class!" step-card
  description.
- `src/pages/TrialBookingPage.tsx` — 6 user-facing strings: the
  too-many-attempts toast, the Arabic "while you wait" countdown label, the
  2 referral-share lines, the guest-checkout no-account note, and the
  auto-selected-language note.
- `src/constants/koreanCurriculum.ts` — "Deep dive into Korean culinary
  traditions" → "Korean culinary traditions and table customs." (one
  course-catalog description; the Arabic sibling was already fine).
- `src/components/admin/BulkEmailManager.tsx` — all 4 bulk-email HTML
  templates (welcome, new-course-announcement, textbook-launch, plus the
  "— The Klovers Team" sign-off used in 3 templates). Rewrote the
  "whether you're X or Y" openers, the textbook feature-bullet list (dash
  separators → colons, kept every factual detail — e.g. "AI-generated
  illustrations" and "gamified progress" are real facts and were kept, only
  the punctuation/phrasing changed), and removed the dash from the
  sign-off line.

**Judgment calls made (for the next session to know about, not to redo):**
- UI placeholder dashes (`"—"` standing in for "no value yet", e.g. an
  unset price) were left as-is — that's a standard UI convention, not AI
  prose, and isn't what Re is asking to remove.
- Em-dashes inside `//` and `/* */` code comments were left alone —
  developers read those, not site visitors, so they don't affect how the
  site "sounds."
- `src/components/TestimonialsSection.tsx` — the only hits were in code
  comments ("seamless loop"), not rendered text. No change needed.
- `src/components/admin/RehamTrainingPanel.tsx` has one "seamless
  operations" phrase in Reham's bio text, but that panel is internal
  training data for an interview/AI tool (`InterviewTrainingPage.tsx`), not
  copy a site visitor or student ever sees. Left out of scope per Re's own
  "not internal tooling labels" carve-out — flag if this turns out to be
  wrong.
- A couple of literal, non-metaphorical uses of "navigate" (e.g. "navigate
  the supermarket" in a curriculum description) were left alone — that's
  not the AI cliché pattern ("navigate the landscape of X"), it's just the
  ordinary verb used correctly.
- Rewrote, not just de-dashed: a few sentences used the dash to glue
  together a generic "whether you're A or B" marketing frame (the
  BulkEmailManager welcome/course-announcement emails); those got a real
  rewrite, not just punctuation swapped, since the dash wasn't the only
  problem there.
- `src/pages/EnrollNowPage.tsx` and `src/pages/TrialBookingPage.tsx` keep
  the `"—"` placeholder character for an unset price display (3 spots) —
  intentionally not touched, see first bullet above.

**Verified before committing:** `npx vitest run` → 87 files / 1356 tests
pass (had to also fix `scripts/prerender-meta.mjs`'s copy of the homepage
title, which a sync test caught). `npm run build` → succeeds (the Supabase
blog-fetch warning during build is expected/pre-existing — no DB credentials
in this session, falls back to the committed blog-route cache, same as
documented in `klovers-audit-report.md`). `npx eslint` on the touched files
→ no new errors or warnings introduced (the handful of pre-existing
`no-empty` / `no-explicit-any` hits are unrelated lines, already-known debt
per `CLAUDE.md`).

## Not done yet / next session should start here

1. **`src/pages/LearnEnglishPage.tsx`** (34 em-dash hits) and
   **`src/pages/LearnHungarianPage.tsx`** (30 hits) — same family of page as
   LearnArabicPage/LearnKoreanArabicSpeakersPage, almost certainly the same
   pattern (em-dash used as a soft separator in FAQ/bio/feature copy).
   Not started yet. Do these next, same method as LearnArabicPage above.
2. **The rest of `src/pages/*.tsx`** — only the pages listed above were
   checked for the cliché-phrase list; the em-dash grep across `src/`
   returned 250+ files (grep's match-limit cap, so the real count is
   higher), most of which are code comments or non-prose (type files, test
   files, dash-as-UI-placeholder). Each remaining page under `src/pages/`
   should get the same targeted review: grep that one file for `—` and for
   the cliché-phrase list, read the hits in context, skip comments/
   placeholders, rewrite the rest.
3. **`src/i18n/translations.ts`** (240KB) and **`src/i18n/dashboardPageExtra.ts`**
   — checked only for the cliché-phrase list (clean), **not yet checked for
   em-dash** (file too large to grep-and-eyeball in one go the way the page
   files were; needs a scripted pass that extracts just the string values
   around any `—` and reviews them in batches).
4. **Blog posts** — 200+ posts live in Supabase's `blog_posts` table, not
   in this repo (confirmed via `klovers-audit-report.md`'s 17–18 Oct
   updates, which edited blog content directly via SQL). This repo clone
   has no DB credentials, so blog content wasn't touched this pass. Next
   session needs `mcp__Supabase__execute_sql` (or whichever Supabase tool
   is available) against project `ewtdgpbybkceokfohhyg` to pull post bodies,
   batch-check them (don't try all 200+ in one run), rewrite flagged ones
   with an `UPDATE`, and track which post slugs are done/left in this file.
5. **Meta descriptions / SEO copy** on pages not yet reviewed, and
   **error/empty-state toast messages** site-wide beyond the ones already
   fixed in TrialBookingPage — only spot-checked where `—` or a cliché
   phrase showed up in the pages already covered; a dedicated sweep of
   `toast({...})` calls across `src/` hasn't been done yet.
6. **Admin/teacher-facing copy that's actually user-visible** (as opposed
   to internal tooling labels) hasn't been swept yet beyond
   `BulkEmailManager.tsx` — e.g. check transactional email templates
   elsewhere in the codebase (`trialConfirmationEmail.ts` mentioned in
   `src/lib/` turned up in the broad em-dash grep and hasn't been reviewed
   line-by-line yet).

## Status

**Not a full pass yet.** Don't skip straight to "light periodic re-check"
mode — there's real unreviewed surface area (item 1–6 above). Next session:
pick up at item 1 (LearnEnglishPage / LearnHungarianPage), work down the
list, update this file the same way each time.
