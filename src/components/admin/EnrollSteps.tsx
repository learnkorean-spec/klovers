import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Where people stop on /enroll-now.
 *
 * EnrollNowPage logs step_1_viewed / step_2_viewed / step_4_viewed once per
 * visit (from 24 Nov 2026) and "checkout" when the order is placed. Counted
 * here as distinct visits, so each row is how many people got that far.
 */

const DAYS = 30;

const STEPS: { label: string; cta: string }[] = [
  { label: "1. Chose a plan (page opened)", cta: "step_1_viewed" },
  { label: "2. Schedule", cta: "step_2_viewed" },
  { label: "3. Pay & enrol", cta: "step_4_viewed" },
  { label: "Order placed", cta: "checkout" },
];

export default function EnrollSteps() {
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "enroll-steps", DAYS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("session_id, cta_label")
        .eq("source_type", "enroll")
        .in("cta_label", STEPS.map((s) => s.cta))
        .gte("created_at", since)
        .limit(5000);
      if (error) throw error;
      const sessions = new Map<string, Set<string>>();
      for (const r of (data ?? []) as { session_id: string; cta_label: string }[]) {
        const set = sessions.get(r.cta_label) ?? new Set<string>();
        set.add(r.session_id);
        sessions.set(r.cta_label, set);
      }
      return STEPS.map((s) => ({ ...s, n: sessions.get(s.cta)?.size ?? 0 }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const top = data?.[0]?.n ?? 0;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Enrolment steps (last {DAYS} days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : error ? (
          <p className="text-sm text-destructive">Could not load enrolment steps.</p>
        ) : (
          <>
            <ul className="space-y-1">
              {(data ?? []).map((s) => (
                <li key={s.cta} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.n} visit{s.n === 1 ? "" : "s"}
                    {top > 0 && s.cta !== STEPS[0].cta ? ` · ${Math.round((s.n / top) * 100)}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Steps are recorded from 24 Nov 2026, so earlier visits show only "Order placed".
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
