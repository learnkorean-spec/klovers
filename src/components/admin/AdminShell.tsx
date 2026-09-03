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
 * Screens still live in AdminDashboard.tsx and are selected by `?tab=`, so
 * every link here is a deep link into it. Nothing in that file changes.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays, Users, GraduationCap, Bell, Search, LayoutDashboard,
  ClipboardCheck, Clock, ChevronDown, FileText, Settings, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

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
    { id: "my-students", label: "My students", to: "/admin?tab=my-students", icon: LayoutDashboard },
    { id: "placement-tests", label: "Placement tests", to: "/admin?tab=placement-tests", icon: ClipboardCheck },
    { id: "availability", label: "Availability", to: "/admin?tab=availability", icon: Clock },
  ],
  folded: [
    {
      id: "content",
      label: "Content",
      items: [
        { id: "blog", label: "Blog", to: "/admin?tab=blog" },
        { id: "seo-orchestration", label: "SEO", to: "/admin?tab=seo-orchestration" },
        { id: "image-audit", label: "Images", to: "/admin?tab=image-audit" },
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
    ...ADMIN_NAV.primary,
    ...ADMIN_NAV.secondary,
    ...ADMIN_NAV.folded.flatMap(g => g.items),
  ];

  const current = activeId ?? (location.pathname === "/admin/today" ? "today" : undefined);

  return (
    <div className="flex min-h-screen bg-background">

      <aside className="hidden w-[248px] shrink-0 flex-col border-r lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-primary text-sm font-extrabold text-primary-foreground">
            K
          </span>
          <span className="text-[15px] font-bold tracking-tight">Klovers Admin</span>
        </div>

        <nav className="flex flex-col gap-5 overflow-y-auto p-3">
          <NavRow item={{ id: "today", label: "Today", to: "/admin/today", icon: LayoutDashboard }} active={current === "today"} />

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

          <Button asChild variant="outline" size="icon" className="relative shrink-0" aria-label="Notifications">
            <Link to="/admin?tab=notifications">
              <Bell className="h-[18px] w-[18px]" />
              {(badges.notifications ?? 0) > 0 && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-background bg-destructive px-1.5 text-[10px] font-bold leading-4 text-destructive-foreground">
                  {badges.notifications}
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
          {[{ id: "today", label: "Today", to: "/admin/today" }, ...ADMIN_NAV.primary].map(i => (
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
