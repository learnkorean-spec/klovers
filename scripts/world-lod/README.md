# Light copies of the world's people (`*.lod.glb`)

Each background body (`public/assets/world/people/npc-*.glb`) draws ≈43–55k
triangles. A busy room has up to ten of them, which was ≈500k triangles on a
phone whatever their size on screen. `lod.mjs` writes a light copy of each:
the same meshes, simplified (body 40 %, clothes 35 %, hair 50 %, lashes
untouched), geometry only (no textures, ≈0.26–0.43 MB). `RiggedBody.tsx`
swaps each mesh's geometry for the light one when the person stands farther
from the camera than 6 m on a phone / 10 m on a computer (1 m of give either
way), on the same skeleton, motion and dyed materials. Adam and Lina have no
light copy.

Checks: `/world?debug=1&lod=all` puts everyone in the light copy, `&lod=off`
nobody.

Run again whenever a body changes (e.g. after `scripts/world-faces`):

    npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer   # in a scratch folder
    for m in npc-joe npc-leonard npc-brian npc-elizabeth npc-megan; do
      node lod.mjs public/assets/world/people/$m.glb public/assets/world/people/$m.lod.glb
    done

The light file must come from the same body file it sits beside: the world
uses the full file's skin with the light file's vertices.
