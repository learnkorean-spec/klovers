// League definitions with XP thresholds and Korean cultural icons
export const LEAGUES = [
  { key: "beginner", name: "Beginner League", emoji: "🌱", icon: "🇰🇷", minXp: 0, maxXp: 199, color: "hsl(var(--muted-foreground))" },
  { key: "hangul", name: "Hangul League", emoji: "🔤", icon: "ㄱ", minXp: 200, maxXp: 499, color: "#CFF7D3" },
  { key: "conversation", name: "Conversation League", emoji: "💬", icon: "🗣️", minXp: 500, maxXp: 999, color: "#D6E8FF" },
  { key: "grammar", name: "Grammar League", emoji: "📖", icon: "✍️", minXp: 1000, maxXp: 1999, color: "#E8D9FF" },
  { key: "topik_rookie", name: "TOPIK Rookie League", emoji: "🥉", icon: "🏅", minXp: 2000, maxXp: 3499, color: "#FFE5CC" },
  { key: "topik_challenger", name: "TOPIK Challenger League", emoji: "🥈", icon: "⚡", minXp: 3500, maxXp: 5499, color: "hsl(0 0% 75%)" },
  { key: "topik_master", name: "TOPIK Master League", emoji: "🥇", icon: "👑", minXp: 5500, maxXp: Infinity, color: "#FFE5CC" },
] as const;

export const XP_VALUES = {
  vocab: 10,
  grammar: 15,
  dialogue: 20,
  exercise: 10,
  reading: 10,
  writing: 15,
  chapter: 50,
  challenge: 30,
  bonus: 25,
  streak_bonus: 5,
  game_complete: 5,  // per correct answer in games
  review: 5,         // spaced repetition review
  class_attendance_present: 25,
  class_attendance_late: 10,
  referral_conversion: 150,
} as const;

export const BADGES = [
  { key: "hangul_master", name: "Hangul Master", emoji: "🔤", description: "Complete Lesson 1: Introduction to Hangul" },
  { key: "first_100_words", name: "First 100 Words", emoji: "📚", description: "Learn 100 vocabulary words" },
  { key: "grammar_starter", name: "Grammar Starter", emoji: "✏️", description: "Complete 5 grammar exercises" },
  { key: "conversation_beginner", name: "Conversation Beginner", emoji: "💬", description: "Complete 5 dialogue practices" },
  { key: "topik_ready", name: "TOPIK Ready", emoji: "🏆", description: "Complete all 45 lessons" },
  { key: "streak_3", name: "3-Day Streak", emoji: "🔥", description: "Study for 3 days in a row" },
  { key: "streak_7", name: "Weekly Warrior", emoji: "⚡", description: "Study for 7 days in a row" },
  { key: "streak_14", name: "Two Week Champion", emoji: "💪", description: "Study for 14 days in a row" },
  { key: "streak_30", name: "Monthly Master", emoji: "🌟", description: "Study for 30 days in a row" },
  { key: "first_chapter", name: "First Mission Complete", emoji: "🎯", description: "Complete your first chapter" },
  { key: "five_chapters", name: "Mission Veteran", emoji: "🗺️", description: "Complete 5 chapters" },
  { key: "perfect_exercise", name: "Perfect Score", emoji: "⭐", description: "Get 100% on an exercise" },
  { key: "boss_slayer", name: "Boss Slayer", emoji: "🐉", description: "Complete a Boss Challenge" },
  { key: "seoul_explorer", name: "Seoul Explorer", emoji: "🏙️", description: "Complete a travel mission" },
  { key: "game_starter", name: "Game Starter", emoji: "🎮", description: "Complete your first game" },
  { key: "game_master", name: "Game Master", emoji: "🏆", description: "Complete 10 games" },
  { key: "perfect_game", name: "Perfect Game", emoji: "💯", description: "Get a perfect score in any game" },
  { key: "review_rookie", name: "Review Rookie", emoji: "🔁", description: "Complete 10 vocabulary review sessions" },
  { key: "early_bird", name: "Early Bird", emoji: "🌅", description: "Study before 8 AM" },
  { key: "bilingual_explorer", name: "Bilingual Explorer", emoji: "🌍", description: "Complete lessons in 2 different textbooks" },
] as const;

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export const MOTIVATIONAL_MESSAGES = [
  "대단해요! (Awesome!) Keep going! 🎉",
  "잘했어요! (Well done!) You're making great progress! 💪",
  "화이팅! (Fighting!) You're unstoppable! 🔥",
  "멋져요! (Cool!) Another mission complete! ⭐",
  "최고! (The best!) You're on fire! 🌟",
  "훌륭해요! (Excellent!) Keep up the momentum! 🚀",
  "파이팅! (Go for it!) The next league awaits! 💎",
  "수고했어요! (Good job!) Take a well-deserved break! ☕",
];

export function getLeague(totalXp: number) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (totalXp >= LEAGUES[i].minXp) return { ...LEAGUES[i], index: i };
  }
  return { ...LEAGUES[0], index: 0 };
}

export function getLeagueProgress(totalXp: number) {
  const league = getLeague(totalXp);
  const rangeSize = league.maxXp === Infinity ? 2000 : league.maxXp - league.minXp + 1;
  const progress = ((totalXp - league.minXp) / rangeSize) * 100;
  return Math.min(progress, 100);
}

export function getRandomMotivation() {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

export function isCheckpointLesson(lessonNum: number) {
  return lessonNum % 3 === 0;
}

export function isBossChallenge(lessonNum: number) {
  return lessonNum % 5 === 0;
}
