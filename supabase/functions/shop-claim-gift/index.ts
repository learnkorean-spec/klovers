/**
 * shop-claim-gift — Cluby's welcome gift (30 Sep 2026).
 *
 * Re: a jumping Cluby pops up and invites visitors to get the colouring book
 * that waits in the shop (99 EGP there) for free. Signed-out visitors are sent
 * to sign-up first; signed-in accounts that have not downloaded it yet are
 * shown the pop-up too. The pop-up is src/components/ClubyGiftPopup.tsx, the
 * page that claims is /gift/cluby (src/pages/ClubyGiftPage.tsx).
 *
 * Actions (body.action, default "claim"), all need a signed-in account:
 *   status        → { owned, downloaded }   decides whether the pop-up shows
 *   claim         → adds the book to "My books" once (book_assignments,
 *                   assigned_by gift:cluby)
 *   download      → a ten-minute download link; counts one download
 *   log_download  → counts a download made from the "My books" card
 *   stats         → admins only: pop-up seen / tapped, accounts that took the
 *                   book, downloads and people who downloaded
 *
 * Tracking (Re: "must track how many people downloaded"): every claim and
 * every download is a lead_events row, source_type "cluby_gift", cta_label
 * "claimed" / "downloaded", with the user id. The admin Books library counts
 * them. Only the books in GIFT_BOOKS can be claimed.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = ["https://kloversegy.com", "https://www.kloversegy.com"];

/** Books that may be claimed as a gift. Anything else is refused. */
const GIFT_BOOKS = new Set(["cluby-coloring-1"]);
const FILE_NAME: Record<string, string> = { "cluby-coloring-1": "Klovers-Cluby-Coloring-Book-1.pdf" };

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
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!user?.id) return reply({ error: "sign_in" }, 401);

    const body = await req.json().catch(() => ({}));
    const bookId = typeof body?.bookId === "string" ? body.bookId : "";
    const action = typeof body?.action === "string" ? body.action : "claim";

    if (action === "stats") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return reply({ error: "forbidden" }, 403);
      const { data: rows } = await admin
        .from("lead_events")
        .select("cta_label, user_id, session_id")
        .eq("source_type", "cluby_gift")
        .limit(50000);
      const all = (rows ?? []) as { cta_label: string | null; user_id: string | null; session_id: string }[];
      const starts = (p: string) => all.filter((r) => (r.cta_label ?? "").startsWith(p));
      const downloads = starts("downloaded");
      return reply({
        shown: starts("popup_shown").length,
        taps: starts("popup_cta").length,
        claimed: starts("claimed").length,
        downloads: downloads.length,
        people: new Set(downloads.map((r) => r.user_id).filter(Boolean)).size,
      });
    }
    // Store funnel for the admin Books library (1 Oct 2026, store review "9/10"):
    // visitors per step in the last 30 days (lead_events source_type "shop",
    // one count per browser session), books delivered by route, and Egypt
    // receipts still waiting for Re in MONEY IN.
    if (action === "shop_stats") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return reply({ error: "forbidden" }, 403);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: ev }, { data: sold }, { count: waiting }] = await Promise.all([
        admin.from("lead_events").select("cta_label, session_id").eq("source_type", "shop").gte("created_at", since).limit(50000),
        admin.from("book_assignments").select("assigned_by, assigned_at").like("assigned_by", "shop:%").limit(50000),
        admin.from("student_payment_claims").select("id", { count: "exact", head: true })
          .eq("status", "pending").like("note", "%[shop:%"),
      ]);
      const visitors: Record<string, number> = {};
      const seen = new Set<string>();
      for (const r of (ev ?? []) as { cta_label: string | null; session_id: string }[]) {
        const key = `${r.cta_label}|${r.session_id}`;
        if (!r.cta_label || seen.has(key)) continue;
        seen.add(key);
        visitors[r.cta_label] = (visitors[r.cta_label] ?? 0) + 1;
      }
      const sales = { stripe: 0, manual: 0, free: 0, stripe30: 0, manual30: 0, free30: 0 };
      for (const r of (sold ?? []) as { assigned_by: string; assigned_at: string | null }[]) {
        const k = r.assigned_by.replace("shop:", "") as "stripe" | "manual" | "free";
        if (!(k in sales)) continue;
        sales[k] += 1;
        if ((r.assigned_at ?? "") >= since) sales[`${k}30` as keyof typeof sales] += 1;
      }
      return reply({ visitors, sales, waiting: waiting ?? 0 });
    }

    if (!GIFT_BOOKS.has(bookId)) return reply({ error: "not_a_gift" }, 400);

    const track = async (label: "claimed" | "downloaded", from: string) => {
      const { error } = await admin.from("lead_events").insert({
        session_id: crypto.randomUUID(),
        user_id: user.id,
        source_type: "cluby_gift",
        source_page: from,
        cta_label: label,
        metadata: { book_id: bookId },
      });
      if (error) console.error("[shop-claim-gift] tracking failed:", error.message);
    };

    const { data: owned } = await admin
      .from("book_assignments")
      .select("book_id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (action === "status") {
      const { count } = await admin
        .from("lead_events")
        .select("id", { count: "exact", head: true })
        .eq("source_type", "cluby_gift")
        .eq("cta_label", "downloaded")
        .eq("user_id", user.id);
      return reply({ owned: !!owned, downloaded: (count ?? 0) > 0 });
    }

    if (action === "log_download") {
      if (owned) await track("downloaded", "/dashboard");
      return reply({ ok: true });
    }

    // claim (and download, which claims first when needed)
    if (!owned) {
      const { error: assignErr } = await admin.from("book_assignments").upsert(
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
      await track("claimed", "/gift/cluby");
    }

    if (action === "download") {
      const { data: signed, error: signErr } = await admin.storage
        .from("student-materials")
        .createSignedUrl(`books/${bookId}.pdf`, 60 * 10, { download: FILE_NAME[bookId] ?? `${bookId}.pdf` });
      if (signErr || !signed?.signedUrl) return reply({ error: "unavailable" }, 503);
      await track("downloaded", "/gift/cluby");
      return reply({ ok: true, url: signed.signedUrl });
    }

    return reply({ ok: true, alreadyHad: !!owned });
  } catch (err) {
    console.error("[shop-claim-gift]", err instanceof Error ? err.message : err);
    return reply({ error: "unavailable" }, 503);
  }
});
