import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://kloversegy.com";

/**
 * Where an unsubscribe click lands.
 *
 * Two different URLs on purpose:
 *
 *  - the VISIBLE footer link goes to the site route, so a recipient sees a
 *    kloversegy.com URL rather than a *.supabase.co one. That route redirects
 *    here.
 *  - the List-Unsubscribe HEADER goes straight to the edge function. One-click
 *    unsubscribe is an unattended POST from Gmail's servers; it must not land
 *    on a single-page app that only works once JavaScript has run.
 */
const unsubscribeSiteUrl = (token: string, lang: string) =>
  `${SITE_URL}/unsubscribe?token=${token}&lang=${lang}`;

const unsubscribeApiUrl = (token: string, lang: string) =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe-email?token=${token}&lang=${lang}`;

/**
 * Appended by the sender, not written into the templates.
 *
 * All eight templates in BulkEmailManager were authored without one. Putting
 * it here means the next person to add a template cannot leave it out.
 */
function unsubscribeFooter(token: string, isAr: boolean): string {
  const url = unsubscribeSiteUrl(token, isAr ? "ar" : "en");
  return isAr
    ? `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-family:sans-serif;font-size:12px;color:#888;text-align:center;direction:rtl">
         <p style="margin:0">وصلتك هذه الرسالة لأنك مسجّل في KLovers.</p>
         <p style="margin:6px 0 0"><a href="${url}" style="color:#888;text-decoration:underline">إلغاء الاشتراك في الرسائل التسويقية</a></p>
       </div>`
    : `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-family:sans-serif;font-size:12px;color:#888;text-align:center">
         <p style="margin:0">You are receiving this because you registered with KLovers.</p>
         <p style="margin:6px 0 0"><a href="${url}" style="color:#888;text-decoration:underline">Unsubscribe from marketing emails</a></p>
       </div>`;
}

function buildEmail(
  htmlBody: string,
  recipientName: string | null,
  unsubscribeToken?: string | null,
  language?: string | null,
): string {
  const firstName = recipientName?.split(" ")[0]?.trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const body = htmlBody
    .replace(/\{\{greeting\}\}/g, greeting)
    .replace(/\{\{dashboard_url\}\}/g, `${SITE_URL}/dashboard`)
    .replace(/\{\{courses_url\}\}/g, `${SITE_URL}/courses`);

  if (!unsubscribeToken) return body;
  return body + unsubscribeFooter(unsubscribeToken, language !== "en");
}

/**
 * The ONE place a campaign email is handed to Resend.
 *
 * Test sends and real sends both come through here. They used to be two
 * separate fetch calls, and the headers were added to only one of them — so
 * the email an admin inspected before approving a campaign was not the email
 * recipients received. A test that differs from production is worse than no
 * test: it manufactures confidence in the exact thing being checked.
 *
 * Returns the Resend message id. It used to return nothing and discard the
 * response body — and that id is the ONLY key the delivery webhook can match a
 * campaign letter by, so throwing it away is what made every campaign send
 * permanently unanswerable: sent, and then silence, for exactly the class of
 * mail that can earn a spam complaint.
 */
async function sendCampaignEmail(opts: {
  apiKey: string;
  to: string;
  subject: string;
  htmlBody: string;
  recipientName: string | null;
  unsubscribeToken: string | null;
  language: string | null;
}): Promise<string | null> {
  const html = buildEmail(
    opts.htmlBody,
    opts.recipientName,
    opts.unsubscribeToken,
    opts.language,
  );

  const payload: Record<string, unknown> = {
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to: [opts.to],
    subject: opts.subject,
    html,
  };

  // RFC 8058. Gmail and Yahoo require these of bulk senders; without them the
  // only exit from a mailing list is the spam button, and those complaints
  // degrade the sending reputation of the address that also carries payment
  // confirmations and receipts.
  if (opts.unsubscribeToken) {
    const apiUrl = unsubscribeApiUrl(
      opts.unsubscribeToken,
      opts.language === "en" ? "en" : "ar",
    );
    payload.headers = {
      "List-Unsubscribe": `<${apiUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // A malformed success body must not turn a delivered letter into a failed
  // row: the send happened either way, so the id is best-effort.
  const body = await res.json().catch(() => null);
  return (body && typeof body.id === "string") ? body.id : null;
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
        .select("email, name, unsubscribe_token, language")
        .eq("user_id", userId)
        .single();

      await sendCampaignEmail({
        apiKey: RESEND_API_KEY,
        to: profile?.email || (claims.claims.email as string),
        subject,
        htmlBody: html_body,
        recipientName: profile?.name || null,
        unsubscribeToken: profile?.unsubscribe_token || null,
        language: profile?.language || null,
      });

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
        // Personalisation, opt-out state and the unsubscribe token all come
        // from the same row. The opt-out check has to happen HERE, not only in
        // the admin UI that enqueued these rows: a campaign can sit queued for
        // days, and someone can unsubscribe in between.
        const userIds = batch.map((s: any) => s.user_id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, name, unsubscribe_token, email_unsubscribed, language")
          .in("user_id", userIds);

        const profileMap: Record<string, any> = {};
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.user_id] = p;
          }
        }

        for (const send of batch as any[]) {
          const profile = profileMap[send.user_id];

          // Opted out — record why, and do not send. Marked rather than
          // deleted so the campaign history still accounts for the row.
          if (profile?.email_unsubscribed) {
            await adminClient
              .from("email_sends")
              .update({ status: "skipped", error: "recipient unsubscribed" })
              .eq("id", send.id);
            continue;
          }

          // No token means no way to offer an opt-out, and a marketing email
          // without one should not go out at all. Every profile has had a
          // token since the 2026-04-24 migration, so this is a guard against
          // a future row created without one.
          if (!profile?.unsubscribe_token) {
            await adminClient
              .from("email_sends")
              .update({ status: "skipped", error: "no unsubscribe token on profile" })
              .eq("id", send.id);
            continue;
          }

          try {
            const resendId = await sendCampaignEmail({
              apiKey: RESEND_API_KEY,
              to: send.email,
              subject: campaign.subject,
              htmlBody: campaign.html_body,
              recipientName: profile?.name || null,
              unsubscribeToken: profile.unsubscribe_token,
              language: profile?.language || null,
            });

            // resend_id is what the delivery webhook matches on. Without it the
            // row can record that we handed the letter over and nothing after.
            await adminClient
              .from("email_sends")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                attempts: send.attempts + 1,
                error: null,
                resend_id: resendId,
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

      const result = { queued: 0, sent: 0, failed: 0, skipped: 0 };
      if (counts) {
        for (const c of counts as any[]) {
          if (c.status === "queued") result.queued++;
          else if (c.status === "sent") result.sent++;
          else if (c.status === "failed") result.failed++;
          else if (c.status === "skipped") result.skipped++;
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
