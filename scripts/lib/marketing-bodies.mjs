/**
 * marketing-bodies.mjs - crawler-visible body copy for the marketing routes
 * that used to ship an empty #root (GEO audit, 25 Sep 2026: 12 routes served
 * 0 words, no <h1> and no JSON-LD to any crawler that runs no JavaScript -
 * GPTBot, ClaudeBot and PerplexityBot among them).
 *
 * Same contract as GAMES_BODY_HTML in prerender-meta.mjs: the copy is
 * DUPLICATED from the page components and the English strings in
 * src/i18n/translations.ts, on purpose, so this post-build step never depends
 * on the client bundle. Exactly one <h1> per fragment (the emit loop asserts
 * it). Ampersands are escaped by hand; nothing here contains "$" or a
 * backtick, and the test next to this file keeps it that way.
 *
 * /topik-exam-preparation once said LESS than the live page, because the old
 * live copy carried a wrong score table and a past exam date. The page was
 * rewritten with NIIED's cut-offs, and since 28 Sep 2026 the fragment mirrors
 * its English copy (same h1, sections and guide link).
 * /learn-korean-arabic-speakers and /learn-korean-kdramas were in that list
 * until their pages were rewritten on 25 Sep 2026; since 28 Sep both
 * fragments mirror the live English copy.
 * /affiliate (one-off 20% commission, no "recurring" promise) and
 * /interview-training (AI without a vendor name, no locked demo) mirror the
 * live pages since 28 Sep 2026.
 *
 * FAQ arrays feed the server-side FAQPage JSON-LD for the same routes, so the
 * markup matches the questions the page shows.
 */

export const ABOUT_BODY_HTML = `<div id="about-prerendered" lang="en" dir="ltr">
      <h1>About Klovers</h1>
      <p>An Al-Alsun Korean graduate who has taught Korean for 13 years, making the language accessible to Arabic and English speakers.</p>
      <ul>
        <li><strong>13+</strong> Years Teaching</li>
        <li><strong>200+</strong> Students Taught</li>
        <li><strong>5.0</strong> from 7 Google reviews</li>
        <li><strong>Hangul to Level 6</strong> Levels</li>
      </ul>
      <h2>Reham's Story</h2>
      <p>Klovers was founded by Reham, a passionate Korean language educator who discovered her love for Korean through K-Drama and K-Pop. After years of studying and teaching Korean, she created Klovers to make Korean language education accessible, structured, and enjoyable for students worldwide. What started as small tutoring sessions has grown to 200+ students taught over 13 years.</p>
      <h2>Teaching Philosophy</h2>
      <p>At Klovers, we believe language learning should be interactive, structured, and fun. Our methodology focuses on practical conversation skills from day one, combined with solid grammar foundations. We use real-world content like K-Drama dialogues and K-Pop lyrics to make learning engaging and culturally enriching.</p>
      <h2>Experience &amp; Credentials</h2>
      <ul>
        <li>13+ years of Korean language teaching experience (2013 – Present)</li>
        <li>200+ students taught over 13 years</li>
        <li>Specialized in making Korean accessible to all backgrounds</li>
        <li>TOPIK exam preparation</li>
        <li>Curriculum designed for all levels from Hangul to Advanced</li>
        <li>Live interactive teaching methodology</li>
      </ul>
      <h2>Learn with a teacher who has taught 200+ students over 13 years</h2>
      <p>Not sure where to begin? Take our free placement test and find where to start.</p>
      <p><a href="/placement-test">Take the free placement test</a> · <a href="/pricing">View Pricing</a> · <a href="/free-trial">Book a free trial class</a> · <a href="/courses">Courses</a> · <a href="/faq">FAQ</a></p>
    </div>`;

export const CONTACT_BODY_HTML = `<div id="contact-prerendered" lang="en" dir="ltr">
      <h1>Contact Us</h1>
      <p>Have questions? We'd love to hear from you. Messages go straight to the teacher, Reham, and we reply by WhatsApp or email. All classes are live and online, so you can join from any country.</p>
      <h2>What you can ask us about</h2>
      <ul>
        <li>Which level fits you and where to start</li>
        <li>Group class times and private class scheduling</li>
        <li>Payment in Egypt and outside Egypt</li>
        <li>Digital books in the shop and under My books</li>
        <li>TOPIK exam preparation</li>
      </ul>
      <h2>Email</h2>
      <p>kloversegy@gmail.com</p>
      <h2>Contact on WhatsApp</h2>
      <p>The fastest way to reach us. <a href="https://wa.me/201010003084">wa.me/201010003084</a></p>
      <h2>WhatsApp Community</h2>
      <p>Community chat and updates. <a href="https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq">WhatsApp Community</a></p>
      <h2>Or send us a message</h2>
      <ul>
        <li>Your Name</li>
        <li>Your Email</li>
        <li>Subject</li>
        <li>Your Message</li>
      </ul>
      <h2>Ready to Start Your Korean Journey?</h2>
      <p>Your first class is free. Meet your teacher, see how the class works, and decide if Klovers is right for you. No credit card · 30 minutes · A real teacher.</p>
      <ul>
        <li><strong>200+</strong> Students taught by Reham</li>
        <li><strong>5.0</strong> from 7 Google reviews</li>
        <li><strong>EN · AR</strong> Classes in English or Arabic</li>
      </ul>
      <p><strong>Satisfaction Guarantee:</strong> If your first paid class isn't right for you, we refund or rebook.</p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/pricing">Pricing</a> · <a href="/faq">FAQ</a> · <a href="/about">About Klovers</a></p>
    </div>`;

export const FAQ_BODY_HTML = `<div id="faq-prerendered" lang="en" dir="ltr">
      <h1>Korean Language Course FAQ</h1>
      <p>Everything you need to know about learning Korean with Klovers</p>
      <h2>Getting Started</h2>
      <h3>Do I need prior knowledge of Korean to enroll?</h3>
      <p>Not at all! Klovers offers a dedicated Hangul beginner course designed for absolute beginners. You'll learn the Korean alphabet (Hangul) from scratch, then progress through vocabulary, grammar, and conversation — step by step.</p>
      <h3>How do I know which level is right for me?</h3>
      <p>Take the free placement test: reading questions in TOPIK style, from Hangul up to Level 4. It shows where to start, and you can stop when the questions get too hard.</p>
      <h3>Can I switch between group and private classes?</h3>
      <p>Yes, you can switch your plan type when you renew. Contact us and we'll help you move smoothly to your preferred class format.</p>
      <h2>Classes &amp; Schedule</h2>
      <h3>Are classes online or in-person?</h3>
      <p>All Klovers classes are conducted 100% online via live video sessions. You can join from anywhere in the world — all you need is a stable internet connection and a computer or tablet.</p>
      <h3>What is the class schedule like?</h3>
      <p>Group classes are held once per week. The exact day and time are coordinated with your group to find the most convenient slot. Private classes offer fully flexible scheduling based on your availability.</p>
      <h3>How many students are in a group class?</h3>
      <p>Our group classes are kept small. This ensures every student gets personal attention, practice time, and feedback from the teacher.</p>
      <h3>What's the difference between group and private classes?</h3>
      <p>Group classes (once/week) let you learn alongside peers in a collaborative environment at an affordable price. Private classes (1-on-1) offer personalized lessons, flexible scheduling, and faster progression tailored to your goals.</p>
      <h2>Payment &amp; Pricing</h2>
      <h3>What payment methods do you accept?</h3>
      <p>In Egypt: Vodafone Cash or InstaPay with a receipt upload (activated after a manual check), or card payment through Stripe (activated automatically). Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically.</p>
      <h3>Can I pay in installments?</h3>
      <p>Plans are 1, 3 or 6 months, and longer plans cost less per class. For paying in installments or another flexible arrangement, message us on WhatsApp.</p>
      <h2>Progress &amp; Certification</h2>
      <h3>Do I get a certificate after completing a course?</h3>
      <p>Yes! Upon successfully completing your course level, you'll receive a Klovers certificate of completion. It can be added to your CV or LinkedIn profile.</p>
      <h3>How is my progress tracked?</h3>
      <p>Your student dashboard shows your attendance history, current level, and remaining sessions. The teacher also provides regular feedback on your speaking, reading, and writing skills throughout the course.</p>
      <h3>Is Klovers suitable for TOPIK preparation?</h3>
      <p>Yes. Classes cover the TOPIK exam format and include practice questions for the reading, listening and writing sections of TOPIK I and II.</p>
      <h2>Still have questions?</h2>
      <p>The teacher is happy to help. Reach out or start your Korean journey today!</p>
      <p><a href="https://wa.me/201010003084">WhatsApp</a> · <a href="https://t.me/+Fu5T7d4wLMsxNDY9">Telegram</a> · <a href="/enroll-now">Start Now</a></p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/pricing">Pricing</a> · <a href="/contact">Contact us</a></p>
    </div>`;

export const ENROLL_NOW_BODY_HTML = `<div id="enroll-now-prerendered" lang="en" dir="ltr">
      <h1>Choose Your Plan</h1>
      <p>Select your class type, country, and duration.</p>
      <p><strong>5.0</strong> on Google (7 reviews) · <strong>200+</strong> students taught over 13 years · <strong>Hangul to Level 6</strong></p>
      <h2>Enroll in three steps</h2>
      <ol>
        <li><strong>Choose Plan</strong> — pick Group Classes (learn with others) or Private Classes (1-on-1 sessions), your country, and a duration. Your pricing tier is set by your country.</li>
        <li><strong>Schedule</strong> — Schedule Preferences: help us find the best time for your classes. Choose your Korean level, timezone and preferred day. Private classes are only available on days without group classes.</li>
        <li><strong>Pay &amp; Enroll</strong> — Review &amp; Pay. In Egypt: Vodafone Cash or InstaPay with a receipt upload (activated after a manual check), or card payment through Stripe (activated automatically). Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically.</li>
      </ol>
      <p>Your schedule will be confirmed within 24 hours after payment.</p>
      <h2>What happens next?</h2>
      <ol>
        <li><strong>Payment confirmed</strong> — Card payments are confirmed at once; transfers in Egypt after the receipt is checked.</li>
        <li><strong>Schedule matched</strong> — We confirm your class slot within 24 h.</li>
        <li><strong>First class!</strong> — We send your meeting link — ready to learn!</li>
      </ol>
      <p>Need help enrolling? <a href="https://wa.me/201010003084">WhatsApp us</a></p>
      <p><a href="/pricing">Pricing</a> · <a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/faq">FAQ</a></p>
    </div>`;

export const PLACEMENT_TEST_BODY_HTML = `<div id="placement-test-prerendered" lang="en" dir="ltr">
      <h1>Find your Korean level</h1>
      <p><strong>Free · no sign-up.</strong> Reading questions in the real TOPIK formats. One test of 52 questions, easiest first, covering levels 1 to 4 — and once the questions are past you, you can finish it yourself.</p>
      <h2>The levels this test measures</h2>
      <ul>
        <li>Hangul (한글 기초)</li>
        <li>Level 1 (1급)</li>
        <li>Level 2 (2급)</li>
        <li>Level 3 (3급)</li>
        <li>Level 4 (4급)</li>
      </ul>
      <p>You answer what you can and your total decides the level, the way TOPIK's own cut scores work — no section ends the test on you.</p>
      <h2>How the test works</h2>
      <ul>
        <li>Questions in the real TOPIK reading formats</li>
        <li>52 questions — and you can finish early</li>
        <li>Close it and come back — saved</li>
        <li>No dictionary, no translator</li>
      </ul>
      <h2>Sign in first so your result is saved</h2>
      <p>You can start without it — we'll ask again at the end. Your level is set from your total score in the sections you saw, the same way TOPIK compares your total with a cut score.</p>
      <h2>I can't read Hangul yet — show me my level</h2>
      <p>No questions — this takes you straight to your result. Not being able to read the Korean letters yet is not a fail — it is exactly the level we start from.</p>
      <h2>Want a sharper placement?</h2>
      <p>Add a writing sample and a short voice recording, and your teacher reviews them before your first class. Completely optional. Nothing here is auto-graded — your teacher reviews it.</p>
      <h2>After your result</h2>
      <p>See your level and answer breakdown, save your result, pick your group time, or book your free trial. You can also download a shareable card or certificate, or retake the test.</p>
      <p><a href="/free-trial">Book a free trial</a> · <a href="/hangul-starter">Free Hangul starter sheet</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/topik-exam-preparation">TOPIK exam preparation</a></p>
    </div>`;

export const AFFILIATE_BODY_HTML = `<div id="affiliate-prerendered" lang="en" dir="ltr">
      <h1>Earn 20% Commission on Every Student You Refer</h1>
      <p><strong>Affiliate Program.</strong> Partner with Klovers: a unique link to share, and 20% of each new student's first payment.</p>
      <ul>
        <li><strong>20%</strong> commission rate</li>
        <li><strong>200+</strong> students taught over 13 years</li>
        <li><strong>30 days</strong> cookie duration</li>
      </ul>
      <h2>How It Works</h2>
      <ol>
        <li><strong>Apply</strong> — Join our affiliate program — it takes 2 minutes.</li>
        <li><strong>Share</strong> — Get a unique referral link to share with friends.</li>
        <li><strong>Earn</strong> — Get paid for every student who enrolls via your link.</li>
      </ol>
      <h2>Apply to Join</h2>
      <p>No minimum followers required. We welcome all content creators. Tell us your name, email, platform or channel, and approximate audience size. We'll review your application and email you your unique affiliate link within 24 hours.</p>
      <p>Commission paid monthly via bank transfer or PayPal.</p>
      <h2>Frequently Asked Questions</h2>
      <h3>Who can apply?</h3>
      <p>Anyone with an audience interested in learning Korean — YouTubers, TikTokers, bloggers, language teachers, or even students who love to share.</p>
      <h3>How do I get paid?</h3>
      <p>We pay 20% of the enrollment fee once the student completes their first payment. Payments are processed monthly.</p>
      <h3>How do I track my referrals?</h3>
      <p>After approval we'll send you a unique referral link. Every signup through that link is tracked for 30 days.</p>
      <h3>Is there a minimum payout threshold?</h3>
      <p>We pay out any amount above 10 US dollars. Balances below that roll over to the next month.</p>
      <p><a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/free-trial">Free trial</a> · <a href="/placement-test">Placement test</a> · <a href="/contact">Contact</a></p>
    </div>`;

export const ARABIC_SPEAKERS_BODY_HTML = `<div id="learn-korean-arabic-speakers-prerendered" lang="en" dir="ltr">
      <h1>Learning Korean when your first language is Arabic</h1>
      <p>Some of it will feel familiar, some of it is new. Here is which is which, and how we teach it — with explanations in Arabic.</p>
      <h2>What Arabic already gives you</h2>
      <h3>Endings that show a word's job</h3>
      <p>Arabic case endings tell you which word is the subject and which is the object. Korean does the same job with small particles after the word — 는 for the topic, 을/를 for the object.</p>
      <p>Arabic: <span lang="ar" dir="rtl">أقرأُ الكتابَ</span> · Korean: <span lang="ko">나는 책을 읽어요</span> (나 (I) + 는 · 책 (book) + 을 · 읽어요 (read))</p>
      <h3>Speaking politely changes the verb</h3>
      <p>Arabic speakers already switch register — <span lang="ar" dir="rtl">حضرتك</span> or <span lang="ar" dir="rtl">إنت</span>, <span lang="ar" dir="rtl">فصحى</span> or <span lang="ar" dir="rtl">عامية</span>. Korean builds politeness into the verb ending, so the idea is familiar even though the form is new.</p>
      <p>Arabic: <span lang="ar" dir="rtl">إزيّك؟ / إزيّ حضرتك؟</span> · Korean: <span lang="ko">안녕? / 안녕하세요?</span> (casual / polite)</p>
      <h2>What will be new</h2>
      <ul>
        <li>The verb comes last. Korean sentences end with the verb: 나는 책을 읽어요 is literally "I the-book read".</li>
        <li>Adjectives come before the noun: 빨간 책 (red book), where Arabic says <span lang="ar" dir="rtl">كتاب أحمر</span>.</li>
        <li>Hangul is read left to right, in syllable blocks. It has 24 basic letters and is quick to learn — we teach it in four classes.</li>
        <li>Some sounds need practice: Arabic has no P, so ㅂ and ㅍ are easy to mix up, and Korean has three kinds of each stop (ㄱ ㅋ ㄲ).</li>
      </ul>
      <h2>The path at Klovers</h2>
      <ul>
        <li><strong>Hangul Foundation</strong> — 4 classes · read and write from zero</li>
        <li><strong>Levels 1 to 6</strong> — 24 classes per level, about 6 months each</li>
        <li><strong>One class a week</strong> — 60 minutes, live, in a small group or privately</li>
      </ul>
      <p>Your teacher is Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for 13 years. She explains in Arabic or English and compares Korean with Arabic wherever that makes a point clearer. In Egypt: Vodafone Cash or InstaPay with a receipt upload (activated after a manual check), or card payment through Stripe (activated automatically). Outside Egypt: card payment through Stripe, activated automatically.</p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/placement-test">Find your level</a> · <a href="/courses">See all levels</a> · <a href="/pricing">Pricing</a> · <a href="/blog/korean-for-arabic-speakers-difficulty-guide">Is Korean hard for Arabic speakers?</a></p>
    </div>`;

export const TOPIK_BODY_HTML = `<div id="topik-exam-preparation-prerendered" lang="en" dir="ltr">
      <h1>How the TOPIK exam works, and how to prepare</h1>
      <p>The two tests, their sections and timing, the score each level needs, and a realistic way to get ready.</p>
      <h2>Two tests, six levels</h2>
      <h3>TOPIK I</h3>
      <p>Levels 1–2 · scored out of 200</p>
      <ul>
        <li>Listening — 30 questions, 40 minutes</li>
        <li>Reading — 40 questions, 60 minutes</li>
        <li>All multiple choice · 100 minutes in total</li>
      </ul>
      <h3>TOPIK II</h3>
      <p>Levels 3–6 · scored out of 300</p>
      <ul>
        <li>Listening — 50 questions, 60 minutes</li>
        <li>Writing — 4 questions (51–54), 50 minutes</li>
        <li>Reading — 50 questions, 70 minutes</li>
      </ul>
      <table><tr><th>Paper</th><th>Level</th><th>Minimum score</th></tr><tr><td>TOPIK I (out of 200)</td><td>Level 1</td><td>80</td></tr><tr><td>TOPIK I (out of 200)</td><td>Level 2</td><td>140</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 3</td><td>120</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 4</td><td>150</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 5</td><td>190</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 6</td><td>230</td></tr></table>
      <p>Your level is decided by your total score, not by any single section. Results are valid for two years. The level a university, employer or visa asks for depends on them — check their own requirement.</p>
      <h2>Exam dates and registration</h2>
      <p>TOPIK is held several times a year, but which sessions run, where, and when registration opens differs by country. We don't list dates here because they change — the official site always has the current ones: <a href="https://www.topik.go.kr" rel="noopener">topik.go.kr</a>.</p>
      <h2>How to prepare</h2>
      <h3>Take a past paper first</h3>
      <p>Sit one full past paper under real timing. It shows which section is costing you points.</p>
      <h3>Build the vocabulary the exam uses</h3>
      <p>Most lost points in reading and listening are unknown words, not unknown grammar.</p>
      <h3>Practise writing 51–54 on its own</h3>
      <p>Each question has a set format. Short answers, a graph description and a 600–700 character essay all need separate practice.</p>
      <h3>Finish with timed full papers</h3>
      <p>In the last weeks, full papers under exam timing, then review every wrong answer.</p>
      <p>Past papers are published free on the official TOPIK site.</p>
      <h2>The Klovers TOPIK track</h2>
      <p>Exam technique, for a TOPIK date you have already put in the calendar. Taught live by Reham, in English or Arabic.</p>
      <ul>
        <li>Past papers under real exam timing</li>
        <li>Listening and reading strategy</li>
        <li>Writing: questions 51–54</li>
        <li>A study plan up to your exam date</li>
      </ul>
      <p>Classes cover the syllabus. Reaching exam standard needs study between them.</p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/placement-test">Find your level first</a> · <a href="/courses">See the TOPIK track</a> · <a href="/blog/topik-exam-guide">Read the full TOPIK guide</a></p>
    </div>`;

export const KDRAMAS_BODY_HTML = `<div id="learn-korean-kdramas-prerendered" lang="en" dir="ltr">
      <h1>Learn Korean from the dramas you already watch</h1>
      <p><strong>Culture Street · K-dramas.</strong> Watching alone will not teach you Korean, but studying one scene at a time will. Here is a way to do it that you can repeat with any show.</p>
      <h2>One scene at a time</h2>
      <ol>
        <li><strong>Watch for the story</strong> — First watch with subtitles in your language. Enjoy it — you need to know what happens before you can study how it is said.</li>
        <li><strong>Pick one short scene</strong> — Choose two or three minutes you liked. Short enough to replay many times.</li>
        <li><strong>Replay it with Korean subtitles</strong> — Pause on each line. Write down the words and endings you recognise, and look up the rest.</li>
        <li><strong>Say the lines out loud</strong> — Repeat each line after the actor, copying the rhythm. Then try the scene with no subtitles at all.</li>
        <li><strong>Keep a phrase notebook</strong> — One line per phrase: the Korean, what it means, the scene it came from, and one sentence of your own with it.</li>
      </ol>
      <h3>A notebook line looks like this</h3>
      <p><span lang="ko">정말이야?</span> — "Really?" — a character hears surprising news.</p>
      <p>Mine: <span lang="ko">정말이야? 내일 시험이야?</span> (Really? The exam is tomorrow?)</p>
      <h2>Choosing a drama to study</h2>
      <h3>Easier to start with</h3>
      <p>Modern stories set at work, at school or at home, with standard Seoul speech and everyday conversation — romantic comedies and slice-of-life shows are a good fit.</p>
      <h3>Better saved for later</h3>
      <p>Historical dramas (old-fashioned speech), shows in strong regional dialects, and fast thrillers full of slang or technical words — medical, legal, military.</p>
      <h2>Where live classes fit</h2>
      <ul>
        <li>Dramas give you listening and real phrases. A class explains the grammar behind them.</li>
        <li>You can bring a line you did not understand and ask about it.</li>
        <li>One live class a week, plus a scene or two between classes, is a pace most people can keep.</li>
      </ul>
      <h2>Bring a scene to your first class</h2>
      <p>The first class is free. Meet your teacher, try a real class, and ask about a line from the drama you are watching.</p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/placement-test">Find your level</a> · <a href="/blog/best-kdrama-learn-korean-difficulty-ranked">Drama picks by difficulty</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

export const LEARN_HUNGARIAN_BODY_HTML = `<div id="learn-hungarian-prerendered" lang="en" dir="ltr">
      <h1>Learn Hungarian, explained in Arabic or English</h1>
      <p><strong>Hungarian lessons · Cairo to Budapest.</strong> I lived in Budapest, studied Hungarian at Ain Shams University on a Balassi Institute scholarship, and have been teaching it ever since. I know what it's like to hold a form in Hungarian and not understand it — I'd rather be the person who explains the next one.</p>
      <h2>Who these lessons are for</h2>
      <ul>
        <li>Moving to Hungary for work, study or family</li>
        <li>Applying for a Balassi Institute or Stipendium Hungaricum scholarship</li>
        <li>Married into, or dating into, a Hungarian family</li>
        <li>Just curious about a language almost nobody around you speaks</li>
      </ul>
      <h2>How lessons work</h2>
      <ol>
        <li><strong>A free 20-minute call</strong> — We talk about why you're learning Hungarian and where you're starting from — zero is completely fine.</li>
        <li><strong>Lessons explained in Arabic or English</strong> — Hungarian grammar is unlike Arabic or English, so every rule is explained in a language you already think in — not in Hungarian itself.</li>
        <li><strong>Built around what you actually need</strong> — Scholarship paperwork, everyday survival phrases, or conversation with family — the lessons follow your actual situation, not a fixed textbook order.</li>
      </ol>
      <h2>Not a textbook — a guide who's done this</h2>
      <p>Between Cairo and Budapest I spent years learning Hungarian the hard way, long before I taught it to anyone. I also worked for years doing Korean-Arabic interpreting and international operations, so I know what it means when a deadline or a document genuinely has to be right.</p>
      <p>I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013 — Hungarian lessons follow the same one-on-one, real-conversation approach.</p>
      <p><a href="/contact?subject=Hungarian+lessons">Message me about lessons</a> · <a href="/blog/meet-reham-hungarian-arabic-korean-teacher">Read my story</a></p>
    </div>`;

export const LEARN_ENGLISH_BODY_HTML = `<div id="learn-english-prerendered" lang="en" dir="ltr">
      <h1>Learn English, explained in Arabic</h1>
      <p><strong>English lessons · real conversation, not just grammar.</strong> I've used English professionally for years — interpreting, international operations, and running an academy that teaches across three languages. I know exactly where Arabic speakers get stuck, because I've watched it happen for years, not guessed at it.</p>
      <h2>Who these lessons are for</h2>
      <ul>
        <li>Need English for work, interviews, or a new job</li>
        <li>Preparing for IELTS, TOEFL, or study abroad</li>
        <li>Can read fairly well but freeze up when speaking</li>
        <li>Traveling, moving abroad, or just want real conversational fluency</li>
      </ul>
      <h2>How lessons work</h2>
      <ol>
        <li><strong>A free 20-minute call</strong> — We talk about why you're learning English and where you're starting from — beginner to advanced, it's fine either way.</li>
        <li><strong>Grammar explained in Arabic, practice in English</strong> — Rules that never quite made sense in a classroom get explained plainly in Arabic first, then practiced out loud until they're automatic.</li>
        <li><strong>Built around what you actually need</strong> — Job interviews, exam sections, or everyday conversation — the lessons follow your actual situation, not a fixed textbook order.</li>
      </ol>
      <h2>Not a textbook — a guide who's done this</h2>
      <p>Years of Korean-Arabic interpreting and international operations meant English was never optional for me — it was the language a deadline or a document had to be right in. That's the same standard I bring to a lesson.</p>
      <p>I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013 — English lessons follow the same one-on-one, real-conversation approach.</p>
      <p><a href="/contact?subject=English+lessons">Message me about lessons</a> · <a href="/blog/meet-reham-hungarian-arabic-korean-teacher">Read my story</a></p>
    </div>`;

export const INTERVIEW_BODY_HTML = `<div id="interview-training-prerendered" lang="en" dir="ltr">
      <h1>Ace Your Korean Job Interview</h1>
      <p><strong>AI-Powered · 면접 준비.</strong> Get personalized Korean interview questions with model answers, pronunciation guides, and text-to-speech — all tailored to your skills. Start free with 2 questions.</p>
      <h2>How It Works</h2>
      <ol>
        <li><strong>Add Your Skills</strong> — Enter your job title, experience, industry, and languages you speak.</li>
        <li><strong>Get Questions</strong> — AI generates personalized Korean interview Q&amp;A pairs with translations and pronunciation.</li>
        <li><strong>Practice &amp; Master</strong> — Listen with text-to-speech, practice slowly, and master your Korean answers.</li>
      </ol>
      <h2>Your Skills &amp; Background</h2>
      <p>Enter your target job title (for example Software Engineer, Data Analyst or Marketing Manager), your years of experience, your industry, and the languages you speak. Industries include Technology, Finance &amp; Banking, Healthcare, Education, Manufacturing, Hospitality &amp; Tourism, Logistics &amp; Supply Chain, Retail &amp; E-commerce and more. A free account is required to generate questions.</p>
      <h2>Unlock 5 More Questions</h2>
      <p>Get 5 additional AI-generated interview questions personalized to your skills — with Korean translations, romanization, and text-to-speech. A one-time purchase.</p>
      <h2>Why practice with Klovers</h2>
      <ul>
        <li><strong>AI-Powered</strong> — Tailored Q&amp;A, generated with AI</li>
        <li><strong>Korean + English</strong> — Bilingual with romanization</li>
        <li><strong>Interview Ready</strong> — Real Korean interview format</li>
        <li><strong>200+ students taught</strong> — 13 years teaching</li>
      </ul>
      <p><a href="/courses">Courses</a> · <a href="/placement-test">Placement test</a> · <a href="/free-trial">Free trial</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

export const WELCOME_BACK_BODY_HTML = `<div id="welcome-back-prerendered" lang="en" dir="ltr">
      <h1>Returning Students Offer: 20% Off</h1>
      <p><strong>Welcome Back, Klovers!</strong> Returning students get 20% off — enroll now and pick up where you left off.</p>
      <h2>Share with Friends &amp; Save More</h2>
      <p>Earn extra discounts when you refer friends or classmates to Klovers.</p>
      <ul>
        <li><strong>+5% per friend</strong> — For each friend who enrolls, you get an extra 5% off</li>
        <li><strong>+2% per visitor</strong> — 2% more for each person who opens your link, even if they don't enroll</li>
        <li><strong>Up to 35% total</strong> — Stack referrals on top of your 20% base — max 35% off</li>
      </ul>
      <h2>Your Exclusive Offer</h2>
      <ul>
        <li>20% off your next enrollment</li>
        <li>Use code KLOVERSOLDSTUDENT1 at checkout</li>
        <li>Valid for group and private classes, all tiers</li>
      </ul>
      <h2>How to Enroll</h2>
      <ol>
        <li><strong>Choose Your Course</strong> — Browse our group and private class options at your level.</li>
        <li><strong>Apply Your Promo Code</strong> — Enter KLOVERSOLDSTUDENT1 at checkout for 20% off.</li>
        <li><strong>Start Learning!</strong> — Join your class and continue your Korean journey.</li>
      </ol>
      <p>Not sure of your level? Take our free placement test — it's completely optional.</p>
      <h2>What's at Klovers now</h2>
      <ul>
        <li><strong>Hangul Foundation</strong> — A four-class course for reading and writing from zero.</li>
        <li><strong>Practice between classes</strong> — Vocabulary review and free games for Hangul, words and grammar.</li>
        <li><strong>Korea's story</strong> — Five short culture stations, from the first legend to today.</li>
        <li><strong>TOPIK track</strong> — Past papers, strategy and writing practice for a set exam date.</li>
      </ul>
      <h2>Frequently Asked Questions</h2>
      <h3>Is the placement test required?</h3>
      <p>No! The placement test is completely optional. If you already know your level, you can enroll directly.</p>
      <h3>Can I combine this with other discounts?</h3>
      <p>The returning student code replaces the first-time 10% discount but stacks with referral bonuses up to the 35% cap.</p>
      <h3>How long is the promo code valid?</h3>
      <p>The code is valid for the current enrollment cycle. Contact us on WhatsApp if you need an extension.</p>
      <h3>How does the referral program work?</h3>
      <p>Share your link with friends: +5% for each friend who enrolls and +2% for each person who opens the link without enrolling. Referral bonuses go up to 15%, so the total discount can reach 35%.</p>
      <h3>What if I forgot my previous level?</h3>
      <p>Take our free placement test to find your current level. It's quick and completely optional.</p>
      <h2>Ready to Continue?</h2>
      <p>Your 20% discount is waiting. Enroll now and rejoin the Klovers community. Use code KLOVERSOLDSTUDENT1 at checkout.</p>
      <p><a href="/enroll-now">Enroll now</a> · <a href="/placement-test">Placement test</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

export const HANGUL_STARTER_BODY_HTML = `<div id="hangul-starter-prerendered" lang="en" dir="ltr">
      <h1>Free Hangul Starter Sheet</h1>
      <p><strong>Hangul Village · the first gate.</strong> Every sign in the village is written in these letters. Here they all are on one page, with the right sound for each. Print it, keep it, and read the first sign today.</p>
      <p><a href="/hangul-starter-en.pdf">Download the free PDF</a> · <a href="/hangul-starter-ar.pdf">Arabic edition (PDF)</a> · <a href="/free-trial">Book a free class</a></p>
      <h2>How Korean syllable blocks work</h2>
      <p>Korean is written in syllable blocks: each block is one syllable, a consonant plus a vowel, sometimes with a final consonant. Examples: 가 = ㄱ + ㅏ ("ga"); 한 = ㅎ + ㅏ + ㄴ ("han"); 국 = ㄱ + ㅜ + ㄱ ("guk").</p>
      <h2>Basic Consonants (14)</h2>
      <p>ㄱ g / k (가 ga) · ㄴ n (나 na) · ㄷ d / t (다 da) · ㄹ r / l (라 ra) · ㅁ m (마 ma) · ㅂ b / p (바 ba) · ㅅ s (사 sa) · ㅇ – / ng (아 a) · ㅈ j (자 ja) · ㅊ ch (차 cha) · ㅋ k (카 ka) · ㅌ t (타 ta) · ㅍ p (파 pa) · ㅎ h (하 ha)</p>
      <h2>Double Consonants (5)</h2>
      <p>ㄲ kk (까 kka) · ㄸ tt (따 tta) · ㅃ pp (빠 ppa) · ㅆ ss (싸 ssa) · ㅉ jj (짜 jja)</p>
      <h2>Basic Vowels (10)</h2>
      <p>ㅏ a (아) · ㅑ ya (야) · ㅓ eo (어) · ㅕ yeo (여) · ㅗ o (오) · ㅛ yo (요) · ㅜ u (우) · ㅠ yu (유) · ㅡ eu (으) · ㅣ i (이)</p>
      <h2>Compound Vowels (11)</h2>
      <p>ㅐ ae (애) · ㅒ yae (얘) · ㅔ e (에) · ㅖ ye (예) · ㅘ wa (와) · ㅙ wae (왜) · ㅚ oe (외) · ㅝ wo (워) · ㅞ we (웨) · ㅟ wi (위) · ㅢ ui (의)</p>
      <h2>Three facts that make the village easy</h2>
      <ul>
        <li>King Sejong had Hangul designed in 1443 so that anyone could learn to read quickly.</li>
        <li>Many consonants are drawn from the shape the mouth makes to say them.</li>
        <li>No need to memorize it all first: at Klovers the alphabet is four live classes with the teacher.</li>
      </ul>
      <p><strong>Start with a real teacher, free.</strong></p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/placement-test">Placement test</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/blog">Blog</a></p>
    </div>`;


/**
 * Scholarships in Korea (4 Oct 2026).
 *
 * Mirrors src/constants/koreaScholarships.ts and the live page. It carries no
 * monthly allowance for GKS or KOICA on purpose: both funding bodies publish
 * their amounts in an annual PDF guideline rather than in HTML, and the
 * official university pages disagree with each other on the GKS figure, so the
 * fragment states what is covered and links to the provider instead of quoting
 * a number a reader might plan around. The KAIST, Korea Foundation and GKS
 * exchange figures ARE printed, because a single provider page states each one.
 */
export const SCHOLARSHIPS_BODY_HTML = `<div id="scholarships-prerendered" lang="en" dir="ltr">
      <h1>Scholarships in Korea: six official programmes</h1>
      <p>Six Korean government and university scholarships, what each one covers, who qualifies and when to apply — every card linked to the funding body's own page. Facts verified on 4 October 2026.</p>
      <h2>Global Korea Scholarship (GKS)</h2>
      <p>Two tracks: undergraduate for applicants under 25, graduate for applicants under 40. The award covers round-trip airfare, a full year of Korean language training, tuition, a monthly allowance and health insurance, and no TOPIK level is required to apply. Egypt holds its own annual quota on both tracks, and applications go through the Korean embassy or directly to a GKS-designated university. For Egypt the embassy window ran 15–30 September in the 2026 cycle.</p>
      <h3>What the page does not print</h3>
      <p>The monthly allowance is set out in NIIED's annual guideline PDF, not on its website, and official university pages quote different figures for the same year. Read the current guideline for the number that applies to your cycle.</p>
      <h2>KAIST Scholarship</h2>
      <p>Tuition exempt for eight semesters, KRW 350,000 a month, and medical insurance — granted automatically to every admitted international undergraduate, provided the student keeps a GPA above 2.7 out of 4.3 after the first year. Instruction is in English, and no TOPIK level is required.</p>
      <h2>Korean Language Training Fellowship — The Korea Foundation</h2>
      <p>A language-only fellowship, not a degree: six months extendable to twelve, with a monthly living allowance, a one-time travel allowance, tuition and health insurance. The Middle East is named as an eligible region, and applicants must already understand and speak basic Korean.</p>
      <h2>KOICA Scholarship Program</h2>
      <p>A fully funded master's for public-sector officials, with official government nomination required, running seventeen months. KOICA re-issues the list of eligible countries every year, so it has to be confirmed with the KOICA office or the Korean embassy in Cairo before applying.</p>
      <h2>GKS Exchange Students Program</h2>
      <p>One semester in Korea with a monthly allowance and round-trip economy airfare, for students enrolled at a university that holds an agreement with a designated Korean university, in a degree exchange programme. Students cannot apply directly: their home university nominates them.</p>
      <h2>The route, in five steps</h2>
      <ol>
        <li><strong>Choose the track:</strong> embassy or university, each with its own deadline.</li>
        <li><strong>Read the current guideline:</strong> the annual PDF carries the amounts and the eligible-country list.</li>
        <li><strong>Sort the language proof:</strong> GKS does not ask for TOPIK at application and includes a language year; KOICA and KAIST run in English.</li>
        <li><strong>Prepare the documents:</strong> transcripts, apostilled certificates, recommendation letters and a study plan.</li>
        <li><strong>Watch the deadlines:</strong> undergraduate applications close around September–October, graduate around February–March.</li>
      </ol>
      <p>Dates and amounts are re-issued every cycle. Confirm them on the official page before you plan around them.</p>
      <h2>Official sources</h2>
      <ul>
        <li><a href="https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1" rel="noopener">NIIED / Study in Korea — the GKS programmes</a></li>
        <li><a href="https://overseas.mofa.go.kr/eg-ko/brd/m_11508/view.do?seq=1343892" rel="noopener">Korean Embassy in Cairo — Egypt's quotas</a></li>
        <li><a href="https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist" rel="noopener">KAIST — scholarship page</a></li>
        <li><a href="https://kf.or.kr/kfEng/cm/cntnts/cntntsView.do?cntntsId=1637&amp;mi=2221" rel="noopener">The Korea Foundation — Korean Language Training Fellowship</a></li>
        <li><a href="https://www.koica.go.kr/ciat/7806/subview.do" rel="noopener">KOICA — Scholarship Program</a></li>
        <li><a href="https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab3" rel="noopener">GKS Exchange Students Program</a></li>
      </ul>
      <p><a href="/free-trial">Start with the language</a> · <a href="/placement-test">Find your level</a> · <a href="/courses">See the levels</a> · <a href="/blog/topik-exam-guide">Read the TOPIK guide</a></p>
    </div>`;

export const MARKETING_FAQ = {
  "/faq": [
    {
        "q": "Do I need prior knowledge of Korean to enroll?",
        "a": "Not at all! Klovers offers a dedicated Hangul beginner course designed for absolute beginners. You'll learn the Korean alphabet (Hangul) from scratch, then progress through vocabulary, grammar, and conversation — step by step."
    },
    {
        "q": "How do I know which level is right for me?",
        "a": "Take the free placement test: reading questions in TOPIK style, from Hangul up to Level 4. It shows where to start, and you can stop when the questions get too hard."
    },
    {
        "q": "Are classes online or in-person?",
        "a": "All Klovers classes are conducted 100% online via live video sessions. You can join from anywhere in the world — all you need is a stable internet connection and a computer or tablet."
    },
    {
        "q": "What is the class schedule like?",
        "a": "Group classes are held once per week. The exact day and time are coordinated with your group to find the most convenient slot. Private classes offer fully flexible scheduling based on your availability."
    },
    {
        "q": "How many students are in a group class?",
        "a": "Our group classes are kept small. This ensures every student gets personal attention, practice time, and feedback from the teacher."
    },
    {
        "q": "What's the difference between group and private classes?",
        "a": "Group classes (once/week) let you learn alongside peers in a collaborative environment at an affordable price. Private classes (1-on-1) offer personalized lessons, flexible scheduling, and faster progression tailored to your goals."
    },
    {
        "q": "What payment methods do you accept?",
        "a": "In Egypt: Vodafone Cash or InstaPay with a receipt upload (activated after a manual check), or card payment through Stripe (activated automatically). Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically."
    },
    {
        "q": "Can I pay in installments?",
        "a": "Plans are 1, 3 or 6 months, and longer plans cost less per class. For paying in installments or another flexible arrangement, message us on WhatsApp."
    },
    {
        "q": "Do I get a certificate after completing a course?",
        "a": "Yes! Upon successfully completing your course level, you'll receive a Klovers certificate of completion. It can be added to your CV or LinkedIn profile."
    },
    {
        "q": "How is my progress tracked?",
        "a": "Your student dashboard shows your attendance history, current level, and remaining sessions. The teacher also provides regular feedback on your speaking, reading, and writing skills throughout the course."
    },
    {
        "q": "Can I switch between group and private classes?",
        "a": "Yes, you can switch your plan type when you renew. Contact us and we'll help you move smoothly to your preferred class format."
    },
    {
        "q": "Is Klovers suitable for TOPIK preparation?",
        "a": "Yes. Classes cover the TOPIK exam format and include practice questions for the reading, listening and writing sections of TOPIK I and II."
    }
],
  "/affiliate": [
    {
        "q": "Who can apply?",
        "a": "Anyone with an audience interested in learning Korean — YouTubers, TikTokers, bloggers, language teachers, or even students who love to share."
    },
    {
        "q": "How do I get paid?",
        "a": "We pay 20% of the enrollment fee once the student completes their first payment. Payments are processed monthly."
    },
    {
        "q": "How do I track my referrals?",
        "a": "After approval we'll send you a unique referral link. Every signup through that link is tracked for 30 days."
    },
    {
        "q": "Is there a minimum payout threshold?",
        "a": "We pay out any amount above 10 US dollars. Balances below that roll over to the next month."
    }
],
  "/welcome-back": [
    {
        "q": "Is the placement test required?",
        "a": "No! The placement test is completely optional. If you already know your level, you can enroll directly."
    },
    {
        "q": "Can I combine this with other discounts?",
        "a": "The returning student code replaces the first-time 10% discount but stacks with referral bonuses up to the 35% cap."
    },
    {
        "q": "How long is the promo code valid?",
        "a": "The code is valid for the current enrollment cycle. Contact us on WhatsApp if you need an extension."
    },
    {
        "q": "How does the referral program work?",
        "a": "Share your link with friends: +5% for each friend who enrolls and +2% for each person who opens the link without enrolling. Referral bonuses go up to 15%, so the total discount can reach 35%."
    },
    {
        "q": "What if I forgot my previous level?",
        "a": "Take our free placement test to find your current level. It's quick and completely optional."
    }
],
};
