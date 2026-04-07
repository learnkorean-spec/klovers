import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enrollment } from "@/types/admin";
import type { ProfileEntry } from "./useProfiles";

interface UseEnrollmentsOptions {
  /** Profile map for enriching enrollments with name/email/level. */
  profileMap?: Record<string, ProfileEntry>;
}

/**
 * Fetches enrollments with optional profile enrichment.
 */
export function useEnrollments({ profileMap }: UseEnrollmentsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
    staleTime: 2 * 60 * 1000,
    select: (enrollments) => {
      if (!profileMap) return enrollments;
      return enrollments.map((e) => ({
        ...e,
        profiles: profileMap[e.user_id]
          ? { name: profileMap[e.user_id].name, email: profileMap[e.user_id].email, level: profileMap[e.user_id].level ?? undefined }
          : e.profiles,
      }));
    },
  });
}
