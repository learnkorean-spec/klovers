import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, CalendarDays, Clock, Globe, Plus, Loader2, Lightbulb, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UnmatchedEnrollment {
  id: string;
  user_id: string;
  plan_type: string;
  preferred_days: string[] | null;
  preferred_start: string | null;
  preferred_time: string | null;
  timezone: string | null;
  duration: number;
  level: string | null;
  name?: string;
  email?: string;
}

interface Cluster {
  key: string;
  days: string[];
  start: string;
  level: string;
  members: UnmatchedEnrollment[];
}

interface SuggestedSlot {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  timezone: string;
  capacity: number;
  course_type: string;
  currentMembers: number;
}

const DAY_NAMES: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

const GroupMatcher = () => {
  const [enrollments, setEnrollments] = useState<UnmatchedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ name: string; level: string } | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [nameDialogCluster, setNameDialogCluster] = useState<Cluster | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");

  const fetchUnmatched = async () => {
    setLoading(true);

    const { data: rawEnrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_start, preferred_time, timezone, duration, level")
      .eq("approval_status", "APPROVED")
      .eq("plan_type", "group")
      .is("matched_batch_id", null)
      .not("preferred_days", "is", null);

    if (error) {
      console.error("Failed to fetch unmatched enrollments:", error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((rawEnrollments as any[]).map((e: any) => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string }> = {};
    if (profiles) {
      (profiles as any[]).forEach((p: any) => {
        profileMap[p.user_id] = { name: p.name, email: p.email };
      });
    }

    const enriched: UnmatchedEnrollment[] = (rawEnrollments as any[])
      .filter((e: any) => e.preferred_days && e.preferred_days.length > 0 && e.preferred_start)
      .map((e: any) => ({
        ...e,
        name: profileMap[e.user_id]?.name || "Unknown",
        email: profileMap[e.user_id]?.email || "",
      }));

    setEnrollments(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnmatched();
  }, []);

  const clusters = useMemo(() => {
    const clusterMap: Record<string, UnmatchedEnrollment[]> = {};

    for (const enrollment of enrollments) {
      const days = enrollment.preferred_days || [];
      const start = enrollment.preferred_start || "";
      const dayKey = [...days].sort().join(",");
      const key = `${dayKey}|${start}`;

      if (!clusterMap[key]) clusterMap[key] = [];
      clusterMap[key].push(enrollment);
    }

    const mergedClusters: Cluster[] = [];
    const processed = new Set<string>();

    const keys = Object.keys(clusterMap);
    for (let i = 0; i < keys.length; i++) {
      if (processed.has(keys[i])) continue;

      const [daysStr, start] = keys[i].split("|");
      const days = daysStr.split(",");
      let members = [...clusterMap[keys[i]]];

      for (let j = i + 1; j < keys.length; j++) {
        if (processed.has(keys[j])) continue;
        const [otherDaysStr, otherStart] = keys[j].split("|");
        if (otherStart !== start) continue;
        const otherDays = otherDaysStr.split(",");
        const overlap = days.some((d) => otherDays.includes(d));
        if (overlap) {
          members.push(...clusterMap[keys[j]]);
          processed.add(keys[j]);
          otherDays.forEach((d) => { if (!days.includes(d)) days.push(d); });
        }
      }

      processed.add(keys[i]);

      const seen = new Set<string>();
      members = members.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      // Determine cluster level from members
      const levels = members.map(m => m.level).filter(Boolean);
      const level = levels.length > 0 ? levels[0]! : "unknown";

      mergedClusters.push({
        key: keys[i],
        days: days.sort(),
        start,
        level,
        members,
      });
    }

    return mergedClusters.sort((a, b) => b.members.length - a.members.length);
  }, [enrollments]);

  const fetchSuggestedSlots = async (level: string, blockedDay: string) => {
    // Fetch schedule_packages for this level that are NOT the blocked day
    const { data: packages } = await supabase
      .from("schedule_packages")
      .select("*")
      .eq("level", level)
      .eq("is_active", true);

    if (!packages || packages.length === 0) {
      setSuggestedSlots([]);
      return;
    }

    // Get member counts for each package's groups
    const packageIds = packages.map(p => p.id);
    const { data: groups } = await supabase
      .from("pkg_groups")
      .select("id, package_id")
      .in("package_id", packageIds)
      .eq("is_active", true);

    const groupIds = (groups || []).map(g => g.id);
    const { data: members } = groupIds.length > 0
      ? await supabase
          .from("pkg_group_members")
          .select("group_id, user_id")
          .in("group_id", groupIds)
          .eq("member_status", "active")
      : { data: [] };

    // Count members per package
    const groupToPackage: Record<string, string> = {};
    (groups || []).forEach(g => { groupToPackage[g.id] = g.package_id; });
    const packageMemberCount: Record<string, number> = {};
    (members || []).forEach(m => {
      const pkgId = groupToPackage[m.group_id];
      if (pkgId) packageMemberCount[pkgId] = (packageMemberCount[pkgId] || 0) + 1;
    });

    const dayNameToNum = (d: string) => Object.entries(DAY_NAMES).find(([, v]) => v === d)?.[0];
    const blockedDayNum = dayNameToNum(blockedDay);

    const suggestions: SuggestedSlot[] = packages
      .filter(p => String(p.day_of_week) !== blockedDayNum)
      .map(p => ({
        id: p.id,
        level: p.level,
        day_of_week: p.day_of_week,
        start_time: p.start_time,
        timezone: p.timezone,
        capacity: p.capacity,
        course_type: p.course_type,
        currentMembers: packageMemberCount[p.id] || 0,
      }))
      .filter(s => s.currentMembers < s.capacity);

    setSuggestedSlots(suggestions);
  };

  const openNameDialog = (cluster: Cluster) => {
    const defaultName = `${cluster.level.replace(/_/g, " ")} – ${cluster.days.join("/")} ${cluster.start}`;
    setGroupNameInput(defaultName);
    setNameDialogCluster(cluster);
  };

  const handleCreateGroup = async (cluster: Cluster, groupName: string) => {
    setNameDialogCluster(null);
    setCreating(cluster.key);
    try {
      // Create student_groups entry
      const { data: group, error: groupError } = await supabase
        .from("student_groups")
        .insert({
          name: groupName,
          schedule_day: cluster.days[0],
          course_type: "group",
          capacity: Math.max(cluster.members.length, 5),
          level: cluster.level,
        } as any)
        .select("id")
        .single();

      if (groupError || !group) {
        throw new Error(groupError?.message || "Failed to create group");
      }

      const groupId = (group as any).id;

      // Insert batch_members for each student
      const batchInserts = cluster.members.map((m) => ({
        batch_id: groupId,
        user_id: m.user_id,
        enrollment_id: m.id,
        member_status: "active",
      }));

      const { error: batchError } = await supabase
        .from("batch_members")
        .insert(batchInserts as any);

      if (batchError) {
        throw new Error(batchError.message);
      }

      // Update enrollments with matched_batch_id
      const enrollmentIds = cluster.members.map((m) => m.id);
      const { error: updateError } = await supabase
        .from("enrollments")
        .update({
          matched_batch_id: groupId,
          matched_at: new Date().toISOString(),
        } as any)
        .in("id", enrollmentIds);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Block matching_slot for this day/level if it exists
      const { data: matchingSlots } = await supabase
        .from("matching_slots")
        .select("id")
        .eq("course_level", cluster.level)
        .eq("day", cluster.days[0])
        .neq("status", "full");

      if (matchingSlots && matchingSlots.length > 0) {
        await supabase
          .from("matching_slots")
          .update({ status: "full", current_count: (matchingSlots as any)[0].max_students || 5 } as any)
          .eq("id", matchingSlots[0].id);
      }

      // Also create a pkg_groups entry so it appears in the Scheduling > Groups tab
      const dayNum = Object.entries(DAY_NAMES).find(([, v]) => v === cluster.days[0])?.[0];
      if (dayNum !== undefined) {
        const { data: pkg } = await supabase
          .from("schedule_packages")
          .select("id, capacity")
          .eq("level", cluster.level)
          .eq("day_of_week", Number(dayNum))
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (pkg) {
          // Create pkg_group linked to this schedule_package
          const { data: newPkgGroup } = await supabase
            .from("pkg_groups")
            .insert({
              package_id: pkg.id,
              name: groupName,
              capacity: pkg.capacity,
              is_active: true,
            })
            .select("id")
            .single();

          // Add members to pkg_group_members
          if (newPkgGroup) {
            const pkgMembers = cluster.members.map((m) => ({
              group_id: newPkgGroup.id,
              user_id: m.user_id,
              member_status: "active",
              enrollment_id: m.id,
            }));
            await supabase.from("pkg_group_members").insert(pkgMembers as any);
          }

          // Check current member count for capacity notification
          const { data: pkgGroups } = await supabase
            .from("pkg_groups")
            .select("id")
            .eq("package_id", pkg.id)
            .eq("is_active", true);

          const pgIds = (pkgGroups || []).map(g => g.id);
          if (pgIds.length > 0) {
            const { count } = await supabase
              .from("pkg_group_members")
              .select("*", { count: "exact", head: true })
              .in("group_id", pgIds)
              .eq("member_status", "active");

            if ((count || 0) >= pkg.capacity) {
              await supabase.from("admin_notifications").insert({
                message: `Schedule package for ${cluster.level} on ${cluster.days[0]} is now at capacity (${count}/${pkg.capacity}).`,
                type: "slot_full",
              });
            }
          }
        }
      }

      // Send group match emails
      for (const member of cluster.members) {
        try {
          await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email: member.email,
              name: member.name,
              template: "group_match",
              group_name: groupName,
              group_days: cluster.days.join(", "),
            },
          });
        } catch (emailErr) {
          console.error(`Failed to send group email to ${member.email}:`, emailErr);
        }
      }

      toast({ title: "Group created!", description: `"${groupName}" with ${cluster.members.length} students. Slot blocked & emails sent!` });

      // Set created group and fetch suggestions
      setCreatedGroup({ name: groupName, level: cluster.level });
      await fetchSuggestedSlots(cluster.level, cluster.days[0]);

      fetchUnmatched();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading unmatched enrollments...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Success + Suggested Slots */}
      {createdGroup && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Group "{createdGroup.name}" created & slot blocked!</p>
                <p className="text-sm text-muted-foreground">Students have been notified by email.</p>
              </div>
            </div>

            {suggestedSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Suggested new slots for <Badge variant="outline">{createdGroup.level.replace(/_/g, " ")}</Badge>
                </div>
                <div className="grid gap-2">
                  {suggestedSlots.map((slot) => {
                    const seatsLeft = slot.capacity - slot.currentMembers;
                    return (
                      <div key={slot.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {DAY_NAMES[slot.day_of_week] || "Unknown"}
                          </span>
                          <span className="text-muted-foreground">
                            {slot.start_time} ({slot.timezone.replace(/_/g, " ")})
                          </span>
                        </div>
                        <Badge variant={seatsLeft > 3 ? "secondary" : "default"}>
                          <Users className="h-3 w-3 mr-1" />
                          {seatsLeft} seats left
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {suggestedSlots.length === 0 && (
              <p className="text-sm text-muted-foreground">No other available slots for this level. Consider creating new schedule packages.</p>
            )}

            <Button variant="outline" size="sm" onClick={() => { setCreatedGroup(null); setSuggestedSlots([]); }}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {enrollments.length === 0 && !createdGroup ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No unmatched group enrollments</p>
          <p className="text-sm mt-1">All approved group students have been matched or have no schedule preferences.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Group Matcher</h3>
              <p className="text-sm text-muted-foreground">
                {enrollments.length} unmatched student{enrollments.length !== 1 ? "s" : ""} with schedule preferences
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUnmatched}>
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {clusters.map((cluster) => {
              const isReady = cluster.members.length >= 3;
              return (
                <Card key={cluster.key} className={isReady ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {cluster.days.join(", ")}
                        </CardTitle>
                        <Badge variant={isReady ? "default" : "secondary"}>
                          {cluster.start}
                        </Badge>
                        {cluster.level && cluster.level !== "unknown" && (
                          <Badge variant="outline" className="text-xs">
                            {cluster.level.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={isReady ? "default" : "outline"} className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cluster.members.length} student{cluster.members.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {cluster.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                          <div>
                            <p className="font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {m.preferred_time || "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {m.timezone?.replace(/_/g, " ") || "—"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {m.duration}mo
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isReady && (
                      <Button
                        className="w-full"
                        onClick={() => openNameDialog(cluster)}
                        disabled={creating === cluster.key}
                      >
                        {creating === cluster.key ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating & blocking slot...</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Create Group ({cluster.members.length} students)</>
                        )}
                      </Button>
                    )}
                    {!isReady && (
                      <p className="text-xs text-muted-foreground text-center">
                        Need {3 - cluster.members.length} more student{3 - cluster.members.length !== 1 ? "s" : ""} to form a group
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
      {/* Name Dialog */}
      <Dialog open={!!nameDialogCluster} onOpenChange={(open) => { if (!open) setNameDialogCluster(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name this group</DialogTitle>
          </DialogHeader>
          <Input
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="e.g. Beginner 1 – Sunday 6 PM"
            onKeyDown={(e) => {
              if (e.key === "Enter" && groupNameInput.trim() && nameDialogCluster) {
                handleCreateGroup(nameDialogCluster, groupNameInput.trim());
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialogCluster(null)}>Cancel</Button>
            <Button
              disabled={!groupNameInput.trim()}
              onClick={() => nameDialogCluster && handleCreateGroup(nameDialogCluster, groupNameInput.trim())}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupMatcher;
