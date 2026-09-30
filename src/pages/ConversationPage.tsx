import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Pause, Volume2 } from "lucide-react";
import { findConversation } from "@/constants/conversations";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * /c/:code — what a QR code printed in a Klovers book opens.
 *
 * The printed code can never change, so this page is the indirection: it looks
 * the code up and plays whatever audio exists today. Generated MP3s (one per
 * line, written by the `conversation-audio` function) are used when present;
 * otherwise the page speaks the line with the visitor's own Korean voice, so a
 * book that ships before the audio is recorded still works.
 */

const BUCKET_BASE =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/marketing-images/conversations`;

export default function ConversationPage() {
  const { code } = useParams<{ code: string }>();
  const convo = useMemo(() => findConversation(code), [code]);
  const { speakKorean, cancel } = useSpeech({ language: "ko-KR", rate: 0.85 });

  const [playing, setPlaying] = useState<number | null>(null);
  const [hasAudio, setHasAudio] = useState<boolean[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ask once whether each line has a generated file; fall back silently if not.
  useEffect(() => {
    if (!convo) return;
    let cancelled = false;
    Promise.all(
      convo.lines.map((_, i) =>
        fetch(`${BUCKET_BASE}/${convo.code}/${i}.mp3`, { method: "HEAD" })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    ).then((found) => {
      if (!cancelled) setHasAudio(found);
    });
    return () => {
      cancelled = true;
    };
  }, [convo]);

  useEffect(() => {
    if (convo) document.title = `محادثة — ${convo.title} | كلوفرز`;
    return () => {
      document.title = "كلوفرز";
    };
  }, [convo]);

  useEffect(() => () => {
    audioRef.current?.pause();
    cancel();
  }, [cancel]);

  if (!convo) {
    return (
      <main dir="rtl" className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">لم نجد هذه المحادثة</h1>
        <p className="mt-3 text-muted-foreground">
          تأكّد من الرمز المطبوع في الكتاب، أو افتح صفحة الكتب.
        </p>
        <Link to="/shop" className="mt-6 inline-block font-bold underline">
          كتب كلوفرز
        </Link>
      </main>
    );
  }

  const playLine = (i: number) => {
    audioRef.current?.pause();
    cancel();
    if (playing === i) {
      setPlaying(null);
      return;
    }
    setPlaying(i);
    if (hasAudio[i]) {
      const a = new Audio(`${BUCKET_BASE}/${convo.code}/${i}.mp3`);
      audioRef.current = a;
      a.onended = () => setPlaying(null);
      void a.play().catch(() => setPlaying(null));
    } else {
      // No file yet: read it with the visitor's own Korean voice, male or
      // female to match the speaker, so the page works before audio exists.
      speakKorean(convo.lines[i].ko, {
        gender: convo.lines[i].who === "리나" ? "female" : "male",
      });
      // The browser voice gives us no reliable end event across devices.
      window.setTimeout(() => setPlaying((p) => (p === i ? null : p)), 4000);
    }
  };

  return (
    <>
      <main dir="rtl" className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-sm font-bold text-muted-foreground">{convo.book}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          محادثة — {convo.title}
        </h1>
        <div className="mt-2 h-1.5 w-16 rounded-full bg-[#FFFF00]" />
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          اضغط أي سطر لتسمعه. الحصة {convo.lesson}.
        </p>

        <ol className="mt-7 space-y-3">
          {convo.lines.map((line, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => playLine(i)}
                aria-label={`استمع إلى سطر ${i + 1}`}
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-right transition hover:border-[#FFFF00] focus-visible:outline focus-visible:outline-2"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFFF00] text-foreground">
                  {playing === i ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    {line.who}
                  </span>
                  <span dir="ltr" className="mt-1 block text-left text-lg font-semibold">
                    {line.ko}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {line.ar}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          تعلّم الكورية. عِشها. أحبّها.
        </p>
      </main>
    </>
  );
}
