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

Courtyard baked 16 Oct 2026 (Blender 5.0, Cycles CPU, 64 samples, ~4 min);
re-baked 31 Oct 2026 after the stepping stones became a laid slab walk
(their dark discs were still printed in the phones' shade layer). Without a
Blender install, `pip install bpy` (Python 3.13 wheel) and run
`python3 bake.py -- court.f32 out 11 9 1024 64` works the same. Geometry
whose top is under 4.5 cm (laid paving) is left out of the bake.
