/**
 * /admin/email — the delivery record for every letter the system sends.
 *
 * A route of its own rather than a `?tab=` on AdminDashboard.tsx, for the same
 * reason as /admin/today and /admin/week: that file is ~1,900 lines and is not
 * edited from here, and this screen is opened after a send rather than from
 * inside another screen's workflow.
 *
 * The panel is EmailDeliveryPanel.tsx; this file only mounts it in the shell.
 */
import AdminShell from "@/components/admin/AdminShell";
import EmailDeliveryPanel from "@/components/admin/EmailDeliveryPanel";

const AdminEmail = () => (
  <AdminShell activeId="email">
    <div id="main-content">
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <EmailDeliveryPanel />
      </div>
    </div>
  </AdminShell>
);

export default AdminEmail;
