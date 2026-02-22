import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCheck, RefreshCw, UserCheck, UserX, Pencil, Users, Trash2, UserPlus, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupPackageInfo {
  package_id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  timezone: string | null;
}

// Unified group type from pkg_groups + schedule_packages
interface Group {
  id: string;
  name: string;
  package_id: string;
  capacity: number;
  is_active: boolean;
  // From parent package
  level: string;
  course_type: string;
  day_of_week: number;
  start_time: string;
  timezone: string;
  // Computed members
  members: { user_id: string; name: string; email: string; member_status: string; avatar_url?: string }[];
  active_count: number;
}

interface Session {
  id: string;
  group_id: string;
  session_date: string;
  created_at: string;
}

interface AttendanceRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  source: string;
  admin_approved: boolean;
  student_name?: string;
  student_email?: string;
  student_avatar?: string;
}

interface MemberForManage {
  user_id: string;
  name: string;
  email: string;
  member_status: string;
}

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextOccurrenceOf(dayOfWeek: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff === 0 ? 7 : diff));
  return next;
}

function formatStartTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

const statusColor = (status: string) => {
  switch (status) {
    case "present": return "ring-green-500 bg-green-500/20";
    case "absent": return "ring-destructive bg-destructive/20";
    case "late": return "ring-yellow-500 bg-yellow-500/20";
    case "excused": return "ring-blue-500 bg-blue-500/20";
    default: return "ring-muted";
  }
};

const GroupAttendanceManager = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupPackageInfo, setGroupPackageInfo] = useState<GroupPackageInfo | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Group management state
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  // Student assignment state
  const [manageStudentsDialog, setManageStudentsDialog] = useState(false);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<MemberForManage[]>([]);
  const [availableStudents, setAvailableStudents] = useState<MemberForManage[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  // Expanded groups in manage tab
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ── Unified fetch: pkg_groups + schedule_packages + pkg_group_members ──
  const fetchGroups = async () => {
    setGroupsLoading(true);

    // 1. Fetch all active pkg_groups with parent package info
    const { data: pkgGroups } = await supabase
      .from("pkg_groups")
      .select("id, name, package_id, capacity, is_active, schedule_packages(level, day_of_week, start_time, timezone, course_type)")
      .eq("is_active", true)
      .order("name");

    if (!pkgGroups || pkgGroups.length === 0) {
      setGroups([]);
      setGroupsLoading(false);
      return;
    }

    const groupIds = pkgGroups.map(g => g.id);

    // 2. Fetch all members
    const { data: members } = await supabase
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .in("group_id", groupIds);

    // 3. Fetch profiles for all member user_ids
    const userIds = [...new Set((members || []).map(m => m.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, name, email, avatar_url").in("user_id", userIds)
      : { data: [] };

    const profileMap: Record<string, { name: string; email: string; avatar_url: string }> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = { name: p.name, email: p.email, avatar_url: p.avatar_url || "" };
    });

    // 4. Build unified groups
    const result: Group[] = pkgGroups.map((g: any) => {
      const pkg = g.schedule_packages || {};
      const grpMembers = (members || [])
        .filter(m => m.group_id === g.id)
        .map(m => ({
          user_id: m.user_id,
          name: profileMap[m.user_id]?.name || "Unknown",
          email: profileMap[m.user_id]?.email || "",
          member_status: m.member_status,
          avatar_url: profileMap[m.user_id]?.avatar_url || "",
        }));

      return {
        id: g.id,
        name: g.name,
        package_id: g.package_id,
        capacity: g.capacity,
        is_active: g.is_active,
        level: pkg.level || "",
        course_type: pkg.course_type || "group",
        day_of_week: pkg.day_of_week ?? -1,
        start_time: pkg.start_time || "",
        timezone: pkg.timezone || "",
        members: grpMembers,
        active_count: grpMembers.filter(m => m.member_status === "active").length,
      };
    }).sort((a, b) => a.level.localeCompare(b.level) || a.day_of_week - b.day_of_week);

    setGroups(result);
    setGroupsLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  // When group is selected, set package info + load sessions
  useEffect(() => {
    if (!selectedGroup) {
      setSessions([]);
      setGroupPackageInfo(null);
      return;
    }

    const group = groups.find(g => g.id === selectedGroup);
    if (group && group.day_of_week >= 0) {
      setGroupPackageInfo({
        package_id: group.package_id,
        day_of_week: group.day_of_week,
        start_time: group.start_time,
        timezone: group.timezone,
      });
      const next = nextOccurrenceOf(group.day_of_week);
      setSessionDate(format(next, "yyyy-MM-dd"));
    } else {
      setGroupPackageInfo(null);
    }

    supabase
      .from("group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data as Session[]);
      });
  }, [selectedGroup, groups]);

  useEffect(() => {
    if (!selectedSession) { setAttendanceRows([]); return; }
    loadAttendance(selectedSession);
  }, [selectedSession]);

  const loadAttendance = async (sessionId: string) => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("group_attendance")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");

    if (error || !rows) {
      toast({ title: "Error loading attendance", description: error?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userIds = rows.map((r: any) => r.user_id);
    const { data: profs } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, name, email, avatar_url").in("user_id", userIds)
      : { data: [] };

    const profileMap: Record<string, { name: string; email: string; avatar_url: string }> = {};
    (profs || []).forEach((p: any) => {
      profileMap[p.user_id] = { name: p.name, email: p.email, avatar_url: p.avatar_url || "" };
    });

    setAttendanceRows(
      (rows as any[]).map((r) => ({
        ...r,
        student_name: profileMap[r.user_id]?.name || "Unknown",
        student_email: profileMap[r.user_id]?.email || "",
        student_avatar: profileMap[r.user_id]?.avatar_url || "",
      }))
    );
    setLoading(false);
  };

  // Create session using pkg_group_members for student list
  const createSession = async () => {
    if (!selectedGroup || !sessionDate) return;

    // Validate date matches package day_of_week
    if (groupPackageInfo?.day_of_week != null) {
      const chosen = new Date(sessionDate + "T00:00:00");
      if (chosen.getDay() !== groupPackageInfo.day_of_week) {
        const dayName = DAY_NAMES[groupPackageInfo.day_of_week];
        toast({
          title: "Invalid date",
          description: `This group can only meet on ${dayName} (${formatStartTime(groupPackageInfo.start_time)} ${groupPackageInfo.timezone ?? ""}).`,
          variant: "destructive",
        });
        return;
      }
    }

    setCreating(true);

    const { data: session, error: sessionErr } = await supabase
      .from("group_sessions")
      .insert({ group_id: selectedGroup, session_date: sessionDate } as any)
      .select()
      .single();

    if (sessionErr) {
      toast({
        title: "Error",
        description: sessionErr.message.includes("duplicate")
          ? "Session already exists for this date"
          : sessionErr.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    // Use pkg_group_members to find active students in this group
    const group = groups.find(g => g.id === selectedGroup);
    if (group && group.members.length > 0) {
      const activeMembers = group.members.filter(m => m.member_status === "active");
      if (activeMembers.length > 0) {
        const rows = activeMembers.map(m => ({
          session_id: (session as any).id,
          user_id: m.user_id,
          status: "absent",
          source: "system",
          admin_approved: false,
        }));
        await supabase.from("group_attendance").insert(rows as any);
      }
    }

    toast({ title: "Session created" });
    const { data: updatedSessions } = await supabase
      .from("group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false });
    if (updatedSessions) setSessions(updatedSessions as Session[]);
    setSelectedSession((session as any).id);
    setCreating(false);
  };

  const handleStatusChange = async (attId: string, newStatus: string) => {
    const isPresent = newStatus === "present";
    const { error } = await supabase
      .from("group_attendance")
      .update({ status: newStatus, source: "admin", admin_approved: isPresent } as any)
      .eq("id", attId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (isPresent) {
      const row = attendanceRows.find(r => r.id === attId);
      if (row && !row.admin_approved) {
        await supabase.rpc("approve_group_attendance", { _attendance_id: attId } as any);
      }
    }
    setAttendanceRows(prev =>
      prev.map(r => r.id === attId ? { ...r, status: newStatus, source: "admin", admin_approved: isPresent || r.admin_approved } : r)
    );
  };

  const handleMarkAllPresent = async () => {
    const toMark = attendanceRows.filter(r => r.status !== "present" || !r.admin_approved);
    if (toMark.length === 0) {
      toast({ title: "All students already marked present" });
      return;
    }

    for (const row of toMark) {
      if (!row.admin_approved) {
        await supabase.rpc("approve_group_attendance", { _attendance_id: row.id } as any);
      } else if (row.status !== "present") {
        await supabase
          .from("group_attendance")
          .update({ status: "present", source: "admin", admin_approved: true } as any)
          .eq("id", row.id);
      }
    }

    toast({ title: "All students marked present ✓" });
    setAttendanceRows(prev =>
      prev.map(r => ({ ...r, status: "present", source: "admin", admin_approved: true }))
    );
  };

  const handleToggleStatus = async (row: AttendanceRow) => {
    const newStatus = row.status === "present" ? "absent" : "present";
    await handleStatusChange(row.id, newStatus);
  };

  // ── Group editing (now operates on pkg_groups) ──
  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditCapacity(String(group.capacity ?? ""));
    setEditGroupDialog(true);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editName.trim()) return;
    const { error } = await supabase
      .from("pkg_groups")
      .update({
        name: editName.trim(),
        capacity: editCapacity ? parseInt(editCapacity) : 5,
      } as any)
      .eq("id", editingGroup.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Group updated" });
    setEditGroupDialog(false);
    fetchGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    // Remove members first, then deactivate group
    await supabase.from("pkg_group_members").delete().eq("group_id", groupId);
    const { error } = await supabase
      .from("pkg_groups")
      .update({ is_active: false } as any)
      .eq("id", groupId);
    if (error) {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted" });
      fetchGroups();
    }
  };

  // ── Student assignment (now uses pkg_group_members + profiles) ──
  const openManageStudents = async (group: Group) => {
    setManagingGroup(group);
    setStudentSearch("");

    // Current members are already loaded in group.members
    setGroupMembers(group.members.map(m => ({
      user_id: m.user_id,
      name: m.name,
      email: m.email,
      member_status: m.member_status,
    })));

    // Fetch all profiles as available students (excluding current members)
    const memberUserIds = group.members.map(m => m.user_id);
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .order("name");

    const available = (allProfiles || [])
      .filter((p: any) => !memberUserIds.includes(p.user_id))
      .map((p: any) => ({
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        member_status: "",
      }));

    setAvailableStudents(available);
    setManageStudentsDialog(true);
  };

  const handleAddStudentToGroup = async (student: MemberForManage) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("pkg_group_members")
      .insert({
        group_id: managingGroup.id,
        user_id: student.user_id,
        member_status: "active",
      } as any);

    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "Student already in this group" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    setGroupMembers(prev => [...prev, { ...student, member_status: "active" }]);
    setAvailableStudents(prev => prev.filter(s => s.user_id !== student.user_id));
    toast({ title: `${student.name} added to ${managingGroup.name}` });
  };

  const handleRemoveStudentFromGroup = async (student: MemberForManage) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("pkg_group_members")
      .delete()
      .eq("group_id", managingGroup.id)
      .eq("user_id", student.user_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setAvailableStudents(prev => [...prev, { ...student, member_status: "" }]);
    setGroupMembers(prev => prev.filter(s => s.user_id !== student.user_id));
    toast({ title: `${student.name} removed from ${managingGroup.name}` });
  };

  const filteredAvailable = availableStudents.filter(s =>
    !studentSearch ||
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const presentCount = attendanceRows.filter(r => r.status === "present").length;
  const totalCount = attendanceRows.length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="groups">Manage Groups</TabsTrigger>
        </TabsList>

        {/* ── ATTENDANCE TAB ── */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>Group</Label>
                    <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setSelectedSession(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => {
                          const dayName = DAY_NAMES[g.day_of_week] || "";
                          const timeStr = formatStartTime(g.start_time);
                          const schedule = [dayName, timeStr].filter(Boolean).join(" · ");
                          return (
                            <SelectItem key={g.id} value={g.id}>
                              <span className="font-medium">{g.name}</span>
                              {g.level && <Badge variant="secondary" className="ml-2 text-[10px] py-0">{g.level.replace(/_/g, " ")}</Badge>}
                              {schedule && <span className="text-muted-foreground ml-2 text-xs">({schedule})</span>}
                              <Badge variant="outline" className="ml-2 text-[10px] py-0">
                                {g.active_count}/{g.capacity}
                              </Badge>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroup && (() => {
                    const g = groups.find(gr => gr.id === selectedGroup);
                    if (!g) return null;
                    const dayName = DAY_NAMES[g.day_of_week] || "";
                    const timeStr = formatStartTime(g.start_time);
                    const infoParts = [
                      g.level && `📚 ${g.level.replace(/_/g, " ")}`,
                      dayName && `📅 ${dayName}`,
                      timeStr && `🕐 ${timeStr}`,
                      g.timezone && `🌍 ${g.timezone.replace(/_/g, " ")}`,
                      `👥 ${g.active_count}/${g.capacity} students`,
                    ].filter(Boolean);
                    return infoParts.length > 0 ? (
                      <div className="flex flex-wrap items-end gap-2 text-xs text-muted-foreground">
                        {infoParts.map((info, i) => (
                          <Badge key={i} variant="outline" className="font-normal">{info}</Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>Session Date</Label>
                  {groupPackageInfo?.day_of_week != null && (
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        📅 {DAY_NAMES[groupPackageInfo.day_of_week]}
                        {groupPackageInfo.start_time && ` · ${formatStartTime(groupPackageInfo.start_time)}`}
                        {groupPackageInfo.timezone && ` · ${groupPackageInfo.timezone}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        Only {DAY_NAMES[groupPackageInfo.day_of_week]}s can be selected
                      </Badge>
                    </div>
                  )}
                  <Calendar
                    mode="single"
                    selected={sessionDate ? new Date(sessionDate + "T00:00:00") : undefined}
                    onSelect={(d) => d && setSessionDate(format(d, "yyyy-MM-dd"))}
                    disabled={
                      groupPackageInfo?.day_of_week != null
                        ? [{ dayOfWeek: ([0, 1, 2, 3, 4, 5, 6] as const).filter(d => d !== groupPackageInfo.day_of_week) }]
                        : undefined
                    }
                    className="rounded-md border w-fit"
                  />
                </div>

                <div>
                  <Button onClick={createSession} disabled={!selectedGroup || !sessionDate || creating}>
                    <Plus className="h-4 w-4 mr-1" /> Create Session
                  </Button>
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="space-y-1">
                  <Label>Session</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>
                      {sessions.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.session_date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance */}
          {selectedSession && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Attendance</CardTitle>
                  {totalCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {presentCount}/{totalCount} present
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={handleMarkAllPresent} disabled={loading || totalCount === 0}>
                    <CheckCheck className="h-4 w-4 mr-1" /> Mark All Present
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => loadAttendance(selectedSession)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : attendanceRows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No students in this session.</p>
                ) : (
                  <>
                    {/* Student avatar grid */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      {attendanceRows.map((row, i) => (
                        <button
                          key={row.id + "-avatar"}
                          onClick={() => handleToggleStatus(row)}
                          className="flex flex-col items-center gap-1.5 animate-fade-in group cursor-pointer"
                          style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                          title={`${row.student_name} — ${row.status} (click to toggle)`}
                        >
                          <div className={`rounded-full ring-2 p-0.5 transition-all duration-200 group-hover:scale-110 ${statusColor(row.status)}`}>
                            <Avatar className="h-11 w-11">
                              {row.student_avatar && (
                                <AvatarImage src={row.student_avatar} alt={row.student_name || "Student"} />
                              )}
                              <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                                {(row.student_name || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center">
                            {row.student_name?.split(" ")[0] || "—"}
                          </span>
                          {row.status === "present" ? (
                            <UserCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <UserX className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Detail table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRows.map(row => (
                            <TableRow key={row.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {row.student_avatar && <AvatarImage src={row.student_avatar} alt={row.student_name || ""} />}
                                    <AvatarFallback className="bg-muted text-foreground text-xs">
                                      {(row.student_name || "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground">{row.student_name}</p>
                                    <p className="text-xs text-muted-foreground">{row.student_email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={row.status}
                                  onValueChange={(v) => handleStatusChange(row.id, v)}
                                >
                                  <SelectTrigger className="w-28 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{row.source}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── MANAGE GROUPS TAB ── */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Groups
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchGroups} disabled={groupsLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${groupsLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <p className="text-muted-foreground text-center py-4">Loading groups...</p>
              ) : groups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No groups yet.</p>
              ) : (
                <div className="space-y-3">
                  {groups.map(g => {
                    const activeMembers = g.members.filter(m => m.member_status === "active");
                    const waitlistMembers = g.members.filter(m => m.member_status === "waitlist");
                    const isExpanded = expandedGroups.has(g.id);
                    const dayName = DAY_NAMES[g.day_of_week] || "—";
                    const timeStr = formatStartTime(g.start_time);

                    return (
                      <div key={g.id} className="border rounded-lg overflow-hidden">
                        {/* Group header */}
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedGroups(prev => {
                            const next = new Set(prev);
                            next.has(g.id) ? next.delete(g.id) : next.add(g.id);
                            return next;
                          })}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{g.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {g.level && (
                                  <Badge variant="secondary" className="text-[10px]">{g.level.replace(/_/g, " ")}</Badge>
                                )}
                                <Badge variant={g.course_type === "private" ? "destructive" : "outline"} className="text-[10px]">
                                  {g.course_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {dayName} {timeStr && `· ${timeStr}`}
                                  {g.timezone && ` · ${g.timezone.replace(/_/g, " ")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={activeMembers.length >= g.capacity ? "default" : "outline"} className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {activeMembers.length}/{g.capacity}
                              {waitlistMembers.length > 0 && ` (+${waitlistMembers.length} waitlist)`}
                            </Badge>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => openEditGroup(g)} title="Edit group">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openManageStudents(g)} title="Manage students">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteGroup(g.id)} title="Delete group">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded: student list */}
                        {isExpanded && (
                          <div className="p-3 border-t space-y-1.5">
                            {g.members.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">No students in this group.</p>
                            ) : (
                              g.members.map(m => (
                                <div key={m.user_id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                                      <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
                                        {(m.name || "?").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                                      <p className="text-[11px] text-muted-foreground">{m.email}</p>
                                    </div>
                                  </div>
                                  <Badge variant={m.member_status === "active" ? "secondary" : "outline"} className="text-[10px]">
                                    {m.member_status}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Group Dialog ── */}
      <Dialog open={editGroupDialog} onOpenChange={setEditGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Group Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Group name" />
            </div>
            {editingGroup && (
              <div className="flex flex-wrap gap-2">
                {editingGroup.level && <Badge variant="secondary">{editingGroup.level.replace(/_/g, " ")}</Badge>}
                {editingGroup.day_of_week >= 0 && <Badge variant="outline">{DAY_NAMES[editingGroup.day_of_week]}</Badge>}
                {editingGroup.start_time && <Badge variant="outline">{formatStartTime(editingGroup.start_time)}</Badge>}
                <span className="text-xs text-muted-foreground">(Level/day/time inherited from schedule package)</span>
              </div>
            )}
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} placeholder="Max students" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroupDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={!editName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Students Dialog ── */}
      <Dialog open={manageStudentsDialog} onOpenChange={setManageStudentsDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {managingGroup?.name} — Students
              {managingGroup?.level && <Badge variant="secondary">{managingGroup.level.replace(/_/g, " ")}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {/* Current members */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Current Members ({groupMembers.length})</Label>
            {groupMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No students in this group yet.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {groupMembers.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.member_status === "active" ? "secondary" : "outline"} className="text-[10px]">
                        {m.member_status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudentFromGroup(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add students */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-sm font-semibold">Add Students</Label>
            <Input
              placeholder="Search by name or email..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">No available students found.</p>
              ) : (
                filteredAvailable.slice(0, 20).map(s => (
                  <div key={s.user_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddStudentToGroup(s)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupAttendanceManager;
