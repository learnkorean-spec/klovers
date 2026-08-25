/**
 * content-edit-supabase-store.mjs — the production backend for
 * scripts/lib/content-edit.mjs. Signs in as an actual admin user rather than
 * using the service_role key, so every write goes through the same
 * row-level-security check the admin panel does (blog_posts UPDATE requires
 * `has_role(auth.uid(), 'admin')`). Per docs/SEO_GATE1_REPORT.md Part 2, the
 * service_role key is explicitly rejected as an option: it bypasses RLS
 * entirely, and there is no reason to when admin sign-in reaches the same rows.
 *
 * Credentials come from env vars, never hardcoded (unlike
 * scripts/deploy-lesson1.mjs, which has a live secret key committed in the
 * repo — a separate, pre-existing problem, not something this file repeats).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Read-only access (used by writeProposal) needs no admin session — the anon
 * key can already SELECT published posts.
 */
export function createReadOnlyStore() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_ equivalents) are not set");
  }
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return {
    async readRow(slug) {
      const { data, error } = await client.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
      if (error) throw new Error(`readRow(${slug}): ${error.message}`);
      return data;
    },
    async writeColumn() {
      throw new Error("createReadOnlyStore cannot write — use createAdminStore for apply/rollback");
    },
  };
}

/**
 * Write access. Requires CONTENT_EDIT_ADMIN_EMAIL / CONTENT_EDIT_ADMIN_PASSWORD
 * in the environment — an existing admin account's real credentials, set
 * locally by whoever is running apply/rollback, never committed. Fails loudly
 * (not a silent RLS-denied no-op) if the signed-in user does not actually hold
 * the admin role, so a wrong or expired account is caught before any write.
 */
export async function createAdminStore() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_ equivalents) are not set");
  }
  const email = process.env.CONTENT_EDIT_ADMIN_EMAIL;
  const password = process.env.CONTENT_EDIT_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "CONTENT_EDIT_ADMIN_EMAIL and CONTENT_EDIT_ADMIN_PASSWORD must be set to apply or " +
        "roll back content edits — sign-in as an admin is required, the service_role key " +
        "is deliberately not supported here (see docs/SEO_GATE1_REPORT.md Part 2)."
    );
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session) {
    throw new Error(`Admin sign-in failed: ${signInError?.message || "no session returned"}`);
  }

  const { data: isAdmin, error: roleError } = await client.rpc("has_role", {
    _user_id: signIn.user.id,
    _role: "admin",
  });
  if (roleError) {
    throw new Error(
      `Could not confirm the signed-in account holds the admin role (${roleError.message}). ` +
        `Refusing to attempt writes that RLS would likely reject anyway.`
    );
  }
  if (!isAdmin) {
    throw new Error(
      `Signed in as ${email}, but that account does not hold the 'admin' role. ` +
        `Writes would fail RLS. Refusing to proceed.`
    );
  }

  return {
    async readRow(slug) {
      const { data, error } = await client.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
      if (error) throw new Error(`readRow(${slug}): ${error.message}`);
      return data;
    },
    async writeColumn(slug, column, value) {
      const { error } = await client.from("blog_posts").update({ [column]: value }).eq("slug", slug);
      if (error) throw new Error(`writeColumn(${slug}.${column}): ${error.message}`);
    },
  };
}
