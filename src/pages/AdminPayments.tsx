/**
 * /admin/payments — who has paid and how many classes each student has left.
 *
 * A route of its own, like /admin/week and /admin/today, rather than a tab on
 * AdminDashboard. Re opens this from her phone, and AdminDashboard fires ~38
 * requests and ~120 resources before it shows anything; this page needs only
 * the seven queries PaymentsBoard makes. See components/admin/PaymentsBoard.tsx.
 */
import AdminShell from "@/components/admin/AdminShell";
import PaymentsBoard from "@/components/admin/PaymentsBoard";

const AdminPayments = () => (
  <AdminShell activeId="payments-board">
    <div id="main-content">
      <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-5 sm:py-8">
        <PaymentsBoard />
      </div>
    </div>
  </AdminShell>
);

export default AdminPayments;
