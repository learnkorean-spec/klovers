/**
 * One story moment on a page that otherwise has none (Re, 18 Nov 2026: "all
 * website must be connected with the stories").
 *
 * A picture of the canon characters beside a short line about where this page
 * sits in their journey. Canon rules it keeps (src/config/klovers-world.ts):
 * the story is a tease here, never the product; it never names a country the
 * trio has not been given yet (languageJourney.notDecidedYet); every picture
 * passed in must follow wardrobeRule (everyone wears one KLOVERS-yellow piece).
 */
type Props = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  /** "dark" for a charcoal/brand-dark ground, "light" for ivory. */
  tone?: "light" | "dark";
  /** Optional ground colour for sibling brands (Voca maroon, Buda navy). */
  background?: string;
  width?: number;
  height?: number;
  imageSide?: "start" | "end";
};

const StoryMoment = ({
  image,
  alt,
  eyebrow,
  title,
  body,
  tone = "light",
  background,
  width = 1600,
  height = 900,
  imageSide = "start",
}: Props) => {
  const dark = tone === "dark";
  return (
    <section
      className={`px-4 py-14 md:py-20 ${dark ? "text-ivory" : "bg-ivory text-charcoal"}`}
      style={background ? { backgroundColor: background } : dark ? { backgroundColor: "#2E2E2E" } : undefined}
    >
      <figure
        className={`mx-auto grid max-w-5xl items-center gap-6 overflow-hidden rounded-3xl border md:grid-cols-2 ${
          dark ? "border-klovers-yellow/40 bg-white/[0.05]" : "border-charcoal/10 bg-white"
        }`}
      >
        <img
          src={image}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${height > width ? "aspect-[4/3] object-[50%_60%] md:aspect-[4/5]" : "aspect-[4/3]"} ${imageSide === "end" ? "md:order-2" : ""}`}
        />
        <figcaption className="px-6 pb-7 text-center md:px-8 md:py-8 md:text-start">
          <span className="inline-block rounded-full bg-klovers-yellow px-3 py-1 text-xs font-bold uppercase tracking-widest text-charcoal">
            {eyebrow}
          </span>
          <p className="mt-4 font-display text-2xl font-extrabold leading-tight md:text-3xl">{title}</p>
          <p className={`mt-3 text-sm leading-relaxed md:text-base ${dark ? "text-ivory/75" : "text-charcoal/75"}`}>{body}</p>
        </figcaption>
      </figure>
    </section>
  );
};

export default StoryMoment;
