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
  ABOUT_BODY_HTML,
  AFFILIATE_BODY_HTML,
  ARABIC_SPEAKERS_BODY_HTML,
  CONTACT_BODY_HTML,
  ENROLL_NOW_BODY_HTML,
  FAQ_BODY_HTML,
  HANGUL_STARTER_BODY_HTML,
  INTERVIEW_BODY_HTML,
  KDRAMAS_BODY_HTML,
  LEARN_HUNGARIAN_BODY_HTML,
  MARKETING_FAQ,
  PLACEMENT_TEST_BODY_HTML,
  SCHOLARSHIPS_BODY_HTML,
  TOPIK_BODY_HTML,
  WELCOME_BACK_BODY_HTML,
} from "./lib/marketing-bodies.mjs";
import {
  ARABIC_PAGES,
  ARABIC_FAQ,
  BLOG_INDEX_ARTICLES_MARKER,
  arabicTwinOf,
} from "./lib/arabic-pages.mjs";
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

/**
 * Blog author as JSON-LD (GEO-09, 27 Sep 2026). Posts Reham wrote carry a real
 * Person, so answer engines can tie the article to a named teacher. Every other
 * post is the one Klovers Organization with one spelling, "Klovers" (Arabic
 * "كلوفرز" as alternateName) - not "Klovers Team" / "فريق كلوفرز" / other
 * variants typed as six different organizations.
 */
const REHAM = "Reham Elshrkawy";
function blogAuthorLd(name) {
  if (name === REHAM) {
    return {
      "@type": "Person",
      name: REHAM,
      url: `${BASE_URL}/about`,
      jobTitle: "Korean language teacher, founder of Klovers",
      alumniOf: { "@type": "CollegeOrUniversity", name: "Faculty of Al-Alsun, Ain Shams University" },
    };
  }
  return { "@type": "Organization", name: SITE_NAME, alternateName: "كلوفرز", url: BASE_URL };
}
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;

/**
 * The <title> a route ships with (one source for the head and the emit loop).
 * One language per title: an Arabic title gets «كلوفرز», never Latin
 * "Klovers"; a title already naming the brand gets no suffix at all.
 * 5 Oct 2026 (re-score): 37 titles ran past 65 characters, almost all because
 * the " | Klovers" suffix pushed a long article title over. When the suffix
 * would do that, the title ships without it - the brand is already in the
 * og:site_name, the JSON-LD and the URL, and a cut-off title loses the words
 * a searcher actually reads.
 */
const TITLE_MAX = 65;
function brandTitle(title) {
  if (title.includes(SITE_NAME) || title.includes("كلوفرز")) return title;
  const full = /[؀-ۿ]/.test(title) ? `${title} | كلوفرز` : `${title} | ${SITE_NAME}`;
  return [...full].length > TITLE_MAX ? title : full;
}

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
// The "ten of the thirty" below is the one number here that can go stale
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
      <p>Klovers Korean Learning Games are free, interactive games for practising Korean in your browser — reading Hangul, matching vocabulary, unscrambling words, conjugating verbs and more. There is nothing to download and no sign-up is needed to start: ten of the thirty games are open to everyone. Signed-in learners earn XP for every round, build a daily streak and climb the leaderboard.</p>
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
<li><strong>Honorifics</strong> — Learn the polite and humble forms Koreans actually use</li>
<li><strong>Speech Levels</strong> — Convert between formal, polite and casual Korean</li>
<li><strong>Tense Shift</strong> — Rewrite a sentence in a different Korean tense</li>
<li><strong>Negative Forms</strong> — Tell 안, 못 and -지 않다 apart</li>
<li><strong>Error Catch</strong> — Find the mistake in a Korean sentence — or prove there isn't one</li>
<li><strong>Situation Pick</strong> — Choose the Korean phrase that fits the moment</li>
<li><strong>Grammar Patterns</strong> — Practise core Korean sentence patterns by level</li>
<li><strong>Dialogue Fill</strong> — Complete a real Korean conversation from context</li>
      </ul>
      <p>Prefer to read first? The <a href="/blog">Klovers Korean blog</a> covers Hangul, grammar, TOPIK preparation and Korean culture, and the <a href="/courses">Korean courses</a> take you from the alphabet to real conversation with a real teacher.</p>
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
      <p>Hanok villages · Wood, paper and a warm floor</p>
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
        <li>서울 (Seoul) — Seoul, the capital</li>
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

// ── Homepage body for crawlers without JavaScript ───────────────────────────
// Same tradeoff as GAMES_BODY_HTML: this text is DUPLICATED from the app
// (HeroSection, HowItWorks, MeetTeacher, MoreThanAClass). createRoot replaces
// it on boot, so visitors never see it; it exists so the raw HTML says what
// the page says. Keep it short and true - exactly one <h1>.
const HOME_BODY_HTML = `<div id="home-prerendered" lang="en" dir="ltr">
      <h1>Start Speaking Korean From Your First Live Class</h1>
      <p>Live online Korean classes with a real teacher, in small groups, and a clear path from beginner to confident conversation. Classes are taught in English or in Arabic.</p>
      <p><a href="/free-trial">Book a free class</a> or <a href="/placement-test">take the free placement test</a> to find your level.</p>
      <p>Live group classes are priced in US dollars, at $60 a month for 4 live classes. Some countries have local pricing - Egypt is priced in Egyptian pounds - and <a href="/pricing">the pricing page</a> shows the price for your country.</p>
      <h2>How we teach</h2>
      <ul>
        <li><strong>Clear explanations</strong> - every point explained simply, in English or Arabic.</li>
        <li><strong>Small groups</strong> - you speak in every class.</li>
        <li><strong>Instant feedback</strong> - pronunciation corrected live.</li>
        <li><strong>A clear path</strong> - Hangul first, then Levels 1 to 6.</li>
      </ul>
      <h2>Meet your teacher</h2>
      <p>Reham Elshrkawy has taught Korean for 13 years and has taught more than 200 students herself. She studied Korean language and literature at the Faculty of Al-Alsun.</p>
      <h2>More than live classes</h2>
      <ul>
        <li><a href="/review">Practice</a> - vocabulary review between classes.</li>
        <li><a href="/games">Korean learning games</a> - free practice for Hangul, vocabulary and grammar.</li>
        <li><a href="/journey/before-korea">Culture</a> - Korea's story, from the first legend to today.</li>
        <li><a href="/courses">Learning path</a> - Hangul, then Levels 1 to 6.</li>
        <li><a href="/blog">The Journal</a> - articles on Korean culture and study tips in English and Arabic.</li>
      </ul>
      <p><a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/about">About</a> · <a href="/faq">FAQ</a> · <a href="/contact">Contact</a></p>
    </div>`;

// The Arabic homepage at /ar (24 Sep 2026). The same page as HOME_BODY_HTML,
// said in Arabic. 27 Sep 2026: rewritten in neutral Modern Standard Arabic
// (Re's one-tone rule, 26 Sep) - no dialect and no verb aimed at the reader as
// male or female; links are verbal nouns. Same rules: duplicated from the app
// on purpose, verified facts only, exactly one <h1>.
const HOME_BODY_HTML_AR = `<div id="home-prerendered" lang="ar" dir="rtl">
      <h1>التحدث بالكورية من أول حصة مباشرة</h1>
      <p>حصص لغة كورية مباشرة عبر الإنترنت مع معلمة حقيقية، في مجموعات صغيرة، ومسار واضح من البداية حتى التحدث بثقة. تُقدَّم الحصص بالعربية أو بالإنجليزية.</p>
      <p><a href="/ar/free-trial">حجز حصة مجانية</a> أو <a href="/ar/placement-test">إجراء اختبار تحديد المستوى المجاني</a> لمعرفة المستوى.</p>
      <p>أسعار الحصص الجماعية بالدولار الأمريكي: ٦٠ دولارًا شهريًا مقابل ٤ حصص مباشرة. بعض البلدان لها سعر محلي - ومصر سعرها بالجنيه المصري - و<a href="/ar/pricing">صفحة الأسعار</a> تعرض سعر بلدك.</p>
      <h2>طريقة التدريس</h2>
      <ul>
        <li><strong>شرح واضح</strong> - تُشرح كل نقطة ببساطة، بالعربية أو بالإنجليزية.</li>
        <li><strong>مجموعات صغيرة</strong> - يشارك كل طالب بالكلام في كل حصة.</li>
        <li><strong>تصحيح فوري</strong> - يُصحَّح النطق مباشرةً أثناء الحصة.</li>
        <li><strong>مسار واضح</strong> - الهانغول أولًا، ثم المستويات من ١ إلى ٦.</li>
      </ul>
      <h2>المعلمة</h2>
      <p>تُدرّس ريهام الشرقاوي اللغة الكورية منذ ١٣ عامًا، ودرّست بنفسها أكثر من ٢٠٠ طالب. درست اللغة الكورية وآدابها في كلية الألسن.</p>
      <h2>أكثر من مجرد حصص</h2>
      <ul>
        <li><a href="/review">تدريب</a> - مراجعة الكلمات بين الحصص.</li>
        <li><a href="/games">ألعاب لتعلّم الكورية</a> - تدريب مجاني على الهانغول والمفردات والقواعد.</li>
        <li><a href="/journey/before-korea">الثقافة</a> - حكاية كوريا من أول أسطورة حتى اليوم.</li>
        <li><a href="/ar/courses">مسار التعلّم</a> - الهانغول، ثم المستويات من ١ إلى ٦.</li>
        <li><a href="/ar/blog">المجلة</a> - مقالات بالعربية عن الثقافة الكورية ونصائح للمذاكرة.</li>
      </ul>
      <p><a href="/ar/courses">الدورات</a> · <a href="/ar/pricing">الأسعار</a> · <a href="/ar/about">من نحن</a> · <a href="/ar/faq">الأسئلة الشائعة</a> · <a href="/contact">التواصل</a></p>
    </div>`;

// ── Courses / pricing / free-trial body fragments ─────────────────────────
//
// Added 25 Sep 2026 (audit 23 Sep, SEO1): the server HTML of these three
// pages had no body text and no h1, so crawlers that run no JavaScript saw
// empty pages. Same tradeoff as GAMES_BODY_HTML: the copy is DUPLICATED from
// src/pages/CoursesPage.tsx, PricingPage.tsx and FreeTrialPage.tsx - if you
// change those pages' facts, mirror them here. No prices on purpose: they
// depend on the visitor's country tier and currency. Trust figures, if ever
// added here, must match src/lib/trustFigures.ts.
const COURSES_BODY_HTML = `<div id="courses-prerendered" lang="en" dir="ltr">
      <h1>Korean Courses: from Hangul to Level 6</h1>
      <p>Live online Korean classes with a real teacher, in English or Arabic. Every class is 60 minutes, once a week. A level is 24 classes over 6 months - except Hangul Foundation, which is 4 classes.</p>
      <h2>Hangul Foundation (4 classes)</h2>
      <p>Read and write Korean from zero: the basic vowels and consonants and how a syllable is built; tense and aspirated consonants and combined vowels; the final consonant (batchim); pronunciation rules and your first sentences.</p>
      <h2>Levels 1 to 6 (24 classes, 6 months each)</h2>
      <ul>
        <li><strong>Level 1</strong> - greetings, the present and past, everyday sentences. Toward TOPIK 1.</li>
        <li><strong>Level 2</strong> - longer sentences, enough to handle a day on your own in Korean. Toward TOPIK 2.</li>
        <li><strong>Level 3</strong> - real topics, more complex grammar, formal and casual speech. Toward TOPIK 3.</li>
        <li><strong>Level 4</strong> - discussion, abstract topics, longer listening, structured writing. Toward TOPIK 4.</li>
        <li><strong>Level 5</strong> - nuance: tone, politeness and implication. Toward TOPIK 5.</li>
        <li><strong>Level 6</strong> - near-native comprehension. Toward TOPIK 6.</li>
      </ul>
      <h2>Also available</h2>
      <p>Reading &amp; Speaking practice for students who already have the grammar, and TOPIK exam preparation for a test date you have already booked.</p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

// /shop (Klovers Supply). Same tradeoff as GAMES_BODY_HTML: copy is DUPLICATED
// from src/pages/ShopPage.tsx (hero, shelf, "More than a file"). Products come
// from Stripe at runtime, so no product names or prices here.
const SHOP_BODY_HTML = `<div id="shop-prerendered" lang="en" dir="ltr">
      <h1>Pack Your Korean Journey.</h1>
      <p><strong>Learn it. Carry it. Live it.</strong></p>
      <p>By the courtyard gate, Lina keeps a bag ready for the next lesson. These are the books that go in it, made to take Korean beyond the classroom.</p>
      <h2>On the shelf</h2>
      <p>Klovers books and study goods for learning Korean. The first book on the shelf teaches Hangul from zero.</p>
      <h2>More than a file.</h2>
      <p>Every Klovers book bought here waits under My books in the student dashboard, next to the classes, the games and the review that Cluby keeps.</p>
      <h2>How digital books work</h2>
      <ul>
        <li>Books are digital files (PDF), ready to read on a phone, a tablet or paper once printed.</li>
        <li>After payment the book appears under My books in the student dashboard, where it can be downloaded again at any time.</li>
        <li>A downloaded file cannot be returned, so a book is not refunded once downloaded. The full price is refunded if the file does not work and cannot be fixed, or if the same book was paid for twice by mistake.</li>
      </ul>
      <h2>Free before you buy</h2>
      <p>The Hangul starter sheet is free to download, in English and in Arabic, and the first live class is free too.</p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/hangul-starter">Free Hangul starter sheet</a> · <a href="/courses">Courses</a> · <a href="/terms">Terms</a></p>
    </div>`;

// /journey (5 Oct 2026): the hub of the five era stations. Same order and
// words as ERAS in src/constants/eras.ts and the era routes below.
const JOURNEY_BODY_HTML = `<div id="journey-prerendered" lang="en" dir="ltr">
      <h1>A journey through Korea's time</h1>
      <p>Every Korean word comes from a real place and a real time. Five stations, from the first legend to today, each with its own words.</p>
      <ol>
        <li><h2><a href="/journey/before-korea">Before Korea</a></h2><p>Legend, to the 4th century CE. The legend of Dangun, the first kingdom of Gojoseon, four centuries of Chinese rule in the north, and the Three Kingdoms: where Korea's story begins.</p></li>
        <li><h2><a href="/journey/ancient-korea">Ancient Korea</a></h2><p>Silla, 57 BCE to 935 CE. The kingdom of gold crowns, star-watching towers and Buddhist temples that lasted almost a thousand years.</p></li>
        <li><h2><a href="/journey/joseon">The Joseon Era</a></h2><p>1392 to 1897. Kings, Confucian scholars, the yangban class, and King Sejong's invention of Hangul.</p></li>
        <li><h2><a href="/journey/traditional-life">Traditional Life</a></h2><p>Hanok villages. Inside the traditional Korean house: mountain-and-river placement, ondol floor heating, the cool maru hall, and clay tile roofs.</p></li>
        <li><h2><a href="/journey/modern-korea">Modern Korea</a></h2><p>1950s to today. Hallyu, the Korean wave: from Winter Sonata to Gangnam Style, Parasite and Squid Game, and why so many people now learn Korean.</p></li>
      </ol>
      <p>The first live class is free, in English or Arabic.</p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/blog">The Klovers journal</a> · <a href="/courses">Courses</a></p>
    </div>`;

const PRICING_BODY_HTML = `<div id="pricing-prerendered" lang="en" dir="ltr">
      <h1>Klovers Pricing &amp; Plans</h1>
      <p>Klovers prices are set by country tier and shown in your local currency on this page. Choose your country to see your tier and price.</p>
      <h2>Group classes</h2>
      <p>Small live groups, once a week, following the structured curriculum. Plans run for 1 month (4 classes), 3 months (12 classes) or 6 months (24 classes); longer plans cost less per month.</p>
      <h2>Private classes</h2>
      <p>One-to-one lessons with flexible scheduling, at your own pace.</p>
      <h2>What every plan includes</h2>
      <ul>
        <li>Live 60-minute classes with the teacher, once a week, in English or Arabic</li>
        <li>The structured path from Hangul Foundation to Level 6</li>
        <li>Group classes are recorded and shared with enrolled students, so a missed class can be caught up</li>
        <li>A student dashboard with attendance, current level and remaining classes, plus free practice games and vocabulary review</li>
        <li>A Klovers certificate of completion after each level</li>
      </ul>
      <h2>Payment and guarantee</h2>
      <p>Pay by Vodafone Cash or InstaPay (Egypt), or by card through Stripe. Payments in Egypt are checked before activation, and nothing is charged automatically. If you are not happy after your first paid class, we refund or rebook you. Full terms are on the <a href="/terms">Terms of Service</a> page.</p>
      <h2>Discounts and flexible payment</h2>
      <p>New students get 10% off their first enrollment, and returning students have their own offer on the <a href="/welcome-back">Welcome Back</a> page. Private students can reschedule a class with 24 hours' notice. To pay in installments, message us on WhatsApp.</p>
      <h2>Not sure which plan?</h2>
      <p>Start with the free trial class or the free placement test: both show which level fits, and the price page then shows that plan in your currency.</p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Free placement test</a> · <a href="/courses">Courses</a> · <a href="/faq">FAQ</a></p>
    </div>`;

const FREE_TRIAL_BODY_HTML = `<div id="free-trial-prerendered" lang="en" dir="ltr">
      <h1>Book Your Free Korean Class</h1>
      <p>Try Korean for free: one live 30-minute class with our teacher, in English or Arabic. No credit card and no account needed - pick a session, add your name, email and WhatsApp number, and we email you the class link.</p>
      <h2>What happens in your trial</h2>
      <ol>
        <li>A 30-minute sample class with our teacher</li>
        <li>A placement check to find your level</li>
        <li>Personal recommendations for your next step</li>
      </ol>
      <h2>Who the free class is for</h2>
      <p>Complete beginners who have never read Hangul, and learners who already know some Korean and want to find the right level. The class is taught in English or in Arabic: choose the session in your language.</p>
      <h2>What you need</h2>
      <ul>
        <li>A stable internet connection and a computer, tablet or phone</li>
        <li>About 30 minutes, and nothing to prepare: the class starts from 안녕하세요</li>
        <li>An email address for the class link, and a WhatsApp number for reminders</li>
      </ul>
      <h2>After the trial</h2>
      <p>There is nothing to pay and no obligation. If you want to continue, the teacher recommends a starting level, and the <a href="/pricing">pricing page</a> shows the plans in your currency. Not ready to book yet? The free <a href="/placement-test">placement test</a> and the <a href="/hangul-starter">Hangul starter sheet</a> are open to everyone.</p>
      <p><a href="/trial-booking">Pick your session</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/faq">FAQ</a></p>
    </div>`;

// ── Legal page body fragments ───────────────────────────────────────────────
//
// /privacy-policy and /terms (src/pages/PrivacyPolicyPage.tsx, TermsPage.tsx),
// added 2026-09-24. Same tradeoff as GAMES_BODY_HTML: the English text is
// DUPLICATED from those page files so a crawler that runs no JavaScript still
// reads the real policy, not an empty mount point. English only, as with the
// era pages - the live page serves Arabic on the client. If you edit the
// wording in either page file, mirror it here. Ampersands are escaped by hand.
const PRIVACY_BODY_HTML = `<div id="legal-prerendered" lang="en" dir="ltr">
      <h1>Privacy Policy</h1>
      <p>Last updated: 24 September 2026</p>
      <p>This policy explains what personal information Klovers collects when you use kloversegy.com and our classes, why we collect it, who we share it with, and the choices you have.</p>
      <h2>Who we are</h2>
      <p>Klovers is an online Korean academy operated from Egypt. You can reach us by email at kloversegy@gmail.com or on WhatsApp at +201010003084.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and password (the password is handled by our authentication provider), your site language, and optionally your Korean level. Your browser's time zone, and the country it indicates, are saved to your profile.</li>
        <li>Trial class bookings: your name, email, phone (WhatsApp) number, country, level, learning goal, the time slot you choose and your time zone.</li>
        <li>Enrolment and payment: the plan and schedule you choose and your country of residence. For manual payments, the payment method, payment date, the receipt you upload and any transaction reference. Card payments are made on Stripe's checkout page; we do not receive your card number.</li>
        <li>Learning activity: placement test answers and results, lesson progress, games and quiz scores, and class attendance.</li>
        <li>Interview-practice tools: the job title, experience and other details you enter.</li>
        <li>Messages: what you send us by email, WhatsApp or Telegram.</li>
        <li>Usage data: pages you visit and buttons you click on the site, the link or campaign that brought you (for example UTM tags and the referring page), and a random session identifier.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To run your classes and your account, and to give you access to lessons and practice tools.</li>
        <li>To manage trial bookings and send confirmations and class reminders.</li>
        <li>To review payments and activate your enrolment.</li>
        <li>To answer your questions and support you.</li>
        <li>To understand how the site is used and improve it, and to measure our advertising.</li>
        <li>To send occasional news about classes. Every such email has an unsubscribe link.</li>
      </ul>
      <h2>Cookies and analytics</h2>
      <p>On kloversegy.com we use Google Analytics 4 and the Meta Pixel to measure visits and the results of our advertising. These tools use cookies and similar technologies.</p>
      <p>The site also keeps a few small items in your browser's local storage: to keep you signed in, to remember your language and your answer to the cookie notice, and to link a visit to a later booking.</p>
      <p>You can block or delete cookies and local storage in your browser settings. Blocking them may sign you out or reset your preferences.</p>
      <h2>Who we share it with</h2>
      <p>We do not sell your personal information. We share it only with the service providers that run the site for us, and only for the purposes above:</p>
      <ul>
        <li>Supabase — accounts, database, file storage (such as payment receipts) and server functions.</li>
        <li>Vercel — website hosting.</li>
        <li>Google — Google Analytics 4, and Google Fonts, which loads the site's typefaces.</li>
        <li>Meta — the Meta Pixel, for measuring advertising.</li>
        <li>Resend — sending our emails.</li>
        <li>Stripe — card payments made through our checkout.</li>
        <li>An AI model provider, reached through an AI gateway — only the details you type into the interview-practice tools, to generate questions and feedback.</li>
        <li>WhatsApp and Telegram — when you choose to contact us there, those services' own policies apply.</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>We keep your information while your account is active. You can ask us to delete it at any time and we will do so, except where we must keep a record, for example of a payment.</p>
      <h2>Your rights</h2>
      <p>You can ask to see the personal information we hold about you, to correct it, or to delete it. Email us at kloversegy@gmail.com and we will reply.</p>
      <h2>Children</h2>
      <p>Learners under 18 need the consent of a parent or guardian to create an account or join classes.</p>
      <h2>Changes to this policy</h2>
      <p>If we change this policy, we will post the new version on this page and update the date at the top.</p>
      <h2>Contact</h2>
      <p>Questions about your privacy? Email kloversegy@gmail.com or message us on WhatsApp at +201010003084. See also our <a href="/terms">Terms of Service</a>.</p>
    </div>`;

const TERMS_BODY_HTML = `<div id="legal-prerendered" lang="en" dir="ltr">
      <h1>Terms of Service</h1>
      <p>Last updated: 1 October 2026</p>
      <p>These terms apply when you use kloversegy.com or take classes with Klovers. By creating an account or booking a class, you agree to them.</p>
      <h2>The service</h2>
      <p>Klovers teaches live online classes with a teacher, in groups or privately. The first trial class is free. The site also offers learning materials, a placement test and practice games.</p>
      <h2>Your account</h2>
      <p>Please give accurate details and keep your password private. You are responsible for what happens under your account. Learners under 18 need the consent of a parent or guardian.</p>
      <h2>Payments</h2>
      <p>We accept Vodafone Cash and InstaPay (Egypt) and card payment through Stripe.</p>
      <p>Payments in Egypt are checked by hand before your enrolment is activated; card payments through Stripe are activated automatically. Every payment is one-time, with no automatic charges.</p>
      <h2>First class guarantee and refunds</h2>
      <p>If you are not satisfied after your first class, we will refund you or rebook you — no questions asked.</p>
      <p>After that, refunds are prorated for unused sessions.</p>
      <h2>Digital books from the shop</h2>
      <p>Books in the Klovers shop are digital files (PDF). A downloaded file cannot be returned, so a book is not refunded once it has been downloaded.</p>
      <p>We refund the full price if the file does not work and we cannot fix it, or if the same book was paid for twice by mistake. To ask, message us on WhatsApp at +201010003084.</p>
      <p>When a payment is refunded, the book is removed from My books.</p>
      <h2>Missed classes</h2>
      <p>Group classes are recorded and shared with enrolled students. Private students can reschedule with 24 hours' notice.</p>
      <h2>Conduct</h2>
      <p>Please be respectful to teachers and other students. We may remove anyone from a class, or close an account, for harassment, abuse or disruptive behaviour.</p>
      <h2>Course materials</h2>
      <p>Lessons, recordings, textbooks and other materials are for your personal learning only. Please do not share, sell or republish them.</p>
      <h2>Changes to these terms</h2>
      <p>We may update these terms. The current version is always on this page, with the date it was last updated at the top.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Email kloversegy@gmail.com or message us on WhatsApp at +201010003084. See also our <a href="/privacy-policy">Privacy Policy</a>.</p>
    </div>`;

/**
 * The homepage has a real translation: "/" (English) and "/ar" (Arabic). Both
 * routes carry this pair and buildHeadTags emits the same reciprocal hreflang
 * cluster on each - every member names every member, itself included.
 * api/sitemap.xml.js carries the same pair; keep the two in step.
 */
const HOME_ALTERNATES = { en: "/", ar: "/ar" };

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
    //
    // 23 Sep 2026 (CRO pass): the English head says what is sold - live
    // online classes, small groups, a real teacher - with no Arabic
    // positioning; the Arabic brand name stays in the JSON-LD alternateName in
    // index.html. (Superseded 24 Sep 2026: Arabic now has its own URL, /ar,
    // below, with its own head and a reciprocal hreflang pair.)
    //
    // 23 Sep 2026: two equal markets now, English and Arabic speakers, so the
    // title no longer says "in Arabic" only. Later the same day the title went
    // back to leading with the brand and the description to carrying كلوفرز
    // in prose, because scripts/lib/brand-identity.test.mjs guards exactly
    // that and the CRO pass had broken it.
    // 27 Sep 2026 (Re): one language per page — the English description is
    // English only. The Arabic name stays in the JSON-LD alternateName and
    // leads the /ar title.
    //
    // `body` gives crawlers that never run JavaScript the page's real text
    // (the review measured 76 characters of body text in the raw HTML).
    path: "/",
    title: "Klovers — Live Online Korean Classes in Small Groups",
    description:
      "Klovers: live, interactive Korean classes with a real teacher, in small groups. Free trial class, free placement test and gamified practice.",
    body: HOME_BODY_HTML,
    alternates: HOME_ALTERNATES,
    // The homepage shares as the Seoul skyline, not as the 1:1 logo. useSEO
    // already set this at runtime (DEFAULT_IMAGE in src/hooks/useSEO.ts), so a
    // scraper that ran JavaScript and one that did not saw two different
    // cards. The static HTML now carries the same 1200x630 image, with the
    // dimensions, so the card is right before anything loads.
    image: "/og-seoul-skyline.jpg",
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: "Seoul skyline at dusk",
  },
  {
    // The Arabic homepage (24 Sep 2026) - the "/ar" half of the pair above,
    // and the end of docs/DECISIONS.md 2026-08-19 (hreflang, Option B) for the
    // homepage: Arabic finally has a URL of its own, so it can have a head, a
    // canonical and hreflang instead of a ?lang=ar query on the English page.
    //
    // `lang: "ar"` makes the document itself Arabic (<html lang="ar"
    // dir="rtl">, og:locale ar_AR) via languageOf in document-language.mjs.
    // `homeTwin` keeps the Organization JSON-LD and the hero preload that the
    // emit loop otherwise keeps for "/" only - it is the same page.
    //
    // The title leads with «كلوفرز» (Arabic only, no Latin "Klovers" - one
    // language per page), so the emit loop appends no suffix.
    path: "/ar",
    lang: "ar",
    homeTwin: true,
    title: "كلوفرز — حصص كورية مباشرة في مجموعات صغيرة",
    description:
      "كلوفرز: حصص كورية مباشرة عبر الإنترنت مع معلمة حقيقية، في مجموعات صغيرة، بالعربية أو بالإنجليزية. حصة تجريبية مجانية واختبار تحديد مستوى مجاني.",
    body: HOME_BODY_HTML_AR,
    alternates: HOME_ALTERNATES,
    // Same skyline and dimensions as "/" above. Only the alt text is Arabic -
    // one language per page (Re, 27 Sep 2026).
    image: "/og-seoul-skyline.jpg",
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: "أفق مدينة سيول عند الغروب",
  },
  {
    path: "/courses",
    title: "Korean Courses",
    description:
      "Klovers Korean courses: Hangul in four classes, then Levels 1 to 6. Live classes with a teacher, once a week, in English or Arabic.",
    body: COURSES_BODY_HTML,
  },
  {
    path: "/pricing",
    title: "Pricing & Plans",
    description:
      "Klovers prices are set by country. Group classes once a week: 1, 3 or 6 months (4, 12 or 24 classes). Private classes too.",
    body: PRICING_BODY_HTML,
  },
  {
    path: "/about",
    title: "About Us: Meet Your Korean Teacher",
    description:
      "Klovers was founded by Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years and more than 200 students.",
    body: ABOUT_BODY_HTML,
    pageLd: { "@type": "AboutPage", mainEntity: { "@id": `${BASE_URL}/#organization` } },
  },
  {
    path: "/contact",
    title: "Contact Us: Questions About Korean Classes",
    description:
      "Get in touch with Klovers about Korean courses, enrollment or any other question. Send a message or write to us on WhatsApp and we will reply.",
    body: CONTACT_BODY_HTML,
    pageLd: { "@type": "ContactPage", mainEntity: { "@id": `${BASE_URL}/#organization` } },
  },
  {
    path: "/faq",
    title: "Korean Classes FAQ: Levels, Schedule and Payment",
    description:
      "Got questions about learning Korean with Klovers? Find answers about courses, the teacher, scheduling, and payments.",
    body: FAQ_BODY_HTML,
    faq: MARKETING_FAQ["/faq"],
  },
  {
    path: "/enroll-now",
    title: "Enroll in Korean Classes | Klovers",
    description:
      "Join Klovers: choose your class type and schedule, then start speaking Korean with confidence in live online classes with a real teacher.",
    body: ENROLL_NOW_BODY_HTML,
  },
  {
    // Sign-in required (EnrollPage sends a visitor without a session to
    // /login), so the static HTML says noindex too, like the page itself.
    path: "/enroll",
    title: "Enroll Now",
    description:
      "Enroll in a Klovers Korean course: choose a plan, a duration and a payment method.",
    noindex: true,
  },
  {
    // The 3D world (28 Sep 2026). Not indexed - WorldPage sets noindex and
    // this keeps it - but a shared link used to preview as a bare "Klovers".
    // Same words as WORLD_COPY.en in src/game/config/copy.ts; there is no
    // Arabic URL for the world, so the head is English only.
    path: "/world",
    title: "Klovers World",
    description:
      "Walk the hanok courtyard where the clover egg sleeps, then through the gate into Hangul Village.",
    noindex: true,
  },
  {
    path: "/placement-test",
    title: "Korean Placement Test",
    description:
      "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.",
    body: PLACEMENT_TEST_BODY_HTML,
    pageLd: {
      "@type": "Quiz",
      name: "Free Korean Language Placement Test",
      educationalAlignment: {
        "@type": "AlignmentObject",
        alignmentType: "educationalLevel",
        educationalFramework: "TOPIK",
      },
      provider: { "@id": `${BASE_URL}/#organization` },
    },
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
    // Matches the title the page sets in the browser (the audit found the
    // two differing). It names Klovers, so no " | Klovers" suffix is added.
    title: "Book Your Free Korean Class",
    description:
      "Try a free 30-minute live Korean class at Klovers, in English or Arabic. No credit card and no account needed - pick a session and we email you the link.",
    body: FREE_TRIAL_BODY_HTML,
  },
  {
    path: "/affiliate",
    title: "Affiliate Program",
    description:
      "Join the Klovers affiliate program. Earn 20% of each referred student's first payment for our Korean language courses.",
    body: AFFILIATE_BODY_HTML,
    faq: MARKETING_FAQ["/affiliate"],
  },
  {
    path: "/blog",
    // Same title and description as BlogPage's useSEO (27 Sep 2026 scan).
    title: "Klovers Journal: Discover Korea, Learn Korean",
    description:
      "Articles, words, stories and experiences about Korea and the Korean language — a six-stop journey with Klovers.",
  },
  {
    path: "/learn-korean-arabic-speakers",
    title: "Learn Korean for Arabic Speakers",
    description:
      "Learning Korean from Arabic: what Arabic already gives you, what is new, and the Klovers path from Hangul to Level 6 with a teacher who explains in Arabic.",
    body: ARABIC_SPEAKERS_BODY_HTML,
    // faq removed 27 Sep 2026: the page shows no FAQ section, and FAQPage
    // markup must describe questions visitors can see.
    articleLd: true,
    published: "2026-04-08",
    modified: "2026-09-25",
  },
  {
    path: "/topik-exam-preparation",
    title: "TOPIK Exam Preparation: Format, Scoring & Study Plan",
    description:
      "How the TOPIK exam works: TOPIK I and II, sections, timing and the score for each level, plus the Klovers TOPIK track with past papers and writing practice.",
    body: TOPIK_BODY_HTML,
    // faq removed 27 Sep 2026 (no visible FAQ section).
    articleLd: true,
    published: "2026-04-08",
    modified: "2026-09-25",
  },
  {
    path: "/learn-korean-kdramas",
    title: "Learn Korean Through K-Dramas",
    description:
      "A simple way to study Korean with K-dramas: one scene at a time, Korean subtitles, shadowing and a phrase notebook, with live classes to fill in the grammar.",
    body: KDRAMAS_BODY_HTML,
    // faq removed 27 Sep 2026 (no visible FAQ section).
    articleLd: true,
    published: "2026-04-08",
    modified: "2026-09-25",
  },
  {
    path: "/learn-hungarian",
    title: "Learn Hungarian in Arabic or English — with Reham Elshrkawy",
    description:
      "One-on-one online Hungarian lessons, explained in Arabic or English, with a teacher who lived in Budapest and knows exactly what a beginner needs — for a move, a Hungarian scholarship, or a Hungarian family.",
    body: LEARN_HUNGARIAN_BODY_HTML,
    articleLd: false,
    published: "2026-10-19",
    modified: "2026-10-19",
  },
  // Added in A1 — live routes that were missing from the prerender list.
  {
    path: "/interview-training",
    title: "Korean Interview Training — AI-Powered | Klovers",
    description:
      "Practice Korean job interview questions with AI-generated personalized Q&A. Get 2 free questions, upgrade for more.",
    body: INTERVIEW_BODY_HTML,
  },
  {
    path: "/welcome-back",
    title: "Welcome Back — Returning Students Offer",
    description:
      "Returning Klovers students get 20% off their next enrollment, plus extra savings when friends join. Pick up where you left off.",
    body: WELCOME_BACK_BODY_HTML,
    faq: MARKETING_FAQ["/welcome-back"],
  },
  // Korean scholarships (4 Oct 2026). The Arabic twin is built from
  // scripts/lib/arabic-pages.mjs below, like the other seven pairs.
  {
    path: "/scholarships",
    title: "Korean Scholarships: Six Official Programmes",
    description:
      "Six official Korean scholarships: GKS, KAIST, the Korea Foundation, KOICA and exchange. What each covers, who qualifies, when to apply and the official source.",
    body: SCHOLARSHIPS_BODY_HTML,
  },
  {
    path: "/hangul-starter",
    title: "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description:
      "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
    body: HANGUL_STARTER_BODY_HTML,
  },
  // Klovers Supply (27 Sep 2026). Products come from Stripe at runtime, so
  // only the shop's own head is prerendered here; product pages set theirs
  // client-side (canonical + Product JSON-LD) in src/pages/ShopProductPage.tsx.
  // Listed in api/sitemap.xml.js since 28 Sep 2026 (PR #741).
  {
    path: "/shop",
    title: "Klovers Supply — Korean Books and Study Goods",
    description:
      "Klovers books and study goods that take Korean beyond the classroom. Digital books go straight to My books in the student dashboard.",
    body: SHOP_BODY_HTML,
  },
  // "Journey through Korea's time" — five era pages, added 2026-09-22. IDs and
  // all copy come from src/constants/eras.ts (ERAS); keep this list in step
  // with it and with STATIC_PAGES in api/sitemap.xml.js. `image` and `body`
  // are additive fields buildHeadTags/the emit loop only read for routes that
  // set them, so this cannot change behavior for any of the routes above.
  {
    // The hub (5 Oct 2026). /journey used to answer 404 while its five
    // stations existed; src/pages/JourneyHubPage.tsx renders the same list.
    path: "/journey",
    title: "A Journey Through Korea's Time",
    description:
      "Five stations of Korean history: the Dangun legend, Silla, the Joseon era and Hangul, the hanok house, and today's Korean wave.",
    image: "/assets/story/world-culture-street.webp",
    body: JOURNEY_BODY_HTML,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
  },
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
    published: "2026-09-22",
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
    published: "2026-09-22",
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
    published: "2026-09-22",
  },
  {
    path: "/journey/traditional-life",
    title: "Traditional Life",
    description:
      "Inside the hanok, the traditional Korean house: mountain-and-river placement, ondol floor heating, the cool maru hall, and clay tile roofs.",
    image: "/assets/blog/korean-hanok.jpg",
    body: ERA_TRADITIONAL_LIFE_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
    published: "2026-09-22",
  },
  {
    path: "/journey/modern-korea",
    title: "Modern Korea",
    description:
      "Hallyu, the Korean wave: from the 1990s to Winter Sonata, Gangnam Style, Parasite and Squid Game, and why so many people now learn Korean.",
    image: "/assets/story/world-culture-street.webp",
    body: ERA_MODERN_KOREA_BODY,
    breadcrumb: [{ name: "Home", item: BASE_URL }],
    articleLd: true,
    published: "2026-09-22",
  },
  // Legal pages, added 2026-09-24. The footer and the cookie banner linked to
  // both while neither route existed. Keep in step with STATIC_PAGES in
  // api/sitemap.xml.js.
  {
    path: "/privacy-policy",
    title: "Privacy Policy",
    description:
      "How Klovers collects, uses and protects your personal information, which services we share it with, and how to access or delete it.",
    body: PRIVACY_BODY_HTML,
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description:
      "The terms for Klovers' live online Korean classes: accounts, payments, the first class guarantee, refunds, missed classes and conduct.",
    body: TERMS_BODY_HTML,
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

// ── Arabic twins (GEO-03, 27 Sep 2026) ───────────────────────────────────────
// Six marketing pages get their own Arabic URL, "/ar" + the English path, on
// the model of the homepage pair: each English route gains the en/ar pair, and
// an Arabic route is added with its own head (lang ar, Arabic title and
// description) and its own Arabic body. Copy and the page list live in
// scripts/lib/arabic-pages.mjs.
//
// 28 Sep 2026: the blog index is the seventh pair. /ar/blog's body is the
// Arabic shell from arabic-pages.mjs with the Arabic article list (from the
// database, fetched above) written where the marker sits.
// Every indexable marketing page carries at least a page-level JSON-LD node
// (5 Oct 2026 re-score: 17 pages shipped none). Routes that already declare
// pageLd, articleLd or an FAQ keep theirs; the rest get a plain typed page
// that names Klovers as publisher. The Arabic twins inherit it below with
// inLanguage "ar".
const DEFAULT_PAGE_TYPE = {
  "/courses": "CollectionPage",
  "/blog": "Blog",
  "/shop": "CollectionPage",
  "/journey": "CollectionPage",
};
for (const route of MARKETING_ROUTES) {
  if (route.pageLd || route.articleLd || route.faq || route.noindex) continue;
  if (route.path === "/" || route.homeTwin) continue;
  route.pageLd = {
    "@type": DEFAULT_PAGE_TYPE[route.path] || "WebPage",
    publisher: { "@id": `${BASE_URL}/#organization` },
  };
}

for (const route of MARKETING_ROUTES) {
  const ar = arabicTwinOf(route.path);
  if (ar) route.alternates = { en: route.path, ar };
}
for (const page of ARABIC_PAGES) {
  const en = MARKETING_ROUTES.find((r) => r.path === page.path);
  if (!en) throw new Error(`arabic-pages.mjs names ${page.path}, which has no English route here`);
  let body = page.body;
  if (page.path === "/blog") {
    if (!body.includes(BLOG_INDEX_ARTICLES_MARKER)) {
      throw new Error("arabic-pages.mjs /blog body lost its article-list marker");
    }
    body = replaceLiteral(body, BLOG_INDEX_ARTICLES_MARKER, buildArabicBlogListHtml(blogRoutes));
  }
  MARKETING_ROUTES.push({
    path: `/ar${page.path}`,
    lang: "ar",
    title: page.title,
    description: page.description,
    body,
    alternates: { en: page.path, ar: `/ar${page.path}` },
    ...(page.path === "/faq" ? { faq: ARABIC_FAQ } : {}),
    ...(en.pageLd ? { pageLd: { ...en.pageLd, inLanguage: "ar" } } : {}),
    // The three landing pages are Articles in English; their twins are too
    // (5 Oct 2026: they shipped with no JSON-LD at all).
    ...(en.articleLd ? { articleLd: true, published: en.published, modified: en.modified } : {}),
  });
}

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
 *
 * 28 Sep 2026: one language per page. /blog lists the English articles only
 * and is English only; the Arabic articles are listed on /ar/blog, whose body
 * is the Arabic shell in scripts/lib/arabic-pages.mjs with the list from
 * buildArabicBlogListHtml written into it. Every published article is still
 * linked from exactly one of the two indexes.
 */
// Function declarations, not consts: the Arabic twin loop above calls
// buildArabicBlogListHtml before this point in the module is evaluated.
function isArabicPost(r) {
  return r.post.lang === "ar";
}

function blogIndexItemsHtml(rows) {
  return rows
    .map(
      (r) => `        <li>
          <a href="${attr(r.path)}">${text(r.title)}</a>
          <p>${text(excerpt(r.description))}</p>
        </li>`
    )
    .join("\n");
}

function buildBlogIndexHtml(routes) {
  const rows = routes.filter((r) => !isArabicPost(r));
  return `<div id="blog-index-prerendered" lang="en" dir="ltr">
      <h1>Klovers Journal</h1>
      <p>Articles, words, stories and experiences about Korea and the Korean language.</p>
      <section>
        <h2>All articles (${rows.length})</h2>
        <ul>
${blogIndexItemsHtml(rows)}
        </ul>
      </section>
    </div>`;
}

/** The Arabic article list for /ar/blog (same wording as AllArticles.tsx). */
function buildArabicBlogListHtml(routes) {
  const rows = routes.filter(isArabicPost);
  const count = rows.length.toLocaleString("ar-EG");
  return `<p>كل المقالات، من الأحدث إلى الأقدم — ${count} مقالة.</p>
      <ul>
${blogIndexItemsHtml(rows)}
      </ul>`;
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
  // One language per title: an Arabic title gets «كلوفرز», never Latin
  // "Klovers"; a title already naming the brand gets no suffix at all.
  const fullTitle = brandTitle(route.title);
  const description = route.description || "";
  // route.image is opt-in (only the /journey/:eraId routes set it so far) and
  // falls back to the same DEFAULT_IMAGE every other marketing route already
  // got, so this changes nothing for a route that does not set it.
  const image = absoluteUrl(isPost ? route.post.heroImage : route.image || null);
  const imageAlt = isPost && route.post.heroAlt ? route.post.heroAlt : route.imageAlt || SITE_NAME;
  // Dimensions are opt-in per route, like `image` itself. index.html
  // deliberately ships no og:image:width/height/type because one document is
  // copied to every route and cannot know each one's size; a route that DOES
  // know its image can say so here. Without these, Facebook and X reflow the
  // card when the image finally loads, which is the layout jump the tags exist
  // to prevent.
  const imageDims =
    route.imageWidth && route.imageHeight
      ? [
          `  <meta property="og:image:width" content="${attr(route.imageWidth)}" />`,
          `  <meta property="og:image:height" content="${attr(route.imageHeight)}" />`,
          `  <meta property="og:image:type" content="image/jpeg" />`,
        ]
      : [];

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
    ...imageDims,
    `  <meta property="og:locale" content="${ogLocaleOf(lang)}" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:image" content="${attr(image)}" />`,
  ];

  // A marketing route with a real translation - today only the homepage pair,
  // "/" and "/ar". Same rules as the blog clusters below: the tags are
  // identical on both members, each names both itself and its partner, and
  // x-default is the English page.
  if (!isPost && route.alternates) {
    const en = `${BASE_URL}${route.alternates.en}`;
    const ar = `${BASE_URL}${route.alternates.ar}`;
    tags.push(`  <link rel="alternate" hreflang="en" href="${attr(en)}" />`);
    tags.push(`  <link rel="alternate" hreflang="ar" href="${attr(ar)}" />`);
    tags.push(`  <link rel="alternate" hreflang="x-default" href="${attr(en)}" />`);
    tags.push(
      `  <meta property="og:locale:alternate" content="${ogLocaleOf(otherLanguage(lang))}" />`
    );
  }

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
        author: blogAuthorLd(p.author),
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
        ...(route.published ? { datePublished: route.published } : {}),
        ...(route.modified || route.published
          ? { dateModified: route.modified || route.published }
          : {}),
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

  // GEO audit 25 Sep 2026: FAQPage and a page-type block for marketing
  // routes, server-side. Before this they existed only as scripts the page
  // appends in the browser, which no AI crawler ever sees. The FAQ items come
  // from scripts/lib/marketing-bodies.mjs, the same file as the visible
  // prerendered text, so the markup always matches the page. The client-side
  // copies are removed on arrival by src/lib/jsonLdDedupe.ts, so a browser
  // never ends up with two FAQPage blocks.
  if (!isPost && Array.isArray(route.faq) && route.faq.length) {
    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: route.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      })
    );
  }

  if (!isPost && route.pageLd) {
    tags.push(
      jsonLd({
        "@context": "https://schema.org",
        ...route.pageLd,
        url,
        name: route.pageLd.name || fullTitle,
        description,
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
  // One language per title: an Arabic title gets «كلوفرز», never Latin
  // "Klovers"; a title already naming the brand gets no suffix at all.
  const fullTitle = brandTitle(route.title);
  const description = route.description || "";
  // "/ar" is the homepage in Arabic: it keeps what "/" keeps (the Organization
  // JSON-LD and the hero preload) but is written to dist/ar/index.html.
  const isHomeTwin = isHome || route.homeTwin === true;

  let html = isHomeTwin ? baseHTML : baseWithoutOrgJsonLd;

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
  // A route that must never be indexed (sign-in pages, the 3D world) says so
  // in the static HTML as well, not only after the app boots.
  if (route.noindex) {
    html = replaceLiteral(
      html,
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }

  // The LCP preload. index.html ships one pointing at the homepage hero, and
  // this loop copies that document to every route — so without this, all 189
  // article pages tell the browser to fetch, at the highest priority, an image
  // they never render, competing with the one they do. The homepage keeps its
  // own tag; an article gets its own hero; anything else loses the tag, because
  // a preload aimed at the wrong file is worse than none at all.
  if (!isHomeTwin) {
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
    blogIndexLinks = blogRoutes.filter((r) => !isArabicPost(r)).length;
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
    `<meta name="description" content="Klovers." />`
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
console.log(
  `   /blog carries ${blogIndexLinks} English and /ar/blog ` +
    `${blogRoutes.filter(isArabicPost).length} Arabic article links in their raw HTML.`
);
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
