import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://klovers.lovable.app";

function buildEmail(htmlBody: string, recipientName: string | null): string {
  const firstName = recipientName?.split(" ")[0]?.trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  return htmlBody
    .replace(/\{\{greeting\}\}/g, greeting)
    .replace(/\{\{dashboard_url\}\}/g, `${SITE_URL}/dashboard`)
    .replace(/\{\{courses_url\}\}/g, `${SITE_URL}/courses`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check admin role
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // === TEST SEND ===
    if (action === "test") {
      const { subject, html_body } = body;
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email, name")
        .eq("user_id", userId)
        .single();

      const html = buildEmail(html_body, profile?.name || null);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL") || "KLovers <onboarding@resend.dev>",
          to: [profile?.email || claims.claims.email],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${err}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === PROCESS BATCH ===
    if (action === "process") {
      const { campaign_id } = body;

      // Get campaign details
      const { data: campaign } = await adminClient
        .from("email_campaigns")
        .select("subject, html_body")
        .eq("id", campaign_id)
        .single();

      if (!campaign) throw new Error("Campaign not found");

      // Pick up to 50 queued or failed (attempts < 3)
      const { data: batch } = await adminClient
        .from("email_sends")
        .select("*")
        .eq("campaign_id", campaign_id)
        .or("status.eq.queued,and(status.eq.failed,attempts.lt.3)")
        .order("created_at")
        .limit(50);

      if (batch && batch.length > 0) {
        // Get profile names for personalization
        const userIds = batch.map((s: any) => s.user_id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        if (profiles) {
          for (const p of profiles) {
            nameMap[p.user_id] = p.name;
          }
        }

        for (const send of batch as any[]) {
          try {
            const html = buildEmail(campaign.html_body, nameMap[send.user_id] || null);

            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: Deno.env.get("FROM_EMAIL") || "KLovers <onboarding@resend.dev>",
                to: [send.email],
                subject: campaign.subject,
                html,
              }),
            });

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(errText);
            }

            await adminClient
              .from("email_sends")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                attempts: send.attempts + 1,
                error: null,
              })
              .eq("id", send.id);
          } catch (err: any) {
            await adminClient
              .from("email_sends")
              .update({
                status: "failed",
                error: err.message?.substring(0, 500),
                attempts: send.attempts + 1,
              })
              .eq("id", send.id);
          }

          // Rate limit: 1s delay
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      // Return current counts
      const { data: counts } = await adminClient
        .from("email_sends")
        .select("status")
        .eq("campaign_id", campaign_id);

      const result = { queued: 0, sent: 0, failed: 0 };
      if (counts) {
        for (const c of counts as any[]) {
          if (c.status === "queued") result.queued++;
          else if (c.status === "sent") result.sent++;
          else if (c.status === "failed") result.failed++;
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-email-campaign error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
