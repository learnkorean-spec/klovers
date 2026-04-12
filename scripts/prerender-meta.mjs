/**
 * prerender-meta.mjs
 *
 * Post-build script that creates route-specific HTML files in dist/
 * with proper <title>, <meta description>, <link canonical>, and OG tags.
 *
 * Vercel serves static files BEFORE applying rewrites, so dist/courses/index.html
 * is served instead of the generic dist/index.html for /courses.
 *
 * This solves the #1 SEO problem: Googlebot seeing empty/generic meta tags
 * because all metadata was only set client-side via JavaScript.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";

const DIST = join(process.cwd(), "dist");
const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers";
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;

// Route -> SEO metadata map
const routes = [
  {
    path: "/",
    title: "Learn Korean Online",
    description: "Join Klovers Korean Lovers Academy. Interactive online Korean lessons, placement tests, and gamified learning for all levels.",
  },
  {
    path: "/courses",
    title: "Korean Courses",
    description: "Explore Klovers Korean language courses — Beginner to Advanced. Live classes, flexible schedules, and certified teachers.",
  },
  {
    path: "/pricing",
    title: "Pricing & Plans",
    description: "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.",
  },
  {
    path: "/about",
    title: "About Us",
    description: "Meet the Klovers team. Our certified teachers bring years of experience teaching Korean to students worldwide.",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description: "Get in touch with Klovers Korean Lovers Academy. We would love to hear from you about courses, enrollment, or any questions.",
  },
  {
    path: "/faq",
    title: "FAQ",
    description: "Got questions about learning Korean with Klovers? Find answers about courses, teachers, scheduling, and payments.",
  },
  {
    path: "/enroll-now",
    title: "Enroll Now | Klovers Korean Academy",
    description: "Join Klovers Korean Academy — choose your class type, schedule, and start speaking Korean with confidence.",
  },
  {
    path: "/enroll",
    title: "Enroll Now",
    description: "Start learning Korean today. Enroll in a Klovers course — choose your level, schedule, and teacher.",
  },
  {
    path: "/placement-test",
    title: "Korean Placement Test",
    description: "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.",
  },
  {
    path: "/games",
    title: "Korean Learning Games",
    description: "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.",
  },
  {
    path: "/free-trial",
    title: "Free Trial",
    description: "Try a free Korean lesson at Klovers. Experience interactive learning, certified teachers, and our gamified curriculum with no commitment.",
  },
  {
    path: "/affiliate",
    title: "Affiliate Program",
    description: "Join the Klovers affiliate program. Earn commissions by referring students to our Korean language courses.",
  },
  {
    path: "/blog",
    title: "Blog",
    description: "Read the latest articles about learning Korean, K-culture, TOPIK preparation, and language tips on the Klovers blog.",
  },
  {
    path: "/learn-korean-arabic-speakers",
    title: "Learn Korean for Arabic Speakers",
    description: "Korean courses designed for Arabic speakers. Learn Korean with explanations in Arabic, cultural context, and certified bilingual teachers.",
  },
  {
    path: "/topik-exam-preparation",
    title: "TOPIK Exam Preparation",
    description: "Prepare for the TOPIK exam with Klovers. Practice tests, vocabulary lists, grammar drills, and expert guidance for TOPIK I and II.",
  },
  {
    path: "/learn-korean-kdramas",
    title: "Learn Korean Through K-Dramas",
    description: "Learn real Korean from your favorite K-Dramas. Vocabulary, phrases, and cultural insights from popular Korean dramas.",
  },
  // Blog Posts
  {
    path: "/blog/learn-korean-alphabet-hangul-guide",
    title: "Learn the Korean Alphabet (Hangul): Complete Guide",
    description: "Master the Korean alphabet (Hangul) with this step-by-step guide. Learn all 40 letters, pronunciation, stroke order, and start reading Korean today.",
  },
  {
    path: "/blog/50-essential-korean-words-beginners",
    title: "50 Essential Korean Words for Beginners",
    description: "Learn the 50 most important Korean words every beginner should know. Start building your Korean vocabulary today with Klovers.",
  },
  {
    path: "/blog/kdrama-korean-phrases-beginners",
    title: "K-Drama Korean Phrases for Beginners",
    description: "Learn popular Korean phrases from K-Dramas. Common expressions, greetings, and slang used in your favorite Korean dramas.",
  },
  {
    path: "/blog/how-long-to-learn-korean-arabic-speakers",
    title: "How Long Does It Take to Learn Korean for Arabic Speakers?",
    description: "Find out how long it takes Arabic speakers to learn Korean. Timeline, difficulty comparison, and tips to learn faster.",
  },
  {
    path: "/blog/how-to-learn-korean-faster",
    title: "How to Learn Korean Faster",
    description: "Proven tips and strategies to learn Korean faster. Study methods, immersion techniques, and resources to accelerate your learning.",
  },
  {
    path: "/blog/best-free-resources-learn-korean-online-2026",
    title: "Best Free Resources to Learn Korean Online (2026)",
    description: "The best free Korean learning resources in 2026. Apps, websites, YouTube channels, and tools to learn Korean for free.",
  },
  {
    path: "/blog/korean-body-language-social-etiquette",
    title: "Korean Body Language & Social Etiquette",
    description: "Understand Korean body language, bowing culture, and social etiquette. Essential cultural knowledge for Korean learners.",
  },
  {
    path: "/blog/korean-songs-to-learn-korean-2026",
    title: "Korean Songs to Learn Korean (2026)",
    description: "Learn Korean through K-Pop songs. Vocabulary, grammar, and pronunciation practice from popular Korean songs in 2026.",
  },
  {
    path: "/blog/korean-family-terms-relationships-guide",
    title: "Korean Family Terms & Relationships Guide",
    description: "Complete guide to Korean family terms and relationship vocabulary. Learn how Koreans address family members.",
  },
  {
    path: "/blog/korean-skincare-kbeauty-routine-guide",
    title: "Korean Skincare & K-Beauty Routine Guide",
    description: "Learn Korean skincare vocabulary and K-Beauty terms. Explore the famous Korean 10-step skincare routine in Korean.",
  },
  {
    path: "/blog/korean-traditional-holidays-chuseok-seollal",
    title: "Korean Traditional Holidays: Chuseok & Seollal",
    description: "Learn about Korean traditional holidays Chuseok and Seollal. Vocabulary, customs, and cultural significance explained.",
  },
  {
    path: "/blog/korean-easier-than-japanese-chinese",
    title: "Is Korean Easier Than Japanese and Chinese?",
    description: "Compare Korean, Japanese, and Chinese difficulty. Why Korean might be easier to learn and which language to choose.",
  },
  {
    path: "/blog/learn-korean-through-kpop-bts-blackpink",
    title: "Learn Korean Through K-Pop: BTS & BLACKPINK",
    description: "Learn Korean vocabulary and phrases from BTS and BLACKPINK songs. Fun K-Pop-based Korean learning for beginners.",
  },
  {
    path: "/blog/topik-1-vocabulary-list-800-words",
    title: "TOPIK 1 Vocabulary List: 800 Essential Words",
    description: "Complete TOPIK 1 vocabulary list with 800 essential Korean words. Study guide for TOPIK I exam preparation.",
  },
  {
    path: "/blog/korean-for-arabic-speakers-difficulty-guide",
    title: "Korean for Arabic Speakers: Difficulty Guide",
    description: "How hard is Korean for Arabic speakers? A detailed guide comparing grammar, pronunciation, and writing systems.",
  },
  {
    path: "/blog/korean-workplace-business-culture",
    title: "Korean Workplace & Business Culture",
    description: "Understand Korean workplace culture, business etiquette, and office vocabulary. Essential for working in Korea.",
  },
  {
    path: "/blog/korean-pronunciation-guide-beginners",
    title: "Korean Pronunciation Guide for Beginners",
    description: "Master Korean pronunciation with this beginner guide. Vowels, consonants, sound changes, and tips for natural speech.",
  },
  {
    path: "/blog/korean-age-system-explained",
    title: "Korean Age System Explained",
    description: "Understand the Korean age system. How Korean age differs from international age and how to calculate yours.",
  },
  {
    path: "/blog/korean-speech-levels-honorifics-guide",
    title: "Korean Speech Levels & Honorifics Guide",
    description: "Master Korean speech levels and honorifics. When to use formal, polite, and casual speech in Korean.",
  },
  {
    path: "/blog/learn-korean-3-months-study-method",
    title: "Learn Korean in 3 Months: Study Method",
    description: "A practical 3-month Korean study plan. Daily schedule, resources, and milestones to reach conversational Korean.",
  },
  {
    path: "/blog/korean-grammar-particles",
    title: "Korean Grammar Particles Guide",
    description: "Complete guide to Korean grammar particles. Learn subject, object, topic markers, and other essential Korean particles.",
  },
  {
    path: "/blog/korean-daily-greetings",
    title: "Korean Daily Greetings",
    description: "Essential Korean greetings for daily life. Morning greetings, goodbyes, and polite expressions used every day in Korea.",
  },
  {
    path: "/blog/korean-food-vocabulary",
    title: "Korean Food Vocabulary",
    description: "Learn Korean food vocabulary. Names of dishes, ingredients, and useful phrases for ordering at Korean restaurants.",
  },
  {
    path: "/blog/hanbok-korean-traditional-clothing",
    title: "Hanbok: Korean Traditional Clothing",
    description: "Learn about Hanbok, traditional Korean clothing. History, types, vocabulary, and when Koreans wear traditional dress.",
  },
  {
    path: "/blog/topik-exam-guide",
    title: "TOPIK Exam Guide",
    description: "Complete guide to the TOPIK exam. Registration, format, scoring, preparation tips, and study resources.",
  },
  {
    path: "/blog/seoul-travel-korean-phrases",
    title: "Seoul Travel Korean Phrases",
    description: "Essential Korean phrases for traveling in Seoul. Directions, transportation, shopping, and emergency vocabulary.",
  },
  {
    path: "/blog/korean-numbers-guide",
    title: "Korean Numbers Guide",
    description: "Learn Korean numbers — both native Korean and Sino-Korean counting systems. When to use each and practice exercises.",
  },
  {
    path: "/blog/korean-slang-words",
    title: "Korean Slang Words",
    description: "Popular Korean slang words and internet expressions. Modern Korean slang used by native speakers and in K-culture.",
  },
  {
    path: "/blog/study-korean-kdramas-method",
    title: "Study Korean with K-Dramas Method",
    description: "A proven method to learn Korean through K-Dramas. Step-by-step guide for using Korean dramas as study material.",
  },
  {
    path: "/blog/korean-cafe-coffee-culture",
    title: "Korean Cafe & Coffee Culture",
    description: "Explore Korean cafe culture and coffee vocabulary. Learn how to order coffee in Korean and discover Seoul cafe trends.",
  },
];

// Read the base index.html built by Vite
const baseHTML = readFileSync(join(DIST, "index.html"), "utf-8");

let created = 0;

for (const route of routes) {
  const fullTitle = route.title.includes("Klovers")
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${route.path === "/" ? "" : route.path}`;
  const description = route.description;

  let html = baseHTML;

  // 1. Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${fullTitle}</title>`
  );

  // 2. Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`
  );

  // 3. Add canonical link (insert before </head>)
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${canonicalUrl}" />\n  </head>`
  );

  // 4. Replace OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${fullTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // 5. Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${fullTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${description}" />`
  );

  // 6. Write the file
  const filePath =
    route.path === "/"
      ? join(DIST, "index.html")
      : join(DIST, route.path.slice(1), "index.html");

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, html, "utf-8");
  created++;
}

console.log(`\n\u2705 Prerendered SEO meta tags for ${created} routes.\n`);
