/**
 * The book conversations a QR code in the printed book points at.
 *
 * A printed QR can never be changed, so every code here is a short, stable
 * Klovers path — /c/b2-1 — and this file decides what that code shows. Move
 * the audio, rename a bucket, switch provider: the printed books keep working.
 *
 * Audio is one MP3 per line, not one file per conversation, so a learner can
 * replay a single line. `conversation-audio` writes them to
 * marketing-images/conversations/<code>/<index>.mp3 and the page falls back to
 * the browser's own Korean voice for any line that has no file yet.
 */
export type ConversationLine = {
  /** Speaker name as the book prints it (Korean). */
  who: string;
  ko: string;
  ar: string;
};

export type Conversation = {
  /** The code in the printed QR — /c/<code>. Never reuse or renumber these. */
  code: string;
  book: string;
  lesson: number;
  title: string;
  lines: ConversationLine[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    "code": "b2-1",
    "book": "المستوى الثاني — مقهى المحادثة",
    "lesson": 1,
    "title": "في المقهى",
    "lines": [
      {
        "who": "민수",
        "ko": "어서 오세요. 처음 오시는 분이세요?",
        "ar": "أهلًا بكم. هل هذه أوّل زيارة لكم؟"
      },
      {
        "who": "리나",
        "ko": "네, 여기가 요즘 유명한 카페예요?",
        "ar": "نعم، هل هذا هو المقهى المشهور هذه الأيام؟"
      },
      {
        "who": "민수",
        "ko": "맞아요. 제가 매일 만드는 빵이 제일 인기가 많아요.",
        "ar": "صحيح. الخبز الذي أصنعه يوميًا هو الأكثر رواجًا."
      },
      {
        "who": "아담",
        "ko": "어제 먹은 빵이 정말 맛있었어요.",
        "ar": "الخبز الذي أُكل أمس كان لذيذًا حقًّا."
      },
      {
        "who": "리나",
        "ko": "아담 씨, 지금 읽는 책이 뭐예요?",
        "ar": "آدم، ما الكتاب الذي يُقرأ الآن؟"
      },
      {
        "who": "아담",
        "ko": "한국어를 배우는 학생을 위한 책이에요.",
        "ar": "كتاب للطلاب الذين يتعلّمون الكوريّة."
      },
      {
        "who": "민수",
        "ko": "좋은 책이네요. 그럼 맛있는 커피를 준비할게요.",
        "ar": "كتاب جيّد. إذن سأحضّر قهوة لذيذة."
      }
    ]
  },
  {
    "code": "b2-2",
    "book": "المستوى الثاني — مقهى المحادثة",
    "lesson": 2,
    "title": "خطة العطلة",
    "lines": [
      {
        "who": "리나",
        "ko": "아담 씨, 주말에 뭐 할 거예요?",
        "ar": "آدم، ماذا ستفعل في عطلة الأسبوع؟"
      },
      {
        "who": "아담",
        "ko": "아직 계획이 없어요. 리나 씨는요?",
        "ar": "لا خطّة بعد. وأنتِ يا لينا؟"
      },
      {
        "who": "리나",
        "ko": "저는 경주에 갈 거예요. 같이 갈 사람을 찾고 있어요.",
        "ar": "سأذهب إلى كيونغجو. وأبحث عن شخص يذهب معي."
      },
      {
        "who": "아담",
        "ko": "표가 있으면 저도 가고 싶어요.",
        "ar": "إن توفّرت تذكرة فأودّ الذهاب أيضًا."
      },
      {
        "who": "리나",
        "ko": "오늘 예약하면 표가 있어요.",
        "ar": "بالحجز اليوم تتوفّر التذاكر."
      },
      {
        "who": "민수",
        "ko": "경주에 가면 이 카페에 꼭 가 보세요. 제 친구 가게예요.",
        "ar": "عند الذهاب إلى كيونغجو، زوروا هذا المقهى حتمًا. إنه متجر صديقي."
      },
      {
        "who": "아담",
        "ko": "좋아요! 그럼 오늘 저녁에 준비할 것을 같이 정해요.",
        "ar": "رائع! إذن لنحدّد مساء اليوم ما سنحضّره."
      }
    ]
  },
  {
    "code": "b2-3",
    "book": "المستوى الثاني — مقهى المحادثة",
    "lesson": 3,
    "title": "لماذا تأخّرت؟",
    "lines": [
      {
        "who": "민수",
        "ko": "아담 씨, 왜 늦었어요?",
        "ar": "آدم، لماذا كان التأخّر؟"
      },
      {
        "who": "아담",
        "ko": "길이 많이 막혔기 때문에 늦었어요. 미안해요.",
        "ar": "التأخّر بسبب الازدحام الشديد. أعتذر."
      },
      {
        "who": "리나",
        "ko": "괜찮아요. 저도 방금 왔어요.",
        "ar": "لا بأس. الوصول كان للتوّ أيضًا."
      },
      {
        "who": "민수",
        "ko": "오늘은 사람이 많으니까 저기 조용한 자리에 앉으세요.",
        "ar": "لكثرة الناس اليوم، الجلوس في ذلك المقعد الهادئ أفضل."
      },
      {
        "who": "리나",
        "ko": "아담 씨, 배고프니까 먼저 주문할까요?",
        "ar": "آدم، بسبب الجوع، هل نطلب أوّلًا؟"
      },
      {
        "who": "아담",
        "ko": "좋아요. 이 카페는 빵이 유명하기 때문에 꼭 먹어 보고 싶어요.",
        "ar": "حسنًا. لشهرة خبز هذا المقهى أودّ تذوّقه حتمًا."
      }
    ]
  },
  {
    "code": "b2-4",
    "book": "المستوى الثاني — مقهى المحادثة",
    "lesson": 4,
    "title": "ترتيب اليوم",
    "lines": [
      {
        "who": "리나",
        "ko": "아담 씨, 보통 아침에 뭐 해요?",
        "ar": "آدم، ماذا يحدث عادةً في الصباح؟"
      },
      {
        "who": "아담",
        "ko": "일어난 후에 먼저 샤워를 해요. 그리고 아침을 먹어요.",
        "ar": "بعد الاستيقاظ يأتي الاستحمام أوّلًا. ثم الفطور."
      },
      {
        "who": "리나",
        "ko": "저는 아침을 먹기 전에 운동을 해요.",
        "ar": "أمّا أنا فالرياضة قبل الفطور."
      },
      {
        "who": "민수",
        "ko": "저는 카페 문을 열기 전에 청소를 해요.",
        "ar": "وأنا التنظيف قبل فتح باب المقهى."
      },
      {
        "who": "아담",
        "ko": "오늘은 수업이 끝난 후에 뭐 할 거예요?",
        "ar": "وماذا سيحدث اليوم بعد انتهاء الدرس؟"
      },
      {
        "who": "리나",
        "ko": "집에 돌아온 후에 요리할 거예요. 같이 먹을래요?",
        "ar": "الطهو بعد العودة إلى البيت. هل تأكلان معي؟"
      }
    ]
  },
  {
    "code": "b2-5",
    "book": "المستوى الثاني — مقهى المحادثة",
    "lesson": 5,
    "title": "في المقهى وقت المطر",
    "lines": [
      {
        "who": "민수",
        "ko": "밖에 갑자기 비가 와요. 잠깐 여기에서 쉬세요.",
        "ar": "نزل المطر فجأة في الخارج. استريحوا هنا قليلًا."
      },
      {
        "who": "아담",
        "ko": "저는 비가 올 때 이 카페에 자주 와요.",
        "ar": "المجيء إلى هذا المقهى كثير وقت المطر."
      },
      {
        "who": "리나",
        "ko": "저도요. 혼자 있을 때는 여기에서 책을 읽어요.",
        "ar": "وأنا كذلك. وقت الوحدة تكون القراءة هنا."
      },
      {
        "who": "민수",
        "ko": "제가 커피를 만드는 동안 자리에 앉아 계세요.",
        "ar": "الجلوس في الأماكن أثناء تحضير القهوة."
      },
      {
        "who": "아담",
        "ko": "리나 씨, 어렸을 때 꿈이 뭐였어요?",
        "ar": "لينا، ما كان الحلم وقت الطفولة؟"
      },
      {
        "who": "리나",
        "ko": "선생님이었어요. 그래서 방학 동안 아이들을 가르쳤어요.",
        "ar": "أن أصير معلّمة. لذلك كان تعليم الأطفال أثناء العطلة."
      }
    ]
  }
];

export function findConversation(code: string | undefined) {
  if (!code) return undefined;
  return CONVERSATIONS.find((c) => c.code === code.toLowerCase());
}

/** One OpenAI voice per character, so the three speakers stay apart. */
export const VOICE_BY_SPEAKER: Record<string, string> = {
  "민수": "onyx",  // Minsu, the barista — the deepest of the three
  "아담": "echo",  // Adam — male, lighter, clearly not Minsu
  "리나": "nova",  // Lina — female
};
