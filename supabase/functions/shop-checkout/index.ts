/**
 * shop-checkout — opens a Stripe Checkout page for the /shop cart (27 Sep 2026).
 *
 * The buyer must be signed in: a PDF is delivered to her "My books" card
 * (book_assignments + the private student-materials bucket), never as a
 * public link. Every price is re-read from Stripe here, so the browser can
 * only choose WHICH shop products to buy, never what they cost.
 *
 * On payment, stripe-webhook (product_type = "shop") assigns the books and
 * tells the admin.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = ["https://kloversegy.com", "https://www.kloversegy.com"];
const MAX_LINES = 20;

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
    // ── Who is buying ──
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: { user } } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null } };
    if (!user?.email) return reply({ error: "sign_in" }, 401);

    // ── What she is buying ──
    const body = await req.json().catch(() => ({}));
    const items: { priceId?: unknown; quantity?: unknown }[] = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0 || items.length > MAX_LINES) return reply({ error: "empty" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const bookIds: string[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const priceId = typeof item.priceId === "string" ? item.priceId : "";
      if (!/^price_[A-Za-z0-9]+$/.test(priceId) || seen.has(priceId)) return reply({ error: "invalid" }, 400);
      seen.add(priceId);
      const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
      const product = price.product as Stripe.Product;
      const m = product?.metadata ?? {};
      if (!price.active || !product?.active || m.klovers_shop !== "true") return reply({ error: "unavailable" }, 409);
      if (m.ships === "true") return reply({ error: "unavailable" }, 409); // no shipping yet
      const bookId = m.book_id?.trim() || "";
      const qty = bookId ? 1 : Math.min(Math.max(Number(item.quantity) || 1, 1), 10);
      if (bookId) bookIds.push(bookId);
      lineItems.push({ price: priceId, quantity: qty });
    }

    // ── A book she already has is not sold twice ──
    if (bookIds.length > 0) {
      const { data: owned } = await supabaseAdmin
        .from("book_assignments")
        .select("book_id")
        .eq("user_id", user.id)
        .in("book_id", bookIds);
      if (owned && owned.length > 0) return reply({ error: "owned", bookIds: owned.map((r) => r.book_id) }, 409);
    }

    const origin = ALLOWED_ORIGINS.includes(req.headers.get("origin") || "")
      ? (req.headers.get("origin") as string)
      : ALLOWED_ORIGINS[0];
    const metadata = {
      product_type: "shop",
      user_id: user.id,
      email: user.email.slice(0, 254),
      book_ids: bookIds.join(",").slice(0, 490),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/shop?order=success`,
      cancel_url: `${origin}/shop?order=canceled`,
    });

    return reply({ url: session.url });
  } catch (err) {
    console.error("[shop-checkout]", err instanceof Error ? err.message : err);
    return reply({ error: "unavailable" }, 503);
  }
});
