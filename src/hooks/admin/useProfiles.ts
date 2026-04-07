import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileEntry {
  user_id: string;
  name: string;
  email: string;
  level: string | null;
  country: string | null;
}

/**
 * Shared profiles query — cached and deduplicated across all admin components.
 * Returns a map keyed by user_id for O(1) lookups.
 */
export function useProfiles() {
  return useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, level, country")
        .limit(5000);
      if (error) throw error;
      const map: Record<string, ProfileEntry> = {};
      for (const p of data ?? []) {
        map[p.user_id] = p as ProfileEntry;
      }
      return map;
    },
    staleTime: 2 * 60 * 1000,
  });
}
