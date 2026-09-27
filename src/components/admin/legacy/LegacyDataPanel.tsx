/**
 * Legacy Data — historical Klovers students, sessions and money (2022-2025).
 *
 * Opened as /admin?tab=legacy inside the usual AdminShell. Admin only: the
 * route is behind ProtectedRoute and every table/view behind admin RLS.
 * Reads Supabase only; the workbook is parsed once, in the Import tab.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import LegacyOverview from "./LegacyOverview";
import LegacyStudents from "./LegacyStudents";
import { LegacyFinance, LegacySessions } from "./LegacyRecords";
import LegacyImport from "./LegacyImport";
import LegacyIssues from "./LegacyIssues";

const SECTIONS = [
  { id: "overview", label: "Overview", Comp: LegacyOverview },
  { id: "students", label: "Students", Comp: LegacyStudents },
  { id: "sessions", label: "Sessions", Comp: LegacySessions },
  { id: "finance", label: "Finance", Comp: LegacyFinance },
  { id: "import", label: "Import", Comp: LegacyImport },
  { id: "issues", label: "Issues", Comp: LegacyIssues },
] as const;

const LegacyDataPanel = () => {
  const [params, setParams] = useSearchParams();
  const current = params.get("section") ?? "overview";
  const active = SECTIONS.some((s) => s.id === current) ? current : "overview";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Legacy Data</h1>
        <p className="text-sm text-muted-foreground">
          Historical students and records, 2022–2025. Admin only. Session value is not revenue; payments are shown only where recorded.
        </p>
      </div>
      <Tabs
        value={active}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", "legacy");
          next.set("section", v);
          setParams(next, { replace: true });
        }}
      >
        <div className="overflow-x-auto">
          <TabsList>
            {SECTIONS.map((s) => <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>)}
          </TabsList>
        </div>
        {SECTIONS.map(({ id, Comp }) => (
          <TabsContent key={id} value={id} className="mt-4">
            <Comp />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LegacyDataPanel;
