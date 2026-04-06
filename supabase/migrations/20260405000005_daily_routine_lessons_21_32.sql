-- Daily Routine lessons 21–32: Full content seed


DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 21;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '첵', 'chaek', 'book', 1),
  (l_id, '읽다', 'ikda', 'to read', 2),
  (l_id, '도서관', 'doseogwan', 'library', 3),
  (l_id, '서점', 'seojeom', 'bookstore', 4),
  (l_id, '잡지', 'japji', 'magazine', 5),
  (l_id, '신문', 'sinmun', 'newspaper', 6),
  (l_id, '소설', 'soseol', 'novel', 7),
  (l_id, '수필', 'supil', 'essay', 8),
  (l_id, '시', 'si', 'poem', 9),
  (l_id, '저자', 'jeoja', 'author / writer', 10),
  (l_id, '페이지', 'peiji', 'page', 11),
  (l_id, '내용', 'naeyong', 'content', 12),
  (l_id, '걸작', 'geonjak', 'masterpiece', 13),
  (l_id, '노트', 'noteu', 'notes', 14),
  (l_id, '밀줄 치다', 'milul chida', 'to underline', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '을/를 읽다 — reading an object', '[명사] + 을/를 + 읽다', '읽다 means to read. Object particle 을 follows consonant-final nouns, 를 follows vowel-final nouns.', '[{"korean": "첵을 읽어요.", "english": "I read a book."}, {"korean": "신문을 읽어요.", "english": "I read a newspaper."}, {"korean": "잡지를 읽어요.", "english": "I read a magazine."}]', 1),
  (l_id, '동안 — expressing duration', '[시간 표현] + 동안', '동안 after a time noun means for that length of time.', '[{"korean": "한 시간 동안 읽었어요.", "english": "I read for one hour."}, {"korean": "두 시간 동안 도서관에 있었어요.", "english": "I was at the library for two hours."}, {"korean": "오래 동안 읽었어요.", "english": "I read for a long time."}]', 2),
  (l_id, 'Frequency adverbs: 자주 / 적마다 / 항상', '자주 (often) / 적마다 (sometimes) / 항상 (always) / 보통 (usually)', 'Frequency adverbs come before the verb and describe how often you read.', '[{"korean": "매일 신문을 읽어요.", "english": "I read the newspaper every day."}, {"korean": "적마다 소설을 읽어요.", "english": "I sometimes read novels."}, {"korean": "자주 도서관에 가요.", "english": "I often go to the library."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 시간 있어요?', 'Oneul sigan isseoyo?', 'Do you have time today?', 1),
  (l_id, '민호', '네, 오늘 도서관에 갈 거예요.', 'Ne, oneul doseogwane gal geoyeyo.', 'Yes, I am going to the library today.', 2),
  (l_id, '수진', '도서관에서 자주 읽어요?', 'Doseogwaneseo jaju ilgeoyo?', 'Do you often read at the library?', 3),
  (l_id, '민호', '네, 일주일에 세 번은 가요. 요즘 추리 소설에 합ca0어요.', 'Ne, iljuire se beoneun gayo. Yojeum churi soseore ppajyeosseoyo.', 'Yes, I go three times a week. Lately I am hooked on mystery novels.', 4),
  (l_id, '수진', '저는 자주 잡지를 읽어요. 소설은 조금 어려워요.', 'Jeoneun jaju japjireul ilgeoyo. Soseoreun jogeum eoryeowoyo.', 'I often read magazines. Novels are a bit difficult for me.', 5),
  (l_id, '민호', '처음엔 어렵지만 조금씩 읽다 보면 늘어요.', 'Cheoeumaen eoryeopjiman jogeumssik ikda bomyeon neureopseoyo.', 'It is hard at first but your reading improves little by little.', 6),
  (l_id, '수진', '추천해 주는 소설 있어요?', 'Chucheonhae juneun soseol isseoyo?', 'Do you have a novel to recommend?', 7),
  (l_id, '민호', '네! 나중에 취향에 맞는 소설 알려 줄게요.', 'Ne! Najunge chwihyange matneun soseol allyo julgeyo.', 'Yes! I will tell you a novel that suits your taste later.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''도서관'' means:', '["bookstore", "library", "school", "reading room"]', 1, '도서관 is library. 서점 is bookstore.', 1),
  (l_id, 'Which word means ''novel''?', '["잡지", "신문", "소설", "수필"]', 2, '소설 (soseol) = novel.', 2),
  (l_id, 'How to say ''I read for two hours''?', '["두 시간 읽어요", "두 시간 동안 읽었어요", "두 번 읽었어요", "두 시간 첵이어요"]', 1, '동안 marks duration: 두 시간 동안 읽었어요.', 3),
  (l_id, 'Object particle after ''첵''(book):', '["이", "가", "은", "을"]', 3, '첵 ends in consonant so the object particle is 을.', 4),
  (l_id, '''저자'' means:', '["reader", "library", "author", "page"]', 2, '저자 means author or writer.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 첵 읽기를 좋아한다. 틈임이 나면 도서관에 가서 조용한 곳에서 첵을 읽는다. 나는 특히 소설을 좋아하는데, 방에서 읽다 보면 시간이 금방 지나간다. 아침에는 커피를 마시면서 신문을 읽고, 저녁에는 잡지를 읽는다. 첵을 읽으면 새로운 단어를 배우고 세상을 더 많이 이해할 수 있다.', 'I love reading books. When I have free time I go to the library and read in a quiet place. I especially like novels and when I read in my room time passes quickly. In the morning I read the newspaper while drinking coffee and in the evening I read magazines. Reading books lets you learn new words and understand the world more deeply.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 22;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '않다', 'anda', 'to sit', 1),
  (l_id, '의자', 'uija', 'chair', 2),
  (l_id, '바닥', 'baDak', 'floor', 3),
  (l_id, '뉠닥라안다', 'ppallaanda', 'to sit down quickly', 4),
  (l_id, '교시지 묶다', 'gyo-siji mukta', 'to cross one''s legs', 5),
  (l_id, '바르게 않다', 'bareuge anda', 'to sit upright', 6),
  (l_id, '소파', 'sopa', 'sofa', 7),
  (l_id, '큐스틴', 'kyu-seuteun', 'cushion', 8),
  (l_id, '등반이를 포다', 'deungbaneul pida', 'to straighten one''s back', 9),
  (l_id, '자리', 'jari', 'seat / place', 10),
  (l_id, '앞자리', 'anjari', 'front seat', 11),
  (l_id, '듷자매', 'dwetjari', 'back seat', 12),
  (l_id, '자세', 'jase', 'posture / position', 13),
  (l_id, '눈높이', 'nunnoI', 'eye level', 14),
  (l_id, '버티다', 'beotida', 'to endure / to hold out', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '에 않다 — sitting in/on a place', '[장소] + 에 않다', '에 marks the location where you sit. Combine with 않다 to say you sit somewhere.', '[{"korean": "의자에 않어요.", "english": "I sit on a chair."}, {"korean": "소파에 않았어요.", "english": "I sat on the sofa."}, {"korean": "바닥에 않아요.", "english": "I sit on the floor."}]', 1),
  (l_id, '안 되다 / ~지 마세요 — prohibition', '~지 마세요 (please don''t) / ~으면 안 돼요 (you shouldn''t)', 'Use these patterns to say what one should not do with sitting, such as bad posture.', '[{"korean": "교시지 묶지 마세요.", "english": "Please do not cross your legs."}, {"korean": "구부정으면 안 돼요.", "english": "You should not slouch."}, {"korean": "바르게 않아요.", "english": "Sit up straight."}]', 2),
  (l_id, '컨 — adjective modifier for size', '[형용사] + [명사]', 'Adjectives in Korean directly modify nouns. Common in describing seats and positions.', '[{"korean": "큰 의자에 않았어요.", "english": "I sat on a big chair."}, {"korean": "편한 자세로 않았어요.", "english": "I sat in a comfortable position."}, {"korean": "잊은 자리에 않았어요.", "english": "I sat in my usual seat."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '여기 않아도 뎼요?', 'Yeogi anjado dwaeyo?', 'May I sit here?', 1),
  (l_id, '민호', '네, 물론이지요. 편하게 않으세요.', 'Ne, mullonikyo. Pyeonhage anjeuseyo.', 'Of course. Please sit comfortably.', 2),
  (l_id, '수진', '감사합니다. 소파가 정말 편하네요.', 'Gamsahamnida. Sopaga jeongmal pyeonhaneyo.', 'Thank you. This sofa is really comfortable.', 3),
  (l_id, '민호', '다스 자세로 않아야 등이 안 아파요.', 'Da-eun jaseoro anjaya deungi an apayo.', 'You need to sit properly or your back will hurt.', 4),
  (l_id, '수진', '구부정가 되는 편인데... 습관이 된 것 같아요.', 'Gubujeongi doeneun peoninde... Seupgwani doen geot gatayo.', 'I tend to slouch... I think it has become a habit.', 5),
  (l_id, '민호', '저도 컴퓨터 앞에 오래 않아 있으면 허리가 아파요.', 'Jeodo keompyuteo apee oreae anjaisseumyeon heori-ga apayo.', 'If I sit in front of a computer for a long time my lower back also hurts.', 6),
  (l_id, '수진', '좌실 페편인 의자를 사는 게 좋을 것 같아요.', 'Jwal pyeonan ujijareul saneun ge joeul geot gatayo.', 'I think it would be good to buy a comfortable work chair.', 7),
  (l_id, '민호', '맞아요. 건강에 투자하는 거니까요!', 'Majeyo. Geon-gang-e tujahaneun geornikayo!', 'That is right. It is an investment in your health!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''의자'' means:', '["floor", "sofa", "chair", "cushion"]', 2, '의자 means chair.', 1),
  (l_id, 'How do you say ''to sit on the sofa''?', '["소파가 않아요", "소파를 않아요", "소파에 않아요", "소파만 않아요"]', 2, '에 marks location for sitting: 소파에 않아요.', 2),
  (l_id, '''자세'' means:', '["seat", "chair", "height", "posture"]', 3, '자세 means posture or position.', 3),
  (l_id, 'Which phrase means ''Please do not cross your legs''?', '["다리를 높이 올리지 마세요", "궐시지 묶지 마세요", "다리를 펼지 마세요", "다리를 접지 마세요"]', 1, '교시지 묶다 means to cross one''s legs. 궐시지 묶지 마세요 = please don''t cross your legs.', 4),
  (l_id, '''바르게 않다'' means:', '["to sit slowly", "to sit straight", "to sit down", "to sit on the floor"]', 1, '바르게 = properly/straight, 않다 = to sit. Together: to sit up straight.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 컴퓨터 앞에 오래 않아 있는다. 강의를 듣거나 작업을 할 때 의자에 않아서 일한다. 하지만 항상 바른 자세로 않아 있지는 않다. 구부정이 되어 등과 허리가 아프다. 바른 자세로 않으려면 노력이 필요하다. 일정 시간마다 일어나서 스트레칬을 하는 것이 건강에 좋다.', 'Every day I sit in front of a computer for a long time. When listening to lectures or doing work I sit in a chair. However I do not always sit with good posture. I hunch over and my back and lower back hurt. It takes effort to sit up straight. It is good for your health to stand up and stretch at regular intervals.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 23;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '누운다', 'nuunda', 'to lie down', 1),
  (l_id, '침대', 'chimdae', 'bed', 2),
  (l_id, '백냪', 'baengnaem', 'cheek (on pillow)', 3),
  (l_id, '베개', 'bege', 'pillow', 4),
  (l_id, '이불', 'ibul', 'blanket', 5),
  (l_id, '누워서 쉽다', 'nuweoseo swida', 'to rest lying down', 6),
  (l_id, '여pEun 자세', 'yeop-eun jase', 'side-lying position', 7),
  (l_id, '둑대 누운다', 'deungdae nuunda', 'to lie on one''s back', 8),
  (l_id, '엠드로 누운다', 'eomdeuro nuunda', 'to lie face down', 9),
  (l_id, '잠이 들다', 'jami deulda', 'to fall asleep', 10),
  (l_id, '일어나다', 'ireonaDA', 'to get up', 11),
  (l_id, '송두리를 되다', 'songdurijyo doeuda', 'to toss and turn', 12),
  (l_id, '휘다', 'hwida', 'to rest', 13),
  (l_id, '휴식하다', 'hwiusikhada', 'to take a rest', 14),
  (l_id, '눈을 감다', 'nuneul gamda', 'to close one''s eyes', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '누워서 — lying down and doing something', '[동사 어간에서] + 다른 동사', '어서 connects two actions where the first sets the condition. 누워서 means while/after lying down.', '[{"korean": "누워서 취대폰을 바닥에 놓았어요.", "english": "I put the phone down while lying down."}, {"korean": "누워서 첵을 읽어요.", "english": "I read lying down."}, {"korean": "누워서 음악을 들어요.", "english": "I listen to music lying down."}]', 1),
  (l_id, '못 — inability / not able to', '[동사] 컴포 알 못 + [동사]', '못 before a verb means cannot / was unable to. Common for saying you couldn''t sleep.', '[{"korean": "잠을 못 잤어요.", "english": "I cannot sleep."}, {"korean": "어제 잠을 못 잘 잤어요.", "english": "I could not sleep well last night."}, {"korean": "회의 때문에 누울 수가 없어요.", "english": "I cannot lie down because of a meeting."}]', 2),
  (l_id, '고 싶다 — wanting to do something', '[동사어간] + 고 싶다', '고 싶다 expresses desire to do an action. Very common in everyday speech.', '[{"korean": "누운 거 싶어요.", "english": "I want to lie down."}, {"korean": "집에 가서 쉽고 싶어요.", "english": "I want to go home and rest."}, {"korean": "침대에 누워서 첵을 읽고 싶어요.", "english": "I want to lie in bed and read."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '안색이 안 충다. 좋은 내 누워야 게어.', 'Ansaegi an joheunda. Jom nae nuwooyagaeyo.', 'I don''t feel well. I think I need to lie down for a bit.', 1),
  (l_id, '민호', '어디가 안 좋아요? 몸에 열 나는 거 아니에요?', 'Eodigga an joayo? Mome yeol naneun geo anieyo?', 'Are you feeling unwell? Do you not have a fever?', 2),
  (l_id, '수진', '조금 피곳해요. 어제 끐몹 녹치가 없어서요.', 'Jogeum pigotaeyo. Eoje kkak jam-eul mot jaseoyo.', 'I am a bit tired. I could not sleep soundly last night.', 3),
  (l_id, '민호', '이력을 누워서 쉽어요. 를 가져다 드릴게요.', 'Ireok nuweoseo sweoyo. Ibuleul gajyeoda deurilgeyo.', 'Lie down here and rest. I will bring you a blanket.', 4),
  (l_id, '수진', '고마워요. 베개도 하나 주실 수 있어요?', 'Gomawoyo. Begedo hana jusilsu isseoyo?', 'Thank you. Can you give me a pillow too?', 5),
  (l_id, '민호', '물론이죠. 늘 연락해요.', 'Mullonikyo. Nul yeonrakaeyo.', 'Of course. Keep me posted.', 6),
  (l_id, '수진', '쿐 었들 눈 감고 있을게요. 조금 있다가 일어나도로 할게요.', 'Jwi-eotdeul nun gamgo issulgeyo. Jogeum itdaga ireona도록 halgeyo.', 'I will keep my eyes closed for a bit. I will get up after resting a while.', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''침대'' means:', '["sofa", "blanket", "bed", "pillow"]', 2, '침대 means bed.', 1),
  (l_id, 'Which word means ''to fall asleep''?', '["일어나다", "누운다", "잠이 들다", "눈을 감다"]', 2, '잠이 들다 means to fall asleep. 일어나다 = to get up.', 2),
  (l_id, 'How do you say ''I cannot sleep''?', '["잠이 없어요", "잠을 못 잤어요", "잠이 조아요", "잠을 안 자요"]', 1, '못 before the verb means cannot: 잠을 못 잤어요 = I cannot sleep.', 3),
  (l_id, '''베개'' means:', '["bed", "blanket", "pillow", "mattress"]', 2, '베개 means pillow.', 4),
  (l_id, '''I want to lie down'' in Korean:', '["누웠어요", "누운 거예요", "눕고 싶어요", "눕지 마세요"]', 2, '고 싶다 = want to do. 눈께 싶어요 is not natural; 눔고 싶어요 = I want to lie down.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '했일 내내 일하면 머리가 아프고 누운 것이 싶다. 침대에 누워서 베개를 풍안고 눈을 감는 순간이 하루에서 제일 행복한 순간이다. 잠을 잘 자야 다음 날 피곳하지 않다. 잠자리에 들기 전에 핸드폰을 보지 않는 것이 좋고, 시원하게 워질 수 있는 절한 방을 만드는 것이 좋다.', 'After working all day my head hurts and I want to lie down. The moment of lying in bed hugging a pillow and closing my eyes is the happiest moment of the day. Sleeping well means you won''t feel tired the next day. It is good not to look at your phone before going to bed, and it is best to make the room dark and cool so you can sleep comfortably.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 24;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '서다', 'seoda', 'to stand', 1),
  (l_id, '일어나다', 'ireonaDA', 'to stand up / get up', 2),
  (l_id, '줄 서다', 'jul seoda', 'to queue / stand in line', 3),
  (l_id, '줄', 'jul', 'line / queue', 4),
  (l_id, '기다리다', 'gidarida', 'to wait', 5),
  (l_id, '얼마나 오래', 'eolmana orae', 'how long', 6),
  (l_id, '차레', 'chare', 'turn / order', 7),
  (l_id, '네 차레', 'nae chare', 'my turn', 8),
  (l_id, '잇는편', 'itnunpyeon', 'the side that has it / nearby', 9),
  (l_id, '어기어다', 'eogieoDAE', 'to stand sideways', 10),
  (l_id, '발이 아프다', 'bari apuda', 'to have sore feet', 11),
  (l_id, '하이힐', 'haihin', 'high heels', 12),
  (l_id, '편한 신발', 'pyeonhan sinbal', 'comfortable shoes', 13),
  (l_id, '움직이지 않다', 'umjigiji anta', 'not to move', 14),
  (l_id, '바로 서다', 'baro seoda', 'to stand straight', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '에 서다 — standing somewhere', '[장소] + 에 서다', '에 marks location with the verb 서다 (to stand). Same location particle as 않다.', '[{"korean": "버스 정류장에 서 있어요.", "english": "I am standing at the bus stop."}, {"korean": "비 다에 서 있어요.", "english": "I am standing in the rain."}, {"korean": "카폠터 앞에 서 있어요.", "english": "I am standing in front of the counter."}]', 1),
  (l_id, '머 있다 vs 있다 — progressive / static', '[동사 어간] + 고 있다', '어간 + 고 있다 describes an ongoing or current state. Use 서 있다 for standing (ongoing state).', '[{"korean": "업직에 서 있어요.", "english": "I am standing at work."}, {"korean": "잠시 서 있어요.", "english": "I am standing for a moment."}, {"korean": "내 차레를 기다리면서 서 있어요.", "english": "I am standing waiting for my turn."}]', 2),
  (l_id, '얼마나 오래 — asking how long', '[얼마나 오래] + [동사어간] + 았어요/어요?', '얼마나 오래 asks how long a state or action has continued.', '[{"korean": "얼마나 오래 서 있어요?", "english": "How long have you been standing?"}, {"korean": "얼마나 기다렸어요?", "english": "How long did you wait?"}, {"korean": "한 시간 동안 줄 서 있었어요.", "english": "I stood in line for one hour."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이 줄 얼마나 길어요?', 'I jul eolmana gireoyeo?', 'How long is this line?', 1),
  (l_id, '민호', '한 시간은 놌 되는 것 같아요. 어제도 온 사람들이 많더라고요.', 'Han sigan-eun noh doeneun geot gatayo. Eojedo on saramdeuri manh-deoragoyo.', 'It seems like it will take about an hour. I heard there were a lot of people yesterday too.', 2),
  (l_id, '수진', '하이힐을 신고 왔는데 벌서 발이 아파요.', 'Haihineul singo wadeunde byeolsseo bari apayo.', 'I came in heels and my feet already hurt.', 3),
  (l_id, '민호', '다음에 편한 신발 신고 와요. 줄 서는 날에는 와그도 든도 맣어요.', 'Daeume pyeonhan sinbal singo wayo. Jul seoneun nare-neun wagodo deutdo matnayo.', 'Next time wear comfortable shoes. Flats are better for days when you have to stand in line.', 4),
  (l_id, '수진', '맞아요. 그렬데 온김에 자리를 놓치고 싶지 않아요.', 'Majeyo. Geureonde omgimeul jarirul notchigo sipji aneyo.', 'True. But I do not want to lose my spot while moving.', 5),
  (l_id, '민호', '왜 잠시 않은데 제가 대신 서 드릴게요.', 'Wae jamsi anjunde jega daesin seo deurilgeyo.', 'Why don''t you sit for a bit and I will stand in your place.', 6),
  (l_id, '수진', '정말요? 너무 고마워요. 조금만 쉽다 다시 소어를게요.', 'Jeongmaryo? Neomu gomawoyo. Jogeumman swida dasi seoulgeyo.', 'Really? Thank you so much. I will rest for a moment and come back.', 7),
  (l_id, '민호', '천천히 오세요!', 'Cheoncheonhi oseyo!', 'Take your time!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''줄 서다'' means:', '["to stand up", "to stand in line", "to stand straight", "to wait standing"]', 1, '줄 = queue/line, 서다 = to stand. Together: to stand in line / queue.', 1),
  (l_id, 'How do you say ''I am standing at the bus stop''?', '["버스 정류장에 서 있어요", "버스 정류장을 서 있어요", "버스 정류장에서 서 있어요", "버스 정류장 서 있어요"]', 0, '버스 정류장에 서 있어요. 에 marks the place of standing.', 2),
  (l_id, '''차레'' means:', '["line", "floor", "turn / order", "side"]', 2, '차레 means turn or order in a sequence.', 3),
  (l_id, '''발이 아프다'' means:', '["to have a stomachache", "to have sore feet", "to have a headache", "to be dizzy"]', 1, '발이 아프다: 발 = feet, 아프다 = to hurt. Sore feet.', 4),
  (l_id, 'Which word means ''to wait''?', '["잠다", "서다", "기다리다", "쉬다"]', 2, '기다리다 means to wait.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '인기 있는 식당에서 쓰려면 주말에 오래 줄을 서야 한다. 준비를 잘 하고 편한 신발을 신을 것을 권한다. 오래 서 있으면 발과 허리가 아프다. 주위 사람들과 업도 수 있고, 자신의 차례를 조용히 기다리자. 다음 차례는 반드시 온다.', 'To eat at a popular restaurant you often have to stand in a long queue on weekends. It is recommended to prepare well and wear comfortable shoes. Standing for a long time makes your feet and lower back hurt. You can also chat with the people around you and quietly wait your turn. Your turn will definitely come.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 25;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '듣다', 'deutda', 'to listen / to hear', 1),
  (l_id, '소리', 'sori', 'sound / noise', 2),
  (l_id, '음악', 'eumak', 'music', 3),
  (l_id, '도우미', 'doumi', 'help / aid', 4),
  (l_id, '이어폰', 'ieopen', 'earphones', 5),
  (l_id, '헤드폰', 'heodeupon', 'headphones', 6),
  (l_id, '라디오', 'radio', 'radio', 7),
  (l_id, '방송', 'bangSong', 'broadcast / program', 8),
  (l_id, '소문', 'somun', 'rumor', 9),
  (l_id, '소음', 'soeum', 'noise', 10),
  (l_id, '조용하다', 'joyonghada', 'to be quiet', 11),
  (l_id, '탐소하다', 'tambosahada', 'to detect / to discover', 12),
  (l_id, '듣리다', 'deutrida', 'to let someone hear / to play sound for', 13),
  (l_id, '춸를년다', 'cheumeul chuDA', 'to pick up the tempo', 14),
  (l_id, '볼륨', 'bollyum', 'volume', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '듣는 것 같다 — seems like I hear', '[동사 어간] + (는) 것 같다', '는 것 같다 means it seems like / I think. Use it when you are not certain about what you hear.', '[{"korean": "아무도 없는 것 같아요.", "english": "It seems like there is nobody."}, {"korean": "실왜로 듣리는 것 같아요.", "english": "It seems like I really hear it."}, {"korean": "밖에서 소리가 나는 것 같아요.", "english": "It seems like there is a sound from outside."}]', 1),
  (l_id, '를/을 듣다 — listening to something', '[음악/소리] + 를/을 듣다', '듣다 takes an object with 을 (after consonant) or 를 (after vowel).', '[{"korean": "음악을 듣어요.", "english": "I listen to music."}, {"korean": "뉴스를 듣어요.", "english": "I listen to the news."}, {"korean": "강의를 듣어요.", "english": "I listen to a lecture."}]', 2),
  (l_id, '며 — while doing (simultaneous actions)', '[동사 어간] + 면서', '면서 means while doing two things at the same time. Common with listening + another activity.', '[{"korean": "음악을 들으면서 읽어요.", "english": "I read while listening to music."}, {"korean": "라디오를 들으면서 어딩어요.", "english": "I clean while listening to the radio."}, {"korean": "포드캐스트를 들으면서 운동을 해요.", "english": "I exercise while listening to a podcast."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 볼륨을 너무 크게 들어요.', 'Oneul bollyumeul neomu keuge deureoyo.', 'You are listening at too high a volume today.', 1),
  (l_id, '민호', '죣떤한가요? 이어폰을 끌고 들어서 소리가 새나가는 줄 말랑어요.', 'Jareotdena? Ieoponro deureo so-ri-ga saenanaganeun jul mollasseoyo.', 'I did not realize? I was listening with earphones and did not know the sound was leaking.', 2),
  (l_id, '수진', '가끔 이어폰에서 나오는 소리가 들려요.', 'Gakkeum ieponeseo naoneun soriya deulyeoyo.', 'Sometimes the sound coming from the earphones is audible.', 3),
  (l_id, '민호', '다른 음악을 들어야걌네요. 요즘 언제나 헤드폰으로 듣는데 나끟가요.', 'Dareun eumageul deuryagaetneyo. Yojeum eonjena heodueponuro deutneunde nasseulkka?', 'I should listen to different music. I always use headphones lately, is that bad?', 4),
  (l_id, '수진', '너무 크게 오래 들으면 청력에 안 좋다고 해요.', 'Neomu keuge oreae deureumyeon cheongnyage an jotago haeyo.', 'They say listening at too high a volume for a long time is not good for your hearing.', 5),
  (l_id, '민호', '알갘어요. 밐류를 낮춰야겠어요.', 'Algesseoyo. Bollyumeul nachuoyagesseoyo.', 'I see. I should turn down the volume.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''듣다'' means:', '["to see", "to listen / hear", "to speak", "to touch"]', 1, '듣다 means to listen or hear.', 1),
  (l_id, 'Which word means ''volume''?', '["볼륨", "소음", "소리", "라디오"]', 0, '볼륨 means volume (audio).', 2),
  (l_id, 'Object particle with ''음악''(music):', '["이", "을", "로", "가"]', 1, '음악 ends in consonant, so the object particle is 을. 음악을 듣어요.', 3),
  (l_id, 'Which verb means ''to broadcast''?', '["소문", "방송하다", "듣다", "소음"]', 1, '방송하다 means to broadcast. 방송 alone = broadcast/program.', 4),
  (l_id, '''I listen to music while reading'' uses which grammar?', '["듣고", "들어서", "들으면서", "들으니까"]', 2, '면서 expresses two simultaneous actions: 음악을 들으면서 읽어요.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '나는 매일 수승버스 안에서 음악을 듣는다. 시끄러운 도시에서도 이어폰을 끄면 나만의 세계로 들어갈 수 있다. 특히 슬픈 날에는 편안한 노래를 듣으면 마음이 편안해진다. 나는 라디오 도 좋아하는데, 아침에 커피를 마시면서 라디오를 듣는 것이 하루를 시작하는 나만의 의식이다.', 'Every day I listen to music on the bus. Even in a noisy city if you put in your earphones you can enter your own world. Especially on sad days listening to a comfortable song makes the heart feel at ease. I also like the radio and listening to the radio while drinking coffee in the morning is my own ritual to start the day.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 26;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '보다', 'boda', 'to see / to look / to watch', 1),
  (l_id, '눈', 'nun', 'eye', 2),
  (l_id, '영화', 'yeonghwa', 'movie', 3),
  (l_id, '텔레비전', 'tellebijeon', 'television', 4),
  (l_id, '드라마', 'drama', 'drama / TV show', 5),
  (l_id, '구경하다', 'gugyeong-hada', 'to look around / sightsee', 6),
  (l_id, '뜐다보다', 'deuryeodaboda', 'to look down', 7),
  (l_id, '올려다보다', 'olryeodaboda', 'to look up', 8),
  (l_id, '찾다보다', 'chajadaboda', 'to look for / to consult', 9),
  (l_id, '시선', 'siseon', 'gaze / line of sight', 10),
  (l_id, '새먹다', 'saeomgeuda', 'to dawn / to stare', 11),
  (l_id, '릤퓸다', 'miyulhada', 'to browse', 12),
  (l_id, '관심을 갖다', 'gwansimeul gatda', 'to take interest in', 13),
  (l_id, '속이다', 'sogida', 'to be deceived / to be fooled by eyes', 14),
  (l_id, '눈금 치다', 'eumgeum chida', 'to catch the eye', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '를/을 보다 — watching something', '[대상] + 를/을 보다', '보다 covers seeing, watching, and looking. Object particle 를 (after vowel) or 을 (after consonant).', '[{"korean": "영화를 보요.", "english": "I watch a movie."}, {"korean": "드라마를 보요.", "english": "I watch a drama."}, {"korean": "텔레비전을 보요.", "english": "I watch television."}]', 1),
  (l_id, '고 나서 — after finishing', '[동사어간] + 고 나서', '고 나서 means after finishing doing something. Common when describing what you do after watching a movie.', '[{"korean": "영화를 보고 나서 식사를 했어요.", "english": "After watching the movie I had a meal."}, {"korean": "드라마를 보고 나서 노래를 찾았어요.", "english": "After watching the drama I searched for the song."}, {"korean": "요리 영상을 보고 나서 만들어 봐요.", "english": "After watching the cooking video I tried making it."}]', 2),
  (l_id, '이/가 눈에 맞다 — to catch the eye', '[주어] + 이/가 눈에 맣다', '눈에 맣다 is an idiomatic expression meaning something catches your eye.', '[{"korean": "노란 옷이 눈에 맣았어요.", "english": "The yellow clothes caught my eye."}, {"korean": "저 완구가 눈에 맣았어요.", "english": "That toy caught my eye."}, {"korean": "최신 폰이 눈에 맣았어요.", "english": "The latest phone caught my eye."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 백화점에 가서 구경할 거예요?', 'Oneul baekwajeoMe gaseO gUgyeong hal geoyeyo?', 'Are you going to the department store to look around today?', 1),
  (l_id, '민호', '네, 줍 바눌 각도 있고 구경도 할 걸요.', 'Ne, jab badwulkakdo itgo gukyeong do halgeyo.', 'Yes, I need to change shoes and also want to browse.', 2),
  (l_id, '수진', '저도 같이 가도 될까요? 눈에 맣는 것이 있으면 사고 싶어요.', 'Jeodo gachi gado doelkkayo? Nune matneun geosi isseumyeon sago sipeoyo.', 'May I come with you? If something catches my eye I want to buy it.', 3),
  (l_id, '민호', '제가 왼쪽 보면 수진 씨는 오른쪽 진열대를 보세요.', 'Jega oen-jjok bomyeon Sujin ssineun oreunjjok jinnyeoldaereul boseyo.', 'If I look left you look at the right display.', 4),
  (l_id, '수진', '하하, 심치합시다. 그럼 시작하죠.', 'Haha, simchihapsida. Geurom sijakrayo.', 'Haha, it is a plan. Then let us start.', 5),
  (l_id, '민호', '아! 저기 젊마가 눈에 맣어요. 한번 보요.', 'A! Jeogi jeonga-ga nune matteoyo. Hanbeom bwayo.', 'Oh! That coat catches my eye over there. Let us take a look.', 6),
  (l_id, '수진', '어디서요? 저도 보여 주세요.', 'Eodieseo-yo? Jeodo boyeo juseyo.', 'Where? Show me too.', 7),
  (l_id, '민호', '저기! 매장에 전시된 검은 코트요. 너무 예쁜 것 같아요!', 'Jeogi! Maejange jeonsi-doen geomeun koteu-yo. Neomu yeppeun geot gatayo!', 'There! The black coat on display in the store. It looks so pretty!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''보다'' means:', '["to hear", "to see / look / watch", "to speak", "to touch"]', 1, '보다 covers seeing, watching, and looking.', 1),
  (l_id, 'Which word means ''movie''?', '["수력", "드라마", "영화", "방송"]', 2, '영화 means movie.', 2),
  (l_id, '''After watching the drama'' uses which grammar?', '["드라마를 보면서", "드라마를 보고 나서", "드라마를 봤는데", "드라마 보기"]', 1, '고 나서 means after finishing an action.', 3),
  (l_id, '''눈에 맣다'' means:', '["to look at", "to catch the eye", "to be seen", "to miss seeing"]', 1, '눈에 맣다 = to catch the eye (idiom).', 4),
  (l_id, 'Object particle with ''영화'' (movie):', '["이", "가", "를", "은"]', 2, '영화 ends in vowel, so use object particle 를. 영화를 보요.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '오늘 나는 친구와 함캐 영화를 보러 갔다. 영화를 보고 나서 차를 마시면서 영화 여포에 대해 많은 이야기를 나눠다. 나는 특히 드라마를 좋아하는데, 용끔에 드라마를 보다 보면 다음 회가 인급돼 자얼 도 못 다. 나는 드라마를 보면서 언어도 배운다. 드라마 대사를 따라 하면서 한국어 발음이 늘어간다.', 'Today I went to watch a movie with a friend. After watching the movie we drank tea and talked a lot about the movie plot. I especially like dramas and when I start watching a drama at the weekend I cannot stop until the next episode. I also learn language from dramas. My Korean pronunciation improves by following drama dialogue.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 27;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '맛보다', 'matboda', 'to taste', 1),
  (l_id, '맛', '\mat', 'taste / flavor', 2),
  (l_id, '닜다', 'dinda', 'to be sweet (archaic/poetic); see below', 3),
  (l_id, '달다', 'dalda', 'to be sweet', 4),
  (l_id, '짜다', 'jjada', 'to be salty', 5),
  (l_id, '시다', 'sida', 'to be sour', 6),
  (l_id, '쓰다', 'sseuda', 'to be bitter', 7),
  (l_id, '매운하다', 'maewonhada', 'to be spicy', 8),
  (l_id, '고소하다', 'gosohada', 'to be nutty / savory', 9),
  (l_id, '답답하다', 'dapDaphada', 'to be bland', 10),
  (l_id, '신선하다', 'sinSeonhada', 'to be fresh', 11),
  (l_id, '에쓰다', 'sseuDA', 'to be tasting / sampling', 12),
  (l_id, '음식을 맛보다', 'eumsigul matboda', 'to sample food', 13),
  (l_id, '향', 'hyang', 'aroma / fragrance', 14),
  (l_id, '십감', 'sikgam', 'texture of food', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '이/가 맛있다 — being delicious', '[음식이/가] + 맛있다', '맛있다 means delicious. The subject particle 이 (after consonant) or 가 (after vowel) marks what is delicious.', '[{"korean": "이 피자가 맛있어요.", "english": "This pizza is delicious."}, {"korean": "즱개가 맛있어요.", "english": "Jjigae is delicious."}, {"korean": "맛이 어때요?", "english": "How is the taste?"}]', 1),
  (l_id, 'Flavor adjectives: [adjective] + 지 않아요 — negation', '[형용사] + 지 않아요', '지 않다 negates adjectives. Use it to say food is not spicy, not sweet etc.', '[{"korean": "매운하지 않아요.", "english": "It is not spicy."}, {"korean": "짜지 않아요.", "english": "It is not salty."}, {"korean": "달지 않아요.", "english": "It is not sweet."}]', 2),
  (l_id, '어떻다 — asking for opinions', '[대상] + 이/가 어떨요?', '어떨요? asks how something is or what one thinks. Very natural for tasting context.', '[{"korean": "맛이 어떠세요?", "english": "How is the taste?"}, {"korean": "매운 맛이 어떠세요?", "english": "How is the spicy flavor?"}, {"korean": "스프가 어떠세요?", "english": "How is the soup?"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이 덮국수 진짜 맛있어 보이는데요.', 'I deokguksu jinjja massisseo boindeyo.', 'This radish noodle dish looks really delicious.', 1),
  (l_id, '민호', '한번 맛보세요. 저는 이미 두 번 먹었는데 아직도 맛있어요.', 'Hanbeom matboseyo. Jeoneun imi du beon meogeonneunde ajikdo massisseoyo.', 'Try a taste. I have already eaten it twice and it is still delicious.', 2),
  (l_id, '수진', '\ec (trying) 매운 맛이 조금 강하네요. 구쇈 목에 매운 것은 정말 칠 든다니까.', '(Trying) Maeun masi jogeum ganghaneyo. Geuse moge maeun geos-eun jeongmal chil deuniJikka.', '(Trying) The spicy flavor is a bit strong. Really gets your throat when you are not used to it.', 3),
  (l_id, '민호', '매운 것이 두려우면 이야 배달할 때 끟매맠 별으로 달라고 하세요.', 'Maeun geos-i duryeouMYeon iya baedal hal ttae deopmaeumyeon byeoro dallago haseyo.', 'If the spicy taste worries you, you can ask for it less spicy when ordering for delivery.', 4),
  (l_id, '수진', '움, 하지만 왜 짜고 달콤한 것이 같아요. 신가한 걸 보면 새론한 맡도 나고요.', 'Eum, hajiman wae jjago dalkmaseulhanhan geot gatayo. SinGahan geol bomyeon saerowhaneuneun matdo nago yo.', 'Hmm but it also seems strangely salty and sweet. Looking at the ingredients something fresh comes out too.', 5),
  (l_id, '민호', '그게 바로 참기름과 마늘 덮지름에서 나오는 향이에요.', 'Geuge baro chamgireum-gwa maneul radish-gireuMeseo naoneun hyangieyeo.', 'That is the aroma from sesame oil and garlic radish oil.', 6),
  (l_id, '수진', '신기하네요. 맛이 실제로 복잡하지만 중독성이 있다니긌.', 'Singihaneyo. Masi siljeero bokjapHajiman jungdokseongi itdanikka.', 'How interesting. The taste is complex but it is addictive.', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''맛보다'' means:', '["to eat", "to taste", "to smell", "to cook"]', 1, '맛보다 means to taste / to sample food.', 1),
  (l_id, 'Which adjective means ''spicy''?', '["달다", "쓰다", "짜다", "매운하다"]', 3, '매운하다 (or 매운) means spicy.', 2),
  (l_id, 'How to say ''this is not salty''?', '["짜요", "짜지 않아요", "짜서요", "짜고요"]', 1, '짜지 않아요 = is not salty. 지 않다 negates adjectives.', 3),
  (l_id, '''신선하다'' means:', '["to be sour", "to be fresh", "to be bitter", "to be bland"]', 1, '신선하다 means to be fresh.', 4),
  (l_id, '''맛이 어떠세요?'' means:', '["Do you like the taste?", "What taste is it?", "How is the taste?", "Is it delicious?"]', 2, '어떠세요 asks for an opinion or description: How is the taste?', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 음식은 다양한 맛이 있다. 매운 것, 짜은 것, 달콤한 것, 신 것 등 다양한 맛이 조화를 이룬다. 시장에서 파는 막갈비는 지짜위는 매콤하공 동시에 고소하다. 달콤한 디저트를 먹음으로써 스트레스를 풀어주는 사람도 있다. 한국 음식은 눈으로도, 코로로도, 족보도 맛있어야 한다.', 'Korean food has a variety of flavors. Spicy, salty, sweet, sour and many other flavors are combined in harmony. The tteokgalbi sold in the market is simultaneously spicy and savory. Some people relieve stress by eating sweet desserts. Korean food must be delicious not only with the eyes but also with the nose and tongue.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 28;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '만지다', 'manjida', 'to touch', 1),
  (l_id, '손', 'son', 'hand', 2),
  (l_id, '손가락', 'son-garak', 'finger', 3),
  (l_id, '부드럽다', 'budeuRopda', 'to be soft', 4),
  (l_id, '딸던하다', 'tteotteothada', 'to be warm', 5),
  (l_id, '차랙다', 'charipda', 'to be cold (to the touch)', 6),
  (l_id, '거칠다', 'geochalda', 'to be rough', 7),
  (l_id, '매낁매낁하다', 'meangmaeHangHada', 'to be smooth', 8),
  (l_id, '눤러지다', 'mullyeojida', 'to stretch / to flex', 9),
  (l_id, '직감', 'jikGam', 'texture / direct feeling', 10),
  (l_id, '감촉', 'gamchok', 'sense of touch', 11),
  (l_id, '만지지 마세요', 'manjiji maseyo', 'do not touch', 12),
  (l_id, '프냘하다', 'peunaenhada', 'to stroke gently', 13),
  (l_id, '두드리다', 'deudrida', 'to knock (door)', 14),
  (l_id, '패다', 'paeda', 'to pat / to knock', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '이/가 음/는 — describing texture', '[감촉 형용사] + [명사]', 'Korean adjectives directly modify nouns to describe texture. Add 은/는 in predicative position.', '[{"korean": "부드러운 변금이어요.", "english": "It is a soft blanket."}, {"korean": "거칠어요.", "english": "It is rough."}, {"korean": "매낁매낁해요.", "english": "It is smooth."}]', 1),
  (l_id, '만지지 마세요 — do not touch', '[동사어간] + 지 마세요', '지 마세요 is the polite negative imperative: do not do X.', '[{"korean": "만지지 마세요.", "english": "Do not touch."}, {"korean": "건들지 마세요.", "english": "Do not touch / hold (formally)."}, {"korean": "사진 지지 마세요.", "english": "Do not touch the photo."}]', 2),
  (l_id, '어떤 느낙이어요? — asking about sensation', '[noun] + 이/가 어떤 느낙이어요?', '느낙 means sensation or feeling. Use it to ask how something feels to the touch.', '[{"korean": "이 직물이 어때 느낙이어요?", "english": "How does this fabric feel?"}, {"korean": "매낁매낁한 느낙이어요.", "english": "It feels smooth."}, {"korean": "거칠고 따뜻하사요.", "english": "It is rough and warm."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이 잠살 직물 직감이 엄청나게 좋아요!', 'I jamsal jingmul jikgami eomcheongnage joayo!', 'The texture of this pajama fabric is incredibly good!', 1),
  (l_id, '민호', '정말요? 저도 만져 볼게요. 왜 이렇게 부드러워요?', 'Jeongmaryo? Jeodo manje bolgeyo. Wae ireoke budeureowoyo?', 'Really? Let me feel it too. Why is it so soft?', 2),
  (l_id, '수진', '스스로 쿕은 화스로 만든 것이래요. 거집맠 트리코 직물이얰.', 'Seu-seu-ro koteu-ro mandeulun geosirae. Geosimneun tricot material iyo.', 'They say it is made of natural cotton. It is a smooth tricot fabric.', 3),
  (l_id, '민호', '정말 매낁매낁해요. 제 피부도 민감하다 보다 더 부드러워요.', 'Jeongmal maengmaengaeyo. Je pibuDo mingamhada bomyeon deo budeureowoyo.', 'It is really smooth. Even compared to my sensitive skin it is softer.', 4),
  (l_id, '수진', '열 여름 람에 입으면 넥다고 전에 살다고 해요.', 'Yeol yeoreum bame ibeumyeon deopDago jeon-e salddago haeyo.', 'They say if you wear it on hot summer nights it is still cool.', 5),
  (l_id, '민호', '원루우 발열해지는 저는 반드시 사야겠어요.', 'Wollu balhyeolhaejineun jeoneun baDdusi saya gesseoyo.', 'I who get hot easily must definitely buy this.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''만지다'' means:', '["to smell", "to taste", "to touch", "to see"]', 2, '만지다 means to touch.', 1),
  (l_id, 'Which adjective means ''soft''?', '["거칠다", "차갑다", "부드럽다", "뻔하다"]', 2, '부드럽다 means to be soft.', 2),
  (l_id, '''Do not touch'' in Korean:', '["만지세요", "만지지 마세요", "만지고 마세요", "만지면 마세요"]', 1, '지 마세요 is the polite negative imperative.', 3),
  (l_id, '''직감'' means:', '["indirect feeling", "texture / direct feeling", "smell", "sight"]', 1, '직감 means texture or direct physical sensation.', 4),
  (l_id, 'How do you describe something rough?', '["부드러워요", "매끈매끈해요", "거칠어요", "뜨거워요"]', 2, '거칠다 / 거칠어요 means rough.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '만지는 감각은 일상에서 매우 중요하다. 새울은 옰 직물을 손으로 만지면서 부드러운 느낙을 감다. 건형 매장에서는 직접 잡아보고 직감을 확인한 수 있다. 벽겨는 로션은 피부에 닿을 때 매낁매낁한 느낙이 끌척하다. 감촉을 통해 우리는 세상을 더 직접적으로 경험한다.', 'The sense of touch is very important in daily life. When touching freshly washed clothing with the hands you feel the softness. At a clothing store you can pick things up and check the texture directly. Lotion applied to the skin leaves a pleasing smooth feeling. Through touch we experience the world more directly.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 29;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '걷다', 'geotda', 'to walk', 1),
  (l_id, '달리다', 'dallida', 'to run', 2),
  (l_id, '산책', 'sancheo', 'a walk / stroll', 3),
  (l_id, '산책하다', 'sanchaehada', 'to take a walk', 4),
  (l_id, '코스', 'koseu', 'course / route', 5),
  (l_id, '보도', 'bodo', 'sidewalk / pavement', 6),
  (l_id, '공원', 'gongwon', 'park', 7),
  (l_id, '언덕', 'eondeok', 'hill', 8),
  (l_id, '걸음 수', 'geo-eum-su', 'step count', 9),
  (l_id, '괴도', 'gwedo', 'track / path', 10),
  (l_id, '운동화', 'unDonghwa', 'exercise shoes / sneakers', 11),
  (l_id, '운동', 'undong', 'exercise', 12),
  (l_id, '속도', 'sokdo', 'speed / pace', 13),
  (l_id, '호흡', 'hohUm', 'breathing', 14),
  (l_id, '스트레칬을 하다', 'seuteurecheol hada', 'to stretch', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '러 가다 — going for a purpose', '[동사어간 / 명사] + 러/으러 가다', '러/으러 가다 expresses going somewhere for the purpose of doing something. Use 러 after vowel stems, 으러 after consonant stems.', '[{"korean": "산책하러 공원에 갈 거예요.", "english": "I will go to the park to take a walk."}, {"korean": "운동하러 헬스장에 가요.", "english": "I go to the gym to exercise."}, {"korean": "달리러 운동장에 가요.", "english": "I go to the track to run."}]', 1),
  (l_id, '마다 — every', '[시간/장소] + 마다', '마다 attached to time or frequency nouns means every. Essential for talking about exercise habits.', '[{"korean": "매일 아침마다 산책을 해요.", "english": "I take a walk every morning."}, {"korean": "주말마다 한 시간씩 걸어요.", "english": "Every weekend I walk for one hour."}, {"korean": "저녁마다 공원에 가요.", "english": "I go to the park every evening."}]', 2),
  (l_id, '후에 — after doing', '[동사어간] + 후에', '동사 어간 + 후에 means after doing something. Useful for post-walk routines.', '[{"korean": "걷고 난 후에 스트레칬을 해요.", "english": "After walking I do stretches."}, {"korean": "운동한 후에 단백질을 먹어요.", "english": "After exercising I eat protein."}, {"korean": "실내에서 나온 후에 스트레칬을 해요.", "english": "After coming outside I stretch."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 걷기 코스가 어떤가요?', 'Oneul geotgi Koseuga eotteonGayo?', 'What is today''s walking route like?', 1),
  (l_id, '민호', '공원 두 바퀴 돌고 뒤 언덕까지 올라가는 코스어요. 약 5km 정도어요.', 'Gongwon du baquie dolgo dwi eondeokkaji ollaga-neun koseuyeyo. Yak 5km jeongdoyeyo.', 'It is the course that goes around the park twice and up the hill behind. About 5km.', 2),
  (l_id, '수진', '언덕? 조금 힙든 운동도 되겠네요.', 'Eondeok? Jogeum himdeun undongdo Doitgaetneyo.', 'The hill? That would also be a bit challenging workout.', 3),
  (l_id, '민호', '언덕 올라가면 호흡이 늘고 기분이 좋아요. 선활할 때 추쳪해요.', 'Eondeok ollagamyeon hohumi neulggo gibuni joayo. Seon-hwal hal ttae chucheonhaeyo.', 'When you go up the hill your breathing increases and it feels good. I recommend it when you want to feel invigorated.', 4),
  (l_id, '수진', '오늘 링 단연도 하고 싶다고 생각했는데 때마침 때니 왜 운동화만 챙겨 왔죠!', 'Oneul ring danYeonDo hago sipda-go saengGakhaetneunde ttaemacim matni wae unDonghwaman chenggyeo wotJyo!', 'I thought I wanted to do some interval runs today and here you are with just your sneakers!', 5),
  (l_id, '민호', '오뿐에 운동화가 있어요. 줄 서 전에 스트레칬만 조금 하고 시작할게요.', 'Okaen unDonghwaga isseoyo. Jul seo jeon-e seuteurecheolman Jogeum hago sijakhalgeyo.', 'I have sneakers in my bag. Before we start let us do some stretches.', 6),
  (l_id, '수진', '좋아요. 준비 운동 시작하죠!', 'Joayo. Junbi undong SijakHayo!', 'Good. Let us start the warm-up!', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''산책하다'' means:', '["to run", "to take a walk", "to exercise", "to hike"]', 1, '산책하다 means to take a walk or stroll.', 1),
  (l_id, '''I go to the park to walk'' uses:', '["걷고 공원에 가요", "걷어서 공원에 가요", "걸으러 공원에 가요", "걷는 공원에 가요"]', 2, '러/으러 가다 = going for the purpose of. 걸으러 공원에 가요.', 2),
  (l_id, '''보도'' means:', '["park", "hill", "sidewalk", "track"]', 2, '보도 means sidewalk or pavement.', 3),
  (l_id, 'How to say ''every morning'':', '["아침에", "매일 아침마다", "아침을", "아침까지"]', 1, '매일 아침마다 = every morning.', 4),
  (l_id, '''스트레칬을 하다'' means:', '["to exercise", "to stretch", "to run", "to breathe"]', 1, '스트레칬을 하다 means to stretch.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '매일 아침에 산책을 하면 머리가 맑아지고 한다도 상쿨해진다. 공원에서 나무 사이를 걷다 보면 신선한 공기를 마실 수 있다. 편한 운동화를 신고 소남한 소지품을 모두 집에 두고 가는 것이 좋다. 걼음 수를 확인하면서 목표를 세우면 걷기가 더 즈거워진다. 산책은 맸멸 고령장에도 바람직한 운동이다.', 'Taking a walk every morning clears the head and relieves stress. Walking through the trees in a park lets you breathe fresh air. It is good to wear comfortable sneakers and leave all small belongings at home. Setting a step goal while checking your count makes walking more fun. Walking is a recommended exercise even for the elderly.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 30;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '결혼', 'gyeolhon', 'marriage / wedding', 1),
  (l_id, '결혼하다', 'gyeolhonhada', 'to get married', 2),
  (l_id, '신랑', 'sinlang', 'groom', 3),
  (l_id, '신부', 'sinbu', 'bride', 4),
  (l_id, '주례식', 'julyesik', 'wedding procession', 5),
  (l_id, '웨딩 드레스', 'weding deuReseu', 'wedding dress', 6),
  (l_id, '웨딩 케이크', 'weding keik', 'wedding cake', 7),
  (l_id, '첨단식장', 'cheomDanSikJang', 'wedding hall', 8),
  (l_id, '하게하다', 'hagaeHaDa', 'to do a wedding ceremony (incorrect — corrected below)', 9),
  (l_id, '예당', 'yeDAng', 'budget', 10),
  (l_id, '신혼여행', 'sinHonYeoHaeng', 'honeymoon', 11),
  (l_id, '축의하다', 'chugeuihada', 'to congratulate', 12),
  (l_id, '축하하다', 'chukhahada', 'to celebrate / to wish congratulations', 13),
  (l_id, '혼례식', 'honlyesik', 'wedding ceremony', 14),
  (l_id, '축지', 'chukJi', 'blessing', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '~()을/를 걸치다 — getting married to somebody', '[눈리]과/와 결혼하다', '결혼하다 is to get married. To say who you marry, use 과 (after consonant) or 와 (after vowel) followed by 결혼하다.', '[{"korean": "전 남자친구와 결혼했어요.", "english": "I married my ex-boyfriend."}, {"korean": "좋아하는 사람과 결혼하고 싶어요.", "english": "I want to marry someone I love."}, {"korean": "둘이 결혼했어요.", "english": "They got married."}]', 1),
  (l_id, '언제 결혼할 거예요? — future with 여', '[동사어간] + (으)니까 / 결혼할 거예요', '동사 + 으/들 거예요 expresses future intention. Common in conversations about marriage plans.', '[{"korean": "년말에 결혼할 거예요.", "english": "I will get married next year."}, {"korean": "아직 결혼 계획이 없어요.", "english": "I do not have plans to get married yet."}, {"korean": "언제 결혼할 거예요?", "english": "When will you get married?"}]', 2),
  (l_id, '축하해 주다 — offering congratulations', '[맨쿨] + 에게 + 축하해 주다', '축하하다 means to congratulate. Adding 주다 makes it an act of giving. The indirect object uses 에게.', '[{"korean": "두 분까게 축하하드립니다.", "english": "I sincerely congratulate you both."}, {"korean": "신부신랑게 축하해 주세요.", "english": "Please congratulate the bride and groom."}, {"korean": "결혼 축하해요!", "english": "Congratulations on the wedding!"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '진짜요? 나다 결혼한다고요?', 'JinJja-yo? nada gyeolhonhanda-goyo?', 'Really? You say you are getting married?', 1),
  (l_id, '민호', '네! 내년 봄에 혼레식을 할 거예요. 아직 믿겨지다는 게 신기하지만요.', 'Ne! Naenyeon bom-e honlyesigeul hal geoyeyo. Ajik mitgyeojinda-neun ge singihajiman-yo.', 'Yes! I am going to have the wedding ceremony in spring next year. It still seems unreal.', 2),
  (l_id, '수진', '두 분껼 축하한다요! 새발물릴는 어디서 하실 거예요?', 'Du bun-gge chukHaHanDayo! Honlyesigeun eodiseo haSil geoyeyo?', 'Congratulations to you both! Where will the wedding be held?', 3),
  (l_id, '민호', '시청 근첮 청단 식장에서 할 거예요. 사실 예산이 제일 문제얰요.', 'Sicheong geuncheo cheomdan sikjang-eseo hal geoyeyo. Sasil yesani jeil munjeYo.', 'It will be at a modern wedding hall near City Hall. Honestly the budget is the biggest problem.', 4),
  (l_id, '수진', '이해해요. 요즘 혼레마다 비용이 많이 드니까요.', 'IHaeHaeyo. Yojeum honlyemada biyong-i mani deunikayo.', 'I understand. These days every wedding costs a lot.', 5),
  (l_id, '민호', '신혼여행은 유럽으로 갈 예정이얰요. 직접 다 찾아됲아죠.', 'SinHonYeoHaengeun Yureop-euro gal yejeongieyeyo. Jikjeop da chatadassayo.', 'The honeymoon plan is to go to Europe. We found everything ourselves.', 6),
  (l_id, '수진', '욤~, 정말 로마맹퍽하다. 행복하게 습니다!', 'Eum, jeongmal RomantikHaDa. HaengBokHage사~!', 'Wow, really romantic. Be happy!', 7),
  (l_id, '민호', '고마워요. 당신도 고백하는 날 오곊요!', 'Gomawoyo. Dangsinedo gobaek-haneun nal olggeyo!', 'Thank you. I will come to see your confession day too!', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''신부'' means:', '["groom", "bride", "wedding hall", "ceremony"]', 1, '신부 means bride. 신랑 means groom.', 1),
  (l_id, '''They got married'' in Korean:', '["둘이 결혼했어요", "둘이 결혼해요", "둘이 결혼하려고요", "둘이 결혼할 거예요"]', 0, '결혼했어요 is the past tense of 결혼하다.', 2),
  (l_id, '''혼레식'' means:', '["honeymoon", "wedding ceremony", "wedding dress", "wedding cake"]', 1, '혼례식 means wedding ceremony.', 3),
  (l_id, 'Which word means ''honeymoon''?', '["결혼", "축하하다", "신혼여행", "혼례식"]', 2, '신혼여행 means honeymoon. 신 = new, 혼 = marriage, 여행 = travel.', 4),
  (l_id, '''Congratulations on the wedding!'' in Korean:', '["결혼 감사해요!", "결혼 축하해요!", "결혼 해주세요!", "결혼 부탁해요!"]', 1, '축하하다 = to congratulate. 결혼 축하해요!', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국에서 결혼식은 중요한 행사다. 신랑과 신부는 이좀범에 원피스를 입고, 신랑은 양복을 입는다. 친첩과 친구들이 친심하게 축하 인사를 나눈다. 파티 이후엔 두 사람이 신혼여행을 떠나다. 한국 결혼식은 에너지가 넘치고 신내하는 분위기로 유명하다.', 'In Korea the wedding ceremony is an important event. The bride wears a white dress and the groom wears a suit. Relatives and friends warmly exchange congratulations. After the party the couple leaves on a honeymoon. Korean weddings are known for their energetic and warm atmosphere.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 31;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '생일', 'saengil', 'birthday', 1),
  (l_id, '생일 일', 'saengil il', 'birthday (date)', 2),
  (l_id, '케이크', 'keik', 'cake', 3),
  (l_id, '초', 'cho', 'candle', 4),
  (l_id, '노래', 'norae', 'song', 5),
  (l_id, '선물', 'seonmul', 'gift / present', 6),
  (l_id, '파티', 'pati', 'party', 7),
  (l_id, '축하하다', 'chukhahada', 'to celebrate / congratulate', 8),
  (l_id, '축하 메시지', 'chukha mesiji', 'congratulatory message', 9),
  (l_id, '쇝니다', 'ppulda', 'to blow (candles)', 10),
  (l_id, '강다다', 'kang-Dada', 'to be strong (surprise)', 11),
  (l_id, '흰두킹', 'heontduking', 'special 1st birthday (Dol)', 12),
  (l_id, '돌쟜치', 'doljaNchi', 'Dol celebration (1st birthday)', 13),
  (l_id, '나이를 먹다', 'naireul meogda', 'to age one year', 14),
  (l_id, '소원을 빌다', 'sowoneul bilDA', 'to make a birthday wish', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '오늘 내 생일 — stating today is your birthday', '[냬t] + 이어요', 'A simpler pattern: 오늘 내 생일이어요 = Today is my birthday. Use 이어요/예요 for stating facts.', '[{"korean": "오늘 내 생일이어요.", "english": "Today is my birthday."}, {"korean": "내일이 생일이어요.", "english": "Tomorrow is my birthday."}, {"korean": "주말에 생일 파티를 할 거예요.", "english": "I am going to have a birthday party on the weekend."}]', 1),
  (l_id, '하하세요 — causative celebrations / common party speech', '[함기] 충 쿨다 / 축하들 해 주세요', '축하해 주다 = to give the action of congratulating. Very natural in birthday contexts.', '[{"korean": "생일 축하해 주세요.", "english": "Please congratulate me on my birthday."}, {"korean": "생일 축하드립니다.", "english": "Happy birthday (formal)."}, {"korean": "생일 축하해!", "english": "Happy birthday (casual)."}]', 2),
  (l_id, '소원을 브다 — to make a wish', '[주어] + 이/가 + 소원을 + 빌다', '소원을 브다 is the expression for making a birthday wish. 소원 = wish, 브다 = to make/pray for.', '[{"korean": "초를 끄고 소원을 빌어요.", "english": "I blow out the candles and make a wish."}, {"korean": "무슨 소원을 빌었어요?", "english": "What wish did you make?"}, {"korean": "소원을 빌 다음 원하는 것이 이루어져요.", "english": "After making the wish, the desired thing came true."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 생일이어요? 축하해요!', 'Oneul saengilieyo? Chukaeyo!', 'Is today your birthday? Happy birthday!', 1),
  (l_id, '민호', '어, 어떻게 알았어요? 아니 몇 사람한테만 말했는데.', 'Eo, eotteoke alasseoyo? Ani myeot saramhant-eman malhaetneunde.', 'Oh, how did you know? I only told a few people.', 2),
  (l_id, '수진', '소셜 마른 하이진 데 마쓴마 부여따라요.', 'Sosyeol maten hayeoja daeMAneun bunyeo darak-yo.', 'It said so on social media.', 3),
  (l_id, '민호', '아이다~ 마콜었는데. 아무튼 축하 고마워요!', 'Aida~ marco geoleo sseoyo. Amwoetuny chukha gomawoyo!', 'Oh no, I forgot I put it public. Anyway thank you for the birthday wishes!', 4),
  (l_id, '수진', '오늘 파티는 할 거예요?', 'Oneul PatiNeun hal geoyeyo?', 'Are you having a party today?', 5),
  (l_id, '민호', '소소하게 친한 친구들이 케이크를 준비했다고 하더라고요. 저녀에 만나요.', 'Sosohage chinhange chingudeuri keikereul junbida haseo. Jeonye-e manayo.', 'Quietly a few close friends said they prepared a cake. We meet in the evening.', 6),
  (l_id, '수진', '원죜기 다 행복한 생일이 됨인 좋겠어요. 소원도 폭 브세요.', 'WonjjAgi Da haengbokan saengili domin jotgesseoyo. Sowondo peok beuseyo.', 'I hope it turns out to be a perfectly happy birthday. Make a big wish too.', 7),
  (l_id, '민호', '고마워요! 저도 누군가 생일엔 풍율 커피 선물해 드릴게요.', 'Gomawoyo! Jeodo nugunGa saengil-en pumYyun keopi seonmulhae deurilgeyo.', 'Thank you! On someone''s birthday I will also give a coffee gift.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''생일'' means:', '["party", "cake", "birthday", "present"]', 2, '생일 means birthday.', 1),
  (l_id, '''Happy birthday'' in Korean:', '["생일 감사해요!", "생일 해요!", "생일 축하해요!", "생일이에요!"]', 2, '생일 축하해요! is Happy birthday.', 2),
  (l_id, 'Which verb means ''to blow (candles)''?', '["피우다", "끄다", "뿔다", "불다"]', 3, '불다 means to blow. Candle idiom: 초를 끄고 소원을 브다.', 3),
  (l_id, '''소원을 브다'' means:', '["to sing a song", "to make a wish", "to eat cake", "to blow a candle"]', 1, '소원을 브다 = to make a birthday wish.', 4),
  (l_id, '''선물'' means:', '["cake", "birthday", "congratulations", "gift / present"]', 3, '선물 means gift or present.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '생일은 한 해를 마무리하고 새로운 한 해를 시작하는 특별한 날이다. 한국에서는 케이크에 초를 꽀고 소원을 브는 문화가 있다. 친첩과 친구들이 생일 축하 메시지를 보내고, 선물을 준비한다. 한국에서는 돌 잔치라고 하는 첫 생일 잔치를 중요하게 여기는 홍습이 있다. 생일마다 새로운 시작을 한다는 생각으로 행복하게 지내자.', 'A birthday is a special day that closes one year and begins a new one. In Korea there is a tradition of placing candles on a cake and making a wish. Relatives and friends send birthday congratulation messages and prepare gifts. In Korea there is a custom of valuing the first birthday celebration called Dol. On each birthday let us live happily with the thought of making a fresh start.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 32;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '이사', 'isa', 'moving house', 1),
  (l_id, '이사하다', 'isahada', 'to move house', 2),
  (l_id, '이사집', 'isajip', 'moving company', 3),
  (l_id, '집', 'jip', 'house', 4),
  (l_id, '아파트', 'apateu', 'apartment', 5),
  (l_id, '전세', 'jeonse', 'lump-sum rental deposit system', 6),
  (l_id, '월세', 'wolse', 'monthly rent', 7),
  (l_id, '집주인', 'jipjuin', 'landlord', 8),
  (l_id, '세입자', 'seibja', 'tenant', 9),
  (l_id, '맹다', 'ssada', 'to be cheap', 10),
  (l_id, '슼다', 'ssida', 'to pack (belongings)', 11),
  (l_id, '포장하다', 'pojang-hada', 'to pack (items in boxes)', 12),
  (l_id, '쇼파를 않하다', 'sopareul anta', 'to carry a sofa', 13),
  (l_id, '주소를 옮기다', 'juso-reul omgida', 'to change address', 14),
  (l_id, '실내 인테리어', 'silnae interior', 'interior decoration', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '몇 개 — counting objects', '[숫자] + 개 / [숫자 + Counter]', '개 is the general counter for objects. Use it when counting boxes, items, etc. during moving.', '[{"korean": "상자가 열 개 있어요.", "english": "There are ten boxes."}, {"korean": "집이 세 개 있어요.", "english": "There are three houses."}, {"korean": "짐이 많아요.", "english": "There is a lot of luggage."}]', 1),
  (l_id, '이사하다 주요 표현 — key moving house expressions', '[곳] + 으로/로 이사하다', '으로/로 marks direction or destination: to where something moves. Use it with 이사하다.', '[{"korean": "서울로 이사했어요.", "english": "I moved to Seoul."}, {"korean": "새 집으로 이사했어요.", "english": "I moved to a new house."}, {"korean": "더 큰 아파트로 이사하는 중이어요.", "english": "I am moving to a bigger apartment."}]', 2),
  (l_id, '다 — all / done', '[동사어간] + 다 했어요', '다 했어요 means I have finished doing everything. 다 emphasizes completion of all tasks.', '[{"korean": "짐을 다 쏼어요.", "english": "I have packed everything."}, {"korean": "정리를 다 했어요.", "english": "I have finished tidying up."}, {"korean": "이사를 다 끝내었어요.", "english": "I have finished moving."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '자안게 될 것 같은 집 잓다요?', 'JANhage doeil geot gateun jip jassda-yo?', 'Did you find a place that looks comfortable?', 1),
  (l_id, '민호', '네! 여의도 근첮에 전세 아파트를 계약했어요. 다음 달에 이사할 거예요.', 'Ne! Yeongdo geunchoe jeonse apateu-reul gyeyakhaesseoyo. Daeum dare isAHal geoyeyo.', 'Yes! I signed a jeonse lease on an apartment near Yeouido. I am moving next month.', 2),
  (l_id, '수진', '저도 이사하면 도와 줄게요. 짘도 많을 테니까요.', 'Jeodo IsaHamyeon dowa julgeyo. JimDo manil teoniKayo.', 'I will help when you move. You must have a lot of luggage.', 3),
  (l_id, '민호', '정말요? 너무 고마워요. 사실 이사집도 불렀아 놈는데 상자 나르기가 너무 힘들어오.', 'Jeongmaryo? Neomu gomawoyo. Sasil IsaJip-Do bulleoNoedeun데 SangJa nareugiga neomu himdeureoyo.', 'Really? Thank you so much. I actually also called movers but sorting the boxes is too hard.', 4),
  (l_id, '수진', '이사집 쓰면 짐이 많아지죠. 아까운 것은 제가 포장해 드릴게요.', 'IsajipUl seuMYeon jiMi manajijyo. Gakkaun geoseun jega pojangHae deurilgeyo.', 'When you use movers there tends to be a lot of luggage. I will pack the small things for you.', 5),
  (l_id, '민호', '이사 끝나면 내가 맛있는 거 사줘줘요. 얼마나 갈아요?', 'IsA kkeutnAmyeon naega massinneun geo saSweayo. Eolmana galayo?', 'When the move is done I will treat you to something delicious. How about that?', 6),
  (l_id, '수진', '하하! 맛있는 거라면 더 어떵게도 돕겠죠.', 'Haha! Massinneun georamyeon deo eoddepgedo doptgaJyo.', 'Haha! If it is something delicious I will help even harder.', 7),
  (l_id, '민호', '신주소 등록도 말고 정말 바쁘 시일이 될 것 같아요.', 'SinjuSo deungrokdo hAGo jeongmal Basan siiri doel geot gataYo.', 'With address registration and everything it looks like it will be a really busy day.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''이사하다'' means:', '["to clean", "to move house", "to pack", "to rent"]', 1, '이사하다 means to move house.', 1),
  (l_id, '''전세'' means:', '["monthly rent", "landlord", "lump-sum deposit rental", "apartment"]', 2, '전세 is the Korean lump-sum rental deposit system.', 2),
  (l_id, '''I moved to Seoul'' in Korean:', '["서울에서 이사했어요", "서울로 이사했어요", "서울이 이사해요", "서울까지 이사해요"]', 1, '로 marks direction: 서울로 이사했어요 = I moved to Seoul.', 3),
  (l_id, '''포장하다'' means:', '["to move", "to unpack", "to pack (items)", "to carry"]', 2, '포장하다 means to pack or wrap items.', 4),
  (l_id, 'General counter for objects:', '["명", "권", "개", "번"]', 2, '개 is the general counter for objects. 상자 다섯 개 = five boxes.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '이사는 신나는 일이지만 튀이 많이 든다. 먼저 짐을 상자에 다 담고 포장하야 한다. 이사집에 도움을 요청하면 더 편하게 이동할 수 있다. 새 집에 도착한 후에는 주소 맹록을 업데이트해야 한다. 집을 예쁜게 꽃장식하면 새 샘활이 더 즉거워질 수 있다.', 'Moving is an exciting thing but it takes a lot of effort. First you have to pack all your belongings into boxes and wrap them. Asking movers for help makes the process easier. After arriving at the new house you need to update your address records. Decorating the house nicely makes the new life even more enjoyable.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=26;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#26 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'보다','boda','to see/look/watch',1),
  (l_id,'눈','nun','eye',2),
  (l_id,'시력','siryeok','eyesight',3),
  (l_id,'안경','angyeong','glasses',4),
  (l_id,'렌즈','reenjeu','contact lenses',5),
  (l_id,'풍경','punggyeong','scenery/landscape',6),
  (l_id,'구경하다','gugyeonghada','to look around/sightsee',7),
  (l_id,'관찰하다','gwanchalhada','to observe',8),
  (l_id,'바라보다','baraboda','to gaze at',9),
  (l_id,'눈을 감다','nuneul gamda','to close eyes',10),
  (l_id,'눈을 뜨다','nuneul tteuda','to open eyes',11),
  (l_id,'선명하다','seonmyeonghada','to be clear/vivid',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'보다 vs 보이다','보다 = active looking | 보이다 = passive/visible','보다 requires effort. 보이다 means something is visible or appears.','[{"korean": "창문 밖을 봐요.", "english": "I look out the window. (active)"}, {"korean": "저기 산이 보여요.", "english": "I can see a mountain over there. (visible)"}, {"korean": "잘 안 보여요.", "english": "I cannot see well. (poor visibility)"}]',1),
  (l_id,'-아/어 보이다','V/Adj stem + -아/어 보이다 = looks/seems','Expresses how something appears to the observer.','[{"korean": "피곤해 보여요.", "english": "You look tired."}, {"korean": "맛있어 보여요.", "english": "It looks delicious."}, {"korean": "행복해 보여요.", "english": "You look happy."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','저 산 보여요?','jeo san boyeoyo?','Can you see that mountain?',1),
  (l_id,'B','네, 정말 아름다워요!','ne, jeongmal areumdawoyo!','Yes, it is really beautiful!',2),
  (l_id,'A','시력이 좋아요?','siryeogi joayo?','Is your eyesight good?',3),
  (l_id,'B','아니요, 안경을 써요.','aniyo, angyeongeul sseoyo.','No, I wear glasses.',4),
  (l_id,'A','그렇군요. 풍경이 선명하게 보여요?','geureokkunnyo. punggyeong-i seonmyeonghage boyeoyo?','I see. Can you see the scenery clearly?',5),
  (l_id,'B','네, 안경 덕분에 잘 보여요.','ne, angyeong deokbune jal boyeoyo.','Yes, thanks to my glasses I can see well.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the difference between 보다 and 보이다?','["No difference", "보다=active looking, 보이다=passively visible", "보다=passive, 보이다=active", "보이다 is more formal"]',1,'보다 = actively looking; 보이다 = something is visible/can be seen.',1),
  (l_id,'피곤해 보여요 means:','["I am tired", "You look tired", "I look tired", "You feel tired"]',1,'-아/어 보이다 expresses how someone appears to the speaker.',2),
  (l_id,'How do you say "I cannot see well"?','["잘 봐요", "잘 안 봐요", "잘 안 보여요", "잘 보이지 마요"]',2,'잘 안 보여요 = it is not visible well (passive perception).',3),
  (l_id,'What is 시력?','["Hearing", "Eyesight", "Touch", "Smell"]',1,'시력 = visual acuity / eyesight.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'시각은 우리가 세상을 인식하는 데 가장 많이 사용하는 감각입니다. 눈 건강을 위해 규칙적인 안과 검진이 중요합니다. 스마트폰과 컴퓨터를 오래 사용하면 눈이 피로해집니다. 20-20-20 규칙이 도움이 됩니다: 20분마다 20피트 거리의 물체를 20초 동안 봅니다. 아름다운 자연 풍경을 바라보는 것은 눈과 마음 모두에 좋습니다.','Vision is the sense we use most to perceive the world. Regular eye check-ups are important for eye health. Using smartphones and computers for a long time tires the eyes. The 20-20-20 rule helps: every 20 minutes, look at an object 20 feet away for 20 seconds. Gazing at beautiful natural scenery is good for both eyes and mind.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=27;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#27 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'맛보다','matboda','to taste/try food',1),
  (l_id,'맛','mat','taste/flavor',2),
  (l_id,'달다','dalda','to be sweet',3),
  (l_id,'짜다','jjada','to be salty',4),
  (l_id,'쓰다','sseuda','to be bitter',5),
  (l_id,'시다','sida','to be sour/acidic',6),
  (l_id,'맵다','maepda','to be spicy',7),
  (l_id,'담백하다','dambaekada','to be mild/bland',8),
  (l_id,'고소하다','gosohada','to be savory/nutty',9),
  (l_id,'향','hyang','aroma/scent',10),
  (l_id,'입맛','immam','appetite/taste preference',11),
  (l_id,'맛집','matjip','famous/good restaurant',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'맛 형용사 + 아요/어요','[맛 형용사] + 아요/어요','맵다→매워요, 달다→달아요, 쓰다→써요, 짜다→짜요, 시다→셔요. Some are irregular.','[{"korean": "이 김치는 매워요.", "english": "This kimchi is spicy."}, {"korean": "이 케이크는 달아요.", "english": "This cake is sweet."}, {"korean": "이 약은 써요.", "english": "This medicine is bitter."}]',1),
  (l_id,'맛이 어때요? — Asking about taste','맛이 어때요? / 맛있어요? / 어떤 맛이에요?','Common ways to ask about the taste of food.','[{"korean": "맛이 어때요? — 달콤하고 고소해요.", "english": "How does it taste? — It is sweet and savory."}, {"korean": "어떤 맛이에요? — 좀 짜요.", "english": "What does it taste like? — It is a bit salty."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','이 음식 맛봐도 돼요?','i eumsik matbwado dwaeyo?','May I taste this food?',1),
  (l_id,'B','네, 맛봐 보세요!','ne, matbwa boseyo!','Yes, please try it!',2),
  (l_id,'A','음, 달고 고소해요.','eum, dalgo gosohaeyo.','Hmm, it is sweet and savory.',3),
  (l_id,'B','맞아요. 참깨가 들어가서 고소해요.','majayo. chamkkaega deureogaseo gosohaeyo.','Right. It is savory because sesame is in it.',4),
  (l_id,'A','조금 짠 것 같아요.','jogeumjjan geot gatayo.','I think it is a little salty.',5),
  (l_id,'B','그래요? 소금을 줄일게요.','geuraeyo? sogeumeul jurilgeyo.','Really? I will reduce the salt.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'맵다 in polite present is:','["맵어요", "매워요", "맵아요", "맵요"]',1,'맵다 is ㅂ-irregular: 매워요 (ㅂ→우 before vowel endings).',1),
  (l_id,'What does 담백하다 mean?','["Very spicy", "Very sweet", "Mild and clean-tasting", "Salty"]',2,'담백하다 = mild, light, not greasy — a common way to describe Korean food.',2),
  (l_id,'How do you ask "how does it taste"?','["맛이 어때요?", "맛을 봐요?", "맛은 뭐예요?", "맛이 있어요?"]',0,'맛이 어때요? is the natural way to ask about taste/flavor.',3),
  (l_id,'What is 맛집?','["A cooking class", "A famous/delicious restaurant", "A kitchen", "A food market"]',1,'맛집 = a restaurant known for its delicious food. Very common in Korean food culture.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 음식은 다양한 맛의 조화로 유명합니다. 매운맛, 단맛, 짠맛, 신맛이 균형 있게 어우러진 것이 특징입니다. 발효 음식인 김치는 시고 매운 독특한 맛이 있습니다. 한국인들은 음식 맛에 매우 관심이 많으며 맛집을 찾아다니는 문화가 있습니다. 음식의 맛을 표현하는 다양한 형용사를 익히면 한국 음식 문화를 더 잘 이해할 수 있습니다.','Korean food is famous for the harmony of diverse flavors. It is characterized by a balanced combination of spicy, sweet, salty, and sour tastes. Kimchi, a fermented food, has a unique sour and spicy flavor. Koreans are very interested in the taste of food and have a culture of seeking out famous restaurants. Learning various adjectives for expressing food taste helps you better understand Korean food culture.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=28;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#28 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'만지다','manjida','to touch',1),
  (l_id,'느끼다','neukkida','to feel/sense',2),
  (l_id,'부드럽다','budeueopda','to be soft',3),
  (l_id,'딱딱하다','ttakttakada','to be hard',4),
  (l_id,'거칠다','geocilda','to be rough',5),
  (l_id,'매끄럽다','maekkeureobda','to be smooth',6),
  (l_id,'따뜻하다','ttatteutada','to be warm',7),
  (l_id,'차갑다','chagapda','to be cold (to touch)',8),
  (l_id,'촉감','chokgam','sense of touch/texture',9),
  (l_id,'피부','pibu','skin',10),
  (l_id,'손가락','songarak','finger',11),
  (l_id,'쥐다','jwida','to grip/hold',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'촉감 형용사','[형용사] + 아요/어요 to describe texture','Texture adjectives: 부드러워요, 딱딱해요, 거칠어요, 매끄러워요.','[{"korean": "이 천은 부드러워요.", "english": "This fabric is soft."}, {"korean": "이 돌은 딱딱해요.", "english": "This stone is hard."}, {"korean": "고양이 털이 부드러워요.", "english": "Cat fur is soft."}]',1),
  (l_id,'촉감 동사 표현','만져 보다 / 느껴 보다','Use -아/어 보다 to try touching or sensing something.','[{"korean": "만져 봐도 돼요?", "english": "May I touch it?"}, {"korean": "느껴 보세요.", "english": "Please feel it."}, {"korean": "한번 잡아 보세요.", "english": "Try holding it once."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','이 스웨터 어때요?','i seuweteo eottaeyo?','How is this sweater?',1),
  (l_id,'B','정말 부드러워요! 만져 보세요.','jeongmal budeureowoyo! manje boseyo.','It is really soft! Please touch it.',2),
  (l_id,'A','오, 진짜 좋아요. 소재가 뭐예요?','o, jinjja joayo. sojaega mwoyeyo?','Oh, it is really nice. What is the material?',3),
  (l_id,'B','캐시미어예요.','kaesimio-yeyo.','It is cashmere.',4),
  (l_id,'A','따뜻하기도 하겠네요.','ttatteutagi-do hagenneyo.','It must also be warm.',5),
  (l_id,'B','네, 겨울에 딱 좋아요.','ne, gyeoul-e ttak joayo.','Yes, it is perfect for winter.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'만져 보다 means:','["To feel emotion", "To try touching", "To see something", "To smell something"]',1,'-아/어 보다 = to try doing. 만져 보다 = to try touching.',1),
  (l_id,'부드럽다 polite present:','["부드러워요", "부드럽아요", "부드럽어요", "부드러요"]',0,'부드럽다 is ㅂ-irregular: 부드러워요.',2),
  (l_id,'What does 촉감 mean?','["Hearing", "Smell", "Sense of touch/texture", "Taste"]',2,'촉감 = the sense of touch or the texture/feel of something.',3),
  (l_id,'How do you ask permission to touch something?','["만져도 돼요?", "만지면 돼요?", "만져야 해요?", "만지지 마세요?"]',0,'만져도 돼요? = May I touch it? (-아/어도 되다 = it is okay to do)',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'촉각은 우리가 세상을 경험하는 중요한 감각 중 하나입니다. 피부를 통해 온도, 압력, 질감 등을 느낄 수 있습니다. 한국 전통 직물인 한복은 다양한 촉감의 소재로 만들어집니다. 아이들은 촉각을 통해 주변 환경을 탐색하고 배웁니다. 마사지나 스킨케어 등 피부 관리는 한국 일상 문화에서 중요한 부분입니다.','Touch is one of the important senses through which we experience the world. Through the skin we can feel temperature, pressure, texture and more. Hanbok, traditional Korean clothing, is made from fabrics of various textures. Children explore and learn about their environment through touch. Massage and skincare are important parts of Korean daily culture.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=29;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#29 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'걷다','geotda','to walk',1),
  (l_id,'산책','sanchack','walk/stroll',2),
  (l_id,'산책하다','sanchakada','to go for a walk',3),
  (l_id,'보행','bohaeng','pedestrian walking',4),
  (l_id,'걸음','georeum','step/gait',5),
  (l_id,'뛰다','ttwida','to run',6),
  (l_id,'속도','sokdo','speed/pace',7),
  (l_id,'공원','gongwon','park',8),
  (l_id,'산책로','sanchanro','walking path/trail',9),
  (l_id,'보폭','bopok','stride length',10),
  (l_id,'규칙적으로','gyuchikjeokuro','regularly',11),
  (l_id,'건강','geongang','health',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'걷다 irregular','걷다 is ㄷ-irregular','ㄷ → ㄹ before vowel endings: 걸어요, 걸었어요.','[{"korean": "공원에서 걸어요.", "english": "I walk in the park."}, {"korean": "어제 한 시간 걸었어요.", "english": "Yesterday I walked for one hour."}, {"korean": "빨리 걸어요.", "english": "Walk quickly."}]',1),
  (l_id,'산책 관련 표현','산책하다 / 산책을 가다 / 산책을 나가다','Various ways to express going for a walk.','[{"korean": "산책하러 가요.", "english": "I am going for a walk. (-러 가다 = go to do)"}, {"korean": "매일 저녁 산책을 해요.", "english": "I go for a walk every evening."}, {"korean": "강아지와 산책을 나갔어요.", "english": "I went out for a walk with my dog."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','오늘 같이 산책할까요?','oneul gachi sanchakalkkkayo?','Shall we go for a walk together today?',1),
  (l_id,'B','좋아요! 어디로 갈까요?','joayo! eodiro galkkayo?','Great! Where shall we go?',2),
  (l_id,'A','한강 공원이 어때요?','hangang gong-won-i eottaeyo?','How about the Han River Park?',3),
  (l_id,'B','완벽해요. 경치도 좋고 걷기도 좋아요.','wanbyeokhaeyo. gyeongchido joko geotgi-do joayo.','Perfect. The scenery is good and it is good for walking.',4),
  (l_id,'A','운동화 신고 오세요.','undonghwa singo oseyo.','Please come wearing sneakers.',5),
  (l_id,'B','알겠어요. 한 시간 후에 봐요!','algeseoyo. han sigan hue bwayo!','Understood. See you in one hour!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'걷다 polite present:','["걷어요", "걸어요", "걷아요", "걸아요"]',1,'걷다 is ㄷ-irregular: ㄷ→ㄹ before vowels → 걸어요.',1),
  (l_id,'산책하러 가다 means:','["To come back from a walk", "To go in order to take a walk", "To stop walking", "To walk quickly"]',1,'-러 가다 = to go for the purpose of doing V.',2),
  (l_id,'What is 산책로?','["A park", "A walking path/trail", "Walking speed", "A step"]',1,'산책로 = a designated path for walking/strolling.',3),
  (l_id,'How do you say "I walked for two hours"?','["두 시간 걸어요", "두 시간 동안 걸었어요", "두 시간에 걸었어요", "두 시간부터 걸었어요"]',1,'동안 = duration: 두 시간 동안 걸었어요 = walked for two hours.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'걷기는 가장 간단하고 효과적인 운동 중 하나입니다. 한국의 도시들에는 잘 정비된 산책로와 공원이 많습니다. 한강 공원, 청계천, 북한산 등은 서울 시민들이 즐겨 찾는 산책 명소입니다. 규칙적인 걷기 운동은 심폐 기능 향상, 스트레스 감소, 체중 관리에 도움이 됩니다. 하루 만 보 걷기를 목표로 하는 사람들이 많습니다.','Walking is one of the simplest and most effective forms of exercise. Korean cities have many well-maintained walking paths and parks. Han River Park, Cheonggyecheon, and Bukhansan are popular walking spots for Seoul citizens. Regular walking helps improve cardiopulmonary function, reduce stress, and manage weight. Many people aim to walk 10,000 steps a day.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=30;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#30 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'결혼','gyeolhon','marriage',1),
  (l_id,'결혼하다','gyeolhonhada','to get married',2),
  (l_id,'결혼식','gyeolhonsik','wedding ceremony',3),
  (l_id,'신랑','silang','groom',4),
  (l_id,'신부','sinbu','bride',5),
  (l_id,'예식장','yesikjang','wedding hall',6),
  (l_id,'청첩장','cheongcheopjang','wedding invitation',7),
  (l_id,'혼인','honin','matrimony (formal)',8),
  (l_id,'약혼','yakon','engagement',9),
  (l_id,'하객','hakaek','wedding guest',10),
  (l_id,'축의금','chugigeum','wedding money gift',11),
  (l_id,'부케','buke','bouquet',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'결혼 관련 표현','결혼하다 / 결혼식을 올리다 / 결혼을 앞두다','Various expressions about getting married in Korean.','[{"korean": "다음 달에 결혼해요.", "english": "I am getting married next month."}, {"korean": "결혼식을 올렸어요.", "english": "They held a wedding ceremony."}, {"korean": "결혼을 앞두고 바빠요.", "english": "I am busy with the upcoming wedding."}]',1),
  (l_id,'-기로 하다 (decided to do)','V-기로 하다 = to have decided to do something','Used to announce a decision or plan.','[{"korean": "결혼하기로 했어요.", "english": "We decided to get married."}, {"korean": "내년에 결혼하기로 했어요.", "english": "We decided to get married next year."}, {"korean": "여기서 결혼식을 하기로 했어요.", "english": "We decided to hold the wedding here."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','소식 들었어요? 지수가 결혼한대요!','sosik deureosseoyo? jisuga gyeolhondaeyo!','Did you hear the news? Jisu is getting married!',1),
  (l_id,'B','정말요? 언제요?','jeongmalyo? eonjeyyo?','Really? When?',2),
  (l_id,'A','다음 달이래요. 청첩장도 받았어요.','daeum dari-reyo. cheongcheopjangdo badasseoyo.','Next month apparently. I also received a wedding invitation.',3),
  (l_id,'B','축하해야겠네요! 축의금은 얼마나 낼 거예요?','chukahaeya geenne yo! chugigeumeun eolmana nael geoyeyo?','We should congratulate them! How much money gift will you give?',4),
  (l_id,'A','오만 원 정도 생각하고 있어요.','oman won jeongdo saenggakago isseoyo.','I am thinking around 50,000 won.',5),
  (l_id,'B','저도 같이 낼게요. 같이 가요!','jeodo gachi naelgeyo. gachi gayo!','I will pay together with you. Lets go together!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is 청첩장?','["Wedding ring", "Bouquet", "Wedding invitation", "Wedding hall"]',2,'청첩장 is the formal wedding invitation card in Korea.',1),
  (l_id,'What does 결혼하기로 했어요 mean?','["I want to get married", "I got married", "We decided to get married", "I will get married someday"]',2,'-기로 하다 = decided to do. 결혼하기로 했어요 = decided to get married.',2),
  (l_id,'What is 축의금?','["Wedding cake", "The wedding ceremony", "Money gift given to bride and groom", "Wedding dress"]',2,'축의금 is the cash gift given to the couple at a Korean wedding.',3),
  (l_id,'Who is the 신랑?','["Bride", "Groom", "Wedding guest", "Best man"]',1,'신랑 = groom. 신부 = bride.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국의 결혼 문화는 독특한 전통과 현대적인 요소가 결합되어 있습니다. 전통 혼례에서는 한복을 입고 절을 하는 의식을 행합니다. 현대 결혼식은 주로 예식장이나 호텔에서 진행됩니다. 하객들은 축의금을 내는 것이 일반적인 예절입니다. 결혼 전에 양가 부모님이 만나는 상견례도 중요한 절차입니다.','Korean wedding culture combines unique traditions with modern elements. In traditional weddings, people wear hanbok and perform bowing ceremonies. Modern weddings are mainly held at wedding halls or hotels. It is common etiquette for wedding guests to give cash gifts. The sanggyeonrye, where both families meet before the wedding, is also an important procedure.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'생일','saengil','birthday',1),
  (l_id,'생일 파티','saengil pati','birthday party',2),
  (l_id,'케이크','keiku','cake',3),
  (l_id,'초','cho','candle',4),
  (l_id,'선물','seonmul','gift/present',5),
  (l_id,'축하하다','chukahada','to congratulate/celebrate',6),
  (l_id,'깜짝 파티','kkamjjak pati','surprise party',7),
  (l_id,'생일 축하해요','saengil chukahaeyo','Happy birthday!',8),
  (l_id,'소원','sowon','wish',9),
  (l_id,'불을 끄다','bureul kkeuda','to blow out candles',10),
  (l_id,'포장하다','pojanghada','to wrap (a gift)',11),
  (l_id,'나이','nai','age',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'생일 축하 표현','생일 축하해요! / 생일을 축하드려요! / 생일 축하합니다!','Three levels of formality for birthday wishes.','[{"korean": "생일 축하해! (casual)", "english": "Happy birthday!"}, {"korean": "생일 축하해요! (polite)", "english": "Happy birthday! (to peers/adults)"}, {"korean": "생일 축하드려요! (formal/honorific)", "english": "Happy birthday! (to elders/superiors)"}]',1),
  (l_id,'주다/드리다 with gifts','선물을 주다 (give to peers) / 선물을 드리다 (give to elders)','주다 and 드리다 both mean to give, but 드리다 is honorific.','[{"korean": "친구한테 선물을 줬어요.", "english": "I gave a gift to my friend."}, {"korean": "부모님께 선물을 드렸어요.", "english": "I gave a gift to my parents."}, {"korean": "선생님께 꽃을 드렸어요.", "english": "I gave flowers to the teacher."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','오늘 무슨 날이에요?','oneul musun nal-ieyo?','What day is today?',1),
  (l_id,'B','제 생일이에요!','je saengil-ieyo!','It is my birthday!',2),
  (l_id,'A','정말요? 생일 축하해요!','jeongmalyo? saengil chukahaeyo!','Really? Happy birthday!',3),
  (l_id,'B','고마워요. 오늘 저녁에 파티가 있어요.','gomawoyo. oneul jeonyeoge pati-ga isseoyo.','Thank you. There is a party this evening.',4),
  (l_id,'A','와! 저도 가도 돼요?','wa! jeodo gado dwaeyo?','Wow! Can I come too?',5),
  (l_id,'B','물론이죠! 여덟 시에 우리 집에 오세요.','mullon-ijyo! yeodeol si-e uri jibe oseyo.','Of course! Come to my house at eight oclock.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Which is the most formal way to say Happy Birthday?','["생일 축하해!", "생일 축하해요!", "생일 축하드려요!", "생일 좋아요!"]',2,'생일 축하드려요 uses 드리다 (honorific of 주다) and is the most formal.',1),
  (l_id,'What does 소원 mean in birthday context?','["Cake", "Candle", "Birthday wish", "Party"]',2,'소원 = wish. 소원을 빌다 = to make a wish (like when blowing out candles).',2),
  (l_id,'선물을 드렸어요 vs 선물을 줬어요:','["Both mean the same thing", "드렸어요 is used for elders/superiors", "줬어요 is more formal", "드렸어요 is casual"]',1,'드리다 is the honorific form of 주다, used when giving to someone of higher status.',3),
  (l_id,'What is 깜짝 파티?','["A birthday cake", "A candle ceremony", "A surprise party", "A gift wrapping"]',2,'깜짝 = surprise. 깜짝 파티 = surprise party.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국에서는 생일을 가족이나 친구들과 함께 축하하는 것이 중요한 문화입니다. 미역국은 생일에 먹는 전통 음식으로, 어머니가 아이를 낳을 때 먹었던 음식이기 때문입니다. 현대에는 생일 케이크와 파티도 흔해졌습니다. 한국에서는 만 나이와 한국 나이가 달라 나이 계산이 복잡할 수 있습니다. 생일 선물은 친한 사이에서는 당연한 문화이지만, 너무 비싼 선물은 부담이 될 수 있습니다.','In Korea, celebrating birthdays with family and friends is an important cultural practice. Miyeok-guk (seaweed soup) is a traditional birthday food because it was what mothers ate after giving birth. These days birthday cakes and parties have also become common. In Korea, age calculation can be complicated because international age and Korean age differ. Giving birthday gifts is natural among close friends, but overly expensive gifts can feel burdensome.',1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='daily-routine' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'daily-routine#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'이사','isa','moving house',1),
  (l_id,'이사하다','isahada','to move house',2),
  (l_id,'이삿짐','isajjim','moving boxes/belongings',3),
  (l_id,'포장하다','pojanghada','to pack',4),
  (l_id,'이삿짐 센터','isajjim senteo','moving company',5),
  (l_id,'집들이','jipduri','housewarming party',6),
  (l_id,'전입 신고','jeonip singo','move-in registration',7),
  (l_id,'계약','gyeyak','contract/lease',8),
  (l_id,'보증금','bojeunggeum','deposit/security deposit',9),
  (l_id,'월세','wolse','monthly rent',10),
  (l_id,'이웃','iut','neighbor',11),
  (l_id,'새 집','sae jip','new home',12);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'이사 표현','이사하다 / 이사를 가다 / 이사를 오다','이사 가다 = move away. 이사 오다 = move in (to a new place).','[{"korean": "다음 주에 이사해요.", "english": "I am moving next week."}, {"korean": "서울로 이사 갔어요.", "english": "I moved to Seoul."}, {"korean": "이 동네로 이사 왔어요.", "english": "I moved into this neighborhood."}]',1),
  (l_id,'집들이 문화','집들이를 하다 — Korean housewarming','집들이 is a housewarming party hosted after moving into a new home. Guests traditionally bring 세제 (detergent) or 초 (candles), symbolizing wishes.','[{"korean": "집들이에 오세요.", "english": "Please come to my housewarming."}, {"korean": "집들이 선물로 세제를 가져왔어요.", "english": "I brought detergent as a housewarming gift."}, {"korean": "집들이 파티가 즐거웠어요.", "english": "The housewarming party was fun."}]',2);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'A','이사 준비 잘 되고 있어요?','isa junbi jal doegoisseoyo?','Are the moving preparations going well?',1),
  (l_id,'B','바빠요. 짐 싸는 게 힘들어요.','bappayo. jim ssaneun ge himdeureoyo.','I am busy. Packing is hard.',2),
  (l_id,'A','도와줄까요?','dowajulkkayo?','Shall I help you?',3),
  (l_id,'B','정말요? 너무 고마워요!','jeongmalyo? neomu gomawoyo!','Really? Thank you so much!',4),
  (l_id,'A','이사 끝나면 집들이 해야죠!','isa kkeunnamyeon jipduri haeyajyo!','Once moving is done, you should have a housewarming!',5),
  (l_id,'B','당연하죠! 꼭 초대할게요.','dangyeonhajyo! kkok chodaehalgeyo.','Of course! I will definitely invite you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'이사를 가다 vs 이사를 오다:','["No difference", "가다=move away, 오다=move in (toward speaker)", "가다=move in, 오다=move out", "Both mean to pack"]',1,'이사 가다 = move away from current place. 이사 오다 = arrive at new place.',1),
  (l_id,'What is 집들이?','["A moving company", "A housewarming party", "A lease contract", "Packing boxes"]',1,'집들이 is the Korean tradition of a housewarming party after moving into a new home.',2),
  (l_id,'What gift is traditionally brought to 집들이?','["Money", "Flowers", "Detergent or candles", "Books"]',2,'세제(detergent) or 초(candles) are traditional 집들이 gifts symbolizing cleansing and illumination.',3),
  (l_id,'What is 보증금?','["Monthly rent", "Security deposit", "Moving cost", "Lease period"]',1,'보증금 is the deposit (key money) paid when renting in Korea.',4);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'이사는 일상에서 큰 변화를 가져오는 중요한 사건입니다. 한국에서는 전세와 월세라는 독특한 임대 방식이 있습니다. 전세는 큰 보증금을 맡기고 월세 없이 사는 방식이고, 월세는 매달 임대료를 내는 방식입니다. 이사 후에는 새 주소로 전입 신고를 해야 합니다. 새 이웃에게 인사하고 집들이를 하는 것이 한국의 정겨운 문화입니다.','Moving is an important life event that brings big changes. In Korea there are unique rental systems called jeonse and wolse. Jeonse involves paying a large deposit with no monthly rent, while wolse involves paying monthly rent. After moving you must register your new address with the local office. Greeting new neighbors and hosting a housewarming is a warm part of Korean culture.',1);
END $$;
