/**
 * /admin/exchange-reports — review Language Exchange reports.
 *
 * Built 5 Nov 2026, from a safety audit of /exchange (claude/
 * language-exchange-feature.md) that found exchange_reports had zero
 * admin UI: the only way to review a report or disable an abusive
 * profile was raw SQL. A dashboard nobody has is the same as not having
 * reports at all once the first real complaint comes in.
 *
 * Deliberately plain: a flat list, unreviewed first, two actions per
 * report (mark reviewed, toggle the reported profile's visibility).
 * No bulk actions -- a moderation queue is exactly the kind of screen
 * where a "do this to all of them" button is a liability, not a
 * convenience (see AdminTrials.tsx's own note on that).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { REPORT_REASONS } from "@/constants/languageExchange";

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reviewed: boolean;
}

interface ProfileLite {
  user_id: string;
  display_name: string;
  is_visible: boolean;
}

const reasonLabel = (key: string) => REPORT_REASONS.find((r) => r.key === key)?.en ?? key;

const AdminExchangeReportsPage = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<{ reportId: string; userId: string; name: string; nextVisible: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: reportRows, error } = await supabase
      .from("exchange_reports" as any)
      .select("*")
      .order("reviewed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Couldn't load reports", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows = (reportRows as unknown as ReportRow[]) ?? [];
    setReports(rows);

    const userIds = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_id]))];
    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("exchange_profiles" as any)
        .select("user_id, display_name, is_visible")
        .in("user_id", userIds);
      // The reports still render without this (ids instead of names), so say
      // what is missing rather than show nameless rows as if that were normal.
      if (profileError) {
        toast({ title: "Couldn't load the reporters' names", description: profileError.message, variant: "destructive" });
      }
      const map = new Map<string, ProfileLite>();
      ((profileRows as unknown as ProfileLite[]) ?? []).forEach((p) => map.set(p.user_id, p));
      setProfiles(map);
    } else {
      setProfiles(new Map());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleReports = useMemo(
    () => (showAll ? reports : reports.filter((r) => !r.reviewed)),
    [reports, showAll],
  );
  const unreviewedCount = useMemo(() => reports.filter((r) => !r.reviewed).length, [reports]);

  const setReviewed = async (reportId: string, reviewed: boolean) => {
    setBusyId(reportId);
    const { error } = await supabase
      .from("exchange_reports" as any)
      .update({ reviewed })
      .eq("id", reportId);
    setBusyId(null);
    if (error) {
      toast({ title: "Couldn't update report", description: error.message, variant: "destructive" });
      return;
    }
    setReports((rs) => rs.map((r) => (r.id === reportId ? { ...r, reviewed } : r)));
  };

  const confirmVisibilityChange = async () => {
    if (!disableTarget) return;
    const { reportId, userId, nextVisible } = disableTarget;
    setBusyId(reportId);
    const { error } = await supabase
      .from("exchange_profiles" as any)
      .update({ is_visible: nextVisible })
      .eq("user_id", userId);
    setBusyId(null);
    setDisableTarget(null);
    if (error) {
      toast({ title: "Couldn't update profile", description: error.message, variant: "destructive" });
      return;
    }
    setProfiles((ps) => {
      const next = new Map(ps);
      const existing = next.get(userId);
      if (existing) next.set(userId, { ...existing, is_visible: nextVisible });
      return next;
    });
    toast({
      title: nextVisible
        ? "Profile re-enabled in Language Exchange"
        : "Profile hidden from Language Exchange",
    });
  };

  return (
    <AdminShell activeId="exchange-reports">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Language Exchange reports
            </h1>
            <p className="text-sm text-muted-foreground">
              {unreviewedCount > 0
                ? `${unreviewedCount} unreviewed report${unreviewedCount === 1 ? "" : "s"}`
                : "No unreviewed reports"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show unreviewed only" : "Show all"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nothing to review here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleReports.map((r) => {
              const reporter = profiles.get(r.reporter_id);
              const reported = profiles.get(r.reported_id);
              const reportedVisible = reported?.is_visible ?? true;
              return (
                <Card key={r.id} className={r.reviewed ? "opacity-70" : undefined}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">{reporter?.display_name ?? "(deleted profile)"}</span>
                        <span className="text-muted-foreground"> reported </span>
                        <span className="font-semibold">{reported?.display_name ?? "(deleted profile)"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!reportedVisible && (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldOff className="h-3 w-3" /> Hidden from Exchange
                          </Badge>
                        )}
                        {r.reviewed && <Badge variant="secondary">Reviewed</Badge>}
                      </div>
                    </div>

                    <div className="text-sm">
                      <Badge variant="outline">{reasonLabel(r.reason)}</Badge>
                      {r.details && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{r.details}</p>}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={r.reviewed ? "outline" : "default"}
                        disabled={busyId === r.id}
                        onClick={() => setReviewed(r.id, !r.reviewed)}
                      >
                        {r.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                      </Button>
                      {reported && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() =>
                            setDisableTarget({
                              reportId: r.id,
                              userId: r.reported_id,
                              name: reported.display_name,
                              nextVisible: !reportedVisible,
                            })
                          }
                        >
                          {reportedVisible ? (
                            <><ShieldOff className="me-1.5 h-4 w-4" /> Hide from Exchange</>
                          ) : (
                            <><ShieldCheck className="me-1.5 h-4 w-4" /> Re-enable</>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableTarget?.nextVisible ? "Re-enable this profile?" : "Hide this profile from Language Exchange?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableTarget?.nextVisible
                ? `${disableTarget?.name} will be visible in Discover again and able to appear in new matches.`
                : `${disableTarget?.name} will disappear from Discover immediately and can't be matched with anyone new. Existing matches and chat history are not deleted. This only affects Language Exchange -- it does not touch their Klovers account or course enrollment.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVisibilityChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
};

export default AdminExchangeReportsPage;
