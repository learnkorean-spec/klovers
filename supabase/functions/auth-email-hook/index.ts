// Account emails sent by Supabase Auth: confirm email, password reset, login link.
//
// 16 Sep 2026 (claude/CUSTOMER_MESSAGE_TONE_RULE.md): these now wear the same
// header and footer as every other Klovers email - `brandWrapper` from
// send-confirmation-email's templates/common.ts - with a WhatsApp block above
// the signature. The Korean flag emoji in the old header is gone
// (claude/NO_KOREAN_FLAG_EMOJI.md), as are the celebration emoji (neutral
// tone).
//
// The action links are built exactly as before - a design change must not
// touch sign-in. Copy stays English: Auth does not tell this hook which
// language the reader uses.
//
// SIGNATURE CHECK (16 Sep 2026)
// -----------------------------
// This endpoint is public (verify_jwt = false, as Auth hooks require). Before
// this change anyone could POST a made-up payload and have Klovers send a real
// "reset your password" email, from the real domain, to any address, with a
// link of their choosing in it.
//
// Supabase Auth signs every hook call (Standard Webhooks). When the secret is
// present in SEND_EMAIL_HOOK_SECRET (Dashboard -> Authentication -> Hooks ->
// Send Email -> secret, value "v1,whsec_..."), an unsigned or wrongly signed
// request is refused with 401.
//
// When the secret is NOT set, the function behaves exactly as before and logs
// a warning. That is deliberate: a deploy must never be able to break sign-up.
// Setting the secret is the switch that turns the check on.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
import {
  BRAND_DARK, BRAND_MUTED, WHATSAPP_URL, brandWrapper, brandButton,
} from "../send-confirmation-email/templates/common.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET_RAW = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").trim();
// The dashboard shows "v1,whsec_<base64>"; the library wants the base64 part.
const HOOK_SECRET = HOOK_SECRET_RAW.replace(/^v1,/, "").replace(/^whsec_/, "");

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function whatsappBlock(): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help with your account? Message us on WhatsApp.</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WHATSAPP_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
    </div>`;
}

function accountLetter(opts: {
  title: string;
  intro: string;
  button: string;
  url: string;
  note: string;
}): string {
  return brandWrapper(`
    <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${opts.title}</h1>
    <p>${opts.intro}</p>
    <div style="margin: 24px 0; text-align: center;">
      ${brandButton(opts.button, opts.url)}
    </div>
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${opts.url}" style="color: ${BRAND_MUTED}; word-break: break-all;">${opts.url}</a>
    </p>
    <p style="color: ${BRAND_MUTED}; font-size: 12px;">${opts.note}</p>
    ${whatsappBlock()}
    <p style="color: #999999; font-size: 11px; text-align: center; margin-top: 24px;">
      You received this email because an action was taken on your Klovers account.
    </p>
  `, false);
}

serve(async (req) => {
  const raw = await req.text();

  // deno-lint-ignore no-explicit-any
  let payload: any;
  if (HOOK_SECRET) {
    try {
      const headers = Object.fromEntries(req.headers);
      payload = new Webhook(HOOK_SECRET).verify(raw, headers);
    } catch (e) {
      console.warn("auth-email-hook: rejected unsigned or badly signed request:",
        e instanceof Error ? e.message : String(e));
      return json({ error: { http_code: 401, message: "invalid signature" } }, 401);
    }
  } else {
    console.warn("auth-email-hook: SEND_EMAIL_HOOK_SECRET is not set - signature NOT checked");
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ error: { http_code: 400, message: "invalid JSON" } }, 400);
    }
  }

  const { user, email_data } = payload ?? {};

  const emailAddress = user?.email;
  const tokenHash = email_data?.token_hash;
  const redirectTo = email_data?.redirect_to || "https://kloversegy.com";
  const emailAction = email_data?.email_action_type;

  let subject = "";
  let html = "";
  let actionUrl = "";

  if (emailAction === "signup" || emailAction === "email_change") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=email&redirect_to=${redirectTo}`;
    subject = "Confirm your email – Klovers";
    html = accountLetter({
      title: "Welcome to Klovers",
      intro: "Confirm your email address to activate your account and start learning Korean.",
      button: "Confirm Email Address",
      url: actionUrl,
      note: "If you didn't create a Klovers account, you can safely ignore this email.",
    });
  } else if (emailAction === "recovery") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${redirectTo}`;
    subject = "Reset your password – Klovers";
    html = accountLetter({
      title: "Reset your password",
      intro: "We received a request to reset the password for your Klovers account. Use the button below to choose a new password.",
      button: "Reset Password",
      url: actionUrl,
      note: "This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.",
    });
  } else if (emailAction === "magic_link") {
    actionUrl = `https://ewtdgpbybkceokfohhyg.supabase.co/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${redirectTo}`;
    subject = "Your login link – Klovers";
    html = accountLetter({
      title: "Your login link",
      intro: "Use the button below to sign in to your Klovers account — no password needed.",
      button: "Sign In to Klovers",
      url: actionUrl,
      note: "This link expires in 1 hour. If you didn't request this, ignore this email.",
    });
  } else {
    return json({ success: true });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      reply_to: REPLY_TO_EMAIL,
      to: [emailAddress],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: err }, 500);
  }

  return json({ success: true });
});
