import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, User, ArrowRight, Clock, ChevronRight, Share2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

const TYPE_LABEL: Record<string, string> = {
  howto: "How-To",
  listicle: "Listicle",
  longform: "Article",
  news: "News",
  review: "Review",
};

const TYPE_COLOR: Record<string, string> = {
  howto: "bg-blue-100 text-blue-700 border-blue-200",
  listicle: "bg-green-100 text-green-700 border-green-200",
  longform: "bg-purple-100 text-purple-700 border-purple-200",
  news: "bg-red-100 text-red-700 border-red-200",
  review: "bg-orange-100 text-orange-700 border-orange-200",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

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
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (data) {
        setPost(data as BlogPost);
        // Track view — fire-and-forget, non-blocking
        supabase.rpc("increment_blog_view", { post_slug: slug }).then(() => {});
      } else if (language === "ar" && !slug.endsWith("-ar")) {
        const { data: arData } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", `${slug}-ar`)
          .eq("published", true)
          .maybeSingle();
        setPost(arData as BlogPost | null);
      } else {
        setPost(null);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug, language]);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!post) return;

    document.title = `${post.title} | Klovers Blog`;

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

    // Basic meta
    setMeta("description", post.description);
    setMeta("keywords", (post.keywords || []).join(", "));

    // Open Graph
    setMeta("og:title", post.title, "property");
    setMeta("og:description", post.description, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", `https://kloversegy.com/blog/${post.slug}`, "property");
    setMeta("og:locale", locale, "property");
    setMeta("og:site_name", "Klovers", "property");
    if (post.hero_image) {
      setMeta("og:image", post.hero_image, "property");
      setMeta("og:image:width", "1200", "property");
      setMeta("og:image:height", "630", "property");
      if (post.hero_alt) setMeta("og:image:alt", post.hero_alt, "property");
    }

    // Article meta
    setMeta("article:published_time", post.published_at || post.created_at, "property");
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
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", post.description);
    if (post.hero_image) setMeta("twitter:image", post.hero_image);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://kloversegy.com/blog/${post.slug}`;

    // JSON-LD: BlogPosting
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
      headline: post.title,
      description: post.description,
      image: post.hero_image || "",
      author: { "@type": "Person", name: post.author },
      publisher: {
        "@type": "Organization",
        name: "Klovers",
        logo: { "@type": "ImageObject", url: "https://kloversegy.com/klovers-logo.jpg" },
      },
      datePublished: post.published_at || post.created_at,
      url: `https://kloversegy.com/blog/${post.slug}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://kloversegy.com/blog/${post.slug}` },
      inLanguage: post.lang || "en",
      wordCount,
      keywords: (post.keywords || []).join(", "),
    });

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
      canonical?.remove();
      document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
    };
  }, [post]);

  const readingTime = post?.content ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : null;
  const isRtl = post?.lang === "ar";

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
          <h1 className="text-2xl font-bold text-foreground mb-4">Article not found</h1>
          <Button asChild variant="outline">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Blog
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

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
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              </li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="text-foreground font-medium truncate max-w-[260px]" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Type badge */}
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLOR[post.article_type] || "bg-muted text-muted-foreground border-border"}`}>
              {TYPE_LABEL[post.article_type] || post.article_type}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Description / standfirst */}
          <p className="text-lg text-foreground/70 mb-6 leading-relaxed font-serif">
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
                {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </span>
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min read
              </span>
            )}
          </div>

          {/* Hero Image 1 */}
          {post.hero_image && (
            <figure className="mb-8 -mx-4 sm:mx-0">
              <img
                src={post.hero_image}
                alt={post.hero_alt || post.title}
                className="w-full rounded-none sm:rounded-2xl object-cover aspect-[16/9] shadow-md"
              />
              {post.hero_caption && (
                <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
                  {post.hero_caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Hero Image 2 */}
          {post.hero_image_2 && (
            <figure className="mb-8 -mx-4 sm:mx-0">
              <img
                src={post.hero_image_2}
                alt={post.hero_alt_2 || post.title}
                className="w-full rounded-none sm:rounded-2xl object-cover aspect-[16/9] shadow-md"
              />
              {post.hero_caption_2 && (
                <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
                  {post.hero_caption_2}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article body */}
          <div className={`prose prose-base max-w-none font-serif
            prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-6 prose-h2:border-t prose-h2:border-border
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-foreground/90 prose-p:leading-[1.85] prose-p:my-5 prose-p:text-[1.05rem]
            prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
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
          `}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* CTA block — custom if set, default otherwise */}
          <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl text-center space-y-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              {post.cta_text ? "Ready to start?" : "Start learning Korean today"}
            </p>
            <h3 className="text-xl font-bold text-foreground">
              {post.cta_text || "Find your level with our free placement test and join 2,000+ students."}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Button asChild size="lg" className="gap-2">
                <Link to={post.cta_url || "/placement-test"}>
                  {post.cta_url ? "Get Started" : "🎯 Take the Free Placement Test"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/enroll">📚 View Courses & Pricing</Link>
              </Button>
            </div>
          </div>

          {/* Share row */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Share
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-green-700"
            >
              💬 WhatsApp
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

          {/* Back to blog */}
          <div className="mt-8">
            <Button asChild variant="outline" size="sm">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />All Articles
              </Link>
            </Button>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
