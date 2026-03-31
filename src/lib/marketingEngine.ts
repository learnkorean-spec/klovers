// Marketing content generation engine

export interface GroupData {
  id: string;
  name: string;
  level: string;
  day_name: string;
  start_time: string;
  duration_min: number;
  capacity: number;
  active_members: number;
  seats_left: number;
  urgency_label: "Last Seats" | "Starting Soon" | "Open Registration";
  package_id: string;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner_1: "Korean Level 1",
  beginner_2: "Korean Level 2",
  intermediate_1: "Intermediate 1",
  intermediate_2: "Intermediate 2",
  advanced: "Advanced",
};

export function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] || level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function getUrgencyLabel(seatsLeft: number): GroupData["urgency_label"] {
  if (seatsLeft <= 2) return "Last Seats";
  return "Open Registration";
}

// ─── Organic Post Captions ───

const HOOKS = [
  (g: GroupData) => `🚀 ${getLevelLabel(g.level)} — Starting ${g.day_name} ${g.start_time}`,
  (g: GroupData) => `🇰🇷 Ready to learn Korean? ${getLevelLabel(g.level)} is open!`,
  (g: GroupData) => `✨ New group alert! ${getLevelLabel(g.level)} — ${g.day_name}s at ${g.start_time}`,
];

const BENEFITS = [
  "Learn to read, speak, and build real Korean sentences from week one.",
  "Small group setting for personalized attention and real practice.",
  "Structured curriculum designed to get you speaking Korean fast.",
];

const CTAS = [
  "Reserve your seat today.",
  "Spots are filling up — register now!",
  "Don't miss out — enroll today.",
];

const HASHTAGS = "#LearnKorean #KoreanCourse #Klovers #KoreanLanguage #StudyKorean";

export function generateCaptions(group: GroupData): string[] {
  return [0, 1, 2].map(i => {
    const seatsLine = group.seats_left <= 3 ? `\nOnly ${group.seats_left} seat${group.seats_left === 1 ? "" : "s"} left.` : "";
    return `${HOOKS[i](group)}${seatsLine}\n\n${BENEFITS[i]}\n\n${CTAS[i]}\n\n${HASHTAGS}`;
  });
}

// ─── Meta Ads Copy ───

export function generateAdCopy(group: GroupData) {
  const level = getLevelLabel(group.level);
  
  const primaryTexts = [
    `Learn Korean the right way. ${level} starts ${group.day_name} at ${group.start_time}. Small group, structured lessons, real results. Limited seats available — register now.`,
    `Want to speak Korean? Join our ${level} course. ${group.duration_min}-minute sessions every ${group.day_name}. Only ${group.seats_left} spots remaining.`,
    `Start your Korean journey with ${level}. Expert-led classes, small groups, and a clear roadmap from day one. Seats are limited.`,
  ];

  const headlines = [
    `${level} — ${group.day_name} ${group.start_time}`,
    `Learn Korean — Only ${group.seats_left} Seats Left`,
    `${level} Starts This ${group.day_name}`,
  ];

  const descriptions = [
    `${group.duration_min}-min weekly sessions. Small group. Structured learning.`,
    `Expert-led Korean course. Limited seats. Register today.`,
  ];

  return { primaryTexts, headlines, descriptions, cta: "Sign Up" };
}

// ─── WhatsApp Broadcast Template ───

export function generateWhatsAppMessage(group: GroupData): string {
  const level = getLevelLabel(group.level);
  const slug = level.toLowerCase().replace(/\s+/g, "-");
  const seatsLine = group.seats_left <= 5
    ? `⏳ فضلوا بس ${group.seats_left} مقعد!\n`
    : "";
  const regUrl = `https://kloversegy.com/enroll?utm_source=whatsapp&utm_campaign=${encodeURIComponent(slug)}`;
  return `السلام عليكم 🌸\n\n📣 ${level} Korean Course\n🗓 ${group.day_name}s at ${group.start_time}\n⏱ ${group.duration_min} minutes/session\n\n✅ تعلم الكورية من الصفر مع مجموعة صغيرة ومتابعة شخصية\n${seatsLine}\n📲 سجل هنا:\n${regUrl}\n\n#Klovers #تعلم_الكورية #KoreanLanguage`;
}

// ─── Post Template Helpers (for canvas rendering) ───

export interface PostTemplate {
  mainText: string;
  subtitle: string;
  extra: string;
  isUrgent: boolean;
}

export function getGroupPostTemplate(group: GroupData): PostTemplate {
  const levelLabel = getLevelLabel(group.level);
  const isUrgent = group.seats_left <= 5;
  const urgencyLine = group.seats_left <= 3
    ? `\n🔴 Only ${group.seats_left} seats left!`
    : group.seats_left <= 6
    ? `\n⚡ ${group.seats_left} seats available`
    : "";
  return {
    mainText: levelLabel,
    subtitle: `${group.day_name} • ${group.start_time}\n${group.duration_min} min / session${urgencyLine}`,
    extra: "#LearnKorean  #Klovers  #KoreanCourse",
    isUrgent,
  };
}

export function getInvitePostTemplate(group: GroupData): PostTemplate {
  const levelLabel = getLevelLabel(group.level);
  return {
    mainText: `Join ${levelLabel}`,
    subtitle: `Every ${group.day_name} • ${group.start_time}\n${group.duration_min} min sessions`,
    extra: "#LearnKorean  #Klovers  #KoreanCourse",
    isUrgent: false,
  };
}

export function getDiscountPostTemplate(discountPct: number, code: string): PostTemplate {
  return {
    mainText: `${discountPct}% OFF`,
    subtitle: `First Month\nCode: ${code || "SAVE" + discountPct}`,
    extra: "#KoreanCourse  #Klovers  #Discount",
    isUrgent: true,
  };
}

export function getReferralPostTemplate(): PostTemplate {
  return {
    mainText: "Refer a Friend",
    subtitle: "Get 1 Free Class\nShare your link",
    extra: "#Klovers  #LearnKorean  #KoreanAcademy",
    isUrgent: false,
  };
}

// ─── Story Script (3-slide) ───

export function generateStoryScript(group: GroupData): { slide1: string; slide2: string; slide3: string } {
  const level = getLevelLabel(group.level);
  const urgency = group.seats_left <= 3
    ? `🔴 آخر ${group.seats_left} مقعد!`
    : group.seats_left <= 6
    ? `⚡ ${group.seats_left} seats left`
    : "✅ Open Registration";
  return {
    slide1: `Want to speak Korean? 🇰🇷\n\n${level}\nStarts ${group.day_name}s at ${group.start_time}\n\n👆 Swipe to see details`,
    slide2: `📚 ${level}\n🗓 Every ${group.day_name} • ${group.start_time}\n⏱ ${group.duration_min} min sessions\n👥 Small group\n${urgency}\n\n✨ Real Korean from week one`,
    slide3: `Ready to start? 🚀\n\n📲 Register now:\nkloversegy.com/enroll\n\n🔗 Link in bio\n\n#Klovers #LearnKorean #KoreanCourse`,
  };
}
