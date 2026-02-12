import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 3600_000; // 1 hour
const RATE_LIMIT_MAX = 5; // max 5 checkout sessions per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { priceId, tier, classType, duration, classesIncluded, amount, name, email } = await req.json();

    if (!priceId || typeof priceId !== "string") throw new Error("Missing priceId");
    if (!email || typeof email !== "string") throw new Error("Missing email");
    if (!name || typeof name !== "string") throw new Error("Missing name");

    // Validate input lengths
    if (name.length > 100) throw new Error("Name too long");
    if (email.length > 254) throw new Error("Email too long");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Invalid email format");

    // Validate priceId format (Stripe price IDs start with "price_")
    if (!priceId.startsWith("price_")) throw new Error("Invalid priceId format");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find existing Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://klovers.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      metadata: {
        name: name.slice(0, 100),
        email: email.slice(0, 254),
        tier: String(tier || "").slice(0, 20),
        class_type: String(classType || "").slice(0, 20),
        duration: String(duration || ""),
        classes_included: String(classesIncluded || ""),
        amount: String(amount || ""),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
