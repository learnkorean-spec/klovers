import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BOOKS, type BookId } from "@/constants/books";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDashCopy } from "./copy";

/**
 * "My books" — the PDFs a student has been given.
 *
 * Reads the student's own rows in book_assignments (RLS: own rows only) that
 * are already available, and signs a short-lived download link for the file in
 * the private `student-materials` bucket only when the button is pressed. The
 * storage policy lets a student sign a book only if it is assigned to her, so a
 * forwarded link dies within the hour and nobody can guess another book's path.
 *
 * The first time a student opens the dashboard after a book reaches her, Cluby
 * pops up once to tell her it is here. "Seen" is remembered per student and per
 * book in this browser, so a new book later gets its own announcement.
 *
 * No emoji anywhere here: Klovers uses only its own 3D-plush icon library and
 * Cluby art (Re, 25 Sep 2026).
 *
 * Renders nothing when the student has no book yet — no empty card.
 */
type Row = { id: string; book_id: string };

/** Cover thumbnails (300×388 WebP, ~12 KB) in the public marketing-images bucket —
 *  the cover is not secret; the book itself stays private. */
const COVER_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/storage/v1/object/public/marketing-images";
const COVERS: Record<BookId, string> = {
  "hangul-a0": `${COVER_BASE}/hangul-a0-cover.webp`,
};

const seenKey = (userId: string, bookId: string) => `klovers-book-popup:${userId}:${bookId}`;

function wasSeen(userId: string, bookId: string) {
  try { return Boolean(localStorage.getItem(seenKey(userId, bookId))); } catch { return true; }
}
function markSeen(userId: string, bookId: string) {
  try { localStorage.setItem(seenKey(userId, bookId), "1"); } catch { /* private mode: popup may show again */ }
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

export function MyBooksCard() {
  const { lang } = useDashCopy();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [popupBook, setPopupBook] = useState<BookId | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("book_assignments")
        .select("id, book_id")
        .eq("user_id", user.id)
        .lte("available_from", new Date().toISOString())
        .order("assigned_at", { ascending: true });
      if (!alive) return;
      const list = ((data ?? []) as Row[]).filter((r) => r.book_id in BOOKS);
      setRows(list);
      setUserId(user.id);
      const fresh = list.find((r) => !wasSeen(user.id, r.book_id));
      if (fresh) setPopupBook(fresh.book_id as BookId);
    })();
    return () => { alive = false; };
  }, []);

  if (rows.length === 0) return null;

  const closePopup = () => {
    if (userId && popupBook) markSeen(userId, popupBook);
    setPopupBook(null);
  };

  const download = async (bookId: BookId) => {
    const book = BOOKS[bookId];
    setBusy(bookId);
    setError(null);
    const { data, error: err } = await supabase.storage
      .from("student-materials")
      .createSignedUrl(book.path, 60 * 60, { download: book.fileName });
    setBusy(null);
    if (err || !data?.signedUrl) {
      setError(isAr ? "تعذّر تحميل الكتاب الآن. حاول مرة أخرى بعد قليل." : "The book could not be downloaded right now. Please try again shortly.");
      return;
    }
    if (userId) markSeen(userId, bookId);
    setPopupBook(null);
    window.location.assign(data.signedUrl);
  };

  const popup = popupBook ? BOOKS[popupBook] : null;

  return (
    <>
      <section
        aria-labelledby="dash-books-title"
        className="rounded-[20px] border border-foreground/10 bg-card p-4 sm:p-5"
      >
        <h2 id="dash-books-title" className="font-display text-base font-semibold text-foreground">
          {isAr ? "كتبي" : "My books"}
        </h2>
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => {
            const id = r.book_id as BookId;
            const book = BOOKS[id];
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-3">
                <BookCover id={id} className="h-[78px] w-[60px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">{isAr ? book.titleAr : book.titleEn}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{isAr ? book.subtitleAr : book.subtitleEn}</p>
                </div>
                <button
                  type="button"
                  onClick={() => download(id)}
                  disabled={busy === id}
                  className="min-h-11 shrink-0 rounded-xl border-2 border-[#2E2E2E] bg-[#FFFF00] px-4 text-sm font-bold text-[#2E2E2E] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground max-sm:w-full"
                >
                  {busy === id ? (isAr ? "جارٍ التحميل…" : "Preparing…") : (isAr ? "تحميل الكتاب" : "Download")}
                </button>
              </li>
            );
          })}
        </ul>
        {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
      </section>

      <Dialog open={popup !== null} onOpenChange={(o) => { if (!o) closePopup(); }}>
        {popup && popupBook && (
          <DialogContent
            dir={isAr ? "rtl" : "ltr"}
            className="max-w-sm overflow-hidden rounded-3xl border-2 border-foreground bg-background p-0"
          >
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
              {/* Cluby says it, in a speech bubble pointing down at him. */}
              <div className="relative mb-2 rounded-2xl border-2 border-foreground bg-card px-4 py-2.5 text-foreground shadow-sm">
                <DialogTitle className={isAr ? "font-sans text-base font-bold leading-relaxed" : "font-display text-base font-bold leading-snug"}>
                  {isAr ? "كتابك وصل!" : "Your book is here!"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-foreground">
                  {isAr
                    ? "حمّله دلوقتي، واطبعه أو احفظه على موبايلك، وخلّيه معاك في كل حصة."
                    : "Download it now, print it or keep it on your phone, and bring it to every class."}
                </DialogDescription>
                <span aria-hidden="true" className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-foreground bg-card" />
              </div>

              <div className="mt-3 flex items-end justify-center gap-3">
                <img
                  src="/assets/cluby/cluby-wave.webp"
                  alt={isAr ? "كلوبي يلوّح" : "Cluby waving"}
                  width={96}
                  height={96}
                  draggable={false}
                  className="h-24 w-24 shrink-0 select-none object-contain"
                />
                <BookCover id={popupBook} className="h-[150px] w-[116px] -rotate-3" />
              </div>

              <p className="mt-4 text-sm font-semibold text-foreground">
                {isAr ? popup.titleAr : popup.titleEn}
              </p>
              <p className="text-xs text-muted-foreground">{isAr ? popup.subtitleAr : popup.subtitleEn}</p>

              <button
                type="button"
                onClick={() => download(popupBook)}
                disabled={busy === popupBook}
                className="mt-5 min-h-12 w-full rounded-xl border-2 border-[#2E2E2E] bg-[#FFFF00] px-4 text-base font-bold text-[#2E2E2E] shadow-[0_3px_0_#2E2E2E] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                {busy === popupBook ? (isAr ? "جارٍ التحميل…" : "Preparing…") : (isAr ? "تحميل الكتاب" : "Download my book")}
              </button>
              <button
                type="button"
                onClick={closePopup}
                className="mt-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {isAr ? "لاحقًا — هيفضل موجود في «كتبي»" : "Later — it stays under “My books”"}
              </button>
              {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
