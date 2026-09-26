# Klovers

Online Korean language academy — live at **https://kloversegy.com**.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (Postgres, Auth, Edge Functions on Deno) — project `ewtdgpbybkceokfohhyg`
- Hosting: Vercel (deploys `main` automatically)
- Email: Resend (`noreply@kloversegy.com`)
- AI: OpenAI via `supabase/functions/_shared/ai.ts`

## Run locally

```sh
npm install
npm run dev
```

## Deploy

- Website: push to `main` → Vercel builds and publishes kloversegy.com.
- Database migrations and edge functions: `.github/workflows/`.

See `CLAUDE.md` for the working rules of this repo.
