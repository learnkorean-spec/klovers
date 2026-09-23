import { useState } from "react";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

/**
 * The /games leaderboard, in the Game Worlds style (23 Sep 2026).
 *
 *  - A PODIUM for the top three: 2nd | 1st | 3rd, gold / silver / bronze,
 *    the leader raised and crowned.
 *  - A LIST for 4-10: rank, avatar, name, a bar measured against the leader's
 *    XP, and the XP itself. The signed-in student's row is marked "You".
 *  - If the student is outside the top ten, one extra line gives their real
 *    rank (get_my_xp_rank via useLeaderboard) - never a made-up position.
 *  - Two tabs, All time and This week. Both boards already come from the
 *    SECURITY DEFINER RPCs in useLeaderboard; the weekly window is computed
 *    server-side in Africa/Cairo.
 *
 * Guests get an invitation, not a board: the RPCs are granted to
 * `authenticated` only, and no invented players are ever shown (see the note
 * on this section in GamesPage).
 */

interface Props {
  isLoggedIn: boolean;
  isAr: boolean;
  loading: boolean;
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  myRank: number | null;
}

const ASSET = "/assets/characters";

const MEDAL = [
  { ring: "ring-[#F6C343]", bg: "bg-[#FFF3C4]", chip: "bg-[#F6C343] text-charcoal", step: "h-24 bg-[#FFE58A]" },
  { ring: "ring-[#C9CED6]", bg: "bg-[#F1F3F6]", chip: "bg-[#C9CED6] text-charcoal", step: "h-16 bg-[#E4E8EE]" },
  { ring: "ring-[#D9955B]", bg: "bg-[#FBE7D6]", chip: "bg-[#D9955B] text-white", step: "h-12 bg-[#F3D2B6]" },
];

const initialOf = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

/** Soft brand-adjacent tints, picked from the name so a player keeps their colour. */
const TINTS = ["bg-[#FFF3C4]", "bg-[#DDF3E7]", "bg-[#E6E1FB]", "bg-[#FDE2E7]", "bg-[#DCEFFA]", "bg-[#FBE7D6]"];
const tintOf = (name: string) => TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length];

const Avatar = ({ p, className }: { p: LeaderboardEntry; className?: string }) =>
  p.avatar_url ? (
    <img src={p.avatar_url} alt="" aria-hidden="true" loading="lazy" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span aria-hidden="true" className={cn("grid place-items-center rounded-full font-extrabold text-charcoal", tintOf(p.name), className)}>
      {initialOf(p.name)}
    </span>
  );

const GamesLeaderboard = ({ isLoggedIn, isAr, loading, allTime, weekly, myRank }: Props) => {
  const [tab, setTab] = useState<"all" | "week">("all");
  const board = (tab === "all" ? allTime : weekly).slice(0, 10);
  const top = board.slice(0, 3);
  const rest = board.slice(3);
  const leaderXp = Math.max(1, board[0]?.value ?? 1);
  const meInBoard = board.some((p) => p.isCurrentUser);
  const you = isAr ? "إنت" : "You";

  // Podium order: 2nd, 1st, 3rd - only the places that exist.
  const podium = [top[1], top[0], top[2]]
    .map((p, i) => (p ? { p, place: [2, 1, 3][i] } : null))
    .filter((x): x is { p: LeaderboardEntry; place: number } => x !== null);

  return (
    <section className="border-t border-border bg-[#FFF8EA] px-4 py-10 dark:bg-muted/20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-foreground">
              <Trophy className="h-6 w-6 text-[#F6C343]" aria-hidden="true" />
              {isLoggedIn ? (isAr ? "أفضل اللاعبين" : "Top Players") : (isAr ? "الترتيب" : "Leaderboard")}
            </h2>
            <p className="text-xs text-muted-foreground">
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
                    "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                    tab === key ? "bg-charcoal text-klovers-yellow" : "text-muted-foreground hover:text-foreground",
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
              <img src={`${ASSET}/cluby-royal.webp`} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-24 w-auto" />
              <p className="max-w-xs text-sm text-muted-foreground">
                {isAr
                  ? "سجّل عشان تبدأ تجمع نقط وتدخل الترتيب."
                  : "Sign up to start earning XP and take your place on the leaderboard."}
              </p>
              <a
                href="/signup"
                className="inline-flex min-h-10 items-center rounded-full border-2 border-charcoal bg-klovers-yellow px-5 text-sm font-bold text-charcoal"
              >
                {isAr ? "🏆 سجّل لرؤية ترتيبك" : "🏆 Sign up to see your rank"}
              </a>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{isAr ? "جارٍ تحميل الترتيب..." : "Loading leaderboard…"}</div>
          ) : board.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <img src={`${ASSET}/cluby-hanbok.webp`} alt="" aria-hidden="true" width={230} height={286} loading="lazy" className="h-20 w-auto" />
              <p className="text-sm text-muted-foreground">
                {tab === "week"
                  ? (isAr ? "لسه محدش لعب الأسبوع ده. كن الأول!" : "No one has played this week yet. Be the first!")
                  : (isAr ? "لا توجد بيانات بعد. العب لكسب XP!" : "No data yet. Play games to earn XP!")}
              </p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="relative bg-gradient-to-b from-[#FFF3C4] to-transparent px-4 pt-8 dark:from-klovers-yellow/10">
                <img
                  src={`${ASSET}/cluby-royal.webp`}
                  alt=""
                  aria-hidden="true"
                  width={230}
                  height={286}
                  loading="lazy"
                  className="absolute end-3 top-3 hidden h-16 w-auto sm:block"
                />
                <ol className="mx-auto grid max-w-md grid-cols-3 items-end gap-3">
                  {podium.map(({ p, place }) => {
                    const m = MEDAL[place - 1];
                    return (
                      <li key={p.user_id} className="flex flex-col items-center text-center">
                        {place === 1 && <Crown className="mb-1 h-6 w-6 text-[#F6C343]" aria-hidden="true" />}
                        <Avatar
                          p={p}
                          className={cn("ring-4", m.ring, place === 1 ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg", p.isCurrentUser && "outline outline-2 outline-offset-2 outline-charcoal")}
                        />
                        <p className="mt-2 max-w-full truncate text-sm font-bold text-foreground">
                          {p.name}
                          {p.isCurrentUser && <span className="ms-1 text-[11px] text-muted-foreground">({you})</span>}
                        </p>
                        <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold", m.chip)}>
                          {p.value.toLocaleString()} XP
                        </span>
                        <div className={cn("mt-2 grid w-full place-items-center rounded-t-xl font-display text-2xl font-extrabold text-charcoal/70", m.step)}>
                          {place}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* 4-10 */}
              {rest.length > 0 && (
                <ol className="divide-y divide-border">
                  {rest.map((p, i) => (
                    <li
                      key={p.user_id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        p.isCurrentUser && "border-s-4 border-klovers-yellow bg-klovers-yellow/15",
                      )}
                    >
                      <span className="w-6 text-center text-sm font-extrabold text-muted-foreground">{i + 4}</span>
                      <Avatar p={p} className="h-9 w-9 text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                          {p.name}
                          {p.isCurrentUser && (
                            <span className="rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-extrabold text-klovers-yellow">{you}</span>
                          )}
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
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
                <p className="border-t border-border px-4 py-3 text-center text-sm text-foreground">
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
