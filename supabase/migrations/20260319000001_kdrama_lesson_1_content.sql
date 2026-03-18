-- K-Drama Book — Mission 1: Nice to Meet You (만나서 반갑습니다)
-- Fills all 5 content tabs: Vocabulary, Grammar, Dialogue, Exercises, Reading

DO $$
DECLARE
  lesson_id uuid;
BEGIN
  SELECT id INTO lesson_id
    FROM public.textbook_lessons
   WHERE book = 'kdrama' AND sort_order = 1;

  IF lesson_id IS NULL THEN
    RAISE NOTICE 'kdrama lesson sort_order=1 not found — skipping';
    RETURN;
  END IF;

  -- Clear old data to avoid duplicates
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = lesson_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = lesson_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = lesson_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = lesson_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = lesson_id;

  -- ────────────────────────────────────────────────────────────
  -- VOCABULARY  (20 words — first-meeting essentials)
  -- ────────────────────────────────────────────────────────────
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (lesson_id, '안녕하세요',           'annyeonghaseyo',              'Hello / How do you do? (polite)',           1),
  (lesson_id, '만나서 반갑습니다',    'mannaseo bangapseumnida',     'Nice to meet you (formal)',                  2),
  (lesson_id, '처음 뵙겠습니다',      'cheoeum boepgesseumnida',     'Nice to meet you for the first time (very formal)', 3),
  (lesson_id, '저는 ~입니다',         'jeoneun ~imnida',             'I am ~ (formal self-introduction)',         4),
  (lesson_id, '이름',                 'ireum',                       'name',                                      5),
  (lesson_id, '성함',                 'seongham',                    'name (honorific form)',                     6),
  (lesson_id, '잘 부탁드립니다',      'jal butakdeurimnida',         'Please take care of me (set phrase)',        7),
  (lesson_id, '소개하다',             'sogaehada',                   'to introduce',                              8),
  (lesson_id, '인사하다',             'insahada',                    'to greet',                                  9),
  (lesson_id, '처음',                 'cheoeum',                     'first time',                                10),
  (lesson_id, '반갑다',               'bangapda',                    'to be pleased / glad to meet',              11),
  (lesson_id, '선배',                 'seonbae',                     'senior (at work or school)',                12),
  (lesson_id, '후배',                 'hubae',                       'junior (at work or school)',                13),
  (lesson_id, '동료',                 'dongnyeo',                    'colleague',                                 14),
  (lesson_id, '명함',                 'myeongham',                   'business card',                             15),
  (lesson_id, '어디서 오셨어요?',     'eodiseo osyeosseoyo?',        'Where are you from?',                       16),
  (lesson_id, '직업',                 'jigeop',                      'job / occupation',                          17),
  (lesson_id, '눈이 마주치다',        'nuni majuchida',              'eyes to meet (classic K-drama moment)',     18),
  (lesson_id, '운명',                 'unmyeong',                    'fate / destiny',                            19),
  (lesson_id, '반갑습니다',           'bangapseumnida',              'Nice to meet you / I am glad (formal)',     20);

  -- ────────────────────────────────────────────────────────────
  -- GRAMMAR  (3 rules)
  -- ────────────────────────────────────────────────────────────
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (
    lesson_id,
    'Formal "to be": ~입니다 / ~예요/이에요',
    '[Noun] + 입니다 (formal) / 예요/이에요 (polite)',
    'Use ~입니다 in presentations and formal first meetings. Use ~예요 (after vowel) or ~이에요 (after consonant) in everyday polite speech.',
    '[{"korean":"저는 수진입니다.","english":"I am Sujin. (formal)"},{"korean":"저는 수진이에요.","english":"I am Sujin. (polite)"},{"korean":"학생입니다.","english":"I am a student. (formal)"}]',
    1
  ),
  (
    lesson_id,
    'Self-introduction: ~(이)라고 합니다',
    '[Name/Title] + (이)라고 합니다',
    'A common and natural way to introduce yourself by name in Korean. Use 라고 after a vowel, 이라고 after a consonant.',
    '[{"korean":"수진이라고 합니다.","english":"I am called Sujin."},{"korean":"민준이라고 합니다.","english":"I am called Minjun."},{"korean":"선생님이라고 합니다.","english":"I am called Teacher."}]',
    2
  ),
  (
    lesson_id,
    'Formality levels of "Nice to meet you"',
    '처음 뵙겠습니다 > 만나서 반갑습니다 > 반가워요 > 반가워',
    'Korean has four levels here: very formal (meeting elders/bosses), formal, polite, and casual. In K-Dramas, characters often switch levels to signal their relationship.',
    '[{"korean":"처음 뵙겠습니다.","english":"(Very formal — first meeting a superior)"},{"korean":"만나서 반갑습니다.","english":"(Formal — standard first introduction)"},{"korean":"반가워요.","english":"(Polite — meeting a peer)"},{"korean":"반가워!","english":"(Casual — meeting a friend)"}]',
    3
  );

  -- ────────────────────────────────────────────────────────────
  -- DIALOGUE  — "The New Employee" (K-Drama office first meeting)
  -- Characters: 수진 Sujin (new employee) · 민준 Minjun (senior)
  -- ────────────────────────────────────────────────────────────
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (lesson_id, '수진', '실례합니다. 저 오늘부터 여기서 일하게 된 김수진입니다.',
    'Sillyehamnida. Jeo oneulbuteo yeogiseo ilhage doen Kim Sujinimnida.',
    'Excuse me. I am Kim Sujin, starting work here from today.', 1),
  (lesson_id, '민준', '아, 처음 뵙겠습니다! 저는 이민준이라고 합니다.',
    'A, cheoeum boepgesseumnida! Jeoneun Lee Minjunirado hamnida.',
    'Oh, nice to meet you for the first time! I am called Lee Minjun.', 2),
  (lesson_id, '수진', '만나서 정말 반갑습니다, 이민준 선배님.',
    'Mannaseo jeongmal bangapseumnida, Lee Minjun seonbaenim.',
    'I am really pleased to meet you, Senior Lee Minjun.', 3),
  (lesson_id, '민준', '저도 반갑습니다. 혹시 명함 있으세요?',
    'Jeodo bangapseumnida. Hoksi myeongham isseuseyo?',
    'I am glad to meet you too. Do you have a business card, by any chance?', 4),
  (lesson_id, '수진', '네, 여기 있습니다. 잘 부탁드립니다.',
    'Ne, yeogi itseumnida. Jal butakdeurimnida.',
    'Yes, here it is. Please take good care of me.', 5),
  (lesson_id, '민준', '저도 잘 부탁드려요. 어디서 오셨어요?',
    'Jeodo jal butakdeuryeoyo. Eodiseo osyeosseoyo?',
    'Please take care of me too. Where are you from?', 6),
  (lesson_id, '수진', '부산에서 왔어요. 서울은 처음이에요.',
    'Busaneseo wasseoyo. Seoureun cheoeumieoyo.',
    'I came from Busan. It is my first time in Seoul.', 7),
  (lesson_id, '민준', '그렇군요. 앞으로 잘 지내요!',
    'Geureokkunyo. Apeureo jal jinaeyo!',
    'Is that so. Let us get along well from now on!', 8),
  (lesson_id, '수진', '감사합니다, 선배님. 저도 열심히 하겠습니다.',
    'Gamsahamnida, seonbaenim. Jeodo yeolsimhi hagetseumnida.',
    'Thank you, Senior. I will work hard too.', 9);

  -- ────────────────────────────────────────────────────────────
  -- EXERCISES  (5 multiple-choice questions)
  -- ────────────────────────────────────────────────────────────
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (
    lesson_id,
    'Which phrase is the MOST formal way to say "Nice to meet you"?',
    '["반가워!", "만나서 반갑습니다", "처음 뵙겠습니다", "반가워요"]',
    2,
    '처음 뵙겠습니다 is the most formal — used when meeting superiors or elders for the first time.',
    1
  ),
  (
    lesson_id,
    'What does 잘 부탁드립니다 mean?',
    '["See you later", "Thank you very much", "Please take care of me", "Nice to meet you"]',
    2,
    '잘 부탁드립니다 is a set phrase said when starting a new relationship — it means "Please take good care of me / I am in your hands."',
    2
  ),
  (
    lesson_id,
    'How do you say "I am Kim Sujin" using the most natural self-introduction form?',
    '["김수진 있습니다", "김수진이라고 합니다", "김수진 해요", "김수진 입어요"]',
    1,
    '~(이)라고 합니다 means "I am called ~" and is the most natural way to introduce yourself by name.',
    3
  ),
  (
    lesson_id,
    'What is 선배 in a Korean workplace?',
    '["A junior colleague", "A manager", "A senior colleague", "A client"]',
    2,
    '선배 refers to someone who joined a company or school before you — your senior. The opposite is 후배 (junior).',
    4
  ),
  (
    lesson_id,
    'Which word means "business card" in Korean?',
    '["이름", "명함", "직업", "성함"]',
    1,
    '명함 is a business card. Exchanging 명함 is an important part of formal first meetings in Korean business culture.',
    5
  );

  -- ────────────────────────────────────────────────────────────
  -- READING  (short passage — first meeting in Korean culture)
  -- ────────────────────────────────────────────────────────────
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (
    lesson_id,
    E'한국에서는 처음 만나는 사람에게 인사를 잘 하는 것이 매우 중요하다. 특히 직장이나 학교에서 처음 만날 때는 "처음 뵙겠습니다"나 "만나서 반갑습니다"와 같은 정중한 인사를 사용한다.\n\n한국 드라마에서도 첫 만남 장면은 항상 중요한 역할을 한다. 주인공들이 눈이 마주치는 순간, 운명적인 만남이 시작되는 것이다. 명함을 교환하거나 서로 이름을 소개하는 장면은 한국 직장 드라마에서 자주 볼 수 있다.\n\n한국 문화에서는 처음 만날 때 나이나 직업을 물어보는 것이 자연스럽다. 이것은 상대방을 어떻게 부를지 결정하기 위해서이다. 한국어는 높임말과 낮춤말이 있기 때문에, 상대방과의 관계를 먼저 파악하는 것이 중요하다.',
    E'In Korea, greeting someone you meet for the first time properly is very important. Especially in the workplace or at school, formal greetings such as "처음 뵙겠습니다" (Nice to meet you for the first time) or "만나서 반갑습니다" (Nice to meet you) are used.\n\nIn Korean dramas, the first-meeting scene always plays an important role. The moment the main characters\' eyes meet, a fateful encounter begins. Scenes where business cards are exchanged or names are introduced are often seen in Korean workplace dramas.\n\nIn Korean culture, it is natural to ask about someone\'s age or job when you first meet them. This is to decide how to address the other person. Since Korean has polite and casual speech levels, it is important to first understand your relationship with the other person.',
    1
  );

END $$;
