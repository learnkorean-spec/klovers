import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { capture } from "@/lib/analytics";
import {
  cartActions, formatPrice, productName, startCheckout, useCart, type ShopProduct,
} from "@/lib/shop";
import { ProductImage } from "./ProductCard";
import KloverIcon from "@/components/KloverIcon";
import { WHATSAPP_BASE, MANUAL_PAY_NUMBER } from "@/lib/siteConfig";

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
    capture({ event: "begin_checkout", items: lines.length, value: subtotal / 100, currency: [...currencies][0] ?? "" });
    const res = await startCheckout(lines.map((x) => x.line));
    if (res.ok === true && "free" in res) {
      const found = res.downloads.map((d) => {
        const l = lines.find((x) => x.product.bookId === d.bookId);
        return { ...d, name: l ? productName(l.product, isAr) : d.bookId, signedIn: res.signedIn };
      });
      capture({ event: "free_download", items: found.length });
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
              <Button className="h-12 w-full text-base font-semibold" onClick={checkout} disabled={busy}>
                {isFreeBag
                  ? (busy ? (isAr ? "جارٍ التجهيز…" : "Getting it ready…") : (isAr ? "إتمام الطلب وتنزيل مجاني" : "Check out and download free"))
                  : (busy ? (isAr ? "جارٍ فتح صفحة الدفع…" : "Opening checkout…") : (isAr ? "الدفع الآمن" : "Checkout Securely"))}
              </Button>
              {!isFreeBag && <a
                href={manualPayHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-accent"
              >
                {isAr ? "أو ادفع يدويًا من مصر (بدون بطاقة)" : "Or pay manually from Egypt (no card)"}
              </a>}
              <p className="text-center text-xs text-muted-foreground">
                {isFreeBag
                  ? (isAr ? "مجاني بالكامل، دون بطاقة ودون حساب." : "Completely free: no card and no account needed.")
                  : isAr
                  ? "يتم الدفع عبر صفحة دفع آمنة، ويتطلّب الشراء تسجيل الدخول لإضافة الكتب إلى «كتبي». الدفع اليدوي عبر واتساب، ويُضاف الكتاب بعد تأكيد التحويل."
                  : "Payment happens on Stripe's secure page. Signing in is needed so books land in My books. Manual payment is over WhatsApp; the book is added after the transfer is confirmed."}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
