import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
);

interface Step {
  label: string;
  labelAr: string;
  detail: string;
  detailAr: string;
  done: boolean;
  active: boolean;
}

interface Enrollment {
  payment_status: string;
  approval_status: string;
  matched_at: string | null;
  class_link_sent_at: string | null;
  first_class_date: string | null;
  payment_email_sent_at: string | null;
}

export default function EnrollmentStatusPage() {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Enrollment Status", description: "The status of your Klovers enrollment.", noindex: true });

  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.language === "en") setLang("en");

      const { data } = await supabase
        .from("enrollments")
        .select("payment_status, approval_status, matched_at, class_link_sent_at, first_class_date, payment_email_sent_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setEnrollment(data ?? null);
      setLoading(false);
    });
  }, [navigate]);

  const isAr = lang === "ar";
  const waUrl = "https://wa.me/201010003084";

  const steps: Step[] = enrollment ? [
    {
      label: "Payment received",
      labelAr: "تم استلام الدفع",
      detail: "Your seat is reserved.",
      detailAr: "مقعدك محجوز.",
      done: enrollment.payment_status === "PAID",
      active: enrollment.payment_status !== "PAID",
    },
    {
      label: "Group forming",
      labelAr: "تشكيل المجموعة",
      detail: "We're matching you with the right group: 2–5 business days.",
      detailAr: "نقوم بمطابقتك مع المجموعة المناسبة: من 2 إلى 5 أيام عمل.",
      done: !!enrollment.matched_at,
      active: enrollment.payment_status === "PAID" && !enrollment.matched_at,
    },
    {
      label: "Enrollment approved",
      labelAr: "تمت الموافقة على التسجيل",
      detail: "Your account is activated and classes are scheduled.",
      detailAr: "تم تفعيل حسابك وجدولة الحصص.",
      done: enrollment.approval_status === "APPROVED",
      active: !!enrollment.matched_at && enrollment.approval_status !== "APPROVED",
    },
    {
      label: "Class link sent",
      labelAr: "تم إرسال رابط الحصة",
      detail: "Check your inbox, your meeting link is waiting.",
      detailAr: "تحقق من بريدك الإلكتروني، رابط الاجتماع في انتظارك.",
      done: !!enrollment.class_link_sent_at,
      active: enrollment.approval_status === "APPROVED" && !enrollment.class_link_sent_at,
    },
    {
      label: "First class",
      labelAr: "الحصة الأولى",
      detail: enrollment.first_class_date
        ? new Date(enrollment.first_class_date).toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (Cairo)"
        : "Date will be confirmed once your group is ready.",
      detailAr: enrollment.first_class_date
        ? new Date(enrollment.first_class_date).toLocaleString("ar-EG", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (القاهرة)"
        : "سيتم تأكيد الموعد بمجرد اكتمال مجموعتك.",
      done: !!(enrollment.first_class_date && new Date(enrollment.first_class_date) < new Date()),
      active: !!enrollment.class_link_sent_at && !enrollment.first_class_date,
    },
  ] : [];

  const activeIdx = steps.findIndex(s => s.active);

  return (
    <div className="min-h-screen flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{isAr ? "حالة تسجيلك" : "Your Enrollment Status"}</h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "متابعة الرحلة مع كلوفرز" : "Track your Klovers journey"}
            </p>
          </div>

          {loading && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {isAr ? "جاري التحميل…" : "Loading…"}
            </CardContent></Card>
          )}

          {!loading && !enrollment && (
            <Card><CardContent className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">{isAr ? "لا يوجد تسجيل نشط." : "No active enrollment found."}</p>
              <Button onClick={() => navigate("/enroll")}>{isAr ? "التسجيل الآن" : "Enroll Now"}</Button>
            </CardContent></Card>
          )}

          {!loading && enrollment && (
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? "مراحل التسجيل" : "Enrollment Steps"}</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                        ${step.done ? "bg-correct text-correct-foreground" : step.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {step.done ? <CheckIcon /> : i + 1}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${step.done ? "text-foreground" : step.active ? "text-foreground" : "text-muted-foreground"}`}>
                          {isAr ? step.labelAr : step.label}
                          {step.active && <span className="ms-2 text-xs font-normal text-muted-foreground">{isAr ? "المرحلة الحالية" : "Current step"}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? step.detailAr : step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {activeIdx !== -1 && (
                  <div className="mt-6 p-3 bg-muted border border-border rounded-lg text-sm text-center">
                    <p className="text-foreground">
                      {isAr ? "هل من سؤال؟ يمكن التواصل مباشرة." : "Have a question? We're here."}
                    </p>
                    <a href={waUrl} className="inline-block mt-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold no-underline">
                      {isAr ? "واتساب" : "WhatsApp"}
                    </a>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    {isAr ? "لوحة الطالب" : "Student Dashboard"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
