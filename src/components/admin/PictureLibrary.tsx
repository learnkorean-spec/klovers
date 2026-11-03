import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Image as ImageIcon, LayoutGrid, Grid2x2, Download } from "lucide-react";
import {
  LIBRARY_BOOK, LIBRARY_SCENES, LIBRARY_ICONS, LIBRARY_SHEETS, LIBRARY_SITE, LIBRARY_SITE_GROUPS,
} from "@/constants/pictureLibrary";

/**
 * Admin → Pictures.
 *
 * Every image generated for the Klovers books, kept in one place so nothing is
 * regenerated twice. The build pipeline and its assets were lost with their
 * session containers on 28 and 30 Sep 2026; this screen is the copy that stays.
 *
 * Files are served from public/picture-library/ — no Supabase round-trip, no
 * signed URLs, nothing to expire. The file name under each picture is the SAME
 * name the book generators use (b2s_07, cover_b2), so a picture can be asked
 * for by name in any later session.
 *
 * To add pictures: drop the files into the right folder under
 * public/picture-library/ and add their entries to src/constants/pictureLibrary.ts.
 */
type Kind = "all" | "scenes" | "icons" | "sheets" | "blog" | "books" | "brand";

const BASE = "/picture-library";

const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "scenes", label: "Scenes" },
  { id: "icons", label: "Icons" },
  { id: "sheets", label: "Source sheets" },
  { id: "blog", label: "Blog" },
  { id: "books", label: "Book covers" },
  { id: "brand", label: "Brand" },
];

export default function PictureLibrary() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");

  const term = q.trim().toLowerCase();
  const match = (...parts: (string | number)[]) =>
    !term || parts.join(" ").toLowerCase().includes(term);

  const scenes = useMemo(
    () => LIBRARY_SCENES.filter((s) => match(s.file, s.label)),
    [term],
  );
  const icons = useMemo(
    () => LIBRARY_ICONS.filter((i) => match(i.ko, i.ar, `lesson ${i.lesson}`, `حصة ${i.lesson}`)),
    [term],
  );
  const sheets = useMemo(
    () => LIBRARY_SHEETS.filter((s) => match(s.file, s.label)),
    [term],
  );

  const site = useMemo(
    () => LIBRARY_SITE.filter((p) => match(p.file, p.label ?? "", p.group)),
    [term],
  );

  const total = LIBRARY_SCENES.length + LIBRARY_ICONS.length + LIBRARY_SHEETS.length + LIBRARY_SITE.length;
  const showing =
    (kind === "all" || kind === "scenes" ? scenes.length : 0) +
    (kind === "all" || kind === "icons" ? icons.length : 0) +
    (kind === "all" || kind === "sheets" ? sheets.length : 0) +
    site.filter((p) => kind === "all" || kind === p.group).length;

  const show = (k: Exclude<Kind, "all">) => kind === "all" || kind === k;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <ImageIcon className="h-5 w-5" /> Picture library
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every image generated for {LIBRARY_BOOK}. The file name under each picture is the
            one the book generators use, so it can be asked for by name.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {showing} of {total}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="picture-library-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Korean word, Arabic meaning, lesson or file name"
            aria-label="Search by Korean word, Arabic meaning, lesson or file name"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <Button
              key={k.id}
              size="sm"
              variant={kind === k.id ? "default" : "outline"}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </Button>
          ))}
        </div>
      </div>

      {show("scenes") && (
        <Section
          icon={<LayoutGrid className="h-4 w-4" />}
          title="Scenes and covers"
          note="One per conversation, plus the cover."
          count={scenes.length}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((s) => (
              <Card key={s.file} className="overflow-hidden">
                <img
                  src={`${BASE}/scenes/${s.file}.jpg`}
                  alt={s.label}
                  loading="lazy"
                  className="aspect-[4/3] w-full max-w-full bg-muted object-cover"
                />
                <CardContent className="space-y-1 p-3">
                  <p className="text-sm font-medium" dir="rtl">{s.label}</p>
                  <FileRow dir="scenes" file={s.file} />
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {show("icons") && (
        <Section
          icon={<Grid2x2 className="h-4 w-4" />}
          title="Vocabulary icons"
          note="Cut from the source sheets, lessons 1–11."
          count={icons.length}
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {icons.map((i) => (
              <Card key={i.file} className="overflow-hidden">
                <img
                  src={`${BASE}/icons/${i.file}.jpg`}
                  alt={i.ar}
                  loading="lazy"
                  className="aspect-square w-full max-w-full bg-muted object-contain p-1.5"
                />
                <CardContent className="p-2 text-center">
                  <p className="truncate text-sm font-semibold" lang="ko">{i.ko}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="rtl">{i.ar}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {show("sheets") && (
        <Section
          icon={<LayoutGrid className="h-4 w-4" />}
          title="Source sheets"
          note="As generated, before the icons were cut out of them."
          count={sheets.length}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s) => (
              <Card key={s.file} className="overflow-hidden">
                <img
                  src={`${BASE}/sheets/${s.file}.jpg`}
                  alt={s.label}
                  loading="lazy"
                  className="aspect-[4/3] w-full max-w-full bg-muted object-cover"
                />
                <CardContent className="space-y-1 p-3">
                  <p className="text-sm font-medium" dir="rtl">{s.label}</p>
                  <FileRow dir="sheets" file={s.file} />
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {LIBRARY_SITE_GROUPS.filter((g) => show(g.id)).map((g) => {
        const items = site.filter((p) => p.group === g.id);
        return (
          <Section
            key={g.id}
            icon={<ImageIcon className="h-4 w-4" />}
            title={g.title}
            note={g.note}
            count={items.length}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => {
                const href = `${p.dir}/${p.file}`;
                return (
                  <Card key={href} className="overflow-hidden">
                    <img
                      src={href}
                      alt={p.label ?? p.file}
                      loading="lazy"
                      className="aspect-[4/3] w-full max-w-full bg-muted object-cover"
                    />
                    <CardContent className="space-y-1 p-3">
                      {p.label && <p className="text-sm font-medium" dir="rtl">{p.label}</p>}
                      <div className="flex items-center justify-between gap-2">
                        <code className="truncate text-xs text-muted-foreground">{p.file}</code>
                        <a
                          href={href}
                          download
                          className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3 w-3" /> Open
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Section>
        );
      })}

      {showing === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing matches “{q}”.
        </p>
      )}
    </div>
  );
}

function Section({
  icon, title, note, count, children,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold">
          {icon} {title}
          <Badge variant="outline" className="ml-1 font-normal">{count}</Badge>
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

function FileRow({ dir, file }: { dir: string; file: string }) {
  const href = `${BASE}/${dir}/${file}.jpg`;
  return (
    <div className="flex items-center justify-between gap-2">
      <code className="truncate text-xs text-muted-foreground">{file}</code>
      <a
        href={href}
        download
        className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Download className="h-3 w-3" /> Open
      </a>
    </div>
  );
}
