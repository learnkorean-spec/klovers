import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BOOKS, type BookId } from "@/constants/books";
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
 * Renders nothing when the student has no book yet — no empty card.
 */
type Row = { id: string; book_id: string };

export function MyBooksCard() {
  const { lang } = useDashCopy();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[]>([]);
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
      if (alive) setRows(((data ?? []) as Row[]).filter((r) => r.book_id in BOOKS));
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
      setError(isAr ? "تعذّر تحميل الكتاب الآن. حاولي مرة أخرى بعد قليل." : "The book could not be downloaded right now. Please try again shortly.");
      return;
    }
    window.location.assign(data.signedUrl);
  };

  return (
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
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FFFF00] font-bold text-[#2E2E2E]" aria-hidden="true">
                {book.badge}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{isAr ? book.titleAr : book.titleEn}</p>
                <p className="text-xs text-muted-foreground">{isAr ? book.subtitleAr : book.subtitleEn}</p>
              </div>
              <button
                type="button"
                onClick={() => download(id)}
                disabled={busy === id}
                className="min-h-11 shrink-0 rounded-xl border-2 border-[#2E2E2E] bg-[#FFFF00] px-4 text-sm font-bold text-[#2E2E2E] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                {busy === id ? (isAr ? "جارٍ التحميل…" : "Preparing…") : (isAr ? "تحميل الكتاب" : "Download")}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
    </section>
  );
}
