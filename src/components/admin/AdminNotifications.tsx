import { useState, useEffect, useCallback, useRef, memo } from "react";
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
  attendance_claim: { label: "Attendance claim", variant: "secondary" },
  attendance_claim_negative: { label: "Attendance claim", variant: "outline" },
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
    case "attendance_claim":
    case "attendance_claim_negative":
      return <CalendarDays className={className} aria-hidden="true" />;
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

/**
 * Re, 2 Nov 2026: "when they confirm must be confirmed on dashboard, with
 * adding a way that admin can edit and fix". A Telegram attendance claim
 * (telegram_confirm_private_session / telegram_confirm_group_session) used
 * to be nothing but this plain text line -- fixing it meant going to a
 * different screen, finding the right student (or group) and the right
 * session by hand. This panel, same pattern as SlotFullPanel above, finds
 * the exact pending item from related_user_id and resolves it with one tap,
 * right here.
 *
 * related_user_id is teacher_students.id for a private student or
 * profiles.user_id for a group member -- two different id spaces, so which
 * one it is gets settled by which table actually has a row for that id, not
 * by the notification type (a negative claim and a positive one for the
 * same kind of student share the same id space).
 */
interface AttendanceClaimPanelProps {
  notification: Notification;
  /**
   * Fired once when there is nothing left to resolve for this
   * related_user_id — either nothing was pending to begin with, or the last
   * row here just got resolved. Only PendingAttendanceSection (the dedicated
   * "clean list" view below) passes this; the plain feed usage leaves it
   * unset and keeps showing its own "Already resolved" line instead.
   */
  onAllResolved?: () => void;
  /**
   * true when this panel is the whole card (PendingAttendanceSection), not a
   * sub-panel hanging off a notification message above it — drops the
   * divider/margin that assumed there was always something above.
   */
  standalone?: boolean;
}

interface PendingPrivateSession {
  id: string;
  session_date: string;
  start_time: string;
}

interface PendingGroupAttendance {
  session_id: string;
  session_date: string | null;
  group_name: string;
}

const AttendanceClaimPanel = ({ notification, onAllResolved, standalone }: AttendanceClaimPanelProps) => {
  const uid = notification.related_user_id;
  const [mode, setMode] = useState<"loading" | "private" | "group" | "none">("loading");
  const [studentName, setStudentName] = useState("");
  const [privateRows, setPrivateRows] = useState<PendingPrivateSession[]>([]);
  const [groupRows, setGroupRows] = useState<PendingGroupAttendance[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const resolvedRef = useRef(false);

  const load = useCallback(async () => {
    if (!uid) { setMode("none"); return; }

    const { data: ts, error: tsError } = await supabase
      .from("teacher_students")
      .select("id, full_name")
      .eq("id", uid)
      .maybeSingle();
    if (tsError) {
      toast({ title: "Couldn't load this claim", description: tsError.message, variant: "destructive" });
      setMode("none");
      return;
    }

    if (ts) {
      setStudentName(ts.full_name || "");
      const { data: sessions, error: sessionsError } = await supabase
        .from("student_class_sessions")
        .select("id, session_date, start_time")
        .eq("student_id", uid)
        .eq("outcome", "scheduled")
        .not("telegram_asked_at", "is", null)
        .order("session_date", { ascending: false })
        .limit(5);
      if (sessionsError) {
        toast({ title: "Couldn't load pending sessions", description: sessionsError.message, variant: "destructive" });
        setMode("none");
        return;
      }
      setPrivateRows((sessions as PendingPrivateSession[]) || []);
      setMode("private");
      return;
    }

    const { data: prof, error: profError } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("user_id", uid)
      .maybeSingle();
    if (profError) {
      toast({ title: "Couldn't load this claim", description: profError.message, variant: "destructive" });
      setMode("none");
      return;
    }

    if (prof) {
      setStudentName(prof.name || "");
      const { data: pending, error: pendingError } = await supabase
        .from("pkg_attendance")
        .select("session_id")
        .eq("user_id", uid)
        .eq("admin_approved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (pendingError) {
        toast({ title: "Couldn't load pending attendance", description: pendingError.message, variant: "destructive" });
        setMode("none");
        return;
      }

      const sessionIds = (pending || []).map((p) => p.session_id);
      if (sessionIds.length === 0) {
        setGroupRows([]);
        setMode("group");
        return;
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from("pkg_group_sessions")
        .select("id, session_date, group_id")
        .in("id", sessionIds);
      if (sessionsError) {
        toast({ title: "Couldn't load group sessions", description: sessionsError.message, variant: "destructive" });
        setMode("none");
        return;
      }

      const groupIds = [...new Set((sessions || []).map((s) => s.group_id))];
      const { data: groups, error: groupsError } = groupIds.length
        ? await supabase.from("pkg_groups").select("id, name").in("id", groupIds)
        : { data: [] as { id: string; name: string }[], error: null };
      if (groupsError) {
        toast({ title: "Couldn't load group names", description: groupsError.message, variant: "destructive" });
        setMode("none");
        return;
      }

      const groupNameById: Record<string, string> = {};
      (groups || []).forEach((g) => { groupNameById[g.id] = g.name; });

      const sessionById: Record<string, { session_date: string; group_id: string }> = {};
      (sessions || []).forEach((s) => { sessionById[s.id] = s; });

      setGroupRows(sessionIds.map((sid) => ({
        session_id: sid,
        session_date: sessionById[sid]?.session_date ?? null,
        group_name: sessionById[sid] ? (groupNameById[sessionById[sid].group_id] || "") : "",
      })));
      setMode("group");
      return;
    }

    setMode("none");
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // Tell PendingAttendanceSection once this student/member has nothing left
  // pending, so it can drop the card — checked after every load and after
  // every resolve, exactly once.
  useEffect(() => {
    if (!onAllResolved || resolvedRef.current) return;
    if (mode === "none") {
      resolvedRef.current = true;
      onAllResolved();
    } else if (mode === "private" && privateRows.length === 0) {
      resolvedRef.current = true;
      onAllResolved();
    } else if (mode === "group" && groupRows.length === 0) {
      resolvedRef.current = true;
      onAllResolved();
    }
  }, [mode, privateRows, groupRows, onAllResolved]);

  const dateLabel = (d: string | null) =>
    d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

  const resolvePrivate = async (sessionId: string, outcome: "attended" | "absent_excused" | "no_show_charged") => {
    setBusyId(sessionId);
    const counted = outcome === "attended" || outcome === "no_show_charged";
    const { error } = await supabase
      .from("student_class_sessions")
      .update({ outcome, counted, confirmed_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPrivateRows((prev) => prev.filter((r) => r.id !== sessionId));
      toast({ title: "Attendance fixed ✓" });
    }
    setBusyId(null);
  };

  const resolveGroup = async (sessionId: string, status: "present" | "absent" | "excused") => {
    if (!uid) return;
    setBusyId(sessionId);
    const { error } = await supabase
      .from("pkg_attendance")
      .update({ status, admin_approved: true })
      .eq("session_id", sessionId)
      .eq("user_id", uid);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setGroupRows((prev) => prev.filter((r) => r.session_id !== sessionId));
      toast({ title: "Attendance fixed ✓" });
    }
    setBusyId(null);
  };

  if (mode === "loading" || mode === "none") return null;

  const rows = mode === "private" ? privateRows : groupRows;
  if (rows.length === 0) {
    // In the dedicated section the whole card disappears instead (see
    // onAllResolved above) — nothing to show here in that case.
    if (onAllResolved) return null;
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5" /> Already resolved.
      </div>
    );
  }

  return (
    <div className={standalone ? "space-y-2" : "mt-3 border-t border-border pt-3 space-y-2"}>
      {mode === "private" && privateRows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs bg-muted/40 rounded px-3 py-2">
          <span className="font-medium text-foreground">{studentName} — {dateLabel(r.session_date)}</span>
          <div className="flex gap-1 flex-wrap">
            <Button size="sm" className="h-7 text-xs" disabled={busyId === r.id} onClick={() => resolvePrivate(r.id, "attended")}>
              Attended
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyId === r.id} onClick={() => resolvePrivate(r.id, "absent_excused")}>
              Absent (no charge)
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={busyId === r.id} onClick={() => resolvePrivate(r.id, "no_show_charged")}>
              No-show (charge)
            </Button>
          </div>
        </div>
      ))}
      {mode === "group" && groupRows.map((r) => (
        <div key={r.session_id} className="flex flex-wrap items-center justify-between gap-2 text-xs bg-muted/40 rounded px-3 py-2">
          <span className="font-medium text-foreground">
            {studentName}{r.group_name && ` — ${r.group_name}`}{r.session_date && ` · ${dateLabel(r.session_date)}`}
          </span>
          <div className="flex gap-1 flex-wrap">
            <Button size="sm" className="h-7 text-xs" disabled={busyId === r.session_id} onClick={() => resolveGroup(r.session_id, "present")}>
              Present
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyId === r.session_id} onClick={() => resolveGroup(r.session_id, "excused")}>
              Excused (no charge)
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={busyId === r.session_id} onClick={() => resolveGroup(r.session_id, "absent")}>
              Absent
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Re, 2 Nov 2026: "so clean on dashboard that it has only the classes they
 * confirmed so i confirm?" -- AttendanceClaimPanel fixes a claim once you've
 * found its notification, but that notification is buried in the general
 * Updates feed among payments, signups, slot-full alerts, etc. This is the
 * dedicated list: just the pending Telegram attendance claims, one card per
 * student/member (not per notification -- a student can have several
 * sessions queued up), nothing else on it. A card vanishes the moment that
 * person has nothing left pending, whether resolved here or already handled
 * elsewhere (GroupAttendanceManager, a direct session edit, etc.).
 */
interface PendingAttendanceGroup {
  relatedUserId: string;
  notificationIds: string[];
}

const PendingAttendanceSection = () => {
  const [groups, setGroups] = useState<PendingAttendanceGroup[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("id, related_user_id")
      .in("type", ["attendance_claim", "attendance_claim_negative"])
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("Failed to fetch pending attendance claims:", error);
      setGroups([]);
      return;
    }

    const byUser = new Map<string, string[]>();
    for (const row of data || []) {
      if (!row.related_user_id) continue; // older rows, before related_user_id existed
      const ids = byUser.get(row.related_user_id) ?? [];
      ids.push(row.id);
      byUser.set(row.related_user_id, ids);
    }
    setGroups(Array.from(byUser.entries()).map(([relatedUserId, notificationIds]) => ({ relatedUserId, notificationIds })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismiss = useCallback(async (group: PendingAttendanceGroup) => {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ read: true })
      .in("id", group.notificationIds);
    if (error) {
      console.error("Failed to mark attendance claim notifications read:", error);
    }
    setGroups((prev) => (prev ?? []).filter((g) => g.relatedUserId !== group.relatedUserId));
  }, []);

  if (groups === null || groups.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Pending attendance confirmations</h3>
        <Badge variant="secondary" className="text-xs">{groups.length}</Badge>
      </div>
      <div className="space-y-2">
        {groups.map((g) => (
          <Card key={g.relatedUserId}>
            <CardContent className="py-3 px-4">
              <AttendanceClaimPanel
                standalone
                notification={{
                  id: g.relatedUserId,
                  message: "",
                  type: "attendance_claim",
                  category: "update",
                  read: false,
                  created_at: "",
                  related_user_id: g.relatedUserId,
                  related_group_id: null,
                }}
                onAllResolved={() => dismiss(g)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
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
          <h2 className="font-semibold text-foreground">Notifications</h2>
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

      {/* Always visible, independent of the Updates/System tab and the
          unread/all filter below -- this is the clean, dedicated list Re
          works through, not another thing to dig for inside the feed. */}
      <PendingAttendanceSection />

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

                    {/* Telegram attendance claim (private or group): fix it
                        right here instead of sending Re to another screen. */}
                    {(n.type === "attendance_claim" || n.type === "attendance_claim_negative") && (
                      <AttendanceClaimPanel notification={n} />
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
