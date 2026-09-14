import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Copy, Video, VideoOff } from "lucide-react";

/**
 * Every room, in one place, with the link that opens it.
 *
 * The link lived on one row of one table and appeared on no screen. On 14 Sep
 * six of the eight group classes had none at all — including the one with the
 * only paying student in it — and nothing anywhere said so. A class with no
 * room is a class nobody can attend, and it looked exactly like a class that
 * was ready.
 *
 * So this lists the rooms and puts the missing ones FIRST. The point of the
 * card is not the links that work; it is the ones that do not.
 */

type Room = {
  key: string;
  /** "Hangul · Friday 15:00" — what Re calls it. */
  title: string;
  /** "Group class" or "Trial · 18 Sep". */
  kind: string;
  meetingUrl: string | null;
  /** How many people would be let down if this link is missing. */
  people: number;
  /** Where to go and fix it. */
  fixHref: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-09-18" -> "18 Sep". Parsed as a plain date, never shifted by a timezone. */
function shortDate(iso: string | null): string {
  if (!iso) return "date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${d} ${dt.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}`;
}

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

export default function ClassRooms() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const todayStr = (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })();

        // Group classes. The seat count comes from the membership table rather
        // than the package capacity: capacity is how many COULD be let down,
        // and the number that matters is how many would be.
        const [groupsRes, membersRes, slotsRes, trialRes] = await Promise.all([
          supabase
            .from("pkg_groups")
            .select("id, name, meeting_url, package_id, is_active")
            .eq("is_active", true),
          supabase
            .from("pkg_group_members")
            .select("group_id")
            .eq("member_status", "active"),
          supabase
            .from("schedule_packages")
            .select("id, level, day_of_week, start_time, is_active")
            .eq("is_active", true),
          supabase
            .from("trial_slots")
            .select("id, trial_date, start_time, class_language, meeting_url")
            .eq("is_active", true)
            .eq("lifecycle", "active")
            .gte("trial_date", todayStr)
            .order("trial_date", { ascending: true }),
        ]);

        // Each of these used to be the kind of call that returns null on
        // failure and renders an empty, confident list. An empty room list on
        // this card would read as "every class has a link".
        if (groupsRes.error) throw groupsRes.error;
        if (membersRes.error) throw membersRes.error;
        if (slotsRes.error) throw slotsRes.error;
        if (trialRes.error) throw trialRes.error;
        if (cancelled) return;

        const seated = new Map<string, number>();
        for (const m of (membersRes.data ?? []) as Array<{ group_id: string }>) {
          seated.set(m.group_id, (seated.get(m.group_id) ?? 0) + 1);
        }

        const packages = new Map(
          ((slotsRes.data ?? []) as Array<{
            id: string; level: string | null; day_of_week: number | null; start_time: string | null;
          }>).map(p => [p.id, p]),
        );

        const groupRooms: Room[] = ((groupsRes.data ?? []) as Array<{
          id: string; name: string | null; meeting_url: string | null; package_id: string | null;
        }>).map(g => {
          const p = g.package_id ? packages.get(g.package_id) : undefined;
          const when = p && p.day_of_week != null
            ? `${DAY_NAMES[p.day_of_week]} ${hhmm(p.start_time)}`
            : "";
          return {
            key: `group:${g.id}`,
            title: g.name || when || "Group class",
            kind: when ? `Group class · ${when} Cairo` : "Group class",
            meetingUrl: g.meeting_url,
            people: seated.get(g.id) ?? 0,
            fixHref: "/admin?tab=groups",
          };
        });

        const trialRooms: Room[] = ((trialRes.data ?? []) as Array<{
          id: string; trial_date: string | null; start_time: string | null;
          class_language: string | null; meeting_url: string | null;
        }>).map(s => ({
          key: `trial:${s.id}`,
          title: `Trial · ${shortDate(s.trial_date)} ${hhmm(s.start_time)}`,
          kind: `Trial session · ${s.class_language ?? "any language"}`,
          meetingUrl: s.meeting_url,
          people: 0,
          fixHref: "/admin?tab=trials",
        }));

        // Missing links first, and within those the ones with people in them.
        // Sorting alphabetically would bury the only row that needs an action.
        const all = [...groupRooms, ...trialRooms].sort((a, b) => {
          const aMissing = a.meetingUrl ? 1 : 0;
          const bMissing = b.meetingUrl ? 1 : 0;
          if (aMissing !== bMissing) return aMissing - bMissing;
          if (a.people !== b.people) return b.people - a.people;
          return a.title.localeCompare(b.title);
        });

        setRooms(all);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the class rooms.");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const copy = async (url: string, title: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: title });
    } catch (err: any) {
      // The browser refuses the clipboard outside a secure context, and a
      // silent failure here looks exactly like a successful copy.
      toast({
        title: "Could not copy",
        description: err?.message ?? "The browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-sm">
          <span className="font-semibold text-destructive">Could not load the class rooms.</span>{" "}
          <span className="text-muted-foreground">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!rooms) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No active classes or trial sessions.
        </CardContent>
      </Card>
    );
  }

  const missing = rooms.filter(r => !r.meetingUrl).length;

  return (
    <div className="space-y-2">
      {missing > 0 && (
        <p className="text-sm font-semibold text-destructive">
          {missing} {missing === 1 ? "class has" : "classes have"} no room link — nobody can join
          {missing === 1 ? " it" : " them"}.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {rooms.map(r => (
          <Card key={r.key} className={r.meetingUrl ? undefined : "border-destructive"}>
            <CardContent className="p-3 flex items-start gap-3">
              {r.meetingUrl
                ? <Video className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                : <VideoOff className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{r.title}</span>
                  {r.people > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {r.people} seated
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{r.kind}</p>

                {r.meetingUrl ? (
                  <a
                    href={r.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-muted-foreground underline underline-offset-2"
                  >
                    {r.meetingUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <Link
                    to={r.fixHref}
                    className="text-xs font-semibold text-destructive underline underline-offset-2"
                  >
                    No link yet — add one
                  </Link>
                )}
              </div>

              {r.meetingUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 shrink-0"
                  onClick={() => copy(r.meetingUrl!, r.title)}
                  title="Copy this room link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
