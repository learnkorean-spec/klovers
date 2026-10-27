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
    node dump.mjs ORIGINAL.glb pts.json      # bind-pose positions (joint · IBM · position)
    python3 koface.py pts.json x male new.json 1.5        # or: female … 0.8
    node write.mjs ORIGINAL.glb new.json OUT.glb

Always start from the ORIGINAL (un-reshaped) glb — git history before
25 Oct 2026 — never re-apply to an already reshaped file. Check the result
side by side and in the world (seated, walking) before committing.

## Many faces from five bodies (25 Oct 2026, evening)

The nearest-neighbour mapping above left the lips and nostrils crumpled
(neighbouring vertices moved up to 12 mm apart, so teeth showed under the
nose). Two steps were added, and the shipped bodies are rebuilt from the
originals with them (`run.sh`):

- `smooth.py`: each vertex takes the Gaussian-weighted (σ 5 mm) average
  displacement of its neighbours across head, eyelashes and hair — the same
  Korean shape, without the crumpling.
- `morph.py` + `addmorph.mjs`: seven face blend shapes from MakeHuman
  targets (faceRound, jawWide, cheekbones, eyesBig, noseWide, mouthFull,
  chinLong), smoothed the same way, stored as glTF morph targets (normalised
  int16, in each mesh's local space) on the Body, Eyelashes and Hair meshes
  (+30–140 KB per body). Each person sets their own mix at run time
  (`realCast.ts` FACE_RANGE → `RiggedBody` setFace); the light/far copies
  carry none.

After a rebuild, regenerate the light and far copies from the `*.base.glb`
files (same skin as the shipped files; `scripts/world-lod`), since
`write.mjs` re-quantises and changes the skin's inverse bind matrices.
Checks: `src/game/systems/__tests__/faces.test.ts`.

## npc-elizabeth: Megan's hair and a re-based skin map (27 Oct 2026)

npc-elizabeth (Ch26) kept a wide afro-style hair mesh and a dark skin map
that the run-time tint could not lift (it stops at 2.6×), so women on that
body still read as non-Korean, which the canon rules out for anyone other
than Adam and Lina. Three steps, applied to the shipped file:

- `transplant.mjs E.glb M.glb OUT.glb`: replaces Ch26_Hair with npc-megan's
  hair (Ch22_Hair: sleek, pulled back into a bun), fitted per axis to
  Elizabeth's skull (body vertices above the head joint), pushed ≥3 mm out
  of her scalp, re-quantised into [-1, 1] with that folded into a new skin
  on her own joints (by name), with Megan's seven face blend shapes carried
  over and Megan's hair material/maps. The old in-world `tameHair` (which
  pulled the old hair in) is removed: it would crush the new hair.
- `paint.mjs E.glb M.glb OUT.glb [preview.png]`: scales the body island of
  Elizabeth's map so its skin averages Megan's (the world then tints both
  alike) and paints the scalp under the new hair dark brown (#1E130E, which
  the ~2× skin tint brings to the hair dyes' range), feathered.
- `strip.mjs IN OUT`: drops the blend shapes; run `scripts/world-lod/lod.mjs`
  on its output for the `.lod.glb` / `.far.glb` copies.

Start from the 26 Oct shipped `npc-elizabeth.glb` (git 9155008) for E and
the shipped `npc-megan.glb` for M; needs `sharp` besides the packages above.

## npc-brian: a full head of hair (27 Oct 2026, evening)

npc-brian (Ch01) is a bald Mixamo body; about a third of the world's men
use it, so a third of the Korean men were shaved bald. It now wears
npc-leonard's short hair (Ch31_Hair), fitted the same way:

    node transplant.mjs npc-brian.glb npc-leonard.glb brian-h.glb   # no hair mesh → a new Ch01_Hair node beside the body
    node paint.mjs brian-h.glb - brian-hp.glb                        # "-": skin untouched, only the scalp under the hair painted
    node strip.mjs brian-hp.glb brian-base.glb                       # then world-lod/lod.mjs on brian-base.glb (light + far)

Start from the shipped `npc-brian.glb` before this change (git 9387422).
Elders on this body get grey hair from the same `_Hair` dye rule.
