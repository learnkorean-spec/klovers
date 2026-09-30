/**
 * shop-manual-fulfil — delivers shop books paid by hand from Egypt (1 Oct 2026).
 *
 * Re: "Egyptians pay [in the shop] the same as for courses". In the bag an
 * Egyptian buyer pays by Vodafone Cash or InstaPay, uploads the receipt, and a
 * payment claim is filed (RPC student_submit_payment_claim) with a note that
 * ends in "[shop:<book_id>,<book_id>]". Re approves the claim in MONEY IN
 * (admin_review_payment_claim); MONEY IN then calls this function, which adds
 * the books to the buyer's "My books".
 *
 * Checks, because the note is written by the buyer: admin only; the claim must
 * be approved and in EGP; every book must be a live shop product; and the
 * amount claimed must cover the EGP price of those books in Stripe. Idempotent
 * (book_assignments is unique per user + book).
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = ["https://kloversegy.com", "https://www.kloversegy.com"];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const reply = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!user?.id) return reply({ error: "sign_in" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return reply({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const claimId = typeof body?.claimId === "string" ? body.claimId : "";
    if (!/^[0-9a-f-]{36}$/i.test(claimId)) return reply({ error: "invalid" }, 400);

    const { data: claim } = await admin
      .from("student_payment_claims")
      .select("id, user_id, amount, currency, status, note")
      .eq("id", claimId)
      .maybeSingle();
    if (!claim) return reply({ error: "not_found" }, 404);
    if (claim.status !== "approved") return reply({ error: "not_approved" }, 409);

    const tag = /\[shop:([a-z0-9,-]+)\]/.exec(claim.note ?? "");
    if (!tag) return reply({ ok: true, shop: false });
    const bookIds = [...new Set(tag[1].split(",").filter(Boolean))];
    if (bookIds.length === 0) return reply({ ok: true, shop: false });
    if ((claim.currency ?? "").toUpperCase() !== "EGP") return reply({ error: "currency" }, 409);

    // What those books cost in Egyptian pounds right now, from Stripe.
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const egp: Record<string, number> = {};
    for await (const p of stripe.products.list({ active: true, limit: 100, expand: ["data.default_price.currency_options"] })) {
      const m = p.metadata ?? {};
      const price = p.default_price;
      if (m.klovers_shop !== "true" || !m.book_id || !price || typeof price === "string") continue;
      const amount = price.currency === "egp"
        ? price.unit_amount
        : price.currency_options?.egp?.unit_amount ?? null;
      if (amount != null) egp[m.book_id.trim()] = amount;
    }
    const missing = bookIds.filter((b) => egp[b] == null);
    if (missing.length) return reply({ error: "unknown_books", missing }, 409);
    const due = bookIds.reduce((s, b) => s + egp[b], 0);
    if (Math.round(Number(claim.amount) * 100) < due) {
      return reply({ error: "amount_too_low", due: due / 100, paid: Number(claim.amount) }, 409);
    }

    const { error: assignErr } = await admin.from("book_assignments").upsert(
      bookIds.map((book_id) => ({
        user_id: claim.user_id,
        book_id,
        available_from: new Date().toISOString(),
        assigned_by: "shop:manual",
        notes: `Paid by hand in Egypt · claim ${claim.id}`,
      })),
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    );
    if (assignErr) {
      console.error("[shop-manual-fulfil] assignment failed:", assignErr.message);
      return reply({ error: "unavailable" }, 503);
    }
    return reply({ ok: true, shop: true, books: bookIds });
  } catch (err) {
    console.error("[shop-manual-fulfil]", err instanceof Error ? err.message : err);
    return reply({ error: "unavailable" }, 503);
  }
});
