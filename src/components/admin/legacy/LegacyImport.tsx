/**
 * Legacy Data -> Import.
 *
 *   1. Choose the workbook. It is read ONCE, here in the browser; pages never
 *      parse Excel again after import.
 *   2. Set the calendar year for each month label (the sheets have no years;
 *      no date is invented).
 *   3. Dry run: fn_legacy_stage_batch stores the parsed rows in staging and
 *      returns a report. Nothing is written to the legacy tables yet.
 *   4. Approve: fn_legacy_commit_batch writes them. Every row has a
 *      deterministic key, so importing the same data twice adds nothing.
 *   5. A committed import can be rolled back; only its own rows are removed.
 */
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { readXlsx, sha256Hex, type Workbook } from "@/lib/legacy/xlsxReader";
import {
  SHEETS, findMonthLabels, monthNumber, normalizeLegacyWorkbook, type MonthYearMap,
} from "@/lib/legacy/normalizeLegacyWorkbook";
import {
  legacyErrorMessage, useCommitBatch, useLegacyBatches, useRollbackBatch, useStageBatch,
  type LegacyBatch,
} from "@/hooks/admin/useLegacyData";
import { ErrorState, ISSUE_CATEGORY_LABEL, LoadingRows, egp } from "./legacyUi";

/** Re, 28 Sep 2026: the months in the detailed sheets belong to 2024. Editable per month. */
const DEFAULT_YEAR = 2024;
const YEAR_CHOICES = [2022, 2023, 2024, 2025];

type Loaded = { fileName: string; sha: string; wb: Workbook; months: string[] };

const REPORT_LINES: [string, string][] = [
  ["students_detected", "Students detected"],
  ["existing_legacy_students", "Already imported (skipped)"],
  ["new_legacy_students", "New legacy students"],
  ["existing_students_matched", "Same name as a registered account / current student (review only)"],
  ["ambiguous_students", "Ambiguous or possible duplicate students"],
  ["yearly_aggregates", "Yearly totals"],
  ["master_check_rows", "Master check rows (not counted)"],
  ["monthly_records", "Monthly records"],
  ["excluded_rows", "Excluded rows (spreadsheet totals)"],
  ["explicit_prices", "Rows with a written price"],
  ["fallback_prices", "Rows using the 50 EGP default"],
  ["payment_rows", "Rows with a recorded payment"],
  ["unresolved_records", "Unresolved records (issues)"],
  ["duplicates_merged_in_file", "Duplicates merged inside the file"],
  ["duplicates_already_in_db", "Duplicates prevented (already in the database)"],
];

const LegacyImport = () => {
  const batches = useLegacyBatches();
  const stage = useStageBatch();
  const commit = useCommitBatch();
  const rollback = useRollbackBatch();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reading, setReading] = useState(false);
  const [yearMap, setYearMap] = useState<MonthYearMap>({});
  const [confirmCommit, setConfirmCommit] = useState<LegacyBatch | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<LegacyBatch | null>(null);

  const staged = useMemo(() => (batches.data ?? []).find((b) => b.status === "staged") ?? null, [batches.data]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      const buf = await file.arrayBuffer();
      const [wb, sha] = await Promise.all([readXlsx(buf), sha256Hex(buf)]);
      if (!wb[SHEETS.master]) throw new Error(`This workbook has no "${SHEETS.master}" sheet.`);
      const months = findMonthLabels(wb);
      setYearMap(Object.fromEntries(months.map((m) => [m, DEFAULT_YEAR])));
      setLoaded({ fileName: file.name, sha, wb, months });
    } catch (e) {
      setLoaded(null);
      toast({ title: "Could not read the workbook", description: legacyErrorMessage(e), variant: "destructive" });
    } finally {
      setReading(false);
    }
  };

  const runDryRun = async () => {
    if (!loaded) return;
    try {
      const payload = normalizeLegacyWorkbook(loaded.wb, yearMap);
      const report = await stage.mutateAsync({ sourceFile: loaded.fileName, sha256: loaded.sha, monthYearMap: yearMap, payload });
      if (report.already_committed) {
        toast({ title: "Already imported", description: "This exact file was imported before. Nothing was staged." });
      } else {
        toast({ title: "Dry run ready", description: "Review the report below before approving." });
      }
      setLoaded(null);
    } catch (e) {
      toast({ title: "Dry run failed", description: legacyErrorMessage(e), variant: "destructive" });
    }
  };

  const doCommit = async () => {
    if (!confirmCommit) return;
    try {
      const r = await commit.mutateAsync(confirmCommit.id);
      toast({ title: "Import committed", description: `${r.students_inserted ?? 0} students, ${r.monthly_inserted ?? 0} monthly records, ${r.aggregates_inserted ?? 0} yearly totals.` });
    } catch (e) {
      toast({ title: "Import failed", description: legacyErrorMessage(e), variant: "destructive" });
    } finally {
      setConfirmCommit(null);
    }
  };

  const doRollback = async () => {
    if (!confirmRollback) return;
    try {
      await rollback.mutateAsync({ batchId: confirmRollback.id });
      toast({ title: confirmRollback.status === "staged" ? "Dry run discarded" : "Import rolled back" });
    } catch (e) {
      toast({ title: "Could not roll back", description: legacyErrorMessage(e), variant: "destructive" });
    } finally {
      setConfirmRollback(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-bold">1. Choose the workbook</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor="legacy-file" className="sr-only">Legacy workbook</Label>
          <Input id="legacy-file" type="file" accept=".xlsx" className="sm:max-w-sm" onChange={(e) => onFile(e.target.files?.[0])} />
          {reading && <Loader2 className="h-4 w-4 animate-spin" aria-label="Reading" />}
        </div>
        <p className="text-xs text-muted-foreground">
          The file is read in this browser only and is not uploaded. Only the parsed rows are sent for the dry run.
        </p>

        {loaded && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold">{loaded.fileName}</span> · sheets: {Object.keys(loaded.wb).join(", ")}
            </p>
            <div>
              <h3 className="font-bold">2. Calendar year for each month</h3>
              <p className="text-xs text-muted-foreground">The sheets name months without years. Choose the year each month belongs to.</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {loaded.months.map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="w-20 text-sm capitalize">{m}</span>
                    <Select value={String(yearMap[m] ?? DEFAULT_YEAR)} onValueChange={(v) => setYearMap((prev) => ({ ...prev, [m]: Number(v) }))}>
                      <SelectTrigger className="h-8" aria-label={`Year for ${m}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {YEAR_CHOICES.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {loaded.months.length === 0 && <p className="text-sm text-muted-foreground">No month labels found.</p>}
              </div>
            </div>
            <Button onClick={runDryRun} disabled={stage.isPending}>
              {stage.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "3. Run dry run"}
            </Button>
          </div>
        )}
      </section>

      {batches.isLoading ? <LoadingRows rows={3} /> : batches.error ? (
        <ErrorState error={batches.error} onRetry={() => batches.refetch()} />
      ) : (
        <>
          {staged && (
            <section className="space-y-3 rounded-lg border-2 border-klovers-yellow p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">4. Dry run waiting for approval</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmRollback(staged)}>Discard</Button>
                  <Button size="sm" onClick={() => setConfirmCommit(staged)}>Approve and import</Button>
                </div>
              </div>
              <DryRunReport batch={staged} />
            </section>
          )}

          <section className="space-y-2">
            <h3 className="font-bold">Import history</h3>
            {(batches.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No imports yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead><TableHead>Status</TableHead><TableHead>Staged</TableHead>
                      <TableHead className="hidden md:table-cell">Result</TableHead><TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(batches.data ?? []).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="max-w-[14rem] truncate">{b.source_file}</TableCell>
                        <TableCell className="capitalize">{b.status.replace("_", " ")}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(b.created_at).toLocaleString()}</TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          {b.commit_result ? `${b.commit_result.students_inserted ?? 0} students · ${b.commit_result.monthly_inserted ?? 0} monthly · ${b.commit_result.aggregates_inserted ?? 0} yearly · ${b.commit_result.issues_inserted ?? 0} issues` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status === "committed" && (
                            <Button variant="outline" size="sm" onClick={() => setConfirmRollback(b)}>Roll back</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}

      <AlertDialog open={!!confirmCommit} onOpenChange={(o) => { if (!o) setConfirmCommit(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this data?</AlertDialogTitle>
            <AlertDialogDescription>
              Writes the staged students, records and issues to the Legacy Data tables. No accounts are created, no emails are
              sent, and current students, attendance and payments are not touched. Rows already imported are skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doCommit} disabled={commit.isPending}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRollback} onOpenChange={(o) => { if (!o) setConfirmRollback(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmRollback?.status === "staged" ? "Discard this dry run?" : "Roll back this import?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRollback?.status === "staged"
                ? "The staged rows are removed. Nothing had been imported."
                : "Removes only the rows this import created. Refused while any of its students is linked to an account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doRollback} disabled={rollback.isPending}>
              {confirmRollback?.status === "staged" ? "Discard" : "Roll back"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const DryRunReport = ({ batch }: { batch: LegacyBatch }) => {
  const s = batch.summary as Record<string, unknown>;
  const byYear = (s.totals_by_year as { year: number | null; students: number; sessions: number; value: number; recorded_paid: number | null }[]) ?? [];
  const byCat = (s.issues_by_category as Record<string, number>) ?? {};
  const map = batch.month_year_map ?? {};
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        {REPORT_LINES.map(([k, lbl]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{lbl}</dt>
            <dd className="text-right font-semibold tabular-nums">{String(s[k] ?? 0)}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead><TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Sessions</TableHead><TableHead className="text-right">Session value</TableHead>
                <TableHead className="text-right">Recorded paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byYear.map((y) => (
                <TableRow key={String(y.year)}>
                  <TableCell>{y.year ?? "Not set"}</TableCell>
                  <TableCell className="text-right tabular-nums">{y.students}</TableCell>
                  <TableCell className="text-right tabular-nums">{y.sessions}</TableCell>
                  <TableCell className="text-right tabular-nums">{egp(Number(y.value))}</TableCell>
                  <TableCell className="text-right tabular-nums">{egp(y.recorded_paid === null ? null : Number(y.recorded_paid))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Issues: {Object.entries(byCat).map(([k, n]) => `${ISSUE_CATEGORY_LABEL[k] ?? k} ${n}`).join(" · ") || "none"}
        </p>
        <p className="text-xs text-muted-foreground">
          Months: {Object.entries(map)
            .sort(([a], [b]) => (monthNumber(a) ?? 13) - (monthNumber(b) ?? 13))
            .map(([m, y]) => `${m} ${y}`).join(", ") || "—"}
        </p>
      </div>
    </div>
  );
};

export default LegacyImport;
