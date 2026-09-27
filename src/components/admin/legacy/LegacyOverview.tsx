/**
 * Legacy Data -> Overview: headline cards and the per-year breakdown.
 *
 * "Historical Session Value" is counted sessions x price. It is NOT revenue and
 * NOT cash received; "Recorded Payments" is only what the old sheets record as
 * paid. The two sit side by side and are labelled so they are never confused.
 */
import { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LEGACY_YEARS, useLegacyIssues, useLegacyStudents, useLegacyYearSummary,
} from "@/hooks/admin/useLegacyData";
import { EmptyState, ErrorState, LoadingRows, StatCard, egp } from "./legacyUi";

const LegacyOverview = () => {
  const students = useLegacyStudents();
  const years = useLegacyYearSummary();
  const issues = useLegacyIssues();

  const totals = useMemo(() => {
    const s = students.data ?? [];
    const y = years.data ?? [];
    const paidRows = y.filter((r) => r.recorded_paid !== null);
    return {
      students: s.length,
      sessions: y.reduce((a, r) => a + r.counted_sessions, 0),
      value: y.reduce((a, r) => a + r.historical_value, 0),
      paid: paidRows.length ? paidRows.reduce((a, r) => a + (r.recorded_paid ?? 0), 0) : null,
      linked: s.filter((r) => r.auth_user_id).length,
      unlinked: s.filter((r) => !r.auth_user_id).length,
      open: (issues.data ?? []).filter((i) => i.status === "open").length,
    };
  }, [students.data, years.data, issues.data]);

  if (students.isLoading || years.isLoading || issues.isLoading) return <LoadingRows rows={8} />;
  const err = students.error || years.error || issues.error;
  if (err) {
    return <ErrorState error={err} onRetry={() => { students.refetch(); years.refetch(); issues.refetch(); }} />;
  }
  if (totals.students === 0) {
    return <EmptyState title="No legacy data imported yet" body="Use the Import tab to stage the legacy workbook for review." />;
  }

  const byYear = new Map((years.data ?? []).map((r) => [r.year, r]));
  const unassigned = byYear.get(null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Legacy Students" value={totals.students} />
        <StatCard label="Counted Sessions" value={totals.sessions} />
        <StatCard label="Historical Session Value" value={egp(totals.value)} hint="Sessions × price, not cash" />
        <StatCard label="Recorded Payments" value={egp(totals.paid)} hint="From payment columns only" />
        <StatCard label="Unlinked Students" value={totals.unlinked} />
        <StatCard label="Linked Accounts" value={totals.linked} />
        <StatCard label="Unresolved Records" value={totals.open} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Unique students</TableHead>
              <TableHead className="text-right">Counted sessions</TableHead>
              <TableHead className="text-right">Historical session value</TableHead>
              <TableHead className="text-right">Recorded payments</TableHead>
              <TableHead className="text-right">Late (not charged)</TableHead>
              <TableHead className="text-right">Unresolved records</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LEGACY_YEARS.map((y) => {
              const r = byYear.get(y);
              return (
                <TableRow key={y}>
                  <TableCell className="font-semibold">{y}</TableCell>
                  <TableCell className="text-right tabular-nums">{r?.unique_students ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{r?.counted_sessions ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{egp(r?.historical_value ?? 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r ? egp(r.recorded_paid) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r?.late_unresolved ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{r?.unresolved_records ?? 0}</TableCell>
                </TableRow>
              );
            })}
            {unassigned && (
              <TableRow>
                <TableCell className="font-semibold">Year not set</TableCell>
                <TableCell className="text-right tabular-nums">{unassigned.unique_students}</TableCell>
                <TableCell className="text-right tabular-nums">{unassigned.counted_sessions}</TableCell>
                <TableCell className="text-right tabular-nums">{egp(unassigned.historical_value)}</TableCell>
                <TableCell className="text-right tabular-nums">{egp(unassigned.recorded_paid)}</TableCell>
                <TableCell className="text-right tabular-nums">{unassigned.late_unresolved}</TableCell>
                <TableCell className="text-right tabular-nums">{unassigned.unresolved_records}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Where no written price exists, a session is valued at 50 EGP (4 sessions = 200 EGP). Recorded payments are shown
        only where the old sheets have a payment column; “—” means no payment data, not zero.
      </p>
    </div>
  );
};

export default LegacyOverview;
