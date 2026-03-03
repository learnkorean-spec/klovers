import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "reham.elshrkawy@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record || payload;

    const message = record.message || "New notification";
    const type = record.type || "info";
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      : new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#000;padding:20px 30px;border-radius:8px 8px 0 0;text-align:center;">
          <h2 style="margin:0;color:#FFFF00;font-size:20px;">KLovers Admin Alert</h2>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">
            <strong>Type:</strong> ${type}
          </p>
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">
            <strong>Message:</strong> ${message}
          </p>
          <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
            ${createdAt} (Cairo time)
          </p>
          <div style="margin:24px 0 0;text-align:center;">
            <a href="https://kloversegy.com/admin" style="background:#FFFF00;color:#000;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;">
              Open Admin Dashboard
            </a>
          </div>
        </div>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:16px;">Automated notification from KLovers</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KLovers <noreply@kloversegy.com>",
        to: [ADMIN_EMAIL],
        subject: `[KLovers] ${type}: ${message.substring(0, 80)}`,
        html,
      }),
    });

    const result = await res.json();
    console.log("Email sent:", JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("notify-admin-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
