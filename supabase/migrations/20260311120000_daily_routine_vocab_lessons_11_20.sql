-- Daily Routine: Lessons 11-20 — 20 vocabulary words each
-- Cooking, Eating, Doing the Dishes, Cleaning, Laundry,
-- Gardening, Telephone, Television, Radio, Web Surfing

DO $$
DECLARE
  cooking_id   uuid;
  eating_id    uuid;
  dishes_id    uuid;
  cleaning_id  uuid;
  laundry_id   uuid;
  garden_id    uuid;
  phone_id     uuid;
  tv_id        uuid;
  radio_id     uuid;
  web_id       uuid;
BEGIN
  SELECT id INTO cooking_id  FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 11;
  SELECT id INTO eating_id   FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 12;
  SELECT id INTO dishes_id   FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 13;
  SELECT id INTO cleaning_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 14;
  SELECT id INTO laundry_id  FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 15;
  SELECT id INTO garden_id   FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 16;
  SELECT id INTO phone_id    FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 17;
  SELECT id INTO tv_id       FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 18;
  SELECT id INTO radio_id    FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 19;
  SELECT id INTO web_id      FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 20;

  -- Delete existing data to avoid duplicates
  DELETE FROM public.lesson_vocabulary WHERE lesson_id IN (cooking_id, eating_id, dishes_id, cleaning_id, laundry_id, garden_id, phone_id, tv_id, radio_id, web_id);
  DELETE FROM public.lesson_grammar WHERE lesson_id IN (cooking_id, eating_id, dishes_id, cleaning_id, laundry_id, garden_id, phone_id, tv_id, radio_id, web_id);
  DELETE FROM public.lesson_dialogues WHERE lesson_id IN (cooking_id, eating_id, dishes_id, cleaning_id, laundry_id, garden_id, phone_id, tv_id, radio_id, web_id);
  DELETE FROM public.lesson_exercises WHERE lesson_id IN (cooking_id, eating_id, dishes_id, cleaning_id, laundry_id, garden_id, phone_id, tv_id, radio_id, web_id);
  DELETE FROM public.lesson_reading WHERE lesson_id IN (cooking_id, eating_id, dishes_id, cleaning_id, laundry_id, garden_id, phone_id, tv_id, radio_id, web_id);

  -- ============================================================
  -- LESSON 11: COOKING (요리하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (cooking_id, '요리하다',    'yorihada',         'to cook',            1),
  (cooking_id, '주방',        'jubang',           'kitchen',            2),
  (cooking_id, '프라이팬',    'peulaipan',        'frying pan',         3),
  (cooking_id, '냄비',        'naembi',           'pot/saucepan',       4),
  (cooking_id, '칼',          'kal',              'knife',              5),
  (cooking_id, '도마',        'doma',             'cutting board',      6),
  (cooking_id, '볶다',        'bokkda',           'to stir-fry',        7),
  (cooking_id, '끓이다',      'kkeulhida',        'to boil',            8),
  (cooking_id, '굽다',        'gupda',            'to grill/bake',      9),
  (cooking_id, '튀기다',      'twigida',          'to deep-fry',        10),
  (cooking_id, '썰다',        'sseolda',          'to slice/chop',      11),
  (cooking_id, '섞다',        'seokda',           'to mix/stir',        12),
  (cooking_id, '재료',        'jaelyo',           'ingredient',         13),
  (cooking_id, '양념',        'yangnyeom',        'seasoning/sauce',    14),
  (cooking_id, '레시피',      'resip-i',          'recipe',             15),
  (cooking_id, '가스레인지',  'gaseuLeInji',      'gas stove',          16),
  (cooking_id, '오븐',        'obeun',            'oven',               17),
  (cooking_id, '전자레인지',  'jeonjaleInji',     'microwave oven',     18),
  (cooking_id, '냉장고',      'naengjan-go',      'refrigerator',       19),
  (cooking_id, '앞치마',      'apchima',          'apron',              20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (cooking_id, 'Using ~면서 (while doing)', '~면서', 'Expresses two simultaneous actions. 요리하면서 노래를 들어요 (I listen to music while cooking)', 1),
  (cooking_id, 'Using ~고 싶다 (want to do)', '~고 싶다', 'Expresses desire. 한국 음식을 요리하고 싶다 (I want to cook Korean food)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (cooking_id, '수진', '오늘 저녁 뭐 요리할 거야?', 'Oneul jeonyeok mwo yorilhal geoya?', 'What are you going to cook for dinner tonight?', 1),
  (cooking_id, '민호', '볶음밥을 만들려고. 프라이팬 어디 있어?', 'Bokkeum-bab-eul mandeuryeogo. Peulaipan eodi isseo?', 'I''m going to make fried rice. Where''s the frying pan?', 2),
  (cooking_id, '수진', '가스레인지 옆에 있어. 재료는 다 있어?', 'GaseuLeInji yeop-e isseo. Jaelyo-neun da isseo?', 'It''s next to the stove. Do you have all the ingredients?', 3),
  (cooking_id, '민호', '응, 양념도 있고 다 준비됐어!', 'Eung, yangnyeom-do itgo da junbidwaesseo!', 'Yes, I have the seasoning and everything is ready!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (cooking_id, '"프라이팬"은 무엇입니까?', '["knife", "frying pan", "pot", "cutting board"]', 1, '"프라이팬" means frying pan', 1),
  (cooking_id, '음식을 볶을 때 어떤 동사를 씁니까?', '["끓이다", "굽다", "볶다", "튀기다"]', 2, '"볶다" means to stir-fry', 2),
  (cooking_id, '"냉장고"는 무엇입니까?', '["microwave", "oven", "refrigerator", "stove"]', 2, '"냉장고" is a refrigerator', 3),
  (cooking_id, '요리할 때 입는 옷은?', '["치마", "앞치마", "셔츠", "바지"]', 1, '"앞치마" is an apron worn when cooking', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (cooking_id, '나는 요리하는 것을 좋아한다. 주방에서 신선한 재료를 준비하고, 도마 위에서 야채를 썰고, 프라이팬에 기름을 두르고 볶으면 맛있는 음식이 완성된다. 레시피를 따라 요리하면 더 맛있게 만들 수 있다. 앞치마를 두르고 냉장고에서 재료를 꺼내 요리를 시작하자!', 'I love to cook. Prepare fresh ingredients in the kitchen, slice vegetables on a cutting board, heat oil in a frying pan and stir-fry to create a delicious dish. Following a recipe makes it even tastier. Put on your apron, take ingredients out of the refrigerator, and let''s start cooking!', 1);

  -- ============================================================
  -- LESSON 12: EATING (식사하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (eating_id, '먹다',       'meokda',         'to eat',              1),
  (eating_id, '밥',         'bab',            'rice / meal',         2),
  (eating_id, '그릇',       'geureut',        'bowl/dish',           3),
  (eating_id, '접시',       'jeopsi',         'plate',               4),
  (eating_id, '숟가락',     'sutgarag',       'spoon',               5),
  (eating_id, '젓가락',     'jeotgarag',      'chopsticks',          6),
  (eating_id, '포크',       'pokeu',          'fork',                7),
  (eating_id, '컵',         'keop',           'cup',                 8),
  (eating_id, '냅킨',       'naepkin',        'napkin',              9),
  (eating_id, '식탁',       'siktak',         'dining table',        10),
  (eating_id, '의자',       'uija',           'chair',               11),
  (eating_id, '맛있다',     'masitda',        'to be delicious',     12),
  (eating_id, '배가 고프다','baega gopeuda',  'to be hungry',        13),
  (eating_id, '배부르다',   'baebureuda',     'to be full',          14),
  (eating_id, '아침식사',   'achimsiksа',     'breakfast',           15),
  (eating_id, '점심식사',   'jeomsimsiksa',   'lunch',               16),
  (eating_id, '저녁식사',   'jeonyeoksiksa',  'dinner',              17),
  (eating_id, '간식',       'gansik',         'snack',               18),
  (eating_id, '반찬',       'banchan',        'side dish',           19),
  (eating_id, '국',         'guk',            'soup',                20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (eating_id, 'Using ~을/를 먹다 (eat something)', '~을/를 먹다', 'Object marker + 먹다. 밥을 먹다 (eat rice), 국을 먹다 (eat soup)', 1),
  (eating_id, 'Using ~이/가 맛있다 (something is delicious)', '~이/가 맛있다', 'Subject marker + 맛있다. 김치가 맛있다 (Kimchi is delicious)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (eating_id, '엄마', '밥 먹어! 식탁에 앉아.', 'Bab meogeo! Siktak-e anja.', 'Come eat! Sit at the dining table.', 1),
  (eating_id, '아이', '배가 고파요. 오늘 저녁은 뭐예요?', 'Baega gopa-yo. Oneul jeonyeok-eun mwoyeyo?', 'I''m hungry. What''s for dinner tonight?', 2),
  (eating_id, '엄마', '김치찌개랑 반찬이야. 숟가락이랑 젓가락 가져와.', 'Gimchijjigaerang banchan-iya. Sutgarag-irang jeotgarag gajyeowa.', 'It''s kimchi stew and side dishes. Bring the spoon and chopsticks.', 3),
  (eating_id, '아이', '와, 맛있겠다! 잘 먹겠습니다.', 'Wa, masitgetda! Jal meokgesseumnida.', 'Wow, it looks delicious! Thank you for the meal!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (eating_id, '"젓가락"은 무엇입니까?', '["spoon", "fork", "chopsticks", "knife"]', 2, '"젓가락" means chopsticks', 1),
  (eating_id, '"배가 고프다"는 무슨 의미입니까?', '["to be full", "to be thirsty", "to be hungry", "to be tired"]', 2, '"배가 고프다" means to be hungry', 2),
  (eating_id, '아침에 먹는 식사는?', '["저녁식사", "점심식사", "간식", "아침식사"]', 3, '"아침식사" is breakfast', 3),
  (eating_id, '한국 밥상에서 국과 함께 나오는 것은?', '["dessert", "반찬 (side dishes)", "coffee", "juice"]', 1, '"반찬" are Korean side dishes served with meals', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (eating_id, '한국에서는 식사할 때 숟가락과 젓가락을 함께 사용한다. 밥과 국은 숟가락으로 먹고, 반찬은 젓가락으로 먹는다. 식탁에 앉아서 가족과 함께 맛있는 밥을 먹는 것은 하루 중 가장 행복한 시간이다. 식사 전에는 "잘 먹겠습니다", 식사 후에는 "잘 먹었습니다"라고 말하는 것이 한국의 예절이다.', 'In Korea, both a spoon and chopsticks are used during meals. Rice and soup are eaten with a spoon, and side dishes are eaten with chopsticks. Sitting at the table and eating a delicious meal with family is the happiest time of the day. Saying "jal meokgesseumnida" before meals and "jal meogeosseumnida" after meals is Korean etiquette.', 1);

  -- ============================================================
  -- LESSON 13: DOING THE DISHES (설거지하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (dishes_id, '설거지하다',  'seolgeojihada',    'to do the dishes',     1),
  (dishes_id, '접시',        'jeopsi',           'plate',                2),
  (dishes_id, '그릇',        'geureut',          'bowl',                 3),
  (dishes_id, '컵',          'keop',             'cup/glass',            4),
  (dishes_id, '냄비',        'naembi',           'pot',                  5),
  (dishes_id, '프라이팬',    'peulaipan',        'frying pan',           6),
  (dishes_id, '수세미',      'susemi',           'scrubber/sponge',      7),
  (dishes_id, '주방 세제',   'jubang seje',      'dish soap/detergent',  8),
  (dishes_id, '싱크대',      'singkeudae',       'kitchen sink',         9),
  (dishes_id, '헹구다',      'haenguda',         'to rinse',             10),
  (dishes_id, '닦다',        'dakkda',           'to wipe/scrub',        11),
  (dishes_id, '물기를 빼다', 'mulgireul ppaeda', 'to drain water',       12),
  (dishes_id, '건조대',      'geoniodae',        'dish drying rack',     13),
  (dishes_id, '수건',        'sugeon',           'towel/cloth',          14),
  (dishes_id, '식기세척기',  'sikgisechokgi',    'dishwasher',           15),
  (dishes_id, '기름기',      'gireumgi',         'grease/oiliness',      16),
  (dishes_id, '찌든 때',     'jjideun ttae',     'stubborn stain',       17),
  (dishes_id, '뜨거운 물',   'tteugeoun mul',    'hot water',            18),
  (dishes_id, '깨끗하다',    'kkaekkeuthada',    'to be clean',          19),
  (dishes_id, '정리하다',    'jeongrihada',      'to tidy up/organize',  20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (dishes_id, 'Using ~은/는 내가 할게 (I will do ~)', '~은/는 내가 할게', 'Expresses volunteering. 설거지는 내가 할게 (I will do the dishes)', 1),
  (dishes_id, 'Using ~다가 (while doing, then)', '~다가', 'Expresses switching mid-action. 설거지를 하다가 그릇을 깼어 (While doing dishes, I broke a bowl)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (dishes_id, '아버지', '밥 다 먹었으면 설거지 좀 해줘.', 'Bab da meogeosseumyeon seolgeoji jom haejwo.', 'If you''re done eating, please do the dishes.', 1),
  (dishes_id, '자녀', '접시랑 냄비도 다 씻어야 해요?', 'Jeopseurang naembido da ssisseoya haeyo?', 'Do I need to wash the plates and pot too?', 2),
  (dishes_id, '아버지', '응. 수세미에 주방 세제 묻혀서 깨끗이 닦아.', 'Eung. Susemi-e jubang seje muthjyeoseo kkaekkeushi dakka.', 'Yes. Put dish soap on the sponge and scrub it clean.', 3),
  (dishes_id, '자녀', '알겠어요. 식기세척기에 넣으면 안 돼요?', 'Algetsoyo. Sikgisechokgi-e neoheumyeon an dwaeyo?', 'Okay. Can''t I just put them in the dishwasher?', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (dishes_id, '"수세미"는 무엇입니까?', '["dish soap", "scrubber/sponge", "sink", "towel"]', 1, '"수세미" is a scrubber or sponge for washing dishes', 1),
  (dishes_id, '그릇을 씻은 후 어디에 놓습니까?', '["식탁", "건조대", "냉장고", "서랍"]', 1, '"건조대" is the drying rack where you put washed dishes', 2),
  (dishes_id, '"싱크대"는 무엇입니까?', '["stove", "refrigerator", "kitchen sink", "dishwasher"]', 2, '"싱크대" is the kitchen sink', 3),
  (dishes_id, '기름진 그릇을 씻을 때 필요한 것은?', '["cold water only", "주방 세제 (dish soap)", "paper only", "sand"]', 1, 'Need dish soap to cut through grease', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (dishes_id, '식사 후에는 설거지를 해야 한다. 먼저 싱크대에 뜨거운 물을 틀고 수세미에 주방 세제를 묻혀 접시, 그릇, 컵, 냄비, 프라이팬을 하나씩 닦는다. 기름기가 많은 그릇은 특히 꼼꼼하게 닦아야 한다. 깨끗이 닦은 후 물로 충분히 헹구고 건조대에 올려놓는다. 요즘은 식기세척기를 사용하는 가정도 많다.', 'After eating, the dishes must be done. First, turn on hot water at the sink, apply dish soap to a sponge, and wash each plate, bowl, cup, pot, and frying pan one by one. Greasy dishes need extra attention. After washing clean, rinse thoroughly and place on the drying rack. Nowadays many households use a dishwasher.', 1);

  -- ============================================================
  -- LESSON 14: CLEANING (청소하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (cleaning_id, '청소하다',    'cheongsohada',     'to clean',              1),
  (cleaning_id, '빗자루',      'bitjaru',          'broom',                 2),
  (cleaning_id, '쓰레받기',    'sseurebaetgi',     'dustpan',               3),
  (cleaning_id, '걸레',        'geollae',          'mop/rag',               4),
  (cleaning_id, '청소기',      'cheongsogi',       'vacuum cleaner',        5),
  (cleaning_id, '먼지',        'meonji',           'dust',                  6),
  (cleaning_id, '쓰레기',      'sseulegi',         'trash/garbage',         7),
  (cleaning_id, '쓰레기통',    'sseulegitong',     'trash bin/can',         8),
  (cleaning_id, '걸레질하다',  'geollaejilhada',   'to mop',                9),
  (cleaning_id, '닦다',        'dakkda',           'to wipe clean',         10),
  (cleaning_id, '쓸다',        'sseulda',          'to sweep',              11),
  (cleaning_id, '버리다',      'beorida',          'to throw away',         12),
  (cleaning_id, '정리하다',    'jeongrihada',      'to organize/tidy',      13),
  (cleaning_id, '세제',        'seje',             'detergent/cleaner',     14),
  (cleaning_id, '분리수거',    'bunrisugeо',       'recycling/sorting',     15),
  (cleaning_id, '유리창',      'yurichan',         'glass window',          16),
  (cleaning_id, '욕실',        'yoksil',           'bathroom',              17),
  (cleaning_id, '화장실',      'hwajangshil',      'toilet room',           18),
  (cleaning_id, '먼지떨이',    'meonjiddeori',     'feather duster',        19),
  (cleaning_id, '깔끔하다',    'kkalkkeumhada',    'to be neat/spotless',   20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (cleaning_id, 'Using ~아/어야 하다 (have to)', '~아/어야 하다', 'Obligation. 청소를 해야 한다 (I have to clean)', 1),
  (cleaning_id, 'Using ~고 나면 (once done, then)', '~고 나면', 'After completion. 청소하고 나면 기분이 좋다 (Once I clean, I feel good)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (cleaning_id, '언니', '방이 너무 지저분해. 청소 좀 해!', 'Bang-i neomu jijeoobunhae. Cheongso jom hae!', 'Your room is too messy. Clean it up!', 1),
  (cleaning_id, '동생', '청소기 어디 있어? 먼지가 많아.', 'Cheongsogi eodi isseo? Meonjiga mana.', 'Where''s the vacuum? There''s a lot of dust.', 2),
  (cleaning_id, '언니', '창고에 있어. 빗자루랑 쓰레받기도 써.', 'Changgo-e isseo. Bitjaru-rang sseurebaetgido sseo.', 'It''s in the storage room. Use the broom and dustpan too.', 3),
  (cleaning_id, '동생', '알겠어. 쓰레기도 정리해서 버릴게.', 'Algetsseo. Sseuleogi-do jeonglihaeseo beorilge.', 'Got it. I''ll organize and throw out the garbage too.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (cleaning_id, '"청소기"는 무엇입니까?', '["broom", "mop", "vacuum cleaner", "dustpan"]', 2, '"청소기" is a vacuum cleaner', 1),
  (cleaning_id, '바닥을 쓸 때 사용하는 것은?', '["걸레", "청소기", "빗자루", "세제"]', 2, '"빗자루" is a broom for sweeping', 2),
  (cleaning_id, '"먼지"는 무엇입니까?', '["water", "dust", "stain", "smell"]', 1, '"먼지" means dust', 3),
  (cleaning_id, '집을 깔끔하게 유지하려면?', '["ignore it", "정기적으로 청소하다", "only clean once a year", "never open windows"]', 1, 'Clean regularly to keep a neat house', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (cleaning_id, '깨끗한 집을 유지하려면 매일 청소하는 습관이 중요하다. 먼저 빗자루로 바닥을 쓸고 쓰레받기로 먼지를 모아 버린다. 그 다음 청소기로 카펫이나 소파의 먼지를 빨아들인다. 걸레로 바닥을 닦으면 더 깨끗해진다. 쓰레기는 종류별로 분리수거를 해야 한다. 이렇게 청소하고 나면 집이 깔끔해지고 기분도 좋아진다.', 'Developing a daily cleaning habit is important to maintain a clean home. First, sweep the floor with a broom and collect dust in a dustpan to discard. Then use a vacuum cleaner to suck up dust from carpets or sofas. Mopping the floor makes it even cleaner. Garbage must be separated for recycling. After cleaning this way, the home becomes spotless and you feel better too.', 1);

  -- ============================================================
  -- LESSON 15: LAUNDRY (빨래하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (laundry_id, '빨래하다',     'ppallahada',        'to do laundry',         1),
  (laundry_id, '세탁기',       'setakgi',           'washing machine',       2),
  (laundry_id, '건조기',       'geonjogi',          'dryer',                 3),
  (laundry_id, '세제',         'seje',              'laundry detergent',     4),
  (laundry_id, '섬유유연제',   'seomyuyuyeonje',    'fabric softener',       5),
  (laundry_id, '빨래줄',       'ppallaejul',        'clothesline',           6),
  (laundry_id, '빨래집게',     'ppallaejipge',      'clothes pin/peg',       7),
  (laundry_id, '다림질하다',   'darimjilhada',      'to iron clothes',       8),
  (laundry_id, '다리미',       'darimi',            'iron (appliance)',      9),
  (laundry_id, '빨래판',       'ppallaepan',        'washboard',             10),
  (laundry_id, '세탁소',       'setakso',           'dry cleaner/laundromat',11),
  (laundry_id, '더러운',       'deoreooon',         'dirty',                 12),
  (laundry_id, '깨끗한',       'kkaekkeutan',       'clean',                 13),
  (laundry_id, '빨다',         'ppalda',            'to wash (clothes)',     14),
  (laundry_id, '헹구다',       'haenguda',          'to rinse',              15),
  (laundry_id, '탈수하다',     'talsuhada',         'to spin dry',           16),
  (laundry_id, '널다',         'neolda',            'to hang out (clothes)', 17),
  (laundry_id, '개다',         'gaeda',             'to fold (clothes)',     18),
  (laundry_id, '얼룩',         'eolluk',            'stain',                 19),
  (laundry_id, '흰옷',         'huinot',            'white clothing',        20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (laundry_id, 'Using ~어/아 놓다 (do and leave ready)', '~어/아 놓다', 'Completed preparatory action. 세탁기에 넣어 놓다 (Put in washing machine and leave)', 1),
  (laundry_id, 'Using ~이/가 되다 (become)', '~이/가 되다', 'State change. 옷이 깨끗해졌다 (The clothes have become clean)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (laundry_id, '엄마', '빨래 세탁기에 넣었어?', 'Ppallae setakgi-e neoheosseo?', 'Did you put the laundry in the washing machine?', 1),
  (laundry_id, '딸', '응, 세제도 넣고 돌렸어.', 'Eung, seje-do neogo dollyeosseo.', 'Yes, I added detergent and started it.', 2),
  (laundry_id, '엄마', '다 되면 빨래줄에 잘 널어야 해.', 'Da doemyeon ppallaejul-e jal neoreoya hae.', 'When it''s done, hang it on the clothesline properly.', 3),
  (laundry_id, '딸', '알겠어. 나중에 개서 옷장에 넣을게.', 'Algetsseo. Najunge gaeseo otjang-e neoheulge.', 'Got it. I''ll fold it later and put it in the wardrobe.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (laundry_id, '"세탁기"는 무엇입니까?', '["dryer", "iron", "washing machine", "clothesline"]', 2, '"세탁기" is a washing machine', 1),
  (laundry_id, '옷을 세탁기에 넣기 전에 무엇을 확인해야 합니까?', '["color", "세탁 레이블 (laundry label)", "price", "smell"]', 1, 'Check the laundry label before washing', 2),
  (laundry_id, '"얼룩"은 무엇입니까?', '["fabric softener", "detergent", "stain", "clothespin"]', 2, '"얼룩" means a stain on clothing', 3),
  (laundry_id, '세탁 후 옷을 어떻게 합니까?', '["throw away", "fold and put in wardrobe", "leave on floor", "give away"]', 1, 'Fold clothes and put in the wardrobe', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (laundry_id, '일주일에 한두 번 빨래를 한다. 더러운 옷을 세탁기에 넣고 세제와 섬유유연제를 넣은 후 세탁기를 돌린다. 세탁이 끝나면 빨래줄에 빨래집게로 하나하나 널어서 말린다. 완전히 마른 후에는 다림질이 필요한 옷은 다리미로 펴고, 나머지는 깔끔하게 개어서 옷장에 넣는다. 얼룩이 있는 흰옷은 세탁소에 맡기기도 한다.', 'Laundry is done once or twice a week. Put dirty clothes in the washing machine, add detergent and fabric softener, then start the machine. When washing is done, hang each item on the clothesline with clothes pins to dry. Once fully dry, iron clothes that need it and neatly fold the rest into the wardrobe. White clothes with stains are sometimes taken to the dry cleaner.', 1);

  -- ============================================================
  -- LESSON 16: GARDENING (정원 가꾸기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (garden_id, '정원',       'jeongwon',       'garden',               1),
  (garden_id, '식물',       'singmul',        'plant',                2),
  (garden_id, '꽃',         'kkot',           'flower',               3),
  (garden_id, '나무',       'namu',           'tree',                 4),
  (garden_id, '씨앗',       'ssiat',          'seed',                 5),
  (garden_id, '흙',         'heuk',           'soil/dirt',            6),
  (garden_id, '화분',       'hwabun',         'flower pot',           7),
  (garden_id, '물뿌리개',   'mulppurigae',    'watering can',         8),
  (garden_id, '삽',         'sap',            'shovel/spade',         9),
  (garden_id, '호미',       'homi',           'hand hoe/weeder',      10),
  (garden_id, '물을 주다',  'muleul juda',    'to water (plants)',    11),
  (garden_id, '심다',       'simda',          'to plant/sow',         12),
  (garden_id, '자르다',     'jareuda',        'to cut/trim',          13),
  (garden_id, '잡초',       'japcho',         'weed',                 14),
  (garden_id, '비료',       'biryo',          'fertilizer',           15),
  (garden_id, '가지치기',   'gajichigi',      'pruning',              16),
  (garden_id, '수확하다',   'suhwakada',      'to harvest',           17),
  (garden_id, '채소밭',     'chaessobat',     'vegetable garden',     18),
  (garden_id, '잔디',       'jandi',          'lawn/grass',           19),
  (garden_id, '장갑',       'janggap',        'gloves',               20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (garden_id, 'Using ~을 심다 (to plant something)', '~을 심다', 'Object + 심다. 씨앗을 심다 (plant seeds), 꽃을 심다 (plant flowers)', 1),
  (garden_id, 'Using ~이/가 자라다 (to grow)', '~이/가 자라다', 'Subject + 자라다. 식물이 잘 자란다 (The plant grows well)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (garden_id, '할머니', '오늘 정원에 꽃씨를 심을 거야.', 'Oneul jeongwon-e kkotssi-reul simul geoya.', 'I''m going to plant flower seeds in the garden today.', 1),
  (garden_id, '손녀', '제가 도와드릴게요! 물뿌리개 가져올까요?', 'Jega dowadrillgeyo! Mulppurigae gajyeoolgkayo?', 'I''ll help you! Should I bring the watering can?', 2),
  (garden_id, '할머니', '응, 그리고 삽이랑 장갑도 가져와.', 'Eung, geurigo sab-irang janggap-do gajyeowa.', 'Yes, and bring the shovel and gloves too.', 3),
  (garden_id, '손녀', '잡초는 다 뽑아야 해요?', 'Japcho-neun da ppobaya haeyo?', 'Do we need to pull out all the weeds?', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (garden_id, '"화분"은 무엇입니까?', '["shovel", "watering can", "flower pot", "seed"]', 2, '"화분" is a flower pot', 1),
  (garden_id, '식물에 물을 줄 때 사용하는 것은?', '["삽", "호미", "물뿌리개", "비료"]', 2, '"물뿌리개" is a watering can', 2),
  (garden_id, '"잡초"는 무엇입니까?', '["flower", "tree", "weed", "seed"]', 2, '"잡초" means weed', 3),
  (garden_id, '정원 가꾸기를 할 때 손을 보호하려면?', '["bare hands", "장갑 끼기 (wear gloves)", "plastic bag", "tape"]', 1, 'Wear gloves to protect your hands', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (garden_id, '나는 정원 가꾸기를 즐긴다. 봄이 되면 화분에 씨앗을 심고 물을 준다. 식물이 잘 자라도록 비료도 주고, 잡초가 생기면 호미로 뽑아낸다. 꽃이 만발하면 정원이 아름다워진다. 채소밭에서는 직접 토마토, 오이, 고추를 수확해서 먹을 수 있다. 정원 가꾸기는 스트레스 해소에도 도움이 된다.', 'I enjoy gardening. When spring comes, I plant seeds in flower pots and water them. I also add fertilizer so plants grow well, and when weeds appear, I pull them out with a hand hoe. When flowers bloom, the garden becomes beautiful. In the vegetable garden, I can harvest and eat tomatoes, cucumbers, and peppers myself. Gardening also helps relieve stress.', 1);

  -- ============================================================
  -- LESSON 17: TELEPHONE (전화하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (phone_id, '전화하다',    'jeonhwahada',      'to make a phone call',    1),
  (phone_id, '전화기',      'jeonhwagi',        'telephone/phone',         2),
  (phone_id, '스마트폰',    'seumateupon',      'smartphone',              3),
  (phone_id, '전화번호',    'jeonhwabeonho',    'phone number',            4),
  (phone_id, '통화하다',    'tonghwahada',      'to talk on the phone',    5),
  (phone_id, '전화를 받다', 'jeonhwaleul batda','to answer the phone',     6),
  (phone_id, '전화를 끊다', 'jeonhwaleul kkeutda','to hang up',            7),
  (phone_id, '문자메시지',  'munja mesiji',     'text message',            8),
  (phone_id, '벨소리',      'belsooli',         'ringtone',                9),
  (phone_id, '통화중',      'tonghwajung',      'line busy / on a call',   10),
  (phone_id, '음성사서함',  'eumseongsaseoham', 'voicemail',               11),
  (phone_id, '수신',        'susin',            'incoming call',           12),
  (phone_id, '발신',        'balsin',           'outgoing call',           13),
  (phone_id, '배터리',      'baeteori',         'battery',                 14),
  (phone_id, '충전하다',    'chungjeonhada',    'to charge (battery)',     15),
  (phone_id, '국제전화',    'gukjejeonhwa',     'international call',      16),
  (phone_id, '응급전화',    'eunggeubjeonhwa',  'emergency call',          17),
  (phone_id, '무음',        'mueum',            'silent mode',             18),
  (phone_id, '스피커폰',    'seupikeopon',      'speakerphone',            19),
  (phone_id, '화상통화',    'hwasangtonghwa',   'video call',              20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (phone_id, 'Using ~에게/한테 전화하다 (call someone)', '~에게 전화하다', 'To call someone. 친구에게 전화하다 (call a friend)', 1),
  (phone_id, 'Using ~고 있다 (currently doing)', '~고 있다', 'Ongoing action. 지금 통화하고 있다 (I am currently on the phone)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (phone_id, '지수', '여보세요? 민준 씨 전화 맞아요?', 'Yeoboseyo? Minjun ssi jeonhwa majayo?', 'Hello? Is this Minjun''s phone?', 1),
  (phone_id, '민준', '네, 저 민준이에요. 누구세요?', 'Ne, jeo minjun-ieyo. Nuguseyo?', 'Yes, this is Minjun. Who is this?', 2),
  (phone_id, '지수', '저 지수예요. 오늘 몇 시에 만날까요?', 'Jeo jisuye-yo. Oneul myeot sie mannalkkayo?', 'It''s Jisu. What time shall we meet today?', 3),
  (phone_id, '민준', '3시 어때요? 문자로 주소 보내드릴게요.', 'Sesshi eottaeyo? Munja-ro juso bonaedrillgeyo.', 'How about 3 o''clock? I''ll send you the address by text.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (phone_id, '"전화를 받다"는 무슨 의미입니까?', '["to make a call", "to answer the phone", "to hang up", "to send a text"]', 1, '"전화를 받다" means to answer the phone', 1),
  (phone_id, '전화 배터리가 없을 때는?', '["throw away", "충전하다 (charge it)", "break it", "buy a new one"]', 1, '"충전하다" means to charge the battery', 2),
  (phone_id, '"문자메시지"는 무엇입니까?', '["phone call", "voicemail", "text message", "video call"]', 2, '"문자메시지" is a text message', 3),
  (phone_id, '전화로 얼굴을 보면서 통화하는 것은?', '["스피커폰", "음성사서함", "화상통화", "국제전화"]', 2, '"화상통화" is a video call', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (phone_id, '오늘날 스마트폰은 일상생활에서 없어서는 안 될 중요한 도구이다. 전화를 걸고 받는 것뿐만 아니라 문자메시지, 화상통화, 인터넷 검색 등 다양한 기능을 갖추고 있다. 전화번호를 저장해 두면 쉽게 전화할 수 있다. 중요한 상황에서는 응급전화를 이용해야 한다. 공공장소에서는 벨소리를 무음으로 해두는 것이 예의이다.', 'Smartphones have become an indispensable tool in daily life today. They not only make and receive calls, but also offer diverse functions like text messaging, video calls, and internet browsing. Saving phone numbers makes it easy to call people. Emergency calls should be used in important situations. In public places, it is polite to set the ringtone to silent mode.', 1);

  -- ============================================================
  -- LESSON 18: TELEVISION (텔레비전 보기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (tv_id, '텔레비전',    'tellebijon',        'television/TV',           1),
  (tv_id, '리모컨',      'rimokeon',          'remote control',          2),
  (tv_id, '채널',        'chaennel',          'channel',                 3),
  (tv_id, '볼륨',        'bollyum',           'volume',                  4),
  (tv_id, '드라마',      'deurama',           'TV drama/series',         5),
  (tv_id, '뉴스',        'nyuseu',            'news',                    6),
  (tv_id, '예능',        'yeneung',           'entertainment show',      7),
  (tv_id, '다큐멘터리',  'dakyumeonteo-ri',   'documentary',             8),
  (tv_id, '영화',        'yeonghwa',          'movie',                   9),
  (tv_id, '만화',        'manhwa',            'cartoon/animation',       10),
  (tv_id, '방송',        'bangsong',          'broadcast',               11),
  (tv_id, '광고',        'gwanggo',           'advertisement/commercial',12),
  (tv_id, '켜다',        'kyeoda',            'to turn on',              13),
  (tv_id, '끄다',        'kkeuda',            'to turn off',             14),
  (tv_id, '틀다',        'teulda',            'to switch on/tune',       15),
  (tv_id, '재방송',      'jaebangsong',       'rerun/re-broadcast',      16),
  (tv_id, '자막',        'jamak',             'subtitles',               17),
  (tv_id, '넷플릭스',    'netseupeullekseu',  'Netflix',                 18),
  (tv_id, '스트리밍',    'seuteuriiming',     'streaming',               19),
  (tv_id, '화질',        'hwajil',            'picture quality',         20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (tv_id, 'Using ~을/를 보다 (to watch something)', '~을/를 보다', 'Object + 보다. 드라마를 보다 (watch a drama), 뉴스를 보다 (watch the news)', 1),
  (tv_id, 'Using ~면서 (while)', '~면서', 'Two simultaneous actions. TV를 보면서 밥을 먹다 (eat while watching TV)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (tv_id, '아들', '아빠, 리모컨 어디 있어요?', 'Appa, rimokeon eodi isseoyo?', 'Dad, where is the remote control?', 1),
  (tv_id, '아빠', '소파 밑에 있을 거야. 무슨 채널 볼 거야?', 'Sopa mithe issul geoya. Museon chaennel bol geoya?', 'It should be under the sofa. What channel are you going to watch?', 2),
  (tv_id, '아들', '오늘 드라마 재방송 해요. 자막도 있대요.', 'Oneul deurama jaebangsong haeyo. Jamakdo itdaeyo.', 'There''s a drama rerun today. They say it has subtitles.', 3),
  (tv_id, '아빠', '나는 뉴스 볼게. 넷플릭스로 보는 게 어때?', 'Naneun nyuseu bolge. Netseupeullekseu-ro boneun ge eottae?', 'I''ll watch the news. How about watching on Netflix?', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (tv_id, '"리모컨"은 무엇입니까?', '["TV", "channel", "remote control", "volume"]', 2, '"리모컨" is a remote control', 1),
  (tv_id, 'TV를 켤 때 사용하는 동사는?', '["끄다", "켜다", "닫다", "열다"]', 1, '"켜다" means to turn on', 2),
  (tv_id, '"자막"은 무엇입니까?', '["advertisement", "subtitles", "documentary", "channel"]', 1, '"자막" means subtitles', 3),
  (tv_id, '이미 방영된 TV 프로그램을 다시 보여주는 것은?', '["뉴스", "광고", "재방송", "예능"]', 2, '"재방송" is a rerun', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (tv_id, '저녁을 먹고 나서 온 가족이 함께 텔레비전을 보는 것은 즐거운 시간이다. 리모컨으로 채널을 바꾸며 드라마, 뉴스, 예능 등 다양한 프로그램을 볼 수 있다. 요즘은 넷플릭스 같은 스트리밍 서비스로 원하는 시간에 영화와 드라마를 즐길 수 있다. 외국어 프로그램은 자막이 있어서 이해하기 쉽다. 다만 TV를 너무 많이 보는 것은 건강에 좋지 않다.', 'Watching TV together as a family after dinner is an enjoyable time. Using the remote control to change channels, you can watch various programs like dramas, news, and entertainment shows. These days, streaming services like Netflix allow you to enjoy movies and dramas whenever you want. Foreign language programs have subtitles making them easy to understand. However, watching too much TV is not good for your health.', 1);

  -- ============================================================
  -- LESSON 19: RADIO (라디오 듣기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (radio_id, '라디오',      'radio',            'radio',                    1),
  (radio_id, '주파수',      'jupasu',           'frequency',                2),
  (radio_id, '방송국',      'bangsongguk',      'broadcasting station',     3),
  (radio_id, 'AM',          'eii em',           'AM (Amplitude Modulation)',4),
  (radio_id, 'FM',          'epe em',           'FM (Frequency Modulation)',5),
  (radio_id, '진행자',      'jinhaengja',       'host/MC',                  6),
  (radio_id, '청취자',      'cheongtwijа',      'listener',                 7),
  (radio_id, '음악방송',    'eumakbangsong',    'music show',               8),
  (radio_id, '뉴스',        'nyuseu',           'news',                     9),
  (radio_id, '날씨예보',    'nalssiyebo',       'weather forecast',         10),
  (radio_id, '교통정보',    'gyotongjongbo',    'traffic information',      11),
  (radio_id, '사연',        'sayeon',           'story/listener request',   12),
  (radio_id, '신청곡',      'sincheonggok',     'song request',             13),
  (radio_id, '잡음',        'jabeum',           'static noise',             14),
  (radio_id, '수신 상태',   'susin sangtae',    'reception/signal',         15),
  (radio_id, '안테나',      'antena',           'antenna',                  16),
  (radio_id, '듣다',        'deutda',           'to listen',                17),
  (radio_id, '켜다',        'kyeoda',           'to turn on',               18),
  (radio_id, '끄다',        'kkeuda',           'to turn off',              19),
  (radio_id, '팟캐스트',    'patkaeseuteu',     'podcast',                  20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (radio_id, 'Using ~을/를 듣다 (to listen to)', '~을/를 듣다', 'Object + 듣다. 라디오를 듣다 (listen to the radio), 음악을 듣다 (listen to music)', 1),
  (radio_id, 'Using ~에서 방송하다 (broadcast on/from)', '~에서 방송하다', 'Location + 방송하다. 서울에서 방송하다 (broadcast from Seoul)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (radio_id, '운전자', '라디오 좀 켜줄 수 있어?', 'Radio jom kyeojul su isseo?', 'Can you turn on the radio?', 1),
  (radio_id, '동승자', '어떤 채널? FM이 좋아? AM이 좋아?', 'Eotteon chaennel? FM-i joa? AM-i joa?', 'Which channel? Do you like FM or AM?', 2),
  (radio_id, '운전자', '교통정보 나오는 데로 맞춰줘.', 'Gyotongjongbo naoneun dero matchyeojwo.', 'Tune it to wherever the traffic info is on.', 3),
  (radio_id, '동승자', '잡음이 심한데, 안테나 조절해볼게.', 'Jabeum-i simhandae, antena jojolhaebbolge.', 'There''s a lot of static, I''ll try adjusting the antenna.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (radio_id, '"청취자"는 무엇입니까?', '["host", "broadcaster", "listener", "reporter"]', 2, '"청취자" means a radio listener', 1),
  (radio_id, '라디오에서 교통 상황을 알 수 있는 정보는?', '["날씨예보", "교통정보", "사연", "음악방송"]', 1, '"교통정보" is traffic information', 2),
  (radio_id, '"잡음"은 무엇입니까?', '["music", "news", "static noise", "weather"]', 2, '"잡음" is static or interference noise', 3),
  (radio_id, '청취자가 듣고 싶은 노래를 신청하는 것은?', '["사연", "진행자", "신청곡", "방송국"]', 2, '"신청곡" is a song request from listeners', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (radio_id, '라디오는 오래된 미디어이지만 아직도 많은 사람들이 즐겨 듣는다. 특히 운전 중에 라디오를 켜놓으면 음악을 들으면서 교통정보와 날씨예보도 들을 수 있어 유용하다. 진행자는 청취자들이 보낸 사연을 읽어주거나 신청곡을 틀어주기도 한다. 수신 상태가 나쁠 때는 잡음이 생기는데 안테나를 조절하면 나아진다. 요즘은 팟캐스트도 라디오의 인기 있는 대안이 되고 있다.', 'Radio is an old medium, but still enjoyed by many people. Especially while driving, turning on the radio is useful as you can listen to music while also hearing traffic information and weather forecasts. Hosts read listener stories or play song requests. When reception is poor, static occurs, but adjusting the antenna improves it. Nowadays, podcasts are also becoming a popular alternative to radio.', 1);

  -- ============================================================
  -- LESSON 20: WEB SURFING (인터넷 하기)
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (web_id, '인터넷',      'inteonet',           'internet',               1),
  (web_id, '검색하다',    'geomseokada',        'to search',              2),
  (web_id, '웹사이트',    'wepsaiteu',          'website',                3),
  (web_id, '홈페이지',    'hompeiji',           'homepage',               4),
  (web_id, '클릭하다',    'keullikhada',        'to click',               5),
  (web_id, '다운로드',    'daunlodeu',          'download',               6),
  (web_id, '업로드',      'eomrodeu',           'upload',                 7),
  (web_id, '소셜미디어',  'sosyeol midio',      'social media',           8),
  (web_id, '유튜브',      'yutyubeu',           'YouTube',                9),
  (web_id, '인스타그램',  'inseutagram',        'Instagram',              10),
  (web_id, '이메일',      'imeil',              'email',                  11),
  (web_id, '비밀번호',    'bimilbeonho',        'password',               12),
  (web_id, '아이디',      'aidi',               'username/ID',            13),
  (web_id, '로그인',      'rogeuin',            'log in',                 14),
  (web_id, '로그아웃',    'rogeaaut',           'log out',                15),
  (web_id, '와이파이',    'waipai',             'Wi-Fi',                  16),
  (web_id, '앱',          'aep',                'app/application',        17),
  (web_id, '북마크',      'bukmaku',            'bookmark',               18),
  (web_id, '댓글',        'daetgeul',           'comment (online)',       19),
  (web_id, '해킹',        'haeking',            'hacking',                20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (web_id, 'Using ~을/를 검색하다 (to search for)', '~을/를 검색하다', 'Object + 검색하다. 정보를 검색하다 (search for information)', 1),
  (web_id, 'Using ~에 접속하다 (to connect/access)', '~에 접속하다', 'Location + 접속하다. 인터넷에 접속하다 (access the internet)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (web_id, '학생', '선생님, 와이파이 비밀번호가 뭐예요?', 'Seonsaengnim, waipai bimilbeonho-ga mwoyeyo?', 'Teacher, what is the Wi-Fi password?', 1),
  (web_id, '선생님', '12345678이야. 로그인하면 인터넷 검색할 수 있어.', '12345678iya. Rogeuinhamyeon inteonet geomseokal su isseo.', 'It''s 12345678. Once logged in, you can search the internet.', 2),
  (web_id, '학생', '유튜브에서 영상 다운로드해도 돼요?', 'Yutyubeu-eseo yeongsang daunlodeuhae-do dwaeyo?', 'Can I download videos from YouTube?', 3),
  (web_id, '선생님', '다운로드는 안 되고, 북마크만 해둬.', 'Daunlodeoneun an doego, bukmakunman haedwo.', 'No downloading, just bookmark it.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (web_id, '"검색하다"는 무엇입니까?', '["to upload", "to download", "to search", "to log in"]', 2, '"검색하다" means to search', 1),
  (web_id, '인터넷에 접속할 때 필요한 것은?', '["TV", "라디오", "와이파이", "신문"]', 2, '"와이파이" (Wi-Fi) is needed to connect to the internet', 2),
  (web_id, '"댓글"은 무엇입니까?', '["password", "username", "online comment", "download"]', 2, '"댓글" is a comment posted online', 3),
  (web_id, '계정을 보호하려면 무엇이 필요합니까?', '["아이디", "비밀번호", "북마크", "댓글"]', 1, '"비밀번호" (password) is needed to protect your account', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (web_id, '현대인들은 매일 인터넷을 사용한다. 스마트폰이나 컴퓨터로 와이파이에 접속하면 검색, 이메일, 소셜미디어, 유튜브 등 다양한 서비스를 이용할 수 있다. 웹사이트에 로그인할 때는 아이디와 비밀번호가 필요하다. 자주 방문하는 사이트는 북마크해 두면 편리하다. 그러나 인터넷 사용 시 개인 정보 보호에 주의하고, 해킹 피해를 입지 않도록 조심해야 한다.', 'Modern people use the internet every day. By connecting to Wi-Fi on a smartphone or computer, you can use various services such as search, email, social media, and YouTube. Logging into websites requires a username and password. Bookmarking frequently visited sites is convenient. However, when using the internet, be careful about protecting personal information and be cautious to avoid being hacked.', 1);

END $$;
