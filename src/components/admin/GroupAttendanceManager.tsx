import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCheck, RefreshCw, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Group {
  id: string;
  name: string;
  schedule_day?: string | null;
  schedule_time?: string | null;
  schedule_timezone?: string | null;
  level?: string | null;
  capacity?: number | null;
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

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;

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

  useEffect(() => {
    supabase.from("student_groups").select("id, name, schedule_day, schedule_time, schedule_timezone, level, capacity").order("name").then(({ data }) => {
      if (data) setGroups(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setSessions([]); return; }
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
    // Admin directly sets status + auto-approves "present"
    const isPresent = newStatus === "present";
    const { error } = await supabase
      .from("group_attendance")
      .update({ status: newStatus, source: "admin", admin_approved: isPresent } as any)
      .eq("id", attId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // If marking present, also deduct class via RPC
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

  const presentCount = attendanceRows.filter(r => r.status === "present").length;
  const totalCount = attendanceRows.length;

  return (
    <div className="space-y-4">
      {/* Session Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Group Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                g.schedule_day && `📅 ${g.schedule_day}`,
                g.schedule_time && `🕐 ${g.schedule_time}`,
                g.schedule_timezone && `🌍 ${g.schedule_timezone}`,
                g.level && `📚 ${g.level}`,
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

            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
            </div>
            <div className="flex items-end">
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
                {/* Student avatar grid — click to toggle present/absent */}
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
    </div>
  );
};

export default GroupAttendanceManager;
