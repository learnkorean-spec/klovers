-- Korean-1 lessons 51–120: Full content seed

-- ============================================================
-- Lesson 51: Korean Culture (한국 문화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 51;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=51 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '문화', 'munhwa', 'culture', 1),
    (l_id, '전통', 'jeongtong', 'tradition', 2),
    (l_id, '풍습', 'pungseup', 'custom, practice', 3),
    (l_id, '예절', 'yejeol', 'etiquette, manners', 4),
    (l_id, '인사', 'insa', 'greeting', 5),
    (l_id, '존경', 'jongyeong', 'respect', 6),
    (l_id, '공동체', 'gongdongche', 'community', 7),
    (l_id, '가치관', 'gachigwan', 'values, value system', 8),
    (l_id, '유교', 'yugyo', 'Confucianism', 9),
    (l_id, '정', 'jeong', 'deep emotional bond', 10),
    (l_id, '눈치', 'nunchi', 'social awareness, tact', 11),
    (l_id, '빨리빨리', 'ppalli ppalli', 'hurry-hurry (Korean urgency culture)', 12),
    (l_id, '한복', 'hanbok', 'traditional Korean clothing', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 대해(서)', 'N + 에 대해(서)', 'Means "about/regarding N". Used to introduce a topic being discussed.', '[{"korean":"한국 문화에 대해서 공부해요.","english":"I study about Korean culture."},{"korean":"그 전통에 대해 알고 싶어요.","english":"I want to know about that tradition."}]', 1),
    (l_id, 'V-는 것이 중요하다', 'Verb stem + 는 것이 중요하다', 'Expresses that doing something is important.', '[{"korean":"예절을 지키는 것이 중요해요.","english":"It is important to observe etiquette."},{"korean":"서로 존경하는 것이 중요합니다.","english":"It is important to respect each other."}]', 2),
    (l_id, 'N을/를 통해(서)', 'N + 을/를 통해(서)', 'Means "through N" or "by means of N".', '[{"korean":"문화를 통해서 많이 배워요.","english":"I learn a lot through culture."},{"korean":"경험을 통해 성장합니다.","english":"We grow through experience."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '민수', '한국 문화에서 제일 중요한 게 뭐라고 생각해요?', 'Hanguk munhwa-eseo jeil jungyohan ge mwora-go saenggakaeyo?', 'What do you think is the most important thing in Korean culture?', 1),
    (l_id, '유나', '저는 예절과 존경이 가장 중요하다고 생각해요.', 'Jeoneun yejeol-gwa jongyeong-i gajang jungyohada-go saenggakaeyo.', 'I think etiquette and respect are the most important.', 2),
    (l_id, '민수', '맞아요. 어른께 인사드리는 것도 중요하죠.', 'Majayo. Eoreunke insadeulineun geotdo jungyohajyo.', 'That''s right. Greeting elders respectfully is also important.', 3),
    (l_id, '유나', '그리고 ''정''이라는 개념도 한국 문화의 특별한 부분이에요.', 'Geurigo ''jeong''iraneun gaenyeomdo Hanguk munhwa-ui teukbyeolhan bubunieyo.', 'And the concept of ''jeong'' is also a special part of Korean culture.', 4),
    (l_id, '민수', '네, 정은 가족이나 친구들 사이의 깊은 감정적 유대감이에요.', 'Ne, jeong-eun gajogi-na chingudeul sai-ui gibeun gamjeongjeok yudaegamieyo.', 'Yes, jeong is the deep emotional bond between family or friends.', 5),
    (l_id, '유나', '한국 문화를 이해하면 한국어를 더 잘 배울 수 있어요.', 'Hanguk munhwa-reul ihaehameyon Hangugeoreul deo jal baeul su isseoyo.', 'If you understand Korean culture, you can learn Korean better.', 6),
    (l_id, '민수', '정말 그래요. 언어와 문화는 항상 함께예요.', 'Jeongmal geuraeyo. Eoneo-wa munhwa-neun hangsang hamkkeeyo.', 'That''s so true. Language and culture always go together.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국 문화에서 ''정''의 의미는 무엇입니까?', '["음식의 종류","깊은 감정적 유대감","빠른 생활 방식","전통 옷"]', 1, '정 (jeong) refers to the deep emotional bond unique to Korean interpersonal relationships.', 1),
    (l_id, '다음 중 ''예절''의 뜻은 무엇입니까?', '["culture","tradition","etiquette","community"]', 2, '예절 means etiquette or manners.', 2),
    (l_id, '빈칸을 채우세요: 한국 문화___ 대해 공부해요.', '["이","에","을","가"]', 1, 'N에 대해(서) means "about/regarding N". The correct particle here is 에.', 3),
    (l_id, '한국의 ''빨리빨리'' 문화는 무엇을 의미합니까?', '["천천히 하는 것","빠르게 서두르는 문화","조용한 생활","공동체 정신"]', 1, '빨리빨리 culture refers to Korea''s characteristic sense of urgency and speed.', 4),
    (l_id, '유교가 한국 문화에 미친 영향은?', '["음식 문화","예절과 존경의 강조","K-pop 발전","현대 기술 발전"]', 1, 'Confucianism (유교) greatly influenced Korean culture, especially its emphasis on etiquette and respect for elders.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 문화는 수천 년의 역사를 가지고 있습니다. 유교의 영향으로 가족과 공동체를 중시하는 가치관이 발전했습니다. 한국인들은 어른에 대한 존경을 매우 중요하게 생각합니다. ''정''이라는 개념은 사람들 사이의 깊은 감정적 유대감을 나타냅니다. 또한 ''눈치''는 상황을 빠르게 파악하고 적절히 행동하는 능력을 의미합니다. 이러한 문화적 가치관들은 한국어 표현 방식에도 많은 영향을 미쳤습니다. 한국 문화를 이해하면 한국어를 더욱 깊이 이해할 수 있습니다.', 'Korean culture has a history spanning thousands of years. Influenced by Confucianism, values emphasizing family and community developed. Koreans place great importance on respect for elders. The concept of ''jeong'' represents the deep emotional bond between people. Additionally, ''nunchi'' refers to the ability to quickly read situations and act appropriately. These cultural values have greatly influenced Korean modes of expression. Understanding Korean culture allows for a deeper understanding of the Korean language.', 1);
END $$;

-- ============================================================
-- Lesson 52: Seasons and Activities (계절 활동)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 52;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=52 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '봄', 'bom', 'spring', 1),
    (l_id, '여름', 'yeoreum', 'summer', 2),
    (l_id, '가을', 'ga-eul', 'autumn, fall', 3),
    (l_id, '겨울', 'gyeoul', 'winter', 4),
    (l_id, '꽃구경', 'kkot gugyeong', 'flower viewing', 5),
    (l_id, '단풍', 'danpung', 'autumn foliage', 6),
    (l_id, '스키', 'seuki', 'skiing', 7),
    (l_id, '수영', 'suyeong', 'swimming', 8),
    (l_id, '소풍', 'sopung', 'picnic, outing', 9),
    (l_id, '장마', 'jangma', 'rainy season', 10),
    (l_id, '태풍', 'taepung', 'typhoon', 11),
    (l_id, '눈사람', 'nunsaram', 'snowman', 12),
    (l_id, '등산', 'deungsan', 'hiking, mountain climbing', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-기 좋다/나쁘다', 'Verb stem + 기 좋다/나쁘다', 'Expresses that something is good or bad for a particular activity.', '[{"korean":"봄은 꽃구경하기 좋아요.","english":"Spring is good for flower viewing."},{"korean":"장마철은 외출하기 나빠요.","english":"The rainy season is bad for going out."}]', 1),
    (l_id, 'N마다', 'Noun + 마다', 'Means "every N" or "each N", expressing regularity.', '[{"korean":"계절마다 다른 활동을 즐겨요.","english":"I enjoy different activities every season."},{"korean":"주말마다 등산해요.","english":"I go hiking every weekend."}]', 2),
    (l_id, 'V-(으)ㄹ 수 있다', 'Verb stem + (으)ㄹ 수 있다/없다', 'Expresses ability or possibility to do something.', '[{"korean":"여름에 수영을 할 수 있어요.","english":"You can swim in summer."},{"korean":"겨울에 스키를 탈 수 있어요.","english":"You can ski in winter."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '지수', '어느 계절을 제일 좋아해요?', 'Eoneu gyejeol-eul jeil joahaeyo?', 'Which season do you like the most?', 1),
    (l_id, '토마스', '저는 가을을 제일 좋아해요. 단풍이 정말 예뻐요.', 'Jeoneun ga-eureul jeil joahaeyo. Danpung-i jeongmal yeppeoyo.', 'I like autumn the most. The fall foliage is really beautiful.', 2),
    (l_id, '지수', '가을에는 어떤 활동을 해요?', 'Ga-eure-neun eotteon hwaldong-eul haeyo?', 'What activities do you do in autumn?', 3),
    (l_id, '토마스', '주로 등산이나 소풍을 가요. 단풍을 보러 산에 자주 가요.', 'Juro deungsani-na sopung-eul gayo. Danpung-eul boreo san-e jaju gayo.', 'I mainly go hiking or on picnics. I often go to the mountains to see the foliage.', 4),
    (l_id, '지수', '저는 여름을 좋아해요. 수영하기 좋거든요.', 'Jeoneun yeoreumul joahaeyo. Suyeonghagi jo-geodeunyo.', 'I like summer. It''s good for swimming, you see.', 5),
    (l_id, '토마스', '하지만 한국 여름은 장마가 있어서 좀 힘들지 않아요?', 'Hajiman Hanguk yeoreum-eun jangma-ga isseo-seo jom himdeulji anayo?', 'But isn''t Korean summer a bit tough because of the rainy season?', 6),
    (l_id, '지수', '맞아요, 장마철은 좀 습하고 더워요. 그래도 여름을 좋아해요!', 'Majayo, jangmacheol-eun jom seupago deowoyo. Geuraedo yeoreumul joahaeyo!', 'You''re right, the rainy season is a bit humid and hot. But I still like summer!', 7),
    (l_id, '토마스', '겨울에는 스키 타러 가고 싶어요.', 'Gyeoure-neun seuki tareo gago sipeoyo.', 'In winter, I want to go skiing.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국의 장마철은 어느 계절에 있습니까?', '["봄","여름","가을","겨울"]', 1, 'Korea''s rainy season (장마) occurs in summer (여름).', 1),
    (l_id, '다음 중 ''단풍''의 의미는?', '["flower viewing","spring breeze","autumn foliage","snowman"]', 2, '단풍 means autumn foliage or fall colors.', 2),
    (l_id, '봄은 꽃구경하기 ___. (좋다/나쁘다)', '["좋아요","나빠요","힘들어요","불편해요"]', 0, 'Spring is good for flower viewing: 봄은 꽃구경하기 좋아요.', 3),
    (l_id, '계절___ 다른 활동을 즐겨요. 빈칸에 맞는 것은?', '["에","마다","에서","이"]', 1, 'N마다 means "every N" — 계절마다 = every season.', 4),
    (l_id, '겨울에 할 수 있는 활동은?', '["수영","꽃구경","스키","소풍"]', 2, 'Skiing (스키) is a winter activity.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 사계절이 뚜렷한 나라입니다. 봄에는 꽃이 피고 날씨가 따뜻해져서 꽃구경하기 좋습니다. 여름은 덥고 습하며 장마철이 있습니다. 하지만 바다에서 수영을 즐길 수 있는 계절이기도 합니다. 가을에는 단풍이 아름답고 등산하기 좋은 날씨가 계속됩니다. 겨울은 춥지만 눈이 내려 스키와 스노보드를 즐길 수 있습니다. 한국 사람들은 계절마다 다양한 활동을 즐기며 자연을 만끽합니다.', 'Korea is a country with four distinct seasons. In spring, flowers bloom and the weather becomes warm, making it great for flower viewing. Summer is hot and humid with a rainy season. However, it is also the season when you can enjoy swimming at the beach. In autumn, the fall foliage is beautiful and the weather is perfect for hiking. Winter is cold, but snow falls and you can enjoy skiing and snowboarding. Koreans enjoy various activities each season and make the most of nature.', 1);
END $$;

-- ============================================================
-- Lesson 53: Making Plans (약속하기)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 53;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=53 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '약속', 'yaksok', 'promise, appointment, plan', 1),
    (l_id, '만나다', 'mannada', 'to meet', 2),
    (l_id, '시간이 되다', 'sigan-i doeda', 'to be available', 3),
    (l_id, '편하다', 'pyeonhada', 'to be convenient', 4),
    (l_id, '취소하다', 'chwisohada', 'to cancel', 5),
    (l_id, '미루다', 'miruda', 'to postpone', 6),
    (l_id, '확인하다', 'hwagin-hada', 'to confirm', 7),
    (l_id, '어울리다', 'eoullida', 'to get together, to suit', 8),
    (l_id, '장소', 'jangso', 'place, location', 9),
    (l_id, '시간', 'sigan', 'time', 10),
    (l_id, '약속을 잡다', 'yaksok-eul japda', 'to make an appointment', 11),
    (l_id, '약속을 지키다', 'yaksok-eul jikida', 'to keep a promise', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)ㄹ까요?', 'Verb stem + (으)ㄹ까요?', 'Proposes an action together or asks for an opinion. Equivalent to "Shall we...?" or "Should we...?"', '[{"korean":"같이 영화 볼까요?","english":"Shall we watch a movie together?"},{"korean":"내일 만날까요?","english":"Shall we meet tomorrow?"}]', 1),
    (l_id, 'V-(으)ㄹ게요', 'Verb stem + (으)ㄹ게요', 'Expresses the speaker''s intention or promise to do something. "I will..."', '[{"korean":"제가 먼저 갈게요.","english":"I''ll go first."},{"korean":"내일까지 확인할게요.","english":"I''ll confirm by tomorrow."}]', 2),
    (l_id, 'N이/가 어때요?', 'Noun + 이/가 어때요?', 'Suggests something or asks what someone thinks about a noun. "How about N?"', '[{"korean":"토요일이 어때요?","english":"How about Saturday?"},{"korean":"저 카페가 어때요?","english":"How about that café?"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '수지', '이번 주말에 시간 있어요?', 'Ibeon jumal-e sigan isseoyo?', 'Are you free this weekend?', 1),
    (l_id, '준호', '토요일은 괜찮아요. 일요일은 좀 바빠요.', 'Toyoil-eun gwaenchanayo. Iryoil-eun jom bappayo.', 'Saturday is fine. Sunday I''m a bit busy.', 2),
    (l_id, '수지', '그럼 토요일에 같이 영화 볼까요?', 'Geureum toyoil-e gachi yeonghwa bolkkayo?', 'Then shall we watch a movie together on Saturday?', 3),
    (l_id, '준호', '좋아요! 몇 시가 편해요?', 'Joayo! Myeot si-ga pyeonhaeyo?', 'Sounds good! What time is convenient?', 4),
    (l_id, '수지', '오후 두 시는 어때요?', 'Ohu du si-neun eottaeyo?', 'How about 2 PM?', 5),
    (l_id, '준호', '좋아요. 어디서 만날까요?', 'Joayo. Eodiseo mannalkkayo?', 'Great. Where shall we meet?', 6),
    (l_id, '수지', '강남역 2번 출구에서 만나요. 제가 먼저 가서 기다릴게요.', 'Gangnam-yeok 2-beon chulgu-eseo mannayo. Jega meonjeo gaseo gidarilgeyo.', 'Let''s meet at exit 2 of Gangnam station. I''ll go ahead and wait.', 7),
    (l_id, '준호', '알겠어요. 약속 시간에 꼭 지킬게요!', 'Algesseoyo. Yaksok sigan-e kkok jikiilgeyo!', 'Got it. I''ll definitely be on time!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '같이 점심 ___? (제안하기)', '["먹어요","먹을까요","먹겠어요","먹었어요"]', 1, 'V-(으)ㄹ까요? is used to make suggestions: 먹을까요? = Shall we eat?', 1),
    (l_id, '''약속을 잡다''의 의미는?', '["to cancel a plan","to keep a promise","to make an appointment","to postpone"]', 2, '약속을 잡다 means to make/set up an appointment or plan.', 2),
    (l_id, '제가 내일까지 연락___. (약속)', '["해요","할게요","했어요","할까요"]', 1, 'V-(으)ㄹ게요 expresses the speaker''s promise or intention.', 3),
    (l_id, '토요일___ 어때요? 빈칸에 맞는 것은?', '["을","이","에","도"]', 1, 'N이/가 어때요? — 토요일 ends in a consonant so 이 is used: 토요일이 어때요?', 4),
    (l_id, '''취소하다''의 뜻은?', '["to confirm","to meet","to cancel","to postpone"]', 2, '취소하다 means to cancel.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 사람들에게 약속은 매우 중요합니다. 약속을 잡을 때는 먼저 상대방이 언제 시간이 되는지 물어봅니다. 그리고 만날 장소와 시간을 정합니다. 한국에서는 약속에 늦는 것을 실례로 여기기 때문에 시간을 잘 지키려고 노력합니다. 부득이하게 약속을 취소하거나 미뤄야 할 때는 미리 연락하는 것이 예의입니다. 친구들과 만날 때는 주로 음식점이나 카페를 약속 장소로 정합니다.', 'For Koreans, appointments and promises are very important. When making plans, you first ask the other person when they are available. Then you set the meeting place and time. In Korea, people try hard to be punctual because being late to an appointment is considered rude. When you must unavoidably cancel or postpone, it is polite to contact the other person in advance. When meeting friends, restaurants or cafés are commonly chosen as meeting places.', 1);
END $$;


-- ============================================================
-- Lesson 54: Comparing Things (비교하기)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 54;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=54 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '비교하다', 'bigyo-hada', 'to compare', 1),
    (l_id, '더', 'deo', 'more', 2),
    (l_id, '덜', 'deol', 'less', 3),
    (l_id, '훨씬', 'hwolssin', 'much more, by far', 4),
    (l_id, '비슷하다', 'biseutada', 'to be similar', 5),
    (l_id, '다르다', 'dareuda', 'to be different', 6),
    (l_id, '같다', 'gatda', 'to be the same', 7),
    (l_id, '반면에', 'banmyeon-e', 'on the other hand', 8),
    (l_id, '차이', 'chai', 'difference', 9),
    (l_id, '공통점', 'gongtongjeom', 'commonality', 10),
    (l_id, '장단점', 'jangdanjeom', 'advantages and disadvantages', 11),
    (l_id, '최고', 'choego', 'the best', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'A보다 B가 더 Adj', 'A + 보다 + B + 가/이 더 + Adjective', 'Compares A and B. Means "B is more [adjective] than A."', '[{"korean":"서울보다 부산이 더 따뜻해요.","english":"Busan is warmer than Seoul."},{"korean":"이 가방보다 저 가방이 더 싸요.","english":"That bag is cheaper than this bag."}]', 1),
    (l_id, 'A와/과 B이/가 비슷하다/다르다', 'A + 와/과 + B + 이/가 + 비슷하다/다르다', 'Expresses similarity or difference between A and B.', '[{"korean":"한국어와 일본어가 문법이 비슷해요.","english":"Korean and Japanese grammar are similar."},{"korean":"한국 문화와 미국 문화가 많이 달라요.","english":"Korean and American culture are very different."}]', 2),
    (l_id, 'N 중에서 제일/가장', 'N + 중에서 + 제일/가장 + Adjective', 'Expresses the superlative: "the most... among N."', '[{"korean":"이 중에서 제일 맛있는 게 뭐예요?","english":"Which is the most delicious among these?"},{"korean":"친구들 중에서 가장 키가 커요.","english":"Among friends, [he] is the tallest."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '아나', '한국어와 중국어 중 어느 것이 더 어려워요?', 'Hangugeo-wa junggugeo jung eoneu geosi deo eoryeowoyo?', 'Which is more difficult, Korean or Chinese?', 1),
    (l_id, '준', '제 생각에는 중국어가 한국어보다 훨씬 어려워요.', 'Je saenggak-e-neun junggugeo-ga Hangugeo-boda hwolssin eoryeowoyo.', 'I think Chinese is much more difficult than Korean.', 2),
    (l_id, '아나', '왜요? 한국어도 배우기 어렵지 않나요?', 'Waeyo? Hangugeodo baeug-i eoryeopji annayo?', 'Why? Isn''t Korean also difficult to learn?', 3),
    (l_id, '준', '네, 둘 다 어렵지만 한국어는 발음이 규칙적이에요. 중국어는 성조가 있어서 더 복잡해요.', 'Ne, dul da eoryeopjiman Hangugeo-neun bareum-i gyuchikjeogieyo. Junggugeo-neun seongjoga isseo-seo deo bokjapaeyo.', 'Yes, both are difficult, but Korean pronunciation is rule-based. Chinese is more complex because it has tones.', 4),
    (l_id, '아나', '그렇군요. 그럼 한국어와 일본어는 어때요?', 'Geureokgunyo. Geureum Hangugeo-wa Ilboneo-neun eottaeyo?', 'I see. Then how about Korean and Japanese?', 5),
    (l_id, '준', '한국어와 일본어는 문법 구조가 비슷해요. 그래서 일본어를 아는 사람은 한국어를 빨리 배울 수 있어요.', 'Hangugeo-wa Ilboneo-neun munbeop gujoga biseutaeyo. Geuraeseeo Ilboneo-reul aneun saram-eun Hangugeo-reul ppalli baeul su isseoyo.', 'Korean and Japanese have similar grammatical structures. So people who know Japanese can learn Korean quickly.', 6),
    (l_id, '아나', '정말요? 그런 공통점이 있군요!', 'Jeongmalyo? Geureon gongtongjeom-i ikkunyo!', 'Really? There are such commonalities!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '서울___ 부산이 더 따뜻해요. 빈칸에 맞는 것은?', '["에","보다","에서","이"]', 1, 'A보다 B가 더 Adj: A + 보다 marks the standard of comparison.', 1),
    (l_id, '비교급을 강조하는 부사는?', '["좀","훨씬","자주","매우"]', 1, '훨씬 means "much more/by far" and is used to intensify comparisons.', 2),
    (l_id, '''공통점''의 반대말은?', '["차이점","비슷한 점","장점","단점"]', 0, '공통점 (commonality) is the opposite of 차이점 (difference/distinction).', 3),
    (l_id, '이 과일들 중에서 ___ 맛있는 게 뭐예요?', '["더","제일","덜","많이"]', 1, 'N 중에서 제일/가장 is used for superlatives.', 4),
    (l_id, '한국어와 일본어는 문법이 ___. (similar)', '["달라요","같아요","비슷해요","복잡해요"]', 2, '비슷하다 means "to be similar."', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어와 영어는 여러 면에서 다릅니다. 한국어는 주어-목적어-동사 순서이지만, 영어는 주어-동사-목적어 순서입니다. 또한 한국어에는 조사가 있어서 단어의 역할을 표시하지만, 영어는 어순으로 역할을 나타냅니다. 반면에 두 언어 모두 주어를 생략할 수 있다는 공통점도 있습니다. 한국어는 영어보다 경어 체계가 훨씬 복잡합니다. 그러나 두 언어 모두 세계에서 중요한 언어입니다.', 'Korean and English differ in many ways. Korean follows Subject-Object-Verb order, while English follows Subject-Verb-Object order. Korean also uses particles to mark the role of words, whereas English uses word order. On the other hand, both languages share the commonality that subjects can be omitted. The honorific system in Korean is much more complex than in English. However, both languages are important languages in the world.', 1);
END $$;

-- ============================================================
-- Lesson 55: Requests and Permissions (요청과 허락)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 55;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=55 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '요청', 'yocheong', 'request', 1),
    (l_id, '허락', 'heollak', 'permission, approval', 2),
    (l_id, '부탁하다', 'butakhada', 'to ask a favor, to request', 3),
    (l_id, '허락하다', 'heollakada', 'to permit, to allow', 4),
    (l_id, '거절하다', 'geojeolhada', 'to refuse, to decline', 5),
    (l_id, '괜찮다', 'gwaenchantta', 'to be okay, to be fine', 6),
    (l_id, '죄송하다', 'joesonghada', 'to be sorry (formal)', 7),
    (l_id, '실례합니다', 'sillyehamnida', 'Excuse me (formal)', 8),
    (l_id, '혹시', 'hoksi', 'by any chance, perhaps', 9),
    (l_id, '가능하다', 'ganeunghada', 'to be possible', 10),
    (l_id, '도움', 'doum', 'help, assistance', 11),
    (l_id, '감사하다', 'gamsahada', 'to be thankful', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-아/어 주세요', 'Verb stem + 아/어 주세요', 'Politely asks someone to do something for you. "Please do..."', '[{"korean":"사진 찍어 주세요.","english":"Please take a photo."},{"korean":"천천히 말해 주세요.","english":"Please speak slowly."}]', 1),
    (l_id, 'V-아/어도 돼요?', 'Verb stem + 아/어도 돼요?', 'Asks for permission to do something. "May I...?" or "Is it okay if I...?"', '[{"korean":"여기 앉아도 돼요?","english":"May I sit here?"},{"korean":"사진을 찍어도 돼요?","english":"May I take a photo?"}]', 2),
    (l_id, 'V-아/어도 돼요 / V-(으)면 안 돼요', 'Verb stem + 아/어도 돼요 / (으)면 안 돼요', 'Grants or denies permission. "You may..." / "You must not..."', '[{"korean":"네, 앉아도 돼요.","english":"Yes, you may sit."},{"korean":"여기서 담배를 피우면 안 돼요.","english":"You must not smoke here."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '손님', '실례합니다. 여기 앉아도 돼요?', 'Sillyehamnida. Yeogi anja-do dwaeyo?', 'Excuse me. May I sit here?', 1),
    (l_id, '직원', '네, 물론이죠. 앉으세요.', 'Ne, mullonjyo. Anjeuseyo.', 'Of course. Please sit down.', 2),
    (l_id, '손님', '감사합니다. 혹시 메뉴판 좀 가져다 주실 수 있어요?', 'Gamsahamnida. Hoksi menyupan jom gajyeoda jusil su isseoyo?', 'Thank you. Could you by any chance bring me the menu?', 3),
    (l_id, '직원', '네, 잠깐 기다려 주세요. 바로 가져다 드릴게요.', 'Ne, jamkkan gidaryeo juseyo. Baro gajyeoda deurilgeyo.', 'Yes, please wait a moment. I''ll bring it right away.', 4),
    (l_id, '손님', '그리고 사진을 찍어도 돼요? 음식이 예뻐서요.', 'Geurigo sajin-eul jjigeo-do dwaeyo? Eumsigi yeppeo-seoyo.', 'And may I take photos? The food looks so pretty.', 5),
    (l_id, '직원', '네, 당연히 찍으셔도 됩니다. 단, 다른 손님들이 나오면 안 돼요.', 'Ne, dangyeonhi jjigeu-syeodo doeumnida. Dan, dareun sonnimdeu-ri naomyeon an dwaeyo.', 'Yes, of course you may. However, other guests must not appear in the photo.', 6),
    (l_id, '손님', '알겠습니다. 부탁이 하나 더 있는데요. 창가 자리로 바꿀 수 있을까요?', 'Algesseumnida. Butagi hana deo inneun-deyo. Changga jari-ro bakkul su isseulkkayo?', 'Understood. I have one more request. Could I change to a window seat?', 7),
    (l_id, '직원', '죄송합니다. 지금은 창가 자리가 다 찼어요.', 'Joesonghamnida. Jigeum-eun changga jari-ga da chasseoyo.', 'I''m sorry. The window seats are all full right now.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '창문 좀 열어 ___. (please open)', '["줄게요","주세요","줄까요","주었어요"]', 1, 'V-아/어 주세요 is the polite request form.', 1),
    (l_id, '여기서 사진 찍어___? (asking permission)', '["야 해요","도 돼요","면 안 돼요","줄게요"]', 1, 'V-아/어도 돼요? asks for permission.', 2),
    (l_id, '도서관에서 큰 소리로 말하___ 안 돼요.', '["아도","지만","면","도"]', 2, '-(으)면 안 돼요 expresses prohibition.', 3),
    (l_id, '''거절하다''의 반대말은?', '["요청하다","부탁하다","허락하다","감사하다"]', 2, '거절하다 (to refuse) is the opposite of 허락하다 (to permit/allow).', 4),
    (l_id, '혹시 도와___? 가장 자연스러운 표현은?', '["줄까요","주세요","주었어요","줄게요"]', 0, '혹시 + V-(으)ㄹ까요? is a polite way to offer help.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국에서는 누군가에게 부탁할 때 보통 ''혹시''라는 말을 앞에 붙입니다. 이 표현은 상대방에게 부담을 덜 주기 위한 배려입니다. 허락을 구할 때는 ''-아/어도 돼요?''를 사용하고, 허락을 줄 때는 ''-아/어도 돼요''라고 답합니다. 반대로 금지할 때는 ''-(으)면 안 돼요''를 사용합니다. 공공장소에서는 다른 사람들에게 방해가 되지 않도록 조심해야 합니다. 한국 문화에서 정중하게 요청하고 허락을 구하는 것은 중요한 예절입니다.', 'In Korea, when asking someone a favor, people usually add the word ''hoksi'' (by any chance) in front. This expression is a consideration to put less burden on the other person. When seeking permission, you use ''-a/eo-do dwaeyo?'' and when granting permission, you reply ''-a/eo-do dwaeyo.'' Conversely, to express prohibition, you use ''-(eu)myeon an dwaeyo.'' In public places, you must be careful not to disturb others. In Korean culture, politely making requests and seeking permission is an important form of etiquette.', 1);
END $$;


-- ============================================================
-- Lesson 56: At the Bank (은행에서)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 56;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=56 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '은행', 'eunhaeng', 'bank', 1),
    (l_id, '계좌', 'gyejwa', 'bank account', 2),
    (l_id, '입금', 'ipgeum', 'deposit', 3),
    (l_id, '출금', 'chulgeum', 'withdrawal', 4),
    (l_id, '송금', 'songgeum', 'wire transfer', 5),
    (l_id, '환전', 'hwanjeon', 'currency exchange', 6),
    (l_id, '잔액', 'janaek', 'balance', 7),
    (l_id, '통장', 'tongjang', 'bankbook, passbook', 8),
    (l_id, '신분증', 'sinbunjeung', 'ID card', 9),
    (l_id, '비밀번호', 'bimilbeonho', 'PIN, password', 10),
    (l_id, '이자', 'ija', 'interest', 11),
    (l_id, '대출', 'daechul', 'loan', 12),
    (l_id, '현금', 'hyeongeum', 'cash', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-으려고 하다', 'Verb stem + (으)려고 하다', 'Expresses intention to do something. "I intend to / I''m going to..."', '[{"korean":"계좌를 만들려고 해요.","english":"I intend to open an account."},{"korean":"돈을 송금하려고 왔어요.","english":"I came to transfer money."}]', 1),
    (l_id, 'V-는 데 필요한 것', 'Verb stem + 는 데 필요한 것', 'Expresses what is needed for a particular purpose.', '[{"korean":"계좌를 만드는 데 신분증이 필요해요.","english":"An ID is needed to open an account."},{"korean":"환전하는 데 시간이 걸려요.","english":"It takes time to exchange currency."}]', 2),
    (l_id, 'N 좀 V-아/어 주세요', 'N + 좀 + V-아/어 주세요', 'Politely requests service, adding 좀 to soften the request.', '[{"korean":"잔액 좀 확인해 주세요.","english":"Please check my balance."},{"korean":"이 돈 좀 환전해 주세요.","english":"Please exchange this money."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '직원', '어서 오세요. 어떻게 도와드릴까요?', 'Eoseo oseyo. Eotteoke dowadeurilkkayo?', 'Welcome. How may I help you?', 1),
    (l_id, '고객', '새 계좌를 만들려고 하는데요.', 'Sae gyejwa-reul mandeulyeogo haneundeyo.', 'I''d like to open a new account.', 2),
    (l_id, '직원', '신분증이 있으세요?', 'Sinbunjeung-i isseuseyo?', 'Do you have your ID?', 3),
    (l_id, '고객', '네, 여기 있어요. 그리고 환전도 하고 싶어요.', 'Ne, yeogi isseoyo. Geurigo hwanjeon-do hago sipeoyo.', 'Yes, here it is. I also want to exchange currency.', 4),
    (l_id, '직원', '어느 나라 돈으로 환전하시겠어요?', 'Eoneu nara don-euro hwanjeon-hasi-gesseoyo?', 'Which currency would you like to exchange to?', 5),
    (l_id, '고객', '달러를 원으로 환전하고 싶어요. 오늘 환율이 어떻게 돼요?', 'Dalleo-reul won-euro hwanjeong-hago sipeoyo. Oneul hwanyul-i eotteoke dwaeyo?', 'I want to exchange dollars to won. What''s today''s exchange rate?', 6),
    (l_id, '직원', '오늘 환율은 1달러에 1,320원입니다.', 'Oneul hwanyul-eun 1-dalleo-e 1,320won-imnida.', 'Today''s exchange rate is 1,320 won per dollar.', 7),
    (l_id, '고객', '알겠습니다. 그럼 잔액도 좀 확인해 주세요.', 'Algesseumnida. Geureum janaek-do jom hwagin-hae juseyo.', 'I see. Then please also check my balance.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '은행에서 돈을 넣는 행위는?', '["출금","환전","입금","대출"]', 2, '입금 means depositing money into an account.', 1),
    (l_id, '계좌를 만드___ 신분증이 필요해요.', '["는 데","ㄹ 때","면서","고 싶어"]', 0, 'V-는 데 필요하다 expresses what is needed for a purpose.', 2),
    (l_id, '달러를 원으로 바꾸는 것은?', '["입금","출금","송금","환전"]', 3, '환전 means currency exchange.', 3),
    (l_id, '''잔액''의 의미는?', '["interest","loan","balance","deposit"]', 2, '잔액 means account balance.', 4),
    (l_id, '계좌를 만들___ 해요. 빈칸?', '["고 싶어","려고","기 위해","아/어서"]', 1, 'V-(으)려고 하다 expresses intention.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국의 은행은 평일 오전 9시부터 오후 4시까지 운영합니다. 계좌를 만들려면 신분증과 도장이 필요합니다. 외국인은 외국인등록증이 필요합니다. 은행에서는 입금, 출금, 송금, 환전 등의 서비스를 이용할 수 있습니다. 요즘은 스마트폰 앱을 통해 많은 은행 업무를 집에서도 할 수 있습니다. 현금자동입출금기(ATM)는 24시간 이용할 수 있어 편리합니다.', 'Korean banks operate on weekdays from 9 AM to 4 PM. To open an account, you need an ID and a personal seal. Foreigners need their alien registration card. At the bank, you can use services such as deposits, withdrawals, wire transfers, and currency exchange. Nowadays, many banking tasks can be done at home through smartphone apps. ATMs (cash automatic deposit/withdrawal machines) are convenient as they are available 24 hours.', 1);
END $$;

-- ============================================================
-- Lesson 57: At the Post Office (우체국에서)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 57;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=57 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '우체국', 'ucheguk', 'post office', 1),
    (l_id, '편지', 'pyeonji', 'letter', 2),
    (l_id, '소포', 'sopo', 'package, parcel', 3),
    (l_id, '우표', 'upyo', 'stamp', 4),
    (l_id, '봉투', 'bongtu', 'envelope', 5),
    (l_id, '주소', 'juso', 'address', 6),
    (l_id, '보내다', 'bonaeda', 'to send', 7),
    (l_id, '받다', 'batda', 'to receive', 8),
    (l_id, '배달', 'baedal', 'delivery', 9),
    (l_id, '국제', 'gukje', 'international', 10),
    (l_id, '등기', 'deunggi', 'registered mail', 11),
    (l_id, '배송비', 'baesongbi', 'shipping cost', 12),
    (l_id, '도착하다', 'dochakada', 'to arrive', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N까지 얼마나 걸려요?', 'N + 까지 얼마나 걸려요?', 'Asks how long it takes to get to a destination.', '[{"korean":"미국까지 얼마나 걸려요?","english":"How long does it take to get to America?"},{"korean":"배달까지 며칠 걸릴까요?","english":"How many days will delivery take?"}]', 1),
    (l_id, 'V-는 데 얼마예요?', 'V-는 데 + 얼마예요?', 'Asks the cost of doing something.', '[{"korean":"이걸 보내는 데 얼마예요?","english":"How much does it cost to send this?"},{"korean":"등기로 보내는 데 얼마나 해요?","english":"How much is it to send by registered mail?"}]', 2),
    (l_id, 'V-아/어 드릴까요?', 'Verb stem + 아/어 드릴까요?', 'Offers to do something for someone (honorific). "Shall I do... for you?"', '[{"korean":"포장해 드릴까요?","english":"Shall I wrap it for you?"},{"korean":"주소를 적어 드릴까요?","english":"Shall I write down the address for you?"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '직원', '안녕하세요. 무엇을 도와드릴까요?', 'Annyeonghaseyo. Mueoseul dowadeurilkkayo?', 'Hello. How may I help you?', 1),
    (l_id, '고객', '이 소포를 미국으로 보내고 싶어요.', 'I sopo-reul migugeuro bonaego sipeoyo.', 'I''d like to send this package to the United States.', 2),
    (l_id, '직원', '일반 우편으로 보내시겠어요, 아니면 빠른 우편으로?', 'Ilban upyeon-euro bonaesi-gesseoyo, animyeon ppareun upyeon-euro?', 'Would you like to send it regular mail or express?', 3),
    (l_id, '고객', '빠른 게 좋겠어요. 얼마나 걸려요?', 'Ppareun ge jo-kesseoyo. Eolmana geollyeoyo?', 'I''d prefer faster. How long does it take?', 4),
    (l_id, '직원', '빠른 우편으로 미국까지 보통 3-5일 걸려요.', 'Ppareun upyeon-euro miguk-kkaji botong 3-5il geollyeoyo.', 'Express mail to the United States usually takes 3-5 days.', 5),
    (l_id, '고객', '보내는 데 얼마예요?', 'Bonaeneun de eolmaeyo?', 'How much does it cost to send?', 6),
    (l_id, '직원', '무게에 따라 다른데요. 좀 달아볼게요. 25,000원입니다.', 'Muge-e ttara dareundeyo. Jom darabol-geyo. Isamo-won-imnida.', 'It varies by weight. Let me weigh it. It''s 25,000 won.', 7),
    (l_id, '고객', '알겠어요. 그리고 영수증 주세요.', 'Algesseoyo. Geurigo yeongsujeung juseyo.', 'I see. And please give me a receipt.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '우체국에서 편지나 소포를 보낼 때 필요한 것은?', '["신분증","우표와 봉투","여권","통장"]', 1, 'Stamps (우표) and envelopes (봉투) are needed to send letters.', 1),
    (l_id, '이걸 보내___ 얼마예요? (비용 묻기)', '["ㄴ 데","는 데","는 것에","기 위해"]', 1, 'V-는 데 얼마예요? asks the cost of doing something.', 2),
    (l_id, '등기 우편의 특징은?', '["배달이 빠르다","분실 위험이 없다","배송 추적이 가능하다","모두 맞다"]', 3, '등기 (registered mail) offers tracking and reduced risk of loss.', 3),
    (l_id, '''배달''과 비슷한 의미는?', '["shipping","receipt","address","stamp"]', 0, '배달 means delivery, similar to shipping.', 4),
    (l_id, '포장해 드릴___? (제공하다)', '["까요","게요","겠어요","어요"]', 0, 'V-아/어 드릴까요? offers to do something for someone.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '우체국은 편지와 소포를 보내고 받는 곳입니다. 한국의 우체국은 다양한 서비스를 제공합니다. 국내뿐만 아니라 해외로도 물건을 보낼 수 있습니다. 빠른 배송을 원하면 빠른 우편 서비스를 이용하면 됩니다. 등기 우편은 배송 추적이 가능해서 중요한 서류를 보낼 때 유용합니다. 요즘은 우체국 쇼핑몰을 통해 다양한 상품도 구매할 수 있습니다. 우체국에서 일부 금융 서비스도 이용할 수 있어서 편리합니다.', 'The post office is a place where you send and receive letters and packages. Korean post offices offer a variety of services. You can send items not only domestically but also internationally. If you want fast delivery, you can use the express mail service. Registered mail allows delivery tracking, which is useful when sending important documents. These days, you can also purchase various products through the post office shopping mall. It is also convenient because some financial services are available at the post office.', 1);
END $$;


-- ============================================================
-- Lesson 58: Korean Cuisine Deep Dive (한국 음식 심화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 58;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=58 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '된장찌개', 'doenjang jjigae', 'soybean paste stew', 1),
    (l_id, '비빔밥', 'bibimbap', 'mixed rice bowl', 2),
    (l_id, '삼겹살', 'samgyeopsal', 'grilled pork belly', 3),
    (l_id, '떡볶이', 'tteokbokki', 'spicy rice cakes', 4),
    (l_id, '삼계탕', 'samgyetang', 'ginseng chicken soup', 5),
    (l_id, '갈비', 'galbi', 'short ribs', 6),
    (l_id, '양념', 'yangnyeom', 'seasoning, marinade', 7),
    (l_id, '매콤하다', 'maekkomhada', 'to be spicy-sweet', 8),
    (l_id, '발효', 'balhyo', 'fermentation', 9),
    (l_id, '재료', 'jaeryo', 'ingredient', 10),
    (l_id, '조리법', 'joribeop', 'recipe, cooking method', 11),
    (l_id, '식감', 'sikgam', 'texture (of food)', 12),
    (l_id, '간장', 'ganjang', 'soy sauce', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N로/으로 만들다', 'Noun + 로/으로 만들다', 'Expresses what something is made from/with.', '[{"korean":"김치는 배추로 만들어요.","english":"Kimchi is made from cabbage."},{"korean":"된장은 콩으로 만든 발효 식품이에요.","english":"Doenjang is a fermented food made from soybeans."}]', 1),
    (l_id, 'V-아/어서 먹다', 'Verb stem + 아/어서 먹다', 'Describes how food is prepared before eating.', '[{"korean":"밥에 여러 가지를 넣어서 비벼 먹어요.","english":"You mix various things into rice and eat it together."},{"korean":"고기를 구워서 먹어요.","english":"You grill the meat and eat it."}]', 2),
    (l_id, 'A-기로 유명하다', 'Adjective + 기로 유명하다', 'Expresses that something is famous for a particular quality.', '[{"korean":"한국 음식은 맵기로 유명해요.","english":"Korean food is famous for being spicy."},{"korean":"삼계탕은 몸에 좋기로 유명해요.","english":"Samgyetang is famous for being good for your health."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '마리아', '오늘 점심으로 뭘 먹을까요?', 'Oneul jeomsim-euro mwol meogeulkkayo?', 'What shall we eat for lunch today?', 1),
    (l_id, '지호', '비빔밥 어때요? 한국 음식 중에서 제일 건강에 좋아요.', 'Bibimbap eottaeyo? Hanguk eumsik jung-eseo jeil geongange joayo.', 'How about bibimbap? Among Korean foods, it''s the best for your health.', 2),
    (l_id, '마리아', '비빔밥이 어떤 음식이에요?', 'Bibimbap-i eotteon eumsik-ieyo?', 'What kind of food is bibimbap?', 3),
    (l_id, '지호', '밥에 여러 가지 나물과 고기를 넣고 고추장으로 비벼 먹는 음식이에요.', 'Bab-e yeoreo gaji namul-gwa gogi-reul neokgo gochujang-euro bibyeo meongneun eumsik-ieyo.', 'It''s a dish where you mix rice with various vegetables and meat using red pepper paste.', 4),
    (l_id, '마리아', '맛있겠다! 한국 음식은 맵기로 유명하던데 너무 맵지 않아요?', 'Masissgekda! Hanguk eumsik-eun maepgiro yuMyeonghandende neomu maepji anayo?', 'That sounds delicious! Korean food is famous for being spicy — is it not too spicy?', 5),
    (l_id, '지호', '조절할 수 있어요. 고추장을 조금만 넣으면 덜 매워요.', 'Jojeol-hal su isseoyo. Gochujang-eul jogeumman neoeumyeon deol maeoyo.', 'You can adjust it. If you add just a little red pepper paste, it''s less spicy.', 6),
    (l_id, '마리아', '그리고 삼겹살도 먹어보고 싶어요!', 'Geurigo samgyeopsal-do meogeobogo sipeoyo!', 'And I also want to try samgyeopsal!', 7),
    (l_id, '지호', '그건 저녁에 먹어요. 삼겹살은 구워서 먹는 건데 아주 맛있어요.', 'Geugeon jeonyeok-e meogeyo. Samgyeopsal-eun guwo-seo meongneun geonde aju masiseoyo.', 'Let''s have that for dinner. Samgyeopsal is grilled and eaten — it''s very delicious.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '김치의 주재료는?', '["당근","배추","오이","무"]', 1, 'Kimchi is primarily made from napa cabbage (배추).', 1),
    (l_id, '된장은 ___ 만든 발효 식품입니다.', '["밀로","콩으로","쌀로","고추로"]', 1, '된장 (soybean paste) is made from soybeans (콩).', 2),
    (l_id, '한국 음식은 ___ 유명해요. (spicy)', '["맵기로","매운데","맵지만","매워서"]', 0, 'A-기로 유명하다 = famous for being [adjective].', 3),
    (l_id, '비빔밥에 대한 설명으로 맞는 것은?', '["국물이 있는 음식이다","국수 요리다","밥에 나물과 고기를 넣고 비벼 먹는다","발효 음식이다"]', 2, 'Bibimbap is mixed rice with vegetables and meat.', 4),
    (l_id, '''발효''의 의미는?', '["recipe","seasoning","fermentation","texture"]', 2, '발효 means fermentation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 음식은 다양한 재료와 조리법으로 만들어집니다. 김치, 된장, 간장 같은 발효 식품이 한국 식문화의 핵심입니다. 비빔밥은 밥 위에 여러 나물과 고기를 올리고 고추장으로 비벼 먹는 건강식입니다. 삼겹살은 돼지고기를 직접 구워서 채소와 함께 싸 먹는 인기 음식입니다. 된장찌개는 된장을 베이스로 두부, 채소 등을 넣어 끓인 국물 요리입니다. 한국 음식은 맵고 짜기로 알려져 있지만 지역마다 맛이 다양합니다.', 'Korean food is made with diverse ingredients and cooking methods. Fermented foods like kimchi, doenjang, and ganjang are the core of Korean food culture. Bibimbap is a healthy dish made by mixing various vegetables and meat over rice with red pepper paste. Samgyeopsal is a popular food where pork belly is directly grilled and eaten wrapped with vegetables. Doenjang jjigae is a broth dish made by boiling tofu and vegetables in a doenjang base. Korean food is known for being spicy and salty, but flavors vary by region.', 1);
END $$;

-- ============================================================
-- Lesson 59: At the Market (시장에서)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 59;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=59 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '시장', 'sijang', 'market', 1),
    (l_id, '가격', 'gagyeok', 'price', 2),
    (l_id, '흥정하다', 'heungjeong-hada', 'to bargain, to haggle', 3),
    (l_id, '신선하다', 'sinseon-hada', 'to be fresh', 4),
    (l_id, '무게', 'muge', 'weight', 5),
    (l_id, '한 근', 'han geun', 'unit of weight (600g)', 6),
    (l_id, '묶음', 'mukeum', 'bundle, bunch', 7),
    (l_id, '저울', 'jeoul', 'scale, weighing device', 8),
    (l_id, '할인', 'harin', 'discount', 9),
    (l_id, '단골', 'dangol', 'regular customer', 10),
    (l_id, '드리다', 'deurida', 'to give (honorific)', 11),
    (l_id, '구경하다', 'gugyeong-hada', 'to browse, to look around', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 얼마예요?', 'N + 에 + 얼마예요?', 'Asks the price per quantity unit.', '[{"korean":"사과 한 개에 얼마예요?","english":"How much is one apple?"},{"korean":"이거 한 근에 얼마예요?","english":"How much is this per geun?"}]', 1),
    (l_id, 'N 좀 깎아 주세요', 'N + 좀 깎아 주세요', 'Politely asks for a discount.', '[{"korean":"좀 깎아 주세요.","english":"Please give me a discount."},{"korean":"만 원만 해 주세요.","english":"Please make it 10,000 won."}]', 2),
    (l_id, 'V-(으)면 V-아/어 줄게요', 'V-(으)면 + V-아/어 줄게요', 'A conditional promise: "If you..., I will..."', '[{"korean":"많이 사면 싸게 드릴게요.","english":"If you buy a lot, I''ll give it to you cheaply."},{"korean":"내일 또 오면 서비스로 드릴게요.","english":"If you come again tomorrow, I''ll give you a freebie."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '손님', '이 사과 한 개에 얼마예요?', 'I sagwa han gae-e eolmaeyo?', 'How much is one of these apples?', 1),
    (l_id, '상인', '한 개에 2,000원이에요. 근데 세 개 사시면 5,000원에 드릴게요.', 'Han gae-e i-cheonwon-ieyo. Geunde se gae sasimyeon o-cheonwon-e deurilgeyo.', 'One is 2,000 won. But if you buy three, I''ll give them to you for 5,000 won.', 2),
    (l_id, '손님', '그래요? 좀 더 깎아 주세요. 단골이거든요.', 'Geuraeyo? Jom deo kkakka juseyo. Dangol-igeodeunyo.', 'Really? Please discount a bit more. I''m a regular customer, you see.', 3),
    (l_id, '상인', '그러면 4,500원에 드릴게요. 이건 정말 신선해요, 오늘 아침에 들어온 거예요.', 'Geureomyeon sa-cheon-o-baek-won-e deurilgeyo. Igeon jeongmal sinseongaeyo, oneul achim-e deureo-on geoyeyo.', 'Then I''ll give you three for 4,500 won. These are really fresh — they came in this morning.', 4),
    (l_id, '손님', '그럼 세 개 살게요. 그리고 저 딸기도 얼마예요?', 'Geureum se gae salgeyo. Geurigo jeo ttalgi-do eolmaeyo?', 'Then I''ll buy three. And how much are those strawberries?', 5),
    (l_id, '상인', '딸기는 한 팩에 6,000원이에요. 두 팩 사시면 10,000원에 드려요.', 'Ttalgi-neun han paek-e yuk-cheonwon-ieyo. Du paek sasimyeon man-won-e deuryeoyo.', 'Strawberries are 6,000 won per pack. If you buy two packs, I''ll give them for 10,000 won.', 6),
    (l_id, '손님', '좋아요, 딸기 두 팩도 살게요. 모두 얼마예요?', 'Joayo, ttalgi du paek-do salgeyo. Modu eolmaeyo?', 'Good, I''ll take two packs of strawberries too. How much is everything?', 7),
    (l_id, '상인', '다 합해서 14,500원이에요. 또 오세요!', 'Da haphaeseo man-sa-cheon-o-baek-won-ieyo. Tto oseyo!', 'All together it''s 14,500 won. Please come again!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '시장에서 가격을 낮춰 달라고 하는 것은?', '["주문하다","흥정하다","구경하다","배달하다"]', 1, '흥정하다 means to bargain or haggle over the price.', 1),
    (l_id, '사과 한 개___ 얼마예요?', '["에서","에","으로","이"]', 1, 'N에 얼마예요? asks the unit price with 에.', 2),
    (l_id, '많이 사___ 싸게 드릴게요.', '["면","서","고","지만"]', 0, 'V-(으)면 makes a conditional: "if you buy a lot."', 3),
    (l_id, '''단골''의 의미는?', '["salesperson","fresh produce","regular customer","bargain"]', 2, '단골 means a regular or loyal customer.', 4),
    (l_id, '전통 시장의 특징이 아닌 것은?', '["흥정이 가능하다","신선한 식품을 판다","가격이 고정되어 있다","다양한 상품이 있다"]', 2, 'A defining feature of traditional markets is that prices are negotiable, not fixed.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국의 전통 시장은 생동감 넘치는 곳입니다. 신선한 채소, 과일, 해산물, 고기 등 다양한 식품을 살 수 있습니다. 마트와 달리 시장에서는 흥정이 가능합니다. 단골 손님이 되면 상인이 서비스로 더 주거나 할인을 해주기도 합니다. 광장시장, 남대문시장, 동대문시장은 서울에서 유명한 전통 시장입니다. 시장에서는 다양한 먹거리도 즐길 수 있어서 관광객들에게도 인기가 높습니다.', 'Korea''s traditional markets are lively places. You can buy a variety of foods including fresh vegetables, fruits, seafood, and meat. Unlike supermarkets, bargaining is possible in traditional markets. If you become a regular customer, merchants may give you extra as a freebie or offer a discount. Gwangjang Market, Namdaemun Market, and Dongdaemun Market are famous traditional markets in Seoul. You can also enjoy various street foods at markets, making them popular with tourists as well.', 1);
END $$;


-- ============================================================
-- Lesson 60: Giving Advice (조언하기)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 60;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=60 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '조언', 'joen', 'advice', 1),
    (l_id, '충고', 'chunggo', 'advice, admonition', 2),
    (l_id, '추천하다', 'chucheonhada', 'to recommend', 3),
    (l_id, '제안하다', 'jeanhada', 'to suggest', 4),
    (l_id, '고민', 'gomin', 'worry, concern', 5),
    (l_id, '해결하다', 'haegyeolhada', 'to solve, to resolve', 6),
    (l_id, '시도하다', 'sidohada', 'to try, to attempt', 7),
    (l_id, '경험', 'gyeongheom', 'experience', 8),
    (l_id, '도움이 되다', 'doumi doeda', 'to be helpful', 9),
    (l_id, '따르다', 'ttareuda', 'to follow', 10),
    (l_id, '문제', 'munje', 'problem, issue', 11),
    (l_id, '스트레스', 'seuteuresseu', 'stress', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-는 게 좋겠어요', 'Verb stem + 는/은 게 좋겠어요', 'Gives advice: "It would be good to..." Softer than a direct command.', '[{"korean":"운동을 좀 하는 게 좋겠어요.","english":"It would be good to exercise a bit."},{"korean":"일찍 자는 게 좋겠어요.","english":"It would be good to sleep early."}]', 1),
    (l_id, 'V-아/어 보세요', 'Verb stem + 아/어 보세요', 'Suggests trying something: "Please try doing..."', '[{"korean":"이 방법을 써 보세요.","english":"Please try this method."},{"korean":"한국 드라마를 봐 보세요.","english":"Try watching Korean dramas."}]', 2),
    (l_id, 'V-(으)면 어때요?', 'Verb stem + (으)면 어때요?', 'Makes a gentle suggestion: "How about doing...?"', '[{"korean":"잠깐 쉬면 어때요?","english":"How about taking a short rest?"},{"korean":"선생님께 물어보면 어때요?","english":"How about asking the teacher?"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '현우', '요즘 한국어 공부가 너무 어려워요. 어떻게 하면 잘 할 수 있을까요?', 'Yojeum Hangugeogo gongbu-ga neomu eoryeowoyo. Eotteoke hamyeon jal hal su isseulkkayo?', 'Korean study is so difficult these days. How can I do it well?', 1),
    (l_id, '선생님', '매일 꾸준히 공부하는 게 중요해요. 조금씩이라도 매일 하는 게 좋겠어요.', 'Maeil kkujunhi gongbu-haneun ge jungyohaeyo. Jogeumssik-iramo maeil haneun ge jo-kesseoyo.', 'It''s important to study consistently every day. It would be good to do it every day, even just a little.', 2),
    (l_id, '현우', '어떤 방법이 가장 도움이 될까요?', 'Eotteon bangbeop-i gajang doumi doelkkayo?', 'What method would be most helpful?', 3),
    (l_id, '선생님', '한국 드라마를 봐 보세요. 자연스럽게 듣기 실력이 향상될 거예요.', 'Hanguk deurama-reul bwa boseyo. Jayeonseureobge deutgi sillyeok-i hyangsangdoel geoyeyo.', 'Try watching Korean dramas. Your listening ability will naturally improve.', 4),
    (l_id, '현우', '그거 좋은 생각이네요! 다른 방법은요?', 'Geugeo joeun saengak-ineyo! Dareun bangbeob-eunyo?', 'That''s a good idea! What about other methods?', 5),
    (l_id, '선생님', '한국인 친구를 사귀면 어때요? 실제 대화를 통해 배울 수 있어요.', 'Hanguk-in chingu-reul sagwimyeon eottaeyo? Silje daehwa-reul tonghae baeul su isseoyo.', 'How about making Korean friends? You can learn through real conversations.', 6),
    (l_id, '현우', '그것도 좋은 조언이에요. 감사합니다!', 'Geugot-do joeun joen-ieyo. Gamsahamnida!', 'That''s also great advice. Thank you!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국어 실력을 늘리고 싶어요. (advice: watch dramas)', '["드라마를 봐 보세요","드라마를 봤어요","드라마를 볼까요","드라마를 보겠어요"]', 0, 'V-아/어 보세요 suggests trying something.', 1),
    (l_id, '피곤하면 잠깐 쉬___ 어때요?', '["서","면","고","지만"]', 1, 'V-(으)면 어때요? makes a gentle suggestion.', 2),
    (l_id, '매일 운동하___ 좋겠어요.', '["는 게","ㄹ 게","고 싶어","아서"]', 0, 'V-는 게 좋겠어요 gives advice.', 3),
    (l_id, '''고민''의 의미는?', '["experience","advice","worry/concern","solution"]', 2, '고민 means a worry or concern.', 4),
    (l_id, '조언을 구할 때 가장 적절한 표현은?', '["어떻게 하면 좋을까요?","어떻게 했어요?","어떻게 할 거예요?","어떻게 했겠어요?"]', 0, '어떻게 하면 좋을까요? is the natural way to ask for advice.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어를 잘 배우려면 꾸준한 노력이 필요합니다. 전문가들은 매일 조금씩이라도 공부하는 것이 중요하다고 조언합니다. 한국 드라마나 음악을 통해 자연스럽게 언어를 접하는 것도 좋은 방법입니다. 언어 교환 파트너를 구해서 실제 대화 연습을 하는 것도 추천합니다. 실수를 두려워하지 않고 적극적으로 말하는 연습을 하는 게 좋겠습니다. 꾸준히 노력하다 보면 어느 날 갑자기 실력이 늘었다는 것을 느낄 수 있습니다.', 'To learn Korean well, consistent effort is necessary. Experts advise that it is important to study a little every day. Naturally engaging with the language through Korean dramas or music is also a good method. It is also recommended to find a language exchange partner and practice real conversations. It would be good to practice speaking actively without being afraid of making mistakes. If you keep making consistent efforts, one day you will suddenly feel that your skills have improved.', 1);
END $$;

-- ============================================================
-- Lesson 61: Expressing Opinions (의견 말하기)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 61;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=61 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '의견', 'uigyon', 'opinion', 1),
    (l_id, '생각', 'saenggak', 'thought, idea', 2),
    (l_id, '주장하다', 'jujang-hada', 'to assert, to argue', 3),
    (l_id, '동의하다', 'dong-uihada', 'to agree', 4),
    (l_id, '반대하다', 'bandaehada', 'to oppose, to disagree', 5),
    (l_id, '찬성하다', 'chanseong-hada', 'to be in favor of', 6),
    (l_id, '이유', 'iyu', 'reason', 7),
    (l_id, '근거', 'geungeo', 'basis, grounds, evidence', 8),
    (l_id, '예를 들면', 'ye-reul deulmyeon', 'for example', 9),
    (l_id, '확실하다', 'hwaksilhada', 'to be certain', 10),
    (l_id, '불확실하다', 'bulhwaksilhada', 'to be uncertain', 11),
    (l_id, '결론', 'gyeolllon', 'conclusion', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N/V-다고 생각해요', 'N/Verb clause + (이)라고/다고 생각해요', 'Expresses one''s opinion or belief about something.', '[{"korean":"그 생각이 옳다고 생각해요.","english":"I think that idea is right."},{"korean":"더 노력해야 한다고 생각해요.","english":"I think we need to make more effort."}]', 1),
    (l_id, '제 생각에는 / 제 의견으로는', '제 생각에는 + clause / 제 의견으로는 + clause', 'Introduces a personal opinion: "In my opinion..." or "As I see it..."', '[{"korean":"제 생각에는 이 방법이 더 효율적이에요.","english":"In my opinion, this method is more efficient."},{"korean":"제 의견으로는 환경 보호가 중요해요.","english":"In my opinion, environmental protection is important."}]', 2),
    (l_id, 'V/A-(으)ㄴ/는 것 같아요', 'V/A stem + (으)ㄴ/는 것 같아요', 'Expresses a softer, tentative opinion: "It seems like..." or "I think (maybe)..."', '[{"korean":"그 사람이 맞는 것 같아요.","english":"It seems like that person is right."},{"korean":"오늘 비가 올 것 같아요.","english":"I think it might rain today."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생1', '인터넷이 교육에 도움이 된다고 생각해요?', 'Inteonet-i gyoyuk-e doumi doenda-go saenggakaeyo?', 'Do you think the internet is helpful for education?', 1),
    (l_id, '학생2', '네, 저는 매우 도움이 된다고 생각해요. 예를 들면 온라인 강의를 통해 집에서도 배울 수 있잖아요.', 'Ne, jeoneun maeu doumi doenda-go saenggakaeyo. Ye-reul deulmyeon onlain gang-ui-reul tonghae jib-eseo-do baeul su itjanayo.', 'Yes, I think it is very helpful. For example, through online lectures you can learn even at home.', 2),
    (l_id, '학생1', '맞아요. 하지만 제 생각에는 집중력이 떨어질 수도 있는 것 같아요.', 'Majayo. Hajiman je saenggak-e-neun jipjungnyeok-i tteoreojil sudo inneun geot gatayo.', 'That''s true. But in my opinion, it seems like concentration might also decrease.', 3),
    (l_id, '학생2', '그건 개인마다 다른 것 같아요. 규칙적인 공부 습관이 있으면 괜찮아요.', 'Geugeon gaein-mada dareun geot gatayo. Gyuchikjeok-in gongbu seupgwan-i isseumyeon gwaenchanayo.', 'I think that varies by individual. If you have regular study habits, it''s fine.', 4),
    (l_id, '학생1', '동의해요. 결론적으로 인터넷은 잘 활용하면 교육에 매우 유용하다고 생각해요.', 'Dong-uihaeyo. Gyeollon-jeokeuro inteonet-eun jal hwarlyong-hamyeon gyoyuk-e maeu yuyonghada-go saenggakaeyo.', 'I agree. In conclusion, I think the internet is very useful for education if used well.', 5),
    (l_id, '학생2', '맞아요, 저도 같은 의견이에요.', 'Majayo, jeodo gateun uigyeon-ieyo.', 'That''s right, I have the same opinion.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '제 ___ 이 방법이 더 좋아요. (in my opinion)', '["생각","생각에는","의견이는","입장이"]', 1, '제 생각에는 = in my opinion (with the particle 에는).', 1),
    (l_id, '환경 보호가 중요하___ 생각해요.', '["다고","라고","고","며"]', 0, 'Verb clause + 다고 생각해요 expresses opinion.', 2),
    (l_id, '''동의하다''의 반대말은?', '["찬성하다","주장하다","반대하다","이해하다"]', 2, '동의하다 (to agree) is the opposite of 반대하다 (to disagree).', 3),
    (l_id, '오늘 비가 ___ 것 같아요.', '["오는","올","온","왔"]', 1, 'Future/speculation uses -(으)ㄹ 것 같아요.', 4),
    (l_id, '예를 들면 어떻게 사용하나요?', '["to give a reason","to give a conclusion","to give an example","to disagree"]', 2, '예를 들면 means "for example" and introduces examples.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '의견을 말할 때는 자신의 생각을 명확하게 표현하는 것이 중요합니다. 한국어에서는 ''제 생각에는'' 또는 ''제 의견으로는''을 사용하여 의견을 시작합니다. 근거를 제시할 때는 ''왜냐하면''이나 ''예를 들면''을 활용합니다. 상대방의 의견에 동의할 때는 ''맞아요'' 또는 ''저도 그렇게 생각해요''라고 합니다. 반대 의견을 표현할 때는 ''하지만'' 또는 ''그런데''를 사용하여 부드럽게 반박합니다. 정중하게 자신의 의견을 말하는 것이 한국 대화 문화에서 중요합니다.', 'When expressing opinions, it is important to clearly express your thoughts. In Korean, opinions are introduced with ''je saenggake-neun'' (in my opinion) or ''je uigyeon-euro-neun.'' When presenting evidence, ''waenyahamyeon'' (because) or ''yereul deulmyeon'' (for example) are used. When agreeing with someone''s opinion, you say ''majayo'' or ''jeodo geureoke saenggakaeyo'' (I think so too). When expressing a contrary opinion, you use ''hajiman'' (but) or ''geureonde'' to gently refute. Politely expressing your opinion is important in Korean conversational culture.', 1);
END $$;


-- ============================================================
-- Lesson 62: Phone Conversations (전화 대화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 62;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=62 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '여보세요', 'yeoboseyo', 'hello (on the phone)', 1),
    (l_id, '전화를 걸다', 'jeonhwa-reul geolda', 'to make a phone call', 2),
    (l_id, '전화를 받다', 'jeonhwa-reul batda', 'to answer the phone', 3),
    (l_id, '끊다', 'kkeunta', 'to hang up', 4),
    (l_id, '연결하다', 'yeongyeol-hada', 'to connect, to transfer', 5),
    (l_id, '통화 중', 'tonghwa jung', 'the line is busy', 6),
    (l_id, '잘못 걸다', 'jalmot geolda', 'to dial a wrong number', 7),
    (l_id, '메시지', 'mesiji', 'message', 8),
    (l_id, '다시 걸다', 'dasi geolda', 'to call back', 9),
    (l_id, '전화번호', 'jeonhwa beonho', 'phone number', 10),
    (l_id, '잠깐 기다리다', 'jamkkan gidarida', 'to wait a moment', 11),
    (l_id, '부재중', 'bujae-jung', 'absence, missed call', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N 좀 바꿔 주세요', 'Name + 좀 바꿔 주세요', 'Asks to be transferred to a specific person on the phone.', '[{"korean":"김민준 씨 좀 바꿔 주세요.","english":"Please transfer me to Kim Minjun."},{"korean":"담당자 좀 바꿔 주실 수 있어요?","english":"Could you transfer me to the person in charge?"}]', 1),
    (l_id, 'V-겠다고 전해 주세요', 'Verb stem + 겠다고 전해 주세요', 'Leaves a message for someone.', '[{"korean":"나중에 다시 전화하겠다고 전해 주세요.","english":"Please tell him/her I''ll call back later."},{"korean":"제가 왔다 갔다고 전해 주세요.","english":"Please tell them I stopped by."}]', 2),
    (l_id, 'V-(으)ㄹ 수 있어요? (전화 요청)', 'V + (으)ㄹ 수 있어요?', 'Politely requests an action on the phone.', '[{"korean":"잠깐 기다려 주실 수 있어요?","english":"Could you wait a moment?"},{"korean":"다시 말씀해 주실 수 있어요?","english":"Could you please say that again?"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '수신자', '여보세요?', 'Yeoboseyo?', 'Hello?', 1),
    (l_id, '발신자', '안녕하세요. 저는 이지영이라고 해요. 박준호 씨 계세요?', 'Annyeonghaseyo. Jeoneun Lee Jiyeong-irago haeyo. Park Junho ssi gyeseyo?', 'Hello. I''m Lee Jiyeong. Is Park Junho there?', 2),
    (l_id, '수신자', '네, 잠깐 기다려 주세요. 바꿔 드릴게요.', 'Ne, jamkkan gidaryeo juseyo. Bakkweo deurilgeyo.', 'Yes, please hold on a moment. I''ll transfer you.', 3),
    (l_id, '박준호', '네, 박준호입니다.', 'Ne, Park Junho-imnida.', 'Yes, this is Park Junho.', 4),
    (l_id, '발신자', '안녕하세요, 준호 씨. 다음 주 회의 시간 확인하려고요.', 'Annyeonghaseyo, Junho ssi. Daeum ju hoeuisigan hwagin-haryogoyo.', 'Hello, Junho. I''m calling to confirm next week''s meeting time.', 5),
    (l_id, '박준호', '아, 네. 화요일 오후 2시로 알고 있는데 맞죠?', 'A, ne. Hwayoil ohu dusi-ro algo inneunde matjyo?', 'Ah, yes. I believe it''s Tuesday at 2 PM — is that right?', 6),
    (l_id, '발신자', '네, 맞아요. 그럼 화요일에 뵐게요.', 'Ne, majayo. Geureum hwayoil-e boelgeyo.', 'Yes, that''s right. Then I''ll see you on Tuesday.', 7),
    (l_id, '박준호', '네, 그때 봬요. 안녕히 계세요.', 'Ne, geuttae bwaeyo. Annyeonghi gyeseyo.', 'Yes, see you then. Goodbye.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '전화에서 첫 인사말은?', '["안녕하세요","여보세요","실례합니다","처음 뵙겠습니다"]', 1, '여보세요 is the standard phone greeting in Korean.', 1),
    (l_id, '담당자 좀 ___ 주세요. (transfer)', '["바꿔","연결해","걸어","받아"]', 0, '바꿔 주세요 asks to be transferred/put through to someone.', 2),
    (l_id, '나중에 다시 전화하___ 전해 주세요.', '["겠다고","겠습니다","겠어요","겠지요"]', 0, 'V-겠다고 전해 주세요 is used to leave a message.', 3),
    (l_id, '''통화 중''이 의미하는 것은?', '["no signal","the line is busy","wrong number","missed call"]', 1, '통화 중 means the line is busy or the person is currently on a call.', 4),
    (l_id, '잠깐 기다려 주___ 있어요? (polite request)', '["실","ㄹ 수","ㄴ 게","어도"]', 1, 'V-(으)ㄹ 수 있어요? politely asks if something is possible.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국에서 전화를 걸 때는 먼저 ''여보세요''라고 인사합니다. 그다음 자신이 누구인지 밝히고 통화하고 싶은 사람을 찾습니다. 회사에 전화할 때는 더 격식체를 사용합니다. 담당자가 없을 때는 메시지를 남기거나 나중에 다시 전화하겠다고 말합니다. 한국에서는 스마트폰 사용이 보편화되어 전화보다 카카오톡 같은 메신저를 더 많이 사용하는 경향이 있습니다. 그러나 공식적인 상황에서는 여전히 전화가 중요한 소통 수단입니다.', 'When making a phone call in Korea, you first greet with ''yeoboseyo'' (hello). Then you identify yourself and ask for the person you want to speak to. When calling a company, more formal speech is used. When the person in charge is unavailable, you leave a message or say you will call back later. In Korea, smartphone usage has become widespread, and there is a tendency to use messengers like KakaoTalk more than phone calls. However, phone calls are still an important means of communication in formal situations.', 1);
END $$;

-- ============================================================
-- Lesson 63: Cause and Effect -아서/어서 (원인과 결과)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 63;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=63 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '원인', 'won-in', 'cause, reason', 1),
    (l_id, '결과', 'gyeolgwa', 'result, effect', 2),
    (l_id, '때문에', 'ttaemune', 'because of, due to', 3),
    (l_id, '그래서', 'geuraeseeo', 'so, therefore', 4),
    (l_id, '따라서', 'ttaraseeo', 'consequently, therefore', 5),
    (l_id, '피곤하다', 'pigonhada', 'to be tired', 6),
    (l_id, '늦다', 'neutda', 'to be late', 7),
    (l_id, '길이 막히다', 'giri makhida', 'traffic is jammed', 8),
    (l_id, '배가 고프다', 'bae-ga gopeuda', 'to be hungry', 9),
    (l_id, '기분이 좋다', 'gibuni jota', 'to feel good', 10),
    (l_id, '연결되다', 'yeongyeol-doeda', 'to be connected', 11),
    (l_id, '결론적으로', 'gyeollon-jeogeuro', 'in conclusion', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-아서/어서 (reason)', 'Verb/Adj stem + 아서/어서', 'Connects two clauses where the first is the cause and the second is the result. The subject of both clauses must be the same.', '[{"korean":"배가 고파서 밥을 먹었어요.","english":"I was hungry so I ate."},{"korean":"비가 와서 집에 있었어요.","english":"It rained so I stayed home."}]', 1),
    (l_id, 'N 때문에', 'Noun + 때문에', 'Indicates the cause. "Because of N." Can be used with nouns.', '[{"korean":"교통 체증 때문에 늦었어요.","english":"I was late because of traffic."},{"korean":"시험 때문에 스트레스를 받아요.","english":"I''m stressed because of the exam."}]', 2),
    (l_id, 'V/A-아서/어서 (sequence)', 'Verb/Adj stem + 아서/어서', 'Also expresses sequential actions: "do A and then B". Common with motion/state verbs.', '[{"korean":"시장에 가서 채소를 샀어요.","english":"I went to the market and bought vegetables."},{"korean":"앉아서 책을 읽어요.","english":"I sit down and read a book."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '민지', '오늘 왜 이렇게 늦었어요?', 'Oneul wae ireoke neutseosseoyo?', 'Why are you so late today?', 1),
    (l_id, '태현', '죄송해요. 지하철이 고장나서 많이 늦었어요.', 'Joesonghaeyo. Jihacheol-i gojangna-seo manhi neutseosseoyo.', 'I''m sorry. The subway broke down so I was very late.', 2),
    (l_id, '민지', '아, 그랬군요. 많이 기다렸을 텐데 미안해요.', 'A, geuraessgunyo. Manhi gidaryeosseul tende mianhaeyo.', 'Ah, I see. You must have waited a lot — I''m sorry.', 3),
    (l_id, '태현', '괜찮아요. 그런데 어제도 교통 체증 때문에 늦었거든요. 요즘 교통이 왜 이렇게 막혀요?', 'Gwaenchanayo. Geureonde eoje-do gyotong chejeung ttaemune neutseossgeodeunyo. Yojeum gyotong-i wae ireoke makhyeoyo?', 'It''s okay. But yesterday too I was late because of traffic congestion. Why is traffic so jammed these days?', 4),
    (l_id, '민지', '도로 공사가 많아서 더 막히는 것 같아요.', 'Doro gongsa-ga mana-seo deo makhineun geot gatayo.', 'I think there''s a lot of road construction, so it''s more congested.', 5),
    (l_id, '태현', '그렇군요. 앞으로는 일찍 출발해서 제시간에 도착하도록 노력할게요.', 'Geureokgunyo. Apeuroneun iljjik chulbal-haeseo jesigan-e dochakadorok noryeok-halgeyo.', 'I see. From now on I''ll try to leave early and arrive on time.', 6),
    (l_id, '민지', '그게 좋겠어요. 이제 회의 시작할까요?', 'Geuge jo-gesseoyo. Ije hoeui sijakhalkkayo?', 'That would be good. Shall we start the meeting now?', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '배가 고프___ 밥을 먹었어요.', '["지만","면","서","아서"]', 3, 'A-아서/어서 connects cause and effect. 고프다 → 고파서.', 1),
    (l_id, '교통 체증 ___ 늦었어요.', '["때문에","에서","으로","덕분에"]', 0, 'N 때문에 expresses the cause: "because of traffic congestion."', 2),
    (l_id, '-아서/어서 (이유) 사용 시 주의점은?', '["주어가 달라야 한다","주어가 같아야 한다","시제가 달라야 한다","목적어가 없어야 한다"]', 1, 'With -아서/어서 for reason, the subject of both clauses must be the same.', 3),
    (l_id, '도서관에 ___ 책을 읽었어요. (sequence)', '["가서","가면","가고","갔지만"]', 0, '-아서/어서 also expresses sequential actions: 가서 = went and (then).', 4),
    (l_id, '''그래서''의 역할은?', '["contrast","result/conclusion","condition","concession"]', 1, '그래서 means "so/therefore" and introduces a result.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 원인과 결과를 나타내는 방법은 여러 가지입니다. ''-아서/어서''는 원인과 결과를 연결할 때 가장 많이 쓰이는 표현입니다. 이 표현을 사용할 때는 앞뒤 문장의 주어가 같아야 합니다. 명사 뒤에는 ''때문에''를 사용하여 원인을 나타냅니다. 그 결과를 나타낼 때는 ''그래서'' 또는 ''따라서''를 사용합니다. 이러한 표현들을 잘 활용하면 더 자연스러운 한국어를 구사할 수 있습니다.', 'There are various ways to express cause and effect in Korean. -아서/어서 is the most commonly used expression for connecting cause and result. When using this expression, the subjects of the two clauses must be the same. After nouns, 때문에 is used to indicate the cause. To express the result, 그래서 (so) or 따라서 (therefore/consequently) are used. Using these expressions well allows for more natural Korean.', 1);
END $$;


-- ============================================================
-- Lesson 64: Contrast -지만 (대조)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 64;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=64 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '대조', 'daejo', 'contrast', 1),
    (l_id, '반면', 'banmyeon', 'on the other hand', 2),
    (l_id, '그러나', 'geureona', 'however, but', 3),
    (l_id, '하지만', 'hajiman', 'but, however', 4),
    (l_id, '그렇지만', 'geureojiman', 'but, however', 5),
    (l_id, '그런데', 'geureonde', 'but, by the way', 6),
    (l_id, '오히려', 'ohiryeo', 'rather, on the contrary', 7),
    (l_id, '장점', 'jangjeom', 'advantage, strong point', 8),
    (l_id, '단점', 'danjeom', 'disadvantage, weak point', 9),
    (l_id, '비록', 'birok', 'although, even though', 10),
    (l_id, '그럼에도', 'geurem-edo', 'nevertheless, even so', 11),
    (l_id, '어렵다', 'eoryeopda', 'to be difficult', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-지만', 'Verb/Adj stem + 지만', 'Connects contrasting clauses: "although/but." Both clauses can have different subjects.', '[{"korean":"한국어는 어렵지만 재미있어요.","english":"Korean is difficult, but it''s fun."},{"korean":"비가 오지만 나가고 싶어요.","english":"It''s raining, but I want to go out."}]', 1),
    (l_id, 'A-지만 B (A인 반면에 B)', 'Clause A + 지만 + Clause B', 'Contrasts two facts. Equivalent to "whereas A, B" or "A, but B."', '[{"korean":"서울은 복잡하지만 편리해요.","english":"Seoul is busy, but it''s convenient."},{"korean":"이 식당은 비싸지만 맛있어요.","english":"This restaurant is expensive, but the food is delicious."}]', 2),
    (l_id, 'N은/는 A-지만 N은/는 B', 'N + 은/는 + A + 지만 + N + 은/는 + B', 'Explicitly contrasts two nouns with different qualities.', '[{"korean":"언니는 키가 크지만 동생은 작아요.","english":"The older sister is tall, but the younger sibling is short."},{"korean":"봄은 따뜻하지만 겨울은 추워요.","english":"Spring is warm, but winter is cold."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '소연', '서울에서 살면 어때요?', 'Seoul-eseo salmyeon eottaeyo?', 'What is it like living in Seoul?', 1),
    (l_id, '재원', '서울은 교통이 편리하지만 집값이 너무 비싸요.', 'Seoul-eun gyotong-i pyeollihajiman jipgap-i neomu bissayo.', 'Seoul has convenient transportation, but housing prices are very expensive.', 2),
    (l_id, '소연', '지방은 어때요?', 'Jibang-eun eottaeyo?', 'What about the countryside?', 3),
    (l_id, '재원', '지방은 집값이 싸지만 교통이 불편해요. 그리고 취업 기회가 서울보다 적어요.', 'Jibang-eun jipgap-i ssajiman gyotong-i bulpyeonhaeyo. Geurigo chwieop gihoega Seoul-boda jeogeoyo.', 'In the countryside, housing is cheaper, but transportation is inconvenient. And there are fewer job opportunities than Seoul.', 4),
    (l_id, '소연', '그럼 어디에 사는 게 더 나을까요?', 'Geureum eodie saneun ge deo naelkkayo?', 'Then where is it better to live?', 5),
    (l_id, '재원', '사람마다 다르지만 저는 편의시설이 많은 서울이 더 좋아요.', 'Sarammada dareujiman jeoneun pyeonuisiseol-i maneun Seoul-i deo joayo.', 'It varies by person, but I prefer Seoul where there are more amenities.', 6),
    (l_id, '소연', '저는 오히려 조용한 지방이 좋더라고요.', 'Jeoneun ohiryeo joyonghan jibang-i jo-tdeorago-yo.', 'I, on the contrary, prefer the quiet countryside.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국어는 어렵___ 재미있어요.', '["고","지만","아서","면"]', 1, '-지만 connects contrasting clauses: difficult BUT fun.', 1),
    (l_id, '''반면''과 같은 의미의 접속사는?', '["그래서","따라서","하지만","그러므로"]', 2, '반면 (on the other hand) has a similar meaning to 하지만 (but/however).', 2),
    (l_id, '이 식당은 비싸___ 맛있어요.', '["서","지만","고","면서"]', 1, '-지만 expresses contrast.', 3),
    (l_id, '''장점''의 반대말은?', '["단점","결점","차이점","대조점"]', 0, '장점 (advantage) is the opposite of 단점 (disadvantage).', 4),
    (l_id, '-지만을 사용할 때 주어는?', '["항상 같아야 한다","같거나 달라도 된다","항상 달라야 한다","생략해야 한다"]', 1, 'With -지만, the subjects of the two clauses can be the same or different.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 대조를 나타낼 때는 주로 ''-지만''을 사용합니다. 이 표현은 두 가지 상반된 사실을 연결할 때 사용합니다. 예를 들어 ''이 음식은 맵지만 맛있어요''처럼 사용합니다. 비슷한 표현으로는 ''하지만'', ''그러나'', ''그렇지만'' 등이 있습니다. 이 중 ''-지만''은 문장 중간에 연결어미로 사용하고, ''하지만''은 문장 시작에 독립적으로 사용합니다. 대조 표현을 잘 활용하면 더 풍부한 한국어 표현이 가능합니다.', 'In Korean, -지만 is mainly used to express contrast. This expression is used to connect two contrasting facts. For example, it is used like ''i eumsik-eun maepjiman masiseoyo'' (this food is spicy but delicious). Similar expressions include 하지만, 그러나, and 그렇지만. Among these, -지만 is used as a connective ending in the middle of a sentence, while 하지만 is used independently at the beginning of a sentence. Using contrast expressions well enables richer Korean expression.', 1);
END $$;

-- ============================================================
-- Lesson 65: Intention -려고 하다 (의도)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 65;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=65 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '의도', 'uido', 'intention, intent', 1),
    (l_id, '계획', 'gyehoek', 'plan', 2),
    (l_id, '목표', 'mokpyo', 'goal', 3),
    (l_id, '결심하다', 'gyeolsimhada', 'to resolve, to decide', 4),
    (l_id, '시작하다', 'sijakada', 'to start, to begin', 5),
    (l_id, '포기하다', 'pogihada', 'to give up', 6),
    (l_id, '준비하다', 'junbihada', 'to prepare', 7),
    (l_id, '노력하다', 'noryeokhada', 'to make an effort', 8),
    (l_id, '이루다', 'iruda', 'to achieve, to accomplish', 9),
    (l_id, '졸업하다', 'joreopaada', 'to graduate', 10),
    (l_id, '취직하다', 'chwijikada', 'to get a job', 11),
    (l_id, '나중에', 'najung-e', 'later, in the future', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)려고 하다', 'Verb stem + (으)려고 하다', 'Expresses intention or plan: "I intend to / I''m planning to / I''m about to."', '[{"korean":"한국에 유학 가려고 해요.","english":"I intend to study abroad in Korea."},{"korean":"내년에 결혼하려고 해요.","english":"I''m planning to get married next year."}]', 1),
    (l_id, 'V-(으)려고', 'Verb stem + (으)려고', 'Used as a connector meaning "in order to / with the intention of." The subject of both clauses must be the same.', '[{"korean":"한국어를 배우려고 한국에 왔어요.","english":"I came to Korea in order to learn Korean."},{"korean":"살을 빼려고 운동을 시작했어요.","english":"I started exercising in order to lose weight."}]', 2),
    (l_id, 'V-기로 결심했어요/하다', 'Verb stem + 기로 결심했어요', 'Expresses a strong decision: "I decided to do..."', '[{"korean":"담배를 끊기로 결심했어요.","english":"I decided to quit smoking."},{"korean":"매일 운동하기로 했어요.","english":"I decided to exercise every day."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '지은', '졸업하고 나서 뭐 할 거예요?', 'Joreoap-ago naseo mwo hal geoyeyo?', 'What will you do after you graduate?', 1),
    (l_id, '현석', '한국에서 취직하려고 해요. 그래서 요즘 토픽 시험을 준비하고 있어요.', 'Hanguk-eseo chwijik-haryogo haeyo. Geuraeseeo yojeum topik siheom-eul junbi-hago isseoyo.', 'I intend to get a job in Korea. So these days I''m preparing for the TOPIK exam.', 2),
    (l_id, '지은', '멋지다! 어떤 회사에 취직하고 싶어요?', 'Meotjida! Eotteon hoesa-e chwijijago sipeoyo?', 'That''s cool! What kind of company do you want to work at?', 3),
    (l_id, '현석', 'IT 회사에 들어가려고 해요. 한국의 IT 산업이 정말 발전했잖아요.', 'IT hoesa-e deureo-garyogo haeyo. Hanguk-ui IT san-eop-i jeongmal baljeonhaessjanayo.', 'I plan to enter an IT company. Korea''s IT industry has really developed, you know.', 4),
    (l_id, '지은', '맞아요! 좋은 회사에 들어가려고 어떤 준비를 하고 있어요?', 'Majayo! Joeun hoesa-e deureo-garyogo eotteon junbi-reul hago isseoyo?', 'That''s right! What are you doing to prepare to enter a good company?', 5),
    (l_id, '현석', '토픽 외에도 코딩 공부도 하기로 결심했어요. 매일 2시간씩 공부하고 있어요.', 'Topik oe-edo koding gongbu-do hagi-ro gyeolsim-haesseoyo. Maeil du-sigan-ssik gongbu-hago isseoyo.', 'Besides TOPIK, I also decided to study coding. I''m studying 2 hours every day.', 6),
    (l_id, '지은', '대단해요! 분명히 목표를 이룰 수 있을 거예요.', 'Daedanaeyo! Bunmyeong-hi mokpyo-reul irul su isseul geoyeyo.', 'That''s amazing! You''ll surely be able to achieve your goal.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국어를 배우___ 한국에 왔어요. (in order to)', '["려고","기 위해서","면서","아서"]', 0, 'V-(으)려고 connects purpose clauses: "came to Korea in order to learn Korean."', 1),
    (l_id, '내년에 결혼하___ 해요. (intend to)', '["려고","면","기로","아서"]', 0, 'V-(으)려고 하다 expresses intention or plan.', 2),
    (l_id, '담배를 끊___ 결심했어요. (decided to)', '["려고","기로","으면","고 싶어"]', 1, 'V-기로 결심하다 expresses a strong decision.', 3),
    (l_id, '''목표''의 의미는?', '["effort","plan","goal","intention"]', 2, '목표 means goal or objective.', 4),
    (l_id, '포기하다의 반대말로 어울리는 것은?', '["시작하다","계속하다","멈추다","쉬다"]', 1, 'The opposite concept of giving up (포기하다) is continuing/persevering (계속하다).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 의도를 나타낼 때는 ''-(으)려고 하다''를 자주 사용합니다. 이 표현은 계획하거나 의도하는 행동을 나타냅니다. 두 가지 행동이 같은 주어일 때 ''-(으)려고''를 연결어미로 사용합니다. 예를 들어 ''건강해지려고 운동을 시작했어요''처럼 사용합니다. 더 강한 결심을 나타낼 때는 ''-기로 결심했어요''를 사용합니다. 미래 목표를 이야기할 때 이러한 표현들을 활용하면 더 자연스러운 한국어를 구사할 수 있습니다.', 'In Korean, -(으)려고 하다 is frequently used to express intention. This expression indicates a planned or intended action. When two actions share the same subject, -(으)려고 is used as a connective ending. For example, it is used like ''geongang-haejilryogo undongeul sijakhaesseoyo'' (I started exercising to get healthy). To express a stronger resolve, -기로 결심했어요 is used. Using these expressions when talking about future goals allows for more natural Korean.', 1);
END $$;


-- ============================================================
-- Lesson 66: Experience -아/어 봤다 (경험)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 66;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=66 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '경험', 'gyeongheom', 'experience', 1),
    (l_id, '처음', 'cheoeum', 'the first time', 2),
    (l_id, '전에', 'jeon-e', 'before, previously', 3),
    (l_id, '한 번', 'han beon', 'once, one time', 4),
    (l_id, '여러 번', 'yeoreo beon', 'many times', 5),
    (l_id, '기억나다', 'gieoknada', 'to remember', 6),
    (l_id, '인상적이다', 'insangjeogida', 'to be impressive', 7),
    (l_id, '도전하다', 'dojeonhada', 'to challenge, to try', 8),
    (l_id, '새롭다', 'saeropda', 'to be new, novel', 9),
    (l_id, '잊지 못하다', 'itji motada', 'to be unforgettable', 10),
    (l_id, '소중하다', 'sojunghada', 'to be precious, valuable', 11),
    (l_id, '추억', 'chueok', 'memory, recollection', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-아/어 본 적이 있다/없다', 'Verb stem + 아/어 본 적이 있다/없다', 'Expresses whether one has or has never had the experience of doing something.', '[{"korean":"한국에 가 본 적이 있어요?","english":"Have you ever been to Korea?"},{"korean":"스카이다이빙을 해 본 적이 없어요.","english":"I have never tried skydiving."}]', 1),
    (l_id, 'V-아/어 봤다 (경험)', 'Verb stem + 아/어 봤어요', 'Expresses that one has tried or experienced something: "I tried/I have done."', '[{"korean":"한국 음식을 먹어 봤어요.","english":"I''ve tried Korean food."},{"korean":"제주도에 가 봤어요.","english":"I''ve been to Jeju Island."}]', 2),
    (l_id, '처음으로 / 처음에는', '처음으로 + clause / 처음에는 + clause', 'Expresses doing something for the first time.', '[{"korean":"처음으로 김치를 먹어 봤어요.","english":"I tried kimchi for the first time."},{"korean":"처음에는 매웠지만 이제는 좋아해요.","english":"At first it was spicy, but now I like it."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '알리', '한국에서 여러 가지 새로운 경험을 했어요?', 'Hanguk-eseo yeoreo gaji saeroun gyeongheom-eul haesseoyo?', 'Did you have various new experiences in Korea?', 1),
    (l_id, '유진', '네, 정말 많아요! 처음으로 찜질방에 가 봤어요.', 'Ne, jeongmal manayo! Cheoeum-euro jjimjilbang-e ga bwasseoyo.', 'Yes, so many! I went to a jjimjilbang (sauna) for the first time.', 2),
    (l_id, '알리', '찜질방이요? 어떤 곳이에요?', 'Jjimjilbang-iyo? Eotteon got-ieyo?', 'Jjimjilbang? What kind of place is it?', 3),
    (l_id, '유진', '한국의 대중목욕탕인데 사우나 시설이 있어요. 한국 드라마에서 본 적 있어요?', 'Hanguk-ui daejungmokyoktang-inde sauna sisol-i isseoyo. Hanguk deurama-eseo bon jeok isseoyo?', 'It''s a Korean public bathhouse with sauna facilities. Have you ever seen it in a Korean drama?', 4),
    (l_id, '알리', '아, 네! 드라마에서 봤는데 직접 가 본 적은 없어요.', 'A, ne! Deurama-eseo bwanneunde jikjeop ga bon jeok-eun eopseoyo.', 'Ah, yes! I''ve seen it in a drama, but I''ve never gone myself.', 5),
    (l_id, '유진', '꼭 가 보세요! 처음에는 낯설지만 아주 편안해요. 거기서 계란도 먹어 봤어요.', 'Kkok ga boseyo! Cheoeum-e-neun natseoljiman aju pyeonanaeyo. Geogiseo gyeran-do meogeobwasseoyo.', 'Definitely go! At first it''s unfamiliar, but it''s very relaxing. I also tried the eggs there.', 6),
    (l_id, '알리', '계란이요? 그건 처음 들어봐요.', 'Gyeran-iyo? Geugeon cheoeum deureo-bwayo.', 'Eggs? That''s the first I''ve heard of that.', 7),
    (l_id, '유진', '찜질방에서 구운 계란을 먹는 게 한국 문화예요. 꼭 먹어 보세요!', 'Jjimjilbang-eseo gu-un gyeran-eul meongneun ge Hanguk munhwa-yeyo. Kkok meogeoboseyo!', 'Eating roasted eggs in a jjimjilbang is Korean culture. You must try it!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국 음식을 먹어 ___ 있어요? (experience)', '["본 적이","봤는데","보았다","보는 것이"]', 0, 'V-아/어 본 적이 있다/없다 asks about experience.', 1),
    (l_id, '스카이다이빙을 해 본 ___ 없어요.', '["적이","것이","수가","때가"]', 0, '본 적이 없다 = have never done something.', 2),
    (l_id, '처음___ 김치를 먹어 봤어요.', '["에는","으로","부터","에서"]', 1, '처음으로 means "for the first time."', 3),
    (l_id, '''추억''의 의미는?', '["challenge","experience","memory/recollection","impression"]', 2, '추억 means cherished memory or recollection.', 4),
    (l_id, '-아/어 봤어요 vs 본 적이 있어요의 차이는?', '["의미가 완전히 다르다","봤어요는 완료, 본 적이 있어요는 경험 여부","봤어요는 미래, 본 적이 있어요는 과거","차이 없다"]', 1, '-아/어 봤어요 emphasizes the action was completed; -본 적이 있어요 asks about the existence of experience.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 경험을 이야기할 때는 주로 ''-아/어 본 적이 있다''를 사용합니다. 이 표현은 ''~해본 경험이 있냐''를 묻거나 말할 때 씁니다. 예를 들어 ''한국에 가 본 적이 있어요?''는 ''Have you ever been to Korea?''의 의미입니다. 처음으로 무언가를 시도했을 때는 ''처음으로'' 또는 ''-아/어 봤어요''를 사용합니다. 새로운 경험은 새로운 시각과 이해를 넓혀줍니다. 외국어를 배울 때 다양한 문화 경험을 하면 언어 습득에도 도움이 됩니다.', 'In Korean, -아/어 본 적이 있다 is mainly used when talking about experiences. This expression is used to ask or say whether one has had the experience of something. For example, ''Hanguk-e ga bon jeok-i isseoyo?'' means ''Have you ever been to Korea?'' When you try something for the first time, ''처음으로'' or ''-아/어 봤어요'' are used. New experiences broaden one''s perspective and understanding. When learning a foreign language, having various cultural experiences also helps with language acquisition.', 1);
END $$;

-- ============================================================
-- Lesson 67: Ability -ㄹ 수 있다/없다 (능력)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 67;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=67 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '능력', 'neungnyeok', 'ability, capability', 1),
    (l_id, '가능하다', 'ganeunghada', 'to be possible', 2),
    (l_id, '불가능하다', 'bulganeunghada', 'to be impossible', 3),
    (l_id, '실력', 'sillyeok', 'skill, proficiency', 4),
    (l_id, '재능', 'jaeneung', 'talent', 5),
    (l_id, '자격증', 'jagyeokjeung', 'certificate, license', 6),
    (l_id, '연주하다', 'yeonjuhada', 'to play (an instrument)', 7),
    (l_id, '운전하다', 'unjeonhada', 'to drive', 8),
    (l_id, '수영하다', 'suyeonghada', 'to swim', 9),
    (l_id, '번역하다', 'beon-yeok-ada', 'to translate', 10),
    (l_id, '잘하다', 'jalhada', 'to be good at', 11),
    (l_id, '못하다', 'motada', 'to be bad at, cannot do', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)ㄹ 수 있다/없다', 'Verb stem + (으)ㄹ 수 있다/없다', 'Expresses ability or possibility: "can/cannot do."', '[{"korean":"저는 피아노를 칠 수 있어요.","english":"I can play the piano."},{"korean":"오늘은 갈 수 없어요.","english":"I cannot go today."}]', 1),
    (l_id, 'V-잘/못 하다', 'V + 잘/못 하다', 'Expresses being good or bad at something.', '[{"korean":"저는 요리를 잘 해요.","english":"I am good at cooking."},{"korean":"저는 춤을 잘 못 춰요.","english":"I''m not very good at dancing."}]', 2),
    (l_id, 'V-(으)ㄹ 줄 알다/모르다', 'Verb stem + (으)ㄹ 줄 알다/모르다', 'Expresses knowing or not knowing how to do something (learned skill).', '[{"korean":"김치 담글 줄 알아요?","english":"Do you know how to make kimchi?"},{"korean":"저는 한국어를 읽을 줄 알아요.","english":"I know how to read Korean."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '면접관', '어떤 언어를 할 수 있어요?', 'Eotteon eoneo-reul hal su isseoyo?', 'What languages can you speak?', 1),
    (l_id, '지원자', '한국어와 영어를 할 수 있어요. 그리고 일본어도 조금 할 수 있어요.', 'Hangugeo-wa yeong-eo-reul hal su isseoyo. Geurigo ilboneo-do jogeumhal su isseoyo.', 'I can speak Korean and English. And I can also speak a little Japanese.', 2),
    (l_id, '면접관', '컴퓨터는 잘 할 수 있어요?', 'Keompyuteo-neun jal hal su isseoyo?', 'Are you good with computers?', 3),
    (l_id, '지원자', '네, 엑셀과 파워포인트를 잘 다룰 수 있어요. 코딩도 기초는 할 줄 알아요.', 'Ne, eksel-gwa paweopointeu-reul jal darul su isseoyo. Koding-do gichoeun hal jul arayo.', 'Yes, I can handle Excel and PowerPoint well. I also know how to do basic coding.', 4),
    (l_id, '면접관', '운전은 할 수 있어요?', 'Unjeon-eun hal su isseoyo?', 'Can you drive?', 5),
    (l_id, '지원자', '네, 운전면허가 있어요. 운전할 수 있어요.', 'Ne, unjeonmyeonho-ga isseoyo. Unjeon-hal su isseoyo.', 'Yes, I have a driver''s license. I can drive.', 6),
    (l_id, '면접관', '혹시 못 하는 것이 있어요?', 'Hoksi mot haneun geosi isseoyo?', 'Is there anything you cannot do?', 7),
    (l_id, '지원자', '그림을 잘 못 그리는데요, 디자인 분야는 좀 어려워요. 하지만 배우려고 노력하고 있어요.', 'Geurimeul jal mot geulineundeyo, dijaein bunyaneun jom eoryeowoyo. Hajiman baeulyeogo noryeok-ago isseoyo.', 'I''m not very good at drawing, the design field is a bit difficult. But I''m making an effort to learn.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '저는 피아노를 칠 ___ 있어요.', '["수","줄","적","번"]', 0, 'V-(으)ㄹ 수 있다 expresses ability.', 1),
    (l_id, '김치 담그___ 줄 알아요? (know how to)', '["ㄹ","는","는 데","기로"]', 0, 'V-(으)ㄹ 줄 알다 expresses knowing how to do something.', 2),
    (l_id, '저는 춤을 잘 ___ 춰요. (not good at)', '["못","안","잘","다"]', 0, '잘 못 하다 = not good at; 잘 못 추다 = can''t dance well.', 3),
    (l_id, '''자격증''의 의미는?', '["talent","skill","certificate/license","ability"]', 2, '자격증 means a certificate or license.', 4),
    (l_id, '오늘은 시간이 없어서 갈 수 ___. (cannot go)', '["있어요","없어요","있을 거예요","없었어요"]', 1, '갈 수 없어요 = cannot go.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '능력을 나타내는 한국어 표현에는 여러 가지가 있습니다. ''-(으)ㄹ 수 있다''는 어떤 행동이 가능한지 여부를 나타냅니다. ''-(으)ㄹ 줄 알다''는 배워서 습득한 기술을 알고 있다는 의미입니다. 예를 들어 ''수영할 줄 알아요''는 수영하는 방법을 배웠다는 뜻입니다. 잘하는 것과 못하는 것을 솔직하게 말하는 것도 중요합니다. 새로운 기술을 배우려는 의지와 노력이 능력 개발의 핵심입니다.', 'There are various Korean expressions for expressing ability. -(으)ㄹ 수 있다 indicates whether an action is possible or not. -(으)ㄹ 줄 알다 means knowing a skill that has been learned. For example, ''suyeong-hal jul arayo'' means knowing how to swim (having learned it). It is also important to honestly state what you are good at and what you are not. The will and effort to learn new skills is the key to developing ability.', 1);
END $$;


-- ============================================================
-- Lesson 68: Obligation -아야/어야 하다 (의무)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 68;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=68 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '의무', 'uimu', 'duty, obligation', 1),
    (l_id, '규칙', 'gyuchik', 'rule, regulation', 2),
    (l_id, '법', 'beop', 'law', 3),
    (l_id, '지키다', 'jikida', 'to keep, to obey', 4),
    (l_id, '반드시', 'bandeusi', 'certainly, without fail', 5),
    (l_id, '꼭', 'kkok', 'definitely, surely', 6),
    (l_id, '필수', 'pilsu', 'necessity, required', 7),
    (l_id, '제출하다', 'jechulhada', 'to submit', 8),
    (l_id, '납부하다', 'napbuhada', 'to pay (taxes, fees)', 9),
    (l_id, '등록하다', 'deungnokhada', 'to register', 10),
    (l_id, '완료하다', 'wanlyohada', 'to complete', 11),
    (l_id, '책임', 'chaengim', 'responsibility', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-아야/어야 하다', 'Verb stem + 아야/어야 하다', 'Expresses obligation or necessity: "must do" or "have to do."', '[{"korean":"숙제를 해야 해요.","english":"I have to do homework."},{"korean":"여권을 가져와야 해요.","english":"You must bring your passport."}]', 1),
    (l_id, 'V-아야/어야 되다', 'Verb stem + 아야/어야 되다', 'Similar to -아야/어야 하다 but slightly softer. Common in spoken Korean.', '[{"korean":"일찍 일어나야 돼요.","english":"I have to wake up early."},{"korean":"이 서류를 제출해야 돼요.","english":"I have to submit this document."}]', 2),
    (l_id, 'V-지 않아도 되다', 'Verb stem + 지 않아도 되다', 'Expresses that something is not necessary: "don''t have to."', '[{"korean":"오늘은 오지 않아도 돼요.","english":"You don''t have to come today."},{"korean":"넥타이를 매지 않아도 됩니다.","english":"You don''t have to wear a tie."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생', '내일 시험이에요. 오늘 밤에 공부해야 해요.', 'Naeil siheom-ieyo. Oneul bam-e gongbu-haeya haeyo.', 'There''s an exam tomorrow. I have to study tonight.', 1),
    (l_id, '친구', '맞아요. 몇 시까지 공부할 거예요?', 'Majayo. Myeot si-kkaji gongbu-hal geoyeyo?', 'That''s right. Until what time will you study?', 2),
    (l_id, '학생', '최소한 자정까지는 해야 될 것 같아요. 범위가 너무 넓어서요.', 'Choesoan jajeong-kkaji-neun haeya doel geot gatayo. Beomwi-ga neomu neolbeoseoyo.', 'I think I''ll have to do it until at least midnight. The scope is too wide.', 3),
    (l_id, '친구', '무슨 과목이에요?', 'Musun gwamok-ieyo?', 'What subject is it?', 4),
    (l_id, '학생', '한국사예요. 외워야 할 게 정말 많아요.', 'Hangugsayeyo. Oeowoya hal ge jeongmal manayo.', 'It''s Korean history. There''s so much I have to memorize.', 5),
    (l_id, '친구', '교재도 꼭 봐야 해요?', 'Gyojae-do kkok bwaya haeyo?', 'Do you also have to study the textbook?', 6),
    (l_id, '학생', '네, 봐야 해요. 하지만 강의 노트 중심으로 하면 교재를 전부 읽지 않아도 될 것 같아요.', 'Ne, bwaya haeyo. Hajiman gang-ui note jungs-im-euro hamyeon gyojae-reul jeonbu ilkji anado doel geot gatayo.', 'Yes, I have to. But if I focus on lecture notes, I think I won''t have to read the entire textbook.', 7),
    (l_id, '친구', '그렇게 해요. 잘 될 거예요! 화이팅!', 'Geureokeya haeyo. Jal doel geoyeyo! Hwaiting!', 'Do it that way. It''ll work out! Fighting!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '숙제를 ___. (have to do)', '["해도 돼요","해야 해요","하면 돼요","해도 되지 않아요"]', 1, 'V-아야/어야 하다 expresses obligation.', 1),
    (l_id, '오늘은 오지 않아도 ___. (don''t have to come)', '["안 돼요","해요","돼요","해야 해요"]', 2, 'V-지 않아도 되다 = it is not necessary.', 2),
    (l_id, '''반드시''와 비슷한 의미의 부사는?', '["가끔","꼭","자주","천천히"]', 1, '반드시 and 꼭 both mean "certainly/definitely/without fail."', 3),
    (l_id, '세금을 납부해야 ___. (two common endings)', '["해요 / 돼요","했어요 / 됐어요","할게요 / 될게요","하고 싶어요 / 되고 싶어요"]', 0, 'Both -해요 and -돼요 are correct endings for -아야/어야.', 4),
    (l_id, '''책임''의 의미는?', '["rule","obligation","responsibility","law"]', 2, '책임 means responsibility.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '사회 생활을 하려면 여러 가지 의무를 지켜야 합니다. 세금을 납부해야 하고 법을 지켜야 합니다. 회사에서는 정해진 시간에 출근해야 하고 업무를 완료해야 합니다. ''-아야/어야 하다''는 이러한 의무와 필요성을 나타내는 핵심 표현입니다. 반대로 어떤 것이 반드시 필요하지 않을 때는 ''-지 않아도 되다''를 사용합니다. 의무와 자유를 균형 있게 이해하는 것이 성숙한 사회 구성원의 자질입니다.', 'To participate in social life, you must observe various obligations. You must pay taxes and abide by the law. At a company, you must arrive at the designated time and complete your work. -아야/어야 하다 is the key expression for expressing such obligations and necessities. Conversely, when something is not absolutely necessary, -지 않아도 되다 is used. Understanding the balance between obligation and freedom is a quality of a mature member of society.', 1);
END $$;

-- ============================================================
-- Lesson 69: Prohibition -면 안 되다 (금지)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 69;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=69 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '금지', 'geumji', 'prohibition, ban', 1),
    (l_id, '위반하다', 'wibanada', 'to violate', 2),
    (l_id, '벌금', 'beolgeum', 'fine, penalty', 3),
    (l_id, '출입금지', 'churip geumji', 'no entry', 4),
    (l_id, '흡연', 'heubyeon', 'smoking', 5),
    (l_id, '음주', 'eumju', 'drinking (alcohol)', 6),
    (l_id, '주차금지', 'jucha geumji', 'no parking', 7),
    (l_id, '조용히 하다', 'joyonghi hada', 'to be quiet', 8),
    (l_id, '규정', 'gyujeong', 'regulation, rule', 9),
    (l_id, '안전', 'anjeon', 'safety', 10),
    (l_id, '허용하다', 'heoyonghada', 'to allow, to permit', 11),
    (l_id, '경고', 'gyeongo', 'warning', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)면 안 되다', 'Verb stem + (으)면 안 되다', 'Expresses prohibition: "must not do" or "it is not okay to do."', '[{"korean":"여기서 담배를 피우면 안 돼요.","english":"You must not smoke here."},{"korean":"도서관에서 전화하면 안 돼요.","english":"You must not make phone calls in the library."}]', 1),
    (l_id, 'V-(으)면 안 됩니다 (formal)', 'Verb stem + (으)면 안 됩니다', 'Formal version used in signs, announcements, and rules.', '[{"korean":"출입구를 막으면 안 됩니다.","english":"You must not block the entrance."},{"korean":"음식물을 반입하면 안 됩니다.","english":"You must not bring food in."}]', 2),
    (l_id, '절대 V-(으)면 안 되다', '절대 + Verb stem + (으)면 안 되다', 'Stronger prohibition: "absolutely must not."', '[{"korean":"개인정보를 타인에게 알려 주면 절대 안 돼요.","english":"You must absolutely not share personal information with others."},{"korean":"운전 중에 절대 전화하면 안 돼요.","english":"You must absolutely not make phone calls while driving."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '방문객', '여기서 사진 찍어도 돼요?', 'Yeogiseo sajin jjigeo-do dwaeyo?', 'Can I take photos here?', 1),
    (l_id, '직원', '죄송합니다. 이 구역에서는 사진을 찍으면 안 됩니다.', 'Joesonghamnida. I guyeok-eseo-neun sajin-eul jjigeumyeon an doeumnida.', 'I''m sorry. You must not take photos in this area.', 2),
    (l_id, '방문객', '아, 그렇군요. 그럼 음식을 가지고 들어가도 돼요?', 'A, geureokgunyo. Geureum eumsik-eul gajigo deureo-gado dwaeyo?', 'Ah, I see. Then can I bring food in?', 3),
    (l_id, '직원', '음식물을 반입하면 안 돼요. 음료수도 안 됩니다.', 'Eumsikml-eul ban-iph-amyeon an dwaeyo. Eumlyosu-do an doeumnida.', 'You must not bring in food. Drinks are not allowed either.', 4),
    (l_id, '방문객', '알겠어요. 그럼 저 쪽에 앉아도 돼요?', 'Algesseoyo. Geureum jeo jjok-e anjado dwaeyo?', 'I understand. Then can I sit over there?', 5),
    (l_id, '직원', '네, 거기는 괜찮습니다. 단, 큰 소리로 떠들면 안 돼요. 다른 관람객들이 있거든요.', 'Ne, geogi-neun gwaenchanseumnida. Dan, keun sori-ro tteodeulmyeon an dwaeyo. Dareun gwallam-gaekdeul-i itgeodeunyo.', 'Yes, there it''s fine. But you must not make loud noise. There are other visitors, you see.', 6),
    (l_id, '방문객', '물론이죠. 조용히 할게요. 감사합니다.', 'Mullonjyo. Joyonghi halgeyo. Gamsahamnida.', 'Of course. I''ll be quiet. Thank you.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '도서관에서 전화하___ 안 돼요.', '["면","지만","고","아서"]', 0, '-(으)면 안 되다 expresses prohibition.', 1),
    (l_id, '절대 운전 중에 전화 ___. (absolute prohibition)', '["해야 해요","하면 안 돼요","해도 돼요","하지 않아도 돼요"]', 1, '절대 + V-(으)면 안 되다 = absolutely must not.', 2),
    (l_id, '''금지''의 뜻은?', '["permission","warning","prohibition","safety"]', 2, '금지 means prohibition or ban.', 3),
    (l_id, '공공장소에서 지켜야 할 규칙이 아닌 것은?', '["조용히 한다","쓰레기를 버리지 않는다","흡연하지 않는다","음식을 반입한다"]', 3, 'Bringing food (음식 반입) is typically prohibited in public places like museums.', 4),
    (l_id, '-(으)면 안 돼요와 -(으)면 안 됩니다의 차이는?', '["의미가 다르다","돼요는 informal, 됩니다는 formal","돼요는 과거, 됩니다는 현재","차이 없다"]', 1, '돼요 is informal/polite; 됩니다 is the formal version used in signs and announcements.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '공공장소에는 여러 가지 규칙이 있습니다. ''-(으)면 안 되다''는 금지를 나타내는 대표적인 표현입니다. 한국의 지하철에서는 음식을 먹으면 안 되고 큰 소리로 통화하면 안 됩니다. 박물관에서는 사진 촬영이 금지된 구역이 있습니다. 공원이나 길거리에서 흡연하면 벌금을 낼 수도 있습니다. 이러한 규칙들은 모든 사람이 공공장소를 쾌적하게 이용할 수 있도록 하기 위한 것입니다. 규칙을 잘 지키는 것이 성숙한 시민의 의무입니다.', 'There are various rules in public places. -(으)면 안 되다 is the representative expression for prohibition. On Korean subways, you must not eat food and you must not make loud phone calls. In museums, there are areas where photography is prohibited. If you smoke in parks or on the street, you may be fined. These rules are intended to allow everyone to use public spaces comfortably. Observing rules well is the duty of a mature citizen.', 1);
END $$;


-- ============================================================
-- Lesson 70: When -ㄹ 때 (때)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 70;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=70 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '때', 'ttae', 'time, when', 1),
    (l_id, '순간', 'sungan', 'moment, instant', 2),
    (l_id, '상황', 'sanghwang', 'situation, circumstance', 3),
    (l_id, '경우', 'gyeong-u', 'case, occasion', 4),
    (l_id, '어릴 때', 'eoril ttae', 'when (one was) young', 5),
    (l_id, '힘들 때', 'himdeul ttae', 'when it''s tough/hard', 6),
    (l_id, '필요할 때', 'piryohal ttae', 'when needed', 7),
    (l_id, '급하다', 'geupada', 'to be urgent, in a hurry', 8),
    (l_id, '기쁘다', 'gippeuda', 'to be glad, happy', 9),
    (l_id, '슬프다', 'seulpeuda', 'to be sad', 10),
    (l_id, '화나다', 'hwanada', 'to become angry', 11),
    (l_id, '그럴 때', 'geureol ttae', 'at such times', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-(으)ㄹ 때', 'V/A stem + (으)ㄹ 때', 'Expresses the time when something happens: "when doing..." or "at the time of..." Used when the action in the main clause is simultaneous with or follows the when-clause.', '[{"korean":"한국에 갈 때 선물을 사 왔어요.","english":"When I went to Korea, I bought souvenirs."},{"korean":"공부할 때 음악을 들어요.","english":"I listen to music when I study."}]', 1),
    (l_id, 'V-(으)ㄴ 때 (past reference)', 'V stem + (으)ㄴ 때', 'Refers to a time in the past when the action was completed.', '[{"korean":"어렸을 때 태권도를 배웠어요.","english":"When I was young, I learned taekwondo."},{"korean":"대학교에 다닐 때 친구를 많이 사귀었어요.","english":"When I was in college, I made many friends."}]', 2),
    (l_id, 'N 때 (noun time)', 'Noun + 때', 'Uses a noun to express "at the time of N."', '[{"korean":"점심때 만나요.","english":"Let''s meet at lunchtime."},{"korean":"방학 때 여행을 가요.","english":"I travel during vacation."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '나영', '스트레스 받을 때 어떻게 해요?', 'Seuteuresseu badeul ttae eotteoke haeyo?', 'What do you do when you''re stressed?', 1),
    (l_id, '민호', '저는 스트레스 받을 때 음악을 들어요. 음악을 들으면 마음이 편해져요.', 'Jeoneun seuteuresseu badeul ttae eumaik-eul deureoyo. Eumaik-eul deureumyeon maeum-i pyeonhaejyeoyo.', 'When I''m stressed, I listen to music. When I listen to music, my mind becomes at ease.', 2),
    (l_id, '나영', '그렇군요. 저는 힘들 때 친구들을 만나서 얘기해요.', 'Geureokgunyo. Jeoneun himdeul ttae chingudeul-eul mannaseo yaegihaeyo.', 'I see. When I''m struggling, I meet friends and talk.', 3),
    (l_id, '민호', '그것도 좋은 방법이에요. 어렸을 때는 스트레스를 어떻게 풀었어요?', 'Geugosdo joeun bangbeobeyo. Eoryeosseul ttae-neun seuteuresseu-reul eotteoke pureosseoyo?', 'That''s also a good method. When you were young, how did you relieve stress?', 4),
    (l_id, '나영', '어렸을 때는 그냥 잠을 잤어요. 자고 나면 다 괜찮아졌거든요.', 'Eoryeosseul ttae-neun geunyang jam-eul jasseoyo. Jago namyeon da gwaenchanajyeogeodeunyo.', 'When I was young, I just slept. After sleeping, everything got better, you see.', 5),
    (l_id, '민호', '그거 좋겠다! 피곤할 때는 자는 게 최고죠.', 'Geugeo joketda! Pigonhal ttae-neun janeun ge choegojyo.', 'That sounds nice! When you''re tired, sleeping is the best.', 6),
    (l_id, '나영', '맞아요. 급할 때는 천천히, 피곤할 때는 쉬는 게 가장 중요한 것 같아요.', 'Majayo. Geuphal ttae-neun cheoncheonhi, pigonhal ttae-neun swineun ge gajang jungyohan geot gatayo.', 'Right. When you''re in a hurry, slow down, and when you''re tired, rest — I think that''s most important.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '공부할 ___ 음악을 들어요.', '["때","곳","것","수"]', 0, 'V-(으)ㄹ 때 = when doing something.', 1),
    (l_id, '어렸___ 태권도를 배웠어요.', '["을 때","ㄹ 때","었을 때","는 때"]', 2, '어렸을 때 = when (one) was young (past state).', 2),
    (l_id, '점심___ 만나요. (noun + 때)', '["때","에 때","에서","시에"]', 0, 'Noun + 때 = at the time of that noun. 점심때 = at lunchtime.', 3),
    (l_id, '''순간''의 의미는?', '["situation","moment/instant","case","time"]', 1, '순간 means a moment or instant.', 4),
    (l_id, '힘들 때 어떻게 하는 것이 좋을까요? (자연스러운 표현)', '["힘들 때 포기하는 게 좋아요","힘들 때 친구와 얘기하는 게 도움이 돼요","힘들 때 더 힘들어야 해요","힘들 때 화내는 게 좋아요"]', 1, 'Talking with a friend when struggling is a healthy way to cope.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 특정 시간이나 상황을 표현할 때 ''때''를 사용합니다. ''-(으)ㄹ 때''는 어떤 행동을 하는 시점을 나타냅니다. 예를 들어 ''밥을 먹을 때 TV를 봐요''는 ''I watch TV when I eat'' 입니다. 과거의 특정 시점을 말할 때는 ''었을 때''를 사용합니다. 명사 뒤에 바로 ''때''를 붙여서 ''점심때'', ''방학 때''처럼 사용하기도 합니다. 이 표현을 잘 활용하면 시간과 상황을 더 명확하게 표현할 수 있습니다.', 'In Korean, 때 is used to express a specific time or situation. -(으)ㄹ 때 indicates the time when an action takes place. For example, ''bab-eul meogeul ttae TV-reul bwayo'' means ''I watch TV when I eat.'' When referring to a specific point in the past, -었을 때 is used. 때 can also be attached directly after a noun, as in 점심때 (at lunchtime) or 방학 때 (during vacation). Using this expression well allows for clearer expression of time and situations.', 1);
END $$;

-- ============================================================
-- Lesson 71: If -면 (조건)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 71;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=71 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '조건', 'jogeon', 'condition, requirement', 1),
    (l_id, '가정', 'gajeong', 'assumption, hypothesis', 2),
    (l_id, '만약', 'manyak', 'if, in case', 3),
    (l_id, '결과', 'gyeolgwa', 'result, outcome', 4),
    (l_id, '날씨가 좋다', 'nalssi-ga jota', 'the weather is good', 3),
    (l_id, '합격하다', 'hapgyeokhada', 'to pass (an exam)', 6),
    (l_id, '실패하다', 'silpaehadd', 'to fail', 7),
    (l_id, '포기하지 않다', 'pogihaji anda', 'not to give up', 8),
    (l_id, '노력하다', 'noryeokhada', 'to make effort', 9),
    (l_id, '성공하다', 'seonggong-hada', 'to succeed', 10),
    (l_id, '변하다', 'byeonhada', 'to change', 11),
    (l_id, '달라지다', 'dallajida', 'to become different', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-(으)면', 'Verb/Adj stem + (으)면', 'Expresses a condition: "if / when / assuming." The main clause states what happens when the condition is met.', '[{"korean":"날씨가 좋으면 공원에 가요.","english":"If the weather is good, I go to the park."},{"korean":"열심히 공부하면 합격할 수 있어요.","english":"If you study hard, you can pass."}]', 1),
    (l_id, '만약 V-(으)면', '만약 + V stem + (으)면', 'Adds the hypothetical marker 만약: "If (hypothetically)..." Slightly more formal or hypothetical.', '[{"korean":"만약 복권에 당첨되면 뭐 할 거예요?","english":"If you win the lottery, what will you do?"},{"korean":"만약 실패하면 어떻게 할 거예요?","english":"If you fail, what will you do?"}]', 2),
    (l_id, 'V-(으)면 V-(으)ㄹ수록', 'V stem + (으)면 + V stem + (으)ㄹ수록', 'Expresses "the more... the more..." correlation.', '[{"korean":"공부하면 할수록 재미있어요.","english":"The more you study, the more interesting it gets."},{"korean":"한국어를 배우면 배울수록 어려워요.","english":"The more you learn Korean, the harder it gets."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '소미', '만약 복권에 당첨되면 뭐 할 거예요?', 'Manyak bokkweon-e dangcheomdeomyeon mwo hal geoyeyo?', 'If you win the lottery, what will you do?', 1),
    (l_id, '태욱', '전 세계를 여행하고 싶어요! 돈이 있으면 여행을 많이 다닐 수 있잖아요.', 'Jeon segye-reul yeohaenghago sipeoyo! Don-i isseumyeon yeohaeng-eul manhi danil su itjanayo.', 'I want to travel the world! If you have money, you can travel a lot, right?', 2),
    (l_id, '소미', '저도요! 시간이 있으면 더 자주 여행할 텐데요.', 'Jeodyo! Sigan-i isseumyeon deo jaju yeohaenghal tendeyo.', 'Me too! If I had time, I would travel more often.', 3),
    (l_id, '태욱', '요즘 시간이 없어요?', 'Yojeum sigan-i eopseoyo?', 'Don''t you have time these days?', 4),
    (l_id, '소미', '네, 시험 준비 때문에 바빠요. 시험이 끝나면 꼭 어디든 가고 싶어요.', 'Ne, siheom junbi ttaemune bappayo. Siheom-i kkeunnamyeon kkok eodideun gago sipeoyo.', 'Yes, I''m busy preparing for an exam. When the exam is over, I definitely want to go somewhere.', 5),
    (l_id, '태욱', '열심히 공부하면 꼭 합격할 거예요!', 'Yeolsimhi gongbu-hamyeon kkok hapgyeokal geoyeyo!', 'If you study hard, you''ll definitely pass!', 6),
    (l_id, '소미', '고마워요. 열심히 하면 할수록 자신감이 생기는 것 같아요.', 'Gomaweoyo. Yeolsimhi hamyeon halsurok jasingam-i saenggineun geot gatayo.', 'Thank you. It seems like the harder I work, the more confidence I gain.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '날씨가 좋___ 공원에 가요.', '["으면","어서","지만","고"]', 0, 'A-(으)면 = if [adjective]. 좋다 → 좋으면.', 1),
    (l_id, '만약 실패하___ 어떻게 할 거예요?', '["고","면","서","지만"]', 1, '만약 + V-(으)면 introduces a hypothetical condition.', 2),
    (l_id, '공부하면 할___ 재미있어요.', '["수록","때","면","지만"]', 0, 'V-(으)면 V-(으)ㄹ수록 = the more... the more.', 3),
    (l_id, '''가정''의 의미는?', '["condition","result","hypothesis/assumption","failure"]', 2, '가정 means assumption or hypothesis.', 4),
    (l_id, '''만약''이 문장에서 하는 역할은?', '["결과를 나타낸다","가정의 의미를 강조한다","시간을 나타낸다","이유를 나타낸다"]', 1, '만약 emphasizes the hypothetical nature of the condition.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 조건을 나타낼 때는 ''-(으)면''을 사용합니다. 이 표현은 영어의 ''if''나 ''when''에 해당합니다. 날씨, 시간, 상황 등 다양한 조건을 표현할 수 있습니다. 더 가정적인 상황을 말할 때는 앞에 ''만약''을 붙여 사용합니다. ''-(으)면 -(으)ㄹ수록''은 ''할수록 더~''처럼 정비례 관계를 나타냅니다. 예를 들어 ''연습하면 할수록 잘 할 수 있어요''처럼 사용합니다.', 'In Korean, -(으)면 is used to express conditions. This expression corresponds to "if" or "when" in English. It can express various conditions such as weather, time, and situations. When talking about more hypothetical situations, 만약 is added in front. -(으)면 -(으)ㄹ수록 expresses a directly proportional relationship like "the more you do, the more..." For example, it is used like ''yeonseupamyeon halsurok jal hal su isseoyo'' (the more you practice, the better you can do it).', 1);
END $$;


-- ============================================================
-- Lesson 72: Before/After -기 전에/-ㄴ 후에 (전후)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 72;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=72 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '전', 'jeon', 'before', 1),
    (l_id, '후', 'hu', 'after', 2),
    (l_id, '먼저', 'meonjeo', 'first, beforehand', 3),
    (l_id, '나중에', 'najung-e', 'later', 4),
    (l_id, '식사', 'siksa', 'meal', 5),
    (l_id, '취침', 'chuchim', 'sleep, bedtime', 6),
    (l_id, '준비', 'junbi', 'preparation', 7),
    (l_id, '양치하다', 'yangchihada', 'to brush teeth', 8),
    (l_id, '씻다', 'ssitda', 'to wash', 9),
    (l_id, '마치다', 'machida', 'to finish', 10),
    (l_id, '출발하다', 'chulbal-hada', 'to depart', 11),
    (l_id, '도착하다', 'dochakada', 'to arrive', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-기 전에', 'Verb stem + 기 전에', 'Means "before doing [verb]." The action in the main clause happens before the action in the subordinate clause.', '[{"korean":"밥 먹기 전에 손을 씻어요.","english":"I wash my hands before eating."},{"korean":"잠자기 전에 양치를 해요.","english":"I brush my teeth before sleeping."}]', 1),
    (l_id, 'V-(으)ㄴ 후에 / V-고 나서', 'V stem + (으)ㄴ 후에 / V stem + 고 나서', 'Means "after doing [verb]." Expresses that the main action occurs after the subordinate action is completed.', '[{"korean":"숙제를 한 후에 TV를 봐요.","english":"After doing homework, I watch TV."},{"korean":"밥을 먹고 나서 운동해요.","english":"After eating, I exercise."}]', 2),
    (l_id, 'N 전에 / N 후에', 'Noun + 전에 / Noun + 후에', 'Uses nouns to express time order: "before/after N."', '[{"korean":"수업 전에 커피를 마셔요.","english":"I drink coffee before class."},{"korean":"식사 후에 약을 먹어요.","english":"I take medicine after a meal."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '부모님', '학교 가기 전에 아침을 먹었어?', 'Hakgyo gagi jeon-e achim-eul meogeosseo?', 'Did you eat breakfast before going to school?', 1),
    (l_id, '아이', '네, 먹었어요. 그리고 출발하기 전에 숙제도 챙겼어요.', 'Ne, meogeosseoyo. Geurigo chulbal-hagi jeon-e sukje-do chaenggyeosseoyo.', 'Yes, I did. And I also packed my homework before leaving.', 2),
    (l_id, '부모님', '잘했어. 학교 끝나고 나서 어떻게 할 거야?', 'Jalhaesseo. Hakgyo kkeunago naseo eotteoke hal geoya?', 'Good job. What will you do after school finishes?', 3),
    (l_id, '아이', '학원에 갔다가 집에 올게요. 집에 온 후에 숙제 먼저 할게요.', 'Hagwon-e gatdaga jib-e olgeyo. Jib-e on hu-e sukje meonjeo halgeyo.', 'I''ll go to the academy and then come home. After coming home, I''ll do homework first.', 4),
    (l_id, '부모님', '그리고 잠자기 전에 꼭 양치하는 거 잊지 마.', 'Geurigo jamjagi jeon-e kkok yangchi-haneun geo itji ma.', 'And don''t forget to brush your teeth before sleeping.', 5),
    (l_id, '아이', '알겠어요! 저녁 먹고 나서 양치하고 잘게요.', 'Algeosseoyo! Jeonyeok meokgo naseo yangchi-hago jalgeyo.', 'I got it! I''ll brush my teeth after dinner and then sleep.', 6),
    (l_id, '부모님', '착하다. 오늘도 즐거운 하루 보내렴.', 'Chakada. Oneuldo jeulgeoun haru bonaeryeom.', 'Good boy/girl. Have a happy day today too.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '밥 먹___ 전에 손을 씻어요.', '["는","기","고","어"]', 1, 'V-기 전에 = before doing [verb].', 1),
    (l_id, '숙제를 한 ___ TV를 봐요.', '["전에","후에","때에","동안"]', 1, 'V-(으)ㄴ 후에 = after doing [verb].', 2),
    (l_id, '밥을 먹___ 나서 운동해요.', '["기","고","어","는"]', 1, 'V-고 나서 = after doing [verb] (completed).', 3),
    (l_id, '수업 ___ 커피를 마셔요. (before class)', '["전에","후에","동안","때"]', 0, 'N + 전에 = before N. 수업 전에 = before class.', 4),
    (l_id, '-기 전에와 -(으)ㄴ 후에 중 어느 것이 먼저인가?', '["-기 전에가 더 나중 일이다","-(으)ㄴ 후에가 더 이른 일이다","-기 전에가 더 이른 일이다 (먼저)","둘 다 같은 시간이다"]', 2, '-기 전에 means the action hasn''t happened yet (beforehand), so it comes first in time.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '우리 일상에서 순서를 나타내는 표현은 매우 중요합니다. 한국어에서 ''전''은 어떤 행동 이전을, ''후''는 이후를 나타냅니다. 동사 뒤에 ''-기 전에''를 붙이면 ''~하기 전에''가 됩니다. 반대로 ''-은/ㄴ 후에''나 ''-고 나서''는 어떤 행동 후에 다른 행동을 할 때 씁니다. 이런 시간 순서 표현을 잘 활용하면 일상을 체계적으로 설명할 수 있습니다. 예를 들어 ''아침을 먹기 전에 운동을 해요. 운동을 한 후에 씻어요''처럼 하루 일과를 순서대로 말할 수 있습니다.', 'Expressions that indicate order are very important in our daily lives. In Korean, 전 indicates before an action and 후 indicates after. Attaching -기 전에 after a verb creates the meaning "before doing ~." Conversely, -(으)ㄴ 후에 or -고 나서 are used when doing another action after completing one action. Using these time-sequence expressions well allows for a systematic description of daily life. For example, you can describe your daily routine in order: "I exercise before eating breakfast. After exercising, I wash up."', 1);
END $$;

-- ============================================================
-- Lesson 73: Becoming -아/어지다 (변화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 73;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=73 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '변화', 'byeonhwa', 'change, transformation', 1),
    (l_id, '점점', 'jeomjeom', 'gradually, more and more', 2),
    (l_id, '갑자기', 'gapjagi', 'suddenly', 3),
    (l_id, '조금씩', 'jogeumssik', 'little by little', 4),
    (l_id, '늘다', 'neulda', 'to increase', 5),
    (l_id, '줄다', 'julda', 'to decrease', 6),
    (l_id, '건강해지다', 'geonganghajida', 'to become healthy', 7),
    (l_id, '따뜻해지다', 'ttatteutaejida', 'to become warm', 8),
    (l_id, '어두워지다', 'eoduwojida', 'to become dark', 9),
    (l_id, '익숙해지다', 'iksukhajida', 'to become accustomed to', 10),
    (l_id, '발전하다', 'baljeonhada', 'to develop, to progress', 11),
    (l_id, '성장하다', 'seongjang-hada', 'to grow', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'A-아/어지다', 'Adjective stem + 아/어지다', 'Expresses a change of state: "become [adjective]." Shows a gradual or sudden transition.', '[{"korean":"날씨가 따뜻해졌어요.","english":"The weather has become warm."},{"korean":"한국어가 점점 쉬워지고 있어요.","english":"Korean is gradually becoming easier."}]', 1),
    (l_id, 'V-게 되다', 'Verb stem + 게 되다', 'Expresses an unintended change or natural development: "come to do" or "end up doing."', '[{"korean":"한국에 살게 됐어요.","english":"I ended up living in Korea."},{"korean":"한국 음식을 좋아하게 됐어요.","english":"I came to like Korean food."}]', 2),
    (l_id, '점점 / 갑자기 A-아/어지다', '점점/갑자기 + A stem + 아/어지다', 'Adds adverbs to specify the pace of change.', '[{"korean":"날씨가 갑자기 추워졌어요.","english":"The weather suddenly became cold."},{"korean":"실력이 점점 늘어나고 있어요.","english":"My skills are gradually increasing."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '준혁', '요즘 한국어 실력이 많이 늘었어요?', 'Yojeum Hangugeo sillyeok-i manhi neureosseoyo?', 'Has your Korean skill improved a lot these days?', 1),
    (l_id, '사라', '네, 처음보다 많이 좋아졌어요. 매일 공부하다 보니까 조금씩 나아지더라고요.', 'Ne, cheoeum-boda manhi jo-ajyeosseoyo. Maeil gongbu-hada bonikka jogeumssik naajideorago-yo.', 'Yes, it''s gotten much better than at first. As I kept studying every day, it improved little by little.', 2),
    (l_id, '준혁', '언제부터 공부하기 시작했어요?', 'Eonje-buto gongbu-hagi sijakhaesseoyo?', 'When did you start studying?', 3),
    (l_id, '사라', '6개월 전부터요. 처음에는 너무 어렵게 느껴졌는데 이제는 익숙해졌어요.', 'Yuk-gaeweol jeon-butoyo. Cheoeum-e-neun neomu eoryeopge neu-kkyeojyeonneunde ije-neun iksukhajyeosseoyo.', 'From 6 months ago. At first it felt very difficult, but now I''ve gotten used to it.', 4),
    (l_id, '준혁', '한국어 듣기는 어때요?', 'Hangugeo deutgi-neun eottaeyo?', 'How about Korean listening?', 5),
    (l_id, '사라', '드라마를 보다 보니까 드라마 대사들이 점점 들리게 됐어요!', 'Deurama-reul boda bonikka deurama daesadeul-i jeomjeom deullige dwaeosseoyo!', 'As I kept watching dramas, I came to be able to hear the drama lines more and more!', 6),
    (l_id, '준혁', '대단해요! 꾸준히 하면 더 잘하게 될 거예요.', 'Daedanaeyo! Kkujunhi hamyeon deo jalhage doel geoyeyo.', 'That''s amazing! If you keep it up, you''ll become even better.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '날씨가 점점 따뜻해___. (becoming)', '["요","졌어요","겠어요","았어요"]', 1, 'A-아/어지다 expresses change of state. 따뜻해지다 → 따뜻해졌어요.', 1),
    (l_id, '한국어를 좋아하___ 됐어요. (came to like)', '["는 게","게","아야","기로"]', 1, 'V-게 되다 expresses an unintended or natural development.', 2),
    (l_id, '날씨가 ___ 추워졌어요. (suddenly)', '["점점","서서히","갑자기","조금씩"]', 2, '갑자기 means suddenly.', 3),
    (l_id, '''익숙해지다''의 의미는?', '["to become healthy","to become accustomed to","to become dark","to develop"]', 1, '익숙해지다 means to become accustomed to/familiar with.', 4),
    (l_id, '-아/어지다와 -게 되다의 차이는?', '["-아/어지다는 의도적 변화, -게 되다는 자연적 변화","-아/어지다는 형용사, -게 되다는 동사에 주로 씀","-아/어지다는 과거, -게 되다는 미래","차이 없다"]', 1, '-아/어지다 mainly attaches to adjectives to show state change; -게 되다 attaches to verbs to show unintended outcome.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어에서 변화를 나타낼 때는 ''-아/어지다''를 주로 형용사와 함께 사용합니다. 예를 들어 ''봄이 되면 따뜻해져요''는 ''it becomes warm in spring''입니다. 동사와 함께 변화를 나타낼 때는 ''-게 되다''를 사용합니다. 이 표현은 의도하지 않은 결과나 자연스러운 발전을 나타낼 때 쓰입니다. ''점점''이나 ''갑자기'' 같은 부사를 함께 사용하면 변화의 속도를 표현할 수 있습니다. 꾸준한 노력을 통해 실력이 조금씩 나아지는 것이 언어 학습의 핵심입니다.', 'In Korean, -아/어지다 is mainly used with adjectives to indicate change. For example, ''bomi doemy eottajeyo'' means ''it becomes warm in spring.'' When indicating change with verbs, -게 되다 is used. This expression is used to show unintended results or natural development. Using adverbs like 점점 (gradually) or 갑자기 (suddenly) together can express the pace of change. The key to language learning is improving little by little through consistent effort.', 1);
END $$;


-- ============================================================
-- Lesson 74: Trying -아/어 보다 (시도)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 74;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=74 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '시도', 'sido', 'attempt, trial', 1),
    (l_id, '도전', 'dojeon', 'challenge', 2),
    (l_id, '입어보다', 'ib-eo boda', 'to try on (clothes)', 3),
    (l_id, '신어보다', 'sin-eo boda', 'to try on (shoes)', 4),
    (l_id, '맛보다', 'matboda', 'to taste, to try food', 5),
    (l_id, '해보다', 'haeboda', 'to try doing', 6),
    (l_id, '써보다', 'sseoboda', 'to try using', 7),
    (l_id, '읽어보다', 'ilgeo boda', 'to try reading', 8),
    (l_id, '연습하다', 'yeonseuphada', 'to practice', 9),
    (l_id, '무서워하다', 'museowohada', 'to be scared of', 10),
    (l_id, '용기', 'yonggi', 'courage', 11),
    (l_id, '결과', 'gyeolgwa', 'result', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-아/어 보다', 'Verb stem + 아/어 보다', 'Expresses trying or attempting an action: "try doing," "give it a try."', '[{"korean":"이 음식 먹어 봐요.","english":"Try eating this food."},{"korean":"한국 노래를 불러 봤어요.","english":"I tried singing a Korean song."}]', 1),
    (l_id, 'V-아/어 봤는데 (result)', 'V stem + 아/어 봤는데 + result', 'Shares the result or impression after trying something.', '[{"korean":"먹어 봤는데 너무 맛있었어요.","english":"I tried it and it was so delicious."},{"korean":"해 봤는데 생각보다 어려웠어요.","english":"I tried it and it was harder than I thought."}]', 2),
    (l_id, 'V-아/어 보면 알 거예요', 'V stem + 아/어 보면 알 거예요', 'Encourages trying: "Once you try it, you''ll understand/know."', '[{"korean":"직접 해 보면 알 거예요.","english":"If you try it yourself, you''ll know."},{"korean":"먹어 보면 맛있다는 걸 알 거예요.","english":"If you try eating it, you''ll know it''s delicious."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '점원', '이 옷 어때요? 한번 입어 보시겠어요?', 'I ot eottaeyo? Hanbeon ib-eo bosigesseoyo?', 'How about this outfit? Would you like to try it on?', 1),
    (l_id, '손님', '예쁘네요. 색깔이 좀 밝은데 저한테 어울릴지 모르겠어요.', 'Yeppeoneyo. Saekgal-i jom balgeunde jeohante eoullilji moreugesseoyo.', 'It''s pretty. The color is a bit bright and I''m not sure if it will suit me.', 2),
    (l_id, '점원', '입어 보면 알 거예요! 탈의실은 저 쪽에 있어요.', 'Ib-eo bomyeon al geoyeyo! Talbui-sil-eun jeo jjoke isseoyo.', 'Once you try it on, you''ll know! The fitting room is over there.', 3),
    (l_id, '손님', '알겠어요. 한번 입어 볼게요.', 'Algesseoyo. Hanbeon ib-eo bolgeyo.', 'All right. I''ll give it a try.', 4),
    (l_id, '손님', '(나중에) 입어 봤는데 생각보다 잘 어울려요!', '(Najung-e) ib-eo bwanneunde saenggak-boda jal eoullyeoyo!', '(Later) I tried it on and it suits me better than I thought!', 5),
    (l_id, '점원', '정말 잘 어울리시네요. 다른 색깔도 입어 보시겠어요?', 'Jeongmal jal eoullirineyo. Dareun saekgal-do ib-eo bosigesseoyo?', 'It really suits you well. Would you like to try other colors too?', 6),
    (l_id, '손님', '네, 파란색도 있으면 한번 입어 볼게요.', 'Ne, paramsaek-do isseumyeon hanbeon ib-eo bolgeyo.', 'Yes, if there''s a blue one, I''ll try that on too.', 7),
    (l_id, '점원', '네, 잠깐만요. 이 파란색은 어때요?', 'Ne, jamkkanmayo. I paramsaek-eun eottaeyo?', 'Yes, just a moment. How about this blue one?', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '이 음식 한번 먹어 ___. (suggestion to try)', '["봐요","봤어요","보세요","볼까요"]', 2, 'V-아/어 보세요 = please try doing.', 1),
    (l_id, '해 봤___ 생각보다 쉬웠어요. (tried and result)', '["지만","는데","는","면서"]', 1, 'V-아/어 봤는데 shares the result of trying.', 2),
    (l_id, '먹어 보___ 맛있다는 걸 알 거예요.', '["아야","면","고","서"]', 1, 'V-아/어 보면 알 거예요 = once you try it, you''ll know.', 3),
    (l_id, '''용기''의 의미는?', '["challenge","result","courage","attempt"]', 2, '용기 means courage.', 4),
    (l_id, '''-아/어 보다''의 핵심 의미는?', '["completion","experience of having done","trying/attempting","obligation"]', 2, '-아/어 보다 expresses trying or attempting an action.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '무언가를 처음 시도할 때는 두려움이 느껴질 수 있습니다. 하지만 한국 속담에 ''백문이 불여일견''이라는 말처럼 직접 해보는 것이 가장 좋습니다. 한국어로 ''한번 해 봐요''는 상대방에게 시도해 보라고 권유하는 표현입니다. 옷을 살 때 ''입어 보세요''라고 하고, 음식을 먹을 때 ''먹어 보세요''라고 권유합니다. 새로운 것을 시도하면 처음에는 어렵지만 점점 익숙해집니다. 용기를 내어 새로운 도전을 해보는 것이 성장의 비결입니다.', 'When trying something for the first time, you may feel fear. However, as the Korean proverb ''baengmun-i bulyeo-ilgyeon'' (hearing a hundred times is not as good as seeing once) suggests, doing it directly is the best. In Korean, ''hanbeon hae bwayo'' is an expression that encourages the other person to give it a try. When buying clothes, you say ''ib-eo boseyo'' (please try it on), and when encouraging someone to eat food, you say ''meogeoboseyo'' (please try eating). When you try something new, it''s difficult at first but gradually becomes familiar. Having the courage to take on new challenges is the secret to growth.', 1);
END $$;

-- ============================================================
-- Lesson 75: Politeness Levels (경어 체계)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 75;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=75 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '존댓말', 'jondaenmal', 'polite/formal speech', 1),
    (l_id, '반말', 'banmal', 'informal/casual speech', 2),
    (l_id, '격식체', 'gyeoksikcheae', 'formal speech style', 3),
    (l_id, '비격식체', 'bigyeoksikcheae', 'informal polite style', 4),
    (l_id, '높임말', 'nopimmal', 'honorific speech', 5),
    (l_id, '경어', 'gyeong-eo', 'honorific language', 6),
    (l_id, '어르신', 'eoreusin', 'elderly person (respectful)', 7),
    (l_id, '손윗사람', 'sonwit-saram', 'a person of higher rank/age', 8),
    (l_id, '어미', 'eomi', 'verb ending', 9),
    (l_id, '-시-', '-si-', 'honorific infix', 10),
    (l_id, '께서', 'kkeseo', 'subject particle (honorific)', 11),
    (l_id, '께', 'kke', 'dative particle (honorific)', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, '존댓말 vs 반말', 'Verb stem + (으)세요/아요/어요 vs Verb stem + 아/어', 'Polite speech (존댓말) uses -아요/어요 endings. Informal speech (반말) drops the -요.', '[{"korean":"어디 가세요? (존댓말) / 어디 가? (반말)","english":"Where are you going? (polite) / Where are you going? (informal)"},{"korean":"밥 먹었어요? (존댓말) / 밥 먹었어? (반말)","english":"Did you eat? (polite) / Did you eat? (informal)"}]', 1),
    (l_id, '주어 높임: -시-', 'V stem + 시 + ending', 'The infix -시- is inserted into the verb to show respect for the subject of the sentence.', '[{"korean":"선생님께서 오세요.","english":"The teacher is coming."},{"korean":"할머니께서 진지를 드세요.","english":"Grandmother is eating (a meal)."}]', 2),
    (l_id, '특수 경어 어휘', 'Honorific vocabulary replacements', 'Some verbs and nouns have special honorific forms that must be used when referring to respected persons.', '[{"korean":"먹다→드시다/잡수시다, 자다→주무시다, 말하다→말씀하시다","english":"eat→to eat (hon.), sleep→to sleep (hon.), say→to say (hon.)"},{"korean":"밥→진지, 이름→성함, 집→댁","english":"meal (hon.), name (hon.), house (hon.)"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '민수', '한국어 존댓말이 복잡하지 않아요?', 'Hangugeo jondaenmal-i bokjapaji anayo?', 'Isn''t Korean honorific speech complicated?', 1),
    (l_id, '선생님', '처음에는 어렵지만 익숙해지면 자연스러워요. 가장 중요한 건 어른께 -세요/-(으)십시오를 쓰는 거예요.', 'Cheoeum-eneun eoryeopjiman iksukhajimyeon jayeonseureoweoyo. Gajang jungyohan geon eoreonkke -seyo/--(eu)sipsiyo-reul sseuneun geoyeyo.', 'It''s difficult at first, but once you get used to it, it becomes natural. The most important thing is to use -세요/-(으)십시오 with elders.', 2),
    (l_id, '민수', '선생님, 할머니께서 ''진지 드세요''라고 하는 게 맞죠?', 'Seonsaengnim, halmeonikeseo ''jinji deuseyo''-rago haneun ge matjyo?', 'Teacher, it''s correct to say ''jinji deuseyo'' to grandmother, right?', 3),
    (l_id, '선생님', '맞아요! ''진지''는 ''밥''의 높임말이고 ''드시다''는 ''먹다''의 높임말이에요.', 'Majayo! ''jinji''neun ''bap''-ui nopimmal-igo ''deusida''neun ''meokda''-ui nopimmal-ieyo.', 'Correct! ''Jinji'' is the honorific form of ''bap'' (rice/meal) and ''deusida'' is the honorific form of ''meokda'' (to eat).', 4),
    (l_id, '민수', '이름을 물어볼 때도 ''성함이 어떻게 되세요?''라고 하죠?', 'Ireum-eul mureobolttte-do ''seongham-i eotteoke doeseyo?''-rago hajyo?', 'When asking for a name, you also say ''What is your name?'' (honorific), right?', 5),
    (l_id, '선생님', '네, 맞아요. ''성함''은 ''이름''의 높임말이에요. 존댓말을 잘 쓰면 한국에서 좋은 인상을 줄 수 있어요.', 'Ne, majayo. ''Seongham''eun ''ireum''-ui nopimmal-ieyo. Jondaenmal-eul jal sseuymyeon Hanguk-eseo joeun insang-eul jul su isseoyo.', 'Yes, correct. ''Seongham'' is the honorific form of ''ireum'' (name). Using polite speech well can make a good impression in Korea.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '할머니께 식사 권유 시 올바른 표현은?', '["밥 먹어요","진지 드세요","밥 드세요","진지 먹어요"]', 1, '진지 (honorific for meal) + 드세요 (honorific for 먹다) is the correct form.', 1),
    (l_id, '선생님이 오실 때 올바른 표현은?', '["선생님이 와요","선생님이 오세요","선생님이 옵니다","선생님께서 오세요"]', 3, '께서 is the honorific subject particle; 오시다 (오세요) is the honorific form.', 2),
    (l_id, '''주무시다''는 어떤 동사의 높임말입니까?', '["가다","먹다","자다","말하다"]', 2, '주무시다 is the honorific form of 자다 (to sleep).', 3),
    (l_id, '친구에게 말할 때 쓰는 말투는?', '["격식체","존댓말","반말","경어"]', 2, '반말 (informal speech) is used with close friends of similar age.', 4),
    (l_id, '''성함''은 무엇의 높임말입니까?', '["집","밥","이름","나이"]', 2, '성함 is the honorific form of 이름 (name).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어 경어 체계는 매우 발달해 있습니다. 크게 존댓말과 반말로 나눌 수 있습니다. 존댓말은 어른이나 잘 모르는 사람에게 사용하고, 반말은 친한 친구나 연하에게 사용합니다. 높임 표현에는 주어를 높이는 ''주체 높임''과 듣는 사람을 높이는 ''상대 높임''이 있습니다. 특히 일부 단어는 높임말 형태가 따로 있습니다. 예를 들어 ''밥''은 ''진지'', ''이름''은 ''성함'', ''나이''는 ''연세''로 바뀝니다. 한국에서 적절한 경어를 사용하는 것은 중요한 문화적 예절입니다.', 'The honorific system of Korean is highly developed. It can be broadly divided into polite speech (존댓말) and informal speech (반말). Polite speech is used with elders or people you don''t know well, while informal speech is used with close friends or people younger than you. Honorific expressions include ''subject honorifics'' (raising the subject) and ''addressee honorifics'' (raising the listener). In particular, some words have separate honorific forms. For example, ''bap'' (rice/meal) becomes ''jinji,'' ''ireum'' (name) becomes ''seongham,'' and ''nai'' (age) becomes ''yeonse.'' Using appropriate honorifics in Korea is an important cultural etiquette.', 1);
END $$;


-- ============================================================
-- Lesson 76: Korean Media (한국 미디어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 76;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=76 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '미디어', 'midieo', 'media', 1),
    (l_id, '드라마', 'deurama', 'drama, TV series', 2),
    (l_id, '방송', 'bangsong', 'broadcast', 3),
    (l_id, '스트리밍', 'seuteuriiming', 'streaming', 4),
    (l_id, '유튜브', 'yutubeu', 'YouTube', 5),
    (l_id, '구독하다', 'gudok-ada', 'to subscribe', 6),
    (l_id, '콘텐츠', 'kontenchu', 'content', 7),
    (l_id, '영향을 미치다', 'yeonghyang-eul michida', 'to influence', 8),
    (l_id, '인터넷', 'inteonet', 'internet', 9),
    (l_id, 'SNS', 'eseuenseu', 'social media/SNS', 10),
    (l_id, '올리다', 'ollida', 'to upload, to post', 11),
    (l_id, '댓글', 'daeggeul', 'comment (online)', 12),
    (l_id, '알고리즘', 'algolijeum', 'algorithm', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에서 인기를 끌다', 'N + 에서 인기를 끌다', 'Means "to be popular in/at N." Common when discussing media trends.', '[{"korean":"이 드라마는 전 세계에서 인기를 끌고 있어요.","english":"This drama is gaining popularity worldwide."},{"korean":"K-pop이 전 세계에서 인기를 끌어요.","english":"K-pop is popular worldwide."}]', 1),
    (l_id, 'N을/를 통해 V', 'N + 을/를 통해 + V', 'Means "through N, V." Used for how something is done via a medium.', '[{"korean":"SNS를 통해 정보를 얻어요.","english":"I get information through SNS."},{"korean":"유튜브를 통해 한국어를 배워요.","english":"I learn Korean through YouTube."}]', 2),
    (l_id, 'V-는 것이 유행이다', 'V-는 것이 유행이에요', 'Expresses that something is trending or fashionable.', '[{"korean":"요즘 숏폼 영상을 보는 게 유행이에요.","english":"Watching short-form videos is trending these days."},{"korean":"한국 드라마를 정주행하는 게 유행이에요.","english":"Binge-watching Korean dramas is trending."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '다니엘', '요즘 어떤 한국 드라마 보고 있어요?', 'Yojeum eotteon Hanguk deurama bogo isseoyo?', 'What Korean drama are you watching these days?', 1),
    (l_id, '지현', '넷플릭스에서 새로 나온 드라마를 보고 있어요. 전 세계에서 인기를 끌고 있대요.', 'Netpeullikikseu-eseo saero naon deurama-reul bogo isseoyo. Jeon segye-eseo ingi-reul kkeulgo itdaeyo.', 'I''m watching a new drama on Netflix. Apparently it''s gaining popularity worldwide.', 2),
    (l_id, '다니엘', '저도 한국 드라마를 통해서 한국어를 많이 배웠어요.', 'Jeodo Hanguk deurama-reul tonghae-seo Hangugeo-reul manhi baewosseoyo.', 'I also learned a lot of Korean through Korean dramas.', 3),
    (l_id, '지현', '맞아요! 요즘은 유튜브에서도 한국어 공부 콘텐츠가 많아서 좋아요.', 'Majayo! Yojeum-eun yutubeu-eseo-do Hangugeo gongbu kontenchu-ga mana-seo joayo.', 'Right! These days there are also many Korean study contents on YouTube, which is great.', 4),
    (l_id, '다니엘', '한국 미디어가 세계적으로 이렇게 인기를 끌게 된 이유가 뭔지 알아요?', 'Hanguk midieo-ga segyejeog-euro ireokeong ingi-reul kkeulge doen iyu-ga mweonji arayo?', 'Do you know why Korean media has become this popular worldwide?', 5),
    (l_id, '지현', '다양한 이유가 있는데요. 드라마 내용의 공감대, 음악의 완성도, 그리고 SNS를 통한 확산이 큰 역할을 했다고 생각해요.', 'Dayanghan iyu-ga inneundeyo. Deurama naeyong-ui gonggamte, eumaik-ui wanseongt, geurigo SNS-reul tongan hwaksan-i keun yeokhal-eul haettago saenggakaeyo.', 'There are various reasons. I think the relatable drama content, the quality of music, and the spread through SNS played a big role.', 6),
    (l_id, '다니엘', '정말 그렇네요. SNS의 영향이 정말 크다고 생각해요.', 'Jeongmal geureonne-yo. SNS-ui yeonghyang-i jeongmal keudago saenggakaeyo.', 'That''s really true. I think SNS influence is really great.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, 'K-pop이 전 세계___ 인기를 끌어요.', '["에서","에","으로","이"]', 0, 'N에서 인기를 끌다 = to be popular in N.', 1),
    (l_id, 'SNS___ 정보를 얻어요.', '["에서","를 통해","에","으로"]', 1, 'N을/를 통해 = through N.', 2),
    (l_id, '요즘 숏폼 영상을 보는 게 ___이에요. (trending)', '["인기","유행","방송","유명"]', 1, '유행이다 = is trending, fashionable.', 3),
    (l_id, '''구독하다''의 의미는?', '["to post","to comment","to subscribe","to upload"]', 2, '구독하다 means to subscribe.', 4),
    (l_id, '한국 미디어의 세계적 확산에 기여한 요소가 아닌 것은?', '["드라마의 공감대","SNS 확산","한국어의 어려움","K-pop 음악의 완성도"]', 2, 'The difficulty of the Korean language is not a contributing factor to hallyu''s global spread.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 미디어는 최근 몇 년 사이에 전 세계적으로 큰 인기를 끌고 있습니다. 드라마, K-pop, 영화 등 다양한 한국 콘텐츠가 넷플릭스와 같은 스트리밍 서비스를 통해 세계에 알려졌습니다. SNS는 한국 문화의 확산에 매우 중요한 역할을 했습니다. 이러한 ''한류'' 현상은 한국어 학습 열풍으로도 이어졌습니다. 유튜브에는 한국어 학습 채널이 수없이 많아졌고, 한국 드라마를 통해 자연스럽게 한국어를 배우는 사람들도 많아졌습니다.', 'Korean media has been gaining great popularity worldwide in recent years. Various Korean content such as dramas, K-pop, and movies have become known to the world through streaming services like Netflix. SNS has played a very important role in spreading Korean culture. This ''Hallyu'' (Korean Wave) phenomenon has also led to a craze for learning Korean. There are countless Korean language learning channels on YouTube, and many people have come to learn Korean naturally through Korean dramas.', 1);
END $$;

-- ============================================================
-- Lesson 77: Health and Wellbeing (건강)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 77;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=77 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '건강', 'geongong', 'health', 1),
    (l_id, '운동', 'undong', 'exercise', 2),
    (l_id, '식단', 'sikdan', 'diet, meal plan', 3),
    (l_id, '면역력', 'myeon-yeokyeok', 'immunity', 4),
    (l_id, '스트레스', 'seuteuresseu', 'stress', 5),
    (l_id, '수면', 'sumyeon', 'sleep', 6),
    (l_id, '균형', 'gyunhyeong', 'balance', 7),
    (l_id, '비타민', 'bitamin', 'vitamin', 8),
    (l_id, '충분히', 'chungbunhi', 'sufficiently, enough', 9),
    (l_id, '규칙적으로', 'gyuchikjeog-euro', 'regularly', 10),
    (l_id, '몸무게', 'monmuge', 'body weight', 11),
    (l_id, '병원', 'byeong-won', 'hospital', 12),
    (l_id, '예방하다', 'yebanghada', 'to prevent', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 좋다/나쁘다', 'N + 에 좋다/나쁘다', 'Expresses that something is good or bad for a particular thing (health, body, etc.).', '[{"korean":"운동은 건강에 좋아요.","english":"Exercise is good for your health."},{"korean":"패스트푸드는 건강에 나빠요.","english":"Fast food is bad for your health."}]', 1),
    (l_id, 'V-는 것이 중요하다', 'V-는 것이 중요하다', 'States the importance of a habitual action for health or well-being.', '[{"korean":"충분히 자는 것이 중요해요.","english":"It is important to sleep sufficiently."},{"korean":"규칙적으로 운동하는 것이 중요해요.","english":"It is important to exercise regularly."}]', 2),
    (l_id, 'A-게 먹다/살다', 'Adjective + 게 + 먹다/살다', 'Adverbial use of adjective to describe how one eats or lives.', '[{"korean":"건강하게 먹으려고 노력해요.","english":"I try to eat healthily."},{"korean":"균형 있게 생활하는 게 좋아요.","english":"It''s good to live a balanced life."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '의사', '요즘 어떻게 지내세요?', 'Yojeum eotteoke jinaeneyo?', 'How have you been lately?', 1),
    (l_id, '환자', '요즘 너무 피곤한 것 같아요. 에너지가 없어요.', 'Yojeum neomu pigonhan geot gatayo. Eneoji-ga eopseoyo.', 'I think I''m too tired lately. I have no energy.', 2),
    (l_id, '의사', '수면은 어때요? 충분히 자고 있어요?', 'Sumyeon-eun eottaeyo? Chungbunhi jago isseoyo?', 'How about sleep? Are you getting enough sleep?', 3),
    (l_id, '환자', '보통 하루에 5-6시간밖에 못 자요. 일이 많아서요.', 'Botong haru-e 5-6sigan-bakke mot jayo. Il-i mana-seoyo.', 'Usually I can only sleep 5-6 hours a day. Because I have a lot of work.', 4),
    (l_id, '의사', '수면이 부족하면 면역력이 떨어질 수 있어요. 하루에 7-8시간은 자는 게 중요해요.', 'Sumyeon-i bujokamyeon myeon-yeokyeok-i tteoreojil su isseoyo. Haru-e 7-8sigan-eun janeun ge jungyohaeyo.', 'If sleep is insufficient, your immunity can decrease. It''s important to sleep 7-8 hours a day.', 5),
    (l_id, '환자', '알겠어요. 식단도 신경 써야 할까요?', 'Algeosseoyo. Sikdan-do singgyeong sseooya halkkayo?', 'I see. Should I also pay attention to my diet?', 6),
    (l_id, '의사', '네, 균형 있게 먹는 것도 중요해요. 채소와 단백질을 충분히 드세요.', 'Ne, gyunhyeong itge meongneun geotdo jungyohaeyo. Chaeso-wa danbaekjil-eul chungbunhi deuseyo.', 'Yes, eating a balanced diet is also important. Please get sufficient vegetables and protein.', 7),
    (l_id, '환자', '감사합니다. 건강하게 생활하도록 노력할게요.', 'Gamsahamnida. Geonganghage saenghwal-adorok noryeokal-geyo.', 'Thank you. I''ll try to live healthily.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '운동은 건강___ 좋아요.', '["이","에","을","으로"]', 1, 'N에 좋다 = good for N. 건강에 좋다 = good for health.', 1),
    (l_id, '충분히 자는 ___ 중요해요.', '["것","때","게","수"]', 0, 'V-는 것이 중요하다 expresses the importance of a habitual action.', 2),
    (l_id, '''면역력''의 의미는?', '["diet","balance","immunity","exercise"]', 2, '면역력 means immunity.', 3),
    (l_id, '건강에 나쁜 것은?', '["규칙적인 운동","충분한 수면","패스트푸드","균형 잡힌 식단"]', 2, 'Fast food (패스트푸드) is bad for health.', 4),
    (l_id, '하루에 권장 수면 시간은?', '["3-4시간","5-6시간","7-8시간","10시간 이상"]', 2, 'The recommended sleep duration is 7-8 hours per day.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '건강은 가장 소중한 것 중 하나입니다. 건강을 유지하려면 규칙적인 운동, 균형 잡힌 식단, 충분한 수면이 필요합니다. 한국 전통 의학에서는 몸과 마음의 균형을 중시합니다. 삼계탕이나 홍삼 같은 전통 음식들은 건강에 좋다고 알려져 있습니다. 현대인들은 스트레스가 많아 건강 관리에 더욱 신경 써야 합니다. 매년 건강 검진을 받는 것도 건강을 예방적으로 관리하는 좋은 방법입니다.', 'Health is one of the most precious things. To maintain health, regular exercise, a balanced diet, and sufficient sleep are needed. In Korean traditional medicine, the balance of body and mind is emphasized. Traditional foods like samgyetang (ginseng chicken soup) and red ginseng are known to be good for health. Modern people have a lot of stress, so they need to pay more attention to health management. Getting an annual health check-up is also a good way to manage health preventively.', 1);
END $$;


-- ============================================================
-- Lesson 78: Environment (환경)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 78;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=78 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '환경', 'hwangyeong', 'environment', 1),
    (l_id, '오염', 'oyeom', 'pollution', 2),
    (l_id, '재활용', 'jaehwalyong', 'recycling', 3),
    (l_id, '탄소', 'tanso', 'carbon', 4),
    (l_id, '온난화', 'onnanwa', 'global warming', 5),
    (l_id, '기후 변화', 'gihu byeonhwa', 'climate change', 6),
    (l_id, '친환경', 'chinhwangyeong', 'eco-friendly', 7),
    (l_id, '절약하다', 'jeolyakhada', 'to save, to conserve', 8),
    (l_id, '쓰레기', 'sseurelgi', 'garbage, waste', 9),
    (l_id, '분리수거', 'bullisugeo', 'separate waste collection', 10),
    (l_id, '자연', 'jayeon', 'nature', 11),
    (l_id, '보호하다', 'bohohada', 'to protect', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N이/가 심각하다', 'N + 이/가 심각하다', 'Expresses that a problem or situation is serious.', '[{"korean":"환경 오염이 심각해요.","english":"Environmental pollution is serious."},{"korean":"기후 변화 문제가 매우 심각해요.","english":"The problem of climate change is very serious."}]', 1),
    (l_id, 'V-도록 노력하다', 'V stem + 도록 노력하다', 'Expresses making an effort toward a goal: "try to make sure V happens."', '[{"korean":"재활용하도록 노력해야 해요.","english":"We must make an effort to recycle."},{"korean":"에너지를 절약하도록 노력합니다.","english":"I make an effort to conserve energy."}]', 2),
    (l_id, 'V/A-(으)ㄹ수록 좋다', 'V/A stem + (으)ㄹ수록 좋다', 'Expresses "the more, the better."', '[{"korean":"친환경 제품을 쓸수록 좋아요.","english":"The more eco-friendly products you use, the better."},{"korean":"쓰레기를 줄일수록 좋아요.","english":"The more you reduce waste, the better."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '이현', '요즘 환경 문제가 정말 심각하죠?', 'Yojeum hwangyeong munje-ga jeongmal simgakajyo?', 'Environmental problems are really serious these days, right?', 1),
    (l_id, '수민', '맞아요. 특히 기후 변화가 전 세계적인 문제예요.', 'Majayo. Teukhi gihu byeonhwa-ga jeon segyejeok-in munje-yeyo.', 'That''s right. Especially climate change is a global problem.', 2),
    (l_id, '이현', '개인이 할 수 있는 일은 뭐가 있을까요?', 'Gaein-i hal su inneun il-eun mwoga isseulkkayo?', 'What can individuals do?', 3),
    (l_id, '수민', '분리수거를 잘 하고 재활용품을 사용하는 게 도움이 돼요. 그리고 에너지 절약도 중요해요.', 'Bullisugeo-reul jal hago jaehwalyongpum-eul sayong-haneun ge doumi dwaeyo. Geurigo eneoji jeoryak-do jungyohaeyo.', 'Doing proper waste separation and using recycled products helps. And energy conservation is also important.', 4),
    (l_id, '이현', '한국은 분리수거를 잘 하는 나라로 알려져 있죠?', 'Hanguk-eun bullisugeo-reul jal haneun nara-ro allyeojeo itjyo?', 'Korea is known as a country that does waste separation well, right?', 5),
    (l_id, '수민', '네, 한국의 재활용률은 세계적으로 높아요. 친환경 제품을 쓸수록 환경에 좋아요.', 'Ne, Hanguk-ui jaehwalyongnyul-eun segyejeog-euro nopayo. Chinhwangyeong jepum-eul sseulsutok hwangyeong-e joayo.', 'Yes, Korea''s recycling rate is high globally. The more eco-friendly products you use, the better it is for the environment.', 6),
    (l_id, '이현', '우리 모두 환경을 보호하도록 노력해야 할 것 같아요.', 'Uri modu hwangyeong-eul bohohadorok noryeok-haeya hal geot gatayo.', 'I think we all need to make an effort to protect the environment.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '환경 오염이 ___. (serious)', '["많아요","심각해요","좋아요","깨끗해요"]', 1, 'N이/가 심각하다 = N is serious.', 1),
    (l_id, '에너지를 절약하___ 노력해야 해요.', '["기로","도록","려고","아서"]', 1, 'V-도록 노력하다 = make an effort to ensure V.', 2),
    (l_id, '친환경 제품을 쓸___ 좋아요.', '["때","수록","때문에","지만"]', 1, 'V-(으)ㄹ수록 좋다 = the more you do it, the better.', 3),
    (l_id, '''재활용''의 의미는?', '["pollution","nature","recycling","conservation"]', 2, '재활용 means recycling.', 4),
    (l_id, '환경 보호를 위해 할 수 있는 행동이 아닌 것은?', '["분리수거","재활용","에너지 절약","쓰레기 무단 투기"]', 3, 'Illegal dumping of garbage (쓰레기 무단 투기) harms the environment.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '지구 온난화와 기후 변화는 우리 시대의 가장 큰 환경 문제입니다. 한국도 이 문제에서 자유롭지 않습니다. 미세먼지, 수질 오염, 해양 쓰레기 등 다양한 환경 문제가 있습니다. 한국 정부는 2050년까지 탄소중립을 달성하겠다고 선언했습니다. 개인도 분리수거, 재활용, 에너지 절약 등을 통해 환경 보호에 기여할 수 있습니다. 작은 실천들이 모여 큰 변화를 만들 수 있습니다.', 'Global warming and climate change are the biggest environmental problems of our time. Korea is not free from these problems either. There are various environmental issues such as fine dust, water pollution, and marine garbage. The Korean government has declared that it will achieve carbon neutrality by 2050. Individuals can also contribute to environmental protection through waste separation, recycling, and energy conservation. Small practices gathered together can create big changes.', 1);
END $$;

-- ============================================================
-- Lesson 79: Technology (기술)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 79;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=79 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '기술', 'gisul', 'technology, skill', 1),
    (l_id, '인공지능', 'in-gongjineung', 'artificial intelligence, AI', 2),
    (l_id, '로봇', 'robot', 'robot', 3),
    (l_id, '반도체', 'bandoche', 'semiconductor', 4),
    (l_id, '스마트폰', 'seumateupon', 'smartphone', 5),
    (l_id, '앱', 'aep', 'app, application', 6),
    (l_id, '개발하다', 'gaebal-hada', 'to develop', 7),
    (l_id, '혁신', 'hyeoksin', 'innovation', 8),
    (l_id, '디지털', 'dijiteol', 'digital', 9),
    (l_id, '자동화', 'jadong-hwa', 'automation', 10),
    (l_id, '빠르다', 'ppareuda', 'to be fast', 11),
    (l_id, '편리하다', 'pyeollihada', 'to be convenient', 12),
    (l_id, '발전하다', 'baljeonhada', 'to advance, develop', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N덕분에', 'N + 덕분에', 'Expresses that something positive happened thanks to N: "thanks to N."', '[{"korean":"기술 덕분에 생활이 편리해졌어요.","english":"Thanks to technology, life has become convenient."},{"korean":"스마트폰 덕분에 언제 어디서나 정보를 얻을 수 있어요.","english":"Thanks to smartphones, you can get information anywhere, anytime."}]', 1),
    (l_id, 'V-아/어 가다 (진행)', 'V stem + 아/어 가다', 'Expresses an ongoing process, often of change: "is in the process of becoming."', '[{"korean":"기술이 빠르게 발전해 가고 있어요.","english":"Technology is advancing rapidly."},{"korean":"디지털 사회로 변해 가고 있어요.","english":"Society is changing into a digital one."}]', 2),
    (l_id, 'N으로 인해 V/A', 'N + 으로 인해 + V/A', 'Formal expression of causation: "due to N, V/A." Used in news and formal writing.', '[{"korean":"기술 발전으로 인해 많은 직업이 사라질 수 있어요.","english":"Due to technological advancement, many jobs may disappear."},{"korean":"자동화로 인해 생산성이 높아졌어요.","english":"Productivity has increased due to automation."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '정우', '한국은 IT 강국으로 유명하죠?', 'Hanguk-eun IT gangguek-euro yumyeonghajyo?', 'Korea is famous as an IT powerhouse, right?', 1),
    (l_id, '나래', '맞아요. 삼성, LG 같은 기업들이 세계적으로 유명하죠. 특히 반도체 분야에서 강해요.', 'Majayo. Samseong, LG gateun gieobeul-i segyejeog-euro yumyeonghajyo. Teukhi bandoche bunyaeseo gangaeyo.', 'That''s right. Companies like Samsung and LG are globally famous. Especially strong in the semiconductor sector.', 2),
    (l_id, '정우', '인공지능 기술도 발전하고 있죠?', 'In-gongjineung gisul-do baljeonago itjyo?', 'AI technology is also advancing, right?', 3),
    (l_id, '나래', '네, 기술 덕분에 우리 생활이 많이 편리해졌어요. 스마트폰 하나로 거의 다 할 수 있잖아요.', 'Ne, gisul deokbune uri saenghwal-i manhi pyeollihajyeosseoyo. Seumateupon hana-ro geouida hal su itjanayo.', 'Yes, thanks to technology, our lives have become very convenient. You can do almost everything with just a smartphone.', 4),
    (l_id, '정우', '하지만 기술 발전으로 인해 일자리가 줄어들 수도 있지 않나요?', 'Hajiman gisul baljeon-euro inhae iljari-ga jureodul sudo itji annayo?', 'But due to technological advancement, jobs could also decrease, couldn''t they?', 5),
    (l_id, '나래', '그렇죠. 자동화로 인해 일부 직업은 사라질 수 있어요. 하지만 동시에 새로운 직업도 생겨나요.', 'Geureotjyo. Jadong-hwa-ro inhae ilbu jikeobeun sarajil su isseoyo. Hajiman dongsi-e saeroun jikeoepdo saenggyeonayo.', 'That''s true. Some jobs may disappear due to automation. But at the same time, new jobs also emerge.', 6),
    (l_id, '정우', '기술 변화에 잘 적응하는 게 중요하겠네요.', 'Gisul byeonhwa-e jal jeogeuenganeun ge jungyohagenne-yo.', 'It must be important to adapt well to technological change.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '기술 ___ 생활이 편리해졌어요. (thanks to)', '["때문에","덕분에","으로 인해","에도 불구하고"]', 1, 'N 덕분에 = thanks to N (positive result).', 1),
    (l_id, '기술이 빠르게 발전해 ___ 있어요. (ongoing)', '["가고","오고","지고","가서"]', 0, 'V-아/어 가다 expresses an ongoing process.', 2),
    (l_id, '자동화___ 인해 생산성이 높아졌어요.', '["에","로","을","에게"]', 1, 'N으로 인해 = due to N (formal causation).', 3),
    (l_id, '''반도체''의 의미는?', '["robot","AI","smartphone","semiconductor"]', 3, '반도체 means semiconductor.', 4),
    (l_id, '한국의 대표적인 IT 기업 두 곳은?', '["삼성과 애플","삼성과 LG","현대와 LG","네이버와 구글"]', 1, 'Samsung and LG are Korea''s globally representative IT companies.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 세계 최고 수준의 IT 기술을 보유한 나라입니다. 삼성전자, LG, 현대 등 글로벌 기업들이 혁신적인 기술을 개발하고 있습니다. 특히 반도체, 스마트폰, 디스플레이 분야에서 세계를 선도하고 있습니다. 한국의 인터넷 속도는 세계에서 가장 빠른 수준으로 알려져 있습니다. 기술 발전 덕분에 한국인의 일상생활은 매우 편리해졌습니다. 하지만 기술 발전으로 인한 일자리 변화와 개인정보 보호 문제 같은 과제도 있습니다.', 'Korea is a country with world-class IT technology. Global companies like Samsung Electronics, LG, and Hyundai are developing innovative technologies. In particular, Korea leads the world in semiconductors, smartphones, and displays. Korea''s internet speed is known to be among the fastest in the world. Thanks to technological development, the daily lives of Koreans have become very convenient. However, there are also challenges such as job changes due to technological development and personal information protection issues.', 1);
END $$;


-- ============================================================
-- Lesson 80: Korean Pop Music (K-Pop)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 80;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=80 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '아이돌', 'aidol', 'idol (pop star)', 1),
    (l_id, '기획사', 'gihoeksa', 'entertainment agency', 2),
    (l_id, '연습생', 'yeonseuksaeng', 'trainee', 3),
    (l_id, '데뷔하다', 'debwihada', 'to debut', 4),
    (l_id, '팬덤', 'paendeom', 'fandom', 5),
    (l_id, '콘서트', 'konseoteu', 'concert', 6),
    (l_id, '앨범', 'aelbeum', 'album', 7),
    (l_id, '차트', 'chateu', 'chart', 8),
    (l_id, '안무', 'anmu', 'choreography', 9),
    (l_id, '한류', 'hallyu', 'Korean Wave', 10),
    (l_id, '음원', 'eumwon', 'digital music release', 11),
    (l_id, '뮤직비디오', 'myujik bidio', 'music video', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N으로 구성되다', 'N + 으로 구성되다', 'Means "to be composed of N" or "to consist of N."', '[{"korean":"이 그룹은 7명으로 구성되어 있어요.","english":"This group consists of 7 members."},{"korean":"K-pop 그룹은 댄서, 보컬, 래퍼로 구성돼요.","english":"K-pop groups are composed of dancers, vocalists, and rappers."}]', 1),
    (l_id, 'N이/가 세계적으로 유명하다', 'N + 이/가 세계적으로 유명하다', 'Expresses worldwide fame.', '[{"korean":"BTS는 세계적으로 유명한 K-pop 그룹이에요.","english":"BTS is a globally famous K-pop group."},{"korean":"K-pop은 세계적으로 인기가 있어요.","english":"K-pop is popular worldwide."}]', 2),
    (l_id, 'V-기 위해 V', 'V stem + 기 위해(서) + V', 'Expresses purpose: "in order to V (first verb), V (second verb)."', '[{"korean":"데뷔하기 위해 몇 년씩 연습해요.","english":"They practice for years in order to debut."},{"korean":"팬들을 만나기 위해 콘서트를 열어요.","english":"They hold concerts in order to meet fans."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '리나', 'K-pop 좋아해요?', 'K-pop joahaeyo?', 'Do you like K-pop?', 1),
    (l_id, '준서', '네, 정말 좋아해요! 특히 BTS 팬이에요.', 'Ne, jeongmal joahaeyo! Teukhi BTS paen-ieyo.', 'Yes, I really like it! I''m especially a BTS fan.', 2),
    (l_id, '리나', 'BTS가 왜 이렇게 세계적으로 유명해진 것 같아요?', 'BTS-ga wae ireoke segyejeog-euro yumyeonghajin geot gatayo?', 'Why do you think BTS became so globally famous?', 3),
    (l_id, '준서', '여러 이유가 있겠지만, 음악의 완성도와 진정성 있는 가사, 그리고 강력한 팬덤 덕분인 것 같아요.', 'Yeoreo iyu-ga itgetjiman, eumaik-ui wanseongt-wa jinjeongseong inneun gasa, geurigo gangnyeokhan paendeom deokbunin geot gatayo.', 'There must be various reasons, but I think it''s thanks to the quality of their music, sincere lyrics, and their strong fandom.', 4),
    (l_id, '리나', '맞아요. K-pop 아이돌들은 데뷔하기 위해 몇 년씩 연습하죠.', 'Majayo. K-pop aidoldeul-eun debwihagi wihaes myeot nyeon-ssik yeonseuk-ajyo.', 'That''s right. K-pop idols practice for years in order to debut.', 5),
    (l_id, '준서', '맞아요. 그 노력이 무대에서 빛을 발하는 것 같아요. 안무도 정말 대단하고요.', 'Majayo. Geu noryeok-i mudae-eseo bich-eul balaneun geot gatayo. Anmu-do jeongmal daedanago-yo.', 'Right. That effort seems to shine on stage. The choreography is also really impressive.', 6),
    (l_id, '리나', '저도 K-pop을 통해 한국어에 관심을 갖게 됐어요!', 'Jeodo K-pop-eul tonghae Hangugeo-e gansim-eul gatge dwaesseoyo!', 'I also came to be interested in Korean through K-pop!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, 'BTS는 7명___ 구성되어 있어요.', '["에","이","으로","에서"]', 2, 'N으로 구성되다 = to be composed of N.', 1),
    (l_id, '데뷔하___ 위해 몇 년 동안 연습해요.', '["기","는","고","면"]', 0, 'V-기 위해 expresses purpose.', 2),
    (l_id, '''팬덤''의 의미는?', '["trainee","debut","fandom","choreography"]', 2, '팬덤 means fandom — a dedicated fan community.', 3),
    (l_id, 'K-pop에서 ''안무''는 무엇입니까?', '["album","chart","choreography","music video"]', 2, '안무 means choreography (dance performance).', 4),
    (l_id, '''한류''의 의미는?', '["K-pop music","Korean cuisine","Korean Wave (cultural spread)","Korean language"]', 2, '한류 refers to the Korean Wave — the spread of Korean culture globally.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, 'K-pop은 한국 대중음악을 가리키는 말로, 전 세계적으로 큰 인기를 끌고 있습니다. BTS, 블랙핑크, 엑소 등의 그룹이 세계 차트를 석권했습니다. K-pop 아이돌들은 기획사에서 연습생으로 몇 년간 훈련한 후 데뷔합니다. 노래, 춤, 연기 등 다양한 분야를 훈련받습니다. 강력한 팬덤은 K-pop의 가장 큰 특징 중 하나입니다. 팬들은 SNS를 통해 전 세계에서 연결되어 있으며 서로 소통합니다. K-pop의 성공은 한국어와 한국 문화에 대한 관심도 높이는 역할을 했습니다.', 'K-pop is a term referring to Korean popular music, and it has been gaining great popularity worldwide. Groups like BTS, BLACKPINK, and EXO have topped world charts. K-pop idols train for several years as trainees at agencies before debuting. They are trained in various fields including singing, dancing, and acting. A strong fandom is one of the biggest characteristics of K-pop. Fans are connected worldwide through SNS and communicate with each other. The success of K-pop has also played a role in increasing interest in the Korean language and culture.', 1);
END $$;

-- ============================================================
-- Lesson 81: Korean Cinema (한국 영화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 81;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=81 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '영화', 'yeonghwa', 'movie, film', 1),
    (l_id, '감독', 'gamdok', 'director', 2),
    (l_id, '배우', 'baeu', 'actor, actress', 3),
    (l_id, '개봉하다', 'gaebonghada', 'to release (a film)', 4),
    (l_id, '수상하다', 'susanghada', 'to receive an award', 5),
    (l_id, '흥행하다', 'heunghaenghada', 'to be a box office hit', 6),
    (l_id, '줄거리', 'julguri', 'plot, storyline', 7),
    (l_id, '장르', 'jangneu', 'genre', 8),
    (l_id, '자막', 'jamak', 'subtitle', 9),
    (l_id, '명작', 'myeongjak', 'masterpiece', 10),
    (l_id, '봉준호', 'Bong Juno', 'Bong Joon-ho (director)', 11),
    (l_id, '오스카', 'oseuka', 'Oscar (award)', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N으로 알려지다', 'N + 으로 알려지다', 'Means "to be known as/for N." Used for reputation or identity.', '[{"korean":"봉준호 감독은 ''기생충''으로 알려져 있어요.","english":"Director Bong Joon-ho is known for ''Parasite''."},{"korean":"한국 영화는 독특한 스토리로 알려져 있어요.","english":"Korean cinema is known for its unique stories."}]', 1),
    (l_id, 'V-아/어서 감동적이다', 'V/A + 아/어서 감동적이다', 'Expresses that something is moving or touching because of a reason.', '[{"korean":"줄거리가 현실적이어서 감동적이에요.","english":"It''s moving because the storyline is realistic."},{"korean":"배우의 연기가 훌륭해서 감동적이에요.","english":"It''s touching because of the actor''s excellent performance."}]', 2),
    (l_id, 'V/A-(으)ㄴ 것으로 유명하다', 'V/A stem + (으)ㄴ 것으로 유명하다', 'Expresses being famous for a particular quality or achievement.', '[{"korean":"한국 영화는 사회 비판적인 것으로 유명해요.","english":"Korean films are famous for their social criticism."},{"korean":"기생충은 오스카를 수상한 것으로 유명해요.","english":"Parasite is famous for winning an Oscar."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '아미나', '한국 영화 중에서 뭐가 제일 좋았어요?', 'Hanguk yeonghwa jung-eseo mwoga jeil joasseoyo?', 'Which Korean movie did you like the most?', 1),
    (l_id, '재호', '저는 ''기생충''이 제일 인상적이었어요. 오스카 작품상을 받은 영화잖아요.', 'Jeoneun ''Gisaengchung''-i jeil insangjeogieosseoyo. Oseuka jakpumsang-eul badeun yeonghwajanayo.', 'I found ''Parasite'' the most impressive. It''s the film that won the Oscar for Best Picture.', 2),
    (l_id, '아미나', '봉준호 감독이 연출했죠? 줄거리가 어떻게 돼요?', 'Bong Junho gamdok-i yeoncul-haessjoyo? Julguri-ga eotteoke dwaeyo?', 'Director Bong Joon-ho directed it, right? What''s the storyline?', 3),
    (l_id, '재호', '빈부 격차를 다룬 사회 비판 영화예요. 한국 사회의 현실을 반영해서 더 감동적이에요.', 'Binbu gyeokcha-reul dareun sahoe bipan yeonghwa-yeyo. Hanguk sahoe-ui hyeonsil-eul ban-yeong-haeseo deo gamdongjeogieyo.', 'It''s a social commentary film dealing with the wealth gap. It''s even more moving because it reflects Korean social reality.', 4),
    (l_id, '아미나', '오스카 외국어 영화상을 처음 받은 한국 영화죠?', 'Oseuka oegug-eo yeonghwasang-eul cheoeum badeun Hanguk yeonghwajyo?', 'It''s the first Korean film to win the Oscar for Best International Film, right?', 5),
    (l_id, '재호', '맞아요. 그리고 작품상, 감독상 등 4개 부문에서 수상했어요. 그 역사적인 순간을 TV로 봤는데 정말 감격스러웠어요.', 'Majayo. Geurigo jakpumsang, gamdoksang deung 4-gae bumun-eseo susang-haesseoyo. Geu yeoksajeok-in sungan-eul TV-ro bwanneunde jeongmal gamgyeokseureowosseoyo.', 'That''s right. And it won in 4 categories including Best Picture and Best Director. I watched that historic moment on TV and it was really moving.', 6),
    (l_id, '아미나', '저도 꼭 봐야겠어요!', 'Jeodo kkok bwayagesseoyo!', 'I must watch it too!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '봉준호 감독은 ''기생충''___ 알려져 있어요.', '["이","으로","에서","에게"]', 1, 'N으로 알려지다 = to be known for/as N.', 1),
    (l_id, '한국 영화는 사회 비판적인 것___ 유명해요.', '["에","으로","이","에서"]', 1, 'N으로 유명하다 = famous for N.', 2),
    (l_id, '''기생충''은 몇 개의 오스카 부문에서 수상했습니까?', '["2개","3개","4개","5개"]', 2, 'Parasite won 4 Oscar categories.', 3),
    (l_id, '''줄거리''의 의미는?', '["director","award","plot/storyline","genre"]', 2, '줄거리 means the plot or storyline.', 4),
    (l_id, '영화의 언어를 모를 때 보는 것은?', '["자막","안무","앨범","차트"]', 0, '자막 means subtitles.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 영화는 세계 영화계에서 독보적인 위치를 차지하고 있습니다. 2020년 봉준호 감독의 ''기생충''이 아카데미 시상식에서 작품상 포함 4개 부문을 수상하면서 한국 영화의 우수성이 전 세계에 알려졌습니다. 한국 영화는 사회 비판적인 내용, 독특한 스토리텔링, 뛰어난 배우들의 연기로 유명합니다. 부산국제영화제는 아시아 최고의 영화제 중 하나로 자리 잡았습니다. 한국 드라마와 영화의 성공은 한류를 더욱 강화하는 역할을 하고 있습니다.', 'Korean cinema occupies a distinctive position in the world film industry. When director Bong Joon-ho''s ''Parasite'' won 4 categories including Best Picture at the 2020 Academy Awards, the excellence of Korean film became known worldwide. Korean films are famous for their socially critical content, unique storytelling, and outstanding acting. The Busan International Film Festival has established itself as one of Asia''s top film festivals. The success of Korean dramas and films is playing a role in further strengthening the Korean Wave.', 1);
END $$;


-- ============================================================
-- Lesson 82: Korean Traditional Culture (한국 전통 문화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 82;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=82 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '전통', 'jeongtong', 'tradition', 1),
    (l_id, '한복', 'hanbok', 'traditional Korean clothing', 2),
    (l_id, '한옥', 'hanok', 'traditional Korean house', 3),
    (l_id, '태권도', 'taekwondo', 'taekwondo', 4),
    (l_id, '판소리', 'pansori', 'traditional Korean vocal art', 5),
    (l_id, '도자기', 'dojagi', 'ceramic, pottery', 6),
    (l_id, '민화', 'minhwa', 'folk painting', 7),
    (l_id, '풍류', 'pungnyu', 'traditional Korean aesthetic/music', 8),
    (l_id, '무형유산', 'muhyeong yusan', 'intangible cultural heritage', 9),
    (l_id, '유네스코', 'UNESCO', 'UNESCO', 10),
    (l_id, '보존하다', 'bojonhada', 'to preserve', 11),
    (l_id, '계승하다', 'gyeseunghada', 'to inherit, to pass down', 12),
    (l_id, '장인', 'jangin', 'craftsman, artisan', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N을/를 N으로 여기다', 'N1 + 을/를 + N2 + 으로 여기다', 'Means "to regard/consider N1 as N2."', '[{"korean":"한복을 우리의 소중한 문화유산으로 여겨요.","english":"We regard hanbok as our precious cultural heritage."},{"korean":"태권도를 한국의 상징으로 여겨요.","english":"We consider taekwondo a symbol of Korea."}]', 1),
    (l_id, 'V/A-(으)ㄹ 필요가 있다', 'V/A stem + (으)ㄹ 필요가 있다/없다', 'Expresses the necessity or lack of necessity to do something.', '[{"korean":"전통 문화를 보존할 필요가 있어요.","english":"There is a need to preserve traditional culture."},{"korean":"전통을 계승할 필요가 있어요.","english":"There is a need to inherit traditions."}]', 2),
    (l_id, 'N이/가 세대를 거쳐 전해지다', 'N + 이/가 + 세대를 거쳐 전해지다', 'Means "N has been passed down through generations."', '[{"korean":"판소리는 세대를 거쳐 전해져 왔어요.","english":"Pansori has been passed down through generations."},{"korean":"도자기 기술은 장인들로부터 전해집니다.","english":"Ceramic techniques are passed down from artisans."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '에바', '한국 전통 문화 중에서 가장 인상적인 것이 뭐예요?', 'Hanguk jeongtong munhwa jung-eseo gajang insangjeok-in geosi mwoyeyo?', 'What is the most impressive thing in Korean traditional culture?', 1),
    (l_id, '성준', '저는 한복이 가장 아름답다고 생각해요. 색깔도 예쁘고 디자인도 우아해요.', 'Jeoneun hanbok-i gajang areumdabdago saenggakaeyo. Saekgal-do yeppeugo dijaein-do ugahaeyo.', 'I think hanbok is the most beautiful. The colors are pretty and the design is elegant.', 2),
    (l_id, '에바', '한복은 어떤 때 입어요?', 'Hanbok-eun eotteon ttae ib-eoyo?', 'When do people wear hanbok?', 3),
    (l_id, '성준', '설날, 추석 같은 명절이나 결혼식 때 주로 입어요. 요즘은 일상에서도 한복을 입는 사람들이 늘고 있어요.', 'Seollal, Chuseok gateun myeongjeri-na gyeolhon-sik ttae juro ib-eoyo. Yojeum-eun ilsang-eseo-do hanbok-eul ibnneun saram-deul-i neulgo isseoyo.', 'Mostly on holidays like Seollal and Chuseok, or at weddings. These days, people wearing hanbok in everyday life are increasing.', 4),
    (l_id, '에바', '한국 전통 문화를 보존할 필요가 있다고 생각해요?', 'Hanguk jeongtong munhwa-reul bojonhal piryoga itdago saenggakaeyo?', 'Do you think there is a need to preserve Korean traditional culture?', 5),
    (l_id, '성준', '당연하죠. 전통 문화는 우리의 정체성을 담고 있으니까요. 그래서 한복, 판소리, 도자기 같은 전통을 계승할 필요가 있어요.', 'Dangyeonahajyo. Jeongtong munhwa-neun uri-ui jeongchesong-eul damgo isseunikayo. Geuraeseeo hanbok, pansori, dojagi gateun jeongtong-eul gyeseunghal piryoga isseoyo.', 'Of course. Traditional culture carries our identity. That''s why there is a need to inherit traditions like hanbok, pansori, and ceramics.', 6),
    (l_id, '에바', '유네스코 인류무형유산으로 지정된 한국 문화도 있죠?', 'UNESCO inryu muhyeong yusan-euro jijeongdoen Hanguk munhwa-do itjyo?', 'There are Korean cultures designated as UNESCO Intangible Cultural Heritage, right?', 7),
    (l_id, '성준', '네, 판소리, 강강술래, 탈춤 등 여러 가지가 있어요.', 'Ne, pansori, gang-gang-sullae, talchum deung yeoreo gaji-ga isseoyo.', 'Yes, there are various ones including pansori, ganggangsullae (circle dance), and mask dance.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '전통 문화를 보존할 ___ 있어요. (necessity)', '["필요가","수가","적이","기로"]', 0, 'V-(으)ㄹ 필요가 있다 = there is a need to do.', 1),
    (l_id, '한복을 우리의 문화유산___ 여겨요.', '["이","으로","에서","에게"]', 1, 'N을 N으로 여기다 = to regard N as N.', 2),
    (l_id, '판소리는 세대를 거쳐 전해져 ___. (has been passed down)', '["왔어요","갔어요","왔겠어요","갈 거예요"]', 0, '전해져 왔어요 = has been passed down (continuing into present).', 3),
    (l_id, '''한옥''의 의미는?', '["traditional clothing","traditional music","traditional Korean house","folk painting"]', 2, '한옥 means traditional Korean house.', 4),
    (l_id, '유네스코 무형유산으로 등재된 한국 문화가 아닌 것은?', '["판소리","강강술래","탈춤","태권도 세계선수권대회"]', 3, 'The Taekwondo World Championship is not a UNESCO Intangible Heritage. Pansori, ganggangsullae, and talchum are.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 수천 년의 역사를 통해 독특한 전통 문화를 발전시켜 왔습니다. 한복, 한옥, 한식, 한국 음악, 전통 공예 등이 대표적인 전통 문화입니다. 유네스코는 판소리, 강강술래, 한국의 씨름 등을 인류무형문화유산으로 지정했습니다. 이러한 전통들은 세대를 거쳐 장인들과 예술가들에 의해 전해져 왔습니다. 전통 문화의 보존과 현대적 재해석 사이의 균형을 찾는 것이 중요한 과제입니다. 젊은 세대들이 전통 문화에 대한 관심을 갖고 이를 계승하는 것이 중요합니다.', 'Korea has developed a unique traditional culture through thousands of years of history. Hanbok, hanok, Korean food, Korean music, and traditional crafts are representative traditional cultures. UNESCO has designated pansori, ganggangsullae, and Korean ssireum (wrestling) as Intangible Cultural Heritage of Humanity. These traditions have been passed down through generations by artisans and artists. Finding the balance between preserving traditional culture and modern reinterpretation is an important challenge. It is important for the younger generation to take an interest in traditional culture and carry it forward.', 1);
END $$;


-- ============================================================
-- Lesson 83: Social Issues (사회 문제)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 83;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=83 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '사회', 'sahoe', 'society', 1),
    (l_id, '불평등', 'bulpyeongdeung', 'inequality', 2),
    (l_id, '빈부격차', 'binbu gyeokcha', 'wealth gap', 3),
    (l_id, '저출산', 'jeochulsan', 'low birth rate', 4),
    (l_id, '고령화', 'goryeonghwa', 'aging (of population)', 5),
    (l_id, '청년실업', 'cheongnyeon sireop', 'youth unemployment', 6),
    (l_id, '주거비', 'jugeobi', 'housing cost', 7),
    (l_id, '복지', 'bokji', 'welfare', 8),
    (l_id, '해결책', 'haegyeolchaek', 'solution', 9),
    (l_id, '갈등', 'galdeung', 'conflict', 10),
    (l_id, '다문화', 'damunhwa', 'multicultural', 11),
    (l_id, '차별', 'chabyeol', 'discrimination', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N이/가 문제이다', 'N + 이/가 문제예요/문제입니다', 'States that N is a problem or issue.', '[{"korean":"저출산이 한국의 심각한 사회 문제예요.","english":"Low birth rate is a serious social problem in Korea."},{"korean":"청년 실업이 가장 큰 문제예요.","english":"Youth unemployment is the biggest problem."}]', 1),
    (l_id, 'N에 대한 해결책', 'N + 에 대한 + 해결책', 'Refers to a solution for/regarding N.', '[{"korean":"저출산에 대한 해결책을 찾아야 해요.","english":"We need to find solutions for the low birth rate."},{"korean":"불평등에 대한 다양한 해결책이 있어요.","english":"There are various solutions for inequality."}]', 2),
    (l_id, 'V-아/어야 사회가 발전한다', 'V stem + 아/어야 사회가 발전한다', 'Expresses that certain conditions must be met for society to progress.', '[{"korean":"차별을 없애야 사회가 발전할 수 있어요.","english":"Society can develop only when discrimination is eliminated."},{"korean":"복지를 강화해야 사회가 안정돼요.","english":"Society stabilizes when welfare is strengthened."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '강사', '한국의 가장 큰 사회 문제가 무엇이라고 생각해요?', 'Hanguk-ui gajang keun sahoe munje-ga mueosirago saenggakaeyo?', 'What do you think is Korea''s biggest social problem?', 1),
    (l_id, '학생', '저는 저출산과 고령화가 가장 심각하다고 생각해요.', 'Jeoneun jeochulsan-gwa goryeonghwa-ga gajang simgakadago saenggakaeyo.', 'I think low birth rate and population aging are the most serious.', 2),
    (l_id, '강사', '왜 그렇게 생각해요?', 'Wae geureokeyo saenggakaeyo?', 'Why do you think that?', 3),
    (l_id, '학생', '출산율이 낮으면 노동인구가 줄고, 그러면 경제 성장이 어렵기 때문이에요.', 'Chulsanyul-i najeumyeon nodong-in-gu-ga julgo, geureomyeon gyeongje seongjang-i eoryeobgi ttaemuni-eyo.', 'Because if the birth rate is low, the working population decreases, and then economic growth becomes difficult.', 4),
    (l_id, '강사', '그렇군요. 해결책으로는 무엇이 있을까요?', 'Geureokgunyo. Haegyeolchaek-euro-neun mueosi isseulkkayo?', 'I see. What solutions might there be?', 5),
    (l_id, '학생', '육아 지원을 늘리고 여성이 직장과 육아를 병행할 수 있도록 지원하는 게 중요하다고 생각해요.', 'Yuga jiwon-eul neulligo yeoseong-i jikjang-gwa yuga-reul byeonghanghal su itdorok jiwon-haneun ge jungyohago saenggakaeyo.', 'I think it''s important to increase childcare support and support women to balance work and childcare.', 6),
    (l_id, '강사', '좋은 의견이에요. 복지 정책과 사회적 인식 변화도 필요하겠죠.', 'Joeun uigyeon-ieyo. Bokji jeongchaek-gwa sahoejeok insgik byeonhwa-do piryohagessjoyo.', 'That''s a good opinion. Welfare policies and changes in social awareness would also be needed.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '저출산이 한국의 심각한 사회 ___예요.', '["문제","해결책","복지","갈등"]', 0, '문제 = problem. 사회 문제 = social problem.', 1),
    (l_id, '불평등___ 대한 해결책이 필요해요.', '["이","에","을","의"]', 1, 'N에 대한 = regarding N, pertaining to N.', 2),
    (l_id, '차별을 없애___ 사회가 발전할 수 있어요.', '["서","야","면","지만"]', 1, '-아야/어야 사회가 발전하다 = society can develop only if...', 3),
    (l_id, '''빈부격차''의 의미는?', '["youth unemployment","housing cost","wealth gap","aging population"]', 2, '빈부격차 means the wealth gap (disparity between rich and poor).', 4),
    (l_id, '한국의 저출산 문제에 대한 해결책으로 맞지 않는 것은?', '["육아 지원 강화","여성 경력 단절 방지","출산 장려금 지원","청년 실업 증가"]', 3, 'Increasing youth unemployment would worsen, not solve, the low birth rate problem.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 빠른 경제 성장과 함께 여러 사회 문제에 직면하고 있습니다. 저출산과 고령화는 인구 구조 변화를 가져오는 심각한 문제입니다. 현재 한국의 합계 출산율은 세계에서 가장 낮은 수준입니다. 청년 실업과 높은 주거비도 청년들이 결혼과 출산을 미루는 원인이 됩니다. 정부는 다양한 복지 정책과 지원책을 마련하고 있습니다. 이러한 복잡한 사회 문제들을 해결하기 위해서는 정부, 기업, 개인 모두의 노력이 필요합니다.', 'Korea is facing various social problems alongside rapid economic growth. Low birth rates and population aging are serious issues causing structural demographic changes. Korea''s total fertility rate is currently one of the lowest in the world. Youth unemployment and high housing costs also cause young people to delay marriage and childbirth. The government is preparing various welfare policies and support measures. To solve these complex social problems, the efforts of the government, businesses, and individuals are all needed.', 1);
END $$;

-- ============================================================
-- Lesson 84: Korean Education System (교육 제도)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 84;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=84 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '교육', 'gyoyuk', 'education', 1),
    (l_id, '초등학교', 'chodeung-hakgyo', 'elementary school', 2),
    (l_id, '중학교', 'junghakgyo', 'middle school', 3),
    (l_id, '고등학교', 'godeung-hakgyo', 'high school', 4),
    (l_id, '대학교', 'daehakgyo', 'university', 5),
    (l_id, '수능', 'suneung', 'CSAT (college entrance exam)', 6),
    (l_id, '학원', 'hagwon', 'private academy', 7),
    (l_id, '과외', 'gwaoe', 'private tutoring', 8),
    (l_id, '입시', 'ipsi', 'college entrance exam process', 9),
    (l_id, '성적', 'seongjeok', 'grade, academic record', 10),
    (l_id, '교과서', 'gyogwaseo', 'textbook', 11),
    (l_id, '경쟁', 'gyeongjaaeng', 'competition', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N이/가 치열하다', 'N + 이/가 치열하다', 'Expresses that competition or struggle is fierce/intense.', '[{"korean":"한국의 대학 입시 경쟁이 치열해요.","english":"University entrance competition in Korea is fierce."},{"korean":"취업 경쟁이 갈수록 치열해지고 있어요.","english":"The job competition is getting fiercer."}]', 1),
    (l_id, 'V-기 위해(서) N이 중요하다', 'V-기 위해(서) + N + 이 중요하다', 'States what is important for achieving a goal.', '[{"korean":"좋은 대학에 가기 위해서 수능 준비가 중요해요.","english":"CSAT preparation is important to get into a good university."},{"korean":"취직하기 위해 스펙을 쌓는 것이 중요해요.","english":"Building a resume is important to get a job."}]', 2),
    (l_id, 'V-는 편이다', 'V-는 편이다 / A-(으)ㄴ 편이다', 'Expresses a tendency or inclination: "tends to" or "is on the [adjective] side."', '[{"korean":"한국 학생들은 공부를 많이 하는 편이에요.","english":"Korean students tend to study a lot."},{"korean":"한국 교육은 경쟁이 심한 편이에요.","english":"Korean education tends to be highly competitive."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '루나', '한국 교육 제도에 대해 어떻게 생각해요?', 'Hanguk gyoyuk jedo-e daehae eotteoke saenggakaeyo?', 'What do you think about the Korean education system?', 1),
    (l_id, '민재', '솔직히 경쟁이 너무 심한 편이에요. 학생들이 공부 스트레스를 많이 받아요.', 'Soljiki gyeongjaeng-i neomu sim-han pyeon-ieyo. Haksaengdeul-i gongbu seuteuresseu-reul manhi badayo.', 'Honestly, competition tends to be too fierce. Students receive a lot of study-related stress.', 2),
    (l_id, '루나', '수능이 그렇게 중요해요?', 'Suneung-i geureokeyo jungyohaeyo?', 'Is the CSAT that important?', 3),
    (l_id, '민재', '네, 한국에서는 어느 대학을 나왔느냐가 매우 중요해요. 그래서 좋은 대학에 가기 위해 학원도 많이 다니고 과외도 받아요.', 'Ne, Hanguk-eseo-neun eoneu daehag-eul nawatneunya-ga maeu jungyohaeyo. Geuraeseeo joeun daehag-e gagi wihae hagwon-do manhi danigo gwaoe-do badayo.', 'Yes, in Korea, which university you graduated from is very important. So to get into a good university, students attend many academies and receive private tutoring.', 4),
    (l_id, '루나', '다른 나라와 비교하면 어때요?', 'Dareun nara-wa bigyohamyeon eottaeyo?', 'Compared to other countries, how is it?', 5),
    (l_id, '민재', '아마 세계에서 교육열이 가장 높은 나라 중 하나일 거예요. 장점도 있지만 학생들이 쉬는 시간이 부족한 것이 문제예요.', 'Ama segye-eseo gyoyung-nyeol-i gajang nopneun nara jung hana-il geoyeyo. Jangjeomdo itjiman haksaengdeul-i swineun sigan-i bujokhan geosi munjeyeyo.', 'It''s probably one of the countries with the highest enthusiasm for education in the world. There are advantages, but the problem is that students lack time to rest.', 6),
    (l_id, '루나', '균형 잡힌 교육이 필요하겠네요.', 'Gyunhyeong japhin gyoyuk-i piryohagenne-yo.', 'A balanced education would be needed, I suppose.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한국의 대학 입시 경쟁이 ___. (fierce)', '["쉬워요","약해요","치열해요","없어요"]', 2, '치열하다 = fierce, intense.', 1),
    (l_id, '한국 학생들은 공부를 많이 하는 ___이에요.', '["것","편","수","줄"]', 1, 'V-는 편이다 = tends to.', 2),
    (l_id, '수능은 한국에서 무엇을 뜻합니까?', '["middle school exam","private tutoring","college entrance exam","academic record"]', 2, '수능 = 대학수학능력시험, the Korean College Scholastic Ability Test.', 3),
    (l_id, '''학원''의 의미는?', '["university","textbook","private academy","competition"]', 2, '학원 = hagwon, private after-school academy.', 4),
    (l_id, '한국 교육의 문제점으로 언급된 것은?', '["수능 시험이 없는 것","학생들의 휴식 시간 부족","교과서의 질이 낮은 것","선생님이 부족한 것"]', 1, 'Lack of rest time for students is a commonly cited problem with Korean education.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국의 교육 제도는 초등학교(6년), 중학교(3년), 고등학교(3년), 대학교(4년)로 구성됩니다. 고등학교 3학년 때 치르는 대학수학능력시험(수능)이 대학 입시의 핵심입니다. 한국 학생들은 방과 후에 학원에 다니거나 과외를 받으며 추가 공부를 하는 경우가 많습니다. 교육열이 매우 높아 한국의 대학 진학률은 세계에서 가장 높은 편입니다. 최근에는 과도한 입시 경쟁의 부작용을 줄이기 위한 교육 개혁 논의가 활발합니다.', 'Korea''s education system consists of elementary school (6 years), middle school (3 years), high school (3 years), and university (4 years). The College Scholastic Ability Test (suneung), taken in the 3rd year of high school, is the core of university entrance. Many Korean students attend hagwons (private academies) or receive private tutoring after school for additional study. With very high enthusiasm for education, Korea''s university enrollment rate is among the highest in the world. Recently, discussions about educational reform to reduce the side effects of excessive entrance exam competition are active.', 1);
END $$;


-- ============================================================
-- Lesson 85: Love and Relationships (사랑과 인간관계)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 85;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=85 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '사랑', 'sarang', 'love', 1),
    (l_id, '사귀다', 'sagwida', 'to date, to go out with', 2),
    (l_id, '고백하다', 'gobaekhada', 'to confess (feelings)', 3),
    (l_id, '헤어지다', 'heeojida', 'to break up', 4),
    (l_id, '결혼하다', 'gyeolhon-hada', 'to marry', 5),
    (l_id, '소개팅', 'sokaeting', 'blind date', 6),
    (l_id, '연애하다', 'yeonaehada', 'to date, to be in a relationship', 7),
    (l_id, '첫눈에 반하다', 'cheotnun-e banhada', 'to fall in love at first sight', 8),
    (l_id, '우정', 'ujeong', 'friendship', 9),
    (l_id, '신뢰', 'sinroe', 'trust', 10),
    (l_id, '배려하다', 'baeryeohada', 'to be considerate of', 11),
    (l_id, '소통', 'sotong', 'communication', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N을/를 좋아하게 되다', 'N + 을/를 + 좋아하게 되다', 'Expresses coming to like someone/something over time.', '[{"korean":"지내다 보니까 그 사람을 좋아하게 됐어요.","english":"As time passed, I came to like that person."},{"korean":"처음에는 몰랐는데 점점 좋아하게 됐어요.","english":"I didn''t know at first, but I gradually came to like them."}]', 1),
    (l_id, 'V-면서 사귀다', 'V-면서 사귀다', 'Expresses dating while doing something else (simultaneous).', '[{"korean":"같이 공부하면서 사귀게 됐어요.","english":"We came to date while studying together."},{"korean":"여행을 다니면서 더 가까워졌어요.","english":"We grew closer while traveling together."}]', 2),
    (l_id, 'N에서 중요한 것은 V-는 것이다', 'N + 에서 중요한 것은 + V-는 것이다', 'States what is important in a relationship or situation.', '[{"korean":"연애에서 중요한 것은 소통하는 것이에요.","english":"What is important in a relationship is communication."},{"korean":"우정에서 중요한 것은 신뢰예요.","english":"What is important in friendship is trust."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '지아', '남자친구랑 어떻게 사귀게 됐어요?', 'Namjachingu-rang eotteoke sagwige dwaesseoyo?', 'How did you come to date your boyfriend?', 1),
    (l_id, '유리', '같은 동아리에서 만났어요. 처음에는 그냥 친구였는데 같이 시간을 보내다 보니까 좋아하게 됐어요.', 'Gateun dong-ari-eseo mannasseoyo. Cheoeum-e-neun geunyang chinguyo-neunde gachi sigan-eul bonaeda bonikka joahage dwaesseoyo.', 'We met in the same club. At first we were just friends, but as we spent time together I came to like him.', 2),
    (l_id, '지아', '언제 고백했어요?', 'Eonje gobaekhaesseoyo?', 'When did you confess?', 3),
    (l_id, '유리', '3개월 후에요. 너무 두근거렸어요.', 'Sam-gaewol hueyo. Neomu dgeungeorieosseoyo.', 'After 3 months. I was so nervous.', 4),
    (l_id, '지아', '연애에서 가장 중요한 게 뭐라고 생각해요?', 'Yeonaee-seo gajang jungyohan ge mwolago saenggakaeyo?', 'What do you think is the most important thing in a relationship?', 5),
    (l_id, '유리', '소통이라고 생각해요. 서로의 생각을 솔직하게 표현하고 이해하는 게 중요해요.', 'Sotong-irago saenggakaeyo. Seoro-ui saenggak-eul soljikage pyohyeong-ago ihae-haneun ge jungyohaeyo.', 'I think it''s communication. Expressing your thoughts honestly and understanding each other is important.', 6),
    (l_id, '지아', '맞아요, 그리고 서로 배려하는 것도 중요하죠.', 'Majayo, geurigo seoro baeryeo-haneun geotdo jungyohajyo.', 'That''s right, and being considerate of each other is also important.', 7),
    (l_id, '유리', '맞아요. 신뢰와 배려가 있어야 좋은 관계가 유지되는 것 같아요.', 'Majayo. Sinroe-wa baeryeo-ga isseoyo joeun gwangye-ga yujidoeneun geot gatayo.', 'Right. I think trust and consideration are needed to maintain a good relationship.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '지내다 보니 그 사람을 좋아하___ 됐어요.', '["기로","게","서","지만"]', 1, '좋아하게 되다 = came to like (natural development).', 1),
    (l_id, '연애에서 중요한 것은 소통하는 ___이에요.', '["것","수","때","게"]', 0, 'V-는 것이다 completes the structure "what''s important is doing..."', 2),
    (l_id, '''고백하다''의 의미는?', '["to break up","to date","to confess feelings","to marry"]', 2, '고백하다 = to confess one''s feelings to someone.', 3),
    (l_id, '''소개팅''은 무엇입니까?', '["wedding","first love","blind date","club activity"]', 2, '소개팅 = a blind/set-up date arranged by a mutual acquaintance.', 4),
    (l_id, '좋은 관계를 유지하는 데 필요한 요소가 아닌 것은?', '["신뢰","소통","배려","질투"]', 3, '질투 (jealousy) is not a positive element for maintaining a good relationship.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '인간관계는 우리 삶에서 매우 중요한 부분입니다. 한국에서는 연애와 결혼에 대한 사회적 기대가 있습니다. 소개팅은 제3자를 통해 이루어지는 만남으로 한국에서 흔한 연애 방식입니다. 좋은 연애 관계를 위해서는 솔직한 소통, 신뢰, 그리고 상대방에 대한 배려가 필요합니다. 우정도 인간관계에서 중요한 역할을 합니다. 진정한 친구는 어려울 때 도와주고 기쁠 때 함께 기뻐해주는 사람입니다. 건강한 인간관계는 정신 건강에도 긍정적인 영향을 미칩니다.', 'Human relationships are a very important part of our lives. In Korea, there are social expectations around dating and marriage. Sokaeting (blind dates) are a common dating method in Korea, arranged through a third party. For a good romantic relationship, honest communication, trust, and consideration for the other person are needed. Friendship also plays an important role in human relationships. A true friend is someone who helps you when things are difficult and rejoices with you when things are good. Healthy human relationships have a positive impact on mental health as well.', 1);
END $$;


-- ============================================================
-- Lesson 86: Korean New Year (설날)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 86;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=86 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '설날', 'Seollal', 'Korean Lunar New Year', 1),
    (l_id, '세배', 'sebae', 'New Year bow (to elders)', 2),
    (l_id, '세뱃돈', 'sebaetdon', 'New Year money gift', 3),
    (l_id, '떡국', 'tteokguk', 'rice cake soup', 4),
    (l_id, '차례', 'charye', 'ancestral rites', 5),
    (l_id, '민속놀이', 'minso-ngnolli', 'traditional folk games', 6),
    (l_id, '윷놀이', 'yunnori', 'yut (traditional board game)', 7),
    (l_id, '명절', 'myeongjeol', 'national/traditional holiday', 8),
    (l_id, '귀성', 'guiseong', 'returning to hometown', 9),
    (l_id, '덕담', 'deokdam', 'New Year greetings/wishes', 10),
    (l_id, '한 살 더 먹다', 'han sal deo meokda', 'to become one year older', 11),
    (l_id, '새해 복 많이 받으세요', 'saehae bok manhi badeuseyo', 'Happy New Year', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-(으)ㄴ/는 것이 특징이다', 'V/A + (으)ㄴ/는 것이 특징이다', 'Expresses a characteristic feature of something.', '[{"korean":"설날에는 어른께 세배를 드리는 것이 특징이에요.","english":"A characteristic of Seollal is bowing to elders."},{"korean":"떡국을 먹는 것이 설날의 전통이에요.","english":"Eating tteokguk is a Seollal tradition."}]', 1),
    (l_id, 'N에는 V-는 풍습이 있다', 'N + 에는 + V-는 풍습이 있다', 'Expresses a custom or tradition associated with N.', '[{"korean":"설날에는 윷놀이를 하는 풍습이 있어요.","english":"There is a custom of playing yut on Seollal."},{"korean":"설날에는 한복을 입는 풍습이 있어요.","english":"There is a custom of wearing hanbok on Seollal."}]', 2),
    (l_id, 'A-게 지내다', 'Adjective + 게 지내다', 'Expresses how one spends a period of time.', '[{"korean":"가족과 즐겁게 설날을 보냈어요.","english":"I spent Seollal happily with family."},{"korean":"건강하게 새해를 맞이하고 싶어요.","english":"I want to welcome the new year in good health."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '할아버지', '새해 복 많이 받아라!', 'Saehae bok manhi badara!', 'Happy New Year! (to a younger person)', 1),
    (l_id, '손자', '감사합니다, 할아버지. 올해도 건강하게 지내세요!', 'Gamsahamnida, harabeoji. Olhaedo geonganghage jinaeeseyo!', 'Thank you, Grandfather. Please stay healthy this year too!', 2),
    (l_id, '어머니', '자, 이제 차례를 드려야지. 어른들께 세배도 드리고.', 'Ja, ije charye-reul deuryeoyaji. Eoreundeulkke sebae-do deurigo.', 'Now, we should perform the ancestral rites. And also bow to the elders.', 3),
    (l_id, '아이', '엄마, 세배하면 세뱃돈 받을 수 있죠?', 'Eomma, sebaehamy sebaetdon badeul su itjyo?', 'Mom, when we bow, we can receive New Year money, right?', 4),
    (l_id, '어머니', '그럼! 어른들께 인사를 잘 드리면 세뱃돈도 받고 덕담도 들을 수 있어.', 'Geureum! Eoreundeulkke insa-reul jal deurimyeon sebaetdon-do batgo deokdam-do deureu su isseo.', 'Of course! If you greet the elders well, you can receive New Year money and also hear blessings.', 5),
    (l_id, '아이', '설날에는 왜 떡국을 먹어요?', 'Seollal-eneun wae tteokguk-eul meogeyo?', 'Why do we eat tteokguk on Seollal?', 6),
    (l_id, '아버지', '떡국을 먹어야 한 살 더 먹는다고 했어. 흰 떡은 새해의 깨끗함을 상징하거든.', 'Tteokguk-eul meogeoya han sal deo meongneundago haesseo. Huin tteok-eun saehae-ui kkaekkeutam-eul sangjinghageodeun.', 'They say you have to eat tteokguk to become a year older. White rice cakes symbolize the cleanliness of the new year, you see.', 7),
    (l_id, '아이', '아, 그렇구나! 그럼 빨리 떡국 먹어야겠다!', 'A, geureokunna! Geureum ppalli tteokguk meogeoyagessda!', 'Ah, I see! Then I need to eat tteokguk quickly!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '설날에 어른께 절을 하는 것을 무엇이라 합니까?', '["차례","윷놀이","세배","덕담"]', 2, '세배 = the traditional New Year bow to elders.', 1),
    (l_id, '설날에는 떡국을 먹는 ___ 있어요. (custom)', '["것이","풍습이","전통이","규칙이"]', 1, 'N에는 V-는 풍습이 있다 = there is a custom of V-ing on/in N.', 2),
    (l_id, '설날에 먹는 전통 음식은?', '["비빔밥","삼계탕","떡국","불고기"]', 2, 'Tteokguk (rice cake soup) is the traditional Seollal food.', 3),
    (l_id, '''귀성''의 의미는?', '["ancestral rites","returning to hometown","folk game","blessing"]', 1, '귀성 = returning to one''s hometown (especially for holidays).', 4),
    (l_id, '세뱃돈은 언제 받는 것입니까?', '["성인이 되면","생일 때","설날에 어른께 세배할 때","추석에 차례 후"]', 2, '세뱃돈 is received after performing the New Year bow (세배) to elders.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '설날은 한국의 가장 큰 명절 중 하나로, 음력 1월 1일입니다. 전 국민이 고향으로 귀성하여 온 가족이 모이는 날입니다. 아침에는 조상님께 차례를 지내고, 어른들께 세배를 드립니다. 세배 후에는 어른들로부터 세뱃돈과 덕담을 받습니다. 설날 아침에는 가족이 함께 떡국을 먹습니다. 떡국을 먹으면 한 살 더 먹는다는 의미가 있습니다. 윷놀이 같은 전통 놀이를 하며 가족과 즐거운 시간을 보냅니다.', 'Seollal is one of Korea''s biggest holidays, falling on the 1st day of the lunar calendar. It is a day when the entire nation returns to their hometowns and the whole family gathers. In the morning, ancestral rites (charye) are performed, and the younger members bow to the elders (sebae). After the bow, children receive New Year money and blessings from the elders. On Seollal morning, the family eats tteokguk (rice cake soup) together. Eating tteokguk symbolizes becoming a year older. The family spends enjoyable time playing traditional games like yut.', 1);
END $$;

-- ============================================================
-- Lesson 87: Chuseok Festival (추석)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 87;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=87 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '추석', 'Chuseok', 'Korean Harvest Moon Festival', 1),
    (l_id, '송편', 'songpyeon', 'half-moon rice cakes', 2),
    (l_id, '성묘', 'seongmyo', 'visiting ancestral graves', 3),
    (l_id, '보름달', 'boreumdal', 'full moon', 4),
    (l_id, '강강술래', 'gang-gang-sullae', 'traditional circle dance', 5),
    (l_id, '풍요', 'pungnyo', 'abundance, plenty', 6),
    (l_id, '수확', 'suhwaek', 'harvest', 7),
    (l_id, '햇곡식', 'haetgoksik', 'new harvest grain', 8),
    (l_id, '추수', 'chusu', 'harvest (autumn)', 9),
    (l_id, '음력', 'eumnyeok', 'lunar calendar', 10),
    (l_id, '가족 모임', 'gajok mo-im', 'family gathering', 11),
    (l_id, '성대하다', 'seongdaehada', 'to be grand, magnificent', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N을/를 기념하다', 'N + 을/를 기념하다', 'Means "to commemorate" or "to celebrate N."', '[{"korean":"추석은 풍요로운 수확을 기념하는 명절이에요.","english":"Chuseok is a holiday that commemorates the bountiful harvest."},{"korean":"가족과 함께 추석을 기념해요.","english":"We commemorate Chuseok with family."}]', 1),
    (l_id, 'N과/와 비슷하다', 'N + 과/와 비슷하다', 'Compares N to something similar.', '[{"korean":"추석은 미국의 추수감사절과 비슷해요.","english":"Chuseok is similar to America''s Thanksgiving."},{"korean":"설날은 중국의 춘절과 비슷한 명절이에요.","english":"Seollal is a holiday similar to China''s Spring Festival."}]', 2),
    (l_id, 'A/V-다는 의미/뜻이 있다', 'Clause + 다는 의미가 있다', 'Expresses that something has a meaning or symbolism.', '[{"korean":"보름달은 풍요와 행복을 상징한다는 의미가 있어요.","english":"The full moon has the meaning of symbolizing abundance and happiness."},{"korean":"성묘는 조상을 기억한다는 의미가 있어요.","english":"Grave visiting has the meaning of remembering ancestors."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '외국인', '추석이 뭐예요? 한국의 크리스마스 같은 건가요?', 'Chuseok-i mwoyeyo? Hanguk-ui Christmas gateun geonganyo?', 'What is Chuseok? Is it like Korea''s Christmas?', 1),
    (l_id, '한국인', '아니요, 추석은 미국의 추수감사절과 더 비슷해요. 풍요로운 가을 수확을 기념하는 명절이에요.', 'Aniyo, Chuseok-eun miguk-ui chusu-gamsajeo-rgwa deo biseutaeyo. Pungnyoroun ga-eul suhwaek-eul ginyeom-haneun myeongjeol-ieyo.', 'No, Chuseok is more similar to America''s Thanksgiving. It''s a holiday commemorating the bountiful autumn harvest.', 2),
    (l_id, '외국인', '언제예요?', 'Eonje-yeyo?', 'When is it?', 3),
    (l_id, '한국인', '음력 8월 15일이에요. 그날 저녁에 보름달을 볼 수 있어요.', 'Eumnyeok 8-wol 15-il-ieyo. Geunal jeonyeok-e boreumdal-eul bol su isseoyo.', 'It''s the 15th day of the 8th lunar month. You can see the full moon on that evening.', 4),
    (l_id, '외국인', '추석에는 어떤 것을 해요?', 'Chuseok-eneun eotteon geoseul haeyo?', 'What do you do on Chuseok?', 5),
    (l_id, '한국인', '가족이 모여 차례를 지내고 성묘를 해요. 그리고 온 가족이 함께 송편을 만들어 먹어요.', 'Gajok-i moyeo charye-reul jinaego seongmyo-reul haeyo. Geurigo on gajok-i hamkke songpyeon-eul mandeureomeogeyo.', 'Family gathers, performs ancestral rites, and visits the graves. And the whole family makes and eats songpyeon together.', 6),
    (l_id, '외국인', '송편이 뭐예요?', 'Songpyeon-i mwoyeyo?', 'What is songpyeon?', 7),
    (l_id, '한국인', '반달 모양의 떡인데 안에 참깨, 꿀, 콩 등을 넣어서 만들어요. 솔잎 위에 쪄서 먹어요.', 'Bandal moyang-ui tteok-inde ane chamkkae, kkeul, kong deung-eul neo-seo mandeuleoyo. Sollip wie jjyeo-seo meogeyo.', 'It''s a half-moon shaped rice cake filled with sesame seeds, honey, beans, etc. It''s steamed on pine needles.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '추석은 음력 ___ 15일입니다.', '["1월","3월","5월","8월"]', 3, 'Chuseok falls on the 15th of the 8th lunar month.', 1),
    (l_id, '추석에 먹는 전통 음식은?', '["떡국","비빔밥","송편","삼계탕"]', 2, 'Songpyeon (half-moon rice cakes) are the traditional Chuseok food.', 2),
    (l_id, '추석은 미국의 ___ 비슷해요.', '["와","과와","하고","에"]', 1, 'N과/와 비슷하다 = similar to N. 추수감사절과 비슷해요.', 3),
    (l_id, '추석에 조상의 묘를 찾아가는 것을 무엇이라 합니까?', '["차례","세배","귀성","성묘"]', 3, '성묘 = visiting and tending ancestral graves.', 4),
    (l_id, '추석이 기념하는 것은 무엇입니까?', '["새해 시작","봄의 도래","가을 수확","조상의 탄생일"]', 2, 'Chuseok commemorates the autumn harvest (가을 수확).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '추석은 한국의 3대 명절 중 하나로, ''한국의 추수감사절''이라고도 불립니다. 음력 8월 15일로, 온 가족이 모여 풍요로운 수확에 감사하는 날입니다. 추석 아침에는 조상님께 차례를 지내고, 산소에 성묘를 갑니다. 온 가족이 함께 모여 송편을 만드는 것이 추석의 특별한 전통입니다. 저녁에는 밝은 보름달을 보며 소원을 빌기도 합니다. 강강술래는 추석에 하는 전통 민속놀이로 여성들이 원을 그리며 춤을 추는 것입니다.', 'Chuseok is one of Korea''s three major holidays and is also called ''Korea''s Thanksgiving.'' It falls on the 15th day of the 8th lunar month, and is a day when the whole family gathers to give thanks for the bountiful harvest. On the morning of Chuseok, ancestral rites are performed and families visit ancestral graves. A special Chuseok tradition is the whole family making songpyeon together. In the evening, people gaze at the bright full moon and make wishes. Ganggangsullae is a traditional folk game performed on Chuseok where women dance in a circle.', 1);
END $$;


-- ============================================================
-- Lesson 88: Korean Food Culture Deep Dive (한식 문화)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 88;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=88 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '한식', 'hansik', 'Korean cuisine', 1),
    (l_id, '밑반찬', 'mitbanchan', 'side dishes', 2),
    (l_id, '국물 요리', 'gungmul yori', 'broth-based dish', 3),
    (l_id, '구이', 'gui', 'grilled food', 4),
    (l_id, '찌개', 'jjigae', 'stew', 5),
    (l_id, '나물', 'namul', 'seasoned vegetables', 6),
    (l_id, '조미료', 'jomiryo', 'seasoning, condiment', 7),
    (l_id, '된장', 'doenjang', 'fermented soybean paste', 8),
    (l_id, '고추장', 'gochujang', 'red pepper paste', 9),
    (l_id, '간장', 'ganjang', 'soy sauce', 10),
    (l_id, '젓갈', 'jeotgal', 'salted fermented seafood', 11),
    (l_id, '음식 문화', 'eumsik munhwa', 'food culture', 12),
    (l_id, '공유하다', 'gongyuhada', 'to share', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N은/는 V-는 것이 특징이다', 'N + 은/는 + V-는 것이 특징이다', 'States a characteristic feature.', '[{"korean":"한식은 여러 반찬을 함께 먹는 것이 특징이에요.","english":"A characteristic of Korean food is eating multiple side dishes together."},{"korean":"한국 음식은 발효 재료를 많이 쓰는 것이 특징이에요.","english":"A feature of Korean food is its heavy use of fermented ingredients."}]', 1),
    (l_id, 'N에 따라 다르다', 'N + 에 따라 다르다', 'Expresses variation depending on N.', '[{"korean":"지역에 따라 음식 맛이 달라요.","english":"The taste of food varies depending on the region."},{"korean":"계절에 따라 먹는 음식이 달라요.","english":"The food you eat varies depending on the season."}]', 2),
    (l_id, 'A/V-다고 알려져 있다', 'A/V clause + 다고 알려져 있다', 'Expresses something that is commonly known or believed.', '[{"korean":"한식은 건강에 좋다고 알려져 있어요.","english":"Korean food is known to be good for health."},{"korean":"발효 음식은 장 건강에 좋다고 알려져 있어요.","english":"Fermented foods are known to be good for gut health."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '토마스', '한국 음식과 다른 나라 음식의 가장 큰 차이가 뭐예요?', 'Hanguk eumsik-gwa dareun nara eumsik-ui gajang keun chai-ga mwoyeyo?', 'What is the biggest difference between Korean food and food from other countries?', 1),
    (l_id, '지수', '여러 가지가 있는데요, 우선 한국 음식은 밥을 중심으로 여러 반찬을 함께 먹는 것이 특징이에요.', 'Yeoreo gaji-ga inneundeyo, ujeon Hanguk eumsik-eun bab-eul jungsim-euro yeoreo banchan-eul hamkke meongneun geosi teukjing-ieyo.', 'There are many things, but first, a characteristic of Korean food is eating several side dishes together centered around rice.', 2),
    (l_id, '토마스', '반찬은 보통 몇 가지나 나와요?', 'Banchan-eun botong myeot gaji-na nawayo?', 'How many side dishes are usually served?', 3),
    (l_id, '지수', '식당마다 다른데 보통 3~5가지는 기본이에요. 고급 한정식에는 10가지 이상 나오기도 해요.', 'Sikdangmada dareunde botong 3-5 gaji-neun gibon-ieyo. Gogeup hanjeogsik-eneun 10 gaji isang naogi-do haeyo.', 'It varies by restaurant, but 3-5 are usually the minimum. In high-end Korean table d''hote, more than 10 may come out.', 4),
    (l_id, '토마스', '한식은 건강에도 좋다고 알려져 있죠?', 'Hansik-eun geongange-do jotago allyeojeo itjyo?', 'Korean food is also known to be good for health, right?', 5),
    (l_id, '지수', '네, 특히 발효 음식인 김치, 된장, 청국장 같은 것들이 장 건강에 매우 좋다고 알려져 있어요.', 'Ne, teukhi balhyo eumsig-in kimchi, doenjang, cheonggukjang gateun geotdeul-i jang geongange maeu jotago allyeojeo isseoyo.', 'Yes, especially fermented foods like kimchi, doenjang, and cheonggukjang are known to be very good for gut health.', 6),
    (l_id, '토마스', '지역마다 음식 맛이 다르다고 들었어요. 어떤 지역 음식이 가장 유명해요?', 'Jiyeokmada eumsik mat-i dareudago deureosseoyo. Eotteon jiyeok eumsik-i gajang yumyeonghaeyo?', 'I heard the taste of food varies by region. Which regional food is most famous?', 7),
    (l_id, '지수', '전라도 음식이 맛있기로 유명해요. 특히 전주비빔밥이 전국적으로 유명하죠.', 'Jeollado eumsik-i mat-itgiro yumyeonghaeyo. Teukhi Jeonju bibimbap-i jeonguikjeog-euro yumyeonghajyo.', 'Jeolla province food is famous for being delicious. Especially Jeonju bibimbap is famous nationwide.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한식은 여러 반찬을 함께 먹는 것이 ___이에요.', '["이유","목적","특징","문제"]', 2, '특징 = characteristic feature.', 1),
    (l_id, '발효 음식은 장 건강에 좋다___ 알려져 있어요.', '["서","라고","고","면서"]', 1, 'A/V-다고 알려져 있다 = it is known that...', 2),
    (l_id, '지역___ 음식 맛이 달라요.', '["에서","에 따라","으로","이"]', 1, 'N에 따라 다르다 = varies depending on N.', 3),
    (l_id, '한식의 대표적인 발효 음식이 아닌 것은?', '["김치","된장","간장","떡볶이"]', 3, '떡볶이 is a non-fermented spicy rice cake dish.', 4),
    (l_id, '한국의 발효 조미료가 아닌 것은?', '["된장","고추장","간장","설탕"]', 3, '설탕 (sugar) is not a fermented condiment.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한식은 밥을 중심으로 국이나 찌개, 그리고 다양한 반찬으로 구성됩니다. 발효 식품인 김치, 된장, 간장, 고추장은 한식의 핵심 재료입니다. 한식은 건강에 좋다고 세계적으로 알려지면서 많은 관심을 받고 있습니다. 지역에 따라 음식의 맛과 종류가 다양한데, 전라도 음식은 맛있기로 유명합니다. 한식의 특징 중 하나는 음식을 나누어 먹는 문화입니다. 한국인들은 식사를 단순히 영양 섭취로 보지 않고 사회적 유대감을 형성하는 중요한 활동으로 여깁니다.', 'Korean cuisine is composed of rice as the centerpiece, along with soup or stew and various side dishes. Fermented foods — kimchi, doenjang, ganjang, and gochujang — are the core ingredients of Korean food. Korean cuisine is receiving much attention worldwide as it becomes known for being healthy. The taste and variety of food varies by region, and Jeolla province food is famous for being delicious. One characteristic of Korean cuisine is the culture of sharing food. Koreans do not view meals merely as nutritional intake but as an important activity for forming social bonds.', 1);
END $$;


-- ============================================================
-- Lesson 89: Travel in Korea (한국 여행)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 89;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=89 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '관광지', 'gwangwangji', 'tourist attraction', 1),
    (l_id, '여행 일정', 'yeohaeng iljeong', 'travel itinerary', 2),
    (l_id, '숙박', 'sukbak', 'accommodation', 3),
    (l_id, '경복궁', 'Gyeongbok-gung', 'Gyeongbokgung Palace', 4),
    (l_id, '제주도', 'Jeju-do', 'Jeju Island', 5),
    (l_id, '부산', 'Busan', 'Busan (city)', 6),
    (l_id, '남산타워', 'Namsan Tower', 'Namsan Tower (N Seoul Tower)', 7),
    (l_id, '인사동', 'Insadong', 'Insadong (cultural district in Seoul)', 8),
    (l_id, '기차표', 'gichapyo', 'train ticket', 9),
    (l_id, 'KTX', 'KTX', 'Korea Train Express (high-speed rail)', 10),
    (l_id, '환승하다', 'hwanseunghada', 'to transfer (transit)', 11),
    (l_id, '입장료', 'ipjangnyo', 'admission fee', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)러 가다', 'V stem + (으)러 가다/오다', 'Expresses going/coming somewhere for a purpose.', '[{"korean":"경복궁을 구경하러 갔어요.","english":"I went to see Gyeongbokgung Palace."},{"korean":"한국에 여행하러 왔어요.","english":"I came to Korea to travel."}]', 1),
    (l_id, 'N에서 N까지', 'Start N + 에서 + End N + 까지', 'Expresses a range: "from N to N."', '[{"korean":"서울에서 부산까지 KTX로 3시간 걸려요.","english":"It takes 3 hours from Seoul to Busan by KTX."},{"korean":"인천공항에서 서울 시내까지 어떻게 가요?","english":"How do you get from Incheon Airport to central Seoul?"}]', 2),
    (l_id, 'N이/가 가볼 만하다', 'N + 이/가 가볼 만하다', 'Recommends visiting a place: "N is worth visiting."', '[{"korean":"제주도는 가볼 만한 곳이에요.","english":"Jeju Island is a place worth visiting."},{"korean":"경복궁은 꼭 가볼 만해요.","english":"Gyeongbokgung Palace is definitely worth visiting."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '여행객', '한국에 처음 왔어요. 꼭 가봐야 할 곳이 어디예요?', 'Hanguk-e cheoeum wass-eoyo. Kkok gabwaya hal gosi eodi-eyo?', 'I came to Korea for the first time. Where must I definitely visit?', 1),
    (l_id, '현지인', '서울에서는 경복궁과 인사동이 가볼 만해요. 경복궁은 조선 시대 왕궁이에요.', 'Seoul-eseo-neun Gyeongbokgung-gwa Insadong-i gabolmanhaaeyo. Gyeongbokgung-eun Joseon sidae wanggung-ieyo.', 'In Seoul, Gyeongbokgung and Insadong are worth visiting. Gyeongbokgung is the royal palace from the Joseon era.', 2),
    (l_id, '여행객', '서울 외에도 어디를 추천해요?', 'Seoul oe-edo eodi-reul chucheon-haeyo?', 'Besides Seoul, where do you recommend?', 3),
    (l_id, '현지인', '부산과 제주도를 추천해요. 부산은 바다가 아름답고 해산물이 맛있어요. 제주도는 자연경관이 정말 아름다워요.', 'Busan-gwa Jeju-do-reul chucheonhaeyo. Busan-eun bada-ga areumdabgo haesanmul-i masiseoyo. Jeju-do-neun jayeon-gyeong-gwan-i jeongmal areumdawoyo.', 'I recommend Busan and Jeju Island. Busan has a beautiful sea and delicious seafood. Jeju Island has really beautiful natural scenery.', 4),
    (l_id, '여행객', '서울에서 부산까지 어떻게 가요?', 'Seoul-eseo Busan-kkaji eotteoke gayo?', 'How do you get from Seoul to Busan?', 5),
    (l_id, '현지인', 'KTX로 가면 약 2시간 30분 걸려요. 아니면 비행기도 있는데 더 비싸요.', 'KTX-ro gamyeon yak du-sigan samsip-bun geollyeoyo. Animyeon bihaenggi-do inneunde deo bissayo.', 'By KTX it takes about 2 hours 30 minutes. There are also flights but they''re more expensive.', 6),
    (l_id, '여행객', 'KTX 표는 어디서 살 수 있어요?', 'KTX pyo-neun eodiseo sal su isseoyo?', 'Where can I buy KTX tickets?', 7),
    (l_id, '현지인', '코레일 앱이나 역 창구에서 살 수 있어요. 미리 예매하면 더 쌀 수 있어요.', 'Korail app-ina yeok changgu-eseo sal su isseoyo. Miri yemae-hamyeon deo ssal su isseoyo.', 'You can buy them at the Korail app or at the station counter. Booking in advance can be cheaper.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '경복궁을 구경하___ 갔어요.', '["기 위해","러","려고","고 싶어"]', 1, 'V-(으)러 가다 = go for the purpose of doing V.', 1),
    (l_id, '서울___ 부산___ KTX로 3시간 걸려요.', '["에서 / 까지","에 / 을","에서 / 에","에 / 까지"]', 0, 'N에서 N까지 = from N to N.', 2),
    (l_id, '제주도는 가볼 ___이에요.', '["수","만한 곳","적","편"]', 1, 'N이/가 가볼 만하다 = worth visiting.', 3),
    (l_id, '''KTX''는 무엇입니까?', '["Korean Taxi Express","Korea Train Express","Korean Tourist Excursion","Korea Travel Experience"]', 1, 'KTX stands for Korea Train Express, Korea''s high-speed rail.', 4),
    (l_id, '한국 여행 시 추천 명소가 아닌 것은?', '["경복궁","제주도","인사동","파리 에펠탑"]', 3, 'The Eiffel Tower in Paris is not in Korea.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 다양한 관광 명소를 가진 나라입니다. 서울에는 경복궁, 남산타워, 인사동, 동대문 등 볼거리가 많습니다. 부산은 해운대 해수욕장과 자갈치 시장으로 유명합니다. 제주도는 한라산, 성산일출봉, 아름다운 해변으로 많은 관광객이 찾습니다. 서울에서 전국 주요 도시를 KTX로 빠르게 이동할 수 있어 여행이 편리합니다. 한국관광공사의 Visit Korea 앱을 활용하면 다양한 여행 정보를 얻을 수 있습니다.', 'Korea is a country with diverse tourist attractions. Seoul has many sights including Gyeongbokgung Palace, Namsan Tower, Insadong, and Dongdaemun. Busan is famous for Haeundae Beach and Jagalchi Market. Jeju Island attracts many tourists with Hallasan Mountain, Seongsan Ilchulbong, and beautiful beaches. Travel is convenient as you can quickly move from Seoul to major cities nationwide by KTX. You can obtain various travel information using the Korea Tourism Organization''s Visit Korea app.', 1);
END $$;

-- ============================================================
-- Lesson 90: TOPIK 2 Review (토픽 2 복습)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 90;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=90 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '복습', 'bokseup', 'review, revision', 1),
    (l_id, '어휘', 'eohwi', 'vocabulary', 2),
    (l_id, '문법', 'munbeop', 'grammar', 3),
    (l_id, '읽기', 'ilkgi', 'reading', 4),
    (l_id, '듣기', 'deutgi', 'listening', 5),
    (l_id, '쓰기', 'sseugi', 'writing', 6),
    (l_id, '합격', 'hapgyeok', 'passing (an exam)', 7),
    (l_id, '점수', 'jeomsu', 'score, point', 8),
    (l_id, '연결 표현', 'yeongyeol pyohyeon', 'connective expressions', 9),
    (l_id, '대조', 'daejo', 'contrast', 10),
    (l_id, '원인', 'won-in', 'cause', 11),
    (l_id, '결과', 'gyeolgwa', 'result', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'TOPIK 2 핵심 연결 어미', '아서/어서, 지만, (으)면, (으)ㄹ 때', 'Review of key connective endings: cause(-아서/어서), contrast(-지만), condition(-(으)면), time(-(으)ㄹ 때).', '[{"korean":"바빠서 못 갔어요. / 바쁘지만 갈게요. / 바쁘면 연락해요. / 바쁠 때 도와주세요.","english":"I couldn''t go because I was busy. / I''m busy but I''ll go. / If you''re busy, contact me. / Please help when busy."}]', 1),
    (l_id, 'TOPIK 2 핵심 종결 어미', '-(으)ㄹ 것 같다, -는 편이다, -게 되다, -(으)ㄹ 수 있다', 'Review of key sentence-ending patterns at TOPIK 2 level.', '[{"korean":"비가 올 것 같아요. / 조용한 편이에요. / 친하게 됐어요. / 할 수 있어요.","english":"It looks like it will rain. / I tend to be quiet. / We became close. / I can do it."}]', 2),
    (l_id, 'TOPIK 2 쓰기 핵심 구조', '주제 소개 → 근거 제시 → 결론', 'TOPIK 2 writing structure: introduce topic, provide reasons/evidence, conclude.', '[{"korean":"[주제] 저출산 문제에 대해서 [근거] 경제적 부담과 사회적 압박 때문에 [결론] 정부와 사회의 지원이 필요하다","english":"[Topic] Regarding low birth rate [Evidence] Due to economic burden and social pressure [Conclusion] Government and social support is needed"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '선생님', '이제 TOPIK 2 시험에 필요한 주요 문법을 복습해 봐요. 먼저 연결 어미부터 정리해 볼까요?', 'Ije TOPIK 2 siheom-e piryohan juyo munbeop-eul bokseup hae bwayo. Meonjeo yeongyeol eomi-buto jeongni hae bolkkayo?', 'Now let''s review the key grammar needed for the TOPIK 2 exam. Shall we start by organizing connective endings?', 1),
    (l_id, '학생', '네, 원인을 나타내는 ''아서/어서''부터 시작하면 될까요?', 'Ne, won-in-eul natonaeneun ''a-seo/eo-seo''-buto sijakamyeon doelkkayo?', 'Yes, shall we start with -아서/어서 that expresses cause?', 2),
    (l_id, '선생님', '좋아요. ''아서/어서''는 원인과 결과를 나타내고, ''지만''은 대조를 나타내요. 예를 들어 볼까요?', 'Joayo. ''a-seo/eo-seo''-neun won-in-gwa gyeolgwa-reul natanaego, ''jiman''-eun daejo-reul natanaeyo. Ye-reul deulkkayo?', 'Good. -아서/어서 expresses cause and result, and -지만 expresses contrast. Shall we give examples?', 3),
    (l_id, '학생', '네, ''늦어서 미안해요'' vs ''늦었지만 도착했어요''를 비교하면 되겠네요.', 'Ne, ''neujeoseo mianhaeyo'' vs ''neutjeo-ssojiman dochakhaesseoyo''-reul bigyo-hamyeon doegenne-yo.', 'Yes, we can compare ''I''m sorry for being late'' vs ''I was late but arrived.''', 4),
    (l_id, '선생님', '완벽해요! 그 다음엔 ''ㄹ 것 같다'' 같은 종결 패턴도 정리해요.', 'Wanbyeokhaeyo! Geu daeum-en ''l geot gatda'' gateun jonggyeol paeteon-do jeongrihaeyo.', 'Perfect! Next let''s also organize sentence-ending patterns like ''it seems like.''', 5),
    (l_id, '학생', '알겠습니다. 체계적으로 정리하니까 이해가 쉬워지네요.', 'Algesseumnida. Chegyejeog-euro jeongriniikka ihae-ga swi-wojineyo.', 'Understood. Organizing it systematically makes it easier to understand.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '원인과 결과를 나타내는 연결 어미는?', '["-지만","-아서/어서","-(으)면","-ㄹ 때"]', 1, '-아서/어서 connects cause and result clauses.', 1),
    (l_id, '대조를 나타내는 연결 어미는?', '["-아서/어서","-고","-지만","-(으)면"]', 2, '-지만 expresses contrast or concession.', 2),
    (l_id, '경향이나 성향을 나타내는 표현은?', '["-ㄹ 것 같다","-는 편이다","-게 되다","-ㄹ 수 있다"]', 1, '-는 편이다 expresses a tendency or inclination.', 3),
    (l_id, 'TOPIK 2 쓰기에서 글의 순서로 올바른 것은?', '["결론 → 근거 → 주제","주제 → 결론 → 근거","근거 → 주제 → 결론","주제 → 근거 → 결론"]', 3, 'The standard essay structure is: introduce topic, present evidence, conclude.', 4),
    (l_id, '의도나 계획을 나타내는 표현은?', '["-(으)ㄹ 것 같다","-(으)려고 하다","-는 편이다","-게 되다"]', 1, '-(으)려고 하다 expresses intention or plan.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, 'TOPIK 2 시험은 읽기, 듣기, 쓰기 세 영역으로 구성됩니다. 이 시험을 잘 보려면 다양한 어휘와 문법 표현을 알아야 합니다. 특히 연결 어미의 올바른 사용이 중요합니다. 원인(-아서/어서), 대조(-지만), 조건(-으면), 시간(-ㄹ 때) 등의 표현을 정확하게 이해하고 활용해야 합니다. 쓰기 영역에서는 주어진 주제에 대해 논리적으로 글을 쓰는 능력이 요구됩니다. 지금까지 배운 내용들을 체계적으로 복습하고 다양한 예제를 통해 연습하는 것이 중요합니다.', 'The TOPIK 2 exam consists of three sections: reading, listening, and writing. To do well on this exam, you must know a variety of vocabulary and grammatical expressions. The correct use of connective endings is particularly important. Expressions for cause (-아서/어서), contrast (-지만), condition (-으면), and time (-ㄹ 때) must be accurately understood and used. In the writing section, the ability to write logically about a given topic is required. It is important to systematically review what you have learned so far and practice through various examples.', 1);
END $$;


-- ============================================================
-- Lesson 91: Formal Speech (격식체)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 91;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=91 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '격식체', 'gyeoksikcheae', 'formal speech style', 1),
    (l_id, '합쇼체', 'hapshyo-che', 'highest formal speech level', 2),
    (l_id, '발표', 'balpyo', 'presentation, announcement', 3),
    (l_id, '연설', 'yeonso', 'speech, address', 4),
    (l_id, '공식적', 'gongsikjeok', 'official, formal', 5),
    (l_id, '문서', 'munseo', 'document', 6),
    (l_id, '보고서', 'bogoseo', 'report', 7),
    (l_id, '회의', 'hoeui', 'meeting, conference', 8),
    (l_id, '제안서', 'jeanseeo', 'proposal', 9),
    (l_id, '논문', 'nonmun', 'thesis, academic paper', 10),
    (l_id, '결론', 'gyeollon', 'conclusion', 11),
    (l_id, '분석하다', 'bunseok-ada', 'to analyze', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-ㅂ니다/습니다', 'Verb/Adj stem + ㅂ니다 (vowel) / 습니다 (consonant)', 'The formal declarative ending, used in official settings, presentations, and formal writing.', '[{"korean":"이 보고서를 제출합니다.","english":"I submit this report."},{"korean":"회의를 시작하겠습니다.","english":"I will start the meeting."}]', 1),
    (l_id, 'V-ㅂ니까?/습니까?', 'Verb stem + ㅂ니까? / 습니까?', 'Formal interrogative ending, used in official contexts.', '[{"korean":"동의하십니까?","english":"Do you agree?"},{"korean":"자료를 검토하셨습니까?","english":"Have you reviewed the materials?"}]', 2),
    (l_id, 'N에 대하여 말씀드리겠습니다', 'N + 에 대하여 말씀드리겠습니다', 'Formal way to introduce what you will speak about: "I will speak about N."', '[{"korean":"오늘 발표 주제에 대하여 말씀드리겠습니다.","english":"I will speak about today''s presentation topic."},{"korean":"이 문제의 원인과 해결책에 대하여 설명드리겠습니다.","english":"I will explain the causes and solutions to this problem."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '사회자', '지금부터 발표를 시작하겠습니다. 발표자는 준비가 되셨습니까?', 'Jigeumbuto balpyo-reul sijakagessseumnida. Balpyoja-neun junbi-ga doesyeosseumnikka?', 'We will now begin the presentation. Is the presenter ready?', 1),
    (l_id, '발표자', '네, 준비됐습니다. 안녕하십니까, 저는 마케팅 팀의 이준호입니다.', 'Ne, junbi-dwaessseumnida. Annyeonghashimnikka, jeoneun makeuting tim-ui Lee Jun-ho-imnida.', 'Yes, I am ready. Good day, I am Lee Jun-ho from the Marketing team.', 2),
    (l_id, '발표자', '오늘은 3분기 마케팅 성과에 대하여 말씀드리겠습니다.', 'Oneul-eun 3-bungi makeuting seonggwa-e daehayeo malsseum-deurigesseumnida.', 'Today I will speak about the Q3 marketing performance.', 3),
    (l_id, '발표자', '먼저 전분기 대비 매출 현황을 보시겠습니까?', 'Meonjeo jeonbungi daebi maechul hyeonhwang-eul bosigessseumnikka?', 'Shall I first show you the sales status compared to the previous quarter?', 4),
    (l_id, '청중', '네, 보여 주시겠습니까?', 'Ne, boyeo jusigesseumnikka?', 'Yes, could you show us?', 5),
    (l_id, '발표자', '이번 분기 매출은 전분기 대비 15% 증가하였습니다. 디지털 마케팅 강화가 주요 원인이었습니다.', 'Ibeon bungi maechul-eun jeonbungi daebi 15% jeunggahayeossseumnida. Dijiteol makeuting gangwa-ga juyo won-in-ieosseumnida.', 'This quarter''s sales increased by 15% compared to the previous quarter. The strengthening of digital marketing was the main cause.', 6),
    (l_id, '사회자', '발표해 주셔서 감사합니다. 질문 있으십니까?', 'Balpyo-hae jusyeoseo gamsahamnida. Jilmun iss-eushipnikka?', 'Thank you for the presentation. Are there any questions?', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '격식체에서 동사 어미로 맞는 것은?', '["-아요/어요","-ㅂ니다/습니다","-야","-지"]', 1, '-ㅂ니다/습니다 is the formal declarative ending.', 1),
    (l_id, '발표에서 주제를 소개할 때 쓰는 표현은?', '["~에 대해 말씀드리겠습니다","~에 대해 말해요","~에 대해 얘기할게요","~에 대해 생각해요"]', 0, 'N에 대하여 말씀드리겠습니다 is the formal expression for introducing a topic.', 2),
    (l_id, '다음 중 격식체가 아닌 것은?', '["감사합니다","알겠습니다","고마워요","제출하겠습니다"]', 2, '고마워요 is informal; formal would be 감사합니다.', 3),
    (l_id, '''보고서''의 의미는?', '["meeting","proposal","report","conclusion"]', 2, '보고서 means a report.', 4),
    (l_id, '격식체는 어떤 상황에서 사용합니까?', '["친한 친구와 대화할 때","공식 발표나 회의에서","가족과 식사할 때","비공개 채팅에서"]', 1, 'Formal speech (격식체) is used in official presentations, meetings, and formal situations.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어의 격식체는 공식적인 상황에서 사용하는 말투입니다. 주로 ''합쇼체''라고 불리며 ''-ㅂ니다/습니다''로 끝납니다. 발표, 연설, 보고서 작성, 공식 회의 등에서 격식체를 사용합니다. 격식체는 화자와 청자 사이의 거리감과 공식성을 나타냅니다. 비격식 존댓말인 ''-아요/어요''와 달리 더 무겁고 공식적인 느낌을 줍니다. 직장인이라면 격식체를 잘 구사할 수 있어야 합니다. 특히 중요한 발표나 면접에서 격식체를 사용하면 좋은 인상을 줄 수 있습니다.', 'The formal speech style (격식체) of Korean is the speech style used in official situations. It is mainly called ''hapshyo-che'' and ends with -ㅂ니다/습니다. Formal speech is used in presentations, speeches, report writing, and official meetings. It conveys distance and formality between the speaker and listener. Unlike the informal polite -아요/어요 style, it gives a heavier and more official feeling. Working professionals should be able to use formal speech well. Using formal speech in important presentations or job interviews can make a good impression.', 1);
END $$;

-- ============================================================
-- Lesson 92: Persuasion and Argument (설득과 논증)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 92;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=92 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '설득하다', 'seoldeukhada', 'to persuade', 1),
    (l_id, '논증', 'nonjeung', 'argument, reasoning', 2),
    (l_id, '근거', 'geungeo', 'evidence, grounds', 3),
    (l_id, '주장', 'jujang', 'claim, assertion', 4),
    (l_id, '반론', 'ballon', 'counterargument', 5),
    (l_id, '타당하다', 'tadanghada', 'to be valid, reasonable', 6),
    (l_id, '논리적', 'nonlijeok', 'logical', 7),
    (l_id, '증거', 'jeunggeo', 'evidence, proof', 8),
    (l_id, '사실', 'sasil', 'fact', 9),
    (l_id, '가설', 'gaseol', 'hypothesis', 10),
    (l_id, '결론을 내리다', 'gyeollon-eul naerida', 'to reach a conclusion', 11),
    (l_id, '반박하다', 'banbak-ada', 'to refute, to counter', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-(으)ㄴ/는 반면에', 'V/A + (으)ㄴ/는 반면에', 'Formal connective meaning "on the other hand" or "whereas." Used in arguments and academic writing.', '[{"korean":"A안은 비용이 적게 드는 반면에 효과가 낮다.","english":"Option A is low cost, whereas the effect is low."},{"korean":"재생에너지는 친환경적인 반면에 초기 비용이 높다.","english":"Renewable energy is eco-friendly, whereas initial costs are high."}]', 1),
    (l_id, 'V-(으)ㄹ 뿐만 아니라', 'V stem + (으)ㄹ 뿐만 아니라', 'Means "not only... but also." Adds an additional point to an argument.', '[{"korean":"이 정책은 경제에 도움이 될 뿐만 아니라 환경에도 좋다.","english":"This policy will not only benefit the economy but also be good for the environment."},{"korean":"운동은 건강에 좋을 뿐만 아니라 스트레스 해소에도 도움이 된다.","english":"Exercise is not only good for health but also helpful for stress relief."}]', 2),
    (l_id, 'A/V-다는 점에서', 'A/V clause + 다는 점에서', 'Means "from the standpoint that A/V" or "in that A/V." Used in formal argumentation.', '[{"korean":"이 방법이 효율적이라는 점에서 채택을 권고한다.","english":"I recommend adoption in that this method is efficient."},{"korean":"비용을 줄일 수 있다는 점에서 유리하다.","english":"It is advantageous in that costs can be reduced."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '토론자1', '재생에너지 확대를 주장합니다. 화석연료는 환경을 오염시킬 뿐만 아니라 고갈될 것입니다.', 'Jaesengeoneoji hwakdae-reul jujang-hamnida. Hwaseokyeonlyo-neun hwangyeong-eul oyeomsikilppunman anira gogaldoel geossimnida.', 'I argue for the expansion of renewable energy. Fossil fuels not only pollute the environment but will also be depleted.', 1),
    (l_id, '토론자2', '반론을 제기합니다. 재생에너지는 친환경적인 반면에 초기 비용이 매우 높습니다.', 'Ballon-eul jegihamnida. Jaesengeoneoji-neun chinhwangyeongjeok-in banmyeon-e chogi biyong-i maeu nopseumnida.', 'I raise a counterargument. Renewable energy is eco-friendly, whereas initial costs are very high.', 2),
    (l_id, '토론자1', '그것은 단기적 관점입니다. 장기적으로는 비용이 절감된다는 점에서 더 경제적입니다.', 'Geugeosseun dangijeok gwanjeomimnida. Janggijeog-euro-neun biyong-i jeolgamdoendaneun jeom-eseo deo gyeongjejeok-imnida.', 'That is a short-term perspective. In the long run, it is more economical in that costs decrease.', 3),
    (l_id, '토론자2', '타당한 주장이지만, 현재 기술 수준으로 안정적 공급이 어렵다는 점도 고려해야 합니다.', 'Tadanghan jujang-ijiman, hyeonjae gisul sujun-euro anjeongjeok gonggup-i eoryeopdaneun jeomdo goryeo-haeya hamnida.', 'That is a valid argument, but we must also consider the point that stable supply is difficult with current technology levels.', 4),
    (l_id, '사회자', '두 분 모두 논리적인 근거를 제시하셨습니다. 결론을 내려 봐야겠군요.', 'Du bun modu nonlijeok-in geungeo-reul jesi-hasheossseumnida. Gyeollon-eul naeryeo bwaya-getkunyo.', 'Both sides have presented logical evidence. It seems we need to reach a conclusion.', 5);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '이 정책은 경제에 도움이 될 ___ 아니라 환경에도 좋다.', '["뿐만","만","것만","만이"]', 0, '-(으)ㄹ 뿐만 아니라 = not only...but also.', 1),
    (l_id, '비용이 높은 ___ 효과가 좋다. (on the other hand)', '["반면에","뿐만 아니라","때문에","덕분에"]', 0, 'A-(으)ㄴ/는 반면에 = on the other hand / whereas.', 2),
    (l_id, '비용을 줄일 수 있다___ 점에서 유리하다.', '["는","다는","라는","는데"]', 1, 'A/V-다는 점에서 = from the standpoint/in that.', 3),
    (l_id, '''반론''의 의미는?', '["claim","fact","counterargument","conclusion"]', 2, '반론 means counterargument.', 4),
    (l_id, '설득력 있는 논증의 요소가 아닌 것은?', '["명확한 주장","타당한 근거","논리적 전개","감정적 호소만으로 구성"]', 3, 'Consisting only of emotional appeals (감정적 호소만) does not constitute a strong argument.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '설득력 있는 논증을 구성하려면 명확한 주장과 충분한 근거가 필요합니다. 효과적인 논증은 사실에 근거하고 논리적으로 전개됩니다. 한국어에서 ''뿐만 아니라''는 논거를 추가할 때, ''반면에''는 대조적인 관점을 제시할 때 사용합니다. ''-다는 점에서''는 특정 측면에서의 주장을 전개할 때 유용합니다. 반론을 인정하면서도 자신의 주장을 유지하는 것이 성숙한 논쟁의 방식입니다. TOPIK 쓰기에서도 이러한 논증 기술이 요구됩니다.', 'To construct a persuasive argument, a clear claim and sufficient evidence are needed. An effective argument is based on facts and proceeds logically. In Korean, ''ppunman anira'' is used to add arguments, and ''banmyeon-e'' is used to present contrasting viewpoints. -다는 점에서 is useful when developing an argument from a specific angle. Acknowledging counterarguments while maintaining your own claim is the approach of mature argumentation. These argumentation skills are also required in TOPIK writing.', 1);
END $$;

