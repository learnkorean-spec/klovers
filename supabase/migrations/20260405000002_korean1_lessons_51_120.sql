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

