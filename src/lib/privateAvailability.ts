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
 * Pure function: given explicit private day names, compute private slot options.
 */
export function computePrivateAvailability(
  privateDayNames: string[],
  timeOptions: string[] = PRIVATE_TIME_OPTIONS
): { courseDays: string[]; privateAllowedDays: string[]; options: PrivateSlotOption[] } {
  const privateAllowedDays = privateDayNames.filter(d => WEEKDAYS.includes(d));
  // courseDays = all days NOT in private (informational)
  const courseDays = WEEKDAYS.filter(d => !privateAllowedDays.includes(d));

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
  const { data } = await supabase
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
 * Fetch admin-configured private class days from app_settings.
 * Falls back to auto-computing from non-group days if not configured.
 */
async function fetchPrivateDays(): Promise<string[]> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "private_class_days")
    .maybeSingle();

  if (data?.value) {
    try {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }

  // Fallback: auto-compute from non-group days
  const { data: groupSlots } = await supabase
    .from("schedule_packages")
    .select("day_of_week")
    .eq("is_active", true)
    .neq("course_type", "private");

  const courseDayIndices = new Set((groupSlots as any[] || []).map((s: any) => s.day_of_week));
  return WEEKDAYS.filter((_, i) => !courseDayIndices.has(i));
}

/**
 * Fetch private availability using admin-configured days and times.
 */
export async function fetchPrivateAvailability() {
  const [privateDays, timeOptions] = await Promise.all([
    fetchPrivateDays(),
    fetchPrivateTimeOptions(),
  ]);

  return computePrivateAvailability(privateDays, timeOptions);
}
