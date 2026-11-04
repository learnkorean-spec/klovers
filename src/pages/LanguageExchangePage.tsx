import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Heart, X, Loader2, ShieldAlert, Sparkles, MessageCircle, Clock, Send,
} from "lucide-react";
import {
  EXCHANGE_LANGUAGES,
  EXCHANGE_INTERESTS,
  EXCHANGE_MIN_AGE,
  EXCHANGE_MAX_AGE,
  EXCHANGE_GOALS,
  EXCHANGE_MAX_GOALS,
  EXCHANGE_DAYS,
  EXCHANGE_TIME_BUCKETS,
  EXCHANGE_AVAILABILITY_COUNT,
  EXCHANGE_GENDERS,
  EXCHANGE_LOOKING_FOR_GENDERS,
  REPORT_REASONS,
  EXCHANGE_AVATAR_STYLES,
  AVATAR_ICON_PREFIX,
  avatarStyleFromValue,
  languageLabel,
  interestLabel,
  goalLabel,
  genderLabel,
  lookingForGenderLabel,
  formatAvailabilitySlot,
  shortTimezoneLabel,
} from "@/constants/languageExchange";
import { AvatarArt } from "@/components/exchange/AvatarArt";
import { getUserTimezone } from "@/lib/viewerTimezone";

/**
 * Renders a profile's picture as one of the fixed built-in cartoon-character
 * avatars (never a real photo — see the "Avatars only" comment in
 * languageExchange.ts). Any value that isn't a recognized "avatar://<key>"
 * falls back to initials, so a stray/legacy value is never rendered as an
 * <img src=...>.
 */
function ExchangeAvatar({
  avatarUrl,
  name,
  className,
}: {
  avatarUrl: string | null | undefined;
  name: string;
  className?: string;
}) {
  const style = avatarStyleFromValue(avatarUrl);
  if (style) {
    return (
      <div
        className={className ?? "flex h-full w-full items-center justify-center"}
        style={{ backgroundColor: style.bg }}
      >
        <AvatarArt avatarKey={style.key} className="h-full w-full" />
      </div>
    );
  }
  return (
    <div className={className ?? "flex h-full w-full items-center justify-center"}>
      <Avatar className="h-full w-full">
        <AvatarFallback className="text-3xl">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  );
}

/**
 * Language Exchange (added 4 Nov 2026, Re's request): an opt-in, swipe-based
 * way for any signed-up visitor — not only enrolled Korean students — to find
 * a partner to practice a language with. Separate feature, separate tables
 * (exchange_profiles / exchange_swipes / exchange_matches / exchange_blocks /
 * exchange_reports — see supabase/migrations/20261104000100_language_exchange_feature.sql),
 * kept off the paid-course `students`/`profiles` tables entirely.
 *
 * `as any` on every `.from("exchange_*")` call: these tables postdate the
 * last `generate_typescript_types` run, matching the existing pattern in e.g.
 * BulkEmailManager.tsx for other tables added after a types refresh.
 *
 * Served at /exchange and /ar/exchange from the same component (App.tsx),
 * same pattern as /games + /ar/games -> GamesPage.
 */

interface ExchangeProfileRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  looking_for_gender: string;
  native_languages: string[];
  learning_languages: string[];
  interests: string[];
  goals: string[];
  availability_slots: string[];
  timezone: string | null;
  contact_type: string | null;
  contact_value: string | null;
  is_visible: boolean;
}

const emptyDraft = (): ExchangeProfileRow => ({
  user_id: "",
  display_name: "",
  avatar_url: null,
  bio: "",
  age: null,
  gender: null,
  looking_for_gender: "any",
  native_languages: [],
  learning_languages: [],
  interests: [],
  goals: [],
  availability_slots: [],
  timezone: null,
  contact_type: null,
  contact_value: "",
  is_visible: true,
});

export default function LanguageExchangePage() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: tr("Language Exchange | Klovers", "تبادل اللغة | كلوفرز"),
    description: tr(
      "Find a language exchange partner: set your languages and interests, then swipe through profiles.",
      "ابحث عن شريك لتبادل اللغة: حدّدي لغاتك واهتماماتك ثم تصفّحي الملفات الشخصية.",
    ),
    noindex: true,
  });

  const [myProfile, setMyProfile] = useState<ExchangeProfileRow | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [tab, setTab] = useState<"discover" | "matches" | "profile">("discover");

  // Load (or notice the absence of) the signed-in visitor's own exchange profile.
  useEffect(() => {
    if (!user) { setProfileLoaded(true); return; }
    let cancelled = false;
    supabase
      .from("exchange_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast({ title: tr("Couldn't load your profile", "تعذّر تحميل ملفك"), description: error.message, variant: "destructive" });
        }
        setMyProfile((data as unknown as ExchangeProfileRow) ?? null);
        setProfileLoaded(true);
        if (!data) setTab("profile");
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (authLoading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-lg px-5 py-20 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#FFFF00]" />
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {tr("Language Exchange", "تبادل اللغة")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {tr(
              "Sign up free to create a profile and find a partner to practice a language with.",
              "أنشئي حسابًا مجانيًا لإنشاء ملفك الشخصي والعثور على شريك لممارسة اللغة معه.",
            )}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to={`/signup?redirect=${encodeURIComponent("/exchange")}`}>{tr("Sign up", "إنشاء حساب")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/login?redirect=${encodeURIComponent("/exchange")}`}>{tr("Log in", "تسجيل الدخول")}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black tracking-tight">{tr("Language Exchange", "تبادل اللغة")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr(
              "Swipe through profiles, match, and practice together.",
              "تصفّحي الملفات الشخصية، كوّني تطابقًا، ومارسي اللغة معًا.",
            )}
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">{tr("Discover", "اكتشاف")}</TabsTrigger>
            <TabsTrigger value="matches">{tr("Matches", "التطابقات")}</TabsTrigger>
            <TabsTrigger value="profile">{tr("My Profile", "ملفي")}</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            {myProfile ? (
              <DiscoverDeck myProfile={myProfile} isAr={isAr} tr={tr} />
            ) : (
              <NeedsProfileNotice tr={tr} onGo={() => setTab("profile")} />
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <MatchesList isAr={isAr} tr={tr} userId={user.id} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileEditor
              userId={user.id}
              initial={myProfile}
              isAr={isAr}
              tr={tr}
              onSaved={(row) => {
                setMyProfile(row);
                if (tab === "profile") toast({ title: tr("Saved", "تم الحفظ") });
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function NeedsProfileNotice({ tr, onGo }: { tr: (en: string, ar: string) => string; onGo: () => void }) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <p className="text-muted-foreground">
          {tr("Set up your exchange profile first — it only takes a minute.", "أنشئي ملف التبادل أولًا — الأمر يستغرق دقيقة فقط.")}
        </p>
        <Button className="mt-4" onClick={onGo}>
          {tr("Set up my profile", "إعداد ملفي")}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------- Discover ---------------------------------- */

function DiscoverDeck({
  myProfile,
  isAr,
  tr,
}: {
  myProfile: ExchangeProfileRow;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
}) {
  const [queue, setQueue] = useState<ExchangeProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [matchedWith, setMatchedWith] = useState<ExchangeProfileRow | null>(null);
  const [reportTarget, setReportTarget] = useState<ExchangeProfileRow | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const { data: swipes, error: swipesError } = await supabase
      .from("exchange_swipes" as any)
      .select("target_id")
      .eq("swiper_id", myProfile.user_id);
    if (swipesError) {
      // Non-fatal: the queue below just won't filter out already-swiped
      // profiles this load. Still worth knowing about if it keeps happening.
      console.error("exchange_swipes select failed:", swipesError.message);
    }
    const swipedIds = ((swipes as unknown as { target_id: string }[]) ?? []).map((s) => s.target_id);

    let query = supabase
      .from("exchange_profiles" as any)
      .select("*")
      .eq("is_visible", true)
      .neq("user_id", myProfile.user_id)
      .limit(25);

    if (swipedIds.length > 0) {
      query = query.not("user_id", "in", `(${swipedIds.join(",")})`);
    }

    // Prefer people whose languages actually pair with mine, when we know them.
    const wantsFrom = myProfile.learning_languages ?? [];
    const offers = myProfile.native_languages ?? [];
    if (wantsFrom.length > 0 || offers.length > 0) {
      const parts: string[] = [];
      if (wantsFrom.length) parts.push(`native_languages.ov.{${wantsFrom.join(",")}}`);
      if (offers.length) parts.push(`learning_languages.ov.{${offers.join(",")}}`);
      query = query.or(parts.join(","));
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: tr("Couldn't load profiles", "تعذّر تحميل الملفات"), description: error.message, variant: "destructive" });
      setQueue([]);
    } else {
      let rows = (data as unknown as ExchangeProfileRow[]) ?? [];
      // Mutual gender preference (Re's request, 4 Nov 2026): show people
      // whose preference includes me and who match what I'm looking for.
      // Done client-side rather than as a 2nd server-side .or() (Postgrest
      // only supports one `or` filter per query reliably) -- a profile that
      // hasn't set gender/looking_for_gender yet (older data) is never
      // hidden by this.
      rows = rows.filter((p) => {
        const theyWantMe =
          !p.looking_for_gender || p.looking_for_gender === "any" || !myProfile.gender || p.looking_for_gender === myProfile.gender;
        const iWantThem =
          !myProfile.looking_for_gender || myProfile.looking_for_gender === "any" || !p.gender || myProfile.looking_for_gender === p.gender;
        return theyWantMe && iWantThem;
      });
      // Shuffle so the same top rows don't always lead.
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }
      setQueue(rows);
    }
    setLoading(false);
  }, [myProfile.user_id, myProfile.learning_languages, myProfile.native_languages, myProfile.gender, myProfile.looking_for_gender, tr]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = queue[0];

  const act = async (action: "like" | "pass") => {
    if (!current || acting) return;
    setActing(true);
    const { error } = await supabase.from("exchange_swipes" as any).insert({
      swiper_id: myProfile.user_id,
      target_id: current.user_id,
      action,
    });
    if (error && !error.message.includes("duplicate key")) {
      toast({ title: tr("Something went wrong", "حدث خطأ"), description: error.message, variant: "destructive" });
      setActing(false);
      return;
    }

    if (action === "like") {
      const { data: matchRows, error: matchError } = await supabase
        .from("exchange_matches" as any)
        .select("*")
        .or(`user_a.eq.${current.user_id},user_b.eq.${current.user_id}`);
      if (matchError) {
        // Non-fatal: worst case the match celebration screen doesn't show
        // this time, but the match row itself (written elsewhere) is unaffected.
        console.error("exchange_matches select failed:", matchError.message);
      }
      const isMatch = ((matchRows as unknown as { user_a: string; user_b: string }[]) ?? []).some(
        (m) => m.user_a === myProfile.user_id || m.user_b === myProfile.user_id,
      );
      if (isMatch) setMatchedWith(current);
    }

    setQueue((q) => q.slice(1));
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            {tr("No new profiles right now — check back soon.", "لا توجد ملفات جديدة الآن — عودي لاحقًا.")}
          </p>
          <Button variant="outline" className="mt-4" onClick={loadQueue}>
            {tr("Refresh", "تحديث")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <SwipeCard
        profile={current}
        isAr={isAr}
        tr={tr}
        disabled={acting}
        onLike={() => act("like")}
        onPass={() => act("pass")}
        onReport={() => setReportTarget(current)}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {tr(
          "Keep it safe: never send money, and meet in public first.",
          "حافظي على سلامتك: لا ترسلي أموالًا أبدًا، والتقي في مكان عام أولًا.",
        )}
      </p>

      <Dialog open={!!matchedWith} onOpenChange={(open) => !open && setMatchedWith(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">{tr("It's a match! 🎉", "لقد تطابقتما! 🎉")}</DialogTitle>
            <DialogDescription>
              {tr(
                `You and ${matchedWith?.display_name} both liked each other. Find them in Matches.`,
                `أنتِ و${matchedWith?.display_name} أعجب كل منكما بالآخر. يمكنك إيجادهما في التطابقات.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setMatchedWith(null)}>{tr("Keep swiping", "تابعي التصفّح")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportDialog
        target={reportTarget}
        isAr={isAr}
        tr={tr}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}

function SwipeCard({
  profile,
  isAr,
  tr,
  disabled,
  onLike,
  onPass,
  onReport,
}: {
  profile: ExchangeProfileRow;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
  disabled: boolean;
  onLike: () => void;
  onPass: () => void;
  onReport: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; dragging: boolean } | null>(null);
  const [dragX, setDragX] = useState(0);

  const resetDrag = () => {
    setDragX(0);
    dragState.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragState.current = { startX: e.clientX, dragging: true };
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current?.dragging) return;
    setDragX(e.clientX - dragState.current.startX);
  };

  const onPointerUp = () => {
    if (!dragState.current?.dragging) return;
    const threshold = 110;
    if (dragX > threshold) onLike();
    else if (dragX < -threshold) onPass();
    resetDrag();
  };

  const rotation = Math.max(-12, Math.min(12, dragX / 12));
  const likeOpacity = Math.min(1, Math.max(0, dragX / 100));
  const passOpacity = Math.min(1, Math.max(0, -dragX / 100));

  return (
    <div>
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={resetDrag}
        style={{ transform: `translateX(${dragX}px) rotate(${rotation}deg)`, touchAction: "pan-y" }}
        className="relative cursor-grab select-none active:cursor-grabbing transition-transform"
      >
        <Card className="overflow-hidden">
          <div className="relative h-72 w-full bg-muted">
            <ExchangeAvatar avatarUrl={profile.avatar_url} name={profile.display_name} className="flex h-full w-full items-center justify-center" />
            <div
              className="absolute top-5 rounded-xl border-4 border-green-500 px-3 py-1 text-xl font-black text-green-500 rotate-[-12deg]"
              style={{ insetInlineStart: 16, opacity: likeOpacity }}
            >
              {tr("LIKE", "إعجاب")}
            </div>
            <div
              className="absolute top-5 rounded-xl border-4 border-red-500 px-3 py-1 text-xl font-black text-red-500 rotate-[12deg]"
              style={{ insetInlineEnd: 16, opacity: passOpacity }}
            >
              {tr("PASS", "تخطّي")}
            </div>
          </div>
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">
                {profile.display_name}
                {profile.age ? <span className="ms-2 font-normal text-muted-foreground">{profile.age}</span> : null}
                {profile.gender ? (
                  <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">
                    · {genderLabel(profile.gender, isAr ? "ar" : "en")}
                  </span>
                ) : null}
              </h2>
              <button
                type="button"
                onClick={onReport}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={tr("Report", "إبلاغ")}
              >
                <ShieldAlert className="h-5 w-5" />
              </button>
            </div>

            {(profile.native_languages?.length || profile.learning_languages?.length) ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.native_languages?.length ? (
                  <>
                    {tr("Speaks", "تتحدث")}{" "}
                    {profile.native_languages.map((c) => languageLabel(c, isAr ? "ar" : "en")).join(", ")}
                  </>
                ) : null}
                {profile.native_languages?.length && profile.learning_languages?.length ? " · " : ""}
                {profile.learning_languages?.length ? (
                  <>
                    {tr("Learning", "تتعلم")}{" "}
                    {profile.learning_languages.map((c) => languageLabel(c, isAr ? "ar" : "en")).join(", ")}
                  </>
                ) : null}
              </p>
            ) : null}

            {profile.bio ? <p className="mt-3 text-sm">{profile.bio}</p> : null}

            {profile.goals?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.goals.map((k) => (
                  <Badge key={k} className="bg-[#FFFF00] text-foreground hover:bg-[#FFFF00]">
                    {goalLabel(k, isAr ? "ar" : "en")}
                  </Badge>
                ))}
              </div>
            ) : null}

            {profile.interests?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((k) => (
                  <Badge key={k} variant="secondary">
                    {interestLabel(k, isAr ? "ar" : "en")}
                  </Badge>
                ))}
              </div>
            ) : null}

            {profile.availability_slots?.length ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                {profile.availability_slots
                  .map((s) => formatAvailabilitySlot(s, isAr ? "ar" : "en"))
                  .join(isAr ? "، " : ", ")}
                {profile.timezone ? ` (${shortTimezoneLabel(profile.timezone)})` : ""}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 flex justify-center gap-6">
        <Button
          size="icon"
          variant="outline"
          className="h-14 w-14 rounded-full border-red-300 text-red-500 hover:bg-red-50"
          onClick={onPass}
          disabled={disabled}
          aria-label={tr("Pass", "تخطّي")}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-green-500 text-white hover:bg-green-600"
          onClick={onLike}
          disabled={disabled}
          aria-label={tr("Like", "إعجاب")}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------- Matches ---------------------------------- */

interface MatchEntry {
  matchId: string;
  profile: ExchangeProfileRow;
}

function MatchesList({ isAr, tr, userId }: { isAr: boolean; tr: (en: string, ar: string) => string; userId: string }) {
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<ExchangeProfileRow | null>(null);
  const [chatMatch, setChatMatch] = useState<MatchEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: matchRows, error } = await supabase
      .from("exchange_matches" as any)
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: tr("Couldn't load matches", "تعذّر تحميل التطابقات"), description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows = (matchRows as unknown as { id: string; user_a: string; user_b: string }[]) ?? [];
    const otherIdByMatch = new Map(rows.map((m) => [m.id, m.user_a === userId ? m.user_b : m.user_a]));
    const otherIds = [...otherIdByMatch.values()];

    if (otherIds.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("exchange_profiles" as any)
      .select("*")
      .in("user_id", otherIds);
    if (profilesError) {
      // This is exactly the "empty list reads as no data yet" trap: a real
      // query failure here would otherwise render as "No matches yet".
      toast({ title: tr("Couldn't load matches", "تعذّر تحميل التطابقات"), description: profilesError.message, variant: "destructive" });
    }
    const profiles = (profilesData as unknown as ExchangeProfileRow[]) ?? [];
    const byUserId = new Map(profiles.map((p) => [p.user_id, p]));
    const entries: MatchEntry[] = [...otherIdByMatch.entries()]
      .map(([matchId, otherId]) => {
        const profile = byUserId.get(otherId);
        return profile ? { matchId, profile } : null;
      })
      .filter((e): e is MatchEntry => e !== null);
    setMatches(entries);
    setLoading(false);
  }, [userId, tr]);

  useEffect(() => {
    load();
  }, [load]);

  // Mark match notifications as read the moment this tab is opened.
  useEffect(() => {
    supabase
      .from("exchange_notifications" as any)
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .then(({ error }) => {
        if (error) console.error("exchange_notifications mark-read failed:", error.message);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {tr("No matches yet — keep swiping in Discover.", "لا توجد تطابقات بعد — تابعي التصفّح في اكتشاف.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map(({ matchId, profile: m }) => (
        <Card key={matchId}>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
              <ExchangeAvatar avatarUrl={m.avatar_url} name={m.display_name} className="flex h-full w-full items-center justify-center" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold">
                  {m.display_name}
                  {m.age ? <span className="ms-1.5 font-normal text-muted-foreground">{m.age}</span> : null}
                </h3>
                <button
                  type="button"
                  onClick={() => setReportTarget(m)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={tr("Report", "إبلاغ")}
                >
                  <ShieldAlert className="h-4 w-4" />
                </button>
              </div>
              {m.bio ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.bio}</p> : null}

              {m.gender ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {genderLabel(m.gender, isAr ? "ar" : "en")}
                  {" · "}
                  {tr("Looking for", "يبحث عن")}: {lookingForGenderLabel(m.looking_for_gender || "any", isAr ? "ar" : "en")}
                </p>
              ) : null}

              {m.goals?.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.goals.map((k) => (
                    <Badge key={k} className="bg-[#FFFF00] text-foreground hover:bg-[#FFFF00] text-xs">
                      {goalLabel(k, isAr ? "ar" : "en")}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {m.availability_slots?.length ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {m.availability_slots
                    .map((s) => formatAvailabilitySlot(s, isAr ? "ar" : "en"))
                    .join(isAr ? "، " : ", ")}
                  {m.timezone ? ` (${shortTimezoneLabel(m.timezone)})` : ""}
                </p>
              ) : null}

              <Button size="sm" className="mt-2" onClick={() => setChatMatch({ matchId, profile: m })}>
                <MessageCircle className="me-1.5 h-4 w-4" />
                {tr("Chat", "محادثة")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <ReportDialog target={reportTarget} isAr={isAr} tr={tr} onClose={() => setReportTarget(null)} />
      {chatMatch && (
        <ChatDialog
          matchId={chatMatch.matchId}
          partner={chatMatch.profile}
          userId={userId}
          isAr={isAr}
          tr={tr}
          onClose={() => setChatMatch(null)}
        />
      )}
    </div>
  );
}

/* ---------------------------------- Chat ---------------------------------- */

interface ExchangeMessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/**
 * In-app chat for a confirmed match (Re's request, 4 Nov 2026): talk through
 * the Klovers account itself instead of exchanging WhatsApp/email. Backed by
 * exchange_messages (RLS: only the two matched users can read/write a given
 * match's rows) and Supabase Realtime for live delivery — see
 * supabase/migrations/20261104040000_exchange_chat.sql.
 */
function ChatDialog({
  matchId,
  partner,
  userId,
  isAr,
  tr,
  onClose,
}: {
  matchId: string;
  partner: ExchangeProfileRow;
  userId: string;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ExchangeMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("exchange_messages" as any)
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast({ title: tr("Couldn't load chat", "تعذّر تحميل المحادثة"), description: error.message, variant: "destructive" });
        }
        setMessages((data as unknown as ExchangeMessageRow[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`exchange_messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "exchange_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as unknown as ExchangeMessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId, tr]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const { error } = await supabase.from("exchange_messages" as any).insert({
      match_id: matchId,
      sender_id: userId,
      body,
    });
    setSending(false);
    if (error) {
      toast({ title: tr("Message not sent", "لم تُرسَل الرسالة"), description: error.message, variant: "destructive" });
      return;
    }
    setDraft("");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <ExchangeAvatar avatarUrl={partner.avatar_url} name={partner.display_name} className="flex h-full w-full items-center justify-center" />
            </div>
            {partner.display_name}
          </DialogTitle>
          <DialogDescription>
            {tr(
              "Keep it here on Klovers — meet in public first, and never send money or passwords.",
              "خلّي التواصل هنا جوه كلوفرز — التقيا في مكان عام أولًا، ولا ترسلا أبدًا أموالًا أو كلمات مرور.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto rounded-md border p-3" style={{ minHeight: 240 }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tr("Say hello 👋", "ابدئي بالسلام 👋")}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-[#FFFF00] text-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={tr("Type a message…", "اكتبي رسالة…")}
            maxLength={2000}
            disabled={sending}
          />
          <Button onClick={send} disabled={sending || !draft.trim()} size="icon" aria-label={tr("Send", "إرسال")}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- Profile editor ---------------------------------- */

function ProfileEditor({
  userId,
  initial,
  isAr,
  tr,
  onSaved,
}: {
  userId: string;
  initial: ExchangeProfileRow | null;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
  onSaved: (row: ExchangeProfileRow) => void;
}) {
  const [draft, setDraft] = useState<ExchangeProfileRow>(
    initial ?? { ...emptyDraft(), user_id: userId, timezone: getUserTimezone() },
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setDraft(initial);
  }, [initial]);

  // "Monday:evening" -> { day: "Monday", bucket: "evening" }. Missing slot = both blank.
  const slotAt = (index: number): { day: string; bucket: string } => {
    const [day = "", bucket = ""] = (draft.availability_slots[index] ?? "").split(":");
    return { day, bucket };
  };

  const setSlotPart = (index: number, part: "day" | "bucket", value: string) => {
    setDraft((d) => {
      const slots = [...d.availability_slots];
      while (slots.length <= index) slots.push("");
      const [curDay = "", curBucket = ""] = slots[index].split(":");
      const next = part === "day" ? `${value}:${curBucket}` : `${curDay}:${value}`;
      slots[index] = next === ":" ? "" : next;
      return { ...d, availability_slots: slots };
    });
  };

  const toggleFromList = (field: "native_languages" | "learning_languages" | "interests" | "goals", value: string, max?: number) => {
    setDraft((d) => {
      const list = d[field];
      const has = list.includes(value);
      if (has) return { ...d, [field]: list.filter((v) => v !== value) };
      if (max && list.length >= max) return d;
      return { ...d, [field]: [...list, value] };
    });
  };

  const validSlots = draft.availability_slots.filter((s) => {
    const [day, bucket] = s.split(":");
    return day && bucket;
  });

  const canSave =
    draft.display_name.trim().length >= 2 &&
    draft.age != null && draft.age >= EXCHANGE_MIN_AGE && draft.age <= EXCHANGE_MAX_AGE &&
    !!draft.gender &&
    draft.native_languages.length > 0 &&
    draft.learning_languages.length > 0 &&
    draft.goals.length > 0 &&
    validSlots.length === EXCHANGE_AVAILABILITY_COUNT &&
    !!draft.avatar_url;

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: tr("Please complete the required fields", "يرجى إكمال الحقول المطلوبة"),
        description: tr(
          `Name, an avatar, your gender, at least one language you speak, one you're learning, your age (${EXCHANGE_MIN_AGE}+), at least one goal, and ${EXCHANGE_AVAILABILITY_COUNT} free times.`,
          `الاسم، صورة رمزية، جنسك، لغة واحدة على الأقل تتحدثينها، لغة تتعلمينها، عمرك (${EXCHANGE_MIN_AGE}+)، هدف واحد على الأقل، و${EXCHANGE_AVAILABILITY_COUNT} وقتَي فراغ.`,
        ),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      display_name: draft.display_name.trim(),
      avatar_url: draft.avatar_url,
      bio: draft.bio?.trim() || null,
      age: draft.age,
      gender: draft.gender,
      looking_for_gender: draft.looking_for_gender || "any",
      native_languages: draft.native_languages,
      learning_languages: draft.learning_languages,
      interests: draft.interests,
      goals: draft.goals,
      availability_slots: validSlots,
      timezone: draft.timezone ?? getUserTimezone(),
      contact_type: draft.contact_type,
      contact_value: draft.contact_value?.trim() || null,
      is_visible: draft.is_visible,
    };
    const { data, error } = await supabase
      .from("exchange_profiles" as any)
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: tr("Couldn't save", "تعذّر الحفظ"), description: error.message, variant: "destructive" });
      return;
    }
    onSaved(data as unknown as ExchangeProfileRow);
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#FFFF00]/40 bg-[#FFFF00]/5">
        <CardContent className="p-4 text-sm">
          <p className="font-semibold">{tr("Keep it safe", "حافظي على سلامتك")}</p>
          <p className="mt-1 text-muted-foreground">
            {tr(
              `You must be ${EXCHANGE_MIN_AGE} or older. Never send money or passwords. Meet in a public place first. Report anyone who makes you uncomfortable.`,
              `يجب أن يكون عمرك ${EXCHANGE_MIN_AGE} عامًا أو أكثر. لا ترسلي أبدًا أموالًا أو كلمات مرور. التقي في مكان عام أولًا. أبلغي عن أي شخص يجعلك تشعرين بعدم الارتياح.`,
            )}
          </p>
        </CardContent>
      </Card>

      <div>
        <Label>{tr("Avatar", "الصورة الرمزية")} *</Label>
        <p className="mb-2 text-sm text-muted-foreground">
          {tr(
            "No photo uploads here — pick a character avatar, so Language Exchange stays about learning, not looks.",
            "لا يوجد رفع صور هنا — اختاري شخصية رمزية، حتى يبقى تبادل اللغة عن التعلّم لا عن الشكل.",
          )}
        </p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
          {EXCHANGE_AVATAR_STYLES.map((style) => {
            const value = `${AVATAR_ICON_PREFIX}${style.key}`;
            const selected = draft.avatar_url === value;
            return (
              <button
                key={style.key}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, avatar_url: value }))}
                className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-all ${
                  selected ? "ring-2 ring-primary ring-offset-2" : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: style.bg }}
                aria-label={style.key}
                aria-pressed={selected}
              >
                <AvatarArt avatarKey={style.key} className="h-full w-full" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{tr("Your gender", "جنسك")} *</Label>
          <div className="mt-1 flex gap-2">
            {EXCHANGE_GENDERS.map((g) => (
              <Button
                key={g.key}
                type="button"
                variant={draft.gender === g.key ? "default" : "outline"}
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, gender: g.key }))}
              >
                {isAr ? g.ar : g.en}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label>{tr("Who do you want to practice with?", "مع مين تحبين تمارسي اللغة؟")}</Label>
          <Select
            value={draft.looking_for_gender || "any"}
            onValueChange={(v) => setDraft((d) => ({ ...d, looking_for_gender: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGE_LOOKING_FOR_GENDERS.map((g) => (
                <SelectItem key={g.key} value={g.key}>
                  {isAr ? g.ar : g.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="display_name">{tr("Display name", "الاسم الظاهر")} *</Label>
          <Input
            id="display_name"
            value={draft.display_name}
            onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
            maxLength={40}
          />
        </div>
        <div>
          <Label htmlFor="age">{tr("Age", "العمر")} *</Label>
          <Input
            id="age"
            type="number"
            min={EXCHANGE_MIN_AGE}
            max={EXCHANGE_MAX_AGE}
            value={draft.age ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value ? Number(e.target.value) : null }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">{tr("About you", "عنكِ")}</Label>
        <Textarea
          id="bio"
          value={draft.bio ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
          maxLength={300}
          rows={3}
          placeholder={tr("What are you hoping to practice, and how?", "ماذا تأملين أن تمارسي، وكيف؟")}
        />
      </div>

      <div>
        <Label>{tr("Languages you speak", "اللغات التي تتحدثينها")} *</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXCHANGE_LANGUAGES.map((l) => (
            <Badge
              key={l.code}
              variant={draft.native_languages.includes(l.code) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleFromList("native_languages", l.code)}
            >
              {isAr ? l.ar : l.en}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>{tr("Languages you're learning", "اللغات التي تتعلمينها")} *</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXCHANGE_LANGUAGES.map((l) => (
            <Badge
              key={l.code}
              variant={draft.learning_languages.includes(l.code) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleFromList("learning_languages", l.code)}
            >
              {isAr ? l.ar : l.en}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>{tr("Interests", "الاهتمامات")} ({tr("up to 8", "حتى 8")})</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXCHANGE_INTERESTS.map((i) => (
            <Badge
              key={i.key}
              variant={draft.interests.includes(i.key) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleFromList("interests", i.key, 8)}
            >
              {isAr ? i.ar : i.en}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>{tr("What are you looking for?", "عمّاذا تبحث/ين؟")} *</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {tr(
            `Pick up to ${EXCHANGE_MAX_GOALS} — a study partner, a culture friend, TOPIK prep, or whatever fits.`,
            `اختاري حتى ${EXCHANGE_MAX_GOALS} — شريك دراسة، صديق ثقافي، تحضير TOPIK، أو ما يناسبك.`,
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXCHANGE_GOALS.map((g) => (
            <Badge
              key={g.key}
              variant={draft.goals.includes(g.key) ? "default" : "outline"}
              className={draft.goals.includes(g.key) ? "cursor-pointer select-none bg-[#FFFF00] text-foreground hover:bg-[#FFFF00]" : "cursor-pointer select-none"}
              onClick={() => toggleFromList("goals", g.key, EXCHANGE_MAX_GOALS)}
            >
              {isAr ? g.ar : g.en}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>{tr("When are you free?", "متى تكون/ين متفرغ/ة؟")} *</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {tr(
            `Pick ${EXCHANGE_AVAILABILITY_COUNT} times — this is what your match will see.`,
            `اختاري ${EXCHANGE_AVAILABILITY_COUNT} وقتين — هذا ما سيراه تطابقك.`,
          )}
        </p>
        <div className="mt-2 space-y-2">
          {Array.from({ length: EXCHANGE_AVAILABILITY_COUNT }).map((_, idx) => {
            const { day, bucket } = slotAt(idx);
            return (
              <div key={idx} className="grid grid-cols-2 gap-2">
                <Select value={day} onValueChange={(v) => setSlotPart(idx, "day", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr(`Day ${idx + 1}`, `اليوم ${idx + 1}`)} />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGE_DAYS.map((d) => (
                      <SelectItem key={d.en} value={d.en}>
                        {isAr ? d.ar : d.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={bucket} onValueChange={(v) => setSlotPart(idx, "bucket", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr("Time of day", "وقت اليوم")} />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGE_TIME_BUCKETS.map((b) => (
                      <SelectItem key={b.key} value={b.key}>
                        {isAr ? b.ar : b.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {tr("Shown in your own timezone", "يُعرض بتوقيتك المحلي")}
          {draft.timezone ? ` (${shortTimezoneLabel(draft.timezone)})` : ""}.
        </p>
      </div>

      <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        {tr(
          "No WhatsApp or email here on purpose — once you match, you talk through the Klovers chat.",
          "من غير واتساب ولا إيميل هنا عمدًا — بعد ما تعملي ماتش، التواصل بيبقى من خلال شات كلوفرز.",
        )}
      </p>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">{tr("Visible to others", "ظاهر للآخرين")}</p>
          <p className="text-sm text-muted-foreground">
            {tr("Turn off to pause being shown in Discover.", "أوقفيه لتجميد ظهورك في اكتشاف.")}
          </p>
        </div>
        <Switch
          checked={draft.is_visible}
          onCheckedChange={(v) => setDraft((d) => ({ ...d, is_visible: v }))}
        />
      </div>

      <Button className="w-full" size="lg" onClick={handleSave} disabled={saving || !canSave}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("Save profile", "حفظ الملف")}
      </Button>
    </div>
  );
}

/* ---------------------------------- Report ---------------------------------- */

function ReportDialog({
  target,
  isAr,
  tr,
  onClose,
}: {
  target: ExchangeProfileRow | null;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockToo, setBlockToo] = useState(true);

  useEffect(() => {
    if (target) { setReason(""); setDetails(""); setBlockToo(true); }
  }, [target]);

  const submit = async () => {
    if (!target || !user || !reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("exchange_reports" as any).insert({
      reporter_id: user.id,
      reported_id: target.user_id,
      reason,
      details: details.trim() || null,
    });
    if (error) {
      toast({ title: tr("Couldn't send report", "تعذّر إرسال البلاغ"), description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    let blockFailed = false;
    if (blockToo) {
      const { error: blockErr } = await supabase.from("exchange_blocks" as any).insert({ blocker_id: user.id, blocked_id: target.user_id });
      blockFailed = Boolean(blockErr);
    }
    setSubmitting(false);
    toast({ title: tr("Report sent", "تم إرسال البلاغ"), description: tr("Our team will review it.", "سيقوم فريقنا بمراجعته.") });
    if (blockFailed) {
      toast({ title: tr("Couldn't block this user", "تعذّر حظر هذا المستخدم"), description: tr("The report was sent, but blocking failed — try blocking them separately.", "تم إرسال البلاغ، لكن الحظر لم ينجح — جرّب حظره بشكل منفصل."), variant: "destructive" });
    }
    onClose();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr("Report", "الإبلاغ عن")} {target?.display_name}</DialogTitle>
          <DialogDescription>
            {tr("Tell us what happened. This is reviewed by our team, not shared with the other person.", "أخبرينا بما حدث. سيراجعه فريقنا ولن يُشارك مع الشخص الآخر.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder={tr("Reason", "السبب")} />
            </SelectTrigger>
            <SelectContent>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {isAr ? r.ar : r.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={tr("Optional details", "تفاصيل اختيارية")}
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blockToo} onChange={(e) => setBlockToo(e.target.checked)} />
            {tr("Also block this person", "حظر هذا الشخص أيضًا")}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Cancel", "إلغاء")}</Button>
          <Button variant="destructive" disabled={!reason || submitting} onClick={submit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("Submit report", "إرسال البلاغ")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
