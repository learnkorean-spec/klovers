import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, CalendarDays, Clock, Globe, Plus, Loader2, Lightbulb, CheckCircle2, AlertTriangle, Mail, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { normalizeLevel } from "@/constants/levels";

interface UnmatchedEnrollment {
  id: string;
  user_id: string;
  plan_type: string;
  preferred_day: string | null;
  preferred_start: string | null;
  preferred_time: string | null;
  timezone: string | null;
  duration: number;
  level: string | null;
  package_id: string | null;
  amount: number | null;
  currency: string | null;
  classes_included: number | null;
  payment_method: string | null;
  payment_provider: string | null;
  payment_status: string | null;
  approval_status: string | null;
  created_at: string | null;
  name?: string;
  email?: string;
}

interface SchedulePackage {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  timezone: string;
  capacity: number;
  course_type: string;
  is_active: boolean;
}

interface Cluster {
  key: string;
  packageId: string;
  packageLevel: string;
  packageDay: number;
  packageTime: string;
  packageTimezone: string;
  packageCapacity: number;
  members: UnmatchedEnrollment[];
}

interface NeedsReviewItem {
  enrollment: UnmatchedEnrollment;
  reason: string;
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

const DAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};



const GroupMatcher = () => {
  const [enrollments, setEnrollments] = useState<UnmatchedEnrollment[]>([]);
  const [privateUnmatched, setPrivateUnmatched] = useState<UnmatchedEnrollment[]>([]);
  const [packages, setPackages] = useState<SchedulePackage[]>([]);
  const [needsReview, setNeedsReview] = useState<NeedsReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [markingAssigned, setMarkingAssigned] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingAllReminders, setSendingAllReminders] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{ name: string; level: string } | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [nameDialogCluster, setNameDialogCluster] = useState<Cluster | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");

  const fetchUnmatched = async () => {
    setLoading(true);

    // Fetch unmatched group enrollments
    const { data: rawGroupEnrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_day, preferred_start, preferred_time, timezone, duration, level, package_id, amount, currency, classes_included, payment_method, payment_provider, payment_status, approval_status, created_at")
      .eq("approval_status", "APPROVED")
      .eq("plan_type", "group")
      .is("matched_at", null);

    // Fetch unmatched private enrollments
    const { data: rawPrivateEnrollments, error: privateError } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_day, preferred_start, preferred_time, timezone, duration, level, package_id, amount, currency, classes_included, payment_method, payment_provider, payment_status, approval_status, created_at")
      .eq("approval_status", "APPROVED")
      .eq("plan_type", "private")
      .is("matched_at", null);

    if (error || privateError) {
      console.error("Failed to fetch unmatched enrollments:", error || privateError);
      toast({ title: "Failed to load enrollments", description: (error || privateError)?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch all active schedule_packages for enrichment
    const { data: pkgs } = await supabase
      .from("schedule_packages")
      .select("*")
      .eq("is_active", true);

    setPackages((pkgs as SchedulePackage[]) || []);

    const allRaw = [...(rawGroupEnrollments as any[] || []), ...(rawPrivateEnrollments as any[] || [])];
    const userIds = [...new Set(allRaw.map((e: any) => e.user_id))];
    let profileMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      if (profiles) {
        (profiles as any[]).forEach((p: any) => {
          profileMap[p.user_id] = { name: p.name, email: p.email };
        });
      }
    }

    const enrichGroup: UnmatchedEnrollment[] = (rawGroupEnrollments as any[]).map((e: any) => ({
      ...e,
      name: profileMap[e.user_id]?.name || "Unknown",
      email: profileMap[e.user_id]?.email || "",
    }));

    const enrichPrivate: UnmatchedEnrollment[] = (rawPrivateEnrollments as any[]).map((e: any) => ({
      ...e,
      name: profileMap[e.user_id]?.name || "Unknown",
      email: profileMap[e.user_id]?.email || "",
    }));

    setEnrollments(enrichGroup);
    setPrivateUnmatched(enrichPrivate);
    setLoading(false);
  };

  const handleMarkAssigned = async (enrollment: UnmatchedEnrollment) => {
    setMarkingAssigned(enrollment.id);
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ matched_at: new Date().toISOString() } as any)
        .eq("id", enrollment.id);
      if (error) throw error;
      toast({ title: "Marked as assigned", description: `${enrollment.name} has been marked as assigned.` });
      fetchUnmatched();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setMarkingAssigned(null);
    }
  };

  const handleSendReminder = async (userIds: string[], label?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-private-reminder", {
        body: { user_ids: userIds },
      });
      if (error) throw error;
      const result = data as { sent?: number; skipped?: number };
      toast({
        title: "Reminders sent",
        description: `${result.sent || 0} email(s) sent, ${result.skipped || 0} skipped${label ? ` (${label})` : ""}.`,
      });
    } catch (err: any) {
      toast({ title: "Error sending reminders", description: err.message, variant: "destructive" });
    }
  };

  const handleSendSingleReminder = async (enrollment: UnmatchedEnrollment) => {
    setSendingReminder(enrollment.id);
    await handleSendReminder([enrollment.user_id], enrollment.name);
    setSendingReminder(null);
  };

  const handleSendAllReminders = async () => {
    setSendingAllReminders(true);
    const userIds = privateUnmatched
      .filter(m => !m.level || (!m.preferred_day && (!m.preferred_time)))
      .map(m => m.user_id);
    if (userIds.length === 0) {
      toast({ title: "No reminders needed", description: "All private students have complete info." });
    } else {
      await handleSendReminder(userIds, `${userIds.length} students`);
    }
    setSendingAllReminders(false);
  };

  useEffect(() => {
    fetchUnmatched();
  }, []);

  // Package-driven clustering
  const clusters = useMemo(() => {
    const pkgMap = new Map<string, SchedulePackage>();
    for (const p of packages) {
      pkgMap.set(p.id, p);
    }

    const clusterMap: Record<string, UnmatchedEnrollment[]> = {};
    const clusterPkgId: Record<string, string> = {};
    const reviewItems: NeedsReviewItem[] = [];

    for (const enrollment of enrollments) {
      let resolvedPkgId: string | null = null;

      // First: try package_id if it references an active package
      if (enrollment.package_id && pkgMap.has(enrollment.package_id)) {
        resolvedPkgId = enrollment.package_id;
      }

      // Fallback: resolve package from level + preferred_day
      if (!resolvedPkgId && enrollment.level && enrollment.preferred_day) {
        const normLevel = normalizeLevel(enrollment.level);
        const dayNum = DAY_NAME_TO_NUM[enrollment.preferred_day.toLowerCase()];
        if (dayNum !== undefined) {
          const match = packages.find(
            p => p.level === normLevel && p.day_of_week === dayNum
          );
          if (match) resolvedPkgId = match.id;
        }
      }

      if (!resolvedPkgId) {
        reviewItems.push({
          enrollment,
          reason: !enrollment.level
            ? "Missing level"
            : !enrollment.preferred_day
              ? "Missing preferred day"
              : "No matching schedule package",
        });
        continue;
      }

      const key = `pkg:${resolvedPkgId}`;
      if (!clusterMap[key]) {
        clusterMap[key] = [];
        clusterPkgId[key] = resolvedPkgId;
      }
      clusterMap[key].push(enrollment);
    }

    setNeedsReview(reviewItems);

    const result: Cluster[] = [];
    for (const [key, members] of Object.entries(clusterMap)) {
      const pkgId = clusterPkgId[key];
      const pkg = pkgMap.get(pkgId);

      result.push({
        key,
        packageId: pkgId,
        packageLevel: pkg?.level || "unknown",
        packageDay: pkg?.day_of_week ?? -1,
        packageTime: pkg?.start_time || "—",
        packageTimezone: pkg?.timezone || "Africa/Cairo",
        packageCapacity: pkg?.capacity ?? 5,
        members,
      });
    }

    return result.sort((a, b) => b.members.length - a.members.length);
  }, [enrollments, packages]);

  const fetchSuggestedSlots = async (level: string, blockedDayNum: number) => {
    const relevant = packages.filter(
      p => p.level === level && p.day_of_week !== blockedDayNum && p.is_active
    );

    if (relevant.length === 0) {
      setSuggestedSlots([]);
      return;
    }

    const packageIds = relevant.map(p => p.id);
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

    const groupToPackage: Record<string, string> = {};
    (groups || []).forEach(g => { groupToPackage[g.id] = g.package_id; });
    const packageMemberCount: Record<string, number> = {};
    (members || []).forEach(m => {
      const pkgId = groupToPackage[m.group_id];
      if (pkgId) packageMemberCount[pkgId] = (packageMemberCount[pkgId] || 0) + 1;
    });

    const suggestions: SuggestedSlot[] = relevant
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
    const dayName = DAY_NAMES[cluster.packageDay] || "Unknown";
    const levelLabel = cluster.packageLevel.replace(/_/g, " ");
    const defaultName = `${levelLabel} – ${dayName} ${cluster.packageTime}`;
    setGroupNameInput(defaultName);
    setNameDialogCluster(cluster);
  };

  const handleCreateGroup = async (cluster: Cluster, groupName: string) => {
    setNameDialogCluster(null);
    setCreating(cluster.key);
    try {
      const pkgId = cluster.packageId;
      const successIds: string[] = [];
      const failedNames: string[] = [];
      let capturedGroupId: string | null = null;

      // Assign each member via unified RPC
      for (const member of cluster.members) {
        const { data: rpcData, error: assignErr } = await supabase
          .rpc("assign_student_to_group", {
            _package_id: pkgId,
            _user_id: member.user_id,
            _enrollment_id: member.id,
          });
        if (assignErr) {
          console.error(`Failed to assign ${member.name}:`, assignErr);
          failedNames.push(member.name || member.id);
        } else {
          successIds.push(member.id);
          // Capture group_id from first successful RPC result
          if (!capturedGroupId && rpcData && typeof rpcData === "object" && (rpcData as any).group_id) {
            capturedGroupId = (rpcData as any).group_id;
          }
        }
      }

      // Mark only successful enrollments as matched + set slot_id
      if (successIds.length > 0) {
        await supabase
          .from("enrollments")
          .update({ matched_at: new Date().toISOString(), slot_id: pkgId })
          .in("id", successIds);
      }

      // Save custom group name to pkg_groups (FIX 3)
      if (capturedGroupId && groupName.trim()) {
        await supabase
          .from("pkg_groups")
          .update({ name: groupName.trim() })
          .eq("id", capturedGroupId);
      }

      // Send group match emails only for successful members
      const dayName = DAY_NAMES[cluster.packageDay] || "Unknown";
      const successfulMembers = cluster.members.filter(m => successIds.includes(m.id));
      for (const member of successfulMembers) {
        try {
          await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email: member.email,
              name: member.name,
              template: "group_match",
              group_name: groupName,
              group_days: dayName,
            },
          });
        } catch (emailErr) {
          console.error(`Failed to send group email to ${member.email}:`, emailErr);
        }
      }

      if (failedNames.length > 0) {
        toast({ title: "Partial success", description: `${failedNames.length} student(s) failed to assign: ${failedNames.join(", ")}`, variant: "destructive" });
      }

      if (successIds.length > 0) {
        toast({ title: "Group created!", description: `"${groupName}" with ${successIds.length} students. Emails sent!` });
        setCreatedGroup({ name: groupName, level: cluster.packageLevel });
        await fetchSuggestedSlots(cluster.packageLevel, cluster.packageDay);
      }

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
                <p className="font-semibold text-foreground">Group "{createdGroup.name}" created & assigned!</p>
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

      {enrollments.length === 0 && needsReview.length === 0 && privateUnmatched.length === 0 && !createdGroup ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No unmatched enrollments</p>
          <p className="text-sm mt-1">All approved students have been matched.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Group Matcher</h3>
              <p className="text-sm text-muted-foreground">
                {clusters.reduce((s, c) => s + c.members.length, 0)} groupable student{clusters.reduce((s, c) => s + c.members.length, 0) !== 1 ? "s" : ""}
                {privateUnmatched.length > 0 && ` · ${privateUnmatched.length} private`}
                {needsReview.length > 0 && ` · ${needsReview.length} needs review`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUnmatched}>
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {clusters.map((cluster) => {
              const isReady = cluster.members.length >= 3;
              const dayName = DAY_NAMES[cluster.packageDay] || "Unknown";
              const levelLabel = cluster.packageLevel.replace(/_/g, " ");
              return (
                <Card key={cluster.key} className={isReady ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {dayName}
                        </CardTitle>
                        <Badge variant={isReady ? "default" : "secondary"}>
                          {cluster.packageTime}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {levelLabel}
                        </Badge>
                      </div>
                      <Badge variant={isReady ? "default" : "outline"} className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cluster.members.length}/{cluster.packageCapacity} student{cluster.members.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {cluster.members.map((m) => (
                        <div key={m.id} className="text-sm bg-muted/50 rounded-lg px-3 py-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              <Badge variant="outline" className="text-xs">{m.plan_type}</Badge>
                              <Badge variant="outline" className="text-xs">{m.duration}mo</Badge>
                              {m.approval_status && (
                                <Badge variant={m.approval_status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                                  {m.approval_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {m.amount != null && (
                              <span>{Math.round(m.amount).toLocaleString()} {m.currency || "USD"}</span>
                            )}
                            {m.classes_included != null && (
                              <span>{m.classes_included} classes</span>
                            )}
                            {m.payment_provider && (
                              <Badge variant="outline" className="text-xs">{m.payment_provider}</Badge>
                            )}
                            {m.payment_method && (
                              <span>{m.payment_method.replace(/_/g, " ")}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {m.timezone?.replace(/_/g, " ") || "—"}
                            </span>
                            {m.level && (
                              <Badge variant="outline" className="text-xs">{m.level.replace(/_/g, " ")}</Badge>
                            )}
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
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating group...</>
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

          {/* Needs Review Section */}
          {needsReview.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Needs Review ({needsReview.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These enrollments cannot be grouped automatically. Assign a package via enrollment editing.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {needsReview.map((item) => (
                    <div key={item.enrollment.id} className="text-sm bg-muted/50 rounded-lg px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.enrollment.name}</p>
                          <p className="text-xs text-muted-foreground">{item.enrollment.email}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {item.reason}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{item.enrollment.plan_type} · {item.enrollment.duration}mo</span>
                        {item.enrollment.amount != null && (
                          <span>{Math.round(item.enrollment.amount).toLocaleString()} {item.enrollment.currency || "USD"}</span>
                        )}
                        {item.enrollment.level && (
                          <Badge variant="outline" className="text-xs">{item.enrollment.level.replace(/_/g, " ")}</Badge>
                        )}
                        {item.enrollment.preferred_day && (
                          <span>Day: {item.enrollment.preferred_day}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Private Students */}
          {privateUnmatched.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <Users className="h-4 w-4" />
                      Unassigned Private Students ({privateUnmatched.length})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      These private plan students are paid & approved but not yet assigned to a slot.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendingAllReminders}
                    onClick={handleSendAllReminders}
                    className="shrink-0"
                  >
                    {sendingAllReminders ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1" />
                    )}
                    Send All Reminders
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {privateUnmatched.map((m) => {
                    const missingLevel = !m.level;
                    const missingSchedule = !m.preferred_day && !m.preferred_time;
                    const hasMissing = missingLevel || missingSchedule;
                    return (
                      <div key={m.id} className="text-sm bg-muted/50 rounded-lg px-3 py-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasMissing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={sendingReminder === m.id}
                                onClick={() => handleSendSingleReminder(m)}
                                title="Send reminder email"
                              >
                                {sendingReminder === m.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={markingAssigned === m.id}
                              onClick={() => handleMarkAssigned(m)}
                            >
                              {markingAssigned === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Mark Assigned"
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-xs">private</Badge>
                          <span>{m.duration}mo</span>
                          {m.amount != null && (
                            <span>{Math.round(m.amount).toLocaleString()} {m.currency || "USD"}</span>
                          )}
                          {m.classes_included != null && (
                            <span>{m.classes_included} classes</span>
                          )}
                          {m.level ? (
                            <Badge variant="outline" className="text-xs">{m.level.replace(/_/g, " ")}</Badge>
                          ) : null}
                        </div>
                        {(missingLevel || missingSchedule) && (
                          <div className="flex flex-wrap gap-2">
                            {missingLevel && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Missing level — ask student to complete placement test
                              </Badge>
                            )}
                            {missingSchedule && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                No schedule preference set
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
