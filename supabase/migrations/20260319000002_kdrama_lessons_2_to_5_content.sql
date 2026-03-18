-- K-Drama Book — Missions 2–5 Content
-- Mission 2: Who Are You? (누구세요?)
-- Mission 3: Give Me Your Number (번호 좀 알려주세요)
-- Mission 4: Let's Get Coffee (커피 마실래요?)
-- Mission 5: Awkward Encounters (어색한 만남)

DO $$
DECLARE
  l_id integer;
BEGIN

-- ════════════════════════════════════════════════════════════════
-- MISSION 2: Who Are You? (누구세요?)
-- ════════════════════════════════════════════════════════════════
SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 2;
IF l_id IS NULL THEN RAISE NOTICE 'kdrama lesson 2 not found'; RETURN; END IF;

DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
DELETE FROM public.lesson_grammar    WHERE lesson_id = l_id;
DELETE FROM public.lesson_dialogues  WHERE lesson_id = l_id;
DELETE FROM public.lesson_exercises  WHERE lesson_id = l_id;
DELETE FROM public.lesson_reading    WHERE lesson_id = l_id;

-- VOCABULARY (20 words)
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l_id, '누구세요?',         'nuguseyo?',           'Who are you? (polite)',                1),
(l_id, '저는 ~입니다',      'jeoneun ~imnida',     'I am ~ (formal)',                      2),
(l_id, '어디서 오셨어요?',  'eodiseo osyeosseoyo?','Where are you from? (polite)',          3),
(l_id, '나이',              'nai',                 'age',                                   4),
(l_id, '몇 살이에요?',      'myeot sarieyo?',      'How old are you? (polite)',             5),
(l_id, '직업이 뭐예요?',    'jigeobi mwoyeyo?',    'What is your job?',                    6),
(l_id, '학생',              'haksaeng',            'student',                               7),
(l_id, '회사원',            'hoesawon',            'office worker / employee',              8),
(l_id, '의사',              'uisa',                'doctor',                                9),
(l_id, '변호사',            'byeonhosa',           'lawyer',                               10),
(l_id, '배우',              'baeu',                'actor / actress',                       11),
(l_id, '가수',              'gasu',                'singer',                                12),
(l_id, '한국 사람',         'hanguk saram',        'Korean person',                         13),
(l_id, '외국인',            'oegugin',             'foreigner',                             14),
(l_id, '취미',              'chwimi',              'hobby',                                 15),
(l_id, '뭐 좋아해요?',      'mwo joahaeyo?',       'What do you like?',                    16),
(l_id, '어디 살아요?',      'eodi sarayo?',        'Where do you live?',                    17),
(l_id, '서울',              'Seoul',               'Seoul',                                 18),
(l_id, '고향',              'gohyang',             'hometown',                              19),
(l_id, '수상한',            'susanghan',           'suspicious / strange (K-drama word)',   20);

-- GRAMMAR (3 rules)
INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l_id,
 'Question particle: ~세요? (polite questions)',
 '[Verb stem] + 세요?',
 'Add ~세요 to verb stems to make polite questions. It is the polite honorific form of ~어요/아요 used when asking someone about themselves respectfully.',
 '[{"korean":"어디서 오셨어요?","english":"Where are you from?"},{"korean":"뭐 하세요?","english":"What do you do?"},{"korean":"어디 가세요?","english":"Where are you going?"}]',
 1),
(l_id,
 'Topic marker: ~은/는',
 '[Noun ending in consonant] + 은 / [Noun ending in vowel] + 는',
 'The topic marker ~은/는 sets the topic of the sentence. Use 은 after consonants and 는 after vowels. In K-dramas, characters often emphasize "저는" (as for ME) to contrast themselves with others.',
 '[{"korean":"저는 학생입니다.","english":"I am a student. (As for me...)"},{"korean":"이름은 수진이에요.","english":"My name is Sujin."},{"korean":"취미는 독서예요.","english":"My hobby is reading."}]',
 2),
(l_id,
 'Asking age: 몇 살이에요? vs 연세가 어떻게 되세요?',
 '몇 살이에요? (casual/polite) / 연세가 어떻게 되세요? (very formal)',
 'Korean age questions change based on formality. Use 몇 살이에요? with peers and younger people. Use 연세가 어떻게 되세요? with elders. In K-Dramas, asking age is one of the first things characters do to determine speech level.',
 '[{"korean":"몇 살이에요?","english":"How old are you? (polite)"},{"korean":"연세가 어떻게 되세요?","english":"May I ask your age? (very formal)"},{"korean":"저는 스물다섯 살이에요.","english":"I am 25 years old."}]',
 3);

-- DIALOGUE — "The Mysterious Neighbor"
INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l_id, '지수', '저기요, 혹시 옆집에 새로 이사 오신 분이세요?',
 'Jeogiyo, hoksi yeopjibe saero isa osin buniseyo?',
 'Excuse me, are you the person who just moved in next door?', 1),
(l_id, '민호', '네, 저 오늘 이사 왔어요. 저는 박민호라고 합니다.',
 'Ne, jeo oneul isa wasseoyo. Jeoneun Bak Minhorago hamnida.',
 'Yes, I moved in today. I am called Park Minho.', 2),
(l_id, '지수', '아, 반가워요. 저는 김지수예요. 어디서 오셨어요?',
 'A, bangawoyo. Jeoneun Kim Jisuyeyo. Eodiseo osyeosseoyo?',
 'Oh, nice to meet you. I am Kim Jisu. Where are you from?', 3),
(l_id, '민호', '대구에서 왔어요. 직업 때문에 서울로 왔습니다.',
 'Daegueseo wasseoyo. Jigeop ttaemune Seollo watseumnida.',
 'I came from Daegu. I came to Seoul because of my job.', 4),
(l_id, '지수', '직업이 뭐예요?',
 'Jigeobi mwoyeyo?',
 'What is your job?', 5),
(l_id, '민호', '저는 변호사예요. 지수 씨는요?',
 'Jeoneun byeonhosayeyo. Jisu ssineunyo?',
 'I am a lawyer. How about you, Jisu?', 6),
(l_id, '지수', '저는 디자이너예요. 아, 그런데 몇 살이에요? 말 놓을까요?',
 'Jeoneun dijaineoeyeyo. A, geureonde myeot sarieyo? Mal noeulkkayo?',
 'I am a designer. Oh, by the way, how old are you? Should we speak casually?', 7),
(l_id, '민호', '저 스물여덟이에요. 동갑이면 편하게 얘기해요!',
 'Jeo seumulyeodeorieyo. Donggabimyeon pyeonhage yaegihaeyo!',
 'I am 28. If we are the same age, let us talk casually!', 8);

-- EXERCISES (5 questions)
INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l_id, 'How do you politely ask "Where are you from?"',
 '["어디서 왔어?", "어디서 오셨어요?", "어디 가세요?", "어디 살아?"]',
 1, '어디서 오셨어요? is the polite way to ask where someone is from. 왔어 is casual, 가세요 means "where are you going", and 살아 means "where do you live" casually.', 1),
(l_id, 'What does 회사원 mean?',
 '["Teacher", "Office worker", "Student", "Doctor"]',
 1, '회사원 means an office worker or company employee. 회사 = company, 원 = member/person.', 2),
(l_id, 'Choose the correct topic marker: "취미___ 뭐예요?"',
 '["이", "을", "는", "가"]',
 2, 'Since 취미 ends in a vowel (ㅣ), the correct topic marker is 는. Use 은 after consonants and 는 after vowels.', 3),
(l_id, 'Which is the very formal way to ask someone''s age?',
 '["몇 살이야?", "나이가 뭐야?", "연세가 어떻게 되세요?", "몇 살이에요?"]',
 2, '연세가 어떻게 되세요? is the most formal and respectful way to ask age, using 연세 (honorific for age) instead of 나이.', 4),
(l_id, 'In K-Dramas, why do characters ask each other''s age when they first meet?',
 '["To be nosy", "To decide how formally to speak", "To check if they can date", "It is a Korean law"]',
 1, 'Korean has formal/informal speech levels. Knowing someone''s age helps decide whether to use 존댓말 (formal) or 반말 (casual) speech. This is a key cultural aspect shown in many K-Dramas.', 5);

-- READING
INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l_id,
 E'한국 드라마에서 "누구세요?"는 가장 자주 나오는 대사 중 하나다. 현관문을 열 때, 낯선 사람을 만났을 때, 또는 전화를 받을 때 한국인들은 이 말을 자주 사용한다.\n\n한국 문화에서 처음 만나면 이름, 나이, 직업을 물어보는 것이 자연스럽다. 이것은 단순한 호기심이 아니라 상대방과의 관계를 정립하기 위한 것이다. 한국어에는 높임말과 반말이 있어서, 나이를 알아야 어떤 말투를 쓸지 결정할 수 있다.\n\n드라마에서 주인공이 "동갑이네!" (같은 나이)라고 말하면, 그때부터 반말로 바꾸는 장면을 자주 볼 수 있다. 이처럼 한국에서는 나이가 사회적 관계의 기본이 된다.',
 E'In Korean dramas, "누구세요?" (Who are you?) is one of the most common lines. When opening the front door, meeting a stranger, or answering the phone, Koreans frequently use this expression.\n\nIn Korean culture, when meeting for the first time, it is natural to ask about names, ages, and jobs. This is not mere curiosity but rather for establishing the relationship with the other person. Since Korean has formal and casual speech levels, knowing someone''s age is essential to decide which speech style to use.\n\nIn dramas, when a main character says "동갑이네!" (We are the same age!), you can often see the scene where they switch to casual speech from that point. In this way, age forms the foundation of social relationships in Korea.',
 1);


-- ════════════════════════════════════════════════════════════════
-- MISSION 3: Give Me Your Number (번호 좀 알려주세요)
-- ════════════════════════════════════════════════════════════════
SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 3;
IF l_id IS NULL THEN RAISE NOTICE 'kdrama lesson 3 not found'; RETURN; END IF;

DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
DELETE FROM public.lesson_grammar    WHERE lesson_id = l_id;
DELETE FROM public.lesson_dialogues  WHERE lesson_id = l_id;
DELETE FROM public.lesson_exercises  WHERE lesson_id = l_id;
DELETE FROM public.lesson_reading    WHERE lesson_id = l_id;

-- VOCABULARY (20 words)
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l_id, '전화번호',          'jeonhwabeonho',       'phone number',                          1),
(l_id, '번호 좀 알려주세요','beonho jom allyeojuseyo','Please tell me your number',          2),
(l_id, '연락처',            'yeollakcheo',         'contact info',                          3),
(l_id, '카카오톡',          'KakaoTok',            'KakaoTalk (Korean messaging app)',       4),
(l_id, '문자',              'munja',               'text message',                          5),
(l_id, '전화하다',          'jeonhwahada',         'to call (on the phone)',                6),
(l_id, '메시지',            'mesiji',              'message',                               7),
(l_id, '연락하다',          'yeollakhada',         'to contact',                            8),
(l_id, '나중에',            'najunge',             'later',                                 9),
(l_id, '바쁘다',            'bappeuda',            'to be busy',                           10),
(l_id, '시간 있어요?',      'sigan isseoyo?',      'Do you have time?',                    11),
(l_id, '전화 받다',         'jeonhwa batda',       'to answer the phone',                  12),
(l_id, '끊다',              'kkeunta',             'to hang up (the phone)',               13),
(l_id, '답장하다',          'dapjanghada',         'to reply (to a message)',              14),
(l_id, '여보세요',          'yeoboseyo',           'Hello? (phone greeting)',              15),
(l_id, '잠깐만요',          'jamkkanmanyo',        'Just a moment, please',                16),
(l_id, '알겠어요',          'algesseoyo',          'I understand / Got it',                17),
(l_id, '죄송합니다',        'joesonghamnida',      'I am sorry (formal)',                  18),
(l_id, '괜찮아요',          'gwaenchanayo',        'It is okay',                           19),
(l_id, '다시 전화할게요',   'dasi jeonhwahalgeyo', 'I will call again',                    20);

-- GRAMMAR (3 rules)
INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l_id,
 'Polite request: ~주세요',
 '[Verb stem] + 아/어 주세요',
 'Add ~주세요 to politely ask someone to do something for you. It literally means "please do ~ for me." This is one of the most useful patterns in everyday Korean.',
 '[{"korean":"번호 좀 알려주세요.","english":"Please tell me your number."},{"korean":"전화해 주세요.","english":"Please call me."},{"korean":"기다려 주세요.","english":"Please wait for me."}]',
 1),
(l_id,
 'Future tense promise: ~ㄹ/을게요',
 '[Verb stem ending in vowel] + ㄹ게요 / [consonant] + 을게요',
 'Use ~ㄹ게요/을게요 when making a promise or stating your intention. It implies you are deciding to do something for the listener''s benefit. Very common in phone conversations.',
 '[{"korean":"나중에 연락할게요.","english":"I will contact you later."},{"korean":"다시 전화할게요.","english":"I will call again."},{"korean":"문자 보낼게요.","english":"I will send a text."}]',
 2),
(l_id,
 'Softener: 좀 (a bit / please)',
 '좀 + [verb]',
 '좀 (short for 조금 "a little") softens requests, making them sound less demanding. Koreans use it very naturally in conversation. Without 좀, a request can sound too direct.',
 '[{"korean":"좀 도와주세요.","english":"Please help me (a bit)."},{"korean":"좀 기다려 주세요.","english":"Please wait a moment."},{"korean":"번호 좀 알려주세요.","english":"Could you tell me your number?"}]',
 3);

-- DIALOGUE — "After a Chance Meeting"
INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l_id, '세영', '오늘 정말 재미있었어요. 또 만나고 싶어요.',
 'Oneul jeongmal jaemiisseosseoyo. Tto mannago sipeoyo.',
 'Today was really fun. I want to meet again.', 1),
(l_id, '준혁', '저도요! 혹시 카카오톡 해요?',
 'Jeodoyo! Hoksi KakaoTok haeyo?',
 'Me too! Do you use KakaoTalk?', 2),
(l_id, '세영', '네, 해요. 아이디가 뭐예요?',
 'Ne, haeyo. Aidiga mwoyeyo?',
 'Yes, I do. What is your ID?', 3),
(l_id, '준혁', '제 아이디는 junhyuk93이에요. 전화번호도 알려줄까요?',
 'Je aidineun junhyuk93ieyo. Jeonhwabeonhodo allyeojulkkayo?',
 'My ID is junhyuk93. Should I give you my phone number too?', 4),
(l_id, '세영', '네, 번호 좀 알려주세요.',
 'Ne, beonho jom allyeojuseyo.',
 'Yes, please tell me your number.', 5),
(l_id, '준혁', '010-1234-5678이에요. 저장해 주세요!',
 'Gong-il-gong il-i-sam-sa o-yuk-chil-pal-ieyo. Jeojanghae juseyo!',
 'It is 010-1234-5678. Please save it!', 6),
(l_id, '세영', '네, 저장했어요. 나중에 연락할게요!',
 'Ne, jeojanhaesseoyo. Najunge yeollakhalgeyo!',
 'Yes, I saved it. I will contact you later!', 7),
(l_id, '준혁', '좋아요. 기다릴게요. 조심히 가세요!',
 'Joayo. Gidarilgeyo. Josimhi gaseyo!',
 'Great. I will wait. Go safely!', 8);

-- EXERCISES (5 questions)
INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l_id, 'How do you politely say "Please tell me your number"?',
 '["번호 알려줘", "번호 좀 알려주세요", "번호 뭐야?", "번호 줘"]',
 1, '번호 좀 알려주세요 uses both the softener 좀 and the polite request form ~주세요, making it the appropriate polite form.', 1),
(l_id, 'What does 여보세요 mean?',
 '["Goodbye", "Thank you", "Hello? (on the phone)", "Excuse me"]',
 2, '여보세요 is the standard Korean phone greeting, like "Hello?" when answering or making a call.', 2),
(l_id, 'Which is the correct way to say "I will call again"?',
 '["다시 전화했어요", "다시 전화하세요", "다시 전화할게요", "다시 전화해요"]',
 2, '다시 전화할게요 uses ~ㄹ게요 (future promise form), meaning "I will call again" as a commitment to the listener.', 3),
(l_id, 'What is KakaoTalk?',
 '["A Korean food", "A Korean TV channel", "Korea''s main messaging app", "A Korean greeting"]',
 2, 'KakaoTalk (카카오톡) is Korea''s dominant messaging app — used by over 90% of the population. In K-Dramas, characters always exchange KakaoTalk IDs.', 4),
(l_id, 'What does the word 좀 do in a sentence?',
 '["Makes it negative", "Makes it past tense", "Softens the request", "Makes it a question"]',
 2, '좀 (short for 조금 "a little") softens requests to sound more polite and less demanding. It is essential in natural Korean conversation.', 5);

-- READING
INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l_id,
 E'한국에서 연락처를 교환하는 방법은 전화번호보다 카카오톡 아이디를 주는 것이 더 일반적이다. 카카오톡은 한국에서 가장 많이 사용하는 메시지 앱으로, 한국인 약 90%가 사용한다.\n\n한국 드라마에서 남녀 주인공이 처음 번호를 교환하는 장면은 항상 설레는 순간이다. "번호 좀 알려주세요"라고 조심스럽게 물어보거나, "카톡 해요?"라고 가볍게 물어보기도 한다.\n\n한국의 전화번호는 010으로 시작하며, 총 11자리이다. 전화를 받을 때는 "여보세요"라고 하고, 끊을 때는 "끊을게요" 또는 "그럼 들어가요"라고 말한다. 특히 윗사람에게 먼저 끊으면 예의에 어긋나기 때문에, 드라마에서 후배가 항상 상대방이 먼저 끊을 때까지 기다리는 모습을 자주 볼 수 있다.',
 E'In Korea, when exchanging contact information, giving a KakaoTalk ID is more common than giving a phone number. KakaoTalk is Korea''s most widely used messaging app, with about 90% of Koreans using it.\n\nIn Korean dramas, the scene where the male and female leads exchange numbers for the first time is always an exciting moment. They might cautiously ask "번호 좀 알려주세요" (Please tell me your number) or casually say "카톡 해요?" (Do you use KakaoTalk?).\n\nKorean phone numbers start with 010 and have 11 digits total. When answering the phone, Koreans say "여보세요" (Hello?), and when hanging up, they say "끊을게요" (I will hang up now) or "그럼 들어가요" (Then, get home safely). Particularly, since hanging up before a senior person is considered rude, you can often see in dramas how juniors always wait until the other person hangs up first.',
 1);


-- ════════════════════════════════════════════════════════════════
-- MISSION 4: Let's Get Coffee (커피 마실래요?)
-- ════════════════════════════════════════════════════════════════
SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 4;
IF l_id IS NULL THEN RAISE NOTICE 'kdrama lesson 4 not found'; RETURN; END IF;

DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
DELETE FROM public.lesson_grammar    WHERE lesson_id = l_id;
DELETE FROM public.lesson_dialogues  WHERE lesson_id = l_id;
DELETE FROM public.lesson_exercises  WHERE lesson_id = l_id;
DELETE FROM public.lesson_reading    WHERE lesson_id = l_id;

-- VOCABULARY (20 words)
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l_id, '커피',              'keopi',               'coffee',                                1),
(l_id, '마실래요?',         'masilleyo?',          'Shall we drink? / Do you want to drink?', 2),
(l_id, '카페',              'kape',                'cafe',                                  3),
(l_id, '아메리카노',        'amerikano',           'Americano (most popular in Korea)',      4),
(l_id, '라떼',              'latte',               'latte',                                 5),
(l_id, '아이스',            'aiseu',               'iced',                                  6),
(l_id, '뜨거운',            'tteugeoun',           'hot (temperature)',                     7),
(l_id, '같이',              'gachi',               'together',                              8),
(l_id, '시간 괜찮아요?',    'sigan gwaenchanayo?', 'Is this time okay?',                    9),
(l_id, '언제 만날까요?',    'eonje mannalkkayo?',  'When shall we meet?',                  10),
(l_id, '어디서 만날까요?',  'eodiseo mannalkkayo?','Where shall we meet?',                  11),
(l_id, '좋아요',            'joayo',               'Sounds good / I like it',              12),
(l_id, '약속',              'yaksok',              'appointment / promise / date',          13),
(l_id, '기다리다',          'gidarida',            'to wait',                              14),
(l_id, '늦다',              'neutda',              'to be late',                           15),
(l_id, '벌써',              'beolsseo',            'already',                              16),
(l_id, '그럼',              'geureom',             'Then / In that case',                  17),
(l_id, '혹시',              'hoksi',               'by any chance / perhaps',              18),
(l_id, '괜찮다',            'gwaenchanta',         'to be okay / fine',                    19),
(l_id, '설레다',            'seolleda',            'to be excited / flutter (romantic)',    20);

-- GRAMMAR (3 rules)
INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l_id,
 'Suggesting: ~(으)ㄹ래요?',
 '[Verb stem] + ㄹ래요? (vowel) / 을래요? (consonant)',
 'Use ~ㄹ래요? to suggest doing something together or to ask what someone wants to do. It is casual-polite and very natural for invitations between people of similar age.',
 '[{"korean":"커피 마실래요?","english":"Shall we drink coffee?"},{"korean":"같이 갈래요?","english":"Shall we go together?"},{"korean":"뭐 먹을래요?","english":"What do you want to eat?"}]',
 1),
(l_id,
 'Suggesting (formal): ~(으)ㄹ까요?',
 '[Verb stem] + ㄹ까요? (vowel) / 을까요? (consonant)',
 'Use ~ㄹ까요? to suggest or offer in a more polite way. It is used when you are being considerate of the other person''s preference. Very common in K-Drama date planning scenes.',
 '[{"korean":"어디서 만날까요?","english":"Where shall we meet?"},{"korean":"언제 볼까요?","english":"When shall we see each other?"},{"korean":"제가 갈까요?","english":"Shall I go?"}]',
 2),
(l_id,
 'Together: 같이 + verb',
 '같이 + [verb]',
 '같이 means "together" and is placed before the verb. In Korean dating culture, "같이 커피 마셔요" (Let us drink coffee together) is the classic first-date invitation.',
 '[{"korean":"같이 커피 마셔요.","english":"Let us drink coffee together."},{"korean":"같이 영화 볼래요?","english":"Shall we watch a movie together?"},{"korean":"같이 갈까요?","english":"Shall we go together?"}]',
 3);

-- DIALOGUE — "The Coffee Date"
INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l_id, '하은', '준혁 씨, 혹시 내일 시간 있어요?',
 'Junhyeok ssi, hoksi naeil sigan isseoyo?',
 'Junhyeok, do you happen to have time tomorrow?', 1),
(l_id, '준혁', '내일이요? 오후에는 괜찮아요. 왜요?',
 'Naeiriyo? Ohue-neun gwaenchanayo. Waeyo?',
 'Tomorrow? I am free in the afternoon. Why?', 2),
(l_id, '하은', '같이 커피 마실래요? 새로 생긴 카페가 있어요.',
 'Gachi keopi masilleyo? Saero saenggin kapega isseoyo.',
 'Shall we drink coffee together? There is a new cafe that just opened.', 3),
(l_id, '준혁', '좋아요! 어디서 만날까요?',
 'Joayo! Eodiseo mannalkkayo?',
 'Sounds good! Where shall we meet?', 4),
(l_id, '하은', '강남역 3번 출구에서 만날까요? 거기서 가까워요.',
 'Gangnamyeok sambon chulgueseo mannalkkayo? Geogiseo gakkawoyo.',
 'Shall we meet at Gangnam Station exit 3? It is close from there.', 5),
(l_id, '준혁', '네, 좋아요. 몇 시에 만날까요?',
 'Ne, joayo. Myeot sie mannalkkayo?',
 'Yes, great. What time shall we meet?', 6),
(l_id, '하은', '세 시 어때요?',
 'Se si eottaeyo?',
 'How about 3 o''clock?', 7),
(l_id, '준혁', '완벽해요. 그럼 내일 봐요! 늦지 마세요~',
 'Wanbyeokhaeyo. Geureom naeil bwayo! Neutji maseyo~',
 'Perfect. Then see you tomorrow! Don''t be late~', 8),
(l_id, '하은', '네, 약속! 기대돼요.',
 'Ne, yaksok! Gidaedwoeyo.',
 'Yes, it is a promise! I am looking forward to it.', 9);

-- EXERCISES (5 questions)
INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l_id, 'How do you say "Shall we drink coffee together?"',
 '["커피 마셨어요?", "같이 커피 마실래요?", "커피 마시세요", "커피 좋아해요?"]',
 1, '같이 커피 마실래요? uses 같이 (together) and ~ㄹ래요? (shall we) to make a natural invitation.', 1),
(l_id, 'What is 약속?',
 '["A drink", "An appointment or promise", "A cafe name", "A subway station"]',
 1, '약속 means both "appointment" and "promise" in Korean. When making plans, Koreans say 약속 있어요 (I have plans/an appointment).', 2),
(l_id, 'What is the most popular coffee drink in Korea?',
 '["Latte", "Cappuccino", "Americano", "Espresso"]',
 2, 'Americano (아메리카노) is by far the most popular coffee in Korea. You will hear it constantly in K-Dramas, often shortened to 아아 (ah-ah) for iced Americano.', 3),
(l_id, 'What does 설레다 mean?',
 '["To be angry", "To be bored", "To be excited / to flutter", "To be tired"]',
 2, '설레다 describes the fluttering, excited feeling in your chest — especially for romantic anticipation. It is one of the most iconic emotional words in K-Dramas.', 4),
(l_id, '"어디서 만날까요?" uses which grammar pattern?',
 '["~주세요 (request)", "~ㄹ래요? (casual suggestion)", "~ㄹ까요? (polite suggestion)", "~세요? (honorific question)"]',
 2, '~ㄹ까요? is the polite suggestion form. 만나다 → 만날까요? means "Shall we meet?" with consideration for the other person''s preference.', 5);

-- READING
INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l_id,
 E'한국은 세계에서 1인당 카페 수가 가장 많은 나라 중 하나다. 서울에만 수만 개의 카페가 있으며, 한국인들은 하루에 커피를 2~3잔 마시는 것이 보통이다.\n\n한국 드라마에서 "커피 마실래요?"는 단순히 커피를 마시자는 뜻이 아니다. 이것은 "당신과 시간을 보내고 싶어요"라는 의미로, 첫 데이트의 시작이 되는 경우가 많다. 특히 아이스 아메리카노는 한국의 국민 음료로, 겨울에도 아이스를 마시는 사람이 많다.\n\n카페에서 만나는 약속은 보통 구체적으로 정한다. "강남역 3번 출구에서 만나요"처럼 지하철 역의 출구 번호를 말하는 것이 일반적이다. 한국에서 약속에 늦는 것은 매우 실례이므로, 보통 약속 시간보다 5분 일찍 도착하려고 한다.',
 E'Korea is one of the countries with the most cafes per capita in the world. In Seoul alone, there are tens of thousands of cafes, and it is normal for Koreans to drink 2-3 cups of coffee a day.\n\nIn Korean dramas, "커피 마실래요?" (Shall we drink coffee?) does not simply mean let us drink coffee. It means "I want to spend time with you," and it often becomes the start of a first date. Iced Americano in particular is Korea''s national drink — many people drink it iced even in winter.\n\nWhen making plans to meet at a cafe, Koreans are usually very specific. It is common to say the exit number of a subway station, like "Let us meet at Gangnam Station exit 3." Being late to an appointment is considered very rude in Korea, so people usually try to arrive 5 minutes early.',
 1);


-- ════════════════════════════════════════════════════════════════
-- MISSION 5: Awkward Encounters (어색한 만남)
-- ════════════════════════════════════════════════════════════════
SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 5;
IF l_id IS NULL THEN RAISE NOTICE 'kdrama lesson 5 not found'; RETURN; END IF;

DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
DELETE FROM public.lesson_grammar    WHERE lesson_id = l_id;
DELETE FROM public.lesson_dialogues  WHERE lesson_id = l_id;
DELETE FROM public.lesson_exercises  WHERE lesson_id = l_id;
DELETE FROM public.lesson_reading    WHERE lesson_id = l_id;

-- VOCABULARY (20 words)
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
(l_id, '어색하다',          'eosaekhada',          'to be awkward',                         1),
(l_id, '오해',              'ohae',                'misunderstanding',                      2),
(l_id, '실수',              'silsu',               'mistake',                               3),
(l_id, '죄송합니다',        'joesonghamnida',      'I am sorry (formal)',                   4),
(l_id, '미안해요',          'mianhaeyo',           'I am sorry (polite)',                   5),
(l_id, '괜찮아요',          'gwaenchanayo',        'It is okay',                            6),
(l_id, '아니에요',          'anieyo',              'No / It is not',                        7),
(l_id, '잘못',              'jalmot',              'fault / wrongdoing',                    8),
(l_id, '오해하다',          'ohaehada',            'to misunderstand',                      9),
(l_id, '당황하다',          'danghwanghada',       'to be flustered / embarrassed',        10),
(l_id, '부끄럽다',          'bukkeureobda',        'to be embarrassed / shy',              11),
(l_id, '창피하다',          'changpihada',         'to be ashamed / embarrassed',          12),
(l_id, '뭐라고요?',         'mworagoyo?',          'What did you say? / Excuse me?',       13),
(l_id, '아, 잠깐만요!',     'a, jamkkanmanyo!',    'Oh, wait a moment!',                   14),
(l_id, '그런 뜻이 아니에요','geureon tteusi anieyo','That is not what I meant',              15),
(l_id, '몰랐어요',          'mollasseoyo',         'I did not know',                       16),
(l_id, '깜짝',              'kkamjjak',            'surprise / startled',                   17),
(l_id, '놀라다',            'nollada',             'to be surprised',                      18),
(l_id, '넘어지다',          'neomeojida',          'to fall down / trip',                  19),
(l_id, '부딪치다',          'budichida',           'to bump into / collide',               20);

-- GRAMMAR (3 rules)
INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
(l_id,
 'Negation: 아니에요 (It is not) and 안 + verb',
 '아니에요 (not be) / 안 + [verb] (do not)',
 'Use 아니에요 to negate nouns ("It is not ~") and 안 before verbs to negate actions ("I do not ~"). These are essential for clearing up misunderstandings in K-Drama confrontation scenes.',
 '[{"korean":"제 잘못이 아니에요!","english":"It is not my fault!"},{"korean":"그런 뜻이 아니에요.","english":"That is not what I meant."},{"korean":"안 했어요.","english":"I did not do it."}]',
 1),
(l_id,
 'Past tense: ~았/었어요',
 '[Verb stem with ㅏ/ㅗ] + 았어요 / [other vowels] + 었어요',
 'Add ~았어요 or ~었어요 to make past tense polite sentences. Use 았 when the last vowel of the stem is ㅏ or ㅗ, and 었 for everything else. 하다 verbs become 했어요.',
 '[{"korean":"몰랐어요.","english":"I did not know."},{"korean":"넘어졌어요.","english":"I fell down."},{"korean":"오해했어요.","english":"I misunderstood."}]',
 2),
(l_id,
 'Exclamation: ~(이)잖아요!',
 '[Statement] + 잖아요!',
 'Use ~잖아요 when pointing out something the listener should already know, often with frustration or surprise. Very common in K-Drama arguments. It translates roughly to "you know that!" or "I told you!".',
 '[{"korean":"제 잘못이 아니잖아요!","english":"It is not my fault, you know!"},{"korean":"말했잖아요!","english":"I told you!"},{"korean":"바쁘다고 했잖아요.","english":"I said I was busy, didn''t I!"}]',
 3);

-- DIALOGUE — "The Coffee Spill"
INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
(l_id, '유나', '(넘어지면서) 아!',
 '(neomeojimyeonseo) A!',
 '(while tripping) Ah!', 1),
(l_id, '도윤', '(커피를 쏟으면서) 앗, 죄송합니다! 괜찮으세요?',
 '(keopireul ssodumyeonseo) At, joesonghamnida! Gwaenchanuseyo?',
 '(spilling coffee) Oh, I am sorry! Are you okay?', 2),
(l_id, '유나', '아... 제 옷에 커피가... 이게 뭐예요!',
 'A... je ose keopiga... Ige mwoyeyo!',
 'Ah... there is coffee on my clothes... what is this!', 3),
(l_id, '도윤', '정말 죄송합니다. 제 잘못이에요. 세탁비를 드릴게요.',
 'Jeongmal joesonghamnida. Je jalmosieyo. Setakbireul deurilgeyo.',
 'I am truly sorry. It is my fault. I will pay for the cleaning.', 4),
(l_id, '유나', '아니에요, 괜찮아요. 저도 안 보고 걸었어요.',
 'Anieyo, gwaenchanayo. Jeodo an bogo georeosseoyo.',
 'No, it is okay. I was also walking without looking.', 5),
(l_id, '도윤', '그래도 정말 미안해요. 혹시 다친 곳은 없어요?',
 'Geuraedo jeongmal mianhaeyo. Hoksi dachin goseun eopseoyo?',
 'Even so, I am really sorry. You are not hurt anywhere, are you?', 6),
(l_id, '유나', '네, 괜찮아요. 근데... 깜짝 놀랐어요.',
 'Ne, gwaenchanayo. Geunde... kkamjjak nollasseoyo.',
 'No, I am fine. But... I was really startled.', 7),
(l_id, '도윤', '(웃으면서) 정말 어색하네요. 이렇게 만나다니...',
 '(useumyeonseo) Jeongmal eosaekhaneyo. Ireoke mannadani...',
 '(laughing) This is really awkward. To meet like this...', 8),
(l_id, '유나', '(웃으면서) 맞아요. 드라마 같아요.',
 '(useumyeonseo) Majayo. Deurama gatayo.',
 '(laughing) Right. It is like a drama.', 9);

-- EXERCISES (5 questions)
INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
(l_id, 'What is the difference between 죄송합니다 and 미안해요?',
 '["No difference", "죄송합니다 is more formal", "미안해요 is more formal", "죄송합니다 is casual"]',
 1, '죄송합니다 is the more formal apology, used with strangers and superiors. 미안해요 is polite but less formal, used with acquaintances.', 1),
(l_id, 'How do you say "It is not my fault"?',
 '["제 잘못입니다", "제 잘못이에요", "제 잘못이 아니에요", "제 잘못이 있어요"]',
 2, '제 잘못이 아니에요 uses 아니에요 (it is not) to negate. 잘못 means fault/wrongdoing, and 아니에요 negates it.', 2),
(l_id, 'What does 당황하다 mean?',
 '["To be happy", "To be angry", "To be flustered/embarrassed", "To be tired"]',
 2, '당황하다 means to be flustered or caught off guard — the feeling when something unexpected and embarrassing happens. Very common in K-Drama awkward scenes.', 3),
(l_id, 'Choose the correct past tense: "몰___"',
 '["몰랐어요", "몰렀어요", "몰았어요", "몰었어요"]',
 0, '모르다 (to not know) is irregular: 모르 + 았어요 → 몰랐어요. The ㄹ stem changes when conjugated.', 4),
(l_id, 'In K-Dramas, what is the classic awkward first meeting?',
 '["Meeting at a restaurant", "Bumping into each other and spilling something", "Meeting at school", "Being introduced by friends"]',
 1, 'The "bumping into each other" (부딪치다) scene is the most iconic K-Drama first meeting trope. Usually someone spills coffee, drops papers, or falls, creating an awkward but fateful encounter.', 5);

-- READING
INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
(l_id,
 E'한국 드라마에서 가장 유명한 장면 중 하나는 "어색한 첫 만남"이다. 두 주인공이 길에서 부딪치거나, 커피를 쏟거나, 같은 택시를 잡으려다가 처음 만나게 된다.\n\n이런 만남에서 가장 자주 쓰는 표현은 "죄송합니다"와 "괜찮아요"이다. 한국인들은 사소한 실수에도 "죄송합니다"라고 정중하게 사과한다. 상대방은 보통 "괜찮아요" (괜찮습니다)라고 대답한다.\n\n특히 한국어에서는 같은 상황에서도 격식에 따라 사과하는 방법이 다르다. 가까운 사람에게는 "미안해요", 모르는 사람에게는 "죄송합니다", 매우 심한 상황에서는 "정말 죄송합니다"를 사용한다. 드라마에서 주인공이 "그런 뜻이 아니에요!" (That is not what I meant!)라고 변명하는 장면도 자주 볼 수 있는데, 이것이 오해에서 시작된 로맨스의 전형적인 시작이다.',
 E'One of the most famous scenes in Korean dramas is the "awkward first meeting." The two main characters meet for the first time by bumping into each other on the street, spilling coffee, or trying to catch the same taxi.\n\nThe most commonly used expressions in these encounters are "죄송합니다" (I am sorry - formal) and "괜찮아요" (It is okay). Koreans politely apologize with "죄송합니다" even for minor mistakes. The other person usually responds with "괜찮아요" (It is fine).\n\nIn Korean, the way you apologize differs depending on the level of formality, even in the same situation. To close friends, you use "미안해요," to strangers, "죄송합니다," and in very serious situations, "정말 죄송합니다." In dramas, you can also often see scenes where the main character makes excuses saying "그런 뜻이 아니에요!" (That is not what I meant!), which is the typical beginning of a romance born from a misunderstanding.',
 1);

END $$;
