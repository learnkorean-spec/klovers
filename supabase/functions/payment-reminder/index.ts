import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find PENDING_PAYMENT enrollments where due_at is within 6 hours or has passed
    const { data: pendingEnrollments, error } = await supabaseAdmin
      .from("enrollments")
      .select("id, user_id, plan_type, duration, amount, currency, due_at")
      .eq("approval_status", "PENDING_PAYMENT")
      .eq("currency", "EGP")
      .not("due_at", "is", null);

    if (error) throw error;

    const now = new Date();
    const reminders: string[] = [];

    for (const enrollment of pendingEnrollments || []) {
      const dueAt = new Date(enrollment.due_at);
      const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminder if within 6 hours of deadline or past deadline
      if (hoursUntilDue <= 6) {
        // Get user profile for email
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("name, email")
          .eq("user_id", enrollment.user_id)
          .single();

        if (profile?.email) {
          console.log(`Payment reminder for ${profile.email}: Enrollment ${enrollment.id}, due at ${enrollment.due_at}, amount ${enrollment.amount} EGP`);
          reminders.push(enrollment.id);

          // Call the send-confirmation-email function with reminder template
          const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation-email`;
          await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              plan_type: enrollment.plan_type,
              duration: enrollment.duration,
              sessions_total: enrollment.duration === 1 ? 4 : enrollment.duration === 3 ? 12 : 24,
              amount: enrollment.amount,
              language: "ar", // Egyptian users get Arabic
            }),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: reminders.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Payment reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
