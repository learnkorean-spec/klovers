
-- Vocabulary data for Daily Routine World
-- Lesson 1: Sleeping (잠자기) | Lesson 2: Waking Up (일어나기)

DO $$
DECLARE
  sleeping_id uuid;
  waking_id    uuid;
BEGIN
  SELECT id INTO sleeping_id
    FROM public.textbook_lessons
    WHERE book = 'daily-routine' AND sort_order = 1
    LIMIT 1;

  SELECT id INTO waking_id
    FROM public.textbook_lessons
    WHERE book = 'daily-routine' AND sort_order = 2
    LIMIT 1;

  -- ── Sleeping (잠자기) ────────────────────────────────────────────────────────
  IF sleeping_id IS NOT NULL THEN
    DELETE FROM public.lesson_vocabulary WHERE lesson_id = sleeping_id;

    INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
      (sleeping_id, '잠을 자다',      'jameul jada',         'to sleep',                              1),
      (sleeping_id, '잠자리에 들다',  'jamjarite deulda',    'to go to bed',                          2),
      (sleeping_id, '잠이 들다',      'jami deulda',         'to fall asleep',                        3),
      (sleeping_id, '졸리다',         'jollida',             'to be sleepy / drowsy',                 4),
      (sleeping_id, '하품을 하다',    'hapumeul hada',       'to yawn',                               5),
      (sleeping_id, '눈을 감다',      'nuneul gamda',        'to close one''s eyes',                  6),
      (sleeping_id, '꿈을 꾸다',      'kkumeul kkuda',       'to have a dream',                       7),
      (sleeping_id, '코를 골다',      'koreul golda',        'to snore',                              8),
      (sleeping_id, '뒤척이다',       'dwicheogida',         'to toss and turn',                      9),
      (sleeping_id, '깊이 자다',      'gipi jada',           'to sleep soundly / deeply',             10),
      (sleeping_id, '이불을 덮다',    'ibureul deopda',      'to pull up the covers / blanket',       11),
      (sleeping_id, '불을 끄다',      'bureul kkeuda',       'to turn off the light',                 12);

    -- Grammar: -아/어서 (sequential action)
    DELETE FROM public.lesson_grammar WHERE lesson_id = sleeping_id;
    INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
      (sleeping_id,
       '~아/어서 — Sequential Actions',
       'Verb stem + 아/어서',
       'Use -아/어서 to link two actions happening in sequence: "do A, then do B".',
       '[
         {"korean": "졸려서 일찍 잠자리에 들었어요.", "english": "I was sleepy, so I went to bed early."},
         {"korean": "불을 끄고 이불을 덮었어요.", "english": "I turned off the light and pulled up the covers."}
       ]'::jsonb,
       1),
      (sleeping_id,
       '~고 싶다 — Expressing Desire',
       'Verb stem + 고 싶다',
       'Attach -고 싶다 to a verb stem to say you want to do something.',
       '[
         {"korean": "지금 자고 싶어요.", "english": "I want to sleep right now."},
         {"korean": "꿈을 꾸고 싶어요.", "english": "I want to have a dream."}
       ]'::jsonb,
       2);

    -- Dialogue: Bedtime conversation
    DELETE FROM public.lesson_dialogues WHERE lesson_id = sleeping_id;
    INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
      (sleeping_id, 'A', '오늘 많이 피곤해요?',              'oneul mani pigonhaeyo?',               'Are you very tired today?',                  1),
      (sleeping_id, 'B', '네, 너무 졸려요. 잠자리에 들게요.', 'ne, neomu jolleoyo. jamjarite deulgeyo.', 'Yes, I''m so sleepy. I''m going to go to bed.', 2),
      (sleeping_id, 'A', '불 끄고 잘 자요!',                 'bul kkeugo jal jayo!',                 'Turn off the light and sleep well!',          3),
      (sleeping_id, 'B', '고마워요. 좋은 꿈 꿔요!',           'gomawoyo. joeun kkum kkwoyo!',         'Thank you. Sweet dreams!',                    4);

    -- Exercises
    DELETE FROM public.lesson_exercises WHERE lesson_id = sleeping_id;
    INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
      (sleeping_id,
       'What does 잠이 들다 mean?',
       '["to fall asleep", "to wake up", "to snore", "to yawn"]'::jsonb,
       0, '잠이 들다 = to fall asleep. 잠 (sleep) + 들다 (to enter/fall into).', 1),
      (sleeping_id,
       'How do you say "to turn off the light" in Korean?',
       '["불을 끄다", "이불을 덮다", "눈을 감다", "꿈을 꾸다"]'::jsonb,
       0, '불 = light, 끄다 = to turn off. So 불을 끄다 = to turn off the light.', 2),
      (sleeping_id,
       'Which word means "to snore"?',
       '["하품을 하다", "코를 골다", "뒤척이다", "졸리다"]'::jsonb,
       1, '코를 골다 = to snore. 코 = nose, 골다 = to snore/grind.', 3),
      (sleeping_id,
       'Complete: 오늘 너무 _____ 일찍 잠자리에 들었어요. (I was so sleepy, so I went to bed early.)',
       '["깊이 자서", "졸려서", "꿈을 꿔서", "코를 골아서"]'::jsonb,
       1, '졸리다 → 졸려서 (being sleepy, so…). -아/어서 connects the reason to the result.', 4);

    -- Reading passage
    DELETE FROM public.lesson_reading WHERE lesson_id = sleeping_id;
    INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
      (sleeping_id,
       '저는 매일 밤 11시에 잠자리에 들어요. 잠자리에 들기 전에 불을 끄고 이불을 덮어요. 보통 금방 잠이 들지만, 가끔은 뒤척이기도 해요. 행복할 때는 좋은 꿈을 꿔요. 남편은 가끔 코를 골아서 제가 잠을 못 잘 때도 있어요!',
       'Every night I go to bed at 11 o''clock. Before going to bed, I turn off the light and pull up the covers. Usually I fall asleep quickly, but sometimes I toss and turn. When I am happy, I have good dreams. My husband sometimes snores, so there are times I can''t sleep!',
       1);
  END IF;

  -- ── Waking Up (일어나기) ─────────────────────────────────────────────────────
  IF waking_id IS NOT NULL THEN
    DELETE FROM public.lesson_vocabulary WHERE lesson_id = waking_id;

    INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
      (waking_id, '일어나다',          'ireonada',              'to get up / wake up',                   1),
      (waking_id, '알람이 울리다',     'allami ullida',         'the alarm rings',                       2),
      (waking_id, '알람을 끄다',       'allameul kkeuda',       'to turn off the alarm',                 3),
      (waking_id, '잠을 깨다',         'jameul kkaeda',         'to wake up / come awake',               4),
      (waking_id, '눈이 떠지다',       'nuni tteojida',         'eyes open (one''s eyes snap open)',     5),
      (waking_id, '눈이 부시다',       'nuni busida',           'blinded by the light / eyes hurt',      6),
      (waking_id, '눈을 비비다',       'nuneul bibida',         'to rub one''s eyes',                    7),
      (waking_id, '하품하다',          'hapumhada',             'to yawn',                               8),
      (waking_id, '기지개를 켜다',     'gijigaereul kyeoda',    'to stretch (upon waking)',              9),
      (waking_id, '자리에서 일어나다', 'jarieseo ireonada',     'to get out of bed',                     10),
      (waking_id, '햇빛이 들어오다',   'haetbichi deureooda',   'sunlight comes in',                     11),
      (waking_id, '커튼을 열다',       'keoteoneul yeolda',     'to open the curtains',                  12);

    -- Grammar
    DELETE FROM public.lesson_grammar WHERE lesson_id = waking_id;
    INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
      (waking_id,
       '~자마자 — As soon as',
       'Verb stem + 자마자',
       'Use -자마자 to say "as soon as [action A], [action B] happens". The two events occur in immediate succession.',
       '[
         {"korean": "알람이 울리자마자 일어났어요.", "english": "As soon as the alarm rang, I got up."},
         {"korean": "눈이 떠지자마자 커튼을 열었어요.", "english": "As soon as my eyes opened, I opened the curtains."}
       ]'::jsonb,
       1),
      (waking_id,
       '~기 싫다 — Disliking to do',
       'Verb stem + 기 싫다',
       'Attach -기 싫다 to say you dislike doing something or don''t want to do it.',
       '[
         {"korean": "아침에 일어나기 싫어요.", "english": "I hate getting up in the morning."},
         {"korean": "알람 끄기 싫어요.", "english": "I don''t want to turn off the alarm."}
       ]'::jsonb,
       2);

    -- Dialogue
    DELETE FROM public.lesson_dialogues WHERE lesson_id = waking_id;
    INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
      (waking_id, 'A', '일어나! 알람이 벌써 울렸잖아.',          'ireonat! allami beolsseo ullyeotjana.',           'Wake up! The alarm already rang.',                      1),
      (waking_id, 'B', '조금만 더…눈이 너무 부셔요.',             'jogeumman deo... nuni neomu bushi.',              'Just a little more… my eyes hurt too much.',             2),
      (waking_id, 'A', '기지개도 켜고 빨리 일어나세요!',          'gijigaedo kyeogo ppalli ireunaseyo!',             'Stretch and get up quickly!',                           3),
      (waking_id, 'B', '알겠어요. 커튼 좀 열어 주세요.',          'algessoyo. keoten jom yeoreo juseyo.',            'Okay. Could you open the curtains for me?',              4);

    -- Exercises
    DELETE FROM public.lesson_exercises WHERE lesson_id = waking_id;
    INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
      (waking_id,
       'What does 기지개를 켜다 mean?',
       '["to turn off the light", "to stretch upon waking", "to rub your eyes", "to open the curtains"]'::jsonb,
       1, '기지개를 켜다 = to stretch (the morning stretch after waking up). A very common expression!', 1),
      (waking_id,
       'Which sentence uses ~자마자 correctly?',
       '["일어나자마자 커튼을 열었어요.", "일어나서마자 커튼을 열었어요.", "일어나기마자 커튼을 열었어요.", "일어나면자마자 커튼을 열었어요."]'::jsonb,
       0, '~자마자 attaches directly to the verb stem. 일어나다 → 일어나 + 자마자 = 일어나자마자.', 2),
      (waking_id,
       'How do you say "my eyes are blinded by the light"?',
       '["눈이 떠지다", "눈을 비비다", "눈이 부시다", "눈을 감다"]'::jsonb,
       2, '눈이 부시다 = eyes are dazzled / blinded by the light. Common on bright mornings!', 3),
      (waking_id,
       'Complete: 알람이 _____자마자 바로 껐어요. (As soon as the alarm rang, I immediately turned it off.)',
       '["울리", "끄", "비비", "떠지"]'::jsonb,
       0, '알람이 울리다 → stem: 울리 → 울리자마자. As soon as the alarm rang.', 4);

    -- Reading
    DELETE FROM public.lesson_reading WHERE lesson_id = waking_id;
    INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
      (waking_id,
       '저는 아침에 일어나는 게 정말 힘들어요. 알람이 울리자마자 알람을 끄고 또 자려고 해요. 눈이 너무 부셔서 눈을 비비고 하품을 해요. 기지개를 켜고 나서야 조금 깨어나요. 커튼을 열면 햇빛이 들어와서 기분이 좀 나아져요.',
       'Getting up in the morning is really hard for me. As soon as the alarm rings, I turn it off and try to sleep again. My eyes are too blinded by the light, so I rub them and yawn. Only after stretching do I wake up a little. When I open the curtains, sunlight comes in and I feel a bit better.',
       1);
  END IF;
END $$;
