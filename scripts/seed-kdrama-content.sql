-- ============================================================
-- K-Drama Textbook Content Seed
-- Run this in: supabase.com/dashboard/project/rahpkflknkofuuhnbfyc/sql/new
-- ============================================================

DO $$
DECLARE
  l1 integer; l2 integer; l3 integer; l4 integer; l5 integer; l6 integer;
BEGIN

-- Get lesson IDs
SELECT id INTO l1 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=1;
SELECT id INTO l2 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=2;
SELECT id INTO l3 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=3;
SELECT id INTO l4 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=4;
SELECT id INTO l5 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=5;
SELECT id INTO l6 FROM public.textbook_lessons WHERE book='kdrama' AND sort_order=6;

-- ============================================================
-- MISSION 1: Nice to Meet You (만나서 반갑습니다)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l1;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l1;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l1;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l1;
DELETE FROM public.lesson_reading     WHERE lesson_id = l1;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l1,'안녕하세요','annyeonghaseyo','Hello / How do you do? (polite)',1),
(l1,'만나서 반갑습니다','mannaseo bangapseumnida','Nice to meet you (formal)',2),
(l1,'처음 뵙겠습니다','cheoeum boepgesseumnida','Nice to meet you for the first time (very formal)',3),
(l1,'저는 ~입니다','jeoneun ~imnida','I am ~ (formal self-introduction)',4),
(l1,'이름','ireum','name',5),
(l1,'잘 부탁드립니다','jal butakdeurimnida','Please take care of me / I look forward to working with you',6),
(l1,'소개하다','sogaehada','to introduce',7),
(l1,'인사하다','insahada','to greet',8),
(l1,'처음','cheoeum','first time',9),
(l1,'반갑다','bangapda','to be pleased / glad to meet',10),
(l1,'선배','seonbae','senior (at work or school)',11),
(l1,'후배','hubae','junior (at work or school)',12),
(l1,'동료','dongnyeo','colleague',13),
(l1,'어디서 오셨어요?','eodiseo osyeosseoyo?','Where are you from?',14),
(l1,'눈이 마주치다','nuni majuchida','eyes to meet (classic K-drama moment)',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l1,'Formal Self-Introduction: ~입니다','Subject + 입니다','Use 입니다 to formally state who you are or what something is. It is the formal polite ending of the verb "to be".','[{"korean":"저는 김지수입니다.","romanization":"Jeoneun Kim Jisoo imnida.","english":"I am Kim Jisoo."},{"korean":"저는 학생입니다.","romanization":"Jeoneun haksaeng imnida.","english":"I am a student."}]',1),
(l1,'Topic Marker: 저는 (I, as for me)','저 + 는','저 means "I" (humble/polite form). 는 is the topic marker. Together 저는 sets "I" as the topic of the sentence — the polite, standard way to introduce yourself.','[{"korean":"저는 레함입니다.","romanization":"Jeoneun Reham imnida.","english":"I am Reham."},{"korean":"저는 이집트 사람입니다.","romanization":"Jeoneun Ijipeu saramimnida.","english":"I am Egyptian."}]',2),
(l1,'Set Expression: 잘 부탁드립니다','잘 부탁드립니다','This phrase is used after introductions and means "please take care of me" or "I look forward to your support." It is essential in Korean professional and social contexts.','[{"korean":"처음 뵙겠습니다. 잘 부탁드립니다.","romanization":"Cheoeum boepgesseumnida. Jal butakdeurimnida.","english":"Nice to meet you for the first time. I look forward to your support."}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l1,'지훈','안녕하세요. 저는 박지훈입니다.','Annyeonghaseyo. Jeoneun Bak Jihun imnida.','Hello. I am Park Jihun.',1),
(l1,'소연','처음 뵙겠습니다. 저는 이소연이라고 합니다.','Cheoeum boepgesseumnida. Jeoneun I Soyeon irago hamnida.','Nice to meet you for the first time. My name is Lee Soyeon.',2),
(l1,'지훈','만나서 정말 반갑습니다. 어디서 오셨어요?','Mannaseo jeongmal bangapseumnida. Eodiseo osyeosseoyo?','I am really glad to meet you. Where are you from?',3),
(l1,'소연','저는 부산에서 왔어요. 지훈 씨는요?','Jeoneun Busaneseo wasseoyo. Jihun ssineunyo?','I came from Busan. What about you, Jihun?',4),
(l1,'지훈','저는 서울 사람입니다. 잘 부탁드립니다!','Jeoneun Seoul saramimnida. Jal butakdeurimnida!','I am from Seoul. I look forward to working with you!',5),
(l1,'소연','저도 잘 부탁드려요!','Jeodo jal butakdeuryeoyo!','I look forward to it too!',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l1,'How do you say "Nice to meet you" formally in Korean?','["안녕히 가세요","만나서 반갑습니다","잘 먹겠습니다","천천히 말해 주세요"]',1,'만나서 반갑습니다 (mannaseo bangapseumnida) is the formal way to say "Nice to meet you."',1),
(l1,'Which phrase is used at the end of an introduction to mean "please take care of me"?','["잘 부탁드립니다","안녕하세요","저는 ~입니다","처음 뵙겠습니다"]',0,'잘 부탁드립니다 (jal butakdeurimnida) is a set phrase used after introductions in professional and social settings.',2),
(l1,'What does 저는 mean?','["You (polite)","He / She","I (polite/humble)","We"]',2,'저는 means "I" with 저 being the humble/polite first-person pronoun and 는 being the topic marker.',3),
(l1,'Which is the MOST formal greeting when meeting someone for the first time?','["안녕!","안녕하세요","처음 뵙겠습니다","반가워"]',2,'처음 뵙겠습니다 is the most formal greeting for a first meeting, used in business or formal situations.',4),
(l1,'Complete the sentence: 저는 학생___.','["이에요","입니다","해요","있어요"]',1,'입니다 is the formal polite ending used with nouns to mean "is/am/are." 저는 학생입니다 = I am a student.',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l1,E'안녕하세요! 저는 레함이라고 합니다.\n저는 이집트에서 왔어요.\n한국어를 정말 좋아해요.\n케이드라마를 보면서 한국어를 공부해요.\n만나서 반갑습니다. 잘 부탁드립니다!',E'Hello! My name is Reham.\nI came from Egypt.\nI really like Korean.\nI study Korean while watching K-dramas.\nNice to meet you. I look forward to your support!',1);

-- ============================================================
-- MISSION 2: How Are You? (잘 지내셨어요?)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l2;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l2;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l2;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l2;
DELETE FROM public.lesson_reading     WHERE lesson_id = l2;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l2,'잘 지냈어요?','jal jinaesseoyo?','How have you been? (casual polite)',1),
(l2,'잘 지냈습니다','jal jinaessseumnida','I have been well (formal)',2),
(l2,'오랜만이에요','oraenmanieyo','Long time no see (casual polite)',3),
(l2,'그동안 어떻게 지내셨어요?','geudong-an eotteoke jinaesyeosseoyo?','How have you been all this time?',4),
(l2,'바빴어요','babasseoyo','I was busy',5),
(l2,'건강하다','geonganghada','to be healthy',6),
(l2,'힘들다','himdeulda','to be hard / exhausting',7),
(l2,'덕분에','deokbune','thanks to you (set phrase response)',8),
(l2,'요즘','yojeum','lately / these days',9),
(l2,'보고 싶었어요','bogo sipeosseoyo','I missed you',10),
(l2,'잘 지내다','jal jinaeda','to be doing well / living well',11),
(l2,'어떻게','eotteoke','how',12),
(l2,'지내다','jinaeda','to spend time / to live',13),
(l2,'다시 만나다','dasi mannada','to meet again',14),
(l2,'반가운 사람','bangaun saram','a welcome / dear person',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l2,'Past Tense with ~았/었어요','Verb stem + 았/었어요','To form the informal polite past tense, add 았어요 after stems with bright vowels (ㅏ/ㅗ) or 었어요 after other vowels. This is one of the most common sentence endings in K-dramas.','[{"korean":"잘 지냈어요?","romanization":"Jal jinaesseoyo?","english":"How have you been?"},{"korean":"바빴어요.","romanization":"Babasseoyo.","english":"I was busy."}]',1),
(l2,'The Response Formula: 덕분에 잘 지냈어요','덕분에 + statement','덕분에 means "thanks to you" and is a polite, warm way to respond when someone asks how you have been. It implies their good wishes contributed to your wellbeing.','[{"korean":"덕분에 잘 지냈어요.","romanization":"Deokbune jal jinaesseoyo.","english":"I have been well, thanks to you."},{"korean":"덕분에요!","romanization":"Deokbuneyo!","english":"Thanks to you! (short form)"}]',2),
(l2,'Time Expression: 요즘 (lately)','요즘 + sentence','요즘 means "lately" or "these days" and is placed at the beginning of a sentence or after the topic. It is very common in everyday Korean conversation and K-dramas.','[{"korean":"요즘 어때요?","romanization":"Yojeum eottaeyo?","english":"How are you doing lately?"},{"korean":"요즘 바빠요.","romanization":"Yojeum bappayo.","english":"I am busy lately."}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l2,'민준','어! 소영 씨, 오랜만이에요!','Eo! Soyeong ssi, oraenmanieyo!','Oh! Soyeong, long time no see!',1),
(l2,'소영','민준 씨! 정말 오랜만이에요. 그동안 어떻게 지내셨어요?','Minjun ssi! Jeongmal oraenmanieyo. Geudong-an eotteoke jinaesyeosseoyo?','Minjun! It has really been a long time. How have you been all this time?',2),
(l2,'민준','덕분에 잘 지냈어요. 요즘 많이 바빴어요. 소영 씨는요?','Deokbune jal jinaesseoyo. Yojeum mani babasseoyo. Soyeong ssineunyo?','I have been well, thanks to you. I have been quite busy lately. What about you, Soyeong?',3),
(l2,'소영','저도 바빴어요. 근데 보고 싶었어요!','Jeodo babasseoyo. Geunde bogo sipeosseoyo!','I was busy too. But I missed you!',4),
(l2,'민준','저도 보고 싶었어요. 이따가 커피 한 잔 할까요?','Jeodo bogo sipeosseoyo. Ittaga keopi han jan halkkayo?','I missed you too. Shall we have a cup of coffee later?',5),
(l2,'소영','좋아요! 기다렸어요.','Johayo! Gidaryeosseoyo.','Great! I have been waiting for this.',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l2,'How do you say "Long time no see" in Korean?','["잘 지냈어요","오랜만이에요","보고 싶었어요","요즘 어때요"]',1,'오랜만이에요 (oraenmanieyo) is the casual polite way to say "long time no see."',1),
(l2,'What is the polite response when asked how you have been?','["모르겠어요","덕분에 잘 지냈어요","안녕히 가세요","잠깐만요"]',1,'덕분에 잘 지냈어요 means "I have been well, thanks to you" — the standard warm response.',2),
(l2,'요즘 means:','["yesterday","long ago","lately / these days","next time"]',2,'요즘 (yojeum) means "lately" or "these days" and is used to refer to the recent period.',3),
(l2,'What does 바빴어요 mean?','["I was happy","I was tired","I was busy","I was sick"]',2,'바빴어요 is the past tense of 바쁘다 (to be busy). The stem 바쁘 + 았어요 contracts to 바빴어요.',4),
(l2,'Complete: 보고 ___ (I missed you)','["싶었어요","좋아요","있어요","가요"]',0,'보고 싶었어요 means "I missed you." 보다 (to see) + 고 싶다 (to want to) + past tense = "I wanted to see you" / "I missed you."',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l2,E'오늘 오랜 친구를 만났어요.\n정말 오랜만이었어요.\n"잘 지냈어요?" 라고 물어봤어요.\n친구는 "덕분에 잘 지냈어요!" 라고 했어요.\n우리는 커피를 마시면서 오랫동안 이야기했어요.\n정말 행복한 하루였어요.',E'Today I met an old friend.\nIt had really been a long time.\nI asked "How have you been?"\nMy friend said "I have been well, thanks to you!"\nWe talked for a long time over coffee.\nIt was truly a happy day.',1);

-- ============================================================
-- MISSION 3: I'm Sorry / Excuse Me (미안해요 / 실례합니다)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l3;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l3;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l3;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l3;
DELETE FROM public.lesson_reading     WHERE lesson_id = l3;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l3,'미안해요','mianhaeyo','I am sorry (casual polite)',1),
(l3,'죄송합니다','joesonghamnida','I am very sorry (formal)',2),
(l3,'실례합니다','sillyehamnida','Excuse me (formal)',3),
(l3,'괜찮아요','gwaenchanayo','It is okay / I am fine',4),
(l3,'용서하다','yongseohadа','to forgive',5),
(l3,'사과하다','sagwahada','to apologize',6),
(l3,'잘못하다','jalmothada','to do wrong / to make a mistake',7),
(l3,'실수하다','silsuhada','to make a mistake accidentally',8),
(l3,'걱정하다','geokjeonghada','to worry',9),
(l3,'이해하다','ihaehada','to understand',10),
(l3,'늦다','neutda','to be late',11),
(l3,'기다리다','gidarida','to wait',12),
(l3,'화가 나다','hwaga nada','to become angry',13),
(l3,'진심으로','jinsimeuro','sincerely / from the heart',14),
(l3,'다음부터는','daeumbuteoneun','from next time',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l3,'Levels of Apology','미안해 / 미안해요 / 죄송합니다','Korean has three levels of apology depending on formality. 미안해 is casual (friends), 미안해요 is polite, and 죄송합니다 is the most formal. In K-dramas you will hear all three!','[{"korean":"미안해. 내 잘못이야.","romanization":"Mianhae. Nae jalmosiya.","english":"Sorry. It was my fault. (casual)"},{"korean":"정말 죄송합니다.","romanization":"Jeongmal joesonghamnida.","english":"I am truly sorry. (formal)"}]',1),
(l3,'~(으)ㄹ게요 — Promise/Intention','Verb stem + (으)ㄹ게요','This ending expresses a promise or intention directed at the listener. It is common in apologies to promise not to repeat a mistake.','[{"korean":"다음부터는 안 늦을게요.","romanization":"Daeumbuteoneun an neujeulgeyo.","english":"I will not be late from next time."},{"korean":"더 열심히 할게요.","romanization":"Deo yeolsimhi halgeyo.","english":"I will try harder."}]',2),
(l3,'Reassurance: 괜찮아요','괜찮아요 / 괜찮아','괜찮아요 means "It is okay" or "I am fine." It is the standard kind response to an apology. In casual speech with friends, 괜찮아 is used.','[{"korean":"괜찮아요, 걱정하지 마세요.","romanization":"Gwaenchanayo, geokjeonghaji maseyo.","english":"It is okay, do not worry."},{"korean":"괜찮아! 별거 아니야.","romanization":"Gwaenchana! Byeolgeona aniya.","english":"It is fine! It is nothing. (casual)"}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l3,'하준','지아야, 정말 미안해. 많이 기다렸지?','Jia ya, jeongmal mianhae. Mani gidaryeotji?','Jia, I am really sorry. You waited a lot, right?',1),
(l3,'지아','맞아. 30분이나 기다렸어. 왜 이렇게 늦었어?','Maja. Samsipbunina gidaryeosseo. Wae ireoke neujeosseo?','That is right. I waited 30 whole minutes. Why were you so late?',2),
(l3,'하준','길이 너무 막혔어. 진심으로 미안해. 다음부터는 더 일찍 올게.','Giri neomu makkyeosseo. Jinsimeuro mianhae. Daeumbuteoneun deo iljjik olge.','The traffic was really bad. I am sincerely sorry. I will come earlier next time.',3),
(l3,'지아','…괜찮아. 근데 다음에는 꼭 연락해.','...Gwaenchana. Geunde daeumeneun kkok yeollakhae.','...It is fine. But next time, make sure to contact me.',4),
(l3,'하준','알겠어. 고마워. 오늘 저녁은 내가 살게!','Algesseo. Gomawo. Oneul jeonyeogeun naega salge!','Understood. Thank you. I will pay for dinner tonight!',5),
(l3,'지아','그럼 용서해 줄게!','Geureom yongseohae julge!','Then I will forgive you!',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l3,'Which is the MOST formal apology in Korean?','["미안해","미안해요","죄송합니다","실수했어요"]',2,'죄송합니다 (joesonghamnida) is the most formal apology, used in professional settings or with elders.',1),
(l3,'What does 괜찮아요 mean in response to an apology?','["Please forgive me","I am angry","It is okay","I understand"]',2,'괜찮아요 means "It is okay" or "I am fine" — the standard kind response to say you accept an apology.',2),
(l3,'늦다 means:','["to wait","to be late","to apologize","to forgive"]',1,'늦다 (neutda) means "to be late." You will often hear 늦었어요 (I was late) or 늦을게요 (I will be late) in K-dramas.',3),
(l3,'다음부터는 안 늦을게요 means:','["I was not late last time","I will not be late from next time","I am never late","Being late is okay"]',1,'다음부터는 (from next time) + 안 (not) + 늦을게요 (will be late) = "I will not be late from next time." A promise for the future.',4),
(l3,'실례합니다 is used to:','["apologize deeply","say goodbye","excuse yourself or get attention politely","thank someone"]',2,'실례합니다 (sillyehamnida) means "excuse me" and is used to politely get someone\'s attention or excuse yourself.',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l3,E'오늘 회의에 30분 늦었어요.\n정말 죄송했어요.\n상사에게 진심으로 사과했어요.\n"다음부터는 절대 늦지 않겠습니다." 라고 말했어요.\n상사가 "괜찮아요, 이해해요." 라고 했어요.\n정말 다행이었어요.\n다음부터는 더 일찍 일어날 거예요.',E'Today I was 30 minutes late to a meeting.\nI was truly sorry.\nI sincerely apologized to my boss.\nI said, "I will absolutely not be late from next time."\nMy boss said, "It is okay, I understand."\nI was really relieved.\nFrom next time, I will wake up earlier.',1);

-- ============================================================
-- MISSION 4: Thank You & You're Welcome (감사합니다 / 천만에요)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l4;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l4;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l4;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l4;
DELETE FROM public.lesson_reading     WHERE lesson_id = l4;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l4,'감사합니다','gamsahamnida','Thank you (formal)',1),
(l4,'고마워요','gomawoyo','Thank you (casual polite)',2),
(l4,'천만에요','cheonmaneyo','You are welcome / Not at all',3),
(l4,'별말씀을요','byeolmalsseumeulyo','Do not mention it (formal)',4),
(l4,'도와주다','dowajuda','to help',5),
(l4,'덕분이에요','deokbunieyo','It is thanks to you',6),
(l4,'신세를 지다','sinsereul jida','to owe someone a favor',7),
(l4,'배풀다','baepulda','to show generosity / to give',8),
(l4,'친절하다','chinjeolhada','to be kind',9),
(l4,'정말','jeongmal','really / truly',10),
(l4,'너무','neomu','so much / too much',11),
(l4,'감동하다','gamdonghada','to be moved / touched',12),
(l4,'감사드리다','gamsadeurida','to express gratitude (honorific)',13),
(l4,'배려하다','baeryeohada','to be considerate',14),
(l4,'마음','maeum','heart / mind',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l4,'Levels of Thanks','고마워 / 고마워요 / 감사합니다','Korean expresses gratitude at three levels. 고마워 is casual (friends), 고마워요 is polite, and 감사합니다 is formal. Choose based on your relationship and setting.','[{"korean":"고마워! 진짜 고마워.","romanization":"Gomawo! Jinjja gomawo.","english":"Thanks! I really mean it. (casual)"},{"korean":"정말 감사합니다.","romanization":"Jeongmal gamsahamnida.","english":"I am truly grateful. (formal)"}]',1),
(l4,'~어/아 주다 — Doing Something FOR Someone','Verb stem + 아/어 주다','Adding 주다 after a verb means to do that action AS A FAVOR or FOR the other person. It is extremely common in K-drama dialogue when characters help each other.','[{"korean":"도와줘서 감사해요.","romanization":"Dowajwoseo gamsahaeyo.","english":"Thank you for helping me."},{"korean":"가르쳐 주셔서 감사합니다.","romanization":"Gareucheo jusyeoseo gamsahamnida.","english":"Thank you for teaching me."}]',2),
(l4,'Expressing Deep Gratitude','덕분에 + result','덕분에 (thanks to you/it) is used to express that a positive outcome happened because of someone else. More emotionally rich than a simple thank you.','[{"korean":"덕분에 합격했어요.","romanization":"Deokbune hapgyeokhaesseoyo.","english":"I passed thanks to you."},{"korean":"다 당신 덕분이에요.","romanization":"Da dangsin deokbunieyo.","english":"It is all thanks to you."}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l4,'세진','오늘 정말 많이 도와줬어요. 감사합니다.','Oneul jeongmal mani dowajwosseoyo. Gamsahamnida.','You helped me so much today. Thank you.',1),
(l4,'하은','별말씀을요. 저도 즐거웠어요.','Byeolmalsseumeulyo. Jeodo jeulgeowosseoyo.','Do not mention it. I enjoyed it too.',2),
(l4,'세진','하은 씨 덕분에 정말 많이 배웠어요.','Haeun ssi deokbune jeongmal mani baewosseoyo.','I learned so much thanks to you, Haeun.',3),
(l4,'하은','아니에요, 세진 씨가 열심히 하셔서 잘 된 거예요.','Anieyo, Sejin ssiga yeolsimhi hasyeoseo jal doen geoyeyo.','No, it went well because you worked hard.',4),
(l4,'세진','정말 감동이에요. 마음이 너무 따뜻해요.','Jeongmal gamdongieyo. Maeumi neomu ttatteutaeyo.','I am really touched. My heart feels so warm.',5),
(l4,'하은','앞으로도 잘 부탁드려요!','Apeurodo jal butakdeuryeoyo!','I look forward to continuing to work together!',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l4,'What is the MOST formal way to say "Thank you" in Korean?','["고마워","고마워요","감사합니다","감동이에요"]',2,'감사합니다 (gamsahamnida) is the most formal expression of gratitude, used in professional or respectful contexts.',1),
(l4,'How do you say "You are welcome" in Korean?','["별말씀을요","죄송합니다","괜찮아요","감사드립니다"]',0,'천만에요 or 별말씀을요 both mean "You are welcome / Do not mention it." 별말씀을요 is more formal.',2),
(l4,'덕분에 means:','["I am sorry","Thanks to you","How are you","Excuse me"]',1,'덕분에 (deokbune) means "thanks to you" and is used to express that something good happened because of someone.',3),
(l4,'도와줘서 감사해요 means:','["I want to help you","I helped you","Thank you for helping me","Helping is important"]',2,'도와주다 (to help someone) + 어서 (because/for doing) + 감사해요 (thank you) = "Thank you for helping me."',4),
(l4,'Which suffix means "doing something for someone"?','["~고 싶다","~아/어 주다","~(으)ㄹ게요","~았/었어요"]',1,'~아/어 주다 added to a verb means to do that action as a favor FOR someone. Very common in K-drama conversations.',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l4,E'저는 한국어를 배우면서 선생님께 정말 감사해요.\n선생님 덕분에 많이 발전했어요.\n어렵고 힘들 때마다 도와주셨어요.\n"감사합니다, 선생님. 정말 최고예요!"\n선생님은 "별말씀을요, 열심히 한 학생 덕분이에요." 라고 하셨어요.\n그 말이 정말 감동이었어요.',E'While learning Korean, I am truly grateful to my teacher.\nThanks to my teacher, I have improved so much.\nEvery time things were difficult and hard, my teacher helped me.\n"Thank you, teacher. You are truly the best!"\nMy teacher said, "Do not mention it, it is thanks to a student who worked hard."\nThose words were truly touching.',1);

-- ============================================================
-- MISSION 5: Do You Like It? (좋아해요?)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l5;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l5;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l5;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l5;
DELETE FROM public.lesson_reading     WHERE lesson_id = l5;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l5,'좋아하다','joahada','to like',1),
(l5,'싫어하다','sireohada','to dislike / to hate',2),
(l5,'좋아요','johayo','It is good / I like it',3),
(l5,'싫어요','sireoyo','I dislike it / No (emphatic)',4),
(l5,'취미','chwimi','hobby',5),
(l5,'음악','eumak','music',6),
(l5,'영화','yeonghwa','movie',7),
(l5,'독서','dokseo','reading (books)',8),
(l5,'요리하다','yorihada','to cook',9),
(l5,'운동하다','undonghada','to exercise',10),
(l5,'여행하다','yeohaenghada','to travel',11),
(l5,'케이팝','keipap','K-pop',12),
(l5,'케이드라마','keideurama','K-drama',13),
(l5,'한식','hansik','Korean food',14),
(l5,'관심이 있다','gwansimi itda','to be interested in',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l5,'Expressing Likes: ~을/를 좋아해요','Object + 을/를 + 좋아해요','To say you like something, use the object marker 을 (after consonant) or 를 (after vowel) followed by 좋아해요. This is one of the most essential patterns for casual K-drama conversation.','[{"korean":"저는 케이드라마를 좋아해요.","romanization":"Jeoneun keideuramareul joahaeyo.","english":"I like K-dramas."},{"korean":"저는 한식을 정말 좋아해요.","romanization":"Jeoneun hansigeul jeongmal joahaeyo.","english":"I really like Korean food."}]',1),
(l5,'Asking About Hobbies: 취미가 뭐예요?','취미가 + 뭐예요?','취미가 뭐예요? means "What is your hobby?" 취미 (hobby) + 가 (subject marker) + 뭐예요? (what is it?). A very common getting-to-know-you question.','[{"korean":"취미가 뭐예요?","romanization":"Chwimiga mwoyeyo?","english":"What is your hobby?"},{"korean":"제 취미는 독서예요.","romanization":"Je chwimineun dokseoyeyo.","english":"My hobby is reading."}]',2),
(l5,'Expressing Interest: ~에 관심이 있어요','Topic + 에 + 관심이 있어요','To say you are interested in something, use ~에 관심이 있어요. More nuanced than 좋아해요 — it shows you have an active interest or passion.','[{"korean":"한국 문화에 관심이 있어요.","romanization":"Hanguk munhwae gwansimi isseoyo.","english":"I am interested in Korean culture."},{"korean":"케이팝에 관심이 많아요.","romanization":"Keipape gwansimi manayo.","english":"I have a lot of interest in K-pop."}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l5,'태양','나나 씨, 취미가 뭐예요?','Nana ssi, chwimiga mwoyeyo?','Nana, what is your hobby?',1),
(l5,'나나','저는 케이드라마 보는 것을 좋아해요. 태양 씨는요?','Jeoneun keideurama boneun geoseul joahaeyo. Taeyang ssineunyo?','I like watching K-dramas. What about you, Taeyang?',2),
(l5,'태양','저는 음악 듣는 것을 좋아해요. 케이팝을 정말 좋아해요.','Jeoneun eumak deutneun geoseul joahaeyo. Keipapeul jeongmal joahaeyo.','I like listening to music. I really like K-pop.',3),
(l5,'나나','저도 케이팝 좋아해요! 한식은요? 좋아해요?','Jeodo keipap joahaeyo! Hansigeunyo? Joahaeyo?','I like K-pop too! What about Korean food? Do you like it?',4),
(l5,'태양','네, 너무 좋아해요. 특히 삼겹살을 가장 좋아해요.','Ne, neomu joahaeyo. Teukhi samgyeopssareul gajang joahaeyo.','Yes, I like it so much. I especially like samgyeopsal the most.',5),
(l5,'나나','저는 삼겹살을 정말 좋아해요. 같이 먹으러 갈까요?','Jeoneun samgyeopssareul jeongmal joahaeyo. Gachi meogeuro galkkayo?','I really like samgyeopsal too. Shall we go eat it together?',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l5,'How do you ask "What is your hobby?" in Korean?','["취미 좋아해요?","취미가 뭐예요?","취미는 있어요?","취미를 해요?"]',1,'취미가 뭐예요? is the standard way to ask about someone''s hobby. 취미 (hobby) + 가 (subject marker) + 뭐예요? (what is it?)',1),
(l5,'저는 케이드라마를 좋아해요 means:','["I do not like K-dramas","Do you like K-dramas?","I like K-dramas","K-dramas are interesting"]',2,'저는 (I) + 케이드라마를 (K-drama + object marker) + 좋아해요 (like) = "I like K-dramas."',2),
(l5,'Which object marker is used after a vowel-ending noun?','["을","는","이","를"]',3,'를 is used after vowel-ending nouns (e.g., 케이드라마를). 을 is used after consonant-ending nouns (e.g., 한식을).',3),
(l5,'한국 문화에 관심이 있어요 means:','["I like Korean culture","I am interested in Korean culture","Korean culture is good","I study Korean culture"]',1,'관심이 있어요 means "to be interested in." 한국 문화에 (in Korean culture) + 관심이 있어요 = "I am interested in Korean culture."',4),
(l5,'What is the opposite of 좋아해요?','["관심 있어요","싫어해요","알아요","해요"]',1,'싫어해요 (sireohaeyo) is the opposite of 좋아해요 (joahaeyo). It means "to dislike" or "to hate."',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l5,E'저의 취미는 케이드라마 보는 것이에요.\n케이드라마를 보면서 한국어를 공부해요.\n저는 한식도 정말 좋아해요.\n특히 비빔밥과 삼겹살을 좋아해요.\n또 케이팝에도 관심이 많아요.\nBTS 노래를 들으면 기분이 좋아져요.\n한국 문화를 통해 한국어를 배우는 것이 정말 재미있어요!',E'My hobby is watching K-dramas.\nI study Korean while watching K-dramas.\nI also really like Korean food.\nEspecially bibimbap and samgyeopsal.\nI also have a lot of interest in K-pop.\nWhen I listen to BTS songs, I feel better.\nLearning Korean through Korean culture is really fun!',1);

-- ============================================================
-- MISSION 6: Where Are You Going? (어디 가요?)
-- ============================================================

DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l6;
DELETE FROM public.lesson_grammar     WHERE lesson_id = l6;
DELETE FROM public.lesson_dialogues   WHERE lesson_id = l6;
DELETE FROM public.lesson_exercises   WHERE lesson_id = l6;
DELETE FROM public.lesson_reading     WHERE lesson_id = l6;

INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l6,'어디','eodi','where',1),
(l6,'가다','gada','to go',2),
(l6,'오다','oda','to come',3),
(l6,'카페','kape','café',4),
(l6,'학교','hakgyo','school',5),
(l6,'회사','hoesa','company / office',6),
(l6,'집','jip','house / home',7),
(l6,'병원','byeongwon','hospital',8),
(l6,'마트','mateu','supermarket / mart',9),
(l6,'공원','gongwon','park',10),
(l6,'지하철역','jihacheolyeok','subway station',11),
(l6,'버스 정류장','beoseu jeongnyujang','bus stop',12),
(l6,'택시','taeksi','taxi',13),
(l6,'걸어서','georeoseo','on foot / by walking',14),
(l6,'같이 가다','gachi gada','to go together',15);

INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l6,'Asking Where Someone Is Going','어디 + 가요?','어디 가요? means "Where are you going?" It is casual and very common in everyday Korean. For more polite/formal use: 어디 가세요? or 어디 가십니까?','[{"korean":"어디 가요?","romanization":"Eodi gayo?","english":"Where are you going?"},{"korean":"카페에 가요.","romanization":"Kapee gayo.","english":"I am going to a café."}]',1),
(l6,'Location Particle: ~에 (to/at a place)','Place + 에 + 가다/오다','에 is the location/direction particle. When used with movement verbs like 가다 (go) and 오다 (come), it marks the destination. Think of 에 as "to" or "at."','[{"korean":"학교에 가요.","romanization":"Hakgyoe gayo.","english":"I am going to school."},{"korean":"집에 와요.","romanization":"Jibe wayo.","english":"Come to (my) house."}]',2),
(l6,'How to Get There: ~(으)로 가다','Transportation/direction + (으)로 + 가다','(으)로 indicates the means or method of movement. Use 로 after vowels and 으로 after consonants.','[{"korean":"지하철로 가요.","romanization":"Jihachelro gayo.","english":"I am going by subway."},{"korean":"걸어서 가요.","romanization":"Georeoseo gayo.","english":"I am going on foot."}]',3);

INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l6,'준서','어? 유나 씨, 어디 가요?','Eo? Yuna ssi, eodi gayo?','Oh? Yuna, where are you going?',1),
(l6,'유나','카페에 가요. 친구를 만나려고요. 준서 씨는요?','Kapee gayo. Chingureul mannalyeogoyo. Junseo ssineunyo?','I am going to a café. I am going to meet a friend. What about you, Junseo?',2),
(l6,'준서','저는 회사에 가요. 오늘 중요한 회의가 있어요.','Jeoneun hoesae gayo. Oneul jungyohan hoeiga isseoyo.','I am going to work. There is an important meeting today.',3),
(l6,'유나','어떻게 가요? 지하철로요?','Eotteoke gayo? Jihachelroyо?','How are you going? By subway?',4),
(l6,'준서','아니요, 오늘은 택시로 가요. 시간이 없어서요.','Aniyo, oneureun taeksiro gayo. Sigani eopseosoyo.','No, today I am going by taxi. Because I am short on time.',5),
(l6,'유나','그렇군요. 조심해서 가세요!','Geureokkunyo. Josimhaeseo gaseyo!','I see. Take care on your way!',6);

INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l6,'How do you say "Where are you going?" casually in Korean?','["어디 있어요?","어디 가요?","어디서 와요?","어디로 해요?"]',1,'어디 가요? = Where are you going? 어디 (where) + 가요 (going). Simple and very common in daily Korean.',1),
(l6,'학교에 가요 means:','["I came from school","I am at school","I am going to school","Is the school here?"]',2,'학교 (school) + 에 (direction particle "to") + 가요 (going) = "I am going to school."',2),
(l6,'Which particle marks the destination when using 가다 or 오다?','["에서","을/를","이/가","에"]',3,'에 is the destination/location particle used with movement verbs. 학교에 가요 (going to school), 집에 와요 (come home).',3),
(l6,'지하철로 가요 means:','["I came by subway","I am going by subway","The subway is here","I like the subway"]',1,'로 after 지하철 (subway) indicates the means of transportation. 지하철로 가요 = "I am going by subway."',4),
(l6,'What does 같이 가다 mean?','["to go home","to go alone","to go together","to come together"]',2,'같이 (together) + 가다 (to go) = "to go together." 같이 가요! means "Let us go together!"',5);

INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l6,E'오늘 친구와 카페에 갔어요.\n카페는 회사 근처에 있었어요.\n지하철로 갔어요.\n지하철역에서 카페까지 걸어서 5분이었어요.\n친구가 이미 와 있었어요.\n커피를 마시면서 오랫동안 이야기했어요.\n집에 올 때는 버스를 탔어요.\n정말 좋은 하루였어요.',E'Today I went to a café with a friend.\nThe café was near the office.\nI went by subway.\nFrom the subway station to the café it was 5 minutes on foot.\nMy friend was already there.\nWe talked for a long time while drinking coffee.\nOn the way home, I took the bus.\nIt was a really good day.',1);

END $$;
