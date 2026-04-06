import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const { referrerId, referredEmail } = await req.json();

    if (!referrerId || !referredEmail) {
      return new Response(JSON.stringify({ error: "Missing referrerId or referredEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format for referrerId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(referrerId)) {
      return new Response(JSON.stringify({ error: "Invalid referrerId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify referrer exists as a real user
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", referrerId)
      .maybeSingle();

    if (!referrerProfile) {
      return new Response(JSON.stringify({ error: "Referrer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert referral_conversion (UNIQUE on referrer_user_id + referred_email prevents double-awards)
    const { data: inserted, error: insertError } = await supabase
      .from("referral_conversions")
      .insert({
        referrer_user_id: referrerId,
        referred_email: referredEmail.trim().toLowerCase(),
        xp_awarded: false,
      })
      .select()
      .single();

    if (insertError) {
      // Unique constraint violation = already recorded
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ success: true, xpAwarded: false, reason: "already_recorded" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    // Award 150 XP to the referrer
    await supabase.from("student_xp").insert({
      user_id: referrerId,
      activity_type: "referral_conversion",
      xp_earned: 150,
      lesson_id: null,
    });

    // Mark XP as awarded
    await supabase
      .from("referral_conversions")
      .update({ xp_awarded: true })
      .eq("id", inserted.id);

    return new Response(JSON.stringify({ success: true, xpAwarded: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("record-referral error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
