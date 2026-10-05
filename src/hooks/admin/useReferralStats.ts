import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages } from "@/lib/fetchAllPages";

interface ReferrerBreakdown {
  userId: string;
  conversions: number;
  clicks: number;
  bonusPercent: number;
}

export function useReferralStats() {
  return useQuery({
    queryKey: ["admin", "referral-stats"],
    queryFn: async () => {
      const [convResult, clickResult] = await Promise.all([
        // `.limit(5000)` never worked: the server caps at 1000 and says nothing.
        fetchAllPages<{ referrer_user_id: string; converted_at: string }>((f, t) =>
          supabase.from("referral_conversions").select("id, referrer_user_id, converted_at").order("id").range(f, t) as never),
        fetchAllPages<{ referrer_user_id: string; clicked_at: string }>((f, t) =>
          supabase.from("referral_clicks").select("id, referrer_user_id, clicked_at").order("id").range(f, t) as never),
      ]);

      if (convResult.error) throw convResult.error;
      if (clickResult.error) throw clickResult.error;

      const conversions = convResult.data ?? [];
      const clicks = clickResult.data ?? [];

      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      // Aggregate per referrer
      const convByUser = new Map<string, number>();
      for (const r of conversions) {
        convByUser.set(r.referrer_user_id, (convByUser.get(r.referrer_user_id) ?? 0) + 1);
      }

      const clicksByUser = new Map<string, number>();
      for (const c of clicks) {
        clicksByUser.set(c.referrer_user_id, (clicksByUser.get(c.referrer_user_id) ?? 0) + 1);
      }

      const allUserIds = new Set([...convByUser.keys(), ...clicksByUser.keys()]);
      const perUser: ReferrerBreakdown[] = [];
      for (const uid of allUserIds) {
        const conv = convByUser.get(uid) ?? 0;
        const clk = clicksByUser.get(uid) ?? 0;
        const shareOnly = Math.max(0, clk - conv);
        const bonus = Math.min(conv * 5 + shareOnly * 2, 15);
        perUser.push({ userId: uid, conversions: conv, clicks: clk, bonusPercent: bonus });
      }
      perUser.sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks);

      return {
        total: conversions.length,
        thisMonth: conversions.filter((r) => new Date(r.converted_at) >= firstOfMonth).length,
        totalClicks: clicks.length,
        clicksThisMonth: clicks.filter((c) => new Date(c.clicked_at) >= firstOfMonth).length,
        perUser,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
