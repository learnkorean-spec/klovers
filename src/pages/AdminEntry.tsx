/**
 * What /admin resolves to.
 *
 * Bare /admin sends you to Today — level 0 of the navigation model in
 * AdminShell: the screen you land on every time, showing what needs a
 * decision rather than a table you have to interpret.
 *
 * /admin?tab=<anything> renders AdminDashboard, now inside AdminShell so the
 * sidebar and the Ctrl+K palette stay put when you click through from Today.
 * AdminDashboard itself is untouched: it still reads its screen from `?tab=`,
 * so every existing link, bookmark, email and in-app button behaves exactly as
 * before. Only the chrome around it is new.
 *
 * Deliberately a separate component instead of an edit to AdminDashboard.tsx
 * (1,872 lines) — the routing decision, and now the chrome decision, are
 * legible here in a file you can read in one sitting.
 *
 * /admin?tab=legacy is the one exception: Legacy Data (historical students
 * 2022-2025) is a self-contained screen with its own sub-tabs, so it renders
 * here inside the same shell instead of adding a fifth group to AdminDashboard.
 * Same URL shape, same sidebar, same ProtectedRoute in front of it.
 *
 * Known and left alone: AdminDashboard renders its own sticky header and its
 * own group pills, which now duplicate what the shell provides. Removing them
 * is an edit to that file and belongs in its own change.
 */
import { lazy, Suspense } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";

const AdminDashboard = lazy(() => import("./AdminDashboard"));
const LegacyDataPanel = lazy(() => import("@/components/admin/legacy/LegacyDataPanel"));

const DashboardLoader = () => (
  <div role="status" aria-label="Loading" className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const AdminEntry = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (!tab) {
    return <Navigate to="/admin/today" replace />;
  }

  // `?tab=` values are the same ids AdminShell's nav model uses, so this needs
  // no mapping — an unknown tab simply highlights nothing.
  return (
    <AdminShell activeId={tab}>
      <Suspense fallback={<DashboardLoader />}>
        {tab === "legacy" ? <LegacyDataPanel /> : <AdminDashboard />}
      </Suspense>
    </AdminShell>
  );
};

export default AdminEntry;
