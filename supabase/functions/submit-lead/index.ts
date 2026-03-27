import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 submissions per minute per IP

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { name, email, country, level, goal, plan_type, duration, schedule, timezone, source, user_id } = body;

    // Server-side validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ error: "Invalid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Name is optional — fall back to email prefix if empty or too long
    const resolvedName = (
      name && typeof name === "string" && name.trim().length > 0 && name.length <= 100
        ? name.trim()
        : email.split("@")[0]
    );

    if (country && (typeof country !== "string" || country.length > 100)) {
      return new Response(
        JSON.stringify({ error: "Invalid country." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (level && (typeof level !== "string" || level.length > 50)) {
      return new Response(
        JSON.stringify({ error: "Invalid level." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (goal && (typeof goal !== "string" || goal.length > 500)) {
      return new Response(
        JSON.stringify({ error: "Invalid goal." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to insert (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email.trim().toLowerCase();

    // Upsert by email: update existing or insert new
    const upsertPayload: Record<string, any> = {
      name: resolvedName,
      email: normalizedEmail,
      country: country?.trim() || "",
      level: level?.trim() || "",
      goal: goal?.trim() || "",
      plan_type: plan_type?.trim() || "",
      duration: duration?.trim() || "",
      schedule: schedule?.trim() || "",
      timezone: timezone?.trim() || "",
      source: source?.trim() || "enroll",
    };

    // Attach user_id if provided
    if (user_id && typeof user_id === "string" && user_id.length > 0) {
      upsertPayload.user_id = user_id;
    }

    // Check for existing lead by email
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      // Update existing lead (merge new data)
      const updatePayload: Record<string, any> = {};
      if (upsertPayload.country) updatePayload.country = upsertPayload.country;
      if (upsertPayload.level) updatePayload.level = upsertPayload.level;
      if (upsertPayload.goal) updatePayload.goal = upsertPayload.goal;
      if (upsertPayload.plan_type) updatePayload.plan_type = upsertPayload.plan_type;
      if (upsertPayload.duration) updatePayload.duration = upsertPayload.duration;
      if (upsertPayload.schedule) updatePayload.schedule = upsertPayload.schedule;
      if (upsertPayload.timezone) updatePayload.timezone = upsertPayload.timezone;
      if (upsertPayload.source) updatePayload.source = upsertPayload.source;
      if (upsertPayload.user_id) updatePayload.user_id = upsertPayload.user_id;

      const { error } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", existingLead.id);

      if (error) {
        console.error("Lead update error:", error.message);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new lead
    upsertPayload.status = "new";
    const { error } = await supabase.from("leads").insert(upsertPayload);

    if (error) {
      console.error("Lead insert error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to submit. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
