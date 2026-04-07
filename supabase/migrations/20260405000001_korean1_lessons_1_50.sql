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

-- ============================================================
-- LESSON 27: Hobbies (취미)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=27;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=27 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '취미', 'chwimi', 'hobby', 1),
  (l_id, '독서', 'dokseo', 'reading (books)', 2),
  (l_id, '음악 감상', 'eumak gamsang', 'listening to music', 3),
  (l_id, '영화 보기', 'yeonghwa bogi', 'watching movies', 4),
  (l_id, '요리하다', 'yorihada', 'to cook', 5),
  (l_id, '게임하다', 'geimhada', 'to play games', 6),
  (l_id, '여행하다', 'yeohaenghada', 'to travel', 7),
  (l_id, '사진 찍기', 'sajin jjikgi', 'taking photos', 8),
  (l_id, '그림 그리기', 'geurim geurigi', 'drawing/painting', 9),
  (l_id, '등산하다', 'deungsanhada', 'to hike', 10),
  (l_id, '낚시하다', 'naksihada', 'to fish', 11),
  (l_id, '운동하다', 'undonghada', 'to exercise', 12),
  (l_id, '즐기다', 'jeulgida', 'to enjoy', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Talking About Hobbies: ~기 (Nominalization)',
   '[Verb stem] + -기 + [이에요/좋아해요/싫어해요]',
   'The -기 suffix nominalizes a verb (turns it into a noun phrase), allowing it to function as subject or object. This is the standard way to describe hobby activities in Korean.',
   '[{"korean":"취미가 뭐예요?","english":"What is your hobby?"},{"korean":"저는 사진 찍기를 좋아해요.","english":"I like taking photos."},{"korean":"요리하기가 어려워요.","english":"Cooking is difficult."}]',
   1),
  (l_id,
   'Frequency: 자주/가끔/거의 안',
   '자주(often) / 가끔(sometimes) / 거의 안 + verb(almost never)',
   'These adverbs modify the verb to express how frequently an activity is done.',
   '[{"korean":"저는 자주 등산해요.","english":"I often go hiking."},{"korean":"가끔 낚시해요.","english":"I sometimes fish."},{"korean":"요즘 거의 운동을 안 해요.","english":"Lately I almost never exercise."}]',
   2),
  (l_id,
   '같이 ~해요 — Suggesting Activities Together',
   '같이 + [Verb]-아요/어요 / 같이 ~할래요?',
   '같이 means "together." 할래요? is a friendly invitation/suggestion. Used to propose doing hobbies together.',
   '[{"korean":"같이 영화 볼래요?","english":"Would you like to watch a movie together?"},{"korean":"주말에 같이 등산해요!","english":"Let''s go hiking together this weekend!"},{"korean":"저는 요리를 좋아하는데, 같이 할래요?","english":"I like cooking — would you like to do it together?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '수진 씨 취미가 뭐예요?', 'Sujin ssi chwimi-ga mwoyeyo?', 'Sujin, what is your hobby?', 1),
  (l_id, '수진', '저는 독서랑 사진 찍기를 좋아해요. 민준 씨는요?', 'Jeoneun dokseorang sajin jjikgi-reul joahaeyo. Minjun ssi-neunyo?', 'I like reading and photography. What about you?', 2),
  (l_id, '민준', '저는 등산을 자주 해요. 주말마다 산에 가요.', 'Jeoneun deungsaneul jaju haeyo. Jumal-mada san-e gayo.', 'I often go hiking. I go to the mountains every weekend.', 3),
  (l_id, '수진', '와, 멋있어요! 저는 등산을 별로 안 좋아해요. 힘들어서요.', 'Wa, meositsseoyo! Jeoneun deungsaneul byeolo an joahaeyo. Himdeureoseoyo.', 'Wow, cool! I don''t like hiking much. It is hard.', 4),
  (l_id, '민준', '처음에는 힘들지만 경치가 너무 좋아요. 한번 같이 가 봐요!', 'Cheoeum-eneun himdeuljiman gyeongchi-ga neomu joayo. Hanbeon gachi ga bwayo!', 'It is hard at first, but the scenery is amazing. Let''s try going together once!', 5),
  (l_id, '수진', '그래요? 그럼 쉬운 코스로 한번 가 봐요!', 'Geureayo? Geureom swiun koseu-ro hanbeon ga bwayo!', 'Really? Then let''s try an easy course!', 6),
  (l_id, '민준', '좋아요! 이번 주 토요일 어때요?', 'Joayo! Ibeon ju toyoil eottaeyo?', 'Great! How about this Saturday?', 7),
  (l_id, '수진', '좋아요, 기대돼요!', 'Joayo, gidae-waeyo!', 'Sounds good, I am excited!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What does the -기 suffix do to a verb?', '["Makes it negative","Turns it into a noun","Makes it past tense","Adds polite ending"]', 1, '-기 nominalizes the verb: 등산하다 → 등산하기(hiking as a noun), 요리하다 → 요리하기(cooking).', 1),
  (l_id, '"자주" means:', '["sometimes","always","often","rarely"]', 2, '자주 = often/frequently. 가끔 = sometimes. 항상 = always. 거의 안 = rarely/almost never.', 2),
  (l_id, 'How do you say "I like taking photos"?', '["저는 사진 찍기를 좋아해요","저는 사진 찍기가 좋습니다가","저는 사진을 찍기가 좋아","저는 사진을 찍기 할래요"]', 0, '사진 찍기(nominalized form) + 를(object particle) + 좋아해요 = I like taking photos.', 3),
  (l_id, 'Which phrase invites someone to do something together?', '["같이 할래요?","같이 했어요?","같이 안 해요","같이 해야 해요"]', 0, '같이 할래요? = Would you like to do it together? A friendly invitation.', 4),
  (l_id, 'What does 등산하다 mean?', '["to swim","to hike","to ski","to fish"]', 1, '등산하다 = to hike / climb a mountain. 등산 (登山) literally = climbing a mountain.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '취미를 이야기하는 것은 새로운 친구를 사귈 때 좋은 화제입니다. 한국 사람들이 자주 즐기는 취미로는 등산, 독서, 요리, 사진 찍기, 게임 등이 있습니다. 취미를 말할 때는 동사에 -기를 붙여 명사화한 후 "좋아해요"와 함께 씁니다. 예를 들어 "독서하기를 좋아해요"나 줄여서 "독서를 좋아해요"라고 합니다. 공통된 취미가 있으면 "같이 ~해요"라고 제안할 수 있습니다.',
   'Talking about hobbies is a great conversation topic when making new friends. Popular hobbies enjoyed by Koreans include hiking, reading, cooking, photography, and gaming. When talking about hobbies, the verb is nominalized with -기 and combined with "좋아해요." For example, "독서하기를 좋아해요" or shortened to "독서를 좋아해요" (I like reading). If you share a common hobby, you can suggest "같이 ~해요" (Let''s do ~ together).',
   1);
END $$;

-- ============================================================
-- LESSON 28: Shopping (쇼핑)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=28;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=28 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '쇼핑하다', 'syoping-hada', 'to shop', 1),
  (l_id, '가게', 'gage', 'store / shop', 2),
  (l_id, '백화점', 'baekhwajeom', 'department store', 3),
  (l_id, '시장', 'sijang', 'market', 4),
  (l_id, '얼마예요?', 'eolma-yeyo?', 'How much is it?', 5),
  (l_id, '비싸다', 'bissada', 'to be expensive', 6),
  (l_id, '싸다', 'ssada', 'to be cheap/inexpensive', 7),
  (l_id, '사이즈', 'saijeu', 'size', 8),
  (l_id, '입어 보다', 'ibeo boda', 'to try on (clothing)', 9),
  (l_id, '색깔', 'saekkal', 'color', 10),
  (l_id, '교환하다', 'gyohwanhada', 'to exchange / return', 11),
  (l_id, '할인', 'harin', 'discount', 12),
  (l_id, '영수증', 'yeongsujeung', 'receipt', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Trying Something: -아/어 보다',
   '[Verb stem] + -아/어 보다 = try doing',
   '-아/어 보다 expresses trying or attempting an action. It is used to suggest or describe trying something for the first time.',
   '[{"korean":"이거 입어 봐도 돼요?","english":"May I try this on?"},{"korean":"한번 먹어 보세요.","english":"Please try eating it (just once)."},{"korean":"저도 써 봤어요.","english":"I also tried using it."}]',
   1),
  (l_id,
   'Asking for Permission: -아/어도 돼요?',
   '[Verb stem] + -아/어도 돼요? = Is it okay if I ~?',
   'This structure politely asks for permission. The affirmative answer is 네, 돼요 (Yes, that''s fine); the negative is 안 돼요 (No, that''s not okay).',
   '[{"korean":"입어 봐도 돼요?","english":"May I try it on?"},{"korean":"사진 찍어도 돼요?","english":"May I take a photo?"},{"korean":"여기 앉아도 돼요?","english":"May I sit here?"}]',
   2),
  (l_id,
   'Comparing: 이것보다 저것이 더 ~',
   '[A] + 보다 + [B] + 이/가 더 + [adjective]',
   '보다 (than) is used for comparisons. 더 (more) precedes the adjective. The thing that is "more ~" takes the subject particle.',
   '[{"korean":"이것보다 저것이 더 싸요.","english":"That one is cheaper than this one."},{"korean":"빨간색보다 파란색이 더 예뻐요.","english":"Blue is prettier than red."},{"korean":"저 가방보다 이 가방이 더 좋아요.","english":"I like this bag better than that one."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '점원', '어서 오세요! 뭘 찾으세요?', 'Eoseo oseyo! Mwol chajeuseyo?', 'Welcome! What are you looking for?', 1),
  (l_id, '손님', '티셔츠를 보고 싶어요.', 'Tisyeocheureul bogo sipeoyo.', 'I would like to look at t-shirts.', 2),
  (l_id, '점원', '이쪽이에요. 어떤 색깔을 좋아하세요?', 'Ijjog-i-eyo. Eotteon saekkal-eul joahaseyo?', 'They are over here. What color do you like?', 3),
  (l_id, '손님', '흰색이 있어요?', 'Huinsaeg-i isseoyo?', 'Do you have white?', 4),
  (l_id, '점원', '네, 있어요. 사이즈가 어떻게 되세요?', 'Ne, isseoyo. Saijeu-ga eotteoke doeseyo?', 'Yes, we do. What is your size?', 5),
  (l_id, '손님', '미디엄이요. 입어 봐도 돼요?', 'Midieoum-iyo. Ibeo bwado dwaeyo?', 'Medium. May I try it on?', 6),
  (l_id, '점원', '네, 피팅룸은 저쪽이에요.', 'Ne, piting-rum-eun jeojjog-i-eyo.', 'Yes, the fitting room is over there.', 7),
  (l_id, '손님', '얼마예요?', 'Eolma-yeyo?', 'How much is it?', 8),
  (l_id, '점원', '이만 원이에요. 지금 10% 할인 중이에요.', 'Iman won-i-eyo. Jigeum sip peosenteu harin jung-i-eyo.', 'It is 20,000 won. There is a 10% discount right now.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you ask to try on clothes in Korean?', '["입어 보고 싶어요","입어 봐도 돼요?","입어 보지 마세요","입어 봤어요?"]', 1, '입어 봐도 돼요? = May I try it on? Uses -아/어도 돼요? (permission structure).', 1),
  (l_id, '"이것보다 저것이 더 비싸요" means:', '["This is more expensive than that","That is more expensive than this","Both are expensive","Neither is expensive"]', 1, '이것보다 = than this; 저것이 = that (subject); 더 비싸요 = is more expensive. → That is more expensive than this.', 2),
  (l_id, 'What does 할인 mean?', '["receipt","exchange","discount","size"]', 2, '할인(割引) = discount.', 3),
  (l_id, '싸다 means:', '["to be expensive","to be cheap/inexpensive","to be on sale","to be big"]', 1, '싸다 = to be cheap/inexpensive. 비싸다 = to be expensive.', 4),
  (l_id, '"한번 먹어 보세요" means:', '["Please do not eat it","Did you try eating it?","Please try eating it once","You must eat it"]', 2, '-아/어 보세요 = please try doing. 먹어 보세요 = please try eating/tasting it.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에는 다양한 쇼핑 장소가 있습니다. 백화점, 쇼핑몰, 재래시장, 온라인 쇼핑몰 등이 있습니다. 물건을 살 때는 "얼마예요?"라고 가격을 물어볼 수 있습니다. 옷을 살 때는 "입어 봐도 돼요?"라고 착용해 볼 수 있습니다. 가격이 비싸다고 생각하면 "좀 깎아 주세요"라고 할인을 요청할 수 있습니다. 계산 후에는 영수증을 받는 것이 좋습니다. 교환이나 환불이 필요할 때도 영수증이 필요합니다.',
   'Korea has a variety of shopping venues: department stores, shopping malls, traditional markets, and online shopping malls. When buying something, you can ask the price with "얼마예요?" When buying clothes, you can ask to try them on with "입어 봐도 돼요?" If you think the price is too high, you can request a discount with "좀 깎아 주세요." It is a good idea to get a receipt after payment. A receipt is also needed if you need to exchange or return an item.',
   1);
END $$;

-- ============================================================
-- LESSON 29: Transportation (교통수단)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=29;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=29 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '지하철', 'jihacheol', 'subway / metro', 1),
  (l_id, '버스', 'beoseu', 'bus', 2),
  (l_id, '택시', 'taeksi', 'taxi', 3),
  (l_id, '기차', 'gicha', 'train', 4),
  (l_id, '비행기', 'bihaenggi', 'airplane', 5),
  (l_id, '자동차', 'jadongcha', 'car / automobile', 6),
  (l_id, '자전거', 'jajeon-geo', 'bicycle', 7),
  (l_id, '타다', 'tada', 'to ride / get on (transport)', 8),
  (l_id, '내리다', 'naerida', 'to get off (transport)', 9),
  (l_id, '갈아타다', 'garatada', 'to transfer (to another line)', 10),
  (l_id, '정류장', 'jeongnyujang', 'bus stop', 11),
  (l_id, '역', 'yeok', 'station', 12),
  (l_id, '교통카드', 'gyotong-kadu', 'transit card (T-money etc.)', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Means of Transportation: ~(으)로 타다/가다',
   '[Transport] + (으)로 + 가다/오다/타다',
   '(으)로 marks the means or method. After consonant-final nouns, use 으로; after vowel-final nouns, use 로.',
   '[{"korean":"지하철로 가요.","english":"I go by subway."},{"korean":"버스로 왔어요.","english":"I came by bus."},{"korean":"택시로 갈게요.","english":"I will go by taxi."}]',
   1),
  (l_id,
   'Expressing Duration of Travel: ~까지 얼마나 걸려요?',
   '[Destination] + 까지 + 얼마나 + 걸려요?',
   '까지 = until/to (destination particle). 걸리다 = to take (time). This asks how long it takes to get somewhere.',
   '[{"korean":"여기서 강남까지 얼마나 걸려요?","english":"How long does it take from here to Gangnam?"},{"korean":"지하철로 삼십 분쯤 걸려요.","english":"It takes about 30 minutes by subway."},{"korean":"걸어서 오 분이에요.","english":"It is 5 minutes on foot."}]',
   2),
  (l_id,
   'Giving Destination to Taxi Driver: ~(으)로 가 주세요',
   '[Destination] + (으)로 가 주세요',
   'The standard way to give a destination to a taxi driver or when requesting transport direction.',
   '[{"korean":"홍대로 가 주세요.","english":"Please take me to Hongdae."},{"korean":"인천 공항으로 가 주세요.","english":"Please take me to Incheon Airport."},{"korean":"이 주소로 가 주세요.","english":"Please go to this address."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '경복궁까지 어떻게 가요?', 'Gyeongbokgung-kkaji eotteoke gayo?', 'How do I get to Gyeongbokgung?', 1),
  (l_id, '민준', '지하철이 제일 편해요. 3호선 타세요.', 'Jihacheol-i jeil pyeonhaeyo. Samhoseon taseyo.', 'The subway is the most convenient. Take Line 3.', 2),
  (l_id, '수진', '어디서 타야 해요?', 'Eodiseo taya haeyo?', 'Where do I board?', 3),
  (l_id, '민준', '충무로역에서 타면 돼요. 경복궁역에서 내리세요.', 'Chungmuro-yeok-eseo tamyeon dwaeyo. Gyeongbokgung-yeok-eseo naeriseyo.', 'You can board at Chungmuro Station. Get off at Gyeongbokgung Station.', 4),
  (l_id, '수진', '갈아타야 해요?', 'Garataya haeyo?', 'Do I need to transfer?', 5),
  (l_id, '민준', '아니요, 직행이에요. 얼마나 걸려요?', 'Aniyo, jikaeng-i-eyo. Eolmana geollyeoyo?', 'No, it is a direct line. How long does it take?', 6),
  (l_id, '수진', '이십 분쯤요?', 'Isip bunjjeum-yo?', 'About twenty minutes?', 7),
  (l_id, '민준', '맞아요. 교통카드 있어요?', 'Majayo. Gyotong-kadu isseoyo?', 'That''s right. Do you have a transit card?', 8),
  (l_id, '수진', '네, T머니 있어요. 감사해요!', 'Ne, T-meoni isseoyo. Gamsahaeyo!', 'Yes, I have T-money. Thank you!', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '"지하철로 가요" means:', '["I go to the subway","I go by subway","I ride the subway station","I transfer to the subway"]', 1, '지하철로 = by subway ((으)로 = means of transport); 가요 = go. → I go by subway.', 1),
  (l_id, 'What does 갈아타다 mean?', '["to get on","to get off","to transfer (transport)","to drive"]', 2, '갈아타다 = to transfer from one line/vehicle to another.', 2),
  (l_id, 'How do you tell a taxi driver to go to Hongdae?', '["홍대로 갑니까?","홍대로 가 주세요","홍대에서 가요","홍대가 어디예요?"]', 1, '홍대로 가 주세요 = Please take me to Hongdae. Uses (으)로 (direction) + 가 주세요 (please go).', 3),
  (l_id, '"얼마나 걸려요?" asks about:', '["the price","the distance","the duration / how long it takes","the destination"]', 2, '얼마나 걸려요? = How long does it take? 걸리다 = to take (time).', 4),
  (l_id, 'What transit card is commonly used in Seoul?', '["카카오페이","T머니","신한카드","교통카드만"]', 1, 'T머니 (T-money) is the most common transit card used in Seoul''s public transportation.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '서울의 대중교통은 세계 최고 수준입니다. 지하철, 버스, 택시가 발달되어 있어 이동이 매우 편리합니다. 서울 지하철은 9개 노선이 있고 대부분의 주요 지역을 연결합니다. 교통카드(T머니)를 사용하면 지하철과 버스를 환승할 때 요금 할인을 받을 수 있습니다. 목적지까지 가는 방법을 물을 때는 "어떻게 가요?"라고 합니다. 소요 시간을 물을 때는 "얼마나 걸려요?"라고 합니다.',
   'Seoul''s public transportation is among the best in the world. Subways, buses, and taxis are well-developed, making getting around very convenient. The Seoul subway has nine lines and connects most major areas. Using a transit card (T-money) allows discounts when transferring between subways and buses. To ask how to get to a destination, say "어떻게 가요?" To ask how long it takes, say "얼마나 걸려요?"',
   1);
END $$;

-- ============================================================
-- LESSON 30: Directions (길 안내)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=30;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=30 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '오른쪽', 'oreunjjok', 'right side', 1),
  (l_id, '왼쪽', 'oenjjok', 'left side', 2),
  (l_id, '앞', 'ap', 'front', 3),
  (l_id, '뒤', 'dwi', 'back / behind', 4),
  (l_id, '옆', 'yeop', 'beside / next to', 5),
  (l_id, '직진하다', 'jikjinhada', 'to go straight', 6),
  (l_id, '돌다', 'dolda', 'to turn', 7),
  (l_id, '건너다', 'geonneoda', 'to cross (street/bridge)', 8),
  (l_id, '길을 잃다', 'gireul ilta', 'to get lost', 9),
  (l_id, '지도', 'jido', 'map', 10),
  (l_id, '근처', 'geuncheo', 'nearby / vicinity', 11),
  (l_id, '모퉁이', 'motungi', 'corner (of a road)', 12),
  (l_id, '신호등', 'sinhodeng', 'traffic light', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Giving Directions: -아/어서 + next action',
   '[Action 1] + -아/어서 + [Action 2]',
   '-아/어서 here means "and then" (sequential action). Used to chain direction steps: go straight and then turn left.',
   '[{"korean":"직진해서 오른쪽으로 도세요.","english":"Go straight and then turn right."},{"korean":"신호등에서 왼쪽으로 도세요.","english":"Turn left at the traffic light."},{"korean":"다리를 건너서 두 번째 골목에서 오른쪽이에요.","english":"Cross the bridge, and at the second alley, it is on the right."}]',
   1),
  (l_id,
   'Location Expressions: ~에 있어요',
   '[Place/building] + 이/가 + [location] + 에 있어요',
   '있어요 (to exist/be located) combined with location nouns and postpositions gives directions.',
   '[{"korean":"편의점이 오른쪽에 있어요.","english":"The convenience store is on the right."},{"korean":"학교 앞에 있어요.","english":"It is in front of the school."},{"korean":"지하철역 옆에 있어요.","english":"It is next to the subway station."}]',
   2),
  (l_id,
   'Asking for Directions: ~이/가 어디에 있어요?',
   '[Place] + 이/가 어디에 있어요? / ~에 가려면 어떻게 해요?',
   'Two standard ways to ask for directions: asking where something is, or asking how to get somewhere.',
   '[{"korean":"화장실이 어디에 있어요?","english":"Where is the restroom?"},{"korean":"명동에 가려면 어떻게 해요?","english":"How do I get to Myeongdong?"},{"korean":"여기서 가까워요?","english":"Is it close from here?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '외국인', '실례합니다. 남산타워에 어떻게 가요?', 'Silrye hamnida. Namsantawo-e eotteoke gayo?', 'Excuse me. How do I get to Namsan Tower?', 1),
  (l_id, '한국인', '버스나 케이블카를 타면 돼요. 버스는 2호선 충무로역 근처에서 타요.', 'Beosu-na keibeulka-reul tamyeon dwaeyo. Beosu-neun ichoseon Chungmuro-yeok geuncheo-eseo tayo.', 'You can take a bus or cable car. The bus departs near Chungmuro Station on Line 2.', 2),
  (l_id, '외국인', '걸어서 갈 수 있어요?', 'Georeo-seo gal su isseoyo?', 'Can I go on foot?', 3),
  (l_id, '한국인', '네, 걸어서도 갈 수 있어요. 그런데 좀 멀어요. 한 삼십 분쯤 걸려요.', 'Ne, georeo-seodo gal su isseoyo. Geureonde jom meoroyo. Han samsip bunjjeum geollyeoyo.', 'Yes, you can walk. But it is a bit far. It takes about thirty minutes.', 4),
  (l_id, '외국인', '어느 방향으로 가야 해요?', 'Eoneu banghyang-euro gaya haeyo?', 'Which direction should I go?', 5),
  (l_id, '한국인', '저 신호등에서 왼쪽으로 돌아서 직진하세요. 오른쪽에 케이블카 입구가 보여요.', 'Jeo sinhodeng-eseo oenjjok-euro dorасeo jikjinhaseyo. Oreunjjog-e keibeulka ipgu-ga boyeoyo.', 'Turn left at that traffic light and go straight. You will see the cable car entrance on your right.', 6),
  (l_id, '외국인', '감사합니다!', 'Gamsahamnida!', 'Thank you!', 7),
  (l_id, '한국인', '천만에요. 좋은 시간 보내세요!', 'Cheonman-eyo. Joeun sigan bonaeseyo!', 'Not at all. Have a great time!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "Turn right at the traffic light"?', '["신호등에서 오른쪽에 돌아요","신호등에서 오른쪽으로 도세요","신호등을 오른쪽 도세요","신호등에 오른쪽으로 가세요"]', 1, '신호등에서(at the traffic light) + 오른쪽으로(to the right) + 도세요(please turn). The correct direction particle is (으)로.', 1),
  (l_id, '"직진하다" means:', '["to turn","to go straight","to cross","to stop"]', 1, '직진(直進)하다 = to go straight. 직 = straight; 진 = advance.', 2),
  (l_id, '"편의점이 어디에 있어요?" is asking:', '["Is there a convenience store?","Where is the convenience store?","What is a convenience store?","How far is the convenience store?"]', 1, '어디에 있어요? = Where is it? 편의점이 = the convenience store (subject). → Where is the convenience store?', 3),
  (l_id, 'Which postposition means "next to"?', '["앞에","뒤에","옆에","위에"]', 2, '옆에 = next to / beside. 앞에 = in front of; 뒤에 = behind; 위에 = above.', 4),
  (l_id, 'How do you say "Cross the street and go straight"?', '["길을 건너고 직진해요","길을 건너서 직진하세요","길에서 건너 직진해요","길을 건너면 직진이에요"]', 1, '건너서 = cross and then (-아/어서 sequential). 직진하세요 = please go straight. Together: cross the street and then go straight.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에서 길을 물어볼 때는 "실례합니다"로 시작하는 것이 예의입니다. 목적지를 물을 때는 "[장소]에 어떻게 가요?" 또는 "[장소]이/가 어디에 있어요?"라고 합니다. 방향을 안내할 때는 "직진하세요", "오른쪽/왼쪽으로 도세요", "신호등에서 건너세요" 등의 표현을 씁니다. 한국어에서 위치를 나타낼 때는 "오른쪽에", "왼쪽에", "앞에", "뒤에", "옆에" 등의 표현을 사용합니다. 요즘은 스마트폰 지도 앱이 발달해 길 찾기가 더 쉬워졌습니다.',
   'In Korea, it is polite to start with "실례합니다" (excuse me) when asking for directions. To ask how to get somewhere, say "[place]에 어떻게 가요?" or "[place]이/가 어디에 있어요?" When giving directions, expressions such as "직진하세요" (go straight), "오른쪽/왼쪽으로 도세요" (turn right/left), and "신호등에서 건너세요" (cross at the traffic light) are used. To indicate location in Korean, expressions like "오른쪽에," "왼쪽에," "앞에," "뒤에," and "옆에" are used. These days, smartphone map apps have made finding one''s way much easier.',
   1);
END $$;

-- ============================================================
-- LESSON 31: At School (학교에서)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=31;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=31 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '학교', 'hakgyo', 'school', 1),
  (l_id, '교실', 'gyosil', 'classroom', 2),
  (l_id, '선생님', 'seonsaengnim', 'teacher', 3),
  (l_id, '학생', 'haksaeng', 'student', 4),
  (l_id, '칠판', 'chilpan', 'blackboard / whiteboard', 5),
  (l_id, '책상', 'chaeksang', 'desk', 6),
  (l_id, '공책', 'gongchaek', 'notebook', 7),
  (l_id, '연필', 'yeonpil', 'pencil', 8),
  (l_id, '시험', 'siheom', 'exam / test', 9),
  (l_id, '숙제', 'sukje', 'homework', 10),
  (l_id, '수업', 'sueop', 'class / lesson', 11),
  (l_id, '도서관', 'doseogwan', 'library', 12),
  (l_id, '방학', 'banghak', 'school vacation', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Existence in a Place: ~에 있어요 / ~에서 ~해요',
   'Static location: ~에 있어요 / Action location: ~에서 ~해요',
   'Use ~에 있어요 for static existence (X is in location). Use ~에서 for where an action takes place.',
   '[{"korean":"교실에 학생이 있어요.","english":"There is a student in the classroom."},{"korean":"도서관에서 공부해요.","english":"I study at the library."},{"korean":"학교에서 수업을 들어요.","english":"I attend class at school."}]',
   1),
  (l_id,
   'Obligation: -아/어야 해요',
   '[Verb stem] + -아/어야 해요 = must / have to',
   '-아야/어야 해요 expresses obligation or necessity. Colloquially it is sometimes shortened to -아/어야 돼요.',
   '[{"korean":"숙제를 해야 해요.","english":"I have to do my homework."},{"korean":"시험공부를 해야 해요.","english":"I have to study for the exam."},{"korean":"일찍 자야 해요.","english":"I have to sleep early."}]',
   2),
  (l_id,
   'Asking Politely in Class: ~가르쳐 주세요 / 다시 말해 주세요',
   '가르쳐 주세요 = please teach me / 다시 말해 주세요 = please say it again',
   'Useful classroom phrases for asking the teacher to explain or repeat.',
   '[{"korean":"이 단어가 무슨 뜻이에요?","english":"What does this word mean?"},{"korean":"다시 말해 주세요.","english":"Please say it again."},{"korean":"좀 더 천천히 말해 주세요.","english":"Please speak a bit more slowly."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '오늘 숙제 했어요?', 'Oneul sukje haesseoyo?', 'Did you do today''s homework?', 1),
  (l_id, '학생', '네, 했어요. 그런데 세 번 문제가 어려웠어요.', 'Ne, haesseoyo. Geureonde se beon munje-ga eoryeoweosseoyo.', 'Yes, I did. But problem number three was difficult.', 2),
  (l_id, '선생님', '어떤 부분이요?', 'Eotteon bubun-iyo?', 'Which part?', 3),
  (l_id, '학생', '동사 변화가 헷갈려요. 다시 설명해 주세요.', 'Dongsa byeonhwa-ga hetgallyeoyo. Dasi seolmyeonghae juseyo.', 'The verb conjugation is confusing me. Please explain it again.', 4),
  (l_id, '선생님', '알겠어요. 칠판을 보세요.', 'Algesseoyo. Chilpan-eul boseyo.', 'Got it. Look at the board.', 5),
  (l_id, '학생', '(나중에) 선생님, 이번 시험 언제예요?', '(Najunge) Seonsaengnim, ibeon siheom eonje-yeyo?', '(Later) Teacher, when is the next exam?', 6),
  (l_id, '선생님', '다음 주 금요일이에요. 열심히 공부하세요!', 'Daeum ju geum-yoil-i-eyo. Yeolsimhi gongbuhaseyo!', 'It is next Friday. Study hard!', 7),
  (l_id, '학생', '네, 열심히 하겠습니다!', 'Ne, yeolsimhi hagesseumnida!', 'Yes, I will work hard!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "I have to do homework"?', '["숙제를 해요","숙제를 해야 해요","숙제를 하고 싶어요","숙제를 했어요"]', 1, '숙제를 해야 해요 = I have to do homework. -아야/어야 해요 = must/have to.', 1),
  (l_id, '"도서관에서 공부해요" means:', '["There is a library at school","I study at the library","I am at the library","I like the library"]', 1, '도서관에서 = at the library (action location); 공부해요 = study. → I study at the library.', 2),
  (l_id, 'How do you ask a teacher to repeat something?', '["다시 써 주세요","다시 말해 주세요","더 크게 쓰세요","말하지 마세요"]', 1, '다시 말해 주세요 = Please say it again. 다시 = again; 말하다 = to speak; -아/어 주세요 = please do.', 3),
  (l_id, 'What does 방학 mean?', '["vacation from school","school day","exam period","homework"]', 0, '방학 = school vacation / holiday period (summer or winter break).', 4),
  (l_id, 'Which particle marks WHERE an action takes place?', '["에","에서","을/를","이/가"]', 1, '에서 marks the place where an action occurs: 학교에서 공부해요.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국의 학교생활은 매우 바쁩니다. 학생들은 아침 일찍 등교해서 오후 늦게 하교합니다. 수업 시간에는 선생님 말씀을 잘 듣고 공책에 필기합니다. 수업이 끝나면 숙제를 해야 합니다. 시험이 가까워지면 도서관이나 독서실에서 열심히 공부합니다. 한국에서는 교육을 매우 중요하게 여깁니다. 방학 때도 학원에 다니는 학생들이 많습니다.',
   'School life in Korea is very busy. Students arrive at school early in the morning and leave late in the afternoon. During class, they listen carefully to the teacher and take notes in their notebooks. After class they must do their homework. As exams approach, they study hard at the library or study cafes. Education is considered very important in Korea. Even during vacations, many students attend private academies (학원).',
   1);
END $$;

-- ============================================================
-- LESSON 32: At Work (직장에서)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=32;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=32 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '회사', 'hoesa', 'company / office', 1),
  (l_id, '직원', 'jigeowon', 'employee / staff member', 2),
  (l_id, '상사', 'sangsa', 'superior / boss', 3),
  (l_id, '부하', 'buha', 'subordinate', 4),
  (l_id, '회의', 'hoeui', 'meeting', 5),
  (l_id, '출근하다', 'chulgeunhada', 'to go to work / clock in', 6),
  (l_id, '퇴근하다', 'toegeunhada', 'to leave work / clock out', 7),
  (l_id, '야근하다', 'yageunhada', 'to work overtime', 8),
  (l_id, '휴가', 'hyuga', 'vacation / leave', 9),
  (l_id, '급여', 'geubyeo', 'salary / wages', 10),
  (l_id, '보고서', 'bogoseo', 'report (document)', 11),
  (l_id, '마감', 'magam', 'deadline', 12),
  (l_id, '이메일', 'imeil', 'email', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Formal Request at Work: ~해 주시겠어요?',
   '[Verb stem] + -아/어 주시겠어요? = Would you please ~?',
   '-아/어 주시겠어요? is more deferential than -아/어 주세요. Used when asking superiors or clients for something.',
   '[{"korean":"이 보고서 검토해 주시겠어요?","english":"Would you please review this report?"},{"korean":"내일까지 보내 주시겠어요?","english":"Would you please send it by tomorrow?"},{"korean":"잠깐 시간 내 주시겠어요?","english":"Would you spare a moment please?"}]',
   1),
  (l_id,
   'Reporting Completion: ~했습니다',
   '[Verb stem] + -았/었습니다 (formal report)',
   'In workplace Korean, completed actions are reported in formal -았/었습니다 form to superiors.',
   '[{"korean":"보고서 작성 완료했습니다.","english":"I have completed the report."},{"korean":"고객 미팅 참석했습니다.","english":"I attended the client meeting."},{"korean":"이메일 보냈습니다.","english":"I sent the email."}]',
   2),
  (l_id,
   'Expressing Difficulty at Work: ~기 힘들어요 / ~기 어려워요',
   '[Verb stem] + -기 (가) 힘들어요/어려워요',
   'These structures express that doing something is physically or cognitively difficult.',
   '[{"korean":"마감을 맞추기가 어려워요.","english":"It is difficult to meet the deadline."},{"korean":"야근하기가 힘들어요.","english":"Working overtime is hard."},{"korean":"혼자 하기는 어려워요.","english":"It is difficult to do alone."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '상사', '이 프로젝트 언제까지 완료할 수 있어요?', 'I peurojeekteu eonje-kkaji wanryo-hal su isseoyo?', 'By when can you complete this project?', 1),
  (l_id, '직원', '이번 주 금요일까지 완료하겠습니다.', 'Ibeon ju geumyoil-kkaji wanryohagesseumnida.', 'I will complete it by this Friday.', 2),
  (l_id, '상사', '알겠어요. 중간 보고도 해 주세요.', 'Algesseoyo. Junggan bogo-do hae juseyo.', 'Got it. Please also give interim reports.', 3),
  (l_id, '직원', '네, 수요일에 중간 보고 드리겠습니다.', 'Ne, suyoil-e junggan bogo deurigesseumnida.', 'Yes, I will give an interim report on Wednesday.', 4),
  (l_id, '직원2', '(동료에게) 오늘 야근해야 해요?', '(Dongnyo-ege) Oneul yageunhaeya haeyo?', '(To a colleague) Do you have to work overtime today?', 5),
  (l_id, '직원', '네, 마감이 내일이라서요. 피곤하지만 어쩔 수 없어요.', 'Ne, magami naeil-iraseoyo. Pigonhajiman eojjeol su eopseoyo.', 'Yes, because the deadline is tomorrow. I am tired but there is nothing I can do.', 6),
  (l_id, '직원2', '힘내요! 같이 커피 한 잔 해요.', 'Himnaeyo! Gachi keopi han jan haeyo.', 'Hang in there! Let''s grab a coffee together.', 7),
  (l_id, '직원', '고마워요, 큰 힘이 돼요!', 'Gomawoyo, keun himi dwaeyo!', 'Thank you, that is a big encouragement!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which expression is MORE deferential when asking a superior to do something?', '["~해 주세요","~해 주시겠어요?","~해 봐요","~해도 돼요?"]', 1, '-아/어 주시겠어요? (Would you please?) is more formal/deferential than -아/어 주세요 (please do).', 1),
  (l_id, 'What does 야근하다 mean?', '["to take a day off","to arrive early","to work overtime","to resign"]', 2, '야근(夜勤)하다 = to do night work = to work overtime.', 2),
  (l_id, '"보고서 작성 완료했습니다" is appropriate when:', '["Asking a colleague for help","Reporting to a superior that a report is done","Making a complaint","Requesting vacation"]', 1, 'Formal -았/었습니다 is used in workplace reporting to superiors.', 3),
  (l_id, '"마감을 맞추기가 어려워요" means:', '["The deadline was easy to meet","It is difficult to meet the deadline","I met the deadline","The deadline is tomorrow"]', 1, '-기가 어려워요 = it is difficult to do. 마감을 맞추기 = meeting the deadline (noun phrase).', 4),
  (l_id, 'How do you say "I leave work at 6 PM"?', '["여섯 시에 출근해요","여섯 시에 퇴근해요","여섯 시에 야근해요","여섯 시에 회의해요"]', 1, '퇴근하다 = to leave work. 여섯 시에 퇴근해요 = I leave work at 6.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국의 직장 문화에는 독특한 특징이 있습니다. 상하관계를 중시하여 상사에게는 존댓말을 쓰고 정중하게 대합니다. 회의나 보고가 많고, 마감 기한을 엄수하는 것이 중요합니다. 야근이 많은 편이었지만 최근에는 워라밸(일과 생활의 균형)을 중시하는 문화로 바뀌고 있습니다. 직장에서 업무를 마쳤을 때는 상사에게 완료 보고를 드리는 것이 예의입니다. "수고하셨습니다"는 동료나 상사에게 하는 일상적인 수고 인사입니다.',
   'Korean workplace culture has distinctive characteristics. Hierarchical relationships are valued highly; honorific speech is used with superiors, and interactions are respectful. There are many meetings and reports, and meeting deadlines is important. Overtime work used to be common, but recently the culture has been shifting toward emphasizing work-life balance (워라밸). It is etiquette to report task completion to one''s superior. "수고하셨습니다" (you have worked hard) is a common phrase of acknowledgment toward colleagues and superiors.',
   1);
END $$;

-- ============================================================
-- LESSON 33: At the Hospital (병원에서)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=33;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=33 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '병원', 'byeongwon', 'hospital / clinic', 1),
  (l_id, '의사', 'uisa', 'doctor', 2),
  (l_id, '간호사', 'ganhosa', 'nurse', 3),
  (l_id, '약', 'yak', 'medicine', 4),
  (l_id, '처방전', 'cheobangjeon', 'prescription', 5),
  (l_id, '증상', 'jeungsang', 'symptom', 6),
  (l_id, '열', 'yeol', 'fever', 7),
  (l_id, '기침', 'gichim', 'cough', 8),
  (l_id, '콧물', 'konmul', 'runny nose', 9),
  (l_id, '감기', 'gamgi', 'cold (illness)', 10),
  (l_id, '독감', 'dokgam', 'influenza / flu', 11),
  (l_id, '수술', 'susul', 'surgery / operation', 12),
  (l_id, '입원하다', 'ibwonhada', 'to be hospitalized', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Describing Symptoms: -이/가 있어요 / -이/가 나요',
   '[Symptom] + 이/가 있어요 = I have [symptom] / -이/가 나요 = [symptom] is coming',
   'Two natural patterns for describing medical symptoms. 있어요 is used for ongoing states; 나다 is used for symptoms that "manifest."',
   '[{"korean":"열이 있어요.","english":"I have a fever."},{"korean":"기침이 나요.","english":"I have a cough (lit. cough comes)."},{"korean":"콧물이 나요.","english":"I have a runny nose."}]',
   1),
  (l_id,
   'Expressing Duration of Illness: ~부터 ~이에요',
   '[Time/Day] + 부터 + 아팠어요',
   '부터 = from (a starting point in time). Used to express when symptoms began.',
   '[{"korean":"어제부터 아팠어요.","english":"I have been sick since yesterday."},{"korean":"삼 일 전부터 기침이 나요.","english":"I have had a cough for three days."},{"korean":"오전부터 열이 있어요.","english":"I have had a fever since morning."}]',
   2),
  (l_id,
   'Medical Instructions: ~하루에 ~번 드세요',
   '하루에 [number] 번 드세요 = Take it [number] times a day',
   'The standard formula for giving medicine instructions. 드시다 is the honorific for 먹다/마시다.',
   '[{"korean":"하루에 세 번 드세요.","english":"Take it three times a day."},{"korean":"식후에 드세요.","english":"Take it after meals."},{"korean":"이틀 동안 드세요.","english":"Take it for two days."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '간호사', '어떻게 오셨어요?', 'Eotteoke osyeosseoyo?', 'What brings you in today?', 1),
  (l_id, '환자', '어제부터 목이 아프고 열도 있어요.', 'Eoje-buteo mogi apeugeo yeoldo isseoyo.', 'Since yesterday my throat has been hurting and I have a fever too.', 2),
  (l_id, '간호사', '알겠어요. 잠깐 기다리세요. 의사 선생님이 곧 오실 거예요.', 'Algesseoyo. Jamkkan gidariseyo. Uisa seonsaengnim-i got osil geoyeyo.', 'I see. Please wait a moment. The doctor will be right with you.', 3),
  (l_id, '의사', '어디가 불편하세요?', 'Eodiga bulpyeonhaseyo?', 'Where are you uncomfortable?', 4),
  (l_id, '환자', '목이 아프고, 기침이 나고, 콧물도 나요. 열도 37.8도예요.', 'Mogi apeugeo, gichimi nago, konmuldo nayo. Yeoldo samsip-chil-jeom-pal-do-yeyo.', 'My throat hurts, I have a cough and a runny nose. My fever is 37.8 degrees.', 5),
  (l_id, '의사', '언제부터요?', 'Eonje-buteo-yo?', 'Since when?', 6),
  (l_id, '환자', '어제 저녁부터요.', 'Eoje jeonyeok-buteo-yo.', 'Since yesterday evening.', 7),
  (l_id, '의사', '감기네요. 약을 처방해 드릴게요. 하루에 세 번, 식후에 드세요.', 'Gamgi-neyo. Yageul cheobanghae deurilgeyo. Haruge se beon, sikhu-e deuseyo.', 'It is a cold. I will prescribe medicine. Take it three times a day after meals.', 8),
  (l_id, '환자', '며칠 드세요?', 'Myeochil deuseyo?', 'For how many days?', 9),
  (l_id, '의사', '삼 일 동안 드세요. 푹 쉬세요.', 'Sam-il dong-an deuseyo. Puk swiseyo.', 'Take it for three days. Rest well.', 10);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '"열이 있어요" means:', '["I have a runny nose","I have a cough","I have a fever","I have a headache"]', 2, '열 = fever; 이 = subject particle; 있어요 = have. → I have a fever.', 1),
  (l_id, 'How do you say "I have been sick since yesterday"?', '["어제 아파요","어제부터 아팠어요","어제까지 아팠어요","어제도 아파요"]', 1, '어제부터 = since yesterday; 아팠어요 = was sick (past). → I have been sick since yesterday.', 2),
  (l_id, '"하루에 세 번 드세요" means:', '["Take it three times a week","Take it three times a day","Take it for three days","Take three at once"]', 1, '하루에 = per day; 세 번 = three times; 드세요 = please take/have. → Take it three times a day.', 3),
  (l_id, 'What is 처방전?', '["a receipt","a prescription","a test result","an appointment card"]', 1, '처방전(處方箋) = a medical prescription document.', 4),
  (l_id, 'What does 식후에 mean in a medicine instruction?', '["before meals","after meals","with water","at bedtime"]', 1, '식후(食後) = after eating. 식전(食前) = before eating. 식후에 = after meals.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에서 병원에 가면 먼저 접수를 하고 대기실에서 기다립니다. 의사 선생님이 부르면 진찰실에 들어갑니다. 의사에게 증상을 설명할 때는 "[신체 부위]가 아파요"나 "열이 있어요"처럼 말합니다. 의사가 약을 처방하면 처방전을 들고 약국에 갑니다. 약사에게 처방전을 건네면 약을 받을 수 있습니다. 약을 받을 때는 복용 방법을 잘 들어야 합니다. 한국의 의료비는 건강보험 덕분에 상대적으로 저렴합니다.',
   'When you go to a hospital in Korea, you first register at reception and wait in the waiting room. When the doctor calls you, you enter the examination room. When explaining symptoms to the doctor, you say things like "[body part]가 아파요" or "열이 있어요." If the doctor prescribes medicine, you take the prescription to a pharmacy. The pharmacist will give you your medicine when you hand over the prescription. When receiving medicine, listen carefully to the dosage instructions. Thanks to national health insurance, medical costs in Korea are relatively affordable.',
   1);
END $$;

-- ============================================================
-- LESSON 34: Months and Dates (월과 날짜)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=34;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=34 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '월', 'wol', 'month (counter)', 1),
  (l_id, '일', 'il', 'day (date counter)', 2),
  (l_id, '년', 'nyeon', 'year', 3),
  (l_id, '오늘', 'oneul', 'today', 4),
  (l_id, '어제', 'eoje', 'yesterday', 5),
  (l_id, '내일', 'naeil', 'tomorrow', 6),
  (l_id, '이번 달', 'ibeon dal', 'this month', 7),
  (l_id, '다음 달', 'daeum dal', 'next month', 8),
  (l_id, '지난달', 'jinan dal', 'last month', 9),
  (l_id, '생일', 'saengil', 'birthday', 10),
  (l_id, '기념일', 'ginyeomil', 'anniversary', 11),
  (l_id, '날짜', 'naljja', 'date (calendar)', 12),
  (l_id, '몇 월 며칠', 'myeot wol myeochil', 'what month and day', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Dates: Year/Month/Day Order',
   '[Year] 년 [Month] 월 [Day] 일 — always Sino-Korean numbers',
   'Korean dates follow the order Year → Month → Day (opposite of American English). All components use Sino-Korean numbers. 년 = year, 월 = month, 일 = day.',
   '[{"korean":"이천이십육 년 사 월 오 일","english":"April 5, 2026 (written: 2026년 4월 5일)"},{"korean":"생일이 언제예요?","english":"When is your birthday?"},{"korean":"삼 월 일 일은 삼일절이에요.","english":"March 1st is Independence Movement Day."}]',
   1),
  (l_id,
   'Asking Dates: 언제예요? / 몇 월 며칠이에요?',
   '언제예요? = When is it? / 몇 월 며칠이에요? = What month and day?',
   '언제 (when) is the general time question word. 몇 월 며칠 specifically asks for the month and day of the month.',
   '[{"korean":"오늘이 몇 월 며칠이에요?","english":"What is today''s date?"},{"korean":"시험이 언제예요?","english":"When is the exam?"},{"korean":"생일이 몇 월이에요?","english":"What month is your birthday?"}]',
   2),
  (l_id,
   'Relative Time Expressions: 그저께/어제/오늘/내일/모레',
   '그저께=day before yesterday, 어제=yesterday, 오늘=today, 내일=tomorrow, 모레=day after tomorrow',
   'Korean has specific words for each day relative to today. These do not take the time particle 에 when used as adverbs.',
   '[{"korean":"그저께 서울에 왔어요.","english":"I came to Seoul the day before yesterday."},{"korean":"내일 뭐 해요?","english":"What are you doing tomorrow?"},{"korean":"모레가 제 생일이에요.","english":"My birthday is the day after tomorrow."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '수진 씨 생일이 언제예요?', 'Sujin ssi saengil-i eonje-yeyo?', 'When is your birthday, Sujin?', 1),
  (l_id, '수진', '오 월 십오 일이에요. 민준 씨는요?', 'O-wol sibon-il-i-eyo. Minjun ssi-neunyo?', 'It is May 15th. And yours?', 2),
  (l_id, '민준', '저는 십이 월 삼십일이에요. 크리스마스 다음 날이에요.', 'Jeoneun siboi-wol samsip-il-i-eyo. Keuriseumaseu daeum nal-i-eyo.', 'Mine is December 31st. It is the day after Christmas.', 3),
  (l_id, '수진', '와, 연말이네요! 생일 파티를 어떻게 해요?', 'Wa, yeonmal-ineyo! Saengil pati-reul eotteoke haeyo?', 'Wow, end of year! How do you celebrate your birthday?', 4),
  (l_id, '민준', '보통 친구들이랑 카운트다운 파티를 같이 해요. 재미있어요.', 'Botong chingudeul-irang kaunteudown pati-reul gachi haeyo. Jaemisseoyo.', 'Usually I do a countdown party with friends. It is fun.', 5),
  (l_id, '수진', '좋겠다! 저는 오 월에 한강에서 파티를 해요.', 'Jokessda! Jeoneun o-wol-e han-gang-eseo pati-reul haeyo.', 'How nice! I have a party at the Han River in May.', 6),
  (l_id, '민준', '꼭 초대해 주세요!', 'Kkok chodaehae juseyo!', 'Please definitely invite me!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How is the date "September 3" expressed in Korean?', '["구 월 삼 일","셋째 달 사흘","구월 삼","nine/three"]', 0, '구(9) 월 삼(3) 일 = September 3rd. Months and days use Sino-Korean numbers.', 1),
  (l_id, 'What is the Korean date order?', '["Day/Month/Year","Month/Day/Year","Year/Month/Day","Month/Year/Day"]', 2, 'Korean dates go Year (년) → Month (월) → Day (일): 2026년 4월 5일.', 2),
  (l_id, '"모레" means:', '["yesterday","today","tomorrow","the day after tomorrow"]', 3, '모레 = the day after tomorrow. 어제=yesterday, 오늘=today, 내일=tomorrow.', 3),
  (l_id, 'To ask "What is today''s date?" you say:', '["오늘이 언제예요?","오늘이 몇 월 며칠이에요?","오늘은 무슨 요일이에요?","오늘 날씨가 어때요?"]', 1, '몇 월 며칠이에요? specifically asks for the month and day. 언제 is also fine but vaguer.', 4),
  (l_id, 'What does 기념일 mean?', '["birthday","holiday","anniversary","calendar"]', 2, '기념일(記念日) = anniversary / commemorative day.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어로 날짜를 말할 때는 년, 월, 일 순서로 말합니다. 예를 들어 2026년 4월 5일은 "이천이십육 년 사 월 오 일"이라고 합니다. 월과 일에는 한자어 숫자를 사용합니다. 날짜와 관련된 질문은 "몇 월 며칠이에요?"라고 합니다. 한국의 중요한 기념일로는 설날(음력 1월 1일), 추석(음력 8월 15일), 삼일절(3월 1일), 광복절(8월 15일) 등이 있습니다. 생일을 물어볼 때는 "생일이 언제예요?"라고 합니다.',
   'When expressing dates in Korean, the order is year, month, day. For example, April 5, 2026 is said "이천이십육 년 사 월 오 일." Sino-Korean numbers are used for months and days. To ask about dates, the question is "몇 월 며칠이에요?" Important Korean holidays include Seollal (Lunar New Year, 1st day of the 1st lunar month), Chuseok (Harvest Festival, 15th of the 8th lunar month), Independence Movement Day (March 1st), and Liberation Day (August 15th). To ask about someone''s birthday, say "생일이 언제예요?"',
   1);
END $$;

-- ============================================================
-- LESSON 35: Telling Prices (가격 말하기)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=35;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=35 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '원', 'won', 'Korean won (currency)', 1),
  (l_id, '가격', 'gagyeok', 'price', 2),
  (l_id, '얼마예요?', 'eolma-yeyo?', 'How much is it?', 3),
  (l_id, '비싸다', 'bissada', 'to be expensive', 4),
  (l_id, '싸다', 'ssada', 'to be cheap', 5),
  (l_id, '할인', 'harin', 'discount', 6),
  (l_id, '세일', 'seil', 'sale', 7),
  (l_id, '거스름돈', 'geoseureum-don', 'change (money returned)', 8),
  (l_id, '현금', 'hyeongeum', 'cash', 9),
  (l_id, '카드', 'kadu', 'card (credit/debit)', 10),
  (l_id, '영수증', 'yeongsujeung', 'receipt', 11),
  (l_id, '공짜', 'gongjja', 'free (of charge)', 12),
  (l_id, '깎아 주세요', 'kkakka juseyo', 'please give me a discount', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Asking and Stating Prices',
   '얼마예요? / [Number] 원이에요.',
   'Price is stated using Sino-Korean numbers + 원 (Korean currency). 얼마예요? (How much?) is the standard price question.',
   '[{"korean":"이거 얼마예요?","english":"How much is this?"},{"korean":"이만 오천 원이에요.","english":"It is 25,000 won."},{"korean":"모두 얼마예요?","english":"How much is it altogether?"}]',
   1),
  (l_id,
   'Reacting to Prices: 너무 비싸요 / 좀 깎아 주세요',
   '너무 비싸요 = too expensive / 좀 깎아 주세요 = please reduce the price a little',
   'At traditional markets (시장), bargaining is expected. 좀 깎아 주세요 is the polite way to ask for a discount.',
   '[{"korean":"너무 비싸요. 좀 깎아 주세요.","english":"It is too expensive. Please give me a discount."},{"korean":"더 싸게 해 주세요.","english":"Please make it cheaper."},{"korean":"이걸로 하면 얼마예요?","english":"How much if I take this?"}]',
   2),
  (l_id,
   'Payment Method: ~(으)로 계산할게요',
   '현금으로 / 카드로 계산할게요',
   '(으)로 marks means: 현금으로 = by cash; 카드로 = by card. 계산하다 = to pay/calculate.',
   '[{"korean":"카드로 계산할게요.","english":"I will pay by card."},{"korean":"현금으로 드릴게요.","english":"I will give you cash."},{"korean":"영수증 주세요.","english":"Please give me a receipt."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '손님', '이 귤 한 봉지에 얼마예요?', 'I gyul han bongji-e eolma-yeyo?', 'How much is a bag of these tangerines?', 1),
  (l_id, '상인', '오천 원이에요.', 'Ocheon won-i-eyo.', 'It is 5,000 won.', 2),
  (l_id, '손님', '좀 비싸네요. 사천 원에 안 돼요?', 'Jom bissaneyo. Sacheon won-e an dwaeyo?', 'A bit expensive. Is 4,000 won not possible?', 3),
  (l_id, '상인', '그럼 두 봉지에 팔천 원 어때요?', 'Geureom du bongji-e palcheon won eottaeyo?', 'Then how about two bags for 8,000 won?', 4),
  (l_id, '손님', '좋아요! 두 봉지 주세요.', 'Joayo! Du bongji juseyo.', 'Great! Two bags please.', 5),
  (l_id, '상인', '여기요.', 'Yeogiyo.', 'Here you are.', 6),
  (l_id, '손님', '현금으로 드릴게요. 만 원 드릴게요.', 'Hyeongeum-euro deurilgeyo. Man won deurilgeyo.', 'I will pay cash. Here is 10,000 won.', 7),
  (l_id, '상인', '거스름돈 이천 원 드릴게요.', 'Geoseureum-don icheon won deurilgeyo.', 'Here is 2,000 won change.', 8),
  (l_id, '손님', '감사합니다!', 'Gamsahamnida!', 'Thank you!', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say 45,000 won in Korean?', '["사만오천 원","사십오천 원","사만 오천 원","오사만 원"]', 2, '사만(40,000) + 오천(5,000) = 사만 오천 원. 사십오천 is not a valid Korean number form.', 1),
  (l_id, 'Which phrase politely asks for a discount?', '["더 주세요","좀 깎아 주세요","할인 있어요?","카드 돼요?"]', 1, '좀 깎아 주세요 = Please reduce the price a bit. The standard bargaining phrase.', 2),
  (l_id, 'How do you say "I will pay by card"?', '["카드예요","카드로 계산할게요","카드를 써요","카드 줄게요"]', 1, '카드로 = by card; 계산할게요 = I will calculate/pay. → I will pay by card.', 3),
  (l_id, 'What is 거스름돈?', '["the total price","a discount","change (money returned)","a receipt"]', 2, '거스름돈 = change given back after overpaying.', 4),
  (l_id, '"모두 얼마예요?" means:', '["How much is this one?","Is there a discount?","How much altogether?","How many do you have?"]', 2, '모두 = all/altogether; 얼마예요? = how much? → How much is it altogether?', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에서 쇼핑할 때 가격을 묻는 기본 표현은 "얼마예요?"입니다. 한국 화폐 단위는 원(₩)이며, 가격은 한자어 숫자로 표현합니다. 백화점이나 편의점에서는 정가제이므로 가격 흥정이 어렵습니다. 하지만 전통 시장에서는 "좀 깎아 주세요"라고 할인을 요청할 수 있습니다. 결제 방법은 현금 또는 카드가 있으며, "카드로 계산할게요" 또는 "현금으로 드릴게요"라고 합니다. 계산 후에는 영수증을 받는 것이 좋습니다.',
   'The basic expression for asking prices when shopping in Korea is "얼마예요?" The Korean currency unit is won (₩), and prices are expressed using Sino-Korean numbers. In department stores and convenience stores, prices are fixed, so bargaining is difficult. However, at traditional markets you can request a discount with "좀 깎아 주세요." Payment can be made by cash or card, saying "카드로 계산할게요" or "현금으로 드릴게요." It is a good idea to receive a receipt after payment.',
   1);
END $$;

-- ============================================================
-- LESSON 36: Adjectives (형용사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=36;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=36 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '크다', 'keuda', 'to be big/large', 1),
  (l_id, '작다', 'jakda', 'to be small', 2),
  (l_id, '많다', 'manta', 'to be many/much', 3),
  (l_id, '적다', 'jeokda', 'to be few/little', 4),
  (l_id, '좋다', 'jota', 'to be good/nice', 5),
  (l_id, '나쁘다', 'nappeuda', 'to be bad', 6),
  (l_id, '빠르다', 'ppareuda', 'to be fast', 7),
  (l_id, '느리다', 'neurida', 'to be slow', 8),
  (l_id, '새롭다', 'saeropda', 'to be new', 9),
  (l_id, '오래되다', 'oraedoeda', 'to be old (of things)', 10),
  (l_id, '예쁘다', 'yeppeuda', 'to be pretty', 11),
  (l_id, '못생기다', 'motsaenggida', 'to be ugly (informal)', 12),
  (l_id, '재미있다', 'jaemissitda', 'to be fun/interesting', 13),
  (l_id, '재미없다', 'jaemieobsda', 'to be boring/uninteresting', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Korean Adjectives are Descriptive Verbs',
   '[Adj. stem] + -아요/어요 (predicate) / [Adj. stem] + -(으)ㄴ + Noun (modifier)',
   'In Korean, adjectives function as verbs. They conjugate for tense and can be used both as predicates and as prenominal modifiers. The modifier form drops the final vowel and adds -(으)ㄴ.',
   '[{"korean":"이 영화가 재미있어요.","english":"This movie is interesting. (predicate)"},{"korean":"재미있는 영화예요.","english":"It is an interesting movie. (modifier)"},{"korean":"크고 예쁜 꽃이에요.","english":"It is a big and pretty flower."}]',
   1),
  (l_id,
   'ㄹ Irregular Adjectives',
   '빠르다→빨라요, 모르다→몰라요 (ㄹ adjectives: ㄹ doubles before 아/어)',
   'Adjectives ending in ㄹ are irregular: before -아/어 endings, the ㄹ doubles and the stem vowel changes. This also applies to ㄹ-stem verbs.',
   '[{"korean":"빠르다 → 빨라요","english":"to be fast → is fast"},{"korean":"다르다 → 달라요","english":"to be different → is different"},{"korean":"모르다 → 몰라요","english":"to not know → does not know"}]',
   2),
  (l_id,
   'Degree Adverbs: 너무/매우/좀/별로',
   '너무(too/very), 매우(very), 좀(a bit), 별로(not really, with negative)',
   'These degree adverbs modify descriptive verbs. 별로 is always used with a negative form.',
   '[{"korean":"너무 비싸요.","english":"It is too expensive."},{"korean":"매우 예쁘네요.","english":"It is really pretty."},{"korean":"별로 안 좋아요.","english":"I don''t really like it. / It''s not great."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '이 카페 분위기가 정말 좋네요!', 'I kape bunwigi-ga jeongmal jonneyo!', 'This café has such a great atmosphere!', 1),
  (l_id, '민준', '맞아요. 크고 아늑해요. 커피도 맛있어요.', 'Majayo. Keugeo aneukaeyo. Keopi-do massisseoyo.', 'Right. It is big and cozy. The coffee is delicious too.', 2),
  (l_id, '수진', '저는 작은 카페가 더 좋아요. 이 카페는 너무 시끄러워요.', 'Jeoneun jageun kape-ga deo joayo. I kape-neun neomu sikkeureowoyo.', 'I prefer small cafés. This café is too noisy.', 3),
  (l_id, '민준', '그래요? 저는 별로 안 시끄럽다고 생각해요.', 'Geureayo? Jeoneun byeolo an sikkeureopda-go saenggakaeyo.', 'Really? I don''t think it is that noisy.', 4),
  (l_id, '수진', '사람들이 너무 많아서요. 빠른 것도 좋지만 조용한 게 더 좋아요.', 'Saramdeuri neomu manaseoyo. Ppareun geotdo jojiman joyonghan ge deo joayo.', 'There are too many people. Fast is fine, but I prefer quiet.', 5),
  (l_id, '민준', '다음에는 조용하고 작은 카페로 가요.', 'Daeume-neun joyongago jageun kape-ro gayo.', 'Next time let''s go to a quiet, small café.', 6),
  (l_id, '수진', '좋아요!', 'Joayo!', 'Sounds good!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the modifier form of 크다 (to be big)?', '["크은","크는","큰","크아"]', 2, '크다 → modifier: 크 + ㄴ = 큰 (large/big). 크 ends in a vowel, so add ㄴ directly.', 1),
  (l_id, 'Which is the correct polite form of 빠르다 (to be fast)?', '["빠르아요","빨라요","빠르어요","빠라요"]', 1, 'ㄹ irregular: 빠르다 → ㄹ doubles + 아요 → 빨라요.', 2),
  (l_id, '"별로 안 좋아요" means:', '["it is very good","it is a bit good","I don''t really like it / it''s not great","it is not good at all"]', 2, '별로 is used with negative: 별로 안 좋아요 = not really good / I don''t think much of it.', 3),
  (l_id, 'To say "interesting movie" (adjective modifying noun), which form is used?', '["재미있어요 영화","재미있는 영화","재미있은 영화","재미있 영화"]', 1, 'Adjective modifier form: 재미있다 → 재미있는. -는 for 있다/없다 modifier.', 4),
  (l_id, 'What does 새롭다 mean?', '["to be old","to be different","to be new","to be strange"]', 2, '새롭다 = to be new. Note ㅂ irregular: 새롭다 → 새로워요.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에서 형용사는 동사처럼 활용됩니다. 즉, 형용사가 직접 문장의 서술어가 될 수 있습니다. 예를 들어 "이 꽃이 예뻐요"는 "예쁘다"라는 형용사가 서술어로 쓰인 것입니다. 형용사를 명사 앞에 쓸 때는 관형형으로 바꿔야 합니다. 예를 들어 "예쁜 꽃"처럼 씁니다. 한국어 형용사 중에는 ㅂ 불규칙(새롭다→새로워요), ㄹ 불규칙(빠르다→빨라요), ㅎ 불규칙(파랗다→파래요) 등 다양한 불규칙 활용이 있습니다.',
   'In Korean, adjectives conjugate like verbs. That is, adjectives can directly serve as the predicate of a sentence. For example, "이 꽃이 예뻐요" uses the adjective 예쁘다 as the predicate. When an adjective precedes a noun, it must be converted to its modifier form. For example, "예쁜 꽃" (pretty flower). Korean adjectives include various irregular conjugation patterns: ㅂ irregular (새롭다→새로워요), ㄹ irregular (빠르다→빨라요), and ㅎ irregular (파랗다→파래요).',
   1);
END $$;

-- ============================================================
-- LESSON 37: Action Verbs (동작 동사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=37;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=37 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '가다', 'gada', 'to go', 1),
  (l_id, '오다', 'oda', 'to come', 2),
  (l_id, '만나다', 'mannada', 'to meet', 3),
  (l_id, '말하다', 'malhada', 'to speak/say', 4),
  (l_id, '듣다', 'deutda', 'to listen/hear', 5),
  (l_id, '읽다', 'ikda', 'to read', 6),
  (l_id, '쓰다', 'sseuda', 'to write; to use', 7),
  (l_id, '보다', 'boda', 'to see/watch', 8),
  (l_id, '사다', 'sada', 'to buy', 9),
  (l_id, '팔다', 'palda', 'to sell', 10),
  (l_id, '주다', 'juda', 'to give', 11),
  (l_id, '받다', 'batda', 'to receive', 12),
  (l_id, '앉다', 'anda', 'to sit down', 13),
  (l_id, '서다', 'seoda', 'to stand up/stop', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'ㄷ Irregular Verbs',
   '듣다, 걷다, 묻다 — ㄷ → ㄹ before vowel endings',
   'A handful of common verbs have ㄷ in the stem that changes to ㄹ before vowel-initial endings: -아/어요, -(으)면, -(으)러 etc.',
   '[{"korean":"듣다 → 들어요","english":"to listen → listens (듣 + 어 → 들어)"},{"korean":"걷다 → 걸어요","english":"to walk → walks"},{"korean":"묻다 → 물어요","english":"to ask → asks"}]',
   1),
  (l_id,
   'ㄹ Irregular Verbs',
   '팔다, 알다, 살다 — ㄹ drops before ㄴ/ㅂ/시/-(으)',
   'Verbs with ㄹ batchim drop the ㄹ before certain endings: -ㄴ/는, -ㅂ니다, -(으)세요, -(으)면 etc.',
   '[{"korean":"알다 → 알아요","english":"to know → knows (vowel: ㄹ stays)"},{"korean":"알다 → 압니다 (not 알ㅂ니다)","english":"knows (formal: ㄹ drops before ㅂ)"},{"korean":"팔다 → 파세요","english":"to sell → please sell (ㄹ drops before 세)"}]',
   2),
  (l_id,
   'Purpose/Direction: ~(으)러 가다/오다',
   '[Verb stem] + -(으)러 + 가다/오다',
   '-(으)러 expresses the purpose for going or coming somewhere. It can only be used with verbs of motion (가다, 오다, 다니다 etc.).',
   '[{"korean":"밥을 먹으러 식당에 가요.","english":"I go to the restaurant to eat."},{"korean":"책을 빌리러 도서관에 가요.","english":"I go to the library to borrow books."},{"korean":"친구를 만나러 왔어요.","english":"I came to meet a friend."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '주말에 뭐 해요?', 'Jumal-e mwo haeyo?', 'What are you doing on the weekend?', 1),
  (l_id, '민준', '친구를 만나러 홍대에 가요. 수진 씨도 올래요?', 'Chingu-reul mannaro Hongdae-e gayo. Sujin ssi-do ollaeyo?', 'I am going to Hongdae to meet a friend. Would you like to come too?', 2),
  (l_id, '수진', '좋아요! 몇 시에 만나요?', 'Joayo! Myeot si-e mannayo?', 'Sounds good! What time are we meeting?', 3),
  (l_id, '민준', '두 시에 홍대 정문 앞에서 만나요.', 'Du si-e Hongdae jeongmun ape-seo mannayo.', 'Let''s meet at 2 in front of the Hongdae main gate.', 4),
  (l_id, '수진', '알겠어요. 거기서 뭐 해요?', 'Algesseoyo. Geogiseo mwo haeyo?', 'Got it. What will we do there?', 5),
  (l_id, '민준', '밥 먹고 카페에서 이야기해요. 친구가 한국어 잘 못 들어요.', 'Bap meokgo kape-eseo iyagiaeyo. Chingu-ga hangugeo jal mot deureoyo.', 'Eat and chat at a café. My friend cannot understand Korean well.', 6),
  (l_id, '수진', '괜찮아요. 저도 천천히 말할게요.', 'Gwaenchanayo. Jeodo cheoncheonhi malhalgeyo.', 'That is fine. I will also speak slowly.', 7),
  (l_id, '민준', '고마워요! 내일 봐요!', 'Gomawoyo! Naeil bwayo!', 'Thank you! See you tomorrow!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the polite form of 듣다 (to listen)?', '["듣아요","듣어요","들어요","듣요"]', 2, 'ㄷ irregular: 듣다 → ㄷ → ㄹ before vowel: 들 + 어요 = 들어요.', 1),
  (l_id, '"책을 읽으러 도서관에 가요" means:', '["I go to the library and read books","I go to the library to read books","I read books at the library","The library has books to read"]', 1, '-(으)러 = in order to; 읽으러 = to read. 도서관에 가요 = go to the library. → go to the library to read books.', 2),
  (l_id, 'Which verb has a ㄷ irregular form?', '["먹다","살다","걷다","하다"]', 2, '걷다 (to walk) is a ㄷ irregular: 걷다 → 걸어요.', 3),
  (l_id, 'What does the -(으)러 ending express?', '["result","cause","purpose","concession"]', 2, '-(으)러 expresses purpose/goal: "in order to ~." Used only with motion verbs.', 4),
  (l_id, 'The polite form of 팔다 (formal -ㅂ니다) is:', '["팔ㅂ니다","팔습니다","팝니다","팔습이다"]', 2, 'ㄹ drops before ㅂ: 팔다 → 팝니다 (팔 + ㅂ니다 → ㄹ drops → 팝니다).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 동사는 어간에 어미를 붙여 활용합니다. 규칙 동사는 어간 모음의 밝기에 따라 -아요 또는 -어요를 붙입니다. 불규칙 동사는 ㄷ 불규칙, ㄹ 불규칙, ㅂ 불규칙, ㅡ 탈락 등 다양한 종류가 있습니다. 예를 들어 "듣다"는 ㄷ 불규칙으로 "들어요"가 됩니다. 동사에 -(으)러를 붙이면 목적을 나타낼 수 있습니다. "밥 먹으러 식당에 가요"는 "밥을 먹기 위해 식당에 가요"와 같은 의미입니다.',
   'Korean verbs are conjugated by attaching endings to the verb stem. Regular verbs attach -아요 or -어요 depending on the brightness of the stem vowel. Irregular verbs include various types such as ㄷ irregular, ㄹ irregular, ㅂ irregular, and ㅡ deletion. For example, "듣다" follows the ㄷ irregular and becomes "들어요." Attaching -(으)러 to a verb expresses purpose. "밥 먹으러 식당에 가요" has the same meaning as "밥을 먹기 위해 식당에 가요" (I go to the restaurant in order to eat).',
   1);
END $$;

-- ============================================================
-- LESSON 38: Particles 은/는/이/가 (주격조사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=38;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=38 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '은/는', 'eun/neun', 'topic marker (consonant-final/vowel-final)', 1),
  (l_id, '이/가', 'i/ga', 'subject marker (consonant-final/vowel-final)', 2),
  (l_id, '주제', 'juje', 'topic', 3),
  (l_id, '주어', 'jueo', 'grammatical subject', 4),
  (l_id, '대조', 'daejo', 'contrast', 5),
  (l_id, '새 정보', 'sae jeongbo', 'new information', 6),
  (l_id, '구정보', 'gujeongbo', 'given/old information', 7),
  (l_id, '강조', 'gangjo', 'emphasis', 8),
  (l_id, '배우', 'baeu', 'actor', 9),
  (l_id, '한국은', 'hanguk-eun', 'Korea (as for Korea — topic)', 10),
  (l_id, '한국이', 'hanguk-i', 'Korea (subject — specific)', 11);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Topic Marker 은/는 vs. Subject Marker 이/가',
   '은/는: topic (known, contrasted) / 이/가: subject (new info, specific focus)',
   '은/는 marks the topic — what the sentence is about, often previously mentioned or generally known. 이/가 marks the grammatical subject, often introducing new or specific information. This distinction is one of the most fundamental in Korean.',
   '[{"korean":"저는 학생이에요.","english":"As for me, I am a student. (topic: me)"},{"korean":"누가 왔어요? 수진이 왔어요.","english":"Who came? Sujin came. (이/가: new info)"},{"korean":"고양이는 귀여워요.","english":"As for cats, they are cute. (topic: cats in general)"}]',
   1),
  (l_id,
   'Contrastive 는/은',
   '[Noun A] + 는/은 + [predicate A]; [Noun B] + 는/은 + [predicate B]',
   'When 은/는 is used to contrast two items, it emphasizes the difference between them. This contrastive use is distinct from simple topicalization.',
   '[{"korean":"저는 커피를 좋아하는데 수진 씨는 차를 좋아해요.","english":"I like coffee, but Sujin likes tea. (contrast)"},{"korean":"봄은 따뜻해요. 겨울은 추워요.","english":"Spring is warm. Winter is cold. (contrast)"},{"korean":"사과는 먹었는데 배는 안 먹었어요.","english":"I ate the apple but not the pear."}]',
   2),
  (l_id,
   'Exhaustive Focus with 이/가',
   '이/가 for specific identification: "It is precisely X"',
   'In answer to 누가/뭐가 questions, 이/가 identifies the answer as precisely the one. It conveys "X and not anything else."',
   '[{"korean":"누가 한국어를 잘 해요? 수진이 잘 해요.","english":"Who speaks Korean well? Sujin (specifically) speaks it well."},{"korean":"뭐가 맛있어요? 김치찌개가 맛있어요.","english":"What is delicious? Kimchi jjigae (specifically) is delicious."},{"korean":"이게 제 가방이에요.","english":"This (one) is my bag. (identifying)"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '"나는"과 "내가"의 차이를 아세요?', '"Naneun"-gwa "naega"-eui chai-reul aseyo?', 'Do you know the difference between "나는" and "내가"?', 1),
  (l_id, '학생', '잘 모르겠어요. 둘 다 "나"를 말하지 않아요?', 'Jal moreugesseoyo. Dul da "na"-reul malhaji anayo?', 'I am not sure. Do they not both refer to "I"?', 2),
  (l_id, '선생님', '맞아요. 하지만 기능이 달라요. "나는"은 주제를 나타내고, "내가"는 주어를 강조해요.', 'Majayo. Hajiman gineung-i dallayo. "Naneun"-eun juje-reul nataenaego, "naega"-neun jueo-reul gangjoaeyo.', 'Correct. But they have different functions. "나는" marks the topic; "내가" emphasizes the subject.', 3),
  (l_id, '학생', '예를 들어 주세요.', 'Yereul deureo juseyo.', 'Please give an example.', 4),
  (l_id, '선생님', '"나는 학생이에요"는 나에 대해 말하는 거예요. "내가 했어요"는 바로 내가, 다른 사람이 아니라 내가 했다는 거예요.', '"Naneun haksaeng-i-eyo"-neun na-e daehae malaneun geoyeyo. "Naega haesseoyo"-neun baro naega, dareun saram-i anira naega haessda-neun geoyeyo.', '"나는 학생이에요" is talking about me in general. "내가 했어요" means specifically me — not someone else — did it.', 5),
  (l_id, '학생', '아, 이해했어요! 은/는은 주제, 이/가는 주어이군요.', 'A, ihaetaesseoyo! Eun/neun-eun juje, i/ga-neun jueo-igunyo.', 'Ah, I understand! 은/는 is topic, 이/가 is subject.', 6),
  (l_id, '선생님', '네, 맞아요. 그리고 은/는은 대조의 의미도 있어요.', 'Ne, majayo. Geurigo eun/neun-eun daejo-eui uimi-do isseoyo.', 'Yes, correct. And 은/는 also has a contrastive meaning.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which particle marks the topic of a sentence?', '["이/가","을/를","은/는","에서"]', 2, '은/는 is the topic marker. It marks what the sentence is generally about (often known information).', 1),
  (l_id, 'In "누가 왔어요?" the answer uses:', '["은/는","이/가","에","도"]', 1, 'Answers to 누가/뭐가 questions use 이/가 to identify the specific subject (new information).', 2),
  (l_id, '"저는 커피를 좋아하는데 수진 씨는 차를 좋아해요" shows:', '["Topic marking","Contrastive use of 은/는","Subject identification with 이/가","Object marking"]', 1, 'Two 는 markers are used contrastively: I like coffee (contrast) Sujin likes tea.', 3),
  (l_id, 'After a consonant-final noun, which form of the topic marker is used?', '["는","은","가","이"]', 1, '은 is used after consonant-final nouns: 학생은, 한국은. 는 is used after vowel-final nouns.', 4),
  (l_id, '"고양이는 귀여워요" most likely means:', '["This specific cat is cute","Cats in general are cute","The cat is not cute","Is the cat cute?"]', 1, '고양이는 = as for cats (topic). The topic marker here creates a generic/universal statement.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 조사 중 은/는과 이/가는 학습자들이 가장 많이 헷갈려하는 부분입니다. 은/는은 문장의 주제를 나타내며, 이미 알려진 정보나 대조를 표현할 때 씁니다. 이/가는 문법적 주어를 나타내며, 새로운 정보나 특정 대상을 강조할 때 씁니다. 예를 들어 "저는 학생이에요"는 화자 자신에 대한 일반적인 정보를 제공하는 반면, "제가 했어요"는 다른 사람이 아니라 바로 자신이 했다는 것을 강조합니다. 이 차이를 이해하면 한국어 능력이 크게 향상됩니다.',
   'Among Korean particles, 은/는 and 이/가 are the ones learners find most confusing. 은/는 marks the topic of a sentence and is used to express known information or contrast. 이/가 marks the grammatical subject and is used to emphasize new information or a specific referent. For example, "저는 학생이에요" provides general information about the speaker, whereas "제가 했어요" emphasizes that it was precisely the speaker — not anyone else — who did it. Understanding this distinction greatly improves Korean proficiency.',
   1);
END $$;

-- ============================================================
-- LESSON 39: Particles 을/를/에/에서 (목적격·처소 조사)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=39;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=39 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '을/를', 'eul/reul', 'object particle (marks direct object)', 1),
  (l_id, '에', 'e', 'location/direction/time particle (static, destination, time)', 2),
  (l_id, '에서', 'eseo', 'location particle (action), from (source)', 3),
  (l_id, '목적어', 'mokjeogeo', 'direct object (grammar term)', 4),
  (l_id, '처소', 'cheoso', 'location (grammar term)', 5),
  (l_id, '방향', 'banghyang', 'direction', 6),
  (l_id, '출발지', 'chulbaiji', 'departure point', 7),
  (l_id, '도착지', 'dochaiji', 'destination/arrival point', 8),
  (l_id, '한국에서', 'hanguk-eseo', 'in Korea (action location) / from Korea (source)', 9),
  (l_id, '학교에', 'hakgyo-e', 'to school (destination) / at school (static with 있다)', 10);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Object Particle 을/를',
   'Consonant-final noun + 을 / Vowel-final noun + 를',
   '을/를 marks the direct object of a transitive verb. In casual speech it is often omitted, but including it is more precise.',
   '[{"korean":"밥을 먹어요.","english":"I eat rice. (을 marks 밥 as direct object)"},{"korean":"음악을 들어요.","english":"I listen to music."},{"korean":"친구를 만나요.","english":"I meet a friend."}]',
   1),
  (l_id,
   '에 vs 에서: Location Particles',
   '에: destination (가다/오다), static location (있다/없다), time marker / 에서: action location, source (from)',
   '에 marks destinations (with motion verbs), static existence (있다/없다), and time. 에서 marks where an action actively takes place, and the starting point of motion (from).',
   '[{"korean":"학교에 가요. (destination)","english":"I go to school."},{"korean":"학교에 있어요. (static)","english":"I am at school."},{"korean":"학교에서 공부해요. (action)","english":"I study at school."},{"korean":"서울에서 왔어요. (source)","english":"I came from Seoul."}]',
   2),
  (l_id,
   'Time Particle 에',
   '[Time expression] + 에',
   '에 marks specific points in time (days, clock times, dates). It is not used with relative time words (오늘, 어제, 내일, 지금 etc.).',
   '[{"korean":"월요일에 회의가 있어요.","english":"There is a meeting on Monday."},{"korean":"세 시에 만나요.","english":"Let''s meet at 3 o''clock."},{"korean":"(오늘에×) 오늘 가요.","english":"(No 에 with 오늘) I go today."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '교실에서와 교실에가 어떻게 달라요?', '"Gyosil-eseo"-wa "gyosil-e"-ga eotteoke dallayo?', 'How are "교실에서" and "교실에" different?', 1),
  (l_id, '학생', '잘 모르겠어요. 둘 다 교실에 관한 것 아닌가요?', 'Jal moreugesseoyo. Dul da gyosil-e gwanhan geot aniingayo?', 'I am not sure. Do they not both relate to the classroom?', 2),
  (l_id, '선생님', '"교실에 있어요"는 교실 안에 있다는 뜻이에요. 하지만 "교실에서 공부해요"는 교실 안에서 공부하는 행동을 말해요.', '"Gyosil-e isseoyo"-neun gyosil an-e issda-neun tteus-i-eyo. Hajiman "gyosil-eseo gongbuhaeyo"-neun gyosil an-eseo gongbuhaneun haengdong-eul malhaeyo.', '"교실에 있어요" means being inside the classroom. But "교실에서 공부해요" describes the action of studying inside the classroom.', 3),
  (l_id, '학생', '아, 에는 위치, 에서는 행동!', 'A, e-neun wichi, eseo-neun haengdong!', 'Ah, 에 for location, 에서 for action!', 4),
  (l_id, '선생님', '맞아요! 그리고 에서는 출발점을 나타낼 수도 있어요. "서울에서 왔어요"처럼요.', 'Majayo! Geurigo eseo-neun chulbajeom-eul nataenael sudo isseoyo. "Seoul-eseo wasseoyo"-cheoreomyo.', 'Correct! And 에서 can also indicate a starting point, like "서울에서 왔어요."', 5),
  (l_id, '학생', '"을/를"은 언제 생략해요?', '"Eul/reul"-eun eonje saengnyak-aeyo?', 'When is 을/를 omitted?', 6),
  (l_id, '선생님', '대화에서는 자주 생략해요. 하지만 공식적인 글에서는 씁니다.', 'Daehwa-eseo-neun jaju saengnyak-aeyo. Hajiman gongsikjeok-in geul-eseo-neun sseumnida.', 'It is often omitted in conversation. But in formal writing it is used.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, '"도서관에서 책을 읽어요" — which particle marks the action location?', '["에","에서","을","은"]', 1, '에서 marks where the action (읽다 = to read) takes place: 도서관에서 = at the library.', 1),
  (l_id, '"학교에 가요" — what does 에 mark here?', '["Action location","Source","Destination","Time"]', 2, '에 with motion verbs (가다, 오다) marks the destination: 학교에 가요 = go to school.', 2),
  (l_id, 'Which sentence is CORRECT?', '["오늘에 학교에 가요","내일에 만나요","월요일에 회의가 있어요","지금에 먹어요"]', 2, '월요일에 is correct. 오늘, 내일, 지금 are relative time words that do NOT take 에.', 3),
  (l_id, '"서울에서 왔어요" — what does 에서 indicate here?', '["Action location","Source (from)","Destination","Time"]', 1, '에서 after a place of origin indicates the source/departure point: 서울에서 = from Seoul.', 4),
  (l_id, 'Object particle after vowel-final noun 나라 (country):', '["나라을","나라를","나라이","나라가"]', 1, 'Vowel-final noun → 를 (not 을): 나라를.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 조사 중 에와 에서는 위치를 나타내는 조사입니다. 에는 목적지(가다, 오다), 정적 위치(있다, 없다), 시간을 나타냅니다. 에서는 행동이 이루어지는 장소 또는 출발점을 나타냅니다. 예를 들어 "학교에 가요"는 학교를 향한 이동을, "학교에 있어요"는 학교에 있는 상태를, "학교에서 공부해요"는 학교에서의 행동을 나타냅니다. 을/를은 타동사의 목적어를 표시하는 조사입니다. 대화에서는 생략되는 경우가 많지만 글쓰기에서는 사용하는 것이 일반적입니다.',
   'Among Korean particles, 에 and 에서 both mark location. 에 marks a destination (with 가다/오다), a static position (with 있다/없다), and time. 에서 marks the location where an action occurs, or the point of departure. For example, "학교에 가요" indicates movement toward school, "학교에 있어요" indicates a state of being at school, and "학교에서 공부해요" indicates the action of studying at school. 을/를 is the particle marking the direct object of a transitive verb. It is frequently omitted in conversation, but is generally used in writing.',
   1);
END $$;

-- ============================================================
-- LESSON 40: Present Tense -아요/어요 (현재형)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=40;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=40 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '현재형', 'hyeunjae-hyeong', 'present tense form', 1),
  (l_id, '-아요', '-ayo', 'polite present ending (bright vowel stems)', 2),
  (l_id, '-어요', '-eoyo', 'polite present ending (dark vowel stems)', 3),
  (l_id, '-해요', '-haeyo', 'polite present ending (하다 verbs)', 4),
  (l_id, '가요', 'gayo', 'go (가다 → 가요)', 5),
  (l_id, '와요', 'wayo', 'come (오다 → 와요 — contraction)', 6),
  (l_id, '해요', 'haeyo', 'do (하다 → 해요)', 7),
  (l_id, '봐요', 'bwayo', 'see/watch (보다 → 봐요 — contraction)', 8),
  (l_id, '먹어요', 'meogeoyo', 'eat (먹다 → 먹어요)', 9),
  (l_id, '마셔요', 'masyeoyo', 'drink (마시다 → 마셔요 — ㅣ contraction)', 10),
  (l_id, '줘요', 'jwoyo', 'give (주다 → 줘요 — ㅜ contraction)', 11),
  (l_id, '배워요', 'baeweoyo', 'learn (배우다 → 배워요)', 12);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Bright Stem → -아요 / Dark Stem → -어요',
   'If last vowel of stem is ㅏ or ㅗ → -아요; otherwise → -어요',
   'The present tense ending -아요 is used when the last stem vowel is ㅏ or ㅗ (bright vowels). Otherwise -어요 is used. 하다 verbs always take 해요.',
   '[{"korean":"가다 (stem 가: ㅏ) → 가 + 아요 → 가요","english":"go → goes"},{"korean":"오다 (stem 오: ㅗ) → 오 + 아요 → 와요 (contracted)","english":"come → comes"},{"korean":"먹다 (stem 먹: ㅓ) → 먹 + 어요 → 먹어요","english":"eat → eats"}]',
   1),
  (l_id,
   'Vowel Contractions in Present Tense',
   'ㅏ+아→아, ㅗ+아→와, ㅜ+어→워, ㅣ+어→여, ㅡ+어→어 (ㅡ drops)',
   'When the verb stem ends in a vowel and the ending begins with a vowel, they contract. These contractions must be memorized.',
   '[{"korean":"보다: 보+아 → 봐요","english":"see → 봐요"},{"korean":"주다: 주+어 → 줘요","english":"give → 줘요"},{"korean":"마시다: 마시+어 → 마셔요","english":"drink → 마셔요"}]',
   2),
  (l_id,
   'Present Tense as Habitual or Near-Future',
   'Present -아/어요 = habitual, near future, or general truth',
   'Unlike English, Korean present tense covers habitual actions, general truths, and near-future plans (similar to English present progressive for plans).',
   '[{"korean":"저는 매일 커피를 마셔요.","english":"I drink coffee every day. (habitual)"},{"korean":"내일 친구를 만나요.","english":"I am meeting a friend tomorrow. (near future)"},{"korean":"서울은 한국의 수도예요.","english":"Seoul is the capital of Korea. (general truth)"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '선생님', '"먹다"의 현재형이 뭐예요?', '"Meokda"-eui hyeunjae-hyeong-i mwoyeyo?', 'What is the present form of "먹다"?', 1),
  (l_id, '학생', '먹어요!', 'Meogeoyo!', 'Meogeoyo!', 2),
  (l_id, '선생님', '맞아요! 왜 -어요를 써요?', 'Majayo! Wae -eoyo-reul sseoyo?', 'Correct! Why do we use -어요?', 3),
  (l_id, '학생', '먹다의 어간 마지막 모음이 ㅓ라서요. 어두운 모음이에요.', '"Meokda"-eui eokan majimak moeum-i "eo"-raseoyo. Eodun moeum-i-eyo.', 'Because the last vowel of 먹다''s stem is ㅓ. It is a dark vowel.', 4),
  (l_id, '선생님', '훌륭해요! "오다"는요?', 'Hullyunghaeyo! "Oda"-neunyo?', 'Excellent! What about "오다"?', 5),
  (l_id, '학생', '"오"가 ㅗ라서 -아요를 써요. 그런데 오+아→와요!', '"O"-ga "o"-raseo -ayo-reul sseoyo. Geureonde o+a→wayo!', '"오" has ㅗ, so -아요 is used. But o+a → 와요!', 6),
  (l_id, '선생님', '완벽해요! 모음 축약까지 기억하는군요!', 'Wanbyeokaeyeo! Moeum chukyak-kkaji gieokhaneungunyo!', 'Perfect! You even remember vowel contraction!', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the polite present form of 마시다 (to drink)?', '["마시아요","마시어요","마셔요","마시요"]', 2, '마시다: stem 마시 ends in ㅣ. ㅣ+어 → 여 (contraction): 마시 + 어 → 마셔요.', 1),
  (l_id, 'Which verb takes -아요 in present tense?', '["먹다","배우다","가다","마시다"]', 2, '가다: stem 가 has bright vowel ㅏ → 가 + 아요 → 가요.', 2),
  (l_id, 'What is the present form of 주다 (to give)?', '["주아요","주어요","줘요","줍니다"]', 2, '주다: 주 + 어요 → ㅜ+어 contracts to 워 → 줘요.', 3),
  (l_id, '"내일 친구를 만나요" can mean:', '["I met a friend yesterday","I usually meet friends","I will meet a friend tomorrow","I should meet a friend"]', 2, 'Korean present tense covers near-future plans: 내일(tomorrow) 만나요 = I am meeting a friend tomorrow.', 4),
  (l_id, '하다 verbs always become:', '["하아요","하어요","해요","합이다"]', 2, '하다 → 해요 (always). 하 + 여 contracts to 해: 하다 is unique.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 동사와 형용사는 어간에 어미를 붙여 활용합니다. 현재형 어미는 -아요 또는 -어요로, 어간의 마지막 모음이 ㅏ나 ㅗ이면 -아요를 붙이고, 그 외에는 -어요를 붙입니다. 하다 동사는 항상 해요가 됩니다. 어간이 모음으로 끝나면 모음 축약이 일어납니다. 예를 들어 오다는 와요, 주다는 줘요, 마시다는 마셔요가 됩니다. 현재형은 습관적 행동, 일반적 사실, 가까운 미래 계획에도 쓰입니다.',
   'Korean verbs and adjectives are conjugated by attaching endings to the stem. The present-tense ending is -아요 or -어요: if the last vowel of the stem is ㅏ or ㅗ, -아요 is attached; otherwise -어요 is used. 하다 verbs always become 해요. When the stem ends in a vowel, vowel contraction occurs. For example, 오다 becomes 와요, 주다 becomes 줘요, and 마시다 becomes 마셔요. The present tense is also used for habitual actions, general truths, and near-future plans.',
   1);
END $$;

-- ============================================================
-- LESSON 41: Past Tense -았/었어요 (과거형)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=41;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=41 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '-았어요', '-asseoyo', 'past tense ending (bright vowel stems)', 1),
  (l_id, '-었어요', '-eosseoyo', 'past tense ending (dark vowel stems)', 2),
  (l_id, '-했어요', '-haesseoyo', 'past tense ending (하다 verbs)', 3),
  (l_id, '갔어요', 'gasseoyo', 'went (가다 → 갔어요)', 4),
  (l_id, '왔어요', 'wasseoyo', 'came (오다 → 왔어요)', 5),
  (l_id, '먹었어요', 'meogeosseoyo', 'ate (먹다 → 먹었어요)', 6),
  (l_id, '봤어요', 'bwasseoyo', 'saw (보다 → 봤어요)', 7),
  (l_id, '했어요', 'haesseoyo', 'did (하다 → 했어요)', 8),
  (l_id, '공부했어요', 'gongbuhaesseoyo', 'studied (공부하다 → 공부했어요)', 9),
  (l_id, '이었어요/였어요', 'i-eosseoyo/yeosseoyo', 'was/were (이다 past)', 10);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Forming the Past Tense',
   'Present stem + -았어요 (bright) / -었어요 (dark) / -했어요 (하다)',
   'The past tense is formed by adding -았/었 to the present tense stem (the same base used for -아/어요). Then add -어요: so bright stems → -았어요, dark stems → -었어요, 하다 → 했어요.',
   '[{"korean":"가다 → 갔어요","english":"went (가 + 았어 → 갔어요, ㅏ+아 contracts)"},{"korean":"먹다 → 먹었어요","english":"ate (먹 + 었어요)"},{"korean":"공부하다 → 공부했어요","english":"studied"}]',
   1),
  (l_id,
   'Past Tense of Copula 이다',
   'Noun + 이었어요 (consonant-final) / 였어요 (vowel-final)',
   'The past form of 이에요/예요 (to be) is 이었어요 or 였어요. In speech 이었어요 often contracts to 이었어요→였어요.',
   '[{"korean":"학생이었어요.","english":"I was a student."},{"korean":"의사였어요.","english":"(He/She) was a doctor. (vowel-final 의사 → 였어요)"},{"korean":"어제는 월요일이었어요.","english":"Yesterday was Monday."}]',
   2),
  (l_id,
   'Past Tense with Time Expressions',
   '어제/지난주/작년 + past tense verb',
   'Past time words (어제=yesterday, 지난주=last week, 작년=last year, 아까=a while ago) naturally co-occur with past tense verbs.',
   '[{"korean":"어제 뭐 했어요?","english":"What did you do yesterday?"},{"korean":"지난주에 서울에 갔어요.","english":"I went to Seoul last week."},{"korean":"작년에 한국어를 시작했어요.","english":"I started Korean last year."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '어제 뭐 했어요?', 'Eoje mwo haesseoyo?', 'What did you do yesterday?', 1),
  (l_id, '수진', '친구랑 영화를 봤어요. 재미있었어요!', 'Chingu-rang yeonghwa-reul bwasseoyo. Jaemisseo-sseoyo!', 'I watched a movie with a friend. It was fun!', 2),
  (l_id, '민준', '무슨 영화요?', 'Museun yeonghwa-yo?', 'What movie?', 3),
  (l_id, '수진', '"파묘"요. 무서웠지만 정말 잘 만든 영화였어요.', '"Pamyo"-yo. Museowo-sjiman jeongmal jal mandeun yeonghwa-yeosseoyo.', '"Pamyo." It was scary but a really well-made film.', 4),
  (l_id, '민준', '저는 아직 못 봤어요. 보고 싶었는데.', 'Jeoneun ajik mot bwasseoyo. Bogo sipeonnunde.', 'I haven''t seen it yet. I wanted to see it.', 5),
  (l_id, '수진', '같이 한번 더 봐요! 두 번 봐도 좋은 영화예요.', 'Gachi hanbeon deo bwayo! Du beon bwado joeun yeonghwa-yeyo.', 'Let''s watch it together again! It is a film worth seeing twice.', 6),
  (l_id, '민준', '좋아요! 이번 주에 가요.', 'Joayo! Ibeon ju-e gayo.', 'Sounds good! Let''s go this week.', 7);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the past form of 마시다 (to drink)?', '["마셨어요","마시았어요","마시었어요","마셔었어요"]', 0, '마시다: 마시 + 었어요 → 마시+었=마셨 (ㅣ+었 contracts to 였): 마셨어요.', 1),
  (l_id, 'What is the past form of 오다 (to come)?', '["왔어요","오았어요","왔요","오었어요"]', 0, '오다: 오 + 았어요 → ㅗ+았 contracts to 왔: 왔어요.', 2),
  (l_id, 'How do you say "I was a student" (past copula)?', '["저는 학생이에요","저는 학생이었어요","저는 학생했어요","저는 학생이 았어요"]', 1, '학생이었어요: 학생(consonant-final) + 이었어요 = was a student.', 3),
  (l_id, '"작년에 서울에 갔어요" means:', '["I go to Seoul every year","I went to Seoul last year","I will go to Seoul next year","I have been to Seoul"]', 1, '작년에 = last year; 갔어요 = went (past of 가다). → I went to Seoul last year.', 4),
  (l_id, 'How is the past tense formed from 하다 verbs?', '["하+았어요 → 하았어요","하+였어요 → 하였어요","하 → 했어요","하다+었어요"]', 2, '하다 → 했어요 (always). 하+여 contracts to 해, past marker → 했어요.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어 과거형은 어간에 -았어요 또는 -었어요를 붙여 만듭니다. 어간의 마지막 모음이 ㅏ나 ㅗ이면 -았어요, 그 외에는 -었어요를 사용합니다. 하다 동사는 했어요가 됩니다. 현재형처럼 모음으로 끝나는 어간에는 축약이 일어납니다. 예를 들어 가다는 갔어요, 오다는 왔어요가 됩니다. 과거 시제를 나타내는 시간 표현으로는 어제, 지난주, 작년, 아까 등이 있습니다. 과거형을 활용하면 지난 경험이나 사건을 자연스럽게 이야기할 수 있습니다.',
   'The Korean past tense is formed by attaching -았어요 or -었어요 to the verb stem. If the last vowel of the stem is ㅏ or ㅗ, -았어요 is used; otherwise -었어요 is used. 하다 verbs become 했어요. As with the present tense, vowel contraction occurs with stems ending in a vowel. For example, 가다 becomes 갔어요 and 오다 becomes 왔어요. Time expressions indicating the past include 어제, 지난주, 작년, and 아까. Using the past tense allows natural narration of past experiences and events.',
   1);
END $$;

-- ============================================================
-- LESSON 42: Future/Intention -ㄹ/을 거예요 (미래형)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=42;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=42 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '-(으)ㄹ 거예요', '-(eu)l geoyeyo', 'future/intention: will / am going to', 1),
  (l_id, '-겠어요', '-gessseoyo', 'volitional/conjecture: I will / it seems', 2),
  (l_id, '내년', 'naenyeon', 'next year', 3),
  (l_id, '나중에', 'najunge', 'later / in the future', 4),
  (l_id, '곧', 'got', 'soon', 5),
  (l_id, '아마', 'ama', 'probably', 6),
  (l_id, '할 거예요', 'hal geoyeyo', 'will do (하다 future)', 7),
  (l_id, '갈 거예요', 'gal geoyeyo', 'will go (가다 future)', 8),
  (l_id, '먹을 거예요', 'meogeul geoyeyo', 'will eat (먹다 future)', 9),
  (l_id, '될 거예요', 'dwel geoyeyo', 'will become/it will be (되다 future)', 10);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Future with -(으)ㄹ 거예요',
   'Consonant-final stem + 을 거예요 / Vowel-final stem + ㄹ 거예요 / ㄹ-final stem + ㄹ 거예요',
   '-(으)ㄹ 거예요 expresses plans, predictions, or intentions about the future. It is the most common future expression at the A1 level.',
   '[{"korean":"내일 도서관에 갈 거예요.","english":"I will go to the library tomorrow."},{"korean":"이따가 밥을 먹을 거예요.","english":"I am going to eat later."},{"korean":"내년에 한국에 갈 거예요.","english":"I will go to Korea next year."}]',
   1),
  (l_id,
   'Volition/Promise: -ㄹ/을게요',
   'Stem + -(으)ㄹ게요 = I will (promise/decision in the moment)',
   '-(으)ㄹ게요 expresses the speaker''s decision or promise, often made in response to the situation. It carries more personal commitment than -(으)ㄹ 거예요.',
   '[{"korean":"제가 할게요.","english":"I will do it. (my decision/offer)"},{"korean":"내일 전화할게요.","english":"I will call tomorrow. (promise)"},{"korean":"조심할게요.","english":"I will be careful. (responding to advice)"}]',
   2),
  (l_id,
   'Asking About Future Plans: 뭐 할 거예요?',
   '언제/어디/뭐/누구 + -(으)ㄹ 거예요?',
   'Question words combine naturally with -(으)ㄹ 거예요 to ask about plans. This is an essential conversational pattern.',
   '[{"korean":"주말에 뭐 할 거예요?","english":"What are you going to do on the weekend?"},{"korean":"어디 갈 거예요?","english":"Where are you going to go?"},{"korean":"언제 올 거예요?","english":"When are you going to come?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '방학에 뭐 할 거예요?', 'Banghak-e mwo hal geoyeyo?', 'What are you going to do during the vacation?', 1),
  (l_id, '수진', '유럽 여행을 갈 거예요! 프랑스와 이탈리아에 가고 싶어요.', 'Yurop yeohaeng-eul gal geoyeyo! Peurangseuwa Italia-e gago sipeoyo.', 'I am going to travel to Europe! I want to go to France and Italy.', 2),
  (l_id, '민준', '와, 부러워요! 얼마나 있을 거예요?', 'Wa, bureowo! Eolmana isseul geoyeyo?', 'Wow, I envy you! How long will you stay?', 3),
  (l_id, '수진', '이 주일 정도 있을 거예요. 민준 씨는요?', 'I ju-il jeong-do isseul geoyeyo. Minjun ssi-neunyo?', 'About two weeks. What about you?', 4),
  (l_id, '민준', '저는 집에서 쉬거나 아르바이트를 할 거예요.', 'Jeoneun jib-eseo swigeo-na areubaiteu-reul hal geoyeyo.', 'I will either rest at home or do a part-time job.', 5),
  (l_id, '수진', '아르바이트 어디서 할 거예요?', 'Areubaiteu eodiseo hal geoyeyo?', 'Where will you work a part-time job?', 6),
  (l_id, '민준', '아직 모르겠어요. 카페나 편의점에서 할 것 같아요.', 'Ajik moreugesseoyo. Kape-na pyeonuijeom-eseo hal geot gatayo.', 'I don''t know yet. I think I will probably work at a café or convenience store.', 7),
  (l_id, '수진', '좋겠네요! 돈 많이 모아요!', 'Jokessneyo! Don mani moayo!', 'Sounds nice! Save up lots of money!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the future form of 먹다 (to eat)?', '["먹를 거예요","먹을 거예요","먹ㄹ 거예요","먹이 거예요"]', 1, '먹다: consonant-final stem → 을 거예요: 먹을 거예요.', 1),
  (l_id, 'What is the future form of 가다 (to go)?', '["가을 거예요","갈 거예요","가거예요","갈게요(only)"]', 1, '가다: vowel-final stem → ㄹ 거예요: 갈 거예요.', 2),
  (l_id, 'Which expresses a personal promise or in-the-moment decision?', '["-(으)ㄹ 거예요","-(으)ㄹ게요","-(으)려고 해요","-(으)ㄹ 수 있어요"]', 1, '-(으)ㄹ게요 = personal commitment/promise. 제가 할게요 = I will do it (my decision).', 3),
  (l_id, '"내년에 한국에 갈 거예요" means:', '["I went to Korea last year","I go to Korea every year","I am going to go to Korea next year","I want to go to Korea"]', 2, '내년에 = next year; 갈 거예요 = will go. → I am going to go to Korea next year.', 4),
  (l_id, 'How do you ask "What are you going to do on the weekend?"', '["주말에 뭐 했어요?","주말에 뭐 해요?","주말에 뭐 할 거예요?","주말에 뭐 했을 거예요?"]', 2, '뭐 할 거예요? = what will you do? Future question using -(으)ㄹ 거예요.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에서 미래를 나타내는 가장 일반적인 표현은 -(으)ㄹ 거예요입니다. 어간이 자음으로 끝나면 -을 거예요, 모음으로 끝나면 -ㄹ 거예요를 붙입니다. 이 표현은 계획, 예측, 의도를 나타낼 때 씁니다. -(으)ㄹ게요는 화자의 결정이나 약속을 나타내며, 상대방의 요청이나 상황에 반응할 때 많이 씁니다. 미래 시간 표현으로는 내일, 다음 주, 내년, 나중에, 곧 등이 있습니다.',
   'The most common expression for the future in Korean is -(으)ㄹ 거예요. If the stem ends in a consonant, -을 거예요 is attached; if it ends in a vowel, -ㄹ 거예요 is attached. This expression is used to convey plans, predictions, and intentions. -(으)ㄹ게요 expresses the speaker''s decision or promise, and is frequently used when responding to a request or situation. Future time expressions include 내일, 다음 주, 내년, 나중에, and 곧.',
   1);
END $$;

-- ============================================================
-- LESSON 43: Negation 안/못 (부정)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=43;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=43 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '안', 'an', 'negation prefix (volition/choice)', 1),
  (l_id, '못', 'mot', 'negation prefix (inability)', 2),
  (l_id, '-지 않다', '-ji anta', 'long negation form (volition/choice)', 3),
  (l_id, '-지 못하다', '-ji motada', 'long negation form (inability)', 4),
  (l_id, '안 먹어요', 'an meogeoyo', 'do not eat (choice)', 5),
  (l_id, '못 먹어요', 'mot meogeoyo', 'cannot eat (inability)', 6),
  (l_id, '없다', 'eobsda', 'to not exist / to not have', 7),
  (l_id, '모르다', 'moreuda', 'to not know', 8),
  (l_id, '아니다', 'anida', 'to not be (copula negation)', 9),
  (l_id, '아니에요', 'anieyo', 'is not (polite copula negation)', 10);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   '안 Negation (Volitional)',
   '안 + [Verb/Adjective] = intentionally do not / is not',
   '안 precedes the verb or adjective to express the speaker''s choice not to do something, or a factual negation of a state. For 하다 verbs: place 안 before 하다 (not before the noun): [Noun] + 안 해요.',
   '[{"korean":"오늘은 학교에 안 가요.","english":"I am not going to school today. (choice)"},{"korean":"저는 술을 안 마셔요.","english":"I don''t drink alcohol. (habitual choice)"},{"korean":"공부 안 했어요.","english":"I didn''t study. (안 before 하다 verb)"}]',
   1),
  (l_id,
   '못 Negation (Inability)',
   '못 + [Verb] = cannot / is unable to (due to external circumstances or inability)',
   '못 expresses inability — you want to do something but cannot due to circumstances or physical inability. It cannot be used with adjectives.',
   '[{"korean":"바빠서 못 갔어요.","english":"I couldn''t go because I was busy."},{"korean":"한국어를 아직 못 해요.","english":"I can''t speak Korean yet."},{"korean":"눈이 나빠서 잘 못 봐요.","english":"My eyesight is bad so I can''t see well."}]',
   2),
  (l_id,
   'Copula Negation: 아니에요',
   '[Noun] + 이/가 + 아니에요 = is not [Noun]',
   'To negate the copula (이다), use 아니다 → 아니에요. The noun takes 이/가 (subject particle).',
   '[{"korean":"저는 학생이 아니에요.","english":"I am not a student."},{"korean":"이게 제 가방이 아니에요.","english":"This is not my bag."},{"korean":"한국 사람이 아니에요?","english":"Are you not Korean?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '어제 파티에 왜 안 왔어요?', 'Eoje pati-e wae an wasseoyo?', 'Why didn''t you come to the party yesterday?', 1),
  (l_id, '민준', '몸이 안 좋아서 못 갔어요.', 'Mom-i an joa-seo mot gasseoyo.', 'I wasn''t feeling well so I couldn''t go.', 2),
  (l_id, '수진', '아, 그랬군요. 지금은 좀 어때요?', 'A, geuraessgunyo. Jigeum-eun jom eottaeyo?', 'Oh I see. How are you feeling now?', 3),
  (l_id, '민준', '좀 나아졌어요. 그런데 아직 밥을 잘 못 먹겠어요.', 'Jom naajeosseoyo. Geureonde ajik bab-eul jal mot meokgesseoyo.', 'I am a bit better. But I still cannot eat well.', 4),
  (l_id, '수진', '약은 먹었어요?', 'Yag-eun meogeosseoyo?', 'Did you take medicine?', 5),
  (l_id, '민준', '아니요, 아직 안 먹었어요. 그냥 쉬려고요.', 'Aniyo, ajik an meogeosseoyo. Geunyang swiryogoyo.', 'No, I haven''t taken any yet. I am just trying to rest.', 6),
  (l_id, '수진', '빨리 나아요!', 'Ppalli naayo!', 'Get well soon!', 7),
  (l_id, '민준', '고마워요!', 'Gomawoyo!', 'Thank you!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which negation expresses inability (external circumstance)?', '["안","못","아니다","없다"]', 1, '못 = cannot (due to circumstances or inability). 안 = do not (choice).', 1),
  (l_id, '"저는 학생이 아니에요" means:', '["I am not a student","I am not studying","I do not have a student","I cannot be a student"]', 0, '아니에요 = negation of 이다 (to be). 학생이 아니에요 = is not a student.', 2),
  (l_id, 'For 하다 verbs, 안 is placed:', '["Before the 하다: 안 공부해요","Between noun and 하다: 공부 안 해요","Both positions are correct","After 하다"]', 1, 'For 하다 verbs: [Noun] + 안 + 해요. 공부 안 해요 = I don''t study. (안 공부해요 is less natural)', 3),
  (l_id, '"바빠서 못 갔어요" expresses:', '["I chose not to go because I was busy","I could not go because I was busy","I did not go even though I was not busy","I went even though I was busy"]', 1, '못 갔어요 = could not go; 바빠서 = because I was busy (reason). → Could not go because busy.', 4),
  (l_id, '"술을 안 마셔요" vs "술을 못 마셔요" — what is the difference?', '["No difference","안: choice not to drink; 못: unable to drink","안: unable; 못: choice","Both mean not drinking now"]', 1, '안 마셔요 = I don''t drink (by choice). 못 마셔요 = I cannot drink (e.g., due to allergy, medication).', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어의 부정 표현은 크게 세 가지입니다. 첫째, "안"은 의지적 부정으로 화자가 선택적으로 하지 않는 것을 나타냅니다. 예를 들어 "오늘은 학교에 안 가요"는 학교에 가기 싫거나 가지 않기로 결정한 것입니다. 둘째, "못"은 능력 부정으로 상황이나 능력 부족으로 할 수 없음을 나타냅니���. "오늘 학교에 못 가요"는 아프거나 다른 이유로 갈 수 없다는 뜻입니다. 셋째, 이다의 부정은 아니에요를 씁니다. 학습자들은 이 세 가지 부정 표현을 잘 구분해야 합니다.',
   'There are broadly three types of negation in Korean. First, "안" is volitional negation, indicating that the speaker chooses not to do something. For example, "오늘은 학교에 안 가요" means the speaker does not want to go or has decided not to go to school. Second, "못" is ability negation, indicating inability due to circumstances or lack of ability. "오늘 학교에 못 가요" means the speaker cannot go due to illness or another reason. Third, the negation of 이다 (to be) uses 아니에요. Learners must clearly distinguish these three negation forms.',
   1);
END $$;

-- ============================================================
-- LESSON 44: Connecting sentences -고 (연결어미)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=44;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=44 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '-고', '-go', 'connective ending: and / and then', 1),
  (l_id, '-아/어서', '-a/eoseo', 'connective ending: and then (sequential/reason)', 2),
  (l_id, '-지만', '-jiman', 'connective ending: but / although', 3),
  (l_id, '-는데', '-neunde', 'connective ending: but / while / context', 4),
  (l_id, '-거나', '-geona', 'connective ending: or (alternative)', 5),
  (l_id, '그리고', 'geurigo', 'and (sentence-initial connector)', 6),
  (l_id, '그런데', 'geureonde', 'but / however / by the way', 7),
  (l_id, '그래서', 'geuraeseo', 'so / therefore', 8),
  (l_id, '그러면', 'geureomyeon', 'then / in that case', 9),
  (l_id, '하지만', 'hajiman', 'however / but (sentence-initial)', 10);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   '-고: Sequential or Simultaneous Connection',
   '[V/Adj stem] + -고 + [next clause]',
   '-고 connects two clauses meaning "and" or "and then." Crucially, -고 does not change for tense — the whole sentence''s tense is marked only on the final verb. Order implies sequence.',
   '[{"korean":"일어나고 세수해요.","english":"I wake up and wash my face."},{"korean":"크고 예뻐요.","english":"It is big and pretty. (simultaneous description)"},{"korean":"밥 먹고 커피 마셨어요.","english":"I ate and then drank coffee."}]',
   1),
  (l_id,
   '-아/어서 vs -고: Nuance Difference',
   '-아/어서: cause→result or tight sequence (cannot change tense independently)',
   '-아/어서 implies a cause-and-effect or tightly sequential relationship. Tense cannot be marked on the -아/어서 clause (it inherits the final verb''s tense). -고 allows more independence.',
   '[{"korean":"피곤해서 일찍 잤어요.","english":"I was tired so I slept early. (cause → result)"},{"korean":"밥 먹어서 배불러요.","english":"I ate so I am full."},{"korean":"도서관에 가서 공부했어요.","english":"I went to the library and (there) studied."}]',
   2),
  (l_id,
   '-지만 / 하지만: Contrast',
   '[Clause 1] + -지만 + [Clause 2] (contrastive connective)',
   '-지만 connects two clauses in contrast: "although / but." 하지만 is the sentence-initial equivalent. Both are versatile and neutral in formality.',
   '[{"korean":"비싸지만 맛있어요.","english":"It is expensive but delicious."},{"korean":"한국어는 어렵지만 재미있어요.","english":"Korean is difficult but interesting."},{"korean":"가고 싶었지만 시간이 없었어요.","english":"I wanted to go but I didn''t have time."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '한국어가 어때요? 어렵지 않아요?', 'Hangugeo-ga eottaeyo? Eoryeopji anayo?', 'How is Korean? Is it not difficult?', 1),
  (l_id, '민준', '어렵지만 재미있어요. 특히 발음이 힘들어요.', 'Eoryeopjiman jaemisseoyo. Teuki bareumi himdeuroyo.', 'It is difficult but fun. The pronunciation is especially hard.', 2),
  (l_id, '수진', '어떻게 공부해요?', 'Eotteoke gongbuhaeyo?', 'How do you study?', 3),
  (l_id, '민준', '아침에 유튜브로 듣기 연습을 하고, 저녁에는 교재로 문법을 공부해요.', 'Achim-e yutyubu-ro deutgi yeonseubeul hago, jeonyeog-eneun gyojae-ro munbeob-eul gongbuhaeyo.', 'In the morning I practice listening on YouTube, and in the evening I study grammar with a textbook.', 4),
  (l_id, '수진', '많이 발전했어요?', 'Mani baljeonhaesseoyo?', 'Have you improved a lot?', 5),
  (l_id, '민준', '처음보다 나아졌어요. 그런데 아직 말하기가 어려워요.', 'Cheoeumbo-da naajeosseoyo. Geureonde ajik malhagi-ga eoryeowoyo.', 'I have improved from the beginning. But speaking is still difficult.', 6),
  (l_id, '수진', '그래서 저하고 같이 연습하고 싶어요?', 'Geuraeseo jeo-hago gachi yeonseup-ago sipeoyo?', 'So that is why you want to practice with me?', 7),
  (l_id, '민준', '맞아요! 도와줄 수 있어요?', 'Majayo! Dowajul su isseoyo?', 'Correct! Can you help me?', 8),
  (l_id, '수진', '물론이죠! 같이 연습해요.', 'Mullon-ijiyo! Gachi yeonseuphaeyo.', 'Of course! Let''s practice together.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which connective means "but / although"?', '["-고","이/가","-지만","-아/어서"]', 2, '-지만 = but/although (contrastive connective). -고 = and/then. -아/어서 = because/and then.', 1),
  (l_id, '"밥 먹고 자요" means:', '["I sleep to eat","I eat because I sleep","I eat and then sleep","I eat but do not sleep"]', 2, '-고 = and then (sequential). 밥 먹고(eat) + 자요(sleep) = eat and then sleep.', 2),
  (l_id, 'Which sentence uses -아/어서 correctly for cause-effect?', '["피곤해서 잤어요","피곤하고 잤어요","피곤지만 잤어요","피곤하면서 잤어요"]', 0, '피곤해서 잤어요 = I was tired so I slept. -아/어서 correctly expresses cause→result.', 3),
  (l_id, '"그래서" means:', '["therefore / so","but / however","by the way","and / in addition"]', 0, '그래서 = therefore / so (result/consequence). 그런데 = but/however. 그리고 = and.', 4),
  (l_id, 'When using -고 with two clauses, tense is marked:', '["On the first verb","On both verbs","Only on the final verb","On neither verb"]', 2, '-고 clauses do not carry their own tense. The tense of the entire sentence is indicated only on the final verb.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '문장을 연결하는 방법은 한국어에서 매우 중요합니다. -고는 두 행동이나 상태를 나열할 때 씁니다. -아/어서는 원인이나 순차적 행동을 나타낼 때 씁니다. -지만은 두 내용을 대조할 때 씁니다. 예를 들어 "한국어는 어렵지만 재미있어요"는 어렵다는 내용과 재미있다는 내용을 대조합니다. 문장 시작에 쓰는 연결어로는 그리고(and), 그런데(but), 그래서(therefore), 그러면(then) 등이 있습니다. 이런 연결어를 잘 활용하면 더 자연스러운 한국어를 구사할 수 있습니다.',
   'Connecting sentences is very important in Korean. -고 is used to list two actions or states. -아/어서 is used to express a cause or sequential action. -지만 is used to contrast two ideas. For example, "한국어는 어렵지만 재미있어요" contrasts being difficult with being interesting. Sentence-initial connectors include 그리고 (and), 그런데 (but), 그래서 (therefore), and 그러면 (then). Making good use of these connectors enables more natural Korean expression.',
   1);
END $$;

-- ============================================================
-- LESSON 45: Polite requests -아/어 주세요 (부탁)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=45;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=45 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '-아/어 주세요', '-a/eo juseyo', 'please do [verb] for me', 1),
  (l_id, '-아/어 주시겠어요?', '-a/eo jusigesseoyo?', 'would you please do [verb]? (more polite)', 2),
  (l_id, '가르쳐 주세요', 'gareucheo juseyo', 'please teach me', 3),
  (l_id, '도와주세요', 'dowajuseyo', 'please help me', 4),
  (l_id, '보여 주세요', 'boyeo juseyo', 'please show me', 5),
  (l_id, '기다려 주세요', 'gidaryeo juseyo', 'please wait', 6),
  (l_id, '천천히 말해 주세요', 'cheoncheonhi malhae juseyo', 'please speak slowly', 7),
  (l_id, '다시 해 주세요', 'dasi hae juseyo', 'please do it again', 8),
  (l_id, '사진 찍어 주세요', 'sajin jjigeo juseyo', 'please take a photo (of me)', 9),
  (l_id, '전화해 주세요', 'jeonhwahae juseyo', 'please call me', 10),
  (l_id, '부탁하다', 'butakhada', 'to request / ask a favor', 11);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   '-아/어 주세요: Requesting Something Done for You',
   '[Verb stem] + -아/어 주세요',
   '주다 (to give) combined with the connective -아/어 creates a structure meaning "please do [verb] for me." It is the most standard polite request form.',
   '[{"korean":"물 좀 주세요.","english":"Please give me some water."},{"korean":"한국어로 설명해 주세요.","english":"Please explain in Korean."},{"korean":"창문 좀 닫아 주세요.","english":"Please close the window."}]',
   1),
  (l_id,
   'Softeners: 좀 and 제발',
   '좀 + [request] = a little / please (soft) / 제발 + [request] = please (urgent)',
   '좀 softens requests, making them sound less demanding. 제발 adds urgency. In everyday speech 좀 is almost always added to requests.',
   '[{"korean":"좀 도와주세요.","english":"Please help me (a little)."},{"korean":"좀 더 크게 말해 주세요.","english":"Please speak a little louder."},{"korean":"제발 기다려 주세요.","english":"Please wait (I am begging you)."}]',
   2),
  (l_id,
   'Prohibition: -지 마세요',
   '[Verb stem] + -지 마세요 = please do not ~',
   '-지 마세요 is the polite negative imperative. It asks someone not to do something politely.',
   '[{"korean":"뛰지 마세요.","english":"Please do not run."},{"korean":"걱정하지 마세요.","english":"Please do not worry."},{"korean":"여기서 사진 찍지 마세요.","english":"Please do not take photos here."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '관광객', '실례합니다. 사진 좀 찍어 주세요.', 'Silrye hamnida. Sajin jom jjigeo juseyo.', 'Excuse me. Could you please take a photo?', 1),
  (l_id, '행인', '네, 물론이죠! 어디를 누르면 돼요?', 'Ne, mullon-ijiyo! Eodireul nureumyeon dwaeyo?', 'Of course! Where do I press?', 2),
  (l_id, '관광객', '이 버튼이요. 저 경복궁이 배경에 들어오게 찍어 주세요.', 'I beotenyo. Jeo Gyeongbokgung-i baegyeong-e deureo-oge jjigeo juseyo.', 'This button. Please take it so the palace is in the background.', 3),
  (l_id, '행인', '알겠어요. 좀 왼쪽으로 서 주세요.', 'Algesseoyo. Jom oenjjok-euro seo juseyo.', 'Got it. Please stand a bit to the left.', 4),
  (l_id, '관광객', '이렇게요?', 'Ireoke-yo?', 'Like this?', 5),
  (l_id, '행인', '네, 딱 좋아요. 찍을게요. 하나 둘 셋!', 'Ne, ttak joayo. Jjigeulgeyo. Hana dul set!', 'Yes, perfect. I will take it. One two three!', 6),
  (l_id, '관광객', '감사합니다! 한 장 더 찍어 주시겠어요?', 'Gamsahamnida! Han jang deo jjigeo jusigesseoyo?', 'Thank you! Could you take one more?', 7),
  (l_id, '행인', '네, 물론이죠!', 'Ne, mullon-ijiyo!', 'Of course!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "Please explain it" in Korean?', '["설명해요","설명해 주세요","설명 주세요","설��하지 마세요"]', 1, '설명하다 → 설명해 주세요. -아/어 주세요 = please do [verb] for me.', 1),
  (l_id, '좀 in a request sentence serves to:', '["make the request more urgent","soften the request","add formality","make it negative"]', 1, '좀 softens requests, making them less demanding: 좀 도와주세요 = Please help me (softened).', 2),
  (l_id, '"걱정하지 마세요" means:', '["Please worry","Please do not worry","You should worry","Do not you worry"]', 1, '-지 마세요 = please do not ~. 걱정하지 마세요 = Please do not worry.', 3),
  (l_id, 'Which form is more politely deferential?', '["-아/어 주세요","해요","-아/어 주시겠어요?","-(으)ㄹ게요"]', 2, '-아/어 주시겠어요? (Would you please?) is more deferential than -아/어 주세요.', 4),
  (l_id, '"좀 더 크게 말해 주세요" means:', '["Please speak a lot louder","Please speak a little louder","Please do not speak loudly","Please speak slowly"]', 1, '좀 더 = a little more; 크게 = loudly; 말해 주세요 = please speak. → Please speak a little louder.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에서 정중하게 부탁하는 방법은 "-아/어 주세요"를 사용하는 것입니다. 이 표현은 상대방에게 무언가를 해 달라고 부탁할 때 씁니다. 더 정중하게 부탁하려면 "-아/어 주시겠어요?"를 사용합니다. 부탁을 부드럽게 하려면 앞에 "좀"을 붙입니다. 반면 하지 말라고 할 때는 "-지 마세요"를 씁니다. 예를 들어 "사진 좀 찍어 주세요"는 사진을 찍어 달라는 부탁이고, "여기서 사진 찍지 마세요"는 사진 찍는 것을 금지하는 표현입니다.',
   'In Korean, the way to make a polite request is to use "-아/어 주세요." This expression is used when asking someone to do something for you. For a more deferential request, "-아/어 주시겠어요?" is used. To soften a request, "좀" is added before the verb. Conversely, to ask someone not to do something, "-지 마세요" is used. For example, "사진 좀 찍어 주세요" is a request to take a photo, while "여기서 사진 찍지 마세요" is a prohibition against taking photos here.',
   1);
END $$;

-- ============================================================
-- LESSON 46: Animals (동물)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=46;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=46 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '개', 'gae', 'dog', 1),
  (l_id, '고양이', 'goyang-i', 'cat', 2),
  (l_id, '새', 'sae', 'bird', 3),
  (l_id, '물고기', 'mulgogi', 'fish', 4),
  (l_id, '토끼', 'tokki', 'rabbit', 5),
  (l_id, '곰', 'gom', 'bear', 6),
  (l_id, '호랑이', 'horangi', 'tiger', 7),
  (l_id, '사자', 'saja', 'lion', 8),
  (l_id, '코끼리', 'kokkiri', 'elephant', 9),
  (l_id, '원숭이', 'wonsung-i', 'monkey', 10),
  (l_id, '돼지', 'dwaeji', 'pig', 11),
  (l_id, '소', 'so', 'cow', 12),
  (l_id, '마리', 'mari', 'counter for animals', 13),
  (l_id, '키우다', 'kiuda', 'to raise/keep (a pet)', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Animal Counter: 마리',
   '[Native Number] + 마리',
   '마리 is the counter for animals. It always uses native Korean numbers (한, 두, 세, 네...).',
   '[{"korean":"개 두 마리가 있어요.","english":"There are two dogs."},{"korean":"고양이 한 마리를 키워요.","english":"I raise one cat."},{"korean":"새 세 마리가 날아가요.","english":"Three birds are flying away."}]',
   1),
  (l_id,
   'Describing Animal Actions with -고 있어요',
   '[Verb stem] + -고 있어요 = is doing [action] (present progressive)',
   '-고 있어요 expresses an action in progress (present progressive). It is used to describe what animals (and people) are doing right now.',
   '[{"korean":"개가 자고 있어요.","english":"The dog is sleeping."},{"korean":"고양이가 우유를 마시고 있어요.","english":"The cat is drinking milk."},{"korean":"새가 날고 있어요.","english":"The bird is flying."}]',
   2),
  (l_id,
   'Sound words for animals (의성어)',
   '개: 멍멍 / 고양이: 야옹 / 새: 짹짹 / 돼지: 꿀꿀',
   'Korean onomatopoeia (의성어) for animals often differs from English. These are fun vocabulary items that reflect Korean phonaesthetics.',
   '[{"korean":"개가 멍멍 짖어요.","english":"The dog goes woof-woof."},{"korean":"고양이가 야옹 해요.","english":"The cat goes meow."},{"korean":"아기 돼지가 꿀꿀 해요.","english":"The baby pig goes oink-oink."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '민준 씨, 반려동물 있어요?', 'Minjun ssi, ballyeodongmul isseoyo?', 'Do you have any pets?', 1),
  (l_id, '민준', '네, 고양이 한 마리 키워요. 이름은 "코코"예요.', 'Ne, goyang-i han mari kiweoyo. Ireum-eun "Koko"-yeyo.', 'Yes, I have one cat. Its name is "Koko."', 2),
  (l_id, '수진', '귀여운 이름이네요! 어떤 고양이예요?', 'Gwiyeoun ireum-ineyo! Eotteon goyang-i-yeyo?', 'What a cute name! What kind of cat is it?', 3),
  (l_id, '민준', '흰색이고 눈이 파란 고양이예요. 정말 귀여워요.', 'Huinsaek-igo nun-i paran goyang-i-yeyo. Jeongmal gwiyeowoyo.', 'It is white with blue eyes. Really cute.', 4),
  (l_id, '수진', '저도 반려동물을 키우고 싶어요. 그런데 개가 좋을지 고양이가 좋을지 모르겠어요.', 'Jeodo ballyeodongmul-eul kiugo sipeoyo. Geureonde gae-ga joeulji goyang-i-ga joeulji moreugesseoyo.', 'I also want to have a pet. But I am not sure whether a dog or a cat would be better.', 5),
  (l_id, '민준', '개는 활발하고 고양이는 독립적이에요. 어떤 성격을 좋아해요?', 'Gae-neun hwalbalago goyang-i-neun dongnibjeogieo. Eotteon seonggyeog-eul joahaeyo?', 'Dogs are lively and cats are independent. What kind of personality do you like?', 6),
  (l_id, '수진', '저는 집에 혼자 있는 시간이 많아서 활발한 개가 좋을 것 같아요.', 'Jeoneun jib-e honja inneun sigan-i manaseo hwalbalhan gae-ga joeul geot gatayo.', 'I spend a lot of time alone at home, so I think a lively dog would be better.', 7),
  (l_id, '민준', '그러면 강아지를 입양해 보세요!', 'Geureomyeon gang-aji-reul ibyang-ae boseyo!', 'Then try adopting a puppy!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which counter is used for animals?', '["개","마리","명","권"]', 1, '마리 is the counter for animals: 고양이 두 마리 = two cats.', 1),
  (l_id, '"개가 자고 있어요" means:', '["The dog slept","The dog sleeps habitually","The dog is sleeping","The dog will sleep"]', 2, '-고 있어요 = present progressive. 자고 있어요 = is sleeping.', 2),
  (l_id, 'What is the Korean onomatopoeia for a dog''s bark?', '["야옹","꿀꿀","멍멍","짹짹"]', 2, '개: 멍멍 (woof-woof). 고양이: 야옹 (meow). 돼지: 꿀꿀 (oink). 새: 짹짹 (tweet).', 3),
  (l_id, 'How do you say "I have two cats"?', '["고양이 두 개 있어요","고양이 이 마리 있어요","고양이 두 마리 있어요","고양이 두 명 있어요"]', 2, '마리 uses native Korean numbers: 두(2) 마리. 고양이 두 마리 있어요 = I have two cats.', 4),
  (l_id, '키우다 means:', '["to buy","to raise/keep (a pet)","to find","to love"]', 1, '키우다 = to raise / keep (a pet or plant). 강아지를 키워요 = I raise a puppy.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국에서 반려동물을 키우는 사람이 많아졌습니다. 특히 개와 고양이를 많이 키웁니다. 동물을 셀 때는 "마리"라는 단위를 씁니다. 예를 들어 "개 두 마리"처럼 씁니다. 한국어에는 동물 소리를 나타내는 재미있는 의성어가 있습니다. 개는 "멍멍", 고양이는 "야옹", 돼지는 "꿀꿀"이라고 합니다. 한국의 동물 의성어는 영어와 달라서 처음에는 낯설 수 있지만 익숙해지면 재미있습니다.',
   'The number of people keeping pets in Korea has increased. Dogs and cats are especially popular. When counting animals, the unit 마리 is used — for example, "개 두 마리" (two dogs). Korean has fun onomatopoeia for animal sounds. Dogs go "멍멍," cats go "야옹," and pigs go "꿀꿀." Korean animal sounds differ from English equivalents and may feel unfamiliar at first, but become enjoyable once you get used to them.',
   1);
END $$;

-- ============================================================
-- LESSON 47: Clothes (옷)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=47;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=47 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '옷', 'ot', 'clothes', 1),
  (l_id, '바지', 'baji', 'pants / trousers', 2),
  (l_id, '치마', 'chima', 'skirt', 3),
  (l_id, '셔츠', 'syeocheu', 'shirt', 4),
  (l_id, '재킷', 'jaekit', 'jacket', 5),
  (l_id, '코트', 'koteu', 'coat', 6),
  (l_id, '신발', 'sinbal', 'shoes', 7),
  (l_id, '양말', 'yangmal', 'socks', 8),
  (l_id, '모자', 'moja', 'hat / cap', 9),
  (l_id, '가방', 'gabang', 'bag', 10),
  (l_id, '입다', 'ipda', 'to wear (clothes)', 11),
  (l_id, '신다', 'sinda', 'to wear (shoes/socks)', 12),
  (l_id, '쓰다', 'sseuda', 'to wear (hat/glasses)', 13),
  (l_id, '어울리다', 'eoullida', 'to suit / look good on', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Verbs for Wearing: 입다/신다/쓰다/하다',
   '옷: 입다 / 신발·양말: 신다 / 모자·안경: 쓰다 / 액세서리: 하다',
   'Korean uses different verbs for different types of worn items. Using the wrong verb is a common learner error.',
   '[{"korean":"치마를 입어요.","english":"I wear a skirt."},{"korean":"신발을 신어요.","english":"I wear shoes."},{"korean":"모자를 써요.","english":"I wear a hat."},{"korean":"목걸이를 해요.","english":"I wear a necklace."}]',
   1),
  (l_id,
   '어울리다: To Suit / To Go Well With',
   '[Item/color] + 이/가 + [person] + 에게 + 어울려요',
   '어울리다 expresses that something looks good on someone or goes well with something else. The item takes 이/가 (subject).',
   '[{"korean":"파란색이 잘 어울려요.","english":"Blue suits you well."},{"korean":"이 재킷이 수진 씨에게 잘 어울려요.","english":"This jacket suits Sujin well."},{"korean":"이 바지랑 셔츠가 잘 어울려요.","english":"These pants and shirt go well together."}]',
   2),
  (l_id,
   'Describing Clothing: -(으)ㄴ + 옷',
   '[Adjective modifier] + 옷/셔츠/바지 etc.',
   'Adjectives modify clothing items using their modifier form. Key adjectives for clothing: 예쁜, 귀여운, 멋있는, 편한, 비싼, 따뜻한.',
   '[{"korean":"편한 신발이 필요해요.","english":"I need comfortable shoes."},{"korean":"따뜻한 코트를 샀어요.","english":"I bought a warm coat."},{"korean":"멋있는 재킷이네요!","english":"What a stylish jacket!"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '오늘 뭐 입을 거예요? 날씨가 좀 쌀쌀해요.', 'Oneul mwo ibeul geoyeyo? Nalssi-ga jom ssalssalhaeyo.', 'What are you going to wear today? The weather is a bit chilly.', 1),
  (l_id, '민준', '청바지에 따뜻한 니트를 입을 것 같아요. 코트도 입어야겠어요.', 'Cheongbaji-e tatteutan niteu-reul ibeul geot gatayo. Koteudo ibeoyagesseoyo.', 'I think I will wear jeans with a warm knit sweater. I should also put on a coat.', 2),
  (l_id, '수진', '오늘 어디 가요?', 'Oneul eodi gayo?', 'Where are you going today?', 3),
  (l_id, '민준', '소개팅이 있어요. 그래서 좀 신경 쓰고 싶어요.', 'Sogaeting-i isseoyo. Geuraeseo jom singyeong sseugo sipeoyo.', 'I have a blind date. So I want to make a bit of an effort.', 4),
  (l_id, '수진', '와! 이 재킷은 어때요? 잘 어울릴 것 같아요.', 'Wa! I jaekit-eun eottaeyo? Jal eoulril geot gatayo.', 'Wow! What about this jacket? I think it will suit you well.', 5),
  (l_id, '민준', '멋있긴 한데 좀 비싸요.', 'Meositggin hande jom bissayo.', 'It is stylish but a bit expensive.', 6),
  (l_id, '수진', '지금 세일 중이에요. 한번 입어 봐요!', 'Jigeum seil junge-yeyo. Hanbeon ibeo bwayo!', 'It is on sale now. Try it on!', 7),
  (l_id, '민준', '(입어 보고) 어때요?', '(Ibeo bogo) Eottaeyo?', '(After trying it on) How is it?', 8),
  (l_id, '수진', '정말 잘 어울려요! 꼭 사세요!', 'Jeongmal jal eoullyeoyo! Kkok saseyo!', 'It really suits you! You must buy it!', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which verb is used for wearing shoes?', '["입다","쓰다","신다","하다"]', 2, '신다 is the verb for wearing shoes and socks. 입다 = clothes; 쓰다 = hat/glasses; 하다 = accessories.', 1),
  (l_id, '"이 재킷이 잘 어울려요" means:', '["I want to buy this jacket","This jacket is too expensive","This jacket suits well","I tried on this jacket"]', 2, '어울리다 = to suit/look good on. 잘 어울려요 = suits well.', 2),
  (l_id, 'Which modifier form of 따뜻하다 correctly describes clothes?', '["따뜻하는 옷","따뜻해 옷","따뜻한 옷","따뜻했 옷"]', 2, '따뜻하다 → modifier: 따뜻한. 따뜻한 옷 = warm clothes.', 3),
  (l_id, 'To wear a hat, which verb do you use?', '["입다","쓰다","신다","매다"]', 1, '쓰다 is used for wearing items on the head (hat, glasses, sunglasses).', 4),
  (l_id, '"편한 신발이 필요해요" means:', '["I need expensive shoes","I need comfortable shoes","I want stylish shoes","I bought comfortable shoes"]', 1, '편한 = comfortable (modifier of 편하다); 신발 = shoes; 필요해요 = need. → I need comfortable shoes.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국어에서 옷을 입는 행위를 표현할 때는 착용 부위에 따라 동사가 달라집니다. 상의나 하의 등 옷을 입을 때는 "입다", 신발이나 양말을 신을 때는 "신다", 모자나 안경을 쓸 때는 "쓰다", 목걸이나 반지 같은 액세서리를 할 때는 "하다"를 씁니다. 옷이 잘 맞는지 표현할 때는 "어울리다"를 씁니다. 예를 들어 "파란색이 잘 어울려요"는 파란색이 잘 맞는다는 뜻입니다. 쇼핑할 때 "입어 봐도 돼요?"라고 피팅룸에서 입어 볼 수 있는지 물어볼 수 있습니다.',
   'In Korean, different verbs are used depending on which part of the body the clothing goes on. 입다 is used for putting on tops and bottoms; 신다 for shoes and socks; 쓰다 for hats and glasses; and 하다 for accessories like necklaces and rings. To express that something suits someone, 어울리다 is used. For example, "파란색이 잘 어울려요" means blue looks good on you. When shopping, you can ask "입어 봐도 돼요?" to try something on in the fitting room.',
   1);
END $$;

-- ============================================================
-- LESSON 48: Places in the City (도시의 장소)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=48;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=48 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '은행', 'eunhaeng', 'bank', 1),
  (l_id, '우체국', 'ucheuguk', 'post office', 2),
  (l_id, '약국', 'yakguk', 'pharmacy', 3),
  (l_id, '편의점', 'pyeonuijeom', 'convenience store', 4),
  (l_id, '마트', 'mateu', 'supermarket / mart', 5),
  (l_id, '공원', 'gongwon', 'park', 6),
  (l_id, '경찰서', 'gyeongchalseo', 'police station', 7),
  (l_id, '소방서', 'sobangseo', 'fire station', 8),
  (l_id, '미용실', 'miyongsil', 'hair salon', 9),
  (l_id, '세탁소', 'setakso', 'laundry / dry cleaner', 10),
  (l_id, '영화관', 'yeonghwagwan', 'movie theater', 11),
  (l_id, '박물관', 'bakmulgwan', 'museum', 12),
  (l_id, '어디 있어요?', 'eodi isseoyo?', 'where is it?', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Expressing Location: 어디에 있어요?',
   '[Place] + 이/가 어디에 있어요? = where is [place]?',
   'The standard location question. The place takes the subject particle 이/가 and 있어요 is the existence verb.',
   '[{"korean":"가장 가까운 약국이 어디에 있어요?","english":"Where is the nearest pharmacy?"},{"korean":"공원이 어디에 있어요?","english":"Where is the park?"},{"korean":"이 근처에 편의점이 있어요?","english":"Is there a convenience store nearby?"}]',
   1),
  (l_id,
   'Expressing Purpose at a Place: ~에 가다 + purpose',
   '[Place] + 에 가다 + [-(으)러 + purpose verb]',
   'Combines the destination particle 에, the motion verb 가다, and the purpose suffix -(으)러 to say "I go to [place] in order to [do something]."',
   '[{"korean":"돈을 찾으러 은행에 가요.","english":"I go to the bank to withdraw money."},{"korean":"편지를 부치러 우체국에 가요.","english":"I go to the post office to mail a letter."},{"korean":"약을 사러 약국에 가요.","english":"I go to the pharmacy to buy medicine."}]',
   2),
  (l_id,
   'Expressing Proximity: 가깝다/멀다',
   '[Place] + 이/가 + 가까워요/멀어요 (ㅂ irregular)',
   '가깝다 (to be near) and 멀다 (to be far) are ㅂ-irregular and ㄹ-irregular respectively.',
   '[{"korean":"학교에서 집이 가까워요?","english":"Is home close from school?"},{"korean":"병원이 좀 멀어요.","english":"The hospital is a bit far."},{"korean":"걸어서 오 분이에요.","english":"It is five minutes on foot."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '외국인', '실례합니다. 이 근처에 약국이 있어요?', 'Silrye hamnida. I geuncheo-e yakgug-i isseoyo?', 'Excuse me. Is there a pharmacy nearby?', 1),
  (l_id, '한국인', '네, 있어요. 저 신호등에서 오른쪽으로 돌면 있어요.', 'Ne, isseoyo. Jeo sinhodeng-eseo oreunjjog-euro dolmyeon isseoyo.', 'Yes, there is. Turn right at that traffic light.', 2),
  (l_id, '외국인', '걸어서 얼마나 걸려요?', 'Georeo-seo eolmana geollyeoyo?', 'How long does it take on foot?', 3),
  (l_id, '한국인', '오 분 정도요.', 'O bun jeong-doyo.', 'About five minutes.', 4),
  (l_id, '외국인', '감사합니다! 그런데 근처에 ATM도 있어요?', 'Gamsahamnida! Geureonde geuncheo-e ATM-do isseoyo?', 'Thank you! Is there also an ATM nearby?', 5),
  (l_id, '한국인', '약국 바로 옆에 편의점이 있어요. 편의점 안에 ATM이 있어요.', 'Yakguk baro yeop-e pyeonuijeom-i isseoyo. Pyeonuijeom an-e ATM-i isseoyo.', 'There is a convenience store right next to the pharmacy. The ATM is inside the convenience store.', 6),
  (l_id, '외국인', '정말 친절하세요. 감사합니다!', 'Jeongmal chinjeolhaseyo. Gamsahamnida!', 'You are so kind. Thank you!', 7),
  (l_id, '한국인', '아니에요. 즐거운 시간 보내세요!', 'Anieyo. Jeulgeoun sigan bonaeseyo!', 'Not at all. Have a good time!', 8);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'What is the Korean word for "pharmacy"?', '["병원","약국","우체국","은행"]', 1, '약국 = pharmacy (drug store). 병원 = hospital. 우체국 = post office. 은행 = bank.', 1),
  (l_id, '"돈을 찾으러 은행에 가요" means:', '["I go to the bank because I found money","I go to the bank to withdraw money","I find money at the bank","I go to the bank and find it"]', 1, '돈을 찾으러 = to withdraw money (purpose -(으)러); 은행에 가요 = go to the bank. → go to bank to withdraw money.', 2),
  (l_id, 'What is the polite form of 가깝다 (to be near)?', '["가깝아요","가까워요","가깝어요","가까아요"]', 1, 'ㅂ irregular: 가깝다 → ㅂ drops + 워 → 가까워요.', 3),
  (l_id, '"이 근처에 편의점이 있어요?" asks:', '["Where is the convenience store?","Is there a convenience store nearby?","How far is the convenience store?","What time does the convenience store open?"]', 1, '이 근처에 = in this vicinity/nearby; 편의점이 있어요? = is there a convenience store?', 4),
  (l_id, 'The verb expressing existence/location in Korean is:', '["가다","있다","되다","이다"]', 1, '있다 (polite: 있어요) = to exist / to be (located somewhere). Used for location: 어디에 있어요?', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '도시에는 다양한 장소가 있습니다. 은행, 우체국, 약국, 편의점, 마트 등은 일상생활에 필요한 장소들입니다. 위치를 물어볼 때는 "[장소]가 어디에 있어요?"라고 합니다. 가는 목적을 말할 때는 "-(으)러 가요"를 씁니다. 예를 들어 "약을 사러 약국에 가요"는 약을 사기 위해 약국에 간다는 뜻입니다. 거리를 표현할 때는 "가까워요" 또는 "멀어요"를 씁니다. 한국의 편의점은 24시간 운영되며 ATM, 택배, 음식 등 다양한 서비스를 제공합니다.',
   'There are various places in a city: banks, post offices, pharmacies, convenience stores, and supermarkets are all places needed in daily life. To ask the location, you say "[place]가 어디에 있어요?" To state the purpose of going somewhere, "-(으)러 가요" is used. For example, "약을 사러 약국에 가요" means going to the pharmacy to buy medicine. Distance is expressed with "가까워요" (close) or "멀어요" (far). Korean convenience stores operate 24 hours and provide various services including ATMs, parcel delivery, and food.',
   1);
END $$;

-- ============================================================
-- LESSON 49: Sports and Exercise (스포츠와 운동)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=49;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=49 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '운동', 'undong', 'exercise / sport', 1),
  (l_id, '축구', 'chukgu', 'soccer / football', 2),
  (l_id, '농구', 'nonggu', 'basketball', 3),
  (l_id, '야구', 'yagu', 'baseball', 4),
  (l_id, '테니스', 'teniseu', 'tennis', 5),
  (l_id, '수영', 'suyeong', 'swimming', 6),
  (l_id, '태권도', 'taekwondo', 'Taekwondo (Korean martial art)', 7),
  (l_id, '헬스장', 'helseujang', 'gym / fitness center', 8),
  (l_id, '조깅하다', 'joginghada', 'to jog', 9),
  (l_id, '이기다', 'igida', 'to win', 10),
  (l_id, '지다', 'jida', 'to lose', 11),
  (l_id, '선수', 'seonsu', 'athlete / player', 12),
  (l_id, '경기', 'gyeonggi', 'game / match / competition', 13),
  (l_id, '응원하다', 'eungwonhada', 'to cheer for / support', 14);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Sports Verbs: 하다 vs. 타다 vs. 치다',
   '팀 스포츠: ~를 하다 / 기구 스포츠(자전거/스키): ~를 타다 / 라켓 스포츠: ~를 치다',
   'Korean uses different verbs for different sports categories. Team sports and general exercise use 하다; riding sports use 타다; racket/ball-striking sports use 치다.',
   '[{"korean":"축구를 해요.","english":"I play soccer. (하다)"},{"korean":"스키를 타요.","english":"I ski. (타다)"},{"korean":"테니스를 쳐요.","english":"I play tennis. (치다)"}]',
   1),
  (l_id,
   'Frequency and Duration of Sports',
   '일주일에 [num]번 / [num] 시간 동안',
   'Frequency expressions use 일주일에(per week) + number + 번(times). Duration uses number + 시간(hours) + 동안(for/during).',
   '[{"korean":"일주일에 세 번 헬스장에 가요.","english":"I go to the gym three times a week."},{"korean":"한 시간 동안 조깅해요.","english":"I jog for one hour."},{"korean":"매일 삼십 분 운동해요.","english":"I exercise for 30 minutes every day."}]',
   2),
  (l_id,
   'Expressing Ability in Sports: -(으)ㄹ 수 있어요/없어요',
   '[Verb stem] + -(으)ㄹ 수 있어요 = can / 없어요 = cannot',
   '-(으)ㄹ 수 있다/없다 expresses ability or possibility. This is one of the most useful structures for sports conversations.',
   '[{"korean":"수영할 수 있어요?","english":"Can you swim?"},{"korean":"아직 스키를 탈 수 없어요.","english":"I cannot ski yet."},{"korean":"태권도를 배울 수 있어요.","english":"I can learn Taekwondo."}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '민준', '운동을 자주 해요?', 'Undong-eul jaju haeyo?', 'Do you exercise often?', 1),
  (l_id, '수진', '네, 일주일에 세 번 헬스장에 가요. 민준 씨는요?', 'Ne, iljuil-e se beon helseujang-e gayo. Minjun ssi-neunyo?', 'Yes, I go to the gym three times a week. What about you?', 2),
  (l_id, '민준', '저는 주말마다 친구들이랑 축구를 해요.', 'Jeoneun jumal-mada chingudeul-irang chukgu-reul haeyo.', 'I play soccer with friends every weekend.', 3),
  (l_id, '수진', '축구 잘 해요?', 'Chukgu jal haeyo?', 'Are you good at soccer?', 4),
  (l_id, '민준', '그냥 재미로 해요. 수진 씨는 무슨 운동 좋아해요?', 'Geunyang jaemiro haeyo. Sujin ssi-neun museun undong joahaeyo?', 'I just do it for fun. What sport do you like?', 5),
  (l_id, '수진', '저는 수영을 좋아해요. 근데 요즘 배드민턴도 배우고 있어요.', 'Jeoneun suyeong-eul joahaeyo. Geunde yojeum baedeuministeon-do baeugeo isseoyo.', 'I like swimming. But lately I have also been learning badminton.', 6),
  (l_id, '민준', '배드민턴 잘 쳐요?', 'Baedeuministeon jal chyeoyo?', 'Are you good at badminton?', 7),
  (l_id, '수진', '아직 잘 못 치지만 재미있어요. 같이 칠래요?', 'Ajik jal mot chijiman jaemisseoyo. Gachi chillaeyo?', 'I cannot play well yet but it is fun. Would you like to play together?', 8),
  (l_id, '민준', '좋아요! 저도 배워 볼게요.', 'Joayo! Jeodo baewo bolgeyo.', 'Sounds great! I will also try learning it.', 9);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'Which verb is used for "playing tennis"?', '["테니스를 해요","테니스를 타요","테니스를 쳐요","테니스를 놀아요"]', 2, 'Racket sports use 치다: 테니스를 쳐요 = I play tennis.', 1),
  (l_id, '"일주일에 세 번" means:', '["three weeks a day","three hours a week","three times a week","every three weeks"]', 2, '일주일에 = per week; 세 번 = three times. → three times a week.', 2),
  (l_id, '"수영할 수 있어요?" means:', '["Do you want to swim?","Can you swim?","Did you swim?","Are you swimming?"]', 1, '-(으)ㄹ 수 있어요? = can you? 수영할 수 있어요? = Can you swim?', 3),
  (l_id, 'Korea''s traditional martial art is:', '["태권도","유도","가라테","쿵푸"]', 0, '태권도 (Taekwondo) is Korea''s national martial art, known for its emphasis on kicks.', 4),
  (l_id, '"응원하다" means:', '["to exercise","to compete","to cheer for / support","to train"]', 2, '응원하다 = to cheer for, support (a team/person). 응원 = cheering/support.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국 사람들은 운동을 매우 즐깁니다. 축구, 야구, 농구는 인기 있는 팀 스포츠이고, 태권도는 한국의 전통 무술입니다. 운동을 말할 때 동사 선택이 중요합니다. 축구나 농구 같은 팀 스포츠는 "하다", 자전거나 스키는 "타다", 테니스나 배드민턴 같은 라켓 스포츠는 "치다"를 씁니다. 건강을 위해 운동하는 것이 좋습니다. "일주일에 몇 번 운동해요?"는 운동 빈도를 묻는 일반적인 표현입니다.',
   'Koreans enjoy sports very much. Soccer, baseball, and basketball are popular team sports, and Taekwondo is Korea''s traditional martial art. When talking about sports, the choice of verb is important. Team sports like soccer and basketball use 하다, riding sports like cycling and skiing use 타다, and racket sports like tennis and badminton use 치다. Exercising for health is beneficial. "일주일에 몇 번 운동해요?" is a common expression for asking how frequently someone exercises.',
   1);
END $$;

-- ============================================================
-- LESSON 50: Travel and Tourism (여행)
-- ============================================================
DO $$
DECLARE l_id integer;
BEGIN
  SELECT id INTO l_id FROM public.textbook_lessons WHERE book='korean-1' AND sort_order=50;
  IF l_id IS NULL THEN RAISE NOTICE 'sort_order=50 not found'; RETURN; END IF;
  DELETE FROM public.lesson_vocabulary WHERE lesson_id=l_id;
  DELETE FROM public.lesson_grammar    WHERE lesson_id=l_id;
  DELETE FROM public.lesson_dialogues  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_exercises  WHERE lesson_id=l_id;
  DELETE FROM public.lesson_reading    WHERE lesson_id=l_id;

  INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, sort_order) VALUES
  (l_id, '여행', 'yeohaeng', 'travel / trip', 1),
  (l_id, '공항', 'gonghang', 'airport', 2),
  (l_id, '여권', 'yeogwon', 'passport', 3),
  (l_id, '비자', 'bija', 'visa', 4),
  (l_id, '호텔', 'hotel', 'hotel', 5),
  (l_id, '체크인', 'chekeurin', 'check-in', 6),
  (l_id, '체크아웃', 'chekeuaut', 'check-out', 7),
  (l_id, '관광지', 'gwangwangji', 'tourist attraction', 8),
  (l_id, '기념품', 'ginyeompum', 'souvenir', 9),
  (l_id, '환전하다', 'hwanjeonnhada', 'to exchange currency', 10),
  (l_id, '예약하다', 'yeyakada', 'to make a reservation', 11),
  (l_id, '짐', 'jim', 'luggage / baggage', 12),
  (l_id, '투어', 'tueo', 'tour', 13);

  INSERT INTO public.lesson_grammar (lesson_id, title, structure, explanation, examples, sort_order) VALUES
  (l_id,
   'Travel Plans: -(으)려고 하다',
   '[Verb stem] + -(으)려고 해요 = intend to / plan to',
   '-(으)려고 하다 expresses an intention or plan. Unlike -(으)ㄹ 거예요 (prediction/plan), -(으)려고 하다 emphasizes the speaker''s deliberate intention.',
   '[{"korean":"내년에 한국에 여행을 가려고 해요.","english":"I plan to travel to Korea next year."},{"korean":"오늘 일찍 자려고 해요.","english":"I intend to sleep early today."},{"korean":"한국어를 열심히 배우려고 해요.","english":"I intend to study Korean hard."}]',
   1),
  (l_id,
   'Expressing Experience: -(으)ㄴ 적이 있어요/없어요',
   '[Verb stem] + -(으)ㄴ 적이 있어요/없어요 = have/have never done',
   '-(으)ㄴ 적이 있다/없다 expresses whether one has or has not had the experience of doing something.',
   '[{"korean":"한국에 가 본 적이 있어요?","english":"Have you ever been to Korea?"},{"korean":"김치를 먹어 본 적이 없어요.","english":"I have never tried kimchi."},{"korean":"태권도를 배운 적이 있어요.","english":"I have (once) learned Taekwondo."}]',
   2),
  (l_id,
   'Seeking Recommendations: 어디가 좋아요? / 뭐가 유명해요?',
   '어디가 제일 좋아요? = Where is best? / ~(으)면 꼭 가 보세요',
   'Useful structures for asking and giving travel recommendations.',
   '[{"korean":"서울에서 어디가 제일 좋아요?","english":"Where is the best place in Seoul?"},{"korean":"경복궁에 꼭 가 보세요.","english":"You must visit Gyeongbokgung Palace."},{"korean":"거기 뭐가 유명해요?","english":"What is famous there?"}]',
   3);

  INSERT INTO public.lesson_dialogues (lesson_id, speaker, korean, romanization, english, sort_order) VALUES
  (l_id, '수진', '여름 방학에 한국 여행을 가려고 해요!', 'Yeoreum banghak-e hanguk yeohaeng-eul garyogo haeyo!', 'I am planning to travel to Korea during summer vacation!', 1),
  (l_id, '민준', '정말요? 한국에 와 본 적이 있어요?', 'Jeongmal-yo? Hanguk-e wa bon jeogi isseoyo?', 'Really? Have you ever been to Korea?', 2),
  (l_id, '수진', '아니요, 처음이에요. 어디를 가면 좋아요?', 'Aniyo, cheoeum-i-eyo. Eodireul gamyeon joayo?', 'No, it is my first time. Where should I go?', 3),
  (l_id, '민준', '서울은 꼭 가 보세요. 경복궁, 명동, 한강을 추천해요.', 'Seoul-eun kkok ga boseyo. Gyeongbokgung, Myeongdong, Hangang-eul chucheonhaeyo.', 'You must go to Seoul. I recommend Gyeongbokgung, Myeongdong, and the Han River.', 4),
  (l_id, '수진', '부산도 가고 싶어요.', 'Busan-do gago sipeoyo.', 'I also want to go to Busan.', 5),
  (l_id, '민준', '부산은 해산물이 유명해요. 해운대 해수욕장도 꼭 가 보세요.', 'Busan-eun haesanmuri yumeong-haeyo. Haeundae haesuyokjang-do kkok ga boseyo.', 'Busan is famous for seafood. Also definitely visit Haeundae Beach.', 6),
  (l_id, '수진', '숙소는 어떻게 예약해요?', 'Sukso-neun eotteoke yeyakaeyo?', 'How do I make accommodation reservations?', 7),
  (l_id, '민준', '에어비앤비나 호텔 앱으로 예약하면 돼요. 미리 예약하는 게 좋아요.', 'Eeobi-anbina hotel aep-euro yeyakamyeon dwaeyo. Miri yeyakaneun ge joayo.', 'You can book via Airbnb or a hotel app. It is best to book in advance.', 8),
  (l_id, '수진', '도착하면 연락할게요!', 'Dochakamyeon yeollak-algeyo!', 'I will contact you when I arrive!', 9),
  (l_id, '민준', '기대할게요! 즐거운 여행 하세요!', 'Gidaehalgeyo! Jeulgeoun yeohaeng haseyo!', 'I look forward to it! Have a great trip!', 10);

  INSERT INTO public.lesson_exercises (lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  (l_id, 'How do you say "I plan to go to Korea"?', '["한국에 갈 거예요","한국에 가려고 해요","한국에 갔어요","한국에 가봤어요"]', 1, '-(으)려고 해요 = plan to / intend to. 한국에 가려고 해요 = I plan to go to Korea.', 1),
  (l_id, '"한국에 가 본 적이 있어요?" asks:', '["Do you plan to go to Korea?","Are you going to Korea?","Have you ever been to Korea?","Do you like Korea?"]', 2, '-(으)ㄴ 적이 있어요? = have you ever ~? 가 본 적이 있어요? = have you ever been (and seen)?', 2),
  (l_id, '"경복궁에 꼭 가 보세요" is:', '["A question about Gyeongbokgung","A strong recommendation to visit Gyeongbokgung","A prohibition against visiting","A description of Gyeongbokgung"]', 1, '꼭 = definitely/must; 가 보세요 = please try going. Together: You must definitely visit.', 3),
  (l_id, 'What does 환전하다 mean?', '["to check in","to make a reservation","to exchange currency","to buy a souvenir"]', 2, '환전(換錢)하다 = to exchange currency (money exchange).', 4),
  (l_id, '"즐거운 여행 하세요" means:', '["Have a safe trip","Have a pleasant trip","Come back soon","Take care"]', 1, '즐거운 = pleasant/enjoyable; 여행 하세요 = have a trip/travel. → Have a pleasant trip.', 5);

  INSERT INTO public.lesson_reading (lesson_id, korean_text, english_text, sort_order) VALUES
  (l_id,
   '한국은 아름다운 관광지가 많아 매년 수많은 외국인 관광객이 방문합니다. 서울에는 경복궁, 남산타워, 명동, 홍대, 한강 등 볼거리가 많습니다. 부산에는 해운대 해수욕장과 광안리 해수욕장이 유명합니다. 제주도는 화산섬으로 독특한 자연경관을 자랑합니다. 여행을 계획할 때는 미리 숙소와 교통을 예약하는 것이 좋습니다. 한국어를 조금만 할 수 있어도 현지인들과 소통하는 데 큰 도움이 됩니다. 한국 여행을 통해 한국의 문화, 음식, 언어를 직접 경험해 보세요!',
   'Korea has many beautiful tourist attractions and is visited by countless foreign tourists every year. Seoul offers many sights: Gyeongbokgung Palace, Namsan Tower, Myeongdong, Hongdae, and the Han River, among others. In Busan, Haeundae Beach and Gwangalli Beach are famous. Jeju Island, a volcanic island, boasts a unique natural landscape. When planning a trip, it is advisable to book accommodation and transportation in advance. Even a little Korean goes a long way in communicating with locals. Experience Korean culture, food, and language directly through travel to Korea!',
   1);
END $$;

-- ============================================================
-- END OF MIGRATION: Korean-1 Lessons 1–50
-- ============================================================
