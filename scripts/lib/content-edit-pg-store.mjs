/**
 * content-edit-pg-store.mjs — a raw-Postgres backend for
 * scripts/lib/content-edit.mjs, used only by scripts/content-edit-rehearsal.mjs
 * to prove the propose/apply/rollback logic against a real relational database
 * with real transactional semantics. Production uses
 * content-edit-supabase-store.mjs instead (RLS via admin sign-in); this file
 * exists purely so the rehearsal exercises the exact same orchestration code,
 * not a reimplementation of it.
 */
export function createPgStore(pgClient, table = "blog_posts_rehearsal") {
  return {
    async readRow(slug) {
      const { rows } = await pgClient.query(`select * from ${table} where slug = $1`, [slug]);
      return rows[0] || null;
    },
    async writeColumn(slug, column, value) {
      // Column names here are controlled by this file's own callers (the
      // rehearsal script), never by external input, so interpolating the
      // identifier is safe — the value itself is always parameterised.
      await pgClient.query(`update ${table} set ${column} = $1 where slug = $2`, [value, slug]);
    },
  };
}
