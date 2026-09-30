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
 * Every room, in one place, with the link that opens it — and who is in it.
 *
 * The link lived on one row of one table and appeared on no screen. On 14 Sep
 * six of the eight group classes had none at all — including the one with the
 * only paying student in it — and nothing anywhere said so. A class with no
 * room is a class nobody can attend, and it looked exactly like a class that
 * was ready.
 *
 * So this lists the rooms and puts the missing ones FIRST. The point of the
 * card is not the links that work; it is the ones that do not.
 *
 * A count alone ("1 seated") does not say WHO is let down by a missing link,
 * and a trial room read 0 forever because bookings were never counted at all.
 * So each room now carries its people by name.
 *
 * --- 2026-09-21: confirmed, not booked ---
 *
 * The trial badge counted every live booking on the slot. On 25 Sep that read
 * "booked 16" while three people had actually said they were coming, and the
 * other thirteen had answered nothing at all. A booking is a ceiling, not a
 * turnout, and this card is read to decide how much a missing link costs and
 * whether a session is worth running — both of which are questions about who
 * confirmed.
 *
 * So the badge is the confirmed count. Bookings stay next to it in muted
 * text, because the gap between the two numbers is itself worth seeing: 3 of
 * 16 is a session that needs chasing, 3 of 3 is a small session. A slot
 * nobody has confirmed says so in words rather than showing a confident 16.
 *
 * Group classes are unchanged: a seat is a commitment already, so "seated" is
 * both numbers at once.
 */

type Person = {
  name: string;
  /** Trial bookings only: this one has confirmed she is coming. */
  confirmed: boolean;
};

type Room = {
  key: string;
  /** "Hangul · Friday 15:00" — what Re calls it. */
  title: string;
  /** "Group class" or "Trial · 18 Sep". */
  kind: string;
  meetingUrl: string | null;
  /** How many people are on this room's list at all. */
  people: number;
  /** How many of them said they are coming. Equals `people` for a group. */
  confirmed: number;
  /** Who they are. Confirmed first, so the four that show are the four that matter. */
  names: Person[];
  /** "seated" for a group, "confirmed" for a trial. */
  countWord: string;
  /** Trials only: bookings are a ceiling, so the badge shows the gap. */
  showsBookedToo: boolean;
  /** Where to go and fix it. */
  fixHref: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** How many names fit on a card before the rest become a number. */
const NAMES_SHOWN = 4;

/** "2026-09-18" -> "18 Sep". Parsed as a plain date, never shifted by a timezone. */
function shortDate(iso: string | null): string {
  if (!iso) return "date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${d} ${dt.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}`;
}

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

/** A booking with no name is still a person; show something rather than a blank. */
const personName = (name: string | null, email: string | null) =>
  (name || "").trim() || (email || "").trim() || "no name yet";

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
            .select("group_id, user_id")
            .eq("member_status", "active"),
          supabase
            .from("schedule_packages")
            .select("id, level, day_of_week, start_time, is_active, class_language")
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

        const members = (membersRes.data ?? []) as Array<{ group_id: string; user_id: string | null }>;
        const slotIds = ((trialRes.data ?? []) as Array<{ id: string }>).map(s => s.id);
        // A trial room is a permanent row that rolls forward to its next date,
        // so a slot id alone also matches every booking from its past dates.
        // A booking belongs to the room only on the date the room now shows.
        const slotDate = new Map(
          ((trialRes.data ?? []) as Array<{ id: string; trial_date: string | null }>).map(s => [s.id, s.trial_date]),
        );

        // Names for the seated students, and the trial bookings that were
        // never counted. Both are looked up by id rather than joined, because
        // the client's embedded joins depend on a foreign key being declared
        // and a silently empty embed here would read as "nobody is in this
        // class" — the exact lie this card exists to prevent.
        const userIds = Array.from(new Set(members.map(m => m.user_id).filter(Boolean))) as string[];

        const [profilesRes, bookingsRes] = await Promise.all([
          userIds.length
            ? supabase.from("profiles").select("user_id, name, email").in("user_id", userIds)
            : Promise.resolve({ data: [], error: null } as any),
          slotIds.length
            ? supabase
                .from("trial_bookings")
                .select("slot_id, trial_date, name, email, status, attendance_response")
                .in("slot_id", slotIds)
                .gte("trial_date", todayStr)
                .neq("status", "cancelled")
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (bookingsRes.error) throw bookingsRes.error;
        if (cancelled) return;

        const profileName = new Map<string, string>();
        for (const p of (profilesRes.data ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>) {
          profileName.set(p.user_id, personName(p.name, p.email));
        }

        const seated = new Map<string, Person[]>();
        for (const m of members) {
          const list = seated.get(m.group_id) ?? [];
          list.push({
            name: (m.user_id && profileName.get(m.user_id)) || "no name yet",
            confirmed: true,
          });
          seated.set(m.group_id, list);
        }

        const booked = new Map<string, Person[]>();
        for (const b of (bookingsRes.data ?? []) as Array<{
          slot_id: string | null; trial_date: string | null; name: string | null; email: string | null;
          status: string | null; attendance_response: string | null;
        }>) {
          if (!b.slot_id || b.trial_date !== slotDate.get(b.slot_id)) continue;
          const list = booked.get(b.slot_id) ?? [];
          list.push({
            name: personName(b.name, b.email),
            // Two ways the same yes is recorded: the status the confirmation
            // flow writes, and the answer she gave to the attendance letter.
            // Either one is a person saying she is coming.
            confirmed: b.status === "confirmed_attendance" || b.attendance_response === "yes",
          });
          booked.set(b.slot_id, list);
        }

        // Confirmed first: on a trial with eighteen bookings, the four names
        // worth the space are the four who said they are coming.
        const order = (list: Person[]) =>
          [...list].sort((a, b) =>
            a.confirmed === b.confirmed ? a.name.localeCompare(b.name) : a.confirmed ? -1 : 1,
          );

        const packages = new Map(
          ((slotsRes.data ?? []) as Array<{
            id: string; level: string | null; day_of_week: number | null; start_time: string | null;
            class_language: string | null;
          }>).map(p => [p.id, p]),
        );

        const groupRooms: Room[] = ((groupsRes.data ?? []) as Array<{
          id: string; name: string | null; meeting_url: string | null; package_id: string | null;
        }>).map(g => {
          const p = g.package_id ? packages.get(g.package_id) : undefined;
          const when = p && p.day_of_week != null
            ? `${DAY_NAMES[p.day_of_week]} ${hhmm(p.start_time)}`
            : "";
          // The language is shown because it used to live only in the group's
          // NAME, where nothing read it and one rename would have lost it. A
          // fact worth keeping is a fact worth showing: if a line here is
          // wrong, it is wrong on the screen Re opens every day.
          const lang = p?.class_language === "english" ? "English" : "Arabic";
          const people = order(seated.get(g.id) ?? []);
          return {
            key: `group:${g.id}`,
            title: g.name || when || "Group class",
            kind: when ? `Group class · ${when} Cairo · taught in ${lang}` : `Group class · taught in ${lang}`,
            meetingUrl: g.meeting_url,
            people: people.length,
            confirmed: people.length,
            names: people,
            countWord: "seated",
            showsBookedToo: false,
            fixHref: "/admin?tab=groups",
          };
        });

        const trialRooms: Room[] = ((trialRes.data ?? []) as Array<{
          id: string; trial_date: string | null; start_time: string | null;
          class_language: string | null; meeting_url: string | null;
        }>).map(s => {
          const people = order(booked.get(s.id) ?? []);
          return {
            key: `trial:${s.id}`,
            title: `Trial · ${shortDate(s.trial_date)} ${hhmm(s.start_time)}`,
            kind: `Trial session · ${s.class_language ?? "any language"}`,
            meetingUrl: s.meeting_url,
            people: people.length,
            confirmed: people.filter(p => p.confirmed).length,
            names: people,
            countWord: "confirmed",
            showsBookedToo: true,
            fixHref: "/admin?tab=trials",
          };
        });

        // Missing links first, and within those the ones people have actually
        // committed to. Sorting alphabetically would bury the only row that
        // needs an action; sorting by bookings would put a session nobody
        // confirmed above one four people are coming to.
        const all = [...groupRooms, ...trialRooms].sort((a, b) => {
          const aMissing = a.meetingUrl ? 1 : 0;
          const bMissing = b.meetingUrl ? 1 : 0;
          if (aMissing !== bMissing) return aMissing - bMissing;
          if (a.confirmed !== b.confirmed) return b.confirmed - a.confirmed;
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
        {rooms.map(r => {
          // Only the people who said yes carry the card. The rest are a
          // number, not names: they have answered nothing.
          const shown = (r.showsBookedToo ? r.names.filter(p => p.confirmed) : r.names).slice(0, NAMES_SHOWN);
          const rest = (r.showsBookedToo ? r.confirmed : r.people) - shown.length;
          const unanswered = r.people - r.confirmed;

          return (
            <Card key={r.key} className={r.meetingUrl ? undefined : "border-destructive"}>
              <CardContent className="p-3 flex items-start gap-3">
                {r.meetingUrl
                  ? <Video className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  : <VideoOff className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">{r.title}</span>
                    {r.confirmed > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {r.confirmed} {r.countWord}
                      </Badge>
                    )}
                    {/* A booking is a ceiling, not a turnout. The gap between
                        the two numbers is the thing worth acting on. */}
                    {r.showsBookedToo && unanswered > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {r.confirmed === 0
                          ? `nobody has confirmed yet · ${r.people} booked`
                          : `of ${r.people} booked · ${unanswered} no reply`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{r.kind}</p>

                  {shown.length > 0 && (
                    // The names, not just the number — and on a trial only the
                    // ones who said yes, because those are the people a missing
                    // link would actually let down.
                    <p className="text-[11px] text-foreground/80">
                      {shown.map((p, i) => (
                        <span key={`${p.name}-${i}`}>
                          {i > 0 && <span className="text-muted-foreground">, </span>}
                          <span className={p.confirmed ? "font-semibold" : undefined}>{p.name}</span>
                          {r.showsBookedToo && p.confirmed && <span className="text-muted-foreground"> ✓</span>}
                        </span>
                      ))}
                      {rest > 0 && (
                        <span className="text-muted-foreground"> +{rest} more</span>
                      )}
                    </p>
                  )}

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
          );
        })}
      </div>
    </div>
  );
}
