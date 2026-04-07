import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OverviewRow } from "@/types/admin";

/**
 * Fetches the admin_student_overview view — the single source of truth for
 * student derived_status, sessions, enrollment linkage, etc.
 */
export function useStudentOverview() {
  return useQuery({
    queryKey: ["admin", "student-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_student_overview")
        .select("*")
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as OverviewRow[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Build a lookup map by email for lead status enrichment. */
export function buildOverviewByEmail(rows: OverviewRow[]): Record<string, OverviewRow> {
  const map: Record<string, OverviewRow> = {};
  for (const r of rows) {
    if (r.email) map[r.email.toLowerCase()] = r;
  }
  return map;
}
