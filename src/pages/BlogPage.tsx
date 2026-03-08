import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, ArrowRight } from "lucide-react";
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
  author: string;
  lang: string;
  published_at: string | null;
  created_at: string;
}

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, description, keywords, article_type, hero_image, hero_alt, author, lang, published_at, created_at")
        .eq("published", true)
        .eq("lang", language)
        .order("published_at", { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetchPosts();
  }, [language]);

  const typeLabel: Record<string, string> = {
    howto: "How-To",
    listicle: "Listicle",
    longform: "Article",
    news: "News",
    review: "Review",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">{language === "ar" ? "📝 المدونة" : "📝 Blog"}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {language === "ar" ? "مدونة K-Lovers" : "K-Lovers Blog"}
            </h1>
            <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
              {language === "ar" ? "نصائح وأدلة ورؤى لرحلتك في تعلم اللغة الكورية." : "Tips, guides, and insights for your Korean learning journey."}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-foreground/60 py-12 text-lg">{language === "ar" ? "لا توجد مقالات منشورة بعد. تحقق قريباً!" : "No articles published yet. Check back soon!"}</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    {post.hero_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.hero_image}
                          alt={post.hero_alt || post.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[post.article_type] || post.article_type}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-foreground/70 line-clamp-3 mb-4 leading-relaxed">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-foreground/60">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-foreground text-sm font-semibold mt-3 group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
