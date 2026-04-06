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


-- ============================================================
-- Lesson 93: News and Media Language (뉴스 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 93;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=93 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '보도하다', 'bodohada', 'to report (news)', 1),
    (l_id, '기사', 'gisa', 'article, news story', 2),
    (l_id, '헤드라인', 'hedeurain', 'headline', 3),
    (l_id, '취재하다', 'chwiaehada', 'to gather news, to cover', 4),
    (l_id, '발표되다', 'balpyodoeda', 'to be announced', 5),
    (l_id, '밝혀지다', 'balkyeojida', 'to be revealed, come to light', 6),
    (l_id, '따르면', 'ttareumyeon', 'according to', 7),
    (l_id, '관계자', 'gwangyeja', 'related person, official', 8),
    (l_id, '전했다', 'jeonhaessda', 'reported (quote)', 9),
    (l_id, '논란', 'nollan', 'controversy', 10),
    (l_id, '여론', 'yeollon', 'public opinion', 11),
    (l_id, '공식 입장', 'gongsik ipjang', 'official stance', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 따르면 (에 의하면)', 'N + 에 따르면 / N + 에 의하면', 'Formal expression meaning "according to N," used in news and reports.', '[{"korean":"정부 발표에 따르면 올해 GDP가 3% 성장했다.","english":"According to the government announcement, GDP grew 3% this year."},{"korean":"연구 결과에 의하면 이 물질은 안전하다.","english":"According to research results, this substance is safe."}]', 1),
    (l_id, 'V/A-다고 전했다/밝혔다', 'V/A clause + 다고 전했다 / 밝혔다', 'Formal indirect speech for news: "reported that..." or "revealed that..."', '[{"korean":"관계자는 이 문제를 조속히 해결하겠다고 밝혔다.","english":"An official revealed that they would resolve this issue promptly."},{"korean":"대변인은 회의가 성공적이었다고 전했다.","english":"The spokesperson reported that the meeting was successful."}]', 2),
    (l_id, 'V-(으)ㄴ 것으로 알려졌다', 'V stem + (으)ㄴ 것으로 알려졌다', 'Formal expression for reporting: "it became known that V" or "reportedly V."', '[{"korean":"사고 원인은 기계 결함인 것으로 알려졌다.","english":"The cause of the accident was reportedly a mechanical defect."},{"korean":"협상이 타결된 것으로 알려졌다.","english":"It became known that the negotiations were concluded."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '앵커', '오늘의 주요 뉴스입니다. 정부에 따르면 올해 경제성장률이 2.5%를 기록했다고 발표됐습니다.', 'Oneul-ui juyo nyuseu-imnida. Jeongbu-e ttareumyeon olhae gyeongje seongjang-nyul-i 2.5%-reul girokhaessgo balpyodoessseumnida.', 'Here is today''s major news. According to the government, it was announced that this year''s economic growth rate recorded 2.5%.', 1),
    (l_id, '기자', '네, 기획재정부 관계자는 수출 증가가 주요 원인이었다고 밝혔습니다.', 'Ne, gihoek-jaejeongbu gwangyeja-neun suchul jeunggaga juyo won-in-ieossda-go balkyeossseumnida.', 'Yes, an official from the Ministry of Economy and Finance revealed that the increase in exports was the main cause.', 2),
    (l_id, '앵커', '한편 이번 협상은 성공적으로 타결된 것으로 알려졌습니다. 자세한 내용은 기자 연결로 알아보겠습니다.', 'Hanpyeon ibeon hyeopsang-eun seonggongjeog-euro taegyeoldoen geosro allyeojeotsseumnida. Jasehan naeyong-eun gija yeongyelro arabogessseumnida.', 'Meanwhile, it has become known that the negotiations were successfully concluded. For more details, we will connect to the reporter.', 3),
    (l_id, '현장 기자', '네, 현장에서 보도해 드립니다. 양측 대표들은 오후 늦게까지 협상을 진행한 것으로 알려졌습니다.', 'Ne, hyeonjang-eseo bodohae deurimnida. Yangtcheuk daepyodeul-eun ohu neutgekkaji hyeopsang-eul jinhaenghan geosro allyeojeotsseumnida.', 'Yes, I''m reporting from the scene. It became known that representatives from both sides continued negotiations until late in the afternoon.', 4),
    (l_id, '앵커', '감사합니다. 다음 소식은 사회부 기자가 전해드리겠습니다.', 'Gamsahamnida. Daeum sosig-eun sahoeb gija-ga jeonhaedeurigesseumnida.', 'Thank you. The next story will be delivered by our society reporter.', 5);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '정부 발표___ 따르면 GDP가 성장했다.', '["이","에","을","의"]', 1, 'N에 따르면 = according to N.', 1),
    (l_id, '관계자는 해결하겠다___ 밝혔다.', '["고","라고","다고","면서"]', 2, 'V-다고 밝혔다 = revealed/stated that V (indirect speech).', 2),
    (l_id, '협상이 타결된 것___ 알려졌다.', '["이","으로","을","에서"]', 1, 'V-(으)ㄴ 것으로 알려졌다 = it became known that/reportedly.', 3),
    (l_id, '''여론''의 의미는?', '["official stance","controversy","public opinion","headline"]', 2, '여론 = public opinion.', 4),
    (l_id, '뉴스에서 ''따르면''의 역할은?', '["결과를 나타낸다","출처를 나타낸다","대조를 나타낸다","조건을 나타낸다"]', 1, '따르면 (according to) indicates the source of information.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '뉴스 언어는 일상 언어와 다른 특징이 있습니다. 한국 뉴스에서는 ''에 따르면'', ''에 의하면'' 등으로 정보의 출처를 밝힙니다. 간접화법을 통해 발언을 전달할 때는 ''-다고 전했다'', ''-다고 밝혔다'' 등을 사용합니다. 뉴스 제목은 간결하고 임팩트 있게 작성되며 종종 주어를 생략합니다. 뉴스를 읽는 것은 어휘력과 시사 지식을 동시에 향상시키는 좋은 방법입니다. 한국어 학습자에게는 한국 뉴스를 꾸준히 읽거나 듣는 것을 권장합니다.', 'News language has different characteristics from everyday language. Korean news uses expressions like ''에 따르면'' and ''에 의하면'' (according to) to indicate the source of information. When conveying statements through indirect speech, expressions like ''-다고 전했다'' and ''-다고 밝혔다'' are used. News headlines are written concisely and impactfully, often omitting the subject. Reading news is a good way to simultaneously improve vocabulary and current affairs knowledge. For Korean language learners, it is recommended to consistently read or listen to Korean news.', 1);
END $$;

-- ============================================================
-- Lesson 94: Academic Writing (학술 글쓰기)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 94;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=94 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '학술', 'hakseul', 'academic, scholarly', 1),
    (l_id, '서론', 'seollon', 'introduction (of an essay)', 2),
    (l_id, '본론', 'bollon', 'body (of an essay)', 3),
    (l_id, '결론', 'gyeollon', 'conclusion', 4),
    (l_id, '논문', 'nonmun', 'academic paper, thesis', 5),
    (l_id, '인용하다', 'inyonghada', 'to cite, to quote', 6),
    (l_id, '참고문헌', 'chamgomunheon', 'bibliography, references', 7),
    (l_id, '주제문', 'jujeomun', 'thesis statement', 8),
    (l_id, '객관적', 'gaekgwanjeok', 'objective', 9),
    (l_id, '주관적', 'jugwanjeok', 'subjective', 10),
    (l_id, '분석하다', 'bunseokada', 'to analyze', 11),
    (l_id, '통계', 'tongye', 'statistics', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, '학술문 종결 어미: -다/-이다', 'V/A stem + 다 / N + 이다', 'Academic writing uses the plain form ending -다 instead of polite -아요/어요 or formal -습니다.', '[{"korean":"본 연구는 기후 변화의 원인을 분석한다.","english":"This study analyzes the causes of climate change."},{"korean":"결론은 다음과 같다.","english":"The conclusion is as follows."}]', 1),
    (l_id, 'A/V-다고 볼 수 있다', 'A/V clause + 다고 볼 수 있다', 'Academic expression meaning "it can be seen that" or "one can observe that."', '[{"korean":"이 결과를 통해 가설이 증명됐다고 볼 수 있다.","english":"Through these results, it can be seen that the hypothesis was proven."},{"korean":"교육 투자가 경제 성장에 기여한다고 볼 수 있다.","english":"It can be observed that investment in education contributes to economic growth."}]', 2),
    (l_id, 'N을/를 중심으로', 'N + 을/를 중심으로', 'Means "centered on N" or "focusing on N." Common in academic writing.', '[{"korean":"이 논문은 청소년 교육을 중심으로 논의한다.","english":"This paper discusses the issue centered on adolescent education."},{"korean":"서울을 중심으로 조사가 이루어졌다.","english":"The survey was conducted centered on Seoul."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '교수', '학술 논문 쓸 때 가장 중요한 것이 뭔지 알아요?', 'Hakseul nonmun sseul ttae gajang jungyohan geosi mweonji arayo?', 'Do you know what is most important when writing an academic paper?', 1),
    (l_id, '학생', '객관성과 논리적 구성이 중요하다고 생각해요.', 'Gaekgwanseong-gwa nonlijeok guseong-i jungyohada-go saenggakaeyo.', 'I think objectivity and logical structure are important.', 2),
    (l_id, '교수', '맞아요. 학술 글쓰기는 개인적 의견보다 증거와 통계에 근거해야 해요. 서론, 본론, 결론 구조도 중요하고요.', 'Majayo. Hakseul geulsseuki-neun gaeinjeok uigyeonboda jeunggeo-wa tonggye-e geungeo-haeya haeyo. Seollon, bollon, gyeollon gujo-do jungyoago-yo.', 'Right. Academic writing must be based on evidence and statistics rather than personal opinions. The introduction-body-conclusion structure is also important.', 3),
    (l_id, '학생', '학술문에서는 종결 어미도 다르죠?', 'Hakseulmun-eseo-neun jonggyeol eomi-do darejyo?', 'The sentence-ending forms are also different in academic writing, right?', 4),
    (l_id, '교수', '네, 학술 문체는 ''-다'' 형태를 써요. ''분석한다'', ''볼 수 있다'' 같은 표현을 사용해요.', 'Ne, hakseul muncheae-neun ''-da'' hyeongtae-reul sseoyo. ''Bunseok-anda'', ''bol su itda'' gateun pyohyeon-eul sayong-haeyo.', 'Yes, academic style uses the -다 form. Expressions like ''analyzes'' and ''can be seen'' are used.', 5),
    (l_id, '학생', '참고문헌 표기도 중요하죠?', 'Chamgomunheon pyogi-do jungyohajyo?', 'Citing references is also important, right?', 6),
    (l_id, '교수', '매우 중요해요. 인용 없이 다른 사람의 생각을 사용하면 표절이 돼요.', 'Maeu jungyohaeyo. Inyong eobsi dareun saram-ui saenggak-eul sayong-amyeon pyojeol-i dwaeyo.', 'Very important. Using someone else''s ideas without citation becomes plagiarism.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '학술 논문의 구조로 올바른 것은?', '["결론-본론-서론","본론-서론-결론","서론-본론-결론","서론-결론-본론"]', 2, 'Academic essays follow: Introduction (서론) - Body (본론) - Conclusion (결론).', 1),
    (l_id, '학술 글쓰기의 종결 어미는?', '["-아요/어요","-다","-ㅂ니다/습니다","-지요"]', 1, 'Academic writing uses the plain -다 ending.', 2),
    (l_id, '이 결과를 통해 가설이 증명됐다___ 볼 수 있다.', '["고","라고","에","이라"]', 0, 'A/V-다고 볼 수 있다 = it can be seen that A/V.', 3),
    (l_id, '''인용하다''의 의미는?', '["to analyze","to cite/quote","to hypothesize","to conclude"]', 1, '인용하다 = to cite or quote.', 4),
    (l_id, '학술 글쓰기에서 피해야 하는 것은?', '["통계 사용","증거 제시","인용","주관적 의견만 나열"]', 3, 'Academic writing should be objective; listing only subjective opinions should be avoided.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '학술 글쓰기는 일상 글쓰기와 다른 규칙을 따릅니다. 가장 큰 차이점은 객관성입니다. 학술 논문에서는 개인적인 감정이나 주관적 의견보다 데이터와 증거를 중심으로 논지를 펼쳐야 합니다. 문체는 ''-다'' 형태의 평어체를 사용합니다. 서론에서는 연구 목적을, 본론에서는 분석과 논거를, 결론에서는 요약과 시사점을 제시합니다. 인용한 자료는 반드시 참고문헌에 표기해야 표절을 피할 수 있습니다.', 'Academic writing follows different rules from everyday writing. The biggest difference is objectivity. In academic papers, arguments should be developed centered on data and evidence rather than personal emotions or subjective opinions. The style uses the plain -다 form. The introduction presents the research purpose, the body presents analysis and arguments, and the conclusion presents a summary and implications. Cited materials must always be listed in the bibliography to avoid plagiarism.', 1);
END $$;


-- ============================================================
-- Lesson 95: Business Korean (비즈니스 한국어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 95;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=95 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '비즈니스', 'bijeuniiseu', 'business', 1),
    (l_id, '거래처', 'georaecheo', 'client, business partner', 2),
    (l_id, '계약', 'gyeyak', 'contract', 3),
    (l_id, '협상', 'hyeopsang', 'negotiation', 4),
    (l_id, '명함', 'myeongham', 'business card', 5),
    (l_id, '프레젠테이션', 'peureejentei-syeon', 'presentation', 6),
    (l_id, '출장', 'chuljang', 'business trip', 7),
    (l_id, '납기', 'napgi', 'delivery deadline', 8),
    (l_id, '예산', 'yesan', 'budget', 9),
    (l_id, '회계', 'hoegye', 'accounting', 10),
    (l_id, '마감일', 'magamil', 'deadline', 11),
    (l_id, '상담하다', 'sangdamhada', 'to consult, to advise', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-(으)시겠습니까? (비즈니스 요청)', 'V + (으)시겠습니까?', 'Very polite formal request or invitation used in business contexts.', '[{"korean":"회의 자료를 검토해 주시겠습니까?","english":"Would you kindly review the meeting materials?"},{"korean":"이쪽으로 앉으시겠습니까?","english":"Would you please take a seat this way?"}]', 1),
    (l_id, 'V-겠습니다 (비즈니스 약속)', 'V stem + 겠습니다', 'Formal promise or commitment: "I will" in business context.', '[{"korean":"최선을 다하겠습니다.","english":"I will do my best."},{"korean":"3일 안에 보내 드리겠습니다.","english":"I will send it to you within 3 days."}]', 2),
    (l_id, 'N에 관련하여 / N과 관련하여', 'N + 에 관련하여 / N + 과/와 관련하여', 'Formal expression meaning "regarding N" or "in relation to N." Used in emails and business documents.', '[{"korean":"계약 건에 관련하여 연락드립니다.","english":"I am contacting you regarding the contract matter."},{"korean":"납기일과 관련하여 문의드립니다.","english":"I am inquiring in relation to the delivery deadline."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '박 과장', '안녕하세요, 이번 계약 건에 관련하여 연락드렸습니다.', 'Annyeonghaseyo, ibeon gyeyak geon-e gwanlyeonhayeo yeollakdeuryeotsseumnida.', 'Hello, I am contacting you regarding this contract matter.', 1),
    (l_id, '김 대리', '아, 네. 잘 받았습니다. 계약 조건을 검토해 주시겠습니까?', 'A, ne. Jal badassseumnida. Gyeyak jogeon-eul geomtohae jusigessseumnikka?', 'Ah, yes. I received it well. Would you kindly review the contract conditions?', 2),
    (l_id, '박 과장', '네, 검토 후 의견을 드리겠습니다. 납기일이 언제입니까?', 'Ne, geomto hu uigyeon-eul deurigesseumnida. Napgiil-i eonje-imnikka?', 'Yes, I will give you my opinion after reviewing. When is the delivery deadline?', 3),
    (l_id, '김 대리', '이번 달 말까지입니다. 혹시 예산 관련해서도 논의할 수 있을까요?', 'Ibeon dal malkkaji-imnida. Hoksi yesan gwanlyeon-haeseo-do nonuihal su isseulkkayo?', 'It is by the end of this month. Could we also discuss budget-related matters?', 4),
    (l_id, '박 과장', '물론입니다. 내일 오전 10시에 회의실에서 만나 뵙겠습니다.', 'Mullon-imnida. Naeil ojeon yeol si-e hoeui-sil-eseo manna boipgesseumnida.', 'Of course. I will meet you tomorrow at 10 AM in the conference room.', 5),
    (l_id, '김 대리', '감사합니다. 내일 뵙겠습니다.', 'Gamsahamnida. Naeil boipgesseumnida.', 'Thank you. See you tomorrow.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '계약 건___ 관련하여 문의드립니다.', '["을","에","이","의"]', 1, 'N에 관련하여 = regarding N.', 1),
    (l_id, '비즈니스 약속 표현으로 맞는 것은?', '["할게요","하겠습니다","할 거예요","해요"]', 1, '-겠습니다 is the formal commitment form used in business.', 2),
    (l_id, '''명함''의 의미는?', '["resume","business card","contract","negotiation"]', 1, '명함 = business card.', 3),
    (l_id, '회의 자료를 검토해 주___ 겠습니까?', '["시","는","기","고"]', 0, '-시겠습니까? is the very polite formal request form.', 4),
    (l_id, '비즈니스 상황에서 적절하지 않은 언어는?', '["격식체","존댓말","야 해요 (informal)","공식적 표현"]', 2, '야 해요 is too informal for business settings.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '비즈니스 한국어는 일반 한국어보다 더 격식적인 표현을 사용합니다. 특히 이메일이나 공식 문서에서는 ''에 관련하여'', ''에 대하여'' 등의 표현을 자주 사용합니다. 처음 만나는 비즈니스 파트너에게는 명함을 두 손으로 정중히 전달합니다. 회의에서는 발언 순서를 지키고 상대방의 의견을 경청하는 것이 중요합니다. 약속을 지키는 것은 비즈니스 신뢰의 기본입니다. 마감일을 넘기지 않도록 일정 관리를 철저히 해야 합니다.', 'Business Korean uses more formal expressions than everyday Korean. Especially in emails and official documents, expressions like ''에 관련하여'' (regarding) and ''에 대하여'' (concerning) are frequently used. Business cards should be presented politely with both hands to business partners you are meeting for the first time. In meetings, it is important to observe speaking turns and listen attentively to the other person''s opinions. Keeping promises is the foundation of business trust. Schedule management must be thorough to avoid missing deadlines.', 1);
END $$;

-- ============================================================
-- Lesson 96: Job Interview Korean (면접 한국어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 96;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=96 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '면접', 'myeonjeop', 'job interview', 1),
    (l_id, '지원하다', 'jiwon-hada', 'to apply for', 2),
    (l_id, '이력서', 'iryeokseo', 'resume, CV', 3),
    (l_id, '자기소개서', 'jagi sokaeseo', 'self-introduction letter', 4),
    (l_id, '지원 동기', 'jiwon donggi', 'motivation for applying', 5),
    (l_id, '강점', 'gangjeom', 'strength', 6),
    (l_id, '약점', 'yakjeom', 'weakness', 7),
    (l_id, '입사하다', 'ipsahada', 'to join a company', 8),
    (l_id, '연봉', 'yeonbong', 'annual salary', 9),
    (l_id, '경력', 'gyeongnyeok', 'work experience/career', 10),
    (l_id, '역량', 'yeongnyyang', 'competency, capability', 11),
    (l_id, '포부', 'pobu', 'aspiration, ambition', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-(으)ㄹ 자신이 있습니다', 'V/A + (으)ㄹ 자신이 있습니다', 'Formal expression of confidence: "I am confident that I can V."', '[{"korean":"팀에 기여할 자신이 있습니다.","english":"I am confident that I can contribute to the team."},{"korean":"목표를 달성할 자신이 있습니다.","english":"I am confident I can achieve the goals."}]', 1),
    (l_id, 'V-아/어 왔습니다 (경력 표현)', 'V + 아/어 왔습니다', 'Expresses a continuous action from the past to the present: "I have been V-ing."', '[{"korean":"5년간 마케팅 분야에서 일해 왔습니다.","english":"I have been working in the marketing field for 5 years."},{"korean":"꾸준히 노력해 왔습니다.","english":"I have been making consistent efforts."}]', 2),
    (l_id, 'V/A-(으)ㄹ 것이라고 생각합니다', 'V/A + (으)ㄹ 것이라고 생각합니다', 'Formal expression of opinion or prediction in interview context.', '[{"korean":"이 역할에 잘 맞을 것이라고 생각합니다.","english":"I think I would be a good fit for this role."},{"korean":"충분히 기여할 수 있을 것이라고 생각합니다.","english":"I think I will be able to contribute sufficiently."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '면접관', '자기소개를 해 주시겠습니까?', 'Jagi sokaereul hae jusigessseumnikka?', 'Could you please introduce yourself?', 1),
    (l_id, '지원자', '안녕하십니까, 저는 이수진이라고 합니다. 마케팅 분야에서 3년간 일해 왔습니다.', 'Annyeonghashimnikka, jeoneun Lee Su-jin-irago hamnida. Makeuting bunyaeseo sam-nyeongan ilhae watsseumnida.', 'Good day, my name is Lee Su-jin. I have been working in the marketing field for 3 years.', 2),
    (l_id, '면접관', '이 직책에 지원한 동기가 무엇입니까?', 'I jikchaekg-e jiwonhan donggi-ga mueosimnikka?', 'What is your motivation for applying for this position?', 3),
    (l_id, '지원자', '귀사의 글로벌 마케팅 전략에 깊이 공감하며, 제 역량을 최대한 발휘할 수 있는 환경이라고 생각하여 지원하였습니다.', 'Gwisa-ui geullobal makeuting jeollak-e gipi gonggam-amyeo, je yeongnyyang-eul choedaehan balhwi-hal su inneun hwangyeong-irago saengakhayeo jiwon-hayeo-sseumnida.', 'I deeply resonate with your company''s global marketing strategy, and I applied because I believe it is an environment where I can demonstrate my capabilities to the fullest.', 4),
    (l_id, '면접관', '본인의 강점과 약점을 말씀해 주시겠습니까?', 'Bonin-ui gangjeom-gwa yakjeom-eul malsseum-hae jusigessseumnikka?', 'Could you tell us about your strengths and weaknesses?', 5),
    (l_id, '지원자', '제 강점은 분석력과 소통 능력입니다. 약점은 완벽주의 성향이 있다는 점인데, 이를 보완하기 위해 노력하고 있습니다.', 'Je gangjeom-eun bunseongnyeok-gwa sotong neungnyeok-imnida. Yakjeom-eun wanbyeokjuui seonghyang-i itdaneun jeominde, ireul bowanagi wihae noryeok-ago isseumnida.', 'My strengths are analytical ability and communication skills. My weakness is that I have a perfectionist tendency, and I am making efforts to address this.', 6),
    (l_id, '면접관', '입사 후 포부를 말씀해 주십시오.', 'Ipsa hu pobu-reul malsseum-hae jusimu-ipsio.', 'Please tell us about your aspirations after joining the company.', 7),
    (l_id, '지원자', '입사 후 빠르게 팀에 적응하고 3년 안에 팀에 중요한 기여를 할 수 있을 것이라고 생각합니다.', 'Ipsa hu pparuge tim-e jeogeuenghago sam-nyeon an-e tim-e jungyohan giyeo-reul hal su isseul geosirago saenggaghamnida.', 'I think I will adapt quickly to the team after joining and be able to make an important contribution to the team within 3 years.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '팀에 기여할 ___ 있습니다. (confident)', '["수가","자신이","적이","수"]', 1, '-(으)ㄹ 자신이 있습니다 = I am confident I can.', 1),
    (l_id, '5년간 마케팅에서 일해 ___. (continuous past)', '["있어요","왔습니다","갔습니다","왔어요"]', 1, 'V-아/어 왔습니다 = have been V-ing (up to now).', 2),
    (l_id, '면접에서 ''지원 동기''는 무엇입니까?', '["job title","work experience","motivation for applying","annual salary"]', 2, '지원 동기 = motivation for applying.', 3),
    (l_id, '''강점''의 반대말은?', '["이력서","경력","약점","역량"]', 2, '강점 (strength) is the opposite of 약점 (weakness).', 4),
    (l_id, '면접에서 적절하지 않은 태도는?', '["격식체 사용","눈 맞춤","자신감 있는 태도","핸드폰 보기"]', 3, 'Looking at your phone during an interview is inappropriate.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국에서 면접은 취업의 중요한 관문입니다. 면접에서는 격식체를 사용하고 단정한 복장을 착용해야 합니다. 자기소개, 지원 동기, 강점과 약점, 입사 후 포부는 면접의 기본 질문입니다. 답변을 할 때는 구체적인 경험과 수치를 활용하면 더욱 설득력이 있습니다. 꾸준히 노력해 왔다는 것을 ''V-아/어 왔습니다''를 사용하여 표현하면 자연스럽습니다. 면접관의 질문을 잘 듣고 침착하게 답변하는 것이 중요합니다.', 'In Korea, job interviews are an important gateway to employment. In interviews, formal speech must be used and neat attire should be worn. Self-introduction, motivation for applying, strengths and weaknesses, and post-employment aspirations are standard interview questions. When answering, using specific experiences and numbers makes the answer more persuasive. Expressing that you have been making consistent efforts using ''V-아/어 왔습니다'' sounds natural. It is important to listen carefully to the interviewer''s questions and answer calmly.', 1);
END $$;


-- ============================================================
-- Lesson 97: Complex Sentence Patterns (복잡한 문장 구조)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 97;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=97 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '복문', 'bongmun', 'complex sentence', 1),
    (l_id, '내포절', 'naepojeon', 'embedded clause', 2),
    (l_id, '관계절', 'gwangyejeon', 'relative clause', 3),
    (l_id, '수식하다', 'usikhada', 'to modify, to qualify', 4),
    (l_id, '선행절', 'seonhaengjeon', 'preceding clause', 5),
    (l_id, '후행절', 'huhaengjeon', 'following clause', 6),
    (l_id, '연결어미', 'yeongyeol-eomi', 'connective ending', 7),
    (l_id, '전환하다', 'jeonhwanada', 'to switch, to transition', 8),
    (l_id, '동시에', 'dongsie', 'at the same time', 9),
    (l_id, '순차적', 'sunchajseon', 'sequential', 10),
    (l_id, '병렬', 'byeongnyeol', 'parallel, side-by-side', 11),
    (l_id, '함축하다', 'hamchukhada', 'to imply, to connote', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V-면서 (simultaneous)', 'V stem + 면서', 'Connects two simultaneous actions: "while V-ing." Both subjects must be the same.', '[{"korean":"음악을 들으면서 공부해요.","english":"I study while listening to music."},{"korean":"웃으면서 말했어요.","english":"She spoke while smiling."}]', 1),
    (l_id, 'V-(으)ㄹ 뿐만 아니라 V', 'V1 + (으)ㄹ 뿐만 아니라 + V2', 'Complex additive: "not only V1 but also V2." Formal and common in B1+ writing.', '[{"korean":"그는 한국어를 잘 할 뿐만 아니라 일본어도 유창해요.","english":"He is not only good at Korean but also fluent in Japanese."},{"korean":"건강에 좋을 뿐만 아니라 맛도 있어요.","english":"It is not only good for health but also delicious."}]', 2),
    (l_id, 'N에도 불구하고', 'N + 에도 불구하고 / V/A + 음에도 불구하고', 'Means "despite N" or "in spite of V/A." Formal concessive expression.', '[{"korean":"어려움에도 불구하고 포기하지 않았어요.","english":"Despite the difficulties, I didn''t give up."},{"korean":"비가 오는 것에도 불구하고 행사가 진행됐어요.","english":"Despite the rain, the event proceeded."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '교사', '복잡한 문장 구조를 연습해 봅시다. ''면서''를 이용해서 문장을 만들어 보세요.', 'Bokjaphan munjang gujo-reul yeonseup hae bopsida. ''Myeonseo''-reul iyonghaeseo munjang-eul mandeureoboseyo.', 'Let''s practice complex sentence structures. Please make a sentence using ''myeonseo''.', 1),
    (l_id, '학생', '저는 밥을 먹으면서 TV를 봐요.', 'Jeoneun bab-eul meogeumyeonseo TV-reul bwayo.', 'I watch TV while eating.', 2),
    (l_id, '교사', '잘했어요. 이번에는 ''뿐만 아니라''를 써 보세요.', 'Jalhaesseoyo. Ibeone-neun ''ppunman anira''-reul sseo boseyo.', 'Well done. This time use ''not only...but also.''', 3),
    (l_id, '학생', '한국어는 어려울 뿐만 아니라 재미있기도 해요.', 'Hangugeo-neun eoryeoul ppunman anira jaemi-itgido haeyo.', 'Korean is not only difficult but also interesting.', 4),
    (l_id, '교사', '아주 좋아요. 그럼 ''에도 불구하고''는요?', 'Aju joayo. Geureum ''eedong bulguhago''-neunyo?', 'Very good. What about ''despite''?', 5),
    (l_id, '학생', '피곤함에도 불구하고 끝까지 공부했어요.', 'Pigonham-edo bulguhago kkeutkkaji gongbu-haesseoyo.', 'Despite the fatigue, I studied until the end.', 6),
    (l_id, '교사', '완벽해요. 이런 복잡한 패턴들이 고급 한국어 구사의 핵심이에요.', 'Wanbyeokhaeyo. Ireon bokjaphan paeteondeul-i gogeup Hangugeo gusa-ui haeksim-ieyo.', 'Perfect. These complex patterns are the core of advanced Korean expression.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '음악을 들으___ 공부해요.', '["아서","면서","지만","고"]', 1, '-면서 connects simultaneous actions.', 1),
    (l_id, '건강에 좋을 ___ 아니라 맛도 있어요.', '["뿐","뿐만","것만","이것만"]', 1, '-(으)ㄹ 뿐만 아니라 = not only...but also.', 2),
    (l_id, '어려움___ 불구하고 포기하지 않았어요.', '["에도","에서","이","으로"]', 0, 'N에도 불구하고 = despite N.', 3),
    (l_id, '-면서의 제약 조건은?', '["주어가 달라야 한다","주어가 같아야 한다","과거 시제만 쓴다","명사만 연결한다"]', 1, '-면서 requires the subjects of both clauses to be the same.', 4),
    (l_id, '복문에서 두 동작이 동시에 일어남을 나타내는 표현은?', '["-고 나서","-기 전에","-면서","-(으)ㄴ 후에"]', 2, '-면서 expresses simultaneous actions.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '복잡한 문장 구조는 고급 한국어 표현의 핵심입니다. ''-면서''는 두 행동이 동시에 일어날 때 사용합니다. ''뿐만 아니라''는 추가 정보를 덧붙일 때 쓰는 강조 표현입니다. ''에도 불구하고''는 예상과 반대되는 결과를 말할 때 사용하는 양보 표현입니다. 이러한 복합 연결 표현들을 능숙하게 활용하면 더 풍부하고 자연스러운 한국어 표현이 가능합니다. TOPIK 3 수준에서는 이런 복잡한 문장 구조의 이해와 활용이 필수적입니다.', 'Complex sentence structures are the core of advanced Korean expression. -면서 is used when two actions happen simultaneously. 뿐만 아니라 is an emphatic expression used to add additional information. 에도 불구하고 is a concessive expression used when the result is contrary to expectation. Skillfully using these complex connective expressions enables richer and more natural Korean expression. At the TOPIK 3 level, understanding and applying these complex sentence structures is essential.', 1);
END $$;

-- ============================================================
-- Lesson 98: Indirect Speech (간접화법)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 98;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=98 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '간접화법', 'ganjeop-hwabeop', 'indirect speech', 1),
    (l_id, '직접화법', 'jikjeop-hwabeop', 'direct speech', 2),
    (l_id, '인용', 'inyong', 'quotation, citation', 3),
    (l_id, '전달하다', 'jeondalhada', 'to convey, to deliver', 4),
    (l_id, '주장하다', 'jujang-hada', 'to claim, to argue', 5),
    (l_id, '묻다', 'mutda', 'to ask', 6),
    (l_id, '명령하다', 'myeongnyeong-hada', 'to order, to command', 7),
    (l_id, '제안하다', 'jeanahada', 'to suggest', 8),
    (l_id, '대답하다', 'daedapada', 'to answer', 9),
    (l_id, '부탁하다', 'butakhada', 'to request', 10),
    (l_id, '보고하다', 'bogohada', 'to report', 11),
    (l_id, '언급하다', 'eon-geuphada', 'to mention', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, '간접화법: 평서문 (statement)', 'V/A + 다고 했어요/하다', 'Reports what someone said (statement). Verb/adj in plain form + 다고 했다.', '[{"korean":"그는 내일 온다고 했어요.","english":"He said he would come tomorrow."},{"korean":"선생님이 시험이 어렵다고 하셨어요.","english":"The teacher said the exam was difficult."}]', 1),
    (l_id, '간접화법: 의문문 (question)', 'V + (으)냐고 했어요 / A + (으)냐고 했어요', 'Reports a question someone asked. Verb/adj in plain form + (으)냐고 했다.', '[{"korean":"친구가 어디 가냐고 물었어요.","english":"My friend asked where I was going."},{"korean":"왜 늦었냐고 물어봤어요.","english":"They asked why I was late."}]', 2),
    (l_id, '간접화법: 명령문 (command)', 'V + (으)라고 했어요', 'Reports a command someone gave. Imperative form + 라고 했다.', '[{"korean":"어머니가 일찍 자라고 하셨어요.","english":"My mother told me to go to bed early."},{"korean":"선생님이 숙제를 제출하라고 하셨어요.","english":"The teacher told us to submit the homework."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '지나', '어제 선생님이 뭐라고 하셨어요?', 'Eoje seonsaengnim-i mworago hasyeosseoyo?', 'What did the teacher say yesterday?', 1),
    (l_id, '현민', '다음 주에 시험이 있다고 하셨어요. 그리고 꼭 교재를 읽으라고 하셨어요.', 'Daeum ju-e siheom-i itdago hasyeosseoyo. Geurigo kkok gyojae-reul ilgeuraogo hasyeosseoyo.', 'She said there would be an exam next week. And she told us to definitely read the textbook.', 2),
    (l_id, '지나', '시험 범위는요?', 'Siheom beomwi-neunyo?', 'What about the exam scope?', 3),
    (l_id, '현민', '5장부터 8장까지라고 하셨어요.', 'Ojangi-buto paljang-kkajirago hasyeosseoyo.', 'She said from chapter 5 to chapter 8.', 4),
    (l_id, '지나', '그리고 민수가 어디 가냐고 물어봤다고?', 'Geurigo Minsu-ga eodi ganyago mureobwatdago?', 'And did Minsu ask where you were going?', 5),
    (l_id, '현민', '네, 도서관에 가냐고 물어봤어요. 같이 공부하자고 했는데 저는 약속이 있어서 못 갔어요.', 'Ne, doseogwan-e ganyago mureobwasseoyo. Gachi gongbu-haja-go haenneunde jeoneun yakso-gi isseo-seo mot gasseoyo.', 'Yes, he asked if I was going to the library. He suggested studying together, but I had plans so I couldn''t go.', 6),
    (l_id, '지나', '민수가 같이 공부하''자고'' 했다고요? -자고는 제안 표현이죠?', 'Minsu-ga gachi gongbu-ha''jago'' haetda-goyo? -Jago-neun jean pyohyeon-ijyo?', 'Minsu said ''let''s study together?'' -jago is the suggestion form, right?', 7),
    (l_id, '현민', '맞아요. 제안을 전달할 때는 -자고 했다, 명령은 -라고 했다를 써요.', 'Majayo. Jean-eul jeondal-hal ttae-neun -jago haetda, myeongnyeong-eun -rago haetda-reul sseoyo.', 'That''s right. When conveying a suggestion you use -자고 했다, and for a command you use -라고 했다.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '그는 내일 온___ 했어요. (statement)', '["다고","라고","냐고","자고"]', 0, 'Statement: V-다고 했다.', 1),
    (l_id, '친구가 어디 가___ 물었어요. (question)', '["다고","라고","냐고","자고"]', 2, 'Question: V-(으)냐고 했다/물었다.', 2),
    (l_id, '선생님이 공부하___ 하셨어요. (command)', '["다고","라고","냐고","자고"]', 1, 'Command: V-(으)라고 했다.', 3),
    (l_id, '제안 간접화법은?', '["다고 했다","라고 했다","자고 했다","냐고 했다"]', 2, 'V-자고 했다 is the indirect speech form for suggestions.', 4),
    (l_id, '직접화법 vs 간접화법 중 맞는 설명은?', '["직접화법이 더 격식적이다","간접화법은 인용 부호를 사용한다","직접화법은 따옴표를 쓴다","간접화법은 시제가 없다"]', 2, 'Direct speech uses quotation marks (따옴표); indirect speech uses reporting verbs.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '간접화법은 다른 사람의 말이나 생각을 전달하는 방법입니다. 한국어에서는 문장 유형에 따라 간접화법 형태가 달라집니다. 평서문은 ''-다고 했다'', 의문문은 ''-(으)냐고 했다'', 명령문은 ''-(으)라고 했다'', 청유문은 ''-자고 했다''를 사용합니다. 뉴스나 보고서에서는 간접화법을 자주 사용합니다. 예를 들어 ''대변인은 협상이 성공적이었다고 밝혔다''와 같이 씁니다. 간접화법을 잘 활용하면 더 자연스럽고 정확하게 정보를 전달할 수 있습니다.', 'Indirect speech is a way of conveying what someone else said or thought. In Korean, the indirect speech form varies depending on the sentence type. Declarative sentences use -다고 했다, questions use -(으)냐고 했다, commands use -(으)라고 했다, and suggestions use -자고 했다. Indirect speech is frequently used in news and reports. For example, it is written as "the spokesperson revealed that the negotiations were successful." Using indirect speech well allows for more natural and accurate information delivery.', 1);
END $$;


-- ============================================================
-- Lesson 99: Korean Proverbs (한국 속담)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 99;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=99 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '속담', 'sokdam', 'proverb, saying', 1),
    (l_id, '교훈', 'gyohun', 'lesson, moral', 2),
    (l_id, '지혜', 'jihye', 'wisdom', 3),
    (l_id, '비유', 'biyu', 'metaphor, analogy', 4),
    (l_id, '의미하다', 'uimihada', 'to mean, to signify', 5),
    (l_id, '가르침', 'gareichim', 'teaching', 6),
    (l_id, '서당 개 삼 년이면 풍월을 읊는다', 'Seodang gae sam nyeon-imyeon pungwol-eul eumneunda', 'Even a dog in a school learns to recite poetry after 3 years', 7),
    (l_id, '호랑이도 제 말 하면 온다', 'Horang-ido je mal hamyeon onda', 'If you talk about a tiger, it comes', 8),
    (l_id, '콩 심은 데 콩 나고 팥 심은 데 팥 난다', 'Kong simeun de kong nago pat simeun de pat nanda', 'You reap what you sow', 9),
    (l_id, '시작이 반이다', 'Sijai-gi ban-ida', 'Well begun is half done', 10),
    (l_id, '천리 길도 한 걸음부터', 'Cheolri gildo han georeumbuto', 'A journey of a thousand miles begins with a single step', 11),
    (l_id, '웃는 얼굴에 침 못 뱉는다', 'Unneun eolgul-e chim mot baetneunda', 'You can''t spit on a smiling face', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N은/는 N을/를 의미한다', 'N1 + 은/는 + N2 + 를 의미합니다', 'Formal way to explain the meaning of a proverb or idiom.', '[{"korean":"''시작이 반이다''는 무슨 일이든 시작하는 것이 중요하다는 것을 의미합니다.","english":"''Well begun is half done'' means that it is important to start any task."},{"korean":"이 속담은 노력의 중요성을 가르쳐 줍니다.","english":"This proverb teaches the importance of effort."}]', 1),
    (l_id, 'N에 해당하는 한국어 표현', 'N + 에 해당하는 + 한국어 표현', 'Used to find equivalent expressions: "the Korean expression corresponding to N."', '[{"korean":"''You reap what you sow''에 해당하는 한국 속담은 ''콩 심은 데 콩 난다''예요.","english":"The Korean proverb corresponding to ''You reap what you sow'' is ''Beans grow where beans are planted.''"}]', 2),
    (l_id, 'V/A-다는 교훈을 준다', 'V/A + 다는 교훈을 준다', 'Explains the moral/lesson of a proverb.', '[{"korean":"이 속담은 꾸준한 노력이 중요하다는 교훈을 줍니다.","english":"This proverb gives the lesson that consistent effort is important."},{"korean":"작은 일도 소홀히 하지 말라는 교훈을 줍니다.","english":"It gives the lesson not to neglect small things."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '미카', '한국 속담에 대해 가르쳐 주실 수 있어요?', 'Hanguk sokdam-e daehae galeuchyeo jusil su isseoyo?', 'Can you teach me about Korean proverbs?', 1),
    (l_id, '유선', '물론이죠! ''시작이 반이다''라는 속담을 아세요?', 'Mullonjyo! ''Sijai-gi ban-ida''-raneun sokdam-eul aseyo?', 'Of course! Do you know the proverb ''Starting is half the battle''?', 2),
    (l_id, '미카', '아니요, 어떤 의미예요?', 'Aniyo, eotteon uimi-yeyo?', 'No, what does it mean?', 3),
    (l_id, '유선', '어떤 일을 시작하는 것 자체가 이미 절반을 이룬 것과 같다는 의미예요. 망설이지 말고 시작하라는 교훈을 줘요.', 'Eotteon il-eul sijak-aneun geot jachega imi jeolbaneul irun geosgwa gatdaneun uimi-yeyo. Mangseoliji malgo sijakara-neun gyohun-eul jwoyo.', 'It means that starting something itself is already like achieving half of it. It gives the lesson not to hesitate and to just start.', 4),
    (l_id, '미카', '한국에도 ''You reap what you sow''에 해당하는 속담이 있나요?', 'Hanguk-edo ''You reap what you sow''-e haedanghaneun sokdam-i innayo?', 'Is there a Korean proverb corresponding to ''You reap what you sow''?', 5),
    (l_id, '유선', '네! ''콩 심은 데 콩 나고 팥 심은 데 팥 난다''예요. 직역하면 ''콩을 심으면 콩이 나고 팥을 심으면 팥이 난다''는 뜻이에요.', 'Ne! ''Kong simeun de kong nago pat simeun de pat nanda''-yeyo. Jigyeok-amyeon ''Kong-eul simeumyeon kong-i nago pat-eul simeumyeon pat-i nanda''-neun tteut-ieyo.', 'Yes! It''s "Beans grow where beans are planted, and red beans grow where red beans are planted." Literally it means what you plant is what grows.', 6),
    (l_id, '미카', '정말 재미있는 표현이네요. 더 배우고 싶어요!', 'Jeongmal jaemi-inneun pyohyeon-ineyo. Deo baeugo sipeoyo!', 'That''s such an interesting expression. I want to learn more!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '''시작이 반이다''의 교훈은?', '["결과가 중요하다","시작하는 것이 중요하다","끝이 중요하다","포기하지 마라"]', 1, '''시작이 반이다'' teaches that starting is the most important step.', 1),
    (l_id, '''콩 심은 데 콩 난다''와 의미가 가장 비슷한 영어 표현은?', '["Actions speak louder than words","You reap what you sow","Better late than never","The early bird catches the worm"]', 1, '콩 심은 데 콩 난다 = You reap what you sow.', 2),
    (l_id, '''호랑이도 제 말 하면 온다''는 어떤 상황에 쓰나요?', '["누군가가 갑자기 나타날 때","공부를 시작할 때","밥을 먹을 때","잠자리에 들 때"]', 0, 'This proverb is used when someone you were just talking about suddenly appears.', 3),
    (l_id, '''천리 길도 한 걸음부터''의 의미는?', '["큰 성과는 하루에 이룰 수 있다","모든 큰 일은 작은 시작에서 비롯된다","빠를수록 좋다","끝이 좋으면 다 좋다"]', 1, '''천리 길도 한 걸음부터'' means even a great journey begins with a single step.', 4),
    (l_id, '속담의 역할이 아닌 것은?', '["조상의 지혜 전달","교훈 제공","문화 반영","단순한 문법 연습"]', 3, 'Proverbs convey wisdom, provide lessons, and reflect culture — not grammar practice.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '속담은 오랜 세월에 걸쳐 형성된 민중의 지혜를 담은 짧은 표현입니다. 한국 속담은 한국인의 가치관과 문화를 반영합니다. ''시작이 반이다''는 시작의 중요성을, ''콩 심은 데 콩 난다''는 인과응보를 가르칩니다. ''천리 길도 한 걸음부터''는 작은 시작의 중요성을 강조합니다. 속담을 알면 한국어를 더 자연스럽게 사용할 수 있으며, 한국 문화와 사고방식도 더 잘 이해할 수 있습니다. 한국 드라마나 일상 대화에서도 속담이 자주 등장합니다.', 'Proverbs are short expressions containing the wisdom of the people, formed over many years. Korean proverbs reflect Korean values and culture. ''Sijai-gi ban-ida'' (well begun is half done) teaches the importance of starting, and ''Kong simeun de kong nanda'' teaches the principle of cause and effect. ''Cheolri gildo han georeumbuto'' (a journey of a thousand miles begins with a single step) emphasizes the importance of small beginnings. Knowing proverbs allows for more natural Korean use, and also helps understand Korean culture and ways of thinking better. Proverbs also frequently appear in Korean dramas and everyday conversations.', 1);
END $$;

-- ============================================================
-- Lesson 100: Idioms and Fixed Expressions (관용 표현)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 100;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=100 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '관용 표현', 'gwanyong pyohyeon', 'idiom, fixed expression', 1),
    (l_id, '발이 넓다', 'bari neopda', 'to have a wide network (lit: wide feet)', 2),
    (l_id, '눈이 높다', 'nuni nopda', 'to have high standards (lit: high eyes)', 3),
    (l_id, '손이 크다', 'soni keuda', 'to be generous (lit: big hands)', 4),
    (l_id, '귀가 얇다', 'gwiga yalda', 'to be easily influenced (lit: thin ears)', 5),
    (l_id, '입이 무겁다', 'ibi mugeopda', 'to be tight-lipped (lit: heavy mouth)', 6),
    (l_id, '머리를 굴리다', 'meorireul gullida', 'to think hard, to scheme', 7),
    (l_id, '발등에 불이 떨어지다', 'badeunge buri tteoreojida', 'to be in urgent trouble (lit: fire falls on foot)', 8),
    (l_id, '바가지를 긁다', 'bagajireul geukda', 'to nag (lit: scratch gourd)', 9),
    (l_id, '찬물을 끼얹다', 'chanmureul kkiyeonjda', 'to put a damper on things (lit: pour cold water)', 10),
    (l_id, '국물도 없다', 'gungmuldo eopda', 'nothing left, no benefit', 11),
    (l_id, '비유적 표현', 'biyujeok pyohyeon', 'figurative expression', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N이/가 A-다 (관용 표현 구조)', 'Body part/N + 이/가 + A + 다', 'Most Korean body part idioms follow this structure: [body part] + [adjective] = figurative meaning.', '[{"korean":"그 사람은 발이 넓어서 모르는 사람이 없어요.","english":"That person has a wide network, so there''s no one they don''t know."},{"korean":"저 사람은 눈이 높아서 아무하고나 안 사귀어요.","english":"That person has high standards, so they don''t date just anyone."}]', 1),
    (l_id, 'V-다는 말이 있다', 'V/A + 다는 말이 있다', 'Used to explain the meaning of an idiom or proverb: "There is a saying that..."', '[{"korean":"한국어에는 ''발이 넓다''는 말이 있어요.","english":"In Korean, there is the expression ''to have wide feet.''"},{"korean":"이걸 두고 ''찬물을 끼얹다''는 말을 씁니다.","english":"For this, the expression ''to pour cold water'' is used."}]', 2),
    (l_id, 'N이/가 V-는 상황에 쓰인다', 'N + 이/가 V-는 상황에 쓰인다', 'Explains in which situation an idiom/expression is used.', '[{"korean":"마감이 급박할 때 ''발등에 불이 떨어졌다''고 해요.","english":"When a deadline is urgent, they say ''fire has fallen on my foot.''"},{"korean":"흥을 깨는 상황에서 ''찬물을 끼얹는다''고 합니다.","english":"When someone dampens the mood, they say ''they poured cold water.''"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '찬호', '''발이 넓다''는 표현 들어봤어요?', 'Bari neopda-neun pyohyeon deureobwasseoyo?', 'Have you heard the expression ''bali neopda'' (wide feet)?', 1),
    (l_id, '소피', '처음 들어봐요. 무슨 의미예요?', 'Cheoeum deureo-bwayo. Musun uimi-yeyo?', 'I''m hearing it for the first time. What does it mean?', 2),
    (l_id, '찬호', '아는 사람이 많다는 뜻이에요. 인맥이 넓은 사람을 두고 하는 말이죠.', 'Aneun saram-i manhdaneun tteut-ieyo. Inmae-gi neolbeun saram-eul deugo haneun maljyo.', 'It means knowing many people. It''s a phrase used for someone with a wide network.', 3),
    (l_id, '소피', '그럼 ''눈이 높다''는요?', 'Geureum ''nuni nopda''-neunyo?', 'Then what about ''high eyes''?', 4),
    (l_id, '찬호', '기준이 높다는 말이에요. 특히 이상형이 까다로운 사람한테 써요.', 'Gijun-i nopnaneun mal-ieyo. Teukhi isangnyeong-i kkadaro-un sarammhante sseoyo.', 'It means having high standards. It''s especially used for someone with a very picky ideal type.', 5),
    (l_id, '소피', '재미있네요! 한국어 관용 표현은 정말 다양하군요.', 'Jaemiinneyo! Hangugeo gwanyong pyohyeon-eun jeongmal dayangagunyo.', 'That''s interesting! Korean idiomatic expressions are really diverse.', 6),
    (l_id, '찬호', '맞아요. 관용 표현을 알면 한국인처럼 자연스럽게 말할 수 있어요.', 'Majayo. Gwanyong pyohyeon-eul almyeon Hanguginjcheoreom jayeonseureobge malhal su isseoyo.', 'That''s right. Knowing idiomatic expressions lets you speak naturally like a Korean.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '''발이 넓다''의 의미는?', '["to be a fast runner","to have a wide social network","to have big feet","to travel often"]', 1, '발이 넓다 (lit: wide feet) means having a wide social network.', 1),
    (l_id, '''눈이 높다''는 어떤 상황에 씁니까?', '["시력이 좋을 때","기준이 까다로울 때","눈물이 날 때","잠이 많을 때"]', 1, '눈이 높다 (lit: high eyes) means having high/demanding standards.', 2),
    (l_id, '''입이 무겁다''의 의미는?', '["to eat a lot","to be talkative","to be tight-lipped/secretive","to speak slowly"]', 2, '입이 무겁다 (lit: heavy mouth) means being discreet or tight-lipped.', 3),
    (l_id, '흥을 깨는 사람을 두고 뭐라고 합니까?', '["손이 크다","찬물을 끼얹는다","귀가 얇다","머리를 굴린다"]', 1, '찬물을 끼얹다 (pour cold water) means to dampen the mood.', 4),
    (l_id, '관용 표현의 특징은?', '["단어의 뜻을 직역하면 된다","비유적 의미가 있다","문법 규칙에 예외가 없다","공식적 상황에서만 쓴다"]', 1, 'Idioms have figurative meanings that cannot be understood by literal translation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '관용 표현은 단어의 뜻을 직역해서는 이해할 수 없는 표현입니다. 한국어에는 신체 부위를 활용한 관용 표현이 많습니다. ''발이 넓다'', ''눈이 높다'', ''손이 크다'', ''입이 무겁다'' 등이 대표적입니다. 이러한 표현들은 상황과 맥락에 따라 적절하게 사용해야 합니다. 관용 표현을 알면 한국인의 대화에서 더 자연스럽게 참여할 수 있습니다. 드라마나 영화에서도 관용 표현이 자주 등장하므로, 미디어를 통해 자연스럽게 익히는 것도 좋은 방법입니다.', 'Idiomatic expressions cannot be understood by literally translating the words. There are many idioms in Korean that use body parts. ''Bali neopda'' (wide feet), ''nuni nopda'' (high eyes), ''soni keuda'' (big hands), and ''ibi mugeopda'' (heavy mouth) are representative examples. These expressions should be used appropriately according to the situation and context. Knowing idioms allows for more natural participation in conversations with Koreans. Since idioms also frequently appear in dramas and films, learning them naturally through media is also a good method.', 1);
END $$;


-- ============================================================
-- Lesson 101: Formal Writing Conventions (공문서 작성)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 101;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=101 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '공문서', 'gongmunseo', 'official document', 1),
    (l_id, '신청서', 'sincheongseo', 'application form', 2),
    (l_id, '지원서', 'jiwonseo', 'application letter', 3),
    (l_id, '첨부하다', 'cheombu-hada', 'to attach', 4),
    (l_id, '수신', 'susin', 'recipient (in document)', 5),
    (l_id, '발신', 'balsin', 'sender (in document)', 6),
    (l_id, '제목', 'jemok', 'subject, title', 7),
    (l_id, '기안자', 'gian-ja', 'drafter (of a document)', 8),
    (l_id, '결재', 'gyeoljae', 'approval, authorization', 9),
    (l_id, '시행일', 'sihaengil', 'date of implementation', 10),
    (l_id, '붙임', 'buchim', 'attachment (in documents)', 11),
    (l_id, '아래와 같이', 'araewa gati', 'as follows below', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-음을 알려드립니다', 'V/A + 음을 알려드립니다', 'Formal announcement: "I hereby inform you that V/A." Used in official correspondence.', '[{"korean":"접수 기간이 마감됨을 알려드립니다.","english":"I hereby inform you that the application period has ended."},{"korean":"신청이 승인됐음을 알려드립니다.","english":"I hereby inform you that the application has been approved."}]', 1),
    (l_id, 'V-(으)시기 바랍니다', 'V + (으)시기 바랍니다', 'Very formal request: "Please do V." Used in official notices and documents.', '[{"korean":"서류를 첨부하시기 바랍니다.","english":"Please attach the documents."},{"korean":"기한 내에 제출하시기 바랍니다.","english":"Please submit within the deadline."}]', 2),
    (l_id, 'N에 관한 N', 'N1 + 에 관한 + N2', 'Formal expression: "N2 regarding/about N1." Common in document titles and formal writing.', '[{"korean":"장학금 신청에 관한 공고입니다.","english":"This is an announcement regarding scholarship applications."},{"korean":"업무 변경에 관한 안내입니다.","english":"This is a notice regarding work changes."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '직원', '이 신청서 작성 방법을 알려 드릴게요.', 'I sincheongseo jaksseong bangbeop-eul allyeo deurilgeyo.', 'I will tell you how to fill out this application form.', 1),
    (l_id, '신청자', '감사합니다. 어떻게 작성해야 해요?', 'Gamsahamnida. Eotteoke jaksseong-haeya haeyo?', 'Thank you. How should I fill it out?', 2),
    (l_id, '직원', '먼저 수신자와 발신자를 기입하시기 바랍니다. 제목란에는 신청 내용을 간략히 적어 주세요.', 'Meonjeo susinja-wa balsiinja-reul giip-asigi baraamnida. Jemok-ran-eneun sinceong naeyong-eul gallyakhi jeogeo juseyo.', 'First, please fill in the recipient and sender. In the subject field, please briefly write the application content.', 3),
    (l_id, '신청자', '서류 첨부는 어떻게 해요?', 'Seolyucheoambu-neun eotteoke haeyo?', 'How do I attach documents?', 4),
    (l_id, '직원', '문서 하단의 ''붙임'' 란에 첨부 서류 목록을 기재하시기 바랍니다.', 'Munseo hadan-ui ''buchim'' ran-e cheoambu seoryu moktok-eul gijae-asigi baraamnida.', 'Please list the attached documents in the ''Attachment'' section at the bottom of the document.', 5),
    (l_id, '신청자', '제출 기한이 언제예요?', 'Jechul gihan-i eonje-yeyo?', 'When is the submission deadline?', 6),
    (l_id, '직원', '이번 달 말일까지 제출하시기 바랍니다. 기한 내에 제출되지 않은 서류는 처리가 되지 않음을 알려드립니다.', 'Ibeon dal mal-il-kkaji jechul-asigi baraamnida. Gihan nae-e jechul-doedi anhaneun seoryu-neun cheolli-ga doedi anheumeu allyeo-deurimnida.', 'Please submit by the last day of this month. We hereby inform you that documents not submitted within the deadline will not be processed.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '서류를 첨부하___ 바랍니다. (formal request)', '["기를","시기","기도","면"]', 1, 'V-(으)시기 바랍니다 = formal "please do."', 1),
    (l_id, '접수가 마감됐___ 알려드립니다.', '["는 것을","음을","다고","라고"]', 1, 'V-음을 알려드립니다 = formal notification.', 2),
    (l_id, '장학금 신청___ 관한 공고입니다.', '["이","에","을","의"]', 1, 'N에 관한 N = N2 regarding N1.', 3),
    (l_id, '''붙임''은 공문서에서 무엇을 의미합니까?', '["subject","sender","attachment","date"]', 2, '붙임 means attachment in formal documents.', 4),
    (l_id, '공문서에서 적절한 어미는?', '["-아요/어요","-야","-다/습니다","-지요"]', 2, 'Formal documents use the plain -다 or formal -습니다 style.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '공문서는 공식적인 업무 처리를 위해 작성하는 문서입니다. 수신자, 발신자, 제목, 내용, 첨부 서류 등으로 구성됩니다. 공문서에서는 ''~하시기 바랍니다'', ''~을 알려드립니다'' 같은 격식 표현을 사용합니다. 내용은 간결하고 명확하게 작성해야 하며 불필요한 내용은 제외합니다. 한국 직장인이라면 공문서 작성 능력이 필수적입니다. 공문서는 법적 효력을 가지는 경우도 있으므로 정확하게 작성해야 합니다.', 'Official documents are written for the purpose of formal business processing. They consist of recipient, sender, subject, content, and attached documents. In official documents, formal expressions like ''~하시기 바랍니다'' and ''~을 알려드립니다'' are used. The content should be concise and clear, excluding unnecessary content. Document writing ability is essential for Korean working professionals. Since official documents sometimes have legal effect, they must be written accurately.', 1);
END $$;


-- ============================================================
-- Lesson 102: Debate Skills (토론 기술)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 102;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=102 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '토론', 'toron', 'debate, discussion', 1),
    (l_id, '찬성측', 'chanseong-cheuk', 'affirmative side', 2),
    (l_id, '반대측', 'bandae-cheuk', 'opposing side', 3),
    (l_id, '입론', 'immon', 'opening argument', 4),
    (l_id, '반론', 'ballon', 'rebuttal, counterargument', 5),
    (l_id, '청중', 'cheongjeung', 'audience', 6),
    (l_id, '논점', 'nonjeom', 'point of argument, issue', 7),
    (l_id, '합리적', 'hamnjeok', 'rational, reasonable', 8),
    (l_id, '이의를 제기하다', 'euirireul jegihada', 'to raise an objection', 9),
    (l_id, '동의하다', 'dong-uihada', 'to agree', 10),
    (l_id, '절충하다', 'jeolchunghada', 'to compromise', 11),
    (l_id, '결론을 도출하다', 'gyeollon-eul dochulhada', 'to derive a conclusion', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'V/A-다고 주장합니다', 'V/A clause + 다고 주장합니다', 'Formal assertion: "I assert/argue that V/A." Used in debates.', '[{"korean":"이 정책이 효과적이라고 주장합니다.","english":"I argue that this policy is effective."},{"korean":"재생에너지 확대가 필요하다고 주장합니다.","english":"I assert that expanding renewable energy is necessary."}]', 1),
    (l_id, 'V/A-다는 것은 사실이지만', 'V/A + 다는 것은 사실이지만', 'Acknowledges a point while introducing a counterargument: "It is true that V/A, but..."', '[{"korean":"비용이 높다는 것은 사실이지만 장기적으로는 이익이 됩니다.","english":"It is true that costs are high, but in the long term it becomes beneficial."},{"korean":"어렵다는 것은 사실이지만 불가능하지는 않습니다.","english":"It is true that it is difficult, but it is not impossible."}]', 2),
    (l_id, 'A/V-음에 비추어 볼 때', 'A/V + 음에 비추어 볼 때', 'Formal expression: "In light of V/A" or "Considering V/A." Used in formal debate.', '[{"korean":"현 상황에 비추어 볼 때 즉각적 조치가 필요합니다.","english":"In light of the current situation, immediate action is necessary."},{"korean":"통계에 비추어 볼 때 이 주장은 타당합니다.","english":"In light of statistics, this argument is valid."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '사회자', '오늘의 토론 주제는 ''인터넷 실명제 도입''에 찬성하는지 반대하는지입니다. 먼저 찬성측 입론 부탁드립니다.', 'Oneul-ui toron jujeoneun ''inteonet sillyeongje doib''-e chanseong-aneun-ji bandae-aneun-ji-imnida. Meonjeo chanseong-cheuk immon butakdeurimnida.', 'Today''s debate topic is whether you agree or disagree with ''internet real-name system implementation.'' Please begin with the affirmative opening argument.', 1),
    (l_id, '찬성측', '저희는 인터넷 실명제 도입에 찬성합니다. 익명성으로 인한 사이버 폭력과 허위 정보 확산을 막을 수 있다고 주장합니다.', 'Jeohui-neun inteonet sillyeongje doib-e chanseong-hamnida. Ingmyeongseong-euro inhan saibeo pokyeok-gwa hoeui jeongbo hwaksan-eul mageul su itdago jujang-hamnida.', 'We are in favor of the real-name system implementation. We assert that it can prevent cyberbullying and the spread of false information caused by anonymity.', 2),
    (l_id, '반대측', '이의를 제기합니다. 비용이 높다는 것은 사실이지만, 개인 표현의 자유를 침해할 수 있다는 점을 간과해서는 안 됩니다.', 'Euirireul jegihamnida. Biyong-i nopnaneun geoseun sasisijiman, gaein pyohyeon-ui jayureul chimhaehal su itdaneun jeomeul gangwahae-seo-neun an doeamnida.', 'I raise an objection. While the costs being high is a fact, the point that it may infringe on individual freedom of expression must not be overlooked.', 3),
    (l_id, '찬성측', '현 상황에 비추어 볼 때 온라인 폭력의 심각성은 개인 자유 침해 우려를 앞섭니다.', 'Hyeon sanghwang-e bichuweo bol ttae onrein pokyeok-ui simgakseong-eun gaein jaeyu chimhae uryo-reul apseumnida.', 'In light of the current situation, the seriousness of online violence outweighs concerns about infringing personal freedom.', 4),
    (l_id, '사회자', '양측 모두 논리적인 주장을 해 주셨습니다. 결론 도출을 위해 청중 의견을 들어볼까요?', 'Yangtcheuk modu nonlijeok-in jujang-eul hae jusyeotsseumnida. Gyeollon dochul-eul wihae cheongjeung uigyeon-eul deureobolkkayo?', 'Both sides have made logical arguments. Shall we hear the audience''s opinions to derive a conclusion?', 5);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '이 정책이 효과적이___ 주장합니다.', '["다고","라고","면서","지만"]', 0, 'V/A-다고 주장합니다 = I argue that.', 1),
    (l_id, '비용이 높다는 것은 사실이___, 장기적으로는 이익이 됩니다.', '["서","지만","고","면서"]', 1, '-다는 것은 사실이지만 = it''s true that..., but.', 2),
    (l_id, '현 상황___ 비추어 볼 때 조치가 필요합니다.', '["을","에","이","을로"]', 1, 'N에 비추어 볼 때 = in light of N.', 3),
    (l_id, '''이의를 제기하다''의 의미는?', '["to agree","to conclude","to raise an objection","to compromise"]', 2, '이의를 제기하다 = to raise an objection.', 4),
    (l_id, '토론에서 반론의 역할은?', '["자신의 주장만 강조","상대방 주장의 약점을 지적","청중을 무시","결론을 피함"]', 1, 'A rebuttal (반론) points out weaknesses in the opponent''s argument.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '토론은 어떤 주제에 대해 찬성과 반대 입장에서 논리적으로 의견을 나누는 활동입니다. 효과적인 토론을 위해서는 명확한 주장, 충분한 근거, 그리고 상대방의 논점에 대한 적절한 반론이 필요합니다. 한국어 토론에서는 ''다고 주장합니다'', ''다는 것은 사실이지만'' 같은 격식 표현을 사용합니다. 상대방의 주장을 인정하면서도 자신의 입장을 유지하는 능력이 중요합니다. 토론은 비판적 사고력과 의사소통 능력을 향상시키는 중요한 활동입니다.', 'Debate is an activity of logically exchanging opinions from affirmative and opposing positions on a given topic. For effective debate, a clear claim, sufficient evidence, and an appropriate rebuttal to the opponent''s points are needed. In Korean debates, formal expressions like ''다고 주장합니다'' and ''다는 것은 사실이지만'' are used. The ability to acknowledge the opponent''s argument while maintaining your own position is important. Debate is an important activity that improves critical thinking and communication skills.', 1);
END $$;

-- ============================================================
-- Lesson 103: Korean History Language (역사 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 103;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=103 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '역사', 'yeoksa', 'history', 1),
    (l_id, '왕조', 'wangjo', 'dynasty', 2),
    (l_id, '고려', 'Goryeo', 'Goryeo dynasty (918-1392)', 3),
    (l_id, '조선', 'Joseon', 'Joseon dynasty (1392-1910)', 4),
    (l_id, '일제강점기', 'ilje gangjeongi', 'Japanese colonial period', 5),
    (l_id, '광복', 'gwangbok', 'liberation (August 15, 1945)', 6),
    (l_id, '전쟁', 'jeonjaeng', 'war', 7),
    (l_id, '문화재', 'munhwajae', 'cultural heritage asset', 8),
    (l_id, '유물', 'yumul', 'artifact, relic', 9),
    (l_id, '건국하다', 'geonguk-ada', 'to found a nation', 10),
    (l_id, '독립', 'dongip', 'independence', 11),
    (l_id, '민주주의', 'minjujuui', 'democracy', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 의해 V-(으)었/았다', 'N + 에 의해 + V (passive past)', 'Formal passive expression used in historical writing: "was done by N."', '[{"korean":"한글은 세종대왕에 의해 창제되었다.","english":"Hangul was created by King Sejong."},{"korean":"조선은 이성계에 의해 건국되었다.","english":"Joseon was founded by Yi Seonggye."}]', 1),
    (l_id, 'N이/가 V-(으)ㄴ 지 N년이 지났다', 'N + 이/가 + V + 지 + N년이 지났다', 'Expresses time elapsed since an event: "N years have passed since N V-ed."', '[{"korean":"광복이 된 지 80여 년이 지났다.","english":"About 80 years have passed since liberation."},{"korean":"한국 전쟁이 끝난 지 70년이 넘었다.","english":"More than 70 years have passed since the Korean War ended."}]', 2),
    (l_id, 'V/A-(으)ㄴ 것으로 추정된다', 'V/A + (으)ㄴ 것으로 추정된다', 'Formal expression: "It is estimated/assumed that V/A." Used in historical and academic contexts.', '[{"korean":"이 유물은 고려 시대의 것으로 추정된다.","english":"This artifact is estimated to be from the Goryeo period."},{"korean":"당시 인구는 100만 명 이상인 것으로 추정된다.","english":"The population at the time is estimated to have been over one million."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생', '한국 역사에서 가장 중요한 사건이 무엇이에요?', 'Hanguk yeoksa-eseo gajang jungyohan sageon-i mueosi-eyo?', 'What is the most important event in Korean history?', 1),
    (l_id, '교수', '여러 가지가 있지만, 한글 창제와 일제강점기로부터의 광복을 꼽을 수 있어요.', 'Yeoreo gaji-ga itjiman, hangeul changjae-wa ilje gangjeongi-robuto-ui gwangbog-eul kkobeul su isseoyo.', 'There are various events, but we can mention the creation of Hangul and liberation from the Japanese colonial period.', 2),
    (l_id, '학생', '한글은 누가 만들었어요?', 'Hangeul-eun nuga mandeuleosseoyo?', 'Who made Hangul?', 3),
    (l_id, '교수', '한글은 15세기에 세종대왕에 의해 창제되었어요. 세종대왕은 백성들이 쉽게 글을 읽고 쓸 수 있도록 훈민정음을 만들었어요.', 'Hangeul-eun 15-segi-e Sejong daewang-e uihae changjae-doe-eosseoyo. Sejong daewang-eun baekseongdeul-i swipge geul-eul ikgo sseul su itdorok hunminjeongeum-eul mandeuleosseoyo.', 'Hangul was created by King Sejong in the 15th century. King Sejong created Hunminjeongeum so that the people could easily read and write.', 4),
    (l_id, '학생', '조선 시대는 언제까지였어요?', 'Joseon sidae-neun eonje-kkaji-yeosseoyo?', 'Until when was the Joseon dynasty?', 5),
    (l_id, '교수', '조선은 1392년에 이성계에 의해 건국되어 1910년 일제 강점기가 시작될 때까지 약 500년간 지속되었어요.', 'Joseon-eun 1392-nyeon-e Yi Seong-gye-e uihae geonguk-doeyeo 1910-nyeon ilje gangjeongi-ga sijakdoel ttekkaji yak 500-nyeongan jisok-doeeoosseoyo.', 'Joseon was founded by Yi Seonggye in 1392 and lasted about 500 years until the Japanese colonial period began in 1910.', 6),
    (l_id, '학생', '1945년에 광복이 됐고, 그 이후 대한민국이 수립되었군요.', '1945-nyeon-e gwangbogi dwaeotgo, geu ihu Daehan-minguk-i suripdoe-eossgunyo.', 'Korea was liberated in 1945, and after that the Republic of Korea was established.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한글은 세종대왕___ 창제되었다.', '["이","에 의해","에서","에게"]', 1, 'N에 의해 + passive V = was done by N.', 1),
    (l_id, '이 유물은 고려 시대의 것___ 추정된다.', '["으로","이라고","이기","다고"]', 0, 'V-(으)ㄴ 것으로 추정된다 = it is estimated to be.', 2),
    (l_id, '조선은 이성계에 의해 ___ 되었다.', '["건국","발견","붕괴","탄생"]', 0, '건국하다 = to found a nation.', 3),
    (l_id, '광복은 언제입니까?', '["1910년 8월 15일","1919년 3월 1일","1945년 8월 15일","1950년 6월 25일"]', 2, '광복 (liberation from Japanese rule) was on August 15, 1945.', 4),
    (l_id, '조선 시대가 시작된 연도는?', '["918년","1392년","1910년","1945년"]', 1, 'The Joseon dynasty was founded in 1392.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 수천 년의 역사를 가진 나라입니다. 고구려, 백제, 신라 삼국 시대를 거쳐 고려와 조선 왕조가 이어졌습니다. 15세기 세종대왕은 한글을 창제하여 한국 문화 발전에 크게 기여했습니다. 1910년 일본의 강제 병합으로 일제강점기가 시작되었고, 1945년 8월 15일 광복을 맞이했습니다. 6·25 전쟁(한국전쟁) 후 한국은 빠른 경제 발전을 이루어 ''한강의 기적''이라 불리게 됩니다. 현재 한국은 세계적인 경제 대국이자 문화 강국으로 자리 잡았습니다.', 'Korea is a country with thousands of years of history. Following the Three Kingdoms period of Goguryeo, Baekje, and Silla, the Goryeo and Joseon dynasties followed. In the 15th century, King Sejong created Hangul, greatly contributing to the development of Korean culture. In 1910, Japan forcibly annexed Korea, starting the Japanese colonial period, and liberation came on August 15, 1945. After the Korean War (6.25 War), Korea achieved rapid economic development and came to be called the ''Miracle of the Han River.'' Today, Korea has established itself as a global economic power and cultural powerhouse.', 1);
END $$;


-- ============================================================
-- Lesson 104: Newspaper Korean (신문 한국어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 104;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=104 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '사설', 'sasel', 'editorial', 1),
    (l_id, '칼럼', 'kalleom', 'column (opinion piece)', 2),
    (l_id, '취재원', 'chwiaewon', 'source (news)', 3),
    (l_id, '특종', 'teukjong', 'scoop (exclusive news)', 4),
    (l_id, '특파원', 'teukpawon', 'correspondent', 5),
    (l_id, '논평하다', 'nonpyeonghada', 'to comment, to review', 6),
    (l_id, '요약하다', 'yoyakhada', 'to summarize', 7),
    (l_id, '인용구', 'inyonggu', 'quotation', 8),
    (l_id, '리드', 'rideu', 'lead paragraph (news)', 9),
    (l_id, '객관성', 'gaekgwanseong', 'objectivity', 10),
    (l_id, '편견', 'pyeongyeon', 'bias', 11),
    (l_id, '검증하다', 'geomjeunghada', 'to verify, to validate', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N에 따르면 ~ 인 것으로 전해졌다', 'N에 따르면 + clause + 인 것으로 전해졌다', 'Combined news reporting structure: "According to N, it was reported that..."', '[{"korean":"경찰에 따르면 용의자가 검거된 것으로 전해졌다.","english":"According to police, it was reported that the suspect was arrested."},{"korean":"관계자에 따르면 협의가 진행 중인 것으로 전해졌다.","english":"According to officials, it was reported that consultations are ongoing."}]', 1),
    (l_id, 'V-(으)ㄴ 것으로 나타났다', 'V + (으)ㄴ 것으로 나타났다', 'News expression: "it appeared/was found that V." Used when citing research or surveys.', '[{"korean":"조사 결과 20대 취업률이 감소한 것으로 나타났다.","english":"Survey results showed that employment rates for those in their 20s decreased."},{"korean":"응답자의 70%가 찬성한 것으로 나타났다.","english":"It was found that 70% of respondents were in favor."}]', 2),
    (l_id, 'A/V-다며 논란이 되다', 'A/V + 다며 논란이 되다', 'Expresses a controversy: "there is controversy claiming that A/V."', '[{"korean":"이 발언이 차별적이라며 논란이 됐다.","english":"There was controversy claiming this remark was discriminatory."},{"korean":"그 정책이 부적절하다며 논란이 일었다.","english":"A controversy arose claiming the policy was inappropriate."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '기자1', '오늘 헤드라인 기사 어떻게 쓸 거예요?', 'Oneul hedeurain gisa eotteoke sseul geoyeyo?', 'How will you write today''s headline article?', 1),
    (l_id, '기자2', '정부 발표에 따르면 경제성장률이 예상을 웃도는 것으로 나타났는데, 이 내용으로 리드를 잡을 거예요.', 'Jeongbu balpyo-e ttareumyeon gyeongje-seongjang-nyul-i yeang-eul udtoneun geosro natanannneunde, i naeyong-euro rideu-reul jabeul geoyeyo.', 'According to the government announcement, it appeared that the economic growth rate exceeded expectations, so I''ll lead with that.', 2),
    (l_id, '기자1', '인용은 어떻게 처리할 거예요?', 'Inyong-eun eotteoke cheolli-hal geoyeyo?', 'How will you handle quotations?', 3),
    (l_id, '기자2', '기획재정부 장관의 발언을 직접 인용하고 전문가 논평도 추가할 거예요.', 'Gihoek-jaejeongbu jangwang-ui baleon-eul jikjeop inyong-ago jeonmungas nonpyeong-do chuga-hal geoyeyo.', 'I''ll directly quote the Minister of Economy and Finance''s remarks and add expert commentary too.', 4),
    (l_id, '기자1', '반론도 다뤄야 하지 않나요? 객관성이 중요하니까요.', 'Ballon-do dalwooya haji annayo? Gaekgwanseong-i jungyohanikayo.', 'Shouldn''t we cover counterarguments too? Objectivity is important.', 5),
    (l_id, '기자2', '맞아요. 일부 경제학자들은 성장이 지속가능하지 않다며 논란이 있다는 것도 언급할게요.', 'Majayo. Ilbu gyeongjehakjadeul-eun seongjang-i jisokganeunghaji ant-amyeo nollan-i itdaneun geotdo eon-geuphalgeyo.', 'Right. I''ll also mention that some economists are raising controversy claiming the growth is not sustainable.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '조사 결과 취업률이 감소한 것___ 나타났다.', '["에","으로","이","을"]', 1, 'V-(으)ㄴ 것으로 나타났다 = it was found/appeared that.', 1),
    (l_id, '경찰에 따르면 용의자가 검거된 것으로 ___. (news form)', '["나타났다","알려졌다","전해졌다","보였다"]', 2, '전해졌다 = was reported/conveyed (news reporting form).', 2),
    (l_id, '그 발언이 차별적이___ 논란이 됐다.', '["다며","다고","라며","면서"]', 0, 'A/V-다며 논란이 되다 = controversy arose claiming that.', 3),
    (l_id, '''사설''의 의미는?', '["news scoop","editorial","correspondent","quotation"]', 1, '사설 = editorial (opinion piece in a newspaper).', 4),
    (l_id, '좋은 신문 기사의 조건이 아닌 것은?', '["객관성","사실 검증","다양한 관점","기자의 주관적 의견만 반영"]', 3, 'Reflecting only the journalist''s subjective opinion goes against the principles of good journalism.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '신문 한국어는 일상 언어와 구별되는 특별한 문체를 사용합니다. 신문 기사의 제목은 짧고 강렬하며 핵심 정보를 전달합니다. 기사 본문에서는 ''에 따르면'', ''것으로 전해졌다'', ''것으로 나타났다'' 등의 표현을 자주 사용합니다. 좋은 신문 기사는 사실에 근거하고 객관적이어야 합니다. 다양한 관점과 전문가 의견을 포함하는 것이 균형 잡힌 보도의 기본입니다. 한국어 신문을 꾸준히 읽으면 어휘력과 사회 현안에 대한 이해도를 높일 수 있습니다.', 'Newspaper Korean uses a special style that is distinguished from everyday language. Newspaper article titles are short, impactful, and convey key information. In article bodies, expressions like ''에 따르면'' (according to), ''것으로 전해졌다'' (was reported that), and ''것으로 나타났다'' (was found that) are frequently used. Good newspaper articles must be based on facts and be objective. Including various perspectives and expert opinions is fundamental to balanced reporting. Consistently reading Korean newspapers can improve vocabulary and understanding of current social issues.', 1);
END $$;


-- ============================================================
-- Lesson 105: Complex Grammar Revision (복잡한 문법 복습)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 105;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=105 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '복습', 'bokseup', 'review', 1),
    (l_id, '정리하다', 'jeonglihada', 'to organize, to summarize', 2),
    (l_id, '확인하다', 'hwagin-hada', 'to confirm, to check', 3),
    (l_id, '혼동하다', 'hondong-hada', 'to confuse, to mix up', 4),
    (l_id, '구별하다', 'gubyeolhada', 'to distinguish', 5),
    (l_id, '쓰임새', 'sseumssae', 'usage', 6),
    (l_id, '차이점', 'chaijeom', 'difference, distinction', 7),
    (l_id, '공통점', 'gongtongjeom', 'commonality', 8),
    (l_id, '응용하다', 'eung-yonghada', 'to apply', 9),
    (l_id, '핵심', 'haeksim', 'core, key point', 10),
    (l_id, '오류', 'oryu', 'error, mistake', 11),
    (l_id, '교정하다', 'gyojeonghada', 'to correct', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, '-는 바람에 (unexpected cause)', 'V + 는 바람에', 'Expresses an unexpected or undesirable cause: "because of unexpectedly V-ing." More emphatic than -아서/어서.', '[{"korean":"버스를 놓치는 바람에 지각했어요.","english":"Because I missed the bus, I was late."},{"korean":"갑자기 비가 오는 바람에 옷이 다 젖었어요.","english":"Because it suddenly rained, my clothes got completely wet."}]', 1),
    (l_id, '-(으)ㄹ 텐데 (expectation/concern)', 'V/A + (으)ㄹ 텐데', 'Expresses an expected situation with some concern or implication: "must be..., I expect."', '[{"korean":"지금 바쁠 텐데 괜찮아요?","english":"You must be busy now — are you okay?"},{"korean":"많이 피곤할 텐데 쉬세요.","english":"You must be very tired — please rest."}]', 2),
    (l_id, 'V-(으)ㄹ 수밖에 없다', 'V stem + (으)ㄹ 수밖에 없다', 'Means "have no choice but to V" or "can''t help but V."', '[{"korean":"그 상황에서는 포기할 수밖에 없었어요.","english":"In that situation, I had no choice but to give up."},{"korean":"이 음식이 너무 맛있어서 먹을 수밖에 없어요.","english":"This food is so delicious I can''t help but eat it."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생', '오늘 복잡한 문법 패턴을 복습하고 싶어요.', 'Oneul bokjaphan munbeop paeteon-eul bokseup ago sipeoyo.', 'I want to review complex grammar patterns today.', 1),
    (l_id, '교사', '좋아요. 오늘은 ''는 바람에'', ''ㄹ 텐데'', ''ㄹ 수밖에 없다''를 정리해 봐요.', 'Joayo. Oneul-eun ''neun barame'', ''l tende'', ''l subakke eopda''-reul jeonglihae bwayo.', 'Good. Today let''s organize ''because of unexpectedly,'' ''must be,'' and ''have no choice but.''', 2),
    (l_id, '학생', '''는 바람에''는 어떻게 써요?', '''Neun barame''-neun eotteoke sseoyo?', 'How do you use ''because of unexpectedly''?', 3),
    (l_id, '교사', '예기치 않은 원인으로 나쁜 결과가 생겼을 때 써요. ''버스를 놓치는 바람에 늦었어요''처럼요.', 'Yegijianhneun wonin-euro nabbeun gyeolgwa-ga saenggyeosseul ttae sseoyo. ''Beoseu-reul nochineun barame neujeosseoyo''-cheoreomyo.', 'It''s used when an unexpected cause leads to a bad result. Like ''I was late because I unexpectedly missed the bus.''', 4),
    (l_id, '학생', '그럼 ''ㄹ 수밖에 없다''는요?', 'Geureum ''l subakke eopda''-neunyo?', 'Then what about ''have no choice but''?', 5),
    (l_id, '교사', '다른 선택이 없어서 그것만 할 수 있는 상황을 표현해요. ''선택의 여지가 없다''는 의미죠.', 'Dareun seon-taek-i eobseoseo geugeotman hal su inneun sanghwang-eul pyohyeonhaeyo. ''Seon-taek-ui yeoji-ga eopda''neun uimijyo.', 'It expresses a situation where there are no other choices and you can only do that. It means ''there is no room for choice.''', 6),
    (l_id, '학생', '정말 유용한 패턴들이네요. 잘 정리됐어요!', 'Jeongmal yuyonghan paeteondeul-ineyo. Jal jeonglidwaesseoyo!', 'These are really useful patterns. Well organized!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '버스를 놓치___ 지각했어요. (unexpected cause)', '["아서","는 바람에","면","지만"]', 1, '-는 바람에 = because of unexpectedly doing (negative result).', 1),
    (l_id, '지금 많이 피곤할 ___, 쉬세요.', '["텐데","수 있어요","것 같아요","줄 알아요"]', 0, '-(으)ㄹ 텐데 = must be (expressing expectation/concern).', 2),
    (l_id, '그 상황에서는 포기할 수___ 없었어요.', '["밖에","뿐","밖은","만"]', 0, '-(으)ㄹ 수밖에 없다 = have no choice but to.', 3),
    (l_id, '''-는 바람에''는 주로 어떤 결과와 함께 쓰입니까?', '["긍정적 결과","부정적/예상치 못한 결과","중립적 결과","미래 결과"]', 1, '-는 바람에 typically precedes an unexpected negative result.', 4),
    (l_id, '''선택의 여지가 없다''와 의미가 같은 표현은?', '["할 수 있다","해야 할 것 같다","할 수밖에 없다","하고 싶다"]', 2, '할 수밖에 없다 = have no choice but to (no alternative).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '복잡한 문법 패턴을 정확하게 사용하려면 각 패턴의 뉘앙스를 이해해야 합니다. ''-는 바람에''는 예상치 못한 나쁜 원인을 나타내므로 긍정적 결과에는 쓰지 않습니다. ''-(으)ㄹ 텐데''는 화자의 추측과 배려를 동시에 표현합니다. ''-(으)ㄹ 수밖에 없다''는 강한 불가피성을 나타냅니다. 이러한 고급 문법 패턴들을 자연스럽게 구사할 수 있다면 한국어 수준이 한 단계 높아졌다고 할 수 있습니다. 꾸준한 연습과 다양한 예문을 통해 자신의 것으로 만드는 것이 중요합니다.', 'To use complex grammar patterns accurately, you must understand the nuance of each pattern. -는 바람에 indicates an unexpected bad cause, so it is not used with positive results. -(으)ㄹ 텐데 simultaneously expresses the speaker''s conjecture and consideration. -(으)ㄹ 수밖에 없다 indicates strong inevitability. If you can use these advanced grammar patterns naturally, you can say your Korean level has risen by one step. It is important to make them your own through consistent practice and exposure to various example sentences.', 1);
END $$;

-- ============================================================
-- Lesson 106: Literature Appreciation (문학 감상)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 106;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=106 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '문학', 'munhak', 'literature', 1),
    (l_id, '소설', 'soseol', 'novel', 2),
    (l_id, '시', 'si', 'poem, poetry', 3),
    (l_id, '수필', 'supil', 'essay (literary)', 4),
    (l_id, '주인공', 'juingong', 'main character', 5),
    (l_id, '배경', 'baegyeong', 'setting, background', 6),
    (l_id, '주제', 'juje', 'theme', 7),
    (l_id, '상징', 'sangjing', 'symbol', 8),
    (l_id, '서사', 'seosa', 'narrative', 9),
    (l_id, '묘사하다', 'myosahada', 'to describe, to depict', 10),
    (l_id, '함축적', 'hamchukjeok', 'implicit, connotative', 11),
    (l_id, '감동받다', 'gamdong-batda', 'to be moved/touched', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'N은/는 N을/를 상징한다', 'N1 + 은/는 + N2 + 를 상징한다', 'Formal expression of literary symbolism: "N1 symbolizes N2."', '[{"korean":"이 소설에서 비는 슬픔을 상징한다.","english":"In this novel, rain symbolizes sorrow."},{"korean":"흰 비둘기는 평화를 상징한다.","english":"A white dove symbolizes peace."}]', 1),
    (l_id, 'V/A-다고 할 수 있다 (문학 분석)', 'V/A + 다고 할 수 있다', 'Used in literary analysis: "it can be said that V/A."', '[{"korean":"이 작품은 인간의 욕망을 탐구한다고 할 수 있다.","english":"It can be said that this work explores human desire."},{"korean":"이 시는 자연과 인간의 관계를 노래한다고 할 수 있다.","english":"It can be said that this poem sings of the relationship between nature and humans."}]', 2),
    (l_id, 'N에 나타난 N', 'N1 + 에 나타난 + N2', 'Expresses what appears or is manifested in a literary work: "N2 as manifested in N1."', '[{"korean":"이 소설에 나타난 사회 비판은 강렬하다.","english":"The social criticism manifested in this novel is intense."},{"korean":"시에 나타난 감정의 깊이가 인상적이다.","english":"The depth of emotion manifested in the poem is impressive."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '독서 모임', '이번 달 읽은 소설 어떠셨어요?', 'Ibeon dal ilgeun soseol eotteosey-eosseoyo?', 'How was the novel you read this month?', 1),
    (l_id, '회원1', '정말 감동적이었어요. 주인공의 성장 과정이 인상적이었어요.', 'Jeongmal gamdongjeog-ieosseoyo. Juingong-ui seongjang gwajeon-i insangjeog-ieosseoyo.', 'It was really moving. The main character''s growth process was impressive.', 2),
    (l_id, '회원2', '이 소설에 나타난 사회적 메시지도 강렬했어요. 계층 갈등을 잘 표현했다고 생각해요.', 'I soseol-e natanan sahoejeok mesiji-do gangnyeolhaesseoyo. Gyecheung galdeung-eul jal pyohyeonhaessdago saenggakaeyo.', 'The social message manifested in this novel was also intense. I think it expressed class conflict well.', 3),
    (l_id, '회원1', '맞아요. 비가 자주 등장하는데, 이 소설에서 비는 변화를 상징한다고 할 수 있어요.', 'Majayo. Biga jaju deungjang-aneunde, i soseol-eseo bi-neun byeonhwa-reul sangjiinganda-go hal su isseoyo.', 'Right. Rain appears frequently, and in this novel, rain can be said to symbolize change.', 4),
    (l_id, '회원2', '문학 작품을 읽으면 한국어 어휘도 늘고 표현력도 좋아지는 것 같아요.', 'Munhak jakpum-eul ilgeumyeon Hangugeo eohwi-do neulgo pyohyeonnyeok-do joajineun geot gatayo.', 'Reading literary works seems to expand Korean vocabulary and improve expressive ability too.', 5),
    (l_id, '회원1', '맞아요. 문학을 통해 언어와 문화를 동시에 배울 수 있어요.', 'Majayo. Munhak-eul tonghae eoneo-wa munhwa-reul dongsi-e baeul su isseoyo.', 'Right. Through literature, you can learn both language and culture simultaneously.', 6);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '이 소설에서 비는 슬픔을 ___. (symbolizes)', '["상징한다","의미한다","묘사한다","나타낸다"]', 0, '상징하다 = to symbolize.', 1),
    (l_id, '이 작품은 인간의 욕망을 탐구한다___ 할 수 있다.', '["고","라고","다고","면서"]', 2, 'A/V-다고 할 수 있다 = it can be said that.', 2),
    (l_id, '이 소설___ 나타난 사회 비판이 강렬하다.', '["에서","에","으로","이"]', 1, 'N에 나타난 N = N as manifested in N.', 3),
    (l_id, '''주인공''의 의미는?', '["setting","theme","main character","symbol"]', 2, '주인공 = main character.', 4),
    (l_id, '문학 감상의 요소가 아닌 것은?', '["주제 분석","상징 이해","등장인물 파악","문법 오류 세기"]', 3, 'Counting grammar errors is not part of literary appreciation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국 문학은 삼국 시대부터 현대까지 다양하게 발전해 왔습니다. 이광수, 김소월, 윤동주, 박경리 등이 한국 문학의 대표적인 작가와 시인입니다. 문학 작품은 시대와 사회를 반영하며 인간의 보편적 감정을 표현합니다. 소설을 읽으면 자연스럽게 어휘력이 향상되고 문화적 이해도 깊어집니다. 시는 함축적인 언어를 사용하여 감정과 사상을 표현합니다. 한국어 학습자에게 한국 현대 소설이나 시를 읽는 것을 강력히 추천합니다.', 'Korean literature has developed diversely from the Three Kingdoms period to the present. Yi Gwangsu, Kim Sowol, Yoon Dong-ju, and Park Kyongni are representative authors and poets of Korean literature. Literary works reflect the era and society and express universal human emotions. Reading novels naturally improves vocabulary and deepens cultural understanding. Poetry uses implicit language to express emotions and ideas. It is strongly recommended for Korean language learners to read modern Korean novels or poetry.', 1);
END $$;


-- ============================================================
-- Lesson 107: Speech Patterns and Rhetoric (수사법)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 107;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=107 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '수사법', 'susabeop', 'rhetoric, rhetorical device', 1),
    (l_id, '은유', 'eunyu', 'metaphor', 2),
    (l_id, '직유', 'jigu', 'simile', 3),
    (l_id, '의인법', 'uiinbeop', 'personification', 4),
    (l_id, '반복', 'banbog', 'repetition', 5),
    (l_id, '과장', 'gwajang', 'exaggeration, hyperbole', 6),
    (l_id, '역설', 'yeokseol', 'paradox', 7),
    (l_id, '반어법', 'baneo-beop', 'irony', 8),
    (l_id, '강조하다', 'gangjohada', 'to emphasize', 9),
    (l_id, '생동감', 'saengdonggam', 'vividness, life', 10),
    (l_id, '설득력', 'seoldeungyeok', 'persuasiveness', 11),
    (l_id, '문체', 'muncheae', 'writing/speaking style', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, '직유: N처럼/같이 A', 'N + 처럼 / 같이 + A', 'Simile: comparison using ''like'' or ''as.'' N처럼/같이 introduces the comparison.', '[{"korean":"그는 사자처럼 용감하다.","english":"He is as brave as a lion."},{"korean":"시간이 화살같이 빠르다.","english":"Time is fast like an arrow."}]', 1),
    (l_id, '은유: N이/가 N이다', 'N1 + 이/가 + N2 + 이다', 'Metaphor: directly states that N1 is N2 without using ''like.''', '[{"korean":"인생은 여행이다.","english":"Life is a journey."},{"korean":"그녀의 목소리는 음악이었다.","english":"Her voice was music."}]', 2),
    (l_id, '의인법: 사물이 V/A (인간처럼)', 'Inanimate N + V/A (as if human)', 'Personification: giving human qualities or actions to non-human things.', '[{"korean":"꽃들이 미소 짓고 있었다.","english":"The flowers were smiling."},{"korean":"바람이 속삭였다.","english":"The wind whispered."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '교수', '오늘은 한국 문학에서 자주 쓰이는 수사법에 대해 배워 봅시다.', 'Oneul-eun Hanguk munhak-eseo jaju sseuineun susabeop-e daehae baewo bopsida.', 'Today let''s learn about rhetorical devices frequently used in Korean literature.', 1),
    (l_id, '학생', '은유와 직유의 차이가 뭐예요?', 'Eunyu-wa jigu-ui chai-ga mwoyeyo?', 'What is the difference between metaphor and simile?', 2),
    (l_id, '교수', '직유는 ''처럼''이나 ''같이''를 사용해서 두 사물을 비교해요. ''그는 사자처럼 용감하다''처럼요. 은유는 비교 표현 없이 직접 ''A는 B다''라고 해요.', 'Jigu-neun ''cheoreom''ina ''gachi''-reul sayong-haeseo du samul-eul bigyohaeyo. ''Geuneun sajacheoreom yongamaada''cheoreomyo. Eunyu-neun bigyo pyohyeon eobsi jikjeop ''A-neun B-da''-rago haeyo.', 'Simile uses ''cheoreom'' or ''gachi'' to compare two things, like ''He is as brave as a lion.'' Metaphor directly says ''A is B'' without comparative words.', 3),
    (l_id, '학생', '의인법은요?', 'Uiinbeop-eunyo?', 'What about personification?', 4),
    (l_id, '교수', '사물에 인간의 행동이나 감정을 부여하는 거예요. ''꽃들이 미소 짓는다''처럼 꽃이 인간처럼 행동하는 것으로 표현하는 거죠.', 'Samul-e ingan-ui haengdong-ina gamjeong-eul bunyeo-haneun geoyeyo. ''Kkotdeuli miso jitneunda''cheoreom kkoti ingancheoreom haengdong-aneun geosro pyohyeon-aneun geojyo.', 'It''s giving human actions or emotions to objects. Like ''the flowers are smiling'' — expressing flowers as if they act like humans.', 5),
    (l_id, '학생', '수사법을 쓰면 왜 더 좋아요?', 'Susabeop-eul sseumyeon wae deo joayo?', 'Why is it better to use rhetorical devices?', 6),
    (l_id, '교수', '표현이 더 생동감 있고 독자에게 강한 인상을 남길 수 있어요. 설득력도 높아지고요.', 'Pyohyeon-i deo saengdonggam itgo dokja-ege ganghan insang-eul namgil su isseoyo. Seoldeungyeok-do nopajigo-yo.', 'The expression becomes more vivid and can leave a strong impression on the reader. Persuasiveness also increases.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '그는 사자___ 용감하다. (simile)', '["이","처럼","같은","의"]', 1, '처럼 = like, as (simile marker).', 1),
    (l_id, '인생은 여행___. (metaphor)', '["처럼 좋다","이다","같이 빠르다","처럼 보인다"]', 1, 'N이/가 N이다 = metaphor structure.', 2),
    (l_id, '꽃들이 미소 ___. (personification)', '["처럼","을 닮았다","짓고 있었다","를 피웠다"]', 2, 'Giving flowers the human action of smiling = personification.', 3),
    (l_id, '''은유''의 의미는?', '["simile","metaphor","personification","repetition"]', 1, '은유 = metaphor.', 4),
    (l_id, '수사법의 효과가 아닌 것은?', '["생동감","설득력","강조","문법 오류 감소"]', 3, 'Rhetorical devices increase vividness, persuasiveness, and emphasis — not grammar correctness.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '수사법은 언어를 더 풍부하고 효과적으로 만드는 기술입니다. 한국 문학과 연설에서 다양한 수사법이 사용됩니다. 직유는 ''처럼''이나 ''같이''를 사용하여 두 사물을 비교하는 방법입니다. 은유는 비교 표현 없이 직접 동일시하는 강렬한 표현입니다. 의인법은 무생물에 인간의 특성을 부여하여 생동감을 줍니다. 과장법은 사실을 크게 부풀려 강조하는 기법입니다. 이러한 수사법들을 익히면 더 풍부하고 설득력 있는 한국어 표현이 가능합니다.', 'Rhetoric is a technique that makes language richer and more effective. Various rhetorical devices are used in Korean literature and speeches. Simile is a method of comparing two things using ''like'' (cheoreom) or ''as'' (gachi). Metaphor is an intense expression that directly equates without comparative words. Personification gives vitality by attributing human characteristics to inanimate objects. Hyperbole is a technique that greatly exaggerates facts for emphasis. Mastering these rhetorical devices enables richer and more persuasive Korean expression.', 1);
END $$;


-- ============================================================
-- Lesson 108: Korean Legal Language (법률 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 108;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=108 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '법률', 'beomnyul', 'law, legislation', 1),
    (l_id, '계약', 'gyeyak', 'contract', 2),
    (l_id, '권리', 'gwonni', 'right, entitlement', 3),
    (l_id, '의무', 'uimu', 'obligation, duty', 4),
    (l_id, '위반', 'wiban', 'violation', 5),
    (l_id, '처벌', 'cheobel', 'punishment, penalty', 6),
    (l_id, '소송', 'sosong', 'lawsuit, litigation', 7),
    (l_id, '판결', 'pangyeol', 'verdict, ruling', 8),
    (l_id, '증거', 'jeunggeo', 'evidence', 9),
    (l_id, '피고', 'pigo', 'defendant', 10),
    (l_id, '원고', 'wongo', 'plaintiff', 11),
    (l_id, '변호사', 'byeonhosa', 'lawyer, attorney', 12),
    (l_id, '법원', 'beobwon', 'court (of law)', 13),
    (l_id, '헌법', 'heonbeop', 'constitution', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Legal obligation: -야 한다 / -어야 한다', 'V-아야/어야 하다', 'Expresses legal or moral obligation: "must do". Common in legal texts and formal rules.', '[{"korean":"계약서에 서명해야 합니다.","english":"You must sign the contract."},{"korean":"법을 준수해야 합니다.","english":"You must comply with the law."},{"korean":"세금을 납부해야 합니다.","english":"You must pay taxes."}]', 1),
    (l_id, 'Prohibition: -면 안 된다', 'V-(으)면 안 되다', 'Expresses prohibition: "must not". Used in laws, rules, and regulations.', '[{"korean":"계약을 무단으로 변경하면 안 됩니다.","english":"You must not alter the contract without authorization."},{"korean":"타인의 권리를 침해하면 안 됩니다.","english":"You must not infringe on others'' rights."}]', 2),
    (l_id, 'Formal passive: -되다', 'N이/가 V-되다', 'Expresses formal passive voice, common in legal and official documents.', '[{"korean":"계약이 체결되었습니다.","english":"The contract was concluded."},{"korean":"판결이 선고되었습니다.","english":"The verdict was announced."},{"korean":"법률이 시행되었습니다.","english":"The law was enacted/implemented."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '의뢰인', '변호사님, 계약 위반으로 소송을 제기할 수 있을까요?', 'Byeonhosanim, gyeyak wiban-euro sosong-eul jegi hal su isseulkkayo?', 'Attorney, can I file a lawsuit for breach of contract?', 1),
    (l_id, '변호사', '네, 충분한 증거가 있다면 소송이 가능합니다.', 'Ne, chungbunhan jeunggeo-ga itdamyeon sosong-i ganeunghabnida.', 'Yes, if there is sufficient evidence, a lawsuit is possible.', 2),
    (l_id, '의뢰인', '어떤 증거가 필요한가요?', 'Eotteon jeunggeo-ga piryohangayo?', 'What kind of evidence is needed?', 3),
    (l_id, '변호사', '계약서, 이메일, 거래 내역 등이 중요한 증거입니다.', 'Gyeyakseo, imeil, geoae naeyeok deung-i jungyohan jeunggeo-imnida.', 'The contract, emails, and transaction records are important evidence.', 4),
    (l_id, '의뢰인', '소송 기간은 얼마나 걸리나요?', 'Sosong gigan-eun eolmana geollinayo?', 'How long does the lawsuit take?', 5),
    (l_id, '변호사', '사건에 따라 다르지만 보통 6개월에서 2년 정도 걸립니다.', 'Sageon-e ttara dareu-jiman botong yuk-gaewol-eseo i-nyeon jeongdo geollimnida.', 'It varies by case, but usually takes 6 months to 2 years.', 6),
    (l_id, '의뢰인', '승소할 가능성은 얼마나 될까요?', 'Seungsso-hal ganeungseong-eun eolmana doelkkayo?', 'What are the chances of winning?', 7),
    (l_id, '변호사', '증거가 명확하면 승소 가능성이 높습니다.', 'Jeunggeo-ga myeongwak-hamyeon seungsso ganeungseong-i nopeumnida.', 'If the evidence is clear, the chances of winning are high.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '법정에서 사실을 증명하는 자료를 무엇이라고 합니까?', '["판결","증거","소송","계약"]', 1, '증거 (jeunggeo) means evidence — the material used to prove facts in court.', 1),
    (l_id, '법을 어기는 행위를 한국어로 무엇이라고 합니까?', '["권리","의무","위반","처벌"]', 2, '위반 (wiban) means violation — the act of breaking a rule or law.', 2),
    (l_id, '다음 중 법적 의무를 나타내는 표현은?', '["가도 됩니다","해도 좋습니다","해야 합니다","할 수 있습니다"]', 2, '-아야/어야 합니다 expresses legal or moral obligation: "must do".', 3),
    (l_id, '소송에서 고소를 당한 사람을 무엇이라고 합니까?', '["원고","변호사","판사","피고"]', 3, '피고 (pigo) is the defendant — the person being sued or prosecuted.', 4),
    (l_id, '법원에서 내리는 최종 결정을 무엇이라고 합니까?', '["계약","증거","판결","소송"]', 2, '판결 (pangyeol) is the verdict or ruling issued by a court.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국의 법률 체계는 성문법에 기반하고 있습니다. 헌법은 모든 법률의 최상위에 위치하며 국민의 기본권을 보장합니다. 계약은 당사자 간의 법적 구속력 있는 합의로, 서면으로 작성하는 것이 일반적입니다. 계약을 위반하면 손해배상 책임이 발생할 수 있습니다. 법적 분쟁이 발생했을 때는 변호사의 조언을 구하는 것이 중요합니다. 소송 절차는 복잡하므로 전문가의 도움이 필요합니다. 법률 지식을 갖추면 일상생활에서 자신의 권리를 보호할 수 있습니다.', 'Korea''s legal system is based on written law (statutory law). The constitution is at the top of all laws and guarantees the fundamental rights of citizens. A contract is a legally binding agreement between parties, and it is common to put it in writing. Violating a contract can result in liability for damages. When a legal dispute arises, it is important to seek advice from a lawyer. Since legal procedures are complex, professional help is needed. Having legal knowledge allows you to protect your rights in daily life.', 1);
END $$;

-- ============================================================
-- Lesson 109: Medical Korean (의학 한국어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 109;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=109 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '증상', 'jeungsang', 'symptom', 1),
    (l_id, '진단', 'jindan', 'diagnosis', 2),
    (l_id, '처방', 'cheobeang', 'prescription', 3),
    (l_id, '수술', 'susul', 'surgery, operation', 4),
    (l_id, '입원', 'ibwon', 'hospitalization', 5),
    (l_id, '퇴원', 'toewon', 'discharge from hospital', 6),
    (l_id, '만성', 'manseong', 'chronic (illness)', 7),
    (l_id, '급성', 'geupseong', 'acute (illness)', 8),
    (l_id, '부작용', 'bujagyong', 'side effect', 9),
    (l_id, '투약', 'tuyak', 'medication administration', 10),
    (l_id, '혈압', 'hyeorap', 'blood pressure', 11),
    (l_id, '혈당', 'hyeoldang', 'blood sugar', 12),
    (l_id, '면역', 'myeon-yeo', 'immunity', 13),
    (l_id, '염증', 'yeomjeung', 'inflammation', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Describing symptoms: -이/가 나다', 'N이/가 나다', 'Used to describe physical symptoms or sensations. Common in medical contexts.', '[{"korean":"열이 납니다.","english":"I have a fever."},{"korean":"두통이 납니다.","english":"I have a headache."},{"korean":"구역질이 납니다.","english":"I feel nauseous."}]', 1),
    (l_id, 'Duration of illness: -은 지 N이/가 되다', 'V-은/ㄴ 지 N이/가 되다', 'Expresses how long ago something started. Used to describe when symptoms began.', '[{"korean":"아픈 지 3일이 됐습니다.","english":"It''s been 3 days since I got sick."},{"korean":"입원한 지 일주일이 됐습니다.","english":"It''s been a week since I was hospitalized."}]', 2),
    (l_id, 'Medical advice: -도록 하세요', 'V-도록 하세요', 'Gives medical instructions or recommendations in a formal way. "Please make sure to V."', '[{"korean":"충분히 쉬도록 하세요.","english":"Please make sure to get enough rest."},{"korean":"약을 꼭 드시도록 하세요.","english":"Please make sure to take your medication."},{"korean":"물을 많이 마시도록 하세요.","english":"Please make sure to drink a lot of water."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '환자', '의사 선생님, 며칠째 열이 나고 기침이 심합니다.', 'Uisa seonsaengnim, myeochiljjae yeori nago gichim-i simnida.', 'Doctor, I have had a fever for several days and a severe cough.', 1),
    (l_id, '의사', '언제부터 증상이 시작됐나요?', 'Eonjebuteo jeungsang-i sijakdwaennayo?', 'When did the symptoms start?', 2),
    (l_id, '환자', '3일 전부터 시작됐습니다.', 'Sam-il jeonbuteo sijakdwaeseumnida.', 'They started 3 days ago.', 3),
    (l_id, '의사', '다른 증상은 없나요? 두통이나 근육통은요?', 'Dareun jeungsang-eun eomnayo? Dutong-ina geun-yukttong-eunyo?', 'Are there any other symptoms? How about headache or muscle pain?', 4),
    (l_id, '환자', '네, 온몸이 아프고 목도 따갑습니다.', 'Ne, onmom-i apeuge mok-do ttagapseumnida.', 'Yes, my whole body aches and my throat also feels sore.', 5),
    (l_id, '의사', '독감으로 보입니다. 처방전을 드릴게요.', 'Dokgam-euro boibnida. Cheobangjeun-eul deurilgeyo.', 'It appears to be the flu. I will give you a prescription.', 6),
    (l_id, '환자', '부작용은 없나요?', 'Bujagyong-eun eomnayo?', 'Are there any side effects?', 7),
    (l_id, '의사', '졸릴 수 있으니 운전은 삼가도록 하세요.', 'Jollil su isseuni unjeon-eun samgadorok haseyo.', 'You may feel drowsy, so please refrain from driving.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '병원에서 의사가 환자에게 약을 적어 주는 것을 무엇이라고 합니까?', '["진단","증상","처방","투약"]', 2, '처방 (cheobeang) is a prescription — the written order for medication from a doctor.', 1),
    (l_id, '약을 먹은 후 나타나는 원하지 않는 반응을 무엇이라고 합니까?', '["진단","면역","부작용","염증"]', 2, '부작용 (bujagyong) means side effect — an unintended reaction to medication.', 2),
    (l_id, '"열이 납니다"에서 "나다"의 의미는?', '["to go","to come out/occur","to eat","to sleep"]', 1, '나다 here means to occur or to have (a symptom). 열이 나다 means "to have a fever".', 3),
    (l_id, '오랫동안 지속되는 병을 무엇이라고 합니까?', '["급성","만성","염증","수술"]', 1, '만성 (manseong) means chronic — a condition that persists for a long time.', 4),
    (l_id, '다음 중 의사의 지시를 나타내는 가장 적절한 표현은?', '["쉬도록 하세요","쉬면 됩니다","쉬는 편이에요","쉬고 싶어요"]', 0, '-도록 하세요 is used to give formal medical instructions or recommendations.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국의 의료 시스템은 전국민 건강보험 제도를 기반으로 합니다. 환자는 가까운 의원이나 병원에서 1차 진료를 받을 수 있습니다. 심각한 질환의 경우 상급 종합병원으로 의뢰됩니다. 의사는 환자의 증상을 듣고 진단을 내린 후 처방전을 발행합니다. 처방약은 약국에서 구입할 수 있습니다. 수술이 필요한 경우 입원 절차를 밟게 됩니다. 퇴원 후에도 정기적인 추적 검사가 필요할 수 있습니다. 만성 질환 환자는 꾸준한 관리와 투약이 중요합니다.', 'Korea''s healthcare system is based on universal health insurance. Patients can receive primary care at nearby clinics or hospitals. For serious conditions, referrals are made to tertiary hospitals. The doctor listens to the patient''s symptoms, makes a diagnosis, and issues a prescription. Prescription medications can be purchased at a pharmacy. If surgery is needed, hospitalization procedures follow. Even after discharge, regular follow-up examinations may be necessary. For patients with chronic conditions, consistent management and medication are important.', 1);
END $$;

-- ============================================================
-- Lesson 110: Science Korean (과학 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 110;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=110 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '실험', 'silheom', 'experiment', 1),
    (l_id, '가설', 'gaseol', 'hypothesis', 2),
    (l_id, '분석', 'bunseok', 'analysis', 3),
    (l_id, '결과', 'gyeolgwa', 'result, outcome', 4),
    (l_id, '관찰', 'gwanchal', 'observation', 5),
    (l_id, '측정', 'cheukjeong', 'measurement', 6),
    (l_id, '원소', 'wonso', 'element (chemical)', 7),
    (l_id, '분자', 'bunja', 'molecule', 8),
    (l_id, '원자', 'wonja', 'atom', 9),
    (l_id, '에너지', 'eneoji', 'energy', 10),
    (l_id, '중력', 'jungnyeok', 'gravity', 11),
    (l_id, '진화', 'jinhwa', 'evolution', 12),
    (l_id, '연구', 'yeong-gu', 'research, study', 13),
    (l_id, '발견', 'balggyeon', 'discovery', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Stating cause-effect in science: -으므로', 'V/A-(으)므로', 'A formal connective meaning "because/since". Common in scientific writing and academic papers.', '[{"korean":"온도가 높으므로 반응 속도가 빨라집니다.","english":"Because the temperature is high, the reaction rate increases."},{"korean":"중력이 존재하므로 물체가 떨어집니다.","english":"Since gravity exists, objects fall."}]', 1),
    (l_id, 'Experimental results: -음이 밝혀졌다', 'V/A-음/ㅁ이 밝혀지다', 'Used in academic and scientific contexts to report findings: "It has been revealed that..."', '[{"korean":"이 물질이 유해함이 밝혀졌습니다.","english":"It has been revealed that this substance is harmful."},{"korean":"새로운 원소가 존재함이 밝혀졌습니다.","english":"It has been revealed that a new element exists."}]', 2),
    (l_id, 'Describing process: -게 되다', 'V-게 되다', 'Describes a process or change that occurs, often used in scientific explanation of phenomena.', '[{"korean":"가스가 냉각되면 액체가 되게 됩니다.","english":"When gas cools, it becomes liquid."},{"korean":"세포가 분열하게 됩니다.","english":"The cells come to divide."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '교수', '오늘은 가설을 세우고 실험을 설계하는 방법을 배울 것입니다.', 'Oneul-eun gaseol-eul sewugo silheom-eul seolgye-haneun bangbeop-eul baeul geosimnida.', 'Today we will learn how to formulate a hypothesis and design an experiment.', 1),
    (l_id, '학생', '가설은 어떻게 세워야 합니까?', 'Gaseol-eun eotteoke sewoya hapnikka?', 'How should a hypothesis be formulated?', 2),
    (l_id, '교수', '관찰된 현상을 바탕으로 검증 가능한 예측을 만들어야 합니다.', 'Gwanchaldoen hyeonsang-eul batang-euro geomjeung ganeunghan yecheuk-eul mandeureoaya habnida.', 'You must create a testable prediction based on observed phenomena.', 3),
    (l_id, '학생', '실험 결과가 가설과 다르면 어떻게 됩니까?', 'Silheom gyeolgwa-ga gaseol-gwa dareumyeon eotteoke dwaebnigga?', 'What happens if the experimental results differ from the hypothesis?', 4),
    (l_id, '교수', '가설을 수정하거나 새로운 가설을 세워야 합니다.', 'Gaseol-eul sujeong-hagona saeroun gaseol-eul sewoya habnida.', 'You must revise the hypothesis or formulate a new one.', 5),
    (l_id, '학생', '측정값의 오차는 어떻게 처리합니까?', 'Cheukjeonggab-ui ocha-neun eotteoke cheoirihapnikka?', 'How are measurement errors handled?', 6),
    (l_id, '교수', '반복 측정으로 오차를 줄이고 평균값을 사용합니다.', 'Banbok cheukjeong-euro ocha-reul juligo pyeong-gyungab-eul sayonghabnida.', 'Repeat measurements are used to reduce errors and average values are used.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '과학적 탐구에서 결과를 예측하는 잠정적 설명을 무엇이라고 합니까?', '["결과","분석","가설","관찰"]', 2, '가설 (gaseol) is a hypothesis — a tentative explanation or prediction made before an experiment.', 1),
    (l_id, '물질의 기본 단위로 양성자, 중성자, 전자로 이루어진 것은?', '["분자","원소","원자","에너지"]', 2, '원자 (wonja) is an atom — the basic unit of matter consisting of protons, neutrons, and electrons.', 2),
    (l_id, '학술 문체에서 인과 관계를 나타내는 격식 표현은?', '["그래서","때문에","-(으)므로","이어서"]', 2, '-(으)므로 is a formal connective meaning "because/since", common in academic and scientific writing.', 3),
    (l_id, '"이 사실이 밝혀졌다"를 격식 문어체로 표현하면?', '["이 사실임이 밝혀졌다","이 사실음이 밝혀졌다","이 사실이 밝혀졌음","이 사실임 밝혀짐"]', 0, '-음이 밝혀지다 is the formal academic structure for reporting findings.', 4),
    (l_id, '실험에서 직접 눈으로 보고 기록하는 행위를 무엇이라고 합니까?', '["실험","측정","결과","관찰"]', 3, '관찰 (gwanchal) is observation — directly seeing and recording phenomena in an experiment.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '과학적 방법은 자연 현상을 이해하기 위한 체계적인 접근법입니다. 첫 번째 단계는 현상을 주의 깊게 관찰하는 것입니다. 관찰을 바탕으로 가설을 세우고 실험을 통해 검증합니다. 실험 결과를 분석하여 가설의 타당성을 평가합니다. 결과가 가설을 지지하면 이론으로 발전할 수 있습니다. 과학은 끊임없는 질문과 검증을 통해 발전해 왔습니다. 아인슈타인의 상대성 이론처럼 획기적인 발견이 과학의 역사를 바꿉니다. 과학적 사고는 일상생활의 문제 해결에도 도움이 됩니다.', 'The scientific method is a systematic approach to understanding natural phenomena. The first step is to carefully observe phenomena. Based on observations, a hypothesis is formed and tested through experiments. The experimental results are analyzed to evaluate the validity of the hypothesis. If the results support the hypothesis, it can develop into a theory. Science has advanced through endless questioning and verification. Groundbreaking discoveries like Einstein''s theory of relativity change the history of science. Scientific thinking is also helpful in solving problems in everyday life.', 1);
END $$;

-- ============================================================
-- Lesson 111: Philosophical Korean (철학 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 111;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=111 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '존재', 'jonjae', 'existence, being', 1),
    (l_id, '본질', 'bonjil', 'essence, nature', 2),
    (l_id, '인식', 'insik', 'cognition, recognition', 3),
    (l_id, '진리', 'jilli', 'truth', 4),
    (l_id, '윤리', 'yulli', 'ethics', 5),
    (l_id, '도덕', 'dodeok', 'morality, morals', 6),
    (l_id, '의식', 'uisik', 'consciousness', 7),
    (l_id, '이성', 'iseong', 'reason, rationality', 8),
    (l_id, '감성', 'gamseong', 'emotion, sensibility', 9),
    (l_id, '자유의지', 'jayu-uiji', 'free will', 10),
    (l_id, '가치', 'gachi', 'value', 11),
    (l_id, '형이상학', 'hyeong-isanghak', 'metaphysics', 12),
    (l_id, '인류', 'inlyu', 'humanity, humankind', 13),
    (l_id, '개념', 'gaenyeom', 'concept, notion', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Philosophical assertion: -이란 N이다', 'N이란 N이다', 'Defines or characterizes a concept philosophically. "What is N is N."', '[{"korean":"존재란 무엇인가?","english":"What is existence?"},{"korean":"진리란 변하지 않는 사실이다.","english":"Truth is a fact that does not change."},{"korean":"행복이란 주관적인 경험이다.","english":"Happiness is a subjective experience."}]', 1),
    (l_id, 'Concession in argument: -다고 하더라도', 'V/A-다고 하더라도', 'Expresses "even if it is said that..." — used in philosophical arguments to acknowledge and counter a position.', '[{"korean":"이성적이라고 하더라도 감정을 무시할 수 없다.","english":"Even if one is rational, emotions cannot be ignored."},{"korean":"법이 있다고 하더라도 윤리가 더 중요하다.","english":"Even if there is a law, ethics is more important."}]', 2),
    (l_id, 'Questioning existence: -는 것이 가능한가', 'V-는 것이 가능한가/불가능한가', 'A formal philosophical question form: "Is it possible to V?"', '[{"korean":"완전한 자유의지가 존재하는 것이 가능한가?","english":"Is it possible for complete free will to exist?"},{"korean":"객관적 진리를 인식하는 것이 가능한가?","english":"Is it possible to perceive objective truth?"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생A', '인간은 자유의지를 가지고 있다고 생각하십니까?', 'Ingan-eun jayu-uiji-reul gajigo itdago saenggak-hasimnikka?', 'Do you think humans have free will?', 1),
    (l_id, '교수', '그것은 철학의 가장 오래된 질문 중 하나입니다.', 'Geugeos-eun cheolhak-ui gajang oraedoen jilmun-jung hana-imnida.', 'That is one of the oldest questions in philosophy.', 2),
    (l_id, '학생A', '결정론에서는 모든 것이 인과관계로 결정된다고 합니다.', 'Gyeoljeongnon-eseo-neun modeun geos-i ingwagwangye-ro gyeoljeongtdoendago habnida.', 'In determinism, it is said that everything is determined by cause and effect.', 3),
    (l_id, '교수', '맞습니다. 하지만 우리가 선택한다는 느낌은 어떻게 설명합니까?', 'Majeumnida. Hajiman uri-ga seonteaktandaneun neukkeum-eun eotteoke seolmyeonghapnikka?', 'That is correct. But how do you explain the feeling that we make choices?', 4),
    (l_id, '학생B', '의식 자체가 결정론적이라고 하더라도 자유의지를 느낄 수 있습니다.', 'Uisik jache-ga gyeoljeongnon-jeogiradago hadorado jayu-uiji-reul neukkil su itseumnida.', 'Even if consciousness itself is deterministic, we can still feel free will.', 5),
    (l_id, '교수', '그것이 철학에서 양립불가론과 양립가능론의 핵심 차이입니다.', 'Geugeos-i cheolhak-eseo yangnip-bulgaron-gwa yangnip-ganeungnon-ui haeksim chaimnida.', 'That is the core difference between incompatibilism and compatibilism in philosophy.', 6),
    (l_id, '학생A', '철학적 사고는 삶에 어떤 도움이 됩니까?', 'Cheolhakjeok sagoneun salm-e eotteon doum-i doemnikka?', 'How does philosophical thinking help in life?', 7),
    (l_id, '교수', '비판적 사고와 윤리적 판단력을 키워 줍니다.', 'Bipanjeok sago-wa yulli-jeok pandannyeok-eul kiwo jumnida.', 'It develops critical thinking and ethical judgment.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '모든 현상이 원인에 의해 결정된다는 철학적 입장은?', '["자유의지론","결정론","허무주의","실존주의"]', 1, '결정론 (determinism) holds that all events are caused and determined by prior events.', 1),
    (l_id, '"진리란 변하지 않는 사실이다"에서 사용된 문법 구조는?', '["이란/은는","이어서","더라도","-(으)므로"]', 0, 'N이란 N이다 is used for philosophical definitions: "What is N is N."', 2),
    (l_id, '행동의 옳고 그름을 연구하는 철학 분야는?', '["형이상학","인식론","윤리학","존재론"]', 2, '윤리학 (ethics) is the branch of philosophy studying the rightness and wrongness of actions.', 3),
    (l_id, '다음 중 "설령 그렇다 해도"의 뜻을 가진 표현은?', '["-(으)므로","-더라도","-아서","-지만"]', 1, '-다고 하더라도 means "even if it is said that", used to acknowledge and counter philosophical positions.', 4),
    (l_id, '인간의 경험과 지식의 근원을 연구하는 철학 분야는?', '["형이상학","윤리학","인식론","논리학"]', 2, '인식론 (epistemology) is the branch of philosophy studying the nature of knowledge and cognition.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '철학은 존재, 지식, 가치, 이성, 언어 등의 근본적인 문제를 탐구하는 학문입니다. 고대 그리스의 소크라테스, 플라톤, 아리스토텔레스로부터 철학적 전통이 시작되었습니다. 동양 철학에서는 공자, 노자, 불타의 사상이 큰 영향을 미쳤습니다. 철학적 사고는 우리가 세상을 이해하고 옳고 그름을 판단하는 방식에 영향을 줍니다. 윤리학은 인간의 행동 원칙을 연구하며, 형이상학은 실재의 본질을 탐구합니다. 현대 철학은 과학, 언어, 정치, 예술 등 다양한 분야와 접목되고 있습니다. 철학을 배우면 비판적 사고와 논리적 추론 능력이 향상됩니다.', 'Philosophy is a discipline that explores fundamental questions about existence, knowledge, values, reason, and language. The philosophical tradition began with Socrates, Plato, and Aristotle in ancient Greece. In Eastern philosophy, the thoughts of Confucius, Laozi, and the Buddha had a great influence. Philosophical thinking influences how we understand the world and judge right from wrong. Ethics studies the principles of human behavior, while metaphysics explores the nature of reality. Modern philosophy is being integrated with various fields such as science, language, politics, and art. Studying philosophy improves critical thinking and logical reasoning skills.', 1);
END $$;

-- ============================================================
-- Lesson 112: Economic Korean (경제 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 112;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=112 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '경제', 'gyeongje', 'economy, economics', 1),
    (l_id, '시장', 'sijang', 'market', 2),
    (l_id, '공급', 'gonggeuseup', 'supply', 3),
    (l_id, '수요', 'suyo', 'demand', 4),
    (l_id, '인플레이션', 'inpeulleiisyeon', 'inflation', 5),
    (l_id, '금리', 'geumni', 'interest rate', 6),
    (l_id, '환율', 'hwanyul', 'exchange rate', 7),
    (l_id, '투자', 'tuja', 'investment', 8),
    (l_id, '무역', 'muryo', 'trade', 9),
    (l_id, 'GDP', 'jidipii', 'GDP (Gross Domestic Product)', 10),
    (l_id, '경기', 'gyeonggi', 'business cycle, economic conditions', 11),
    (l_id, '불황', 'bulhwang', 'recession, depression', 12),
    (l_id, '호황', 'hohwang', 'boom, prosperity', 13),
    (l_id, '재정', 'jaejeong', 'finance, fiscal affairs', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Economic trend: -는 추세이다', 'V-는 추세이다', 'Describes an ongoing economic trend or tendency. "There is a trend of V-ing."', '[{"korean":"물가가 오르는 추세입니다.","english":"Prices are on a rising trend."},{"korean":"수출이 감소하는 추세입니다.","english":"Exports are on a declining trend."},{"korean":"외국인 투자가 늘어나는 추세입니다.","english":"Foreign investment is on an increasing trend."}]', 1),
    (l_id, 'Consequence in economics: -에 따라', 'N에 따라 / V-(으)ㅁ에 따라', 'Expresses that something varies or results "according to" / "following" a condition.', '[{"korean":"금리 변화에 따라 환율이 변동됩니다.","english":"The exchange rate fluctuates according to interest rate changes."},{"korean":"수요가 증가함에 따라 가격이 올랐습니다.","english":"As demand increased, prices rose."}]', 2),
    (l_id, 'Formal comparison: -에 비해', 'N에 비해 (서)', 'Formal comparative expression meaning "compared to N". Common in economic analysis.', '[{"korean":"작년에 비해 GDP가 증가했습니다.","english":"GDP increased compared to last year."},{"korean":"미국에 비해 한국의 금리가 낮습니다.","english":"Compared to the US, Korea''s interest rate is low."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '기자', '최근 경제 상황을 어떻게 보십니까?', 'Choegeun gyeongje sanghwang-eul eotteoke bosimnikka?', 'How do you view the current economic situation?', 1),
    (l_id, '전문가', '인플레이션으로 인해 소비자들의 부담이 커지는 추세입니다.', 'Inpeulleiisyeon-euro inhae sobijadeul-ui budam-i keojineun chuseimnida.', 'Due to inflation, the burden on consumers is on an increasing trend.', 2),
    (l_id, '기자', '정부는 어떤 대책을 마련하고 있습니까?', 'Jeongbu-neun eotteon daechaek-eul mallyeonhago itseumnikka?', 'What measures is the government preparing?', 3),
    (l_id, '전문가', '금리 인상을 통해 인플레이션을 억제하려 하고 있습니다.', 'Geumni insang-eul tonghae inpeulleiisyeon-eul eokje-haryeo hago itseumnida.', 'They are trying to suppress inflation through interest rate hikes.', 4),
    (l_id, '기자', '금리 인상이 경제에 미치는 영향은 무엇입니까?', 'Geumni insang-i gyeongje-e michineun yeonghyang-eun mueosimnikka?', 'What impact does the interest rate hike have on the economy?', 5),
    (l_id, '전문가', '대출 비용이 증가함에 따라 소비와 투자가 줄어들 수 있습니다.', 'Daechul bigyong-i jeunggahame ttara sobi-wa tuja-ga jureodeul su itseumnida.', 'As borrowing costs increase, consumption and investment may decrease.', 6),
    (l_id, '기자', '무역 수지는 어떻습니까?', 'Muryo suji-neun eotteoseumnikka?', 'How is the trade balance?', 7),
    (l_id, '전문가', '작년에 비해 수출이 감소하여 무역 수지가 악화되고 있습니다.', 'Jangnyeon-e bihae suchul-i gamso-hayeo muryo suji-ga akwadoego itseumnida.', 'Compared to last year, exports have decreased, worsening the trade balance.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '상품이나 서비스에 대한 소비자의 구매 욕구를 무엇이라고 합니까?', '["공급","투자","수요","시장"]', 2, '수요 (suyo) is demand — the consumer desire or need for a product or service.', 1),
    (l_id, '물가가 지속적으로 상승하는 현상을 무엇이라고 합니까?', '["불황","호황","인플레이션","환율"]', 2, '인플레이션 (inflation) is the sustained increase in the general price level.', 2),
    (l_id, '"수출이 감소하는 추세입니다"에서 이 표현이 의미하는 것은?', '["수출이 갑자기 감소했다","수출이 점점 감소하고 있다","수출이 증가했다가 감소했다","수출 감소가 끝났다"]', 1, '-는 추세이다 describes an ongoing trend. "수출이 감소하는 추세" = exports are on a declining trend.', 3),
    (l_id, '경제 분석에서 "지난해에 비해 성장했다"와 같은 의미의 격식 표현은?', '["지난해보다","지난해에 따라","지난해에 비해","지난해처럼"]', 2, 'N에 비해 is the formal comparative expression meaning "compared to N", common in economic reports.', 4),
    (l_id, '국가의 경제 활동 총량을 나타내는 지표는?', '["인플레이션","GDP","금리","환율"]', 1, 'GDP (Gross Domestic Product) measures the total economic output of a country.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '경제는 한 사회의 자원 생산, 분배, 소비를 다루는 복잡한 시스템입니다. 시장에서는 수요와 공급의 법칙에 따라 가격이 결정됩니다. 인플레이션은 화폐의 구매력이 하락하는 현상으로, 일상 소비에 직접적인 영향을 줍니다. 정부와 중앙은행은 금리 조정, 재정 정책 등을 통해 경제를 안정시키려 합니다. 국제 무역은 각국의 비교 우위를 활용하여 서로 이득을 얻는 과정입니다. 한국은 수출 주도형 경제로 반도체, 자동차, 화학 제품이 주요 수출품입니다. 경제 지식을 갖추면 개인 재테크와 사회 현상 이해에 도움이 됩니다.', 'The economy is a complex system dealing with the production, distribution, and consumption of resources in a society. In the market, prices are determined by the law of supply and demand. Inflation is a phenomenon in which the purchasing power of money decreases, directly affecting everyday consumption. Governments and central banks try to stabilize the economy through interest rate adjustments and fiscal policies. International trade is the process of mutual benefit by utilizing each country''s comparative advantage. Korea has an export-driven economy, with semiconductors, automobiles, and chemical products being major exports. Having economic knowledge helps with personal financial planning and understanding social phenomena.', 1);
END $$;

-- ============================================================
-- Lesson 113: Political Korean (정치 언어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 113;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=113 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '민주주의', 'minjujuui', 'democracy', 1),
    (l_id, '선거', 'seongeo', 'election', 2),
    (l_id, '투표', 'tupyo', 'vote, ballot', 3),
    (l_id, '의회', 'uihoe', 'parliament, congress', 4),
    (l_id, '정당', 'jeongdang', 'political party', 5),
    (l_id, '정책', 'jeongchaek', 'policy', 6),
    (l_id, '대통령', 'daetongnyeong', 'president', 7),
    (l_id, '국회의원', 'gukwoe-uiwon', 'member of parliament', 8),
    (l_id, '여당', 'yeodang', 'ruling party', 9),
    (l_id, '야당', 'yadang', 'opposition party', 10),
    (l_id, '법안', 'beoban', 'bill, legislation', 11),
    (l_id, '비준', 'bijun', 'ratification', 12),
    (l_id, '외교', 'waeyo', 'diplomacy, foreign affairs', 13),
    (l_id, '주권', 'jugwon', 'sovereignty', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Political reporting: -에 따르면', 'N에 따르면', 'Cites a source in political reporting: "According to N..."', '[{"korean":"정부 발표에 따르면 새 정책이 시행될 예정입니다.","english":"According to the government announcement, a new policy is scheduled to be implemented."},{"korean":"여론 조사에 따르면 지지율이 상승했습니다.","english":"According to the poll, approval ratings have risen."}]', 1),
    (l_id, 'Political stance: -(으)ㄹ 것을 주장하다', 'V-(으)ㄹ 것을 주장하다', 'Used to report political demands or arguments: "to argue/claim that [something] should be done."', '[{"korean":"야당은 법안을 철회할 것을 주장했습니다.","english":"The opposition party argued for the withdrawal of the bill."},{"korean":"시민단체는 정책을 재검토할 것을 촉구했습니다.","english":"Civic groups urged that the policy be reconsidered."}]', 2),
    (l_id, 'Formal purpose: -을/를 위하여', 'N을/를 위하여', 'Formal version of -을/를 위해. Common in political speeches and official documents.', '[{"korean":"국민을 위하여 최선을 다하겠습니다.","english":"I will do my best for the citizens."},{"korean":"평화를 위하여 외교적 노력이 필요합니다.","english":"Diplomatic efforts are needed for the sake of peace."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '기자', '이번 선거 결과에 대해 어떻게 생각하십니까?', 'Ibeon seongeo gyeolgwa-e daehae eotteoke saenggak-hasimnikka?', 'What do you think about the election results?', 1),
    (l_id, '정치인', '국민의 뜻을 겸허히 받아들이겠습니다.', 'Gungmin-ui tteut-eul gyeomhyeohi badadeuligesseumnida.', 'I will humbly accept the will of the people.', 2),
    (l_id, '기자', '야당은 법안 통과에 반대하고 있습니다.', 'Yadang-eun beoban tonggwa-e bandaehago itseumnida.', 'The opposition party is against the passage of the bill.', 3),
    (l_id, '정치인', '야당에 따르면 이 법안에 문제가 있다고 합니다.', 'Yadang-e ttareumyeon i beoban-e munje-ga itdago habnida.', 'According to the opposition party, there are problems with this bill.', 4),
    (l_id, '기자', '여당은 어떤 입장입니까?', 'Yeodang-eun eotteon ipjang-imnikka?', 'What is the ruling party''s position?', 5),
    (l_id, '정치인', '국민을 위하여 이 법안이 반드시 통과되어야 한다고 봅니다.', 'Gungmin-eul wihayeo i beoban-i bandusi tonggwadoeyeoya handago bomnida.', 'I believe this bill must be passed for the sake of the citizens.', 6),
    (l_id, '기자', '향후 외교 정책 방향은 어떻습니까?', 'Hyanghu waeyo jeongchaek banghyang-eun eotteoseumnikka?', 'What is the direction of future foreign policy?', 7),
    (l_id, '정치인', '평화와 번영을 위하여 적극적인 외교 활동을 전개하겠습니다.', 'Pyeonghwa-wa beonyeong-eul wihayeo jeokgeukjeokin waeyo hwaldong-eul jeonggaehagesseumnida.', 'We will engage in active diplomatic activities for peace and prosperity.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '국가의 최고 통치 기관으로 법률을 만드는 곳은?', '["법원","행정부","의회","정당"]', 2, '의회 (parliament/congress) is the legislative body that creates laws.', 1),
    (l_id, '선거에서 현재 정권을 잡고 있는 정당을 무엇이라고 합니까?', '["야당","정당","여당","의회"]', 2, '여당 (yeodang) is the ruling party — the party currently in power.', 2),
    (l_id, '"정부 발표에 따르면"이 사용된 이유는?', '["추측을 나타내기 위해","출처를 인용하기 위해","반대 의견을 나타내기 위해","조건을 나타내기 위해"]', 1, '에 따르면 is used to cite a source in reporting: "According to [source]..."', 3),
    (l_id, '격식적인 연설에서 "~을/를 위해"의 격식체 표현은?', '["위하여","위해서","위하면","위하기"]', 0, '-을/를 위하여 is the formal version of -을/를 위해, used in political speeches and official documents.', 4),
    (l_id, '여러 나라 사이의 관계와 협상을 다루는 활동을 무엇이라고 합니까?', '["투표","법안","정책","외교"]', 3, '외교 (diplomacy) deals with relations and negotiations between countries.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국은 대통령 중심제를 채택한 민주주의 국가입니다. 대통령은 국민의 직접 투표로 선출되며 임기는 5년입니다. 국회는 300명의 국회의원으로 구성되며 법률을 제정하고 정부를 감시합니다. 여당과 야당 사이의 정치적 토론은 민주주의의 건강한 작동을 보여 줍니다. 선거는 국민이 정치에 참여하는 가장 기본적인 방법입니다. 정책 결정 과정에서 다양한 이해관계자의 의견이 반영되어야 합니다. 외교 정책은 국가의 이익과 국제 평화를 동시에 고려해야 합니다. 민주주의의 발전을 위해서는 시민의 적극적인 정치 참여가 필수적입니다.', 'Korea is a democratic country with a presidential system. The president is elected by direct popular vote and serves a five-year term. The National Assembly consists of 300 members and enacts laws while overseeing the government. The political debate between the ruling party and the opposition demonstrates the healthy functioning of democracy. Elections are the most fundamental way for citizens to participate in politics. In the policy-making process, the opinions of various stakeholders must be reflected. Foreign policy must simultaneously consider the national interest and international peace. For the development of democracy, active political participation by citizens is essential.', 1);
END $$;

-- ============================================================
-- Lesson 114: Cultural Analysis (문화 분석)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 114;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=114 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '문화', 'munhwa', 'culture', 1),
    (l_id, '전통', 'jeontong', 'tradition', 2),
    (l_id, '관습', 'gwanseup', 'custom, practice', 3),
    (l_id, '의례', 'uire', 'ritual, ceremony', 4),
    (l_id, '정체성', 'jeongcheseong', 'identity', 5),
    (l_id, '다양성', 'dayangseong', 'diversity', 6),
    (l_id, '융합', 'yunghap', 'fusion, convergence', 7),
    (l_id, '세계화', 'segyehwa', 'globalization', 8),
    (l_id, '문화재', 'munhwajae', 'cultural heritage, artifact', 9),
    (l_id, '계승', 'gyeseung', 'succession, inheritance (of culture)', 10),
    (l_id, '변용', 'byeon-yong', 'transformation, adaptation', 11),
    (l_id, '상징', 'sangjing', 'symbol', 12),
    (l_id, '의미', 'uimi', 'meaning, significance', 13),
    (l_id, '맥락', 'maengnak', 'context', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Cultural background: -을/를 배경으로', 'N을/를 배경으로', 'Expresses the cultural or historical background of something: "with N as the background/context."', '[{"korean":"유교를 배경으로 한국의 예절 문화가 형성되었습니다.","english":"Korean etiquette culture was formed with Confucianism as the background."},{"korean":"이 소설은 조선 시대를 배경으로 합니다.","english":"This novel is set against the backdrop of the Joseon Dynasty."}]', 1),
    (l_id, 'Reflecting characteristics: -을/를 반영하다', 'N이/가 N을/를 반영하다', 'Expresses that something reflects or embodies cultural values or characteristics.', '[{"korean":"한복은 한국의 미적 가치를 반영합니다.","english":"Hanbok reflects Korean aesthetic values."},{"korean":"이 관습은 조상 숭배 사상을 반영합니다.","english":"This custom reflects the idea of ancestor veneration."}]', 2),
    (l_id, 'Cultural continuity: -어/아 내려오다', 'V-아/어 내려오다', 'Expresses a tradition or practice that has been passed down over generations.', '[{"korean":"이 풍습은 수백 년 동안 전해 내려왔습니다.","english":"This custom has been passed down for hundreds of years."},{"korean":"이 기술은 대대로 전해 내려오고 있습니다.","english":"This skill has been passed down from generation to generation."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '교수', '한국 문화에서 집단주의와 개인주의는 어떻게 공존합니까?', 'Hanguk munhwa-eseo jipdan-juuiwa gaein-juui-neun eotteoke gongjonsimnikka?', 'How do collectivism and individualism coexist in Korean culture?', 1),
    (l_id, '학생', '전통적으로 집단의 화합을 중시하지만 현대에는 개인주의도 강해졌습니다.', 'Jeontongjeok-euro jipdan-ui hwahap-eul jungsihajiman hyeondae-eneun gaein-juui-do ganghaejeotseumnida.', 'Traditionally, group harmony is emphasized, but in modern times individualism has also become stronger.', 2),
    (l_id, '교수', '세계화가 한국 문화에 미친 영향은 무엇이라고 생각합니까?', 'Segyehwa-ga Hanguk munhwa-e michin yeonghyang-eun mueosirago saenggakhamnikka?', 'What do you think is the impact of globalization on Korean culture?', 3),
    (l_id, '학생', '외래 문화가 유입되면서 전통 문화가 변용되고 있습니다.', 'Oelae munhwa-ga yuibdoemyeonseo jeontong munhwa-ga byeon-yongdoego itseumnida.', 'As foreign cultures have entered, traditional culture is being transformed.', 4),
    (l_id, '교수', '한국의 문화 정체성은 어떻게 유지될 수 있을까요?', 'Hanguk-ui munhwa jeongcheseong-eun eotteoke yujidoel su isseulkkayo?', 'How can Korea''s cultural identity be maintained?', 5),
    (l_id, '학생', '전통을 배경으로 현대적 감각을 융합하는 것이 중요하다고 생각합니다.', 'Jeontong-eul baekyeong-euro hyeondaejeok gamsak-eul yunghapaneun geos-i jungyohadago saenggakhabnida.', 'I think it is important to fuse modern sensibility with tradition as the background.', 6),
    (l_id, '교수', '한류가 세계에 미친 영향에 대해 어떻게 생각합니까?', 'Hallyu-ga segye-e michin yeonghyang-e daehae eotteoke saenggakhamnikka?', 'What do you think about the impact of the Korean Wave on the world?', 7),
    (l_id, '학생', '한국의 현대 문화가 전 세계 사람들의 관심을 받고 있다는 것이 자랑스럽습니다.', 'Hanguk-ui hyeondae munhwa-ga jeon segye saramdeul-ui gwanshim-eul badgo itdaneun geos-i jarangseureomnida.', 'I am proud that Korean modern culture is receiving attention from people all over the world.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '"이 관습은 조상 숭배를 반영한다"에서 "반영하다"의 의미는?', '["to reflect","to change","to preserve","to create"]', 0, '반영하다 means "to reflect" — to embody or represent a cultural value or idea.', 1),
    (l_id, '문화유산이 세대를 넘어 이어지는 것을 무엇이라고 합니까?', '["변용","융합","계승","세계화"]', 2, '계승 (gyeseung) means succession or inheritance — passing culture from one generation to the next.', 2),
    (l_id, '"조선 시대를 배경으로 한 소설"에서 "배경으로"의 역할은?', '["목적을 나타낸다","배경이나 맥락을 나타낸다","조건을 나타낸다","시간을 나타낸다"]', 1, 'N을/를 배경으로 expresses the cultural or historical setting/background of something.', 3),
    (l_id, '오랜 세월 동안 전해 내려온 행동 방식을 무엇이라고 합니까?', '["정체성","문화재","관습","상징"]', 2, '관습 (gwanseup) is a custom or practice — a behavior pattern passed down over time.', 4),
    (l_id, '"이 기술이 전해 내려오고 있다"에서 "전해 내려오다"의 의미는?', '["to be lost","to be created","to be passed down","to be changed"]', 2, '-아/어 내려오다 expresses that something has been passed down through generations.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '문화는 한 사회의 구성원들이 공유하는 가치, 믿음, 관습, 예술, 언어 등의 총체입니다. 한국 문화는 유교, 불교, 무속 등 다양한 철학적·종교적 전통을 배경으로 형성되었습니다. 세계화의 흐름 속에서 한국 전통 문화는 변용을 겪으면서도 정체성을 유지해 왔습니다. 한류는 한국의 대중음악, 드라마, 영화, 음식 등이 세계적으로 인기를 얻는 현상입니다. 이는 한국 문화가 세계 무대에서 경쟁력을 갖추게 되었음을 보여 줍니다. 문화 다양성은 서로 다른 문화 간의 교류와 이해를 통해 인류를 풍요롭게 합니다. 문화 분석을 통해 우리는 자신의 문화를 더 깊이 이해하고 타 문화를 존중할 수 있습니다.', 'Culture is the totality of values, beliefs, customs, art, and language shared by members of a society. Korean culture was formed against the backdrop of various philosophical and religious traditions, including Confucianism, Buddhism, and shamanism. In the tide of globalization, Korean traditional culture has maintained its identity while undergoing transformation. The Korean Wave (Hallyu) is the phenomenon in which Korean pop music, dramas, films, and food have gained worldwide popularity. This shows that Korean culture has become competitive on the world stage. Cultural diversity enriches humanity through exchange and understanding between different cultures. Through cultural analysis, we can understand our own culture more deeply and respect other cultures.', 1);
END $$;

-- ============================================================
-- Lesson 115: Korean Classical Language Intro (고전 한국어)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 115;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=115 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '훈민정음', 'Hunmin-jeongeum', 'Hunminjeongeum (original Korean alphabet)', 1),
    (l_id, '세종대왕', 'Sejong Daewang', 'King Sejong the Great', 2),
    (l_id, '고어', 'go-eo', 'archaic language, old Korean', 3),
    (l_id, '현대어', 'hyeondae-eo', 'modern language', 4),
    (l_id, '어원', 'eowon', 'etymology', 5),
    (l_id, '문헌', 'munheon', 'document, text, literature', 6),
    (l_id, '음운', 'eumun', 'phoneme, phonology', 7),
    (l_id, '어미', 'eomi', 'verb ending, suffix', 8),
    (l_id, '어간', 'eogan', 'verb stem', 9),
    (l_id, '방언', 'bangeon', 'dialect', 10),
    (l_id, '차용어', 'chayong-eo', 'loanword', 11),
    (l_id, '순우리말', 'sun-urimal', 'pure Korean word (native Korean)', 12),
    (l_id, '한자어', 'hanjeo-eo', 'Sino-Korean word', 13),
    (l_id, '변천', 'byeoncheon', 'change, evolution (of language)', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Historical source citation: -에 기록되어 있다', 'N에 기록되어 있다', 'Used to cite what is recorded in a historical text or document.', '[{"korean":"훈민정음 해례본에 자음과 모음의 원리가 기록되어 있습니다.","english":"The principles of consonants and vowels are recorded in the Hunminjeongeum Haeryebon."},{"korean":"조선왕조실록에 많은 역사적 사실이 기록되어 있습니다.","english":"Many historical facts are recorded in the Annals of the Joseon Dynasty."}]', 1),
    (l_id, 'Etymology: -에서 유래하다', 'N에서 유래하다', 'Expresses the origin or derivation of a word or expression.', '[{"korean":"''아리랑''은 고어에서 유래한 단어입니다.","english":"Arirang is a word derived from archaic Korean."},{"korean":"이 단어는 한자에서 유래했습니다.","english":"This word is derived from Chinese characters."}]', 2),
    (l_id, 'Language change: -이/가 -으로 변하다', 'N이/가 N(으)로 변하다', 'Describes how language has changed over time from one form to another.', '[{"korean":"중세 국어의 ''이다''가 현대어 ''이다''로 변했습니다.","english":"The Middle Korean form of ''to be'' changed to the modern form."},{"korean":"고어의 ''블''이 현대어 ''불''로 변했습니다.","english":"The archaic ''bul'' changed to the modern ''bul'' (fire)."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생', '훈민정음은 언제 만들어졌나요?', 'Hunmin-jeongeum-eun eonje mandeureo-jeonnayo?', 'When was Hunminjeongeum created?', 1),
    (l_id, '교수', '1443년에 세종대왕이 창제하였습니다.', 'Cheonsa-baek-sa-sip-samnyeon-e Sejong Daewang-i changjehayeotseumnida.', 'It was created by King Sejong the Great in 1443.', 2),
    (l_id, '학생', '훈민정음의 원리는 무엇입니까?', 'Hunmin-jeongeum-ui wolli-neun mueosimnikka?', 'What is the principle of Hunminjeongeum?', 3),
    (l_id, '교수', '해례본에 기록되어 있듯이 자음은 발음 기관을 본뜬 것입니다.', 'Haeryebon-e girokdoeeo itdeusi jaeum-eun bareum gigwan-eul bonttuen geosimnida.', 'As recorded in the Haeryebon, consonants were modeled after the speech organs.', 4),
    (l_id, '학생', '고어와 현대어는 많이 다릅니까?', 'Go-eo-wa hyeondae-eo-neun mani darimnikka?', 'Are archaic Korean and modern Korean very different?', 5),
    (l_id, '교수', '네, 음운, 어휘, 문법 면에서 상당한 변화가 있었습니다.', 'Ne, eumun, eohwi, munbeom myeon-eseo sangdanghan byeonhwa-ga isseotsseumnida.', 'Yes, there have been significant changes in terms of phonology, vocabulary, and grammar.', 6),
    (l_id, '학생', '고전 한국어를 배우면 어떤 도움이 됩니까?', 'Gojeon hangug-eo-reul baeumyeon eotteon doum-i doemnikka?', 'How does learning classical Korean help?', 7),
    (l_id, '교수', '한국어의 뿌리와 단어의 어원을 이해하는 데 도움이 됩니다.', 'Hangug-eo-ui ppuri-wa daneo-ui eowon-eul ihae-haneun de doum-i doemnikka.', 'It helps in understanding the roots of Korean and the etymology of words.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '1443년 세종대왕이 창제한 한국의 문자 체계는?', '["한자","훈민정음","이두","향찰"]', 1, '훈민정음 (Hunminjeongeum) was created by King Sejong in 1443 and is the original name of the Korean alphabet.', 1),
    (l_id, '단어의 기원이나 역사적 형성 과정을 연구하는 것을 무엇이라고 합니까?', '["음운론","어원","방언","어미"]', 1, '어원 (etymology) is the study of the origin and historical development of words.', 2),
    (l_id, '"이 단어는 한자에서 유래했다"에서 "유래하다"의 의미는?', '["to change","to be recorded","to originate from","to disappear"]', 2, '유래하다 means "to originate from" or "to be derived from."', 3),
    (l_id, '순수한 우리말로, 한자어나 외래어가 아닌 고유 한국어를 무엇이라고 합니까?', '["한자어","차용어","방언","순우리말"]', 3, '순우리말 (pure Korean) refers to native Korean words that are neither Sino-Korean nor loanwords.', 4),
    (l_id, '역사적 문서에 기록된 내용을 인용할 때 사용하는 표현은?', '["~에서 유래하다","~에 기록되어 있다","~으로 변하다","~와 관련이 있다"]', 1, 'N에 기록되어 있다 is used to cite what is recorded in a historical document.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어는 약 5000년의 역사를 가진 언어로, 오랜 세월 동안 많은 변화를 겪어 왔습니다. 세종대왕이 1443년에 창제한 훈민정음은 한국어의 역사에서 가장 중요한 사건 중 하나입니다. 그 이전에는 한자를 빌려 한국어를 표기하는 이두와 향찰이 사용되었습니다. 고전 한국어와 현대 한국어는 발음, 어휘, 문법에서 상당한 차이가 있습니다. 훈민정음 해례본에는 자음과 모음의 제자 원리가 상세히 기록되어 있습니다. 현대 한국어는 한자어, 순우리말, 외래어가 섞여 있는 복합적인 언어입니다. 고전 한국어를 공부하면 현대 한국어의 어원과 변천사를 이해하는 데 도움이 됩니다.', 'Korean is a language with a history of about 5,000 years, having undergone many changes over the long years. Hunminjeongeum, created by King Sejong the Great in 1443, is one of the most important events in the history of Korean. Before that, Idu and Hyangchal, which borrowed Chinese characters to transcribe Korean, were used. Classical Korean and modern Korean have significant differences in pronunciation, vocabulary, and grammar. The principles of creating consonants and vowels are recorded in detail in the Hunminjeongeum Haeryebon. Modern Korean is a complex language mixing Sino-Korean words, pure Korean words, and loanwords. Studying classical Korean helps in understanding the etymology and historical changes of modern Korean.', 1);
END $$;

-- ============================================================
-- Lesson 116: Hanja Basics (한자 기초)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 116;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=116 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '한자', 'hanja', 'Chinese characters (used in Korean)', 1),
    (l_id, '획', 'hoek', 'stroke (of a character)', 2),
    (l_id, '부수', 'busu', 'radical (of a Chinese character)', 3),
    (l_id, '음독', 'eumdok', 'phonetic reading (of hanja)', 4),
    (l_id, '훈독', 'hundok', 'semantic reading (of hanja)', 5),
    (l_id, '한자어', 'hanja-eo', 'Sino-Korean word', 6),
    (l_id, '人 (인)', 'in', 'person (hanja)', 7),
    (l_id, '山 (산)', 'san', 'mountain (hanja)', 8),
    (l_id, '水 (수)', 'su', 'water (hanja)', 9),
    (l_id, '火 (화)', 'hwa', 'fire (hanja)', 10),
    (l_id, '木 (목)', 'mok', 'tree, wood (hanja)', 11),
    (l_id, '國 (국)', 'guk', 'country (hanja)', 12),
    (l_id, '學 (학)', 'hak', 'study, learning (hanja)', 13),
    (l_id, '語 (어)', 'eo', 'language, word (hanja)', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Compound hanja words', 'Hanja + Hanja = meaning', 'Many Korean words are formed by combining hanja characters. Understanding the components helps with vocabulary.', '[{"korean":"國語 (국어) = 國(나라 국) + 語(말 어) = national language","english":"국어: composed of 國 (country) + 語 (language) = national language"},{"korean":"學校 (학교) = 學(배울 학) + 校(학교 교) = school","english":"학교: composed of 學 (study) + 校 (school building) = school"},{"korean":"山水 (산수) = 山(뫼 산) + 水(물 수) = landscape/arithmetic","english":"산수: composed of 山 (mountain) + 水 (water) = natural scenery or elementary math"}]', 1),
    (l_id, 'Hanja-based word families', 'Hanja root + endings', 'One hanja can appear in many related Korean words, forming word families.', '[{"korean":"學: 학교(school), 학생(student), 학문(scholarship), 학습(learning)","english":"The hanja 學 (learning) appears in: school, student, scholarship, learning"},{"korean":"國: 국가(nation), 국민(citizen), 외국(foreign country), 국어(national language)","english":"The hanja 國 (country) appears in: nation, citizen, foreign country, national language"}]', 2),
    (l_id, 'Recognizing hanja components in vocabulary', 'Context + hanja knowledge', 'When you encounter an unfamiliar word, hanja knowledge helps you infer the meaning.', '[{"korean":"水道 (수도) = 水(물) + 道(길) = waterway → capital city or water pipe","english":"수도: 水 (water) + 道 (way/road) → water pipe OR capital (main road)"},{"korean":"人口 (인구) = 人(사람) + 口(입) = people + mouth → population","english":"인구: 人 (person) + 口 (mouth) → population (number of people)"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '학생', '한자를 꼭 배워야 하나요?', 'Hanja-reul kkok baewoaya hanayo?', 'Do I really have to learn hanja?', 1),
    (l_id, '선생님', '꼭 필수는 아니지만 한자어 뜻 이해에 많은 도움이 됩니다.', 'Kkok pilsun-eun anijiman hanja-eo tteut ihae-e manheun doum-i doemnikka.', 'It''s not absolutely required, but it helps a lot in understanding the meaning of Sino-Korean words.', 2),
    (l_id, '학생', '한국어 단어 중 한자어는 얼마나 됩니까?', 'Hangug-eo daneo-jung hanja-eo-neun eolmana doemnikka?', 'How many Korean words are Sino-Korean?', 3),
    (l_id, '선생님', '전체 어휘의 약 60퍼센트 이상이 한자어에서 비롯되었습니다.', 'Jeonche eohwi-ui yak yuksip-peossenteu isang-i hanja-eo-eseo birotdwaeseumnida.', 'More than about 60% of the total vocabulary originates from Sino-Korean.', 4),
    (l_id, '학생', '한자를 어떻게 공부하는 것이 효과적입니까?', 'Hanja-reul eotteoke gongbu-haneun geos-i hyogwajeogimnigga?', 'What is the most effective way to study hanja?', 5),
    (l_id, '선생님', '자주 쓰이는 한자어와 그 구성 한자를 함께 배우는 것이 좋습니다.', 'Jaju sseuineun hanja-eo-wa geu guseong hanja-reul hamkke baeumyeon geos-i joseumnida.', 'It is good to learn commonly used Sino-Korean words and their component hanja together.', 6),
    (l_id, '학생', '부수는 무엇입니까?', 'Busu-neun mueosimnikka?', 'What is a radical?', 7),
    (l_id, '선생님', '부수는 한자를 분류하는 기준이 되는 기본 구성 요소입니다.', 'Busu-neun hanja-reul bullyu-haneun gibjun-i doeneun gibon guseong yoso-imnida.', 'A radical is the basic component used to classify Chinese characters.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '한자 "學"의 의미는?', '["language","country","learning/study","mountain"]', 2, '學 (학) means learning or study. It appears in words like 학교 (school) and 학생 (student).', 1),
    (l_id, '"人口"를 한자 의미로 풀면?', '["mountain + water","person + mouth","country + language","fire + wood"]', 1, '人口 (인구) = 人 (person) + 口 (mouth) = population.', 2),
    (l_id, '한자어 "국어"에서 "國"의 의미는?', '["study","language","country","person"]', 2, '國 (국) means country. 국어 = 國(country) + 語(language) = national language.', 3),
    (l_id, '한자를 분류하는 기본 구성 요소를 무엇이라고 합니까?', '["획","부수","음독","훈독"]', 1, '부수 (radical) is the basic component used to classify Chinese characters in dictionaries.', 4),
    (l_id, '"수도"(水道)를 한자 성분으로 풀면?', '["fire + wood","person + mouth","water + way/road","mountain + water"]', 2, '水道 (수도) = 水 (water) + 道 (way/road) → can mean water pipe or capital city.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한자는 중국에서 기원한 문자로, 한국어 어휘의 약 60% 이상이 한자에서 유래한 한자어입니다. 한자를 이해하면 한국어 어휘를 더 쉽게 익힐 수 있습니다. 예를 들어, ''學''(학)은 ''배움''을 의미하며 학교, 학생, 학문, 학습 등 수많은 단어에 포함됩니다. ''國''(국)은 ''나라''를 의미하며 국가, 국민, 외국, 국어 등에 쓰입니다. 각 한자는 고유한 뜻과 음을 가지며, 다른 한자와 결합하여 복합어를 만듭니다. 부수는 한자를 분류하는 기준으로, 사전에서 한자를 찾을 때 유용합니다. 한자 학습은 어휘력을 키우고 한국어 이해를 깊게 하는 데 도움이 됩니다.', 'Hanja are characters originating in China, and more than about 60% of Korean vocabulary comes from Sino-Korean (hanja-derived) words. Understanding hanja makes it easier to learn Korean vocabulary. For example, 學 (hak) means "learning" and is found in countless words such as school, student, scholarship, and learning. 國 (guk) means "country" and is used in words like nation, citizen, foreign country, and national language. Each hanja has its own meaning and pronunciation and combines with other hanja to form compound words. Radicals are the basis for classifying hanja and are useful when looking up characters in a dictionary. Learning hanja helps build vocabulary and deepen understanding of Korean.', 1);
END $$;

-- ============================================================
-- Lesson 117: Advanced Negation (심화 부정)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 117;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=117 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '부정', 'bujeong', 'negation, denial', 1),
    (l_id, '거부하다', 'geobu-hada', 'to refuse, reject', 2),
    (l_id, '반박하다', 'banbak-hada', 'to refute, rebut', 3),
    (l_id, '부인하다', 'buin-hada', 'to deny', 4),
    (l_id, '결코', 'gyeolko', 'never, by no means (emphatic)', 5),
    (l_id, '전혀', 'jeonhyeo', 'not at all', 6),
    (l_id, '도저히', 'dojeohi', 'simply cannot (impossibility)', 7),
    (l_id, '아무리', 'amuri', 'no matter how', 8),
    (l_id, '절대로', 'jeoldaero', 'absolutely not, never', 9),
    (l_id, '도무지', 'domuji', 'simply not (bewilderment)', 10),
    (l_id, '부정어', 'bujeong-eo', 'negative word', 11),
    (l_id, '이중부정', 'ijung-bujeong', 'double negation', 12),
    (l_id, '반어', 'baneo', 'irony, sarcasm', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Emphatic negation: 결코/절대로 -지 않다', '결코/절대로 V-지 않다', 'Adds strong emphasis to a negative statement: "never / absolutely not". Used in formal and strong refusals.', '[{"korean":"저는 결코 포기하지 않겠습니다.","english":"I will never give up."},{"korean":"그것은 절대로 사실이 아닙니다.","english":"That is absolutely not true."},{"korean":"이 비밀은 결코 밝혀지지 않을 것입니다.","english":"This secret will never be revealed."}]', 1),
    (l_id, 'Impossibility negation: 도저히 -지 못하다', '도저히 V-지 못하다', 'Expresses that something is simply impossible to do, despite wanting to or trying.', '[{"korean":"도저히 이 문제를 혼자 해결하지 못하겠습니다.","english":"I simply cannot solve this problem alone."},{"korean":"도저히 이해가 되지 않습니다.","english":"I simply cannot understand it."},{"korean":"도저히 그 고통을 참지 못했습니다.","english":"I simply could not endure that pain."}]', 2),
    (l_id, 'Concessive negation: 아무리 -아도/어도 -지 않다', '아무리 V/A-아도/어도 -지 않다', 'Expresses "no matter how... still not". Combines concession with negation.', '[{"korean":"아무리 노력해도 소용이 없었습니다.","english":"No matter how hard I tried, it was no use."},{"korean":"아무리 비싸도 사지 않을 겁니다.","english":"No matter how expensive, I won''t buy it."},{"korean":"아무리 설득해도 생각을 바꾸지 않았습니다.","english":"No matter how much I persuaded, they didn''t change their mind."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '친구A', '너 그 소문 들었어? 민수가 회사 돈을 횡령했다고 하던데.', 'Neo geu somun deureoeo? Minsu-ga hoesa don-eul hoengnyeong-haetdago hadonde.', 'Did you hear that rumor? They say Minsu embezzled company money.', 1),
    (l_id, '친구B', '전혀 믿을 수 없어. 민수는 절대로 그런 짓을 할 사람이 아니야.', 'Jeonhyeo mideul su eopseo. Minsu-neun jeoldaero geureon jit-eul hal saram-i aniya.', 'I can''t believe it at all. Minsu is absolutely not the kind of person to do such a thing.', 2),
    (l_id, '친구A', '그럼 왜 그런 소문이 도는 걸까?', 'Geureom wae geureon somun-i doneun geolkka?', 'Then why is such a rumor going around?', 3),
    (l_id, '친구B', '도무지 이해가 되지 않아. 누군가가 일부러 퍼트리는 거 아닐까?', 'Domuji ihae-ga doeji ana. Nugungga-ga ilburo peoteurineun geo anilkka?', 'I simply don''t understand. Isn''t someone spreading it on purpose?', 4),
    (l_id, '친구A', '아무리 소문이 돌아도 증거가 없으면 사실이 아닐 수도 있잖아.', 'Amuri somun-i doraborado jeunggeo-ga eopseumyeon sasil-i anil sudo itjana.', 'No matter how the rumor spreads, without evidence it may not be true.', 5),
    (l_id, '친구B', '맞아. 결코 사실 확인 없이 소문을 퍼트려서는 안 돼.', 'Maja. Gyeolko sasil hwakin eopsi somun-eul peotteuryeoseoneun an dwae.', 'Right. We should never spread rumors without verifying the facts.', 6),
    (l_id, '친구A', '나도 그냥 들은 이야기라서 도저히 사실인지 아닌지 판단이 안 돼.', 'Nado geunyang deureon iyagiraso dojeohi sasil-inji aninjipadani an dwae.', 'I also just heard it, so I simply cannot judge whether it''s true or not.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '"저는 결코 포기하지 않겠습니다"에서 "결코"의 기능은?', '["완전 부정 강조","가능성 표현","조건 표현","추측 표현"]', 0, '결코 is an emphatic adverb used with negation to mean "never / absolutely not."', 1),
    (l_id, '"아무리 비싸도 사지 않을 겁니다"의 의미는?', '["가격이 비싸므로 사지 않겠다","가격이 얼마이든 상관없이 사지 않겠다","가격이 비싸지 않으면 사겠다","가격이 적당하면 사겠다"]', 1, '아무리 -아도/어도 expresses "no matter how... still (negative result)."', 2),
    (l_id, '불가능을 강조하는 부정 부사로 "도저히"와 같은 의미를 가진 단어는?', '["전혀","결코","절대로","도무지"]', 3, '도무지 also expresses impossibility or bewilderment — very similar to 도저히. Both can precede 못하다.', 3),
    (l_id, '이중 부정 "~지 않을 수 없다"의 의미는?', '["완전한 부정","강한 긍정","모름","불가능"]', 1, 'Double negation -지 않을 수 없다 = "cannot not do" = strong affirmation, "must/have to."', 4),
    (l_id, '"전혀 모르다"에서 "전혀"의 역할은?', '["동사 수식","완전한 부정 강조","시간 표현","추측 표현"]', 1, '전혀 is a negation adverb meaning "not at all" — it emphasizes complete negation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어의 부정 표현은 단순한 "안"과 "못"을 넘어 다양한 방식으로 표현됩니다. 결코, 절대로, 전혀, 도저히, 도무지 같은 부정 부사들은 부정의 강도나 성격을 달리합니다. 결코와 절대로는 강한 의지나 단호한 부정을 나타내며, 전혀는 완전한 부재를 강조합니다. 도저히는 아무리 노력해도 불가능한 상황을, 도무지는 이해할 수 없는 당혹감을 표현합니다. 아무리 -아도 구조는 어떤 조건에서도 달라지지 않는 사실을 부정할 때 사용됩니다. 이중 부정은 -지 않을 수 없다처럼 부정을 두 번 써서 오히려 강한 긍정을 만들어 냅니다. 이러한 다양한 부정 표현을 익히면 더욱 정확하고 표현력 있는 한국어를 구사할 수 있습니다.', 'Korean negation goes far beyond simple "an" (not) and "mot" (cannot) to express various nuances. Negative adverbs like gyeolko (never), jeoldaero (absolutely not), jeonhyeo (not at all), dojeohi (simply cannot), and domuji (simply bewildered) differ in the degree and nature of negation. 결코 and 절대로 express strong will or firm denial, while 전혀 emphasizes complete absence. 도저히 expresses an impossible situation no matter how hard one tries, and 도무지 conveys bewilderment at something incomprehensible. The structure 아무리 -아도/어도 is used when negating something that stays the same under any condition. Double negation, as in -지 않을 수 없다, uses two negatives to actually create a strong affirmative. Mastering these various negative expressions enables more precise and expressive Korean.', 1);
END $$;

-- ============================================================
-- Lesson 118: Aspectual Expressions (상 표현)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 118;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=118 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '상', 'sang', 'aspect (grammatical)', 1),
    (l_id, '완료', 'wamryo', 'completion, perfective aspect', 2),
    (l_id, '진행', 'jinhaeng', 'progress, progressive aspect', 3),
    (l_id, '지속', 'jisok', 'continuation, continuative aspect', 4),
    (l_id, '반복', 'banbok', 'repetition, habitual aspect', 5),
    (l_id, '시작', 'sijak', 'beginning, inceptive aspect', 6),
    (l_id, '종결', 'jonggyeol', 'end, terminative aspect', 7),
    (l_id, '결과', 'gyeolgwa', 'result, resultant state', 8),
    (l_id, '순간', 'sungan', 'momentary, punctual', 9),
    (l_id, '유지', 'yuji', 'maintenance, sustaining state', 10),
    (l_id, '동작', 'dongjak', 'action, movement', 11),
    (l_id, '상태', 'sangtae', 'state, condition', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Resultant state: -아/어 있다', 'V-아/어 있다', 'Expresses a state resulting from a completed action (resultant state aspect). Used with achievement/change-of-state verbs.', '[{"korean":"문이 열려 있습니다.","english":"The door is open (as a result of having been opened)."},{"korean":"그림이 벽에 걸려 있습니다.","english":"The painting is hanging on the wall."},{"korean":"꽃이 피어 있습니다.","english":"The flower is in bloom (has bloomed and remains so)."}]', 1),
    (l_id, 'Ongoing action vs resultant state: -고 있다 vs -아/어 있다', 'V-고 있다 (ongoing) / V-아/어 있다 (resultant state)', 'Contrasts progressive aspect (action in progress) with resultant state (maintained result of completed action).', '[{"korean":"앉고 있다 (앉는 동작 중) vs 앉아 있다 (앉은 상태)","english":"Sitting down (in the process of sitting) vs. seated (the state of having sat down)"},{"korean":"입고 있다 (입는 동작 중) vs 입어 있다 (입은 상태)","english":"Putting on (in the process of dressing) vs. wearing (the state of being dressed)"}]', 2),
    (l_id, 'Completion with result: -아/어 버리다', 'V-아/어 버리다', 'Expresses complete and final completion of an action, often with a sense of relief or regret.', '[{"korean":"숙제를 다 해 버렸습니다.","english":"I''ve completely finished my homework (relief)."},{"korean":"지갑을 잃어 버렸습니다.","english":"I''ve lost my wallet (regret)."},{"korean":"음식을 다 먹어 버렸습니다.","english":"I''ve eaten up all the food."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '친구A', '아직 준비 중이야?', 'Ajik junbi jung-iya?', 'Are you still getting ready?', 1),
    (l_id, '친구B', '아니, 이미 다 준비해 버렸어.', 'Ani, imi da junbi-hae beoryeosseo.', 'No, I''ve already completely finished getting ready.', 2),
    (l_id, '친구A', '옷도 다 입어 있어?', 'Otdo da ibeo isseo?', 'Are you already dressed too?', 3),
    (l_id, '친구B', '응, 입어 있어. 신발도 신고 있어.', 'Eung, ibeo isseo. Sinbaldo sinneun jung-iya.', 'Yes, I''m dressed. I''m putting my shoes on too.', 4),
    (l_id, '친구A', '빨리 나와. 버스가 와 있어.', 'Ppalli naowa. Beoseuga wa isseo.', 'Come out quickly. The bus is already here (parked and waiting).', 5),
    (l_id, '친구B', '알았어. 문 잠가 버릴게.', 'Araseo. Mun jamga beorillge.', 'Got it. I''ll go ahead and lock the door (and be done with it).', 6),
    (l_id, '친구A', '가방은?', 'Gabang-eun?', 'What about the bag?', 7),
    (l_id, '친구B', '어제 다 챙겨 놓았어. 가방 안에 다 들어 있어.', 'Eoje da chaenggyeo noaseo. Gabang ane da deureo isseo.', 'I packed it all yesterday. Everything is already inside the bag.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '"문이 열려 있다"에서 "-아/어 있다"가 나타내는 의미는?', '["동작이 진행 중","완료된 동작의 결과 상태","곧 일어날 일","반복되는 행동"]', 1, '-아/어 있다 expresses a resultant state — the maintained result of a completed action.', 1),
    (l_id, '"앉고 있다"와 "앉아 있다"의 차이는?', '["차이가 없다","앉고 있다는 앉는 동작 중, 앉아 있다는 앉은 상태","앉고 있다는 앉은 상태, 앉아 있다는 앉는 동작 중","둘 다 진행형이다"]', 1, '-고 있다 = action in progress; -아/어 있다 = resultant state of being seated.', 2),
    (l_id, '"숙제를 다 해 버렸다"에서 "-아/어 버리다"의 뉘앙스는?', '["행동이 아직 진행 중","행동이 완전히 완료됨(후련함 혹은 아쉬움)","행동을 하려고 함","행동이 반복됨"]', 1, '-아/어 버리다 expresses complete and final completion, with connotations of relief or regret.', 3),
    (l_id, '"지갑을 잃어 버렸다"에서 "-아/어 버리다"가 나타내는 감정은?', '["후련함","아쉬움/후회","기쁨","놀람"]', 1, 'When -아/어 버리다 is used with an undesirable outcome, it expresses regret or dismay.', 4),
    (l_id, '상태 동사와 함께 쓰여 현재 유지 중인 상태를 나타내는 표현은?', '["-고 있다","-아/어 있다","-아/어 버리다","-아/어 놓다"]', 1, '-아/어 있다 is used with achievement/change-of-state verbs to express a maintained resultant state.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어의 상(aspect)은 동작이나 사건의 시간적 내적 구조를 나타냅니다. "-고 있다"는 동작이 현재 진행 중임을 나타내는 진행상입니다. "-아/어 있다"는 동작이 완료된 후 그 결과 상태가 유지되고 있음을 나타내는 결과상입니다. 예를 들어, "앉고 있다"는 앉는 행위가 진행 중임을 의미하고, "앉아 있다"는 이미 앉아 있는 상태를 의미합니다. "-아/어 버리다"는 행위의 완전한 완료를 나타내며, 후련함이나 아쉬움의 감정을 동반하기도 합니다. "-아/어 놓다"는 미래를 대비한 준비 완료를, "-아/어 두다"는 상태의 의도적 유지를 나타냅니다. 이러한 다양한 상 표현을 정확히 사용하면 더 세밀하고 풍부한 한국어 표현이 가능합니다.', 'Korean aspect expresses the internal temporal structure of actions or events. "-고 있다" is the progressive aspect, indicating that an action is currently in progress. "-아/어 있다" is the resultant aspect, expressing that the result of a completed action is being maintained. For example, "앉고 있다" means the act of sitting is in progress, while "앉아 있다" means one is already in the seated state. "-아/어 버리다" indicates complete and final completion of an action, sometimes accompanied by feelings of relief or regret. "-아/어 놓다" expresses preparation for the future, while "-아/어 두다" indicates the intentional maintenance of a state. Using these various aspectual expressions accurately allows for more nuanced and rich Korean expression.', 1);
END $$;

-- ============================================================
-- Lesson 119: Modal Expressions (양태 표현)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 119;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=119 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '양태', 'yangtae', 'modality (grammatical)', 1),
    (l_id, '추측', 'chusuk', 'inference, conjecture', 2),
    (l_id, '가능성', 'ganeungseong', 'possibility', 3),
    (l_id, '필연성', 'piryeonseong', 'necessity, inevitability', 4),
    (l_id, '허가', 'heoga', 'permission', 5),
    (l_id, '의무', 'uimu', 'obligation, duty', 6),
    (l_id, '의도', 'uido', 'intention', 7),
    (l_id, '바람', 'baram', 'wish, desire', 8),
    (l_id, '확신', 'hwaksin', 'conviction, certainty', 9),
    (l_id, '불확실', 'bulhwakssil', 'uncertainty', 10),
    (l_id, '추정', 'chujeong', 'estimation, inference', 11),
    (l_id, '당위', 'dangwi', 'what ought to be, normativity', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'Epistemic modality: -(으)ㄹ 것이다 vs -(으)ㄹ 텐데', 'V-(으)ㄹ 것이다 / V-(으)ㄹ 텐데', 'Two ways to express inference about the future or current situation. -(으)ㄹ 것이다 = neutral inference; -(으)ㄹ 텐데 = inference with concern or background information.', '[{"korean":"오늘 비가 올 것입니다. (중립적 추측)","english":"It will rain today. (neutral inference)"},{"korean":"지금쯤 도착했을 텐데 왜 연락이 없지? (배경 정보 포함)","english":"They should have arrived by now, but why no contact? (inference with concern)"}]', 1),
    (l_id, 'Deontic modality: -아야/어야 하다 vs -(으)면 되다', 'V-아야/어야 하다 (obligation) / V-(으)면 되다 (sufficiency)', 'Contrasts strong obligation ("must do") with sufficiency ("it''s enough to do").', '[{"korean":"반드시 신분증을 가져와야 합니다. (의무)","english":"You must bring your ID. (obligation)"},{"korean":"신분증만 가져오면 됩니다. (충분 조건)","english":"All you need is to bring your ID. (sufficiency)"},{"korean":"일찍 도착해야 합니다 vs 일찍만 오면 됩니다.","english":"You must arrive early vs. You just need to come early (that''s enough)."}]', 2),
    (l_id, 'Volitive modality: -(으)려고 하다 vs -(으)ㄹ까 하다', 'V-(으)려고 하다 / V-(으)ㄹ까 하다', '-(으)려고 하다 expresses firm intention; -(으)ㄹ까 하다 expresses tentative consideration.', '[{"korean":"내년에 유학을 가려고 합니다. (확실한 의도)","english":"I intend to study abroad next year. (firm intention)"},{"korean":"내년에 유학을 갈까 합니다. (막연한 고려)","english":"I''m thinking of maybe going to study abroad next year. (tentative consideration)"}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '직원', '이 서류를 내일까지 제출해야 합니까?', 'I seoryu-reul naeil-kkaji jechulhaeya hapnikka?', 'Do I have to submit these documents by tomorrow?', 1),
    (l_id, '상사', '네, 반드시 내일까지 제출해야 합니다.', 'Ne, bandusi naeil-kkaji jechulhaeya habnida.', 'Yes, you must submit them by tomorrow without fail.', 2),
    (l_id, '직원', '어디에 제출하면 됩니까?', 'Eodie jechulhameyon doemnikka?', 'Where do I just need to submit them?', 3),
    (l_id, '상사', '인사과에 제출하면 됩니다.', 'Insagwa-e jechulhameyon doemnikka.', 'You just need to submit them to the HR department.', 4),
    (l_id, '직원', '이 양식을 모두 작성해야 합니까?', 'I yangsik-eul modu jakseong-haeya hapnikka?', 'Do I have to fill out all of this form?', 5),
    (l_id, '상사', '앞 두 페이지만 작성하면 됩니다.', 'Ap du peiji-man jakseong-hameyon doemnikka.', 'You just need to fill out the first two pages.', 6),
    (l_id, '직원', '팀장님은 언제쯤 돌아오실까요?', 'Timjangnim-eun eonjejjeum doraosilkkayo?', 'When do you think the team leader will be back?', 7),
    (l_id, '상사', '회의가 세 시에 끝날 텐데 그 이후에 오실 겁니다.', 'Hoeui-ga se si-e kkeutnal tende geu ihu-e osigeosseo.', 'The meeting should end at 3, so they will come after that.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '"오늘 비가 올 것입니다"와 "오늘 비가 올 텐데"의 차이는?', '["차이가 없다","올 것이다는 중립적 추측, 올 텐데는 배경 정보나 걱정이 담긴 추측","올 텐데가 더 확실하다","올 것이다는 과거, 올 텐데는 미래"]', 1, '-(으)ㄹ 것이다 = neutral inference; -(으)ㄹ 텐데 = inference with background info or concern.', 1),
    (l_id, '"인사과에 제출하면 됩니다"에서 "-면 되다"의 의미는?', '["반드시 해야 한다","그렇게 하면 충분하다","해서는 안 된다","해도 되고 안 해도 된다"]', 1, '-(으)면 되다 expresses sufficiency: "it is enough to do X / all you need to do is X."', 2),
    (l_id, '"내년에 유학을 가려고 합니다"와 "갈까 합니다"의 차이는?', '["차이 없음","가려고 하다는 확실한 의도, 갈까 하다는 막연한 고려","갈까 하다가 더 확실함","가려고 하다는 과거 계획"]', 1, '-(으)려고 하다 = firm intention; -(으)ㄹ까 하다 = tentative consideration.', 3),
    (l_id, '다음 중 의무(반드시 해야 함)를 나타내는 표현은?', '["-면 됩니다","-아도 됩니다","-아야 합니다","-도록 됩니다"]', 2, '-아야/어야 합니다 expresses obligation: "you must do."', 4),
    (l_id, '"지금쯤 도착했을 텐데"에서 "-을 텐데"가 나타내는 것은?', '["확실한 사실","허가","배경 정보를 바탕으로 한 추측","의무"]', 2, '-(으)ㄹ 텐데 expresses inference based on background information, often with implied concern.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '양태(modality)는 화자가 사건이나 상황에 대해 가지는 태도를 표현하는 문법 범주입니다. 한국어의 양태 표현은 인식 양태와 의무 양태로 크게 나눌 수 있습니다. 인식 양태는 가능성, 추측, 확신의 정도를 나타내며, -(으)ㄹ 것이다, -(으)ㄹ 텐데, -(으)ㄹ까, -겠- 등이 사용됩니다. 의무 양태는 의무, 허가, 금지 등을 나타내며, -아야/어야 하다, -(으)면 되다, -(으)면 안 되다 등이 사용됩니다. 의지 양태는 화자의 의도나 바람을 나타내며, -(으)려고 하다, -(으)ㄹ까 하다 등이 있습니다. 이러한 양태 표현들을 정확히 구분하여 사용하면 더 세련되고 정확한 한국어 의사소통이 가능합니다.', 'Modality is a grammatical category expressing the speaker''s attitude toward an event or situation. Korean modal expressions can be broadly divided into epistemic modality and deontic modality. Epistemic modality expresses degrees of possibility, inference, and certainty, using forms such as -(으)ㄹ 것이다, -(으)ㄹ 텐데, -(으)ㄹ까, and -겠-. Deontic modality expresses obligation, permission, and prohibition, using forms such as -아야/어야 하다, -(으)면 되다, and -(으)면 안 되다. Volitive modality expresses the speaker''s intention or wish, using forms like -(으)려고 하다 and -(으)ㄹ까 하다. Accurately distinguishing and using these modal expressions enables more sophisticated and precise Korean communication.', 1);
END $$;

-- ============================================================
-- Lesson 120: TOPIK 3 Review (토픽 3 복습)
-- ============================================================
DO $$
DECLARE
  l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'korean-1' AND sort_order = 120;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=120 not found — skipping'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary  WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar     WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises   WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading     WHERE lesson_id = l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
    (l_id, '총정리', 'chongjeongni', 'overall review, comprehensive summary', 1),
    (l_id, '숙달', 'sukdal', 'proficiency, mastery', 2),
    (l_id, '자연스럽다', 'jayeonseureobda', 'to be natural, fluent', 3),
    (l_id, '표현력', 'pyohyeonnyeok', 'expressive ability', 4),
    (l_id, '정확성', 'jeong-hwakseong', 'accuracy, precision', 5),
    (l_id, '유창성', 'yuchang-seong', 'fluency', 6),
    (l_id, '어휘력', 'eohwiryeok', 'vocabulary ability', 7),
    (l_id, '독해력', 'dokhaelyeok', 'reading comprehension ability', 8),
    (l_id, '작문', 'jamun', 'composition, writing', 9),
    (l_id, '맥락', 'maengnak', 'context', 10),
    (l_id, '뉘앙스', 'nyuiangseu', 'nuance', 11),
    (l_id, '격식체', 'gyeoksikche', 'formal register/style', 12),
    (l_id, '비격식체', 'bigyeoksikche', 'informal register/style', 13),
    (l_id, '언어 능력', 'eoneo neungnyeok', 'language proficiency', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
    (l_id, 'B1 grammar review: discourse connectives', 'Review of key B1/TOPIK 3 connectives', 'Comprehensive review of key discourse connectives at the B1/TOPIK 3 level including concession, causation, and contrast.', '[{"korean":"뿐만 아니라 — 그녀는 영어뿐만 아니라 한국어도 잘합니다.","english":"Not only that — She is good not only at English but also at Korean."},{"korean":"에도 불구하고 — 어려움에도 불구하고 목표를 달성했습니다.","english":"Despite — Despite difficulties, I achieved my goal."},{"korean":"는 바람에 — 늦게 일어나는 바람에 지각했습니다.","english":"Because of (unexpected) — Because I woke up late, I was late."}]', 1),
    (l_id, 'B1 grammar review: complex sentence endings', 'Review of key B1/TOPIK 3 sentence endings', 'Review of advanced sentence endings that express modality, aspect, and register at B1/TOPIK 3 level.', '[{"korean":"-(으)ㄹ 텐데 — 지금쯤 도착했을 텐데 걱정되네요.","english":"Should (inference with concern) — They should have arrived by now, I''m worried."},{"korean":"-(으)ㄹ 뿐이다 — 저는 도움이 되고 싶을 뿐입니다.","english":"Only/nothing but — I only want to be of help."},{"korean":"-아/어 버리다 — 비밀을 다 말해 버렸습니다.","english":"Completely done (relief/regret) — I went ahead and told all the secrets."}]', 2),
    (l_id, 'Formal writing review: academic style markers', 'Formal academic writing style', 'Key features of formal/academic Korean writing style used in TOPIK 3 writing tasks.', '[{"korean":"-(으)므로 — 시간이 촉박하므로 신속히 결정해야 합니다.","english":"Therefore/since (formal) — Since time is short, we must decide quickly."},{"korean":"-음/ㅁ이 밝혀지다 — 이 물질이 유해함이 밝혀졌습니다.","english":"It has been revealed that — It has been revealed that this substance is harmful."},{"korean":"-에 따르면 — 연구 결과에 따르면 운동이 건강에 좋습니다.","english":"According to — According to research results, exercise is good for health."}]', 3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
    (l_id, '선생님', 'TOPIK 3 수준에 도달했군요. 어떤 부분이 가장 어려웠습니까?', 'TOPIK sam sujeun-e dodalhaetgunyo. Eotteon bubun-i gajang eoryeowotsseumnikka?', 'You have reached TOPIK 3 level. What part was most difficult for you?', 1),
    (l_id, '학생', '격식체와 비격식체를 구분하고 적절하게 사용하는 것이 어려웠습니다.', 'Gyeoksikche-wa bigyeoksikche-reul gubunhago jeokjeolhage sayonganeun geos-i eoryeowotsseumnida.', 'Distinguishing and appropriately using formal and informal registers was difficult.', 2),
    (l_id, '선생님', '글쓰기에서 가장 중요한 것은 뉘앙스와 맥락을 파악하는 것입니다.', 'Geulsseuge-eseo gajang jungyohan geos-eun nyuiangseu-wa maengnak-eul pa-ak-aneun geosimnida.', 'The most important thing in writing is understanding nuance and context.', 3),
    (l_id, '학생', '말하기와 쓰기에서 표현력을 높이려면 어떻게 해야 합니까?', 'Malhagi-wa sseugi-eseo pyohyeonnyeok-eul nopireuryeon eotteoke haeya hapnikka?', 'What should I do to improve my expressive ability in speaking and writing?', 4),
    (l_id, '선생님', '다양한 텍스트를 많이 읽고 핵심 표현들을 직접 사용해 보는 것이 중요합니다.', 'Dayanghan tekseoteu-reul mani ikgo haeksim pyohyeondeul-eul jikjeop sayongahae boneun geos-i jungyohabnida.', 'It is important to read many diverse texts and directly use key expressions.', 5),
    (l_id, '학생', '어휘력을 늘리는 가장 좋은 방법은 무엇입니까?', 'Eohwiryeok-eul neullrineun gajang joeun bangbeom-eun mueosimnikka?', 'What is the best way to expand vocabulary?', 6),
    (l_id, '선생님', '맥락 속에서 단어를 익히고 어원과 한자를 함께 공부하면 효과적입니다.', 'Maengnak sog-eseo daneo-reul ikigo eowon-gwa hanja-reul hamkke gongbu-hameyon hyogwajeogimnida.', 'It is effective to learn words in context and study etymology and hanja together.', 7),
    (l_id, '학생', '이 과정을 마치고 나니 한국어 실력이 많이 늘었음을 느낍니다.', 'I gwajeong-eul machigo nani hangug-eo sillye-ogi mani neureosseumeuol neukkibnida.', 'Having completed this course, I feel that my Korean proficiency has improved a lot.', 8),
    (l_id, '선생님', '잘 하셨습니다! 꾸준히 연습하면 TOPIK 4 수준도 곧 달성하실 수 있을 겁니다.', 'Jal hasyeotsseumnida! Kkujunhi yeonseub-hameyon TOPIK sa sujeundo got dalseonghasyeol su isseul geomnida.', 'Well done! If you keep practicing consistently, you will soon be able to reach TOPIK 4 level as well.', 9),
    (l_id, '학생', '감사합니다. 앞으로도 열심히 하겠습니다.', 'Gamsahabnida. Apeurodo yeolsimhi hagesseumnida.', 'Thank you. I will continue to work hard.', 10);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
    (l_id, '"뿐만 아니라"의 의미로 가장 적절한 것은?', '["그러나","왜냐하면","not only...but also","비록...지만"]', 2, '뿐만 아니라 means "not only...but also" — adds an additional item to what was already mentioned.', 1),
    (l_id, '"어려움에도 불구하고 성공했다"에서 "에도 불구하고"의 의미는?', '["because of","despite","as a result of","instead of"]', 1, '에도 불구하고 means "despite/in spite of" — a concessive connector at the B1 level.', 2),
    (l_id, '"늦게 일어나는 바람에 지각했다"에서 "-는 바람에"의 의미는?', '["because of a positive event","because of an unexpected negative cause","despite","in order to"]', 1, '-는 바람에 expresses an unexpected negative cause that led to a bad result.', 3),
    (l_id, '격식적 글쓰기에서 인과 관계를 나타내는 가장 격식적인 표현은?', '["그래서","때문에","-(으)므로","이어서"]', 2, '-(으)므로 is the most formal connective for cause-and-effect, used in academic and official writing.', 4),
    (l_id, '"지금쯤 도착했을 텐데"에서 "-을 텐데"가 나타내는 것은?', '["확실한 미래","금지","배경 정보에 근거한 추측","허가"]', 2, '-(으)ㄹ 텐데 expresses inference based on background knowledge, often with concern or expectation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
    (l_id, '한국어 학습의 여정을 돌아보면, 기초적인 발음과 문자 학습에서 시작하여 복잡한 문법 구조와 고급 표현에 이르기까지 긴 여정을 걸어 왔습니다. TOPIK 3 수준은 일상적인 의사소통뿐만 아니라 다양한 주제에 대해 비교적 자연스럽게 표현할 수 있는 단계입니다. 이 수준에서는 맥락에 맞는 격식체와 비격식체 사용, 뉘앙스 파악, 그리고 복잡한 연결 표현 사용이 중요합니다. 어려움에도 불구하고 꾸준히 노력한 것이 지금의 실력을 만들었습니다. 언어 학습은 끊임없는 과정이므로, 앞으로도 독서, 말하기 연습, 쓰기 훈련을 통해 지속적으로 발전해 나가시기 바랍니다. 한국어를 통해 한국의 문화, 역사, 사람들을 더 깊이 이해하는 여정이 계속되기를 바랍니다. 수고 많으셨습니다!', 'Looking back on the journey of learning Korean, we have traveled a long road from basic pronunciation and character learning to complex grammatical structures and advanced expressions. TOPIK 3 level is a stage where one can express oneself relatively naturally not only in everyday communication but also on various topics. At this level, it is important to use formal and informal registers appropriately in context, understand nuances, and use complex connective expressions. Persevering through difficulties is what has built your current proficiency. Since language learning is a continuous process, we hope you will continue to develop through reading, speaking practice, and writing training. May the journey of understanding Korean culture, history, and people more deeply through Korean continue. Well done — you have worked hard!', 1);
END $$;
