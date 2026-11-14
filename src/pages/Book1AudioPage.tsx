import HangulA0AudioPage from "./HangulA0AudioPage";
import { B1_AUDIO, B1_PAGES } from "@/constants/book1Audio";

/**
 * Korean Book 1 audio (/b1 and /b1/<page>): the same audio library as the
 * Hangul A0 book, fed with Book 1's pages. The QR code at the start of the
 * book opens /b1. Signed-in only, like /a0.
 */
const B1_BOOK = { route: "/b1", base: "/assets/b1/audio/", name: "Korean Book 1", audio: B1_AUDIO, pages: B1_PAGES };

export default function Book1AudioPage() {
  return <HangulA0AudioPage book={B1_BOOK} />;
}
