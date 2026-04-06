-- Daily Routine lessons 1–20: Full content seed


DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 1;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '알람', 'allam', 'alarm', 1),
  (l_id, '기상하다', 'gisanghada', 'to wake up / get up', 2),
  (l_id, '일어나다', 'ireonada', 'to get up / to rise', 3),
  (l_id, '침대', 'chimdae', 'bed', 4),
  (l_id, '이불', 'ibul', 'blanket / duvet', 5),
  (l_id, '베개', 'begae', 'pillow', 6),
  (l_id, '늦잠', 'neutjam', 'sleeping in / oversleeping', 7),
  (l_id, '알람을 끄다', 'alrameul kkeuda', 'to turn off the alarm', 8),
  (l_id, '스트레칭', 'seuteurecheong', 'stretching', 9),
  (l_id, '기지개', 'gijigae', 'stretching one''s arms upon waking', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '에 일어나다 — waking up at a time', '[시간] + 에 + 일어나다', '에 marks a point in time. Use it with 일어나다 to say what time you wake up.', '[{"korean": "일곱 시에 일어나요.", "english": "I wake up at 7 o''clock."}, {"korean": "오늘 여섯 시에 일어났어요.", "english": "Today I woke up at 6 o''clock."}, {"korean": "몇 시에 일어나요?", "english": "What time do you wake up?"}]', 1),
  (l_id, '아직 — still / not yet', '아직 + 안 + [동사] / 아직 + [동사]', '아직 expresses that a state or action has not happened yet or is still ongoing.', '[{"korean": "아직 안 일어났어요.", "english": "I have not gotten up yet."}, {"korean": "아직 침대에 있어요.", "english": "I am still in bed."}, {"korean": "알람이 아직 안 울렸어요.", "english": "The alarm has not rung yet."}]', 2),
  (l_id, '~고 싶다 — wanting to do something', '[동사 어간] + 고 싶다', '고 싶다 expresses a desire to do something. It follows the verb stem.', '[{"korean": "늦잠을 자고 싶어요.", "english": "I want to sleep in."}, {"korean": "빨리 일어나고 싶어요.", "english": "I want to get up quickly."}, {"korean": "스트레칭을 하고 싶어요.", "english": "I want to do some stretching."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '민호 씨, 몇 시에 일어나요?', 'Minho ssi, myeot sie ireonayo?', 'Minho, what time do you wake up?', 1),
  (l_id, '민호', '보통 일곱 시에 일어나요. 수진 씨는요?', 'Botong ilgop sie ireonayo. Sujin ssineunyo?', 'I usually wake up at 7. What about you, Sujin?', 2),
  (l_id, '수진', '저는 여섯 시에 알람이 울려요.', 'Jeoneun yeoseot sie allami ullyeoyo.', 'My alarm rings at 6 for me.', 3),
  (l_id, '민호', '일찍 일어나네요! 저는 알람을 끄고 다시 자요.', 'Iljjik ireonanéyo! Jeoneun alrameul kkeugo dasi jayo.', 'You wake up early! I turn off the alarm and go back to sleep.', 4),
  (l_id, '수진', '늦잠 자면 안 돼요. 바로 일어나야 해요.', 'Neutjam jamyeon an dwaeyo. Baro ireonaya haeyo.', 'You should not sleep in. You have to get up right away.', 5),
  (l_id, '민호', '맞아요. 기지개를 켜고 스트레칭하면 도움이 돼요.', 'Majeyo. Gijigaereul kyeogo seuteurecheonghamyeon doumeul dwaeyo.', 'You are right. Stretching after waking up helps a lot.', 6),
  (l_id, '수진', '저도 매일 아침에 스트레칭해요. 기분이 좋아져요.', 'Jeodo maeil achime seuteurecheong-haeyo. Gibuni joa-jyeoyo.', 'I also stretch every morning. It lifts my mood.', 7),
  (l_id, '민호', '오늘부터 저도 일찍 일어날게요!', 'Oneulbuteo jeodo iljjik ireonargeyo!', 'Starting today I will wake up early too!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''늦잠'' means:', '["early riser", "alarm clock", "sleeping in", "pillow"]', 2, '늦잠 means oversleeping or sleeping in.', 1),
  (l_id, 'How do you say ''I wake up at 7 o''clock''?', '["일곱 시가 일어나요", "일곱 시에 일어나요", "일곱 시를 일어나요", "일곱 시로 일어나요"]', 1, 'The time particle 에 is used: 일곱 시에 일어나요.', 2),
  (l_id, 'Which word means ''blanket''?', '["침대", "베개", "이불", "알람"]', 2, '이불 means blanket or duvet.', 3),
  (l_id, '''알람을 끄다'' means:', '["to set an alarm", "to hear an alarm", "to turn off the alarm", "to buy an alarm"]', 2, '끄다 means to turn off, so 알람을 끄다 = to turn off the alarm.', 4),
  (l_id, 'How do you express ''I want to sleep in''?', '["늦잠을 잤어요", "늦잠을 자고 싶어요", "늦잠이에요", "늦잠을 자지 마세요"]', 1, '고 싶어요 expresses desire: 늦잠을 자고 싶어요.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침 일곱 시에 알람이 울린다. 처음에는 알람을 끄고 다시 자고 싶다. 하지만 늦잠을 자면 지각을 한다. 그래서 알람이 울리면 바로 침대에서 일어난다. 이불을 개고 기지개를 켠 다음에 스트레칭을 한다. 스트레칭을 하면 잠이 깨고 몸이 가벼워진다. 아침을 잘 시작하면 하루가 즐겁다.', 'Every morning my alarm rings at 7 o''clock. At first I want to turn off the alarm and go back to sleep. But if I sleep in I will be late. So when the alarm rings I get out of bed right away. I fold the blanket, stretch my arms, and then do some stretching exercises. Stretching wakes me up and makes my body feel light. Starting the morning well makes the whole day enjoyable.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 2;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '양치질', 'yangchijil', 'tooth brushing', 1),
  (l_id, '세수', 'sesu', 'washing one''s face', 2),
  (l_id, '샤워', 'syawo', 'shower', 3),
  (l_id, '칫솔', 'chitsol', 'toothbrush', 4),
  (l_id, '치약', 'chiyak', 'toothpaste', 5),
  (l_id, '수건', 'sugeon', 'towel', 6),
  (l_id, '비누', 'binu', 'soap', 7),
  (l_id, '거울', 'geoul', 'mirror', 8),
  (l_id, '면도하다', 'myeondohada', 'to shave', 9),
  (l_id, '머리를 감다', 'meorireul gamda', 'to wash one''s hair', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~을/를 하다 — doing an action', '[명사] + 을/를 + 하다', '하다 combined with a noun forms a verb. 을/를 marks the object of the action.', '[{"korean": "양치질을 해요.", "english": "I brush my teeth."}, {"korean": "세수를 해요.", "english": "I wash my face."}, {"korean": "샤워를 해요.", "english": "I take a shower."}]', 1),
  (l_id, '~기 전에 — before doing something', '[동사 어간] + 기 전에', '기 전에 means before doing the action. It links two actions in sequence.', '[{"korean": "밥 먹기 전에 세수해요.", "english": "I wash my face before eating."}, {"korean": "자기 전에 양치질해요.", "english": "I brush my teeth before sleeping."}, {"korean": "나가기 전에 샤워해요.", "english": "I shower before going out."}]', 2),
  (l_id, '얼마나 걸려요? — how long does it take?', '얼마나 걸려요? / [시간] + 걸려요', '걸리다 expresses the time it takes to do something.', '[{"korean": "샤워가 십 분 걸려요.", "english": "A shower takes ten minutes."}, {"korean": "양치질은 오 분 걸려요.", "english": "Brushing teeth takes five minutes."}, {"korean": "머리를 감으면 이십 분 걸려요.", "english": "Washing my hair takes twenty minutes."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '아침에 세수하고 샤워해요?', 'Achime sesugo syawohaeyo?', 'Do you wash your face and shower in the morning?', 1),
  (l_id, '민호', '네, 저는 매일 아침에 샤워를 해요.', 'Ne, jeoneun maeil achime syaworeul haeyo.', 'Yes, I shower every morning.', 2),
  (l_id, '수진', '샤워 후에 양치질을 해요?', 'Syawo hue yangchijireul haeyo?', 'Do you brush your teeth after showering?', 3),
  (l_id, '민호', '아니요, 저는 양치질을 먼저 해요. 그리고 세수를 해요.', 'Aniyo, jeoneun yangchijireul meonjeo haeyo. Geurigo sesureul haeyo.', 'No, I brush my teeth first. Then I wash my face.', 4),
  (l_id, '수진', '수건이랑 비누는 욕실에 있어요?', 'Sugeonilang binuneun yokssire isseoyo?', 'Is the towel and soap in the bathroom?', 5),
  (l_id, '민호', '네, 거울 옆에 있어요.', 'Ne, geoul yeope isseoyo.', 'Yes, they are next to the mirror.', 6),
  (l_id, '수진', '아침 준비가 얼마나 걸려요?', 'Achim junbiga eolmana geollyeoyo?', 'How long does getting ready in the morning take?', 7),
  (l_id, '민호', '보통 삼십 분쯤 걸려요.', 'Botong samsip bunjjeum geollyeoyo.', 'It usually takes about 30 minutes.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''세수'' means:', '["shower", "washing one''s face", "brushing teeth", "shaving"]', 1, '세수 means washing one''s face.', 1),
  (l_id, 'How do you say ''I brush my teeth before sleeping''?', '["자기 전에 양치질해요", "자고 나서 양치질해요", "자는 동안 양치질해요", "자면서 양치질해요"]', 0, '기 전에 means before doing: 자기 전에 양치질해요.', 2),
  (l_id, 'Which word means ''toothpaste''?', '["칫솔", "비누", "치약", "수건"]', 2, '치약 means toothpaste. 칫솔 is toothbrush.', 3),
  (l_id, 'How do you ask ''how long does it take''?', '["얼마예요?", "어디예요?", "얼마나 걸려요?", "몇 시에요?"]', 2, '얼마나 걸려요? asks how long something takes.', 4),
  (l_id, '''면도하다'' means:', '["to wash hair", "to shave", "to take a bath", "to dry off"]', 1, '면도하다 means to shave.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침 욕실에서 세수를 하고 양치질을 한다. 칫솔에 치약을 묻혀서 이를 닦는다. 그리고 비누로 얼굴을 씻는다. 거울을 보면서 세수를 하면 기분이 상쾌하다. 주말에는 시간이 있으면 머리를 감고 샤워도 한다. 수건으로 얼굴을 닦고 나면 아침 준비가 끝난다. 깨끗하게 씻으면 하루를 잘 시작할 수 있다.', 'Every morning I wash my face and brush my teeth in the bathroom. I put toothpaste on my toothbrush and clean my teeth. Then I wash my face with soap. Looking in the mirror while washing my face feels refreshing. On weekends when I have time I also wash my hair and take a shower. After drying my face with a towel, the morning routine is done. Washing up thoroughly helps me start the day well.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 3;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '옷', 'ot', 'clothes', 1),
  (l_id, '입다', 'ipda', 'to wear / to put on (clothes)', 2),
  (l_id, '셔츠', 'syeochu', 'shirt', 3),
  (l_id, '바지', 'baji', 'trousers / pants', 4),
  (l_id, '치마', 'chima', 'skirt', 5),
  (l_id, '양말', 'yangmal', 'socks', 6),
  (l_id, '신발', 'sinbal', 'shoes', 7),
  (l_id, '코트', 'koteu', 'coat', 8),
  (l_id, '골라 입다', 'golla ipda', 'to pick out and wear clothes', 9),
  (l_id, '옷장', 'otjang', 'wardrobe / closet', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '을/를 입다 — wearing clothes', '[옷 명사] + 을/를 + 입다', '입다 means to wear or put on clothing items. Use object particle 을/를 before it.', '[{"korean": "셔츠를 입어요.", "english": "I put on a shirt."}, {"korean": "바지를 입었어요.", "english": "I put on trousers."}, {"korean": "코트를 입어요.", "english": "I wear a coat."}]', 1),
  (l_id, '어떤 — what kind of / which', '어떤 + [명사]', '어떤 asks what type or which thing. Common when asking about clothing choices.', '[{"korean": "어떤 옷을 입을 거예요?", "english": "What kind of clothes will you wear?"}, {"korean": "어떤 셔츠가 좋아요?", "english": "Which shirt is good?"}, {"korean": "어떤 신발을 살 거예요?", "english": "Which shoes will you buy?"}]', 2),
  (l_id, '~(으)ㄹ 거예요 — future intention', '[동사 어간] + (으)ㄹ 거예요', 'Used to express a plan or intention to do something in the future.', '[{"korean": "오늘 치마를 입을 거예요.", "english": "I am going to wear a skirt today."}, {"korean": "새 신발을 신을 거예요.", "english": "I am going to wear new shoes."}, {"korean": "옷장에서 골라 입을 거예요.", "english": "I am going to pick something from the wardrobe."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 뭐 입을 거예요?', 'Oneul mwo ibeul geoyeyo?', 'What are you going to wear today?', 1),
  (l_id, '민호', '흰 셔츠랑 검은 바지를 입을 거예요.', 'Huin syeochurang geomeun bajireul ibeul geoyeyo.', 'I am going to wear a white shirt and black trousers.', 2),
  (l_id, '수진', '날씨가 추우니까 코트도 입으세요.', 'Nalssiga chuunikka koteuedo ibeuseeyo.', 'It is cold so put on a coat too.', 3),
  (l_id, '민호', '맞아요. 옷장에서 코트를 꺼낼게요.', 'Majeyo. Otjangeseo koteu reul kkeolnaeolgeyo.', 'You are right. I will take a coat out of the wardrobe.', 4),
  (l_id, '수진', '양말은 챙겼어요?', 'Yangmareun chaenggyeosseoyo?', 'Did you remember your socks?', 5),
  (l_id, '민호', '아, 깜빡했어요! 양말도 신어야 해요.', 'A, kkamppakhaesseoyo! Yangmaldo sineonya haeyo.', 'Oh, I forgot! I need to put on socks too.', 6),
  (l_id, '수진', '어떤 신발을 신을 거예요?', 'Eotteon sinbareul sineul geoyeyo?', 'Which shoes are you going to wear?', 7),
  (l_id, '민호', '운동화를 신을 거예요. 편하니까요.', 'Undonghwareul sineul geoyeyo. Pyeonhaniikkayo.', 'I am going to wear sneakers. They are comfortable.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''옷장'' means:', '["clothes", "skirt", "wardrobe", "socks"]', 2, '옷장 means wardrobe or closet.', 1),
  (l_id, 'How do you say ''I put on a shirt''?', '["셔츠가 입어요", "셔츠를 입어요", "셔츠에 입어요", "셔츠도 입어요"]', 1, 'Object particle 를 is used: 셔츠를 입어요.', 2),
  (l_id, 'Which word means ''skirt''?', '["바지", "치마", "코트", "양말"]', 1, '치마 means skirt.', 3),
  (l_id, '어떤 means:', '["how many", "where", "what kind of", "when"]', 2, '어떤 means what kind of or which.', 4),
  (l_id, 'How do you say ''I am going to wear a coat''?', '["코트를 입었어요", "코트를 입어요", "코트를 입을 거예요", "코트를 입고 싶어요"]', 2, '(으)ㄹ 거예요 expresses future intention.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 아침에 일어나면 옷장을 열고 오늘 입을 옷을 고른다. 날씨가 따뜻하면 셔츠와 바지를 입는다. 날씨가 추우면 코트도 입는다. 양말과 신발을 신고 나면 거의 준비가 끝난다. 어떤 날은 어떤 옷을 입을지 고르는 데 시간이 걸린다. 예쁜 옷을 입으면 기분이 좋아진다. 나는 편한 옷을 가장 좋아한다.', 'When I wake up in the morning I open the wardrobe and choose what to wear today. When the weather is warm I put on a shirt and trousers. When it is cold I also wear a coat. After putting on socks and shoes I am almost ready. Some days it takes time to decide what to wear. Wearing nice clothes makes me feel good. I like comfortable clothes the most.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 4;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '아침 식사', 'achim siksa', 'breakfast', 1),
  (l_id, '먹다', 'meokda', 'to eat', 2),
  (l_id, '밥', 'bap', 'cooked rice / meal', 3),
  (l_id, '빵', 'ppang', 'bread', 4),
  (l_id, '계란', 'gyeran', 'egg', 5),
  (l_id, '우유', 'uyu', 'milk', 6),
  (l_id, '주스', 'juseu', 'juice', 7),
  (l_id, '커피', 'keopi', 'coffee', 8),
  (l_id, '요거트', 'yogeuteu', 'yogurt', 9),
  (l_id, '식탁', 'siktak', 'dining table', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '을/를 먹다 — eating food', '[음식 명사] + 을/를 + 먹다', '먹다 means to eat. Use object particles 을/를 depending on whether the noun ends in a consonant or vowel.', '[{"korean": "밥을 먹어요.", "english": "I eat rice."}, {"korean": "빵을 먹었어요.", "english": "I ate bread."}, {"korean": "계란을 먹을 거예요.", "english": "I am going to eat an egg."}]', 1),
  (l_id, '~고 — connecting actions in sequence', '[동사 어간] + 고', '고 connects two verbs showing that one action follows another. Similar to ''and then''.', '[{"korean": "우유를 마시고 빵을 먹어요.", "english": "I drink milk and then eat bread."}, {"korean": "커피를 마시고 출발해요.", "english": "I drink coffee and then leave."}, {"korean": "계란을 먹고 학교에 가요.", "english": "I eat an egg and then go to school."}]', 2),
  (l_id, '보통 — usually / generally', '보통 + [동사/형용사]', '보통 is an adverb meaning usually or generally. It describes habitual actions.', '[{"korean": "보통 아침에 밥을 먹어요.", "english": "I usually eat rice in the morning."}, {"korean": "보통 커피를 마셔요.", "english": "I usually drink coffee."}, {"korean": "보통 식탁에서 아침을 먹어요.", "english": "I usually eat breakfast at the dining table."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '아침 식사 했어요?', 'Achim siksa haesseoyo?', 'Did you have breakfast?', 1),
  (l_id, '민호', '네, 밥이랑 계란을 먹었어요.', 'Ne, babilang gyeraneul meogeosseoyo.', 'Yes, I ate rice and an egg.', 2),
  (l_id, '수진', '저는 보통 빵이랑 커피를 먹어요.', 'Jeoneun botong ppangilang keopi reul meogeoyo.', 'I usually eat bread and coffee.', 3),
  (l_id, '민호', '커피 대신 우유는 어때요?', 'Keopi daesin uyuneun eottaeyo?', 'How about milk instead of coffee?', 4),
  (l_id, '수진', '저는 아침에 커피가 꼭 필요해요.', 'Jeoneun achime keopiga kkok piryohaeyo.', 'I absolutely need coffee in the morning.', 5),
  (l_id, '민호', '저도 가끔 요거트를 먹어요. 건강에 좋거든요.', 'Jeodo gakkeum yogeuteureul meogeoyo. Geongange jokgeodeunyo.', 'I sometimes eat yogurt too. It is good for your health.', 6),
  (l_id, '수진', '맞아요. 식탁에서 가족이랑 같이 먹으면 더 맛있어요.', 'Majeyo. Siktabeseo gajogillang gachi meogeunyeon deo massisseoyo.', 'That is right. Eating together with family at the dining table is tastier.', 7),
  (l_id, '민호', '저도 주말에는 온 가족이 함께 아침을 먹어요.', 'Jeodo jumare on gajogeun hamkke achimeul meogeoyo.', 'On weekends my whole family eats breakfast together too.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''아침 식사'' means:', '["lunch", "dinner", "snack", "breakfast"]', 3, '아침 식사 means breakfast.', 1),
  (l_id, 'How do you say ''I eat rice''?', '["밥이 먹어요", "밥을 먹어요", "밥에 먹어요", "밥은 먹어요"]', 1, 'Object particle 을 follows 밥: 밥을 먹어요.', 2),
  (l_id, 'Which word means ''egg''?', '["우유", "빵", "계란", "주스"]', 2, '계란 means egg.', 3),
  (l_id, 'How does ~고 function?', '["it expresses desire", "it connects sequential actions", "it marks time", "it shows contrast"]', 1, '~고 connects two actions in sequence, meaning and then.', 4),
  (l_id, '보통 means:', '["always", "never", "usually", "sometimes"]', 2, '보통 means usually or generally.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침을 먹는다. 아침 식사는 건강에 매우 중요하다. 보통 식탁에 앉아서 밥과 계란을 먹는다. 가끔은 바쁠 때 빵이랑 우유나 주스로 간단하게 먹는다. 커피도 한 잔 마시면 머리가 맑아진다. 아침을 먹지 않으면 오전에 집중하기가 어렵다. 아침 식사를 잘 챙겨 먹으면 하루 종일 에너지가 넘친다.', 'I eat breakfast every day. Breakfast is very important for health. I usually sit at the dining table and eat rice and an egg. Sometimes when I am busy I eat simply with bread and milk or juice. Drinking a cup of coffee also clears my head. If I skip breakfast it is hard to concentrate in the morning. Eating a proper breakfast gives you energy throughout the whole day.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 5;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '지하철', 'jihacheol', 'subway / metro', 1),
  (l_id, '버스', 'beoseu', 'bus', 2),
  (l_id, '출근', 'chulgeun', 'commuting to work', 3),
  (l_id, '교통 카드', 'gyotong kadeu', 'transit card', 4),
  (l_id, '정류장', 'jeongnyujang', 'bus stop', 5),
  (l_id, '환승', 'hwanseung', 'transfer (transit)', 6),
  (l_id, '택시', 'taeksi', 'taxi', 7),
  (l_id, '자전거', 'jajeonggeo', 'bicycle', 8),
  (l_id, '걷다', 'geodda', 'to walk', 9),
  (l_id, '막히다', 'makhida', 'to be congested / to be blocked (traffic)', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '(으)로 가다 — going by means of transport', '[교통수단] + (으)로 + 가다', '(으)로 marks the means of transportation. Use 로 after vowels and 으로 after consonants.', '[{"korean": "지하철로 가요.", "english": "I go by subway."}, {"korean": "버스로 출근해요.", "english": "I commute by bus."}, {"korean": "택시로 왔어요.", "english": "I came by taxi."}]', 1),
  (l_id, '얼마나 걸려요? — asking travel time', '[장소] + 까지 + 얼마나 걸려요?', '까지 means until/to and 걸려요 asks how long it takes to reach a destination.', '[{"korean": "여기서 역까지 얼마나 걸려요?", "english": "How long does it take from here to the station?"}, {"korean": "회사까지 삼십 분 걸려요.", "english": "It takes thirty minutes to the office."}, {"korean": "학교까지 걸어서 십 분 걸려요.", "english": "It takes ten minutes to school on foot."}]', 2),
  (l_id, '~아/어서 — reason / because', '[동사/형용사 어간] + 아/어서', '아/어서 expresses a reason or cause that leads to a result.', '[{"korean": "길이 막혀서 늦었어요.", "english": "I was late because of traffic."}, {"korean": "버스가 늦어서 택시를 탔어요.", "english": "The bus was late so I took a taxi."}, {"korean": "지하철이 빠르어서 자주 타요.", "english": "The subway is fast so I often take it."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '학교까지 어떻게 가요?', 'Hakgyokkaji eotteoke gayo?', 'How do you get to school?', 1),
  (l_id, '민호', '지하철로 가요. 빠르고 편해요.', 'Jihacheollo gayo. Ppareuko pyeonhaeyo.', 'I go by subway. It is fast and convenient.', 2),
  (l_id, '수진', '얼마나 걸려요?', 'Eolmana geollyeoyo?', 'How long does it take?', 3),
  (l_id, '민호', '한 번 환승해서 삼십 분쯤 걸려요.', 'Han beon hwanseunghaeseo samsip bunjjeum geollyeoyo.', 'I transfer once and it takes about 30 minutes.', 4),
  (l_id, '수진', '저는 버스를 타요. 정류장이 집 앞에 있어요.', 'Jeoneun beoseureul tayo. Jeongnyujangi jip ape isseoyo.', 'I take the bus. The bus stop is right in front of my house.', 5),
  (l_id, '민호', '오늘은 길이 막혀서 버스가 늦을 수도 있어요.', 'Oneureun giri makhyeoseo beoseuga neujeul sudo isseoyo.', 'Today traffic might be congested so the bus might be late.', 6),
  (l_id, '수진', '그러면 지하철을 타야겠네요.', 'Geureomyeon jihacheoreul tayakketneyo.', 'Then I guess I should take the subway.', 7),
  (l_id, '민호', '교통 카드 충전했어요?', 'Gyotong kadeu chungjeonhaesseoyo?', 'Did you top up your transit card?', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''환승'' means:', '["bus stop", "subway", "transfer", "traffic jam"]', 2, '환승 means transfer when using public transport.', 1),
  (l_id, 'How do you say ''I go by bus''?', '["버스가 가요", "버스를 가요", "버스로 가요", "버스에 가요"]', 2, '(으)로 marks the means of transport: 버스로 가요.', 2),
  (l_id, 'Which word means ''to be congested (traffic)''?', '["걷다", "막히다", "출근하다", "환승하다"]', 1, '막히다 means to be blocked or congested.', 3),
  (l_id, 'How do you ask the travel time to school?', '["학교가 얼마나 있어요?", "학교까지 얼마나 걸려요?", "학교에 얼마나 가요?", "학교를 어떻게 걸려요?"]', 1, '까지 means to/until and 걸려요 asks duration: 학교까지 얼마나 걸려요?', 4),
  (l_id, '''길이 막혀서 늦었어요'' means:', '["I was early because of traffic", "I was late because of traffic", "Traffic was fast", "I missed the bus"]', 1, '막혀서 = because it was congested; 늦었어요 = was late.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 지하철로 출근한다. 집에서 역까지 걸어서 오 분 정도 걸린다. 지하철은 빠르고 편리하다. 하지만 출근 시간에는 사람이 많아서 복잡하다. 가끔 버스로 가기도 하는데, 길이 막히면 시간이 많이 걸린다. 택시는 편하지만 비싸서 자주 타지 않는다. 날씨가 좋은 날에는 자전거로 출근하기도 한다. 건강에도 좋고 기분도 좋아진다.', 'Every day I commute to work by subway. It takes about five minutes to walk from home to the station. The subway is fast and convenient. However, during rush hour it is crowded with many people. Sometimes I also go by bus, but when there is traffic it takes a lot of time. Taxis are comfortable but expensive so I do not take them often. On nice weather days I sometimes commute by bicycle. It is good for my health and improves my mood.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 6;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '도착하다', 'dochakhada', 'to arrive', 1),
  (l_id, '출석', 'chulseok', 'attendance', 2),
  (l_id, '직장', 'jikjang', 'workplace', 3),
  (l_id, '학교', 'hakgyo', 'school', 4),
  (l_id, '동료', 'dongnyo', 'colleague', 5),
  (l_id, '인사하다', 'insahada', 'to greet', 6),
  (l_id, '책상', 'chaeksang', 'desk', 7),
  (l_id, '컴퓨터', 'keompyuteo', 'computer', 8),
  (l_id, '회의', 'hoeui', 'meeting', 9),
  (l_id, '수업', 'sueop', 'class / lesson', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '에 도착하다 — arriving at a place', '[장소] + 에 + 도착하다', '에 marks the destination where you arrive. 도착하다 means to arrive.', '[{"korean": "학교에 도착했어요.", "english": "I arrived at school."}, {"korean": "직장에 일찍 도착했어요.", "english": "I arrived at work early."}, {"korean": "몇 시에 도착했어요?", "english": "What time did you arrive?"}]', 1),
  (l_id, '~에게/한테 인사하다 — greeting someone', '[사람] + 에게/한테 + 인사하다', '에게 or 한테 marks the person you greet. 한테 is more colloquial.', '[{"korean": "동료에게 인사했어요.", "english": "I greeted my colleague."}, {"korean": "선생님께 인사했어요.", "english": "I greeted the teacher."}, {"korean": "친구한테 인사했어요.", "english": "I greeted my friend."}]', 2),
  (l_id, '~(으)ㄴ 다음에 — after doing something', '[동사 어간] + (으)ㄴ 다음에', '(으)ㄴ 다음에 expresses what happens after a completed action.', '[{"korean": "도착한 다음에 인사했어요.", "english": "After arriving I greeted everyone."}, {"korean": "수업이 끝난 다음에 집에 가요.", "english": "After class ends I go home."}, {"korean": "회의가 끝난 다음에 점심을 먹었어요.", "english": "After the meeting ended I had lunch."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 학교에 일찍 도착했어요?', 'Oneul hakgyoe iljjik dochakhaesseoyo?', 'Did you arrive at school early today?', 1),
  (l_id, '민호', '네, 수업 시작 십 분 전에 도착했어요.', 'Ne, sueop sijak sip bun jeone dochakhaesseoyo.', 'Yes, I arrived ten minutes before class started.', 2),
  (l_id, '수진', '도착하고 나서 선생님께 인사했어요?', 'Dochakhago naseo seonsaengnimkke insahaesseoyo?', 'After arriving did you greet the teacher?', 3),
  (l_id, '민호', '네, 인사하고 책상에 앉았어요.', 'Ne, insahago chaeksange anjasseoyo.', 'Yes, I greeted them and then sat at my desk.', 4),
  (l_id, '수진', '오늘 수업이 몇 시에 시작해요?', 'Oneul sueobi myeot sie sijakaeyo?', 'What time does class start today?', 5),
  (l_id, '민호', '아홉 시에 시작해요. 출석을 부르고 바로 시작해요.', 'Ahop sie sjakaeyo. Chulseoeul bureugo baro sijakaeyo.', 'It starts at 9. Roll call is taken and then it starts right away.', 6),
  (l_id, '수진', '저는 직장에 도착하면 먼저 컴퓨터를 켜요.', 'Jeoneun jikjange dochakhamyeon meonjeo keompyuteoreul kyeoyo.', 'When I arrive at work I first turn on my computer.', 7),
  (l_id, '민호', '저도요. 그리고 동료들과 인사해요.', 'Jeodoyo. Geurigo dongnyodeulgwa insahaeyo.', 'Me too. And then I greet my colleagues.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''동료'' means:', '["student", "teacher", "colleague", "boss"]', 2, '동료 means colleague or coworker.', 1),
  (l_id, 'How do you say ''I arrived at school''?', '["학교를 도착했어요", "학교가 도착했어요", "학교에 도착했어요", "학교로 도착했어요"]', 2, 'Place particle 에 marks the destination: 학교에 도착했어요.', 2),
  (l_id, 'Which word means ''meeting''?', '["수업", "출석", "회의", "직장"]', 2, '회의 means meeting.', 3),
  (l_id, 'What does (으)ㄴ 다음에 express?', '["before doing", "while doing", "after doing", "in order to do"]', 2, '(으)ㄴ 다음에 means after doing something.', 4),
  (l_id, '''인사하다'' means:', '["to study", "to work", "to greet", "to sit"]', 2, '인사하다 means to greet someone.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침 직장에 도착하면 동료들에게 인사를 한다. 인사는 하루를 좋게 시작하는 방법이다. 책상에 앉아서 컴퓨터를 켜고 오늘 할 일을 확인한다. 오전에는 주로 회의가 있어서 동료들과 함께 일을 계획한다. 점심 전에 중요한 일을 먼저 끝내려고 노력한다. 직장 생활은 때로 힘들지만 동료들이 있어서 즐겁다.', 'Every morning when I arrive at work I greet my colleagues. Greeting people is a way to start the day well. I sit at my desk, turn on the computer, and check what I need to do today. In the morning there are usually meetings and I plan work together with colleagues. I try to finish important tasks before lunch. Work life is sometimes hard but it is enjoyable because of my colleagues.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 7;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '일과', 'ilgwa', 'daily routine / schedule', 1),
  (l_id, '오전', 'ojeon', 'morning / a.m.', 2),
  (l_id, '준비하다', 'junbihada', 'to prepare / to get ready', 3),
  (l_id, '서두르다', 'seoduruda', 'to hurry / to rush', 4),
  (l_id, '출발하다', 'chulbalhada', 'to depart / to set off', 5),
  (l_id, '계획', 'gyehoek', 'plan', 6),
  (l_id, '습관', 'seupgwan', 'habit', 7),
  (l_id, '매일', 'maeil', 'every day', 8),
  (l_id, '아침', 'achim', 'morning', 9),
  (l_id, '루틴', 'rutin', 'routine', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~고 나서 — after doing', '[동사 어간] + 고 나서', '고 나서 means after doing and emphasises the completion of the first action before the second begins.', '[{"korean": "씻고 나서 옷을 입어요.", "english": "After washing I put on clothes."}, {"korean": "먹고 나서 출발해요.", "english": "After eating I depart."}, {"korean": "준비하고 나서 집을 나와요.", "english": "After getting ready I leave the house."}]', 1),
  (l_id, '~야/이야 하다 — must / have to', '[동사 어간] + 아/어야 하다', '아/어야 하다 expresses obligation or necessity. Means must or have to.', '[{"korean": "일찍 출발해야 해요.", "english": "I have to depart early."}, {"korean": "아침을 먹어야 해요.", "english": "I must eat breakfast."}, {"korean": "서두르지 않아야 해요.", "english": "I must not rush."}]', 2),
  (l_id, '매일 — every day (habitual action)', '매일 + [동사]', '매일 combined with the present tense expresses a daily habit.', '[{"korean": "매일 같은 루틴을 따라요.", "english": "I follow the same routine every day."}, {"korean": "매일 아침을 먹어요.", "english": "I eat breakfast every day."}, {"korean": "매일 일찍 출발해요.", "english": "I depart early every day."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '아침 루틴이 어때요?', 'Achim rutini eottaeyo?', 'What is your morning routine like?', 1),
  (l_id, '민호', '저는 매일 같은 일과를 따라요. 일어나고 세수하고 밥 먹고 출발해요.', 'Jeoneun maeil gateun ilgwareul ttarayo. Ireonago sesuhago bap meokgo chulbalaeyo.', 'I follow the same routine every day. I wake up, wash my face, eat, and leave.', 2),
  (l_id, '수진', '서두르지 않아요?', 'Seodureuji anayo?', 'Do you not rush?', 3),
  (l_id, '민호', '보통은 안 서둘러요. 미리 준비하니까요.', 'Botoneun an seodulleoyo. Miri junbihaniikkayo.', 'Usually I do not rush. Because I prepare in advance.', 4),
  (l_id, '수진', '저는 항상 서둘러요. 습관을 바꿔야 할 것 같아요.', 'Jeoneun hangsang seodulleoyo. Seupgwaneul bakkwoya hal geot gatayo.', 'I always rush. I think I need to change my habits.', 5),
  (l_id, '민호', '전날 밤에 미리 준비해 두면 아침이 편해요.', 'Jeonnal bame miri junbihae dumyeon achimi pyeonhaeyo.', 'If you prepare the night before the morning is easier.', 6),
  (l_id, '수진', '맞아요. 계획을 잘 세우는 게 중요해요.', 'Majeyo. Gyehoegeul jal seouneun ge jungyohaeyo.', 'That is right. It is important to plan well.', 7),
  (l_id, '민호', '좋은 루틴이 좋은 하루를 만들어요.', 'Joeun rutini joeun harureul mandeuleoyo.', 'A good routine makes for a good day.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''습관'' means:', '["routine", "habit", "schedule", "plan"]', 1, '습관 means habit.', 1),
  (l_id, 'How do you say ''I have to depart early''?', '["일찍 출발하고 싶어요", "일찍 출발했어요", "일찍 출발해야 해요", "일찍 출발할 거예요"]', 2, '아/어야 하다 expresses must/have to: 일찍 출발해야 해요.', 2),
  (l_id, 'Which word means ''to hurry''?', '["준비하다", "출발하다", "서두르다", "계획하다"]', 2, '서두르다 means to hurry or rush.', 3),
  (l_id, 'What does 고 나서 express?', '["before doing", "while doing", "after doing", "want to do"]', 2, '고 나서 means after doing something (sequential completion).', 4),
  (l_id, '오전 means:', '["evening", "afternoon", "morning / a.m.", "midnight"]', 2, '오전 means morning or a.m.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침 같은 루틴을 따른다. 알람이 울리면 일어나서 스트레칭을 하고 세수를 한다. 그리고 나서 아침을 먹고 옷을 입는다. 준비가 끝나면 집에서 출발한다. 이 루틴은 나에게 중요한 습관이 되었다. 잘 준비하면 하루가 더 잘 풀린다. 아침 일과를 잘 지키면 오전 내내 기분이 좋다.', 'Every morning I follow the same routine. When the alarm rings I get up, do some stretching, and wash my face. After that I eat breakfast and get dressed. When I am ready I leave the house. This routine has become an important habit for me. When you prepare well the day goes more smoothly. If you keep up your morning routine you feel good all morning.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 8;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '커피', 'keopi', 'coffee', 1),
  (l_id, '차', 'cha', 'tea', 2),
  (l_id, '아메리카노', 'amerikano', 'Americano (black coffee)', 3),
  (l_id, '라떼', 'latte', 'latte', 4),
  (l_id, '녹차', 'nokcha', 'green tea', 5),
  (l_id, '카페', 'kape', 'café', 6),
  (l_id, '주문하다', 'jumunhada', 'to order', 7),
  (l_id, '카페인', 'kafein', 'caffeine', 8),
  (l_id, '따뜻한', 'ttatteuthan', 'warm / hot', 9),
  (l_id, '아이스', 'aiseu', 'iced / ice', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~(으)로 주세요 — please give me', '[음식/음료] + (으)로 주세요', '(으)로 주세요 is used when ordering or requesting something specific. Very useful in cafés.', '[{"korean": "아메리카노로 주세요.", "english": "Please give me an Americano."}, {"korean": "따뜻한 녹차로 주세요.", "english": "Please give me a warm green tea."}, {"korean": "아이스 라떼로 주세요.", "english": "Please give me an iced latte."}]', 1),
  (l_id, '~이/가 있어요 — there is / I have', '[명사] + 이/가 + 있어요', '있어요 means there is or I have. 이 follows consonant-final nouns, 가 follows vowel-final nouns.', '[{"korean": "카페인이 있어요?", "english": "Does it have caffeine?"}, {"korean": "카페에 자리가 있어요.", "english": "There are seats in the café."}, {"korean": "디카페인이 있어요?", "english": "Is there decaf?"}]', 2),
  (l_id, '~을/를 좋아하다 — to like something', '[명사] + 을/를 + 좋아하다', '좋아하다 means to like. The object particle 을/를 precedes it.', '[{"korean": "저는 커피를 좋아해요.", "english": "I like coffee."}, {"korean": "녹차를 좋아해요.", "english": "I like green tea."}, {"korean": "아이스 아메리카노를 좋아해요.", "english": "I like iced Americano."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '카페 자주 가요?', 'Kape jaju gayo?', 'Do you go to cafés often?', 1),
  (l_id, '민호', '네, 거의 매일 가요. 커피 없이는 못 살아요!', 'Ne, geoeui maeil gayo. Keopi eobsineun mot sarayo!', 'Yes, I go almost every day. I cannot live without coffee!', 2),
  (l_id, '수진', '주로 뭘 마셔요?', 'Juro mwol masyeoyo?', 'What do you usually drink?', 3),
  (l_id, '민호', '아이스 아메리카노를 좋아해요. 수진 씨는요?', 'Aiseu amerikanoreul joahaeyo. Sujin ssineunyo?', 'I like iced Americano. What about you, Sujin?', 4),
  (l_id, '수진', '저는 따뜻한 녹차를 좋아해요. 카페인이 적거든요.', 'Jeoneun ttatteuthan nokchareul joahaeyo. Kafeini jeokgeoduenyo.', 'I like warm green tea. It has less caffeine.', 5),
  (l_id, '민호', '오늘 카페에서 같이 공부할까요?', 'Oneul kapeseo gachi gongbuharkkayo?', 'Shall we study together at the café today?', 6),
  (l_id, '수진', '좋아요! 뭘 주문할 거예요?', 'Joayo! Mwol jumonhal geoyeyo?', 'Sounds good! What are you going to order?', 7),
  (l_id, '민호', '라떼 한 잔 주문할게요. 오늘은 따뜻한 걸로요.', 'Ratte han jan jumunhalgeyo. Oneureun ttatteuthan georloyo.', 'I will order a latte. A warm one today.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''녹차'' means:', '["coffee", "latte", "green tea", "juice"]', 2, '녹차 means green tea.', 1),
  (l_id, 'How do you order ''an iced Americano please''?', '["아이스 아메리카노가 주세요", "아이스 아메리카노를 주세요", "아이스 아메리카노로 주세요", "아이스 아메리카노에 주세요"]', 2, '(으)로 주세요 is used for ordering: 아이스 아메리카노로 주세요.', 2),
  (l_id, 'Which word means ''to order''?', '["마시다", "주문하다", "사다", "좋아하다"]', 1, '주문하다 means to order.', 3),
  (l_id, 'How do you say ''I like coffee''?', '["커피가 좋아해요", "커피를 좋아해요", "커피는 좋아해요", "커피에 좋아해요"]', 1, '을/를 marks the object: 커피를 좋아해요.', 4),
  (l_id, '''따뜻한'' means:', '["cold", "iced", "warm", "sweet"]', 2, '따뜻한 means warm or hot.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 사람들은 커피를 매우 좋아한다. 서울에는 카페가 정말 많다. 사람들은 카페에서 공부하거나 친구를 만나거나 일을 한다. 인기 있는 음료는 아이스 아메리카노이다. 겨울에는 따뜻한 라떼나 녹차를 즐기는 사람들도 많다. 녹차는 카페인이 적어서 건강을 생각하는 사람들에게 인기가 있다. 카페 문화는 한국의 일상 생활에서 중요한 부분이 되었다.', 'Korean people love coffee very much. There are really many cafés in Seoul. People study, meet friends, or work at cafés. The most popular drink is iced Americano. In winter many people also enjoy warm lattes or green tea. Green tea has less caffeine so it is popular among health-conscious people. Café culture has become an important part of everyday life in Korea.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 9;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '계획', 'gyehoek', 'plan', 1),
  (l_id, '일정', 'iljeong', 'schedule', 2),
  (l_id, '할 일', 'hal il', 'to-do / things to do', 3),
  (l_id, '메모', 'memo', 'memo / note', 4),
  (l_id, '목표', 'mokpyo', 'goal / target', 5),
  (l_id, '약속', 'yaksok', 'appointment / promise', 6),
  (l_id, '달력', 'dallyeok', 'calendar', 7),
  (l_id, '시간표', 'sigantyo', 'timetable', 8),
  (l_id, '우선순위', 'useonsuinwi', 'priority', 9),
  (l_id, '확인하다', 'hwagin-hada', 'to check / to confirm', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~을/를 세우다 — to make a plan', '[계획/목표] + 을/를 + 세우다', '세우다 literally means to set up. Used with 계획 or 목표 to mean making a plan or setting a goal.', '[{"korean": "계획을 세워요.", "english": "I make a plan."}, {"korean": "오늘 목표를 세웠어요.", "english": "I set a goal for today."}, {"korean": "주간 일정을 세워요.", "english": "I make a weekly schedule."}]', 1),
  (l_id, '~을/를 확인하다 — to check something', '[명사] + 을/를 + 확인하다', '확인하다 means to check or confirm. Often used with schedules, messages, and to-do lists.', '[{"korean": "일정을 확인해요.", "english": "I check my schedule."}, {"korean": "할 일 목록을 확인해요.", "english": "I check my to-do list."}, {"korean": "약속을 확인했어요.", "english": "I confirmed the appointment."}]', 2),
  (l_id, '먼저 — first / firstly', '먼저 + [동사]', '먼저 is an adverb meaning first or firstly. Used to indicate what to do first in a sequence.', '[{"korean": "먼저 메모를 써요.", "english": "First I write a memo."}, {"korean": "먼저 우선순위를 정해요.", "english": "First I decide the priorities."}, {"korean": "먼저 달력을 확인해요.", "english": "First I check the calendar."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 할 일이 많아요?', 'Oneul hal ili manayo?', 'Do you have a lot to do today?', 1),
  (l_id, '민호', '네, 그래서 아침에 일정을 먼저 확인해요.', 'Ne, geuraeseo achime iljeongel meonjeo hwagianhaeyo.', 'Yes, so in the morning I first check my schedule.', 2),
  (l_id, '수진', '저도 달력에 다 써 놔요. 잊어버리지 않으려고요.', 'Jeodo dallyeoke da sseo nwayo. Ijeobeuriji aneumyeoryo.', 'I also write everything on my calendar. So I do not forget.', 3),
  (l_id, '민호', '메모하는 습관이 정말 좋아요.', 'Memohaneun seupgwani jeongmal joayo.', 'The habit of taking notes is really good.', 4),
  (l_id, '수진', '오늘 목표가 뭐예요?', 'Oneul mokpyoga mwoyeyo?', 'What is your goal for today?', 5),
  (l_id, '민호', '오전에 중요한 일을 먼저 끝내는 게 목표예요.', 'Ojeone jungyohan ireul meonjeo kkeutnaeneun ge mokpyoyeyo.', 'My goal is to finish the important tasks in the morning first.', 6),
  (l_id, '수진', '우선순위를 잘 정하면 시간이 절약돼요.', 'Useonsuinwireul jal jeonhamyeon sigani jeoryakdwaeyo.', 'If you set priorities well you save time.', 7),
  (l_id, '민호', '맞아요. 오늘 약속도 있으니까 시간표를 잘 봐야 해요.', 'Majeyo. Oneul yaksokdo isseunikka sigantyo reul jal bwaya haeyo.', 'You are right. I also have an appointment today so I need to check the timetable.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''약속'' means:', '["goal", "schedule", "priority", "appointment"]', 3, '약속 means appointment or promise.', 1),
  (l_id, 'How do you say ''I make a plan''?', '["계획이 세워요", "계획을 세워요", "계획에 세워요", "계획은 세워요"]', 1, 'Object particle 을 is used: 계획을 세워요.', 2),
  (l_id, 'Which word means ''priority''?', '["목표", "일정", "우선순위", "달력"]', 2, '우선순위 means priority.', 3),
  (l_id, 'What does 확인하다 mean?', '["to plan", "to check/confirm", "to write", "to forget"]', 1, '확인하다 means to check or confirm.', 4),
  (l_id, '먼저 means:', '["later", "together", "first", "again"]', 2, '먼저 means first or firstly.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 아침 하루를 계획한다. 달력과 시간표를 확인하고 오늘 할 일을 메모한다. 우선순위가 높은 일을 먼저 처리하려고 노력한다. 약속이 있으면 시간을 잘 지키는 것이 중요하다. 목표를 세우면 더 집중해서 일할 수 있다. 계획적으로 하루를 보내면 일을 더 효율적으로 할 수 있다. 좋은 계획이 좋은 하루를 만든다.', 'Every morning I plan my day. I check my calendar and timetable and write down what I need to do today. I try to deal with the highest priority tasks first. When I have an appointment it is important to be on time. Setting goals helps me work with more focus. Spending the day in an organised way lets me work more efficiently. A good plan makes a good day.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 10;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '좋은 아침', 'joeun achim', 'good morning', 1),
  (l_id, '잘 잤어요', 'jal jasseoyo', 'did you sleep well?', 2),
  (l_id, '피곤하다', 'pigonhada', 'to be tired', 3),
  (l_id, '졸리다', 'jollida', 'to be sleepy', 4),
  (l_id, '기분이 좋다', 'gibuni joda', 'to feel good / to be in a good mood', 5),
  (l_id, '날씨', 'nalssi', 'weather', 6),
  (l_id, '화창하다', 'hwachanghada', 'to be sunny and clear', 7),
  (l_id, '맑다', 'makda', 'to be clear / sunny', 8),
  (l_id, '흐리다', 'heurida', 'to be cloudy', 9),
  (l_id, '바람이 불다', 'barami bulda', 'the wind blows / it is windy', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~어/아요 — polite present tense', '[동사/형용사 어간] + 아/어요', 'The polite present tense ending 아/어요 is used in everyday conversation. Choose 아요 for stems with ㅏ or ㅗ, 어요 for others.', '[{"korean": "날씨가 맑아요.", "english": "The weather is clear."}, {"korean": "오늘 피곤해요.", "english": "I am tired today."}, {"korean": "기분이 좋아요.", "english": "I feel good."}]', 1),
  (l_id, '~네요 — expressing mild surprise or realisation', '[동사/형용사 어간] + 네요', '네요 is added to express that the speaker just noticed or realised something. It shows a mild reaction.', '[{"korean": "오늘 날씨가 정말 좋네요!", "english": "The weather is really nice today!"}, {"korean": "많이 피곤하네요.", "english": "You seem quite tired."}, {"korean": "바람이 많이 부네요.", "english": "The wind is blowing a lot."}]', 2),
  (l_id, '~고 싶지 않다 — not wanting to do something', '[동사 어간] + 고 싶지 않아요', 'The negative of 고 싶다. Expresses not wanting to do something.', '[{"korean": "오늘은 나가고 싶지 않아요.", "english": "I do not want to go out today."}, {"korean": "흐린 날에는 일하고 싶지 않아요.", "english": "On cloudy days I do not want to work."}, {"korean": "피곤해서 움직이고 싶지 않아요.", "english": "I am tired so I do not want to move."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '좋은 아침이에요, 민호 씨! 잘 잤어요?', 'Joeun achimieyo, Minho ssi! Jal jasseoyo?', 'Good morning, Minho! Did you sleep well?', 1),
  (l_id, '민호', '안녕하세요! 조금 피곤해요. 어젯밤에 늦게 잤어요.', 'Annyeonghaseyo! Jogeum pigonhaeyo. Eojeo bame neutge jasseoyo.', 'Hello! I am a bit tired. I went to bed late last night.', 2),
  (l_id, '수진', '오늘 날씨가 화창하네요! 기분이 좋아지지 않아요?', 'Oneul nalssiga hwachanghaneyo! Gibuni joa-jiji anayo?', 'The weather is so sunny today! Does it not lift your mood?', 3),
  (l_id, '민호', '맞아요, 맑은 날씨를 보니 기분이 조금 좋아졌어요.', 'Majeyo, malgeun nalssireul boni gibuni jogeum joa-jyeosseoyo.', 'You are right, seeing the clear weather made me feel a bit better.', 4),
  (l_id, '수진', '그래도 아직 졸리죠?', 'Geuraedo ajik jollijo?', 'But you are still sleepy, right?', 5),
  (l_id, '민호', '조금요. 커피를 마시면 괜찮을 것 같아요.', 'Jogeumyo. Keopireul masimyeon gwaenchanheul geot gatayo.', 'A little. I think I will be fine after drinking coffee.', 6),
  (l_id, '수진', '어제 바람이 많이 불었어요. 오늘은 맑네요.', 'Eoje barami mani bureosseoyo. Oneureun mangneyo.', 'Yesterday it was very windy. Today it is clear.', 7),
  (l_id, '민호', '오늘 같은 날씨에는 기분이 저절로 좋아져요.', 'Oneul gateun nalssiene gibuni jejeolro joa-jyeoyo.', 'On days like today you just naturally feel good.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''졸리다'' means:', '["to be tired", "to be sleepy", "to feel good", "to be cloudy"]', 1, '졸리다 means to be sleepy.', 1),
  (l_id, 'How do you say ''The weather is clear''?', '["날씨가 흐려요", "날씨가 맑아요", "날씨가 바람이에요", "날씨가 피곤해요"]', 1, '맑다 → 맑아요 means the weather is clear.', 2),
  (l_id, 'Which phrase means ''good morning''?', '["잘 자요", "좋은 아침", "안녕히 가세요", "잘 먹었어요"]', 1, '좋은 아침 means good morning.', 3),
  (l_id, 'What does ~네요 express?', '["a wish", "a question", "a mild surprise or realisation", "a command"]', 2, '~네요 expresses noticing or a mild reaction/realisation.', 4),
  (l_id, '''흐리다'' means:', '["sunny", "windy", "cloudy", "rainy"]', 2, '흐리다 means to be cloudy.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '오늘 아침에 일어나니 날씨가 화창하고 맑다. 어젯밤에 바람이 많이 불었는데 오늘은 하늘이 파랗다. 이런 날에는 기분이 저절로 좋아진다. 하지만 나는 조금 피곤하고 졸리다. 어젯밤에 늦게 잠을 잤기 때문이다. 친구에게 "좋은 아침"이라고 인사를 하니 기분이 더 좋아졌다. 맑은 날씨는 하루를 더 밝게 만들어 준다.', 'This morning when I woke up the weather was sunny and clear. Last night the wind blew a lot but today the sky is blue. On days like this your mood naturally improves. But I am a little tired and sleepy. It is because I went to sleep late last night. Saying good morning to my friend made me feel even better. Clear weather makes the day brighter.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 11;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '요리하다', 'yorihada', 'to cook', 1),
  (l_id, '재료', 'jaeryo', 'ingredient', 2),
  (l_id, '끓이다', 'kkeulida', 'to boil', 3),
  (l_id, '볶다', 'bokda', 'to stir-fry', 4),
  (l_id, '썰다', 'sseolda', 'to slice / to chop', 5),
  (l_id, '냄비', 'naembi', 'pot / saucepan', 6),
  (l_id, '프라이팬', 'peuraipaen', 'frying pan', 7),
  (l_id, '칼', 'kal', 'knife', 8),
  (l_id, '양념', 'yangnyeom', 'seasoning / marinade', 9),
  (l_id, '레시피', 'resipi', 'recipe', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~(으)로 만들다 — to make something with/from', '[재료] + (으)로 + 만들다', '(으)로 marks the material or ingredient used to make something. 만들다 means to make.', '[{"korean": "채소로 국을 만들어요.", "english": "I make soup from vegetables."}, {"korean": "계란으로 요리를 만들어요.", "english": "I make a dish from eggs."}, {"korean": "이 재료로 찌개를 만들 거예요.", "english": "I am going to make stew with these ingredients."}]', 1),
  (l_id, '~는 방법 — the way/method to do', '[동사 어간] + 는 방법', '는 방법 means the way or method to do something. It follows the verb stem.', '[{"korean": "김치찌개를 만드는 방법을 알아요.", "english": "I know how to make kimchi stew."}, {"korean": "채소를 써는 방법이 있어요.", "english": "There is a way to slice vegetables."}, {"korean": "레시피에 요리하는 방법이 있어요.", "english": "The recipe has the method for cooking."}]', 2),
  (l_id, '~을/를 넣다 — to add / to put in', '[재료] + 을/를 + 넣다', '넣다 means to put in or add. Used when adding ingredients while cooking.', '[{"korean": "냄비에 물을 넣어요.", "english": "I add water to the pot."}, {"korean": "양념을 넣어요.", "english": "I add the seasoning."}, {"korean": "야채를 프라이팬에 넣어요.", "english": "I put vegetables in the frying pan."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '저녁에 뭘 요리해요?', 'Jeonyeoge mwol yorihaeyo?', 'What are you cooking for dinner?', 1),
  (l_id, '민호', '오늘은 된장찌개를 끓일 거예요.', 'Oneureun doenjangchigaereul kkeurilgeoyeyo.', 'Today I am going to make doenjang stew.', 2),
  (l_id, '수진', '재료가 다 있어요?', 'Jaeryoga da isseoyo?', 'Do you have all the ingredients?', 3),
  (l_id, '민호', '네, 두부랑 채소랑 된장이 있어요.', 'Ne, dubulang chaesollang doenjangi isseoyo.', 'Yes, I have tofu, vegetables, and doenjang paste.', 4),
  (l_id, '수진', '레시피를 봐요, 아니면 그냥 요리해요?', 'Resipireul bwayo, animyeon geunyang yorihaeyo?', 'Do you follow a recipe or just cook?', 5),
  (l_id, '민호', '자주 만드는 거라서 레시피 없이도 돼요.', 'Jaju mandeuneu georaseo resipi eobsido dwaeyo.', 'I make it often so it is fine without a recipe.', 6),
  (l_id, '수진', '양념은 어떻게 해요?', 'Yangnyeomeun eotteoke haeyo?', 'How do you do the seasoning?', 7),
  (l_id, '민호', '된장이랑 마늘이랑 고춧가루를 넣어요. 맛있어요!', 'Doenjangilang mareurilang gochutkareul neoeoyo. Massisseoyo!', 'I add doenjang, garlic, and chilli powder. It is delicious!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''냄비'' means:', '["frying pan", "knife", "pot", "bowl"]', 2, '냄비 means pot or saucepan.', 1),
  (l_id, 'How do you say ''I add seasoning''?', '["양념이 넣어요", "양념을 넣어요", "양념에 넣어요", "양념은 넣어요"]', 1, 'Object particle 을 is used: 양념을 넣어요.', 2),
  (l_id, 'Which word means ''to slice''?', '["끓이다", "볶다", "넣다", "썰다"]', 3, '썰다 means to slice or chop.', 3),
  (l_id, 'What does (으)로 mark when used with 만들다?', '["the destination", "the material/ingredient used", "the time", "the manner"]', 1, '(으)로 before 만들다 marks the material or ingredient used.', 4),
  (l_id, '''레시피'' means:', '["seasoning", "ingredient", "recipe", "dish"]', 2, '레시피 means recipe.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '저는 저녁에 요리하는 것을 좋아한다. 냉장고에서 재료를 꺼내 칼로 채소를 썬다. 냄비에 물을 끓이고 양념을 넣는다. 프라이팬에 고기를 볶으면 맛있는 냄새가 난다. 레시피를 보면서 요리하면 처음에는 쉽다. 자주 요리하다 보면 레시피 없이도 할 수 있게 된다. 직접 만든 음식을 먹으면 더 맛있고 뿌듯하다.', 'I like to cook in the evening. I take ingredients out of the fridge and slice vegetables with a knife. I boil water in a pot and add seasoning. When I stir-fry meat in a frying pan it smells delicious. Following a recipe makes it easy at first. The more you cook the more you can do it without a recipe. Food you make yourself tastes better and gives you a sense of satisfaction.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 12;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '청소하다', 'cheongsohada', 'to clean', 1),
  (l_id, '빗자루', 'bitjaru', 'broom', 2),
  (l_id, '청소기', 'cheongsogi', 'vacuum cleaner', 3),
  (l_id, '쓸다', 'sseulda', 'to sweep', 4),
  (l_id, '닦다', 'dakda', 'to wipe / to polish', 5),
  (l_id, '정리하다', 'jeongrihada', 'to tidy up / to organise', 6),
  (l_id, '먼지', 'meonji', 'dust', 7),
  (l_id, '쓰레기', 'sseurelgi', 'rubbish / trash', 8),
  (l_id, '버리다', 'beorida', 'to throw away / to discard', 9),
  (l_id, '설거지', 'seolgeoji', 'washing the dishes', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~을/를 하다 — doing household chores (noun + 하다)', '[집안일 명사] + 을/를 + 하다', 'Many chore words are nouns. Adding 을/를 하다 turns them into verb phrases.', '[{"korean": "설거지를 해요.", "english": "I do the dishes."}, {"korean": "청소를 했어요.", "english": "I cleaned."}, {"korean": "빨래를 할 거예요.", "english": "I am going to do laundry."}]', 1),
  (l_id, '~아/어 놓다 — doing something in advance / leaving done', '[동사 어간] + 아/어 + 놓다', '아/어 놓다 indicates doing something and leaving it in that state, often for future use or convenience.', '[{"korean": "청소해 놓았어요.", "english": "I cleaned (and left it clean)."}, {"korean": "쓰레기를 버려 놓았어요.", "english": "I threw out the rubbish."}, {"korean": "정리해 놓으면 찾기 쉬워요.", "english": "If you tidy up it is easy to find things."}]', 2),
  (l_id, '얼마나 자주 — how often', '얼마나 자주 + [동사]?', '얼마나 자주 asks how often someone does something.', '[{"korean": "얼마나 자주 청소해요?", "english": "How often do you clean?"}, {"korean": "일주일에 한 번 청소해요.", "english": "I clean once a week."}, {"korean": "매일 쓰레기를 버려요.", "english": "I throw out the rubbish every day."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '집 청소 자주 해요?', 'Jip cheongso jaju haeyo?', 'Do you clean your house often?', 1),
  (l_id, '민호', '일주일에 두 번 청소해요. 먼지가 쌓이면 싫어요.', 'Iljuire du beon cheongsohaeyo. Meonjiga ssahimyeon sireoyo.', 'I clean twice a week. I dislike it when dust piles up.', 2),
  (l_id, '수진', '청소기로 해요, 빗자루로 해요?', 'Cheongsogiro haeyo, bitjaruro haeyo?', 'Do you use a vacuum cleaner or a broom?', 3),
  (l_id, '민호', '먼저 청소기로 쓸고 그다음에 걸레로 닦아요.', 'Meonjeo cheongsogiro sseulgo geudaeume geollero dakayo.', 'First I vacuum and then I wipe with a mop.', 4),
  (l_id, '수진', '쓰레기는 언제 버려요?', 'Sseurelgineun eonje beoryeoyo?', 'When do you throw out the rubbish?', 5),
  (l_id, '민호', '매일 저녁에 버려요. 쌓아 두면 냄새 나거든요.', 'Maeil jeonyeoge beoryeoyo. Ssaha dumyeon naemse naogeoduenyo.', 'I throw it out every evening. If you leave it to pile up it starts to smell.', 6),
  (l_id, '수진', '설거지는 바로 해요?', 'Seolgeojineun baro haeyo?', 'Do you wash the dishes right away?', 7),
  (l_id, '민호', '네, 먹고 나서 바로 해 놓아요. 그래야 편해요.', 'Ne, meokgo naseo baro hae noayo. Geuraeyia pyeonhaeyo.', 'Yes, I do them right after eating. That way it is more convenient.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''먼지'' means:', '["rubbish", "dust", "dirt", "smell"]', 1, '먼지 means dust.', 1),
  (l_id, 'How do you say ''I do the dishes''?', '["설거지를 해요", "설거지가 해요", "설거지에 해요", "설거지로 해요"]', 0, 'Object particle 를 is used: 설거지를 해요.', 2),
  (l_id, 'Which word means ''to throw away''?', '["청소하다", "닦다", "버리다", "쓸다"]', 2, '버리다 means to throw away or discard.', 3),
  (l_id, 'What does ~아/어 놓다 express?', '["doing something repeatedly", "doing something and leaving it done", "wanting to do", "finishing completely"]', 1, '아/어 놓다 means doing and leaving in that completed state.', 4),
  (l_id, 'How do you ask ''how often do you clean''?', '["언제 청소해요?", "얼마나 청소해요?", "얼마나 자주 청소해요?", "어디서 청소해요?"]', 2, '얼마나 자주 asks how often.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 집을 깨끗하게 유지하려고 노력한다. 일주일에 두 번 청소기를 돌리고 바닥을 닦는다. 빗자루로 먼지를 쓸고 나서 걸레로 깨끗이 닦는다. 쓰레기는 매일 저녁에 버린다. 설거지는 밥을 먹고 나서 바로 한다. 집이 정리되어 있으면 기분이 좋고 마음이 편안하다. 청소하는 습관을 들이면 집이 항상 깨끗하다.', 'I try to keep my house clean. Twice a week I run the vacuum cleaner and wipe the floor. After sweeping the dust with a broom I wipe it clean with a mop. I throw out the rubbish every evening. I wash the dishes right after eating. When the house is tidy I feel good and at ease. If you develop a cleaning habit the house is always clean.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 13;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '마트', 'mateu', 'supermarket / mart', 1),
  (l_id, '장을 보다', 'jangeul boda', 'to go grocery shopping', 2),
  (l_id, '쇼핑 카트', 'syoping kateu', 'shopping cart', 3),
  (l_id, '계산하다', 'gyesanhada', 'to pay / to calculate the bill', 4),
  (l_id, '영수증', 'yeongsujeoung', 'receipt', 5),
  (l_id, '채소', 'chaeso', 'vegetable', 6),
  (l_id, '과일', 'gwail', 'fruit', 7),
  (l_id, '고기', 'gogi', 'meat', 8),
  (l_id, '유제품', 'yujepum', 'dairy products', 9),
  (l_id, '할인', 'harin', 'discount / sale', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~에 가다 — going to a place', '[장소] + 에 + 가다', '에 marks the destination when going somewhere. 가다 means to go.', '[{"korean": "마트에 가요.", "english": "I go to the supermarket."}, {"korean": "주말에 마트에 갔어요.", "english": "I went to the supermarket on the weekend."}, {"korean": "장을 보러 마트에 가요.", "english": "I go to the supermarket to do grocery shopping."}]', 1),
  (l_id, '~(으)러 가다 — going in order to do', '[동사 어간] + (으)러 + 가다', '(으)러 expresses purpose when going somewhere. It means going in order to do something.', '[{"korean": "장을 보러 마트에 가요.", "english": "I go to the mart to do grocery shopping."}, {"korean": "과일을 사러 가요.", "english": "I go to buy fruit."}, {"korean": "계산하러 계산대에 가요.", "english": "I go to the checkout to pay."}]', 2),
  (l_id, '얼마예요? — how much is it?', '이것/저것/[물건]이 얼마예요?', '얼마예요 is used to ask the price. Very useful when shopping.', '[{"korean": "이 채소가 얼마예요?", "english": "How much is this vegetable?"}, {"korean": "사과가 얼마예요?", "english": "How much are the apples?"}, {"korean": "할인해서 오천 원이에요.", "english": "With the discount it is 5000 won."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 마트에 가요?', 'Oneul mateue gayo?', 'Are you going to the supermarket today?', 1),
  (l_id, '민호', '네, 장을 봐야 해요. 냉장고가 비었어요.', 'Ne, jangeul bwaya haeyo. Naengjanggoga biasseoyo.', 'Yes, I need to go grocery shopping. The fridge is empty.', 2),
  (l_id, '수진', '뭘 살 거예요?', 'Mwol sal geoyeyo?', 'What are you going to buy?', 3),
  (l_id, '민호', '채소랑 과일이랑 고기를 살 거예요.', 'Chaesolang gwaillirang gogireul sal geoyeyo.', 'I am going to buy vegetables, fruit, and meat.', 4),
  (l_id, '수진', '요즘 마트에서 할인 많이 해요?', 'Yojeum mateueseo harin mani haeyo?', 'Is the supermarket offering many discounts these days?', 5),
  (l_id, '민호', '네, 채소가 많이 할인하고 있어요.', 'Ne, chaesoga mani harinago isseoyo.', 'Yes, vegetables are discounted a lot right now.', 6),
  (l_id, '수진', '계산할 때 카드 써요?', 'Gyesanhal ttae kadeu sseoyo?', 'Do you use a card when you pay?', 7),
  (l_id, '민호', '네, 카드로 계산하고 영수증을 받아요.', 'Ne, kadeuro gyesanhago yeongsujeongeul badayo.', 'Yes, I pay by card and take the receipt.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''영수증'' means:', '["shopping cart", "discount", "receipt", "checkout"]', 2, '영수증 means receipt.', 1),
  (l_id, 'How do you say ''I go to the supermarket to buy fruit''?', '["과일이 사서 마트에 가요", "과일을 사러 마트에 가요", "과일로 마트에 가요", "과일을 사고 마트에 가요"]', 1, '(으)러 marks purpose: 과일을 사러 마트에 가요.', 2),
  (l_id, 'Which word means ''dairy products''?', '["채소", "과일", "고기", "유제품"]', 3, '유제품 means dairy products.', 3),
  (l_id, 'How do you ask the price?', '["얼마나 걸려요?", "얼마예요?", "몇 개예요?", "어디에 있어요?"]', 1, '얼마예요? asks the price.', 4),
  (l_id, '''할인'' means:', '["sale price", "discount", "cash", "coupon"]', 1, '할인 means discount or sale.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 일주일에 한 번 마트에 가서 장을 본다. 쇼핑 카트를 끌고 채소, 과일, 고기, 유제품 등을 사다. 가격표를 보면서 할인 제품을 찾으면 더 저렴하게 살 수 있다. 필요한 것을 다 고르고 나면 계산대에 가서 계산한다. 카드로 계산하고 영수증을 받는다. 마트에서 필요한 것을 미리 사 두면 매번 나가지 않아도 된다.', 'Once a week I go to the supermarket to do grocery shopping. I push a shopping cart and buy vegetables, fruit, meat, dairy products, and more. Looking at the price tags and finding discounted items lets me shop more cheaply. After selecting everything I need I go to the checkout and pay. I pay by card and receive the receipt. Buying what you need in advance at the supermarket means you do not have to go out every time.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 14;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '빨래', 'ppallae', 'laundry / washing clothes', 1),
  (l_id, '세탁기', 'setakgi', 'washing machine', 2),
  (l_id, '세제', 'selje', 'laundry detergent', 3),
  (l_id, '돌리다', 'dollida', 'to run / to spin (a machine)', 4),
  (l_id, '널다', 'neolda', 'to hang up (laundry)', 5),
  (l_id, '건조기', 'geonjogi', 'dryer', 6),
  (l_id, '접다', 'jeopda', 'to fold', 7),
  (l_id, '다리미질', 'darimijil', 'ironing', 8),
  (l_id, '얼룩', 'eolluk', 'stain', 9),
  (l_id, '분리하다', 'bullihada', 'to separate / to sort', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~을/를 돌리다 — to run a machine', '[기계] + 을/를 + 돌리다', '돌리다 means to turn or run. Used for machines like washing machines and dryers.', '[{"korean": "세탁기를 돌려요.", "english": "I run the washing machine."}, {"korean": "건조기를 돌렸어요.", "english": "I ran the dryer."}, {"korean": "세탁기를 한 번 더 돌릴 거예요.", "english": "I am going to run the washing machine one more time."}]', 1),
  (l_id, '~아/어야 하다 — must / have to (chores)', '[동사 어간] + 아/어야 하다', 'Expresses that doing something is necessary or obligatory.', '[{"korean": "빨래를 해야 해요.", "english": "I have to do the laundry."}, {"korean": "얼룩을 지워야 해요.", "english": "I have to remove the stain."}, {"korean": "옷을 분리해야 해요.", "english": "I have to sort the clothes."}]', 2),
  (l_id, '~고 나서 — after doing (sequential chores)', '[동사 어간] + 고 나서', 'Used to show one chore is completed before the next begins.', '[{"korean": "세탁기를 돌리고 나서 빨래를 널어요.", "english": "After running the washing machine I hang the laundry."}, {"korean": "빨래가 마르고 나서 접어요.", "english": "After the laundry dries I fold it."}, {"korean": "접고 나서 옷장에 넣어요.", "english": "After folding I put it in the wardrobe."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '빨래 자주 해요?', 'Ppallae jaju haeyo?', 'Do you do laundry often?', 1),
  (l_id, '민호', '일주일에 두 번 해요. 세탁기를 돌려요.', 'Iljuire du beon haeyo. Setakgireul dollyeoyo.', 'I do it twice a week. I run the washing machine.', 2),
  (l_id, '수진', '세제는 얼마나 넣어요?', 'Seljeneun eolmana neoeoyo?', 'How much detergent do you put in?', 3),
  (l_id, '민호', '세탁기에 표시된 만큼 넣어요. 너무 많으면 안 돼요.', 'Setakgie pyosidoen mankeum neoeoyo. Neomu maneumyeon an dwaeyo.', 'I put in as much as indicated on the machine. Too much is not good.', 4),
  (l_id, '수진', '세탁하고 나서 어디에 널어요?', 'Setakaego naseo eodie neoleoyo?', 'Where do you hang the laundry after washing?', 5),
  (l_id, '민호', '베란다에 널어요. 건조기가 없거든요.', 'Berandae neoleoyo. Geonjogiga eobgeoduenyo.', 'I hang it on the balcony. I do not have a dryer.', 6),
  (l_id, '수진', '얼룩진 옷은 어떻게 해요?', 'Eollukjin oseun eotteoke haeyo?', 'What do you do with stained clothes?', 7),
  (l_id, '민호', '먼저 얼룩을 지우고 나서 세탁기에 넣어요.', 'Meonjeo eollugeul jiugo naseo setakgie neoeoyo.', 'First I remove the stain and then put it in the washing machine.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''세탁기'' means:', '["dryer", "detergent", "washing machine", "hanger"]', 2, '세탁기 means washing machine.', 1),
  (l_id, 'How do you say ''I have to do the laundry''?', '["빨래를 할 거예요", "빨래를 해야 해요", "빨래를 했어요", "빨래를 하고 싶어요"]', 1, '아/어야 하다 expresses must/have to: 빨래를 해야 해요.', 2),
  (l_id, 'Which word means ''stain''?', '["세제", "얼룩", "건조기", "접다"]', 1, '얼룩 means stain.', 3),
  (l_id, 'What does 돌리다 mean in the context of laundry?', '["to fold", "to hang up", "to run/spin a machine", "to separate"]', 2, '돌리다 in this context means to run or operate a machine.', 4),
  (l_id, '''분리하다'' means:', '["to fold", "to iron", "to separate/sort", "to hang"]', 2, '분리하다 means to separate or sort.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 일주일에 두 번 빨래를 한다. 먼저 색깔 옷과 흰 옷을 분리한다. 세탁기에 세제를 넣고 빨래를 돌린다. 세탁이 끝나면 옷을 꺼내 베란다에 넌다. 햇빛이 좋은 날에는 빨리 마른다. 완전히 마르면 옷을 접어서 옷장에 넣는다. 셔츠 같은 옷은 다리미질을 해야 더 깔끔하다. 깨끗한 옷을 입으면 기분이 좋다.', 'I do laundry twice a week. First I sort coloured and white clothes. I put detergent in the washing machine and run the wash. When the washing is done I take the clothes out and hang them on the balcony. On sunny days they dry quickly. Once fully dry I fold the clothes and put them in the wardrobe. Clothes like shirts look neater when ironed. Wearing clean clothes feels good.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 15;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '수리하다', 'surihada', 'to repair', 1),
  (l_id, '고치다', 'gochida', 'to fix / to mend', 2),
  (l_id, '망치', 'mangchi', 'hammer', 3),
  (l_id, '나사', 'nasa', 'screw', 4),
  (l_id, '드라이버', 'deuraibeo', 'screwdriver', 5),
  (l_id, '전구', 'jeongu', 'light bulb', 6),
  (l_id, '배관', 'baegwan', 'plumbing / pipe', 7),
  (l_id, '누수', 'nusu', 'water leak', 8),
  (l_id, '페인트', 'peinteu', 'paint', 9),
  (l_id, '공구', 'gonggu', 'tool / equipment', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~이/가 고장났어요 — something broke down', '[명사] + 이/가 + 고장났어요', '고장나다 means to break down. 이/가 marks the subject.', '[{"korean": "전구가 고장났어요.", "english": "The light bulb broke."}, {"korean": "수도가 고장났어요.", "english": "The water pipe broke down."}, {"korean": "세탁기가 고장났어요.", "english": "The washing machine broke down."}]', 1),
  (l_id, '~을/를 고쳐야 해요 — need to fix something', '[명사] + 을/를 + 고쳐야 해요', '고치다 means to fix. Combined with 아/어야 하다 it expresses the need to repair.', '[{"korean": "전구를 고쳐야 해요.", "english": "I need to fix the light bulb."}, {"korean": "누수를 고쳐야 해요.", "english": "I need to fix the water leak."}, {"korean": "나사를 조여야 해요.", "english": "I need to tighten the screw."}]', 2),
  (l_id, '~(으)ㄹ 줄 알다/모르다 — knowing/not knowing how to', '[동사 어간] + (으)ㄹ 줄 알다/모르다', 'Used to express whether someone knows how to do something.', '[{"korean": "수리할 줄 알아요.", "english": "I know how to repair it."}, {"korean": "드라이버를 쓸 줄 알아요?", "english": "Do you know how to use a screwdriver?"}, {"korean": "페인트칠할 줄 몰라요.", "english": "I do not know how to paint."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '집에 뭔가 고장났어요?', 'Jibe mwonga gojangnaesseoyo?', 'Did something break down at home?', 1),
  (l_id, '민호', '네, 화장실 전구가 나갔어요.', 'Ne, hwajangsil jeon-guga nagasseoyo.', 'Yes, the bathroom light bulb went out.', 2),
  (l_id, '수진', '전구를 갈 줄 알아요?', 'Jeon-gureul gal jul arayo?', 'Do you know how to change a light bulb?', 3),
  (l_id, '민호', '네, 쉬워요. 드라이버랑 새 전구만 있으면 돼요.', 'Ne, swiwoyo. Deuraibeolang sae jeon-guman isseumyeon dwaeyo.', 'Yes, it is easy. You just need a screwdriver and a new bulb.', 4),
  (l_id, '수진', '그 외에 다른 문제는 없어요?', 'Geu oie dareun munjenneun eopseoyo?', 'Are there any other problems?', 5),
  (l_id, '민호', '배관에서 물이 조금 새는 것 같아요. 누수인 것 같아요.', 'Baegwaneseo muri jogeum saeneun geot gatayo. Nusuine geot gatayo.', 'Water seems to be dripping a little from the pipe. I think it might be a leak.', 6),
  (l_id, '수진', '그건 혼자 고치기 어려울 수도 있어요.', 'Geugeon honja gochigi eoryeoul sudo isseoyo.', 'That might be hard to fix by yourself.', 7),
  (l_id, '민호', '맞아요. 수리 기사를 불러야 할 것 같아요.', 'Majeyo. Suri gisareul bulleoya hal geot gatayo.', 'You are right. I think I need to call a repairman.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''망치'' means:', '["screwdriver", "hammer", "wrench", "drill"]', 1, '망치 means hammer.', 1),
  (l_id, 'How do you say ''The washing machine broke down''?', '["세탁기가 고장났어요", "세탁기를 고장났어요", "세탁기가 고장내요", "세탁기에 고장났어요"]', 0, 'Subject particle 가 marks the subject: 세탁기가 고장났어요.', 2),
  (l_id, 'Which word means ''water leak''?', '["배관", "전구", "누수", "나사"]', 2, '누수 means water leak.', 3),
  (l_id, 'How do you say ''I know how to repair it''?', '["수리할 줄 알아요", "수리할 줄 몰라요", "수리하고 싶어요", "수리할 수 없어요"]', 0, '(으)ㄹ 줄 알다 means to know how to do something.', 4),
  (l_id, '''드라이버'' means:', '["hammer", "wrench", "drill", "screwdriver"]', 3, '드라이버 means screwdriver.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '집에서 살다 보면 크고 작은 수리가 필요할 때가 있다. 전구가 나가면 드라이버로 새 전구를 교체할 수 있다. 나사가 헐거워지면 드라이버로 조여야 한다. 페인트가 벗겨진 벽은 페인트칠로 새로 고칠 수 있다. 하지만 배관 누수 같은 심각한 문제는 전문 수리 기사를 불러야 한다. 공구를 잘 다룰 줄 알면 간단한 수리는 직접 할 수 있다.', 'Living in a home there are times when repairs big and small are needed. When a light bulb goes out you can replace it with a new one using a screwdriver. When a screw gets loose you need to tighten it with a screwdriver. A wall where the paint has peeled can be fixed with a fresh coat of paint. However for serious problems like plumbing leaks you need to call a professional repairman. If you know how to handle tools well you can do simple repairs yourself.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 16;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '가족', 'gajok', 'family', 1),
  (l_id, '부모님', 'bumonim', 'parents', 2),
  (l_id, '형제', 'hyeongje', 'siblings / brothers', 3),
  (l_id, '자매', 'jamae', 'sisters', 4),
  (l_id, '함께', 'hamkke', 'together', 5),
  (l_id, '저녁 식사', 'jeonyeok siksa', 'dinner', 6),
  (l_id, '대화하다', 'daehwahada', 'to have a conversation / to talk', 7),
  (l_id, '웃다', 'utda', 'to laugh / to smile', 8),
  (l_id, '놀다', 'nolda', 'to play / to hang out', 9),
  (l_id, '사랑하다', 'saranghada', 'to love', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~와/과 함께 — together with', '[명사] + 와/과 + 함께', '와/과 means and or with. 함께 means together. Together they express doing something with someone.', '[{"korean": "가족과 함께 저녁을 먹어요.", "english": "I eat dinner together with my family."}, {"korean": "부모님과 함께 있어요.", "english": "I am with my parents."}, {"korean": "형제랑 함께 놀아요.", "english": "I play with my siblings."}]', 1),
  (l_id, '~에 대해 이야기하다 — to talk about something', '[주제] + 에 대해 + 이야기하다', '에 대해 means about or regarding. Used when saying what a conversation is about.', '[{"korean": "오늘 학교에 대해 이야기했어요.", "english": "I talked about school today."}, {"korean": "가족에 대해 이야기해요.", "english": "We talk about the family."}, {"korean": "계획에 대해 이야기했어요.", "english": "We talked about our plans."}]', 2),
  (l_id, '~는 것이 중요하다 — it is important to', '[동사 어간] + 는 것이 + 중요하다', 'Nominalising a verb with 는 것 and combining with 중요하다 expresses that something is important.', '[{"korean": "가족과 함께 시간을 보내는 것이 중요해요.", "english": "It is important to spend time with family."}, {"korean": "매일 대화하는 것이 중요해요.", "english": "It is important to have conversations every day."}, {"korean": "서로 사랑하는 것이 중요해요.", "english": "It is important to love each other."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '저녁에 가족이랑 뭐 해요?', 'Jeonyeoge gajogilang mwo haeyo?', 'What do you do with your family in the evenings?', 1),
  (l_id, '민호', '보통 같이 저녁 식사를 해요. 그리고 대화를 많이 해요.', 'Botong gachi jeonyeok siksareul haeyo. Geurigo daehwareul mani haeyo.', 'We usually have dinner together. And we talk a lot.', 2),
  (l_id, '수진', '가족이 몇 명이에요?', 'Gagoki myeot myeongieyo?', 'How many people are in your family?', 3),
  (l_id, '민호', '부모님이랑 형이랑 저, 셋이에요.', 'Bumonimilang hyeongilang jeo, sesieyo.', 'My parents, my older brother, and me. There are three of us.', 4),
  (l_id, '수진', '형이랑 사이가 좋아요?', 'Hyeongilang saiga joayo?', 'Are you close with your older brother?', 5),
  (l_id, '민호', '네, 같이 자주 놀아요. 형이랑 웃는 게 좋아요.', 'Ne, gachi jaju norayo. Hyeongilang utneun ge joayo.', 'Yes, we hang out together often. I like laughing with my brother.', 6),
  (l_id, '수진', '가족이 정말 소중하죠.', 'Gagoki jeongmal sojunghajyo.', 'Family is really precious, is it not.', 7),
  (l_id, '민호', '네, 가족을 정말 사랑해요.', 'Ne, gagogeul jeongmal saranghaeyo.', 'Yes, I really love my family.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''부모님'' means:', '["siblings", "relatives", "parents", "grandparents"]', 2, '부모님 means parents.', 1),
  (l_id, 'How do you say ''I eat dinner together with my family''?', '["가족에 함께 저녁을 먹어요", "가족과 함께 저녁을 먹어요", "가족을 함께 저녁을 먹어요", "가족이 함께 저녁을 먹어요"]', 1, '와/과 함께 expresses together with: 가족과 함께.', 2),
  (l_id, 'Which word means ''to have a conversation''?', '["웃다", "놀다", "대화하다", "사랑하다"]', 2, '대화하다 means to have a conversation.', 3),
  (l_id, 'What structure means ''it is important to''?', '["~는 게 좋다", "~는 것이 중요하다", "~아/어야 하다", "~고 싶다"]', 1, '~는 것이 중요하다 means it is important to.', 4),
  (l_id, '''자매'' means:', '["brothers", "siblings", "parents", "sisters"]', 3, '자매 means sisters.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 가족을 정말 사랑한다. 우리 가족은 매일 저녁 식사를 함께 한다. 밥을 먹으면서 하루 동안 있었던 일에 대해 이야기한다. 형제랑 웃고 떠들다 보면 시간이 금방 지나간다. 부모님께서는 항상 따뜻하게 우리를 대해 주신다. 가족과 함께 시간을 보내는 것이 나에게 가장 소중한 일이다. 바쁜 하루를 보내도 가족이 있으면 든든하다.', 'I really love my family. Our family has dinner together every evening. While eating we talk about what happened during the day. Laughing and chatting with siblings makes time pass quickly. Our parents always treat us warmly. Spending time with family is the most precious thing to me. Even after a busy day having family around makes you feel secure.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 17;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '스마트폰', 'seumateupon', 'smartphone', 1),
  (l_id, '앱', 'aep', 'app / application', 2),
  (l_id, '문자', 'munja', 'text message', 3),
  (l_id, '전화하다', 'jeonhwahada', 'to make a phone call', 4),
  (l_id, '충전하다', 'chungjeonhada', 'to charge (a device)', 5),
  (l_id, '인터넷', 'inteonet', 'internet', 6),
  (l_id, '검색하다', 'geomsaekada', 'to search / to look up', 7),
  (l_id, '사진 찍다', 'sajin jikda', 'to take a photo', 8),
  (l_id, '알림', 'allim', 'notification / alert', 9),
  (l_id, '배터리', 'baeteori', 'battery', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~에게 전화하다 — to call someone', '[사람] + 에게/한테 + 전화하다', '에게 or 한테 marks the person you call. 전화하다 means to make a phone call.', '[{"korean": "친구에게 전화했어요.", "english": "I called my friend."}, {"korean": "엄마한테 전화할게요.", "english": "I will call my mum."}, {"korean": "누구에게 전화해요?", "english": "Who are you calling?"}]', 1),
  (l_id, '~(으)면 되다 — it is okay to / all you have to do is', '[동사 어간] + (으)면 돼요', '(으)면 돼요 expresses that a condition or action is sufficient.', '[{"korean": "앱을 설치하면 돼요.", "english": "All you have to do is install the app."}, {"korean": "충전하면 돼요.", "english": "You just need to charge it."}, {"korean": "인터넷에서 검색하면 돼요.", "english": "All you have to do is search on the internet."}]', 2),
  (l_id, '~는 중이다 — currently doing something', '[동사 어간] + 는 중이다', '는 중이다 expresses an action that is currently in progress.', '[{"korean": "지금 충전하는 중이에요.", "english": "It is currently charging."}, {"korean": "사진을 찍는 중이에요.", "english": "I am in the middle of taking a photo."}, {"korean": "검색하는 중이에요.", "english": "I am in the middle of searching."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '스마트폰 자주 써요?', 'Seumateupon jaju sseoyo?', 'Do you use your smartphone often?', 1),
  (l_id, '민호', '네, 거의 매일 써요. 문자도 보내고 검색도 해요.', 'Ne, geoeui maeil sseoyo. Munjado bonaego geomsaekdo haeyo.', 'Yes, I use it almost every day. I send messages and search things.', 2),
  (l_id, '수진', '배터리가 오래 가요?', 'Baeteori oreae gayo?', 'Does the battery last long?', 3),
  (l_id, '민호', '아니요, 배터리가 빨리 닳아요. 자주 충전해야 해요.', 'Aniyo, baeteori ppalli dara-yo. Jaju chungjeonhaeya haeyo.', 'No, the battery drains quickly. I have to charge it often.', 4),
  (l_id, '수진', '사진도 많이 찍어요?', 'Sajindo mani jiggeoyo?', 'Do you take a lot of photos too?', 5),
  (l_id, '민호', '네! 음식 사진을 자주 찍어요. 인스타에 올려요.', 'Ne! Eumsik sajineul jaju jigeoyo. Inseuta-e ollyeoyo.', 'Yes! I often take photos of food. I upload them to Instagram.', 6),
  (l_id, '수진', '알림이 많이 와요?', 'Allimi mani wayo?', 'Do you get many notifications?', 7),
  (l_id, '민호', '너무 많아요. 집중할 때는 알림을 꺼요.', 'Neomu manayo. Jipjungal ttaeneun allimeul kkeoyo.', 'Way too many. When I need to focus I turn off the notifications.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''배터리'' means:', '["charger", "notification", "battery", "app"]', 2, '배터리 means battery.', 1),
  (l_id, 'How do you say ''I called my friend''?', '["친구가 전화했어요", "친구를 전화했어요", "친구에게 전화했어요", "친구로 전화했어요"]', 2, '에게 marks the person called: 친구에게 전화했어요.', 2),
  (l_id, 'Which word means ''notification''?', '["앱", "문자", "알림", "충전"]', 2, '알림 means notification or alert.', 3),
  (l_id, 'What does ~는 중이다 express?', '["a completed action", "a future plan", "a currently ongoing action", "a desire"]', 2, '~는 중이다 expresses an action currently in progress.', 4),
  (l_id, '''검색하다'' means:', '["to call", "to charge", "to search/look up", "to take a photo"]', 2, '검색하다 means to search or look up.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '요즘 스마트폰은 우리 생활에서 없어서는 안 될 물건이 되었다. 스마트폰으로 문자를 보내고 전화를 하고 인터넷에서 정보를 검색할 수 있다. 사진을 찍어서 추억을 남기기도 한다. 하지만 스마트폰을 너무 많이 쓰면 배터리가 빨리 닳아서 충전을 자주 해야 한다. 알림이 많이 오면 집중하기가 어렵다. 스마트폰을 잘 활용하되 너무 많이 의존하지 않는 것이 좋다.', 'Smartphones have become something we cannot do without in our daily lives these days. With a smartphone you can send messages, make calls, and search for information on the internet. You can also take photos to preserve memories. However using a smartphone too much drains the battery quickly so you need to charge it often. Getting many notifications makes it hard to concentrate. It is good to make good use of a smartphone but not to rely on it too heavily.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 18;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '텔레비전', 'tellebijeon', 'television / TV', 1),
  (l_id, '채널', 'chaenel', 'channel', 2),
  (l_id, '리모컨', 'rimokon', 'remote control', 3),
  (l_id, '드라마', 'deurama', 'TV drama / series', 4),
  (l_id, '예능', 'yeneung', 'variety show / entertainment program', 5),
  (l_id, '뉴스', 'nyuseu', 'news', 6),
  (l_id, '끄다', 'kkeuda', 'to turn off', 7),
  (l_id, '켜다', 'kyeoda', 'to turn on', 8),
  (l_id, '볼륨', 'bollyum', 'volume', 9),
  (l_id, '자막', 'jamak', 'subtitles', 10);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~을/를 켜다/끄다 — turning on/off', '[기기] + 을/를 + 켜다/끄다', '켜다 means to turn on and 끄다 means to turn off. Used with electronic devices.', '[{"korean": "텔레비전을 켜요.", "english": "I turn on the TV."}, {"korean": "텔레비전을 끄고 잘게요.", "english": "I will turn off the TV and sleep."}, {"korean": "라디오를 켰어요.", "english": "I turned on the radio."}]', 1),
  (l_id, '~을/를 보다 — watching something', '[프로그램/채널] + 을/를 + 보다', '보다 means to see or watch. Used for watching TV shows, films, and news.', '[{"korean": "드라마를 봐요.", "english": "I watch a drama."}, {"korean": "뉴스를 봤어요.", "english": "I watched the news."}, {"korean": "예능을 볼 거예요.", "english": "I am going to watch a variety show."}]', 2),
  (l_id, '~는 것을 좋아하다 — liking to do something', '[동사 어간] + 는 것을 좋아하다', 'Nominalising a verb with 는 것 and adding 좋아하다 expresses enjoyment of an activity.', '[{"korean": "드라마를 보는 것을 좋아해요.", "english": "I like watching dramas."}, {"korean": "뉴스를 보는 것을 좋아해요.", "english": "I like watching the news."}, {"korean": "자막을 보는 것이 도움이 돼요.", "english": "Reading subtitles is helpful."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '저녁에 뭐 봐요?', 'Jeonyeoge mwo bwayo?', 'What do you watch in the evenings?', 1),
  (l_id, '민호', '보통 드라마를 봐요. 요즘 재미있는 게 많아요.', 'Botong deuramare bwayo. Yojeum jaemiinneun ge manayo.', 'I usually watch dramas. There are many interesting ones lately.', 2),
  (l_id, '수진', '어떤 채널을 자주 봐요?', 'Eotteon chaenereul jaju bwayo?', 'Which channel do you watch often?', 3),
  (l_id, '민호', '케이블 채널이요. 예능도 재미있어서 자주 봐요.', 'Keibeul chaeneo-riyo. Yeneungdo jaemiisseoseo jaju bwayo.', 'Cable channels. Variety shows are also fun so I watch often.', 4),
  (l_id, '수진', '뉴스는 봐요?', 'Nyuseunneun bwayo?', 'Do you watch the news?', 5),
  (l_id, '민호', '아침에 잠깐씩 봐요. 리모컨으로 채널을 돌려요.', 'Achime jamkkanssik bwayo. Rimokeoneuro chaenereul dollyeoyo.', 'I watch briefly in the morning. I flip through channels with the remote.', 6),
  (l_id, '수진', '자막 켜고 봐요?', 'Jamak kyeogo bwayo?', 'Do you watch with subtitles on?', 7),
  (l_id, '민호', '네, 외국 드라마는 자막이 있어야 이해가 돼요.', 'Ne, oeguk deuramanmeun jamagi isseoya ihagareul dweyo.', 'Yes, for foreign dramas you need subtitles to understand.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''리모컨'' means:', '["volume", "channel", "remote control", "subtitle"]', 2, '리모컨 means remote control.', 1),
  (l_id, 'How do you say ''I turn on the TV''?', '["텔레비전이 켜요", "텔레비전을 켜요", "텔레비전에 켜요", "텔레비전은 켜요"]', 1, 'Object particle 을 is used: 텔레비전을 켜요.', 2),
  (l_id, 'Which word means ''variety show''?', '["드라마", "뉴스", "예능", "채널"]', 2, '예능 means entertainment or variety show.', 3),
  (l_id, 'How do you say ''I like watching dramas''?', '["드라마를 봐요", "드라마를 보는 것을 좋아해요", "드라마를 보고 싶어요", "드라마를 보는 중이에요"]', 1, '는 것을 좋아하다 expresses liking to do something.', 4),
  (l_id, '''자막'' means:', '["volume", "subtitles", "screen", "remote"]', 1, '자막 means subtitles.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 사람들은 드라마 보는 것을 매우 좋아한다. 저녁 식사 후에 리모컨으로 텔레비전을 켜고 좋아하는 채널을 찾는다. 드라마, 예능, 뉴스 등 다양한 프로그램이 있다. 외국 드라마를 볼 때는 자막이 도움이 된다. 볼륨을 적당히 조절하는 것도 중요하다. 너무 늦게까지 텔레비전을 보면 잠을 못 자서 피곤하다. 적당히 보는 것이 좋다.', 'Korean people love watching dramas. After dinner they turn on the TV with the remote and find their favourite channel. There are various programmes such as dramas, variety shows, and the news. When watching foreign dramas subtitles are helpful. Adjusting the volume appropriately is also important. Watching TV until too late at night makes you unable to sleep and tired. It is best to watch in moderation.', 1);
END $$;
