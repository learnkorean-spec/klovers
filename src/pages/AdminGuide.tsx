/**
 * /admin/guide - how to send the trial attendance invitations.
 *
 * Static on purpose. This page explains what the other admin buttons do, so
 * it must render when everything else is failing: no query, no state, no
 * fetch, no dependency beyond react-router's Link. If the dashboard is broken
 * at 2am, this page still tells her which sessions have been contacted.
 *
 * The session table is a SNAPSHOT, dated in the page itself, with the query
 * that regenerates it printed underneath. A figure that is visibly a snapshot
 * can be distrusted; a figure that pretends to be live cannot.
 */
import { Link } from "react-router-dom";

const BRAND = "#FFFF00";

type Session = {
  date: string;
  local: string;
  lang: string;
  n: number;
  sent: boolean;
  meet: string;
};

/** Snapshot, 9 Sep 2026. Regenerate with the SQL printed at the foot of the page. */
const SESSIONS: Session[] = [
  { date: "الجمعة ١٨ سبتمبر", local: "٨:٣٠ م", lang: "عربي", n: 9, sent: true, meet: "meet.google.com/siw-icoz-fko" },
  { date: "السبت ١٩ سبتمبر", local: "٨:٣٠ م", lang: "إنجليزي", n: 10, sent: false, meet: "meet.google.com/oye-khbo-zjc" },
  { date: "الأحد ٢٠ سبتمبر", local: "٨:٠٠ م", lang: "إنجليزي", n: 10, sent: false, meet: "meet.google.com/tmn-ovdz-sdv" },
  { date: "الجمعة ٢٥ سبتمبر", local: "٨:٣٠ م", lang: "عربي", n: 8, sent: false, meet: "meet.google.com/qdx-mngs-upq" },
  { date: "السبت ٢٦ سبتمبر", local: "٨:٣٠ م", lang: "إنجليزي", n: 10, sent: false, meet: "meet.google.com/pww-usge-cpu" },
  { date: "الأحد ٢٧ سبتمبر", local: "٨:٠٠ م", lang: "إنجليزي", n: 9, sent: false, meet: "meet.google.com/njo-jorg-gbd" },
];

const STEPS = [
  <>افتحي <Link to="/admin?tab=trials" className="underline decoration-2 underline-offset-4">تبويب الحصص التجريبية</Link>.</>,
  <>من قايمة <Ui>All statuses</Ui> اختاري <Ui>Pending</Ui> — بتخفي الحجوزات الملغية.</>,
  <>انزلي تحت قسم <Ui>TBA — Unscheduled</Ui> خالص. كل اللي فيه ملغي، وزراره بيقول <Ui>(0)</Ui> عن حق.</>,
  <>دوّري على عنوان الحصة — مثلًا <Ui>Saturday, Sep 19, 2026</Ui>.</>,
  <>اضغطي <Ui go>Ask them to confirm</Ui> جنب العنوان. <b>ده مش إرسال</b> — بيفتح قايمة بالأسماء والعدد.</>,
  <>طابقي العدد مع الجدول فوق. لو مختلف، اقفلي من غير ضغط.</>,
  <>لو مطابق، اضغطي <Ui go>Send to N</Ui>.</>,
];

const FORBIDDEN: Array<[string, string]> = [
  ["Accept all pending", "بيغيّر حالة كل الحجوزات دفعة واحدة، ومش بيغيّر حاجة في مين بيستلم إيميل. مالهوش لزمة."],
  ["Confirm", "بيسجّل إن الطالبة قالت «هحضر» وهي مقالتش."],
  ["Reject / Unschedule", "بيلغي الحجز أو بيشيل الميعاد."],
  ["Resend with new dates", "إيميل تاني معناه «اختاري ميعاد جديد»، ومفيهوش زرار تأكيد."],
];

const AUTOMATIC: Array<[string, string, string]> = [
  ["إيميل التحضير + رابط اختبار المستوى", "اليوم اللي قبل الحصة", "كل الحصة"],
  ["متابعة يوم ١ و٣ و٧", "بعد الحصة", "اللي حضروا"],
  ["تنبيه «الحصة أقل من ٥»", "٣ الفجر يوميًا", "ليكي"],
];

const TROUBLE: Array<[string, string]> = [
  ["الأرقام في اللوحة غلط", "Ctrl+Shift+R. اللوحة بتحتفظ بأرقام قديمة في المتصفح."],
  ["النافذة بعدد غير متوقع", "اقفليها من غير ضغط."],
  ["ضغطتي زرار بالغلط", "أغلب الحاجات بترجع — الإيميل اللي خرج لأ."],
  ["طالبة تقول مجاليش", "السبام الأول، بعدين «Ask again» بعد ٤٨ ساعة."],
];

function Ui({ children, go }: { children: React.ReactNode; go?: boolean }) {
  return (
    <code
      dir="ltr"
      className="inline-block rounded border px-2 py-0.5 text-[13px] font-mono whitespace-nowrap align-middle"
      style={
        go
          ? { background: BRAND, borderColor: "#CFCF00", color: "#111", fontWeight: 700 }
          : { background: "rgba(127,127,127,.12)", borderColor: "rgba(127,127,127,.3)" }
      }
    >
      {children}
    </code>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-1 flex items-center gap-3 text-xl font-bold">
      <span className="block h-3 w-3 shrink-0 rounded-sm" style={{ background: BRAND }} />
      {children}
    </h2>
  );
}

export default function AdminGuide() {
  const remaining = SESSIONS.filter((s) => !s.sent).reduce((a, s) => a + s.n, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="bg-[#111] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="block h-5 w-5 rounded" style={{ background: BRAND }} />
            <span className="text-xs font-bold tracking-[.16em] text-neutral-300">KLOVERS</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold leading-snug">دليل إرسال دعوات الحصص التجريبية</h1>
          <p className="m-0 text-sm text-neutral-400">
            الأرقام لقطة من ٩ سبتمبر ٢٠٢٦ — الاستعلام اللي بيجدّدها في آخر الصفحة
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 text-[16.5px] leading-[1.85]">
        <H>فين وصلنا</H>
        <p className="mb-4 pr-6 text-sm text-muted-foreground">
          المواعيد بتوقيت القاهرة. في بانكوك زوّدي ٤ ساعات. فاضل <b>{remaining}</b> طالبة.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px] tabular-nums">
            <thead>
              <tr className="border-b-2 border-foreground text-xs tracking-wide text-muted-foreground">
                <th className="pb-2 text-right font-medium">الحصة</th>
                <th className="pb-2 pr-4 text-right font-medium">عندك</th>
                <th className="pb-2 pr-4 text-right font-medium">اللغة</th>
                <th className="pb-2 pr-4 text-right font-medium">عدد</th>
                <th className="pb-2 pr-4 text-right font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map((s) => (
                <tr key={s.date} className="border-b border-border last:border-0">
                  <td className="py-3">{s.date}</td>
                  <td className="py-3 pr-4">{s.local}</td>
                  <td className="py-3 pr-4">{s.lang}</td>
                  <td className="py-3 pr-4 font-semibold">{s.n}</td>
                  <td className="py-3 pr-4 whitespace-nowrap font-semibold">
                    {s.sent ? (
                      <span className="text-emerald-600 dark:text-emerald-400">اتبعت</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">لسه</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H>إزاي تبعتي لحصة</H>
        <p className="mb-4 pr-6 text-sm text-muted-foreground">
          نفس الخطوات لكل حصة. الترتيب مهم — الفلتر قبل البحث.
        </p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {STEPS.map((step, i) => (
            <li key={i} className="relative min-h-[30px] pr-11">
              <span
                className="absolute right-0 top-[3px] grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold tabular-nums"
                style={{ background: BRAND, color: "#111" }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <H>أزرار متضغطيهاش</H>
        <div className="rounded-l-lg border-r-4 border-red-500 bg-red-50 p-4 dark:bg-red-950/40">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {FORBIDDEN.map(([name, why]) => (
              <li key={name}>
                <Ui>{name}</Ui> — {why}
              </li>
            ))}
          </ul>
          <p className="mb-0 mt-3 text-sm">لو حسيتي إنك محتاجة واحد منهم، اسألي قبلها.</p>
        </div>

        <H>اللي بيمشي لوحده</H>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px]">
            <tbody>
              {AUTOMATIC.map(([what, when, who]) => (
                <tr key={what} className="border-b border-border last:border-0">
                  <td className="py-3">{what}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{when}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          أول دفعة تحضير: <b>١٧ سبتمبر</b>، ٩ رسايل، لحصة ١٨. مش محتاجة منك حاجة.
        </p>

        <H>بعد ما تبعتي</H>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <li><Ui>0 confirmed</Ui> بتزيد لوحدها مع كل رد.</li>
          <li><Ui>Said yes</Ui> / <Ui>Said no</Ui> بتظهر جنب الاسم أول ما تضغط الطالبة.</li>
          <li><Ui>Asked, no reply</Ui> يعني الرسالة راحت والرد لسه — طبيعي في الأول.</li>
          <li>اللي تقول «مش هقدر أحضر» مقعدها بيتفضّى ومحتاجة ميعاد تاني.</li>
        </ul>
        <p className="mt-4">
          زرار <Ui>Ask again</Ui> الفردي مقفول <b>٤٨ ساعة</b> بعد آخر إرسال، عشان ميتبعتش نفس
          الرسالة مرتين. استخدميه بس لو الطالبة فعلًا مردّتش.
        </p>

        <H>لو حصلت مشكلة</H>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px]">
            <tbody>
              {TROUBLE.map(([what, fix]) => (
                <tr key={what} className="border-b border-border last:border-0">
                  <td className="py-3 align-baseline font-medium">{what}</td>
                  <td className="py-3 pr-4 align-baseline text-muted-foreground">{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H>روابط الميت</H>
        <p className="mb-4 pr-6 text-sm text-muted-foreground">
          متسجّلة في النظام وبتتحط في الرسايل لوحدها.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px]">
            <tbody>
              {SESSIONS.map((s) => (
                <tr key={s.meet} className="border-b border-border last:border-0">
                  <td className="py-3 whitespace-nowrap">{s.date}</td>
                  <td className="py-3 pr-4 font-mono text-[14px]" dir="ltr">{s.meet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-14 border-t border-border pt-5 text-sm text-muted-foreground">
          <p>الأرقام فوق لقطة، مش حية. لتجديدها:</p>
          <pre dir="ltr" className="mt-2 overflow-x-auto rounded bg-muted p-3 text-[12.5px] leading-relaxed">
{`select trial_date,
  count(*) filter (where coalesce(status,'') <> 'cancelled') as live,
  count(*) filter (where coalesce(status,'') <> 'cancelled'
                     and attendance_email_sent_at is not null) as asked
from trial_bookings
where trial_date >= current_date and trial_date < date '2099-01-01'
group by trial_date order by trial_date;`}
          </pre>
          <p className="mt-4">
            <Link to="/admin/today" className="underline decoration-2 underline-offset-4">
              ← رجوع للوحة
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
