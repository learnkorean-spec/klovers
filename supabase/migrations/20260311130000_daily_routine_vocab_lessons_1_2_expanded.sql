-- Daily Routine: Lessons 1-2 — Expanded to 20 vocabulary words each
-- Lesson 1: Sleeping (잠자기) | Lesson 2: Waking Up (일어나기)

DO $$
DECLARE
  sleeping_id integer;
  waking_id integer;
BEGIN
  SELECT id INTO sleeping_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 1;
  SELECT id INTO waking_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 2;

  -- Delete existing data to avoid duplicates
  IF sleeping_id IS NOT NULL THEN DELETE FROM public.lesson_vocabulary WHERE lesson_id = sleeping_id; END IF;
  IF waking_id IS NOT NULL THEN DELETE FROM public.lesson_vocabulary WHERE lesson_id = waking_id; END IF;
  IF sleeping_id IS NOT NULL THEN DELETE FROM public.lesson_grammar WHERE lesson_id = sleeping_id; END IF;
  IF waking_id IS NOT NULL THEN DELETE FROM public.lesson_grammar WHERE lesson_id = waking_id; END IF;
  IF sleeping_id IS NOT NULL THEN DELETE FROM public.lesson_dialogues WHERE lesson_id = sleeping_id; END IF;
  IF waking_id IS NOT NULL THEN DELETE FROM public.lesson_dialogues WHERE lesson_id = waking_id; END IF;
  IF sleeping_id IS NOT NULL THEN DELETE FROM public.lesson_exercises WHERE lesson_id = sleeping_id; END IF;
  IF waking_id IS NOT NULL THEN DELETE FROM public.lesson_exercises WHERE lesson_id = waking_id; END IF;
  IF sleeping_id IS NOT NULL THEN DELETE FROM public.lesson_reading WHERE lesson_id = sleeping_id; END IF;
  IF waking_id IS NOT NULL THEN DELETE FROM public.lesson_reading WHERE lesson_id = waking_id; END IF;

  -- ============================================================
  -- LESSON 1: SLEEPING (잠자기)
  -- ============================================================
  IF sleeping_id IS NOT NULL THEN
    INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (sleeping_id, '잠을 자다',        'jameul jada',         'to sleep',                         1),
    (sleeping_id, '잠자리에 들다',    'jamjarie deulda',     'to go to bed',                     2),
    (sleeping_id, '졸리다',           'jollida',             'to be sleepy',                     3),
    (sleeping_id, '하품하다',         'hapumhada',           'to yawn',                          4),
    (sleeping_id, '꿈을 꾸다',        'kkumeul kkuda',       'to dream',                         5),
    (sleeping_id, '코를 골다',        'koreul golda',        'to snore',                         6),
    (sleeping_id, '이불',            'ibul',                'blanket/duvet',                    7),
    (sleeping_id, '베개',             'begae',               'pillow',                           8),
    (sleeping_id, '눈을 감다',        'nuneul gamda',        'to close eyes',                    9),
    (sleeping_id, '깊이 자다',        'gipi jada',           'to sleep deeply',                  10),
    (sleeping_id, '불을 끄다',       'bureul kkeuda',       'to turn off the light',            11),
    (sleeping_id, '침대',             'chimdae',             'bed',                              12),
    (sleeping_id, '뒤척이다',         'dwicheogia',          'to toss and turn',                 13),
    (sleeping_id, '잠이 들다',        'jami deulda',         'to fall asleep',                   14),
    (sleeping_id, '피곤하다',         'pigonhada',           'to be tired',                      15),
    (sleeping_id, '편안하다',         'pyeonanheada',        'to be comfortable',                16),
    (sleeping_id, '수면',             'sumyeon',             'sleep',                            17),
    (sleeping_id, '밤',               'bam',                 'night',                            18),
    (sleeping_id, '자리',             'jari',                'bed spot/place to sleep',          19),
    (sleeping_id, '편히 자다',        'pyeonhi jada',        'to sleep peacefully',              20);

    INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
    (sleeping_id, 'Using ~면서 (while doing)', '~면서', 'Expresses simultaneous actions. 자면서 꿈을 꾼다 (Dream while sleeping)', 1),
    (sleeping_id, 'Using ~고 싶다 (want to)', '~고 싶다', 'Expresses desire. 자고 싶다 (want to sleep)', 2);

    INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (sleeping_id, 'A', '요즘 잘 자요?', 'Yojeum jal jayo?', 'Do you sleep well these days?', 1),
    (sleeping_id, 'B', '네, 밤 11시에 잠자리에 들어요.', 'Ne, bam 11sie jamjarite deureul-yo.', 'Yes, I go to bed at 11 PM.', 2),
    (sleeping_id, 'A', '그리고 좋은 꿈을 꿔요?', 'Geurigo joeun kkum-eul kkwayo?', 'And do you have good dreams?', 3),
    (sleeping_id, 'B', '네, 편히 자면 좋은 꿈을 꿔요!', 'Ne, pyeonhi jamyeon joeun kkum-eul kkwayo!', 'Yes, when I sleep peacefully, I have good dreams!', 4);

    INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (sleeping_id, '"잠을 자다"는 무엇입니까?', '["to dream", "to sleep", "to yawn", "to rest"]', 1, '"잠을 자다" means to sleep', 1),
    (sleeping_id, '"베개"는 무엇입니까?', '["blanket", "pillow", "bed", "sheet"]', 1, '"베개" is a pillow', 2),
    (sleeping_id, '자기 전에 무엇을 끕니까?', '["불", "에어컨", "TV", "문"]', 0, '"불을 끄다" means to turn off the light before sleeping', 3),
    (sleeping_id, '편안하게 자려면?', '["시끄럽게", "편안한 환경", "밝게", "높게"]', 1, 'A comfortable environment helps you sleep well', 4);

    INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (sleeping_id, '건강한 수면은 모두에게 중요하다. 매일 밤 같은 시간에 잠자리에 들면 좋은 습관이 생긴다. 침대는 편안해야 하고, 베개와 이불도 중요하다. 자기 전에 불을 끄고 조용한 환경을 만들면 깊이 잘 수 있다. 우리는 꿈을 꾸면서 하루의 피로를 풀고 다시 활기찬 하루를 보낼 수 있다.', 'Healthy sleep is important for everyone. Going to bed at the same time each night develops good habits. The bed should be comfortable, and the pillow and blanket are also important. Turning off the light before sleeping and creating a quiet environment helps you sleep deeply. Through dreams, we can relieve the fatigue of the day and have an energetic next day.', 1);
  END IF;

  -- ============================================================
  -- LESSON 2: WAKING UP (일어나기)
  -- ============================================================
  IF waking_id IS NOT NULL THEN
    INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (waking_id, '일어나다',          'ireonada',            'to wake up',                       1),
    (waking_id, '알람',              'allam',               'alarm',                            2),
    (waking_id, '알람을 끄다',       'alarmeul kkeuda',     'to turn off the alarm',            3),
    (waking_id, '눈을 뜨다',         'nuneul tteuda',       'to open eyes',                     4),
    (waking_id, '기지개를 켜다',     'gijikaereul kyeoda',  'to stretch',                       5),
    (waking_id, '하품하다',          'hapumhada',           'to yawn',                          6),
    (waking_id, '세수하다',          'sesuhada',            'to wash face',                     7),
    (waking_id, '자리에서 일어나다', 'jarieseo ireonada',   'to get out of bed',                8),
    (waking_id, '커튼을 열다',       'keoteoneul yeolda',   'to open the curtains',             9),
    (waking_id, '아침',              'achim',               'morning',                          10),
    (waking_id, '새벽',              'saebyeok',            'dawn',                             11),
    (waking_id, '졸음',              'joreum',              'sleepiness',                       12),
    (waking_id, '정신을 차리다',     'jeongshineul charida','to come to one''s senses',        13),
    (waking_id, '샤워하다',          'syaweohada',          'to take a shower',                 14),
    (waking_id, '아침 준비를 하다',  'achim junbireul hada','to prepare for the morning',       15),
    (waking_id, '일어날 시간이다',   'ireonaol sigan-ida',  'it''s time to wake up',            16),
    (waking_id, '환기하다',          'hwanghada',           'to ventilate/air out',             17),
    (waking_id, '침대에서 나오다',   'chimdaeseo naoda',    'to get out of bed',                18),
    (waking_id, '상큼하다',          'sangkeumhada',        'to be fresh',                      19),
    (waking_id, '활기차다',          'hwalgichada',         'to be energetic',                  20);

    INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
    (waking_id, 'Using ~고 나서 (after doing)', '~고 나서', 'Expresses action after something. 일어나고 나서 샤워한다 (Shower after waking up)', 1),
    (waking_id, 'Using ~어야 하다 (must/have to)', '~어야 하다', 'Expresses obligation. 일어나야 한다 (must wake up)', 2);

    INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (waking_id, 'A', '아침 몇 시에 일어나요?', 'Achim myeot sie ireonayo?', 'What time do you wake up in the morning?', 1),
    (waking_id, 'B', '보통 7시에 알람이 울려요.', 'Botong 7sie allami ullyeoyo.', 'Usually my alarm goes off at 7.', 2),
    (waking_id, 'A', '일어나기 힘들어요?', 'Ireonagi himdeuleoyo?', 'Is it hard to wake up?', 3),
    (waking_id, 'B', '네, 그래서 기지개를 켜고 물로 얼굴을 씻어요.', 'Ne, geuraeseo gijikaereul kyeogo mureul eolgureul sseosseoyo.', 'Yes, so I stretch and wash my face with water.', 4);

    INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (waking_id, '"일어나다"는 무엇입니까?', '["to sleep", "to wake up", "to rest", "to lie down"]', 1, '"일어나다" means to wake up', 1),
    (waking_id, '"알람"은 무엇입니까?', '["time", "clock", "alarm", "bell"]', 2, '"알람" is an alarm', 2),
    (waking_id, '아침에 눈을 뜨면 첫 번째로 무엇을 합니까?', '["밥을 먹다", "알람을 끄다", "세수하다", "옷을 입다"]', 1, 'The first thing is usually to turn off the alarm', 3),
    (waking_id, '상큼한 아침을 보내려면?', '["늦게 일어나기", "커튼을 열고 환기하기", "어두운 곳에 있기", "누워있기"]', 1, 'Open curtains and ventilate for a fresh morning', 4);

    INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (waking_id, '새벽 7시 알람이 울린다. 처음 몇 분은 침대에 누워 있다가 정신을 차린다. 그 후 기지개를 켜며 일어난다. 커튼을 열어 햇빛을 받으면 졸음이 깬다. 찬물로 얼굴을 씻으면 더 활기차진다. 이런 아침 루틴은 하루를 좋게 시작하는 데 도움이 된다.', 'The alarm goes off at 7 AM. For the first few minutes, I lie in bed and come to my senses. Then I stretch and get up. Opening the curtains and getting sunlight dispels sleepiness. Washing your face with cold water makes you more energetic. This morning routine helps start the day well.', 1);
  END IF;

END $$;
