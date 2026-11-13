import { Link } from "react-router-dom";
import { Headphones } from "lucide-react";

/**
 * The door into the Hangul A0 book audio (/a0) from the student dashboard.
 * The book's QR code lands on the same page; this card is how a signed-in
 * student finds it again without the book in hand. One compact row, so it
 * does not push the dashboard's main cards down.
 */
export default function A0AudioEntryCard({ isAr }: { isAr: boolean }) {
  return (
    <Link
      to="/a0"
      className="flex items-center gap-4 rounded-2xl border-2 border-[#FFFF00] bg-[#FFF9EC] px-4 py-3 text-[#2E2E2E] transition-colors hover:bg-[#FFFDE0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E2E2E]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFFF00]" aria-hidden>
        <Headphones className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{isAr ? "صوت كتاب الهانغل (A0)" : "Hangul A0 book audio"}</span>
        <span className="block text-sm text-[#2E2E2E]/70">
          {isAr ? "اسمع كل صفحة من الكتاب بنطق كوري واضح." : "Listen to every page of the book in clear Korean."}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-[#2E2E2E] px-4 py-2 text-sm font-bold text-[#FFFF00]">
        {isAr ? "اسمع" : "Listen"}
      </span>
    </Link>
  );
}
