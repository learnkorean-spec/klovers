import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { loadBoard } from "@/components/admin/PaymentsBoard";
import { renewalsSoon } from "@/lib/paymentsBoard";

const MAX_ROWS = 6;

/**
 * Who needs to buy another bundle soon: paid students with one class left or
 * none, read from the same board the payments screen shows so the two never
 * disagree. Also surfaces "level ready" alerts, written when a group finishes
 * its level and no next-level group has a free seat.
 */
export default function RenewalsSoon() {
  const board = useQuery({ queryKey: ["admin", "payments-board"], queryFn: loadBoard, staleTime: 30_000 });
  const ready = useQuery({
    queryKey: ["admin", "level-ready-alerts"],
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("type", "level_ready")
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (board.isLoading) return null;
  if (board.error || !board.data) return null;
  const rows = renewalsSoon(board.data);
  const levelReady = ready.data ?? 0;
  if (rows.length === 0 && levelReady === 0) return null;

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold tracking-[0.04em] text-muted-foreground">RENEWALS</span>
          <span className="text-3xl font-extrabold leading-none">{rows.length}</span>
          <span className="text-sm text-muted-foreground">renew soon</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {rows.slice(0, MAX_ROWS).map((r) => (
            <li key={r.key} className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 truncate font-medium">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {r.left <= 0 ? "no classes left" : "1 class left"} · {r.where}
              </span>
            </li>
          ))}
        </ul>
        {rows.length > MAX_ROWS && (
          <p className="text-xs text-muted-foreground">+{rows.length - MAX_ROWS} more</p>
        )}
        {levelReady > 0 && (
          <p role="note" className="rounded-md bg-muted/60 px-3 py-2 text-sm">
            {levelReady} group finished a level and has no next group with room. Open a class time.
          </p>
        )}
        <Button asChild variant="outline" className="min-h-11 w-full sm:min-h-9">
          <Link to="/admin/payments">Open payments</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
