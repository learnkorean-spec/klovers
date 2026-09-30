/**
 * shop-claim-gift — Cluby's welcome gift (30 Sep 2026).
 *
 * Re: a jumping Cluby pops up for visitors and invites them to create an
 * account; the colouring book that waits in the shop (99 EGP there) is then
 * theirs for free. The pop-up is src/components/ClubyGiftPopup.tsx, the page
 * that calls this is /gift/cluby (src/pages/ClubyGiftPage.tsx).
 *
 * Only a signed-in account can claim, only the books listed in GIFT_BOOKS,
 * and only once per account (book_assignments is unique per user + book).
 * The book lands in "My books"; a ten-minute download link comes back too.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = ["https://kloversegy.com", "https://www.kloversegy.com"];

/** Books that may be claimed as a gift. Anything else is refused. */
const GIFT_BOOKS = new Set(["cluby-coloring-1"]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const reply = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null } };
    if (!user?.id) return reply({ error: "sign_in" }, 401);

    const body = await req.json().catch(() => ({}));
    const bookId = typeof body?.bookId === "string" ? body.bookId : "";
    if (!GIFT_BOOKS.has(bookId)) return reply({ error: "not_a_gift" }, 400);

    const { data: existing } = await supabaseAdmin
      .from("book_assignments")
      .select("book_id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (!existing) {
      const { error: assignErr } = await supabaseAdmin.from("book_assignments").upsert(
        [{
          user_id: user.id,
          book_id: bookId,
          available_from: new Date().toISOString(),
          assigned_by: "gift:cluby",
          notes: "Cluby's welcome gift (pop-up)",
        }],
        { onConflict: "user_id,book_id", ignoreDuplicates: true },
      );
      if (assignErr) {
        console.error("[shop-claim-gift] assignment failed:", assignErr.message);
        return reply({ error: "unavailable" }, 503);
      }
    }

    const { data: signed } = await supabaseAdmin.storage
      .from("student-materials")
      .createSignedUrl(`books/${bookId}.pdf`, 60 * 10, { download: "Klovers-Cluby-Coloring-Book-1.pdf" });

    return reply({ ok: true, alreadyHad: !!existing, download: signed?.signedUrl ?? null });
  } catch (err) {
    console.error("[shop-claim-gift]", err instanceof Error ? err.message : err);
    return reply({ error: "unavailable" }, 503);
  }
});
