import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trialConversion } from "@/lib/paymentsBoard";

/** Free-trial attendees who went on to pay. Trials without an account are not counted, so the true rate is at least this. */
export default function TrialConversionCard() {
  const { data } = useQuery({
    queryKey: ["admin", "trial-conversion"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [t, e] = await Promise.all([
        supabase.from("trial_bookings").select("user_id, status").eq("status", "confirmed_attendance"),
        supabase.from("enrollments").select("user_id").eq("payment_status", "PAID").is("deleted_at", null),
      ]);
      if (t.error) throw t.error;
      if (e.error) throw e.error;
      const paid = new Set((e.data ?? []).map((r) => r.user_id as string).filter(Boolean));
      return trialConversion((t.data ?? []) as { user_id: string | null; status: string }[], paid);
    },
  });

  if (!data || data.attended === 0) return null;

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold tracking-[0.04em] text-muted-foreground">TRIAL TO PAID</span>
          <span className="text-3xl font-extrabold leading-none">{data.percent}%</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.paid} of {data.attended} people who attended a free trial now have a paid enrollment.
        </p>
        <Button asChild variant="outline" className="min-h-11 w-full sm:min-h-9">
          <Link to="/admin/trials">Open trials</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
