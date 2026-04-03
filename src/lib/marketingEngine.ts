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

// ─── Testimonial / Social Proof ───

const TESTIMONIALS = [
  { quote: "I passed TOPIK 2!", student: "Mona, Level 4" },
  { quote: "Reading menus now!", student: "Sara, Level 2" },
  { quote: "Best Korean class!", student: "Ahmed, Level 1" },
  { quote: "Worth every penny!", student: "Rana, Level 3" },
  { quote: "Fluent in 1 year!", student: "Nour, Advanced" },
];

export function getTestimonialPostTemplate(index = 0): PostTemplate {
  const t = TESTIMONIALS[index % TESTIMONIALS.length];
  return {
    mainText: `"${t.quote}"`,
    subtitle: `— ${t.student}\nKlovers Academy`,
    extra: "#StudentSuccess  #Klovers  #KoreanResults",
    isUrgent: false,
  };
}

// ─── FAQ / Objection Handling ───

const FAQ_ITEMS = [
  { q: "Can I learn Korean online?", a: "Yes! Small groups,\nstructured lessons" },
  { q: "How fast will I progress?", a: "Read Korean in 4 weeks\nwith our curriculum" },
  { q: "Is it worth learning Korean?", a: "K-dramas, K-pop, travel —\nopen new worlds" },
];

export function getFAQPostTemplate(index = 0): PostTemplate {
  const faq = FAQ_ITEMS[index % FAQ_ITEMS.length];
  return {
    mainText: faq.q,
    subtitle: faq.a,
    extra: "#KoreanFAQ  #Klovers  #LearnKorean",
    isUrgent: false,
  };
}

// ─── Countdown / Urgency ───

export function getCountdownPostTemplate(daysLeft: number, levelLabel: string): PostTemplate {
  return {
    mainText: `${daysLeft} Days Left`,
    subtitle: `${levelLabel}\nregistration closes soon`,
    extra: "#LastChance  #Klovers  #KoreanCourse",
    isUrgent: true,
  };
}

// ─── Monthly 30-Post Plan ───

export type MonthlyPostType =
  | "empty_slots"
  | "invite_student"
  | "discount"
  | "referral"
  | "testimonial"
  | "faq"
  | "countdown";

export interface MonthlyPost {
  id: string;
  day: number;
  postType: MonthlyPostType;
  template: PostTemplate;
  caption: string;
}

// 30-day posting schedule optimised for conversions
// Pattern: Awareness (testimonial/faq) → Consideration (empty_slots/invite) → Decision (discount/countdown/referral)
const MONTHLY_SCHEDULE: MonthlyPostType[] = [
  "empty_slots",   // 1  — open week hook
  "faq",           // 2  — objection handling
  "invite_student",// 3  — soft invite
  "testimonial",   // 4  — social proof
  "empty_slots",   // 5
  "discount",      // 6  — first promo push
  "referral",      // 7  — word of mouth
  "empty_slots",   // 8
  "testimonial",   // 9
  "faq",           // 10 — second FAQ
  "invite_student",// 11
  "countdown",     // 12 — mid-month urgency
  "empty_slots",   // 13
  "discount",      // 14 — second promo push
  "testimonial",   // 15 — mid-month social proof
  "empty_slots",   // 16
  "referral",      // 17
  "invite_student",// 18
  "empty_slots",   // 19
  "testimonial",   // 20
  "faq",           // 21 — third FAQ
  "discount",      // 22 — third promo push
  "countdown",     // 23 — urgency ramp up
  "empty_slots",   // 24
  "referral",      // 25
  "invite_student",// 26
  "empty_slots",   // 27
  "testimonial",   // 28
  "discount",      // 29 — end-of-month last chance
  "countdown",     // 30 — FINAL DAY urgency
];

export function generateMonthlyPlan(
  groups: GroupData[],
  discountPct: number,
  discountCode: string,
): MonthlyPost[] {
  let groupIdx = 0;
  let testimonialIdx = 0;
  let faqIdx = 0;
  let countdownIdx = 0;

  const safeGroup = () => groups.length ? groups[groupIdx++ % groups.length] : null;

  return MONTHLY_SCHEDULE.map((type, i) => {
    const day = i + 1;
    let template: PostTemplate;
    let caption = "";

    switch (type) {
      case "empty_slots": {
        const g = safeGroup();
        template = g ? getGroupPostTemplate(g) : getDiscountPostTemplate(discountPct, discountCode);
        caption = g
          ? `📢 ${getLevelLabel(g.level)} — ${g.seats_left} seat${g.seats_left !== 1 ? "s" : ""} left!\n\n🗓 Every ${g.day_name} at ${g.start_time} · ${g.duration_min} min sessions\n✅ Small group · Certified teacher · Real results from week 1\n\n📲 Register now: kloversegy.com/enroll\n\n#LearnKorean #Klovers #KoreanCourse`
          : `📢 New Korean course spots open!\n\nSmall groups, certified teachers, structured curriculum.\n\n📲 kloversegy.com/enroll\n\n#LearnKorean #Klovers`;
        break;
      }
      case "invite_student": {
        const g = safeGroup();
        template = g ? getInvitePostTemplate(g) : getReferralPostTemplate();
        caption = g
          ? `👋 Know someone who wants to learn Korean?\n\n${getLevelLabel(g.level)} is open — every ${g.day_name} at ${g.start_time}.\n\nTag them below ⬇️ or share this post!\n\n📲 kloversegy.com/enroll\n\n#LearnKorean #Klovers #KoreanClasses`
          : `👋 Tag a friend who wants to learn Korean! 🇰🇷\n\n📲 kloversegy.com/enroll\n\n#LearnKorean #Klovers`;
        break;
      }
      case "discount": {
        template = getDiscountPostTemplate(discountPct, discountCode);
        caption = `🏷️ ${discountPct}% OFF your first month!\n\nUse code: ${discountCode} at checkout.\n\nLimited time — don't miss it.\n📲 kloversegy.com/enroll\n\n#KoreanCourse #Klovers #Discount #LearnKorean`;
        break;
      }
      case "referral": {
        template = getReferralPostTemplate();
        caption = `🤝 Love Klovers? Refer a friend and BOTH of you get a FREE class!\n\nDM us or share the link in bio to get your code.\n\n#Klovers #LearnKorean #ReferAFriend`;
        break;
      }
      case "testimonial": {
        const t = TESTIMONIALS[testimonialIdx % TESTIMONIALS.length];
        template = getTestimonialPostTemplate(testimonialIdx);
        testimonialIdx++;
        caption = `🌟 "${t.quote}" — ${t.student}\n\nThis is why we do what we do 🇰🇷\n\nReady to write YOUR success story?\n📲 kloversegy.com/enroll\n\n#StudentSuccess #Klovers #LearnKorean`;
        break;
      }
      case "faq": {
        const faq = FAQ_ITEMS[faqIdx % FAQ_ITEMS.length];
        template = getFAQPostTemplate(faqIdx);
        faqIdx++;
        caption = `❓ ${faq.q}\n\n${faq.a.replace("\n", " — ")}\n\nAt Klovers we offer structured online Korean classes with certified teachers, small groups, and a proven curriculum.\n\n📲 kloversegy.com/enroll\n\n#KoreanFAQ #LearnKorean #Klovers`;
        break;
      }
      case "countdown": {
        const daysLeft = [3, 5, 2][countdownIdx % 3];
        const g = groups.length ? groups[countdownIdx % groups.length] : null;
        const levelLabel = g ? getLevelLabel(g.level) : "New Korean Class";
        template = getCountdownPostTemplate(daysLeft, levelLabel);
        countdownIdx++;
        caption = `⏰ Only ${daysLeft} days left to register for ${levelLabel}!\n\nSpots are filling up — secure yours now.\n📲 kloversegy.com/enroll\n\n#LastChance #Klovers #KoreanCourse`;
        break;
      }
    }

    return { id: `monthly-${day}`, day, postType: type, template: template!, caption };
  });
}

// ─── Monthly post → PostData converter (for canvas renderer) ───

export function monthlyPostToPostData(post: MonthlyPost): { id: string; mainText: string; subtitle: string; extraText: string } {
  return {
    id: post.id,
    mainText: post.template.mainText,
    subtitle: post.template.subtitle,
    extraText: post.template.extra,
  };
}

// ─── Publishing copy export (for captions.txt in ZIP) ───

const POST_TYPE_LABELS: Record<MonthlyPostType, string> = {
  empty_slots:    "Class Opening",
  invite_student: "Student Invite",
  discount:       "Promotion",
  referral:       "Referral",
  testimonial:    "Student Story",
  faq:            "FAQ",
  countdown:      "Countdown",
};

export function generatePublishingCopy(post: {
  day: number;
  postType: MonthlyPostType;
  caption: string;
  scheduledDate: string;
}): string {
  const label = POST_TYPE_LABELS[post.postType];
  const date = post.scheduledDate
    ? new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  return `=== Day ${post.day} — ${label} ===\n📅 ${date}\n\n${post.caption}\n\n---`;
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
