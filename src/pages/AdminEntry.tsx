/**
 * What /admin resolves to.
 *
 * Bare /admin sends you to Today — level 0 of the navigation model in
 * AdminShell: the screen you land on every time, showing what needs a
 * decision rather than a table you have to interpret.
 *
 * /admin?tab=<anything> still renders AdminDashboard unchanged. That is what
 * keeps this safe: every existing link, bookmark, email and in-app button
 * carries a tab, so none of them change behaviour. Only the bare URL moves.
 *
 * Deliberately a separate component instead of an edit to AdminDashboard.tsx
 * (1,871 lines) — the routing decision is legible here in a file you can read
 * in one sitting.
 */
import { lazy, Suspense } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

const AdminDashboard = lazy(() => import("./AdminDashboard"));

const DashboardLoader = () => (
  <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const AdminEntry = () => {
  const [searchParams] = useSearchParams();

  if (!searchParams.get("tab")) {
    return <Navigate to="/admin/today" replace />;
  }

  return (
    <Suspense fallback={<DashboardLoader />}>
      <AdminDashboard />
    </Suspense>
  );
};

export default AdminEntry;
