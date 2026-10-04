# KLOVERS World — production assets still needed

Written 5 Oct 2026, during the world experience pass. It records what the 3D
world is built from today, which parts of it are placeholder, and what a real
production asset has to be for each gap.

The short version: **there is no GLB/GLTF pipeline in this project at all.**
Every character, prop and building in `/world` is procedural three.js geometry
assembled in code. That is why the world loads with no downloads and stays one
draw call per material — and it is also the ceiling on how good the characters
can look. Nothing here is an oversight; it is a trade that should now be made
deliberately.

## What exists today

| Piece | File | Kind | Lines of truth |
|---|---|---|---|
| Playable learners | `src/game/player/LearnerAvatar.tsx` | procedural meshes | Adam and Lina are built from primitives; their *look* is data in `player/characters.ts` |
| Learner wardrobe | `src/game/player/characters.ts` | colour data only | dressed from `KLOVERS_WORLD.characters` — Adam's klovers-yellow blazer over an ivory tee, ivory trousers, white sneakers; Lina's ivory hanbok-inspired wrap top, klovers-yellow midi skirt with white floral embroidery, yellow sash, ivory flats |
| Cluby | `src/game/player/Cluby.tsx` | procedural meshes | body, horns, ears, tail, hop and celebrate animations |
| Ambient people | `src/game/npc/people.ts`, `Npc.tsx` | one shared base + variants | 14 cast members in `npc/cast.ts`, each a colour/part spec: skin, hair style, top, lower, over-layer, held prop |
| Minsu | `src/game/npc/cast.ts` (`minsu`) | **provisional colour spec** | see below — the weakest gap in the world |
| Clover egg | `src/game/environment/CloverEgg.tsx` | procedural meshes | still, cracked, glowing and hatched states |
| Buildings and props | `src/game/environment/kit.ts` | 27 procedural builders | hanok halls, roofs, wall runs, gates, lanterns, planters, carts, baskets, notice boards, trees, rocks, flowers, stepping stones |
| Ground and sky | `environment/textures.ts`, `Backdrop.tsx` | painted canvases + vertex-coloured dome | no image files; the floors are painted at runtime |

**Minsu is the one character the canon describes in detail and the world only
approximates.** `KLOVERS_WORLD.characters` fixes his look — short black hair, a
pale periwinkle button shirt with the sleeves rolled, near-black trousers, a
navy lanyard with a white card — from Re's Book 1 artwork of 27 Sep 2026. In
the world he is `cast.ts`'s `minsu` entry, commented "Provisional look": the
right colours on the shared ambient-body base. He has no artwork file anywhere
in the repository, and he is written into the Book 1 conversations in
`src/constants/conversations.ts`. So a reader meets him in text and never sees
him properly. **Do not solve this by inventing several different Minsus.** One
asset, made once, from the canon description.

## What is needed, in priority order

Polygon budgets assume one character on screen at a time, mobile-first, in a
scene that already runs 25 ambient people. Treat them as ceilings, not targets.

### 1. Minsu — the highest-value gap

| | |
|---|---|
| Purpose | the canon's fourth character: a Korean friend and conversation partner, never a teacher and never a romantic interest |
| Format | GLB with Draco or meshopt compression; textures embedded |
| Poly budget | 8–12k triangles |
| Texture | one 1024² albedo baked from the canon colours; no PBR maps beyond a roughness pack |
| Animations | idle · talking (loop, used in `conversations.ts` scenes) · walk |
| Replaces | `cast.ts` → `minsu` on the shared ambient base |
| Must honour | pale periwinkle rolled-sleeve shirt, near-black trousers, navy lanyard with a white card, short black hair |

### 2. Adam and Lina — the playable pair

| | |
|---|---|
| Purpose | the learner walks as one of them from a third-person camera; they are friends and study companions, and the silhouettes should make that unremarkable rather than suggestive |
| Format | GLB, compressed as above |
| Poly budget | 12–18k triangles each |
| Texture | 1024² albedo; the yellows must match `PALETTE.yellow` (`#FFFF00`) exactly, since the brand colour is a hard value everywhere else |
| Animations | idle · walk · run · turn · sit · talk — the world already drives movement, running and turning from `systems/movement.ts`, so the clips must match those states |
| Replaces | `LearnerAvatar.tsx` primitives, keeping `characters.ts` as the wardrobe source of truth |
| Must honour | Adam: wavy dark-brown hair, yellow tailored blazer, ivory tee, ivory trousers, white sneakers. Lina: long wavy auburn-copper hair, ivory hanbok-inspired wrap top, yellow midi skirt with white floral embroidery, yellow sash, ivory flats, freckles. **Both are explicitly neither Korean nor Asian** — that is fixed in the canon and is not a styling choice |

### 3. Cluby — the companion

| | |
|---|---|
| Purpose | memory keeper and discovery guide; hatches from the egg after real learning milestones |
| Format | GLB, compressed |
| Poly budget | 6–10k triangles |
| Texture | 1024² albedo only |
| Animations | idle · hop · celebrate · point (the world already calls `point(x, z)` and `celebrate()`) · hatch |
| Replaces | `Cluby.tsx` procedural body |
| Must honour | the existing 3D plush renders in `public/assets/cluby/` are the visual reference — mint-green plush, butter-yellow horns, ivory hanbok top, yellow wrap skirt, green four-leaf clover on the chest. He is **not a pet** and must not read as one |

### 4. The Clover Egg

| | |
|---|---|
| Purpose | the story's hinge — the thing that reacts to real learning |
| Format | GLB with the four states as either morph targets or four meshes |
| Poly budget | 2–4k triangles |
| Texture | 512² ivory albedo with the green clover mark |
| Animation | a subtle idle shimmer, plus the crack/glow/hatch transitions |
| Replaces | `CloverEgg.tsx` |

### 5. One ambient-person base with animation clips

| | |
|---|---|
| Purpose | the 14 cast members and any future crowd; today all 25 placements share one base and differ only in colour and pose |
| Format | GLB, one shared skinned base; clothing as colour regions on the albedo, driven by the existing `PersonSpec` fields |
| Poly budget | 4–6k triangles per instance, or one base reused with colour variation |
| Texture | 512² albedo per outfit palette, shared |
| Animations | sit · sit-read · stand · talk · browse · carry · drink · water · walk · phone — the ten poses `npc/people.ts` already names |
| Replaces | the shared base in `people.ts`; **`cast.ts` stays the source of truth for who looks like what** |

### 6. Environment props and textures

Lower value than the characters, and the procedural kit is doing real work
already. Worth doing only where the kit is visibly weakest:

| Asset | Why | Budget |
|---|---|---|
| Market stall kit (canopy, cloth, produce) | the Vocabulary Market's identity should read from the entrance camera; today it reads as paving | 1–3k tris per stall, 512² textures |
| Hanok roof and wall panels | the roofline repeats recognisably at street level | 1–2k tris, 512² |
| Ground: paving, madang, gravel | the painted canvases tile visibly at close range | 512² tiling, seamless |
| Signage set with real Hangul | several signs are drawn procedurally; a set would hold letterforms better | 256² per sign, alpha |

## How these should be integrated

1. **Load lazily, per room.** three.js and the world already live in a separate
   945 KB chunk behind `WebGL` detection. Character GLBs must not join the
   entry chunk.
2. **Keep the data layer.** `cast.ts`, `characters.ts` and `people.ts` should
   survive as the source of truth for who wears what and who stands where. A
   GLB supplies geometry and clips; it must not become a second place where
   Minsu's lanyard is described.
3. **One base for the crowd.** Twenty-five ambient people must not be 25
   skinned meshes with unique materials. Use one base, one texture atlas,
   colour variation through the existing spec fields.
4. **Do not download random game assets.** Everything here must be original or
   properly licensed; this is a commercial product with a defined brand.
5. **Do not fake it in the meantime.** If a production model is not ready, the
   procedural version stays and this file stays accurate. Adding a
   half-finished imported model to one room, or three inconsistent Minsus,
   makes the world worse than it is now.

## Canon constraints any character asset must satisfy

These come from `src/config/klovers-world.ts`, which wins over this document
and over any art direction:

- Adam and Lina are **friends and study companions**. No romantic framing, no
  touching, no couple-style posing.
- Cluby is **not a pet** and **not an oracle**. He is a companion and a
  memory-keeper.
- Minsu is **a friend and conversation partner**, never the teacher and never a
  romantic interest.
- Characters **support** learning; they never replace the real teacher.
- The world is photoreal-adjacent and stylised, **not anime and not cartoon** —
  the same standing rule that governs the site's imagery: one photographic
  theme, the real scenes, with no exception for size.
