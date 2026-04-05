-- Korean-1 lessons 121-180: Full content seed (TOPIK 3-6)

DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=121;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#121 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사회 문제 토론','사회문제토론','discussing social issues',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Discussing Social Issues Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Discussing Social Issues.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "사회 문제 토론에 관한 글을 읽었어요.", "english": "I read an article about discussing social issues."}]',1),
  (l_id,'Discussing Social Issues Key Pattern 2','TOPIK 3/B1 expression','Essential expression for discussing social issues.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Discussing Social Issues Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 사회 문제 토론에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 사회 문제 토론-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about discussing social issues.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Discussing Social Issues is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Discussing Social Issues is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for discussing social issues includes?','["사회 문제 토론", "안녕하세요", "감사합니다", "미안합니다"]',0,'사회 문제 토론 is the Korean term related to Discussing Social Issues.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Discussing Social Issues is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss discussing social issues, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing discussing social issues requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사회 문제 토론은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Discussing Social Issues is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=122;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#122 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'환경 문제','환경문제','environmental concerns',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Environmental Concerns Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Environmental Concerns.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "환경 문제에 관한 글을 읽었어요.", "english": "I read an article about environmental concerns."}]',1),
  (l_id,'Environmental Concerns Key Pattern 2','TOPIK 3/B1 expression','Essential expression for environmental concerns.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Environmental Concerns Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 환경 문제에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 환경 문제-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about environmental concerns.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Environmental Concerns is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Environmental Concerns is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for environmental concerns includes?','["환경 문제", "안녕하세요", "감사합니다", "미안합니다"]',0,'환경 문제 is the Korean term related to Environmental Concerns.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Environmental Concerns is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss environmental concerns, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing environmental concerns requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'환경 문제은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Environmental Concerns is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=123;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#123 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'교육 제도','교육제도','education system',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Education System Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Education System.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "교육 제도에 관한 글을 읽었어요.", "english": "I read an article about education system."}]',1),
  (l_id,'Education System Key Pattern 2','TOPIK 3/B1 expression','Essential expression for education system.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Education System Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 교육 제도에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 교육 제도-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about education system.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Education System is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Education System is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for education system includes?','["교육 제도", "안녕하세요", "감사합니다", "미안합니다"]',0,'교육 제도 is the Korean term related to Education System.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Education System is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss education system, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing education system requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'교육 제도은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Education System is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=124;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#124 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'주거와 부동산','주거와부동산','housing and real estate',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Housing and Real Estate Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Housing and Real Estate.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "주거와 부동산에 관한 글을 읽었어요.", "english": "I read an article about housing and real estate."}]',1),
  (l_id,'Housing and Real Estate Key Pattern 2','TOPIK 3/B1 expression','Essential expression for housing and real estate.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Housing and Real Estate Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 주거와 부동산에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 주거와 부동산-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about housing and real estate.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Housing and Real Estate is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Housing and Real Estate is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for housing and real estate includes?','["주거와 부동산", "안녕하세요", "감사합니다", "미안합니다"]',0,'주거와 부동산 is the Korean term related to Housing and Real Estate.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Housing and Real Estate is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss housing and real estate, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing housing and real estate requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'주거와 부동산은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Housing and Real Estate is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=125;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#125 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'의료와 건강','의료와건강','healthcare and medicine',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Healthcare and Medicine Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Healthcare and Medicine.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "의료와 건강에 관한 글을 읽었어요.", "english": "I read an article about healthcare and medicine."}]',1),
  (l_id,'Healthcare and Medicine Key Pattern 2','TOPIK 3/B1 expression','Essential expression for healthcare and medicine.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Healthcare and Medicine Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 의료와 건강에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 의료와 건강-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about healthcare and medicine.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Healthcare and Medicine is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Healthcare and Medicine is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for healthcare and medicine includes?','["의료와 건강", "안녕하세요", "감사합니다", "미안합니다"]',0,'의료와 건강 is the Korean term related to Healthcare and Medicine.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Healthcare and Medicine is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss healthcare and medicine, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing healthcare and medicine requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'의료와 건강은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Healthcare and Medicine is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=126;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#126 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'일상 속 기술','일상속기술','technology in daily life',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Technology in Daily Life Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Technology in Daily Life.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "일상 속 기술에 관한 글을 읽었어요.", "english": "I read an article about technology in daily life."}]',1),
  (l_id,'Technology in Daily Life Key Pattern 2','TOPIK 3/B1 expression','Essential expression for technology in daily life.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Technology in Daily Life Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 일상 속 기술에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 일상 속 기술-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about technology in daily life.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Technology in Daily Life is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Technology in Daily Life is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for technology in daily life includes?','["일상 속 기술", "안녕하세요", "감사합니다", "미안합니다"]',0,'일상 속 기술 is the Korean term related to Technology in Daily Life.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Technology in Daily Life is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss technology in daily life, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing technology in daily life requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'일상 속 기술은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Technology in Daily Life is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=127;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#127 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'소셜 미디어','소셜미디어','social media and internet',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Social Media and Internet Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Social Media and Internet.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "소셜 미디어에 관한 글을 읽었어요.", "english": "I read an article about social media and internet."}]',1),
  (l_id,'Social Media and Internet Key Pattern 2','TOPIK 3/B1 expression','Essential expression for social media and internet.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Social Media and Internet Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 소셜 미디어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 소셜 미디어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about social media and internet.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Social Media and Internet is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Social Media and Internet is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for social media and internet includes?','["소셜 미디어", "안녕하세요", "감사합니다", "미안합니다"]',0,'소셜 미디어 is the Korean term related to Social Media and Internet.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Social Media and Internet is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss social media and internet, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing social media and internet requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'소셜 미디어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Social Media and Internet is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=128;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#128 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'여행 계획','여행계획','travel planning',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Travel Planning Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Travel Planning.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "여행 계획에 관한 글을 읽었어요.", "english": "I read an article about travel planning."}]',1),
  (l_id,'Travel Planning Key Pattern 2','TOPIK 3/B1 expression','Essential expression for travel planning.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Travel Planning Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 여행 계획에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 여행 계획-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about travel planning.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Travel Planning is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Travel Planning is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for travel planning includes?','["여행 계획", "안녕하세요", "감사합니다", "미안합니다"]',0,'여행 계획 is the Korean term related to Travel Planning.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Travel Planning is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss travel planning, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing travel planning requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'여행 계획은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Travel Planning is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=129;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#129 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국 음악과 한류','한국음악과한류','korean music and hallyu',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Music and Hallyu Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Korean Music and Hallyu.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국 음악과 한류에 관한 글을 읽었어요.", "english": "I read an article about korean music and hallyu."}]',1),
  (l_id,'Korean Music and Hallyu Key Pattern 2','TOPIK 3/B1 expression','Essential expression for korean music and hallyu.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Music and Hallyu Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국 음악과 한류에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국 음악과 한류-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean music and hallyu.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Music and Hallyu is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Korean Music and Hallyu is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for korean music and hallyu includes?','["한국 음악과 한류", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국 음악과 한류 is the Korean term related to Korean Music and Hallyu.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Music and Hallyu is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean music and hallyu, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean music and hallyu requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 음악과 한류은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Korean Music and Hallyu is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=130;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#130 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국 영화와 드라마','한국영화와드라마','korean movies and tv',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Movies and TV Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Korean Movies and TV.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국 영화와 드라마에 관한 글을 읽었어요.", "english": "I read an article about korean movies and tv."}]',1),
  (l_id,'Korean Movies and TV Key Pattern 2','TOPIK 3/B1 expression','Essential expression for korean movies and tv.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Movies and TV Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국 영화와 드라마에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국 영화와 드라마-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean movies and tv.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Movies and TV is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Korean Movies and TV is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for korean movies and tv includes?','["한국 영화와 드라마", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국 영화와 드라마 is the Korean term related to Korean Movies and TV.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Movies and TV is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean movies and tv, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean movies and tv requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 영화와 드라마은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Korean Movies and TV is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=131;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#131 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'운동과 스포츠','운동과스포츠','sports and activity',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Sports and Activity Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Sports and Activity.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "운동과 스포츠에 관한 글을 읽었어요.", "english": "I read an article about sports and activity."}]',1),
  (l_id,'Sports and Activity Key Pattern 2','TOPIK 3/B1 expression','Essential expression for sports and activity.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Sports and Activity Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 운동과 스포츠에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 운동과 스포츠-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about sports and activity.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Sports and Activity is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Sports and Activity is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for sports and activity includes?','["운동과 스포츠", "안녕하세요", "감사합니다", "미안합니다"]',0,'운동과 스포츠 is the Korean term related to Sports and Activity.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Sports and Activity is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss sports and activity, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing sports and activity requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'운동과 스포츠은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Sports and Activity is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=132;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#132 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'자연과 환경','자연과환경','nature and environment',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Nature and Environment Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Nature and Environment.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "자연과 환경에 관한 글을 읽었어요.", "english": "I read an article about nature and environment."}]',1),
  (l_id,'Nature and Environment Key Pattern 2','TOPIK 3/B1 expression','Essential expression for nature and environment.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Nature and Environment Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 자연과 환경에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 자연과 환경-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about nature and environment.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Nature and Environment is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Nature and Environment is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for nature and environment includes?','["자연과 환경", "안녕하세요", "감사합니다", "미안합니다"]',0,'자연과 환경 is the Korean term related to Nature and Environment.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Nature and Environment is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss nature and environment, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing nature and environment requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'자연과 환경은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Nature and Environment is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=133;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#133 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'계절과 날씨','계절과날씨','seasons and weather',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Seasons and Weather Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Seasons and Weather.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "계절과 날씨에 관한 글을 읽었어요.", "english": "I read an article about seasons and weather."}]',1),
  (l_id,'Seasons and Weather Key Pattern 2','TOPIK 3/B1 expression','Essential expression for seasons and weather.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Seasons and Weather Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 계절과 날씨에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 계절과 날씨-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about seasons and weather.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Seasons and Weather is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Seasons and Weather is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for seasons and weather includes?','["계절과 날씨", "안녕하세요", "감사합니다", "미안합니다"]',0,'계절과 날씨 is the Korean term related to Seasons and Weather.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Seasons and Weather is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss seasons and weather, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing seasons and weather requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'계절과 날씨은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Seasons and Weather is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=134;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#134 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'도시 vs 농촌','도시vs농촌','city vs rural life',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'City vs Rural Life Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to City vs Rural Life.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "도시 vs 농촌에 관한 글을 읽었어요.", "english": "I read an article about city vs rural life."}]',1),
  (l_id,'City vs Rural Life Key Pattern 2','TOPIK 3/B1 expression','Essential expression for city vs rural life.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'City vs Rural Life Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 도시 vs 농촌에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 도시 vs 농촌-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about city vs rural life.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'City vs Rural Life is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'City vs Rural Life is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for city vs rural life includes?','["도시 vs 농촌", "안녕하세요", "감사합니다", "미안합니다"]',0,'도시 vs 농촌 is the Korean term related to City vs Rural Life.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'City vs Rural Life is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss city vs rural life, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing city vs rural life requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'도시 vs 농촌은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','City vs Rural Life is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=135;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#135 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국 예절','한국예절','korean customs',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Customs Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Korean Customs.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국 예절에 관한 글을 읽었어요.", "english": "I read an article about korean customs."}]',1),
  (l_id,'Korean Customs Key Pattern 2','TOPIK 3/B1 expression','Essential expression for korean customs.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Customs Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국 예절에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국 예절-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean customs.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Customs is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Korean Customs is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for korean customs includes?','["한국 예절", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국 예절 is the Korean term related to Korean Customs.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Customs is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean customs, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean customs requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 예절은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Korean Customs is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=136;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#136 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'결혼식과 의식','결혼식과의식','weddings and ceremonies',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Weddings and Ceremonies Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Weddings and Ceremonies.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "결혼식과 의식에 관한 글을 읽었어요.", "english": "I read an article about weddings and ceremonies."}]',1),
  (l_id,'Weddings and Ceremonies Key Pattern 2','TOPIK 3/B1 expression','Essential expression for weddings and ceremonies.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Weddings and Ceremonies Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 결혼식과 의식에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 결혼식과 의식-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about weddings and ceremonies.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Weddings and Ceremonies is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Weddings and Ceremonies is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for weddings and ceremonies includes?','["결혼식과 의식", "안녕하세요", "감사합니다", "미안합니다"]',0,'결혼식과 의식 is the Korean term related to Weddings and Ceremonies.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Weddings and Ceremonies is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss weddings and ceremonies, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing weddings and ceremonies requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'결혼식과 의식은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Weddings and Ceremonies is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=137;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#137 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'전통 예술','전통예술','traditional korean arts',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Traditional Korean Arts Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Traditional Korean Arts.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "전통 예술에 관한 글을 읽었어요.", "english": "I read an article about traditional korean arts."}]',1),
  (l_id,'Traditional Korean Arts Key Pattern 2','TOPIK 3/B1 expression','Essential expression for traditional korean arts.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Traditional Korean Arts Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 전통 예술에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 전통 예술-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about traditional korean arts.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Traditional Korean Arts is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Traditional Korean Arts is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for traditional korean arts includes?','["전통 예술", "안녕하세요", "감사합니다", "미안합니다"]',0,'전통 예술 is the Korean term related to Traditional Korean Arts.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Traditional Korean Arts is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss traditional korean arts, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing traditional korean arts requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'전통 예술은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Traditional Korean Arts is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=138;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#138 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'현대 예술','현대예술','modern korean art',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Modern Korean Art Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Modern Korean Art.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "현대 예술에 관한 글을 읽었어요.", "english": "I read an article about modern korean art."}]',1),
  (l_id,'Modern Korean Art Key Pattern 2','TOPIK 3/B1 expression','Essential expression for modern korean art.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Modern Korean Art Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 현대 예술에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 현대 예술-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about modern korean art.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Modern Korean Art is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Modern Korean Art is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for modern korean art includes?','["현대 예술", "안녕하세요", "감사합니다", "미안합니다"]',0,'현대 예술 is the Korean term related to Modern Korean Art.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Modern Korean Art is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss modern korean art, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing modern korean art requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'현대 예술은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Modern Korean Art is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=139;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#139 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국 철학','한국철학','korean philosophy',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Philosophy Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Korean Philosophy.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국 철학에 관한 글을 읽었어요.", "english": "I read an article about korean philosophy."}]',1),
  (l_id,'Korean Philosophy Key Pattern 2','TOPIK 3/B1 expression','Essential expression for korean philosophy.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Philosophy Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국 철학에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국 철학-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean philosophy.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Philosophy is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Korean Philosophy is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for korean philosophy includes?','["한국 철학", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국 철학 is the Korean term related to Korean Philosophy.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Philosophy is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean philosophy, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean philosophy requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 철학은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Korean Philosophy is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=140;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#140 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'정치와 정부','정치와정부','politics and government',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Politics and Government Key Pattern 1','TOPIK 3/B1 grammar','Advanced grammar pattern relevant to Politics and Government.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "정치와 정부에 관한 글을 읽었어요.", "english": "I read an article about politics and government."}]',1),
  (l_id,'Politics and Government Key Pattern 2','TOPIK 3/B1 expression','Essential expression for politics and government.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Politics and Government Key Pattern 3','---','Application of TOPIK 3/B1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 정치와 정부에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 정치와 정부-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about politics and government.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Politics and Government is categorized as?','["beginner", "intermediate", "TOPIK 3/B1", "not applicable"]',2,'Politics and Government is a TOPIK 3/B1 level topic.',1),
  (l_id,'The Korean term for politics and government includes?','["정치와 정부", "안녕하세요", "감사합니다", "미안합니다"]',0,'정치와 정부 is the Korean term related to Politics and Government.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Politics and Government is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss politics and government, which grammar level is needed?','["basic present tense only", "TOPIK 3/B1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing politics and government requires TOPIK 3/B1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'정치와 정부은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 3/B1 수준의 내용을 다루고 있어요.','Politics and Government is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 3/B1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=141;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#141 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'비즈니스 회의','비즈니스회의','business meetings',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Business Meetings Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Business Meetings.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "비즈니스 회의에 관한 글을 읽었어요.", "english": "I read an article about business meetings."}]',1),
  (l_id,'Business Meetings Key Pattern 2','TOPIK 4/B2 expression','Essential expression for business meetings.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Business Meetings Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 비즈니스 회의에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 비즈니스 회의-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about business meetings.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Business Meetings is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Business Meetings is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for business meetings includes?','["비즈니스 회의", "안녕하세요", "감사합니다", "미안합니다"]',0,'비즈니스 회의 is the Korean term related to Business Meetings.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Business Meetings is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss business meetings, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing business meetings requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'비즈니스 회의은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Business Meetings is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=142;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#142 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'이메일 작성','이메일작성','professional email',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Professional Email Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Professional Email.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "이메일 작성에 관한 글을 읽었어요.", "english": "I read an article about professional email."}]',1),
  (l_id,'Professional Email Key Pattern 2','TOPIK 4/B2 expression','Essential expression for professional email.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Professional Email Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 이메일 작성에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 이메일 작성-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about professional email.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Professional Email is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Professional Email is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for professional email includes?','["이메일 작성", "안녕하세요", "감사합니다", "미안합니다"]',0,'이메일 작성 is the Korean term related to Professional Email.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Professional Email is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss professional email, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing professional email requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'이메일 작성은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Professional Email is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=143;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#143 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'취업 면접','취업면접','job interviews',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Job Interviews Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Job Interviews.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "취업 면접에 관한 글을 읽었어요.", "english": "I read an article about job interviews."}]',1),
  (l_id,'Job Interviews Key Pattern 2','TOPIK 4/B2 expression','Essential expression for job interviews.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Job Interviews Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 취업 면접에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 취업 면접-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about job interviews.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Job Interviews is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Job Interviews is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for job interviews includes?','["취업 면접", "안녕하세요", "감사합니다", "미안합니다"]',0,'취업 면접 is the Korean term related to Job Interviews.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Job Interviews is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss job interviews, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing job interviews requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'취업 면접은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Job Interviews is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=144;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#144 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'직장 문화','직장문화','workplace culture',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Workplace Culture Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Workplace Culture.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "직장 문화에 관한 글을 읽었어요.", "english": "I read an article about workplace culture."}]',1),
  (l_id,'Workplace Culture Key Pattern 2','TOPIK 4/B2 expression','Essential expression for workplace culture.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Workplace Culture Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 직장 문화에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 직장 문화-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about workplace culture.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Workplace Culture is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Workplace Culture is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for workplace culture includes?','["직장 문화", "안녕하세요", "감사합니다", "미안합니다"]',0,'직장 문화 is the Korean term related to Workplace Culture.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Workplace Culture is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss workplace culture, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing workplace culture requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'직장 문화은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Workplace Culture is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=145;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#145 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'금융 기초','금융기초','financial literacy',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Financial Literacy Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Financial Literacy.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "금융 기초에 관한 글을 읽었어요.", "english": "I read an article about financial literacy."}]',1),
  (l_id,'Financial Literacy Key Pattern 2','TOPIK 4/B2 expression','Essential expression for financial literacy.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Financial Literacy Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 금융 기초에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 금융 기초-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about financial literacy.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Financial Literacy is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Financial Literacy is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for financial literacy includes?','["금융 기초", "안녕하세요", "감사합니다", "미안합니다"]',0,'금융 기초 is the Korean term related to Financial Literacy.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Financial Literacy is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss financial literacy, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing financial literacy requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'금융 기초은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Financial Literacy is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=146;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#146 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'법률과 계약','법률과계약','legal and contracts',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Legal and Contracts Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Legal and Contracts.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "법률과 계약에 관한 글을 읽었어요.", "english": "I read an article about legal and contracts."}]',1),
  (l_id,'Legal and Contracts Key Pattern 2','TOPIK 4/B2 expression','Essential expression for legal and contracts.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Legal and Contracts Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 법률과 계약에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 법률과 계약-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about legal and contracts.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Legal and Contracts is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Legal and Contracts is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for legal and contracts includes?','["법률과 계약", "안녕하세요", "감사합니다", "미안합니다"]',0,'법률과 계약 is the Korean term related to Legal and Contracts.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Legal and Contracts is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss legal and contracts, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing legal and contracts requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'법률과 계약은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Legal and Contracts is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=147;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#147 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'학술 글쓰기','학술글쓰기','academic writing',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Academic Writing Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Academic Writing.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "학술 글쓰기에 관한 글을 읽었어요.", "english": "I read an article about academic writing."}]',1),
  (l_id,'Academic Writing Key Pattern 2','TOPIK 4/B2 expression','Essential expression for academic writing.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Academic Writing Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 학술 글쓰기에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 학술 글쓰기-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about academic writing.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Academic Writing is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Academic Writing is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for academic writing includes?','["학술 글쓰기", "안녕하세요", "감사합니다", "미안합니다"]',0,'학술 글쓰기 is the Korean term related to Academic Writing.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Academic Writing is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss academic writing, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing academic writing requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'학술 글쓰기은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Academic Writing is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=148;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#148 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'연구와 데이터','연구와데이터','research and data',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Research and Data Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Research and Data.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "연구와 데이터에 관한 글을 읽었어요.", "english": "I read an article about research and data."}]',1),
  (l_id,'Research and Data Key Pattern 2','TOPIK 4/B2 expression','Essential expression for research and data.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Research and Data Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 연구와 데이터에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 연구와 데이터-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about research and data.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Research and Data is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Research and Data is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for research and data includes?','["연구와 데이터", "안녕하세요", "감사합니다", "미안합니다"]',0,'연구와 데이터 is the Korean term related to Research and Data.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Research and Data is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss research and data, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing research and data requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'연구와 데이터은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Research and Data is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=149;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#149 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'과학 용어','과학용어','scientific terminology',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Scientific Terminology Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Scientific Terminology.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "과학 용어에 관한 글을 읽었어요.", "english": "I read an article about scientific terminology."}]',1),
  (l_id,'Scientific Terminology Key Pattern 2','TOPIK 4/B2 expression','Essential expression for scientific terminology.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Scientific Terminology Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 과학 용어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 과학 용어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about scientific terminology.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Scientific Terminology is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Scientific Terminology is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for scientific terminology includes?','["과학 용어", "안녕하세요", "감사합니다", "미안합니다"]',0,'과학 용어 is the Korean term related to Scientific Terminology.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Scientific Terminology is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss scientific terminology, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing scientific terminology requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'과학 용어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Scientific Terminology is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=150;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#150 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'의료 상담','의료상담','medical consultations',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Medical Consultations Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Medical Consultations.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "의료 상담에 관한 글을 읽었어요.", "english": "I read an article about medical consultations."}]',1),
  (l_id,'Medical Consultations Key Pattern 2','TOPIK 4/B2 expression','Essential expression for medical consultations.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Medical Consultations Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 의료 상담에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 의료 상담-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about medical consultations.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Medical Consultations is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Medical Consultations is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for medical consultations includes?','["의료 상담", "안녕하세요", "감사합니다", "미안합니다"]',0,'의료 상담 is the Korean term related to Medical Consultations.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Medical Consultations is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss medical consultations, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing medical consultations requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'의료 상담은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Medical Consultations is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=151;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#151 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'경제 동향','경제동향','economic trends',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Economic Trends Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Economic Trends.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "경제 동향에 관한 글을 읽었어요.", "english": "I read an article about economic trends."}]',1),
  (l_id,'Economic Trends Key Pattern 2','TOPIK 4/B2 expression','Essential expression for economic trends.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Economic Trends Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 경제 동향에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 경제 동향-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about economic trends.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Economic Trends is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Economic Trends is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for economic trends includes?','["경제 동향", "안녕하세요", "감사합니다", "미안합니다"]',0,'경제 동향 is the Korean term related to Economic Trends.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Economic Trends is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss economic trends, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing economic trends requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'경제 동향은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Economic Trends is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=152;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#152 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'국제 뉴스','국제뉴스','global affairs',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Global Affairs Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Global Affairs.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "국제 뉴스에 관한 글을 읽었어요.", "english": "I read an article about global affairs."}]',1),
  (l_id,'Global Affairs Key Pattern 2','TOPIK 4/B2 expression','Essential expression for global affairs.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Global Affairs Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 국제 뉴스에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 국제 뉴스-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about global affairs.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Global Affairs is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Global Affairs is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for global affairs includes?','["국제 뉴스", "안녕하세요", "감사합니다", "미안합니다"]',0,'국제 뉴스 is the Korean term related to Global Affairs.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Global Affairs is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss global affairs, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing global affairs requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'국제 뉴스은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Global Affairs is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=153;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#153 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'환경 정책','환경정책','environmental policy',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Environmental Policy Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Environmental Policy.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "환경 정책에 관한 글을 읽었어요.", "english": "I read an article about environmental policy."}]',1),
  (l_id,'Environmental Policy Key Pattern 2','TOPIK 4/B2 expression','Essential expression for environmental policy.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Environmental Policy Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 환경 정책에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 환경 정책-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about environmental policy.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Environmental Policy is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Environmental Policy is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for environmental policy includes?','["환경 정책", "안녕하세요", "감사합니다", "미안합니다"]',0,'환경 정책 is the Korean term related to Environmental Policy.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Environmental Policy is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss environmental policy, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing environmental policy requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'환경 정책은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Environmental Policy is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=154;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#154 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'기술과 혁신','기술과혁신','technology innovation',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Technology Innovation Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Technology Innovation.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "기술과 혁신에 관한 글을 읽었어요.", "english": "I read an article about technology innovation."}]',1),
  (l_id,'Technology Innovation Key Pattern 2','TOPIK 4/B2 expression','Essential expression for technology innovation.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Technology Innovation Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 기술과 혁신에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 기술과 혁신-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about technology innovation.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Technology Innovation is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Technology Innovation is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for technology innovation includes?','["기술과 혁신", "안녕하세요", "감사합니다", "미안합니다"]',0,'기술과 혁신 is the Korean term related to Technology Innovation.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Technology Innovation is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss technology innovation, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing technology innovation requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'기술과 혁신은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Technology Innovation is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=155;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#155 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'사회 복지','사회복지','social welfare',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Social Welfare Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Social Welfare.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "사회 복지에 관한 글을 읽었어요.", "english": "I read an article about social welfare."}]',1),
  (l_id,'Social Welfare Key Pattern 2','TOPIK 4/B2 expression','Essential expression for social welfare.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Social Welfare Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 사회 복지에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 사회 복지-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about social welfare.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Social Welfare is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Social Welfare is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for social welfare includes?','["사회 복지", "안녕하세요", "감사합니다", "미안합니다"]',0,'사회 복지 is the Korean term related to Social Welfare.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Social Welfare is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss social welfare, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing social welfare requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'사회 복지은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Social Welfare is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=156;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#156 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'문화와 세계화','문화와세계화','cultural globalization',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Cultural Globalization Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Cultural Globalization.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "문화와 세계화에 관한 글을 읽었어요.", "english": "I read an article about cultural globalization."}]',1),
  (l_id,'Cultural Globalization Key Pattern 2','TOPIK 4/B2 expression','Essential expression for cultural globalization.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Cultural Globalization Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 문화와 세계화에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 문화와 세계화-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about cultural globalization.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Cultural Globalization is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Cultural Globalization is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for cultural globalization includes?','["문화와 세계화", "안녕하세요", "감사합니다", "미안합니다"]',0,'문화와 세계화 is the Korean term related to Cultural Globalization.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Cultural Globalization is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss cultural globalization, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing cultural globalization requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'문화와 세계화은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Cultural Globalization is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=157;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#157 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'학문적 한국어','학문적한국어','academic korean',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Academic Korean Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Academic Korean.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "학문적 한국어에 관한 글을 읽었어요.", "english": "I read an article about academic korean."}]',1),
  (l_id,'Academic Korean Key Pattern 2','TOPIK 4/B2 expression','Essential expression for academic korean.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Academic Korean Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 학문적 한국어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 학문적 한국어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about academic korean.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Academic Korean is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Academic Korean is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for academic korean includes?','["학문적 한국어", "안녕하세요", "감사합니다", "미안합니다"]',0,'학문적 한국어 is the Korean term related to Academic Korean.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Academic Korean is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss academic korean, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing academic korean requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'학문적 한국어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Academic Korean is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=158;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#158 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'고급 문법 복습','고급문법복습','advanced grammar review',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Advanced Grammar Review Key Pattern 1','TOPIK 4/B2 grammar','Advanced grammar pattern relevant to Advanced Grammar Review.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "고급 문법 복습에 관한 글을 읽었어요.", "english": "I read an article about advanced grammar review."}]',1),
  (l_id,'Advanced Grammar Review Key Pattern 2','TOPIK 4/B2 expression','Essential expression for advanced grammar review.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Advanced Grammar Review Key Pattern 3','---','Application of TOPIK 4/B2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 고급 문법 복습에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 고급 문법 복습-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about advanced grammar review.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Advanced Grammar Review is categorized as?','["beginner", "intermediate", "TOPIK 4/B2", "not applicable"]',2,'Advanced Grammar Review is a TOPIK 4/B2 level topic.',1),
  (l_id,'The Korean term for advanced grammar review includes?','["고급 문법 복습", "안녕하세요", "감사합니다", "미안합니다"]',0,'고급 문법 복습 is the Korean term related to Advanced Grammar Review.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Advanced Grammar Review is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss advanced grammar review, which grammar level is needed?','["basic present tense only", "TOPIK 4/B2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing advanced grammar review requires TOPIK 4/B2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고급 문법 복습은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 4/B2 수준의 내용을 다루고 있어요.','Advanced Grammar Review is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 4/B2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=159;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#159 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'문학적 한국어','문학적한국어','literary korean',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Literary Korean Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Literary Korean.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "문학적 한국어에 관한 글을 읽었어요.", "english": "I read an article about literary korean."}]',1),
  (l_id,'Literary Korean Key Pattern 2','TOPIK 5/C1 expression','Essential expression for literary korean.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Literary Korean Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 문학적 한국어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 문학적 한국어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about literary korean.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Literary Korean is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Literary Korean is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for literary korean includes?','["문학적 한국어", "안녕하세요", "감사합니다", "미안합니다"]',0,'문학적 한국어 is the Korean term related to Literary Korean.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Literary Korean is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss literary korean, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing literary korean requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'문학적 한국어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Literary Korean is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=160;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#160 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'학술 담화','학술담화','academic discourse',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Academic Discourse Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Academic Discourse.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "학술 담화에 관한 글을 읽었어요.", "english": "I read an article about academic discourse."}]',1),
  (l_id,'Academic Discourse Key Pattern 2','TOPIK 5/C1 expression','Essential expression for academic discourse.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Academic Discourse Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 학술 담화에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 학술 담화-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about academic discourse.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Academic Discourse is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Academic Discourse is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for academic discourse includes?','["학술 담화", "안녕하세요", "감사합니다", "미안합니다"]',0,'학술 담화 is the Korean term related to Academic Discourse.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Academic Discourse is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss academic discourse, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing academic discourse requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'학술 담화은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Academic Discourse is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=161;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#161 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'정치 수사','정치수사','political rhetoric',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Political Rhetoric Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Political Rhetoric.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "정치 수사에 관한 글을 읽었어요.", "english": "I read an article about political rhetoric."}]',1),
  (l_id,'Political Rhetoric Key Pattern 2','TOPIK 5/C1 expression','Essential expression for political rhetoric.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Political Rhetoric Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 정치 수사에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 정치 수사-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about political rhetoric.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Political Rhetoric is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Political Rhetoric is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for political rhetoric includes?','["정치 수사", "안녕하세요", "감사합니다", "미안합니다"]',0,'정치 수사 is the Korean term related to Political Rhetoric.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Political Rhetoric is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss political rhetoric, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing political rhetoric requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'정치 수사은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Political Rhetoric is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=162;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#162 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'미디어 분석','미디어분석','media analysis',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Media Analysis Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Media Analysis.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "미디어 분석에 관한 글을 읽었어요.", "english": "I read an article about media analysis."}]',1),
  (l_id,'Media Analysis Key Pattern 2','TOPIK 5/C1 expression','Essential expression for media analysis.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Media Analysis Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 미디어 분석에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 미디어 분석-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about media analysis.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Media Analysis is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Media Analysis is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for media analysis includes?','["미디어 분석", "안녕하세요", "감사합니다", "미안합니다"]',0,'미디어 분석 is the Korean term related to Media Analysis.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Media Analysis is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss media analysis, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing media analysis requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'미디어 분석은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Media Analysis is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=163;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#163 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'문화 비평','문화비평','cultural criticism',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Cultural Criticism Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Cultural Criticism.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "문화 비평에 관한 글을 읽었어요.", "english": "I read an article about cultural criticism."}]',1),
  (l_id,'Cultural Criticism Key Pattern 2','TOPIK 5/C1 expression','Essential expression for cultural criticism.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Cultural Criticism Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 문화 비평에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 문화 비평-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about cultural criticism.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Cultural Criticism is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Cultural Criticism is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for cultural criticism includes?','["문화 비평", "안녕하세요", "감사합니다", "미안합니다"]',0,'문화 비평 is the Korean term related to Cultural Criticism.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Cultural Criticism is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss cultural criticism, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing cultural criticism requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'문화 비평은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Cultural Criticism is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=164;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#164 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'철학적 개념','철학적개념','philosophical concepts',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Philosophical Concepts Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Philosophical Concepts.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "철학적 개념에 관한 글을 읽었어요.", "english": "I read an article about philosophical concepts."}]',1),
  (l_id,'Philosophical Concepts Key Pattern 2','TOPIK 5/C1 expression','Essential expression for philosophical concepts.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Philosophical Concepts Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 철학적 개념에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 철학적 개념-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about philosophical concepts.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Philosophical Concepts is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Philosophical Concepts is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for philosophical concepts includes?','["철학적 개념", "안녕하세요", "감사합니다", "미안합니다"]',0,'철학적 개념 is the Korean term related to Philosophical Concepts.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Philosophical Concepts is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss philosophical concepts, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing philosophical concepts requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'철학적 개념은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Philosophical Concepts is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=165;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#165 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'고급 관용구','고급관용구','advanced idioms',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Advanced Idioms Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Advanced Idioms.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "고급 관용구에 관한 글을 읽었어요.", "english": "I read an article about advanced idioms."}]',1),
  (l_id,'Advanced Idioms Key Pattern 2','TOPIK 5/C1 expression','Essential expression for advanced idioms.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Advanced Idioms Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 고급 관용구에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 고급 관용구-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about advanced idioms.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Advanced Idioms is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Advanced Idioms is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for advanced idioms includes?','["고급 관용구", "안녕하세요", "감사합니다", "미안합니다"]',0,'고급 관용구 is the Korean term related to Advanced Idioms.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Advanced Idioms is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss advanced idioms, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing advanced idioms requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고급 관용구은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Advanced Idioms is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=166;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#166 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국 고전 문학','한국고전문학','korean classical literature',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Classical Literature Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Korean Classical Literature.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국 고전 문학에 관한 글을 읽었어요.", "english": "I read an article about korean classical literature."}]',1),
  (l_id,'Korean Classical Literature Key Pattern 2','TOPIK 5/C1 expression','Essential expression for korean classical literature.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Classical Literature Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국 고전 문학에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국 고전 문학-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean classical literature.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Classical Literature is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Korean Classical Literature is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for korean classical literature includes?','["한국 고전 문학", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국 고전 문학 is the Korean term related to Korean Classical Literature.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Classical Literature is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean classical literature, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean classical literature requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국 고전 문학은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Korean Classical Literature is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=167;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#167 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'현대 한국 문학','현대한국문학','contemporary literature',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Contemporary Literature Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Contemporary Literature.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "현대 한국 문학에 관한 글을 읽었어요.", "english": "I read an article about contemporary literature."}]',1),
  (l_id,'Contemporary Literature Key Pattern 2','TOPIK 5/C1 expression','Essential expression for contemporary literature.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Contemporary Literature Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 현대 한국 문학에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 현대 한국 문학-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about contemporary literature.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Contemporary Literature is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Contemporary Literature is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for contemporary literature includes?','["현대 한국 문학", "안녕하세요", "감사합니다", "미안합니다"]',0,'현대 한국 문학 is the Korean term related to Contemporary Literature.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Contemporary Literature is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss contemporary literature, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing contemporary literature requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'현대 한국 문학은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Contemporary Literature is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=168;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#168 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'토론과 논쟁','토론과논쟁','debate and argumentation',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Debate and Argumentation Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Debate and Argumentation.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "토론과 논쟁에 관한 글을 읽었어요.", "english": "I read an article about debate and argumentation."}]',1),
  (l_id,'Debate and Argumentation Key Pattern 2','TOPIK 5/C1 expression','Essential expression for debate and argumentation.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Debate and Argumentation Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 토론과 논쟁에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 토론과 논쟁-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about debate and argumentation.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Debate and Argumentation is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Debate and Argumentation is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for debate and argumentation includes?','["토론과 논쟁", "안녕하세요", "감사합니다", "미안합니다"]',0,'토론과 논쟁 is the Korean term related to Debate and Argumentation.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Debate and Argumentation is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss debate and argumentation, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing debate and argumentation requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'토론과 논쟁은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Debate and Argumentation is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=169;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#169 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'발표와 연설','발표와연설','presentation and speech',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Presentation and Speech Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Presentation and Speech.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "발표와 연설에 관한 글을 읽었어요.", "english": "I read an article about presentation and speech."}]',1),
  (l_id,'Presentation and Speech Key Pattern 2','TOPIK 5/C1 expression','Essential expression for presentation and speech.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Presentation and Speech Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 발표와 연설에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 발표와 연설-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about presentation and speech.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Presentation and Speech is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Presentation and Speech is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for presentation and speech includes?','["발표와 연설", "안녕하세요", "감사합니다", "미안합니다"]',0,'발표와 연설 is the Korean term related to Presentation and Speech.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Presentation and Speech is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss presentation and speech, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing presentation and speech requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'발표와 연설은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Presentation and Speech is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=170;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#170 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'번역과 통역','번역과통역','translation skills',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Translation Skills Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Translation Skills.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "번역과 통역에 관한 글을 읽었어요.", "english": "I read an article about translation skills."}]',1),
  (l_id,'Translation Skills Key Pattern 2','TOPIK 5/C1 expression','Essential expression for translation skills.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Translation Skills Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 번역과 통역에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 번역과 통역-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about translation skills.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Translation Skills is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Translation Skills is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for translation skills includes?','["번역과 통역", "안녕하세요", "감사합니다", "미안합니다"]',0,'번역과 통역 is the Korean term related to Translation Skills.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Translation Skills is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss translation skills, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing translation skills requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'번역과 통역은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Translation Skills is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=171;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#171 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'고급 비즈니스','고급비즈니스','advanced business korean',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Advanced Business Korean Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to Advanced Business Korean.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "고급 비즈니스에 관한 글을 읽었어요.", "english": "I read an article about advanced business korean."}]',1),
  (l_id,'Advanced Business Korean Key Pattern 2','TOPIK 5/C1 expression','Essential expression for advanced business korean.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Advanced Business Korean Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 고급 비즈니스에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 고급 비즈니스-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about advanced business korean.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Advanced Business Korean is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'Advanced Business Korean is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for advanced business korean includes?','["고급 비즈니스", "안녕하세요", "감사합니다", "미안합니다"]',0,'고급 비즈니스 is the Korean term related to Advanced Business Korean.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Advanced Business Korean is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss advanced business korean, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing advanced business korean requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고급 비즈니스은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','Advanced Business Korean is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=172;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#172 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'TOPIK 5 복습','TOPIK5복습','topik 5 review',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'TOPIK 5 Review Key Pattern 1','TOPIK 5/C1 grammar','Advanced grammar pattern relevant to TOPIK 5 Review.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "TOPIK 5 복습에 관한 글을 읽었어요.", "english": "I read an article about topik 5 review."}]',1),
  (l_id,'TOPIK 5 Review Key Pattern 2','TOPIK 5/C1 expression','Essential expression for topik 5 review.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'TOPIK 5 Review Key Pattern 3','---','Application of TOPIK 5/C1 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 TOPIK 5 복습에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun TOPIK 5 복습-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about topik 5 review.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'TOPIK 5 Review is categorized as?','["beginner", "intermediate", "TOPIK 5/C1", "not applicable"]',2,'TOPIK 5 Review is a TOPIK 5/C1 level topic.',1),
  (l_id,'The Korean term for topik 5 review includes?','["TOPIK 5 복습", "안녕하세요", "감사합니다", "미안합니다"]',0,'TOPIK 5 복습 is the Korean term related to TOPIK 5 Review.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'TOPIK 5 Review is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss topik 5 review, which grammar level is needed?','["basic present tense only", "TOPIK 5/C1 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing topik 5 review requires TOPIK 5/C1 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'TOPIK 5 복습은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 5/C1 수준의 내용을 다루고 있어요.','TOPIK 5 Review is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 5/C1 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=173;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#173 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'원어민 수준','원어민수준','near-native fluency',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Near-Native Fluency Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Near-Native Fluency.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "원어민 수준에 관한 글을 읽었어요.", "english": "I read an article about near-native fluency."}]',1),
  (l_id,'Near-Native Fluency Key Pattern 2','TOPIK 6/C2 expression','Essential expression for near-native fluency.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Near-Native Fluency Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 원어민 수준에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 원어민 수준-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about near-native fluency.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Near-Native Fluency is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Near-Native Fluency is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for near-native fluency includes?','["원어민 수준", "안녕하세요", "감사합니다", "미안합니다"]',0,'원어민 수준 is the Korean term related to Near-Native Fluency.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Near-Native Fluency is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss near-native fluency, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing near-native fluency requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'원어민 수준은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Near-Native Fluency is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=174;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#174 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'고전 한국어','고전한국어','classical korean',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Classical Korean Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Classical Korean.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "고전 한국어에 관한 글을 읽었어요.", "english": "I read an article about classical korean."}]',1),
  (l_id,'Classical Korean Key Pattern 2','TOPIK 6/C2 expression','Essential expression for classical korean.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Classical Korean Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 고전 한국어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 고전 한국어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about classical korean.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Classical Korean is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Classical Korean is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for classical korean includes?','["고전 한국어", "안녕하세요", "감사합니다", "미안합니다"]',0,'고전 한국어 is the Korean term related to Classical Korean.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Classical Korean is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss classical korean, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing classical korean requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'고전 한국어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Classical Korean is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=175;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#175 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'방송 한국어','방송한국어','broadcasting korean',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Broadcasting Korean Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Broadcasting Korean.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "방송 한국어에 관한 글을 읽었어요.", "english": "I read an article about broadcasting korean."}]',1),
  (l_id,'Broadcasting Korean Key Pattern 2','TOPIK 6/C2 expression','Essential expression for broadcasting korean.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Broadcasting Korean Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 방송 한국어에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 방송 한국어-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about broadcasting korean.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Broadcasting Korean is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Broadcasting Korean is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for broadcasting korean includes?','["방송 한국어", "안녕하세요", "감사합니다", "미안합니다"]',0,'방송 한국어 is the Korean term related to Broadcasting Korean.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Broadcasting Korean is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss broadcasting korean, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing broadcasting korean requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'방송 한국어은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Broadcasting Korean is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=176;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#176 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'문학 분석','문학분석','literary analysis',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Literary Analysis Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Literary Analysis.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "문학 분석에 관한 글을 읽었어요.", "english": "I read an article about literary analysis."}]',1),
  (l_id,'Literary Analysis Key Pattern 2','TOPIK 6/C2 expression','Essential expression for literary analysis.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Literary Analysis Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 문학 분석에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 문학 분석-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about literary analysis.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Literary Analysis is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Literary Analysis is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for literary analysis includes?','["문학 분석", "안녕하세요", "감사합니다", "미안합니다"]',0,'문학 분석 is the Korean term related to Literary Analysis.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Literary Analysis is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss literary analysis, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing literary analysis requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'문학 분석은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Literary Analysis is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=177;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#177 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국어 언어학','한국어언어학','korean linguistics',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Korean Linguistics Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Korean Linguistics.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국어 언어학에 관한 글을 읽었어요.", "english": "I read an article about korean linguistics."}]',1),
  (l_id,'Korean Linguistics Key Pattern 2','TOPIK 6/C2 expression','Essential expression for korean linguistics.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Korean Linguistics Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국어 언어학에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국어 언어학-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about korean linguistics.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Korean Linguistics is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Korean Linguistics is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for korean linguistics includes?','["한국어 언어학", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국어 언어학 is the Korean term related to Korean Linguistics.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Korean Linguistics is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss korean linguistics, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing korean linguistics requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 언어학은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Korean Linguistics is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=178;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#178 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'심층 문화 뉘앙스','심층문화뉘앙스','advanced cultural nuance',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Advanced Cultural Nuance Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Advanced Cultural Nuance.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "심층 문화 뉘앙스에 관한 글을 읽었어요.", "english": "I read an article about advanced cultural nuance."}]',1),
  (l_id,'Advanced Cultural Nuance Key Pattern 2','TOPIK 6/C2 expression','Essential expression for advanced cultural nuance.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Advanced Cultural Nuance Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 심층 문화 뉘앙스에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 심층 문화 뉘앙스-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about advanced cultural nuance.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Advanced Cultural Nuance is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Advanced Cultural Nuance is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for advanced cultural nuance includes?','["심층 문화 뉘앙스", "안녕하세요", "감사합니다", "미안합니다"]',0,'심층 문화 뉘앙스 is the Korean term related to Advanced Cultural Nuance.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Advanced Cultural Nuance is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss advanced cultural nuance, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing advanced cultural nuance requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'심층 문화 뉘앙스은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Advanced Cultural Nuance is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=179;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#179 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'전문가 수준','전문가수준','professional mastery',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Professional Mastery Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Professional Mastery.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "전문가 수준에 관한 글을 읽었어요.", "english": "I read an article about professional mastery."}]',1),
  (l_id,'Professional Mastery Key Pattern 2','TOPIK 6/C2 expression','Essential expression for professional mastery.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Professional Mastery Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 전문가 수준에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 전문가 수준-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about professional mastery.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Professional Mastery is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Professional Mastery is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for professional mastery includes?','["전문가 수준", "안녕하세요", "감사합니다", "미안합니다"]',0,'전문가 수준 is the Korean term related to Professional Mastery.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Professional Mastery is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss professional mastery, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing professional mastery requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'전문가 수준은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Professional Mastery is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
DO $$ DECLARE l_id integer; BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=180;
  IF l_id IS NULL THEN RAISE NOTICE 'korean-1#180 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading WHERE lesson_id=l_id;
  INSERT INTO public.lesson_vocabulary(lesson_id,korean,romanization,meaning,sort_order)VALUES
  (l_id,'한국어 최종 복습','한국어최종복습','final review',1),
  (l_id,'주제','ju-je','topic/subject',2),
  (l_id,'내용','nae-yong','content',3),
  (l_id,'이해하다','i-hae-ha-da','to understand',4),
  (l_id,'분석하다','bun-seok-ha-da','to analyze',5),
  (l_id,'토론하다','to-ron-ha-da','to discuss/debate',6),
  (l_id,'관련','gwan-nyeon','related/relevant',7),
  (l_id,'중요하다','jung-yo-ha-da','to be important',8),
  (l_id,'발전하다','bal-jeon-ha-da','to develop/advance',9),
  (l_id,'영향','yeong-hyang','influence/impact',10);
  INSERT INTO public.lesson_grammar(lesson_id,title,structure,explanation,examples,sort_order)VALUES
  (l_id,'Final Review Key Pattern 1','TOPIK 6/C2 grammar','Advanced grammar pattern relevant to Final Review.','[{"korean": "이 주제에 대해 토론합시다.", "english": "Let us discuss this topic."}, {"korean": "한국어 최종 복습에 관한 글을 읽었어요.", "english": "I read an article about final review."}]',1),
  (l_id,'Final Review Key Pattern 2','TOPIK 6/C2 expression','Essential expression for final review.','[{"korean": "이 문제를 분석해 봅시다.", "english": "Let us try analyzing this issue."}, {"korean": "중요한 내용을 요약하세요.", "english": "Please summarize the important content."}]',2),
  (l_id,'Final Review Key Pattern 3','---','Application of TOPIK 6/C2 patterns.','[{"korean": "이 주제가 왜 중요한지 설명해 주세요.", "english": "Please explain why this topic is important."}, {"korean": "관련 정보를 찾아보겠습니다.", "english": "I will look up related information."}]',3);
  INSERT INTO public.lesson_dialogues(lesson_id,speaker,korean,romanization,english,sort_order)VALUES
  (l_id,'교수','오늘은 한국어 최종 복습에 대해 이야기하겠습니다.','Gyo-su, o-neul-eun 한국어 최종 복습-e dae-hae i-ya-gi-ha-get-sseum-ni-da.','Today we will talk about final review.',1),
  (l_id,'학생','네, 이 주제에 관심이 많아요.','Hak-saeng, ne, i ju-je-e gwan-sim-i ma-na-yo.','Yes, I am very interested in this topic.',2),
  (l_id,'교수','먼저 기본 개념을 설명하겠습니다.','Gyo-su, meon-jeo gi-bon gae-nyeom-eul seol-myeong-ha-get-sseum-ni-da.','First I will explain the basic concepts.',3),
  (l_id,'학생','구체적인 예를 들어 주실 수 있어요?','Hak-saeng, gu-che-jeok-in ye-reul deu-reo ju-sil su i-sseo-yo?','Could you give a specific example?',4),
  (l_id,'교수','물론이죠. 실생활에서의 적용을 봅시다.','Gyo-su, mul-lon-i-jyo. sil-saeng-hwal-e-seo-e jeok-yong-eul bop-si-da.','Of course. Let us look at real-life application.',5),
  (l_id,'학생','잘 이해했습니다. 감사합니다.','Hak-saeng, jal i-hae-haet-sseum-ni-da. gam-sa-ham-ni-da.','I understand well. Thank you.',6);
  INSERT INTO public.lesson_exercises(lesson_id,question,options,correct_index,explanation,sort_order)VALUES
  (l_id,'Final Review is categorized as?','["beginner", "intermediate", "TOPIK 6/C2", "not applicable"]',2,'Final Review is a TOPIK 6/C2 level topic.',1),
  (l_id,'The Korean term for final review includes?','["한국어 최종 복습", "안녕하세요", "감사합니다", "미안합니다"]',0,'한국어 최종 복습 is the Korean term related to Final Review.',2),
  (l_id,'Which skill does this lesson develop?','["only reading", "only listening", "integrated language skills", "only writing"]',2,'This lesson develops integrated language skills across all four domains.',3),
  (l_id,'This topic is relevant to?','["only Korean learners", "understanding Korean society and culture", "children only", "beginners only"]',1,'Final Review is relevant to understanding Korean society and culture at an advanced level.',4),
  (l_id,'To discuss final review, which grammar level is needed?','["basic present tense only", "TOPIK 6/C2 patterns and vocabulary", "no grammar needed", "only particles"]',1,'Discussing final review requires TOPIK 6/C2 level grammar and vocabulary.',5);
  INSERT INTO public.lesson_reading(lesson_id,korean_text,english_text,sort_order)VALUES
  (l_id,'한국어 최종 복습은(는) 한국 사회와 문화를 이해하는 데 중요한 주제예요. 이 주제를 깊이 있게 이해하면 한국어 실력이 크게 향상돼요. 관련 어휘와 표현을 익히면 더 자연스럽게 대화할 수 있어요. TOPIK 6/C2 수준의 내용을 다루고 있어요.','Final Review is an important topic for understanding Korean society and culture. Deep understanding of this topic greatly improves Korean ability. Learning related vocabulary and expressions enables more natural conversation. This covers TOPIK 6/C2 level content.',1);
END $$;
