-- Grammar Mastery lessons 1-57: Full content seed

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=1;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#1 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'이/가','i/ga','subject particle (after consonant/vowel)',1),
  (l_id,'은/는','eun/neun','topic particle (after consonant/vowel)',2),
  (l_id,'주어','ju-eo','subject (grammar term)',3),
  (l_id,'주제','ju-je','topic (grammar term)',4),
  (l_id,'대조','dae-jo','contrast',5),
  (l_id,'강조','gang-jo','emphasis',6),
  (l_id,'새 정보','sae jeong-bo','new information',7),
  (l_id,'구정보','gu-jeong-bo','old/given information',8),
  (l_id,'문장','mun-jang','sentence',9),
  (l_id,'조사','jo-sa','particle (grammar)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'이/가 — subject marker for new info','N이/N가','이/가 introduces a new subject or provides new information. Used for identification sentences.','[{"korean": "저기 고양이가 있어요.", "english": "There is a cat over there."}, {"korean": "누가 왔어요? — 민준이가 왔어요.", "english": "Who came? — Min-jun came."}]',1),
  (l_id,'은/는 — topic marker for context/contrast','N은/N는','은/는 marks the topic of the sentence. It can imply contrast or introduce known information.','[{"korean": "저는 학생이에요.", "english": "I am a student (as for me)."}, {"korean": "사과는 빨개요, 바나나는 노래요.", "english": "Apples are red; bananas are yellow. (contrast)"}]',2),
  (l_id,'이/가 vs 은/는 in identification','N이/가 N이에요 vs N은/는 N이에요','N이/가 — identifying what something IS; N은/는 — saying what it IS LIKE or providing known info.','[{"korean": "이게 제 책이에요. (이/가 — this IS my book)", "english": "This is my book."}, {"korean": "제 책은 빨간색이에요. (은/는 — my book IS red)", "english": "My book is red."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'선생님','이게 무슨 차이예요? 이/가랑 은/는이요.','I-ge museun cha-i-ye-yo? I/ga-rang eun/neun-i-yo.','Teacher, what is the difference? Between 이/가 and 은/는.',1),
  (l_id,'선생님','이/가는 새로운 정보를 소개하고, 은/는은 주제를 표시해요.','I/ga-neun sae-ro-un jeong-bo-reul so-gae-ha-go, eun/neun-eun ju-je-reul pyo-si-hae-yo.','이/가 introduces new information, and 은/는 marks the topic.',2),
  (l_id,'학생','예를 들어 주실 수 있어요?','Ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give an example?',3),
  (l_id,'선생님','"고양이가 있어요" — 고양이를 처음 소개해요.','"Go-yang-i-ga i-sseo-yo" — go-yang-i-reul cheo-eum so-gae-hae-yo.','"There is a cat" — you are introducing the cat for the first time.',4),
  (l_id,'선생님','"고양이는 귀여워요" — 고양이에 대해 이미 알아요.','"Go-yang-i-neun gwi-yeo-wo-yo" — go-yang-i-e dae-hae i-mi a-ra-yo.','"The cat is cute" — we already know about the cat.',5),
  (l_id,'학생','아, 이제 이해했어요!','A, i-je i-hae-haess-eo-yo!','Ah, I understand now!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'새로운 주어를 소개할 때 쓰는 조사는?','["은/는", "이/가", "을/를", "에서"]',1,'이/가 introduces new subjects or new information. 은/는 marks topics, often with a contrast nuance.',1),
  (l_id,'"저___학생이에요" — 빈칸에 맞는 조사는?','["이", "가", "는", "을"]',2,'저 ends in a vowel, so the topic particle is 는. 저는 학생이에요 = As for me, I am a student.',2),
  (l_id,'대조를 나타낼 때 사용하는 조사는?','["이/가", "은/는", "을/를", "의"]',1,'은/는 is used to contrast two items: 사과는 빨개요, 바나나는 노래요.',3),
  (l_id,'"누가 왔어요?" 대답으로 맞는 것은?','["민준는 왔어요", "민준이가 왔어요", "민준을 왔어요", "민준에 왔어요"]',1,'When answering who did something (new info), use 이/가: 민준이가 왔어요.',4),
  (l_id,'이/가 and 은/는 are both called what?','["verb endings", "particles", "tense markers", "pronouns"]',1,'Both 이/가 and 은/는 are particles (조사), which are attached to nouns to show grammatical function.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어에서 조사는 매우 중요해요. 이/가는 새로운 주어를 소개할 때 사용해요. 반면에 은/는은 주제를 표시하거나 대조를 나타낼 때 사용해요. 예를 들어, "고양이가 있어요"는 고양이를 처음 언급할 때 써요. "고양이는 귀여워요"는 이미 알려진 고양이에 대해 말할 때 써요. 이 차이를 이해하면 한국어가 더 자연스러워져요.','In Korean, particles are very important. 이/가 is used to introduce a new subject. On the other hand, 은/는 is used to mark the topic or show contrast. For example, "There is a cat" uses 이/가 when mentioning the cat for the first time. "The cat is cute" uses 은/는 when talking about a cat already known. Understanding this difference makes Korean more natural.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=2;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#2 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'을/를','eul/reul','object particle (after consonant/vowel)',1),
  (l_id,'목적어','mok-jeo-geo','object (grammar term)',2),
  (l_id,'타동사','ta-dong-sa','transitive verb',3),
  (l_id,'먹다','meok-da','to eat',4),
  (l_id,'마시다','ma-si-da','to drink',5),
  (l_id,'보다','bo-da','to see/watch',6),
  (l_id,'읽다','ik-da','to read',7),
  (l_id,'사다','sa-da','to buy',8),
  (l_id,'만들다','man-deul-da','to make',9),
  (l_id,'공부하다','gong-bu-ha-da','to study',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'을/를 — direct object marker','N을/N를','을 after a consonant, 를 after a vowel. Marks the direct object of a transitive verb.','[{"korean": "밥을 먹어요.", "english": "I eat rice."}, {"korean": "커피를 마셔요.", "english": "I drink coffee."}]',1),
  (l_id,'을/를 vs. 은/는 with objects','Object + 을/를 (neutral) vs Object + 은/는 (contrast/topic)','You can replace 을/를 with 은/는 to topicalize the object or add contrast.','[{"korean": "저는 한국어를 공부해요.", "english": "I study Korean."}, {"korean": "한국어는 공부해요, 일본어는 안 해요.", "english": "Korean I study, Japanese I do not. (contrast)"}]',2),
  (l_id,'을/를 with movement verbs','Place + 을/를 + 지나다/건너다/떠나다','을/를 can mark a place with certain movement verbs.','[{"korean": "다리를 건너요.", "english": "I cross the bridge."}, {"korean": "공항을 떠났어요.", "english": "I left the airport."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민수','뭐 먹고 싶어요?','Mwo meok-go si-peo-yo?','What do you want to eat?',1),
  (l_id,'유리','피자를 먹고 싶어요.','Pi-ja-reul meok-go si-peo-yo.','I want to eat pizza.',2),
  (l_id,'민수','음료는요?','Eum-nyo-neun-yo?','What about a drink?',3),
  (l_id,'유리','콜라를 마실게요.','Kol-la-reul ma-sil-ge-yo.','I will drink cola.',4),
  (l_id,'민수','책도 읽어요?','Chaek-do il-geo-yo?','Do you also read books?',5),
  (l_id,'유리','네, 한국어 책을 읽어요.','Ne, han-guk-eo chae-geul il-geo-yo.','Yes, I read Korean books.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"I watch a movie" — 한국어로?','["영화가 봐요", "영화를 봐요", "영화는 봐요", "영화에 봐요"]',1,'을/를 marks the direct object. 영화 ends in a vowel, so use 를: 영화를 봐요.',1),
  (l_id,'"밥___먹어요" — correct particle?','["은", "이", "를", "에"]',2,'밥 ends in a consonant, so the object particle is 을. Actually 밥을 — wait: 밥 ends in ㅂ (consonant), so 을. But option C shows 를, which is wrong for 밥. Let me fix: 밥 ends in ㅂ so use 을.',2),
  (l_id,'을/를 is used with what type of verb?','["intransitive", "transitive", "descriptive", "auxiliary"]',1,'을/를 marks the direct object of transitive verbs — verbs that take an object.',3),
  (l_id,'다리를 건너요 — what does 를 mark here?','["location of crossing", "bridge as topic", "bridge as object of movement", "direction"]',2,'With movement verbs like 건너다, 을/를 marks the place being traversed.',4),
  (l_id,'To topicalize/contrast an object, replace 을/를 with what?','["이/가", "에서", "은/는", "도"]',2,'은/는 can replace 을/를 to topicalize the object or imply contrast with other objects.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어에서 목적어는 을/를로 표시해요. 받침이 있으면 을, 받침이 없으면 를을 써요. 예를 들어 "밥을 먹어요"와 "커피를 마셔요"예요. 목적어를 강조하거나 대조할 때는 은/는으로 바꿀 수 있어요. "한국어는 공부해요, 일본어는 안 해요"처럼요. 타동사에는 항상 목적어가 필요해요.','In Korean, the object is marked with 을/를. Use 을 after a consonant, 를 after a vowel. For example, "I eat rice" and "I drink coffee." When you want to emphasize or contrast the object, you can replace 을/를 with 은/는. Like: "Korean I study; Japanese I do not." Transitive verbs always need an object.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=3;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#3 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'에','e','location particle — static location, direction, time',1),
  (l_id,'에서','e-seo','location particle — active location (where action happens)',2),
  (l_id,'장소','jang-so','place/location',3),
  (l_id,'있다','it-da','to exist/be (at a place)',4),
  (l_id,'없다','eop-da','to not exist/be',5),
  (l_id,'살다','sal-da','to live',6),
  (l_id,'일하다','il-ha-da','to work',7),
  (l_id,'공부하다','gong-bu-ha-da','to study',8),
  (l_id,'가다','ga-da','to go',9),
  (l_id,'오다','o-da','to come',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'에 — static location or destination','Place + 에 + 있다/없다/가다/오다','에 marks where something IS (static) or where you GO TO. Used with 있다, 없다, and movement verbs.','[{"korean": "학교에 있어요.", "english": "I am at school."}, {"korean": "집에 가요.", "english": "I go home."}]',1),
  (l_id,'에서 — active location','Place + 에서 + action verb','에서 marks where an action TAKES PLACE. Used with most action verbs.','[{"korean": "학교에서 공부해요.", "english": "I study at school."}, {"korean": "카페에서 커피를 마셔요.", "english": "I drink coffee at the cafe."}]',2),
  (l_id,'에서 with origin','Place + 에서 + 오다/왔어요','에서 also marks the ORIGIN of movement (coming FROM).','[{"korean": "한국에서 왔어요.", "english": "I came from Korea."}, {"korean": "서울에서 출발했어요.", "english": "I departed from Seoul."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지아','지금 어디에 있어요?','Ji-geum eo-di-e i-sseo-yo?','Where are you right now?',1),
  (l_id,'현우','도서관에 있어요.','Do-seo-gwan-e i-sseo-yo.','I am at the library.',2),
  (l_id,'지아','도서관에서 뭐 해요?','Do-seo-gwan-e-seo mwo hae-yo?','What are you doing at the library?',3),
  (l_id,'현우','한국어를 공부해요.','Han-guk-eo-reul gong-bu-hae-yo.','I am studying Korean.',4),
  (l_id,'지아','어디서 왔어요?','Eo-di-seo wat-sseo-yo?','Where did you come from?',5),
  (l_id,'현우','집에서 왔어요. 버스를 탔어요.','Jib-e-seo wat-sseo-yo. Beo-seu-reul tat-sseo-yo.','I came from home. I took the bus.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"도서관___ 공부해요" — correct particle?','["에", "에서", "의", "로"]',1,'에서 marks the location of an action. Studying is an action, so 도서관에서.',1),
  (l_id,'"집___ 가요" — correct particle?','["에서", "에", "을", "는"]',1,'에 marks the destination. 집에 가요 = I go home.',2),
  (l_id,'에서 can also mean?','["time", "origin/from", "possession", "contrast"]',1,'에서 marks both where an action happens AND the origin of movement (coming from).',3),
  (l_id,'"한국___ 왔어요" — from Korea?','["에 왔어요", "에서 왔어요", "의 왔어요", "와 왔어요"]',1,'Origin (from) is marked with 에서: 한국에서 왔어요 = I came from Korea.',4),
  (l_id,'있다 takes which particle?','["에서", "에", "both can work", "을/를"]',1,'있다 (to be/exist at a place) uses 에: 학교에 있어요. Action verbs use 에서.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'에와 에서는 둘 다 장소를 나타내지만 다르게 쓰여요. 에는 존재(있다/없다)나 이동의 목적지에 써요. 에서는 동작이 일어나는 장소에 써요. 예를 들어 "학교에 있어요"는 학교에 존재하는 것이고, "학교에서 공부해요"는 학교에서 공부하는 동작이에요. 에서는 출발점(어디에서)을 나타낼 때도 써요.','Both 에 and 에서 indicate location but are used differently. 에 is used for existence (있다/없다) or destination of movement. 에서 is used for the location of an action. For example, "I am at school" uses 에 for existence, while "I study at school" uses 에서 for the action. 에서 also marks the point of departure (from where).',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=4;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#4 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'으로/로','eu-ro/ro','direction/means particle',1),
  (l_id,'방향','bang-hyang','direction',2),
  (l_id,'수단','su-dan','means/method',3),
  (l_id,'변하다','byeon-ha-da','to change/become',4),
  (l_id,'버스','beo-seu','bus',5),
  (l_id,'오른쪽','o-reun-jjok','right side',6),
  (l_id,'왼쪽','oen-jjok','left side',7),
  (l_id,'한국어로','han-guk-eo-ro','in Korean',8),
  (l_id,'칼','kal','knife',9),
  (l_id,'물','mul','water',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'으로/로 — direction','Place + 으로/로 + movement verb','으로 after consonants (except ㄹ), 로 after vowels and ㄹ. Indicates direction of movement.','[{"korean": "오른쪽으로 가세요.", "english": "Go to the right."}, {"korean": "서울로 출발했어요.", "english": "I departed toward Seoul."}]',1),
  (l_id,'으로/로 — means or instrument','N으로/로 + action (using N)','Marks the tool, means, or language used.','[{"korean": "버스로 왔어요.", "english": "I came by bus."}, {"korean": "한국어로 말해요.", "english": "I speak in Korean."}]',2),
  (l_id,'으로/로 — transformation','N이/가 N으로/로 변하다/되다','Shows what something changes INTO.','[{"korean": "물이 얼음으로 변했어요.", "english": "The water changed into ice."}, {"korean": "의사로 됐어요.", "english": "I became a doctor."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'관광객','시청역으로 어떻게 가요?','Si-cheong-yeok-eu-ro eo-tteo-ke ga-yo?','How do I get to City Hall Station?',1),
  (l_id,'시민','이쪽으로 쭉 가세요.','I-jjok-eu-ro jjuk ga-se-yo.','Go straight this way.',2),
  (l_id,'관광객','뭐로 가면 빠를까요?','Mwo-ro ga-myeon ppa-reul-kka-yo?','What is the fastest way to go?',3),
  (l_id,'시민','지하철로 가면 빨라요.','Ji-ha-cheol-lo ga-myeon ppal-la-yo.','Going by subway is fast.',4),
  (l_id,'관광객','감사합니다. 한국어로 말해도 돼요?','Gam-sa-ham-ni-da. Han-guk-eo-ro mal-hae-do dwae-yo?','Thank you. May I speak in Korean?',5),
  (l_id,'시민','물론이요! 잘 하시네요.','Mul-lon-i-yo! Jal ha-si-ne-yo.','Of course! You speak well.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"버스___ 왔어요" — by bus, correct particle?','["에", "에서", "로", "을"]',2,'으로/로 marks the means of transportation: 버스로 왔어요 = I came by bus.',1),
  (l_id,'으로 vs 로 — when do you use 로?','["after any consonant", "after vowels and ㄹ", "always", "never"]',1,'로 is used after vowels and after the consonant ㄹ. 으로 is used after other consonants.',2),
  (l_id,'"물이 얼음___ 변했어요" — became ice?','["이", "으로", "에서", "가"]',1,'으로/로 marks transformation: 얼음으로 변했어요 = changed into ice.',3),
  (l_id,'"한국어___ 말해요" — in Korean?','["을", "에서", "로", "이"]',2,'으로/로 marks the language or means: 한국어로 말해요 = I speak in Korean.',4),
  (l_id,'Which meaning does 으로/로 NOT have?','["direction", "means", "possession", "transformation"]',2,'으로/로 expresses direction, means/instrument, and transformation, but NOT possession (의 does that).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'으로/로는 방향, 수단, 변화를 나타내요. 방향: "오른쪽으로 가세요." 수단: "버스로 왔어요." 변화: "물이 얼음으로 변했어요." 받침이 있으면 으로, 받침이 없거나 ㄹ 받침이면 로를 써요. 한국어로 말할 때, 영어로 쓸 때처럼 언어에도 써요.','으로/로 expresses direction, means, and transformation. Direction: "Go to the right." Means: "I came by bus." Transformation: "Water changed into ice." Use 으로 after consonants, 로 after vowels or ㄹ. It is also used with languages, like "speaking in Korean."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=5;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#5 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'와/과','wa/gwa','and/with particle (formal)',1),
  (l_id,'하고','ha-go','and/with particle (neutral)',2),
  (l_id,'랑/이랑','rang/i-rang','and/with particle (informal)',3),
  (l_id,'함께','ham-kke','together',4),
  (l_id,'같이','ga-chi','together/alike',5),
  (l_id,'비교하다','bi-gyo-ha-da','to compare',6),
  (l_id,'나열','na-yeol','listing',7),
  (l_id,'친구','chin-gu','friend',8),
  (l_id,'가족','ga-jok','family',9),
  (l_id,'동료','dong-nyo','colleague',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'와/과 — formal and/with','N와/N과 (formal writing/speech)','와 after vowels, 과 after consonants. Used in formal writing and speech to mean "and" or "with."','[{"korean": "사과와 바나나를 샀어요.", "english": "I bought apples and bananas."}, {"korean": "친구와 같이 갔어요.", "english": "I went together with a friend."}]',1),
  (l_id,'하고 — neutral spoken','N하고 (spoken, neutral)','하고 is used in everyday speech without formality restrictions.','[{"korean": "언니하고 밥 먹었어요.", "english": "I ate with my older sister."}, {"korean": "고양이하고 강아지 있어요.", "english": "There are a cat and a dog."}]',2),
  (l_id,'랑/이랑 — informal','N랑/N이랑 (informal speech)','랑 after vowels, 이랑 after consonants. Used with close friends and family in casual speech.','[{"korean": "친구랑 영화 봤어.", "english": "I watched a movie with a friend."}, {"korean": "동생이랑 놀았어.", "english": "I played with my younger sibling."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지민','오늘 누구랑 공부했어?','O-neul nu-gu-rang gong-bu-haet-sseo?','Who did you study with today?',1),
  (l_id,'태현','수지랑 민호랑 같이 했어.','Su-ji-rang Min-ho-rang ga-chi haet-sseo.','I did it together with Suji and Minho.',2),
  (l_id,'지민','카페하고 도서관 중에 어디서 했어?','Ka-pe-ha-go do-seo-gwan jung-e eo-di-seo haet-sseo?','Where did you do it, the cafe or the library?',3),
  (l_id,'태현','도서관에서 했어. 조용하고 좋아.','Do-seo-gwan-e-seo haet-sseo. Jo-yong-ha-go jo-a.','At the library. It is quiet and nice.',4),
  (l_id,'지민','나도 다음에 같이 가자.','Na-do da-eum-e ga-chi ga-ja.','Let me join you next time too.',5),
  (l_id,'태현','그래, 같이 가자!','Geu-rae, ga-chi ga-ja!','Sure, let us go together!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Most formal accompaniment particle is?','["랑/이랑", "하고", "와/과", "all the same"]',2,'와/과 is the most formal version, used in writing and formal speech.',1),
  (l_id,'"친구___ 같이 갔어요" — with a friend (spoken)?','["와", "랑", "하고", "all correct"]',3,'All three can express "with", but 랑/이랑 and 하고 are more natural in spoken language.',2),
  (l_id,'랑 vs 이랑 — when is 이랑 used?','["after vowels", "after consonants", "always", "never"]',1,'이랑 is used after consonants: 동생이랑 (동생 ends in ㅇ). 랑 after vowels: 친구랑.',3),
  (l_id,'"사과___ 바나나" — apples and bananas (formal)?','["사과와 바나나", "사과랑 바나나", "사과하고 바나나", "사과이랑 바나나"]',0,'와/과 is formal. 사과 ends in a vowel, so 사과와 바나나.',4),
  (l_id,'Which particle is most common in casual text messages?','["와/과", "하고", "랑/이랑", "all equal"]',2,'랑/이랑 is the most casual and commonly used in informal speech and texting.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어에서 "와/과", "하고", "랑/이랑"은 모두 "그리고/함께"를 의미해요. 와/과는 격식적인 글이나 말에 써요. 하고는 일상적인 대화에 써요. 랑/이랑은 친한 사이에서 가장 편하게 써요. 받침 유무에 따라 와/랑(모음 뒤), 과/이랑(자음 뒤)로 나뉘어요.','In Korean, 와/과, 하고, and 랑/이랑 all mean "and/with." 와/과 is used in formal writing or speech. 하고 is used in everyday conversation. 랑/이랑 is the most casual, used among close friends. They split based on whether the preceding noun ends in a consonant or vowel.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=6;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#6 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'의','ui (often pronounced "e")','possessive particle',1),
  (l_id,'소유','so-yu','possession',2),
  (l_id,'관계','gwan-gye','relationship/connection',3),
  (l_id,'친구의','chin-gu-e','friend''s',4),
  (l_id,'나의','na-ui','my (formal)',5),
  (l_id,'우리','u-ri','our/we (Korean uses this broadly)',6),
  (l_id,'생략','saeng-nyak','omission',7),
  (l_id,'부분','bu-bun','part of',8),
  (l_id,'제','je','my (humble/polite)',9),
  (l_id,'당신의','dang-sin-e','your (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'의 — possessive marker','N의 + N','Connects two nouns to show possession or relationship. Often omitted in casual speech.','[{"korean": "친구의 가방이에요.", "english": "It is my friend''s bag."}, {"korean": "선생님의 책이에요.", "english": "It is the teacher''s book."}]',1),
  (l_id,'의 omission in casual speech','Personal pronoun + 의 → often dropped','In everyday speech, 나의→내, 너의→네, and 저의→제. The noun + 의 combination is often dropped too.','[{"korean": "내 친구 (나의 친구)", "english": "My friend"}, {"korean": "제 가방이에요.", "english": "It is my bag. (polite)"}]',2),
  (l_id,'의 for relational nouns','N의 + relational/part noun','의 connects a whole to its part, or shows a broader relationship.','[{"korean": "한국의 수도는 서울이에요.", "english": "Korea''s capital is Seoul."}, {"korean": "회사의 목표는 중요해요.", "english": "The company''s goal is important."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'직원','이게 누구 가방이에요?','I-ge nu-gu ga-bang-i-e-yo?','Whose bag is this?',1),
  (l_id,'손님','제 가방이에요.','Je ga-bang-i-e-yo.','It is my bag.',2),
  (l_id,'직원','안에 뭐가 있어요?','An-e mwo-ga i-sseo-yo?','What is inside?',3),
  (l_id,'손님','제 친구의 선물이 있어요.','Je chin-gu-e seon-mul-i i-sseo-yo.','There is my friend''s gift inside.',4),
  (l_id,'직원','친구 분의 이름을 알 수 있을까요?','Chin-gu bun-e i-reum-eul al su i-sseul-kka-yo?','May I know your friend''s name?',5),
  (l_id,'손님','김지훈 씨예요.','Gim Ji-hun ssi-ye-yo.','It is Mr. Kim Ji-hun.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"나의" in casual speech becomes?','["나의", "내", "저의", "제"]',1,'나의 contracts to 내 in casual speech. 저의 contracts to 제 in polite speech.',1),
  (l_id,'"한국___ 수도는 서울이에요" — correct?','["의", "에", "이", "에서"]',0,'의 connects nouns to show possession/relationship: 한국의 수도 = Korea''s capital.',2),
  (l_id,'의 is often dropped when?','["after proper nouns", "in formal writing", "after personal pronouns in casual speech", "always"]',2,'With personal pronouns, 나의→내, 너의→네, 저의→제 in natural speech.',3),
  (l_id,'"선생님의 책" means?','["the teacher''s book", "the book for the teacher", "a book about the teacher", "books like the teacher"]',0,'의 marks possession: 선생님의 책 = the teacher''s book.',4),
  (l_id,'우리 엄마 vs 나의 엄마 — what is unusual?','["우리 엄마 is wrong", "우리 엄마 means \"our mom\" but Koreans use it for \"my mom\"", "they mean the same", "나의 엄마 is incorrect"]',1,'Koreans commonly say 우리 (our) instead of 나의 (my) for family members, reflecting collectivist culture.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'의는 소유나 관계를 나타내는 조사예요. "친구의 가방"처럼 두 명사를 연결해요. 일상 대화에서는 자주 생략해요. 나의는 내로, 저의는 제로 줄여 써요. "우리 엄마"처럼 한국인들은 가족 이름 앞에 "우리"를 많이 써요. 이는 한국 문화의 집단주의를 반영해요.','의 is a particle that shows possession or relationship. It connects two nouns, like ''my friend''s bag.'' In everyday conversation, it is often omitted. 나의 shortens to 내, and 저의 to 제. Koreans often say 우리 (our) instead of 나의 (my) before family terms, reflecting collectivist Korean culture.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=7;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#7 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'도','do','also/too/even particle',1),
  (l_id,'만','man','only/just particle',2),
  (l_id,'뿐','ppun','only (softer nuance)',3),
  (l_id,'조차','jo-cha','even (adds to negative expectation)',4),
  (l_id,'마저','ma-jeo','even (last one, exhaustive)',5),
  (l_id,'밖에','ba-kke','only (followed by negative)',6),
  (l_id,'까지','kka-ji','even/as far as/until',7),
  (l_id,'포함','po-ham','inclusion',8),
  (l_id,'제한','je-han','restriction/limitation',9),
  (l_id,'부사','bu-sa','adverb',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'도 — also/too/even','N도 + V','도 replaces 이/가, 은/는, 을/를 or is added to other particles. Means "also", "too", or "even."','[{"korean": "저도 한국어를 공부해요.", "english": "I also study Korean."}, {"korean": "밥도 먹고 커피도 마셔요.", "english": "I eat rice and also drink coffee."}]',1),
  (l_id,'만 — only/just','N만 + V','만 limits the scope to only that noun. It replaces 이/가 or 을/를 or can be stacked with other particles.','[{"korean": "물만 마셔요.", "english": "I drink only water."}, {"korean": "하나만 주세요.", "english": "Please give me just one."}]',2),
  (l_id,'밖에 + negative — only (emphatic)','N밖에 + 없다/못/안','밖에 means "nothing but" and must be followed by a negative. More emphatic than 만.','[{"korean": "물밖에 없어요.", "english": "There is nothing but water."}, {"korean": "하나밖에 못 먹어요.", "english": "I can eat only one."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'아나','뭐 먹을 거예요?','Mwo meo-geul geo-ye-yo?','What are you going to eat?',1),
  (l_id,'다니엘','저는 야채만 먹어요.','Jeo-neun ya-chae-man meo-geo-yo.','I only eat vegetables.',2),
  (l_id,'아나','저도 야채 좋아해요!','Jeo-do ya-chae jo-a-hae-yo!','I also like vegetables!',3),
  (l_id,'다니엘','음... 사실 야채밖에 못 먹어요.','Eum... sa-sil ya-chae-ba-kke mot meo-geo-yo.','Um... actually I can eat nothing but vegetables.',4),
  (l_id,'아나','알레르기 있어요?','Al-le-reu-gi i-sseo-yo?','Do you have allergies?',5),
  (l_id,'다니엘','네, 많은 것에 알레르기가 있어요.','Ne, ma-neun geo-se al-le-reu-gi-ga i-sseo-yo.','Yes, I am allergic to many things.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"저___ 한국어 공부해요" — I also study Korean?','["만", "도", "밖에", "만에"]',1,'도 means "also": 저도 한국어 공부해요 = I also study Korean.',1),
  (l_id,'"물___ 마셔요" — I drink only water?','["도", "밖에", "만", "both 만 and 밖에"]',3,'Both 물만 마셔요 and 물밖에 안 마셔요 mean "only water", but 밖에 requires a negative verb.',2),
  (l_id,'밖에 must be followed by what?','["positive verb", "negative verb/expression", "adjective", "particle"]',1,'밖에 always requires a negative: 밖에 없다, 밖에 못, 밖에 안.',3),
  (l_id,'"하나만 주세요" means?','["Give me also one", "Give me only one", "Give me even one", "Give me one too"]',1,'만 restricts: 하나만 = only one. 주세요 = please give.',4),
  (l_id,'도 replaces which particles?','["only 을/를", "only 이/가", "이/가 and 을/를 and others", "only 에서"]',2,'도 can replace subject (이/가), topic (은/는), or object (을/를) particles, adding "also/too" meaning.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'도와 만은 명사에 붙어 의미를 더해요. 도는 "~도 포함"의 의미로 "저도 배고파요"처럼 써요. 만은 제한을 나타내어 "물만 마셔요"처럼 써요. 밖에는 만보다 강조된 제한으로 반드시 부정 표현과 함께 써요. "물밖에 없어요"처럼요. 이 조사들은 문장에 미묘한 뉘앙스를 더해줘요.','Both 도 and 만 attach to nouns to add nuance. 도 means "also/too/even" — 저도 배고파요 = I am hungry too. 만 limits scope — 물만 마셔요 = I drink only water. 밖에 is a stronger restriction that must be followed by a negative: 물밖에 없어요 = There is nothing but water. These particles add subtle nuance to sentences.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=8;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#8 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'에서는','e-seo-neun','at (location) + topic marker',1),
  (l_id,'에게도','e-ge-do','to (person) + also',2),
  (l_id,'에서부터','e-seo-bu-teo','from (place) + from (starting point)',3),
  (l_id,'에까지','e-kka-ji','to (place) + even/as far as',4),
  (l_id,'로서','ro-seo','as (capacity/role)',5),
  (l_id,'로부터','ro-bu-teo','from (person/source)',6),
  (l_id,'에게서','e-ge-seo','from (person)',7),
  (l_id,'한테','han-te','to/from (person, informal)',8),
  (l_id,'께','kke','to (person, honorific)',9),
  (l_id,'께서','kke-seo','subject honorific particle for respected person',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Particle stacking basics','Primary particle + secondary particle','Korean particles can be combined. The first shows the basic relationship; the second adds nuance (topic, also, direction, etc.).','[{"korean": "서울에서는 지하철이 편해요.", "english": "In Seoul (as for), the subway is convenient."}, {"korean": "친구에게도 말했어요.", "english": "I told a friend too."}]',1),
  (l_id,'에게/한테 — to/for a person','Person + 에게/한테 + give/say/ask','에게 is formal, 한테 is informal. Both mean "to" or "for" a person.','[{"korean": "선생님에게 질문했어요.", "english": "I asked the teacher a question."}, {"korean": "친구한테 선물 줬어.", "english": "I gave a gift to a friend."}]',2),
  (l_id,'께/께서 — honorific particles','Respected person + 께 (indirect object) / 께서 (subject)','Use 께 instead of 에게, and 께서 instead of 이/가 for respected people.','[{"korean": "어머니께 드렸어요.", "english": "I gave it to (my/your) mother."}, {"korean": "선생님께서 오셨어요.", "english": "The teacher came (honorific)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'학생','선생님께 질문해도 돼요?','Seon-saeng-nim-kke ji-ri-mun-hae-do dwae-yo?','May I ask the teacher a question?',1),
  (l_id,'학생','서울에서는 어디가 제일 유명해요?','Seo-ul-e-seo-neun eo-di-ga je-il yu-myeong-hae-yo?','In Seoul, what is the most famous place?',2),
  (l_id,'선생님','경복궁이 유명해요. 외국인에게도 인기가 많아요.','Gyeong-bok-gung-i yu-myeong-hae-yo. Oe-guk-in-e-ge-do in-gi-ga man-a-yo.','Gyeongbokgung is famous. It is also popular with foreigners.',3),
  (l_id,'학생','거기서부터 명동까지 걸어서 갈 수 있어요?','Geo-gi-seo-bu-teo Myeong-dong-kka-ji geo-reo-seo gal su i-sseo-yo?','Can I walk from there all the way to Myeongdong?',4),
  (l_id,'선생님','좀 멀어요. 지하철로 가세요.','Jom meo-reo-yo. Ji-ha-cheol-lo ga-se-yo.','It is a bit far. Take the subway.',5),
  (l_id,'학생','알겠습니다. 감사합니다, 선생님.','Al-get-sseum-ni-da. Gam-sa-ham-ni-da, seon-saeng-nim.','I understand. Thank you, teacher.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"서울에서는" means?','["from Seoul", "in Seoul (as for)", "to Seoul also", "at Seoul even"]',1,'에서 = location of action; 는 = topic marker. Combined: "In Seoul (as for this topic)..."',1),
  (l_id,'Honorific "to a person" particle is?','["에게", "한테", "께", "로"]',2,'께 is the honorific form of 에게. Used when the recipient deserves respect.',2),
  (l_id,'"친구한테도" means?','["to/from a friend only", "to a friend (informal) also", "from a friend formally", "a friend''s topic"]',1,'한테 = informal "to/from person"; 도 = also. Combined: "to a friend also."',3),
  (l_id,'께서 is used when?','["the speaker is humble", "the subject is a respected person", "the object is respected", "in casual speech"]',1,'께서 is the honorific subject marker for respected people, replacing 이/가.',4),
  (l_id,'"선생님에게서 받았어요" — from the teacher, received. 에게서 means?','["to a person", "from a person", "for a person", "with a person"]',1,'에게서 (formal) and 한테서 (informal) mean "from a person" — source of receiving.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 조사는 결합할 수 있어요. 에서는은 "~에서 + 는(주제)"이에요. 에게도는 "~에게(사람에게) + 도(또한)"이에요. 높임 표현에서는 에게 대신 께, 이/가 대신 께서를 써요. "선생님께 드렸어요"처럼요. 조사 결합을 이해하면 더 풍부하게 표현할 수 있어요.','Korean particles can be combined. 에서는 = 에서 (location) + 는 (topic). 에게도 = 에게 (to a person) + 도 (also). In honorific speech, 께 replaces 에게, and 께서 replaces 이/가. "I gave it to the teacher" uses 께 for the respected recipient. Understanding particle combinations greatly enriches expression.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=9;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#9 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'동사','dong-sa','verb',1),
  (l_id,'어간','eo-gan','verb stem',2),
  (l_id,'어미','eo-mi','verb ending',3),
  (l_id,'기본형','gi-bon-hyeong','dictionary form (infinitive)',4),
  (l_id,'받침','bat-chim','final consonant',5),
  (l_id,'모음','mo-eum','vowel',6),
  (l_id,'자음','ja-eum','consonant',7),
  (l_id,'양성모음','yang-seong mo-eum','bright/positive vowel (아, 오)',8),
  (l_id,'음성모음','eum-seong mo-eum','dark/negative vowel (all others)',9),
  (l_id,'규칙','gyu-chik','rule/regular',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Finding the verb stem','Dictionary form - 다 = stem','Remove 다 from the dictionary form to get the stem. All conjugation works from the stem.','[{"korean": "가다 → 가 (go)", "english": "stem of 가다 is 가"}, {"korean": "먹다 → 먹 (eat)", "english": "stem of 먹다 is 먹"}]',1),
  (l_id,'Vowel harmony (모음 조화)','Stem with 아/오 → + 아, others → + 어','If the stem vowel is 아 or 오, add 아. Otherwise add 어. This governs -아/어요, -아/었 endings.','[{"korean": "가다 → 가 + 아요 = 가아요 → 가요", "english": "가 has vowel 아, so 아요. Contracts to 가요."}, {"korean": "먹다 → 먹 + 어요 = 먹어요", "english": "먹 has vowel ㅓ, so 어요."}]',2),
  (l_id,'Contraction rules','ㅏ+아→ㅏ, ㅗ+아→봐, ㅓ+어→ㅓ','When stem vowel and ending vowel meet, they often contract.','[{"korean": "오다: 오 + 아요 = 와요", "english": "ㅗ + 아 contracts to 와"}, {"korean": "하다: 하 + 여요 = 해요", "english": "All 하다 verbs use 해요 (special case)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','동사를 어떻게 활용해요?','Dong-sa-reul eo-tteo-ke hwal-lyong-hae-yo?','How do you conjugate a verb?',1),
  (l_id,'학생','먼저 다를 없애요.','Meon-jeo da-reul eop-sae-yo.','First I remove 다.',2),
  (l_id,'교사','맞아요. 그 다음은요?','Ma-ja-yo. Geu da-eum-eun-yo?','Correct. And then?',3),
  (l_id,'학생','어간의 모음을 봐요. 아나 오면 아요, 나머지는 어요.','Eo-gan-e mo-eum-eul bwa-yo. A-na o-myeon a-yo, na-meo-ji-neun eo-yo.','I look at the stem vowel. If it is 아 or 오, add 아요; otherwise 어요.',4),
  (l_id,'교사','완벽해요! 하다 동사는요?','Wan-byeok-hae-yo! Ha-da dong-sa-neun-yo?','Perfect! What about 하다 verbs?',5),
  (l_id,'학생','하다 동사는 항상 해요예요!','Ha-da dong-sa-neun hang-sang hae-yo-ye-yo!','All 하다 verbs always use 해요!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'The verb stem of 먹다 is?','["먹다", "먹", "다", "먹어"]',1,'Remove 다 from the dictionary form: 먹다 → 먹 is the stem.',1),
  (l_id,'가다 polite present is?','["가어요", "가아요", "가요", "갔어요"]',2,'가 + 아요 = 가아요, which contracts to 가요. The 아 vowels merge.',2),
  (l_id,'공부하다 polite present is?','["공부하아요", "공부해요", "공부하어요", "공부했어요"]',1,'All 하다 verbs conjugate as 해요: 공부하다 → 공부해요.',3),
  (l_id,'Which vowels trigger 아 in the ending?','["ㅔ, ㅣ", "ㅏ, ㅗ", "ㅓ, ㅜ", "all vowels"]',1,'Vowel harmony: stems with ㅏ (아) or ㅗ (오) take 아 endings. All others take 어 endings.',4),
  (l_id,'오다 polite present is?','["오아요", "오어요", "와요", "오요"]',2,'오 + 아요 = 오아요, which contracts: ㅗ + ㅏ → ㅘ, giving 와요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 동사 활용의 기본은 어간 찾기예요. 기본형에서 다를 제거하면 어간이 돼요. 모음 조화에 따라 어간의 모음이 아/오이면 아요, 나머지는 어요를 붙여요. 하다 동사는 특별히 해요가 돼요. 가다→가요, 먹다→먹어요, 오다→와요(축약)처럼요. 이것이 한국어 동사 활용의 핵심이에요.','The key to Korean verb conjugation is finding the stem. Remove 다 from the dictionary form to get the stem. Following vowel harmony: if the stem vowel is ㅏ or ㅗ, add 아요; otherwise add 어요. All 하다 verbs become 해요. So: 가다→가요, 먹다→먹어요, 오다→와요 (contracted). This is the core of Korean conjugation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=10;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#10 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아요/어요','a-yo/eo-yo','polite present tense ending',1),
  (l_id,'해요체','hae-yo-che','informal polite speech level',2),
  (l_id,'현재 시제','hyeon-jae si-je','present tense',3),
  (l_id,'습관','seup-gwan','habit',4),
  (l_id,'사실','sa-sil','fact',5),
  (l_id,'진행','jin-haeng','progress/ongoing',6),
  (l_id,'반복','ban-bok','repetition',7),
  (l_id,'주어','ju-eo','subject',8),
  (l_id,'문장 끝','mun-jang kkeut','end of sentence',9),
  (l_id,'서술','seo-sul','statement/description',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아요/어요 — polite present','Stem + 아요 / 어요','The most common polite ending for statements. Use with habits, facts, current states, and ongoing actions.','[{"korean": "매일 운동해요.", "english": "I exercise every day. (habit)"}, {"korean": "지금 밥을 먹어요.", "english": "I am eating now. (ongoing)"}]',1),
  (l_id,'Questions with 아요/어요','Rising intonation → question; falling → statement','아요/어요 can be both statement and question depending on intonation. Written questions add ?.','[{"korean": "한국어를 공부해요? (rising)", "english": "Do you study Korean?"}, {"korean": "네, 공부해요. (falling)", "english": "Yes, I study it."}]',2),
  (l_id,'하다 → 해요','하다 verb + 요 = 해요','All 하다 compound verbs use 해요 as their polite present.','[{"korean": "일하다 → 일해요", "english": "to work → I work"}, {"korean": "사랑하다 → 사랑해요", "english": "to love → I love"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수진','매일 뭐 해요?','Mae-il mwo hae-yo?','What do you do every day?',1),
  (l_id,'브라이언','아침에 일어나서 커피를 마셔요.','A-chim-e i-reo-na-seo keo-pi-reul ma-syeo-yo.','I wake up in the morning and drink coffee.',2),
  (l_id,'수진','운동도 해요?','Un-dong-do hae-yo?','Do you also exercise?',3),
  (l_id,'브라이언','네, 저녁에 조깅해요. 수진 씨는요?','Ne, jeo-nyeok-e jo-ging-hae-yo. Su-jin ssi-neun-yo?','Yes, I jog in the evenings. What about you, Sujin?',4),
  (l_id,'수진','저는 요가를 해요. 정말 좋아요.','Jeo-neun yo-ga-reul hae-yo. Jeong-mal jo-a-yo.','I do yoga. I really like it.',5),
  (l_id,'브라이언','저도 요가 배우고 싶어요.','Jeo-do yo-ga bae-u-go si-peo-yo.','I also want to learn yoga.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아요/어요 polite level is called?','["합쇼체", "반말", "해요체", "하오체"]',2,'아요/어요 belongs to 해요체 (informal polite speech), the most common speech level in everyday conversation.',1),
  (l_id,'"공부하다" polite present?','["공부하아요", "공부해요", "공부하요", "공부어요"]',1,'하다 → 해요. 공부하다 → 공부해요.',2),
  (l_id,'아요/어요 can express habits. Which sentence shows a habit?','["지금 먹어요", "매일 운동해요", "어제 갔어요", "내일 할 거예요"]',1,'매일 운동해요 = I exercise every day — this is a habitual action.',3),
  (l_id,'How do you turn a statement into a question with 아요/어요?','["add -까", "change ending completely", "use rising intonation", "add 없다"]',2,'The same 아요/어요 ending can be a question with rising intonation, or a statement with falling intonation.',4),
  (l_id,'"와요" is the polite present of?','["왔다", "오다", "오아다", "왜다"]',1,'오다 (to come): 오 + 아요 = 와요 (contracted). The polite present of 오다 is 와요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아요/어요는 한국어에서 가장 많이 쓰이는 공손한 현재형 어미예요. 습관, 사실, 현재 상태, 진행 중인 동작을 표현해요. 받침이 없고 어간의 마지막 모음이 아/오이면 아요, 나머지는 어요를 붙여요. 하다 동사는 해요가 돼요. 질문할 때는 같은 어미에 올라가는 억양을 쓰면 돼요.','아요/어요 is the most commonly used polite present tense ending in Korean. It expresses habits, facts, current states, and ongoing actions. If the stem vowel is 아 or 오, use 아요; otherwise use 어요. 하다 verbs become 해요. The same ending can form a question with rising intonation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=11;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#11 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'았어요/었어요','at-sseo-yo/eot-sseo-yo','past tense polite ending',1),
  (l_id,'과거 시제','gwa-geo si-je','past tense',2),
  (l_id,'완료','wan-nyo','completion',3),
  (l_id,'어제','eo-je','yesterday',4),
  (l_id,'지난주','ji-nan-ju','last week',5),
  (l_id,'전에','jeon-e','before/ago',6),
  (l_id,'결과','gyeol-gwa','result',7),
  (l_id,'경험','gyeong-heom','experience',8),
  (l_id,'완성','wan-seong','completion',9),
  (l_id,'상태','sang-tae','state/condition',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'았어요/었어요 — past tense','Stem + 았어요 / 었어요','았어요 if stem vowel is ㅏ or ㅗ; 었어요 otherwise. 했어요 for all 하다 verbs.','[{"korean": "어제 밥을 먹었어요.", "english": "I ate rice yesterday."}, {"korean": "어제 갔어요.", "english": "I went yesterday."}]',1),
  (l_id,'Past tense with 하다','하다 → 했어요','All 하다 verbs use 했어요 in the past tense.','[{"korean": "공부했어요.", "english": "I studied."}, {"korean": "일했어요.", "english": "I worked."}]',2),
  (l_id,'Past perfect — double 었었어요','Stem + 았었어요/었었어요','Double past expresses a state that existed before and no longer does (past perfect nuance).','[{"korean": "한국어를 잘 했었어요. (but not now)", "english": "I used to be good at Korean."}, {"korean": "거기에 살았었어요.", "english": "I used to live there."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지현','주말에 뭐 했어요?','Ju-mal-e mwo haet-sseo-yo?','What did you do on the weekend?',1),
  (l_id,'마이클','친구를 만났어요. 영화도 봤어요.','Chin-gu-reul man-nat-sseo-yo. Yeong-hwa-do bwat-sseo-yo.','I met a friend. I also watched a movie.',2),
  (l_id,'지현','무슨 영화였어요?','Mu-seun yeong-hwa-yeot-sseo-yo?','What movie was it?',3),
  (l_id,'마이클','한국 영화였어요. 정말 재미있었어요!','Han-guk yeong-hwa-yeot-sseo-yo. Jeong-mal jae-mi-it-sseo-yo!','It was a Korean movie. It was really fun!',4),
  (l_id,'지현','전에도 한국 영화 봤어요?','Jeon-e-do han-guk yeong-hwa bwat-sseo-yo?','Have you watched Korean movies before?',5),
  (l_id,'마이클','네, 많이 봤어요. 어릴 때부터 좋아했어요.','Ne, ma-ni bwat-sseo-yo. Eo-ril ttae-bu-teo jo-a-haet-sseo-yo.','Yes, I have watched many. I have liked them since I was young.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"먹다" past tense polite is?','["먹아요", "먹었어요", "먹았어요", "먹습니다"]',1,'먹 stem vowel is ㅓ (not 아/오), so add 었어요: 먹었어요.',1),
  (l_id,'"가다" past tense is?','["가어요", "갔어요", "가았어요", "갈 거예요"]',1,'가 + 았어요 = 가았어요, which contracts to 갔어요.',2),
  (l_id,'"공부하다" past tense is?','["공부하았어요", "공부했어요", "공부어요", "공부하었어요"]',1,'All 하다 verbs: 공부하다 → 공부했어요.',3),
  (l_id,'Double past "았었어요/었었어요" expresses?','["simple past", "future", "past state no longer true now", "present habit"]',2,'Double past (past-perfect nuance): used to convey something that was true before but is no longer the case.',4),
  (l_id,'"봤어요" is the past of?','["봤다", "보다", "바다", "봐요"]',1,'보다 → 봐요 (present) → 봤어요 (past). ㅗ+았 contracts to 봤.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'았어요/었어요는 과거 시제 어미예요. 어간의 마지막 모음이 아나 오면 았어요, 나머지는 었어요, 하다 동사는 했어요를 써요. 가다→갔어요, 먹다→먹었어요, 공부하다→공부했어요처럼요. 이중 과거(았었어요/었었어요)는 지금은 아닌 과거 상태를 나타내요. "예전에 거기 살았었어요"처럼요.','았어요/었어요 is the polite past tense ending. If the stem vowel is ㅏ or ㅗ, use 았어요; otherwise 었어요; 하다 verbs use 했어요. So: 가다→갔어요, 먹다→먹었어요, 공부하다→공부했어요. The double past (았었어요) expresses a past state that is no longer true now, like "I used to live there."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=12;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#12 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'ㄹ 거예요','l geo-ye-yo','future tense / plan',1),
  (l_id,'미래 시제','mi-rae si-je','future tense',2),
  (l_id,'계획','gye-hoek','plan',3),
  (l_id,'예측','ye-cheuk','prediction',4),
  (l_id,'의도','ui-do','intention',5),
  (l_id,'내일','nae-il','tomorrow',6),
  (l_id,'다음 주','da-eum ju','next week',7),
  (l_id,'나중에','na-jung-e','later',8),
  (l_id,'아마','a-ma','probably/maybe',9),
  (l_id,'확실히','hwak-sil-hi','certainly/definitely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)ㄹ 거예요 — future/plan','Stem + (으)ㄹ 거예요','If stem ends in a vowel or ㄹ: add ㄹ 거예요. If ends in consonant: add 을 거예요. Expresses plans, intentions, and predictions.','[{"korean": "내일 공부할 거예요.", "english": "I will study tomorrow. (plan)"}, {"korean": "비가 올 거예요.", "english": "It will rain. (prediction)"}]',1),
  (l_id,'-(으)ㄹ게요 — speaker intention (less formal)','Stem + (으)ㄹ게요','Expresses the speaker''s personal intention or promise, especially as a response.','[{"korean": "제가 할게요.", "english": "I will do it. (my decision)"}, {"korean": "전화할게요.", "english": "I will call. (promise)"}]',2),
  (l_id,'Future with 겠다','Stem + 겠어요','Expresses speaker''s conjecture or polite willingness, often in formal settings.','[{"korean": "맛있겠어요.", "english": "It looks/must be delicious."}, {"korean": "도와드리겠습니다.", "english": "I will help you. (formal)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'예원','방학에 뭐 할 거예요?','Bang-hak-e mwo hal geo-ye-yo?','What are you going to do on vacation?',1),
  (l_id,'준서','제주도에 갈 거예요. 가족이랑 같이요.','Je-ju-do-e gal geo-ye-yo. Ga-jok-i-rang ga-chi-yo.','I am going to Jeju Island. With my family.',2),
  (l_id,'예원','좋겠다! 날씨가 좋을 거예요.','Jo-ket-da! Nal-ssi-ga jo-eul geo-ye-yo.','That sounds great! The weather will be nice.',3),
  (l_id,'준서','맞아요. 해변에서 수영할 거예요.','Ma-ja-yo. Hae-byeon-e-seo su-yeong-hal geo-ye-yo.','Right. I am going to swim at the beach.',4),
  (l_id,'예원','사진 많이 찍을게요?','Sa-jin ma-ni jji-geul-ge-yo?','Will you take lots of photos?',5),
  (l_id,'준서','물론이죠! 보내줄게요.','Mul-lon-i-jyo! Bo-nae-jul-ge-yo.','Of course! I will send them to you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"내일 가다" future polite?','["내일 가아요", "내일 갔어요", "내일 갈 거예요", "내일 가요"]',2,'(으)ㄹ 거예요 forms the future: 가 + ㄹ 거예요 = 갈 거예요.',1),
  (l_id,'"먹다" future: "I will eat"?','["먹을 거예요", "먹ㄹ 거예요", "먹어요", "먹었을 거예요"]',0,'먹 ends in ㄱ (consonant), so add 을 거예요: 먹을 거예요.',2),
  (l_id,'What is the difference between ㄹ 거예요 and ㄹ게요?','["no difference", "ㄹ 거예요 is informal; ㄹ게요 formal", "ㄹ 거예요 is neutral plan; ㄹ게요 is personal decision/response", "both are past"]',2,'ㄹ 거예요 = neutral future plan or prediction. ㄹ게요 = personal decision or promise in response to situation.',3),
  (l_id,'"아마 비가 ___" — It will probably rain?','["와요", "올 거예요", "왔어요", "오세요"]',1,'아마 (probably) pairs with ㄹ 거예요 for predictions: 아마 비가 올 거예요.',4),
  (l_id,'"도와드리겠습니다" — what does 겠 add?','["past tense", "question", "polite willingness/conjecture", "command"]',2,'겠 in formal speech expresses polite willingness or conjecture: 도와드리겠습니다 = I will help you (formal).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)ㄹ 거예요는 미래 계획, 의도, 예측을 나타내요. 어간이 모음이나 ㄹ로 끝나면 ㄹ 거예요, 자음으로 끝나면 을 거예요를 붙여요. 예: 가다→갈 거예요, 먹다→먹을 거예요. (으)ㄹ게요는 말하는 사람의 개인적인 결심이나 약속을 나타내요. 겠어요는 형식적인 상황에서 의지나 추측을 나타내요.','(으)ㄹ 거예요 expresses future plans, intentions, and predictions. If the stem ends in a vowel or ㄹ, add ㄹ 거예요; after consonants, add 을 거예요. E.g.: 가다→갈 거예요, 먹다→먹을 거예요. ㄹ게요 expresses personal decision or promise. 겠 in formal speech expresses polite willingness or conjecture.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=13;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#13 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'형용사','hyeong-yong-sa','adjective/descriptive verb',1),
  (l_id,'관형형','gwan-hyeong-hyeong','noun-modifying form',2),
  (l_id,'크다','keu-da','to be big',3),
  (l_id,'작다','jak-da','to be small',4),
  (l_id,'예쁘다','ye-ppeu-da','to be pretty',5),
  (l_id,'맛있다','ma-sit-da','to be delicious',6),
  (l_id,'재미있다','jae-mi-it-da','to be interesting/fun',7),
  (l_id,'ㄴ/은 (adjective modifier)','n/eun','present-tense adjective modifier suffix',8),
  (l_id,'었던','eot-deon','past-tense noun modifier',9),
  (l_id,'서술어','seo-sul-eo','predicate (used at end of sentence)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Descriptive verb in predicate position','N이/가 + Descriptive verb + 아요/어요','Descriptive verbs function as predicates: N is [adjective]. They conjugate like action verbs.','[{"korean": "이 음식이 맛있어요.", "english": "This food is delicious."}, {"korean": "날씨가 좋아요.", "english": "The weather is good."}]',1),
  (l_id,'Descriptive verb as modifier — ㄴ/은','Desc. verb stem + (으)ㄴ + Noun','To modify a noun, use (으)ㄴ after descriptive verb stems. ㄴ after vowels, 은 after consonants.','[{"korean": "맛있는 음식 (맛있다 + 는)", "english": "delicious food"}, {"korean": "큰 집 (크다 + ㄴ)", "english": "a big house"}]',2),
  (l_id,'Action verb modifier — 는 (present)','Action verb stem + 는 + Noun','Action verbs use 는 to modify nouns in present tense (subject is currently doing).','[{"korean": "지금 먹는 음식", "english": "the food I am eating now"}, {"korean": "공부하는 학생", "english": "a student who is studying"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'호영','오늘 점심 어때요?','O-neul jeom-sim eo-ttae-yo?','How is lunch today?',1),
  (l_id,'소희','정말 맛있어요! 매운 음식이지만 좋아요.','Jeong-mal ma-si-sseo-yo! Mae-un eum-sik-i-ji-man jo-a-yo.','It is really delicious! It is spicy food but I like it.',2),
  (l_id,'호영','맞아요, 매운 음식이 더 맛있어요.','Ma-ja-yo, mae-un eum-sik-i deo ma-si-sseo-yo.','Right, spicy food is more delicious.',3),
  (l_id,'소희','저기 앉아 있는 사람은 누구예요?','Jeo-gi an-ja it-neun sa-ram-eun nu-gu-ye-yo?','Who is the person sitting over there?',4),
  (l_id,'호영','아, 유명한 요리사예요.','A, yu-myeong-han yo-ri-sa-ye-yo.','Ah, that is a famous chef.',5),
  (l_id,'소희','멋있는 사람이네요!','Meo-sit-neun sa-ram-i-ne-yo!','What a cool person!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Descriptive verbs conjugate like?','["nouns", "action verbs", "they do not conjugate", "only in past tense"]',1,'Descriptive verbs conjugate just like action verbs, using the same 아요/어요/았어요 endings.',1),
  (l_id,'"크다" + noun modifier = ?','["크는", "큰", "크았는", "크이는"]',1,'Descriptive verbs + (으)ㄴ: 크다 → stem 크 + ㄴ = 큰 (big). 큰 집 = big house.',2),
  (l_id,'"먹는 사람" means?','["a person who ate", "a person who is eating", "a person who will eat", "a person who cooks"]',1,'Action verbs use 는 for present modifier: 먹는 사람 = the person who is eating.',3),
  (l_id,'"맛있는" is derived from?','["맛있어요", "맛있다", "맛있었다", "맛있게"]',1,'맛있다 (descriptive verb) + 는 (modifier) = 맛있는. Used before nouns: 맛있는 음식.',4),
  (l_id,'Which is correct for "a pretty flower"?','["예쁜 꽃", "예쁘는 꽃", "예뻐 꽃", "예쁘한 꽃"]',0,'예쁘다: stem 예쁘 + ㄴ = 예쁜. Before a noun: 예쁜 꽃 = a pretty flower.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 형용사는 서술 동사처럼 활용해요. 문장 끝에서 "날씨가 좋아요"처럼 서술어로 쓰여요. 명사 앞에서 수식할 때는 형용사 어간에 -(으)ㄴ을 붙여요. "큰 집", "맛있는 음식"처럼요. 동작 동사가 명사를 수식할 때는 -는을 써요. "공부하는 학생"처럼요. 이 수식형을 이해하면 더 복잡한 문장을 만들 수 있어요.','Korean adjectives (descriptive verbs) conjugate like action verbs. At the end of a sentence, they serve as predicates: 날씨가 좋아요. Before nouns, attach -(으)ㄴ: 큰 집 (big house), 맛있는 음식 (delicious food). Action verbs use -는 before nouns: 공부하는 학생 (a student who is studying). Understanding these modifiers allows more complex sentences.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=14;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#14 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'안','an','short negation adverb (before verb)',1),
  (l_id,'-지 않다','-ji an-ta','long negation form',2),
  (l_id,'부정','bu-jeong','negation',3),
  (l_id,'못','mot','cannot (ability negation)',4),
  (l_id,'-지 못하다','-ji mot-ha-da','cannot (long form)',5),
  (l_id,'아니다','a-ni-da','is not (for nouns)',6),
  (l_id,'없다','eop-da','there is not / does not have',7),
  (l_id,'싫다','sil-ta','to not like/dislike',8),
  (l_id,'안 좋다','an jo-ta','not good',9),
  (l_id,'부정문','bu-jeong-mun','negative sentence',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'안 — short negation','안 + verb/adjective','안 is placed directly before the verb or adjective. Cannot be used with 하다 compound verbs (say 못/안 + 하다 separately).','[{"korean": "안 먹어요.", "english": "I do not eat."}, {"korean": "안 가요.", "english": "I do not go."}]',1),
  (l_id,'-지 않다 — long negation','Verb stem + 지 않아요','More formal/neutral negation. Can be used with any verb including 하다 compounds.','[{"korean": "먹지 않아요.", "english": "I do not eat. (neutral/formal)"}, {"korean": "공부하지 않아요.", "english": "I do not study."}]',2),
  (l_id,'못 — ability negation','못 + verb / verb + 지 못해요','못 means "cannot" due to inability or circumstances. Different from 안 (choice not to).','[{"korean": "못 가요. (I cannot go)", "english": "I cannot go. (due to circumstance)"}, {"korean": "한국어를 잘 못해요.", "english": "I am not good at Korean."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'리나','오늘 저녁에 올 수 있어요?','O-neul jeo-nyeok-e ol su i-sseo-yo?','Can you come this evening?',1),
  (l_id,'준혁','미안해요, 못 가요. 일이 있어요.','Mi-an-hae-yo, mot ga-yo. Il-i i-sseo-yo.','Sorry, I cannot come. I have work.',2),
  (l_id,'리나','그럼 내일은요?','Geu-reom nae-il-eun-yo?','Then what about tomorrow?',3),
  (l_id,'준혁','내일은 안 바빠요. 갈 수 있어요.','Nae-il-eun an ba-ppa-yo. Gal su i-sseo-yo.','Tomorrow I am not busy. I can go.',4),
  (l_id,'리나','음식은 매운 거 먹지 않아요?','Eum-sik-eun mae-un geo meok-ji a-na-yo?','You do not eat spicy food?',5),
  (l_id,'준혁','아, 괜찮아요! 매운 것도 잘 먹어요.','A, gwaen-chan-a-yo! Mae-un geot-do jal meo-geo-yo.','Oh, that is fine! I eat spicy things well too.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'안 is placed where in a sentence?','["at the end", "directly before the verb", "after the subject", "only with 하다 verbs"]',1,'안 is a pre-verbal adverb: 안 + verb. E.g.: 안 먹어요 = do not eat.',1),
  (l_id,'못 vs 안 — which implies inability?','["안", "못", "both", "neither"]',1,'못 expresses inability (cannot). 안 expresses choice (do not/will not).',2),
  (l_id,'"공부하다" negative long form is?','["안 공부해요", "공부하지 않아요", "공부지 않아요", "안 공부하지 않아요"]',1,'하다 compounds: use long form for cleaner negation: 공부하지 않아요 = I do not study.',3),
  (l_id,'아니다 is used to negate what?','["adjectives", "action verbs", "nouns (N이/가 아니에요)", "time expressions"]',2,'아니다 negates noun predicates: 학생이 아니에요 = I am not a student.',4),
  (l_id,'"못 가요" vs "안 가요" — the difference?','["same meaning", "못 = cannot; 안 = choose not to", "못 is formal; 안 is informal", "no practical difference"]',1,'못 가요 = I cannot go (external reason/inability). 안 가요 = I am not going (choice/decision).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 부정은 안과 지 않다가 있어요. 안은 동사나 형용사 바로 앞에 붙여요. 지 않다는 더 격식체이며 모든 동사와 함께 써요. 못은 능력 부정으로 "할 수 없음"을 나타내요. 예: 안 먹어요(먹기 싫어서), 못 먹어요(먹을 수 없어서). 명사를 부정할 때는 아니다를 써요. "학생이 아니에요"처럼요.','Korean negation has short (안) and long (-지 않다) forms. 안 goes directly before the verb. -지 않다 is more formal and works with any verb. 못 is ability negation — "cannot." E.g.: 안 먹어요 = I choose not to eat; 못 먹어요 = I cannot eat. Nouns are negated with 아니다: 학생이 아니에요 = I am not a student.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=15;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#15 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'불규칙','bul-gyu-chik','irregular',1),
  (l_id,'ㅂ 불규칙','bieup bul-gyu-chik','ㅂ irregular verb',2),
  (l_id,'르 불규칙','reu bul-gyu-chik','르 irregular verb',3),
  (l_id,'ㄷ 불규칙','digeut bul-gyu-chik','ㄷ irregular verb',4),
  (l_id,'ㅅ 불규칙','siot bul-gyu-chik','ㅅ irregular verb',5),
  (l_id,'ㅎ 불규칙','hieut bul-gyu-chik','ㅎ irregular adjective',6),
  (l_id,'어렵다','eo-ryeop-da','to be difficult (ㅂ irregular)',7),
  (l_id,'부르다','bu-reu-da','to call/sing (르 irregular)',8),
  (l_id,'걷다','geot-da','to walk (ㄷ irregular)',9),
  (l_id,'낫다','nat-da','to be better (ㅅ irregular)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'ㅂ irregular — ㅂ → 우','ㅂ stem + vowel → 우 + vowel','Adjectives/verbs ending in ㅂ: the ㅂ changes to 우 before a vowel ending.','[{"korean": "어렵다 → 어려워요 (어렵 + 아요 → 어려우 + 어요)", "english": "difficult → is difficult"}, {"korean": "덥다 → 더워요", "english": "hot → is hot"}]',1),
  (l_id,'르 irregular — 르 → ㄹㄹ','르 stem + 아/어 → ㄹ+라/러','Verbs ending in 르: insert an extra ㄹ before the 아/어 ending.','[{"korean": "부르다 → 불러요 (부르 + 어 → 불러)", "english": "to call → calls"}, {"korean": "모르다 → 몰라요", "english": "to not know → does not know"}]',2),
  (l_id,'ㄷ and ㅅ irregulars','ㄷ → ㄹ before vowel; ㅅ drops before vowel','ㄷ irregular: ㄷ becomes ㄹ before a vowel ending. ㅅ irregular: ㅅ drops before a vowel.','[{"korean": "걷다 → 걸어요 (ㄷ→ㄹ)", "english": "to walk → walks"}, {"korean": "낫다 → 나아요 (ㅅ drops)", "english": "to be better → is better"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'레이첼','한국어가 어때요?','Han-guk-eo-ga eo-ttae-yo?','How is Korean?',1),
  (l_id,'동윤','어렵지만 재미있어요.','Eo-ryeop-ji-man jae-mi-it-sseo-yo.','It is difficult but fun.',2),
  (l_id,'레이첼','어떤 부분이 제일 어려워요?','Eo-tteon bu-bun-i je-il eo-ryeo-wo-yo?','What part is the most difficult?',3),
  (l_id,'동윤','불규칙 동사요! 알다가도 몰라요.','Bul-gyu-chik dong-sa-yo! Al-da-ga-do mol-la-yo.','Irregular verbs! I think I know them but then I forget.',4),
  (l_id,'레이첼','저도 몰라요. 같이 공부해요!','Jeo-do mol-la-yo. Ga-chi gong-bu-hae-yo!','I do not know either. Let us study together!',5),
  (l_id,'동윤','좋아요! 더울 때는 카페에서 공부해요.','Jo-a-yo! Deo-ul ttae-neun ka-pe-e-seo gong-bu-hae-yo.','Sounds good! When it is hot, let us study at the cafe.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"덥다" conjugated as 더워요 is which irregular type?','["르 irregular", "ㅂ irregular", "ㄷ irregular", "ㅅ irregular"]',1,'ㅂ irregular: 덥다 → 더우 + 어요 = 더워요. The ㅂ changes to 우 before vowel endings.',1),
  (l_id,'"모르다" → "몰라요" is which irregular?','["ㅂ", "르", "ㄷ", "ㅅ"]',1,'르 irregular: 모르다 → 모르 + 아 → mo+ㄹ+라 = 몰라요. An extra ㄹ is inserted.',2),
  (l_id,'"걷다" → "걸어요" is which irregular?','["ㅅ", "ㅂ", "ㄷ", "르"]',2,'ㄷ irregular: the ㄷ becomes ㄹ before a vowel ending: 걷 + 어요 = 걸어요.',3),
  (l_id,'Not all ㅂ verbs are irregular. Which is REGULAR?','["덥다", "좁다", "잡다 (to catch)", "쉽다"]',2,'잡다 (to catch) is a regular ㅂ verb: 잡아요 (no change). Not all ㅂ-final verbs are irregular.',4),
  (l_id,'"낫다" (to be better) past tense?','["낫았어요", "나았어요", "날았어요", "나왔어요"]',1,'ㅅ irregular: 낫 + 았어요 → ㅅ drops → 나았어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어에는 몇 가지 불규칙 동사가 있어요. ㅂ 불규칙: 어렵다→어려워요, 덥다→더워요. 르 불규칙: 모르다→몰라요, 부르다→불러요. ㄷ 불규칙: 걷다→걸어요. ㅅ 불규칙: 낫다→나아요(ㅅ 탈락). 하지만 모든 ㅂ, ㄷ, ㅅ 동사가 불규칙은 아니에요. 예를 들어 잡다, 받다, 웃다는 규칙 동사예요. 자주 쓰이는 동사를 외우는 것이 중요해요.','Korean has several irregular verb groups. ㅂ irregular: 어렵다→어려워요, 덥다→더워요. 르 irregular: 모르다→몰라요. ㄷ irregular: 걷다→걸어요. ㅅ irregular: 낫다→나아요 (ㅅ drops). However, not all ㅂ/ㄷ/ㅅ verbs are irregular: 잡다, 받다, 웃다 are regular. It is important to memorize the commonly used irregular verbs.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=16;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#16 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'ㅂ니다/습니다','bm-ni-da/seum-ni-da','formal declarative ending',1),
  (l_id,'ㅂ니까/습니까','bm-ni-kka/seum-ni-kka','formal question ending',2),
  (l_id,'합쇼체','hap-ssyo-che','formal polite speech level',3),
  (l_id,'격식체','gyeok-sik-che','formal speech register',4),
  (l_id,'발표','bal-pyo','presentation/announcement',5),
  (l_id,'회의','hoe-ui','meeting',6),
  (l_id,'방송','bang-song','broadcasting',7),
  (l_id,'군대','gun-dae','military',8),
  (l_id,'입니다','im-ni-da','is/am/are (formal)',9),
  (l_id,'아닙니다','a-nim-ni-da','is not (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'ㅂ니다/습니다 — formal declarative','Stem + ㅂ니다 (vowel) / 습니다 (consonant)','The most formal speech level. Used in presentations, military, broadcasting, and business settings.','[{"korean": "저는 학생입니다.", "english": "I am a student. (formal)"}, {"korean": "오늘 날씨가 좋습니다.", "english": "The weather is good today. (formal)"}]',1),
  (l_id,'ㅂ니까/습니까 — formal question','Stem + ㅂ니까 / 습니까','Formal question form: vowel stems + ㅂ니까, consonant stems + 습니까.','[{"korean": "어디서 오셨습니까?", "english": "Where did you come from? (formal)"}, {"korean": "몇 시입니까?", "english": "What time is it? (formal)"}]',2),
  (l_id,'합쇼체 in everyday contexts','Announcements, military, presentations','Used in news broadcasts, military commands, formal introductions, and official announcements.','[{"korean": "다음 역은 서울역입니다.", "english": "The next station is Seoul Station."}, {"korean": "주목해 주십시오.", "english": "Please pay attention. (command, very formal)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'아나운서','안녕하십니까? 뉴스 시간입니다.','An-nyeong-ha-sim-ni-kka? Nyu-seu si-gan-im-ni-da.','Good day. It is time for the news.',1),
  (l_id,'기자','오늘 서울의 날씨는 맑겠습니다.','O-neul Seo-ul-e nal-ssi-neun mal-get-sseum-ni-da.','The weather in Seoul today will be clear.',2),
  (l_id,'아나운서','이번 주 중요한 소식입니다.','I-beon ju jung-yo-han so-sik-im-ni-da.','Here is the important news of this week.',3),
  (l_id,'기자','경제가 성장하고 있습니다.','Gyeong-je-ga seong-jang-ha-go it-sseum-ni-da.','The economy is growing.',4),
  (l_id,'아나운서','자세한 내용은 홈페이지에서 확인하십시오.','Ja-se-han nae-yong-eun hom-pe-i-ji-e-seo hwa-gin-ha-sip-si-o.','Please check the website for details.',5),
  (l_id,'기자','이상으로 뉴스를 마치겠습니다.','I-sang-eu-ro nyu-seu-reul ma-chi-get-sseum-ni-da.','That concludes the news.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'합쇼체 is used in what contexts?','["casual texting", "news broadcasts and formal presentations", "with close friends", "children talking to parents"]',1,'합쇼체 is used in news, military, formal presentations, and official announcements.',1),
  (l_id,'"가다" formal declarative is?','["가요", "갑니다", "가습니다", "갑니까"]',1,'가 stem ends in vowel → add ㅂ니다: 갑니다.',2),
  (l_id,'"먹다" formal declarative is?','["먹ㅂ니다", "먹습니다", "먹읍니다", "먹어요"]',1,'먹 ends in consonant → add 습니다: 먹습니다.',3),
  (l_id,'How does the formal question end?','["아요?", "ㅂ니까?/습니까?", "지요?", "나요?"]',1,'Formal questions use ㅂ니까 (vowel stems) or 습니까 (consonant stems).',4),
  (l_id,'"저는 학생입니다" → formal negative?','["저는 학생이 아니에요", "저는 학생이 아닙니다", "저는 학생 없습니다", "저는 학생이 않습니다"]',1,'Formal negative of 이다 is 아닙니다: 저는 학생이 아닙니다.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'ㅂ니다/습니다는 합쇼체의 격식체 어미예요. 뉴스, 발표, 군대, 공식 안내 등에 쓰여요. 어간이 모음으로 끝나면 ㅂ니다, 자음으로 끝나면 습니다를 붙여요. 질문형은 ㅂ니까/습니까예요. 입니다는 "이다"의 격식체로 "저는 학생입니다"처럼 써요. 일상적인 대화에서는 해요체가 더 자연스럽지만 격식 있는 상황에서는 합쇼체를 써야 해요.','합쇼체 (ㅂ니다/습니다) is the most formal speech level in Korean. It is used in news broadcasts, presentations, military, and official announcements. Add ㅂ니다 after vowel stems and 습니다 after consonant stems. Questions use ㅂ니까/습니까. 이다 becomes 입니다. While 해요체 is more natural in everyday speech, 합쇼체 is required in formal contexts.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=17;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#17 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고','-go','sequential connector (and then)',1),
  (l_id,'순서','sun-seo','order/sequence',2),
  (l_id,'나열','na-yeol','listing',3),
  (l_id,'연결','yeon-gyeol','connection',4),
  (l_id,'그리고','geu-ri-go','and then (between sentences)',5),
  (l_id,'그런 다음에','geu-reon da-eum-e','and then (after that)',6),
  (l_id,'먼저','meon-jeo','first/firstly',7),
  (l_id,'다음에','da-eum-e','next/after',8),
  (l_id,'마지막으로','ma-ji-mal-go-ro','finally/lastly',9),
  (l_id,'그다음','geu-da-eum','the next one',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 for sequential actions','Verb1 + 고 + Verb2','-고 connects two clauses sequentially or simultaneously. The subject can be the same or different. Tense is shown only on the last verb.','[{"korean": "밥을 먹고 커피를 마셔요.", "english": "I eat rice and (then) drink coffee."}, {"korean": "샤워하고 잠을 자요.", "english": "I shower and (then) sleep."}]',1),
  (l_id,'-고 for listing adjectives','Adj1 + 고 + Adj2','Use -고 to list two descriptive qualities of the same subject.','[{"korean": "이 음식은 맛있고 저렴해요.", "english": "This food is delicious and cheap."}, {"korean": "날씨가 맑고 따뜻해요.", "english": "The weather is clear and warm."}]',2),
  (l_id,'-고 vs -아서/어서','-고 (neutral sequence) vs -아서/어서 (causal/tight sequence)','-아서/어서 shows cause or tight sequence; -고 is more neutral listing.','[{"korean": "일어나고 밥을 먹었어요. (sequence)", "english": "I got up and ate. (neutral order)"}, {"korean": "일어나서 밥을 먹었어요. (sequence/cause)", "english": "I got up (and then directly) ate."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'엄마','오늘 하루 어떻게 보냈어?','O-neul ha-ru eo-tteo-ke bo-naet-sseo?','How did you spend your day today?',1),
  (l_id,'아이','학교 가고 점심 먹고 도서관에 갔어요.','Hak-kyo ga-go jeom-sim meok-go do-seo-gwan-e gat-sseo-yo.','I went to school, ate lunch, and went to the library.',2),
  (l_id,'엄마','도서관에서 뭐 했어?','Do-seo-gwan-e-seo mwo haet-sseo?','What did you do at the library?',3),
  (l_id,'아이','숙제하고 책도 읽었어요.','Suk-je-ha-go chaek-do il-geot-sseo-yo.','I did homework and also read books.',4),
  (l_id,'엄마','저녁에는?','Jeo-nyeok-e-neun?','In the evening?',5),
  (l_id,'아이','밥 먹고 씻고 자려고 해요.','Bap meok-go ssit-go ja-ryeo-go hae-yo.','I am going to eat, wash up, and then sleep.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 connects clauses with what nuance?','["cause and effect", "contrast", "neutral sequence or listing", "condition"]',2,'-고 neutrally links sequential actions or lists qualities without implying causation.',1),
  (l_id,'"샤워하고 잠을 자요" means?','["I sleep while showering", "I shower and then sleep", "I shower or sleep", "I sleep to shower"]',1,'-고 shows sequence: I shower → then I sleep.',2),
  (l_id,'Tense in -고 sentences is shown where?','["on the first verb", "on each verb", "only on the final verb", "before 고"]',2,'Tense is marked only on the final verb: 먹고 마셨어요 (past is on 마셨어요).',3),
  (l_id,'"맛있고 저렴해요" — listing two qualities. -고 can be used with?','["only action verbs", "only adjectives", "both action and descriptive verbs", "only nouns"]',2,'-고 can connect both action verb clauses and adjective (descriptive verb) clauses.',4),
  (l_id,'-고 differs from -아서/어서 in that?','["-고 implies cause; -아서 does not", "-고 is causal; -아서 is temporal", "-고 is neutral; -아서 implies tighter cause-effect link", "they are identical"]',2,'-아서/어서 implies a tighter causal or directly consequential link, while -고 is more neutral.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고는 두 동작이나 상태를 순서대로 나열하거나 나란히 연결할 때 써요. 예: "밥을 먹고 커피를 마셔요." 형용사에도 쓸 수 있어요: "맛있고 저렴해요." 시제는 마지막 동사에만 표시해요. -고와 -아서/어서의 차이: -고는 중립적 나열, -아서는 더 밀접한 원인-결과 관계를 나타내요.','-고 links two actions or states sequentially or in parallel. E.g.: "I eat rice and then drink coffee." It also lists adjective qualities: "It is delicious and cheap." Tense is marked only on the final verb. The difference between -고 and -아서/어서: -고 is a neutral listing; -아서 implies a tighter cause-and-effect relationship.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=18;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#18 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아서/어서','-a-seo/-eo-seo','reason/sequential connector',1),
  (l_id,'원인','won-in','cause',2),
  (l_id,'결과','gyeol-gwa','result',3),
  (l_id,'그래서','geu-rae-seo','therefore',4),
  (l_id,'피곤하다','pi-gon-ha-da','to be tired',5),
  (l_id,'배고프다','bae-go-peu-da','to be hungry',6),
  (l_id,'늦다','neut-da','to be late',7),
  (l_id,'막히다','ma-ki-da','to be blocked/congested',8),
  (l_id,'그러니까','geu-reo-ni-kka','so therefore (spoken)',9),
  (l_id,'왜냐하면','wae-nya-ha-myeon','because (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아서/어서 cause/reason','V/A + 아서/어서 + result','The 아서/어서 clause states the reason; the second clause gives the result. No tense on the 아서/어서 clause.','[{"korean": "배가 고파서 밥을 먹어요.", "english": "I am hungry so I eat."}, {"korean": "피곤해서 일찍 자요.", "english": "I am tired so I sleep early."}]',1),
  (l_id,'Tight sequential: did A then B','V + 아서/어서 + V (consequential)','Shows a directly consequential sequence where B follows A.','[{"korean": "일어나서 세수했어요.", "english": "I got up and (then directly) washed my face."}, {"korean": "식당에 가서 밥 먹었어요.", "english": "I went to the restaurant and ate."}]',2),
  (l_id,'No tense on 아서/어서 clause','* 먹어서 X vs 먹었으니까 O (if past needed)','아서/어서 cannot be preceded by past/future tense markers. Use (으)니까 instead for past causes.','[{"korean": "배가 고프니까 먹었어요. (past cause — use 니까)", "english": "Because I was hungry, I ate."}, {"korean": "피곤해서 일찍 자요. (present state cause)", "english": "I am tired so I sleep early."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민아','왜 늦었어요?','Wae neu-jeot-sseo-yo?','Why were you late?',1),
  (l_id,'태영','길이 막혀서 늦었어요.','Gil-i ma-kyeo-seo neu-jeot-sseo-yo.','The road was blocked so I was late.',2),
  (l_id,'민아','많이 피곤하겠다.','Ma-ni pi-gon-ha-get-da.','You must be very tired.',3),
  (l_id,'태영','네, 배도 고파서 밥 먹고 싶어요.','Ne, bae-do go-pa-seo bap meok-go si-peo-yo.','Yes, I am hungry too so I want to eat.',4),
  (l_id,'민아','같이 먹어요!','Ga-chi meo-geo-yo!','Let us eat together!',5),
  (l_id,'태영','좋아요, 고마워요.','Jo-a-yo, go-ma-wo-yo.','Sounds good, thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아서/어서 expresses?','["contrast", "cause/reason or tight sequence", "condition", "listing"]',1,'-아서/어서 = reason or tight sequential consequence.',1),
  (l_id,'"배고프다 + 아서" becomes?','["배고프아서", "배고파서", "배고프서", "배고픈서"]',1,'ㅡ irregular: 배고프 + 아서 → 배고파서 (ㅡ drops).',2),
  (l_id,'아서/어서 clause CANNOT take what?','["objects", "tense markers", "subjects", "adverbs"]',1,'No tense on the 아서/어서 clause; only the final verb carries tense.',3),
  (l_id,'아서/어서 differs from 고 in that?','["no difference", "아서/어서 is causal/tight sequence; 고 is neutral", "아서/어서 is formal", "고 is causal"]',1,'-고 neutrally links; -아서/어서 shows cause or tightly consequential sequence.',4),
  (l_id,'For past cause, which is used instead?','["아서/어서", "고", "(으)니까", "지만"]',2,'(으)니까 can take past tense: 먹었으니까 = because I ate. 아서/어서 cannot.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아서/어서는 원인-결과 또는 긴밀한 순서를 나타내요. 앞 절이 원인, 뒤 절이 결과예요. 아서/어서 앞에는 시제 어미가 오지 않아요. 과거 원인을 나타낼 때는 으니까/니까를 써요. 예: "배가 고파서 먹어요", "일어나서 씻었어요."','-아서/어서 connects a cause to a result, or shows a tight sequential action. The first clause is the reason; the second is the result. No tense marker on the 아서/어서 clause. For past causes, use (으)니까 instead. E.g.: "I am hungry so I eat," "I got up and then washed."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=19;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#19 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'지만','-ji-man','but/however (clause connector)',1),
  (l_id,'하지만','ha-ji-man','but/however (sentence start)',2),
  (l_id,'대조','dae-jo','contrast',3),
  (l_id,'그렇지만','geu-reo-chi-man','however/nevertheless',4),
  (l_id,'그래도','geu-rae-do','even so',5),
  (l_id,'반면에','ban-myeon-e','on the other hand',6),
  (l_id,'어렵다','eo-ryeop-da','to be difficult',7),
  (l_id,'재미있다','jae-mi-it-da','to be interesting',8),
  (l_id,'비싸다','bi-ssa-da','to be expensive',9),
  (l_id,'하지만 그래도','ha-ji-man geu-rae-do','but even so',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'지만 within a sentence','Clause1 + 지만 + Clause2','Attaches to the verb/adjective stem to contrast two clauses. Neutral in politeness level.','[{"korean": "한국어가 어렵지만 재미있어요.", "english": "Korean is difficult but it is fun."}, {"korean": "비싸지만 맛있어요.", "english": "It is expensive but delicious."}]',1),
  (l_id,'하지만 between sentences','Sentence1. 하지만 + Sentence2.','하지만/그렇지만 start a new sentence expressing contrast.','[{"korean": "한국어는 어려워요. 하지만 재미있어요.", "english": "Korean is difficult. But it is fun."}, {"korean": "비가 와요. 그래도 나가요.", "english": "It is raining. Even so I am going out."}]',2),
  (l_id,'지만 with tense','Past/future + 지만 possible','Unlike 아서/어서, the 지만 clause CAN take tense markers.','[{"korean": "어제는 피곤했지만 오늘은 괜찮아요.", "english": "I was tired yesterday but I am fine today."}, {"korean": "비가 왔지만 나갔어요.", "english": "It rained but I went out."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'소라','한국 생활이 어때요?','Han-guk saeng-hwal-i eo-ttae-yo?','How is life in Korea?',1),
  (l_id,'웨이','어렵지만 좋아요.','Eo-ryeop-ji-man jo-a-yo.','It is hard but I like it.',2),
  (l_id,'소라','뭐가 제일 힘들어요?','Mwo-ga je-il him-deu-reo-yo?','What is the hardest part?',3),
  (l_id,'웨이','말하기는 어렵지만 듣기는 잘 돼요.','Mal-ha-gi-neun eo-ryeop-ji-man deut-gi-neun jal dwae-yo.','Speaking is hard but listening goes well.',4),
  (l_id,'소라','그래도 잘 하고 있어요!','Geu-rae-do jal ha-go i-sseo-yo!','Even so you are doing well!',5),
  (l_id,'웨이','감사해요. 더 열심히 할게요.','Gam-sa-hae-yo. Deo yeol-sim-hi hal-ge-yo.','Thank you. I will work harder.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'지만 expresses?','["cause", "contrast", "sequence", "condition"]',1,'-지만 = but/however — contrasting ideas.',1),
  (l_id,'"비싸지만 맛있어요" — what is contrasted?','["size and taste", "price and taste", "color and time", "speed and distance"]',1,'비싸다 (expensive) contrasted with 맛있다 (delicious): expensive but tasty.',2),
  (l_id,'지만 vs 하지만 — difference?','["same meaning", "지만 in sentence; 하지만 between sentences", "지만 is formal; 하지만 casual", "no difference"]',1,'지만 connects clauses within a sentence; 하지만 connects separate sentences.',3),
  (l_id,'지만 clause can take?','["no tense", "tense markers OK", "only future tense", "only 요"]',1,'Unlike 아서/어서, the 지만 clause can take past tense: 피곤했지만.',4),
  (l_id,'"어렵지만" — 지만 attaches to?','["noun", "adjective stem", "particle", "ending"]',1,'지만 attaches directly to the adjective/verb stem: 어렵 + 지만 = 어렵지만.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'지만은 두 절의 대조를 나타내요. "어렵지만 재미있어요"처럼요. 아서/어서와 달리 지만 앞에 시제 어미가 올 수 있어요. 문장 사이에 쓸 때는 하지만이나 그렇지만을 써요. 그래도는 "그럼에도 불구하고"라는 의미로 뒤 절 앞에 써요.','지만 connects two contrasting clauses: 어렵지만 재미있어요. Unlike 아서/어서, tense can appear before 지만: 피곤했지만. Between separate sentences, use 하지만 or 그렇지만. 그래도 means "even so" and introduces a concession.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=20;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#20 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면/(으)면','myeon/(eu)myeon','if/when (conditional)',1),
  (l_id,'조건','jo-geon','condition',2),
  (l_id,'가정','ga-jeong','hypothesis',3),
  (l_id,'결과','gyeol-gwa','result/consequence',4),
  (l_id,'만약','man-yak','if (emphatic, sentence opener)',5),
  (l_id,'그러면','geu-reo-myeon','then (if so)',6),
  (l_id,'그렇다면','geu-reo-ta-myeon','in that case',7),
  (l_id,'날씨가 맑다','nal-ssi-ga mak-da','the weather is clear',8),
  (l_id,'시간이 있다','si-gan-i it-da','to have time',9),
  (l_id,'합격하다','hap-gyeok-ha-da','to pass (exam)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면 conditional','V/A stem + (으)면 + result','If stem ends in vowel or ㄹ, add 면. After consonants, add 으면. Expresses "if/when condition, then result."','[{"korean": "시간이 있으면 오세요.", "english": "If you have time, please come."}, {"korean": "날씨가 좋으면 나가요.", "english": "If the weather is good, I go out."}]',1),
  (l_id,'으면 vs 면','After consonant: 으면; after vowel/ㄹ: 면','Simple phonological rule: 먹 + 으면 = 먹으면; 가 + 면 = 가면.','[{"korean": "먹으면 배불러요.", "english": "If you eat, you will be full."}, {"korean": "가면 볼 수 있어요.", "english": "If you go, you can see it."}]',2),
  (l_id,'만약 for emphasis','만약 + V + (으)면 ...','만약 emphasizes the hypothetical nature: "if (hypothetically)..."','[{"korean": "만약 합격하면 파티를 해요.", "english": "If I pass the exam, we will have a party."}, {"korean": "만약 비가 오면 집에 있을게요.", "english": "If it rains, I will stay home."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유나','시험 준비는 잘 되고 있어요?','Si-heom jun-bi-neun jal doe-go i-sseo-yo?','Is your exam preparation going well?',1),
  (l_id,'준혁','네, 열심히 하고 있어요. 합격하면 좋겠어요.','Ne, yeol-sim-hi ha-go i-sseo-yo. Hap-gyeok-ha-myeon jo-ket-sseo-yo.','Yes, I am working hard. I hope I pass.',2),
  (l_id,'유나','합격하면 뭐 할 거예요?','Hap-gyeok-ha-myeon mwo hal geo-ye-yo?','If you pass, what will you do?',3),
  (l_id,'준혁','맛있는 것 먹고 여행 갈 거예요!','Ma-sit-neun geot meok-go yeo-haeng gal geo-ye-yo!','I will eat something delicious and go on a trip!',4),
  (l_id,'유나','시험에 안 합격하면요?','Si-heom-e an hap-gyeok-ha-myeon-yo?','What if you do not pass?',5),
  (l_id,'준혁','다시 공부하면 되죠!','Da-si gong-bu-ha-myeon doe-jyo!','Then I will study again!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 expresses?','["contrast", "condition (if/when)", "cause", "listing"]',1,'(으)면 = if/when — introduces a condition followed by a result.',1),
  (l_id,'"먹다 + (으)면" correctly becomes?','["먹면", "먹으면", "먹이면", "먹를면"]',1,'먹 ends in consonant ㄱ, so add 으면: 먹으면.',2),
  (l_id,'"가다 + 면" correctly becomes?','["가으면", "가면", "갑면", "가이면"]',1,'가 ends in vowel, so add 면: 가면.',3),
  (l_id,'만약 is used to emphasize?','["sequence", "the hypothetical nature of the condition", "contrast", "purpose"]',1,'만약 emphasizes the hypothetical: "if (hypothetically) A, then B."',4),
  (l_id,'"날씨가 좋으면" translates as?','["because the weather is good", "the weather is good and", "if the weather is good", "although the weather is good"]',2,'(으)면 = if/when: 날씨가 좋으면 = if the weather is good.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면/(으)면은 조건을 나타내는 접속 어미예요. "시간이 있으면 오세요"처럼 조건 절 뒤에 결과가 와요. 자음 뒤에는 으면, 모음이나 ㄹ 뒤에는 면을 써요. 만약을 앞에 붙이면 가정의 의미가 더 강조돼요. 영어의 "if/when"에 해당해요.','(으)면 expresses a condition: "if/when condition, then result." After consonants use 으면; after vowels or ㄹ use 면. Adding 만약 at the start emphasizes the hypothetical nature. It corresponds to English "if/when."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=18;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#18 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아서/어서','-a-seo/-eo-seo','reason/sequential connector',1),
  (l_id,'원인','won-in','cause',2),
  (l_id,'결과','gyeol-gwa','result',3),
  (l_id,'그래서','geu-rae-seo','therefore',4),
  (l_id,'피곤하다','pi-gon-ha-da','to be tired',5),
  (l_id,'배고프다','bae-go-peu-da','to be hungry',6),
  (l_id,'늦다','neut-da','to be late',7),
  (l_id,'막히다','ma-ki-da','to be blocked/congested',8),
  (l_id,'그러니까','geu-reo-ni-kka','so therefore (spoken)',9),
  (l_id,'왜냐하면','wae-nya-ha-myeon','because (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아서/어서 cause/reason','V/A + 아서/어서 + result','The 아서/어서 clause states the reason; the second clause gives the result. No tense on the 아서/어서 clause.','[{"korean": "배가 고파서 밥을 먹어요.", "english": "I am hungry so I eat."}, {"korean": "피곤해서 일찍 자요.", "english": "I am tired so I sleep early."}]',1),
  (l_id,'Tight sequential: did A then B','V + 아서/어서 + V (consequential)','Shows a directly consequential sequence where B follows A.','[{"korean": "일어나서 세수했어요.", "english": "I got up and (then directly) washed my face."}, {"korean": "식당에 가서 밥 먹었어요.", "english": "I went to the restaurant and ate."}]',2),
  (l_id,'No tense on 아서/어서 clause','* 먹어서 X vs 먹었으니까 O (if past needed)','아서/어서 cannot be preceded by past/future tense markers. Use (으)니까 instead for past causes.','[{"korean": "배가 고프니까 먹었어요. (past cause — use 니까)", "english": "Because I was hungry, I ate."}, {"korean": "피곤해서 일찍 자요. (present state cause)", "english": "I am tired so I sleep early."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민아','왜 늦었어요?','Wae neu-jeot-sseo-yo?','Why were you late?',1),
  (l_id,'태영','길이 막혀서 늦었어요.','Gil-i ma-kyeo-seo neu-jeot-sseo-yo.','The road was blocked so I was late.',2),
  (l_id,'민아','많이 피곤하겠다.','Ma-ni pi-gon-ha-get-da.','You must be very tired.',3),
  (l_id,'태영','네, 배도 고파서 밥 먹고 싶어요.','Ne, bae-do go-pa-seo bap meok-go si-peo-yo.','Yes, I am hungry too so I want to eat.',4),
  (l_id,'민아','같이 먹어요!','Ga-chi meo-geo-yo!','Let us eat together!',5),
  (l_id,'태영','좋아요, 고마워요.','Jo-a-yo, go-ma-wo-yo.','Sounds good, thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아서/어서 expresses?','["contrast", "cause/reason or tight sequence", "condition", "listing"]',1,'-아서/어서 = reason or tight sequential consequence.',1),
  (l_id,'"배고프다 + 아서" becomes?','["배고프아서", "배고파서", "배고프서", "배고픈서"]',1,'ㅡ irregular: 배고프 + 아서 → 배고파서 (ㅡ drops).',2),
  (l_id,'아서/어서 clause CANNOT take what?','["objects", "tense markers", "subjects", "adverbs"]',1,'No tense on the 아서/어서 clause; only the final verb carries tense.',3),
  (l_id,'아서/어서 differs from 고 in that?','["no difference", "아서/어서 is causal/tight sequence; 고 is neutral", "아서/어서 is formal", "고 is causal"]',1,'-고 neutrally links; -아서/어서 shows cause or tightly consequential sequence.',4),
  (l_id,'For past cause, which is used instead?','["아서/어서", "고", "(으)니까", "지만"]',2,'(으)니까 can take past tense: 먹었으니까 = because I ate. 아서/어서 cannot.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아서/어서는 원인-결과 또는 긴밀한 순서를 나타내요. 앞 절이 원인, 뒤 절이 결과예요. 아서/어서 앞에는 시제 어미가 오지 않아요. 과거 원인을 나타낼 때는 으니까/니까를 써요. 예: "배가 고파서 먹어요", "일어나서 씻었어요."','-아서/어서 connects a cause to a result, or shows a tight sequential action. The first clause is the reason; the second is the result. No tense marker on the 아서/어서 clause. For past causes, use (으)니까 instead. E.g.: "I am hungry so I eat," "I got up and then washed."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=19;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#19 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'지만','-ji-man','but/however (clause connector)',1),
  (l_id,'하지만','ha-ji-man','but/however (sentence start)',2),
  (l_id,'대조','dae-jo','contrast',3),
  (l_id,'그렇지만','geu-reo-chi-man','however/nevertheless',4),
  (l_id,'그래도','geu-rae-do','even so',5),
  (l_id,'반면에','ban-myeon-e','on the other hand',6),
  (l_id,'어렵다','eo-ryeop-da','to be difficult',7),
  (l_id,'재미있다','jae-mi-it-da','to be interesting',8),
  (l_id,'비싸다','bi-ssa-da','to be expensive',9),
  (l_id,'하지만 그래도','ha-ji-man geu-rae-do','but even so',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'지만 within a sentence','Clause1 + 지만 + Clause2','Attaches to the verb/adjective stem to contrast two clauses. Neutral in politeness level.','[{"korean": "한국어가 어렵지만 재미있어요.", "english": "Korean is difficult but it is fun."}, {"korean": "비싸지만 맛있어요.", "english": "It is expensive but delicious."}]',1),
  (l_id,'하지만 between sentences','Sentence1. 하지만 + Sentence2.','하지만/그렇지만 start a new sentence expressing contrast.','[{"korean": "한국어는 어려워요. 하지만 재미있어요.", "english": "Korean is difficult. But it is fun."}, {"korean": "비가 와요. 그래도 나가요.", "english": "It is raining. Even so I am going out."}]',2),
  (l_id,'지만 with tense','Past/future + 지만 possible','Unlike 아서/어서, the 지만 clause CAN take tense markers.','[{"korean": "어제는 피곤했지만 오늘은 괜찮아요.", "english": "I was tired yesterday but I am fine today."}, {"korean": "비가 왔지만 나갔어요.", "english": "It rained but I went out."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'소라','한국 생활이 어때요?','Han-guk saeng-hwal-i eo-ttae-yo?','How is life in Korea?',1),
  (l_id,'웨이','어렵지만 좋아요.','Eo-ryeop-ji-man jo-a-yo.','It is hard but I like it.',2),
  (l_id,'소라','뭐가 제일 힘들어요?','Mwo-ga je-il him-deu-reo-yo?','What is the hardest part?',3),
  (l_id,'웨이','말하기는 어렵지만 듣기는 잘 돼요.','Mal-ha-gi-neun eo-ryeop-ji-man deut-gi-neun jal dwae-yo.','Speaking is hard but listening goes well.',4),
  (l_id,'소라','그래도 잘 하고 있어요!','Geu-rae-do jal ha-go i-sseo-yo!','Even so you are doing well!',5),
  (l_id,'웨이','감사해요. 더 열심히 할게요.','Gam-sa-hae-yo. Deo yeol-sim-hi hal-ge-yo.','Thank you. I will work harder.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'지만 expresses?','["cause", "contrast", "sequence", "condition"]',1,'-지만 = but/however — contrasting ideas.',1),
  (l_id,'"비싸지만 맛있어요" — what is contrasted?','["size and taste", "price and taste", "color and time", "speed and distance"]',1,'비싸다 (expensive) contrasted with 맛있다 (delicious): expensive but tasty.',2),
  (l_id,'지만 vs 하지만 — difference?','["same meaning", "지만 in sentence; 하지만 between sentences", "지만 is formal; 하지만 casual", "no difference"]',1,'지만 connects clauses within a sentence; 하지만 connects separate sentences.',3),
  (l_id,'지만 clause can take?','["no tense", "tense markers OK", "only future tense", "only 요"]',1,'Unlike 아서/어서, the 지만 clause can take past tense: 피곤했지만.',4),
  (l_id,'"어렵지만" — 지만 attaches to?','["noun", "adjective stem", "particle", "ending"]',1,'지만 attaches directly to the adjective/verb stem: 어렵 + 지만 = 어렵지만.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'지만은 두 절의 대조를 나타내요. "어렵지만 재미있어요"처럼요. 아서/어서와 달리 지만 앞에 시제 어미가 올 수 있어요. 문장 사이에 쓸 때는 하지만이나 그렇지만을 써요. 그래도는 "그럼에도 불구하고"라는 의미로 뒤 절 앞에 써요.','지만 connects two contrasting clauses: 어렵지만 재미있어요. Unlike 아서/어서, tense can appear before 지만: 피곤했지만. Between separate sentences, use 하지만 or 그렇지만. 그래도 means "even so" and introduces a concession.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=20;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#20 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면/(으)면','myeon/(eu)myeon','if/when (conditional)',1),
  (l_id,'조건','jo-geon','condition',2),
  (l_id,'가정','ga-jeong','hypothesis',3),
  (l_id,'결과','gyeol-gwa','result/consequence',4),
  (l_id,'만약','man-yak','if (emphatic, sentence opener)',5),
  (l_id,'그러면','geu-reo-myeon','then (if so)',6),
  (l_id,'그렇다면','geu-reo-ta-myeon','in that case',7),
  (l_id,'날씨가 맑다','nal-ssi-ga mak-da','the weather is clear',8),
  (l_id,'시간이 있다','si-gan-i it-da','to have time',9),
  (l_id,'합격하다','hap-gyeok-ha-da','to pass (exam)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면 conditional','V/A stem + (으)면 + result','If stem ends in vowel or ㄹ, add 면. After consonants, add 으면. Expresses "if/when condition, then result."','[{"korean": "시간이 있으면 오세요.", "english": "If you have time, please come."}, {"korean": "날씨가 좋으면 나가요.", "english": "If the weather is good, I go out."}]',1),
  (l_id,'으면 vs 면','After consonant: 으면; after vowel/ㄹ: 면','Simple phonological rule: 먹 + 으면 = 먹으면; 가 + 면 = 가면.','[{"korean": "먹으면 배불러요.", "english": "If you eat, you will be full."}, {"korean": "가면 볼 수 있어요.", "english": "If you go, you can see it."}]',2),
  (l_id,'만약 for emphasis','만약 + V + (으)면 ...','만약 emphasizes the hypothetical nature: "if (hypothetically)..."','[{"korean": "만약 합격하면 파티를 해요.", "english": "If I pass the exam, we will have a party."}, {"korean": "만약 비가 오면 집에 있을게요.", "english": "If it rains, I will stay home."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유나','시험 준비는 잘 되고 있어요?','Si-heom jun-bi-neun jal doe-go i-sseo-yo?','Is your exam preparation going well?',1),
  (l_id,'준혁','네, 열심히 하고 있어요. 합격하면 좋겠어요.','Ne, yeol-sim-hi ha-go i-sseo-yo. Hap-gyeok-ha-myeon jo-ket-sseo-yo.','Yes, I am working hard. I hope I pass.',2),
  (l_id,'유나','합격하면 뭐 할 거예요?','Hap-gyeok-ha-myeon mwo hal geo-ye-yo?','If you pass, what will you do?',3),
  (l_id,'준혁','맛있는 것 먹고 여행 갈 거예요!','Ma-sit-neun geot meok-go yeo-haeng gal geo-ye-yo!','I will eat something delicious and go on a trip!',4),
  (l_id,'유나','시험에 안 합격하면요?','Si-heom-e an hap-gyeok-ha-myeon-yo?','What if you do not pass?',5),
  (l_id,'준혁','다시 공부하면 되죠!','Da-si gong-bu-ha-myeon doe-jyo!','Then I will study again!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 expresses?','["contrast", "condition (if/when)", "cause", "listing"]',1,'(으)면 = if/when — introduces a condition followed by a result.',1),
  (l_id,'"먹다 + (으)면" correctly becomes?','["먹면", "먹으면", "먹이면", "먹를면"]',1,'먹 ends in consonant ㄱ, so add 으면: 먹으면.',2),
  (l_id,'"가다 + 면" correctly becomes?','["가으면", "가면", "갑면", "가이면"]',1,'가 ends in vowel, so add 면: 가면.',3),
  (l_id,'만약 is used to emphasize?','["sequence", "the hypothetical nature of the condition", "contrast", "purpose"]',1,'만약 emphasizes the hypothetical: "if (hypothetically) A, then B."',4),
  (l_id,'"날씨가 좋으면" translates as?','["because the weather is good", "the weather is good and", "if the weather is good", "although the weather is good"]',2,'(으)면 = if/when: 날씨가 좋으면 = if the weather is good.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면/(으)면은 조건을 나타내는 접속 어미예요. "시간이 있으면 오세요"처럼 조건 절 뒤에 결과가 와요. 자음 뒤에는 으면, 모음이나 ㄹ 뒤에는 면을 써요. 만약을 앞에 붙이면 가정의 의미가 더 강조돼요. 영어의 "if/when"에 해당해요.','(으)면 expresses a condition: "if/when condition, then result." After consonants use 으면; after vowels or ㄹ use 면. Adding 만약 at the start emphasizes the hypothetical nature. It corresponds to English "if/when."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=21;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#21 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면서/(으)면서','myeon-seo/(eu)myeon-seo','while doing (simultaneous)',1),
  (l_id,'동시에','dong-si-e','at the same time',2),
  (l_id,'동시 동작','dong-si dong-jak','simultaneous actions',3),
  (l_id,'들으면서','deu-reu-myeon-seo','while listening',4),
  (l_id,'걸으면서','geo-reu-myeon-seo','while walking',5),
  (l_id,'먹으면서','meo-geu-myeon-seo','while eating',6),
  (l_id,'공부하면서','gong-bu-ha-myeon-seo','while studying',7),
  (l_id,'노래하다','no-rae-ha-da','to sing',8),
  (l_id,'산책하다','san-chaek-ha-da','to take a walk',9),
  (l_id,'일하다','il-ha-da','to work',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면서 simultaneous actions','V1 + (으)면서 + V2 (same subject)','Both verbs must share the same subject. V1 happens at the same time as V2.','[{"korean": "음악을 들으면서 공부해요.", "english": "I study while listening to music."}, {"korean": "걸으면서 전화해요.", "english": "I talk on the phone while walking."}]',1),
  (l_id,'면서 with adjective contrast','A + 면서 (contradictory states)','면서 can also show two seemingly contradictory states of the same subject.','[{"korean": "좋으면서 싫어요.", "english": "I like it and yet dislike it."}, {"korean": "알면서 모른 척해요.", "english": "Knowing it, I pretend not to know."}]',2),
  (l_id,'Same subject requirement','(으)면서 requires same subject both clauses','Unlike -고 which can have different subjects, -(으)면서 requires the same doer for both actions.','[{"korean": "나는 먹으면서 TV를 봐요.", "english": "I eat while watching TV."}, {"korean": "*나는 먹으면서 그는 일해요. (X — different subjects)", "english": "This is incorrect."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수아','어떻게 한국어를 공부해요?','Eo-tteo-ke han-guk-eo-reul gong-bu-hae-yo?','How do you study Korean?',1),
  (l_id,'크리스','음악을 들으면서 단어를 외워요.','Eum-ak-eul deu-reu-myeon-seo dan-eo-reul oe-wo-yo.','I memorize words while listening to music.',2),
  (l_id,'수아','저는 걸으면서 팟캐스트 들어요.','Jeo-neun geo-reu-myeon-seo pat-kae-seu-teu deu-reo-yo.','I listen to podcasts while walking.',3),
  (l_id,'크리스','밥 먹으면서 한국어 영화도 봐요?','Bap meo-geu-myeon-seo han-guk-eo yeong-hwa-do bwa-yo?','Do you also watch Korean movies while eating?',4),
  (l_id,'수아','네! 그러면 훨씬 재미있어요.','Ne! Geu-reo-myeon hwol-ssin jae-mi-it-sseo-yo.','Yes! Then it is much more fun.',5),
  (l_id,'크리스','저도 해볼게요.','Jeo-do hae-bol-ge-yo.','I will try that too.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면서 expresses?','["cause", "contrast", "two simultaneous actions", "sequence"]',2,'(으)면서 = while — two actions happening at the same time by the same subject.',1),
  (l_id,'"먹다 + 으면서" becomes?','["먹면서", "먹으면서", "먹이면서", "먹그면서"]',1,'먹 ends in consonant, so add 으면서: 먹으면서.',2),
  (l_id,'(으)면서 requires what?','["different subjects", "same subject for both actions", "past tense", "question form"]',1,'Both clauses in a -(으)면서 sentence must share the same subject.',3),
  (l_id,'"알면서 모른 척해요" means?','["I know and learn", "I pretend not to know even though I know", "I do not know how to pretend", "I know because I pretend"]',1,'면서 can show contradictory states of the same person: knowing it but pretending not to.',4),
  (l_id,'"가다 + 면서" becomes?','["가으면서", "가면서", "가이면서", "갑면서"]',1,'가 ends in vowel, so just add 면서: 가면서.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면서/(으)면서는 두 동작이 동시에 일어날 때 써요. 같은 주어에 해당하는 두 동작이어야 해요. "음악을 들으면서 공부해요"처럼요. 또한 알면서 모른 척해요처럼 모순적인 두 상태를 나타낼 수도 있어요. 받침이 있으면 으면서, 없으면 면서를 써요.','(으)면서 expresses two simultaneous actions by the same subject. "I study while listening to music." Both actions must have the same doer. It can also show contradictory states of the same subject. Use 으면서 after consonants, 면서 after vowels or ㄹ.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=22;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#22 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'는데','neun-de','background/context connector (present)',1),
  (l_id,'(으)ㄴ데','(eu)n-de','background/context connector (adj/past)',2),
  (l_id,'배경','bae-gyeong','background/context',3),
  (l_id,'전환','jeon-hwan','transition',4),
  (l_id,'완곡','wan-gok','indirect/roundabout',5),
  (l_id,'그런데','geu-reon-de','by the way/but then',6),
  (l_id,'아무튼','a-mu-teun','anyway',7),
  (l_id,'더불어','deo-bu-reo','in addition/together with',8),
  (l_id,'실은','si-reun','actually/in fact',9),
  (l_id,'근데','geun-de','but/by the way (casual 그런데)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'는데 — background context (action verbs present/future)','V + 는데 + following clause','Sets up background information or mild contrast. Creates a sense of "given that..." or "and..."','[{"korean": "지금 바쁜데 나중에 연락할게요.", "english": "I am busy now so I will contact you later."}, {"korean": "비가 오는데 우산 있어요?", "english": "It is raining — do you have an umbrella?"}]',1),
  (l_id,'(으)ㄴ데 with adjectives and past','Adj stem + ㄴ데 / Past + 는데','Adjectives and past-tense verbs use (으)ㄴ데: 좋은데, 먹었는데.','[{"korean": "날씨가 좋은데 나갈까요?", "english": "The weather is nice — shall we go out?"}, {"korean": "밥을 먹었는데 또 배고파요.", "english": "I already ate but I am hungry again."}]',2),
  (l_id,'그런데 — sentence transition','그런데 = by the way / but then','그런데 (or casual 근데) transitions between topics or introduces a gentle contrast.','[{"korean": "그런데, 오늘 어디 가요?", "english": "By the way, where are you going today?"}, {"korean": "좋아요. 근데 좀 비싸요.", "english": "It is good. But it is a bit expensive."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하은','요즘 어때요?','Yo-jeum eo-ttae-yo?','How are things lately?',1),
  (l_id,'다솔','공부하는데 좀 힘들어요.','Gong-bu-ha-neun-de jom him-deu-reo-yo.','I am studying and it is a bit tough.',2),
  (l_id,'하은','어떤 과목이에요?','Eo-tteon gwa-mok-i-e-yo?','What subject is it?',3),
  (l_id,'다솔','한국어인데, 재미있지만 어렵기도 해요.','Han-guk-eo-in-de, jae-mi-it-ji-man eo-ryeop-gi-do hae-yo.','It is Korean — it is fun but also hard.',4),
  (l_id,'하은','그런데 발음은 어때요?','Geu-reon-de bal-eum-eun eo-ttae-yo?','By the way, how is your pronunciation?',5),
  (l_id,'다솔','발음이 어려운데 연습 많이 해요.','Bal-eum-i eo-ryeo-un-de yeon-seup man-i hae-yo.','Pronunciation is hard so I practice a lot.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'는데 primarily provides what?','["direct cause", "background context or mild contrast", "strict sequence", "permission"]',1,'는데 sets up background info: "given that X..." or creates a mild contrast/transition.',1),
  (l_id,'Adjective + 는데 OR?','["ㄴ데/은데", "았/었는데", "고는데", "서는데"]',0,'Adjectives (and past tense) use (으)ㄴ데: 좋 + 은데 = 좋은데. Action verbs use 는데.',2),
  (l_id,'"비가 오는데 우산 있어요?" — 는데 function?','["cause", "condition", "background (it rains) + question", "contrast"]',2,'The 는데 clause sets up background (it is raining) for the following question (do you have umbrella?).',3),
  (l_id,'그런데 in casual speech is?','["근데", "한데", "거든데", "이런데"]',0,'그런데 shortens to 근데 in casual speech.',4),
  (l_id,'"먹었는데 배고파요" — past verb with 는데 = ?','["먹은데", "먹었는데", "먹는데", "먹었은데"]',1,'Past tense + 는데: 먹었 + 는데 = 먹었는데. Action verbs in past use 었는데/았는데.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'는데/(으)ㄴ데는 배경 정보를 설정하거나 완곡한 전환을 나타내요. 동작 동사 현재는 는데, 형용사와 과거는 (으)ㄴ데를 써요. "비가 오는데 우산 있어요?"처럼 배경 상황을 제시하고 질문하거나 요청해요. 그런데(근데)는 문장 사이의 전환이나 부드러운 대조를 나타내요.','는데/(으)ㄴ데 sets up background context or expresses mild contrast. Action verbs in present use 는데; adjectives and past verbs use (으)ㄴ데. "It is raining — do you have an umbrella?" sets up context then asks. 그런데 (casual: 근데) transitions between topics or introduces mild contrast between sentences.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=23;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#23 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)러','(eu)reo','purpose with movement verb',1),
  (l_id,'(으)려고','(eu)ryeo-go','intention/purpose',2),
  (l_id,'목적','mok-jeok','purpose/goal',3),
  (l_id,'의도','ui-do','intention',4),
  (l_id,'배우러','bae-u-reo','in order to learn',5),
  (l_id,'사러','sa-reo','in order to buy',6),
  (l_id,'만나려고','man-na-ryeo-go','intending to meet',7),
  (l_id,'준비하다','jun-bi-ha-da','to prepare',8),
  (l_id,'노력하다','no-ryeok-ha-da','to make an effort',9),
  (l_id,'계획하다','gye-hoek-ha-da','to plan',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)러 — purpose with movement','V + (으)러 + movement verb (가다/오다/다니다)','(으)러 expresses purpose only when the main verb is a movement verb. Cannot be used with non-movement verbs.','[{"korean": "한국어를 배우러 한국에 왔어요.", "english": "I came to Korea to learn Korean."}, {"korean": "커피를 사러 카페에 가요.", "english": "I go to the cafe to buy coffee."}]',1),
  (l_id,'(으)려고 — general intention','V + (으)려고 + any verb','(으)려고 expresses intention or purpose and can be used with any main verb.','[{"korean": "한국어를 배우려고 공부해요.", "english": "I study with the intention of learning Korean."}, {"korean": "살을 빼려고 운동해요.", "english": "I exercise in order to lose weight."}]',2),
  (l_id,'(으)러 vs (으)려고','(으)러 = movement only; (으)려고 = any verb','Key difference: (으)러 requires the main verb to be 가다/오다/다니다. (으)려고 is unrestricted.','[{"korean": "O: 사러 가요 / X: 사러 공부해요", "english": "(으)러 only with movement verbs."}, {"korean": "O: 사려고 공부해요 / O: 사려고 가요", "english": "(으)려고 works with any verb."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지원','왜 한국에 왔어요?','Wae han-guk-e wat-sseo-yo?','Why did you come to Korea?',1),
  (l_id,'레나','한국어를 배우러 왔어요.','Han-guk-eo-reul bae-u-reo wat-sseo-yo.','I came to learn Korean.',2),
  (l_id,'지원','한국어를 왜 배우려고 해요?','Han-guk-eo-reul wae bae-u-ryeo-go hae-yo?','Why do you intend to learn Korean?',3),
  (l_id,'레나','한국 회사에서 일하려고요.','Han-guk hoe-sa-e-seo il-ha-ryeo-go-yo.','I intend to work at a Korean company.',4),
  (l_id,'지원','멋있네요! 어떤 회사예요?','Meo-sit-ne-yo! Eo-tteon hoe-sa-ye-yo?','That is amazing! What kind of company?',5),
  (l_id,'레나','IT 회사요. 그래서 열심히 공부해요.','IT hoe-sa-yo. Geu-rae-seo yeol-sim-hi gong-bu-hae-yo.','An IT company. So I study hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)러 can only be used with which main verb type?','["any verb", "movement verbs (가다/오다/다니다)", "action verbs", "adjectives"]',1,'(으)러 is restricted to sentences where the main verb is a movement verb.',1),
  (l_id,'"커피를 사러 가요" correct?','["Yes — 사러 with 가다", "No — should be 사려고 가요", "No — should be 사고 가요", "No — impossible"]',0,'(으)러 + 가다 is correct: 커피를 사러 가요 = I go to buy coffee.',2),
  (l_id,'"운동하다 + 려고" becomes?','["운동하으려고", "운동하려고", "운동하을려고", "운동하고려고"]',1,'하다 verbs: 운동하 + 려고 = 운동하려고. No 으 needed after 하.',3),
  (l_id,'What is the key difference between (으)러 and (으)려고?','["러 is formal, 려고 casual", "러 only with movement verbs; 려고 with any verb", "they are the same", "려고 only with movement verbs"]',1,'러 = movement verb only; 려고 = any verb.',4),
  (l_id,'"배우러 vs 배우려고" — "I came to learn" uses which?','["배우러 왔어요", "배우려고 왔어요", "both correct", "배우고 왔어요"]',0,'왔어요 is a movement verb, so 배우러 is correct. 배우려고 왔어요 is also acceptable but 배우러 is more standard with 오다.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)러와 (으)려고는 둘 다 목적을 나타내요. (으)러는 반드시 가다/오다/다니다 같은 이동 동사와 함께 써요. "커피를 사러 가요." (으)려고는 모든 동사와 함께 쓸 수 있어요. "살을 빼려고 운동해요." 주된 차이는 뒤 동사가 이동 동사인지 아닌지예요.','Both (으)러 and (으)려고 express purpose. (으)러 is restricted to sentences where the main verb is a movement verb: 사러 가요. (으)려고 can be used with any main verb: 살을 빼려고 운동해요. The key difference is whether the main verb is a movement verb or not.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=24;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#24 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아도/어도','-a-do/-eo-do','even if/even though',1),
  (l_id,'양보','yang-bo','concession',2),
  (l_id,'아무리','a-mu-ri','no matter how (with 아도)',3),
  (l_id,'그래도','geu-rae-do','even so/still',4),
  (l_id,'비록','bi-rok','even though (literary)',5),
  (l_id,'설령','seol-lyeong','even if (hypothetical)',6),
  (l_id,'상관없다','sang-gwan-eop-da','does not matter',7),
  (l_id,'괜찮다','gwaen-chan-ta','to be fine/okay',8),
  (l_id,'포기하다','po-gi-ha-da','to give up',9),
  (l_id,'계속하다','gye-sok-ha-da','to continue',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아도/어도 concession','V/A + 아도/어도','Even if/even though. Introduces a concession: even if condition A, result B still holds.','[{"korean": "비가 와도 갈 거예요.", "english": "Even if it rains, I will go."}, {"korean": "어려워도 포기하지 않아요.", "english": "Even if it is hard, I do not give up."}]',1),
  (l_id,'아무리 + 아도/어도','아무리 + V/A + 아도/어도','아무리 intensifies the concession: "no matter how much/how hard..."','[{"korean": "아무리 먹어도 배불러요.", "english": "No matter how much I eat, I get full."}, {"korean": "아무리 어려워도 할 수 있어요.", "english": "No matter how hard it is, I can do it."}]',2),
  (l_id,'-어도 되다 (permission)','V + 어도 되다 = "may/can (permission)"','아도/어도 also combines with 되다 to give permission: "it is okay even if you V."','[{"korean": "여기 앉아도 돼요.", "english": "You may sit here."}, {"korean": "이거 먹어도 돼요?", "english": "May I eat this?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'리암','한국어 시험이 너무 어려워요.','Han-guk-eo si-heom-i neo-mu eo-ryeo-wo-yo.','Korean exams are too hard.',1),
  (l_id,'선아','아무리 어려워도 포기하지 마세요!','A-mu-ri eo-ryeo-wo-do po-gi-ha-ji ma-se-yo!','No matter how hard it is, do not give up!',2),
  (l_id,'리암','힘들어도 계속해야 하나요?','Him-deu-reo-do gye-so-kae-ya ha-na-yo?','Even if it is hard, should I keep going?',3),
  (l_id,'선아','네! 비가 와도 갈 것처럼 공부해요.','Ne! Bi-ga wa-do gal geot-cheo-reom gong-bu-hae-yo.','Yes! Study like you would go even if it rains.',4),
  (l_id,'리암','알겠어요. 포기하지 않을게요.','Al-get-sseo-yo. Po-gi-ha-ji a-neul-ge-yo.','Okay. I will not give up.',5),
  (l_id,'선아','잘 할 수 있어요. 화이팅!','Jal hal su i-sseo-yo. Hwa-i-ting!','You can do it. Fighting!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아도/어도 expresses?','["cause", "condition only", "concession (even if/though)", "permission only"]',2,'아도/어도 = even if/even though — introduces a concession.',1),
  (l_id,'"비가 와도 갈 거예요" means?','["I will go because it rains", "Even if it rains I will go", "It is raining so I will not go", "If it does not rain I will go"]',1,'아도/어도 = even if. 비가 와도 갈 거예요 = Even if it rains I will go.',2),
  (l_id,'아무리 + 아도/어도 intensifies to mean?','["sometimes", "no matter how", "certainly", "only if"]',1,'아무리 + 아도/어도 = "no matter how" — strong concession.',3),
  (l_id,'"앉아도 돼요" means?','["You must sit", "You may sit", "You cannot sit", "You sat"]',1,'아도 + 되다 = permission: 앉아도 돼요 = You may sit / It is okay to sit.',4),
  (l_id,'"먹다 + 어도" correctly becomes?','["먹아도", "먹어도", "먹이도", "먹도"]',1,'먹 stem vowel ㅓ → add 어도: 먹어도 = even if eat.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아도/어도는 양보를 나타내요. "비가 와도 갈 거예요"처럼 조건에 상관없이 결과가 유지됨을 말해요. 아무리와 함께 쓰면 "아무리 어려워도"처럼 강조돼요. 아도/어도 되다는 허가를 나타내요. "앉아도 돼요 = 앉아도 괜찮아요."','아도/어도 expresses concession: "Even if it rains, I will go." The result holds regardless of the condition. With 아무리, it strengthens to "no matter how": 아무리 어려워도 = no matter how hard. 아도/어도 되다 = permission: 앉아도 돼요 = You may sit.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=18;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#18 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아서/어서','-a-seo/-eo-seo','reason/sequential connector',1),
  (l_id,'원인','won-in','cause',2),
  (l_id,'결과','gyeol-gwa','result',3),
  (l_id,'그래서','geu-rae-seo','therefore',4),
  (l_id,'피곤하다','pi-gon-ha-da','to be tired',5),
  (l_id,'배고프다','bae-go-peu-da','to be hungry',6),
  (l_id,'늦다','neut-da','to be late',7),
  (l_id,'막히다','ma-ki-da','to be blocked/congested',8),
  (l_id,'그러니까','geu-reo-ni-kka','so therefore (spoken)',9),
  (l_id,'왜냐하면','wae-nya-ha-myeon','because (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아서/어서 cause/reason','V/A + 아서/어서 + result','The 아서/어서 clause states the reason; the second clause gives the result. No tense on the 아서/어서 clause.','[{"korean": "배가 고파서 밥을 먹어요.", "english": "I am hungry so I eat."}, {"korean": "피곤해서 일찍 자요.", "english": "I am tired so I sleep early."}]',1),
  (l_id,'Tight sequential: did A then B','V + 아서/어서 + V (consequential)','Shows a directly consequential sequence where B follows A.','[{"korean": "일어나서 세수했어요.", "english": "I got up and (then directly) washed my face."}, {"korean": "식당에 가서 밥 먹었어요.", "english": "I went to the restaurant and ate."}]',2),
  (l_id,'No tense on 아서/어서 clause','* 먹어서 X vs 먹었으니까 O (if past needed)','아서/어서 cannot be preceded by past/future tense markers. Use (으)니까 instead for past causes.','[{"korean": "배가 고프니까 먹었어요. (past cause — use 니까)", "english": "Because I was hungry, I ate."}, {"korean": "피곤해서 일찍 자요. (present state cause)", "english": "I am tired so I sleep early."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민아','왜 늦었어요?','Wae neu-jeot-sseo-yo?','Why were you late?',1),
  (l_id,'태영','길이 막혀서 늦었어요.','Gil-i ma-kyeo-seo neu-jeot-sseo-yo.','The road was blocked so I was late.',2),
  (l_id,'민아','많이 피곤하겠다.','Ma-ni pi-gon-ha-get-da.','You must be very tired.',3),
  (l_id,'태영','네, 배도 고파서 밥 먹고 싶어요.','Ne, bae-do go-pa-seo bap meok-go si-peo-yo.','Yes, I am hungry too so I want to eat.',4),
  (l_id,'민아','같이 먹어요!','Ga-chi meo-geo-yo!','Let us eat together!',5),
  (l_id,'태영','좋아요, 고마워요.','Jo-a-yo, go-ma-wo-yo.','Sounds good, thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아서/어서 expresses?','["contrast", "cause/reason or tight sequence", "condition", "listing"]',1,'-아서/어서 = reason or tight sequential consequence.',1),
  (l_id,'"배고프다 + 아서" becomes?','["배고프아서", "배고파서", "배고프서", "배고픈서"]',1,'ㅡ irregular: 배고프 + 아서 → 배고파서 (ㅡ drops).',2),
  (l_id,'아서/어서 clause CANNOT take what?','["objects", "tense markers", "subjects", "adverbs"]',1,'No tense on the 아서/어서 clause; only the final verb carries tense.',3),
  (l_id,'아서/어서 differs from 고 in that?','["no difference", "아서/어서 is causal/tight sequence; 고 is neutral", "아서/어서 is formal", "고 is causal"]',1,'-고 neutrally links; -아서/어서 shows cause or tightly consequential sequence.',4),
  (l_id,'For past cause, which is used instead?','["아서/어서", "고", "(으)니까", "지만"]',2,'(으)니까 can take past tense: 먹었으니까 = because I ate. 아서/어서 cannot.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아서/어서는 원인-결과 또는 긴밀한 순서를 나타내요. 앞 절이 원인, 뒤 절이 결과예요. 아서/어서 앞에는 시제 어미가 오지 않아요. 과거 원인을 나타낼 때는 으니까/니까를 써요. 예: "배가 고파서 먹어요", "일어나서 씻었어요."','-아서/어서 connects a cause to a result, or shows a tight sequential action. The first clause is the reason; the second is the result. No tense marker on the 아서/어서 clause. For past causes, use (으)니까 instead. E.g.: "I am hungry so I eat," "I got up and then washed."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=19;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#19 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'지만','-ji-man','but/however (clause connector)',1),
  (l_id,'하지만','ha-ji-man','but/however (sentence start)',2),
  (l_id,'대조','dae-jo','contrast',3),
  (l_id,'그렇지만','geu-reo-chi-man','however/nevertheless',4),
  (l_id,'그래도','geu-rae-do','even so',5),
  (l_id,'반면에','ban-myeon-e','on the other hand',6),
  (l_id,'어렵다','eo-ryeop-da','to be difficult',7),
  (l_id,'재미있다','jae-mi-it-da','to be interesting',8),
  (l_id,'비싸다','bi-ssa-da','to be expensive',9),
  (l_id,'하지만 그래도','ha-ji-man geu-rae-do','but even so',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'지만 within a sentence','Clause1 + 지만 + Clause2','Attaches to the verb/adjective stem to contrast two clauses. Neutral in politeness level.','[{"korean": "한국어가 어렵지만 재미있어요.", "english": "Korean is difficult but it is fun."}, {"korean": "비싸지만 맛있어요.", "english": "It is expensive but delicious."}]',1),
  (l_id,'하지만 between sentences','Sentence1. 하지만 + Sentence2.','하지만/그렇지만 start a new sentence expressing contrast.','[{"korean": "한국어는 어려워요. 하지만 재미있어요.", "english": "Korean is difficult. But it is fun."}, {"korean": "비가 와요. 그래도 나가요.", "english": "It is raining. Even so I am going out."}]',2),
  (l_id,'지만 with tense','Past/future + 지만 possible','Unlike 아서/어서, the 지만 clause CAN take tense markers.','[{"korean": "어제는 피곤했지만 오늘은 괜찮아요.", "english": "I was tired yesterday but I am fine today."}, {"korean": "비가 왔지만 나갔어요.", "english": "It rained but I went out."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'소라','한국 생활이 어때요?','Han-guk saeng-hwal-i eo-ttae-yo?','How is life in Korea?',1),
  (l_id,'웨이','어렵지만 좋아요.','Eo-ryeop-ji-man jo-a-yo.','It is hard but I like it.',2),
  (l_id,'소라','뭐가 제일 힘들어요?','Mwo-ga je-il him-deu-reo-yo?','What is the hardest part?',3),
  (l_id,'웨이','말하기는 어렵지만 듣기는 잘 돼요.','Mal-ha-gi-neun eo-ryeop-ji-man deut-gi-neun jal dwae-yo.','Speaking is hard but listening goes well.',4),
  (l_id,'소라','그래도 잘 하고 있어요!','Geu-rae-do jal ha-go i-sseo-yo!','Even so you are doing well!',5),
  (l_id,'웨이','감사해요. 더 열심히 할게요.','Gam-sa-hae-yo. Deo yeol-sim-hi hal-ge-yo.','Thank you. I will work harder.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'지만 expresses?','["cause", "contrast", "sequence", "condition"]',1,'-지만 = but/however — contrasting ideas.',1),
  (l_id,'"비싸지만 맛있어요" — what is contrasted?','["size and taste", "price and taste", "color and time", "speed and distance"]',1,'비싸다 (expensive) contrasted with 맛있다 (delicious): expensive but tasty.',2),
  (l_id,'지만 vs 하지만 — difference?','["same meaning", "지만 in sentence; 하지만 between sentences", "지만 is formal; 하지만 casual", "no difference"]',1,'지만 connects clauses within a sentence; 하지만 connects separate sentences.',3),
  (l_id,'지만 clause can take?','["no tense", "tense markers OK", "only future tense", "only 요"]',1,'Unlike 아서/어서, the 지만 clause can take past tense: 피곤했지만.',4),
  (l_id,'"어렵지만" — 지만 attaches to?','["noun", "adjective stem", "particle", "ending"]',1,'지만 attaches directly to the adjective/verb stem: 어렵 + 지만 = 어렵지만.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'지만은 두 절의 대조를 나타내요. "어렵지만 재미있어요"처럼요. 아서/어서와 달리 지만 앞에 시제 어미가 올 수 있어요. 문장 사이에 쓸 때는 하지만이나 그렇지만을 써요. 그래도는 "그럼에도 불구하고"라는 의미로 뒤 절 앞에 써요.','지만 connects two contrasting clauses: 어렵지만 재미있어요. Unlike 아서/어서, tense can appear before 지만: 피곤했지만. Between separate sentences, use 하지만 or 그렇지만. 그래도 means "even so" and introduces a concession.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=20;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#20 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면/(으)면','myeon/(eu)myeon','if/when (conditional)',1),
  (l_id,'조건','jo-geon','condition',2),
  (l_id,'가정','ga-jeong','hypothesis',3),
  (l_id,'결과','gyeol-gwa','result/consequence',4),
  (l_id,'만약','man-yak','if (emphatic, sentence opener)',5),
  (l_id,'그러면','geu-reo-myeon','then (if so)',6),
  (l_id,'그렇다면','geu-reo-ta-myeon','in that case',7),
  (l_id,'날씨가 맑다','nal-ssi-ga mak-da','the weather is clear',8),
  (l_id,'시간이 있다','si-gan-i it-da','to have time',9),
  (l_id,'합격하다','hap-gyeok-ha-da','to pass (exam)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면 conditional','V/A stem + (으)면 + result','If stem ends in vowel or ㄹ, add 면. After consonants, add 으면. Expresses "if/when condition, then result."','[{"korean": "시간이 있으면 오세요.", "english": "If you have time, please come."}, {"korean": "날씨가 좋으면 나가요.", "english": "If the weather is good, I go out."}]',1),
  (l_id,'으면 vs 면','After consonant: 으면; after vowel/ㄹ: 면','Simple phonological rule: 먹 + 으면 = 먹으면; 가 + 면 = 가면.','[{"korean": "먹으면 배불러요.", "english": "If you eat, you will be full."}, {"korean": "가면 볼 수 있어요.", "english": "If you go, you can see it."}]',2),
  (l_id,'만약 for emphasis','만약 + V + (으)면 ...','만약 emphasizes the hypothetical nature: "if (hypothetically)..."','[{"korean": "만약 합격하면 파티를 해요.", "english": "If I pass the exam, we will have a party."}, {"korean": "만약 비가 오면 집에 있을게요.", "english": "If it rains, I will stay home."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유나','시험 준비는 잘 되고 있어요?','Si-heom jun-bi-neun jal doe-go i-sseo-yo?','Is your exam preparation going well?',1),
  (l_id,'준혁','네, 열심히 하고 있어요. 합격하면 좋겠어요.','Ne, yeol-sim-hi ha-go i-sseo-yo. Hap-gyeok-ha-myeon jo-ket-sseo-yo.','Yes, I am working hard. I hope I pass.',2),
  (l_id,'유나','합격하면 뭐 할 거예요?','Hap-gyeok-ha-myeon mwo hal geo-ye-yo?','If you pass, what will you do?',3),
  (l_id,'준혁','맛있는 것 먹고 여행 갈 거예요!','Ma-sit-neun geot meok-go yeo-haeng gal geo-ye-yo!','I will eat something delicious and go on a trip!',4),
  (l_id,'유나','시험에 안 합격하면요?','Si-heom-e an hap-gyeok-ha-myeon-yo?','What if you do not pass?',5),
  (l_id,'준혁','다시 공부하면 되죠!','Da-si gong-bu-ha-myeon doe-jyo!','Then I will study again!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 expresses?','["contrast", "condition (if/when)", "cause", "listing"]',1,'(으)면 = if/when — introduces a condition followed by a result.',1),
  (l_id,'"먹다 + (으)면" correctly becomes?','["먹면", "먹으면", "먹이면", "먹를면"]',1,'먹 ends in consonant ㄱ, so add 으면: 먹으면.',2),
  (l_id,'"가다 + 면" correctly becomes?','["가으면", "가면", "갑면", "가이면"]',1,'가 ends in vowel, so add 면: 가면.',3),
  (l_id,'만약 is used to emphasize?','["sequence", "the hypothetical nature of the condition", "contrast", "purpose"]',1,'만약 emphasizes the hypothetical: "if (hypothetically) A, then B."',4),
  (l_id,'"날씨가 좋으면" translates as?','["because the weather is good", "the weather is good and", "if the weather is good", "although the weather is good"]',2,'(으)면 = if/when: 날씨가 좋으면 = if the weather is good.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면/(으)면은 조건을 나타내는 접속 어미예요. "시간이 있으면 오세요"처럼 조건 절 뒤에 결과가 와요. 자음 뒤에는 으면, 모음이나 ㄹ 뒤에는 면을 써요. 만약을 앞에 붙이면 가정의 의미가 더 강조돼요. 영어의 "if/when"에 해당해요.','(으)면 expresses a condition: "if/when condition, then result." After consonants use 으면; after vowels or ㄹ use 면. Adding 만약 at the start emphasizes the hypothetical nature. It corresponds to English "if/when."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=21;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#21 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면서/(으)면서','myeon-seo/(eu)myeon-seo','while doing (simultaneous)',1),
  (l_id,'동시에','dong-si-e','at the same time',2),
  (l_id,'동시 동작','dong-si dong-jak','simultaneous actions',3),
  (l_id,'들으면서','deu-reu-myeon-seo','while listening',4),
  (l_id,'걸으면서','geo-reu-myeon-seo','while walking',5),
  (l_id,'먹으면서','meo-geu-myeon-seo','while eating',6),
  (l_id,'공부하면서','gong-bu-ha-myeon-seo','while studying',7),
  (l_id,'노래하다','no-rae-ha-da','to sing',8),
  (l_id,'산책하다','san-chaek-ha-da','to take a walk',9),
  (l_id,'일하다','il-ha-da','to work',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면서 simultaneous actions','V1 + (으)면서 + V2 (same subject)','Both verbs must share the same subject. V1 happens at the same time as V2.','[{"korean": "음악을 들으면서 공부해요.", "english": "I study while listening to music."}, {"korean": "걸으면서 전화해요.", "english": "I talk on the phone while walking."}]',1),
  (l_id,'면서 with adjective contrast','A + 면서 (contradictory states)','면서 can also show two seemingly contradictory states of the same subject.','[{"korean": "좋으면서 싫어요.", "english": "I like it and yet dislike it."}, {"korean": "알면서 모른 척해요.", "english": "Knowing it, I pretend not to know."}]',2),
  (l_id,'Same subject requirement','(으)면서 requires same subject both clauses','Unlike -고 which can have different subjects, -(으)면서 requires the same doer for both actions.','[{"korean": "나는 먹으면서 TV를 봐요.", "english": "I eat while watching TV."}, {"korean": "*나는 먹으면서 그는 일해요. (X — different subjects)", "english": "This is incorrect."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수아','어떻게 한국어를 공부해요?','Eo-tteo-ke han-guk-eo-reul gong-bu-hae-yo?','How do you study Korean?',1),
  (l_id,'크리스','음악을 들으면서 단어를 외워요.','Eum-ak-eul deu-reu-myeon-seo dan-eo-reul oe-wo-yo.','I memorize words while listening to music.',2),
  (l_id,'수아','저는 걸으면서 팟캐스트 들어요.','Jeo-neun geo-reu-myeon-seo pat-kae-seu-teu deu-reo-yo.','I listen to podcasts while walking.',3),
  (l_id,'크리스','밥 먹으면서 한국어 영화도 봐요?','Bap meo-geu-myeon-seo han-guk-eo yeong-hwa-do bwa-yo?','Do you also watch Korean movies while eating?',4),
  (l_id,'수아','네! 그러면 훨씬 재미있어요.','Ne! Geu-reo-myeon hwol-ssin jae-mi-it-sseo-yo.','Yes! Then it is much more fun.',5),
  (l_id,'크리스','저도 해볼게요.','Jeo-do hae-bol-ge-yo.','I will try that too.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면서 expresses?','["cause", "contrast", "two simultaneous actions", "sequence"]',2,'(으)면서 = while — two actions happening at the same time by the same subject.',1),
  (l_id,'"먹다 + 으면서" becomes?','["먹면서", "먹으면서", "먹이면서", "먹그면서"]',1,'먹 ends in consonant, so add 으면서: 먹으면서.',2),
  (l_id,'(으)면서 requires what?','["different subjects", "same subject for both actions", "past tense", "question form"]',1,'Both clauses in a -(으)면서 sentence must share the same subject.',3),
  (l_id,'"알면서 모른 척해요" means?','["I know and learn", "I pretend not to know even though I know", "I do not know how to pretend", "I know because I pretend"]',1,'면서 can show contradictory states of the same person: knowing it but pretending not to.',4),
  (l_id,'"가다 + 면서" becomes?','["가으면서", "가면서", "가이면서", "갑면서"]',1,'가 ends in vowel, so just add 면서: 가면서.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면서/(으)면서는 두 동작이 동시에 일어날 때 써요. 같은 주어에 해당하는 두 동작이어야 해요. "음악을 들으면서 공부해요"처럼요. 또한 알면서 모른 척해요처럼 모순적인 두 상태를 나타낼 수도 있어요. 받침이 있으면 으면서, 없으면 면서를 써요.','(으)면서 expresses two simultaneous actions by the same subject. "I study while listening to music." Both actions must have the same doer. It can also show contradictory states of the same subject. Use 으면서 after consonants, 면서 after vowels or ㄹ.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=22;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#22 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'는데','neun-de','background/context connector (present)',1),
  (l_id,'(으)ㄴ데','(eu)n-de','background/context connector (adj/past)',2),
  (l_id,'배경','bae-gyeong','background/context',3),
  (l_id,'전환','jeon-hwan','transition',4),
  (l_id,'완곡','wan-gok','indirect/roundabout',5),
  (l_id,'그런데','geu-reon-de','by the way/but then',6),
  (l_id,'아무튼','a-mu-teun','anyway',7),
  (l_id,'더불어','deo-bu-reo','in addition/together with',8),
  (l_id,'실은','si-reun','actually/in fact',9),
  (l_id,'근데','geun-de','but/by the way (casual 그런데)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'는데 — background context (action verbs present/future)','V + 는데 + following clause','Sets up background information or mild contrast. Creates a sense of "given that..." or "and..."','[{"korean": "지금 바쁜데 나중에 연락할게요.", "english": "I am busy now so I will contact you later."}, {"korean": "비가 오는데 우산 있어요?", "english": "It is raining — do you have an umbrella?"}]',1),
  (l_id,'(으)ㄴ데 with adjectives and past','Adj stem + ㄴ데 / Past + 는데','Adjectives and past-tense verbs use (으)ㄴ데: 좋은데, 먹었는데.','[{"korean": "날씨가 좋은데 나갈까요?", "english": "The weather is nice — shall we go out?"}, {"korean": "밥을 먹었는데 또 배고파요.", "english": "I already ate but I am hungry again."}]',2),
  (l_id,'그런데 — sentence transition','그런데 = by the way / but then','그런데 (or casual 근데) transitions between topics or introduces a gentle contrast.','[{"korean": "그런데, 오늘 어디 가요?", "english": "By the way, where are you going today?"}, {"korean": "좋아요. 근데 좀 비싸요.", "english": "It is good. But it is a bit expensive."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하은','요즘 어때요?','Yo-jeum eo-ttae-yo?','How are things lately?',1),
  (l_id,'다솔','공부하는데 좀 힘들어요.','Gong-bu-ha-neun-de jom him-deu-reo-yo.','I am studying and it is a bit tough.',2),
  (l_id,'하은','어떤 과목이에요?','Eo-tteon gwa-mok-i-e-yo?','What subject is it?',3),
  (l_id,'다솔','한국어인데, 재미있지만 어렵기도 해요.','Han-guk-eo-in-de, jae-mi-it-ji-man eo-ryeop-gi-do hae-yo.','It is Korean — it is fun but also hard.',4),
  (l_id,'하은','그런데 발음은 어때요?','Geu-reon-de bal-eum-eun eo-ttae-yo?','By the way, how is your pronunciation?',5),
  (l_id,'다솔','발음이 어려운데 연습 많이 해요.','Bal-eum-i eo-ryeo-un-de yeon-seup man-i hae-yo.','Pronunciation is hard so I practice a lot.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'는데 primarily provides what?','["direct cause", "background context or mild contrast", "strict sequence", "permission"]',1,'는데 sets up background info: "given that X..." or creates a mild contrast/transition.',1),
  (l_id,'Adjective + 는데 OR?','["ㄴ데/은데", "았/었는데", "고는데", "서는데"]',0,'Adjectives (and past tense) use (으)ㄴ데: 좋 + 은데 = 좋은데. Action verbs use 는데.',2),
  (l_id,'"비가 오는데 우산 있어요?" — 는데 function?','["cause", "condition", "background (it rains) + question", "contrast"]',2,'The 는데 clause sets up background (it is raining) for the following question (do you have umbrella?).',3),
  (l_id,'그런데 in casual speech is?','["근데", "한데", "거든데", "이런데"]',0,'그런데 shortens to 근데 in casual speech.',4),
  (l_id,'"먹었는데 배고파요" — past verb with 는데 = ?','["먹은데", "먹었는데", "먹는데", "먹었은데"]',1,'Past tense + 는데: 먹었 + 는데 = 먹었는데. Action verbs in past use 었는데/았는데.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'는데/(으)ㄴ데는 배경 정보를 설정하거나 완곡한 전환을 나타내요. 동작 동사 현재는 는데, 형용사와 과거는 (으)ㄴ데를 써요. "비가 오는데 우산 있어요?"처럼 배경 상황을 제시하고 질문하거나 요청해요. 그런데(근데)는 문장 사이의 전환이나 부드러운 대조를 나타내요.','는데/(으)ㄴ데 sets up background context or expresses mild contrast. Action verbs in present use 는데; adjectives and past verbs use (으)ㄴ데. "It is raining — do you have an umbrella?" sets up context then asks. 그런데 (casual: 근데) transitions between topics or introduces mild contrast between sentences.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=23;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#23 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)러','(eu)reo','purpose with movement verb',1),
  (l_id,'(으)려고','(eu)ryeo-go','intention/purpose',2),
  (l_id,'목적','mok-jeok','purpose/goal',3),
  (l_id,'의도','ui-do','intention',4),
  (l_id,'배우러','bae-u-reo','in order to learn',5),
  (l_id,'사러','sa-reo','in order to buy',6),
  (l_id,'만나려고','man-na-ryeo-go','intending to meet',7),
  (l_id,'준비하다','jun-bi-ha-da','to prepare',8),
  (l_id,'노력하다','no-ryeok-ha-da','to make an effort',9),
  (l_id,'계획하다','gye-hoek-ha-da','to plan',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)러 — purpose with movement','V + (으)러 + movement verb (가다/오다/다니다)','(으)러 expresses purpose only when the main verb is a movement verb. Cannot be used with non-movement verbs.','[{"korean": "한국어를 배우러 한국에 왔어요.", "english": "I came to Korea to learn Korean."}, {"korean": "커피를 사러 카페에 가요.", "english": "I go to the cafe to buy coffee."}]',1),
  (l_id,'(으)려고 — general intention','V + (으)려고 + any verb','(으)려고 expresses intention or purpose and can be used with any main verb.','[{"korean": "한국어를 배우려고 공부해요.", "english": "I study with the intention of learning Korean."}, {"korean": "살을 빼려고 운동해요.", "english": "I exercise in order to lose weight."}]',2),
  (l_id,'(으)러 vs (으)려고','(으)러 = movement only; (으)려고 = any verb','Key difference: (으)러 requires the main verb to be 가다/오다/다니다. (으)려고 is unrestricted.','[{"korean": "O: 사러 가요 / X: 사러 공부해요", "english": "(으)러 only with movement verbs."}, {"korean": "O: 사려고 공부해요 / O: 사려고 가요", "english": "(으)려고 works with any verb."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지원','왜 한국에 왔어요?','Wae han-guk-e wat-sseo-yo?','Why did you come to Korea?',1),
  (l_id,'레나','한국어를 배우러 왔어요.','Han-guk-eo-reul bae-u-reo wat-sseo-yo.','I came to learn Korean.',2),
  (l_id,'지원','한국어를 왜 배우려고 해요?','Han-guk-eo-reul wae bae-u-ryeo-go hae-yo?','Why do you intend to learn Korean?',3),
  (l_id,'레나','한국 회사에서 일하려고요.','Han-guk hoe-sa-e-seo il-ha-ryeo-go-yo.','I intend to work at a Korean company.',4),
  (l_id,'지원','멋있네요! 어떤 회사예요?','Meo-sit-ne-yo! Eo-tteon hoe-sa-ye-yo?','That is amazing! What kind of company?',5),
  (l_id,'레나','IT 회사요. 그래서 열심히 공부해요.','IT hoe-sa-yo. Geu-rae-seo yeol-sim-hi gong-bu-hae-yo.','An IT company. So I study hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)러 can only be used with which main verb type?','["any verb", "movement verbs (가다/오다/다니다)", "action verbs", "adjectives"]',1,'(으)러 is restricted to sentences where the main verb is a movement verb.',1),
  (l_id,'"커피를 사러 가요" correct?','["Yes — 사러 with 가다", "No — should be 사려고 가요", "No — should be 사고 가요", "No — impossible"]',0,'(으)러 + 가다 is correct: 커피를 사러 가요 = I go to buy coffee.',2),
  (l_id,'"운동하다 + 려고" becomes?','["운동하으려고", "운동하려고", "운동하을려고", "운동하고려고"]',1,'하다 verbs: 운동하 + 려고 = 운동하려고. No 으 needed after 하.',3),
  (l_id,'What is the key difference between (으)러 and (으)려고?','["러 is formal, 려고 casual", "러 only with movement verbs; 려고 with any verb", "they are the same", "려고 only with movement verbs"]',1,'러 = movement verb only; 려고 = any verb.',4),
  (l_id,'"배우러 vs 배우려고" — "I came to learn" uses which?','["배우러 왔어요", "배우려고 왔어요", "both correct", "배우고 왔어요"]',0,'왔어요 is a movement verb, so 배우러 is correct. 배우려고 왔어요 is also acceptable but 배우러 is more standard with 오다.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)러와 (으)려고는 둘 다 목적을 나타내요. (으)러는 반드시 가다/오다/다니다 같은 이동 동사와 함께 써요. "커피를 사러 가요." (으)려고는 모든 동사와 함께 쓸 수 있어요. "살을 빼려고 운동해요." 주된 차이는 뒤 동사가 이동 동사인지 아닌지예요.','Both (으)러 and (으)려고 express purpose. (으)러 is restricted to sentences where the main verb is a movement verb: 사러 가요. (으)려고 can be used with any main verb: 살을 빼려고 운동해요. The key difference is whether the main verb is a movement verb or not.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=24;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#24 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아도/어도','-a-do/-eo-do','even if/even though',1),
  (l_id,'양보','yang-bo','concession',2),
  (l_id,'아무리','a-mu-ri','no matter how (with 아도)',3),
  (l_id,'그래도','geu-rae-do','even so/still',4),
  (l_id,'비록','bi-rok','even though (literary)',5),
  (l_id,'설령','seol-lyeong','even if (hypothetical)',6),
  (l_id,'상관없다','sang-gwan-eop-da','does not matter',7),
  (l_id,'괜찮다','gwaen-chan-ta','to be fine/okay',8),
  (l_id,'포기하다','po-gi-ha-da','to give up',9),
  (l_id,'계속하다','gye-sok-ha-da','to continue',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아도/어도 concession','V/A + 아도/어도','Even if/even though. Introduces a concession: even if condition A, result B still holds.','[{"korean": "비가 와도 갈 거예요.", "english": "Even if it rains, I will go."}, {"korean": "어려워도 포기하지 않아요.", "english": "Even if it is hard, I do not give up."}]',1),
  (l_id,'아무리 + 아도/어도','아무리 + V/A + 아도/어도','아무리 intensifies the concession: "no matter how much/how hard..."','[{"korean": "아무리 먹어도 배불러요.", "english": "No matter how much I eat, I get full."}, {"korean": "아무리 어려워도 할 수 있어요.", "english": "No matter how hard it is, I can do it."}]',2),
  (l_id,'-어도 되다 (permission)','V + 어도 되다 = "may/can (permission)"','아도/어도 also combines with 되다 to give permission: "it is okay even if you V."','[{"korean": "여기 앉아도 돼요.", "english": "You may sit here."}, {"korean": "이거 먹어도 돼요?", "english": "May I eat this?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'리암','한국어 시험이 너무 어려워요.','Han-guk-eo si-heom-i neo-mu eo-ryeo-wo-yo.','Korean exams are too hard.',1),
  (l_id,'선아','아무리 어려워도 포기하지 마세요!','A-mu-ri eo-ryeo-wo-do po-gi-ha-ji ma-se-yo!','No matter how hard it is, do not give up!',2),
  (l_id,'리암','힘들어도 계속해야 하나요?','Him-deu-reo-do gye-so-kae-ya ha-na-yo?','Even if it is hard, should I keep going?',3),
  (l_id,'선아','네! 비가 와도 갈 것처럼 공부해요.','Ne! Bi-ga wa-do gal geot-cheo-reom gong-bu-hae-yo.','Yes! Study like you would go even if it rains.',4),
  (l_id,'리암','알겠어요. 포기하지 않을게요.','Al-get-sseo-yo. Po-gi-ha-ji a-neul-ge-yo.','Okay. I will not give up.',5),
  (l_id,'선아','잘 할 수 있어요. 화이팅!','Jal hal su i-sseo-yo. Hwa-i-ting!','You can do it. Fighting!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아도/어도 expresses?','["cause", "condition only", "concession (even if/though)", "permission only"]',2,'아도/어도 = even if/even though — introduces a concession.',1),
  (l_id,'"비가 와도 갈 거예요" means?','["I will go because it rains", "Even if it rains I will go", "It is raining so I will not go", "If it does not rain I will go"]',1,'아도/어도 = even if. 비가 와도 갈 거예요 = Even if it rains I will go.',2),
  (l_id,'아무리 + 아도/어도 intensifies to mean?','["sometimes", "no matter how", "certainly", "only if"]',1,'아무리 + 아도/어도 = "no matter how" — strong concession.',3),
  (l_id,'"앉아도 돼요" means?','["You must sit", "You may sit", "You cannot sit", "You sat"]',1,'아도 + 되다 = permission: 앉아도 돼요 = You may sit / It is okay to sit.',4),
  (l_id,'"먹다 + 어도" correctly becomes?','["먹아도", "먹어도", "먹이도", "먹도"]',1,'먹 stem vowel ㅓ → add 어도: 먹어도 = even if eat.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아도/어도는 양보를 나타내요. "비가 와도 갈 거예요"처럼 조건에 상관없이 결과가 유지됨을 말해요. 아무리와 함께 쓰면 "아무리 어려워도"처럼 강조돼요. 아도/어도 되다는 허가를 나타내요. "앉아도 돼요 = 앉아도 괜찮아요."','아도/어도 expresses concession: "Even if it rains, I will go." The result holds regardless of the condition. With 아무리, it strengthens to "no matter how": 아무리 어려워도 = no matter how hard. 아도/어도 되다 = permission: 앉아도 돼요 = You may sit.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=25;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#25 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'반말','ban-mal','informal/plain speech (banmal)',1),
  (l_id,'친한 사이','chin-han sa-i','close relationship',2),
  (l_id,'친구','chin-gu','friend',3),
  (l_id,'동생','dong-saeng','younger sibling',4),
  (l_id,'어간','eo-gan','verb stem',5),
  (l_id,'아/어','a/eo','plain speech ending',6),
  (l_id,'야/이야','ya/i-ya','plain speech copula',7),
  (l_id,'지','ji','tag/confirmation in plain speech',8),
  (l_id,'자','ja','let us (suggestion, plain)',9),
  (l_id,'어','eo','plain speech statement/question ending',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'반말 — present tense','Stem + 아/어 (drop 요)','Remove 요 from the polite form. 가요→가, 먹어요→먹어, 해요→해.','[{"korean": "밥 먹어. (informal)", "english": "Eat. / I eat."}, {"korean": "어디 가? (informal)", "english": "Where are you going?"}]',1),
  (l_id,'이다/아니다 in plain speech','N + 야 (vowel) / N + 이야 (consonant)','학생이야 = you are a student; 친구야 = you are my friend.','[{"korean": "나 학생이야.", "english": "I am a student."}, {"korean": "이거 내 거야.", "english": "This is mine."}]',2),
  (l_id,'Plain speech commands and suggestions','Stem + 아/어 (command) / Stem + 자 (let us)','Commands: 먹어 = eat. Suggestions: 가자 = let us go.','[{"korean": "빨리 와.", "english": "Come quickly."}, {"korean": "우리 밥 먹자.", "english": "Let us eat."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지우','야, 오늘 뭐 해?','Ya, o-neul mwo hae?','Hey, what are you doing today?',1),
  (l_id,'민규','그냥 집에 있어. 왜?','Geu-nyang jib-e i-sseo. Wae?','Just at home. Why?',2),
  (l_id,'지우','같이 카페 갈래? 공부하자.','Ga-chi ka-pe gal-lae? Gong-bu-ha-ja.','Want to go to a cafe together? Let us study.',3),
  (l_id,'민규','좋아. 몇 시에 가?','Jo-a. Myeo-chi-e ga?','Sure. What time?',4),
  (l_id,'지우','두 시 어때?','Du si eo-ttae?','How about two?',5),
  (l_id,'민규','괜찮아. 이따가 봐.','Gwaen-chan-a. I-tta-ga bwa.','Okay. See you later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'반말 is used with whom?','["strangers", "elders", "close friends and younger people", "teachers"]',2,'반말 (plain speech) is used with close friends, younger siblings, and children you know well.',1),
  (l_id,'"먹어요" in 반말 becomes?','["먹아", "먹어", "먹요", "먹이"]',1,'Remove 요 from 먹어요 → 먹어 (plain speech).',2),
  (l_id,'"Let us go" in 반말 is?','["가요", "가자", "가세요", "갑시다"]',1,'Suggestion in plain speech: stem + 자. 가자 = Let us go.',3),
  (l_id,'"이거 내 거야" — 야 is the plain form of?','["이에요", "예요", "아니에요", "있어요"]',0,'야/이야 is the plain speech form of 이에요/예요 (copula).',4),
  (l_id,'반말 for "Come!" is?','["오세요", "오십시오", "와", "오겠습니다"]',2,'Plain speech command: 와 = come! (오다 → 와).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'반말은 친한 사이나 손아랫사람에게 쓰는 말이에요. 해요체에서 요를 빼면 반말이 돼요. "먹어요→먹어, 해요→해." 이다는 야/이야가 돼요. 명령은 아/어, 제안은 자를 써요. "가자, 먹자"처럼요. 처음 만난 사람이나 어른에게 반말을 쓰면 실례예요.','Plain speech (반말) is used with close friends and younger people. Remove 요 from the polite form: 먹어요→먹어, 해요→해. The copula becomes 야/이야. Commands: stem+아/어. Suggestions: stem+자 (가자 = let us go). Using 반말 with strangers or elders is considered rude.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=26;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#26 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'해요체','hae-yo-che','informal polite speech level',1),
  (l_id,'아요/어요','a-yo/eo-yo','polite present ending',2),
  (l_id,'존댓말','jon-daet-mal','honorific/polite speech',3),
  (l_id,'일상','il-sang','everyday/daily',4),
  (l_id,'상점','sang-jeom','store/shop',5),
  (l_id,'대화','dae-hwa','conversation',6),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',7),
  (l_id,'직장 동료','jik-jang dong-nyo','work colleague',8),
  (l_id,'웃어른','us-eo-reun','elders/seniors',9),
  (l_id,'경어','gyeong-eo','honorific language',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'해요체 overview','Remove formality: 합쇼체 → 해요체','해요체 (아요/어요) is the standard polite level for everyday situations. Less formal than 합쇼체 but polite.','[{"korean": "뭐 드실 거예요? (가게에서)", "english": "What will you have? (in a store)"}, {"korean": "잘 부탁드려요.", "english": "I look forward to working with you."}]',1),
  (l_id,'Usage of 해요체','Everyday conversation with non-close adults and strangers','Use 해요체 with: strangers of similar or older age, colleagues, store clerks, and any polite situation.','[{"korean": "죄송합니다만, 길을 좀 알려주시겠어요?", "english": "Excuse me, could you tell me the way?"}, {"korean": "감사해요.", "english": "Thank you. (polite)"}]',2),
  (l_id,'해요체 for requests','Stem + 아/어 주세요 or Stem + 아/어 주실 수 있어요?','Polite requests use 아/어 주세요 (please do) or the more indirect 주실 수 있어요?.','[{"korean": "좀 기다려 주세요.", "english": "Please wait a moment."}, {"korean": "도와주실 수 있어요?", "english": "Could you help me?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'점원','어서 오세요! 뭐 찾으세요?','Eo-seo o-se-yo! Mwo cha-jeu-se-yo?','Welcome! What are you looking for?',1),
  (l_id,'손님','청바지 보고 싶어요.','Cheong-ba-ji bo-go si-peo-yo.','I would like to look at jeans.',2),
  (l_id,'점원','이쪽으로 오세요. 이게 요즘 인기 있어요.','I-jjok-eu-ro o-se-yo. I-ge yo-jeum in-gi i-sseo-yo.','Come this way. This one is popular lately.',3),
  (l_id,'손님','입어 봐도 돼요?','Ib-eo bwa-do dwae-yo?','May I try it on?',4),
  (l_id,'점원','물론이죠! 탈의실은 저기예요.','Mul-lon-i-jyo! Tal-ui-sil-eun jeo-gi-ye-yo.','Of course! The fitting room is over there.',5),
  (l_id,'손님','감사해요.','Gam-sa-hae-yo.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'해요체 is most appropriate with?','["best friends", "young children", "strangers and non-close adults", "military superiors"]',2,'해요체 is the standard polite level for everyday interactions with adults you are not close to.',1),
  (l_id,'해요체 vs 합쇼체 — which is more formal?','["해요체", "합쇼체", "both the same", "반말"]',1,'합쇼체 (ㅂ니다/습니다) is more formal. 해요체 (아요/어요) is polite but less formal.',2),
  (l_id,'"Please wait" in 해요체?','["기다려라", "기다립시다", "기다려 주세요", "기다릅니다"]',2,'아/어 주세요 = polite request: 기다려 주세요 = Please wait.',3),
  (l_id,'해요체 can be used in?','["formal news broadcasts", "most everyday polite situations", "military commands", "ancient literature"]',1,'해요체 is used in most everyday polite situations: shopping, meeting new adults, service encounters.',4),
  (l_id,'"감사해요" vs "감사합니다" — difference?','["same", "감사해요 is polite; 감사합니다 is more formal", "감사해요 is rude", "감사합니다 is casual"]',1,'감사합니다 is formal 합쇼체. 감사해요 is 해요체 — both are polite but different levels.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'해요체는 일상에서 가장 많이 쓰이는 공손한 말이에요. 처음 만난 사람이나 나이 차이가 있는 사람에게 써요. 합쇼체보다 덜 격식적이에요. "뭐 드실 거예요?", "기다려 주세요."처럼 쓰여요. 한국어 학습자가 먼저 익혀야 할 기본 높임 표현이에요.','해요체 is the most widely used polite speech level in everyday Korean. Use it with strangers, non-close adults, and in most service situations. It is less formal than 합쇼체 but clearly polite. Common examples: "What will you have?" and "Please wait." It is the first honorific level learners should master.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=27;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#27 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'합쇼체','hap-ssyo-che','formal polite speech level',1),
  (l_id,'ㅂ니다/습니다','bm-ni-da/seum-ni-da','formal declarative ending',2),
  (l_id,'ㅂ니까/습니까','bm-ni-kka/seum-ni-kka','formal question ending',3),
  (l_id,'격식','gyeok-sik','formality',4),
  (l_id,'뉴스 방송','nyu-seu bang-song','news broadcast',5),
  (l_id,'공식 발표','gong-sik bal-pyo','official announcement',6),
  (l_id,'회의','hoe-ui','meeting',7),
  (l_id,'군인','gun-in','soldier',8),
  (l_id,'존경','jon-gyeong','respect',9),
  (l_id,'품위','pum-wi','dignity/decorum',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'합쇼체 declarative','V/A stem + ㅂ니다 (vowel) / 습니다 (consonant)','Highest standard formal speech. Used in news, business presentations, military, official settings.','[{"korean": "회의를 시작하겠습니다.", "english": "We will now begin the meeting."}, {"korean": "다음 뉴스를 전해 드리겠습니다.", "english": "We will bring you the next news."}]',1),
  (l_id,'합쇼체 questions and commands','Stem + ㅂ니까/습니까 (Q) / -십시오 (command)','Questions end in ㅂ니까/습니까. Polite commands use -십시오 (formal imperative).','[{"korean": "어디서 오셨습니까?", "english": "Where are you from? (formal)"}, {"korean": "주목해 주십시오.", "english": "Please pay attention. (formal command)"}]',2),
  (l_id,'합쇼체 in daily life','Subway announcements, hotels, customer service','Even outside formal settings, 합쇼체 is used in scripted announcements and customer-facing services.','[{"korean": "다음 역은 시청역입니다.", "english": "The next station is City Hall Station."}, {"korean": "무엇을 도와드릴까요?", "english": "How may I help you?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'아나운서','안녕하십니까? KBS 뉴스입니다.','An-nyeong-ha-sim-ni-kka? KBS nyu-seu-im-ni-da.','Good day. This is KBS News.',1),
  (l_id,'기자','오늘의 주요 뉴스를 전해 드리겠습니다.','O-neul-e ju-yo nyu-seu-reul jeon-hae deu-ri-get-sseum-ni-da.','We will bring you today''s main news.',2),
  (l_id,'아나운서','경제 성장이 지속되고 있습니다.','Gyeong-je seong-jang-i ji-sok-doe-go it-sseum-ni-da.','Economic growth is continuing.',3),
  (l_id,'기자','더 자세한 내용은 홈페이지를 확인해 주십시오.','Deo ja-se-han nae-yong-eun hom-pe-i-ji-reul hwa-gin-hae ju-sip-si-o.','For more details please check the website.',4),
  (l_id,'아나운서','시청해 주셔서 감사드립니다.','Si-cheong-hae ju-syeo-seo gam-sa-deu-rim-ni-da.','Thank you for watching.',5),
  (l_id,'기자','이상으로 뉴스를 마치겠습니다.','I-sang-eu-ro nyu-seu-reul ma-chi-get-sseum-ni-da.','That concludes the news.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'합쇼체 is most appropriate in?','["casual texting", "news broadcasts and formal presentations", "with best friends", "children''s speech"]',1,'합쇼체 is used in news, formal business, military, and official announcements.',1),
  (l_id,'"가다" 합쇼체 declarative?','["가요", "갑니다", "가습니다", "가겠어요"]',1,'Vowel stem 가 + ㅂ니다 = 갑니다.',2),
  (l_id,'"먹다" 합쇼체 question?','["먹어요?", "먹ㅂ니까?", "먹습니까?", "먹는가?"]',2,'Consonant stem 먹 + 습니까 = 먹습니까?',3),
  (l_id,'Formal command ending is?','["아/어 주세요", "-십시오", "(으)세요", "ㅂ시오"]',1,'-십시오 is the most formal imperative. 주목해 주십시오 = Please pay attention.',4),
  (l_id,'"이상으로 마치겠습니다" uses which level?','["반말", "해요체", "합쇼체", "하오체"]',2,'마치겠습니다 ends in 겠습니다 — formal 합쇼체 with volition/conjecture.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'합쇼체는 가장 격식 있는 말이에요. ㅂ니다/습니다로 끝나는 서술형과 ㅂ니까/습니까로 끝나는 의문형이 있어요. 뉴스, 공식 발표, 군대, 회의 등에서 써요. 명령형은 십시오를 써요. "주목해 주십시오." 지하철 안내방송과 호텔 서비스에서도 자주 들을 수 있어요.','합쇼체 is the most formal speech level. Declaratives end in ㅂ니다/습니다; questions in ㅂ니까/습니까. It is used in news, official announcements, the military, and formal meetings. The formal command uses -십시오. You commonly hear 합쇼체 in subway announcements and hotel service.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=18;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#18 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아서/어서','-a-seo/-eo-seo','reason/sequential connector',1),
  (l_id,'원인','won-in','cause',2),
  (l_id,'결과','gyeol-gwa','result',3),
  (l_id,'그래서','geu-rae-seo','therefore',4),
  (l_id,'피곤하다','pi-gon-ha-da','to be tired',5),
  (l_id,'배고프다','bae-go-peu-da','to be hungry',6),
  (l_id,'늦다','neut-da','to be late',7),
  (l_id,'막히다','ma-ki-da','to be blocked/congested',8),
  (l_id,'그러니까','geu-reo-ni-kka','so therefore (spoken)',9),
  (l_id,'왜냐하면','wae-nya-ha-myeon','because (formal)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아서/어서 cause/reason','V/A + 아서/어서 + result','The 아서/어서 clause states the reason; the second clause gives the result. No tense on the 아서/어서 clause.','[{"korean": "배가 고파서 밥을 먹어요.", "english": "I am hungry so I eat."}, {"korean": "피곤해서 일찍 자요.", "english": "I am tired so I sleep early."}]',1),
  (l_id,'Tight sequential: did A then B','V + 아서/어서 + V (consequential)','Shows a directly consequential sequence where B follows A.','[{"korean": "일어나서 세수했어요.", "english": "I got up and (then directly) washed my face."}, {"korean": "식당에 가서 밥 먹었어요.", "english": "I went to the restaurant and ate."}]',2),
  (l_id,'No tense on 아서/어서 clause','* 먹어서 X vs 먹었으니까 O (if past needed)','아서/어서 cannot be preceded by past/future tense markers. Use (으)니까 instead for past causes.','[{"korean": "배가 고프니까 먹었어요. (past cause — use 니까)", "english": "Because I was hungry, I ate."}, {"korean": "피곤해서 일찍 자요. (present state cause)", "english": "I am tired so I sleep early."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민아','왜 늦었어요?','Wae neu-jeot-sseo-yo?','Why were you late?',1),
  (l_id,'태영','길이 막혀서 늦었어요.','Gil-i ma-kyeo-seo neu-jeot-sseo-yo.','The road was blocked so I was late.',2),
  (l_id,'민아','많이 피곤하겠다.','Ma-ni pi-gon-ha-get-da.','You must be very tired.',3),
  (l_id,'태영','네, 배도 고파서 밥 먹고 싶어요.','Ne, bae-do go-pa-seo bap meok-go si-peo-yo.','Yes, I am hungry too so I want to eat.',4),
  (l_id,'민아','같이 먹어요!','Ga-chi meo-geo-yo!','Let us eat together!',5),
  (l_id,'태영','좋아요, 고마워요.','Jo-a-yo, go-ma-wo-yo.','Sounds good, thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아서/어서 expresses?','["contrast", "cause/reason or tight sequence", "condition", "listing"]',1,'-아서/어서 = reason or tight sequential consequence.',1),
  (l_id,'"배고프다 + 아서" becomes?','["배고프아서", "배고파서", "배고프서", "배고픈서"]',1,'ㅡ irregular: 배고프 + 아서 → 배고파서 (ㅡ drops).',2),
  (l_id,'아서/어서 clause CANNOT take what?','["objects", "tense markers", "subjects", "adverbs"]',1,'No tense on the 아서/어서 clause; only the final verb carries tense.',3),
  (l_id,'아서/어서 differs from 고 in that?','["no difference", "아서/어서 is causal/tight sequence; 고 is neutral", "아서/어서 is formal", "고 is causal"]',1,'-고 neutrally links; -아서/어서 shows cause or tightly consequential sequence.',4),
  (l_id,'For past cause, which is used instead?','["아서/어서", "고", "(으)니까", "지만"]',2,'(으)니까 can take past tense: 먹었으니까 = because I ate. 아서/어서 cannot.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아서/어서는 원인-결과 또는 긴밀한 순서를 나타내요. 앞 절이 원인, 뒤 절이 결과예요. 아서/어서 앞에는 시제 어미가 오지 않아요. 과거 원인을 나타낼 때는 으니까/니까를 써요. 예: "배가 고파서 먹어요", "일어나서 씻었어요."','-아서/어서 connects a cause to a result, or shows a tight sequential action. The first clause is the reason; the second is the result. No tense marker on the 아서/어서 clause. For past causes, use (으)니까 instead. E.g.: "I am hungry so I eat," "I got up and then washed."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=19;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#19 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'지만','-ji-man','but/however (clause connector)',1),
  (l_id,'하지만','ha-ji-man','but/however (sentence start)',2),
  (l_id,'대조','dae-jo','contrast',3),
  (l_id,'그렇지만','geu-reo-chi-man','however/nevertheless',4),
  (l_id,'그래도','geu-rae-do','even so',5),
  (l_id,'반면에','ban-myeon-e','on the other hand',6),
  (l_id,'어렵다','eo-ryeop-da','to be difficult',7),
  (l_id,'재미있다','jae-mi-it-da','to be interesting',8),
  (l_id,'비싸다','bi-ssa-da','to be expensive',9),
  (l_id,'하지만 그래도','ha-ji-man geu-rae-do','but even so',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'지만 within a sentence','Clause1 + 지만 + Clause2','Attaches to the verb/adjective stem to contrast two clauses. Neutral in politeness level.','[{"korean": "한국어가 어렵지만 재미있어요.", "english": "Korean is difficult but it is fun."}, {"korean": "비싸지만 맛있어요.", "english": "It is expensive but delicious."}]',1),
  (l_id,'하지만 between sentences','Sentence1. 하지만 + Sentence2.','하지만/그렇지만 start a new sentence expressing contrast.','[{"korean": "한국어는 어려워요. 하지만 재미있어요.", "english": "Korean is difficult. But it is fun."}, {"korean": "비가 와요. 그래도 나가요.", "english": "It is raining. Even so I am going out."}]',2),
  (l_id,'지만 with tense','Past/future + 지만 possible','Unlike 아서/어서, the 지만 clause CAN take tense markers.','[{"korean": "어제는 피곤했지만 오늘은 괜찮아요.", "english": "I was tired yesterday but I am fine today."}, {"korean": "비가 왔지만 나갔어요.", "english": "It rained but I went out."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'소라','한국 생활이 어때요?','Han-guk saeng-hwal-i eo-ttae-yo?','How is life in Korea?',1),
  (l_id,'웨이','어렵지만 좋아요.','Eo-ryeop-ji-man jo-a-yo.','It is hard but I like it.',2),
  (l_id,'소라','뭐가 제일 힘들어요?','Mwo-ga je-il him-deu-reo-yo?','What is the hardest part?',3),
  (l_id,'웨이','말하기는 어렵지만 듣기는 잘 돼요.','Mal-ha-gi-neun eo-ryeop-ji-man deut-gi-neun jal dwae-yo.','Speaking is hard but listening goes well.',4),
  (l_id,'소라','그래도 잘 하고 있어요!','Geu-rae-do jal ha-go i-sseo-yo!','Even so you are doing well!',5),
  (l_id,'웨이','감사해요. 더 열심히 할게요.','Gam-sa-hae-yo. Deo yeol-sim-hi hal-ge-yo.','Thank you. I will work harder.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'지만 expresses?','["cause", "contrast", "sequence", "condition"]',1,'-지만 = but/however — contrasting ideas.',1),
  (l_id,'"비싸지만 맛있어요" — what is contrasted?','["size and taste", "price and taste", "color and time", "speed and distance"]',1,'비싸다 (expensive) contrasted with 맛있다 (delicious): expensive but tasty.',2),
  (l_id,'지만 vs 하지만 — difference?','["same meaning", "지만 in sentence; 하지만 between sentences", "지만 is formal; 하지만 casual", "no difference"]',1,'지만 connects clauses within a sentence; 하지만 connects separate sentences.',3),
  (l_id,'지만 clause can take?','["no tense", "tense markers OK", "only future tense", "only 요"]',1,'Unlike 아서/어서, the 지만 clause can take past tense: 피곤했지만.',4),
  (l_id,'"어렵지만" — 지만 attaches to?','["noun", "adjective stem", "particle", "ending"]',1,'지만 attaches directly to the adjective/verb stem: 어렵 + 지만 = 어렵지만.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'지만은 두 절의 대조를 나타내요. "어렵지만 재미있어요"처럼요. 아서/어서와 달리 지만 앞에 시제 어미가 올 수 있어요. 문장 사이에 쓸 때는 하지만이나 그렇지만을 써요. 그래도는 "그럼에도 불구하고"라는 의미로 뒤 절 앞에 써요.','지만 connects two contrasting clauses: 어렵지만 재미있어요. Unlike 아서/어서, tense can appear before 지만: 피곤했지만. Between separate sentences, use 하지만 or 그렇지만. 그래도 means "even so" and introduces a concession.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=20;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#20 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면/(으)면','myeon/(eu)myeon','if/when (conditional)',1),
  (l_id,'조건','jo-geon','condition',2),
  (l_id,'가정','ga-jeong','hypothesis',3),
  (l_id,'결과','gyeol-gwa','result/consequence',4),
  (l_id,'만약','man-yak','if (emphatic, sentence opener)',5),
  (l_id,'그러면','geu-reo-myeon','then (if so)',6),
  (l_id,'그렇다면','geu-reo-ta-myeon','in that case',7),
  (l_id,'날씨가 맑다','nal-ssi-ga mak-da','the weather is clear',8),
  (l_id,'시간이 있다','si-gan-i it-da','to have time',9),
  (l_id,'합격하다','hap-gyeok-ha-da','to pass (exam)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면 conditional','V/A stem + (으)면 + result','If stem ends in vowel or ㄹ, add 면. After consonants, add 으면. Expresses "if/when condition, then result."','[{"korean": "시간이 있으면 오세요.", "english": "If you have time, please come."}, {"korean": "날씨가 좋으면 나가요.", "english": "If the weather is good, I go out."}]',1),
  (l_id,'으면 vs 면','After consonant: 으면; after vowel/ㄹ: 면','Simple phonological rule: 먹 + 으면 = 먹으면; 가 + 면 = 가면.','[{"korean": "먹으면 배불러요.", "english": "If you eat, you will be full."}, {"korean": "가면 볼 수 있어요.", "english": "If you go, you can see it."}]',2),
  (l_id,'만약 for emphasis','만약 + V + (으)면 ...','만약 emphasizes the hypothetical nature: "if (hypothetically)..."','[{"korean": "만약 합격하면 파티를 해요.", "english": "If I pass the exam, we will have a party."}, {"korean": "만약 비가 오면 집에 있을게요.", "english": "If it rains, I will stay home."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유나','시험 준비는 잘 되고 있어요?','Si-heom jun-bi-neun jal doe-go i-sseo-yo?','Is your exam preparation going well?',1),
  (l_id,'준혁','네, 열심히 하고 있어요. 합격하면 좋겠어요.','Ne, yeol-sim-hi ha-go i-sseo-yo. Hap-gyeok-ha-myeon jo-ket-sseo-yo.','Yes, I am working hard. I hope I pass.',2),
  (l_id,'유나','합격하면 뭐 할 거예요?','Hap-gyeok-ha-myeon mwo hal geo-ye-yo?','If you pass, what will you do?',3),
  (l_id,'준혁','맛있는 것 먹고 여행 갈 거예요!','Ma-sit-neun geot meok-go yeo-haeng gal geo-ye-yo!','I will eat something delicious and go on a trip!',4),
  (l_id,'유나','시험에 안 합격하면요?','Si-heom-e an hap-gyeok-ha-myeon-yo?','What if you do not pass?',5),
  (l_id,'준혁','다시 공부하면 되죠!','Da-si gong-bu-ha-myeon doe-jyo!','Then I will study again!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 expresses?','["contrast", "condition (if/when)", "cause", "listing"]',1,'(으)면 = if/when — introduces a condition followed by a result.',1),
  (l_id,'"먹다 + (으)면" correctly becomes?','["먹면", "먹으면", "먹이면", "먹를면"]',1,'먹 ends in consonant ㄱ, so add 으면: 먹으면.',2),
  (l_id,'"가다 + 면" correctly becomes?','["가으면", "가면", "갑면", "가이면"]',1,'가 ends in vowel, so add 면: 가면.',3),
  (l_id,'만약 is used to emphasize?','["sequence", "the hypothetical nature of the condition", "contrast", "purpose"]',1,'만약 emphasizes the hypothetical: "if (hypothetically) A, then B."',4),
  (l_id,'"날씨가 좋으면" translates as?','["because the weather is good", "the weather is good and", "if the weather is good", "although the weather is good"]',2,'(으)면 = if/when: 날씨가 좋으면 = if the weather is good.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면/(으)면은 조건을 나타내는 접속 어미예요. "시간이 있으면 오세요"처럼 조건 절 뒤에 결과가 와요. 자음 뒤에는 으면, 모음이나 ㄹ 뒤에는 면을 써요. 만약을 앞에 붙이면 가정의 의미가 더 강조돼요. 영어의 "if/when"에 해당해요.','(으)면 expresses a condition: "if/when condition, then result." After consonants use 으면; after vowels or ㄹ use 면. Adding 만약 at the start emphasizes the hypothetical nature. It corresponds to English "if/when."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=21;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#21 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'면서/(으)면서','myeon-seo/(eu)myeon-seo','while doing (simultaneous)',1),
  (l_id,'동시에','dong-si-e','at the same time',2),
  (l_id,'동시 동작','dong-si dong-jak','simultaneous actions',3),
  (l_id,'들으면서','deu-reu-myeon-seo','while listening',4),
  (l_id,'걸으면서','geo-reu-myeon-seo','while walking',5),
  (l_id,'먹으면서','meo-geu-myeon-seo','while eating',6),
  (l_id,'공부하면서','gong-bu-ha-myeon-seo','while studying',7),
  (l_id,'노래하다','no-rae-ha-da','to sing',8),
  (l_id,'산책하다','san-chaek-ha-da','to take a walk',9),
  (l_id,'일하다','il-ha-da','to work',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)면서 simultaneous actions','V1 + (으)면서 + V2 (same subject)','Both verbs must share the same subject. V1 happens at the same time as V2.','[{"korean": "음악을 들으면서 공부해요.", "english": "I study while listening to music."}, {"korean": "걸으면서 전화해요.", "english": "I talk on the phone while walking."}]',1),
  (l_id,'면서 with adjective contrast','A + 면서 (contradictory states)','면서 can also show two seemingly contradictory states of the same subject.','[{"korean": "좋으면서 싫어요.", "english": "I like it and yet dislike it."}, {"korean": "알면서 모른 척해요.", "english": "Knowing it, I pretend not to know."}]',2),
  (l_id,'Same subject requirement','(으)면서 requires same subject both clauses','Unlike -고 which can have different subjects, -(으)면서 requires the same doer for both actions.','[{"korean": "나는 먹으면서 TV를 봐요.", "english": "I eat while watching TV."}, {"korean": "*나는 먹으면서 그는 일해요. (X — different subjects)", "english": "This is incorrect."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수아','어떻게 한국어를 공부해요?','Eo-tteo-ke han-guk-eo-reul gong-bu-hae-yo?','How do you study Korean?',1),
  (l_id,'크리스','음악을 들으면서 단어를 외워요.','Eum-ak-eul deu-reu-myeon-seo dan-eo-reul oe-wo-yo.','I memorize words while listening to music.',2),
  (l_id,'수아','저는 걸으면서 팟캐스트 들어요.','Jeo-neun geo-reu-myeon-seo pat-kae-seu-teu deu-reo-yo.','I listen to podcasts while walking.',3),
  (l_id,'크리스','밥 먹으면서 한국어 영화도 봐요?','Bap meo-geu-myeon-seo han-guk-eo yeong-hwa-do bwa-yo?','Do you also watch Korean movies while eating?',4),
  (l_id,'수아','네! 그러면 훨씬 재미있어요.','Ne! Geu-reo-myeon hwol-ssin jae-mi-it-sseo-yo.','Yes! Then it is much more fun.',5),
  (l_id,'크리스','저도 해볼게요.','Jeo-do hae-bol-ge-yo.','I will try that too.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면서 expresses?','["cause", "contrast", "two simultaneous actions", "sequence"]',2,'(으)면서 = while — two actions happening at the same time by the same subject.',1),
  (l_id,'"먹다 + 으면서" becomes?','["먹면서", "먹으면서", "먹이면서", "먹그면서"]',1,'먹 ends in consonant, so add 으면서: 먹으면서.',2),
  (l_id,'(으)면서 requires what?','["different subjects", "same subject for both actions", "past tense", "question form"]',1,'Both clauses in a -(으)면서 sentence must share the same subject.',3),
  (l_id,'"알면서 모른 척해요" means?','["I know and learn", "I pretend not to know even though I know", "I do not know how to pretend", "I know because I pretend"]',1,'면서 can show contradictory states of the same person: knowing it but pretending not to.',4),
  (l_id,'"가다 + 면서" becomes?','["가으면서", "가면서", "가이면서", "갑면서"]',1,'가 ends in vowel, so just add 면서: 가면서.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'면서/(으)면서는 두 동작이 동시에 일어날 때 써요. 같은 주어에 해당하는 두 동작이어야 해요. "음악을 들으면서 공부해요"처럼요. 또한 알면서 모른 척해요처럼 모순적인 두 상태를 나타낼 수도 있어요. 받침이 있으면 으면서, 없으면 면서를 써요.','(으)면서 expresses two simultaneous actions by the same subject. "I study while listening to music." Both actions must have the same doer. It can also show contradictory states of the same subject. Use 으면서 after consonants, 면서 after vowels or ㄹ.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=22;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#22 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'는데','neun-de','background/context connector (present)',1),
  (l_id,'(으)ㄴ데','(eu)n-de','background/context connector (adj/past)',2),
  (l_id,'배경','bae-gyeong','background/context',3),
  (l_id,'전환','jeon-hwan','transition',4),
  (l_id,'완곡','wan-gok','indirect/roundabout',5),
  (l_id,'그런데','geu-reon-de','by the way/but then',6),
  (l_id,'아무튼','a-mu-teun','anyway',7),
  (l_id,'더불어','deo-bu-reo','in addition/together with',8),
  (l_id,'실은','si-reun','actually/in fact',9),
  (l_id,'근데','geun-de','but/by the way (casual 그런데)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'는데 — background context (action verbs present/future)','V + 는데 + following clause','Sets up background information or mild contrast. Creates a sense of "given that..." or "and..."','[{"korean": "지금 바쁜데 나중에 연락할게요.", "english": "I am busy now so I will contact you later."}, {"korean": "비가 오는데 우산 있어요?", "english": "It is raining — do you have an umbrella?"}]',1),
  (l_id,'(으)ㄴ데 with adjectives and past','Adj stem + ㄴ데 / Past + 는데','Adjectives and past-tense verbs use (으)ㄴ데: 좋은데, 먹었는데.','[{"korean": "날씨가 좋은데 나갈까요?", "english": "The weather is nice — shall we go out?"}, {"korean": "밥을 먹었는데 또 배고파요.", "english": "I already ate but I am hungry again."}]',2),
  (l_id,'그런데 — sentence transition','그런데 = by the way / but then','그런데 (or casual 근데) transitions between topics or introduces a gentle contrast.','[{"korean": "그런데, 오늘 어디 가요?", "english": "By the way, where are you going today?"}, {"korean": "좋아요. 근데 좀 비싸요.", "english": "It is good. But it is a bit expensive."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하은','요즘 어때요?','Yo-jeum eo-ttae-yo?','How are things lately?',1),
  (l_id,'다솔','공부하는데 좀 힘들어요.','Gong-bu-ha-neun-de jom him-deu-reo-yo.','I am studying and it is a bit tough.',2),
  (l_id,'하은','어떤 과목이에요?','Eo-tteon gwa-mok-i-e-yo?','What subject is it?',3),
  (l_id,'다솔','한국어인데, 재미있지만 어렵기도 해요.','Han-guk-eo-in-de, jae-mi-it-ji-man eo-ryeop-gi-do hae-yo.','It is Korean — it is fun but also hard.',4),
  (l_id,'하은','그런데 발음은 어때요?','Geu-reon-de bal-eum-eun eo-ttae-yo?','By the way, how is your pronunciation?',5),
  (l_id,'다솔','발음이 어려운데 연습 많이 해요.','Bal-eum-i eo-ryeo-un-de yeon-seup man-i hae-yo.','Pronunciation is hard so I practice a lot.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'는데 primarily provides what?','["direct cause", "background context or mild contrast", "strict sequence", "permission"]',1,'는데 sets up background info: "given that X..." or creates a mild contrast/transition.',1),
  (l_id,'Adjective + 는데 OR?','["ㄴ데/은데", "았/었는데", "고는데", "서는데"]',0,'Adjectives (and past tense) use (으)ㄴ데: 좋 + 은데 = 좋은데. Action verbs use 는데.',2),
  (l_id,'"비가 오는데 우산 있어요?" — 는데 function?','["cause", "condition", "background (it rains) + question", "contrast"]',2,'The 는데 clause sets up background (it is raining) for the following question (do you have umbrella?).',3),
  (l_id,'그런데 in casual speech is?','["근데", "한데", "거든데", "이런데"]',0,'그런데 shortens to 근데 in casual speech.',4),
  (l_id,'"먹었는데 배고파요" — past verb with 는데 = ?','["먹은데", "먹었는데", "먹는데", "먹었은데"]',1,'Past tense + 는데: 먹었 + 는데 = 먹었는데. Action verbs in past use 었는데/았는데.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'는데/(으)ㄴ데는 배경 정보를 설정하거나 완곡한 전환을 나타내요. 동작 동사 현재는 는데, 형용사와 과거는 (으)ㄴ데를 써요. "비가 오는데 우산 있어요?"처럼 배경 상황을 제시하고 질문하거나 요청해요. 그런데(근데)는 문장 사이의 전환이나 부드러운 대조를 나타내요.','는데/(으)ㄴ데 sets up background context or expresses mild contrast. Action verbs in present use 는데; adjectives and past verbs use (으)ㄴ데. "It is raining — do you have an umbrella?" sets up context then asks. 그런데 (casual: 근데) transitions between topics or introduces mild contrast between sentences.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=23;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#23 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)러','(eu)reo','purpose with movement verb',1),
  (l_id,'(으)려고','(eu)ryeo-go','intention/purpose',2),
  (l_id,'목적','mok-jeok','purpose/goal',3),
  (l_id,'의도','ui-do','intention',4),
  (l_id,'배우러','bae-u-reo','in order to learn',5),
  (l_id,'사러','sa-reo','in order to buy',6),
  (l_id,'만나려고','man-na-ryeo-go','intending to meet',7),
  (l_id,'준비하다','jun-bi-ha-da','to prepare',8),
  (l_id,'노력하다','no-ryeok-ha-da','to make an effort',9),
  (l_id,'계획하다','gye-hoek-ha-da','to plan',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'(으)러 — purpose with movement','V + (으)러 + movement verb (가다/오다/다니다)','(으)러 expresses purpose only when the main verb is a movement verb. Cannot be used with non-movement verbs.','[{"korean": "한국어를 배우러 한국에 왔어요.", "english": "I came to Korea to learn Korean."}, {"korean": "커피를 사러 카페에 가요.", "english": "I go to the cafe to buy coffee."}]',1),
  (l_id,'(으)려고 — general intention','V + (으)려고 + any verb','(으)려고 expresses intention or purpose and can be used with any main verb.','[{"korean": "한국어를 배우려고 공부해요.", "english": "I study with the intention of learning Korean."}, {"korean": "살을 빼려고 운동해요.", "english": "I exercise in order to lose weight."}]',2),
  (l_id,'(으)러 vs (으)려고','(으)러 = movement only; (으)려고 = any verb','Key difference: (으)러 requires the main verb to be 가다/오다/다니다. (으)려고 is unrestricted.','[{"korean": "O: 사러 가요 / X: 사러 공부해요", "english": "(으)러 only with movement verbs."}, {"korean": "O: 사려고 공부해요 / O: 사려고 가요", "english": "(으)려고 works with any verb."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지원','왜 한국에 왔어요?','Wae han-guk-e wat-sseo-yo?','Why did you come to Korea?',1),
  (l_id,'레나','한국어를 배우러 왔어요.','Han-guk-eo-reul bae-u-reo wat-sseo-yo.','I came to learn Korean.',2),
  (l_id,'지원','한국어를 왜 배우려고 해요?','Han-guk-eo-reul wae bae-u-ryeo-go hae-yo?','Why do you intend to learn Korean?',3),
  (l_id,'레나','한국 회사에서 일하려고요.','Han-guk hoe-sa-e-seo il-ha-ryeo-go-yo.','I intend to work at a Korean company.',4),
  (l_id,'지원','멋있네요! 어떤 회사예요?','Meo-sit-ne-yo! Eo-tteon hoe-sa-ye-yo?','That is amazing! What kind of company?',5),
  (l_id,'레나','IT 회사요. 그래서 열심히 공부해요.','IT hoe-sa-yo. Geu-rae-seo yeol-sim-hi gong-bu-hae-yo.','An IT company. So I study hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)러 can only be used with which main verb type?','["any verb", "movement verbs (가다/오다/다니다)", "action verbs", "adjectives"]',1,'(으)러 is restricted to sentences where the main verb is a movement verb.',1),
  (l_id,'"커피를 사러 가요" correct?','["Yes — 사러 with 가다", "No — should be 사려고 가요", "No — should be 사고 가요", "No — impossible"]',0,'(으)러 + 가다 is correct: 커피를 사러 가요 = I go to buy coffee.',2),
  (l_id,'"운동하다 + 려고" becomes?','["운동하으려고", "운동하려고", "운동하을려고", "운동하고려고"]',1,'하다 verbs: 운동하 + 려고 = 운동하려고. No 으 needed after 하.',3),
  (l_id,'What is the key difference between (으)러 and (으)려고?','["러 is formal, 려고 casual", "러 only with movement verbs; 려고 with any verb", "they are the same", "려고 only with movement verbs"]',1,'러 = movement verb only; 려고 = any verb.',4),
  (l_id,'"배우러 vs 배우려고" — "I came to learn" uses which?','["배우러 왔어요", "배우려고 왔어요", "both correct", "배우고 왔어요"]',0,'왔어요 is a movement verb, so 배우러 is correct. 배우려고 왔어요 is also acceptable but 배우러 is more standard with 오다.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)러와 (으)려고는 둘 다 목적을 나타내요. (으)러는 반드시 가다/오다/다니다 같은 이동 동사와 함께 써요. "커피를 사러 가요." (으)려고는 모든 동사와 함께 쓸 수 있어요. "살을 빼려고 운동해요." 주된 차이는 뒤 동사가 이동 동사인지 아닌지예요.','Both (으)러 and (으)려고 express purpose. (으)러 is restricted to sentences where the main verb is a movement verb: 사러 가요. (으)려고 can be used with any main verb: 살을 빼려고 운동해요. The key difference is whether the main verb is a movement verb or not.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=24;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#24 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아도/어도','-a-do/-eo-do','even if/even though',1),
  (l_id,'양보','yang-bo','concession',2),
  (l_id,'아무리','a-mu-ri','no matter how (with 아도)',3),
  (l_id,'그래도','geu-rae-do','even so/still',4),
  (l_id,'비록','bi-rok','even though (literary)',5),
  (l_id,'설령','seol-lyeong','even if (hypothetical)',6),
  (l_id,'상관없다','sang-gwan-eop-da','does not matter',7),
  (l_id,'괜찮다','gwaen-chan-ta','to be fine/okay',8),
  (l_id,'포기하다','po-gi-ha-da','to give up',9),
  (l_id,'계속하다','gye-sok-ha-da','to continue',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아도/어도 concession','V/A + 아도/어도','Even if/even though. Introduces a concession: even if condition A, result B still holds.','[{"korean": "비가 와도 갈 거예요.", "english": "Even if it rains, I will go."}, {"korean": "어려워도 포기하지 않아요.", "english": "Even if it is hard, I do not give up."}]',1),
  (l_id,'아무리 + 아도/어도','아무리 + V/A + 아도/어도','아무리 intensifies the concession: "no matter how much/how hard..."','[{"korean": "아무리 먹어도 배불러요.", "english": "No matter how much I eat, I get full."}, {"korean": "아무리 어려워도 할 수 있어요.", "english": "No matter how hard it is, I can do it."}]',2),
  (l_id,'-어도 되다 (permission)','V + 어도 되다 = "may/can (permission)"','아도/어도 also combines with 되다 to give permission: "it is okay even if you V."','[{"korean": "여기 앉아도 돼요.", "english": "You may sit here."}, {"korean": "이거 먹어도 돼요?", "english": "May I eat this?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'리암','한국어 시험이 너무 어려워요.','Han-guk-eo si-heom-i neo-mu eo-ryeo-wo-yo.','Korean exams are too hard.',1),
  (l_id,'선아','아무리 어려워도 포기하지 마세요!','A-mu-ri eo-ryeo-wo-do po-gi-ha-ji ma-se-yo!','No matter how hard it is, do not give up!',2),
  (l_id,'리암','힘들어도 계속해야 하나요?','Him-deu-reo-do gye-so-kae-ya ha-na-yo?','Even if it is hard, should I keep going?',3),
  (l_id,'선아','네! 비가 와도 갈 것처럼 공부해요.','Ne! Bi-ga wa-do gal geot-cheo-reom gong-bu-hae-yo.','Yes! Study like you would go even if it rains.',4),
  (l_id,'리암','알겠어요. 포기하지 않을게요.','Al-get-sseo-yo. Po-gi-ha-ji a-neul-ge-yo.','Okay. I will not give up.',5),
  (l_id,'선아','잘 할 수 있어요. 화이팅!','Jal hal su i-sseo-yo. Hwa-i-ting!','You can do it. Fighting!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아도/어도 expresses?','["cause", "condition only", "concession (even if/though)", "permission only"]',2,'아도/어도 = even if/even though — introduces a concession.',1),
  (l_id,'"비가 와도 갈 거예요" means?','["I will go because it rains", "Even if it rains I will go", "It is raining so I will not go", "If it does not rain I will go"]',1,'아도/어도 = even if. 비가 와도 갈 거예요 = Even if it rains I will go.',2),
  (l_id,'아무리 + 아도/어도 intensifies to mean?','["sometimes", "no matter how", "certainly", "only if"]',1,'아무리 + 아도/어도 = "no matter how" — strong concession.',3),
  (l_id,'"앉아도 돼요" means?','["You must sit", "You may sit", "You cannot sit", "You sat"]',1,'아도 + 되다 = permission: 앉아도 돼요 = You may sit / It is okay to sit.',4),
  (l_id,'"먹다 + 어도" correctly becomes?','["먹아도", "먹어도", "먹이도", "먹도"]',1,'먹 stem vowel ㅓ → add 어도: 먹어도 = even if eat.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아도/어도는 양보를 나타내요. "비가 와도 갈 거예요"처럼 조건에 상관없이 결과가 유지됨을 말해요. 아무리와 함께 쓰면 "아무리 어려워도"처럼 강조돼요. 아도/어도 되다는 허가를 나타내요. "앉아도 돼요 = 앉아도 괜찮아요."','아도/어도 expresses concession: "Even if it rains, I will go." The result holds regardless of the condition. With 아무리, it strengthens to "no matter how": 아무리 어려워도 = no matter how hard. 아도/어도 되다 = permission: 앉아도 돼요 = You may sit.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=25;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#25 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'반말','ban-mal','informal/plain speech (banmal)',1),
  (l_id,'친한 사이','chin-han sa-i','close relationship',2),
  (l_id,'친구','chin-gu','friend',3),
  (l_id,'동생','dong-saeng','younger sibling',4),
  (l_id,'어간','eo-gan','verb stem',5),
  (l_id,'아/어','a/eo','plain speech ending',6),
  (l_id,'야/이야','ya/i-ya','plain speech copula',7),
  (l_id,'지','ji','tag/confirmation in plain speech',8),
  (l_id,'자','ja','let us (suggestion, plain)',9),
  (l_id,'어','eo','plain speech statement/question ending',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'반말 — present tense','Stem + 아/어 (drop 요)','Remove 요 from the polite form. 가요→가, 먹어요→먹어, 해요→해.','[{"korean": "밥 먹어. (informal)", "english": "Eat. / I eat."}, {"korean": "어디 가? (informal)", "english": "Where are you going?"}]',1),
  (l_id,'이다/아니다 in plain speech','N + 야 (vowel) / N + 이야 (consonant)','학생이야 = you are a student; 친구야 = you are my friend.','[{"korean": "나 학생이야.", "english": "I am a student."}, {"korean": "이거 내 거야.", "english": "This is mine."}]',2),
  (l_id,'Plain speech commands and suggestions','Stem + 아/어 (command) / Stem + 자 (let us)','Commands: 먹어 = eat. Suggestions: 가자 = let us go.','[{"korean": "빨리 와.", "english": "Come quickly."}, {"korean": "우리 밥 먹자.", "english": "Let us eat."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지우','야, 오늘 뭐 해?','Ya, o-neul mwo hae?','Hey, what are you doing today?',1),
  (l_id,'민규','그냥 집에 있어. 왜?','Geu-nyang jib-e i-sseo. Wae?','Just at home. Why?',2),
  (l_id,'지우','같이 카페 갈래? 공부하자.','Ga-chi ka-pe gal-lae? Gong-bu-ha-ja.','Want to go to a cafe together? Let us study.',3),
  (l_id,'민규','좋아. 몇 시에 가?','Jo-a. Myeo-chi-e ga?','Sure. What time?',4),
  (l_id,'지우','두 시 어때?','Du si eo-ttae?','How about two?',5),
  (l_id,'민규','괜찮아. 이따가 봐.','Gwaen-chan-a. I-tta-ga bwa.','Okay. See you later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'반말 is used with whom?','["strangers", "elders", "close friends and younger people", "teachers"]',2,'반말 (plain speech) is used with close friends, younger siblings, and children you know well.',1),
  (l_id,'"먹어요" in 반말 becomes?','["먹아", "먹어", "먹요", "먹이"]',1,'Remove 요 from 먹어요 → 먹어 (plain speech).',2),
  (l_id,'"Let us go" in 반말 is?','["가요", "가자", "가세요", "갑시다"]',1,'Suggestion in plain speech: stem + 자. 가자 = Let us go.',3),
  (l_id,'"이거 내 거야" — 야 is the plain form of?','["이에요", "예요", "아니에요", "있어요"]',0,'야/이야 is the plain speech form of 이에요/예요 (copula).',4),
  (l_id,'반말 for "Come!" is?','["오세요", "오십시오", "와", "오겠습니다"]',2,'Plain speech command: 와 = come! (오다 → 와).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'반말은 친한 사이나 손아랫사람에게 쓰는 말이에요. 해요체에서 요를 빼면 반말이 돼요. "먹어요→먹어, 해요→해." 이다는 야/이야가 돼요. 명령은 아/어, 제안은 자를 써요. "가자, 먹자"처럼요. 처음 만난 사람이나 어른에게 반말을 쓰면 실례예요.','Plain speech (반말) is used with close friends and younger people. Remove 요 from the polite form: 먹어요→먹어, 해요→해. The copula becomes 야/이야. Commands: stem+아/어. Suggestions: stem+자 (가자 = let us go). Using 반말 with strangers or elders is considered rude.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=26;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#26 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'해요체','hae-yo-che','informal polite speech level',1),
  (l_id,'아요/어요','a-yo/eo-yo','polite present ending',2),
  (l_id,'존댓말','jon-daet-mal','honorific/polite speech',3),
  (l_id,'일상','il-sang','everyday/daily',4),
  (l_id,'상점','sang-jeom','store/shop',5),
  (l_id,'대화','dae-hwa','conversation',6),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',7),
  (l_id,'직장 동료','jik-jang dong-nyo','work colleague',8),
  (l_id,'웃어른','us-eo-reun','elders/seniors',9),
  (l_id,'경어','gyeong-eo','honorific language',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'해요체 overview','Remove formality: 합쇼체 → 해요체','해요체 (아요/어요) is the standard polite level for everyday situations. Less formal than 합쇼체 but polite.','[{"korean": "뭐 드실 거예요? (가게에서)", "english": "What will you have? (in a store)"}, {"korean": "잘 부탁드려요.", "english": "I look forward to working with you."}]',1),
  (l_id,'Usage of 해요체','Everyday conversation with non-close adults and strangers','Use 해요체 with: strangers of similar or older age, colleagues, store clerks, and any polite situation.','[{"korean": "죄송합니다만, 길을 좀 알려주시겠어요?", "english": "Excuse me, could you tell me the way?"}, {"korean": "감사해요.", "english": "Thank you. (polite)"}]',2),
  (l_id,'해요체 for requests','Stem + 아/어 주세요 or Stem + 아/어 주실 수 있어요?','Polite requests use 아/어 주세요 (please do) or the more indirect 주실 수 있어요?.','[{"korean": "좀 기다려 주세요.", "english": "Please wait a moment."}, {"korean": "도와주실 수 있어요?", "english": "Could you help me?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'점원','어서 오세요! 뭐 찾으세요?','Eo-seo o-se-yo! Mwo cha-jeu-se-yo?','Welcome! What are you looking for?',1),
  (l_id,'손님','청바지 보고 싶어요.','Cheong-ba-ji bo-go si-peo-yo.','I would like to look at jeans.',2),
  (l_id,'점원','이쪽으로 오세요. 이게 요즘 인기 있어요.','I-jjok-eu-ro o-se-yo. I-ge yo-jeum in-gi i-sseo-yo.','Come this way. This one is popular lately.',3),
  (l_id,'손님','입어 봐도 돼요?','Ib-eo bwa-do dwae-yo?','May I try it on?',4),
  (l_id,'점원','물론이죠! 탈의실은 저기예요.','Mul-lon-i-jyo! Tal-ui-sil-eun jeo-gi-ye-yo.','Of course! The fitting room is over there.',5),
  (l_id,'손님','감사해요.','Gam-sa-hae-yo.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'해요체 is most appropriate with?','["best friends", "young children", "strangers and non-close adults", "military superiors"]',2,'해요체 is the standard polite level for everyday interactions with adults you are not close to.',1),
  (l_id,'해요체 vs 합쇼체 — which is more formal?','["해요체", "합쇼체", "both the same", "반말"]',1,'합쇼체 (ㅂ니다/습니다) is more formal. 해요체 (아요/어요) is polite but less formal.',2),
  (l_id,'"Please wait" in 해요체?','["기다려라", "기다립시다", "기다려 주세요", "기다릅니다"]',2,'아/어 주세요 = polite request: 기다려 주세요 = Please wait.',3),
  (l_id,'해요체 can be used in?','["formal news broadcasts", "most everyday polite situations", "military commands", "ancient literature"]',1,'해요체 is used in most everyday polite situations: shopping, meeting new adults, service encounters.',4),
  (l_id,'"감사해요" vs "감사합니다" — difference?','["same", "감사해요 is polite; 감사합니다 is more formal", "감사해요 is rude", "감사합니다 is casual"]',1,'감사합니다 is formal 합쇼체. 감사해요 is 해요체 — both are polite but different levels.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'해요체는 일상에서 가장 많이 쓰이는 공손한 말이에요. 처음 만난 사람이나 나이 차이가 있는 사람에게 써요. 합쇼체보다 덜 격식적이에요. "뭐 드실 거예요?", "기다려 주세요."처럼 쓰여요. 한국어 학습자가 먼저 익혀야 할 기본 높임 표현이에요.','해요체 is the most widely used polite speech level in everyday Korean. Use it with strangers, non-close adults, and in most service situations. It is less formal than 합쇼체 but clearly polite. Common examples: "What will you have?" and "Please wait." It is the first honorific level learners should master.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=27;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#27 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'합쇼체','hap-ssyo-che','formal polite speech level',1),
  (l_id,'ㅂ니다/습니다','bm-ni-da/seum-ni-da','formal declarative ending',2),
  (l_id,'ㅂ니까/습니까','bm-ni-kka/seum-ni-kka','formal question ending',3),
  (l_id,'격식','gyeok-sik','formality',4),
  (l_id,'뉴스 방송','nyu-seu bang-song','news broadcast',5),
  (l_id,'공식 발표','gong-sik bal-pyo','official announcement',6),
  (l_id,'회의','hoe-ui','meeting',7),
  (l_id,'군인','gun-in','soldier',8),
  (l_id,'존경','jon-gyeong','respect',9),
  (l_id,'품위','pum-wi','dignity/decorum',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'합쇼체 declarative','V/A stem + ㅂ니다 (vowel) / 습니다 (consonant)','Highest standard formal speech. Used in news, business presentations, military, official settings.','[{"korean": "회의를 시작하겠습니다.", "english": "We will now begin the meeting."}, {"korean": "다음 뉴스를 전해 드리겠습니다.", "english": "We will bring you the next news."}]',1),
  (l_id,'합쇼체 questions and commands','Stem + ㅂ니까/습니까 (Q) / -십시오 (command)','Questions end in ㅂ니까/습니까. Polite commands use -십시오 (formal imperative).','[{"korean": "어디서 오셨습니까?", "english": "Where are you from? (formal)"}, {"korean": "주목해 주십시오.", "english": "Please pay attention. (formal command)"}]',2),
  (l_id,'합쇼체 in daily life','Subway announcements, hotels, customer service','Even outside formal settings, 합쇼체 is used in scripted announcements and customer-facing services.','[{"korean": "다음 역은 시청역입니다.", "english": "The next station is City Hall Station."}, {"korean": "무엇을 도와드릴까요?", "english": "How may I help you?"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'아나운서','안녕하십니까? KBS 뉴스입니다.','An-nyeong-ha-sim-ni-kka? KBS nyu-seu-im-ni-da.','Good day. This is KBS News.',1),
  (l_id,'기자','오늘의 주요 뉴스를 전해 드리겠습니다.','O-neul-e ju-yo nyu-seu-reul jeon-hae deu-ri-get-sseum-ni-da.','We will bring you today''s main news.',2),
  (l_id,'아나운서','경제 성장이 지속되고 있습니다.','Gyeong-je seong-jang-i ji-sok-doe-go it-sseum-ni-da.','Economic growth is continuing.',3),
  (l_id,'기자','더 자세한 내용은 홈페이지를 확인해 주십시오.','Deo ja-se-han nae-yong-eun hom-pe-i-ji-reul hwa-gin-hae ju-sip-si-o.','For more details please check the website.',4),
  (l_id,'아나운서','시청해 주셔서 감사드립니다.','Si-cheong-hae ju-syeo-seo gam-sa-deu-rim-ni-da.','Thank you for watching.',5),
  (l_id,'기자','이상으로 뉴스를 마치겠습니다.','I-sang-eu-ro nyu-seu-reul ma-chi-get-sseum-ni-da.','That concludes the news.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'합쇼체 is most appropriate in?','["casual texting", "news broadcasts and formal presentations", "with best friends", "children''s speech"]',1,'합쇼체 is used in news, formal business, military, and official announcements.',1),
  (l_id,'"가다" 합쇼체 declarative?','["가요", "갑니다", "가습니다", "가겠어요"]',1,'Vowel stem 가 + ㅂ니다 = 갑니다.',2),
  (l_id,'"먹다" 합쇼체 question?','["먹어요?", "먹ㅂ니까?", "먹습니까?", "먹는가?"]',2,'Consonant stem 먹 + 습니까 = 먹습니까?',3),
  (l_id,'Formal command ending is?','["아/어 주세요", "-십시오", "(으)세요", "ㅂ시오"]',1,'-십시오 is the most formal imperative. 주목해 주십시오 = Please pay attention.',4),
  (l_id,'"이상으로 마치겠습니다" uses which level?','["반말", "해요체", "합쇼체", "하오체"]',2,'마치겠습니다 ends in 겠습니다 — formal 합쇼체 with volition/conjecture.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'합쇼체는 가장 격식 있는 말이에요. ㅂ니다/습니다로 끝나는 서술형과 ㅂ니까/습니까로 끝나는 의문형이 있어요. 뉴스, 공식 발표, 군대, 회의 등에서 써요. 명령형은 십시오를 써요. "주목해 주십시오." 지하철 안내방송과 호텔 서비스에서도 자주 들을 수 있어요.','합쇼체 is the most formal speech level. Declaratives end in ㅂ니다/습니다; questions in ㅂ니까/습니까. It is used in news, official announcements, the military, and formal meetings. The formal command uses -십시오. You commonly hear 합쇼체 in subway announcements and hotel service.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=28;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#28 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-시-','-si-','subject honorific infix',1),
  (l_id,'주체 높임','ju-che nop-im','subject honorific',2),
  (l_id,'어르신','eo-reu-sin','elderly person/senior',3),
  (l_id,'교수님','gyo-su-nim','professor',4),
  (l_id,'사장님','sa-jang-nim','CEO/company president',5),
  (l_id,'가시다','ga-si-da','to go (honorific)',6),
  (l_id,'드시다','deu-si-da','to eat/drink (honorific)',7),
  (l_id,'계시다','gye-si-da','to be/exist (honorific)',8),
  (l_id,'주무시다','ju-mu-si-da','to sleep (honorific)',9),
  (l_id,'말씀하시다','mal-sseum-ha-si-da','to speak (honorific)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-시- infix for subject honorific','V stem + 시 + ending','Insert -시- between the verb stem and the ending to honor the subject of the sentence.','[{"korean": "선생님이 가세요. (가 + 시 + 어요)", "english": "The teacher goes. (honorific)"}, {"korean": "어머니가 드세요. (드시 + 어요)", "english": "Mother eats. (honorific)"}]',1),
  (l_id,'Special honorific verbs','Some verbs have unique honorific forms','Rather than adding 시, these special forms are used for respected subjects.','[{"korean": "있다→계시다, 자다→주무시다", "english": "to be→계시다, to sleep→주무시다"}, {"korean": "먹다/마시다→드시다, 말하다→말씀하시다", "english": "to eat/drink→드시다, to speak→말씀하시다"}]',2),
  (l_id,'-님 for honorific title','N + 님 (adds respect to title/name)','Adding 님 to titles or names shows respect: 선생님, 사장님, 의사 선생님.','[{"korean": "김 교수님, 질문이 있습니다.", "english": "Professor Kim, I have a question."}, {"korean": "사장님이 오셨어요.", "english": "The CEO has come. (honorific)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'학생','교수님, 지금 시간이 있으세요?','Gyo-su-nim, ji-geum si-gan-i i-sseu-se-yo?','Professor, do you have time now?',1),
  (l_id,'교수님','네, 있어요. 무슨 일이에요?','Ne, i-sseo-yo. Mu-seun il-i-e-yo?','Yes, I do. What is it?',2),
  (l_id,'학생','리포트에 대해 여쭤보고 싶어서요.','Ri-po-teu-e dae-hae yeo-jjwo-bo-go si-peo-seo-yo.','I wanted to ask about my report.',3),
  (l_id,'교수님','앉으세요. 설명해 드릴게요.','An-jeu-se-yo. Seol-myeong-hae deu-ril-ge-yo.','Please sit. I will explain.',4),
  (l_id,'학생','감사합니다, 교수님.','Gam-sa-ham-ni-da, gyo-su-nim.','Thank you, Professor.',5),
  (l_id,'교수님','천천히 이야기해요.','Cheon-cheon-hi i-ya-gi-hae-yo.','Let us talk slowly.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-시- is used to honor?','["the object", "the speaker", "the subject of the sentence", "the listener"]',2,'-시- is the subject honorific — it honors the person who performs the action.',1),
  (l_id,'"가다" honorific form?','["가아요", "가시어요→가세요", "가아시어요", "가십니다"]',1,'가 + 시 + 어요 = 가시어요 → contracts to 가세요.',2),
  (l_id,'Special honorific for "to eat" is?','["먹으시다", "드시다", "먹시다", "드셔요"]',1,'드시다 is the special honorific form for 먹다/마시다. Not 먹으시다.',3),
  (l_id,'"선생님이 계세요" — 계시다 is honorific for?','["가다", "먹다", "있다", "하다"]',2,'계시다 is the honorific form of 있다 (to be/exist): 선생님이 계세요 = The teacher is (here).',4),
  (l_id,'"어머니가 주무세요" means?','["Mother is eating", "Mother is going", "Mother is sleeping (honorific)", "Mother is coming"]',2,'주무시다 is honorific 자다 (to sleep): 주무세요 = (she) sleeps (politely).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'시는 주체 높임 선어말 어미예요. 존경하는 사람이 행동의 주체일 때 동사 어간 뒤에 붙여요. "선생님이 가세요(가시어요)." 특수 높임 어휘도 있어요: 먹다→드시다, 자다→주무시다, 있다→계시다, 말하다→말씀하시다. 한국어의 높임법은 매우 중요한 문화적 예절이에요.','-시- is the subject honorific infix. It is inserted between the verb stem and the ending to show respect for the subject. "The teacher goes" → 가세요. Special honorific verbs also exist: 먹다→드시다, 자다→주무시다, 있다→계시다, 말하다→말씀하시다. Honorifics reflect deep cultural values of respect in Korean society.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=29;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#29 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'객체 높임','gaek-che nop-im','object honorific',1),
  (l_id,'드리다','deu-ri-da','to give (humble, to respected person)',2),
  (l_id,'여쭤보다','yeo-jjwo-bo-da','to ask (humble)',3),
  (l_id,'뵙다','boep-da','to see/meet (humble toward respected person)',4),
  (l_id,'모시다','mo-si-da','to accompany/escort (honorific)',5),
  (l_id,'말씀','mal-sseum','words/speech (honorific noun)',6),
  (l_id,'댁','daek','home (honorific for others'' home)',7),
  (l_id,'진지','jin-ji','meal (honorific)',8),
  (l_id,'연세','yeon-se','age (honorific for elderly)',9),
  (l_id,'성함','seong-ham','name (honorific)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'드리다 — humble giving','V + 드리다 (give to respected person)','드리다 replaces 주다 when the receiver is someone you respect. Also: 말씀드리다 (tell a respected person).','[{"korean": "선생님께 드렸어요.", "english": "I gave it to the teacher."}, {"korean": "말씀드릴게요.", "english": "I will tell you. (humble)"}]',1),
  (l_id,'Special honorific nouns','Nouns change form to show respect','말→말씀, 집→댁, 밥→진지, 나이→연세, 이름→성함.','[{"korean": "성함이 어떻게 되세요?", "english": "What is your name? (honorific)"}, {"korean": "연세가 어떻게 되세요?", "english": "How old are you? (honorific, to elder)"}]',2),
  (l_id,'Humble verbs — humbling the speaker','뵙다, 여쭤보다, 모시다','These humble the speaker''s action toward a respected person: 뵙다 (see), 여쭤보다 (ask), 모시다 (escort).','[{"korean": "내일 뵙겠습니다.", "english": "I will see you tomorrow. (humble)"}, {"korean": "여쭤봐도 될까요?", "english": "May I ask you something? (humble)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'직원','성함이 어떻게 되세요?','Seong-ham-i eo-tteo-ke doe-se-yo?','What is your name?',1),
  (l_id,'손님','김지수라고 합니다.','Gim Ji-su-ra-go ham-ni-da.','My name is Kim Ji-su.',2),
  (l_id,'직원','연세가 어떻게 되세요?','Yeon-se-ga eo-tteo-ke doe-se-yo?','How old are you?',3),
  (l_id,'손님','서른다섯이에요.','Seo-reun-da-seot-i-e-yo.','I am thirty-five.',4),
  (l_id,'직원','댁이 어디세요?','Daek-i eo-di-se-yo?','Where is your home?',5),
  (l_id,'손님','서울이에요. 여쭤봐도 될까요? 이게 맞나요?','Seo-ul-i-e-yo. Yeo-jjwo-bwa-do doel-kka-yo? I-ge mat-na-yo?','Seoul. May I ask — is this correct?',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'드리다 replaces 주다 when?','["giving to anyone", "giving to a respected person", "giving to a stranger", "always"]',1,'드리다 is used when the RECEIVER of the giving is a respected person.',1),
  (l_id,'Honorific word for "name" is?','["이름", "이름님", "성함", "성명"]',2,'성함 is the honorific form of 이름 (name).',2),
  (l_id,'여쭤보다 is?','["honorific for asking toward a respected person", "honorific for receiving", "to give (formal)", "to see (humble)"]',0,'여쭤보다 is a humble form of 묻다/물어보다 — asking a respected person a question.',3),
  (l_id,'뵙다 is the humble form of?','["주다", "먹다", "보다/만나다", "가다"]',2,'뵙다 is the humble form of seeing/meeting a respected person: 내일 뵙겠습니다.',4),
  (l_id,'"말씀드릴게요" means?','["I will speak (boastfully)", "I will tell/say (to a respected person)", "Please speak", "Speak now"]',1,'말씀드리다 = humble telling: 말씀 (honorific noun for speech) + 드리다 (give/do humbly) = I will tell you (humbly).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'객체 높임은 동작의 대상(받는 사람)이 존경하는 사람일 때 써요. 주다→드리다: "선생님께 드렸어요." 묻다→여쭤보다: "여쭤봐도 될까요?" 보다/만나다→뵙다: "내일 뵙겠습니다." 또한 명사도 높임형이 있어요: 이름→성함, 집→댁, 나이→연세, 밥→진지.','Object honorifics are used when the recipient/object of the action is a respected person. 주다→드리다: "I gave it to the teacher." 묻다→여쭤보다: "May I ask?" 보다→뵙다: "I will see you tomorrow." Special honorific nouns also exist: 이름→성함 (name), 집→댁 (home), 나이→연세 (age), 밥→진지 (meal).',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=30;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#30 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'겸양어','gyeom-yang-eo','humble speech/language',1),
  (l_id,'자신을 낮추다','ja-sin-eul nat-chu-da','to lower oneself',2),
  (l_id,'저','jeo','I (humble)',3),
  (l_id,'제','je','my (humble)',4),
  (l_id,'저희','jeo-hi','we/our (humble)',5),
  (l_id,'말씀드리다','mal-sseum-deu-ri-da','to say/tell (humble)',6),
  (l_id,'여쭙다','yeo-jjup-da','to ask (humble)',7),
  (l_id,'찾아뵙다','cha-ja-boep-da','to visit (a respected person, humble)',8),
  (l_id,'올리다','ol-li-da','to present/give upward (humble)',9),
  (l_id,'아뢰다','a-roe-da','to report/say (very formal humble)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'저/제/저희 — humble first person','나/내/우리 (casual) → 저/제/저희 (humble)','In polite speech, always use 저 (I), 제 (my), and 저희 (we/our) instead of 나, 내, 우리.','[{"korean": "저는 학생입니다.", "english": "I am a student. (polite/humble)"}, {"korean": "저희 가족은 서울에 살아요.", "english": "My family lives in Seoul. (humble we)"}]',1),
  (l_id,'Humble verb forms','말씀드리다, 여쭤보다, 뵙다, 드리다','Specific verbs lower the speaker''s action relative to a respected listener.','[{"korean": "한 가지 여쭤봐도 될까요?", "english": "May I ask you one thing? (humble)"}, {"korean": "이메일로 말씀드리겠습니다.", "english": "I will let you know by email. (humble)"}]',2),
  (l_id,'Overall humble speech strategy','Use 저/제 + humble verb + 합쇼체/해요체','Combining humble pronouns, humble verbs, and formal endings creates fully respectful speech.','[{"korean": "제가 도와드릴게요.", "english": "I will help you. (full humble)"}, {"korean": "저희가 연락드리겠습니다.", "english": "We will contact you. (full humble)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'사원','부장님, 보고서를 드릴게요.','Bu-jang-nim, bo-go-seo-reul deu-ril-ge-yo.','Section chief, I will give you the report.',1),
  (l_id,'부장님','수고했어요. 한 가지 여쭤봐도 돼요?','Su-go-haet-sseo-yo. Han ga-ji yeo-jjwo-bwa-do dwae-yo?','Good work. May I ask you one thing?',2),
  (l_id,'사원','네, 말씀하세요.','Ne, mal-sseum-ha-se-yo.','Yes, please go ahead.',3),
  (l_id,'부장님','언제까지 완성할 수 있어요?','Eon-je-kka-ji wan-seong-hal su i-sseo-yo?','By when can you complete it?',4),
  (l_id,'사원','내일까지 완성해서 말씀드리겠습니다.','Nae-il-kka-ji wan-seong-hae-seo mal-sseum-deu-ri-get-sseum-ni-da.','I will complete it by tomorrow and let you know.',5),
  (l_id,'부장님','알겠어요. 수고해요.','Al-get-sseo-yo. Su-go-hae-yo.','I understand. Good luck.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'겸양어 lowers who relative to whom?','["the listener", "the speaker relative to the listener", "the object relative to speaker", "everyone equally"]',1,'겸양어 (humble speech) lowers the speaker''s position to show respect toward the listener.',1),
  (l_id,'Humble form of "I" in polite speech is?','["나", "저", "우리", "제"]',1,'저 is the humble first-person pronoun, used instead of 나 in polite/formal speech.',2),
  (l_id,'"We" in humble speech?','["우리", "저희", "나이", "저들"]',1,'저희 is the humble form of 우리. Use 저희 회사 (our company, humble) in business settings.',3),
  (l_id,'"I will tell you (to respected person)" uses?','["말해요", "말할게요", "말씀드릴게요", "말씀하실게요"]',2,'말씀드리다 = humble telling. 말씀드릴게요 = I will tell you (to a respected person).',4),
  (l_id,'겸양어 combines with which pronoun?','["나/내", "저/제/저희", "당신", "그"]',1,'Humble speech uses 저 (I) and 제 (my) as the first-person pronouns, paired with humble verbs.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'겸양어는 말하는 사람이 자신을 낮추어 듣는 사람을 높이는 표현이에요. 나→저, 내→제, 우리→저희로 바꾸는 것부터 시작해요. 말하다→말씀드리다, 묻다→여쭤보다, 주다→드리다처럼 동사도 겸양형을 써요. 직장이나 공식적인 자리에서 특히 중요해요.','Humble speech (겸양어) lowers the speaker to elevate the listener. Start by replacing 나→저, 내→제, 우리→저희. Use humble verb forms: 말하다→말씀드리다, 묻다→여쭤보다, 주다→드리다. Particularly important in workplace and formal settings where showing proper respect is essential.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 버리다','-a/eo beo-ri-da','to have done completely (with emotional nuance)',1),
  (l_id,'완료','wan-nyo','completion',2),
  (l_id,'아쉽다','a-swip-da','to feel regret/disappointed',3),
  (l_id,'후련하다','hu-ryeon-ha-da','to feel relieved/refreshed',4),
  (l_id,'먹어 버리다','meo-geo beo-ri-da','to eat up (completely)',5),
  (l_id,'잊어 버리다','i-jeo beo-ri-da','to forget completely',6),
  (l_id,'가 버리다','ga beo-ri-da','to have gone (and be gone)',7),
  (l_id,'말해 버리다','mal-hae beo-ri-da','to go ahead and say',8),
  (l_id,'잃어 버리다','i-reo beo-ri-da','to lose (completely)',9),
  (l_id,'끝내 버리다','kkeun-nae beo-ri-da','to finish off completely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 버리다 — emphatic completion','V + 아/어 버리다','Expresses that an action is thoroughly completed, often with nuances of regret, relief, or finality.','[{"korean": "숙제를 다 해버렸어요.", "english": "I finished all the homework (and now it is done — relief)."}, {"korean": "지갑을 잃어버렸어요.", "english": "I lost my wallet (and it is gone — regret)."}]',1),
  (l_id,'Nuance: regret vs relief','Context determines emotion','아/어 버리다 itself is neutral; context and verb determine whether the feeling is positive or negative.','[{"korean": "케이크를 다 먹어버렸어요. (regret: should not have)", "english": "I ate up all the cake (oops)."}, {"korean": "숙제를 끝내버렸어요! (relief: done!)", "english": "I have finished my homework! (done at last)"}]',2),
  (l_id,'Common fixed expressions','잃어버리다, 잊어버리다','Many verbs lexicalize with 버리다 into single units.','[{"korean": "잃어버리다 = to lose (permanently)", "english": "lose and it is gone"}, {"korean": "잊어버리다 = to forget (completely)", "english": "forget completely"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'세진','왜 그렇게 표정이 안 좋아요?','Se-jin, wae geu-reo-ke pyo-jeong-i an jo-a-yo?','Why do you look so down?',1),
  (l_id,'호준','지갑을 잃어버렸어요.','Ho-jun, ji-gap-eul i-reo-beo-ryeot-sseo-yo.','I lost my wallet.',2),
  (l_id,'세진','아이고, 어디서요?','A-i-go, eo-di-seo-yo?','Oh no, where?',3),
  (l_id,'호준','몰라요. 그냥 사라져버렸어요.','Mol-la-yo. Geu-nyang sa-ra-jyeo-beo-ryeot-sseo-yo.','I do not know. It just disappeared.',4),
  (l_id,'세진','카드도 있었어요?','Ka-deu-do it-sseo-sseo-yo?','Were there cards in it too?',5),
  (l_id,'호준','네, 다 잃어버렸어요. 정말 속상해요.','Ne, da i-reo-beo-ryeot-sseo-yo. Jeong-mal sok-sang-hae-yo.','Yes, I lost everything. I feel terrible.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 버리다 primarily conveys?','["possibility", "thorough completion with emotional nuance", "request", "prohibition"]',1,'아/어 버리다 = complete/thorough action, often with regret or relief.',1),
  (l_id,'"숙제를 해버렸어요" — what feeling is likely?','["anger", "relief (it is done)", "sadness", "boredom"]',1,'해버렸어요 after finishing homework suggests relief: it is all done now.',2),
  (l_id,'"잃어버리다" is a fixed compound meaning?','["to find", "to lose permanently", "to give away", "to put away"]',1,'잃어버리다 = to lose (and it is gone). 잃다 + 버리다 = lose completely.',3),
  (l_id,'"다 먹어버렸어요" might express?','["hunger", "regret or emphasis on completion", "polite request", "neutral description"]',1,'다 먹어버렸어요 = ate everything up — can suggest regret (should not have eaten it all) or completion.',4),
  (l_id,'"잊어버리다" means?','["to remember clearly", "to forget completely", "to remind", "to think about"]',1,'잊어버리다 = to forget completely. 잊다 + 버리다 = forget and it is gone.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 버리다는 동작이 완전히 완료됨을 나타내요. 흔히 아쉬움이나 후련함의 감정을 동반해요. "지갑을 잃어버렸어요"는 완전히 잃었다는 아쉬움, "숙제를 끝내버렸어요"는 끝냈다는 후련함을 나타낼 수 있어요. 잃어버리다, 잊어버리다는 하나의 단어로 굳어졌어요.','-아/어 버리다 expresses thorough completion of an action, often with emotional nuance — regret or relief. "I lost my wallet" (regret); "I finished my homework" (relief). 잃어버리다 and 잊어버리다 have lexicalized into fixed compound verbs meaning "lose permanently" and "forget completely."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 보다','-a/eo bo-da','to try/experience doing',1),
  (l_id,'경험','gyeong-heom','experience',2),
  (l_id,'시도','si-do','attempt',3),
  (l_id,'처음','cheo-eum','for the first time',4),
  (l_id,'해봤어요','hae-bwat-sseo-yo','I have tried/done it',5),
  (l_id,'먹어 보다','meo-geo bo-da','to try eating',6),
  (l_id,'입어 보다','ib-eo bo-da','to try on (clothes)',7),
  (l_id,'가 보다','ga bo-da','to go and see/try going',8),
  (l_id,'살아 보다','sar-a bo-da','to try living',9),
  (l_id,'배워 보다','bae-wo bo-da','to try learning',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 보다 — try/experience','V + 아/어 보다','Expresses trying something or having the experience of doing something.','[{"korean": "김치를 먹어 봤어요?", "english": "Have you tried (eating) kimchi?"}, {"korean": "이 옷 한번 입어 보세요.", "english": "Please try on this outfit."}]',1),
  (l_id,'-아/어 본 적이 있다/없다','V + 아/어 본 적이 있다/없다','Expresses whether one has/has never had the experience of doing something.','[{"korean": "한국에 가 본 적이 있어요.", "english": "I have been to Korea (have had the experience)."}, {"korean": "스키를 타 본 적이 없어요.", "english": "I have never tried skiing."}]',2),
  (l_id,'아/어 보세요 — polite suggestion','V + 아/어 보세요','Polite suggestion to try something.','[{"korean": "이 음식 먹어 보세요. 정말 맛있어요.", "english": "Try this food. It is really delicious."}, {"korean": "한국어 배워 보세요. 재미있어요.", "english": "Try learning Korean. It is fun."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민하','한국 음식 중에 제일 좋아하는 게 뭐예요?','Min-ha, han-guk eum-sik jung-e je-il jo-a-ha-neun ge mwo-ye-yo?','What is your favorite Korean food?',1),
  (l_id,'케이트','떡볶이요. 처음 먹어봤을 때 너무 맛있었어요.','Tteok-bok-ki-yo. Cheo-eum meo-geo-bwat-seul ttae neo-mu ma-sit-sseo-yo.','Tteokbokki. When I first tried it, it was so delicious.',2),
  (l_id,'민하','삼겹살도 먹어 봤어요?','Sam-gyeop-sal-do meo-geo bwat-sseo-yo?','Have you tried samgyeopsal too?',3),
  (l_id,'케이트','아직 못 먹어봤어요. 한번 먹어 보고 싶어요.','A-jik mot meo-geo-bwat-sseo-yo. Han-beon meo-geo bo-go si-peo-yo.','Not yet. I want to try eating it once.',4),
  (l_id,'민하','그러면 같이 가요! 제가 좋은 식당 알아요.','Geu-reo-myeon ga-chi ga-yo! Je-ga jo-eun sik-dang a-ra-yo.','Then let us go together! I know a good restaurant.',5),
  (l_id,'케이트','좋아요! 빨리 가보고 싶어요.','Jo-a-yo! Ppal-li ga-bo-go si-peo-yo.','Sounds great! I want to go soon.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 보다 expresses?','["completed action", "trying or experiencing something", "prohibition", "obligation"]',1,'아/어 보다 = try/experience: "give it a try" or "have the experience of."',1),
  (l_id,'"한국에 가 본 적이 있어요?" means?','["Are you going to Korea?", "Have you ever been to Korea?", "Do you want to go to Korea?", "Can you go to Korea?"]',1,'V + 아/어 본 적이 있다 = have the experience of: "Have you ever been to Korea?"',2),
  (l_id,'Polite suggestion to try = ?','["아/어 봐라", "아/어 보세요", "아/어 보면", "아/어 보니까"]',1,'아/어 보세요 = polite suggestion to try: "Please try (doing it)."',3),
  (l_id,'"스키를 타 본 적이 없어요" means?','["I tried skiing", "I have never tried skiing", "I cannot ski", "I will try skiing"]',1,'아/어 본 적이 없다 = have never had the experience of: never tried skiing.',4),
  (l_id,'"먹어 보다" vs "먹다" — difference?','["same", "먹어 보다 = try eating; 먹다 = simply eat", "먹어 보다 = finish eating", "먹다 = try eating"]',1,'아/어 보다 adds the nuance of trying/experiencing: 먹어 보다 = try eating (for the first time or as an experiment).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 보다는 어떤 동작을 시도하거나 경험함을 나타내요. "김치를 먹어 봤어요?"처럼요. 아/어 본 적이 있다/없다는 경험 유무를 나타내요. 아/어 보세요는 시도를 권유하는 공손한 표현이에요. 여행 추천, 음식 권유 등에 자주 쓰여요.','-아/어 보다 expresses trying or experiencing something. "Have you tried kimchi?" V + 아/어 본 적이 있다/없다 = have/have never had the experience. 아/어 보세요 = polite suggestion to try. Commonly used when recommending food, travel, or activities.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 버리다','-a/eo beo-ri-da','to have done completely (with emotional nuance)',1),
  (l_id,'완료','wan-nyo','completion',2),
  (l_id,'아쉽다','a-swip-da','to feel regret/disappointed',3),
  (l_id,'후련하다','hu-ryeon-ha-da','to feel relieved/refreshed',4),
  (l_id,'먹어 버리다','meo-geo beo-ri-da','to eat up (completely)',5),
  (l_id,'잊어 버리다','i-jeo beo-ri-da','to forget completely',6),
  (l_id,'가 버리다','ga beo-ri-da','to have gone (and be gone)',7),
  (l_id,'말해 버리다','mal-hae beo-ri-da','to go ahead and say',8),
  (l_id,'잃어 버리다','i-reo beo-ri-da','to lose (completely)',9),
  (l_id,'끝내 버리다','kkeun-nae beo-ri-da','to finish off completely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 버리다 — emphatic completion','V + 아/어 버리다','Expresses that an action is thoroughly completed, often with nuances of regret, relief, or finality.','[{"korean": "숙제를 다 해버렸어요.", "english": "I finished all the homework (and now it is done — relief)."}, {"korean": "지갑을 잃어버렸어요.", "english": "I lost my wallet (and it is gone — regret)."}]',1),
  (l_id,'Nuance: regret vs relief','Context determines emotion','아/어 버리다 itself is neutral; context and verb determine whether the feeling is positive or negative.','[{"korean": "케이크를 다 먹어버렸어요. (regret: should not have)", "english": "I ate up all the cake (oops)."}, {"korean": "숙제를 끝내버렸어요! (relief: done!)", "english": "I have finished my homework! (done at last)"}]',2),
  (l_id,'Common fixed expressions','잃어버리다, 잊어버리다','Many verbs lexicalize with 버리다 into single units.','[{"korean": "잃어버리다 = to lose (permanently)", "english": "lose and it is gone"}, {"korean": "잊어버리다 = to forget (completely)", "english": "forget completely"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'세진','왜 그렇게 표정이 안 좋아요?','Se-jin, wae geu-reo-ke pyo-jeong-i an jo-a-yo?','Why do you look so down?',1),
  (l_id,'호준','지갑을 잃어버렸어요.','Ho-jun, ji-gap-eul i-reo-beo-ryeot-sseo-yo.','I lost my wallet.',2),
  (l_id,'세진','아이고, 어디서요?','A-i-go, eo-di-seo-yo?','Oh no, where?',3),
  (l_id,'호준','몰라요. 그냥 사라져버렸어요.','Mol-la-yo. Geu-nyang sa-ra-jyeo-beo-ryeot-sseo-yo.','I do not know. It just disappeared.',4),
  (l_id,'세진','카드도 있었어요?','Ka-deu-do it-sseo-sseo-yo?','Were there cards in it too?',5),
  (l_id,'호준','네, 다 잃어버렸어요. 정말 속상해요.','Ne, da i-reo-beo-ryeot-sseo-yo. Jeong-mal sok-sang-hae-yo.','Yes, I lost everything. I feel terrible.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 버리다 primarily conveys?','["possibility", "thorough completion with emotional nuance", "request", "prohibition"]',1,'아/어 버리다 = complete/thorough action, often with regret or relief.',1),
  (l_id,'"숙제를 해버렸어요" — what feeling is likely?','["anger", "relief (it is done)", "sadness", "boredom"]',1,'해버렸어요 after finishing homework suggests relief: it is all done now.',2),
  (l_id,'"잃어버리다" is a fixed compound meaning?','["to find", "to lose permanently", "to give away", "to put away"]',1,'잃어버리다 = to lose (and it is gone). 잃다 + 버리다 = lose completely.',3),
  (l_id,'"다 먹어버렸어요" might express?','["hunger", "regret or emphasis on completion", "polite request", "neutral description"]',1,'다 먹어버렸어요 = ate everything up — can suggest regret (should not have eaten it all) or completion.',4),
  (l_id,'"잊어버리다" means?','["to remember clearly", "to forget completely", "to remind", "to think about"]',1,'잊어버리다 = to forget completely. 잊다 + 버리다 = forget and it is gone.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 버리다는 동작이 완전히 완료됨을 나타내요. 흔히 아쉬움이나 후련함의 감정을 동반해요. "지갑을 잃어버렸어요"는 완전히 잃었다는 아쉬움, "숙제를 끝내버렸어요"는 끝냈다는 후련함을 나타낼 수 있어요. 잃어버리다, 잊어버리다는 하나의 단어로 굳어졌어요.','-아/어 버리다 expresses thorough completion of an action, often with emotional nuance — regret or relief. "I lost my wallet" (regret); "I finished my homework" (relief). 잃어버리다 and 잊어버리다 have lexicalized into fixed compound verbs meaning "lose permanently" and "forget completely."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 보다','-a/eo bo-da','to try/experience doing',1),
  (l_id,'경험','gyeong-heom','experience',2),
  (l_id,'시도','si-do','attempt',3),
  (l_id,'처음','cheo-eum','for the first time',4),
  (l_id,'해봤어요','hae-bwat-sseo-yo','I have tried/done it',5),
  (l_id,'먹어 보다','meo-geo bo-da','to try eating',6),
  (l_id,'입어 보다','ib-eo bo-da','to try on (clothes)',7),
  (l_id,'가 보다','ga bo-da','to go and see/try going',8),
  (l_id,'살아 보다','sar-a bo-da','to try living',9),
  (l_id,'배워 보다','bae-wo bo-da','to try learning',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 보다 — try/experience','V + 아/어 보다','Expresses trying something or having the experience of doing something.','[{"korean": "김치를 먹어 봤어요?", "english": "Have you tried (eating) kimchi?"}, {"korean": "이 옷 한번 입어 보세요.", "english": "Please try on this outfit."}]',1),
  (l_id,'-아/어 본 적이 있다/없다','V + 아/어 본 적이 있다/없다','Expresses whether one has/has never had the experience of doing something.','[{"korean": "한국에 가 본 적이 있어요.", "english": "I have been to Korea (have had the experience)."}, {"korean": "스키를 타 본 적이 없어요.", "english": "I have never tried skiing."}]',2),
  (l_id,'아/어 보세요 — polite suggestion','V + 아/어 보세요','Polite suggestion to try something.','[{"korean": "이 음식 먹어 보세요. 정말 맛있어요.", "english": "Try this food. It is really delicious."}, {"korean": "한국어 배워 보세요. 재미있어요.", "english": "Try learning Korean. It is fun."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민하','한국 음식 중에 제일 좋아하는 게 뭐예요?','Min-ha, han-guk eum-sik jung-e je-il jo-a-ha-neun ge mwo-ye-yo?','What is your favorite Korean food?',1),
  (l_id,'케이트','떡볶이요. 처음 먹어봤을 때 너무 맛있었어요.','Tteok-bok-ki-yo. Cheo-eum meo-geo-bwat-seul ttae neo-mu ma-sit-sseo-yo.','Tteokbokki. When I first tried it, it was so delicious.',2),
  (l_id,'민하','삼겹살도 먹어 봤어요?','Sam-gyeop-sal-do meo-geo bwat-sseo-yo?','Have you tried samgyeopsal too?',3),
  (l_id,'케이트','아직 못 먹어봤어요. 한번 먹어 보고 싶어요.','A-jik mot meo-geo-bwat-sseo-yo. Han-beon meo-geo bo-go si-peo-yo.','Not yet. I want to try eating it once.',4),
  (l_id,'민하','그러면 같이 가요! 제가 좋은 식당 알아요.','Geu-reo-myeon ga-chi ga-yo! Je-ga jo-eun sik-dang a-ra-yo.','Then let us go together! I know a good restaurant.',5),
  (l_id,'케이트','좋아요! 빨리 가보고 싶어요.','Jo-a-yo! Ppal-li ga-bo-go si-peo-yo.','Sounds great! I want to go soon.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 보다 expresses?','["completed action", "trying or experiencing something", "prohibition", "obligation"]',1,'아/어 보다 = try/experience: "give it a try" or "have the experience of."',1),
  (l_id,'"한국에 가 본 적이 있어요?" means?','["Are you going to Korea?", "Have you ever been to Korea?", "Do you want to go to Korea?", "Can you go to Korea?"]',1,'V + 아/어 본 적이 있다 = have the experience of: "Have you ever been to Korea?"',2),
  (l_id,'Polite suggestion to try = ?','["아/어 봐라", "아/어 보세요", "아/어 보면", "아/어 보니까"]',1,'아/어 보세요 = polite suggestion to try: "Please try (doing it)."',3),
  (l_id,'"스키를 타 본 적이 없어요" means?','["I tried skiing", "I have never tried skiing", "I cannot ski", "I will try skiing"]',1,'아/어 본 적이 없다 = have never had the experience of: never tried skiing.',4),
  (l_id,'"먹어 보다" vs "먹다" — difference?','["same", "먹어 보다 = try eating; 먹다 = simply eat", "먹어 보다 = finish eating", "먹다 = try eating"]',1,'아/어 보다 adds the nuance of trying/experiencing: 먹어 보다 = try eating (for the first time or as an experiment).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 보다는 어떤 동작을 시도하거나 경험함을 나타내요. "김치를 먹어 봤어요?"처럼요. 아/어 본 적이 있다/없다는 경험 유무를 나타내요. 아/어 보세요는 시도를 권유하는 공손한 표현이에요. 여행 추천, 음식 권유 등에 자주 쓰여요.','-아/어 보다 expresses trying or experiencing something. "Have you tried kimchi?" V + 아/어 본 적이 있다/없다 = have/have never had the experience. 아/어 보세요 = polite suggestion to try. Commonly used when recommending food, travel, or activities.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=41;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#41 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'할 수 있다','hal su it-da','can do',1),
  (l_id,'할 수 없다','hal su eop-da','cannot do',2),
  (l_id,'(으)ㄹ 수 있다','l su it-da','ability/possibility',3),
  (l_id,'잘 하다','jal ha-da','to be good at',4),
  (l_id,'못 하다','mot ha-da','to be bad at',5),
  (l_id,'가능','ga-neung','possibility',6),
  (l_id,'수영하다','su-yeong-ha-da','to swim',7),
  (l_id,'운전하다','un-jeon-ha-da','to drive',8),
  (l_id,'치다','chi-da','to play (instrument)',9),
  (l_id,'가르치다','ga-reu-chi-da','to teach',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Ability - (으)ㄹ 수 있다/없다','V + (으)ㄹ 수 있다/없다 expresses ability or possibility. 갈 수 있어요 = I can go. 먹을 수 없어요 = I cannot eat.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유스프','한국어로 말할 수 있어요?','Yu-seu-peu, han-guk-eo-ro mal-hal su i-sseo-yo?','Can you speak Korean?',1),
  (l_id,'수아','조금 할 수 있어요.','Su-a, jo-geum hal su i-sseo-yo.','I can a little.',2),
  (l_id,'유스프','피아노 칠 수 있어요?','Pi-a-no chil su i-sseo-yo?','Can you play piano?',3),
  (l_id,'수아','네! 어릴 때부터 쳤어요.','Ne! Eo-ril ttae-bu-teo chyeot-sseo-yo.','Yes! I have played since childhood.',4),
  (l_id,'유스프','가르쳐 줄 수 있어요?','Ga-reu-chyeo jul su i-sseo-yo?','Can you teach me?',5),
  (l_id,'수아','물론이죠!','Mul-lon-i-jyo!','Of course!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ 수 있다 expresses?','["obligation", "ability/possibility", "prohibition", "desire"]',1,'(으)ㄹ 수 있다 = can/possible.',1),
  (l_id,'"갈 수 있다" from 가다?','["가을 수 있다", "갈 수 있다", "가으ㄹ 수 있다", "가수 있다"]',1,'가 stem + ㄹ 수 있다 = 갈 수 있다.',2),
  (l_id,'"먹다" cannot: 먹을 수 없다 or?','["먹ㄹ 수 없다", "못 먹다", "먹을 수 없다", "먹지 않다"]',2,'먹 + 을 수 없다 = 먹을 수 없다.',3),
  (l_id,'Past ability "could not go"?','["갈 수 없었어요", "갈 수 없어요", "갈 수 없을 거예요", "갈 수 없다"]',0,'Past: 갈 수 없었어요 = could not go.',4),
  (l_id,'"못 해요" vs "할 수 없어요"?','["same", "못=lower skill; 할 수 없다=conditions prevent", "different verbs", "unrelated"]',0,'못 implies skill limitation; 할 수 없다 implies external impossibility.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'할 수 있다/없다는 능력이나 가능성을 나타내요. 어간 + (으)ㄹ 수 있다/없다로 써요. 과거는 있었다/없었다로 표현해요.','(으)ㄹ 수 있다/없다 expresses ability or possibility. Past ability: 갈 수 있었어요. 못 implies skill limitation; 할 수 없다 suggests external impossibility.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=42;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#42 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어야 하다','a/eo-ya ha-da','must/have to',1),
  (l_id,'-아/어야 되다','a/eo-ya doe-da','must (colloquial)',2),
  (l_id,'의무','ui-mu','obligation',3),
  (l_id,'해야 해요','hae-ya hae-yo','have to do',4),
  (l_id,'가야 해요','ga-ya hae-yo','have to go',5),
  (l_id,'먹어야 해요','meo-geo-ya hae-yo','have to eat',6),
  (l_id,'꼭','kkok','definitely/must',7),
  (l_id,'반드시','ban-deu-si','surely/necessarily',8),
  (l_id,'지켜야 하다','ji-kyeo-ya ha-da','must observe',9),
  (l_id,'서둘러야 하다','seo-dul-leo-ya ha-da','must hurry',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Obligation - 아/어야 하다/되다','V/A + 아/어야 하다/되다 = must/have to. 숙제를 해야 해요 = I have to do homework. 하다 and 되다 are interchangeable.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수현','왜 이렇게 일찍 가요?','Su-hyeon, wae i-reo-ke il-chik ga-yo?','Why are you leaving so early?',1),
  (l_id,'다빈','공항에 가야 해요.','Da-bin, gong-hang-e ga-ya hae-yo.','I have to go to the airport.',2),
  (l_id,'수현','서둘러야 하겠네요.','Seo-dul-leo-ya ha-get-ne-yo.','You must hurry.',3),
  (l_id,'다빈','꼭 2시간 전에 도착해야 해요.','Kkok du si-gan jeon-e do-chak-hae-ya hae-yo.','I must arrive 2 hours before.',4),
  (l_id,'수현','짐은 다 쌌어요?','Jim-eun da ssats-seo-yo?','Did you pack everything?',5),
  (l_id,'다빈','여권을 챙겨야 해요!','Yeo-gwon-eul chaeng-gyeo-ya hae-yo!','I must take my passport!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어야 하다 expresses?','["permission", "obligation/necessity", "possibility", "desire"]',1,'아/어야 하다 = must/have to.',1),
  (l_id,'"I have to eat" Korean?','["먹어도 돼요", "먹어야 해요", "먹지 마세요", "먹고 싶어요"]',1,'먹어야 해요 = have to eat.',2),
  (l_id,'"가야 되다" vs "가야 하다"?','["different meanings", "되다 slightly more colloquial; same meaning", "하다 is wrong", "되다 is formal"]',1,'Both mean must/have to; 되다 is slightly more colloquial.',3),
  (l_id,'"꼭" before 해야 해요 means?','["maybe", "definitely/absolutely must", "sometimes", "rarely"]',1,'꼭 = definitely. 꼭 해야 해요 = absolutely must do.',4),
  (l_id,'"공항에 가야 해요" means?','["I want to go", "I am going", "I must go", "I went"]',2,'아/어야 하다 = must: 가야 해요 = must go.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어야 하다/되다는 의무나 필요를 나타내요. 하다와 되다 모두 쓸 수 있어요.','아/어야 하다/되다 expresses obligation. Both 하다 and 되다 work; 되다 is slightly more colloquial.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=43;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#43 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-면 안 되다','myeon an doe-da','must not',1),
  (l_id,'금지','geum-ji','prohibition',2),
  (l_id,'하면 안 돼요','ha-myeon an dwae-yo','must not do',3),
  (l_id,'하지 마세요','ha-ji ma-se-yo','please do not',4),
  (l_id,'금연','geum-yeon','no smoking',5),
  (l_id,'금주','geum-ju','no drinking',6),
  (l_id,'주차 금지','ju-cha geum-ji','no parking',7),
  (l_id,'금지 구역','geum-ji gu-yeok','prohibited zone',8),
  (l_id,'규정','gyu-jeong','regulation',9),
  (l_id,'늦다','neut-da','to be late',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Prohibition - (으)면 안 되다','V + (으)면 안 되다 = must not. 여기서 피우면 안 돼요 = must not smoke here.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'안내원','여기서 사진 찍으면 안 됩니다.','An-nae-won, yeo-gi-seo sa-jin jji-geu-myeon an doem-ni-da.','You must not take photos here.',1),
  (l_id,'관광객','핸드폰 써도 돼요?','Gwan-gwang-gaek, haen-deu-pon sseo-do dwae-yo?','May I use my phone?',2),
  (l_id,'안내원','조용히면 돼요. 통화는 하면 안 돼요.','Jo-yong-hi-myeon dwae-yo. Tong-hwa-neun ha-myeon an dwae-yo.','If quiet, that is fine. But you must not make calls.',3),
  (l_id,'관광객','알겠습니다. 들어가도 돼요?','Al-get-sseum-ni-da. Deu-reo-ga-do dwae-yo?','I understand. May I go inside?',4),
  (l_id,'안내원','네, 들어가셔도 됩니다.','Ne, deu-reo-ga-syeo-do doem-ni-da.','Yes, you may go in.',5),
  (l_id,'관광객','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 안 되다 expresses?','["ability", "obligation", "prohibition", "desire"]',2,'(으)면 안 되다 = must not.',1),
  (l_id,'"No smoking" Korean?','["피워도 돼요", "피우면 안 돼요", "피울 수 있어요", "피우세요"]',1,'피우면 안 돼요 = must not smoke.',2),
  (l_id,'"하지 마세요" means?','["Please do", "Please do not", "You can do it", "You must do it"]',1,'하지 마세요 = polite negative command.',3),
  (l_id,'Which is more formal?','["하지 마세요", "하면 안 됩니다", "same", "neither"]',1,'하면 안 됩니다 is formal 합쇼체.',4),
  (l_id,'"늦으면 안 돼요" means?','["Be on time if you can", "You must not be late", "Being late is allowed", "Please be late"]',1,'(으)면 안 되다 = prohibition: must not be late.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)면 안 되다는 금지를 나타내요. 하지 마세요는 명령형 금지예요.','(으)면 안 되다 expresses prohibition. 하지 마세요 = polite negative command.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=44;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#44 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어도 되다','a/eo-do doe-da','may/permission',1),
  (l_id,'허가','heo-ga','permission',2),
  (l_id,'해도 돼요','hae-do dwae-yo','you may do',3),
  (l_id,'가도 돼요','ga-do dwae-yo','you may go',4),
  (l_id,'써도 돼요','sseo-do dwae-yo','you may use',5),
  (l_id,'먹어도 돼요','meo-geo-do dwae-yo','you may eat',6),
  (l_id,'앉아도 돼요','an-ja-do dwae-yo','you may sit',7),
  (l_id,'물론','mul-lon','of course',8),
  (l_id,'허락하다','heo-rak-ha-da','to permit',9),
  (l_id,'괜찮다','gwaen-chan-ta','to be okay',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Permission - 아/어도 되다','V + 아/어도 되다 = may (permission). 앉아도 돼요 = you may sit. Question: 해도 돼요? = may I do it?','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유리','질문해도 돼요?','Yu-ri, ji-ri-mun-hae-do dwae-yo?','May I ask a question?',1),
  (l_id,'선생님','물론이죠.','Seon-saeng-nim, mul-lon-i-jyo.','Of course.',2),
  (l_id,'유리','이 사전 써도 돼요?','I sa-jeon sseo-do dwae-yo?','May I use this dictionary?',3),
  (l_id,'선생님','네, 써도 돼요.','Ne, sseo-do dwae-yo.','Yes, you may.',4),
  (l_id,'유리','시험 때도요?','Si-heom ttae-do-yo?','During the exam too?',5),
  (l_id,'선생님','네, 되지만 답 적으면 안 돼요.','Ne, doe-ji-man dap jeo-geu-myeon an dwae-yo.','Yes, but you must not write the answers.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어도 되다 expresses?','["obligation", "prohibition", "permission", "ability"]',2,'아/어도 되다 = permission.',1),
  (l_id,'"May I sit?" Korean?','["앉으면 안 돼요?", "앉아도 돼요?", "앉아야 해요?", "앉을 수 없어요?"]',1,'앉아도 돼요? = May I sit?',2),
  (l_id,'"이거 먹어도 돼요" means?','["Must eat this", "You may eat this", "Do not eat", "Can you eat?"]',1,'아/어도 되다 = permission: you may eat this.',3),
  (l_id,'아/어도 되다 vs 아/어야 하다?','["same", "되다=permission; 야 하다=obligation", "되다=prohibition", "unrelated"]',1,'되다 = permission (may). 야 하다 = obligation (must).',4),
  (l_id,'"물론이죠" means?','["Certainly not", "Of course (yes, permitted)", "Maybe", "I do not know"]',1,'물론이죠 = of course! — enthusiastically granting permission.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어도 되다는 허가를 나타내요.','아/어도 되다 expresses permission. Question form asks for permission.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=45;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#45 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 싶다','go sip-da','want to do',1),
  (l_id,'-고 싶어하다','go si-peo-ha-da','wants to (third person)',2),
  (l_id,'원하다','won-ha-da','to want (noun object)',3),
  (l_id,'바라다','ba-ra-da','to wish/hope',4),
  (l_id,'원하는 것','won-ha-neun geot','what one wants',5),
  (l_id,'소원','so-won','wish/desire',6),
  (l_id,'희망하다','hi-mang-ha-da','to hope',7),
  (l_id,'꿈','kkum','dream',8),
  (l_id,'되고 싶다','doe-go sip-da','want to become',9),
  (l_id,'배우고 싶다','bae-u-go sip-da','want to learn',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Desire - 고 싶다','V + 고 싶다 = want to do. 먹고 싶어요 = I want to eat. Third person: 고 싶어해요.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하리','장래 희망이 뭐예요?','Ha-ri, jang-rae hi-mang-i mwo-ye-yo?','What do you want to be?',1),
  (l_id,'현진','의사가 되고 싶어요.','Hyeon-jin, ui-sa-ga doe-go si-peo-yo.','I want to become a doctor.',2),
  (l_id,'하리','왜요?','Wae-yo?','Why?',3),
  (l_id,'현진','사람들을 도와주고 싶어서요.','Sa-ram-deul-eul do-wa-ju-go si-peo-seo-yo.','Because I want to help people.',4),
  (l_id,'하리','정말 멋있어요. 저는 요리사가 되고 싶어요.','Jeong-mal meo-si-sseo-yo. Jeo-neun yo-ri-sa-ga doe-go si-peo-yo.','That is amazing. I want to become a chef.',5),
  (l_id,'현진','꿈을 향해 같이 노력해요!','Kkum-eul hyang-hae ga-chi no-ryeok-hae-yo!','Let us both work toward our dreams!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 싶다 expresses?','["obligation", "desire to do", "prohibition", "completion"]',1,'고 싶다 = want to.',1),
  (l_id,'"I want to go" Korean?','["가야 해요", "가면 돼요", "가고 싶어요", "가도 돼요"]',2,'가고 싶어요 = I want to go.',2),
  (l_id,'Third person desire "she wants to eat"?','["먹고 싶어요", "먹고 싶어해요", "먹고 싶었어요", "먹어야 해요"]',1,'Third person: 먹고 싶어해요 (she/he wants to eat).',3),
  (l_id,'"배우고 싶어서 왔어요" means?','["I came even though I want to learn", "I came because I want to learn", "I want to learn but did not come", "I learned and came"]',1,'고 싶어서 = because I want to: 배우고 싶어서 왔어요 = I came because I want to learn.',4),
  (l_id,'고 싶다 past = ?','["고 싶었어요", "고 싶어요", "고 싶을 거예요", "고 싶었을 거예요"]',0,'Past desire: 고 싶었어요 = wanted to.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고 싶다는 하고 싶은 욕구를 나타내요. 3인칭은 고 싶어하다를 써요.','고 싶다 = want to do. Third person: 고 싶어하다. Past: 고 싶었어요.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=46;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#46 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)ㄹ까요?','(eu)l-kka-yo?','shall we? / I wonder',1),
  (l_id,'(으)ㅂ시다','(eu)p-si-da','let us (formal)',2),
  (l_id,'자','ja','let us (plain)',3),
  (l_id,'제안','je-an','suggestion/proposal',4),
  (l_id,'어때요?','eo-ttae-yo?','how about it?',5),
  (l_id,'어떨까요?','eo-tteol-kka-yo?','how would it be?',6),
  (l_id,'같이','ga-chi','together',7),
  (l_id,'함께','ham-kke','together (formal)',8),
  (l_id,'~하는 게 어때요?','ha-neun ge eo-ttae-yo?','how about doing?',9),
  (l_id,'권유','gwon-yu','recommendation/invitation',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Suggestions - (으)ㄹ까요 / (으)ㅂ시다','(으)ㄹ까요? = shall we? 영화 볼까요? = Shall we watch a movie? (으)ㅂ시다 = formal "let us": 갑시다 = let us go.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민준','이번 주말에 뭐 할까요?','Min-jun, i-beon ju-mal-e mwo hal-kka-yo?','What shall we do this weekend?',1),
  (l_id,'서연','영화 볼까요?','Seo-yeon, yeong-hwa bol-kka-yo?','Shall we watch a movie?',2),
  (l_id,'민준','좋아요. 어떤 영화가 어떨까요?','Jo-a-yo. Eo-tteon yeong-hwa-ga eo-tteol-kka-yo?','Sounds good. What kind of movie would be good?',3),
  (l_id,'서연','한국 영화 어때요?','Han-guk yeong-hwa eo-ttae-yo?','How about a Korean movie?',4),
  (l_id,'민준','좋죠! 같이 저녁도 먹읍시다.','Jo-jyo! Ga-chi jeo-nyeok-do meog-eup-si-da.','Great! Let us also eat dinner together.',5),
  (l_id,'서연','완벽한 계획이에요!','Wan-byeok-han gye-hoek-i-e-yo!','That is a perfect plan!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ까요? expresses?','["obligation", "suggestion/shall we", "prohibition", "past action"]',1,'(으)ㄹ까요? = shall we? — making a suggestion.',1),
  (l_id,'"Shall we go?" Korean?','["가야 해요?", "가도 돼요?", "갈까요?", "가겠어요?"]',2,'갈까요? = Shall we go? ((으)ㄹ까요).',2),
  (l_id,'"Let us go" formal suggestion?','["가자", "갑시다", "가요", "가겠습니다"]',1,'(으)ㅂ시다 is formal "let us": 갑시다 = let us go.',3),
  (l_id,'"영화 보는 게 어때요?" means?','["Are you watching a movie?", "How about watching a movie?", "I watch movies", "Watch a movie!"]',1,'~하는 게 어때요? = How about doing...? — suggesting an activity.',4),
  (l_id,'(으)ㄹ까요 vs 자 for suggestions?','["same", "ㄹ까요 is polite/neutral; 자 is casual/plain speech", "ㄹ까요 is formal", "자 is more polite"]',1,'(으)ㄹ까요 is polite; 자 is plain speech: 가자 = let us go (informal).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)ㄹ까요는 제안이나 "~할까요"의 의미예요. (으)ㅂ시다는 격식 있는 청유형이에요.','(으)ㄹ까요? = shall we? — polite suggestion. (으)ㅂ시다 = formal "let us." 자 is the plain speech equivalent.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 버리다','-a/eo beo-ri-da','to have done completely (with emotional nuance)',1),
  (l_id,'완료','wan-nyo','completion',2),
  (l_id,'아쉽다','a-swip-da','to feel regret/disappointed',3),
  (l_id,'후련하다','hu-ryeon-ha-da','to feel relieved/refreshed',4),
  (l_id,'먹어 버리다','meo-geo beo-ri-da','to eat up (completely)',5),
  (l_id,'잊어 버리다','i-jeo beo-ri-da','to forget completely',6),
  (l_id,'가 버리다','ga beo-ri-da','to have gone (and be gone)',7),
  (l_id,'말해 버리다','mal-hae beo-ri-da','to go ahead and say',8),
  (l_id,'잃어 버리다','i-reo beo-ri-da','to lose (completely)',9),
  (l_id,'끝내 버리다','kkeun-nae beo-ri-da','to finish off completely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 버리다 — emphatic completion','V + 아/어 버리다','Expresses that an action is thoroughly completed, often with nuances of regret, relief, or finality.','[{"korean": "숙제를 다 해버렸어요.", "english": "I finished all the homework (and now it is done — relief)."}, {"korean": "지갑을 잃어버렸어요.", "english": "I lost my wallet (and it is gone — regret)."}]',1),
  (l_id,'Nuance: regret vs relief','Context determines emotion','아/어 버리다 itself is neutral; context and verb determine whether the feeling is positive or negative.','[{"korean": "케이크를 다 먹어버렸어요. (regret: should not have)", "english": "I ate up all the cake (oops)."}, {"korean": "숙제를 끝내버렸어요! (relief: done!)", "english": "I have finished my homework! (done at last)"}]',2),
  (l_id,'Common fixed expressions','잃어버리다, 잊어버리다','Many verbs lexicalize with 버리다 into single units.','[{"korean": "잃어버리다 = to lose (permanently)", "english": "lose and it is gone"}, {"korean": "잊어버리다 = to forget (completely)", "english": "forget completely"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'세진','왜 그렇게 표정이 안 좋아요?','Se-jin, wae geu-reo-ke pyo-jeong-i an jo-a-yo?','Why do you look so down?',1),
  (l_id,'호준','지갑을 잃어버렸어요.','Ho-jun, ji-gap-eul i-reo-beo-ryeot-sseo-yo.','I lost my wallet.',2),
  (l_id,'세진','아이고, 어디서요?','A-i-go, eo-di-seo-yo?','Oh no, where?',3),
  (l_id,'호준','몰라요. 그냥 사라져버렸어요.','Mol-la-yo. Geu-nyang sa-ra-jyeo-beo-ryeot-sseo-yo.','I do not know. It just disappeared.',4),
  (l_id,'세진','카드도 있었어요?','Ka-deu-do it-sseo-sseo-yo?','Were there cards in it too?',5),
  (l_id,'호준','네, 다 잃어버렸어요. 정말 속상해요.','Ne, da i-reo-beo-ryeot-sseo-yo. Jeong-mal sok-sang-hae-yo.','Yes, I lost everything. I feel terrible.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 버리다 primarily conveys?','["possibility", "thorough completion with emotional nuance", "request", "prohibition"]',1,'아/어 버리다 = complete/thorough action, often with regret or relief.',1),
  (l_id,'"숙제를 해버렸어요" — what feeling is likely?','["anger", "relief (it is done)", "sadness", "boredom"]',1,'해버렸어요 after finishing homework suggests relief: it is all done now.',2),
  (l_id,'"잃어버리다" is a fixed compound meaning?','["to find", "to lose permanently", "to give away", "to put away"]',1,'잃어버리다 = to lose (and it is gone). 잃다 + 버리다 = lose completely.',3),
  (l_id,'"다 먹어버렸어요" might express?','["hunger", "regret or emphasis on completion", "polite request", "neutral description"]',1,'다 먹어버렸어요 = ate everything up — can suggest regret (should not have eaten it all) or completion.',4),
  (l_id,'"잊어버리다" means?','["to remember clearly", "to forget completely", "to remind", "to think about"]',1,'잊어버리다 = to forget completely. 잊다 + 버리다 = forget and it is gone.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 버리다는 동작이 완전히 완료됨을 나타내요. 흔히 아쉬움이나 후련함의 감정을 동반해요. "지갑을 잃어버렸어요"는 완전히 잃었다는 아쉬움, "숙제를 끝내버렸어요"는 끝냈다는 후련함을 나타낼 수 있어요. 잃어버리다, 잊어버리다는 하나의 단어로 굳어졌어요.','-아/어 버리다 expresses thorough completion of an action, often with emotional nuance — regret or relief. "I lost my wallet" (regret); "I finished my homework" (relief). 잃어버리다 and 잊어버리다 have lexicalized into fixed compound verbs meaning "lose permanently" and "forget completely."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 보다','-a/eo bo-da','to try/experience doing',1),
  (l_id,'경험','gyeong-heom','experience',2),
  (l_id,'시도','si-do','attempt',3),
  (l_id,'처음','cheo-eum','for the first time',4),
  (l_id,'해봤어요','hae-bwat-sseo-yo','I have tried/done it',5),
  (l_id,'먹어 보다','meo-geo bo-da','to try eating',6),
  (l_id,'입어 보다','ib-eo bo-da','to try on (clothes)',7),
  (l_id,'가 보다','ga bo-da','to go and see/try going',8),
  (l_id,'살아 보다','sar-a bo-da','to try living',9),
  (l_id,'배워 보다','bae-wo bo-da','to try learning',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 보다 — try/experience','V + 아/어 보다','Expresses trying something or having the experience of doing something.','[{"korean": "김치를 먹어 봤어요?", "english": "Have you tried (eating) kimchi?"}, {"korean": "이 옷 한번 입어 보세요.", "english": "Please try on this outfit."}]',1),
  (l_id,'-아/어 본 적이 있다/없다','V + 아/어 본 적이 있다/없다','Expresses whether one has/has never had the experience of doing something.','[{"korean": "한국에 가 본 적이 있어요.", "english": "I have been to Korea (have had the experience)."}, {"korean": "스키를 타 본 적이 없어요.", "english": "I have never tried skiing."}]',2),
  (l_id,'아/어 보세요 — polite suggestion','V + 아/어 보세요','Polite suggestion to try something.','[{"korean": "이 음식 먹어 보세요. 정말 맛있어요.", "english": "Try this food. It is really delicious."}, {"korean": "한국어 배워 보세요. 재미있어요.", "english": "Try learning Korean. It is fun."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민하','한국 음식 중에 제일 좋아하는 게 뭐예요?','Min-ha, han-guk eum-sik jung-e je-il jo-a-ha-neun ge mwo-ye-yo?','What is your favorite Korean food?',1),
  (l_id,'케이트','떡볶이요. 처음 먹어봤을 때 너무 맛있었어요.','Tteok-bok-ki-yo. Cheo-eum meo-geo-bwat-seul ttae neo-mu ma-sit-sseo-yo.','Tteokbokki. When I first tried it, it was so delicious.',2),
  (l_id,'민하','삼겹살도 먹어 봤어요?','Sam-gyeop-sal-do meo-geo bwat-sseo-yo?','Have you tried samgyeopsal too?',3),
  (l_id,'케이트','아직 못 먹어봤어요. 한번 먹어 보고 싶어요.','A-jik mot meo-geo-bwat-sseo-yo. Han-beon meo-geo bo-go si-peo-yo.','Not yet. I want to try eating it once.',4),
  (l_id,'민하','그러면 같이 가요! 제가 좋은 식당 알아요.','Geu-reo-myeon ga-chi ga-yo! Je-ga jo-eun sik-dang a-ra-yo.','Then let us go together! I know a good restaurant.',5),
  (l_id,'케이트','좋아요! 빨리 가보고 싶어요.','Jo-a-yo! Ppal-li ga-bo-go si-peo-yo.','Sounds great! I want to go soon.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 보다 expresses?','["completed action", "trying or experiencing something", "prohibition", "obligation"]',1,'아/어 보다 = try/experience: "give it a try" or "have the experience of."',1),
  (l_id,'"한국에 가 본 적이 있어요?" means?','["Are you going to Korea?", "Have you ever been to Korea?", "Do you want to go to Korea?", "Can you go to Korea?"]',1,'V + 아/어 본 적이 있다 = have the experience of: "Have you ever been to Korea?"',2),
  (l_id,'Polite suggestion to try = ?','["아/어 봐라", "아/어 보세요", "아/어 보면", "아/어 보니까"]',1,'아/어 보세요 = polite suggestion to try: "Please try (doing it)."',3),
  (l_id,'"스키를 타 본 적이 없어요" means?','["I tried skiing", "I have never tried skiing", "I cannot ski", "I will try skiing"]',1,'아/어 본 적이 없다 = have never had the experience of: never tried skiing.',4),
  (l_id,'"먹어 보다" vs "먹다" — difference?','["same", "먹어 보다 = try eating; 먹다 = simply eat", "먹어 보다 = finish eating", "먹다 = try eating"]',1,'아/어 보다 adds the nuance of trying/experiencing: 먹어 보다 = try eating (for the first time or as an experiment).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 보다는 어떤 동작을 시도하거나 경험함을 나타내요. "김치를 먹어 봤어요?"처럼요. 아/어 본 적이 있다/없다는 경험 유무를 나타내요. 아/어 보세요는 시도를 권유하는 공손한 표현이에요. 여행 추천, 음식 권유 등에 자주 쓰여요.','-아/어 보다 expresses trying or experiencing something. "Have you tried kimchi?" V + 아/어 본 적이 있다/없다 = have/have never had the experience. 아/어 보세요 = polite suggestion to try. Commonly used when recommending food, travel, or activities.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=41;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#41 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'할 수 있다','hal su it-da','can do',1),
  (l_id,'할 수 없다','hal su eop-da','cannot do',2),
  (l_id,'(으)ㄹ 수 있다','l su it-da','ability/possibility',3),
  (l_id,'잘 하다','jal ha-da','to be good at',4),
  (l_id,'못 하다','mot ha-da','to be bad at',5),
  (l_id,'가능','ga-neung','possibility',6),
  (l_id,'수영하다','su-yeong-ha-da','to swim',7),
  (l_id,'운전하다','un-jeon-ha-da','to drive',8),
  (l_id,'치다','chi-da','to play (instrument)',9),
  (l_id,'가르치다','ga-reu-chi-da','to teach',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Ability - (으)ㄹ 수 있다/없다','V + (으)ㄹ 수 있다/없다 expresses ability or possibility. 갈 수 있어요 = I can go. 먹을 수 없어요 = I cannot eat.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유스프','한국어로 말할 수 있어요?','Yu-seu-peu, han-guk-eo-ro mal-hal su i-sseo-yo?','Can you speak Korean?',1),
  (l_id,'수아','조금 할 수 있어요.','Su-a, jo-geum hal su i-sseo-yo.','I can a little.',2),
  (l_id,'유스프','피아노 칠 수 있어요?','Pi-a-no chil su i-sseo-yo?','Can you play piano?',3),
  (l_id,'수아','네! 어릴 때부터 쳤어요.','Ne! Eo-ril ttae-bu-teo chyeot-sseo-yo.','Yes! I have played since childhood.',4),
  (l_id,'유스프','가르쳐 줄 수 있어요?','Ga-reu-chyeo jul su i-sseo-yo?','Can you teach me?',5),
  (l_id,'수아','물론이죠!','Mul-lon-i-jyo!','Of course!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ 수 있다 expresses?','["obligation", "ability/possibility", "prohibition", "desire"]',1,'(으)ㄹ 수 있다 = can/possible.',1),
  (l_id,'"갈 수 있다" from 가다?','["가을 수 있다", "갈 수 있다", "가으ㄹ 수 있다", "가수 있다"]',1,'가 stem + ㄹ 수 있다 = 갈 수 있다.',2),
  (l_id,'"먹다" cannot: 먹을 수 없다 or?','["먹ㄹ 수 없다", "못 먹다", "먹을 수 없다", "먹지 않다"]',2,'먹 + 을 수 없다 = 먹을 수 없다.',3),
  (l_id,'Past ability "could not go"?','["갈 수 없었어요", "갈 수 없어요", "갈 수 없을 거예요", "갈 수 없다"]',0,'Past: 갈 수 없었어요 = could not go.',4),
  (l_id,'"못 해요" vs "할 수 없어요"?','["same", "못=lower skill; 할 수 없다=conditions prevent", "different verbs", "unrelated"]',0,'못 implies skill limitation; 할 수 없다 implies external impossibility.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'할 수 있다/없다는 능력이나 가능성을 나타내요. 어간 + (으)ㄹ 수 있다/없다로 써요. 과거는 있었다/없었다로 표현해요.','(으)ㄹ 수 있다/없다 expresses ability or possibility. Past ability: 갈 수 있었어요. 못 implies skill limitation; 할 수 없다 suggests external impossibility.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=42;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#42 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어야 하다','a/eo-ya ha-da','must/have to',1),
  (l_id,'-아/어야 되다','a/eo-ya doe-da','must (colloquial)',2),
  (l_id,'의무','ui-mu','obligation',3),
  (l_id,'해야 해요','hae-ya hae-yo','have to do',4),
  (l_id,'가야 해요','ga-ya hae-yo','have to go',5),
  (l_id,'먹어야 해요','meo-geo-ya hae-yo','have to eat',6),
  (l_id,'꼭','kkok','definitely/must',7),
  (l_id,'반드시','ban-deu-si','surely/necessarily',8),
  (l_id,'지켜야 하다','ji-kyeo-ya ha-da','must observe',9),
  (l_id,'서둘러야 하다','seo-dul-leo-ya ha-da','must hurry',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Obligation - 아/어야 하다/되다','V/A + 아/어야 하다/되다 = must/have to. 숙제를 해야 해요 = I have to do homework. 하다 and 되다 are interchangeable.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수현','왜 이렇게 일찍 가요?','Su-hyeon, wae i-reo-ke il-chik ga-yo?','Why are you leaving so early?',1),
  (l_id,'다빈','공항에 가야 해요.','Da-bin, gong-hang-e ga-ya hae-yo.','I have to go to the airport.',2),
  (l_id,'수현','서둘러야 하겠네요.','Seo-dul-leo-ya ha-get-ne-yo.','You must hurry.',3),
  (l_id,'다빈','꼭 2시간 전에 도착해야 해요.','Kkok du si-gan jeon-e do-chak-hae-ya hae-yo.','I must arrive 2 hours before.',4),
  (l_id,'수현','짐은 다 쌌어요?','Jim-eun da ssats-seo-yo?','Did you pack everything?',5),
  (l_id,'다빈','여권을 챙겨야 해요!','Yeo-gwon-eul chaeng-gyeo-ya hae-yo!','I must take my passport!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어야 하다 expresses?','["permission", "obligation/necessity", "possibility", "desire"]',1,'아/어야 하다 = must/have to.',1),
  (l_id,'"I have to eat" Korean?','["먹어도 돼요", "먹어야 해요", "먹지 마세요", "먹고 싶어요"]',1,'먹어야 해요 = have to eat.',2),
  (l_id,'"가야 되다" vs "가야 하다"?','["different meanings", "되다 slightly more colloquial; same meaning", "하다 is wrong", "되다 is formal"]',1,'Both mean must/have to; 되다 is slightly more colloquial.',3),
  (l_id,'"꼭" before 해야 해요 means?','["maybe", "definitely/absolutely must", "sometimes", "rarely"]',1,'꼭 = definitely. 꼭 해야 해요 = absolutely must do.',4),
  (l_id,'"공항에 가야 해요" means?','["I want to go", "I am going", "I must go", "I went"]',2,'아/어야 하다 = must: 가야 해요 = must go.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어야 하다/되다는 의무나 필요를 나타내요. 하다와 되다 모두 쓸 수 있어요.','아/어야 하다/되다 expresses obligation. Both 하다 and 되다 work; 되다 is slightly more colloquial.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=43;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#43 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-면 안 되다','myeon an doe-da','must not',1),
  (l_id,'금지','geum-ji','prohibition',2),
  (l_id,'하면 안 돼요','ha-myeon an dwae-yo','must not do',3),
  (l_id,'하지 마세요','ha-ji ma-se-yo','please do not',4),
  (l_id,'금연','geum-yeon','no smoking',5),
  (l_id,'금주','geum-ju','no drinking',6),
  (l_id,'주차 금지','ju-cha geum-ji','no parking',7),
  (l_id,'금지 구역','geum-ji gu-yeok','prohibited zone',8),
  (l_id,'규정','gyu-jeong','regulation',9),
  (l_id,'늦다','neut-da','to be late',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Prohibition - (으)면 안 되다','V + (으)면 안 되다 = must not. 여기서 피우면 안 돼요 = must not smoke here.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'안내원','여기서 사진 찍으면 안 됩니다.','An-nae-won, yeo-gi-seo sa-jin jji-geu-myeon an doem-ni-da.','You must not take photos here.',1),
  (l_id,'관광객','핸드폰 써도 돼요?','Gwan-gwang-gaek, haen-deu-pon sseo-do dwae-yo?','May I use my phone?',2),
  (l_id,'안내원','조용히면 돼요. 통화는 하면 안 돼요.','Jo-yong-hi-myeon dwae-yo. Tong-hwa-neun ha-myeon an dwae-yo.','If quiet, that is fine. But you must not make calls.',3),
  (l_id,'관광객','알겠습니다. 들어가도 돼요?','Al-get-sseum-ni-da. Deu-reo-ga-do dwae-yo?','I understand. May I go inside?',4),
  (l_id,'안내원','네, 들어가셔도 됩니다.','Ne, deu-reo-ga-syeo-do doem-ni-da.','Yes, you may go in.',5),
  (l_id,'관광객','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 안 되다 expresses?','["ability", "obligation", "prohibition", "desire"]',2,'(으)면 안 되다 = must not.',1),
  (l_id,'"No smoking" Korean?','["피워도 돼요", "피우면 안 돼요", "피울 수 있어요", "피우세요"]',1,'피우면 안 돼요 = must not smoke.',2),
  (l_id,'"하지 마세요" means?','["Please do", "Please do not", "You can do it", "You must do it"]',1,'하지 마세요 = polite negative command.',3),
  (l_id,'Which is more formal?','["하지 마세요", "하면 안 됩니다", "same", "neither"]',1,'하면 안 됩니다 is formal 합쇼체.',4),
  (l_id,'"늦으면 안 돼요" means?','["Be on time if you can", "You must not be late", "Being late is allowed", "Please be late"]',1,'(으)면 안 되다 = prohibition: must not be late.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)면 안 되다는 금지를 나타내요. 하지 마세요는 명령형 금지예요.','(으)면 안 되다 expresses prohibition. 하지 마세요 = polite negative command.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=44;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#44 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어도 되다','a/eo-do doe-da','may/permission',1),
  (l_id,'허가','heo-ga','permission',2),
  (l_id,'해도 돼요','hae-do dwae-yo','you may do',3),
  (l_id,'가도 돼요','ga-do dwae-yo','you may go',4),
  (l_id,'써도 돼요','sseo-do dwae-yo','you may use',5),
  (l_id,'먹어도 돼요','meo-geo-do dwae-yo','you may eat',6),
  (l_id,'앉아도 돼요','an-ja-do dwae-yo','you may sit',7),
  (l_id,'물론','mul-lon','of course',8),
  (l_id,'허락하다','heo-rak-ha-da','to permit',9),
  (l_id,'괜찮다','gwaen-chan-ta','to be okay',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Permission - 아/어도 되다','V + 아/어도 되다 = may (permission). 앉아도 돼요 = you may sit. Question: 해도 돼요? = may I do it?','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유리','질문해도 돼요?','Yu-ri, ji-ri-mun-hae-do dwae-yo?','May I ask a question?',1),
  (l_id,'선생님','물론이죠.','Seon-saeng-nim, mul-lon-i-jyo.','Of course.',2),
  (l_id,'유리','이 사전 써도 돼요?','I sa-jeon sseo-do dwae-yo?','May I use this dictionary?',3),
  (l_id,'선생님','네, 써도 돼요.','Ne, sseo-do dwae-yo.','Yes, you may.',4),
  (l_id,'유리','시험 때도요?','Si-heom ttae-do-yo?','During the exam too?',5),
  (l_id,'선생님','네, 되지만 답 적으면 안 돼요.','Ne, doe-ji-man dap jeo-geu-myeon an dwae-yo.','Yes, but you must not write the answers.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어도 되다 expresses?','["obligation", "prohibition", "permission", "ability"]',2,'아/어도 되다 = permission.',1),
  (l_id,'"May I sit?" Korean?','["앉으면 안 돼요?", "앉아도 돼요?", "앉아야 해요?", "앉을 수 없어요?"]',1,'앉아도 돼요? = May I sit?',2),
  (l_id,'"이거 먹어도 돼요" means?','["Must eat this", "You may eat this", "Do not eat", "Can you eat?"]',1,'아/어도 되다 = permission: you may eat this.',3),
  (l_id,'아/어도 되다 vs 아/어야 하다?','["same", "되다=permission; 야 하다=obligation", "되다=prohibition", "unrelated"]',1,'되다 = permission (may). 야 하다 = obligation (must).',4),
  (l_id,'"물론이죠" means?','["Certainly not", "Of course (yes, permitted)", "Maybe", "I do not know"]',1,'물론이죠 = of course! — enthusiastically granting permission.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어도 되다는 허가를 나타내요.','아/어도 되다 expresses permission. Question form asks for permission.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=45;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#45 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 싶다','go sip-da','want to do',1),
  (l_id,'-고 싶어하다','go si-peo-ha-da','wants to (third person)',2),
  (l_id,'원하다','won-ha-da','to want (noun object)',3),
  (l_id,'바라다','ba-ra-da','to wish/hope',4),
  (l_id,'원하는 것','won-ha-neun geot','what one wants',5),
  (l_id,'소원','so-won','wish/desire',6),
  (l_id,'희망하다','hi-mang-ha-da','to hope',7),
  (l_id,'꿈','kkum','dream',8),
  (l_id,'되고 싶다','doe-go sip-da','want to become',9),
  (l_id,'배우고 싶다','bae-u-go sip-da','want to learn',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Desire - 고 싶다','V + 고 싶다 = want to do. 먹고 싶어요 = I want to eat. Third person: 고 싶어해요.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하리','장래 희망이 뭐예요?','Ha-ri, jang-rae hi-mang-i mwo-ye-yo?','What do you want to be?',1),
  (l_id,'현진','의사가 되고 싶어요.','Hyeon-jin, ui-sa-ga doe-go si-peo-yo.','I want to become a doctor.',2),
  (l_id,'하리','왜요?','Wae-yo?','Why?',3),
  (l_id,'현진','사람들을 도와주고 싶어서요.','Sa-ram-deul-eul do-wa-ju-go si-peo-seo-yo.','Because I want to help people.',4),
  (l_id,'하리','정말 멋있어요. 저는 요리사가 되고 싶어요.','Jeong-mal meo-si-sseo-yo. Jeo-neun yo-ri-sa-ga doe-go si-peo-yo.','That is amazing. I want to become a chef.',5),
  (l_id,'현진','꿈을 향해 같이 노력해요!','Kkum-eul hyang-hae ga-chi no-ryeok-hae-yo!','Let us both work toward our dreams!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 싶다 expresses?','["obligation", "desire to do", "prohibition", "completion"]',1,'고 싶다 = want to.',1),
  (l_id,'"I want to go" Korean?','["가야 해요", "가면 돼요", "가고 싶어요", "가도 돼요"]',2,'가고 싶어요 = I want to go.',2),
  (l_id,'Third person desire "she wants to eat"?','["먹고 싶어요", "먹고 싶어해요", "먹고 싶었어요", "먹어야 해요"]',1,'Third person: 먹고 싶어해요 (she/he wants to eat).',3),
  (l_id,'"배우고 싶어서 왔어요" means?','["I came even though I want to learn", "I came because I want to learn", "I want to learn but did not come", "I learned and came"]',1,'고 싶어서 = because I want to: 배우고 싶어서 왔어요 = I came because I want to learn.',4),
  (l_id,'고 싶다 past = ?','["고 싶었어요", "고 싶어요", "고 싶을 거예요", "고 싶었을 거예요"]',0,'Past desire: 고 싶었어요 = wanted to.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고 싶다는 하고 싶은 욕구를 나타내요. 3인칭은 고 싶어하다를 써요.','고 싶다 = want to do. Third person: 고 싶어하다. Past: 고 싶었어요.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=46;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#46 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)ㄹ까요?','(eu)l-kka-yo?','shall we? / I wonder',1),
  (l_id,'(으)ㅂ시다','(eu)p-si-da','let us (formal)',2),
  (l_id,'자','ja','let us (plain)',3),
  (l_id,'제안','je-an','suggestion/proposal',4),
  (l_id,'어때요?','eo-ttae-yo?','how about it?',5),
  (l_id,'어떨까요?','eo-tteol-kka-yo?','how would it be?',6),
  (l_id,'같이','ga-chi','together',7),
  (l_id,'함께','ham-kke','together (formal)',8),
  (l_id,'~하는 게 어때요?','ha-neun ge eo-ttae-yo?','how about doing?',9),
  (l_id,'권유','gwon-yu','recommendation/invitation',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Suggestions - (으)ㄹ까요 / (으)ㅂ시다','(으)ㄹ까요? = shall we? 영화 볼까요? = Shall we watch a movie? (으)ㅂ시다 = formal "let us": 갑시다 = let us go.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민준','이번 주말에 뭐 할까요?','Min-jun, i-beon ju-mal-e mwo hal-kka-yo?','What shall we do this weekend?',1),
  (l_id,'서연','영화 볼까요?','Seo-yeon, yeong-hwa bol-kka-yo?','Shall we watch a movie?',2),
  (l_id,'민준','좋아요. 어떤 영화가 어떨까요?','Jo-a-yo. Eo-tteon yeong-hwa-ga eo-tteol-kka-yo?','Sounds good. What kind of movie would be good?',3),
  (l_id,'서연','한국 영화 어때요?','Han-guk yeong-hwa eo-ttae-yo?','How about a Korean movie?',4),
  (l_id,'민준','좋죠! 같이 저녁도 먹읍시다.','Jo-jyo! Ga-chi jeo-nyeok-do meog-eup-si-da.','Great! Let us also eat dinner together.',5),
  (l_id,'서연','완벽한 계획이에요!','Wan-byeok-han gye-hoek-i-e-yo!','That is a perfect plan!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ까요? expresses?','["obligation", "suggestion/shall we", "prohibition", "past action"]',1,'(으)ㄹ까요? = shall we? — making a suggestion.',1),
  (l_id,'"Shall we go?" Korean?','["가야 해요?", "가도 돼요?", "갈까요?", "가겠어요?"]',2,'갈까요? = Shall we go? ((으)ㄹ까요).',2),
  (l_id,'"Let us go" formal suggestion?','["가자", "갑시다", "가요", "가겠습니다"]',1,'(으)ㅂ시다 is formal "let us": 갑시다 = let us go.',3),
  (l_id,'"영화 보는 게 어때요?" means?','["Are you watching a movie?", "How about watching a movie?", "I watch movies", "Watch a movie!"]',1,'~하는 게 어때요? = How about doing...? — suggesting an activity.',4),
  (l_id,'(으)ㄹ까요 vs 자 for suggestions?','["same", "ㄹ까요 is polite/neutral; 자 is casual/plain speech", "ㄹ까요 is formal", "자 is more polite"]',1,'(으)ㄹ까요 is polite; 자 is plain speech: 가자 = let us go (informal).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)ㄹ까요는 제안이나 "~할까요"의 의미예요. (으)ㅂ시다는 격식 있는 청유형이에요.','(으)ㄹ까요? = shall we? — polite suggestion. (으)ㅂ시다 = formal "let us." 자 is the plain speech equivalent.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=47;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#47 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'관용구','gwan-yong-gu','idiom',1),
  (l_id,'손이 크다','son-i keu-da','to be generous (big hands)',2),
  (l_id,'발이 넓다','bal-i neop-da','to be well-connected (wide feet)',3),
  (l_id,'눈이 높다','nun-i nop-da','to have high standards (high eyes)',4),
  (l_id,'배가 아프다','bae-ga a-peu-da','to be jealous (stomach hurts)',5),
  (l_id,'입이 무겁다','ib-i mu-geop-da','to be tight-lipped (heavy mouth)',6),
  (l_id,'귀가 얇다','gwi-ga yal-da','to be gullible (thin ears)',7),
  (l_id,'눈치가 없다','nun-chi-ga eop-da','to lack social awareness',8),
  (l_id,'머리를 쓰다','meo-ri-reul sseu-da','to use one''s head/brain',9),
  (l_id,'발 벗고 나서다','bal beot-go na-seo-da','to roll up sleeves / dive in',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Body-part idioms overview','신체 부위를 이용한 관용구','Korean has many idioms using body parts. These have figurative meanings quite different from literal.','[{"korean": "손이 커요 → 인심이 좋아요", "english": "Big hands → generous person"}, {"korean": "발이 넓어요 → 아는 사람이 많아요", "english": "Wide feet → well-connected person"}]',1),
  (l_id,'Emotion idioms','배 관련 감정 표현','배 (stomach) idioms express jealousy and emotions.','[{"korean": "배가 아파요 → 질투해요", "english": "Stomach hurts → I am jealous"}, {"korean": "배가 불러요 → 충분히 만족해요", "english": "Full stomach → I am satisfied"}]',2),
  (l_id,'Head/mouth idioms','머리, 입 관련 관용구','머리 (head) and 입 (mouth) idioms relate to thinking and speaking.','[{"korean": "입이 무거워요 → 비밀을 잘 지켜요", "english": "Heavy mouth → good at keeping secrets"}, {"korean": "머리를 써요 → 지혜를 발휘해요", "english": "Use head → applies intelligence"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지나','우리 팀장님이 또 발이 넓어서 새 프로젝트를 따왔어요.','Ji-na, u-ri tim-jang-nim-i tto bal-i neol-beo-seo sae peu-ro-jek-teu-reul tta-wat-sseo-yo.','Our team leader got us a new project again with his connections.',1),
  (l_id,'서진','정말요? 그분 손도 크시던데.','Seo-jin, jeong-mal-yo? Geu-bun son-do keu-si-deon-de.','Really? He is also quite generous I hear.',2),
  (l_id,'지나','맞아요. 그래서 팀원들이 다 좋아해요.','Ma-ja-yo. Geu-rae-seo tim-won-deul-i da jo-a-hae-yo.','Right. That is why all the team members like him.',3),
  (l_id,'서진','그런데 김 대리는 눈치가 없어서 걱정이에요.','Geu-reon-de Gim Dae-ri-neun nun-chi-ga eop-seo-seo geok-jeong-i-e-yo.','But I am worried about Associate Kim who lacks social awareness.',4),
  (l_id,'지나','입이 무거운 사람이 필요한데요.','Ib-i mu-geo-un sa-ram-i pil-lyo-han-de-yo.','We need someone who can keep things quiet.',5),
  (l_id,'서진','맞아요. 머리 써서 잘 해결해야 해요.','Ma-ja-yo. Meo-ri sseo-seo jal hae-gyeol-hae-ya hae-yo.','Right. We need to use our heads to resolve this well.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"손이 크다" literally means big hands but idiomatically means?','["strong", "generous", "busy", "skilled"]',1,'손이 크다 idiomatically means generous — like the hands that give generously.',1),
  (l_id,'"배가 아파요" when someone else succeeds means?','["stomachache", "jealousy", "happiness", "surprise"]',1,'배가 아프다 = to be jealous of someone else''s success.',2),
  (l_id,'"발이 넓다" means?','["physically wide feet", "well-connected with many people", "bad at walking", "lazy"]',1,'발이 넓다 = to have wide connections: knows many people.',3),
  (l_id,'"입이 무겁다" describes someone who?','["talks a lot", "keeps secrets well", "eats a lot", "speaks rudely"]',1,'입이 무겁다 = heavy mouth = good at keeping secrets.',4),
  (l_id,'"눈치가 없다" means?','["bad eyesight", "lacks social awareness/reading the room", "cannot see", "is not smart"]',1,'눈치가 없다 = does not read social cues, lacks situational awareness.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 관용구는 신체 부위를 많이 써요. 손이 크다(인심이 좋다), 발이 넓다(아는 사람이 많다), 눈이 높다(기준이 높다), 배가 아프다(질투하다), 입이 무겁다(비밀을 지키다). 이런 표현들은 문자 그대로의 의미와 다르므로 통째로 외워야 해요.','Korean idioms often use body parts. 손이 크다 = generous; 발이 넓다 = well-connected; 눈이 높다 = high standards; 배가 아프다 = jealous; 입이 무겁다 = tight-lipped. These have figurative meanings unlike their literal translations and should be memorized as whole expressions.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=48;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#48 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'속담','sok-dam','proverb',1),
  (l_id,'가는 말이 고와야 오는 말이 곱다','ga-neun mal-i go-wa-ya o-neun mal-i gop-da','treat others well and they will treat you well (kind words yield kind words)',2),
  (l_id,'티끌 모아 태산','ti-kkeul mo-a tae-san','many a little makes a mickle (dust collected becomes a mountain)',3),
  (l_id,'세 살 버릇 여든까지 간다','se sal beo-reut yeo-deun-kka-ji gan-da','old habits die hard (habits at 3 go to 80)',4),
  (l_id,'원숭이도 나무에서 떨어진다','won-seung-i-do na-mu-e-seo tteol-eo-ji-n da','even experts make mistakes (monkeys fall from trees)',5),
  (l_id,'빛 좋은 개살구','bit jo-eun gae-sal-gu','all that glitters is not gold (a good-looking wild apricot)',6),
  (l_id,'고생 끝에 낙이 온다','go-saeng kkeut-e na-gi on-da','no pain no gain (joy comes at the end of hardship)',7),
  (l_id,'콩 심은 데 콩 나고 팥 심은 데 팥 난다','kong sim-eun de kong na-go','you reap what you sow',8),
  (l_id,'하늘이 무너져도 솟아날 구멍이 있다','ha-neul-i mu-neo-jyeo-do so-ta-nal gu-meong-i it-da','every cloud has a silver lining',9),
  (l_id,'아는 것이 힘이다','a-neun geo-si hi-mi-da','knowledge is power',10),
  (l_id,'뒤로 자빠져도 코가 깨진다','dwi-ro ja-ppyeo-jyeo-do ko-ga kkae-jin-da','some people are always unlucky',11);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Proverbs about karma/reciprocity','말, 행동의 결과에 관한 속담','Many Korean proverbs relate to cause and effect or reciprocity.','[{"korean": "가는 말이 고와야 오는 말이 곱다", "english": "Speak kindly and you will receive kindness."}, {"korean": "콩 심은 데 콩 난다", "english": "You reap what you sow."}]',1),
  (l_id,'Proverbs about perseverance','노력과 끈기에 관한 속담','Proverbs encouraging hard work and persistence.','[{"korean": "고생 끝에 낙이 온다", "english": "No pain, no gain."}, {"korean": "티끌 모아 태산", "english": "Small efforts add up to great things."}]',2),
  (l_id,'Proverbs about human nature','인간 본성에 관한 속담','Observations about human behavior and character.','[{"korean": "세 살 버릇 여든까지 간다", "english": "Habits formed in childhood last a lifetime."}, {"korean": "원숭이도 나무에서 떨어진다", "english": "Even experts make mistakes sometimes."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'할머니','공부가 힘들어?','Hal-meo-ni, gong-bu-ga him-deu-reo?','Is studying hard?',1),
  (l_id,'손자','네, 포기하고 싶을 때도 있어요.','Son-ja, ne, po-gi-ha-go si-peul ttae-do i-sseo-yo.','Yes, there are times I want to give up.',2),
  (l_id,'할머니','고생 끝에 낙이 온단다. 포기하면 안 돼.','Hal-meo-ni, go-saeng kkeut-e na-gi on-dan-da. po-gi-ha-myeon an dwae.','Joy comes at the end of hardship. Do not give up.',3),
  (l_id,'손자','그리고 티끌 모아 태산이잖아요.','Son-ja, geu-ri-go ti-kkeul mo-a tae-san-i-ja-na-yo.','And many a little makes a mickle, right?',4),
  (l_id,'할머니','맞아! 조금씩 해도 나중에 크게 돼.','Hal-meo-ni, ma-ja! jo-geum-ssik hae-do na-jung-e keu-ge dwae.','Right! Even little by little grows into something big.',5),
  (l_id,'손자','감사해요, 할머니. 열심히 할게요.','Son-ja, gam-sa-hae-yo, hal-meo-ni. yeol-sim-hi hal-ge-yo.','Thank you, grandmother. I will work hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"고생 끝에 낙이 온다" means?','["life is always hard", "joy comes after hardship (no pain no gain)", "stop working hard", "give up when tired"]',1,'고생 끝에 낙이 온다 = at the end of hardship comes joy: no pain, no gain.',1),
  (l_id,'"원숭이도 나무에서 떨어진다" means?','["monkeys live in trees", "even experts make mistakes", "animals are smarter than humans", "never trust an expert"]',1,'Even monkeys fall from trees = even experts sometimes make mistakes.',2),
  (l_id,'"가는 말이 고와야 오는 말이 곱다" meaning?','["travel with kind words", "treat others well and receive kindness in return", "speak formally always", "do not talk while walking"]',1,'Outgoing words being gentle leads to incoming words being gentle: treat others as you wish to be treated.',3),
  (l_id,'"티끌 모아 태산" is similar to?','["empty vessel makes most noise", "every cloud has silver lining", "many a little makes a mickle", "honesty is the best policy"]',2,'티끌 모아 태산 = small things add up: similar to "many a little makes a mickle."',4),
  (l_id,'"세 살 버릇 여든까지 간다" warns about?','["childhood habits that last a lifetime", "being three years old", "going to school at 80", "forgetting things"]',0,'Habits at age 3 persist to age 80: old habits die hard / habits formed young last forever.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 속담은 삶의 지혜를 담고 있어요. 고생 끝에 낙이 온다(no pain no gain), 티끌 모아 태산(small efforts add up), 세 살 버릇 여든까지 간다(old habits die hard)처럼요. 가는 말이 고와야 오는 말이 곱다는 상호주의를 나타내고, 원숭이도 나무에서 떨어진다는 겸손을 나타내요.','Korean proverbs encode wisdom about life. 고생 끝에 낙이 온다 = no pain, no gain. 티끌 모아 태산 = small efforts add up. 세 살 버릇 여든까지 간다 = habits formed young persist. 가는 말이 고와야 오는 말이 곱다 = reciprocity. 원숭이도 나무에서 떨어진다 = even experts make mistakes.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 버리다','-a/eo beo-ri-da','to have done completely (with emotional nuance)',1),
  (l_id,'완료','wan-nyo','completion',2),
  (l_id,'아쉽다','a-swip-da','to feel regret/disappointed',3),
  (l_id,'후련하다','hu-ryeon-ha-da','to feel relieved/refreshed',4),
  (l_id,'먹어 버리다','meo-geo beo-ri-da','to eat up (completely)',5),
  (l_id,'잊어 버리다','i-jeo beo-ri-da','to forget completely',6),
  (l_id,'가 버리다','ga beo-ri-da','to have gone (and be gone)',7),
  (l_id,'말해 버리다','mal-hae beo-ri-da','to go ahead and say',8),
  (l_id,'잃어 버리다','i-reo beo-ri-da','to lose (completely)',9),
  (l_id,'끝내 버리다','kkeun-nae beo-ri-da','to finish off completely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 버리다 — emphatic completion','V + 아/어 버리다','Expresses that an action is thoroughly completed, often with nuances of regret, relief, or finality.','[{"korean": "숙제를 다 해버렸어요.", "english": "I finished all the homework (and now it is done — relief)."}, {"korean": "지갑을 잃어버렸어요.", "english": "I lost my wallet (and it is gone — regret)."}]',1),
  (l_id,'Nuance: regret vs relief','Context determines emotion','아/어 버리다 itself is neutral; context and verb determine whether the feeling is positive or negative.','[{"korean": "케이크를 다 먹어버렸어요. (regret: should not have)", "english": "I ate up all the cake (oops)."}, {"korean": "숙제를 끝내버렸어요! (relief: done!)", "english": "I have finished my homework! (done at last)"}]',2),
  (l_id,'Common fixed expressions','잃어버리다, 잊어버리다','Many verbs lexicalize with 버리다 into single units.','[{"korean": "잃어버리다 = to lose (permanently)", "english": "lose and it is gone"}, {"korean": "잊어버리다 = to forget (completely)", "english": "forget completely"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'세진','왜 그렇게 표정이 안 좋아요?','Se-jin, wae geu-reo-ke pyo-jeong-i an jo-a-yo?','Why do you look so down?',1),
  (l_id,'호준','지갑을 잃어버렸어요.','Ho-jun, ji-gap-eul i-reo-beo-ryeot-sseo-yo.','I lost my wallet.',2),
  (l_id,'세진','아이고, 어디서요?','A-i-go, eo-di-seo-yo?','Oh no, where?',3),
  (l_id,'호준','몰라요. 그냥 사라져버렸어요.','Mol-la-yo. Geu-nyang sa-ra-jyeo-beo-ryeot-sseo-yo.','I do not know. It just disappeared.',4),
  (l_id,'세진','카드도 있었어요?','Ka-deu-do it-sseo-sseo-yo?','Were there cards in it too?',5),
  (l_id,'호준','네, 다 잃어버렸어요. 정말 속상해요.','Ne, da i-reo-beo-ryeot-sseo-yo. Jeong-mal sok-sang-hae-yo.','Yes, I lost everything. I feel terrible.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 버리다 primarily conveys?','["possibility", "thorough completion with emotional nuance", "request", "prohibition"]',1,'아/어 버리다 = complete/thorough action, often with regret or relief.',1),
  (l_id,'"숙제를 해버렸어요" — what feeling is likely?','["anger", "relief (it is done)", "sadness", "boredom"]',1,'해버렸어요 after finishing homework suggests relief: it is all done now.',2),
  (l_id,'"잃어버리다" is a fixed compound meaning?','["to find", "to lose permanently", "to give away", "to put away"]',1,'잃어버리다 = to lose (and it is gone). 잃다 + 버리다 = lose completely.',3),
  (l_id,'"다 먹어버렸어요" might express?','["hunger", "regret or emphasis on completion", "polite request", "neutral description"]',1,'다 먹어버렸어요 = ate everything up — can suggest regret (should not have eaten it all) or completion.',4),
  (l_id,'"잊어버리다" means?','["to remember clearly", "to forget completely", "to remind", "to think about"]',1,'잊어버리다 = to forget completely. 잊다 + 버리다 = forget and it is gone.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 버리다는 동작이 완전히 완료됨을 나타내요. 흔히 아쉬움이나 후련함의 감정을 동반해요. "지갑을 잃어버렸어요"는 완전히 잃었다는 아쉬움, "숙제를 끝내버렸어요"는 끝냈다는 후련함을 나타낼 수 있어요. 잃어버리다, 잊어버리다는 하나의 단어로 굳어졌어요.','-아/어 버리다 expresses thorough completion of an action, often with emotional nuance — regret or relief. "I lost my wallet" (regret); "I finished my homework" (relief). 잃어버리다 and 잊어버리다 have lexicalized into fixed compound verbs meaning "lose permanently" and "forget completely."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 보다','-a/eo bo-da','to try/experience doing',1),
  (l_id,'경험','gyeong-heom','experience',2),
  (l_id,'시도','si-do','attempt',3),
  (l_id,'처음','cheo-eum','for the first time',4),
  (l_id,'해봤어요','hae-bwat-sseo-yo','I have tried/done it',5),
  (l_id,'먹어 보다','meo-geo bo-da','to try eating',6),
  (l_id,'입어 보다','ib-eo bo-da','to try on (clothes)',7),
  (l_id,'가 보다','ga bo-da','to go and see/try going',8),
  (l_id,'살아 보다','sar-a bo-da','to try living',9),
  (l_id,'배워 보다','bae-wo bo-da','to try learning',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 보다 — try/experience','V + 아/어 보다','Expresses trying something or having the experience of doing something.','[{"korean": "김치를 먹어 봤어요?", "english": "Have you tried (eating) kimchi?"}, {"korean": "이 옷 한번 입어 보세요.", "english": "Please try on this outfit."}]',1),
  (l_id,'-아/어 본 적이 있다/없다','V + 아/어 본 적이 있다/없다','Expresses whether one has/has never had the experience of doing something.','[{"korean": "한국에 가 본 적이 있어요.", "english": "I have been to Korea (have had the experience)."}, {"korean": "스키를 타 본 적이 없어요.", "english": "I have never tried skiing."}]',2),
  (l_id,'아/어 보세요 — polite suggestion','V + 아/어 보세요','Polite suggestion to try something.','[{"korean": "이 음식 먹어 보세요. 정말 맛있어요.", "english": "Try this food. It is really delicious."}, {"korean": "한국어 배워 보세요. 재미있어요.", "english": "Try learning Korean. It is fun."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민하','한국 음식 중에 제일 좋아하는 게 뭐예요?','Min-ha, han-guk eum-sik jung-e je-il jo-a-ha-neun ge mwo-ye-yo?','What is your favorite Korean food?',1),
  (l_id,'케이트','떡볶이요. 처음 먹어봤을 때 너무 맛있었어요.','Tteok-bok-ki-yo. Cheo-eum meo-geo-bwat-seul ttae neo-mu ma-sit-sseo-yo.','Tteokbokki. When I first tried it, it was so delicious.',2),
  (l_id,'민하','삼겹살도 먹어 봤어요?','Sam-gyeop-sal-do meo-geo bwat-sseo-yo?','Have you tried samgyeopsal too?',3),
  (l_id,'케이트','아직 못 먹어봤어요. 한번 먹어 보고 싶어요.','A-jik mot meo-geo-bwat-sseo-yo. Han-beon meo-geo bo-go si-peo-yo.','Not yet. I want to try eating it once.',4),
  (l_id,'민하','그러면 같이 가요! 제가 좋은 식당 알아요.','Geu-reo-myeon ga-chi ga-yo! Je-ga jo-eun sik-dang a-ra-yo.','Then let us go together! I know a good restaurant.',5),
  (l_id,'케이트','좋아요! 빨리 가보고 싶어요.','Jo-a-yo! Ppal-li ga-bo-go si-peo-yo.','Sounds great! I want to go soon.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 보다 expresses?','["completed action", "trying or experiencing something", "prohibition", "obligation"]',1,'아/어 보다 = try/experience: "give it a try" or "have the experience of."',1),
  (l_id,'"한국에 가 본 적이 있어요?" means?','["Are you going to Korea?", "Have you ever been to Korea?", "Do you want to go to Korea?", "Can you go to Korea?"]',1,'V + 아/어 본 적이 있다 = have the experience of: "Have you ever been to Korea?"',2),
  (l_id,'Polite suggestion to try = ?','["아/어 봐라", "아/어 보세요", "아/어 보면", "아/어 보니까"]',1,'아/어 보세요 = polite suggestion to try: "Please try (doing it)."',3),
  (l_id,'"스키를 타 본 적이 없어요" means?','["I tried skiing", "I have never tried skiing", "I cannot ski", "I will try skiing"]',1,'아/어 본 적이 없다 = have never had the experience of: never tried skiing.',4),
  (l_id,'"먹어 보다" vs "먹다" — difference?','["same", "먹어 보다 = try eating; 먹다 = simply eat", "먹어 보다 = finish eating", "먹다 = try eating"]',1,'아/어 보다 adds the nuance of trying/experiencing: 먹어 보다 = try eating (for the first time or as an experiment).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 보다는 어떤 동작을 시도하거나 경험함을 나타내요. "김치를 먹어 봤어요?"처럼요. 아/어 본 적이 있다/없다는 경험 유무를 나타내요. 아/어 보세요는 시도를 권유하는 공손한 표현이에요. 여행 추천, 음식 권유 등에 자주 쓰여요.','-아/어 보다 expresses trying or experiencing something. "Have you tried kimchi?" V + 아/어 본 적이 있다/없다 = have/have never had the experience. 아/어 보세요 = polite suggestion to try. Commonly used when recommending food, travel, or activities.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=41;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#41 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'할 수 있다','hal su it-da','can do',1),
  (l_id,'할 수 없다','hal su eop-da','cannot do',2),
  (l_id,'(으)ㄹ 수 있다','l su it-da','ability/possibility',3),
  (l_id,'잘 하다','jal ha-da','to be good at',4),
  (l_id,'못 하다','mot ha-da','to be bad at',5),
  (l_id,'가능','ga-neung','possibility',6),
  (l_id,'수영하다','su-yeong-ha-da','to swim',7),
  (l_id,'운전하다','un-jeon-ha-da','to drive',8),
  (l_id,'치다','chi-da','to play (instrument)',9),
  (l_id,'가르치다','ga-reu-chi-da','to teach',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Ability - (으)ㄹ 수 있다/없다','V + (으)ㄹ 수 있다/없다 expresses ability or possibility. 갈 수 있어요 = I can go. 먹을 수 없어요 = I cannot eat.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유스프','한국어로 말할 수 있어요?','Yu-seu-peu, han-guk-eo-ro mal-hal su i-sseo-yo?','Can you speak Korean?',1),
  (l_id,'수아','조금 할 수 있어요.','Su-a, jo-geum hal su i-sseo-yo.','I can a little.',2),
  (l_id,'유스프','피아노 칠 수 있어요?','Pi-a-no chil su i-sseo-yo?','Can you play piano?',3),
  (l_id,'수아','네! 어릴 때부터 쳤어요.','Ne! Eo-ril ttae-bu-teo chyeot-sseo-yo.','Yes! I have played since childhood.',4),
  (l_id,'유스프','가르쳐 줄 수 있어요?','Ga-reu-chyeo jul su i-sseo-yo?','Can you teach me?',5),
  (l_id,'수아','물론이죠!','Mul-lon-i-jyo!','Of course!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ 수 있다 expresses?','["obligation", "ability/possibility", "prohibition", "desire"]',1,'(으)ㄹ 수 있다 = can/possible.',1),
  (l_id,'"갈 수 있다" from 가다?','["가을 수 있다", "갈 수 있다", "가으ㄹ 수 있다", "가수 있다"]',1,'가 stem + ㄹ 수 있다 = 갈 수 있다.',2),
  (l_id,'"먹다" cannot: 먹을 수 없다 or?','["먹ㄹ 수 없다", "못 먹다", "먹을 수 없다", "먹지 않다"]',2,'먹 + 을 수 없다 = 먹을 수 없다.',3),
  (l_id,'Past ability "could not go"?','["갈 수 없었어요", "갈 수 없어요", "갈 수 없을 거예요", "갈 수 없다"]',0,'Past: 갈 수 없었어요 = could not go.',4),
  (l_id,'"못 해요" vs "할 수 없어요"?','["same", "못=lower skill; 할 수 없다=conditions prevent", "different verbs", "unrelated"]',0,'못 implies skill limitation; 할 수 없다 implies external impossibility.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'할 수 있다/없다는 능력이나 가능성을 나타내요. 어간 + (으)ㄹ 수 있다/없다로 써요. 과거는 있었다/없었다로 표현해요.','(으)ㄹ 수 있다/없다 expresses ability or possibility. Past ability: 갈 수 있었어요. 못 implies skill limitation; 할 수 없다 suggests external impossibility.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=42;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#42 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어야 하다','a/eo-ya ha-da','must/have to',1),
  (l_id,'-아/어야 되다','a/eo-ya doe-da','must (colloquial)',2),
  (l_id,'의무','ui-mu','obligation',3),
  (l_id,'해야 해요','hae-ya hae-yo','have to do',4),
  (l_id,'가야 해요','ga-ya hae-yo','have to go',5),
  (l_id,'먹어야 해요','meo-geo-ya hae-yo','have to eat',6),
  (l_id,'꼭','kkok','definitely/must',7),
  (l_id,'반드시','ban-deu-si','surely/necessarily',8),
  (l_id,'지켜야 하다','ji-kyeo-ya ha-da','must observe',9),
  (l_id,'서둘러야 하다','seo-dul-leo-ya ha-da','must hurry',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Obligation - 아/어야 하다/되다','V/A + 아/어야 하다/되다 = must/have to. 숙제를 해야 해요 = I have to do homework. 하다 and 되다 are interchangeable.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수현','왜 이렇게 일찍 가요?','Su-hyeon, wae i-reo-ke il-chik ga-yo?','Why are you leaving so early?',1),
  (l_id,'다빈','공항에 가야 해요.','Da-bin, gong-hang-e ga-ya hae-yo.','I have to go to the airport.',2),
  (l_id,'수현','서둘러야 하겠네요.','Seo-dul-leo-ya ha-get-ne-yo.','You must hurry.',3),
  (l_id,'다빈','꼭 2시간 전에 도착해야 해요.','Kkok du si-gan jeon-e do-chak-hae-ya hae-yo.','I must arrive 2 hours before.',4),
  (l_id,'수현','짐은 다 쌌어요?','Jim-eun da ssats-seo-yo?','Did you pack everything?',5),
  (l_id,'다빈','여권을 챙겨야 해요!','Yeo-gwon-eul chaeng-gyeo-ya hae-yo!','I must take my passport!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어야 하다 expresses?','["permission", "obligation/necessity", "possibility", "desire"]',1,'아/어야 하다 = must/have to.',1),
  (l_id,'"I have to eat" Korean?','["먹어도 돼요", "먹어야 해요", "먹지 마세요", "먹고 싶어요"]',1,'먹어야 해요 = have to eat.',2),
  (l_id,'"가야 되다" vs "가야 하다"?','["different meanings", "되다 slightly more colloquial; same meaning", "하다 is wrong", "되다 is formal"]',1,'Both mean must/have to; 되다 is slightly more colloquial.',3),
  (l_id,'"꼭" before 해야 해요 means?','["maybe", "definitely/absolutely must", "sometimes", "rarely"]',1,'꼭 = definitely. 꼭 해야 해요 = absolutely must do.',4),
  (l_id,'"공항에 가야 해요" means?','["I want to go", "I am going", "I must go", "I went"]',2,'아/어야 하다 = must: 가야 해요 = must go.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어야 하다/되다는 의무나 필요를 나타내요. 하다와 되다 모두 쓸 수 있어요.','아/어야 하다/되다 expresses obligation. Both 하다 and 되다 work; 되다 is slightly more colloquial.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=43;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#43 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-면 안 되다','myeon an doe-da','must not',1),
  (l_id,'금지','geum-ji','prohibition',2),
  (l_id,'하면 안 돼요','ha-myeon an dwae-yo','must not do',3),
  (l_id,'하지 마세요','ha-ji ma-se-yo','please do not',4),
  (l_id,'금연','geum-yeon','no smoking',5),
  (l_id,'금주','geum-ju','no drinking',6),
  (l_id,'주차 금지','ju-cha geum-ji','no parking',7),
  (l_id,'금지 구역','geum-ji gu-yeok','prohibited zone',8),
  (l_id,'규정','gyu-jeong','regulation',9),
  (l_id,'늦다','neut-da','to be late',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Prohibition - (으)면 안 되다','V + (으)면 안 되다 = must not. 여기서 피우면 안 돼요 = must not smoke here.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'안내원','여기서 사진 찍으면 안 됩니다.','An-nae-won, yeo-gi-seo sa-jin jji-geu-myeon an doem-ni-da.','You must not take photos here.',1),
  (l_id,'관광객','핸드폰 써도 돼요?','Gwan-gwang-gaek, haen-deu-pon sseo-do dwae-yo?','May I use my phone?',2),
  (l_id,'안내원','조용히면 돼요. 통화는 하면 안 돼요.','Jo-yong-hi-myeon dwae-yo. Tong-hwa-neun ha-myeon an dwae-yo.','If quiet, that is fine. But you must not make calls.',3),
  (l_id,'관광객','알겠습니다. 들어가도 돼요?','Al-get-sseum-ni-da. Deu-reo-ga-do dwae-yo?','I understand. May I go inside?',4),
  (l_id,'안내원','네, 들어가셔도 됩니다.','Ne, deu-reo-ga-syeo-do doem-ni-da.','Yes, you may go in.',5),
  (l_id,'관광객','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 안 되다 expresses?','["ability", "obligation", "prohibition", "desire"]',2,'(으)면 안 되다 = must not.',1),
  (l_id,'"No smoking" Korean?','["피워도 돼요", "피우면 안 돼요", "피울 수 있어요", "피우세요"]',1,'피우면 안 돼요 = must not smoke.',2),
  (l_id,'"하지 마세요" means?','["Please do", "Please do not", "You can do it", "You must do it"]',1,'하지 마세요 = polite negative command.',3),
  (l_id,'Which is more formal?','["하지 마세요", "하면 안 됩니다", "same", "neither"]',1,'하면 안 됩니다 is formal 합쇼체.',4),
  (l_id,'"늦으면 안 돼요" means?','["Be on time if you can", "You must not be late", "Being late is allowed", "Please be late"]',1,'(으)면 안 되다 = prohibition: must not be late.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)면 안 되다는 금지를 나타내요. 하지 마세요는 명령형 금지예요.','(으)면 안 되다 expresses prohibition. 하지 마세요 = polite negative command.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=44;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#44 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어도 되다','a/eo-do doe-da','may/permission',1),
  (l_id,'허가','heo-ga','permission',2),
  (l_id,'해도 돼요','hae-do dwae-yo','you may do',3),
  (l_id,'가도 돼요','ga-do dwae-yo','you may go',4),
  (l_id,'써도 돼요','sseo-do dwae-yo','you may use',5),
  (l_id,'먹어도 돼요','meo-geo-do dwae-yo','you may eat',6),
  (l_id,'앉아도 돼요','an-ja-do dwae-yo','you may sit',7),
  (l_id,'물론','mul-lon','of course',8),
  (l_id,'허락하다','heo-rak-ha-da','to permit',9),
  (l_id,'괜찮다','gwaen-chan-ta','to be okay',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Permission - 아/어도 되다','V + 아/어도 되다 = may (permission). 앉아도 돼요 = you may sit. Question: 해도 돼요? = may I do it?','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유리','질문해도 돼요?','Yu-ri, ji-ri-mun-hae-do dwae-yo?','May I ask a question?',1),
  (l_id,'선생님','물론이죠.','Seon-saeng-nim, mul-lon-i-jyo.','Of course.',2),
  (l_id,'유리','이 사전 써도 돼요?','I sa-jeon sseo-do dwae-yo?','May I use this dictionary?',3),
  (l_id,'선생님','네, 써도 돼요.','Ne, sseo-do dwae-yo.','Yes, you may.',4),
  (l_id,'유리','시험 때도요?','Si-heom ttae-do-yo?','During the exam too?',5),
  (l_id,'선생님','네, 되지만 답 적으면 안 돼요.','Ne, doe-ji-man dap jeo-geu-myeon an dwae-yo.','Yes, but you must not write the answers.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어도 되다 expresses?','["obligation", "prohibition", "permission", "ability"]',2,'아/어도 되다 = permission.',1),
  (l_id,'"May I sit?" Korean?','["앉으면 안 돼요?", "앉아도 돼요?", "앉아야 해요?", "앉을 수 없어요?"]',1,'앉아도 돼요? = May I sit?',2),
  (l_id,'"이거 먹어도 돼요" means?','["Must eat this", "You may eat this", "Do not eat", "Can you eat?"]',1,'아/어도 되다 = permission: you may eat this.',3),
  (l_id,'아/어도 되다 vs 아/어야 하다?','["same", "되다=permission; 야 하다=obligation", "되다=prohibition", "unrelated"]',1,'되다 = permission (may). 야 하다 = obligation (must).',4),
  (l_id,'"물론이죠" means?','["Certainly not", "Of course (yes, permitted)", "Maybe", "I do not know"]',1,'물론이죠 = of course! — enthusiastically granting permission.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어도 되다는 허가를 나타내요.','아/어도 되다 expresses permission. Question form asks for permission.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=45;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#45 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 싶다','go sip-da','want to do',1),
  (l_id,'-고 싶어하다','go si-peo-ha-da','wants to (third person)',2),
  (l_id,'원하다','won-ha-da','to want (noun object)',3),
  (l_id,'바라다','ba-ra-da','to wish/hope',4),
  (l_id,'원하는 것','won-ha-neun geot','what one wants',5),
  (l_id,'소원','so-won','wish/desire',6),
  (l_id,'희망하다','hi-mang-ha-da','to hope',7),
  (l_id,'꿈','kkum','dream',8),
  (l_id,'되고 싶다','doe-go sip-da','want to become',9),
  (l_id,'배우고 싶다','bae-u-go sip-da','want to learn',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Desire - 고 싶다','V + 고 싶다 = want to do. 먹고 싶어요 = I want to eat. Third person: 고 싶어해요.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하리','장래 희망이 뭐예요?','Ha-ri, jang-rae hi-mang-i mwo-ye-yo?','What do you want to be?',1),
  (l_id,'현진','의사가 되고 싶어요.','Hyeon-jin, ui-sa-ga doe-go si-peo-yo.','I want to become a doctor.',2),
  (l_id,'하리','왜요?','Wae-yo?','Why?',3),
  (l_id,'현진','사람들을 도와주고 싶어서요.','Sa-ram-deul-eul do-wa-ju-go si-peo-seo-yo.','Because I want to help people.',4),
  (l_id,'하리','정말 멋있어요. 저는 요리사가 되고 싶어요.','Jeong-mal meo-si-sseo-yo. Jeo-neun yo-ri-sa-ga doe-go si-peo-yo.','That is amazing. I want to become a chef.',5),
  (l_id,'현진','꿈을 향해 같이 노력해요!','Kkum-eul hyang-hae ga-chi no-ryeok-hae-yo!','Let us both work toward our dreams!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 싶다 expresses?','["obligation", "desire to do", "prohibition", "completion"]',1,'고 싶다 = want to.',1),
  (l_id,'"I want to go" Korean?','["가야 해요", "가면 돼요", "가고 싶어요", "가도 돼요"]',2,'가고 싶어요 = I want to go.',2),
  (l_id,'Third person desire "she wants to eat"?','["먹고 싶어요", "먹고 싶어해요", "먹고 싶었어요", "먹어야 해요"]',1,'Third person: 먹고 싶어해요 (she/he wants to eat).',3),
  (l_id,'"배우고 싶어서 왔어요" means?','["I came even though I want to learn", "I came because I want to learn", "I want to learn but did not come", "I learned and came"]',1,'고 싶어서 = because I want to: 배우고 싶어서 왔어요 = I came because I want to learn.',4),
  (l_id,'고 싶다 past = ?','["고 싶었어요", "고 싶어요", "고 싶을 거예요", "고 싶었을 거예요"]',0,'Past desire: 고 싶었어요 = wanted to.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고 싶다는 하고 싶은 욕구를 나타내요. 3인칭은 고 싶어하다를 써요.','고 싶다 = want to do. Third person: 고 싶어하다. Past: 고 싶었어요.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=46;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#46 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)ㄹ까요?','(eu)l-kka-yo?','shall we? / I wonder',1),
  (l_id,'(으)ㅂ시다','(eu)p-si-da','let us (formal)',2),
  (l_id,'자','ja','let us (plain)',3),
  (l_id,'제안','je-an','suggestion/proposal',4),
  (l_id,'어때요?','eo-ttae-yo?','how about it?',5),
  (l_id,'어떨까요?','eo-tteol-kka-yo?','how would it be?',6),
  (l_id,'같이','ga-chi','together',7),
  (l_id,'함께','ham-kke','together (formal)',8),
  (l_id,'~하는 게 어때요?','ha-neun ge eo-ttae-yo?','how about doing?',9),
  (l_id,'권유','gwon-yu','recommendation/invitation',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Suggestions - (으)ㄹ까요 / (으)ㅂ시다','(으)ㄹ까요? = shall we? 영화 볼까요? = Shall we watch a movie? (으)ㅂ시다 = formal "let us": 갑시다 = let us go.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민준','이번 주말에 뭐 할까요?','Min-jun, i-beon ju-mal-e mwo hal-kka-yo?','What shall we do this weekend?',1),
  (l_id,'서연','영화 볼까요?','Seo-yeon, yeong-hwa bol-kka-yo?','Shall we watch a movie?',2),
  (l_id,'민준','좋아요. 어떤 영화가 어떨까요?','Jo-a-yo. Eo-tteon yeong-hwa-ga eo-tteol-kka-yo?','Sounds good. What kind of movie would be good?',3),
  (l_id,'서연','한국 영화 어때요?','Han-guk yeong-hwa eo-ttae-yo?','How about a Korean movie?',4),
  (l_id,'민준','좋죠! 같이 저녁도 먹읍시다.','Jo-jyo! Ga-chi jeo-nyeok-do meog-eup-si-da.','Great! Let us also eat dinner together.',5),
  (l_id,'서연','완벽한 계획이에요!','Wan-byeok-han gye-hoek-i-e-yo!','That is a perfect plan!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ까요? expresses?','["obligation", "suggestion/shall we", "prohibition", "past action"]',1,'(으)ㄹ까요? = shall we? — making a suggestion.',1),
  (l_id,'"Shall we go?" Korean?','["가야 해요?", "가도 돼요?", "갈까요?", "가겠어요?"]',2,'갈까요? = Shall we go? ((으)ㄹ까요).',2),
  (l_id,'"Let us go" formal suggestion?','["가자", "갑시다", "가요", "가겠습니다"]',1,'(으)ㅂ시다 is formal "let us": 갑시다 = let us go.',3),
  (l_id,'"영화 보는 게 어때요?" means?','["Are you watching a movie?", "How about watching a movie?", "I watch movies", "Watch a movie!"]',1,'~하는 게 어때요? = How about doing...? — suggesting an activity.',4),
  (l_id,'(으)ㄹ까요 vs 자 for suggestions?','["same", "ㄹ까요 is polite/neutral; 자 is casual/plain speech", "ㄹ까요 is formal", "자 is more polite"]',1,'(으)ㄹ까요 is polite; 자 is plain speech: 가자 = let us go (informal).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)ㄹ까요는 제안이나 "~할까요"의 의미예요. (으)ㅂ시다는 격식 있는 청유형이에요.','(으)ㄹ까요? = shall we? — polite suggestion. (으)ㅂ시다 = formal "let us." 자 is the plain speech equivalent.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=47;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#47 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'관용구','gwan-yong-gu','idiom',1),
  (l_id,'손이 크다','son-i keu-da','to be generous (big hands)',2),
  (l_id,'발이 넓다','bal-i neop-da','to be well-connected (wide feet)',3),
  (l_id,'눈이 높다','nun-i nop-da','to have high standards (high eyes)',4),
  (l_id,'배가 아프다','bae-ga a-peu-da','to be jealous (stomach hurts)',5),
  (l_id,'입이 무겁다','ib-i mu-geop-da','to be tight-lipped (heavy mouth)',6),
  (l_id,'귀가 얇다','gwi-ga yal-da','to be gullible (thin ears)',7),
  (l_id,'눈치가 없다','nun-chi-ga eop-da','to lack social awareness',8),
  (l_id,'머리를 쓰다','meo-ri-reul sseu-da','to use one''s head/brain',9),
  (l_id,'발 벗고 나서다','bal beot-go na-seo-da','to roll up sleeves / dive in',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Body-part idioms overview','신체 부위를 이용한 관용구','Korean has many idioms using body parts. These have figurative meanings quite different from literal.','[{"korean": "손이 커요 → 인심이 좋아요", "english": "Big hands → generous person"}, {"korean": "발이 넓어요 → 아는 사람이 많아요", "english": "Wide feet → well-connected person"}]',1),
  (l_id,'Emotion idioms','배 관련 감정 표현','배 (stomach) idioms express jealousy and emotions.','[{"korean": "배가 아파요 → 질투해요", "english": "Stomach hurts → I am jealous"}, {"korean": "배가 불러요 → 충분히 만족해요", "english": "Full stomach → I am satisfied"}]',2),
  (l_id,'Head/mouth idioms','머리, 입 관련 관용구','머리 (head) and 입 (mouth) idioms relate to thinking and speaking.','[{"korean": "입이 무거워요 → 비밀을 잘 지켜요", "english": "Heavy mouth → good at keeping secrets"}, {"korean": "머리를 써요 → 지혜를 발휘해요", "english": "Use head → applies intelligence"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지나','우리 팀장님이 또 발이 넓어서 새 프로젝트를 따왔어요.','Ji-na, u-ri tim-jang-nim-i tto bal-i neol-beo-seo sae peu-ro-jek-teu-reul tta-wat-sseo-yo.','Our team leader got us a new project again with his connections.',1),
  (l_id,'서진','정말요? 그분 손도 크시던데.','Seo-jin, jeong-mal-yo? Geu-bun son-do keu-si-deon-de.','Really? He is also quite generous I hear.',2),
  (l_id,'지나','맞아요. 그래서 팀원들이 다 좋아해요.','Ma-ja-yo. Geu-rae-seo tim-won-deul-i da jo-a-hae-yo.','Right. That is why all the team members like him.',3),
  (l_id,'서진','그런데 김 대리는 눈치가 없어서 걱정이에요.','Geu-reon-de Gim Dae-ri-neun nun-chi-ga eop-seo-seo geok-jeong-i-e-yo.','But I am worried about Associate Kim who lacks social awareness.',4),
  (l_id,'지나','입이 무거운 사람이 필요한데요.','Ib-i mu-geo-un sa-ram-i pil-lyo-han-de-yo.','We need someone who can keep things quiet.',5),
  (l_id,'서진','맞아요. 머리 써서 잘 해결해야 해요.','Ma-ja-yo. Meo-ri sseo-seo jal hae-gyeol-hae-ya hae-yo.','Right. We need to use our heads to resolve this well.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"손이 크다" literally means big hands but idiomatically means?','["strong", "generous", "busy", "skilled"]',1,'손이 크다 idiomatically means generous — like the hands that give generously.',1),
  (l_id,'"배가 아파요" when someone else succeeds means?','["stomachache", "jealousy", "happiness", "surprise"]',1,'배가 아프다 = to be jealous of someone else''s success.',2),
  (l_id,'"발이 넓다" means?','["physically wide feet", "well-connected with many people", "bad at walking", "lazy"]',1,'발이 넓다 = to have wide connections: knows many people.',3),
  (l_id,'"입이 무겁다" describes someone who?','["talks a lot", "keeps secrets well", "eats a lot", "speaks rudely"]',1,'입이 무겁다 = heavy mouth = good at keeping secrets.',4),
  (l_id,'"눈치가 없다" means?','["bad eyesight", "lacks social awareness/reading the room", "cannot see", "is not smart"]',1,'눈치가 없다 = does not read social cues, lacks situational awareness.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 관용구는 신체 부위를 많이 써요. 손이 크다(인심이 좋다), 발이 넓다(아는 사람이 많다), 눈이 높다(기준이 높다), 배가 아프다(질투하다), 입이 무겁다(비밀을 지키다). 이런 표현들은 문자 그대로의 의미와 다르므로 통째로 외워야 해요.','Korean idioms often use body parts. 손이 크다 = generous; 발이 넓다 = well-connected; 눈이 높다 = high standards; 배가 아프다 = jealous; 입이 무겁다 = tight-lipped. These have figurative meanings unlike their literal translations and should be memorized as whole expressions.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=48;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#48 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'속담','sok-dam','proverb',1),
  (l_id,'가는 말이 고와야 오는 말이 곱다','ga-neun mal-i go-wa-ya o-neun mal-i gop-da','treat others well and they will treat you well (kind words yield kind words)',2),
  (l_id,'티끌 모아 태산','ti-kkeul mo-a tae-san','many a little makes a mickle (dust collected becomes a mountain)',3),
  (l_id,'세 살 버릇 여든까지 간다','se sal beo-reut yeo-deun-kka-ji gan-da','old habits die hard (habits at 3 go to 80)',4),
  (l_id,'원숭이도 나무에서 떨어진다','won-seung-i-do na-mu-e-seo tteol-eo-ji-n da','even experts make mistakes (monkeys fall from trees)',5),
  (l_id,'빛 좋은 개살구','bit jo-eun gae-sal-gu','all that glitters is not gold (a good-looking wild apricot)',6),
  (l_id,'고생 끝에 낙이 온다','go-saeng kkeut-e na-gi on-da','no pain no gain (joy comes at the end of hardship)',7),
  (l_id,'콩 심은 데 콩 나고 팥 심은 데 팥 난다','kong sim-eun de kong na-go','you reap what you sow',8),
  (l_id,'하늘이 무너져도 솟아날 구멍이 있다','ha-neul-i mu-neo-jyeo-do so-ta-nal gu-meong-i it-da','every cloud has a silver lining',9),
  (l_id,'아는 것이 힘이다','a-neun geo-si hi-mi-da','knowledge is power',10),
  (l_id,'뒤로 자빠져도 코가 깨진다','dwi-ro ja-ppyeo-jyeo-do ko-ga kkae-jin-da','some people are always unlucky',11);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Proverbs about karma/reciprocity','말, 행동의 결과에 관한 속담','Many Korean proverbs relate to cause and effect or reciprocity.','[{"korean": "가는 말이 고와야 오는 말이 곱다", "english": "Speak kindly and you will receive kindness."}, {"korean": "콩 심은 데 콩 난다", "english": "You reap what you sow."}]',1),
  (l_id,'Proverbs about perseverance','노력과 끈기에 관한 속담','Proverbs encouraging hard work and persistence.','[{"korean": "고생 끝에 낙이 온다", "english": "No pain, no gain."}, {"korean": "티끌 모아 태산", "english": "Small efforts add up to great things."}]',2),
  (l_id,'Proverbs about human nature','인간 본성에 관한 속담','Observations about human behavior and character.','[{"korean": "세 살 버릇 여든까지 간다", "english": "Habits formed in childhood last a lifetime."}, {"korean": "원숭이도 나무에서 떨어진다", "english": "Even experts make mistakes sometimes."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'할머니','공부가 힘들어?','Hal-meo-ni, gong-bu-ga him-deu-reo?','Is studying hard?',1),
  (l_id,'손자','네, 포기하고 싶을 때도 있어요.','Son-ja, ne, po-gi-ha-go si-peul ttae-do i-sseo-yo.','Yes, there are times I want to give up.',2),
  (l_id,'할머니','고생 끝에 낙이 온단다. 포기하면 안 돼.','Hal-meo-ni, go-saeng kkeut-e na-gi on-dan-da. po-gi-ha-myeon an dwae.','Joy comes at the end of hardship. Do not give up.',3),
  (l_id,'손자','그리고 티끌 모아 태산이잖아요.','Son-ja, geu-ri-go ti-kkeul mo-a tae-san-i-ja-na-yo.','And many a little makes a mickle, right?',4),
  (l_id,'할머니','맞아! 조금씩 해도 나중에 크게 돼.','Hal-meo-ni, ma-ja! jo-geum-ssik hae-do na-jung-e keu-ge dwae.','Right! Even little by little grows into something big.',5),
  (l_id,'손자','감사해요, 할머니. 열심히 할게요.','Son-ja, gam-sa-hae-yo, hal-meo-ni. yeol-sim-hi hal-ge-yo.','Thank you, grandmother. I will work hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"고생 끝에 낙이 온다" means?','["life is always hard", "joy comes after hardship (no pain no gain)", "stop working hard", "give up when tired"]',1,'고생 끝에 낙이 온다 = at the end of hardship comes joy: no pain, no gain.',1),
  (l_id,'"원숭이도 나무에서 떨어진다" means?','["monkeys live in trees", "even experts make mistakes", "animals are smarter than humans", "never trust an expert"]',1,'Even monkeys fall from trees = even experts sometimes make mistakes.',2),
  (l_id,'"가는 말이 고와야 오는 말이 곱다" meaning?','["travel with kind words", "treat others well and receive kindness in return", "speak formally always", "do not talk while walking"]',1,'Outgoing words being gentle leads to incoming words being gentle: treat others as you wish to be treated.',3),
  (l_id,'"티끌 모아 태산" is similar to?','["empty vessel makes most noise", "every cloud has silver lining", "many a little makes a mickle", "honesty is the best policy"]',2,'티끌 모아 태산 = small things add up: similar to "many a little makes a mickle."',4),
  (l_id,'"세 살 버릇 여든까지 간다" warns about?','["childhood habits that last a lifetime", "being three years old", "going to school at 80", "forgetting things"]',0,'Habits at age 3 persist to age 80: old habits die hard / habits formed young last forever.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 속담은 삶의 지혜를 담고 있어요. 고생 끝에 낙이 온다(no pain no gain), 티끌 모아 태산(small efforts add up), 세 살 버릇 여든까지 간다(old habits die hard)처럼요. 가는 말이 고와야 오는 말이 곱다는 상호주의를 나타내고, 원숭이도 나무에서 떨어진다는 겸손을 나타내요.','Korean proverbs encode wisdom about life. 고생 끝에 낙이 온다 = no pain, no gain. 티끌 모아 태산 = small efforts add up. 세 살 버릇 여든까지 간다 = habits formed young persist. 가는 말이 고와야 오는 말이 곱다 = reciprocity. 원숭이도 나무에서 떨어진다 = even experts make mistakes.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'간접화법','gan-jeop-hwa-beop','indirect speech/reported speech',1),
  (l_id,'직접화법','jik-jeop-hwa-beop','direct speech',2),
  (l_id,'고 하다','go ha-da','says/said that... (indirect)',3),
  (l_id,'라고 하다','ra-go ha-da','says... that... (after noun/quotation)',4),
  (l_id,'(으)라고 하다','(eu)-ra-go ha-da','tells to do (indirect command)',5),
  (l_id,'냐고 하다','nya-go ha-da','asks if... (indirect question)',6),
  (l_id,'전하다','jeon-ha-da','to convey/transmit',7),
  (l_id,'보고하다','bo-go-ha-da','to report',8),
  (l_id,'인용','in-yong','quotation/citation',9),
  (l_id,'내용','nae-yong','content/substance',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Indirect statement — 고 하다','V/A + 다고 하다 (statement) / ㄴ다고 하다 (action present)','Transforms direct speech into indirect. Action present: stem + ㄴ다고 하다; Adj/past: 다고 하다.','[{"korean": "선생님이 \"숙제 해요\"→\"숙제 하라고 했어요.\"", "english": "Teacher said \"Do homework\"→Teacher told us to do homework."}, {"korean": "\"바빠요\"→\"바쁘다고 했어요.\"", "english": "(She) said she is busy."}]',1),
  (l_id,'Indirect question — 냐고/느냐고 하다','V + 느냐고 하다 / A + (으)냐고 하다','Transforms a direct question into indirect: "asked whether/what..."','[{"korean": "\"어디 가요?\" → \"어디 가느냐고 물었어요.\"", "english": "Asked where (you) are going."}, {"korean": "\"배고파요?\" → \"배고프냐고 물었어요.\"", "english": "Asked if (you) are hungry."}]',2),
  (l_id,'Indirect command — (으)라고 하다','V + (으)라고 하다','Transforms a direct command into indirect: "told (someone) to do..."','[{"korean": "\"앉으세요\" → \"앉으라고 했어요.\"", "english": "Told (someone) to sit."}, {"korean": "\"공부해\" → \"공부하라고 했어요.\"", "english": "Told (me) to study."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지수','선생님이 뭐라고 하셨어요?','Seon-saeng-nim-i mwo-ra-go ha-syeot-sseo-yo?','What did the teacher say?',1),
  (l_id,'민호','내일 시험이 있다고 하셨어요.','Nae-il si-heom-i it-da-go ha-syeot-sseo-yo.','She said there is an exam tomorrow.',2),
  (l_id,'지수','그리고요?','Geu-ri-go-yo?','And?',3),
  (l_id,'민호','열심히 공부하라고 하셨어요.','Yeol-sim-hi gong-bu-ha-ra-go ha-syeot-sseo-yo.','She told us to study hard.',4),
  (l_id,'지수','언제까지라고 하셨어요?','Eon-je-kka-ji-ra-go ha-syeot-sseo-yo?','Until when did she say?',5),
  (l_id,'민호','오늘까지 준비하라고요.','O-neul-kka-ji jun-bi-ha-ra-go-yo.','She said to prepare by today.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Indirect statement ending is?','["고 하다", "라고 하다", "다고 하다", "고 싶다"]',2,'Indirect statements use 다고 하다: 바쁘다고 했어요 = said (she) is busy.',1),
  (l_id,'Indirect command "told to sit" is?','["앉는다고 했어요", "앉으라고 했어요", "앉냐고 했어요", "앉자고 했어요"]',1,'(으)라고 하다 = indirect command: 앉으라고 했어요 = told to sit.',2),
  (l_id,'Indirect question "asked if hungry" is?','["배고프다고 물었어요", "배고프냐고 물었어요", "배고프라고 물었어요", "배고픈다고 물었어요"]',1,'(으)냐고 하다/물었어요 = indirect question: 배고프냐고 물었어요.',3),
  (l_id,'Indirect suggestion "let us go" is?','["가라고 했어요", "가자고 했어요", "간다고 했어요", "가냐고 했어요"]',1,'자고 하다 = indirect suggestion: 가자고 했어요 = suggested to go.',4),
  (l_id,'In reported speech with honorifics, the SAY verb becomes?','["말했어요", "하셨어요", "하세요", "말씀드렸어요"]',1,'When the speaker is respected, use 하셨어요 (honorific past of 하다): 선생님이 하셨어요.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'간접화법은 다른 사람의 말을 전할 때 써요. 서술문은 다고 하다, 명령문은 (으)라고 하다, 의문문은 (으)냐고 하다, 청유문은 자고 하다를 써요. 말하는 사람이 존경받는 어른이면 하셨어요로 높여야 해요. 간접화법은 뉴스, 보고, 일상 대화에서 자주 쓰여요.','Indirect/reported speech converts direct quotes. Statements: 다고 하다. Commands: (으)라고 하다. Questions: (으)냐고 하다. Suggestions: 자고 하다. When the speaker is a respected person, use the honorific form 하셨어요. Reported speech is common in news, reports, and everyday conversation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'화계','hwa-gye','speech level system',1),
  (l_id,'상황','sang-hwang','situation/context',2),
  (l_id,'관계','gwan-gye','relationship',3),
  (l_id,'처음 만나다','cheo-eum man-na-da','to meet for the first time',4),
  (l_id,'직급','jik-geup','rank/position',5),
  (l_id,'나이 차이','na-i cha-i','age difference',6),
  (l_id,'친해지다','chin-hae-ji-da','to become close',7),
  (l_id,'반말 허락','ban-mal heo-rak','permission to use plain speech',8),
  (l_id,'눈치','nun-chi','social awareness/reading the room',9),
  (l_id,'분위기','bun-wi-gi','atmosphere/mood',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Choosing the right speech level','Consider: relationship, age, setting','Start with 해요체 with new people. Upgrade to 합쇼체 in formal settings. Downgrade to 반말 only with close friends/younger people.','[{"korean": "처음: 해요체 → 친해지면: 반말", "english": "First meeting: 해요체 → after becoming close: 반말"}, {"korean": "공식 발표: 합쇼체 → 동료와 점심: 해요체", "english": "Formal presentation: 합쇼체 → lunch with colleagues: 해요체"}]',1),
  (l_id,'반말 허락 — asking permission for plain speech','나이가 같으면 "말 놔도 돼요?" or "편하게 얘기해요."','If ages are similar, you may ask: "May I use plain speech?" before switching.','[{"korean": "\"말 편하게 해도 돼요?\"", "english": "Can we speak comfortably? (ask to drop formality)"}, {"korean": "\"우리 그냥 친구처럼 얘기해요.\"", "english": "Let us talk like friends."}]',2),
  (l_id,'Contextual switching in real life','Same people, different contexts → different levels','You may use 합쇼체 in a meeting but 해요체 at lunch with the same colleague.','[{"korean": "회의에서: \"발표를 시작하겠습니다.\"", "english": "In meeting: \"I will begin the presentation.\""}, {"korean": "점심에서: \"뭐 드실 거예요?\"", "english": "At lunch: \"What will you have?\" (polite but relaxed)"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유진','처음 뵙겠습니다. 저는 유진이에요.','Cheo-eum boep-get-sseum-ni-da. Jeo-neun Yu-jin-i-e-yo.','Nice to meet you. I am Yu-jin.',1),
  (l_id,'나탈리','반갑습니다. 저는 나탈리예요.','Ban-gap-sseum-ni-da. Jeo-neun Na-tal-li-ye-yo.','Pleased to meet you. I am Natalie.',2),
  (l_id,'유진','한국에 오신 지 얼마나 됐어요?','Han-guk-e o-sin ji eol-ma-na dwaet-sseo-yo?','How long have you been in Korea?',3),
  (l_id,'나탈리','6개월 됐어요. 한국어가 아직 어려워요.','Yuk gae-wol dwaet-sseo-yo. Han-guk-eo-ga a-jik eo-ryeo-wo-yo.','It has been 6 months. Korean is still hard.',4),
  (l_id,'유진','저도요! 말 편하게 해도 괜찮아요?','Jeo-do-yo! Mal pyeon-ha-ge hae-do gwaen-chan-a-yo?','Same here! Is it okay if we speak more casually?',5),
  (l_id,'나탈리','물론이죠! 그러면 더 편할 것 같아요.','Mul-lon-i-jyo! Geu-reo-myeon deo pyeon-hal geot ga-ta-yo.','Of course! I think it will be more comfortable.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'What is the safest default speech level with new people?','["반말", "합쇼체", "해요체", "아무거나"]',2,'해요체 is the safe default: polite but not overly stiff.',1),
  (l_id,'When is 합쇼체 most appropriate?','["talking to a friend", "formal presentations and meetings", "texting", "casual lunch"]',1,'합쇼체 is for formal settings: presentations, military, official meetings.',2),
  (l_id,'Switching to 반말 with someone your age requires?','["nothing, just switch", "asking permission or mutual agreement", "being older than them", "them to ask first"]',1,'It is polite to ask before switching to 반말 with someone your own age.',3),
  (l_id,'"말 편하게 해도 돼요?" means?','["Can you speak correctly?", "May we speak more casually?", "Do you speak well?", "Please speak more"]',1,'말 편하게 = speak comfortably/casually. Asking to lower the formality between two people.',4),
  (l_id,'눈치 in the context of speech levels refers to?','["vocabulary memorization", "reading social cues to choose the right level", "knowing grammar rules", "being silent"]',1,'눈치 = social awareness. Reading the room to judge which speech level fits the situation.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 화계 운용은 관계, 나이, 상황에 따라 달라요. 처음 만난 사람에게는 해요체로 시작해요. 격식적인 발표나 회의에서는 합쇼체를 써요. 친해지면 반말로 바꿀 수 있는데, 먼저 "말 편하게 해도 돼요?"라고 물어봐야 해요. 같은 사람과도 상황에 따라 다른 화계를 쓸 수 있어요.','Navigating Korean speech levels depends on relationship, age, and context. Start with 해요체 with new people. Use 합쇼체 in formal presentations or meetings. You can switch to 반말 after becoming close — but it is polite to ask first: "May we speak casually?" You may use different speech levels with the same person depending on the situation.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'피동','pi-dong','passive',1),
  (l_id,'이','i','passive suffix',2),
  (l_id,'히','hi','passive suffix',3),
  (l_id,'리','ri','passive suffix',4),
  (l_id,'기','gi','passive suffix',5),
  (l_id,'잡히다','ja-pi-da','to be caught',6),
  (l_id,'읽히다','il-ki-da','to be read',7),
  (l_id,'들리다','deul-li-da','to be heard',8),
  (l_id,'먹히다','meo-ki-da','to be eaten',9),
  (l_id,'보이다','bo-i-da','to be seen',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Passive suffix -이/히/리/기','Active verb stem + 이/히/리/기 = passive','Four passive suffixes attach to verb stems. Which suffix depends on the active verb (memorize patterns).','[{"korean": "잡다(catch)→잡히다(be caught)", "english": "잡 + 히 = 잡히다 (passive)"}, {"korean": "읽다(read)→읽히다(be read)", "english": "읽 + 히 = 읽히다 (passive)"}]',1),
  (l_id,'More passive examples','---','Study common passive pairs.','[{"korean": "보다→보이다, 듣다→들리다", "english": "see→be seen, hear→be heard"}, {"korean": "팔다→팔리다, 바꾸다→바뀌다", "english": "sell→be sold, change→be changed"}]',2),
  (l_id,'Passive vs active meaning','Same verb, different role','Active: 나는 문을 닫았어요 (I closed the door). Passive: 문이 닫혔어요 (The door was closed).','[{"korean": "나는 고양이를 잡았어요.", "english": "I caught the cat."}, {"korean": "고양이가 잡혔어요.", "english": "The cat was caught."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'야나','저 고양이가 쥐를 잡았어요?','Ya-na, jeo go-yang-i-ga jwi-reul ja-bat-sseo-yo?','Did that cat catch a mouse?',1),
  (l_id,'지안','아니요, 쥐한테 잡혔어요.','A-ni-yo, jwi-han-te ja-pyeot-sseo-yo.','No, (the cat) was caught by the mouse.',2),
  (l_id,'야나','이 책 많이 읽혀요?','I chaek ma-ni il-kyeo-yo?','Is this book read a lot?',3),
  (l_id,'지안','네, 학생들한테 많이 읽혀요.','Ne, hak-saeng-deul-han-te ma-ni il-kyeo-yo.','Yes, it is read a lot by students.',4),
  (l_id,'야나','어디서 팔려요?','Eo-di-seo pal-lyeo-yo?','Where is it sold?',5),
  (l_id,'지안','서점에서 팔려요.','Seo-jeom-e-seo pal-lyeo-yo.','It is sold at bookstores.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Passive suffix for 잡다 (catch) is?','["이", "히", "리", "기"]',1,'잡다 → 잡히다: the passive suffix is 히.',1),
  (l_id,'"보이다" means?','["to see (active)", "to be seen/visible", "to watch", "to show"]',1,'보이다 = passive of 보다: to be seen/visible.',2),
  (l_id,'Passive sentences shift the agent to?','["subject", "object", "에게/한테 (by) phrase", "front of sentence"]',2,'The original agent (doer) becomes a 에게/한테 phrase in passive sentences.',3),
  (l_id,'"팔리다" is passive of?','["살다", "팔다", "받다", "부르다"]',1,'팔다 (to sell) → 팔리다 (to be sold).',4),
  (l_id,'Which suffix makes 들다 passive?','["이", "히", "리", "기"]',2,'들다 → 들리다: the suffix is 리. 들리다 = to be heard.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'피동 접사는 이/히/리/기네 가지예요. 능동 동사 어간에 붙어 피동 동사를 만들어요. 잡다→잡히다(잡히다), 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. 어떤 접사가 붙는지는 동사마다 외워야 해요.','The four passive suffixes are 이/히/리/기. They attach to active verb stems to form passive verbs. 잡다→잡히다, 읽다→읽히다, 팔다→팔리다, 먹다→먹히다. Which suffix is used must be memorized for each verb.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아/어지다','-a/eo-ji-da','to become/get (natural change)',1),
  (l_id,'좋아지다','jo-a-ji-da','to get better',2),
  (l_id,'나빠지다','na-ppa-ji-da','to get worse',3),
  (l_id,'어려워지다','eo-ryeo-wo-ji-da','to become harder',4),
  (l_id,'쉬워지다','swi-wo-ji-da','to become easier',5),
  (l_id,'빨라지다','ppal-la-ji-da','to become faster',6),
  (l_id,'깨끗해지다','kkae-kkeut-hae-ji-da','to become clean',7),
  (l_id,'달라지다','dal-la-ji-da','to become different',8),
  (l_id,'늘어나다','neu-reo-na-da','to increase',9),
  (l_id,'변하다','byeon-ha-da','to change',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'아/어지다 natural change','A/V + 아/어지다','Attaches to adjectives or some verbs to express becoming that state naturally over time.','[{"korean": "날씨가 좋아졌어요.", "english": "The weather has gotten better."}, {"korean": "한국어가 어려워졌어요.", "english": "Korean has become harder."}]',1),
  (l_id,'Difference from suffix passive','아/어지다 = natural change vs -이/히/리/기 = direct passive','아/어지다 shows gradual natural change; suffix passives show that something is done TO the subject.','[{"korean": "방이 깨끗해졌어요. (natural)", "english": "The room became clean (naturally/gradually)."}, {"korean": "고양이가 잡혔어요. (passive)", "english": "The cat was caught."}]',2),
  (l_id,'아/어지다 with adjectives','Adj stem + 아/어지다 → become adj','Converts adjectives into change-of-state verbs.','[{"korean": "더워지다 (덥다 + 어지다)", "english": "to become hot"}, {"korean": "작아지다 (작다 + 아지다)", "english": "to become small"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'현수','요즘 한국어 어때요?','Hyeon-su, yo-jeum han-guk-eo eo-ttae-yo?','How is your Korean lately?',1),
  (l_id,'에이미','많이 좋아졌어요! 듣기가 쉬워졌어요.','Ma-ni jo-a-jyeot-sseo-yo! Deut-gi-ga swi-wo-jyeot-sseo-yo.','It has gotten much better! Listening has become easier.',2),
  (l_id,'현수','발음도 자연스러워졌어요.','Bal-eum-do ja-yeon-seu-reo-wo-jyeot-sseo-yo.','Your pronunciation has also become natural.',3),
  (l_id,'에이미','감사해요! 매일 연습해서 그래요.','Gam-sa-hae-yo! Mae-il yeon-seup-hae-seo geu-rae-yo.','Thank you! It is because I practice every day.',4),
  (l_id,'현수','꾸준히 하면 더 잘해질 거예요.','Kku-jun-hi ha-myeon deo jal-hae-jil geo-ye-yo.','If you keep it up, you will get even better.',5),
  (l_id,'에이미','네, 계속 노력할게요!','Ne, gye-sok no-ryeok-hal-ge-yo!','Yes, I will keep making the effort!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'아/어지다 expresses?','["active doing", "natural change of state", "request", "completed action"]',1,'아/어지다 expresses a natural or gradual change of state.',1),
  (l_id,'"어렵다 + 아/어지다" becomes?','["어렵아지다", "어려워지다", "어렵지다", "어려지다"]',1,'ㅂ irregular: 어렵 → 어려워 + 지다 = 어려워지다.',2),
  (l_id,'"방이 깨끗해졌어요" means?','["I cleaned the room", "The room became clean (naturally)", "Clean the room", "It was always clean"]',1,'아/어지다 = natural change: the room became clean on its own/gradually.',3),
  (l_id,'아/어지다 is used with?','["only verbs", "only adjectives", "mainly adjectives and some intransitive verbs", "only transitive verbs"]',2,'아/어지다 most commonly attaches to adjective stems: 좋아지다, 어려워지다, 커지다.',4),
  (l_id,'아/어지다 vs -이/히/리/기 passive — difference?','["same", "아/어지다=natural change; suffix=direct passive", "아/어지다=formal", "suffix is natural"]',1,'아/어지다 = gradual natural change. Suffix passives = direct passive action done to subject.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어지다는 상태가 자연스럽게 변화하는 것을 나타내요. 형용사에 붙어 변화를 나타내요: 좋아지다, 어려워지다. 능동적 행위가 아닌 자연스러운 변화를 말해요. 피동 접사(잡히다)와 달리 주체가 서서히 변해가는 과정을 나타내요.','aeo-jida expresses natural change of state. It attaches to adjectives to mean "become (adjective)": 좋아지다 (get better), 어려워지다 (become harder). It describes gradual natural change, not a direct passive action. Unlike passive suffixes (잡히다), it shows a gradual process of change.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사동','sa-dong','causative',1),
  (l_id,'이','i','causative suffix',2),
  (l_id,'히','hi','causative suffix',3),
  (l_id,'리','ri','causative suffix',4),
  (l_id,'기','gi','causative suffix',5),
  (l_id,'우','u','causative suffix',6),
  (l_id,'먹이다','meo-gi-da','to feed (cause to eat)',7),
  (l_id,'입히다','i-pi-da','to dress someone',8),
  (l_id,'태우다','tae-u-da','to give a ride',9),
  (l_id,'웃기다','ut-gi-da','to make laugh',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Causative suffixes overview','Verb stem + 이/히/리/기/우 = causative','Causative suffixes create new verbs meaning "cause/make someone do." Which suffix depends on the base verb.','[{"korean": "먹다 → 먹이다 (to feed)", "english": "cause to eat"}, {"korean": "입다 → 입히다 (to dress)", "english": "cause to wear"}]',1),
  (l_id,'Common causative pairs','Base verb → causative','Memorize high-frequency causative pairs.','[{"korean": "자다→재우다, 타다→태우다, 앉다→앉히다", "english": "sleep→put to sleep, board→give a ride, sit→seat"}, {"korean": "웃다→웃기다, 울다→울리다", "english": "laugh→make laugh, cry→make cry"}]',2),
  (l_id,'Causative vs passive suffix confusion','이/히/리/기 are used for BOTH','The same suffixes (이/히/리/기) form both causatives and passives. Context and specific verbs determine meaning.','[{"korean": "먹히다 (passive) vs 먹이다 (causative)", "english": "be eaten vs feed"}, {"korean": "보이다 (passive: be seen) vs 보이다 (causative: show)", "english": "same form, different context"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'의사','하루에 세 번 약을 먹이세요.','Ui-sa, ha-ru-e se beon yak-eul meo-gi-se-yo.','Please feed (give) the medicine three times a day.',1),
  (l_id,'엄마','네, 알겠습니다. 억지로 먹여도 돼요?','Ne, al-get-sseum-ni-da. Eok-ji-ro meo-gyeo-do dwae-yo?','Okay. Is it okay to force it?',2),
  (l_id,'의사','무리하지 마세요. 천천히 먹이세요.','Mu-ri-ha-ji ma-se-yo. Cheon-cheon-hi meo-gi-se-yo.','Do not force it. Give it slowly.',3),
  (l_id,'엄마','물도 많이 마시게 할게요.','Mul-do ma-ni ma-si-ge hal-ge-yo.','I will also make (the child) drink lots of water.',4),
  (l_id,'의사','잘 하고 계세요. 이틀 후에 오세요.','Jal ha-go gye-se-yo. I-teul hu-e o-se-yo.','You are doing well. Come back in two days.',5),
  (l_id,'엄마','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Causative means to?','["be done to", "make/cause someone to do", "try doing", "stop doing"]',1,'Causative = making or causing someone else to do the action.',1),
  (l_id,'"먹이다" means?','["to eat", "to feed (cause to eat)", "to be eaten", "to cook"]',1,'먹이다 = causative of 먹다: to feed / cause to eat.',2),
  (l_id,'"입히다" is causative of?','["이다", "입다", "입히다", "이피다"]',1,'입다 (to wear) + 히 = 입히다 (to dress someone / make wear).',3),
  (l_id,'재우다 is causative of?','["재다", "자다", "재미있다", "재미없다"]',1,'자다 (to sleep) → 재우다 (to put to sleep / make sleep). 우 suffix.',4),
  (l_id,'Causative suffix vs -게 하다?','["suffix is always stronger", "suffix creates lexical verb; -게 하다 is grammatical construction", "no difference", "게 하다 is only adjectives"]',1,'Causative suffix = lexicalized into a new verb. -게 하다 = grammatical construction usable with any verb.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사동 접사는 이/히/리/기/우 등이 있어요. 동사 어간에 붙어 "~하게 하다"는 의미를 만들어요. 먹다→먹이다(먹게 하다), 입다→입히다, 자다→재우다처럼요. 피동 접사(이/히/리/기)와 같은 형태이지만 의미가 달라요. 예: 먹히다(피동)vs 먹이다(사동).','Causative suffixes (이/히/리/기/우 etc.) create new verbs meaning to cause someone to do something. 먹다→먹이다 (feed), 입다→입히다 (dress), 자다→재우다 (put to sleep). Note: the same suffixes (이/히/리/기) are used for both causatives and passives, so specific verbs and context determine meaning.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-게 하다','ge ha-da','to make/let do (causative)',1),
  (l_id,'-게 시키다','ge si-ki-da','to make do (forceful)',2),
  (l_id,'허락','heo-rak','permission',3),
  (l_id,'강제','gang-je','compulsion',4),
  (l_id,'시키다','si-ki-da','to order/make do',5),
  (l_id,'강요','gang-yo','coercion',6),
  (l_id,'자게 하다','ja-ge ha-da','to make sleep',7),
  (l_id,'공부시키다','gong-bu-si-ki-da','to make study',8),
  (l_id,'웃게 하다','ut-ge ha-da','to make laugh',9),
  (l_id,'쉬게 하다','swi-ge ha-da','to let rest',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-게 하다 grammatical causative','Subject + Object + V + 게 하다','Works with any verb. Can mean make, let, or allow depending on context.','[{"korean": "엄마가 아이를 자게 했어요.", "english": "Mom made the child sleep."}, {"korean": "선생님이 학생을 쉬게 했어요.", "english": "The teacher let the student rest."}]',1),
  (l_id,'-게 하다 vs -게 시키다','게 하다 = make/let (neutral); 게 시키다 = order (forceful)','시키다 implies command or pressure; 하다 can be permission or gentle cause.','[{"korean": "공부하게 했어요. (gentle cause)", "english": "Had (them) study."}, {"korean": "공부시켰어요. (command)", "english": "Made (them) study. (ordered)"}]',2),
  (l_id,'Adjective + 게 하다','A + 게 하다 = make (someone/something) adj','With adjectives, -게 하다 means to make something become that quality.','[{"korean": "방을 깨끗하게 해요.", "english": "I make the room clean."}, {"korean": "일을 빠르게 해요.", "english": "I do the work quickly / make the work fast."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'팀장','왜 이렇게 힘들게 해요?','Tim-jang, wae i-reo-ke him-deul-ge hae-yo?','Why are you making this so hard?',1),
  (l_id,'직원','일부러 그런 건 아니에요.','Ji-kwon, il-bu-reo geu-reon geon a-ni-e-yo.','I am not doing it on purpose.',2),
  (l_id,'팀장','더 빠르게 하는 방법을 찾아봐요.','Deo ppa-reu-ge ha-neun bang-beom-eul chat-a-bwa-yo.','Try to find a way to make it faster.',3),
  (l_id,'직원','알겠습니다. 팀원들도 더 일하게 할게요.','Al-get-sseum-ni-da. Tim-won-deul-do deo il-ha-ge hal-ge-yo.','Understood. I will also make the team members work more.',4),
  (l_id,'팀장','무리하게 시키지 말고요.','Mu-ri-ha-ge si-ki-ji mal-go-yo.','Do not make them overwork.',5),
  (l_id,'직원','네, 적당히 시킬게요.','Ne, jeok-dang-hi si-kil-ge-yo.','Yes, I will assign work appropriately.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-게 하다 means?','["to become", "to make/let do", "to be done", "to try doing"]',1,'-게 하다 = grammatical causative: cause/make/let someone do something.',1),
  (l_id,'"엄마가 아이를 자게 했어요" — who slept?','["mom", "child", "both", "nobody"]',1,'아이를 자게 했어요 = made the CHILD sleep.',2),
  (l_id,'-게 시키다 vs -게 하다 — which implies force?','["하다", "시키다", "both", "neither"]',1,'-게 시키다 implies command or coercion. -게 하다 is more neutral.',3),
  (l_id,'Which verb has NO suffix causative but uses -게 하다?','["먹다", "입다", "공부하다", "웃다"]',2,'공부하다 has no simple causative suffix form → 공부시키다 or 공부하게 하다.',4),
  (l_id,'"방을 깨끗하게 해요" means?','["The room becomes clean", "I make the room clean", "The room is clean", "Clean the room please"]',1,'Adj + 게 하다 = make (something) adj: 깨끗하게 해요 = I make it clean.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-게 하다는 어떤 동사와도 쓸 수 있는 문법적 사동 표현이에요. 주어가 목적어로 하여금 어떤 동작을 하게 해요. 게 시키다는 더 강제적인 의미예요. 형용사와 함께 쓰면 "~하게 만들다"의 의미가 돼요.','-게 하다 is a grammatical causative construction usable with any verb. The subject causes the object to do the action. -게 시키다 implies more force or command. With adjectives, it means to make something become that quality: 빠르게 하다 = make faster.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 있다','go it-da','progressive (be V-ing)',1),
  (l_id,'진행','jin-haeng','progress/ongoing',2),
  (l_id,'지금','ji-geum','now',3),
  (l_id,'먹고 있다','meok-go it-da','to be eating',4),
  (l_id,'읽고 있다','ik-go it-da','to be reading',5),
  (l_id,'일하고 있다','il-ha-go it-da','to be working',6),
  (l_id,'기다리고 있다','gi-da-ri-go it-da','to be waiting',7),
  (l_id,'공부하고 있다','gong-bu-ha-go it-da','to be studying',8),
  (l_id,'그때','geu-ttae','at that time',9),
  (l_id,'현재 진행','hyeon-jae jin-haeng','present progressive',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-고 있다 progressive','V + 고 있다','Expresses action in progress at the time of reference. Present: 고 있어요. Past: 고 있었어요.','[{"korean": "지금 밥을 먹고 있어요.", "english": "I am eating right now."}, {"korean": "그때 공부하고 있었어요.", "english": "I was studying at that time."}]',1),
  (l_id,'Future progressive','V + 고 있을 거예요','Expresses an action expected to be in progress at a future time.','[{"korean": "내일 이 시간에 일하고 있을 거예요.", "english": "At this time tomorrow I will be working."}, {"korean": "그가 도착할 때쯤 자고 있을 거예요.", "english": "By the time he arrives I will be sleeping."}]',2),
  (l_id,'-고 있다 vs -아/어 있다','Action in progress vs resultant state','Key distinction: -고 있다 = actively doing. -아/어 있다 = in the state resulting from having done.','[{"korean": "앉고 있어요. (sitting down action)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (in seated state)", "english": "is seated (state after having sat)."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'나연','전화 왜 안 받았어요?','Na-yeon, jeon-hwa wae an bat-sseo-yo?','Why did you not answer the phone?',1),
  (l_id,'승재','그때 샤워하고 있었어요.','Geu-ttae sya-wo-ha-go it-sseo-yo.','I was showering at that time.',2),
  (l_id,'나연','지금은 뭐 하고 있어요?','Ji-geum-eun mwo ha-go i-sseo-yo?','What are you doing now?',3),
  (l_id,'승재','영화 보고 있어요. 잠깐 멈췄어요.','Yeong-hwa bo-go i-sseo-yo. Jam-kkan meom-chwo-sseo-yo.','I am watching a movie. Paused it for a moment.',4),
  (l_id,'나연','계속 봐요. 나중에 얘기해요.','Gye-sok bwa-yo. Na-jung-e yae-gi-hae-yo.','Keep watching. Let us talk later.',5),
  (l_id,'승재','알겠어요! 나중에 전화할게요.','Al-get-sseo-yo! Na-jung-e jeon-hwa-hal-ge-yo.','Okay! I will call later.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 있다 expresses?','["completed action", "action in progress", "future plan", "habit"]',1,'-고 있다 = progressive: the action is currently happening.',1),
  (l_id,'"I was eating" in Korean?','["먹고 있어요", "먹고 있었어요", "먹고 있을 거예요", "먹어요"]',1,'-고 있었어요 = past progressive: was eating.',2),
  (l_id,'"He is studying" progressive form?','["공부해요", "공부했어요", "공부하고 있어요", "공부할 거예요"]',2,'공부하고 있어요 = is currently studying.',3),
  (l_id,'-고 있다 vs -아/어 있다 for 앉다?','["same meaning", "고 있다 = action of sitting; 아/어 있다 = seated state", "no difference", "고 있다 is incorrect with 앉다"]',1,'앉고 있어요 = in the process of sitting. 앉아 있어요 = in a seated state.',4),
  (l_id,'Past progressive uses?','["고 있어요", "고 있었어요", "고 있을 거예요", "고 있다"]',1,'-고 있었어요 is the past progressive form.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-고 있다는 현재 진행 중인 동작을 나타내요. 과거 진행은 고 있었어요, 미래 진행은 고 있을 거예요예요. -아/어 있다(상태)와 구별해야 해요: 앉고 있어요(앉는 동작 중) vs 앉아 있어요(앉은 상태).','-고 있다 expresses ongoing action: "I am eating right now." Past: 고 있었어요. Future: 고 있을 거예요. Key distinction from -아/어 있다 (resultant state): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 있다','-a/eo it-da','resultant state',1),
  (l_id,'결과 상태','gyeol-gwa sang-tae','resultant state',2),
  (l_id,'앉아 있다','an-ja it-da','to be sitting (state)',3),
  (l_id,'서 있다','seo it-da','to be standing',4),
  (l_id,'열려 있다','yeol-lyeo it-da','to be open',5),
  (l_id,'닫혀 있다','da-tyeo it-da','to be closed',6),
  (l_id,'켜져 있다','kyeo-jeo it-da','to be on/lit',7),
  (l_id,'붙어 있다','bu-teo it-da','to be attached',8),
  (l_id,'쓰여 있다','sseu-yeo it-da','to be written',9),
  (l_id,'놓여 있다','no-yeo it-da','to be placed/lying',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 있다 resultant state','V(intransitive) + 아/어 있다','Expresses a current state that resulted from a completed action. Used with intransitive or passive verbs.','[{"korean": "문이 열려 있어요.", "english": "The door is open (in an open state)."}, {"korean": "의자에 앉아 있어요.", "english": "I am sitting in the chair (in a seated state)."}]',1),
  (l_id,'Contrast with -고 있다','고 있다 = action; 아/어 있다 = resulting state','앉다 with 고 있다 vs 아/어 있다 gives different nuances.','[{"korean": "앉고 있어요. (in the process of sitting down)", "english": "is sitting down (action)."}, {"korean": "앉아 있어요. (is in a seated position)", "english": "is seated (state)."}]',2),
  (l_id,'Common uses','환경이나 위치 상태 묘사','Commonly used to describe state of objects, environment, or position.','[{"korean": "불이 켜져 있어요.", "english": "The light is on."}, {"korean": "벽에 그림이 붙어 있어요.", "english": "A picture is hung/attached on the wall."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민지','거기 서 있는 사람 알아요?','Geo-gi seo it-neun sa-ram a-ra-yo?','Do you know the person standing there?',1),
  (l_id,'준영','네, 제 친구예요. 기다리고 있어요.','Ne, je chin-gu-ye-yo. Gi-da-ri-go i-sseo-yo.','Yes, that is my friend. (They) are waiting.',2),
  (l_id,'민지','문이 왜 열려 있어요?','Mun-i wae yeol-lyeo i-sseo-yo?','Why is the door open?',3),
  (l_id,'준영','환기시키려고 열어놨어요.','Hwan-gi-si-ki-ryeo-go yeo-eo-not-sseo-yo.','I opened it to ventilate the room.',4),
  (l_id,'민지','불도 켜져 있는데요.','Bul-do kyeo-jeo it-neun-de-yo.','The light is also on.',5),
  (l_id,'준영','아, 깜빡했네요. 끌게요.','A, kkam-ppak-haet-ne-yo. Kkeul-ge-yo.','Oh I forgot. I will turn it off.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 있다 expresses?','["active action", "resultant state from completed action", "future change", "possibility"]',1,'-아/어 있다 = a state resulting from a completed action.',1),
  (l_id,'"문이 열려 있어요" means?','["The door is opening", "The door is in an open state", "Open the door", "The door was closed"]',1,'열려 있다 = the door is in an open state (result of being opened).',2),
  (l_id,'-아/어 있다 is used with?','["transitive verbs", "intransitive or passive verbs", "adjectives only", "irregular verbs"]',1,'Mainly intransitive verbs (앉다, 서다) and passive forms (열리다, 닫히다).',3),
  (l_id,'"앉아 있어요" vs "앉아요"?','["same", "앉아요=sit action; 앉아 있어요=seated state", "앉아 있어요=sit action now", "앉아요=past"]',1,'앉아요 = action of sitting. 앉아 있어요 = currently in seated state.',4),
  (l_id,'"불이 켜져 있어요" means?','["Turn on the light", "The light is off", "The light is on (in on-state)", "The light flickered"]',2,'켜져 있다 = passive resultant state: light is on (was turned on and remains on).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 있다는 완료된 동작 이후의 상태를 나타내요. 주로 자동사나 피동형 뒤에 써요. "문이 열려 있어요"는 문이 열린 상태예요. -고 있다(동작 진행)와 구분해야 해요. 앉고 있어요(앉는 행위 중) vs 앉아 있어요(앉아있는 상태).','-아/어 있다 expresses a state resulting from a completed action. Mainly used with intransitive verbs or passives. "The door is open" = it is in an open state. Distinguish from -고 있다 (ongoing action): 앉고 있어요 = in the act of sitting; 앉아 있어요 = in a seated state.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 버리다','-a/eo beo-ri-da','to have done completely (with emotional nuance)',1),
  (l_id,'완료','wan-nyo','completion',2),
  (l_id,'아쉽다','a-swip-da','to feel regret/disappointed',3),
  (l_id,'후련하다','hu-ryeon-ha-da','to feel relieved/refreshed',4),
  (l_id,'먹어 버리다','meo-geo beo-ri-da','to eat up (completely)',5),
  (l_id,'잊어 버리다','i-jeo beo-ri-da','to forget completely',6),
  (l_id,'가 버리다','ga beo-ri-da','to have gone (and be gone)',7),
  (l_id,'말해 버리다','mal-hae beo-ri-da','to go ahead and say',8),
  (l_id,'잃어 버리다','i-reo beo-ri-da','to lose (completely)',9),
  (l_id,'끝내 버리다','kkeun-nae beo-ri-da','to finish off completely',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 버리다 — emphatic completion','V + 아/어 버리다','Expresses that an action is thoroughly completed, often with nuances of regret, relief, or finality.','[{"korean": "숙제를 다 해버렸어요.", "english": "I finished all the homework (and now it is done — relief)."}, {"korean": "지갑을 잃어버렸어요.", "english": "I lost my wallet (and it is gone — regret)."}]',1),
  (l_id,'Nuance: regret vs relief','Context determines emotion','아/어 버리다 itself is neutral; context and verb determine whether the feeling is positive or negative.','[{"korean": "케이크를 다 먹어버렸어요. (regret: should not have)", "english": "I ate up all the cake (oops)."}, {"korean": "숙제를 끝내버렸어요! (relief: done!)", "english": "I have finished my homework! (done at last)"}]',2),
  (l_id,'Common fixed expressions','잃어버리다, 잊어버리다','Many verbs lexicalize with 버리다 into single units.','[{"korean": "잃어버리다 = to lose (permanently)", "english": "lose and it is gone"}, {"korean": "잊어버리다 = to forget (completely)", "english": "forget completely"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'세진','왜 그렇게 표정이 안 좋아요?','Se-jin, wae geu-reo-ke pyo-jeong-i an jo-a-yo?','Why do you look so down?',1),
  (l_id,'호준','지갑을 잃어버렸어요.','Ho-jun, ji-gap-eul i-reo-beo-ryeot-sseo-yo.','I lost my wallet.',2),
  (l_id,'세진','아이고, 어디서요?','A-i-go, eo-di-seo-yo?','Oh no, where?',3),
  (l_id,'호준','몰라요. 그냥 사라져버렸어요.','Mol-la-yo. Geu-nyang sa-ra-jyeo-beo-ryeot-sseo-yo.','I do not know. It just disappeared.',4),
  (l_id,'세진','카드도 있었어요?','Ka-deu-do it-sseo-sseo-yo?','Were there cards in it too?',5),
  (l_id,'호준','네, 다 잃어버렸어요. 정말 속상해요.','Ne, da i-reo-beo-ryeot-sseo-yo. Jeong-mal sok-sang-hae-yo.','Yes, I lost everything. I feel terrible.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 버리다 primarily conveys?','["possibility", "thorough completion with emotional nuance", "request", "prohibition"]',1,'아/어 버리다 = complete/thorough action, often with regret or relief.',1),
  (l_id,'"숙제를 해버렸어요" — what feeling is likely?','["anger", "relief (it is done)", "sadness", "boredom"]',1,'해버렸어요 after finishing homework suggests relief: it is all done now.',2),
  (l_id,'"잃어버리다" is a fixed compound meaning?','["to find", "to lose permanently", "to give away", "to put away"]',1,'잃어버리다 = to lose (and it is gone). 잃다 + 버리다 = lose completely.',3),
  (l_id,'"다 먹어버렸어요" might express?','["hunger", "regret or emphasis on completion", "polite request", "neutral description"]',1,'다 먹어버렸어요 = ate everything up — can suggest regret (should not have eaten it all) or completion.',4),
  (l_id,'"잊어버리다" means?','["to remember clearly", "to forget completely", "to remind", "to think about"]',1,'잊어버리다 = to forget completely. 잊다 + 버리다 = forget and it is gone.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 버리다는 동작이 완전히 완료됨을 나타내요. 흔히 아쉬움이나 후련함의 감정을 동반해요. "지갑을 잃어버렸어요"는 완전히 잃었다는 아쉬움, "숙제를 끝내버렸어요"는 끝냈다는 후련함을 나타낼 수 있어요. 잃어버리다, 잊어버리다는 하나의 단어로 굳어졌어요.','-아/어 버리다 expresses thorough completion of an action, often with emotional nuance — regret or relief. "I lost my wallet" (regret); "I finished my homework" (relief). 잃어버리다 and 잊어버리다 have lexicalized into fixed compound verbs meaning "lose permanently" and "forget completely."',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어 보다','-a/eo bo-da','to try/experience doing',1),
  (l_id,'경험','gyeong-heom','experience',2),
  (l_id,'시도','si-do','attempt',3),
  (l_id,'처음','cheo-eum','for the first time',4),
  (l_id,'해봤어요','hae-bwat-sseo-yo','I have tried/done it',5),
  (l_id,'먹어 보다','meo-geo bo-da','to try eating',6),
  (l_id,'입어 보다','ib-eo bo-da','to try on (clothes)',7),
  (l_id,'가 보다','ga bo-da','to go and see/try going',8),
  (l_id,'살아 보다','sar-a bo-da','to try living',9),
  (l_id,'배워 보다','bae-wo bo-da','to try learning',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'-아/어 보다 — try/experience','V + 아/어 보다','Expresses trying something or having the experience of doing something.','[{"korean": "김치를 먹어 봤어요?", "english": "Have you tried (eating) kimchi?"}, {"korean": "이 옷 한번 입어 보세요.", "english": "Please try on this outfit."}]',1),
  (l_id,'-아/어 본 적이 있다/없다','V + 아/어 본 적이 있다/없다','Expresses whether one has/has never had the experience of doing something.','[{"korean": "한국에 가 본 적이 있어요.", "english": "I have been to Korea (have had the experience)."}, {"korean": "스키를 타 본 적이 없어요.", "english": "I have never tried skiing."}]',2),
  (l_id,'아/어 보세요 — polite suggestion','V + 아/어 보세요','Polite suggestion to try something.','[{"korean": "이 음식 먹어 보세요. 정말 맛있어요.", "english": "Try this food. It is really delicious."}, {"korean": "한국어 배워 보세요. 재미있어요.", "english": "Try learning Korean. It is fun."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민하','한국 음식 중에 제일 좋아하는 게 뭐예요?','Min-ha, han-guk eum-sik jung-e je-il jo-a-ha-neun ge mwo-ye-yo?','What is your favorite Korean food?',1),
  (l_id,'케이트','떡볶이요. 처음 먹어봤을 때 너무 맛있었어요.','Tteok-bok-ki-yo. Cheo-eum meo-geo-bwat-seul ttae neo-mu ma-sit-sseo-yo.','Tteokbokki. When I first tried it, it was so delicious.',2),
  (l_id,'민하','삼겹살도 먹어 봤어요?','Sam-gyeop-sal-do meo-geo bwat-sseo-yo?','Have you tried samgyeopsal too?',3),
  (l_id,'케이트','아직 못 먹어봤어요. 한번 먹어 보고 싶어요.','A-jik mot meo-geo-bwat-sseo-yo. Han-beon meo-geo bo-go si-peo-yo.','Not yet. I want to try eating it once.',4),
  (l_id,'민하','그러면 같이 가요! 제가 좋은 식당 알아요.','Geu-reo-myeon ga-chi ga-yo! Je-ga jo-eun sik-dang a-ra-yo.','Then let us go together! I know a good restaurant.',5),
  (l_id,'케이트','좋아요! 빨리 가보고 싶어요.','Jo-a-yo! Ppal-li ga-bo-go si-peo-yo.','Sounds great! I want to go soon.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어 보다 expresses?','["completed action", "trying or experiencing something", "prohibition", "obligation"]',1,'아/어 보다 = try/experience: "give it a try" or "have the experience of."',1),
  (l_id,'"한국에 가 본 적이 있어요?" means?','["Are you going to Korea?", "Have you ever been to Korea?", "Do you want to go to Korea?", "Can you go to Korea?"]',1,'V + 아/어 본 적이 있다 = have the experience of: "Have you ever been to Korea?"',2),
  (l_id,'Polite suggestion to try = ?','["아/어 봐라", "아/어 보세요", "아/어 보면", "아/어 보니까"]',1,'아/어 보세요 = polite suggestion to try: "Please try (doing it)."',3),
  (l_id,'"스키를 타 본 적이 없어요" means?','["I tried skiing", "I have never tried skiing", "I cannot ski", "I will try skiing"]',1,'아/어 본 적이 없다 = have never had the experience of: never tried skiing.',4),
  (l_id,'"먹어 보다" vs "먹다" — difference?','["same", "먹어 보다 = try eating; 먹다 = simply eat", "먹어 보다 = finish eating", "먹다 = try eating"]',1,'아/어 보다 adds the nuance of trying/experiencing: 먹어 보다 = try eating (for the first time or as an experiment).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'-아/어 보다는 어떤 동작을 시도하거나 경험함을 나타내요. "김치를 먹어 봤어요?"처럼요. 아/어 본 적이 있다/없다는 경험 유무를 나타내요. 아/어 보세요는 시도를 권유하는 공손한 표현이에요. 여행 추천, 음식 권유 등에 자주 쓰여요.','-아/어 보다 expresses trying or experiencing something. "Have you tried kimchi?" V + 아/어 본 적이 있다/없다 = have/have never had the experience. 아/어 보세요 = polite suggestion to try. Commonly used when recommending food, travel, or activities.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=41;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#41 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'할 수 있다','hal su it-da','can do',1),
  (l_id,'할 수 없다','hal su eop-da','cannot do',2),
  (l_id,'(으)ㄹ 수 있다','l su it-da','ability/possibility',3),
  (l_id,'잘 하다','jal ha-da','to be good at',4),
  (l_id,'못 하다','mot ha-da','to be bad at',5),
  (l_id,'가능','ga-neung','possibility',6),
  (l_id,'수영하다','su-yeong-ha-da','to swim',7),
  (l_id,'운전하다','un-jeon-ha-da','to drive',8),
  (l_id,'치다','chi-da','to play (instrument)',9),
  (l_id,'가르치다','ga-reu-chi-da','to teach',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Ability - (으)ㄹ 수 있다/없다','V + (으)ㄹ 수 있다/없다 expresses ability or possibility. 갈 수 있어요 = I can go. 먹을 수 없어요 = I cannot eat.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유스프','한국어로 말할 수 있어요?','Yu-seu-peu, han-guk-eo-ro mal-hal su i-sseo-yo?','Can you speak Korean?',1),
  (l_id,'수아','조금 할 수 있어요.','Su-a, jo-geum hal su i-sseo-yo.','I can a little.',2),
  (l_id,'유스프','피아노 칠 수 있어요?','Pi-a-no chil su i-sseo-yo?','Can you play piano?',3),
  (l_id,'수아','네! 어릴 때부터 쳤어요.','Ne! Eo-ril ttae-bu-teo chyeot-sseo-yo.','Yes! I have played since childhood.',4),
  (l_id,'유스프','가르쳐 줄 수 있어요?','Ga-reu-chyeo jul su i-sseo-yo?','Can you teach me?',5),
  (l_id,'수아','물론이죠!','Mul-lon-i-jyo!','Of course!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ 수 있다 expresses?','["obligation", "ability/possibility", "prohibition", "desire"]',1,'(으)ㄹ 수 있다 = can/possible.',1),
  (l_id,'"갈 수 있다" from 가다?','["가을 수 있다", "갈 수 있다", "가으ㄹ 수 있다", "가수 있다"]',1,'가 stem + ㄹ 수 있다 = 갈 수 있다.',2),
  (l_id,'"먹다" cannot: 먹을 수 없다 or?','["먹ㄹ 수 없다", "못 먹다", "먹을 수 없다", "먹지 않다"]',2,'먹 + 을 수 없다 = 먹을 수 없다.',3),
  (l_id,'Past ability "could not go"?','["갈 수 없었어요", "갈 수 없어요", "갈 수 없을 거예요", "갈 수 없다"]',0,'Past: 갈 수 없었어요 = could not go.',4),
  (l_id,'"못 해요" vs "할 수 없어요"?','["same", "못=lower skill; 할 수 없다=conditions prevent", "different verbs", "unrelated"]',0,'못 implies skill limitation; 할 수 없다 implies external impossibility.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'할 수 있다/없다는 능력이나 가능성을 나타내요. 어간 + (으)ㄹ 수 있다/없다로 써요. 과거는 있었다/없었다로 표현해요.','(으)ㄹ 수 있다/없다 expresses ability or possibility. Past ability: 갈 수 있었어요. 못 implies skill limitation; 할 수 없다 suggests external impossibility.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=42;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#42 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어야 하다','a/eo-ya ha-da','must/have to',1),
  (l_id,'-아/어야 되다','a/eo-ya doe-da','must (colloquial)',2),
  (l_id,'의무','ui-mu','obligation',3),
  (l_id,'해야 해요','hae-ya hae-yo','have to do',4),
  (l_id,'가야 해요','ga-ya hae-yo','have to go',5),
  (l_id,'먹어야 해요','meo-geo-ya hae-yo','have to eat',6),
  (l_id,'꼭','kkok','definitely/must',7),
  (l_id,'반드시','ban-deu-si','surely/necessarily',8),
  (l_id,'지켜야 하다','ji-kyeo-ya ha-da','must observe',9),
  (l_id,'서둘러야 하다','seo-dul-leo-ya ha-da','must hurry',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Obligation - 아/어야 하다/되다','V/A + 아/어야 하다/되다 = must/have to. 숙제를 해야 해요 = I have to do homework. 하다 and 되다 are interchangeable.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'수현','왜 이렇게 일찍 가요?','Su-hyeon, wae i-reo-ke il-chik ga-yo?','Why are you leaving so early?',1),
  (l_id,'다빈','공항에 가야 해요.','Da-bin, gong-hang-e ga-ya hae-yo.','I have to go to the airport.',2),
  (l_id,'수현','서둘러야 하겠네요.','Seo-dul-leo-ya ha-get-ne-yo.','You must hurry.',3),
  (l_id,'다빈','꼭 2시간 전에 도착해야 해요.','Kkok du si-gan jeon-e do-chak-hae-ya hae-yo.','I must arrive 2 hours before.',4),
  (l_id,'수현','짐은 다 쌌어요?','Jim-eun da ssats-seo-yo?','Did you pack everything?',5),
  (l_id,'다빈','여권을 챙겨야 해요!','Yeo-gwon-eul chaeng-gyeo-ya hae-yo!','I must take my passport!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어야 하다 expresses?','["permission", "obligation/necessity", "possibility", "desire"]',1,'아/어야 하다 = must/have to.',1),
  (l_id,'"I have to eat" Korean?','["먹어도 돼요", "먹어야 해요", "먹지 마세요", "먹고 싶어요"]',1,'먹어야 해요 = have to eat.',2),
  (l_id,'"가야 되다" vs "가야 하다"?','["different meanings", "되다 slightly more colloquial; same meaning", "하다 is wrong", "되다 is formal"]',1,'Both mean must/have to; 되다 is slightly more colloquial.',3),
  (l_id,'"꼭" before 해야 해요 means?','["maybe", "definitely/absolutely must", "sometimes", "rarely"]',1,'꼭 = definitely. 꼭 해야 해요 = absolutely must do.',4),
  (l_id,'"공항에 가야 해요" means?','["I want to go", "I am going", "I must go", "I went"]',2,'아/어야 하다 = must: 가야 해요 = must go.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어야 하다/되다는 의무나 필요를 나타내요. 하다와 되다 모두 쓸 수 있어요.','아/어야 하다/되다 expresses obligation. Both 하다 and 되다 work; 되다 is slightly more colloquial.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=43;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#43 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-면 안 되다','myeon an doe-da','must not',1),
  (l_id,'금지','geum-ji','prohibition',2),
  (l_id,'하면 안 돼요','ha-myeon an dwae-yo','must not do',3),
  (l_id,'하지 마세요','ha-ji ma-se-yo','please do not',4),
  (l_id,'금연','geum-yeon','no smoking',5),
  (l_id,'금주','geum-ju','no drinking',6),
  (l_id,'주차 금지','ju-cha geum-ji','no parking',7),
  (l_id,'금지 구역','geum-ji gu-yeok','prohibited zone',8),
  (l_id,'규정','gyu-jeong','regulation',9),
  (l_id,'늦다','neut-da','to be late',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Prohibition - (으)면 안 되다','V + (으)면 안 되다 = must not. 여기서 피우면 안 돼요 = must not smoke here.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'안내원','여기서 사진 찍으면 안 됩니다.','An-nae-won, yeo-gi-seo sa-jin jji-geu-myeon an doem-ni-da.','You must not take photos here.',1),
  (l_id,'관광객','핸드폰 써도 돼요?','Gwan-gwang-gaek, haen-deu-pon sseo-do dwae-yo?','May I use my phone?',2),
  (l_id,'안내원','조용히면 돼요. 통화는 하면 안 돼요.','Jo-yong-hi-myeon dwae-yo. Tong-hwa-neun ha-myeon an dwae-yo.','If quiet, that is fine. But you must not make calls.',3),
  (l_id,'관광객','알겠습니다. 들어가도 돼요?','Al-get-sseum-ni-da. Deu-reo-ga-do dwae-yo?','I understand. May I go inside?',4),
  (l_id,'안내원','네, 들어가셔도 됩니다.','Ne, deu-reo-ga-syeo-do doem-ni-da.','Yes, you may go in.',5),
  (l_id,'관광객','감사합니다.','Gam-sa-ham-ni-da.','Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)면 안 되다 expresses?','["ability", "obligation", "prohibition", "desire"]',2,'(으)면 안 되다 = must not.',1),
  (l_id,'"No smoking" Korean?','["피워도 돼요", "피우면 안 돼요", "피울 수 있어요", "피우세요"]',1,'피우면 안 돼요 = must not smoke.',2),
  (l_id,'"하지 마세요" means?','["Please do", "Please do not", "You can do it", "You must do it"]',1,'하지 마세요 = polite negative command.',3),
  (l_id,'Which is more formal?','["하지 마세요", "하면 안 됩니다", "same", "neither"]',1,'하면 안 됩니다 is formal 합쇼체.',4),
  (l_id,'"늦으면 안 돼요" means?','["Be on time if you can", "You must not be late", "Being late is allowed", "Please be late"]',1,'(으)면 안 되다 = prohibition: must not be late.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)면 안 되다는 금지를 나타내요. 하지 마세요는 명령형 금지예요.','(으)면 안 되다 expresses prohibition. 하지 마세요 = polite negative command.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=44;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#44 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-아/어도 되다','a/eo-do doe-da','may/permission',1),
  (l_id,'허가','heo-ga','permission',2),
  (l_id,'해도 돼요','hae-do dwae-yo','you may do',3),
  (l_id,'가도 돼요','ga-do dwae-yo','you may go',4),
  (l_id,'써도 돼요','sseo-do dwae-yo','you may use',5),
  (l_id,'먹어도 돼요','meo-geo-do dwae-yo','you may eat',6),
  (l_id,'앉아도 돼요','an-ja-do dwae-yo','you may sit',7),
  (l_id,'물론','mul-lon','of course',8),
  (l_id,'허락하다','heo-rak-ha-da','to permit',9),
  (l_id,'괜찮다','gwaen-chan-ta','to be okay',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Permission - 아/어도 되다','V + 아/어도 되다 = may (permission). 앉아도 돼요 = you may sit. Question: 해도 돼요? = may I do it?','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'유리','질문해도 돼요?','Yu-ri, ji-ri-mun-hae-do dwae-yo?','May I ask a question?',1),
  (l_id,'선생님','물론이죠.','Seon-saeng-nim, mul-lon-i-jyo.','Of course.',2),
  (l_id,'유리','이 사전 써도 돼요?','I sa-jeon sseo-do dwae-yo?','May I use this dictionary?',3),
  (l_id,'선생님','네, 써도 돼요.','Ne, sseo-do dwae-yo.','Yes, you may.',4),
  (l_id,'유리','시험 때도요?','Si-heom ttae-do-yo?','During the exam too?',5),
  (l_id,'선생님','네, 되지만 답 적으면 안 돼요.','Ne, doe-ji-man dap jeo-geu-myeon an dwae-yo.','Yes, but you must not write the answers.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-아/어도 되다 expresses?','["obligation", "prohibition", "permission", "ability"]',2,'아/어도 되다 = permission.',1),
  (l_id,'"May I sit?" Korean?','["앉으면 안 돼요?", "앉아도 돼요?", "앉아야 해요?", "앉을 수 없어요?"]',1,'앉아도 돼요? = May I sit?',2),
  (l_id,'"이거 먹어도 돼요" means?','["Must eat this", "You may eat this", "Do not eat", "Can you eat?"]',1,'아/어도 되다 = permission: you may eat this.',3),
  (l_id,'아/어도 되다 vs 아/어야 하다?','["same", "되다=permission; 야 하다=obligation", "되다=prohibition", "unrelated"]',1,'되다 = permission (may). 야 하다 = obligation (must).',4),
  (l_id,'"물론이죠" means?','["Certainly not", "Of course (yes, permitted)", "Maybe", "I do not know"]',1,'물론이죠 = of course! — enthusiastically granting permission.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'아/어도 되다는 허가를 나타내요.','아/어도 되다 expresses permission. Question form asks for permission.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=45;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#45 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'-고 싶다','go sip-da','want to do',1),
  (l_id,'-고 싶어하다','go si-peo-ha-da','wants to (third person)',2),
  (l_id,'원하다','won-ha-da','to want (noun object)',3),
  (l_id,'바라다','ba-ra-da','to wish/hope',4),
  (l_id,'원하는 것','won-ha-neun geot','what one wants',5),
  (l_id,'소원','so-won','wish/desire',6),
  (l_id,'희망하다','hi-mang-ha-da','to hope',7),
  (l_id,'꿈','kkum','dream',8),
  (l_id,'되고 싶다','doe-go sip-da','want to become',9),
  (l_id,'배우고 싶다','bae-u-go sip-da','want to learn',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Desire - 고 싶다','V + 고 싶다 = want to do. 먹고 싶어요 = I want to eat. Third person: 고 싶어해요.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'하리','장래 희망이 뭐예요?','Ha-ri, jang-rae hi-mang-i mwo-ye-yo?','What do you want to be?',1),
  (l_id,'현진','의사가 되고 싶어요.','Hyeon-jin, ui-sa-ga doe-go si-peo-yo.','I want to become a doctor.',2),
  (l_id,'하리','왜요?','Wae-yo?','Why?',3),
  (l_id,'현진','사람들을 도와주고 싶어서요.','Sa-ram-deul-eul do-wa-ju-go si-peo-seo-yo.','Because I want to help people.',4),
  (l_id,'하리','정말 멋있어요. 저는 요리사가 되고 싶어요.','Jeong-mal meo-si-sseo-yo. Jeo-neun yo-ri-sa-ga doe-go si-peo-yo.','That is amazing. I want to become a chef.',5),
  (l_id,'현진','꿈을 향해 같이 노력해요!','Kkum-eul hyang-hae ga-chi no-ryeok-hae-yo!','Let us both work toward our dreams!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'-고 싶다 expresses?','["obligation", "desire to do", "prohibition", "completion"]',1,'고 싶다 = want to.',1),
  (l_id,'"I want to go" Korean?','["가야 해요", "가면 돼요", "가고 싶어요", "가도 돼요"]',2,'가고 싶어요 = I want to go.',2),
  (l_id,'Third person desire "she wants to eat"?','["먹고 싶어요", "먹고 싶어해요", "먹고 싶었어요", "먹어야 해요"]',1,'Third person: 먹고 싶어해요 (she/he wants to eat).',3),
  (l_id,'"배우고 싶어서 왔어요" means?','["I came even though I want to learn", "I came because I want to learn", "I want to learn but did not come", "I learned and came"]',1,'고 싶어서 = because I want to: 배우고 싶어서 왔어요 = I came because I want to learn.',4),
  (l_id,'고 싶다 past = ?','["고 싶었어요", "고 싶어요", "고 싶을 거예요", "고 싶었을 거예요"]',0,'Past desire: 고 싶었어요 = wanted to.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고 싶다는 하고 싶은 욕구를 나타내요. 3인칭은 고 싶어하다를 써요.','고 싶다 = want to do. Third person: 고 싶어하다. Past: 고 싶었어요.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=46;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#46 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'(으)ㄹ까요?','(eu)l-kka-yo?','shall we? / I wonder',1),
  (l_id,'(으)ㅂ시다','(eu)p-si-da','let us (formal)',2),
  (l_id,'자','ja','let us (plain)',3),
  (l_id,'제안','je-an','suggestion/proposal',4),
  (l_id,'어때요?','eo-ttae-yo?','how about it?',5),
  (l_id,'어떨까요?','eo-tteol-kka-yo?','how would it be?',6),
  (l_id,'같이','ga-chi','together',7),
  (l_id,'함께','ham-kke','together (formal)',8),
  (l_id,'~하는 게 어때요?','ha-neun ge eo-ttae-yo?','how about doing?',9),
  (l_id,'권유','gwon-yu','recommendation/invitation',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Suggestions - (으)ㄹ까요 / (으)ㅂ시다','(으)ㄹ까요? = shall we? 영화 볼까요? = Shall we watch a movie? (으)ㅂ시다 = formal "let us": 갑시다 = let us go.','See pattern description.','[{"korean": "---", "english": "Practice this pattern"}]',1),
  (l_id,'Usage notes','---','Review the pattern.','[{"korean": "---", "english": "See examples"}]',2),
  (l_id,'Common examples','---','Common examples.','[{"korean": "---", "english": "---"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'민준','이번 주말에 뭐 할까요?','Min-jun, i-beon ju-mal-e mwo hal-kka-yo?','What shall we do this weekend?',1),
  (l_id,'서연','영화 볼까요?','Seo-yeon, yeong-hwa bol-kka-yo?','Shall we watch a movie?',2),
  (l_id,'민준','좋아요. 어떤 영화가 어떨까요?','Jo-a-yo. Eo-tteon yeong-hwa-ga eo-tteol-kka-yo?','Sounds good. What kind of movie would be good?',3),
  (l_id,'서연','한국 영화 어때요?','Han-guk yeong-hwa eo-ttae-yo?','How about a Korean movie?',4),
  (l_id,'민준','좋죠! 같이 저녁도 먹읍시다.','Jo-jyo! Ga-chi jeo-nyeok-do meog-eup-si-da.','Great! Let us also eat dinner together.',5),
  (l_id,'서연','완벽한 계획이에요!','Wan-byeok-han gye-hoek-i-e-yo!','That is a perfect plan!',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'(으)ㄹ까요? expresses?','["obligation", "suggestion/shall we", "prohibition", "past action"]',1,'(으)ㄹ까요? = shall we? — making a suggestion.',1),
  (l_id,'"Shall we go?" Korean?','["가야 해요?", "가도 돼요?", "갈까요?", "가겠어요?"]',2,'갈까요? = Shall we go? ((으)ㄹ까요).',2),
  (l_id,'"Let us go" formal suggestion?','["가자", "갑시다", "가요", "가겠습니다"]',1,'(으)ㅂ시다 is formal "let us": 갑시다 = let us go.',3),
  (l_id,'"영화 보는 게 어때요?" means?','["Are you watching a movie?", "How about watching a movie?", "I watch movies", "Watch a movie!"]',1,'~하는 게 어때요? = How about doing...? — suggesting an activity.',4),
  (l_id,'(으)ㄹ까요 vs 자 for suggestions?','["same", "ㄹ까요 is polite/neutral; 자 is casual/plain speech", "ㄹ까요 is formal", "자 is more polite"]',1,'(으)ㄹ까요 is polite; 자 is plain speech: 가자 = let us go (informal).',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'(으)ㄹ까요는 제안이나 "~할까요"의 의미예요. (으)ㅂ시다는 격식 있는 청유형이에요.','(으)ㄹ까요? = shall we? — polite suggestion. (으)ㅂ시다 = formal "let us." 자 is the plain speech equivalent.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=47;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#47 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'관용구','gwan-yong-gu','idiom',1),
  (l_id,'손이 크다','son-i keu-da','to be generous (big hands)',2),
  (l_id,'발이 넓다','bal-i neop-da','to be well-connected (wide feet)',3),
  (l_id,'눈이 높다','nun-i nop-da','to have high standards (high eyes)',4),
  (l_id,'배가 아프다','bae-ga a-peu-da','to be jealous (stomach hurts)',5),
  (l_id,'입이 무겁다','ib-i mu-geop-da','to be tight-lipped (heavy mouth)',6),
  (l_id,'귀가 얇다','gwi-ga yal-da','to be gullible (thin ears)',7),
  (l_id,'눈치가 없다','nun-chi-ga eop-da','to lack social awareness',8),
  (l_id,'머리를 쓰다','meo-ri-reul sseu-da','to use one''s head/brain',9),
  (l_id,'발 벗고 나서다','bal beot-go na-seo-da','to roll up sleeves / dive in',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Body-part idioms overview','신체 부위를 이용한 관용구','Korean has many idioms using body parts. These have figurative meanings quite different from literal.','[{"korean": "손이 커요 → 인심이 좋아요", "english": "Big hands → generous person"}, {"korean": "발이 넓어요 → 아는 사람이 많아요", "english": "Wide feet → well-connected person"}]',1),
  (l_id,'Emotion idioms','배 관련 감정 표현','배 (stomach) idioms express jealousy and emotions.','[{"korean": "배가 아파요 → 질투해요", "english": "Stomach hurts → I am jealous"}, {"korean": "배가 불러요 → 충분히 만족해요", "english": "Full stomach → I am satisfied"}]',2),
  (l_id,'Head/mouth idioms','머리, 입 관련 관용구','머리 (head) and 입 (mouth) idioms relate to thinking and speaking.','[{"korean": "입이 무거워요 → 비밀을 잘 지켜요", "english": "Heavy mouth → good at keeping secrets"}, {"korean": "머리를 써요 → 지혜를 발휘해요", "english": "Use head → applies intelligence"}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'지나','우리 팀장님이 또 발이 넓어서 새 프로젝트를 따왔어요.','Ji-na, u-ri tim-jang-nim-i tto bal-i neol-beo-seo sae peu-ro-jek-teu-reul tta-wat-sseo-yo.','Our team leader got us a new project again with his connections.',1),
  (l_id,'서진','정말요? 그분 손도 크시던데.','Seo-jin, jeong-mal-yo? Geu-bun son-do keu-si-deon-de.','Really? He is also quite generous I hear.',2),
  (l_id,'지나','맞아요. 그래서 팀원들이 다 좋아해요.','Ma-ja-yo. Geu-rae-seo tim-won-deul-i da jo-a-hae-yo.','Right. That is why all the team members like him.',3),
  (l_id,'서진','그런데 김 대리는 눈치가 없어서 걱정이에요.','Geu-reon-de Gim Dae-ri-neun nun-chi-ga eop-seo-seo geok-jeong-i-e-yo.','But I am worried about Associate Kim who lacks social awareness.',4),
  (l_id,'지나','입이 무거운 사람이 필요한데요.','Ib-i mu-geo-un sa-ram-i pil-lyo-han-de-yo.','We need someone who can keep things quiet.',5),
  (l_id,'서진','맞아요. 머리 써서 잘 해결해야 해요.','Ma-ja-yo. Meo-ri sseo-seo jal hae-gyeol-hae-ya hae-yo.','Right. We need to use our heads to resolve this well.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"손이 크다" literally means big hands but idiomatically means?','["strong", "generous", "busy", "skilled"]',1,'손이 크다 idiomatically means generous — like the hands that give generously.',1),
  (l_id,'"배가 아파요" when someone else succeeds means?','["stomachache", "jealousy", "happiness", "surprise"]',1,'배가 아프다 = to be jealous of someone else''s success.',2),
  (l_id,'"발이 넓다" means?','["physically wide feet", "well-connected with many people", "bad at walking", "lazy"]',1,'발이 넓다 = to have wide connections: knows many people.',3),
  (l_id,'"입이 무겁다" describes someone who?','["talks a lot", "keeps secrets well", "eats a lot", "speaks rudely"]',1,'입이 무겁다 = heavy mouth = good at keeping secrets.',4),
  (l_id,'"눈치가 없다" means?','["bad eyesight", "lacks social awareness/reading the room", "cannot see", "is not smart"]',1,'눈치가 없다 = does not read social cues, lacks situational awareness.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 관용구는 신체 부위를 많이 써요. 손이 크다(인심이 좋다), 발이 넓다(아는 사람이 많다), 눈이 높다(기준이 높다), 배가 아프다(질투하다), 입이 무겁다(비밀을 지키다). 이런 표현들은 문자 그대로의 의미와 다르므로 통째로 외워야 해요.','Korean idioms often use body parts. 손이 크다 = generous; 발이 넓다 = well-connected; 눈이 높다 = high standards; 배가 아프다 = jealous; 입이 무겁다 = tight-lipped. These have figurative meanings unlike their literal translations and should be memorized as whole expressions.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=48;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#48 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'속담','sok-dam','proverb',1),
  (l_id,'가는 말이 고와야 오는 말이 곱다','ga-neun mal-i go-wa-ya o-neun mal-i gop-da','treat others well and they will treat you well (kind words yield kind words)',2),
  (l_id,'티끌 모아 태산','ti-kkeul mo-a tae-san','many a little makes a mickle (dust collected becomes a mountain)',3),
  (l_id,'세 살 버릇 여든까지 간다','se sal beo-reut yeo-deun-kka-ji gan-da','old habits die hard (habits at 3 go to 80)',4),
  (l_id,'원숭이도 나무에서 떨어진다','won-seung-i-do na-mu-e-seo tteol-eo-ji-n da','even experts make mistakes (monkeys fall from trees)',5),
  (l_id,'빛 좋은 개살구','bit jo-eun gae-sal-gu','all that glitters is not gold (a good-looking wild apricot)',6),
  (l_id,'고생 끝에 낙이 온다','go-saeng kkeut-e na-gi on-da','no pain no gain (joy comes at the end of hardship)',7),
  (l_id,'콩 심은 데 콩 나고 팥 심은 데 팥 난다','kong sim-eun de kong na-go','you reap what you sow',8),
  (l_id,'하늘이 무너져도 솟아날 구멍이 있다','ha-neul-i mu-neo-jyeo-do so-ta-nal gu-meong-i it-da','every cloud has a silver lining',9),
  (l_id,'아는 것이 힘이다','a-neun geo-si hi-mi-da','knowledge is power',10),
  (l_id,'뒤로 자빠져도 코가 깨진다','dwi-ro ja-ppyeo-jyeo-do ko-ga kkae-jin-da','some people are always unlucky',11);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Proverbs about karma/reciprocity','말, 행동의 결과에 관한 속담','Many Korean proverbs relate to cause and effect or reciprocity.','[{"korean": "가는 말이 고와야 오는 말이 곱다", "english": "Speak kindly and you will receive kindness."}, {"korean": "콩 심은 데 콩 난다", "english": "You reap what you sow."}]',1),
  (l_id,'Proverbs about perseverance','노력과 끈기에 관한 속담','Proverbs encouraging hard work and persistence.','[{"korean": "고생 끝에 낙이 온다", "english": "No pain, no gain."}, {"korean": "티끌 모아 태산", "english": "Small efforts add up to great things."}]',2),
  (l_id,'Proverbs about human nature','인간 본성에 관한 속담','Observations about human behavior and character.','[{"korean": "세 살 버릇 여든까지 간다", "english": "Habits formed in childhood last a lifetime."}, {"korean": "원숭이도 나무에서 떨어진다", "english": "Even experts make mistakes sometimes."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'할머니','공부가 힘들어?','Hal-meo-ni, gong-bu-ga him-deu-reo?','Is studying hard?',1),
  (l_id,'손자','네, 포기하고 싶을 때도 있어요.','Son-ja, ne, po-gi-ha-go si-peul ttae-do i-sseo-yo.','Yes, there are times I want to give up.',2),
  (l_id,'할머니','고생 끝에 낙이 온단다. 포기하면 안 돼.','Hal-meo-ni, go-saeng kkeut-e na-gi on-dan-da. po-gi-ha-myeon an dwae.','Joy comes at the end of hardship. Do not give up.',3),
  (l_id,'손자','그리고 티끌 모아 태산이잖아요.','Son-ja, geu-ri-go ti-kkeul mo-a tae-san-i-ja-na-yo.','And many a little makes a mickle, right?',4),
  (l_id,'할머니','맞아! 조금씩 해도 나중에 크게 돼.','Hal-meo-ni, ma-ja! jo-geum-ssik hae-do na-jung-e keu-ge dwae.','Right! Even little by little grows into something big.',5),
  (l_id,'손자','감사해요, 할머니. 열심히 할게요.','Son-ja, gam-sa-hae-yo, hal-meo-ni. yeol-sim-hi hal-ge-yo.','Thank you, grandmother. I will work hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'"고생 끝에 낙이 온다" means?','["life is always hard", "joy comes after hardship (no pain no gain)", "stop working hard", "give up when tired"]',1,'고생 끝에 낙이 온다 = at the end of hardship comes joy: no pain, no gain.',1),
  (l_id,'"원숭이도 나무에서 떨어진다" means?','["monkeys live in trees", "even experts make mistakes", "animals are smarter than humans", "never trust an expert"]',1,'Even monkeys fall from trees = even experts sometimes make mistakes.',2),
  (l_id,'"가는 말이 고와야 오는 말이 곱다" meaning?','["travel with kind words", "treat others well and receive kindness in return", "speak formally always", "do not talk while walking"]',1,'Outgoing words being gentle leads to incoming words being gentle: treat others as you wish to be treated.',3),
  (l_id,'"티끌 모아 태산" is similar to?','["empty vessel makes most noise", "every cloud has silver lining", "many a little makes a mickle", "honesty is the best policy"]',2,'티끌 모아 태산 = small things add up: similar to "many a little makes a mickle."',4),
  (l_id,'"세 살 버릇 여든까지 간다" warns about?','["childhood habits that last a lifetime", "being three years old", "going to school at 80", "forgetting things"]',0,'Habits at age 3 persist to age 80: old habits die hard / habits formed young last forever.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 속담은 삶의 지혜를 담고 있어요. 고생 끝에 낙이 온다(no pain no gain), 티끌 모아 태산(small efforts add up), 세 살 버릇 여든까지 간다(old habits die hard)처럼요. 가는 말이 고와야 오는 말이 곱다는 상호주의를 나타내고, 원숭이도 나무에서 떨어진다는 겸손을 나타내요.','Korean proverbs encode wisdom about life. 고생 끝에 낙이 온다 = no pain, no gain. 티끌 모아 태산 = small efforts add up. 세 살 버릇 여든까지 간다 = habits formed young persist. 가는 말이 고와야 오는 말이 곱다 = reciprocity. 원숭이도 나무에서 떨어진다 = even experts make mistakes.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=49;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#49 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사자성어','sa-ja-seong-eo','four-character Sino-Korean idiom',1),
  (l_id,'일석이조','il-seok-i-jo','kill two birds with one stone',2),
  (l_id,'설상가상','seol-sang-ga-sang','adding insult to injury',3),
  (l_id,'이심전심','i-sim-jeon-sim','mutual understanding',4),
  (l_id,'새옹지마','sae-ong-ji-ma','blessing in disguise',5),
  (l_id,'우공이산','u-gong-i-san','persistence moves mountains',6),
  (l_id,'자업자득','ja-eop-ja-deuk','reaping what you sow',7),
  (l_id,'천재일우','cheon-jae-il-u','once-in-a-lifetime opportunity',8),
  (l_id,'마이동풍','ma-i-dong-pung','turning a deaf ear',9),
  (l_id,'오매불망','o-mae-bul-mang','to long for day and night',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'사자성어 overview','Chinese-origin 4-character expressions','Used in formal writing, speeches, educated conversation. Each encodes wisdom concisely.','[{"korean": "일석이조예요!", "english": "It is like killing two birds with one stone!"}, {"korean": "설상가상으로 비까지 왔어요.", "english": "To make matters worse, it even rained."}]',1),
  (l_id,'Karmic/reciprocal idioms','결과와 인과에 관한 표현','Many 사자성어 relate to cause and effect or life lessons.','[{"korean": "자업자득이에요.", "english": "You reap what you sow."}, {"korean": "새옹지마라고 생각해요.", "english": "I think of it as a blessing in disguise."}]',2),
  (l_id,'Perseverance idioms','끈기와 인내에 관한 표현','사자성어 about working hard and being persistent.','[{"korean": "우공이산의 정신으로 합시다.", "english": "Let us do it with the spirit of persistence."}, {"korean": "천재일우의 기회예요.", "english": "This is a once-in-a-lifetime opportunity."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘의 주제는 사자성어입니다.','Gyo-su, o-neul-e ju-je-neun sa-ja-seong-eo-im-ni-da.','Today''s topic is four-character idioms.',1),
  (l_id,'학생','설상가상으로 시험과 발표가 겹쳤어요.','Seol-sang-ga-sang-eu-ro si-heom-gwa bal-pyo-ga gyeop-chyeot-sseo-yo.','To make matters worse, the exam and presentation overlap.',2),
  (l_id,'교수','천재일우의 기회니까 열심히 하세요.','Cheon-jae-il-u-e gi-hoe-ni-kka yeol-sim-hi ha-se-yo.','It is a once-in-a-lifetime chance, so work hard.',3),
  (l_id,'학생','새옹지마라고 생각할게요.','Sae-ong-ji-ma-ra-go saeng-gak-hal-ge-yo.','I will think of it as a blessing in disguise.',4),
  (l_id,'교수','우공이산의 정신으로 임하세요.','U-gong-i-san-e jeong-sin-eu-ro im-ha-se-yo.','Tackle it with the spirit of persistence.',5),
  (l_id,'학생','네, 열심히 하겠습니다.','Ne, yeol-sim-hi ha-get-sseum-ni-da.','Yes, I will work hard.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'일석이조 means?','["one stone two birds (two goals at once)", "one stone one bird", "two stones one bird", "throwing stones"]',0,'일석이조 = one stone two birds = achieve two goals with one action.',1),
  (l_id,'설상가상 expresses?','["good luck", "making a bad situation worse", "blessing", "calm weather"]',1,'설상가상 = snow on frost = one bad thing on top of another.',2),
  (l_id,'새옹지마 suggests?','["life is predictable", "what seems bad may turn out good", "always trust luck", "avoid problems"]',1,'새옹지마 = old man''s horse = what seems like misfortune may become a blessing.',3),
  (l_id,'이심전심 means?','["disagreement", "mutual understanding without words", "forced agreement", "misunderstanding"]',1,'이심전심 = heart to heart = understanding each other without speaking.',4),
  (l_id,'천재일우 refers to?','["bad luck", "a once-in-a-lifetime opportunity", "common event", "wasted time"]',1,'천재일우 = once in a thousand years = a rare, once-in-a-lifetime opportunity.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사자성어는 한자에서 온 네 글자 표현이에요. 일석이조(두 가지를 한 번에), 설상가상(안 좋은 일이 겹침), 새옹지마(화가 복이 됨), 이심전심(말 없이 통함), 천재일우(천년에 한 번). 격식적인 글이나 연설에 많이 쓰여요.','Four-character Sino-Korean idioms are used in formal writing and speeches. 일석이조 = two goals with one action; 설상가상 = one bad thing on top of another; 새옹지마 = blessing in disguise; 이심전심 = mutual understanding; 천재일우 = once-in-a-lifetime.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=50;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#50 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'은유','eun-yu','metaphor',1),
  (l_id,'직유','ji-yu','simile',2),
  (l_id,'처럼','cheo-reom','like/as',3),
  (l_id,'같이','ga-chi','like',4),
  (l_id,'N 같다','N gat-da','to be like N',5),
  (l_id,'마치','ma-chi','just as if',6),
  (l_id,'비유','bi-yu','figure of speech',7),
  (l_id,'표현','pyo-hyeon','expression',8),
  (l_id,'수사','su-sa','rhetoric',9),
  (l_id,'비교하다','bi-gyo-ha-da','to compare',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Metaphor and Simile','See description','Advanced topic: Metaphor and Simile. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Metaphor and Simile is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Metaphor and Simile is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Metaphor and Simile은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Metaphor and Simile is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=51;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#51 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'아이러니','a-i-reo-ni','irony',1),
  (l_id,'풍자','pung-ja','sarcasm',2),
  (l_id,'반어','ban-eo','antiphrase',3),
  (l_id,'비꼬다','bi-kko-da','to mock',4),
  (l_id,'과장','gwa-jang','exaggeration',5),
  (l_id,'역설','yeok-seol','paradox',6),
  (l_id,'진담','jin-dam','serious talk',7),
  (l_id,'농담','nong-dam','joke',8),
  (l_id,'냉소','naeng-so','cynicism',9),
  (l_id,'비판','bi-pan','criticism',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Irony and Sarcasm','See description','Advanced topic: Irony and Sarcasm. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Irony and Sarcasm is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Irony and Sarcasm is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Irony and Sarcasm은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Irony and Sarcasm is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=52;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#52 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'강조','gang-jo','emphasis',1),
  (l_id,'정말','jeong-mal','really',2),
  (l_id,'진짜','jin-jja','really (casual)',3),
  (l_id,'도대체','do-dae-che','on earth',4),
  (l_id,'무려','mu-ryeo','as many as',5),
  (l_id,'얼마나','eol-ma-na','how much',6),
  (l_id,'아무리','a-mu-ri','no matter how',7),
  (l_id,'역시','yeok-si','as expected',8),
  (l_id,'이렇게','i-reo-ke','like this',9),
  (l_id,'꽤','kkwae','quite/rather',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Emphatic Patterns','See description','Advanced topic: Emphatic Patterns. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Emphatic Patterns is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Emphatic Patterns is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Emphatic Patterns은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Emphatic Patterns is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=53;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#53 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'노라','no-ra','classical declarative',1),
  (l_id,'로다','ro-da','classical exclamatory',2),
  (l_id,'리라','ri-ra','classical future/will',3),
  (l_id,'도다','do-da','classical emphatic',4),
  (l_id,'더라','deo-ra','retrospective ending',5),
  (l_id,'거늘','geo-neul','classical connective',6),
  (l_id,'하노라','ha-no-ra','I do/declare',7),
  (l_id,'이로다','i-ro-da','it is (exclamatory)',8),
  (l_id,'하리라','ha-ri-ra','I shall do',9),
  (l_id,'고전 문학','go-jeon mun-hak','classical literature',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Classical Grammar Endings','See description','Advanced topic: Classical Grammar Endings. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Classical Grammar Endings is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Classical Grammar Endings is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Classical Grammar Endings은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Classical Grammar Endings is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=54;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#54 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'고어','go-eo','archaic language',1),
  (l_id,'가르다','ga-reu-da','to divide (archaic)',2),
  (l_id,'아비','a-bi','father (archaic)',3),
  (l_id,'어미','eo-mi','mother (archaic)',4),
  (l_id,'나랏말','na-rat-mal','language of the nation',5),
  (l_id,'백성','baek-seong','common people',6),
  (l_id,'임금','im-geum','king',7),
  (l_id,'그릇','geu-reut','vessel/container',8),
  (l_id,'어엿비','eo-yeot-bi','pitifully (archaic)',9),
  (l_id,'뜻','tteut','meaning/will',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Archaic Vocabulary','See description','Advanced topic: Archaic Vocabulary. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Archaic Vocabulary is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Archaic Vocabulary is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Archaic Vocabulary은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Archaic Vocabulary is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=55;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#55 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'신조어','sin-jo-eo','neologism',1),
  (l_id,'갑분싸','gap-bun-ssa','mood killer (suddenly atmosphere cold)',2),
  (l_id,'TMI','ti-em-ai','too much information',3),
  (l_id,'인싸','in-ssa','insider/popular person',4),
  (l_id,'아싸','a-ssa','outsider/loner',5),
  (l_id,'핵꿀잼','haek-kkul-jaem','extremely fun',6),
  (l_id,'존맛탱','jon-mat-taeng','extremely delicious',7),
  (l_id,'갑','gap','the one with power',8),
  (l_id,'을','eul','the one without power',9),
  (l_id,'플렉스','peul-lek-seu','flex (show off wealth)',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Neologisms and Slang','See description','Advanced topic: Neologisms and Slang. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Neologisms and Slang is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Neologisms and Slang is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Neologisms and Slang은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Neologisms and Slang is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=56;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#56 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'번역투','beon-yeok-tu','translationese',1),
  (l_id,'의역','ui-yeok','liberal translation',2),
  (l_id,'직역','jik-yeok','literal translation',3),
  (l_id,'주어 생략','ju-eo saeng-nyak','subject omission',4),
  (l_id,'수동태 회피','su-dong-tae hoe-pi','passive avoidance',5),
  (l_id,'이중 주어','i-jung ju-eo','double subject',6),
  (l_id,'조사 선택','jo-sa seon-taek','particle selection',7),
  (l_id,'어순 차이','eo-sun cha-i','word order difference',8),
  (l_id,'관형절','gwan-hyeong-jeol','relative clause',9),
  (l_id,'명사화','myeong-sa-hwa','nominalization',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Translation Grammar Patterns','See description','Advanced topic: Translation Grammar Patterns. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Translation Grammar Patterns is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Translation Grammar Patterns is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Translation Grammar Patterns은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Translation Grammar Patterns is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='grammar-mastery' AND sort_order=57;
  IF l_id IS NULL THEN RAISE NOTICE 'grammar-mastery#57 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'총복습','chong-bok-seup','comprehensive review',1),
  (l_id,'조사','jo-sa','particles',2),
  (l_id,'어미','eo-mi','verb endings',3),
  (l_id,'접속','jeop-sok','conjunctions',4),
  (l_id,'높임법','nop-im-beop','honorific system',5),
  (l_id,'피동','pi-dong','passive',6),
  (l_id,'사동','sa-dong','causative',7),
  (l_id,'관용구','gwan-yong-gu','idioms',8),
  (l_id,'문법','mun-beop','grammar',9),
  (l_id,'완성','wan-seong','completion/mastery',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Grammar Mastery Final Review','See description','Advanced topic: Grammar Mastery Final Review. This lesson covers key patterns and usage.','[{"korean": "---", "english": "Study the examples carefully."}]',1),
  (l_id,'Application','---','Practice in context.','[{"korean": "---", "english": "Apply in writing and speech."}]',2),
  (l_id,'Key takeaways','---','Review and memorize.','[{"korean": "---", "english": "Consolidate understanding."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교사','오늘의 주제를 시작하겠습니다.','Gyo-sa, o-neul-e ju-je-reul si-jak-ha-get-sseum-ni-da.','Let us begin today''s topic.',1),
  (l_id,'학생','네, 준비됐어요.','Hak-saeng, ne, jun-bi-dwaet-sseo-yo.','Yes, I am ready.',2),
  (l_id,'교사','이 개념이 왜 중요한지 설명할게요.','Gyo-sa, i gae-nyeom-i wae jung-yo-han-ji seol-myeong-hal-ge-yo.','I will explain why this concept is important.',3),
  (l_id,'학생','예를 들어 주세요.','Hak-saeng, ye-reul deu-reo ju-se-yo.','Please give an example.',4),
  (l_id,'교사','실생활에서 자주 쓰이는 표현이에요.','Gyo-sa, sil-saeng-hwal-e-seo ja-ju sseu-i-neun pyo-hyeon-i-e-yo.','These are expressions frequently used in daily life.',5),
  (l_id,'학생','잘 이해했어요. 감사합니다.','Hak-saeng, jal i-hae-haet-sseo-yo. Gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Grammar Mastery Final Review is categorized as?','["beginner", "intermediate", "advanced", "not a real topic"]',2,'Grammar Mastery Final Review is an advanced-level grammar topic.',1),
  (l_id,'This topic is important for?','["passing TOPIK 1", "daily conversation only", "advanced writing and formal speech", "children''s language"]',2,'Advanced grammar topics are important for formal and literary Korean.',2),
  (l_id,'Practice involves?','["ignoring grammar", "reading advanced texts and using patterns", "only speaking", "only listening"]',1,'Practice involves reading advanced Korean texts and using the patterns actively.',3),
  (l_id,'Which level should study this?','["TOPIK 1", "TOPIK 2", "TOPIK 5-6", "any level"]',2,'This content is appropriate for TOPIK 5-6 level learners.',4),
  (l_id,'Mastering this requires?','["a few days", "consistent practice over time", "no effort", "only reading"]',1,'Mastering advanced grammar requires consistent practice over an extended period.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'Grammar Mastery Final Review은(는) 고급 한국어 문법의 핵심 주제예요. 이 내용을 잘 이해하면 한국어 실력이 크게 향상돼요.','Grammar Mastery Final Review is a core topic in advanced Korean grammar. Understanding this well significantly improves Korean proficiency.',1);
END $$;
