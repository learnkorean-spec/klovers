set -e
# Run from a scratch folder holding these scripts, mh/mhrepo (MakeHuman data, see
# README) and node_modules. Inputs: gt/src/npc-*.glb = the ORIGINAL bodies (git
# 8d7d5a6), gt/cur/npc-*.json = dump.mjs of the Korean-shaped bodies to keep.
# Outputs gt/src/npc-*.final.glb (copy over public/assets/world/people/) and
# gt/src/npc-*.base.glb (make the light/far copies from these: scripts/world-lod).
for m in joe:male leonard:male brian:male elizabeth:female megan:female; do
  n=${m%%:*}; g=${m##*:}
  (cd gt && node dump.mjs src/npc-$n.glb src/npc-$n.json >/dev/null)
  python3 smooth.py gt/src/npc-$n.json gt/cur/npc-$n.json gt/src/npc-$n.smooth.json
  (cd gt && node write.mjs src/npc-$n.glb src/npc-$n.smooth.json src/npc-$n.base.glb >/dev/null && node dump.mjs src/npc-$n.base.glb src/npc-$n.base.json >/dev/null)
  python3 morph.py gt/src/npc-$n.base.json $g gt/src/npc-$n.morph.json | tail -7 | tr '\n' ' '; echo
  (cd gt && node addmorph.mjs src/npc-$n.base.glb src/npc-$n.morph.json src/npc-$n.final.glb)
done
