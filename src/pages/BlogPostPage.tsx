import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import OptimizedImage from "@/components/OptimizedImage";
import BlogComments from "@/components/BlogComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, User, ArrowRight, Clock, ChevronRight, Share2, Copy, Check, AlertTriangle, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { extractRelatedBlock, splitMarkdownAtHeading } from "@/lib/markdownContent";
import { buildFaqJsonLd } from "../../scripts/lib/faq-parser.mjs";
import { extractArticleVocab, articleLevel } from "@/lib/articleVocab";
import { stageForSlug } from "@/constants/blogJourney";
import {
  ArticleEndSentinel,
  ArticleLearnedToday,
  ArticleLearningIntro,
  NextStop,
  useMemoVocabComponents,
} from "@/components/journal/ArticleJourney";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  article_type: string;
  hero_image: string;
  hero_alt: string;
  hero_caption: string;
  hero_image_2: string;
  hero_alt_2: string;
  hero_caption_2: string;
  cta_text: string;
  cta_url: string;
  content: string;
  author: string;
  lang: string;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

type RelatedCard = Pick<
  BlogPost,
  "id" | "title" | "slug" | "description" | "hero_image" | "hero_alt" | "article_type" | "author" | "published_at" | "created_at"
>;

/** Columns the related-article cards need. One list, so the curated lookup and
 * the fallback query can never select different shapes. */
const CARD_COLUMNS =
  "id, title, slug, description, hero_image, hero_alt, article_type, author, published_at, created_at";

/** The card grid is three across. Links past the third are not dropped — they
 * are listed as text below, because they are internal links that were chosen
 * deliberately and throwing them away would undo part of the link graph. */
const CARD_LIMIT = 3;

const TYPE_LABEL: Record<string, string> = {
  howto: "How-To",
  listicle: "Listicle",
  longform: "Article",
  news: "News",
  review: "Review",
};

const TYPE_LABEL_AR: Record<string, string> = {
  howto: "شرح عملي",
  listicle: "قائمة",
  longform: "مقال",
  news: "أخبار",
  review: "مراجعة",
};

const TYPE_COLOR: Record<string, string> = {
  howto: "bg-klovers-yellow text-charcoal border-charcoal/15",
  listicle: "bg-card text-charcoal border-charcoal/30 dark:text-foreground dark:border-border",
  longform: "bg-charcoal text-ivory border-charcoal dark:bg-ivory dark:text-charcoal dark:border-ivory",
  news: "bg-charcoal/5 text-charcoal border-charcoal/40 dark:bg-ivory/10 dark:text-foreground dark:border-ivory/40",
  review: "bg-ivory text-charcoal border-charcoal/20 dark:bg-muted dark:text-foreground dark:border-border",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Slug of the EN<->AR partner post, or null when this post has no partner.
  const [partnerSlug, setPartnerSlug] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedCard[]>([]);
  // True when the cards came from the article's own related-links block rather
  // than from the article_type fallback. Only the heading depends on it.
  const [relatedIsCurated, setRelatedIsCurated] = useState(false);
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Set canonical immediately from slug so Google doesn't see homepage canonical during load
  useEffect(() => {
    if (!slug) return;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://kloversegy.com/blog/${slug}`;
    // Robots: ensure indexable
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "index, follow");
  }, [slug]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPost(data as BlogPost);
          // Track view — fire-and-forget, non-blocking
          (supabase as any).rpc("increment_blog_view", { post_slug: slug }).then(() => {});
        } else if (language === "ar" && !slug.endsWith("-ar")) {
          const { data: arData, error: arError } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("slug", `${slug}-ar`)
            .eq("published", true)
            .maybeSingle();
          if (arError) throw arError;
          setPost(arData as BlogPost | null);
        } else {
          setPost(null);
        }
        setLoading(false);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load article");
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, language]);

  // Related articles, in order of preference:
  //   1. the slugs in the article's own related-links block — picked by shared
  //      keywords weighted by term rarity, and the only set that is language-
  //      safe and retired-slug-safe by construction;
  //   2. same article_type, most recent first;
  //   3. any recent article in the same language.
  // Steps 2 and 3 are the behaviour this page has always had; step 1 is new,
  // so an article with no block renders exactly what it rendered before.
  useEffect(() => {
    if (!post) {
      setRelatedPosts([]);
      setRelatedIsCurated(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const { slugs } = extractRelatedBlock(post.content);

      if (slugs.length) {
        const { data, error: curatedError } = await supabase
          .from("blog_posts")
          .select(CARD_COLUMNS)
          .in("slug", slugs)
          .eq("published", true);
        if (cancelled) return;
        // Related links are decoration: fall through to the next step, but say so.
        if (curatedError) console.error("BlogPostPage: curated related lookup failed", curatedError);
        if (data && data.length) {
          // `.in()` does not preserve argument order, and the block's order is
          // its relevance ranking — restore it rather than showing whatever
          // order Postgres returned.
          const bySlug = new Map((data as RelatedCard[]).map((row) => [row.slug, row]));
          const ordered = slugs
            .map((s) => bySlug.get(s))
            .filter((row): row is RelatedCard => Boolean(row));
          if (ordered.length) {
            setRelatedPosts(ordered);
            setRelatedIsCurated(true);
            return;
          }
        }
      }

      const { data: sameType, error: sameTypeError } = await supabase
        .from("blog_posts")
        .select(CARD_COLUMNS)
        .eq("published", true)
        .eq("lang", post.lang || "en")
        .eq("article_type", post.article_type)
        .neq("slug", post.slug)
        .order("published_at", { ascending: false })
        .limit(CARD_LIMIT);
      if (cancelled) return;
      if (sameTypeError) console.error("BlogPostPage: same-type related lookup failed", sameTypeError);
      if (sameType && sameType.length) {
        setRelatedPosts(sameType as RelatedCard[]);
        setRelatedIsCurated(false);
        return;
      }

      const { data: recent, error: recentError } = await supabase
        .from("blog_posts")
        .select(CARD_COLUMNS)
        .eq("published", true)
        .eq("lang", post.lang || "en")
        .neq("slug", post.slug)
        .order("published_at", { ascending: false })
        .limit(CARD_LIMIT);
      if (cancelled) return;
      if (recentError) console.error("BlogPostPage: recent related lookup failed", recentError);
      setRelatedPosts((recent as RelatedCard[]) || []);
      setRelatedIsCurated(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [post]);

  // Resolve the EN<->AR partner post, so hreflang is only emitted for a pair
  // that really exists. Arabic slugs use a `-ar` suffix or a legacy `ar-` prefix.
  useEffect(() => {
    if (!post) { setPartnerSlug(null); return; }
    let cancelled = false;
    const base = post.slug.startsWith("ar-") ? post.slug.slice(3) : post.slug.replace(/-ar$/, "");
    const candidates = post.lang === "ar" ? [base] : [`${base}-ar`, `ar-${base}`];

    (async () => {
      const { data, error: partnerError } = await supabase
        .from("blog_posts")
        .select("slug")
        .in("slug", candidates)
        .eq("published", true)
        .limit(1);
      if (partnerError) console.error("BlogPostPage: partner-slug lookup failed", partnerError);
      if (!cancelled) setPartnerSlug(data?.[0]?.slug ?? null);
    })();

    return () => { cancelled = true; };
  }, [post]);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!post) return;

    // One language per title: Arabic posts get «كلوفرز», not Latin "Klovers".
    document.title = post.lang === "ar" ? `${post.title} | كلوفرز` : `${post.title} | Klovers Blog`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const locale = post.lang === "ar" ? "ar_EG" : "en_US";
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;

    const fallbackImage = "https://kloversegy.com/klovers-logo.jpg";
    const ogImage = post.hero_image || fallbackImage;

    // Basic meta
    setMeta("description", post.description);
    setMeta("keywords", (post.keywords || []).join(", "));
    setMeta("robots", "index, follow");

    // Open Graph
    setMeta("og:title", post.title, "property");
    setMeta("og:description", post.description, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", `https://kloversegy.com/blog/${post.slug}`, "property");
    setMeta("og:locale", locale, "property");
    setMeta("og:site_name", "Klovers", "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", post.hero_alt || post.title, "property");

    // Article meta
    setMeta("article:published_time", post.published_at || post.created_at, "property");
    if (post.updated_at) setMeta("article:modified_time", post.updated_at, "property");
    setMeta("article:author", post.author, "property");
    setMeta("article:section", TYPE_LABEL[post.article_type] || post.article_type, "property");

    // article:tag — one per keyword (requires multiple elements)
    document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
    (post.keywords || []).forEach((kw) => {
      const el = document.createElement("meta");
      el.setAttribute("property", "article:tag");
      el.content = kw;
      document.head.appendChild(el);
    });

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@kloversegy");
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", post.description);
    setMeta("twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://kloversegy.com/blog/${post.slug}`;

    // hreflang alternates — EN ↔ AR. Slug pattern: `{base}` (en) ↔ `{base}-ar` or legacy `ar-{base}`.
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    const addAlt = (hreflang: string, href: string) => {
      const el = document.createElement("link");
      el.setAttribute("rel", "alternate");
      el.setAttribute("hreflang", hreflang);
      el.setAttribute("href", href);
      document.head.appendChild(el);
    };
    // Only annotate when the partner document actually exists. The Arabic
    // partner uses either a `-ar` suffix or a legacy `ar-` prefix, and not
    // every post has one - pointing hreflang at a URL that 404s invalidates
    // the whole cluster. partnerSlug is resolved from the database below.
    const base = post.slug.startsWith("ar-") ? post.slug.slice(3) : post.slug.replace(/-ar$/, "");
    if (partnerSlug) {
      const enUrl = `https://kloversegy.com/blog/${base}`;
      const arUrl = `https://kloversegy.com/blog/${post.lang === "ar" ? post.slug : partnerSlug}`;
      addAlt("en", enUrl);
      addAlt("ar", arUrl);
      addAlt("x-default", enUrl);
    }

    // JSON-LD: BlogPosting with enhanced metadata
    let jsonLd = document.getElementById("blog-jsonld");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "blog-jsonld";
      jsonLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `https://kloversegy.com/blog/${post.slug}`,
      headline: post.title,
      description: post.description,
      image: [ogImage],
      author:
        post.author === "Reham Elshrkawy"
          ? {
              "@type": "Person",
              name: "Reham Elshrkawy",
              url: "https://kloversegy.com/about",
              jobTitle: "Korean language teacher, founder of Klovers",
            }
          : // GEO-09: one Klovers Organization, one spelling, whatever the byline says.
            { "@type": "Organization", name: "Klovers", alternateName: "كلوفرز", url: "https://kloversegy.com" },
      publisher: {
        "@type": "Organization",
        name: "Klovers",
        logo: { "@type": "ImageObject", url: "https://kloversegy.com/klovers-logo.jpg", width: 512, height: 512 },
        url: "https://kloversegy.com"
      },
      datePublished: post.published_at || post.created_at,
      ...(post.updated_at ? { dateModified: post.updated_at } : {}),
      url: `https://kloversegy.com/blog/${post.slug}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://kloversegy.com/blog/${post.slug}` },
      inLanguage: post.lang || "en",
      wordCount,
      keywords: (post.keywords || []).join(", "),
      articleSection: TYPE_LABEL[post.article_type] || post.article_type,
      articleBody: post.content?.substring(0, 500) + "...",
      speakable: {
        "@type": "SpeakableSpecification",
        "xpath": ["/html/head/title", "/html/body/article/h1", "/html/body/article/p"]
      }
    });

    // JSON-LD: FAQPage — same shared parser scripts/prerender-meta.mjs uses at
    // build time, so the client and the prerendered page never disagree about
    // which articles have a genuine FAQ section.
    document.getElementById("faq-jsonld")?.remove();
    const faqJsonLdData = buildFaqJsonLd(post.content);
    if (faqJsonLdData) {
      const faqLd = document.createElement("script");
      faqLd.id = "faq-jsonld";
      faqLd.setAttribute("type", "application/ld+json");
      faqLd.textContent = JSON.stringify(faqJsonLdData);
      document.head.appendChild(faqLd);
    }

    // JSON-LD: BreadcrumbList
    let breadcrumbLd = document.getElementById("breadcrumb-jsonld");
    if (!breadcrumbLd) {
      breadcrumbLd = document.createElement("script");
      breadcrumbLd.id = "breadcrumb-jsonld";
      breadcrumbLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(breadcrumbLd);
    }
    breadcrumbLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://kloversegy.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://kloversegy.com/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `https://kloversegy.com/blog/${post.slug}` },
      ],
    });

    return () => {
      document.title = "Klovers";
      jsonLd?.remove();
      breadcrumbLd?.remove();
      document.getElementById("faq-jsonld")?.remove();
      canonical?.remove();
      document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    };
  }, [post, partnerSlug]);

  const readingTime = post?.content ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : null;
  const isRtl = post?.lang === "ar";

  // The stored markdown carries the `<!-- klovers:related:start -->` markers
  // and, between them, a bullet list of the same links the cards below now
  // show. react-markdown renders raw HTML nodes as literal text when rehype-raw
  // is absent, so without this the comments print to the reader — and the
  // links would appear twice.
  const articleMarkdown = useMemo(() => extractRelatedBlock(post?.content ?? "").body, [post?.content]);

  // Most readers who leave an article leave well before the end, so the
  // conversion CTA that used to live only at the foot now also appears
  // after roughly the first 20% (intro + first section) — wherever that
  // lands without cutting a section in half. Returns null for short/
  // unstructured articles, which then keep a single CTA at the bottom.
  const earlySplit = useMemo(() => splitMarkdownAtHeading(articleMarkdown, 0.2), [articleMarkdown]);

  const cards = relatedPosts.slice(0, CARD_LIMIT);
  const extraLinks = relatedPosts.slice(CARD_LIMIT);

  // Learning layer (Klovers Journal): read from the article's own vocabulary
  // tables. Empty for articles that have none, and then nothing extra renders.
  const vocab = useMemo(() => extractArticleVocab(post?.content), [post?.content]);
  const mdComponents = useMemoVocabComponents(vocab, post?.slug ?? "", post?.lang === "ar");
  // The first related card becomes "your next stop"; the rest stay a grid.
  const [nextStop, ...nearbyCards] = cards;

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="font-semibold text-foreground">{isAr ? "تعذر تحميل هذا المقال" : "Couldn't load this article"}</h1>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">{isAr ? "إعادة المحاولة" : "Try again"}</Button>
              <Button asChild variant="ghost">
                <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "العودة للمدونة" : "Back to Blog"}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-full max-w-sm" />
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 text-center px-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">{isAr ? "المقال غير موجود" : "Article not found"}</h1>
          <Button asChild variant="outline">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "العودة للمدونة" : "Back to Blog"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // CTA block — custom if set, default otherwise. 200+, not 500+: this
  // fallback renders on every article that has no cta_text of its own, so
  // it is the widest-reach copy of the student figure on the site. Same
  // claim as the hero strip in HeroSection.tsx - every student taught
  // across 13 years. Defined once and rendered at two positions (see
  // earlySplit above) so both copies always stay in sync.
  const ctaBlock = (
    <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl text-center space-y-4">
      <p className="text-sm font-bold text-foreground uppercase tracking-widest">
        {post.cta_text ? (isAr ? "هل حان وقت البدء؟" : "Ready to start?") : (isAr ? "تعلّم الكورية يبدأ اليوم" : "Start learning Korean today")}
      </p>
      <h3 className="text-xl font-bold text-foreground">
        {post.cta_text || (isAr ? "اكتشاف المستوى عبر اختبار تحديد المستوى المجاني، مع معلمة درّست أكثر من 200 طالب على مدى 13 عامًا." : "Find your level with our free placement test with a teacher who has taught 200+ students over 13 years.")}
      </h3>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        <Button asChild size="lg" className="gap-2">
          <Link to={post.cta_url || "/placement-test"}>
            {post.cta_url ? (isAr ? "البدء الآن" : "Get Started") : (isAr ? "اختبار تحديد المستوى المجاني" : "Take the Free Placement Test")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link to="/enroll">{isAr ? "عرض الدورات والأسعار" : "View Courses & Pricing"}</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-20">
        <article
          className="container mx-auto px-4 max-w-[720px]"
          dir={isRtl ? "rtl" : "ltr"}
          lang={post.lang || "en"}
        >
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">{isAr ? "الرئيسية" : "Home"}</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" /></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">{isAr ? "المدونة" : "Blog"}</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" /></li>
              <li className="text-foreground font-medium truncate max-w-[260px]" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Type badge */}
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLOR[post.article_type] || "bg-muted text-muted-foreground border-border"}`}>
              {(isAr ? TYPE_LABEL_AR : TYPE_LABEL)[post.article_type] || post.article_type}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Description / standfirst */}
          <p className="text-lg text-foreground/70 mb-6 leading-relaxed font-sans">
            {post.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y border-border py-3 mb-8 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{post.author}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <time dateTime={post.published_at || post.created_at}>
                {new Date(post.published_at || post.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </span>
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {isAr ? `${readingTime} دقيقة قراءة` : `${readingTime} min read`}
              </span>
            )}
          </div>

          <ArticleLearningIntro
            vocabCount={vocab.length}
            minutes={readingTime}
            level={articleLevel(post.slug)}
            stage={stageForSlug(post.slug)}
            isAr={isRtl}
          />

          {/* Hero Image 1 */}
          <OptimizedImage
            src={post.hero_image}
            alt={post.hero_alt || post.title}
            caption={post.hero_caption}
            isHero
            className="w-full object-cover"
          />

          {/* Hero Image 2 */}
          {post.hero_image_2 && (
            <OptimizedImage
              src={post.hero_image_2}
              alt={post.hero_alt_2 || post.title}
              caption={post.hero_caption_2}
              isHero
              className="w-full object-cover"
            />
          )}

          {/* Article body */}
          {(() => {
            const proseClassName = `prose prose-base max-w-none font-sans
              prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-6 prose-h2:border-t prose-h2:border-border
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
              prose-p:text-foreground/90 prose-p:leading-[1.85] prose-p:my-5 prose-p:text-[1.05rem]
              prose-a:text-foreground prose-a:font-semibold prose-a:underline prose-a:decoration-primary prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:decoration-foreground
              prose-strong:text-foreground prose-strong:font-bold
              prose-em:text-foreground/80
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/80
              prose-li:text-foreground/90 prose-li:text-[1.05rem] prose-li:leading-relaxed prose-li:my-1.5
              prose-ul:my-5 prose-ol:my-5
              prose-ul:list-disc prose-ol:list-decimal
              prose-code:font-mono prose-code:text-[0.9em] prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:shadow-sm
              prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:mx-auto
              prose-hr:border-border prose-hr:my-10
              prose-table:w-full prose-th:bg-muted/60 prose-th:text-foreground prose-th:font-semibold prose-td:text-foreground/80 prose-td:border-border prose-th:border-border
              ${isRtl ? "text-right" : ""}
            `;

            if (earlySplit) {
              return (
                <>
                  <div className={proseClassName}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {earlySplit.before}
                    </ReactMarkdown>
                  </div>
                  {ctaBlock}
                  <div className={proseClassName}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {earlySplit.after}
                    </ReactMarkdown>
                  </div>
                </>
              );
            }

            return (
              <div className={proseClassName}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {articleMarkdown}
                </ReactMarkdown>
              </div>
            );
          })()}
          <ArticleEndSentinel slug={post.slug} />

          <ArticleLearnedToday vocab={vocab} slug={post.slug} isAr={isRtl} hasNextStop={Boolean(nextStop)} />

          {/* CTA block — custom if set, default otherwise.
              200+, not 500+: this fallback renders on every article that has no
              cta_text of its own, so it is the widest-reach copy of the student
              figure on the site. Same claim as the hero strip in
              HeroSection.tsx - every student taught across 13 years.

              Re, 21 Oct 2026: most readers leave before reaching the bottom of
              the article, so this same block is now also inserted after
              roughly the first 20% (see earlySplit above/ctaBlock below) —
              not just here at the foot. */}
          {ctaBlock}

          {/* Share row */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> {isAr ? "مشاركة" : "Share"}
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-foreground" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "نسخ الرابط" : "Copy link")}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`}
              onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`, { cta_label: "blog_share", metadata: { slug: post.slug } }); }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
            </a>
          </div>

          {/* Tags */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          )}

          {/* Free trial CTA — conversion bridge mid-article journey */}
          <div className="my-10 bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
                {isAr ? "تعلم الكورية مع مدرس حقيقي" : "Learn Korean with a real teacher"}
              </p>
              <p className="font-bold text-foreground text-base leading-snug">
                {isAr ? "أول حصة مجانية، دون بطاقة بنكية" : "Your first class is free, no credit card"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "مجموعات صغيرة، وشرح بالعربية، وجدول مرن." : "Small groups, Arabic instruction, flexible schedule."}
              </p>
            </div>
            <Button asChild className="gap-2 shrink-0">
              <Link to="/free-trial">
                {isAr ? "الحجز مجانًا" : "Book Free Class"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Related posts — the curated block when the article has one, the
              article_type suggestions otherwise. Placed before the comments:
              a reader who has just finished the article is looking for what to
              read next before they are looking for a comment box. */}
          {nextStop && (
            <div className="mt-14 pt-10 border-t border-border">
              {/* "Your next stop" replaces a bare "related articles" heading:
                  the top pick (the curated block's first link when there is
                  one) is framed as the next step of the journey. */}
              <NextStop post={nextStop} isAr={isAr} fromSlug={post.slug} />
              {nearbyCards.length > 0 && (
              <>
              <h2 className="text-lg font-bold text-foreground mb-1 mt-10">
                {relatedIsCurated
                  ? (isAr ? "محطات قريبة" : "Nearby stops")
                  : (isAr ? "قد يعجبك أيضاً" : "You might also like")}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {isAr ? "مقالات في الموضوع نفسه" : "More on the same topic"}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {nearbyCards.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/blog/${rp.slug}`}
                    className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="aspect-video overflow-hidden bg-muted group-hover:bg-muted/80 transition-colors">
                      <OptimizedImage
                        src={rp.hero_image}
                        alt={rp.hero_alt || rp.title}
                        variant="card"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[rp.article_type] || "bg-muted text-muted-foreground border-border"}`}>
                        {(isAr ? TYPE_LABEL_AR : TYPE_LABEL)[rp.article_type] || rp.article_type}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground mt-2 line-clamp-2 leading-snug group-hover:underline decoration-primary decoration-2 underline-offset-2">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {rp.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(rp.published_at || rp.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              </>
              )}

              {extraLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? "المزيد في الموضوع نفسه" : "Also worth reading"}
                  </span>
                  {extraLinks.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/blog/${rp.slug}`}
                      className="text-sm text-foreground underline decoration-primary decoration-2 underline-offset-2 hover:decoration-foreground"
                    >
                      {rp.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <BlogComments postId={post.id} isAr={isAr} />

          {/* Back to blog */}
          <div className="mt-8">
            <Button asChild variant="outline" size="sm">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "جميع المقالات" : "All Articles"}
              </Link>
            </Button>
          </div>
        </article>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default BlogPostPage;
