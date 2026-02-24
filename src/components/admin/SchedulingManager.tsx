import { useState, useEffect, useCallback } from "react";
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
import { Plus, Pencil, Users, Trash2, Bell, RefreshCw, ArrowRight, AlertTriangle, Check, X, ChevronDown, ChevronRight, UserPlus, Search } from "lucide-react";
import AdminNotifications from "./AdminNotifications";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
import { LEVEL_KEYS } from "@/constants/levels";
const LEVELS = LEVEL_KEYS;

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
  course_type: string;
  member_count?: number;
  waitlist_count?: number;
  total_capacity?: number;
  seats_left?: number;
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

const PackagesManager = ({ onSwitchToGroups }: { onSwitchToGroups?: () => void }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkgHasGroup, setPkgHasGroup] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  // Form state
  const [fLevel, setFLevel] = useState(LEVELS[0]);
  const [fDay, setFDay] = useState(5);
  const [fTime, setFTime] = useState("18:00");
  const [fDuration, setFDuration] = useState(90);
  const [fTimezone, setFTimezone] = useState("Africa/Cairo");
  const [fCapacity, setFCapacity] = useState(5);
  const [fActive, setFActive] = useState(true);
  const [fCourseType, setFCourseType] = useState("group");

  const fetchPackages = async () => {
    setLoading(true);
    const { data: pkgs } = await (supabase as any).from("schedule_packages").select("*").order("level").order("day_of_week");
    const list: Package[] = pkgs || [];

    // Count members per package via groups
    const pkgIds = list.map((p) => p.id);
    if (pkgIds.length > 0) {
      const { data: groups } = await (supabase as any).from("pkg_groups").select("id, package_id, capacity").in("package_id", pkgIds).eq("is_active", true);
      const groupIds = (groups || []).map((g: any) => g.id);

      // Track which packages have active groups
      const hasGroupMap: Record<string, boolean> = {};
      (groups || []).forEach((g: any) => { hasGroupMap[g.package_id] = true; });
      setPkgHasGroup(hasGroupMap);

      // Calculate total capacity per package (sum of group capacities)
      const pkgTotalCapacity: Record<string, number> = {};
      (groups || []).forEach((g: any) => {
        pkgTotalCapacity[g.package_id] = (pkgTotalCapacity[g.package_id] || 0) + (g.capacity || 0);
      });

      if (groupIds.length > 0) {
        const { data: members } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").in("group_id", groupIds);
        const pkgCount: Record<string, number> = {};
        const pkgWaitlist: Record<string, number> = {};
        const groupPkg: Record<string, string> = {};
        (groups || []).forEach((g: any) => { groupPkg[g.id] = g.package_id; });
        (members || []).forEach((m: any) => {
          const pid = groupPkg[m.group_id];
          if (pid) {
            if (m.member_status === "active") pkgCount[pid] = (pkgCount[pid] || 0) + 1;
            if (m.member_status === "waitlist") pkgWaitlist[pid] = (pkgWaitlist[pid] || 0) + 1;
          }
        });
        list.forEach((p) => {
          p.member_count = pkgCount[p.id] || 0;
          p.waitlist_count = pkgWaitlist[p.id] || 0;
          p.total_capacity = pkgTotalCapacity[p.id] || p.capacity;
          p.seats_left = Math.max(0, (p.total_capacity || p.capacity) - (p.member_count || 0));
        });
      } else {
        list.forEach((p) => {
          p.total_capacity = pkgTotalCapacity[p.id] || p.capacity;
          p.seats_left = p.total_capacity;
        });
      }
    }

    setPackages(list);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFLevel(LEVELS[0]); setFDay(5); setFTime("18:00"); setFDuration(90);
    setFTimezone("Africa/Cairo"); setFCapacity(5); setFActive(true); setFCourseType("group");
    setShowForm(true);
  };

  const openEdit = (p: Package) => {
    setEditing(p);
    setFLevel(p.level); setFDay(p.day_of_week); setFTime(p.start_time.slice(0, 5));
    setFDuration(p.duration_min); setFTimezone(p.timezone); setFCapacity(p.capacity); setFActive(p.is_active); setFCourseType(p.course_type || "group");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (fCourseType === "private") {
      // PRIVATE: Block if the selected day has ANY active group slot
      const { data: groupSlots } = await (supabase as any)
        .from("schedule_packages")
        .select("day_of_week")
        .eq("is_active", true)
        .neq("course_type", "private");

      const courseDayIndices = new Set((groupSlots || []).map((s: any) => s.day_of_week));

      if (courseDayIndices.has(fDay)) {
        const availableDays = DAY_NAMES
          .map((name, i) => ({ name, i }))
          .filter(({ i }) => !courseDayIndices.has(i))
          .map(({ name }) => name);

        toast({
          title: "Private classes not available on this day",
          description: `Private classes are not available on ${DAY_NAMES[fDay]} — group classes run on that day.${
            availableDays.length > 0
              ? ` Available days for private: ${availableDays.join(", ")}.`
              : " All weekdays currently have group classes."
          }`,
          variant: "destructive",
        });
        return;
      }

      // Also check exact time conflict with other private slots
      const { data: existingPrivate } = await (supabase as any)
        .from("schedule_packages")
        .select("id")
        .eq("day_of_week", fDay)
        .eq("start_time", fTime)
        .eq("course_type", "private")
        .eq("is_active", true);

      const isDupe = (existingPrivate || []).some(
        (s: any) => !editing || s.id !== editing.id
      );

      if (isDupe) {
        toast({
          title: "Slot already exists",
          description: `A private slot already exists on ${DAY_NAMES[fDay]} at ${fTime}.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // GROUP: Check for duplicate level + day + time (skip if editing the same slot)
      const { data: existing } = await (supabase as any)
        .from("schedule_packages")
        .select("id, day_of_week, course_type")
        .eq("level", fLevel)
        .eq("day_of_week", fDay)
        .eq("start_time", fTime)
        .neq("course_type", "private");

      const isDuplicate = (existing || []).some(
        (s: any) => !editing || s.id !== editing.id
      );

      if (isDuplicate) {
        // Find which days already have this level+time (excluding private)
        const { data: allSlots } = await (supabase as any)
          .from("schedule_packages")
          .select("day_of_week")
          .eq("level", fLevel)
          .eq("start_time", fTime)
          .neq("course_type", "private");
        const takenDays = new Set((allSlots || []).map((s: any) => s.day_of_week));
        const availableDays = DAY_NAMES
          .map((name, i) => ({ name, i }))
          .filter(({ i }) => !takenDays.has(i))
          .map(({ name }) => name);

        toast({
          title: "Slot already exists",
          description: `A slot for "${fLevel.replace("_", " ")}" at ${fTime} already exists on ${DAY_NAMES[fDay]}.${
            availableDays.length > 0
              ? ` Available days: ${availableDays.join(", ")}.`
              : " All days are taken for this level and time."
          }`,
          variant: "destructive",
        });
        return;
      }
    }

    const payload: any = {
      level: fLevel, day_of_week: fDay, start_time: fTime, duration_min: fDuration,
      timezone: fTimezone, capacity: fCapacity, is_active: fActive, course_type: fCourseType,
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
    // Check if an active group already exists for this package
    const { data: existing } = await (supabase as any).from("pkg_groups").select("id").eq("package_id", p.id).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      toast({ title: "Group already exists", description: "This package already has an active group.", variant: "destructive" });
      return;
    }
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
    fetchPackages();
  };

  const handleDeletePackage = async (p: Package) => {
    if (!confirm(`Delete this slot? (${p.level.replace("_", " ")} – ${DAY_NAMES[p.day_of_week]} ${formatTime(p.start_time)})\n\nThis will also deactivate any groups linked to it.`)) return;
    // Deactivate linked groups first
    await (supabase as any).from("pkg_groups").update({ is_active: false }).eq("package_id", p.id);
    const { error } = await (supabase as any).from("schedule_packages").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot deleted" });
    fetchPackages();
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
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Slot</Button>
      </div>

      {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
        <div className="border rounded-xl overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Active / Capacity</TableHead>
                <TableHead>Seats Left</TableHead>
                <TableHead>Waitlist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((p) => {
                const seatsLeft = p.seats_left ?? (p.capacity - (p.member_count ?? 0));
                const needsGroup = (p.waitlist_count ?? 0) > 0 || seatsLeft <= 0;
                return (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline">{p.level.replace("_", " ")}</Badge></TableCell>
                  <TableCell><Badge variant={p.course_type === "private" ? "destructive" : "secondary"}>{p.course_type || "group"}</Badge></TableCell>
                  <TableCell>{DAY_NAMES[p.day_of_week]}</TableCell>
                  <TableCell>{formatTime(p.start_time)}</TableCell>
                  <TableCell>{p.duration_min}min</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.timezone.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{p.member_count ?? 0}/{p.total_capacity ?? p.capacity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={seatsLeft > 2 ? "secondary" : seatsLeft > 0 ? "default" : "destructive"} className="text-xs">
                      {seatsLeft}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(p.waitlist_count ?? 0) > 0 ? (
                      <Badge variant="destructive" className="text-xs">{p.waitlist_count} waiting</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                      {needsGroup && !pkgHasGroup[p.id] && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Add group
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    {pkgHasGroup[p.id] ? (
                      <Button variant="ghost" size="sm" onClick={() => onSwitchToGroups?.()} title="View group in Groups tab">
                        <Users className="h-4 w-4 mr-1" /> View Group
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleAddGroup(p)} title="Create a group for this package">
                        <Plus className="h-4 w-4 mr-1" /> Add Group
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(p)}>
                      {p.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeletePackage(p)} title="Delete slot">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Slot" : "New Slot"}</DialogTitle>
            <DialogDescription>Configure teacher available slot details.</DialogDescription>
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
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={fCourseType} onValueChange={setFCourseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={fActive} onCheckedChange={setFActive} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Save Changes" : "Create Slot"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Types for enriched groups ────────────────────────────────────────────────

interface EnrichedGroup {
  id: string;
  package_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  // From parent package
  level: string;
  course_type: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  // Computed
  members: GroupMember[];
  active_count: number;
  waitlist_count: number;
}

// ─── Groups Manager ───────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
  source: "registered" | "lead";
  already_in_group?: boolean;
}

const GroupsManager = () => {
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Add group dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPkgId, setAddPkgId] = useState("");
  const [addName, setAddName] = useState("");
  const [addCapacity, setAddCapacity] = useState(5);

  // Add student dialog
  const [addStudentGroupId, setAddStudentGroupId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // 1. Fetch all active groups with package info
    const [grpRes, pkgRes] = await Promise.all([
      (supabase as any).from("pkg_groups").select("*").eq("is_active", true),
      (supabase as any).from("schedule_packages").select("*").order("level").order("day_of_week"),
    ]);

    const rawGroups: any[] = grpRes.data || [];
    const pkgs: Package[] = pkgRes.data || [];
    setPackages(pkgs);
    const pkgMap: Record<string, Package> = {};
    pkgs.forEach((p) => { pkgMap[p.id] = p; });

    if (rawGroups.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // 2. Fetch all members for those groups
    const groupIds = rawGroups.map((g) => g.id);
    const { data: allMembers } = await (supabase as any)
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .in("group_id", groupIds);

    // 3. Fetch profiles for all member user_ids
    const userIds = [...new Set((allMembers || []).map((m: any) => m.user_id))];
    let profMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      (profiles || []).forEach((p: any) => { profMap[p.user_id] = p; });
    }

    // 4. Combine into enriched groups
    const membersByGroup: Record<string, GroupMember[]> = {};
    (allMembers || []).forEach((m: any) => {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push({
        ...m,
        profiles: profMap[m.user_id] || null,
      });
    });

    const enriched: EnrichedGroup[] = rawGroups
      .map((g) => {
        const pkg = pkgMap[g.package_id];
        const members = membersByGroup[g.id] || [];
        return {
          id: g.id,
          package_id: g.package_id,
          name: g.name,
          capacity: g.capacity,
          is_active: g.is_active,
          level: pkg?.level || "unknown",
          course_type: pkg?.course_type || "group",
          day_of_week: pkg?.day_of_week ?? 0,
          start_time: pkg?.start_time || "00:00",
          duration_min: pkg?.duration_min || 0,
          timezone: pkg?.timezone || "",
          members,
          active_count: members.filter((m) => m.member_status === "active").length,
          waitlist_count: members.filter((m) => m.member_status === "waitlist").length,
        };
      })
      .sort((a, b) => a.level.localeCompare(b.level) || a.day_of_week - b.day_of_week);

    setGroups(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sync + Clean
  const handleSyncAndClean = async () => {
    setSyncing(true);
    try {
      const { data: cleanResult, error: cleanErr } = await (supabase as any).rpc("cleanup_pkg_groups");
      if (cleanErr) throw cleanErr;
      const { data: created, error: syncErr } = await (supabase as any).rpc("ensure_pkg_groups_for_packages");
      if (syncErr) throw syncErr;
      const result = cleanResult as { disabled: number; deleted: number; merged: number } | null;
      toast({
        title: "Sync complete",
        description: `Disabled ${result?.disabled ?? 0}, merged ${result?.merged ?? 0}, deleted ${result?.deleted ?? 0}, created ${created ?? 0} missing.`,
      });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Inline name edit
  const startEditName = (g: EnrichedGroup) => {
    setEditingNameId(g.id);
    setEditNameValue(g.name);
  };

  const saveEditName = async (groupId: string) => {
    if (!editNameValue.trim()) return;
    const { error } = await (supabase as any).from("pkg_groups").update({ name: editNameValue.trim() }).eq("id", groupId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: editNameValue.trim() } : g));
      toast({ title: "Group renamed" });
    }
    setEditingNameId(null);
  };

  const cancelEditName = () => setEditingNameId(null);

  // Toggle expand
  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Remove member
  const handleRemoveMember = async (groupId: string, userId: string) => {
    await (supabase as any).from("pkg_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    toast({ title: "Member removed" });
    fetchAll();
  };

  // Delete group
  const handleDeleteGroup = async (g: EnrichedGroup) => {
    if (!confirm(`Delete group "${g.name}"?\n\nThis will remove all ${g.members.length} member(s) from this group.`)) return;
    // Delete members first
    await (supabase as any).from("pkg_group_members").delete().eq("group_id", g.id);
    // Deactivate (soft-delete) the group
    const { error } = await (supabase as any).from("pkg_groups").update({ is_active: false }).eq("id", g.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted" });
      fetchAll();
    }
  };

  // Add group
  const openAddGroup = () => {
    setAddPkgId("");
    setAddName("");
    setAddCapacity(5);
    setShowAddDialog(true);
  };

  const handleAddGroup = async () => {
    if (!addPkgId) return;
    // Check if an active group already exists for this package
    const { data: existing } = await (supabase as any).from("pkg_groups").select("id").eq("package_id", addPkgId).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      toast({ title: "Group already exists", description: "This package already has an active group. Each package can only have one group.", variant: "destructive" });
      return;
    }
    const pkg = packages.find((p) => p.id === addPkgId);
    const name = addName.trim() || (pkg ? `${pkg.level.replace("_", " ")} – ${DAY_NAMES[pkg.day_of_week]} ${formatTime(pkg.start_time)}` : "New Group");
    const { error } = await (supabase as any).from("pkg_groups").insert({
      package_id: addPkgId,
      name,
      capacity: addCapacity,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group created", description: `"${name}" added.` });
    setShowAddDialog(false);
    fetchAll();
  };

  // ── Add Student to Group ──────────────────────────────────────────────────
  const openAddStudent = (groupId: string) => {
    setAddStudentGroupId(groupId);
    setStudentSearch("");
    setSearchResults([]);
  };

  const handleSearchStudents = async (query: string) => {
    setStudentSearch(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);

    const term = `%${query.trim()}%`;
    const group = groups.find((g) => g.id === addStudentGroupId);
    const existingUserIds = new Set(group?.members.map((m) => m.user_id) || []);

    // Search profiles and leads in parallel
    const [profRes, leadRes] = await Promise.all([
      (supabase as any).from("profiles").select("user_id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(20),
      (supabase as any).from("leads").select("id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(20),
    ]);

    const results: SearchResult[] = [];
    const profileEmails = new Set<string>();

    // Registered users
    (profRes.data || []).forEach((p: any) => {
      profileEmails.add(p.email?.toLowerCase());
      results.push({
        id: p.user_id,
        name: p.name,
        email: p.email,
        user_id: p.user_id,
        source: "registered",
        already_in_group: existingUserIds.has(p.user_id),
      });
    });

    // Leads — try to resolve to a registered profile by email match
    for (const l of (leadRes.data || [])) {
      const emailLower = l.email?.toLowerCase();
      // Skip if already shown as a registered user
      if (profileEmails.has(emailLower)) continue;

      // Check if this lead has a matching profile (registered but not found by name/email search above)
      const { data: matchedProfiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, name, email")
        .eq("email", l.email)
        .limit(1);

      if (matchedProfiles && matchedProfiles.length > 0) {
        const mp = matchedProfiles[0];
        profileEmails.add(mp.email?.toLowerCase());
        results.push({
          id: mp.user_id,
          name: l.name || mp.name,
          email: mp.email,
          user_id: mp.user_id,
          source: "registered",
          already_in_group: existingUserIds.has(mp.user_id),
        });
      } else {
        results.push({
          id: l.id,
          name: l.name,
          email: l.email,
          user_id: null,
          source: "lead",
        });
      }
    }

    setSearchResults(results);
    setSearchLoading(false);
  };

  const handleAddStudentToGroup = async (result: SearchResult) => {
    if (!addStudentGroupId || !result.user_id) return;
    // Find the package_id for this group
    const group = groups.find((g) => g.id === addStudentGroupId);
    if (!group) return;

    // Use unified RPC to assign student to group via package
    const { data: assignResult, error } = await (supabase as any)
      .rpc("assign_student_to_group", {
        _package_id: group.package_id,
        _user_id: result.user_id,
      });

    if (error) {
      toast({ title: "Error adding student", description: error.message, variant: "destructive" });
      return;
    }

    const r = assignResult as any;
    if (r?.status === "assigned" || r?.status === "already_assigned") {
      toast({ title: "Student added", description: `${result.name} assigned to "${r.group_name}".` });
    } else if (r?.status === "waitlisted") {
      toast({ title: "Waitlisted", description: `${result.name} waitlisted — all groups full.`, variant: "destructive" });
    } else {
      toast({ title: "Error", description: `Unexpected result: ${r?.status}`, variant: "destructive" });
    }

    setSearchResults((prev) => prev.map((r) => r.id === result.id ? { ...r, already_in_group: true } : r));
    fetchAll();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">{groups.length} active group(s)</p>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleSyncAndClean} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync + Clean
        </Button>
        <Button size="sm" onClick={openAddGroup}>
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
      </div>

      {loading && <p className="text-muted-foreground text-center py-8">Loading groups...</p>}
      {!loading && groups.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No active groups. Click "Sync + Clean" to auto-create from packages.</p>
      )}

      {/* Group cards */}
      {groups.map((g) => {
        const isExpanded = expandedGroups.has(g.id);
        return (
          <Card key={g.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Editable name */}
                  <div className="flex items-center gap-2 mb-1">
                    {editingNameId === g.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="h-7 text-sm w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditName(g.id);
                            if (e.key === "Escape") cancelEditName();
                          }}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEditName(g.id)}>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelEditName}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-sm truncate">{g.name}</CardTitle>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => startEditName(g)}>
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">{g.level.replace(/_/g, " ")}</Badge>
                    <Badge variant={g.course_type === "private" ? "destructive" : "secondary"} className="text-xs">{g.course_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {DAY_NAMES[g.day_of_week]} · {formatTime(g.start_time)}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-mono">
                      {g.active_count}/{g.capacity} active
                    </span>
                    {g.active_count > 0 && g.active_count < g.capacity && (
                      <Badge className="text-xs bg-green-600 text-white hover:bg-green-600">Ongoing</Badge>
                    )}
                    {g.waitlist_count > 0 && (
                      <Badge variant="secondary" className="text-xs">{g.waitlist_count} waitlisted</Badge>
                    )}
                    {g.active_count >= g.capacity && (
                      <Badge variant="destructive" className="text-xs">Full</Badge>
                    )}
                  </div>
                </div>

                {/* Add Student + Delete + Expand toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEditName(g)} title="Edit name" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openAddStudent(g.id)} title="Add student to group" className="h-8 w-8 p-0">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteGroup(g)} title="Delete group">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(g.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Users className="h-4 w-4 ml-1" />
                    <span className="text-xs ml-1">{g.members.length}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Student roster */}
            {isExpanded && (
              <CardContent className="pt-0">
                {g.members.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-3">No students in this group.</p>
                ) : (
                  <div className="space-y-1.5">
                    {g.members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.profiles?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.profiles?.email || m.user_id}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={m.member_status === "active" ? "default" : "secondary"} className="text-xs">{m.member_status}</Badge>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRemoveMember(g.id, m.user_id)}>
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
        );
      })}

      {/* Add Group Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>Create a new group under a package.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={addPkgId} onValueChange={setAddPkgId}>
                <SelectTrigger><SelectValue placeholder="Select package..." /></SelectTrigger>
                <SelectContent>
                  {packages.filter((p) => p.is_active && !groups.some((g) => g.package_id === p.id)).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.level.replace("_", " ")} · {DAY_NAMES[p.day_of_week]} {formatTime(p.start_time)} ({p.course_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group Name (optional – auto-generated if blank)</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Beginner A" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={addCapacity} onChange={(e) => setAddCapacity(Number(e.target.value))} min={1} />
            </div>
            <Button className="w-full" onClick={handleAddGroup} disabled={!addPkgId}>Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={!!addStudentGroupId} onOpenChange={(open) => { if (!open) setAddStudentGroupId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Group</DialogTitle>
            <DialogDescription>Search by name or email across registered users and leads.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                value={studentSearch}
                onChange={(e) => handleSearchStudents(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {searchLoading && <p className="text-sm text-muted-foreground text-center py-2">Searching...</p>}

            {!searchLoading && studentSearch.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No results found.</p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {searchResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <Badge variant={r.source === "registered" ? "default" : "outline"} className="text-xs shrink-0">
                          {r.source === "registered" ? "Registered" : "Lead"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <div className="shrink-0 ml-2">
                      {r.already_in_group ? (
                        <Badge variant="secondary" className="text-xs">Already in group</Badge>
                      ) : r.source === "lead" ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Not registered</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleAddStudentToGroup(r)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    // Remove from old waitlist group
    const row = rows.find((r) => r.user_id === userId);
    if (row) {
      await (supabase as any).from("pkg_group_members").delete().eq("group_id", row.group_id).eq("user_id", userId);
    }
    // Use unified RPC
    const { data: enr } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("approval_status", "APPROVED").eq("payment_status", "PAID").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: result, error } = await (supabase as any).rpc("assign_student_to_group", {
      _package_id: packageId,
      _user_id: userId,
      _enrollment_id: enr ? (enr as any).id : null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const r = result as any;
      if (r?.status === "assigned") {
        toast({ title: "Assigned!", description: `Student moved to "${r.group_name}".` });
      } else if (r?.status === "waitlisted") {
        toast({ title: "Still waitlisted", description: "Target package also full.", variant: "destructive" });
      } else {
        toast({ title: "Result", description: r?.status || "Unknown" });
      }
    }
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

// ─── Private Time Config ──────────────────────────────────────────────────────

const PrivateTimeConfig = () => {
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("10:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "private_time_options")
        .maybeSingle();
      if (data?.value) {
        try { setTimes(JSON.parse(data.value)); } catch { setTimes(["10:00", "18:00"]); }
      } else {
        setTimes(["10:00", "18:00"]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async (updated: string[]) => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert({ key: "private_time_options", value: JSON.stringify(updated), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setTimes(updated);
      toast({ title: "Private times updated" });
    }
    setSaving(false);
  };

  const addTime = () => {
    if (!newTime || times.includes(newTime)) return;
    const updated = [...times, newTime].sort();
    save(updated);
  };

  const removeTime = (t: string) => {
    const updated = times.filter((x) => x !== t);
    if (updated.length === 0) {
      toast({ title: "At least one time required", variant: "destructive" });
      return;
    }
    save(updated);
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Private Class Time Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          These times are shown to students booking private classes (on days without group classes).
        </p>
        <div className="flex flex-wrap gap-2">
          {times.map((t) => (
            <Badge key={t} variant="secondary" className="text-sm py-1 px-3 gap-1">
              {formatTime(t)}
              <button
                onClick={() => removeTime(t)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                disabled={saving}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-32"
          />
          <Button size="sm" onClick={addTime} disabled={saving || !newTime}>
            <Plus className="h-4 w-4 mr-1" /> Add Time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SchedulingManager = () => {
  const [activeTab, setActiveTab] = useState("packages");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="packages">Teacher Available Slots</TabsTrigger>
        <TabsTrigger value="groups">Groups</TabsTrigger>
        <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        <TabsTrigger value="config">Private Config</TabsTrigger>
        <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="packages"><PackagesManager onSwitchToGroups={() => setActiveTab("groups")} /></TabsContent>
      <TabsContent value="groups"><GroupsManager /></TabsContent>
      <TabsContent value="waitlist"><WaitlistManager /></TabsContent>
      <TabsContent value="config"><PrivateTimeConfig /></TabsContent>
      <TabsContent value="notifications"><AdminNotifications /></TabsContent>
    </Tabs>
  );
};

export default SchedulingManager;
