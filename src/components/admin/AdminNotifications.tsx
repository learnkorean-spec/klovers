import { useState, useEffect, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Check,
  Filter,
  Users,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CreditCard,
  BarChart3,
  CalendarDays,
  Wrench,
  Send,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Which drawer a notification belongs in.
 *
 * Re, 15 Sep 2026: "no need to system msgs in the notification center, i want
 * updates for website numbers". Updates is what opens by default — signups,
 * trial bookings, payments, the daily numbers. System keeps the technical rows
 * (cron health, self verification) for whoever is looking for them, which is
 * not her.
 *
 * The column is written by the database (migration 20260915234500), so a
 * notification lands in the right drawer whatever wrote it.
 */
type Category = "update" | "system";

interface Notification {
  id: string;
  message: string;
  type: string;
  category: string;
  read: boolean;
  created_at: string;
  related_user_id: string | null;
  related_group_id: string | null;
}

interface SlotMember {
  user_id: string;
  name: string;
  email: string;
  level: string;
}

interface SlotFullPanelProps {
  notification: Notification;
  onGroupCreated: (notifId: string, groupName: string) => void;
}

/**
 * Friendly label, badge colour and icon for a notification type.
 *
 * Unknown types fall back rather than rendering `undefined` into the variant
 * (which silently loses the badge styling) — new types arrive from the
 * database, not from this file, so there will always be some it has not met.
 */
const TYPE_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new_registration: { label: "New signup", variant: "default" },
  payment_received: { label: "Payment", variant: "default" },
  daily_summary: { label: "Daily numbers", variant: "secondary" },
  trial: { label: "Trial booking", variant: "secondary" },
  slot_full: { label: "Slot full", variant: "destructive" },
  slot_confirmed: { label: "Slot confirmed", variant: "default" },
  waitlist: { label: "Waitlist", variant: "secondary" },
  alternative_slot: { label: "Alternative slot", variant: "outline" },
};

const typeLabel = (type: string) =>
  TYPE_META[type]?.label ?? type.replace(/_/g, " ");

const typeVariant = (type: string) => TYPE_META[type]?.variant ?? "outline";

const TypeIcon = ({ type }: { type: string }) => {
  const className = "h-3.5 w-3.5 shrink-0 text-muted-foreground";
  switch (type) {
    case "new_registration":
      return <UserPlus className={className} aria-hidden="true" />;
    case "payment_received":
      return <CreditCard className={className} aria-hidden="true" />;
    case "daily_summary":
      return <BarChart3 className={className} aria-hidden="true" />;
    case "trial":
      return <CalendarDays className={className} aria-hidden="true" />;
    case "slot_full":
    case "slot_confirmed":
      return <Users className={className} aria-hidden="true" />;
    default:
      return <Wrench className={className} aria-hidden="true" />;
  }
};

// Extract slot info from notification message like: Slot "Friday 11:00 (Beginner 1)" is now FULL.
function parseSlotFullMessage(message: string): { day: string; time: string; level: string } | null {
  const match = message.match(/Slot "([^"]+)" is now FULL/i);
  if (!match) return null;
  const raw = match[1]; // e.g. "Friday 11:00 (Beginner 1)"
  const levelMatch = raw.match(/\(([^)]+)\)/);
  const level = levelMatch ? levelMatch[1] : "";
  const parts = raw.replace(/\([^)]*\)/, "").trim().split(/\s+/);
  const day = parts[0] || "";
  const time = parts[1] || "";
  return { day, time, level };
}

const SlotFullPanel = ({ notification, onGroupCreated }: SlotFullPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<SlotMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdGroupName, setCreatedGroupName] = useState<string | null>(null);

  const slotInfo = parseSlotFullMessage(notification.message);

  const fetchMembers = async () => {
    if (!slotInfo) return;
    setLoadingMembers(true);

    // Find the matching slot
    const { data: slots } = await supabase
      .from("matching_slots")
      .select("id, day, time, course_level")
      .eq("day", slotInfo.day)
      .eq("course_level", slotInfo.level)
      .limit(5);

    if (!slots || slots.length === 0) {
      setLoadingMembers(false);
      return;
    }

    const slotIds = (slots).map((s: any) => s.id);

    // Get student_slot_preferences matched to these slots
    const { data: prefs } = await supabase
      .from("student_slot_preferences")
      .select("user_id, assigned_slot_id")
      .in("assigned_slot_id", slotIds);

    if (!prefs || (prefs).length === 0) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const userIds = [...new Set((prefs).map((p: any) => p.user_id))];

    // Course logic reads profiles.course_level_key (canonical). The legacy
    // profiles.level column is kept as a free-form self-assessment fallback
    // for rows that have not been migrated yet.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email, course_level_key, level")
      .in("user_id", userIds);

    const enriched: SlotMember[] = userIds.map((uid) => {
      const profile = (profiles || []).find((p: any) => p.user_id === uid);
      return {
        user_id: uid,
        name: profile?.name || "Unknown",
        email: profile?.email || "",
        level: (profile as any)?.course_level_key || profile?.level || slotInfo.level,
      };
    });

    setMembers(enriched);

    // Set default group name
    if (!groupName) {
      setGroupName(`${slotInfo.level} – ${slotInfo.day} ${slotInfo.time}`);
    }

    setLoadingMembers(false);
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && members.length === 0) fetchMembers();
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !slotInfo) return;
    setCreating(true);

    try {
      // Create student_groups entry
      const { data: group, error: groupError } = await supabase
        .from("student_groups")
        .insert({
          name: groupName.trim(),
          schedule_day: slotInfo.day,
          schedule_time: slotInfo.time,
          course_type: "group",
          level: slotInfo.level,
          capacity: Math.max(members.length, 5),
        })
        .select("id")
        .single();

      if (groupError || !group) throw new Error(groupError?.message || "Failed to create group");

      const groupId = group.id;

      // Mark notification as read + store group id reference
      await supabase
        .from("admin_notifications")
        .update({ read: true, related_group_id: groupId })
        .eq("id", notification.id);

      setCreatedGroupName(groupName.trim());
      onGroupCreated(notification.id, groupName.trim());
      toast({ title: "Group created!", description: `"${groupName.trim()}" with ${members.length} members.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (!slotInfo) return null;

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-sm"
        onClick={handleExpand}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {createdGroupName
            ? `Group: ${createdGroupName}`
            : `View members & create group`}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {expanded && (
        <div className="space-y-3">
          {loadingMembers ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No matched members found for this slot.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between text-xs bg-muted/40 rounded px-3 py-1.5">
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="text-muted-foreground">{m.email}</span>
                </div>
              ))}
            </div>
          )}

          {!createdGroupName && members.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Group name</p>
              <div className="flex gap-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="h-8 text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCreateGroup}
                  disabled={creating || !groupName.trim()}
                  className="h-8 shrink-0"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <><Plus className="h-3.5 w-3.5 mr-1" /> Create</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {createdGroupName && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary rounded px-3 py-2">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Group <strong className="mx-1">"{createdGroupName}"</strong> created successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const [category, setCategory] = useState<Category>("update");
  const [tabUnread, setTabUnread] = useState<Record<Category, number>>({ update: 0, system: 0 });
  const [createdGroups, setCreatedGroups] = useState<Record<string, string>>({});
  const [sendingReport, setSendingReport] = useState(false);

  /** The bell reads the same rows from its own query — keep the two in step. */
  const refreshBell = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "unread-alerts"] });
  }, [queryClient]);

  const fetchUnreadCounts = useCallback(async () => {
    const [update, system] = await Promise.all([
      supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .eq("category", "update"),
      supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .eq("category", "system"),
    ]);
    setTabUnread({ update: update.count ?? 0, system: system.count ?? 0 });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("admin_notifications")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter === "unread") {
      query = query.eq("read", false);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch notifications:", error);
    }
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  }, [filter, category]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  const markRead = async (id: string) => {
    await supabase
      .from("admin_notifications")
      .update({ read: true })
      .eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    fetchUnreadCounts();
    refreshBell();
  };

  const markAllRead = async () => {
    // Every unread row in this category, not only the ones on screen. The
    // update was scoped to the loaded ids, so "mark all read" left whatever
    // the page had not fetched unread — and the bell went on counting it.
    const { error } = await supabase
      .from("admin_notifications")
      .update({ read: true })
      .eq("read", false)
      .eq("category", category);
    if (error) {
      toast({ title: "Could not mark them read", description: error.message, variant: "destructive" });
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetchUnreadCounts();
    refreshBell();
  };

  /**
   * Manual trigger for supabase/functions/send-weekly-report — the email that
   * replaced the old "email on every admin_notifications insert" flood (see
   * 20260922100000_stop_admin_notification_emails.sql). It normally only
   * sends once, Saturday 08:00 Cairo; ?force=1 bypasses that so this button
   * can send it on demand — useful the first time it ships, or any time
   * someone wants this week's numbers without waiting for Saturday.
   *
   * The function authorises the call itself (isCronOrAdmin, in
   * supabase/functions/_shared/cronAuth.ts) against the admin's own session,
   * which `invoke` sends automatically — no separate secret needed here.
   */
  const handleSendReportNow = async () => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-report?force=1");
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || "Unknown error");
      toast({
        title: "Weekly report sent",
        description: `${data?.signupsTotal ?? 0} signup(s) this week · sent to ${(data?.to ?? []).join(", ")}.`,
      });
    } catch (err: any) {
      toast({ title: "Could not send the weekly report", description: err.message, variant: "destructive" });
    } finally {
      setSendingReport(false);
    }
  };

  const handleGroupCreated = (notifId: string, groupName: string) => {
    setCreatedGroups((prev) => ({ ...prev, [notifId]: groupName }));
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    fetchUnreadCounts();
    refreshBell();
  };

  const unreadCount = tabUnread[category];

  const TabButton = ({ value, label }: { value: Category; label: string }) => (
    <Button
      variant={category === value ? "default" : "ghost"}
      size="sm"
      className="rounded-md"
      aria-pressed={category === value}
      onClick={() => setCategory(value)}
    >
      {label}
      {tabUnread[value] > 0 && (
        <span className="ml-1.5 text-xs opacity-80">{tabUnread[value]}</span>
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
          >
            <Filter className="h-4 w-4 mr-1" />
            {filter === "unread" ? "Show all" : "Unread only"}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReportNow}
            disabled={sendingReport}
            title="Normally sends itself Saturday morning — this sends it right now instead."
          >
            {sendingReport ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send weekly report now
          </Button>
        </div>
      </div>

      {/* Updates first, and open by default: the numbers from the site are what
          this screen is for. System is the technical drawer. */}
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <TabButton value="update" label="Updates" />
        <TabButton value="system" label="System" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {filter === "unread"
            ? category === "update"
              ? "No unread updates."
              : "No unread system messages."
            : category === "update"
              ? "No updates yet."
              : "No system messages yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read && !createdGroups[n.id] ? "opacity-60" : ""}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TypeIcon type={n.type} />
                      <Badge variant={typeVariant(n.type)} className="text-xs">{typeLabel(n.type)}</Badge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>

                    {/* Slot full: show member list + create group UI */}
                    {n.type === "slot_full" && (
                      <SlotFullPanel
                        notification={n}
                        onGroupCreated={handleGroupCreated}
                      />
                    )}

                    {/* Show created group name badge if exists */}
                    {createdGroups[n.id] && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Users className="h-3.5 w-3.5" />
                        Group: {createdGroups[n.id]}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => markRead(n.id)} aria-label="Mark as read">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(AdminNotifications);
