import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";

/**
 * "New traffic": who arrived recently and has NOT yet booked a trial.
 *
 * Old pending bookings sit in the session list; this answers a different
 * question — is fresh traffic coming in, and where does it stall? Read-only.
 * "Organic" means no utm_source on the lead.
 */

interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  source: string | null;
  utm_source: string | null;
  country: string | null;
  created_at: string;
}
interface BookingRow {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  class_language: string | null;
  created_at: string;
}

const WINDOWS = ["7", "14", "30"] as const;

const sourceLabel = (s: string | null) =>
  s === "signup" ? "Signed up"
  : s === "complete-profile" ? "Completed profile"
  : s === "trial-booking-authed" ? "Booked a trial"
  : s || "—";

const fmt = (v: string) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const NewTraffic = () => {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>("7");
  const since = useMemo(() => new Date(Date.now() - Number(days) * 86400000).toISOString(), [days]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "new-traffic", days],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [leadsRes, bookingsRes, allBookingsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, email, status, source, utm_source, country, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("trial_bookings")
          .select("id, name, email, status, class_language, created_at")
          .gte("created_at", since)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(500),
        // Everyone who already holds a live trial, whenever they booked.
        supabase.from("trial_bookings").select("email").neq("status", "cancelled").limit(5000),
      ]);
      if (leadsRes.error) throw leadsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (allBookingsRes.error) throw allBookingsRes.error;
      return {
        leads: (leadsRes.data ?? []) as LeadRow[],
        bookings: (bookingsRes.data ?? []) as BookingRow[],
        bookedEmails: new Set((allBookingsRes.data ?? []).map((b: { email: string | null }) => (b.email || "").toLowerCase())),
      };
    },
  });

  const view = useMemo(() => {
    if (!data) return null;
    const waiting = data.leads.filter(
      (l) => l.email && !data.bookedEmails.has(l.email.toLowerCase()) && l.status !== "enrolled",
    );
    const enrolled = data.leads.filter((l) => l.status === "enrolled");
    return { waiting, enrolled };
  }, [data]);

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            New traffic
            <span className="text-xs text-muted-foreground font-normal">
              {view
                ? `${data!.bookings.length} new trial booking${data!.bookings.length === 1 ? "" : "s"} · ${view.waiting.length} signed up, no trial yet · ${view.enrolled.length} enrolled`
                : ""}
            </span>
          </CardTitle>
          <Select value={days} onValueChange={(v) => setDays(v as (typeof WINDOWS)[number])}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => <SelectItem key={w} value={w}>Last {w} days</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 space-y-3">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

        {data && data.bookings.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1">New trial bookings</p>
            <div className="rounded-md border divide-y">
              {data.bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                  <span className="min-w-0">
                    <span className="font-medium block truncate">{b.name || "—"}</span>
                    <span className="text-muted-foreground block truncate">{b.email}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    {b.class_language && <Badge variant="outline" className="text-[10px]">{b.class_language}</Badge>}
                    {fmt(b.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view && (
          <div>
            <p className="text-xs font-medium mb-1">Signed up, no trial booked yet</p>
            {view.waiting.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nobody in this period.</p>
            ) : (
              <div className="rounded-md border divide-y">
                {view.waiting.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                    <span className="min-w-0">
                      <span className="font-medium block truncate">{l.name || "—"}</span>
                      <span className="text-muted-foreground block truncate">{l.email}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{l.utm_source ? l.utm_source : "organic"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{sourceLabel(l.source)}</Badge>
                      {l.country && <span>{l.country}</span>}
                      {fmt(l.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {data && data.bookings.length === 0 && (
          <p className="text-xs text-muted-foreground">No new trial bookings in the last {days} days.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NewTraffic;
