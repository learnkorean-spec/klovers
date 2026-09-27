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
 * Three routes deliberately say LESS than the live page, not more:
 * /topik-exam-preparation, /learn-korean-arabic-speakers and
 * /learn-korean-kdramas. Their live copy carries claims that are wrong or
 * unverified (a TOPIK score table that does not match NIIED's cut-offs, a
 * past exam date, "SOV like Arabic", "500K+ fans", "40% faster", month-by-month
 * CEFR promises). Static HTML is what AI answer engines quote, so these
 * fragments keep only statements that are true; the live copy is to be
 * corrected to match (see docs, GEO audit follow-up).
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
      <p>Have questions? We'd love to hear from you.</p>
      <h2>Chat on WhatsApp</h2>
      <p>The fastest way to reach us. <a href="https://wa.me/201010003084">wa.me/201010003084</a></p>
      <h2>Join our WhatsApp Community</h2>
      <p>Connect with students, get updates &amp; tips. <a href="https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq">Join the Klovers WhatsApp community</a></p>
      <h2>Or send us a message</h2>
      <p>Write your name, email, subject and message and send it from this page; Reham replies by email or WhatsApp.</p>
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
      <p>In Egypt: bank transfer, Vodafone Cash or InstaPay. Upload the receipt and the enrollment is activated after a manual check. Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically.</p>
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
      <p>We are happy to help. Reach out or start your Korean journey today!</p>
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
        <li><strong>Pay &amp; Enroll</strong> — Review &amp; Pay. Secure payment via Stripe. Your account will be created automatically after payment.</li>
      </ol>
      <p>Your schedule will be confirmed within 24 hours after payment.</p>
      <h2>What happens next?</h2>
      <ol>
        <li><strong>Payment confirmed</strong> — You get an instant email receipt.</li>
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
      <p><strong>Affiliate Program.</strong> Partner with Klovers Korean Academy. Share your unique link — earn recurring commissions on each enrollment.</p>
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
      <p>By applying you agree to our affiliate terms. Commission paid monthly via bank transfer or PayPal.</p>
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
      <h1>Learn Korean as an Arabic Speaker</h1>
      <p>Arabic speakers can learn Korean well with a teacher who explains it through Arabic. Korean uses Hangul, a phonetic alphabet of 14 basic consonants and 10 basic vowels that most learners can read after a few days of practice, and, like Arabic, it changes words and endings to show respect and formality.</p>
      <h2>What feels familiar, and what is new</h2>
      <ul>
        <li><strong>Formal and casual speech:</strong> Korean marks respect through speech levels and honorific words, much as Arabic speakers switch between formal and everyday registers.</li>
        <li><strong>Hangul:</strong> letters combine into syllable blocks, written left to right. It is a true alphabet with full vowels, unlike Arabic script, which mostly writes consonants.</li>
        <li><strong>Word order:</strong> Korean puts the verb at the end of the sentence (subject - object - verb) and marks the role of each word with particles such as 은/는, 이/가 and 을/를. This is the biggest new habit for Arabic speakers.</li>
        <li><strong>Sounds:</strong> Korean separates plain, aspirated and tense consonants (for example ㄱ, ㅋ, ㄲ) and has vowels such as ㅓ and ㅗ that take practice.</li>
      </ul>
      <h2>Frequently asked questions</h2>
      <h3>Will I need to learn hanja (Chinese characters)?</h3>
      <p>Not for conversation. Hanja appears in some official documents and newspapers, but everyday Korean - texting, social media, K-dramas - is written in Hangul.</p>
      <h3>How is Hangul different from Arabic script?</h3>
      <p>Hangul is a full alphabet: consonants and vowels are both written and combine into syllable blocks. Arabic script is an abjad that mostly writes consonants. Hangul is also written left to right.</p>
      <h3>Can I learn Korean with translation apps alone?</h3>
      <p>Not effectively. Apps give translations, not understanding. Use them for reference, and practise actively through lessons, conversation and writing.</p>
      <h3>What is the best way for an Arabic speaker to learn Korean?</h3>
      <p>Combine structured lessons with a teacher, listening through K-dramas, conversation practice and daily vocabulary review.</p>
      <h2>Learning with Klovers</h2>
      <p>Klovers teaches live online Korean classes in small groups, in Arabic or in English. Your teacher, Reham Elshrkawy, studied Korean language and literature at the Faculty of Al-Alsun and has taught Korean for 13 years to more than 200 students. The path starts with Hangul Foundation, then Levels 1 to 6.</p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/courses">Korean courses</a> · <a href="/pricing">Pricing</a> · <a href="/blog/korean-for-arabic-speakers-difficulty-guide">Is Korean hard for Arabic speakers?</a></p>
    </div>`;

export const TOPIK_BODY_HTML = `<div id="topik-exam-preparation-prerendered" lang="en" dir="ltr">
      <h1>TOPIK Exam Preparation</h1>
      <p>TOPIK (Test of Proficiency in Korean) is the official Korean language exam, run by Korea's National Institute for International Education (NIIED). It has two papers: TOPIK I for Levels 1-2 and TOPIK II for Levels 3-6. Your level is set by your total score, and a result is valid for two years from the results date.</p>
      <h2>TOPIK levels and passing scores</h2>
      <table><tr><th>Paper</th><th>Level</th><th>Minimum score</th></tr><tr><td>TOPIK I (out of 200)</td><td>Level 1</td><td>80</td></tr><tr><td>TOPIK I (out of 200)</td><td>Level 2</td><td>140</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 3</td><td>120</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 4</td><td>150</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 5</td><td>190</td></tr><tr><td>TOPIK II (out of 300)</td><td>Level 6</td><td>230</td></tr></table>
      <p>Level 4 is the level most often asked for by Korean universities and employers.</p>
      <h2>Exam format</h2>
      <ul>
        <li><strong>TOPIK I:</strong> Listening (30 questions, 40 minutes) and Reading (40 questions, 60 minutes).</li>
        <li><strong>TOPIK II:</strong> Listening (50 questions, 60 minutes) and Writing (4 questions, 50 minutes) in the first period; Reading (50 questions, 70 minutes) in the second.</li>
      </ul>
      <p>Test dates, registration windows, fees and test centres change every year and differ by country - always check the official site, <a href="https://www.topik.go.kr" rel="noopener">topik.go.kr</a>, before you plan.</p>
      <h2>A study plan to Level 4 (8-12 weeks, from about Level 2-3)</h2>
      <ol>
        <li><strong>Weeks 1-2:</strong> take one full practice test, learn the paper's structure and find your weak areas (usually writing and long reading).</li>
        <li><strong>Weeks 3-4:</strong> daily listening practice with past-paper audio; build vocabulary for common topics.</li>
        <li><strong>Weeks 5-6:</strong> reading comprehension and TOPIK vocabulary.</li>
        <li><strong>Weeks 7-8:</strong> writing - short answers and the 600-700 character essay, with feedback from a teacher.</li>
        <li><strong>Weeks 9-12:</strong> timed full practice tests and careful review of every error.</li>
      </ol>
      <h2>Frequently asked questions</h2>
      <h3>Can I take TOPIK from outside South Korea?</h3>
      <p>Yes. TOPIK is held in many countries, usually at Korean cultural centres, embassies or universities. Check topik.go.kr for the test centres near you.</p>
      <h3>How long is a TOPIK score valid?</h3>
      <p>Two years from the date results are announced.</p>
      <h3>Should I take TOPIK I or TOPIK II?</h3>
      <p>TOPIK I covers Levels 1-2 (beginner). TOPIK II covers Levels 3-6 (intermediate and advanced). Choose the paper that matches the level you are aiming for.</p>
      <h3>Is TOPIK required to work in South Korea?</h3>
      <p>Not always, but many employers, universities and some visa routes ask for a TOPIK level, most often Level 3 or 4 and above.</p>
      <h2>How Klovers helps</h2>
      <p>Klovers teaches live online Korean classes in small groups, in English or Arabic. Levels 1 to 6 each build toward the matching TOPIK level, and there is a dedicated TOPIK exam preparation class for students who have already booked a test date. The teacher, Reham Elshrkawy, studied Korean language and literature at the Faculty of Al-Alsun and has taught Korean for 13 years.</p>
      <p><a href="/free-trial">Book a free trial class</a> · <a href="/placement-test">Take the free placement test</a> · <a href="/courses">Korean courses</a> · <a href="/pricing">Pricing</a> · <a href="/blog/topik-exam-preparation-complete-guide-2026">TOPIK preparation guide</a></p>
    </div>`;

export const KDRAMAS_BODY_HTML = `<div id="learn-korean-kdramas-prerendered" lang="en" dir="ltr">
      <h1>Learn Korean Through K-Dramas</h1>
      <p>The most effective way is the 4-Watch Method: watch each episode first with English subtitles to enjoy the story, then with Korean subtitles to notice the words, then with no subtitles to test your listening, then master one 3-minute scene. Combine dramas with a weekly live class for grammar and speaking.</p>
      <h2>Why K-Dramas Are the Best Learning Tool</h2>
      <h3>Natural Spoken Korean</h3>
      <p>Real conversations, not textbook sentences. You learn how Koreans actually talk — slang, casual forms, emotional expressions.</p>
      <h3>Emotional Memory Encoding</h3>
      <p>When you're emotionally invested in a scene, your brain tags the words as 'important' and stores them longer.</p>
      <h3>Repetition Without Boredom</h3>
      <p>Dramas repeat phrases naturally. You hear 'I love you' 50 times across episodes without feeling like you're studying.</p>
      <h3>Cultural Context</h3>
      <p>Learn more than words — understand Korean culture, manners, social hierarchies, and why Koreans communicate the way they do.</p>
      <h3>Motivation Stays High</h3>
      <p>You WANT to understand because you're invested in the story. No cramming, no forcing yourself — you want more.</p>
      <h3>Passively Builds Skills</h3>
      <p>You improve listening, pronunciation patterns, rhythm, and intonation just by watching. Your ear trains automatically.</p>
      <h2>The 4-Watch Method </h2>
      <p>Follow it for any K-drama.</p>
      <h3>Watch 1: English Subtitles — Enjoy the Story (1 hour per episode)</h3>
      <p>Just relax and watch. Your job is to enjoy the plot, not study. Get invested in the characters and story. This builds motivation for later watches.</p>
      <h3>Watch 2: Korean Subtitles — Notice the Words (1.5 hours per episode)</h3>
      <p>Slower pace. Notice words you recognize. When you see a word in Korean text that matches the audio, your brain notes the connection. Don't pause — let it flow.</p>
      <h3>Watch 3: No Subtitles — Test Your Listening (1 hour per episode)</h3>
      <p>Now your listening is tested. How much you catch depends on your level and the drama. This struggle is good — it's the brain working hard to process.</p>
      <h3>Scene-Based Deep Dive — Master 1 Scene (30 minutes)</h3>
      <p>Pick ONE emotional 3-minute scene. Pause, repeat, write what you heard, repeat, listen again. By day 3, you'll have memorized the scene.</p>
      <h2>Build the Drama Habit (30 Days to Results)</h2>
      <table><tr><th>Days</th><th>Goal</th><th>Time</th></tr><tr><td>Days 1-5</td><td>Pick your drama &amp; watch episode 1 (English subtitles)</td><td>30 min daily</td></tr><tr><td>Days 6-10</td><td>Watch episodes 1-2 again (Korean subtitles)</td><td>45 min daily</td></tr><tr><td>Days 11-15</td><td>Rewatch no subtitles + pick 1 scene to master</td><td>1 hour daily</td></tr><tr><td>Days 16-20</td><td>Finish episode 2-3 fully, keep 1 phrase journal</td><td>1 hour daily</td></tr><tr><td>Days 21-30</td><td>Build momentum: 1-2 episodes per week with journal</td><td>1-2 hours daily</td></tr></table>
      <h3>Keep a Drama Journal</h3>
      <p>When you hear a phrase you like, write it:</p>
      <ul><li>Phrase: "정말이야?" (Really?)</li><li>Context: Character's shocked reaction</li><li>My sentence: "정말이야? 한국어를 배웠어?" (Really? You learned Korean?)</li></ul>
      <h2>Combine Dramas with Live Classes</h2>
      <p>Drama watching is passive learning. Structured lessons add the active part: grammar, speaking and a teacher to ask.</p>
      <table><tr><th>Dramas Alone</th><th>Klovers + Dramas</th><th>Textbooks Alone</th></tr><tr><td>Learn listening</td><td>Learn listening (yes)</td><td>Learn grammar</td></tr><tr><td>Learn vocabulary</td><td>Learn vocabulary (yes)</td><td>Learn vocabulary</td></tr><tr><td>Learn culture</td><td>Learn culture (yes)</td><td>Boring (no)</td></tr><tr><td>Don't learn grammar (no)</td><td>Learn grammar (yes)</td><td>Not realistic Korean (no)</td></tr><tr><td>Can't ask questions (no)</td><td>Ask questions (yes)</td><td>No cultural context (no)</td></tr></table>
      <p><strong>Best Strategy:</strong> Take one live 60-minute Klovers class a week and watch K-dramas 3-4 times a week. Let lessons explain the grammar you hear in dramas, and let dramas reinforce what you learned in lessons.</p>
      <h2>Frequently asked questions</h2>
      <h3>How many episodes should I watch per week?</h3>
      <p>Start with 1 episode per week (4 watches = 4 hours). Once you get the habit, move to 2-3 episodes per week. Quality beats quantity — one fully analyzed episode beats 5 passive episodes.</p>
      <h3>What if the K-drama doesn't have Korean subtitles available?</h3>
      <p>Netflix has Korean subtitles for most dramas. If not, use YouTube with auto-generated Korean subtitles (not perfect but helpful). Try: Viki, iQiyi, or WeTV apps which support Korean subtitles.</p>
      <h3>Should I watch the full series or just clip scenes?</h3>
      <p>Full series. Watching the full arc keeps you motivated (cliffhangers!), reinforces vocab across more situations, and the story engagement helps retention. Clips are too short to build the habit.</p>
      <h3>How much new vocabulary do you realistically learn?</h3>
      <p>It depends on the drama and on your level. Many words repeat across episodes, so key phrases and high-frequency words are the ones that stick.</p>
      <h3>Is drama learning enough, or do I need formal lessons?</h3>
      <p>Dramas teach listening and vocabulary brilliantly, but grammar and writing need structure. Combine dramas with a weekly live class for grammar and speaking.</p>
      <h2>Start Learning Through K-Dramas Today</h2>
      <p>Watch the shows you love, and let a weekly live class explain the grammar you hear.</p>
      <h2>Next steps</h2>
      <ul><li><a href="/free-trial">Book a free trial class</a></li><li><a href="/placement-test">Take the free placement test</a></li><li><a href="/courses">See all Korean courses</a></li><li><a href="/pricing">View pricing</a></li><li><a href="/enroll-now">Join Klovers</a></li></ul>
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
      <h2>See How a Teacher Practices</h2>
      <p>Watch a full demo of 41 real interview questions and answers prepared by a Klovers teacher. Password protected — for preview only.</p>
      <h2>Why practice with Klovers</h2>
      <ul>
        <li><strong>AI-Powered</strong> — Gemini generates tailored Q&amp;A</li>
        <li><strong>Korean + English</strong> — Bilingual with romanization</li>
        <li><strong>Interview Ready</strong> — Real Korean interview format</li>
        <li><strong>200+ students</strong> — Trusted by Klovers community</li>
      </ul>
      <p><a href="/practice-interview">Demo teacher</a> · <a href="/courses">Courses</a> · <a href="/placement-test">Placement test</a> · <a href="/free-trial">Free trial</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

export const WELCOME_BACK_BODY_HTML = `<div id="welcome-back-prerendered" lang="en" dir="ltr">
      <h1>Share with Friends &amp; Save More</h1>
      <p>Earn extra discounts when you refer friends or classmates to Klovers.</p>
      <ul>
        <li><strong>+5% per friend</strong> — For each friend who enrolls, you get an extra 5% off</li>
        <li><strong>+2% for sharing</strong> — Even if your friend doesn't join, you still get 2% off for sharing</li>
        <li><strong>Up to 35% total</strong> — Stack referrals on top of your 20% base — max 35% off</li>
      </ul>
      <h2>Continue Your Korean Journey</h2>
      <p><strong>Welcome Back, Klovers!</strong> Returning students get 20% off — enroll now and pick up where you left off.</p>
      <h2>Your Exclusive Offer</h2>
      <ul>
        <li>20% off your next enrollment — no questions asked</li>
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
      <p>Share this page with friends. For each friend who enrolls, you get +5% off. Even sharing earns you +2%. Stack up to 35% total.</p>
      <h3>What if I forgot my previous level?</h3>
      <p>Take our free placement test to find your current level. It's quick and completely optional.</p>
      <h2>Ready to Continue?</h2>
      <p>Your 20% discount is waiting. Enroll now and rejoin the Klovers community. Use code KLOVERSOLDSTUDENT1 at checkout.</p>
      <p><a href="/enroll-now">Enroll now</a> · <a href="/placement-test">Placement test</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a></p>
    </div>`;

export const HANGUL_STARTER_BODY_HTML = `<div id="hangul-starter-prerendered" lang="en" dir="ltr">
      <h1>Free Hangul Starter Sheet</h1>
      <p>Every Korean letter in one place — with correct pronunciation. Print it, save it, start today.</p>
      <h2>How Korean syllable blocks work</h2>
      <p>Korean is written in syllable blocks — each block = one syllable sound. Each block contains a consonant + vowel (+ optional final consonant). Examples: 가 = ㄱ + ㅏ ("ga"); 한 = ㅎ + ㅏ + ㄴ ("han"); 국 = ㄱ + ㅜ + ㄱ ("guk").</p>
      <h2>Basic Consonants (14)</h2>
      <p>ㄱ g / k (가 ga) · ㄴ n (나 na) · ㄷ d / t (다 da) · ㄹ r / l (라 ra) · ㅁ m (마 ma) · ㅂ b / p (바 ba) · ㅅ s (사 sa) · ㅇ – / ng (아 a) · ㅈ j (자 ja) · ㅊ ch (차 cha) · ㅋ k (카 ka) · ㅌ t (타 ta) · ㅍ p (파 pa) · ㅎ h (하 ha)</p>
      <h2>Double Consonants (5)</h2>
      <p>ㄲ kk (까 kka) · ㄸ tt (따 tta) · ㅃ pp (빠 ppa) · ㅆ ss (싸 ssa) · ㅉ jj (짜 jja)</p>
      <h2>Basic Vowels (10)</h2>
      <p>ㅏ a (아) · ㅑ ya (야) · ㅓ eo (어) · ㅕ yeo (여) · ㅗ o (오) · ㅛ yo (요) · ㅜ u (우) · ㅠ yu (유) · ㅡ eu (으) · ㅣ i (이)</p>
      <h2>Compound Vowels (11)</h2>
      <p>ㅐ ae (애) · ㅒ yae (얘) · ㅔ e (에) · ㅖ ye (예) · ㅘ wa (와) · ㅙ wae (왜) · ㅚ oe (외) · ㅝ wo (워) · ㅞ we (웨) · ㅟ wi (위) · ㅢ ui (의)</p>
      <h2>3 facts that make Hangul easy</h2>
      <ul>
        <li>Hangul was designed in 1443 — and made to be learned quickly: at Klovers it takes 4 classes.</li>
        <li>Each letter's shape reflects how your mouth moves to say it.</li>
        <li>You don't need to memorize everything before starting — your teacher will guide you through it.</li>
      </ul>
      <p><strong>Start with a real teacher — free.</strong></p>
      <p><a href="/free-trial">Book a free class</a> · <a href="/placement-test">Placement test</a> · <a href="/courses">Courses</a> · <a href="/pricing">Pricing</a> · <a href="/blog">Blog</a></p>
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
        "a": "In Egypt: bank transfer, Vodafone Cash or InstaPay. Upload the receipt and the enrollment is activated after a manual check. Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically."
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
        "a": "Share this page with friends. For each friend who enrolls, you get +5% off. Even sharing earns you +2%. Stack up to 35% total."
    },
    {
        "q": "What if I forgot my previous level?",
        "a": "Take our free placement test to find your current level. It's quick and completely optional."
    }
],
  "/learn-korean-arabic-speakers": [
    {
        "q": "Will I need to learn hanja (Chinese characters)?",
        "a": "Not for conversation. Hanja appears in some official documents and newspapers, but everyday Korean - texting, social media, K-dramas - is written in Hangul."
    },
    {
        "q": "How is Hangul different from Arabic script?",
        "a": "Hangul is a full alphabet: consonants and vowels are both written and combine into syllable blocks. Arabic script is an abjad that mostly writes consonants. Hangul is also written left to right."
    },
    {
        "q": "Can I learn Korean with translation apps alone?",
        "a": "Not effectively. Apps give translations, not understanding. Use them for reference, and practise actively through lessons, conversation and writing."
    },
    {
        "q": "What is the best way for an Arabic speaker to learn Korean?",
        "a": "Combine structured lessons with a teacher, listening through K-dramas, conversation practice and daily vocabulary review."
    }
],
  "/topik-exam-preparation": [
    {
        "q": "Can I take TOPIK from outside South Korea?",
        "a": "Yes. TOPIK is held in many countries, usually at Korean cultural centres, embassies or universities. Check topik.go.kr for the test centres near you."
    },
    {
        "q": "How long is a TOPIK score valid?",
        "a": "Two years from the date results are announced."
    },
    {
        "q": "Should I take TOPIK I or TOPIK II?",
        "a": "TOPIK I covers Levels 1-2 (beginner). TOPIK II covers Levels 3-6 (intermediate and advanced). Choose the paper that matches the level you are aiming for."
    },
    {
        "q": "Is TOPIK required to work in South Korea?",
        "a": "Not always, but many employers, universities and some visa routes ask for a TOPIK level, most often Level 3 or 4 and above."
    }
],
  "/learn-korean-kdramas": [
    {
        "q": "How many episodes should I watch per week?",
        "a": "Start with 1 episode per week (4 watches = 4 hours). Once you get the habit, move to 2-3 episodes per week. Quality beats quantity — one fully analyzed episode beats 5 passive episodes."
    },
    {
        "q": "What if the K-drama doesn't have Korean subtitles available?",
        "a": "Netflix has Korean subtitles for most dramas. If not, use YouTube with auto-generated Korean subtitles (not perfect but helpful). Try: Viki, iQiyi, or WeTV apps which support Korean subtitles."
    },
    {
        "q": "Should I watch the full series or just clip scenes?",
        "a": "Full series. Watching the full arc keeps you motivated (cliffhangers!), reinforces vocab across more situations, and the story engagement helps retention. Clips are too short to build the habit."
    },
    {
        "q": "How much new vocabulary do you realistically learn?",
        "a": "It depends on the drama and on your level. Many words repeat across episodes, so key phrases and high-frequency words are the ones that stick."
    },
    {
        "q": "Is drama learning enough, or do I need formal lessons?",
        "a": "Dramas teach listening and vocabulary brilliantly, but grammar and writing need structure. Combine dramas with a weekly live class for grammar and speaking."
    }
],
};
