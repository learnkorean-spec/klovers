#!/usr/bin/env bash
# Vercel "Ignored Build Step" — wired up via `ignoreCommand` in vercel.json.
#
# Contract (https://vercel.com/docs/project-configuration/vercel-json):
#   exit 0 -> IGNORE the build (skip it)
#   exit 1 -> CONTINUE with the build
#
# Why this exists
# ---------------
# `refresh-open-prs.yml` merges main into every open PR branch whenever main
# moves, so an open PR's CI describes the current merge result rather than a
# stale one. That is correct and worth keeping. What it also did was push one
# commit per open PR, and every one of those pushes created a Vercel preview
# deployment.
#
# Measured on 2026-08-31: 90 commits pushed in a day, 68 of them these bot
# merges. The Hobby plan allows 100 deployments/day and builds ONE at a time,
# so a single merge to main queued ~15 preview builds and the production
# deploy — the one that actually reaches students — waited behind all of them.
#
# These bot merge commits contain no authored change: their tree is the PR
# branch plus whatever main already shipped. A preview of them is worth
# nothing, while CI on them is worth everything — and CI is a separate system
# that this does not touch (refresh-open-prs dispatches ci.yml explicitly).
#
# Fails safe: every path that is not positively identified as a bot refresh
# merge on a non-main branch exits 1 and builds. Production can never be
# skipped by this script, because main returns 1 before anything else runs.
set -uo pipefail

REF="${VERCEL_GIT_COMMIT_REF:-}"
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"

# Production always builds. First check, no exceptions, so a bug below can
# never take kloversegy.com offline.
if [ "$REF" = "main" ] || [ -z "$REF" ]; then
  echo "vercel-ignore-build: ref='$REF' -> BUILD (production or unknown ref)"
  exit 1
fi

# The exact subject `git merge` writes in refresh-open-prs.yml.
if printf '%s' "$MSG" | grep -Eq "^Merge remote-tracking branch '?origin/main'? into "; then
  echo "vercel-ignore-build: refresh-open-prs merge commit on '$REF' -> SKIP"
  echo "  (no authored change here; ci.yml still runs, dispatched explicitly)"
  exit 0
fi

echo "vercel-ignore-build: ref='$REF' -> BUILD"
exit 1
