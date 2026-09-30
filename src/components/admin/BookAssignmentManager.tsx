import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookOpen, Plus, Trash2, Search, Clock, CheckCircle2, Lock, Download, ExternalLink } from "lucide-react";
import { BOOKS, BOOK_COVERS, type BookId } from "@/constants/books";

/**
 * Admin → Books.
 *
 * The top of the screen is the whole library (28 Sep 2026, Re: "add all the
 * books, which for teaching and which for the store"), in three shelves:
 *   Teaching — level books given free when a group starts
 *   Store    — self-study editions sold in /shop (Stripe product book_id)
 *   Free     — trial-class guides + the public Hangul starter sheets
 * Each card shows whether its PDF is in storage, how many students have it,
 * and — for store books — whether a Stripe product sells it yet.
 *
 * Level books (A0 Hangul, Level 1) are gifts for joining: it is assigned automatically when
 * a Hangul group is started (and to anyone seated into a group that is already
 * running) by the database triggers in
 * supabase/migrations/20260926010000_auto_assign_level_book_on_group_start.sql.
 * Arabic groups get the Arabic edition, English groups the English one.
 * This screen is for exceptions only — assign by hand, remove, or download.
 */
type Shelf = "teaching" | "store" | "free" | "topik";

const SHELVES: { id: Shelf; title: string; note: string }[] = [
  { id: "teaching", title: "Teaching", note: "Level books — a free gift when a group starts (Arabic groups get the Arabic edition, English groups the English one)." },
  { id: "store", title: "Store", note: "Self-study editions sold in /shop. Same lessons; answer key open to the reader; licence = personal use of the buyer." },
  { id: "free", title: "Free", note: "Trial-class guides and the public Hangul starter sheets." },
  { id: "topik", title: "TOPIK past papers", note: "Official TOPIK I reading papers — for teachers and TOPIK practice. Assign to a student by hand; not given automatically." },
];

/** Public PDFs on the site itself (not in book_assignments). */
const PUBLIC_FILES: { href: string; title: string; lang: "ar" | "en"; note: string }[] = [
  { href: "/hangul-starter-ar.pdf", title: "Hangul starter sheet (Arabic)", lang: "ar", note: "Public download on /hangul-starter · 5 pages" },
  { href: "/hangul-starter-en.pdf", title: "Hangul starter sheet (English)", lang: "en", note: "Public download on /hangul-starter · 5 pages" },
];

interface ShopListing { bookId: string | null; price: { amount: number; currency: string } }

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/** Status chip in the Klovers palette: live = neon-green edge, waiting = yellow fill. */
function Chip({ tone, children }: { tone: "live" | "wait" | "plain"; children: ReactNode }) {
  const cls =
    tone === "live" ? "border-klovers-green bg-ivory text-charcoal"
    : tone === "wait" ? "border-klovers-yellow bg-klovers-yellow text-charcoal"
    : "border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {tone === "live" && <span className="h-1.5 w-1.5 rounded-full bg-klovers-green" aria-hidden="true" />}
      {children}
    </span>
  );
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

interface Assignment {
  id: string;
  user_id: string;
  book_id: string;
  enrollment_id: string | null;
  available_from: string;
  assigned_at: string;
  assigned_by: string;
  notes: string | null;
  profile?: { name: string | null; email: string | null };
}

function availabilityStatus(available_from: string): "available" | "upcoming" | "soon" {
  const diff = new Date(available_from).getTime() - Date.now();
  if (diff <= 0) return "available";
  if (diff < 3 * 24 * 60 * 60 * 1000) return "soon";
  return "upcoming";
}

/** A gift is given now, not in a week. Local time, as datetime-local expects. */
function defaultAvailableFrom(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function bookLabel(bookId: string): string {
  return bookId in BOOKS ? BOOKS[bookId as BookId].titleEn : bookId;
}

const BookAssignmentManager = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [availableFrom, setAvailableFrom] = useState(defaultAvailableFrom());
  const [notes, setNotes] = useState("");
  const [bookId, setBookId] = useState<BookId>("hangul-a0");
  const BOOK_ID = bookId;
  const BOOK = BOOKS[bookId];
  const [filesInStorage, setFilesInStorage] = useState<Set<string> | null>(null);
  const [shop, setShop] = useState<ShopListing[] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [assignRes, profileRes] = await Promise.all([
      supabase.from("book_assignments").select("*").order("assigned_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, email").order("name"),
    ]);
    if (assignRes.error) toast({ title: "Error loading assignments", description: assignRes.error.message, variant: "destructive" });
    if (profileRes.error) toast({ title: "Error loading users", description: profileRes.error.message, variant: "destructive" });

    const profileMap = new Map((profileRes.data ?? []).map((p: Profile) => [p.user_id, p]));
    const enriched = (assignRes.data ?? []).map((a: Assignment) => ({
      ...a,
      profile: profileMap.get(a.user_id),
    }));
    setAssignments(enriched);
    setProfiles(profileRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Which PDFs are really in storage, and which books the shop sells.
  useEffect(() => {
    supabase.storage.from("student-materials").list("books", { limit: 100 }).then(({ data }) => {
      setFilesInStorage(new Set((data ?? []).map(f => `books/${f.name}`)));
    });
    supabase.functions.invoke("shop-products", { method: "GET" }).then(({ data }) => {
      setShop(Array.isArray(data?.products) ? (data.products as ShopListing[]) : []);
    });
  }, []);

  const assignedUserIds = new Set(assignments.filter(a => a.book_id === BOOK_ID).map(a => a.user_id));
  const filteredProfiles = profiles.filter(p => {
    const q = userSearch.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) && !assignedUserIds.has(p.user_id);
  });

  const downloadPdf = async (id: BookId = bookId) => {
    const book = BOOKS[id];
    const { data, error } = await supabase.storage
      .from("student-materials")
      .createSignedUrl(book.path, 60 * 60, { download: book.fileName });
    if (error || !data?.signedUrl) {
      toast({ title: "Could not prepare the PDF", description: error?.message, variant: "destructive" });
      return;
    }
    window.location.assign(data.signedUrl);
  };

  const handleAssign = async () => {
    if (!selectedUser) { toast({ title: "Select a student first", variant: "destructive" }); return; }
    if (!availableFrom) { toast({ title: "Set an availability date", variant: "destructive" }); return; }

    const { data: { user } } = await supabase.auth.getUser();

    setSaving(true);
    const { error } = await supabase.from("book_assignments").insert({
      user_id: selectedUser.user_id,
      book_id: BOOK_ID,
      available_from: new Date(availableFrom).toISOString(),
      assigned_by: user?.email ?? "admin",
      notes: notes.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Failed to assign", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Book assigned!", description: `${BOOK.titleEn} assigned to ${selectedUser.name ?? selectedUser.email}` });
      setShowDialog(false);
      setSelectedUser(null);
      setUserSearch("");
      setNotes("");
      setAvailableFrom(defaultAvailableFrom());
      fetchData();
    }
  };

  const handleRemove = async (id: string, bookId: string, name: string | null | undefined) => {
    if (!confirm(`Remove ${bookLabel(bookId)} from ${name ?? "this student"}?`)) return;
    const { error } = await supabase.from("book_assignments").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Assignment removed" }); fetchData(); }
  };

  const filtered = assignments.filter(a => {
    const q = search.toLowerCase();
    return !q || a.profile?.name?.toLowerCase().includes(q) || a.profile?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs w-56"
          />
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowDialog(true)}>
          <Plus className="h-3.5 w-3.5" /> Assign Book
        </Button>
      </div>

      {/* Library: every book, by shelf */}
      <div className="space-y-5">
        {SHELVES.map(shelf => {
          const ids = (Object.keys(BOOKS) as BookId[]).filter(id => BOOKS[id].use === shelf.id);
          return (
            <section key={shelf.id} className="space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-sm font-bold">{shelf.title}</h3>
                <span className="text-xs text-muted-foreground">{shelf.note}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ids.map(id => {
                  const b = BOOKS[id];
                  const selected = bookId === id;
                  const count = assignments.filter(a => a.book_id === id).length;
                  const hasFile = filesInStorage ? filesInStorage.has(b.path) : null;
                  const listing = shop?.find(p => p.bookId === id);
                  return (
                    <Card key={id} className={selected ? "border-2 border-charcoal" : ""}>
                      <CardContent className="p-3 flex gap-3">
                        <img src={BOOK_COVERS[id]} alt="" width={60} height={78} loading="lazy"
                          className="h-[78px] w-[60px] rounded object-cover shrink-0 bg-muted" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="text-xs font-semibold leading-snug">{b.titleEn}</div>
                          <div className="text-[11px] text-muted-foreground">{b.subtitleEn} · {b.lang === "ar" ? "Arabic" : b.lang === "ko" ? "Korean" : "English"}</div>
                          <div className="flex flex-wrap gap-1">
                            {hasFile === false && <Chip tone="wait">PDF not uploaded</Chip>}
                            {hasFile === true && <Chip tone="plain">PDF in storage</Chip>}
                            <Chip tone="plain">{count} {shelf.id === "store" ? "bought / given" : "assigned"}</Chip>
                            {shelf.id === "store" && shop !== null && (listing
                              ? <Chip tone="live">In shop · {formatMoney(listing.price.amount, listing.price.currency)}</Chip>
                              : <Chip tone="wait">Not in Stripe yet</Chip>)}
                          </div>
                          <div className="flex gap-1.5 pt-0.5">
                            <Button variant={selected ? "default" : "outline"} size="sm" className="h-6 px-2 text-[11px]"
                              onClick={() => setBookId(id)}>
                              {selected ? "Selected" : "Select"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1"
                              disabled={hasFile === false} onClick={() => downloadPdf(id)}>
                              <Download className="h-3 w-3" /> PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {shelf.id === "free" && PUBLIC_FILES.map(f => (
                  <Card key={f.href}>
                    <CardContent className="p-3 flex gap-3">
                      <div className="h-[78px] w-[60px] rounded bg-klovers-yellow text-charcoal shrink-0 flex items-center justify-center text-lg font-bold" aria-hidden="true">한</div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="text-xs font-semibold leading-snug">{f.title}</div>
                        <div className="text-[11px] text-muted-foreground">{f.note}</div>
                        <div className="flex flex-wrap gap-1"><Chip tone="live">Public on the site</Chip></div>
                        <Button asChild variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1">
                          <a href={f.href} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /> Open</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
        <BookOpen className="h-3.5 w-3.5" />
        Selected for “Assign Book”: <span className="font-semibold text-foreground">{BOOK.titleEn}</span>
        <Badge variant="secondary">{assignments.filter(a => a.book_id === bookId).length} assigned</Badge>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-xs text-muted-foreground py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center">
          {search ? "No matches found." : "No books assigned yet. They appear here when a Hangul group starts."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Student</TableHead>
              <TableHead className="text-xs">Book</TableHead>
              <TableHead className="text-xs">Available From</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Assigned By</TableHead>
              <TableHead className="text-xs">Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => {
              const status = availabilityStatus(a.available_from);
              return (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{a.profile?.name ?? "—"}</div>
                    <div className="text-muted-foreground">{a.profile?.email ?? a.user_id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{bookLabel(a.book_id)}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(a.available_from).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    <div className="text-muted-foreground">
                      {new Date(a.available_from).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {status === "available" && (
                      <Badge variant="outline" className="gap-1 text-xs border-klovers-green bg-ivory text-charcoal">
                        <CheckCircle2 className="h-3 w-3" /> Live
                      </Badge>
                    )}
                    {status === "soon" && (
                      <Badge variant="outline" className="gap-1 text-xs border-klovers-yellow bg-klovers-yellow text-charcoal">
                        <Clock className="h-3 w-3" /> Soon
                      </Badge>
                    )}
                    {status === "upcoming" && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" /> Scheduled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.assigned_by === "auto:group-start" ? "Auto — group started" : a.assigned_by === "shop:stripe" ? "Shop — bought" : a.assigned_by === "shop:free" ? "Shop — free" : a.assigned_by}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{a.notes ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(a.id, a.book_id, a.profile?.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Assign dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-foreground" /> Assign {BOOK.titleEn}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Student search */}
            <div className="space-y-1.5">
              <Label className="text-xs">Student</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/40">
                  <div>
                    <div className="text-sm font-medium">{selectedUser.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setSelectedUser(null); setUserSearch(""); }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  {userSearch.length > 1 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                      {filteredProfiles.length === 0 ? (
                        <div className="text-xs text-muted-foreground px-3 py-2">No unassigned students found</div>
                      ) : filteredProfiles.slice(0, 8).map(p => (
                        <button
                          key={p.user_id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedUser(p)}
                        >
                          <div className="text-xs font-medium">{p.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available from date */}
            <div className="space-y-1.5">
              <Label className="text-xs">Available from (default: now)</Label>
              <Input
                type="datetime-local"
                value={availableFrom}
                onChange={e => setAvailableFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Private student — gift on joining"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAssign} disabled={saving || !selectedUser}>
              {saving ? "Assigning…" : "Assign Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookAssignmentManager;
