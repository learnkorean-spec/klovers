// Lists every picture under public/ into public/picture-manifest.json, so the
// Picture check tab on /admin/ai-room-lab also shows pictures added after its
// first pass. Skips @2x copies and 3D textures. Runs before `vite build`.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "public";
const out = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(jpe?g|png|webp)$/i.test(name) && !name.includes("@2x") && !full.includes("/tex/")) out.push(full.slice(root.length).replace(/\\/g, "/"));
  }
};
walk(root);
out.sort();
writeFileSync(join(root, "picture-manifest.json"), JSON.stringify(out));
console.log(`picture-manifest.json: ${out.length} pictures`);
