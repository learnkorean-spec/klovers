/**
 * What a student can say for herself — and what saying it does NOT do.
 *
 * Two buttons: "I attended this lesson" and "I paid". Both file a CLAIM. Neither
 * counts a class nor marks money as received: `student_confirm_private_session`
 * stamps `student_confirmed_at`, `student_submit_payment_claim` writes a row in
 * `student_payment_claims`, and Re's confirmation is the only thing that moves a
 * balance or writes `paid_on`. A student can never move her own numbers.
 *
 * The receipt is part of that same asymmetry. She uploads the image; it settles
 * nothing. It exists so the person who DOES settle it is looking at something
 * other than a typed number.
 *
 * AND SHE HAS TO BE ABLE TO SEE THE NUMBERS SHE IS BEING ASKED ABOUT
 * The payment letter names the classes she was taught, by date. This page used
 * to answer the same question with a total — "3 lessons confirmed so far" —
 * which is a number she can neither check nor argue with. A student asked for
 * money on the strength of a count she cannot see the working of is being asked
 * to take somebody's word for it. So the dates are here, read from the same
 * rows the letter reads, and the amount owed is stated as owed rather than as
 * what the package costs.
 *
 * WHY THIS EXISTS SEPARATELY FROM StudentAttendanceRequest
 * That card is built on `enrollments` and unlocks only for a group enrolment
 * that is APPROVED and PAID. Every private student — the only students who have
 * a bundle and a weekly lesson — saw "Attendance is available after payment" and
 * could do nothing. Their world is `teacher_students` + `student_bundles` +
 * `student_class_sessions`, which is what this reads.
 *
 * It renders nothing at all for a student who has no roster row, so it is safe
 * to mount beside the group card for everyone.
 *
 * VISUAL PASS (22 Sep 2026): the "Payment" card was restyled to the current
 * brand palette (see reference/BRAND_PALETTE_REFERENCE.md — yellow #FFFF00,
 * charcoal #2E2E2E, ivory #FFF9EC, plus the functional correct/wrong tokens).
 * Nothing about the data flow, RPCs or state below changed — only className
 * and icon treatment in the render.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Paperclip, Wallet, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  userId: string;
}

interface Bundle {
  id: string;
  label: string | null;
  total_classes: number;
  total_price: number;
  currency: string | null;
  paid_on: string | null;
}

interface SessionRow {
  id: string;
  session_date: string;
  start_time: string | null;
  outcome: string;
  counted: boolean;
  student_confirmed_at: string | null;
}

interface Claim {
  id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: string;
  status: string;
  receipt_path: string | null;
}

// The value is what gets stored (Re reads it in MONEY IN); only the label is translated.
const PAYMENT_METHODS = ["Vodafone Cash", "Fawry", "InstaPay", "Bank transfer", "Other"];
const PAYMENT_METHOD_AR: Record<string, string> = {
  "Bank transfer": "تحويل بنكي",
  Other: "أخرى",
};
const PAY_NUMBER = "+20 101 000 3084";
const WHATSAPP = "https://wa.me/201010003084";

/** A phone screenshot is the usual case; 8 MB covers one comfortably. */
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

/** Today in Cairo as YYYY-MM-DD — the calendar the school runs on. */
function cairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

function formatDate(iso: string, isAr = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(isAr ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

/**
 * Arabic filenames, spaces and "IMG_٢٠٢٦(1).jpg" all arrive here. The bucket
 * key has to survive a URL, so only the extension is kept from what the phone
 * called it and the rest is ours.
 */
function receiptKey(userId: string, file: File): string {
  const dot = file.name.lastIndexOf(".");
  const ext = dot > -1 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  return `${userId}/receipt-${Date.now()}.${ext || "jpg"}`;
}

/** Icon + colour + label for one claim's status — never colour alone (brand rule). */
function claimStatusMeta(status: string, tr: (en: string, ar: string) => string) {
  if (status === "approved") {
    return { Icon: CheckCircle2, label: tr("Confirmed", "مؤكَّد"), cls: "border-correct/30 bg-correct/10 text-correct" };
  }
  if (status === "rejected") {
    return { Icon: XCircle, label: tr("Not found", "لم يُعثر عليه"), cls: "border-wrong/30 bg-wrong-surface text-wrong" };
  }
  return { Icon: Clock, label: tr("Waiting", "بانتظار التأكيد"), cls: "border-border bg-muted text-muted-foreground" };
}

const StudentSelfService = ({ userId }: Props) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const methodLabel = (m: string) => (isAr ? PAYMENT_METHOD_AR[m] ?? m : m);

  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [paidOn, setPaidOn] = useState(cairoToday());
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const load = useCallback(async () => {
    const { data: roster, error: rosterError } = await supabase
      .from("teacher_students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (rosterError) {
            console.error("[StudentSelfService] failed to load roster:", rosterError);
            setLoading(false);
            return;
    }

    if (!roster?.id) {
      setStudentId(null);
      setLoading(false);
      return;
    }
    setStudentId(roster.id);

    const [bundleRes, sessionRes, claimRes] = await Promise.all([
      supabase
        .from("student_bundles")
        .select("id, label, total_classes, total_price, currency, paid_on")
        .eq("student_id", roster.id)
        .eq("status", "active")
        .order("purchased_on", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("student_class_sessions")
        .select("id, session_date, start_time, outcome, counted, student_confirmed_at")
        .eq("student_id", roster.id)
        .order("session_date", { ascending: false })
        .limit(20),
      supabase
        .from("student_payment_claims")
        .select("id, amount, currency, paid_on, method, status, receipt_path")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const b = (bundleRes.data ?? null) as Bundle | null;
    setBundle(b);
    if (b?.currency) setCurrency(b.currency);
    setSessions((sessionRes.data ?? []) as SessionRow[]);
    setClaims((claimRes.data ?? []) as Claim[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  /**
   * The classes she was actually charged for, oldest first — the same rows,
   * in the same order, as the list in the payment letter. Ordered here rather
   * than in the query because the query is shared with the confirm strip
   * above, which wants the newest lesson first.
   */
  const taught = useMemo(
    () => sessions.filter(s => s.counted).sort((a, b) => a.session_date.localeCompare(b.session_date)),
    [sessions],
  );
  const used = taught.length;
  const remaining = bundle ? Math.max(0, bundle.total_classes - used) : 0;
  const owes = !!bundle && !bundle.paid_on;

  // A lesson can be claimed once it is in the past and has not been settled yet.
  const toConfirm = useMemo(() => {
    const today = cairoToday();
    return sessions.filter(
      s => s.session_date <= today && !s.counted && s.outcome === "scheduled"
    );
  }, [sessions]);

  /** Opens the form on the figure she is being asked for — still editable, because a part payment is a real thing. */
  function openClaimForm() {
    if (!amount && bundle) setAmount(String(bundle.total_price));
    setShowForm(true);
  }

  async function confirmSession(id: string) {
    setBusy(id);
    const { error } = await supabase.rpc("student_confirm_private_session", {
      p_session_id: id,
    } as never);
    setBusy(null);
    if (error) {
      toast({ title: tr("Could not send that", "تعذّر الإرسال"), description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: tr("Sent to your teacher", "تم الإرسال للمعلّمة"),
      description: tr(
        "She confirms it, and then it comes off your balance.",
        "بعد تأكيدها تُخصم الحصة من رصيدك.",
      ),
    });
    void load();
  }

  async function submitClaim() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: tr("Enter the amount you paid", "اكتب المبلغ الذي دفعته"), variant: "destructive" });
      return;
    }
    if (receipt && receipt.size > MAX_RECEIPT_BYTES) {
      toast({
        title: tr("That image is too large", "الصورة كبيرة جدًا"),
        description: tr("Send one under 8 MB.", "ابعتي صورة أقل من 8 ميجا."),
        variant: "destructive",
      });
      return;
    }
    setBusy("claim");

    // The upload goes first and its failure stops the claim: a claim that says
    // "receipt attached" with no file behind it is worse than no claim at all,
    // and the form is still on screen with everything she typed still in it.
    let receiptPath: string | null = null;
    if (receipt) {
      const key = receiptKey(userId, receipt);
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(key, receipt, { upsert: false, contentType: receipt.type || undefined });
      if (uploadError) {
        setBusy(null);
        toast({
          title: tr("The image did not send", "الصورة ماتبعتتش"),
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }
      receiptPath = key;
    }

    const { error } = await supabase.rpc("student_submit_payment_claim", {
      p_amount: value,
      p_currency: currency,
      p_paid_on: paidOn,
      p_method: method,
      p_sender_name: senderName || null,
      p_note: note || null,
      p_bundle_id: bundle?.id ?? null,
      p_receipt_path: receiptPath,
    } as never);
    setBusy(null);
    if (error) {
      toast({ title: tr("Could not send that", "تعذّر الإرسال"), description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: tr("Thank you — sent", "شكرًا — تم الإرسال"),
      description: tr("Your teacher will confirm it shortly.", "ستؤكّده المعلّمة قريبًا."),
    });
    setShowForm(false);
    setAmount("");
    setNote("");
    setSenderName("");
    setReceipt(null);
    void load();
  }

  if (loading) return <Skeleton className="h-40 w-full rounded-lg" />;
  // Not a private student — this card has nothing to say.
  if (!studentId) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {tr("My lessons", "حصصي")}
          </CardTitle>
          {bundle && (
            <p className="text-sm text-muted-foreground">
              {tr(
                `${used} of ${bundle.total_classes} taught · ${remaining} left`,
                `اتعمل ${used} من ${bundle.total_classes} · الباقي ${remaining}`,
              )}
              {bundle.label ? ` · ${bundle.label}` : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {toConfirm.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tr(
                "Nothing waiting. After a lesson, it appears here to confirm.",
                "لا يوجد شيء بانتظارك. بعد كل حصة تظهر هنا لتأكيدها.",
              )}
            </p>
          ) : (
            toConfirm.map(s => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatDate(s.session_date, isAr)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.student_confirmed_at
                      ? tr("Sent — waiting for your teacher", "تم الإرسال — بانتظار المعلّمة")
                      : tr("Did this lesson happen?", "هل حضرت هذه الحصة؟")}
                  </p>
                </div>
                {s.student_confirmed_at ? (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {tr("Waiting", "بانتظار التأكيد")}
                  </Badge>
                ) : (
                  <Button size="sm" disabled={busy === s.id} onClick={() => void confirmSession(s.id)}>
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("I attended", "حضرت")}
                  </Button>
                )}
              </div>
            ))
          )}

          {/* The dates, not the count. This is the list the payment letter
              quotes; a student asked for money should be able to read the same
              rows the ask was built from. */}
          {taught.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {tr("Lessons counted", "الحصص المحسوبة")}
              </p>
              <ul className="space-y-0.5">
                {taught.map(s => (
                  <li key={s.id} className="text-sm text-muted-foreground">
                    {formatDate(s.session_date, isAr)}
                  </li>
                ))}
              </ul>
              {bundle && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {remaining === 0
                    ? tr("This package is fully used.", "الباقة اتستخدمت بالكامل.")
                    : tr(
                        `${remaining} lesson${remaining === 1 ? "" : "s"} left on this package.`,
                        `الباقي في الباقة: ${remaining} ${remaining === 1 ? "حصة" : "حصص"}.`,
                      )}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-klovers-yellow text-charcoal">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
            {tr("Payment", "الدفع")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Due / received — always paired with an icon, never colour alone. */}
          {bundle && (
            owes ? (
              <div className="card-edge flex items-start gap-2 rounded-lg bg-klovers-yellow p-3 text-charcoal dark:bg-card dark:text-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  {tr(
                    `${bundle.total_price} ${bundle.currency ?? ""} due for this package.`,
                    `المستحق: ${bundle.total_price} ${bundle.currency ?? ""}`,
                  )}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-correct/30 bg-correct/10 p-3 text-correct">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  {tr("Received — thank you.", "تم الاستلام — شكرًا لك.")}
                </p>
              </div>
            )
          )}

          <div className="rounded-lg border bg-ivory p-3 text-sm text-charcoal dark:bg-card dark:text-foreground">
            <p className="font-medium">{tr("How to pay", "طريقة الدفع")}</p>
            <p className="text-muted-foreground">
              {tr("Vodafone Cash or Fawry on", "فودافون كاش أو فوري على الرقم")}{" "}
              <span className="inline-block whitespace-nowrap font-semibold" dir="ltr">{PAY_NUMBER}</span>.{" "}
              {tr("For a bank transfer, ask on", "للتحويل البنكي، اسألنا على")}{" "}
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-semibold underline">
                {tr("WhatsApp", "واتساب")}
              </a>{" "}
              {tr("and we will send the details.", "وسنرسل لك التفاصيل.")}
            </p>
          </div>

          {!showForm ? (
            <Button
              variant={owes ? "default" : "outline"}
              className="h-auto min-h-10 w-full whitespace-normal"
              onClick={openClaimForm}
            >
              {tr("I have paid — upload the receipt", "دفعت — ارفعي صورة الإيصال")}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border bg-ivory p-3 dark:bg-card">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs">
                  {tr("Amount", "المبلغ")}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  {tr("Currency", "العملة")}
                  <input
                    value={currency}
                    onChange={e => setCurrency(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  {tr("Date paid", "تاريخ الدفع")}
                  <input
                    type="date"
                    max={cairoToday()}
                    value={paidOn}
                    onChange={e => setPaidOn(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  {tr("How you paid", "طريقة الدفع")}
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{methodLabel(m)}</option>)}
                  </select>
                </label>
              </div>

              {/* The one field here that is not somebody's memory. Optional on
                  purpose: a student who paid at a kiosk and kept no screenshot
                  must still be able to say so. */}
              <label className="block text-xs">
                {tr("Photo of the receipt (optional)", "صورة الإيصال (اختياري)")}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setReceipt(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm file:me-2 file:rounded file:border-0 file:bg-klovers-yellow file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-charcoal"
                />
                {receipt && (
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    {receipt.name}
                  </span>
                )}
              </label>

              <label className="block text-xs">
                {tr("Name or number it came from (optional)", "الاسم أو الرقم الذي تم التحويل منه (اختياري)")}
                <input
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                />
              </label>
              <label className="block text-xs">
                {tr("Anything else (optional)", "ملاحظات أخرى (اختياري)")}
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={busy === "claim"} onClick={() => void submitClaim()}>
                  {busy === "claim" ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("Send", "إرسال")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {tr("Cancel", "إلغاء")}
                </Button>
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div className="space-y-1 pt-1">
              {claims.map(c => {
                const { Icon, label, cls } = claimStatusMeta(c.status, tr);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">
                      {c.amount} {c.currency} · {formatDate(c.paid_on, isAr)} · {methodLabel(c.method)}
                      {c.receipt_path && (
                        <Paperclip className="ms-1 inline h-3 w-3" aria-hidden="true" />
                      )}
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-medium ${cls}`}>
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSelfService;
