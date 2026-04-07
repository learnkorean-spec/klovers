-- K-Drama lessons 6-30: Full content seed
-- K-Drama lessons 6–30: Full content seed


DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 6;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '첫사랑', 'cheotsarang', 'first love', 1),
  (l_id, '설레다', 'seolleDA', 'to be excited / to flutter (heart)', 2),
  (l_id, '두근거리다', 'dugeungeolida', 'to throb / heart pounding', 3),
  (l_id, '고백하다', 'goBaek-hada', 'to confess feelings', 4),
  (l_id, '좋아하다', 'joahada', 'to like', 5),
  (l_id, '사랑에 빠지다', 'sarange ppajida', 'to fall in love', 6),
  (l_id, '운명', 'unmyeong', 'fate / destiny', 7),
  (l_id, '설레임', 'seolle-im', 'flutter / excitement', 8),
  (l_id, '누설림', 'nuseollim', 'feeling of butterflies', 9),
  (l_id, '서로 좋아하다', 'seoro joahada', 'to like each other', 10),
  (l_id, '시선을 받다', 'sisyeoneul batda', 'to receive one''s gaze', 11),
  (l_id, '눈이 마주치다', 'nuni majuchida', 'eyes to meet', 12),
  (l_id, '가슴이 뜨다', 'gaseumi tteuda', 'heart to pound', 13),
  (l_id, '말을 못 하다', 'maleul mot hada', 'to be unable to speak', 14),
  (l_id, '얼굴이 빨개지다', 'eolguri ppealgeojida', 'to blush', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '아/어 보이다 — appears to be / seems', '[동사어간 / 형용사어간] + 보이다', '보이다 after a verb/adjective conjugation means it appears / seems. Used to describe the visible signs of feelings.', '[{"korean": "니 누구를 좋아하는 것 같아 보여.", "english": "You seem to like someone."}, {"korean": "얼굴이 빨개지 보여.", "english": "Your face looks flushed."}, {"korean": "눈이 마주치는 순간 심장이 뜨는 것 같았어.", "english": "The moment our eyes met my heart seemed to pound."}]', 1),
  (l_id, '난 너가 — informal intimate speech pattern', '1인칭 + (은)는 + 2인칭이/가', 'In K-Drama first love scenes characters use intimate speech. 난 = I (informal), 네/너 = you (informal).', '[{"korean": "난 너가 좋아.", "english": "I like you."}, {"korean": "너 눥가 나를 좋아하는 것 같았어.", "english": "It seemed you liked me."}, {"korean": "난 너를 모르겠어.", "english": "I did not know it was you (in that way)."}]', 2),
  (l_id, '지말다 — to end up doing (unintentional result)', '[동사어간] + 고 말다', '고 말다 expresses an unintentional or regrettable outcome. Very common in dramatic love confessions.', '[{"korean": "사랑에 빠지고 말았어.", "english": "I ended up falling in love."}, {"korean": "너를 생각하고 말았어.", "english": "I ended up thinking of you."}, {"korean": "보고 싶다고 말할게 았어.", "english": "I almost said I wanted to see you."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '지수', '(속으로) 왜 저 사람을 보면 심장이 이렇게 뜨는 거야...', '(sogeum-ro) Wae jeo sarameul bomyeon simjangi ireoke tteuneun geoya...', '(to herself) Why does my heart pound so much when I look at that person...', 1),
  (l_id, '지수', '(팁 떨어며) 실례하는데... 이거 들리나요? (노트를 내밀며)', '(ttam ddeoreomyo) Sillyehaneunde... igeo deullina-yo? (noteurul naeMillMyeo)', '(sweating) Excuse me... can you hear this? (holding out a note)', 2),
  (l_id, '준서', '어... (노트를 읽고 멈춰 서)...', 'Eo... (noteurul ilgo meomcheo seo)...', 'Uh... (reads note, stops, stands still)...', 3),
  (l_id, '준서', '(천청히 골리서 미소를 지으며) ... 니가 나를 좋아한다고?', '(cheoncheonhi gollyeo misoreul jieuMYeo) ... niga nareul joahanda-go?', '(slowly turning and smiling) ... you like me?', 4),
  (l_id, '지수', '\(uae38켈 머리를 숙이며) ... 실수일지도... 모르겄 만의 첩 내 말이야.', '(gippeun meorireul sukiMyeo) ... silsuIljIdo... moreuGan maNeui cheok nae malieya.', '(bowing head) ... it might be a mistake... I do not know what got into me.', 5),
  (l_id, '준서', '아니. 천사만에 한번 말해 줘서 고마워.', 'Ani. Cheon-samane hanBeon malhaejwoseo gomawo.', 'No. Thank you for telling me once in a thousand years.', 6),
  (l_id, '지수', '네\ea? 게... 게다 말하는 거야?', 'Nae? Gye... gyeoda malHaneun geoya?', 'What? Is that... is that a yes?', 7),
  (l_id, '준서', '나도 너 좋아행거든. 웩지 이제야 에. 먹어도 돼.', 'Nado neo joahaenggeodun. Waenji ijeya yo. Meogeodo doe.', 'I liked you too actually. I wonder why it is only now. You''re allowed.', 8),
  (l_id, '지수', '(눈물이 나르려하며) 의두려움게... 정말 정말 고마워.', '(nunmuri nareullyeohaMYeo) Euiduryowge... jeongmal jeongmal gomawo.', '(tears welling) It is awkward... but really really thank you.', 9);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''첫사랑'' means:', '["true love", "first love", "one-sided love", "forbidden love"]', 1, '첫사랑 means first love. 첫 = first, 사랑 = love.', 1),
  (l_id, 'Which phrase means ''my heart is pounding''?', '["가슴이 아파요", "가슴이 떠요", "가슴이 따뜻해요", "가슴이 차가워요"]', 1, '가슴이 뜨다 means the heart pounds or flutters with excitement.', 2),
  (l_id, '''시선을 받다'' means:', '["to look away", "to make eye contact", "to receive someone''s gaze", "to avoid someone"]', 2, '시선을 받다 = to receive / catch someone''s gaze.', 3),
  (l_id, 'The grammar ''고 말다'' expresses:', '["intention", "ability", "unintentional result", "request"]', 2, '고 말다 expresses an unintentional or regrettable outcome.', 4),
  (l_id, '''두근거리다'' means:', '["to be nervous", "to throb / heart pounding", "to tremble", "to be happy"]', 1, '두근거리다 = to throb, heart pounding.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 드라마에서 첫사랑 장면은 매우 코마로운 맟으로 그려진다. 두 사람이 우연히 눈이 마주치는 순간, 시간이 멈춰 버리는 듯한 느낙이 담긴다. 조용한 봄바람에 슬로맨 콘티논 버튼이 날리고, 주인공들의 실렇거리는 말에 시청자들은 하나 되어 짐짓 짐짓 아파한다. 첫사랑은 언제나 순수하고 아름답다.', 'In Korean dramas the first love scene is depicted in a very romantic way. The moment two people accidentally meet eyes, the feeling that time has stopped is captured. A slow-motion button flies in a quiet spring breeze and viewers ache together over the characters'' hesitant words. First love is always pure and beautiful.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 7;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '고백', 'gobaek', 'confession of feelings', 1),
  (l_id, '고백하다', 'goBaek-hada', 'to confess feelings', 2),
  (l_id, '마음을 전하다', 'maemumeul jeonhada', 'to convey one''s heart', 3),
  (l_id, '답장', 'dabjang', 'answer / response', 4),
  (l_id, '거절하다', 'geojeolhada', 'to reject', 5),
  (l_id, '받아들이다', 'badadrida', 'to accept', 6),
  (l_id, '한수마디', 'hansu-madi', 'one final statement', 7),
  (l_id, '용기를 내다', 'yongGireul naeda', 'to muster courage', 8),
  (l_id, '떨리다', 'teollida', 'to tremble', 9),
  (l_id, '진심', 'jinsim', 'sincerity / true heart', 10),
  (l_id, '진심으로', 'jinsimeuro', 'sincerely', 11),
  (l_id, '기다리다', 'gidarida', 'to wait', 12),
  (l_id, '쭜하다', 'choehada', 'to be the first / first time', 13),
  (l_id, '평생 상 완성', 'pyeongsaeng sanghwan', 'perfect match / lifelong partner', 14),
  (l_id, '올인원이 되다', 'oreunweon-i doeda', 'to become your person completely', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '아/어 주세요 — requesting sincerely', '[동사어간] + 주세요', '주세요 added to a verb makes a sincere or emotional request. In confession scenes this sounds heartfelt.', '[{"korean": "대답을 해 주세요.", "english": "Please give me an answer."}, {"korean": "나로 봄 두세요.", "english": "Please stay by my side."}, {"korean": "마음을 받아 주세요.", "english": "Please accept my heart."}]', 1),
  (l_id, '근데 — but / however (conversation pivot)', '[머 메 솔] + 근데', '근데 is a conjunction meaning but / however. In confessions it is used to pivot from small talk to the real confession.', '[{"korean": "나 할 말이 있는데... 근데 어떻게 시작해야 할지 모르겠어.", "english": "I have something to say... but I do not know how to start."}, {"korean": "근데, 나 너 좋아해.", "english": "But, I like you."}, {"korean": "바쁘다고 했는데요... 근데 연락이 안 돼요.", "english": "You said you were busy... but you haven''t been in touch."}]', 2),
  (l_id, '영원히 — forever / always', '[시간 부사] + 동사', '영원히 (forever) and 항상 (always) are powerful adverbs in romantic confessions.', '[{"korean": "영원히 답장 기다리걤 해.", "english": "I will wait for your answer forever."}, {"korean": "항상 널 사랑해.", "english": "I will always love you."}, {"korean": "답 없어도 나는 남아 있을게.", "english": "Even without an answer I will stay."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '지수', '미쓸이야. 지해 이야기 조금 해도 돼?', 'MiSOyo. Jiha iyagi jom haedo doe?', 'Miso. Can I say something to Jiha?', 1),
  (l_id, '미쓸', '응, 말해.', 'Eung, malhae.', 'Sure, say it.', 2),
  (l_id, '지수', '\(둥 바라보멹) 나... 너 좋아해. 오래럮 했는데 이제야 용기가 났어.', '(ttok barabomyeO) Na... neo joahae. Oraedongane haetneunde iJeyA yongGiga nAseo.', '(looking straight at her) I... like you. It has been a long time but now I have the courage to say it.', 3),
  (l_id, '미쓸', '(말없이 누운 뢌... 슬론히 녹라며) ...', '(maleobsi nuun roe... seuylreoni nollramyeo) ...', '(silent eyes wide in surprise) ...', 4),
  (l_id, '지수', '대답 안 해도 궩켾아. 근데 알았으면 해서.', 'Daedap an haedo gwaencheona. Geunde alasseuMYeon haeSeo.', 'You do not have to answer. But I wanted you to know.', 5),
  (l_id, '미쓸', '지수야... (레 말을 아끼며) 나도 너 생각했었는데.', 'Jisua... (re Maleul akkyeMYeo) Nado neo saengGakaetneunde.', 'Jisu... (holding back words) I thought about you too.', 6),
  (l_id, '지수', '진짜? 그링... 그링면 나링 지금부터... 시작해도 돼?', 'JinJja? Geurim... geurimyeon nareung Jigeumbuteo... sijakhaedo doe?', 'Really? Then... does that mean starting from now... can we?', 7),
  (l_id, '미쓸', '\(빙 웃으면서) 출발이 맥더라는 거야.', '(ppeo useuMYeo) Chulbari maegtteoraneun geoya.', '(softly laughing) The start is the most important.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''고백하다'' means:', '["to apologize", "to confess feelings", "to ask a question", "to propose marriage"]', 1, '고백하다 = to confess one''s feelings.', 1),
  (l_id, 'Which phrase means ''to muster courage''?', '["용기가 없다", "용기를 내다", "용기를 주다", "용기가 많다"]', 1, '용기를 내다 = to summon / muster courage.', 2),
  (l_id, '''거절하다'' means:', '["to accept", "to hesitate", "to reject", "to agree"]', 2, '거절하다 = to reject / refuse.', 3),
  (l_id, '''Please accept my heart'' in Korean:', '["마음을 받아줘요", "마음을 받아 주세요", "마음을 전해 주세요", "마음을 줘요"]', 1, '마음을 받아 주세요 = please accept my heart.', 4),
  (l_id, '''영원히'' means:', '["sincerely", "always", "forever", "truly"]', 2, '영원히 means forever.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 드라마의 고백 장면은 항상 구청하게 연출된다. 비가 내리는 저녁나, 란포드 연담 위나, 같은 하늘 아래에서 용기를 내어 마음을 전한다. 주인공은 떨리는 목소리로 "나 너 좋아해"라고 속삭이듯 말한다. 시청자들은 숨을 줍으면서 상대방의 대답을 기다린다. 고백 장면은 드라마에서 가장 마음을 두근거리게 하는 순간이다.', 'The confession scene in Korean drama is always directed spectacularly. On a rainy evening, on a rooftop, or under the same sky, the protagonist gathers courage to convey their heart. The main character says "I like you" in a trembling voice almost like a whisper. Viewers hold their breath waiting for the other person''s answer. The confession scene is the moment in drama that makes your heart pound the most.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 8;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '이별', 'iByeol', 'separation / break-up', 1),
  (l_id, '헤어지다', 'haeojida', 'to break up', 2),
  (l_id, '이별하다', 'iByeolhada', 'to part ways', 3),
  (l_id, '눈물', 'nunmul', 'tear / tears', 4),
  (l_id, '마음이 아프다', 'maeumi apuda', 'heart hurts', 5),
  (l_id, '걸어갈 수 없다', 'georeogal su eopda', 'cannot walk away', 6),
  (l_id, '뭐야', 'mwoya', 'what is it (upset tone)', 7),
  (l_id, '올지 않다', 'olchi anda', 'not right / not fair', 8),
  (l_id, '최선을 다하다', 'Choeseoneul Dahada', 'to do one''s best', 9),
  (l_id, '불해하다', 'bulhaehada', 'to be unhappy / uncomfortable', 10),
  (l_id, '포기하다', 'pogihada', 'to give up', 11),
  (l_id, '속이다', 'sogida', 'to be deceived', 12),
  (l_id, '미련', 'miren', 'lingering attachment', 13),
  (l_id, '자리를 지우다', 'jarijireul jiwuda', 'to erase one''s traces', 14),
  (l_id, '다시 시작하다', 'dasi sijakHada', 'to start over', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '지 마— do not + emotional command', '[동사어간] + 지 마 / 지 마세요', '지 마 is a strong emotional "do not". In break-up scenes it carries desperation and pain.', '[{"korean": "가지 마.", "english": "Do not go."}, {"korean": "이렇게 나를 헤어지는 것 옷지 않아.", "english": "Breaking up with me like this is not right."}, {"korean": "나를 낙관하게 두지 마.", "english": "Do not leave me behind."}]', 1),
  (l_id, '그래도 — even so / nevertheless', '[몇 메 솜] + 그래도', '그래도 means even so / despite that. Common in painful farewell lines where one person still loves the other.', '[{"korean": "그래도 너밖에 모르겠어.", "english": "Even so I only know you."}, {"korean": "그래도 늘 널 사랑해.", "english": "Even so I will always love you."}, {"korean": "그래도 생각에 삭려.", "english": "Even so it hurts to think about."}]', 2),
  (l_id, '답사박질하다 — dramatic accusation', '[주어] + [동사] + 다', 'In break-up scenes, using plain form 다 in speech (not 요/어요) shows emotional distancing. Watch how speech level drops when characters are upset.', '[{"korean": "네가 나를 사랑한 적 없어.", "english": "You never loved me."}, {"korean": "나 혼자 틈우지 마.", "english": "Do not leave me alone."}, {"korean": "이게 맞아? 진짜 로?", "english": "Is this right? Really?"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '지수', '(청청한 목소리로) 우리... 헤어지자.', '(cheonGcheonGhan moksori-ro) Uri... haeojija.', '(in a cold voice) Let us... break up.', 1),
  (l_id, '준서', '\... 마지막으로 든는 말인지 확인하고 싶어서.', '... majimageu-ro deuneun marinji hwagin-hago sipeo-seo.', '... I just want to confirm this is the last thing I hear.', 2),
  (l_id, '지수', '(뉴스를 응시하다) 미안해. 그마이... 한계인 것 같아.', '(dwitgiseureul eungyeongda) Mianhae. Geumai... hangyei-n geot gatA.', '(looking away) Sorry. I think that is... the limit.', 3),
  (l_id, '준서', '마지막 말 한마디... 할게. 너한테... 진짜 고마웠어.', 'MajiMak mal hanmadi... halGe. Neohante... jinjja gomawoSeo.', 'One last word... let me say it. To you... I was truly grateful.', 4),
  (l_id, '지수', '\(눈물을 삼키머) 나도. 너를 만나서... 행복했어.', '(nunmuleul samkyeoMYeo) Nado. Neoreul mannaseo... haengbokaesseo.', '(swallowing tears) Me too. Meeting you... made me happy.', 5),
  (l_id, '준서', '그리운 걸 알면서도... 가는 거야?', 'Geuriun geol almyeonSeo-do... ganeun geoya?', 'Even knowing you will miss me... you are still leaving?', 6),
  (l_id, '지수', '(돌아서는 되 말도 못 하고) ...', '(doraseone doe malDo mot hago) ...', '(turning around, unable to say another word) ...', 7),
  (l_id, '준서', '(혹시나 소리 낙이지 않게) ...너... 좋은 사람들 마나... 행복해.', '(hokina sori nochiji ange) ...neo... joeun saramdeul manna... haengboke.', '(barely audible) ...you... meet good people... be happy.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''헤어지다'' means:', '["to fall in love", "to break up", "to meet again", "to make up"]', 1, '헤어지다 = to break up / separate.', 1),
  (l_id, '''눈물'' means:', '["anger", "tears", "regret", "longing"]', 1, '눈물 = tears.', 2),
  (l_id, 'Which sentence means ''do not go''?', '["가요", "가도 돼요", "가지 마", "가세요"]', 2, '가지 마 = do not go (emotional prohibition).', 3),
  (l_id, '''미련'' in K-drama means:', '["regret", "longing / lingering attachment", "apology", "sorrow"]', 1, '미련 = lingering attachment or nostalgia for an ex-lover.', 4),
  (l_id, 'The grammar ''그래도'' means:', '["therefore", "because", "even so", "although"]', 2, '그래도 = even so / nevertheless.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '헤어지는 장면은 한국 드라마에서 가장 빨리 좀을 는어롭하는 순간이다. 비 내리는 버스 정류장에서, 또는 집 앞 골목에서 두 사람이 다시 만나지 못할 것수로 마지막 말을 나됬다. 말을 잘 못하는 주인공의 모습을 보면 시청자들은 함글이 울체라온다. 이별은 끝이 아니라 더 크게 성장하기 위한 과정이라고 드라마는 말한다.', 'The break-up scene is the moment in Korean drama that makes viewers most teary. At a rainy bus stop, or in the alleyway outside home, two people exchange last words as if they may never meet again. Watching the protagonist who cannot speak properly, viewers burst into tears. Drama says separation is not an end but a process of growing bigger.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 9;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '질투', 'jiltu', 'jealousy', 1),
  (l_id, '질투하다', 'jiltuhada', 'to be jealous', 2),
  (l_id, '시기하다', 'sikihada', 'to be jealous / possessive', 3),
  (l_id, '질투가 났다', 'jiltu-ga nasda', 'jealousy arises', 4),
  (l_id, '서운하다', 'seo-unhada', 'to feel jealous / left out', 5),
  (l_id, '얼마나 체냤다', 'eolmana chaenaeda', 'how possessive', 6),
  (l_id, '의심', 'uisim', 'suspicion', 7),
  (l_id, '확인하다', 'hwaGin-hada', 'to confirm / to check', 8),
  (l_id, '눈돌림하다', 'nunDorimhada', 'to watch with jealous eyes', 9),
  (l_id, '지켜보다', 'jikyeoboda', 'to watch over / to guard', 10),
  (l_id, '돈찬하다', 'donchanhada', 'to show off (jealousy trigger)', 11),
  (l_id, '핌우다', 'piuda', 'to make jealous', 12),
  (l_id, '의기하다', 'uigihada', 'to rely on / depend on', 13),
  (l_id, '도대체', 'dodaeche', 'in the world / honestly', 14),
  (l_id, '친한 첡하다', 'chinhan cheok-hada', 'to pretend to be close', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '나한테 왜 그래 — why to me', '[나한테/너한테] + 왜 + [동사]?', '나한테 means to me. 너한테 means to you. These indirect object markers are key in jealousy confrontations.', '[{"korean": "나한테 왜 그러는 거야?", "english": "Why are you doing that to me?"}, {"korean": "너한테 또 신경 쓰이게.", "english": "I will pay attention to you again."}, {"korean": "나한테만 그러지.", "english": "Do it only to me."}]', 1),
  (l_id, '지금 뭐 해?  — what are you doing right now', '[time] + 댌/뭐 + [동사]?', '지금 덬 해? is a confrontational jealousy line. 덬 adds surprise/accusation to the present tense.', '[{"korean": "지금 웃으면서 덬 해?", "english": "What are you doing laughing right now?"}, {"korean": "저 사람이\rangle 누구야?", "english": "Who is that person?"}, {"korean": "같이 보내는 사이야?", "english": "Are you two together?"}]', 2),
  (l_id, '설마 — surely not / don''t tell me', '[스피조] 설마 + [동사/형용사]?', '설마 expresses disbelief or apprehension, used at the start of jealous accusations.', '[{"korean": "설마... 저 사람을 좋아하는 거 아니지?", "english": "Surely... you don''t like that person?"}, {"korean": "설마 나 질투하는 거 별로야?", "english": "Surely me being jealous is not a big deal?"}, {"korean": "설마 딜 헤어진 거 아니지?", "english": "You are not breaking up with me, are you?"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '(하염) 일 끝나면 바로 와.', '(haYeom) Il kkeutna-myeon baro wa.', '(firm) Come straight home when work is over.', 1),
  (l_id, '지수', '응? 옹 두 경에 상사랑 더리오라고 하던데.', 'Eung? Ot dU gyeong-e sangsa-rang deolyo-rago hadeonDe.', 'Hmm? My boss said to have dinner together.', 2),
  (l_id, '준서', '상사? 그 낙 일이지?', 'Sangsa? Geu nak iljiyo?', 'Boss? That falls guy?', 3),
  (l_id, '지수', '이사야. 업무 상 자리림단말이야!', 'Isaya. Eommu sang jaririm-Dan-maridA!', 'It is work related. It is a work dinner!', 4),
  (l_id, '준서', '(팔 끋으면서) 그 낙 너한테 눈 없다는 거 알지?', '(pal gkkeumyeo) Geu nak neo-hante nun eobsda-neun geo aljji?', '(arms crossed) You know that guy has eyes for you, right?', 5),
  (l_id, '지수', '진짜? 진짜 즉 질투하는 거야? 관델!', 'Jinjja? Jinjja Jeuk jiltuhaneun geoya? Gwan-DdEL!', 'Really? Are you seriously jealous? Stop it!', 6),
  (l_id, '준서', '질투 아니야! 만약을 대비해서 너를 지키는 거야.', 'Jiltu aniYA! Man-gyAKEUL Daebihaeseo nEoreul jikiNeun GeYA.', 'I am not jealous! I am protecting you against all possibilities.', 7),
  (l_id, '지수', '\(피식 웃으면서) 안 관떥다. 지켜주는 거... 질투자야.', '(piSik euseumyeo) An gwi-deosda. JikyeO juneun geo... jiltuja-ya.', '(stifling a smile) You are unbelievable. Protecting me... you jealous thing.', 8);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''지투하다'' means:', '["to be excited", "to be jealous", "to be confused", "to be angry"]', 1, '짉투하다 = to be jealous.', 1),
  (l_id, '''설마'' at the start of a sentence means:', '["therefore", "surely not / don''t tell me", "because", "even though"]', 1, '설마 = surely not / don''t tell me.', 2),
  (l_id, 'Which phrase means ''jealousy arises''?', '["질투가 없다", "질투가 나다", "질투를 주다", "질투가 좋다"]', 1, '짉투가 나다 = jealousy arises / appears.', 3),
  (l_id, '''너한테'' means:', '["from you", "to you / for you", "with you", "because of you"]', 1, '너한테 = to you (indirect object).', 4),
  (l_id, '''I was protecting you!'' in dramatic speech:', '["지켜줬잖아!", "지켜봤잖아!", "지켜줬어요!", "지켜줬어?"]', 0, '지켜줄잊아! = I was protecting you (plain, dramatic)', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '질투 장면은 한국 드라마에서 코믹한 어지에서도 끝남없이 등장한다. 남지주인공이 하염하게 플 끋거나, 여주인공이 애교를 부리면서 질투를 테스트하는 장면이 인기를 낌다. 질투는 관계가 주인공들에게 얼마나 중요한지 보여 주는 지표다. 시청자들은 질투하는 주인공을 보면서 웃으면서도 속으로 엓다이다.', 'The jealousy scene appears endlessly in Korean drama from the comical side. The male lead crossing his arms stiffly, or the female lead testing jealousy by acting cute, these scenes gain popularity. Jealousy is a sign that shows how important the relationship is to the protagonists. Viewers laugh at the jealous protagonist while secretly cheering.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 10;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '오해', 'ohae', 'misunderstanding', 1),
  (l_id, '오해하다', 'ohaehada', 'to misunderstand', 2),
  (l_id, '한으배', 'han-eubae', 'just a moment', 3),
  (l_id, '오해를 풀다', 'ohae-reul pulda', 'to clear up a misunderstanding', 4),
  (l_id, '해명하다', 'haemyeonghada', 'to explain / to clarify', 5),
  (l_id, '미덕하다', 'michida', 'to go crazy / to be beside oneself', 6),
  (l_id, '미신수', 'misinsO', 'bait / misunderstanding bait (K-drama term)', 7),
  (l_id, '사실이야', 'sasiriya', 'that is the truth / in fact', 8),
  (l_id, '극적의스러운', 'geukjeok-uiseu-reoun', 'dramatic', 9),
  (l_id, '착각하다', 'chakGaK-hada', 'to be mistaken / to have the wrong idea', 10),
  (l_id, '뮨만한 것이다', 'monman-han geosida', 'it appears that', 11),
  (l_id, '섞기다', 'ssekgida', 'to be twisted / misinterpreted', 12),
  (l_id, '병해를 풀다', 'byeonhae-reul pulda', 'to clear up a misunderstanding (formal)', 13),
  (l_id, '진실은', 'jinsireun', 'the truth is', 14),
  (l_id, '나한테는 그게 아니야', 'nahantteneun geu-ge aniYA', 'to me that is not what it is', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '도대체 — in the world / honestly', '[동사/형용사] + 도대체', '도대체 used before a question word shows frustration or disbelief. Classic in dramatic misunderstanding confrontations.', '[{"korean": "도대체 누가 가르쳐주는 거야?", "english": "In the world who taught you that?"}, {"korean": "지금 도대체 들어?", "english": "What are you saying?"}, {"korean": "잘못한 게 누가?", "english": "Who is at fault here?"}]', 1),
  (l_id, '착각하는 거 아니야 — are you mistaken?', '[주어] + 이/가 + 착각하는 거 아니야?', '착각하다 means to be mistaken. Asking 착각하는 거 아니야? confronts someone with their mistake.', '[{"korean": "네가 착각하는 거 아니야?", "english": "Aren''t you mistaken?"}, {"korean": "오해하지 마.", "english": "Don''t misunderstand."}, {"korean": "사실을 알고 나서 판단해.", "english": "Judge after you know the truth."}]', 2),
  (l_id, '알고 도 — even though one knows', '[알다/모르다] + 살리고 도', '고 도 appended to a verb means even though / even doing. Used in confrontations when someone accuses the other of knowing the truth.', '[{"korean": "알고도 모른 철했어?", "english": "You pretended not to know even though you knew?"}, {"korean": "보고도 모른 철했어?", "english": "You pretended not to see even though you did?"}, {"korean": "듣고도 듣지 못한 철했어?", "english": "You acted like you couldn''t hear even though you did?"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '(누괌에게) 나 이거 보고 있어. 지수에 대해 설명해.', '(nuguegge) Na igo bogo isseo. Jisu-e Daehae seolmyeonghae.', '(to someone) I am watching this. Explain about Jisu.', 1),
  (l_id, '지수', '수서치 말해. 착각하는 거야, 그대가.', 'SuseorChi malhae. ChakGakhaneun geoya, GeUDAe-ga.', 'Say it straight. You are the one who is mistaken.', 2),
  (l_id, '준서', '(사진을 내밀며) 이게 뾉리면 또... 또 변명하네?', '(sajineul naeMillMyeo) Ige boneunmyeo etto... ddeo byeonmyeonghane?', '(holding out a photo) If I show this... will you make another excuse?', 3),
  (l_id, '지수', '어... (누동시간 업는 머리가 회전하는 듯). 이거... 제대로 가른 게 아니야.', 'Eo... (nusimul eomneun meorigi hoejeonhaneun deut). Igo... jedaero bareul gari-go issneun ge aNiYa.', 'Uh... (spinning head). This... it is not what it looks like.', 4),
  (l_id, '준서', '(차갑게) 오해가 아니었으면 해명해.', '(chaGapGe) Ohae-ga animyeon haemyeonghae.', '(coldly) If there is no misunderstanding, then explain.', 5),
  (l_id, '지수', '진실은... (두 뒤 구조대) 지수 이 사실이... 나한테는 전혁 다른 의미었어.', 'JinSireun... (du dwi gutoDae) Jisui i sasiri... nahanteneun jeonhyeok dareun euimiyeosseo.', 'The truth is... (sighing deeply) this fact about Jisu... had a completely different meaning to me.', 6),
  (l_id, '준서', '(네 말이 물립다는 듯 운음하면서) ...', '(nae mair phuljineun deut unhaeumMYeo) ...', '(making a sound like your words hold water) ...', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''오해하다'' means:', '["to explain", "to misunderstand", "to forgive", "to accuse"]', 1, '오해하다 = to misunderstand.', 1),
  (l_id, 'Which phrase means ''to clear up a misunderstanding''?', '["오해를 만들다", "오해를 풀다", "오해를 키우다", "오해를 믿다"]', 1, '오해를 풀다 = to clear up a misunderstanding.', 2),
  (l_id, '''착각하다'' means:', '["to be right", "to be confused", "to be mistaken", "to be angry"]', 2, '착각하다 = to be mistaken / have the wrong idea.', 3),
  (l_id, '''도대체'' is used to express:', '["certainty", "frustration and disbelief", "politeness", "agreement"]', 1, '도대체 before a question word expresses frustration or disbelief.', 4),
  (l_id, '''Judge after you know the truth'' in Korean:', '["진실을 알기 전에 판단해", "사실을 모르고 판단해", "사실을 알고 나서 판단해", "진실을 알고 오해해"]', 2, '사실을 알고 나서 판단해 = judge after you know the truth.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 드라마에서 오해 장면은 이야기를 깁리게 하는 핵심 장치다. 주인공은 한 가지 단서만으로 사람을 심하게 오해하가 되고, 시청자들은 속으로 “해명좀00 해!”라고 소리친다. 오해가 풍리는 데는 또 다른 장면 다양한 장치가 필요하다. 가장 중요한 것은 세 사람의 대화를 듣고 진실을 알려는 열선이다.', 'In Korean drama the misunderstanding scene is a key device that complicates the story. The protagonist deeply misunderstands someone based on just one clue, and viewers shout internally "Just explain it!" Resolving the misunderstanding requires yet another scene with various devices. The most important thing is the key line that allows hearing three people''s conversations and learning the truth.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 11;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '화해', 'hwahae', 'reconciliation / making up', 1),
  (l_id, '화해하다', 'hwahaehada', 'to reconcile / to make up', 2),
  (l_id, '사과하다', 'sagwahada', 'to apologize', 3),
  (l_id, '용서하다', 'yongseo-hada', 'to forgive', 4),
  (l_id, '용서를 말다', 'yongseo-reul balda', 'to ask forgiveness', 5),
  (l_id, '미안하다', 'mianhada', 'to be sorry', 6),
  (l_id, '이해하다', 'ihaehada', 'to understand', 7),
  (l_id, '내 잘못이야', 'nae jamotiya', 'it is my fault', 8),
  (l_id, '셀경하다', 'sseongyeonghada', 'to be sensitive / sulky', 9),
  (l_id, '널 올하다', 'neo oltida', 'to be in the right (about you)', 10),
  (l_id, '다시 시작하다', 'dasi sijakHada', 'to start over', 11),
  (l_id, '화해의 키스', 'hwahae-ui kiseu', 'reconciliation kiss', 12),
  (l_id, '괴짜라', 'goenchanara', 'it is fine / let it go', 13),
  (l_id, '팁 풀다', 'tang pulda', 'to release tension', 14),
  (l_id, '운다', 'ulda', 'to cry', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '미안해 — informal apology', '[나에게] 미안해 / 미안해요 / 미안합니다', '미안하다 escalates in formality. In dramatic reconciliations characters drop formality to show sincerity.', '[{"korean": "미안해. 내 잘못이야.", "english": "I am sorry. It is my fault."}, {"korean": "진심으로 미안해요.", "english": "I am sincerely sorry."}, {"korean": "만번을 사과해도 모자람다.", "english": "Even a thousand apologies are not enough."}]', 1),
  (l_id, '용서해 줘 — please forgive me', '[용서하다] + 주다', '용서해 줘 = forgive me (informal). Adding 주다 makes it an emotional plea.', '[{"korean": "용서해 줘.", "english": "Forgive me."}, {"korean": "한 번만 용서해 줘.", "english": "Forgive me just once."}, {"korean": "이번 한 번만... 낐렌 말 안 할게.", "english": "Just this once... I promise not to do it again."}]', 2),
  (l_id, '다시 vs 또 — again', '[동사] + 다시 (purposeful again) / 또 (another time, casual)', '다시 implies intentional repetition, often used in reconciliation promises.', '[{"korean": "다시 시작하자.", "english": "Let us start again."}, {"korean": "다시는 그러지 않을게.", "english": "I will not do it again."}, {"korean": "지우고 다시 시작할 수 있다.", "english": "We can erase it and start over."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '지수야... (한참 돌아 서) 직접 찾아왼긴 얐랐는데.', 'Jisua... (hanchyam Doraseoseo) jikjeop chatawAjin aeyo-tneunde.', 'Jisu... (turning) Coming to find me directly is unexpected.', 1),
  (l_id, '지수', '미안해. 내가 너무 심하게 말했어. 다 내 잘못이야.', 'Mianhae. Naega neomu haesseo. Da nae jamotiya.', 'I am sorry. It was all my fault.', 2),
  (l_id, '준서', '(란 대답없이 눈만 깜짡) ... 네... 괆구치지도 않아.', '(nan daedapeobsi nunman kkamJjak)...Ne... gwaenchanji Do anta.', '(silent, just blinks) ... No... it is not okay yet.', 3),
  (l_id, '지수', '알아. 구따름이 아니라... 그냥 내가 너의 모습을 보고 싶어서.', 'Ara. GwaDarimI aNiRa... Geunyang naega neoui moseup-eul bogo sipeoSeo.', 'I know. Not to push you... I just wanted to see you.', 4),
  (l_id, '준서', '(타삤) 하... 이런 사람이. (앏았던 발이 저절로 다가서며)', '(tasik) Ha... ireonsaram-i. (meomchwotden bari jejeoro dagagaseoMyeo)', '(sighing) Ha... this person. (feet automatically walking closer)', 5),
  (l_id, '준서', '... 다시는 이런 일 없는 거다... 약속해.', '... Dasi-neun ireun il eomneun geodda... yaksokhae.', '... Promise me there will be no more of this... promise me.', 6),
  (l_id, '지수', '\(붩 안았다가서) 응, 약속. 진짜로 저죽에도 말이야.', '(ppyeo angGaseoseo) Eung, yakSok. JinJjaro jeok-juedo mariya.', '(embracing) Yes, I promise. I really mean it from the bottom of my heart.', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''화해하다'' means:', '["to break up", "to reconcile", "to apologize", "to misunderstand"]', 1, '화해하다 = to reconcile / to make up.', 1),
  (l_id, '''용서하다'' means:', '["to forgive", "to apologize", "to understand", "to fight"]', 0, '용서하다 = to forgive.', 2),
  (l_id, '‘내 잘못이야’ means:', '["it is your fault", "it is not my fault", "it is my fault", "nobody is at fault"]', 2, '내 잘못이야 = it is my fault.', 3),
  (l_id, 'How to say ''let us start over'':', '["다시 시작하자", "또 시작하자", "다시 끝내자", "다시 만나자"]', 0, '다시 시작하자 = let us start over.', 4),
  (l_id, '''진심으로'' means:', '["sincerely", "again", "formally", "carefully"]', 0, '진심으로 = sincerely / from the heart.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '화해 장면에서 주인공들은 허심차게 언어를 압고 진심을 전한다. 대사나 돌잌없이 몿은죤 한 우는 집안에 화해의 치유가 시작된다. 두 사람이 다시 함께 웃는 걸 보면서 시청자들은 눈물을 쉽히지 않는다. 화해는 종종 더 강한 연대감의 시작이 된다.', 'In the reconciliation scene protagonists compress their language and convey sincerity. Without dialogue, a single embrace in the rain starts the healing of reconciliation. Viewers cannot easily hold back tears seeing the two people laughing together again. Reconciliation often becomes the start of an even stronger bond.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 12;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '가족 갈등', 'gajok galdeung', 'family conflict', 1),
  (l_id, '부모님', 'bumonim', 'parents (honorific)', 2),
  (l_id, '며다', 'myeoda', 'mother-in-law (husband''s mother)', 3),
  (l_id, '시어머니', 'sieomeoni', 'mother-in-law', 4),
  (l_id, '나타나다', 'natanada', 'to appear / to emerge', 5),
  (l_id, '반대하다', 'bandaehada', 'to oppose', 6),
  (l_id, '추방하다', 'chubang-hada', 'to expel / to throw out', 7),
  (l_id, '하개하다', 'hagaehada', 'to resign / dismiss', 8),
  (l_id, '집에서 나가다', 'jibeseo nagada', 'to leave the house', 9),
  (l_id, '독립하다', 'dogriphada', 'to be independent', 10),
  (l_id, '율다', 'yulda', 'to scold / to tell off', 11),
  (l_id, '호통치다', 'hotongchida', 'to scold severely', 12),
  (l_id, '한숙을 하다', 'hansog-eul hada', 'to breathe a sigh', 13),
  (l_id, '슐잡하다', 'seuljapdada', 'to control / to hold tight', 14),
  (l_id, '관계를 끊다', 'gwangyereul kkeutda', 'to cut ties', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '어떻게 감히 — how dare you', '[어떻게 + 감히] + [동사]?', '어떻게 감히 means how dare you. A classic family drama confrontation phrase.', '[{"korean": "어떻게 감히 그랰 말을 하는 거야?", "english": "How dare you say something like that?"}, {"korean": "감히 누구에게 그렇슸지?", "english": "How dare you treat someone like that?"}, {"korean": "감히 나한테 대들거야?", "english": "How dare you talk back to me?"}]', 1),
  (l_id, '이 집에서 나가 — get out of this house', '[명령형] + 이 집에서 나가', '이 집에서 나가 is the iconic K-drama family-drama line. 나가 = go out (plain form command).', '[{"korean": "당장 이 집에서 나가.", "english": "Get out of this house right now."}, {"korean": "내 눈에 보이지 마.", "english": "Do not appear before my eyes."}, {"korean": "나가라고! 뎀 말 해?", "english": "I said go! What else is there to say?"}]', 2),
  (l_id, '누구 덕에 — thanks to whom', '[주어] + 덕에 / [누구] + 덕에', '덕에 expresses thanks or blame. 누구 덕에 means thanks to whom / because of whom.', '[{"korean": "누구 덕에 살았는데!", "english": "Thanks to whom have you been living?"}, {"korean": "다 너 덕에 이렇게 된 거야.", "english": "It all became like this because of you."}, {"korean": "내 덕에 키운 게 누구냘?", "english": "Who do you think raised you?"}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '어머니', '하우 말해. 지수는 다 넣어줘. 그 사람과는 안 돼.', 'Hwu malhae. Jineun da neoteo. Geu saramgwaneun an dwie.', 'Just say it. I give up on Jisu. It is not happening with that person.', 1),
  (l_id, '지수', '어머니. 저희 마음대로 허락해 주세요.', 'Eomeoni. Jeohui maemdaero heollak hae juseyo.', 'Mother. Please give us permission to do as we choose.', 2),
  (l_id, '어머니', '(소리를 높이며) 허락? 내가 너희 나라몜가? 감히 누구한테 허락을 내라고 해?', '(sori-reul nopimyeo) Heollak? Naega neohi naragani? Gamhi nuguHAnte heollareul naerago hae?', '(raising voice) Permission? Am I your ruler? How dare you ask me for permission?', 3),
  (l_id, '준서', '오해하세요. 저는 지수씨를 진심으로 사랑합니다.', 'Ohaehaseyo. Jeoneun JisuSsireul jinsimeuro saranghamnida.', 'Please understand. I sincerely love Jisu.', 4),
  (l_id, '어머니', '(젖문) 구체적으로 말해. 니가 내게 문제에 대한 해결에 설득력 있는 말을 들었는가?', '(jungmun) Guche-jeogeuro malhae. Niga naeGe munjeE daehAN haegyeo-E seoldeukngyeok inneun mareul deureotna?', '(coldly) Speak specifically. Did you hear any convincing argument about your solution to the problem?', 5),
  (l_id, '준서', '(겐다지만 답을 못 찾고) ...', '(gaetdajiman dabEUL mot chatgo) ...', '(firm but unable to find an answer) ...', 6),
  (l_id, '어머니', '()연락하지 마. 다시는 허락 걸어도 안 돼.', 'Yeonrak-haji MA. Dasi-neun heollak georeodO an dwie.', 'Do not contact me. I will never give permission again.', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''반대하다'' means:', '["to support", "to oppose", "to propose", "to discuss"]', 1, '반대하다 = to oppose.', 1),
  (l_id, 'How does a K-drama mother say ''get out of this house''?', '["이 집에 들어와", "이 집에서 나가", "이 집을 지켜", "이 집에 있어"]', 1, '이 집에서 나가 = get out of this house.', 2),
  (l_id, '''어떻게 감히'' expresses:', '["surprise", "how dare you", "please", "sorry"]', 1, '어떻게 감히 = how dare you (dramatic family drama phrase).', 3),
  (l_id, '''독립하다'' means:', '["to fight", "to be independent", "to run away", "to follow"]', 1, '독립하다 = to be independent.', 4),
  (l_id, '''덤도죠 나라몜가'' is a K-drama line that means:', '["Am I your parent?", "Am I your servant?", "Am I your master?", "Am I your friend?"]', 2, '나라몜가 = Am I your monarch? A dramatic line parents say.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '가족 갈등 장면은 한국 드라마에서 빠질 수 없는 요소다. 시어머니와 며느리의 대립, 부모의 반대를 무댶씼고 연애를 지켜나가는 스토리가 인기를 끼다. "이 집에서 나가!"  라는 대사는 한국 드라마를 대표하는 명대사다. 가족 갈등을 통해 주인공들은 더 강해지고 자신만의 인생을 개첡해 나간다.', 'Family conflict scenes are an indispensable element in Korean drama. Stories where protagonists overcome parental opposition and protect their love gain popularity. "Get out of this house!" is a famous line representing Korean drama. Through family conflict the protagonists grow stronger and carve out their own lives.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 13;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '복수', 'boksu', 'revenge', 1),
  (l_id, '복수하다', 'boksuhada', 'to take revenge', 2),
  (l_id, '악당', 'akdang', 'villain', 3),
  (l_id, '음모', 'eummo', 'conspiracy / scheme', 4),
  (l_id, '배신하다', 'baeshinhada', 'to betray', 5),
  (l_id, '넣어뜨동다', 'neodeotteuiDA', 'to corner / to trap', 6),
  (l_id, '증거', 'jeunggeo', 'evidence', 7),
  (l_id, '진실을 밝히다', 'jinsireul balkida', 'to reveal the truth', 8),
  (l_id, '뭔어', 'mweo', 'what (blunt)', 9),
  (l_id, '대가를 치르다', 'daegareul chirida', 'to pay the price', 10),
  (l_id, '교도소에 서다', 'gyodoso-e seuda', 'to end up in prison', 11),
  (l_id, '묨어뜨리다', 'mworeotteuRida', 'to shake off / to expose', 12),
  (l_id, '치밀하다', 'chimil-hada', 'to be meticulous / detailed', 13),
  (l_id, '하나씩 복수하다', 'hanasik boksuhada', 'to take revenge one by one', 14),
  (l_id, '증거를 잡다', 'jeunggeo-reul japda', 'to catch evidence', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '밀지 마 — do not think I will just stand by', '[밑지 마] + [동사]', '밑지 마 means do not underestimate. Used in revenge declarations.', '[{"korean": "내를 섛게 보지 마.", "english": "Do not look down on me."}, {"korean": "내가 그냥 당하고 있을 것 같아?", "english": "Do you think I will just take this sitting down?"}, {"korean": "다 대가를 치르게 할 것이다.", "english": "I will make you all pay the price."}]', 1),
  (l_id, '벘주다 — to let loose / to unleash', '[동사어간] + 벘주다', '벘주다 after a verb stem means to unleash or do completely. Common in villain and revenge declarations.', '[{"korean": "복수를 시작할 것이다.", "english": "I will begin the revenge."}, {"korean": "진실을 폭로해 버리게다.", "english": "I will expose the truth completely."}, {"korean": "이건 다 돌려놓겠어.", "english": "I am going to unleash all of this."}]', 2),
  (l_id, '기다린 보람이 있다 — there is a reward for waiting', '[기다리다] 보람이 있다', '보람이 있다 means there is a reward. Used in revenge dramas when the plan finally unfolds.', '[{"korean": "오래 기다린 보람이 있다.", "english": "There is a reward for waiting long."}, {"korean": "이 날을 기다렸어.", "english": "I have been waiting for this day."}, {"korean": "도망가지 마. 이미 다 둘러왔다.", "english": "Do not even try to run. I have already surrounded you."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '(나지막하게) 이제 다 끓났어. 넣어뜨는 데 시간이 걸렸는지 알아?', '(najikkage) Ije da geollyeotso. Cornering you took some time huh?', '(low voice) Now it is all over. You know how long it took to corner you?', 1),
  (l_id, '지수', '네가 지금까지... 이 모든 것이 너의 계획이었던 거야?', 'Niga jigeumkkaji... i modeun geosi neoui gyehogiesseon geoya?', 'You have been... was all of this your plan from the start?', 2),
  (l_id, '준서', '삼 년 전 너희들이 내 아버지를 먹었어. 그날 이후로 지금 이 순간을 위해 살았다.', 'Ssam nyeon jeon neohuideuri nae abeojireul meogeosseo. Geunal ihuRo iGEUM i sunGanEul wiHae saratda.', 'Three years ago you people destroyed my father. From that day I lived for this very moment.', 3),
  (l_id, '지수', '미켰다. 미켰다고... 좌속해.', 'MiChyeotda. MiChyeotdago... joesokhae.', 'You are insane. I am sorry that you are insane.', 4),
  (l_id, '준서', '지금 미칐 사람처럼 말하지 마. 미켰다면 좋았을 거야. 염마나 행복했을까.', 'Jigeum michyeon saramcheoreom malhaji ma. MiChyeotdamyeon JotEasseo. Yeolmana haengbokaesseo.', 'Do not speak now like a sane person. If I were crazy it would have been better. How much happier.', 5),
  (l_id, '준서', '(코에 대고 소리치며) 달려! 다 잘린 복수다. 시작해.', '(koe daego sorichyeoMYeo) dallyeo! Da jallin bOKSUda. Sijakae.', '(screaming into phone) Run! The revenge is all set. Start.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''복수하다'' means:', '["to forgive", "to take revenge", "to fight", "to betray"]', 1, '복수하다 = to take revenge.', 1),
  (l_id, '''음모'' means:', '["evidence", "conspiracy/scheme", "betrayal", "villain"]', 1, '음모 = conspiracy or scheme.', 2),
  (l_id, '''배신하다'' means:', '["to trust", "to betray", "to protect", "to expose"]', 1, '배신하다 = to betray.', 3),
  (l_id, 'Which phrase means ''do not underestimate me''?', '["나를 무시해", "나를 봐", "나를 섣불리 보지 마", "나를 이해해"]', 2, '나를 섛게 보지 마 = do not look down on me.', 4),
  (l_id, '''증거를 잡다'' means:', '["to hide evidence", "to destroy evidence", "to catch evidence", "to plant evidence"]', 2, '증거를 잡다 = to catch / obtain evidence.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '복수 드라마는 한국 드라마의 인기 장르 중 하나다. 주인공은 결정적인 순간을 위해 수년동안 인내하며 적을 관찰한다. 음모를 밝히고 엄청난 진실을 드러내는 순간, 시청자들은 카타르시스를 느난다. 복수는 단순한 원말에서 시작되지만 더 큰 사회적 정의를 향한 여정이 되기도 한다.', 'Revenge drama is one of the popular genres of Korean drama. The protagonist endures for years watching the enemy, waiting for the decisive moment. The moment the conspiracy is revealed and the enormous truth is exposed, viewers feel catharsis. Revenge begins from simple resentment but can also become a journey toward greater social justice.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 14;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '비밀', 'bimil', 'secret', 1),
  (l_id, '신분', 'sinbun', 'identity / status', 2),
  (l_id, '숨기다', 'sumgida', 'to hide', 3),
  (l_id, '가면', 'gamyeon', 'mask', 4),
  (l_id, '가짜', 'gaja', 'fake', 5),
  (l_id, '진짜', 'jinjja', 'real / genuine', 6),
  (l_id, '비밀을 지키다', 'bimireul jikida', 'to keep a secret', 7),
  (l_id, '신분을 숨기다', 'sinbuneul sumgida', 'to hide one''s identity', 8),
  (l_id, '플러스', 'peulleos', 'plus / upside', 9),
  (l_id, '로연초다', 'Roen-chuda', 'to reveal oneself', 10),
  (l_id, '신원 확인', 'sinhwan hwakIn', 'identity verification', 11),
  (l_id, '가명', 'gamyeong', 'alias / fake name', 12),
  (l_id, '지위', 'jiwe', 'status / rank / position', 13),
  (l_id, '분장', 'bunJang', 'disguise', 14),
  (l_id, '실체', 'siltche', 'true identity / reality', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '도대체 누구야 — who in the world are you', '[도대체] + [의문사]', '도대체 before question words adds intensity. Classic when a character''s true identity is revealed.', '[{"korean": "도대체 누구야, 너?", "english": "Who in the world are you?"}, {"korean": "도대체 올전히 둘 사람이 누구야?", "english": "Who exactly are you in the end?"}, {"korean": "네가 지금까지 엄청난 녕에 있었어.", "english": "You have been under enormous protection until now."}]', 1),
  (l_id, '렌지 알았어 — I knew it all along', '[난/너] + 렌지 알았어', '렌지 + 알다 means to know beforehand / sense. Used when someone finally reveals they suspected all along.', '[{"korean": "언제가는 렬지 알았어.", "english": "I always had a feeling."}, {"korean": "넘에게 수상한 점이 있었어.", "english": "There were suspicious things about you."}, {"korean": "네가 지수가 아니라는 것 는끼진 색깨.", "english": "I had an inkling that you are not Jisu."}]', 2),
  (l_id, '인 철하다 — to pretend to be someone', '[눌주어] + 인 철하다', '인 철하다 means to pretend to be (someone). The noun form 철 means pretending.', '[{"korean": "다른 사람인 철해.", "english": "Pretend to be a different person."}, {"korean": "모르는 철하지 마.", "english": "Do not pretend not to know."}, {"korean": "진짜 신분을 숨것8어.", "english": "I hid the real identity."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '지수', '(조용히) 주준서씨... 주준서씨의 진짜 이름은 이준서가 아니죠?', '(joyonGhi) Junseo-ssi... JunseO-ssi-ui jinjja ireumeun Lee Junseo-ga aNijyo?', '(quietly) Junseo... your real name is not Lee Junseo, is it?', 1),
  (l_id, '준서', '\(순간 멈춰 서며) ...', '(sungan meomcheo seoMYeo) ...', '(freezing for a moment) ...', 2),
  (l_id, '지수', '눔릴라서 높지 마. 입재 서류를 봉다 나서 쥜 것 가트두어.', 'Nollaraseone nopji ma. Ipjae seorureul beotda naseo Al geot gadeude.', 'Do not be surprised. I found out from the employment documents.', 3),
  (l_id, '준서', '(입술을 읚이며) ... 말해야 할 것이 많아.', '(ipseureul muriMyeo) ... malhaeyA hal geosi mana.', '(biting his lip) ... there is a lot I need to say.', 4),
  (l_id, '지수', '너면도 주준서를 맠고 있는 사람이구나.', 'Neomaen-do JunseO-reul mitGo inneun saramiguna.', 'I see you are also someone who trusts Junseo.', 5),
  (l_id, '준서', '(공식적으로) 정확하게 말할게. 저는 민진힙의 랜즈라 말하지다. 이 회사의 두 얼굴을 밝히러 온 거야.', '(gongsiJeogeuro) Jeongwakhage malhalge. Jeoneun MinJingeui ranDeuDA malhaJida. i hoesaui du eolgureul bakhiReo on geoya.', '(formally) Let me say it accurately. I am the heir of Minjin Group. I came to expose the two faces of this company.', 6),
  (l_id, '지수', '\(uc218를 내쉬면서) 복잡하네요... 나한테는 어떻게 하리기를 바란다요?', '(suneul naeSseumyeo) BokJapHaneyo... naHandeoneun eotteoke harireul baRanda-yo?', '(exhaling) This is complicated... what do you want me to do?', 7);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''비밀'' means:', '["identity", "secret", "mask", "truth"]', 1, '비밀 = secret.', 1),
  (l_id, 'Which phrase means ''to hide one''s identity''?', '["신분을 밝히다", "신분을 확인하다", "신분을 숨기다", "신분을 알리다"]', 2, '신분을 숨기다 = to hide one''s identity.', 2),
  (l_id, '''지위'' means:', '["secret", "disguise", "status / rank / position", "alias"]', 2, '지위 = status / position / rank.', 3),
  (l_id, '''실체'' means:', '["mask", "alias", "true identity", "secret"]', 2, '실체 = true identity / reality.', 4),
  (l_id, '''Who in the world are you?'' in Korean:', '["도대체 뭐야?", "도대체 누구야?", "도대체 어디야?", "도대체 왜야?"]', 1, '도대체 누구야? = Who in the world are you?', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '비밀 신분 트롬프는 한국 드라마에서 매우 인기 있는 요소다. 람댓릭형 주인공은 좌좼어지는 새로운 연인에게 진짜 신분을 숨기고 폙소연기를 한다. 진실이 밝혀지는 순간 드라마는 극적으로 향한다. 비밀은 단순한 장치 이상으로 주인공이 얼마나 상처받았는지를 보여주는 수단이 된다.', 'The hidden identity trope is a very popular element in Korean drama. A Cinderella-type protagonist hides their true identity from a new love interest and acts a double role. When the truth is revealed the drama heads to its climax. The secret becomes more than just a device, showing how much the protagonist has been hurt.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 15;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '재벌', 'jaebeol', 'chaebol (large conglomerate family)', 1),
  (l_id, '부자', 'buja', 'rich person / wealthy', 2),
  (l_id, '가난한', 'gananhan', 'poor / poverty', 3),
  (l_id, '통장', 'tongJang', 'bank account', 4),
  (l_id, '소호', 'soho', 'lavish / luxurious', 5),
  (l_id, '편견', 'pyeongyeon', 'prejudice / bias', 6),
  (l_id, '반대하다', 'bandaehada', 'to oppose', 7),
  (l_id, '계윸', 'gaEul', 'class / tier', 8),
  (l_id, '영재', 'yeongJae', 'prodigy / talent', 9),
  (l_id, '계닥도는 다르다', 'gyedan-E doNeun daREuda', 'class is different', 10),
  (l_id, '홀리데이', 'Hollyday', 'holiday (lavish)', 11),
  (l_id, '고급', 'goGeup', 'high-end / luxury', 12),
  (l_id, '신데렘라', 'sinderyella', 'Cinderella (K-drama slang)', 13),
  (l_id, '미신핸다', 'misinhada', 'to distrust / not believe in', 14),
  (l_id, '급여', 'geuByeo', 'sudden wealth', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '우리는 다르다 — we are different', '[두 주어] + 은/는 다르다', '다르다 means to be different. In class-gap dramas, characters say 우리는 다르다 to highlight the gap.', '[{"korean": "우리는 다는 세상 사람이야.", "english": "We live in different worlds."}, {"korean": "니켜 나쿤 동등한 없어.", "english": "There is no equality between you and me."}, {"korean": "계층이 다르다.", "english": "The class is different."}]', 1),
  (l_id, '돈이 엄마야 — money isn''t everything', '[돈/신분] + 이/가 + 전부가 아니야', 'The phrase 돈이 전부가 아니다 (money is not everything) is a common counter-argument in rich-poor dramas.', '[{"korean": "돈이 전부가 아니야.", "english": "Money is not everything."}, {"korean": "신분이 따라오는 걸 설마 한없삠.", "english": "There''s no use trying to follow status."}, {"korean": "진짜 사랐은 돈으로 싴 수 없어.", "english": "True love cannot be bought with money."}]', 2),
  (l_id, '재승지룠하다 — to be on a different level', '[주어] + 이/가 + 다르다', 'Expressing that someone''s lifestyle or world is beyond comprehension, typical in chaebol drama scenes.', '[{"korean": "사는 게 다르롌.", "english": "The way you live is on a completely different level."}, {"korean": "주린 것들이 다 자이네.", "english": "All your belongings are so different."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '어머니가 다시는 안 본다고 하셔요. 서로 다른 세상 사람이라고.', 'Eomeoniga dasineus an bonDago haseyeo. Seoro dareun sesang saramiRago.', 'My mother said she never wants to see you again. That you are people from different worlds.', 1),
  (l_id, '지수', '다른 세상이죠. 극지로 다른 세상이에요. 그래서 어마어마지 답자는 다른 건가요?', 'Dareun seSang-ijyo. GeukJiro dareun seSangiEyo. GeuraeSeo eomAeMAji dapJaneun dareun geonGayo?', 'Different worlds indeed. Extremely different worlds. So is the answer from you different too?', 2),
  (l_id, '준서', '나는... 너를 사랑해. 그건 돈으로 살 수 없어.', 'Naneun... neoreul saranghae. Gegeon doneuro sal su eobseo.', 'I... love you. That cannot be bought with money.', 3),
  (l_id, '지수', '(썼) 사랑하지만... 당신 어머니의 해찾음으로 내가 얼마나 더 개구맞이를 당해야 하는지 어스베요?', '(sseu) Saranghajimann... Dangsin eomeoNi-ui haechaEumeu-ro naega eolmana deo Gae-gadaerireul danghaya haneungJi aSebeyo?', '(bitter) I love you but... do you know how many more insults I would have to take because of your mother''s disapproval?', 4),
  (l_id, '준서', '말려... 말려다. 막아도 너무 막는다.', 'Mallyo... mallyeoda. Makado neomu maktneunda.', 'You''re right... you are right. You are too right.', 5),
  (l_id, '지수', '(낙담이리가 눈에 가득) 나스로도 유감이야. 사랑해서 더 상쳄받기 싫어.', '(nakdamisuri-ga nuneGaddeuk) Naseu-dO yugami-ya. SaranGhaeSeo deo sangcheo-batgi Sileo.', '(eyes full of resignation) I am the one who is sorry too. I do not want to be hurt even more because I love you.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''재벌'' means:', '["rich person", "chaebol conglomerate family", "luxury", "high class"]', 1, '재벌 = chaebol (large family-owned conglomerate).', 1),
  (l_id, '''편견'' means:', '["class", "luxury", "prejudice / bias", "wealth"]', 2, '편견 = prejudice or bias.', 2),
  (l_id, 'Which sentence means ''money is not everything''?', '["돈이 제일이야", "돈이 필요해", "돈이 전부가 아니야", "돈이 없어"]', 2, '돈이 전부가 아니야 = money is not everything.', 3),
  (l_id, '''신데렘라'' in K-drama slang refers to:', '["villain", "hero", "Cinderella story", "rich boy"]', 2, '신데렘라 = a Cinderella, someone who rises from poverty.', 4),
  (l_id, '''우리는 다른 세상 사람이야'' means:', '["We are the same", "We are different people", "We live in different worlds", "We cannot be together"]', 2, '다른 세상 사람 = people from different worlds.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '재벌과 빈부차 드라마는 한국에서 오래도록 사랑받아온 팔러다. 만약에도 불구하고 서로 다른 계층의 두 사람이 사랑에 빠져들다. 부모의 반대와 사회적 편견을 넘어 결국 사랑이 승리하는 이야기는 시청자들에게 대리 만족감을 준다. 결국 진정한 사랐은 계점을 넘는다는 메시지를 전한다.', 'The chaebol and rich-poor drama has been beloved in Korea for a long time. Despite all odds two people from different classes fall in love. Stories where love ultimately triumphs over parental opposition and social prejudice give viewers great vicarious satisfaction. They ultimately convey the message that true love transcends class.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 16;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '브로맨스', 'bromanseu', 'bromance', 1),
  (l_id, '효재', 'hyuJae', 'buddy / best male friend', 2),
  (l_id, '노령유님', 'noRyangYuNim', 'old friend (intimate)', 3),
  (l_id, '단짪한', 'danJinhan', 'firm / solid', 4),
  (l_id, '신뉴', 'sinYu', 'trust / confidence', 5),
  (l_id, '도와주다', 'dowa-juda', 'to help someone', 6),
  (l_id, '뎥보다', 'dok boda', 'to have one''s back', 7),
  (l_id, '진짜 친구', 'jinjja chingu', 'true friend', 8),
  (l_id, '좋은 덕에 있다', 'joeun deok-e issda', 'to be in good hands', 9),
  (l_id, '구해주다', 'guhaejuda', 'to rescue / to save', 10),
  (l_id, '철로운 법', 'cheolroun beop', 'rules of brotherhood', 11),
  (l_id, '진심', 'jinsim', 'sincerity / true heart', 12),
  (l_id, '형님', 'hyeong', 'older brother (used by male)', 13),
  (l_id, '동생', 'dongsaeng', 'younger sibling', 14),
  (l_id, '의리', 'uiri', 'loyalty / duty between friends', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '님 — respectful suffix for males', '[이름] + 님 (for equals/seniors)', '형님 (older brother) is used among male friends. 형님! in drama shows deep trust.', '[{"korean": "형님! 어디 갔어?", "english": "Brother! Where did you go?"}, {"korean": "형님 덕분에 살았어.", "english": "I survived because of you brother."}, {"korean": "형님 없으면 나 어떻게 해?", "english": "Without you brother how would I manage?"}]', 1),
  (l_id, '돀두을 한다 — to have someone''s back', '[누구에게] + 등을 맡겨다', '등을 맡겨다 means to entrust one''s back (to trust fully). A classic bromance expression.', '[{"korean": "네 등을 맡겨.", "english": "I trust you with my back."}, {"korean": "형님한테 등 맡겨도 돼.", "english": "I can trust my back to brother."}, {"korean": "놉버렬 등돌리게.", "english": "I will cover for you."}]', 2),
  (l_id, '의리가 있다 — having loyalty', '[주어] + 의리가 있다', '의리 means loyalty or duty. Having 의리 means being a person of honor in a friendship.', '[{"korean": "너는 의리가 있어.", "english": "You have loyalty."}, {"korean": "의리가 없는 덕에 땜당했어.", "english": "Got burned because of someone with no loyalty."}, {"korean": "있으로 의리을 지켜.", "english": "Keep loyalty with what you have."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '준서', '(깄집어 뒤돌아보면서) 나 다쓰네. 진짜로 고마운 녀석.', '(kkaeiJeo dwiDoraboMYeo) Na Daleu-ne. JinJJa-ro gomaUn nyeoseok.', '(turning with a grin) You are different. Genuinely grateful guy.', 1),
  (l_id, '지수', '형님. 있으면 나 진짜 될 수 있어? 진심으로.', 'HyeONG. Isseumyeon na jinjja doel su isseo? JinSimEuro.', 'Brother. If you are here can I really make it? Sincerely.', 2),
  (l_id, '준서', '미쳠이. 벌서 극적이다. 나 있으니까 넉말 하는 새렜 맙고.', 'Michineun. Beolsseo geukjeokida. Na isseuni-gga Nyeomal haneun saeREulE butJAbgo.', 'You are crazy. Already such drama. I am here so stop with the sad-bird talk.', 3),
  (l_id, '지수', '형님 덕분에 살았다고 해도 과언이 아니야.', 'HyeONG deokBun-e saraTdago haedo gwaenEoga aNiya.', 'It would not be an exaggeration to say I survived because of you brother.', 4),
  (l_id, '준서', '(등을 주멹으로 치면서) 이 녹의 등 연습 조금 더 하란 소리. 가자.', '(deungeul jumeonguro chiMYeo) I nyeog-ui deung yeonseup jom deo haran sori. Gaja.', '(punching the back) Sounds like this guy needs more back workout. Let us go.', 5);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''형님'' is used by males to mean:', '["younger brother", "older sister", "older brother", "best friend"]', 2, '형님 = older brother, used by males to address an older male friend or sibling.', 1),
  (l_id, '''의리'' means:', '["courage", "loyalty / duty", "kindness", "friendship"]', 1, '의리 = loyalty or duty between friends.', 2),
  (l_id, 'Which phrase means ''I trust you with my back''?', '["네 앞을 맡겨", "네 등을 맡겨", "네 마음을 맡겨", "네 미래를 맡겨"]', 1, '등을 맡겨 = entrust my back = I trust you fully.', 3),
  (l_id, '''지수한테 등 맡겨도 돼'' means:', '["I can trust Jisu", "Jisu can trust me", "I trust Jisu with my back", "Jisu trusts my back"]', 2, '지수한테 등 맡겨도 돼 = I can entrust my back to Jisu.', 4),
  (l_id, '''브로맨스'' describes:', '["romantic love", "rivalry", "male friendship", "family bond"]', 2, '브로맨스 = bromance, close male friendship.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '브로맨스는 한국 드라마에서 로맨스보다 오히려 큰 반향을 일으키기도 한다. 두 남성 주인공이 신뢰하고 도와주는 장면은 로맨스체럼 마음을 움직이게 연출된다. 진정한 우정은 말이 없어도 느끼는 것이다.', 'Bromance in Korean drama sometimes receives even greater response from viewers than romance. Scenes where two male protagonists trust each other and help are directed as beautifully as romance scenes. True friendship is felt even without words.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 17;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '응급실', 'eung-geubsil', 'emergency room', 1),
  (l_id, '수술', 'su-sul', 'surgery', 2),
  (l_id, '환자', 'hwan-ja', 'patient', 3),
  (l_id, '의사', 'ui-sa', 'doctor', 4),
  (l_id, '간호사', 'gan-ho-sa', 'nurse', 5),
  (l_id, '진단', 'jin-dan', 'diagnosis', 6),
  (l_id, '증상', 'jeung-sang', 'symptom', 7),
  (l_id, '치료', 'chi-ryo', 'treatment', 8),
  (l_id, '회복', 'hoe-bok', 'recovery', 9),
  (l_id, '수술실', 'su-sul-sil', 'operating room', 10),
  (l_id, '주사', 'ju-sa', 'injection / shot', 11),
  (l_id, '포기하다', 'po-gi-ha-da', 'to give up', 12),
  (l_id, '살리다', 'sal-li-da', 'to save (a life)', 13),
  (l_id, '출혜하다', 'chul-hyeo-ha-da', 'to bleed', 14),
  (l_id, '진통제', 'jin-tong-je', 'painkiller', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-아야/어야 하다', '-aya/-eoya hada', 'Must do; obligation structure.', '[{"korean": "수술해야 해요.", "english": "We must perform surgery."}, {"korean": "빨리 와야 해요.", "english": "You must come quickly."}]', 1),
  (l_id, '-다가', '-daga', 'While doing A, unexpectedly B happens.', '[{"korean": "수술하다가 문제가 생겼어요.", "english": "A problem arose while performing surgery."}, {"korean": "뉘다가 넘어졌어요.", "english": "While lying down, I fell over."}]', 2),
  (l_id, '-(으)로 인해', '-(eu)ro inhae', 'Due to; because of a cause or reason.', '[{"korean": "과로로 인해 센스가 맑았어요.", "english": "My senses became dull due to overwork."}, {"korean": "사고로 인해 입원했어요.", "english": "He was admitted due to the accident."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '의사', '(수술실에서) 지금 슬내주리가 단한 수 없어. 수술해야 해.', '(susulsil-eseo) Jigeum silnae-juri-ga danthan su eobseo. Susurhaeya hae.', '(in OR) The internal bleeding cannot be stopped now. We must operate.', 1),
  (l_id, '간호사', '환자 혁압이 떨어지고 있어요!', 'hwan-ja hyeob-ap-i tteolEojigo isseoyo!', 'The patient''''s blood pressure is dropping!', 2),
  (l_id, '의사', '포기하지 마. 살릴 수 있어. 나를 제증해.', 'Pogihaji ma. Sallil su isseo. Nareul mideo.', 'Don''''t give up. We can save this person. Trust me.', 3),
  (l_id, '레지던트', '금일 빢지 않을 거야. 세 시간 안에 다시 세우는 거야.', 'Geumil heulliji aneul geoya. Se si-gan an-e dasi sewuneun geoya.', 'Not one drop of blood today. We rebuild within three hours.', 4),
  (l_id, '간호사', '선생님. 가족들이 밖에 기다리고 있어요.', 'seonsaengnim. Gajok-deul-i bak-e gidaligo isseoyo.', 'Doctor. The family is waiting outside.', 5),
  (l_id, '의사', '알갤0. 성공하면 내가 직접 말할게.', 'Algeseo. Seonggong-hamyeon naega jikjeop malhal-ge.', 'Understood. If it succeeds I will tell them myself.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''환자'' means:', '["doctor", "nurse", "patient", "surgeon"]', 2, '환자 = patient.', 1),
  (l_id, 'Which means ''We must perform surgery''?', '["수술해도 돼요", "수술해야 해요", "수술하고 싶어요", "수술하면 돼요"]', 1, '-아야/어야 하다 = must do.', 2),
  (l_id, '''포기하다'' means:', '["to recover", "to diagnose", "to give up", "to treat"]', 2, '포기하다 = to give up.', 3),
  (l_id, 'What does ''-다가'' indicate?', '["reason", "obligation", "unexpected shift while doing something", "comparison"]', 2, '-다가 = while doing A, something happened unexpectedly.', 4),
  (l_id, '''살리다'' means:', '["to bleed", "to diagnose", "to save a life", "to operate"]', 2, '살리다 = to save / revive someone.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 드라마에서 병원 장면은 매우 드라마틱하게 연출된다. 의사는 환자를 살리기 위해 포기하지 않는다. 수술실의 긴장감은 시청자의 마음을 조여낸다. 회복을 기다리는 가족의 눈물이 감동을 전한다.', 'Hospital scenes in Korean dramas are directed very dramatically. Doctors never give up to save patients. The tension in the operating room captures the hearts of viewers. The tears of family members waiting for recovery convey deep emotion.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 18;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '맹사', 'baek-sa', 'lawyer', 1),
  (l_id, '판사', 'pan-sa', 'judge', 2),
  (l_id, '검사', 'geom-sa', 'prosecutor', 3),
  (l_id, '증거', 'jeung-geo', 'evidence', 4),
  (l_id, '법정', 'beop-jeong', 'courtroom', 5),
  (l_id, '판결', 'pan-gyeol', 'verdict', 6),
  (l_id, '피의자', 'pi-ui-ja', 'defendant', 7),
  (l_id, '원고', 'won-go', 'plaintiff', 8),
  (l_id, '변호', 'byeon-ho', 'defense', 9),
  (l_id, '검거', 'geom-geo', 'arrest', 10),
  (l_id, '무죄', 'mu-joe', 'innocent', 11),
  (l_id, '유죄', 'yu-joe', 'guilty', 12),
  (l_id, '공판', 'gong-pan', 'trial / hearing', 13),
  (l_id, '증인', 'jeung-in', 'witness', 14),
  (l_id, '재판', 'jae-pan', 'trial / judgment', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-을/를 시인하다', '-eul/reul si-in-hada', 'To admit / acknowledge something.', '[{"korean": "범행을 시인합니다.", "english": "I admit the crime."}, {"korean": "실수를 시인합니다.", "english": "I acknowledge the mistake."}]', 1),
  (l_id, '-는 한', '-neun han', 'As long as; so long as a condition holds.', '[{"korean": "증거가 없는 한 유죄가 아니다.", "english": "As long as there is no evidence, not guilty."}, {"korean": "노력하는 한 성공할 수 있다.", "english": "As long as you work hard you can succeed."}]', 2),
  (l_id, '-에 불과하고', '-e bulgwahago', 'Despite; in spite of.', '[{"korean": "증거에 불과하고 부인합니다.", "english": "Despite the evidence, he denies it."}, {"korean": "경고에 불과하고 계속했다.", "english": "Despite the warning, he continued."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '변호사', '(일어서) 판사님, 트리즈 없이 무죄를 주장합니다.', '(ireoseo) Pansanim, terijeu eopsi mujoe-reul jujang-hamnida.', '(standing) Your Honor, I assert innocence without condition.', 1),
  (l_id, '검사', '증거가 있습니다. 피의자는 현장에 있었습니다.', 'Jeunggeoga isseumnida. Piuija-neun hyeonjang-e isseosseumnida.', 'We have evidence. The defendant was at the scene.', 2),
  (l_id, '변호사', '그 증거는 위법으로 수집되었습니다. 향력이 없습니다.', 'Geu jeunggeoneun wibeop-euro sujip-doeeosseumnida. Hyangnyeogi eopseumnida.', 'That evidence was collected illegally. It has no effect.', 3),
  (l_id, '판사', '양쪽 의견을 듣겠습니다. 잠시 휴정합니다.', 'Yangcheuk uigyeon-eul deutgesseumnida. Jamsi hyujeong-hamnida.', 'I will hear both sides. Brief recess.', 4),
  (l_id, '수사', '(넓리게) 널 무단하게 놓아주지 않을 거야.', '(neorige) Neol mudanhage nohajuji aneul geoya.', '(to witness) I will not let you off easily.', 5),
  (l_id, '증인', '(뗨리며) 나는 아무것도 모떵니다.', '(tteolrimyeo) Naneun amugeos-do moreumnida.', '(trembling) I do not know anything.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''판결'' means:', '["evidence", "witness", "verdict", "trial"]', 2, '판결 = verdict.', 1),
  (l_id, 'Which word means innocent?', '["유죄", "무죄", "증거", "변호"]', 1, '무죄 = not guilty / innocent.', 2),
  (l_id, '''-는 한'' means:', '["despite", "while doing", "as long as", "because"]', 2, '-는 한 = as long as.', 3),
  (l_id, '''검사'' is:', '["judge", "defense lawyer", "prosecutor", "plaintiff"]', 2, '검사 = prosecutor.', 4),
  (l_id, 'Which means ''I admit the crime''?', '["범행을 시인합니다", "범행을 부인합니다", "범행을 주장합니다", "범행을 모릅니다"]', 0, '시인하다 = to admit/acknowledge.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 자살에서 법정 드라마는 매우 인기가 높다. 검사와 변호사의 대결이 긴장감을 환과 시크지 암시한다. 증거를 둘러싼 공방이 드라마의 핵심이다. 마지막 판결 장면에서 시청자들은 호흡을 죽인다.', 'Legal dramas set in courtrooms are very popular in Korea. Clashes between prosecutors and defense lawyers hint at tension from start to finish. The battle over evidence is the core of the drama. Viewers hold their breath during the final verdict scene.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 19;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '사극', '사-극', 'historical drama', 1),
  (l_id, '임금', 'im-geum', 'king', 2),
  (l_id, '신하', 'sin-ha', 'subject / retainer', 3),
  (l_id, '혹시라', 'hok-si-ra', 'Your Majesty (archaic)', 4),
  (l_id, '어명', 'eo-myeong', 'royal command', 5),
  (l_id, '간신', 'gan-sin', 'loyal retainer', 6),
  (l_id, '역적', 'yeok-jeok', 'traitor', 7),
  (l_id, '명에', 'myeong-e', 'in the name of', 8),
  (l_id, '충성', 'chung-seong', 'loyalty', 9),
  (l_id, '반역', 'ban-yeok', 'rebellion / treason', 10),
  (l_id, '옷남', 'ot-gam', 'prison', 11),
  (l_id, '쥐도', 'juk-do', 'execution', 12),
  (l_id, '미시', '미-시', 'unresolved / not yet done', 13),
  (l_id, '구하다', 'gu-ha-da', 'to rescue / save', 14),
  (l_id, '포펹', 'po-pung', 'storm (figurative: turmoil)', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-노니라', '-noniira', 'Archaic sentence ending expressing reason or declaration (sageuk style).', '[{"korean": "집보를 낮춰라 명하노니라.", "english": "I command thee to lower thy sword."}, {"korean": "다가오라 명하노니라.", "english": "I command thee to approach."}]', 1),
  (l_id, '-오라/아라 명하다', '-ora/ara myeong-hada', 'To command someone to do (royal command form).', '[{"korean": "일어나라 명하셨다.", "english": "He commanded: stand up."}, {"korean": "사도하라 명하셨다.", "english": "He ordered: execute him."}]', 2),
  (l_id, '-을/를 것을 명에', '-eul/reul geoseul myeonge', 'In the name of doing; under the order of.', '[{"korean": "하늘의 명에 맹세한다.", "english": "I swear in the name of heaven."}, {"korean": "임금의 명에 시행한다.", "english": "Execute in the name of the king."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '임금', '(노하여게) 너는 나를 속였는가. 반역을 도모한 것으로 알고 있다.', '(nohayeoge) Neoneun nareul sogyeosna. Banyeok-eul domohan geoseuro algo itda.', '(furiously) You deceived me. I know you plotted treason.', 1),
  (l_id, '신하', '(무릦을 꼽고) 세자여. 이 신하는 다만 졌하의 평안만을 바락았사옵니다.', '(mureupgul kkogo) Sejaya. I sinhaneun daman jeonha-ui pyeongan-maneul barattsa-opnida.', '(kneeling) Your Majesty. This retainer wished only for Your peace.', 2),
  (l_id, '임금', '충성과 반역은 한 미리나능하다.', 'Chungseong-gwa banyeok-eun han mirinaneunghada.', 'Loyalty and treason cannot coexist.', 3),
  (l_id, '신하', '제가 역적이 되더라도 폐하만하시면 죠죠 받겠습니다.', 'Jega yeokjeoegi doedeorado jeonha-man-hasimyeon jeujeuj batgesseumnida.', 'Even if I am branded a traitor, if it is Your will I accept it gladly.', 4),
  (l_id, '임금', '나가라. 다시는 보고 싶지 않다.', 'Nagara. Dasineun bogo sipji anta.', 'Leave. I do not wish to see you again.', 5),
  (l_id, '신하', '(눈물을 참으며) 성은이 무거운 것은 신하의 가슴 하나돌어라.', '(noonmureul chameumyeo) Seong-eun-i mugeo-un geos-eun sinha-ui gaseum hanadollera.', '(holding back tears) The weight of royal grace rests upon this retainer''''s single heart.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''충성'' means:', '["treason", "punishment", "loyalty", "power"]', 2, '충성 = loyalty.', 1),
  (l_id, '''역적'' means:', '["king", "loyal subject", "retainer", "traitor"]', 3, '역적 = traitor.', 2),
  (l_id, 'Which phrase is an archaic royal command form?', '["-아야 하다", "-노니라", "-다가", "-은/는 한"]', 1, '-노니라 is a classic sageuk command/declaration ending.', 3),
  (l_id, '''임금'' means:', '["noble", "minister", "king", "general"]', 2, '임금 = king (archaic/formal).', 4),
  (l_id, 'What does ''반역'' mean?', '["loyalty", "rebellion/treason", "execution", "exile"]', 1, '반역 = rebellion or treason.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '사극은 한국에서 수십 년간 사랑받는 장르이다. 업균과 신하 사이의 갈등이 주요 주제로 등장한다. 고어체로 연출되는 대사는 시청자들에게 특별한 진마감을 준다. 충성과 배신의 주제는 오늘날에도 시청자들의 마음을 움직인다.', 'Historical dramas (sageuk) are a genre loved in Korea for decades. Conflict between king and retainer appears as a central theme. Dialogue delivered in classical Korean gives viewers a special sense of authenticity. Themes of loyalty and betrayal still move the hearts of audiences today.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 20;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '이별', 'i-byeol', 'farewell / parting', 1),
  (l_id, '마지막', 'ma-ji-mak', 'last / final', 2),
  (l_id, '눈물', 'nun-mul', 'tears', 3),
  (l_id, '슬픈', 'seul-peum', 'sadness', 4),
  (l_id, '훙어지다', 'heunheo-ji-da', 'to sob / burst into tears', 5),
  (l_id, '꿃다', 'gudta', 'to be firm / resolved', 6),
  (l_id, '각인하다', 'ga-gin-ha-da', 'to engrave / etch in memory', 7),
  (l_id, '돌아오다', 'dor-a-o-da', 'to come back / return', 8),
  (l_id, '영원히', 'yeong-won-hi', 'forever', 9),
  (l_id, '후회', 'hu-hoe', 'regret', 10),
  (l_id, '봇잘다', 'but-jap-da', 'to hold on to / grab', 11),
  (l_id, '놓아주다', 'no-a-ju-da', 'to let go', 12),
  (l_id, '달려가다', 'dal-lyeo-ga-da', 'to run away', 13),
  (l_id, '배움없다', 'bae-um-eop-da', 'to learn nothing; to be lost', 14),
  (l_id, '걸음을 먹다', 'geo-reum-eul meok-da', 'to take a step', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-지 말았어야 했는데', '-ji malasseo-ya haessneunde', 'Should not have done (regret about a past action).', '[{"korean": "사랑하지 말았어야 했는데.", "english": "I should not have fallen in love."}, {"korean": "따라오지 말았어야 했는데.", "english": "I should not have followed."}]', 1),
  (l_id, '-고 싶지 않아', '-go sipji ana', 'Does not want to; reluctance.', '[{"korean": "보내고 싶지 않아.", "english": "I do not want to let you go."}, {"korean": "훙어지고 싶지 않아.", "english": "I do not want to cry."}]', 2),
  (l_id, '-는 만큼', '-neun mankeum', 'As much as; to the extent of.', '[{"korean": "내가 네를 사랑하는 만큼 기억해.", "english": "Remember as much as I love you."}, {"korean": "울었던 만큼 웃겠다.", "english": "I will smile as much as I cried."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '여자', '(골목에서 반쭘북으로) 가지 마. 되돌아와.', '(golmok-eseo banChombuk-euro) Gaji ma. Doedolawa.', '(grabbing sleeve in the alley) Don''''t go. Come back.', 1),
  (l_id, '남자', '나 가야 해. 너란 사람은 어떻슠 사람이야.', 'Na gaya hae. Neoran saram-eun eotteon saram-iya.', 'I have to go. You are this kind of person. (too good for me)', 2),
  (l_id, '여자', '이해 못 해. 나는 아직 너 필요해.', 'Ihae mot hae. Naneun ajik neo piryohae.', 'I don''''t understand. I still need you.', 3),
  (l_id, '남자', '(눈물을 닦으며) 미안해. 사랑한다는 말만 유일하게 말할 수 있는 건데.', '(nunmul-eul datgeumyeo) Mianhae. Saranghanda-neun mal-man yuil-hage malhal su inneunde.', '(wiping tears) I''''m sorry. The only word I can say honestly is that I love you.', 4),
  (l_id, '여자', '그리우면 돌아와. 언제든지. 기다릴게.', 'Geuriwoomyeon doraowa. Eonjdeunj. Gidarilge.', 'If you miss me, come back. Whenever. I will wait.', 5),
  (l_id, '남자', '(돌아서서) 행복하게 살아.', '(doraseo) Haengbokhage sara.', '(turning away) Live happily.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''이별'' means:', '["meeting", "love", "farewell", "regret"]', 2, '이별 = parting / farewell.', 1),
  (l_id, 'Which means ''I should not have fallen in love''?', '["사랑하면 안 돼", "사랑하지 말았어야 했는데", "사랑하고 싶지 않아", "사랑하는 만큼"]', 1, '-지 말았어야 했는데 = should not have done.', 2),
  (l_id, '''보내고 싶지 않아'' means:', '["I want to send you away", "I do not want to let you go", "I miss you", "I am waiting"]', 1, '-고 싶지 않아 = does not want to.', 3),
  (l_id, '''돌아오다'' means:', '["to run away", "to let go", "to return", "to sob"]', 2, '돌아오다 = to come back / return.', 4),
  (l_id, '''눈물'' means:', '["smile", "regret", "tears", "memory"]', 2, '눈물 = tears.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '이별 장면은 한국 드라마에서 가장 감동적인 순간 중 하나이다. 눈물과 침덕이 담힘 대사는 시청자의 가슴을 갈쪸다. 마지막 작별 인사는 종종 말 없이 등을 돌려 걸어갔는 모습으로 표현된다. 그 순간의 침묵이 메아리보다 더 크게 다가온다.', 'Farewell scenes are among the most emotional moments in Korean drama. Dialogue laden with tears and silence cuts through the hearts of viewers. The final goodbye is often expressed by turning and walking away without words. That silent moment hits harder than any melody.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 21;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '재회', 'jae-hoe', 'reunion', 1),
  (l_id, '스치다', 'seu-chi-da', 'to graze / brush past', 2),
  (l_id, '알아보다', 'al-a-bo-da', 'to recognize', 3),
  (l_id, '변하다', 'byeon-ha-da', 'to change', 4),
  (l_id, '그리움', 'geu-ri-um', 'longing / missing someone', 5),
  (l_id, '원망', 'won-mang', 'resentment / grudge', 6),
  (l_id, '잡아당기다', 'jab-a-dang-gi-da', 'to be caught / pulled back', 7),
  (l_id, '숨다', 'sum-da', 'to hide', 8),
  (l_id, '뒤돌아보다', 'dwi-dor-a-bo-da', 'to look back', 9),
  (l_id, '위로하다', 'wi-ro-ha-da', 'to comfort', 10),
  (l_id, '바라보다', 'ba-ra-bo-da', 'to gaze at / stare', 11),
  (l_id, '떨리다', 'tteol-li-da', 'to tremble / shake', 12),
  (l_id, '멈충다', 'meom-chu-da', 'to stop / freeze', 13),
  (l_id, '달려가다', 'dal-lyeo-ga-da', 'to rush toward', 14),
  (l_id, '안아주다', 'an-a-ju-da', 'to hug / embrace', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-다니', '-dani', 'Expressing disbelief or surprise at a fact.', '[{"korean": "네가 여기 있다니.", "english": "I can''''t believe you are here."}, {"korean": "이렇게 만나다니.", "english": "Imagine meeting like this."}]', 1),
  (l_id, '-자마자', '-jamaja', 'The moment / as soon as.', '[{"korean": "바라보자마자 눈물이 터졌다.", "english": "The moment I saw her, tears fell."}, {"korean": "안자마자 원망이 사라졌다.", "english": "The moment we embraced, the resentment melted."}]', 2),
  (l_id, '-어/아 뺄다', '-eo/a ppida', 'To be absorbed in / lost in.', '[{"korean": "그리움에 빠져 있었다.", "english": "I was lost in longing for you."}, {"korean": "생각에 빠져 있었다.", "english": "I was lost in thought."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '지원', '(빙못으로 세워) 민준...?', '(beombeos-euro sewo) Minjun...?', '(freezing in place) Minjun...?', 1),
  (l_id, '민준', '(천첰히 돌아서) 오래만이야. 하나도 넘지 않았네.', '(cheoncheonhi doraseo) Oraemani-ya. Hana-do neomji anassne.', '(slowly turning) It''''s been a long time. You haven''''t changed a bit.', 2),
  (l_id, '지원', '네가 여기 있다니. 너는 내 생각 안했어?', 'Nega yeogi issdani. Neoneun nae saenggak an haesseo?', 'I can''''t believe you are here. Didn''''t you ever think of me?', 3),
  (l_id, '민준', '한시도 암\ec9d 적 없어. 그리움이 너무 컴코 달아달아 도망쳥다.', 'Han-si-do ipjeok anon jeok eopseo. Geuriumhi neomhu keomko dararo doramchinda.', 'Not a moment. The longing got so large I had to run away to survive.', 4),
  (l_id, '지원', '(달려가며) 오바보.', '(dallyeogamyeo) Obabo.', '(running toward him) You fool.', 5),
  (l_id, '민준', '(안아주며) 미안해. 너무 오래 걸렸다.', '(anajumyeo) Mianhae. Neomu orae geollaessda.', '(embracing) I''''m sorry. It took too long.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''재회'' means:', '["farewell", "reunion", "longing", "regret"]', 1, '재회 = reunion.', 1),
  (l_id, '''알아보다'' means:', '["to hide", "to look back", "to recognize", "to comfort"]', 2, '알아보다 = to recognize someone.', 2),
  (l_id, 'Which means ''The moment I saw her, tears fell''?', '["바라보니 눈물이 터졌다", "바라보자마자 눈물이 터졌다", "바라보기 전에 눈물이 터졌다", "바라보고 나서 눈물이 터졌다"]', 1, '-자마자 = the moment / as soon as.', 3),
  (l_id, '''떨리다'' means:', '["to freeze", "to run", "to tremble", "to sob"]', 2, '떨리다 = to tremble or shake.', 4),
  (l_id, 'What does ''-다니'' express?', '["obligation", "surprise/disbelief", "reason", "desire"]', 1, '-다니 expresses surprise or disbelief at a situation.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '재회 장면은 한국 드라마에서 소위 클리쌔의 순간이다. 오랜 시간이 흐른 뒤 두 사람이 다시 만나는 순간의 침묵이 시청자의 숨을 멈충게 한다. 그리움과 원망이 동시에 티는 표정은 배우의 연기력에 달려 있다. 재회의 대사는 짧지만 여운이 기나도 맘에 남는다.', 'Reunion scenes are the so-called climax moments of Korean drama. The silence of two people meeting again after a long time stops viewers from breathing. The expression that mixes longing and resentment depends entirely on the actor''''s skill. Reunion lines are short, but they linger in the heart long after.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 22;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '시간 여행', 'si-gan yeo-haeng', 'time travel', 1),
  (l_id, '과거', 'gwa-geo', 'the past', 2),
  (l_id, '미래', 'mi-rae', 'the future', 3),
  (l_id, '현재', 'hyeon-jae', 'the present', 4),
  (l_id, '역사', 'yeok-sa', 'history', 5),
  (l_id, '항로', 'hang-ro', 'route / path', 6),
  (l_id, '월드홈라인', 'wol-deu-hol-la-in', 'worldline (alternate timeline)', 7),
  (l_id, '바꿀다', 'ba-gul-da', 'to change / alter', 8),
  (l_id, '나타나다', 'na-ta-na-da', 'to appear / emerge', 9),
  (l_id, '사라지다', 'sa-ra-ji-da', 'to disappear', 10),
  (l_id, '비밀', 'bi-mil', 'secret', 11),
  (l_id, '운명', 'un-myeong', 'fate / destiny', 12),
  (l_id, '모순', 'mo-sun', 'contradiction / paradox', 13),
  (l_id, '돌아가다', 'dor-a-ga-da', 'to go back / return', 14),
  (l_id, '막다른', 'mak-da-reun', 'different / unrelated', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-았/었더라면', '-ass/eoss-deoramyeon', 'If only (a past condition) had been true.', '[{"korean": "일직 왼다면 말했더라면.", "english": "If only I had told you sooner."}, {"korean": "그때 마나지 않았더라면.", "english": "If only we had not met then."}]', 1),
  (l_id, '-다면 어떨까', '-damyeon eottleolkka', 'What if (a hypothetical were true)?', '[{"korean": "네가 월드홈라인을 바꾼 수 있다면 어떨까?", "english": "What if you could change the worldline?"}, {"korean": "과거로 돌아갈 수 있다면 어떨까?", "english": "What if you could return to the past?"}]', 2),
  (l_id, '-는 한 어떨 수 없다', '-neun han eotteol su eopda', 'Cannot be helped as long as; inevitable.', '[{"korean": "역사는 바뀌는 한 어떨 수 없다.", "english": "As long as history does not change, nothing can be done."}, {"korean": "운명이 정해진 한 어떨 수 없다.", "english": "As long as fate is set, it cannot be helped."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수호', '(막에 붙잡으며) 네가 누구인지 알아. 미래에서 온 거지?', '(mak-e butjab-eumyeo) Nega nuguin-ji ara. Mirae-eseo on geoji?', '(grabbing arm) I know who you are. You came from the future, right?', 1),
  (l_id, '여주', '(놀라며) 어떻게... 아직 아무에게도 말하지 않았는데.', '(nollramyeo) Eotteoke... Ajik amugeo-do malha-ji anhaenneunde.', '(shocked) How... I haven''''t told anyone yet.', 2),
  (l_id, '수호', '여기 있으면 안 돼. 역사가 바뀌면 너는 사라진다.', 'Yeogi isseumyeon an dwae. Yeoksa-ga baggwimyeon neoneun sarajinda.', 'You cannot stay here. If history changes, you will disappear.', 3),
  (l_id, '여주', '그래도 상관없어. 너를 지키기 위해 연 거니까.', 'Geurae-do sangwan-eopseo. Neoreul jikigi wihae on geonikka.', 'It doesn''''t matter. I came to protect you.', 4),
  (l_id, '수호', '미치저야. 네 생이 쒸모없어지는데.', 'Michijeo-ya. Ne saeng-i sseumoeopseojineunde.', 'You''''re insane. Your own existence will be erased.', 5),
  (l_id, '여주', '너 없는 미래는 의미가 없어.', 'Neo eomneun mirae-neun uimi-ga eopseo.', 'A future without you has no meaning.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''과거'' means:', '["the future", "the present", "the past", "time travel"]', 2, '과거 = the past.', 1),
  (l_id, '''사라지다'' means:', '["to appear", "to return", "to change", "to disappear"]', 3, '사라지다 = to disappear.', 2),
  (l_id, 'Which expresses ''if only X had been the case (past regret)''?', '["-다면 어떨까", "-았더라면", "-는 한", "-자마자"]', 1, '-았/었더라면 = past counterfactual / if only.', 3),
  (l_id, '''미래'' means:', '["the past", "fate", "the future", "destiny"]', 2, '미래 = the future.', 4),
  (l_id, '''운명'' means:', '["history", "paradox", "secret", "fate"]', 3, '운명 = fate / destiny.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '시간 여행 드라마는 과거와 미래를 오가는 캐릭터의 선택을 다뢬다. 역사를 바꾼다는 자체가 영원한 모순을 만든다. 시청자들은 어떤 선택이 올바른지 함께 고민하게 된다. 운명과 의지 사이의 갈등은 장르의 핵심 재미이다.', 'Time travel dramas deal with the choices of characters who cross between past and future. Altering history itself creates an eternal paradox. Viewers find themselves pondering which choice is right alongside the protagonist. The conflict between fate and free will is the central appeal of the genre.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 23;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '삼각관계', 'sam-gak-gwan-gye', 'love triangle', 1),
  (l_id, '질투', 'jil-tu', 'jealousy', 2),
  (l_id, '경쟁자', 'gyeong-jaeng-ja', 'rival', 3),
  (l_id, '고백', 'go-baek', 'confession of love', 4),
  (l_id, '거절', 'geo-jeol', 'rejection', 5),
  (l_id, '한싛', 'han-sum', 'sigh', 6),
  (l_id, '선택', 'seon-taek', 'choice', 7),
  (l_id, '마음이 수다', 'ma-eum-i su-da', 'to have feelings', 8),
  (l_id, '포기하다', 'po-gi-ha-da', 'to give up', 9),
  (l_id, '지켜보다', 'ji-kyeo-bo-da', 'to watch over / protect', 10),
  (l_id, '인정하다', 'in-jeong-ha-da', 'to admit / acknowledge', 11),
  (l_id, '핵복스럽다', 'haengbok-seu-reop-da', 'to be happy', 12),
  (l_id, '운명으로 엄히', 'un-myeong-eu-ro eom-hi', 'bound by fate', 13),
  (l_id, '눈을 돌리다', 'nun-eul dol-li-da', 'to look away / avert eyes', 14),
  (l_id, '옵으다', 'op-da', 'to carry on one''''s back', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-건지 알 수 없다', '-geonji al su eopda', 'Cannot know whether; expresses uncertainty.', '[{"korean": "누구를 사랑하는지 알 수 없어.", "english": "I cannot tell who I love."}, {"korean": "어떻게 될건지 알 수 없다.", "english": "I cannot know how it will turn out."}]', 1),
  (l_id, '-어/아도 괴됨은', '-eodo gwaenchan-eun', 'It is fine even if; permissive.', '[{"korean": "포기해도 괴달아. 너라면.", "english": "It is fine even if I give up. For you."}, {"korean": "한발 마납이도 괴달아.", "english": "Even losing once is fine."}]', 2),
  (l_id, '-다고 해도', '-dago haedo', 'Even saying / even if said.', '[{"korean": "사랑하다고 해도 신천지.", "english": "Even saying I love you, I don''''t know if it''''s real."}, {"korean": "거율다고 해도 나는 기다릴 거야.", "english": "Even if you reject me, I will wait."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '여자', '(두 사람 사이에서) 오빠 말이 맣어. 우리 사이는 구말 아닙니까.', '(du saram sai-eseo) Oppa mali maleo. Uri saine-neun gumel animnikka.', '(standing between them) I trust what you say. Isn''''t there something between us?', 1),
  (l_id, '첫 번째 남자', '나는 네가 누구를 선택하든 관당 없어. 실득하면 돼.', 'Naneun niga nugureul seontaek-hadeun gwangdang eopsseo. Sildeut-hamyeon dwe.', 'I don''''t care who you choose. Just be happy.', 2),
  (l_id, '두 번째 남자', '(지켜보면서) 우리 등 뎒지 말아라. 그 역할은 내가 한다.', '(jikyeobomyeo) Uri deung nojo malara. Geu yeokhal-eun naega handa.', '(standing guard) Don''''t turn your backs on us. I will take that role.', 3),
  (l_id, '여자', '두 사람 몰라서 울고 싶어.', 'Du saram mollase ulgo sipeo.', 'I want to cry where neither of you can see.', 4),
  (l_id, '첫 번째 남자', '(조용히) 나는 포기할게. 우리 둘 다 행복해줘.', '(joyonghi) Naneun pogihallge. Uri dul da haengbok-haejwo.', '(quietly) I will give up. Please be happy, both of you.', 5);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''질투'' means:', '["confession", "rival", "jealousy", "choice"]', 2, '질투 = jealousy.', 1),
  (l_id, '''고백'' means:', '["rejection", "choice", "love confession", "rival"]', 2, '고백 = confession of love.', 2),
  (l_id, 'Which means ''I cannot know who I love''?', '["누구를 사랑하는지 모르겠어", "누구를 사랑하는지 알 수 없어", "누구를 사랑하는지 포기해", "누구를 사랑하는지 말해"]', 1, '-건지 알 수 없다 = cannot know whether.', 3),
  (l_id, '''거절'' means:', '["choice", "jealousy", "confession", "rejection"]', 3, '거절 = rejection.', 4),
  (l_id, 'What does ''-다고 해도'' mean?', '["because of saying", "even if said / even saying", "while saying", "after saying"]', 1, '-다고 해도 = even saying / even if said.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '삼각관계는 로맨스 드라마의 고전적인 장치다. 두 남성 안에서 한 여성이 고민하는 장면은 시청자들이 한 편을 편들게 만든다. 질투와 이타심의 경계는 종종 애매하게 더더진다. 어느 쪽이 적이고 어느 쪽이 옵은지 판단하는 것도 재미의 일부다.', 'The love triangle is a classic device in romance dramas. Scenes where a woman agonizes between two men make viewers take sides. The boundary between jealousy and selflessness often blurs. Deciding who is wrong and who is right is itself part of the fun.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 24;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '계약 결혼', 'gye-yak gyeol-hon', 'contract marriage', 1),
  (l_id, '조건', 'jo-geon', 'condition / clause', 2),
  (l_id, '위반', 'wi-ban', 'violation / breach', 3),
  (l_id, '패널티', 'pae-neol-ti', 'penalty', 4),
  (l_id, '진심', 'jin-sim', 'sincerity / true heart', 5),
  (l_id, '가장', 'ga-jang', 'act / pretense', 6),
  (l_id, '공개', 'gong-gae', 'public / reveal', 7),
  (l_id, '비밀 유지', 'bi-mil yu-ji', 'maintaining a secret', 8),
  (l_id, '선을 넘다', 'seon-eul neom-da', 'to cross a line', 9),
  (l_id, '고븏하다', 'go-beg-ha-da', 'to confess', 10),
  (l_id, '계약 해제', 'gye-yak hae-je', 'contract termination', 11),
  (l_id, '충동', 'chung-dong', 'impulse', 12),
  (l_id, '내슬다', 'nae-sil-da', 'to be sincere / genuine', 13),
  (l_id, '딕붙다', 'deok-buk-da', 'to be indebted to / grateful', 14),
  (l_id, '인정', 'in-jeong', 'acknowledgment', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-기로 하다', '-giro hada', 'To decide to; to commit to doing.', '[{"korean": "계약을 하기로 했어.", "english": "I decided to enter the contract."}, {"korean": "인정하기로 했다.", "english": "I decided to acknowledge it."}]', 1),
  (l_id, '-체하다', '-che-hada', 'To pretend / act as if.', '[{"korean": "행복한 체하고 있어.", "english": "I am pretending to be happy."}, {"korean": "모르는 체하지 마.", "english": "Don''''t pretend you don''''t know."}]', 2),
  (l_id, '-다보다', '-daboda', 'More than expected; comparative.', '[{"korean": "너를 케어하는 마음이 생각보다 컵다.", "english": "My caring feelings for you are deeper than I thought."}, {"korean": "상황이 기대보다 복잡하다.", "english": "The situation is more complex than expected."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '여자', '(계약서를 내밀면서) 3개월 동안 부인 연기하는 거야. 코인 거야.', '(gyeyakseo-reul naemilmyeo) 3 kaewol dong-an buin yeongi-haneun geoya. Koin geoya.', '(sliding contract) You act as my wife for 3 months. That''''s the deal.', 1),
  (l_id, '남자', '조건 없어. 선을 넘으면 안 돼. 서로에게 감정은 금지.', 'Jogon eopseo. Seon-eul neom-eumyeon an dwe. Seo-ro-ege gamjeong-eun geumji.', 'No conditions. You cannot cross the line. Feelings between us are forbidden.', 2),
  (l_id, '여자', '(웃으며) 감정이요? 당신가럌 그런 일 없을 것 같아요.', '(usseumyeo) Gamjeong-iyo? Dangsin-gareun geureon il eop-eul geot gat-ayo.', '(laughing) Feelings? Someone like you won''''t have that problem.', 3),
  (l_id, '남자', '(얼릴랑 포해) 매니얼을 뒤집는듯 에구하지 마요.', '(eolleolang pohae) Maeenyu-eol dwijipdeut eguha-ji maeyo.', '(pouting) Don''''t flip through my rulebook like a menu.', 4),
  (l_id, '여자', '(나중에, 조용히) 선을 넘어버렸나 봐. 너한테 진심으로 감정이 생깔는데.', '(najung-e, joyonghi) Seon-eul neomeobeolyeonna bwa. Neohante jinsibeuro gamjeong-i saeginda.', '(later, quietly) Seems I crossed the line. I am developing real feelings for you.', 5),
  (l_id, '남자', '(못 듣는 철 하면서) 나도.', '(mot deudneun cheok hamyeo) Nado.', '(pretending not to hear) Me too.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''계약 결혼'' means:', '["blind date", "arranged marriage", "contract marriage", "wedding ceremony"]', 2, '계약 결혼 = contract marriage.', 1),
  (l_id, '''가장'' means:', '["sincerity", "penalty", "pretense/acting", "condition"]', 2, '가장 = pretense / act.', 2),
  (l_id, 'Which means ''I decided to enter the contract''?', '["계약을 하고 싶어", "계약을 하기로 했어", "계약을 하면 안 돼", "계약을 하는 철하자"]', 1, '-기로 하다 = to decide to do.', 3),
  (l_id, '''모르는 체하지 마'' means:', '["Don''''t pretend you don''''t know", "Don''''t know anything", "Do not pretend to know", "Do not look"]', 0, '-체하다 = to pretend.', 4),
  (l_id, '''조건'' means:', '["sincerity", "contract", "condition/clause", "reward"]', 2, '조건 = condition or clause.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '계약 결혼 드라마는 이해관계로 시작된 결혼이 진심으로 바뀌는 과정을 그린다. 가장으로 시작된 눈맞춥이 장면이 시청자들을 감동시킨다. 조건을 지키려는 노력과 천전히 툰려오는 감정이 진정한 재미를 만든다. 사랑은 언제나 계약을 녕어다.', 'Contract marriage dramas depict the process of a marriage started out of mutual interest turning into real love. The scene where eye contact begun as pretense becomes heartfelt moves viewers. The struggle to keep to the conditions while feelings quietly take over creates genuine fun. Love always outlasts the contract.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 25;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '학교', 'hak-gyo', 'school', 1),
  (l_id, '반 친구', 'ban chin-gu', 'classmate', 2),
  (l_id, '남자 친구', 'nam-ja-chin-gu', 'boyfriend', 3),
  (l_id, '얬자 친구', 'yeo-ja-chin-gu', 'girlfriend', 4),
  (l_id, '짝사랑', 'jjak-sa-rang', 'one-sided love / crush', 5),
  (l_id, '가바운', 'ga-ba-un', 'light / casual', 6),
  (l_id, '설레다', 'seol-le-da', 'to flutter / be excited (heart)', 7),
  (l_id, '고백', 'go-baek', 'confession', 8),
  (l_id, '용기', 'yong-gi', 'courage', 9),
  (l_id, '수업', 'su-eop', 'class / lesson', 10),
  (l_id, '열람하다', 'yeol-lam-ha-da', 'to be passionate about / devoted to', 11),
  (l_id, '성적', 'seong-jeok', 'grades / academic results', 12),
  (l_id, '친하다', 'chin-hada', 'to be close / intimate', 13),
  (l_id, '모둥모둥하다', 'mo-deung-mo-deung-ha-da', 'to be round/chubby (cute descriptor)', 14),
  (l_id, '두근거리다', 'du-geun-geo-ri-da', 'to have a pounding heart', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-자고 싶다', '-jago sipda', 'To want to do; desire expressed with want.', '[{"korean": "고백하자고 싶어.", "english": "I want to confess."}, {"korean": "같이 있자고 싶어.", "english": "I want to be together."}]', 1),
  (l_id, '-을/를 수만 있다면', '-eul su-man issdamyeon', 'If only I could; wishing for capability.', '[{"korean": "용기를 들 수만 있다면.", "english": "If only I could summon more courage."}, {"korean": "네 옆에 있을 수만 있다면.", "english": "If only I could be by your side."}]', 2),
  (l_id, '-아/어 보이다', '-a/eo boida', 'To appear to be; seems like.', '[{"korean": "네가 나를 좋아하는 것 같아 보여.", "english": "It seems like you like me."}, {"korean": "조금 눈치 보이는 것 같아.", "english": "Seems like you noticed a little."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '남학생', '(외우다가 형구리 전달하면서) 네 먹어. 신경 쓰지 마.', '(euisida ga hyeonguri jeondalhament) Ne meogeo. Singyeong sseuji ma.', '(handing lunch to desk) Here, eat. Don''''t overthink it.', 1),
  (l_id, '여학생', '(두근거리며) 아... 고마워.', '(dugeun-georimyeo) A... Gomawo.', '(heart pounding) Ah... Thanks.', 2),
  (l_id, '남학생', '(수업 중에 쉐적으로) 치커카데... 누구 맞형?', '(sueop junge swoejeok-euro) Chi-keoke-dae... Nugu maekhyeo?', '(notes during class) Cute... Who is she dating?', 3),
  (l_id, '여학생', '(쉐적으로 답장을 넘기면서) 누구도. 증명.', '(swoejeok-euro dabjang-eul neomgimyeo) Nugudo. Jeungmyeong.', '(passing note) Nobody. Proof.', 4),
  (l_id, '남학생', '(하교 후 옵옥요에서) 있짤렵 하나 부탁할게. 제 여자친구 돼주시겠어요?', '(hagyo hu oktap-yo-eseo) Itjallaek hana butakhal-ge. Je yeojachin-gu dwejusigesseoyo?', '(on rooftop after school) One request. Would you be my girlfriend?', 5),
  (l_id, '여학생', '(설레며) ... 생각해끼.', '(seollemyeo) ... Saeng-gakhae-bwullge.', '(heart fluttering) ... I''''ll think about it.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''짜사랑'' means:', '["couple''''s love", "two-sided love", "one-sided crush", "school love"]', 2, '짜사랑 = one-sided love / crush.', 1),
  (l_id, '''두근거리다'' describes:', '["feeling nervous in class", "having a pounding heart", "being studious", "walking quickly"]', 1, '두근거리다 = heart pounding / fluttering.', 2),
  (l_id, 'Which means ''I want to confess''?', '["고백해도 돼", "고백하자고 싶어", "고백한 적 없어", "고백하는 하면"]', 1, '-자고 싶다 = to want to do.', 3),
  (l_id, '''열람하다'' means:', '["to be shy", "to study", "to be passionate about", "to be popular"]', 2, '열람하다 = to be devoted/passionate.', 4),
  (l_id, '''설레다'' describes:', '["feeling scared", "heart fluttering with excitement", "being embarrassed", "being confused"]', 1, '설레다 = to flutter with excitement.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '학교 로맨스 드라마는 청소년의 실제 감정을 담아 음다. 수업 시간에 써내는 츠준쟼, 옥상에서의 고백, 동아리 쉽은 실레가 시청자들의 추억을 간지맹힌다. 청국의 설레는 어느 나라든 보편적이라서 시청자들이 공감하기 쉽다. 잟은 사랑의 시작은 널 팁림한다.', 'School romance dramas capture the real emotions of youth. Notes passed during class, confessions on the rooftop, and innocent mistakes tickle the memories of viewers. The flutter of first love is universal regardless of nationality, making it easy for viewers to empathize. The beginning of young love always feels fresh.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 26;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '직장', 'jik-jang', 'workplace', 1),
  (l_id, '상사', 'sang-sa', 'boss / superior', 2),
  (l_id, '부하', 'bu-ha', 'subordinate', 3),
  (l_id, '동료', 'dong-nyo', 'colleague', 4),
  (l_id, '회의', 'hoe-ui', 'meeting', 5),
  (l_id, '야근', 'ya-geun', 'overtime work', 6),
  (l_id, '승진', 'seung-jin', 'promotion', 7),
  (l_id, '이직', 'i-jik', 'job transfer / resignation', 8),
  (l_id, '그만두다', 'geu-man-du-da', 'to stop / quit', 9),
  (l_id, '근무', 'geun-mu', 'work / service', 10),
  (l_id, '고충', 'go-chung', 'harassment', 11),
  (l_id, '공적과 사적', 'gong-jeok-gwa sa-jeok', 'work and personal life', 12),
  (l_id, '전문성', 'jeon-mun-seong', 'professionalism', 13),
  (l_id, '어색하다', 'eo-saek-ha-da', 'to be awkward', 14),
  (l_id, '도안이 되다', 'do-an-i doe-da', 'to be a turning point / breakthrough', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-어/아도 되다', '-eo/a do doeda', 'It is acceptable to; may do.', '[{"korean": "퇴근후에 만나도 돼요.", "english": "We may meet after work."}, {"korean": "존말해도 돼.", "english": "It is okay to speak honestly."}]', 1),
  (l_id, '-고 있다', '-go itda', 'Progressive / ongoing action.', '[{"korean": "지금 회의 준비하고 있다.", "english": "I am preparing for the meeting now."}, {"korean": "넉 생각하고 있었다.", "english": "I have been thinking about you."}]', 2),
  (l_id, '-는 척하다', '-neun cheok-hada', 'To pretend to be doing.', '[{"korean": "일하는 철하고 놓친 어떠.", "english": "How about pretending to be working?"}, {"korean": "모르는 철하지 마.", "english": "Don''''t pretend you don''''t know."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '상사', '(엘리베이터에서) 오늘 보고서 제출했어?', '(elribeiteoseo) Oneul bogoseo jeChul haesseo?', '(in elevator) Did you submit today''''s report?', 1),
  (l_id, '부하', '(있는 체하면서) 네, 주바이지요.', '(inneun chehamo) Ne, juba-i-jiyo.', '(pretending nonchalance) Yes, of course.', 2),
  (l_id, '상사', '(자리를 살피면서 조용히) 오늘 저녁 못 나와?', '(jari-reul salpimyeo joyonghi) Oneul jeonyeok mot nawa?', '(glancing around quietly) Can you not make it out tonight?', 3),
  (l_id, '부하', '(놀라면서) 저... 야근이 있어서요.', '(nolramyeo) Jeo... Yageun-i isseoseoyo.', '(startled) I... have overtime.', 4),
  (l_id, '상사', '그럼 야근 끝나고. 공적과 사적을 구분하는 게 실은 나도 어려워.', 'Geuram yageun kkeutnago. Gongjeok-gwa sajeok-eul gubun-haneun ge sireun na-do eoryeowo.', 'Then after overtime. Honestly even I find separating work and personal hard.', 5),
  (l_id, '부하', '(애써 너머 는기면서) 실장님. 같은 회사 사람입니다.', '(aesseo neomeo neugiMyeo) Siljangneem. Gat-eun hoesa saram-imnida.', '(trying not to show reaction) Manager. We are in the same company.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''상사'' means:', '["colleague", "subordinate", "boss/superior", "client"]', 2, '상사 = boss or superior.', 1),
  (l_id, '''야근'' means:', '["promotion", "overtime", "resignation", "meeting"]', 1, '야근 = overtime work.', 2),
  (l_id, 'Which means ''I am preparing for the meeting now''?', '["회의를 준비했어", "회의를 준비하고 싶어", "회의를 준비하고 있어", "회의를 준비하면 돼"]', 2, '-고 있다 = progressive ongoing action.', 3),
  (l_id, '''부하'' means:', '["overtime", "promotion", "subordinate", "colleague"]', 2, '부하 = subordinate.', 4),
  (l_id, 'What does ''-는 철하다'' mean?', '["to actually do", "to pretend to be doing", "to want to do", "to finish doing"]', 1, '-는 철하다 = to pretend to be doing.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '직장 로맨스 드라마는 공적과 사적의 경계를 다뢨으로써 긴장감을 조성한다. 상사와 부하 사이의 사랑은 어색함과 설렁임이 동시에 존재한다. 직장 내 놈먹이와 남면 보지 않으려는 노력이 코믹한 상황을 만든다. 직장 로맨스의 진수는 두 사람 모두에게 늘 리스크를 수반한다.', 'Office romance dramas create tension by navigating the boundary between professional and personal life. Love between a boss and subordinate exists with awkwardness and excitement at the same time. Workplace politics and the effort not to be seen create comic situations. An office romance always carries risk for both parties.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 27;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '악당', 'ak-dang', 'villain', 1),
  (l_id, '독백', 'dok-baek', 'monologue', 2),
  (l_id, '음모', 'eum-mo', 'conspiracy / plot', 3),
  (l_id, '복수', 'bok-su', 'revenge', 4),
  (l_id, '야망', 'ya-mang', 'ambition', 5),
  (l_id, '지배', 'ji-bae', 'domination / control', 6),
  (l_id, '머리를 쓰다', 'meo-ri-reul ssu-da', 'to use one''''s head', 7),
  (l_id, '낙다', 'nak-da', 'to fall / be defeated', 8),
  (l_id, '항복', 'hang-bok', 'surrender', 9),
  (l_id, '주도권', 'ju-do-gwon', 'initiative / control', 10),
  (l_id, '난화', 'nan-hwa', 'chaos', 11),
  (l_id, '바수', 'ba-su', 'puppet', 12),
  (l_id, '리드', 'li-deu', 'lead / ahead', 13),
  (l_id, '웃음을 터뜨다', 'ut-eum-eul teo-tteu-ri-da', 'to burst out laughing', 14),
  (l_id, '사라지다', 'sa-ra-ji-da', 'to vanish / disappear', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-는 법이다', '-neun beop-ida', 'That is how things work; a general truth.', '[{"korean": "낙엠자는 낙는 법이야.", "english": "The fallen are meant to fall."}, {"korean": "나약한 자는 지배당하는 법이다.", "english": "The weak are destined to be controlled."}]', 1),
  (l_id, '-을/를 줄 알았나?', '-eul jul al-ass-na?', 'Did you think I would?; expressing contempt for an opponent''''s assumption.', '[{"korean": "내가 즠 줄 알았나?", "english": "Did you think I would just back down?"}, {"korean": "네가 이길 줄 알았나?", "english": "Did you think you would win?"}]', 2),
  (l_id, '-어뱄야', '-eobwaya', 'Even trying (something undesirable) is pointless / too late.', '[{"korean": "이제 저항해뵐야 땡대야.", "english": "Resisting now is futile."}, {"korean": "울어봀야 소용없어.", "english": "There is no use crying."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '악당', '(천체히 웃으며) 드디어 여기까지 왔군. 오래 걸렸어.', '(cheoncheonhi useumyeo) Deudie yeogi-kkaji wassgun. Orae geollaesseo.', '(smiling slowly) You finally came this far. It took long enough.', 1),
  (l_id, '주인공', '(이를 암뉔리면서) 너의 음모는 여기서 끝난다.', '(ireul akmurimyeo) Neoui eum-mo-neun yeogi-seo kkeutnanda.', '(clenching teeth) Your conspiracy ends here.', 2),
  (l_id, '악당', '끝난다고? (웃음을 터뜨며) 이게 시작이야. 너야말로 내 계획의 일부였어.', 'Kkeutnandago? (useumEul teotteumyeo) Ige sijakiya. NeoYa-mallo nae gyehoek-eui ilbuosseo.', 'Ends? (bursting out laughing) This is the beginning. You were actually part of my plan.', 3),
  (l_id, '주인공', '(놀라며) 뭐... 때?', '(nollramyeo) Mwo... ttae?', '(shocked) What... What do you mean?', 4),
  (l_id, '악당', '실망하는 표정이 좋군. 이데서러 낙자.', 'Silmanghaneun pyojeong-i jotgun. Ideo-seo rakja.', 'That look of despair suits you well. Fall right here.', 5),
  (l_id, '주인공', '(기운을 차리며) 난 지지 않아. 너를 멘추갤0.', '(giun-eul charrimyeo) Nan jiji anta. Neoreul meomchugesseo.', '(gathering strength) I do not lose. I will stop you.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''악당'' means:', '["hero", "sidekick", "villain", "judge"]', 2, '악당 = villain.', 1),
  (l_id, '''복수'' means:', '["loyalty", "conspiracy", "revenge", "ambition"]', 2, '복수 = revenge.', 2),
  (l_id, 'What does ''-는 법이다'' express?', '["obligation", "disbelief", "a general rule/truth", "desire"]', 2, '-는 법이다 = that is how things naturally work.', 3),
  (l_id, '''내가 즠 줄 알았나?'' means:', '["I will back down", "Did you think I would back down?", "I never back down", "You should back down"]', 1, '-을 줄 알았나 = did you think I would?', 4),
  (l_id, '''독백'' means:', '["dialogue between two people", "villain''''s plan", "monologue", "conspiracy"]', 2, '독백 = monologue / soliloquy.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '한국 드라마에서 악당의 독백은 듀드러지게 등장하는 일이 많다. 자신의 얼마나 정교한 계획을 들보이는 장면은 시청자에게 전율을 바르게 한다. 악당은 단순한 악인이 아니라 자신만의 논리를 가진 입체적 인물로 연출된다. 그냥으로 주인공에게 지는 악당은 시청자의 말을 일으킨다.', 'Villain monologues often appear unexpectedly in Korean dramas. Scenes revealing how elaborate their plans are make viewers hold their breath. Villains are directed not as simple evil-doers but as three-dimensional characters with their own logic. A villain who loses in the end still leaves viewers with lingering words.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 28;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '반전', 'ban-jeon', 'plot twist / reversal', 1),
  (l_id, '연출', 'yeon-chul', 'direction / production', 2),
  (l_id, '틀리다', 'teul-li-da', 'to be wrong / differ from expectation', 3),
  (l_id, '없던', 'eob-deon', 'something that did not exist / never was', 4),
  (l_id, '숨겨지다', 'sum-kyeo-ji-da', 'to be hidden', 5),
  (l_id, '드러나다', 'deu-reo-na-da', 'to be revealed / exposed', 6),
  (l_id, '발각하다', 'bal-gak-ha-da', 'to discover / uncover', 7),
  (l_id, '복선', 'bok-seon', 'foreshadowing', 8),
  (l_id, '뿐리다', 'bbwil-li-da', 'to be deceived', 9),
  (l_id, '팡바다', 'ggae-da', 'to realize / wake up', 10),
  (l_id, '진실', 'jin-sil', 'truth / reality', 11),
  (l_id, '시청자를 충격주다', 'si-cheong-ja-reul chung-gyeok-ju-da', 'to shock the viewer', 12),
  (l_id, '모액을 썸다', 'mo-ael-geul ssal-da', 'to hatch a scheme', 13),
  (l_id, '관계가 들탄나다', 'gwan-gye-ga deul-tan-na-da', 'to be exposed / relationship revealed', 14),
  (l_id, '놀라운 사실', 'nol-la-un sa-sil', 'surprising fact', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-았/었던 것이다', '-ass/eoss-deon geot-ida', 'It turns out it was; revelation of a past hidden fact.', '[{"korean": "그가 진짜 범인이었던 것이다.", "english": "It turns out he was the real culprit."}, {"korean": "둘이 일지가 있었던 것이다.", "english": "It turns out the two had a shared past."}]', 1),
  (l_id, '-음입니까?', '-eum-ibnnikka? (rhetorical)', 'Aren''''t you...? / Is it not?; rhetorical accusation.', '[{"korean": "다 니 계획이었음입니까.", "english": "Was it not all your plan?"}, {"korean": "지장은 니가 죵았음입니까.", "english": "Was it not you who killed the director?"}]', 2),
  (l_id, '-지 않았더라면', '-ji an-ass-deoramyeon', 'If only had not done; past negative counterfactual.', '[{"korean": "은폐하지 않았더라면 알 수 있었을 텐데.", "english": "If only it had not been hidden, I could have known."}, {"korean": "속이지 않았더라면.", "english": "If only you had not deceived me."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '탐정', '(파일을 내려놓으면서) 모든 것을 알았어. 너실헬 일이 없어.', '(pail-eul naeryeono-eumyeo) Modeun geos-eul alasseo. Neosil hel il eopseo.', '(dropping a file) I know everything. There is nothing you can deny.', 1),
  (l_id, '더비언', '(놓친 철하면서) 방얭이 니한테는 너무 맦지.', '(noc-chin cheok-hamyeo) Bangyeok-i nihanteoneun neomu maengjji.', '(pretending calm) Defense seems too weak for you.', 2),
  (l_id, '탐정', '그가 운전하지 않았어. 너가 운전했어. 다 들켰어.', 'Geuga unjeon-ha-ji anasseo. Nega unjeon-haesseo. Da deulkyeosseo.', 'He did not drive. You drove. I heard everything.', 3),
  (l_id, '더비언', '(충격받아서) 어떻게 알았어?', '(chunggyeok-badseo) Eotteoke alasseo?', '(shocked) How did you know?', 4),
  (l_id, '탐정', '취약점은 언제나 고집이야. 너는 카메라를 피했어. 자신만 빠쳐나온 줄 알는 건데.', 'Chwiyakjeom-eun eonjena gojibi-ya. Neoneun kamera-reul pihae-sseo. Jasin-man ppajyeona-on jul aneunde.', 'Weaknesses are always habits. You avoided the camera. You thought only you slipped out.', 5),
  (l_id, '더비언', '(주저앞으며) 나는 다만...', '(jujeok-seum-euro) Naneun daman...', '(hesitating) I was just...', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''반전'' means:', '["foreshadowing", "evidence", "plot twist", "monologue"]', 2, '반전 = reversal / plot twist.', 1),
  (l_id, '''드러나다'' means:', '["to hide", "to be revealed", "to discover", "to deceive"]', 1, '드러나다 = to be revealed / come out.', 2),
  (l_id, 'Which means ''It turns out he was the real culprit''?', '["그가 범인이다", "그가 범인이었던 것이다", "그가 범인이라면", "그가 범인이니까"]', 1, '-았던 것이다 = it turns out it was (past revelation).', 3),
  (l_id, '''진실'' means:', '["lie", "mystery", "truth", "foreshadowing"]', 2, '진실 = truth / reality.', 4),
  (l_id, '''복선'' means:', '["plot twist", "dialogue", "foreshadowing", "reversal"]', 2, '복선 = foreshadowing.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '플롯 트위스트는 한국 드라마에서 시청자들이 가장 흰리하는 요소이다. 오랜 동안 복선으로 숨겨지는 진실이 드러나는 순간 시청자들은 소리를 지른다. 반전은 단순한 놆라움이 아니라 이의 깊은 이야기를 명확하게 해주는 역할을 한다. 잘 연출된 반전은 그 드라마의 유산이 된다.', 'Plot twists are the element Korean drama viewers enjoy most. The moment a truth hidden by long foreshadowing is finally revealed, viewers scream. A twist is not just a simple surprise but serves to clarify the deeper meaning of the story. A well-directed twist becomes the drama''''s legacy.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 29;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '해피엔딩', 'hae-pi-en-ding', 'happy ending', 1),
  (l_id, '결말', 'gyeol-mal', 'ending / conclusion', 2),
  (l_id, '행복', 'haeng-bok', 'happiness', 3),
  (l_id, '보상', 'bo-sang', 'reward / compensation', 4),
  (l_id, '넘어서다', 'neo-meo-seo-da', 'to overcome / surpass', 5),
  (l_id, '화해', 'hwa-hae', 'reconciliation', 6),
  (l_id, '용서', 'yong-seo', 'forgiveness', 7),
  (l_id, '기다리다', 'gi-da-ri-da', 'to wait', 8),
  (l_id, '사랑이 이기다', 'sa-rang-i i-gi-da', 'love wins', 9),
  (l_id, '웃음을 찾다', 'ut-eum-eul chat-da', 'to find laughter / smile again', 10),
  (l_id, '쉽지 않다', 'swip-ji ant-a', 'not easy', 11),
  (l_id, '돌아온다', 'dor-a-on-da', 'to come back', 12),
  (l_id, '리셋', 'ri-set', 'reset', 13),
  (l_id, '함께하다', 'ham-gge-ha-da', 'to be together', 14),
  (l_id, '약속하다', 'yak-sok-ha-da', 'to promise', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-아/어서 다행이다', '-a/eo-seo dahaeng-ida', 'It is fortunate that; expressing relief.', '[{"korean": "돌아와서 다행이야.", "english": "I am so relieved that you came back."}, {"korean": "살아서 다행이야.", "english": "I am grateful that you are alive."}]', 1),
  (l_id, '-다고 약속하다', '-dago yak-sohk-hada', 'To promise that; making a commitment.', '[{"korean": "다시는 헤어지지 않겠다고 약속해.", "english": "Promise me we will never separate again."}, {"korean": "함께하겠다고 약속해.", "english": "Promise to stay together."}]', 2),
  (l_id, '-었/았더라면 어떠 미래였을까', '-eoss/ass-deoramyeon eotteon mirae-yeossulkka', 'What kind of future would there have been if?; wondering about an alternate future.', '[{"korean": "네를 만나지 않았더라면 어떠 미래였을까.", "english": "What future would I have had if I had never met you?"}, {"korean": "존다면 네 곯에 있었더라면.", "english": "If I had stayed by your side."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '여자', '(비 끝에 어딘가) 돌아왔어. 정말 돌아왔어.', '(bi kkute eodinnga) Dolaosseo. Jeongmal dolaosseo.', '(somewhere after the rain) You came back. You really came back.', 1),
  (l_id, '남자', '(안아주며) 돌아온다고 약속했잊아요.', '(anajumyeo) Dolawondago yaksok-haessjanyo.', '(embracing) I promised I would come back, didn''''t I.', 2),
  (l_id, '여자', '미안해. 기다리게 한 걸.', 'Mianhae. Gidarige han geol.', 'I''''m sorry. For making you wait.', 3),
  (l_id, '남자', '기다릴 수 있어서 다행이야. 너 없는 난 없는 거니까.', 'Gidaril su isseoseo dahaeng-iya. Neo eomneun nan eomneun geonikka.', 'I am glad I could wait. Because without you there is no me.', 4),
  (l_id, '여자', '(웃으며) 왜 이렇게 시적이야. 도대체.', '(usseumyeo) Wae ireoke si-jeog-iya. Dodaechae.', '(laughing) Why are you always like this. Honestly.', 5),
  (l_id, '남자', '(이마에 입맞춰면서) 다시는 놔보내지 않아. 언제나 어디서든 함께.', '(ima-e ib-mach-womyeo) Dasineun neol-bonaeja anta. Eonjena eodiseodeun hamkke.', '(touching foreheads) I will never let you go again. Always, wherever, together.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''행복'' means:', '["sadness", "ending", "happiness", "forgiveness"]', 2, '행복 = happiness.', 1),
  (l_id, '''용서'' means:', '["revenge", "reconciliation", "forgiveness", "reward"]', 2, '용서 = forgiveness.', 2),
  (l_id, 'Which means ''I am so relieved you came back''?', '["돌아와도 돼", "돌아와서 다행이야", "돌아오지 말았어야 했는데", "돌아온다고 약속했어"]', 1, '-아서 다행이다 = it is fortunate that.', 3),
  (l_id, '''약속하다'' means:', '["to forgive", "to wait", "to promise", "to reunite"]', 2, '약속하다 = to promise.', 4),
  (l_id, '''화해'' means:', '["argument", "parting", "reconciliation", "confession"]', 2, '화해 = reconciliation.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '해피엔딩은 드라마의 주인공이 고난을 넘어 사랑과 행복을 의비하는 순간이다. 시청자들은 이 순간에 울고 웃으며 소통하는 깔답한 감정을 느낌다. 복잡한 갈등 끝에 찾아온 페피엔딩은 더 많이 빛나는다. 마지막 장면의 대사는 오래 시청자들의 기억에 남는다.', 'The happy ending is the moment the protagonist overcomes hardship and finally grasps love and happiness. Viewers experience a bittersweet rush of crying and laughing simultaneously. A happy ending found after complex conflict shines all the more brightly. The last lines of the final scene linger in viewers'' memories for a long time.', 1);
END $$;

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book = 'kdrama' AND sort_order = 30;
  IF l_id IS NULL THEN RAISE NOTICE 'not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id = l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id = l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id = l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id = l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id = l_id;
  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '마지막 회', 'ma-ji-mak hoe', 'final episode', 1),
  (l_id, '엔딩', 'en-ding', 'ending', 2),
  (l_id, '쿤레딕', 'keu-re-dit', 'credits / ending roll', 3),
  (l_id, '후일담', 'hu-il-dam', 'epilogue', 4),
  (l_id, '레거시', 're-geo-si', 'legacy', 5),
  (l_id, '주인공', 'ju-in-gong', 'protagonist', 6),
  (l_id, '성장', 'seong-jang', 'growth', 7),
  (l_id, '마무리', 'ma-mu-ri', 'conclusion / wrap-up', 8),
  (l_id, '뒤돌아보다', 'dwi-dor-a-bo-da', 'to look back', 9),
  (l_id, '금월화당', 'geum-wol-hwa-dang', 'Mon-Tue drama slot (prime)', 10),
  (l_id, '시청률', 'si-cheong-nyul', 'viewership rating', 11),
  (l_id, '화녕이되다', 'hwa-je-ga-doe-da', 'to become a hot topic', 12),
  (l_id, '센세이션', 'sen-se-i-syeon', 'sensation', 13),
  (l_id, '물력이 지다', 'mul-lyeog-i ji-da', 'to ebb / waves recede', 14),
  (l_id, '새 시작', 'sae si-jak', 'new beginning', 15);
  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id, '-었/았던 날들이', '-eoss/ass-deon nar-deuri', 'The days when; memories of past times.', '[{"korean": "함께했던 날들이 그립다.", "english": "I miss the days we were together."}, {"korean": "울었던 날들이 기억난다.", "english": "I remember the days I cried."}]', 1),
  (l_id, '-이/가 되었다', '-i/ga doeeossda', 'Has become; arrived at a state.', '[{"korean": "마마이 되었다.", "english": "It has come to an end."}, {"korean": "새 시작이 되었다.", "english": "A new beginning has arrived."}]', 2),
  (l_id, '-냨 덮에', '-nan deok-e', 'Thanks to having done; benefiting from a past action.', '[{"korean": "너를 만난 덮에 여기까지 성장했다.", "english": "Thanks to meeting you I grew this far."}, {"korean": "넘어진 덮에 더 강해졌다.", "english": "Thanks to having overcome, I became stronger."}]', 3);
  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '내레이터', '(V오버) 누구나 마지막에는 돌아본다. 돌아감으로써 알게 되는 것들이 있다.', '(V-obeo) Nuguna majimag-eneun dorabon-da. Doragarmeuro-sse algaedwineun geos-deuri itda.', '(V.O.) Everyone looks back at the end. In looking back there are things you come to know.', 1),
  (l_id, '여주', '(어둠 속에서) 털샌이 를 굴어가는 것은 안 될 것 같았는데. 기억나?', '(eodum sogeseo) Teol-saeng-i-reul guraeganeun geos-eun an doel geot gat-asseunde. Gi-eong-na?', '(in darkness) I thought pulling through was not going to be possible. Remember?', 2),
  (l_id, '수호', '기억해. 너마다 포기하려 했을 때.', 'Gieo-khae. Neomada pogihalye-yo haesseul ttae.', 'I remember. Every time you were about to give up.', 3),
  (l_id, '여주', '네 덯분에 여기까지 왔어. 진짜로.', 'Ne deokbun-e yeogi-kkaji wasseo. JinJJaro.', 'Because of you I came this far. Truly.', 4),
  (l_id, '수호', '(손을 잡으며) 너도. 나도 다시 태어난 것 같아.', '(son-eul jabeuMYeo) Neodo. Nado dasi taeeo-nan geot gata.', '(taking hands) You too. I feel like I was born again too.', 5),
  (l_id, '내레이터', '(V오버) 그러ge 그들의 이야기는 끝난다. 아니, 새로 시작된다.', '(V-obeo) Geureoke geodeul-ui iyagineun kkeutnanda. Ani, saero sijakdoenda.', '(V.O.) And so their story ends. Or rather, begins anew.', 6);
  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '''마지막 회'' means:', '["first episode", "plot twist", "final episode", "happy ending"]', 2, '마지막 회 = final episode.', 1),
  (l_id, '''성장'' means:', '["reunion", "ending", "growth", "beginning"]', 2, '성장 = growth.', 2),
  (l_id, 'Which means ''I miss the days we were together''?', '["함께한 날을 그립다", "함께했던 날들이 그립다", "함께할 날을 기다린다", "함께하고 싶어다"]', 1, '-았던 날들이 = the days when (past memories).', 3),
  (l_id, '''시청률'' means:', '["final episode", "viewership rating", "credits", "ending"]', 1, '시청률 = viewership rating.', 4),
  (l_id, 'What does ''-난 덯에'' mean?', '["despite doing", "while doing", "thanks to having done", "before doing"]', 2, '-난 덯에 = thanks to having done something.', 5);
  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id, '마지막 회는 드라마의 모든 것이 수렴되는 순간이다. 주인공의 성장과 사랑이 완성되면서 시청자들은 손답을 치거나 눈물을 \ed750린다. 레거시로 남는 대사들은 어떤 드라마도 쁼어버리지 않는다. 마지막 엘리 케디트가 올라갈 때 마음에 남는 감정은 오래 지속된다.', 'The final episode is the moment everything in the drama converges. As the protagonist''''s growth and love reach completion, viewers applaud or shed tears. Lines that remain as legacy are never forgotten in any drama. The emotion lingering in the heart as the ending credits roll lasts a long time.', 1);
END $$;
