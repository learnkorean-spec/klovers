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
import { Plus, CheckCheck, RefreshCw, UserCheck, UserX, Pencil, Users, Trash2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupPackageInfo {
  package_id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  timezone: string | null;
}

interface Group {
  id: string;
  name: string;
  schedule_day?: string | null;
  schedule_time?: string | null;
  schedule_timezone?: string | null;
  level?: string | null;
  capacity?: number | null;
  course_type?: string | null;
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

interface StudentProfile {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  level?: string;
}

interface GroupMember {
  student_id: string;
  full_name: string;
  email: string;
  group_name: string | null;
}

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;
const LEVELS = ["Beginner", "Elementary", "Intermediate", "Advanced"];

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

  // Group management state
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  // Student assignment state
  const [manageStudentsDialog, setManageStudentsDialog] = useState(false);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<GroupMember[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [adminWeekdays, setAdminWeekdays] = useState<string[]>([]);
  const [adminTimes, setAdminTimes] = useState<string[]>([]);

  const fetchGroups = async () => {
    const { data } = await supabase.from("student_groups").select("id, name, schedule_day, schedule_time, schedule_timezone, level, capacity, course_type").order("name");
    if (data) setGroups(data);
  };

  // Fetch available days from schedule_packages + time windows from schedule_options
  useEffect(() => {
    supabase
      .from("schedule_packages" as any)
      .select("day_of_week")
      .eq("is_active", true)
      .then(({ data }) => {
        const rows = (data as any[]) ?? [];
        const uniqueDays = [...new Set(rows.map((r: any) => r.day_of_week as number))].sort();
        setAdminWeekdays(uniqueDays.map(n => DAY_NAMES[n]));
      });
    supabase
      .from("schedule_options" as any)
      .select("label, sort_order")
      .eq("is_active", true)
      .eq("category", "time_window")
      .order("sort_order")
      .then(({ data }) => {
        const rows = (data as any[]) ?? [];
        setAdminTimes(rows.map(r => r.label as string));
      });
  }, []);

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setSessions([]);
      setGroupPackageInfo(null);
      return;
    }

    // Fetch pkg_groups → schedule_packages for date restriction
    supabase
      .from("pkg_groups")
      .select("package_id, schedule_packages(day_of_week, start_time, timezone)")
      .eq("id", selectedGroup)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data as any).schedule_packages) {
          const pkg = (data as any).schedule_packages;
          setGroupPackageInfo({
            package_id: (data as any).package_id,
            day_of_week: pkg.day_of_week,
            start_time: pkg.start_time,
            timezone: pkg.timezone,
          });
          // Auto-jump to next valid date
          const next = nextOccurrenceOf(pkg.day_of_week);
          setSessionDate(format(next, "yyyy-MM-dd"));
        } else {
          // Fallback: parse legacy student_groups.schedule_day string
          const group = groups.find(g => g.id === selectedGroup);
          if (group?.schedule_day) {
            const idx = DAY_NAMES.indexOf(group.schedule_day);
            if (idx !== -1) {
              setGroupPackageInfo({
                package_id: null,
                day_of_week: idx,
                start_time: group.schedule_time ?? null,
                timezone: group.schedule_timezone ?? null,
              });
              const next = nextOccurrenceOf(idx);
              setSessionDate(format(next, "yyyy-MM-dd"));
            } else {
              setGroupPackageInfo(null);
            }
          } else {
            setGroupPackageInfo(null);
          }
        }
      });

    supabase
      .from("group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data as Session[]);
      });

  }, [selectedGroup]);

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
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string; avatar_url: string }> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = { name: p.name, email: p.email, avatar_url: p.avatar_url || "" }; });

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

    const group = groups.find(g => g.id === selectedGroup);
    if (!group) { setCreating(false); return; }

    const { data: students } = await supabase
      .from("students")
      .select("email")
      .eq("group_name", group.name);

    if (students && students.length > 0) {
      const emails = students.map((s: any) => s.email.toLowerCase());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");

      const matchedUserIds = (profiles || [])
        .filter((p: any) => emails.includes(p.email.toLowerCase()))
        .map((p: any) => p.user_id);

      if (matchedUserIds.length > 0) {
        const rows = matchedUserIds.map((uid: string) => ({
          session_id: (session as any).id,
          user_id: uid,
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

  // ── Group editing ──
  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditLevel(group.level || "");
    setEditDay(group.schedule_day || "");
    setEditTime(group.schedule_time || "");
    setEditCapacity(String(group.capacity ?? ""));
    setEditGroupDialog(true);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editName.trim()) return;
    const oldName = editingGroup.name;
    const { error } = await supabase
      .from("student_groups")
      .update({
        name: editName.trim(),
        level: editLevel || null,
        schedule_day: editDay || null,
        schedule_time: editTime || null,
        capacity: editCapacity ? parseInt(editCapacity) : null,
      } as any)
      .eq("id", editingGroup.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update students table group_name if name changed
    if (oldName !== editName.trim()) {
      await supabase
        .from("students")
        .update({ group_name: editName.trim() } as any)
        .eq("group_name", oldName);
    }

    toast({ title: "Group updated" });
    setEditGroupDialog(false);
    fetchGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    const { error } = await supabase.from("student_groups").delete().eq("id", groupId);
    if (error) {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted" });
      fetchGroups();
    }
  };

  // ── Student assignment ──
  const openManageStudents = async (group: Group) => {
    setManagingGroup(group);
    setStudentSearch("");

    // Fetch current members
    const { data: members } = await supabase
      .from("students")
      .select("id, full_name, email, group_name")
      .eq("group_name", group.name)
      .order("full_name");

    setGroupMembers((members || []).map((m: any) => ({
      student_id: m.id,
      full_name: m.full_name,
      email: m.email,
      group_name: m.group_name,
    })));

    // Fetch available students (not in this group)
    const { data: allStudents } = await supabase
      .from("students")
      .select("id, full_name, email, group_name")
      .or(`group_name.is.null,group_name.eq.,group_name.neq.${group.name}`)
      .order("full_name");

    setAvailableStudents((allStudents || []).map((s: any) => ({
      student_id: s.id,
      full_name: s.full_name,
      email: s.email,
      group_name: s.group_name,
    })));

    setManageStudentsDialog(true);
  };

  const handleAddStudentToGroup = async (student: GroupMember) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("students")
      .update({ group_name: managingGroup.name } as any)
      .eq("id", student.student_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setGroupMembers(prev => [...prev, { ...student, group_name: managingGroup.name }]);
    setAvailableStudents(prev => prev.filter(s => s.student_id !== student.student_id));
    toast({ title: `${student.full_name} added to ${managingGroup.name}` });
  };

  const handleRemoveStudentFromGroup = async (student: GroupMember) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("students")
      .update({ group_name: "" } as any)
      .eq("id", student.student_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setAvailableStudents(prev => [...prev, { ...student, group_name: null }]);
    setGroupMembers(prev => prev.filter(s => s.student_id !== student.student_id));
    toast({ title: `${student.full_name} removed from ${managingGroup.name}` });
  };

  const filteredAvailable = availableStudents.filter(s =>
    !studentSearch ||
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
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
                          const schedule = [g.schedule_day, g.schedule_time].filter(Boolean).join(" · ");
                          return (
                            <SelectItem key={g.id} value={g.id}>
                              <span className="font-medium">{g.name}</span>
                              {g.level && <Badge variant="secondary" className="ml-2 text-[10px] py-0">{g.level}</Badge>}
                              {schedule && <span className="text-muted-foreground ml-2 text-xs">({schedule})</span>}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroup && (() => {
                    const g = groups.find(gr => gr.id === selectedGroup);
                    if (!g) return null;
                    const infoParts = [
                      g.level && `📚 ${g.level}`,
                      g.schedule_day && `📅 ${g.schedule_day}`,
                      g.schedule_time && `🕐 ${g.schedule_time}`,
                      g.schedule_timezone && `🌍 ${g.schedule_timezone}`,
                      g.capacity != null && `👥 ${g.capacity} seats`,
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No groups yet.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium text-foreground">{g.name}</TableCell>
                          <TableCell>
                            {g.level ? <Badge variant="secondary">{g.level}</Badge> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[g.schedule_day, g.schedule_time].filter(Boolean).join(" · ") || "—"}
                          </TableCell>
                          <TableCell>{g.capacity ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={editLevel} onValueChange={setEditLevel}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Day</Label>
                {adminWeekdays.length > 0 ? (
                  <Select value={editDay} onValueChange={setEditDay}>
                    <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {adminWeekdays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={editDay} onChange={e => setEditDay(e.target.value)} placeholder="e.g. Monday" />
                )}
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                {adminTimes.length > 0 ? (
                  <Select value={editTime} onValueChange={setEditTime}>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {adminTimes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="e.g. 18:00" />
                )}
              </div>
            </div>
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
              {managingGroup?.level && <Badge variant="secondary">{managingGroup.level}</Badge>}
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
                  <div key={m.student_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudentFromGroup(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                  <div key={s.student_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.email}
                        {s.group_name && <span className="ml-1 text-muted-foreground/70">({s.group_name})</span>}
                      </p>
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
