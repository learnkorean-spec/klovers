/**
 * prerender-meta.mjs — Option A1
 *
 * Post-build script that creates route-specific HTML files in dist/ with a
 * fully-populated <head>: title, description, canonical, Open Graph, Twitter
 * card and JSON-LD.
 *
 * Vercel serves static files BEFORE applying rewrites, so dist/courses/index.html
 * is served for /courses instead of the SPA shell.
 *
 * The blog route list is READ FROM SUPABASE AT BUILD TIME. It used to be a
 * hand-maintained array of 30 slugs, which meant any post published after that
 * array was last edited was served the site-wide default title and description
 * (docs/SEO_DIAGNOSIS.md, finding #2).
 *
 * If the Supabase query fails, the last successful route list is reused from
 * scripts/prerender-routes.cache.json and a loud warning is printed. If there is
 * no cache either, the build FAILS rather than silently emitting only the
 * marketing routes — a near-empty prerender is worse than no deploy, because it
 * would quietly de-list every blog post.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { baseOf, buildRelatedMap, RELATED_MIN } from "./lib/related-posts.mjs";
import { RETIRED_SLUGS } from "./lib/retired-arabic-slugs.mjs";
import { buildFaqJsonLd } from "./lib/faq-parser.mjs";
import { PRELOAD_PATTERN, preloadTagFor } from "./lib/lcp-preload.mjs";
import { markdownToHtml } from "./lib/markdown-to-html.mjs";
import { MARKER_START, MARKER_END } from "./lib/related-links.mjs";
import { replaceLiteral } from "./lib/replace-literal.mjs";
import {
  HTML_TAG_PATTERN,
  languageOf,
  ogLocaleOf,
  otherLanguage,
  htmlTagFor,
} from "./lib/document-language.mjs";

const DIST = join(process.cwd(), "dist");
const CACHE_FILE = join(process.cwd(), "scripts", "prerender-routes.cache.json");
const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers";
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;

// Build-time credentials. Vercel already defines the VITE_* pair for the app
// itself, so the non-prefixed names are only an override for local runs.
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Escape a string for safe use inside a double-quoted HTML attribute. */
const attr = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Escape a string for safe use as HTML text content. */
const text = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Trim to a whole word near `max` characters, for the listing excerpts. */
const excerpt = (s, max = 160) => {
  const clean = String(s ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")) || cut}…`;
};

// ── Hand-written body copy for marketing routes ─────────────────────────────
//
// A marketing route's prerendered <body> is empty apart from the mount point:
// the emit loop copies index.html, and only /blog and the article routes write
// anything inside #root. /games is the case worth fixing by hand. It is the
// best-converting page on the site in Search Console — 495 impressions, 25
// clicks, a 5% CTR, the highest of any URL — and it still averages position
// 16.2, which is what a page with a good title and no crawlable text looks
// like. A crawler that does not run JavaScript has been seeing a correct <head>
// attached to a blank document.
//
// The game names and one-line descriptions below are DUPLICATED from the
// `games` array in src/pages/GamesPage.tsx and the English `games.*Title` /
// `games.*Desc` strings in src/i18n/translations.ts. The duplication is
// deliberate and must not be replaced with an import. This script runs under
// plain node after `vite build`; importing from src/ would drag TSX, the "@/"
// path alias, the i18n runtime and React into a build step whose only job is to
// emit static HTML, and would make a prerender that currently cannot fail
// depend on the client bundle compiling. English only, for the same reason:
// there is no language context here, and the document declares itself English.
//
// The cost of that choice is that this copy can drift from the app. That is
// accepted, and it is why the emit loop asserts the shape of the fragment
// rather than trusting it.
//
// The "ten of the twenty-two" below is the one number here that can go stale
// silently: it is static HTML served to crawlers at /games, so nothing in the
// app corrects it. scripts/lib/games-free-set.test.mjs reads BOTH this file and
// src/pages/GamesPage.tsx and fails if this sentence disagrees with
// FREE_GAME_IDS.length or with the length of the games array.
//
// The fragment is written into the document verbatim rather than through
// text()/attr(), because it IS markup — the ampersands below are therefore
// escaped by hand. Anything interpolated into it later must go through those
// helpers.
const GAMES_BODY_HTML = `<div id="games-prerendered" lang="en" dir="ltr">
      <h1>Korean Learning Games</h1>
      <p>Klovers Korean Learning Games are free, interactive games for practising Korean in your browser — reading Hangul, matching vocabulary, unscrambling words, conjugating verbs and more. There is nothing to download and no sign-up is needed to start: ten of the twenty-two games are open to everyone. Signed-in learners earn XP for every round, build a daily streak and climb the leaderboard.</p>
      <h2>The games</h2>
      <ul>
        <li><strong>Vocabulary Match</strong> — Flip cards &amp; match Korean words with English meanings</li>
        <li><strong>Hangul Speed Quiz</strong> — Identify Hangul characters against the clock</li>
        <li><strong>Sentence Builder</strong> — Arrange words to build correct Korean sentences</li>
        <li><strong>Korean Numbers</strong> — Master native &amp; Sino-Korean number systems</li>
        <li><strong>Color Match</strong> — Learn Korean color names with visual cues</li>
        <li><strong>Verb Conjugation</strong> — Practice present, past &amp; future verb forms</li>
        <li><strong>Greeting Master</strong> — Match Korean greetings to real-life situations</li>
        <li><strong>Opposite Words</strong> — Find the Korean antonym for each word</li>
        <li><strong>Particle Pro</strong> — Fill in the correct Korean particles (은/는/이/가)</li>
        <li><strong>Word Scramble</strong> — Unscramble Korean syllables to form words</li>
        <li><strong>Counter Words</strong> — Learn Korean counting words (명, 개, 마리...)</li>
        <li><strong>K-Drama Quiz</strong> — Guess meanings of popular K-Drama phrases</li>
        <li><strong>Time Teller</strong> — Read Korean time expressions correctly</li>
        <li><strong>Type Korean</strong> — See the English meaning and type the Korean word</li>
        <li><strong>Romanization</strong> — Read Korean words and type their pronunciation</li>
        <li><strong>Flashcards</strong> — Flip cards to test your Korean vocabulary recall</li>
        <li><strong>Speed Read</strong> — Memorize a Korean word in a flash, then pick its meaning</li>
        <li><strong>Reading Choice</strong> — See the English and romanization, choose the Korean</li>
        <li><strong>Sentence Reading</strong> — Read Korean sentences and choose the correct meaning</li>
        <li><strong>Phonics Practice</strong> — See the romanization and pick the correct Korean spelling</li>
<li><strong>Conversation Order</strong> — Put a Korean dialogue's lines back in the right order</li>
<li><strong>Story Gaps</strong> — Fill in the missing words in a short Korean story</li>
      </ul>
      <p>Prefer to read first? The <a href="/blog">Klovers Korean blog</a> covers Hangul, grammar, TOPIK preparation and Korean culture, and the <a href="/courses">Korean courses</a> take you from the alphabet to real conversation with a certified teacher.</p>
    </div>`;

// ── "Journey through Korea's time" body fragments ───────────────────────────
//
// Five era pages at /journey/:eraId (src/pages/EraPage.tsx), added 2026-09-22.
// Same tradeoff as GAMES_BODY_HTML above: this text is DUPLICATED from
// src/constants/eras.ts (the storyEn/milestones/words for each era) rather
// than imported, for the same reason — this script runs under plain node
// after `vite build` and must not depend on the client bundle compiling.
// English only: prerendering has no language context and the document
// declares itself English (the live page still serves both languages via
// useLanguage on the client). If you edit an era's English copy in
// eras.ts, mirror the change here or this text will drift from the page a
// visitor actually sees.
const ERA_BEFORE_KOREA_BODY = `<div id="era-prerendered" lang="en" dir="ltr">
      <h1>Before Korea</h1>
      <p>Legend, to the 4th century CE · Legend, China, and the first kingdoms</p>
      <p>Every country tells a story about where it came from. Korea's begins on a mountain, with a bear who wanted to become a woman.</p>
      <h2>This era at a glance</h2>
      <ul>
        <li><strong>2333 BCE</strong> — Dangun founds Gojoseon, in the legend</li>
        <li><strong>108 BCE</strong> — Han China conquers Wiman Joseon</li>
        <li><strong>313 CE</strong> — Goguryeo conquers Lelang</li>
      </ul>
      <h2>The story</h2>
      <p>According to the Samguk Yusa, legends written down in the 13th century, a bear and a tiger asked Hwanung, a son of the Lord of Heaven, to make them human. The tiger gave up. The bear endured a hundred days away from the sun, became a woman, and gave birth to Dangun, who founded Gojoseon in 2333 BCE. Historians treat that date as legend, not documented fact.</p>
      <p>What is documented: a state called Joseon existed in the north of the peninsula by the 4th century BCE. In 194 BCE Wi Man, a refugee from the Chinese state of Yan, took its throne. In 108 BCE the Han emperor Wu conquered it and set up four commanderies in the north.</p>
      <p>For about four centuries, part of the north was governed from China. The largest commandery, Lelang, lasted until 313 CE, when the Korean kingdom of Goguryeo conquered it. Beside it, new kingdoms had grown up: Goguryeo in the north, Baekje in the southwest and Silla in the southeast. This is the Three Kingdoms period.</p>
      <p>Korea borrowed heavily from China. Buddhism arrived in Goguryeo in 372 CE, in Baekje in 384 and in Silla in 528. Chinese characters, Hanja, became the language of government, and Confucian ideas shaped how people thought about family and study. A large share of Korean vocabulary is still Sino-Korean. But Koreans kept their spoken language, their customs and their own states, and roughly a thousand years later gave Korean its own alphabet.</p>
      <h2>Words from this era</h2>
      <ul>
        <li>곰 (gom) — bear</li>
        <li>호랑이 (horangi) — tiger</li>
        <li>단군 (Dangun) — the legendary founder</li>
        <li>고조선 (Gojoseon) — Old Joseon, the first kingdom</li>
        <li>한자 (Hanja) — Chinese characters</li>
        <li>중국 (Jungguk) — China</li>
      </ul>
      <p>Next station: <a href="/journey/ancient-korea">Ancient Korea</a>.</p>
    </div>`;

const ERA_ANCIENT_KOREA_BODY = `<div id="era-prerendered" lang="en" dir="ltr">
      <h1>Ancient Korea</h1>
      <p>Silla · 57 BC – 935 · Temples and invention</p>
      <p>In the southeast of the peninsula, a kingdom grew around a city called Seorabeol, which we now know as Gyeongju.</p>
      <h2>This era at a glance</h2>
      <ul>
        <li><strong>57 BCE</strong> — Silla is founded, by Korean records</li>
        <li><strong>528 CE</strong> — Buddhism becomes the state religion</li>
        <li><strong>935 CE</strong> — The last king submits to Goryeo</li>
      </ul>
      <h2>The story</h2>
      <p>Korean records date the founding of Silla to 57 BCE, and it lasted until 935 CE, nearly a thousand years. Its tombs have given us elaborate gold crowns and jewelry, and its capital had an astronomical observatory, Cheomseongdae, a stone tower built to watch the stars.</p>
      <p>In 528 CE Silla adopted Buddhism as its state religion, and temples became part of the landscape. That is why this station is called temples and invention.</p>
      <p>Silla also had the Hwarang, elite young men. They began as a social group for aristocratic youth, but constant wars turned many of them into soldiers and commanders, and they helped in the campaigns that brought down Goguryeo.</p>
      <p>Silla won its wars with its neighbors and with its former ally Tang China, and unified most of the peninsula. The Silla-Tang War ran from 670 to 676. In 935 the last king, Gyeongsun, submitted to Goryeo, and Silla came to an end.</p>
      <h2>Words from this era</h2>
      <ul>
        <li>신라 (Silla) — the kingdom of Silla</li>
        <li>금 (geum) — gold</li>
        <li>왕관 (wanggwan) — crown</li>
        <li>절 (jeol) — temple</li>
        <li>별 (byeol) — star</li>
        <li>화랑 (Hwarang) — young aristocratic warriors</li>
      </ul>
      <p>Previous station: <a href="/journey/before-korea">Before Korea</a>. Next station: <a href="/journey/joseon">The Joseon Era</a>.</p>
    </div>`;

const ERA_JOSEON_BODY = `<div id="era-prerendered" lang="en" dir="ltr">
      <h1>The Joseon Era</h1>
      <p>1392 – 1897 · Royal culture, and Hangul</p>
      <p>In 1392 a general named Yi Seong-gye took power and founded the Joseon dynasty, which would rule for more than five centuries.</p>
      <h2>This era at a glance</h2>
      <ul>
        <li><strong>1392</strong> — Joseon is founded</li>
        <li><strong>1446</strong> — Hangul is promulgated on October 9</li>
        <li><strong>1897</strong> — The Korean Empire is proclaimed</li>
      </ul>
      <h2>The story</h2>
      <p>In 1393 the capital moved to Hanseong, which is modern Seoul. The state ran on Neo-Confucian ideas. Government jobs went to men who passed the gwageo, exams on Confucian learning, and the educated elite who held those jobs were called the yangban. By 1800 the yangban may have made up as much as 30 percent of the population. Buddhism, which had thrived in Silla, was discouraged.</p>
      <p>The most famous king, Sejong, oversaw the creation of Hangul. Before it, writing meant Chinese characters, which took years to learn. Hangul was made to be learned quickly. It was promulgated on October 9, 1446, a date Koreans still celebrate as Hangul Day. But the scholarly elite rejected it at the time, and it took centuries to become the everyday script.</p>
      <p>In 1897 the Korean Empire was proclaimed, which formally ended the Joseon period. The dynasty continued to rule until Japan annexed Korea in 1910.</p>
      <h2>Words from this era</h2>
      <ul>
        <li>조선 (Joseon) — the Joseon dynasty</li>
        <li>한글 (Hangul) — the Korean alphabet</li>
        <li>궁 (gung) — palace</li>
        <li>양반 (yangban) — the educated noble class</li>
        <li>시험 (siheom) — exam</li>
        <li>학자 (hakja) — scholar</li>
      </ul>
      <h2>Read about this era</h2>
      <ul>
        <li><a href="/blog/learn-korean-alphabet-hangul-guide">Hangul: Built to Be Learned in a Day</a></li>
        <li><a href="/blog/korean-speech-levels-honorifics-guide">Why Korean Has 7 Speech Levels</a></li>
      </ul>
      <p>Previous station: <a href="/journey/ancient-korea">Ancient Korea</a>. Next station: <a href="/journey/traditional-life">Traditional Life</a>.</p>
    </div>`;

const ERA_TRADITIONAL_LIFE_BODY = `<div id="era-prerendered" lang="en" dir="ltr">
      <h1>Traditional Life</h1>
      <p>Hanok villages · Tea, manners, timeless beauty</p>
      <p>A hanok is a traditional Korean house that listens to the land: where you build it matters as much as how.</p>
      <h2>This era at a glance</h2>
      <ul>
        <li><strong>Baesanimsu</strong> — A mountain behind, a river in front</li>
        <li><strong>Ondol</strong> — Heat under the floor for cold winters</li>
        <li><strong>Maru</strong> — A cool wooden hall for summer</li>
      </ul>
      <h2>The story</h2>
      <p>A hanok is a traditional Korean house. Its roots go back to pit houses from around 6,000 BCE, and its classic form was completed in the late Joseon period. The ideal site is baesanimsu: a mountain behind the house and a river in front, with the land and seasons in mind.</p>
      <p>It is built for comfort in both extremes. For winter there is ondol, an under-floor heating system devised long ago to help Koreans survive the cold, still used in many homes today. For summer there is the maru, a cool wooden-floor hall that blocks the summer sun and lets air move through.</p>
      <p>Hanok are built from timber for beams and posts, clay roof tiles called giwa, and stone foundations. Windows and doors use hanji, Korean paper treated with bean oil so it resists water. Northern hanok are square to keep heat in, southern ones are open and L-shaped for ventilation, and central regions combine both.</p>
      <p>You can still walk through them in Bukchon Hanok Village in central Seoul. As in most Korean homes, shoes come off at the door.</p>
      <h2>Words from this era</h2>
      <ul>
        <li>한옥 (hanok) — traditional Korean house</li>
        <li>온돌 (ondol) — under-floor heating</li>
        <li>마루 (maru) — wooden-floor hall</li>
        <li>기와 (giwa) — clay roof tile</li>
        <li>한지 (hanji) — Korean paper</li>
        <li>마을 (maeul) — village</li>
      </ul>
      <h2>Read about this era</h2>
      <ul>
        <li><a href="/blog/hanbok-korean-traditional-clothing">Hanbok, Korea's Traditional Dress</a></li>
        <li><a href="/blog/korean-traditional-holidays-chuseok-seollal">Seollal &amp; Chuseok</a></li>
        <li><a href="/blog/korean-wedding-traditions-guide">Inside a Korean Wedding</a></li>
        <li><a href="/blog/korean-zodiac-fortune-telling-guide">Korean Zodiac &amp; Fortune-Telling</a></li>
      </ul>
      <p>Previous station: <a href="/journey/joseon">The Joseon Era</a>. Next station: <a href="/journey/modern-korea">Modern Korea</a>.</p>
    </div>`;

const ERA_MODERN_KOREA_BODY = `<div id="era-prerendered" lang="en" dir="ltr">
      <h1>Modern Korea</h1>
      <p>1950s – today · A dynamic tomorrow</p>
      <p>For a long time Korean culture was mostly something Koreans shared with each other. Then, in the 1990s, it began to travel.</p>
      <h2>This era at a glance</h2>
      <ul>
        <li><strong>1999</strong> — Chinese journalists coin the term Hallyu</li>
        <li><strong>2012</strong> — Gangnam Style hits one billion YouTube views</li>
        <li><strong>2020</strong> — Parasite wins Best Picture at the Oscars</li>
      </ul>
      <h2>The story</h2>
      <p>The word for this is Hallyu, the Korean wave. It joins han, meaning Korean, and ryu, meaning flow or wave. Two things helped it start: the end of military censorship over the entertainment industry, and the recovery from the 1997 Asian financial crisis. Chinese journalists began using the term in 1999.</p>
      <p>In 2003 and 2004 the romance drama Winter Sonata became a huge hit, especially in Japan, and boosted tourism to Korea. In 2012 Psy's Gangnam Style became the first YouTube video to reach one billion views. BTS and Blackpink then found audiences around the world.</p>
      <p>In 2020 the film Parasite won Best Picture at the Academy Awards, the first non-English-language film to do so. In 2021 Netflix released Squid Game, and the Oxford English Dictionary added both hallyu and Korean wave.</p>
      <p>This is why so many people begin learning Korean today: they hear a song or watch a drama and want to understand it without subtitles.</p>
      <h2>Words from this era</h2>
      <ul>
        <li>한류 (hallyu) — the Korean wave</li>
        <li>서울 (Seoul) — Seoul</li>
        <li>드라마 (deurama) — drama</li>
        <li>영화 (yeonghwa) — movie</li>
        <li>노래 (norae) — song</li>
        <li>팬 (paen) — fan</li>
      </ul>
      <h2>Read about this era</h2>
      <ul>
        <li><a href="/blog/learn-korean-through-kpop-bts-blackpink">Learning Korean Through K-Pop</a></li>
        <li><a href="/blog/korean-street-food-guide">A Taste of Korean Street Food</a></li>
      </ul>
      <p>Previous station: <a href="/journey/traditional-life">Traditional Life</a>.</p>
    </div>`;

// ── Marketing routes ────────────────────────────────────────────────────────
// Hand-maintained on purpose: these are static pages, not database rows.
//
// `body` is optional. A route that declares it gets that fragment written into
// #root by the emit loop; a route that omits it keeps the empty mount point it
// has always had.
const MARKETING_ROUTES = [
  {
    // The homepage carries the brand-entity work, so it is commented where the
    // other routes are not.
    //
    // "klovers" takes 218 impressions at average position 7.8 and ONE click;
    // the whole brand cluster (klovers, k lovers, k lover, k-lovers) is 410
    // impressions and 4 clicks — about 13% of site impressions converting at
    // ~1%. The Latin name is not winnable: klovers.net is a Korean-topic
    // community running since 2011, and there is also klovers.io, a Klovers
    // surname, a Brenau University society and the Klover fintech app. A US
    // search for "klovers" does not return this domain at all.
    //
    // The Arabic name is unclaimed instead — «كلوفرز» has zero impressions,
    // and a survey of Arabic Korean-learning found only government institutes
    // and literally-keyword-named sites, none with a real brand name. So the
    // title leads with the brand and says what nothing else in that market
    // says, and the description carries the Arabic name in prose so a crawler
    // can bind the two strings to one entity.
    //
    // No " | Klovers" suffix is appended to this one: the emit loop only adds
    // it when the title does not already contain SITE_NAME, and this does.
    path: "/",
    title: "Klovers Korean Academy — Learn Korean in Arabic",
    description:
      "Klovers (كلوفرز — أكاديمية محبي الكورية): interactive online Korean lessons, a free placement test, and gamified learning for all levels.",
  },
  {
    path: "/courses",
    title: "Korean Courses",
    description:
      "Explore Klovers Korean language courses — Beginner to Advanced. Live classes, flexible schedules, and certified teachers.",
  },
  {
    path: "/pricing",
    title: "Pricing & Plans",
    description:
      "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.",
  },
  {
    path: "/about",
    title: "About Us",
    description:
      "Meet the Klovers team. Our certified teachers bring years of experience teaching Korean to students worldwide.",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with Klovers Korean Lovers Academy. We would love to hear from you about courses, enrollment, or any questions.",
  },
  {
    path: "/faq",
    title: "FAQ",
    description:
      "Got questions about learning Korean with Klovers? Find answers about courses, teachers, scheduling, and payments.",
  },
  {
    path: "/enroll-now",
    title: "Enroll Now | Klovers Korean Academy",
    description:
      "Join Klovers Korean Academy — choose your class type, schedule, and start speaking Korean with confidence.",
  },
  {
    path: "/enroll",
    title: "Enroll Now",
    description:
      "Start learning Korean today. Enroll in a Klovers course — choose your level, schedule, and teacher.",
  },
  {
    path: "/placement-test",
    title: "Korean Placement Test",
    description:
      "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.",
  },
  {
    path: "/games",
    title: "Korean Learning Games",
    description:
      "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.",
    body: GAMES_BODY_HTML,
  },
  {
    path: "/free-trial",
    title: "Free Trial",
    description:
      "Try a free Korean lesson at Klovers. Experience interactive learning, certified teachers, and our gamified curriculum with no commitment.",
  },
  {
    path: "/affiliate",
    title: "Affiliate Program",
    description:
      "Join the Klovers affiliate program. Earn commissions by referring students to our Korean language courses.",
  },
  {
    path: "/blog",
    title: "Blog",
    description:
      "Read the latest articles about learning Korean, K-culture, TOPIK preparation, and language tips on the Klovers blog.",
  },
  {
    path: "/learn-korean-arabic-speakers",
    title: "Learn Korean for Arabic Speakers",
    description:
      "A Korean course built for Arabic speakers. Contrastive grammar, Arabic-to-Korean explanations, and a realistic 8-month timeline.",
  },
  {
    path: "/topik-exam-preparation",
    title: "TOPIK Exam Preparation 2026",
    description:
      "Prepare for the TOPIK exam with Klovers. 2026 exam dates, level breakdown, scoring, and an 8-12 week study plan.",
  },
  {
    path: "/learn-korean-kdramas",
    title: "Learn Korean Through K-Dramas",
    description:
      "Learn Korean with K-dramas using the 4-watch method. Drama recommendations by level and a 30-day habit-building guide.",
  },
  // Added in A1 — live routes that were missing from the prerender list.
  {
    path: "/interview-training",
    title: "Korean Interview Training — AI-Powered | Klovers",
    description:
      "Practice Korean job interview questions with AI-generated personalized Q&A. Get 2 free questions, upgrade for more.",
  },
  {
    path: "/welcome-back",
    title: "Welcome Back — Returning Students Offer",
    description:
      "Returning Klovers students get 20% off. Enroll now, share with friends, and save up to 35%. No placement test required.",
  },
  {
    path: "/hangul-starter",
    title: "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description:
      "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
  },
  // "Journey through Korea's time" — five era pages, added 2026-09-22. IDs and
  // all copy come from src/constants/eras.ts (ERAS); keep this list in step
  // with it and with STATIC_PAGES in api/sitemap.xml.js. `image` and `body`
  // are additive fields buildHeadTags/the emit loop only read for routes that
  // set them, so this cannot change behavior for any of the routes above.
  {
    path: "/journey/before-korea",
    title: "Before Korea",
    description:
      "The legend of Dangun, the first kingdom of Gojoseon, four centuries of Chinese rule in the north, and the Three Kingdoms: where Korea's story begins.",
    // A drawn illustration, not a photo (docs note: dangun-myth.jpg is
    // unvetted). PNG, 1200x630, for Open Graph/Twitter — social scrapers do
    // not reliably render SVG, unlike the on-page hero at era.image.
    image: "/assets/eras/gojoseon-og.png",
    body: ERA_BEFORE_KOREA_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
  },
  {
    path: "/journey/ancient-korea",
    title: "Ancient Korea",
    description:
      "Silla, the kingdom of gold crowns, star-watching towers and Buddhist temples that lasted almost a thousand years, from 57 BCE to 935 CE.",
    image: "/assets/blog/buddhist-temple.jpg",
    body: ERA_ANCIENT_KOREA_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
  },
  {
    path: "/journey/joseon",
    title: "The Joseon Era",
    description:
      "The Joseon dynasty, 1392 to 1897: kings, Confucian scholars, the yangban class, and King Sejong's invention of Hangul.",
    image: "/assets/blog/joseon-dynasty.jpg",
    body: ERA_JOSEON_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
  },
  {
    path: "/journey/traditional-life",
    title: "Traditional Life",
    description:
      "Inside the hanok, the traditional Korean house: mountain-and-river placement, ondol floor heating, the cool maru hall, and clay tile roofs.",
    image: "/assets/blog/korean-tea.jpg",
    body: ERA_TRADITIONAL_LIFE_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
  },
  {
    path: "/journey/modern-korea",
    title: "Modern Korea",
    description:
      "Hallyu, the Korean wave: from the 1990s to Winter Sonata, Gangnam Style, Parasite and Squid Game, and why so many people now learn Korean.",
    image: "/assets/blog/hallyu-wave.jpg",
    body: ERA_MODERN_KOREA_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
  },
];

// ── Blog routes, from the database ──────────────────────────────────────────

/**
 * Fetch every published post, minus the retired Arabic duplicates.
 *
 * Same filter as api/sitemap.xml.js's `live`: these slugs carry their own 301
 * in vercel.json, so prerendering a page for one (or linking to it from the
 * /blog index or a related-articles block) would only ever hand a reader or
 * a crawler a page that immediately redirects away.
 */
async function fetchPublishedPosts() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY not set (VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY are also accepted)"
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, description, keywords, lang, hero_image, hero_alt, article_type, author, published_at, updated_at, content"
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("query returned zero published posts");

  const live = data.filter((p) => !RETIRED_SLUGS.has(p.slug));
  const retiredCount = data.length - live.length;
  if (retiredCount > 0) {
    console.log(`Excluded ${retiredCount} retired Arabic duplicate(s) from prerendering.`);
  }
  return live;
}

/** Turn a post row into a route entry. */
const postToRoute = (p) => ({
  path: `/blog/${p.slug}`,
  title: p.title,
  description: p.description,
  post: {
    slug: p.slug,
    lang: p.lang || "en",
    heroImage: p.hero_image || null,
    heroAlt: p.hero_alt || null,
    articleType: p.article_type || null,
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
    author: p.author || SITE_NAME,
    publishedAt: p.published_at || null,
    updatedAt: p.updated_at || p.published_at || null,
    content: p.content || "",
  },
});

let blogRoutes;
let usedCache = false;

try {
  const posts = await fetchPublishedPosts();
  blogRoutes = posts.map(postToRoute);
  writeFileSync(
    CACHE_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), routes: blogRoutes }, null, 2),
    "utf-8"
  );
  console.log(`\nFetched ${blogRoutes.length} published blog posts from Supabase.`);
} catch (err) {
  console.error("\n" + "!".repeat(72));
  console.error("!! PRERENDER WARNING: could not read blog posts from Supabase.");
  console.error(`!! Reason: ${err.message}`);

  if (existsSync(CACHE_FILE)) {
    const cache = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    blogRoutes = cache.routes || [];
    usedCache = true;
    console.error(`!! Falling back to scripts/prerender-routes.cache.json`);
    console.error(`!! Cache written at: ${cache.generatedAt}`);
    console.error(`!! Using ${blogRoutes.length} cached blog routes.`);
    console.error("!! Posts published since then will NOT have prerendered meta.");
    console.error("!".repeat(72) + "\n");
  } else {
    console.error("!! No cache file exists to fall back to.");
    console.error("!! Refusing to emit marketing routes only — that would silently");
    console.error("!! de-list every blog post. Failing the build instead.");
    console.error("!".repeat(72) + "\n");
    process.exit(1);
  }
}


// ── Head construction ───────────────────────────────────────────────────────

const routes = [...MARKETING_ROUTES, ...blogRoutes];

// Slug bases, used to decide whether an EN<->AR partner really exists.
// Arabic posts use either a `-ar` suffix (90 of them) or a legacy `ar-` prefix (10).
// `baseOf` is shared with the related-posts scoring so the two cannot drift
// apart about what counts as the same topic.
const publishedSlugs = new Set(blogRoutes.map((r) => r.post.slug));

/**
 * Resolve the EN and AR URLs for a post, but only where the partner document
 * actually exists. Emitting an alternate for a URL that 404s invalidates the
 * whole annotation cluster, so a missing partner means no hreflang at all.
 */
function hreflangFor(slug) {
  const base = baseOf(slug);
  const enSlug = publishedSlugs.has(base) ? base : null;
  const arSlug = publishedSlugs.has(`${base}-ar`)
    ? `${base}-ar`
    : publishedSlugs.has(`ar-${base}`)
      ? `ar-${base}`
      : null;
  if (!enSlug || !arSlug) return null;          // no honest pair -> no tags

  // Eight English posts have TWO published Arabic translations, `<base>-ar` and
  // legacy `ar-<base>`. Only one can be the `hreflang="ar"` target, and the
  // suffix form wins above — which left the runner-up emitting a cluster that
  // did not contain its own URL. Every member of a cluster has to name every
  // member including itself, so a page that is not in its own cluster gets no
  // tags at all rather than a set Google will discard.
  if (slug !== enSlug && slug !== arSlug) return null;

  return {
    en: `${BASE_URL}/blog/${enSlug}`,
    ar: `${BASE_URL}/blog/${arSlug}`,
  };
}

// ── Related articles ────────────────────────────────────────────────────────
//
// Every article page gets a block of links to other articles, written into the
// raw HTML at build time. This is the only internal-linking mechanism that
// reaches a crawler which does not execute JavaScript, and without it every one
// of the 200 articles is an orphan: nothing on the site points at it.
//
// A client-side related-posts block already exists in src/pages/BlogPostPage.tsx
// and is left alone. It is invisible to a raw fetch, and it groups posts by
// `article_type`, which is a format rather than a topic. The scoring that
// replaces it for the prerendered block lives in scripts/lib/related-posts.mjs,
// where it can be unit tested.

/**
 * Cut the related-links block out of an article's markdown.
 *
 * scripts/proposals/internal-links.mjs appended a delimited "Related Articles"
 * block to the `content` column of 175 of the 200 published articles, so the
 * links exist twice over once the body carries rendered content: once in the
 * prose, once in the <nav> below it. The nav is the copy that stays — it is
 * built from the scoring in related-posts.mjs and is present on all 200
 * articles, not 175.
 *
 * The markers are imported rather than retyped so this cannot drift from the
 * script that writes them.
 */
function stripRelatedBlock(markdown) {
  const body = String(markdown ?? "");
  const start = body.indexOf(MARKER_START);
  const end = body.indexOf(MARKER_END);
  if (start === -1 || end === -1 || end < start) return body;
  return body.slice(0, start) + body.slice(end + MARKER_END.length);
}

/**
 * The block written into an article page's <body>.
 *
 * Title and description come from the same row that already fills the <head>,
 * so a raw fetch gets a page that says what it is rather than a bare list of
 * links floating on an otherwise blank document.
 *
 * The article's own text sits between them and the related nav. Before that,
 * this function wrote roughly forty words per article — an h1, the meta
 * description, and the link list — while `post.content`, 1,911 to 11,849
 * characters of markdown per article, was fetched on the same row and used
 * only to extract FAQ JSON-LD. Every crawler that does not execute JavaScript
 * (GPTBot, ClaudeBot, PerplexityBot, Bing's non-JS path, Facebook, WhatsApp)
 * therefore saw a headline and a snippet where an article was supposed to be.
 * docs/RENDERING_DECISION_2026-08.md §6 names this the highest-remaining-impact
 * gap on the site.
 *
 * That document costed a headless-browser DOM snapshot (Option A2) as the way
 * to close it. This is cheaper: the markdown is already in hand at build time,
 * so it only has to be rendered, which scripts/lib/markdown-to-html.mjs does
 * in-process with no Chromium, no new dependency, and no per-page browser
 * boot. It also sidesteps A2's hydration-mismatch risk class entirely — see
 * the note on createRoot in buildBlogIndexHtml below.
 *
 * The h1, the description paragraph, the lang/dir attributes and the nav are
 * unchanged; this is purely additive.
 */
function buildArticleBodyHtml(route, relatedSlugs, bySlug) {
  const isAr = route.post.lang === "ar";
  const items = relatedSlugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .map((r) => `          <li><a href="${attr(r.path)}">${text(r.title)}</a></li>`)
    .join("\n");

  // headingFloor: 2 keeps the <h1> above as the page's only one. 67 of the 200
  // articles open with an `#` heading of their own; those are demoted to <h2>
  // rather than dropped, because only 24 of the 67 repeat the title verbatim.
  const article = markdownToHtml(stripRelatedBlock(route.post.content), {
    headingFloor: 2,
  });

  return `<div id="article-prerendered" lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
      <h1>${text(route.title)}</h1>
      <p>${text(route.description)}</p>
${article}
      <nav aria-labelledby="related-articles">
        <h2 id="related-articles">${isAr ? "مقالات ذات صلة" : "Related articles"}</h2>
        <ul>
${items}
        </ul>
      </nav>
    </div>`;
}

/**
 * Open Graph and Twitter require absolute URLs. 78 of the 200 hero_image values
 * are root-relative ("/assets/..."), which social scrapers and Google Images
 * cannot resolve, so promote them to absolute here.
 */
function absoluteUrl(u) {
  if (!u) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

/**
 * A real, server-visible list of every published article, written into the
 * prerendered /blog document.
 *
 * Before this, /blog served an empty <div id="root"> to anything that does not
 * run JavaScript, which meant there was no crawlable path from the blog index to
 * a single article. The sitemap listed the URLs, but nothing on the site linked
 * to them, so every article was an orphan.
 *
 * This markup goes INSIDE #root. src/main.tsx mounts with `createRoot`, not
 * `hydrateRoot`, so React empties the container and renders over it — there is
 * no hydration to mismatch. Until the bundle arrives the reader sees a plain
 * list of links instead of the blank screen they see today, which on a slow
 * Egyptian mobile connection is the better of the two.
 *
 * Not paginated, deliberately. 200 links on one page is well within what a
 * crawler will follow, and the alternative would mean inventing /blog/page/2
 * URLs that prerender fine but that the SPA has no route for — a reader who
 * clicked one would land on the app's not-found page.
 */
function buildBlogIndexHtml(routes) {
  const groups = [
    { lang: "en", dir: "ltr", heading: "All articles", rows: routes.filter((r) => r.post.lang !== "ar") },
    { lang: "ar", dir: "rtl", heading: "كل المقالات", rows: routes.filter((r) => r.post.lang === "ar") },
  ];

  const sections = groups
    .filter((g) => g.rows.length)
    .map((g) => {
      const items = g.rows
        .map(
          (r) => `        <li>
          <a href="${attr(r.path)}">${text(r.title)}</a>
          <p>${text(excerpt(r.description))}</p>
        </li>`
        )
        .join("\n");
      return `      <section lang="${g.lang}" dir="${g.dir}">
        <h2>${text(g.heading)} (${g.rows.length})</h2>
        <ul>
${items}
        </ul>
      </section>`;
    })
    .join("\n");

  return `<div id="blog-index-prerendered">
      <h1>Klovers Korean blog</h1>
      <p>Guides to Korean grammar, vocabulary, TOPIK and Korean culture, in English and Arabic.</p>
${sections}
    </div>`;
}

const jsonLd = (obj) =>
  `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)
    .split("\n")
    .map((l) => "  " + l)
    .join("\n")}\n  </script>`;

function buildHeadTags(route) {
  const isHome = route.path === "/";
  const isPost = Boolean(route.post);
  // Root keeps its slash - "/" IS the path. Sub-paths never get a trailing
  // slash. This must match api/sitemap.xml.js exactly or the canonical and
  // the sitemap entry disagree.
  const url = `${BASE_URL}${isHome ? "/" : route.path}`;
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const description = route.description || "";
  // route.image is opt-in (only the /journey/:eraId routes set it so far) and
  // falls back to the same DEFAULT_IMAGE every other marketing route already
  // got, so this changes nothing for a route that does not set it.
  const image = absoluteUrl(isPost ? route.post.heroImage : route.image || null);
  const imageAlt = isPost && route.post.heroAlt ? route.post.heroAlt : SITE_NAME;

  // The document's own language, which is also what the <html> element and the
  // article wrapper declare. index.html hardcodes og:locale="en_US" for every
  // route; it is stripped below and re-emitted here so an Arabic page says so.
  const lang = languageOf(route);

  const tags = [
    `  <link rel="canonical" href="${attr(url)}" />`,
    `  <meta property="og:type" content="${isPost ? "article" : "website"}" />`,
    `  <meta property="og:url" content="${attr(url)}" />`,
    `  <meta property="og:image" content="${attr(image)}" />`,
    `  <meta property="og:image:alt" content="${attr(imageAlt)}" />`,
    `  <meta property="og:locale" content="${ogLocaleOf(lang)}" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:image" content="${attr(image)}" />`,
  ];

  if (isPost) {
    const p = route.post;
    if (p.publishedAt)
      tags.push(`  <meta property="article:published_time" content="${attr(p.publishedAt)}" />`);
    if (p.updatedAt)
      tags.push(`  <meta property="article:modified_time" content="${attr(p.updatedAt)}" />`);

    const alts = hreflangFor(p.slug);
    if (alts) {
      tags.push(`  <link rel="alternate" hreflang="en" href="${attr(alts.en)}" />`);
      tags.push(`  <link rel="alternate" hreflang="ar" href="${attr(alts.ar)}" />`);
      tags.push(`  <link rel="alternate" hreflang="x-default" href="${attr(alts.en)}" />`);
      // The alternate locale hangs off the SAME honest-pair check as hreflang,
      // deliberately. index.html declared an ar_EG alternate on all 220 routes,
      // including the ~20 marketing pages, none of which has an Arabic URL at
      // all (docs/RENDERING_DECISION_2026-08.md §5) — an alternate for a
      // translation that does not exist. A page only claims a translation here
      // when hreflangFor has already confirmed one is published.
      tags.push(
        `  <meta property="og:locale:alternate" content="${ogLocaleOf(otherLanguage(lang))}" />`
      );
    }

    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: route.title,
        description,
        image: [image],
        inLanguage: p.lang === "ar" ? "ar" : "en",
        ...(p.articleType ? { articleSection: p.articleType } : {}),
        ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
        ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
        author: { "@type": "Organization", name: p.author || SITE_NAME, url: BASE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
          logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
        },
      })
    );

    const faqLd = buildFaqJsonLd(p.content);
    if (faqLd) tags.push(jsonLd(faqLd));

    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: route.title, item: url },
        ],
      })
    );
  }

  // Opt-in JSON-LD for non-post marketing routes. Both fields are additive —
  // a marketing route that does not set them (all of them except the five
  // /journey/:eraId era pages, so far) gets exactly the tags it got before
  // this block existed.
  if (!isPost && route.articleLd) {
    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: route.title,
        description,
        image: [image],
        inLanguage: "en",
        author: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
          logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
        },
      })
    );
  }

  if (!isPost && route.breadcrumb) {
    const trail = [...route.breadcrumb, { name: route.title, item: url }];
    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.name,
          item: crumb.item,
        })),
      })
    );
  }

  return tags.join("\n");
}

// ── Emit ────────────────────────────────────────────────────────────────────

const baseHTML = readFileSync(join(DIST, "index.html"), "utf-8");

// The organisation-level JSON-LD in index.html describes the business and the
// site as a whole. Repeating it on 218 subpages is duplicate entity markup, so
// it is kept on the homepage only and stripped everywhere else.
const baseWithoutOrgJsonLd = baseHTML.replace(
  /[ \t]*<!-- JSON-LD[^>]*-->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,
  ""
);

/** The SPA mount point, as vite emits it. */
const ROOT_DIV = '<div id="root"></div>';

/**
 * Write a fragment into the mount point.
 *
 * The replacement is passed as a FUNCTION, never as a string, and that is the
 * whole reason this helper exists. `String.prototype.replace` interprets `$&`,
 * `` $` ``, `$'` and `$1`-`$99` inside a *string* replacement even when the
 * pattern is a plain string — so the moment article prose goes through here, a
 * `$&` in an article would expand to the matched `<div id="root"></div>` and a
 * `` $` `` would splice the entire <head> into the <body>. Three published
 * articles already contain `$` next to a digit (app-pricing tables), and the
 * content column is arbitrary prose that changes without this file changing.
 *
 * A function replacement is returned verbatim, with no substitution pass.
 * Throws rather than returning silently if the mount point is missing: a vite
 * upgrade that renames or reformats it would otherwise empty every page this
 * script exists to fill.
 */
function writeIntoRoot(html, fragment, routePath, what) {
  const out = html.replace(ROOT_DIV, () => `<div id="root">${fragment}</div>`);
  if (out === html) {
    throw new Error(
      `could not find ${ROOT_DIV} in dist/index.html — ${routePath} got no ${what}`
    );
  }
  return out;
}

const { related: relatedMap, inbound: inboundCount } = buildRelatedMap(
  blogRoutes.map((r) => r.post)
);
const routeBySlug = new Map(blogRoutes.map((r) => [r.post.slug, r]));

let created = 0;
let withHreflang = 0;
let blogIndexLinks = 0;
let relatedLinksWritten = 0;
let marketingBodiesWritten = 0;
let articleBodiesWritten = 0;
let articleBodyChars = 0;
let preloadRetargeted = 0;
let preloadDropped = 0;

for (const route of routes) {
  const isHome = route.path === "/";
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const description = route.description || "";

  let html = isHome ? baseHTML : baseWithoutOrgJsonLd;

  // The document element. index.html ships `<html lang="en">` with no `dir`,
  // and this loop copies that document to every route — so all 100 published
  // Arabic articles declared themselves English at the document level while
  // their own content wrapper said `lang="ar" dir="rtl"` and their BlogPosting
  // JSON-LD said `"inLanguage": "ar"`. The two signals a crawler reads first,
  // and which scope the entire document, were the two that were wrong.
  //
  // The whole element is replaced rather than patched: that is what makes
  // `<html lang="en" lang="ar">` unrepresentable, and a duplicate lang would
  // resolve to the FIRST occurrence and silently keep the bug.
  html = replaceLiteral(html, HTML_TAG_PATTERN, htmlTagFor(languageOf(route)));

  // Every rewrite below embeds a database value, so every one goes through
  // replaceLiteral. attr() escapes &, <, > and " — it does NOT escape $, and a
  // string replacement expands $&, $`, $' and $1-$99. A title containing `$&`
  // would splice the matched <title>…</title> into itself; a backtick-dollar
  // would splice the entire document prefix into the tag. See
  // scripts/lib/replace-literal.mjs.
  html = replaceLiteral(html, /<title>[^<]*<\/title>/, `<title>${attr(fullTitle)}</title>`);
  html = replaceLiteral(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${attr(description)}" />`
  );
  html = replaceLiteral(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${attr(fullTitle)}" />`
  );
  html = replaceLiteral(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${attr(description)}" />`
  );
  html = replaceLiteral(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(fullTitle)}" />`
  );
  html = replaceLiteral(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(description)}" />`
  );

  // The LCP preload. index.html ships one pointing at the homepage hero, and
  // this loop copies that document to every route — so without this, all 189
  // article pages tell the browser to fetch, at the highest priority, an image
  // they never render, competing with the one they do. The homepage keeps its
  // own tag; an article gets its own hero; anything else loses the tag, because
  // a preload aimed at the wrong file is worse than none at all.
  if (!isHome) {
    PRELOAD_PATTERN.lastIndex = 0;
    const replacement = preloadTagFor(
      { isHome: false, heroImage: route.post?.heroImage || null },
      { attr }
    );
    const before = html;
    // `replacement` carries the article's own hero_image URL, which is a
    // database value: 82 of the 200 rows already contain "&" (Unsplash query
    // strings), and nothing stops one containing "$&".
    html = replaceLiteral(html, PRELOAD_PATTERN, replacement);
    if (html !== before) {
      if (replacement) preloadRetargeted++;
      else preloadDropped++;
    }
  }

  // Drop the placeholders that the base document ships with, so the values
  // written below are the only ones present.
  html = html.replace(/[ \t]*<meta property="og:type" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta property="og:image" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta name="twitter:card" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta name="twitter:image" content="[^"]*"\s*\/?>\n?/g, "");
  // og:locale joins that list. It was the one Open Graph tag left hardcoded,
  // so every Arabic page shipped `en_US`; the alternate shipped `ar_EG`, which
  // is not a value in Facebook's locale enumeration at all. Both are re-emitted
  // per route by buildHeadTags — the alternate only where a translation exists.
  html = html.replace(/[ \t]*<meta property="og:locale" content="[^"]*"\s*\/?>\n?/g, "");
  html = html.replace(/[ \t]*<meta property="og:locale:alternate" content="[^"]*"\s*\/?>\n?/g, "");

  // The largest of these by far: buildHeadTags returns the canonical, every OG
  // and Twitter tag, hreflang, and the BlogPosting / FAQPage / BreadcrumbList
  // JSON-LD — and the FAQPage carries question and answer text lifted straight
  // out of the article's markdown, up to 800 characters per answer. That is
  // the least predictable string in the whole build.
  html = replaceLiteral(html, "</head>", `${buildHeadTags(route)}\n  </head>`);

  // The blog index is the one route whose <body> has to carry real content:
  // it is the only page that can make the articles reachable by a crawler.
  if (route.path === "/blog") {
    // writeIntoRoot throws if the mount point is missing: a vite upgrade that
    // renames or reformats it would leave /blog silently empty again, which is
    // the exact regression this branch exists to fix.
    html = writeIntoRoot(html, buildBlogIndexHtml(blogRoutes), route.path, "index links");
    blogIndexLinks = blogRoutes.length;
  }

  // Article pages carry their related-articles block in the raw HTML, for the
  // crawlers that never run the client-side one.
  if (route.post) {
    const relatedSlugs = relatedMap.get(route.post.slug) || [];
    if (relatedSlugs.length < RELATED_MIN) {
      throw new Error(
        `${route.path} has only ${relatedSlugs.length} related articles ` +
          `(minimum ${RELATED_MIN}) — it would ship as an orphan`
      );
    }
    const body = buildArticleBodyHtml(route, relatedSlugs, routeBySlug);
    html = writeIntoRoot(html, body, route.path, "article body");
    relatedLinksWritten += relatedSlugs.length;
    articleBodiesWritten++;
    articleBodyChars += body.length;
  }

  // Marketing routes that carry hand-written body copy. Deliberately LAST of
  // the three body writers and explicitly excluded from the other two: /blog
  // and the article routes generate their bodies from the database and own the
  // mount point, so this branch may only claim a #root that neither of them
  // touched. Without those two conditions a future marketing entry that shared
  // a path with them would silently overwrite generated content with static
  // copy.
  if (route.body && route.path !== "/blog" && !route.post) {
    // Same spirit as the RELATED_MIN guard above: fail the deploy rather than
    // ship the defect. The fragment is hand-written and duplicated from the app
    // (see GAMES_BODY_HTML), so nothing but an assertion stops a later edit from
    // shipping a page with two competing headings, or with none — and a missing
    // h1 is precisely the state this whole branch exists to fix.
    const h1Count = (route.body.match(/<h1[\s>]/g) || []).length;
    if (h1Count !== 1) {
      throw new Error(
        `${route.path} declares a prerendered body with ${h1Count} <h1> element(s) ` +
          `(expected exactly 1) — fix the fragment referenced from MARKETING_ROUTES`
      );
    }

    html = writeIntoRoot(html, route.body, route.path, "prerendered body");
    marketingBodiesWritten++;
  }

  if (route.post && hreflangFor(route.post.slug)) withHreflang++;

  const filePath = isHome
    ? join(DIST, "index.html")
    : join(DIST, route.path.slice(1), "index.html");

  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(filePath, html, "utf-8");
  created++;
}

// ── Neutral SPA shell ───────────────────────────────────────────────────────
//
// dist/index.html is BOTH the homepage and, via the rewrite in vercel.json, the
// document served for any route without a prerendered file. Those two jobs
// conflict: an unknown URL used to be served the homepage's title and the
// homepage's canonical, so every stray URL declared itself a copy of the
// homepage.
//
// Split them. index.html keeps the real homepage head; app.html is a neutral
// shell with a generic title and NO canonical, and vercel.json points the
// rewrite at it. The app still boots identically - it is the same bundle.
//
// The shell is deliberately not noindex: real app routes are served through it
// and manage their own robots meta via useSEO({ noindex: true }), and a blanket
// noindex here would be invisible to those pages but fatal if a marketing route
// ever fell through.
//
// It also carries no image preload. The shell serves unknown and app-only
// routes, none of which display the homepage hero, so preloading it there is
// the same wasted high-priority fetch this file removes from article pages.

PRELOAD_PATTERN.lastIndex = 0;
const shellHTML = baseWithoutOrgJsonLd
  // SITE_NAME is a module constant containing no "$", so this is safe today —
  // but "safe because a constant happens not to contain a character" is a fact
  // that changes silently. The arrow is the same mechanism replaceLiteral
  // wraps; it is written inline here only because this is a method chain.
  // Every other replacement in this chain is a pure literal and needs nothing.
  .replace(/<title>[^<]*<\/title>/, () => `<title>${SITE_NAME}</title>`)
  .replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="Klovers Korean Lovers Academy." />`
  )
  // No canonical, no og:url, no og:title: an unknown route must not claim to be
  // any particular page.
  .replace(/[ \t]*<meta property="og:title" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta property="og:description" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta name="twitter:title" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(/[ \t]*<meta name="twitter:description" content="[^"]*"\s*\/?>\n?/g, "")
  .replace(PRELOAD_PATTERN, "");

writeFileSync(join(DIST, "app.html"), shellHTML, "utf-8");
console.log("   Wrote dist/app.html (neutral shell for unmatched routes, no image preload).");

console.log(
  `\n✅ Prerendered ${created} routes ` +
    `(${MARKETING_ROUTES.length} marketing + ${blogRoutes.length} blog` +
    `${usedCache ? ", FROM CACHE" : ""}).`
);
console.log(`   ${withHreflang} blog routes have a real EN/AR partner and got hreflang.`);
console.log(`   /blog carries ${blogIndexLinks} article links in its raw HTML.`);
console.log(
  `   ${marketingBodiesWritten} marketing route(s) carry hand-written body copy ` +
    `(the rest keep an empty #root).`
);
console.log(
  `   ${articleBodiesWritten} article bodies rendered into raw HTML ` +
    `(${articleBodyChars.toLocaleString("en-US")} characters, ` +
    `avg ${articleBodiesWritten ? Math.round(articleBodyChars / articleBodiesWritten) : 0} per article).`
);
console.log(
  `   LCP preload: ${preloadRetargeted} route(s) retargeted to their own hero, ` +
    `${preloadDropped} dropped (no hero to preload). The homepage keeps its own.`
);

const orphans = blogRoutes.filter((r) => inboundCount.get(r.post.slug) === 0);
console.log(
  `   ${relatedLinksWritten} related-article links written across ${blogRoutes.length} articles ` +
    `(${orphans.length} still have nothing pointing at them).`
);
if (orphans.length) {
  console.log(`   orphans: ${orphans.map((r) => r.post.slug).join(", ")}`);
}
console.log("");
