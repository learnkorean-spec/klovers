# Light and far copies of the world's people (`*.lod.glb`, `*.far.glb`)

Each body (`public/assets/world/people/*.glb`: the five background bodies,
Adam and Lina) draws ≈43–60k triangles. A busy room has ten or more people,
which was ≈500k triangles on a phone whatever their size on screen.
`lod.mjs` writes two copies of each, geometry only (no textures):

- **light** (`*.lod.glb`): body 40 %, clothes 35 %, hair 50 %, lashes
  untouched (≈0.26–0.43 MB);
- **far** (`*.far.glb`, third argument `far`): ≈15 % in all (body 14 %,
  clothes 12 %, hair 22 %, lashes half), with a looser shape limit
  (≈0.17–0.29 MB).

`RiggedBody.tsx` swaps each mesh's geometry by name on the same skeleton,
motion and dyed materials: the light copy past 3.5 m from the camera on a
phone / 10 m on a computer, the far copy past 9 m / 20 m (1 m of give either
way). Far people are also posed every other frame, and nobody off screen is
posed at all.

Checks: `/world?debug=1&lod=all` puts everyone in the light copy,
`&lod=far` in the far copy, `&lod=off` nobody.
`src/game/systems/__tests__/lod.test.ts` checks every body has both copies,
each with every mesh and fewer triangles.

Run again whenever a body changes (e.g. after `scripts/world-faces`):

    npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer   # in a scratch folder
    for m in npc-joe npc-leonard npc-brian npc-elizabeth npc-megan adam lina; do
      node lod.mjs public/assets/world/people/$m.glb public/assets/world/people/$m.lod.glb
      node lod.mjs public/assets/world/people/$m.glb public/assets/world/people/$m.far.glb far
    done

The copies must come from the same body file they sit beside: the world
uses the full file's skin with the copies' vertices.
