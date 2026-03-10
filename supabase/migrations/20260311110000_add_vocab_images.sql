-- Add image_url column to lesson_vocabulary table
ALTER TABLE public.lesson_vocabulary
ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Update Lesson 1 (Sleeping) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '잠을 자다' THEN 'https://images.unsplash.com/photo-1541692641607-8fa68b14ae0d?w=400&h=400&fit=crop'
  WHEN '잠자리에 들다' THEN 'https://images.unsplash.com/photo-1516132006029-d16dca401313?w=400&h=400&fit=crop'
  WHEN '잠이 들다' THEN 'https://images.unsplash.com/photo-1518611505868-48510c8d89c2?w=400&h=400&fit=crop'
  WHEN '졸리다' THEN 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop'
  WHEN '하품을 하다' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
  WHEN '눈을 감다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '꿈을 꾸다' THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
  WHEN '코를 골다' THEN 'https://images.unsplash.com/photo-1516132006029-d16dca401313?w=400&h=400&fit=crop'
  WHEN '뒤척이다' THEN 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop'
  WHEN '깊이 자다' THEN 'https://images.unsplash.com/photo-1541692641607-8fa68b14ae0d?w=400&h=400&fit=crop'
  WHEN '이불을 덮다' THEN 'https://images.unsplash.com/photo-1567016376408-0226e4d0cdd6?w=400&h=400&fit=crop'
  WHEN '불을 끄다' THEN 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('잠을 자다', '잠자리에 들다', '잠이 들다', '졸리다', '하품을 하다', '눈을 감다', '꿈을 꾸다', '코를 골다', '뒤척이다', '깊이 자다', '이불을 덮다', '불을 끄다');

-- Update Lesson 2 (Waking Up) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '일어나다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '알람이 울리다' THEN 'https://images.unsplash.com/photo-1495260773802-b44f57ceb6a6?w=400&h=400&fit=crop'
  WHEN '알람을 끄다' THEN 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=400&h=400&fit=crop'
  WHEN '잠을 깨다' THEN 'https://images.unsplash.com/photo-1518611505868-48510c8d89c2?w=400&h=400&fit=crop'
  WHEN '눈이 떠지다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '눈이 부시다' THEN 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=400&fit=crop'
  WHEN '눈을 비비다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '하품하다' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
  WHEN '기지개를 켜다' THEN 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop'
  WHEN '자리에서 일어나다' THEN 'https://images.unsplash.com/photo-1516132006029-d16dca401313?w=400&h=400&fit=crop'
  WHEN '햇빛이 들어오다' THEN 'https://images.unsplash.com/photo-1509114397022-ed747cca3f4b?w=400&h=400&fit=crop'
  WHEN '커튼을 열다' THEN 'https://images.unsplash.com/photo-1503657671032-b018909dd2c9?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('일어나다', '알람이 울리다', '알람을 끄다', '잠을 깨다', '눈이 떠지다', '눈이 부시다', '눈을 비비다', '하품하다', '기지개를 켜다', '자리에서 일어나다', '햇빛이 들어오다', '커튼을 열다');

-- Update Lesson 3 (Showering) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '샤워하다' THEN 'https://images.unsplash.com/photo-1552894750-b174a27c6307?w=400&h=400&fit=crop'
  WHEN '물' THEN 'https://images.unsplash.com/photo-1571848212624-540c16bee28b?w=400&h=400&fit=crop'
  WHEN '뜨거운 물' THEN 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=400&fit=crop'
  WHEN '찬 물' THEN 'https://images.unsplash.com/photo-1508777214619-4ee899b66448?w=400&h=400&fit=crop'
  WHEN '샴푸' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '린스' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '비누' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '타올' THEN 'https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=400&fit=crop'
  WHEN '목욕탕' THEN 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop'
  WHEN '샤워기' THEN 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop'
  WHEN '린스하다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '물을 끼얹다' THEN 'https://images.unsplash.com/photo-1571848212624-540c16bee28b?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('샤워하다', '물', '뜨거운 물', '찬 물', '샴푸', '린스', '비누', '타올', '목욕탕', '샤워기', '린스하다', '물을 끼얹다');

-- Update Lesson 4 (Washing Hair) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '머리를 감다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '머리' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  WHEN '두피' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  WHEN '머릿결' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  WHEN '곱슬곱슬하다' THEN 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop'
  WHEN '윤기 있다' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  WHEN '헹굴다' THEN 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop'
  WHEN '드라이하다' THEN 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=400&h=400&fit=crop'
  WHEN '드라이기' THEN 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=400&h=400&fit=crop'
  WHEN '빗질하다' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  WHEN '빗' THEN 'https://images.unsplash.com/photo-1560807707-e5b570fcb5b5?w=400&h=400&fit=crop'
  WHEN '탈모' THEN 'https://images.unsplash.com/photo-1562596869-884b9b1e412f?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('머리를 감다', '머리', '두피', '머릿결', '곱슬곱슬하다', '윤기 있다', '헹굴다', '드라이하다', '드라이기', '빗질하다', '빗', '탈모');

-- Update Lesson 5 (Washing Face) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '얼굴을 씻다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '얼굴' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '세안' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '클렌징' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '토너' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '에센스' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '로션' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '크림' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '여드름' THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
  WHEN '피부' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '촉촉하다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '수분' THEN 'https://images.unsplash.com/photo-1571848212624-540c16bee28b?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('얼굴을 씻다', '얼굴', '세안', '클렌징', '토너', '에센스', '로션', '크림', '여드름', '피부', '촉촉하다', '수분');

-- Update Lesson 6 (Brushing Teeth) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '양치질하다' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '치아' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '칫솔' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '치약' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '치실' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '입' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '혀' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '잇몸' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '충치' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '하얀 치아' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '상큼하다' THEN 'https://images.unsplash.com/photo-1544716278-ca5e3af4abd8?w=400&h=400&fit=crop'
  WHEN '헹굴다' THEN 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('양치질하다', '치아', '칫솔', '치약', '치실', '입', '혀', '잇몸', '충치', '하얀 치아', '상큼하다', '헹굴다');

-- Update Lesson 7 (Shaving) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '면도하다' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '면도기' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '면도날' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '면도 거품' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '로션' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '콧수염' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '턱' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '수염' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '깎다' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '얼굴' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '칼' THEN 'https://images.unsplash.com/photo-1606329685713-f2cf2de0039c?w=400&h=400&fit=crop'
  WHEN '부드럽다' THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('면도하다', '면도기', '면도날', '면도 거품', '로션', '콧수염', '턱', '수염', '깎다', '얼굴', '칼', '부드럽다');

-- Update Lesson 8 (Glasses & Contact Lenses) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '안경' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '렌즈' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '렌즈 액' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '렌즈 용기' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '렌즈를 끼우다' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '렌즈를 빼다' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '안경을 쓰다' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '렌즈가 나가다' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '렌즈를 깨끗이 하다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '시력' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  WHEN '시력 검사' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  WHEN '안과 의사' THEN 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('안경', '렌즈', '렌즈 액', '렌즈 용기', '렌즈를 끼우다', '렌즈를 빼다', '안경을 쓰다', '렌즈가 나가다', '렌즈를 깨끗이 하다', '시력', '시력 검사', '안과 의사');

-- Update Lesson 9 (Getting Dressed) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '옷을 입다' THEN 'https://images.unsplash.com/photo-1574180045827-48cf960f63c7?w=400&h=400&fit=crop'
  WHEN '셔츠' THEN 'https://images.unsplash.com/photo-1559256469-ff1e33d55b10?w=400&h=400&fit=crop'
  WHEN '바지' THEN 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=400&h=400&fit=crop'
  WHEN '치마' THEN 'https://images.unsplash.com/photo-1554322555-da26d2a56e49?w=400&h=400&fit=crop'
  WHEN '양말' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'
  WHEN '신발' THEN 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'
  WHEN '벨트' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
  WHEN '넥타이' THEN 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64e12?w=400&h=400&fit=crop'
  WHEN '옷장' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
  WHEN '걸어 맞추다' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
  WHEN '어울리다' THEN 'https://images.unsplash.com/photo-1574180045827-48cf960f63c7?w=400&h=400&fit=crop'
  WHEN '따뜻하다' THEN 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('옷을 입다', '셔츠', '바지', '치마', '양말', '신발', '벨트', '넥타이', '옷장', '걸어 맞추다', '어울리다', '따뜻하다');

-- Update Lesson 10 (Makeup) vocabulary with images
UPDATE public.lesson_vocabulary
SET image_url = CASE korean
  WHEN '화장하다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '파운데이션' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '쿠션' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '컨실러' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '파우더' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '블러셔' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '아이섀도우' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '립스틱' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '마스카라' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '메이크업 브러시' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '화장을 지우다' THEN 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
  WHEN '화장이 잘 받다' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  ELSE image_url
END
WHERE korean IN ('화장하다', '파운데이션', '쿠션', '컨실러', '파우더', '블러셔', '아이섀도우', '립스틱', '마스카라', '메이크업 브러시', '화장을 지우다', '화장이 잘 받다');
