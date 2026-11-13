import * as TabsPrimitive from "@radix-ui/react-tabs";
import { CalendarDays, Compass, Home, TrendingUp, type LucideIcon } from "lucide-react";
import { useDashCopy, type CopyKey } from "@/components/student-dashboard/premium/copy";

/**
 * The student dashboard's four pages (13 Nov 2026).
 *
 * A new student told Re the dashboard was "complicated and crowded": it was
 * one long page with about twelve open blocks. It is now four short ones.
 * Today is the default and answers one question only: what do I do now?
 */
export const DASH_TABS = ["today", "classes", "progress", "explore"] as const;
export type DashTab = (typeof DASH_TABS)[number];

export const isDashTab = (v: string | null | undefined): v is DashTab =>
  !!v && (DASH_TABS as readonly string[]).includes(v);

const ITEMS: { value: DashTab; icon: LucideIcon; label: CopyKey }[] = [
  { value: "today", icon: Home, label: "tabToday" },
  { value: "classes", icon: CalendarDays, label: "tabClasses" },
  { value: "progress", icon: TrendingUp, label: "tabProgress" },
  { value: "explore", icon: Compass, label: "tabExplore" },
];

/**
 * Must be rendered inside the dashboard's Radix <Tabs> root.
 *
 * Sticks under the fixed site header (h-16) rather than to the bottom of the
 * phone screen on purpose: the bottom edge already belongs to the WhatsApp
 * bubble, the cookie notice and the install prompt (src/lib/bottomLayer.ts),
 * and a fourth thing pinned there would sit underneath them.
 */
export function DashboardTabBar() {
  const { c } = useDashCopy();
  return (
    <div className="sticky top-16 z-30 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <TabsPrimitive.List
        aria-label={c("tabsAria")}
        className="grid grid-cols-4 gap-1 rounded-2xl border border-foreground/10 bg-card p-1"
      >
        {ITEMS.map(({ value, icon: Icon, label }) => (
          <TabsPrimitive.Trigger
            key={value}
            value={value}
            data-track={`tab_${value}`}
            className="flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground data-[state=active]:bg-klovers-yellow data-[state=active]:text-charcoal sm:flex-row sm:gap-2 sm:text-sm"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{c(label)}</span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </div>
  );
}
