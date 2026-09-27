/**
 * After a dashboard tile opens a `?tab=` screen, bring that screen into view.
 *
 * The KPI strip and the funnel sit at the top of /admin and the tab content
 * starts well below them, so a click changed the tab and the page looked like
 * nothing had happened. `admin-tabs-root` is the id on the <Tabs> root in
 * AdminDashboard.tsx. Screens rendered outside it (Legacy Data is drawn by
 * AdminEntry) have no such element, and this does nothing for them.
 */
export function scrollToAdminTabs(): void {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    document.getElementById("admin-tabs-root")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
