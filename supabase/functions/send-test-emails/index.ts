import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error (${to}): ${err}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all profiles
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .neq("email", "");

    if (error) throw new Error(error.message);
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No students found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; status: string }[] = [];

    for (const p of profiles) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6d28d9;">Welcome to KLovers, ${p.name || "Student"}! 🇰🇷</h1>
            <p>You're registered with KLovers! Here's what you can do:</p>
            <ul>
              <li>📖 <a href="https://klovers.lovable.app/blog" style="color: #6d28d9;">Read our blog</a> about Korean language & culture</li>
              <li>📚 <a href="https://klovers.lovable.app/enroll" style="color: #6d28d9;">Enroll in classes</a> — Group or Private Korean lessons</li>
              <li>🎯 Track your progress on your <a href="https://klovers.lovable.app/dashboard" style="color: #6d28d9;">Student Dashboard</a></li>
            </ul>
            <div style="margin: 24px 0;">
              <a href="https://klovers.lovable.app/enroll" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Start Learning Korean</a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
          </div>`;

        await sendEmail(p.email, "Welcome to KLovers! 🎉🇰🇷", html);
        results.push({ email: p.email, status: "sent" });
      } catch (err: any) {
        results.push({ email: p.email, status: `failed: ${err.message}` });
      }
    }

    return new Response(
      JSON.stringify({ total: profiles.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Batch email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
