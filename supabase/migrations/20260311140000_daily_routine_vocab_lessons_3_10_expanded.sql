-- Daily Routine: Lessons 3-10 — Expanded to 20 vocabulary words each
-- Showering, Washing Hair, Washing Face, Brushing Teeth, Shaving, Glasses, Getting Dressed, Makeup

DO $$
DECLARE
  shower_id uuid;
  hair_id uuid;
  face_id uuid;
  teeth_id uuid;
  shaving_id uuid;
  glasses_id uuid;
  dressed_id uuid;
  makeup_id uuid;
BEGIN
  SELECT id INTO shower_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 3;
  SELECT id INTO hair_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 4;
  SELECT id INTO face_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 5;
  SELECT id INTO teeth_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 6;
  SELECT id INTO shaving_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 7;
  SELECT id INTO glasses_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 8;
  SELECT id INTO dressed_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 9;
  SELECT id INTO makeup_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 10;

  -- Delete existing data to avoid duplicates
  DELETE FROM public.lesson_vocabulary WHERE lesson_id IN (shower_id, hair_id, face_id, teeth_id, shaving_id, glasses_id, dressed_id, makeup_id);
  DELETE FROM public.lesson_grammar WHERE lesson_id IN (shower_id, hair_id, face_id, teeth_id, shaving_id, glasses_id, dressed_id, makeup_id);
  DELETE FROM public.lesson_dialogues WHERE lesson_id IN (shower_id, hair_id, face_id, teeth_id, shaving_id, glasses_id, dressed_id, makeup_id);
  DELETE FROM public.lesson_exercises WHERE lesson_id IN (shower_id, hair_id, face_id, teeth_id, shaving_id, glasses_id, dressed_id, makeup_id);
  DELETE FROM public.lesson_reading WHERE lesson_id IN (shower_id, hair_id, face_id, teeth_id, shaving_id, glasses_id, dressed_id, makeup_id);

  -- ============================================================
  -- LESSON 3: SHOWERING
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (shower_id, '샤워하다',     'syawohada',       'to shower',                    1),
  (shower_id, '샤워기',       'syawogi',         'showerhead',                   2),
  (shower_id, '샴푸',         'syampu',          'shampoo',                      3),
  (shower_id, '린스',         'rinseu',          'conditioner',                  4),
  (shower_id, '비누',         'binu',            'soap',                         5),
  (shower_id, '타월',         'tawol',           'towel',                        6),
  (shower_id, '뜨거운 물',    'tteugeoun mul',   'hot water',                    7),
  (shower_id, '찬 물',        'chan mul',        'cold water',                   8),
  (shower_id, '목욕탕',       'mogyoktang',      'bathroom',                     9),
  (shower_id, '물을 틀다',    'mureul teulda',   'to turn on the water',         10),
  (shower_id, '목욕',         'mogyok',          'bath',                         11),
  (shower_id, '샤워 시간',    'syawo sigan',     'shower time',                  12),
  (shower_id, '거품',         'geopum',          'lather/foam',                  13),
  (shower_id, '헹구다',       'haengguda',       'to rinse',                     14),
  (shower_id, '몸을 씻다',    'momeul sseosda',  'to wash one\'s body',          15),
  (shower_id, '수도꼭지',     'sudokkokji',      'water faucet',                 16),
  (shower_id, '물 온도',      'mul ondo',        'water temperature',            17),
  (shower_id, '거울',         'geoul',           'mirror',                       18),
  (shower_id, '슬리퍼',       'seulipeeo',       'slippers',                     19),
  (shower_id, '욕실 매트',    'yoksil maeteu',   'bathroom mat',                 20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (shower_id, 'Using ~고 있다 (continuous)', '~고 있다', 'Ongoing action. 샤워하고 있다 (am showering)', 1),
  (shower_id, 'Using ~어야 하다 (must)', '~어야 하다', 'Obligation. 매일 샤워해야 한다 (must shower daily)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (shower_id, 'A', '샤워 시간이 너무 길어요!', 'Syawo sigan-i neomu gireoyo!', 'Your shower time is too long!', 1),
  (shower_id, 'B', '금방 끝낼게요. 2분 만에!', 'Geumbang kkeulnalgeyo. 2bun man-e!', 'I''ll finish quickly. In 2 minutes!', 2),
  (shower_id, 'A', '샴푸부터 헹굴 때까지?', 'Syampu buteo haenggul ttae kkaji?', 'From shampooing to rinsing?', 3),
  (shower_id, 'B', '네, 준비됐어요!', 'Ne, junbidwaesseoyo!', 'Yes, I\'m ready!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (shower_id, '"샤워"는 무엇입니까?', '["bath", "shower", "water", "soap"]', 1, '"샤워" is a shower', 1),
  (shower_id, '샤워할 때 머리를 씻는 데 필요한 것은?', '["비누", "샴푸", "타월", "슬리퍼"]', 1, '"샴푸" is used to wash hair', 2),
  (shower_id, '"거품"은 무엇입니까?', '["water", "foam/lather", "towel", "shampoo"]', 1, '"거품" is lather or foam', 3),
  (shower_id, '찬 물과 뜨거운 물 중 어느 것이 더 상큼합니까?', '["뜨거운 물", "찬 물", "같다", "모르겠다"]', 1, 'Cold water is more refreshing', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (shower_id, '매일 아침 샤워는 하루의 시작을 위한 중요한 의식이다. 샤워기에서 물을 틀고 적절한 온도를 조절한다. 뜨거운 물은 근육을 이완시키고, 찬 물은 정신을 맑게 한다. 샴푸로 머리를 감고 충분히 헹군 후 비누로 몸을 깨끗이 씻는다. 마지막으로 타월로 물기를 닦으면 상큼하고 활기찬 하루가 시작된다.', 'A daily shower is an important ritual for starting the day. Turn on the water from the showerhead and adjust the temperature. Hot water relaxes muscles, and cold water clears the mind. Wash your hair with shampoo and rinse thoroughly, then wash your body clean with soap. Finally, dry off with a towel and a fresh, energetic day begins.', 1);

  -- ============================================================
  -- LESSON 4: WASHING HAIR
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (hair_id, '머리를 감다',   'meorireul gamda',  'to wash hair',                 1),
  (hair_id, '두피',         'dupi',             'scalp',                        2),
  (hair_id, '거품',         'geopum',           'lather/foam',                  3),
  (hair_id, '헹구다',       'haengguda',        'to rinse',                     4),
  (hair_id, '드라이기',     'deuraigi',         'hair dryer',                   5),
  (hair_id, '드라이하다',   'deuraiHada',       'to blow-dry',                  6),
  (hair_id, '빗',           'bit',              'comb',                         7),
  (hair_id, '빗질하다',     'bitjilhada',       'to comb hair',                 8),
  (hair_id, '머릿결',       'meoritgyeol',      'hair texture',                 9),
  (hair_id, '윤기',         'yungi',            'shine/gloss',                  10),
  (hair_id, '머리카락',     'meoricalak',       'hair strand',                  11),
  (hair_id, '탈모',         'talmo',            'hair loss',                    12),
  (hair_id, '비듬',         'bidum',            'dandruff',                     13),
  (hair_id, '팩',           'paek',             'hair pack/mask',               14),
  (hair_id, '에센스',       'esenseeu',         'hair essence',                 15),
  (hair_id, '매끄럽다',     'maekkeureopda',    'to be smooth',                 16),
  (hair_id, '푸석푸석하다', 'puseokpuseok',     'to be frizzy',                 17),
  (hair_id, '광택',         'gwangtак',         'luster/shine',                 18),
  (hair_id, '헐렁하다',     'heuleonghada',     'to be loose/limp',             19),
  (hair_id, '매직',         'maejik',           'perm/straightening',           20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (hair_id, 'Using ~고 나서 (after)', '~고 나서', 'Action after. 감고 나서 헹군다 (rinse after washing)', 1),
  (hair_id, 'Using ~는 동안 (while)', '~는 동안', 'Simultaneous action. 말리는 동안 음악을 듣다 (listen to music while drying)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (hair_id, 'A', '머리 감았어?', 'Meori gamasso?', 'Did you wash your hair?', 1),
  (hair_id, 'B', '응, 방금 감았어. 지금 드라이 중이야.', 'Eung, banggeum gamasso. Jigeum deurai jung-iya.', 'Yeah, just washed it. Drying now.', 2),
  (hair_id, 'A', '머릿결이 반짝거리네! 뭘 썼어?', 'Meoritgyeol-i bangjak-georine! Mwol ssasseo?', 'Your hair is shiny! What did you use?', 3),
  (hair_id, 'B', '요즘 새로운 샴푸를 써봤어. 정말 좋아!', 'Yojeum saerooun syampu-reul sseobwasso. Jeongmal joa!', 'I tried a new shampoo recently. It\'s really good!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (hair_id, '"드라이하다"는 무엇을 의미합니까?', '["to wash", "to blow-dry", "to comb", "to style"]', 1, '"드라이하다" means to blow-dry', 1),
  (hair_id, '"두피"는 무엇입니까?', '["hair", "scalp", "strand", "root"]', 1, '"두피" is the scalp', 2),
  (hair_id, '머릿결이 반짝거리려면?', '["드라이", "헹굼", "팩/에센스 사용", "드라이기"]', 2, 'Use a hair pack or essence for shine', 3),
  (hair_id, '머리를 감은 후 어떻게 합니까?', '["바로 드라이", "충분히 헹굼", "드라이기로 말림", "빗질"]', 1, 'Rinse thoroughly after washing', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (hair_id, '건강한 머리 관리는 정기적인 세정이 기본이다. 일주일에 2-3번 따뜻한 물로 머리를 감는 것이 좋다. 거품이 충분히 생기면 부드럽게 두피를 마사지하고 충분히 헹군다. 드라이할 때는 찬바람으로 마무리하면 윤기가 살아난다. 주 1회 정도 팩이나 에센스를 사용하면 머릿결이 더욱 부드럽고 반짝거린다.', 'Healthy hair care starts with regular washing. Wash your hair 2-3 times a week with warm water. When lather forms, gently massage the scalp and rinse thoroughly. When blow-drying, finish with cool air for shine. Using a hair pack or essence about once a week makes hair smoother and shinier.', 1);

  -- ============================================================
  -- LESSON 5: WASHING FACE
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (face_id, '세수하다',     'sesuhada',        'to wash face',                 1),
  (face_id, '세안제',       'seanje',          'facial cleanser',              2),
  (face_id, '폼 클렌저',    'pom keullenjeo',  'foam cleanser',                3),
  (face_id, '세면대',       'semyeondae',      'wash basin/sink',              4),
  (face_id, '수건',         'sugeon',          'hand towel',                   5),
  (face_id, '토너',         'toneo',           'toner',                        6),
  (face_id, '로션',         'rosyon',          'lotion',                       7),
  (face_id, '피부',         'pibu',            'skin',                         8),
  (face_id, '여드름',       'yeodeureum',      'acne/pimple',                  9),
  (face_id, '촉촉하다',     'chokchokada',     'to be moist/hydrated',         10),
  (face_id, '건성',         'geonsong',        'dry skin',                     11),
  (face_id, '지성',         'jisong',          'oily skin',                    12),
  (face_id, '민감성',       'mingamseong',     'sensitive skin',               13),
  (face_id, '주름',         'jurum',           'wrinkle',                      14),
  (face_id, '화장수',       'hwajangssu',      'facial water/toner',           15),
  (face_id, '에센스',       'esenseeu',        'essence',                      16),
  (face_id, '크림',         'keurim',          'cream',                        17),
  (face_id, '마스크팩',     'maseukeupaek',    'face mask',                    18),
  (face_id, '아침 세안',    'achim sewan',     'morning facial washing',        19),
  (face_id, '저녁 세안',    'jeonyeok sewan',  'evening facial washing',        20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (face_id, 'Using ~기 전에 (before)', '~기 전에', 'Before action. 자기 전에 세수한다 (wash face before sleeping)', 1),
  (face_id, 'Using ~마다 (every/each)', '~마다', 'Regularity. 아침마다 세수한다 (wash face every morning)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (face_id, 'A', '여드름이 많아졌네요.', 'Yeodeureum-i manajyeojne.', 'You have more acne.', 1),
  (face_id, 'B', '요즘 스트레스가 많아서요.', 'Yojeum seutolesseuga manaseo.', 'I\'ve been stressed lately.', 2),
  (face_id, 'A', '아침저녁으로 잘 세수하고 토너, 로션을 꼭 사용하세요.', 'Achimjeonyeog-euro jal sesuhago toneo, rosyon-eul kkkok sayong-haseyo.', 'Wash your face morning and night, and be sure to use toner and lotion.', 3),
  (face_id, 'B', '네, 감사합니다. 마스크팩도 할까요?', 'Ne, gamsahamnida. Maseukeupaek-do halkkayo?', 'Thanks. Should I do a face mask too?', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (face_id, '"세안제"는 무엇입니까?', '["toner", "lotion", "facial cleanser", "cream"]', 2, '"세안제" is a facial cleanser', 1),
  (face_id, '피부가 촉촉하려면?', '["햇빛 노출", "로션과 크림 사용", "물을 적게 마시기", "외출하기"]', 1, 'Use lotion and cream to keep skin hydrated', 2),
  (face_id, '여드름이 많을 때 해야 할 일은?', '["자주 손으로 만지기", "정기적 세안과 보습", "햇빛에 자주 나가기", "화장 많이 하기"]', 1, 'Regular cleansing and moisturizing helps with acne', 3),
  (face_id, '"건성 피부"는 어떤 피부입니까?', '["oily skin", "dry skin", "sensitive skin", "clear skin"]', 1, '"건성" means dry skin', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (face_id, '깨끗한 피부는 좋은 피부관리에서 시작된다. 아침에 일어난 후 미온수로 얼굴을 부드럽게 씻고 세안제를 사용한다. 그 후 수건으로 톡톡 두드려 물기를 제거한다. 토너로 피부를 정돈한 후 로션으로 보습한다. 밤에는 저녁 세안 후 에센스, 크림을 사용한다. 주 1-2회 마스크팩을 사용하면 피부가 더욱 탱탱해진다.', 'Clear skin starts with good skincare. After waking, gently wash your face with lukewarm water and use cleanser. Pat dry with a towel. Use toner to balance skin, then apply lotion for moisture. At night, after evening cleansing, use essence and cream. Using a face mask 1-2 times a week makes skin firmer.', 1);

  -- ============================================================
  -- LESSON 6: BRUSHING TEETH
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (teeth_id, '양치질하다', 'yangchijilhada',   'to brush teeth',               1),
  (teeth_id, '칫솔',       'chitsol',         'toothbrush',                   2),
  (teeth_id, '치약',       'chiyak',          'toothpaste',                   3),
  (teeth_id, '치실',       'chisil',          'dental floss',                 4),
  (teeth_id, '입을 헹구다','ibeul haengguda', 'to rinse mouth',               5),
  (teeth_id, '치아',       'chia',            'teeth',                        6),
  (teeth_id, '잇몸',       'itgom',           'gums',                         7),
  (teeth_id, '충치',       'chungchi',        'cavity',                       8),
  (teeth_id, '구강청결제', 'gugangcheonggyelje','mouthwash',                  9),
  (teeth_id, '혀',         'hyeo',            'tongue',                       10),
  (teeth_id, '칫솔질',     'chitsoljil',      'toothbrushing',                11),
  (teeth_id, '치간 칫솔', 'chigan chitsol',   'interdental brush',            12),
  (teeth_id, '스케일링', 'seukaeiling',     'dental scaling',                13),
  (teeth_id, '불소',       'bulso',           'fluoride',                     14),
  (teeth_id, '하얀 치아', 'hayan chia',      'white teeth',                  15),
  (teeth_id, '건강한 입',  'geonganghhan ip', 'healthy mouth',                16),
  (teeth_id, '검은 때',    'geomeun ttae',    'plaque/tartar',                17),
  (teeth_id, '치석',       'chiseok',         'tartar',                       18),
  (teeth_id, '양치',       'yangchi',         'toothbrushing',                19),
  (teeth_id, '잇몸 출혈', 'itgom chulhyeol', 'gum bleeding',                 20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (teeth_id, 'Using ~아/어야 하다 (must)', '~아/어야 하다', 'Obligation. 양치질해야 한다 (must brush teeth)', 1),
  (teeth_id, 'Using ~면 안 되다 (must not)', '~면 안 되다', 'Prohibition. 식사 직후 양치하면 안 된다 (cannot brush right after eating)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (teeth_id, 'A', '양치질했니?', 'Yangchijilhaetni?', 'Did you brush your teeth?', 1),
  (teeth_id, 'B', '아직 안 했어요.', 'Ajik an haesseoyo.', 'Not yet.', 2),
  (teeth_id, 'A', '밥 먹고 난 후에 양치질을 해야지! 충치가 생길 수 있어.', 'Bab meokgo nan hue-e yangchijireul hae yaji! Chungchi-ga saenggyul su isseo.', 'You should brush after eating! You could get cavities.', 3),
  (teeth_id, 'B', '알겠어요. 지금 할게요!', 'Algetsoyo. Jigeum halgeyo!', 'Okay, I\'ll do it now!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (teeth_id, '"칫솔"은 무엇입니까?', '["toothpaste", "toothbrush", "mouth", "teeth"]', 1, '"칫솔" is a toothbrush', 1),
  (teeth_id, '하루에 몇 번 양치질해야 합니까?', '["한 번", "두 번", "세 번", "다섯 번"]', 2, 'Brush teeth 3 times a day (after meals)', 2),
  (teeth_id, '"충치"는 무엇입니까?', '["gums", "tongue", "cavity", "teeth"]', 2, '"충치" is a cavity', 3),
  (teeth_id, '치아를 건강하게 유지하려면?', '["설탕 많이 먹기", "정기적 양치와 불소", "딱딱한 음식 피하기", "물을 마시지 않기"]', 1, 'Regular brushing and fluoride keep teeth healthy', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (teeth_id, '건강한 치아는 평생의 자산이다. 아침, 점심, 저녁 세 끼 식사 후에 양치질을 해야 한다. 칫솔의 모가 너무 뻣뻣하지 않은 것을 선택하고 부드럽게 닦는 것이 중요하다. 치약은 불소가 함유된 것을 사용하면 충치 예방에 도움이 된다. 음식을 먹은 직후에는 양치질을 하지 말고 30분 정도 기다린 후에 하는 것이 좋다. 정기적으로 치과에 가서 스케일링을 받으면 더욱 건강한 치아를 유지할 수 있다.', 'Healthy teeth are lifelong assets. Brush after all three meals. Choose a toothbrush with soft bristles and brush gently. Using fluoride toothpaste helps prevent cavities. Don\'t brush immediately after eating; wait about 30 minutes. Regular dental checkups and scaling keep teeth healthier.', 1);

  -- ============================================================
  -- LESSON 7: SHAVING
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (shaving_id, '면도하다',   'myeondohada',     'to shave',                     1),
  (shaving_id, '면도기',     'myeondogi',       'razor',                        2),
  (shaving_id, '면도날',     'myeondonal',      'razor blade',                  3),
  (shaving_id, '면도 거품',  'myeondo geopum',  'shaving foam',                 4),
  (shaving_id, '수염',       'suyeom',          'beard/facial hair',            5),
  (shaving_id, '콧수염',     'kotsuyeom',       'mustache',                     6),
  (shaving_id, '턱',         'teok',            'chin',                         7),
  (shaving_id, '면도 후 로션','myeondo hu rosyon','aftershave lotion',           8),
  (shaving_id, '피부 자극',  'pibu jageuk',     'skin irritation',              9),
  (shaving_id, '깎다',       'kkakda',          'to trim/cut',                  10),
  (shaving_id, '뽑다',       'ppopda',          'to pull out',                  11),
  (shaving_id, '면도 크림',  'myeondo keurim',  'shaving cream',                12),
  (shaving_id, '면도기 날', 'myeondogi nal',   'razor blade edge',             13),
  (shaving_id, '손질하다',   'sonjilHada',      'to groom/trim',                14),
  (shaving_id, '얼굴',       'eolgul',          'face',                         15),
  (shaving_id, '뺨',         'ppyam',           'cheek',                        16),
  (shaving_id, '목',         'mok',             'neck',                         17),
  (shaving_id, '입술',       'ipsul',           'lip',                          18),
  (shaving_id, '따가움',     'ttgagaum',        'stinging/prickling',           19),
  (shaving_id, '피부 트러블','pibu teureobul',  'skin trouble/irritation',      20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (shaving_id, 'Using ~아/어서 (so, then)', '~아/어서', 'Sequential. 면도하고 나서 로션을 바른다 (After shaving, apply lotion)', 1),
  (shaving_id, 'Using ~으면 안 되다 (mustn\'t)', '~으면 안 되다', 'Prohibition. 너무 세게 면도하면 안 된다 (don\'t shave too hard)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (shaving_id, 'A', '오늘 면도했어요?', 'Oneul myeondohaesseoyo?', 'Did you shave today?', 1),
  (shaving_id, 'B', '네, 이른 아침에 했어요. 수염이 자라서요.', 'Ne, ireun achim-e haesseoyo. Suyeom-i jaraseo.', 'Yes, early this morning. My beard was growing.', 2),
  (shaving_id, 'A', '피부가 자극받았어요?', 'Pibu-ga jageubadasseoeyo?', 'Is your skin irritated?', 3),
  (shaving_id, 'B', '조금요. 그래서 로션을 바르고 있어요.', 'Jogeumyo. Geuraeseo rosyon-eul bareugo isseoyo.', 'A bit. That\'s why I\'m applying lotion.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (shaving_id, '"면도"는 무엇입니까?', '["to trim", "to shave", "to cut hair", "to groom"]', 1, '"면도하다" means to shave', 1),
  (shaving_id, '면도할 때 필요한 것은?', '["칼", "면도기", "가위", "빗"]', 1, '"면도기" is a razor used for shaving', 2),
  (shaving_id, '면도 후에 무엇을 바릅니까?', '["샤워", "비누", "면도 후 로션", "향수"]', 2, 'Apply aftershave lotion after shaving', 3),
  (shaving_id, '"수염"은 무엇입니까?', '["head hair", "beard", "eyebrow", "eyelash"]', 1, '"수염" is a beard', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (shaving_id, '면도는 남성 미용의 기본이다. 아침에 면도하기 전에 얼굴을 따뜻한 물로 씻으면 수염이 부드러워진다. 면도 크림이나 거품을 충분히 바른 후 천천히 면도기를 움직인다. 너무 세게 면도하면 피부가 자극받을 수 있으므로 조심해야 한다. 면도 후에는 반드시 면도 후 로션을 바르고 손질된 모습을 유지해야 한다.', 'Shaving is a basic part of male grooming. Before shaving in the morning, wash your face with warm water to soften facial hair. Apply shaving cream generously and move the razor slowly. Shave gently to avoid skin irritation. After shaving, always apply aftershave lotion and maintain a groomed appearance.', 1);

  -- ============================================================
  -- LESSON 8: GLASSES & CONTACTS
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (glasses_id, '안경',       'angyeong',        'glasses/spectacles',           1),
  (glasses_id, '안경을 쓰다','angyeongeul sseuda','to wear glasses',             2),
  (glasses_id, '렌즈',       'renjeu',          'contact lens',                 3),
  (glasses_id, '렌즈를 끼다','renjeureul kkida', 'to put in contacts',           4),
  (glasses_id, '렌즈 액',    'renjeu aek',      'lens solution',                5),
  (glasses_id, '렌즈 케이스','renjeu keiseu',   'lens case',                    6),
  (glasses_id, '시력',       'siryeok',         'eyesight/vision',              7),
  (glasses_id, '근시',       'geunsi',          'near-sightedness',             8),
  (glasses_id, '원시',       'weonsi',          'far-sightedness',              9),
  (glasses_id, '난시',       'nansi',           'astigmatism',                  10),
  (glasses_id, '안과',       'angwa',           'eye clinic',                   11),
  (glasses_id, '도수',       'dosu',            'prescription strength',        12),
  (glasses_id, '검안',       'geoman',          'eye exam',                     13),
  (glasses_id, '렌즈 낀다', 'renjeu kkindan',   'putting in contacts',          14),
  (glasses_id, '안경알',     'angyeongal',      'lens of glasses',              15),
  (glasses_id, '안경테',     'angyeongtae',     'glasses frame',                16),
  (glasses_id, '선글라스',   'seungsgeulaseu',  'sunglasses',                   17),
  (glasses_id, '눈',         'nun',             'eye',                          18),
  (glasses_id, '시력 검사', 'siryeok geomsa',  'eye test/vision test',         19),
  (glasses_id, '맑다',       'malkda',          'to be clear',                  20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (glasses_id, 'Using ~아/어야 하다 (must)', '~아/어야 하다', 'Obligation. 안경을 써야 한다 (must wear glasses)', 1),
  (glasses_id, 'Using ~을/를 하다 (to do)', '~을/를 하다', 'Action. 검안을 받다 (get an eye exam)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (glasses_id, 'A', '안경을 자주 쓰세요?', 'Angyeongeul jaju sseuseo?', 'Do you wear glasses often?', 1),
  (glasses_id, 'B', '네, 근시라서 안경이 필수예요.', 'Ne, geunsi-raseo angyeong-i pilsuye.', 'Yes, I\'m nearsighted so glasses are necessary.', 2),
  (glasses_id, 'A', '혹시 렌즈는 안 쓰세요?', 'Hoksi renjeu-neun an sseuseo?', 'Don\'t you wear contact lenses?', 3),
  (glasses_id, 'B', '렌즈는 관리가 어려워서 안경이 더 편해요.', 'Renjeu-neun gwanri-ga eoryeowoseo angyeong-i deo pyeonhae.', 'Contact lens care is difficult, so glasses are more convenient.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (glasses_id, '"안경"은 무엇입니까?', '["eye", "glasses", "lens", "frame"]', 1, '"안경" are spectacles/glasses', 1),
  (glasses_id, '"근시"는 무엇입니까?', '["far-sightedness", "near-sightedness", "astigmatism", "color blindness"]', 1, '"근시" is nearsightedness', 2),
  (glasses_id, '렌즈를 오래 사용하려면?', '["매일 끼우기", "렌즈액에 보관", "외출할 때만 사용", "물에 씻기"]', 1, 'Store contacts in lens solution properly', 3),
  (glasses_id, '안경의 도수가 맞지 않으면?', '["더 밝아진다", "눈이 편하다", "눈이 피곤해진다", "시력이 좋아진다"]', 2, 'Incorrect prescription causes eye strain', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (glasses_id, '안경은 시력 문제를 해결하는 가장 간단한 방법이다. 근시, 원시, 난시 등 다양한 시력 문제가 있지만 안경으로 대부분 교정할 수 있다. 정기적으로 안과에서 검안을 받아 자신의 도수에 맞는 안경을 착용하는 것이 중요하다. 렌즈를 선택하는 사람도 많은데, 렌즈액에 보관하고 정기적으로 교체해야 한다. 요즘에는 블루라이트 차단 기능이 있는 안경도 인기가 높다.', 'Glasses are the simplest way to correct vision problems. Various issues like nearsightedness, farsightedness, and astigmatism can be corrected with glasses. Regular eye exams and properly fitting glasses are important. Many people choose contacts, which require proper storage solution and regular replacement. Modern glasses with blue light blocking features are also popular.', 1);

  -- ============================================================
  -- LESSON 9: GETTING DRESSED
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (dressed_id, '옷을 입다',  'oseul ipda',      'to get dressed',               1),
  (dressed_id, '셔츠',       'syeocheu',        'shirt',                        2),
  (dressed_id, '바지',       'baji',            'pants/trousers',               3),
  (dressed_id, '치마',       'chima',           'skirt',                        4),
  (dressed_id, '양말',       'yangmal',         'socks',                        5),
  (dressed_id, '신발',       'sinbal',          'shoes',                        6),
  (dressed_id, '외투',       'oetu',            'coat/outerwear',               7),
  (dressed_id, '벨트',       'belteu',          'belt',                         8),
  (dressed_id, '옷장',       'otjang',          'wardrobe/closet',              9),
  (dressed_id, '어울리다',   'eoullida',        'to suit/look good on',         10),
  (dressed_id, '색깔',       'saekkal',         'color',                        11),
  (dressed_id, '패턴',       'paeteon',         'pattern',                      12),
  (dressed_id, '사이즈',     'saijeu',          'size',                         13),
  (dressed_id, '편하다',     'pyeonhada',       'to be comfortable',            14),
  (dressed_id, '정장',       'jeongjang',       'formal wear',                  15),
  (dressed_id, '캐주얼',     'kaejual',         'casual wear',                  16),
  (dressed_id, '스타일',     'seutail',         'style',                        17),
  (dressed_id, '어깨',       'eokkaе',          'shoulder',                     18),
  (dressed_id, '팔',         'pal',             'arm',                          19),
  (dressed_id, '다리',       'dari',            'leg',                          20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (dressed_id, 'Using ~에 어울리다 (suit/go with)', '~에 어울리다', 'Goes well with. 파란 셔츠에 검은 바지가 어울린다 (Black pants suit a blue shirt)', 1),
  (dressed_id, 'Using ~을 입다 (wear)', '~을 입다', 'Wearing action. 옷을 입다 (wear clothes)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (dressed_id, 'A', '오늘 뭘 입을까?', 'Oneul mweol ibeulkka?', 'What should I wear today?', 1),
  (dressed_id, 'B', '날씨가 추우니까 외투를 입으세요.', 'Nalssyiga chuu-nikka oetuereul iphseyo.', 'It\'s cold, so wear a coat.', 2),
  (dressed_id, 'A', '어떤 색깔이 어울릴까요?', 'Eotteon saekkal-i eoullilkkayo?', 'What color would suit me?', 3),
  (dressed_id, 'B', '검은색이나 회색 외투가 멋있어요!', 'Geomeunsaek-ina hoesaek oetuega meossisseoyo!', 'Black or gray coats look great!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (dressed_id, '"옷을 입다"는 무엇입니까?', '["to sew", "to wash", "to wear", "to fold"]', 2, '"옷을 입다" means to wear clothes', 1),
  (dressed_id, '"벨트"는 무엇입니까?', '["shirt", "belt", "pants", "shoe"]', 1, '"벨트" is a belt', 2),
  (dressed_id, '어떤 옷이 어울립니까?', '["색깔과 스타일이 맞는 옷", "불편한 옷", "낡은 옷", "너무 큰 옷"]', 0, 'Clothes that match color and style suit you', 3),
  (dressed_id, '날씨가 추울 때 입는 옷은?', '["반팔", "치마", "외투", "샌들"]', 2, 'A coat is worn in cold weather', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (dressed_id, '아침에 옷을 고르는 것은 하루를 시작하는 첫 단계이다. 날씨와 상황에 맞게 옷을 선택해야 한다. 추운 날씨에는 외투가 필수이고, 더운 날씨에는 가벼운 옷을 입는 것이 좋다. 색깔과 패턴이 어울리는 옷을 조합하면 더욱 멋진 스타일을 만들 수 있다. 무엇보다 편하고 자신감 있게 느껴지는 옷을 입는 것이 가장 중요하다.', 'Choosing clothes in the morning is the first step to starting the day. Select clothes appropriate for the weather and occasion. A coat is essential for cold weather, and light clothes are good for hot weather. Combining clothes with matching colors and patterns creates a better style. Most importantly, wear clothes that feel comfortable and give you confidence.', 1);

  -- ============================================================
  -- LESSON 10: MAKEUP
  -- ============================================================
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (makeup_id, '화장하다',   'hwajanghada',     'to put on makeup',             1),
  (makeup_id, '파운데이션', 'paundeiSyeon',    'foundation',                   2),
  (makeup_id, '립스틱',     'ripseutik',       'lipstick',                     3),
  (makeup_id, '아이섀도',   'aisyaedo',        'eyeshadow',                    4),
  (makeup_id, '마스카라',   'maseukara',       'mascara',                      5),
  (makeup_id, '파우더',     'paudeo',          'face powder',                  6),
  (makeup_id, '블러셔',     'beulleosyeo',     'blush',                        7),
  (makeup_id, '화장 지우다','hwajang jiuda',   'to remove makeup',             8),
  (makeup_id, '거울',       'geoul',           'mirror',                       9),
  (makeup_id, '화장품',     'hwajangpum',      'cosmetics',                    10),
  (makeup_id, '화장 솔',    'hwajang sol',     'makeup brush',                 11),
  (makeup_id, '화장 스펀지','hwajang seupeunji','makeup sponge',                12),
  (makeup_id, '색상',       'saeksang',        'shade/color',                  13),
  (makeup_id, '피부 톤',    'pibu ton',        'skin tone',                    14),
  (makeup_id, '내추럴',     'naechurol',       'natural look',                 15),
  (makeup_id, '드라마틱',   'deuramadik',      'dramatic look',                16),
  (makeup_id, '아이라이너', 'ailaineо',        'eyeliner',                     17),
  (makeup_id, '컨실러',     'keonsileо',       'concealer',                    18),
  (makeup_id, '눈썹',       'nunsseop',        'eyebrow',                      19),
  (makeup_id, '립라이너',   'riplaineo',       'lip liner',                    20);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (makeup_id, 'Using ~을/를 하다 (to do/apply)', '~을/를 하다', 'Applying action. 화장을 하다 (put on makeup)', 1),
  (makeup_id, 'Using ~고 나면 (after doing)', '~고 나면', 'After action. 화장하고 나면 더 예뻐 보인다 (After makeup, one looks prettier)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (makeup_id, 'A', '화장 잘했네요!', 'Hwajang jal haetne!', 'You did a great makeup job!', 1),
  (makeup_id, 'B', '감사합니다! 파운데이션을 새로 샀어요.', 'Gamsahamnida! PaundeiSyeon-eul saero sasseoyo.', 'Thanks! I bought new foundation.', 2),
  (makeup_id, 'A', '이 색상이 정말 잘 어울려요.', 'I saeksang-i jeongmal jal eoullryeoyo.', 'This shade really suits you.', 3),
  (makeup_id, 'B', '마스카라와 아이섀도도 새 제품이에요.', 'Maseukara-wa aisyaedo-do sae jepum-ieyo.', 'The mascara and eyeshadow are new products too.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (makeup_id, '"화장하다"는 무엇입니까?', '["to wash", "to remove", "to put on makeup", "to style"]', 2, '"화장하다" means to put on makeup', 1),
  (makeup_id, '"파운데이션"은 무엇입니까?', '["lipstick", "blush", "foundation", "powder"]', 2, '"파운데이션" is a foundation', 2),
  (makeup_id, '눈을 더 크게 보이게 하려면?', '["블러셔", "마스카라와 아이섀도", "파우더", "립스틱"]', 1, 'Mascara and eyeshadow make eyes look bigger', 3),
  (makeup_id, '화장을 지울 때 필요한 것은?', '["비누만", "클렌징", "수건만", "물만"]', 1, 'Cleansing is needed to remove makeup properly', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (makeup_id, '화장은 자신감을 높이고 기분을 좋게 만드는 일상적인 미용이다. 화장을 하기 전에 거울을 보며 피부 톤과 어울리는 색상을 선택한다. 파운데이션을 얇게 펴서 기초를 만들고, 그 위에 아이섀도, 마스카라, 아이라이너로 눈을 강조한다. 마지막으로 블러셔와 립스틱으로 얼굴을 완성한다. 저녁에는 꼭 화장을 지우고 피부를 진정시켜야 한다.', 'Makeup is a daily beauty practice that boosts confidence and mood. Before applying makeup, look in the mirror and choose shades matching your skin tone. Apply foundation thinly as a base, then enhance eyes with eyeshadow, mascara, and eyeliner. Finally, complete the look with blush and lipstick. In the evening, always remove makeup and soothe the skin.', 1);

END $$;
