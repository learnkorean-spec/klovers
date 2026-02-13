import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Upload, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  cta_text: string;
  cta_url: string;
  content: string;
  author: string;
  lang: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const ARTICLE_TYPES = [
  { value: "howto", label: "How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "longform", label: "Long-form" },
  { value: "news", label: "News" },
  { value: "review", label: "Review" },
];

const emptyPost = (): Partial<BlogPost> => ({
  title: "",
  slug: "",
  description: "",
  keywords: [],
  article_type: "longform",
  hero_image: "",
  hero_alt: "",
  hero_caption: "",
  cta_text: "",
  cta_url: "",
  content: "",
  author: "KLovers Team",
  lang: "en",
  published: false,
});

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<BlogPost>>(emptyPost());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState("");

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openNew = () => {
    setEditing(emptyPost());
    setKeywordsInput("");
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing({ ...post });
    setKeywordsInput(post.keywords.join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.title || !editing.slug || !editing.content) {
      toast({ title: "Missing fields", description: "Title, slug, and content are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      title: editing.title,
      slug: editing.slug,
      description: editing.description || "",
      keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
      article_type: editing.article_type || "longform",
      hero_image: editing.hero_image || "",
      hero_alt: editing.hero_alt || "",
      hero_caption: editing.hero_caption || "",
      cta_text: editing.cta_text || "",
      cta_url: editing.cta_url || "",
      content: editing.content,
      author: editing.author || "KLovers Team",
      lang: editing.lang || "en",
      published: editing.published || false,
      published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing.id ? "Post updated" : "Post created" });
      setDialogOpen(false);
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const newPublished = !post.published;
    const { error } = await supabase.from("blog_posts").update({
      published: newPublished,
      published_at: newPublished ? (post.published_at || new Date().toISOString()) : post.published_at,
    }).eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
    setEditing((prev) => ({ ...prev, hero_image: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Image uploaded" });
  };

  const filtered = posts.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No posts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.article_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.published ? "Unpublish" : "Publish"}>
                      {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete post?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{post.title}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditing((prev) => ({
                      ...prev,
                      title,
                      slug: prev?.id ? prev.slug : generateSlug(title),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={editing.slug || ""} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (meta)</Label>
              <Textarea
                value={editing.description || ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Article Type</Label>
                <Select value={editing.article_type || "longform"} onValueChange={(v) => setEditing((prev) => ({ ...prev, article_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={editing.author || ""} onChange={(e) => setEditing((prev) => ({ ...prev, author: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={editing.lang || "en"} onValueChange={(v) => setEditing((prev) => ({ ...prev, lang: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="korean, learn, beginner" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hero Image</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={generatingImage || !editing.title}
                  onClick={async () => {
                    if (!editing.title) {
                      toast({ title: "Title required", description: "Enter a title first to generate a relevant image.", variant: "destructive" });
                      return;
                    }
                    setGeneratingImage(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-blog-image", {
                        body: {
                          title: editing.title,
                          description: editing.description || "",
                          article_type: editing.article_type || "longform",
                          keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
                        },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      setEditing((prev) => ({
                        ...prev,
                        hero_image: data.hero_image,
                        hero_alt: data.hero_alt,
                        hero_caption: data.hero_caption,
                      }));
                      toast({ title: "SEO hero image generated!" });
                    } catch (e: any) {
                      toast({ title: "Generation failed", description: e.message || "Try again", variant: "destructive" });
                    } finally {
                      setGeneratingImage(false);
                    }
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingImage ? "Generating..." : "Auto-generate (AI)"}
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={editing.hero_image || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_image: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                    <Button variant="outline" size="icon" asChild className="relative" disabled={uploading}>
                      <label>
                        <Upload className="h-4 w-4" />
                        <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                      </label>
                    </Button>
                  </div>
                  {editing.hero_image && (
                    <img src={editing.hero_image} alt="Preview" className="h-24 w-full object-cover rounded mt-1" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hero Alt (SEO)</Label>
                  <Input value={editing.hero_alt || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_alt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Hero Caption</Label>
                  <Input value={editing.hero_caption || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_caption: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input value={editing.cta_text || ""} onChange={(e) => setEditing((prev) => ({ ...prev, cta_text: e.target.value }))} placeholder="Start Learning Korean Today!" />
              </div>
              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input value={editing.cta_url || ""} onChange={(e) => setEditing((prev) => ({ ...prev, cta_url: e.target.value }))} placeholder="/enroll-now" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown) *</Label>
              <Textarea
                value={editing.content || ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
                rows={16}
                className="font-mono text-sm"
                placeholder="Write your article in Markdown..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={editing.published || false}
                onCheckedChange={(v) => setEditing((prev) => ({ ...prev, published: v }))}
              />
              <Label>Published</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing.id ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManager;
