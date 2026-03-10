-- Daily Routine Vocabulary: Lessons 3-10 (Showering, Washing Hair, Washing Face, Brushing Teeth, Shaving, Glasses, Getting Dressed, Makeup)

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
  -- Get lesson IDs
  SELECT id INTO shower_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 3;
  SELECT id INTO hair_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 4;
  SELECT id INTO face_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 5;
  SELECT id INTO teeth_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 6;
  SELECT id INTO shaving_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 7;
  SELECT id INTO glasses_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 8;
  SELECT id INTO dressed_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 9;
  SELECT id INTO makeup_id FROM public.textbook_lessons WHERE book = 'daily-routine' AND sort_order = 10;

  -- ===== LESSON 3: SHOWERING =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (shower_id, '샤워하다', 'syauweohada', 'to shower', 1),
  (shower_id, '물', 'mul', 'water', 2),
  (shower_id, '뜨거운 물', 'tteugeoun mul', 'hot water', 3),
  (shower_id, '찬 물', 'chan mul', 'cold water', 4),
  (shower_id, '샴푸', 'syampu', 'shampoo', 5),
  (shower_id, '린스', 'rinsu', 'conditioner', 6),
  (shower_id, '비누', 'biniu', 'soap', 7),
  (shower_id, '타올', 'taol', 'towel', 8),
  (shower_id, '목욕탕', 'mogyoktang', 'bathroom', 9),
  (shower_id, '샤워기', 'syauweogi', 'shower head', 10),
  (shower_id, '린스하다', 'rinseuhada', 'to condition (hair)', 11),
  (shower_id, '물을 끼얹다', 'muleul kkiyeojda', 'to splash water', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (shower_id, 'Using ~고 있다 (Continuous Action)', '~고 있다', 'Expresses an action in progress. Example: 샤워하고 있다 (I am showering)', 1),
  (shower_id, 'Using ~어야 하다 (Must/Should)', '~어야 하다', 'Expresses necessity or obligation. Example: 매일 샤워해야 한다 (I must shower daily)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (shower_id, '혜정', '샤워 시간이 너무 길어!', 'Syauwe sigan-i neomu gireo!', 'Your shower time is too long!', 1),
  (shower_id, '철수', '2분 만에 끝낼게!', '2bun man-e kkeulnalge!', 'I''ll finish in 2 minutes!', 2),
  (shower_id, '혜정', '샴푸부터 헹굴 때까지 몇 분이야?', 'Syampu buteo haenggul ttae kkaji myeot bun-iya?', 'How many minutes from shampooing to rinsing?', 3),
  (shower_id, '철수', '알겠어. 빨리 나올게!', 'Algeteo. Ppalli naolge!', 'Okay, I''ll come out quickly!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (shower_id, '다음 중 "shower"의 한국어 단어는?', '["샴푸", "샤워", "목욕탕", "린스"]', 1, 'Correct! "샤워" means shower', 1),
  (shower_id, '"물을 끼얹다"는 무엇을 의미합니까?', '["to pour water", "to splash water", "to drink water", "to boil water"]', 1, 'Correct! It means to splash water', 2),
  (shower_id, '"타올"은 무엇입니까?', '["soap", "shampoo", "towel", "conditioner"]', 2, 'Correct! "타올" is a towel', 3),
  (shower_id, '샤워할 때 머리를 어떻게 씻습니까?', '["물로만", "샴푸와 린스로", "비누로", "타올로"]', 1, 'Correct! Use shampoo and conditioner', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (shower_id, '매일 아침 나는 샤워를 한다. 먼저 샤워기에서 물을 틀고, 몸 전체를 물로 적신다. 그 다음 샤워 제품을 사용해서 머리와 몸을 깨끗하게 씻는다. 샤워는 하루를 시작하는 가장 좋은 방법이다.', 'Every morning I take a shower. First, I turn on the shower head and wet my entire body with water. Then I use shower products to wash my hair and body clean. A shower is the best way to start the day.', 1);

  -- ===== LESSON 4: WASHING HAIR =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (hair_id, '머리를 감다', 'meorireul gamda', 'to wash hair', 1),
  (hair_id, '머리', 'meori', 'hair', 2),
  (hair_id, '두피', 'dupi', 'scalp', 3),
  (hair_id, '머릿결', 'meoritlegyeol', 'hair texture', 4),
  (hair_id, '곱슬곱슬하다', 'gopseulgopeulhada', 'to be frizzy', 5),
  (hair_id, '윤기 있다', 'yungi itda', 'to be shiny', 6),
  (hair_id, '헹굴다', 'haenggulda', 'to rinse', 7),
  (hair_id, '드라이하다', 'dera-ihada', 'to dry (hair)', 8),
  (hair_id, '드라이기', 'dera-igi', 'hair dryer', 9),
  (hair_id, '빗질하다', 'bitjilhada', 'to comb', 10),
  (hair_id, '빗', 'bit', 'comb/brush', 11),
  (hair_id, '탈모', 'talmo', 'hair loss', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (hair_id, 'Using ~고 나서 (After doing)', '~고 나서', 'Expresses the sequence of actions. Example: 머리를 감고 나서 헹군다 (After washing, rinse)', 1),
  (hair_id, 'Using ~는 동안 (While/During)', '~는 동안', 'Expresses an action happening simultaneously. Example: 머리를 말리는 동안 뉴스를 본다 (While drying hair, watch news)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (hair_id, '엄마', '머리 감았어?', 'Meori gamasso?', 'Did you wash your hair?', 1),
  (hair_id, '아이', '아직 샤워하고 있어.', 'Ajik syauweohago isse.', 'I''m still in the shower.', 2),
  (hair_id, '엄마', '빨리 나와! 머리도 잘 말려야지.', 'Ppalli nawa! Meorido jal mallyeoyaji.', 'Come out quick! You need to dry your hair well.', 3),
  (hair_id, '아이', '네, 엄마. 지금 드라이기로 말리고 있어요.', 'Ne, eomma. Jigeum dera-igi-ro mallyigo isseoyo.', 'Yes, mom. I''m drying it with a hair dryer now.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (hair_id, '"헹굴다"는 무엇입니까?', '["to dry", "to comb", "to rinse", "to wash"]', 2, 'Correct! "헹굴다" means to rinse', 1),
  (hair_id, '드라이기는 머리를 어떻게 합니까?', '["씻는다", "말린다", "빗는다", "감긴다"]', 1, 'Correct! "드라이기" is used to dry hair', 2),
  (hair_id, '"곱슬곱슬하다"는 머릿결의 어떤 상태입니까?', '["shiny", "frizzy", "wet", "clean"]', 1, 'Correct! It describes frizzy hair texture', 3),
  (hair_id, '머리를 감은 후에는 무엇을 해야 합니까?', '["드라이", "빗질", "헹굼", "샤워"]', 2, 'Correct! You should rinse after washing', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (hair_id, '건강한 머리를 유지하려면 일주일에 2~3번 머리를 감아야 한다. 머리를 감을 때는 뜨거운 물보다는 따뜻한 물을 사용하는 것이 좋다. 샴푸를 한 후 충분히 헹굴어야 하고, 린스로 머릿결을 관리해야 한다. 마지막으로 드라이기로 머리를 완전히 말려야 탈모를 예방할 수 있다.', 'To maintain healthy hair, you should wash it 2-3 times a week. When washing, use warm water rather than hot water. After shampooing, rinse thoroughly and condition your hair. Finally, dry your hair completely with a hair dryer to prevent hair loss.', 1);

  -- ===== LESSON 5: WASHING FACE =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (face_id, '얼굴을 씻다', 'eolgureul sseosda', 'to wash face', 1),
  (face_id, '얼굴', 'eolgul', 'face', 2),
  (face_id, '세안', 'sean', 'face washing', 3),
  (face_id, '클렌징', 'keulrenjiing', 'cleansing', 4),
  (face_id, '토너', 'toneo', 'toner', 5),
  (face_id, '에센스', 'esenseeu', 'essence', 6),
  (face_id, '로션', 'rosyon', 'lotion', 7),
  (face_id, '크림', 'keurim', 'cream', 8),
  (face_id, '여드름', 'yeodereum', 'acne/pimple', 9),
  (face_id, '피부', 'pibu', 'skin', 10),
  (face_id, '촉촉하다', 'chokchokada', 'to be moist/hydrated', 11),
  (face_id, '수분', 'subun', 'moisture/water', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (face_id, 'Using ~기 전에 (Before doing)', '~기 전에', 'Expresses action before something else. Example: 자기 전에 얼굴을 씻는다 (Wash face before sleeping)', 1),
  (face_id, 'Using ~마다 (Every/Each time)', '~마다', 'Expresses regularity. Example: 아침마다 얼굴을 씻는다 (Wash face every morning)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (face_id, '언니', '얼굴에 여드름이 많아졌네.', 'Eolgure yeodereum-i manajyeojne.', 'You have more acne on your face.', 1),
  (face_id, '동생', '최근에 스트레스가 많았어.', 'Choegeun-e seutoreu seu-ga manhaseo.', 'I''ve been stressed lately.', 2),
  (face_id, '언니', '매일 아침저녁으로 얼굴을 잘 씻어야 해. 그리고 로션도 바르고.', 'Maeil achimjeonyeog-euro eolgureul jal sseosseo ya hae. Geurigo rosyon-do bareugo.', 'You need to wash your face morning and night. And apply lotion too.', 3),
  (face_id, '동생', '알겠어. 오늘부터 잘 관리할게.', 'Algeteo. Oneul buteo jal gwanlihhalge.', 'Okay, I''ll take better care of it from today.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (face_id, '"세안"은 무엇입니까?', '["toner", "face washing", "lotion", "cream"]', 1, 'Correct! "세안" means face washing', 1),
  (face_id, '피부를 촉촉하게 유지하려면?', '["여드름 짜기", "로션과 크림 사용", "자주 손으로 만지기", "햇빛에 자주 노출"]', 1, 'Correct! Use lotion and cream for moisture', 2),
  (face_id, '"에센스"는 세안 후 언제 사용합니까?', '["before cleansing", "after toner, before lotion", "before toner", "after shower"]', 1, 'Correct! Use essence after toner', 3),
  (face_id, '스트레스가 많을 때 생기는 피부 문제는?', '["dry skin", "acne", "wrinkles", "sensitivity"]', 1, 'Correct! Acne (여드름) often appears with stress', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (face_id, '깨끗한 피부를 유지하는 것은 하루를 시작하는 데 매우 중요하다. 아침에 일어난 후 찬 물로 얼굴을 씻으면 피부가 깨어난다. 그 후 토너, 에센스, 로션, 크림을 순서대로 사용하면 피부가 촉촉해진다. 밤에는 클렌징으로 하루 종일 묻은 먼지를 제거하고 다시 보습 제품들을 사용하는 것이 좋다.', 'Maintaining clean skin is very important for starting the day. After waking up in the morning, wash your face with cold water to wake up your skin. Then use toner, essence, lotion, and cream in order to keep skin hydrated. At night, use cleansing to remove dirt accumulated throughout the day and reapply moisturizing products.', 1);

  -- ===== LESSON 6: BRUSHING TEETH =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (teeth_id, '양치질하다', 'yangchijilhada', 'to brush teeth', 1),
  (teeth_id, '치아', 'chia', 'teeth', 2),
  (teeth_id, '칫솔', 'chitsol', 'toothbrush', 3),
  (teeth_id, '치약', 'chiyak', 'toothpaste', 4),
  (teeth_id, '치실', 'chisil', 'dental floss', 5),
  (teeth_id, '입', 'ip', 'mouth', 6),
  (teeth_id, '혀', 'hyeo', 'tongue', 7),
  (teeth_id, '잇몸', 'itgom', 'gums', 8),
  (teeth_id, '충치', 'chungchi', 'cavity', 9),
  (teeth_id, '하얀 치아', 'hayan chia', 'white teeth', 10),
  (teeth_id, '상큼하다', 'sangkeumhada', 'to be fresh/minty', 11),
  (teeth_id, '헹굴다', 'haenggulda', 'to rinse', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (teeth_id, 'Using ~아/어야 하다 (Must/Should)', '~아/어야 하다', 'Expresses obligation or necessity. Example: 하루에 3번 양치질해야 한다 (Must brush teeth 3 times a day)', 1),
  (teeth_id, 'Using ~면 안 되다 (Must not/Cannot)', '~면 안 되다', 'Expresses prohibition. Example: 식사 직후 양치질하면 안 된다 (Cannot brush teeth immediately after eating)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (teeth_id, '아버지', '양치질했니?', 'Yangchijilhaetni?', 'Did you brush your teeth?', 1),
  (teeth_id, '자녀', '아직 안 했어.', 'Ajik an haesso.', 'Not yet.', 2),
  (teeth_id, '아버지', '밥 먹은 후에는 양치질을 해야지! 충치가 생길 수 있어.', 'Bap meog-eun hue-neun yangchijireul hae yaji! Chungchi-ga saenggyul su isseo.', 'You should brush your teeth after eating! You could get cavities.', 3),
  (teeth_id, '자녀', '네, 지금 할게요.', 'Ne, jigeum halge-yo.', 'Okay, I''ll do it now.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (teeth_id, '"칫솔"은 무엇입니까?', '["toothpaste", "toothbrush", "dental floss", "mouth"]', 1, 'Correct! "칫솔" is a toothbrush', 1),
  (teeth_id, '하루에 몇 번 양치질해야 합니까?', '["1번", "2번", "3번", "5번"]', 2, 'Correct! Should brush 3 times daily', 2),
  (teeth_id, '충치를 예방하려면?', '["soft toothbrush", "regular brushing and flossing", "eat more candy", "never use toothpaste"]', 1, 'Correct! Brush regularly and use floss', 3),
  (teeth_id, '"상큼하다"는 어떤 맛입니까?', '["sweet", "bitter", "fresh/minty", "spicy"]', 2, 'Correct! It describes fresh, minty flavor', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (teeth_id, '건강한 치아를 유지하려면 정기적으로 양치질을 해야 한다. 일반적으로 아침, 점심 후, 잠자기 전에 양치질하는 것이 좋다. 칫솔의 털이 부드러운 것을 선택하고, 치약을 적당량 사용하여 모든 치아와 잇몸을 깨끗하게 닦아야 한다. 양치질 후 치실을 사용하여 치아 사이의 음식물을 제거하면 충치를 효과적으로 예방할 수 있다.', 'To maintain healthy teeth, you should brush regularly. Generally, it is good to brush after breakfast, lunch, and before bedtime. Choose a toothbrush with soft bristles and use an appropriate amount of toothpaste to clean all teeth and gums. After brushing, use dental floss to remove food between teeth to effectively prevent cavities.', 1);

  -- ===== LESSON 7: SHAVING =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (shaving_id, '면도하다', 'myeondohada', 'to shave', 1),
  (shaving_id, '면도기', 'myeondogi', 'razor', 2),
  (shaving_id, '면도날', 'myeondonal', 'razor blade', 3),
  (shaving_id, '면도 거품', 'myeondo geotum', 'shaving cream/foam', 4),
  (shaving_id, '로션', 'rosyon', 'aftershave lotion', 5),
  (shaving_id, '콧수염', 'kotsusyeom', 'mustache', 6),
  (shaving_id, '턱', 'teok', 'chin', 7),
  (shaving_id, '수염', 'suyeom', 'beard', 8),
  (shaving_id, '깎다', 'kkakda', 'to cut/trim', 9),
  (shaving_id, '얼굴', 'eolgul', 'face', 10),
  (shaving_id, '칼', 'kal', 'blade/knife', 11),
  (shaving_id, '부드럽다', 'budeureopsda', 'to be soft/smooth', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (shaving_id, 'Using ~기 전에 (Before doing)', '~기 전에', 'Expresses action before something else. Example: 면도하기 전에 거품을 바른다 (Apply foam before shaving)', 1),
  (shaving_id, 'Using ~도록 하다 (Make sure to/Try to)', '~도록 하다', 'Expresses purpose or intention. Example: 피부가 부드러우도록 면도한다 (Make sure skin becomes smooth when shaving)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (shaving_id, '아내', '오늘 면도 안 했네?', 'Oneul myeondo an haetne?', 'Didn''t you shave today?', 1),
  (shaving_id, '남편', '지금 하고 있어. 거품을 바르고 있어.', 'Jigeum hago isseo. Geotum-eul bareugo isseo.', 'I''m doing it now. I''m applying the foam.', 2),
  (shaving_id, '아내', '조심해. 손 베지 말고.', 'Josimhae. Son be ji margo.', 'Be careful. Don''t cut yourself.', 3),
  (shaving_id, '남편', '네, 주의할게. 다 끝나면 로션을 바를게.', 'Ne, ju-ihhalge. Da kkeulnamyeon rosyon-eul bareulge.', 'Yes, I''ll be careful. I''ll apply lotion when I''m done.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (shaving_id, '"면도기"는 무엇입니까?', '["toothbrush", "razor", "scissors", "comb"]', 1, 'Correct! "면도기" is a razor', 1),
  (shaving_id, '면도하기 전에 무엇을 해야 합니까?', '["apply foam", "dry face", "apply lotion", "cut beard"]', 0, 'Correct! Apply shaving cream/foam before shaving', 2),
  (shaving_id, '면도 후 피부 관리는?', '["washing with hot water", "applying aftershave lotion", "scratching face", "not using water"]', 1, 'Correct! Apply aftershave lotion', 3),
  (shaving_id, '"콧수염"은 어디에 나는 털입니까?', '["chin", "cheeks", "upper lip (mustache)", "neck"]', 2, 'Correct! It''s the mustache on the upper lip', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (shaving_id, '면도는 많은 남성들의 일상적인 미용 습관이다. 좋은 면도 경험을 위해서는 먼저 얼굴을 따뜻한 물로 씻고, 충분한 면도 거품을 피부에 바르는 것이 중요하다. 면도기의 날이 예리해야 하고, 부드러운 움직임으로 수염의 방향을 따라 면도해야 한다. 면도 후에는 반드시 로션이나 밤을 발라 피부가 건조해지지 않도록 해야 한다.', 'Shaving is a daily grooming habit for many men. For a good shaving experience, it is important to first wash your face with warm water and apply sufficient shaving cream to your skin. The razor blade must be sharp, and you should shave in the direction of beard growth with gentle movements. After shaving, you must apply lotion or balm to prevent skin dryness.', 1);

  -- ===== LESSON 8: GLASSES & CONTACT LENSES =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (glasses_id, '안경', 'angyeong', 'glasses/spectacles', 1),
  (glasses_id, '렌즈', 'renjeu', 'contact lens', 2),
  (glasses_id, '렌즈 액', 'renjeu aek', 'contact lens solution', 3),
  (glasses_id, '렌즈 용기', 'renjeu yonggi', 'lens case', 4),
  (glasses_id, '렌즈를 끼우다', 'renjeureul kkiuda', 'to put in contact lenses', 5),
  (glasses_id, '렌즈를 빼다', 'renjeureul ppaeda', 'to take out contact lenses', 6),
  (glasses_id, '안경을 쓰다', 'angyeong-eul sseuda', 'to put on glasses', 7),
  (glasses_id, '렌즈가 나가다', 'renjega nagada', 'contact lens slips out', 8),
  (glasses_id, '렌즈를 깨끗이 하다', 'renjeureul kkaekkeushage hada', 'to clean contact lenses', 9),
  (glasses_id, '시력', 'siryeok', 'eyesight/vision', 10),
  (glasses_id, '시력 검사', 'siryeok geomsa', 'eye exam', 11),
  (glasses_id, '안과 의사', 'angwa uisa', 'ophthalmologist', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (glasses_id, 'Using ~기 때문에 (Because/Due to)', '~기 때문에', 'Expresses reason or cause. Example: 시력이 안 좋기 때문에 안경을 써야 한다 (Because vision is poor, must wear glasses)', 1),
  (glasses_id, 'Using ~면서 (While/At the same time)', '~면서', 'Expresses simultaneous actions. Example: 안경을 벗으면서 렌즈를 낀다 (While taking off glasses, put in contacts)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (glasses_id, '친구1', '넌 안경을 언제부터 써?', 'Neon angyeong-eul eonjebuto sseo?', 'When did you start wearing glasses?', 1),
  (glasses_id, '친구2', '고등학교 때부터. 이제 렌즈를 많이 끼워.', 'Godeunghakgyo ttaebuto. Ije renjeureul manhi kkiwo.', 'Since high school. Now I wear contacts often.', 2),
  (glasses_id, '친구1', '렌즈 관리가 힘들지 않아?', 'Renjeu gwanri-ga himdeulji anha?', 'Isn''t lens care difficult?', 3),
  (glasses_id, '친구2', '처음에는 힘들었는데, 이제는 익숙해.', 'Cheoumeuro-neun himdeuleotnneun de, ijeun iksukae.', 'It was hard at first, but I''m used to it now.', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (glasses_id, '"렌즈 액"은 무엇입니까?', '["glasses cleaner", "contact lens solution", "sunscreen", "lotion"]', 1, 'Correct! "렌즈 액" is contact lens solution', 1),
  (glasses_id, '렌즈를 빼려면 무엇을 사용합니까?', '["손톱", "렌즈 액", "깨끗한 손", "종이"]', 2, 'Correct! Use clean hands and lens solution', 2),
  (glasses_id, '렌즈를 보관할 때 필요한 것은?', '["sunglasses", "lens case", "glasses cleaner", "eye drops"]', 1, 'Correct! Need a lens case for storage', 3),
  (glasses_id, '시력이 안 좋으면 어떻게 해야 합니까?', '["ignore it", "visit eye doctor", "wear sunglasses", "sleep more"]', 1, 'Correct! Visit an ophthalmologist for eye exam', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (glasses_id, '많은 사람들이 시력이 나쁘면 안경이나 렌즈를 사용한다. 안경은 착용이 간단하지만 렌즈는 더 신경을 써서 관리해야 한다. 렌즈를 끼우기 전에 손을 깨끗이 씻고, 렌즈 액에 충분히 담가야 한다. 렌즈는 하루 종일 끼워도 되지만, 너무 오래 끼우면 눈이 건조해질 수 있으므로 필요할 때는 안경으로 바꿔 쓰는 것이 좋다.', 'Many people use glasses or contact lenses if they have poor eyesight. Glasses are simple to wear, but contacts require more careful management. Before putting in contacts, wash your hands thoroughly and soak the lens in lens solution. While contacts can be worn all day, wearing them too long can cause dry eyes, so it''s good to switch to glasses when needed.', 1);

  -- ===== LESSON 9: GETTING DRESSED =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (dressed_id, '옷을 입다', 'oseul ibda', 'to put on clothes/get dressed', 1),
  (dressed_id, '셔츠', 'syeocheu', 'shirt', 2),
  (dressed_id, '바지', 'baji', 'pants', 3),
  (dressed_id, '치마', 'chima', 'skirt', 4),
  (dressed_id, '양말', 'yangmal', 'socks', 5),
  (dressed_id, '신발', 'sinbal', 'shoes', 6),
  (dressed_id, '벨트', 'belteu', 'belt', 7),
  (dressed_id, '넥타이', 'nektai', 'necktie', 8),
  (dressed_id, '옷장', 'otjang', 'closet/wardrobe', 9),
  (dressed_id, '걸어 맞추다', 'georeeo matchuda', 'to match/coordinate outfit', 10),
  (dressed_id, '어울리다', 'eoullida', 'to suit/look good', 11),
  (dressed_id, '따뜻하다', 'ttattaeuhada', 'to be warm', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (dressed_id, 'Using ~고 (and then)', '~고', 'Connects sequential actions. Example: 셔츠를 입고 바지를 입는다 (Put on shirt and then put on pants)', 1),
  (dressed_id, 'Using ~어야 하다 (Must/Need to)', '~어야 하다', 'Expresses obligation or necessity. Example: 신발을 신어야 한다 (Must put on shoes)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (dressed_id, '어머니', '얼른 옷을 입어! 학교에 늦을 거야.', 'Eolreon oseul ibeo! Hakgyo-e neujeul geoya.', 'Put on clothes quickly! You''ll be late for school.', 1),
  (dressed_id, '자녀', '뭘 입을까? 추운데 옷을 많이 입어야 하나?', 'Mwol ibeulkka? Chuun de oseul manhi ibeo ya hana?', 'What should I wear? Do I need to wear a lot since it''s cold?', 2),
  (dressed_id, '어머니', '응, 따뜻한 옷을 입어. 그리고 신발도 신어야지.', 'Eung, ttattaeuthan oseul ibeo. Geurigo sinbal-do shineorayaji.', 'Yes, wear warm clothes. And put on shoes too.', 3),
  (dressed_id, '자녀', '좋아. 이제 준비됐어!', 'Joha. Ije junbidwaesseo!', 'Okay, I''m ready now!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (dressed_id, '"옷을 입다"는 무엇을 의미합니까?', '["to wash clothes", "to dry clothes", "to put on clothes", "to iron clothes"]', 2, 'Correct! It means to put on clothes/get dressed', 1),
  (dressed_id, '추운 날씨에는 어떤 옷을 입어야 합니까?', '["light clothes", "warm clothes", "thin clothes", "sleeveless"]', 1, 'Correct! Wear warm clothes when it''s cold', 2),
  (dressed_id, '"어울리다"는 무엇입니까?', '["to wear", "to match/suit", "to fold", "to hang"]', 1, 'Correct! It means to suit or look good', 3),
  (dressed_id, '옷을 입는 순서는?', '["pants, shirt, socks, shoes", "socks, shirt, pants, shoes", "shirt, socks, pants, shoes", "shoes, pants, shirt, socks"]', 2, 'Correct! Usually socks, then shirt, pants, shoes', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (dressed_id, '옷을 입는 것은 매일 아침 일어난 후 해야 할 중요한 일이다. 날씨와 기온을 고려하여 적절한 옷을 선택하는 것이 중요하다. 추운 겨울에는 따뜻한 코트나 스웨터를 입고, 더운 여름에는 가볍고 통풍이 잘 되는 옷을 선택해야 한다. 옷을 입을 때는 각 옷이 어울리는지 확인하고, 신발도 옷에 맞춰 선택하는 것이 좋다.', 'Getting dressed is an important daily task after waking up. It is important to choose appropriate clothes considering the weather and temperature. In cold winter, wear warm coats or sweaters, and in hot summer, choose light and well-ventilated clothing. When getting dressed, check if each piece matches well, and choose shoes that coordinate with your outfit.', 1);

  -- ===== LESSON 10: MAKEUP =====
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (makeup_id, '화장하다', 'hwajianghada', 'to put on makeup', 1),
  (makeup_id, '파운데이션', 'pa-un-dei-syeon', 'foundation', 2),
  (makeup_id, '쿠션', 'kusyeon', 'cushion/BB cream', 3),
  (makeup_id, '컨실러', 'keonsilleo', 'concealer', 4),
  (makeup_id, '파우더', 'pa-u-deo', 'powder', 5),
  (makeup_id, '블러셔', 'beulleosy-eo', 'blush', 6),
  (makeup_id, '아이섀도우', 'ai-syae-do-u', 'eyeshadow', 7),
  (makeup_id, '립스틱', 'ripseutik', 'lipstick', 8),
  (makeup_id, '마스카라', 'maskara', 'mascara', 9),
  (makeup_id, '메이크업 브러시', 'meikeeuop beuleo-si', 'makeup brush', 10),
  (makeup_id, '화장을 지우다', 'hwajang-eul jiuda', 'to remove makeup', 11),
  (makeup_id, '화장이 잘 받다', 'hwajang-i jal batda', 'makeup applies well/looks good', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, sort_order) VALUES
  (makeup_id, 'Using ~는 동안 (While)', '~는 동안', 'Expresses an action during another action. Example: 화장하는 동안 거울을 본다 (While putting on makeup, look in the mirror)', 1),
  (makeup_id, 'Using ~고 나서 (After)', '~고 나서', 'Expresses sequence. Example: 파운데이션을 바르고 나서 파우더를 한다 (After applying foundation, apply powder)', 2);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (makeup_id, '친구A', '화장 끝났어?', 'Hwajang kkeulnasseo?', 'Are you done with makeup?', 1),
  (makeup_id, '친구B', '아직 반이야. 파운데이션만 했어.', 'Ajik ban-iya. Pa-un-dei-syeon-man haesseo.', 'Only halfway. I''ve just applied foundation.', 2),
  (makeup_id, '친구A', '파우더와 아이섀도우도 해야 하지?', 'Pa-u-deo-wa ai-syae-do-u-do hae ya haji?', 'Don''t you still need to apply powder and eyeshadow?', 3),
  (makeup_id, '친구B', '응, 마지막에 립스틱만 하면 돼!', 'Eung, majimagk-e ripseutik-man hamyeon dwae!', 'Yes, I just need to apply lipstick at the end!', 4);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (makeup_id, '"화장하다"는 무엇입니까?', '["to wash", "to put on makeup", "to remove makeup", "to sleep"]', 1, 'Correct! "화장하다" means to put on makeup', 1),
  (makeup_id, '화장의 첫 번째 단계는?', '["eyeshadow", "foundation", "lipstick", "mascara"]', 1, 'Correct! Apply foundation first', 2),
  (makeup_id, '"쿠션"은 무엇입니까?', '["foundation", "blush", "BB cream/cushion", "concealer"]', 2, 'Correct! A cushion is a type of compact BB cream', 3),
  (makeup_id, '화장 후 제거할 때는?', '["use only water", "use cleansing water or makeup remover", "use soap only", "ignore it overnight"]', 1, 'Correct! Use cleansing water or makeup remover', 4);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (makeup_id, '화장은 많은 여성들의 일상적인 미용 습관이다. 좋은 화장을 위해서는 먼저 피부를 깨끗이 세안하고, 스킨과 로션으로 피부를 정돈한다. 그 다음 파운데이션을 고르게 펴 바르고, 파우더로 마무리한다. 눈과 입을 강조하기 위해 아이섀도우와 립스틱을 사용한다. 화장이 끝나면 하루 종일 예쁘게 유지되도록 하는 것이 중요하다. 밤에 집에 돌아오면 반드시 화장을 깨끗이 지우고 피부를 관리해야 한다.', 'Makeup is a daily grooming habit for many women. For good makeup, first cleanse your skin thoroughly and prepare it with toner and lotion. Then apply foundation evenly and finish with powder. Use eyeshadow and lipstick to emphasize eyes and lips. It is important to keep makeup looking beautiful throughout the day. When you come home at night, you must remove all makeup and care for your skin properly.', 1);

END $$;
