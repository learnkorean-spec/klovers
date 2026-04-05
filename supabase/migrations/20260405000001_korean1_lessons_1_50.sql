-- Korean-1 lessons 1–50: Full content seed
-- Covers: Hangul Foundation (lessons 1–10, topik_level=0)
--         TOPIK 1 / A1 (lessons 11–50, topik_level=1)
-- Each block is idempotent (DELETE then INSERT).

-- ============================================================
-- LESSON 1: Korean Vowels (한국어 모음)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=1;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=1 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, 'ㅏ', 'a', 'vowel "a" — bright, open sound (아)', 1),
  (l_id, 'ㅑ', 'ya', 'vowel "ya" — like "yard" (야)', 2),
  (l_id, 'ㅓ', 'eo', 'vowel "eo" — like "sun" (어)', 3),
  (l_id, 'ㅕ', 'yeo', 'vowel "yeo" — like "young" (여)', 4),
  (l_id, 'ㅗ', 'o', 'vowel "o" — rounded, back (오)', 5),
  (l_id, 'ㅛ', 'yo', 'vowel "yo" — like "yo-yo" (요)', 6),
  (l_id, 'ㅜ', 'u', 'vowel "u" — like "moon" (우)', 7),
  (l_id, 'ㅠ', 'yu', 'vowel "yu" — like "you" (유)', 8),
  (l_id, 'ㅡ', 'eu', 'vowel "eu" — unrounded back vowel (으)', 9),
  (l_id, 'ㅣ', 'i', 'vowel "i" — like "ee" (이)', 10),
  (l_id, '아', 'a', 'syllable: ㅇ (silent) + ㅏ', 11),
  (l_id, '오', 'o', 'syllable: ㅇ (silent) + ㅗ', 12),
  (l_id, '이', 'i', 'syllable: ㅇ (silent) + ㅣ; also means "this"', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'The 10 Basic Vowels',
   'ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ',
   'Korean has 10 basic vowels divided into vertical (ㅏ ㅑ ㅓ ㅕ ㅣ) and horizontal (ㅗ ㅛ ㅜ ㅠ ㅡ) shapes. Vowels never appear alone — they always combine with a consonant placeholder ㅇ to form a syllable block.',
   '[{"korean":"아 [a]","english":"bright open ''a'' as in father"},{"korean":"어 [eo]","english":"mid-back unrounded, like ''u'' in ''sun''"},{"korean":"으 [eu]","english":"high back unrounded — unique to Korean"}]',
   1),
  (l_id,
   'Bright vs. Dark Vowels (음양 모음)',
   'Bright: ㅏ ㅗ — Dark: ㅓ ㅜ ㅡ — Neutral: ㅣ',
   'Korean vowel harmony divides vowels into bright (양성) and dark (음성) classes. This affects verb ending selection: bright vowel stems take -아요, dark vowel stems take -어요.',
   '[{"korean":"가다 → 가아요 → 가요","english":"go (bright stem ㅏ → -아요)"},{"korean":"오다 → 오아요 → 와요","english":"come (bright stem ㅗ → -아요 → contracts)"},{"korean":"먹다 → 먹어요","english":"eat (dark stem ㅓ → -어요)"}]',
   2),
  (l_id,
   'Syllable Block Structure with Vowels',
   '(Initial consonant) + Vowel [+ Final consonant]',
   'A Korean syllable must have at least one consonant and one vowel. When a word starts with a vowel sound, the silent placeholder ㅇ is written as the initial consonant.',
   '[{"korean":"아","english":"ㅇ + ㅏ → [a]"},{"korean":"우유","english":"ㅇ+ㅜ / ㅇ+ㅠ → u-yu (milk)"},{"korean":"이야기","english":"i-ya-gi (story)"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘은 한국어 모음을 배울 거예요.', 'Oneureun hangugeo moeumeul baeul geoyeyo.', 'Today we will learn Korean vowels.', 1),
  (l_id, '학생', '모음이 몇 개예요?', 'Moeumi myeot gaeyeyo?', 'How many vowels are there?', 2),
  (l_id, '선생님', '기본 모음은 열 개예요. ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ예요.', 'Gibon moeumeun yeol gaeyeyo. a, ya, eo, yeo, o, yo, u, yu, eu, i-yeyo.', 'There are 10 basic vowels: a, ya, eo, yeo, o, yo, u, yu, eu, i.', 3),
  (l_id, '학생', '혼자 발음해도 돼요?', 'Honja bareumhaedo dwaeyo?', 'May I pronounce them alone?', 4),
  (l_id, '선생님', '네, 해 보세요. 아, 야, 어, 여, 오, 요, 우, 유, 으, 이.', 'Ne, hae boseyo. a, ya, eo, yeo, o, yo, u, yu, eu, i.', 'Yes, try it. a, ya, eo, yeo, o, yo, u, yu, eu, i.', 5),
  (l_id, '학생', '어렵지 않네요!', 'Eoryeopji anneyo!', 'It is not difficult!', 6),
  (l_id, '선생님', '맞아요. 연습하면 잘할 수 있어요.', 'Majayo. Yeonseuphamyeon jalhal su isseoyo.', 'That is right. If you practice, you can do it well.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which vowel is pronounced like the "a" in "father"?', '["ㅓ","ㅏ","ㅡ","ㅣ"]', 1, 'ㅏ is the bright open "a" sound, like the "a" in "father".', 1),
  (l_id, 'Which vowel is unique to Korean and has no English equivalent?', '["ㅗ","ㅜ","ㅡ","ㅛ"]', 2, 'ㅡ (eu) is a high back unrounded vowel that does not exist in English.', 2),
  (l_id, 'What is the rule for writing a vowel-initial syllable?', '["Write the vowel alone","Add ㅇ before the vowel","Add ㅎ before the vowel","Vowels cannot start a syllable"]', 1, 'When a syllable begins with a vowel sound, the silent placeholder ㅇ is written first.', 3),
  (l_id, 'Which pair are "bright" vowels used in vowel harmony?', '["ㅓ and ㅜ","ㅡ and ㅣ","ㅏ and ㅗ","ㅕ and ㅛ"]', 2, 'ㅏ and ㅗ are the bright (양성) vowels. They pair with -아요 verb endings.', 4),
  (l_id, '우유 means "milk." What vowels does it contain?', '["ㅜ and ㅠ","ㅗ and ㅛ","ㅡ and ㅣ","ㅏ and ㅑ"]', 0, '우유 = ㅜ (u) + ㅠ (yu). Both are back rounded vowels written horizontally.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에는 기본 모음이 열 개 있습니다. 모음은 혼자 쓸 수 없고 반드시 자음과 함께 음절을 이룹니다. 자음이 없을 때는 'ㅇ'을 받침 없는 자음 자리에 씁니다. 예를 들어 "아", "이", "오"는 모두 'ㅇ'과 모음이 합쳐진 음절입니다. 모음은 양성 모음(ㅏ, ㅗ)과 음성 모음(ㅓ, ㅜ, ㅡ)으로 나뉘며, 이 구분은 동사 활용에서 중요합니다.',
   'Korean has 10 basic vowels. Vowels cannot be written alone — they must form a syllable together with a consonant. When there is no consonant, ㅇ is written in the consonant position. For example, 아, 이, and 오 are all syllables combining ㅇ with a vowel. Vowels are divided into bright vowels (ㅏ, ㅗ) and dark vowels (ㅓ, ㅜ, ㅡ), and this distinction is important in verb conjugation.',
   1);
END $$;

-- ============================================================
-- LESSON 2: Korean Consonants (한국어 자음)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=2;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=2 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, 'ㄱ', 'g/k', 'consonant: voiced [g] initially, unaspirated [k] finally', 1),
  (l_id, 'ㄴ', 'n', 'consonant: nasal [n] — like "no"', 2),
  (l_id, 'ㄷ', 'd/t', 'consonant: voiced [d] initially, unreleased [t] finally', 3),
  (l_id, 'ㄹ', 'r/l', 'consonant: flap [ɾ] between vowels, lateral [l] at end of syllable', 4),
  (l_id, 'ㅁ', 'm', 'consonant: bilabial nasal [m]', 5),
  (l_id, 'ㅂ', 'b/p', 'consonant: voiced [b] initially, unreleased [p] finally', 6),
  (l_id, 'ㅅ', 's/t', 'consonant: [s] before vowels, [ɕ] before ㅣ, unreleased [t] finally', 7),
  (l_id, 'ㅇ', 'ng/-', 'consonant: silent [∅] initially, velar nasal [ŋ] finally', 8),
  (l_id, 'ㅈ', 'j', 'consonant: affricate [dʑ] — like "j" in "jump"', 9),
  (l_id, 'ㅊ', 'ch', 'aspirated affricate [tɕʰ] — like "ch" in "church"', 10),
  (l_id, 'ㅋ', 'k', 'aspirated velar stop [kʰ] — like "k" in "king"', 11),
  (l_id, 'ㅌ', 't', 'aspirated alveolar stop [tʰ] — like "t" in "top"', 12),
  (l_id, 'ㅍ', 'p', 'aspirated bilabial stop [pʰ] — like "p" in "pot"', 13),
  (l_id, 'ㅎ', 'h', 'consonant: fricative [h] — like "h" in "hat"', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Plain (Lax) Consonants',
   'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ',
   'The 9 basic plain consonants form the foundation of Korean. ㄱ, ㄷ, ㅂ, ㅅ, ㅈ are unaspirated and voiced between vowels. ㄴ, ㅁ, ㄹ, ㅇ are sonorants with consistent pronunciation.',
   '[{"korean":"고구마","english":"goguma — sweet potato (ㄱ between vowels is voiced)"},{"korean":"나무","english":"namu — tree (ㄴ is always nasal)"},{"korean":"바나나","english":"banana (ㅂ voiced between vowels)"}]',
   1),
  (l_id,
   'Aspirated Consonants',
   'ㅊ ㅋ ㅌ ㅍ + ㅎ',
   'Aspirated consonants are pronounced with a strong puff of air, like English "p/t/k" at the start of a stressed syllable. They are paired with plain counterparts: ㄱ→ㅋ, ㄷ→ㅌ, ㅂ→ㅍ, ㅈ→ㅊ.',
   '[{"korean":"카페","english":"kape — café (aspirated ㅋ)"},{"korean":"타다","english":"tada — to ride (aspirated ㅌ)"},{"korean":"파란색","english":"paransaek — blue color (aspirated ㅍ)"}]',
   2),
  (l_id,
   'ㄹ: Flap vs. Lateral',
   'Between vowels: [ɾ] flap / At syllable end or before ㄴ: [l] lateral',
   'ㄹ is one of the trickiest Korean consonants. Between vowels it sounds like a quick flap (similar to the "r" in "party" in American English). At the end of a syllable or before ㄴ it becomes a clear lateral [l].',
   '[{"korean":"라면 [ramen]","english":"ㄹ initial = light flap/r"},{"korean":"말 [mal]","english":"horse — ㄹ final = clear [l]"},{"korean":"설날 [seollal]","english":"New Year — ㄹ final then ㄴ→ㄹ assimilation: [seol-lal]"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘은 기본 자음을 배울 거예요. 자음이 몇 개예요?', 'Oneureun gibon jaumreul baeul geoyeyo. Jaumi myeot gaeyeyo?', 'Today we will learn basic consonants. How many consonants are there?', 1),
  (l_id, '학생', '열네 개요?', 'Yeolne gaeyo?', 'Fourteen?', 2),
  (l_id, '선생님', '맞아요! 기본 자음이 열네 개예요.', 'Majayo! Gibon jaumi yeolne gaeyeyo.', 'Correct! There are 14 basic consonants.', 3),
  (l_id, '학생', 'ㄹ 발음이 어려워요. r인가요, l인가요?', 'Rieul bareumi eoryeowoyo. r ingayo, l ingayo?', 'The ㄹ sound is difficult. Is it r or l?', 4),
  (l_id, '선생님', '둘 다예요. 모음 사이에서는 r처럼, 음절 끝에서는 l처럼 발음해요.', 'Dul daeyeyo. Moeum saieseoeneun r cheoreom, eumjeol kkeut-eseoeneun l cheoreom bareumhaeyo.', 'Both! Between vowels it sounds like r, at the end of a syllable like l.', 5),
  (l_id, '학생', '예를 들어 주세요.', 'Yereul deureo juseyo.', 'Please give an example.', 6),
  (l_id, '선생님', '"라면"에서 ㄹ은 r이고, "말"에서 ㄹ은 l이에요.', '"Ramyeon"-eseo reu-reun r-igo, "mal"-eseo reu-reun l-i-eyo.', 'In "라면" (ramen) the ㄹ is r, and in "말" (horse) the ㄹ is l.', 7),
  (l_id, '학생', '알겠어요!', 'Algesseoyo!', 'I understand!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which consonant is silent when in the initial position of a syllable?', '["ㅎ","ㅇ","ㄴ","ㅁ"]', 1, 'ㅇ acts as a silent placeholder when a syllable begins with a vowel sound.', 1),
  (l_id, 'How is ㄹ pronounced between two vowels?', '["Like English l","Like a nasal n","Like a quick flap r","Like a hard g"]', 2, 'Between vowels, ㄹ is pronounced as a flap [ɾ], similar to the American English "r" in "party".', 2),
  (l_id, 'Which consonant is the aspirated counterpart of ㄱ?', '["ㄲ","ㅎ","ㅋ","ㄷ"]', 2, 'ㅋ is the aspirated version of ㄱ — it is pronounced with a strong puff of air.', 3),
  (l_id, 'In the word 나무 (tree), which consonant appears twice?', '["ㄴ","ㅁ","ㄹ","ㅂ"]', 1, '나무 = ㄴ+ㅏ / ㅁ+ㅜ. ㅁ appears as the initial consonant of 무.', 4),
  (l_id, 'How many basic consonants does Korean have?', '["10","12","14","16"]', 2, 'Korean has 14 basic consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 자음은 기본 자음 열네 개로 이루어져 있습니다. 자음은 홀로 발음할 수 없고 반드시 모음과 결합해야 합니다. 자음은 크게 평음, 격음(거센소리), 경음(된소리)으로 나뉩니다. 예를 들어 ㄱ은 평음, ㅋ은 격음, ㄲ은 경음입니다. ㄹ은 특이한 자음으로, 위치에 따라 발음이 달라집니다. 모음 사이에서는 영어의 r과 비슷하게 발음되고, 음절 말에서는 l처럼 발음됩니다.',
   'Korean consonants consist of 14 basic consonants. Consonants cannot be pronounced alone — they must combine with a vowel. Consonants are broadly divided into plain, aspirated (fortis breath), and tensed (reinforced) sounds. For example, ㄱ is plain, ㅋ is aspirated, and ㄲ is tensed. ㄹ is a unique consonant whose pronunciation varies by position: between vowels it is pronounced similarly to English r, and at the end of a syllable it is pronounced like l.',
   1);
END $$;

-- ============================================================
-- LESSON 3: Syllable Blocks (음절 블록)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=3;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=3 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '가', 'ga', 'ㄱ + ㅏ — go (particle/verb stem)', 1),
  (l_id, '나', 'na', 'ㄴ + ㅏ — I/me (informal)', 2),
  (l_id, '다', 'da', 'ㄷ + ㅏ — all; verb-ending particle', 3),
  (l_id, '마', 'ma', 'ㅁ + ㅏ — (syllable in words like 마음 heart)', 4),
  (l_id, '바', 'ba', 'ㅂ + ㅏ — (syllable in words like 바다 sea)', 5),
  (l_id, '사', 'sa', 'ㅅ + ㅏ — (syllable in words like 사람 person)', 6),
  (l_id, '자', 'ja', 'ㅈ + ㅏ — (syllable in words like 자다 to sleep)', 7),
  (l_id, '하', 'ha', 'ㅎ + ㅏ — do (in 하다 verbs)', 8),
  (l_id, '기', 'gi', 'ㄱ + ㅣ — (syllable in words like 기차 train)', 9),
  (l_id, '모', 'mo', 'ㅁ + ㅗ — (syllable in words like 모자 hat)', 10),
  (l_id, '부', 'bu', 'ㅂ + ㅜ — (syllable in words like 부모 parents)', 11),
  (l_id, '리', 'ri', 'ㄹ + ㅣ — (syllable in words like 리모컨 remote control)', 12),
  (l_id, '음절', 'eumjeol', 'syllable', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Type 1: Consonant + Vertical Vowel',
   '[C] + [vertical vowel: ㅏㅑㅓㅕㅣ]',
   'When the vowel is vertical (written to the right), the consonant is placed to its left. This forms a simple left-right syllable block.',
   '[{"korean":"가 = ㄱ+ㅏ","english":"[ga]"},{"korean":"나 = ㄴ+ㅏ","english":"[na]"},{"korean":"비 = ㅂ+ㅣ","english":"[bi] — rain"}]',
   1),
  (l_id,
   'Type 2: Consonant + Horizontal Vowel',
   '[C] + [horizontal vowel: ㅗㅛㅜㅠㅡ]',
   'When the vowel is horizontal (written below), the consonant sits on top and the vowel extends beneath it.',
   '[{"korean":"고 = ㄱ+ㅗ","english":"[go] — fish"},{"korean":"무 = ㅁ+ㅜ","english":"[mu] — radish"},{"korean":"으 = ㅇ+ㅡ","english":"[eu] — filler sound"}]',
   2),
  (l_id,
   'Type 3: Consonant + Vowel + Final Consonant (받침)',
   '[Initial C] + [Vowel] + [Final C]',
   'A three-part syllable adds a final consonant (받침) beneath the vowel. This is the most common syllable type in Korean.',
   '[{"korean":"밥 = ㅂ+ㅏ+ㅂ","english":"[bap] — rice/meal"},{"korean":"물 = ㅁ+ㅜ+ㄹ","english":"[mul] — water"},{"korean":"한 = ㅎ+ㅏ+ㄴ","english":"[han] — one/great"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '음절 블록을 만드는 법을 배울 거예요.', 'Eumjeol beulogeul mandeuneun beobeul baeul geoyeyo.', 'We will learn how to make syllable blocks.', 1),
  (l_id, '학생', '음절이 뭐예요?', 'Eumjeori mwoyeyo?', 'What is a syllable?', 2),
  (l_id, '선생님', '한 번에 소리 나는 단위예요. 예를 들어 "한국어"는 세 음절이에요: 한, 국, 어.', 'Han beon-e sori naneun danwi-yeyo. Yereul deureo "hangugeo"neun se eumjeori-eyo: han, guk, eo.', 'It is the unit pronounced in one beat. For example, "한국어" has three syllables: han, guk, eo.', 3),
  (l_id, '학생', '"가"는 어떻게 써요?', '"Ga"neun eotteoke sseoyo?', 'How do you write "ga"?', 4),
  (l_id, '선생님', 'ㄱ을 왼쪽에, ㅏ를 오른쪽에 써요. 이렇게: 가.', 'Gieureul oenjjoge, a-reul oreunjjoge sseoyo. Ireoke: ga.', 'Write ㄱ on the left, ㅏ on the right. Like this: 가.', 5),
  (l_id, '학생', '"고"는요?', '"Go"neunyo?', 'What about "go"?', 6),
  (l_id, '선생님', 'ㄱ을 위에, ㅗ를 아래에 써요. 이렇게: 고.', 'Gieureul wie, o-reul araee sseoyo. Ireoke: go.', 'Write ㄱ on top, ㅗ below. Like this: 고.', 7),
  (l_id, '학생', '이제 이해했어요!', 'Ije ihaetaesseoyo!', 'Now I understand!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which syllable block is formed by ㅁ + ㅜ?', '["마","모","무","미"]', 2, 'ㅜ is a horizontal vowel, so ㅁ sits on top: 무 [mu].', 1),
  (l_id, 'Which syllable block is formed by ㅂ + ㅏ?', '["바","보","부","비"]', 0, 'ㅏ is a vertical vowel, so ㅂ goes on the left: 바 [ba].', 2),
  (l_id, 'How many parts does a three-part syllable have?', '["1","2","3","4"]', 2, 'A three-part syllable has: initial consonant + vowel + final consonant (받침).', 3),
  (l_id, '밥 (rice) is composed of which elements?', '["ㅂ+ㅏ+ㅂ","ㅁ+ㅏ+ㅂ","ㅂ+ㅓ+ㅂ","ㅂ+ㅏ+ㄴ"]', 0, '밥 = ㅂ (initial) + ㅏ (vowel) + ㅂ (batchim/final consonant).', 4),
  (l_id, 'What happens when a syllable begins with a vowel sound?', '["The vowel is written alone","ㅎ is added as a placeholder","ㅇ is written as the initial consonant","The syllable cannot exist"]', 2, 'ㅇ is the silent placeholder consonant used when a syllable starts with a vowel sound.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한글은 자음과 모음을 합쳐 음절 블록을 만듭니다. 음절은 최소 자음 하나와 모음 하나로 이루어집니다. 모음이 세로형이면 자음이 왼쪽에 오고, 모음이 가로형이면 자음이 위에 옵니다. 받침이 있으면 자음과 모음 아래에 씁니다. 예를 들어 "한국"은 두 음절인데, "한"은 ㅎ+ㅏ+ㄴ이고 "국"은 ㄱ+ㅜ+ㄱ입니다. 이 구조를 이해하면 모르는 단어도 읽을 수 있습니다.',
   'Hangul combines consonants and vowels to form syllable blocks. A syllable consists of at least one consonant and one vowel. If the vowel is vertical, the consonant is placed on the left; if the vowel is horizontal, the consonant is placed on top. When there is a final consonant (batchim), it is written beneath the initial consonant and vowel. For example, "한국" consists of two syllables: "한" is ㅎ+ㅏ+ㄴ and "국" is ㄱ+ㅜ+ㄱ. Understanding this structure allows you to read even unfamiliar words.',
   1);
END $$;

-- ============================================================
-- LESSON 4: Final Consonants / Batchim (받침)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=4;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=4 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '받침', 'batchim', 'final consonant in a syllable block', 1),
  (l_id, '밥', 'bap', 'rice / a meal (batchim: ㅂ)', 2),
  (l_id, '물', 'mul', 'water (batchim: ㄹ)', 3),
  (l_id, '산', 'san', 'mountain (batchim: ㄴ)', 4),
  (l_id, '집', 'jip', 'house / home (batchim: ㅂ)', 5),
  (l_id, '책', 'chaek', 'book (batchim: ㄱ)', 6),
  (l_id, '문', 'mun', 'door (batchim: ㄴ)', 7),
  (l_id, '봄', 'bom', 'spring (season) (batchim: ㅁ)', 8),
  (l_id, '말', 'mal', 'horse; speech/language (batchim: ㄹ)', 9),
  (l_id, '낮', 'nat', 'daytime (batchim: ㅅ — pronounced [t])', 10),
  (l_id, '영', 'yeong', 'zero; spirit (batchim: ㅇ — [ŋ])', 11),
  (l_id, '닭', 'dak', 'chicken (double batchim ㄺ — only ㄱ is pronounced)', 12),
  (l_id, '흙', 'heuk', 'soil/earth (double batchim ㄱ — ㄱ pronounced)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'The 7 Batchim Sound Classes',
   'ㄱ-class [k̚], ㄴ-class [n], ㄷ-class [t̚], ㄹ-class [l], ㅁ-class [m], ㅂ-class [p̚], ㅇ-class [ŋ]',
   'Although many consonants can appear as batchim, they are all pronounced as one of only 7 sounds. For example, ㄷ, ㅅ, ㅈ, ㅊ, ㅌ, ㅎ are all pronounced [t̚] in final position.',
   '[{"korean":"낮[낟], 낫[낟], 났[낟]","english":"All pronounced [nat̚] — daytime, sickle, was born"},{"korean":"부엌[부억]","english":"kitchen — ㅋ batchim → [k̚]"},{"korean":"잎[입]","english":"leaf — ㅍ batchim → [p̚]"}]',
   1),
  (l_id,
   'Resyllabification (연음, Liaison)',
   'Batchim + next syllable starting with ㅇ → batchim moves to next syllable',
   'When a batchim is followed by a syllable beginning with the silent ㅇ, the batchim shifts to become the initial consonant of that next syllable. This is the most important pronunciation rule for batchim.',
   '[{"korean":"밥이 → [바비]","english":"bap-i → [ba-bi] — rice (subject)"},{"korean":"집에 → [지베]","english":"jip-e → [ji-be] — at home"},{"korean":"책을 → [채글]","english":"chaek-eul → [chae-geul] — book (object)"}]',
   2),
  (l_id,
   'Double Batchim (겹받침)',
   'Two consonants in final position — only one is pronounced',
   'Some syllables have two consonants in the batchim position. The pronunciation rules determine which one sounds. Generally the first is pronounced, but some clusters (ㄺ, ㄻ, ㄿ) pronounce the second.',
   '[{"korean":"닭 [닥]","english":"chicken — ㄺ: ㄱ is pronounced"},{"korean":"읽다 [익따]","english":"to read — ㄺ: ㄱ is pronounced"},{"korean":"없다 [업따]","english":"to not exist — ㅄ: ㅂ is pronounced"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘은 받침을 배울 거예요. 받침이 뭔지 알아요?', 'Oneureun batchimeul baeul geoyeyo. Batchimi mwonji arayo?', 'Today we will learn batchim. Do you know what batchim is?', 1),
  (l_id, '학생', '음절 아래에 오는 자음이죠?', 'Eumjeol araee oneun jaumijiyo?', 'It is the consonant that comes at the bottom of a syllable, right?', 2),
  (l_id, '선생님', '맞아요! 예를 들어 "밥"에서 맨 아래 ㅂ이 받침이에요.', 'Majayo! Yereul deureo "bap"-eseo maen ara bi-ga batchimi-eyo.', 'Correct! For example, in "밥" the ㅂ at the bottom is the batchim.', 3),
  (l_id, '학생', '받침이 있으면 발음이 어떻게 바뀌어요?', 'Batchimi isseumyeon bareumi eotteoke bakkwieoyo?', 'How does the pronunciation change when there is a batchim?', 4),
  (l_id, '선생님', '받침은 일곱 가지 소리 중 하나로 발음돼요. 예를 들어 ㅅ, ㅆ, ㅈ은 모두 받침에서 [ㄷ]으로 발음해요.', 'Batchimeun ilgop gaji sori jung hana-ro bareumwaeyo. Yereul deureo s, ss, j-eun modu batchim-eseo [t]-euro bareumhaeyo.', 'Batchim is pronounced as one of seven sounds. For example, ㅅ, ㅆ, and ㅈ are all pronounced [t] in final position.', 5),
  (l_id, '학생', '그럼 "낮"과 "낫"이 같은 발음이에요?', 'Geureom "nat"gwa "nas"-i gateun bareumi-eyo?', 'So "낮" and "낫" are pronounced the same?', 6),
  (l_id, '선생님', '홀로 발음할 때는 네, 둘 다 [낟]이에요. 하지만 뒤에 모음이 오면 달라요.', 'Hollo bareumhal ttaeneun ne, dul da [nat]-i-eyo. Hajiman dwie moeumi omyeon dallayo.', 'When pronounced alone, yes, both are [nat]. But when a vowel follows, they differ.', 7),
  (l_id, '학생', '정말 흥미롭네요!', 'Jeongmal heungmiromneyo!', 'That is really interesting!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How many final consonant sound classes are there in Korean?', '["5","7","9","14"]', 1, 'All batchim consonants reduce to one of 7 sounds: [k̚] [n] [t̚] [l] [m] [p̚] [ŋ].', 1),
  (l_id, 'How is the batchim in "낮" (daytime) pronounced?', '["[s]","[j]","[t]","[n]"]', 2, 'ㅅ in final position is pronounced [t̚], so 낮 → [낟].', 2),
  (l_id, 'In "밥이", how is the batchim ㅂ pronounced?', '["[p] stays on 밥","ㅂ moves to 이 → [바비]","ㅂ is silent","ㅂ becomes ㅁ"]', 1, 'Liaison (연음): batchim ㅂ shifts to the next syllable starting with ㅇ → 바비 [ba-bi].', 3),
  (l_id, 'In the double batchim word 닭 (chicken), which consonant is pronounced?', '["ㄹ","ㄱ","Both","Neither"]', 1, '닭 has the double batchim ㄺ. The ㄱ is pronounced: 닭 → [닥].', 4),
  (l_id, 'Which of these words does NOT have a batchim?', '["산","가","물","밥"]', 1, '가 = ㄱ + ㅏ, with no final consonant. It has no batchim.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '받침은 음절 블록의 아래에 오는 마지막 자음입니다. 한국어에는 받침으로 쓸 수 있는 자음이 많지만, 실제로 발음될 때는 일곱 가지 소리 중 하나로만 납니다. 예를 들어 ㄷ, ㅅ, ㅈ, ㅊ, ㅌ, ㅎ은 받침 위치에서 모두 [ㄷ]으로 발음됩니다. 받침 뒤에 모음으로 시작하는 음절이 오면 받침이 다음 음절의 초성으로 옮겨 발음됩니다. 이를 연음이라고 합니다. 겹받침은 두 자음이 받침 자리에 오는 경우로, 규칙에 따라 한 자음만 발음됩니다.',
   'Batchim is the final consonant at the bottom of a syllable block. Although many consonants can be written as batchim in Korean, when actually pronounced they reduce to only one of seven sounds. For example, ㄷ, ㅅ, ㅈ, ㅊ, ㅌ, and ㅎ are all pronounced [t] in the batchim position. When a syllable beginning with a vowel follows a batchim, the batchim moves to become the initial consonant of the next syllable — this is called liaison (연음). Double batchim occurs when two consonants occupy the final consonant position; according to the rules, only one consonant is pronounced.',
   1);
END $$;

-- ============================================================
-- LESSON 5: Compound Vowels (이중 모음)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=5;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=5 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, 'ㅐ', 'ae', 'compound vowel: ㅏ+ㅣ → [ɛ] like "e" in "bed"', 1),
  (l_id, 'ㅔ', 'e', 'compound vowel: ㅓ+ㅣ → [e] (now identical to ㅐ in modern Korean)', 2),
  (l_id, 'ㅒ', 'yae', 'compound vowel: ㅑ+ㅣ → [jɛ]', 3),
  (l_id, 'ㅖ', 'ye', 'compound vowel: ㅕ+ㅣ → [je] as in "yes"', 4),
  (l_id, 'ㅘ', 'wa', 'compound vowel: ㅗ+ㅏ → [wa] as in "water"', 5),
  (l_id, 'ㅙ', 'wae', 'compound vowel: ㅗ+ㅐ → [wɛ]', 6),
  (l_id, 'ㅚ', 'oe', 'compound vowel: ㅗ+ㅣ → [we] (modern pronunciation)', 7),
  (l_id, 'ㅝ', 'wo/eo', 'compound vowel: ㅜ+ㅓ → [wʌ]', 8),
  (l_id, 'ㅞ', 'we', 'compound vowel: ㅜ+ㅔ → [we]', 9),
  (l_id, 'ㅟ', 'wi', 'compound vowel: ㅜ+ㅣ → [wi]', 10),
  (l_id, 'ㅢ', 'ui', 'compound vowel: ㅡ+ㅣ → [ɰi]; varies by position', 11),
  (l_id, '왜', 'wae', 'why (uses ㅘ+ㅐ = ㅙ)', 12),
  (l_id, '외국', 'oeguk', 'foreign country (uses ㅚ)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'ㅐ and ㅔ — Distinguishing Two "E" Sounds',
   'ㅐ [ɛ] derived from ㅏ+ㅣ; ㅔ [e] derived from ㅓ+ㅣ',
   'Historically distinct, ㅐ and ㅔ have merged in modern Seoul Korean and are both pronounced [e]. Despite this, their spelling must be memorized individually. Context and word-level spelling are the only guides.',
   '[{"korean":"개 [개]","english":"dog — uses ㅐ"},{"korean":"게 [게]","english":"crab — uses ㅔ"},{"korean":"내 [내]","english":"my (informal) — uses ㅐ"}]',
   1),
  (l_id,
   'W-Glide Compound Vowels',
   'ㅗ+ㅏ→ㅘ, ㅗ+ㅐ→ㅙ, ㅗ+ㅣ→ㅚ / ㅜ+ㅓ→ㅝ, ㅜ+ㅔ→ㅞ, ㅜ+ㅣ→ㅟ',
   'These compound vowels all begin with a [w] glide sound. They are formed by combining ㅗ or ㅜ with another vowel. ㅙ, ㅚ, and ㅞ are all pronounced identically as [we] in modern Korean.',
   '[{"korean":"봐요 [봐요]","english":"to see (present polite) — ㅘ"},{"korean":"웨일스","english":"Wales — ㅞ"},{"korean":"위험","english":"danger — ㅟ"}]',
   2),
  (l_id,
   'ㅢ — Three Pronunciations',
   'Initial position: [ɰi] / non-initial position: [i] / possessive 의: [e]',
   'ㅢ has three distinct pronunciations depending on its grammatical position. In the initial syllable of a word it is [ɰi] (a glide from ㅡ to ㅣ). In non-initial syllables it simplifies to [i]. As the possessive particle 의 it is pronounced [e].',
   '[{"korean":"의사 [의사]","english":"[ɰisa] — doctor (initial syllable)"},{"korean":"회의 [회이]","english":"[hweɪ] — meeting (non-initial → [i])"},{"korean":"나의 친구 [나에]","english":"[na-e] — my friend (possessive 의→[e])"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '학생', '선생님, ㅐ와 ㅔ 발음이 같아요?', 'Seonsaengnim, ae-wa e bareumi gatayo?', 'Teacher, are ㅐ and ㅔ pronounced the same?', 1),
  (l_id, '선생님', '현대 한국어에서는 거의 같아요. 하지만 철자는 달리 써야 해요.', 'Hyeondae hangugeoeseoeneun geoui gatayo. Hajiman cheoljaneun dalli sseoaya haeyo.', 'In modern Korean they are nearly the same. But the spelling must be written differently.', 2),
  (l_id, '학생', '"개"와 "게"가 같은 발음이에요?', '"Gae"-wa "ge"-ga gateun bareumi-eyo?', 'Are "개" (dog) and "게" (crab) pronounced the same?', 3),
  (l_id, '선생님', '네, 둘 다 [게]로 발음해요. 그래서 문맥으로 구분해야 해요.', 'Ne, dul da [ge]-ro bareumhaeyo. Geuraeseo munmaengeullo gubunhaeya haeyo.', 'Yes, both are pronounced [ge]. So you must use context to distinguish them.', 4),
  (l_id, '학생', 'ㅢ는 왜 발음이 세 가지예요?', 'Ui-neun wae bareumi se gajiyeyo?', 'Why does ㅢ have three pronunciations?', 5),
  (l_id, '선생님', '역사적으로 변한 거예요. 단어 처음에는 [의], 중간에는 [이], 조사 "의"는 [에]로 발음해요.', 'Yeoksajeok-euro byeonhan geoyeyo. Daneo cheoeume-neun [ui], jungane-neun [i], josa "ui"-neun [e]-ro bareumhaeyo.', 'It changed historically. At the start of a word: [ui], in the middle: [i], as the particle 의: [e].', 6),
  (l_id, '학생', '예를 들어 주세요.', 'Yereul deureo juseyo.', 'Please give an example.', 7),
  (l_id, '선생님', '"의사"는 [의사], "회의"는 [회이], "나의"는 [나에]로 발음해요.', '"Uisa"-neun [uisa], "hoeui"-neun [hoei], "naui"-neun [nae]-ro bareumhaeyo.', '"의사" (doctor) is [uisa], "회의" (meeting) is [hoei], "나의" (my) is [nae].', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which two compound vowels are pronounced identically in modern Korean?', '["ㅘ and ㅝ","ㅐ and ㅔ","ㅒ and ㅠ","ㅚ and ㅛ"]', 1, 'ㅐ and ㅔ have merged in modern Seoul Korean and both sound like [e].', 1),
  (l_id, 'What sound does ㅘ represent?', '["[wa]","[wo]","[wi]","[wae]"]', 0, 'ㅘ = ㅗ + ㅏ = [wa], like "wa" in "water".', 2),
  (l_id, 'How is the possessive particle 의 pronounced?', '["[ui]","[i]","[e]","[eo]"]', 2, 'The particle 의 is always pronounced [e] in natural speech.', 3),
  (l_id, 'The word 왜 (why) uses which compound vowel?', '["ㅘ","ㅙ","ㅚ","ㅝ"]', 1, '왜 = ㅇ + ㅙ (ㅗ+ㅐ). The ㅙ represents [wɛ].', 4),
  (l_id, 'In 회의, how is ㅢ in the second syllable pronounced?', '["[ui]","[i]","[e]","[wi]"]', 1, 'In non-initial syllables, ㅢ simplifies to [i]. 회의 → [회이].', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에는 기본 모음 외에 이중 모음이 열한 개 있습니다. 이중 모음은 두 모음을 합쳐서 만든 것으로, 주로 반모음 [w]나 [j]가 포함됩니다. 예를 들어 ㅘ는 ㅗ와 ㅏ가 합쳐진 것으로 [와]라고 발음합니다. 현대 한국어에서는 ㅐ와 ㅔ, 그리고 ㅙ, ㅚ, ㅞ가 모두 비슷하게 발음되어 구별이 어렵습니다. ㅢ는 특별한 모음으로 위치와 문법 기능에 따라 [의], [이], [에]로 달리 발음됩니다.',
   'In addition to the basic vowels, Korean has 11 compound vowels. Compound vowels are created by combining two vowels and typically include a semi-vowel [w] or [j]. For example, ㅘ is formed by combining ㅗ and ㅏ and is pronounced [wa]. In modern Korean, ㅐ and ㅔ, as well as ㅙ, ㅚ, and ㅞ, are all pronounced similarly, making them difficult to distinguish by sound alone. ㅢ is a special vowel that is pronounced differently — [ui], [i], or [e] — depending on its position and grammatical function.',
   1);
END $$;

-- ============================================================
-- LESSON 6: Aspirated Consonants (거센소리)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=6;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=6 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, 'ㅋ', 'k', 'aspirated velar stop [kʰ] — pair of ㄱ', 1),
  (l_id, 'ㅌ', 't', 'aspirated alveolar stop [tʰ] — pair of ㄷ', 2),
  (l_id, 'ㅍ', 'p', 'aspirated bilabial stop [pʰ] — pair of ㅂ', 3),
  (l_id, 'ㅊ', 'ch', 'aspirated affricate [tɕʰ] — pair of ㅈ', 4),
  (l_id, '카페', 'kape', 'café (aspirated ㅋ)', 5),
  (l_id, '타다', 'tada', 'to ride / to burn (aspirated ㅌ)', 6),
  (l_id, '파란색', 'paransaek', 'blue color (aspirated ㅍ)', 7),
  (l_id, '천천히', 'cheoncheonhi', 'slowly (aspirated ㅊ)', 8),
  (l_id, '큰', 'keun', 'big/large (aspirated ㅋ)', 9),
  (l_id, '특별하다', 'teukbyeolhada', 'to be special (aspirated ㅌ)', 10),
  (l_id, '편의점', 'pyeonuijeom', 'convenience store (aspirated ㅍ)', 11),
  (l_id, '최고', 'choego', 'the best (aspirated ㅊ)', 12),
  (l_id, '거센소리', 'geosensori', 'aspirated sounds (literally "strong sounds")', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'What Makes a Consonant Aspirated',
   'Plain + ㅎ aspiration = Aspirated: ㄱ+ㅎ→ㅋ, ㄷ+ㅎ→ㅌ, ㅂ+ㅎ→ㅍ, ㅈ+ㅎ→ㅊ',
   'Aspirated consonants are plain consonants accompanied by a strong burst of air (aspiration). In Korean, if ㅎ meets certain plain consonants (before or after), they merge into an aspirated sound. Test with a piece of paper: it should flutter on ㅋ, ㅌ, ㅍ, ㅊ but barely on ㄱ, ㄷ, ㅂ, ㅈ.',
   '[{"korean":"국화 → [구콰]","english":"chrysanthemum — ㄱ+ㅎ merges to ㅋ across syllable boundary"},{"korean":"입학 → [이팍]","english":"entering school — ㅂ+ㅎ → ㅍ"},{"korean":"좋다 → [조타]","english":"to be good — ㅎ batchim + ㄷ → ㅌ"}]',
   1),
  (l_id,
   'ㅎ Aspiration Rule',
   'ㅎ (batchim or initial) + plain consonant → aspirated consonant',
   'ㅎ has a special property: it combines with adjacent plain consonants to produce their aspirated equivalents. This happens both when ㅎ is in the batchim position followed by a plain-initial syllable, and when a consonant-batchim syllable is followed by ㅎ-initial syllable.',
   '[{"korean":"놓다 → [노타]","english":"to place — ㅎ batchim + ㄷ → ㅌ"},{"korean":"많고 → [만코]","english":"many and... — ㄶ: ㅎ + ㄱ → ㅋ"},{"korean":"각하 → [가카]","english":"Your Excellency — ㄱ batchim + ㅎ → ㅋ"}]',
   2),
  (l_id,
   'Minimal Pairs: Plain vs. Aspirated',
   'ㄱ vs ㅋ, ㄷ vs ㅌ, ㅂ vs ㅍ, ㅈ vs ㅊ',
   'Plain and aspirated consonants form minimal pairs — changing one for the other changes the meaning. Mastering the distinction is essential for both speaking and listening comprehension.',
   '[{"korean":"가다 vs 카다","english":"to go (가다) vs. to be resentful (카다) — ㄱ vs ㅋ"},{"korean":"달 vs 탈","english":"moon vs. mask/escape — ㄷ vs ㅌ"},{"korean":"발 vs 팔","english":"foot vs. arm — ㅂ vs ㅍ"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘 거센소리를 연습해 봅시다. 손을 입 앞에 가져다 대세요.', 'Oneul geosensori-reul yeonseupae bopsida. Soneul ip ape gajyeoda daeseyo.', 'Let us practice aspirated sounds today. Put your hand in front of your mouth.', 1),
  (l_id, '학생', '왜요?', 'Waeyo?', 'Why?', 2),
  (l_id, '선생님', 'ㅋ, ㅌ, ㅍ, ㅊ를 발음할 때 바람이 느껴져야 해요.', 'K, t, p, ch-reul bareumhal ttae barami neukkyeojyeonya haeyo.', 'When you pronounce ㅋ, ㅌ, ㅍ, ㅊ you should feel a puff of air.', 3),
  (l_id, '학생', '"카페"라고 말해 볼게요.', '"Kape"-rago malae bolgeyo.', 'I will try saying "카페".', 4),
  (l_id, '선생님', '잘했어요! 바람이 느껴졌죠? "가게"와 비교해 보세요.', 'Jalhaesseoyo! Barami neukkyeojeotjjiyo? "Gage"-wa bigyo hae boseyo.', 'Well done! You felt the air, right? Compare it with "가게" (store).', 5),
  (l_id, '학생', '"가게"는 바람이 덜 나오네요.', '"Gage"-neun barami deol naoneyo.', '"가게" has less air coming out.', 6),
  (l_id, '선생님', '바로 그거예요! 그 차이가 ㄱ과 ㅋ의 차이예요.', 'Baro geugeoyeyo! Geu chai-ga g-gwa k-eui chaiyeyo.', 'Exactly! That difference is the difference between ㄱ and ㅋ.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which consonant is the aspirated version of ㅂ?', '["ㄲ","ㅍ","ㅌ","ㅃ"]', 1, 'ㅍ [pʰ] is the aspirated counterpart of ㅂ [b/p].', 1),
  (l_id, 'In 좋다 (to be good), ㅎ combines with the following ㄷ to produce:', '["ㄸ","ㅌ","ㄷ","ㅅ"]', 1, 'ㅎ batchim + ㄷ → ㅌ. 좋다 is pronounced [조타].', 2),
  (l_id, 'Which word uses an aspirated consonant?', '["바다 (sea)","가다 (go)","카페 (café)","사다 (buy)"]', 2, '카페 begins with ㅋ, which is an aspirated consonant.', 3),
  (l_id, 'What is the minimal pair distinction between 발 (foot) and 팔 (arm)?', '["ㅂ vs ㅍ","ㄱ vs ㅋ","ㄷ vs ㅌ","ㅈ vs ㅊ"]', 0, '발 uses plain ㅂ, 팔 uses aspirated ㅍ — a minimal pair.', 4),
  (l_id, 'When ㄱ batchim meets ㅎ in the next syllable, what sound results?', '["ㄱ","ㅎ","ㅋ","ㄲ"]', 2, 'ㄱ + ㅎ → ㅋ. Example: 각하 → [가카].', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '거센소리(격음)는 ㅋ, ㅌ, ㅍ, ㅊ 네 가지입니다. 이 소리들은 각각 ㄱ, ㄷ, ㅂ, ㅈ의 거센 버전으로, 발음할 때 공기가 많이 나옵니다. ㅎ이 자음과 만나면 거센소리가 만들어지는 경우가 많습니다. 예를 들어 "좋다"는 ㅎ 받침과 ㄷ이 만나 [조타]로 발음됩니다. 또한 "국화"는 ㄱ 받침과 ㅎ이 만나 [구콰]로 발음됩니다. 평음과 격음의 차이를 잘 구별해야 의미 전달에 혼선이 없습니다.',
   'The aspirated sounds (격음) are the four consonants ㅋ, ㅌ, ㅍ, and ㅊ. These sounds are the aspirated versions of ㄱ, ㄷ, ㅂ, and ㅈ respectively, and when pronounced a strong puff of air is released. When ㅎ meets a consonant, an aspirated sound is often produced. For example, "좋다" has the ㅎ batchim meeting ㄷ, producing the sound [조타]. Similarly, "국화" has the ㄱ batchim meeting ㅎ, giving [구콰]. Clearly distinguishing plain consonants from aspirated ones is essential for accurate communication.',
   1);
END $$;

-- ============================================================
-- LESSON 7: Tensed Consonants (된소리)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=7;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=7 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, 'ㄲ', 'kk', 'tensed velar stop [k͈] — pair of ㄱ', 1),
  (l_id, 'ㄸ', 'tt', 'tensed alveolar stop [t͈] — pair of ㄷ', 2),
  (l_id, 'ㅃ', 'pp', 'tensed bilabial stop [p͈] — pair of ㅂ', 3),
  (l_id, 'ㅆ', 'ss', 'tensed alveolar fricative [s͈] — pair of ㅅ', 4),
  (l_id, 'ㅉ', 'jj', 'tensed affricate [t͈ɕ] — pair of ㅈ', 5),
  (l_id, '꽃', 'kkot', 'flower (tensed ㄲ)', 6),
  (l_id, '땀', 'ttam', 'sweat (tensed ㄸ)', 7),
  (l_id, '빵', 'ppang', 'bread (tensed ㅃ)', 8),
  (l_id, '씩', 'ssik', 'each/apiece (tensed ㅆ)', 9),
  (l_id, '짜다', 'jjada', 'to be salty / to be stingy (tensed ㅉ)', 10),
  (l_id, '아까', 'akka', 'a moment ago (tensed ㄲ mid-word)', 11),
  (l_id, '있다', 'itda', 'to exist/have (ㅆ batchim)', 12),
  (l_id, '된소리', 'doenssori', 'tensed/reinforced sounds (literally "hardened sounds")', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'How to Produce Tensed Consonants',
   'Glottal tension + no aspiration = tensed sound',
   'Tensed consonants are produced with increased muscular tension in the throat and no puff of air. They sound like a harder, crisper version of the plain consonant. To practice: say the plain consonant, then tighten your throat and suppress the aspiration. The resulting sound feels "squeezed."',
   '[{"korean":"딸 [딸]","english":"daughter — tensed ㄸ, no aspiration"},{"korean":"빵 [빵]","english":"bread — tensed ㅃ, like a muffled pop"},{"korean":"짝 [짝]","english":"pair/mate — tensed ㅉ"}]',
   1),
  (l_id,
   'When Does Tensing (경음화) Occur?',
   'After obstruent batchim + plain initial / after certain suffixes',
   'Plain consonants become tensed in predictable environments. The most important rule: after an unreleased obstruent batchim (ㄱ, ㄷ, ㅂ classes), the following plain consonant becomes tensed.',
   '[{"korean":"학교 → [학꾜]","english":"school — ㄱ batchim + ㄱ → ㄲ"},{"korean":"입장 → [입짱]","english":"entrance — ㅂ batchim + ㅈ → ㅉ"},{"korean":"먹다 → [먹따]","english":"to eat — ㄱ batchim + ㄷ → ㄸ"}]',
   2),
  (l_id,
   'Three-Way Contrast: Plain / Aspirated / Tensed',
   'ㄱ [g/k] vs ㅋ [kʰ] vs ㄲ [k͈]',
   'Korean uniquely has a three-way distinction for stops and affricates. This triple contrast does not exist in English. Mastering it is one of the hallmarks of fluency.',
   '[{"korean":"달 / 탈 / 딸","english":"moon / mask / daughter — ㄷ / ㅌ / ㄸ"},{"korean":"발 / 팔 / 빨","english":"foot / arm / to suck — ㅂ / ㅍ / ㅃ"},{"korean":"자 / 차 / 짜","english":"ruler / tea-car / salty — ㅈ / ㅊ / ㅉ"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '학생', '된소리가 정말 어려워요. ㄲ, ㄸ, ㅃ, ㅆ, ㅉ가 다 비슷하게 들려요.', 'Doenssoriga jeongmal eoryeowoyo. Kk, tt, pp, ss, jj-ga da bisisage deullyeoyo.', 'Tensed consonants are really hard. ㄲ, ㄸ, ㅃ, ㅆ, ㅉ all sound similar to me.', 1),
  (l_id, '선생님', '맞아요, 처음에는 어렵죠. 목을 약간 조이는 느낌으로 발음해 보세요.', 'Majayo, cheoeum-eneun eoryeopjiyo. Mogeul yakgan joineun neukkimeuro bareumhae boseyo.', 'Yes, it is hard at first. Try pronouncing them while slightly tensing your throat.', 2),
  (l_id, '학생', '"빵"을 해 볼게요. [빵]', '"Ppang"-eul hae bolgeyo. [ppang]', 'I will try "빵" (bread). [ppang]', 3),
  (l_id, '선생님', '좋아요! 바람이 안 나오죠? 그게 된소리예요.', 'Joayo! Barami an naojjiyo? Geuge doenssori-eyo.', 'Good! No puff of air, right? That is the tensed sound.', 4),
  (l_id, '학생', '"달", "탈", "딸"이 다 달라요?', '"Dal", "tal", "ttal"-i da dallayo?', 'Are "달", "탈", "딸" all different?', 5),
  (l_id, '선생님', '네! "달"은 달[moon], "탈"은 탈[mask], "딸"은 딸[daughter]이에요.', 'Ne! "Dal"-eun [moon], "tal"-eun [mask], "ttal"-eun [daughter]-i-eyo.', 'Yes! "달" = moon, "탈" = mask, "딸" = daughter.', 6),
  (l_id, '학생', '한국어에 3중 대립이 있군요!', 'Hangugeo-e samjung daerip-i itgunyo!', 'Korean has a three-way contrast!', 7),
  (l_id, '선생님', '바로 그거예요. 그래서 발음이 중요해요.', 'Baro geugeoyeyo. Geuraeseo bareumi jungyohaeyo.', 'Exactly. That is why pronunciation is important.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which tensed consonant is the pair of ㅅ?', '["ㅊ","ㅆ","ㅉ","ㄲ"]', 1, 'ㅆ [s͈] is the tensed version of ㅅ [s].', 1),
  (l_id, 'What happens in 학교 (school) phonologically?', '["ㄱ+ㄱ → ㅋ","ㄱ+ㄱ → ㄲ","ㄱ+ㄱ → ㄱㄱ","No change"]', 1, 'After the obstruent batchim ㄱ, the following ㄱ becomes tensed ㄲ: 학교 → [학꾜].', 2),
  (l_id, 'Which word means "bread" and starts with a tensed consonant?', '["바다","빵","파도","마음"]', 1, '빵 (bread) starts with the tensed consonant ㅃ.', 3),
  (l_id, 'What is the key physical difference between tensed and aspirated consonants?', '["Tensed have more air","Aspirated have more throat tension","Tensed have no aspiration; aspirated have a puff of air","They are identical"]', 2, 'Tensed consonants are produced with glottal tension and no aspiration. Aspirated consonants have a strong puff of air.', 4),
  (l_id, 'In the three-way contrast, which consonant fills the "tensed" slot for ㅈ?', '["ㅊ","ㄲ","ㅉ","ㄸ"]', 2, 'ㅉ [t͈ɕ] is the tensed version of ㅈ, completing the trio ㅈ / ㅊ / ㅉ.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '된소리(경음)는 ㄲ, ㄸ, ㅃ, ㅆ, ㅉ 다섯 가지입니다. 이 소리들은 목에 힘을 주고 공기를 거의 내보내지 않으면서 발음합니다. 된소리는 평음과 격음과 함께 한국어 자음의 3중 대립을 이룹니다. 이 대립은 영어에는 없는 한국어만의 특징입니다. 된소리는 특정 환경에서 자연스럽게 발생합니다. 예를 들어 폐쇄음 받침(ㄱ, ㄷ, ㅂ) 뒤에 오는 평음은 자동으로 된소리가 됩니다. "학교"가 [학꾜]로 발음되는 것이 대표적인 예입니다.',
   'The tensed sounds (경음) are the five consonants ㄲ, ㄸ, ㅃ, ㅆ, and ㅉ. These sounds are produced by tensing the muscles of the throat while releasing almost no air. Together with plain and aspirated consonants, tensed consonants form the three-way contrast of Korean consonants. This contrast is unique to Korean and does not exist in English. Tensed sounds arise naturally in certain environments. For example, a plain consonant following a stop batchim (ㄱ, ㄷ, ㅂ class) automatically becomes tensed. The pronunciation of "학교" as [학꾜] is a representative example.',
   1);
END $$;

-- ============================================================
-- LESSON 8: Pronunciation Rules (발음 규칙)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=8;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=8 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '연음', 'yeonum', 'liaison — batchim shifts to next syllable''s onset', 1),
  (l_id, '비음화', 'biuumhwa', 'nasalization — stops become nasals before nasals', 2),
  (l_id, '유음화', 'yuumhwa', 'lateralization — ㄴ becomes ㄹ next to ㄹ', 3),
  (l_id, '구개음화', 'gugaeeumhwa', 'palatalization — ㄷ/ㅌ + 이 → ㅈ/ㅊ', 4),
  (l_id, '음절의 끝소리 규칙', 'eumjeorui kkeut-sori gyuchik', 'final-consonant reduction rule — 7 sounds', 5),
  (l_id, '받침이 있어요', 'batchimi isseoyo', 'there is a batchim (example of liaison: [바치미])', 6),
  (l_id, '국민', 'gungmin', 'citizen — ㄱ+ㅁ → ㄱ→ㅇ (nasalization): [궁민]', 7),
  (l_id, '설날', 'seollal', 'Lunar New Year — ㄴ+ㄹ → ㄹ+ㄹ (lateralization): [설랄]', 8),
  (l_id, '굳이', 'guji', 'stubbornly; specifically — ㄷ+이 → ㅈ (palatalization): [구지]', 9),
  (l_id, '같이', 'gachi', 'together — ㅌ+이 → ㅊ (palatalization): [가치]', 10),
  (l_id, '발음 규칙', 'bareum gyuchik', 'pronunciation rules', 11);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Liaison (연음화)',
   'C(batchim) + ㅇ(initial) → C moves to next syllable',
   'When a syllable with a batchim is followed by a syllable beginning with the silent ㅇ, the batchim becomes the initial consonant of the next syllable. This is the most pervasive pronunciation rule in Korean.',
   '[{"korean":"밥을 [바블]","english":"rice (object) — ㅂ batchim → onset of 을"},{"korean":"한국어 [한구거]","english":"Korean language — ㄱ batchim → onset of 어"},{"korean":"읽어요 [일거요]","english":"reads — ㄺ: ㄱ → onset, ㄹ stays"}]',
   1),
  (l_id,
   'Nasalization (비음화)',
   'ㄱ/ㄷ/ㅂ(batchim) + ㄴ/ㅁ → ㅇ/ㄴ/ㅁ',
   'Stop batchim (ㄱ-class, ㄷ-class, ㅂ-class) assimilates to a following nasal (ㄴ or ㅁ), becoming the nasal at the same place of articulation.',
   '[{"korean":"국민 → [궁민]","english":"citizen — ㄱ+ㅁ → ㅇ+ㅁ"},{"korean":"닫는 → [단는]","english":"closing — ㄷ+ㄴ → ㄴ+ㄴ"},{"korean":"합니다 → [함니다]","english":"(formal ending) — ㅂ+ㄴ → ㅁ+ㄴ"}]',
   2),
  (l_id,
   'Palatalization (구개음화)',
   'ㄷ/ㅌ + 이(vowel) → ㅈ/ㅊ',
   'When the batchim ㄷ or ㅌ is followed by a syllable beginning with the vowel ㅣ (or ㅣ-glide), they shift to the palatals ㅈ or ㅊ respectively.',
   '[{"korean":"굳이 → [구지]","english":"stubbornly — ㄷ+이 → ㅈ"},{"korean":"같이 → [가치]","english":"together — ㅌ+이 → ㅊ"},{"korean":"해돋이 → [해도지]","english":"sunrise — ㄷ+이 → ㅈ"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '학생', '한국어를 읽을 때 쓰인 대로 발음하면 안 돼요?', 'Hangugeo-reul ilgeul ttae sseu-in daero bareumhamyeon an dwaeyo?', 'When reading Korean, can I not just pronounce it as written?', 1),
  (l_id, '선생님', '안타깝게도 그렇지 않아요. 발음 규칙 때문에 달라지는 경우가 많아요.', 'Antakkap-ge-do geureoji anayo. Bareum gyuchik ttaemune dallaejineun gyeongu-ga manayo.', 'Unfortunately not. There are many cases where pronunciation differs due to pronunciation rules.', 2),
  (l_id, '학생', '"밥을"은 어떻게 발음해요?', '"Babeul"-eun eotteoke bareumhaeyo?', 'How do you pronounce "밥을"?', 3),
  (l_id, '선생님', '"밥을"은 [바블]로 발음해요. ㅂ 받침이 다음 음절로 넘어가요.', '"Babeul"-eun [babeul]-ro bareumhaeyo. B batchim-i daeum eumjeol-lo neomeoGAyo.', '"밥을" is pronounced [babeul]. The ㅂ batchim moves to the next syllable.', 4),
  (l_id, '학생', '"한국말"은요?', '"Hangungmal"-eunyo?', 'What about "한국말"?', 5),
  (l_id, '선생님', '"한국말"은 [한궁말]로 발음해요. ㄱ이 ㅁ 앞에서 ㅇ이 돼요 — 비음화예요.', '"Hangungmal"-eun [hangungmal]-ro bareumhaeyo. G-i m ape-seo ng-i dwaeyo — biuumhwa-yeyo.', '"한국말" is pronounced [hangungmal]. ㄱ becomes ㅇ before ㅁ — that is nasalization.', 6),
  (l_id, '학생', '"같이"는 [가치]예요?', '"Gachi"-neun [gachi]-yeyo?', 'Is "같이" [가치]?', 7),
  (l_id, '선생님', '맞아요! ㅌ + 이 → ㅊ이 되는 구개음화예요.', 'Majayo! T + i → ch-ga doenneun gugaeeumhwa-yeyo.', 'Correct! ㅌ + 이 → ㅊ is palatalization.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How is 합니다 (formal polite ending) pronounced?', '["[합니다]","[함니다]","[한니다]","[합미다]"]', 1, 'Nasalization: ㅂ batchim + ㄴ → ㅁ + ㄴ. 합니다 → [함니다].', 1),
  (l_id, 'What rule applies in 밥을 → [바블]?', '["Nasalization","Liaison (연음)","Palatalization","Tensing"]', 1, 'Liaison: ㅂ batchim shifts to become the onset of the next syllable (을 starts with ㅇ).', 2),
  (l_id, 'How is 같이 (together) pronounced?', '["[같이]","[가치]","[가시]","[같히]"]', 1, 'Palatalization: ㅌ batchim + 이 → ㅊ. 같이 → [가치].', 3),
  (l_id, 'Which rule changes ㄴ to ㄹ beside ㄹ?', '["Nasalization","Aspiration","Lateralization (유음화)","Liaison"]', 2, 'Lateralization (유음화) assimilates ㄴ to ㄹ when adjacent to ㄹ. E.g., 설날 → [설랄].', 4),
  (l_id, 'In 국민 (citizen), what phonological process occurs?', '["Liaison","Palatalization","Nasalization","Tensing"]', 2, 'Nasalization: ㄱ batchim + ㅁ → ㅇ + ㅁ. 국민 → [궁민].', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에는 여러 가지 발음 규칙이 있습니다. 가장 기본적인 규칙은 연음으로, 받침 뒤에 ㅇ으로 시작하는 음절이 오면 받침이 다음 음절 초성으로 이동합니다. 비음화는 폐쇄음 받침이 비음(ㄴ, ㅁ) 앞에서 비음으로 바뀌는 현상입니다. 구개음화는 ㄷ이나 ㅌ 받침 뒤에 이 모음이 올 때 ㅈ이나 ㅊ으로 바뀌는 현상입니다. 이러한 규칙들은 자연스러운 한국어 발음을 위해 반드시 익혀야 합니다.',
   'Korean has various pronunciation rules. The most fundamental is liaison (연음): when a syllable with a batchim is followed by a syllable beginning with ㅇ, the batchim moves to become the onset of the next syllable. Nasalization is the process by which a stop batchim changes to a nasal before a nasal consonant (ㄴ or ㅁ). Palatalization is the process by which ㄷ or ㅌ batchim changes to ㅈ or ㅊ when followed by the vowel 이. These rules must be mastered for natural Korean pronunciation.',
   1);
END $$;

-- ============================================================
-- LESSON 9: Reading Practice (읽기 연습)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=9;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=9 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '사람', 'saram', 'person', 1),
  (l_id, '나라', 'nara', 'country', 2),
  (l_id, '바다', 'bada', 'sea / ocean', 3),
  (l_id, '하늘', 'haneul', 'sky', 4),
  (l_id, '아이', 'ai', 'child', 5),
  (l_id, '기차', 'gicha', 'train', 6),
  (l_id, '우유', 'uyu', 'milk', 7),
  (l_id, '오리', 'ori', 'duck', 8),
  (l_id, '나비', 'nabi', 'butterfly', 9),
  (l_id, '구름', 'gureum', 'cloud', 10),
  (l_id, '모자', 'moja', 'hat', 11),
  (l_id, '소리', 'sori', 'sound', 12),
  (l_id, '미소', 'miso', 'smile', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Reading Strategy 1: Sound Out Each Syllable',
   'C+V → syllable block → read left-to-right, top-to-bottom',
   'Identify the initial consonant and vowel direction. Vertical vowel = left-right block. Horizontal vowel = top-bottom block. Add batchim below if present. Then apply pronunciation rules.',
   '[{"korean":"나비","english":"Read: ㄴ+ㅏ [na] / ㅂ+ㅣ [bi] → 나비 (butterfly)"},{"korean":"기차","english":"Read: ㄱ+ㅣ [gi] / ㅊ+ㅏ [cha] → 기차 (train)"},{"korean":"구름","english":"Read: ㄱ+ㅜ [gu] / ㄹ+ㅡ+ㅁ [reum] → 구름 (cloud)"}]',
   1),
  (l_id,
   'Reading Strategy 2: Apply Liaison First',
   'When batchim + ㅇ-initial syllable → liaison',
   'Before reading aloud, scan for batchim followed by ㅇ-initial syllables and mentally shift the batchim. This dramatically improves fluency.',
   '[{"korean":"한국어 → [한구거]","english":"Korean language"},{"korean":"읽어요 → [일거요]","english":"reads"},{"korean":"밥이에요 → [바비에요]","english":"it is rice"}]',
   2),
  (l_id,
   'Reading Strategy 3: Chunk Into Meaning Units',
   'Group words by grammar markers and pause at major boundaries',
   'Korean is a verb-final language. Read ahead to the verb before parsing meaning. Group nouns with their particles (이/가, 을/를, 에서 etc.) and verbs with their endings together.',
   '[{"korean":"저는 / 한국어를 / 배워요.","english":"I / Korean / learn → I learn Korean"},{"korean":"오늘 / 날씨가 / 좋아요.","english":"Today / the weather / is nice"},{"korean":"친구가 / 학교에 / 가요.","english":"Friend / to school / goes"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘은 한글을 소리 내어 읽어 볼 거예요. 준비됐어요?', 'Oneureun hangeureul sori naeo ilgeo bol geoyeyo. Junbi doesseoyo?', 'Today we will read Hangul aloud. Are you ready?', 1),
  (l_id, '학생', '네, 준비됐어요!', 'Ne, junbi doesseoyo!', 'Yes, I am ready!', 2),
  (l_id, '선생님', '"나비"를 읽어 보세요.', '"Nabi"-reul ilgeo boseyo.', 'Please read "나비".', 3),
  (l_id, '학생', '나… 비. 나비!', 'Na... bi. Nabi!', 'Na... bi. Nabi!', 4),
  (l_id, '선생님', '잘했어요! 이번엔 "구름"이에요.', 'Jalhaesseoyo! Ibeonnen "gureum"-i-eyo.', 'Well done! This time it is "구름".', 5),
  (l_id, '학생', '구… 구름. ㄹ+ㅡ+ㅁ… "름"!', 'Gu... gureum. R+eu+m... "reum"!', 'Gu... gureum. R+eu+m... "reum"!', 6),
  (l_id, '선생님', '완벽해요! 이제 "한국어"를 읽어 볼게요.', 'Wanbyeokaeyeo! Ije "hangugeo"-reul ilgeo bolgeyo.', 'Perfect! Now let us read "한국어".', 7),
  (l_id, '학생', '한… 국… 어. 한국어! 그런데 [한구거]로 발음해요?', 'Han... guk... eo. Hangugeo! Geureonde [hangugeo]-ro bareumhaeyo?', 'Han... guk... eo. Hangugeo! But do we pronounce it [han-gu-geo]?', 8),
  (l_id, '선생님', '맞아요! 연음 때문에 ㄱ이 다음 음절로 넘어가요.', 'Majayo! Yeonum ttaemune g-i daeum eumjeol-lo neomeoGAyo.', 'Correct! Because of liaison, ㄱ carries over to the next syllable.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you read the syllable 름?', '["[eum]","[reum]","[leum]","[meum]"]', 1, '름 = ㄹ+ㅡ+ㅁ. ㄹ is the initial consonant (flap/r sound here), ㅡ is the vowel, ㅁ is the batchim. → [reum].', 1),
  (l_id, 'Which strategy should you apply first when reading 밥이에요?', '["Chunk meaning","Apply liaison","Sound out syllables","Look for tensing"]', 1, 'Apply liaison first: ㅂ batchim + 이(ㅇ-initial) → [바비에요].', 2),
  (l_id, 'What does 나비 mean?', '["cloud","duck","butterfly","smile"]', 2, '나비 means butterfly. It is read as two simple syllables: 나[na] + 비[bi].', 3),
  (l_id, 'In "기차" (train), what type of consonant is ㅊ?', '["Plain","Tensed","Aspirated","Nasal"]', 2, 'ㅊ is an aspirated affricate — the aspirated version of ㅈ.', 4),
  (l_id, 'When reading Korean, where is the main verb typically found in a sentence?', '["At the beginning","In the middle","At the end","After the subject particle"]', 2, 'Korean is a verb-final (SOV) language. The verb always comes at the end of the clause.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '하늘에 구름이 있어요. 구름이 하얘요. 바다도 파래요. 바다에 오리가 있어요. 오리가 헤엄쳐요. 나비도 날아요. 나비는 노란색이에요. 아이가 나비를 봐요. 아이가 웃어요. 정말 아름다운 날이에요.',
   'There are clouds in the sky. The clouds are white. The sea is also blue. There is a duck in the sea. The duck is swimming. A butterfly is also flying. The butterfly is yellow. A child is watching the butterfly. The child is smiling. It is a truly beautiful day.',
   1);
END $$;

-- ============================================================
-- LESSON 10: Writing Practice (쓰기 연습)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=10;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=10 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '쓰다', 'sseuda', 'to write', 1),
  (l_id, '획', 'hoek', 'stroke (of a character)', 2),
  (l_id, '순서', 'sunseo', 'order / sequence', 3),
  (l_id, '가로획', 'garhoek', 'horizontal stroke', 4),
  (l_id, '세로획', 'serohoek', 'vertical stroke', 5),
  (l_id, '연습장', 'yeonseubjang', 'practice notebook', 6),
  (l_id, '받아쓰기', 'badasseugi', 'dictation', 7),
  (l_id, '이름을 쓰다', 'ireomeul sseuda', 'to write one''s name', 8),
  (l_id, '글자', 'geulja', 'letter / written character', 9),
  (l_id, '한글', 'hangeul', 'the Korean alphabet', 10),
  (l_id, '자음자', 'jaumja', 'consonant letter', 11),
  (l_id, '모음자', 'moeumja', 'vowel letter', 12),
  (l_id, '맞춤법', 'matchumbeop', 'spelling; orthography', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Stroke Order Principle 1: Left to Right, Top to Bottom',
   'Horizontal strokes before vertical; left strokes before right',
   'Hangul follows the same stroke-order principle as Chinese characters: start from the top-left and work toward the bottom-right. Horizontal strokes generally come before vertical ones in the same block.',
   '[{"korean":"ㄱ","english":"1. short horizontal stroke (→) 2. downward vertical stroke (↓)"},{"korean":"ㄴ","english":"1. downward stroke (↓) 2. rightward stroke (→)"},{"korean":"ㅏ","english":"1. vertical stroke (↓) 2. short rightward stroke (→) at mid-height"}]',
   1),
  (l_id,
   'Writing Syllable Blocks in a Square',
   'Each syllable occupies an equal-sized square',
   'Each Hangul syllable block — regardless of how many letters it contains — should fit within the same imaginary square. This visual uniformity is one of Hangul''s elegant design features.',
   '[{"korean":"가 (2 parts)","english":"ㄱ left side, ㅏ right side — both fill the square equally"},{"korean":"곰 (3 parts)","english":"ㄱ top-left, ㅗ center-below, ㅁ bottom — balanced"},{"korean":"닭 (4 parts)","english":"ㄷ top-left, ㅏ right, ㄹ+ㄱ bottom — double batchim still in one square"}]',
   2),
  (l_id,
   'Common Spelling Pitfalls',
   'Sound-alike pairs that must be memorized individually',
   'Because ㅐ/ㅔ, ㅙ/ㅚ/ㅞ, and ㄱ/ㄲ all sound similar, spelling must be learned word by word. Use context clues, etymological patterns, or direct memorization.',
   '[{"korean":"개 vs 게","english":"dog vs crab — spelled differently, sound identical [ge]"},{"korean":"되다 vs 돼다","english":"됩니다 (correct) vs 돼요 (correct) — learn each form"},{"korean":"왠지 vs 웬지","english":"왠지 = for some reason (왜+인지); 웬 = what kind of"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘은 한글 쓰기를 연습해요. 연습장을 꺼내세요.', 'Oneureun hangeul sseugireul yeonseuphaeyo. Yeonseubjang-eul kkeonaeseyo.', 'Today we practice writing Hangul. Take out your practice notebook.', 1),
  (l_id, '학생', '어떤 순서로 써야 해요?', 'Eotteon sunseo-ro sseoaya haeyo?', 'In what order should I write?', 2),
  (l_id, '선생님', '위에서 아래로, 왼쪽에서 오른쪽으로 써요. 가로획이 먼저예요.', 'Wie-seo araero, oenjjok-eseo oreunjjok-euro sseoyo. Garohoeigi meonjeo-yeyo.', 'Write top to bottom, left to right. Horizontal strokes come first.', 3),
  (l_id, '학생', '"가"를 써 볼게요.', '"Ga"-reul sseo bolgeyo.', 'I will try writing "가".', 4),
  (l_id, '선생님', '좋아요. ㄱ을 먼저 왼쪽에, 그 다음 ㅏ를 오른쪽에 써요.', 'Joayo. G-eul meonjeo oenjjoge, geu daeum a-reul oreunjjoge sseoyo.', 'Good. Write ㄱ first on the left, then ㅏ on the right.', 5),
  (l_id, '학생', '이렇게요?', 'Ireoke-yo?', 'Like this?', 6),
  (l_id, '선생님', '완벽해요! 이제 "국"을 써 보세요.', 'Wanbyeokaeyeo! Ije "guk"-eul sseo boseyo.', 'Perfect! Now try writing "국".', 7),
  (l_id, '학생', 'ㄱ 위에, ㅜ 아래에, ㄱ 받침으로요?', 'G wie, u araee, g batchim-euro-yo?', 'ㄱ on top, ㅜ below, ㄱ as batchim?', 8),
  (l_id, '선생님', '정확해요! 세 부분이 하나의 네모 안에 들어가야 해요.', 'Jeonghakaeyo! Se bubun-i hana-eui nemo ane deureogaya haeyo.', 'Exactly right! All three parts must fit inside one square.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the general stroke order direction in Hangul?', '["Right to left, bottom to top","Left to right, top to bottom","Bottom to top, right to left","Center outward"]', 1, 'Like Chinese characters, Hangul follows left-to-right and top-to-bottom stroke order.', 1),
  (l_id, 'In writing the vowel ㅏ, which stroke comes first?', '["The short horizontal stroke","The vertical stroke","Both simultaneously","There is only one stroke"]', 1, 'ㅏ is written with the long vertical stroke first, then the short rightward stroke.', 2),
  (l_id, 'How many parts does the syllable 닭 (chicken) have?', '["2","3","4","5"]', 2, '닭 = ㄷ (initial) + ㅏ (vowel) + ㄺ (double batchim: two consonants). Total = 4 letter units in 1 syllable block.', 3),
  (l_id, 'Which spelling is correct for "for some reason"?', '["웬지","왠지","왜지","왼지"]', 1, '왠지 comes from 왜(why)+인지, meaning "for some reason." 웬 means "what kind of."', 4),
  (l_id, 'Each Hangul syllable block is designed to fit within:', '["A circle","A triangle","A square","A rectangle"]', 2, 'Hangul syllable blocks are designed to fill equal-sized squares, giving Korean text its characteristic compact appearance.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한글은 1443년에 세종대왕이 창제했습니다. 한글 이전에 조선 사람들은 한자를 사용했는데, 배우기가 매우 어려웠습니다. 세종대왕은 누구나 쉽게 읽고 쓸 수 있는 문자를 만들고 싶었습니다. 한글은 자음 14개와 모음 10개로 이루어져 있습니다. 각 음절은 하나의 네모 블록 안에 씁니다. 한글은 세계에서 가장 과학적인 문자 중 하나로 인정받고 있습니다.',
   'Hangul was created by King Sejong in 1443. Before Hangul, people in Joseon used Chinese characters, which were very difficult to learn. King Sejong wanted to create a script that anyone could easily read and write. Hangul consists of 14 consonants and 10 vowels. Each syllable is written inside a single square block. Hangul is recognized as one of the most scientifically designed writing systems in the world.',
   1);
END $$;

-- ============================================================
-- LESSON 11: Greetings (인사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=11;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=11 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '안녕하세요', 'annyeonghaseyo', 'Hello (polite, universal)', 1),
  (l_id, '안녕하십니까', 'annyeonghasimnikka', 'Hello (very formal)', 2),
  (l_id, '안녕', 'annyeong', 'Hi / Hey (informal)', 3),
  (l_id, '반갑습니다', 'bangapseumnida', 'Nice to meet you (formal)', 4),
  (l_id, '만나서 반가워요', 'mannaseo bangawoyo', 'Nice to meet you (polite)', 5),
  (l_id, '오랜만이에요', 'oraenmani-eyo', 'Long time no see (polite)', 6),
  (l_id, '잘 지냈어요?', 'jal jinaesseoyo?', 'Have you been well?', 7),
  (l_id, '덕분에요', 'deokbune-yo', 'Thanks to you (I''ve been well)', 8),
  (l_id, '어디 가세요?', 'eodi gaseyo?', 'Where are you going? (casual greeting)', 9),
  (l_id, '잘 부탁드립니다', 'jal butakdeurimnida', 'Please take care of me (set phrase)', 10),
  (l_id, '수고하세요', 'sugohaseyo', 'Keep up the good work (farewell to someone staying)', 11),
  (l_id, '수고하셨어요', 'sugohasyeosseoyo', 'Good work / Thank you for your effort', 12),
  (l_id, '처음 뵙겠습니다', 'cheoeum boepgesseumnida', 'How do you do (very formal, first meeting)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Greeting by Time of Day',
   '아침: 좋은 아침이에요 / 오후: 안녕하세요 / 저녁: 좋은 저녁이에요',
   'Although 안녕하세요 is used throughout the day, Koreans also use time-specific greetings in certain contexts. Morning greetings are less fixed than in English, but 좋은 아침이에요 is understood.',
   '[{"korean":"좋은 아침이에요!","english":"Good morning!"},{"korean":"안녕하세요, 오늘 날씨가 좋네요.","english":"Hello, the weather is nice today."},{"korean":"좋은 저녁이에요!","english":"Good evening!"}]',
   1),
  (l_id,
   'Formal vs. Polite vs. Informal Speech Levels',
   'Formal: -ㅂ/습니다 / Polite: -아/어요 / Informal: dictionary form or -아/어',
   'Korean has distinct speech levels. With strangers and seniors, use formal (-ㅂ니다) or polite (-아요/어요). With close friends of the same age, informal speech is natural.',
   '[{"korean":"안녕하십니까? (formal)","english":"Formal — used in presentations, news, first meetings with superiors"},{"korean":"안녕하세요? (polite)","english":"Polite — everyday default with strangers and acquaintances"},{"korean":"안녕? (informal)","english":"Informal — used with close friends or younger people"}]',
   2),
  (l_id,
   '~(이)세요 — Honorific Copula',
   '[Noun] + 이세요 (after consonant) / 세요 (after vowel)',
   'The honorific form of 이다 (to be) is used when talking to or about someone deserving respect. It softens and elevates the register.',
   '[{"korean":"선생님이세요?","english":"Are you a teacher?"},{"korean":"어머니세요?","english":"Is she your mother?"},{"korean":"김 선생님이세요.","english":"This is Teacher Kim."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '안녕하세요! 처음 뵙겠습니다. 저는 이민준이에요.', 'Annyeonghaseyo! Cheoeum boepgesseumnida. Jeoneun I Minjun-i-eyo.', 'Hello! How do you do. I am Lee Minjun.', 1),
  (l_id, '수진', '안녕하세요! 만나서 반가워요. 저는 박수진이에요.', 'Annyeonghaseyo! Mannaseo bangawoyo. Jeoneun Bak Sujin-i-eyo.', 'Hello! Nice to meet you. I am Park Sujin.', 2),
  (l_id, '민준', '학생이에요?', 'Haksaeng-i-eyo?', 'Are you a student?', 3),
  (l_id, '수진', '네, 대학생이에요. 민준 씨는요?', 'Ne, daehaksaeng-i-eyo. Minjun ssi-neun-yo?', 'Yes, I am a university student. What about you, Minjun?', 4),
  (l_id, '민준', '저도 대학생이에요. 잘 부탁드립니다!', 'Jeodo daehaksaeng-i-eyo. Jal butakdeurimnida!', 'I am also a university student. Pleased to meet you!', 5),
  (l_id, '수진', '네, 저도요. 앞으로 잘 부탁드려요!', 'Ne, jeodoya. Apeuro jal butakdeuryeoyo!', 'Yes, me too. I look forward to working with you!', 6),
  (l_id, '민준', '그런데 어디에서 왔어요?', 'Geureonde eodie-seo wasseoyo?', 'By the way, where are you from?', 7),
  (l_id, '수진', '서울이에요. 민준 씨는요?', 'Seoul-i-eyo. Minjun ssi-neunyo?', 'I am from Seoul. What about you?', 8),
  (l_id, '민준', '저는 부산이에요. 서울에 온 지 1년 됐어요.', 'Jeoneun Busan-i-eyo. Seoul-e on ji il-nyeon doesseoyo.', 'I am from Busan. I have been in Seoul for one year.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which greeting is most appropriate when meeting your professor for the first time?', '["안녕!","안녕하세요","처음 뵙겠습니다","잘 지냈어?"]', 2, '처음 뵙겠습니다 is the most formal first-meeting greeting, appropriate for professors and seniors.', 1),
  (l_id, 'What does 오랜만이에요 mean?', '["Nice to meet you","Long time no see","How are you?","Goodbye"]', 1, '오랜만이에요 means "long time no see" and is used when meeting someone after a long time apart.', 2),
  (l_id, 'How do you respond to 잘 지냈어요?', '["네, 처음이에요","네, 덕분에 잘 지냈어요","아니요, 안녕하세요","잘 부탁드립니다"]', 1, 'A natural response is 네, 덕분에 잘 지냈어요 (Yes, I have been well, thanks to you).', 3),
  (l_id, 'Which is the informal greeting?', '["안녕하십니까","안녕하세요","안녕","수고하세요"]', 2, '안녕 is the informal/casual greeting used with close friends and peers.', 4),
  (l_id, '잘 부탁드립니다 is typically said:', '["When parting from someone","When making a new acquaintance or joining a group","When thanking someone for food","When apologizing"]', 1, '잘 부탁드립니다 is said when meeting someone for the first time, joining a team, or starting a collaborative relationship.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에서는 인사가 매우 중요합니다. 처음 만나는 사람에게는 "처음 뵙겠습니다" 또는 "만나서 반갑습니다"라고 합니다. 매일 만나는 사람에게는 "안녕하세요"라고 합니다. 친한 친구 사이에서는 "안녕"이라고 합니다. 한국어 인사는 상대방의 나이와 관계에 따라 달라집니다. 어른께는 반드시 존댓말로 인사해야 합니다.',
   'In Korea, greetings are very important. When meeting someone for the first time, you say "처음 뵙겠습니다" or "만나서 반갑습니다." For people you see every day, you say "안녕하세요." Between close friends, "안녕" is used. Korean greetings vary depending on the other person''s age and relationship. You must always use honorific speech when greeting elders.',
   1);
END $$;

-- ============================================================
-- LESSON 12: Farewells (작별 인사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=12;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=12 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '안녕히 가세요', 'annyeonghi gaseyo', 'Goodbye (to someone leaving; you are staying)', 1),
  (l_id, '안녕히 계세요', 'annyeonghi gyeseyo', 'Goodbye (to someone staying; you are leaving)', 2),
  (l_id, '잘 가요', 'jal gayo', 'Goodbye (casual, to someone leaving)', 3),
  (l_id, '또 봐요', 'tto bwayo', 'See you again', 4),
  (l_id, '나중에 봐요', 'najunge bwayo', 'See you later', 5),
  (l_id, '다음에 봐요', 'daeume bwayo', 'See you next time', 6),
  (l_id, '내일 봐요', 'naeil bwayo', 'See you tomorrow', 7),
  (l_id, '조심히 가세요', 'josimhi gaseyo', 'Take care going (safe travels)', 8),
  (l_id, '잘 자요', 'jal jayo', 'Good night / Sleep well', 9),
  (l_id, '좋은 꿈 꾸세요', 'joeun kkum kkuseyo', 'Sweet dreams', 10),
  (l_id, '바이바이', 'bai-bai', 'Bye-bye (informal, from English)', 11),
  (l_id, '먼저 가겠습니다', 'meonjeo gagetseumnida', 'I will go ahead / Excuse me for leaving first', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   '가다 vs 있다 — The Core Farewell Logic',
   'Leaving: say 계세요 (stay well) to the one who stays / Staying: say 가세요 (go well) to the one who leaves',
   'The most important rule: 안녕히 가세요 is for the person who is leaving (you wish them a safe journey). 안녕히 계세요 is for the person who is staying (you wish them peace while you go). Mixing these up is one of the most common errors among learners.',
   '[{"korean":"교사가 교실을 나갈 때 학생들이:","english":"When the teacher leaves the classroom, students say:"},{"korean":"→ 안녕히 가세요!","english":"→ Goodbye! (wishing the teacher a safe trip)"},{"korean":"학생이 먼저 나갈 때 교사가:","english":"When a student leaves first, the teacher says:"},{"korean":"→ 안녕히 가세요!","english":"→ Goodbye! (wishing the student a safe trip)"}]',
   1),
  (l_id,
   '먼저 가겠습니다 — Leaving Before Others',
   '먼저 + Verb + 겠습니다',
   'In Korean workplaces and schools, it is polite to explicitly announce when you are leaving before others. 먼저 가겠습니다 (literally "I will go first") signals that you are departing and is paired with 수고하세요 directed at those who remain.',
   '[{"korean":"먼저 가겠습니다. 수고하세요.","english":"I will head off now. Keep up the good work."},{"korean":"저 먼저 일어날게요.","english":"I will get up (leave the table) first."},{"korean":"먼저 들어가겠습니다.","english":"I will head in first (said to seniors outside)."}]',
   2),
  (l_id,
   '-고 싶어요 — Expressing a wish to see someone again',
   '[Verb stem] + -고 싶어요',
   'Attach -고 싶어요 to any verb stem to express a desire. Used to say "I want to see you again" as a warm farewell.',
   '[{"korean":"또 보고 싶어요.","english":"I want to see you again."},{"korean":"빨리 만나고 싶어요.","english":"I want to meet you soon."},{"korean":"다음에 또 오고 싶어요.","english":"I want to come again next time."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '벌써 시간이 이렇게 됐네요. 저는 이만 가야 할 것 같아요.', 'Beolsseo sigan-i ireoke doennne-yo. Jeoneun iman gaya hal geot gatayo.', 'Time has passed so quickly. I think I should head off now.', 1),
  (l_id, '민준', '벌써요? 아쉽다. 조심히 가세요.', 'Beolsseoyo? Aswipta. Josimhi gaseyo.', 'Already? That is a shame. Take care on your way home.', 2),
  (l_id, '수진', '네, 민준 씨도요. 오늘 정말 즐거웠어요!', 'Ne, Minjun ssidoyo. Oneul jeongmal jeulgeowosseoyo!', 'You too. Today was truly enjoyable!', 3),
  (l_id, '민준', '저도요. 또 봐요!', 'Jeodoya. Tto bwayo!', 'Me too. See you again!', 4),
  (l_id, '수진', '네, 또 봐요! 다음에는 제가 커피 살게요.', 'Ne, tto bwayo! Daeumeneun jega keopi salgeyo.', 'Yes, see you! Next time coffee is on me.', 5),
  (l_id, '민준', '좋아요, 기대할게요! 안녕히 가세요!', 'Joayo, gidaehalgeyo! Annyeonghi gaseyo!', 'Sounds good, I look forward to it! Goodbye!', 6),
  (l_id, '수진', '안녕히 계세요!', 'Annyeonghi gyeseyo!', 'Goodbye (as I leave you here)!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'You are staying at a coffee shop; your friend is leaving. What do you say?', '["안녕히 계세요","안녕히 가세요","잘 자요","먼저 가겠습니다"]', 1, 'You are staying, so you say 안녕히 가세요 to wish your friend a safe journey.', 1),
  (l_id, 'You are leaving the office while your colleagues remain. What do you say?', '["안녕히 가세요","또 봐요","먼저 가겠습니다. 수고하세요.","잘 자요"]', 2, '먼저 가겠습니다. 수고하세요. — the standard Korean workplace farewell when leaving before others.', 2),
  (l_id, 'What is the difference between 또 봐요 and 나중에 봐요?', '["They are identical","또 봐요 = see you again (general); 나중에 봐요 = see you later","나중에 봐요 = see you tomorrow","또 봐요 is rude"]', 1, '또 봐요 = see you again (hopeful, slightly more affectionate). 나중에 봐요 = see you later (more specific implication).', 3),
  (l_id, 'Which phrase is appropriate before going to sleep?', '["안녕히 가세요","잘 지냈어요","잘 자요","먼저 가겠습니다"]', 2, '잘 자요 (sleep well / good night) is the appropriate bedtime farewell.', 4),
  (l_id, '조심히 가세요 literally means:', '["See you again","Go carefully / Take care going","Good night","Goodbye (staying)"]', 1, '조심히 = carefully; 가세요 = please go. Together: "Go carefully" = "Take care on your way."', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어의 작별 인사는 상황에 따라 다릅니다. 내가 떠날 때는 남는 사람에게 "안녕히 계세요"라고 하고, 상대방이 떠날 때는 "안녕히 가세요"라고 합니다. 직장에서는 먼저 퇴근할 때 "먼저 가겠습니다, 수고하세요"라고 하는 것이 예의입니다. 친한 친구끼리는 "잘 가", "나중에 봐", "바이바이" 같은 가벼운 작별 인사를 씁니다. 자기 전에는 "잘 자요" 또는 "좋은 꿈 꾸세요"라고 합니다.',
   'Farewell expressions in Korean vary by situation. When you are leaving, you say "안녕히 계세요" to the person who stays; when the other person is leaving, you say "안녕히 가세요." At the workplace, it is polite to say "먼저 가겠습니다, 수고하세요" when leaving before others. Among close friends, lighter farewells such as "잘 가," "나중에 봐," or "바이바이" are used. Before sleep, "잘 자요" or "좋은 꿈 꾸세요" is said.',
   1);
END $$;

-- ============================================================
-- LESSON 13: Self Introduction (자기소개)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=13;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=13 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '이름', 'ireum', 'name', 1),
  (l_id, '나이', 'nai', 'age', 2),
  (l_id, '나라', 'nara', 'country', 3),
  (l_id, '직업', 'jigeop', 'occupation / job', 4),
  (l_id, '학생', 'haksaeng', 'student', 5),
  (l_id, '회사원', 'hoesawon', 'office worker', 6),
  (l_id, '선생님', 'seonsaengnim', 'teacher', 7),
  (l_id, '취미', 'chwimi', 'hobby', 8),
  (l_id, '저', 'jeo', 'I / me (formal/polite)', 9),
  (l_id, '저는', 'jeoneun', 'as for me (topic marker)', 10),
  (l_id, '~이에요/예요', '-i-eyo/-yeyo', 'am/is/are (polite copula)', 11),
  (l_id, '반갑습니다', 'bangapseumnida', 'pleased to meet you', 12),
  (l_id, '~(이)라고 합니다', '-(i)rago hamnida', 'I am called ~ (name introduction)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Polite Copula: ~이에요 / ~예요',
   'Noun + 이에요 (consonant-final) / Noun + 예요 (vowel-final)',
   'The polite form of "to be" is ~이에요 after consonant-final nouns and ~예요 after vowel-final nouns. This is the everyday polite identification structure.',
   '[{"korean":"저는 학생이에요.","english":"I am a student. (학생 ends in consonant ㅇ)"},{"korean":"저는 마리아예요.","english":"I am Maria. (마리아 ends in vowel)"},{"korean":"제 직업은 선생님이에요.","english":"My job is teacher."}]',
   1),
  (l_id,
   'Formal Copula: ~입니다',
   'Noun + 입니다 (formal)',
   '~입니다 is the formal version used in presentations, speeches, and professional introductions. It is more rigid and polished than ~이에요/예요.',
   '[{"korean":"저는 이민준입니다.","english":"I am Lee Minjun. (formal)"},{"korean":"저의 직업은 의사입니다.","english":"My occupation is doctor."},{"korean":"저는 한국 사람입니다.","english":"I am Korean."}]',
   2),
  (l_id,
   'Topic Marker 은/는 in Self-Introduction',
   '저는 + [Noun] + 이에요/예요',
   '은/는 marks the topic of the sentence. 저는 (as for me) is the standard opening of self-introductions. Using 저는 signals that all following predications are about you.',
   '[{"korean":"저는 수진이에요.","english":"I am Sujin."},{"korean":"저는 서울에서 왔어요.","english":"I came from Seoul."},{"korean":"저는 요리를 좋아해요.","english":"I like cooking."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '진행자', '자기소개를 해 주세요.', 'Jagisogaereul hae juseyo.', 'Please introduce yourself.', 1),
  (l_id, '수진', '안녕하세요! 저는 박수진이라고 합니다. 서울에서 왔어요.', 'Annyeonghaseyo! Jeoneun Bak Sujin-irago hamnida. Seoul-eseo wasseoyo.', 'Hello! My name is Park Sujin. I am from Seoul.', 2),
  (l_id, '수진', '저는 한국외국어대학교 3학년 학생이에요.', 'Jeoneun Hanguk Oegugeo Daehakgyo sam-hangnyeon haksaeng-i-eyo.', 'I am a third-year student at Hankuk University of Foreign Studies.', 3),
  (l_id, '수진', '전공은 스페인어예요. 취미는 독서와 여행이에요.', 'Jeongong-eun seupein-eo-yeyo. Chwimi-neun dokseowa yeohaeng-i-eyo.', 'My major is Spanish. My hobbies are reading and traveling.', 4),
  (l_id, '수진', '앞으로 잘 부탁드립니다!', 'Apeuro jal butakdeurimnida!', 'I look forward to getting to know you!', 5),
  (l_id, '진행자', '수진 씨, 나이가 어떻게 되세요?', 'Sujin ssi, nai-ga eotteoke doeseyo?', 'Sujin, how old are you?', 6),
  (l_id, '수진', '스물두 살이에요.', 'Seumuldu sal-i-eyo.', 'I am twenty-two years old.', 7),
  (l_id, '진행자', '감사합니다. 반갑습니다!', 'Gamsahamnida. Bangapseumnida!', 'Thank you. Nice to meet you!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "I am a student" in polite Korean?', '["저는 학생입니까?","저는 학생이에요.","저 학생.","나는 학생이다."]', 1, '저는 학생이에요. uses the polite copula ~이에요 correctly after the consonant-final noun 학생.', 1),
  (l_id, 'Maria (마리아) says "I am Maria." Which form is correct?', '["저는 마리아이에요.","저는 마리아예요.","저는 마리아입니까.","저는 마리아다."]', 1, 'After vowel-final nouns, use 예요 not 이에요. 마리아 ends in vowel ㅏ → 마리아예요.', 2),
  (l_id, 'What does 전공 mean?', '["hobby","nationality","major (field of study)","occupation"]', 2, '전공 (專攻) means one''s academic major or field of specialization.', 3),
  (l_id, 'In a formal presentation, which copula should you use?', '["~이에요/예요","~입니다","~야/이야","~이잖아요"]', 1, '~입니다 is the formal copula used in presentations, speeches, and formal introductions.', 4),
  (l_id, 'What is the polite word for "I/me" in Korean self-introduction?', '["나","저","우리","본인"]', 1, '저 is the polite/humble first-person pronoun. 나 is informal. 저 is always correct in polite/formal contexts.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '안녕하세요! 저는 김지훈이라고 합니다. 저는 인천에서 왔어요. 현재 서울에서 회사원으로 일하고 있습니다. 저의 회사는 강남에 있어요. 취미는 축구와 음악 감상이에요. 주말에는 친구들과 축구를 해요. 한국어를 배우는 외국인 친구들을 많이 사귀고 싶어요. 만나서 반갑습니다!',
   'Hello! My name is Kim Jihun. I am from Incheon. Currently I am working as an office worker in Seoul. My company is in Gangnam. My hobbies are soccer and listening to music. On weekends I play soccer with friends. I would like to make many foreign friends who are learning Korean. Nice to meet you!',
   1);
END $$;

-- ============================================================
-- LESSON 14: Native Korean Numbers (순우리말 숫자)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=14;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=14 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '하나', 'hana', 'one (native Korean)', 1),
  (l_id, '둘', 'dul', 'two (native Korean)', 2),
  (l_id, '셋', 'set', 'three (native Korean)', 3),
  (l_id, '넷', 'net', 'four (native Korean)', 4),
  (l_id, '다섯', 'daseot', 'five (native Korean)', 5),
  (l_id, '여섯', 'yeoseot', 'six (native Korean)', 6),
  (l_id, '일곱', 'ilgop', 'seven (native Korean)', 7),
  (l_id, '여덟', 'yeodeol', 'eight (native Korean)', 8),
  (l_id, '아홉', 'ahop', 'nine (native Korean)', 9),
  (l_id, '열', 'yeol', 'ten (native Korean)', 10),
  (l_id, '스물', 'seumul', 'twenty (native Korean)', 11),
  (l_id, '서른', 'seoreun', 'thirty (native Korean)', 12),
  (l_id, '한 시', 'han si', 'one o''clock', 13),
  (l_id, '두 시', 'du si', 'two o''clock', 14),
  (l_id, '살', 'sal', 'years old (age counter)', 15);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Native Korean Numbers Before Counters',
   'Hana/Dul/Set/Net → Han/Du/Se/Ne before counters',
   'The numbers 하나, 둘, 셋, 넷 change form when followed by a counter noun: they contract to 한, 두, 세, 네. This is a mandatory phonological reduction.',
   '[{"korean":"사과 한 개","english":"one apple — 하나 → 한 before 개"},{"korean":"책 두 권","english":"two books — 둘 → 두 before 권"},{"korean":"사람 세 명","english":"three people — 셋 → 세 before 명"}]',
   1),
  (l_id,
   'When to Use Native Korean Numbers',
   'Age (살), hours (시), counting objects (개, 명, 권, 잔, 마리...)',
   'Native Korean numbers are used with certain counters: 살 (age), 시 (hour), 개 (generic objects), 명 (people), 권 (books), 잔 (cups), 마리 (animals). They are also used in casual counting.',
   '[{"korean":"저는 스물세 살이에요.","english":"I am 23 years old."},{"korean":"지금 두 시예요.","english":"It is 2 o''clock now."},{"korean":"고양이 두 마리가 있어요.","english":"There are two cats."}]',
   2),
  (l_id,
   'Counting Up to 99 with Native Numbers',
   'Tens (열, 스물, 서른...) + Units (하나~아홉)',
   'Native Korean uses distinct words for each decade: 열(10), 스물(20), 서른(30), 마흔(40), 쉰(50), 예순(60), 일흔(70), 여든(80), 아흔(90). Combine with units to make compound numbers.',
   '[{"korean":"열다섯","english":"15 (yeol + daseot)"},{"korean":"스물일곱","english":"27 (seumul + ilgop)"},{"korean":"서른셋","english":"33 (seoreun + set)"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '점원', '몇 개 드릴까요?', 'Myeot gae deurilkkayo?', 'How many would you like?', 1),
  (l_id, '손님', '세 개 주세요.', 'Se gae juseyo.', 'Please give me three.', 2),
  (l_id, '점원', '감사합니다. 사과 세 개요?', 'Gamsahamnida. Sagwa se gaeyo?', 'Thank you. Three apples?', 3),
  (l_id, '손님', '네, 맞아요.', 'Ne, majayo.', 'Yes, that is right.', 4),
  (l_id, '친구1', '나이가 어떻게 돼?', 'Nai-ga eotteoke dwae?', 'How old are you?', 5),
  (l_id, '친구2', '나 스물다섯이야. 너는?', 'Na seumuldaseo-siya. Neoneun?', 'I am twenty-five. What about you?', 6),
  (l_id, '친구1', '나는 스물여섯이야.', 'Naneun seumulyeoseo-siya.', 'I am twenty-six.', 7),
  (l_id, '친구2', '한 살 많네!', 'Han sal manne!', 'You are one year older!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "three apples" in Korean?', '["사과 셋 개","사과 세 개","사과 삼 개","사과 셋개"]', 1, '셋 → 세 before counters. 사과 세 개 = three apples.', 1),
  (l_id, 'Which number system is used for telling the hour (시)?', '["Sino-Korean","Native Korean","Either","Neither"]', 1, 'Hours (시) use native Korean numbers: 한 시, 두 시, 세 시...', 2),
  (l_id, 'How old is someone who is 스물여덟 살?', '["27","28","29","38"]', 1, '스물(20) + 여덟(8) = 28. So 스물여덟 살 = 28 years old.', 3),
  (l_id, 'Which is the correct native Korean word for 7?', '["여섯","일곱","여덟","아홉"]', 1, '일곱 = 7. 여섯=6, 여덟=8, 아홉=9.', 4),
  (l_id, '"두 명이에요" means:', '["It is two o''clock","There are two people","I am two years old","Two (generic objects)"]', 1, '명 is the counter for people. 두 명이에요 = There are two people.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에는 숫자 체계가 두 가지 있습니다. 순우리말 숫자와 한자어 숫자입니다. 순우리말 숫자는 하나, 둘, 셋, 넷으로 시작합니다. 이 숫자들은 나이를 말할 때, 시간의 "시"를 말할 때, 그리고 개, 명, 권 등의 단위와 함께 씁니다. 단위 앞에서 하나는 한, 둘은 두, 셋은 세, 넷은 네로 바뀝니다. 예를 들어 "사과 세 개"처럼 씁니다.',
   'Korean has two number systems: native Korean numbers and Sino-Korean numbers. Native Korean numbers begin with 하나, 둘, 셋, 넷. These numbers are used when talking about age, when saying the hour ("시"), and with counting units such as 개, 명, and 권. Before a counter, 하나 becomes 한, 둘 becomes 두, 셋 becomes 세, and 넷 becomes 네. For example, "사과 세 개" (three apples) illustrates this pattern.',
   1);
END $$;

-- ============================================================
-- LESSON 15: Sino-Korean Numbers (한자어 숫자)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=15;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=15 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '일', 'il', 'one (Sino-Korean)', 1),
  (l_id, '이', 'i', 'two (Sino-Korean)', 2),
  (l_id, '삼', 'sam', 'three (Sino-Korean)', 3),
  (l_id, '사', 'sa', 'four (Sino-Korean)', 4),
  (l_id, '오', 'o', 'five (Sino-Korean)', 5),
  (l_id, '육', 'yuk', 'six (Sino-Korean)', 6),
  (l_id, '칠', 'chil', 'seven (Sino-Korean)', 7),
  (l_id, '팔', 'pal', 'eight (Sino-Korean)', 8),
  (l_id, '구', 'gu', 'nine (Sino-Korean)', 9),
  (l_id, '십', 'sip', 'ten (Sino-Korean)', 10),
  (l_id, '백', 'baek', 'hundred (Sino-Korean)', 11),
  (l_id, '천', 'cheon', 'thousand (Sino-Korean)', 12),
  (l_id, '만', 'man', 'ten-thousand (Sino-Korean)', 13),
  (l_id, '원', 'won', 'Korean monetary unit (won)', 14),
  (l_id, '층', 'cheung', 'floor/story (counter for floors)', 15);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'When to Use Sino-Korean Numbers',
   'Money (원), floors (층), minutes (분), months (월), dates (일), phone numbers, addresses',
   'Sino-Korean numbers are used with: money (원), minutes (분), months (월), dates (일), floors (층), phone numbers, street numbers, and large quantities. They follow a positional system identical to Chinese/Japanese.',
   '[{"korean":"오천 원이에요.","english":"It is 5,000 won."},{"korean":"삼 층이에요.","english":"It is the third floor."},{"korean":"삼십 분이에요.","english":"It is thirty minutes."}]',
   1),
  (l_id,
   'Building Large Numbers',
   '천(1,000) + 백(100) + 십(10) + 일(1)',
   'Numbers above 10 are built by multiplication + addition: 십이(12) = 십+이, 오십칠(57) = 오×십+칠, 삼백(300) = 삼×백. Note: 일십 is NOT used — just 십 for ten.',
   '[{"korean":"십오 [15]","english":"십(10) + 오(5)"},{"korean":"이백삼십사 [234]","english":"이(2)×백(100) + 삼(3)×십(10) + 사(4)"},{"korean":"오만 원 [50,000원]","english":"오(5)×만(10,000) won"}]',
   2),
  (l_id,
   'Mixed Usage: 시 (Native) + 분 (Sino)',
   'Time expression: [Native number] 시 [Sino number] 분',
   'Telling time uses a mixed system: the hour (시) uses native Korean numbers, while the minutes (분) use Sino-Korean numbers.',
   '[{"korean":"두 시 삼십 분","english":"2:30 (two hours, thirty minutes)"},{"korean":"열두 시 오 분","english":"12:05"},{"korean":"한 시 십오 분","english":"1:15"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '직원', '전화번호가 어떻게 되세요?', 'Jeonhwa beonho-ga eotteoke doeseyo?', 'What is your phone number?', 1),
  (l_id, '손님', '공일공-이삼사오-육칠팔구예요.', 'Gong-il-gong-i-sam-sa-o-yuk-chil-pal-gu-yeyo.', 'It is 010-2345-6789.', 2),
  (l_id, '직원', '생년월일은요?', 'Saengnyeon-woril-eunyo?', 'And your date of birth?', 3),
  (l_id, '손님', '구십팔년 오월 십이일이에요.', 'Gusip-pal-nyeon o-wol sip-i-il-i-eyo.', 'It is May 12, 1998.', 4),
  (l_id, '친구', '이 가방 얼마예요?', 'I gabang eolma-yeyo?', 'How much is this bag?', 5),
  (l_id, '점원', '삼만 오천 원이에요.', 'Samman ocheon won-i-eyo.', 'It is 35,000 won.', 6),
  (l_id, '친구', '좀 비싸네요. 깎아 주세요.', 'Jom bissaneyo. Kkakka juseyo.', 'It is a bit expensive. Please give me a discount.', 7),
  (l_id, '점원', '그럼 삼만 원에 드릴게요.', 'Geureom saman won-e deurilgeyo.', 'Then I will give it to you for 30,000 won.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which number system is used for the floor of a building (층)?', '["Native Korean","Sino-Korean","Either","Neither"]', 1, 'Floors (층) use Sino-Korean numbers: 일 층, 이 층, 삼 층...', 1),
  (l_id, 'How do you say "3:45" in Korean?', '["세 시 사십오 분","삼 시 사십오 분","셋 시 마흔다섯 분","세 시 마흔다섯 분"]', 0, 'Hours use native Korean (세 시), minutes use Sino-Korean (사십오 분). → 세 시 사십오 분.', 2),
  (l_id, 'How do you say 15,000 won?', '["십오만 원","일만오천 원","만오천 원","천오백 원"]', 2, '만(10,000) + 오천(5,000) = 15,000. 만오천 원 is the correct form (일 is dropped before 만).', 3),
  (l_id, 'What does 삼십이 mean?', '["302","23","32","320"]', 2, '삼십(30) + 이(2) = 32.', 4),
  (l_id, 'For phone numbers in Korean, which number system is used?', '["Native Korean","Sino-Korean","Mixed","Neither"]', 1, 'Phone numbers use Sino-Korean numbers (including 공 for zero).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어의 한자어 숫자는 일, 이, 삼, 사, 오, 육, 칠, 팔, 구, 십으로 구성됩니다. 한자어 숫자는 돈(원), 날짜(월, 일), 분, 층, 전화번호 등에 사용됩니다. 큰 숫자는 십, 백, 천, 만 단위로 표현합니다. 한국어에서 10,000은 "만"이라는 단위를 사용하는 것이 특징입니다. 예를 들어 50,000원은 "오만 원"이라고 합니다. 시간을 말할 때는 "시"는 순우리말 숫자를, "분"은 한자어 숫자를 씁니다.',
   'Sino-Korean numbers consist of 일, 이, 삼, 사, 오, 육, 칠, 팔, 구, and 십. They are used with money (won), dates (months and days), minutes, floors, phone numbers, and more. Large numbers are expressed in units of 십, 백, 천, and 만. A characteristic of Korean is that it uses the unit 만 for 10,000. For example, 50,000 won is said as "오만 원." When telling time, native Korean numbers are used for the hour (시), while Sino-Korean numbers are used for the minutes (분).',
   1);
END $$;

-- ============================================================
-- LESSON 16: Days of the Week (요일)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=16;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=16 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '월요일', 'woryoil', 'Monday (月曜日 — Moon day)', 1),
  (l_id, '화요일', 'hwayoil', 'Tuesday (火曜日 — Fire day)', 2),
  (l_id, '수요일', 'suyoil', 'Wednesday (水曜日 — Water day)', 3),
  (l_id, '목요일', 'mogyoil', 'Thursday (木曜日 — Wood day)', 4),
  (l_id, '금요일', 'geumyoil', 'Friday (金曜日 — Gold/Metal day)', 5),
  (l_id, '토요일', 'toyoil', 'Saturday (土曜日 — Earth day)', 6),
  (l_id, '일요일', 'iryoil', 'Sunday (日曜日 — Sun day)', 7),
  (l_id, '무슨 요일', 'museun yoil', 'what day of the week', 8),
  (l_id, '주중', 'jujung', 'weekday(s)', 9),
  (l_id, '주말', 'jumal', 'weekend', 10),
  (l_id, '평일', 'pyeongil', 'weekday (non-holiday workday)', 11),
  (l_id, '다음 주', 'daeum ju', 'next week', 12),
  (l_id, '이번 주', 'ibeon ju', 'this week', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Asking and Answering the Day of the Week',
   '오늘이 무슨 요일이에요? / 오늘은 [요일]이에요.',
   'The question "What day is it today?" uses the interrogative 무슨 (what kind of). The answer names the day followed by the copula.',
   '[{"korean":"오늘이 무슨 요일이에요?","english":"What day is it today?"},{"korean":"오늘은 수요일이에요.","english":"Today is Wednesday."},{"korean":"내일은 무슨 요일이에요?","english":"What day is tomorrow?"}]',
   1),
  (l_id,
   'Scheduling with Days: ~에 (time particle)',
   '[Day of week] + 에 + [activity]',
   '에 marks a specific point in time. Used after days of the week, times, and dates to indicate when something happens.',
   '[{"korean":"월요일에 학교에 가요.","english":"I go to school on Monday."},{"korean":"금요일에 뭐 해요?","english":"What are you doing on Friday?"},{"korean":"주말에 쉬어요.","english":"I rest on weekends."}]',
   2),
  (l_id,
   '이번/다음/지난 + 주/요일',
   '이번 주 [요일] = this [day]; 다음 주 [요일] = next [day]; 지난 주 [요일] = last [day]',
   'These time expressions are built by combining 이번(this)/다음(next)/지난(last) with 주(week) or directly with a day of the week.',
   '[{"korean":"이번 주 금요일에 만나요.","english":"Let''s meet this Friday."},{"korean":"다음 주 월요일에 시험이 있어요.","english":"There is an exam next Monday."},{"korean":"지난주 수요일에 뭐 했어요?","english":"What did you do last Wednesday?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이번 주 토요일에 뭐 해요?', 'Ibeon ju toyoil-e mwo haeyo?', 'What are you doing this Saturday?', 1),
  (l_id, '민준', '특별한 계획이 없어요. 왜요?', 'Teukbyeolhan gyehoek-i eopseoyo. Waeyo?', 'I have no special plans. Why?', 2),
  (l_id, '수진', '같이 영화 볼래요?', 'Gachi yeonghwa bolraeyo?', 'Would you like to watch a movie together?', 3),
  (l_id, '민준', '좋아요! 몇 시에요?', 'Joayo! Myeot si-eyo?', 'Sounds good! What time?', 4),
  (l_id, '수진', '오후 세 시 어때요?', 'Ohu se si eottaeyo?', 'How about 3 PM?', 5),
  (l_id, '민준', '좋아요. 오후 세 시에 어디서 만나요?', 'Joayo. Ohu se si-e eodiseo mannayo?', 'Great. Where do we meet at 3 PM?', 6),
  (l_id, '수진', '홍대 CGV 앞에서 만나요.', 'Hongdae CGV ape-seo mannayo.', 'Let''s meet in front of CGV in Hongdae.', 7),
  (l_id, '민준', '알겠어요. 토요일에 봐요!', 'Algesseoyo. Toyoil-e bwayo!', 'Got it. See you Saturday!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What does 금요일 literally refer to? (the Chinese character element)', '["Water","Wood","Gold/Metal","Earth"]', 2, '금(金) means gold/metal. 금요일 = Metal day = Friday.', 1),
  (l_id, 'How do you say "on Wednesday" (time particle)?', '["수요일이","수요일에","수요일을","수요일은"]', 1, 'The time particle 에 is used after days of the week: 수요일에 = on Wednesday.', 2),
  (l_id, 'What is the Korean word for "weekend"?', '["주중","평일","주말","다음 주"]', 2, '주말 = weekend. 주중/평일 = weekday.', 3),
  (l_id, 'Which day of the week is associated with the Moon (月)?', '["화요일","월요일","목요일","일요일"]', 1, '월(月) = Moon. 월요일 = Moon day = Monday.', 4),
  (l_id, '"다음 주 화요일에 만나요" means:', '["Let''s meet last Tuesday","Let''s meet this Tuesday","Let''s meet next Tuesday","We met next Tuesday"]', 2, '다음 주 = next week, 화요일 = Tuesday, -에 = on. → Let''s meet next Tuesday.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국의 요일 이름은 중국의 오행 사상에서 왔습니다. 월요일(月), 화요일(火), 수요일(水), 목요일(木), 금요일(金)은 각각 달, 불, 물, 나무, 금속을 뜻하고, 토요일(土)은 흙, 일요일(日)은 태양을 의미합니다. 한국에서 월요일부터 금요일까지는 평일이고, 토요일과 일요일은 주말입니다. 약속을 잡을 때는 "~요일에"라는 표현을 씁니다. 예를 들어 "이번 주 금요일에 만나요"처럼 말합니다.',
   'The names of the days of the week in Korea come from the Chinese Five Elements. 월요일(月), 화요일(火), 수요일(水), 목요일(木), and 금요일(金) represent the moon, fire, water, wood, and metal respectively, while 토요일(土) means earth and 일요일(日) means the sun. In Korea, Monday through Friday are weekdays, and Saturday and Sunday are the weekend. When making plans, the expression "~요일에" is used — for example, "이번 주 금요일에 만나요" (Let''s meet this Friday).',
   1);
END $$;

-- ============================================================
-- LESSON 17: Telling Time (시간 말하기)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=17;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=17 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '시', 'si', 'o''clock / hour (native Korean counter)', 1),
  (l_id, '분', 'bun', 'minute (Sino-Korean counter)', 2),
  (l_id, '초', 'cho', 'second', 3),
  (l_id, '오전', 'ojeon', 'AM / morning', 4),
  (l_id, '오후', 'ohu', 'PM / afternoon', 5),
  (l_id, '지금', 'jigeum', 'now', 6),
  (l_id, '몇 시예요?', 'myeot si-yeyo?', 'What time is it?', 7),
  (l_id, '반', 'ban', 'half (30 minutes)', 8),
  (l_id, '정각', 'jeong-gak', 'on the dot / exactly (on the hour)', 9),
  (l_id, '~시간', '-sigan', 'hours (duration)', 10),
  (l_id, '한 시간', 'han sigan', 'one hour (duration)', 11),
  (l_id, '일찍', 'iljjik', 'early', 12),
  (l_id, '늦게', 'neutge', 'late', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Telling the Time: Hour + Minute Structure',
   '[Native #] 시 [Sino #] 분',
   'Korean time expressions always put the hour (시) first using native Korean numbers, followed by the minute (분) using Sino-Korean numbers. This mixed system is non-negotiable.',
   '[{"korean":"지금 몇 시예요?","english":"What time is it now?"},{"korean":"세 시 이십 분이에요.","english":"It is 3:20."},{"korean":"열두 시 반이에요.","english":"It is 12:30. (반 = half)"}]',
   1),
  (l_id,
   'Duration vs. Point in Time',
   'Duration: [Native #] 시간 / Point: [Native #] 시 [에]',
   'Be careful to distinguish between time-point expressions (시 = o''clock) and duration expressions (시간 = hours). 두 시 = 2 o''clock; 두 시간 = two hours.',
   '[{"korean":"두 시에 만나요.","english":"Let''s meet at 2 o''clock."},{"korean":"두 시간 걸려요.","english":"It takes two hours."},{"korean":"한 시간 반 공부했어요.","english":"I studied for one and a half hours."}]',
   2),
  (l_id,
   'AM/PM and Clock Context',
   '오전 [time] = AM; 오후 [time] = PM',
   'Korean uses 오전 (before noon) and 오후 (after noon) before the time expression, similar to English AM/PM. Context often makes these unnecessary.',
   '[{"korean":"오전 여덟 시에 일어나요.","english":"I wake up at 8 AM."},{"korean":"오후 두 시에 수업이 있어요.","english":"I have class at 2 PM."},{"korean":"밤 열두 시에 자요.","english":"I sleep at midnight (12 AM)."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '실례합니다. 지금 몇 시예요?', 'Silrye hamnida. Jigeum myeot si-yeyo?', 'Excuse me. What time is it now?', 1),
  (l_id, '민준', '오후 두 시 반이에요.', 'Ohu du si ban-i-eyo.', 'It is 2:30 PM.', 2),
  (l_id, '수진', '감사해요! 영화가 세 시에 시작해요.', 'Gamsahaeyo! Yeonghwa-ga se si-e sijakaeyo.', 'Thank you! The movie starts at 3.', 3),
  (l_id, '민준', '그럼 삼십 분 남았네요.', 'Geureom samsip bun namassneyo.', 'Then there are thirty minutes left.', 4),
  (l_id, '수진', '영화가 몇 시간이에요?', 'Yeonghwa-ga myeot sigan-i-eyo?', 'How many hours is the movie?', 5),
  (l_id, '민준', '두 시간 십 분이에요.', 'Du sigan sip bun-i-eyo.', 'It is two hours and ten minutes.', 6),
  (l_id, '수진', '그럼 다섯 시 십 분에 끝나겠네요.', 'Geureom daseot si sip bun-e kkeunna-gesneyo.', 'Then it will end at 5:10.', 7),
  (l_id, '민준', '맞아요. 끝나고 저녁 먹어요.', 'Majayo. Kkeunago jeonyeok meogeoyo.', 'That''s right. After it ends, let''s have dinner.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What time is "열한 시 오십오 분"?', '["10:55","11:55","11:50","10:50"]', 1, '열한(11) 시 오십오(55) 분 = 11:55.', 1),
  (l_id, 'How do you say "two hours" (duration)?', '["두 시","두 시에","두 시간","이 시간"]', 2, '두 시간 = two hours (duration). 두 시 = 2 o''clock (time point).', 2),
  (l_id, 'Which number system is used for minutes (분)?', '["Native Korean","Sino-Korean","Either","Both simultaneously"]', 1, 'Minutes (분) always use Sino-Korean numbers: 십 분, 삼십 분, 사십오 분...', 3),
  (l_id, 'How do you express 7:30?', '["칠 시 반","일곱 시 삼십 분","일곱 시 반","a and c are both correct"]', 3, 'Both 일곱 시 삼십 분 and 일곱 시 반 are correct. 반 means half = 30 minutes.', 4),
  (l_id, '"오전 열 시" means:', '["10 PM","10 AM","10 hours","10:00 exactly"]', 1, '오전 = AM. 열 시 = 10 o''clock (native Korean). Together: 10 AM.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어로 시간을 말할 때는 두 가지 숫자 체계를 함께 씁니다. "시"는 순우리말 숫자를 사용하고, "분"은 한자어 숫자를 사용합니다. 예를 들어 "세 시 삼십 분"은 3시 30분을 의미합니다. "반"은 30분을 뜻하므로 "세 시 반"이라고도 할 수 있습니다. 오전은 낮 12시 이전, 오후는 낮 12시 이후를 나타냅니다. 시간의 길이를 말할 때는 "시간"을 씁니다. 예를 들어 "두 시간"은 2시간의 길이를 뜻합니다.',
   'When telling time in Korean, two number systems are used together. Native Korean numbers are used for the hour (시) and Sino-Korean numbers for the minutes (분). For example, "세 시 삼십 분" means 3:30. Since 반 means 30 minutes, it can also be expressed as "세 시 반." 오전 refers to before noon (AM) and 오후 to after noon (PM). When talking about the length of time, 시간 is used — for example, "두 시간" means a duration of two hours.',
   1);
END $$;

-- ============================================================
-- LESSON 18: Colors (색깔)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=18;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=18 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '빨간색', 'ppalgansaek', 'red', 1),
  (l_id, '파란색', 'paransaek', 'blue', 2),
  (l_id, '노란색', 'noransaek', 'yellow', 3),
  (l_id, '초록색', 'choroksaek', 'green', 4),
  (l_id, '하얀색', 'hayansaek', 'white', 5),
  (l_id, '검은색', 'geomeunsaek', 'black', 6),
  (l_id, '분홍색', 'bunhongsaek', 'pink', 7),
  (l_id, '보라색', 'borasaek', 'purple', 8),
  (l_id, '주황색', 'juhwangsaek', 'orange', 9),
  (l_id, '갈색', 'galsaek', 'brown', 10),
  (l_id, '회색', 'hoesaek', 'grey', 11),
  (l_id, '무슨 색', 'museun saek', 'what color', 12),
  (l_id, '색깔', 'saekkal', 'color', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Color Adjectives: Descriptive Verb Forms',
   'Noun + 이에요: 빨간색이에요 / Descriptive verb: 빨개요',
   'Colors in Korean can be expressed as nouns (~색이에요) or as descriptive verbs (~아요/어요). Native Korean color roots: 빨갛다(red), 파랗다(blue), 노랗다(yellow), 하얗다(white), 까맣다(black).',
   '[{"korean":"이 가방은 빨간색이에요.","english":"This bag is red. (noun form)"},{"korean":"하늘이 파래요.","english":"The sky is blue. (descriptive verb 파랗다→파래요)"},{"korean":"꽃이 노래요.","english":"The flower is yellow."}]',
   1),
  (l_id,
   'ㅎ Irregular Descriptive Verbs (ㅎ 불규칙)',
   'ㅎ-stem + 아/어 → ㅎ drops, vowels contract',
   'Color descriptive verbs ending in ㅎ are irregular. When followed by -아/어, the ㅎ is dropped and the remaining vowel contracts with the ending: 파랗다 → 파래요, 노랗다 → 노래요.',
   '[{"korean":"파랗다 → 파래요","english":"to be blue → is blue"},{"korean":"노랗다 → 노래요","english":"to be yellow → is yellow"},{"korean":"하얗다 → 하얘요","english":"to be white → is white"}]',
   2),
  (l_id,
   'Modifying Nouns with Colors',
   '[Color adjective form] + Noun',
   'To use a color to modify a noun, use the adjective modifier form: 빨간 + 차(car) = 빨간 차 (red car). The modifier form drops -색 and changes the verb: 빨갛다 → 빨간, 파랗다 → 파란.',
   '[{"korean":"빨간 장미","english":"red rose"},{"korean":"파란 하늘","english":"blue sky"},{"korean":"하얀 눈","english":"white snow"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이 원피스 어때요? 색깔이 예쁘죠?', 'I wonpisu eottaeyo? Saekkal-i yeppujiyo?', 'What do you think of this dress? The color is pretty, right?', 1),
  (l_id, '민준', '네, 보라색이 정말 잘 어울려요.', 'Ne, borasaek-i jeongmal jal eoullyeoyo.', 'Yes, purple really suits you.', 2),
  (l_id, '수진', '파란색은요? 이것도 봤어요?', 'Paransaek-eunyo? Igeotdo bwasseoyo?', 'What about the blue one? Did you see this too?', 3),
  (l_id, '민준', '파란색도 예쁜데, 보라색이 더 잘 어울려요.', 'Paransaekdo yeppeunde, borasaek-i deo jal eoullyeoyo.', 'The blue is pretty too, but the purple suits you better.', 4),
  (l_id, '수진', '그럼 보라색으로 살게요!', 'Geureom borasaeg-euro salgeyo!', 'Then I will buy the purple one!', 5),
  (l_id, '점원', '안목이 좋으세요! 그 색이 올해 유행이에요.', 'Anmog-i jo-euseyo! Geu saek-i olhae yuhaeng-i-eyo.', 'You have great taste! That color is trendy this year.', 6),
  (l_id, '수진', '그래요? 더 기쁘네요!', 'Geureayo? Deo gippeuneyo!', 'Really? That makes me even happier!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which is the correct polite form of 노랗다 (to be yellow)?', '["노랗아요","노라요","노래요","노랗어요"]', 2, 'ㅎ irregular: 노랗다 → ㅎ drops + 아 contracts → 노래요.', 1),
  (l_id, 'How do you ask "What color is it?" in Korean?', '["어떤 색이에요?","무슨 색이에요?","색이 뭐예요?","b and c are both natural"]', 3, 'Both 무슨 색이에요? and 색이 뭐예요? are natural ways to ask about color in Korean.', 2),
  (l_id, 'What is the modifier form of 빨갛다 (red) used before a noun?', '["빨간","빨갛은","빨가운","빨강"]', 0, '빨갛다 → 빨간 (modifier form). E.g., 빨간 사과 (red apple).', 3),
  (l_id, 'What color is 회색?', '["brown","black","grey","pink"]', 2, '회색 (灰色) = grey/gray.', 4),
  (l_id, '"파란 하늘" means:', '["pink sky","blue sky","white sky","green sky"]', 1, '파란 = blue (modifier form of 파랗다). 하늘 = sky. → blue sky.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '색깔을 한국어로 표현하는 방법은 두 가지가 있습니다. 명사형으로는 "빨간색이에요"처럼 말하고, 형용사형으로는 "빨개요"처럼 말합니다. 한국어 고유어 색깔 형용사는 ㅎ 불규칙 활용을 합니다. 예를 들어 파랗다는 파래요, 노랗다는 노래요로 변합니다. 명사 앞에서는 "파란 하늘", "빨간 꽃"처럼 씁니다. 색깔을 이용해 물건이나 사람을 묘사하면 한국어 표현이 더 풍부해집니다.',
   'There are two ways to express colors in Korean. As a noun, one says "빨간색이에요," and as an adjective, "빨개요." Native Korean color adjectives follow the ㅎ irregular conjugation. For example, 파랗다 (to be blue) becomes 파래요, and 노랗다 (to be yellow) becomes 노래요. Before nouns, the modifier form is used: "파란 하늘" (blue sky), "빨간 꽃" (red flower). Using colors to describe objects and people enriches Korean expression greatly.',
   1);
END $$;

-- ============================================================
-- LESSON 19: Family Members (가족)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=19;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=19 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '가족', 'gajok', 'family', 1),
  (l_id, '아버지/아빠', 'abeoji/appa', 'father / dad', 2),
  (l_id, '어머니/엄마', 'eomeoni/eomma', 'mother / mom', 3),
  (l_id, '형', 'hyeong', 'older brother (said by a male)', 4),
  (l_id, '오빠', 'oppa', 'older brother (said by a female)', 5),
  (l_id, '누나', 'nuna', 'older sister (said by a male)', 6),
  (l_id, '언니', 'eonni', 'older sister (said by a female)', 7),
  (l_id, '남동생', 'namdongsaeng', 'younger brother', 8),
  (l_id, '여동생', 'yeodongsaeng', 'younger sister', 9),
  (l_id, '할아버지', 'harabeoji', 'grandfather', 10),
  (l_id, '할머니', 'halmeoni', 'grandmother', 11),
  (l_id, '남편', 'nampyeon', 'husband', 12),
  (l_id, '아내', 'anae', 'wife', 13),
  (l_id, '아들', 'adeul', 'son', 14),
  (l_id, '딸', 'ttal', 'daughter', 15);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'My Family vs. Your Family (Humble vs. Honorific)',
   'My family members: humble forms / Others'' family: honorific forms',
   'Korean has parallel sets of family terms: humble forms used when referring to your own family to others, and honorific forms for the other person''s family. E.g., 아버지 (my father) vs. 아버님 (your father / father-in-law honorific).',
   '[{"korean":"저희 아버지는 의사예요.","english":"My father is a doctor. (humble 저희)"},{"korean":"아버님께서 오셨어요?","english":"Has your father arrived? (honorific 아버님)"},{"korean":"어머니가 요리를 잘 하세요.","english":"My mother cooks well."}]',
   1),
  (l_id,
   'Gender-Specific Sibling Terms',
   'Male speaker: 형(older bro), 누나(older sis) / Female speaker: 오빠(older bro), 언니(older sis)',
   'Korean sibling terms depend on the speaker''s gender, not the sibling''s gender. A male speaker calls his older brother 형 and his older sister 누나. A female speaker calls her older brother 오빠 and her older sister 언니.',
   '[{"korean":"저는 형이 한 명 있어요.","english":"I have one older brother. (male speaker)"},{"korean":"저는 오빠가 두 명 있어요.","english":"I have two older brothers. (female speaker)"},{"korean":"언니가 정말 예뻐요.","english":"My older sister is really pretty. (female speaker)"}]',
   2),
  (l_id,
   '저희 (Humble We / Our) in Family Context',
   '저희 + family member = my [family member] (humble)',
   '저희 is the humble form of 우리 used when referring to one''s own family, home, or group. It signals humility toward the listener.',
   '[{"korean":"저희 가족은 네 명이에요.","english":"My family has four members."},{"korean":"저희 집에 오세요.","english":"Please come to my house."},{"korean":"저희 아들이 내년에 대학교에 가요.","english":"My son goes to university next year."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '가족이 몇 명이에요?', 'Gajok-i myeot myeong-i-eyo?', 'How many people are in your family?', 1),
  (l_id, '수진', '네 명이에요. 부모님, 언니, 그리고 저요.', 'Ne myeong-i-eyo. Bumonim, eonni, geurigo jeyo.', 'There are four of us. My parents, my older sister, and me.', 2),
  (l_id, '민준', '언니가 어디에서 살아요?', 'Eonni-ga eodie-seo sarayo?', 'Where does your older sister live?', 3),
  (l_id, '수진', '언니는 결혼해서 부산에 살아요. 민준 씨 가족은요?', 'Eonni-neun gyeolhonhaeseo Busan-e sarayo. Minjun ssi gajok-eunyo?', 'My older sister is married and lives in Busan. What about your family?', 4),
  (l_id, '민준', '저는 외동아들이에요. 그래서 부모님이 많이 걱정하세요.', 'Jeoneun oedong-adeul-i-eyo. Geuraeseo bumonim-i mani geokjeonghaseyo.', 'I am an only child. So my parents worry a lot.', 5),
  (l_id, '수진', '외동이시군요. 외롭지 않아요?', 'Oedong-i-sigunyo. Oeroeopji anayo?', 'So you are an only child. Don''t you get lonely?', 6),
  (l_id, '민준', '가끔이요. 그래도 친구들이 많아서 괜찮아요.', 'Gakkeumyo. Geuraedo chingudeul-i manaseo gwaenchanayo.', 'Sometimes. But it is okay because I have many friends.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'A male speaker refers to his older sister as:', '["언니","누나","오빠","형"]', 1, 'Male speakers use 누나 for older sister. Female speakers use 언니.', 1),
  (l_id, 'How does a female speaker refer to her older brother?', '["형","남동생","오빠","언니"]', 2, 'Female speakers use 오빠 for older brother. Male speakers use 형.', 2),
  (l_id, 'Which is the correct humble form meaning "our family"?', '["우리 가족","저희 가족","나의 가족","본인 가족"]', 1, '저희 가족 is the humble/polite form. 우리 가족 is also common but slightly less formal.', 3),
  (l_id, '"부모님" refers to:', '["grandparents","parents","siblings","in-laws"]', 1, '부모님 = 부모(parents) + 님(honorific suffix) = parents (respectful).', 4),
  (l_id, 'Which term is used for "grandfather"?', '["할머니","아버지","할아버지","삼촌"]', 2, '할아버지 = grandfather. 할머니 = grandmother.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어의 가족 호칭은 매우 다양합니다. 특히 형제자매를 부를 때는 말하는 사람의 성별에 따라 달라집니다. 남성이 형이라고 부르면 남자 형제, 누나라고 부르면 여자 형제를 말합니다. 여성은 오빠(남자 형제), 언니(여자 형제)라고 합니다. 한국에서는 자신의 가족을 남에게 말할 때 겸손한 표현을 씁니다. 예를 들어 "저희 아버지"나 "저희 어머니"처럼 "저희"를 씁니다. 상대방의 가족에 대해서는 높임말을 씁니다.',
   'Family terms in Korean are very varied. In particular, sibling terms differ depending on the speaker''s gender. When a male says 형, he means an older male sibling; 누나 refers to an older female sibling. Females use 오빠 (older male sibling) and 언니 (older female sibling). In Korea, humble expressions are used when talking about one''s own family to others. For example, "저희 아버지" or "저희 어머니" uses the humble form 저희. Honorific language is used when referring to the other person''s family.',
   1);
END $$;

-- ============================================================
-- LESSON 20: Food and Drinks (음식과 음료)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=20;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=20 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '밥', 'bap', 'cooked rice; meal', 1),
  (l_id, '김치', 'kimchi', 'kimchi (fermented vegetables)', 2),
  (l_id, '불고기', 'bulgogi', 'bulgogi (marinated grilled beef)', 3),
  (l_id, '비빔밥', 'bibimbap', 'bibimbap (mixed rice bowl)', 4),
  (l_id, '된장찌개', 'doenjang jjigae', 'soybean paste stew', 5),
  (l_id, '라면', 'ramyeon', 'instant noodles / ramen', 6),
  (l_id, '물', 'mul', 'water', 7),
  (l_id, '커피', 'keopi', 'coffee', 8),
  (l_id, '녹차', 'nokcha', 'green tea', 9),
  (l_id, '주스', 'juseu', 'juice', 10),
  (l_id, '맥주', 'maekju', 'beer', 11),
  (l_id, '맛있다', 'masitda', 'to be delicious', 12),
  (l_id, '먹다', 'meokda', 'to eat', 13),
  (l_id, '마시다', 'masida', 'to drink', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Taste and Preference',
   '~이/가 맛있어요/맛없어요 / ~을/를 좋아해요/싫어해요',
   'To say food is delicious, use 맛있어요. To say you like a food, use 좋아해요 with the object particle 을/를.',
   '[{"korean":"이 김치가 맛있어요.","english":"This kimchi is delicious."},{"korean":"저는 비빔밥을 좋아해요.","english":"I like bibimbap."},{"korean":"맵지만 맛있어요.","english":"It is spicy but delicious."}]',
   1),
  (l_id,
   'Offering Food: ~드세요 / ~드릴까요?',
   '[Food/drink] + 드세요 (have some) / 드릴까요? (shall I give you?)',
   '드시다 is the honorific form of 먹다/마시다 (to eat/drink). 드세요 = please eat/drink. 드릴까요? = Shall I give you...? Use these when offering food or drink politely.',
   '[{"korean":"커피 드세요.","english":"Please have some coffee."},{"korean":"뭐 드릴까요?","english":"What would you like? (lit. Shall I give you something?)"},{"korean":"밥 드셨어요?","english":"Have you eaten? (standard Korean greeting)"}]',
   2),
  (l_id,
   'Counter for Food and Drinks',
   'Food: 그릇(bowl), 개(piece), 인분(serving) / Drinks: 잔(glass/cup), 병(bottle)',
   'Specific counters are used for food portions and drinks. 인분 is especially useful at restaurants.',
   '[{"korean":"비빔밥 두 그릇 주세요.","english":"Two bowls of bibimbap please."},{"korean":"커피 한 잔 주세요.","english":"One cup of coffee please."},{"korean":"삼겹살 이 인분 주세요.","english":"Two servings of pork belly please."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '밥 먹었어요?', 'Bap meogeosseoyo?', 'Have you eaten? (standard greeting)', 1),
  (l_id, '민준', '아직이요. 같이 먹을래요?', 'Ajik-i-yo. Gachi meogeullaeyo?', 'Not yet. Would you like to eat together?', 2),
  (l_id, '수진', '좋아요! 뭐 먹고 싶어요?', 'Joayo! Mwo meokgo sipeoyo?', 'Great! What do you want to eat?', 3),
  (l_id, '민준', '저는 된장찌개 먹고 싶어요. 수진 씨는요?', 'Jeoneun doenjang jjigae meokgo sipeoyo. Sujin ssi-neunyo?', 'I want to eat doenjang jjigae. What about you?', 4),
  (l_id, '수진', '저는 비빔밥이요. 근처에 한식집이 있어요?', 'Jeoneun bibimbap-iyo. Geuncheoe hansikjib-i isseoyo?', 'I want bibimbap. Is there a Korean restaurant nearby?', 5),
  (l_id, '민준', '네, 바로 앞에 있어요. 같이 가요!', 'Ne, baro ape isseoyo. Gachi gayo!', 'Yes, there is one right in front. Let''s go together!', 6),
  (l_id, '수진', '(식당에서) 비빔밥 하나랑 된장찌개 하나 주세요.', '(Sikdang-eseo) Bibimbap hana-rang doenjang jjigae hana juseyo.', '(At the restaurant) One bibimbap and one doenjang jjigae please.', 7),
  (l_id, '종업원', '네, 잠깐만요. 음료는요?', 'Ne, jamkkanmanyo. Eumnyo-neunyo?', 'Yes, just a moment. And to drink?', 8),
  (l_id, '수진', '물 두 잔 주세요.', 'Mul du jan juseyo.', 'Two glasses of water please.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you politely say "Please have some green tea"?', '["녹차 먹어요","녹차 드세요","녹차 주세요","녹차 마세요"]', 1, '드세요 is the honorific form of 먹다/마시다. For offering, 녹차 드세요 is the natural polite expression.', 1),
  (l_id, 'What counter is used for a cup of coffee?', '["개","잔","병","그릇"]', 1, '잔 is the counter for cups/glasses of liquid: 커피 한 잔.', 2),
  (l_id, '"이 불고기 맛있어요" means:', '["I like this bulgogi","This bulgogi is not good","This bulgogi is delicious","I want to eat this bulgogi"]', 2, '맛있어요 = is delicious. Subject 이 불고기 = this bulgogi.', 3),
  (l_id, '"밥 드셨어요?" is commonly used as:', '["An order at a restaurant","A general greeting","An expression of surprise","A farewell"]', 1, '"Have you eaten?" (밥 드셨어요?) is one of the most common Korean greetings, showing care for others.', 4),
  (l_id, 'What is 인분 used for?', '["counting drinks","counting bowls","counting servings of food","counting people"]', 2, '인분(人分) is the counter for portions/servings of food, used at Korean restaurants.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국 음식은 세계에서 인기가 높습니다. 대표적인 한국 음식으로는 김치, 불고기, 비빔밥, 된장찌개 등이 있습니다. 한국 사람들은 밥을 중심으로 한 식사를 좋아합니다. 식사를 시작하기 전에는 "잘 먹겠습니다"라고 하고, 식사가 끝나면 "잘 먹었습니다"라고 합니다. 한국에서는 "밥 먹었어요?"가 인사말로 자주 쓰입니다. 이 표현은 상대방의 안녕을 걱정하는 마음을 담고 있습니다.',
   'Korean food is popular around the world. Representative Korean foods include kimchi, bulgogi, bibimbap, and doenjang jjigae. Koreans enjoy meals centered around rice. Before starting a meal, one says "잘 먹겠습니다" (I will eat well), and after finishing, "잘 먹었습니다" (I ate well). In Korea, "밥 먹었어요?" (Have you eaten?) is often used as a greeting. This expression conveys a sense of care and concern for the other person.',
   1);
END $$;

-- ============================================================
-- LESSON 21: At the Restaurant (식당에서)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=21;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=21 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '식당', 'sikdang', 'restaurant', 1),
  (l_id, '메뉴', 'menyu', 'menu', 2),
  (l_id, '주문하다', 'jumonhada', 'to order', 3),
  (l_id, '계산하다', 'gyesanhada', 'to pay / calculate the bill', 4),
  (l_id, '맵다', 'maepda', 'to be spicy', 5),
  (l_id, '달다', 'dalda', 'to be sweet', 6),
  (l_id, '짜다', 'jjada', 'to be salty', 7),
  (l_id, '싱겁다', 'singeobda', 'to be bland', 8),
  (l_id, '더 주세요', 'deo juseyo', 'please give me more', 9),
  (l_id, '계산서', 'gyesanseo', 'bill / check', 10),
  (l_id, '포장이요', 'pojang-iyo', 'to go / takeout', 11),
  (l_id, '자리', 'jari', 'seat / place', 12),
  (l_id, '예약', 'yeyak', 'reservation', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Ordering: ~(으)로 주세요',
   '[Item] + (으)로 주세요',
   '(으)로 here means "with" or "in the form of," used for choosing an item from options. It is the standard restaurant ordering phrase.',
   '[{"korean":"비빔밥으로 주세요.","english":"I will have the bibimbap."},{"korean":"아이스 아메리카노로 주세요.","english":"I will have an iced Americano."},{"korean":"이걸로 할게요.","english":"I will have this one."}]',
   1),
  (l_id,
   'Asking for the Bill: 계산해 주세요 / 얼마예요?',
   '계산해 주세요 = please compute the bill / 얼마예요? = how much is it?',
   'At Korean restaurants, you typically call for the waiter/waitress and ask 계산해 주세요 or 계산서 주세요. Alternatively, 여기요! (Excuse me!) gets the server''s attention.',
   '[{"korean":"여기요, 계산해 주세요.","english":"Excuse me, the bill please."},{"korean":"얼마예요?","english":"How much is it?"},{"korean":"카드로 해도 돼요?","english":"Can I pay by card?"}]',
   2),
  (l_id,
   'Expressing Taste Complaints Politely',
   '좀 ~게 해 주세요 = please make it a bit ~',
   'When food is too spicy/salty/sweet, use 좀 (a little) + descriptive verb stem + -게 해 주세요 to make a polite request.',
   '[{"korean":"좀 덜 맵게 해 주세요.","english":"Please make it a bit less spicy."},{"korean":"소금을 조금만 넣어 주세요.","english":"Please put in just a little salt."},{"korean":"이거 좀 더 주세요.","english":"Please give me a little more of this."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '종업원', '어서 오세요! 몇 분이세요?', 'Eoseo oseyo! Myeot bun-iseyo?', 'Welcome! How many people?', 1),
  (l_id, '손님', '두 명이에요. 자리 있어요?', 'Du myeong-i-eyo. Jari isseoyo?', 'Two people. Do you have seats?', 2),
  (l_id, '종업원', '네, 이쪽으로 오세요. 메뉴 여기 있어요.', 'Ne, ijjok-euro oseyo. Menyu yeogi isseoyo.', 'Yes, please come this way. Here is the menu.', 3),
  (l_id, '손님A', '저는 삼겹살로 할게요.', 'Jeoneun samgyeopsal-lo halgeyo.', 'I will have the pork belly.', 4),
  (l_id, '손님B', '저도요. 그리고 냉면도 하나 주세요.', 'Jeodoya. Geurigo naengmyeon-do hana juseyo.', 'Me too. And one cold noodles please.', 5),
  (l_id, '종업원', '음료는 뭐로 드릴까요?', 'Eumnyo-neun mworo deurilkkayo?', 'What would you like to drink?', 6),
  (l_id, '손님A', '콜라 두 개 주세요.', 'Kolla du gae juseyo.', 'Two Colas please.', 7),
  (l_id, '손님B', '(나중에) 여기요, 계산해 주세요.', '(Najunge) Yeogiyo, gyesanhae juseyo.', '(Later) Excuse me, the bill please.', 8),
  (l_id, '종업원', '네, 모두 삼만 이천 원이에요.', 'Ne, modu saman icheon won-i-eyo.', 'Yes, the total is 32,000 won.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you order "the bibimbap" at a restaurant?', '["비빔밥 먹어요","비빔밥으로 주세요","비빔밥이 주세요","비빔밥을 해요"]', 1, '~(으)로 주세요 is the standard ordering structure. 비빔밥으로 주세요.', 1),
  (l_id, 'What does 여기요 mean when called out at a restaurant?', '["The food is here","Here is the menu","Excuse me (calling the waiter)","Here you go"]', 2, '여기요 is used to get the attention of a waiter/waitress: "Excuse me!"', 2),
  (l_id, 'Which expression means "takeout" in Korean?', '["식당에서","포장이요","계산해 주세요","예약해 주세요"]', 1, '포장이요 (or 포장해 주세요) means you want your order to go / as takeout.', 3),
  (l_id, '"좀 덜 맵게 해 주세요" means:', '["Please make it spicier","Please make it a bit less spicy","This is too salty","Please give me more"]', 1, '덜 = less; 맵게 = spicy (adverb form); 해 주세요 = please make. → Please make it a bit less spicy.', 4),
  (l_id, 'To pay by card you say:', '["현금으로 해요","카드로 해도 돼요?","계산서 주세요","잔돈 주세요"]', 1, '카드로 = by card; 해도 돼요? = is it okay? → Can I pay by card?', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국 식당에서는 보통 자리에 앉으면 종업원이 메뉴를 가져옵니다. 주문할 때는 "~(으)로 주세요"라고 합니다. 음식이 나왔을 때는 "잘 먹겠습니다"라고 인사합니다. 음식이 너무 맵거나 짜면 "좀 덜 맵게 해 주세요"처럼 부탁할 수 있습니다. 식사 후 계산할 때는 "여기요, 계산해 주세요"라고 합니다. 한국에서는 보통 더치페이(각자 내기)를 하지 않고 한 사람이 계산하는 문화가 있습니다.',
   'At a Korean restaurant, a server usually brings the menu when you are seated. When ordering, the phrase "~(으)로 주세요" is used. When the food arrives, it is polite to say "잘 먹겠습니다." If the food is too spicy or salty, you can request "좀 덜 맵게 해 주세요." After eating, to ask for the bill, say "여기요, 계산해 주세요." In Korea, there is a culture where one person pays the whole bill rather than splitting it (Dutch pay).',
   1);
END $$;

-- ============================================================
-- LESSON 22: Daily Routines (일과)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=22;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=22 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '일어나다', 'ireonada', 'to wake up / get up', 1),
  (l_id, '세수하다', 'sesuhada', 'to wash one''s face', 2),
  (l_id, '샤워하다', 'syawoehada', 'to shower', 3),
  (l_id, '밥을 먹다', 'babeul meokda', 'to eat a meal', 4),
  (l_id, '학교에 가다', 'hakgyoe gada', 'to go to school', 5),
  (l_id, '공부하다', 'gongbuhada', 'to study', 6),
  (l_id, '점심을 먹다', 'jeomsimeul meokda', 'to eat lunch', 7),
  (l_id, '퇴근하다', 'toegeunhada', 'to finish work / leave work', 8),
  (l_id, '운동하다', 'undonghada', 'to exercise', 9),
  (l_id, '저녁을 먹다', 'jeonyeogeul meokda', 'to eat dinner', 10),
  (l_id, '텔레비전을 보다', 'tellebijeon-eul boda', 'to watch television', 11),
  (l_id, '자다', 'jada', 'to sleep', 12),
  (l_id, '쉬다', 'swida', 'to rest', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Sequential Actions: -고',
   '[Verb stem] + -고 + [next action]',
   '-고 connects two sequential actions meaning "and then." It does not change for tense — the tense of the whole sequence is carried by the final verb.',
   '[{"korean":"일어나고 세수해요.","english":"I wake up and then wash my face."},{"korean":"밥을 먹고 학교에 가요.","english":"I eat and then go to school."},{"korean":"공부하고 운동했어요.","english":"I studied and then exercised."}]',
   1),
  (l_id,
   'Expressing Habitual Action: 보통/항상/매일 + Present',
   '보통/항상/매일 + [Verb]-아요/어요',
   'Korean uses the present tense (아요/어요) for habitual or routine actions, unlike English which uses "usually" + simple present. Frequency adverbs 보통(usually), 항상(always), 매일(every day) precede the verb.',
   '[{"korean":"저는 보통 여섯 시에 일어나요.","english":"I usually wake up at six."},{"korean":"매일 아침에 커피를 마셔요.","english":"I drink coffee every morning."},{"korean":"항상 열한 시에 자요.","english":"I always sleep at eleven."}]',
   2),
  (l_id,
   'Time Expressions for Daily Life',
   '아침(morning), 낮(daytime), 저녁(evening), 밤(night) + 에',
   'Time-of-day words take the particle 에 to indicate when an action happens. These can be combined with clock times for precision.',
   '[{"korean":"아침에 운동해요.","english":"I exercise in the morning."},{"korean":"저녁에 뭐 해요?","english":"What do you do in the evening?"},{"korean":"밤늦게 자요.","english":"I sleep late at night."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '오늘 하루 어땠어요?', 'Oneul haru eottaesseoyo?', 'How was your day today?', 1),
  (l_id, '수진', '바빴어요! 아침 일곱 시에 일어나서 학교까지 갔어요.', 'Babasseoyo! Achim ilgop si-e ireona-seo hakgyo-kkaji gasseoyo.', 'It was busy! I woke up at 7 AM and went all the way to school.', 2),
  (l_id, '민준', '수업이 몇 시에 시작해요?', 'Sueob-i myeot si-e sijakaeyo?', 'What time does class start?', 3),
  (l_id, '수진', '아홉 시에 시작해요. 수업이 끝나고 도서관에서 공부했어요.', 'Ahop si-e sijakaeyo. Sueob-i kkeunnago doseogwan-eseo gongbuhaesseoyo.', 'It starts at 9. After class I studied at the library.', 4),
  (l_id, '민준', '저녁은 먹었어요?', 'Jeonyeog-eun meogeosseoyo?', 'Did you have dinner?', 5),
  (l_id, '수진', '네, 기숙사에서 혼자 먹었어요. 민준 씨 일과는요?', 'Ne, gisuksa-eseo honja meogeosseoyo. Minjun ssi ilgwa-neunyo?', 'Yes, I ate alone in the dormitory. What is your daily routine?', 6),
  (l_id, '민준', '저는 보통 여섯 시에 일어나요. 그리고 운동하고 출근해요.', 'Jeoneun botong yeoseot si-e ireonayo. Geurigo undong-ago chulgeunhaeyo.', 'I usually wake up at six. Then I exercise and go to work.', 7),
  (l_id, '수진', '대단하네요! 저는 운동하기 싫어요.', 'Daedananeyo! Jeoneun undonghagi sireoyo.', 'Impressive! I hate exercising.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which sentence correctly uses -고 to connect daily actions?', '["자다고 일어나요","자고 일어나요","잔고 일어나요","자-고 있어요"]', 1, '-고 attaches to the verb stem. 자다 → stem 자 + -고 → 자고. 자고 일어나요 = (I) sleep and then wake up.', 1),
  (l_id, 'Which adverb means "every day"?', '["보통","가끔","매일","항상"]', 2, '매일 = every day. 보통 = usually. 가끔 = sometimes. 항상 = always.', 2),
  (l_id, '"퇴근하다" means:', '["to go to work","to come home","to leave work / clock out","to work overtime"]', 2, '퇴근하다 = to finish/leave work. 출근하다 = to go to work/clock in.', 3),
  (l_id, 'Which particle marks time of day in daily routines?', '["을/를","이/가","에","에서"]', 2, '에 is the time particle: 아침에(in the morning), 저녁에(in the evening).', 4),
  (l_id, '"저는 보통 열 시에 자요." means:', '["I usually wake up at 10","I usually sleep at 10","I sometimes sleep at 10","I slept at 10"]', 1, '보통 = usually; 열 시 = 10 o''clock; 자요 = sleep. → I usually sleep at 10.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '저는 보통 아침 일곱 시에 일어납니다. 일어나서 세수하고 아침을 먹습니다. 여덟 시에 학교에 갑니다. 학교에서 오전에 수업을 듣고 점심에 친구들과 밥을 먹습니다. 오후에는 도서관에서 공부합니다. 저녁 여섯 시에 집에 돌아옵니다. 저녁을 먹고 샤워하고 텔레비전을 조금 봅니다. 열한 시쯤 자요. 제 일과는 바쁘지만 즐겁습니다.',
   'I usually wake up at 7 AM. After waking up, I wash my face and eat breakfast. At 8 o''clock I go to school. At school I attend classes in the morning and eat lunch with friends at noon. In the afternoon I study at the library. I return home at 6 PM. I eat dinner, shower, and watch a little television. I sleep around 11 PM. My daily routine is busy but enjoyable.',
   1);
END $$;

-- ============================================================
-- LESSON 23: Weather (날씨)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=23;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=23 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '날씨', 'nalssi', 'weather', 1),
  (l_id, '맑다', 'makda', 'to be clear/sunny', 2),
  (l_id, '흐리다', 'heurida', 'to be cloudy/overcast', 3),
  (l_id, '비가 오다', 'bi-ga oda', 'to rain (lit. rain comes)', 4),
  (l_id, '눈이 오다', 'nun-i oda', 'to snow (lit. snow comes)', 5),
  (l_id, '바람이 불다', 'baram-i bulda', 'to be windy (lit. wind blows)', 6),
  (l_id, '춥다', 'chupda', 'to be cold', 7),
  (l_id, '덥다', 'deopda', 'to be hot', 8),
  (l_id, '시원하다', 'siwonhada', 'to be cool (pleasantly)', 9),
  (l_id, '따뜻하다', 'ttattteuthada', 'to be warm', 10),
  (l_id, '습하다', 'seupada', 'to be humid', 11),
  (l_id, '기온', 'gion', 'temperature', 12),
  (l_id, '일기예보', 'ilgi-yebo', 'weather forecast', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Weather Expressions with 이다 and Descriptive Verbs',
   '날씨가 + [descriptive verb]-아요/어요',
   'Weather is described using descriptive verbs as predicates. Subject 날씨가 (the weather) is optional when context is clear.',
   '[{"korean":"오늘 날씨가 맑아요.","english":"Today''s weather is clear."},{"korean":"내일 비가 와요.","english":"It rains tomorrow."},{"korean":"밖이 많이 추워요.","english":"It is very cold outside."}]',
   1),
  (l_id,
   'ㅂ Irregular Descriptive Verbs (ㅂ 불규칙)',
   'ㅂ-stem + 아/어 → ㅂ drops → 우/워 contracts',
   'Descriptive verbs ending in ㅂ are irregular: ㅂ drops before vowel endings and is replaced by 우/워. Key weather verbs: 춥다→추워요, 덥다→더워요.',
   '[{"korean":"춥다 → 추워요","english":"to be cold → is cold"},{"korean":"덥다 → 더워요","english":"to be hot → is hot"},{"korean":"가깝다 → 가까워요","english":"to be close → is close"}]',
   2),
  (l_id,
   'Expressing Weather-Based Plans',
   '날씨가 ~면 + [action]',
   'Use the conditional -면 (if) to link weather to plans. This is a natural and frequent structure in Korean.',
   '[{"korean":"날씨가 좋으면 공원에 가요.","english":"If the weather is nice, I go to the park."},{"korean":"비가 오면 집에 있어요.","english":"If it rains, I stay home."},{"korean":"더우면 아이스크림을 먹어요.","english":"If it is hot, I eat ice cream."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 날씨 어때요?', 'Oneul nalssi eottaeyo?', 'What is the weather like today?', 1),
  (l_id, '민준', '많이 추워요. 영하 오 도래요.', 'Mani chuwoyo. Yeongha o do-raeyo.', 'It is very cold. It is minus 5 degrees.', 2),
  (l_id, '수진', '눈도 와요?', 'Nun-do wayo?', 'Is it snowing too?', 3),
  (l_id, '민준', '아니요, 그냥 맑아요. 하지만 바람이 많이 불어요.', 'Aniyo, geunyang malgayo. Hajiman baram-i mani bureoyo.', 'No, it is just clear. But it is very windy.', 4),
  (l_id, '수진', '내일 일기예보는요?', 'Naeil ilgi-yebo-neunyo?', 'What about tomorrow''s forecast?', 5),
  (l_id, '민준', '내일은 눈이 온대요. 길이 미끄러울 것 같아요.', 'Naeil-eun nun-i ondaeyo. Gir-i mikkeureo-ul geot gatayo.', 'They say it will snow tomorrow. The roads might be slippery.', 6),
  (l_id, '수진', '그럼 내일은 대중교통을 타야겠네요.', 'Geureom naeil-eun daejunggyo-tong-eul tayageseumneyo.', 'Then I should take public transportation tomorrow.', 7),
  (l_id, '민준', '맞아요, 조심하세요!', 'Majayo, josimhaseyo!', 'That''s right, take care!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which is the correct polite form of 덥다 (to be hot)?', '["덥아요","덥어요","더워요","덥워요"]', 2, 'ㅂ irregular: 덥다 → ㅂ drops + 워 → 더워요.', 1),
  (l_id, '"비가 와요" literally means:', '["It is rainy","Rain comes","It is snowing","The weather is cloudy"]', 1, '비 = rain; 가 = subject particle; 와요 = comes. Literally "Rain comes" = "It is raining."', 2),
  (l_id, 'What does 일기예보 mean?', '["daily routine","temperature","weather forecast","rainy season"]', 2, '일기예보 (日氣豫報) = weather forecast.', 3),
  (l_id, '"날씨가 좋으면 공원에 가요" means:', '["The weather is good at the park","If the weather is nice, I go to the park","I go to the park when the weather was good","The park weather is nice"]', 1, '-면 = if/when (conditional). 날씨가 좋으면 = if the weather is nice. 공원에 가요 = I go to the park.', 4),
  (l_id, 'Which adjective describes pleasant coolness (not cold)?', '["춥다","시원하다","흐리다","습하다"]', 1, '시원하다 = pleasantly cool/refreshing. 춥다 = cold (unpleasantly).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국은 사계절이 뚜렷합니다. 봄에는 따뜻하고 꽃이 핍니다. 여름에는 덥고 습해서 장마철에 비가 많이 옵니다. 가을에는 시원하고 단풍이 아름답습니다. 겨울에는 춥고 눈이 내립니다. 한국 사람들은 날씨 이야기를 자주 합니다. "오늘 날씨 어때요?"는 일상적인 대화 시작 방법입니다. 날씨가 좋은 날에는 야외 활동을 많이 즐깁니다.',
   'Korea has four distinct seasons. In spring it is warm and flowers bloom. In summer it is hot and humid, and there is heavy rain during the monsoon season. In autumn it is cool and the autumn foliage is beautiful. In winter it is cold and snow falls. Koreans frequently talk about the weather. "오늘 날씨 어때요?" (What is the weather like today?) is a common conversation starter. On days with nice weather, many outdoor activities are enjoyed.',
   1);
END $$;

-- ============================================================
-- LESSON 24: Seasons (계절)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=24;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=24 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '봄', 'bom', 'spring', 1),
  (l_id, '여름', 'yeoreum', 'summer', 2),
  (l_id, '가을', 'gaeul', 'autumn / fall', 3),
  (l_id, '겨울', 'gyeoul', 'winter', 4),
  (l_id, '벚꽃', 'beotkkot', 'cherry blossom', 5),
  (l_id, '단풍', 'danpung', 'autumn foliage / maple leaves', 6),
  (l_id, '장마', 'jangma', 'monsoon/rainy season', 7),
  (l_id, '태풍', 'taepung', 'typhoon', 8),
  (l_id, '눈사람', 'nunsaram', 'snowman', 9),
  (l_id, '꽃놀이', 'kkonori', 'flower-viewing picnic', 10),
  (l_id, '수영하다', 'suyeonghada', 'to swim', 11),
  (l_id, '스키를 타다', 'seuki-reul tada', 'to ski', 12),
  (l_id, '좋아하는 계절', 'joahaneun gyejeol', 'favorite season', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Preference: ~을/를 제일 좋아해요',
   '[Item] + 을/를 + 제일/가장 + 좋아해요',
   '제일 and 가장 both mean "most/best." Use 을/를 (object particle) with 좋아하다 to express preference.',
   '[{"korean":"저는 가을을 제일 좋아해요.","english":"I like autumn the most."},{"korean":"어느 계절을 가장 좋아해요?","english":"Which season do you like the most?"},{"korean":"봄이 가장 아름다워요.","english":"Spring is the most beautiful."}]',
   1),
  (l_id,
   'Expressing Seasons with Activities: ~에는 / ~(으)면',
   '[Season] + 에는 + [activity / weather description]',
   '에는 = on/in (contrastive). Used to talk about what each season is like, contrasting one season with another.',
   '[{"korean":"봄에는 꽃놀이를 해요.","english":"In spring we go flower-viewing."},{"korean":"여름에는 수영하러 바다에 가요.","english":"In summer we go swimming in the sea."},{"korean":"겨울에는 스키를 타요.","english":"In winter we ski."}]',
   2),
  (l_id,
   'Expressing Contrast: -지만 (but/however)',
   '[Clause 1] + -지만 + [Clause 2]',
   '-지만 connects two contrasting clauses. It is the polite equivalent of "but/however."',
   '[{"korean":"여름은 덥지만 좋아해요.","english":"Summer is hot but I like it."},{"korean":"겨울은 춥지만 눈이 예뻐요.","english":"Winter is cold but the snow is pretty."},{"korean":"바쁘지만 행복해요.","english":"I am busy but happy."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '제일 좋아하는 계절이 뭐예요?', 'Jeil joahaneun gyejeol-i mwoyeyo?', 'What is your favorite season?', 1),
  (l_id, '민준', '저는 가을이요. 단풍이 정말 예뻐요. 수진 씨는요?', 'Jeoneun gaeul-iyo. Danpung-i jeongmal yeppeyo. Sujin ssi-neunyo?', 'I like autumn. The foliage is really beautiful. What about you?', 2),
  (l_id, '수진', '저는 봄을 좋아해요. 벚꽃이 아름다워요.', 'Jeoneun bom-eul joahaeyo. Beotkkot-i areumdawoyo.', 'I like spring. The cherry blossoms are beautiful.', 3),
  (l_id, '민준', '그렇군요. 봄에는 꽃놀이 많이 해요?', 'Geureoke-unyo. Bome-neun kkonori mani haeyo?', 'Is that so. Do you go flower-viewing a lot in spring?', 4),
  (l_id, '수진', '네, 매년 여의도에 가요. 같이 가요 다음에!', 'Ne, maenyeon Yeouido-e gayo. Gachi gayo daeume!', 'Yes, I go to Yeouido every year. Let''s go together next time!', 5),
  (l_id, '민준', '좋아요! 여름은 좋아해요?', 'Joayo! Yeoreum-eun joahaeyo?', 'Great! Do you like summer?', 6),
  (l_id, '수진', '여름은 덥고 습해서 싫어요. 장마도 있고요.', 'Yeoreum-eun deopgo seuphaeseo sireoyo. Jangmado itgoyo.', 'I dislike summer because it is hot and humid. And there is the rainy season too.', 7),
  (l_id, '민준', '저도요. 하지만 해수욕은 좋아요!', 'Jeodoya. Hajiman haesuyog-eun joayo!', 'Me too. But I like going to the beach!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which season is associated with 단풍 (autumn foliage)?', '["봄","여름","가을","겨울"]', 2, '단풍 (coloring of leaves) is the symbol of 가을 (autumn) in Korea.', 1),
  (l_id, 'How do you say "I like spring the most"?', '["봄이 제일 좋아요","봄을 제일 좋아해요","봄이 제일 좋아해요","봄이 제일 좋습니다가"]', 1, '봄을 제일 좋아해요: 봄(spring)+을(object particle)+제일(most)+좋아해요(like).', 2),
  (l_id, '"여름은 덥지만 좋아해요" means:', '["Summer is hot so I don''t like it","Summer is hot but I like it","Summer is not hot so I like it","Summer is hot and I like it"]', 1, '-지만 = but/however. 덥지만 = hot but. 좋아해요 = I like it.', 3),
  (l_id, 'What does 장마 mean?', '["typhoon","snowstorm","monsoon/rainy season","cherry blossom season"]', 2, '장마 = the summer monsoon/rainy season in Korea (typically late June–July).', 4),
  (l_id, 'In Korean, what particle is used after a season to talk about what happens during it?', '["을/를","이/가","에는","에서"]', 2, '에는 is the contrastive time particle: 봄에는(in spring), 여름에는(in summer).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국은 사계절이 있어서 각 계절마다 즐길 수 있는 것들이 있습니다. 봄에는 벚꽃이 피고 꽃놀이를 즐깁니다. 여름에는 날씨가 덥고 습하며 장마가 있지만 바다에서 수영을 즐깁니다. 가을에는 날씨가 시원하고 단풍이 들어 등산하기 좋습니다. 겨울에는 눈이 내리고 스키장에 많은 사람들이 몰립니다. 한국 사람들은 계절마다 다른 음식을 즐기기도 합니다.',
   'Korea has four seasons, and each season offers things to enjoy. In spring, cherry blossoms bloom and people enjoy flower-viewing picnics. In summer the weather is hot and humid with a monsoon season, but people enjoy swimming in the sea. In autumn the weather is cool and the foliage colors make it a great time for hiking. In winter snow falls and ski resorts are packed with visitors. Koreans also enjoy different foods depending on the season.',
   1);
END $$;

-- ============================================================
-- LESSON 25: Body Parts (신체 부위)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=25;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=25 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '머리', 'meori', 'head / hair', 1),
  (l_id, '얼굴', 'eolgul', 'face', 2),
  (l_id, '눈', 'nun', 'eye(s)', 3),
  (l_id, '코', 'ko', 'nose', 4),
  (l_id, '귀', 'gwi', 'ear(s)', 5),
  (l_id, '입', 'ip', 'mouth', 6),
  (l_id, '목', 'mok', 'neck / throat', 7),
  (l_id, '어깨', 'eokkae', 'shoulder(s)', 8),
  (l_id, '팔', 'pal', 'arm', 9),
  (l_id, '손', 'son', 'hand', 10),
  (l_id, '배', 'bae', 'stomach / belly', 11),
  (l_id, '다리', 'dari', 'leg', 12),
  (l_id, '발', 'bal', 'foot', 13),
  (l_id, '등', 'deung', 'back (body part)', 14),
  (l_id, '가슴', 'gaseum', 'chest', 15);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Pain: [Body part] + 이/가 + 아파요',
   '[Body part] + 이/가 + 아파요 (hurts)',
   '아프다 (to be in pain) conjugates to 아파요 in polite present. The body part takes the subject particle 이/가.',
   '[{"korean":"머리가 아파요.","english":"My head hurts."},{"korean":"목이 아파요.","english":"My throat hurts."},{"korean":"배가 아파요.","english":"My stomach hurts."}]',
   1),
  (l_id,
   'Possessive Body Part: 제/내 + body part',
   '제 (polite my) + [body part] / 내 (informal my) + [body part]',
   'In medical or descriptive contexts, the possessive 제 (polite) or 내 (informal) precedes the body part. Often the possessive is omitted when context is clear.',
   '[{"korean":"제 눈이 나빠요.","english":"My eyesight is bad."},{"korean":"내 발이 커요.","english":"My feet are big."},{"korean":"어깨가 무거워요.","english":"My shoulders feel heavy. (also: I feel burdened)"}]',
   2),
  (l_id,
   'Describing Physical Appearance',
   '[Body part] + 이/가 + [descriptive verb]',
   'Describing someone''s physical features uses the subject particle 이/가 after the body part and a descriptive verb.',
   '[{"korean":"눈이 크고 예뻐요.","english":"(Her/His) eyes are big and pretty."},{"korean":"코가 높아요.","english":"(Her/His) nose is high (bridge). — a Korean beauty standard"},{"korean":"손이 작아요.","english":"(Her/His) hands are small."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '의사', '어디가 불편하세요?', 'Eodiga bulpyeonhaseyo?', 'Where are you uncomfortable? (Where does it hurt?)', 1),
  (l_id, '환자', '목이 아프고 머리도 아파요.', 'Mogi apeugeo meoridae aapayo.', 'My throat hurts and my head hurts too.', 2),
  (l_id, '의사', '언제부터요?', 'Eonje-buteoyo?', 'Since when?', 3),
  (l_id, '환자', '어제부터요. 열도 조금 있는 것 같아요.', 'Eoje-buteoyo. Yeoldo jogeum inneun geot gatayo.', 'Since yesterday. I think I also have a slight fever.', 4),
  (l_id, '의사', '배도 아파요?', 'Baedo apayo?', 'Does your stomach hurt too?', 5),
  (l_id, '환자', '아니요, 배는 괜찮아요. 기침도 있어요.', 'Aniyo, baeneun gwaenchanayo. Gichimdo isseoyo.', 'No, my stomach is fine. I also have a cough.', 6),
  (l_id, '의사', '감기인 것 같아요. 약을 드릴게요.', 'Gamgi-in geot gatayo. Yageul deurilgeyo.', 'It seems like a cold. I will give you medicine.', 7),
  (l_id, '환자', '감사합니다, 선생님.', 'Gamsahamnida, seonsaengnim.', 'Thank you, doctor.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "My back hurts" in Korean?', '["등을 아파요","등이 아파요","등가 아파요","제 등은 아파요"]', 1, '등이 아파요: 등(back) + 이(subject particle, after consonant) + 아파요(hurts).', 1),
  (l_id, 'What does 목 refer to in Korean?', '["arm","stomach","neck/throat","knee"]', 2, '목 = neck/throat. It covers both the external neck and the internal throat.', 2),
  (l_id, 'Which particle follows a body part when expressing pain?', '["을/를","이/가","에","에서"]', 1, 'Body parts use the subject particle 이/가 with 아파요: 머리가 아파요.', 3),
  (l_id, '"배가 아파요" can mean:', '["My leg hurts","My stomach hurts","My arm hurts","My chest hurts"]', 1, '배 = stomach/belly. 배가 아파요 = My stomach hurts.', 4),
  (l_id, 'In Korean, 어디가 불편하세요? is used by a doctor to ask:', '["What medication do you take?","Where does it hurt?","Do you have allergies?","What is your name?"]', 1, '어디가 = where (subject); 불편하세요? = are you uncomfortable? → Where does it hurt?', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '신체 부위를 한국어로 알면 병원에서 매우 유용합니다. 아픈 곳을 설명할 때 "[신체 부위]가 아파요"라고 합니다. 예를 들어 "머리가 아파요"는 두통을, "목이 아파요"는 인후통을 나타냅니다. 한국어에서 "머리"는 머리카락을 의미하기도 합니다. 병원에서 의사가 "어디가 불편하세요?"라고 물으면 아픈 부위를 말하면 됩니다. 신체 부위를 설명하는 것은 의사소통에서 매우 기본적인 능력입니다.',
   'Knowing body parts in Korean is very useful at the hospital. When explaining where it hurts, you say "[body part] + 가/이 아파요." For example, "머리가 아파요" indicates a headache, and "목이 아파요" indicates a sore throat. In Korean, "머리" can also mean hair. When a doctor asks "어디가 불편하세요?" at the hospital, you can simply name the affected body part. Describing body parts is a very fundamental communication skill.',
   1);
END $$;

-- ============================================================
-- LESSON 26: Emotions (감정)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=26;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=26 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '기쁘다', 'gippeuda', 'to be happy/glad', 1),
  (l_id, '슬프다', 'seulpeuda', 'to be sad', 2),
  (l_id, '화가 나다', 'hwaga nada', 'to be angry (lit. anger comes out)', 3),
  (l_id, '무섭다', 'museopda', 'to be scared/frightening', 4),
  (l_id, '놀랍다', 'nollapda', 'to be surprising/surprised', 5),
  (l_id, '지루하다', 'jiruhada', 'to be bored/boring', 6),
  (l_id, '피곤하다', 'pigonhada', 'to be tired', 7),
  (l_id, '걱정하다', 'geokjeonghada', 'to worry', 8),
  (l_id, '외롭다', 'oeropda', 'to be lonely', 9),
  (l_id, '설레다', 'solreda', 'to feel excited/fluttery (anticipation)', 10),
  (l_id, '부끄럽다', 'bukkeureobda', 'to be embarrassed/shy', 11),
  (l_id, '그립다', 'geuripda', 'to miss (someone/something)', 12),
  (l_id, '행복하다', 'haengbokhada', 'to be happy (state of happiness)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Feelings: ~아요/어요 with Emotion Verbs',
   '[Emotion verb stem] + -아요/어요',
   'Emotion descriptive verbs conjugate the same as other descriptive verbs. Note: 기쁘다→기뻐요 (으 irregular), 슬프다→슬퍼요 (으 irregular).',
   '[{"korean":"지금 너무 기뻐요.","english":"I am so happy right now."},{"korean":"왜 그렇게 슬퍼요?","english":"Why are you so sad?"},{"korean":"많이 피곤해요.","english":"I am very tired."}]',
   1),
  (l_id,
   'Expressing Cause of Feeling: ~아/어서 (because)',
   '[Cause clause] + -아/어서 + [emotion]',
   '-아서/어서 expresses a cause-and-effect relationship. It cannot be used with imperative or propositive endings. Time order: cause first, result second.',
   '[{"korean":"시험에 합격해서 기뻐요.","english":"I am happy because I passed the exam."},{"korean":"친구가 없어서 외로워요.","english":"I am lonely because I have no friends."},{"korean":"많이 걸어서 피곤해요.","english":"I am tired because I walked a lot."}]',
   2),
  (l_id,
   'ㅂ Irregular Emotion Adjectives',
   '무섭다→무서워요, 외롭다→외로워요, 그립다→그리워요',
   'Many emotion adjectives end in ㅂ and follow the ㅂ irregular pattern: ㅂ drops before vowel endings, replaced by 워.',
   '[{"korean":"무섭다 → 무서워요","english":"to be scary → is scary"},{"korean":"외롭다 → 외로워요","english":"to be lonely → is lonely"},{"korean":"그립다 → 그리워요","english":"to miss → I miss (you/it)"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '왜 그렇게 기분이 좋아요?', 'Wae geureoke gibun-i joayo?', 'Why are you in such a good mood?', 1),
  (l_id, '민준', '오늘 취업 면접이 잘 됐어요! 너무 기뻐요!', 'Oneul chwieop myeonjeob-i jal doesseoyo! Neomu gippeoyo!', 'My job interview went well today! I am so happy!', 2),
  (l_id, '수진', '정말요? 축하해요!', 'Jeongmaryo? Chukhahaeyo!', 'Really? Congratulations!', 3),
  (l_id, '민준', '고마워요. 근데 아직 결과를 기다려야 해서 설레기도 하고 걱정도 돼요.', 'Gomawoyo. Geunde ajik gyeolgwa-reul gidaryeoya haeseo seollegi-do hago geokjeong-do dwaeyo.', 'Thank you. But I still have to wait for the results, so I feel both excited and worried.', 4),
  (l_id, '수진', '잘 될 거예요! 너무 걱정하지 마세요.', 'Jal dwel geoyeyo! Neomu geokjeonghaji maseyo.', 'It will go well! Don''t worry too much.', 5),
  (l_id, '민준', '고마워요. 수진 씨는 요즘 어때요?', 'Gomawoyo. Sujin ssi-neun yojeum eottaeyo?', 'Thank you. How have you been lately?', 6),
  (l_id, '수진', '저는 요즘 좀 외로워요. 친한 친구들이 다 다른 도시로 갔어요.', 'Jeoneun yojeum jom oerowoyo. Chinhan chingudeuri da dareun dosi-ro gasseoyo.', 'I have been a little lonely lately. All my close friends have moved to different cities.', 7),
  (l_id, '민준', '그렇구나. 저도 친구들이 그리워요.', 'Geureokuna. Jeodo chingudeuri griweoyo.', 'I see. I also miss my friends.', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the polite form of 외롭다 (to be lonely)?', '["외롭아요","외로아요","외로워요","외롭어요"]', 2, 'ㅂ irregular: 외롭다 → ㅂ drops + 워 → 외로워요.', 1),
  (l_id, '"시험을 잘 봐서 기뻐요" means:', '["I am happy so I took the exam","I am happy because I did well on the exam","I took the exam to be happy","I am sad because of the exam"]', 1, '-아서/어서 = because. 시험을 잘 봐서 = because I did well on the exam; 기뻐요 = I am happy.', 2),
  (l_id, 'Which emotion verb describes the feeling of nervous excitement before something good?', '["피곤하다","설레다","무섭다","지루하다"]', 1, '설레다 = to feel fluttery/excited with anticipation. A uniquely Korean emotional concept.', 3),
  (l_id, '화가 나다 literally means:', '["to be frustrated","anger comes out","to be scared","to be surprised"]', 1, '화(怒/火) = anger; 가 = subject particle; 나다 = to come out/arise. 화가 나다 = anger arises = to get angry.', 4),
  (l_id, 'Which is the correct polite form of 기쁘다?', '["기쁘아요","기뻐요","기쁘어요","기쁩아요"]', 1, '기쁘다 follows the 으 irregular: 기쁘 + 어 → 기뻐요 (으 drops, 어 contracts with preceding vowel).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '감정을 표현하는 것은 언어 학습에서 매우 중요합니다. 한국어에는 영어에 없는 독특한 감정 표현이 있습니다. 예를 들어 "설레다"는 기대감으로 두근거리는 느낌을 표현하고, "그립다"는 멀리 있거나 없는 사람이나 것이 보고 싶은 마음을 나타냅니다. 감정 형용사는 대부분 "-아요/어요"로 활용하며, ㅂ 불규칙 활용을 하는 것이 많습니다. 감정의 원인을 말할 때는 "-아/어서"를 사용합니다.',
   'Expressing emotions is very important in language learning. Korean has unique emotional expressions not found in English. For example, "설레다" expresses the fluttery feeling of anticipation, and "그립다" conveys the longing to see someone or something that is far away or gone. Most emotion adjectives conjugate with -아요/어요, and many follow the ㅂ irregular pattern. When stating the cause of an emotion, "-아/어서" is used.',
   1);
END $$;
