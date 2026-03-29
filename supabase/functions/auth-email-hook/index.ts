import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "noreply@kloversegy.com";
const FROM_NAME = "K-Lovers";

const YELLOW = "#ffff00";
const BLACK = "#0a0a0a";
const DARK_GRAY = "#1a1a1a";
const MID_GRAY = "#555555";
const LIGHT_GRAY = "#f5f5f5";
const BORDER = "#e5e5e5";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>K-Lovers</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BLACK};border-radius:12px;padding:12px 24px;">
                    <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
                      K<span style="color:${YELLOW};">-</span>Lovers
                    </span>
                    <span style="font-size:18px;margin-left:4px;">🇰🇷</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid ${BORDER};overflow:hidden;">

              <!-- Yellow top bar -->
              <div style="background:${YELLOW};height:5px;"></div>

              <!-- Body -->
              <div style="padding:40px 40px 32px 40px;">
                ${content}
              </div>

              <!-- Footer -->
              <div style="background:${LIGHT_GRAY};border-top:1px solid ${BORDER};padding:24px 40px;text-align:center;">
                <p style="margin:0 0 4px 0;font-size:12px;color:${MID_GRAY};">
                  You received this email because an action was taken on your K-Lovers account.
                </p>
                <p style="margin:0;font-size:12px;color:#999999;">
                  © 2025 K-Lovers · <a href="https://kloversegy.com" style="color:${MID_GRAY};text-decoration:none;">kloversegy.com</a>
                </p>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:10px;background:${YELLOW};">
        <a href="${url}"
           style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:${BLACK};text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

serve(async (req) => {
  const payload = await req.json();
  const { user, email_data } = payload;

  const emailAddress = user?.email;
  const tokenHash = email_data?.token_hash;
  const redirectTo = email_data?.redirect_to || "https://kloversegy.com";
  const emailAction = email_data?.email_action_type;

  let subject = "";
  let html = "";
  let actionUrl = "";

  if (emailAction === "signup" || emailAction === "email_change") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=email&redirect_to=${redirectTo}`;
    subject = "Confirm your email – K-Lovers";
    html = emailWrapper(`
      <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:${DARK_GRAY};letter-spacing:-0.5px;">
        Welcome to K-Lovers! 🎉
      </h1>
      <p style="margin:0 0 4px 0;font-size:15px;color:${MID_GRAY};line-height:1.6;">
        You're one step away from starting your Korean journey.
        Confirm your email address to activate your account.
      </p>
      ${ctaButton(actionUrl, "Confirm Email Address")}
      <p style="margin:0;font-size:13px;color:#999999;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${actionUrl}" style="color:${MID_GRAY};word-break:break-all;">${actionUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#bbbbbb;">
        If you didn't create a K-Lovers account, you can safely ignore this email.
      </p>
    `);
  } else if (emailAction === "recovery") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${redirectTo}`;
    subject = "Reset your password – K-Lovers";
    html = emailWrapper(`
      <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:${DARK_GRAY};letter-spacing:-0.5px;">
        Reset your password
      </h1>
      <p style="margin:0 0 4px 0;font-size:15px;color:${MID_GRAY};line-height:1.6;">
        We received a request to reset the password for your K-Lovers account.
        Click the button below to choose a new password.
      </p>
      ${ctaButton(actionUrl, "Reset Password")}
      <p style="margin:0;font-size:13px;color:#999999;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${actionUrl}" style="color:${MID_GRAY};word-break:break-all;">${actionUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#bbbbbb;">
        ⏱ This link expires in 1 hour. &nbsp;|&nbsp; If you didn't request this, ignore this email — your password won't change.
      </p>
    `);
  } else if (emailAction === "magic_link") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${redirectTo}`;
    subject = "Your login link – K-Lovers";
    html = emailWrapper(`
      <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:${DARK_GRAY};letter-spacing:-0.5px;">
        Your magic login link ✨
      </h1>
      <p style="margin:0 0 4px 0;font-size:15px;color:${MID_GRAY};line-height:1.6;">
        Click the button below to sign in to your K-Lovers account instantly — no password needed.
      </p>
      ${ctaButton(actionUrl, "Sign In to K-Lovers")}
      <p style="margin:0;font-size:13px;color:#999999;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${actionUrl}" style="color:${MID_GRAY};word-break:break-all;">${actionUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#bbbbbb;">
        ⏱ This link expires in 1 hour. &nbsp;|&nbsp; If you didn't request this, ignore this email.
      </p>
    `);
  } else {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [emailAddress],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
