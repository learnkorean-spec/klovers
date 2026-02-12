import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse body directly (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;

      if (!meta?.user_id) {
        console.error("No user_id in metadata");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = meta.user_id;
      const classesIncluded = Number(meta.classes_included) || 0;
      const amount = Number(meta.amount) || 0;
      const duration = Number(meta.duration) || 1;
      const unitPrice = classesIncluded > 0 ? amount / classesIncluded : 0;

      // Create enrollment with APPROVED status
      await supabaseAdmin.from("enrollments").insert({
        user_id: userId,
        plan_type: meta.class_type || "group",
        duration,
        classes_included: classesIncluded,
        amount,
        unit_price: unitPrice,
        tx_ref: session.payment_intent as string || session.id,
        receipt_url: session.receipt_url || `stripe:${session.id}`,
        status: "APPROVED",
      });

      // Update profile: add credits and set status
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("user_id", userId)
        .single();

      const currentCredits = profile?.credits || 0;

      await supabaseAdmin
        .from("profiles")
        .update({
          status: "ACTIVE",
          credits: currentCredits + classesIncluded,
        })
        .eq("user_id", userId);

      console.log(`Enrollment created for user ${userId}: ${classesIncluded} classes`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
