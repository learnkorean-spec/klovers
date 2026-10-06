import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * The upcoming free-trial slots, read from the database.
 *
 * This exists because four separate hardcoded arrays of trial dates had grown
 * across the site - two in FreeTrialPage.tsx (one rendered, one in the JSON-LD)
 * a third in that file's FAQ answer, and a fourth in HeroSection.tsx. No two
 * agreed, none matched trial_slots, and every one of them was in the past, so
 * the homepage and the free-trial page were both rendering an empty gap where
 * the schedule should be.
 *
 * There is one source of truth now and it is the database.
 */
export interface UpcomingTrialSlot {
  /** The slot's own date, YYYY-MM-DD, in the slot's timezone. */
  date: string;
  /** HH:MM in the slot's timezone. */
  startTime: string;
  /** IANA zone the slot is stored in, e.g. Africa/Cairo. */
  timezone: string;
  language: string | null;
  capacity: number;
  bookedCount: number;
  durationMin: number;
  /** The actual instant the class starts. Safe to render in any timezone. */
  startsAt: Date;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  booked_count: number;
  capacity: number;
  duration_min: number;
  timezone: string | null;
  next_trial_date: string | null;
  class_language: string | null;
  session_period: string | null;
}

/**
 * Resolve "2026-09-11" + "14:00" + "Africa/Cairo" to the instant it names.
 *
 * Treat the wall-clock time as if it were UTC, ask Intl what that instant looks
 * like in the target zone, and the difference is the offset to subtract. This
 * is the same approach the email templates use, so a class renders at the same
 * moment in an inbox and on the site.
 */
function resolveInstant(date: string, time: string, tz: string): Date | null {
  const [h, m] = time.split(":");
  const asUTC = new Date(`${date}T${(h ?? "00").padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}:00Z`);
  if (isNaN(asUTC.getTime())) return null;
  try {
    const seen = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(asUTC).replace(", ", "T").replace("T24:", "T00:");
    const offset = new Date(`${seen}Z`).getTime() - asUTC.getTime();
    return new Date(asUTC.getTime() - offset);
  } catch {
    // A zone Intl will not accept. Better to drop the slot than to render it
    // at a time we cannot stand behind.
    return null;
  }
}

// One fetch per page load, shared by every component that asks. The homepage
// hero and the free-trial page both want this and neither should pay twice.
let inFlight: Promise<UpcomingTrialSlot[]> | null = null;

/** A request that never answers must not leave the page on grey boxes forever (6 Oct 2026). */
const SLOTS_TIMEOUT_MS = 8000;

async function loadSlots(): Promise<UpcomingTrialSlot[]> {
  let result: { data: unknown; error: unknown };
  try {
    result = await Promise.race([
      supabase.rpc("get_trial_availability", { p_language: null }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("slots timeout")), SLOTS_TIMEOUT_MS)),
    ]);
  } catch {
    // Timed out or the network failed: forget this attempt so the next mount retries.
    inFlight = null;
    return [];
  }
  const { data, error } = result;
  if (error || !data) {
    inFlight = null;
    return [];
  }
  const now = Date.now();
  return (data as AvailabilityRow[])
    .map((row) => {
      if (!row.next_trial_date || !row.start_time) return null;
      const tz = row.timezone || "Africa/Cairo";
      const startsAt = resolveInstant(row.next_trial_date, row.start_time, tz);
      if (!startsAt) return null;
      return {
        date: row.next_trial_date,
        startTime: row.start_time,
        timezone: tz,
        language: row.class_language,
        capacity: row.capacity,
        bookedCount: Number(row.booked_count ?? 0),
        durationMin: row.duration_min ?? 30,
        startsAt,
      } as UpcomingTrialSlot;
    })
    .filter((s): s is UpcomingTrialSlot => s !== null && s.startsAt.getTime() > now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function useUpcomingTrialSlots() {
  const [slots, setSlots] = useState<UpcomingTrialSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let retried = false;
    const run = () => {
      inFlight ??= loadSlots();
      inFlight
        .then((rows) => {
          if (!alive) return;
          // inFlight is cleared only when the request failed (not when nothing
          // is open): try once more before telling the visitor nothing is open.
          if (rows.length === 0 && inFlight === null && !retried) {
            retried = true;
            setTimeout(() => { if (alive) run(); }, 1500);
            return;
          }
          setSlots(rows);
          setLoading(false);
        })
        .catch(() => { if (alive) setLoading(false); });
    };
    run();
    return () => { alive = false; };
  }, []);

  return { slots, loading };
}

/** The visitor's own IANA zone, read from the browser. */
export function viewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo";
  } catch {
    return "Africa/Cairo";
  }
}
