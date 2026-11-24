// Daily table backup into the private `db-backups` Storage bucket.
//
// Why it exists: the only backup was the GitHub Actions workflow
// database-backup.yml, and Actions on this account has been locked by a
// billing issue since about 22 Nov 2026. This runs inside Supabase instead,
// invoked once a day by the `backup-core-tables-daily` pg_cron job
// (app_private.invoke_edge sends the service-role key).
//
// What it writes: db-backups/YYYY-MM-DD/<table>.json.gz, one file per table
// from public.fn_backup_table_list(), plus auth_users.json.gz (no password
// hashes) and a manifest.json with row counts. Folders older than KEEP_DAYS
// are deleted. Data only; the schema is in supabase/migrations.
//
// Restore one table: download its file, gunzip, and insert the JSON array
// (e.g. `insert into t select * from json_populate_recordset(null::t, '<json>')`).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// deno-lint-ignore no-explicit-any
type Db = any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "db-backups";
const KEEP_DAYS = 14;

// Inlined rather than imported from ../_shared: deploying through the MCP tool
// bundles relative to this folder only.
function isAuthorizedServiceCall(req: Request): boolean {
  const header = req.headers.get("authorization")?.trim();
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  return !!token && token === SERVICE_ROLE_KEY;
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (!isAuthorizedServiceCall(req)) return json({ error: "unauthorized" }, 401);

  const db: Db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const day = new Date().toISOString().slice(0, 10);
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  const put = async (name: string, data: unknown) => {
    const text = JSON.stringify(data);
    const body = await gzip(text);
    const { error } = await db.storage.from(BUCKET).upload(`${day}/${name}.json.gz`, body, {
      contentType: "application/gzip",
      upsert: true,
    });
    if (error) throw new Error(`${name}: ${error.message}`);
  };

  const { data: tables, error: listErr } = await db.rpc("fn_backup_table_list");
  if (listErr) return json({ error: `table list: ${listErr.message}` }, 500);

  for (const t of (tables ?? []) as string[]) {
    try {
      const { data, error } = await db.rpc("fn_backup_table_json", { _table: t });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as unknown[];
      counts[t] = rows.length;
      await put(t, rows);
    } catch (e) {
      errors.push(`${t}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    const { data, error } = await db.rpc("fn_backup_auth_users");
    if (error) throw new Error(error.message);
    counts["auth_users"] = ((data ?? []) as unknown[]).length;
    await put("auth_users", data ?? []);
  } catch (e) {
    errors.push(`auth_users: ${e instanceof Error ? e.message : String(e)}`);
  }

  const manifest = { day, created_at: new Date().toISOString(), tables: counts, errors };
  await db.storage.from(BUCKET).upload(`${day}/manifest.json`, new Blob([JSON.stringify(manifest, null, 2)]), {
    contentType: "application/json",
    upsert: true,
  });

  // Keep the newest KEEP_DAYS day-folders.
  let pruned = 0;
  const { data: folders } = await db.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
  const days = ((folders ?? []) as { name: string }[])
    .map((f) => f.name)
    .filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n))
    .sort();
  for (const old of days.slice(0, Math.max(0, days.length - KEEP_DAYS))) {
    const { data: files } = await db.storage.from(BUCKET).list(old, { limit: 1000 });
    const paths = ((files ?? []) as { name: string }[]).map((f) => `${old}/${f.name}`);
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
    pruned += 1;
  }

  if (errors.length) {
    await db.from("admin_notifications").insert({
      message: `Daily backup ${day} finished with ${errors.length} error(s): ${errors.slice(0, 3).join("; ")}`,
      type: "warning",
      category: "system",
    });
  }

  return json({ ok: errors.length === 0, day, tables: Object.keys(counts).length, rows: counts, errors, pruned });
});
