import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  cartActions, formatPrice, productName, startCheckout, useCart, type ShopProduct,
  trackShop,
} from "@/lib/shop";
import { ProductImage } from "./ProductCard";
import KloverIcon from "@/components/KloverIcon";
import { WHATSAPP_BASE, MANUAL_PAY_NUMBER } from "@/lib/siteConfig";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * The bag. Lines whose product is no longer in the shop are dropped from
 * view (and from checkout) rather than shown with a stale price.
 */
export function CartDrawer({ open, onOpenChange, products, isAr }: {
  open: boolean; onOpenChange: (o: boolean) => void; products: ShopProduct[]; isAr: boolean;
}) {
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Free bag: the download links that came back instead of a payment page.
  const [downloads, setDownloads] = useState<{ bookId: string; url: string; name: string; signedIn: boolean }[] | null>(null);

  const lines = cart
    .map((l) => ({ line: l, product: products.find((p) => p.price.id === l.priceId) }))
    .filter((x): x is { line: typeof x.line; product: ShopProduct } => !!x.product);
  const currencies = new Set(lines.map((x) => x.product.price.currency));
  const subtotal = lines.reduce((s, x) => s + x.product.price.amount * x.line.quantity, 0);
  const isFreeBag = lines.length > 0 && lines.every((x) => x.product.price.amount === 0 && !!x.product.bookId);
  // Egypt (prices in EGP): pay by Vodafone Cash / InstaPay with a receipt, the
  // same way as course fees (Re, 1 Oct 2026). Card checkout stays available.
  const isEgp = currencies.size === 1 && [...currencies][0].toLowerCase() === "egp";

  // A manual, non-Stripe way to pay (Egypt: Vodafone Cash / Fawry / InstaPay
  // / bank transfer). The book is not delivered automatically here — Re
  // assigns it by hand once the transfer is confirmed, same as course
  // bundles paid this way. Kept as a fallback next to Stripe checkout, not a
  // replacement for it.
  const manualPayHref = () => {
    const items = lines.map((x) => `${productName(x.product, isAr)} × ${x.line.quantity}`).join(isAr ? "، " : ", ");
    const total = currencies.size === 1 ? formatPrice(subtotal, [...currencies][0], isAr) : "";
    const text = isAr
      ? `مرحبًا، أريد الدفع يدويًا (بدون بطاقة) عن: ${items}.${total ? ` الإجمالي: ${total}.` : ""} سأحوّل على ${MANUAL_PAY_NUMBER} (فودافون كاش / فوري / إنستا باي) أو تحويل بنكي، وأرسل الإيصال هنا.`
      : `Hi, I'd like to pay manually (no card) for: ${items}.${total ? ` Total: ${total}.` : ""} I'll send the transfer receipt here.`;
    return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
  };

  const checkout = async () => {
    setBusy(true);
    setNotice(null);
    trackShop({ event: "begin_checkout", items: lines.length, value: subtotal / 100, currency: [...currencies][0] ?? "" });
    const res = await startCheckout(lines.map((x) => x.line));
    if (res.ok === true && "free" in res) {
      const found = res.downloads.map((d) => {
        const l = lines.find((x) => x.product.bookId === d.bookId);
        return { ...d, name: l ? productName(l.product, isAr) : d.bookId, signedIn: res.signedIn };
      });
      trackShop({ event: "free_download", items: found.length });
      lines.forEach((x) => cartActions.remove(x.line.priceId));
      setDownloads(found);
      setBusy(false);
      // One book starts downloading by itself; several are left as links,
      // because browsers block a burst of automatic downloads.
      if (found.length === 1) {
        const a = document.createElement("a");
        a.href = found[0].url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      return;
    }
    if (res.ok === true) {
      window.location.assign(res.url);
      return;
    }
    setBusy(false);
    const { reason } = res as Extract<typeof res, { ok: false }>;
    if (reason === "sign_in") {
      navigate(`/login?redirect=${encodeURIComponent("/shop")}`);
    } else if (reason === "owned") {
      setNotice(isAr
        ? "أحد الكتب في الحقيبة موجود بالفعل ضمن «كتبي» في لوحة الطالب، ويمكن حذفه من الحقيبة."
        : "One of these books is already in My books on your dashboard. It can be removed from the bag.");
    } else {
      setNotice(isAr
        ? "تعذّر فتح صفحة الدفع الآن. يُرجى المحاولة بعد قليل."
        : "Checkout could not open right now. Please try again in a moment.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setDownloads(null); onOpenChange(o); }}>
      <SheetContent side={isAr ? "left" : "right"} className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-md" dir={isAr ? "rtl" : "ltr"}>
        <SheetHeader className="border-b border-border py-4 pl-5 pr-12 text-start">
          <SheetTitle className="font-display text-lg">{isAr ? "الحقيبة" : "Your bag"}</SheetTitle>
          <SheetDescription className="sr-only">
            {isAr ? "المنتجات المختارة قبل الدفع" : "Items chosen before checkout"}
          </SheetDescription>
        </SheetHeader>

        {downloads ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
            <p className="font-display text-lg font-semibold text-foreground">
              {isAr ? "الكتاب جاهز للتنزيل." : "Your book is ready."}
            </p>
            <ul className="space-y-2">
              {downloads.map((d) => (
                <li key={d.bookId}>
                  <a
                    href={d.url}
                    download
                    className="flex h-12 items-center justify-between rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="shrink-0 text-primary-foreground rounded-full bg-primary px-3 py-1 text-xs">
                      {isAr ? "تنزيل" : "Download"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {downloads[0]?.signedIn
                ? (isAr ? "أُضيف أيضًا إلى «كتبي» في لوحة الطالب، ويمكن تنزيله منها في أي وقت." : "It was also added to My books on your dashboard, so it can be downloaded there any time.")
                : (isAr ? "الرابط صالح لعشر دقائق. لحفظ الكتاب في «كتبي» وتنزيله لاحقًا يمكن إنشاء حساب مجاني." : "This link works for ten minutes. A free account keeps the book in My books for later.")}
            </p>
            {!downloads[0]?.signedIn && (
              <Button variant="outline" onClick={() => navigate(`/signup?redirect=${encodeURIComponent("/shop")}`)}>
                {isAr ? "إنشاء حساب مجاني" : "Create a free account"}
              </Button>
            )}
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-base font-semibold text-foreground">
              {isAr ? "الحقيبة فارغة." : "The bag is empty."}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr ? "يمكن البدء بكتاب واحد من الرف." : "One book from the shelf is a good start."}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isAr ? "متابعة التصفّح" : "Keep browsing"}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map(({ line, product }) => (
                <li key={line.priceId} className="flex gap-3 py-4">
                  <ProductImage product={product} isAr={isAr} className="h-20 w-16 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      to={`/shop/products/${product.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="font-medium leading-snug text-foreground hover:underline"
                    >
                      {productName(product, isAr)}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(product.price.amount, product.price.currency, isAr)}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      {product.bookId ? (
                        <span className="text-xs text-muted-foreground">{isAr ? "نسخة واحدة" : "One copy"}</span>
                      ) : (
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={isAr ? "تقليل الكمية" : "Decrease quantity"}
                            onClick={() => cartActions.setQuantity(line.priceId, line.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm" aria-live="polite">{line.quantity}</span>
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={isAr ? "زيادة الكمية" : "Increase quantity"}
                            onClick={() => cartActions.setQuantity(line.priceId, line.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={isAr ? `حذف ${productName(product, isAr)}` : `Remove ${productName(product, isAr)}`}
                    onClick={() => cartActions.remove(line.priceId)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 border-t border-border bg-muted/50 px-5 py-3">
              <KloverIcon name="flashcard-ga" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {isAr ? "هدية مجانية مع كل طلب" : "A free gift with every order"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "ورقة الهانغول للمبتدئين، بصيغة PDF." : "The Hangul starter sheet, as a PDF."}
                </p>
              </div>
              <a
                href={isAr ? "/hangul-starter-ar.pdf" : "/hangul-starter-en.pdf"}
                download
                className="shrink-0 text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
              >
                {isAr ? "تحميل" : "Download"}
              </a>
            </div>

            <div className="space-y-3 border-t border-border px-5 py-4">
              {currencies.size === 1 && !isFreeBag && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "المجموع" : "Subtotal"}</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(subtotal, [...currencies][0], isAr)}
                  </span>
                </div>
              )}
              {notice && <p role="alert" className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{notice}</p>}
              {!isFreeBag && isEgp && (
                <EgyptPay
                  isAr={isAr}
                  total={subtotal}
                  lines={lines}
                  onDone={() => lines.forEach((x) => cartActions.remove(x.line.priceId))}
                  onSignIn={() => navigate(`/login?redirect=${encodeURIComponent("/shop")}`)}
                  whatsappHref={manualPayHref()}
                />
              )}
              <Button variant={isEgp && !isFreeBag ? "outline" : "default"} className="h-12 w-full text-base font-semibold" onClick={checkout} disabled={busy}>
                {isFreeBag
                  ? (busy ? (isAr ? "جارٍ التجهيز…" : "Getting it ready…") : (isAr ? "إتمام الطلب وتنزيل مجاني" : "Check out and download free"))
                  : (busy ? (isAr ? "جارٍ فتح صفحة الدفع…" : "Opening checkout…") : isEgp ? (isAr ? "أو الدفع بالبطاقة" : "Or pay by card") : (isAr ? "الدفع الآمن" : "Checkout Securely"))}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {isFreeBag
                  ? (isAr ? "مجاني بالكامل، دون بطاقة ودون حساب." : "Completely free: no card and no account needed.")
                  : isAr
                  ? "الدفع بالبطاقة عبر صفحة دفع آمنة، ويتطلّب الشراء تسجيل الدخول لإضافة الكتب إلى «كتبي»."
                  : "Card payment happens on a secure payment page. Signing in is needed so books land in My books."}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Egypt: pay the bag by Vodafone Cash or InstaPay, then upload the receipt —
 * the same steps as paying a course (EgyptPaymentPage). The receipt goes to the
 * private `receipts` bucket and a payment claim is filed with the RPC
 * student_submit_payment_claim; its note ends in "[shop:<book ids>]". Re
 * approves it in MONEY IN, which then calls edge function shop-manual-fulfil to
 * put the books in My books.
 */
function EgyptPay({ isAr, total, lines, onDone, onSignIn, whatsappHref }: {
  isAr: boolean;
  total: number;
  lines: { line: { priceId: string }; product: ShopProduct }[];
  onDone: () => void;
  onSignIn: () => void;
  whatsappHref: string;
}) {
  const { user } = useAuth();
  const [method, setMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [file, setFile] = useState<File | null>(null);
  const [sender, setSender] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const amount = total / 100;
  const books = lines.map((x) => x.product.bookId).filter((b): b is string => !!b);

  if (state === "sent") {
    return (
      <div role="status" className="rounded-xl border-2 border-klovers-green bg-ivory p-4 text-sm text-charcoal dark:bg-card dark:text-foreground">
        <p className="font-bold">{tr("Receipt received.", "تم استلام الإيصال.")}</p>
        <p className="mt-1">
          {tr("The book is added to My books as soon as the transfer is confirmed.", "يُضاف الكتاب إلى «كتبي» فور تأكيد التحويل.")}
        </p>
      </div>
    );
  }

  const submit = async () => {
    setProblem(null);
    if (!user) { onSignIn(); return; }
    if (!file) { setProblem(tr("Please attach the receipt.", "يُرجى إرفاق صورة الإيصال.")); return; }
    if (file.size > 5 * 1024 * 1024) { setProblem(tr("The file is larger than 5 MB.", "حجم الملف أكبر من ٥ ميجابايت.")); return; }
    setState("sending");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/shop-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, { upsert: false });
    if (upErr) { setState("error"); setProblem(tr("The receipt could not be uploaded. Please try again.", "تعذّر رفع الإيصال. يُرجى المحاولة مرة أخرى.")); return; }
    const names = lines.map((x) => productName(x.product, true)).join("، ");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    const { error: rpcErr } = await supabase.rpc("student_submit_payment_claim" as never, {
      p_amount: amount,
      p_currency: "EGP",
      p_paid_on: today,
      p_method: method,
      p_sender_name: sender.trim() || null,
      p_note: `متجر كلوفرز: ${names} [shop:${books.join(",")}]`,
      p_bundle_id: null,
      p_receipt_path: path,
    } as never);
    if (rpcErr) {
      setState("error");
      setProblem(tr("The payment could not be recorded. Please try again or message us on WhatsApp.", "تعذّر تسجيل الدفع. يُرجى المحاولة مرة أخرى أو التواصل عبر واتساب."));
      return;
    }
    trackShop({ event: "begin_checkout", items: lines.length, value: amount, currency: "egp" }, "egypt_receipt_sent");
    setState("sent");
    onDone();
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-charcoal bg-ivory p-4 text-charcoal dark:bg-card dark:text-foreground">
      <p className="text-sm font-bold">{tr("Pay from Egypt: Vodafone Cash or InstaPay", "الدفع من مصر: فودافون كاش أو إنستاباي")}</p>
      <ol className="list-decimal space-y-1 ps-5 text-sm">
        <li>
          {tr("Send ", "تحويل ")}<b>{formatPrice(total, "egp", isAr)}</b>{tr(" to ", " إلى الرقم ")}
          <b dir="ltr" className="whitespace-nowrap">{MANUAL_PAY_NUMBER}</b>
        </li>
        <li>{tr("Attach a photo of the receipt and send it.", "إرفاق صورة الإيصال وإرساله.")}</li>
        <li>{tr("The book arrives in My books once the transfer is confirmed.", "يصل الكتاب إلى «كتبي» بعد تأكيد التحويل.")}</li>
      </ol>
      <fieldset className="flex gap-2">
        <legend className="sr-only">{tr("Payment method", "طريقة الدفع")}</legend>
        {(["vodafone_cash", "instapay"] as const).map((m) => (
          <label key={m} className={`flex-1 cursor-pointer rounded-lg border-2 px-3 py-2 text-center text-sm font-semibold ${method === m ? "border-charcoal bg-klovers-yellow text-charcoal" : "border-border"}`}>
            <input type="radio" name="egypt-pay-method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
            {m === "vodafone_cash" ? tr("Vodafone Cash", "فودافون كاش") : tr("InstaPay", "إنستاباي")}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">{tr("Receipt (photo or PDF)", "صورة الإيصال (صورة أو ملف PDF)")}</span>
        <input id="egypt-pay-receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-xs" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">{tr("Sender name or number (optional)", "اسم المُحوِّل أو رقمه (اختياري)")}</span>
        <input id="egypt-pay-sender" type="text" value={sender} onChange={(e) => setSender(e.target.value)} maxLength={80}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
      </label>
      {problem && <p role="alert" className="text-sm font-semibold">{problem}</p>}
      <Button className="h-11 w-full font-bold" onClick={submit} disabled={state === "sending"}>
        {state === "sending"
          ? tr("Sending…", "جارٍ الإرسال…")
          : user ? tr("Send the receipt", "إرسال الإيصال") : tr("Sign in to send the receipt", "تسجيل الدخول لإرسال الإيصال")}
      </Button>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block text-center text-xs font-semibold underline underline-offset-4">
        {tr("Bank transfer or a question? WhatsApp", "تحويل بنكي أو استفسار؟ واتساب")}
      </a>
    </div>
  );
}
