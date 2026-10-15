// Turns bake.py's PNGs into the two small maps the world loads
// (public/assets/world/tex/<room>_ao.webp and <room>_shade.webp).
// Usage: node make-maps.mjs <bakedir> <room>
import sharp from "sharp";
const [dir, room] = process.argv.slice(2);
const W = 512;
const ao = await sharp(`${dir}/court_ao.png`).greyscale().resize(W).raw().toBuffer({ resolveWithObject: true });
const sh = await sharp(`${dir}/court_shadow.png`).greyscale().resize(W).raw().toBuffer();
const { width, height } = ao.info;
// Phones' layer: sun shadow and soft shade, as opacity (capped).
const shade = Buffer.alloc(width * height);
for (let i = 0; i < shade.length; i++) {
  const a = ao.data[i] / 255;
  const s = sh[i] / 255;
  shade[i] = Math.round(255 * Math.min(0.6, (1 - s) * 0.42 + (1 - a) * 0.25));
}
const out = "public/assets/world/tex";
await sharp(ao.data, { raw: { width, height, channels: 1 } }).webp({ quality: 85 }).toFile(`${out}/${room}_ao.webp`);
await sharp(shade, { raw: { width, height, channels: 1 } }).webp({ quality: 85 }).toFile(`${out}/${room}_shade.webp`);
console.log(room, width, height);
