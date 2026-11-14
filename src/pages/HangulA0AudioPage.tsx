import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from "lucide-react";
import { A0_AUDIO, A0_PAGES } from "@/constants/hangulA0Audio";
import kloversLogo from "@/assets/klovers-logo.jpg";

/**
 * Hangul A0 book audio. Each page of the printed/PDF book carries a QR code
 * that opens /a0 (the audio library: pick your page); /a0/<page> lists the Korean on that page and plays
 * each item (or all of them in order) from the recordings shipped with the
 * site. Signed-in only (the route is wrapped in AuthProtectedRoute): a reader
 * scanning the book signs in or makes a free account, then lands back here.
 */

export type BookClip = { ko: string; f: string; label?: string };

type BookAudio = { route: string; base: string; name: string; audio: Record<number, BookClip[]>; pages: number[] };

const A0_BOOK: BookAudio = { route: "/a0", base: "/assets/a0/audio/", name: "Hangul A0", audio: A0_AUDIO, pages: A0_PAGES };

export default function HangulA0AudioPage({ book = A0_BOOK }: { book?: BookAudio }) {
  const { page } = useParams();
  const navigate = useNavigate();
  const wanted = Number(page);
  const BASE = book.base;
  const PAGES = book.pages;
  const current = PAGES.includes(wanted) ? wanted : null;
  const clips = current ? book.audio[current] : [];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<number[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  const stop = useCallback(() => {
    queueRef.current = [];
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
    setRunningAll(false);
  }, []);

  const playIndex = useCallback(
    (i: number) => {
      audioRef.current?.pause();
      const a = new Audio(`${BASE}${clips[i].f}.mp3`);
      audioRef.current = a;
      setPlaying(i);
      const next = () => {
        const n = queueRef.current.shift();
        if (n === undefined) {
          setPlaying(null);
          setRunningAll(false);
        } else {
          window.setTimeout(() => playIndex(n), 450);
        }
      };
      a.onended = next;
      a.onerror = next;
      void a.play().catch(next);
    },
    [clips, BASE],
  );

  // Leaving the page (or moving to another book page) stops the sound.
  useEffect(() => stop, [current, stop]);

  useEffect(() => {
    document.title = current ? `${book.name} · Page ${current} audio | Klovers` : `${book.name} audio | Klovers`;
  }, [current, book.name]);

  const idx = current ? PAGES.indexOf(current) : -1;
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx >= 0 && idx < PAGES.length - 1 ? PAGES[idx + 1] : null;

  return (
    <main className="min-h-screen bg-[#FFF9EC] text-[#2E2E2E]">
      <div className="mx-auto max-w-xl px-4 py-6">
        <header className="mb-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src={kloversLogo} alt="" className="h-9 w-9 rounded-full object-cover" />
            Klovers
          </Link>
          <Link to="/dashboard" className="rounded-full bg-[#2E2E2E] px-3 py-1.5 text-xs font-bold text-[#FFFF00]">
            My dashboard · لوحتي
          </Link>
        </header>

        {current === null ? (
          <section>
            <h1 className="text-2xl font-extrabold">{book.name} · Book audio · صوت الكتاب</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Choose the page you are reading. · اختر الصفحة التي تقرؤها.
            </p>
            <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {PAGES.map((p) => (
                <Link
                  key={p}
                  to={`${book.route}/${p}`}
                  className="rounded-xl border-2 border-[#FFFF00] bg-white py-3 text-center text-lg font-bold hover:bg-[#FFFF00]"
                >
                  {p}
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold">Page {current} · صفحة {current}</h1>
                <p className="mt-1 text-sm text-neutral-600">Tap to listen, then repeat. · اضغط واسمع ثم كرّر.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (runningAll) return stop();
                  queueRef.current = clips.map((_, i) => i).slice(1);
                  setRunningAll(true);
                  playIndex(0);
                }}
                className="flex shrink-0 items-center gap-2 rounded-full bg-[#2E2E2E] px-4 py-2 text-sm font-bold text-[#FFFF00]"
              >
                {runningAll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {runningAll ? "Stop · إيقاف" : "Play all · الكل"}
              </button>
            </div>

            <ul className="mt-5 space-y-2">
              {clips.map((c, i) => (
                <li key={`${i}-${c.f}`}>
                  <button
                    type="button"
                    lang="ko"
                    onClick={() => {
                      queueRef.current = [];
                      setRunningAll(false);
                      playIndex(i);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-xl font-bold transition-colors ${
                      playing === i ? "border-[#2E2E2E] bg-[#FFFF00]" : "border-[#FFFF00] bg-white hover:bg-[#FFFDE0]"
                    }`}
                  >
                    <Volume2 className="h-5 w-5 shrink-0" aria-hidden />
                    {c.label ? <span lang="en" className="text-base">{c.label}</span> : <span>{c.ko}</span>}
                  </button>
                </li>
              ))}
            </ul>

            <nav className="mt-6 flex items-center justify-between text-sm font-bold">
              <button
                type="button"
                disabled={prev === null}
                onClick={() => prev !== null && navigate(`${book.route}/${prev}`)}
                className="flex items-center gap-1 rounded-full border-2 border-[#2E2E2E] px-3 py-2 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> {prev ?? ""}
              </button>
              <Link to={book.route} className="underline">
                All pages · كل الصفحات
              </Link>
              <button
                type="button"
                disabled={next === null}
                onClick={() => next !== null && navigate(`${book.route}/${next}`)}
                className="flex items-center gap-1 rounded-full border-2 border-[#2E2E2E] px-3 py-2 disabled:opacity-30"
              >
                {next ?? ""} <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </section>
        )}
      </div>
    </main>
  );
}
