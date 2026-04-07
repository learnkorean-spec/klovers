import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function useScheduleWeekdays() {
  return useQuery({
    queryKey: ["admin", "schedule-weekdays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_options")
        .select("label, sort_order")
        .eq("category", "weekday")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      if (!data || data.length === 0) return DEFAULT_WEEKDAYS;
      return data.map((r) => r.label);
    },
    staleTime: 10 * 60 * 1000, // rarely changes
  });
}
