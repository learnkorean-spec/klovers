import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Real places (Re, 18 Nov 2026: "why no pictures from Korea? and the other
 * countries"). Real-looking travel photos of real places, not storybook
 * scenes: Korea for Klovers, plus the countries behind maktub (Arabic), Voca
 * (English) and Buda (Hungarian). Pick several places and get one photo each.
 */

const COUNTRIES: Record<string, string[]> = {
  "South Korea": [
    "Gyeongbokgung Palace, Seoul",
    "Bukchon Hanok Village, Seoul",
    "Myeongdong street food alley, Seoul",
    "Gwangjang Market, Seoul",
    "Han River park at sunset, Seoul",
    "Hongdae streets at night, Seoul",
    "a Seoul subway platform",
    "a neighbourhood convenience store, Seoul",
    "Haeundae Beach, Busan",
    "Gamcheon Culture Village, Busan",
    "Seongsan Ilchulbong, Jeju Island",
    "Jeonju Hanok Village",
    "a Korean university campus in spring",
    "a small Korean café in Yeonnam-dong",
  ],
  Egypt: [
    "Khan el-Khalili bazaar, Cairo",
    "the Nile corniche in Cairo at sunset",
    "Al-Muizz Street, Old Cairo",
    "the Pyramids of Giza",
    "Alexandria seafront",
    "Luxor Temple at dusk",
    "a Cairo coffee shop (ahwa)",
  ],
  "Saudi Arabia": ["Al-Balad old town, Jeddah", "Riyadh Boulevard at night", "AlUla rock landscape"],
  "United Arab Emirates": ["Dubai Creek with abra boats", "Al Fahidi historic district, Dubai"],
  "United Kingdom": ["a London street with red buses", "Oxford college quad", "the Edinburgh Royal Mile", "a London underground platform"],
  "United States": ["a New York City street corner", "Central Park in autumn", "a San Francisco cable car street", "a US college campus"],
  Hungary: [
    "Budapest Parliament from the Danube",
    "Chain Bridge, Budapest",
    "Fisherman's Bastion, Budapest",
    "Great Market Hall, Budapest",
    "Széchenyi Thermal Bath, Budapest",
    "Lake Balaton shore",
    "a Budapest tram on the Danube bank",
  ],
};

const SIZES = [
  { id: "1536x1024", label: "Landscape" },
  { id: "1024x1024", label: "Square" },
  { id: "1024x1536", label: "Portrait" },
] as const;

interface Result {
  id: number;
  country: string;
  place: string;
  image?: string;
  status: "loading" | "done" | "error";
}
let nextId = 1;

export default function RealPlacePhotos({ headerAction }: { headerAction?: ReactNode }) {
  const [country, setCountry] = useState("South Korea");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [scene, setScene] = useState("");
  const [people, setPeople] = useState(true);
  const [size, setSize] = useState<string>("1536x1024");
  const [results, setResults] = useState<Result[]>([]);

  const toggle = (p: string) => setPicked((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));

  const generateOne = async (c: string, place: string) => {
    const id = nextId++;
    setResults((rs) => [{ id, country: c, place, status: "loading" }, ...rs]);
    const patch = (p: Partial<Result>) => setResults((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "place-photo", country: c, place, scene, people, size },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      patch({ image: data.imageDataUrl, status: "done" });
    } catch (e) {
      patch({ status: "error" });
      toast({ title: `${place || c} failed`, description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const generate = async () => {
    const places = [...picked, ...custom.split("\n").map((s) => s.trim()).filter(Boolean)].slice(0, 6);
    const list = places.length ? places : [""];
    // Two at a time so the model's rate limit is not hit.
    for (let i = 0; i < list.length; i += 2) {
      await Promise.all(list.slice(i, i + 2).map((p) => generateOne(country, p)));
    }
  };

  const count = Math.min(6, picked.length + custom.split("\n").filter((s) => s.trim()).length) || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" /> Real places: photos from Korea and the other countries
        </CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Real-looking travel photos of real places, with real adult local people, no fake letters. For blog posts,
          lesson openers, the homepage and the maktub, Voca and Buda sites. Pick up to 6 places and get one photo each.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COUNTRIES).map((c) => (
            <Button key={c} size="sm" variant={country === c ? "default" : "outline"} onClick={() => { setCountry(c); setPicked([]); }}>
              {c}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES[country].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`rounded-full border px-3 py-1 text-xs ${picked.includes(p) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rp-custom">Other places (one per line)</Label>
            <Textarea id="rp-custom" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Namsan Tower cable car, Seoul" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-scene">What is happening (optional, used for every photo)</Label>
            <Input id="rp-scene" value={scene} onChange={(e) => setScene(e.target.value)} placeholder="e.g. friends ordering tteokbokki at a stall in the evening" />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="rp-people" checked={people} onCheckedChange={(v) => setPeople(v === true)} />
              <Label htmlFor="rp-people" className="font-normal">Include local people</Label>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SIZES.map((s) => (
            <Button key={s.id} size="sm" variant={size === s.id ? "default" : "outline"} onClick={() => setSize(s.id)}>
              {s.label}
            </Button>
          ))}
          <Button className="ml-auto" onClick={() => void generate()}>
            <Camera className="h-4 w-4 mr-2" /> Generate {count} photo{count > 1 ? "s" : ""}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <div key={r.id} className="space-y-2 rounded-md border p-2">
                <div className="flex min-h-40 items-center justify-center rounded bg-muted overflow-hidden">
                  {r.status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                  {r.status === "error" && <span className="text-xs text-destructive">Failed</span>}
                  {r.image && <img src={r.image} alt={r.place || r.country} className="w-full object-contain" />}
                </div>
                <p className="text-xs text-muted-foreground">{r.place || r.country}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={!r.image} onClick={() => {
                    if (!r.image) return;
                    const a = document.createElement("a");
                    a.href = r.image;
                    a.download = `klovers-place-${(r.place || r.country).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
                    a.click();
                  }}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="ghost" disabled={r.status === "loading"} onClick={() => void generateOne(r.country, r.place)}>
                    Again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
