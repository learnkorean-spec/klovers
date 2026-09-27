/**
 * Admin chrome: sidebar, top bar, and a command palette.
 *
 * The nav model below is the whole point of the file. It orders screens by
 * HOW OFTEN THEY ARE OPENED, not by subject:
 *
 *   primary   — opened daily, always visible
 *   secondary — opened weekly, visible but quieter
 *   folded    — occasional, collapsed behind a disclosure
 *
 * Everything, including screens that are in no group at all, is reachable
 * from the palette (Ctrl/Cmd+K). That is what makes it safe to fold the rest
 * away: depth only costs something when search is unreliable.
 *
 * THIS LIST IS THE ONLY WAY INTO MOST SCREENS. AdminDashboard renders a
 * <TabsContent> for a tab whether or not anything links to it, so a screen
 * missing from here is not broken — it is invisible, which is worse, because
 * nothing fails and nobody notices. Campaigns, Books and Trial books sat that
 * way until #266. When a tab is added there, add it here in the same change.
 *
 * Screens still live in AdminDashboard.tsx and are selected by `?tab=`, so
 * every link here is a deep link into it. Nothing in that file changes —
 * including the group-pill row it draws for itself, which shell-dedupe.css
 * suppresses from the outside. See that file for why it is still CSS.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays, Users, GraduationCap, Bell, Search, LayoutDashboard,
  ClipboardCheck, Clock, ChevronDown, FileText, Settings, LogOut, RefreshCw,
  CalendarRange, History, Sun, Moon, Mail, Archive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useUnreadAlerts } from "@/hooks/admin/useUnreadAlerts";
import { useTheme } from "@/contexts/ThemeContext";
import "./shell-dedupe.css";

export type NavItem = {
  /** `?tab=` value on /admin, or an absolute path of its own. */
  id: string;
  label: string;
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Shown in the palette only — kept out of the sidebar. */
  hidden?: boolean;
};

export const ADMIN_NAV: {
  primary: NavItem[];
  secondary: NavItem[];
  folded: { id: string; label: string; items: NavItem[] }[];
} = {
  primary: [
    { id: "trials", label: "Trials", to: "/admin?tab=trials", icon: CalendarDays },
    { id: "enrollments", label: "Enrollments", to: "/admin?tab=enrollments", icon: GraduationCap },
    { id: "leads", label: "Leads", to: "/admin?tab=leads", icon: Users },
  ],
  secondary: [
    // Not a `?tab=` deep link — a route of its own (/admin/week), because the
    // timetable is not a screen inside AdminDashboard.tsx. It reads the four
    // scheduling tables live; see WeekTimetable.tsx.
    { id: "week", label: "The week", to: "/admin/week", icon: CalendarRange },
    { id: "guide", label: "Sending guide", to: "/admin/guide", icon: CalendarRange },
    // One free-text letter to one student, from the Klovers address. Listed
    // here rather than folded because the whole point of building it was that
    // there was no way to send such a letter without an engineer — a screen
    // nobody can find would not have fixed that.
    { id: "message", label: "Write a letter", to: "/admin/message", icon: Mail },
    { id: "my-students", label: "My students", to: "/admin?tab=my-students", icon: LayoutDashboard },
    { id: "placement-tests", label: "Placement tests", to: "/admin?tab=placement-tests", icon: ClipboardCheck },
    { id: "availability", label: "Availability", to: "/admin?tab=availability", icon: Clock },
    { id: "email", label: "Email delivery", to: "/admin/email", icon: Mail },
    // Historical students 2022-2025, admin only. Rendered by AdminEntry (not
    // AdminDashboard) as its own screen with sub-tabs; see LegacyDataPanel.tsx.
    { id: "legacy", label: "Legacy Data", to: "/admin?tab=legacy", icon: Archive },
  ],
  folded: [
    {
      id: "content",
      label: "Content",
      items: [
        { id: "blog", label: "Blog", to: "/admin?tab=blog" },
        { id: "seo-orchestration", label: "SEO", to: "/admin?tab=seo-orchestration" },
        { id: "image-audit", label: "Images", to: "/admin?tab=image-audit" },
        // These three render real screens that nothing linked to until #266:
        // bulk email + reminders + the trial-interest campaign, and the two
        // book assignment screens. Visible, not palette-only — a screen nobody
        // can find is not fixed by hiding it more carefully.
        { id: "campaigns", label: "Campaigns", to: "/admin?tab=campaigns" },
        { id: "books", label: "Books", to: "/admin?tab=books" },
        { id: "trial-books", label: "Trial books", to: "/admin?tab=trial-books" },
      ],
    },
    {
      id: "setup",
      label: "Setup",
      items: [
        { id: "notifications", label: "Notifications", to: "/admin?tab=notifications" },
        { id: "scheduling", label: "Scheduling", to: "/admin?tab=scheduling" },
        { id: "settings", label: "Settings", to: "/admin?tab=settings" },
        { id: "league-users", label: "Leagues", to: "/admin?tab=league-users" },
        { id: "promos", label: "Promo codes", to: "/admin?tab=promos" },
        { id: "lead-funnel", label: "Lead funnel", to: "/admin?tab=lead-funnel" },
        { id: "sales", label: "Sales", to: "/admin?tab=sales" },
        { id: "students", label: "Students (legacy list)", to: "/admin?tab=students" },
        // Reachable only from the palette. Retiring them is a separate decision;
        // until it is taken, they stay findable rather than quietly lost.
        { id: "group-matcher", label: "Group matcher", to: "/admin?tab=group-matcher", hidden: true },
        { id: "group-attendance", label: "Group attendance", to: "/admin?tab=group-attendance", hidden: true },
        { id: "session-attendance", label: "Session attendance", to: "/admin?tab=session-attendance", hidden: true },
        { id: "preferences", label: "Preferences", to: "/admin?tab=preferences", hidden: true },
        { id: "manage", label: "Student admin (legacy)", to: "/admin?tab=manage", hidden: true },
        { id: "marketing", label: "Marketing generator", to: "/admin/marketing", hidden: true },
        { id: "korean-orchestra", label: "Korean orchestrator", to: "/admin/korean-orchestra", hidden: true },
      ],
    },
  ],
};

export type Badges = Partial<Record<string, number>>;

const NavRow = ({
  item, active, badge, tone,
}: { item: NavItem; active?: boolean; badge?: number; tone?: "alert" }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-accent font-semibold" : "font-medium hover:bg-muted"
      }`}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
      <span className="flex-1 truncate">{item.label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            tone === "alert"
              ? "bg-destructive text-destructive-foreground"
              : "bg-foreground text-primary"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};

const FoldedGroup = ({ label, items }: { label: string; items: NavItem[] }) => {
  const [open, setOpen] = useState(false);
  const visible = items.filter(i => !i.hidden);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        {label === "Content" ? <FileText className="h-[18px] w-[18px]" /> : <Settings className="h-[18px] w-[18px]" />}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 pl-8">
          {visible.map(i => (
            <Link
              key={i.id}
              to={i.to}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminShell = ({
  children, badges = {}, activeId,
}: { children: React.ReactNode; badges?: Badges; activeId?: string }) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // The bell fetches its own count. It used to depend on a caller passing
  // `badges.notifications`, and no caller ever did — so it stayed dark while
  // 174 notifications piled up unread, 36 of them saying the trial follow-up
  // jobs were not running. An alarm that has to be wired up by whoever mounts
  // it is not an alarm.
  const { data: alerts } = useUnreadAlerts();
  // The admin had no theme control of its own. The only toggle lived in the
  // public site header, so changing it from here meant leaving the admin,
  // flipping it on a marketing page and navigating back.
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const all: NavItem[] = [
    { id: "today", label: "Today", to: "/admin/today" },
    { id: "activity", label: "Last 7 days", to: "/admin/activity" },
    ...ADMIN_NAV.primary,
    ...ADMIN_NAV.secondary,
    ...ADMIN_NAV.folded.flatMap(g => g.items),
  ];

  const current =
    activeId ??
    (location.pathname === "/admin/today"
      ? "today"
      : location.pathname === "/admin/activity"
        ? "activity"
        : undefined);

  // An explicit prop still wins, so anything that sets it deliberately keeps
  // working. Otherwise: unread total on the badge, red only when at least one
  // of them means something is broken.
  const bellCount = badges.notifications ?? alerts?.total ?? 0;
  const bellIsProblem = badges.notifications === undefined && (alerts?.problems ?? 0) > 0;

  return (
    <div className="admin-shell flex min-h-screen bg-background">

      <aside className="hidden w-[248px] shrink-0 flex-col border-r lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-primary text-sm font-extrabold text-primary-foreground">
            K
          </span>
          <span className="text-[15px] font-bold tracking-tight">Klovers Admin</span>
        </div>

        <nav className="flex flex-col gap-5 overflow-y-auto p-3">
          {/* Today answers "what needs me now"; Last 7 days answers "what
              happened while I was not looking". Same pair, so they sit
              together above the grouped lists rather than inside one. */}
          <div className="flex flex-col gap-0.5">
            <NavRow item={{ id: "today", label: "Today", to: "/admin/today", icon: LayoutDashboard }} active={current === "today"} />
            <NavRow item={{ id: "activity", label: "Last 7 days", to: "/admin/activity", icon: History }} active={current === "activity"} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="px-3 text-[11px] font-bold tracking-[0.08em] text-muted-foreground">DAILY</p>
            <div className="flex flex-col gap-0.5">
              {ADMIN_NAV.primary.map(i => (
                <NavRow
                  key={i.id}
                  item={i}
                  active={current === i.id}
                  badge={badges[i.id]}
                  tone={i.id === "enrollments" ? "alert" : undefined}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="px-3 text-[11px] font-bold tracking-[0.08em] text-muted-foreground">TEACHING</p>
            <div className="flex flex-col gap-0.5">
              {ADMIN_NAV.secondary.map(i => (
                <NavRow key={i.id} item={i} active={current === i.id} badge={badges[i.id]} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            {ADMIN_NAV.folded.map(g => (
              <FoldedGroup key={g.id} label={g.label} items={g.items} />
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border bg-muted px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-background"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Search screens</span>
            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[11px] font-medium sm:inline">
              Ctrl K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark"
              ? <Sun className="h-[18px] w-[18px]" />
              : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          {/* The one action from the dashboard's own header that the shell did
              not already provide. Same behaviour: reload the document. */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Refresh"
            onClick={() => { window.location.reload(); }}
          >
            <RefreshCw className="h-[18px] w-[18px]" />
          </Button>

          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative shrink-0"
            aria-label={
              bellCount > 0
                ? `Notifications — ${bellCount} unread${bellIsProblem ? ", including problems" : ""}`
                : "Notifications"
            }
          >
            <Link to="/admin?tab=notifications">
              <Bell className="h-[18px] w-[18px]" />
              {bellCount > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 rounded-full border-2 border-background px-1.5 text-[10px] font-bold leading-4 ${
                    // Red means something is wrong. Ordinary unread activity —
                    // a new booking, a new enrollment — stays grey, because a
                    // bell that is always red is a bell you stop looking at,
                    // and that is exactly how 36 warnings went unread.
                    bellIsProblem
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted-foreground text-background"
                  }`}
                >
                  {bellCount > 99 ? "99+" : bellCount}
                </span>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Sign out"
            onClick={() => { void supabase.auth.signOut(); }}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </header>

        {/* Below lg the sidebar is gone; the daily screens stay one tap away. */}
        <div className="flex gap-2 overflow-x-auto border-b px-4 py-2 lg:hidden">
          {[
            { id: "today", label: "Today", to: "/admin/today" },
            { id: "activity", label: "Last 7 days", to: "/admin/activity" },
            ...ADMIN_NAV.primary,
          ].map(i => (
            <Link
              key={i.id}
              to={i.to}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
                current === i.id ? "bg-accent font-semibold" : "font-medium"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </div>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Go to a screen…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Screens">
            {all.map(i => (
              <CommandItem
                key={i.id}
                value={`${i.label} ${i.id}`}
                onSelect={() => {
                  setPaletteOpen(false);
                  navigate(i.to);
                }}
              >
                {i.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default AdminShell;
