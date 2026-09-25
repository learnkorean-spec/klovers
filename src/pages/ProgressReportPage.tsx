import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle2, CalendarDays, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { CONTACT_EMAIL } from "@/lib/siteConfig";

interface ReportData {
  name: string;
  email: string;
  level: string;
  country: string;
  attendance: number;
  sessionsRemaining: number;
  weeklyXp: number;
  placementScore: number | null;
  placementLevel: string | null;
  joinedAt: string;
}

const ProgressReportPage = () => {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Your Progress Report", description: "Your personal Klovers learning progress report.", noindex: true });

  const [params] = useSearchParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = params.get("uid") || session.user.id;

      const [profileRes, enrollRes, attendRes, xpRes, ptRes] = await Promise.all([
        supabase.from("profiles").select("name, email, level, country, created_at").eq("user_id", uid).maybeSingle(),
        supabase.from("enrollments").select("sessions_remaining, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("group_attendance").select("id").eq("user_id", uid).eq("status", "present"),
        supabase.from("student_xp").select("xp_earned").eq("user_id", uid),
        supabase.from("placement_test_results").select("score, level, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]).catch(() => Array(5).fill({ data: null, error: true }));

      const totalXp = Array.isArray(xpRes?.data)
        ? xpRes.data.reduce((s: number, r: any) => s + (r.xp_earned || 0), 0)
        : 0;

      setData({
        name: profileRes.data?.name || "Student",
        email: profileRes.data?.email || session.user.email || "",
        level: profileRes.data?.level || "Beginner",
        country: profileRes.data?.country || "",
        attendance: attendRes.data?.length || 0,
        sessionsRemaining: enrollRes.data?.sessions_remaining || 0,
        weeklyXp: totalXp,
        placementScore: (ptRes.data as any)?.score || null,
        placementLevel: (ptRes.data as any)?.level || null,
        joinedAt: profileRes.data?.created_at || new Date().toISOString(),
      });
      setLoading(false);
    };
    load();
  }, [params]);

  const handlePrint = () => window.print();

  const dateLocale = isAr ? "ar-EG" : "en-US";
  const month = new Date().toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  const joinedDate = data ? new Date(data.joinedAt).toLocaleDateString(dateLocale, { month: "long", year: "numeric" }) : "";

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{isAr ? "جارٍ تحميل التقرير..." : "Loading report…"}</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{isAr ? "يُرجى تسجيل الدخول لعرض التقرير." : "Sign in to view your report."}</div>;

  return (
    <div className="min-h-screen bg-ivory dark:bg-background print:bg-white">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex justify-center gap-3 py-6">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" /> {isAr ? "طباعة / حفظ كـ PDF" : "Print / Save as PDF"}
        </Button>
      </div>

      {/* Report card — uses inline styles for print/PDF compatibility */}
      <div ref={reportRef} className="max-w-2xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-none"
        style={{ fontFamily: "Inter, Cairo, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#2E2E2E", padding: "32px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-block", width: 60, height: 60, borderRadius: "50%", background: "#FFFF00", lineHeight: "60px", fontSize: 28, fontWeight: 900, color: "#2E2E2E", marginBottom: 12 }}>K</div>
          <h1 style={{ color: "#FFFF00", margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>Klovers Korean Academy</h1>
          <p style={{ color: "rgba(255,249,236,0.8)", margin: 0, fontSize: 13 }}>{isAr ? "تقرير تقدم الطالب" : "Student Progress Report"} · {month}</p>
        </div>

        {/* World mode: the report is a page from the Seoul Journey. */}
        <div style={{ position: "relative", height: 140, overflow: "hidden", background: "#FFF9EC" }}>
          <img
            src="/assets/story/world-seoul-journey.webp"
            alt={isAr ? "رحلة سيول، آخر عوالم كلوفرز" : "The Seoul Journey, the last of the Klovers worlds"}
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <p style={{ position: "absolute", insetInline: 0, bottom: 0, margin: 0, padding: "10px 40px", background: "linear-gradient(to top, rgba(46,46,46,0.85), rgba(46,46,46,0))", color: "#FFF9EC", fontSize: 13 }}>
            <strong style={{ color: "#FFFF00" }}>{isAr ? "رحلة سيول" : "Seoul Journey"}</strong>
            {" · "}
            {isAr ? "كل حصة محطة جديدة على الطريق إلى سيول." : "Every class is one more stop on the road to Seoul."}
          </p>
        </div>

        {/* Student info */}
        <div style={{ background: "#FFF9EC", padding: "24px 40px", borderBottom: "1px solid rgba(46,46,46,0.12)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#2E2E2E" }}>{data.name}</h2>
          <p style={{ margin: "0 0 2px", color: "rgba(46,46,46,0.7)", fontSize: 13 }}>{data.email}</p>
          <p style={{ margin: 0, color: "rgba(46,46,46,0.7)", fontSize: 13 }}>{isAr ? "في كلوفرز منذ" : "Student since"} {joinedDate}{data.country ? ` · ${data.country}` : ""}</p>
        </div>

        {/* Stats grid */}
        <div style={{ padding: "32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { label: isAr ? "الحصص المحضورة" : "Classes Attended", value: data.attendance, Icon: CheckCircle2 },
              { label: isAr ? "الحصص المتبقية" : "Sessions Remaining", value: data.sessionsRemaining, Icon: CalendarDays },
              { label: isAr ? "إجمالي XP المكتسب" : "Total XP Earned", value: `${data.weeklyXp} XP`, Icon: Zap },
            ].map(({ label, value, Icon }) => (
              <div key={label} style={{ background: "#FFF9EC", borderRadius: 10, padding: "16px 12px", textAlign: "center", border: "1px solid rgba(46,46,46,0.12)" }}>
                <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><Icon aria-hidden="true" style={{ width: 24, height: 24, color: "#2E2E2E" }} /></div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2E2E2E" }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(46,46,46,0.7)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Level info */}
          <div style={{ background: "#FFF9EC", border: "2px solid #FFFF00", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#2E2E2E" }}>{isAr ? "المستوى الحالي" : "Current Level"}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2E2E2E" }}>{data.level}</p>
            {data.placementScore && <p style={{ margin: "4px 0 0", color: "rgba(46,46,46,0.7)", fontSize: 13 }}>{isAr ? "اختبار تحديد المستوى:" : "Placement test:"} {data.placementScore}/100 · {data.placementLevel}</p>}
          </div>

          {/* Message */}
          <div style={{ borderLeft: "3px solid #FFFF00", paddingLeft: 16, marginBottom: 32 }}>
            <p style={{ margin: "0 0 8px", color: "#2E2E2E", lineHeight: 1.6 }}>
              {isAr
                ? <>عمل رائع يا <strong>{data.name.split(" ")[0]}</strong>! الاستمرارية مفتاح إتقان الكورية، وحتى 10 دقائق من التمرين اليومي تتراكم لتصبح طلاقة مع الوقت.</>
                : <>Keep up the great work, <strong>{data.name.split(" ")[0]}</strong>! Consistency is the key to mastering Korean. Even 10 minutes of daily practice compounds into fluency over time.</>
              }
            </p>
            <p style={{ margin: 0, color: "rgba(46,46,46,0.7)", fontSize: 13 }}><span lang="ko" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>화이팅!</span> — Reham &amp; the Klovers team</p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(46,46,46,0.12)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, color: "rgba(46,46,46,0.7)", fontSize: 12 }}>kloversegy.com · {CONTACT_EMAIL}</p>
            <p style={{ margin: 0, color: "rgba(46,46,46,0.7)", fontSize: 12 }}>{isAr ? "تم الإنشاء" : "Generated"} {new Date().toLocaleDateString(dateLocale)}</p>
          </div>
        </div>
      </div>

      <div className="h-8 print:hidden" />
    </div>
  );
};

export default ProgressReportPage;
