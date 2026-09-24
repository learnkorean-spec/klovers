// One-off helper for the 25 Sep 2026 QA fix branch. Applies exact text
// replacements listed in scripts/qa-patch/patches.json to files that are too
// large to rewrite by hand (translations.ts is ~230 KB). All-or-nothing: if
// any patch does not match the expected number of times, nothing is written
// and REPORT.md says which one. Removed before merge.
import fs from "node:fs";

const P = "scripts/qa-patch/patches.json";
const patches = JSON.parse(fs.readFileSync(P, "utf8"));
const O = "scripts/qa-patch/overrides.json";
const ov = fs.existsSync(O) ? JSON.parse(fs.readFileSync(O, "utf8")) : {};
const overrides = ov.counts || {};
const skipFiles = new Set(ov.skipFiles || []);
const files = new Map();
const errors = [];
const done = [];

const read = (f) => {
  if (files.has(f)) return files.get(f);
  if (!fs.existsSync(f)) return null;
  const s = fs.readFileSync(f, "utf8");
  files.set(f, s);
  return s;
};

patches.forEach((p, i) => {
  if (skipFiles.has(p.file)) {
    done.push(`#${i} ${p.file} (skipped: file taken from main)`);
    return;
  }
  const src = read(p.file);
  if (src === null) {
    errors.push(`#${i} ${p.file}: file not found`);
    return;
  }
  const expect = overrides[p.find] ?? p.count ?? 1;
  let n;
  let out;
  if (p.regex) {
    const re = new RegExp(p.find, "g");
    n = (src.match(re) || []).length;
    out = src.replace(re, p.replace);
  } else {
    n = src.split(p.find).length - 1;
    out = src.split(p.find).join(p.replace);
  }
  const ok = expect === "any" ? n >= 1 : n === expect;
  if (!ok) {
    errors.push(`#${i} ${p.file}: expected ${expect} match(es), found ${n} :: ${JSON.stringify(p.find).slice(0, 160)}`);
    return;
  }
  files.set(p.file, out);
  done.push(`#${i} ${p.file} (${n})`);
});

const report = [
  `# QA patch report`,
  ``,
  `patches: ${patches.length} · applied: ${done.length} · failed: ${errors.length}`,
  ``,
  ...(errors.length ? ["## Failed", ...errors.map((e) => `- ${e}`), ""] : []),
  "## Applied",
  ...done.map((d) => `- ${d}`),
  "",
].join("\n");
fs.writeFileSync("scripts/qa-patch/REPORT.md", report);

if (errors.length) {
  console.error(report);
  process.exit(1);
}
for (const [f, s] of files) fs.writeFileSync(f, s);
console.log(report);
