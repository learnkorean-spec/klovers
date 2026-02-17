import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://klovers.lovable.app",
  "https://id-preview--21511a91-fdcf-46bb-950e-98f5a8707807.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

type TierKey = "local" | "regional" | "global";
type ClassType = "group" | "private";
type Duration = 1 | 3 | 6;

interface PriceEntry {
  priceId: string;
  amount: number;
  classesIncluded: number;
}

const priceMap: Record<TierKey, Record<ClassType, Record<Duration, PriceEntry>>> = {
  local: {
    group: {
      1: { priceId: "price_1SzuGyP5xKnfzufHDEWn3gYQ", amount: 25, classesIncluded: 4 },
      3: { priceId: "price_1SzuHIP5xKnfzufHopangw1F", amount: 70, classesIncluded: 12 },
      6: { priceId: "price_1SzuHdP5xKnfzufHOnyjqTdp", amount: 130, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuJfP5xKnfzufHInig8j7K", amount: 50, classesIncluded: 4 },
      3: { priceId: "price_1SzuJxP5xKnfzufHfeHITx65", amount: 140, classesIncluded: 12 },
      6: { priceId: "price_1SzuKHP5xKnfzufHv2F9RQxh", amount: 250, classesIncluded: 24 },
    },
  },
  regional: {
    group: {
      1: { priceId: "price_1SzuHyP5xKnfzufH95Ft0goD", amount: 40, classesIncluded: 4 },
      3: { priceId: "price_1SzuIFP5xKnfzufHVP5B37k0", amount: 110, classesIncluded: 12 },
      6: { priceId: "price_1SzuIVP5xKnfzufHiKQZNrcN", amount: 200, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuKcP5xKnfzufH5GZEy8qJ", amount: 80, classesIncluded: 4 },
      3: { priceId: "price_1SzuKrP5xKnfzufHBdVWXoWm", amount: 220, classesIncluded: 12 },
      6: { priceId: "price_1SzuLKP5xKnfzufHqCc6Z88A", amount: 380, classesIncluded: 24 },
    },
  },
  global: {
    group: {
      1: { priceId: "price_1SzuIkP5xKnfzufHUoR4BcIy", amount: 60, classesIncluded: 4 },
      3: { priceId: "price_1SzuJ3P5xKnfzufHxh1lTYg6", amount: 170, classesIncluded: 12 },
      6: { priceId: "price_1SzuJMP5xKnfzufHERVUIwAG", amount: 300, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuLZP5xKnfzufH4JcNbPF5", amount: 120, classesIncluded: 4 },
      3: { priceId: "price_1SzuLpP5xKnfzufHd9EcgWs2", amount: 330, classesIncluded: 12 },
      6: { priceId: "price_1SzuM4P5xKnfzufHQWJXvZWW", amount: 580, classesIncluded: 24 },
    },
  },
};

const VALID_TIERS: TierKey[] = ["local", "regional", "global"];
const VALID_CLASS_TYPES: ClassType[] = ["group", "private"];
const VALID_DURATIONS: Duration[] = [1, 3, 6];

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 3600_000;
const RATE_LIMIT_MAX = 5;

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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { tier, classType, duration, name, email, schedule } = await req.json();

    // Validate inputs
    if (!email || typeof email !== "string") throw new Error("Missing email");
    if (!name || typeof name !== "string") throw new Error("Missing name");
    if (name.length > 100) throw new Error("Name too long");
    if (email.length > 254) throw new Error("Email too long");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Invalid email format");

    if (!VALID_TIERS.includes(tier)) throw new Error("Invalid tier");
    if (!VALID_CLASS_TYPES.includes(classType)) throw new Error("Invalid classType");
    if (!VALID_DURATIONS.includes(Number(duration) as Duration)) throw new Error("Invalid duration");

    const priceEntry = priceMap[tier as TierKey]?.[classType as ClassType]?.[Number(duration) as Duration];
    if (!priceEntry) throw new Error("No price found for selection");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user is first-time (server-side discount validation)
    let applyDiscount = false;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Look up user by email to check enrollment history
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const matchedUser = users?.find((u: any) => u.email === email);
    if (matchedUser) {
      const { count } = await supabaseAdmin
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", matchedUser.id)
        .eq("payment_status", "PAID");

      if (count === 0) applyDiscount = true;
    } else {
      // New user = first time
      applyDiscount = true;
    }

    // Find existing Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://klovers.lovable.app";

    // Build discounts array if applicable
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (applyDiscount) {
      // Create a one-time 10% coupon
      const coupon = await stripe.coupons.create({
        percent_off: 10,
        duration: "once",
        name: "First-time student discount",
      });
      discounts.push({ coupon: coupon.id });
    }

    // Serialize schedule into metadata (Stripe metadata values must be strings, max 500 chars)
    const scheduleStr = schedule
      ? JSON.stringify({
          tz: schedule.timezone?.slice(0, 50),
          days: schedule.preferred_days?.slice(0, 2),
          time: schedule.preferred_time?.slice(0, 30),
          start: schedule.preferred_start?.slice(0, 30),
        })
      : "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceEntry.priceId, quantity: 1 }],
      mode: "payment",
      ...(discounts.length > 0 ? { discounts } : {}),
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      metadata: {
        name: name.slice(0, 100),
        email: email.slice(0, 254),
        tier: tier,
        class_type: classType,
        duration: String(duration),
        schedule: scheduleStr.slice(0, 500),
        first_time_discount: applyDiscount ? "true" : "false",
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
