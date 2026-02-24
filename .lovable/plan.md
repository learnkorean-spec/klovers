

# Plan: Replace Level System with TOPIK/CEFR International Classification

## Summary

Create a single source of truth for levels (`src/constants/levels.ts`) and replace all hardcoded level arrays across ~10 files. Existing DB values (stored as normalized snake_case strings like `beginner_1`) are preserved via a legacy mapping layer.

## Technical Details

### 1. New file: `src/constants/levels.ts`

Creates the canonical `LEVELS` array with 7 entries (Foundation + Levels 1-6), each containing: `id`, `key`, `name`, `shortLabel`, `topik`, `cefr`, `order`, `description_en`, `description_ar`.

Exports:
- `LEVELS` array
- `getLevelById(id: number)` — lookup by numeric id
- `getLevelByKey(key: string)` — lookup by key string
- `formatLevelLabel(level)` — returns "Level X — TOPIK Y / CEFR Z"
- `isFoundationLevel(id)` — checks if id === 0
- `normalizeLevel(label: string)` — the single canonical normalizer (removes duplicates from 4 files)
- `mapLegacyLevel(legacyKey: string)` — maps old keys like `beginner_1`, `beginner_2`, `intermediate_1`, etc. to new level objects; returns `undefined` with console.warn for unknown levels
- `LEVEL_KEYS` — just the key strings for dropdowns
- `LEVEL_SELECT_OPTIONS` — `{value, label}[]` for Select components

Legacy mapping table:
```
beginner_1, beginner-1 → level_1
beginner_2, beginner-2 → level_2
intermediate_1, intermediate-3 → level_3
intermediate_2, intermediate-4 → level_4
advanced_1, advanced-5 → level_5
advanced_2, advanced-6 → level_6
hangul → foundation
topik_1, topik_2, topik → (kept as special keys, mapped to closest or null)
```

### 2. Files to update

| File | Change |
|------|--------|
| `src/constants/levels.ts` | **NEW** — single source of truth |
| `src/components/admin/LevelSlotConfig.tsx` | Replace hardcoded `LEVELS` array (line 13-17) with import from constants |
| `src/components/admin/LevelGroupConfig.tsx` | Replace hardcoded `LEVELS` array (line 12-17) with import from constants |
| `src/components/admin/SlotManager.tsx` | Replace hardcoded `LEVELS` (line 45) and `newLevel` default (line 59) |
| `src/components/admin/GroupMatcher.tsx` | Remove local `normalizeLevel`, import from constants; use `mapLegacyLevel` for display labels |
| `src/components/admin/StudentManager.tsx` | Replace `COURSE_LEVELS` (lines 100-110) with `LEVEL_SELECT_OPTIONS` from constants |
| `src/pages/EnrollNowPage.tsx` | Replace hardcoded `LEVELS` (line 97) and local `normalizeLevel` (line 379) with imports |
| `src/pages/ResubmitSchedulePage.tsx` | Replace hardcoded `LEVELS` (line 14) and local `normalizeLevel` (line 17) with imports |
| `src/pages/AdminDashboard.tsx` | Remove local `normalizeLevel` (line 91), import from constants |
| `src/components/CoursesSection.tsx` | No code change needed (content comes from translations) |
| `src/components/LearningRoadmap.tsx` | No code change needed (content comes from translations) |
| `src/i18n/translations.ts` | Update `courses.items` and `roadmap.stages` in both EN and AR to reflect the 7-level TOPIK/CEFR structure with new descriptions |

### 3. Translation updates (`src/i18n/translations.ts`)

**Roadmap stages** — expand from 3 stages to a clear 7-level progression (Foundation through Level 6), each with TOPIK/CEFR tags.

**Course items** — replace the current 6 cards (Level 0, Level 1-2, Level 3-4, Level 5-6, Special, TOPIK) with 7 individual level cards plus the 2 special tracks (Reading & Speaking, TOPIK Prep) kept as-is.

Both EN and AR sections updated with the exact copy provided in the task.

### 4. Backwards compatibility

- DB values remain unchanged (stored as snake_case strings).
- `mapLegacyLevel()` provides safe resolution from any old format to the new level object.
- Unknown levels return `undefined` and log a warning — UI shows "Unknown Level" fallback.
- The `normalizeLevel()` function stays identical in behavior, just centralized.
- No DB migration needed — this is a display/code-only change.

### 5. Special tracks handling

"Reading & Speaking" and "TOPIK Preparation" are not part of the TOPIK 1-6 progression. They will be kept in the courses/translations but NOT added to the `LEVELS` constant. Admin scheduling dropdowns will include them as separate options via an exported `SPECIAL_TRACKS` array if needed, or they can remain in translations only.

### 6. Dev validation

A `validateLevels()` function exported from `src/constants/levels.ts` that asserts unique IDs, ascending order, and TOPIK === id for levels 1-6. Called in dev mode only (wrapped in `import.meta.env.DEV` check).

