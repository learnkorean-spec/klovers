import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Users, Trash2, Bell, RefreshCw, ArrowRight } from "lucide-react";
import AdminNotifications from "./AdminNotifications";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEVELS = ["beginner_1", "beginner_2", "intermediate_1", "intermediate_2", "advanced_1", "advanced_2", "topik_1", "topik_2"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Package {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  is_active: boolean;
  member_count?: number;
}

interface PkgGroup {
  id: string;
  package_id: string;
  name: string;
  capacity: number;
  active_count?: number;
  waitlist_count?: number;
}

interface GroupMember {
  group_id: string;
  user_id: string;
  member_status: string;
  profiles?: { name: string; email: string } | null;
}

interface WaitlistRow {
  group_id: string;
  user_id: string;
  member_status: string;
  profiles?: { name: string; email: string } | null;
  preferredPackage?: Package | null;
  alternatives?: Package[];
}

// ─── Packages Manager ────────────────────────────────────────────────────────

const PackagesManager = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  // Form state
  const [fLevel, setFLevel] = useState("beginner_1");
  const [fDay, setFDay] = useState(5);
  const [fTime, setFTime] = useState("18:00");
  const [fDuration, setFDuration] = useState(90);
  const [fTimezone, setFTimezone] = useState("Africa/Cairo");
  const [fCapacity, setFCapacity] = useState(5);
  const [fActive, setFActive] = useState(true);

  const fetchPackages = async () => {
    setLoading(true);
    const { data: pkgs } = await (supabase as any).from("schedule_packages").select("*").order("level").order("day_of_week");
    const list: Package[] = pkgs || [];

    // Count members per package via groups
    const pkgIds = list.map((p) => p.id);
    if (pkgIds.length > 0) {
      const { data: groups } = await (supabase as any).from("pkg_groups").select("id, package_id").in("package_id", pkgIds);
      const groupIds = (groups || []).map((g: any) => g.id);
      if (groupIds.length > 0) {
        const { data: members } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").in("group_id", groupIds);
        const pkgCount: Record<string, number> = {};
        const groupPkg: Record<string, string> = {};
        (groups || []).forEach((g: any) => { groupPkg[g.id] = g.package_id; });
        (members || []).filter((m: any) => m.member_status === "active").forEach((m: any) => {
          const pid = groupPkg[m.group_id];
          if (pid) pkgCount[pid] = (pkgCount[pid] || 0) + 1;
        });
        list.forEach((p) => { p.member_count = pkgCount[p.id] || 0; });
      }
    }

    setPackages(list);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFLevel("beginner_1"); setFDay(5); setFTime("18:00"); setFDuration(90);
    setFTimezone("Africa/Cairo"); setFCapacity(5); setFActive(true);
    setShowForm(true);
  };

  const openEdit = (p: Package) => {
    setEditing(p);
    setFLevel(p.level); setFDay(p.day_of_week); setFTime(p.start_time.slice(0, 5));
    setFDuration(p.duration_min); setFTimezone(p.timezone); setFCapacity(p.capacity); setFActive(p.is_active);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload: any = {
      level: fLevel, day_of_week: fDay, start_time: fTime, duration_min: fDuration,
      timezone: fTimezone, capacity: fCapacity, is_active: fActive,
    };
    const { error } = editing
      ? await (supabase as any).from("schedule_packages").update(payload).eq("id", editing.id)
      : await (supabase as any).from("schedule_packages").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Package updated" : "Package created" });
    setShowForm(false);
    fetchPackages();
  };

  const handleToggleActive = async (p: Package) => {
    await (supabase as any).from("schedule_packages").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchPackages();
  };

  const handleAddGroup = async (p: Package) => {
    const defaultName = `${p.level.replace("_", " ")} – ${DAY_NAMES[p.day_of_week]} ${formatTime(p.start_time)}`;
    const { error } = await (supabase as any).from("pkg_groups").insert({
      package_id: p.id,
      name: defaultName,
      capacity: p.capacity,
    });
    if (error) {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group created", description: `"${defaultName}" added to Groups tab.` });
  };

  const displayed = packages.filter((p) => {
    const lvl = filterLevel === "all" || p.level === filterLevel;
    const act = filterActive === "all" || (filterActive === "active" ? p.is_active : !p.is_active);
    return lvl && act;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Package</Button>
      </div>

      {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
        <div className="border rounded-xl overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline">{p.level.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{DAY_NAMES[p.day_of_week]}</TableCell>
                  <TableCell>{formatTime(p.start_time)}</TableCell>
                  <TableCell>{p.duration_min}min</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.timezone.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{p.member_count ?? 0}/{p.capacity}</span>
                    {(p.member_count ?? 0) >= p.capacity && <Badge variant="destructive" className="ml-2 text-xs">Full</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAddGroup(p)} title="Create a group for this package">
                      <Plus className="h-4 w-4 mr-1" /> Add Group
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(p)}>
                      {p.is_active ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle>
            <DialogDescription>Configure schedule package details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={fLevel} onValueChange={setFLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={String(fDay)} onValueChange={(v) => setFDay(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input value={fTime} onChange={(e) => setFTime(e.target.value)} placeholder="18:00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={fDuration} onChange={(e) => setFDuration(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={fCapacity} onChange={(e) => setFCapacity(Number(e.target.value))} min={1} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={fTimezone} onChange={(e) => setFTimezone(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={fActive} onCheckedChange={setFActive} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Save Changes" : "Create Package"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Groups Manager ───────────────────────────────────────────────────────────

const GroupsManager = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [groups, setGroups] = useState<PkgGroup[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PkgGroup | null>(null);
  const [gName, setGName] = useState("");
  const [gCapacity, setGCapacity] = useState(5);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any).from("schedule_packages").select("*").eq("is_active", true).order("level").order("day_of_week");
      setPackages(data || []);
    };
    fetch();
  }, []);

  const fetchGroups = async (pkgId: string) => {
    setLoading(true);
    const { data: grps } = await (supabase as any).from("pkg_groups").select("*").eq("package_id", pkgId);
    const list: PkgGroup[] = (grps || []).map((g: any) => ({ ...g, active_count: 0, waitlist_count: 0 }));
    const gIds = list.map((g) => g.id);
    if (gIds.length > 0) {
      const { data: mems } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").in("group_id", gIds);
      (mems || []).forEach((m: any) => {
        const g = list.find((x) => x.id === m.group_id);
        if (!g) return;
        if (m.member_status === "active") g.active_count = (g.active_count || 0) + 1;
        if (m.member_status === "waitlist") g.waitlist_count = (g.waitlist_count || 0) + 1;
      });
    }
    setGroups(list);
    setLoading(false);
  };

  const fetchMembers = async (groupId: string) => {
    const { data: mems } = await (supabase as any).from("pkg_group_members").select("group_id, user_id, member_status").eq("group_id", groupId);
    if (!mems || mems.length === 0) { setMembers([]); return; }
    const userIds = mems.map((m: any) => m.user_id);
    const { data: profiles } = await (supabase as any).from("profiles").select("user_id, name, email").in("user_id", userIds);
    const profMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profMap[p.user_id] = p; });
    setMembers(mems.map((m: any) => ({ ...m, profiles: profMap[m.user_id] || null })));
  };

  const handlePkgChange = (pkgId: string) => {
    setSelectedPkg(pkgId);
    setExpandedGroup(null);
    setGroups([]);
    fetchGroups(pkgId);
  };

  const handleExpandGroup = (groupId: string) => {
    if (expandedGroup === groupId) { setExpandedGroup(null); return; }
    setExpandedGroup(groupId);
    fetchMembers(groupId);
  };

  const openGroupCreate = () => {
    setEditingGroup(null); setGName(""); setGCapacity(5); setShowGroupForm(true);
  };

  const openGroupEdit = (g: PkgGroup) => {
    setEditingGroup(g); setGName(g.name); setGCapacity(g.capacity); setShowGroupForm(true);
  };

  const handleSaveGroup = async () => {
    if (!selectedPkg) return;
    const payload: any = { name: gName, capacity: gCapacity };
    const { error } = editingGroup
      ? await (supabase as any).from("pkg_groups").update(payload).eq("id", editingGroup.id)
      : await (supabase as any).from("pkg_groups").insert({ ...payload, package_id: selectedPkg });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingGroup ? "Group updated" : "Group created" });
    setShowGroupForm(false);
    fetchGroups(selectedPkg);
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    await (supabase as any).from("pkg_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    toast({ title: "Member removed" });
    fetchMembers(groupId);
    fetchGroups(selectedPkg);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedPkg} onValueChange={handlePkgChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a package..." />
          </SelectTrigger>
          <SelectContent>
            {packages.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.level.replace("_", " ")} · {DAY_NAMES[p.day_of_week]} {formatTime(p.start_time)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPkg && (
          <Button size="sm" onClick={openGroupCreate}><Plus className="h-4 w-4 mr-1" /> New Group</Button>
        )}
      </div>

      {!selectedPkg && <p className="text-muted-foreground text-center py-8">Select a package to manage its groups.</p>}
      {loading && <p className="text-muted-foreground text-center py-8">Loading...</p>}

      {selectedPkg && !loading && groups.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No groups yet. Create one above.</p>
      )}

      {groups.map((g) => (
        <Card key={g.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm">{g.name}</CardTitle>
                <span className="text-xs text-muted-foreground font-mono">{g.active_count}/{g.capacity} active</span>
                {(g.waitlist_count || 0) > 0 && <Badge variant="secondary" className="text-xs">{g.waitlist_count} waitlisted</Badge>}
                {(g.active_count || 0) >= g.capacity && <Badge variant="destructive" className="text-xs">Full</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openGroupEdit(g)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleExpandGroup(g.id)}>
                  <Users className="h-4 w-4 mr-1" /> {expandedGroup === g.id ? "Hide" : "Members"}
                </Button>
              </div>
            </div>
          </CardHeader>
          {expandedGroup === g.id && (
            <CardContent>
              {members.filter((m) => m.group_id === g.id).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-3">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.filter((m) => m.group_id === g.id).map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.profiles?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{m.profiles?.email || m.user_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.member_status === "active" ? "default" : "secondary"} className="text-xs">{m.member_status}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(g.id, m.user_id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      <Dialog open={showGroupForm} onOpenChange={setShowGroupForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "New Group"}</DialogTitle>
            <DialogDescription>Create or edit a group within the selected package.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="e.g. Beginner A" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={gCapacity} onChange={(e) => setGCapacity(Number(e.target.value))} min={1} />
            </div>
            <Button className="w-full" onClick={handleSaveGroup}>{editingGroup ? "Save Changes" : "Create Group"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Waitlist Manager ─────────────────────────────────────────────────────────

const WaitlistManager = () => {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    setLoading(true);
    const { data: waitlist } = await (supabase as any)
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .eq("member_status", "waitlist");

    const wl: WaitlistRow[] = waitlist || [];
    if (wl.length === 0) { setRows([]); setLoading(false); return; }

    const userIds = wl.map((r) => r.user_id);
    const [profilesRes, prefsRes] = await Promise.all([
      (supabase as any).from("profiles").select("user_id, name, email, level").in("user_id", userIds),
      (supabase as any).from("student_package_preferences").select("user_id, package_id, level").in("user_id", userIds),
    ]);

    const profMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => { profMap[p.user_id] = p; });
    const prefMap: Record<string, any> = {};
    (prefsRes.data || []).forEach((p: any) => { prefMap[p.user_id] = p; });

    // Fetch all active packages for alternatives
    const { data: allPkgs } = await (supabase as any).from("schedule_packages").select("*").eq("is_active", true);
    const pkgs: Package[] = allPkgs || [];

    // Count members per package
    const pkgIds = pkgs.map((p: Package) => p.id);
    let pkgCount: Record<string, number> = {};
    if (pkgIds.length > 0) {
      const { data: groups } = await (supabase as any).from("pkg_groups").select("id, package_id").in("package_id", pkgIds);
      const gIds = (groups || []).map((g: any) => g.id);
      const gPkg: Record<string, string> = {};
      (groups || []).forEach((g: any) => { gPkg[g.id] = g.package_id; });
      if (gIds.length > 0) {
        const { data: mems } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").in("group_id", gIds).eq("member_status", "active");
        (mems || []).forEach((m: any) => {
          const pid = gPkg[m.group_id];
          if (pid) pkgCount[pid] = (pkgCount[pid] || 0) + 1;
        });
      }
    }
    const pkgsWithSeats = pkgs.map((p: Package) => ({ ...p, member_count: pkgCount[p.id] || 0 }));

    const enriched: WaitlistRow[] = wl.map((r) => {
      const profile = profMap[r.user_id];
      const pref = prefMap[r.user_id];
      const preferredPkg = pref?.package_id ? pkgsWithSeats.find((p: Package) => p.id === pref.package_id) || null : null;
      const level = profile?.level || pref?.level || "";
      const alternatives = pkgsWithSeats.filter((p: Package) =>
        p.level === level && (p.member_count || 0) < p.capacity && p.id !== pref?.package_id
      ).slice(0, 4);

      return { ...r, profiles: profile || null, preferredPackage: preferredPkg, alternatives };
    });

    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchWaitlist(); }, []);

  const handleAssign = async (userId: string, packageId: string) => {
    setAssigning(userId);
    // Update preference then call RPC
    await (supabase as any).from("student_package_preferences").upsert({ user_id: userId, package_id: packageId }, { onConflict: "user_id" });

    // Find enrollment
    const { data: enr } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("approval_status", "APPROVED").eq("payment_status", "PAID").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (enr) {
      await (supabase as any).rpc("assign_student_to_pkg_group", { _user_id: userId, _enrollment_id: (enr as any).id });
    }
    toast({ title: "Reassignment attempted", description: "Check group members for result." });
    setAssigning(null);
    fetchWaitlist();
  };

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading waitlist...</p>;
  if (rows.length === 0) return <p className="text-muted-foreground text-center py-8">No waitlisted students.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{rows.length} student(s) on waitlist</p>
      {rows.map((r) => (
        <Card key={`${r.group_id}-${r.user_id}`}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{r.profiles?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{r.profiles?.email || r.user_id}</p>
              </div>
              <Badge variant="secondary">Waitlisted</Badge>
            </div>
            {r.preferredPackage && (
              <p className="text-xs text-muted-foreground">
                Preferred: {r.preferredPackage.level.replace("_", " ")} · {DAY_NAMES[r.preferredPackage.day_of_week]} {formatTime(r.preferredPackage.start_time)} (Full)
              </p>
            )}
            {r.alternatives && r.alternatives.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Alternatives with seats:</p>
                {r.alternatives.map((alt) => (
                  <div key={alt.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <span className="text-xs text-foreground">
                      {alt.level.replace("_", " ")} · {DAY_NAMES[alt.day_of_week]} {formatTime(alt.start_time)}
                      <span className="text-muted-foreground ml-1">({alt.capacity - (alt.member_count || 0)} seats)</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      disabled={assigning === r.user_id}
                      onClick={() => handleAssign(r.user_id, alt.id)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" /> Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {(!r.alternatives || r.alternatives.length === 0) && (
              <p className="text-xs text-destructive">No alternatives available at same level.</p>
            )}
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={fetchWaitlist}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SchedulingManager = () => {
  return (
    <Tabs defaultValue="packages">
      <TabsList className="mb-4">
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="groups">Groups</TabsTrigger>
        <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="packages"><PackagesManager /></TabsContent>
      <TabsContent value="groups"><GroupsManager /></TabsContent>
      <TabsContent value="waitlist"><WaitlistManager /></TabsContent>
      <TabsContent value="notifications"><AdminNotifications /></TabsContent>
    </Tabs>
  );
};

export default SchedulingManager;
