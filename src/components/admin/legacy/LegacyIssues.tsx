/**
 * Legacy Data -> Issues: the review queue. Admins resolve, ignore or reopen an
 * issue with a note; raw rows are never edited from here.
 */
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-utils";
import {
  legacyErrorMessage, useLegacyIssues, useSetIssueStatus,
  type LegacyIssue, type LegacyIssueStatus,
} from "@/hooks/admin/useLegacyData";
import {
  EmptyState, ErrorState, ISSUE_CATEGORY_LABEL, IssueStatusChip, LoadingRows, Pager, SourceLine,
} from "./legacyUi";

const LegacyIssues = () => {
  const { data, isLoading, error, refetch } = useLegacyIssues();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | LegacyIssueStatus>("open");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<{ issue: LegacyIssue; to: LegacyIssueStatus } | null>(null);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const i of data ?? []) if (i.status === "open") c.set(i.category, (c.get(i.category) ?? 0) + 1);
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((i) => (status === "all" || i.status === status)
      && (category === "all" || i.category === category)
      && (!needle || (i.student_label ?? "").toLowerCase().includes(needle) || i.problem.toLowerCase().includes(needle)));
  }, [data, q, category, status]);

  useEffect(() => { setPage(0); }, [q, category, status]);

  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if ((data ?? []).length === 0) return <EmptyState title="No issues" body="Issues are raised during import and appear here." />;

  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const visible = rows.slice(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or problem" className="pl-8" aria-label="Search issues" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-60" aria-label="Category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(ISSUE_CATEGORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}{counts.get(k) ? ` (${counts.get(k)} open)` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="md:w-36" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? <EmptyState title="Nothing matches these filters" /> : (
        <ul className="space-y-2">
          {visible.map((i) => (
            <li key={i.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <IssueStatusChip status={i.status} />
                <span className="font-semibold">{ISSUE_CATEGORY_LABEL[i.category] ?? i.category}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-semibold">{i.student_label ?? "No student"}</span>
                {(i.year || i.month_label) && (
                  <span className="text-muted-foreground">{[i.month_label, i.year].filter(Boolean).join(" ")}</span>
                )}
                <SourceLine file={i.source_file} sheet={i.source_sheet} row={i.source_row} />
              </div>
              <p className="mt-1.5">{i.problem}</p>
              {i.suggested_action && <p className="mt-1 text-muted-foreground">Suggested: {i.suggested_action}</p>}
              {i.resolution_note && <p className="mt-1 text-muted-foreground">Note: {i.resolution_note}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {i.status === "open" ? (
                  <>
                    <Button size="sm" onClick={() => setEditing({ issue: i, to: "resolved" })}>Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing({ issue: i, to: "ignored" })}>Ignore</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditing({ issue: i, to: "open" })}>Reopen</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pageCount={pageCount} total={rows.length} onPage={setPage} />

      <IssueStatusDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
};

const IssueStatusDialog = ({
  editing, onClose,
}: { editing: { issue: LegacyIssue; to: LegacyIssueStatus } | null; onClose: () => void }) => {
  const [note, setNote] = useState("");
  const setStatus = useSetIssueStatus();
  useEffect(() => { setNote(editing?.issue.resolution_note ?? ""); }, [editing]);

  const verb = editing?.to === "resolved" ? "Resolve" : editing?.to === "ignored" ? "Ignore" : "Reopen";
  const save = async () => {
    if (!editing) return;
    try {
      await setStatus.mutateAsync({ id: editing.issue.id, status: editing.to, note });
      toast({ title: `Issue ${editing.to === "open" ? "reopened" : editing.to}` });
      onClose();
    } catch (e) {
      toast({ title: "Could not update the issue", description: legacyErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!editing} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{verb} issue</DialogTitle>
          <DialogDescription>{editing?.issue.problem}</DialogDescription>
        </DialogHeader>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (what was decided and why)" aria-label="Resolution note" rows={3} />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={setStatus.isPending}>
            {setStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : verb}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegacyIssues;
