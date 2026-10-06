import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  "https://kloversegy.com",
  "https://www.kloversegy.com",
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

// ---------------------------------------------------------------------------
// What decides the tier.
//
// The tier is a statement about where a student LIVES — that is what the three
// price bands are for. It is not a statement about where the request came from,
// and the two part company constantly: a student who lives in Cairo pays while
// visiting Riyadh, an expatriate in Jeddah pays with an Egyptian card, anyone
// at all is behind a VPN.
//
// So only a country that someone has actually stated prices anything:
//
//   1. profiles.country                      — stored, deliberate, correctable
//   2. residence_country in the request      — the enrol page's own country
//                                              question; written to the profile
//                                              so it becomes (1) next time
//   3. neither                               — the submitted tier, as before
//
// The IP country and the browser timezone are recorded in the Stripe session
// metadata and price NOTHING. They exist so a mismatch is visible and can be
// reviewed, which is the honest thing a guess can do here: guessing upward
// overcharges a real student and loses the sale, and that is a worse failure
// than the discount it would prevent.
//
// tierCountries is duplicated from src/lib/stripePrices.ts because an edge
// function cannot import from the client bundle. If a country moves tier, both
// files change together.
// ---------------------------------------------------------------------------

const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

function getTierForCountry(country: string | null): TierKey | null {
  if (!country) return null;
  for (const [tier, countries] of Object.entries(tierCountries)) {
    if (countries.includes(country)) return tier as TierKey;
  }
  return null;
}

// UAE and Saudi students pay in their own currency (Re, 6 Oct 2026). The
// amounts are the published AED / SAR rows in src/lib/stripePrices.ts
// (COUNTRY_LOCAL_PRICES) -- change both files together. They are sent to
// Stripe as an inline price, so nothing has to exist in the Stripe dashboard;
// stripe-webhook recognises these sessions from the metadata below.
const LOCAL_CARD_PRICES: Record<string, { currency: "aed" | "sar"; group: number[]; private: number[] }> = {
  "UAE":          { currency: "aed", group: [220, 624, 1100], private: [440, 1210, 2130] },
  "Saudi Arabia": { currency: "sar", group: [225, 638, 1125], private: [450, 1238, 2175] },
};
const DURATION_INDEX: Record<number, number> = { 1: 0, 3: 1, 6: 2 };

/** ISO 3166-1 alpha-2 → the country name tierCountries uses. Review flag only. */
const ISO_TO_COUNTRY: Record<string, string> = {
  EG: "Egypt", MA: "Morocco", TN: "Tunisia", DZ: "Algeria", LY: "Libya",
  JO: "Jordan", LB: "Lebanon", IQ: "Iraq", SY: "Syria", SD: "Sudan", YE: "Yemen",
  MY: "Malaysia", ID: "Indonesia", TH: "Thailand", VN: "Vietnam", PH: "Philippines",
  IN: "India", PK: "Pakistan", BR: "Brazil", MX: "Mexico", CO: "Colombia",
  AR: "Argentina", TR: "Turkey",
  AE: "UAE", SA: "Saudi Arabia", QA: "Qatar", BH: "Bahrain", OM: "Oman", KW: "Kuwait",
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
  CA: "Canada", AU: "Australia", JP: "Japan", KR: "South Korea", CN: "China",
};

/** Country values that carry no information, whatever the student typed. */
const PLACEHOLDER_COUNTRIES = ["", "unknown", "other", "n/a", "na", "none", "-"];

/** Spellings of Egypt that occur in profiles.country, plus its cities. */
const EGYPT_ALIASES = ["egypt", "eg", "egy", "cairo", "ismailia", "alexandria", "giza", "مصر", "القاهرة"];

/** A stated country, canonicalised, or null when it states nothing. */
function normalizeCountry(country?: string | null): string | null {
  const raw = (country ?? "").trim();
  const folded = raw.toLowerCase();
  if (PLACEHOLDER_COUNTRIES.includes(folded)) return null;
  if (EGYPT_ALIASES.includes(folded)) return "Egypt";
  return raw || null;
}

/** Where the request came from, as far as the edge can tell. A flag, not a price. */
function geoCountry(req: Request): string | null {
  const iso =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country-code") ||
    "";
  const code = iso.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return null; // Cloudflare unknown / Tor
  return ISO_TO_COUNTRY[code] ?? code;
}

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

/**
 * The auth user with this email, looked at every page.
 *
 * listUsers() returns one page — 50 rows by default — and was called without
 * one. With over a hundred profiles, every user past the first page failed to
 * match: they were treated as first-time and handed the 10% discount again, and
 * their referral bonus was skipped because the counts it needs key off the id
 * this lookup never found.
 */
async function findUserByEmail(supabaseAdmin: any, email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u: any) => (u.email ?? "").trim().toLowerCase() === target);
    if (match) return match;
    if (users.length < perPage) return null; // last page
  }
  return null;
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

    const {
      tier,
      classType,
      duration,
      name,
      email,
      schedule,
      level,
      package_id,
      residence_country,
    } = await req.json();

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const matchedUser = await findUserByEmail(supabaseAdmin, email);

    // --- The country, then the tier ------------------------------------------
    //
    // profiles is keyed by its own `id`; the auth user is `user_id`. They are
    // never equal — `id = user_id` holds for 0 of 103 rows — and reading by the
    // wrong one was why #444 never saw a stored country at all.

    let storedCountry: string | null = null;
    if (matchedUser) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("country")
        .eq("user_id", matchedUser.id)
        .maybeSingle();
      storedCountry = normalizeCountry(profile?.country);
    }

    const statedCountry = normalizeCountry(
      typeof residence_country === "string" ? residence_country.slice(0, 60) : null,
    );

    // The enrol page asks where the student lives; keep the answer, so the next
    // checkout reads it from the profile instead of taking it on trust again.
    if (!storedCountry && statedCountry && matchedUser) {
      await supabaseAdmin
        .from("profiles")
        .update({ country: statedCountry })
        .eq("user_id", matchedUser.id);
    }

    const pricingCountry = storedCountry ?? statedCountry;
    const countrySource = storedCountry ? "profile" : statedCountry ? "stated" : "none";

    const countryTier = getTierForCountry(pricingCountry);
    const effectiveTier: TierKey = countryTier ?? (tier as TierKey);

    // Recorded, never priced from.
    const ipCountry = geoCountry(req);
    const browserTimezone = (schedule?.timezone || "").slice(0, 60);
    const geoDisagrees = !!(ipCountry && pricingCountry && ipCountry !== pricingCountry);

    const priceEntry = priceMap[effectiveTier]?.[classType as ClassType]?.[Number(duration) as Duration];
    if (!priceEntry) throw new Error("No price found for selection");

    // Check if user is first-time (server-side discount validation)
    let applyDiscount = false;
    if (matchedUser) {
      const { count } = await supabaseAdmin
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", matchedUser.id)
        .eq("payment_status", "PAID");

      if ((count ?? 0) === 0) applyDiscount = true;
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

    const origin = req.headers.get("origin") || "https://kloversegy.com";

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

    // Calculate referral bonus discount (stacks with first-timer or promo code)
    let referralExtra = 0;
    if (matchedUser) {
      const [convResult, clickResult] = await Promise.all([
        supabaseAdmin
          .from("referral_conversions")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", matchedUser.id),
        supabaseAdmin
          .from("referral_clicks")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", matchedUser.id),
      ]);

      const conversions = convResult.count ?? 0;
      const clicks = clickResult.count ?? 0;
      const shareOnly = Math.max(0, clicks - conversions);
      referralExtra = Math.min(conversions * 5 + shareOnly * 2, 15);

      if (referralExtra > 0) {
        const referralCoupon = await stripe.coupons.create({
          percent_off: referralExtra,
          duration: "once",
          name: `Referral bonus (${referralExtra}%)`,
        });
        discounts.push({ coupon: referralCoupon.id });
      }
    }

    const localRow = pricingCountry ? LOCAL_CARD_PRICES[pricingCountry] : undefined;
    const localAmount = localRow?.[classType as ClassType]?.[DURATION_INDEX[Number(duration)]];
    const localLineItem = localRow && typeof localAmount === "number"
      ? {
          price_data: {
            currency: localRow.currency,
            unit_amount: Math.round(localAmount * 100),
            product_data: {
              name: `Klovers Korean - ${priceEntry.classesIncluded} ${classType} classes (${Number(duration)} month${Number(duration) === 1 ? "" : "s"})`,
            },
          },
          quantity: 1,
        }
      : null;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [localLineItem ?? { price: priceEntry.priceId, quantity: 1 }],
      mode: "payment",
      ...(discounts.length > 0 ? { discounts } : {}),
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      metadata: {
        name: name.slice(0, 100),
        email: email.slice(0, 254),
        tier: effectiveTier,
        requested_tier: String(tier),
        pricing_country: (pricingCountry || "").slice(0, 60),
        country_source: countrySource,
        // Flags for review. Neither of these changed the price.
        ip_country: (ipCountry || "").slice(0, 60),
        geo_disagrees: geoDisagrees ? "true" : "false",
        class_type: classType,
        duration: String(duration),
        level: (level || "").slice(0, 50),
        package_id: (package_id || "").slice(0, 50),
        preferred_days: (schedule?.preferred_days ?? []).slice(0, 3).join(",").slice(0, 100),
        preferred_time: (schedule?.preferred_time || "").slice(0, 50),
        preferred_start: (schedule?.preferred_start || "").slice(0, 50),
        timezone: browserTimezone,
        first_time_discount: applyDiscount ? "true" : "false",
        referral_bonus_percent: String(referralExtra),
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
