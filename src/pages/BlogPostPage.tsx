import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, User, ArrowRight } from "lucide-react";
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

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setPost(data as BlogPost | null);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  const typeLabel: Record<string, string> = {
    howto: "How-To",
    listicle: "Listicle",
    longform: "Article",
    news: "News",
    review: "Review",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
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
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article not found</h1>
          <Button asChild variant="outline">
            <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />Back to Blog</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-[750px]">
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Blog
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{typeLabel[post.article_type] || post.article_type}</Badge>
            <span className="text-sm text-foreground flex items-center gap-1">
              <User className="h-3 w-3" />{post.author}
            </span>
            <span className="text-sm text-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {new Date(post.published_at || post.created_at).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <p className="text-lg text-foreground/80 mb-6 leading-relaxed">{post.description}</p>

          {/* Hero Image 1 */}
          {post.hero_image && (
            <figure className="mb-6">
              <img
                src={post.hero_image}
                alt={post.hero_alt || post.title}
                className="w-full rounded-lg object-cover max-h-[400px]"
              />
              {post.hero_caption && (
                <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
                  {post.hero_caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Hero Image 2 */}
          {post.hero_image_2 && (
            <figure className="mb-8">
              <img
                src={post.hero_image_2}
                alt={post.hero_alt_2 || post.title}
                className="w-full rounded-lg object-cover max-h-[400px]"
              />
              {post.hero_caption_2 && (
                <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
                  {post.hero_caption_2}
                </figcaption>
              )}
            </figure>
          )}

          <div className="prose prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-p:text-foreground prose-p:leading-relaxed prose-p:text-base
            prose-a:text-foreground prose-a:font-semibold prose-a:underline
            prose-strong:text-foreground prose-strong:font-bold
            prose-blockquote:border-primary prose-blockquote:text-foreground/80
            prose-li:text-foreground prose-li:text-base
            prose-code:text-foreground prose-code:font-semibold
            prose-ul:text-foreground prose-ol:text-foreground
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {post.cta_text && (
            <div className="mt-12 p-8 bg-primary/5 border border-primary/20 rounded-lg text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">{post.cta_text}</h3>
              {post.cta_url && (
                <Button asChild size="lg" className="gap-2">
                  <Link to={post.cta_url}>
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}

          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
