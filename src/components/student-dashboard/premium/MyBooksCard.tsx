import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BOOKS, BOOK_COVERS as COVERS, type BookId } from "@/constants/books";
import { useDashCopy } from "./copy";
import { BrandIcon } from "./primitives";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { logEngagementEvent } from "@/lib/leadTracking";

/**
 * "My books" — the PDFs a student has been given.
 *
 * Reads the student's own rows in book_assignments (RLS: own rows only) that
 * are already available, and signs a short-lived download link for the file in
 * the private `student-materials` bucket only when the button is pressed. The
 * storage policy lets a student sign a book only if it is assigned to her, so a
 * forwarded link dies within the hour and nobody can guess another book's path.
 *
 * No popup (Re, 6 Oct 2026): the card itself is the announcement. A popup
 * stacked on top of the welcome tour on every new browser, and the dashboard
 * is already busy enough.
 *
 * Sits right under the hero: the book is the student's welcome gift for
 * joining, so it is the first thing she sees (Re, 25 Sep 2026).
 *
 * No emoji anywhere here: Klovers uses only its own 3D-plush icon library and
 * Cluby art (Re, 25 Sep 2026).
 *
 * Renders nothing when the student has no book yet — no empty card.
 */
type Row = { id: string; book_id: string; assigned_by?: string | null; assigned_at?: string | null };

/**
 * Real reviews only (store review, 1 Oct 2026): a week after a book bought in
 * the shop (or Cluby's gift) reaches "My books", a small link asks for an
 * opinion on WhatsApp. Re reads it and may quote it in the shop; nothing is
 * written for the buyer.
 */
const REVIEW_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
function asksForReview(r: Row): boolean {
  if (!(r.assigned_by?.startsWith("shop:") || r.assigned_by === "gift:cluby")) return false;
  const at = r.assigned_at ? Date.parse(r.assigned_at) : NaN;
  return Number.isFinite(at) && Date.now() - at >= REVIEW_AFTER_MS;
}


function BookCover({ id, className }: { id: BookId; className: string }) {
  return (
    <img
      src={COVERS[id]}
      alt=""
      aria-hidden="true"
      width={300}
      height={388}
      decoding="async"
      draggable={false}
      className={`shrink-0 select-none rounded-md border border-foreground/10 object-cover shadow-md ${className}`}
    />
  );
}

export function MyBooksCard(_props: { clubyAwake?: boolean }) {
  const { lang } = useDashCopy();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        const { data, error: rowsError } = await supabase
          .from("book_assignments")
          .select("id, book_id, assigned_by, assigned_at")
          .eq("user_id", user.id)
          .lte("available_from", new Date().toISOString())
          .order("assigned_at", { ascending: true });
        if (!alive) return;
        // No card rather than a broken one; the book stays assigned.
        if (rowsError) { console.warn("[MyBooksCard] book_assignments:", rowsError.message); return; }
        const list = ((data ?? []) as Row[]).filter((r) => r.book_id in BOOKS);
        setRows(list);
      } catch { /* no session / no client (tests): show nothing */ }
    })();
    return () => { alive = false; };
  }, []);

  if (rows.length === 0) return null;

  const download = async (bookId: BookId) => {
    const book = BOOKS[bookId];
    setBusy(bookId);
    setError(null);
    const { data, error: err } = await supabase.storage
      .from("student-materials")
      .createSignedUrl(book.path, 60 * 60, { download: book.fileName });
    setBusy(null);
    if (err || !data?.signedUrl) {
      setError(isAr ? "تعذّر تحميل الكتاب الآن. يُرجى المحاولة بعد قليل." : "The book could not be downloaded right now. Please try again shortly.");
      return;
    }
    // Cluby's gift book: count the download (admin Books library shows the total).
    if (bookId === "cluby-coloring-1") {
      void supabase.functions.invoke("shop-claim-gift", { body: { bookId, action: "log_download" } }).catch(() => {});
    }
    window.location.assign(data.signedUrl);
  };

  // Books bought in the shop are not a joining gift (27 Sep 2026).
  const allBought = rows.every((r) => r.assigned_by?.startsWith("shop:"));

  // Short card (Re, 6 Oct 2026: the dashboard is too crowded): only the books in
  // the page language show at first; the other edition and the trial guides sit
  // behind one button instead of four download rows.
  const inPageLanguage = rows.filter((r) => {
    const l = (BOOKS[r.book_id as BookId] as { lang?: string }).lang;
    return !l || l === lang;
  });
  const visibleRows = showAll || inPageLanguage.length === 0 ? rows : inPageLanguage;
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <>
      <section
        aria-labelledby="dash-books-title"
        className="relative overflow-hidden rounded-[20px] border border-foreground/10 bg-card p-4 ps-6 sm:p-5 sm:ps-7"
      >
        {/* Same yellow edge as the hero: this card belongs to the top of the page. */}
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-primary" />
        <div className="flex items-center gap-3">
          <BrandIcon name="reward-gift" className="h-10 w-10" eager />
          <div className="min-w-0">
            <h2 id="dash-books-title" className="font-display text-base font-bold text-foreground sm:text-lg">
              {allBought
                ? (isAr ? "كتبي" : "My books")
                : (isAr ? "هدية الانضمام إلى الدورة" : "A gift for joining our course")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {allBought
                ? (isAr ? "الكتب جاهزة للتحميل الآن" : "Your books are ready to download")
                : (isAr ? "الكتاب جاهز للتحميل الآن" : "Your book is ready: download it now")}
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-2.5">
          {visibleRows.map((r) => {
            const id = r.book_id as BookId;
            const book = BOOKS[id];
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-3">
                <BookCover id={id} className="h-[78px] w-[60px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">{isAr ? book.titleAr : book.titleEn}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{isAr ? book.subtitleAr : book.subtitleEn}</p>
                  {asksForReview(r) && (
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(isAr ? `رأيي في كتاب «${book.titleAr}»: ` : `My review of “${book.titleEn}”: `)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { void logEngagementEvent({ source_type: "shop", cta_label: "review_tap", metadata: { book_id: id } }); }}
                      className="mt-1 inline-block text-xs font-semibold text-foreground underline underline-offset-4"
                    >
                      {isAr ? "ما رأيك في الكتاب؟ رسالة قصيرة عبر واتساب" : "How is the book? Tell us on WhatsApp"}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => download(id)}
                  disabled={busy === id}
                  className="min-h-11 shrink-0 rounded-xl border-2 border-charcoal bg-klovers-yellow px-4 text-sm font-bold text-charcoal disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground max-sm:w-full"
                >
                  {busy === id ? (isAr ? "جارٍ التحميل…" : "Preparing…") : (isAr ? "التحميل الآن" : "Download now")}
                </button>
              </li>
            );
          })}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {isAr ? `عرض كل الكتب (${hiddenCount})` : `Show all books (${hiddenCount})`}
          </button>
        )}
        {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
      </section>
    </>
  );
}
