/**
 * After a dashboard tile opens a `?tab=` screen, bring the thing it counted
 * into view.
 *
 * The KPI strip and the funnel sit at the top of /admin and the tab content
 * starts well below them. Scrolling to the top of the tab was not enough
 * either: Enrollments opens with the "My ongoing students" strip, so the
 * pending enrollment the tile counted was still off-screen and the click
 * looked like it went nowhere.
 *
 * `focus` names a `data-admin-focus="…"` marker on the list itself (the
 * enrollments list carries `enrollments`). The new tab mounts a frame or two
 * after the link is followed, so this looks for the marker for up to ~1.5 s,
 * then falls back to the top of the tab area (`admin-tabs-root`, the <Tabs>
 * root in AdminDashboard.tsx). Screens drawn outside it (Legacy Data is
 * rendered by AdminEntry) have neither, and this does nothing for them.
 */
export function scrollToAdminTabs(focus?: string): void {
  if (typeof window === "undefined") return;
  const selector = focus ? `[data-admin-focus="${focus}"]` : null;
  let frames = 0;
  const tick = () => {
    const target =
      (selector && document.querySelector<HTMLElement>(selector)) ||
      (!selector || frames >= 90 ? document.getElementById("admin-tabs-root") : null);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    frames += 1;
    if (frames <= 90) window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}
