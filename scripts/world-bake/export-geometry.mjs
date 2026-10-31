// Exports what a KLOVERS World room actually draws (opaque, static meshes —
// no people, overlays or sky) as raw triangles for bake.py.
// Usage: node export-geometry.mjs "<preview url>/world?debug=1" out.f32
// (needs `npm i -D playwright` or a global one, and a running preview of
// the site; the room is the one the page opens in — the courtyard for a
// fresh browser).
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const LAUNCH = process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {};
const b = await chromium.launch({ ...LAUNCH, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.addInitScript(() => { try { localStorage.setItem('klovers-world-view', 'behind'); localStorage.setItem('klovers-world-state', JSON.stringify({ welcomed: true, tutorialDone: true })); } catch {} });
await p.goto(url, { waitUntil: 'load' });
await p.waitForFunction(() => !!window.__kloversWorld?.scene(), null, { timeout: 120000 });
await p.waitForTimeout(40000);
const res = await p.evaluate(() => {
  const scene = window.__kloversWorld.scene(); scene.updateMatrixWorld(true);
  const tris = []; const names = {};
  let M4 = null, V3 = null;
  scene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
    let vis = true; let q = o; while (q) { if (!q.visible) vis = false; q = q.parent; } if (!vis) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((m) => m.transparent || !m.depthWrite || m.side === 1 || m.type === 'MeshBasicMaterial')) return;
    const g = o.geometry; const pos = g.attributes.position; if (!pos) return;
    if (!M4) { M4 = o.matrixWorld.constructor; V3 = o.position.constructor; }
    const idx = g.index; const n = idx ? idx.count : pos.count;
    const mats4 = [];
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { const m = new M4(); o.getMatrixAt(i, m); mats4.push(new M4().multiplyMatrices(o.matrixWorld, m)); } }
    else mats4.push(o.matrixWorld);
    const v = new V3();
    let kept = 0;
    for (const m of mats4) {
      const local = [];
      let maxY = -1e9, near = false;
      for (let k = 0; k < n; k++) { const i = idx ? idx.getX(k) : k; v.fromBufferAttribute(pos, i).applyMatrix4(m); local.push(v.x, v.y, v.z); if (v.y > maxY) maxY = v.y; if (Math.abs(v.x) < 40 && Math.abs(v.z) < 40) near = true; }
      if (maxY < 0.045 || !near) continue; // laid paving (slab walks, 3 cm proud) casts nothing
      for (const x of local) tris.push(x); kept++;
    }
    if (kept) names[o.name || o.geometry.type || o.type] = (names[o.name || o.geometry.type || o.type] || 0) + kept;
  });
  const f = new Float32Array(tris);
  let s = ''; const u8 = new Uint8Array(f.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { b64: btoa(s), count: f.length / 9, names };
});
fs.writeFileSync(out, Buffer.from(res.b64, 'base64'));
console.log('triangles', res.count); console.log(JSON.stringify(res.names).slice(0, 1500));
await b.close();
