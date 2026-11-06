# Klovers

Online Korean language academy — live at **https://kloversegy.com**.

## Meta Global AI Developer Hackathon — KLOVERS AI Room Lab + World 2

**Play it:** https://kloversegy.com/world2 (no login needed)

KLOVERS teaches Korean to Arabic speakers inside **KLOVERS World**, a live 3D
story game (https://kloversegy.com/world). Every new learning room used to take
days of hand design. For the hackathon we built **AI Room Lab**, which uses
Meta's models to propose new rooms, and **KLOVERS World 2**, a playable world
whose two rooms were designed with it.

**How Meta's models are used** (`supabase/functions/generate-ai-room-concept/index.ts`):
- **Muse Image** (`muse-image-1.0`) generates two A/B concept variants of a room
  from a text theme, via the image-edits endpoint with our canon character art
  as references, so Adam, Lina and Cluby appear as themselves.
- **Muse Spark** (`muse-spark-1.3`) writes a structured JSON design brief for each
  variant: room name, Korean vocabulary to teach, props, palette, learner action.
- A developer picks a variant and builds it. Both World 2 rooms came out of this.
  (SAM 3.1 asset segmentation was planned and scoped out for the deadline.)

**Where the code is:**
| What | Path |
|---|---|
| AI Room Lab edge function (Meta Model API calls) | `supabase/functions/generate-ai-room-concept/index.ts` |
| AI Room Lab admin page (`/admin/ai-room-lab`) | `src/pages/AiRoomLabPage.tsx` |
| World 2 page: tabs, map, vocab & dialogue cards, Hangul, progress | `src/world2/World2Page.tsx` |
| Entrance courtyard / Street-food cart / Convenience store | `src/world2/EntranceScene.tsx`, `World2Scene.tsx`, `ConvenienceStoreScene.tsx` |
| Characters, movement, collision, chase + first-person camera | `src/world2/shared.tsx` |
| Sky, landscape, HDR light and light rig reused from KLOVERS World | `src/world2/World1Stage.tsx` |

World 2 reuses KLOVERS World's own engine pieces (rigged characters, building
kit, textures, collision and movement maths in `src/game/`) rather than
re-creating them.

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
