import { useState, useEffect, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, XCircle, AlertTriangle, Info, Search, Download,
  RefreshCw, Loader2, Filter, ChevronRight, ShieldCheck, ShieldAlert, ShieldX,
} from "lucide-react";
import { fetchEnrollmentChecklists, type EnrollmentChecklist as ChecklistData, type ChecklistItem, type OverallState } from "@/lib/checklistEngine";
import { toast } from "@/hooks/use-toast";

/* ─── State badge helper ─── */
const STATE_CONFIG: Record<OverallState, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SUCCESS: { label: "Success", icon: <ShieldCheck className="h-3 w-3" />, variant: "default" },
  NEEDS_REVIEW: { label: "Review", icon: <ShieldAlert className="h-3 w-3" />, variant: "secondary" },
  BLOCKED: { label: "Blocked", icon: <ShieldX className="h-3 w-3" />, variant: "destructive" },
};

const statusIcon = (status: ChecklistItem["status"]) => {
  switch (status) {
    case "PASS": return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
    case "WARN": return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    case "BLOCKER": return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "INFO": return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
};

const ACTION_LABELS: Record<string, string> = {
  approve_payment: "Mark Payment Approved",
  send_email: "Send Confirmation Email",
  update_preferences: "Update Preferences",
  fix_timezone: "Fix Timezone",
  assign_slot: "Assign Slot",
};

/* ─── Side panel for one student ─── */
function ChecklistPanel({ data, open, onClose, onAction }: {
  data: ChecklistData | null;
  open: boolean;
  onClose: () => void;
  onAction: (enrollmentId: string, action: string) => void;
}) {
  if (!data) return null;
  const cfg = STATE_CONFIG[data.overall_state];

  const grouped = {
    blockers: data.items.filter(i => i.status === "BLOCKER"),
    warnings: data.items.filter(i => i.status === "WARN"),
    passed: data.items.filter(i => i.status === "PASS"),
    info: data.items.filter(i => i.status === "INFO"),
  };

  const renderItems = (items: ChecklistItem[]) => (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
          {statusIcon(item.status)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.details}</p>
          </div>
          {item.action && item.status !== "PASS" && (
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
              onClick={() => onAction(data.enrollment_id, item.action!)}>
              {ACTION_LABELS[item.action] || item.action}
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Student Checklist
            <Badge variant={cfg.variant} className="text-xs gap-1">{cfg.icon} {cfg.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">{data.student_name}</p>
          <p className="text-xs text-muted-foreground">{data.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] capitalize">{data.plan_type}</Badge>
            {data.level && <Badge variant="outline" className="text-[10px]">{data.level}</Badge>}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {grouped.blockers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-destructive uppercase mb-2 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Blockers ({grouped.blockers.length})
              </h4>
              {renderItems(grouped.blockers)}
            </div>
          )}
          {grouped.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-600 uppercase mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Warnings ({grouped.warnings.length})
              </h4>
              {renderItems(grouped.warnings)}
            </div>
          )}
          {grouped.passed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passed ({grouped.passed.length})
              </h4>
              {renderItems(grouped.passed)}
            </div>
          )}
          {grouped.info.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Info ({grouped.info.length})
              </h4>
              {renderItems(grouped.info)}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Checklist badge for table rows ─── */
export function ChecklistBadge({ data, onClick }: { data: ChecklistData; onClick: () => void }) {
  const cfg = STATE_CONFIG[data.overall_state];
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
      <Badge variant={cfg.variant} className="text-[10px] gap-1 px-2 py-0.5">
        {cfg.icon} {cfg.label}
      </Badge>
      {(data.blockers_count > 0 || data.warnings_count > 0) && (
        <span className="text-[10px] text-muted-foreground">
          {data.blockers_count > 0 && <span className="text-destructive">{data.blockers_count}B</span>}
          {data.blockers_count > 0 && data.warnings_count > 0 && " "}
          {data.warnings_count > 0 && <span className="text-yellow-600">{data.warnings_count}W</span>}
        </span>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

/* ─── Main component ─── */
export default function EnrollmentChecklistManager({ onAction }: {
  onAction: (enrollmentId: string, action: string) => void;
}) {
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<OverallState | "ALL">("ALL");
  const [missingFilter, setMissingFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEnrollmentChecklists();
      setChecklists(data);
    } catch (err: any) {
      toast({ title: "Error loading checklists", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = checklists;
    const q = search.toLowerCase();
    if (q) list = list.filter(c => c.student_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    if (stateFilter !== "ALL") list = list.filter(c => c.overall_state === stateFilter);
    if (missingFilter !== "all") {
      list = list.filter(c => c.items.some(i => i.key === missingFilter && i.status !== "PASS"));
    }
    return list;
  }, [checklists, search, stateFilter, missingFilter]);

  const counts = useMemo(() => ({
    total: checklists.length,
    blocked: checklists.filter(c => c.overall_state === "BLOCKED").length,
    review: checklists.filter(c => c.overall_state === "NEEDS_REVIEW").length,
    success: checklists.filter(c => c.overall_state === "SUCCESS").length,
  }), [checklists]);

  const exportCSV = () => {
    const rows = filtered.map(c => ({
      Name: c.student_name,
      Email: c.email,
      Plan: c.plan_type,
      Level: c.level,
      State: c.overall_state,
      Blockers: c.blockers_count,
      Warnings: c.warnings_count,
      "Blocker Details": c.items.filter(i => i.status === "BLOCKER").map(i => i.label).join("; "),
      "Warning Details": c.items.filter(i => i.status === "WARN").map(i => i.label).join("; "),
    }));
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String((r as any)[k]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enrollment-checklist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = selectedId ? checklists.find(c => c.enrollment_id === selectedId) || null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading checklists…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: counts.total, color: "text-foreground" },
          { label: "Blocked", count: counts.blocked, color: "text-destructive" },
          { label: "Review", count: counts.review, color: "text-yellow-600" },
          { label: "Success", count: counts.success, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 text-xs pl-7 w-44" />
        </div>
        <Select value={stateFilter} onValueChange={v => setStateFilter(v as any)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <Filter className="h-3 w-3 mr-1" /> <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All States</SelectItem>
            <SelectItem value="BLOCKED">Blocked only</SelectItem>
            <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missingFilter} onValueChange={setMissingFilter}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Missing…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="receipt_uploaded">Missing Receipt</SelectItem>
            <SelectItem value="preferred_days">Missing Preferences</SelectItem>
            <SelectItem value="slot_assigned">Missing Slot</SelectItem>
            <SelectItem value="confirmation_email">Email Not Sent</SelectItem>
            <SelectItem value="no_duplicate_profiles">Duplicates</SelectItem>
            <SelectItem value="timezone">Missing Timezone</SelectItem>
            <SelectItem value="payment_approved">Payment Not Approved</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No enrollments match filters.</p>
        )}
        {filtered.map(c => {
          const cfg = STATE_CONFIG[c.overall_state];
          return (
            <Card key={c.enrollment_id} className={`cursor-pointer hover:border-primary/40 transition-colors ${
              c.overall_state === "BLOCKED" ? "border-destructive/30" : c.overall_state === "NEEDS_REVIEW" ? "border-yellow-500/30" : ""
            }`} onClick={() => setSelectedId(c.enrollment_id)}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{c.student_name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{c.plan_type}</Badge>
                    {c.level && <Badge variant="outline" className="text-[10px] shrink-0">{c.level}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.blockers_count > 0 && (
                    <span className="text-xs text-destructive font-medium">{c.blockers_count} blocker{c.blockers_count > 1 ? "s" : ""}</span>
                  )}
                  {c.warnings_count > 0 && (
                    <span className="text-xs text-yellow-600 font-medium">{c.warnings_count} warning{c.warnings_count > 1 ? "s" : ""}</span>
                  )}
                  <Badge variant={cfg.variant} className="text-[10px] gap-1">{cfg.icon} {cfg.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Side panel */}
      <ChecklistPanel data={selected} open={!!selectedId} onClose={() => setSelectedId(null)} onAction={onAction} />
    </div>
  );
}
