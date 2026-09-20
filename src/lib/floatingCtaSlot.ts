// OBSOLETE — DELETE THIS FILE.
//
// This was a duplicate, parallel implementation of the bottom-widget
// coordinator written against a stale snapshot of `main` (before PR #484
// and PR #487 landed). The real, already-merged coordinator is
// `src/lib/bottomLayer.ts` (useBottomSlot), which all four floating
// widgets now use. Nothing imports this file. It was left un-deleted on
// 2026-09-19 because the session that found the mistake had file
// read/write access to this device but no shell/git access to delete it.
//
// Safe to delete along with the sibling `useFloatingCtaSlot.ts` in
// src/hooks/ — see claude/open-fixes-checklist.md, item 8, for the full
// story.
export {};
