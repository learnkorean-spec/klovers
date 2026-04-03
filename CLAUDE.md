# Klovers — Claude Code Instructions

## Git Workflow

- **Always merge feature branches to `main`** when work is complete. Do not leave branches unmerged.
- Use `git merge --no-ff <branch>` then `git push origin main`.
- GitHub Actions deploys on push to `main` (Supabase functions auto-deploy via CI).

## Project Overview

Korean language learning platform targeting Arabic speakers and K-drama fans (Egyptian / Middle East market).

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Edge Functions on Deno)
- AI: Lovable AI Gateway → `google/gemini-2.5-flash` (`LOVABLE_API_KEY`)
- Admin panel: `src/pages/AdminDashboard.tsx`

## Supabase Functions

| Function | Purpose |
|---|---|
| `seo-orchestration` | Multi-agent SEO analysis (analyze/fix modes) |
| `image-audit` | EN/AR bilingual image alt text audit |
| `article-generator` | Generate up to 5 blog draft articles from topic gaps |
| `article-generator` | Accepts `ArticleSpec[]`, inserts as unpublished drafts |

## Token Efficiency Rules

- Triage runs locally (no AI tokens) first
- Only posts with gaps get queued for AI
- Batch up to 5 posts per AI call
- Never send full article content — title, description, keywords, headings only
