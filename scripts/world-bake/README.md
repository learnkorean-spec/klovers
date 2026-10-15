# Baked floor light for KLOVERS World

The courtyard floor carries light baked once in Blender: soft sky
occlusion (every device) and the sun's shadows (phones, which draw no live
shadows). `src/game/environment/BakedFloor.tsx` loads them.

Re-bake when a room's layout changes (walls, buildings, trees, props):

1. Build and preview the site (`npm run build && npx vite preview`).
2. `node scripts/world-bake/export-geometry.mjs "http://127.0.0.1:4173/world?debug=1" court.f32`
3. `blender -b -P scripts/world-bake/bake.py -- court.f32 bake 11 9 1024 64`
   (half width and half depth of the room, from `ROOM` in config/world.ts)
4. `node scripts/world-bake/make-maps.mjs bake court`

Courtyard baked 16 Oct 2026 (Blender 5.0, Cycles CPU, 64 samples, ~4 min).
