import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import {
  BOOK_SHELF, BOOK_LADDER, BOOK_RULES, BOOK_BLOCKERS, GRAMMAR_RANGES,
  REVIEW_CLASSES, type BookState,
} from "@/constants/bookPlan";

/**
 * Admin → Book Plan.
 *
 * The whole Klovers shelf on one screen: which books exist, which are half
 * built, and the rules any new book follows. Re asked for this on 1 Oct 2026
 * after the range was restyled and it stopped being obvious what was finished.
 *
 * The data lives in src/constants/bookPlan.ts, and covers come from the picture
 * library, so a restyled cover appears here as soon as it is saved there — this
 * screen renders the plan, it does not keep a second copy of it.
 */

const COVERS = "/picture-library/scenes";

const STATE_STYLE: Record<BookState, string> = {
  done: "bg-[#39FF14] text-[#2E2E2E] border-transparent",
  partial: "bg-[#FFFF00] text-[#2E2E2E] border-transparent",
  missing: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATE_ICON: Record<BookState, typeof CheckCircle2> = {
  done: CheckCircle2,
  partial: CircleDashed,
  missing: AlertTriangle,
};

function ar(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function BookPlanBoard() {
  const counts = useMemo(() => {
    const c = { done: 0, partial: 0, missing: 0 };
    for (const b of BOOK_SHELF) c[b.state] += 1;
    return c;
  }, []);

  return (
    <div lang="ar" dir="rtl" className="space-y-8">
      <header className="space-y-2">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold">
          <BookOpen className="h-5 w-5" /> لوحة كتب كلوفرز
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          كل كتاب في السلسلة، وأين هو الآن، والقواعد التي يُبنى عليها أي كتاب جديد.
          الأغلفة تُقرأ من مكتبة الصور، فأي غلاف جديد يظهر هنا بمجرد حفظه هناك.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {[
          { k: "جاهز", v: counts.done, cls: "bg-[#39FF14] text-[#2E2E2E]" },
          { k: "نصف مبنيّ", v: counts.partial, cls: "bg-[#FFFF00] text-[#2E2E2E]" },
          { k: "لم يُبدأ", v: counts.missing, cls: "bg-muted text-foreground" },
        ].map(({ k, v, cls }) => (
          <div key={k} className={`min-w-[7rem] rounded-2xl px-4 py-3 ${cls}`}>
            <div className="text-xs font-bold opacity-75">{k}</div>
            <div className="text-2xl font-extrabold tabular-nums">{ar(v)}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          الرفّ
        </h3>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))]">
          {BOOK_SHELF.map((b) => {
            const Icon = STATE_ICON[b.state];
            return (
              <Card key={b.titleAr} className="overflow-hidden">
                {b.cover ? (
                  <img
                    src={`${COVERS}/${b.cover}.jpg`}
                    alt=""
                    loading="lazy"
                    className="block aspect-[148/210] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[148/210] w-full items-center justify-center bg-muted p-3 text-center text-xs font-bold leading-relaxed text-muted-foreground">
                    لا غلاف بعد
                  </div>
                )}
                <CardContent className="flex min-w-0 flex-col gap-1.5 p-3">
                  <Badge className={`w-fit gap-1 text-[10px] ${STATE_STYLE[b.state]}`}>
                    <Icon className="h-3 w-3" /> {b.statusAr}
                  </Badge>
                  <div className="text-sm font-extrabold leading-snug">{b.titleAr}</div>
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    {b.noteAr}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          السلّم الرسمي
        </h3>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2E2E2E] text-[#FFFF00]">
                {["المستوى", "TOPIK", "الحصص", "الحالة"].map((h) => (
                  <th key={h} className="whitespace-nowrap p-2.5 text-right text-xs font-extrabold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOOK_LADDER.map((l) => (
                <tr key={l.nameAr} className="border-b last:border-b-0">
                  <td className="whitespace-nowrap p-2.5 font-bold">{l.nameAr}</td>
                  <td className="whitespace-nowrap p-2.5 tabular-nums">
                    {l.topik === null ? "—" : ar(l.topik)}
                  </td>
                  <td className="whitespace-nowrap p-2.5 tabular-nums">{ar(l.classes)}</td>
                  <td className="whitespace-nowrap p-2.5">
                    <Badge className={`text-[10px] ${STATE_STYLE[l.state]}`}>{l.statusAr}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          المصدر: <code className="font-mono">src/constants/levels.ts</code>. الحصة ستون
          دقيقة، حصة واحدة في الأسبوع. المستوى = ستة شهور.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          شكل الكتاب
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-sm font-extrabold">الكتاب = المستوى كاملًا = ٢٤ حصة</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                كتاب المستوى الأول مبنيّ هكذا بالفعل: أربع وعشرون حصة في مجلّد واحد.
                وهو يطابق باقة الستة شهور، وهي الباقة التي يُباع بها المستوى. لهذا لا
                تُقسَّم الكتب إلى أجزاء — الكتاب الذي يعمل ويُباع هو المرجع.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                حصص المراجعة: {REVIEW_CLASSES.map((n) => ar(n)).join(" · ")}. وفي آخر كل
                كتاب مفتاح الإجابات.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-sm font-extrabold">توزيع القواعد</div>
              <ul className="space-y-1.5">
                {GRAMMAR_RANGES.map((g) => (
                  <li key={g.levelAr} className="text-xs leading-relaxed text-muted-foreground">
                    <b className="text-foreground">{g.levelAr}:</b> {g.rangeAr} — {g.sourceAr}
                  </li>
                ))}
                <li className="text-xs leading-relaxed text-muted-foreground">
                  <b className="text-foreground">المستويات ٣ إلى ٦:</b> لم يُحدَّد بعد
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          قواعد ثابتة لأي كتاب جديد
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {BOOK_RULES.map((r) => (
            <Card key={r.titleAr}>
              <CardContent className="space-y-2 p-4">
                <div className="text-sm font-extrabold">{r.titleAr}</div>
                <ul className="list-inside list-disc space-y-1.5">
                  {r.pointsAr.map((p) => (
                    <li key={p} className="text-xs leading-relaxed text-muted-foreground">
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          ما يعطّل البيع الآن
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {BOOK_BLOCKERS.map((b) => (
            <Card key={b.titleAr} className="border-destructive/30">
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> {b.titleAr}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{b.bodyAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
