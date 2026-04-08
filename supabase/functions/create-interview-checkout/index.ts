import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    // Verify session belongs to user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: session, error: sessErr } = await supabaseAdmin
      .from("interview_training_sessions")
      .select("id, payment_status, user_id")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (sessErr || !session) throw new Error("Session not found");
    if (session.payment_status === "paid") throw new Error("Already paid");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://kloversegy.com";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Korean Interview Training — 5 Extra Questions",
            description: "AI-generated personalized Korean interview Q&A pairs with translations and pronunciation",
          },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/interview-training?payment=success&session_id=${session_id}`,
      cancel_url: `${origin}/interview-training?payment=canceled`,
      metadata: {
        product_type: "interview_training",
        interview_session_id: session_id,
        user_id: user.id,
      },
    });

    // Mark session as pending
    await supabaseAdmin
      .from("interview_training_sessions")
      .update({
        payment_status: "pending",
        stripe_session_id: checkoutSession.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    return new Response(JSON.stringify({ url: checkoutSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
