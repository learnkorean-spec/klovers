import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReferralStats() {
  return useQuery({
    queryKey: ["admin", "referral-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_conversions")
        .select("converted_at")
        .limit(5000);
      if (error) throw error;
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      return {
        total: (data ?? []).length,
        thisMonth: (data ?? []).filter((r) => new Date(r.converted_at) >= firstOfMonth).length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
