import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Clock, XCircle, Loader2, Lock, AlertTriangle, Trash2 } from "lucide-react";
import StudentSelfService from "@/components/StudentSelfService";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

interface AdminAttendanceEntry {
  id: string;
  session_date: string;
  status: string;
  created_at: string;
}

interface StudentAttendanceRequestProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; labelAr: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING: { label: "Pending", labelAr: "قيد المراجعة", icon: Clock, variant: "secondary", color: "text-muted-foreground" },
  APPROVED: { label: "Approved", labelAr: "مؤكَّد", icon: CheckCircle2, variant: "default", color: "text-primary" },
  REJECTED: { label: "Rejected", labelAr: "مرفوض", icon: XCircle, variant: "destructive", color: "text-destructive" },
};

/** Arabic when the site is in Arabic; the English stays the source of truth. */
const useTr = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return { isAr, tr: (en: string, ar: string) => (isAr ? ar : en) };
};

interface EligibleEnrollment {
  id: string;
  approval_status: string;
  payment_status: string;
  sessions_remaining: number;
}

const fetchActiveEnrollment = async (userId: string): Promise<EligibleEnrollment | null> => {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, approval_status, payment_status, sessions_remaining")
    .eq("user_id", userId)
    .eq("approval_status", "APPROVED")
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
        console.error("[StudentAttendanceRequest] fetchActiveEnrollment failed:", error);
        return null;
  }

    return data && data.length > 0 ? data[0] : null;
};

/**
 * A private student's world is `teacher_students` + bundles, not `enrollments`.
 * Without this check she fell through to "Attendance is available after payment"
 * — a locked card telling a paying student to enrol — because the query above
 * can never find her. See StudentSelfService.
 */
const fetchPrivateRoster = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
        console.error("[StudentAttendanceRequest] fetchPrivateRoster failed:", error);
        return false;
  }

    return Boolean(data?.id);    
  };

const NEGATIVE_LIMIT = -3;

const LockedCard = ({ reason }: { reason?: "unpaid" | "limit" }) => {
  const navigate = useNavigate();
  const { tr } = useTr();
  const isLimit = reason === "limit";
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          {isLimit
            ? tr("Reached limit (−3). Renew required.", "وصلت للحد (−3). يلزم تجديد الباقة.")
            : tr("Attendance is available after payment", "تسجيل الحضور متاح بعد الدفع")}
        </CardTitle>
        <CardDescription>
          {isLimit
            ? tr("You've used 3 extra classes beyond your package. Please renew to continue.", "استخدمت 3 حصص إضافية بعد انتهاء باقتك. جدّد الباقة لتكمل.")
            : tr("Complete enrollment and payment to unlock attendance tracking.", "أكمل التسجيل والدفع لتفعيل متابعة الحضور.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={() => navigate(isLimit ? "/courses" : "/enroll-now")}>
          {isLimit ? tr("Renew Package", "جدّد الباقة") : tr("Enroll Now", "سجّل الآن")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/student")}>{tr("View My Enrollments", "عرض تسجيلاتي")}</Button>
      </CardContent>
    </Card>
  );
};

const NegativeBalanceBanner = ({ remaining }: { remaining: number }) => {
  const navigate = useNavigate();
  const overCount = Math.abs(remaining);
  const { tr } = useTr();
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10 mb-4">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{tr("Balance negative", "الرصيد بالسالب")} (<span dir="ltr">{remaining}</span>)</p>
        <p className="text-xs text-muted-foreground">
          {tr(
            `You've exceeded your package by ${overCount} ${overCount === 1 ? "class" : "classes"}. Allowed until −3. A reminder will be sent.`,
            `تجاوزت باقتك — الحصص الإضافية: ${overCount}. المسموح حتى −3، وسيصلك تذكير.`,
          )}
        </p>
        <Button size="sm" variant="destructive" className="mt-2" onClick={() => navigate("/enroll-now")}>
          {tr("Renew Package", "جدّد الباقة")}
        </Button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-60 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[280px] w-full" />
    </CardContent>
  </Card>
);

const StudentAttendanceRequest = ({ userId }: StudentAttendanceRequestProps) => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [adminDates, setAdminDates] = useState<AdminAttendanceEntry[]>([]);
  const [enrollment, setEnrollment] = useState<EligibleEnrollment | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { isAr, tr } = useTr();
  const dateFnsLocale = isAr ? arEG : undefined;

  const loadData = useCallback(async () => {
    const [eligible, privateStudent] = await Promise.all([
      fetchActiveEnrollment(userId),
      fetchPrivateRoster(userId),
    ]);

    setIsPrivate(privateStudent);

    if (!eligible) {
      setUnlocked(false);
      setEnrollment(null);
      setLoading(false);
      return;
    }

    setUnlocked(true);
    setEnrollment(eligible);

    const [reqsRes, adminRes] = await Promise.all([
      supabase
        .from("attendance_requests")
        .select("id, request_date, status, created_at")
        .eq("user_id", userId)
        .order("request_date", { ascending: false }),
      supabase
        .from("admin_attendance_log")
        .select("id, session_date, status, created_at")
        .eq("enrollment_id", eligible.id)
        .order("session_date", { ascending: false }),
    ]);

    if (reqsRes.data) setRequests(reqsRes.data as AttendanceRequest[]);
    if (adminRes.data) setAdminDates(adminRes.data as AdminAttendanceEntry[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !enrollment || submitting) return;

    // Safety re-check: must still be PAID + APPROVED
    const eligible = await fetchActiveEnrollment(userId);
    if (!eligible) {
      setUnlocked(false);
      setEnrollment(null);
      toast({ title: tr("You need an active paid enrollment", "تحتاج إلى تسجيل نشط ومدفوع"), description: tr("Please enroll and complete payment first.", "سجّل وأكمل الدفع أولًا."), variant: "destructive" });
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const exists = requests.find(r => r.request_date === dateStr && r.status !== "REJECTED");
    if (exists) {
      toast({ title: tr("Already requested", "تم الطلب من قبل"), description: tr("You already have a request for this date.", "لديك طلب بالفعل لهذا التاريخ."), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Auto-confirms immediately when this date/time falls inside the
    // student's real scheduled class window; otherwise it lands PENDING
    // for admin review, same as before.
    const { data, error } = await supabase.rpc("student_submit_attendance", {
      p_enrollment_id: enrollment.id,
      p_session_date: dateStr,
    } as any);

    if (error) {
      toast({ title: tr("Error", "خطأ"), description: error.message, variant: "destructive" });
    } else {
      const result = Array.isArray(data) ? data[0] : data;
      const approved = result?.status === "APPROVED";
      toast({
        title: approved ? tr("Attendance confirmed!", "تم تأكيد الحضور!") : tr("Attendance submitted!", "تم إرسال الحضور!"),
        description: approved
          ? tr(
              `${format(date, "MMM d, yyyy")} confirmed automatically — ${result.sessions_remaining} session(s) left.`,
              `${format(date, "d MMMM yyyy", { locale: dateFnsLocale })} تم تأكيده تلقائيًا — الحصص المتبقية: ${result.sessions_remaining}.`,
            )
          : tr(
              `${format(date, "MMM d, yyyy")} sent for review.`,
              `${format(date, "d MMMM yyyy", { locale: dateFnsLocale })} أُرسل للمراجعة.`,
            ),
      });
      loadData();
    }
    setSubmitting(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    setDeleting(requestId);
    const { error } = await supabase
      .from("attendance_requests")
      .delete()
      .eq("id", requestId);
    if (error) {
      toast({ title: tr("Error", "خطأ"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: tr("Request cancelled", "تم إلغاء الطلب"), description: tr("Your pending attendance request has been removed.", "تم حذف طلب الحضور المعلّق.") });
      loadData();
    }
    setDeleting(null);
  };

  const adminLoggedDates = useMemo(
    () => adminDates.map(a => new Date(a.session_date + "T00:00:00")),
    [adminDates]
  );
  const approvedDates = useMemo(
    () => requests.filter(r => r.status === "APPROVED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const pendingDates = useMemo(
    () => requests.filter(r => r.status === "PENDING").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const rejectedDates = useMemo(
    () => requests.filter(r => r.status === "REJECTED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );

  const modifiers = { adminLogged: adminLoggedDates, approved: approvedDates, pending: pendingDates, rejected: rejectedDates };
  const modifiersStyles = {
    adminLogged: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    approved: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    pending: { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: "9999px" },
    rejected: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", borderRadius: "9999px" },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(isAr ? "ar-EG-u-nu-latn" : "en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return <LoadingSkeleton />;

  // A private student has her own card, her own bundle and her own lessons. The
  // group calendar below is built on an enrolment she does not have, so showing
  // it to her — locked or otherwise — would only be wrong in a new way.
  if (isPrivate) return <StudentSelfService userId={userId} />;

  if (!unlocked) return <LockedCard reason="unpaid" />;

  const remaining = enrollment?.sessions_remaining ?? 0;
  const isLocked = remaining <= NEGATIVE_LIMIT;
  const isNegative = remaining < 0;

  if (isLocked) return <LockedCard reason="limit" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {tr("My Class Dates", "مواعيد حصصي")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{tr("Tap a date to mark your attendance", "اضغط على التاريخ لتسجيل حضورك")}</p>
          <div className="flex gap-3 flex-wrap mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary border border-foreground/30" />
              <span className="text-xs text-muted-foreground">{tr("Attended", "حضرت")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary border border-foreground/20" />
              <span className="text-xs text-muted-foreground">{tr("Pending", "قيد المراجعة")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive border border-destructive/50" />
              <span className="text-xs text-muted-foreground">{tr("Rejected", "مرفوض")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isNegative && <NegativeBalanceBanner remaining={remaining} />}
          {submitting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {tr("Submitting…", "جارٍ الإرسال…")}
            </div>
          )}
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
            className={cn("p-3 pointer-events-auto w-full")}
            locale={dateFnsLocale}
            dir={isAr ? "rtl" : "ltr"}
            labels={isAr ? { labelPrevious: () => "الشهر السابق", labelNext: () => "الشهر التالي" } : undefined}
            classNames={isAr ? { nav_button_previous: "absolute right-1", nav_button_next: "absolute left-1" } : undefined}
          />
        </CardContent>
      </Card>

      {/* Session History — combines admin-logged and student requests */}
      {(adminDates.length > 0 || requests.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{tr("Session History", "سجل الحضور")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {tr(
                `${adminDates.length + requests.filter(r => r.status === "APPROVED").length} attended sessions`,
                `الحصص التي حضرتها: ${adminDates.length + requests.filter(r => r.status === "APPROVED").length}`,
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Admin-logged sessions */}
              {adminDates.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(a.session_date)}</p>
                      <p className="text-xs text-muted-foreground">{tr("Logged by teacher", "سجّله المعلّم")}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="shrink-0">{tr("Attended", "حضرت")}</Badge>
                </div>
              ))}

              {/* Student-initiated requests */}
              {requests.map((r) => {
                const cfg = statusConfig[r.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-muted", cfg.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDate(r.request_date)}</p>
                        <p className="text-xs text-muted-foreground">{tr("Self-reported", "سجّلته بنفسك")}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={cfg.variant} className="shrink-0 whitespace-nowrap">{isAr ? cfg.labelAr : cfg.label}</Badge>
                      {r.status === "PENDING" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={deleting === r.id}
                              aria-label={tr(`Cancel request for ${formatDate(r.request_date)}`, `إلغاء طلب ${formatDate(r.request_date)}`)}
                            >
                              {deleting === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{tr("Cancel this request?", "إلغاء هذا الطلب؟")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {tr(
                                  `This will remove your pending attendance request for ${formatDate(r.request_date)}.`,
                                  `سيتم حذف طلب الحضور المعلّق بتاريخ ${formatDate(r.request_date)}.`,
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tr("Keep", "إبقاء")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelRequest(r.id)}>
                                {tr("Cancel Request", "إلغاء الطلب")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAttendanceRequest;
