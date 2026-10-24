# Korean faces for the world's people (Seoul's NPC bodies)

The five background bodies (`public/assets/world/people/npc-*.glb`, Mixamo)
had Western face shapes. These scripts move each head's vertices toward an
East Asian face shape taken from MakeHuman (CC0 targets), without touching
the skeleton, skinning, UVs, textures or clothes: the same mesh, reshaped.
Hair colour, skin tone and per-person variety are applied at run time
(`src/game/npc/realCast.ts`). Adam and Lina are never processed (canon:
foreign learners, `ethnicityRule: "not_korean_and_not_asian"`).

How it works
1. `dump.mjs` reads a glb (meshopt + quantised) and writes every mesh's
   true bind-pose positions (joint world · inverse bind · position).
2. `koface.py` aligns MakeHuman's base head to the model's head by the eye
   centres (from the eyelash mesh), builds a displacement field — the
   Asian-minus-Caucasian young adult head shape (similarity-aligned, so
   only shape remains) plus small eye and nose targets — and applies it to
   the body's head, eyelashes and hair, fading out between chin and neck.
3. `write.mjs` writes the new positions back, re-quantises each changed
   mesh into [-1, 1] and folds that transform into the mesh's own skin
   (IBM' = IBM · T); every mesh in these files has its own skin.

Run (25 Oct 2026 settings: men 1.5, women 0.8 — stronger made the women's
jaws heavy):

    git clone --depth 1 --filter=blob:none --sparse https://github.com/makehumancommunity/makehuman.git mh
    (cd mh && git sparse-checkout set makehuman/data/3dobjs makehuman/data/targets/macrodetails makehuman/data/targets/eyes makehuman/data/targets/nose)
    export MH_DATA=$PWD/mh/makehuman/data/
    npm i @gltf-transform/core@4 @gltf-transform/extensions@4 meshoptimizer   # in a scratch folder
    node dump.mjs ORIGINAL.glb pts.json
    python3 koface.py pts.json x male new.json 1.5        # or: female … 0.8
    node write.mjs ORIGINAL.glb new.json OUT.glb

Always start from the ORIGINAL (un-reshaped) glb — git history before
25 Oct 2026 — never re-apply to an already reshaped file. Check the result
side by side and in the world (seated, walking) before committing.
