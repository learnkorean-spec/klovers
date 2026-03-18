import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yqzjsmqrtxwaxqzyhxki.supabase.co',
  'sb_secret_EkMbAC4-DdPjSq4UOzItdQ_5K86bTfs'
);

const { data: lesson, error: le } = await supabase
  .from('textbook_lessons')
  .select('id')
  .eq('book', 'kdrama')
  .eq('sort_order', 1)
  .single();

if (le || !lesson) { console.error('Lesson not found:', le?.message); process.exit(1); }
const lid = lesson.id;
console.log('Lesson ID:', lid);

for (const t of ['lesson_vocabulary','lesson_grammar','lesson_dialogues','lesson_exercises','lesson_reading']) {
  const { error } = await supabase.from(t).delete().eq('lesson_id', lid);
  if (error) console.error(`Delete ${t}:`, error.message);
  else console.log(`Cleared ${t}`);
}

const { error: ve } = await supabase.from('lesson_vocabulary').insert([
  {lesson_id:lid,korean:'안녕하세요',romanization:'annyeonghaseyo',meaning:'Hello / How do you do? (polite)',sort_order:1},
  {lesson_id:lid,korean:'만나서 반갑습니다',romanization:'mannaseo bangapseumnida',meaning:'Nice to meet you (formal)',sort_order:2},
  {lesson_id:lid,korean:'처음 뵙겠습니다',romanization:'cheoeum boepgesseumnida',meaning:'Nice to meet you for the first time (very formal)',sort_order:3},
  {lesson_id:lid,korean:'저는 ~입니다',romanization:'jeoneun ~imnida',meaning:'I am ~ (formal self-introduction)',sort_order:4},
  {lesson_id:lid,korean:'이름',romanization:'ireum',meaning:'name',sort_order:5},
  {lesson_id:lid,korean:'성함',romanization:'seongham',meaning:'name (honorific form)',sort_order:6},
  {lesson_id:lid,korean:'잘 부탁드립니다',romanization:'jal butakdeurimnida',meaning:'Please take care of me (set phrase)',sort_order:7},
  {lesson_id:lid,korean:'소개하다',romanization:'sogaehada',meaning:'to introduce',sort_order:8},
  {lesson_id:lid,korean:'인사하다',romanization:'insahada',meaning:'to greet',sort_order:9},
  {lesson_id:lid,korean:'처음',romanization:'cheoeum',meaning:'first time',sort_order:10},
  {lesson_id:lid,korean:'반갑다',romanization:'bangapda',meaning:'to be pleased / glad to meet',sort_order:11},
  {lesson_id:lid,korean:'선배',romanization:'seonbae',meaning:'senior (at work or school)',sort_order:12},
  {lesson_id:lid,korean:'후배',romanization:'hubae',meaning:'junior (at work or school)',sort_order:13},
  {lesson_id:lid,korean:'동료',romanization:'dongnyeo',meaning:'colleague',sort_order:14},
  {lesson_id:lid,korean:'명함',romanization:'myeongham',meaning:'business card',sort_order:15},
  {lesson_id:lid,korean:'어디서 오셨어요?',romanization:'eodiseo osyeosseoyo?',meaning:'Where are you from?',sort_order:16},
  {lesson_id:lid,korean:'직업',romanization:'jigeop',meaning:'job / occupation',sort_order:17},
  {lesson_id:lid,korean:'눈이 마주치다',romanization:'nuni majuchida',meaning:'eyes to meet (classic K-drama moment)',sort_order:18},
  {lesson_id:lid,korean:'운명',romanization:'unmyeong',meaning:'fate / destiny',sort_order:19},
  {lesson_id:lid,korean:'반갑습니다',romanization:'bangapseumnida',meaning:'Nice to meet you / I am glad (formal)',sort_order:20},
]);
console.log(ve ? 'Vocab ERROR: ' + ve.message : 'Vocab ✓');

const { error: ge } = await supabase.from('lesson_grammar').insert([
  {lesson_id:lid,title:'Formal "to be": ~입니다 / ~예요/이에요',structure:'[Noun] + 입니다 (formal) / 예요/이에요 (polite)',explanation:'Use ~입니다 in presentations and formal first meetings. Use ~예요 (after vowel) or ~이에요 (after consonant) in everyday polite speech.',examples:[{korean:'저는 수진입니다.',english:'I am Sujin. (formal)'},{korean:'저는 수진이에요.',english:'I am Sujin. (polite)'},{korean:'학생입니다.',english:'I am a student. (formal)'}],sort_order:1},
  {lesson_id:lid,title:'Self-introduction: ~(이)라고 합니다',structure:'[Name/Title] + (이)라고 합니다',explanation:'A common and natural way to introduce yourself by name in Korean. Use 라고 after a vowel, 이라고 after a consonant.',examples:[{korean:'수진이라고 합니다.',english:'I am called Sujin.'},{korean:'민준이라고 합니다.',english:'I am called Minjun.'},{korean:'선생님이라고 합니다.',english:'I am called Teacher.'}],sort_order:2},
  {lesson_id:lid,title:'Formality levels of "Nice to meet you"',structure:'처음 뵙겠습니다 > 만나서 반갑습니다 > 반가워요 > 반가워',explanation:'Korean has four levels here: very formal (meeting elders/bosses), formal, polite, and casual. In K-Dramas, characters often switch levels to signal their relationship.',examples:[{korean:'처음 뵙겠습니다.',english:'(Very formal — first meeting a superior)'},{korean:'만나서 반갑습니다.',english:'(Formal — standard first introduction)'},{korean:'반가워요.',english:'(Polite — meeting a peer)'},{korean:'반가워!',english:'(Casual — meeting a friend)'}],sort_order:3},
]);
console.log(ge ? 'Grammar ERROR: ' + ge.message : 'Grammar ✓');

const { error: de } = await supabase.from('lesson_dialogues').insert([
  {lesson_id:lid,speaker:'수진',korean:'실례합니다. 저 오늘부터 여기서 일하게 된 김수진입니다.',romanization:'Sillyehamnida. Jeo oneulbuteo yeogiseo ilhage doen Kim Sujinimnida.',english:'Excuse me. I am Kim Sujin, starting work here from today.',sort_order:1},
  {lesson_id:lid,speaker:'민준',korean:'아, 처음 뵙겠습니다! 저는 이민준이라고 합니다.',romanization:'A, cheoeum boepgesseumnida! Jeoneun Lee Minjunirado hamnida.',english:'Oh, nice to meet you for the first time! I am called Lee Minjun.',sort_order:2},
  {lesson_id:lid,speaker:'수진',korean:'만나서 정말 반갑습니다, 이민준 선배님.',romanization:'Mannaseo jeongmal bangapseumnida, Lee Minjun seonbaenim.',english:'I am really pleased to meet you, Senior Lee Minjun.',sort_order:3},
  {lesson_id:lid,speaker:'민준',korean:'저도 반갑습니다. 혹시 명함 있으세요?',romanization:'Jeodo bangapseumnida. Hoksi myeongham isseuseyo?',english:'I am glad to meet you too. Do you have a business card, by any chance?',sort_order:4},
  {lesson_id:lid,speaker:'수진',korean:'네, 여기 있습니다. 잘 부탁드립니다.',romanization:'Ne, yeogi itseumnida. Jal butakdeurimnida.',english:'Yes, here it is. Please take good care of me.',sort_order:5},
  {lesson_id:lid,speaker:'민준',korean:'저도 잘 부탁드려요. 어디서 오셨어요?',romanization:'Jeodo jal butakdeuryeoyo. Eodiseo osyeosseoyo?',english:'Please take care of me too. Where are you from?',sort_order:6},
  {lesson_id:lid,speaker:'수진',korean:'부산에서 왔어요. 서울은 처음이에요.',romanization:'Busaneseo wasseoyo. Seoureun cheoeumieoyo.',english:'I came from Busan. It is my first time in Seoul.',sort_order:7},
  {lesson_id:lid,speaker:'민준',korean:'그렇군요. 앞으로 잘 지내요!',romanization:'Geureokkunyo. Apeureo jal jinaeyo!',english:'Is that so. Let us get along well from now on!',sort_order:8},
  {lesson_id:lid,speaker:'수진',korean:'감사합니다, 선배님. 저도 열심히 하겠습니다.',romanization:'Gamsahamnida, seonbaenim. Jeodo yeolsimhi hagetseumnida.',english:'Thank you, Senior. I will work hard too.',sort_order:9},
]);
console.log(de ? 'Dialogue ERROR: ' + de.message : 'Dialogue ✓');

const { error: ee } = await supabase.from('lesson_exercises').insert([
  {lesson_id:lid,question:'Which phrase is the MOST formal way to say "Nice to meet you"?',options:['반가워!','만나서 반갑습니다','처음 뵙겠습니다','반가워요'],correct_index:2,explanation:'처음 뵙겠습니다 is the most formal — used when meeting superiors or elders for the first time.',sort_order:1},
  {lesson_id:lid,question:'What does 잘 부탁드립니다 mean?',options:['See you later','Thank you very much','Please take care of me','Nice to meet you'],correct_index:2,explanation:'잘 부탁드립니다 is a set phrase — "Please take good care of me / I am in your hands."',sort_order:2},
  {lesson_id:lid,question:'How do you say "I am Kim Sujin" using the most natural self-introduction form?',options:['김수진 있습니다','김수진이라고 합니다','김수진 해요','김수진 입어요'],correct_index:1,explanation:'~(이)라고 합니다 means "I am called ~" — the most natural way to introduce yourself.',sort_order:3},
  {lesson_id:lid,question:'What is 선배 in a Korean workplace?',options:['A junior colleague','A manager','A senior colleague','A client'],correct_index:2,explanation:'선배 is someone who joined before you — your senior. The opposite is 후배 (junior).',sort_order:4},
  {lesson_id:lid,question:'Which word means "business card" in Korean?',options:['이름','명함','직업','성함'],correct_index:1,explanation:'명함 is a business card. Exchanging 명함 is an important part of Korean business first meetings.',sort_order:5},
]);
console.log(ee ? 'Exercises ERROR: ' + ee.message : 'Exercises ✓');

const { error: re } = await supabase.from('lesson_reading').insert([
  {lesson_id:lid,korean_text:'한국에서는 처음 만나는 사람에게 인사를 잘 하는 것이 매우 중요하다. 특히 직장이나 학교에서 처음 만날 때는 "처음 뵙겠습니다"나 "만나서 반갑습니다"와 같은 정중한 인사를 사용한다.\n\n한국 드라마에서도 첫 만남 장면은 항상 중요한 역할을 한다. 주인공들이 눈이 마주치는 순간, 운명적인 만남이 시작되는 것이다. 명함을 교환하거나 서로 이름을 소개하는 장면은 한국 직장 드라마에서 자주 볼 수 있다.\n\n한국 문화에서는 처음 만날 때 나이나 직업을 물어보는 것이 자연스럽다. 이것은 상대방을 어떻게 부를지 결정하기 위해서이다. 한국어는 높임말과 낮춤말이 있기 때문에, 상대방과의 관계를 먼저 파악하는 것이 중요하다.',english_text:'In Korea, greeting someone you meet for the first time properly is very important. Especially in the workplace or at school, formal greetings such as "처음 뵙겠습니다" (Nice to meet you for the first time) or "만나서 반갑습니다" (Nice to meet you) are used.\n\nIn Korean dramas, the first-meeting scene always plays an important role. The moment the main characters eyes meet, a fateful encounter begins. Scenes where business cards are exchanged or names are introduced are often seen in Korean workplace dramas.\n\nIn Korean culture, it is natural to ask about someones age or job when you first meet them. This is to decide how to address the other person. Since Korean has polite and casual speech levels, it is important to first understand your relationship with the other person.',sort_order:1},
]);
console.log(re ? 'Reading ERROR: ' + re.message : 'Reading ✓');

console.log('\nAll done!');
