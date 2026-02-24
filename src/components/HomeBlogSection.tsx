import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  article_type: string;
  hero_image: string;
  hero_alt: string;
  author: string;
  published_at: string | null;
  created_at: string;
}

const typeLabel: Record<string, string> = {
  howto: "How-To",
  listicle: "Listicle",
  longform: "Article",
  news: "News",
  review: "Review",
};

const HomeBlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, description, article_type, hero_image, hero_alt, author, published_at, created_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">📝 Blog</Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Latest from Our Blog
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tips, guides, and insights for your Korean learning journey.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full rounded-t-lg" />
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                    <Badge variant="outline" className="text-xs w-fit">
                      {typeLabel[post.article_type] || post.article_type}
                    </Badge>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2 mt-1">
                      {post.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
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

        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/blog">View All Articles <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeBlogSection;
