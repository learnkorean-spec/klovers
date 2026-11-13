import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// A client built without a generated Database type. `ReturnType<typeof
// createClient>` resolves every table and RPC to `never` under current
// supabase-js typings, which failed `deno check` on every line that read a
// column. Type-only: nothing about what runs has changed.
// deno-lint-ignore no-explicit-any
type Db = any;

// Booking for Reham's own personal 1:1 lessons (Hungarian, Arabic-for-
// foreigners, English) — intentionally separate and much lighter than
// book-trial, which is built for the Korean group-class system (multiple
// teachers, weekly cohorts, capacity alerts, calendar invites). Here there is
// one teacher and a short list of open slots; the WhatsApp-fallback CTA on
// the landing page itself covers "nothing matches."
//
// All public access goes through this function with the service-role key.
// personal_trial_slots / personal_trial_bookings have admin-only RLS in both
// directions, so there is nothing to lock down further here.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_MAX = 8;
const LANGUAGES = new Set(["hungarian", "arabic", "english"]);

async function checkRateLimit(
  supabase: Db,
  identifier: string,
  action: string,
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const { data, error } = await supabase.rpc("upsert_trial_rate_limit", {
    p_identifier: identifier,
    p_action: action,
    p_window_start: windowStart.toISOString(),
    p_max_attempts: RATE_LIMIT_MAX,
  });
  if (error) {
    console.warn("[book-personal-trial] rate limit check error:", error.message);
    return false; // fail open, same as book-trial
  }
  return data === true;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  try {
    const body = await req.json();
    const action = body?.action;

    // ── List upcoming open slots ───────────────────────────────────────────
    if (action === "list") {
      if (await checkRateLimit(supabase, ip, "personal_trial_list")) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const todayCairo = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

      const { data: slots, error: slotsError } = await supabase
        .from("personal_trial_slots")
        .select("id, slot_date, start_time, duration_min, timezone, capacity")
        .eq("is_active", true)
        .gte("slot_date", todayCairo)
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(60);

      if (slotsError) throw slotsError;

      const slotIds = (slots ?? []).map((s) => s.id);
      let bookedCounts: Record<string, number> = {};
      if (slotIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from("personal_trial_bookings")
          .select("slot_id")
          .eq("status", "confirmed")
          .in("slot_id", slotIds);
        if (bookingsError) throw bookingsError;
        bookedCounts = (bookings ?? []).reduce((acc: Record<string, number>, row: { slot_id: string }) => {
          acc[row.slot_id] = (acc[row.slot_id] ?? 0) + 1;
          return acc;
        }, {});
      }

      const openSlots = (slots ?? [])
        .filter((s) => (bookedCounts[s.id] ?? 0) < s.capacity)
        .slice(0, 12) // a couple of days' worth is plenty to choose from
        .map((s) => ({
          id: s.id,
          date: s.slot_date,
          start_time: s.start_time,
          start_time_12h: formatTime12h(s.start_time),
          duration_min: s.duration_min,
          timezone: s.timezone,
        }));

      return new Response(JSON.stringify({ slots: openSlots }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Book a slot ─────────────────────────────────────────────────────────
    if (action === "book") {
      if (await checkRateLimit(supabase, ip, "personal_trial_book")) {
        return new Response(JSON.stringify({ error: "Too many submissions. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { slot_id, language, name, email, whatsapp, notes } = body;

      if (!slot_id || typeof slot_id !== "string") {
        return new Response(JSON.stringify({ error: "Invalid slot_id." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!LANGUAGES.has(language)) {
        return new Response(JSON.stringify({ error: "Invalid language." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        return new Response(JSON.stringify({ error: "Name is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      const trimmedEmail = (email || "").trim();
      const trimmedWhatsapp = (whatsapp || "").trim();
      if (!trimmedEmail && !trimmedWhatsapp) {
        return new Response(JSON.stringify({ error: "An email or WhatsApp number is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
        return new Response(JSON.stringify({ error: "Invalid email address." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: bookingId, error: bookError } = await supabase.rpc("book_personal_trial_slot", {
        p_slot_id: slot_id,
        p_language: language,
        p_name: trimmedName,
        p_email: trimmedEmail || null,
        p_whatsapp: trimmedWhatsapp || null,
        p_notes: (notes || "").trim() || null,
      });

      if (bookError) {
        if (bookError.message?.includes("slot_full") || bookError.message?.includes("slot_unavailable")) {
          return new Response(
            JSON.stringify({
              error: "Sorry — that time was just taken. Please pick another slot or message us on WhatsApp.",
              error_code: "slot_taken",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.error("[book-personal-trial] booking error:", bookError.message);
        return new Response(JSON.stringify({ error: "Could not complete the booking." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Best-effort admin visibility — same pattern as book-trial's error
      // alerts: informational, never blocks the response.
      try {
        const { data: slotRow } = await supabase
          .from("personal_trial_slots")
          .select("slot_date, start_time")
          .eq("id", slot_id)
          .maybeSingle();
        await supabase.from("admin_notifications").insert({
          message: `New personal trial booking (${language}): ${trimmedName} — ${slotRow?.slot_date ?? ""} ${slotRow?.start_time ?? ""}${trimmedEmail ? ` — ${trimmedEmail}` : ""}${trimmedWhatsapp ? ` — WhatsApp: ${trimmedWhatsapp}` : ""}`,
          type: "personal_trial_booking",
        });
      } catch (e) {
        console.warn("[book-personal-trial] admin_notifications insert failed:", e);
      }

      return new Response(JSON.stringify({ success: true, booking_id: bookingId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[book-personal-trial] error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
