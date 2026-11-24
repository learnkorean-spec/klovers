import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Where trial bookings came from.
 *
 * Reads public.v_trial_booking_source: each booking matched to the visit that
 * made it (the session that logged trial_booked_confirmed), then to that
 * visit's first page and its referrer / utm tags. Bookings made before
 * 24 Nov 2026 are matched by time, so some older ones are missing; from then
 * on the booking id is logged with the event and every web booking matches.
 */

type Row = {
  booking_id: string;
  booked_at: string;
  status: string | null;
  attended: boolean | null;
  source: string | null;
  first_page_kind: string | null;
};

const DAYS = 90;

function tally(rows: Row[], key: (r: Row) => string) {
  const m = new Map<string, { n: number; came: number }>();
  for (const r of rows) {
    const k = key(r);
    const t = m.get(k) ?? { n: 0, came: 0 };
    t.n += 1;
    if (r.attended === true) t.came += 1;
    m.set(k, t);
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
}

export default function BookingSources() {
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "booking-sources", DAYS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_trial_booking_source" as never)
        .select("booking_id, booked_at, status, attended, source, first_page_kind")
        .gte("booked_at", since);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: totalBookings } = useQuery({
    queryKey: ["admin", "booking-sources-total", DAYS],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trial_bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = data ?? [];
  const bySource = tally(rows, (r) => r.source || "unknown");
  const byPage = tally(rows, (r) => r.first_page_kind || "unknown");

  const List = ({ title, items }: { title: string; items: [string, { n: number; came: number }][] }) => (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matched bookings yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map(([label, t]) => (
            <li key={label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{label}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">
                {t.n} booked{t.came ? ` · ${t.came} came` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Where trial bookings came from (last {DAYS} days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : error ? (
          <p className="text-sm text-destructive">Could not load booking sources.</p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <List title="Source" items={bySource} />
              <List title="First page of the visit" items={byPage} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {rows.length} of {totalBookings ?? "?"} bookings matched to a visit. "Came" counts only
              trials you marked as attended.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
