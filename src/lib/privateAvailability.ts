import { supabase } from "@/integrations/supabase/client";
import { TIMEZONE, PRIVATE_TIME_OPTIONS, WEEKDAYS } from "@/constants/scheduling";

export interface PrivateSlotOption {
  weekday: string;
  dayIndex: number;
  time: string;
  timeFormatted: string;
  timezone: string;
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Pure function: given group slots (with day_of_week), compute private-allowed options.
 */
export function computePrivateAvailability(
  groupSlots: { day_of_week: number }[],
  timeOptions: string[] = PRIVATE_TIME_OPTIONS
): { courseDays: string[]; privateAllowedDays: string[]; options: PrivateSlotOption[] } {
  const courseDayIndices = new Set(groupSlots.map((s) => s.day_of_week));
  const courseDays = WEEKDAYS.filter((_, i) => courseDayIndices.has(i));
  const privateAllowedDays = WEEKDAYS.filter((_, i) => !courseDayIndices.has(i));

  const options: PrivateSlotOption[] = [];
  for (const day of privateAllowedDays) {
    const dayIndex = WEEKDAYS.indexOf(day);
    for (const time of timeOptions) {
      options.push({
        weekday: day,
        dayIndex,
        time,
        timeFormatted: formatTime12(time),
        timezone: TIMEZONE,
      });
    }
  }

  if (import.meta.env.DEV) {
    console.log("[privateAvailability] courseDays:", courseDays);
    console.log("[privateAvailability] privateAllowedDays:", privateAllowedDays);
    console.log("[privateAvailability] timeOptions:", timeOptions);
  }

  return { courseDays, privateAllowedDays, options };
}

/**
 * Fetch configured private time options from app_settings.
 * Falls back to PRIVATE_TIME_OPTIONS constant if not found.
 */
async function fetchPrivateTimeOptions(): Promise<string[]> {
  const { data } = await (supabase as any)
    .from("app_settings")
    .select("value")
    .eq("key", "private_time_options")
    .maybeSingle();

  if (data?.value) {
    try {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }
  return PRIVATE_TIME_OPTIONS;
}

/**
 * Fetch active group slots from DB and compute private availability.
 */
export async function fetchPrivateAvailability() {
  const [groupResult, timeOptions] = await Promise.all([
    (supabase as any)
      .from("schedule_packages")
      .select("day_of_week")
      .eq("is_active", true)
      .neq("course_type", "private"),
    fetchPrivateTimeOptions(),
  ]);

  if (groupResult.error) {
    console.error("Failed to fetch group slots for private availability:", groupResult.error);
    return computePrivateAvailability([], timeOptions);
  }

  return computePrivateAvailability((groupResult.data as { day_of_week: number }[]) || [], timeOptions);
}
