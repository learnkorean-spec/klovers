import { supabase } from "@/lib/supabase";

export interface TeacherAvailability {
  day_of_week: number;
  start_time: string;
  is_available: boolean;
}

export interface SchedulePackage {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  is_active: boolean;
}

export interface StudentPreferenceTrend {
  level: string;
  day_of_week: number;
  preferred_start_time: string;
  request_count: number;
}

export interface SuggestedPackage {
  level: string;
  day_of_week: number;
  start_time: string;
  studentCount: number;
  existsAlready: boolean;
}

/**
 * Get suggested schedule packages based on teacher availability
 * Compares teacher's available slots against existing packages and student preferences
 */
export async function getSuggestedPackages(
  teacherId: string,
  levels: string[]
): Promise<SuggestedPackage[]> {
  try {
    // Fetch teacher's available slots
    const { data: availableSlots, error: availError } = await supabase
      .from("teacher_availability")
      .select("day_of_week, start_time")
      .eq("teacher_id", teacherId)
      .eq("is_available", true);

    if (availError) throw availError;

    // Fetch existing schedule packages
    const { data: existingPackages, error: pkgError } = await supabase
      .from("schedule_packages")
      .select("id, level, day_of_week, start_time")
      .eq("is_active", true);

    if (pkgError) throw pkgError;

    // Fetch student preference trends
    const { data: trends, error: trendsError } = await supabase
      .rpc("get_student_preference_trends", {
        days_back: 30,
      });

    if (trendsError) {
      console.warn("Could not fetch preference trends:", trendsError);
    }

    // Build set of existing package combinations
    const existingSet = new Set(
      (existingPackages || []).map(
        (p) => `${p.level}|${p.day_of_week}|${p.start_time}`
      )
    );

    // Create map of preference counts
    const preferenceMap = new Map<string, number>();
    if (trends) {
      (trends as any[]).forEach((trend) => {
        const key = `${trend.level}|${trend.day_of_week}|${trend.preferred_start_time}`;
        preferenceMap.set(key, trend.request_count || 0);
      });
    }

    // Generate suggestions
    const suggestions: SuggestedPackage[] = [];

    (availableSlots || []).forEach((slot) => {
      levels.forEach((level) => {
        const key = `${level}|${slot.day_of_week}|${slot.start_time}`;
        const studentCount = preferenceMap.get(key) || 0;
        const existsAlready = existingSet.has(key);

        // Include all available slots (whether students requested them or not)
        suggestions.push({
          level,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          studentCount,
          existsAlready,
        });
      });
    });

    // Sort by student count (descending), then by day/time
    suggestions.sort((a, b) => {
      if (b.studentCount !== a.studentCount) {
        return b.studentCount - a.studentCount;
      }
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return a.start_time.localeCompare(b.start_time);
    });

    return suggestions;
  } catch (error) {
    console.error("Error getting suggested packages:", error);
    throw error;
  }
}

/**
 * Get student preference trends for the last N days
 * Groups by level, day_of_week, and preferred_start_time
 */
export async function getStudentPreferenceTrends(
  daysBack: number = 30
): Promise<StudentPreferenceTrend[]> {
  try {
    const { data, error } = await supabase
      .rpc("get_student_preference_trends", {
        days_back: daysBack,
      });

    if (error) throw error;

    // Convert to typed array and sort by count
    const trends = (data || []) as StudentPreferenceTrend[];
    return trends.sort((a, b) => b.request_count - a.request_count);
  } catch (error) {
    console.error("Error fetching preference trends:", error);
    return [];
  }
}

/**
 * Get available teacher times in a formatted, human-readable way
 */
export async function getAvailableTeacherTimes(
  teacherId: string
): Promise<{ day: number; dayName: string; time: string }[]> {
  try {
    const { data, error } = await supabase
      .from("teacher_availability")
      .select("day_of_week, start_time")
      .eq("teacher_id", teacherId)
      .eq("is_available", true)
      .order("day_of_week")
      .order("start_time");

    if (error) throw error;

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return (data || []).map((slot: any) => ({
      day: slot.day_of_week,
      dayName: dayNames[slot.day_of_week],
      time: slot.start_time,
    }));
  } catch (error) {
    console.error("Error fetching available times:", error);
    return [];
  }
}

/**
 * Format a suggestion for display
 */
export function formatSuggestion(suggestion: SuggestedPackage): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = dayNames[suggestion.day_of_week];

  if (suggestion.existsAlready) {
    return `${suggestion.level} - ${dayName} ${suggestion.start_time} (exists)`;
  } else if (suggestion.studentCount > 0) {
    return `${suggestion.level} - ${dayName} ${suggestion.start_time} (${suggestion.studentCount} students want this)`;
  } else {
    return `${suggestion.level} - ${dayName} ${suggestion.start_time} (no requests yet)`;
  }
}
