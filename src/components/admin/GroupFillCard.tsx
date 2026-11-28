import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { groupFill } from "@/lib/paymentsBoard";

/** Seats filled across groups that have started. 50 to 75% per group is a healthy range; below that a class time is running thin. */
export default function GroupFillCard() {
  const { data } = useQuery({
    queryKey: ["admin", "group-fill"],
    staleTime: 60_000,
    queryFn: async () => {
      const [g, m] = await Promise.all([
        supabase.from("pkg_groups").select("id, name, capacity, is_active, start_date"),
        supabase.from("pkg_group_members").select("group_id, member_status").eq("member_status", "active"),
      ]);
      if (g.error) throw g.error;
      if (m.error) throw m.error;
      return groupFill(
        (g.data ?? []) as Parameters<typeof groupFill>[0],
        (m.data ?? []) as Parameters<typeof groupFill>[1],
      );
    },
  });

  if (!data || data.length === 0) return null;
  const filled = data.reduce((a, r) => a + r.filled, 0);
  const cap = data.reduce((a, r) => a + r.capacity, 0);
  const pct = cap > 0 ? Math.round((filled / cap) * 100) : 0;

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold tracking-[0.04em] text-muted-foreground">GROUP FILL</span>
          <span className="text-3xl font-extrabold leading-none">{pct}%</span>
          <span className="text-sm text-muted-foreground">{filled} of {cap} seats</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {data.slice(0, 6).map((r) => (
            <li key={r.id} className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 truncate">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.filled}/{r.capacity}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="min-h-11 w-full sm:min-h-9">
          <Link to="/admin/payments">Open groups</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
