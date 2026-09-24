import { useMemo, useState } from "react";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";
import { isClubyAwake } from "@/lib/clubyAwake";

/**
 * The /games leaderboard, in the Klovers palette (yellow #FFFF00, neon green
 * #39FF14, charcoal, ivory) - no off-brand gold / silver / bronze pastels.
 *
 *  - A PODIUM for the top three: 2nd | 1st | 3rd. 1st stands on a Klovers-
 *    yellow step with the crown, 2nd on charcoal, 3rd on ivory; each step
 *    carries its place number big.
 *  - A LIST for 4-10: rank, avatar, name, a green bar measured against the
 *    leader's XP (green means progress), and the XP. The signed-in student's
 *    row is marked "You".
 *  - If the student is outside the top ten, one extra line gives their real
 *    rank (get_my_xp_rank via useLeaderboard) - never a made-up position.
 *  - Two tabs, All time and This week. Both boards come from the SECURITY
 *    DEFINER RPCs in useLeaderboard; the weekly window is server-side
 *    Africa/Cairo.
 *
 * Cluby follows the egg (story canon): the 3D Cluby with his star appears
 * only once the dashboard has marked him awake (lib/clubyAwake.ts); before
 * that, and for guests, the clover egg stands in his place.
 *
 * Guests get an invitation, not a board: the RPCs are granted to
 * `authenticated` only, and no invented players are ever shown.
 *
 * Theme: surfaces and type use bg-card / text-foreground / border-border so
 * the board follows dark mode; the ivory podium ground keeps a dark: variant.
 * The yellow and charcoal steps and chips read the same in both themes.
 */

interface Props {
  isLoggedIn: boolean;
  isAr: boolean;
  loading: boolean;
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  myRank: number | null;
}

const CLUBY_STAR = "/assets/cluby/cluby-star.webp";
const EGG = "/assets/story/egg-0.webp";

/** Podium styling per place, all from the brand palette. */
const PLACE = {
  1: {
    ring: "ring-klovers-yellow",
    chip: "bg-klovers-yellow text-charcoal",
    step: "h-28 bg-klovers-yellow text-charcoal",
    avatar: "h-20 w-20 text-3xl",
  },
  2: {
    ring: "ring-charcoal dark:ring-ivory/70",
    chip: "bg-charcoal text-klovers-yellow dark:ring-1 dark:ring-white/20",
    step: "h-20 bg-charcoal text-klovers-yellow dark:ring-1 dark:ring-white/20",
    avatar: "h-14 w-14 text-xl",
  },
  3: {
    ring: "ring-charcoal/25 dark:ring-ivory/30",
    chip: "border border-charcoal/20 bg-[#FFF9EC] text-charcoal",
    step: "h-14 border-2 border-b-0 border-charcoal/15 bg-[#FFF9EC] text-charcoal",
    avatar: "h-14 w-14 text-xl",
  },
} as const;

const initialOf = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

const Avatar = ({ p, className }: { p: LeaderboardEntry; className?: string }) =>
  p.avatar_url ? (
    <img src={p.avatar_url} alt="" aria-hidden="true" loading="lazy" className={cn("rounded-full bg-[#FFF9EC] object-cover", className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn("grid place-items-center rounded-full bg-[#FFF9EC] font-display font-extrabold text-charcoal", className)}
    >
      {initialOf(p.name)}
    </span>
  );

const GamesLeaderboard = ({ isLoggedIn, isAr, loading, allTime, weekly, myRank }: Props) => {
  const [tab, setTab] = useState<"all" | "week">("all");
  const clubyAwake = useMemo(() => isLoggedIn && isClubyAwake(), [isLoggedIn]);
  const board = (tab === "all" ? allTime : weekly).slice(0, 10);
  const top = board.slice(0, 3);
  const rest = board.slice(3);
  const leaderXp = Math.max(1, board[0]?.value ?? 1);
  const meInBoard = board.some((p) => p.isCurrentUser);
  const you = isAr ? "إنت" : "You";

  // Podium order: 2nd, 1st, 3rd - only the places that exist.
  const podium = [top[1], top[0], top[2]]
    .map((p, i) => (p ? { p, place: ([2, 1, 3] as const)[i] } : null))
    .filter((x): x is { p: LeaderboardEntry; place: 1 | 2 | 3 } => x !== null);

  const Mascot = ({ className }: { className?: string }) =>
    clubyAwake ? (
      <img src={CLUBY_STAR} alt="" aria-hidden="true" width={333} height={440} loading="lazy" className={cn("w-auto object-contain", className)} />
    ) : (
      <img src={EGG} alt="" aria-hidden="true" width={512} height={512} loading="lazy" className={cn("w-auto object-contain", className)} />
    );

  return (
    <section className="border-t border-border bg-[#FFF9EC] px-4 py-12 dark:bg-muted/20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-foreground md:text-3xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-klovers-yellow">
                <Trophy className="h-5 w-5 text-charcoal" aria-hidden="true" />
              </span>
              {isLoggedIn ? (isAr ? "أفضل اللاعبين" : "Top Players") : (isAr ? "الترتيب" : "Leaderboard")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "مرتّبين حسب نقط الـ XP من الألعاب والدروس" : "Ranked by XP from games and lessons"}
            </p>
          </div>
          {isLoggedIn && (
            <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist">
              {([
                ["all", isAr ? "كل الوقت" : "All time"],
                ["week", isAr ? "الأسبوع ده" : "This week"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-xs font-bold transition-colors",
                    tab === key ? "bg-charcoal text-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_40px_-30px_rgba(46,46,46,0.6)]">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <Mascot className="h-24" />
              <p className="max-w-xs text-sm text-muted-foreground">
                {isAr
                  ? "سجّل عشان تبدأ تجمع نقط وتدخل الترتيب."
                  : "Sign up to start earning XP and take your place on the leaderboard."}
              </p>
              <a
                href="/signup"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-bold text-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                {isAr ? "سجّل لرؤية ترتيبك" : "Sign up to see your rank"}
              </a>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{isAr ? "جارٍ تحميل الترتيب..." : "Loading leaderboard…"}</div>
          ) : board.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Mascot className="h-20" />
              <p className="text-sm text-muted-foreground">
                {tab === "week"
                  ? (isAr ? "لسه محدش لعب الأسبوع ده. كن الأول!" : "No one has played this week yet. Be the first!")
                  : (isAr ? "لا توجد بيانات بعد. العب لكسب XP!" : "No data yet. Play games to earn XP!")}
              </p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="relative bg-[#FFF9EC] px-4 pt-10 dark:bg-klovers-yellow/5">
                <Mascot className="absolute end-4 top-4 hidden h-20 sm:block" />
                <ol className="mx-auto grid max-w-md grid-cols-3 items-end gap-2 sm:gap-3">
                  {podium.map(({ p, place }) => {
                    const m = PLACE[place];
                    return (
                      <li key={p.user_id} className="flex min-w-0 flex-col items-center text-center">
                        {place === 1 && (
                          <Crown className="mb-1 h-7 w-7 fill-klovers-yellow text-charcoal" strokeWidth={1.8} aria-hidden="true" />
                        )}
                        <Avatar
                          p={p}
                          className={cn(
                            "ring-4 ring-offset-2 ring-offset-[#FFF9EC] dark:ring-offset-card",
                            m.ring,
                            m.avatar,
                          )}
                        />
                        <p className="mt-2 w-full truncate text-sm font-bold text-foreground">
                          {p.name}
                        </p>
                        {p.isCurrentUser && (
                          <span className="mt-0.5 rounded-full bg-charcoal px-2 text-[10px] font-extrabold text-klovers-yellow">{you}</span>
                        )}
                        <span className={cn("mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums", m.chip)}>
                          {p.value.toLocaleString()} XP
                        </span>
                        <div
                          className={cn(
                            "mt-3 grid w-full place-items-center rounded-t-2xl font-display text-3xl font-extrabold",
                            m.step,
                          )}
                        >
                          {place}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* 4-10 */}
              {rest.length > 0 && (
                <ol className="divide-y divide-border border-t-2 border-charcoal dark:border-border">
                  {rest.map((p, i) => (
                    <li
                      key={p.user_id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 sm:px-5",
                        p.isCurrentUser && "bg-klovers-yellow/25",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold tabular-nums",
                          p.isCurrentUser ? "bg-charcoal text-klovers-yellow" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i + 4}
                      </span>
                      <Avatar p={p} className="h-9 w-9 border border-border text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                          {p.name}
                          {p.isCurrentUser && (
                            <span className="rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-extrabold text-klovers-yellow">{you}</span>
                          )}
                        </p>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-klovers-green" style={{ width: `${Math.max(4, (p.value / leaderXp) * 100)}%` }} />
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums text-foreground">
                        {p.value.toLocaleString()} <span className="text-[11px] font-semibold text-muted-foreground">XP</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Outside the top ten: the real rank, from the server */}
              {tab === "all" && !meInBoard && myRank !== null && (
                <p className="border-t border-border bg-klovers-yellow/25 px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {isAr ? `ترتيبك الحالي: #${myRank} — كمّل لعب عشان تطلع فوق!` : `Your rank: #${myRank} — keep playing to climb!`}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default GamesLeaderboard;
