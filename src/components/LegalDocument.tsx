import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * The shared layout for the two legal pages, /privacy-policy and /terms.
 *
 * The text lives in the page files as plain data (one object per language) so
 * a reviewer can read and edit the wording without touching markup. This
 * component only lays it out: an h1, the "last updated" line, then one h2 per
 * section. Arabic renders right to left.
 *
 * If you change the English wording, mirror it in the matching body fragment
 * in scripts/prerender-meta.mjs — that copy is what crawlers read.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalContent {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}

const LegalDocument = ({ content, isAr }: { content: LegalContent; isAr: boolean }) => (
  <div className="min-h-screen">
    <Header />
    <main id="main-content" className="pt-16">
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <article
            className="max-w-3xl mx-auto"
            dir={isAr ? "rtl" : "ltr"}
            lang={isAr ? "ar" : "en"}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              {content.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">{content.updated}</p>
            {content.intro && (
              <p className="text-muted-foreground leading-relaxed mb-8">{content.intro}</p>
            )}
            {content.sections.map((section) => (
              <section key={section.heading} className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className={`list-disc ${isAr ? "pr-5" : "pl-5"} space-y-2 text-muted-foreground leading-relaxed`}>
                    {section.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default LegalDocument;
