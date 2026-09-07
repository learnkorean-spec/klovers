/**
 * /admin/week — the teaching week on one screen.
 *
 * The timetable itself is WeekTimetable.tsx and already rendered as a sub-tab
 * of Trials. This route exists because it was not findable there: the week is
 * checked before a lesson is moved, a trial is added, or an invitation goes
 * out, and none of those start from the Trials tab. It is the same component,
 * mounted where it is looked for.
 *
 * A route of its own rather than a 27th `?tab=` on AdminDashboard.tsx: the
 * timetable is not one of that file's screens, and that file is 1,872 lines
 * and is not edited from here. Same shape as /admin/today, which was added
 * the same way and for the same reason.
 */
import AdminShell from "@/components/admin/AdminShell";
import WeekTimetable from "@/components/admin/trial/WeekTimetable";

const AdminWeek = () => (
  <AdminShell activeId="week">
    <main id="main-content">
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <WeekTimetable />
      </div>
    </main>
  </AdminShell>
);

export default AdminWeek;
