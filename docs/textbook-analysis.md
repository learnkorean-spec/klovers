# Textbook Analysis Report

**Date:** 2026-04-06  
**Branch:** `claude/analyze-textbook-LKH4w`  
**Scope:** Content quality, coverage gaps, UX/UI issues, database schema

---

## Executive Summary

| Area | Status | Critical Issues |
|---|---|---|
| DB Schema | ⚠️ Issues Found | Missing FK indexes, duplicate migration timestamps, no `updated_at` |
| Content Coverage | ⚠️ Partial | Daily-routine lessons 1-20 have NO content (20/299 missing) |
| Content Quality | ✓ Good | All seeded lessons complete with 5 sections |
| UX/UI | ⚠️ Issues Found | Broken routing, mobile tabs overflow, `writing_done` bug, i18n gaps |

---

## 1. Database Schema

### Critical

- **Missing indexes on all FK columns** — `lesson_id` in `lesson_vocabulary`, `lesson_grammar`, `lesson_dialogues`, `lesson_exercises`, `lesson_reading` has no index. Every lesson page load does a full table scan.

  Fix:
  ```sql
  CREATE INDEX idx_lesson_vocabulary_lesson_id ON lesson_vocabulary(lesson_id);
  CREATE INDEX idx_lesson_grammar_lesson_id ON lesson_grammar(lesson_id);
  CREATE INDEX idx_lesson_dialogues_lesson_id ON lesson_dialogues(lesson_id);
  CREATE INDEX idx_lesson_exercises_lesson_id ON lesson_exercises(lesson_id);
  CREATE INDEX idx_lesson_reading_lesson_id ON lesson_reading(lesson_id);
  ```

### Medium

- **Duplicate migration timestamps:**
  - `20260404000000` — two files: `add_topik_level_and_book_unique.sql` + `placement_leads_anon_policy.sql`
  - `20260405000001` — two files: `fix_manual_enrollment_validation.sql` + `korean1_lessons_1_50.sql`
  - Execution order is undefined; could cause race conditions on fresh DB.

- **No `updated_at` on lesson content tables** — `lesson_vocabulary`, `lesson_grammar`, `lesson_dialogues`, `lesson_exercises`, `lesson_reading` all have no timestamp. Audit and change tracking impossible.

### Low

- `lesson_reading.english_text` accepts NULL despite having `DEFAULT ''` — should be `NOT NULL DEFAULT ''`.
- No CHECK constraint on `lesson_exercises.correct_index` to validate it is within bounds of the `options` JSONB array.
- `topik_level` ranges are hardcoded in migration; reordering lessons would corrupt level assignments.

### What's Good

- ✓ RLS enabled on all tables with public SELECT, admin-only write
- ✓ All FKs use `ON DELETE CASCADE`
- ✓ UNIQUE(book, sort_order) constraint prevents duplicate lessons
- ✓ All 299 lesson metadata rows are seeded

---

## 2. Content Coverage

### Gap Found

**Daily-Routine lessons 1–20 have no content** — only lessons 21–32 are seeded.

| Book | Total Lessons | Content Seeded | Missing |
|---|---|---|---|
| korean-1 | 180 | 180 | 0 ✓ |
| daily-routine | 32 | 12 (lessons 21-32) | **20 (lessons 1-20)** |
| kdrama | 30 | 30 | 0 ✓ |
| grammar-mastery | 57 | 57 | 0 ✓ |
| **Total** | **299** | **279** | **20** |

Users who open the Daily Routine book and click any of the first 20 lessons will see empty tabs (no vocab, grammar, dialogue, exercises, or reading).

### Title Mismatch

korean-1 lessons 51–120 titles in seed migrations do not match `src/constants/koreanCurriculum.ts`:
- Seed title for lesson 51: "Korean Culture (한국 문화)"
- Curriculum title for lesson 51: "Likes and Dislikes (좋아하다/싫어하다)"

Either the curriculum constant or the migration was updated without syncing the other. This affects what users see in the lesson list vs. what they study.

### What's Good

- ✓ All seeded lessons have all 5 sections (vocab, grammar, dialogue, exercises, reading)
- ✓ Vocab: 10-20+ words per lesson with Korean, romanization, English
- ✓ Grammar: 2-5 patterns with structure, explanation, JSONB examples
- ✓ Dialogues: 5-9 exchanges with speakers, Korean, romanization, English
- ✓ Exercises: 5 MCQ with 4 options, correct index, detailed explanation
- ✓ Reading: 1 passage with Korean + English translation
- ✓ Cultural context embedded (K-drama scenes, Korean daily life)
- ✓ Idempotent seed pattern — safe to re-run migrations

---

## 3. UX/UI Issues

### Critical

**Broken routing — hardcoded `korean-1` slug**

- `WorldPathMap.tsx:99` — lesson nodes link to `/textbook/korean-1/{sort_order}` regardless of which book is being viewed
- `TextbookProgressPage.tsx:178` — lesson dots link to `/textbook/{sort_order}` missing `bookId` entirely

Users in daily-routine, kdrama, or grammar-mastery who click a lesson node land on a wrong or missing route.

Fix: Pass `bookSlug` prop into `WorldPathMap`; update progress page links to `/textbook/${lesson.book}/${lesson.sort_order}`.

### High

**`writing_done` excluded from chapter completion logic**

- `useGamification.ts:200` — completion check only checks 5 sections (`vocab_done`, `grammar_done`, `dialogue_done`, `exercises_done`, `reading_done`) but not `writing_done`
- `writing_done` exists in the UI (6th tab) but is not in the `UserProgress` type either
- Result: chapter completion overlay never triggers when writing is the last section completed; the `(lp as any).writing_done` cast disables type checking

Fix:
```typescript
// useGamification.ts — add writing_done to type and completion check
lessonProgress: Record<number, {
  vocab_done: boolean;
  grammar_done: boolean;
  dialogue_done: boolean;
  exercises_done: boolean;
  reading_done: boolean;
  writing_done: boolean;  // ADD THIS
  chapter_completed: boolean;
}>;

const allDone = ["vocab_done", "grammar_done", "dialogue_done", "exercises_done", "reading_done", "writing_done"]
  .every(s => s === section ? true : existing[s as keyof typeof existing]);
```

**6-column tab grid on mobile** (`LessonDetailPage.tsx:387`)

`grid-cols-6` with `text-xs` on small screens makes tabs unreadable/cramped. Needs `grid-cols-3 md:grid-cols-6` with scroll or abbreviated labels on mobile.

### Medium

| Issue | File | Line | Fix |
|---|---|---|---|
| 4-tab overflow on progress page | TextbookProgressPage.tsx | 119 | `grid-cols-2 md:grid-cols-4` |
| No aria-labels on lesson nodes | WorldPathMap.tsx | 98-143 | Add `aria-label={lesson.title_en}` |
| Hardcoded "Boss"/"CP" not translated | WorldPathMap.tsx | 136 | Use `t()` function |
| "Couldn't load this lesson" not translated | LessonDetailPage.tsx | 211 | Use `t()` function |
| No empty state when book has 0 lessons | TextbookPage.tsx | 232-267 | Add fallback message |
| No `tabIndex={0}` on flip card div | LessonDetailPage.tsx | 467 | Add `tabIndex={0}` |
| Vocab cards not memoized (100+ rerenders) | LessonDetailPage.tsx | 458 | Wrap with `React.memo` |
| RTL back arrow points wrong direction | TextbookProgressPage.tsx | 92 | `{isAr ? '→' : '←'}` |

### Low

- Loading skeleton assumes 3 worlds × 4 lessons; doesn't match path vs grid view mode — causes layout shift
- Muted text on muted background on lesson cards may fail WCAG AA contrast
- WorldPathMap lesson labels have hardcoded `max-w-[140px]` that truncates on very small screens

---

## 4. Prioritized Action Plan

### P0 — Fix Before Launch

1. **Seed daily-routine lessons 1-20** — content gap blocks 63% of the daily-routine book
2. **Fix routing in WorldPathMap** — broken links for 3 of 4 books
3. **Add FK indexes** — performance issue on every lesson page load

### P1 — Fix Soon

4. **Fix `writing_done` in useGamification** — gamification completion bug
5. **Resolve duplicate migration timestamps** — rename files to avoid ordering issues
6. **Sync korean-1 lesson titles** between curriculum.ts and seed migrations

### P2 — Polish

7. Fix mobile tab grid breakpoints
8. Add `writing_done` to UserProgress type (remove `as any` casts)
9. Translate hardcoded strings ("Boss", "CP", error messages)
10. Add `updated_at` to lesson content tables
11. Fix RTL back arrow direction
12. Add empty state for 0-lesson books
