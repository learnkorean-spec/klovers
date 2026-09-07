/**
 * Authorise a call that may come from pg_cron or from a human admin.
 *
 * WHY THIS IS NOT JUST AN ENV VAR
 *
 * The version this replaces compared `x-cron-secret` to `Deno.env.get("CRON_SECRET")`.
 * That required the same secret in two places — Vault, so `app_private.invoke_edge`
 * would send it, and the function environment, to check it — and it was in
 * neither. `invoke_edge` refused to send at all, logging to `cron_health`:
 *
 *     CRON_SECRET not set in Vault - endpoint requires it, request not sent
 *
 * 168 times in 7 days per job, while pg_cron recorded "succeeded" every time
 * because the SQL itself ran fine. Zero trial follow-up emails had ever been
 * sent when this was found.
 *
 * So the secret now has ONE home: Vault. `public.verify_cron_secret()` compares
 * against it, `service_role` only. Nothing holds a second copy to drift from,
 * and rotating it is a single Vault update with no redeploy.
 *
 * The env var is still honoured first — it is a string comparison rather than a
 * network round trip, and it keeps `supabase functions serve` working locally
 * without Vault. It is now an optimisation, not a requirement.
 */

// deno-lint-ignore no-explicit-any
type Client = any;

/** A JWT is three dot-separated segments; a cron secret is 64 hex characters. */
function looksLikeJwt(token: string): boolean {
  return token.split(".").length === 3;
}

async function matchesStoredSecret(supabase: Client, candidate: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("verify_cron_secret", { p_secret: candidate });
    if (error) {
      console.error("verify_cron_secret failed:", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("verify_cron_secret threw:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

/**
 * True for: a valid cron secret (header or bearer), or an admin's JWT.
 *
 * @param supabase must be a SERVICE-ROLE client — `verify_cron_secret` is
 *   granted to `service_role` alone, and the admin branch reads `user_roles`.
 */
export async function isCronOrAdmin(req: Request, supabase: Client): Promise<boolean> {
  const headerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  // 1. Env var, when one is configured. Same comparison as before.
  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret) {
    if (headerSecret === envSecret) return true;
    if (bearer === envSecret) return true;
  }

  // 2. Vault, via the database. This is the path that actually carries cron.
  //    invoke_edge(p_require_cron := true) sends the secret in BOTH the header
  //    and the bearer, so either can satisfy it.
  if (headerSecret) {
    if (await matchesStoredSecret(supabase, headerSecret)) return true;
  }
  if (bearer && !looksLikeJwt(bearer)) {
    if (await matchesStoredSecret(supabase, bearer)) return true;
  }

  // 3. A human admin, by JWT.
  if (!bearer) return false;

  const { data: { user }, error } = await supabase.auth.getUser(bearer);
  if (error || !user) return false;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !!roleRow;
}
