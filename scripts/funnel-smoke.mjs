#!/usr/bin/env node
// Full-funnel smoke test, the HTTP half.
//
// Walks the public side of the funnel a visitor actually touches, against the
// LIVE site, and creates nothing:
//
//   1. every funnel page answers 200 with the app shell
//      (home, free trial, trial booking, placement test, signup, enroll, pricing)
//   2. anon can read what those pages need: an upcoming trial slot to book,
//      and an active class time to enrol into
//   3. book-trial is up: CORS preflight 200, and an empty submission is
//      rejected with 400 (validation runs before any row is written)
//
// The other half, visitor -> account -> trial -> attended -> placement ->
// seat in a running group -> payment dates -> paid -> active class, runs inside
// Postgres as public.fn_funnel_smoke_test(), always rolled back. See
// .github/workflows/funnel-smoke.yml, which runs both.
//
// Usage: node scripts/funnel-smoke.mjs
// Env:   SITE_URL (default https://kloversegy.com)
//        SUPABASE_URL, SUPABASE_ANON_KEY (defaults: the public production values)

const SITE = (process.env.SITE_URL || "https://kloversegy.com").replace(/\/$/, "");
const SB = (process.env.SUPABASE_URL || "https://ewtdgpbybkceokfohhyg.supabase.co").replace(/\/$/, "");
// Public by design: the same anon key ships in every page of the site.
const ANON =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs";

const PAGES = [
  "/", "/free-trial", "/trial-booking", "/placement-test", "/signup", "/enroll-now", "/pricing",
  // The Arabic twins: Arabic posts, articles and first-time Arabic browsers land here.
  "/ar", "/ar/free-trial", "/ar/enroll-now", "/ar/pricing", "/ar/placement-test",
];

const results = [];
const record = (step, ok, detail = "") => {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${detail ? `  (${detail})` : ""}`);
};

async function check(step, fn) {
  try {
    const detail = await fn();
    record(step, true, detail ?? "");
  } catch (e) {
    record(step, false, e instanceof Error ? e.message : String(e));
  }
}

const cairoToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

const rest = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!r.ok) throw new Error(`${path.split("?")[0]} -> HTTP ${r.status}`);
  return r.json();
};

for (const p of PAGES) {
  await check(`page ${p}`, async () => {
    const r = await fetch(SITE + p, { redirect: "follow" });
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    if (!html.includes('id="root"')) throw new Error("no app shell (#root) in the HTML");
    return "200";
  });
}

await check("trial slot bookable", async () => {
  const rows = await rest(
    `trial_slots?select=trial_date,start_time&is_active=eq.true&trial_date=gte.${cairoToday()}&order=trial_date&limit=1`,
  );
  if (!rows.length) throw new Error("no active trial slot today or later: nobody can book a trial");
  return `${rows[0].trial_date} ${String(rows[0].start_time).slice(0, 5)}`;
});

await check("class time to enrol into", async () => {
  const rows = await rest("schedule_packages?select=id,level&is_active=eq.true&limit=50");
  if (!rows.length) throw new Error("no active class time: /enroll-now has nothing to offer");
  return `${rows.length} active`;
});

await check("book-trial preflight", async () => {
  const r = await fetch(`${SB}/functions/v1/book-trial`, {
    method: "OPTIONS",
    headers: { Origin: SITE, "Access-Control-Request-Method": "POST" },
  });
  if (r.status !== 200 && r.status !== 204) throw new Error(`HTTP ${r.status}`);
  return String(r.status);
});

await check("book-trial rejects an empty booking", async () => {
  const r = await fetch(`${SB}/functions/v1/book-trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: "{}",
  });
  // 400 = validation answered. 429 = the per-IP limiter answered first; the
  // function is up either way, and nothing was written.
  if (r.status !== 400 && r.status !== 429) throw new Error(`HTTP ${r.status}, expected 400`);
  return String(r.status);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
